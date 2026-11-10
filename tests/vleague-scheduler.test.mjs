import test from 'node:test';
import assert from 'node:assert/strict';
import {tick,inWindow,publicHealth,publisherRun,END} from '../infra/vleague-scheduler/scheduler.mjs';
import worker,{VLeagueCoordinator} from '../infra/vleague-scheduler/worker.mjs';
const now=Date.parse('2026-11-06T10:43:00Z'),env={KVL_SCHEDULER_APPROVED:'true',KVL_NOTIFICATIONS_APPROVED:'true',GITHUB_TOKEN:'TEST_ONLY_NOT_A_SECRET'};
const run=(age=0,extra={})=>({id:123,head_branch:'main',event:'schedule',created_at:new Date(now-age*60000).toISOString(),status:'completed',conclusion:'success',...extra});
const feeds=age=>['men','women'].map((g,i)=>({matches:Array.from({length:126},(_,n)=>({id:g+n,date:n?'2026-12-01':'2026-11-06',time:'19:00',status:'live',liveScore:{observedAt:new Date(now-age*60000).toISOString()}}))}));
function memory(){const map=new Map();return {get:async k=>map.get(k),put:async(k,v)=>map.set(k,v),delete:async k=>map.delete(k),map};}
function fake({runs=[run()],age=0,dispatchFails=false,comments=[]}={}){const calls=[];const fetcher=async(url,options={})=>{calls.push({url,options});if(url.startsWith('https://kvolleylab.com')){assert(!options.headers?.Authorization);return Response.json(feeds(age)[url.includes('-men-')?0:1]);}assert(url.startsWith('https://api.github.com/repos/kvolleylab/kvolleylab/'));assert.equal(options.headers.Authorization,'Bearer '+env.GITHUB_TOKEN);if(url.includes('/runs?'))return Response.json({workflow_runs:runs});if(url.endsWith('/dispatches')){if(dispatchFails)throw Error('ambiguous response');return new Response(null,{status:204});}if(url.includes('/comments')){if(options.method==='POST'){comments.push(JSON.parse(options.body));return Response.json({id:1});}return Response.json(comments);}throw Error('Unexpected endpoint');};return {fetcher,calls,comments};}
test('approval, season and hour gates prevent any request',async()=>{for(const [e,t] of [[{...env,KVL_SCHEDULER_APPROVED:'false'},now],[env,END],[env,Date.parse('2026-11-05T17:00:00Z')]]){const f=fake();assert.equal((await tick(e,memory(),t,f.fetcher)).status,'INACTIVE');assert.equal(f.calls.length,0);}assert(inWindow(Date.parse('2026-11-06T00:17:00Z')));});
test('active native publisher and recent native trigger prevent duplicate dispatch',async()=>{for(const r of [run(1),run(25,{status:'in_progress',conclusion:null})]){const f=fake({runs:[r]});assert.equal((await tick(env,memory(),now,f.fetcher)).dispatched,false);assert(!f.calls.some(c=>c.url.endsWith('/dispatches')));}});
test('missing schedule dispatches match-only through existing workflow, once per 15 minutes',async()=>{const f=fake({runs:[run(31)]}),store=memory();const first=await tick(env,store,now,f.fetcher);assert(first.dispatched);assert(first.problems.some(p=>p.reason==='PUBLISHER_SCHEDULE_GAP'));await tick(env,store,now+5*60000,f.fetcher);assert.equal(f.calls.filter(c=>c.url.endsWith('/dispatches')).length,1);assert.deepEqual(JSON.parse(f.calls.find(c=>c.url.endsWith('/dispatches')).options.body),{ref:'main',inputs:{publish:true,match_only:true}});assert.equal(f.comments.length,1);});
test('ambiguous dispatch response records intent and waits rather than re-dispatching',async()=>{const f=fake({runs:[run(16)],dispatchFails:true}),store=memory();assert((await tick(env,store,now,f.fetcher)).problems.some(p=>p.reason==='DISPATCH_NOT_CONFIRMED'));await tick(env,store,now+60000,f.fetcher);assert.equal(f.calls.filter(c=>c.url.endsWith('/dispatches')).length,1);});
test('public stale observations alert once and recovery alerts once, sanitized',async()=>{const store=memory(),comments=[];const stale=fake({age:30,comments});await tick(env,store,now,stale.fetcher);await tick(env,store,now,stale.fetcher);assert.equal(comments.length,1);assert(comments[0].body.includes('LIVE_OBSERVATION_STALE'));assert(!comments[0].body.includes(env.GITHUB_TOKEN));const fresh=fake({comments});await tick(env,store,now,fresh.fetcher);await tick(env,store,now,fresh.fetcher);assert.equal(comments.length,2);assert(comments[1].body.includes('해소'));});
test('comment readback avoids duplication after accepted comment loses response',async()=>{const store=memory(),f=fake({age:30});let once=true;const fetcher=async(u,o)=>{const r=await f.fetcher(u,o);if(u.endsWith('/comments')&&o.method==='POST'&&once){once=false;throw Error('timeout after write');}return r;};await assert.rejects(tick(env,store,now,fetcher));await tick(env,store,now+5*60000,fetcher);assert.equal(f.comments.length,1);assert.equal((await store.get('incident')).open,true);});
test('validation runs are not publisher evidence; stale or invalid public feeds fail closed',()=>{assert(!publisherRun(run(0,{event:'pull_request'})));assert(!publisherRun(run(0,{event:'workflow_dispatch',display_title:'V-League validation'})));assert(publisherRun(run(0,{event:'workflow_dispatch',display_title:'V-League live publisher'})));assert.equal(publicHealth(feeds(29),now).length,0);assert.equal(publicHealth(feeds(30),now).length,2);assert.throws(()=>publicHealth([{}],now));});
test('health endpoint cannot invoke mutation; durable lease rejects overlap',async()=>{let calls=0;const binding={idFromName:()=>1,get:()=>({fetch:async()=>{calls++;return Response.json({status:'CHECKED'})}})};for(const method of ['POST','PUT'])assert.equal((await worker.fetch(new Request('https://worker/health',{method}),{COORDINATOR:binding})).status,404);assert.equal(calls,0);const store=memory();await store.put('leaseUntil',Date.now()+120000);const coordinator=new VLeagueCoordinator({storage:store,blockConcurrencyWhile:fn=>fn()},env);assert.equal((await (await coordinator.fetch(new Request('https://internal/tick'))).json()).status,'ALREADY_RUNNING');});

test('recovery immediately after an ambiguous alert also emits the recovery',async()=>{const store=memory(),comments=[],stale=fake({age:30,comments});let once=true;const fetcher=async(u,o)=>{const r=await stale.fetcher(u,o);if(u.endsWith('/comments')&&o.method==='POST'&&once){once=false;throw Error('timeout after write');}return r;};await assert.rejects(tick(env,store,now,fetcher));const fresh=fake({comments});await tick(env,store,now+60000,fresh.fetcher);assert.equal(comments.length,2);assert(comments[1].body.includes('해소'));assert.equal((await store.get('incident')).open,false);});

test('unresolved previous-day matches remain unhealthy while unused fixtures are excluded',()=>{const rows=feeds(31);for(const f of rows){f.matches[0].date='2026-11-05';f.matches[0].liveScore.observedAt='2026-11-05T10:00:00Z';}assert.equal(publicHealth(rows,now).length,2);for(const f of rows)f.matches[0].notRequired=true;assert.equal(publicHealth(rows,now).length,0);});

test('fixture metadata writes cannot reset the missing-live observation deadline',()=>{
 const rows=feeds(0);for(const f of rows){const m=f.matches[0];m.status='scheduled';delete m.liveScore;m.updatedAt=new Date(now).toISOString();}
 const start=Date.parse('2026-11-06T19:00:00+09:00');
 assert.equal(publicHealth(rows,start+29*60000).length,0);
 const problems=publicHealth(rows,start+30*60000);assert.equal(problems.length,2);
 assert(problems.every(p=>p.reason==='STARTED_MATCH_UNOBSERVED'&&p.observedAt===null));
 for(const f of rows)f.matches[0].status='live';
 assert(publicHealth(rows,now).every(p=>p.reason==='LIVE_OBSERVATION_STALE'&&p.observedAt===null));
});

test('all requests use Workers-compatible manual redirects',async()=>{
 const f=fake({runs:[run(31)]}); await tick(env,memory(),now,f.fetcher);
 assert(f.calls.length>=5); assert(f.calls.every(c=>c.options.redirect==='manual'));
});
test('redirect responses fail closed without contacting Location',async()=>{
 const calls=[];
 await assert.rejects(tick(env,memory(),now,async(u,o)=>{
  calls.push({u,o});return new Response(null,{status:302,headers:{Location:'https://untrusted.invalid/'}});
 }),e=>e.message==='REDIRECT_REJECTED');
 assert.equal(calls.length,1);assert.equal(calls[0].o.redirect,'manual');
});
test('failure diagnostics exclude token, response body and raw exceptions',async()=>{
 const {failureDetails}=await import('../infra/vleague-scheduler/scheduler.mjs');
 for(const status of [401,403,429,500]){
  try{await tick(env,memory(),now,async()=>new Response(env.GITHUB_TOKEN,{status}));assert.fail();}
  catch(e){assert.deepEqual(failureDetails(e),{stage:'GITHUB_RUNS',reason:'HTTP_ERROR',httpStatus:status});}
 }
 try{await tick(env,memory(),now,async()=>{throw Error(env.GITHUB_TOKEN);});assert.fail();}
 catch(e){assert.deepEqual(failureDetails(e),{stage:'GITHUB_RUNS',reason:'REQUEST_FAILED',httpStatus:null});}
 assert.equal(JSON.stringify(failureDetails(Error(env.GITHUB_TOKEN))).includes(env.GITHUB_TOKEN),false);
});

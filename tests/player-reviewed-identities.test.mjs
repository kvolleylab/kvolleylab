import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM,VirtualConsole}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(new URL('..',import.meta.url).pathname),base='8c4327c9669f2c251be16c8d0fe596168159bf6b';
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const original=f=>execFileSync('git',['show',`${base}:${f}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
const approved=json('docs/validation/player-identity-20261024/approved.json').corrections,byId=new Map(approved.map(x=>[x.player_id,x]));
const expected={'KVL-P-000083':'옹민혁','KVL-P-000050':'염시원','KVL-P-000107':'전유석','KVL-P-000192':'장승호','KVL-P-000034':'송건환','KVL-P-001462':'이소민'};
async function app(source=read){
 const dom=new JSDOM(read('players.html'),{url:'https://kvolleylab.com/players.html',runScripts:'outside-only',virtualConsole:new VirtualConsole()}),w=dom.window;
 w.Blob=Blob;w.Response=Response;w.DecompressionStream=DecompressionStream;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.fetch=async input=>{const f=new URL(typeof input==='string'?input:input.url,w.location.href).pathname.slice(1);try{return new Response(source(f),{status:200})}catch{return new Response('',{status:404})}};
 for(const f of ['player-school-master-v2.js','player-school-master-compat-v2.js','player-search-v2.js'])w.eval(read('assets/js/'+f));
 const catalog=JSON.parse(JSON.stringify(await w.KVLPlayerCatalogReady)),modules=new Map();
 async function module(f){if(modules.has(f))return modules.get(f);const m=new vm.SourceTextModule(read(f),{context:dom.getInternalVMContext(),identifier:f});modules.set(f,m);await m.link((s,r)=>module(path.posix.normalize(path.posix.join(path.posix.dirname(r.identifier),s))));return m}
 return {w,d:w.document,catalog,async run(f){await(await module(f)).evaluate()},close(){w.close()}};
}
test('six owner-reviewed names use the exact existing IDs and affiliations',()=>{
 assert.deepEqual(Object.fromEntries(approved.map(x=>[x.player_id,x.after])),expected);
 assert.deepEqual(approved.map(x=>x.school),['경일대학교','경희대학교','중부대학교','충남대학교','홍익대학교','광주여자대학교']);
 const old=JSON.parse(original('data/changelog/player_corrections_v1.json')),current=json('data/changelog/player_corrections_v1.json');
 assert.deepEqual(current.slice(0,old.length),old);assert.equal(current.length-old.length,6);
 for(const c of approved){const entry=current.find(x=>x.player_id===c.player_id&&x.changed_at==='2026-10-24');assert.equal(entry.before,c.before);assert.equal(entry.after,c.after);assert.equal(entry.review_status,'approved_by_project_owner');assert.equal(entry.source_urls.length,2)}
});
test('all active source records retain every field except six names and explicit review timestamps',()=>{
 for(const f of ['data/master/player_master.json','data/master/player_master_229_v2.json']){
  const before=JSON.parse(original(f)),after=json(f);assert.equal(after.length,before.length);
  for(let i=0;i<before.length;i++){const b=before[i],a=structuredClone(after[i]),c=byId.get(b.system.player_id);if(c){assert.equal(a.identity.name_ko,c.after);assert.equal(a.system.updated_at,'2026-10-24');a.identity.name_ko=b.identity.name_ko;if('name_native'in b.identity){assert.equal(a.identity.name_native,c.after);a.identity.name_native=b.identity.name_native}a.system.updated_at=b.system.updated_at}assert.deepEqual(a,b,`${f} ${i}`)}
 }
 for(const f of ['data/domestic/university-u-league-women-2026.json','data/domestic/university-danyang-women-2026.json']){
  const before=JSON.parse(original(f)),after=json(f);assert.equal(after.players.length,before.players.length);for(let i=0;i<before.players.length;i++){const b=before.players[i],a=after.players[i];if(b.id==='KVL-P-001462'){assert.equal(a.name,'이소민');a.name=b.name}}assert.deepEqual(after,before,f)
 }
 for(const f of ['data/competitions/university-league-men-2026/rosters.json','data/competitions/university-league-women-2026/rosters.json']){
  const before=JSON.parse(original(f)),after=json(f);for(const [team,g]of Object.entries(before)){for(let i=0;i<(g.players||[]).length;i++){const b=g.players[i],a=after[team].players[i],c=byId.get(b.playerId);if(c){assert.equal(a.name,c.after);assert.equal(a.en,c.after);a.name=b.name;a.en=b.en}}}assert.deepEqual(after,before,f)
 }
});
test('only six reviewed applicant links change; original 99 links and remaining 12 holds are retained',()=>{
 const f='data/draft-applicants/2026-27/player-links.json',before=JSON.parse(original(f)),after=json(f),byApplicant=new Map(approved.map(c=>[c.applicant_id,c]));
 assert.equal(after.links.length,before.links.length);let changed=0;
 for(let i=0;i<before.links.length;i++){const b=before.links[i],a=after.links[i],c=byApplicant.get(b.applicant_id);if(!c){assert.deepEqual(a,b);continue}changed++;assert.notEqual(b.status,'matched');assert.equal(a.status,'matched');assert.equal(a.player_id,c.player_id);assert.equal(a.profile_verified,true);assert.ok(a.evidence.some(e=>e.rule==='name_birth_date'&&e.master_checked));assert.ok(a.evidence.some(e=>e.reviewer==='project_owner'))}
 assert.equal(changed,6);const linked=after.links.filter(x=>x.status==='matched');assert.equal(linked.length,105);assert.equal(new Set(linked.map(x=>x.player_id)).size,105);assert.equal(after.links.filter(x=>x.status!=='matched').length,12);
 for(const f of ['data/draft-applicants/2026-27/applicants.json','data/draft-applicants/2026-27/results.json'])assert.equal(read(f),original(f));
});
test('actual combined catalog changes exactly six names and preserves all 1842 IDs and other identity/history fields',async()=>{
 const b=await app(original),a=await app();try{
  assert.equal(a.catalog.length,1842);assert.equal(new Set(a.catalog.map(p=>p.playerId)).size,1842);assert.equal(a.catalog.length,b.catalog.length);let changed=0;
  for(let i=0;i<b.catalog.length;i++){const old=b.catalog[i],now=structuredClone(a.catalog[i]),c=byId.get(old.playerId);if(c){assert.equal(old.nameKo,c.before);assert.equal(now.nameKo,c.after);assert.equal(now.school,c.school);now.nameKo=old.nameKo;changed++}assert.deepEqual(now,old,old.playerId)}assert.equal(changed,6);
 }finally{a.close();b.close()}
});
test('approved names remain searchable by school and official-draft filter with canonical profile URLs',async()=>{
 const a=await app();try{await a.run('assets/js/player-workspace-v1.mjs');const change=(selector,value,type='change')=>{const e=a.d.querySelector(selector);e.value=value;e.dispatchEvent(new a.w.Event(type,{bubbles:true}))};
  change('[name="level"]','university');change('#draftSeason','2026-27');
  for(const c of approved){change('#schoolFilter',c.school);change('#playerSearch',c.after,'input');await new Promise(r=>setTimeout(r,220));assert.match(a.d.querySelector('#resultCount').textContent,/1명/);const profile=a.d.querySelector('[data-profile]');assert.equal(new URL(profile.href).searchParams.get('id'),c.player_id);assert.ok(profile.textContent||a.d.body.textContent.includes(c.after))}
 }finally{a.close()}
});
test('unrelated namesakes, rejected candidate IDs and historical source snapshots are untouched',async()=>{
 const a=await app();try{
  for(const [id,name]of [['KVL-P-000188','김관응'],['KVL-P-000753','이소민'],['KVL-P-000049','이수민'],['KVL-P-000131','이수민']])assert.equal(a.catalog.find(x=>x.playerId===id)?.nameKo,name);
  const links=json('data/draft-applicants/2026-27/player-links.json').links;
  assert.ok(!approved.some(c=>['KVL-P-000188','KVL-P-000753'].includes(c.player_id)));
  for(const c of approved)assert.equal(links.find(x=>x.applicant_id===c.applicant_id).player_id,c.player_id);
  for(const f of ['data/master/player_master_229_v1.json','data/national/player_id_links_v1.json','data/national/national_team_history_v1.json','data/timeline/player_timeline_v1.json'])assert.equal(read(f),original(f));
 }finally{a.close()}
});

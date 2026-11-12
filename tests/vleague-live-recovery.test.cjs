'use strict';
// Synthetic sequential observations test rendering; they are NOT live match evidence.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const api=require('../assets/js/kvl-competition-data-v2.js'),config=require('../assets/js/kvl-competition-config-v2.js');
const start=Date.parse('2026-11-06T10:43:00Z');
function fixtures(){const feeds={},configs={};for(const gender of ['men','women']){const base=`data/competitions/v-league-${gender}-2026-27/`;feeds[gender]=json(base+'data.json');configs[gender]=json(base+'config.json');const m=feeds[gender].matches.find(m=>m.date==='2026-11-06');delete m.score;delete m.scoreVerification;m.status='live';m.officialSourceKey=`023:001:${gender==='men'?'MALE':'FEMALE'}:11`;m.source='https://user-api.kovo.co.kr/stat/game-schedule?gender='+(gender==='men'?1:2);m.liveScore={home:gender==='men'?0:1,away:gender==='men'?1:0,sourceKey:m.officialSourceKey,observedAt:new Date(start).toISOString()};m.liveSets=[{home:gender==='men'?21:25,away:gender==='men'?25:20,status:'completed'}];}return {feeds,configs};}
async function setup(gender='men',home=false,failInitial=false,missing=false){
 const {feeds,configs}=fixtures(),html=home?read('index.html'):'<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>';
 if(missing)for(const feed of Object.values(feeds)){const m=feed.matches.find(m=>m.date==='2026-11-06');m.status='scheduled';delete m.liveScore;delete m.liveSets;}
 const dom=new JSDOM(html,{url:home?'https://kvolleylab.com/':`https://kvolleylab.com/competition-engine.html?competition=v-league-${gender}-2026-27&view=overview`,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let now=start,fail=failInitial;const timers=[],requests=[],errors=[];w.Date.now=()=>now;w.setInterval=(fn,ms)=>{timers.push({fn,ms});return timers.length};w.CSS={escape:s=>s};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.addEventListener('error',e=>errors.push(e.error));
 w.fetch=async(input,options)=>{const u=new URL(input,w.location.href);requests.push({url:u,options});if(fail)throw Error('network unavailable');const g=u.pathname.includes('-women-')?'women':'men',value=u.pathname.endsWith('config.json')?configs[g]:u.pathname.includes('v-league-')?feeds[g]:{matches:[],participants:[]};return {ok:true,json:async()=>structuredClone(value)};};
 let d;
 if(home){w.eval(read('assets/js/kvl-competition-data-v2.js'));const script=[...w.document.scripts].find(s=>s.textContent.includes('function matchCard(record,recent)'));assert(script);w.eval(script.textContent);await new Promise(r=>setImmediate(r));}
 else{w.KVL_COMPETITION_PAGE_V2={deferRender:true,production:true,collectionRoot:'/data/competitions/'};for(const name of ['config','data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));d=api.normalize(config.assemble(configs[gender],feeds[gender],{slug:configs[gender].slug,canonical:w.location.href}));d.rosters={KEEP:{players:[{id:'immutable-player'}]}};w.KVL_COMPETITION_V2_DATA=d;w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();for(const name of ['kvl-calendar-display-v1','kvl-match-calendar-v1','kvl-domestic-home-v2'])w.eval(read(`assets/js/${name}.js`));w.KVLDomesticHomeV2.apply(d);await w.KVLDomesticHomeV2.matchesReady;}
 return {w,doc:w.document,d,feeds,errors,requests,setNow:value=>now=value,setFail:(value=true)=>fail=value,run:async ms=>{await Promise.all(timers.filter(t=>t.ms===ms).map(t=>t.fn()));await new Promise(r=>setImmediate(r));}};
}
test('completed set points require agreement with official live counters, with exact 30 minute expiry',()=>{
 const {feeds}=fixtures(),m=feeds.men.matches.find(m=>m.date==='2026-11-06');assert.equal(api.matchSummaryState(m,start).sets.length,1);assert.equal(api.matchSummaryState(m,start+29*60000).score.away,1);const stale=api.matchSummaryState(m,start+30*60000);assert.equal(stale.score,null);assert.equal(stale.historicalScore.away,1);assert.match(stale.detail,/19:43 KST/);
 for(const invalid of [[{home:25,away:21,status:'completed'}],[{home:21,away:24,status:'completed'}],[{home:21,away:25}],[]]){m.liveSets=invalid;const state=api.matchSummaryState(m,start);assert.equal(state.score.away,1);assert.equal(state.sets.length,0);}
});
for(const gender of ['men','women'])test(`${gender}: both summary divisions, schedule and open calendar refresh twice without replacing roster modules`,async()=>{
 const s=await setup(gender);const {w,doc,d,feeds}=s;try{
 const roster=d.rosters,ids=d.matches.map(m=>m.id);const current=()=>d.matches.find(m=>m.date==='2026-11-06');
 const score=()=>doc.querySelector(`.kvl1180-match-row[data-match-id="${current().id}"] .kvl1180-score`).textContent;
 const expected=gender==='men'?'0-1':'1-0';assert.equal(score(),expected);
 for(const g of ['men','women']){const a=doc.querySelector(`[data-summary-gender=${g}] [data-kind=next]`);assert.match(a.textContent,g==='men'?/0 : 1/:/1 : 0/);assert.match(a.textContent,/1세트/);assert.match(a.textContent,/19:43 KST/);}
 const day=doc.querySelector('[data-dv2-date="2026-11-06"]');assert.match(day.textContent,new RegExp(expected));day.click();assert.match(doc.querySelector('#dv2-day-dialog').textContent,/19:43 KST/);
 for(const [i,points] of [[1,{home:25,away:20}],[2,{home:25,away:22}]]){
   const now=start+i*15*60000;s.setNow(now);
   for(const g of ['men','women']){const m=feeds[g].matches.find(m=>m.date==='2026-11-06');m.liveScore={...m.liveScore,home:i,away:1,observedAt:new Date(now).toISOString()};const initial=g==='men'?[{home:21,away:25},{home:25,away:20}]:[{home:25,away:20},{home:21,away:25}];m.liveSets=[...initial,...(i===2?[points]:[])].map(p=>({...p,status:'completed'}));}
   await s.run(300000);assert.equal(score(),`${i}-1`);assert.match(doc.querySelector('#dv2-day-dialog').textContent,new RegExp(i===1?'19:58 KST':'20:13 KST'));assert.equal(d.rosters,roster);assert.equal(JSON.stringify(d.matches.map(m=>m.id)),JSON.stringify(ids));
 }
 assert(s.requests.every(r=>r.options.cache==='no-store'&&r.url.searchParams.has('kvlPoll')));
 s.setFail();s.setNow(start+60*60000);await s.run(300000);await s.run(60000);assert.equal(score(),'—');assert.match(doc.querySelector('#dv2-day-dialog').textContent,/갱신 지연.*당시 2 : 1/s);assert.deepEqual(s.errors,[]);
 }finally{w.close();}
});
test('home renders both first-set observations and retains only labeled historical scores after refresh fails',async()=>{
 const s=await setup('men',true);try{
 const cards=()=>[...s.doc.querySelectorAll('.home-match[data-match-id]')].filter(c=>c.dataset.matchId.endsWith('006'));
 assert.equal(cards().length,2);assert.deepEqual(cards().map(c=>c.querySelector('.match-score').textContent).sort(),['0 : 1','1 : 0']);assert(cards().every(c=>c.textContent.includes('1세트')&&c.textContent.includes('19:43 KST')));
 for(const i of [1,2]){s.setNow(start+i*15*60000);for(const g of ['men','women']){const m=s.feeds[g].matches.find(m=>m.date==='2026-11-06');m.liveScore={...m.liveScore,home:i,away:1,observedAt:new Date(start+i*15*60000).toISOString()};const pairs=g==='men'?[[21,25],[25,20]]:[[25,20],[21,25]];if(i===2)pairs.push([25,22]);m.liveSets=pairs.map(([home,away])=>({home,away,status:'completed'}));}await s.run(300000);assert(cards().every(c=>c.querySelector('.match-score').textContent===`${i} : 1`));}
 s.setNow(start+60*60000);s.setFail();await s.run(300000);await s.run(60000);assert(cards().every(c=>c.querySelector('.match-score').textContent==='—'&&c.textContent.includes('갱신 지연')&&c.textContent.includes('당시')));assert.deepEqual(s.errors,[]);
 }finally{s.w.close();}
});

test('initial peer fetch failure recovers on the next poll',async()=>{const s=await setup('men',false,true);try{assert(s.doc.querySelector('[data-summary-gender=women] .dv2-summary-error'));s.setFail(false);await s.run(300000);assert.match(s.doc.querySelector('[data-summary-gender=women] [data-kind=next]').textContent,/1 : 0/);}finally{s.w.close();}});

for(const mode of ['home','men','women'])test(`${mode}: missing first observation expires in summary, schedule and dialog without a score`,async()=>{
 const s=await setup(mode==='women'?'women':'men',mode==='home',false,true);
 try{
  const text=s.doc.querySelector(mode==='home'?'#home-matches':'.dv2-overview-matches').textContent;
  assert.equal((text.match(/최종 관측 없음/g)||[]).length,2);assert.equal((text.match(/갱신 지연/g)||[]).length,2);
  if(mode==='home')assert.equal(s.doc.querySelectorAll('.home-match[data-match-state="stale"] .set-scores').length,0);
  if(mode!=='home'){
   const row=s.doc.querySelector('.kvl1180-match-row[data-match-id$="006"]');assert.match(row.textContent,/갱신 지연.*최종 관측 없음/s);
   assert.equal(row.querySelector('.kvl1180-score').textContent,'—');
   s.doc.querySelector('[data-dv2-date="2026-11-06"]').click();assert.match(s.doc.querySelector('#dv2-day-dialog').textContent,/갱신 지연.*최종 관측 없음/s);
  }
  assert.deepEqual(s.errors,[]);
 }finally{s.w.close();}
});

for(const mode of ['home','men','women'])test(`${mode}: partial set prefix and pending end retain central score and expire safely`,async()=>{
 const s=await setup(mode==='women'?'women':'men',mode==='home');try{
 for(const g of ['men','women']){
  const m=s.feeds[g].matches.find(m=>m.date==='2026-11-06');
  m.liveScore={...m.liveScore,home:1,away:2};
 }
 await s.run(300000);
 const cards=()=>mode==='home'?[...s.doc.querySelectorAll('.home-match[data-match-id]')].filter(c=>c.dataset.matchId.endsWith('006')):[...s.doc.querySelectorAll('[data-summary-gender] [data-kind=next]')];
 assert(cards().every(c=>c.textContent.includes('1 : 2')&&c.textContent.includes('1세트')));
 for(const g of ['men','women']){
  const m=s.feeds[g].matches.find(m=>m.date==='2026-11-06');m.liveScore={...m.liveScore,home:1,away:3,finalPending:true};
 }
 await s.run(300000);
 assert(cards().every(c=>c.textContent.includes('1 : 3')&&c.textContent.includes('종료 확인 중')&&c.textContent.includes('최종 결과 미확정')));
 s.setNow(start+30*60000);await s.run(60000);
 assert(cards().every(c=>c.textContent.includes('갱신 지연')&&c.textContent.includes('당시 1 : 3')));
 assert.deepEqual(s.errors,[]);
 }finally{s.w.close();}
});

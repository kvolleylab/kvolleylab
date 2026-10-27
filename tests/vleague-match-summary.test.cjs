'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),dataApi=require('../assets/js/kvl-competition-data-v2.js');
function setup({gender='men',now='2026-10-28T03:00:00Z',edit,failPeer=false,wrongSeason=false}={}){
 const sources={},configs={};for(const g of ['men','women']){const base=`data/competitions/v-league-${g}-2026-27/`;sources[g]=json(base+'data.json');configs[g]=json(base+'config.json');if(edit)edit(sources[g],g);}
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=v-league-${gender}-2026-27&view=overview`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};const errors=[];w.addEventListener('error',e=>errors.push(e.error));w.Date.now=()=>Date.parse(now);w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.KVL_COMPETITION_PAGE_V2={deferRender:true,production:true,collectionRoot:'/data/competitions/'};
 const requests=[];w.fetch=async url=>{const u=new URL(url),g=u.pathname.includes('-women-')?'women':'men';requests.push(u.pathname);if(failPeer)throw Error('network unavailable');const value=u.pathname.endsWith('config.json')?structuredClone(configs[g]):structuredClone(sources[g]);if(wrongSeason&&value.competition)value.competition.season='2025-26';return {ok:true,json:async()=>value};};
 for(const name of ['config','data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 const d=dataApi.normalize(configApi.assemble(configs[gender],sources[gender],{slug:configs[gender].slug,canonical:w.location.href}));w.KVL_COMPETITION_V2_DATA=d;
 w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(d);
 return {w,doc:w.document,d,requests,errors,ready:w.KVLDomesticHomeV2.matchesReady};
}
const result={home:3,away:2,sets:[{home:25,away:20},{home:23,away:25},{home:26,away:24},{home:18,away:25},{home:15,away:12}]};
function game(d,id,date,time,score,extra={}){return {id,date,time,home:{code:d.participants[0].code},away:{code:d.participants[1].code},score,...extra};}
for(const gender of ['men','women'])test(gender+': both divisions, season-only empty state, real next fixtures and deep links',async()=>{
 const {w,doc,d,requests,errors,ready}=setup({gender});try{await ready;
  const cards=[...doc.querySelectorAll('[data-summary-gender]')];assert.deepEqual(cards.map(c=>c.dataset.summaryGender),['men','women']);
  assert.equal(doc.querySelectorAll('[data-kind=recent] .dv2-summary-empty').length,2);assert.equal(doc.querySelectorAll('.dv2-summary-game').length,2);
  for(const g of ['men','women']){const c=doc.querySelector(`[data-summary-gender=${g}]`),a=c.querySelector('.dv2-summary-game'),u=new URL(a.href);assert.equal(u.searchParams.get('competition'),`v-league-${g}-2026-27`);assert.equal(u.searchParams.get('view'),'schedule');assert.equal(u.searchParams.get('date'),'2026-10-31');assert.equal(c.querySelector('.dv2-summary-body').getAttribute('aria-busy'),'false');assert.match(a.textContent,g==='men'?/대한항공.*VS.*현대캐피탈/s:/GS칼텍스.*VS.*한국도로공사/s);assert.match(a.textContent,g==='men'?/14:00 KST/:/16:00 KST/);assert(!c.textContent.includes('KOVO컵'));}
  assert.equal(requests.length,2);assert(requests.every(p=>p.includes(gender==='men'?'-women-':'-men-')));
  const section=doc.querySelector('.dv2-overview-matches');assert(section.previousElementSibling.classList.contains('dv2-overview-grid'));assert(section.nextElementSibling.classList.contains('dv2-overview-teams'));
  const before=JSON.stringify(d);w.KVLDomesticHomeV2.apply(d);assert.equal(JSON.stringify(d),before);assert.equal(doc.querySelectorAll('.dv2-overview-matches').length,1);
  doc.querySelector('.kvl1180-tabs [data-view=groups]').click();assert(section.hidden);doc.querySelector('.kvl1180-tabs [data-view=overview]').click();assert(!section.hidden);assert.deepEqual(errors,[]);
 }finally{w.close();}
});
test('completed five-set results render full set scores and next fixtures for both divisions',async()=>{
 const {w,doc,ready}=setup({now:'2026-11-01T03:00:00Z',edit:d=>{d.status='active';d.matches[0].score=structuredClone(result);}});try{await ready;
  assert.equal(doc.querySelectorAll('.dv2-summary-game').length,4);assert.equal(doc.querySelectorAll('[data-kind=recent] .dv2-summary-score').length,2);
  assert([...doc.querySelectorAll('[data-kind=recent] .dv2-summary-score')].every(e=>e.textContent==='3 : 2'));
  for(const sets of doc.querySelectorAll('.dv2-summary-sets'))assert.deepEqual([...sets.children].map(e=>e.textContent),['25–20','23–25','26–24','18–25','15–12']);
  assert.equal(doc.querySelectorAll('.dv2-summary-today').length,2);assert([...doc.querySelectorAll('[data-kind=next] a')].every(a=>new URL(a.href).searchParams.get('date')==='2026-11-01'));
 }finally{w.close();}
});
test('selection uses timestamps, excludes partial/cancelled/postponed/future results, and leaves data unchanged',async()=>{
 const {w,d,ready}=setup();try{await ready;d.matches=[game(d,'late','2026-11-01','16:00',result),game(d,'early','2026-11-01','14:00',result),game(d,'partial','2026-11-01','19:00',{home:2,away:1}),game(d,'future-score','2026-11-03','14:00',result),game(d,'cancelled','2026-11-01','20:00',result,{status:'cancelled'}),game(d,'next','2026-11-02','14:00',null),game(d,'postponed','2026-11-02','13:00',null,{status:'postponed'}),game(d,'past-unscored','2026-10-31','14:00',null)];
  const before=JSON.stringify(d),picked=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-11-02T00:00:00+09:00'));assert.equal(picked.recent.id,'late');assert.equal(picked.next.id,'next');assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});
test('KST day boundary and elapsed start times never leave an old fixture as the next match',async()=>{
 const {w,d,ready}=setup();try{await ready;d.matches=[game(d,'yesterday','2026-10-31','23:00',null),game(d,'unknown-time','2026-11-01','',null),game(d,'scheduled','2026-11-01','14:00',null),game(d,'tomorrow','2026-11-02','14:00',null)];
  let p=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-10-31T15:30:00Z'));assert.equal(p.today,'2026-11-01');assert.equal(p.next.id,'scheduled');
  p=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-11-01T05:01:00Z'));assert.equal(p.next.id,'unknown-time');
  p=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-11-01T15:01:00Z'));assert.equal(p.next.id,'tomorrow');
 }finally{w.close();}
});
test('unknown dates, invalid dates/times, missing teams and unverified scores are not selected',async()=>{
 const {w,d,ready}=setup();try{await ready;d.matches=[game(d,'no-date','',null,null),game(d,'bad-date','2026-11-31','14:00',null),game(d,'bad-time','2026-11-02','29:00',null),game(d,'unknown-team','2026-11-02','14:00',null,{home:{code:'UNKNOWN'}}),game(d,'unverified','2026-10-31','14:00',result,{scoreVerification:false})];
  const p=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-11-02T00:00:00+09:00'));assert.equal(p.recent,null);assert.equal(p.next,null);
 }finally{w.close();}
});
test('season end retains the latest confirmed result and shows an honest next-match empty state',async()=>{
 const {w,doc,ready}=setup({now:'2027-05-01T00:00:00Z',edit:d=>{d.status='completed';d.matches=[{...d.matches[0],score:structuredClone(result)}];}});try{await ready;assert.equal(doc.querySelectorAll('[data-kind=recent] .dv2-summary-game').length,2);assert.equal(doc.querySelectorAll('[data-kind=next] .dv2-summary-empty').length,2);}finally{w.close();}
});
for(const option of ['failPeer','wrongSeason'])test(option+': failure is isolated to the other division',async()=>{
 const {w,doc,ready}=setup({[option]:true});try{await ready;assert.equal(doc.querySelectorAll('[data-summary-gender=men] .dv2-summary-game').length,1);assert.equal(doc.querySelectorAll('[data-summary-gender=women] .dv2-summary-error').length,1);assert.equal(doc.querySelectorAll('.dv2-standings-table tbody tr').length,7);assert.equal(doc.querySelectorAll('.dv2-team-tile').length,7);assert(!doc.querySelector('[aria-busy=true]'));}finally{w.close();}
});

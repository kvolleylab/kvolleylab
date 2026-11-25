'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),dataApi=require('../assets/js/kvl-competition-data-v2.js');
function setup({gender='men',now='2026-10-28T03:00:00Z',edit,failPeer=false,wrongSeason=false,captureMidnight=false}={}){
 // These unit cases deliberately start before opening day. Operating season
 // records will acquire scores; reset the fixture instead of asserting they do not.
 const sources={},configs={};for(const g of ['men','women']){const base=`data/competitions/v-league-${g}-2026-27/`;sources[g]=json(base+'data.json');configs[g]=json(base+'config.json');sources[g].status='upcoming';for(const m of sources[g].matches){delete m.score;delete m.scoreVerification;m.status='scheduled';}if(edit)edit(sources[g],g);}
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=v-league-${gender}-2026-27&view=overview`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 const midnight=[];
 if(captureMidnight){
  const originalSetTimeout=w.setTimeout.bind(w);
  w.setTimeout=(fn,ms,...args)=>{
   if(ms>0&&ms<2000&&String(fn).includes('rollover();scheduleMidnight();')){
    midnight.push({fn,ms});
    return 90000+midnight.length;
   }
   return originalSetTimeout(fn,ms,...args);
  };
 }
 w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};const errors=[];w.addEventListener('error',e=>errors.push(e.error));w.Date.now=()=>Date.parse(now);w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.KVL_COMPETITION_PAGE_V2={deferRender:true,production:true,collectionRoot:'/data/competitions/'};
 const requests=[];w.fetch=async url=>{const u=new URL(url),g=u.pathname.includes('-women-')?'women':'men';requests.push(u.pathname);if(failPeer)throw Error('network unavailable');const value=u.pathname.endsWith('config.json')?structuredClone(configs[g]):structuredClone(sources[g]);if(wrongSeason&&value.competition)value.competition.season='2025-26';return {ok:true,json:async()=>value};};
 for(const name of ['config','data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 const d=dataApi.normalize(configApi.assemble(configs[gender],sources[gender],{slug:configs[gender].slug,canonical:w.location.href}));w.KVL_COMPETITION_V2_DATA=d;
 w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-match-calendar-v1.js'));w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(d);
 return {w,doc:w.document,d,requests,errors,midnight,ready:w.KVLDomesticHomeV2.matchesReady};
}
const result={home:3,away:2,sets:[{home:25,away:20},{home:23,away:25},{home:26,away:24},{home:18,away:25},{home:15,away:12}]};
function game(d,id,date,time,score,extra={}){return {id,date,time,home:{code:d.participants[0].code},away:{code:d.participants[1].code},score,...extra};}
for(const gender of ['men','women'])test(gender+': both divisions, season-only empty state, real next fixtures and deep links',async()=>{
 const {w,doc,d,requests,errors,ready}=setup({gender});try{await ready;
  const cards=[...doc.querySelectorAll('[data-summary-gender]')];assert.deepEqual(cards.map(c=>c.dataset.summaryGender),gender==='women'?['women','men']:['men','women']);
   assert.equal(doc.querySelector('#dv2-overview-matches-title').textContent,'오늘/다음 경기 · 최근 결과');
   for(const card of cards){
    assert.deepEqual([...card.querySelector('.dv2-summary-body').querySelectorAll('.dv2-summary-slot')].map(el=>el.dataset.kind),
      ['next','recent'],'Today/next always precedes recent for '+card.dataset.summaryGender);
   }
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
   for(const division of doc.querySelectorAll('[data-summary-gender]')){
    const slots=[...division.querySelectorAll('.dv2-summary-slot')];
    assert.deepEqual(slots.map(x=>x.dataset.kind),['next','recent'],'Both populated slots must be today-first');
    assert.match(slots[0].querySelector('h4').textContent,/오늘 경기/);
    assert.match(slots[1].querySelector('h4').textContent,/최근 결과/);
   }
  assert([...doc.querySelectorAll('[data-kind=recent] .dv2-summary-score')].every(e=>e.textContent==='3 : 2'));
  for(const sets of doc.querySelectorAll('.dv2-summary-sets'))assert.deepEqual([...sets.children].map(e=>e.textContent),['25–20','23–25','26–24','18–25','15–12']);
  assert.equal(doc.querySelectorAll('.dv2-summary-today').length,2);assert([...doc.querySelectorAll('[data-kind=next] a')].every(a=>new URL(a.href).searchParams.get('date')==='2026-11-01'));
 }finally{w.close();}
});
test('both V-League division cards switch from next to today exactly at 00:00 KST without replacing verified results',async()=>{
 const at2359='2026-11-25T14:59:59.900Z',at0000='2026-11-25T15:00:00.025Z';
 const {w,doc,ready,midnight,errors}=setup({
  now:at2359,captureMidnight:true,edit:(source,gender)=>{
   source.status='active';
   source.matches=[
    game(source,gender+'-recent','2026-11-25','19:00',result,{status:'final',scoreVerification:true,stage:'2라운드'}),
    game(source,gender+'-today','2026-11-26','19:00',null,{status:'scheduled',stage:'2라운드'})
   ];
  }
 });
 try{
  await ready;
  const summary=doc.querySelector('.dv2-overview-matches');
  assert.equal(summary.dataset.kstDay,'2026-11-25');
  for(const card of summary.querySelectorAll('[data-summary-gender]')){
   const slots=[...card.querySelectorAll('.dv2-summary-slot')];
   assert.deepEqual(slots.map(c=>c.dataset.kind),['next','recent']);
   assert.equal(slots[0].querySelector('h4').textContent.startsWith('다음 경기'),true);
   assert.equal(slots[1].querySelector('.dv2-summary-game')?.dataset.matchId,card.dataset.summaryGender+'-recent');
  }
  assert.equal(midnight.length,2,'Each season data view should schedule an exact midnight rollover');
  assert.ok(midnight.every(t=>t.ms>=100&&t.ms<200),
   'Korea midnight must be scheduled directly, not after the one-minute poll: '+JSON.stringify(midnight.map(t=>t.ms)));
  w.Date.now=()=>Date.parse(at0000);
  midnight.forEach(t=>t.fn());
  assert.equal(summary.dataset.kstDay,'2026-11-26');
  for(const card of summary.querySelectorAll('[data-summary-gender]')){
   const slots=[...card.querySelectorAll('.dv2-summary-slot')];
   assert.deepEqual(slots.map(c=>c.dataset.kind),['next','recent']);
   assert.equal(slots[0].querySelector('h4').textContent.startsWith('오늘 경기'),true);
   assert.equal(slots[0].querySelector('.dv2-summary-game')?.dataset.matchId,card.dataset.summaryGender+'-today');
   assert.equal(slots[1].querySelector('.dv2-summary-game')?.dataset.matchId,card.dataset.summaryGender+'-recent');
   assert.equal(slots[1].querySelector('.dv2-summary-score')?.textContent,'3 : 2');
  }
  assert.deepEqual(errors,[]);
 }finally{w.close();}
});
test('selection uses timestamps, excludes partial/cancelled/postponed/future results, and leaves data unchanged',async()=>{
 const {w,d,ready}=setup();try{await ready;d.matches=[game(d,'late','2026-11-01','16:00',result),game(d,'early','2026-11-01','14:00',result),game(d,'partial','2026-11-01','19:00',{home:2,away:1}),game(d,'future-score','2026-11-03','14:00',result),game(d,'cancelled','2026-11-01','20:00',result,{status:'cancelled'}),game(d,'next','2026-11-02','14:00',null),game(d,'postponed','2026-11-02','13:00',null,{status:'postponed'}),game(d,'past-unscored','2026-10-31','14:00',null)];
  const before=JSON.stringify(d),picked=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-11-02T00:00:00+09:00'));assert.equal(picked.recent.id,'late');assert.equal(picked.next.id,'next');assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});
test('KST day boundary retains elapsed same-day fixture until the next day',async()=>{
 const {w,d,ready}=setup();try{await ready;d.matches=[game(d,'yesterday','2026-10-31','23:00',null),game(d,'unknown-time','2026-11-01','',null),game(d,'scheduled','2026-11-01','14:00',null),game(d,'tomorrow','2026-11-02','14:00',null)];
  let p=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-10-31T15:30:00Z'));assert.equal(p.today,'2026-11-01');assert.equal(p.next.id,'scheduled');
  p=w.KVLDomesticHomeV2.selectOverviewMatches(d,Date.parse('2026-11-01T05:01:00Z'));assert.equal(p.next.id,'scheduled');
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

// Synthetic clocks/score fixtures exercise the actual overview renderer. They
// are unit regressions, not evidence of a real observation or publication.
const kickoff=Date.parse('2026-11-21T16:00:00+09:00');
for(const boundary of [
 {offset:-1,kind:'scheduled',label:'예정',score:'VS'},
 {offset:0,kind:'waiting',label:'상태 확인 중',score:'—'},
 {offset:13000,kind:'waiting',label:'상태 확인 중',score:'—'},
 {offset:30*60000-1,kind:'waiting',label:'상태 확인 중',score:'—'},
 {offset:30*60000,kind:'stale',label:'갱신 지연',score:'—'},
])test(`synthetic unobserved kickoff ${boundary.offset}ms: both overview entry points preserve the score state`,async()=>{
 for(const gender of ['men','women']){
  const {w,doc,ready,errors}=setup({gender,now:new Date(kickoff+boundary.offset).toISOString(),edit:d=>{
   d.status='active';const m=d.matches.find(m=>m.date==='2026-11-21');
   // Align the two synthetic kickoffs to check current and fetched peer cards.
   m.time='16:00';delete m.liveScore;delete m.liveSets;d.matches=[m];
  }});
  try{await ready;
   for(const g of ['men','women']){
    const card=doc.querySelector(`[data-summary-gender=${g}] [data-kind=next]`);
    const badge=card.querySelector('[data-match-state]'),match=card.querySelector('.dv2-summary-game');
    assert.equal(badge.dataset.matchState,boundary.kind);assert.equal(badge.textContent,boundary.label);
    assert.equal(match.querySelector('.dv2-summary-score').textContent,boundary.score);
    assert.equal(match.querySelector('.dv2-summary-sets'),null,'unobserved games must not invent points or an empty score strip');
    assert.match(match.querySelector('.dv2-summary-when').textContent,/16:00 KST/);
    const detail=match.querySelector('.dv2-summary-venue').textContent;
    if(boundary.kind==='waiting')assert.equal(detail,'공식 경기 상태 확인 중');
    if(boundary.kind==='stale')assert.equal(detail,'최종 관측 없음 · 예정 시작 16:00 KST 이후 경기 상태 미확인');
    const link=new URL(match.href);assert.equal(link.searchParams.get('competition'),`v-league-${g}-2026-27`);assert.equal(link.searchParams.get('date'),'2026-11-21');
   }
   assert.deepEqual(errors,[]);
  }finally{w.close();}
 }
});
test('synthetic mixed divisions: men live 2–1 and three completed sets remain visible while women await the first observation',async()=>{
 const now='2026-11-21T16:00:13+09:00';
 for(const gender of ['men','women']){
  const {w,doc,ready,errors}=setup({gender,now,edit:(d,g)=>{
   d.status='active';const m=d.matches.find(m=>m.date==='2026-11-21');delete m.liveScore;delete m.liveSets;d.matches=[m];
   if(g==='men'){
    m.status='live';m.liveScore={home:2,away:1,sourceKey:m.officialSourceKey,observedAt:new Date('2026-11-21T16:00:00+09:00').toISOString()};
    m.liveSets=[{home:25,away:20},{home:23,away:25},{home:25,away:22}].map(s=>({...s,status:'completed'}));
   }
  }});
  try{await ready;
   const men=doc.querySelector('[data-summary-gender=men] [data-kind=next]'),women=doc.querySelector('[data-summary-gender=women] [data-kind=next]');
   assert.equal(men.querySelector('[data-match-state]').dataset.matchState,'live');assert.equal(men.querySelector('.dv2-summary-score').textContent,'2 : 1');
   assert.deepEqual([...men.querySelectorAll('.dv2-summary-sets > span')].map(s=>s.textContent),['25–20','23–25','25–22']);
   assert.match(men.querySelector('.dv2-summary-venue').textContent,/16:00 KST 확인/);
   assert.equal(women.querySelector('[data-match-state]').dataset.matchState,'waiting');assert.equal(women.querySelector('[data-match-state]').textContent,'상태 확인 중');
   assert.equal(women.querySelector('.dv2-summary-score').textContent,'—');assert.equal(women.querySelector('.dv2-summary-sets'),null);
   assert.equal(women.querySelector('.dv2-summary-venue').textContent,'공식 경기 상태 확인 중');assert.deepEqual(errors,[]);
  }finally{w.close();}
 }
});

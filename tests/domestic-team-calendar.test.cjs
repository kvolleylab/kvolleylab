const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const contract=require('../assets/js/kvl-competition-config-v2.js');
function setup(slug='university-league-women-2026'){
 const config=JSON.parse(read(`data/competitions/${slug}/config.json`)),source=JSON.parse(read(`data/competitions/${slug}/data.json`));
 const raw=contract.assemble(config,source,{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`});
 const code=raw.participants[0].code,url=`https://kvolleylab.com/competition-engine.html?competition=${slug}&view=team&team=${code}`;
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.Date.now=()=>Date.parse('2026-11-01T00:00:00Z');w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.CSS={escape:x=>x};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 const d=w.KVLCompetitionDataV2.normalize(raw);w.KVL_COMPETITION_V2_DATA=d;
 w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));
 return {w,d,code,doc:w.document,route:(next,extra='')=>{w.history.pushState(null,'',`?competition=${slug}&view=team&team=${next}${extra}`);w.dispatchEvent(new w.PopStateEvent('popstate'));}};
}
test('team calendar contains only the selected team, including home and away games; overview month stays independent',()=>{
 const {w,d,code,doc}=setup();try{
  const before=JSON.stringify(d),expected=d.matches.filter(m=>[m.home.code,m.away.code].includes(code));
  assert.ok(expected.some(m=>m.home.code===code)&&expected.some(m=>m.away.code===code));
  w.KVLDomesticHomeV2.apply(d);const section=doc.querySelector('[data-dv2-team-calendar]');assert.equal(section.dataset.dv2TeamCalendar,code);
  const overview=doc.querySelector('[data-dv2-calendar]').innerHTML,seen=new Set();
  for(let guard=0;guard<24;guard++){
   for(const day of section.querySelectorAll('[data-dv2-date]')){
    const date=day.dataset.dv2Date,games=expected.filter(m=>m.date===date);assert.ok(games.length);seen.add(date);day.click();
    assert.equal(doc.querySelectorAll('.dv2-day-match').length,games.length);
    for(const row of doc.querySelectorAll('.dv2-day-match'))assert.ok([...row.querySelectorAll('.dv2-match-teams a')].some(a=>new URL(a.href).searchParams.get('team')===code));
    const link=new URL(doc.querySelector('.dv2-day-schedule').href);assert.equal(link.searchParams.get('view'),'team');assert.equal(link.searchParams.get('team'),code);assert.equal(link.searchParams.get('date'),date);doc.querySelector('#dv2-day-dialog').close();
   }
   const previous=section.querySelector('[data-dv2-month="-1"]');if(previous.disabled)break;previous.click();
  }
  assert.deepEqual([...seen].sort(),[...new Set(expected.map(m=>m.date))].sort());
  assert.equal(doc.querySelector('[data-dv2-calendar]').innerHTML,overview);assert.equal(JSON.stringify(d),before);
  assert.equal(doc.querySelector('.dv2-team-match-list').open,true);
  assert.equal(doc.querySelectorAll('.dv2-team-match-list [data-match-id]').length,expected.length);
 }finally{w.close();}
});
test('changing team and returning to a calendar date rebuilds one calendar without losing the selected team',()=>{
 const {w,d,doc,route}=setup();try{
  w.KVLDomesticHomeV2.apply(d);const other=d.participants[1].code;route(other);
  assert.equal(doc.querySelectorAll('[data-dv2-team-calendar]').length,1);assert.equal(doc.querySelector('[data-dv2-team-calendar]').dataset.dv2TeamCalendar,other);
  const date=d.matches.find(m=>[m.home.code,m.away.code].includes(other)).date;route(other,'&date='+date);
  assert.equal(doc.querySelectorAll('.dv2-team-match-list').length,1);assert.equal(doc.querySelector('.dv2-team-match-list').open,true);assert.ok(doc.querySelector('#team-date-'+date));
  route('UNKNOWN');assert.equal(doc.querySelector('[data-dv2-team-calendar]'),null);
 }finally{w.close();}
});
test('team date cells show registered scores or vs, retain every same-day match and escape names',()=>{
 const {w,d,doc,code}=setup();try{
  const first=d.matches.find(m=>[m.home.code,m.away.code].includes(code)),other=d.participants.find(t=>t.code!==code);
  d.participants.find(t=>t.code===code).name='긴 팀 이름 <학교>';
  d.matches=[{...first,id:'calendar-future',date:'2026-12-01',home:{code},away:{code:other.code},score:{home:3,away:1,sets:[]}},
   {...first,id:'calendar-past-unscored',date:'2026-12-01',home:{code:other.code},away:{code},score:null}];
  // The render hook runs before apply(): it must use the passed data, not global current.
  w.KVLCompetitionComponentsV2.render();w.KVLDomesticHomeV2.apply(d);
  const cells=[...doc.querySelectorAll('[data-dv2-team-calendar] .dv2-team-game')];assert.equal(cells.length,2);
  assert.deepEqual(cells.map(c=>c.querySelector('b').textContent),['3-1','vs']);
  assert.ok(cells.every(c=>c.textContent.includes('긴 팀 이름 <학교>')));assert.equal(doc.querySelector('학교'),null);
  assert.equal(doc.querySelectorAll('[data-dv2-team-calendar] .dv2-day small').length,0);
  assert.equal(doc.querySelector('.dv2-team-match-list').open,true);
  doc.querySelector('[data-dv2-team-calendar] [data-dv2-date]').click();assert.equal(doc.querySelectorAll('.dv2-day-match').length,2);
  w.Date.now=()=>Date.parse('2026-12-02T00:00:00Z');w.KVLCompetitionComponentsV2.render();
  assert.deepEqual([...doc.querySelectorAll('[data-dv2-team-calendar] .dv2-team-game-score')].map(e=>e.textContent),['3-1','vs']);
 }finally{w.close();}
});
test('hiding a single-league status never removes grouped competitions pool labels',()=>{
 const {w,d,doc}=setup('university-goseong-men-2026');try{
  const before=doc.querySelector('.kvl1180-combined-table').textContent;
  d.structure.standings.showStatus=false;w.KVLCompetitionComponentsV2.render();
  assert.equal(doc.querySelector('.kvl1180-combined-table').textContent,before);
  assert.equal(doc.querySelector('.is-status-hidden'),null);
 }finally{w.close();}
});
test('single-league status can be omitted without losing result, metrics or default columns',()=>{
 const {w,d,doc}=setup('vnl-men-2026');try{
  delete d.structure.standings.showStatus;w.KVLCompetitionComponentsV2.render();
  const snapshot=JSON.stringify(d.standings),getRows=()=>[...doc.querySelectorAll('.kvl1180-combined-row')].map(r=>[...r.children].map(c=>c.textContent));
  const before=getRows();assert.equal(before.length,18);assert.ok(before.every(r=>r.length===9));
  d.structure.standings.showStatus=false;w.KVLCompetitionComponentsV2.render();
  const after=getRows();assert.deepEqual(after,before.map(r=>r.filter((_,i)=>i!==2)));
  assert.equal(doc.querySelector('.kvl1180-combined-table-head').children.length,8);
  assert.ok([...doc.querySelectorAll('.kvl-shared-combined-line')].every(r=>r.children.length===6));
  assert.equal(doc.querySelectorAll('.kvl1180-combined-pool').length,0);assert.equal(JSON.stringify(d.standings),snapshot);
  delete d.structure.standings.showStatus;w.KVLCompetitionComponentsV2.render();assert.deepEqual(getRows(),before);
 }finally{w.close();}
});
test('an empty selected-team schedule gets the same calendar empty state',()=>{
 const {w,d,doc,code}=setup();try{
  d.matches=d.matches.filter(m=>![m.home.code,m.away.code].includes(code));w.KVLCompetitionComponentsV2.render();w.KVLDomesticHomeV2.apply(d);
  assert.match(doc.querySelector('[data-dv2-team-calendar]').textContent,/공식 일정 발표 후 표시합니다/);assert.equal(doc.querySelectorAll('[data-dv2-team-calendar] [data-dv2-date]').length,0);
 }finally{w.close();}
});
test('preserve Hero mode keeps the original title, metadata and status DOM',()=>{
 const {w,d,doc}=setup();try{
  const original=doc.querySelector('.kvl1180-hero').innerHTML;d.structure.heroPresentation='preserve';w.KVLDomesticHomeV2.apply(d);
  assert.equal(doc.querySelector('.kvl1180-hero').innerHTML,original);assert.equal(doc.body.dataset.domesticHero,'preserve');
 }finally{w.close();}
});
test('the team calendar hook leaves non-opted-in VNL production rendering intact',()=>{
 const {w,d,doc,route,code}=setup('vnl-men-2026');try{
  delete d.structure.presentation;
  const before=doc.querySelector('#team-results').innerHTML;assert.equal(w.KVLDomesticHomeV2.apply(d),false);route(code);
  assert.equal(doc.querySelector('#team-results').innerHTML,before);assert.equal(doc.querySelector('[data-dv2-team-calendar]'),null);
 }finally{w.close();}
});
function recordValues(doc){return Object.fromEntries([...doc.querySelectorAll('[data-team-record]')].map(e=>[e.dataset.teamRecord,e.querySelector('strong').textContent]));}
test('VNL opt-in shares university cards and keeps preliminary and entire-event win rates separate',()=>{
 const {w,d,doc,route}=setup('vnl-men-2026');try{
  assert.ok(doc.querySelector('.is-dual-rate'));const before=JSON.stringify(d.matches);
  d.structure.teamResults={summary:'record',preliminaryStages:['예선']};route('POL');
  assert.deepEqual(recordValues(doc),{total:'15경기',wins:'13승',losses:'2패',preliminary:'83.3%',overall:'86.7%'});
  assert.match(doc.querySelector('[data-team-record="preliminary"]').textContent,/10승 2패 · 12경기/);
  route('CUB');assert.deepEqual(recordValues(doc),{total:'12경기',wins:'3승',losses:'9패',preliminary:'25.0%',overall:'25.0%'});
  assert.equal(JSON.stringify(d.matches),before);
 }finally{w.close();}
});
test('domestic U-league preliminary rate excludes the six-team league and knockout',()=>{
 const {w,d,doc,route}=setup('university-league-men-2026');try{
  route('SKKU');const before=recordValues(doc),prelim=doc.querySelector('[data-team-record="preliminary"]').textContent;
  assert.equal(before.preliminary,'83.3%');assert.match(prelim,/5승 1패 · 6경기/);
  for(const m of d.matches.filter(m=>m.stage!=='예선'&&[m.home.code,m.away.code].includes('SKKU')))m.score=m.home.code==='SKKU'?{home:0,away:3,sets:[]}:{home:3,away:0,sets:[]};
  w.KVLCompetitionComponentsV2.render();assert.equal(doc.querySelector('[data-team-record="preliminary"]').textContent,prelim);assert.notEqual(recordValues(doc).overall,before.overall);
 }finally{w.close();}
});
test('record cards exclude unfinished and tied scores; zero completed games are not a zero-percent record',()=>{
 const {w,d,doc,code}=setup();try{
  const original=d.matches.find(m=>[m.home.code,m.away.code].includes(code)),other=d.participants.find(t=>t.code!==code).code;
  d.matches=[null,{home:0,away:0},{home:3,away:1},{home:1,away:3}].map((score,i)=>({...original,id:'record-'+i,home:{code},away:{code:other},score,...(i===2?{status:'live'}:{})}));
  w.KVLCompetitionComponentsV2.render();assert.deepEqual(recordValues(doc),{total:'4경기',wins:'0승',losses:'1패',preliminary:'0.0%',overall:'0.0%'});
  d.matches.pop();w.KVLCompetitionComponentsV2.render();assert.equal(recordValues(doc).overall,'—');assert.equal(recordValues(doc).preliminary,'—');assert.match(doc.querySelector('.kvl-team-record-note').textContent,/등록 3경기 · 완료 0경기 · 미완료 3경기/);
 }finally{w.close();}
});
test('preliminary stage selection distinguishes not applicable, unknown and no completed matches',()=>{
 const {w,d,doc}=setup('vnl-men-2026');try{
  d.structure.teamResults={summary:'record',preliminaryStages:[]};w.KVLCompetitionComponentsV2.render();assert.match(doc.querySelector('[data-team-record="preliminary"]').textContent,/—해당 없음/);
  delete d.structure.teamResults.preliminaryStages;d.structure.schedule.stages=['전체','본선'];d.matches=d.matches.map(m=>({...m,stage:'본선'}));w.KVLCompetitionComponentsV2.render();assert.match(doc.querySelector('[data-team-record="preliminary"]').textContent,/—단계 확인 중/);
  d.structure.teamResults.preliminaryStages=['본선'];d.structure.teamResults.preliminaryLabel='본선';d.matches=d.matches.map(m=>({...m,score:null}));w.KVLCompetitionComponentsV2.render();assert.match(doc.querySelector('[data-team-record="preliminary"]').textContent,/승률 \(본선\).*—완료 경기 없음/);
 }finally{w.close();}
});

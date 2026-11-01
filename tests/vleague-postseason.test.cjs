'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js');
function setup(gender,transform,{width=1180,now,domestic=true}={}){
 const slug=`v-league-${gender}-2026-27`,base=`data/competitions/${slug}/`,config=json(base+'config.json');
 const d=modules.apply(configApi.assemble(config,json(base+config.data),{slug}),config.modules||[],(config.modules||[]).map(m=>json(base+m.source)));
 if(transform)transform(d);
 const before=JSON.stringify(d),dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=${slug}&view=knockout`,runScripts:'outside-only'}),w=dom.window;
 w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=query=>({matches:/max-width\s*:\s*(\d+)px/.test(query)?width<=Number(query.match(/max-width\s*:\s*(\d+)px/)[1]):false});w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w,'innerWidth',{value:width});if(now!==undefined)w.Date.now=()=>now;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(d);w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-match-calendar-v1.js'));w.eval(read('assets/js/kvl-domestic-home-v2.js'));if(domestic)w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
 assert.equal(JSON.stringify(d),before,'rendering must not mutate the source');
 return {w,doc:w.document,d};
}
function ranked(d){d.status='completed';d.regularSeasonComplete=true;d.standings.rows=d.participants.slice(0,4).map((t,i)=>({rank:i+1,team:t.code,points:70-i*2}));}
function match(d,round,n,home,away,score){return {id:`qa-${round}-${n}`,round,stage:round,date:`2027-04-${String(n).padStart(2,'0')}`,time:'19:00',home:d.participants[home].code,away:d.participants[away].code,status:score?'completed':'scheduled',...(score?{score:{home:score[0],away:score[1]}}:{})};}
function officialMatch(d,phase,n,day,home,away,score){return {...match(d,phase,n,home,away,score),stage:{QPO:'준플레이오프',PO:'플레이오프',CH:'챔피언결정전'}[phase],round:`${n}차전`,seriesGame:n,date:day,status:score?'final':'scheduled'};}
const wins=el=>[...el.querySelectorAll('.kvl1180-pro-series-wins')].map(e=>e.textContent);
for(const gender of ['men','women']){
 test(gender+': pending bracket is styled in the domestic skin and never invents pairings or scores',()=>{
  const {w,doc}=setup(gender);try{
   assert(doc.body.classList.contains('kvl-pro-league-domestic-v2'));
   const stages=[...doc.querySelectorAll('.kvl1180-pro-postseason-stage')];assert.equal(stages.length,3);
   assert.deepEqual(stages.map(s=>s.querySelectorAll('.kvl1180-pro-series-game').length),[1,3,5]);
   assert(stages.every(s=>wins(s).join('')==='——'));assert.equal(doc.querySelectorAll('.kvl1180-pro-series-team a').length,0);
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-status').length,3);
   const periods=gender==='men'?['2027.04.06','2027.04.08 ~ 04.12','2027.04.14 ~ 04.22']:['2027.04.05','2027.04.07 ~ 04.11','2027.04.13 ~ 04.21'];
   assert.deepEqual(stages.map(s=>s.querySelector('[data-postseason-period]').textContent),periods.map(p=>'공식 기간 '+p));
   assert([...doc.querySelectorAll('.kvl1180-pro-series-game')].every(row=>row.textContent.includes('일정 미정')),'announced phase periods must not create dated fixtures');
   assert.equal(doc.querySelector('[data-postseason-source]').href,json(`data/competitions/v-league-${gender}-2026-27/config.json`).structure.knockout.periodSource.sourceUrl);
   // Reproduce the skin change that previously left every series interior unstyled.
   const style=doc.createElement('style');style.textContent=read('assets/css/kvl-competition-components-v2.css');doc.head.append(style);
   for(const family of ['domestic','pro']){
    doc.body.dataset.kvlFamily=family;
    assert.equal(w.getComputedStyle(stages[0].querySelector('.kvl1180-pro-series-team')).display,'grid');
    assert.equal(w.getComputedStyle(stages[0].querySelector('.kvl1180-pro-series-game')).display,'grid');
    assert.equal(w.getComputedStyle(stages[2].querySelector('.kvl1180-pro-series-wins')).color,'rgb(75, 85, 99)');
   }
  }finally{w.close();}
 });
 test(gender+': reversed home/away, chronological games, clinching and advancement retain the right teams',()=>{
  const {w,doc,d}=setup(gender,d=>{ranked(d);d.matches=[match(d,'PO',3,1,2),match(d,'QPO',1,2,3,[3,1]),match(d,'PO',2,1,2,[1,3]),match(d,'PO',1,2,1,[3,0])];});try{
   const qpo=doc.querySelector('.is-qpo'),po=doc.querySelector('.is-po'),final=doc.querySelector('.is-final');
   assert.equal(qpo.querySelectorAll('.is-complete').length,1);assert.equal(po.querySelectorAll('.is-complete').length,2,'QPO must not be counted as PO');
   assert.deepEqual(wins(po),['0','2']);assert.equal(po.querySelectorAll('.is-unused').length,1);
   assert.deepEqual([...po.querySelectorAll('.kvl1180-pro-series-team a')].map(e=>e.dataset.teamResults),[d.participants[1].code,d.participants[2].code]);
   assert.equal(final.querySelectorAll('.kvl1180-pro-series-team a')[1].dataset.teamResults,d.participants[2].code);
   assert.match(po.querySelector('.kvl1180-pro-game-result').textContent,/3–0/);
   assert.match(po.querySelector('.kvl1180-pro-series-winner').textContent,/진출/);
   const a=final.querySelector('.kvl1180-pro-series-team a');assert.equal(new URL(a.href).searchParams.get('view'),'team');
  }finally{w.close();}
 });
 test(gender+': active regular-season ranks do not qualify teams after standings change',()=>{
  const {w,doc}=setup(gender,d=>{ranked(d);d.status='active';d.regularSeasonComplete=false;d.standings.rows.reverse().forEach((row,index)=>{row.rank=index+1;});d.matches=[match(d,'LEAGUE',1,0,1,[3,0])];});try{
   const stages=[...doc.querySelectorAll('.kvl1180-pro-postseason-stage')];
   assert(stages.every(s=>wins(s).join('')==='——'));
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-team a').length,0);
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-winner').length,0);
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-game.is-complete').length,0,'a completed regular-season game is not a playoff result');
  }finally{w.close();}
 });
 test(gender+': explicit scheduled playoff pairing remains authoritative during an active season',()=>{
  const {w,doc,d}=setup(gender,d=>{ranked(d);d.status='active';d.regularSeasonComplete=false;d.matches=[match(d,'PO',1,4,5),match(d,'PO',2,5,4)];});try{
   const po=doc.querySelector('.is-po');
   assert.deepEqual([...po.querySelectorAll('.kvl1180-pro-series-team a')].map(e=>e.dataset.teamResults),[d.participants[4].code,d.participants[5].code]);
   assert.deepEqual(wins(po),['0','0']);
   assert.equal(po.querySelectorAll('.is-pending').length,3);
   for(const selector of ['.is-qpo','.is-final']){
    const stage=doc.querySelector(selector);assert.deepEqual(wins(stage),['—','—']);assert.equal(stage.querySelectorAll('.kvl1180-pro-series-team a').length,0);
   }
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-winner').length,0);
  }finally{w.close();}
 });
 test(gender+': final regular standings open seeds while the whole season remains active',()=>{
  const {w,doc,d}=setup(gender,d=>{ranked(d);d.status='active';d.standings.rows[3].points=d.standings.rows[2].points-3;d.matches=[];});try{
   assert.deepEqual([...doc.querySelectorAll('.is-qpo .kvl1180-pro-series-team a')].map(a=>a.dataset.teamResults),[d.participants[2].code,d.participants[3].code]);
   assert.deepEqual([...doc.querySelectorAll('.is-po .kvl1180-pro-series-team a')].map(a=>a.dataset.teamResults),[d.participants[1].code]);
   assert.deepEqual([...doc.querySelectorAll('.is-final .kvl1180-pro-series-team a')].map(a=>a.dataset.teamResults),[d.participants[0].code]);
   assert.equal(doc.querySelectorAll('.is-qpo .is-unused').length,0,'a three-point gap still requires QPO');
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-winner').length,0);
  }finally{w.close();}
 });
 test(gender+': a final four-point gap skips QPO and advances third place without a fake win',()=>{
  const {w,doc,d}=setup(gender,d=>{ranked(d);d.status='active';d.standings.rows[3].points=d.standings.rows[2].points-4;d.matches=[];});try{
   const qpo=doc.querySelector('.is-qpo'),po=doc.querySelector('.is-po');
   assert.match(qpo.querySelector('.kvl1180-pro-series-status').textContent,/준PO 미개최/);
   assert.match(qpo.querySelector('.is-unused').textContent,/승점 차 4점 이상.*미개최/);
   assert.equal(qpo.querySelectorAll('.is-pending').length,0);assert.deepEqual(wins(qpo),['—','—']);
   assert.deepEqual([...po.querySelectorAll('.kvl1180-pro-series-team a')].map(a=>a.dataset.teamResults),[d.participants[1].code,d.participants[2].code]);
   assert.match(po.textContent,/준PO 미개최로 직행/);assert.deepEqual(wins(po),['0','0']);
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-winner').length,0);
   assert.equal(d.matches.length,0,'qualification must not synthesize a scored or scheduled game');
  }finally{w.close();}
 });
}
test('an actual playoff winner advances during an active season without promoting the live first-place team',()=>{
 const {w,doc,d}=setup('men',d=>{ranked(d);d.status='active';d.regularSeasonComplete=false;d.matches=[match(d,'PO',2,5,4,[1,3]),match(d,'PO',1,4,5,[3,0])];});try{
  const po=doc.querySelector('.is-po'),final=doc.querySelector('.is-final');
  assert.deepEqual(wins(po),['2','0']);assert.equal(po.querySelectorAll('.is-unused').length,1);
  assert.deepEqual([...final.querySelectorAll('.kvl1180-pro-series-team a')].map(e=>e.dataset.teamResults),[d.participants[4].code]);
  assert.deepEqual(wins(final),['—','—']);
  assert.equal(final.querySelectorAll('.kvl1180-pro-series-winner').length,0);
 }finally{w.close();}
});
test('a three-win championship marks the champion and hides unneeded scheduled games',()=>{
 const {w,doc}=setup('women',d=>{ranked(d);d.matches=[match(d,'FINAL',1,0,1,[3,0]),match(d,'FINAL',2,1,0,[2,3]),match(d,'FINAL',3,0,1,[3,1]),match(d,'FINAL',4,1,0),match(d,'FINAL',5,0,1)];});try{
  const final=doc.querySelector('.is-final');assert.deepEqual(wins(final),['3','0']);assert.equal(final.querySelectorAll('.is-unused').length,2);assert.equal(final.querySelector('.kvl1180-pro-series-winner').textContent,'우승');
 }finally{w.close();}
});
test('partial/live scores do not become series wins or advance a team',()=>{
 const {w,doc}=setup('men',d=>{ranked(d);d.matches=[match(d,'QPO',1,2,3,[1,0]),{...match(d,'PO',1,1,2,[3,1]),status:'live'}];});try{
  assert.deepEqual(wins(doc.querySelector('.is-qpo')),['0','0']);assert.deepEqual(wins(doc.querySelector('.is-po')),['0','0']);assert.equal(doc.querySelectorAll('.kvl1180-pro-series-winner').length,0);assert.equal(doc.querySelectorAll('.kvl1180-pro-series-game.is-complete').length,0);
 }finally{w.close();}
});
test('unknown final points and explicit incomplete regular season never imply QPO omission',()=>{
 for(const mode of ['unknown-points','explicit-false']){
  const {w,doc}=setup('men',d=>{ranked(d);d.standings.rows[3].points=d.standings.rows[2].points-4;d.matches=[];if(mode==='unknown-points')d.standings.rows[2].points=null;else d.regularSeasonComplete=false;});try{
   assert.equal(doc.querySelectorAll('.is-qpo .is-unused').length,0);
   assert(!doc.querySelector('.is-po').textContent.includes('준PO 미개최로 직행'));
   if(mode==='explicit-false')assert.equal(doc.querySelectorAll('.kvl1180-pro-series-team a').length,0);
  }finally{w.close();}
 }
});
test('the official series ordinal remains correct when only the second fixture is ready',()=>{
 const {w,doc}=setup('women',d=>{ranked(d);d.status='active';d.matches=[officialMatch(d,'PO',2,'2027-04-09',2,1)];});try{
  const games=[...doc.querySelectorAll('.is-po .kvl1180-pro-series-game')];
  assert.match(games[0].textContent,/1차전.*일정 미정/);
  assert.match(games[1].textContent,/2차전.*04\.09.*19:00/);
  assert.match(games[2].textContent,/3차전.*일정 미정/);
 }finally{w.close();}
});
for(const width of [1180,360])test(`unused championship fixtures stay in the record, not the next match or calendar at ${width}px`,()=>{
 const now=Date.parse('2027-04-19T09:00:00+09:00');
 const {w,doc}=setup('men',d=>{
  ranked(d);d.status='active';d.matches=[officialMatch(d,'CH',1,'2027-04-14',0,1,[3,0]),officialMatch(d,'CH',2,'2027-04-16',0,1,[3,1]),officialMatch(d,'CH',3,'2027-04-18',1,0,[0,3]),
   {...officialMatch(d,'CH',4,'2027-04-20',1,0),status:'not_required',non_play_reason:'series_clinched'},
   {...officialMatch(d,'CH',5,'2027-04-22',0,1),notRequired:true,non_play_reason:'series_clinched'}];
 },{width,now});try{
  const picked=w.KVLDomesticHomeV2.selectOverviewMatches(w.KVL_COMPETITION_V2_DATA,now);
  assert.equal(picked.recent.id,'qa-CH-3');assert.equal(picked.next,null);
  const summary=doc.querySelector('[data-kvl-component="schedule-summary"]').textContent;
  assert.match(summary,/5경기 · 완료 3 · 예정 0 · 미실시 2/);
  for(const id of ['qa-CH-4','qa-CH-5']){
   const row=doc.querySelector(`[data-match-id="${id}"]`);assert(row);
   assert.equal(row.dataset.matchState,'not_required');assert.equal(row.querySelector('.kvl1180-score').textContent,'미실시');
   assert.equal(row.querySelector('.is-upcoming'),null);assert.match(row.textContent,/시리즈 종료/);
  }
  assert.deepEqual([...doc.querySelectorAll('[data-dv2-calendar] [data-dv2-date]')].map(b=>b.dataset.dv2Date),['2027-04-14','2027-04-16','2027-04-18']);
  assert.equal(doc.querySelectorAll('.is-final .is-unused').length,2);
  assert.equal(doc.querySelectorAll('.is-final .is-complete').length,3);
  const filter=doc.querySelector('[data-stage="챔피언결정전"]');assert(filter);filter.click();
  assert.equal(doc.querySelectorAll('[data-kvl-component="schedule-list"] .kvl1180-match-row').length,5);
 }finally{w.close();}
});
test('a retained QPO qualification-gap row is labelled unused and excluded from both calendar renderers',()=>{
 const {w,doc}=setup('women',d=>{
  ranked(d);d.status='active';d.standings.rows[3].points=d.standings.rows[2].points-4;
  d.matches=[{...officialMatch(d,'QPO',1,'2027-04-05',2,3),status:'not_required',notRequired:true,non_play_reason:'qualification_gap'},officialMatch(d,'PO',1,'2027-04-07',1,2)];
 },{now:Date.parse('2027-04-04T09:00:00+09:00'),domestic:false});try{
  assert.equal(doc.querySelector('[data-kvl-component="calendar"] a[href*="date=2027-04-05"]'),null);
  const row=doc.querySelector('[data-match-id="qa-QPO-1"]');assert.match(row.textContent,/준PO 미개최/);assert.equal(row.querySelector('.kvl1180-score').textContent,'미실시');
  w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
  assert.equal(doc.querySelector('[data-dv2-date="2027-04-05"]'),null);assert(doc.querySelector('[data-dv2-date="2027-04-07"]'));
  const picked=w.KVLDomesticHomeV2.selectOverviewMatches(w.KVL_COMPETITION_V2_DATA,Date.parse('2027-04-04T09:00:00+09:00'));
  assert.equal(picked.next.id,'qa-PO-1');assert.equal(picked.recent,null);
 }finally{w.close();}
});

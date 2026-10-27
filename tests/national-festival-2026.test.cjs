const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const contract=require('../assets/js/kvl-competition-config-v2.js'),api=require('../assets/js/kvl-competition-data-v2.js');
const cases=[['men-general',11,10,5,'화성시청'],['men-university',11,10,5,'인하대학교'],['men-u18',15,14,1,'남성고등학교'],['women-general',9,8,7,'수원시청'],['women-u18',14,13,2,'선명여자고등학교']];
function setup(key,view='overview'){
 const slug=`national-sports-festival-${key}-2026`,c=json(`data/competitions/${slug}/config.json`),s=json(`data/competitions/${slug}/data.json`),url=`https://kvolleylab.com/national-sports-festival-volleyball-2026-unified-ui-prototype.html?competition=${slug}&view=${view}`;
 const d=contract.assemble(c,s,{slug,canonical:url});assert.deepEqual(api.validate(d,{production:true}),[]);
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});w.CSS={escape:v=>String(v)};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const n of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${n}-v2.js`));w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(d);w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
 return {w,doc:w.document,d};
}
for(const [key,n,g,byes,champion] of cases)test(key+' includes every official team/match and correct knockout path, podium and interactive navigation',()=>{
 const {w,doc,d}=setup(key);try{
  assert.equal(d.participants.length,n);assert.equal(d.matches.length,g);assert.equal(d.champion,champion);assert.equal(d.status,'completed');assert.equal(doc.querySelectorAll('[data-division-link]').length,5);assert.equal(doc.querySelectorAll('.kvl1180-tabs a').length,5);assert.equal(doc.querySelector('.kvl1180-tabs a[data-view=groups]'),null);assert.deepEqual(d.finalRanking.map(x=>x.rank).sort(),[1,2,3,3]);assert.match(doc.querySelector('.kvl1180-final-block-head').textContent,/공동 3위/);
  for(const m of d.matches){
   const row=doc.querySelector(`#schedule [data-match-id="${m.id}"]`);
   assert.equal(row.querySelectorAll('img').length,0);
   assert.deepEqual([...row.querySelectorAll('.kvl-region-mark')].map(x=>x.textContent),[m.home,m.away].map(t=>d.participants.find(p=>p.code===t.code).region));
   assert.deepEqual([...row.querySelectorAll('.kvl1180-slot-copy strong')].map(x=>x.textContent),[m.home,m.away].map(t=>d.participants.find(p=>p.code===t.code).name));
  }
  assert.equal(doc.querySelectorAll('#knockout img, .dv2-overview-teams img, .kvl1180-participant-button img').length,0);
  assert.equal(doc.querySelectorAll('.kvl1180-participant-button .kvl-region-mark').length,n);
  assert.equal(doc.querySelectorAll('[data-tree-match]').length,g);assert.equal(doc.querySelectorAll('[data-tree-bye]').length,byes);assert.equal(doc.querySelectorAll('.kvl-tree-round').length,4);assert.equal(doc.querySelectorAll('#knockout .dv2-trophy').length,4);assert.equal(doc.querySelector('.dv2-calendar-month').textContent,'10월');
  assert.deepEqual([...doc.querySelectorAll('.dv2-ranking-list .dv2-region')].map(n=>n.textContent),d.finalRanking.map(r=>d.participants.find(t=>t.code===r.code).region));
  assert.deepEqual([...doc.querySelectorAll('#knockout .kvl1180-final-flag.kvl-region-mark')].map(n=>n.textContent),d.finalRanking.map(r=>d.participants.find(t=>t.code===r.code).region));
  assert.equal(doc.querySelectorAll('#knockout .kvl-final-region').length,0);
  assert.equal(doc.querySelector('.dv2-champion .dv2-region').textContent,d.participants.find(t=>t.code===d.finalRanking[0].code).region);
  assert.equal(doc.querySelectorAll('[href*="university-team"]').length,0);assert.match(doc.querySelector('.dv2-utility').textContent,/종합대회/);
  const teams=new Set(d.participants.map(t=>t.code));for(const m of d.matches){assert.ok(teams.has(m.home.code)&&teams.has(m.away.code));assert.equal((m.reportedSets||m.score.sets).length,m.score.home+m.score.away);m.score.sets.forEach((s,i)=>{const hi=Math.max(s.home,s.away),lo=Math.min(s.home,s.away),target=i===4?15:25;assert.ok((hi===target&&lo<=target-2)||(hi>target&&hi-lo===2));});if(m.reportedSets){assert.equal(m.dataStatus,'source-conflict');assert.ok(m.scoreNote);}assert.match(m.sourceUrl,/meet.sports.or.kr/);}
  assert.equal(new URL(doc.querySelector('.dv2-metric[href*="view=rosters"]').href).searchParams.get('view'),'rosters');doc.querySelector('.kvl1180-tabs a[data-view=rosters]').click();assert.equal(new URL(w.location.href).searchParams.get('view'),'rosters');assert.equal(doc.querySelectorAll('.kvl1180-participant-button').length,n);
  const input=doc.querySelector('.dv2-participant-search input');input.value=d.participants[0].region;input.dispatchEvent(new w.Event('input'));assert.equal(doc.querySelectorAll('.kvl1180-participant-button:not([hidden])').length,1);
  input.value='';input.dispatchEvent(new w.Event('input'));const card=doc.querySelector('.kvl1180-participant-button');assert.equal(new URL(card.href).searchParams.get('view'),'rosters');card.click();assert.ok(doc.querySelectorAll('[data-roster-player]').length);const teamURL=doc.querySelector('.kvl1180-team-profile-meta a').href;assert.equal(new URL(teamURL).searchParams.get('view'),'team');w.history.replaceState(null,'',teamURL);w.dispatchEvent(new w.PopStateEvent('popstate'));w.KVLDomesticHomeV2.apply(d);assert.equal(new URL(w.location.href).searchParams.get('view'),'team');assert.match(doc.querySelector('[data-kvl-component=team-results]').textContent,/경기결과/);const rosterLink=doc.querySelector('.kvl-team-actions [data-team-roster]');assert.ok(rosterLink);rosterLink.click();assert.equal(new URL(w.location.href).searchParams.get('view'),'rosters');assert.ok(doc.querySelectorAll('[data-roster-player]').length);
  doc.querySelector('.kvl1180-tabs a[data-view=overview]').click();doc.querySelector('[data-dv2-date]').click();assert.ok(doc.querySelector('dialog').open);assert.ok(doc.querySelectorAll('.dv2-day-match').length);doc.querySelector('[data-dv2-close]').click();assert.equal(doc.querySelector('dialog').open,false);
  doc.querySelector('.kvl1180-tabs a[data-view=knockout]').click();for(const a of doc.querySelectorAll('[data-division-link]'))assert.equal(new URL(a.href).searchParams.get('view'),'knockout');
 }finally{w.close();}
});
test('official source discrepancy is preserved and explained in schedule, bracket and calendar, without changing winners',()=>{
 const {w,doc,d}=setup('men-university','schedule');try{
  const m=d.matches.find(m=>m.dataStatus==='source-conflict');assert.equal(m.round,'FINAL');assert.deepEqual(m.officialMatchScore,{home:3,away:0});assert.deepEqual([m.score.home,m.score.away],[3,1]);assert.equal(m.scoreBasis,'official-set-detail-derived');assert.match(doc.querySelector(`[data-match-id="${m.id}"]`).textContent,/원문 간 불일치/);assert.match(doc.querySelector(`[data-tree-match="${m.id}"]`).textContent,/원문 간 불일치/);
  doc.querySelector('.kvl1180-tabs a[data-view=overview]').click();doc.querySelector(`[data-dv2-date="${m.date}"]`).click();assert.match(doc.querySelector('.dv2-day-matches').textContent,/원문 간 불일치/);
 }finally{w.close();}
});
test('tree validator rejects missing matches, wrong byes and broken advancement',()=>{
 const {w,d}=setup('men-general');try{
  const missing=structuredClone(d);missing.bracketRounds[0].slots[0]={byeTeam:'UNKNOWN'};assert.ok(api.validate(missing).length);
  const broken=structuredClone(d);broken.matches.find(m=>m.nextMatchId).nextMatchId=broken.matches.find(m=>m.round==='FINAL').id;assert.ok(api.validate(broken).some(s=>s.includes('progression')));
  const omitted=structuredClone(d);omitted.bracketRounds[0].slots=omitted.bracketRounds[0].slots.slice(1);assert.ok(api.validate(omitted).length);
 }finally{w.close();}
});
test('deprecated groups URLs fall back to overview and do not expose fictitious pool standings',()=>{const {w,doc}=setup('men-general','groups');try{assert.equal(w.KVLCompetitionTemplateV2.currentView(),'overview');assert.ok(doc.querySelector('#groups').hidden);assert.equal(doc.querySelector('.kvl1180-tabs a.is-active').dataset.view,'overview');}finally{w.close();}});

test('invalid official first-set score is retained separately and flagged in every result surface',()=>{const {w,doc,d}=setup('men-u18','schedule');try{const m=d.matches.find(m=>m.id==='KVL-M-NSF107-080301-088002');assert.equal(m.dataStatus,'source-conflict');assert.deepEqual(m.score.sets,[]);assert.deepEqual(m.reportedSets[0],{home:24,away:25});assert.deepEqual([m.score.home,m.score.away],[3,1]);assert.equal(d.sourceVerification.verifiedMatches,13);for(const selector of [`[data-match-id="${m.id}"]`,`[data-tree-match="${m.id}"]`])assert.match(doc.querySelector(selector).textContent,/24–25.*확인/);doc.querySelector('.kvl1180-tabs a[data-view=overview]').click();doc.querySelector(`[data-dv2-date="${m.date}"]`).click();assert.match(doc.querySelector('.dv2-day-matches').textContent,/24–25.*확인/);}finally{w.close();}});

for(const [key,n] of cases)test(key+' opens every official team roster with correct names, counts and source',()=>{
 const {w,doc,d}=setup(key,'rosters');try{
  assert.equal(doc.querySelectorAll('[data-roster-player]').length,0);
  for(const t of d.participants){
   const card=doc.querySelector(`.kvl1180-participant-button[data-team-code="${t.code}"]`);card.click();
   assert.equal(new URL(w.location.href).searchParams.get('team'),t.code);
   assert.equal(doc.querySelector('#kvl-roster-team').textContent,t.name);
   const players=d.rosters[t.code].players;
   assert.equal(doc.querySelectorAll('[data-roster-player]').length,t.rosterCount);
   assert.equal(t.rosterCount,players.length);
   assert.deepEqual([...doc.querySelectorAll('[data-roster-player] .kvl1180-roster-korean')].map(el=>el.textContent.replace(' ↗','')),players.map(p=>p.name).sort((a,b)=>a.localeCompare(b,'ko-KR')));
   assert.equal(doc.querySelector('.kvl1180-roster-source a').href,d.rosters[t.code].sourceUrl);
   assert.equal(doc.querySelectorAll('.kvl1180-roster-table a[data-player-id]').length,players.filter(p=>p.playerId).length);
   assert.equal(doc.querySelectorAll('.kvl1180-participant-button.is-active').length,1);
   assert.equal(doc.querySelector('.kvl1180-participant-button.is-active').dataset.teamCode,t.code);
   for(const a of doc.querySelectorAll('.kvl1180-roster-table a[data-player-id]'))assert.equal(new URL(a.href).searchParams.get('id'),a.dataset.playerId);
  }
  assert.equal(Object.keys(d.rosters).length,n);
  const target=d.participants[0];w.history.replaceState(null,'',w.KVLCompetitionTemplateV2.viewUrl('rosters',{team:target.code}));w.dispatchEvent(new w.PopStateEvent('popstate'));
  assert.equal(doc.querySelector('#kvl-roster-team').textContent,target.name);
  w.history.replaceState(null,'',w.KVLCompetitionTemplateV2.viewUrl('rosters',{team:'NOT-IN-THIS-DIVISION'}));w.dispatchEvent(new w.PopStateEvent('popstate'));
  assert.equal(doc.querySelectorAll('[data-roster-player]').length,0);
 }finally{w.close();}
});

test('671 source roster entries use existing IDs only after exact school/gender/grade matching',()=>{
 const audit=json('data/sources/national-sports-festival-2026/roster-link-audit.json');
 assert.deepEqual(audit.totals,{teams:60,players:671,linkedProfiles:154});
 assert.equal(audit.unlinked.length,517);
 const players=cases.flatMap(([key])=>Object.values(json(`data/competitions/national-sports-festival-${key}-2026/data.json`).rosters).flatMap(r=>r.players));
 assert.equal(players.length,671);assert.equal(new Set(players.filter(p=>p.playerId).map(p=>p.playerId)).size,154);
 for(const p of players){assert.equal(p.sourceId,'KVL-SRC-NSF107-RESULTS-2026');assert.ok(p.name&&p.affiliation&&p.position);assert.equal(p.number,undefined);assert.equal(p.heightCm,undefined);if(p.playerId)assert.equal(p.identityLinkBasis,'exact-name-affiliation-gender-grade-2026');}
 assert.equal(players.find(p=>p.affiliation==='인하대학교'&&p.name==='여광우').playerId,undefined);
});


test('mobile roster opens inline, replaces one team, survives search, resize, collapse and history',()=>{
 const {w,doc,d}=setup('women-u18','rosters');try{
  let mobile=true;w.matchMedia=()=>({matches:mobile});
  const cards=[...doc.querySelectorAll('.kvl1180-participant-button')],panel=doc.querySelector('#team-roster');
  cards[0].click();assert.equal(panel.previousElementSibling,cards[0]);assert.equal(cards[0].getAttribute('aria-expanded'),'true');
  cards[1].click();assert.equal(panel.previousElementSibling,cards[1]);assert.equal(cards[0].getAttribute('aria-expanded'),'false');assert.equal(doc.querySelectorAll('.kvl1180-team-profile').length,1);
  const input=doc.querySelector('.dv2-participant-search input');input.value='NO MATCH';input.dispatchEvent(new w.Event('input'));assert.ok(panel.hidden);input.value='';input.dispatchEvent(new w.Event('input'));assert.equal(panel.hidden,false);
  mobile=false;w.dispatchEvent(new w.Event('resize'));assert.equal(panel.previousElementSibling,doc.querySelector('[data-kvl-component=participants]'));
  mobile=true;w.dispatchEvent(new w.Event('resize'));assert.equal(panel.previousElementSibling,cards[1]);
  cards[1].click();assert.equal(doc.querySelectorAll('[data-roster-player]').length,0);assert.equal(new URL(w.location.href).searchParams.get('team'),null);assert.equal(cards[1].getAttribute('aria-expanded'),'false');
  w.history.replaceState(null,'',w.KVLCompetitionTemplateV2.viewUrl('rosters',{team:d.participants[0].code}));w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(doc.querySelectorAll('#team-roster').length,1);assert.equal(doc.querySelector('#kvl-roster-team').textContent,d.participants[0].name);
 }finally{w.close();}
});

test('common roster fields keep unknowns explicit and selected/all printing preserves snapshot names and grades',async()=>{
 const {w,doc,d}=setup('men-university','rosters');try{
  const t=d.participants.find(t=>t.name==='인하대학교');doc.querySelector(`[data-team-code="${t.code}"]`).click();
  assert.deepEqual([...doc.querySelectorAll('[role=columnheader]')].map(el=>el.textContent),['등번호','한글명','영문명','POS','생년월일','키','소속 · 학년','Volleybox']);
  for(const row of doc.querySelectorAll('[data-roster-player]')){
   for(const cls of ['no','name','dob'])assert.equal(row.querySelector('.kvl1180-roster-'+cls).textContent,'미확인');
   assert.equal(row.querySelector('.kvl1180-roster-height').textContent,'키 확인 불가');assert.equal(row.querySelector('.kvl1180-vb-link'),null);assert.ok(row.querySelector('[data-player-action-slot]').hidden);
  }
  assert.equal(doc.querySelectorAll('.kvl1180-print-actions button').length,2);
  Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});let printed=0;w.print=()=>printed++;
  await w.KVLCompetitionComponentsV2.printRoster(d,t.code,'selected');assert.equal(printed,1);assert.equal(doc.querySelectorAll('.kvl-print-sheet').length,1);assert.equal(doc.querySelectorAll('.kvl-print-row').length,d.rosters[t.code].players.length);assert.match(doc.querySelector('.kvl-print-table').textContent,/4학년/);
  const printedNames=[...doc.querySelectorAll('.kvl-print-row span:nth-child(2)')].map(el=>el.textContent);assert.deepEqual(printedNames,d.rosters[t.code].players.map(p=>p.name).sort((a,b)=>a.localeCompare(b,'ko-KR')));
  await w.KVLCompetitionComponentsV2.printRoster(d,t.code,'all');assert.equal(printed,2);assert.equal(doc.querySelectorAll('.kvl-print-sheet').length,11);assert.equal(doc.querySelectorAll('.kvl-print-row').length,129);
 }finally{w.close();}
});

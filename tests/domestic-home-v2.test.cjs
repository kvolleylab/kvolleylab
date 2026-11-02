const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const contract=require('../assets/js/kvl-competition-config-v2.js');
function setup(slug,{now}={}){const config=JSON.parse(read(`data/competitions/${slug}/config.json`)),source=JSON.parse(read(`data/competitions/${slug}/data.json`));const raw=contract.assemble(config,source,{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`});const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=${slug}`,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;if(now)w.Date.now=()=>Date.parse(now);w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));assert.deepEqual([...w.KVLCompetitionDataV2.validate(raw,{production:true})],[]);w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(raw);w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-match-calendar-v1.js'));w.eval(read('assets/js/kvl-domestic-home-v2.js'));return {dom,w,d:w.KVL_COMPETITION_V2_DATA};}
for(const slug of ['university-goseong-men-2026','university-goseong-women-2026','university-danyang-men-2026','university-danyang-women-2026','university-league-men-2026','university-league-women-2026'])test(slug+' keeps canonical data, pool membership, roster routes and knockout structure',()=>{const {dom,w,d}=setup(slug);try{const doc=w.document,old=JSON.stringify(d),bracket=doc.querySelector('[data-kvl-component=knockout]').innerHTML,standings=doc.querySelector('[data-kvl-component=standings]').innerHTML,links=[...doc.querySelectorAll('[data-kvl-component=participants] a')].map(a=>a.href);assert.equal(w.KVLDomesticHomeV2.apply(d),true);assert.equal(JSON.stringify(d),old);assert.equal(doc.querySelector('.dv2-utility'),null);const list=doc.querySelector('.kvl1180-hero>.dv2-hero-list');assert.ok(list);assert.equal(list.href,new URL(d.structure.hubUrl||'university-competitions.html',doc.baseURI).href);assert.equal(list.getAttribute('aria-label'),'대학배구 대회 목록');assert.equal(doc.querySelector('[data-kvl-component=knockout]').innerHTML,bracket);assert.equal(doc.querySelector('[data-kvl-component=standings]').innerHTML,standings);assert.deepEqual([...doc.querySelectorAll('[data-kvl-component=participants] a')].map(a=>a.href),links);assert.equal(doc.querySelectorAll('.dv2-metric[href]').length,3);assert.equal(doc.querySelector('.dv2-metric').href.includes('view=rosters'),true);assert.equal(doc.querySelector('[data-dv2-date]')!==null,true);const input=doc.querySelector('.dv2-participant-search input');input.value='없는학교';input.dispatchEvent(new w.Event('input'));assert.equal([...doc.querySelectorAll('.kvl1180-participant-group')].every(g=>g.hidden),true);input.value='';input.dispatchEvent(new w.Event('input'));assert.equal(doc.querySelectorAll('[data-kvl-component=participants] [data-team-code]:not([hidden])').length,d.participants.length);w.KVLDomesticHomeV2.apply(d);assert.equal(doc.querySelectorAll('.dv2-hero-list').length,1);assert.equal(doc.querySelectorAll('#dv2-day-dialog').length,1);}finally{w.close();}});
test('non-opted-in international engine is untouched',()=>{const {w,dom,d}=setup('vnl-men-2026');try{delete d.structure.presentation;const before=w.document.body.innerHTML;assert.equal(w.KVLDomesticHomeV2.apply(d),false);assert.equal(w.document.body.innerHTML,before);}finally{w.close();}});

test('U-league keeps the single-league label, flat participants and full season calendar',()=>{const {w,d}=setup('university-league-women-2026');try{const doc=w.document;w.KVLDomesticHomeV2.apply(d);assert.equal(doc.querySelector('.kvl1180-tabs [data-view=groups] span').textContent,'리그순위');const metric=doc.querySelectorAll('.dv2-metric[href]')[2];assert.equal(new URL(metric.href).searchParams.get('view'),'groups');assert.match(metric.textContent,/예선 최종 1위우석대/);assert.equal(doc.querySelectorAll('.dv2-flat-participants').length,1);assert.equal([...doc.querySelectorAll('.dv2-team-tile small')].some(e=>e.textContent==='여대부조'),false);assert.match(doc.querySelector('.dv2-calendar-month').textContent,/09/);for(let i=0;i<6;i++)doc.querySelector('[data-dv2-month="-1"]').click();assert.match(doc.querySelector('.dv2-calendar-month').textContent,/03/);for(let i=0;i<6;i++)doc.querySelector('[data-dv2-month="1"]').click();assert.ok(doc.querySelector('[data-dv2-date="2026-09-17"]'));assert.equal(doc.querySelector('[data-dv2-month="1"]').disabled,true);assert.equal(doc.querySelector('.kvl1180-bracket-ladder').classList.contains('is-bracket-4'),true);}finally{w.close();}});

for(const [label,now,status,expected,extendEnd] of [
 ['before the season','2026-02-15T12:00:00Z','active','03',false],
 ['during the season including an off month','2026-07-15T12:00:00Z','active','07',false],
 ['KST month rollover','2026-06-30T15:30:00Z','active','07',false],
 ['final month in KST','2026-09-30T15:30:00Z','active','10',false],
 ['ended despite stale active status','2026-11-01T00:00:00Z','active','10',false],
 ['completed uses last match, not planned end','2026-11-01T00:00:00Z','completed','10',true]
])test('calendar opens the relevant month: '+label,()=>{
 const {w,d}=setup('university-league-men-2026',{now});
 try{d.status=status;if(extendEnd)d.dateLabel='2026-03-25 ~ 2026-11-30';w.KVLDomesticHomeV2.apply(d);assert.equal(w.document.querySelector('.dv2-calendar-month').textContent,expected+'월');}finally{w.close();}
});
function overallSnapshot(doc){return [...doc.querySelectorAll('.is-domestic-overall>.kvl1180-combined-table>.kvl1180-combined-row')].map(row=>({team:row.querySelector('[data-team-results]').dataset.teamResults,rank:row.querySelector('.kvl1180-combined-rank').textContent,stats:[...row.querySelectorAll('.kvl1180-combined-stat')].map(e=>e.textContent)}));}
for(const gender of ['men','women'])test('Goseong '+gender+' renders every pool point ratio consistently with preliminary overall',()=>{
 const {w,d}=setup(`university-goseong-${gender}-2026`);try{
  const expected=new Map(d.standings.pools.flatMap(p=>p.rows.map(r=>[r.team.code,r.pointRatio])));
  const rows=[...w.document.querySelectorAll('.kvl1180-pool-row')];assert.equal(rows.length,expected.size);
  for(const row of rows){const code=row.querySelector('[data-team-results]').dataset.teamResults;assert.match(expected.get(code),/^\d+\.\d{3}$/);assert.equal(row.querySelectorAll('.kvl1180-pool-ratio')[1].textContent,expected.get(code));}
  for(const r of overallSnapshot(w.document))assert.equal(r.stats[5],expected.get(r.team));
  for(const row of w.document.querySelectorAll('.is-domestic-overall-mobile .kvl-shared-combined-line:not(.is-head)'))assert.equal(row.querySelectorAll('.kvl-shared-combined-stat')[6].textContent,expected.get(row.querySelector('[data-team-results]').dataset.teamResults));
 }finally{w.close();}
});
test('U-league preliminary overall counts only 49 A/B games',()=>{
 const {w}=setup('university-league-men-2026');try{
  const rows=overallSnapshot(w.document);assert.equal(rows.length,15);assert.equal(rows.reduce((n,r)=>n+Number(r.stats[0]),0),98);
  assert.deepEqual(rows.slice(0,6).map(r=>r.team),['INHA','HANYANG','JOONGBU','SKKU','KYONGGI','HONGIK']);
  assert.deepEqual(rows[0].stats,['6','6','0','100.0%','9.000','1.333']);assert.deepEqual(rows[1].stats,['7','7','0','100.0%','7.000','1.263']);
  const a=new Set(['INHA','SKKU','HONGIK','KYUNGHEE','MYONGJI','KYUNGIL','HONAM']);for(const r of rows)assert.equal(Number(r.stats[0]),a.has(r.team)?6:7);
 }finally{w.close();}
});
test('later league and knockout results cannot change preliminary overall',()=>{
 const {w,d}=setup('university-league-men-2026');try{
  const before=w.document.querySelector('.is-domestic-overall').innerHTML;
  for(const m of d.matches.filter(m=>m.stage!=='예선'))m.score={home:0,away:3,sets:[{home:1,away:25},{home:2,away:25},{home:3,away:25}]};
  d.matches.push({id:'later-stage-test',date:'2026-10-06',stage:'6강리그',pool:'6강',home:{code:'INHA'},away:{code:'UNLISTED'},score:{home:3,away:0,sets:[]}});
  w.KVLCompetitionComponentsV2.render();assert.equal(w.document.querySelector('.is-domestic-overall').innerHTML,before);
 }finally{w.close();}
});

test('six-team league displays official order, phase-only totals and the four semifinalists before the bracket',()=>{
 const {w,d}=setup('university-league-men-2026');try{
  const doc=w.document,section=doc.querySelector('[data-kvl-league-stage]'),rows=[...section.querySelectorAll('tbody tr')];
  assert.equal(section.nextElementSibling.className,'kvl1180-knockout-block');
  assert.equal(section.querySelector('h3').textContent,'6강리그 최종순위');
  assert.deepEqual(rows.map(r=>r.dataset.stageTeam),['INHA','HANYANG','HONGIK','SKKU','JOONGBU','KYONGGI']);
  assert.deepEqual(rows.map(r=>[...r.querySelectorAll('td[data-label]')].map(td=>td.textContent)),[
   ['5','5','0','15','5.000','1.208'],['5','4','1','12','2.600','1.057'],
   ['5','2','3','6','0.900','1.023'],['5','2','3','6','1.000','1.005'],
   ['5','2','3','5','0.500','0.975'],['5','0','5','1','0.133','0.755']
  ]);
  assert.deepEqual(rows.filter(r=>r.classList.contains('is-qualified')).map(r=>r.dataset.stageTeam),['INHA','HANYANG','HONGIK','SKKU']);
  assert.equal(rows.filter(r=>r.querySelector('.kvl-league-result').textContent==='리그 종료').length,2);
  assert.match(section.querySelector('.kvl-league-advance').textContent,/1위 인하대 vs 4위 성균관대/);
  assert.match(section.querySelector('.kvl-league-advance').textContent,/2위 한양대 vs 3위 홍익대/);
  assert.equal(section.querySelectorAll('tbody [data-team-results]').length,6);
  const original=JSON.stringify(d);w.KVLCompetitionComponentsV2.render();assert.equal(JSON.stringify(d),original);assert.equal(doc.querySelectorAll('[data-kvl-league-stage]').length,1);
 }finally{w.close();}
});
test('six-team league totals exclude preliminary and final rounds and label unfinished results correctly',()=>{
 const {w,d}=setup('university-league-men-2026');try{
  const before=w.document.querySelector('.kvl-league-table tbody').innerHTML;
  d.matches.filter(m=>m.stage!=='6강리그').forEach(m=>{m.score={home:3,away:0,sets:[{home:25,away:1},{home:25,away:2},{home:25,away:3}]};});
  w.KVLCompetitionComponentsV2.render();assert.equal(w.document.querySelector('.kvl-league-table tbody').innerHTML,before);
  d.matches.find(m=>m.stage==='6강리그').score=null;w.KVLCompetitionComponentsV2.render();
  assert.equal(w.document.querySelector('#kvl-league-stage-title').textContent,'6강리그 현재 순위');
  assert.match(w.document.querySelector('.kvl-league-head>p').textContent,/14\/15경기 완료/);
 }finally{w.close();}
});
test('league-stage presentation stays opt-in and is removed when disabled',()=>{
 for(const slug of ['university-league-women-2026','university-goseong-men-2026','university-danyang-men-2026']){
  const {w}=setup(slug);try{assert.equal(w.document.querySelector('[data-kvl-league-stage]'),null);}finally{w.close();}
 }
 const {w,d}=setup('university-league-men-2026');try{delete d.structure.knockout.leagueStage;w.KVLCompetitionComponentsV2.render();assert.equal(w.document.querySelector('[data-kvl-league-stage]'),null);}finally{w.close();}
});



for(const slug of ['v-league-men-2026-27','kovo-cup-women-2026','vnl-men-2026'])test(slug+' removes the utility row without adding a university list action',()=>{
 const {w,d}=setup(slug);try{
  const doc=w.document,before=JSON.stringify(d),hero=doc.querySelector('.kvl1180-hero').innerHTML;
  assert.equal(w.KVLDomesticHomeV2.apply(d),true);
  assert.equal(doc.querySelector('.dv2-utility'),null);
  assert.equal(doc.querySelector('.dv2-hero-list'),null);
  assert.equal(JSON.stringify(d),before);
  if(d.structure.heroPresentation==='preserve')assert.equal(doc.querySelector('.kvl1180-hero').innerHTML,hero);
 }finally{w.close();}
});
test('university hero list action preserves the configured hub destination',()=>{
 const {w,d}=setup('university-goseong-men-2026');try{
  d.structure.hubUrl='university-competitions.html?year=2026';
  w.KVLDomesticHomeV2.apply(d);
  assert.equal(w.document.querySelector('.dv2-hero-list').getAttribute('href'),d.structure.hubUrl);
 }finally{w.close();}
});

for(const slug of [
 'university-goseong-men-2026','university-goseong-women-2026',
 'university-danyang-men-2026','university-danyang-women-2026',
 'university-league-men-2026','university-league-women-2026',
 'v-league-men-2026-27','v-league-women-2026-27'
])test(slug+' shows the existing standings leaders in the third overview card',()=>{
 const league=slug.startsWith('v-league-'),source=JSON.parse(read(`data/competitions/${slug}/data.json`));
 const now=league?source.updatedAt:'2026-11-02T00:00:00Z';
 assert.ok(Number.isFinite(Date.parse(now)),'the fixture provides a stable snapshot time');
 const {w,d}=setup(slug,{now});
 try{
  const doc=w.document,before=JSON.stringify(d),standings=doc.querySelector('[data-kvl-component=standings]').innerHTML,knockout=doc.querySelector('[data-kvl-component=knockout]').innerHTML;
  const grouped=d.structure.standings.mode!=='single-league',groups=grouped?d.standings.pools:[{rows:d.standings.rows}];
  const leaders=groups.map(g=>{const rows=g.rows.filter(r=>r.rank===1);assert.equal(rows.length,1);return {group:g,row:rows[0]};});
  const expected=leaders.map(({group,row})=>{
   const code=row.team?.code||row.teamCode,t=d.participants.find(t=>t.code===code);assert.ok(t);
   return {code,name:t.name||t.fullName,prefix:league?(d.regularSeasonComplete===true?'정규리그 1위':'현재 1위'):grouped?String(group.id).replace(/조$/,'')+'조 1위':'예선 최종 1위'};
  });
  const state=league&&d.regularSeasonComplete!==true?'active':'completed';
  assert.equal(w.KVLDomesticHomeV2.selectOverviewStanding(d,Date.parse(now)).state,state);
  assert.equal(w.KVLDomesticHomeV2.apply(d),true);
  const cards=[...doc.querySelectorAll('.dv2-metrics>.dv2-metric')],card=cards[2];
  assert.equal(cards.length,4);assert.equal(doc.querySelectorAll('.dv2-metric[href]').length,3);
  assert.equal(doc.querySelectorAll('a.dv2-standing-metric').length,1);assert.equal(card.matches('a.dv2-standing-metric'),true);
  assert.equal(card.dataset.standingState,state);
  assert.deepEqual([...card.querySelectorAll('[data-standing-leader]')].map(e=>({code:e.dataset.standingLeader,name:e.querySelector('.dv2-standing-team').textContent,prefix:e.querySelector('.dv2-standing-prefix').textContent})),expected);
  assert.equal(card.querySelector('.dv2-standing-label').textContent,league?'정규리그 순위':grouped?'예선 조별 현황':'예선 순위');
  assert.equal(card.querySelector('.dv2-standing-detail').textContent,league?`승점 ${leaders[0].row.points}점`:grouped?'예선 최종 순위':'예선 종료');
  assert.equal(card.querySelector('.dv2-standing-cta').textContent.replace('›','').trim(),league?'전체 순위 보기':grouped?'조편성·순위 보기':'예선 순위 보기');
  const target=new URL(card.href);assert.equal(target.searchParams.get('competition'),slug);assert.equal(target.searchParams.get('view'),'groups');
  assert.equal(cards[0].querySelector('strong').textContent,`${d.participants.length}팀`);assert.equal(new URL(cards[0].href).searchParams.get('view'),'rosters');
  assert.equal(cards[1].querySelector('strong').textContent,`${d.matches.length}경기`);assert.equal(new URL(cards[1].href).searchParams.get('view'),'schedule');
  assert.equal(cards[3].classList.contains('dv2-venue'),true);
  assert.equal(doc.querySelector('[data-kvl-component=standings]').innerHTML,standings);
  assert.equal(doc.querySelector('[data-kvl-component=knockout]').innerHTML,knockout);
  w.KVLDomesticHomeV2.apply(d);assert.equal(doc.querySelectorAll('a.dv2-standing-metric').length,1);
  assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});

for(const [slug,title,kind,unit,view] of [
 ['kovo-cup-men-2026','예선 조 편성','pools','개 조','groups'],
 ['kovo-cup-women-2026','예선 조 편성','pools','개 조','groups'],
 ['school-spring-2026-middle-men','예선 조 편성','pools','개 조','groups'],
 ['national-sports-festival-men-university-2026','최종순위','ranking','팀','knockout'],
 ['vnl-men-2026','파이널 진출','qualifiers','개국','knockout']
])test(slug+' keeps its existing overview card outside the university/V-league scope',()=>{
 const {w,d}=setup(slug,{now:'2026-11-02T00:00:00Z'});
 try{
  const doc=w.document,before=JSON.stringify(d);
  assert.equal(w.KVLDomesticHomeV2.selectOverviewStanding(d,Date.parse('2026-11-02T00:00:00Z')),null);
  w.KVLDomesticHomeV2.apply(d);
  const metric=doc.querySelectorAll('.dv2-metric[href]')[2],count=kind==='pools'?d.standings.pools.length:kind==='ranking'?d.finalRanking.length:d.knockoutTeamCount;
  assert.equal(doc.querySelector('.dv2-standing-metric'),null);assert.equal(doc.querySelectorAll('.dv2-metric[href]').length,3);
  assert.equal(metric.querySelector('small').textContent,title);assert.equal(metric.querySelector('strong').textContent,`${count}${unit}`);
  assert.equal(new URL(metric.href).searchParams.get('view'),view);assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});

// Pure standing-selection regressions use only the public selector and synthetic records.
const standingNow=Date.parse('2026-11-02T00:00:00Z');
const selectStanding=(()=>{
 const context={window:{addEventListener(){}},document:{addEventListener(){}}};
 require('node:vm').runInNewContext(read('assets/js/kvl-domestic-home-v2.js'),context);
 return (d,now=standingNow)=>JSON.parse(JSON.stringify(context.window.KVLDomesticHomeV2.selectOverviewStanding(d,now)));
})();
function standingFixture(kind='pools'){
 const grouped=kind==='pools',league=kind==='vleague',participants=['A','B','C','D'].slice(0,grouped?4:2).map(code=>({code,name:'팀 '+code}));
 const row=(code,rank)=>({rank,team:{code},games:1,wins:rank===1?1:0,losses:rank===1?0:1,points:rank===1?3:0});
 const pools=[{id:'A',matchCount:1,rows:[row('A',1),row('B',2)]},{id:'B',matchCount:1,rows:[row('C',1),row('D',2)]}];
 const matches=pools.slice(0,grouped?2:1).map((p,i)=>({id:'standing-fixture-'+i,date:'2026-11-01',time:'14:00',stage:league?'1라운드':'예선',pool:p.id,home:{code:p.rows[0].team.code},away:{code:p.rows[1].team.code},status:'completed',score:{home:3,away:0,sets:[{home:25,away:10},{home:25,away:12},{home:25,away:14}]}}));
 return {competitionId:league?'KVL-COMP-VLEAGUE-FIXTURE-2026-27':'KVL-COMP-UNIV-FIXTURE-2026',competitionFamily:league?'pro':'domestic',status:league?'active':'completed',structure:{presentation:'domestic-home-v2',presentationCategory:league?'pro-league':'university',standings:{mode:grouped?'pools-combined':'single-league'}},participants,standings:grouped?{pools}:{rows:pools[0].rows},matches,...(league?{regularSeasonComplete:false,automation:{source:'KOVO_PUBLIC_STAT_API',standingsSource:'synthetic-standing-fixture',completedMatches:1}}:{})};
}
function unplayedStandingFixture(kind,date='2026-11-03',status='scheduled'){
 const d=standingFixture(kind);d.status='active';
 for(const m of d.matches){m.date=date;m.time='08:00';m.status=status;delete m.score;}
 for(const r of d.standings.rows||d.standings.pools.flatMap(p=>p.rows)){r.rank=null;r.games=0;r.wins=0;r.losses=0;r.points=0;}
 if(d.automation)d.automation.completedMatches=0;
 return d;
}
function assertStandingPending(d,now=standingNow){
 const before=JSON.stringify(d),result=selectStanding(d,now);
 assert.equal(result.state,'pending');assert.deepEqual(result.rows,[{prefix:'',teamName:'순위 확인 중',teamCode:null}]);assert.equal(result.detail,'');
 assert.equal(JSON.stringify(d),before);
}
function freezeStandingInput(value){
 Object.freeze(value);for(const child of Object.values(value))if(child&&typeof child==='object'&&!Object.isFrozen(child))freezeStandingInput(child);return value;
}

test('standing leaders follow the supplied rank, even with tied points and reversed rows',()=>{
 for(const kind of ['pools','single','vleague']){
  const d=standingFixture(kind),groups=d.standings.pools||[{rows:d.standings.rows}],expected=groups.map(g=>g.rows.find(r=>r.rank===1).team.code);
  for(const g of groups){g.rows[1].points=g.rows[0].points;g.rows.reverse();}
  const before=JSON.stringify(d),result=selectStanding(freezeStandingInput(d));
  assert.equal(result.state,kind==='vleague'?'active':'completed');assert.deepEqual(result.rows.map(r=>r.teamCode),expected);assert.equal(JSON.stringify(d),before);
 }
});
test('a supplied zero-point V-league leader is displayed as zero without replacing the ranking',()=>{
 const d=standingFixture('vleague');d.standings.rows[0].points=0;
 const result=selectStanding(d);assert.equal(result.state,'active');assert.equal(result.rows[0].teamCode,'A');assert.equal(result.detail,'승점 0점');
});
for(const kind of ['pools','single','vleague'])test(kind+' shows a pre-season card before the first match instead of inventing a leader',()=>{
 const d=unplayedStandingFixture(kind),before=JSON.stringify(d),result=selectStanding(d);
 assert.equal(result.state,'upcoming');assert.ok(result.rows.every(r=>r.teamCode===null));
 assert.deepEqual(result.rows,kind==='pools'?[{prefix:'A조',teamName:'2팀',teamCode:null},{prefix:'B조',teamName:'2팀',teamCode:null}]:[{prefix:'',teamName:kind==='vleague'?'개막 전':'예선 시작 전',teamCode:null}]);
 assert.equal(result.detail,kind==='pools'?'예선 시작 전':'');assert.equal(JSON.stringify(d),before);
});
for(const kind of ['pools','vleague'])test(kind+' with a live first match and no finished results stays pending',()=>{
 assertStandingPending(unplayedStandingFixture(kind,'2026-11-02','live'));
});
for(const [label,edit] of [
 ['an elapsed preliminary match without a confirmed result',d=>{delete d.matches[0].score;d.matches[0].status='scheduled';}],
 ['a result explicitly marked unverified',d=>{d.matches[0].scoreVerification=false;}],
 ['standing games that disagree with finished matches',d=>{d.standings.pools[0].rows[0].games=2;}],
 ['standing wins/losses that disagree with finished matches',d=>{d.standings.pools[0].rows[0].wins=2;d.standings.pools[0].rows[0].games=2;}],
 ['two rank-one rows in one pool',d=>{d.standings.pools[0].rows[1].rank=1;}],
 ['a pool without a rank-one row',d=>{d.standings.pools[0].rows[0].rank=null;}],
 ['a team repeated in another pool',d=>{d.standings.pools[1].rows[0].team.code='A';}]
])test('standing card is pending for '+label,()=>{
 const d=standingFixture();assert.equal(selectStanding(d).state,'completed');edit(d);assertStandingPending(d);
});
for(const [label,edit] of [
 ['missing official standings evidence',d=>{delete d.automation.standingsSource;}],
 ['a stale official completed-match count',d=>{d.automation.completedMatches=0;}],
 ['ambiguous rank one',d=>{d.standings.rows[1].rank=1;}],
 ['unavailable leader points',d=>{delete d.standings.rows[0].points;}]
])test('V-league standing card is pending for '+label,()=>{
 const d=standingFixture('vleague');assert.equal(selectStanding(d).state,'active');edit(d);assertStandingPending(d);
});
for(const now of [NaN,Infinity,-Infinity])test('an invalid standing snapshot time is pending: '+String(now),()=>{
 assertStandingPending(standingFixture(),now);
});
for(const kind of ['pools','single','vleague'])test(kind+' ignores later phases and final rankings when selecting preliminary/regular leaders',()=>{
 const d=standingFixture(kind),expected=selectStanding(d),stages=kind==='vleague'?['준플레이오프','플레이오프','챔피언결정전']:['6강리그','준결승','결승'];
 d.matches.push(...stages.map((stage,i)=>({id:'later-standing-fixture-'+i,date:'2026-11-01',stage,home:{code:'UNLISTED'},away:{code:'B'},score:{home:3,away:0},scoreVerification:false})));
 d.finalRanking=[{rank:1,code:'B',team:'팀 B'}];
 const before=JSON.stringify(d);assert.deepEqual(selectStanding(d),expected);assert.equal(JSON.stringify(d),before);
});
for(const kind of ['pools','single'])for(const status of ['postponed','연기'])test(kind+' keeps current standings while a '+status+' preliminary match remains',()=>{
 const d=standingFixture(kind);assert.equal(selectStanding(d).state,'completed');
 const delayed={...d.matches[0],id:'delayed-standing-fixture',date:'2026-11-03',status};delete delayed.score;d.matches.push(delayed);
 if(d.standings.pools)d.standings.pools[0].matchCount++;
 const result=selectStanding(d);assert.equal(result.state,'active');assert.ok(result.rows.every(r=>r.teamCode));assert.equal(result.detail,kind==='pools'?'현재 조별 순위':'현재 예선 순위');
 assert.ok(result.rows.every(r=>!r.prefix.includes('최종')));
});
test('V-league regular-season completion requires its explicit flag and every required regular result',()=>{
 const d=standingFixture('vleague');assert.equal(selectStanding(d).rows[0].prefix,'현재 1위');
 d.regularSeasonComplete=true;
 const complete=selectStanding(d);assert.equal(complete.state,'completed');assert.equal(complete.rows[0].prefix,'정규리그 1위');
 d.matches.push({id:'remaining-regular-fixture',date:'2026-11-03',time:'14:00',stage:'2라운드',home:{code:'B'},away:{code:'A'},status:'scheduled'});
 assertStandingPending(d);
});

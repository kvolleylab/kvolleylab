'use strict';
// Integration uses an unchanged actual collector candidate. The separate,
// explicitly synthetic contract cases below are regression tests, not live evidence.
// jsdom exercises existing DOM/data behavior at desktop/mobile breakpoints; it
// does not claim to verify pixel layout, browser networking, or a live deployment.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const candidateRoot=process.env.KVL_VLEAGUE_CANDIDATE_ROOT;

// Independent candidate contract: do not obtain expected values from the
// production matchSummaryState being tested, or accept both VS and — blindly.
function expectedSummary(match,now){
 assert(Number.isFinite(now),'summary clock must be the candidate observation time');
 if(match.status==='final')return {kind:'final',label:'종료',score:match.score,sets:match.score.sets};
 const kickoff=match.time?Date.parse(`${match.date}T${match.time}:00+09:00`):null;
 assert(kickoff===null||Number.isFinite(kickoff),'candidate kickoff must be valid');
 const regular=/^023:001:(MALE|FEMALE):\d+$/.test(match.officialSourceKey||'');
 if(match.status==='live'){
  const score=match.liveScore,observed=Date.parse(score?.observedAt||'');
  assert(regular&&score&&score.sourceKey===match.officialSourceKey,'live candidate must identify the same official game');
  const source=new URL(match.source);
  assert.equal(source.origin,'https://user-api.kovo.co.kr');
  assert.equal(source.pathname,'/stat/game-schedule');
  assert(Number.isFinite(observed)&&observed<=now+60000,'live candidate must have a valid observation time');
  assert.equal(new Date(observed+9*3600000).toISOString().slice(0,10),match.date,'observation must belong to the match day');
  assert([score.home,score.away].every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&Math.min(score.home,score.away)<3,'live counters must be valid');
  assert.equal(score.finalPending===true,Math.max(score.home,score.away)===3,'three wins require pending final confirmation');
  const stale=now-observed>=30*60000;
  return {kind:stale?'stale':'live',label:stale?'갱신 지연':score.finalPending?'종료 확인 중':'진행 중',
   score:stale?null:score,sets:match.liveSets||[],observedAt:score.observedAt,historicalScore:stale?score:null};
 }
 assert(!match.liveScore&&!match.liveSets?.length,'non-live candidate must not carry live observations');
 if(match.status==='suspended')return {kind:'waiting',label:'경기 중단',score:null,sets:[]};
 assert.equal(match.status,'scheduled','unexpected nonfinal candidate status');
 if(kickoff!==null&&now>=kickoff){
  const stale=regular&&now-kickoff>=30*60000;
  return {kind:stale?'stale':'waiting',label:stale?'갱신 지연':'상태 확인 중',score:null,sets:[],missing:stale};
 }
 return {kind:'scheduled',label:'예정',score:null,sets:[]};
}

function assertSummary(anchor,match,now,kind){
 const expected=expectedSummary(match,now);
 assert.equal(anchor.querySelector('.dv2-summary-score').textContent,
  expected.score?`${expected.score.home} : ${expected.score.away}`:expected.kind==='scheduled'?'VS':'—');
 if(kind==='next'){
  const badge=anchor.parentElement.querySelector('[data-match-state]');
  assert(badge,'next match must expose its state');
  assert.equal(badge.dataset.matchState,expected.kind);
  const today=new Date(now+9*3600000).toISOString().slice(0,10);
  assert.equal(badge.textContent,expected.kind==='final'&&match.date!==today?'경기 종료':expected.label);
 }
 const points=[...anchor.querySelectorAll('.dv2-summary-sets > span')];
 assert.deepEqual(points.map(s=>s.textContent),expected.sets.map(s=>`${s.home}–${s.away}`));
 points.forEach((point,i)=>{
  assert.equal(point.getAttribute('title'),`${i+1}세트`);
  assert.equal(point.getAttribute('aria-label'),`${i+1}세트 ${expected.sets[i].home} 대 ${expected.sets[i].away}`);
 });
 const detail=anchor.querySelector('.dv2-summary-venue').textContent;
 if(expected.observedAt){
  const time=new Date(Date.parse(expected.observedAt)+9*3600000).toISOString().slice(11,16);
  assert(detail.includes(`${time} KST`),'show the actual KST observation time');
  if(expected.historicalScore){
   assert(detail.startsWith('마지막 확인 '));
   assert(detail.includes(`당시 ${expected.historicalScore.home} : ${expected.historicalScore.away}`));
  }else{
   assert(detail.startsWith('세트 승수 · '));
   if(expected.score.finalPending)assert(detail.includes('최종 결과 미확정'));
  }
 }
 if(expected.missing)assert(detail.includes('최종 관측 없음'));
 if(expected.kind==='waiting')assert.equal(detail,'공식 경기 상태 확인 중');
 const setContainer=anchor.querySelector('.dv2-summary-sets');
 if(setContainer)assert.equal(setContainer.getAttribute('aria-label'),
  expected.kind==='final'?'세트별 점수':expected.kind==='stale'?'마지막 관측 세트별 점수':'종료 세트별 점수');
}

// Synthetic time/state boundaries guard the checker itself. These do not enter
// the official candidate, MASTER, public JSON, or any live acceptance evidence.
const kickoff=Date.parse('2026-11-21T16:00:00+09:00');
const unobserved={status:'scheduled',date:'2026-11-21',time:'16:00',officialSourceKey:'023:001:FEMALE:38'};
for(const [offset,kind,label] of [[-1,'scheduled','예정'],[0,'waiting','상태 확인 중'],[13000,'waiting','상태 확인 중'],[1799999,'waiting','상태 확인 중'],[1800000,'stale','갱신 지연']]){
 test(`synthetic candidate contract: unobserved kickoff ${offset}ms`,()=>{
  const expected=expectedSummary(unobserved,kickoff+offset);
  assert.equal(expected.kind,kind);assert.equal(expected.label,label);
  assert.equal(expected.score,null);assert.deepEqual(expected.sets,[]);
 });
}
function syntheticLive(home=0,away=2){return {...unobserved,status:'live',source:'https://user-api.kovo.co.kr/stat/game-schedule?gender=2',
 liveScore:{home,away,sourceKey:unobserved.officialSourceKey,observedAt:new Date(kickoff).toISOString(),...(Math.max(home,away)===3?{finalPending:true}:{})},
 liveSets:[{home:23,away:25,status:'completed'},{home:21,away:25,status:'completed'}].slice(0,home+away)};}
for(const [home,away] of [[0,1],[0,2],[1,3]])for(const age of [1799999,1800000]){
 test(`synthetic candidate contract: ${home}–${away} expires at 30 minutes (${age}ms)`,()=>{
  const match=syntheticLive(home,away),expected=expectedSummary(match,kickoff+age),stale=age===1800000;
  assert.equal(expected.kind,stale?'stale':'live');
  assert.equal(expected.label,stale?'갱신 지연':away===3?'종료 확인 중':'진행 중');
  assert.deepEqual(expected.score,stale?null:match.liveScore);
  assert.deepEqual(expected.historicalScore,stale?match.liveScore:null);
  assert.deepEqual(expected.sets,match.liveSets);
 });
}
for(const [name,edit] of [
 ['missing live score',m=>delete m.liveScore],
 ['wrong game',m=>m.liveScore.sourceKey='023:001:MALE:37'],
 ['wrong origin',m=>m.source='https://example.com/stat/game-schedule'],
 ['wrong endpoint',m=>m.source='https://user-api.kovo.co.kr/stat/other'],
 ['invalid time',m=>m.liveScore.observedAt='invalid'],
 ['future time',m=>m.liveScore.observedAt=new Date(kickoff+60001).toISOString()],
 ['wrong day',m=>m.liveScore.observedAt='2026-11-20T07:00:00Z'],
 ['invalid counter',m=>m.liveScore.away=4],
 ['unmarked third win',m=>m.liveScore.away=3],
 ['premature finalPending',m=>m.liveScore.finalPending=true],
 ['scheduled with leftover live score',m=>m.status='scheduled']
])test(`synthetic candidate contract rejects ${name}`,()=>{
 const match=syntheticLive();edit(match);assert.throws(()=>expectedSummary(match,kickoff));
});

if(!candidateRoot){
 test('V-league automatic-update candidate UI integration',{skip:'KVL_VLEAGUE_CANDIDATE_ROOT is not set; no collector candidate was supplied'},()=>{});
}else{
 const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
 const configApi=require('../assets/js/kvl-competition-config-v2.js');
 const modules=require('../assets/js/kvl-competition-modules-v2.js');
 const dataApi=require('../assets/js/kvl-competition-data-v2.js');
 const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
 const repoJson=relative=>JSON.parse(read(relative));
 const configs={},sources={},assembled={};
 for(const gender of ['men','women']){
  const slug=`v-league-${gender}-2026-27`,base=`data/competitions/${slug}/`;
  configs[gender]=repoJson(base+'config.json');
  sources[gender]=JSON.parse(fs.readFileSync(path.join(path.resolve(candidateRoot),base+'data.json'),'utf8'));
  assert.equal(sources[gender].automation?.source,'KOVO_PUBLIC_STAT_API','candidate must come from the verified official collector');
  const combined=configApi.assemble(configs[gender],sources[gender],{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`});
  assembled[gender]=modules.apply(combined,configs[gender].modules||[],(configs[gender].modules||[]).map(m=>repoJson(base+m.source)));
  assert.deepEqual(dataApi.validate(assembled[gender],{production:true}),[]);
 }
 const observedAt=Math.max(...Object.values(sources).map(d=>Date.parse(d.updatedAt)));
 assert(Number.isFinite(observedAt),'candidate has a real observation time');
 const originalCandidate=JSON.stringify(sources);

 function expectedPicks(gender){
  const eligible=sources[gender].matches.filter(m=>m.notRequired!==true&&!['postponed','cancelled','not_required'].includes(m.status));
  const stamp=m=>Date.parse(`${m.date}T${m.time}:00+09:00`);
  const ordered=list=>list.slice().sort((a,b)=>stamp(a)-stamp(b)||a.id.localeCompare(b.id));
  const today=new Date(observedAt+9*3600000).toISOString().slice(0,10),sameDay=ordered(eligible.filter(m=>m.date===today));
  assert(sameDay.length<=1,'this actual-season integration expects one match per division per date');
  return {recent:ordered(eligible.filter(m=>m.status==='final'&&m.score&&stamp(m)<=observedAt&&(!sameDay.length||m.date<today))).at(-1)||null,
          next:sameDay[0]||ordered(eligible.filter(m=>m.status==='scheduled'&&!m.score&&stamp(m)>=observedAt))[0]||null};
 }

 async function render(gender,width){
  const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{
   url:`https://kvolleylab.com/competition-engine.html?competition=v-league-${gender}-2026-27&view=overview`,
   runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,errors=[],requests=[];
  Object.defineProperty(w,'innerWidth',{value:width,configurable:true});
  Object.defineProperty(w.document.documentElement,'clientWidth',{value:width,configurable:true});
  w.Date.now=()=>observedAt;
  w.matchMedia=query=>({matches:/max-width\s*:\s*(\d+)px/.test(query)?width<=Number(query.match(/max-width\s*:\s*(\d+)px/)[1]):false,media:query,addListener(){},removeListener(){}});
  w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.addEventListener('error',event=>errors.push(event.error?.message||String(event.error)));
  w.KVL_COMPETITION_PAGE_V2={deferRender:true,production:true,collectionRoot:'/data/competitions/'};
  w.fetch=async input=>{
   const url=new URL(input,w.location.href),matched=url.pathname.match(/^\/data\/competitions\/v-league-(men|women)-2026-27\/(config|data)\.json$/);
   assert.equal(url.origin,'https://kvolleylab.com');assert(matched,`unexpected UI fetch: ${url.pathname}`);
   requests.push(url.pathname);
   return {ok:true,json:async()=>structuredClone(matched[2]==='config'?configs[matched[1]]:sources[matched[1]])};
  };
  for(const name of ['config','data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
  const d=w.KVLCompetitionDataV2.normalize(structuredClone(assembled[gender]));
  w.KVL_COMPETITION_V2_DATA=d;
  w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();
  w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-match-calendar-v1.js'));w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(d);
  await w.KVLDomesticHomeV2.matchesReady;
  return {w,doc:w.document,d,errors,requests};
 }

 for(const gender of ['men','women'])for(const width of [1180,390,360]){
  test(`${gender}: actual collector results, official standings and roster links at ${width}px`,async()=>{
   const {w,doc,d,errors,requests}=await render(gender,width);
   try{
    const regular=sources[gender].matches.filter(m=>/^[1-6]라운드$/.test(m.stage));
    const postseason=sources[gender].matches.filter(m=>['준플레이오프','플레이오프','챔피언결정전'].includes(m.stage));
    const finals=sources[gender].matches.filter(m=>m.status==='final'&&m.notRequired!==true);
    assert(finals.length>0,'a real completed match must be present for this integration test');
    assert.equal(regular.length,126,'postseason additions must preserve all regular-season fixtures');
    assert.equal(sources[gender].matches.length,regular.length+postseason.length);
    assert.equal(sources[gender].automation.completedMatches,regular.filter(m=>m.status==='final').length);
    assert.equal(doc.querySelectorAll('.kvl1180-match-row').length,regular.length+postseason.length);
    for(const match of postseason.filter(m=>m.notRequired===true||m.status==='not_required')){
     const row=doc.querySelector(`.kvl1180-match-row[data-match-id="${match.id}"]`);
     assert.equal(row.querySelector('.kvl1180-score').textContent,'미실시');assert.equal(row.querySelector('.is-upcoming'),null);
    }
    for(const match of finals){
     const row=doc.querySelector(`.kvl1180-match-row[data-match-id="${match.id}"]`);
     assert(row,`schedule contains ${match.id}`);
     assert.equal(row.querySelector('.kvl1180-score').textContent,`${match.score.home}-${match.score.away}`);
     assert.deepEqual([...row.querySelectorAll('.kvl1180-set-scores > span')].map(s=>s.textContent),match.score.sets.map(s=>`${s.home}-${s.away}`));
    }

    const expectedRows=sources[gender].standings.rows;
    assert.equal(expectedRows.length,7);
    const overviewRows=[...doc.querySelectorAll('.dv2-standings-table tbody tr')];
    assert.equal(overviewRows.length,7);
    assert.deepEqual(overviewRows.map(row=>row.dataset.standingTeam),expectedRows.map(row=>row.team.code));
    for(let i=0;i<expectedRows.length;i++)for(const stat of ['rank','points','wins','losses']){
     assert.equal(overviewRows[i].querySelector(`[data-stat="${stat}"]`).textContent,String(expectedRows[i][stat]??'—'));
    }
    const detailRows=[...doc.querySelectorAll('.is-domestic-single-league .kvl1180-combined-row')];
    const mobileRows=[...doc.querySelectorAll('.is-domestic-single-league .kvl-shared-combined-line:not(.is-head)')];
    assert.equal(detailRows.length,7);assert.equal(mobileRows.length,7);
    for(let i=0;i<expectedRows.length;i++){
     const expected=expectedRows[i];
     assert.equal(detailRows[i].querySelector('.kvl1180-combined-rank').textContent,expected.rank==null?'-':`${expected.rank}위`);
     assert.deepEqual([...detailRows[i].querySelectorAll('.kvl1180-combined-stat')].map(s=>s.textContent),
                      [expected.wins,expected.losses,expected.points,expected.setRatio,expected.pointRatio].map(String));
     assert.equal(mobileRows[i].querySelector('.kvl-shared-combined-rank').textContent,expected.rank==null?'-':`${expected.rank}위`);
     assert.deepEqual([...mobileRows[i].querySelectorAll('.kvl-shared-combined-stat')].map(s=>s.textContent),
                      [expected.wins,expected.losses,expected.points].map(String));
    }
    assert.equal(doc.querySelector('.dv2-standings-note').textContent,sources[gender].standingsNote);

    // Both division cards must use this same candidate snapshot, including the
    // asynchronously fetched peer. No network or published stale JSON is used.
    for(const division of ['men','women']){
     const card=doc.querySelector(`[data-summary-gender="${division}"]`),picks=expectedPicks(division);
     assert(card);assert(!card.querySelector('.dv2-summary-error'));
     for(const kind of ['recent','next']){
      const anchor=card.querySelector(`[data-kind="${kind}"] .dv2-summary-game`),match=picks[kind];
      if(!match){assert.equal(anchor,null);continue;}
      assert.equal(anchor.dataset.matchId,match.id);
      if(kind==='next'&&match.date===new Date(observedAt+9*3600000).toISOString().slice(0,10))assert.match(anchor.parentElement.querySelector('h4').textContent,/오늘 경기/);
      const href=new URL(anchor.href);
      assert.equal(href.searchParams.get('competition'),`v-league-${division}-2026-27`);
      assert.equal(href.searchParams.get('date'),match.date);assert.equal(href.searchParams.get('view'),'schedule');
      assertSummary(anchor,match,observedAt,kind);
     }
    }
    const peer=gender==='men'?'women':'men';
    assert.deepEqual(requests,[`/data/competitions/v-league-${peer}-2026-27/config.json`,`/data/competitions/v-league-${peer}-2026-27/data.json`]);

    const tiles=[...doc.querySelectorAll('.dv2-team-tile')];
    assert.equal(tiles.length,7);
    assert.deepEqual(tiles.map(a=>new URL(a.href).searchParams.get('team')),Array.from(d.previousSeasonRanking.rows,r=>r.teamCode));
    for(const tile of tiles){
     const href=new URL(tile.href);
     assert.equal(href.origin,'https://kvolleylab.com');assert.equal(href.pathname,'/competition-engine.html');
     assert.equal(href.searchParams.get('competition'),`v-league-${gender}-2026-27`);
     assert.equal(href.searchParams.get('view'),'rosters');assert.equal(href.hash,'#team-roster');
    }
    doc.querySelector('.kvl1180-tabs [data-view="rosters"]').click();
    for(const team of d.participants){
     assert(dataApi.rosterTarget(d,team).available);
     const button=doc.querySelector(`[data-team-code="${team.code}"]`);assert(button);button.click();
     assert.equal(doc.querySelector('#kvl-roster-team').textContent,team.name);
     const roster=doc.querySelector('#team-roster');
     assert.equal(roster.querySelectorAll('[data-roster-player]').length,d.rosters[team.code].players.length);
     for(const link of roster.querySelectorAll('a[href*="player.html"]')){
      const href=new URL(link.href),id=href.searchParams.get('id');
      assert.equal(href.origin,'https://kvolleylab.com');assert.equal(href.pathname,'/player.html');
      assert(d.rosters[team.code].players.some(p=>p.playerId===id),'profile ID stays attached to this roster');
     }
    }
    assert.deepEqual(errors,[]);
    assert.equal(JSON.stringify(sources),originalCandidate,'UI rendering must not mutate either candidate division');
   }finally{w.close();}
  });
 }
}

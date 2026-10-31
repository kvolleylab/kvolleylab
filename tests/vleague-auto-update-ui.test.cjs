'use strict';
// Integration-only: use an actual collector candidate, never fabricated scores.
// jsdom exercises existing DOM/data behavior at desktop/mobile breakpoints; it
// does not claim to verify pixel layout, browser networking, or a live deployment.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const candidateRoot=process.env.KVL_VLEAGUE_CANDIDATE_ROOT;

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
  const eligible=sources[gender].matches.filter(m=>!['live','postponed','cancelled'].includes(m.status));
  const stamp=m=>Date.parse(`${m.date}T${m.time}:00+09:00`);
  const ordered=list=>list.slice().sort((a,b)=>stamp(a)-stamp(b)||a.id.localeCompare(b.id));
  return {recent:ordered(eligible.filter(m=>m.status==='final'&&m.score&&stamp(m)<=observedAt)).at(-1)||null,
          next:ordered(eligible.filter(m=>m.status==='scheduled'&&!m.score&&stamp(m)>=observedAt))[0]||null};
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
  w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(d);
  await w.KVLDomesticHomeV2.matchesReady;
  return {w,doc:w.document,d,errors,requests};
 }

 for(const gender of ['men','women'])for(const width of [1180,390,360]){
  test(`${gender}: actual collector results, official standings and roster links at ${width}px`,async()=>{
   const {w,doc,d,errors,requests}=await render(gender,width);
   try{
    const finals=sources[gender].matches.filter(m=>m.status==='final');
    assert(finals.length>0,'a real completed match must be present for this integration test');
    assert.equal(sources[gender].automation.completedMatches,finals.length);
    assert.equal(doc.querySelectorAll('.kvl1180-match-row').length,126);
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
                      [`${expected.wins}승`,String(expected.points),expected.setRatio,expected.pointRatio,expected.statusLabel]);
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
      const href=new URL(anchor.href);
      assert.equal(href.searchParams.get('competition'),`v-league-${division}-2026-27`);
      assert.equal(href.searchParams.get('date'),match.date);assert.equal(href.searchParams.get('view'),'schedule');
      if(kind==='recent'){
       assert.equal(anchor.querySelector('.dv2-summary-score').textContent,`${match.score.home} : ${match.score.away}`);
       assert.deepEqual([...anchor.querySelectorAll('.dv2-summary-sets > span')].map(s=>s.textContent),match.score.sets.map(s=>`${s.home}–${s.away}`));
      }else{
       assert.equal(anchor.querySelector('.dv2-summary-score').textContent,'VS');
       assert(!sources[division].matches.filter(m=>m.status==='final').some(m=>m.id===match.id),'completed game cannot remain next');
      }
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

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const contract=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js');
const Matrix=require('../assets/js/kvl-vleague-matrix-core-v1.js');
const historical=require('./fixtures/vleague-matrix-20261114.json');
async function setup(slug='v-league-men-2026-27',{history=false,extension=true,domestic=false}={}){
  const base=`data/competitions/${slug}/`,config=json(base+'config.json'),source=json(base+'data.json');
  const gender=config.competition.gender;
  const initial=history?{...source,...structuredClone(historical[gender])}:source;
  const assembled=modules.apply(contract.assemble(config,initial,{slug,canonical:'https://kvolleylab.com/competition-engine.html?competition='+slug}),config.modules||[],(config.modules||[]).map(m=>json(base+m.source)));
  const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:'https://kvolleylab.com/competition-engine.html?competition='+slug+'&view=groups',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,timers=[],errors=[];let fail=false;
  w.KVL_COMPETITION_PAGE_V2={deferRender:true,collectionRoot:'/data/competitions/'};
  w.matchMedia=()=>({matches:false});w.CSS={escape:s=>s};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.setInterval=(fn,ms)=>{timers.push({fn,ms});return timers.length;};w.clearInterval=()=>{};
  w.fetch=async input=>{if(fail)throw Error('Simulated read failure');return {ok:true,json:async()=>json(new URL(input,w.location.href).pathname.slice(1))};};
  w.addEventListener('error',e=>errors.push(e.message));
  for(const name of ['config','data','shell','template'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
  if(extension)for(const name of ['core-',''])w.eval(read(`assets/js/kvl-vleague-matrix-${name}v1.js`));
  w.eval(read('assets/js/kvl-competition-components-v2.js'));
  const d=w.KVLCompetitionDataV2.normalize(assembled);w.KVL_COMPETITION_V2_DATA=d;
  w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();
  if(domestic){
    for(const name of ['kvl-calendar-display-v1','kvl-match-calendar-v1','kvl-domestic-home-v2'])w.eval(read('assets/js/'+name+'.js'));
    w.KVLDomesticHomeV2.apply(d);await w.KVLDomesticHomeV2.matchesReady;
  }
  return {w,doc:w.document,d,source,config,timers,errors,fail:()=>{fail=true;}};
}
for(const gender of ['men','women'])test(gender+': matrix follows original standings; current official results and fixed team order are preserved',async()=>{
  const slug=`v-league-${gender}-2026-27`,a=await setup(slug),b=await setup(slug,{extension:false});
  try{
    const r=a.doc.querySelector('[data-kvl-component="standings"]'),before=JSON.stringify(a.d);
    assert.equal(r.firstElementChild.outerHTML,b.doc.querySelector('[data-kvl-component="standings"]').firstElementChild.outerHTML);
    assert(r.children[1].classList.contains('kvl-vleague-matrix'));
    assert.equal(a.doc.querySelectorAll('.matrix-table').length,6);assert.equal(a.doc.querySelectorAll('.matrix-self').length,42);
    const order=a.source.previousSeasonRanking.rows.map(t=>t.teamCode);
    for(const round of a.doc.querySelectorAll('.matrix-round')){
      assert.deepEqual([...round.querySelectorAll('tbody tr')].map(x=>x.dataset.team),order);
      assert.deepEqual([...round.querySelectorAll('thead th')].slice(4).map(x=>x.textContent),order.map(c=>a.config.structure.calendarDisplay.teamAliases[c]));
    }
    const model=Matrix.build(a.d,a.d),latest=model.rounds.filter(x=>x.started).at(-1);
    for(const t of latest.rows){const official=a.source.standings.rows.find(x=>x.team.code===t.code);assert.equal(t.points,official.points);assert.equal(t.rank,official.rank);}
    for(const m of a.source.matches.filter(m=>m.status==='final')){
      const r=Matrix.roundOf(m);
      assert.equal(a.doc.querySelector(`[data-round="${r}"] [data-team="${m.home.code}"] [data-opponent="${m.away.code}"]`).textContent,String(m.score.home));
      assert.equal(a.doc.querySelector(`[data-round="${r}"] [data-team="${m.away.code}"] [data-opponent="${m.home.code}"]`).textContent,String(m.score.away));
    }
    a.w.KVLCompetitionComponentsV2.refreshLiveMatches(true);
    assert.equal(a.doc.querySelectorAll('.kvl-vleague-matrix').length,1);assert.equal(JSON.stringify(a.d),before);assert.deepEqual(a.errors,[]);
    assert.equal(a.doc.querySelector('#groups').hidden,false);
    a.w.history.pushState({},'','?competition='+slug+'&view=schedule');a.w.KVLCompetitionTemplateV2.applyView();assert.equal(a.doc.querySelector('#groups').hidden,true);
  }finally{a.w.close();b.w.close();}
});
for(const slug of ['university-league-women-2026','vnl-men-2026','kovo-cup-men-2026'])test(slug+': shared competition output remains unchanged',async()=>{
  const a=await setup(slug),b=await setup(slug,{extension:false});
  try{assert.equal(a.doc.querySelector('.kvl-vleague-matrix'),null);assert.equal(a.doc.querySelector('[data-kvl-component="standings"]').innerHTML,b.doc.querySelector('[data-kvl-component="standings"]').innerHTML);}finally{a.w.close();b.w.close();}
});
test('existing five-minute publisher-data refresh replaces historical results in standings and matrix together, without changing rosters',async()=>{
  const a=await setup('v-league-women-2026-27',{history:true,domestic:true});
  try{
    const rosters=JSON.stringify(a.d.rosters),initial=Matrix.build(a.d,a.d).completed;
    assert.equal(initial,12);assert.equal(a.doc.querySelector('.matrix-round-state').textContent,'진행 중 · 12/21');
    const polls=a.timers.filter(t=>t.ms===300000);assert.equal(polls.length,2);for(const poll of polls)await poll.fn();
    const expected=a.source.matches.filter(m=>m.status==='final'&&Matrix.roundOf(m)).length;
    assert.equal(Matrix.build(a.d,a.d).completed,expected);assert(expected>initial);
    const first=Matrix.build(a.d,a.d).rounds[0];
    assert.equal(a.doc.querySelector('.matrix-round-state').textContent,`${first.complete?'라운드 종료':'진행 중'} · ${first.completed}/21`);
    assert.equal(a.doc.querySelectorAll('.kvl-vleague-matrix').length,1);
    assert.equal(JSON.stringify(a.d.rosters),rosters);assert.deepEqual(a.errors,[]);
    const lastGood=a.doc.querySelector('.kvl-vleague-matrix').innerHTML;
    a.fail();for(const poll of polls)await poll.fn();
    assert.equal(a.doc.querySelector('.kvl-vleague-matrix').innerHTML,lastGood);
    assert.equal(a.doc.querySelector('[data-summary-gender="women"] .dv2-summary-body').dataset.refreshFailed,'true');
  }finally{a.w.close();}
});
test('invalid matrix input does not prevent existing standings or other sections from rendering',async()=>{
  const a=await setup();try{
    delete a.d.previousSeasonRanking;a.w.KVLCompetitionComponentsV2.refreshLiveMatches(true);
    assert(a.doc.querySelector('.kvl-vleague-matrix .matrix-issue'));
    assert.equal(a.doc.querySelectorAll('.is-domestic-single-league .kvl1180-combined-row').length,7);
    assert.equal(a.doc.querySelectorAll('.kvl1180-match-row').length,a.source.matches.length);
  }finally{a.w.close();}
});

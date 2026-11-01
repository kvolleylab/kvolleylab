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
  assert.equal(doc.querySelector('.dv2-team-match-list').open,false);
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
  const before=doc.querySelector('#team-results').innerHTML;assert.equal(w.KVLDomesticHomeV2.apply(d),false);route(code);
  assert.equal(doc.querySelector('#team-results').innerHTML,before);assert.equal(doc.querySelector('[data-dv2-team-calendar]'),null);
 }finally{w.close();}
});

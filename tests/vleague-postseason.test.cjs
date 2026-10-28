'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js');
function setup(gender,transform){
 const slug=`v-league-${gender}-2026-27`,base=`data/competitions/${slug}/`,config=json(base+'config.json');
 const d=modules.apply(configApi.assemble(config,json(base+config.data),{slug}),config.modules||[],(config.modules||[]).map(m=>json(base+m.source)));
 if(transform)transform(d);
 const before=JSON.stringify(d),dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=${slug}&view=knockout`,runScripts:'outside-only'}),w=dom.window;
 w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(d);w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
 assert.equal(JSON.stringify(d),before,'rendering must not mutate the source');
 return {w,doc:w.document,d};
}
function ranked(d){d.status='completed';d.standings.rows=d.participants.slice(0,4).map((t,i)=>({rank:i+1,team:t.code,points:70-i*2}));}
function match(d,round,n,home,away,score){return {id:`qa-${round}-${n}`,round,stage:round,date:`2027-04-${String(n).padStart(2,'0')}`,time:'19:00',home:d.participants[home].code,away:d.participants[away].code,status:score?'completed':'scheduled',...(score?{score:{home:score[0],away:score[1]}}:{})};}
const wins=el=>[...el.querySelectorAll('.kvl1180-pro-series-wins')].map(e=>e.textContent);
for(const gender of ['men','women']){
 test(gender+': pending bracket is styled in the domestic skin and never invents pairings or scores',()=>{
  const {w,doc}=setup(gender);try{
   assert(doc.body.classList.contains('kvl-pro-league-domestic-v2'));
   const stages=[...doc.querySelectorAll('.kvl1180-pro-postseason-stage')];assert.equal(stages.length,3);
   assert.deepEqual(stages.map(s=>s.querySelectorAll('.kvl1180-pro-series-game').length),[1,3,5]);
   assert(stages.every(s=>wins(s).join('')==='——'));assert.equal(doc.querySelectorAll('.kvl1180-pro-series-team a').length,0);
   assert.equal(doc.querySelectorAll('.kvl1180-pro-series-status').length,3);
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
}
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

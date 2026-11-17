'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const view=require('../assets/js/kvl-vleague-roster-v2.js');
const bridgeApi=require('../assets/js/kvl-vleague-draft-bridge-v1.js');
const config=require('../assets/js/kvl-competition-config-v2.js'),mods=require('../assets/js/kvl-competition-modules-v2.js');
const source=json('data/kovo/official-notices/2026-27/draft_registration_bridge.json');
const schools=json('data/draft-applicants/2026-27/education-v1.json');
const bridge=bridgeApi.withEducation(source,schools);
function load(g){
 const dir='data/competitions/v-league-'+g+'-2026-27/',c=json(dir+'config.json');
 const d=mods.apply(config.assemble(c,json(dir+c.data),{slug:'v-league-'+g+'-2026-27',canonical:'https://kvolleylab.com/competition-engine.html'}),c.modules||[],(c.modules||[]).map(m=>json(dir+m.source)));
 return bridgeApi.reconcileCurrent(d,bridge);
}
const men=load('men'),women=load('women');
function mount(d,teamCode){
 const dom=new JSDOM('<main id="target"></main>',{url:'https://kvolleylab.com/competition-engine.html?competition=v-league-men-2026-27&view=rosters'});
 const host=dom.window.document.getElementById('target');
 const t=d.participants.find(t=>t.code===teamCode);
 global.window=dom.window;
 global.window.KVLPlayerIdCollisionV1=require('../assets/js/player-id-collision-quarantine-v1.js');
 assert.equal(view.render(host,d,t,d.rosters[teamCode].players),true);
 return {dom,host};
}
test('native v2 roster displays official current club count and initial athlete',()=>{
 const {dom,host}=mount(men,'OKF');
 try{
  assert.match(host.textContent,/OK저축은행 선수명단/);
  assert.match(host.textContent,/공식 등록 공시 기준/);
  assert.equal(host.querySelectorAll('[data-choice]').length,men.rosters.OKF.players.length);
  assert.ok(host.querySelector('.kvlrv2-profile-link'));
 }finally{dom.window.close();delete global.window}
});
test('verified rookie shows high school + university and a safe canonical link',()=>{
 const {dom,host}=mount(men,'OKF');
 try{
  const yoon=[...host.querySelectorAll('[data-choice]')].find(x=>x.textContent.includes('윤경'));
  assert.ok(yoon);yoon.click();
  const y=host.querySelector('[data-detail]');
  assert.match(y.textContent,/윤경/);
  assert.match(y.textContent,/남성고/);
  assert.match(y.textContent,/인하대/);
  assert.match(y.querySelector('.kvlrv2-profile-link').href,/id=KVL-P-000008/);
  assert.ok(!y.textContent.includes('KVL-P-000008'));
 }finally{dom.window.close();delete global.window}
});
test('verified high school-only draft never invents a university or profile ID',()=>{
 const {dom,host}=mount(women,'RSP');
 try{
  const item=[...host.querySelectorAll('[data-choice]')].find(x=>x.textContent.includes('김아중'));
  assert.ok(item);item.click();
  const y=host.querySelector('[data-detail]');
  assert.match(y.textContent,/청수고/);
  assert.equal(y.querySelectorAll('.kvlrv2-school-grid>div').length,1);
  assert.doesNotMatch(y.textContent,/대학교/);
  assert.equal(y.querySelector('.kvlrv2-profile-link'),null);
 }finally{dom.window.close();delete global.window}
});
test('filters and roster selection keep current list; non-V-League is untouched',()=>{
 const {dom,host}=mount(men,'KEP');
 try{
  assert.ok(host.querySelectorAll('[data-choice]').length>10);
  const btn=host.querySelector('[data-filter="rookie"]');
  assert.ok(btn);btn.click();
  const filtered=host.querySelectorAll('[data-choice]').length;
  assert.ok(filtered>0&&filtered<men.rosters.KEP.players.length);
  const input=host.querySelector('[data-roster-search]');
  input.value='이율리';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.equal(host.querySelectorAll('[data-choice]').length,1);
  assert.equal(host.querySelector('.kvlrv2-schools'),null);
  assert.equal(host.querySelector('.kvlrv2-profile-link'),null);
  assert.equal(view.render(host,{competitionId:'OTHER'},null,[]),false);
 }finally{dom.window.close();delete global.window}
});
test('existing linked veteran uses explicit pro scope to avoid national-ID collision',()=>{
 const {dom,host}=mount(men,'KAL');
 try{
  const player=[...host.querySelectorAll('[data-choice]')].find(x=>x.textContent.includes('김규민'));
  assert.ok(player);player.click();
  assert.match(host.querySelector('.kvlrv2-profile-link').href,/scope=pro/);
  assert.equal(host.querySelector('.kvlrv2-schools'),null);
 }finally{dom.window.close();delete global.window}
});
test('team page keeps existing match, main navigation and private user-account controls',()=>{
 const engine=read('competition-engine.html'),player=read('player.html'),search=read('players.html');
 assert.match(engine,/kvl-vleague-roster-v2/);
 assert.match(engine,/kvl-vleague-draft-bridge-v1/);
 assert.match(player,/admin-player-profile-notes-v1/);
 assert.match(search,/player-workspace-v1/);
 assert.match(engine,/kvl-vleague-matrix-core-v1/);
});

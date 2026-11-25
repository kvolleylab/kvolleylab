'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const bridgeApi=require('../assets/js/kvl-vleague-draft-bridge-v1.js'),view=require('../assets/js/kvl-vleague-roster-v2.js');
const config=require('../assets/js/kvl-competition-config-v2.js'),mods=require('../assets/js/kvl-competition-modules-v2.js');
const apiData=require('../assets/js/kvl-competition-data-v2.js');
const source=json('data/kovo/official-notices/2026-27/draft_registration_bridge.json');
const schools=json('data/draft-applicants/2026-27/education-v1.json');
const bridge=bridgeApi.withEducation(source,schools);
const base=[...json('data/master/player_master_229_v2.json'),...json('data/master/player_master_school_v1.json'),...json('data/master/player_master_pro_vleague_2026_27_v1.json')];
const national=json('data/national/player_id_links_v1.json').links;
function load(g){
 const p='data/competitions/v-league-'+g+'-2026-27/';
 const def=json(p+'config.json');
 const data=mods.apply(config.assemble(def,json(p+def.data),{slug:'v-league-'+g+'-2026-27',canonical:'https://kvolleylab.com/competition-engine.html'}),def.modules||[],(def.modules||[]).map(m=>json(p+m.source)));
 return data;
}
const men=load('men'),women=load('women');
const reconciled={M:bridgeApi.reconcileCurrent(men,bridge),W:bridgeApi.reconcileCurrent(women,bridge)};
const rosters={M:json('data/competitions/v-league-men-2026-27/rosters.json'),W:json('data/competitions/v-league-women-2026-27/rosters.json')};
const joined=bridge.registered.filter(r=>!!r.player_id);
function count(data){return Object.values(data.rosters).reduce((n,r)=>n+r.players.length,0)}
test('source verified 32 registrations and 28 public profile identities',()=>{
 assert.equal(bridge.registration_count,32);
 assert.equal(bridge.profile_count,28);
 assert.equal(bridge.registered.filter(r=>r.player_id).length,28);
 assert.equal(schools.record_count,116);
 assert.ok(view.isTarget(men));assert.ok(view.isTarget(women));
 assert.equal(view.isTarget({...men,competitionId:'OTHER'}),false);
});
test('current automatic roster snapshots are preserved while adding exactly safe rookie ID links',()=>{
 assert.equal(count(reconciled.M),count(men));
 assert.equal(count(reconciled.W),count(women));
 // Current registrations are publisher-owned and change during the season.
 for(const [g,data] of [['M',men],['W',women]]){
  const published=rosters[g];
  assert.deepEqual(Object.keys(data.rosters).sort(),Object.keys(published).sort());
  for(const code of Object.keys(published)){
   assert.equal(data.rosters[code].players.length,published[code].players.length,g+'/'+code);
   const identity=p=>String(p.number)+'/'+String(p.name);
   assert.deepEqual(data.rosters[code].players.map(identity).sort(),published[code].players.map(identity).sort(),g+'/'+code);
  }
 }
 assert.deepEqual(reconciled.M.matches,men.matches);
 assert.deepEqual(reconciled.W.matches,women.matches);
 for(const r of bridge.registered){
  const out=reconciled[r.gender],original=(r.gender==='M'?men:women).rosters[r.team_code];
  const p=out.rosters[r.team_code].players.find(p=>p.name===r.name&&Number(p.number)===r.number);
  assert.ok(p,r.name);
  assert.equal(p.registrationSource,r.registration_source_url);
  assert.deepEqual([p.kvlDraft?.round,p.kvlDraft?.pick,p.kvlDraft?.kind],[r.draft_round,r.draft_pick,r.draft_kind],r.name+' draft metadata');
  assert.equal(p.kvlHighSchool,r.education?.high_school,r.name+' high school');
  assert.equal(p.kvlUniversity,r.education?.university,r.name+' university');
  if(r.player_id)assert.equal(p.playerId,r.player_id,r.name);
  else assert.equal(p.playerId,null,r.name+' must not invent an ID');
  assert.equal(original.players.some(x=>x.playerId===r.player_id&&r.player_id!=null),false);
 }
 assert.deepEqual(men,load('men'));assert.deepEqual(women,load('women'));
});
test('new verified professional profile includes high school and university without destroying school source',()=>{
 const yy=reconciled.M.rosters.OKF.players.find(p=>p.name==='윤경');
 assert.equal(yy.playerId,'KVL-P-000008');
 assert.equal(yy.kvlHighSchool,'남성고');
 assert.equal(yy.kvlUniversity,'인하대');
 const records=bridgeApi.activeProfiles(base,bridge,rosters.M,rosters.W);
 const profile=records.find(x=>x.system.player_id==='KVL-P-000008');
 assert.ok(profile);
 assert.equal(profile.identity.name_ko,'윤경');
 assert.equal(profile.identity.birth_date,'2006-08-30');
 assert.equal(profile.current_roster.team_name,'OK저축은행');
 assert.equal(profile.current_roster.high_school,'남성고');
 assert.equal(profile.current_roster.university,'인하대');
 assert.ok(profile.roster_history.some(x=>String(x.school_name).includes('인하대학교')),'previous university team must survive');
 assert.equal(records.length,28);
});
test('unknown schools are hidden, KOVO source mismatch blocks links',()=>{
 const y=reconciled.W.rosters.RSP.players.find(p=>p.name==='김아중');
 assert.equal(y.playerId,null);
 assert.equal(y.kvlHighSchool,'청수고');
 assert.equal(y.kvlUniversity,undefined);
 assert.deepEqual(view.schools(y),[{label:'고등학교',text:'청수고'}]);
 const k=reconciled.M.rosters.KEP.players.find(p=>p.name==='이율리');
 assert.equal(view.schools(k).length,0);
 const altered=structuredClone(men);
 const p=altered.rosters.OKF.players.find(x=>x.name==='윤경');
 p.registrationSource='https://kovo.co.kr/news/official-notices/000001';
 const out=bridgeApi.reconcileCurrent(altered,bridge);
 const stale=out.rosters.OKF.players.find(x=>x.name==='윤경');
 assert.equal(stale.playerId,null);
 assert.equal(stale.kvlHighSchool,undefined);
});
test('a reused national ID cannot be assigned as a rookie by name only',()=>{
 const conflicts=new Set(national.filter(p=>/^KVL-P-0016(2[0-9]|3[0-9]|4[0-5])$/.test(p.player_id)).map(p=>p.player_id));
 assert.equal(conflicts.size,26);
 for(const r of joined)assert.equal(conflicts.has(r.player_id),false);
});


test('the published Competition V2 production validator accepts enriched current rosters',()=>{
 assert.deepEqual(apiData.validate(reconciled.M,{production:true}),[]);
 assert.deepEqual(apiData.validate(reconciled.W,{production:true}),[]);
});

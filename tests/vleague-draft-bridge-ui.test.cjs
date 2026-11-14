'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const config=require('../assets/js/kvl-competition-config-v2.js');
const modules=require('../assets/js/kvl-competition-modules-v2.js');
const dataApi=require('../assets/js/kvl-competition-data-v2.js');
const bridgeApi=require('../assets/js/kvl-vleague-draft-bridge-v1.js');
const bridge=read('data/kovo/official-notices/2026-27/draft_registration_bridge.json');
const oldMasters=[
 ...read('data/master/player_master_229_v2.json'),
 ...read('data/master/player_master_school_v1.json'),
 ...read('data/master/player_master_pro_vleague_2026_27_v1.json')
];

function load(gender){
 const slug='v-league-'+gender+'-2026-27',folder='data/competitions/'+slug+'/';
 const def=read(folder+'config.json');
 return modules.apply(
  config.assemble(def,read(folder+def.data),{
   slug,canonical:'https://kvolleylab.com/competition-engine.html?competition='+slug
  }),
  def.modules||[],(def.modules||[]).map(m=>read(folder+m.source))
 );
}

test('source bridge is source-bound, scoped to exactly this season, and non-destructive',()=>{
 assert.ok(bridgeApi.validBridge(bridge));
 assert.equal(bridge.season,'2026-27');
 assert.equal(bridge.registration_count,bridge.registered.length);
 assert.equal(bridge.profile_count,bridge.profiles.length);
 assert.ok(bridge.registration_count>20);
 const text=JSON.stringify(bridge);
 assert.ok(!text.includes('salary_krw'));
 assert.ok(!text.includes('Google Drive'));
 assert.ok(!text.includes('access_token'));
 assert.deepEqual(bridgeApi.applyCompetition({competitionId:'NOT-VLEAGUE',foo:2},bridge),{competitionId:'NOT-VLEAGUE',foo:2});
});

for(const gender of ['men','women']){
 test(gender+' official rookie registration augments only current team data',()=>{
  const d=load(gender),before=JSON.stringify(d);
  const out=bridgeApi.applyCompetition(d,bridge);
  assert.deepEqual(dataApi.validate(out,{production:true}),[]);
  const kind=gender==='men'?'M':'W';
  const exact=bridge.registered.filter(r=>r.gender===kind);
  let added=0;
  for(const r of exact){
   const original=d.rosters[r.team_code].players;
   const actual=out.rosters[r.team_code].players;
   const existed=original.some(p=>p.playerId&&p.playerId===r.player_id)
     ||original.some(p=>p.name===r.name&&Number(p.number)===r.number);
   if(!existed)added++;
   const found=actual.filter(p=>p.name===r.name&&Number(p.number)===r.number);
   assert.equal(found.length,1,r.team+'/'+r.name);
   assert.equal(found[0].registrationSource,r.registration_source_url);
  }
  const baseCount=Object.values(d.rosters).reduce((n,x)=>n+x.players.length,0);
  const finalCount=Object.values(out.rosters).reduce((n,x)=>n+x.players.length,0);
  assert.equal(finalCount-baseCount,added);
  assert.deepEqual(out.matches,d.matches);
  assert.deepEqual(out.standings,d.standings);
  for(const t of out.participants){
   assert.equal(t.rosterCount,out.rosters[t.code].players.length);
   assert.equal(new Set(out.rosters[t.code].players.map(p=>p.number)).size,out.rosters[t.code].players.length);
  }
  assert.equal(JSON.stringify(d),before,'source snapshot must not be mutated');
  assert.deepEqual(bridgeApi.applyCompetition(out,bridge),out,'repeated apply must be idempotent');
 });
}

test('OK rookie current team registration and verified player profile share Player_ID',()=>{
 const out=bridgeApi.applyCompetition(load('men'),bridge);
 const yoon=out.rosters.OKF.players.find(p=>p.name==='윤경');
 assert.equal(yoon.number,20);
 assert.equal(yoon.playerId,'KVL-P-000008');
 assert.match(yoon.lastChangeSource,/\/158550$/);
 const profiles=bridgeApi.profilesFrom(oldMasters,bridge);
 const profile=profiles.find(p=>p.system.player_id==='KVL-P-000008');
 assert.equal(profile.current_roster.team_name,'OK저축은행');
 assert.equal(profile.current_roster.previous_school,'인하대');
 assert.equal(profile.identity.birth_date,'2006-08-30');
 assert.equal(profile.system.competition_level,'professional');
});

test('identity conflict is never converted to a wrong profile link',()=>{
 const out=bridgeApi.applyCompetition(load('men'),bridge);
 const athlete=out.rosters.KEP.players.find(x=>x.name==='여광우');
 assert.equal(athlete.playerId,null);
 assert.equal(bridgeApi.profilesFrom(oldMasters,bridge).filter(x=>x.identity.name_ko==='여광우').length,0);
});

test('fresh database for a missing former high-school profile uses no invented DOB',()=>{
 const out=bridgeApi.profilesFrom(oldMasters,bridge);
 const lee=out.find(x=>x.identity.name_ko==='이승일');
 assert.ok(lee,'verified existing KVL ID must resolve as a public limited profile');
 assert.equal(lee.identity.birth_date,null);
 assert.equal(lee.current_roster.team_name,'대한항공');
 assert.equal(lee.current_roster.previous_school,'순천제일고');
});

test('invalid or malicious bridge is fail closed',()=>{
 const bad=structuredClone(bridge);bad.registered[0].registration_source_url='javascript:alert(1)';
 assert.equal(bridgeApi.validBridge(bad),false);
 assert.throws(()=>bridgeApi.applyCompetition(load('men'),bad),/Invalid/);
 const duplicate=structuredClone(bridge);duplicate.registered[0].applicant_id=duplicate.registered[1].applicant_id;
 assert.equal(bridgeApi.validBridge(duplicate),false);
});

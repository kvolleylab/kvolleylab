'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js'),dataApi=require('../assets/js/kvl-competition-data-v2.js');
function load(gender){
 const slug=`v-league-${gender}-2026-27`,base=`data/competitions/${slug}/`,config=json(base+'config.json');
 const data=modules.apply(configApi.assemble(config,json(base+config.data),{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`}),config.modules||[],(config.modules||[]).map(m=>json(base+m.source)));
 assert.deepEqual(dataApi.validate(data,{production:true}),[]);return data;
}
const expected={men:{KAL:19,HDC:18,WRC:20,KBI:19,KEP:15,OKF:17,SFB:23},women:{GSC:17,KEX:15,HHC:18,HPS:20,IBK:18,RSP:16,SOO:17}};
for(const gender of ['men','women']){
 test(gender+': season membership, source fields and canonical identity integrity',()=>{
  const d=load(gender);assert.equal(d.competitionFamily,'pro');assert.equal(d.structure.presentationCategory,'pro-league');assert.equal(d.structure.knockout.mode,'pro-postseason');
  assert.deepEqual(Object.fromEntries(Object.entries(d.rosters).map(([code,r])=>[code,r.players.length])),expected[gender]);
  const pro=json('data/master/player_master_pro_vleague_2026_27_v1.json');
  const known=new Map(pro.map(p=>[p.system.player_id,{name:p.identity.name_ko,dob:p.identity.birth_date||null}]));
  assert.equal(known.size,pro.length,'Professional MASTER IDs must be unique');
  for(const t of d.participants){
   const r=d.rosters[t.code];assert.equal(t.rosterCount,r.players.length);assert.equal(r.rosterKind,'season-notice-snapshot');assert(dataApi.rosterTarget(d,t).available);
   assert.equal(new Set(r.players.map(p=>p.number)).size,r.players.length);
   for(const p of r.players){
    assert.equal(p.sourceId,r.sourceId);assert.match(p.registrationSource,/^https:\/\/kovo.co.kr\/news\/official-notices\/\d+$/);
    assert(p.nationalityCode&&p.nationality);assert(p.heightCm>100&&p.heightCm<230);
    if(p.playerId)assert.deepEqual(known.get(p.playerId),{name:p.name,dob:p.dob});
    if(p.dobStatus){assert.equal(p.dob,null);assert(p.sourceNote);assert.equal(known.get(p.playerId)?.dob,null);}
   }
  }
  assert.equal(d.matches.length,126);assert.equal(new Set(d.matches.map(m=>m.id)).size,126);
 });
}
test('latest reviewed changes supersede older MASTER and Cup membership',()=>{
 const d=load('men'),kal=d.rosters.KAL.players;
 const lee=kal.find(p=>p.name==='이준');assert.equal(lee.number,13);assert.equal(lee.playerId,'KVL-P-001542');assert(lee.registrationSource.endsWith('/158242'));
 assert(!kal.some(p=>['최원빈','송민근'].includes(p.name)));assert.equal(kal.find(p=>p.name==='김영태').position,'MB');assert(kal.find(p=>p.name==='김영태').lastChangeSource.endsWith('/157686'));
 assert(!d.rosters.SFB.players.some(p=>p.name==='이윤재'));
 const all=[...Object.values(d.rosters),...Object.values(load('women').rosters)].flatMap(r=>r.players);
 assert.equal(all.filter(p=>p.nationalityCode!=='KOR').length,28);assert.equal(all.filter(p=>p.dobStatus).length,6);assert.equal(all.filter(p=>p.playerId).length,252);assert.equal(new Set(all.map(p=>p.playerId)).size,252);
 const text=JSON.stringify(all);assert(!/drive.google|docs.google|salary|관찰메모|예상 연봉/.test(text));
});

// Never resolve a duplicate ID by silently letting the newest MASTER win.
// This strict check stays in player CI and before player authentication.
test('canonical Player IDs never identify different people across MASTER sources',()=>{
 const known=new Map(),conflicts=[];
 function record(id,name,dob,source){
  if(!id)return;
  const previous=known.get(id),identity={name,dob:dob||null};
  if(previous&&(previous.name!==identity.name||previous.dob!==identity.dob))
   conflicts.push({id,previous,current:{...identity,source}});
  else if(!previous)known.set(id,{...identity,source});
 }
 const national='data/national/player_id_links_v1.json';
 for(const p of json(national).links)record(p.player_id,p.name_ko,p.birth_date,national);
 for(const source of ['data/master/player_master_229_v2.json','data/master/player_master_school_v1.json','data/master/player_master_pro_vleague_2026_27_v1.json']){
  const raw=json(source);
  for(const p of Array.isArray(raw)?raw:raw.players)record(p.system.player_id,p.identity.name_ko,p.identity.birth_date,source);
 }
 assert.deepEqual(conflicts,[],'Player identity conflicts require a reviewed migration; match publication cannot repair or reassign these IDs');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const data=f=>JSON.parse(read(f));

function app(){
 const dom=new JSDOM('<body data-player-workspace><main id="playerArea"></main></body>',{
  url:'https://kvolleylab.com/players.html',
  runScripts:'outside-only',
  virtualConsole:new VirtualConsole()
 });
 const w=dom.window;
 w.Response=Response;w.Blob=Blob;w.DecompressionStream=DecompressionStream;
 w.fetch=async url=>{
  const path=new URL(typeof url==='string'?url:url.url,w.location.href).pathname.slice(1);
  try{return new Response(read(path),{status:200})}
  catch{return new Response('',{status:404})}
 };
 for(const file of ['player-school-master-v2.js','player-school-master-compat-v2.js','player-search-v2.js']){
  w.eval(read('assets/js/'+file));
 }
 return {w,dom};
}

test('2026-27 player catalog preserves legacy IDs while extending to pro players',async()=>{
 const {w,dom}=app();
 try{
  const catalog=await w.KVLPlayerCatalogReady;
  const ids=catalog.map(p=>p.playerId);
  const pro=data('data/master/player_master_pro_vleague_2026_27_v1.json');
  assert.ok(catalog.length>=1842,'never shrink the existing public catalog');
  assert.equal(new Set(ids).size,ids.length,'canonical ID must not be duplicated');
  assert.equal(new Set(pro.map(p=>p.system.player_id)).size,pro.length);
  for(const player of pro){
   const publicProfile=catalog.find(p=>p.playerId===player.system.player_id);
   assert.ok(publicProfile,'all current pro master IDs must resolve to searchable profiles');
   assert.equal(publicProfile.level,'professional');
   assert.equal(publicProfile.team,player.current_roster.team_name);
   assert.equal(publicProfile.nameKo,player.identity.name_ko,
     'national link ID collision must not rename a different professional');
   assert.equal(publicProfile.birthDate,player.identity.birth_date,
     'national link ID collision must not replace professional DOB');
  }
 }finally{dom.window.close()}
});

test('verified national review aliases preserve an existing ID and birthdate',async()=>{
 const {w,dom}=app();
 try{
  const catalog=await w.KVLPlayerCatalogReady;
  const byId=new Map(catalog.map(p=>[p.playerId,p]));
  for(const id of ['KVL-P-000008','KVL-P-000083','KVL-P-000107']){
   const player=byId.get(id);
   assert.ok(player,'reviewed ID must remain reachable');
   assert.ok(player.birthDate,'existing reviewed DOB must survive');
  }
  const yoon=byId.get('KVL-P-000008');
  assert.equal(yoon.nameKo,'윤경');
  assert.equal(yoon.birthDate,'2006-08-30');
 }finally{dom.window.close()}
});

test('draft selections cannot rewrite an unverified profile ID',()=>{
 const applicants=data('data/draft-applicants/2026-27/applicants.json').applicants;
 const links=data('data/draft-applicants/2026-27/player-links.json').links;
 const results=data('data/draft-applicants/2026-27/results.json').results;
 const appById=new Map(applicants.map(r=>[r.applicant_id,r]));
 const linkById=new Map(links.map(r=>[r.applicant_id,r]));
 const verified=results.filter(r=>{
  const a=appById.get(r.applicant_id),link=linkById.get(r.applicant_id);
  return r.status==='selected'&&r.record_status==='VERIFIED'&&r.access_level==='PUBLIC'
         &&a&&link?.status==='matched'&&link.profile_verified===true
         &&/^KVL-P-[0-9]{6}$/.test(link.player_id||'');
 });
 assert.equal(results.length,34);
 assert.equal(verified.length,30);
 assert.equal(new Set(verified.map(r=>linkById.get(r.applicant_id).player_id)).size,verified.length);
 assert.equal(results.length-verified.length,4);
});

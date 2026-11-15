import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const guard=require('../assets/js/player-id-collision-quarantine-v1.js');
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const json=path=>JSON.parse(read(path));

test('conflict quarantine matches all real national/pro name-DOB collisions and no others',()=>{
 const nat=new Map(json('data/national/player_id_links_v1.json').links.map(x=>[x.player_id,x]));
 const pro=json('data/master/player_master_pro_vleague_2026_27_v1.json');
 const conflicts=pro.filter(p=>{
  const n=nat.get(p.system.player_id);
  return n&&(n.name_ko!==p.identity.name_ko||n.birth_date!==p.identity.birth_date);
 }).map(p=>p.system.player_id).sort();
 assert.equal(conflicts.length,26);
 assert.deepEqual(guard.collisionIds,conflicts);
 assert.equal(guard.isConflict('KVL-P-001620'),true);
 assert.equal(guard.isConflict('KVL-P-001645'),true);
 assert.equal(guard.isConflict('KVL-P-001619'),false);
 assert.equal(guard.profileUrl('KVL-P-001620','pro'),'player.html?id=KVL-P-001620&scope=pro');
 assert.equal(guard.profileUrl('KVL-P-001620','national'),'player.html?id=KVL-P-001620&scope=national');
 assert.equal(guard.profileUrl('KVL-P-000008','pro'),'player.html?id=KVL-P-000008');
});

async function render(id,scope){
 const search='?id='+encodeURIComponent(id)+(scope?'&scope='+scope:'');
 const dom=new JSDOM('<main id="playerArea"><p class="pd-empty">불러오는 중</p></main>',{
  url:'https://kvolleylab.com/player.html'+search,runScripts:'outside-only',
  virtualConsole:new VirtualConsole()
 });
 const w=dom.window;
 let fetchCount=0;
 w.Response=Response;w.Blob=Blob;w.DecompressionStream=DecompressionStream;
 w.fetch=async url=>{
  fetchCount++;
  const path=new URL(typeof url==='string'?url:url.url,w.location.href).pathname.slice(1);
  try{return new Response(read(path),{status:200})}
  catch{return new Response('',{status:404})}
 };
 w.eval(read('assets/js/player-id-collision-quarantine-v1.js'));
 w.eval(read('assets/js/player-detail-v2.js'));
 for(let i=0;i<250;i++){
  if(w.document.querySelector('.pd-title,.pd-identity-choice,#playerArea > .pd-empty:not(:first-child)'))break;
  await new Promise(r=>setTimeout(r,2));
 }
 return {dom,w,get fetchCount(){return fetchCount}};
}

test('unscoped conflicting Player_ID shows identity choice instead of wrong athlete',async()=>{
 const d=await render('KVL-P-001620');
 try{
  const root=d.w.document.getElementById('playerArea');
  assert.equal(root.querySelector('.pd-title'),null);
  assert.ok(root.querySelector('.pd-identity-choice'));
  assert.equal(root.querySelectorAll('.pd-identity-choice-options a').length,2);
  const hrefs=[...root.querySelectorAll('.pd-identity-choice-options a')].map(x=>x.getAttribute('href').replaceAll('&amp;','&'));
  assert.ok(hrefs.some(x=>x.includes('&scope=pro')));
  assert.ok(hrefs.some(x=>x.includes('&scope=national')));
  assert.match(root.textContent,/김규민/);
  assert.match(root.textContent,/임시형/);
  assert.equal(d.w.KVL_PROFILE_CONTEXT?.level,'ambiguous');
 }finally{d.dom.window.close()}
});

test('professional scope shows official pro identity and excludes unrelated national history',async()=>{
 const d=await render('KVL-P-001620','pro');
 try{
  assert.equal(d.w.document.querySelector('.pd-title')?.textContent,'김규민');
  assert.equal(d.w.KVL_PROFILE_CONTEXT?.level,'professional');
  assert.equal(d.w.KVL_PROFILE_CONTEXT?.dob,'1990-12-28');
  const priorFetch=d.fetchCount;
  d.w.eval(read('assets/js/player-national-history-v1.js'));
  await new Promise(r=>setTimeout(r,10));
  assert.equal(d.fetchCount,priorFetch,'national history must not fetch under pro scope');
  assert.equal(d.w.document.querySelector('.pd-national-live'),null);
 }finally{d.dom.window.close()}
});

test('national scope preserves the distinct historical identity',async()=>{
 const d=await render('KVL-P-001620','national');
 try{
  assert.equal(d.w.document.querySelector('.pd-title')?.textContent,'임시형');
  assert.equal(d.w.KVL_PROFILE_CONTEXT?.level,'national');
  assert.equal(d.w.KVL_PROFILE_CONTEXT?.dob,'1985-03-29');
  assert.match(d.w.document.getElementById('playerArea').textContent,/대한민국 대표팀/);
 }finally{d.dom.window.close()}
});

test('nonconflicting permanent profile URLs preserve existing behavior',async()=>{
 const d=await render('KVL-P-000008');
 try{
  assert.equal(d.w.document.querySelector('.pd-title')?.textContent,'윤경');
  assert.equal(d.w.KVL_PROFILE_CONTEXT?.level,'university');
  assert.equal(d.w.document.querySelector('.pd-identity-choice'),null);
 }finally{d.dom.window.close()}
});

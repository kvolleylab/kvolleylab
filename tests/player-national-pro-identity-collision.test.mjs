import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.KVL_JSDOM_PATH || 'jsdom');
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const links=JSON.parse(read('data/national/player_id_links_v1.json')).links;
const pro=JSON.parse(read('data/master/player_master_pro_vleague_2026_27_v1.json'));

async function paint(id,name,birth,level){
 const html='<main id="playerArea"><section><h1 class="pd-title">'+name+'</h1>'+
 '<div class="pd-breadcrumb"><strong>'+name+'</strong></div>'+
 '<div class="pd-info-item"><span>생년월일</span><strong>'+birth+'</strong></div></section></main>';
 const dom=new JSDOM(html,{url:'https://kvolleylab.com/player.html?id='+id,runScripts:'outside-only'});
 const w=dom.window;
 w.KVL_PROFILE_CONTEXT={id,level};
 w.fetch=async()=>({ok:true,json:async()=>({links})});
 w.eval(read('assets/js/player-canonical-identity-v1.js'));
 for(let i=0;i<40;i++)await new Promise(resolve=>setTimeout(resolve,1));
 const area=w.document.getElementById('playerArea');
 const result={
  name:area.querySelector('.pd-title').textContent,
  birth:area.querySelector('.pd-info-item strong').textContent,
  crumb:area.querySelector('.pd-breadcrumb strong').textContent
 };
 dom.window.close();
 return result;
}

test('professional names and birth dates stay authoritative despite legacy national KVL-P ID reuse',async()=>{
 const byId=new Map(links.map(p=>[p.player_id,p]));
 const clashes=pro.filter(p=>{
  const old=byId.get(p.system.player_id);
  return old && (old.name_ko!==p.identity.name_ko||old.birth_date!==p.identity.birth_date);
 });
 assert.ok(clashes.length>=20,'source collision is a known and separately tracked registry issue');
 for(const p of clashes.slice(0,3)){
  const original={name:p.identity.name_ko,birth:p.identity.birth_date,crumb:p.identity.name_ko};
  assert.deepEqual(await paint(p.system.player_id,original.name,original.birth,'professional'),original);
 }
});

test('non-professional verified name correction still works',async()=>{
 const approved=links.find(p=>p.player_id==='KVL-P-000009');
 assert.ok(approved);
 const changed=await paint('KVL-P-000009','이관우',approved.birth_date,'university');
 assert.equal(changed.name,approved.name_ko);
 assert.equal(changed.birth,approved.birth_date);
 assert.equal(changed.crumb,approved.name_ko);
});

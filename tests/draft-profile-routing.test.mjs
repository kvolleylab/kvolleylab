// Execute the unchanged operating profile renderer against existing local sources.
// This verifies identity routing, not live-network availability of every URL.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');const data=JSON.parse(read('data/draft-applicants/2026-27/applicants.json')),links=JSON.parse(read('data/draft-applicants/2026-27/player-links.json')).links;
test('all verified applicant IDs render the correct existing player profile',async()=>{
 let checked=0;
 for(const link of links.filter(x=>x.status==='matched')){
  const dom=new JSDOM('<main id="playerArea"></main>',{url:`https://kvolleylab.com/player.html?id=${link.player_id}`,runScripts:'outside-only'}),w=dom.window;const row=data.applicants.find(x=>x.applicant_id===link.applicant_id);
  try{
   w.Blob=Blob;w.Response=Response;w.DecompressionStream=DecompressionStream;
   w.fetch=async url=>{if(url==='data/master/player_master_school_v1.json')return {ok:true,json:()=>w.KVLSchoolMasterV2.load()};try{const text=read(url);return {ok:true,json:async()=>JSON.parse(text),text:async()=>text}}catch{return {ok:false,status:404,json:async()=>[]}}};
   w.eval(read('assets/js/player-school-master-v2.js'));
   await w.KVLSchoolMasterV2.load();w.eval(read('assets/js/player-detail-v2.js'));w.eval(read('assets/js/player-canonical-identity-v1.js'));
   for(let i=0;i<30&&w.document.querySelector('.pd-title')?.textContent!==row.name;i++)await new Promise(r=>setTimeout(r,2));
   const title=w.document.querySelector('.pd-title')?.textContent;assert.equal(title,row.name,`Profile identity mismatch: ${link.player_id}`);checked++;
  }finally{w.close()}
 }
 assert.equal(checked,99);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(new URL('..',import.meta.url).pathname);
async function app(){
  const dom=new JSDOM('<button id="accountButton">준비 중</button><div id="trackingBody"></div><div id="notesBody"></div><article><button data-member-unavailable data-player-id="KVL-P-000001">관심선수</button></article>',{url:'https://kvolleylab.com/players.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.fetch=async()=>new Response('{"enabled":false}');w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
  w.KVLPlayerCatalogReady=Promise.resolve([{playerId:'KVL-P-000001',nameKo:'선주성',gender:'M',school:'인하대학교',height:177,rawPosition:'L'}]);
  const modules=new Map();async function load(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(path.join(root,file),'utf8'),{context:dom.getInternalVMContext(),identifier:file});modules.set(file,m);await m.link((specifier,ref)=>load(path.posix.normalize(path.posix.join(path.posix.dirname(ref.identifier),specifier))));return m}
  const module=await load('assets/js/player-members-v1.mjs');await module.evaluate();return {dom,w,mount:module.namespace.mountMembers};
}
test('private note text cannot inject HTML, and account changes clear the old member view',async()=>{
  const a=await app();let listener;let state={user:{id:'A',email:'A@example.test'},loading:false,bookmarks:[{player_id:'KVL-P-000001'}],notes:[{id:'one',player_id:'KVL-P-000001',title:'<script>attack()</script>',body:'<img src=x onerror=attack()>\nPRIVATE_A',revision:1,updated_at:'2026-10-24'}]};
  const service={snapshot:()=>state,subscribe(fn){listener=fn;fn(state)}};
  try{await a.mount(service);assert.equal(a.w.document.querySelectorAll('#notesBody img,#notesBody script').length,0);assert.match(a.w.document.getElementById('notesBody').textContent,/PRIVATE_A/);state={user:{id:'B',email:'B@example.test'},loading:false,bookmarks:[],notes:[]};listener(state);assert.doesNotMatch(a.w.document.body.textContent,/PRIVATE_A/);assert.equal(a.w.document.querySelector('[data-member-unavailable]').getAttribute('aria-pressed'),'false')}
  finally{a.dom.window.close()}
});
test('signout clears an open note editor and anonymous bookmark clicks open login instead of writing',async()=>{
  const a=await app();let listener,writes=0;let state={user:{id:'A',email:'A@example.test'},loading:false,bookmarks:[{player_id:'KVL-P-000001'}],notes:[]};
  const service={snapshot:()=>state,subscribe(fn){listener=fn;fn(state)},async setBookmark(){writes++}};
  try{await a.mount(service);a.w.document.querySelector('[data-member-new-note]').click();assert.equal(a.w.document.querySelector('#memberDialog').open,true);a.w.document.querySelector('textarea').value='UNSAVED_PRIVATE';state={user:null,loading:false,bookmarks:[],notes:[]};listener(state);assert.equal(a.w.document.querySelector('#memberDialog').open,false);assert.equal(a.w.document.querySelectorAll('textarea').length,0);a.w.document.querySelector('[data-member-unavailable]').click();assert.ok(a.w.document.querySelector('#memberLoginForm'));assert.equal(writes,0)}finally{a.dom.window.close()}
});

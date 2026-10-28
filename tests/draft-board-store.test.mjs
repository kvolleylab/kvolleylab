import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DraftStore} from '../assets/js/draft-board-store.mjs';
const seed=JSON.parse(await fs.readFile(new URL('../data/drafts/2026-27/men.json',import.meta.url)));
const settings={repository:'kvolleylab/kvolleylab',branch:'data/draft-board',path:'data/drafts/2026-27/men.json'};
// Disk-backed GitHub contract fixture: no public fake data or credentials.
async function backend(){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kvl-draft-store-')),file=path.join(dir,'state.json');await fs.writeFile(file,JSON.stringify(seed));
 let count=0,denyWrite=false,loseResponse=false;
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
 const fetcher=async (url,opts={})=>{
   const token=opts.headers?.Authorization;
   if(url==='https://api.github.com/user')return token==='Bearer admin-fixture'?json({login:'verified-admin'}):json({},401);
   if(url==='https://api.github.com/repos/kvolleylab/kvolleylab')return json({permissions:{push:token==='Bearer admin-fixture'}});
   assert.ok(url.startsWith('https://api.github.com/repos/kvolleylab/kvolleylab/contents/data/drafts/2026-27/men.json'));
   const bytes=await fs.readFile(file);
   if(opts.method==='PUT'){
     count++;
     if(token!=='Bearer admin-fixture'||denyWrite)return json({},403);
     const body=JSON.parse(opts.body);assert.equal(body.branch,'data/draft-board');
     if(body.sha!==sha(bytes))return json({},409);
     const content=Buffer.from(body.content,'base64');await fs.writeFile(file,content);
     if(loseResponse)throw new Error('Network response lost');
     return json({content:{sha:sha(content)},commit:{sha:sha(content)}});
   }
   return json({content:bytes.toString('base64'),sha:sha(bytes)});
 };
 return {fetcher,file,cleanup:()=>fs.rm(dir,{recursive:true}),writes:()=>count,deny:()=>{denyWrite=true;},lose:()=>{loseResponse=true;}};
}
const command={type:'color',target:'SFB',value:{name:'검증용 파랑',hex:'#0080ff'},reason:'파일 저장/복원 검증'};
test('authenticated writes persist to disk and a new store reads the saved state after refresh',async()=>{
 const b=await backend();try{
  const first=new DraftStore({...settings,fetcher:b.fetcher});await first.connect('admin-fixture');const saved=await first.save(command,0);assert.equal(saved.state.revision,1);
  assert.equal(JSON.parse(await fs.readFile(b.file)).teams[0].color.name,'검증용 파랑');
  const refreshed=new DraftStore({...settings,fetcher:b.fetcher});const read=await refreshed.load();assert.equal(read.revision,1);assert.equal(read.teams[0].color.name,'검증용 파랑');assert.equal(read.audit[0].actor,'verified-admin');assert.equal(refreshed.editable,false);
  assert.ok(!(await fs.readFile(b.file,'utf8')).includes('admin-fixture'));
 }finally{await b.cleanup();}
});
test('unauthenticated/read-only and expired permissions cannot save',async()=>{
 const b=await backend();try{
  const s=new DraftStore({...settings,fetcher:b.fetcher});await s.load();await assert.rejects(s.save(command,0),/인증/);
  await assert.rejects(s.connect('read-only-fixture'));assert.equal(s.editable,false);await s.connect('admin-fixture');b.deny();await assert.rejects(s.save(command,0),/권한/);assert.equal(JSON.parse(await fs.readFile(b.file)).revision,0);assert.equal(s.editable,false);
 }finally{await b.cleanup();}
});
test('concurrent admins conflict by SHA, never overwrite, then reload and deliberately retry',async()=>{
 const b=await backend();try{
  const a=new DraftStore({...settings,fetcher:b.fetcher}),c=new DraftStore({...settings,fetcher:b.fetcher});await a.connect('admin-fixture');await c.connect('admin-fixture');
  await a.save(command,0);await assert.rejects(c.save({...command,target:'OKF'},0),/다른 관리자/);assert.equal(c.editable,false);
  assert.equal(JSON.parse(await fs.readFile(b.file)).teams[1].color,null);
  await c.load();await c.save({...command,target:'OKF'},1);assert.equal(JSON.parse(await fs.readFile(b.file)).revision,2);
 }finally{await b.cleanup();}
});
test('lost successful response blocks blind retry; refresh discovers exactly one committed audit',async()=>{
 const b=await backend();try{
  const a=new DraftStore({...settings,fetcher:b.fetcher});await a.connect('admin-fixture');b.lose();await assert.rejects(a.save(command,0),/lost/);
  await assert.rejects(a.save(command,0),/인증/);assert.equal(b.writes(),1);const loaded=await a.load();assert.equal(loaded.audit.length,1);assert.equal(loaded.revision,1);
 }finally{await b.cleanup();}
});
test('tampered repository/path is refused; tokens never appear in serialized store or state',async()=>{
 assert.throws(()=>new DraftStore({...settings,repository:'attacker/repository'}),/경로/);assert.throws(()=>new DraftStore({...settings,path:'data/drafts/../../index.html'}),/경로/);
 const b=await backend();try{const a=new DraftStore({...settings,fetcher:b.fetcher});await a.connect('admin-fixture');assert.ok(!JSON.stringify(a).includes('admin-fixture'));a.disconnect();assert.equal(a.editable,false);}finally{await b.cleanup();}
});
test('native browser fetch keeps its global receiver instead of the DraftStore instance',async()=>{
 const s=new DraftStore({...settings,fetcher:function(){assert.equal(this,globalThis);return Promise.resolve(new Response(JSON.stringify({content:Buffer.from(JSON.stringify(seed)).toString('base64'),sha:'receiver-check'})));}});
 assert.equal((await s.load()).revision,0);
});

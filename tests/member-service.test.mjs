import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemberService,validateMemberConfig} from '../assets/js/member-service-v1.mjs';
function fixture(){
  const backend={user:'A',active:true,bookmarks:[],notes:[],writes:[],hold:null};
  const client={auth:{async getUser(){return {data:{user:backend.user?{id:backend.user,email:backend.user+'@example.test',email_confirmed_at:'2026-10-24'}:null}}},async signOut(){backend.user=null;backend.active=false;return {error:null}},async signInWithOtp(args){backend.login=args;return {error:null}}},async rpc(){return {data:backend.active,error:null}},from(table){
    let kind='select',payload,filters=[],start=0,end=999,single=false;
    const query={select(){return query},eq(k,v){filters.push([k,v]);return query},order(){return query},range(a,b){start=a;end=b;return query},single(){single=true;return query},insert(value){kind='insert';payload=value;return query},delete(){kind='delete';return query},update(value){kind='update';payload=value;return query},async then(resolve,reject){try{
      const owner=backend.user,store=table.endsWith('bookmarks')?backend.bookmarks:backend.notes;
      if(kind==='select'&&backend.hold){const wait=backend.hold;backend.hold=null;await wait}
      let rows=store.filter(x=>x.user_id===owner&&filters.every(([k,v])=>x[k]===v));
      if(kind==='insert'){backend.writes.push(payload);const record={...payload,user_id:owner,id:'note-'+(store.length+1),revision:1,updated_at:'2026-10-24'};store.push(record);rows=[record]}
      else if(kind==='update'){backend.writes.push(payload);rows.forEach(x=>Object.assign(x,payload))}
      else if(kind==='delete'){for(const row of rows)store.splice(store.indexOf(row),1)}
      const data=rows.slice(start,end+1).map(x=>({...x}));resolve({data:single?data[0]:data,error:null});
    }catch(error){reject(error)}}};return query;
  }};
  return {backend,client,service:createMemberService(client)};
}
test('disabled config rejects no requests and enabled config cannot accept secrets or arbitrary origins',()=>{
  assert.equal(validateMemberConfig({enabled:false}),null);
  const valid={enabled:true,supabaseUrl:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_abcdefghijklmnopqrstuvwx'};
  assert.equal(validateMemberConfig(valid).url,'https://abcdefghijklmnopqrst.supabase.co');
  for(const value of ['sb_secret_notpublic','eyJhbGciOiJIUzI1NiJ9.service_role',''])assert.throws(()=>validateMemberConfig({...valid,publishableKey:value}));
  for(const value of ['http://abcdefghijklmnopqrst.supabase.co','https://evil.example','https://abcdefghijklmnopqrst.supabase.co/path','https://user:pw@abcdefghijklmnopqrst.supabase.co'])assert.throws(()=>validateMemberConfig({...valid,supabaseUrl:value}));
});
test('server verification and row retrieval precede visible signed-in state',async()=>{
  const {backend,service}=fixture();backend.notes.push({id:'a',player_id:'KVL-P-000001',user_id:'A',body:'A_ONLY'});backend.notes.push({id:'b',player_id:'KVL-P-000001',user_id:'B',body:'B_ONLY'});
  const result=await service.refresh();assert.equal(result.user.id,'A');assert.deepEqual(result.notes.map(x=>x.body),['A_ONLY']);backend.active=false;await service.refresh();assert.equal(service.snapshot().user,null);assert.equal(service.snapshot().notes.length,0);
});
test('logout clears private state before network work completes and old responses are discarded',async()=>{
  const {backend,service}=fixture();backend.notes.push({user_id:'A',body:'SECRET'});await service.refresh();
  let release;backend.hold=new Promise(r=>release=r);const pending=service.refresh();await new Promise(r=>setTimeout(r,0));
  await service.logout();assert.equal(service.snapshot().notes.length,0);assert.equal(service.snapshot().user,null);release();await pending;assert.equal(service.snapshot().notes.length,0);assert.equal(service.snapshot().user,null);
});
test('switching account clears the previous member data and disallows stale mutations',async()=>{
  const {backend,service}=fixture();backend.notes.push({id:'a',user_id:'A',body:'A_ONLY'},{id:'b',user_id:'B',body:'B_ONLY'});await service.refresh();backend.user='B';service.clear();await service.refresh();assert.deepEqual(service.snapshot().notes.map(x=>x.body),['B_ONLY']);backend.user='A';await assert.rejects(service.addNote('KVL-P-000001','','x'),/로그인 상태/);assert.equal(backend.writes.length,0);
});
test('all member rows are retrieved beyond the REST default page size',async()=>{
  const {backend,service}=fixture();backend.bookmarks=Array.from({length:1201},(_,i)=>({user_id:'A',player_id:'KVL-P-'+i}));await service.refresh();assert.equal(service.snapshot().bookmarks.length,1201);
});
test('writes never accept a caller user_id and note revisions prevent lost edits',async()=>{
  const {backend,service}=fixture();await service.refresh();await service.addNote('KVL-P-000001','title','memo');const note=service.snapshot().notes[0];await service.editNote(note,'title2','memo2');assert.equal(service.snapshot().notes[0].revision,2);await assert.rejects(service.editNote(note,'stale','stale'),/다른 곳/);assert.ok(backend.writes.every(x=>!('user_id'in x)));await service.deleteNote(service.snapshot().notes[0]);assert.equal(service.snapshot().notes.length,0);
});
test('a memory snapshot cannot mutate the cached private state',async()=>{
  const {backend,service}=fixture();backend.notes.push({id:'a',user_id:'A',body:'original'});await service.refresh();service.snapshot().notes[0].body='mutated';assert.equal(service.snapshot().notes[0].body,'original');
});

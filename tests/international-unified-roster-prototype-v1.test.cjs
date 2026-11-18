'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {build,renderStandalone,verifiedVolleybox,pos}=require('../scripts/build-international-unified-roster-prototype-v1.cjs');
const model=build();
test('Japan 2026 3 verified historic tournaments remain source-derived',()=>{
 assert.equal(model.year,2026);assert.equal(model.scope.code,'JPN');
 assert.equal(model.total,26);
 assert.deepEqual(model.sourceSnapshot,{VNL:16,AG:12,AVC:14});
 assert.equal(model.events.length,3);
 assert.deepEqual(model.events.map(e=>[e.id,e.major]),[['VNL',true],['AG',true],['AVC',false]]);
 assert.ok(!model.events.some(e=>e.id==='CUP'),'Do not invent Japan AVC Cup registration');
 const count=e=>model.rows.filter(p=>p.sources.includes(e)).length;
 assert.equal(count('VNL'),16);assert.equal(count('AG'),12);assert.equal(count('AVC'),14);
 assert.equal(model.rows.reduce((n,p)=>n+p.eventCount,0),42);
});
test('exact sources merge real athletes and retain different Fukatsu identities despite same jersey',()=>{
 const f=model.rows.filter(x=>x.en.endsWith('Fukatsu'));
 assert.equal(f.length,2);assert.notEqual(f[0].dob,f[1].dob);
 const ak=f.find(x=>x.en==='Akihiro Fukatsu'),hide=f.find(x=>x.en==='Hideomi Fukatsu');
 assert.equal(ak.jersey,'#3');assert.equal(hide.jersey,'#3');
 assert.deepEqual(ak.sources,['VNL']);assert.deepEqual(hide.sources,['AVC']);
 const l=model.rows.find(x=>x.en==='Larry Ik Evbade-Dan');
 assert.ok(l);assert.deepEqual(l.sources,['VNL','AVC']);assert.match(l.matchBasis,/Volleybox profile/);
 const o=model.rows.find(x=>x.en==='Tatsunori Otsuka');
 assert.deepEqual(o.sources,['VNL','AG','AVC']);assert.equal(o.eventCount,3);
 assert.ok(model.rows.every(p=>new Set(p.sources).size===p.sources.length));
});
test('source-confirmed 2026-27 clubs, DOB, original event jerseys and profile/Volleybox links are not lost',()=>{
 const clubs=JSON.parse(fs.readFileSync(path.join(root,'data/competitions/avc-men-continental-2026-clubs-2026-27.json')));
 const avc=model.rows.filter(p=>p.sources.includes('AVC'));
 for(const p of avc){
  assert.match(p.dob,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(p.height>0);
  const c=clubs.teams.JPN[String(p.jerseys.AVC)];
  if(c?.status==='CONFIRMED'&&c.club){assert.equal(p.club,c.club);assert.match(p.clubSource,/2026/);}
 }
 const ishikawa=model.rows.find(x=>x.en==='Yuki Ishikawa');
 assert.equal(ishikawa.club,'Ziraat Bankkart Ankara');
 assert.match(ishikawa.volleybox,/yuki-ishikawa-p705/);
 assert.equal(ishikawa.jersey,'#14');
 assert.ok(model.rows.filter(x=>x.KVLProfile).length>8);
 for(const p of model.rows){
  assert.match(p.dob,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(p.en&&p.name);
  if(p.KVLProfile)assert.match(p.KVLProfile,/^https:\/\/kvolleylab\.com\/player\.html\?id=KVL-P-\d{6}$/);
  if(p.volleybox)assert.match(p.volleybox,/^https:\/\/volleybox\.net\/.+-p\d+$/);
 }
 assert.equal(verifiedVolleybox('https://volleybox.net/ko/search?q=Akihiro'), '');
 assert.equal(verifiedVolleybox('https://volleybox.net/yuki-ishikawa-p705'),'705');
 assert.equal(pos('O'),'OP');
});
test('HTML preview remains self-contained and preserves all approved table fields',()=>{
 const html=renderStandalone(model);
 assert.ok(html.startsWith('<!DOCTYPE html>'));
 assert.ok(!html.includes('__KVL_DATA_JSON__'));
 assert.ok(html.includes('PROTOTYPE v1'));
 for(const s of ['선수명','생년월일','POS','신장','소속팀','Volleybox','참가 이력','대회별','남자대표팀','선수명 검색']){
  assert.ok(html.includes(s),'missing '+s);
 }
 assert.ok(html.includes('"total":26'));
 assert.ok(html.includes('"club":"Ziraat Bankkart Ankara"'));
 assert.ok(html.includes('data-filter="MULTI"'));
 assert.ok(!html.includes('2026 AVC 남자컵 남자부'));
 assert.ok(!html.includes('src="https://'));
 assert.ok(html.includes('min-width:0'));
});

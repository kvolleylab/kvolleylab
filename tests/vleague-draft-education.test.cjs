'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const api=require('../assets/js/kvl-vleague-draft-bridge-v1.js');
const bridge=read('data/kovo/official-notices/2026-27/draft_registration_bridge.json');
const education=read('data/draft-applicants/2026-27/education-v1.json');
const master=read('data/master/player_master_229_v2.json');

test('KOVO verified school histories match official applicant identity',()=>{
 assert.equal(api.validEducation(education),true);
 assert.equal(education.season,'2026-27');
 const ids=education.records.map(x=>x.applicant_id);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(education.record_count,education.records.length);
 assert.ok(education.record_count>=90);
});

test('both verified schools appear for university draftees without altering original bridge',()=>{
 const original=JSON.stringify(bridge);
 const x=api.withEducation(bridge,education);
 for(const [name,high,uni] of [
  ['윤경','남성고','인하대'],
  ['임인규','수성고','인하대'],
  ['전유석','문일고','중부대']
 ]){
  const r=x.registered.find(p=>p.name===name);
  assert.equal(r.education.high_school,high);
  assert.equal(r.education.university,uni);
  const p=x.profiles.find(p=>p.system.player_id===r.player_id);
  assert.equal(p.current_roster.high_school,high);
  assert.equal(p.current_roster.university,uni);
  assert.equal(p.current_roster.team_name,r.team);
 }
 assert.equal(JSON.stringify(bridge),original);
 assert.equal(x.registration_count,bridge.registration_count);
 assert.equal(x.profile_count,bridge.profile_count);
 assert.equal(api.validBridge(x),true);
});

test('one or both missing academic fields are omitted, not filled with false labels',()=>{
 const x=api.withEducation(bridge,education);
 const a=x.registered.find(p=>p.name==='김아중');
 assert.equal(a.education.high_school,'청수고');
 assert.equal(Object.hasOwn(a.education,'university'),false);
 const b=x.registered.find(p=>p.name==='배하준');
 assert.equal(b.education.university,'성균관대');
 assert.equal(Object.hasOwn(b.education,'high_school'),false);
 const unverified=x.registered.find(p=>p.name==='이율리');
 assert.equal(unverified.education,undefined);
});

test('same-name or different-gender applicant identity never receives academic facts',()=>{
 const e=structuredClone(education);
 const r=e.records.find(x=>x.name==='윤경');
 r.name='다른 선수';
 const x=api.withEducation(bridge,e).registered.find(p=>p.name==='윤경');
 assert.equal(x.education,undefined);
 const x2=structuredClone(education);
 x2.records.push({...x2.records[0]});
 x2.record_count++;
 assert.equal(api.validEducation(x2),false);
 assert.throws(()=>api.withEducation(bridge,x2),/Invalid KOVO draft education/);
});

test('college/high-school data does not create new professional player IDs',()=>{
 const x=api.withEducation(bridge,education);
 const knownIds=new Set(master.map(p=>p.system.player_id));
 const before=new Set(bridge.profiles.map(p=>p.system.player_id));
 const after=new Set(x.profiles.map(p=>p.system.player_id));
 assert.deepEqual(after,before);
 const flagged=x.registered.find(p=>p.name==='김아중');
 assert.equal(flagged.player_id,null);
 assert.equal(knownIds.has('KVL-P-000008'),false,'original university ID stays university source');
});

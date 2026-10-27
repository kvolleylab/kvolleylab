const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const manifest=json('data/master/school_logo_manifest_2026.json'),contract=require('../assets/js/kvl-competition-config-v2.js'),dataAPI=require('../assets/js/kvl-competition-data-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js');
const plain=v=>JSON.parse(JSON.stringify(v));
async function runtime(url='https://kvolleylab.com/team-detail.html?name=금호중',fail=false){
 const dom=new JSDOM('<body><main data-kvl-shell></main></body>',{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.fetch=async()=>{if(fail)throw Error('unavailable');return {ok:true,json:async()=>plain(manifest)}};
 w.eval(read('assets/js/school-logo-runtime.js'));await w.KVLSchoolLogos.ready;return {w,doc:w.document,api:w.KVLSchoolLogos};
}
async function competition(slug,view='rosters',team){
 const config=json(`data/competitions/${slug}/config.json`),source=json(`data/competitions/${slug}/data.json`),url=`https://kvolleylab.com/competition-engine.html?competition=${slug}&view=${view}${team?'&team='+team:''}`;
 const d=modules.apply(contract.assemble(config,source,{slug,canonical:url}),config.modules||[],(config.modules||[]).map(m=>json(`data/competitions/${slug}/${m.source}`)));
 const r=await runtime(url),{w}=r;w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});w.CSS={escape:v=>String(v)};w.HTMLElement.prototype.scrollIntoView=()=>{};w.print=()=>{};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(r.api.decorate(d));w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();
 return {...r,d:w.KVL_COMPETITION_V2_DATA,source:d};
}
test('all 71 confirmed assets are real 512px RGBA PNGs with recorded byte hashes',()=>{
 assert.equal(Object.keys(manifest.teams).length,71);
 for(const [name,t] of Object.entries(manifest.teams)){
  const b=fs.readFileSync(path.join(root,manifest.basePath,t.file));assert.equal(b.subarray(1,4).toString(),'PNG',name);assert.equal(b.readUInt32BE(16),512,name);assert.equal(b.readUInt32BE(20),512,name);assert.equal(b[24],8,name);assert.equal(b[25],6,name);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),t.sha256,name);assert.equal(t.status,'confirmed');assert.equal(t.verified_at,'2026-10-27');
 }
});
test('exact approved aliases and full names resolve; duplicate province, uncertain labels and pending logos do not',async()=>{
 const {w,api}=await runtime();try{
  assert.equal(api.entryFor('금호중학교','경북').display_name,'경북 영천 금호중학교');assert.equal(api.entryFor('금호중학교','광주'),null);
  assert.equal(api.entryFor('인하부중'),api.entryFor('인하사대부속중'));assert.equal(api.entryFor(' 인하대학교 사범대학 부속중학교 '),api.entryFor('인하부중'));
  assert.equal(api.entryFor('광주체고'),api.entryFor('광주체육고'));assert.equal(api.entryFor('경북대학교사범대부설중학교'),api.entryFor('경북사대부설중'));
  for(const name of ['모종중','홍천군체육회U15','목포영화중','화성시체육회','찬안쌍용중','체천산업고','동명중','근영중','금정중','문흥중','함안중'])assert.equal(api.entryFor(name),null,name);
  assert.equal(api.entryFor('화성시체육회',null,'KVL-COMP-CBS-2026-HIGH-MEN'),api.entryFor('화성시-G스포츠클럽'));
  assert.equal(api.entryFor('화성시체육회',null,'OTHER-COMPETITION'),null);
  assert.equal(api.entryFor('찬안쌍용중',null,'KVL-COMP-CBS-2026-MIDDLE-MEN'),api.entryFor('천안쌍용중'));
  assert.equal(api.entryFor('동명중',null,'KVL-COMP-SCHOOL-SCHOOL-SPRING-2026-MIDDLE-MEN'),api.entryFor('진주동명중'));
  assert.equal(api.entryFor('근영중',null,'KVL-COMP-SCHOOL-SCHOOL-SPRING-2026-MIDDLE-WOMEN'),api.entryFor('전주근영중'));
 }finally{w.close();}
});
test('presentation decoration preserves participant identifiers, source regions, match records and roster membership',async()=>{
 const {w,api}=await runtime();try{
  for(const slug of ['cbs-2026-middle-men','national-sports-festival-men-u18-2026','university-league-women-2026']){
   const original=json(`data/competitions/${slug}/data.json`),before=JSON.stringify(original),d={...original,competitionFamily:'domestic'},after=api.decorate(d);
   assert.equal(JSON.stringify(original),before);assert.strictEqual(after.matches,d.matches);assert.strictEqual(after.rosters,d.rosters);
   assert.deepEqual(plain(after.participants).map(({logo,schoolDisplayName,schoolRegion,logoVerifiedAt,...t})=>t),plain(original.participants).map(({logo,...t})=>t));
  }
  for(const family of ['pro','international']){const d={competitionFamily:family,participants:[{code:'KEEP',name:'금호중',logo:'/keep.svg'}]};assert.strictEqual(api.decorate(d),d);}
 }finally{w.close();}
});
test('dynamically inserted logo nodes and reused labels refresh, including safe fallback on a pending logo',async()=>{
 const {w,doc,api}=await runtime();try{
  const el=doc.createElement('span');el.className='sc-team-logo';el.setAttribute('aria-label','금호중 로고 자리');doc.body.append(el);await new Promise(r=>w.setTimeout(r,0));assert.ok(el.querySelector('img').src.endsWith(encodeURI('금호중.png')));
  el.setAttribute('aria-label','남성중 로고 자리');await new Promise(r=>w.setTimeout(r,0));assert.ok(el.querySelector('img').src.endsWith(encodeURI('남성중.png')));
  el.setAttribute('aria-label','모종중 로고 자리');await new Promise(r=>w.setTimeout(r,0));assert.equal(el.querySelector('img'),null);assert.equal(el.classList.contains('has-school-logo'),false);assert.ok(el.textContent);
  el.setAttribute('aria-label','금호중 로고 자리');api.refresh();el.querySelector('img').dispatchEvent(new w.Event('error'));assert.equal(el.querySelector('img'),null);assert.equal(el.classList.contains('has-school-logo'),false);
 }finally{w.close();}
});
test('generic school header displays verified location with the original routing ID',async()=>{
 const {w,doc}=await runtime('https://kvolleylab.com/team-detail.html?name=금호중&id=EXISTING-ID');try{
  doc.body.innerHTML='<h1 id="tdTeamName"></h1><p id="tdMeta"></p><span id="tdTeamId"></span><span id="tdTeamLogo" class="sc-team-logo"></span><span id="tdLogoStatus"></span>';w.eval(read('assets/js/team-detail.js'));
  assert.equal(doc.querySelector('h1').textContent,'경북 영천 금호중학교');assert.equal(doc.querySelector('#tdTeamId').textContent,'EXISTING-ID');assert.equal(new URL(w.location.href).searchParams.get('name'),'금호중');
  await new Promise(r=>w.setTimeout(r,0));
 }finally{w.close();}
});
test('CBS team-results header and team links keep the existing competition code',async()=>{
 const {w,doc,d}=await competition('cbs-2026-middle-men','team','S004');try{
  assert.equal(doc.querySelector('[data-kvl-component="team-results"] h2').textContent,'경북 영천 금호중학교 경기결과');assert.ok(doc.querySelector('[data-kvl-component="team-results"] img').src.endsWith(encodeURI('금호중.png')));
  assert.equal(d.participants.find(t=>t.code==='S004').name,'금호중');assert.ok([...doc.querySelectorAll('[data-team-results="S004"]')].every(a=>new URL(a.href).searchParams.get('team')==='S004'));
 }finally{w.close();}
});
test('national-festival roster and print use the verified school location without changing player IDs',async()=>{
 const code='NSF107-0308030101',{w,doc,d,source}=await competition('national-sports-festival-men-u18-2026','rosters',code);try{
  assert.equal(doc.querySelector('#kvl-roster-team').textContent,'대구 중구 경북대학교사범대학부설고등학교');assert.deepEqual(plain(d.rosters),source.rosters);
  assert.equal(doc.querySelectorAll('[data-roster-player]').length,source.rosters[code].players.length);
  const printing=w.KVLCompetitionComponentsV2.printRoster(d,code,'selected');assert.ok(doc.querySelector('.kvl-print-head h1').textContent.startsWith('대구 중구 경북대학교사범대학부설고등학교'));await printing;
 }finally{w.close();}
});
test('all six women university roster cards use finalized PNGs without university ID inference',async()=>{
 const {w,doc,d}=await competition('university-league-women-2026');try{
  assert.equal(d.participants.length,6);assert.equal(doc.querySelectorAll('.kvl1180-participant-button img').length,6);for(const t of d.participants)assert.ok(t.logo.endsWith('.png'));assert.deepEqual(plain(d.participants.map(t=>t.code)),['KIU','KWU','DKU','MCS','WKU','HNU']);
 }finally{w.close();}
});
test('a missing logo manifest leaves the competition usable with existing fallbacks',async()=>{
 const {w,api}=await runtime(undefined,true);try{const d={competitionFamily:'domestic',participants:[{code:'S004',name:'금호중'}]};assert.strictEqual(api.decorate(d),d);assert.equal(api.entryFor('금호중'),null);}finally{w.close();}
});

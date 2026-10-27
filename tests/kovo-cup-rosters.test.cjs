'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js'),dataApi=require('../assets/js/kvl-competition-data-v2.js');
function load(slug){
 const base=`data/competitions/${slug}/`,config=json(base+'config.json');
 const data=modules.apply(configApi.assemble(config,json(base+config.data),{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`}),config.modules||[],(config.modules||[]).map(m=>json(base+m.source)));
 assert.deepEqual(dataApi.validate(data,{production:true}),[]);
 return data;
}
function setup(slug,{mobile=false,team=''}={}){
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=${slug}&view=rosters${team?'&team='+team:''}`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:mobile});w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(load(slug));
 w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
 return {w,doc:w.document,d:w.KVL_COMPETITION_V2_DATA};
}
const expected={men:{KAL:19,SFB:22,HDC:18,OKF:17,WRC:20,KEP:15,KBI:19},women:{SOO:17,IBK:18,RSP:16,HPS:20,GSC:17,KEX:15,HHC:18}};
for(const gender of ['men','women']){
 const slug=`kovo-cup-${gender}-2026`;
 test(gender+': complete pamphlet module, stable identity links and unresolved source conflicts',()=>{
  const d=load(slug),counts=Object.fromEntries(Object.entries(d.rosters).map(([k,r])=>[k,r.players.length]));assert.deepEqual(counts,expected[gender]);
  const known=new Map(json('data/national/player_id_links_v1.json').links.map(p=>[p.player_id,{name:p.name_ko,dob:p.birth_date}]));
  for(const f of ['data/master/player_master_229_v2.json','data/master/player_master_school_v1.json']){const raw=json(f);for(const p of Array.isArray(raw)?raw:raw.players)if(!known.has(p.system.player_id))known.set(p.system.player_id,{name:p.identity.name_ko,dob:p.identity.birth_date});}
  for(const t of d.participants){
   const r=d.rosters[t.code];assert.equal(t.rosterCount,r.players.length);assert(dataApi.rosterTarget(d,t).available);assert.equal(r.rosterKind,'official-pamphlet');
   assert.equal(new Set(r.players.map(p=>p.number)).size,r.players.length);
   for(const p of r.players){assert.equal(p.sourceId,r.sourceId);assert.equal(p.sourcePage,r.sourcePage);if(p.playerId)assert.deepEqual(known.get(p.playerId),{name:p.name,dob:p.dob});if(p.dobStatus){assert.equal(p.dob,null);assert(p.sourceDob&&p.sourceNote);}if(p.volleybox)assert.match(p.volleybox,/^https:\/\/(?:[a-z]+\.)?volleybox\.net\//);}
  }
 });
 for(const mobile of [false,true])test(gender+': '+(mobile?'mobile':'desktop')+' selection, search, history and placement',()=>{
  const {w,doc,d}=setup(slug,{mobile});try{
   assert.equal(doc.querySelectorAll('[data-roster-player]').length,0);
   const participants=doc.querySelector('[data-kvl-component=participants]'),roster=doc.querySelector('#team-roster');
   for(const t of d.participants){
    const a=doc.querySelector(`[data-team-code="${t.code}"]`);a.click();assert.equal(new URL(w.location.href).searchParams.get('team'),t.code);assert.equal(a.getAttribute('aria-expanded'),'true');assert.equal(doc.querySelector('#kvl-roster-team').textContent,t.name);assert.equal(roster.querySelectorAll('[data-roster-player]').length,t.rosterCount);assert.equal(roster.parentElement,participants.parentElement);assert(participants.compareDocumentPosition(roster)&w.Node.DOCUMENT_POSITION_FOLLOWING);
   }
   const active=doc.querySelector('[data-team-code].is-active'),search=doc.querySelector('.dv2-participant-search input');
   search.value='없는 팀';search.dispatchEvent(new w.Event('input'));assert(roster.hidden);assert.equal(doc.querySelectorAll('[data-team-code]:not([hidden])').length,0);
   search.value='';search.dispatchEvent(new w.Event('input'));assert(!roster.hidden);assert.equal(doc.querySelectorAll('[data-team-code]:not([hidden])').length,7);
   active.click();assert(!new URL(w.location.href).searchParams.has('team'));assert.equal(roster.querySelectorAll('[data-roster-player]').length,0);
   w.history.replaceState(null,'',`?competition=${slug}&view=rosters&team=${d.participants[0].code}`);w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(doc.querySelector('#kvl-roster-team').textContent,d.participants[0].name);assert.equal(roster.parentElement,participants.parentElement);assert(participants.compareDocumentPosition(roster)&w.Node.DOCUMENT_POSITION_FOLLOWING);
  }finally{w.close();}
 });
 test(gender+': deep links and all-team print retain every player and source label',async()=>{
  const first=Object.keys(expected[gender])[0],{w,doc,d}=setup(slug,{team:first});try{
   assert.equal(doc.querySelectorAll('[data-roster-player]').length,expected[gender][first]);
   Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});let printed=0;w.print=()=>printed++;
   await w.KVLCompetitionComponentsV2.printRoster(d,first,'all');assert.equal(printed,1);
   assert.equal(doc.querySelectorAll('.kvl-print-row').length,gender==='men'?130:121);assert.equal(doc.querySelectorAll('.kvl-print-sheet').length,14);
   assert([...doc.querySelectorAll('.kvl-print-meta')].every(e=>e.textContent.includes('공식 팸플릿')));
   assert([...doc.querySelectorAll('.kvl-print-table-head')].every(e=>e.lastElementChild.textContent==='국적'));
  }finally{w.close();}
 });
}
test('international roster columns and domestic school accordion remain opt-in independent',()=>{
 for(const slug of ['vnl-men-2026','national-sports-festival-men-u18-2026']){
  const d=load(slug),team=d.participants.find(t=>d.rosters?.[t.code]?.players?.length).code,{w,doc}=setup(slug,{mobile:true,team});try{
   assert(!doc.querySelector('#rosters').classList.contains('has-club-rosters'));assert(doc.querySelector('.kvl1180-roster-table'));assert.equal(doc.querySelector('.kvl-club-roster-table'),null);
   const heading=doc.querySelector('.kvl1180-roster-table-head').textContent;
   if(slug.startsWith('vnl'))assert(heading.includes('영문명한글명'));else{assert(heading.includes('소속 · 학년'));assert.equal(doc.querySelector(`[data-team-code="${team}"]`).nextElementSibling,doc.querySelector('#team-roster'));}
  }finally{w.close();}
 }
});
test('audit totals and six pending DOBs remain explicit, without publishing archive credentials',()=>{
 const audit=json('data/sources/kovo-cup-2026/roster-audit.json'),players=['men','women'].flatMap(g=>Object.values(load(`kovo-cup-${g}-2026`).rosters).flatMap(r=>r.players));
 assert.equal(players.length,251);assert.equal(audit.totalPlayers,251);assert.equal(players.filter(p=>p.playerId).length,54);assert.equal(audit.profileLinks,54);assert.equal(players.filter(p=>p.dobStatus).length,6);
 assert.deepEqual(players.filter(p=>p.dobStatus==='source-conflict').map(p=>p.name).sort(),['최민호','하승우','박상우','정호영','표승주'].sort());
 assert.doesNotMatch(JSON.stringify(audit),/drive\.google|docs\.google|access_token|signedURL|sig=/i);
});

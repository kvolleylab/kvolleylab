'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const configApi=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js'),dataApi=require('../assets/js/kvl-competition-data-v2.js');
function load(gender){
 const slug=`v-league-${gender}-2026-27`,base=`data/competitions/${slug}/`,config=json(base+'config.json');
 const data=modules.apply(configApi.assemble(config,json(base+config.data),{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`}),config.modules||[],(config.modules||[]).map(m=>json(base+m.source)));
 assert.deepEqual(dataApi.validate(data,{production:true}),[]);return data;
}
function setup(gender,{mobile=false,team='',view='rosters',transform}={}){
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=v-league-${gender}-2026-27&view=${view}${team?'&team='+team:''}`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:mobile});w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(load(gender));if(transform)transform(w.KVL_COMPETITION_V2_DATA);
 w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
 return {w,doc:w.document,d:w.KVL_COMPETITION_V2_DATA};
}
const expected={men:{KAL:19,HDC:18,WRC:20,KBI:19,KEP:15,OKF:17,SFB:23},women:{GSC:17,KEX:15,HHC:18,HPS:20,IBK:18,RSP:16,SOO:17}};
for(const gender of ['men','women']){
 test(gender+': season membership, source fields and canonical identity integrity',()=>{
  const d=load(gender);assert.equal(d.competitionFamily,'pro');assert.equal(d.structure.presentationCategory,'pro-league');assert.equal(d.structure.knockout.mode,'pro-postseason');
  assert.deepEqual(Object.fromEntries(Object.entries(d.rosters).map(([code,r])=>[code,r.players.length])),expected[gender]);
  const known=new Map(json('data/national/player_id_links_v1.json').links.map(p=>[p.player_id,{name:p.name_ko,dob:p.birth_date}]));
  for(const f of ['data/master/player_master_229_v2.json','data/master/player_master_school_v1.json']){const raw=json(f);for(const p of Array.isArray(raw)?raw:raw.players)if(!known.has(p.system.player_id))known.set(p.system.player_id,{name:p.identity.name_ko,dob:p.identity.birth_date});}
  for(const t of d.participants){
   const r=d.rosters[t.code];assert.equal(t.rosterCount,r.players.length);assert.equal(r.rosterKind,'season-notice-snapshot');assert(dataApi.rosterTarget(d,t).available);
   assert.equal(new Set(r.players.map(p=>p.number)).size,r.players.length);
   for(const p of r.players){
    assert.equal(p.sourceId,r.sourceId);assert.match(p.registrationSource,/^https:\/\/kovo.co.kr\/news\/official-notices\/\d+$/);
    assert(p.nationalityCode&&p.nationality);assert(p.heightCm>100&&p.heightCm<230);
    if(p.playerId)assert.deepEqual(known.get(p.playerId),{name:p.name,dob:p.dob});
    if(p.dobStatus){assert.equal(p.dob,null);assert.equal(p.playerId,null);assert(p.sourceNote);}
   }
  }
  assert.equal(d.matches.length,126);assert.equal(new Set(d.matches.map(m=>m.id)).size,126);assert(d.matches.every(m=>!m.score));
 });
 for(const mobile of [false,true])test(gender+': '+(mobile?'mobile':'desktop')+' team selection, search, deselection and history',()=>{
  const {w,doc,d}=setup(gender,{mobile});try{
   assert(doc.body.classList.contains('kvl-pro-league-domestic-v2'));assert(!doc.body.classList.contains('kvl-pro-cup-domestic-v2'));
   const participants=doc.querySelector('[data-kvl-component=participants]'),roster=doc.querySelector('#team-roster');
   for(const t of d.participants){const a=doc.querySelector(`[data-team-code="${t.code}"]`);a.click();assert.equal(doc.querySelector('#kvl-roster-team').textContent,t.name);assert.equal(roster.querySelectorAll('[data-roster-player]').length,t.rosterCount);assert.equal(roster.parentElement,participants.parentElement);assert(participants.compareDocumentPosition(roster)&w.Node.DOCUMENT_POSITION_FOLLOWING);assert.equal(a.getAttribute('aria-expanded'),'true');}
   const a=doc.querySelector('[data-team-code].is-active'),search=doc.querySelector('.dv2-participant-search input');assert.equal(search.placeholder,'팀명 검색');
   search.value='찾을 수 없는 팀';search.dispatchEvent(new w.Event('input'));assert(roster.hidden);
   search.value='';search.dispatchEvent(new w.Event('input'));assert(!roster.hidden);a.click();assert.equal(roster.querySelectorAll('[data-roster-player]').length,0);
   w.history.replaceState(null,'',`?competition=v-league-${gender}-2026-27&view=rosters&team=${d.participants[0].code}`);w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(doc.querySelector('#kvl-roster-team').textContent,d.participants[0].name);
   const flags=roster.querySelectorAll('.kvl-club-nationality img');assert.equal(flags.length,d.participants[0].rosterCount);assert([...flags].every(img=>/^https:\/\/flagcdn.com\/w40\/[a-z]{2}.png$/.test(img.src)));
  }finally{w.close();}
 });
 test(gender+': season UI, all rounds, standings and postseason remain available',()=>{
  const {w,doc,d}=setup(gender,{view:'overview'});try{
   assert.equal(doc.querySelector('[data-gender-link=men]').textContent,'남자부');assert.equal(doc.querySelector('[data-gender-link=women]').textContent,'여자부');
   assert.equal(doc.querySelector('.dv2-overview-summary'),null);assert.equal(doc.querySelectorAll('.dv2-standings-table tbody tr').length,7);assert.equal(doc.querySelector('.kvl1180-tabs [data-view=knockout] span').textContent,'포스트시즌');
   assert.equal(doc.querySelectorAll('.is-domestic-single-league .kvl1180-combined-row').length,7);assert.equal(doc.querySelectorAll('.kvl1180-pro-postseason-stage').length,3);
   assert.equal(doc.querySelectorAll('.dv2-team-tile').length,7);assert.equal(d.structure.schedule.stages.length,7);
   const before=JSON.stringify(d);w.KVLCompetitionComponentsV2.render();assert.equal(JSON.stringify(d),before);
   assert.match(doc.querySelector('.dv2-calendar-month').textContent,/10/);doc.querySelector('[data-dv2-month="1"]').click();assert.match(doc.querySelector('.dv2-calendar-month').textContent,/11/);
  }finally{w.close();}
 });
 test(gender+': deep links and print use season labels and complete nationality flags',async()=>{
  const first=Object.keys(expected[gender])[0],{w,doc,d}=setup(gender,{team:first});try{
   Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});let printed=0;w.print=()=>printed++;
   assert.equal(doc.querySelectorAll('[data-roster-player]').length,expected[gender][first]);assert(!doc.querySelector('.kvl1180-team-profile-meta').textContent.includes('정규리그조'));await w.KVLCompetitionComponentsV2.printRoster(d,first,'all');assert.equal(printed,1);
   const total=gender==='men'?131:121;assert.equal(doc.querySelectorAll('.kvl-print-row').length,total);assert.equal(doc.querySelectorAll('.kvl-print-row img').length,total);
   assert([...doc.querySelectorAll('.kvl-print-meta')].every(e=>e.textContent.includes('시즌 등록 공시 기준')));assert(!doc.querySelector('[data-kvl-component=print]')?.textContent.includes('공식 팸플릿 수록 명단'));
  }finally{w.close();}
 });
}
for(const gender of ['men','women']){
 test(gender+': overview uses previous season final order without changing roster order or current standings',()=>{
  const expectedOrder=gender==='men'?['KAL','HDC','WRC','KBI','KEP','OKF','SFB']:['GSC','KEX','HHC','HPS','IBK','SOO','RSP'];
  const {w,doc,d}=setup(gender,{view:'overview'});try{
   const tiles=[...doc.querySelectorAll('.dv2-team-tile')];
   assert.deepEqual(tiles.map(a=>new URL(a.href).searchParams.get('team')),expectedOrder);
   assert(tiles.every(a=>new URL(a.href).searchParams.get('view')==='rosters'&&new URL(a.href).hash==='#team-roster'));
   assert.deepEqual(tiles.map(a=>a.querySelector('small').textContent),expectedOrder.map((_,i)=>`지난 시즌 ${i+1}위`));
   assert.match(doc.querySelector('.dv2-team-order-note').textContent,/2025-26.*최종 순위/);
   const source=json('data/sources/v-league-2026-27/previous-season-ranking.json').divisions[gender];
   assert.deepEqual(Array.from(d.previousSeasonRanking.rows,r=>r.teamCode),source.rows.map(r=>r.teamCode));assert.equal(d.previousSeasonRanking.sourceId,source.sourceId);
   assert.equal(d.structure.participants.sort,'name-ko');
   assert([...doc.querySelectorAll('.dv2-standings-table [data-stat=rank]')].every(e=>e.textContent==='—'));
   assert([...doc.querySelectorAll('.dv2-standings-table [data-stat=points]')].every(e=>e.textContent==='0'));
   assert.match(doc.querySelector('.dv2-standings-note').textContent,/개막 전/);
   assert.equal(doc.querySelector('.dv2-overview-standings').parentElement.querySelector('a').getAttribute('href').includes('view=groups'),true);
  }finally{w.close();}
 });
 test(gender+': overview reflects authoritative season standings and keeps last season participants fixed',()=>{
  const {w,doc,d}=setup(gender,{view:'overview',transform:d=>{
   d.status='active';d.standingsNote='공식 결과 갱신 기준';d.standings.rows.reverse();
   d.standings.rows.forEach((r,i)=>Object.assign(r,{rank:i+1,points:21-i,wins:8-i,losses:i,statusLabel:'진행 중'}));
  }});try{
   const rows=[...doc.querySelectorAll('.dv2-standings-table tbody tr')];
   assert.deepEqual(rows.map(r=>r.dataset.standingTeam),Array.from(d.standings.rows,r=>r.team.code));
   assert.deepEqual(rows.map(r=>[...r.querySelectorAll('td')].map(c=>c.textContent)),Array.from(d.standings.rows,r=>[r.rank,r.points,r.wins,r.losses].map(String)));
   assert.equal(doc.querySelector('.dv2-standings-note').textContent,d.standingsNote);
   assert.deepEqual([...doc.querySelectorAll('.dv2-team-tile')].map(a=>new URL(a.href).searchParams.get('team')),Array.from(d.previousSeasonRanking.rows,r=>r.teamCode));
   const original=JSON.stringify(d);w.KVLDomesticHomeV2.apply(d);assert.equal(JSON.stringify(d),original);assert.equal(doc.querySelectorAll('.dv2-standings-table').length,1);
  }finally{w.close();}
 });
 test(gender+': overview never invents missing standings values or rows',()=>{
  const {w,doc}=setup(gender,{view:'overview',transform:d=>{d.standings.rows=d.standings.rows.slice(0,1);Object.assign(d.standings.rows[0],{rank:null,points:null,wins:undefined,losses:null});}});
  try{assert.equal(doc.querySelectorAll('.dv2-standings-table tbody tr').length,1);assert([...doc.querySelectorAll('.dv2-standings-table tbody td')].every(c=>c.textContent==='—'));}finally{w.close();}
 });
}
test('latest reviewed changes supersede older MASTER and Cup membership',()=>{
 const d=load('men'),kal=d.rosters.KAL.players;
 const lee=kal.find(p=>p.name==='이준');assert.equal(lee.number,13);assert.equal(lee.playerId,'KVL-P-001542');assert(lee.registrationSource.endsWith('/158242'));
 assert(!kal.some(p=>['최원빈','송민근'].includes(p.name)));assert.equal(kal.find(p=>p.name==='김영태').position,'MB');assert(kal.find(p=>p.name==='김영태').lastChangeSource.endsWith('/157686'));
 assert(!d.rosters.SFB.players.some(p=>p.name==='이윤재'));
 const all=[...Object.values(d.rosters),...Object.values(load('women').rosters)].flatMap(r=>r.players);
 assert.equal(all.filter(p=>p.nationalityCode!=='KOR').length,28);assert.equal(all.filter(p=>p.dobStatus).length,6);assert.equal(all.filter(p=>p.playerId).length,55);
 const text=JSON.stringify(all);assert(!/drive.google|docs.google|salary|관찰메모|예상 연봉/.test(text));
});

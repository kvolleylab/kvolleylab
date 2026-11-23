'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const unified=require('../assets/js/kvl-international-unified-roster-v1.js');
const intl=require('../assets/js/kvl-international-countries-v1.js');
const index=read('data/international/country-roster-index-v1.json'),countries=read('data/international/country-directory-v1.json');
const registry=read('data/competitions/avc-men-continental-2026-clubs-2026-27.json');
const currentClubs=read('data/international/player-club-registry-2026-27-v1.json');
const master=read('data/master/player_master_international_v1.json');
const sourceCache=new Map();
const source=p=>{if(!sourceCache.has(p))sourceCache.set(p,read(p));return sourceCache.get(p)};
function scope(code,gender,year=2026,club=true){
 const country=countries.countries.find(c=>c.code===code);assert.ok(country);
 const refs=index.snapshots.filter(r=>r.country_code===code&&r.gender===gender&&r.year===year);
 const sets=refs.map(snapshot=>({snapshot,team:intl.sourceTeam(snapshot,source(snapshot.source_path))}));
 for(const x of sets)assert.ok(x.team&&Array.isArray(x.team.players),x.snapshot.snapshot_id);
 const before=JSON.stringify(sets);
 const model=unified.build(sets,{country,gender,year,clubRegistry:club?registry:null,playerClubRegistry:currentClubs,
  profileResolver:raw=>intl.verifiedProfileLink(intl.normalizePlayer(raw),gender,country,master,{isConflict:id=>/^KVL-P-0016(?:2\d|3\d|4[0-5])$/.test(id)})});
 assert.equal(JSON.stringify(sets),before,'unified view must not mutate official source player arrays');
 return model;
}
test('country index 40 countries / 89 source pointers remains read-only and scoped to original events',()=>{
 assert.equal(countries.country_count,40);assert.equal(index.snapshot_count,89);
 assert.equal(unified.important({competition_slug:'vnl-men-2026'}),true);
 assert.equal(unified.important({competition_slug:'asian-games-men-2026'}),true);
 assert.equal(unified.important({competition_slug:'avc-men-continental-2026'}),false);
 assert.equal(unified.important({competition_slug:'avc-men-cup-2026'}),false);
});
test('Japan 2026 men combine only exact identity evidence to 26 players without losing any event entry',()=>{
 const m=scope('JPN','men');
 assert.equal(m.total,26);assert.equal(m.sourceTotal,42);
 assert.equal(m.events.length,3);
 assert.equal(m.events.filter(x=>x.major).length,2);
 for(const [slug,count] of [['vnl-men-2026',16],['asian-games-men-2026',12],['avc-men-continental-2026',14]]){
  const evt=m.events.find(x=>x.slug===slug);assert.ok(evt);assert.equal(evt.count,count);
  assert.equal(m.rows.filter(p=>p.matches.some(r=>r.slug===slug)).length,count);
 }
 assert.equal(m.rows.reduce((n,p)=>n+p.count,0),42);
 assert.equal(m.rows.find(p=>p.en==='Tatsunori Otsuka').count,3);
 assert.equal(m.rows.find(p=>p.en==='Larry Ik Evbade-Dan').count,2);
 assert.ok(m.rows.every(p=>p.matches.length===new Set(p.matches.map(q=>q.id)).size));
});
test('Different Fukatsu with same #3 do not merge and exact verified club/Volleybox/DOB remain',()=>{
 const m=scope('JPN','men');
 const f=m.rows.filter(p=>p.en.endsWith('Fukatsu'));
 assert.equal(f.length,2);assert.notEqual(f[0].dob,f[1].dob);
 assert.ok(f.every(x=>x.number==='#3'));assert.ok(f.every(x=>x.count===1));
 const y=m.rows.find(p=>p.en==='Yuki Ishikawa');
 assert.ok(y);assert.equal(y.dob,'1995-12-11');assert.equal(y.club,'Ziraat Bankkart Ankara');
 assert.equal(y.directBox,'https://volleybox.net/yuki-ishikawa-p705');assert.match(y.KVLProfile,/^player\.html\?id=KVL-P-\d{6}$/);
 assert.equal(y.matches.length,2);
 assert.equal(y.clubCountry,'Türkiye','Verified 2026-27 club country must accompany the selected club');
 assert.equal(y.clubLeague,'SMS Grup Efeler Ligi');
 const o=m.rows.find(p=>p.en==='Tatsunori Otsuka');
 assert.ok(o);assert.equal(o.clubCountry,'Italy');assert.ok(o.clubLeague);
 const a=m.rows.find(p=>p.en==='Yudai Arai');
 assert.ok(a);assert.equal(a.clubCountry,'Japan','Asian Games confirmed club country must be reused');
 const unverified=m.rows.find(p=>p.en==='Akihiro Fukatsu');
 assert.ok(unverified);assert.equal(unverified.club,'');assert.equal(unverified.clubCountry,'');
 assert.equal(m.rows.find(p=>p.en==='Akihiro Yamauchi').height,204);
 assert.ok(m.rows.filter(x=>x.club).length>=10);
});
test('Current international club registry supplements older tournament snapshots without changing source arrays',()=>{
 assert.equal(currentClubs.season,'2026-27');
 assert.ok(Object.keys(currentClubs.players).length>=7);
 for(const row of Object.values(currentClubs.players)){
  assert.ok(['CONFIRMED','REVIEWED'].includes(row.status));
  assert.match(row.source,/^https:\/\//);
  assert.ok(row.club&&row.leagueCountry);
 }
 const iran=scope('IRI','men');
 const amin=iran.rows.find(p=>p.directBox.includes('amin-esmaeilnezhad-p40943'));
 const mobin=iran.rows.find(p=>p.directBox.includes('mobin-nasri-p72385'));
 const morteza=iran.rows.find(p=>p.directBox.includes('morteza-sharifi-p12027'));
 assert.equal(amin?.club,'Hiroshima Thunders');
 assert.equal(mobin?.club,'Hiroshima Thunders');
 assert.equal(morteza?.club,'Hebei Baoding Wolves');
 assert.match(amin?.clubProof||'',/^https:\/\//);
});
test('Current club batch 3 connects reviewed 2026-27 clubs after direct Volleybox linking',()=>{
 assert.ok(Object.keys(currentClubs.players).length>=202);
 const checks={
  '1222':['Berlin Recycling Volleys','Germany'],
  '45744':['Olympiakós','Greece'],
  '71582':['Gas Sales Bluenergy Piacenza','Italy'],
  '23662':['Incheon Korean Air Jumbos','South Korea'],
  '63523':['Cucine Lube Civitanova','Italy'],
  '34274':['Sir Sicoma Monini Perugia','Italy'],
  '101299':['Valsa Group Modena','Italy'],
  '33775':['Cucine Lube Civitanova','Italy'],
  '1123':['ACH Volley Ljubljana','Slovenia']
 };
 for(const [id,[club,country]] of Object.entries(checks)){
  const row=currentClubs.players[id];assert.ok(row,id);assert.equal(row.club,club);assert.equal(row.leagueCountry,country);
  assert.ok(['CONFIRMED','REVIEWED'].includes(row.status));assert.match(row.source,/^https:\/\//);
 }
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 let known=0,total=0;
 for(const team of Object.values(vnl.rosters||{}))for(const p of team.players||[]){
  total++;const m=String(p.volleybox||'').match(/-p(\d+)\/?$/i),r=m&&currentClubs.players[m[1]];
  if(r&&['CONFIRMED','REVIEWED'].includes(r.status)&&r.club&&(!r.dob||!p.dob||r.dob===p.dob))known++;
 }
 assert.equal(total,284);assert.equal(known,177);
});

test('Reviewed Asian current-club batch 3 resolves only exact Volleybox identities',()=>{
 const expected={
  '47158':['Jakarta Bhayangkara Presisi','Indonesia'],
  '162416':['Arago de Sète','France'],
  '182668':['VK Aktobe','Kazakhstan'],
  '131056':['Al Khor S.C.','Qatar'],
  '104250':['Al Arabi S.C.','Qatar'],
  '30744':['Police Union','Qatar'],
  '30765':['Nakhon Ratchasima 3M Films VC','Thailand'],
  '41808':['Nakhon Ratchasima 3M Films VC','Thailand'],
  '72544':['UZTELECOM','Uzbekistan'],
  '131255':['Biên Phòng MB','Vietnam'],
  '131258':['Biên Phòng MB','Vietnam']
 };
 assert.ok(Object.keys(currentClubs.players).length>=217);
 for(const [id,[club,country]] of Object.entries(expected)){
  const row=currentClubs.players[id];assert.ok(row,'missing current club '+id);
  assert.equal(row.club,club);assert.equal(row.leagueCountry,country);
  assert.equal(row.status,'REVIEWED');assert.match(row.source,/^https:\/\//);
 }
});

test('Club league-country metadata is shown only for source-confirmed clubs',()=>{
 const raw=unified.identify({name:'테스트',en:'Test Player',club:{name:'Some Club',country:'Japan',leagueName:'Test League',confirmed:false}});
 assert.equal(raw.club,'');assert.equal(raw.clubCountry,'');assert.equal(raw.clubLeague,'');
 const confirmed=unified.identify({name:'테스트',en:'Test Player',club:{name:'Some Club',country:'Japan',confirmed:true}});
 assert.equal(confirmed.club,'Some Club');assert.equal(confirmed.clubCountry,'Japan');assert.equal(confirmed.clubLeague,'');
 const japan=scope('JPN','women');
 assert.ok(japan.rows.every(p=>!p.club||p.clubCountry===String(p.clubCountry||'')));
});
test('Verified country badge uses a single country-only label regardless of leagueName availability',()=>{
 assert.equal(unified.countryLabel('Japan'),'🇯🇵 JAPAN');
 assert.equal(unified.countryLabel('Italy'),'🇮🇹 ITALY');
 assert.equal(unified.countryLabel('Türkiye'),'🇹🇷 TÜRKIYE');
 assert.equal(unified.countryLabel(''), '');
 const confirmedNoLeague=unified.identify({name:'국가만 확인',club:{confirmed:true,name:'Verified Japan Club',country:'Japan'}});
 const confirmedWithLeague=unified.identify({name:'국가와 리그 확인',club:{confirmed:true,name:'Verified Japan Club',country:'Japan',leagueName:'SV.League Men'}});
 assert.equal(unified.countryLabel(confirmedNoLeague.clubCountry),unified.countryLabel(confirmedWithLeague.clubCountry));
 assert.equal(confirmedNoLeague.clubLeague,'');
 assert.equal(confirmedWithLeague.clubLeague,'SV.League Men','source league metadata must remain available for detail');
 const japan=scope('JPN','men');
 const a=japan.rows.find(p=>p.en==='Yudai Arai');
 const n=japan.rows.find(p=>p.en==='Yuji Nishida');
 assert.ok(a&&n);
 assert.equal(unified.countryLabel(a.clubCountry),unified.countryLabel(n.clubCountry),
  'Japan clubs should show the identical country label regardless of source tournament');
 assert.equal(unified.countryLabel(''),'', 'Missing confirmed country must not be guessed');
});
test('2026 VNL direct Volleybox audit keeps only six unresolved search links',()=>{
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 const players=Object.values(vnl.rosters||{}).flatMap(team=>team.players||[]);
 const direct=players.filter(p=>/^https:\/\/volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p\d+\/?$/i.test(String(p.volleybox||'')));
 const search=players.filter(p=>/^https:\/\/volleybox\.net\/(?:ko\/)?search\?q=/i.test(String(p.volleybox||'')));
 const invalid=players.filter(p=>!direct.includes(p)&&!search.includes(p));
 assert.equal(players.length,284);
 assert.equal(direct.length,278);
 assert.equal(search.length,6);
 assert.equal(invalid.length,0);
 assert.deepEqual(search.map(p=>p.en).sort(),[
  'Berkay Bayraktar','Denislav Bardarov','Dimitar Dimitrov',
  'Lorenzo Cortesia','Nivaldo Nadhir Dias Gomez','Pablo Sergio Koukartsev'
 ].sort());
 for(const p of direct)assert.equal(p.volleyboxLinkType==='profile'||p.volleyboxLinkType==='direct',true,p.en);
});

test('No unapproved athlete id reuse and false standalone Volleybox links',()=>{
 assert.equal(unified.volleybox('https://volleybox.net/ko/search?q=Akihiro').id,'');
 assert.ok(unified.volleybox('https://volleybox.net/ko/search?q=Akihiro').search);
 assert.equal(unified.volleybox('https://volleybox.net/yuki-ishikawa-p705').id,'705');
 assert.equal(unified.volleybox('javascript:alert(1)').id,'');
 assert.equal(unified.volleybox('https://volleybox.net.evil.com/x-p123').id,'');
 const sample=unified.identify({name:'선수',en:'Player',dob:'2026-01-01',position:'O',heightCm:190,volleybox:'https://volleybox.net/player-p1'});
 assert.equal(sample.position,'OP');
 assert.equal(sample.number,null);
 assert.ok(!sample.sourcePlayerId);
});
test('All countries, genders and years render their own source matches and never conflate unknown women DOB',()=>{
 const keys=new Set(index.snapshots.map(s=>s.country_code+'/'+s.gender+'/'+s.year));
 assert.ok(keys.size>40);
 for(const key of keys){
  const [code,gender,year]=key.split('/');
  const m=scope(code,gender,Number(year));
  assert.ok(m.total>0,key);
  assert.equal(m.sourceTotal,index.snapshots.filter(s=>s.country_code===code&&s.gender===gender&&s.year===Number(year)).reduce((n,s)=>n+s.player_count,0),key);
  assert.equal(m.rows.reduce((n,p)=>n+p.count,0),m.sourceTotal,key);
  assert.ok(m.rows.every(p=>!p.KVLProfile||/^player\.html\?id=KVL-P-\d{6}$/.test(p.KVLProfile)),key);
 }
 const japan=scope('JPN','women');
 const vnl=index.snapshots.find(s=>s.snapshot_id==='vnl-women-2026:JPN');
 assert.equal(vnl.player_count,14);
 assert.ok(japan.total>=14);assert.ok(japan.rows.some(p=>!p.dob),'Missing DOB should remain blank, not guessed');
 const never=unified.build([
  {snapshot:{snapshot_id:'x',country_code:'JPN',gender:'women',year:2026,competition_slug:'fixture-a',
   competition_title:'Test A',source_status_label:'등록',source_format:'embedded',player_count:1},
   team:{players:[{en:'Same Surname',number:2}]}},
  {snapshot:{snapshot_id:'y',country_code:'JPN',gender:'women',year:2026,competition_slug:'fixture-b',
   competition_title:'Test B',source_status_label:'등록',source_format:'embedded',player_count:1},
   team:{players:[{en:'Same Surname',number:2}]}}
 ],{country:countries.countries.find(x=>x.code==='JPN'),gender:'women',year:2026});
 assert.equal(never.total,2);
});
test('Country and gender boundaries are fail-closed; raw official source count mismatch rejects aggregation',()=>{
 const j=index.snapshots.find(s=>s.snapshot_id==='vnl-men-2026:JPN');
 const t=intl.sourceTeam(j,source(j.source_path));
 assert.throws(()=>unified.build([{snapshot:{...j,country_code:'BRA'},team:t}],
  {country:countries.countries.find(x=>x.code==='JPN'),gender:'men',year:2026}),/Inconsistent/);
 assert.throws(()=>unified.build([{snapshot:{...j,player_count:99},team:t}],
  {country:countries.countries.find(x=>x.code==='JPN'),gender:'men',year:2026}),/count changed/);
});
test('Production page keeps country cards, roster-first navigation, KOVO and auth gate',()=>{
 const html=fs.readFileSync(path.join(ROOT,'teams.html'),'utf8'),
   js=fs.readFileSync(path.join(ROOT,'assets/js/kvl-international-countries-v1.js'),'utf8');
 const gate=read('data/member-access-v1.json');
 assert.equal(gate.enabled,true);assert.ok(gate.protectedPaths.includes('teams.html'));
 assert.match(html,/kvl-international-unified-roster-v1\.js/);
 assert.match(html,/kvl-international-unified-roster-v1\.css/);
 assert.match(html,/kvl-vleague-roster-v2\.js/);
 assert.match(js,/data-country-year-select/);
 assert.match(js,/ktd-country-links/);
 assert.match(js,/data-country-selection/);
 assert.match(js,/data-country-unified/);
 assert.match(js,/KVLInternationalUnifiedRosterV1/);
});

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
 const akihiro=m.rows.find(p=>p.en==='Akihiro Fukatsu');
 assert.ok(akihiro);assert.equal(akihiro.dob,'1987-07-23');
 assert.equal(akihiro.directBox,'https://volleybox.net/akihiro-fukatsu-p2818');
 assert.equal(akihiro.club,'Tokyo Great Bears');assert.equal(akihiro.clubCountry,'Japan');
 assert.equal(akihiro.clubLeague,'SV.League Men');
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
 assert.equal(total,284);assert.ok(known>=177,'batch 3 VNL current-club coverage must not regress below 177');
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

test('Reviewed VNL current-club batch 4 resolves exact current-season identities',()=>{
 assert.ok(Object.keys(currentClubs.players).length>=225);
 const expected={
  '24845':['Acqua Sant’Anna Cuneo','Italy','SuperLega'],
  '26700':['AONS Milon Athens','Greece','Volley League'],
  '27593':['Jastrzębie Barkom','Poland','TAURON Liga'],
  '28911':['Gas Sales Bluenergy Piacenza','Italy','SuperLega'],
  '72170':['Gas Sales Bluenergy Piacenza','Italy','SuperLega'],
  '76868':['ZAKSA Kędzierzyn-Koźle','Poland','TAURON Liga'],
  '91503':['Gas Sales Bluenergy Piacenza','Italy','SuperLega'],
  '216089':['Hawaii Univ.','USA','NCAA']
 };
 for(const [id,[club,country,league]] of Object.entries(expected)){
  const row=currentClubs.players[id];assert.ok(row,'missing current club '+id);
  assert.equal(row.club,club);assert.equal(row.leagueCountry,country);assert.equal(row.leagueName,league);
  assert.equal(row.status,'REVIEWED');assert.match(row.source,/^https:\/\//);
 }
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 let known=0;
 for(const team of Object.values(vnl.rosters||{}))for(const p of team.players||[]){
  const m=String(p.volleybox||'').match(/-p(\d+)\/?$/i),r=m&&currentClubs.players[m[1]];
  if(r&&['CONFIRMED','REVIEWED'].includes(r.status)&&r.club&&(!r.dob||!p.dob||r.dob===p.dob))known++;
 }
 assert.ok(known>=185,'batch 4 must raise VNL current-club coverage to at least 185');
});

test('Reviewed VNL current-club batch 5 resolves Cuba Serbia USA current-season identities',()=>{
 assert.ok(Object.keys(currentClubs.players).length>=253);
 const expected={
  '1018':['NOVA Novokuybyshevsk','Russia','Russian Superleague'],
  '1244':['Rana Verona','Italy','SuperLega'],
  '4300':['Arago de Sète','France',''],
  '6607':['Itambé Minas','Brazil','Superliga Masculina'],
  '6623':['Osaka Bluteon','Japan','SV.League Men'],
  '8301':['Zenit St. Petersburg','Russia','Russian Superleague'],
  '24487':['Panionios G.s.s.','Greece','Volley League'],
  '25001':['Toray Arrows Shizuoka','Japan','SV.League Men'],
  '25501':['GKS Katowice','Poland','TAURON Liga'],
  '27585':['İstanbul Gençlik SK','Türkiye','SMS Grup Efeler Ligi'],
  '27618':['SCM Zalău','Romania','Divizia A1'],
  '28556':['Altekma SK','Türkiye','SMS Grup Efeler Ligi'],
  '29104':['Niš','Serbia','Superliga Srbije'],
  '29105':['Orenburzhye','Russia','Russian Superleague'],
  '32856':['NOVA Novokuybyshevsk','Russia','Russian Superleague'],
  '55241':['Alterna Stade Poitevin','France',''],
  '56669':['Orenburzhye','Russia','Russian Superleague'],
  '72826':['Acqua Sant’Anna Cuneo','Italy','SuperLega'],
  '77889':['Gas Sales Bluenergy Piacenza','Italy','SuperLega'],
  '77890':['Pepperdine University','USA','NCAA'],
  '89072':['Loyola University Chicago','USA','NCAA'],
  '113820':['Vero Volley Monza','Italy','SuperLega'],
  '115237':['SCM Zalău','Romania','Divizia A1'],
  '135802':['Akedaş Onikişubat Belediyespor','Türkiye','SMS Grup Efeler Ligi'],
  '142194':['VfB Friedrichshafen','Germany','1. Bundesliga'],
  '144908':['Hiroshima Thunders','Japan','SV.League Men'],
  '200230':['Shinshu Matsumoto Tridents','Japan','SV.League Men'],
  '216308':['Pepperdine University','USA','NCAA']
 };
 for(const [id,[club,country,league]] of Object.entries(expected)){
  const row=currentClubs.players[id];assert.ok(row,'missing current club '+id);
  assert.equal(row.club,club);assert.equal(row.leagueCountry,country);assert.equal(row.leagueName,league);
  assert.equal(row.status,'REVIEWED');assert.match(row.source,/^https:\/\//);
 }
 for(const id of ['8305','8111','3555','15441','6000','23898']) assert.equal(currentClubs.players[id],undefined,'fail-closed hold '+id);
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 let known=0;
 for(const team of Object.values(vnl.rosters||{}))for(const p of team.players||[]){
  const m=String(p.volleybox||'').match(/-p(\d+)\/?$/i),r=m&&currentClubs.players[m[1]];
  if(r&&['CONFIRMED','REVIEWED'].includes(r.status)&&r.club&&(!r.dob||!p.dob||r.dob===p.dob))known++;
 }
 assert.ok(known>=213,'batch 5 must raise VNL current-club coverage to at least 213');
});

test('Reviewed VNL current-club batch 6 resolves China Argentina Belgium current-season identities',()=>{
 assert.ok(Object.keys(currentClubs.players).length>=277);
 const expected={
  '31':['Montpellier HSC VB','France',''],
  '93':['Pamesa Teruel','Spain','Superliga Masculina'],
  '4419':['Jiangsu','China','Chinese League'],
  '4551':['Sir Susa Scai Perugia','Italy','SuperLega'],
  '4774':['Guangdong Taishan Green Island','China','Chinese League'],
  '5137':['NEONET Norwid Częstochowa','Poland','TAURON Liga'],
  '6568':['Tourcoing Lille Métropole','France',''],
  '6847':['Alterna Stade Poitevin','France',''],
  '11018':['Berlin Recycling Volleys','Germany','1. Bundesliga'],
  '11636':['Lindemans Aalst','Belgium','Lotto Volley League'],
  '28382':['Sada Cruzeiro Vôlei','Brazil','Superliga Masculina'],
  '34279':['Golazo Haasrode Leuven','Belgium','Lotto Volley League'],
  '37205':['Tianjin Food Group','China','Chinese League'],
  '43519':['Qingdao Xinglun Youyou','China','Chinese League'],
  '43523':['Jiangsu','China','Chinese League'],
  '55196':['Lindemans Aalst','Belgium','Lotto Volley League'],
  '57234':['VK Lvi Praha','Czechia',''],
  '89363':['Vero Volley Monza','Italy','SuperLega'],
  '93752':['VfB Friedrichshafen','Germany','1. Bundesliga'],
  '116649':['Sab Diving Brabo Antwerp Volley','Belgium','Lotto Volley League'],
  '141393':['Decospan Volley Team Menen','Belgium','Lotto Volley League'],
  '146462':['Hebei Baoding Wolves','China','Chinese League'],
  '159389':['Qingdao Xinglun Youyou','China','Chinese League'],
  '195445':['Tianjin Food Group','China','Chinese League']
 };
 for(const [id,[club,country,league]] of Object.entries(expected)){
  const row=currentClubs.players[id];assert.ok(row,'missing current club '+id);
  assert.equal(row.club,club);assert.equal(row.leagueCountry,country);assert.equal(row.leagueName,league);
  assert.equal(row.status,'REVIEWED');assert.match(row.source,/^https:\/\//);
 }
 for(const id of ['35907','27738']) assert.equal(currentClubs.players[id],undefined,'fail-closed China hold '+id);
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 const pablo=vnl.rosters.ARG.players.find(p=>p.en==='Pablo Sergio Koukartsev');
 assert.ok(pablo);assert.equal(pablo.dob,'1993-03-25');
 assert.equal(pablo.volleybox,'https://volleybox.net/pablo-kukartsev-p5137');
 assert.equal(pablo.volleyboxLinkType,'profile');
 let known=0;
 for(const team of Object.values(vnl.rosters||{}))for(const p of team.players||[]){
  const m=String(p.volleybox||'').match(/-p(\d+)\/?$/i),r=m&&currentClubs.players[m[1]];
  if(r&&['CONFIRMED','REVIEWED'].includes(r.status)&&r.club&&(!r.dob||!p.dob||r.dob===p.dob))known++;
 }
 assert.ok(known>=237,'batch 6 must raise VNL current-club coverage to at least 237');
});

test('Reviewed VNL current-club batch 7 resolves seven-country current-season identities',()=>{
 assert.ok(Object.keys(currentClubs.players).length>=306);
 const expected={
  '790':['Aluron CMC Warta Zawiercie','Poland','TAURON Liga'],
  '2597':['Aluron CMC Warta Zawiercie','Poland','TAURON Liga'],
  '2691':['ZAKSA Kędzierzyn-Koźle','Poland','TAURON Liga'],
  '2818':['Tokyo Great Bears','Japan','SV.League Men'],
  '3633':['PGE Projekt Warszawa','Poland','TAURON Liga'],
  '4311':['ACH Volley Ljubljana','Slovenia',''],
  '5231':['SESI Bauru','Brazil','Superliga Masculina'],
  '5636':['On Hotels Alanya Belediyespor','Türkiye','SMS Grup Efeler Ligi'],
  '5860':['Sada Cruzeiro Vôlei','Brazil','Superliga Masculina'],
  '7361':['SESI Bauru','Brazil','Superliga Masculina'],
  '8347':['JTEKT STINGS Aichi','Japan','SV.League Men'],
  '10751':['Fenerbahçe Medicana','Türkiye','SMS Grup Efeler Ligi'],
  '17062':['Epicentr - Podolyany Horodok','Ukraine',''],
  '17268':['Stilon Gorzów','Poland','TAURON Liga'],
  '25303':['VK ČEZ Karlovarsko','Czechia','Czech Extraliga'],
  '26079':['Epicentr - Podolyany Horodok','Ukraine',''],
  '26358':['Hiroshima Thunders','Japan','SV.League Men'],
  '28935':['Shinshu Matsumoto Tridents','Japan','SV.League Men'],
  '29045':['Itas Trentino','Italy','SuperLega'],
  '33360':['Altekma SK','Türkiye','SMS Grup Efeler Ligi'],
  '45733':['Fenerbahçe Medicana','Türkiye','SMS Grup Efeler Ligi'],
  '49188':['VfB Friedrichshafen','Germany','1. Bundesliga'],
  '52285':['Halkbank Spor Kulübü','Türkiye','SMS Grup Efeler Ligi'],
  '82735':['Osaka Bluteon','Japan','SV.League Men'],
  '104246':['ACH Volley Ljubljana','Slovenia',''],
  '118641':['Halkbank Spor Kulübü','Türkiye','SMS Grup Efeler Ligi'],
  '147770':['Stal Nysa','Poland','TAURON Liga'],
  '237253':['OK i-Vent Maribor','Slovenia',''],
  '275333':['OK Fužinar Ravne','Slovenia','']
 };
 for(const [id,[club,country,league]] of Object.entries(expected)){
  const row=currentClubs.players[id];assert.ok(row,'missing current club '+id);
  assert.equal(row.club,club);assert.equal(row.leagueCountry,country);assert.equal(row.leagueName,league);
  assert.equal(row.status,'REVIEWED');assert.match(row.source,/^https:\/\//);
 }
 assert.equal(currentClubs.players['3191'],undefined,'Murat Yenipazar DOB conflict must remain fail-closed');
 assert.equal(currentClubs.players['23861'],undefined,'Berkay Bayraktar direct candidate DOB conflict must remain fail-closed');
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 let known=0;
 for(const team of Object.values(vnl.rosters||{}))for(const p of team.players||[]){
  const m=String(p.volleybox||'').match(/-p(\d+)\/?$/i),r=m&&currentClubs.players[m[1]];
  if(r&&['CONFIRMED','REVIEWED'].includes(r.status)&&r.club&&(!r.dob||!p.dob||r.dob===p.dob))known++;
 }
 assert.ok(known>=266,'batch 7 must raise VNL current-club coverage to at least 266');
});

test('Reviewed VNL current-club batch 8 resolves final evidence-backed identities',()=>{
 assert.ok(Object.keys(currentClubs.players).length>=309);
 const expected={
  '28895':['A.O. Foinikas Sýros','Greece','Volley League'],
  '72294':['JV Gioia Del Colle','Italy','Serie A2'],
  '180756':['Mount Royal University Cougars','Canada','Canada West']
 };
 for(const [id,[club,country,league]] of Object.entries(expected)){
  const row=currentClubs.players[id];assert.ok(row,'missing current club '+id);
  assert.equal(row.club,club);assert.equal(row.leagueCountry,country);assert.equal(row.leagueName,league);
  assert.equal(row.status,'REVIEWED');assert.match(row.source,/^https:\/\//);
 }
 assert.equal(currentClubs.players['79752'],undefined,'Denislav Bardarov direct candidate has no public Volleybox DOB and stays fail-closed');
 assert.equal(currentClubs.players['60269'],undefined,'Dimitar Dimitrov direct candidate DOB conflict must remain fail-closed');
 assert.equal(currentClubs.players['15441'],undefined,'Nemanja Mašulović 2026/27 current club is not confirmed');
 assert.equal(currentClubs.players['3191'],undefined,'Murat Yenipazar DOB conflict must remain fail-closed');
 assert.equal(currentClubs.players['23861'],undefined,'Berkay Bayraktar direct candidate DOB conflict must remain fail-closed');
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 let known=0;
 for(const team of Object.values(vnl.rosters||{}))for(const p of team.players||[]){
  const m=String(p.volleybox||'').match(/-p(\d+)\/?$/i),r=m&&currentClubs.players[m[1]];
  if(r&&['CONFIRMED','REVIEWED'].includes(r.status)&&r.club&&(!r.dob||!p.dob||r.dob===p.dob))known++;
 }
 assert.ok(known>=269,'batch 8 must raise VNL current-club coverage to at least 269');
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
 assert.equal(unified.countryLabel('Romania'),'🇷🇴 ROMANIA');
 assert.equal(unified.countryLabel('Brazil'),'🇧🇷 BRAZIL');
 assert.equal(unified.countryLabel('Canada'),'🇨🇦 CANADA');
 assert.equal(unified.countryLabel('Russia'),'🇷🇺 RUSSIA');
 assert.equal(unified.countryLabel('Serbia'),'🇷🇸 SERBIA');
 assert.equal(unified.countryLabel('USA'),'🇺🇸 USA');
 assert.equal(unified.countryLabel('Belgium'),'🇧🇪 BELGIUM');
 assert.equal(unified.countryLabel('Slovenia'),'🇸🇮 SLOVENIA');
 assert.equal(unified.countryLabel('Spain'),'🇪🇸 SPAIN');
 assert.equal(unified.countryLabel('Kazakhstan'),'🇰🇿 KAZAKHSTAN');
 assert.equal(unified.countryLabel('Vietnam'),'🇻🇳 VIETNAM');
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
test('2026 VNL direct Volleybox audit keeps only five unresolved search links',()=>{
 const vnl=read('data/competitions/vnl-men-2026/data.json');
 const players=Object.values(vnl.rosters||{}).flatMap(team=>team.players||[]);
 const direct=players.filter(p=>/^https:\/\/volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p\d+\/?$/i.test(String(p.volleybox||'')));
 const search=players.filter(p=>/^https:\/\/volleybox\.net\/(?:ko\/)?search\?q=/i.test(String(p.volleybox||'')));
 const invalid=players.filter(p=>!direct.includes(p)&&!search.includes(p));
 assert.equal(players.length,284);
 assert.equal(direct.length,279);
 assert.equal(search.length,5);
 assert.equal(invalid.length,0);
 assert.deepEqual(search.map(p=>p.en).sort(),[
  'Berkay Bayraktar','Denislav Bardarov','Dimitar Dimitrov',
  'Lorenzo Cortesia','Nivaldo Nadhir Dias Gomez'
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

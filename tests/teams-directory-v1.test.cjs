'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const dir=require('../assets/js/kvl-teams-directory-v1.js');
const bridge=require('../assets/js/kvl-vleague-draft-bridge-v1.js');
const season=json('data/team-rosters/v-league/index.json').currentSeason;
const staff=json('data/team-rosters/v-league/coaches-2026-27.json');
const male=json('data/competitions/v-league-men-2026-27/data.json');
const female=json('data/competitions/v-league-women-2026-27/data.json');
const menRosters=json('data/competitions/v-league-men-2026-27/rosters.json');
const womenRosters=json('data/competitions/v-league-women-2026-27/rosters.json');

test('Team Finder HERO reuses Home PC and mobile images, without modifying shared Home assets',()=>{
 const home=read('index.html');
 const css=read('assets/css/kvl-teams-directory-v1.css');
 const html=read('teams.html');
 for(const file of ['kvl-home-hero-pc-v01.webp','kvl-home-hero-mobile-v01.webp']){
  const asset='assets/img/home-hero/'+file;
  assert.ok(home.includes(asset),'Home HERO must reference '+file);
  assert.ok(css.includes(asset),'Team Finder HERO must reference exact same '+file);
  assert.ok(fs.statSync(path.join(root,asset)).size>10000,'Source Home HERO must exist locally');
 }
 assert.match(css,/\.ktd-page \.ktd-hero\{/,'Only the Team Finder top HERO is adjusted');
 assert.match(css,/background:#07182d url\(/,'Reuse Home navy background with the existing image');
 assert.match(css,/background-image:url\('/,'Use Home mobile asset at the responsive breakpoint');
 assert.match(html,/kvl-teams-directory-v1\.css\?v=20261120-grid-v1/,'Latest Team Finder CSS must invalidate old cache');
 assert.match(html,/id="ktdGrid"/,'Existing team cards must remain');
 assert.match(html,/id="ktdGenderButtons"/,'Existing gender filter must remain');
});

test('Responsive team finder cards use 3 columns on wide PC and 2 vertical columns on mobile without removing team metadata',()=>{
 const css=read('assets/css/kvl-teams-directory-v1.css');
 const html=read('teams.html');
 assert.match(css,/Team directory density v1/);
 assert.ok(css.includes('@media(min-width:1280px)'), '3-up threshold must be wide desktop only');
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('@media(max-width:660px)'), 'mobile layout must have a dedicated override');
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('display:flex;flex-direction:column;align-items:stretch'), 'mobile teams must stack logos and text vertically');
 assert.ok(css.includes('.ktd-card-logo')&&css.includes('.ktd-card-action'), 'keep flags/logos and actions in responsive cards');
 assert.match(html,/kvl-teams-directory-v1\.css\?v=20261120-grid-v1/);
 for(const scope of ['data-ktd-category="pro"','data-ktd-category="university"','data-ktd-category="international"','id="ktdGrid"']){
  assert.ok(html.includes(scope),scope+' should remain functional');
 }
 const pro=dir.buildPro(male.participants,menRosters,staff,'men',season);
 assert.equal(pro.length,7);
 const card=dir.cardMarkup(pro.find(x=>x.code==='OKF'));
 assert.match(card,/감독대행\s*:/,'acting coach must be distinguished from permanent head coach');
 assert.match(card,/선수명단 보기/,'original roster action must remain');
 assert.match(card,/ktd-card-logo/,'club logo remains in card');
});

test('current season index continues to be the only routing source',()=>{
 assert.equal(season,'2026-27');
 assert.ok(json('data/team-rosters/v-league/index.json').seasons.some(s=>s.season===season&&s.status==='active'));
 for(const gender of ['men','women']){
  const route=dir.teamRoute(gender,season,gender==='men'?'OKF':'RSP');
  assert.match(route,/^competition-engine\.html\?competition=v-league-(men|women)-2026-27&view=rosters&team=/);
 }
});
test('14 professional club cards read their counts from publisher-owned rosters, not outdated competition metadata',()=>{
 const before=JSON.stringify({male,menRosters,female,womenRosters});
 const men=dir.buildPro(male.participants,menRosters,staff,'men',season);
 const women=dir.buildPro(female.participants,womenRosters,staff,'women',season);
 assert.equal(men.length,7);assert.equal(women.length,7);
 assert.equal(dir.totalPlayers(men),Object.values(menRosters).reduce((s,t)=>s+t.players.length,0));
 assert.equal(dir.totalPlayers(women),Object.values(womenRosters).reduce((s,t)=>s+t.players.length,0));
 assert.ok(dir.totalPlayers(men)>100&&dir.totalPlayers(women)>100);
 for(const [teams,snap] of [[men,menRosters],[women,womenRosters]]){
  for(const t of teams){
   assert.equal(t.count,snap[t.code].players.length);
   assert.equal(t.asOf,snap[t.code].asOf);
   assert.ok(t.coach&&t.coachSource.startsWith('https://'));
   assert.ok(t.href.includes('team='+t.code));
   assert.match(dir.cardMarkup(t),new RegExp('data-ktd-roster="'+t.code+'"'));
  }
 }
 assert.equal(JSON.stringify({male,menRosters,female,womenRosters}),before,'directory must not mutate official rosters');
});
test('all fourteen 2026-27 coaches are sourced and current road coach was promoted',()=>{
 assert.equal(Object.keys(staff.men).length,7);
 assert.equal(Object.keys(staff.women).length,7);
 assert.equal(staff.women.KEX.name,'김영래');
 assert.equal(staff.women.KEX.asOf,'2026-10-29');
 assert.ok(staff.women.KEX.source.includes('yna.co.kr'));
 assert.equal(staff.men.KAL.name,'헤난 달 조토');
 assert.equal(staff.men.OKF.name,'김재헌');
 assert.equal(staff.men.OKF.role,'acting');
 assert.equal(staff.men.OKF.asOf,'2026-11-17');
 assert.ok(staff.men.OKF.source.includes('okfinancialsports.com/volleyball/story/news_content.asp?num=4807'));
 assert.deepEqual(
  {name:staff.men.OKF.transition.previousCoach,date:staff.men.OKF.transition.date,kind:staff.men.OKF.transition.kind},
  {name:'신영철',date:'2026-11-17',kind:'resignation'}
 );
 const actual=dir.buildPro(male.participants,menRosters,staff,'men',season);
 const acting=actual.find(x=>x.code==='OKF');
 assert.equal(acting.coach,'김재헌');
 assert.equal(acting.coachRole,'감독대행');
 assert.equal(acting.coachAsOf,'2026-11-17');
 assert.equal(acting.coachSource,staff.men.OKF.source);
 assert.match(dir.cardMarkup(acting),/감독대행\s*:\s*<b>김재헌<\/b>/);
 assert.doesNotMatch(dir.cardMarkup(acting),/신영철/,'resigned coach must not appear as the current coach');
 assert.ok(actual.filter(x=>x.code!=='OKF').every(x=>x.coachRole==='감독'),'all remaining club head coach labels unchanged');
 const altered={...staff,season:'2027-28'};
 const men=dir.buildPro(male.participants,menRosters,altered,'men','2026-27');
 assert.ok(men.every(x=>x.coach===''),'new seasons never inherit old coaches silently');
});
test('malformed and unreviewed roster objects fail closed instead of showing invented player totals',()=>{
 const incomplete=structuredClone(menRosters);delete incomplete.OKF;
 assert.throws(()=>dir.buildPro(male.participants,incomplete,staff,'men',season),/roster missing/);
 const duplicate=structuredClone(male.participants);duplicate[1].code=duplicate[0].code;
 assert.throws(()=>dir.buildPro(duplicate,menRosters,staff,'men',season),/Duplicate/);
});
test('all professional cards reuse validated roster v2 with safe draft, school and collision contexts',()=>{
 const b=bridge.withEducation(json('data/kovo/official-notices/2026-27/draft_registration_bridge.json'),
  json('data/draft-applicants/2026-27/education-v1.json'));
 assert.equal(b.registration_count,32);assert.equal(b.profile_count,28);
 for(const [gender,part,rosters,id] of [['M',male,menRosters,'KVL-COMP-VLEAGUE-M-2026-27'],['W',female,womenRosters,'KVL-COMP-VLEAGUE-W-2026-27']]){
  const d={competitionId:id,participants:part.participants,rosters};
  const modified=bridge.reconcileCurrent(d,b);
  assert.equal(Object.values(modified.rosters).reduce((a,r)=>a+r.players.length,0),
   Object.values(rosters).reduce((a,r)=>a+r.players.length,0));
  for(const r of b.registered.filter(x=>x.gender===gender)){
   const p=modified.rosters[r.team_code].players.find(x=>x.name===r.name&&x.number===r.number);
   assert.ok(p,r.name);
   assert.equal(p.registrationSource,r.registration_source_url);
   assert.equal(p.playerId,r.player_id||null);
  }
 }
});
test('university team cards reuse actual 2026 league roster snapshots, not V-League counts',()=>{
 const s=json('data/master/university_staff_2026.json');
 for(const [gender,size] of [['men',15],['women',6]]){
  const base='data/competitions/university-league-'+gender+'-2026/';
  const competition=json(base+'data.json'),rosters=json(base+'rosters.json');
  const entries=dir.buildUniversity(competition.participants,rosters,s,gender);
  assert.equal(entries.length,size);
  for(const x of entries){
   assert.equal(x.count,rosters[x.code].players.length);
   assert.match(x.href,/^(university-team|competition-engine)\.html\?/);
  }
 }
});
test('school team cards merge source-verified tournament participants without duplicates',()=>{
 for(const division of ['high','middle']){
  for(const gender of ['men','women']){
   const snaps=dir.SOURCES.school.map(prefix=>{
    const slug=prefix+'-'+division+'-'+gender;
    return {slug,label:prefix,...json('data/competitions/'+slug+'/data.json')};
   });
   const entries=dir.buildSchool(snaps,division,gender);
   assert.ok(entries.length>=12,division+' '+gender);
   assert.equal(new Set(entries.map(x=>x.name.replace(/\s+/g,''))).size,entries.length);
   assert.ok(entries.every(t=>t.href.includes('competition-engine.html?competition=')));
  }
 }
});
test('navigation renders non-pro sections as grounded links and escapes untrusted names/logos',()=>{
 assert.equal(dir.curated('national').length,3);
 assert.ok(dir.curated('national').some(x=>x.href==='national-team.html?gender=women'));
 assert.equal(dir.curated('international').length,3);
 for(const entry of [...dir.curated('national'),...dir.curated('international')])assert.ok(dir.safeHref(entry.href));
 assert.equal(dir.safeLogo('javascript:alert(1)'),false);
 assert.equal(dir.safeLogo('/assets/img/team-logos/v-league/2026-27/men/OKF.svg'),true);
 const malicious={name:'<script>alert(1)</script>',code:'OKF',gender:'men',logo:'javascript:alert(1)',count:17,type:'pro',action:'roster',coach:'<img onerror=alert(1)>'};
 const markup=dir.cardMarkup(malicious);
 assert.ok(!markup.includes('<script>'));
 assert.ok(!markup.includes('<img onerror'));
 assert.ok(!markup.includes('src="javascript:'));
});
test('team page replaces placeholder and only references existing shared roster modules',()=>{
 const html=read('teams.html'),css=read('assets/css/kvl-teams-directory-v1.css');
 assert.ok(html.includes('kvl-teams-directory-v1.js'));
 assert.ok(html.includes('kvl-vleague-roster-v2.js'));
 assert.ok(html.includes('kvl-vleague-draft-bridge-v1.js'));
 assert.ok(html.includes('player-id-collision-quarantine-v1.js'));
 for(const c of ['pro','university','high','middle','national','international'])
  assert.ok(html.includes('data-ktd-category="'+c+'"'));
 assert.ok(html.includes('id="ktdRosterHost"'));
 assert.ok(!html.includes('분류해 제공할 예정입니다'));
 assert.match(css,/grid-template-columns:31%/);
 assert.match(css,/\.ktd-gender\[hidden\]/);
});

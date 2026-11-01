'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const contract=require('../assets/js/kvl-competition-config-v2.js'),display=require('../assets/js/kvl-calendar-display-v1.js');
function source(gender){const base=`data/competitions/v-league-${gender}-2026-27/`;return {c:json(base+'config.json'),d:json(base+'data.json')};}
test('requested aliases, actual round/venue/time and all 252 season fixtures',()=>{
 const expected={men:['항공','삼성','KB','현대','우카','한전','OK'],women:['GS','흥국','SOOP','도공','현대','IBK','정관장']};
 for(const gender of ['men','women']){
  const {c,d}=source(gender),before=JSON.stringify(d),options=c.structure.calendarDisplay;
  assert.deepEqual(Object.values(options.teamAliases),expected[gender]);assert.equal(d.matches.length,126);
  for(const match of d.matches){const result=display.game(match,d,options);assert.match(result.line1,/^[1-6]R \S+ (?:vs|\d+-\d+) \S+$/);assert.match(result.line2,/^\((인천|천안|서울|평택|수원|부산|대전|김천|화성|광주), \d+시\)$/);assert(!result.line1.includes('1경기'));}
  const match=d.matches.find(m=>m.date==='2026-11-01');const result=display.game(match,d,options);
  assert.equal(result.line1,gender==='men'?'1R KB 1-3 삼성':'1R 흥국 3-0 SOOP');assert.equal(result.line2,gender==='men'?'(평택, 14시)':'(인천, 16시)');
  assert.match(result.fullLabel,gender==='men'?/KB손해보험 1-3 삼성화재/:/흥국생명 3-0 SOOP/);assert.equal(JSON.stringify(d),before);
 }
});
test('missing/relocated venue, time minutes, unknown teams and postseason are not invented',()=>{
 const {c,d}=source('men'),options=c.structure.calendarDisplay,m={...d.matches[1],status:'scheduled',score:null,time:'19:30',venueLabel:'새 경기장',home:{code:'NEW',name:'새로운팀'}};
 assert.equal(display.game(m,d,options).line1,'1R 새로운팀 vs 삼성');assert.equal(display.game(m,d,options).line2,'(새 경기장, 19시30분)');
 assert.equal(display.timeLabel(''),'시간 미정');assert.equal(display.timeLabel('25:10'),'시간 미정');
 assert.equal(display.game({...m,venueLabel:''},d,options).line2,'(장소 미정, 19시30분)');
 assert.equal(display.roundLabel({stage:'준플레이오프'}),'준PO');assert.equal(display.roundLabel({stage:'챔피언결정전'}),'챔프전');
});
test('calendar uses scores only for completed matches with a valid registered result',()=>{
 const {c,d}=source('men'),options=c.structure.calendarDisplay,match=d.matches.find(m=>m.status==='final');
 assert(match);const before=JSON.stringify(match),expected=match.score.home+'-'+match.score.away;
 assert.equal(display.game(match,d,options).resultLabel,expected);
 for(const status of ['scheduled','live','postponed','cancelled'])assert.equal(display.game({...match,status},d,options).resultLabel,'vs');
 for(const score of [null,{}, {home:0,away:0},{home:-1,away:3},{home:3,away:1.5},{home:'3',away:0}])assert.equal(display.game({...match,score},d,options).resultLabel,'vs');
 assert.equal(JSON.stringify(match),before);
});
test('official season public/substitute holidays and Sundays only; no extrapolated holiday dates',()=>{
 for(const date of ['2026-10-03','2026-10-05','2026-10-09','2026-12-25','2027-01-01','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-03-01','2027-05-01','2027-05-03','2027-05-05'])assert.equal(display.dateInfo(date,'KR').red,true,date);
 for(const date of ['2026-10-31','2026-11-02','2027-02-10','2027-04-05'])assert.equal(display.dateInfo(date,'KR').red,false,date);
 assert.equal(display.dateInfo('2026-11-01','KR').red,true);assert.equal(display.dateInfo('2027-02-30','KR').red,false);
 assert.equal(display.dateInfo('2028-02-09','KR').verified,false);assert.equal(display.dateInfo('2027-02-09','US').red,false);
});
async function setup(slug='v-league-men-2026-27',query='',now='2026-11-01T00:00:00Z'){
 const c=json(`data/competitions/${slug}/config.json`),raw=contract.assemble(c,json(`data/competitions/${slug}/data.json`),{slug,canonical:'https://kvolleylab.com/competition-engine.html?competition='+slug});
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:'https://kvolleylab.com/competition-engine.html?competition='+slug+query,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.Date.now=()=>Date.parse(now);w.KVL_COMPETITION_PAGE_V2={deferRender:true,collectionRoot:'/data/competitions/'};w.matchMedia=()=>({matches:false});w.CSS={escape:s=>s};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.fetch=async url=>({ok:true,json:async()=>json(new URL(url).pathname.slice(1))});
 for(const name of ['config','data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 const d=w.KVLCompetitionDataV2.normalize(raw);w.KVL_COMPETITION_V2_DATA=d;
 w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();
 w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-calendar-display-v1.js'));w.eval(read('assets/js/kvl-match-calendar-v1.js'));w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(d);await w.KVLDomesticHomeV2.matchesReady;
 return {w,d,doc:w.document};
}
for(const gender of ['men','women'])test(gender+': two-line overview and selected-team calendars preserve dialogs and records',async()=>{
 const {w,d,doc}=await setup(`v-league-${gender}-2026-27`);try{
  const before=JSON.stringify(d),cal=doc.querySelector('[data-dv2-calendar]');assert(cal.classList.contains('dv2-vleague-calendar'));
  const day=cal.querySelector('[data-dv2-date="2026-11-01"]');assert.equal(day.querySelector('.dv2-calendar-matchup').textContent,gender==='men'?'1R KB 1-3 삼성':'1R 흥국 3-0 SOOP');
  assert.equal(day.querySelector('.dv2-calendar-game').children.length,2);assert(day.querySelector('.dv2-calendar-date').classList.contains('is-holiday'));assert(day.classList.contains('is-holiday-day'));assert(cal.querySelector('.dv2-calendar-fit'));assert.equal(cal.querySelector('.dv2-calendar-scroll'),null);assert(!cal.textContent.includes('좌우로'));assert(!cal.querySelector('[data-dv2-date="2026-11-03"]').classList.contains('is-holiday-day'));assert.equal(day.querySelector('.dv2-team-game,small'),null);
  day.click();assert(doc.querySelector('#dv2-day-dialog').open);assert.match(doc.querySelector('.dv2-match-teams').textContent,gender==='men'?/KB손해보험.*삼성화재/s:/흥국생명.*SOOP/s);assert(doc.querySelector('.dv2-setline').textContent.length>0);doc.querySelector('#dv2-day-dialog').close();
  assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
 const teamCode=gender==='men'?'KBI':'SOO';const selected=await setup(`v-league-${gender}-2026-27`,'&view=team&team='+teamCode);try{
  const cal=selected.doc.querySelector('[data-dv2-team-calendar]');assert(cal);assert(cal.querySelector('.dv2-vleague-calendar'));
  for(const day of cal.querySelectorAll('[data-dv2-date]')){const matches=selected.d.matches.filter(m=>m.date===day.dataset.dv2Date&&[m.home.code,m.away.code].includes(teamCode));assert.equal(day.querySelectorAll('.dv2-calendar-game').length,matches.length);assert.equal(day.querySelector('.dv2-team-game'),null);}
 }finally{selected.w.close();}
});
test('holiday date color survives month navigation; only actual match days receive shading',async()=>{
 const empty=await setup('v-league-men-2026-27','','2026-10-01T00:00:00Z');try{
  const date=empty.doc.querySelector('.dv2-calendar-date[title="한글날"]');assert(date.classList.contains('is-holiday'));assert(!date.parentElement.classList.contains('is-holiday-day'));assert(!date.parentElement.classList.contains('has-match'));assert.equal(date.parentElement.children.length,1);
 }finally{empty.w.close();}
 const {w,doc}=await setup();try{
  const cal=doc.querySelector('[data-dv2-calendar]');cal.querySelector('[data-dv2-month="1"]').click();assert.equal(cal.querySelector('.dv2-calendar-date[title="기독탄신일"]').textContent,'25');assert(cal.querySelector('.dv2-calendar-date[title="기독탄신일"]').parentElement.classList.contains('is-holiday-day'));
  cal.querySelector('[data-dv2-month="1"]').click();cal.querySelector('[data-dv2-month="1"]').click();
  assert.equal(cal.querySelector('.dv2-calendar-date[title="설날 대체공휴일"]').textContent,'9');
  assert.deepEqual([...cal.querySelectorAll('.dv2-day:not(.outside) .dv2-calendar-date.is-holiday')].map(el=>el.textContent),['6','7','8','9','14','21','28']);
 }finally{w.close();}
});
test('university calendar shares single-match details and multiple-match counts',async()=>{
 const {w,doc}=await setup('university-league-women-2026');try{
  const cal=doc.querySelector('[data-dv2-calendar]');assert(!cal.classList.contains('dv2-vleague-calendar'));assert(cal.classList.contains('kvl-match-calendar'));for(const day of cal.querySelectorAll('[data-dv2-date]')){const count=w.KVL_COMPETITION_V2_DATA.matches.filter(m=>m.date===day.dataset.dv2Date).length;assert.equal(day.querySelectorAll('.dv2-calendar-game').length,count===1?1:0);if(count>1)assert.equal(day.querySelector('.kvl-calendar-count').textContent,count+'경기');}
 }finally{w.close();}
});

for(const gender of ['men','women'])test(gender+': All-Star annotation follows the season config without becoming a league fixture',async()=>{
 for(const query of ['', '&view=team&team='+(gender==='men'?'KBI':'SOO')]){
  const {w,d,doc}=await setup(`v-league-${gender}-2026-27`,query,'2027-01-01T00:00:00Z');try{
   const before=JSON.stringify(d),cal=doc.querySelector(query?'[data-dv2-team-month]':'[data-dv2-calendar]');
   const label=cal.querySelector('.dv2-calendar-event');assert.equal(label.textContent,'올스타전');assert.equal(label.parentElement.querySelector('.dv2-calendar-date').textContent,'17');
   assert(label.parentElement.getAttribute('aria-label').includes('2027-01-17'));assert(!label.parentElement.hasAttribute('data-dv2-date'));assert(!label.parentElement.classList.contains('has-match'));assert(!label.parentElement.classList.contains('is-holiday-day'));
   assert.equal(d.matches.length,126);assert(!d.matches.some(m=>m.date==='2027-01-17'));assert.equal(JSON.stringify(d),before);
   cal.querySelector('[data-dv2-month="1"]').click();assert.equal(cal.querySelector('.dv2-calendar-event'),null);
   cal.querySelector('[data-dv2-month="-1"]').click();assert.equal(cal.querySelectorAll('.dv2-calendar-event').length,1);
  }finally{w.close();}
 }
});

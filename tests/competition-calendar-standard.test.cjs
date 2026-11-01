'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const contract=require('../assets/js/kvl-competition-config-v2.js'),display=require('../assets/js/kvl-calendar-display-v1.js');
function setup(){
 const dom=new JSDOM('<body><div id="calendar"></div></body>',{url:'https://kvolleylab.com/competition-engine.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.Date.now=()=>Date.parse('2026-11-02T00:00:00Z');w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const file of ['kvl-competition-data-v2.js','kvl-calendar-display-v1.js','kvl-match-calendar-v1.js','kvl-calendar-avc-adapter-v1.js'])w.eval(read('assets/js/'+file));
 return {w,doc:w.document,cal:w.document.querySelector('#calendar')};
}
test('all production config calendars count the visible day, retain every game in dialogs and never mutate source data',()=>{
 let competitions=0,singles=0,multiples=0;
 for(const slug of fs.readdirSync(path.join(root,'data/competitions')).filter(s=>fs.existsSync(path.join(root,'data/competitions',s,'config.json')))){
  const c=JSON.parse(read(`data/competitions/${slug}/config.json`)),source=JSON.parse(read(`data/competitions/${slug}/data.json`));
  const {w,doc,cal}=setup();try{
   const d=w.KVLCompetitionDataV2.normalize(contract.assemble(c,source,{slug,canonical:'https://kvolleylab.com/competition-engine.html?competition='+slug})),before=JSON.stringify(d);
   w.KVLMatchCalendarV1.mount(cal,d,{scheduleUrl:date=>'?view=schedule&date='+date});competitions++;
   for(let i=0;i<24;i++){
    for(const day of cal.querySelectorAll('[data-dv2-date]')){
     const games=d.matches.filter(m=>m.date===day.dataset.dv2Date&&!m.notRequired&&m.status!=='not_required');
     if(games.length===1){singles++;assert.equal(day.querySelectorAll('.dv2-calendar-game').length,1,slug);assert.equal(day.querySelector('.kvl-calendar-count'),null);const text=day.querySelector('.dv2-calendar-matchup').textContent;assert(text.includes(display.game(games[0],d,c.structure.calendarDisplay).resultLabel));if(games[0].stage==='결승')assert(!text.includes('챔프전'));}
     else{multiples++;assert.equal(day.querySelectorAll('.dv2-calendar-game').length,0);assert.equal(day.querySelector('.kvl-calendar-count').textContent,games.length+'경기');}
     day.click();assert.equal(doc.querySelectorAll('.dv2-day-match').length,games.length,slug);assert.deepEqual([...doc.querySelectorAll('[data-calendar-match]')].map(el=>el.dataset.calendarMatch).sort(),Array.from(games,m=>m.id).sort());doc.querySelector('#dv2-day-dialog').close();
    }
    const previous=cal.querySelector('[data-dv2-month="-1"]');if(!previous||previous.disabled)break;previous.click();
   }
   assert.equal(JSON.stringify(d),before,slug);
  }finally{w.close();}
 }
 assert.equal(competitions,47);assert(singles>100);assert(multiples>100);
});
test('shared calendar handles scheduled, final, multi-game, non-required, special event and holiday-only days separately',()=>{
 const {w,doc,cal}=setup();try{
  const base={home:{code:'A'},away:{code:'B'},stage:'결승',time:'14:00',venueLabel:'확인된 체육관'},d={status:'completed',participants:[{code:'A',name:'긴 이름 <학교>'},{code:'B',name:'상대팀'}],structure:{calendarDisplay:{events:[{date:'2026-07-17',label:'공식 행사'}]}},matches:[
   {...base,id:'one',date:'2026-07-03',status:'final',score:{home:3,away:1}},
   {...base,id:'two',date:'2026-07-05',status:'live',score:{home:2,away:1}},
   {...base,id:'three',date:'2026-07-05',status:'scheduled',score:null},
   {...base,id:'unused',date:'2026-07-05',status:'not_required',score:null}
  ]};w.KVLMatchCalendarV1.mount(cal,d);
  assert.match(cal.querySelector('[data-dv2-date="2026-07-03"]').textContent,/결승 긴 이름 <학교> 3-1 상대팀/);assert.equal(doc.querySelector('학교'),null);
  const multi=cal.querySelector('[data-dv2-date="2026-07-05"]');assert.equal(multi.querySelector('.kvl-calendar-count').textContent,'2경기');assert(multi.classList.contains('is-holiday-day'));multi.click();assert.deepEqual([...doc.querySelectorAll('.dv2-match-teams>strong')].map(e=>e.textContent),['VS','VS']);
  const empty=cal.querySelector('.dv2-calendar-date[title="제헌절"]').parentElement;assert(!empty.classList.contains('has-match'));assert(!empty.classList.contains('is-holiday-day'));assert.equal(empty.querySelector('.dv2-calendar-event').textContent,'공식 행사');
 }finally{w.close();}
});
for(const gender of ['men','women'])test('existing AVC '+gender+' snapshot uses the same widget without changing the snapshot or general final stage',()=>{
 const {w,doc,cal}=setup();try{
  const d=JSON.parse(read(`data/competitions/avc-${gender}-continental-2026.json`)),before=JSON.stringify(d),teams=Object.fromEntries([...new Set(d.matches.flatMap(m=>[m.teamA,m.teamB]))].map(name=>[name,{code:name}]));
  assert(w.KVLCalendarAVCAdapterV1.mount(cal,d,teams));assert(cal.querySelector('.kvl-calendar-count'));
  const date=d.matches.at(-1).date,day=cal.querySelector('[data-dv2-date="'+date+'"]');day.click();assert.equal(doc.querySelectorAll('.dv2-day-match').length,d.matches.filter(m=>m.date===date).length);assert.match(doc.querySelector('.dv2-day-matches').textContent,/결승/);assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});
test('KR holiday coverage includes earlier 2026 competitions and does not extrapolate future holidays',()=>{
 for(const key of ['2026-03-02','2026-05-01','2026-05-25','2026-06-03','2026-07-17','2026-08-17','2026-09-25','2027-07-19','2027-12-27'])assert(display.dateInfo(key,'KR').red,key);
 assert.equal(display.dateInfo('2028-07-17','KR').verified,false);assert.equal(display.dateInfo('2026-07-18','KR').red,false);
});

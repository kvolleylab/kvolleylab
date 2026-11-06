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
     if(games.length===1){singles++;assert.equal(day.querySelectorAll('.dv2-calendar-game').length,1,slug);assert.equal(day.querySelector('.kvl-calendar-count'),null);const text=day.querySelector('.dv2-calendar-matchup').textContent;let expected=display.game(games[0],d,c.structure.calendarDisplay).resultLabel;if(c.structure.presentationCategory==='pro-league'){const state=w.KVLCompetitionDataV2.matchSummaryState(games[0]);if(!state.finished&&state.kind!=='scheduled'){expected=state.score?state.score.home+'-'+state.score.away:'—';assert(day.getAttribute('aria-label').includes(state.label));}}assert(text.includes(expected));if(games[0].stage==='결승')assert(!text.includes('챔프전'));}
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

test('single-match calendar labels keep two matchup rows plus the venue/time row for mobile',()=>{
 const {w,doc,cal}=setup();try{
  const fixture={stage:'1라운드',home:{code:'S'},away:{code:'W'},time:'19:00',venueLabel:'대전 충무체육관'},d={
   status:'completed',participants:[{code:'S',name:'삼성화재',fullName:'삼성화재 블루팡스'},{code:'W',name:'우리카드'}],
   structure:{calendarDisplay:{mode:'vleague-compact',teamAliases:{S:'삼성',W:'우카'},venueCities:{'대전 충무체육관':'대전'}}},
   matches:[{...fixture,id:'scheduled',date:'2026-07-01',status:'scheduled'},{...fixture,id:'finished',date:'2026-07-02',status:'final',score:{home:3,away:1,sets:[{home:25,away:20},{home:25,away:22},{home:20,away:25},{home:25,away:23}]}},{...fixture,id:'live',date:'2026-07-03',status:'live',score:{home:2,away:1}}]
  },before=JSON.stringify(d);
  w.KVLMatchCalendarV1.mount(cal,d);
  for(const [date,result] of [['2026-07-01','vs'],['2026-07-02','3-1'],['2026-07-03','vs']]){
   const day=cal.querySelector('[data-dv2-date="'+date+'"]'),game=day.querySelector('.dv2-calendar-game');
   assert.equal(game.children.length,2,'desktop matchup/location information groups stay intact');
   assert.deepEqual([...game.querySelectorAll('.dv2-calendar-side')].map(el=>el.textContent),['1R 삼성',result+' 우카']);
   assert.equal(game.querySelector('.dv2-calendar-matchup').textContent,'1R 삼성 '+result+' 우카');
   assert.equal(game.querySelector('.dv2-calendar-location').textContent,'(대전, 19시)');
   assert.equal(game.querySelector('.dv2-calendar-venue').textContent,'대전');
   assert.equal(game.querySelector('.dv2-calendar-time').textContent,', 19시)');
   assert.equal(day.querySelector('.kvl-calendar-count'),null);
   assert.match(day.getAttribute('aria-label'),/삼성화재 블루팡스/);assert.match(game.title,/대전 충무체육관/);assert.match(game.title,/19시 KST/);
  }
  cal.querySelector('[data-dv2-date="2026-07-02"]').click();
  assert.equal(doc.querySelector('.dv2-match-teams>strong').textContent,'3 : 1');
  assert.equal(doc.querySelector('.dv2-match-meta>span').textContent,'19:00 KST');
  assert.equal(doc.querySelectorAll('.dv2-setline>span').length,4);
  assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});
test('mobile venue/time spans preserve long international labels, minutes and unconfirmed fields',()=>{
 const {w,doc,cal}=setup();try{
  const venue='Ningbo Beilun Sports and Arts Center, Main Court <확인>',fixture={stage:'예선',home:{code:'DOM'},away:{code:'NED'},status:'scheduled'},d={
   status:'completed',participants:[{code:'DOM',name:'도미니카공화국',city:'등록 도시',venue:'등록 체육관'},{code:'NED',name:'네덜란드'}],structure:{},matches:[
    {...fixture,id:'minutes',date:'2026-07-01',time:'19:30',venueLabel:venue},
    {...fixture,id:'missing',date:'2026-07-02',time:'',venueLabel:''},
    {...fixture,id:'invalid',date:'2026-07-03',time:'25:10',venueLabel:'확인된 장소'}
   ]
  },before=JSON.stringify(d);
  w.KVLMatchCalendarV1.mount(cal,d);
  const minutes=cal.querySelector('[data-dv2-date="2026-07-01"]'),game=minutes.querySelector('.dv2-calendar-game');
  assert.deepEqual([...game.querySelectorAll('.dv2-calendar-side')].map(el=>el.textContent),['예선 도미니카공화국','vs 네덜란드']);
  assert.equal(game.querySelector('.dv2-calendar-venue').textContent,venue,'commas in a verified venue are preserved');
  assert.equal(game.querySelector('.dv2-calendar-time-wide').textContent,'19시30분');
  assert.equal(game.querySelector('.dv2-calendar-time-mobile').textContent,'19:30');
  assert.equal(game.querySelector('.dv2-calendar-location').title,'('+venue+', 19시30분)');
  assert(minutes.getAttribute('aria-label').includes(venue));assert.match(game.title,/도미니카공화국 vs 네덜란드/);assert.match(game.title,/19시30분 KST/);
  assert.equal(doc.querySelector('확인'),null,'venue strings remain escaped text');
  minutes.click();assert.equal(doc.querySelector('.dv2-match-meta>span').textContent,'19:30 KST');assert.equal(doc.querySelector('.dv2-match-venue').textContent,venue);doc.querySelector('#dv2-day-dialog').close();
  const missing=cal.querySelector('[data-dv2-date="2026-07-02"]');
  assert.equal(missing.querySelector('.dv2-calendar-venue').textContent,'장소 미정');
  assert.equal(missing.querySelector('.dv2-calendar-time').textContent,', 시간 미정)');
  assert(!missing.textContent.includes('등록 도시'),'no home-city inference when the venue is absent');
  const invalid=cal.querySelector('[data-dv2-date="2026-07-03"]');assert.equal(invalid.querySelector('.dv2-calendar-time').textContent,', 시간 미정)');
  assert.equal(invalid.querySelector('.dv2-calendar-time-mobile'),null,'an invalid clock is not compacted into a claimed time');
  assert.equal(JSON.stringify(d),before);
 }finally{w.close();}
});


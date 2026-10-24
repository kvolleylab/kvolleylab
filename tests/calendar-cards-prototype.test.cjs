'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('assets/js/competition-calendar-cards-prototype-v1.js');
const period=JSON.parse(read('data/calendar/2026-competition-periods.json'));
const genders=JSON.parse(read('data/calendar/2026-competition-genders.json'));
const html=read('competition-calendar-cards-prototype.html');
async function mount(query='view=year&year=2026',options={}){
  const dom=new JSDOM(html,{url:'https://calendar.test/competition-calendar-cards-prototype.html?'+query,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.matchMedia=()=>({matches:options.mobile||false});w.scrollTo=()=>{};
  const data=options.data||period;let copied='';
  w.fetch=async url=>({ok:!options.missingData&&(url.includes('periods')||!options.missingGenders),json:async()=>url.includes('periods')?structuredClone(data):structuredClone(genders)});
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text}}});
  w.eval(source);
  for(let i=0;i<30;i++)await Promise.resolve();
  return {dom,w,d:w.document,copied:()=>copied,close:()=>w.close()};
}
const selectedIds=p=>[...p.d.querySelectorAll('#ccSelectedDay [data-event-id]')].map(e=>e.dataset.eventId).sort();
const expected=(date,gender='all',category='all')=>period.events.filter(e=>e.start<=date&&e.end>=date&&(gender==='all'||genders.events[e.id].genders.includes(gender))&&(category==='all'||(category==='domestic'?e.category.startsWith('domestic-'):e.category===category))).map(e=>e.id).sort();
test('all 12 annual cards use Sunday-first dates; every 2026 date occupies the correct weekday',async()=>{
  const p=await mount();assert.equal(p.d.querySelectorAll('.cc-month-card').length,12);
  let count=0;
  for(const grid of p.d.querySelectorAll('.cc-card-grid')){
    const month=Number(grid.dataset.calendarMonth);
    const labels=[...grid.previousElementSibling.children].map(e=>e.textContent);
    assert.deepEqual(labels,['일','월','화','수','목','금','토']);
    [...grid.children].forEach((cell,index)=>{if(!cell.dataset.date)return;
      const date=new Date(cell.dataset.date+'T00:00:00Z');assert.equal(date.getUTCMonth()+1,month);
      assert.equal(index%7,date.getUTCDay());assert.equal(Number(cell.dataset.eventCount),expected(cell.dataset.date).length);count++;
    });
  }
  assert.equal(count,365);
  assert.equal([...p.d.querySelector('#cc-month-1 .cc-card-grid').children].findIndex(e=>e.dataset.date==='2026-01-01'),4);
  assert.equal([...p.d.querySelector('#cc-month-6 .cc-card-grid').children].findIndex(e=>e.dataset.date==='2026-06-01'),1);
  p.close();
});
test('every monthly day and neighboring date has correct weekday and exact period membership',async()=>{
  for(let month=1;month<=12;month++){
    const p=await mount(`view=month&year=2026&month=${month}`);
    const cells=[...p.d.querySelectorAll('.cc-card-grid [data-date]')];
    assert.equal(cells.length%7,0);
    for(const [i,cell] of cells.entries()){
      const date=cell.dataset.date;assert.equal(new Date(date+'T00:00:00Z').getUTCDay(),i%7);
      assert.equal(Number(cell.dataset.eventCount),expected(date).length,date);
      if(cell.matches('button')){cell.click();assert.deepEqual(selectedIds(p),expected(date),date)}
    }
    p.close();
  }
});
test('cross-week/cross-month Goseong period starts June 25 and ends July 3 inclusive',async()=>{
  for(const [month,date,present] of [[6,'2026-06-24',false],[6,'2026-06-25',true],[6,'2026-06-28',true],[6,'2026-07-03',true],[7,'2026-07-03',true],[7,'2026-07-04',false]]){
    const p=await mount(`view=month&year=2026&month=${month}&category=domestic`);
    const cell=p.d.querySelector(`[data-date="${date}"]`);
    assert.equal(Number(cell.dataset.eventCount)>0,present);
    if(cell.matches('button')){cell.click();assert.equal(selectedIds(p).includes('goseong-university-2026'),present)}
    p.close();
  }
});
test('all gender/category combinations preserve exact event sets and shared university/school classification',async()=>{
  for(const month of [6,8,9])for(const gender of ['all','men','women'])for(const category of ['all','international','domestic','vleague']){
    const p=await mount(`view=month&year=2026&month=${month}&date=2026-${String(month).padStart(2,'0')}-29`);
    p.d.querySelector(`[data-gender="${gender}"]`).click();p.d.querySelector(`[data-filter="${category}"]`).click();
    const date=`2026-${String(month).padStart(2,'0')}-29`;assert.deepEqual(selectedIds(p),expected(date,gender,category));
    const q=new URL(p.w.location.href).searchParams;assert.equal(q.get('gender')||'all',gender);assert.equal(q.get('category')||'all',category);
    p.close();
  }
  for(const gender of ['men','women'])for(const [month,day,id] of [[6,25,'goseong-university-2026'],[8,12,'danyang-university-2026'],[8,29,'cbs-middle-high-2026']]){
    const p=await mount(`view=month&year=2026&month=${month}&date=2026-${String(month).padStart(2,'0')}-${day}&gender=${gender}&category=domestic`);
    assert.ok(selectedIds(p).includes(id));p.close();
  }
});
test('six overlapping August 29 events are all visible; only dated match rows yield one confirmed match',async()=>{
  const p=await mount('view=month&year=2026&month=8&date=2026-08-29');
  assert.equal(selectedIds(p).length,6);assert.match(p.d.querySelector('#ccSelectedDay').textContent,/확인된 경기 1경기/);
  assert.equal(p.d.querySelectorAll('#ccSelectedDay .cc-card-confirmed').length,1);
  p.d.querySelector('[data-select-date="2026-08-28"]').click();assert.equal(p.d.querySelectorAll('#ccSelectedDay .cc-card-confirmed').length,0);p.close();
  const june=await mount('view=month&year=2026&month=6&date=2026-06-25');
  assert.equal(june.d.querySelectorAll('.cc-card-confirmed').length,0);assert.doesNotMatch(june.d.querySelector('#competitionCalendar').textContent,/47경기|6경기|결승 1경기/);june.close();
});
test('year/month/previous/next navigation preserve gender, category and locale parameters',async()=>{
  const p=await mount('view=year&year=2026&gender=women&category=domestic&lang=ko');
  const link=p.d.querySelector('#cc-month-6 .cc-month-head a');let q=new URL(link.href).searchParams;
  for(const [k,v] of [['view','month'],['year','2026'],['month','6'],['gender','women'],['category','domestic'],['lang','ko']])assert.equal(q.get(k),v);
  p.close();
  for(const [month,label,y,m] of [[1,'이전 달','2025','12'],[12,'다음 달','2027','1']]){
    const x=await mount(`view=month&year=2026&month=${month}&gender=men&category=international&lang=ko`);
    q=new URL(x.d.querySelector(`[aria-label="${label}"]`).href).searchParams;
    assert.equal(q.get('year'),y);assert.equal(q.get('month'),m);assert.equal(q.get('gender'),'men');assert.equal(q.get('category'),'international');assert.equal(q.get('lang'),'ko');x.close();
  }
});
test('sharing retains selected date, filters and locale',async()=>{
  const p=await mount('view=month&year=2026&month=6&gender=women&lang=ko');
  p.d.querySelector('[data-select-date="2026-06-25"]').click();await p.d.querySelector('[data-share]').onclick();
  assert.equal(p.copied(),p.w.location.href);assert.match(p.copied(),/date=2026-06-25/);assert.match(p.copied(),/gender=women/);assert.match(p.copied(),/lang=ko/);p.close();
});
test('today remains independent from selection and uses Korean civil date',async()=>{
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
  const [year,month]=today.split('-').map(Number);const data={...period,year,events:[]};
  const p=await mount(`view=month&year=${year}&month=${month}`,{data});
  assert.equal(p.d.querySelector('[aria-current="date"]').dataset.date,today);
  const other=[...p.d.querySelectorAll('[data-select-date]')].find(e=>e.dataset.date!==today);other.click();
  assert.equal(p.d.querySelector('[aria-current="date"]').dataset.date,today);assert.equal(p.d.querySelector('.is-selected').dataset.date,other.dataset.date);p.close();
});
test('no missing gender metadata is interpreted as a gender confirmation',async()=>{
  const p=await mount('view=month&year=2026&month=8&date=2026-08-29&gender=men',{missingGenders:true});
  assert.match(p.d.querySelector('#competitionCalendarControls').textContent,/전체 일정만 표시/);assert.deepEqual(selectedIds(p),expected('2026-08-29'));assert.equal(new URL(p.w.location.href).searchParams.get('gender'),null);p.close();
});
test('absent year data presents a recovery link without inventing fixtures',async()=>{
  const p=await mount('view=month&year=2027&month=1',{missingData:true});
  assert.match(p.d.querySelector('.cc-data-error').textContent,/2027년/);assert.match(p.d.querySelector('.cc-data-error a').href,/year=2026/);assert.equal(p.d.querySelectorAll('[data-event-id]').length,0);p.close();
});
test('default Korean and future translation hooks retain existing language identifiers',async()=>{
  const p=await mount('view=month&year=2026&month=6&lang=ko');
  assert.equal(p.d.documentElement.lang,'ko');assert.match(p.d.querySelector('.cc-card-monthly-head').textContent,/2026년 6월/);
  assert.doesNotMatch(p.d.querySelector('#competitionCalendar').textContent,/TOURNAMENT CALENDAR|EVENTS|SCHEDULE/);
  assert.match(source,/KVLCalendarTranslations/);p.close();
});
test('all event destinations preserve original path/query/hash; local targets exist',async()=>{
  for(const e of period.events){const target=new URL(e.href,'https://kvolleylab.com/');
    if(target.origin==='https://kvolleylab.com')assert.ok(fs.existsSync(path.join(root,target.pathname)),e.href);
  }
  const p=await mount('view=month&year=2026&month=8&date=2026-08-29');
  for(const card of p.d.querySelectorAll('[data-event-id]')){
    const e=period.events.find(e=>e.id===card.dataset.eventId);assert.equal(card.querySelector('a').href,new URL(e.href,'https://kvolleylab.com/').href);
  }p.close();
});
test('existing Goseong summary modal retains results and routes its local links to the operating site',async()=>{
  const p=await mount('view=month&year=2026&month=6&date=2026-06-25');
  p.w.eval(read('assets/js/competition-calendar-details.js'));
  for(let i=0;i<30;i++)await Promise.resolve();
  p.d.querySelector('#ccSelectedDay .cc-focus-event').click();
  const modal=p.d.querySelector('.cc-detail-modal');assert.equal(modal.hidden,false);
  assert.match(modal.textContent,/총 47경기/);assert.match(modal.textContent,/인하대학교/);
  const link=modal.querySelector('.cc-detail-actions a');
  p.d.addEventListener('click',e=>e.preventDefault());link.click();
  assert.equal(link.href,'https://kvolleylab.com/goseong-university-2026.html');
  modal.querySelector('.cc-detail-close').click();assert.equal(modal.hidden,true);p.close();
});
test('production calendar, shared UI, Hero images, masters and all data remain byte-for-byte unchanged',()=>{
  const diff=execFileSync('git',['diff','--name-only','3a187f09f0d4f8a8bf72d6abc48367208cdb03e4','--','competition-calendar.html','index.html','player.html','players.html','domestic-competitions.html','data','assets/img','assets/images','assets/js/unified-nav.js','assets/js/kvl-global-sidebar-v1.js','assets/js/competition-calendar-gender-v1.js','assets/js/school-competitions-hub.js','assets/css/competition-calendar-v2.css'],{cwd:root,encoding:'utf8'});
  assert.equal(diff.trim(),'');
  const prod=read('competition-calendar.html');
  const extract=s=>s.match(/<section class="cc-calendar-hero"[\s\S]*?<\/section>/)[0];
  assert.equal(extract(html),extract(prod));assert.match(html,/max-width:1180px/);
});

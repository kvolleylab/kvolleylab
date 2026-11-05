'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('assets/js/competition-calendar-cards-v1.js');
const period=JSON.parse(read('data/calendar/2026-competition-periods.json'));
const genders=JSON.parse(read('data/calendar/2026-competition-genders.json'));
const domestic=JSON.parse(read('data/calendar/2026-domestic-competitions.json'));
const verified=JSON.parse(read('data/calendar/verified-events.json'));
const html=read('competition-calendar.html');
async function mount(query='view=year&year=2026',options={}){
  const dom=new JSDOM(html,{url:'https://kvolleylab.com/competition-calendar.html?'+query,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.matchMedia=()=>({matches:options.mobile||false});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
  if(options.now){const NativeDate=w.Date;w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[options.now]))}static now(){return new NativeDate(options.now).getTime()}};}
  const data=options.data||period;let copied='';w.KVLCalendarLayerPriority=options.priority;
  w.fetch=async url=>url.includes('verified-events')?{ok:true,json:async()=>structuredClone(options.verified||[])}:({status:options.missingData?404:200,ok:!options.missingData&&(url.includes('periods')||!options.missingGenders)&&!(url.includes('domestic-competitions')&&options.missingLocations),json:async()=>structuredClone(url.includes('periods')?data:url.includes('domestic-competitions')?(options.domestic||domestic):(options.genders||genders))});
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text}}});
  const calendarFetch=w.fetch;
  w.fetch=async url=>{
    if(url.startsWith('data/calendar/'))return calendarFetch(url);
    if(options.matchFetch)return options.matchFetch(url);
    const file=path.join(root,url);return {ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};
  };
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
  for(const file of ['kvl-calendar-display-v1.js','kvl-match-calendar-v1.js','competition-calendar-day-v1.js'])w.eval(read('assets/js/'+file));
  w.eval(options.source||source);
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
    const labels=[...grid.parentElement.previousElementSibling.children].map(e=>e.textContent);
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
test('bars route to KVL and retain internal paths, including the West Japan results page',async()=>{
  const p=await mount('view=year&year=2026',{verified});
  const all=[...period.events,...verified];
  assert.equal(new Set(all.map(e=>e.id)).size,39);
  for(const e of all){
    const bar=p.d.querySelector(`[data-range-event="${e.id}"]`);
    assert.ok(bar,e.id);
    const url=new URL(bar.href),original=new URL(e.href,'https://kvolleylab.com/');
    assert.equal(url.origin,'https://kvolleylab.com',e.id);
    assert.ok(fs.existsSync(path.join(root,url.pathname)),e.id);
    const routes={
      'vnl-women-2026':'/competition-engine.html?competition=vnl-women-2026',
      'asian-games-men-volleyball-2026':'/competition-engine.html?competition=asian-games-men-2026',
      'asian-games-women-volleyball-2026':'/competition-engine.html?competition=asian-games-women-2026',
      'cbs-middle-high-2026':'/school-competition-cbs-2026.html'
    };
    if(routes[e.id])assert.equal(url.pathname+url.search,routes[e.id]);
    else if(original.origin===url.origin)assert.equal(url.href,original.href);
    else if(e.id==='west-japan-university-men-selection-2026'){
      assert.equal(url.pathname,'/international-university-west-japan-select-2026.html');
      assert.equal(url.searchParams.get('view'),'matches');
    }else{
      assert.equal(url.pathname,'/competition-calendar.html');
      assert.equal(url.hash,'#cc-event-'+e.id);
      assert.equal(url.searchParams.get('date'),bar.dataset.rangeStart);
    }
  }
  p.close();
});
test('prior-season tooltip links to the selected calendar card and keeps the article an explicit source',async()=>{
  for(const gender of ['men','women']){
    const p=await mount('view=year&year=2026&category=vleague&gender='+gender,{verified,mobile:true});
    const id='v-league-'+gender+'-2025-26',a=p.d.querySelector('#cc-month-3 [data-range-event="'+id+'"]');
    const tap=new p.w.MouseEvent('click',{bubbles:true,cancelable:true});
    a.dispatchEvent(tap);assert.ok(tap.defaultPrevented);
    assert.equal(p.d.querySelector('#ccRangeTooltip').hidden,false);
    const out=new p.w.Event('pointerout',{bubbles:true});Object.defineProperty(out,'pointerType',{value:'touch'});a.dispatchEvent(out);
    await new Promise(resolve=>setTimeout(resolve,180));
    assert.equal(p.d.querySelector('#ccRangeTooltip').hidden,false);
    p.d.addEventListener('click',e=>{assert.equal(e.defaultPrevented,true);e.preventDefault()},{once:true});a.click();
    assert.equal(p.d.querySelector('#ccRangeTooltip').hidden,true);a.click();
    assert.equal(p.d.querySelector('#ccRangeTooltip a').href,a.href);
    const u=new URL(a.href);assert.equal(u.searchParams.get('month'),'3');assert.equal(u.searchParams.get('gender'),gender);
    const dest=await mount(u.search.slice(1)+u.hash,{verified,mobile:true});
    assert.equal(dest.w.location.hash,u.hash);
    const card=dest.d.getElementById('cc-event-'+id);
    assert.ok(card.closest('#ccSelectedDay'));assert.equal(card.querySelector('h3').textContent.includes('V-리그'),true);
    const link=card.querySelector('a');assert.match(link.textContent,/일정 출처 보기 \(외부\)/);assert.equal(link.target,'_blank');assert.equal(link.href,verified.find(e=>e.id===id).href);
    const list=dest.d.querySelector('.cc-card-all-events [data-event-id="'+id+'"]');
    assert.equal(new URL(list.querySelector('.cc-card-event-action').href).hash,u.hash);
    dest.close();p.close();
  }
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
test('period segments cover every included day exactly once without overlapping lanes or crossing week boundaries',async()=>{
  for(const view of ['year','month'])for(const m of view==='year'?[1]:Array.from({length:12},(_,i)=>i+1)){
    const p=await mount(`view=${view}&year=2026&month=${m}`);
    for(const board of p.d.querySelectorAll('.cc-card-board')){
      const days=[...board.querySelectorAll('[data-date]')],bars=[...board.querySelectorAll('[data-range-event]')];
      for(const date of days.map(d=>d.dataset.date)){
        const covering=bars.filter(b=>b.dataset.rangeStart<=date&&b.dataset.rangeEnd>=date);
        assert.deepEqual(covering.map(b=>b.dataset.rangeEvent).sort(),expected(date),date);
        assert.equal(new Set(covering.map(b=>b.dataset.rangeLane)).size,covering.length,'no lane overlap '+date);
      }
      for(const bar of bars){
        const start=new Date(bar.dataset.rangeStart+'T00:00:00Z'),end=new Date(bar.dataset.rangeEnd+'T00:00:00Z');
        const span=Math.round((end-start)/86400000)+1;assert.ok(start.getUTCDay()+span<=7);
        assert.equal(bar.style.gridColumn,`${start.getUTCDay()+1}/span ${span}`);
        const event=period.events.find(e=>e.id===bar.dataset.rangeEvent);
        assert.equal(bar.classList.contains('continues-before'),event.start<bar.dataset.rangeStart);
        assert.equal(bar.classList.contains('continues-after'),event.end>bar.dataset.rangeEnd);
        assert.equal(new URL(bar.href).origin,'https://kvolleylab.com');
      }
    }p.close();
  }
});
test('range tooltip shows original full name and complete period, highlights every segment, and closes with Escape',async()=>{
  const p=await mount('view=month&year=2026&month=6');
  const ranges=[...p.d.querySelectorAll('[data-range-event="goseong-university-2026"]')],tip=p.d.getElementById('ccRangeTooltip');
  assert.equal(ranges.length,2);assert.equal(tip.hidden,true);
  ranges[0].dispatchEvent(new p.w.Event('pointerover',{bubbles:true}));
  assert.equal(tip.hidden,false);assert.match(tip.textContent,/2026 대한항공배 전국대학배구 고성대회/);
  assert.match(tip.textContent,/2026.06.25 – 2026.07.03/);
  assert.equal(p.d.querySelectorAll('.is-range-active').length,2);
  assert.equal(ranges[0].getAttribute('aria-describedby'),tip.id);
  p.d.dispatchEvent(new p.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(tip.hidden,true);
  ranges[1].focus();assert.equal(tip.hidden,false);
  p.w.dispatchEvent(new p.w.Event('scroll'));assert.equal(tip.hidden,false);
  p.d.querySelector('[data-filter="international"]').click();assert.equal(tip.hidden,true);
  assert.equal(p.d.querySelectorAll('[data-range-event="goseong-university-2026"]').length,0);p.close();
});
test('mobile first tap opens, second tap closes, tooltip opens tournament, outside tap dismisses',async()=>{
  const p=await mount('view=month&year=2026&month=6',{mobile:true});
  const a=p.d.querySelector('[data-range-event="goseong-university-2026"]'),tip=p.d.getElementById('ccRangeTooltip');
  const first=new p.w.MouseEvent('click',{bubbles:true,cancelable:true});a.dispatchEvent(first);
  assert.equal(first.defaultPrevented,true);assert.equal(tip.hidden,false);assert.match(tip.textContent,/말풍선을 눌러/);
  let secondPrevented=null;p.d.addEventListener('click',e=>{secondPrevented=e.defaultPrevented;e.preventDefault()},{once:true});
  a.click();assert.equal(secondPrevented,true);assert.equal(tip.hidden,true);a.click();assert.equal(tip.hidden,false);assert.equal(tip.querySelector('a').href,a.href);assert.equal(a.href,'https://kvolleylab.com/goseong-university-2026.html');
  p.d.body.dispatchEvent(new p.w.Event('pointerdown',{bubbles:true}));assert.equal(tip.hidden,true);p.close();
});

test('separate women use bright pink; annual joint events retain their family color and gender tooltip',async()=>{
  const fixtures=[['fivb-men','FIVB 남자','international',['men'],'#A474F1'],['avc-men','AVC 남자','international',['men'],'#7CCB47'],['university-men','대학 남자','domestic-university',['men'],'#58A9F4'],['school-men','중고 남자','domestic-school',['men'],'#FF9E35'],['v-league-men','V-리그 남자','vleague',['men'],'#53565C'],['kovo-cup-men','KOVO컵 남자','domestic-pro',['men'],'#58A9F4'],['fivb-women','FIVB 여자','international',['women'],'#FF72B1'],['avc-women','AVC 여자','international',['women'],'#FF72B1'],['university-women','대학 여자','domestic-university',['women'],'#FF72B1'],['school-women','중고 여자','domestic-school',['women'],'#FF72B1'],['v-league-women','V-리그 여자','vleague',['women'],'#FF72B1'],['kovo-cup-women','KOVO컵 여자','domestic-pro',['women'],'#FF72B1'],['university-joint','대학 남녀공통','domestic-university',['men','women'],'#58A9F4']];
  // Isolated fixtures verify future inputs; they are never published as schedules.
  const data={categories:period.categories,events:fixtures.map(([id,title,category],i)=>({id,title,category,start:`2026-01-${String(i+1).padStart(2,'0')}`,end:`2026-01-${String(i+1).padStart(2,'0')}`,href:'competition-engine.html?competition='+id}))};
  const map={schema:'calendar-genders-v1',year:2026,events:Object.fromEntries(fixtures.map(([id,,,g])=>[id,{genders:g}]))};
  const before=JSON.stringify({data,map});const p=await mount('view=year&year=2026',{data,genders:map});
  for(const [id,,,,color] of fixtures){const bars=p.d.querySelectorAll(`[data-range-event="${id}"]`);assert.equal(bars.length,1);assert.equal(bars[0].style.getPropertyValue('--event-color'),color);assert.equal(bars[0].classList.contains('is-pro'),color==='#53565C');}
  const joint=p.d.querySelector('[data-range-event="university-joint"]');assert.match(joint.textContent,/대학 남녀공통/);joint.dispatchEvent(new p.w.FocusEvent('focusin',{bubbles:true}));assert.match(p.d.querySelector('#ccRangeTooltip').textContent,/남녀공통/);
  assert.equal(JSON.stringify({data,map}),before);p.close();
});
test('overlapping priority is pro, international, university, school and is configurable',async()=>{
  const names=[['school','학교','domestic-school'],['university','대학','domestic-university'],['avc','AVC','international'],['v-league','V-리그','vleague']];
  const data={categories:period.categories,events:names.map(([id,title,category])=>({id,title,category,start:'2026-06-01',end:'2026-06-05',href:'competition-engine.html'}))};
  const map={schema:'calendar-genders-v1',year:2026,events:Object.fromEntries(names.map(([id])=>[id,{genders:['men']}]))};
  for(const [priority,order] of [[undefined,['v-league','avc','university','school']],[{school:0,pro:3},['school','avc','university','v-league']]]){
    const p=await mount('view=year&year=2026',{data,genders:map,priority});
    const bars=[...p.d.querySelectorAll('#cc-month-6 [data-range-event]')].sort((a,b)=>Number(a.dataset.rangeLane)-Number(b.dataset.rangeLane));
    assert.deepEqual(bars.map(b=>b.dataset.rangeEvent),order);p.close();
  }
});
test('tooltip contains full title, gender, classification and complete period for every event',async()=>{
  const p=await mount();for(const event of period.events){const a=p.d.querySelector(`[data-range-event="${event.id}"]`);assert.ok(a,event.id);a.dispatchEvent(new p.w.FocusEvent('focusin',{bubbles:true}));const text=p.d.querySelector('#ccRangeTooltip').textContent;assert.ok(text.includes(event.title));assert.ok(text.includes(event.start.replaceAll('-','.')));assert.ok(text.includes(event.end.replaceAll('-','.')));assert.match(text,/남자부|여자부|남녀공통/);}
  p.close();
});
test('leap day, month boundary and year boundary preserve exact coverage and Sunday grid',async()=>{
  const data={categories:period.categories,events:[{id:'leap',title:'Leap test',category:'international',start:'2028-02-28',end:'2028-03-02',href:'competition-engine.html'},{id:'year',title:'Year test',category:'international',start:'2027-12-29',end:'2028-01-03',href:'competition-engine.html'}]};
  const p=await mount('view=year&year=2028',{data,genders:{schema:'calendar-genders-v1',year:2028,events:{}}});
  assert.equal(p.d.querySelectorAll('[data-date]').length,366);
  assert.ok(p.d.querySelector('[data-date="2028-02-29"]'));
  for(const date of ['2028-01-01','2028-01-02','2028-01-03','2028-02-28','2028-02-29','2028-03-01','2028-03-02']){
    const m=Number(date.slice(5,7)),bars=[...p.d.querySelectorAll(`#cc-month-${m} [data-range-event]`)];assert.equal(bars.filter(b=>b.dataset.rangeStart<=date&&b.dataset.rangeEnd>=date).length,1,date);
  }p.close();
});
test('year selector and previous/next controls remain present for unregistered data',async()=>{
  for(const missingData of [false,true]){const p=await mount('view=year&year=2026',{missingData});const sel=p.d.querySelector('[data-year-select]');assert.equal(sel.value,'2026');assert.equal(sel.selectedOptions[0].textContent,'2026년');assert.ok(p.d.querySelector('[aria-label="이전 연도"]'));assert.ok(p.d.querySelector('[aria-label="다음 연도"]'));p.close();}
});

test('all month footers remain navigable and missing-data filter changes keep the recovery state',async()=>{
  const p=await mount();
  for(const foot of p.d.querySelectorAll('.cc-card-month-foot')){assert.match(foot.textContent,/이달의 대회.*→/);assert.match(foot.href,/view=month/)}
  p.close();
  const missing=await mount('view=year&year=2027',{missingData:true});
  missing.d.querySelector('[data-filter="international"]').click();
  assert.ok(missing.d.querySelector('.cc-data-error'));assert.equal(missing.d.querySelectorAll('.cc-month-card').length,0);missing.close();
});

function pairedFixture(){
  const events=[
    ['avc-men-test','2026 AVC 남자 선수권','2026-08-01','2026-09-10','men'],
    ['avc-women-test','2026 AVC 여자 선수권','2026-08-01','2026-09-10','women'],
    ['avc-u21-men-test','2026 AVC 남자 U21 선수권','2026-08-01','2026-09-10','men'],
    ['avc-u21-women-test','2026 AVC 여자 U21 선수권','2026-08-01','2026-09-10','women'],
    ['fivb-men-test','2026 FIVB 남자 선수권','2026-08-01','2026-08-10','men'],
    ['fivb-women-test','2026 FIVB 여자 선수권','2026-08-01','2026-08-11','women'],
    ['avc-other-women','2026 AVC 여자 클럽컵','2026-08-01','2026-09-10','women']
  ];
  return {data:{categories:period.categories,events:events.map(([id,title,start,end])=>({id,title,start,end,category:'international',href:`competition-engine.html?competition=${id}#schedule`}))},genders:{schema:'calendar-genders-v1',year:2026,events:Object.fromEntries(events.map(([id,,,,g])=>[id,{genders:[g]}]))}};
}
test('only exact male/female pairs of the same competition and entire period merge, preserving both IDs and links',async()=>{
  const fixture=pairedFixture(),original=JSON.stringify(fixture),p=await mount('view=year&year=2026',fixture);
  for(const month of [8,9]){
    const bars=[...p.d.querySelectorAll(`#cc-month-${month} [data-range-event]`)];
    const adult=bars.filter(a=>a.dataset.rangeEvent==='avc-men-test');assert.ok(adult.length);
    for(const a of adult){assert.deepEqual(JSON.parse(a.dataset.rangeMembers),['avc-men-test','avc-women-test']);assert.equal(a.style.getPropertyValue('--event-color'),'#7CCB47');assert.match(a.href,/view=month/);}
    assert.ok(bars.some(a=>a.dataset.rangeEvent==='avc-u21-men-test'));assert.ok(bars.some(a=>a.dataset.rangeEvent==='avc-other-women'));
    assert.ok(!bars.some(a=>a.dataset.rangeEvent==='avc-women-test'));
  }
  const bar=p.d.querySelector('[data-range-event="avc-men-test"]');bar.dispatchEvent(new p.w.FocusEvent('focusin',{bubbles:true}));
  const tip=p.d.querySelector('#ccRangeTooltip');assert.match(tip.textContent,/남 · 여/);assert.match(tip.textContent,/국제대회 · AVC/);
  for(const id of ['avc-men-test','avc-women-test'])assert.ok([...tip.querySelectorAll('a')].some(a=>a.href==='https://kvolleylab.com/competition-engine.html?competition='+id+'#schedule'));
  for(const id of ['fivb-men-test','fivb-women-test'])assert.ok(p.d.querySelector(`[data-range-event="${id}"]`));
  assert.equal(JSON.stringify(fixture),original);p.close();
});
test('gender filters retain their own event/color/link and monthly view keeps both titles',async()=>{
  const fixture=pairedFixture();
  for(const [gender,id,color] of [['men','avc-men-test','#7CCB47'],['women','avc-women-test','#FF72B1']]){
    const p=await mount('view=year&year=2026&gender='+gender,fixture),a=p.d.querySelector(`[data-range-event="${id}"]`);
    assert.deepEqual(JSON.parse(a.dataset.rangeMembers),[id]);assert.equal(a.style.getPropertyValue('--event-color'),color);assert.equal(a.href,'https://kvolleylab.com/competition-engine.html?competition='+id+'#schedule');p.close();
  }
  const monthly=await mount('view=month&year=2026&month=8',fixture);
  for(const id of ['avc-men-test','avc-women-test']){const a=monthly.d.querySelector(`[data-range-event="${id}"]`);assert.ok(a.textContent.trim());assert.deepEqual(JSON.parse(a.dataset.rangeMembers),[id]);}monthly.close();
});
test('ambiguous duplicate candidates are not collapsed into an invented shared competition',async()=>{
  const fixture=pairedFixture();fixture.data.events.push({...fixture.data.events[0],id:'duplicate-men'});fixture.genders.events['duplicate-men']={genders:['men']};
  const p=await mount('view=year&year=2026',fixture);for(const id of ['avc-men-test','avc-women-test','duplicate-men']){const a=p.d.querySelector(`[data-range-event="${id}"]`);assert.deepEqual(JSON.parse(a.dataset.rangeMembers),[id]);}p.close();
});

test('locations use existing exact-ID metadata, deduplicate old suffixes and appear in full tooltip titles',async()=>{
  const p=await mount('view=year&year=2026');
  for(const [id,label] of [
    ['ibk-middle-high-2026','IBK배 중고배구대회 (충북 제천)'],
    ['cbs-middle-high-2026','CBS배 중고배구대회 (경북 영천)'],
    ['danyang-university-2026','대학배구 단양대회 (충북 단양)'],
    ['spring-middle-high-2026','춘계 중고연맹전 (충북 단양)'],
    ['avc-men-continental-2026','AVC 남자 대륙선수권 (일본 후쿠오카현 / 기타큐슈)']
  ]){
    const a=p.d.querySelector(`[data-range-event="${id}"]`);assert.equal(a.textContent,label);
    a.dispatchEvent(new p.w.FocusEvent('focusin',{bubbles:true}));
    const e=period.events.find(e=>e.id===id);assert.ok(p.d.querySelector('#ccRangeTooltip strong').textContent.startsWith(e.title+' ('));
    assert.match(a.getAttribute('aria-label'),/ \(.+\)/);
  }
  p.close();
});
test('optional location feed failure retains all events, original periods/links and known locations',async()=>{
  const p=await mount('view=year&year=2026',{missingLocations:true});
  assert.equal(new Set([...p.d.querySelectorAll('[data-range-event]')].map(a=>a.dataset.rangeEvent)).size,26);
  assert.match(p.d.querySelector('[data-range-event="spring-middle-high-2026"]').textContent,/장소 미등록/);
  assert.match(p.d.querySelector('[data-range-event="vnl-men-2026"]').textContent,/예선 다국가/);
  const a=p.d.querySelector('[data-range-event="ibk-middle-high-2026"]');assert.equal(a.textContent,'IBK배 중고배구대회(제천)');
  p.close();
});
test('location strings are escaped; unrelated parentheses and each merged member location are retained',async()=>{
  const fixture=pairedFixture();fixture.data.events[0].location='서울 <체육관>';fixture.data.events[1].location='부산 & 경기장';
  fixture.data.events[0].short_title='AVC 남자 선수권 (결선)';
  const p=await mount('view=year&year=2026',fixture),a=p.d.querySelector('[data-range-event="avc-men-test"]');
  assert.match(a.textContent,/AVC 남자 선수권 \(결선\) \(서울 <체육관>\)/);assert.match(a.textContent,/부산 & 경기장/);
  assert.equal(a.querySelector('체육관'),null);a.dispatchEvent(new p.w.FocusEvent('focusin',{bubbles:true}));
  assert.equal(p.d.querySelectorAll('#ccRangeTooltip strong').length,2);assert.match(p.d.querySelector('#ccRangeTooltip').textContent,/부산 & 경기장/);
  p.close();
});

test('ended bars and shared tooltip change at the KST day after the inclusive end date',async()=>{
  const data={categories:period.categories,events:[
    {id:'ended',title:'종료 대회',start:'2026-08-27',end:'2026-08-28'},
    {id:'ends-today',title:'오늘까지 대회',start:'2026-08-28',end:'2026-08-29'},
    {id:'next',title:'다음 대회',start:'2026-08-30',end:'2026-08-31'}
  ].map(e=>({...e,category:'international',location:'서울',href:'competition-engine.html?competition='+e.id}))};
  const map={schema:'calendar-genders-v1',year:2026,events:Object.fromEntries(data.events.map(e=>[e.id,{genders:['men']}]))};
  for(const [now,states] of [
    ['2026-08-29T14:59:59Z',['ended','live','upcoming']],
    ['2026-08-29T15:00:00Z',['ended','ended','live']]
  ])for(const view of ['year','month']){
    const p=await mount(`view=${view}&year=2026&month=8`,{data,genders:map,now});
    for(const [i,e] of data.events.entries()){
      const bars=[...p.d.querySelectorAll(`[data-range-event="${e.id}"]`)];assert.ok(bars.length);
      assert.ok(bars.every(a=>a.classList.contains('status-'+states[i])));
      bars[0].dispatchEvent(new p.w.FocusEvent('focusin',{bubbles:true}));
      const tip=p.d.querySelector('#ccRangeTooltip');assert.equal(tip.classList.contains('status-ended'),states[i]==='ended');
      assert.match(tip.textContent,/서울/);assert.equal(tip.hidden,false);
    }
    p.close();
  }
});

test('verified additions appear with exact dates in all 2026 category and gender filters',async()=>{
  const all=[...period.events,...verified];
  assert.equal(new Set(all.map(e=>e.id)).size,all.length);
  for(const gender of ['all','women','men'])for(const category of ['all','international','domestic','vleague']){
    const p=await mount('view=year&year=2026&gender='+gender+'&category='+category,{verified});
    const eligible=all.filter(e=>(gender==='all'||(e.genders||genders.events[e.id].genders).includes(gender))&&
      (category==='all'||(category==='domestic'?e.category.startsWith('domestic-'):e.category===category)));
    for(const dateCell of p.d.querySelectorAll('.cc-card-day[data-date]')){
      const day=dateCell.dataset.date;
      const actual=[...dateCell.closest('.cc-card-board').querySelectorAll('[data-range-event]')].filter(a=>a.dataset.rangeStart<=day&&day<=a.dataset.rangeEnd);
      const wanted=eligible.filter(e=>e.start<=day&&day<=e.end).map(e=>e.id).sort();
      assert.deepEqual(actual.flatMap(a=>JSON.parse(a.dataset.rangeMembers)).sort(),wanted,day);
      assert.equal(new Set(actual.map(a=>a.dataset.rangeLane)).size,actual.length);
    }
    p.close();
  }
});
test('cross-year seasons survive a missing yearly feed and never duplicate base records',async()=>{
  for(const [year,first,last] of [[2025,'2025-10-18','2025-12-31'],[2027,'2027-01-01','2027-04-22']]){
    const p=await mount('view=year&category=vleague&year='+year,{missingData:true,verified});
    const bars=[...p.d.querySelectorAll('[data-range-event]')];assert.ok(bars.length);
    assert.equal(bars.map(b=>b.dataset.rangeStart).sort().at(0),first);
    assert.equal(bars.map(b=>b.dataset.rangeEnd).sort().at(-1),last);
    p.d.querySelector('[data-gender=women]').click();
    assert.equal(p.d.querySelector('[data-range-event]').dataset.rangeEvent.includes('women'),true);p.close();
  }
  const p=await mount('view=month&year=2026&month=6&date=2026-06-25',{verified:[...verified,{...period.events.find(e=>e.id==='goseong-university-2026'),title:'duplicate'}]});
  assert.equal(selectedIds(p).filter(id=>id==='goseong-university-2026').length,1);
  const indices=Object.fromEntries([...p.d.querySelectorAll('.cc-filter-dot')].map(dot=>[dot.parentElement.dataset.filter,dot.style.background]));
  assert.deepEqual(indices,{international:'rgb(220, 38, 38)',domestic:'rgb(37, 99, 235)',vleague:'rgb(17, 17, 17)'});p.close();
});

test('the real calendar entry loads the card renderer and places an accessible home link above the Hero',()=>{
  const dom=new JSDOM(html,{url:'https://kvolleylab.com/competition-calendar.html'});
  const doc=dom.window.document;
  const header=doc.querySelector('.cc-brand-header');
  assert.equal(header.nextElementSibling.className,'cc-calendar-hero');
  const home=header.querySelector('a');
  assert.equal(home.href,'https://kvolleylab.com/index.html');
  assert.match(home.getAttribute('aria-label'),/홈으로 이동/);
  for(const path of ['assets/js/competition-calendar-cards-v1.js','assets/css/competition-calendar-cards-v1.css','assets/js/kvl-global-sidebar-v1.js','assets/css/kvl-global-sidebar-v1.css']){
    assert.ok(doc.querySelector('script[src^="'+path+'"],link[href^="'+path+'"]'),path);
  }
  dom.window.close();
});

const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve()};
test('year and month date buttons open the shared V-League dialog with exact results, teams and set scores',async()=>{
  for(const view of ['year','month']){
    const p=await mount(`view=${view}&year=2026&month=11&category=vleague`,{verified});
    const button=p.d.querySelector('[data-select-date="2026-11-01"]');assert.equal(button.tagName,'BUTTON');assert.equal(button.getAttribute('aria-haspopup'),'dialog');button.click();await flush();
    const dialog=p.d.querySelector('#dv2-day-dialog');assert.equal(dialog.open,true);assert.match(dialog.querySelector('h2').textContent,/2026.11.01 · 2개 대회 · 등록 경기 2경기/);
    const men=dialog.querySelector('[data-day-event="v-league-men-2026-27"]');
    assert.equal(men.querySelector('.dv2-match-teams>strong').textContent,'1 : 3');assert.match(men.textContent,/KB손해보험/);assert.match(men.textContent,/삼성화재/);assert.match(men.textContent,/38-36/);
    assert.equal(dialog.querySelectorAll('[data-calendar-match]').length,2);
    dialog.querySelector('[data-dv2-close]').click();assert.equal(dialog.open,false);
    p.d.querySelector('[data-select-date="2026-11-02"]').click();await flush();assert.equal(dialog.querySelectorAll('[data-calendar-match]').length,0);assert.match(dialog.textContent,/등록된 세부 경기가 없습니다/);p.close();
  }
});
test('desktop bar keeps native navigation; mobile tooltip link navigates without opening a date dialog',async()=>{
  for(const mobile of [false,true]){
    const p=await mount('view=month&year=2026&month=6',{mobile}),bar=p.d.querySelector('[data-range-event="goseong-university-2026"]');
    let prevented;p.d.addEventListener('click',e=>{prevented=e.defaultPrevented;e.preventDefault()},{once:true});bar.click();assert.equal(prevented,mobile);
    if(mobile){const a=p.d.querySelector('#ccRangeTooltip a');p.d.addEventListener('click',e=>{assert.equal(e.defaultPrevented,false);e.preventDefault()},{once:true});a.click();assert.equal(a.href,bar.href)}
    assert.equal(p.d.querySelector('#dv2-day-dialog'),null);p.close();
  }
});
test('joint tournament day results obey gender filters and keep divisions distinct',async()=>{
  for(const gender of ['all','men','women']){
    const p=await mount(`view=month&year=2026&month=6&category=domestic&gender=${gender}`);
    p.d.querySelector('[data-select-date="2026-06-29"]').click();await flush();
    const section=p.d.querySelector('[data-day-event="goseong-university-2026"]');
    const expectedCount=['men','women'].filter(g=>gender==='all'||gender===g).reduce((n,g)=>n+JSON.parse(read(`data/competitions/university-goseong-${g}-2026/data.json`)).matches.filter(m=>m.date==='2026-06-29').length,0);
    assert.equal(section.querySelectorAll('[data-calendar-match]').length,expectedCount);
    if(gender!=='all')assert.ok([...section.querySelectorAll('.cc-day-division')].every(x=>x.textContent===(gender==='men'?'남자부':'여자부')));p.close();
  }
});
test('legacy AVC, West Japan draws and inline friendly fixtures retain their real scores and dates',async()=>{
  for(const [date,event,score] of [
    ['2026-08-21','avc-women-continental-2026','1 : 3'],
    ['2026-08-25','west-japan-university-men-selection-2026','1 : 1'],
    ['2026-08-29','korea-bahrain-men-friendlies-2026','VS'],
    ['2026-06-20','avc-men-cup-2026','2 : 3']
  ]){
    const p=await mount(`view=month&year=2026&month=${Number(date.slice(5,7))}`,{verified});
    p.d.querySelector(`[data-select-date="${date}"]`).click();await flush();
    const section=p.d.querySelector(`[data-day-event="${event}"]`);assert.ok(section,event);assert.ok([...section.querySelectorAll('.dv2-match-teams>strong')].some(e=>e.textContent===score),event);
    assert.doesNotMatch(section.textContent,/불러오지 못했습니다|\[object Object\]/);p.close();
  }
});
test('all configured public exports exist and unresolved competitions stay period-only',async()=>{
  const requested=new Set();
  const p=await mount('view=year&year=2026',{verified,matchFetch:async url=>{requested.add(url);assert.ok(fs.existsSync(path.join(root,url)),url);return {ok:true,json:async()=>JSON.parse(read(url))}}});
  for(const date of ['2026-03-13','2026-04-07','2026-05-23','2026-06-09','2026-06-25','2026-07-07','2026-07-31','2026-08-13','2026-08-28','2026-09-04','2026-09-16','2026-09-27','2026-10-16','2026-10-20','2026-11-01']){
    p.d.querySelector(`[data-select-date="${date}"]`).click();await flush();assert.doesNotMatch(p.d.querySelector('#dv2-day-dialog').textContent,/불러오지 못했습니다/);
  }
  assert.ok(requested.size>=45,requested.size);
  p.d.querySelector('[data-select-date="2026-01-03"]').click();await flush();assert.match(p.d.querySelector('#dv2-day-dialog').textContent,/대회 기간만 확인/);assert.equal(p.d.querySelectorAll('#dv2-day-dialog [data-calendar-match]').length,0);p.close();
});
test('failed match loads are distinct from no fixtures and can be retried',async()=>{
  let failed=true;
  const p=await mount('view=month&year=2026&month=11&gender=men&category=vleague',{verified,matchFetch:async url=>({ok:!failed,json:async()=>JSON.parse(read(url))})});
  p.d.querySelector('[data-select-date="2026-11-01"]').click();await flush();const dialog=p.d.querySelector('#dv2-day-dialog');assert.match(dialog.textContent,/불러오지 못했습니다/);assert.doesNotMatch(dialog.textContent,/등록된 세부 경기가 없습니다/);
  failed=false;dialog.querySelector('[data-day-retry]').click();await flush();assert.equal(dialog.querySelectorAll('[data-calendar-match]').length,1);assert.equal(dialog.querySelector('[data-day-retry]'),null);p.close();
});
test('a late request cannot replace the next selected date or reopen a dismissed dialog',async()=>{
  const pending=[];
  const p=await mount('view=month&year=2026&month=11&category=vleague',{verified,matchFetch:url=>new Promise(resolve=>pending.push(()=>resolve({ok:true,json:async()=>JSON.parse(read(url))})))});
  p.d.querySelector('[data-select-date="2026-11-01"]').click();p.d.querySelector('[data-select-date="2026-11-02"]').click();pending.forEach(done=>done());await flush();
  const dialog=p.d.querySelector('#dv2-day-dialog');assert.match(dialog.querySelector('h2').textContent,/2026.11.02/);assert.equal(dialog.querySelectorAll('[data-calendar-match]').length,0);
  p.d.querySelector('[data-select-date="2026-11-01"]').click();dialog.close();await flush();assert.equal(dialog.open,false);p.close();
});

 test('CBS women filter retains the women division when opening its existing tournament route',async()=>{
 const p=await mount('view=month&year=2026&month=8&gender=women');
 assert.equal(new URL(p.d.querySelector('[data-range-event="cbs-middle-high-2026"]').href).searchParams.get('division'),'high-women');p.close();
 });

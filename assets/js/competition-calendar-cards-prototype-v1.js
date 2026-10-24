/* KVL calendar card prototype v1 · 2026-10-24
 * Uses the production period data and gender mapping without changing either.
 * Sunday-first civil dates; date-level match counts require dated match records.
 */
(()=>{
  const root=document.getElementById('competitionCalendar');
  const controls=document.getElementById('competitionCalendarControls');
  if(!root||!controls)return;
  // The shared menu is unchanged. Isolated previews send its non-calendar
  // destinations to their existing public pages instead of cloning the site.
  if(location.hostname!=='kvolleylab.com')document.addEventListener('click',event=>{
    const a=event.target.closest('#kvlGlobalSidebar a,.cc-mobile-brand a,.site-logo,.cc-detail-actions a');
    if(!a)return;
    const href=a.getAttribute('href');
    if(href&&!/^(https?:|#)/.test(href)){
      if(href.startsWith('competition-calendar.html'))a.href=calendarHref(view,year,month);
      else a.href=new URL(href,'https://kvolleylab.com/').href;
    }
  },true);
  const params=new URLSearchParams(location.search);
  const ko={
    weekdays:['일','월','화','수','목','금','토'],fullWeekdays:['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
    all:'전체',men:'남자부',women:'여자부',international:'국제대회',domestic:'국내대회',vleague:'V-리그',
    today:'오늘',share:'링크 복사',copied:'복사 완료',copyPrompt:'아래 주소를 복사하세요.',
    live:'진행 중',upcoming:'예정',ended:'종료',previousYear:'이전 연도',nextYear:'다음 연도',previousMonth:'이전 달',nextMonth:'다음 달',
    count:n=>`${n}개 대회`,matches:n=>`확인된 경기 ${n}경기`,year:y=>`${y}년`,month:m=>`${m}월`,yearMonth:(y,m)=>`${y}년 ${m}월`,
    day:(m,d)=>`${m}월 ${d}일`,duration:n=>`${n}일간`,monthJump:'월 바로가기',genderFilter:'남녀부 일정 필터',categoryFilter:'대회 분류 필터',
    genderNote:'남녀 공동 개최 대회는 양쪽에서 표시 · 대회 기간 기준',genderMissing:'성별 분류 자료를 불러오지 못해 전체 일정만 표시합니다.',
    unclassified:n=>` · 분류 미확인 ${n}건은 전체에서 표시`,monthEvents:'이달의 대회',selectedDay:'선택한 날짜',selected:'선택',
    periodNote:'대회 기간 기준이며, 모든 날짜에 경기가 열리는 것은 아닙니다.',dayHint:'날짜를 선택하면 그날 대회 기간에 포함되는 모든 대회를 볼 수 있습니다.',
    noDayEvents:'이 날짜에 등록된 대회 일정이 없습니다.',noMonthEvents:'이달에 등록된 대회 일정이 없습니다.',
    allMonth:'이달 전체 대회 보기',period:'대회 기간',details:'일정·결과 보기',summary:'대회 요약 보기',joint:'남녀부 공동 개최',
    dataMissing:y=>`${y}년 대회 일정 데이터가 없습니다.`,retry:'다시 불러오기',back2026:'2026년 달력 보기',
    matchNote:'날짜가 확인된 경기만 집계하며, 대회 전체 경기 수를 날짜별 경기 수로 사용하지 않습니다.',
    daySchedule:'날짜별 대회',otherMonth:'다른 달',yearHint:'월 또는 날짜를 선택해 자세한 일정을 확인하세요.'
  };
  // Keep locale/query state. Additional locale dictionaries can override keys;
  // absent translations fall back to Korean, the existing site default.
  const locale=params.get('lang')||document.documentElement.lang||'ko';
  const t={...ko,...(window.KVLCalendarTranslations?.[locale]||{})};
  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const civil=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
  const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&iso(new Date(s+'T00:00:00Z'))===s;
  const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=k=>todayParts.find(p=>p.type===k).value;
  const todayIso=`${part('year')}-${part('month')}-${part('day')}`;
  const todayYear=Number(part('year')),todayMonth=Number(part('month'));
  const numberParam=(key,fallback,min,max)=>{const n=Number(params.get(key));return params.has(key)&&Number.isInteger(n)&&n>=min&&n<=max?n:fallback};
  const year=numberParam('year',2026,1900,2200),month=numberParam('month',todayMonth,1,12);
  const explicitView=['year','month'].includes(params.get('view'));
  const responsiveView=()=>window.matchMedia('(max-width:767px)').matches?'month':'year';
  let view=explicitView?params.get('view'):responsiveView();
  const requestedCategory=params.get('category')||'all';
  let active=requestedCategory.startsWith('domestic-')?'domestic':requestedCategory;
  if(!['all','international','domestic','vleague'].includes(active))active='all';
  let gender=['men','women'].includes(params.get('gender'))?params.get('gender'):'all';
  let selected=validDate(params.get('date'))?params.get('date'):null;
  let payload=null,genderMap=null,resizeTimer=null;
  const colorOf=c=>payload?.categories.find(x=>x.id===c)?.color||'#64748b';
  const labelOf=c=>payload?.categories.find(x=>x.id===c)?.label||t.period;
  const displayTitle=e=>e.short_title||e.title;
  const assignedGenders=e=>genderMap?.events?.[e.id]?.genders||[];
  const visibleEvents=()=>payload.events.filter(e=>(active==='all'||(active==='domestic'?e.category.startsWith('domestic-'):e.category===active))&&(gender==='all'||assignedGenders(e).includes(gender)));
  const eventsAt=(date,events=visibleEvents())=>events.filter(e=>e.start<=date&&e.end>=date);
  const overlaps=(e,y,m)=>e.start<=iso(civil(y,m+1,0))&&e.end>=iso(civil(y,m,1));
  const monthEvents=m=>visibleEvents().filter(e=>overlaps(e,year,m)).sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'ko'));
  const statusOf=e=>e.start<=todayIso&&e.end>=todayIso?'live':e.start>todayIso?'upcoming':'ended';
  const formatDate=s=>{const [y,m,d]=s.split('-').map(Number);return `${y}.${pad(m)}.${pad(d)}`};
  const fullDate=s=>{const d=new Date(s+'T00:00:00Z');return `${t.day(d.getUTCMonth()+1,d.getUTCDate())} ${t.fullWeekdays[d.getUTCDay()]}`};
  const duration=e=>Math.round((new Date(e.end+'T00:00:00Z')-new Date(e.start+'T00:00:00Z'))/86400000)+1;
  // Existing public links retain their full path/query/hash. On the isolated
  // preview host they open the operating destination instead of a missing clone.
  const eventHref=e=>new URL(e.href,'https://kvolleylab.com/').href;
  const datedMatches=(events,date)=>events.flatMap(e=>(e.matches||[]).filter(m=>m.date===date).map(m=>({event:e,match:m})));
  function calendarHref(v,y,m,date=null){
    const q=new URLSearchParams(location.search);
    q.set('view',v);q.set('year',y);
    v==='month'?q.set('month',m):q.delete('month');
    active==='all'?q.delete('category'):q.set('category',active);
    gender==='all'?q.delete('gender'):q.set('gender',gender);
    date?q.set('date',date):q.delete('date');q.delete('q');
    return `${location.pathname.split('/').pop()||'competition-calendar-cards-prototype.html'}?${q}`;
  }
  function syncUrl(){
    const url=new URL(calendarHref(view,year,month,view==='month'?selected:null),location.href);
    if(!explicitView)url.searchParams.delete('view');
    history.replaceState(null,'',url);
  }
  function syncViewSwitch(){
    document.querySelectorAll('.cc-view-switch a').forEach(a=>{
      a.classList.toggle('active',a.dataset.view===view);
      a.href=calendarHref(a.dataset.view,year,month);
      if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }
  function toolbar(){
    const entries=['all','men','women'];
    const missing=payload.events.filter(e=>!assignedGenders(e).length).length;
    const genderToolbar=genderMap?`<div class="cc-gender-toolbar"><div class="cc-gender-options" role="group" aria-label="${t.genderFilter}">${entries.map(g=>`<button type="button" class="cc-gender-option ${gender===g?'active':''}" data-gender="${g}" aria-pressed="${gender===g}">${t[g]}</button>`).join('')}</div><span class="cc-gender-explainer">${t.genderNote}${missing?t.unclassified(missing):''}</span></div>`:`<div class="cc-gender-toolbar cc-gender-unavailable" role="status">${t.genderMissing}</div>`;
    const items=[['all',null],['international','#2563eb'],['domestic','#16a34a'],['vleague','#7c3aed']];
    return `${genderToolbar}<div class="cc-toolbar"><div class="cc-toolbar-left"><div class="cc-year-nav"><a aria-label="${t.previousYear}" href="${calendarHref(view,year-1,month)}">‹</a><strong>${t.year(year)}</strong><a aria-label="${t.nextYear}" href="${calendarHref(view,year+1,month)}">›</a></div><a class="cc-today-btn" href="${calendarHref('month',todayYear,todayMonth,todayIso)}">${t.today}</a><button class="cc-share-btn" type="button" data-share>${t.share}</button></div><div class="cc-filters" role="group" aria-label="${t.categoryFilter}">${items.map(([id,color])=>`<button class="cc-filter ${active===id?'active':''}" data-filter="${id}" aria-pressed="${active===id}">${color?`<span class="cc-filter-dot" style="background:${color}"></span>`:''}${t[id]}</button>`).join('')}</div></div>`;
  }
  function monthShortcuts(m){
    return `<nav class="cc-month-shortcuts" aria-label="${t.monthJump}">${Array.from({length:12},(_,i)=>`<a href="${calendarHref('month',year,i+1)}" ${i+1===m?'aria-current="page"':''}>${t.month(i+1)}</a>`).join('')}</nav>`;
  }
  function dots(events){
    const categories=[...new Set(events.map(e=>e.category))];
    return `<span class="cc-card-dots" aria-hidden="true">${categories.map(c=>`<i style="--dot:${colorOf(c)}"></i>`).join('')}</span>`;
  }
  function grid(m,compact){
    const first=civil(year,m,1),offset=first.getUTCDay(),last=civil(year,m+1,0).getUTCDate();
    const cells=compact?42:Math.ceil((offset+last)/7)*7;
    const events=visibleEvents();
    let days='';
    for(let i=0;i<cells;i++){
      const d=civil(year,m,i-offset+1),date=iso(d),inMonth=d.getUTCMonth()+1===m&&d.getUTCFullYear()===year;
      if(compact&&!inMonth){days+='<span class="cc-card-day is-compact is-outside" aria-hidden="true"></span>';continue}
      const dayEvents=eventsAt(date,events),today=date===todayIso,isSelected=!compact&&date===selected;
      const cls=`cc-card-day ${compact?'is-compact':''} ${inMonth?'':'is-outside'} ${dayEvents.length?'has-events':''} ${today?'is-today':''} ${isSelected?'is-selected':''} ${i%7===0?'is-sunday':i%7===6?'is-saturday':''}`;
      const label=`${date} ${t.fullWeekdays[d.getUTCDay()]}${today?' · '+t.today:''} · ${t.count(dayEvents.length)}`;
      const body=`<span class="cc-card-day-number">${d.getUTCDate()}</span>${dayEvents.length?`<span class="cc-card-day-count">${t.count(dayEvents.length)}</span>${dots(dayEvents)}`:'<span class="cc-card-day-space" aria-hidden="true"></span>'}`;
      const attrs=`class="${cls}" data-date="${date}" data-event-count="${dayEvents.length}" aria-label="${esc(label)}"${today?' aria-current="date"':''}`;
      days+=compact||!inMonth?`<a ${attrs} href="${calendarHref('month',d.getUTCFullYear(),d.getUTCMonth()+1,date)}">${body}</a>`:`<button type="button" ${attrs} aria-pressed="${isSelected}" data-select-date="${date}">${body}</button>`;
    }
    return `<div class="cc-card-weekdays">${t.weekdays.map((s,i)=>`<span class="${i===0?'is-sunday':i===6?'is-saturday':''}">${s}</span>`).join('')}</div><div class="cc-card-grid ${compact?'is-compact':''}" data-calendar-month="${m}" data-start-weekday="0">${days}</div>`;
  }
  function miniCalendar(m){
    const events=monthEvents(m);
    return `<section class="cc-month-card cc-card-month" id="cc-month-${m}" data-month="${m}"><div class="cc-month-head"><a href="${calendarHref('month',year,m)}">${t.month(m)}</a><span>${t.count(events.length)}</span></div>${grid(m,true)}<a class="cc-card-month-foot" href="${calendarHref('month',year,m)}">${events.length?`${dots(events)}<span>${t.monthEvents}</span><span aria-hidden="true">↗</span>`:`<span>${t.noMonthEvents}</span>`}</a></section>`;
  }
  function eventCard(e,date){
    const status=statusOf(e),matches=date?datedMatches([e],date):[];
    return `<article class="cc-card-event" data-event-id="${esc(e.id)}" style="--event-color:${colorOf(e.category)}"><div class="cc-card-event-top"><span class="cc-card-category"><i></i>${esc(labelOf(e.category))}</span><span class="cc-card-status status-${status}">${t[status]}</span></div><a class="cc-card-event-link" href="${esc(eventHref(e))}"><h3>${esc(displayTitle(e))}</h3><span aria-hidden="true">↗</span></a><p class="cc-card-event-period">${formatDate(e.start)} – ${formatDate(e.end)} <span>· ${t.duration(duration(e))}</span></p><p class="cc-card-event-meta">${assignedGenders(e).length===2?t.joint:assignedGenders(e).map(g=>t[g]).join(' · ')}${e.location?' · '+esc(e.location):''}</p>${matches.length?`<div class="cc-card-confirmed"><strong>${t.matches(matches.length)}</strong>${matches.map(({match})=>`<p>${esc(match.time||'')} ${esc(match.teamA||'')} – ${esc(match.teamB||'')}</p>`).join('')}</div>`:''}<a class="cc-card-event-action${e.podiums?.length?' cc-focus-event':''}" href="${esc(eventHref(e))}">${e.podiums?.length?t.summary:t.details} <span aria-hidden="true">→</span></a></article>`;
  }
  function renderSelected(){
    const target=document.getElementById('ccSelectedDay');if(!target)return;
    const events=eventsAt(selected),matches=datedMatches(events,selected);
    target.innerHTML=`<div class="cc-card-agenda-head"><div><span class="cc-card-caption">${t.selectedDay}</span><h2>${fullDate(selected)}</h2></div><strong>${t.count(events.length)}</strong></div><p class="cc-card-note">${t.periodNote}</p>${matches.length?`<p class="cc-card-match-note">${t.matches(matches.length)} · ${t.matchNote}</p>`:''}<div class="cc-card-event-list">${events.length?events.map(e=>eventCard(e,selected)).join(''):`<p class="cc-card-empty">${t.noDayEvents}</p>`}</div>`;
  }
  function render(){
    controls.innerHTML=toolbar();
    if(view==='year'){
      root.innerHTML=`${monthShortcuts(0)}<p class="cc-card-guide">${t.yearHint}<span>${t.periodNote}</span></p><div class="cc-year-grid">${Array.from({length:12},(_,i)=>miniCalendar(i+1)).join('')}</div>`;
    }else{
      const events=monthEvents(month),monthPrefix=`${year}-${pad(month)}-`;
      if(!selected?.startsWith(monthPrefix))selected=todayIso.startsWith(monthPrefix)?todayIso:events[0]?events[0].start<iso(civil(year,month,1))?iso(civil(year,month,1)):events[0].start:iso(civil(year,month,1));
      const prev=civil(year,month-1,1),next=civil(year,month+1,1);
      root.innerHTML=`${monthShortcuts(month)}<div class="cc-month-layout"><section class="cc-card-monthly" aria-label="${t.yearMonth(year,month)}"><header class="cc-card-monthly-head"><div><p>${t.monthEvents} <span>${t.count(events.length)}</span></p><h2>${t.yearMonth(year,month)}</h2></div><nav aria-label="${t.monthJump}"><a aria-label="${t.previousMonth}" href="${calendarHref('month',prev.getUTCFullYear(),prev.getUTCMonth()+1)}">‹</a><a aria-label="${t.nextMonth}" href="${calendarHref('month',next.getUTCFullYear(),next.getUTCMonth()+1)}">›</a></nav></header>${grid(month,false)}<footer class="cc-card-monthly-foot"><p>${t.dayHint}</p><span class="cc-card-key"><i class="today-key"></i>${t.today}<i class="selected-key"></i>${t.selected}</span></footer></section></div><section class="cc-card-agenda" id="ccSelectedDay" aria-label="${t.daySchedule}" aria-live="polite"></section><details class="cc-card-all-events"><summary>${t.allMonth}<span>${t.count(events.length)}</span></summary><div class="cc-card-event-list">${events.length?events.map(e=>eventCard(e)).join(''):`<p class="cc-card-empty">${t.noMonthEvents}</p>`}</div></details>`;
      renderSelected();
    }
    bind();syncUrl();syncViewSwitch();
  }
  function bind(){
    controls.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{active=b.dataset.filter;render()});
    controls.querySelectorAll('[data-gender]').forEach(b=>b.onclick=()=>{gender=b.dataset.gender;render()});
    root.querySelectorAll('[data-select-date]').forEach(b=>b.onclick=()=>{
      selected=b.dataset.selectDate;
      root.querySelectorAll('[data-select-date]').forEach(d=>{const yes=d.dataset.selectDate===selected;d.classList.toggle('is-selected',yes);d.setAttribute('aria-pressed',String(yes))});
      renderSelected();syncUrl();
    });
    const share=controls.querySelector('[data-share]');
    share.onclick=async()=>{syncUrl();try{await navigator.clipboard.writeText(location.href);share.textContent=t.copied;setTimeout(()=>share.textContent=t.share,1400)}catch{prompt(t.copyPrompt,location.href)}};
  }
  if(!explicitView)window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const v=responsiveView();if(v!==view&&payload){view=v;render()}},160)});
  const readJson=async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('calendar data');return r.json()};
  Promise.all([
    readJson(`data/calendar/${year}-competition-periods.json?v=20260921-world-events-1`),
    readJson(`data/calendar/${year}-competition-genders.json?v=20261019-genders-v1`).catch(()=>null)
  ]).then(([data,map])=>{
    if(!Array.isArray(data.events)||!Array.isArray(data.categories))throw Error('calendar schema');
    payload=data;
    genderMap=map?.schema==='calendar-genders-v1'&&map.year===year&&map.events?map:null;
    if(!genderMap)gender='all';render();
  }).catch(()=>{
    controls.innerHTML='';root.innerHTML=`<div class="cc-data-error"><strong>${t.dataMissing(year)}</strong><a href="${calendarHref('year',2026,1)}">${t.back2026}</a></div>`;syncViewSwitch();
  });
})();

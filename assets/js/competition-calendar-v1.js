(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;

  const params=new URLSearchParams(location.search);
  const year=Number(params.get('year')||2026);
  const month=Number(params.get('month')||new Date().getMonth()+1);
  const view=params.get('view')||'month';
  let active=params.get('category')||'all';
  let searchTerm=(params.get('q')||'').trim();
  let payload=null;

  const pad=n=>String(n).padStart(2,'0');
  const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
  const now=new Date();
  const todayYear=now.getFullYear();
  const todayMonth=now.getMonth()+1;
  const todayIso=iso(todayYear,todayMonth,now.getDate());
  const fmt=d=>{const x=new Date(`${d}T00:00:00`);return `${x.getMonth()+1}.${x.getDate()}`};
  const colorOf=c=>payload?.categories.find(x=>x.id===c)?.color||'#64748b';
  const labelOf=c=>payload?.categories.find(x=>x.id===c)?.label||'대회';
  const overlaps=(e,y,m)=>e.start<=iso(y,m,new Date(y,m,0).getDate())&&e.end>=iso(y,m,1);
  const mondayOffset=(y,m)=>{const day=new Date(y,m-1,1).getDay();return day===0?6:day-1};
  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalizedSearch=()=>searchTerm.trim().toLowerCase();
  const matchesSearch=e=>{
    const q=normalizedSearch();
    if(!q)return true;
    return [e.title,e.short_title,e.competition_id,labelOf(e.category)].some(v=>String(v||'').toLowerCase().includes(q));
  };
  const visibleEvents=()=>payload.events.filter(e=>(active==='all'||e.category===active)&&matchesSearch(e));
  const categoryQuery=()=>active==='all'?'':`&category=${encodeURIComponent(active)}`;
  const searchQuery=()=>searchTerm?`&q=${encodeURIComponent(searchTerm)}`:'';
  const calendarHref=(v,y,m)=>`competition-calendar.html?view=${v}&year=${y}${v==='month'?`&month=${m}`:''}${categoryQuery()}${searchQuery()}`;
  const statusOf=e=>e.start<=todayIso&&e.end>=todayIso?{id:'live',label:'진행 중',rank:0}:e.start>todayIso?{id:'upcoming',label:'예정',rank:1}:{id:'ended',label:'종료',rank:2};
  const statusSort=(a,b)=>statusOf(a).rank-statusOf(b).rank||a.start.localeCompare(b.start);

  function syncUrl(){
    const url=new URL(location.href);
    url.searchParams.set('view',view);
    url.searchParams.set('year',year);
    if(view==='month')url.searchParams.set('month',month);else url.searchParams.delete('month');
    active==='all'?url.searchParams.delete('category'):url.searchParams.set('category',active);
    searchTerm?url.searchParams.set('q',searchTerm):url.searchParams.delete('q');
    history.replaceState(null,'',url);
  }

  function syncViewSwitch(){
    document.querySelectorAll('.cc-view-switch a').forEach(a=>a.classList.toggle('active',a.dataset.view===view));
    const yearLink=document.querySelector('.cc-view-switch [data-view="year"]');
    const monthLink=document.querySelector('.cc-view-switch [data-view="month"]');
    if(yearLink)yearLink.href=calendarHref('year',year,month);
    if(monthLink)monthLink.href=calendarHref('month',year,month);
  }

  function filters(){
    return `<div class="cc-filters"><button class="cc-filter ${active==='all'?'active':''}" data-filter="all">전체</button>${payload.categories.map(c=>`<button class="cc-filter ${active===c.id?'active':''}" data-filter="${c.id}"><span class="cc-filter-dot" style="background:${c.color}"></span>${c.label}</button>`).join('')}</div>`;
  }

  function searchBox(){
    return `<div class="cc-search-row"><label class="cc-search-label" for="competitionSearch">대회 검색</label><div class="cc-search-field"><input id="competitionSearch" type="search" value="${esc(searchTerm)}" placeholder="예: VNL, AVC, 대학리그" autocomplete="off" data-search><button type="button" data-search-clear ${searchTerm?'':'hidden'}>지우기</button></div><span class="cc-search-help">대회명을 입력하면 달력과 오른쪽 목록이 함께 검색됩니다.</span></div>`;
  }

  function toolbar(){
    const todayHref=calendarHref('month',todayYear,todayMonth);
    return `<div class="cc-toolbar"><div class="cc-toolbar-left"><div class="cc-year-nav"><a href="${calendarHref(view,year-1,month)}">‹</a><strong>${year}년</strong><a href="${calendarHref(view,year+1,month)}">›</a></div><a class="cc-today-btn" href="${todayHref}">오늘</a><button class="cc-share-btn" type="button" data-share>링크 복사</button></div>${filters()}</div>${searchBox()}`;
  }

  function monthShortcuts(m){
    return `<nav class="cc-month-shortcuts" aria-label="월 바로가기">${Array.from({length:12},(_,i)=>{const n=i+1;return `<a href="${calendarHref('month',year,n)}" aria-current="${n===m?'page':'false'}">${n}월</a>`}).join('')}</nav>`;
  }

  function focusEvent(m){
    const events=visibleEvents().filter(e=>overlaps(e,year,m)).sort(statusSort);
    if(!events.length)return '';
    const current=year===todayYear&&m===todayMonth;
    let event,label;
    if(current){
      event=events.find(e=>e.start<=todayIso&&e.end>=todayIso);
      if(event)label='진행 중인 대회';
      else{
        event=events.find(e=>e.start>todayIso);
        label=event?'다음 대회':'이번 달 마지막 대회';
        if(!event)event=events.at(-1);
      }
    }else{
      event=events.slice().sort((a,b)=>a.start.localeCompare(b.start))[0];
      label='이달 첫 대회';
    }
    return `<a class="cc-focus-event" href="${event.href}" style="--focus-color:${colorOf(event.category)}"><span class="cc-focus-label">${label}</span><span class="cc-focus-main"><strong>${esc(event.title)}</strong><em>${fmt(event.start)} ~ ${fmt(event.end)}</em></span><span class="cc-focus-action">일정 보기 →</span></a>`;
  }

  function segmentsForMonth(events,m){
    const offset=mondayOffset(year,m),last=new Date(year,m,0).getDate(),monthStart=iso(year,m,1),monthEnd=iso(year,m,last),byWeek=Array.from({length:6},()=>[]);
    events.forEach(e=>{
      const start=e.start<monthStart?1:Number(e.start.slice(8)),end=e.end>monthEnd?last:Number(e.end.slice(8));
      let cursor=start;
      while(cursor<=end){
        const cellIndex=offset+cursor-1,week=Math.floor(cellIndex/7),col=cellIndex%7,span=Math.min(7-col,end-cursor+1);
        byWeek[week].push({event:e,startCol:col+1,endCol:col+span});
        cursor+=span;
      }
    });
    return byWeek.map(items=>{
      const laneEnds=[];
      return items.sort((a,b)=>a.startCol-b.startCol||(b.endCol-b.startCol)-(a.endCol-a.startCol)).map(item=>{
        let lane=laneEnds.findIndex(end=>end<item.startCol);
        if(lane<0){lane=laneEnds.length;laneEnds.push(item.endCol)}else laneEnds[lane]=item.endCol;
        return {...item,lane};
      });
    });
  }

  function eventLink(event,compact,startCol,endCol,lane){
    const cls=compact?'cc-period-bar':'cc-big-period',title=esc(event.short_title||event.title),status=statusOf(event);
    const tooltip=`<span class="cc-event-tooltip"><span class="cc-tooltip-head"><strong>${esc(event.title)}</strong><span class="cc-tooltip-date">${fmt(event.start)} ~ ${fmt(event.end)}</span></span><em>${status.label} · ${esc(labelOf(event.category))} · 클릭하여 대회 일정 보기</em></span>`;
    return `<a class="${cls} status-${status.id}" href="${event.href}" aria-label="${esc(event.title)} ${fmt(event.start)}부터 ${fmt(event.end)}까지" style="--event-color:${colorOf(event.category)};--start:${startCol};--span:${endCol-startCol+1};--lane:${lane}"><span class="cc-period-title">${title}</span>${tooltip}</a>`;
  }

  function calendarGrid(m,compact=true){
    const offset=mondayOffset(year,m),last=new Date(year,m,0).getDate(),events=visibleEvents().filter(e=>overlaps(e,year,m)).sort((a,b)=>a.start.localeCompare(b.start)),weekSegments=segmentsForMonth(events,m);
    let weeks='';
    for(let w=0;w<6;w++){
      const placed=weekSegments[w],lanes=Math.max(1,...placed.map(x=>x.lane+1));
      let days='';
      for(let c=0;c<7;c++){
        const d=w*7+c-offset+1,valid=d>=1&&d<=last,date=valid?iso(year,m,d):'';
        days+=`<div class="${compact?'cc-date-cell':'cc-big-date-cell'} ${valid?'':'empty'} ${date===todayIso?'today':''}"><span>${valid?d:''}</span></div>`;
      }
      const bars=placed.map(({event,startCol,endCol,lane})=>eventLink(event,compact,startCol,endCol,lane)).join('');
      weeks+=`<div class="${compact?'cc-calendar-week':'cc-big-calendar-week'}" style="--lanes:${lanes}"><div class="${compact?'cc-calendar-days':'cc-big-calendar-days'}">${days}</div>${bars}</div>`;
    }
    return `<div class="${compact?'cc-calendar-layer':'cc-big-calendar-layer'}">${weeks}</div>`;
  }

  function emptySearchMessage(){
    return `<div class="cc-search-empty"><strong>검색 결과가 없습니다.</strong><span>다른 대회명이나 카테고리를 확인해 주세요.</span><button type="button" data-reset-search>검색 초기화</button></div>`;
  }

  function miniCalendar(m){
    const events=visibleEvents().filter(e=>overlaps(e,year,m));
    return `<section class="cc-month-card"><div class="cc-month-head"><a href="${calendarHref('month',year,m)}">${m}월</a><span>${events.length}개 대회</span></div><div class="cc-weekdays">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div>${calendarGrid(m,true)}</section>`;
  }

  function renderYear(){
    const events=visibleEvents();
    root.innerHTML=`${toolbar()}${monthShortcuts(0)}${events.length?`<div class="cc-year-grid">${Array.from({length:12},(_,i)=>miniCalendar(i+1)).join('')}</div>`:emptySearchMessage()}`;
    bind();syncUrl();syncViewSwitch();
  }

  function renderMonth(){
    const m=Math.min(12,Math.max(1,month));
    const events=visibleEvents().filter(e=>overlaps(e,year,m)).sort(statusSort);
    const prev=m===1?{y:year-1,m:12}:{y:year,m:m-1};
    const next=m===12?{y:year+1,m:1}:{y:year,m:m+1};
    const agenda=events.map(e=>{
      const status=statusOf(e);
      return `<a class="cc-agenda-item status-${status.id}" style="--event-color:${colorOf(e.category)}" href="${e.href}"><span class="cc-agenda-top"><span class="cc-agenda-category">${esc(labelOf(e.category))}</span><span class="cc-status-badge">${status.label}</span></span><strong>${esc(e.title)}</strong><span>${fmt(e.start)} ~ ${fmt(e.end)}</span><em>대회 일정 보기 →</em></a>`;
    }).join('');
    root.innerHTML=`${toolbar()}${monthShortcuts(m)}<div class="cc-month-navigation"><a href="${calendarHref('month',prev.y,prev.m)}">‹</a><div><strong>${year}년 ${m}월</strong><span>날짜 아래의 대회 기간을 선택하면 해당 대회 일정으로 이동합니다.</span></div><a href="${calendarHref('month',next.y,next.m)}">›</a></div>${focusEvent(m)}${events.length?`<div class="cc-month-layout"><section class="cc-big-calendar"><div class="cc-big-weekdays">${['월','화','수','목','금','토','일'].map((x,i)=>`<div class="${i===5?'sat':i===6?'sun':''}">${x}</div>`).join('')}</div>${calendarGrid(m,false)}</section><aside class="cc-agenda"><h2>${m}월 대회 일정 <span>${events.length}</span></h2><div class="cc-agenda-list">${agenda}</div></aside></div>`:emptySearchMessage()}`;
    bind();syncUrl();syncViewSwitch();
  }

  function rerender(){view==='year'?renderYear():renderMonth()}

  function bind(){
    root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{active=b.dataset.filter;rerender()});
    const search=root.querySelector('[data-search]');
    if(search){
      search.oninput=()=>{
        searchTerm=search.value;
        const position=search.selectionStart||searchTerm.length;
        rerender();
        const next=root.querySelector('[data-search]');
        if(next){next.focus();next.setSelectionRange(position,position)}
      };
    }
    root.querySelectorAll('[data-search-clear],[data-reset-search]').forEach(b=>b.onclick=()=>{searchTerm='';rerender()});
    const share=root.querySelector('[data-share]');
    if(share)share.onclick=async()=>{syncUrl();try{await navigator.clipboard.writeText(location.href);share.textContent='복사 완료';setTimeout(()=>share.textContent='링크 복사',1400)}catch{prompt('아래 주소를 복사하세요.',location.href)}};
  }

  fetch(`data/calendar/${year}-competition-periods.json?v=20260722-13`,{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('calendar');return r.json()})
    .then(data=>{payload=data;if(active!=='all'&&!payload.categories.some(c=>c.id===active))active='all';rerender()})
    .catch(()=>{root.innerHTML=`<div class="cc-data-error"><strong>${year}년 대회 일정 데이터가 없습니다.</strong><span>등록된 연도로 이동하거나 오늘 버튼을 눌러 현재 달력으로 돌아가세요.</span><a href="${calendarHref('month',todayYear,todayMonth)}">오늘 달력 보기</a></div>`;syncViewSwitch()});
})();
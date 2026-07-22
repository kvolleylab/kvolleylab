(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;
  const params=new URLSearchParams(location.search);
  const year=Number(params.get('year')||2026);
  const month=Number(params.get('month')||new Date().getMonth()+1);
  const view=params.get('view')||'month';
  let active='all';
  let payload=null;

  const pad=n=>String(n).padStart(2,'0');
  const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
  const now=new Date();
  const todayIso=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
  const fmt=d=>{const x=new Date(`${d}T00:00:00`);return `${x.getMonth()+1}.${x.getDate()}`};
  const colorOf=category=>payload?.categories.find(x=>x.id===category)?.color||'#64748b';
  const labelOf=category=>payload?.categories.find(x=>x.id===category)?.label||'대회';
  const overlaps=(e,y,m)=>e.start<=iso(y,m,new Date(y,m,0).getDate())&&e.end>=iso(y,m,1);
  const visibleEvents=()=>payload.events.filter(e=>active==='all'||e.category===active);
  const mondayOffset=(y,m)=>{const day=new Date(y,m-1,1).getDay();return day===0?6:day-1};
  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function filters(){
    return `<div class="cc-filters"><button class="cc-filter ${active==='all'?'active':''}" data-filter="all">전체</button>${payload.categories.map(c=>`<button class="cc-filter ${active===c.id?'active':''}" data-filter="${c.id}"><span class="cc-filter-dot" style="background:${c.color}"></span>${c.label}</button>`).join('')}</div>`;
  }

  function toolbar(){
    return `<div class="cc-toolbar"><div class="cc-year-nav"><a href="competition-calendar.html?view=${view}&year=${year-1}&month=${month}">‹</a><strong>${year}년</strong><a href="competition-calendar.html?view=${view}&year=${year+1}&month=${month}">›</a></div>${filters()}</div>`;
  }

  function monthSummary(m){
    const allMonthEvents=payload.events.filter(e=>overlaps(e,year,m));
    const visible=visibleEvents().filter(e=>overlaps(e,year,m));
    const cards=payload.categories.map(c=>{
      const count=allMonthEvents.filter(e=>e.category===c.id).length;
      return `<button class="cc-summary-card ${active===c.id?'active':''}" data-filter="${c.id}" style="--summary-color:${c.color}"><span class="cc-summary-dot"></span><span><strong>${c.label}</strong><em>${count}개 대회</em></span></button>`;
    }).join('');
    return `<section class="cc-summary"><button class="cc-summary-card total ${active==='all'?'active':''}" data-filter="all"><span><strong>전체 일정</strong><em>${visible.length}개 대회</em></span></button>${cards}</section>`;
  }

  function focusEvent(m){
    const events=visibleEvents().filter(e=>overlaps(e,year,m)).sort((a,b)=>a.start.localeCompare(b.start));
    if(!events.length)return '';
    const isCurrentMonth=year===now.getFullYear()&&m===now.getMonth()+1;
    let event,label;
    if(isCurrentMonth){
      event=events.find(e=>e.start<=todayIso&&e.end>=todayIso);
      if(event)label='진행 중인 대회';
      else{
        event=events.find(e=>e.start>todayIso);
        label=event?'다음 대회':'이번 달 마지막 대회';
        if(!event)event=events[events.length-1];
      }
    }else{
      event=events[0];
      label='이달 첫 대회';
    }
    return `<a class="cc-focus-event" href="${event.href}" style="--focus-color:${colorOf(event.category)}"><span class="cc-focus-label">${label}</span><span class="cc-focus-main"><strong>${esc(event.title)}</strong><em>${fmt(event.start)} ~ ${fmt(event.end)}</em></span><span class="cc-focus-action">일정 보기 →</span></a>`;
  }

  function segmentsForMonth(events,m){
    const offset=mondayOffset(year,m),last=new Date(year,m,0).getDate(),monthStart=iso(year,m,1),monthEnd=iso(year,m,last);
    const byWeek=Array.from({length:6},()=>[]);
    events.forEach(e=>{
      const start=e.start<monthStart?1:Number(e.start.slice(8));
      const end=e.end>monthEnd?last:Number(e.end.slice(8));
      let cursor=start;
      while(cursor<=end){
        const cellIndex=offset+cursor-1;
        const week=Math.floor(cellIndex/7);
        const col=cellIndex%7;
        const span=Math.min(7-col,end-cursor+1);
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
    const cls=compact?'cc-period-bar':'cc-big-period';
    const title=esc(event.short_title||event.title);
    const tooltip=`<span class="cc-event-tooltip"><span class="cc-tooltip-head"><strong>${esc(event.title)}</strong><span class="cc-tooltip-date">${fmt(event.start)} ~ ${fmt(event.end)}</span></span><em>${esc(labelOf(event.category))} · 클릭하여 대회 일정 보기</em></span>`;
    return `<a class="${cls}" href="${event.href}" aria-label="${esc(event.title)} ${fmt(event.start)}부터 ${fmt(event.end)}까지" style="--event-color:${colorOf(event.category)};--start:${startCol};--span:${endCol-startCol+1};--lane:${lane}"><span class="cc-period-title">${title}</span>${tooltip}</a>`;
  }

  function calendarGrid(m,compact=true){
    const offset=mondayOffset(year,m),last=new Date(year,m,0).getDate(),events=visibleEvents().filter(e=>overlaps(e,year,m)).sort((a,b)=>a.start.localeCompare(b.start));
    const weekSegments=segmentsForMonth(events,m);
    let weeks='';
    for(let w=0;w<6;w++){
      const placed=weekSegments[w],lanes=Math.max(1,...placed.map(x=>x.lane+1));
      let days='';
      for(let c=0;c<7;c++){
        const d=w*7+c-offset+1,valid=d>=1&&d<=last;
        const date=valid?iso(year,m,d):'';
        days+=`<div class="${compact?'cc-date-cell':'cc-big-date-cell'} ${valid?'':'empty'} ${date===todayIso?'today':''}"><span>${valid?d:''}</span></div>`;
      }
      const bars=placed.map(({event,startCol,endCol,lane})=>eventLink(event,compact,startCol,endCol,lane)).join('');
      weeks+=`<div class="${compact?'cc-calendar-week':'cc-big-calendar-week'}" style="--lanes:${lanes}"><div class="${compact?'cc-calendar-days':'cc-big-calendar-days'}">${days}</div>${bars}</div>`;
    }
    return `<div class="${compact?'cc-calendar-layer':'cc-big-calendar-layer'}">${weeks}</div>`;
  }

  function miniCalendar(m){
    const events=visibleEvents().filter(e=>overlaps(e,year,m));
    return `<section class="cc-month-card"><div class="cc-month-head"><a href="competition-calendar.html?view=month&year=${year}&month=${m}">${m}월</a><span>${events.length}개 대회</span></div><div class="cc-weekdays">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div>${calendarGrid(m,true)}</section>`;
  }

  function renderYear(){
    root.innerHTML=`${toolbar()}<div class="cc-year-grid">${Array.from({length:12},(_,i)=>miniCalendar(i+1)).join('')}</div>`;
    bind();
  }

  function renderMonth(){
    const m=Math.min(12,Math.max(1,month));
    const events=visibleEvents().filter(e=>overlaps(e,year,m)).sort((a,b)=>a.start.localeCompare(b.start));
    const prev=m===1?{y:year-1,m:12}:{y:year,m:m-1};
    const next=m===12?{y:year+1,m:1}:{y:year,m:m+1};
    const agenda=events.map(e=>`<a class="cc-agenda-item" style="--event-color:${colorOf(e.category)}" href="${e.href}"><span class="cc-agenda-category">${esc(labelOf(e.category))}</span><strong>${esc(e.title)}</strong><span>${fmt(e.start)} ~ ${fmt(e.end)}</span><em>대회 일정 보기 →</em></a>`).join('');
    root.innerHTML=`${toolbar()}<div class="cc-month-navigation"><a href="competition-calendar.html?view=month&year=${prev.y}&month=${prev.m}">‹</a><div><strong>${year}년 ${m}월</strong><span>날짜 아래의 대회 기간을 선택하면 해당 대회 일정으로 이동합니다.</span></div><a href="competition-calendar.html?view=month&year=${next.y}&month=${next.m}">›</a></div>${focusEvent(m)}${monthSummary(m)}<div class="cc-month-layout"><section class="cc-big-calendar"><div class="cc-big-weekdays">${['월','화','수','목','금','토','일'].map((x,i)=>`<div class="${i===5?'sat':i===6?'sun':''}">${x}</div>`).join('')}</div>${calendarGrid(m,false)}</section><aside class="cc-agenda"><h2>${m}월 대회 일정 <span>${events.length}</span></h2><div class="cc-agenda-list">${agenda||'<div class="cc-empty">등록된 대회 일정이 없습니다.</div>'}</div></aside></div>`;
    bind();
  }

  function bind(){
    root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
      active=b.dataset.filter;
      view==='year'?renderYear():renderMonth();
    });
  }

  fetch(`data/calendar/${year}-competition-periods.json?v=20260722-7`,{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('calendar');return r.json()})
    .then(data=>{payload=data;view==='year'?renderYear():renderMonth()})
    .catch(()=>{root.innerHTML='<div class="cc-empty">대회 달력 데이터를 불러오지 못했습니다.</div>'});
})();
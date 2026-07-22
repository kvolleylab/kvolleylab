(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;
  const params=new URLSearchParams(location.search);
  const year=Number(params.get('year')||2026);
  const month=Number(params.get('month')||0);
  const view=params.get('view')||(month?'month':'year');
  let active='all';
  let payload=null;

  const pad=n=>String(n).padStart(2,'0');
  const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
  const fmt=d=>{const x=new Date(`${d}T00:00:00`);return `${x.getMonth()+1}.${x.getDate()}`};
  const colorOf=category=>payload?.categories.find(x=>x.id===category)?.color||'#64748b';
  const overlaps=(e,y,m)=>e.start<=iso(y,m,new Date(y,m,0).getDate())&&e.end>=iso(y,m,1);
  const visibleEvents=()=>payload.events.filter(e=>active==='all'||e.category===active);
  const mondayOffset=(y,m)=>{const day=new Date(y,m-1,1).getDay();return day===0?6:day-1};

  function filters(){return `<div class="cc-filters"><button class="cc-filter ${active==='all'?'active':''}" data-filter="all">전체</button>${payload.categories.map(c=>`<button class="cc-filter ${active===c.id?'active':''}" data-filter="${c.id}"><span class="cc-filter-dot" style="background:${c.color}"></span>${c.label}</button>`).join('')}</div>`}
  function toolbar(){return `<div class="cc-toolbar"><div class="cc-year-nav"><a href="competition-calendar.html?year=${year-1}">‹</a><strong>${year}년</strong><a href="competition-calendar.html?year=${year+1}">›</a></div>${filters()}</div>`}

  function eventSegments(events,m,compact=true){
    const offset=mondayOffset(year,m),last=new Date(year,m,0).getDate(),monthStart=iso(year,m,1),monthEnd=iso(year,m,last);
    const segments=[];
    events.forEach((e,eventIndex)=>{
      const start=e.start<monthStart?1:Number(e.start.slice(8));
      const end=e.end>monthEnd?last:Number(e.end.slice(8));
      let cursor=start;
      while(cursor<=end){
        const cellIndex=offset+cursor-1;
        const week=Math.floor(cellIndex/7);
        const col=cellIndex%7;
        const remain=7-col;
        const span=Math.min(remain,end-cursor+1);
        segments.push(`<a class="${compact?'cc-period-bar':'cc-big-period'}" href="${e.href}" title="${e.title} · ${fmt(e.start)}~${fmt(e.end)}" style="--event-color:${colorOf(e.category)};grid-column:${col+1}/span ${span};grid-row:${week+1};--lane:${eventIndex%3}"><span>${e.short_title||e.title}</span></a>`);
        cursor+=span;
      }
    });
    return segments.join('');
  }

  function calendarGrid(m,compact=true){
    const offset=mondayOffset(year,m),last=new Date(year,m,0).getDate(),events=visibleEvents().filter(e=>overlaps(e,year,m));
    let cells='';
    for(let i=0;i<42;i++){
      const d=i-offset+1;
      const valid=d>=1&&d<=last;
      cells+=`<div class="${compact?'cc-date-cell':'cc-big-date-cell'} ${valid?'':'empty'}" style="grid-column:${i%7+1};grid-row:${Math.floor(i/7)+1}">${valid?`<span>${d}</span>`:''}</div>`;
    }
    return `<div class="${compact?'cc-calendar-layer':'cc-big-calendar-layer'}">${cells}${eventSegments(events,m,compact)}</div>`;
  }

  function miniCalendar(m){
    const events=visibleEvents().filter(e=>overlaps(e,year,m));
    return `<section class="cc-month-card"><div class="cc-month-head"><a href="competition-calendar.html?view=month&year=${year}&month=${m}">${m}월</a><span>${events.length}개 대회</span></div><div class="cc-weekdays">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div>${calendarGrid(m,true)}</section>`;
  }

  function renderYear(){root.innerHTML=`${toolbar()}<div class="cc-year-grid">${Array.from({length:12},(_,i)=>miniCalendar(i+1)).join('')}</div>`;bind()}
  function renderMonth(){
    const m=Math.min(12,Math.max(1,month||new Date().getMonth()+1)),events=visibleEvents().filter(e=>overlaps(e,year,m));
    const agenda=events.map(e=>`<a class="cc-agenda-item" style="--event-color:${colorOf(e.category)}" href="${e.href}"><strong>${e.title}</strong><span>${e.start} ~ ${e.end}</span></a>`).join('');
    root.innerHTML=`${toolbar()}<div class="cc-month-layout"><section class="cc-big-calendar"><div class="cc-big-head"><a href="competition-calendar.html?year=${year}">← 연간 보기</a><strong>${year}년 ${m}월</strong></div><div class="cc-big-weekdays">${['월','화','수','목','금','토','일'].map(x=>`<div>${x}</div>`).join('')}</div>${calendarGrid(m,false)}</section><aside class="cc-agenda"><h2>${m}월 대회 일정</h2><div class="cc-agenda-list">${agenda||'<div class="cc-empty">등록된 대회 일정이 없습니다.</div>'}</div></aside></div>`;
    bind();
  }
  function bind(){root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{active=b.dataset.filter;view==='month'?renderMonth():renderYear()})}

  fetch(`data/calendar/${year}-competition-periods.json?v=20260722-2`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('calendar');return r.json()}).then(data=>{payload=data;view==='month'?renderMonth():renderYear()}).catch(()=>{root.innerHTML='<div class="cc-empty">대회 달력 데이터를 불러오지 못했습니다.</div>'});
})();

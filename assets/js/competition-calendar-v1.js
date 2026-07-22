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
  const eventDays=(e,y,m)=>{const days=[];const last=new Date(y,m,0).getDate();for(let d=1;d<=last;d++){const date=iso(y,m,d);if(date>=e.start&&date<=e.end)days.push(d)}return days};
  const visibleEvents=()=>payload.events.filter(e=>active==='all'||e.category===active);

  function filters(){return `<div class="cc-filters"><button class="cc-filter ${active==='all'?'active':''}" data-filter="all">전체</button>${payload.categories.map(c=>`<button class="cc-filter ${active===c.id?'active':''}" data-filter="${c.id}"><span class="cc-filter-dot" style="background:${c.color}"></span>${c.label}</button>`).join('')}</div>`}
  function toolbar(){return `<div class="cc-toolbar"><div class="cc-year-nav"><a href="competition-calendar.html?year=${year-1}">‹</a><strong>${year}년</strong><a href="competition-calendar.html?year=${year+1}">›</a></div>${filters()}</div>`}
  function miniCalendar(m){const first=new Date(year,m-1,1).getDay(),offset=first===0?6:first-1,last=new Date(year,m,0).getDate(),events=visibleEvents().filter(e=>overlaps(e,year,m));let cells='';for(let i=0;i<offset;i++)cells+='<div class="cc-day empty"></div>';for(let d=1;d<=last;d++){const date=iso(year,m,d),hits=events.filter(e=>date>=e.start&&date<=e.end);cells+=`<div class="cc-day ${hits.length?'has-event':''}">${d}${hits.length?`<div class="cc-day-markers">${hits.slice(0,4).map(e=>`<span class="cc-day-marker" style="background:${colorOf(e.category)}"></span>`).join('')}</div>`:''}</div>`}const rows=events.map(e=>`<a class="cc-event" style="--event-color:${colorOf(e.category)}" href="${e.href}"><strong>${e.short_title||e.title}</strong><span>${fmt(e.start)} ~ ${fmt(e.end)}</span></a>`).join('');return `<section class="cc-month-card"><div class="cc-month-head"><a href="competition-calendar.html?view=month&year=${year}&month=${m}">${m}월</a><span>${events.length}개 대회 일정</span></div><div class="cc-weekdays">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cc-days">${cells}</div><div class="cc-month-events">${rows||'<div class="cc-empty">등록된 대회 일정 없음</div>'}</div></section>`}
  function renderYear(){root.innerHTML=`${toolbar()}<div class="cc-year-grid">${Array.from({length:12},(_,i)=>miniCalendar(i+1)).join('')}</div>`;bind()}
  function renderMonth(){const m=Math.min(12,Math.max(1,month||new Date().getMonth()+1)),first=new Date(year,m-1,1).getDay(),offset=first===0?6:first-1,last=new Date(year,m,0).getDate(),events=visibleEvents().filter(e=>overlaps(e,year,m));let cells='';for(let i=0;i<offset;i++)cells+='<div class="cc-big-day empty"></div>';for(let d=1;d<=last;d++){const date=iso(year,m,d),hits=events.filter(e=>date>=e.start&&date<=e.end);cells+=`<div class="cc-big-day"><div class="cc-big-daynum">${d}</div>${hits.map(e=>`<a class="cc-big-event" style="--event-color:${colorOf(e.category)}" href="${e.href}" title="${e.title}">${e.short_title||e.title}</a>`).join('')}</div>`}const agenda=events.map(e=>`<a class="cc-agenda-item" style="--event-color:${colorOf(e.category)}" href="${e.href}"><strong>${e.title}</strong><span>${e.start} ~ ${e.end}</span></a>`).join('');root.innerHTML=`${toolbar()}<div class="cc-month-layout"><section class="cc-big-calendar"><div class="cc-big-head">${year}년 ${m}월</div><div class="cc-big-grid">${['월','화','수','목','금','토','일'].map(x=>`<div class="cc-big-weekday">${x}</div>`).join('')}${cells}</div></section><aside class="cc-agenda"><h2>${m}월 대회 일정</h2><div class="cc-agenda-list">${agenda||'<div class="cc-empty">등록된 대회 일정이 없습니다.</div>'}</div></aside></div>`;bind()}
  function bind(){root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{active=b.dataset.filter;view==='month'?renderMonth():renderYear()})}

  fetch(`data/calendar/${year}-competition-periods.json?v=20260722-1`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('calendar');return r.json()}).then(data=>{payload=data;view==='month'?renderMonth():renderYear()}).catch(()=>{root.innerHTML='<div class="cc-empty">대회 달력 데이터를 불러오지 못했습니다.</div>'});
})();

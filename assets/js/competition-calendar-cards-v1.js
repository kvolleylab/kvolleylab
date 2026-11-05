/* KVL competition calendar · November 2026
 * Combines annual records with verified tournament and cross-year season periods.
 * Sunday-first civil dates; date-level match counts require dated match records.
 */
(()=>{
  const root=document.getElementById('competitionCalendar');
  const controls=document.getElementById('competitionCalendarControls');
  if(!root||!controls)return;
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
    periodNote:'대회 기간 기준이며, 모든 날짜에 경기가 열리는 것은 아닙니다.',dayHint:'기간 막대에 마우스를 올리거나 터치하면 대회 정보를 확인할 수 있습니다.',
    noDayEvents:'이 날짜에 등록된 대회 일정이 없습니다.',noMonthEvents:'이달에 등록된 대회 일정이 없습니다.',
    allMonth:'이달 전체 대회 보기',period:'대회 기간',details:'일정·결과 보기',summary:'대회 요약 보기',periodDetails:'대회 기간·장소 보기',sourceLink:'일정 출처 보기 (외부)',joint:'남녀부 공동 개최',
    dataMissing:y=>`${y}년 대회 일정 데이터가 없습니다.`,retry:'다시 불러오기',back2026:'2026년 달력 보기',
    matchNote:'날짜가 확인된 경기만 집계하며, 대회 전체 경기 수를 날짜별 경기 수로 사용하지 않습니다.',
    daySchedule:'날짜별 대회',otherMonth:'다른 달',yearHint:'기간 막대에서 대회 정보를, 날짜에서 그날의 대회를 확인하세요.',rangeHint:'선택하여 대회 일정 보기',touchHint:'말풍선을 눌러 대회 보기 →'
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
  let payload=null,genderMap=null,resizeTimer=null,dataMissing=false;
  let domesticLocations=new Map();
  // Display-only policy: IDs, periods, gender map and hrefs stay untouched.
  const familyOf=e=>{
    const key=`${e.id} ${e.category} ${e.title}`.toLowerCase();
    if(/v-?league|v-리그|kovo|코보/.test(key))return 'pro';
    if(/vnl|fivb|world-championship|u17-world/.test(key))return 'fivb';
    if(/avc|east-asian/.test(key))return 'avc';
    if(/asian-games|아시안게임/.test(key))return 'games';
    if(/university|대학/.test(key))return 'university';
    if(e.category==='domestic-school')return 'school';
    if(e.category.startsWith('domestic-'))return 'domestic';
    return 'international';
  };
  const palette={fivb:'#A474F1',avc:'#7CCB47',domestic:'#58A9F4',school:'#FF9E35',pro:'#53565C',women:'#FF72B1',games:'#8F2436',international:'#A474F1'};
  const familyLabels={fivb:'FIVB',avc:'AVC',domestic:'국내 종합·실업',university:'대학',school:'중·고',pro:'V-리그 / KOVO컵',games:'아시안게임',international:'기타 국제대회'};
  function colorOf(e){
    const genders=assignedGenders(e);
    if(genders.length===1&&genders[0]==='women')return palette.women;
    if(e.category.startsWith('domestic-')&&e.category!=='domestic-school')return palette.domestic;
    return palette[familyOf(e)]||palette.international;
  }
  const genderLabel=e=>assignedGenders(e).length===2?'남녀공통':assignedGenders(e).map(g=>t[g]).join(' · ')||'성별 미확인';
  const priority={pro:0,fivb:1,avc:1,games:1,international:1,university:2,domestic:2,school:3,...window.KVLCalendarLayerPriority};
  const badges=e=>assignedGenders(e).length===2?'<b class="cc-joint-badges" aria-hidden="true"><i>남</i><i>여</i></b>':'';
  const labelOf=c=>payload?.categories.find(x=>x.id===c)?.label||({vleague:t.vleague,'domestic-general':t.domestic}[c])||t.period;
  const displayTitle=e=>e.short_title||e.title;
  // Location is a display-only lookup. Never import dates, IDs or links from the
  // older domestic calendar into the canonical period feed.
  const locationOf=e=>String(e.location||domesticLocations.get(e.id)||
    (Array.isArray(e.venues)?e.venues.filter(v=>typeof v==='string').join(' · '):'')||'').trim();
  function titleWithLocation(e,title=displayTitle(e)){
    const place=locationOf(e),suffix=title.match(/\s*\(([^()]+)\)\s*$/);
    const normalized=value=>String(value).replace(/\s+/g,'');
    // Reuse an existing location suffix instead of appending it twice; preserve
    // unrelated parentheses such as age groups, rounds or sponsorship.
    if(place&&suffix&&normalized(place).includes(normalized(suffix[1])))title=title.slice(0,suffix.index).trim();
    if(!place&&suffix)return title;
    return `${title} (${place||'장소 미등록'})`;
  }
  const periodTitle=e=>e.periodMembers
    ?e.periodMembers.map(member=>titleWithLocation(member)).join(' / ')
    :titleWithLocation(e);
  const assignedGenders=e=>e.periodMembers?[...new Set(e.periodMembers.flatMap(assignedGenders))]:e.genders||genderMap?.events?.[e.id]?.genders||[];
  const visibleEvents=()=>payload.events.filter(e=>(active==='all'||(active==='domestic'?e.category.startsWith('domestic-'):e.category===active))&&(gender==='all'||assignedGenders(e).includes(gender)));
  // Only annual display bars may combine a verified male/female pair. Never
  // group by family and dates alone: separate events/age groups must remain.
  const neutralTitle=e=>e.title.normalize('NFKC').toLowerCase()
    .replace(/남자부|여자부|남자|여자/g,'')
    .replace(/\b(?:men|women|boys|girls|male|female)(?:'s)?\b/g,'')
    .replace(/\s+/g,' ').trim();
  function annualPeriods(events){
    const buckets=new Map();
    for(const e of events){
      if(assignedGenders(e).length!==1||!neutralTitle(e))continue;
      const key=JSON.stringify([e.category,familyOf(e),neutralTitle(e),e.start,e.end]);
      if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);
    }
    const pairs=new Map();
    for(const entries of buckets.values()){
      if(entries.length!==2||new Set(entries.flatMap(assignedGenders)).size!==2)continue;
      const members=[...entries].sort((a,b)=>assignedGenders(a)[0]==='men'?-1:1);
      const joined={...members[0],periodMembers:members};
      members.forEach(e=>pairs.set(e.id,joined));
    }
    const emitted=new Set();
    return events.flatMap(e=>{const shown=pairs.get(e.id)||e;if(emitted.has(shown.id))return [];emitted.add(shown.id);return [shown]});
  }
  const rangeMembers=anchor=>{
    let ids=[anchor.dataset.rangeEvent];
    try{if(anchor.dataset.rangeMembers)ids=JSON.parse(anchor.dataset.rangeMembers)}catch{}
    return ids.map(id=>payload?.events.find(e=>e.id===id)).filter(Boolean);
  };
  const eventsAt=(date,events=visibleEvents())=>events.filter(e=>e.start<=date&&e.end>=date);
  const overlaps=(e,y,m)=>e.start<=iso(civil(y,m+1,0))&&e.end>=iso(civil(y,m,1));
  const monthEvents=m=>visibleEvents().filter(e=>overlaps(e,year,m)).sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'ko'));
  const statusOf=e=>e.start<=todayIso&&e.end>=todayIso?'live':e.start>todayIso?'upcoming':'ended';
  const formatDate=s=>{const [y,m,d]=s.split('-').map(Number);return `${y}.${pad(m)}.${pad(d)}`};
  const fullDate=s=>{const d=new Date(s+'T00:00:00Z');return `${t.day(d.getUTCMonth()+1,d.getUTCDate())} ${t.fullWeekdays[d.getUTCDay()]}`};
  const duration=e=>Math.round((new Date(e.end+'T00:00:00Z')-new Date(e.start+'T00:00:00Z'))/86400000)+1;
  const siteOrigin='https://kvolleylab.com';
  function competitionPage(e){
    if(e.id==='west-japan-university-men-selection-2026')return siteOrigin+'/international-university-west-japan-select-2026.html?view=matches';
    if(!e.href)return null;
    const url=new URL(e.href,siteOrigin);
    return url.origin===siteOrigin?url.href:null;
  }
  function eventHref(e,date){
    const page=competitionPage(e);
    if(page)return page;
    // Use the visible segment of a season when it crosses a month or year.
    const day=date||[e.start,iso(civil(year,month,1))].sort().at(-1);
    return calendarHref('month',Number(day.slice(0,4)),Number(day.slice(5,7)),day)+'#cc-event-'+encodeURIComponent(e.id);
  }
  const datedMatches=(events,date)=>events.flatMap(e=>(e.matches||[]).filter(m=>m.date===date).map(m=>({event:e,match:m})));
  // One floating tooltip avoids clipping at month-card and viewport edges.
  const rangeTip=document.createElement('div');
  rangeTip.id='ccRangeTooltip';rangeTip.className='cc-range-tooltip';rangeTip.setAttribute('role','tooltip');rangeTip.hidden=true;document.body.append(rangeTip);
  let activeRange=null,touchRange=null,hideRangeTimer=null,lastPointerType='mouse';
  function hideRange(){
    clearTimeout(hideRangeTimer);rangeTip.hidden=true;
    activeRange?.removeAttribute('aria-describedby');activeRange=null;touchRange=null;
    root.querySelectorAll('.is-range-active').forEach(a=>a.classList.remove('is-range-active'));
  }
  function showRange(anchor,touch=false){
    const members=rangeMembers(anchor),event=members[0];if(!event)return;
    const joint=members.length>1,annual=anchor.classList.contains('is-compact');
    clearTimeout(hideRangeTimer);activeRange?.removeAttribute('aria-describedby');activeRange=anchor;
    root.querySelectorAll('[data-range-event]').forEach(a=>a.classList.toggle('is-range-active',rangeMembers(a).some(e=>members.some(member=>member.id===e.id))));
    rangeTip.classList.toggle('status-ended',statusOf(event)==='ended');
    const genderText=joint?'남 · 여 (동일기간)':genderLabel(event);
    const group=annual?`${esc(labelOf(event.category))} · `:'';
    rangeTip.innerHTML=`${members.map(e=>`<strong>${esc(titleWithLocation(e,e.title))}</strong>`).join('')}<span class="cc-range-tooltip-date">${formatDate(event.start)} – ${formatDate(event.end)} <em>· ${t.duration(duration(event))}</em></span><span class="cc-range-tooltip-meta">${t[statusOf(event)]} · ${group}${esc(familyLabels[familyOf(event)])} · ${esc(genderText)}</span>${event.period_note?`<span class="cc-range-tooltip-meta">${esc(event.period_note)}</span>`:''}${joint?`<span class="cc-range-tooltip-links">${members.map(e=>`<a href="${esc(eventHref(e,anchor.dataset.rangeStart))}">${esc(genderLabel(e))} 대회 보기 →</a>`).join('')}</span>`:`<span class="cc-range-tooltip-hint">${touch?t.touchHint:t.rangeHint}</span>`}`;
    if(!joint)rangeTip.innerHTML=`<a class="cc-range-tooltip-target" href="${esc(eventHref(event,anchor.dataset.rangeStart))}">${rangeTip.innerHTML}</a>`;
    rangeTip.style.maxWidth=`${Math.min(360,document.documentElement.clientWidth-24)}px`;
    rangeTip.hidden=false;anchor.setAttribute('aria-describedby',rangeTip.id);
    const rect=anchor.getBoundingClientRect(),box=rangeTip.getBoundingClientRect(),edge=12;
    const left=Math.max(edge,Math.min(rect.left+rect.width/2-box.width/2,document.documentElement.clientWidth-box.width-edge));
    const above=rect.top-box.height-10>=edge;
    rangeTip.style.left=`${left}px`;rangeTip.style.top=`${Math.max(edge,Math.min(above?rect.top-box.height-10:rect.bottom+10,window.innerHeight-box.height-edge))}px`;
    rangeTip.style.setProperty('--tip-arrow',`${Math.max(18,Math.min(rect.left+rect.width/2-left,box.width-18))}px`);
    rangeTip.classList.toggle('is-below',!above);
  }
  const deferHideRange=()=>{clearTimeout(hideRangeTimer);hideRangeTimer=setTimeout(hideRange,160)};
  root.addEventListener('pointerover',e=>{const a=e.target.closest('[data-range-event]');if(a&&e.pointerType!=='touch')showRange(a)});
  root.addEventListener('pointerout',e=>{const a=e.target.closest('[data-range-event]');if(a&&e.pointerType!=='touch'&&!a.contains(e.relatedTarget)&&!rangeTip.contains(e.relatedTarget))deferHideRange()});
  root.addEventListener('focusin',e=>{const a=e.target.closest('[data-range-event]');if(a&&lastPointerType!=='touch')showRange(a)});
  root.addEventListener('focusout',e=>{if(e.target.closest('[data-range-event]')&&!rangeTip.contains(e.relatedTarget))deferHideRange()});
  root.addEventListener('click',e=>{
    const a=e.target.closest('[data-range-event]');if(!a)return;
    if(lastPointerType==='touch'||window.matchMedia('(hover: none), (max-width: 680px)').matches){
      e.preventDefault();
      if(touchRange===a)hideRange();else{touchRange=a;showRange(a,true)}
    }
  });
  rangeTip.addEventListener('pointerenter',()=>clearTimeout(hideRangeTimer));
  rangeTip.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&!touchRange)deferHideRange()});
  rangeTip.addEventListener('focusin',()=>clearTimeout(hideRangeTimer));
  rangeTip.addEventListener('focusout',e=>{if(!rangeTip.contains(e.relatedTarget)&&e.relatedTarget!==activeRange)deferHideRange()});
  document.addEventListener('pointerdown',e=>{lastPointerType=e.pointerType||'mouse';if(!e.target.closest('[data-range-event],#ccRangeTooltip'))hideRange()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideRange()});
  window.addEventListener('scroll',()=>{
    // Keyboard focus may scroll a range into view. Reposition its tooltip after
    // that scroll instead of immediately dismissing the information just opened.
    if(activeRange&&document.activeElement===activeRange&&lastPointerType!=='touch'){
      const rect=activeRange.getBoundingClientRect();
      if(rect.bottom>=0&&rect.top<=window.innerHeight){showRange(activeRange,touchRange===activeRange);return}
    }hideRange();
  },{passive:true});window.addEventListener('resize',hideRange);
  function calendarHref(v,y,m,date=null){
    const q=new URLSearchParams(location.search);
    q.set('view',v);q.set('year',y);
    v==='month'?q.set('month',m):q.delete('month');
    active==='all'?q.delete('category'):q.set('category',active);
    gender==='all'?q.delete('gender'):q.set('gender',gender);
    date?q.set('date',date):q.delete('date');q.delete('q');
    return `${location.pathname.split('/').pop()||'competition-calendar.html'}?${q}`;
  }
  function syncUrl(){
    const url=new URL(calendarHref(view,year,month,selected),location.href);
    if(!explicitView)url.searchParams.delete('view');
    if(linkedEventCard())url.hash=location.hash;
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
    const items=[['all',null],['international','#DC2626'],['domestic','#2563EB'],['vleague','#111111']];
    return `${genderToolbar}<div class="cc-toolbar"><div class="cc-toolbar-left"><div class="cc-year-nav"><a aria-label="${t.previousYear}" href="${calendarHref(view,year-1,month)}">‹</a><label class="cc-year-select"><strong aria-hidden="true">${t.year(year)}</strong><select aria-label="연도 선택" data-year-select>${Array.from({length:7},(_,i)=>year-3+i).map(y=>`<option value="${y}" ${y===year?'selected':''}>${t.year(y)}</option>`).join('')}</select></label><a aria-label="${t.nextYear}" href="${calendarHref(view,year+1,month)}">›</a></div><a class="cc-today-btn" href="${calendarHref('month',todayYear,todayMonth,todayIso)}">${t.today}</a><button class="cc-share-btn" type="button" data-share>${t.share}</button></div><div class="cc-filters" role="group" aria-label="${t.categoryFilter}">${items.map(([id,color])=>`<button class="cc-filter ${active===id?'active':''}" data-filter="${id}" aria-pressed="${active===id}">${color?`<span class="cc-filter-dot" style="background:${color}"></span>`:''}${t[id]}</button>`).join('')}</div></div>`;
  }
  function monthShortcuts(m){
    return `<nav class="cc-month-shortcuts" aria-label="${t.monthJump}">${Array.from({length:12},(_,i)=>`<a href="${calendarHref('month',year,i+1)}" ${i+1===m?'aria-current="page"':''}>${t.month(i+1)}</a>`).join('')}</nav>`;
  }
  function dots(events){
    const categories=[...new Set(events.map(e=>colorOf(e)))];
    return `<span class="cc-card-dots" aria-hidden="true">${categories.map(c=>`<i style="--dot:${c}"></i>`).join('')}</span>`;
  }
  // Reuse the original weekly range/lane model, now with Sunday-first indices.
  // A lane stays with an event across weeks; all intersecting periods are kept.
  function rangeWeeks(m,compact,cells,offset,events=visibleEvents()){
    const first=iso(civil(year,m,compact?1:1-offset));
    const last=iso(civil(year,m,compact?civil(year,m+1,0).getUTCDate():cells-offset));
    const gridStart=civil(year,m,1-offset).getTime(),dayIndex=date=>Math.round((Date.parse(date+'T00:00:00Z')-gridStart)/86400000);
    const weeks=Array.from({length:cells/7},()=>[]);
    events.filter(e=>e.start<=last&&e.end>=first).forEach(event=>{
      const start=event.start<first?first:event.start,end=event.end>last?last:event.end;
      let cursor=dayIndex(start),endIndex=dayIndex(end);
      while(cursor<=endIndex){
        const week=Math.floor(cursor/7),col=cursor%7,span=Math.min(7-col,endIndex-cursor+1);
        const segmentStart=iso(civil(year,m,cursor-offset+1)),segmentEnd=iso(civil(year,m,cursor+span-offset));
        weeks[week].push({event,col,span,start:segmentStart,end:segmentEnd});cursor+=span;
      }
    });
    // Repack each week to avoid empty lanes. Priority orders the separated
    // rows; CSS reserves a complete bar plus a gap for every occupied lane.
    weeks.forEach(items=>{
      const occupied=[];
      items.sort((a,b)=>priority[familyOf(a.event)]-priority[familyOf(b.event)]||a.event.start.localeCompare(b.event.start)||a.event.id.localeCompare(b.event.id));
      items.forEach(s=>{
        const intersects=other=>s.col<other.col+other.span&&other.col<s.col+s.span;
        const minLane=Math.max(0,...occupied.flatMap((row,i)=>row.some(other=>intersects(other)&&priority[familyOf(other.event)]<priority[familyOf(s.event)])?[i+1]:[]));
        let lane=occupied.findIndex((row,i)=>i>=minLane&&row.every(other=>!intersects(other)));
        if(lane<0){lane=occupied.length;occupied.push([])}
        occupied[lane].push(s);s.lane=lane;
      });
    });
    return weeks;
  }
  function rangeBar({event,lane,col,span,start,end},compact){
    const before=event.start<start,after=event.end>end,family=familyOf(event),members=event.periodMembers||[event];
    const href=members.length>1?calendarHref('month',Number(start.slice(0,4)),Number(start.slice(5,7)),start):eventHref(event,start);
    const title=members.map(e=>titleWithLocation(e,e.title)).join(' / ');
    // Production-style labels return in both views. Full titles and locations
    // remain available in the existing tooltip when the bar is ellipsized.
    return `<a class="cc-card-period status-${statusOf(event)} ${compact?'is-compact':''} ${before?'continues-before':''} ${after?'continues-after':''} ${colorOf(event)===palette.pro?'is-pro':''}" href="${esc(href)}" data-range-event="${esc(event.id)}" data-range-members="${esc(JSON.stringify(members.map(e=>e.id)))}" data-range-start="${start}" data-range-end="${end}" data-range-lane="${lane}" data-family="${family}" aria-label="${esc(title)} · ${esc(genderLabel(event))} · ${formatDate(event.start)} – ${formatDate(event.end)}" style="--event-color:${colorOf(event)};--layer:${lane};grid-column:${col+1}/span ${span};grid-row:${lane+1}"><span>${esc(periodTitle(event))}</span>${compact?'':badges(event)}</a>`;
  }
  function grid(m,compact){
    const first=civil(year,m,1),offset=first.getUTCDay(),last=civil(year,m+1,0).getUTCDate();
    const cells=compact?42:Math.ceil((offset+last)/7)*7;
    const events=visibleEvents();
    let days='';
    for(let i=0;i<cells;i++){
      const d=civil(year,m,i-offset+1),date=iso(d),inMonth=d.getUTCMonth()+1===m&&d.getUTCFullYear()===year;
      if(compact&&!inMonth){days+='<span class="cc-card-day is-compact is-outside" aria-hidden="true"></span>';continue}
      const dayEvents=eventsAt(date,events),today=date===todayIso,isSelected=date===selected;
      const cls=`cc-card-day ${compact?'is-compact':''} ${inMonth?'':'is-outside'} ${dayEvents.length?'has-events':''} ${today?'is-today':''} ${isSelected?'is-selected':''} ${i%7===0?'is-sunday':i%7===6?'is-saturday':''}`;
      const label=`${date} ${t.fullWeekdays[d.getUTCDay()]}${today?' · '+t.today:''} · ${t.count(dayEvents.length)}`;
      const body=`<span class="cc-card-day-number">${d.getUTCDate()}</span>${dayEvents.length?`<span class="cc-card-day-count">${t.count(dayEvents.length)}</span>${dots(dayEvents)}`:'<span class="cc-card-day-space" aria-hidden="true"></span>'}`;
      const attrs=`class="${cls}" data-date="${date}" data-event-count="${dayEvents.length}" aria-label="${esc(label)}"${today?' aria-current="date"':''}`;
      days+=`<button type="button" ${attrs} aria-haspopup="dialog" aria-pressed="${isSelected}" data-select-date="${date}">${body}</button>`;
    }
    const sizingWeeks=rangeWeeks(m,compact,cells,offset);
    const weeks=compact?rangeWeeks(m,compact,cells,offset,annualPeriods(visibleEvents())):sizingWeeks;
    // Reserve each complete lane below the dates. Busy weeks grow only as needed.
    const rows=sizingWeeks.map(items=>`minmax(var(--range-min-week),calc(var(--range-date-height) + ${Math.max(0,...items.map(s=>s.lane))} * var(--range-lane-height) + var(--range-bar-height) + 2px))`).join(' ');
    return `<div class="cc-card-weekdays">${t.weekdays.map((s,i)=>`<span class="${i===0?'is-sunday':i===6?'is-saturday':''}">${s}</span>`).join('')}</div><div class="cc-card-board ${compact?'is-compact':''} ${compact&&sizingWeeks.some(items=>items.some(s=>s.lane>=3))?'is-dense':''}" style="--calendar-rows:${rows}"><div class="cc-card-grid ${compact?'is-compact':''}" data-calendar-month="${m}" data-start-weekday="0">${days}</div><div class="cc-card-period-layer">${weeks.map((items,index)=>`<div class="cc-card-week-ranges" data-range-week="${index}" style="grid-row:${index+1}">${items.map(item=>rangeBar(item,compact)).join('')}</div>`).join('')}</div></div>`;
  }
  function miniCalendar(m){
    const events=monthEvents(m);
    return `<section class="cc-month-card cc-card-month" id="cc-month-${m}" data-month="${m}"><div class="cc-month-head"><a href="${calendarHref('month',year,m)}">${t.month(m)}</a><span>${t.count(events.length)}</span></div>${grid(m,true)}<a class="cc-card-month-foot" href="${calendarHref('month',year,m)}">${events.length?dots(events):''}<span>${t.monthEvents}</span><span aria-hidden="true">→</span></a></section>`;
  }
  function eventCard(e,date){
    const status=statusOf(e),matches=date?datedMatches([e],date):[];
    const page=competitionPage(e);
    const href=page||eventHref(e,date);
    const title=`<h3>${esc(titleWithLocation(e))}</h3>`;
    const atDetail=date&&!page;
    const heading=atDetail?`<div class="cc-card-event-link">${title}</div>`:`<a class="cc-card-event-link" href="${esc(href)}">${title}<span aria-hidden="true">→</span></a>`;
    let action='';
    if(atDetail){
      const source=e.source_url||e.href;
      if(/^https?:\/\//i.test(source))action=`<a class="cc-card-event-action" href="${esc(source)}" target="_blank" rel="noopener noreferrer">${t.sourceLink} ↗</a>`;
    }else{
      const label=e.podiums?.length?t.summary:page?t.details:t.periodDetails;
      action=`<a class="cc-card-event-action${e.podiums?.length?' cc-focus-event':''}" href="${esc(href)}">${label} <span aria-hidden="true">→</span></a>`;
    }
    return `<article class="cc-card-event" data-event-id="${esc(e.id)}"${date?` id="cc-event-${esc(e.id)}" tabindex="-1"`:''} style="--event-color:${colorOf(e)}"><div class="cc-card-event-top"><span class="cc-card-category"><i></i>${esc(labelOf(e.category))}</span><span class="cc-card-status status-${status}">${t[status]}</span></div>${heading}<p class="cc-card-event-period">${formatDate(e.start)} – ${formatDate(e.end)} <span>· ${t.duration(duration(e))}</span>${e.period_note?`<span>${esc(e.period_note)}</span>`:''}</p><p class="cc-card-event-meta">${assignedGenders(e).length===2?t.joint:assignedGenders(e).map(g=>t[g]).join(' · ')}</p>${matches.length?`<div class="cc-card-confirmed"><strong>${t.matches(matches.length)}</strong>${matches.map(({match})=>`<p>${esc(match.time||'')} ${esc(match.teamA||'')} – ${esc(match.teamB||'')}</p>`).join('')}</div>`:''}${action}</article>`;
  }
  function linkedEventCard(){
    if(!location.hash.startsWith('#cc-event-'))return null;
    try{return document.getElementById(decodeURIComponent(location.hash.slice(1)))}catch{return null}
  }
  function revealLinkedEvent(){
    const card=linkedEventCard();
    if(!card)return;
    const header=document.querySelector('.cc-sticky-header');
    const inset=header.offsetHeight+(parseFloat(getComputedStyle(header).top)||0)+10;
    card.style.scrollMarginTop=inset+'px';
    card.focus({preventScroll:true});
    card.scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange',revealLinkedEvent);
  function renderSelected(){
    const target=document.getElementById('ccSelectedDay');if(!target)return;
    const events=eventsAt(selected),matches=datedMatches(events,selected);
    target.innerHTML=`<div class="cc-card-agenda-head"><div><span class="cc-card-caption">${t.selectedDay}</span><h2>${fullDate(selected)}</h2></div><strong>${t.count(events.length)}</strong></div><p class="cc-card-note">${t.periodNote}</p>${matches.length?`<p class="cc-card-match-note">${t.matches(matches.length)} · ${t.matchNote}</p>`:''}<div class="cc-card-event-list">${events.length?events.map(e=>eventCard(e,selected)).join(''):`<p class="cc-card-empty">${t.noDayEvents}</p>`}</div>`;
  }
  function render(){
    hideRange();
    controls.innerHTML=toolbar();
    if(dataMissing){
      root.innerHTML=`<div class="cc-data-error"><strong>${t.dataMissing(year)}</strong><a href="${calendarHref('year',2026,1)}">${t.back2026}</a></div>`;
      bind();syncUrl();syncViewSwitch();return;
    }
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
      hideRange();renderSelected();syncUrl();
      window.KVLCompetitionCalendarDayV1.open({date:selected,events:eventsAt(selected),gender,href:eventHref,color:colorOf,title:e=>titleWithLocation(e,e.title)});
    });
    const yearSelect=controls.querySelector('[data-year-select]');
    yearSelect.onchange=()=>location.href=calendarHref(view,Number(yearSelect.value),month);
    const share=controls.querySelector('[data-share]');
    share.onclick=async()=>{syncUrl();try{await navigator.clipboard.writeText(location.href);share.textContent=t.copied;setTimeout(()=>share.textContent=t.share,1400)}catch{prompt(t.copyPrompt,location.href)}};
  }
  if(!explicitView)window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const v=responsiveView();if(v!==view&&payload){view=v;render()}},160)});
  const readJson=async (path,allowMissing=false)=>{
    const response=await fetch(path,{cache:'no-store'});
    if(allowMissing&&response.status===404)return null;
    if(!response.ok)throw Error('calendar data');
    return response.json();
  };
  Promise.all([
    readJson(`data/calendar/${year}-competition-periods.json?v=20260921-world-events-1`,true),
    readJson(`data/calendar/${year}-competition-genders.json?v=20261019-genders-v1`).catch(()=>null),
    readJson(`data/calendar/${year}-domestic-competitions.json`).catch(()=>null),
    readJson('data/calendar/verified-events.json?v=20261104')
  ]).then(([data,map,domestic,verified])=>{
    if(data&&(!Array.isArray(data.events)||!Array.isArray(data.categories)))throw Error('calendar schema');
    const baseEvents=data?.events||[];
    const seen=new Set(baseEvents.map(e=>e.id));
    const additions=verified.filter(e=>!seen.has(e.id)&&e.start<=`${year}-12-31`&&e.end>=`${year}-01-01`);
    if(!data&&!additions.length)throw Error('unregistered year');
    payload={events:[...baseEvents,...additions],categories:data?.categories||[]};
    domesticLocations=new Map(domestic?.year===year&&Array.isArray(domestic.competitions)
      ?domestic.competitions.filter(e=>typeof e.id==='string'&&typeof e.location==='string').map(e=>[e.id,e.location]):[]);
    genderMap=map?.schema==='calendar-genders-v1'&&map.year===year&&map.events?map:(!data?{events:{}}:null);
    if(!genderMap)gender='all';render();
    if(linkedEventCard())requestAnimationFrame(revealLinkedEvent);
  }).catch(()=>{
    dataMissing=true;payload={events:[],categories:[]};genderMap={events:{}};render();
  });
})();

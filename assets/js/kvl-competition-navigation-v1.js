/* Competition Engine V2: schedule date navigation and overview calendar today marker.
 * Presentation-only enhancement. Do not change match/standings/roster/source data. */
(()=>{
  'use strict';
  const body=document.body;
  const q=(selector,root=document)=>root.querySelector(selector);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const todayKST=()=>new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10);
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'');
  const calendarObservers=new WeakSet();

  function ready(){
    const d=window.KVL_COMPETITION_V2_DATA;
    const shell=q('[data-kvl-shell]');
    return Boolean(d&&shell&&!shell.hidden&&body.dataset.kvlRenderState==='ready');
  }

  function scheduleJump(){
    if(!ready())return;
    const params=new URLSearchParams(location.search);
    if(params.get('view')!=='schedule')return;
    const schedule=q('#schedule');
    if(!schedule||schedule.hidden)return;
    const groups=qa('.kvl1180-date-group[id^="date-"]',schedule)
      .filter(el=>validDate(el.id.slice(5))&&el.id==='date-'+el.id.slice(5));
    if(!groups.length)return;
    const byDate=new Map(groups.map(el=>[el.id.slice(5),el]));
    const dates=[...byDate.keys()].sort();
    const explicit=params.get('date');
    const reference=validDate(explicit)?explicit:todayKST();
    // Exact date takes priority. If no game that day, use the next available
    // date; for a completed tournament show its last listed game.
    const chosen=byDate.has(reference)?reference:(dates.find(date=>date>=reference)||dates.at(-1));
    const target=byDate.get(chosen);
    if(!target)return;
    qa('.kvl-comp-selected-date',schedule).forEach(el=>{
      if(el!==target)el.classList.remove('kvl-comp-selected-date');
    });
    requestAnimationFrame(()=>{
      if(!target.isConnected||schedule.hidden||!ready()||
         new URLSearchParams(location.search).get('view')!=='schedule')return;
      target.classList.add('kvl-comp-selected-date');
      target.scrollIntoView({block:'start',behavior:'auto'});
      target.tabIndex=-1;
      target.focus({preventScroll:true});
    });
  }

  function markToday(calendar){
    const grid=q('.dv2-calendar-grid',calendar);
    const yearText=q('.dv2-calendar-year',calendar)?.textContent||'';
    const monthText=q('.dv2-calendar-month',calendar)?.textContent||'';
    const year=Number(yearText.match(/\d{4}/)?.[0]),month=Number(monthText.match(/\d{1,2}/)?.[0]);
    const today=todayKST(),visibleMonth=String(year)+'-'+String(month).padStart(2,'0');
    const currentMonth=today.slice(0,7)===visibleMonth;
    const dayNumber=Number(today.slice(8));
    const target=currentMonth&&grid?qa('.dv2-day:not(.outside)',grid).find(el=>{
      const label=q('.dv2-calendar-date',el);
      return label&&Number(label.textContent.trim())===dayNumber;
    }):null;
    // Remove any leftover text badges from an earlier version; keep the date highlight.
    qa('.kvl-calendar-today-badge',calendar).forEach(el=>el.remove());
    qa('.kvl-calendar-today',calendar).forEach(el=>{
      if(el===target)return;
      el.classList.remove('kvl-calendar-today');
      el.removeAttribute('aria-current');
    });
    if(!target)return;
    target.classList.add('kvl-calendar-today');
    target.setAttribute('aria-current','date');
  }

  function mountTodayCalendar(calendar){
    if(calendarObservers.has(calendar))return;
    calendarObservers.add(calendar);
    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{
      if(calendar.isConnected)markToday(calendar);
      else observer.disconnect();
    }));
    observer.observe(calendar,{childList:true,subtree:true});
    markToday(calendar);
  }
  function mountCalendars(){
    // The domestic and international home pages use data-dv2-calendar.
    // The base Competition V2 overview uses the original component slot.
    qa('[data-dv2-calendar], [data-kvl-component="calendar"]').forEach(mountTodayCalendar);
  }

  function installTopButton(){
    if(q('.kvl-comp-back-to-top'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='kvl-comp-back-to-top';
    button.setAttribute('aria-label','페이지 맨 위로 이동');
    button.title='맨 위로';
    button.hidden=true;
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v14"/></svg><span>TOP</span>';
    body.append(button);
    const update=()=>{button.hidden=window.scrollY<300;};
    button.addEventListener('click',()=>{
      window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
    update();
  }

  let started=false;
  const loadingObserver=new MutationObserver(()=>start());
  function start(){
    if(started||!ready())return;
    started=true;
    loadingObserver.disconnect();
    installTopButton();
    mountCalendars();
    scheduleJump();
    // The template handles tab clicks via pushState, without a reload.
    document.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const tab=event.target.closest?.('.kvl1180-tabs a[data-view="schedule"]');
      if(tab&&tab.getAttribute('aria-disabled')!=='true')
        requestAnimationFrame(scheduleJump);
    });
    window.addEventListener('popstate',()=>requestAnimationFrame(scheduleJump));
    window.addEventListener('pageshow',()=>{
      requestAnimationFrame(()=>{
        scheduleJump();
        mountCalendars();
      });
    });
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)mountCalendars();
    });
  }
  loadingObserver.observe(body,{attributes:true,attributeFilter:['data-kvl-render-state']});
  start();
})();

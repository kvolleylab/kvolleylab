/* V-League men's page navigation only. Shared match data and calendar behavior stay untouched. */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  if(!/^v-league-men-\d{4}-\d{2}$/.test(params.get('competition')||''))return;

  const body=document.body;
  const isReady=()=>{
    const data=window.KVL_COMPETITION_V2_DATA;
    const shell=document.querySelector('[data-kvl-shell]');
    return data?.competitionFamily==='pro'&&data.gender==='men'&&
      data.structure?.presentationCategory==='pro-league'&&
      body.dataset.kvlRenderState==='ready'&&shell&&!shell.hidden;
  };

  // Schedule dates use Korea Standard Time, not the visitor's local time.
  const todayInKorea=()=>new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10);
  function jumpToDate(){
    if(!isReady())return;
    const query=new URLSearchParams(location.search);
    if(query.get('view')!=='schedule')return;
    const schedule=document.getElementById('schedule');
    if(!schedule||schedule.hidden)return;
    const groups=[...schedule.querySelectorAll('.kvl1180-date-group[id^="date-"]')]
      .filter(el=>/^date-\d{4}-\d{2}-\d{2}$/.test(el.id));
    const requested=query.get('date')||'';
    const explicit=/^\d{4}-\d{2}-\d{2}$/.test(requested);
    const dates=groups.map(el=>el.id.slice(5)).sort();
    const today=todayInKorea();
    // A chosen date takes precedence; otherwise go to today's match or next available.
    const wanted=explicit?requested:(dates.find(date=>date>=today)||dates.at(-1));
    const target=wanted?document.getElementById('date-'+wanted):null;
    if(!target||!schedule.contains(target))return;

    schedule.querySelectorAll('.kvl-vleague-selected-date').forEach(el=>{
      if(el!==target)el.classList.remove('kvl-vleague-selected-date');
    });
    requestAnimationFrame(()=>{
      if(!isReady()||!target.isConnected||schedule.hidden||
         new URLSearchParams(location.search).get('view')!=='schedule')return;
      target.classList.add('kvl-vleague-selected-date');
      target.scrollIntoView({block:'start',behavior:'auto'});
      target.tabIndex=-1;
      target.focus({preventScroll:true});
    });
  }

  function installBackToTop(){
    if(document.querySelector('.kvl-vleague-back-to-top'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='kvl-vleague-back-to-top';
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
  const observer=new MutationObserver(()=>start());
  function start(){
    if(started||!isReady())return;
    started=true;
    observer.disconnect();
    installBackToTop();
    jumpToDate();
    // The shared tab controller uses pushState without a page reload, so
    // listen for an actual schedule tab click as well as initial page load.
    document.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const tab=event.target.closest?.('.kvl1180-tabs a[data-view="schedule"]');
      if(tab&&tab.getAttribute('aria-disabled')!=='true')
        requestAnimationFrame(jumpToDate);
    });
    window.addEventListener('popstate',()=>requestAnimationFrame(jumpToDate));
  }
  observer.observe(body,{attributes:true,attributeFilter:['data-kvl-render-state']});
  start();
})();

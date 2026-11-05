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

  function jumpToDate(){
    const query=new URLSearchParams(location.search);
    const date=query.get('date')||'';
    if(query.get('view')!=='schedule'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    const schedule=document.getElementById('schedule');
    const target=document.getElementById('date-'+date);
    if(!schedule||schedule.hidden||!target||!schedule.contains(target))return;
    requestAnimationFrame(()=>{
      if(!target.isConnected||schedule.hidden)return;
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
  }
  observer.observe(body,{attributes:true,attributeFilter:['data-kvl-render-state']});
  start();
})();

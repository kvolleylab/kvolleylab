(()=>{
  const back=document.querySelector('.md-back');
  if(!back)return;

  const params=new URLSearchParams(location.search);
  const returnTo=params.get('return');
  const competition=params.get('competition')||'vnl';
  const season=params.get('season')||'2026';
  const safeFallback=`schedules.html?competition=${encodeURIComponent(competition)}&season=${encodeURIComponent(season)}`;

  if(returnTo&&/^schedules\.html(?:\?|$)/.test(returnTo))back.href=returnTo;
  else back.href=safeFallback;

  back.addEventListener('click',e=>{
    const ref=document.referrer;
    try{
      const url=new URL(ref);
      const sameSite=url.origin===location.origin;
      const fromSchedule=sameSite&&/\/schedules\.html$/.test(url.pathname);
      if(fromSchedule){
        e.preventDefault();
        history.back();
      }
    }catch{}
  });
})();

(()=>{
  const area=document.getElementById('calendarArea');
  if(!area)return;

  const decorate=()=>{
    const current=new URL(location.href);
    const competition=current.searchParams.get('competition')||'vnl';
    const season=current.searchParams.get('season')||'2026';
    const returnTo=`schedules.html?competition=${encodeURIComponent(competition)}&season=${encodeURIComponent(season)}`;

    area.querySelectorAll('a[href^="match.html?id="]').forEach(link=>{
      const url=new URL(link.getAttribute('href'),location.href);
      if(!url.searchParams.get('competition'))url.searchParams.set('competition',competition);
      if(!url.searchParams.get('season'))url.searchParams.set('season',season);
      if(!url.searchParams.get('return'))url.searchParams.set('return',returnTo);
      link.href=`${url.pathname.split('/').pop()}?${url.searchParams.toString()}`;
    });
  };

  const observer=new MutationObserver(decorate);
  observer.observe(area,{childList:true,subtree:true});
  decorate();
})();

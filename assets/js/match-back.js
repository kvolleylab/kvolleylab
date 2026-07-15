(()=>{
  const back=document.querySelector('.md-back');
  if(!back)return;
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
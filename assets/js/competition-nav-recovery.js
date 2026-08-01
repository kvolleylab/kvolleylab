(()=>{
  const run=()=>{
    const path=(location.pathname.split('/').pop()||'').toLowerCase();
    if(path!=='university-competition.html'&&path!=='university-competition-danyang.html')return;
    const main=document.querySelector('.cd-main');
    const hero=main?.querySelector('.cd-hero');
    if(!main||!hero)return;
    main.querySelectorAll('.kvl-competition-list-link').forEach(link=>link.remove());
    let nav=main.querySelector('.kvl-competition-nav');
    const isDanyang=path==='university-competition-danyang.html';
    if(!nav){
      hero.insertAdjacentHTML('beforebegin',`<nav class="kvl-competition-nav" aria-label="대학배구 대회 이동"><div class="kvl-competition-switch" aria-label="대회 바로가기"><a class="${isDanyang?'':'is-active'}" href="university-competition.html">고성대회</a><a class="${isDanyang?'is-active':''}" href="university-competition-danyang.html">단양대회</a></div></nav>`);
      nav=main.querySelector('.kvl-competition-nav');
    }
    nav?.querySelectorAll('.kvl-competition-list-link').forEach(link=>link.remove());
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();
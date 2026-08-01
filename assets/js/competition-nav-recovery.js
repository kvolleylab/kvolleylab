(()=>{
  const run=()=>{
    const path=(location.pathname.split('/').pop()||'').toLowerCase();
    if(path!=='university-competition.html'&&path!=='university-competition-danyang.html')return;
    const main=document.querySelector('.cd-main');
    const hero=main?.querySelector('.cd-hero');
    if(!main||!hero||main.querySelector('.kvl-competition-nav'))return;
    const isDanyang=path==='university-competition-danyang.html';
    hero.insertAdjacentHTML('beforebegin',`<nav class="kvl-competition-nav" aria-label="대학배구 대회 이동"><a class="kvl-competition-list-link" href="university-competitions.html">← 대회 목록</a><div class="kvl-competition-switch" aria-label="대회 바로가기"><a class="${isDanyang?'':'is-active'}" href="university-competition.html">고성대회</a><a class="${isDanyang?'is-active':''}" href="university-competition-danyang.html">단양대회</a></div></nav>`);
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
})();
(()=>{
'use strict';
const nativeFetch=window.fetch.bind(window);
const DANYANG_URL='data/competitions/danyang-2026.json?v=20260820-1';

window.fetch=(input,init)=>{
  const url=typeof input==='string'?input:input?.url||'';
  if(url.includes('data/competitions/gosung-2026.json')) return nativeFetch(DANYANG_URL,init);
  return nativeFetch(input,init);
};

function applyDanyangUi(){
  document.title='2026 단양대회 | K-Volley Lab';
  const title=document.getElementById('cdTitle');
  if(title) title.innerHTML='<span class="cd-hero-title-line">2026 대한항공배</span><span class="cd-hero-title-line">전국대학배구 단양대회</span>';
  const meta=document.getElementById('cdMeta');
  if(meta) meta.textContent='2026-08-12(수) ~ 2026-08-20(목) · 충청북도 단양군 · 단양국민체육센터 / 단양문화체육센터';
  const status=document.querySelector('.cd-status strong');
  if(status) status.textContent='대회 종료';

  document.querySelectorAll('.cd-jump a[data-view]').forEach(a=>{
    a.href=`university-competition-danyang.html?view=${a.dataset.view}`;
  });

  document.querySelectorAll('.cd-cal-game').forEach(card=>{
    card.href='university-competition-danyang.html?view=results';
    const score=card.querySelector('b');
    if(score && (!score.textContent.trim() || score.textContent.trim()==='0-0')) score.textContent='vs';
  });

  document.querySelectorAll('.cd-match').forEach(card=>{
    const score=card.querySelector('.cd-score');
    if(score && (!score.textContent.trim() || score.textContent.trim()==='0-0')){
      score.textContent='vs';
      card.querySelectorAll('.cd-winner').forEach(x=>x.classList.remove('cd-winner'));
    }
  });
}

function scheduleUiSync(){
  [0,120,400,900].forEach(ms=>setTimeout(applyDanyangUi,ms));
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-calendar-division],[data-division],[data-stage],[data-standing-division]')){
      setTimeout(applyDanyangUi,0);
      setTimeout(applyDanyangUi,120);
    }
  });
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',scheduleUiSync,{once:true})
  : scheduleUiSync();
})();
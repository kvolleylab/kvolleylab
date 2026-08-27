(()=>{
'use strict';
const nativeFetch=window.fetch.bind(window);
const DANYANG_URL='data/competitions/danyang-2026.json?v=20260823-1';
const GENDER_KEY='kvl:danyang-2026:gender';
const TITLE_HTML='<span class="cd-hero-title-line">2026 대한항공배</span><span class="cd-hero-title-line">전국대학배구 단양대회</span>';
const META_TEXT='2026-08-12(수) ~ 2026-08-20(목) · 충청북도 단양군 · 단양국민체육센터 / 단양문화체육센터';
let danyangData=null;
let identityObserver=null;

window.fetch=async(input,init)=>{
  const url=typeof input==='string'?input:input?.url||'';
  if(url.includes('data/competitions/gosung-2026.json')){
    const response=await nativeFetch(DANYANG_URL,init);
    try{danyangData=await response.clone().json();}catch(_){danyangData=null;}
    return response;
  }
  return nativeFetch(input,init);
};

function forceDanyangIdentity(){
  document.title='2026 단양대회 | K-Volley Lab';
  const title=document.getElementById('cdTitle');
  if(title&&title.textContent.replace(/\s+/g,' ').trim()!=='2026 대한항공배 전국대학배구 단양대회')title.innerHTML=TITLE_HTML;
  const meta=document.getElementById('cdMeta');
  if(meta&&meta.textContent!==META_TEXT)meta.textContent=META_TEXT;
}

function watchIdentityNodes(){
  const title=document.getElementById('cdTitle');
  const meta=document.getElementById('cdMeta');
  if(!title||!meta)return false;
  if(identityObserver)identityObserver.disconnect();
  identityObserver=new MutationObserver(forceDanyangIdentity);
  identityObserver.observe(title,{childList:true,subtree:true,characterData:true});
  identityObserver.observe(meta,{childList:true,subtree:true,characterData:true});
  forceDanyangIdentity();
  return true;
}

function installIdentityGuard(){
  if(watchIdentityNodes())return;
  const bootstrapObserver=new MutationObserver(()=>{
    if(watchIdentityNodes())bootstrapObserver.disconnect();
  });
  bootstrapObserver.observe(document.documentElement,{childList:true,subtree:true});
  forceDanyangIdentity();
}

installIdentityGuard();

function currentGender(){
  const raw=new URLSearchParams(location.search).get('gender');
  if(raw==='women'||raw==='men')return raw;
  return sessionStorage.getItem(GENDER_KEY)==='여대부'?'women':'men';
}
function danyangHref(view){
  const url=new URL('university-competition-danyang.html',location.href);
  if(view)url.searchParams.set('view',view);
  url.searchParams.set('gender',currentGender());
  return `${url.pathname.split('/').pop()}${url.search}`;
}
function syncDanyangKpis(){
  if(!danyangData)return;
  const active=document.querySelector('[data-calendar-division].is-active')?.dataset.calendarDivision||'남대부';
  const participants=danyangData.participants?.[active]||[];
  const teamLabel=document.getElementById('cdTeamLabel');
  const teamCount=document.getElementById('cdTeamCount');
  const matchCount=document.getElementById('cdMatchCount');
  if(teamLabel)teamLabel.textContent=active==='남대부'?'남대부 참가대학':'여대부 참가대학';
  if(teamCount)teamCount.textContent=String(participants.length);
  if(matchCount)matchCount.textContent=String((danyangData.games||[]).filter(g=>g.division===active).length);
}

function applyDanyangUi(){
  forceDanyangIdentity();
  const statusBox=document.querySelector('.cd-status');
  if(statusBox){
    const label=statusBox.querySelector('span');
    const value=statusBox.querySelector('strong');
    if(label)label.textContent='대회 종료';
    if(value)value.textContent='공식 결과 반영';
  }

  document.querySelectorAll('.cd-jump a[data-view]').forEach(a=>{
    a.href=danyangHref(a.dataset.view);
  });

  document.querySelectorAll('.cd-cal-game').forEach(card=>{
    card.href=danyangHref('results');
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
  syncDanyangKpis();
}

function scheduleUiSync(){
  applyDanyangUi();
  [80,240,600,1500,3500,7000].forEach(ms=>setTimeout(applyDanyangUi,ms));
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-calendar-division],[data-division],[data-stage],[data-standing-division],[data-final-division],[data-team-division]')){
      applyDanyangUi();
      setTimeout(applyDanyangUi,80);
    }
  });
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',scheduleUiSync,{once:true})
  : scheduleUiSync();
})();
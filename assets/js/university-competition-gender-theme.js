(()=>{
'use strict';
const WOMEN='여대부';
const MEN='남대부';
const COMPETITION_ID=document.body?.dataset.competition||'university-competition';
const PAGE_NAME=location.pathname.split('/').pop()||'university-competition.html';
const STORAGE_KEY=`kvl:${COMPETITION_ID}:gender`;
const PRE_RAW=new URLSearchParams(location.search).get('gender');
let PRE_MODE=MEN;
if(PRE_RAW==='women'||PRE_RAW===WOMEN)PRE_MODE=WOMEN;
else if(PRE_RAW==='men'||PRE_RAW===MEN)PRE_MODE=MEN;
else{try{PRE_MODE=sessionStorage.getItem(STORAGE_KEY)===WOMEN?WOMEN:MEN}catch(_){PRE_MODE=MEN}}
document.documentElement.dataset.kvlInitialGender=PRE_MODE===WOMEN?'women':'men';
let mode=PRE_MODE;
let syncing=false;
let refreshQueued=false;

const valueOf=btn=>btn?.dataset.calendarDivision||btn?.dataset.division||btn?.dataset.standingDivision||btn?.dataset.finalDivision||btn?.dataset.teamDivision||'';
const controls=()=>[...document.querySelectorAll('button[data-calendar-division],button[data-division],button[data-standing-division],button[data-final-division],button[data-team-division]')];
const fromUrl=()=>{
  const raw=new URLSearchParams(location.search).get('gender');
  if(raw==='women'||raw===WOMEN)return WOMEN;
  if(raw==='men'||raw===MEN)return MEN;
  return null;
};
const storedValue=()=>sessionStorage.getItem(STORAGE_KEY)===WOMEN?WOMEN:MEN;
const initialValue=()=>fromUrl()||storedValue();
const store=value=>sessionStorage.setItem(STORAGE_KEY,value===WOMEN?WOMEN:MEN);
const ready=()=>Boolean(
  document.querySelector('#cdCalendar .cd-cal-month')&&
  document.querySelector('#cdPodium .cd-rank')&&
  document.querySelector('#cdTeams .cd-team-card')&&
  document.querySelectorAll('.cd-division-switch').length>=2
);

function applyTheme(value){
  mode=value===WOMEN?WOMEN:MEN;
  const gender=mode===WOMEN?'women':'men';
  document.documentElement.dataset.kvlInitialGender=gender;
  if(document.body?.classList.contains('competition-dashboard-page'))document.body.dataset.kvlGenderTheme=gender;
}
function rewriteInternalLinks(){
  const gender=mode===WOMEN?'women':'men';
  const selectors=[
    '.cd-jump a[href]',
    '#overview a[href*="university-competition"]',
    '#standings a[href*="university-competition"]',
    '#group-standings a[href*="university-competition"]'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(a=>{
    const raw=a.getAttribute('href');
    if(!raw)return;
    try{
      const url=new URL(raw,location.href);
      const base=url.pathname.split('/').pop();
      if(!base||!base.startsWith('university-competition'))return;
      if(a.closest('.kvl-competition-nav'))return;
      url.pathname=url.pathname.replace(/[^/]+$/,PAGE_NAME);
      url.searchParams.set('gender',gender);
      const next=`${PAGE_NAME}${url.search}${url.hash}`;
      if(a.getAttribute('href')!==next)a.setAttribute('href',next);
    }catch(_){ }
  });
}
function updateLabels(){
  const teamTitle=document.querySelector('#teams .cd-section-title h2');
  const desired=mode===WOMEN?'여대부 참가대학':'남대부 참가대학';
  if(teamTitle&&teamTitle.textContent!==desired)teamTitle.textContent=desired;
}
function syncControls(){
  if(syncing||!ready())return false;
  syncing=true;
  try{
    controls().filter(btn=>valueOf(btn)===mode&&!btn.classList.contains('is-active')).forEach(btn=>btn.click());
  }finally{
    syncing=false;
  }
  return true;
}
function refresh(){
  applyTheme(mode);
  rewriteInternalLinks();
  if(syncControls())updateLabels();
}
function queueRefresh(){
  if(refreshQueued)return;
  refreshQueued=true;
  requestAnimationFrame(()=>{
    refreshQueued=false;
    refresh();
  });
}
function setMode(value,{persist=true}={}){
  mode=value===WOMEN?WOMEN:MEN;
  if(persist)store(mode);
  applyTheme(mode);
  rewriteInternalLinks();
  queueRefresh();
}
function bindControl(btn){
  if(btn.dataset.kvlGenderBound==='1')return;
  btn.dataset.kvlGenderBound='1';
  btn.addEventListener('click',()=>{
    if(syncing)return;
    const value=valueOf(btn);
    if(value!==WOMEN&&value!==MEN)return;
    setMode(value,{persist:true});
  });
}
function bindAllControls(){controls().forEach(bindControl)}
function start(){
  mode=initialValue();
  applyTheme(mode);
  rewriteInternalLinks();
  bindAllControls();
  const root=document.querySelector('.cd-main');
  if(root){
    const observer=new MutationObserver(()=>{
      bindAllControls();
      queueRefresh();
    });
    observer.observe(root,{childList:true,subtree:true});
  }
  let attempts=0;
  const wait=()=>{
    bindAllControls();
    if(ready()){
      refresh();
      return;
    }
    if(attempts++<80)setTimeout(wait,100);
  };
  wait();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

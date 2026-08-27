(()=>{
'use strict';
if(document.body?.dataset.competition!=='ibk-2026')return;
const D=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
const state=window.KVL_SCHOOL_DIVISION_STATE;
let current=state?.get?.()||new URLSearchParams(location.search).get('division')||'';
try{if(!current)current=sessionStorage.getItem('kvl:ibk-2026:division')||'';}catch(_){ }
if(!D.includes(current))current=D[0];
let syncing=false,queued=false;
const valueOf=btn=>btn?.dataset.kvlDivision||btn?.dataset.calendarDivision||btn?.textContent?.trim()||'';
const divisionButtons=()=>[...document.querySelectorAll('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button')];
function tagButtons(){
  divisionButtons().forEach(btn=>{
    const value=valueOf(btn);
    if(D.includes(value))btn.dataset.kvlDivision=value;
  });
}
function renderStandingTabs(){
  const root=document.getElementById('scStandingTabs');
  if(!root)return;
  if(!root.children.length){
    root.innerHTML=D.map(value=>`<button type="button" data-kvl-division="${value}">${value}</button>`).join('');
  }
  [...root.children].forEach(btn=>btn.classList.toggle('is-active',valueOf(btn)===current));
}
function filterBrackets(){
  const root=document.getElementById('scBrackets');
  if(!root)return;
  root.querySelectorAll('.sc-bracket').forEach(card=>{
    const title=card.querySelector(':scope>h3')?.textContent.trim()||'';
    card.hidden=title!==current;
  });
}
function clickMatching(selector){
  const btn=[...document.querySelectorAll(selector)].find(x=>valueOf(x)===current);
  if(btn&&!btn.classList.contains('is-active'))btn.click();
}
function finishReady(){
  tagButtons();
  renderStandingTabs();
  filterBrackets();
  document.body.dataset.kvlDivisionReady='1';
}
function sync(value){
  if(!D.includes(value))return;
  current=value;
  state?.set?.(current);
  syncing=true;
  try{
    tagButtons();
    clickMatching('#scCalendar [data-calendar-division]');
    clickMatching('#scDivisionTabs button');
    clickMatching('#scTeamTabs button');
  }finally{syncing=false;}
  requestAnimationFrame(finishReady);
}
function queueSync(value){
  current=D.includes(value)?value:current;
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;sync(current);});
}
document.addEventListener('click',event=>{
  if(syncing)return;
  const btn=event.target.closest('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button');
  if(!btn)return;
  const value=valueOf(btn);
  if(D.includes(value))queueSync(value);
});
const root=document.querySelector('.sc-main');
if(root)new MutationObserver(()=>{tagButtons();filterBrackets();}).observe(root,{childList:true,subtree:true});
tagButtons();
renderStandingTabs();
sync(current);
})();

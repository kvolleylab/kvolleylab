(()=>{
'use strict';
const WOMEN='여대부';
const MEN='남대부';
const STORAGE_KEY='kvl:gosung-2026:gender';
let syncing=false;

const valueOf=btn=>btn?.dataset.calendarDivision||btn?.dataset.division||btn?.dataset.standingDivision||'';
const themeOf=value=>value===WOMEN?'women':'men';
const storedValue=()=>sessionStorage.getItem(STORAGE_KEY)===WOMEN?WOMEN:MEN;
const store=value=>sessionStorage.setItem(STORAGE_KEY,value===WOMEN?WOMEN:MEN);
const apply=value=>{
  if(!document.body?.classList.contains('competition-dashboard-page'))return;
  document.body.dataset.kvlGenderTheme=themeOf(value);
};
const controls=()=>[...document.querySelectorAll('button[data-calendar-division],button[data-division],button[data-standing-division]')];
const dashboardReady=()=>Boolean(
  document.querySelector('#cdCalendar .cd-cal-month')&&
  document.querySelector('#cdResults .cd-date-group,#cdResults .cd-empty')&&
  document.querySelector('#cdPodium .cd-rank')
);
const syncControls=value=>{
  if(syncing||!dashboardReady())return false;
  syncing=true;
  try{
    controls().filter(btn=>valueOf(btn)===value&&!btn.classList.contains('is-active')).forEach(btn=>btn.click());
  }finally{
    syncing=false;
  }
  return true;
};
const restore=()=>{
  const value=storedValue();
  apply(value);
  if(syncControls(value))return;
  const root=document.querySelector('.cd-main');
  if(!root)return;
  const observer=new MutationObserver(()=>{
    if(syncControls(value))observer.disconnect();
  });
  observer.observe(root,{childList:true,subtree:true});
  window.setTimeout(()=>observer.disconnect(),8000);
};
const bind=()=>{
  apply(storedValue());
  controls().forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(syncing)return;
      const value=valueOf(btn);
      if(value!==WOMEN&&value!==MEN)return;
      store(value);
      apply(value);
      requestAnimationFrame(()=>syncControls(value));
    });
  });
  restore();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

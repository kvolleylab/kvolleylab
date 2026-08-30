(()=>{
'use strict';
if(document.body?.dataset.competition!=='cbs-2026')return;
const D=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
const COUNTS={'18세이하 남자부':20,'18세이하 여자부':12,'15세이하 남자부':20,'15세이하 여자부':14};
const state=window.KVL_SCHOOL_DIVISION_STATE;
const params=new URLSearchParams(location.search);
const view=params.get('view')||'overview';
let current=state?.get?.()||params.get('division')||'';
if(!D.includes(current))current=D[0];

document.querySelectorAll('.sc-view').forEach(el=>el.classList.toggle('is-active',el.id===view));
document.querySelectorAll('.sc-nav a').forEach(a=>a.classList.toggle('is-active',a.dataset.view===view));

function syncDivision(value){
  if(D.includes(value))current=value;
  state?.set?.(current);
  document.querySelectorAll('[data-kvl-division]').forEach(btn=>{
    btn.classList.toggle('is-active',btn.dataset.kvlDivision===current);
  });
  document.querySelectorAll('[data-cbs-division-label]').forEach(el=>{el.textContent=current;});
  document.querySelectorAll('[data-cbs-division-count]').forEach(el=>{el.textContent=String(COUNTS[current]||'');});
}

document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-kvl-division]');
  if(!btn)return;
  const value=btn.dataset.kvlDivision;
  if(D.includes(value))syncDivision(value);
});

syncDivision(current);
})();

(()=>{
'use strict';
const WOMEN='여대부';
const MEN='남대부';
const valueOf=btn=>btn?.dataset.calendarDivision||btn?.dataset.division||btn?.dataset.standingDivision||'';
const apply=value=>{
  if(!document.body?.classList.contains('competition-dashboard-page'))return;
  document.body.dataset.kvlGenderTheme=value===WOMEN?'women':'men';
};
const bind=()=>{
  apply(MEN);
  document.querySelectorAll('button[data-calendar-division],button[data-division],button[data-standing-division]').forEach(btn=>{
    btn.addEventListener('click',()=>apply(valueOf(btn)));
  });
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

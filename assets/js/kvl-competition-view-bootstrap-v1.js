/* K-Volley Lab · common competition view bootstrap v1
 * Keeps tab/view activation independent from competition data loading.
 * Women prototype overview KPI cards mirror the men prototype navigation behavior.
 */
(()=>{
'use strict';
const ALLOWED=new Set(['overview','schedule','groups','knockout','rosters','resources']);
const WOMEN_KPI_TARGETS=['?view=rosters&team=KOR','?view=groups','?view=schedule','?view=knockout'];
function currentView(){
  const requested=new URLSearchParams(location.search).get('view')||'overview';
  return ALLOWED.has(requested)?requested:'overview';
}
function enhanceWomenOverviewKpis(){
  if(!document.body.classList.contains('kvl1180-women-template'))return;
  const cards=document.querySelectorAll('.kvl1180-view[data-view="overview"] .kvl1180-kpis .kvl1180-kpi:not(.is-venue)');
  cards.forEach((card,index)=>{
    const target=WOMEN_KPI_TARGETS[index];
    if(!target)return;
    card.dataset.kvlTarget=target;
    card.setAttribute('role','link');
    card.setAttribute('tabindex','0');
    const label=card.querySelector('.kvl1180-kpi-copy>span')?.textContent?.trim()||'대회 정보';
    card.setAttribute('aria-label',`${label} 페이지로 이동`);
    if(card.dataset.kvlBound==='1')return;
    card.dataset.kvlBound='1';
    card.addEventListener('click',()=>{location.href=card.dataset.kvlTarget});
    card.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      location.href=card.dataset.kvlTarget;
    });
  });
}
function apply(){
  const view=currentView();
  document.querySelectorAll('.kvl1180-view[data-view]').forEach(el=>{
    el.hidden=el.dataset.view!==view;
  });
  document.querySelectorAll('.kvl1180-tabs a[data-view]').forEach(a=>{
    const active=a.dataset.view===view;
    a.classList.toggle('is-active',active);
    if(active)a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  enhanceWomenOverviewKpis();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();
window.addEventListener('popstate',apply);
})();

/* K-Volley Lab · common competition view bootstrap v1
 * Keeps tab/view activation independent from competition data loading.
 */
(()=>{
'use strict';
const ALLOWED=new Set(['overview','schedule','groups','knockout','rosters','resources']);
function currentView(){
  const requested=new URLSearchParams(location.search).get('view')||'overview';
  return ALLOWED.has(requested)?requested:'overview';
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
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();
window.addEventListener('popstate',apply);
})();

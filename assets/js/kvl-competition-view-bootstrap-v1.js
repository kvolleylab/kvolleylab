/* K-Volley Lab · common competition view bootstrap v1
 * Keeps tab/view activation independent from competition data loading.
 * Women prototype overview KPI cards mirror the men prototype navigation behavior.
 * Production AVC women URL reuses the validated prototype surface without prototype-link leakage.
 */
(()=>{
'use strict';
const ALLOWED=new Set(['overview','schedule','groups','knockout','rosters','resources']);
const WOMEN_KPI_TARGETS=['?view=rosters&team=KOR','?view=groups','?view=schedule','?view=knockout'];
const WOMEN_KPI_STYLE='assets/css/kvl-avc-women-kpi-interaction-v1.css?v=20260915-1';
const WOMEN_PRODUCTION_HERO_STYLE='assets/css/kvl-avc-women-production-hero-v1.css?v=20260915-1';
const PROD_MEN='international-competition-avc-men-continental-2026.html';
const PROD_WOMEN='international-competition-avc-women-continental-2026.html';
const PROTO_MEN='international-competition-avc-men-continental-2026-pc-hybrid-1180.html';
const PROTO_WOMEN='international-competition-avc-women-continental-2026-pc-hybrid-1180.html';
const isProductionWomen=location.pathname.endsWith(`/${PROD_WOMEN}`)||location.pathname.endsWith(PROD_WOMEN);
function currentView(){
  const requested=new URLSearchParams(location.search).get('view')||'overview';
  return ALLOWED.has(requested)?requested:'overview';
}
function ensureProductionWomenHeroStyle(){
  if(!isProductionWomen)return;
  if(document.getElementById('kvl-avc-women-production-hero-v1'))return;
  const link=document.createElement('link');
  link.id='kvl-avc-women-production-hero-v1';
  link.rel='stylesheet';
  link.href=WOMEN_PRODUCTION_HERO_STYLE;
  document.head.appendChild(link);
}
function normalizeProductionWomen(){
  if(!isProductionWomen||!document.body.classList.contains('kvl1180-women-template'))return;
  document.body.dataset.kvlGender='women';
  document.body.dataset.kvlFamily='avc';
  ensureProductionWomenHeroStyle();
  document.title='AVC 여자 대륙선수권 2026 | K-Volley Lab';
  const description=document.querySelector('meta[name="description"]');
  if(description)description.setAttribute('content','AVC Volleyball Women\'s Continental Championship 2026의 경기결과, 조별순위, 최종순위, 참가국과 공식자료를 확인하세요.');
  const rewriteAnchor=anchor=>{
    if(!anchor||!anchor.getAttribute)return;
    const raw=anchor.getAttribute('href')||'';
    let next=raw;
    if(raw.includes(PROTO_MEN))next=raw.replace(PROTO_MEN,PROD_MEN);
    if(raw.includes(PROTO_WOMEN))next=raw.replace(PROTO_WOMEN,PROD_WOMEN);
    if(next!==raw)anchor.setAttribute('href',next);
  };
  document.querySelectorAll('a[href]').forEach(rewriteAnchor);
  if(document.body.dataset.kvlProductionLinksBound)return;
  document.body.dataset.kvlProductionLinksBound='1';
  const observer=new MutationObserver(mutations=>{
    mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      if(node.matches?.('a[href]'))rewriteAnchor(node);
      node.querySelectorAll?.('a[href]').forEach(rewriteAnchor);
    }));
  });
  observer.observe(document.body,{childList:true,subtree:true});
}
function ensureWomenKpiStyle(){
  if(!document.body.classList.contains('kvl1180-women-template'))return;
  if(document.getElementById('kvl-avc-women-kpi-interaction-v1'))return;
  const link=document.createElement('link');
  link.id='kvl-avc-women-kpi-interaction-v1';
  link.rel='stylesheet';
  link.href=WOMEN_KPI_STYLE;
  document.head.appendChild(link);
}
function enhanceWomenOverviewKpis(){
  if(!document.body.classList.contains('kvl1180-women-template'))return;
  ensureWomenKpiStyle();
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
  normalizeProductionWomen();
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

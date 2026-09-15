/* K-Volley Lab · AVC men mobile parity v1
 * 2026-09-14
 * - overview KPI cards navigate to their related views
 * - mobile preliminary combined ranking mirrors the AVC women mobile ordering/geometry
 * - dynamic sections receive stable ids for mobile styling
 * - hero card receives a lightweight CSS-drawn volleyball/net visual (no image asset)
 * - production URL reuses the validated prototype surface without leaking prototype links
 */
(()=>{
'use strict';
const body=document.body;
if(!body||!body.matches('.kvl1180-prototype[data-avc-gender="men"]'))return;
const view=name=>document.querySelector(`.kvl1180-view[data-view="${name}"]`);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const PROD_MEN='international-competition-avc-men-continental-2026.html';
const PROD_WOMEN='international-competition-avc-women-continental-2026.html';
const PROTO_MEN='international-competition-avc-men-continental-2026-pc-hybrid-1180.html';
const PROTO_WOMEN='international-competition-avc-women-continental-2026-pc-hybrid-1180.html';
const isProductionMen=location.pathname.endsWith(`/${PROD_MEN}`)||location.pathname.endsWith(PROD_MEN);

function normalizeProductionShell(){
  if(!isProductionMen)return;
  body.dataset.kvlGender='men';
  body.dataset.kvlFamily='avc';
  document.title='AVC 남자 대륙선수권 2026 | K-Volley Lab';
  const description=document.querySelector('meta[name="description"]');
  if(description)description.setAttribute('content','AVC Volleyball Men\'s Continental Championship 2026의 대회정보, 경기일정, 조별순위, 최종순위, 참가국과 공식자료를 확인하세요.');
  const status=document.querySelector('.kvl1180-hero-status span:first-child');
  if(status)status.textContent='대회 종료';
  const rewriteAnchor=anchor=>{
    if(!anchor||!anchor.getAttribute)return;
    const raw=anchor.getAttribute('href')||'';
    let next=raw;
    if(raw.includes(PROTO_MEN))next=raw.replace(PROTO_MEN,PROD_MEN);
    if(raw.includes(PROTO_WOMEN))next=raw.replace(PROTO_WOMEN,PROD_WOMEN);
    if(next!==raw)anchor.setAttribute('href',next);
  };
  document.querySelectorAll('a[href]').forEach(rewriteAnchor);
  if(body.dataset.kvlProductionLinksBound)return;
  body.dataset.kvlProductionLinksBound='1';
  const observer=new MutationObserver(mutations=>{
    mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      if(node.matches?.('a[href]'))rewriteAnchor(node);
      node.querySelectorAll?.('a[href]').forEach(rewriteAnchor);
    }));
  });
  observer.observe(body,{childList:true,subtree:true});
}

function injectHeroArt(){
  if(document.getElementById('kvl-avc-men-hero-art-v1'))return;
  const style=document.createElement('style');
  style.id='kvl-avc-men-hero-art-v1';
  style.textContent=`
body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero{
  isolation:isolate;
  background:
    radial-gradient(circle at 82% 22%,rgba(83,211,139,.22) 0 10%,rgba(83,211,139,0) 32%),
    linear-gradient(112deg,#07512f 0%,#0b7442 55%,#13945a 100%);
}
body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero::before{
  content:"";
  position:absolute;
  z-index:0;
  left:auto;
  right:-3%;
  top:auto;
  bottom:-44px;
  width:48%;
  height:145px;
  background:
    repeating-linear-gradient(0deg,transparent 0 19px,rgba(255,255,255,.10) 20px 21px),
    repeating-linear-gradient(90deg,transparent 0 29px,rgba(255,255,255,.075) 30px 31px);
  border-top:2px solid rgba(255,255,255,.16);
  transform:rotate(-7deg) skewX(-7deg);
  transform-origin:right bottom;
  opacity:.78;
  pointer-events:none;
}
body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero::after{
  content:"";
  position:absolute;
  z-index:0;
  top:22px;
  right:13%;
  width:126px;
  height:126px;
  border:2px solid rgba(255,244,191,.44);
  border-radius:50%;
  background:
    radial-gradient(circle at 50% -8%,transparent 0 42%,rgba(4,74,44,.78) 43% 47%,transparent 48%),
    radial-gradient(circle at -8% 52%,transparent 0 43%,rgba(4,74,44,.75) 44% 48%,transparent 49%),
    radial-gradient(circle at 108% 58%,transparent 0 43%,rgba(4,74,44,.72) 44% 48%,transparent 49%),
    radial-gradient(circle at 31% 24%,rgba(255,255,255,.34),transparent 19%),
    linear-gradient(145deg,#f5d66c 0%,#dfb73c 52%,#c08b1d 100%);
  box-shadow:0 12px 26px rgba(0,45,28,.26),0 0 0 12px rgba(255,255,255,.018);
  transform:rotate(14deg);
  opacity:.88;
  pointer-events:none;
}
body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero-copy,
body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero-status{z-index:2}
@media(max-width:900px) and (min-width:681px){
  body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero::after{right:10%;width:108px;height:108px;opacity:.72}
  body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero::before{width:44%;opacity:.58}
}
@media(max-width:680px){
  body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero{
    background:
      radial-gradient(circle at 92% 24%,rgba(90,220,145,.18) 0 11%,rgba(90,220,145,0) 30%),
      linear-gradient(145deg,#075a34 0%,#0b7544 58%,#128a52 100%);
  }
  body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero::after{
    top:66px;
    right:-18px;
    width:86px;
    height:86px;
    border-width:1px;
    opacity:.30;
    box-shadow:none;
  }
  body.kvl1180-prototype[data-avc-gender="men"] .kvl1180-hero::before{
    right:-11%;
    bottom:-35px;
    width:50%;
    height:104px;
    opacity:.35;
  }
}
`;
  document.head.appendChild(style);
}

function ensureViewIds(){
  const ids={overview:'overview',schedule:'schedule',groups:'groups',knockout:'knockout',rosters:'rosters',resources:'resources'};
  Object.entries(ids).forEach(([name,id])=>{const el=view(name);if(el&&!el.id)el.id=id});
}

function syncOverviewResultSpacing(){
  const result=document.querySelector('.kvl1180-view[data-view="overview"][aria-labelledby="snapshotTitle"] .kvl1180-overview-result');
  if(!result)return;
  const champion=result.querySelector('strong');
  const qualification=result.querySelector('span');
  result.style.setProperty('line-height','1.22','important');
  if(champion)champion.style.setProperty('line-height','18px','important');
  if(qualification){
    qualification.style.setProperty('margin-top','3px','important');
    qualification.style.setProperty('line-height','16px','important');
  }
}

function enhanceOverviewKpis(){
  const root=document.querySelector('.kvl1180-view[data-view="overview"] .kvl1180-kpis');
  if(!root)return;
  const targets=['?view=rosters&team=KOR','?view=groups','?view=schedule','?view=knockout'];
  [...root.querySelectorAll('.kvl1180-kpi:not(.is-venue)')].slice(0,4).forEach((card,index)=>{
    if(card.dataset.kvlTarget)return;
    card.dataset.kvlTarget=targets[index];
    card.tabIndex=0;
    card.setAttribute('role','link');
    card.setAttribute('aria-label',`${card.textContent.replace(/\s+/g,' ').trim()} 페이지로 이동`);
  });
  if(root.dataset.kvlNavBound)return;
  root.dataset.kvlNavBound='1';
  root.addEventListener('click',event=>{
    const card=event.target.closest('.kvl1180-kpi[data-kvl-target]');
    if(card)location.href=card.dataset.kvlTarget;
  });
  root.addEventListener('keydown',event=>{
    const card=event.target.closest('.kvl1180-kpi[data-kvl-target]');
    if(!card||(event.key!=='Enter'&&event.key!==' '))return;
    event.preventDefault();
    location.href=card.dataset.kvlTarget;
  });
}

function mobileCombinedMarkup(source){
  const rows=[...source.querySelectorAll('.kvl1180-combined-row')];
  const rowHtml=rows.map((row,index)=>{
    const rank=row.querySelector('.kvl1180-combined-rank')?.textContent.trim()||`${index+1}위`;
    const team=row.querySelector('.kvl1180-combined-team-copy strong')?.textContent.trim()||'';
    const flag=row.querySelector('.kvl1180-combined-team img')?.getAttribute('src')||'';
    const poolRank=row.querySelector('.kvl1180-combined-pool')?.textContent.trim()||'';
    const stats=[...row.querySelectorAll('.kvl1180-combined-stat')].map(el=>el.textContent.trim());
    const wins=stats[0]||'0',points=stats[2]||'0',setRatio=stats[3]||'0.000',pointRatio=stats[4]||'0.000';
    const result=row.querySelector('.kvl1180-combined-result');
    const qualified=Boolean(result?.classList.contains('is-qualified'));
    const seed=index+1;
    const detail=qualified&&seed<=8?`${seed}-${9-seed}`:'';
    const resultHtml=qualified
      ? `<span class="kvl-shared-combined-result"><b>8강 진출</b><small>${detail}</small></span>`
      : '<span class="kvl-shared-combined-result is-out"><b>조별리그 탈락</b></span>';
    return `<div class="kvl-shared-combined-line${team==='대한민국'?' is-korea':''}" role="row"><span class="kvl-shared-combined-identity"><span class="kvl-shared-combined-rank">${esc(rank)}</span><span class="kvl-shared-combined-flag kvl-comp-flag-cell">${flag?`<img src="${esc(flag)}" alt="${esc(team)} 국기" loading="lazy">`:''}</span><strong class="kvl-shared-combined-team">${esc(team)}</strong></span>${resultHtml}<span class="kvl-shared-combined-stat">${esc(wins)}승</span><span class="kvl-shared-combined-stat">${esc(points)}</span><span class="kvl-shared-combined-stat">${esc(setRatio)}</span><span class="kvl-shared-combined-stat">${esc(pointRatio)}</span><span class="kvl-shared-combined-stat">${esc(poolRank)}</span></div>`;
  }).join('');
  const head='<div class="kvl-shared-combined-line is-head" role="row"><span class="kvl-shared-combined-identity is-head-identity" role="presentation"><span class="kvl-shared-combined-rank-head" role="columnheader">종합순위</span><span class="kvl-shared-combined-country-head" role="columnheader" aria-label="국기 및 국가">국가</span></span><span role="columnheader">결과</span><span role="columnheader">승리 경기수</span><span role="columnheader">승점</span><span role="columnheader">세트 득실률</span><span role="columnheader">득점 득실률</span><span role="columnheader">조순위</span></div>';
  return `<div class="kvl-shared-combined-table is-complete" role="table" aria-label="예선 종합순위" data-kvl-common-component="combined-ranking-v1" data-state="complete">${head}${rowHtml}</div>`;
}

function syncCombinedRanking(){
  const section=view('groups');
  if(!section)return;
  if(!section.id)section.id='groups';
  const source=section.querySelector('.kvl1180-combined-table');
  if(!source)return;
  const signature=[...source.querySelectorAll('.kvl1180-combined-row')].map(row=>row.textContent.replace(/\s+/g,' ').trim()).join('|');
  let host=section.querySelector('.kvl-shared-combined-mobile');
  if(!host){
    host=document.createElement('div');
    host.className='kvl-shared-combined-mobile';
    source.insertAdjacentElement('afterend',host);
  }
  if(host.dataset.signature===signature)return;
  host.dataset.signature=signature;
  host.innerHTML=mobileCombinedMarkup(source);
}

function init(){
  normalizeProductionShell();
  injectHeroArt();
  ensureViewIds();
  syncOverviewResultSpacing();
  enhanceOverviewKpis();
  syncCombinedRanking();
  const groups=view('groups');
  if(groups){
    const observer=new MutationObserver(()=>{ensureViewIds();syncCombinedRanking()});
    observer.observe(groups,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
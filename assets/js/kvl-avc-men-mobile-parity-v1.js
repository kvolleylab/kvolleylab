/* K-Volley Lab · AVC men mobile parity v1
 * 2026-09-14
 * - overview KPI cards navigate to their related views
 * - mobile preliminary combined ranking mirrors the AVC women mobile ordering/geometry
 * - dynamic sections receive stable ids for mobile styling
 */
(()=>{
'use strict';
const body=document.body;
if(!body||!body.matches('.kvl1180-prototype[data-avc-gender="men"]'))return;
const view=name=>document.querySelector(`.kvl1180-view[data-view="${name}"]`);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

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
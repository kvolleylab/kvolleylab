/* K-Volley Lab roster standard prototype v1.
 * Branch-only visual prototype. Does not write member data or alter production sources.
 */
(function(){
 'use strict';
 const fmtDate=value=>{
  const raw=String(value||'').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.replaceAll('-','.'):(raw||'—');
 };
 const average=rows=>{
  const values=(rows||[]).map(p=>Number(p?.heightCm||p?.height||0)).filter(v=>Number.isFinite(v)&&v>0);
  return values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)+'cm':'—';
 };
 function kpiMarkup(total,avg){
  return '<section class="kvl-roster-kpis" aria-label="선수명단 요약">'+
   '<article><span>선수 인원</span><strong>'+String(total??0)+'명</strong></article>'+
   '<article><span>평균 신장</span><strong>'+avg+'</strong></article>'+
   '<article class="is-private"><span>관심선수</span><strong>—</strong><small>회원 연동</small></article>'+
   '<article class="is-private"><span>메모선수</span><strong>—</strong><small>회원 연동</small></article>'+
   '</section>';
 }
 function decoratePro(host,players){
  const root=host?.querySelector?.('[data-vleague-roster-v2]');
  if(!root)return;
  root.classList.add('kvl-roster-standard-prototype','is-pro');
  if(!root.querySelector('.kvl-roster-kpis')){
   const header=root.querySelector('.kvlrv2-header');
   header?.insertAdjacentHTML('afterend',kpiMarkup(players.length,average(players)));
  }
  const head=root.querySelector('.kvlrv2-head');
  if(head){
   head.innerHTML='<span>NO.</span><span>선수명</span><span>POS</span><span>생년월일</span><span>신장</span>';
  }
  const map=new Map((players||[]).map(p=>[String(p.number)+'/'+String(p.name),p]));
  const rows=root.querySelector('[data-rows]');
  const paint=()=>{
   rows?.querySelectorAll?.('[data-choice]').forEach(row=>{
    const children=[...row.children];
    if(children[2])children[2].classList.add('kvlrv2-pos');
    const height=children.find(el=>el.classList?.contains('kvlrv2-height'))||children[3];
    if(height)height.classList.add('kvlrv2-height');
    if(row.querySelector('.kvlrv2-dob'))return;
    const p=map.get(row.dataset.choice)||null;
    const dob=document.createElement('span');
    dob.className='kvlrv2-dob';
    dob.textContent=fmtDate(p?.dob);
    if(height)row.insertBefore(dob,height);else row.appendChild(dob);
   });
  };
  paint();
  if(rows){
   const observer=new MutationObserver(paint);
   observer.observe(rows,{childList:true});
   root._kvlRosterPrototypeObserver?.disconnect?.();
   root._kvlRosterPrototypeObserver=observer;
  }
 }
 function wrapPro(){
  const api=window.KVLVLeagueRosterV2;
  if(!api||api.__kvlRosterPrototypeWrapped)return;
  const original=api.render.bind(api);
  api.render=function(host,d,team,players){
   const result=original(host,d,team,players);
   if(result)decoratePro(host,players||[]);
   return result;
  };
  api.__kvlRosterPrototypeWrapped=true;
 }
 function decorateInternational(host,model){
  const root=host?.querySelector?.('.kvl-unified');
  if(!root)return;
  root.classList.add('kvl-roster-standard-prototype','is-international');
  if(!root.querySelector('.kvl-roster-kpis')){
   const top=root.querySelector('.kvl-unified-top');
   top?.insertAdjacentHTML('afterend',kpiMarkup(model?.total??model?.rows?.length??0,average(model?.rows||[])));
  }
  // Preserve the current international roster strengths:
  // Korean + English names, club/league, VB→ and tournament history.
 }
 function wrapInternational(){
  const api=window.KVLInternationalUnifiedRosterV1;
  if(!api||api.__kvlRosterPrototypeWrapped)return;
  const original=api.render.bind(api);
  api.render=function(host,model){
   const instance=original(host,model);
   decorateInternational(host,model);
   return instance;
  };
  api.__kvlRosterPrototypeWrapped=true;
 }
 function start(){
  wrapPro();
  wrapInternational();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
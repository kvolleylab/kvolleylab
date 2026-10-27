(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=document.getElementById('comprehensiveRecords'),featured=document.getElementById('comprehensiveFeatured');
if(!root)return;
const read=async path=>{const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error('Unable to load '+path);return r.json();};
const trophy=rank=>`<span class="univ-medal"><span class="dv2-trophy trophy-${rank}" aria-hidden="true"><svg viewBox="0 0 28 30" width="28" height="30"><path class="trophy-handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path class="trophy-cup" d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="trophy-shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path class="trophy-stem" d="M12 18h4v6h-4z"/><path class="trophy-base" d="M9 24h10l2 3H7z"/></svg></span></span>`;
const date=value=>String(value||'').replaceAll('-','.');
const detailUrl=(item,slug,view='overview')=>`${item.pagePath}?competition=${encodeURIComponent(slug||item.divisions[0])}&view=${view}`;
const period=item=>`${date(item.startDate)} ~ ${date(item.endDate)}`;
async function loadEvent(item){
 const divisions=await Promise.all(item.divisions.map(async slug=>{
  try{const base=`data/competitions/${slug}/`,config=await read(base+'config.json'),data=await read(base+config.data);return {slug,config,data};}
  catch(error){console.error(error);return {slug,error:true};}
 }));
 const dates=divisions.flatMap(d=>(d.data?.matches||[]).map(m=>m.date)).filter(Boolean).sort();
 // Dates and medal rows come from the same snapshots as the detail page.
 return {...item,startDate:dates[0]||item.startDate,endDate:dates.at(-1)||item.endDate,loadedDivisions:divisions};
}
function featuredCard(item){
 const hero=item.loadedDivisions.find(d=>d.config)?.config.hero||{};
 const image=hero.mobileImage||hero.pcImage||'',position=hero.mobilePosition||'center center';
 const style=`--featured-image:url('${image.replace(/["'\\]/g,'')}');--featured-position:${/^[\w% .-]+$/.test(position)?position:'center center'}`;
 return `<a class="univ-featured-card" href="${esc(detailUrl(item))}" style="${esc(style)}"><span class="univ-featured-badge">${esc(item.edition)} · ${esc(item.location)}</span><div class="univ-featured-content"><p class="univ-featured-year">${esc(item.year)} · 종합대회</p><h3>${esc(item.shortName)}</h3><div class="univ-featured-meta"><span>${esc(period(item))}</span><span>${esc(item.featuredSummary||item.divisionSummary)}</span></div><div class="univ-featured-foot"><span>${item.divisions.length}개 부문 · 대회 한눈에 보기</span><span class="univ-featured-arrow" aria-hidden="true">→</span></div></div></a>`;
}
function divisionPanel(item,division){
 const c=division.config,d=division.data,gender=c?.competition.gender||(division.slug.includes('-women-')?'women':'men'),label=c?.structure.divisionLabel||'부문 정보';
 if(division.error)return `<div class="univ-ranking-panel"><div class="univ-rank-empty">부문 기록을 불러오지 못했습니다.<br>새로고침해 주세요.</div></div>`;
 const ranks=(d.finalRanking||[]).filter(r=>Number(r.rank)<=3).sort((a,b)=>a.rank-b.rank);
 const rows=ranks.map(r=>{const tied=ranks.filter(x=>x.rank===r.rank).length>1,region=(d.participants||[]).find(t=>t.code===r.code)?.region;return `<div class="univ-rank-row">${trophy(Number(r.rank))}<span class="univ-rank-label">${tied?'공동 ':''}${r.rank}위</span><span class="comprehensive-rank-team">${region?`<span class="comprehensive-region" aria-label="대표 지역 ${esc(region)}">${esc(region)}</span>`:''}<strong>${esc(r.team)}</strong></span></div>`;}).join('');
 return `<a class="univ-ranking-panel is-${gender}" href="${esc(detailUrl(item,division.slug))}" aria-label="${esc(item.shortName+' '+label+' 보기')}"><div class="univ-ranking-head"><strong>${esc(label)}</strong><span class="comprehensive-division-arrow" aria-hidden="true">›</span></div><div class="univ-ranking-body">${rows||'<div class="univ-rank-empty">공식 입상 기록 확인 중</div>'}</div></a>`;
}
function recordCard(item){
 const href=detailUrl(item),status=item.loadedDivisions.every(d=>d.data?.status==='completed')?'대회 종료':'기록 확인 중';
 return `<article class="univ-record-card is-clickable" data-overview-url="${esc(href)}" aria-labelledby="record-${esc(item.id)}"><div class="univ-record-info"><div class="univ-record-top"><span class="univ-series is-federation">${esc(item.edition)}</span><span class="univ-status is-complete">${status}</span></div><h3 id="record-${esc(item.id)}"><a href="${esc(href)}">${esc(item.shortName)}</a></h3><p class="univ-record-meta"><span class="univ-meta-icon" aria-hidden="true">▣</span><span>${esc(period(item))} · 배구 경기기간</span></p><p class="univ-record-meta"><span class="univ-meta-icon" aria-hidden="true">⌖</span><span>${esc(item.location)}</span></p><a class="univ-record-link" href="${esc(href)}">대회 한눈에 보기 <span aria-hidden="true">→</span></a></div><div class="comprehensive-divisions${item.divisions.length===4?' has-four':''}">${item.loadedDivisions.map(d=>divisionPanel(item,d)).join('')}</div><p class="comprehensive-record-footer">${esc(item.divisionSummary)} · 공동 3위는 두 팀을 모두 표시합니다.</p></article>`;
}
function yearBlock(year,items,open){
 const content=items.length?`<div class="univ-record-list">${items.map(recordCard).join('')}</div>`:'<div class="univ-year-placeholder">아직 등록된 대회 기록이 없습니다.</div>';
 return `<section class="univ-year-block" data-year="${year}"><button class="univ-year-head" type="button" aria-expanded="${open}" aria-controls="records-${year}"><strong>${year}<span>대회 기록${items.length?' · '+items.length+'개 대회':''}</span></strong><span class="univ-year-chevron" aria-hidden="true">${open?'⌃':'⌄'}</span></button><div id="records-${year}" class="univ-year-details" ${open?'':'hidden'}>${content}</div></section>`;
}
async function init(){
 try{
  const index=await read('data/competitions/comprehensive-index.json?v=20261027-1'),items=await Promise.all(index.competitions.map(loadEvent));
  const sorted=items.sort((a,b)=>b.endDate.localeCompare(a.endDate));
  featured.innerHTML=sorted.slice(0,2).map(featuredCard).join('');
  const years=[...new Set([...index.archiveYears,...items.map(i=>i.year)])].sort((a,b)=>b-a);
  root.innerHTML=years.map((year,i)=>yearBlock(year,sorted.filter(item=>item.year===year),i===0)).join('');
  root.querySelectorAll('.univ-year-head').forEach(button=>button.addEventListener('click',()=>{
   const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));
   document.getElementById(button.getAttribute('aria-controls')).hidden=!open;button.querySelector('.univ-year-chevron').textContent=open?'⌃':'⌄';
  }));
  root.addEventListener('click',event=>{const card=event.target.closest('[data-overview-url]');if(card&&!event.target.closest('a,button')&&!window.getSelection()?.toString())location.href=card.dataset.overviewUrl;});
 }catch(error){console.error(error);featured.innerHTML='';root.innerHTML='<p class="univ-hub-note" role="alert">대회 기록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>';}
}
init();
})();

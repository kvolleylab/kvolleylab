import {CATEGORIES,groupByYear,selectItems,hubUrl,displayCard,todayKST} from './international-hub-model-v1.js?v=20261104-3';
import {resolveHeroSource,renderCard} from './international-hub-cards-v1.js';
import {categoryIcon} from './international-hub-icons-v1.js';
const root=document.getElementById('hubContent');
const params=new URLSearchParams(location.search);
const selectedYear=/^\d{4}$/.test(params.get('year')||'')?Number(params.get('year')):2026;
const category=params.get('category')||'';
const isList=params.get('view')==='all';
const categoryLabel=CATEGORIES.find(([key])=>key===category)?.[1];
const today=todayKST();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(year,category='',all=false)=>hubUrl(location.pathname,{year,category,all});
function shortcuts(){
 const links = CATEGORIES.map(([key, label, edition]) => {
   const active = category === key;
   const lines = [edition.nextLabel, edition.nextCompetitionName]
     .filter(Boolean)
     .map(line => `<span>${esc(line)}</span>`)
     .join('');
   return `<a class="hub-shortcut" href="${url(undefined, active ? '' : key)}"
       aria-label="${esc(active ? label + ' 선택 해제' : label)}" aria-describedby="edition-${key}"${active ? ' aria-current="true"' : ''}>
     <span class="hub-shortcut-icon">${categoryIcon(key)}</span>
     <span class="hub-shortcut-copy">
       <span class="hub-shortcut-label">${esc(label)}</span>
       <span class="hub-next-edition" id="edition-${key}">${lines}</span>
     </span>
   </a>`;
 }).join('');
 return '<section class="hub-navigation" aria-labelledby="hub-category-heading"><div class="hub-navigation-heading"><h2 id="hub-category-heading">대회 종류</h2>'+(category?'<a class="hub-reset" href="'+url()+'">국제대회 홈 <span aria-hidden="true">↗</span></a>':'')+'</div><nav class="hub-shortcuts" aria-label="국제대회 전체 연도 대회 종류">'+links+'</nav></section>';
}
const mediaCache=new Map(),detailCache=new Map();
async function fetchJSON(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
function media(item){if(!mediaCache.has(item.id))mediaCache.set(item.id,resolveHeroSource(item).catch(()=>({})));return mediaCache.get(item.id);}
function detail(item){
 if(!detailCache.has(item.id))detailCache.set(item.id,(async()=>{
  if(item.hero?.mode!=='competition-config')return null;
  const config=await fetchJSON(item.hero.config);
  const path=item.hero.data||new URL(config.data||'data.json',new URL(item.hero.config,location.href)).href;
  return fetchJSON(path);
 })().catch(()=>null));return detailCache.get(item.id);
}
async function fillGrid(grid,items,empty){
 if(!items.length){grid.innerHTML='<p class="hub-empty">'+esc(empty)+'</p>';return;}
 // Titles and dates are immediately usable; media and current detail hydrate in place.
 grid.replaceChildren(...items.map(item=>renderCard(displayCard(item,null,today))));
 await Promise.all(items.map(async(item,i)=>{
  const [photo,data]=await Promise.all([media(item),detail(item)]);
  const card=renderCard(displayCard(item,data,today),photo);
  const old=grid.children[i];if(old)old.replaceWith(card);
 }));
 grid.dataset.loaded='true';
}
function yearBlock(year,open,count){
 return '<section class="hub-year" data-year="'+year+'"><div class="hub-year-heading"><h2><button class="hub-year-toggle" type="button" aria-expanded="'+open+'" aria-controls="year-'+year+'"><span>'+year+'년</span><svg class="hub-chevron" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button></h2>'+(count?'<a class="hub-all-link" href="'+url(year,category,true)+'">전체대회보기 <span aria-hidden="true">→</span></a>':'')+'</div><div class="hub-year-body" id="year-'+year+'"'+(open?'':' hidden')+'><div class="senior-featured-grid"></div></div></section>';
}
async function start(){
 root.setAttribute('aria-busy','true');
 try{
  const data=await fetchJSON('data/international/senior-competitions.json');
  if(!Array.isArray(data.competitions))throw Error('Invalid competition list');
  if(isList){
   const items=category&&!categoryLabel?[]:selectItems(data,{year:selectedYear,category,all:true,today});
   root.innerHTML=shortcuts()+'<section class="hub-list"><a class="hub-back" href="'+url(selectedYear,category)+'">← 연도별 '+esc(categoryLabel||'국제대회')+'</a><div class="hub-list-heading"><h2>'+selectedYear+'년 '+esc(categoryLabel||'전체 국제대회')+'</h2><span>'+items.length+'개 대회</span></div><div class="hub-list-controls"><p>예정 대회를 포함한 전체 등록 대회를 최신순으로 확인하세요.</p></div><div class="senior-featured-grid"></div></section>';
   await fillGrid(root.querySelector('.senior-featured-grid'),items,category&&!categoryLabel?'등록된 대회 종류가 아닙니다. 위에서 대회 종류를 선택해 주세요.':'등록된 대회가 없습니다.');
  }else{
   const groups=groupByYear(data,{category,selectedYear,today});
   root.innerHTML=shortcuts()+(category?'<div class="hub-filter-heading"><h2>'+esc(categoryLabel||'등록되지 않은 대회 종류')+'</h2><span>전체 연도 기록</span></div>':'')+'<div class="hub-years">'+groups.map(({year,count})=>yearBlock(year,year===selectedYear,count)).join('')+'</div>';
   const loadYear=async section=>{
    if(section.dataset.loaded)return;section.dataset.loaded='true';
    const group=groups.find(x=>x.year===Number(section.dataset.year));
    await fillGrid(section.querySelector('.senior-featured-grid'),group.items,category?'등록된 대회가 없습니다.':'검수 완료된 대회부터 순차적으로 추가됩니다.');
   };
   for(const section of root.querySelectorAll('.hub-year')){
    section.querySelector('button').addEventListener('click',()=>{
     const button=section.querySelector('button'),open=button.getAttribute('aria-expanded')!=='true';
     button.setAttribute('aria-expanded',String(open));section.querySelector('.hub-year-body').hidden=!open;
     if(open)loadYear(section);
    });
   }
   await loadYear(root.querySelector('[data-year="'+selectedYear+'"]'));
  }
  root.dataset.ready='true';
 }catch(error){
  root.innerHTML='<div class="hub-empty" role="alert">국제대회 기록을 불러오지 못했습니다.<br><button class="hub-retry" type="button">다시 시도</button></div>';
  root.querySelector('button').addEventListener('click',start);
 }finally{root.setAttribute('aria-busy','false');}
}
start();

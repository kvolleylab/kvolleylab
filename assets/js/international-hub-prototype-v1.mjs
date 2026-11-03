import {CATEGORIES,yearOf,selectItems,displayCard,todayKST} from './international-hub-model-v1.mjs';
import {resolveHeroSource,renderCard} from './international-hub-cards-prototype-v1.mjs';
const root=document.getElementById('hubContent');
const params=new URLSearchParams(location.search);
const selectedYear=/^\d{4}$/.test(params.get('year')||'')?Number(params.get('year')):2026;
const category=params.get('category')||'';
const isList=params.get('view')==='all'||Boolean(category);
const today=todayKST();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(year,category='',all=false)=>{
  const u=new URL(location.href);u.search='';u.hash='';
  u.searchParams.set('year',year);
  if(all)u.searchParams.set('view','all');
  if(category)u.searchParams.set('category',category);
  return u.pathname+u.search;
};
// Original KVL category pictograms: one 40px canvas, 1.7px strokes, no event logos.
const ball='<circle cx="28" cy="28" r="8"/><path d="M21 25q8-1 9 10M27 20q-3 7 8 9M21 32q3-5 12-8"/>';
const iconPaths={
 'olympic':'<path d="M12 18c-8-5-4-10 0-14 0 6 6 6 3 11-1 2-2 2-3 3ZM9 20h8l-2 15h-4L9 20ZM6 20h14"/>'+ball,
 'world-championship':'<circle cx="17" cy="17" r="13"/><path d="M4 17h26M17 4c-8 7-8 19 0 26M17 4c7 5 8 12 6 18M7 10h20M6 24h12"/>'+ball,
 'vnl':'<path d="M4 10h22M4 10v24M26 10v9M5 15h20M5 20h13M5 25h12M10 10v19M16 10v10M22 10v9"/>'+ball,
 'continental':'<circle cx="17" cy="17" r="13"/><path d="m8 8 6 2 2 6-5 4-5-3M22 7l-2 5 7 4M14 24l1 5M25 4l6 3 3 6"/>'+ball,
 'asian-games':'<path d="m5 13 4-7 8-2 4 4 7 1 3 6-7 1-2 5-5-3-3 7-5-4-1-6-3-2ZM5 32h10M9 28v8"/>'+ball,
 'multi-sport':'<path d="m6 4 5 14M14 4l5 14M5 4h9M23 4h8l-6 12M13 19a10 10 0 1 0 4 17"/><path d="m10 25 2 3 4-1-2 4 1 3-4-1-3 1 1-4-2-3Z"/>'+ball
};
function shortcuts(year,active=''){
 return '<nav class="hub-shortcuts" aria-label="'+year+'년 대회 종류">'+CATEGORIES.map(([key,label])=>
  '<a class="hub-shortcut" href="'+url(year,key)+'"'+(active===key?' aria-current="page"':'')+'><span class="hub-shortcut-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+iconPaths[key]+'</svg></span><span>'+label+'</span></a>').join('')+'</nav>';
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
 return '<section class="hub-year" data-year="'+year+'"><div class="hub-year-heading"><h2><button class="hub-year-toggle" type="button" aria-expanded="'+open+'" aria-controls="year-'+year+'"><span>'+year+'년</span><svg class="hub-chevron" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button></h2>'+(count?'<a class="hub-all-link" href="'+url(year,'',true)+'">전체대회보기 <span aria-hidden="true">→</span></a>':'')+'</div><div class="hub-year-body" id="year-'+year+'"'+(open?'':' hidden')+'><div class="senior-featured-grid"></div>'+shortcuts(year)+'</div></section>';
}
async function start(){
 root.setAttribute('aria-busy','true');
 try{
  const data=await fetchJSON('data/international/senior-competitions.json');
  if(!Array.isArray(data.competitions))throw Error('Invalid competition list');
  if(isList){
   const label=CATEGORIES.find(([key])=>key===category)?.[1];
   const items=category&&!label?[]:selectItems(data,{year:selectedYear,category,all:true,today});
   root.innerHTML='<section class="hub-list"><a class="hub-back" href="'+url(selectedYear)+'">← 연도별 국제대회</a><div class="hub-list-heading"><h2>'+selectedYear+'년 '+esc(label||'전체 국제대회')+'</h2><span>'+items.length+'개 대회</span></div>'+shortcuts(selectedYear,category)+'<div class="hub-list-controls"><p>'+ (category?'선택한 종류의 등록 대회를 최신순으로 확인하세요.':'예정 대회를 포함한 전체 등록 대회를 최신순으로 확인하세요.')+'</p>'+(category?'<a class="hub-all-link" href="'+url(selectedYear,'',true)+'">전체대회보기 →</a>':'')+'</div><div class="senior-featured-grid"></div></section>';
   await fillGrid(root.querySelector('.senior-featured-grid'),items,category&&!label?'등록된 대회 종류가 아닙니다. 위에서 대회 종류를 선택해 주세요.':'등록된 대회가 없습니다.');
  }else{
   const years=[...new Set([2026,2025,2024,2023,2022,selectedYear,...data.competitions.map(yearOf).filter(Number.isFinite)])].sort((a,b)=>b-a);
   root.innerHTML='<div class="hub-years">'+years.map(year=>yearBlock(year,year===selectedYear,data.competitions.filter(x=>yearOf(x)===year).length)).join('')+'</div>';
   const loadYear=async section=>{
    if(section.dataset.loaded)return;section.dataset.loaded='true';
    const year=Number(section.dataset.year),items=selectItems(data,{year,all:year!==2026,today});
    if(!data.competitions.some(x=>yearOf(x)===year))section.querySelector('.hub-shortcuts').remove();
    await fillGrid(section.querySelector('.senior-featured-grid'),items,'검수 완료된 대회부터 순차적으로 추가됩니다.');
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
// Hosting-only origin routing preserves every existing KVL target path and slug.
if(document.body.dataset.productionOrigin){
 const routeNav=()=>document.querySelectorAll('a:not(.senior-hub-main a)').forEach(a=>{
  const href=a.getAttribute('href');if(!href||/^(?:#|https?:|mailto:|tel:)/i.test(href))return;
  const u=new URL(href,location.href);
  if(u.pathname.endsWith('/international-competition-senior-national-team.html'))a.href=new URL(url(2026),location.href).href;
  else if(/\.html$/.test(u.pathname))a.href=new URL(u.pathname+u.search+u.hash,document.body.dataset.productionOrigin).href;
 });
 routeNav();new MutationObserver(routeNav).observe(document.body,{childList:true,subtree:true});
}
// Scope the navigation highlight to this prototype without editing the shared nav.
function markInternationalNav(){
 const sidebar=document.querySelector('.kvl-global-sidebar');
 if(!sidebar||sidebar.dataset.internationalPrototype)return;
 sidebar.dataset.internationalPrototype='true';
 sidebar.querySelectorAll('.active').forEach(e=>e.classList.remove('active'));
 const group=sidebar.querySelector('[data-group="competition"]');
 if(group){group.classList.add('open');const button=group.querySelector('button');button.classList.add('active');button.setAttribute('aria-expanded','true');
 const link=[...group.querySelectorAll('a')].find(a=>a.textContent.includes('시니어 국가대표'));if(link){link.classList.add('active');link.setAttribute('aria-current','page');}}
}
markInternationalNav();new MutationObserver(markInternationalNav).observe(document.body,{childList:true,subtree:true});

(()=>{
'use strict';
const config={
  'spring-2026':{
    primary:'2026-03-12(목) ~ 2026-03-19(목) · 충청북도 단양군',
    venues:'국민체육센터 · 매포체육관 · 단양문화체육센터 · 매포국민체육센터'
  },
  'samcheok-2026':{
    primary:'2026-04-06(월) ~ 2026-04-13(월) · 강원특별자치도 삼척시',
    venues:'삼척체육관 · 삼척다목적체육관 · 진주초 체육관'
  },
  'iksan-2026':{
    primary:'2026-06-07(일) ~ 2026-06-14(일) · 전북특별자치도 익산시',
    venues:'남성고체육관 · 익산실내체육관 · 익산학생교육문화관 · 전북기계공고체육관'
  }
};
const item=config[document.body?.dataset.competition];
if(!item)return;
const markup=`<span class="sc-hero-meta-primary">${item.primary}</span><span class="sc-hero-meta-venues">경기장 : ${item.venues}</span>`;
const apply=()=>{
  const title=document.querySelector('.sc-hero h1');
  const meta=title?.nextElementSibling;
  if(!meta||meta.tagName!=='P')return;
  if(meta.innerHTML!==markup)meta.innerHTML=markup;
};
const addStyle=()=>{
  if(document.getElementById('scHeroVenueStyles'))return;
  const style=document.createElement('style');
  style.id='scHeroVenueStyles';
  style.textContent='.sc-hero-meta-primary,.sc-hero-meta-venues{display:block}.sc-hero-meta-venues{margin-top:5px;font-size:.9em;line-height:1.45;opacity:.9}';
  document.head.appendChild(style);
};
const run=()=>{addStyle();apply();const hero=document.querySelector('.sc-hero');if(hero)new MutationObserver(apply).observe(hero,{childList:true,subtree:true,characterData:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();

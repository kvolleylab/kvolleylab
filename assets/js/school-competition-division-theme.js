(()=>{
'use strict';
const id=document.body?.dataset.competition||'school-competition';
const key=`kvl:${id}:division`;
const raw=new URLSearchParams(location.search).get('division');
let division=raw||'';
if(!division){
  try{division=sessionStorage.getItem(key)||'';}catch(_){division='';}
}
const genderOf=value=>/여자부/.test(value)?'women':'men';
const rewriteLinks=()=>{
  document.querySelectorAll('.sc-nav a[href]').forEach(a=>{
    const href=a.getAttribute('href');
    if(!href)return;
    try{
      const url=new URL(href,location.href);
      if(division)url.searchParams.set('division',division);
      a.setAttribute('href',`${url.pathname.split('/').pop()}${url.search}${url.hash}`);
    }catch(_){ }
  });
};
const apply=value=>{
  division=value||division;
  const gender=genderOf(division);
  document.documentElement.dataset.kvlInitialGender=gender;
  if(document.body?.classList.contains('school-comp-page'))document.body.dataset.kvlGenderTheme=gender;
  rewriteLinks();
};
const set=value=>{
  if(!value)return;
  division=value;
  try{sessionStorage.setItem(key,value);}catch(_){ }
  apply(value);
};
const normalizePodiumIcons=()=>{
  document.querySelectorAll('.sc-rank').forEach(row=>{
    const label=row.querySelector('b');
    if(!label)return;
    const text=label.textContent.replace(/[🏆🥈]/gu,'').trim();
    const icon=text==='우승'?'🏆':text==='준우승'?'🥈':'';
    if(!icon)return;
    let trophy=label.querySelector('.sc-rank-trophy');
    if(!trophy){
      trophy=document.createElement('span');
      trophy.className='sc-rank-trophy';
      trophy.setAttribute('aria-hidden','true');
      label.insertBefore(trophy,label.firstChild);
    }
    if(trophy.textContent!==icon)trophy.textContent=icon;
  });
};
window.KVL_SCHOOL_DIVISION_STATE={get:()=>division,set,gender:()=>genderOf(division)};
apply(division);
normalizePodiumIcons();
const podiumRoot=document.querySelector('.sc-main');
if(podiumRoot)new MutationObserver(normalizePodiumIcons).observe(podiumRoot,{childList:true,subtree:true});
document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-kvl-division],[data-calendar-division]');
  if(!btn)return;
  set(btn.dataset.kvlDivision||btn.dataset.calendarDivision||btn.textContent.trim());
},true);
})();

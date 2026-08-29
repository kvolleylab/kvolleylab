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
const setupOverviewCalendarTabs=()=>{
  if(!['presidents-2026','ibk-2026'].includes(id))return;
  const head=document.querySelector('.sc-calendar-head');
  const root=document.getElementById('scCalendar');
  if(!head||!root)return;
  let right=head.querySelector('.sc-calendar-head-right');
  if(!right){
    right=document.createElement('div');
    right.className='sc-calendar-head-right';
    const note=[...head.children].find(el=>el.tagName==='P');
    if(note)right.appendChild(note);
    head.appendChild(right);
  }
  let host=right.querySelector('.sc-calendar-external-tabs');
  if(!host){
    host=document.createElement('div');
    host.className='sc-calendar-division-tabs sc-calendar-external-tabs';
    host.setAttribute('role','tablist');
    right.appendChild(host);
  }
  if(!document.getElementById('kvlSchoolCalendarTabsOutsideStyle')){
    const style=document.createElement('style');
    style.id='kvlSchoolCalendarTabsOutsideStyle';
    style.textContent=`
      .school-comp-page[data-competition="presidents-2026"] #scCalendar>.sc-calendar-division-tabs,
      .school-comp-page[data-competition="ibk-2026"] #scCalendar>.sc-calendar-division-tabs{display:none!important}
      .school-comp-page .sc-calendar-head-right{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}
      .school-comp-page .sc-calendar-head-right>p{margin:0;color:#64748b}
      .school-comp-page .sc-calendar-head-right .sc-calendar-division-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0!important}
      .school-comp-page .sc-calendar-head-right .sc-calendar-division-tabs button{padding:9px 15px!important;border:1px solid #dbe2ea;border-radius:999px;background:#fff;color:#536477;font:inherit;font-size:13px!important;font-weight:900;cursor:pointer}
      .school-comp-page .sc-calendar-head-right .sc-calendar-division-tabs button.is-active{border-color:#17365d;background:#17365d;color:#fff}
      @media(max-width:620px){.school-comp-page .sc-calendar-head-right{align-items:flex-start;justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }
  const sync=()=>{
    const internal=[...root.querySelectorAll(':scope>.sc-calendar-division-tabs [data-calendar-division]')];
    if(!internal.length)return;
    host.innerHTML=internal.map(btn=>`<button type="button" class="${btn.classList.contains('is-active')?'is-active':''}" data-external-calendar-division="${btn.dataset.calendarDivision}">${btn.textContent.trim()}</button>`).join('');
    host.querySelectorAll('[data-external-calendar-division]').forEach(btn=>{
      btn.onclick=()=>{
        const value=btn.dataset.externalCalendarDivision;
        const target=[...root.querySelectorAll(':scope>.sc-calendar-division-tabs [data-calendar-division]')].find(item=>item.dataset.calendarDivision===value);
        if(target)target.click();
      };
    });
  };
  sync();
  new MutationObserver(sync).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
};
window.KVL_SCHOOL_DIVISION_STATE={get:()=>division,set,gender:()=>genderOf(division)};
apply(division);
normalizePodiumIcons();
setupOverviewCalendarTabs();
const podiumRoot=document.querySelector('.sc-main');
if(podiumRoot)new MutationObserver(normalizePodiumIcons).observe(podiumRoot,{childList:true,subtree:true});
document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-kvl-division],[data-calendar-division],.sc-tabs button');
  if(!btn)return;
  const value=btn.dataset.kvlDivision||btn.dataset.calendarDivision||btn.textContent.trim();
  if(!/^(?:18|15)세이하 (?:남자|여자)부$/.test(value))return;
  set(value);
},true);
})();

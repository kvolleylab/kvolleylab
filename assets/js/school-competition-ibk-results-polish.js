(()=>{
'use strict';
if(document.body?.dataset.competition!=='ibk-2026')return;

const polishResults=()=>{
  const root=document.getElementById('scResults');
  if(!root)return;
  root.querySelectorAll('.sc-match').forEach(match=>{
    const meta=match.querySelector('.sc-meta');
    if(meta&&!meta.querySelector('.sc-meta-top')){
      const parts=meta.textContent.split('·').map(v=>v.trim()).filter(Boolean);
      const start=parts.shift()||'';
      const stage=parts.pop()||'';
      const venue=parts.join(' · ');
      meta.innerHTML=`<div class="sc-meta-top">${start}</div><div class="sc-meta-detail"><span class="sc-stage">${stage}</span>${venue?`<span class="sc-venue" title="${venue}">${venue}</span>`:''}</div>`;
    }

    const sides=[...match.querySelectorAll('.sc-board .sc-team')];
    if(sides.length!==2)return;
    sides.forEach((side,index)=>{
      const sideClass=index===0?'is-left':'is-right';
      if(side.classList.contains(sideClass)&&side.querySelector('strong'))return;
      const logo=side.querySelector('.sc-team-logo');
      const logoHtml=logo?logo.outerHTML:'';
      if(logo)logo.remove();
      const name=side.textContent.trim();
      const winner=side.classList.contains('sc-winner');
      side.className=`sc-team ${sideClass}${winner?' sc-winner':''}`;
      side.innerHTML=index===0?`${logoHtml}<strong>${name}</strong>`:`<strong>${name}</strong>${logoHtml}`;
    });
  });
};

const start=()=>{
  polishResults();
  const root=document.getElementById('scResults');
  if(!root)return;
  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      polishResults();
    });
  }).observe(root,{childList:true,subtree:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();

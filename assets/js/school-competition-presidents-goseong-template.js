(()=>{
'use strict';
if(document.body?.dataset.competition!=='presidents-2026')return;

const RULES_URL='https://drive.google.com/file/d/1oMmohcnIDQf4E8fRv1APPK1nnfZq8UEr/view?usp=drivesdk';
const PAMPHLET_URL='https://drive.google.com/file/d/1p4pDIsHiC95oDdKY46ySG3_Q6bWh2kel/view?usp=drivesdk';

const polishResults=()=>{
  const root=document.getElementById('scResults');
  if(!root)return;
  root.querySelectorAll('.sc-match').forEach(match=>{
    if(match.dataset.kvlGoseongTemplate==='1')return;
    match.dataset.kvlGoseongTemplate='1';

    const meta=match.querySelector('.sc-meta');
    if(meta&&!meta.querySelector('.sc-meta-top')){
      const parts=meta.textContent.split('·').map(v=>v.trim()).filter(Boolean);
      const start=parts.shift()||'';
      const stage=parts.pop()||'';
      const venue=parts.join(' · ');
      meta.innerHTML=`<div class="sc-meta-top">${start}</div><div class="sc-meta-detail"><span class="sc-stage">${stage}</span>${venue?`<span class="sc-venue" title="${venue}">${venue}</span>`:''}</div>`;
    }

    const sides=[...match.querySelectorAll('.sc-board .sc-team')];
    if(sides.length===2){
      sides.forEach((side,index)=>{
        const logo=side.querySelector('.sc-team-logo');
        const logoHtml=logo?logo.outerHTML:'';
        if(logo)logo.remove();
        const name=side.textContent.trim();
        const winner=side.classList.contains('sc-winner');
        side.className=`sc-team ${index===0?'is-left':'is-right'}${winner?' sc-winner':''}`;
        side.innerHTML=index===0
          ?`${logoHtml}<strong>${name}</strong>`
          :`<strong>${name}</strong>${logoHtml}`;
      });
    }
  });
};

const simplifySources=()=>{
  const section=document.getElementById('sources');
  if(!section)return;
  section.querySelectorAll('.sc-regulations,.sc-data-note').forEach(el=>el.remove());
  const root=section.querySelector('.sc-sources');
  if(!root)return;
  const html=`<a href="${RULES_URL}" target="_blank" rel="noopener noreferrer"><span>제59회 대통령배 참가요강 원문 열기</span><span>→</span></a><a href="${PAMPHLET_URL}" target="_blank" rel="noopener noreferrer"><span>제59회 대통령배 팸플릿 PDF 열기</span><span>→</span></a>`;
  if(root.innerHTML!==html)root.innerHTML=html;
};

const tuneCopy=()=>{
  const overview=document.getElementById('overview');
  const note=overview?.querySelector('.sc-title>p');
  if(note)note.textContent='사전경기 포함 · 공식 경기스코어 기준';
};

const apply=()=>{polishResults();simplifySources();tuneCopy();};
const start=()=>{
  apply();
  const results=document.getElementById('scResults');
  if(results){
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;polishResults();});
    }).observe(results,{childList:true,subtree:true});
  }
  const sources=document.getElementById('sources');
  if(sources){
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;simplifySources();});
    }).observe(sources,{childList:true,subtree:true});
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

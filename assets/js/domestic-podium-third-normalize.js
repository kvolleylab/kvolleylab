(()=>{
  'use strict';
  const normalizeBox=box=>{
    box.querySelectorAll('.dc-ranking-list p').forEach(row=>{
      const group=row.querySelector('.dc-third-links');
      if(!group||row.dataset.thirdNormalized==='1')return;
      const links=[...group.querySelectorAll('.dc-team-link')];
      if(!links.length)return;
      const medal=row.querySelector(':scope > span:not(.dc-third-links)');
      const parent=row.parentElement;
      const rows=links.map((link,index)=>{
        const p=document.createElement('p');
        p.dataset.thirdNormalized='1';
        const icon=document.createElement('span');
        icon.setAttribute('aria-hidden','true');
        icon.textContent=index===0?(medal?.textContent||'🥉'):'';
        p.append(icon,link.cloneNode(true));
        return p;
      });
      rows.forEach(p=>parent.insertBefore(p,row));
      row.remove();
    });
  };
  const normalize=()=>document.querySelectorAll('.dc-ranking').forEach(normalizeBox);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',normalize,{once:true});else normalize();
  new MutationObserver(normalize).observe(document.body,{childList:true,subtree:true});
})();

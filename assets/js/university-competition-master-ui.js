(()=>{
'use strict';
const normalize=()=>{
  const list=document.querySelector('.cd-jump .is-list');
  if(list){list.textContent='← 대회 목록';list.classList.add('cd-master-list-button');}
  const standingMenu=document.querySelector('.cd-jump [data-view="group-standings"]');
  if(standingMenu)standingMenu.textContent='조별 순위';
  const standingTitle=document.querySelector('#group-standings h2');
  if(standingTitle)standingTitle.textContent='조별 순위';
  document.querySelectorAll('.cd-standing-card').forEach(card=>card.classList.add('cd-master-standing-card'));
  document.querySelectorAll('.cd-standing-head,.cd-standing-row').forEach(row=>row.classList.add('cd-master-standing-row'));
};
const observer=new MutationObserver(normalize);
const start=()=>{normalize();observer.observe(document.body,{childList:true,subtree:true});};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
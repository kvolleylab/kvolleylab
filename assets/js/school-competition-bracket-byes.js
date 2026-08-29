(()=>{
'use strict';
const competition=document.body?.dataset.competition||'';
if(!['presidents-2026','ibk-2026'].includes(competition))return;
let scheduled=false;

const teamName=side=>side?.querySelector('strong')?.textContent.trim()||'';
const winnerName=card=>teamName(card?.querySelector('.sc-horizontal-side.is-winner'));

function makeByeCard(side){
  const team=teamName(side);
  if(!team)return null;
  const card=document.createElement('div');
  card.className='sc-bracket-bye';
  card.dataset.kvlByeTeam=team;
  const logo=side.querySelector('.sc-team-logo')?.outerHTML||'';
  card.innerHTML=`<div class="sc-bracket-bye-title">준결승 직행</div><div class="sc-bracket-bye-team">${logo}<strong>${team}</strong></div>`;
  return card;
}

function patchArticle(article){
  if(!article||article.dataset.kvlByePatched==='1')return;
  const rounds=[...article.querySelectorAll(':scope > .sc-bracket-grid > .sc-bracket-round')];
  if(rounds.length<3)return;
  const first=rounds[0],semi=rounds[1];
  const label=first.querySelector(':scope > strong')?.textContent.trim()||'';
  if(label!=='6강')return;

  const qCards=[...first.querySelectorAll(':scope > .sc-bracket-game')];
  const semiCards=[...semi.querySelectorAll(':scope > .sc-bracket-game')];
  if(qCards.length!==2||semiCards.length!==2)return;

  const qByWinner=new Map(qCards.map(card=>[winnerName(card),card]).filter(([winner])=>winner));
  if(qByWinner.size!==2)return;

  const groups=[];
  for(const semiCard of semiCards){
    const sides=[...semiCard.querySelectorAll('.sc-horizontal-side')];
    if(sides.length!==2)return;
    const names=sides.map(teamName);
    const feederIndex=names.findIndex(name=>qByWinner.has(name));
    if(feederIndex<0)return;
    const directIndex=feederIndex===0?1:0;
    const qCard=qByWinner.get(names[feederIndex]);
    const byeCard=makeByeCard(sides[directIndex]);
    if(!qCard||!byeCard)return;

    const group=document.createElement('div');
    group.className='sc-bracket-feeder';
    group.dataset.kvlFeeds=String(groups.length+1);
    if(feederIndex===0){group.append(qCard,byeCard)}else{group.append(byeCard,qCard)}
    groups.push(group);
  }

  if(groups.length!==2)return;
  first.classList.add('sc-bracket-round-with-byes');
  semi.classList.add('sc-bracket-round-semifinal');
  groups.forEach(group=>first.appendChild(group));
  article.dataset.kvlByePatched='1';
}

function patch(){
  document.querySelectorAll('#scBrackets .sc-bracket').forEach(patchArticle);
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;patch()});
}

const start=()=>{
  patch();
  const root=document.getElementById('scBrackets');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

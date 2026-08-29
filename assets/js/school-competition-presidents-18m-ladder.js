(()=>{
'use strict';
if(document.body?.dataset.competition!=='presidents-2026')return;
let scheduled=false;
const teamNames=card=>[...card.querySelectorAll('.sc-horizontal-side strong')].map(el=>el.textContent.trim()).filter(Boolean);
const winnerName=card=>card.querySelector('.sc-horizontal-side.is-winner strong')?.textContent.trim()||'';
const titleOf=card=>card.querySelector('.sc-bracket-title')?.textContent.trim()||'';

function patch(){
  const article=[...document.querySelectorAll('#scBrackets .sc-bracket')].find(el=>el.querySelector(':scope>h3')?.textContent.trim()==='18세이하 남자부');
  if(!article||article.dataset.kvlPresidents18mLadder==='1')return;
  const rounds=[...article.querySelectorAll(':scope>.sc-bracket-grid>.sc-bracket-round')];
  if(rounds.length!==3)return;
  const [quarterRound,semiRound,finalRound]=rounds;
  if(quarterRound.querySelector(':scope>strong')?.textContent.trim()!=='8강')return;
  const quarters=[...quarterRound.querySelectorAll(':scope>.sc-bracket-game')];
  const semis=[...semiRound.querySelectorAll(':scope>.sc-bracket-game')];
  const finals=[...finalRound.querySelectorAll(':scope>.sc-bracket-game')];
  if(quarters.length!==4||semis.length!==2||finals.length!==1)return;

  const used=new Set();
  const pairs=[];
  for(const semi of semis){
    const semiTeams=new Set(teamNames(semi));
    const feeders=quarters.filter(q=>!used.has(q)&&semiTeams.has(winnerName(q)));
    if(feeders.length!==2)return;
    feeders.sort((a,b)=>{
      const na=Number((titleOf(a).match(/(\d+)경기/)||[])[1]||0);
      const nb=Number((titleOf(b).match(/(\d+)경기/)||[])[1]||0);
      return na-nb;
    });
    feeders.forEach(q=>used.add(q));
    pairs.push(feeders);
  }
  if(used.size!==4)return;

  quarterRound.classList.add('sc-true-ladder-quarter');
  semiRound.classList.add('sc-true-ladder-semi');
  finalRound.classList.add('sc-true-ladder-final');
  article.querySelector(':scope>.sc-bracket-grid')?.classList.add('sc-true-ladder-grid');

  pairs.forEach((feeders,index)=>{
    const group=document.createElement('div');
    group.className='sc-true-ladder-pair';
    group.dataset.ladderPair=String(index+1);
    feeders.forEach(card=>group.appendChild(card));
    quarterRound.appendChild(group);
  });

  const semiPair=document.createElement('div');
  semiPair.className='sc-true-ladder-semi-pair';
  semis.forEach(card=>semiPair.appendChild(card));
  semiRound.appendChild(semiPair);

  const finalSlot=document.createElement('div');
  finalSlot.className='sc-true-ladder-final-slot';
  finalSlot.appendChild(finals[0]);
  finalRound.appendChild(finalSlot);

  article.dataset.kvlPresidents18mLadder='1';
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patch()})}
const start=()=>{patch();const root=document.getElementById('scBrackets');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

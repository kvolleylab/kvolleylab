(()=>{
'use strict';
if(document.body?.dataset.competition!=='presidents-2026')return;

let scheduled=false;
const root=()=>document.getElementById('scBrackets');
const teamName=side=>side?.querySelector('strong')?.textContent.trim()||'';
const teamSides=card=>[...card.querySelectorAll('.sc-horizontal-side')];
const teamNames=card=>teamSides(card).map(teamName).filter(Boolean);
const winnerName=card=>teamName(card?.querySelector('.sc-horizontal-side.is-winner'));
const logoHtml=side=>side?.querySelector('.sc-team-logo')?.outerHTML||'';

function makeByeCard(side){
  const team=teamName(side);
  if(!team)return null;
  const card=document.createElement('div');
  card.className='sc-ladder-bye';
  card.dataset.kvlByeTeam=team;
  card.innerHTML=`<div class="sc-ladder-bye-title">준결승 직행</div><div class="sc-ladder-bye-team">${logoHtml(side)}<strong>${team}</strong></div>`;
  return card;
}

function buildFeederPair(semi,firstCards,used){
  const sides=teamSides(semi);
  if(sides.length!==2)return null;
  const firstByWinner=new Map();
  firstCards.forEach(card=>{
    const winner=winnerName(card);
    if(winner&&!used.has(card))firstByWinner.set(winner,card);
  });

  const group=document.createElement('div');
  group.className='sc-ladder-feeder-pair';
  const sources=[];

  for(const side of sides){
    const name=teamName(side);
    const feeder=firstByWinner.get(name);
    if(feeder){
      used.add(feeder);
      sources.push(feeder);
    }else{
      const bye=makeByeCard(side);
      if(!bye)return null;
      sources.push(bye);
    }
  }
  sources.forEach(source=>group.appendChild(source));
  return group;
}

function patchArticle(article){
  if(!article||article.dataset.kvlPresidentsLadder==='1')return;
  const grid=article.querySelector(':scope>.sc-bracket-grid');
  if(!grid)return;
  const rounds=[...grid.querySelectorAll(':scope>.sc-bracket-round')];
  if(rounds.length!==3)return;
  const [firstRound,semiRound,finalRound]=rounds;
  const firstCards=[...firstRound.querySelectorAll(':scope>.sc-bracket-game')];
  const semis=[...semiRound.querySelectorAll(':scope>.sc-bracket-game')];
  const finals=[...finalRound.querySelectorAll(':scope>.sc-bracket-game')];
  if(![2,4].includes(firstCards.length)||semis.length!==2||finals.length!==1)return;

  const used=new Set();
  const feederPairs=[];
  for(const semi of semis){
    const pair=buildFeederPair(semi,firstCards,used);
    if(!pair)return;
    feederPairs.push(pair);
  }
  if(used.size!==firstCards.length)return;

  grid.classList.add('sc-presidents-ladder-grid');
  firstRound.classList.add('sc-presidents-ladder-first');
  semiRound.classList.add('sc-presidents-ladder-semis');
  finalRound.classList.add('sc-presidents-ladder-final');

  feederPairs.forEach((pair,index)=>{
    pair.dataset.ladderPair=String(index+1);
    firstRound.appendChild(pair);
  });

  const semiStack=document.createElement('div');
  semiStack.className='sc-ladder-semi-stack';
  semis.forEach(semi=>semiStack.appendChild(semi));
  semiRound.appendChild(semiStack);

  const finalSlot=document.createElement('div');
  finalSlot.className='sc-ladder-final-slot';
  finalSlot.appendChild(finals[0]);
  finalRound.appendChild(finalSlot);

  article.dataset.kvlPresidentsLadder='1';
}

function patch(){
  root()?.querySelectorAll('.sc-bracket').forEach(patchArticle);
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;patch()});
}
function start(){
  patch();
  const el=root();
  if(el)new MutationObserver(schedule).observe(el,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

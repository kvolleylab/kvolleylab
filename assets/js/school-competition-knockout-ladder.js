(()=>{
'use strict';
const root=()=>document.getElementById('scBrackets');
if(!document.body?.classList.contains('school-comp-page')||!root())return;
let scheduled=false;
const SVG_NS='http://www.w3.org/2000/svg';
const teamName=side=>side?.querySelector('strong')?.textContent.trim()||'';
const teamSides=card=>[...card.querySelectorAll('.sc-horizontal-side')];
const winnerName=card=>teamName(card?.querySelector('.sc-horizontal-side.is-winner'));
const logoHtml=side=>side?.querySelector('.sc-team-logo')?.outerHTML||'';

function makeByeCard(side){
  const team=teamName(side);
  if(!team)return null;
  const card=document.createElement('div');
  card.className='sc-school-ladder-bye';
  card.dataset.kvlByeTeam=team;
  card.innerHTML=`<div class="sc-school-ladder-bye-title">준결승 직행</div><div class="sc-school-ladder-bye-team">${logoHtml(side)}<strong>${team}</strong></div>`;
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
  group.className='sc-school-ladder-feeder-pair';
  for(const side of sides){
    const name=teamName(side),feeder=firstByWinner.get(name);
    if(feeder){
      used.add(feeder);
      group.appendChild(feeder);
    }else{
      const bye=makeByeCard(side);
      if(!bye)return null;
      group.appendChild(bye);
    }
  }
  return group;
}

function patchArticle(article){
  if(!article||article.dataset.kvlSchoolLadder==='1')return;
  const grid=article.querySelector(':scope>.sc-bracket-grid');
  if(!grid)return;
  const rounds=[...grid.querySelectorAll(':scope>.sc-bracket-round')];
  if(rounds.length!==3)return;
  const [firstRound,semiRound,finalRound]=rounds;
  const firstCards=[...firstRound.querySelectorAll(':scope>.sc-bracket-game')];
  const semis=[...semiRound.querySelectorAll(':scope>.sc-bracket-game')];
  const finals=[...finalRound.querySelectorAll(':scope>.sc-bracket-game')];
  if(firstCards.length<1||firstCards.length>4||semis.length!==2||finals.length!==1)return;

  const used=new Set(),pairs=[];
  for(const semi of semis){
    const pair=buildFeederPair(semi,firstCards,used);
    if(!pair)return;
    pairs.push(pair);
  }
  if(used.size!==firstCards.length)return;

  grid.classList.add('sc-school-ladder-grid');
  firstRound.classList.add('sc-school-ladder-first');
  semiRound.classList.add('sc-school-ladder-semis');
  finalRound.classList.add('sc-school-ladder-final');
  pairs.forEach((pair,index)=>{
    pair.dataset.ladderPair=String(index+1);
    firstRound.appendChild(pair);
  });

  const semiStack=document.createElement('div');
  semiStack.className='sc-school-ladder-semi-stack';
  semis.forEach(semi=>semiStack.appendChild(semi));
  semiRound.appendChild(semiStack);

  const finalSlot=document.createElement('div');
  finalSlot.className='sc-school-ladder-final-slot';
  finalSlot.appendChild(finals[0]);
  finalRound.appendChild(finalSlot);
  article.dataset.kvlSchoolLadder='1';
}

function point(el,side,gridRect,grid){
  const r=el.getBoundingClientRect();
  return {
    x:(side==='right'?r.right:r.left)-gridRect.left+grid.scrollLeft,
    y:r.top+r.height/2-gridRect.top+grid.scrollTop
  };
}
function addPath(svg,d){
  const path=document.createElementNS(SVG_NS,'path');
  path.setAttribute('d',d);
  path.setAttribute('class','sc-school-ladder-line-path');
  svg.appendChild(path);
}
function drawMerge(svg,sourceA,sourceB,target,gridRect,grid){
  if(!sourceA||!sourceB||!target)return;
  const a=point(sourceA,'right',gridRect,grid);
  const b=point(sourceB,'right',gridRect,grid);
  const t=point(target,'left',gridRect,grid);
  const sourceX=Math.max(a.x,b.x);
  const midX=sourceX+(t.x-sourceX)/2;
  const topY=Math.min(a.y,b.y),bottomY=Math.max(a.y,b.y);
  const joinY=(a.y+b.y)/2;
  addPath(svg,`M ${a.x} ${a.y} H ${midX}`);
  addPath(svg,`M ${b.x} ${b.y} H ${midX}`);
  addPath(svg,`M ${midX} ${topY} V ${bottomY}`);
  addPath(svg,`M ${midX} ${joinY} V ${t.y} H ${t.x}`);
}
function drawArticle(article){
  if(!article||article.dataset.kvlSchoolLadder!=='1')return;
  const grid=article.querySelector(':scope>.sc-bracket-grid');
  if(!grid)return;
  let svg=grid.querySelector(':scope>.sc-school-ladder-lines');
  if(!svg){
    svg=document.createElementNS(SVG_NS,'svg');
    svg.setAttribute('class','sc-school-ladder-lines');
    svg.setAttribute('aria-hidden','true');
    grid.appendChild(svg);
  }
  const width=Math.max(grid.scrollWidth,grid.clientWidth);
  const height=Math.max(grid.scrollHeight,grid.clientHeight);
  svg.setAttribute('width',String(width));
  svg.setAttribute('height',String(height));
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  while(svg.firstChild)svg.removeChild(svg.firstChild);

  const gridRect=grid.getBoundingClientRect();
  const pairs=[...grid.querySelectorAll('.sc-school-ladder-feeder-pair')];
  const semis=[...grid.querySelectorAll('.sc-school-ladder-semi-stack>.sc-bracket-game')];
  const final=grid.querySelector('.sc-school-ladder-final-slot>.sc-bracket-game');
  if(pairs.length!==2||semis.length!==2||!final)return;
  pairs.forEach((pair,index)=>{
    const sources=[...pair.children].filter(el=>el.classList.contains('sc-bracket-game')||el.classList.contains('sc-school-ladder-bye'));
    if(sources.length===2)drawMerge(svg,sources[0],sources[1],semis[index],gridRect,grid);
  });
  drawMerge(svg,semis[0],semis[1],final,gridRect,grid);
}
function patchAndDraw(){
  const articles=[...(root()?.querySelectorAll('.sc-bracket')||[])];
  articles.forEach(patchArticle);
  requestAnimationFrame(()=>articles.forEach(drawArticle));
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;patchAndDraw()});
}
function start(){
  patchAndDraw();
  const el=root();
  if(el)new MutationObserver(schedule).observe(el,{childList:true});
  window.addEventListener('resize',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

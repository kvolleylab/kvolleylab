(()=>{
'use strict';
const view=new URLSearchParams(location.search).get('view')||'overview';
if(view!=='group-standings')return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ratio=(won,lost)=>lost===0?(won>0?Infinity:0):won/lost;
const scoreValue=value=>String(value||'0-0').split('-').map(Number);
function rowsFor(data,division,poolName,teams){
  const table=new Map(teams.map(team=>[team,{team,played:0,wins:0,losses:0,setsWon:0,setsLost:0}]));
  (data.games||[]).filter(g=>g.division===division&&g.stage==='예선'&&g.pool===poolName&&g.completed&&g.score).forEach(g=>{
    const [a,b]=scoreValue(g.score),ra=table.get(g.teamA),rb=table.get(g.teamB);
    if(!ra||!rb)return;
    ra.played++;rb.played++;ra.setsWon+=a;ra.setsLost+=b;rb.setsWon+=b;rb.setsLost+=a;
    if(a>b){ra.wins++;rb.losses++;}else{rb.wins++;ra.losses++;}
  });
  return [...table.values()].sort((a,b)=>b.wins-a.wins||ratio(b.setsWon,b.setsLost)-ratio(a.setsWon,a.setsLost)||a.team.localeCompare(b.team,'ko'));
}
function render(data,division='남대부'){
  const root=document.getElementById('cdGroupStandings');
  if(!root)return;
  const pools=data.pools?.[division]||{};
  root.innerHTML=Object.entries(pools).map(([poolName,teams])=>{
    const rows=rowsFor(data,division,poolName,teams);
    return `<article class="cd-standing-card"><h3>${esc(poolName)}조</h3><div class="cd-standing-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>세트득실률</span></div>${rows.map((r,i)=>`<div class="cd-standing-row"><strong>${i+1}</strong><span>${esc(r.team)}</span><span>${r.played}</span><span>${r.wins}</span><span>${r.losses}</span><span>${r.played===0?'-':r.setsLost===0?'∞':ratio(r.setsWon,r.setsLost).toFixed(3)}</span></div>`).join('')}</article>`;
  }).join('');
  const note=document.getElementById('cdStandingNote');
  if(note)note.textContent=`${division} 조별리그 경기결과를 승수·세트득실률 순으로 정리한 참고 순위입니다.`;
  document.querySelectorAll('[data-standing-division]').forEach(button=>{
    button.classList.toggle('is-active',button.dataset.standingDivision===division);
    button.onclick=()=>render(data,button.dataset.standingDivision);
  });
}
async function start(){
  try{
    const response=await fetch('data/competitions/danyang-2026.json?v=20260731-7',{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  }catch(error){
    const root=document.getElementById('cdGroupStandings');
    if(root)root.textContent='조별 순위 데이터를 불러오지 못했습니다.';
    console.error('Danyang standings fast loader failed',error);
  }
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
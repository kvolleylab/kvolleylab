(()=>{
'use strict';
const nativeFetch=window.fetch.bind(window);
const DANYANG_URL='data/competitions/danyang-2026.json';
let danyangData=null;

window.fetch=async(input,init)=>{
  const url=typeof input==='string'?input:input?.url||'';
  if(url.includes('data/competitions/gosung-2026.json')){
    const response=await nativeFetch(`${DANYANG_URL}?v=20260801-2`,init);
    if(!response.ok)return response;
    const data=await response.json();
    data.podium=data.podium||{'남대부':[],'여대부':[]};
    data.sources=data.sources||[];
    danyangData=data;
    return new Response(JSON.stringify(data),{
      status:response.status,
      statusText:response.statusText,
      headers:{'Content-Type':'application/json'}
    });
  }
  return nativeFetch(input,init);
};

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ratio=(won,lost)=>lost===0?(won>0?Infinity:0):won/lost;
const initials=name=>String(name||'').replace('대학교','').replace('대','').slice(0,2);

function ensureListStyle(){
  if(document.getElementById('cdListLinkStyle'))return;
  const style=document.createElement('style');
  style.id='cdListLinkStyle';
  style.textContent='.competition-dashboard-page .cd-jump a.is-list{padding:10px 14px!important;border:1px solid #d6b25e!important;border-radius:999px!important;background:#fffaf0!important;color:#17365d!important;font-weight:900!important}.competition-dashboard-page .cd-jump a.is-list:hover{border-color:#c9a24a!important;background:#fff3cc!important;color:#17365d!important}';
  document.head.appendChild(style);
}

function ensureCompetitionListLink(){
  const nav=document.querySelector('.cd-jump');
  if(!nav||nav.querySelector('.is-list'))return;
  const link=document.createElement('a');
  link.className='is-list';
  link.href='university-competitions.html';
  link.textContent='← 대회 목록';
  nav.prepend(link);
}

function rowsFor(data,division,poolName,teams){
  const table=new Map(teams.map(team=>[team,{team,played:0,wins:0,losses:0,setsWon:0,setsLost:0}]));
  (data.games||[])
    .filter(g=>g.division===division&&g.stage==='예선'&&g.pool===poolName&&g.completed&&g.score)
    .forEach(g=>{
      const [a,b]=String(g.score).split('-').map(Number),ra=table.get(g.teamA),rb=table.get(g.teamB);
      if(!ra||!rb||!Number.isFinite(a)||!Number.isFinite(b))return;
      ra.played++;rb.played++;
      ra.setsWon+=a;ra.setsLost+=b;
      rb.setsWon+=b;rb.setsLost+=a;
      if(a>b){ra.wins++;rb.losses++;}else{rb.wins++;ra.losses++;}
    });
  return [...table.values()].sort((a,b)=>b.wins-a.wins||ratio(b.setsWon,b.setsLost)-ratio(a.setsWon,a.setsLost)||a.team.localeCompare(b.team,'ko'));
}

function renderStandings(data,division='남대부'){
  const root=document.getElementById('cdGroupStandings');
  if(!root)return;
  const pools=data.pools?.[division]||{};
  root.innerHTML=Object.entries(pools).map(([poolName,teams])=>{
    const rows=rowsFor(data,division,poolName,teams);
    return `<article class="cd-standing-card"><h3>${esc(poolName)}조</h3><div class="cd-standing-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>세트득실률</span></div>${rows.map((r,i)=>`<div class="cd-standing-row"><strong>${i+1}</strong><span>${esc(r.team)}</span><span>${r.played}</span><span>${r.wins}</span><span>${r.losses}</span><span>${r.played===0?'-':r.setsLost===0?'∞':ratio(r.setsWon,r.setsLost).toFixed(3)}</span></div>`).join('')}</article>`;
  }).join('');
  const note=document.getElementById('cdStandingNote');
  if(note)note.textContent=`${division} 조별리그 완료 경기 기준 순위입니다.`;
}

function renderParticipants(data){
  const root=document.getElementById('cdTeams');
  if(!root)return;
  const divisions=data.participants||{};
  root.innerHTML=Object.entries(divisions).map(([division,teams])=>`<section class="cd-team-section"><div class="cd-team-section-head"><h3>${esc(division)}</h3><span>${teams.length}개 대학</span></div><div class="cd-team-grid">${teams.map(team=>`<a class="cd-team-card" href="university-team.html?school=${encodeURIComponent(team)}"><span class="cd-team-mark">${esc(initials(team))}</span><span><strong>${esc(team)}</strong><small>${esc(division)} 참가</small></span></a>`).join('')}</div></section>`).join('');
}

function renderSources(data){
  const root=document.getElementById('cdSources');
  if(!root)return;
  const sources=data.sources||[];
  root.innerHTML=sources.length?sources.map(s=>`<a href="${esc(s.url||'#')}" ${/^https?:/.test(s.url||'')?'target="_blank" rel="noopener"':''}>${esc(s.label||'공식자료')} →</a>`).join(''):'<div class="cd-empty">공식자료가 등록되면 이곳에 표시됩니다.</div>';
}

function applyDanyangOnce(data){
  document.title='2026 단양대회 | K-Volley Lab';
  ensureListStyle();
  ensureCompetitionListLink();

  const title=document.getElementById('cdTitle');
  if(title)title.innerHTML=(data.titleLines||['2026 대한항공배','전국대학배구 단양대회']).map(x=>`<span class="cd-hero-title-line">${esc(x)}</span>`).join('');

  const status=document.querySelector('.cd-status');
  if(status)status.innerHTML=`<span>대회 상태</span><strong>${esc(data.statusLabel||'대회 준비 중')}</strong>`;

  document.querySelectorAll('.cd-jump a[data-view]').forEach(a=>{
    a.href=`university-competition-danyang.html?view=${a.dataset.view}`;
    a.hidden=false;
  });

  document.querySelectorAll('.cd-cal-game').forEach(a=>{
    a.href='university-competition-danyang.html?view=results';
    const b=a.querySelector('b');
    if(b&&!b.textContent.trim())b.textContent='vs';
  });
  document.querySelectorAll('.cd-score').forEach(b=>{if(!b.textContent.trim())b.textContent='vs';});

  const finalSection=document.getElementById('standings');
  if(finalSection)finalSection.hidden=false;
  const qualifier=document.querySelector('.cd-qualifier');
  if(qualifier)qualifier.hidden=false;

  const playerCount=document.getElementById('cdPlayerCount');
  const avg=document.getElementById('cdAvgHeight');
  const note=document.getElementById('cdSnapshotNote');
  if(playerCount)playerCount.textContent='-';
  if(avg)avg.textContent='-';
  if(note)note.textContent='단양대회 공식 일정 기준';

  renderStandings(data,'남대부');
  renderParticipants(data);
  renderSources(data);

  document.querySelectorAll('[data-standing-division]').forEach(button=>{
    button.addEventListener('click',()=>{
      document.querySelectorAll('[data-standing-division]').forEach(x=>x.classList.toggle('is-active',x===button));
      renderStandings(data,button.dataset.standingDivision);
    });
  });
}

function waitForMainRender(data){
  const ready=()=>document.getElementById('cdCalendar')?.children.length||document.querySelector('.cd-empty')||document.querySelector('.cd-match');
  if(ready())return applyDanyangOnce(data);
  const observer=new MutationObserver(()=>{
    if(!ready())return;
    observer.disconnect();
    applyDanyangOnce(data);
  });
  observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
}

async function start(){
  try{
    const data=danyangData||await nativeFetch(`${DANYANG_URL}?v=20260801-2`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();});
    waitForMainRender(data);
  }catch(error){console.error('Danyang clone adapter failed',error);}
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
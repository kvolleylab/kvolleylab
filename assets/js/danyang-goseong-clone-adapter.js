(()=>{
'use strict';
const nativeFetch=window.fetch.bind(window);
const DANYANG_URL='data/competitions/danyang-2026.json';
const PLAYER_URL='data/master/player_master_229_v2.json';
const BRAND_URL='data/master/university_brand_sources_2026.json';
let danyangData=null;

window.fetch=async(input,init)=>{
  const url=typeof input==='string'?input:input?.url||'';
  if(url.includes('data/competitions/gosung-2026.json')){
    const response=await nativeFetch(`${DANYANG_URL}?v=20260801-6`,init);
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
const schoolName=p=>p.current_roster?.school_name||String(p.current_roster?.team_name||'').replace(' 남자배구부','');
const schoolCode=p=>p.current_roster?.school_code||schoolName(p);
const shortName=n=>String(n||'').replace('국립목포대학교','목포대').replace('경상국립대학교','경상국립대').replace('국립','').replace('대학교','대');
const initials=n=>shortName(n).replace('대','').slice(0,2);

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

function renderQualificationState(data,division='남대부'){
  const poolBox=document.getElementById('cdCalcPools');
  const calcBox=document.getElementById('cdQualificationCalculator');
  if(!poolBox||!calcBox)return;
  const prelim=(data.games||[]).filter(g=>g.division===division&&g.stage==='예선');
  const completed=prelim.filter(g=>g.completed&&g.score).length;
  poolBox.innerHTML='';
  calcBox.innerHTML=completed===prelim.length&&prelim.length
    ?'<div class="cd-empty">공식 경기결과 반영 후 진출 계산기를 제공합니다.</div>'
    :`<div class="cd-empty">대회 시작 전입니다. 조별리그 ${prelim.length}경기 중 ${completed}경기가 완료되었습니다.</div>`;
}

function renderParticipants(data,players,brands){
  const root=document.getElementById('cdTeams');
  if(!root)return;
  const participants=[...(data.participants?.남대부||[])];
  const playerTeams=new Map();
  players.forEach(player=>{
    const code=schoolCode(player),name=schoolName(player),label=shortName(name);
    if(!code||!name)return;
    if(!playerTeams.has(label))playerTeams.set(label,{code,name,count:0});
    playerTeams.get(label).count++;
  });
  const brandList=Object.values(brands.teams||{});
  const cards=participants.map(label=>{
    const info=playerTeams.get(shortName(label))||{code:label,name:label,count:0};
    const brand=brands.teams?.[info.code]||brandList.find(item=>shortName(item.school_name)===shortName(label));
    const mark=brand?.status==='asset_ready'&&brand.asset_path
      ?`<span class="cd-team-mark cd-team-logo"><img src="${esc(brand.asset_path)}" alt="${esc(info.name)} 로고" loading="lazy" onerror="this.parentElement.textContent='${esc(initials(label))}'"></span>`
      :`<span class="cd-team-mark">${esc(initials(label))}</span>`;
    return {...info,label,mark};
  }).sort((a,b)=>a.label.localeCompare(b.label,'ko'));
  root.innerHTML=cards.map(team=>`<a class="cd-team-card" href="university-team.html?school=${encodeURIComponent(team.code||team.name)}">${team.mark}<span><strong>${esc(team.label)}</strong><small>${team.count?`${team.count}명 등록`:'선수명단 확인 중'}</small></span></a>`).join('');
  const heading=document.querySelector('#teams .cd-section-title h2');
  if(heading)heading.textContent='남대부 참가대학';
}

function renderSources(data){
  const root=document.getElementById('cdSources');
  if(!root)return;
  const sources=data.sources||[];
  root.innerHTML=sources.length?sources.map(s=>`<a href="${esc(s.url||'#')}" ${/^https?:/.test(s.url||'')?'target="_blank" rel="noopener"':''}>${esc(s.label||'공식자료')} →</a>`).join(''):'<div class="cd-empty">공식자료가 등록되면 이곳에 표시됩니다.</div>';
}

function resetSnapshot(division){
  const playerCount=document.getElementById('cdPlayerCount');
  const avg=document.getElementById('cdAvgHeight');
  const playerUnit=document.getElementById('cdPlayerUnit');
  const heightUnit=document.getElementById('cdHeightUnit');
  const note=document.getElementById('cdSnapshotNote');
  if(playerCount)playerCount.textContent='-';
  if(avg)avg.textContent='-';
  if(playerUnit)playerUnit.textContent=division==='남대부'?'명':'명단 없음';
  if(heightUnit)heightUnit.textContent=division==='남대부'?'cm':'자료 없음';
  if(note)note.textContent=division==='남대부'?'단양대회 공식 일정 기준':'여대부 공식 일정 기준 · 선수명단 자료 미연결';
}

function bindDanyangState(data){
  document.querySelectorAll('[data-calendar-division]').forEach(button=>{
    if(button.dataset.danyangBound)return;
    button.dataset.danyangBound='1';
    button.addEventListener('click',()=>queueMicrotask(()=>resetSnapshot(button.dataset.calendarDivision)));
  });

  document.querySelectorAll('[data-standing-division]').forEach(button=>{
    if(button.dataset.danyangBound)return;
    button.dataset.danyangBound='1';
    button.addEventListener('click',()=>queueMicrotask(()=>{
      const division=button.dataset.standingDivision;
      document.querySelectorAll('[data-standing-division]').forEach(x=>x.classList.toggle('is-active',x===button));
      renderStandings(data,division);
      renderQualificationState(data,division);
    }));
  });
}

function applyDanyangOnce(data,players,brands){
  document.title='2026 단양대회 | K-Volley Lab';
  const title=document.getElementById('cdTitle');
  if(title)title.innerHTML=(data.titleLines||['2026 대한항공배','전국대학배구 단양대회']).map(x=>`<span class="cd-hero-title-line">${esc(x)}</span>`).join('');
  const status=document.querySelector('.cd-status');
  if(status)status.innerHTML=`<span>대회 상태</span><strong>${esc(data.statusLabel||'대회 준비 중')}</strong>`;
  document.querySelectorAll('.cd-jump a[data-view]').forEach(a=>{a.href=`university-competition-danyang.html?view=${a.dataset.view}`;a.hidden=false;});
  document.querySelectorAll('.cd-cal-game').forEach(a=>{a.href='university-competition-danyang.html?view=results';const b=a.querySelector('b');if(b&&!b.textContent.trim())b.textContent='vs';});
  document.querySelectorAll('.cd-score').forEach(b=>{if(!b.textContent.trim())b.textContent='vs';});
  const finalSection=document.getElementById('standings');if(finalSection)finalSection.hidden=false;
  const qualifier=document.querySelector('.cd-qualifier');if(qualifier)qualifier.hidden=false;
  resetSnapshot('남대부');
  renderStandings(data,'남대부');
  renderQualificationState(data,'남대부');
  renderParticipants(data,players,brands);
  renderSources(data);
  bindDanyangState(data);
}

function waitForMainRender(data,players,brands){
  const ready=()=>document.getElementById('cdCalendar')?.children.length||document.querySelector('.cd-match');
  if(ready())return applyDanyangOnce(data,players,brands);
  const observer=new MutationObserver(()=>{if(!ready())return;observer.disconnect();applyDanyangOnce(data,players,brands);});
  observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
}

async function start(){
  try{
    const [data,players,brands]=await Promise.all([
      danyangData||nativeFetch(`${DANYANG_URL}?v=20260801-6`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}),
      nativeFetch(PLAYER_URL,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),
      nativeFetch(BRAND_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}).catch(()=>({teams:{}}))
    ]);
    waitForMainRender(data,players,brands);
  }catch(error){console.error('Danyang clone adapter failed',error);}
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
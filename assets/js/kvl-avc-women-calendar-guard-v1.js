/* K-Volley Lab · AVC women calendar + schedule + groups guard v3
 * Progressive fallback: keeps overview calendar, schedule/results and pool standings usable
 * even when the full women competition renderer fails or is delayed.
 */
(()=>{
'use strict';
const DATA='data/competitions/avc-women-continental-2026.json?v=20260915-calendar-schedule-groups-guard-3';
const SELF='international-competition-avc-women-continental-2026-pc-hybrid-1180.html';
const STAGES=['전체','조별리그','8강','준결승','3위결정전','결승'];
const WEEK=['일','월','화','수','목','금','토'];
const TEAM={
  '중국':{flag:'cn',code:'CHN'},'이란':{flag:'ir',code:'IRI'},'대만':{flag:'tw',code:'TPE'},'이라크':{flag:'iq',code:'IRQ'},
  '태국':{flag:'th',code:'THA'},'인도네시아':{flag:'id',code:'INA'},'카자흐스탄':{flag:'kz',code:'KAZ'},'호주':{flag:'au',code:'AUS'},
  '일본':{flag:'jp',code:'JPN'},'대한민국':{flag:'kr',code:'KOR'},'베트남':{flag:'vn',code:'VIE'},'홍콩':{flag:'hk',code:'HKG'}
};
let data=null,stage='전체',pool='전체';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const done=m=>Number.isFinite(m?.setsA)&&Number.isFinite(m?.setsB);
const flag=name=>TEAM[name]?`https://flagcdn.com/w80/${TEAM[name].flag}.png`:'';
function renderCalendar(){
  const root=$('calendarRoot');
  if(!root||root.querySelector('.has-match')||!data)return;
  const matches=Array.isArray(data.matches)?data.matches:[];
  const byDate=matches.reduce((map,m)=>{(map[m.date]??=[]).push(m);return map},{});
  const year=2026,month=8,first=new Date(year,month-1,1),last=new Date(year,month,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push('<div class="kvl1180-day is-empty"></div>');
  for(let d=1;d<=last.getDate();d++){
    const date=`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const games=(byDate[date]||[]).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
    if(!games.length){cells.push(`<div class="kvl1180-day"><span class="kvl1180-date">${d}</span></div>`);continue;}
    const gameHtml=games.map(m=>`<span class="kvl1180-cal-game"><span class="kvl1180-cal-time">${esc(m.time||'미정')}</span><span class="kvl1180-cal-match"><span class="kvl1180-cal-team">${esc(m.teamA)}</span><b>vs</b><span class="kvl1180-cal-team">${esc(m.teamB)}</span>${done(m)?`<span class="kvl1180-cal-score">${m.setsA}-${m.setsB}</span>`:''}</span></span>`).join('');
    cells.push(`<div class="kvl1180-day has-match"><a href="${SELF}?view=schedule&date=${date}"><span class="kvl1180-date">${d}</span><span class="kvl1180-games">${gameHtml}</span></a></div>`);
  }
  while(cells.length%7)cells.push('<div class="kvl1180-day is-empty"></div>');
  root.innerHTML=`<div class="kvl1180-calendar-title">2026년 8월</div><div class="kvl1180-calendar-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="kvl1180-calendar-grid">${cells.join('')}</div>`;
}
function fmtDate(date){const d=new Date(`${date}T00:00:00+09:00`);return `${d.getMonth()+1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`}
function setPoolVisibility(){const wrap=$('schedulePoolFilter');if(!wrap)return;const show=stage==='조별리그';wrap.hidden=!show;wrap.style.setProperty('display',show?'flex':'none','important')}
function renderFilters(){
  const box=$('scheduleStageFilters');if(!box)return;
  box.innerHTML=STAGES.map(s=>`<button type="button" data-stage="${s}" class="${s===stage?'is-active':''}">${s}</button>`).join('');
  box.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{stage=btn.dataset.stage||'전체';if(stage!=='조별리그')pool='전체';renderSchedule(true)});
  const sel=$('schedulePoolSelect');if(sel){sel.value=pool;sel.onchange=()=>{pool=sel.value;renderSchedule(true)}}
  setPoolVisibility();
}
function teamSide(name,pos){const mark=`<span class="kvl1180-inline-logo"><img src="${flag(name)}" alt="${esc(name)} 국기" loading="lazy"></span>`,copy=`<span class="kvl1180-slot-copy"><strong>${esc(name)}</strong></span>`;return pos==='left'?`<span class="kvl1180-side is-left">${mark}${copy}</span>`:`<span class="kvl1180-side is-right">${copy}${mark}</span>`}
function matchRow(m){const sets=Array.isArray(m.sets)?m.sets.map(s=>`<span>${s[0]}-${s[1]}</span>`).join(''):'',score=done(m)?`${m.setsA}-${m.setsB}`:'VS';return `<article class="kvl1180-match-row${m.teamA==='대한민국'||m.teamB==='대한민국'?' is-korea':''}" data-match-id="${esc(m.id||'')}"><div class="kvl1180-match-meta"><time>${esc(m.time)} KST</time><span class="kvl1180-match-official-no">Match #${esc(m.officialNo)}</span></div><div class="kvl1180-match-board">${teamSide(m.teamA,'left')}<b class="kvl1180-score">${score}</b>${teamSide(m.teamB,'right')}</div><div class="kvl1180-set-scores">${sets}</div><div class="kvl1180-match-detail">${esc(m.stage)}${m.group?` · ${esc(m.group)}조`:''} · 톈진 올림픽 센터 체육관 · 중국 현지 ${esc(m.localTime||'—')} (UTC+8)</div></article>`}
function renderSchedule(force=false){
  const root=$('scheduleRoot');if(!root||!data)return;
  if(!force&&root.querySelector('.kvl1180-match-row')&&$('scheduleStageFilters')?.querySelector('button'))return;
  renderFilters();
  let list=[...(data.matches||[])];
  if(stage!=='전체')list=list.filter(m=>m.stage===stage);
  if(stage==='조별리그'&&pool!=='전체')list=list.filter(m=>m.group===pool);
  list.sort((a,b)=>a.date.localeCompare(b.date)||String(a.time).localeCompare(String(b.time)));
  const summary=$('scheduleSummary');if(summary)summary.innerHTML=`<strong>${stage}${stage==='조별리그'&&pool!=='전체'?` · ${pool}조`:''}</strong><span>${list.length}경기 · 한국시간(KST) / 중국 현지시간 병기</span>`;
  const groups=list.reduce((map,m)=>{(map[m.date]??=[]).push(m);return map},{});
  root.innerHTML=Object.entries(groups).map(([date,games])=>`<section id="date-${date}" class="kvl1180-date-group"><header class="kvl1180-date-head"><div class="kvl1180-date-title"><strong>${fmtDate(date)}</strong><span>${[...new Set(games.map(g=>g.stage))].join(' · ')}</span></div><span>${games.length}경기</span></header><div>${games.map(matchRow).join('')}</div></section>`).join('')||'<div class="kvl1180-schedule-empty">조건에 맞는 경기가 없습니다.</div>';
  const target=new URLSearchParams(location.search).get('date');
  if(target){const el=$(`date-${target}`);if(el){el.classList.add('is-target-date');requestAnimationFrame(()=>el.scrollIntoView({block:'start'}))}}
}
function matchPoints(a,b){return a===3?(b<=1?[3,0]:[2,1]):b===3?(a<=1?[0,3]:[1,2]):[0,0]}
function safeRatio(a,b){return b===0?(a>0?999:0):a/b}
function fmtRatio(a,b){return b===0?(a>0?'MAX':'0.000'):(a/b).toFixed(3)}
function calculateStandings(){
  const prelim=(data.matches||[]).filter(m=>m.stage==='조별리그'&&done(m)),stats=new Map();let order=0;
  (data.groups||[]).forEach(g=>(g.teams||[]).forEach((team,i)=>stats.set(team,{team,pool:g.id,original:i,globalOrder:order++,wins:0,losses:0,matchPoints:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,poolPosition:0})));
  prelim.forEach(m=>{
    const a=stats.get(m.teamA),b=stats.get(m.teamB);if(!a||!b)return;
    const [pa,pb]=matchPoints(m.setsA,m.setsB);a.matchPoints+=pa;b.matchPoints+=pb;
    a.setsFor+=m.setsA;a.setsAgainst+=m.setsB;b.setsFor+=m.setsB;b.setsAgainst+=m.setsA;
    if(m.setsA>m.setsB){a.wins++;b.losses++}else{b.wins++;a.losses++}
    (m.sets||[]).forEach(s=>{a.pointsFor+=s[0];a.pointsAgainst+=s[1];b.pointsFor+=s[1];b.pointsAgainst+=s[0]});
  });
  const cmp=(a,b,usePool=false)=>{
    if(usePool&&a.poolPosition!==b.poolPosition)return a.poolPosition-b.poolPosition;
    if(b.wins!==a.wins)return b.wins-a.wins;
    if(b.matchPoints!==a.matchPoints)return b.matchPoints-a.matchPoints;
    const sr=safeRatio(b.setsFor,b.setsAgainst)-safeRatio(a.setsFor,a.setsAgainst);if(Math.abs(sr)>1e-9)return sr;
    const pr=safeRatio(b.pointsFor,b.pointsAgainst)-safeRatio(a.pointsFor,a.pointsAgainst);if(Math.abs(pr)>1e-9)return pr;
    return a.globalOrder-b.globalOrder;
  };
  const poolTables={};
  (data.groups||[]).forEach(g=>{const rows=(g.teams||[]).map(t=>stats.get(t)).filter(Boolean);rows.sort((a,b)=>cmp(a,b,false));rows.forEach((r,i)=>r.poolPosition=i+1);poolTables[g.id]=rows});
  const combined=Object.values(poolTables).flat().sort((a,b)=>cmp(a,b,true));
  const seedByTeam=new Map((data.combinedSeeds||[]).map(x=>[x.team,Number(x.seed)||null]));
  const qualifiers=new Set([...seedByTeam.keys()]);
  const qfByTeam=new Map();
  (data.matches||[]).filter(m=>m.stage==='8강').forEach(m=>{
    const sa=Number(m.seedA)||seedByTeam.get(m.teamA)||null,sb=Number(m.seedB)||seedByTeam.get(m.teamB)||null;
    qfByTeam.set(m.teamA,{seed:sa,opp:sb});qfByTeam.set(m.teamB,{seed:sb,opp:sa});
  });
  return{prelim,poolTables,combined,seedByTeam,qualifiers,qfByTeam};
}
function teamIdentity(team,scope,seed,qualified){
  const info=TEAM[team]||{};
  const badge=seed?` <b class="kvl1180-pool-seed">${seed}번 시드</b>`:qualified?'':' <b class="kvl1180-pool-seed is-out">탈락</b>';
  return `<span class="${scope}-team"><img src="${flag(team)}" alt="${esc(team)} 국기" loading="lazy"><span class="${scope}-team-copy"><strong>${esc(team)}</strong><small>${esc(info.code||'')}${badge}</small></span></span>`;
}
function poolCard(poolId,rows,qualifiers,seedByTeam){
  return `<article class="kvl1180-pool-card"><header class="kvl1180-pool-card-head"><strong>${poolId}조</strong><span>4개국 · 6경기</span></header><div class="kvl1180-pool-table-head"><span>순위</span><span>국가</span><span>승</span><span>패</span><span>승점</span><span>세트</span><span>득점</span></div>${rows.map(r=>`<div class="kvl1180-pool-row ${qualifiers.has(r.team)?'is-qualified':'is-out'} ${r.team==='대한민국'?'is-korea':''}"><span class="kvl1180-pool-rank">${r.poolPosition}</span>${teamIdentity(r.team,'kvl1180-pool',seedByTeam.get(r.team),qualifiers.has(r.team))}<span class="kvl1180-pool-w">${r.wins}</span><span class="kvl1180-pool-l">${r.losses}</span><span class="kvl1180-pool-pts">${r.matchPoints}</span><span class="kvl1180-pool-ratio">${fmtRatio(r.setsFor,r.setsAgainst)}</span><span class="kvl1180-pool-ratio">${fmtRatio(r.pointsFor,r.pointsAgainst)}</span></div>`).join('')}</article>`;
}
function combinedRow(r,i,qualifiers,qfByTeam){
  const q=qfByTeam.get(r.team);
  return `<div class="kvl1180-combined-row ${qualifiers.has(r.team)?'is-qualified':'is-out'} ${r.team==='대한민국'?'is-korea':''}"><span class="kvl1180-combined-rank">${i+1}위</span>${teamIdentity(r.team,'kvl1180-combined',null,qualifiers.has(r.team))}<span class="kvl1180-combined-pool">${r.pool}조 ${r.poolPosition}위</span><span class="kvl1180-combined-stat">${r.wins}</span><span class="kvl1180-combined-stat">${r.losses}</span><span class="kvl1180-combined-stat">${r.matchPoints}</span><span class="kvl1180-combined-stat">${fmtRatio(r.setsFor,r.setsAgainst)}</span><span class="kvl1180-combined-stat">${fmtRatio(r.pointsFor,r.pointsAgainst)}</span><span><b class="kvl1180-combined-result ${qualifiers.has(r.team)?'is-qualified':'is-out'}">${qualifiers.has(r.team)?'8강 진출':'조별리그 탈락'}</b>${q?`<small class="kvl1180-qf-pairing">${q.seed}-${q.opp}</small>`:''}</span></div>`;
}
function mobileCombined(combined,qualifiers,qfByTeam){
  return `<div class="kvl-shared-combined-mobile"><div class="kvl-shared-combined-table is-complete" role="table"><div class="kvl-shared-combined-line is-head"><span class="kvl-shared-combined-identity"><span class="kvl-shared-combined-rank-head">종합순위</span><span class="kvl-shared-combined-country-head">국가</span></span><span>결과</span><span>승리 경기수</span><span>승점</span><span>세트 득실률</span><span>득점 득실률</span><span>조순위</span></div>${combined.map((r,i)=>{const q=qfByTeam.get(r.team),qualified=qualifiers.has(r.team);return `<div class="kvl-shared-combined-line${r.team==='대한민국'?' is-korea':''}"><span class="kvl-shared-combined-identity"><span class="kvl-shared-combined-rank">${i+1}위</span><span class="kvl-shared-combined-flag"><img src="${flag(r.team)}" alt="${esc(r.team)} 국기"></span><strong class="kvl-shared-combined-team">${esc(r.team)}</strong></span><span class="kvl-shared-combined-result ${qualified?'':'is-out'}"><b>${qualified?'8강 진출':'조별리그 탈락'}</b>${q?`<small>${q.seed}-${q.opp}</small>`:''}</span><span class="kvl-shared-combined-stat">${r.wins}승</span><span class="kvl-shared-combined-stat">${r.matchPoints}</span><span class="kvl-shared-combined-stat">${fmtRatio(r.setsFor,r.setsAgainst)}</span><span class="kvl-shared-combined-stat">${fmtRatio(r.pointsFor,r.pointsAgainst)}</span><span class="kvl-shared-combined-stat">${r.pool}조 ${r.poolPosition}위</span></div>`}).join('')}</div></div>`;
}
function renderGroups(){
  const section=document.querySelector('.kvl1180-view[data-view="groups"]');if(!section||!data)return;
  if(section.querySelector('.kvl1180-pool-grid')&&section.querySelector('.kvl1180-combined-row'))return;
  const {prelim,poolTables,combined,seedByTeam,qualifiers,qfByTeam}=calculateStandings();
  section.id='groups';section.classList.remove('kvl1180-prototype-placeholder');section.classList.add('kvl1180-groups-view');
  section.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">POOL STANDINGS</p><h2>조별순위</h2></div><div class="kvl1180-groups-status"><span><strong>조별리그 종료</strong></span><span>${prelim.length}/18경기 완료</span></div></div><div class="kvl1180-groups-rule"><span><strong>8강 진출 기준</strong> · 각 조 상위 2팀 + 조 3위 중 성적 상위 2팀</span><span class="kvl1180-groups-legend"><span class="q"><i></i>8강 진출</span><span class="o"><i></i>조별리그 탈락</span></span></div><div class="kvl1180-pool-grid">${['A','B','C'].map(p=>poolCard(p,poolTables[p]||[],qualifiers,seedByTeam)).join('')}</div><div class="kvl1180-combined-block"><div class="kvl1180-combined-head"><div><p class="label">PRELIMINARY OVERALL RANKING</p><h3>예선 종합순위</h3></div><p>조 순위 → 승리 경기수 → 승점 → 세트 득실률 → 득점 득실률</p></div><div class="kvl1180-combined-table"><div class="kvl1180-combined-table-head"><span>종합순위</span><span>국가</span><span>조순위</span><span>승</span><span>패</span><span>승점</span><span>세트 득실률</span><span>득점 득실률</span><span>결과</span></div>${combined.map((r,i)=>combinedRow(r,i,qualifiers,qfByTeam)).join('')}</div>${mobileCombined(combined,qualifiers,qfByTeam)}</div><div class="kvl1180-ranking-rule-card"><strong>순위 계산 기준</strong><p>조별 순위는 승리 경기 수 → 승점 → 세트 득실률 → 득점 득실률 순으로 자동 계산합니다. 예선 종합순위는 조 순위를 우선한 뒤 같은 조 순위끼리 세부 성적을 비교하며, 1~8위는 공식 8강 시드와 교차검수합니다.</p></div>`;
}
function init(){
  fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(json=>{
    data=json;renderCalendar();
    setTimeout(()=>renderSchedule(false),180);
    setTimeout(()=>renderGroups(),220);
  }).catch(()=>{
    const root=$('scheduleRoot');if(root&&!root.querySelector('.kvl1180-match-row'))root.innerHTML='<div class="kvl1180-schedule-empty">경기 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
    const section=document.querySelector('.kvl1180-view[data-view="groups"]');if(section&&!section.querySelector('.kvl1180-pool-grid'))section.innerHTML='<div class="kvl1180-section-head"><div><p class="label">POOL STANDINGS</p><h2>조별순위</h2></div></div><p>조별순위 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

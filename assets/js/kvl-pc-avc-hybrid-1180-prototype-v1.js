(()=>{
'use strict';
const DATA='data/competitions/avc-men-continental-2026.json?v=20260911-pc-final-1';
const SELF='international-competition-avc-men-continental-2026-pc-hybrid-1180.html';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TEAM_INFO={
  '일본':{en:'Japan',code:'JPN',flag:'jp'},'호주':{en:'Australia',code:'AUS',flag:'au'},'바레인':{en:'Bahrain',code:'BRN',flag:'bh'},'오만':{en:'Oman',code:'OMA',flag:'om'},'이란':{en:'Iran',code:'IRI',flag:'ir'},'중국':{en:'China',code:'CHN',flag:'cn'},'인도':{en:'India',code:'IND',flag:'in'},'뉴질랜드':{en:'New Zealand',code:'NZL',flag:'nz'},'카타르':{en:'Qatar',code:'QAT',flag:'qa'},'대한민국':{en:'South Korea',code:'KOR',flag:'kr'},'대만':{en:'Chinese Taipei',code:'TPE',flag:'tw'},'태국':{en:'Thailand',code:'THA',flag:'th'}
};
const STAGES=['전체','조별리그','8강','준결승','3위결정전','결승'];
const WEEK=['일','월','화','수','목','금','토'];
const VENUE_SHORT='기타큐슈시 종합체육관';
let data=null,stageFilter='전체',poolFilter='전체';
const $=id=>document.getElementById(id);
function completed(m){return Boolean(m)&&Number.isFinite(m.setsA)&&Number.isFinite(m.setsB)}
function winnerName(m){if(!completed(m))return '';return m.setsA>m.setsB?m.teamA:m.teamB}
function loserName(m){if(!completed(m))return '';return m.setsA>m.setsB?m.teamB:m.teamA}
function score(m){return completed(m)?`${m.setsA}-${m.setsB}`:'VS'}
function teamSeedText(seed){return Number.isFinite(seed)?`예선 종합 ${seed}위`:'미정'}
function teamLabel(m,side){
  const name=side==='A'?m.teamA:m.teamB,seed=side==='A'?m.seedA:m.seedB;
  if(name&&name!=='TBD')return name;
  if(Number.isFinite(seed))return teamSeedText(seed);
  if(m.id==='SF1')return side==='A'?'QF1 승자':'QF2 승자';
  if(m.id==='SF2')return side==='A'?'QF3 승자':'QF4 승자';
  if(m.id==='3RD')return side==='A'?'SF1 패자':'SF2 패자';
  if(m.id==='FINAL')return side==='A'?'SF1 승자':'SF2 승자';
  return '미정';
}
function flagUrl(name){return TEAM_INFO[name]?`https://flagcdn.com/w80/${TEAM_INFO[name].flag}.png`:''}
function fmtDate(date){const d=new Date(`${date}T00:00:00+09:00`);return `${d.getMonth()+1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`}
function shortDate(date){return String(date||'').slice(5).replace('-','.')}
function viewFromUrl(){const v=new URLSearchParams(location.search).get('view')||'overview';return ['overview','schedule','groups','knockout','rosters','resources'].includes(v)?v:'overview'}
function activateView(){
  const view=viewFromUrl();
  document.querySelectorAll('.kvl1180-view').forEach(el=>{el.hidden=el.dataset.view!==view});
  document.querySelectorAll('.kvl1180-tabs a').forEach(a=>{const on=a.dataset.view===view;a.classList.toggle('is-active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(view==='schedule'&&data)renderSchedule();
  if(view==='groups'&&data)renderGroups();
  if(view==='knockout'&&data)renderKnockout();
}
function renderKorea(matches){
  const rows=(matches||[]).filter(m=>(m.teamA==='대한민국'||m.teamB==='대한민국')&&completed(m));
  const root=$('koreaResults');if(!root)return;
  if(!rows.length){root.innerHTML='<div class="kvl1180-result-row"><strong>완료 경기 없음</strong><span>—</span><em>—</em></div>';return}
  root.innerHTML=rows.slice(-3).reverse().map(m=>{const koreaA=m.teamA==='대한민국',opp=koreaA?m.teamB:m.teamA,ks=koreaA?m.setsA:m.setsB,os=koreaA?m.setsB:m.setsA,win=ks>os;return `<div class="kvl1180-result-row"><strong>vs ${esc(opp)}</strong><span>${ks} - ${os}</span><em class="${win?'win':'loss'}">${win?'승':'패'}</em></div>`}).join('');
}
function calendarTeam(m,side){return teamLabel(m,side).replace('예선 종합 ','예선 ')}
function renderCalendar(matches){
  const root=$('calendarRoot');if(!root)return;
  const byDate=(matches||[]).reduce((o,m)=>{(o[m.date]??=[]).push(m);return o},{}),year=2026,month=9,first=new Date(year,month-1,1),last=new Date(year,month,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push('<div class="kvl1180-day is-empty"></div>');
  for(let d=1;d<=last.getDate();d++){
    const date=`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`,games=(byDate[date]||[]).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
    if(games.length){
      const html=games.map(m=>{const a=calendarTeam(m,'A'),b=calendarTeam(m,'B'),s=completed(m)?`<span class="kvl1180-cal-score">${m.setsA}-${m.setsB}</span>`:'';return `<span class="kvl1180-cal-game"><span class="kvl1180-cal-time">${esc(m.time||'미정')}</span><span class="kvl1180-cal-match"><span class="kvl1180-cal-team">${esc(a)}</span><b>vs</b><span class="kvl1180-cal-team">${esc(b)}</span>${s}</span></span>`}).join('');
      cells.push(`<div class="kvl1180-day has-match"><a href="${SELF}?view=schedule&date=${date}"><span class="kvl1180-date">${d}</span><span class="kvl1180-games">${html}</span></a></div>`);
    }else cells.push(`<div class="kvl1180-day"><span class="kvl1180-date">${d}</span></div>`);
  }
  while(cells.length%7)cells.push('<div class="kvl1180-day is-empty"></div>');
  root.innerHTML=`<div class="kvl1180-calendar-title">2026년 9월</div><div class="kvl1180-calendar-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="kvl1180-calendar-grid">${cells.join('')}</div>`;
}
function renderScheduleFilters(){
  const box=$('scheduleStageFilters');if(!box)return;
  box.innerHTML=STAGES.map(stage=>`<button type="button" data-stage="${esc(stage)}" class="${stage===stageFilter?'is-active':''}">${esc(stage)}</button>`).join('');
  box.querySelectorAll('[data-stage]').forEach(btn=>btn.addEventListener('click',()=>{stageFilter=btn.dataset.stage;if(stageFilter!=='조별리그')poolFilter='전체';renderSchedule()}));
  const wrap=$('schedulePoolFilter'),sel=$('schedulePoolSelect');
  if(wrap)wrap.hidden=stageFilter!=='조별리그';
  if(sel){sel.value=poolFilter;sel.onchange=()=>{poolFilter=sel.value;renderSchedule()}}
}
function metaText(m){return `${m.stage}${m.stage==='조별리그'&&m.group?` · ${m.group}조`:''} · ${VENUE_SHORT}`}
function setScoresHtml(m){
  if(!completed(m)||!Array.isArray(m.sets)||!m.sets.length)return '';
  return m.sets.map(s=>Array.isArray(s)&&s.length>=2?`${s[0]}-${s[1]}`:'').filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('');
}
function teamSide(m,side,position){
  const actual=side==='A'?m.teamA:m.teamB,label=teamLabel(m,side),seed=side==='A'?m.seedA:m.seedB,known=actual&&actual!=='TBD'&&TEAM_INFO[actual];
  const mark=known?`<span class="kvl1180-inline-logo"><img src="${flagUrl(actual)}" alt="${esc(actual)} 국기" loading="lazy"></span>`:`<span class="kvl1180-inline-logo kvl1180-seed-icon" aria-hidden="true">${Number.isFinite(seed)?seed:'?'}</span>`;
  const copy=`<span class="kvl1180-slot-copy"><strong>${esc(label)}</strong></span>`;
  return position==='left'?`<span class="kvl1180-side is-left">${mark}${copy}</span>`:`<span class="kvl1180-side is-right">${copy}${mark}</span>`;
}
function matchRow(m){
  const done=completed(m),korea=m.teamA==='대한민국'||m.teamB==='대한민국';
  return `<article class="kvl1180-match-row ${korea?'is-korea':''}"><div class="kvl1180-match-meta"><time>${esc(m.time||'시간 미정')} KST</time></div><div class="kvl1180-match-board">${teamSide(m,'A','left')}<b class="kvl1180-score ${done?'':'is-upcoming'}">${score(m)}</b>${teamSide(m,'B','right')}</div><div class="kvl1180-set-scores">${setScoresHtml(m)}</div><div class="kvl1180-match-detail">${esc(metaText(m))} · 일본 현지 ${esc(m.time||'시간 미정')} JST</div></article>`;
}
function renderSchedule(){
  if(!data)return;
  renderScheduleFilters();
  let list=(data.matches||[]).slice();
  if(stageFilter!=='전체')list=list.filter(m=>m.stage===stageFilter);
  if(stageFilter==='조별리그'&&poolFilter!=='전체')list=list.filter(m=>m.group===poolFilter);
  list.sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time||'').localeCompare(String(b.time||'')));
  const done=list.filter(completed).length,root=$('scheduleRoot'),summary=$('scheduleSummary');
  if(summary)summary.innerHTML=`<strong>${stageFilter}${stageFilter==='조별리그'&&poolFilter!=='전체'?` · ${poolFilter}조`:''}</strong><span>${list.length}경기 · 완료 ${done} · 예정 ${list.length-done} · KST/JST 동일 시각</span>`;
  if(!root)return;
  const groups=list.reduce((o,m)=>{(o[m.date]??=[]).push(m);return o},{});
  root.innerHTML=Object.entries(groups).map(([date,games])=>`<section id="date-${date}" class="kvl1180-date-group"><header class="kvl1180-date-head"><div class="kvl1180-date-title"><strong>${fmtDate(date)}</strong><span>${[...new Set(games.map(g=>g.stage))].join(' · ')}</span></div><span>${games.length}경기</span></header><div>${games.map(matchRow).join('')}</div></section>`).join('')||'<div class="kvl1180-schedule-empty">선택한 조건의 경기가 없습니다.</div>';
  const target=new URLSearchParams(location.search).get('date');if(target&&$(`date-${target}`))requestAnimationFrame(()=>$(`date-${target}`).scrollIntoView({block:'start'}));
}
function matchPoints(a,b){return a===3?(b<=1?[3,0]:[2,1]):b===3?(a<=1?[0,3]:[1,2]):[0,0]}
function safeRatio(a,b){return b===0?(a>0?999:0):a/b}
function fmtRatio(a,b){if(b===0)return a>0?'MAX':'0.000';return (a/b).toFixed(3)}
function calculateStandings(){
  const poolMatches=(data.matches||[]).filter(m=>m.stage==='조별리그'&&completed(m));
  const stats=new Map();let globalOrder=0;
  (data.groups||[]).forEach(g=>(g.teams||[]).forEach((team,index)=>stats.set(team,{team,pool:g.id,original:index,globalOrder:globalOrder++,played:0,wins:0,losses:0,matchPoints:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,poolPosition:0})));
  poolMatches.forEach(m=>{
    const a=stats.get(m.teamA),b=stats.get(m.teamB);if(!a||!b)return;
    const [pa,pb]=matchPoints(m.setsA,m.setsB);a.played++;b.played++;a.matchPoints+=pa;b.matchPoints+=pb;a.setsFor+=m.setsA;a.setsAgainst+=m.setsB;b.setsFor+=m.setsB;b.setsAgainst+=m.setsA;
    if(m.setsA>m.setsB){a.wins++;b.losses++}else{b.wins++;a.losses++}
    (m.sets||[]).forEach(s=>{if(!Array.isArray(s)||s.length<2)return;const x=Number(s[0]),y=Number(s[1]);if(!Number.isFinite(x)||!Number.isFinite(y))return;a.pointsFor+=x;a.pointsAgainst+=y;b.pointsFor+=y;b.pointsAgainst+=x});
  });
  const directWinner=(a,b)=>{const m=poolMatches.find(x=>(x.teamA===a.team&&x.teamB===b.team)||(x.teamA===b.team&&x.teamB===a.team));if(!m)return '';return m.setsA>m.setsB?m.teamA:m.teamB};
  const cmp=(a,b,usePoolPosition=false)=>{
    if(usePoolPosition&&a.poolPosition!==b.poolPosition)return a.poolPosition-b.poolPosition;
    if(b.wins!==a.wins)return b.wins-a.wins;if(b.matchPoints!==a.matchPoints)return b.matchPoints-a.matchPoints;
    const sr=safeRatio(b.setsFor,b.setsAgainst)-safeRatio(a.setsFor,a.setsAgainst);if(Math.abs(sr)>1e-9)return sr;
    const pr=safeRatio(b.pointsFor,b.pointsAgainst)-safeRatio(a.pointsFor,a.pointsAgainst);if(Math.abs(pr)>1e-9)return pr;
    return 0;
  };
  const poolTables={};
  (data.groups||[]).forEach(g=>{const rows=(g.teams||[]).map(t=>stats.get(t)).filter(Boolean);rows.sort((a,b)=>{const c=cmp(a,b,false);if(c)return c;const winner=directWinner(a,b);if(winner)return winner===a.team?-1:1;return a.original-b.original});rows.forEach((r,i)=>r.poolPosition=i+1);poolTables[g.id]=rows});
  let qualifierSet=new Set((data.matches||[]).filter(m=>m.stage==='8강').flatMap(m=>[m.teamA,m.teamB]).filter(t=>t&&t!=='TBD'));
  if(qualifierSet.size<8){const direct=Object.values(poolTables).flatMap(rows=>rows.filter(r=>r.poolPosition<=2));const thirds=Object.values(poolTables).map(rows=>rows.find(r=>r.poolPosition===3)).filter(Boolean).sort((a,b)=>cmp(a,b,false)||a.globalOrder-b.globalOrder).slice(0,2);qualifierSet=new Set([...direct,...thirds].map(r=>r.team))}
  const combined=Object.values(poolTables).flat().sort((a,b)=>cmp(a,b,true)||a.globalOrder-b.globalOrder);
  const seedByTeam=new Map();combined.filter(r=>qualifierSet.has(r.team)).forEach((r,i)=>seedByTeam.set(r.team,i+1));
  return {poolMatches,poolTables,combined,qualifierSet,seedByTeam};
}
function teamIdentity(team,scope){const info=TEAM_INFO[team]||{code:'',flag:''};return `<span class="${scope}-team"><img src="${flagUrl(team)}" alt="${esc(team)} 국기" loading="lazy"><span class="${scope}-team-copy"><strong>${esc(team)}</strong><small>${esc(info.code)}</small></span></span>`}
function poolCard(pool,rows,qualifierSet){
  const body=rows.map(r=>{const qualified=qualifierSet.has(r.team),korea=r.team==='대한민국';return `<div class="kvl1180-pool-row ${qualified?'is-qualified':'is-out'} ${korea?'is-korea':''}"><span class="kvl1180-pool-rank">${r.poolPosition}</span>${teamIdentity(r.team,'kvl1180-pool')}<span class="kvl1180-pool-wl">${r.wins}-${r.losses}</span><span class="kvl1180-pool-pts">${r.matchPoints}</span><span class="kvl1180-pool-ratio">${fmtRatio(r.setsFor,r.setsAgainst)}</span><span class="kvl1180-pool-ratio">${fmtRatio(r.pointsFor,r.pointsAgainst)}</span></div>`}).join('');
  return `<article class="kvl1180-pool-card"><header class="kvl1180-pool-card-head"><strong>${esc(pool)}조</strong><span>4개국 · 6경기</span></header><div class="kvl1180-pool-table-head"><span>순위</span><span>국가</span><span>승-패</span><span>승점</span><span>세트</span><span>득점</span></div>${body}</article>`;
}
function combinedRow(r,index,qualifierSet){
  const rank=index+1,qualified=qualifierSet.has(r.team),korea=r.team==='대한민국';
  return `<div class="kvl1180-combined-row ${qualified?'is-qualified':'is-out'} ${korea?'is-korea':''} ${rank===8?'is-cutline':''}"><span class="kvl1180-combined-rank">${rank}위</span>${teamIdentity(r.team,'kvl1180-combined')}<span class="kvl1180-combined-pool">${r.pool}조 ${r.poolPosition}위</span><span class="kvl1180-combined-stat">${r.wins}</span><span class="kvl1180-combined-stat">${r.losses}</span><span class="kvl1180-combined-stat">${r.matchPoints}</span><span class="kvl1180-combined-stat">${fmtRatio(r.setsFor,r.setsAgainst)}</span><span class="kvl1180-combined-stat">${fmtRatio(r.pointsFor,r.pointsAgainst)}</span><span><b class="kvl1180-combined-result ${qualified?'is-qualified':'is-out'}">${qualified?'8강 진출':'조별리그 탈락'}</b></span></div>`;
}
function renderGroups(){
  if(!data)return;const section=document.querySelector('.kvl1180-view[data-view="groups"]');if(!section)return;
  const {poolMatches,poolTables,combined,qualifierSet}=calculateStandings();
  section.classList.remove('kvl1180-prototype-placeholder');section.classList.add('kvl1180-groups-view');
  section.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">POOL STANDINGS</p><h2>조별순위</h2></div><div class="kvl1180-groups-status"><span><strong>조별리그 종료</strong></span><span>${poolMatches.length}/18경기 완료</span></div></div><div class="kvl1180-groups-rule"><span><strong>8강 진출 기준</strong> · 각 조 상위 2팀 + 조 3위 중 성적 상위 2팀</span><div class="kvl1180-groups-legend"><span class="q"><i></i>8강 진출</span><span class="o"><i></i>조별리그 탈락</span></div></div><div class="kvl1180-pool-grid">${['A','B','C'].map(p=>poolCard(p,poolTables[p]||[],qualifierSet)).join('')}</div><div class="kvl1180-combined-block"><div class="kvl1180-combined-head"><div><p class="label">PRELIMINARY OVERALL RANKING</p><h3>예선 종합순위</h3></div><p>조 순위 → 승리 경기수 → 승점 → 세트 득실률 → 득점 득실률 순으로 자동 계산</p></div><div class="kvl1180-combined-table" role="table" aria-label="예선 종합순위"><div class="kvl1180-combined-table-head" role="row"><span>종합순위</span><span>국가</span><span>조순위</span><span>승</span><span>패</span><span>승점</span><span>세트 득실률</span><span>득점 득실률</span><span>결과</span></div>${combined.map((r,i)=>combinedRow(r,i,qualifierSet)).join('')}</div><p class="kvl1180-groups-footnote">※ 세트 득실률과 득점 득실률은 입력된 공식 경기결과를 기준으로 자동 계산합니다. 8강 진출 표시는 현재 확정 대진과 연동됩니다.</p></div><div class="kvl1180-ranking-rule-card"><strong>순위 계산 기준</strong><p>조별 순위는 승리 경기 수 → 승점 → 세트 득실률 → 득점 득실률 순으로 계산합니다. 예선 종합순위는 먼저 각 팀의 <b>조 순위</b>를 비교한 뒤 같은 조 순위끼리 승리 수와 세부 지표를 비교합니다.</p><small>3-0·3-1 승리 3점 / 3-2 승리 2점 / 2-3 패배 1점 / 0-3·1-3 패배 0점. 완전 동률의 최종 처리는 AVC/FIVB 공식 타이브레이크를 우선합니다.</small></div>`;
}
function matchMap(){return new Map((data.matches||[]).map(m=>[m.id,m]))}
function resolveParticipant(m,side,map){
  if(!m)return {team:'',label:'미정',source:''};
  const raw=side==='A'?m.teamA:m.teamB;if(raw&&raw!=='TBD')return {team:raw,label:raw,source:''};
  if(m.stage==='준결승'){
    const path=(data.competitionSystem?.semifinalPaths||[]).find(x=>x.matchId===m.id)?.from|| (m.id==='SF1'?['QF1','QF2']:['QF3','QF4']);
    const source=path[side==='A'?0:1],team=winnerName(map.get(source));return {team,label:team||`${source} 승자`,source};
  }
  if(m.id==='FINAL'||m.id==='3RD'){
    const source=side==='A'?'SF1':'SF2',src=map.get(source),team=m.id==='FINAL'?winnerName(src):loserName(src);return {team,label:team||`${source} ${m.id==='FINAL'?'승자':'패자'}`,source};
  }
  return {team:'',label:'미정',source:''};
}
function bracketTeam(m,side,map,seedByTeam){
  const p=resolveParticipant(m,side,map),won=completed(m)&&winnerName(m)===p.team,korea=p.team==='대한민국',scoreValue=completed(m)?(side==='A'?m.setsA:m.setsB):'—',seed=p.team?seedByTeam.get(p.team):null;
  const mark=p.team?`<span class="kvl1180-bracket-mark"><img src="${flagUrl(p.team)}" alt="${esc(p.team)} 국기" loading="lazy"></span>`:`<span class="kvl1180-bracket-mark is-path">${esc(p.source||'?')}</span>`;
  const sub=m.stage==='8강'&&seed?`예선 ${seed}번 시드`:(TEAM_INFO[p.team]?.code||p.source||'대진 대기');
  return `<div class="kvl1180-bracket-team ${won?'is-winner':''} ${korea?'is-korea':''} ${p.team?'':'is-pending'}">${mark}<span class="kvl1180-bracket-copy"><strong>${esc(p.label)}</strong><small>${esc(sub)}</small></span><b class="kvl1180-team-score">${esc(scoreValue)}</b></div>`;
}
function bracketSetLine(m){if(!completed(m)||!Array.isArray(m.sets)||!m.sets.length)return '';const txt=m.sets.map(s=>Array.isArray(s)&&s.length>=2?`${s[0]}-${s[1]}`:'').filter(Boolean).join(' · ');return txt?`<div class="kvl1180-match-sets">${esc(txt)}</div>`:''}
function bracketMatch(m,map,seedByTeam){
  if(!m)return '<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>TBD</strong><span>일정 미정</span></div></article>';
  const seedA=m.teamA&&m.teamA!=='TBD'?seedByTeam.get(m.teamA):null,seedB=m.teamB&&m.teamB!=='TBD'?seedByTeam.get(m.teamB):null,pair=m.stage==='8강'&&seedA&&seedB?` · ${seedA}-${seedB}`:'';
  return `<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>${esc(m.id)}${pair}</strong><span>${esc(shortDate(m.date))} · ${esc(m.time||'미정')} KST</span></div>${bracketTeam(m,'A',map,seedByTeam)}${bracketTeam(m,'B',map,seedByTeam)}${bracketSetLine(m)}</article>`;
}
function finalCard(rank,team,label){
  const champion=rank===1,mark=team?`<span class="kvl1180-final-flag"><img src="${flagUrl(team)}" alt="${esc(team)} 국기" loading="lazy"></span>`:'<span class="kvl1180-final-flag is-pending">?</span>';
  return `<article class="kvl1180-final-card ${champion?'is-champion':''}"><span class="kvl1180-final-rank">${rank}위</span>${mark}<span class="kvl1180-final-copy"><strong>${esc(team||'미정')}</strong><small>${esc(label)}</small></span></article>`;
}
function knockoutStatus(qf,sf,final,bronze){
  const q=qf.filter(completed).length,s=sf.filter(completed).length;if(completed(final)&&completed(bronze))return ['대회 종료','최종 순위 확정'];if(s===2)return ['결승 대기','결승 · 3위전 예정'];if(q===4)return ['준결승 단계',`${s}/2경기 완료`];return ['8강 진행 중',`${q}/4경기 완료`];
}
function renderKnockout(){
  if(!data)return;const section=document.querySelector('.kvl1180-view[data-view="knockout"]');if(!section)return;
  const map=matchMap(),qf=['QF1','QF2','QF3','QF4'].map(id=>map.get(id)).filter(Boolean),sf=['SF1','SF2'].map(id=>map.get(id)).filter(Boolean),final=map.get('FINAL'),bronze=map.get('3RD'),{seedByTeam}=calculateStandings(),status=knockoutStatus(qf,sf,final,bronze);
  const champion=winnerName(final),runner=loserName(final),third=winnerName(bronze),fourth=loserName(bronze);
  section.classList.remove('kvl1180-prototype-placeholder');section.classList.add('kvl1180-knockout-view');
  section.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">FINAL STANDINGS</p><h2>최종순위</h2></div><div class="kvl1180-knockout-status"><span><strong>${esc(status[0])}</strong></span><span>${esc(status[1])}</span></div></div><div class="kvl1180-final-block"><div class="kvl1180-final-block-head"><div><p class="label">FINAL RANKING</p><h3>최종 1~4위</h3></div><p>결승과 3위 결정전 결과에 따라 자동 확정됩니다.</p></div><div class="kvl1180-final-grid">${finalCard(1,champion,champion?'우승':'결승 종료 후 확정')}${finalCard(2,runner,runner?'준우승':'결승 종료 후 확정')}${finalCard(3,third,third?'3위':'3위 결정전 종료 후 확정')}${finalCard(4,fourth,fourth?'4위':'3위 결정전 종료 후 확정')}</div></div><div class="kvl1180-knockout-block"><div class="kvl1180-knockout-subhead"><div><p class="label">KNOCKOUT BRACKET</p><h3>8강 토너먼트</h3></div><p>8강 → 준결승 → 결승 · 경기결과 자동 연동</p></div><div class="kvl1180-bracket"><div class="kvl1180-bracket-ladder"><section class="kvl1180-round kvl1180-round-qf"><h4 class="kvl1180-round-title">8강 · Quarterfinals</h4><div class="kvl1180-round-body"><div class="kvl1180-qf-pair">${bracketMatch(qf[0],map,seedByTeam)}${bracketMatch(qf[1],map,seedByTeam)}</div><div class="kvl1180-qf-pair">${bracketMatch(qf[2],map,seedByTeam)}${bracketMatch(qf[3],map,seedByTeam)}</div></div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-sf"><h4 class="kvl1180-round-title">준결승 · Semifinals</h4><div class="kvl1180-round-body">${bracketMatch(sf[0],map,seedByTeam)}${bracketMatch(sf[1],map,seedByTeam)}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-final"><h4 class="kvl1180-round-title">결승 · Final</h4><div class="kvl1180-round-body">${bracketMatch(final,map,seedByTeam)}</div></section></div><div class="kvl1180-bronze"><h4 class="kvl1180-bronze-title">3위 결정전 · Bronze Medal Match</h4>${bracketMatch(bronze,map,seedByTeam)}</div></div><div class="kvl1180-knockout-note"><b>결선 연결 기준</b> · 각 8강 경기의 승자가 지정된 준결승으로 자동 연결되고, 준결승 승자는 결승 · 패자는 3위 결정전으로 연결됩니다. 8강 카드에는 예선 종합순위 시드 조합도 함께 표시합니다.</div></div>`;
}
function renderBase(){
  $('teamCount')&&($('teamCount').textContent=data.teamCount||12);$('groupCount')&&($('groupCount').textContent=data.groupCount||3);$('matchCount')&&($('matchCount').textContent=data.matchCount||26);$('heroTeamCount')&&($('heroTeamCount').textContent=`${data.teamCount||12}개국`);$('heroScheduleStatus')&&($('heroScheduleStatus').textContent=data.scheduleStatusLabel||'대회 진행 중');
  renderKorea(data.matches||[]);renderCalendar(data.matches||[]);renderSchedule();renderGroups();renderKnockout();
}
fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(json=>{data=json;renderBase();activateView()}).catch(()=>{const c=$('calendarRoot');if(c)c.innerHTML='<div class="kvl1180-calendar-title">2026년 9월</div><div class="kvl1180-schedule-empty">대회 데이터를 불러오지 못했습니다.</div>';const s=$('scheduleRoot');if(s)s.innerHTML='<div class="kvl1180-schedule-empty">대회 데이터를 불러오지 못했습니다.</div>';activateView()});
})();
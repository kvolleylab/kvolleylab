(()=>{
'use strict';
const DATA='data/competitions/avc-men-continental-2026.json?v=20260908-pc-schedule-2';
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
function completed(m){return Number.isFinite(m.setsA)&&Number.isFinite(m.setsB)}
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
function viewFromUrl(){const v=new URLSearchParams(location.search).get('view')||'overview';return ['overview','schedule','groups','knockout','rosters','resources'].includes(v)?v:'overview'}
function activateView(){
  const view=viewFromUrl();
  document.querySelectorAll('.kvl1180-view').forEach(el=>{el.hidden=el.dataset.view!==view});
  document.querySelectorAll('.kvl1180-tabs a').forEach(a=>{const on=a.dataset.view===view;a.classList.toggle('is-active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(view==='schedule'&&data)renderSchedule();
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
    if(games.length){const html=games.map(m=>{const a=calendarTeam(m,'A'),b=calendarTeam(m,'B'),s=completed(m)?`<span class="kvl1180-cal-score">${m.setsA}-${m.setsB}</span>`:'';return `<span class="kvl1180-cal-game"><span class="kvl1180-cal-time">${esc(m.time||'미정')}</span><span class="kvl1180-cal-match"><span class="kvl1180-cal-team">${esc(a)}</span><b>vs</b><span class="kvl1180-cal-team">${esc(b)}</span>${s}</span></span>`}).join('');cells.push(`<div class="kvl1180-day has-match"><a href="${SELF}?view=schedule&date=${date}"><span class="kvl1180-date">${d}</span><span class="kvl1180-games">${html}</span></a></div>`)}else cells.push(`<div class="kvl1180-day"><span class="kvl1180-date">${d}</span></div>`);
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
  return m.sets.map(s=>{if(Array.isArray(s)&&s.length>=2)return `${s[0]}-${s[1]}`;return ''}).filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('');
}
function teamSide(m,side,position){
  const actual=side==='A'?m.teamA:m.teamB,label=teamLabel(m,side),seed=side==='A'?m.seedA:m.seedB,known=actual&&actual!=='TBD'&&TEAM_INFO[actual];
  const mark=known?`<span class="kvl1180-inline-logo"><img src="${flagUrl(actual)}" alt="${esc(actual)} 국기" loading="lazy"></span>`:`<span class="kvl1180-inline-logo kvl1180-seed-icon" aria-hidden="true">${Number.isFinite(seed)?seed:'?'}</span>`;
  const copy=`<span class="kvl1180-slot-copy"><strong>${esc(label)}</strong></span>`;
  return position==='left'?`<span class="kvl1180-side is-left">${mark}${copy}</span>`:`<span class="kvl1180-side is-right">${copy}${mark}</span>`;
}
function matchRow(m){
  const done=completed(m),korea=m.teamA==='대한민국'||m.teamB==='대한민국';
  return `<article class="kvl1180-match-row ${korea?'is-korea':''}">
    <div class="kvl1180-match-meta"><time>${esc(m.time||'시간 미정')} KST</time></div>
    <div class="kvl1180-match-board">${teamSide(m,'A','left')}<b class="kvl1180-score ${done?'':'is-upcoming'}">${score(m)}</b>${teamSide(m,'B','right')}</div>
    <div class="kvl1180-set-scores">${setScoresHtml(m)}</div>
    <div class="kvl1180-match-detail">${esc(metaText(m))} · 일본 현지 ${esc(m.time||'시간 미정')} JST</div>
  </article>`;
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
function renderBase(){
  $('teamCount')&&($('teamCount').textContent=data.teamCount||12);$('groupCount')&&($('groupCount').textContent=data.groupCount||3);$('matchCount')&&($('matchCount').textContent=data.matchCount||26);$('heroTeamCount')&&($('heroTeamCount').textContent=`${data.teamCount||12}개국`);$('heroScheduleStatus')&&($('heroScheduleStatus').textContent=data.scheduleStatusLabel||'대회 진행 중');
  renderKorea(data.matches||[]);renderCalendar(data.matches||[]);renderSchedule();
}
fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(json=>{data=json;renderBase();activateView()}).catch(()=>{const c=$('calendarRoot');if(c)c.innerHTML='<div class="kvl1180-calendar-title">2026년 9월</div><div class="kvl1180-schedule-empty">대회 데이터를 불러오지 못했습니다.</div>';const s=$('scheduleRoot');if(s)s.innerHTML='<div class="kvl1180-schedule-empty">대회 데이터를 불러오지 못했습니다.</div>';activateView()});
})();

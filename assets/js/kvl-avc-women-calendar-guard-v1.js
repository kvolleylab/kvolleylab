/* K-Volley Lab · AVC women calendar + schedule guard v2
 * Progressive fallback: keeps the overview calendar and schedule/results usable
 * even when the full women competition renderer fails or is delayed.
 */
(()=>{
'use strict';
const DATA='data/competitions/avc-women-continental-2026.json?v=20260915-calendar-schedule-guard-2';
const SELF='international-competition-avc-women-continental-2026-pc-hybrid-1180.html';
const STAGES=['전체','조별리그','8강','준결승','3위결정전','결승'];
const WEEK=['일','월','화','수','목','금','토'];
const TEAM={'중국':'cn','이란':'ir','대만':'tw','이라크':'iq','태국':'th','인도네시아':'id','카자흐스탄':'kz','호주':'au','일본':'jp','대한민국':'kr','베트남':'vn','홍콩':'hk'};
let data=null,stage='전체',pool='전체';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const done=m=>Number.isFinite(m?.setsA)&&Number.isFinite(m?.setsB);
const flag=name=>TEAM[name]?`https://flagcdn.com/w80/${TEAM[name]}.png`:'';
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
function init(){fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(json=>{data=json;renderCalendar();setTimeout(()=>renderSchedule(false),180)}).catch(()=>{const root=$('scheduleRoot');if(root&&!root.querySelector('.kvl1180-match-row'))root.innerHTML='<div class="kvl1180-schedule-empty">경기 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>'})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

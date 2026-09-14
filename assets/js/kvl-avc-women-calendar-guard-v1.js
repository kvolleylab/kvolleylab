/* K-Volley Lab · AVC women calendar guard v1
 * Progressive fallback so the overview calendar is populated even if the main
 * competition renderer is delayed or fails before reaching the calendar step.
 */
(()=>{
'use strict';
const DATA='data/competitions/avc-women-continental-2026.json?v=20260915-calendar-guard-1';
const SELF='international-competition-avc-women-continental-2026-pc-hybrid-1180.html';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const done=m=>Number.isFinite(m?.setsA)&&Number.isFinite(m?.setsB);
function render(data){
  const root=document.getElementById('calendarRoot');
  if(!root||root.querySelector('.has-match'))return;
  const matches=Array.isArray(data?.matches)?data.matches:[];
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
function init(){fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(render).catch(()=>{});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

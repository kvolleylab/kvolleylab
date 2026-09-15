/* K-Volley Lab · 2026 VNL Men · V2 competition adapter */
(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FLAGS={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
const KO={Japan:'일본',Brazil:'브라질',Poland:'폴란드',Iran:'이란',USA:'미국',France:'프랑스',Argentina:'아르헨티나',Italy:'이탈리아',Canada:'캐나다',Belgium:'벨기에',Cuba:'쿠바',Slovenia:'슬로베니아',Germany:'독일',Serbia:'세르비아','Türkiye':'튀르키예',Bulgaria:'불가리아',China:'중국',Ukraine:'우크라이나'};
const COUNTRY_PAGES={Japan:'japan.html',Brazil:'brazil.html',Poland:'poland.html',Iran:'iran.html',USA:'usa.html',France:'france.html',Argentina:'argentina.html',Italy:'italy.html',Canada:'canada.html',Belgium:'belgium.html',Cuba:'cuba.html',Slovenia:'slovenia.html',Germany:'germany.html',Serbia:'serbia.html','Türkiye':'turkiye.html',Bulgaria:'bulgaria.html',China:'china.html',Ukraine:'ukraine.html'};
const WEEK=['일','월','화','수','목','금','토'];
const STAGES=['전체','예선','8강','준결승','3위결정전','결승'];
let prelim=[],finals=[],scoreMap=new Map(),activeStage='전체';
const flag=name=>`https://flagcdn.com/w80/${FLAGS[name]||'un'}.png`;
const roundKo=m=>m.stage!=='finals'?'예선':({Quarterfinal:'8강',Semifinal:'준결승','3rd Place':'3위결정전',Final:'결승'})[m.round]||'파이널';
const resultFor=m=>{const r=scoreMap.get(m.match_id);if(r)return {home:Number(r.home_sets),away:Number(r.away_sets),sets:r.sets||[]};if(m.score&&Number.isFinite(Number(m.score.home_sets)))return {home:Number(m.score.home_sets),away:Number(m.score.away_sets),sets:[]};return null;};
const dateLabel=date=>{const d=new Date(`${date}T00:00:00+09:00`);return `${Number(date.slice(5,7))}월 ${Number(date.slice(8,10))}일 (${WEEK[d.getDay()]})`;};

function calendarMonth(ym,matches){
  const [year,month]=ym.split('-').map(Number),first=new Date(year,month-1,1).getDay(),days=new Date(year,month,0).getDate(),byDate=new Map(),cells=[];
  matches.filter(m=>m.date_kst?.startsWith(ym)).forEach(m=>{if(!byDate.has(m.date_kst))byDate.set(m.date_kst,[]);byDate.get(m.date_kst).push(m);});
  for(let i=0;i<first;i++)cells.push('<div class="vnlv2-day is-empty"></div>');
  for(let day=1;day<=days;day++){
    const date=`${ym}-${String(day).padStart(2,'0')}`,games=(byDate.get(date)||[]).sort((a,b)=>(a.time_kst||'').localeCompare(b.time_kst||''));
    const gameHtml=games.map(m=>{const r=resultFor(m),score=r?`${r.home}-${r.away}`:'VS';return `<a class="vnlv2-cal-game" href="?view=schedule&stage=${encodeURIComponent(roundKo(m))}"><time>${esc(m.time_kst||'')}</time><span>${esc(m.home?.name_ko||'')} · ${esc(m.away?.name_ko||'')}</span><b>${esc(score)}</b></a>`;}).join('');
    cells.push(`<div class="vnlv2-day ${games.length?'has-games':''}"><div class="vnlv2-day-num"><span>${day}</span>${games.length?`<span class="vnlv2-day-count">${games.length}경기</span>`:''}</div><div class="vnlv2-cal-games">${gameHtml}</div></div>`);
  }
  while(cells.length%7)cells.push('<div class="vnlv2-day is-empty"></div>');
  return `<section class="vnlv2-calendar-month"><div class="vnlv2-calendar-title">${year}년 ${month}월</div><div class="vnlv2-calendar-week">${WEEK.map(w=>`<span>${w}</span>`).join('')}</div><div class="vnlv2-calendar-grid">${cells.join('')}</div></section>`;
}
function renderCalendar(){
  const root=$('[data-slot="monthly-calendar"]');if(!root)return;
  const all=[...prelim,...finals].sort((a,b)=>(a.datetime_kst||'').localeCompare(b.datetime_kst||''));
  const months=[...new Set(all.map(m=>m.date_kst?.slice(0,7)).filter(Boolean))].sort();
  root.innerHTML=months.map(m=>calendarMonth(m,all)).join('');
}

function stageMatches(){const all=[...prelim,...finals];return activeStage==='전체'?all:all.filter(m=>roundKo(m)===activeStage);}
function setLine(r){if(!r?.sets?.length)return '';return `<div class="vnlv2-setline">${r.sets.map((s,i)=>{const h=s.home??s[0],a=s.away??s[1];return `<span>${i+1}세트 ${esc(h)}-${esc(a)}</span>`;}).join('')}</div>`;}
function matchHtml(m){
  const r=resultFor(m),homeWin=r&&r.home>r.away,awayWin=r&&r.away>r.home,venue=m.venue?.city_ko||m.venue?.country_ko||'';
  return `<article class="vnlv2-match"><div class="vnlv2-match-meta"><strong>${esc(m.time_kst||'시간 미정')} KST</strong><span>${esc(roundKo(m))}</span><span>${esc(venue)}</span></div><div class="vnlv2-match-board"><div class="vnlv2-team ${homeWin?'is-winner':''}"><img class="vnlv2-flag" src="${flag(m.home?.name_en)}" alt=""><span>${esc(m.home?.name_ko||m.home?.name_en||'')}</span></div><div class="vnlv2-score">${r?`${r.home}-${r.away}`:'VS'}</div><div class="vnlv2-team is-away ${awayWin?'is-winner':''}"><span>${esc(m.away?.name_ko||m.away?.name_en||'')}</span><img class="vnlv2-flag" src="${flag(m.away?.name_en)}" alt=""></div></div>${setLine(r)}</article>`;
}
function renderFilters(){
  const root=$('#vnlV2StageFilters');if(!root)return;
  root.innerHTML=STAGES.map(s=>`<button type="button" class="${s===activeStage?'is-active':''}" data-stage="${esc(s)}">${esc(s)}</button>`).join('');
  root.querySelectorAll('[data-stage]').forEach(btn=>btn.addEventListener('click',()=>{activeStage=btn.dataset.stage;renderFilters();renderSchedule();}));
}
function renderSchedule(){
  const root=$('#vnlV2ScheduleList'),summary=$('#vnlV2ScheduleSummary');if(!root)return;
  const list=stageMatches().sort((a,b)=>(a.datetime_kst||'').localeCompare(b.datetime_kst||'')),groups=new Map();
  list.forEach(m=>{if(!groups.has(m.date_kst))groups.set(m.date_kst,[]);groups.get(m.date_kst).push(m);});
  if(summary)summary.textContent=`${activeStage} · ${list.length}경기 · 한국시간(KST)`;
  root.innerHTML=[...groups.entries()].map(([date,matches])=>`<section class="vnlv2-date-group"><header class="vnlv2-date-head"><span>${dateLabel(date)}</span><span>${matches.length}경기</span></header><div>${matches.map(matchHtml).join('')}</div></section>`).join('')||'<div class="vnlv2-loading">선택한 단계의 경기가 없습니다.</div>';
}

function renderStandings(data){
  const root=$('#vnlV2Standings');if(!root)return;
  const head='<div class="vnlv2-standing-head"><span>순위</span><span>국가</span><span>경기 · 승 · 패 · 승점 · 세트율 · 득점율</span><span>파이널</span></div>';
  const rows=(data.rows||[]).map(r=>{
    const result=r.host_qualified?'개최국 진출':r.qualified?'파이널 진출':'예선 종료',badgeClass=r.host_qualified?'is-host':r.qualified?'':'is-out',rowClass=r.host_qualified?'is-host':r.qualified?'is-qualified':'';
    return `<div class="vnlv2-standing-row ${rowClass}"><span class="vnlv2-standing-rank">${r.rank}</span><span class="vnlv2-standing-team"><img class="vnlv2-flag" src="${flag(r.country)}" alt=""><span><strong>${esc(r.country_ko)}</strong><small>${esc(r.country)}</small></span></span><span class="vnlv2-standing-stats"><span class="vnlv2-stat"><b>${r.played}</b><small>경기</small></span><span class="vnlv2-stat"><b>${r.wins}</b><small>승</small></span><span class="vnlv2-stat"><b>${r.losses}</b><small>패</small></span><span class="vnlv2-stat"><b>${r.points}</b><small>승점</small></span><span class="vnlv2-stat"><b>${Number(r.set_ratio).toFixed(3)}</b><small>세트율</small></span><span class="vnlv2-stat"><b>${Number(r.point_ratio).toFixed(3)}</b><small>득점율</small></span></span><span class="vnlv2-standing-result"><b class="vnlv2-badge ${badgeClass}">${result}</b></span></div>`;
  }).join('');
  root.innerHTML=head+rows;
}

function finalMatchHtml(m){
  const r=resultFor(m),hw=r&&r.home>r.away,aw=r&&r.away>r.home;
  return `<article class="vnlv2-final-match"><small>${esc(m.date_kst)} · ${esc(m.time_kst)} KST</small><div class="vnlv2-final-side ${hw?'is-winner':''}"><img src="${flag(m.home?.name_en)}" alt=""><span>${esc(m.home?.name_ko||'')}</span><b>${r?.home??'-'}</b></div><div class="vnlv2-final-side ${aw?'is-winner':''}"><img src="${flag(m.away?.name_en)}" alt=""><span>${esc(m.away?.name_ko||'')}</span><b>${r?.away??'-'}</b></div></article>`;
}
function renderBracket(){
  const root=$('#vnlV2Bracket');if(!root)return;
  const qf=finals.filter(m=>m.round==='Quarterfinal'),sf=finals.filter(m=>m.round==='Semifinal'),final=finals.filter(m=>m.round==='Final'),bronze=finals.filter(m=>m.round==='3rd Place');
  root.innerHTML=`<div class="vnlv2-bracket"><div class="vnlv2-bracket-head"><h3>파이널 토너먼트</h3><p>8강 → 준결승 → 결승 · 3위 결정전</p></div><div class="vnlv2-bracket-grid"><section class="vnlv2-round"><div class="vnlv2-round-title">8강 · Quarterfinals</div>${qf.map(finalMatchHtml).join('')}</section><section class="vnlv2-round"><div class="vnlv2-round-title">준결승 · Semifinals</div>${sf.map(finalMatchHtml).join('')}</section><section class="vnlv2-round"><div class="vnlv2-round-title">결승 · Final</div>${final.map(finalMatchHtml).join('')}</section></div><section class="vnlv2-bronze-block"><div class="vnlv2-round-title">3위 결정전 · Bronze</div>${bronze.map(finalMatchHtml).join('')}</section></div>`;
}
function renderFinalList(data){
  const root=$('#vnlV2FinalList');if(!root)return;
  root.innerHTML=(data.rows||[]).map(r=>`<a class="vnlv2-final-row" href="${esc(COUNTRY_PAGES[r.country]||'#')}"><b>${r.rank}</b><img src="${flag(r.country)}" alt=""><span>${esc(r.country_ko)} <small>${esc(r.country)}</small></span></a>`).join('');
  const top=(data.rows||[]).slice(0,4);
  $$('.kvl1180-final-card[data-final-rank]').forEach(card=>{const rank=Number(card.dataset.finalRank),r=top.find(x=>x.rank===rank);if(!r||card.querySelector('.vnlv2-final-flag'))return;const img=document.createElement('img');img.className='vnlv2-final-flag';img.src=flag(r.country);img.alt=`${r.country_ko} 국기`;card.appendChild(img);});
}

function renderCountries(data){
  const root=$('#vnlV2Countries');if(!root)return;
  root.innerHTML=(data.participants||[]).map(p=>`<a class="vnlv2-country" href="${esc(p.country_page||'#')}"><img src="${flag(p.country)}" alt=""><span><strong>${esc(p.country_ko)}</strong><small>${esc(p.country)}</small></span></a>`).join('');
}
function bindDisabledWomen(){const a=$('[data-gender-link="women"][aria-disabled="true"]');if(a)a.addEventListener('click',e=>e.preventDefault());}
function applyStageQuery(){const stage=new URLSearchParams(location.search).get('stage');if(stage&&STAGES.includes(stage))activeStage=stage;}

async function init(){
  bindDisabledWomen();applyStageQuery();
  try{
    const [participants,prelimData,standings,finalsData,scores,finalStandings]=await Promise.all([
      fetch('data/competition/vnl-2026-men-participants.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/matches/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/standings/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/matches/vnl-2026-finals.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/results/vnl-2026-men-set-scores.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/standings/vnl-2026-men-final.json',{cache:'no-store'}).then(r=>r.json())
    ]);
    prelim=prelimData.matches||[];finals=finalsData.matches||[];scoreMap=new Map((scores.matches||[]).map(r=>[r.match_id,r]));
    renderCalendar();renderFilters();renderSchedule();renderStandings(standings);renderFinalList(finalStandings);renderBracket();renderCountries(participants);
  }catch(err){
    console.error('VNL V2 prototype load failed',err);
    ['#vnlV2ScheduleList','#vnlV2Standings','#vnlV2FinalList','#vnlV2Bracket','#vnlV2Countries'].forEach(sel=>{const n=$(sel);if(n)n.innerHTML='<div class="vnlv2-loading">데이터를 불러오지 못했습니다.</div>';});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

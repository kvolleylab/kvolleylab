/* K-Volley Lab · 2026 VNL Men · V2 competition adapter
 * V2 parity: overview calendar + base schedule rows + base knockout ladder + base participant/source geometry.
 */
(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FLAGS={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
const COUNTRY_PAGES={Japan:'japan.html',Brazil:'brazil.html',Poland:'poland.html',Iran:'iran.html',USA:'usa.html',France:'france.html',Argentina:'argentina.html',Italy:'italy.html',Canada:'canada.html',Belgium:'belgium.html',Cuba:'cuba.html',Slovenia:'slovenia.html',Germany:'germany.html',Serbia:'serbia.html','Türkiye':'turkiye.html',Bulgaria:'bulgaria.html',China:'china.html',Ukraine:'ukraine.html'};
const COUNTRY_CODES={Japan:'JPN',Brazil:'BRA',Poland:'POL',Iran:'IRI',USA:'USA',France:'FRA',Argentina:'ARG',Italy:'ITA',Canada:'CAN',Belgium:'BEL',Cuba:'CUB',Slovenia:'SLO',Germany:'GER',Serbia:'SRB','Türkiye':'TUR',Bulgaria:'BUL',China:'CHN',Ukraine:'UKR'};
const WEEK=['일','월','화','수','목','금','토'];
const STAGES=['전체','예선','8강','준결승','3위결정전','결승'];
let prelim=[],finals=[],scoreMap=new Map(),activeStage='전체',prelimRank=new Map();

const flag=name=>`https://flagcdn.com/w80/${FLAGS[name]||'un'}.png`;
const roundKo=m=>m.stage!=='finals'?'예선':({Quarterfinal:'8강',Semifinal:'준결승','3rd Place':'3위결정전',Final:'결승'})[m.round]||'파이널';
const resultFor=m=>{
  const r=scoreMap.get(m.match_id);
  if(r)return {home:Number(r.home_sets),away:Number(r.away_sets),sets:r.sets||[]};
  if(m.score&&Number.isFinite(Number(m.score.home_sets)))return {home:Number(m.score.home_sets),away:Number(m.score.away_sets),sets:[]};
  return null;
};
const dateLabel=date=>{const d=new Date(`${date}T00:00:00+09:00`);return `${Number(date.slice(5,7))}월 ${Number(date.slice(8,10))}일 (${WEEK[d.getDay()]})`;};
const shortDate=date=>String(date||'').slice(5).replace('-','.');
const venueText=m=>m.venue?.arena||m.venue?.city_ko||m.venue?.country_ko||'개최지 확인 중';

/* Overview monthly calendar: same KVL calendar DOM as the base competition template. */
function calendarMonth(ym,matches){
  const [year,month]=ym.split('-').map(Number);
  const first=new Date(year,month-1,1).getDay(),days=new Date(year,month,0).getDate(),byDate=new Map(),cells=[];
  matches.filter(m=>m.date_kst?.startsWith(ym)).forEach(m=>{if(!byDate.has(m.date_kst))byDate.set(m.date_kst,[]);byDate.get(m.date_kst).push(m);});
  for(let i=0;i<first;i++)cells.push('<div class="kvl1180-day is-empty"></div>');
  for(let day=1;day<=days;day++){
    const date=`${ym}-${String(day).padStart(2,'0')}`;
    const games=(byDate.get(date)||[]).sort((a,b)=>(a.time_kst||'').localeCompare(b.time_kst||''));
    if(games.length){
      const rows=games.map(m=>{
        const r=resultFor(m),score=r?`<span class="kvl1180-cal-score">${r.home}-${r.away}</span>`:'';
        return `<span class="kvl1180-cal-game"><span class="kvl1180-cal-time">${esc(m.time_kst||'미정')}</span><span class="kvl1180-cal-match"><span class="kvl1180-cal-team">${esc(m.home?.name_ko||m.home?.name_en||'')}</span><b>vs</b><span class="kvl1180-cal-team">${esc(m.away?.name_ko||m.away?.name_en||'')}</span>${score}</span></span>`;
      }).join('');
      cells.push(`<div class="kvl1180-day has-match"><a href="?view=schedule&date=${date}"><span class="kvl1180-date">${day}</span><span class="kvl1180-games">${rows}</span></a></div>`);
    }else{
      cells.push(`<div class="kvl1180-day"><span class="kvl1180-date">${day}</span></div>`);
    }
  }
  while(cells.length%7)cells.push('<div class="kvl1180-day is-empty"></div>');
  return `<section class="kvl1180-calendar"><div class="kvl1180-calendar-title">${year}년 ${month}월</div><div class="kvl1180-calendar-week">${WEEK.map(w=>`<span>${w}</span>`).join('')}</div><div class="kvl1180-calendar-grid">${cells.join('')}</div></section>`;
}
function renderCalendar(){
  const root=$('#vnlV2OverviewCalendar');if(!root)return;
  const all=[...prelim,...finals].sort((a,b)=>(a.datetime_kst||'').localeCompare(b.datetime_kst||''));
  const months=[...new Set(all.map(m=>m.date_kst?.slice(0,7)).filter(Boolean))].sort();
  root.innerHTML=months.map(m=>calendarMonth(m,all)).join('');
}

/* Schedule: use the same day-group / match-row geometry as the base template. */
function stageMatches(){
  const all=[...prelim,...finals];
  return activeStage==='전체'?all:all.filter(m=>roundKo(m)===activeStage);
}
function setScoresHtml(r){
  if(!r?.sets?.length)return '';
  return r.sets.map(s=>{
    const h=s?.home??s?.[0],a=s?.away??s?.[1];
    return Number.isFinite(Number(h))&&Number.isFinite(Number(a))?`<span>${esc(h)}-${esc(a)}</span>`:'';
  }).filter(Boolean).join('');
}
function teamSide(m,side,position){
  const obj=side==='home'?m.home:m.away;
  const nameKo=obj?.name_ko||obj?.name_en||'미정',nameEn=obj?.name_en||'';
  const mark=`<span class="kvl1180-inline-logo"><img src="${flag(nameEn)}" alt="${esc(nameKo)} 국기" loading="lazy"></span>`;
  const copy=`<span class="kvl1180-slot-copy"><strong>${esc(nameKo)}</strong><small>${esc(COUNTRY_CODES[nameEn]||nameEn)}</small></span>`;
  return position==='left'?`<span class="kvl1180-side is-left">${mark}${copy}</span>`:`<span class="kvl1180-side is-right">${copy}${mark}</span>`;
}
function matchRow(m){
  const r=resultFor(m),detail=`${roundKo(m)} · ${venueText(m)} · 한국시간(KST)`;
  return `<article class="kvl1180-match-row"><div class="kvl1180-match-meta"><time>${esc(m.time_kst||'시간 미정')} KST</time></div><div class="kvl1180-match-board">${teamSide(m,'home','left')}<b class="kvl1180-score ${r?'':'is-upcoming'}">${r?`${r.home}-${r.away}`:'VS'}</b>${teamSide(m,'away','right')}</div><div class="kvl1180-set-scores">${setScoresHtml(r)}</div><div class="kvl1180-match-detail">${esc(detail)}</div></article>`;
}
function renderFilters(){
  const root=$('#vnlV2StageFilters');if(!root)return;
  root.innerHTML=STAGES.map(s=>`<button type="button" class="${s===activeStage?'is-active':''}" data-stage="${esc(s)}">${esc(s)}</button>`).join('');
  root.querySelectorAll('[data-stage]').forEach(btn=>btn.addEventListener('click',()=>{activeStage=btn.dataset.stage;renderFilters();renderSchedule();}));
}
function renderSchedule(){
  const root=$('#vnlV2ScheduleList'),summary=$('#vnlV2ScheduleSummary');if(!root)return;
  const list=stageMatches().slice().sort((a,b)=>(a.datetime_kst||'').localeCompare(b.datetime_kst||''));
  const groups=new Map();
  list.forEach(m=>{if(!groups.has(m.date_kst))groups.set(m.date_kst,[]);groups.get(m.date_kst).push(m);});
  if(summary)summary.innerHTML=`<strong>${esc(activeStage)}</strong><span>${list.length}경기 · 완료 ${list.filter(m=>resultFor(m)).length} · 한국시간(KST)</span>`;
  root.innerHTML=[...groups.entries()].map(([date,matches])=>{
    const stages=[...new Set(matches.map(roundKo))].join(' · ');
    return `<section id="date-${date}" class="kvl1180-date-group"><header class="kvl1180-date-head"><div class="kvl1180-date-title"><strong>${dateLabel(date)}</strong><span>${esc(stages)}</span></div><span>${matches.length}경기</span></header><div>${matches.map(matchRow).join('')}</div></section>`;
  }).join('')||'<div class="kvl1180-schedule-empty">선택한 단계의 경기가 없습니다.</div>';
  const target=new URLSearchParams(location.search).get('date');
  const el=target?document.getElementById(`date-${target}`):null;
  if(el)requestAnimationFrame(()=>el.scrollIntoView({block:'start'}));
}

/* Preliminary standings remain VNL-specific, but use the V2 Purple theme. */
function renderStandings(data){
  const root=$('#vnlV2Standings');if(!root)return;
  prelimRank=new Map((data.rows||[]).map(r=>[r.country,Number(r.rank)]));
  const head='<div class="vnlv2-standing-head"><span>순위</span><span>국가</span><span>경기 · 승 · 패 · 승점 · 세트율 · 득점율</span><span>파이널</span></div>';
  const rows=(data.rows||[]).map(r=>{
    const result=r.host_qualified?'개최국 진출':r.qualified?'파이널 진출':'예선 종료';
    const badgeClass=r.host_qualified?'is-host':r.qualified?'':'is-out',rowClass=r.host_qualified?'is-host':r.qualified?'is-qualified':'';
    return `<div class="vnlv2-standing-row ${rowClass}"><span class="vnlv2-standing-rank">${r.rank}</span><span class="vnlv2-standing-team"><img class="vnlv2-flag" src="${flag(r.country)}" alt=""><span><strong>${esc(r.country_ko)}</strong><small>${esc(r.country)}</small></span></span><span class="vnlv2-standing-stats"><span class="vnlv2-stat"><b>${r.played}</b><small>경기</small></span><span class="vnlv2-stat"><b>${r.wins}</b><small>승</small></span><span class="vnlv2-stat"><b>${r.losses}</b><small>패</small></span><span class="vnlv2-stat"><b>${r.points}</b><small>승점</small></span><span class="vnlv2-stat"><b>${Number(r.set_ratio).toFixed(3)}</b><small>세트율</small></span><span class="vnlv2-stat"><b>${Number(r.point_ratio).toFixed(3)}</b><small>득점율</small></span></span><span class="vnlv2-standing-result"><b class="vnlv2-badge ${badgeClass}">${result}</b></span></div>`;
  }).join('');
  root.innerHTML=head+rows;
}

/* Final top 4 + full final ranking. */
function renderFinalList(data){
  const root=$('#vnlV2FinalList');if(!root)return;
  root.innerHTML=(data.rows||[]).map(r=>`<a class="vnlv2-final-row" href="${esc(COUNTRY_PAGES[r.country]||'#')}"><b>${r.rank}</b><img src="${flag(r.country)}" alt=""><span>${esc(r.country_ko)} <small>${esc(r.country)}</small></span></a>`).join('');
  const top=(data.rows||[]).slice(0,4);
  $$('.kvl1180-final-card[data-final-rank]').forEach(card=>{
    const rank=Number(card.dataset.finalRank),r=top.find(x=>x.rank===rank);if(!r)return;
    let mark=card.querySelector('.kvl1180-final-flag');
    if(!mark){
      mark=document.createElement('span');mark.className='kvl1180-final-flag';
      const copy=card.querySelector('.kvl1180-final-copy');card.insertBefore(mark,copy);
    }
    mark.innerHTML=`<img src="${flag(r.country)}" alt="${esc(r.country_ko)} 국기">`;
  });
}

/* Knockout: same ladder DOM + connector geometry as the base template. */
function winnerEnglish(m){
  const r=resultFor(m);if(!r)return '';
  return r.home>r.away?m.home?.name_en:m.away?.name_en;
}
function bracketTeam(m,side){
  const obj=side==='home'?m.home:m.away,r=resultFor(m),score=side==='home'?r?.home:r?.away;
  const nameEn=obj?.name_en||'',nameKo=obj?.name_ko||nameEn||'미정';
  const won=winnerEnglish(m)===nameEn;
  const seed=prelimRank.get(nameEn);
  return `<div class="kvl1180-bracket-team ${won?'is-winner':''}"><span class="kvl1180-bracket-mark"><img src="${flag(nameEn)}" alt="${esc(nameKo)} 국기" loading="lazy"></span><span class="kvl1180-bracket-copy"><strong>${esc(nameKo)}</strong><small>${Number.isFinite(seed)?`예선 ${seed}위`:esc(COUNTRY_CODES[nameEn]||nameEn)}</small></span><b class="kvl1180-team-score">${score??'-'}</b></div>`;
}
function bracketSetLine(m){
  const r=resultFor(m);if(!r?.sets?.length)return '';
  const txt=r.sets.map(s=>{const h=s?.home??s?.[0],a=s?.away??s?.[1];return Number.isFinite(Number(h))&&Number.isFinite(Number(a))?`${h}-${a}`:'';}).filter(Boolean).join(' · ');
  return txt?`<div class="kvl1180-match-sets">${esc(txt)}</div>`:'';
}
function bracketMatch(m,label){
  if(!m)return '<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>TBD</strong><span>일정 미정</span></div></article>';
  return `<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>${esc(label)}</strong><span>${shortDate(m.date_kst)} · ${esc(m.time_kst||'미정')} KST</span></div>${bracketTeam(m,'home')}${bracketTeam(m,'away')}${bracketSetLine(m)}</article>`;
}
function renderBracket(){
  const root=$('#vnlV2Bracket');if(!root)return;
  const qf=finals.filter(m=>m.round==='Quarterfinal'),sf=finals.filter(m=>m.round==='Semifinal');
  const final=finals.find(m=>m.round==='Final'),bronze=finals.find(m=>m.round==='3rd Place');
  const qfInfo=qf.map((m,i)=>({m,label:`QF${i+1}`,winner:winnerEnglish(m)}));
  const qfPairs=sf.map(s=>{
    const teams=new Set([s.home?.name_en,s.away?.name_en]);
    return qfInfo.filter(q=>q.winner&&teams.has(q.winner));
  });
  const used=new Set(qfPairs.flat().map(x=>x.label));
  const leftovers=qfInfo.filter(x=>!used.has(x.label));
  while(qfPairs.length<2)qfPairs.push([]);
  leftovers.forEach(x=>{const target=qfPairs[0].length<=qfPairs[1].length?0:1;qfPairs[target].push(x);});
  root.innerHTML=`<div class="kvl1180-bracket"><div class="kvl1180-bracket-ladder"><section class="kvl1180-round kvl1180-round-qf"><h4 class="kvl1180-round-title">8강 · Quarterfinals</h4><div class="kvl1180-round-body">${qfPairs.map(pair=>`<div class="kvl1180-qf-pair">${pair.map(x=>bracketMatch(x.m,x.label)).join('')}</div>`).join('')}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-sf"><h4 class="kvl1180-round-title">준결승 · Semifinals</h4><div class="kvl1180-round-body">${sf.map((m,i)=>bracketMatch(m,`SF${i+1}`)).join('')}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-final"><h4 class="kvl1180-round-title">결승 · Final</h4><div class="kvl1180-round-body">${bracketMatch(final,'FINAL')}</div></section></div><div class="kvl1180-bronze"><h4 class="kvl1180-bronze-title">3위 결정전 · Bronze Medal Match</h4>${bracketMatch(bronze,'3RD')}</div></div>`;
}

/* Participants: same country-button geometry as the base participant template. */
function renderCountries(data){
  const root=$('#vnlV2Countries');if(!root)return;
  const list=data.participants||[];
  const buttons=list.map(p=>`<a class="kvl1180-participant-button" href="${esc(p.country_page||'#')}"><img src="${flag(p.country)}" alt="${esc(p.country_ko)} 국기" loading="lazy"><span class="kvl1180-participant-button-copy"><strong>${esc(p.country_ko)}</strong><small>${esc(p.country)} · ${esc(COUNTRY_CODES[p.country]||'')}</small></span></a>`).join('');
  root.innerHTML=`<article class="kvl1180-participant-group vnlv2-all-participants"><header class="kvl1180-participant-group-head"><strong>VNL 참가국</strong><span>${list.length}개국</span></header><div class="kvl1180-participant-buttons vnlv2-participant-buttons">${buttons}</div></article>`;
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
    prelim=prelimData.matches||[];
    finals=finalsData.matches||[];
    scoreMap=new Map((scores.matches||[]).map(r=>[r.match_id,r]));
    renderStandings(standings);
    renderCalendar();
    renderFilters();
    renderSchedule();
    renderFinalList(finalStandings);
    renderBracket();
    renderCountries(participants);
  }catch(err){
    console.error('VNL V2 prototype load failed',err);
    ['#vnlV2OverviewCalendar','#vnlV2ScheduleList','#vnlV2Standings','#vnlV2FinalList','#vnlV2Bracket','#vnlV2Countries'].forEach(sel=>{const n=$(sel);if(n)n.innerHTML='<div class="vnlv2-loading">데이터를 불러오지 못했습니다.</div>';});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
/* K-Volley Lab · Competition V2 shared component renderer
 * Calendar / schedule / standings / knockout / participants are rendered here for every competition.
 * Competition adapters may normalize data, but must not create component HTML.
 */
(()=>{
'use strict';
const WEEK=['일','월','화','수','목','금','토'];
const runtime={stage:'전체'};
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=()=>window.KVL_COMPETITION_V2_DATA||{};
const txt=(e,v)=>{if(e&&v!==undefined&&v!==null)e.textContent=String(v);};
const name=t=>t?.name||t?.nameKo||t?.countryKo||t?.country_ko||t?.name_ko||t?.en||t?.nameEn||t?.country||t?.name_en||'미정';
const en=t=>t?.en||t?.nameEn||t?.country||t?.name_en||'';
const code=t=>t?.code||t?.teamCode||'';
const flag=t=>t?.flag||t?.flagUrl||'';
const mid=m=>m?.id||m?.matchId||m?.match_id||'';
const date=m=>m?.date||m?.dateKst||m?.date_kst||'';
const time=m=>m?.time||m?.timeKst||m?.time_kst||'';
const stage=m=>m?.stageLabel||m?.stage||m?.round||'경기';
const round=m=>String(m?.round||'').toUpperCase();
const venue=m=>m?.venueLabel||m?.venue?.arena||m?.venue?.cityKo||m?.venue?.city_ko||m?.venue?.countryKo||m?.venue?.country_ko||'';
function score(m){const s=m?.score;if(!s)return null;const h=Number(s.home??s.homeSets??s.home_sets),a=Number(s.away??s.awaySets??s.away_sets);return Number.isFinite(h)&&Number.isFinite(a)?{home:h,away:a,sets:Array.isArray(s.sets)?s.sets:[]}:null;}
function fmtDate(v){if(!v)return '일정 미정';const d=new Date(`${v}T00:00:00+09:00`);return `${Number(v.slice(5,7))}월 ${Number(v.slice(8,10))}일 (${WEEK[d.getDay()]})`;}
const shortDate=v=>String(v||'').slice(5).replace('-','.');

function cfg(d){
  return {
    labels:{
      groupsTab:d.structure?.labels?.groupsTab||'조별순위',
      groupsKpi:d.structure?.labels?.groupsKpi||'조 편성',
      groupsKpiUnit:d.structure?.labels?.groupsKpiUnit||'개 조',
      knockoutKpi:d.structure?.labels?.knockoutKpi||'결선 진출',
      standingsTitle:d.structure?.labels?.standingsTitle||'조별순위',
      standingsEyebrow:d.structure?.labels?.standingsEyebrow||'STANDINGS',
      knockoutTitle:d.structure?.labels?.knockoutTitle||'최종순위',
      participantsTitle:d.structure?.labels?.participantsTitle||'참가국'
    },
    calendar:d.structure?.calendar!==false,
    schedule:d.structure?.schedule||{},
    standings:d.structure?.standings||{mode:'pools-combined'},
    knockout:d.structure?.knockout||{mode:'bracket-8'},
    participants:d.structure?.participants||{mode:'groups'},
    roster:d.structure?.roster||{mode:'full'}
  };
}

function applyStructureLabels(d){
  const c=cfg(d);
  txt(q('.kvl1180-tabs [data-view="groups"]'),c.labels.groupsTab);
  txt(q('[data-kvl-label="groups-kpi"]'),c.labels.groupsKpi);
  txt(q('[data-kvl-unit="group-count"]'),c.labels.groupsKpiUnit);
  txt(q('[data-kvl-label="knockout-kpi"]'),c.labels.knockoutKpi);
  txt(q('[data-kvl-label="standings-title"]'),c.labels.standingsTitle);
  txt(q('[data-kvl-label="standings-eyebrow"]'),c.labels.standingsEyebrow);
  txt(q('[data-kvl-label="knockout-title"]'),c.labels.knockoutTitle);
  txt(q('[data-kvl-label="participants-title"]'),c.labels.participantsTitle);
  txt(q('[data-kvl="schedule-note"]'),d.scheduleNote||'한국시간(KST)');
  txt(q('[data-kvl="standings-note"]'),d.standingsNote||'공식 결과 기준');
  txt(q('[data-kvl="participants-status"]'),d.teamCount?`${d.teamCount}개국`:'참가국');
  txt(q('[data-kvl="bracket-title"]'),c.knockout.title||'결선 토너먼트');
  txt(q('[data-kvl="meaning-eyebrow"]'),d.meaning?.eyebrow||'ROAD TO THE WORLD');
  txt(q('[data-kvl="meaning-title"]'),d.meaning?.title||'대회 의미 · 국제 진출권');
  txt(q('[data-kvl="meaning-note"]'),d.meaning?.note||'대회별 공식 규정과 확정 결과만 표시합니다.');
  const women=q('[data-gender-link="women"]');
  if(women&&!d.genderLinks?.women){women.classList.add('is-disabled');women.setAttribute('aria-disabled','true');}
}

function bindKpis(d){
  const targets=[d.structure?.kpiTargets?.participants||'?view=rosters','?view=groups','?view=schedule','?view=knockout'];
  qa('.kvl1180-view[data-view="overview"] .kvl1180-kpis .kvl1180-kpi:not(.is-venue)').forEach((card,i)=>{
    const target=targets[i];if(!target)return;
    card.dataset.kvlTarget=target;card.tabIndex=0;card.setAttribute('role','link');
    card.onclick=()=>{location.href=target;};
    card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();location.href=target;}};
  });
}

function renderQualifications(d){
  const root=q('[data-kvl-component="qualifications"]'),section=q('[data-kvl-section="qualifications"]');if(!root)return;
  const items=d.qualifications||[];if(section)section.hidden=!items.length;
  root.innerHTML=items.map((x,i)=>{
    const cls=x.className||(['is-la','is-wc','is-wr'][i]||'is-wr'),teams=(x.resultTeams||[]).filter(Boolean),has=teams.length>0;
    return `<article class="kvl1180-stake ${esc(cls)} ${has?'has-confirmed-result':''}"><div class="kvl1180-stake-top"><span class="kvl1180-stake-brand">${esc(x.brand||'대회 규정')}</span><span class="kvl1180-pill">${esc(x.pill||'공식 기준')}</span></div><h3>${esc(x.title||'공식 규정')}</h3><p>${esc(x.description||'')}</p>${has?`<div class="kvl1180-stake-confirmed"><strong>${esc(x.resultLabel||'대회 결과')}</strong><span>${esc(teams.join(' · '))}</span></div>`:''}<div class="kvl1180-stake-foot">${esc(x.foot||'')}</div></article>`;
  }).join('');
}

function renderCalendar(d){
  const root=q('[data-kvl-component="calendar"]'),section=q('[data-kvl-section="calendar"]');if(!root)return;
  if(!cfg(d).calendar){if(section)section.hidden=true;return;}else if(section)section.hidden=false;
  const list=(d.matches||[]).slice().sort((a,b)=>`${date(a)}T${time(a)}`.localeCompare(`${date(b)}T${time(b)}`));
  const months=[...new Set(list.map(m=>date(m).slice(0,7)).filter(Boolean))].sort();
  if(!months.length){root.innerHTML='<div class="kvl1180-schedule-empty">공식 일정 발표 후 월간 달력을 표시합니다.</div>';return;}
  root.innerHTML=months.map(ym=>{
    const [y,mo]=ym.split('-').map(Number),first=new Date(y,mo-1,1).getDay(),days=new Date(y,mo,0).getDate(),map=new Map(),cells=[];
    list.filter(m=>date(m).startsWith(ym)).forEach(m=>{const dt=date(m);if(!map.has(dt))map.set(dt,[]);map.get(dt).push(m);});
    for(let i=0;i<first;i++)cells.push('<div class="kvl1180-day is-empty"></div>');
    for(let day=1;day<=days;day++){
      const dt=`${ym}-${String(day).padStart(2,'0')}`,games=(map.get(dt)||[]).sort((a,b)=>time(a).localeCompare(time(b)));
      if(!games.length){cells.push(`<div class="kvl1180-day"><span class="kvl1180-date">${day}</span></div>`);continue;}
      const rows=games.map(m=>{const s=score(m);return `<span class="kvl1180-cal-game"><span class="kvl1180-cal-time">${esc(time(m)||'미정')}</span><span class="kvl1180-cal-match"><span class="kvl1180-cal-team">${esc(name(m.home))}</span><b>vs</b><span class="kvl1180-cal-team">${esc(name(m.away))}</span>${s?`<span class="kvl1180-cal-score">${s.home}-${s.away}</span>`:''}</span></span>`;}).join('');
      cells.push(`<div class="kvl1180-day has-match"><a href="?view=schedule&date=${dt}"><span class="kvl1180-date">${day}</span><span class="kvl1180-games">${rows}</span></a></div>`);
    }
    while(cells.length%7)cells.push('<div class="kvl1180-day is-empty"></div>');
    return `<section class="kvl1180-calendar"><div class="kvl1180-calendar-title">${y}년 ${mo}월</div><div class="kvl1180-calendar-week">${WEEK.map(w=>`<span>${w}</span>`).join('')}</div><div class="kvl1180-calendar-grid">${cells.join('')}</div></section>`;
  }).join('');
}

function stages(d){const x=d.structure?.schedule?.stages;if(Array.isArray(x)&&x.length)return x;return ['전체',...[...new Set((d.matches||[]).map(stage).filter(Boolean))]];}
function setLine(m){const s=score(m);if(!s?.sets?.length)return '';return s.sets.map(x=>{const h=Number(x?.home??x?.[0]),a=Number(x?.away??x?.[1]);return Number.isFinite(h)&&Number.isFinite(a)?`<span>${h}-${a}</span>`:'';}).filter(Boolean).join('');}
function side(t,pos){const mark=flag(t)?`<span class="kvl1180-inline-logo"><img src="${esc(flag(t))}" alt="${esc(name(t))} 국기" loading="lazy"></span>`:`<span class="kvl1180-inline-logo kvl1180-seed-icon">${esc(code(t)||'?')}</span>`,copy=`<span class="kvl1180-slot-copy"><strong>${esc(name(t))}</strong>${code(t)?`<small>${esc(code(t))}</small>`:''}</span>`;return pos==='left'?`<span class="kvl1180-side is-left">${mark}${copy}</span>`:`<span class="kvl1180-side is-right">${copy}${mark}</span>`;}
function matchRow(m){const s=score(m),detail=[stage(m),m.group?`${m.group}조`:'',venue(m),'한국시간(KST)'].filter(Boolean).join(' · ');return `<article class="kvl1180-match-row"><div class="kvl1180-match-meta"><time>${esc(time(m)||'시간 미정')} KST</time></div><div class="kvl1180-match-board">${side(m.home,'left')}<b class="kvl1180-score ${s?'':'is-upcoming'}">${s?`${s.home}-${s.away}`:'VS'}</b>${side(m.away,'right')}</div><div class="kvl1180-set-scores">${setLine(m)}</div><div class="kvl1180-match-detail">${esc(detail)}</div></article>`;}
function renderSchedule(d){
  const filters=q('[data-kvl-component="schedule-filters"]'),summary=q('[data-kvl-component="schedule-summary"]'),root=q('[data-kvl-component="schedule-list"]');if(!root)return;
  const ss=stages(d);if(!ss.includes(runtime.stage))runtime.stage='전체';
  if(filters){filters.innerHTML=ss.map(s=>`<button type="button" data-stage="${esc(s)}" class="${s===runtime.stage?'is-active':''}">${esc(s)}</button>`).join('');qa('[data-stage]',filters).forEach(b=>b.onclick=()=>{runtime.stage=b.dataset.stage;renderSchedule(d);});}
  let list=(d.matches||[]).slice();if(runtime.stage!=='전체')list=list.filter(m=>stage(m)===runtime.stage);list.sort((a,b)=>`${date(a)}T${time(a)}`.localeCompare(`${date(b)}T${time(b)}`));
  const done=list.filter(m=>score(m)).length;if(summary)summary.innerHTML=`<strong>${esc(runtime.stage)}</strong><span>${list.length}경기 · 완료 ${done} · 예정 ${list.length-done} · 한국시간(KST)</span>`;
  const groups=new Map();list.forEach(m=>{const dt=date(m)||'미정';if(!groups.has(dt))groups.set(dt,[]);groups.get(dt).push(m);});
  root.innerHTML=[...groups.entries()].map(([dt,games])=>`<section id="date-${esc(dt)}" class="kvl1180-date-group"><header class="kvl1180-date-head"><div class="kvl1180-date-title"><strong>${esc(fmtDate(dt))}</strong><span>${esc([...new Set(games.map(stage))].join(' · '))}</span></div><span>${games.length}경기</span></header><div>${games.map(matchRow).join('')}</div></section>`).join('')||'<div class="kvl1180-schedule-empty">선택한 조건의 경기가 없습니다.</div>';
  const wanted=new URLSearchParams(location.search).get('date'),el=wanted?document.getElementById(`date-${wanted}`):null;if(el)requestAnimationFrame(()=>el.scrollIntoView({block:'start'}));
}

function statusOf(r){if(r.status==='host-qualified')return {label:r.statusLabel||'개최국 진출',cls:'is-host'};if(r.status==='qualified')return {label:r.statusLabel||'결선 진출',cls:'is-qualified'};if(r.status==='out')return {label:r.statusLabel||'예선 종료',cls:'is-out'};return {label:r.statusLabel||'',cls:''};}
const stat=(v,l)=>`<span class="kvl-v2-stat"><b>${esc(v??'-')}</b><small>${l}</small></span>`;
function standingRows(rows){return (rows||[]).map(r=>{const t=r.team||{},st=statusOf(r);return `<div class="kvl-v2-standing-row ${st.cls}"><span class="kvl-v2-standing-rank">${esc(r.rank??'-')}</span><span class="kvl-v2-standing-team">${flag(t)?`<img src="${esc(flag(t))}" alt="${esc(name(t))} 국기" loading="lazy">`:''}<span><strong>${esc(name(t))}</strong><small>${esc(en(t)||code(t))}</small></span></span><span class="kvl-v2-standing-stats">${stat(r.played,'경기')}${stat(r.wins,'승')}${stat(r.losses,'패')}${stat(r.points,'승점')}${stat(r.setRatio,'세트율')}${stat(r.pointRatio,'득점율')}</span><span class="kvl-v2-standing-result">${st.label?`<b class="kvl-v2-badge ${st.cls}">${esc(st.label)}</b>`:''}</span></div>`;}).join('');}
function standingBlock(title,rows){return `<section class="kvl-v2-standing-block"><header class="kvl-v2-standing-block-head"><strong>${esc(title)}</strong><span>${rows?.length||0}개국</span></header><div class="kvl-v2-standing-head"><span>순위</span><span>국가</span><span>경기 · 승 · 패 · 승점 · 세트율 · 득점율</span><span>결과</span></div>${standingRows(rows)}</section>`;}
function renderStandings(d){const root=q('[data-kvl-component="standings"]');if(!root)return;const c=cfg(d).standings,s=d.standings||{};if(c.mode==='none'){root.innerHTML='<div class="kvl1180-schedule-empty">이 대회는 별도 예선 순위를 사용하지 않습니다.</div>';return;}if(c.mode==='single-league'){root.innerHTML=standingBlock(c.title||'예선 종합순위',s.rows||[]);return;}root.innerHTML=`<div class="kvl-v2-pool-grid">${(s.pools||[]).map(p=>standingBlock(p.title||`${p.id||''}조`,p.rows||[])).join('')}</div>${s.combinedRows?.length?standingBlock(c.combinedTitle||'예선 종합순위',s.combinedRows):''}`;}

function renderFinal(d){
  const top=q('[data-kvl-component="final-top4"]'),full=q('[data-kvl-component="final-ranking-list"]');
  if(top){const rows=(d.finalRanking||[]).slice().sort((a,b)=>Number(a.rank)-Number(b.rank)).slice(0,4);top.innerHTML=rows.map(x=>`<article class="kvl1180-final-card ${Number(x.rank)===1?'is-champion':''}"><span class="kvl1180-final-rank">${esc(x.rank)}위</span>${x.flag?`<span class="kvl1180-final-flag"><img src="${esc(x.flag)}" alt="${esc(x.team||'')} 국기"></span>`:''}<div class="kvl1180-final-copy"><strong>${esc(x.team||'미정')}</strong><small>${esc(x.result||'')}</small>${x.qualification?`<span class="kvl-final-qualification">${esc(x.qualification)}</span>`:''}</div></article>`).join('');}
  if(full){const rows=d.finalRankingFull||[];full.innerHTML=rows.length?`<h3>최종 1~${rows.length}위</h3><div class="kvl-v2-final-list">${rows.map(x=>`<a class="kvl-v2-final-row" href="${esc(x.url||'#')}"><b>${esc(x.rank)}</b>${x.flag?`<img src="${esc(x.flag)}" alt="${esc(x.team||'')} 국기">`:''}<span>${esc(x.team||'미정')} ${x.en?`<small>${esc(x.en)}</small>`:''}</span></a>`).join('')}</div>`:'';}
  txt(q('[data-kvl="knockout-status"]'),d.status==='completed'?'최종 순위 확정':'공식 결과 기준');
}

function seedMap(d){const map=new Map(),s=d.standings||{},rows=s.rows||s.combinedRows||[];rows.forEach(r=>{const t=r.team||{};[code(t),en(t),name(t)].filter(Boolean).forEach(k=>map.set(k,r.rank));});return map;}
function winner(m){const s=score(m);return !s?null:s.home>s.away?m.home:m.away;}
function bteam(m,key,seeds){const t=key==='home'?m.home:m.away,s=score(m),won=name(winner(m))===name(t),k=[code(t),en(t),name(t)].find(x=>seeds.has(x)),seed=k?seeds.get(k):null,sc=key==='home'?s?.home:s?.away;return `<div class="kvl1180-bracket-team ${won?'is-winner':''}">${flag(t)?`<span class="kvl1180-bracket-mark"><img src="${esc(flag(t))}" alt="${esc(name(t))} 국기" loading="lazy"></span>`:`<span class="kvl1180-bracket-mark is-path">?</span>`}<span class="kvl1180-bracket-copy"><strong>${esc(name(t))}</strong><small>${Number.isFinite(Number(seed))?`예선 ${seed}위`:esc(code(t)||en(t)||'대진')}</small></span><b class="kvl1180-team-score">${sc??'-'}</b></div>`;}
function bsets(m){const s=score(m);if(!s?.sets?.length)return '';return `<div class="kvl1180-match-sets">${esc(s.sets.map(x=>`${x?.home??x?.[0]}-${x?.away??x?.[1]}`).join(' · '))}</div>`;}
function bmatch(m,label,seeds){if(!m)return '<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>TBD</strong><span>일정 미정</span></div></article>';return `<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>${esc(label)}</strong><span>${esc(shortDate(date(m)))} · ${esc(time(m)||'미정')} KST</span></div>${bteam(m,'home',seeds)}${bteam(m,'away',seeds)}${bsets(m)}</article>`;}
function renderKnockout(d){
  const root=q('[data-kvl-component="knockout"]');if(!root)return;const c=cfg(d).knockout;if(c.mode==='none'){root.innerHTML='<div class="kvl1180-schedule-empty">이 대회는 결선 토너먼트를 사용하지 않습니다.</div>';return;}
  const all=d.matches||[],qf=all.filter(m=>round(m)==='QF'),sf=all.filter(m=>round(m)==='SF'),final=all.find(m=>round(m)==='FINAL'),bronze=all.find(m=>round(m)==='BRONZE');if(!qf.length&&!sf.length&&!final){root.innerHTML='<div class="kvl1180-schedule-empty">공식 결선 대진 발표 후 토너먼트를 표시합니다.</div>';return;}
  const seeds=seedMap(d),byNext=new Map();qf.forEach((m,i)=>{const k=m.nextMatchId||m.next_match_id||`SF${Math.floor(i/2)+1}`;if(!byNext.has(k))byNext.set(k,[]);byNext.get(k).push({m,label:m.bracketLabel||`QF${i+1}`});});
  const pairs=sf.map((m,i)=>byNext.get(mid(m))||byNext.get(`SF${i+1}`)||[]),used=new Set(pairs.flat().map(x=>mid(x.m))),left=qf.filter(m=>!used.has(mid(m)));while(pairs.length<2)pairs.push([]);left.forEach((m,i)=>pairs[i%2].push({m,label:m.bracketLabel||`QF${qf.indexOf(m)+1}`}));
  root.innerHTML=`<div class="kvl1180-bracket"><div class="kvl1180-bracket-ladder"><section class="kvl1180-round kvl1180-round-qf"><h4 class="kvl1180-round-title">${esc(c.qfLabel||'8강 · Quarterfinals')}</h4><div class="kvl1180-round-body">${pairs.map(p=>`<div class="kvl1180-qf-pair">${p.map(x=>bmatch(x.m,x.label,seeds)).join('')}</div>`).join('')}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-sf"><h4 class="kvl1180-round-title">${esc(c.sfLabel||'준결승 · Semifinals')}</h4><div class="kvl1180-round-body">${sf.map((m,i)=>bmatch(m,m.bracketLabel||`SF${i+1}`,seeds)).join('')}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-final"><h4 class="kvl1180-round-title">${esc(c.finalLabel||'결승 · Final')}</h4><div class="kvl1180-round-body">${bmatch(final,final?.bracketLabel||'FINAL',seeds)}</div></section></div>${bronze?`<div class="kvl1180-bronze"><h4 class="kvl1180-bronze-title">${esc(c.bronzeLabel||'3위 결정전 · Bronze Medal Match')}</h4>${bmatch(bronze,bronze.bracketLabel||'3RD',seeds)}</div>`:''}</div>`;
}

function pcard(p){const tag=p.url?'a':'button',attrs=p.url?` href="${esc(p.url)}"`:` type="button"`,count=p.count??p.rosterCount;return `<${tag} class="kvl1180-participant-button" data-team-code="${esc(p.code||'')}"${attrs}>${p.flag?`<img src="${esc(p.flag)}" alt="${esc(p.name||'')} 국기" loading="lazy">`:''}<span class="kvl1180-participant-button-copy"><strong>${esc(p.name||'미정')}</strong><small>${esc(p.en||p.code||'')}${count!==undefined?` · ${esc(count)}명`:''}</small></span></${tag}>`;}
function renderParticipants(d){const root=q('[data-kvl-component="participants"]');if(!root)return;const c=cfg(d).participants,list=d.participants||[];if(!list.length){root.innerHTML='<div class="kvl1180-schedule-empty">참가국 정보 확인 중입니다.</div>';return;}let groups=[];if(c.mode==='groups'){const map=new Map();list.forEach(p=>{const g=p.group||'참가국';if(!map.has(g))map.set(g,[]);map.get(g).push(p);});groups=[...map.entries()];}else groups=[[c.groupLabel||'참가국',list]];root.innerHTML=`<div class="kvl1180-participant-groups kvl-v2-participant-groups ${c.mode==='groups'?'':'is-flat'}">${groups.map(([g,rows])=>`<article class="kvl1180-participant-group"><header class="kvl1180-participant-group-head"><strong>${esc(g)}</strong><span>${rows.length}개국</span></header><div class="kvl1180-participant-buttons">${rows.map(pcard).join('')}</div></article>`).join('')}</div>`;qa('button.kvl1180-participant-button',root).forEach(b=>b.onclick=()=>renderRoster(d,b.dataset.teamCode));const wanted=new URLSearchParams(location.search).get('team'),first=list.find(p=>String(p.code)===wanted)||list[0];if(first&&!first.url)renderRoster(d,first.code);}
function renderRoster(d,teamCode){const root=q('[data-kvl-component="roster"]');if(!root)return;const c=cfg(d).roster;if(c.mode==='none'||c.mode==='link-only'){root.innerHTML='';return;}const r=(d.rosters||{})[teamCode],t=(d.participants||[]).find(x=>x.code===teamCode);if(!r?.players?.length){root.innerHTML='<div class="kvl1180-schedule-empty">등록 선수명단은 확인되는 대로 연결합니다.</div>';return;}root.innerHTML=`<article class="kvl1180-team-profile"><header class="kvl1180-team-profile-head">${t?.flag?`<span class="kvl1180-team-profile-flag"><img src="${esc(t.flag)}" alt="${esc(t.name)} 국기"></span>`:''}<div class="kvl1180-team-profile-copy"><p class="label">SELECTED TEAM · ${esc(t?.code||'')}</p><h3>${esc(t?.name||teamCode)}</h3><p>${esc(t?.en||'')}</p></div></header><div class="kvl1180-roster-block"><div class="kvl1180-roster-headline"><div><h4>등록 선수명단</h4><p>대회 당시 등록 로스터 Snapshot</p></div></div><div class="kvl-v2-roster-list">${r.players.map(p=>`<div class="kvl-v2-roster-row"><b>${esc(p.number??'-')}</b><span><strong>${esc(p.name||p.koreanName||p.officialName||'-')}</strong><small>${esc(p.en||p.officialName||'')}</small></span><em>${esc(p.position||'-')}</em><span>${esc(p.heightCm?`${p.heightCm}cm`:'키 확인 불가')}</span></div>`).join('')}</div></div></article>`;}

function render(d=data()){applyStructureLabels(d);bindKpis(d);renderQualifications(d);renderCalendar(d);renderSchedule(d);renderStandings(d);renderFinal(d);renderKnockout(d);renderParticipants(d);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>render(),{once:true});else render();
window.KVLCompetitionComponentsV2={render};
})();
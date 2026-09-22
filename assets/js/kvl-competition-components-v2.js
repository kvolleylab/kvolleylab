/* K-Volley Lab · Competition V2 shared component renderer
 * Visual source of truth: validated AVC men/women production.
 * Calendar / schedule / standings / knockout / participants all emit the frozen AVC class structure.
 * Competition adapters normalize data only and MUST NOT create component HTML.
 */
(()=>{
'use strict';
const WEEK=['일','월','화','수','목','금','토'];
const runtime={stage:'전체',pool:'전체'};
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=()=>window.KVL_COMPETITION_V2_DATA||{};
const txt=(e,v)=>{if(e&&v!==undefined&&v!==null)e.textContent=String(v);};
const name=t=>t?.name||t?.nameKo||t?.countryKo||t?.country_ko||t?.name_ko||t?.en||t?.nameEn||t?.country||t?.name_en||'미정';
const en=t=>t?.en||t?.nameEn||t?.country||t?.name_en||'';
const code=t=>t?.code||t?.teamCode||'';
const flag=t=>t?.flag||t?.flagUrl||'';
const logo=t=>t?.logo||t?.logoUrl||t?.emblem||flag(t);
const mid=m=>m?.id||m?.matchId||m?.match_id||'';
const date=m=>m?.date||m?.dateKst||m?.date_kst||'';
const time=m=>m?.time||m?.timeKst||m?.time_kst||'';
const stage=m=>m?.stageLabel||m?.stage||m?.round||'경기';
const pool=m=>m?.group||m?.pool||'';
const round=m=>String(m?.round||'').toUpperCase();
const venue=m=>m?.venueLabel||m?.venue?.arena||m?.venue?.cityKo||m?.venue?.city_ko||m?.venue?.countryKo||m?.venue?.country_ko||'';
function score(m){const s=m?.score;if(!s)return null;const hv=s.home??s.homeSets??s.home_sets,av=s.away??s.awaySets??s.away_sets;if(hv===null||hv===undefined||hv===''||av===null||av===undefined||av==='')return null;const h=Number(hv),a=Number(av);return Number.isFinite(h)&&Number.isFinite(a)?{home:h,away:a,sets:Array.isArray(s.sets)?s.sets:[]}:null;}
function fmtDate(v){if(!v)return '일정 미정';const d=new Date(`${v}T12:00:00Z`);return `${Number(v.slice(5,7))}월 ${Number(v.slice(8,10))}일 (${WEEK[d.getUTCDay()]})`;}
const viewUrl=(view,params)=>window.KVLCompetitionTemplateV2.viewUrl(view,params);
const participant=ref=>window.KVLCompetitionDataV2.participant(data(),ref);
function teamLink(t,content=esc(name(t)),extraClass=''){const p=participant(t),cls=['kvl-team-link',extraClass].filter(Boolean).join(' ');return p?`<a class="${cls}" data-team-results="${esc(p.code)}" href="${esc(viewUrl('team',{team:p.code}))}" aria-label="${esc(name(p))} 경기결과">${content}</a>`:content;}
function rosterAction(d,t){const target=window.KVLCompetitionDataV2.rosterTarget(d,t);return {...target,href:target.available?(target.mode==='full'?viewUrl('rosters',{team:target.code})+'#team-roster':target.url):null};}
function rosterButton(d,t){const a=rosterAction(d,t);return a.href?`<a class="kvl-team-roster-link" data-team-roster="${esc(code(t))}" href="${esc(a.href)}">등록 선수명단 보기</a>`:'<button class="kvl-team-roster-link" type="button" disabled>등록 선수명단 미제공</button>';}
function rosterIdentity(d,t,content){const a=rosterAction(d,t);return a.href?`<a class="kvl-team-results-identity is-link" data-team-roster="${esc(code(t))}" href="${esc(a.href)}" aria-label="${esc(name(t))} 등록 선수명단">${content}</a>`:`<div class="kvl-team-results-identity">${content}</div>`;}
function rosterRoute(teamCode,{push=false,scroll=false}={}){
 const u=new URL(location.href);u.searchParams.set('view','rosters');u.searchParams.set('team',teamCode);u.searchParams.delete('date');if(scroll)u.hash='team-roster';
 history[push?'pushState':'replaceState'](null,'',u.pathname+u.search+u.hash);
}
function markRosterSelection(root,teamCode){
 qa('[data-team-code]',root).forEach(btn=>{const active=btn.dataset.teamCode===teamCode;btn.classList.toggle('is-active',active);if(active){btn.setAttribute('aria-current','true');btn.setAttribute('aria-pressed','true');}else{btn.removeAttribute('aria-current');btn.setAttribute('aria-pressed','false');}});
}
function selectRosterTeam(d,teamCode,{push=false,scroll=false}={}){
 const t=window.KVLCompetitionDataV2.participant(d,teamCode),action=rosterAction(d,t);if(!t||!action.available)return false;
 if(action.mode!=='full'){location.href=action.href;return true;}
 rosterRoute(teamCode,{push,scroll});const root=q('[data-kvl-component="participants"]');if(root)markRosterSelection(root,teamCode);renderRoster(d,teamCode);window.KVLCompetitionTemplateV2?.applyView();
 if(scroll)requestAnimationFrame(()=>q('#team-roster')?.scrollIntoView({block:'start'}));return true;
}
function bindInternalRosterLinks(d,root){
 qa('[data-team-roster]',root).forEach(a=>{const t=window.KVLCompetitionDataV2.participant(d,a.dataset.teamRoster),action=rosterAction(d,t);if(action.available&&action.mode==='full')a.onclick=e=>{e.preventDefault();selectRosterTeam(d,t.code,{push:true,scroll:true});};});
}
const groupLabel=g=>String(g||'').endsWith('조')?String(g):String(g)+'조';
const shortDate=v=>String(v||'').slice(5).replace('-','.');

function cfg(d){
  return {
    labels:{
      groupsTab:d.structure?.labels?.groupsTab||'조별순위',
      groupsKpi:d.structure?.labels?.groupsKpi||'조 편성',
      groupsKpiUnit:d.structure?.labels?.groupsKpiUnit||'개 조',
      knockoutKpi:d.structure?.labels?.knockoutKpi||'결선 진출',
      standingsTitle:d.structure?.labels?.standingsTitle||'조별순위',
      standingsEyebrow:d.structure?.labels?.standingsEyebrow||'POOL & COMBINED STANDINGS',
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

function applyVisualBaseline(d){
  const body=document.body;
  body.removeAttribute('data-avc-gender');
  body.classList.remove('kvl1180-women-template');
  body.dataset.kvlVisualBaseline='avc-validated';
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
  const domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';
  txt(q('.kvl1180-tabs [data-view="rosters"]'),domestic?(c.labels.participantsTitle||'참가팀'):'참가국');
  txt(q('[data-kvl="schedule-note"]'),d.scheduleNote||'한국시간(KST)');
  txt(q('[data-kvl="standings-note"]'),d.standingsNote||'공식 결과 기준');
  txt(q('[data-kvl="groups-status"]'),d.standingsStatus||d.standingsNote||'공식 결과 기준');
  txt(q('[data-kvl="standings-rule"]'),d.standingsRule||'승리 경기 수 → 승점 → 세트 득실비 → 점수 득실비 순으로 적용합니다.');
  txt(q('[data-kvl="participants-status"]'),d.teamCount?`${d.teamCount}${domestic?'팀':'개국'}`:(domestic?'참가팀':'참가국'));
  txt(q('[data-kvl="bracket-title"]'),c.knockout.title||'결선 토너먼트');
  txt(q('[data-kvl="meaning-eyebrow"]'),d.meaning?.eyebrow||'ROAD TO THE WORLD');
  txt(q('[data-kvl="meaning-title"]'),d.meaning?.title||'대회 의미 · 국제 진출권');
  txt(q('[data-kvl="meaning-note"]'),d.meaning?.note||'대회별 공식 규정과 확정 결과만 표시합니다.');
  const women=q('[data-gender-link="women"]');
  if(women){const disabled=!d.genderLinks?.women;women.classList.toggle('is-disabled',disabled);if(disabled)women.setAttribute('aria-disabled','true');else women.removeAttribute('aria-disabled');}
}

function bindKpis(d){
  const targets=[d.structure?.kpiTargets?.participants||viewUrl('rosters',{team:d.focusTeamCode}),viewUrl('groups'),viewUrl('schedule'),viewUrl('knockout')];
  qa('.kvl1180-view[data-view="overview"] .kvl1180-kpis .kvl1180-kpi:not(.is-venue)').forEach((card,i)=>{
    const target=targets[i];if(!target)return;
    card.dataset.kvlTarget=target;card.tabIndex=0;card.setAttribute('role','link');
    card.onclick=()=>{location.href=target;};
    card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();location.href=target;}};
  });
}

function qualificationIcon(cls){return cls==='is-la'?'medal':cls==='is-wc'?'world':'bars';}
function renderQualifications(d){
  const root=q('[data-kvl-component="qualifications"]'),section=q('[data-kvl-section="qualifications"]');if(!root)return;
  const items=d.qualifications||[];if(section){section.hidden=!items.length;section.dataset.kvlEmpty=String(!items.length);}
  root.innerHTML=items.map((x,i)=>{
    const cls=x.className||(['is-la','is-wc','is-wr'][i]||'is-wr'),teams=d.status==='upcoming'?[]:(x.resultTeams||[]).filter(Boolean),has=teams.length>0,icon=qualificationIcon(cls);
    return `<article class="kvl1180-stake ${esc(cls)} ${has?'has-confirmed-result':''}"><div class="kvl1180-stake-top"><span class="kvl1180-stake-brand"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-${icon}-solid"/></svg>${esc(x.brand||'대회 규정')}</span><span class="kvl1180-pill">${esc(x.pill||'공식 기준')}</span></div><h3>${esc(x.title||'공식 규정')}</h3><p>${esc(x.description||'')}</p>${has?`<div class="kvl1180-stake-confirmed"><strong>${esc(x.resultLabel||'대회 결과')}</strong><span>${esc(teams.join(' · '))}</span></div>`:''}<div class="kvl1180-stake-foot">${esc(x.foot||'')}</div></article>`;
  }).join('');
}

function renderCalendar(d){
  const root=q('[data-kvl-component="calendar"]'),section=q('[data-kvl-section="calendar"]');if(!root)return;
  if(section)section.dataset.kvlEmpty=String(!cfg(d).calendar);if(!cfg(d).calendar){if(section)section.hidden=true;return;}else if(section)section.hidden=false;
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
      cells.push(`<div class="kvl1180-day has-match"><a href="${esc(viewUrl('schedule',{date:dt}))}"><span class="kvl1180-date">${day}</span><span class="kvl1180-games">${rows}</span></a></div>`);
    }
    while(cells.length%7)cells.push('<div class="kvl1180-day is-empty"></div>');
    return `<section class="kvl1180-calendar"><div class="kvl1180-calendar-title">${y}년 ${mo}월</div><div class="kvl1180-calendar-week">${WEEK.map(w=>`<span>${w}</span>`).join('')}</div><div class="kvl1180-calendar-grid">${cells.join('')}</div></section>`;
  }).join('');
}

function stages(d){const x=d.structure?.schedule?.stages;if(Array.isArray(x)&&x.length)return x;return ['전체',...[...new Set((d.matches||[]).map(stage).filter(Boolean))]];}
function setLine(m){const s=score(m);if(!s?.sets?.length)return '';return s.sets.map(x=>{const hv=x?.home??x?.[0],av=x?.away??x?.[1];if(hv===null||hv===undefined||hv===''||av===null||av===undefined||av==='')return '';const h=Number(hv),a=Number(av);return Number.isFinite(h)&&Number.isFinite(a)?`<span>${h}-${a}</span>`:'';}).filter(Boolean).join('');}
function side(t,pos){const asset=logo(t),mark=asset?`<span class="kvl1180-inline-logo">${teamLink(t,`<img src="${esc(asset)}" alt="${esc(name(t))} 엠블럼" loading="lazy">`,'kvl-team-flag-link')}</span>`:`<span class="kvl1180-inline-logo kvl1180-seed-icon">${esc(code(t)||'?')}</span>`,english=en(t)||code(t),copy=`<span class="kvl1180-slot-copy"><strong>${teamLink(t)}</strong>${english?`<small>${teamLink(t,esc(english),'kvl-team-en-link')}</small>`:''}</span>`;return pos==='left'?`<span class="kvl1180-side is-left">${mark}${copy}</span>`:`<span class="kvl1180-side is-right">${copy}${mark}</span>`;}
function matchRow(m){
 const s=score(m),d=data(),domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';
 const shortVenue=domestic?venue(m).replace(/^고성군\s*/,''):venue(m);
 const metaDetail=domestic?[stage(m),pool(m)?groupLabel(pool(m)):'',shortVenue].filter(Boolean).join(' · '):'';
 const detail=domestic?'':[stage(m),pool(m)?groupLabel(pool(m)):'',venue(m),window.KVLCompetitionDataV2.localTimeLabel(m)].filter(Boolean).join(' · ');
 const timeText=domestic?`${date(m)} ${time(m)||'시간 미정'}`:`${time(m)||'시간 미정'} KST`;
 return `<article data-match-id="${esc(mid(m))}" class="kvl1180-match-row ${[code(m.home),code(m.away)].includes(d.focusTeamCode)?'is-korea':''}"><div class="kvl1180-match-meta"><time>${esc(timeText)}</time>${metaDetail?`<span class="kvl1180-match-meta-detail">${esc(metaDetail)}</span>`:''}</div><div class="kvl1180-match-board">${side(m.home,'left')}<b class="kvl1180-score ${s?'':'is-upcoming'}">${s?`${s.home}-${s.away}`:'VS'}</b>${side(m.away,'right')}</div><div class="kvl1180-set-scores">${setLine(m)}</div>${detail?`<div class="kvl1180-match-detail">${esc(detail)}</div>`:''}</article>`;
}
function renderSchedule(d){
  const filters=q('[data-kvl-component="schedule-filters"]'),summary=q('[data-kvl-component="schedule-summary"]'),root=q('[data-kvl-component="schedule-list"]');if(!root)return;
  const ss=stages(d);if(!ss.includes(runtime.stage))runtime.stage='전체';
  if(filters){filters.innerHTML=ss.map(s=>`<button type="button" data-stage="${esc(s)}" class="${s===runtime.stage?'is-active':''}">${esc(s)}</button>`).join('');qa('[data-stage]',filters).forEach(b=>b.onclick=()=>{runtime.stage=b.dataset.stage;runtime.pool='전체';renderSchedule(d);});}
  const poolRoot=q('[data-kvl-component="pool-filter"]');
  const pools=[...new Set((d.matches||[]).filter(m=>stage(m)===runtime.stage).map(m=>pool(m)).filter(Boolean))];
  if(poolRoot){poolRoot.hidden=!pools.length;poolRoot.innerHTML=pools.length?`<label>조 선택 <select aria-label="조 선택"><option>전체</option>${pools.map(g=>`<option>${esc(g)}</option>`).join('')}</select></label>`:'';const select=q('select',poolRoot);if(select){select.value=runtime.pool;select.onchange=()=>{runtime.pool=select.value;renderSchedule(d);};}}
  let list=(d.matches||[]).slice();if(runtime.pool!=='전체')list=list.filter(m=>pool(m)===runtime.pool);if(runtime.stage!=='전체')list=list.filter(m=>stage(m)===runtime.stage);list.sort((a,b)=>`${date(a)}T${time(a)}`.localeCompare(`${date(b)}T${time(b)}`));
  const done=list.filter(m=>score(m)).length;if(summary)summary.innerHTML=`<strong>${esc(runtime.stage)}</strong><span>${list.length}경기 · 완료 ${done} · 예정 ${list.length-done} · ${esc(d.timezoneSummary||'한국시간(KST)')}</span>`;
  root.innerHTML=matchGroups(list,'schedule');
  const wanted=new URLSearchParams(location.search).get('date'),el=wanted?document.getElementById(`date-${wanted}`):null;if(el)requestAnimationFrame(()=>el.scrollIntoView({block:'start'}));
}

function matchGroups(list,prefix){
 const groups=new Map();list.forEach(m=>{const dt=date(m)||'미정';if(!groups.has(dt))groups.set(dt,[]);groups.get(dt).push(m);});
 return [...groups.entries()].map(([dt,games])=>`<section id="${prefix==='schedule'?'date':prefix+'-date'}-${esc(dt)}" class="kvl1180-date-group"><header class="kvl1180-date-head"><div class="kvl1180-date-title"><strong>${esc(fmtDate(dt))}</strong><span>${esc([...new Set(games.map(stage))].join(' · '))}</span></div><span>${games.length}경기</span></header><div>${games.map(matchRow).join('')}</div></section>`).join('')||'<div class="kvl1180-schedule-empty">선택한 조건의 경기가 없습니다.</div>';
}
function renderTeamResults(d){
 const root=q('[data-kvl-component="team-results"]');if(!root)return;
 const requested=new URLSearchParams(location.search).get('team'),t=window.KVLCompetitionDataV2.participant(d,requested);
 if(!t){root.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">TEAM RESULTS</p><h2>국가별 경기결과</h2></div></div><p class="kvl1180-schedule-empty">이 대회에서 해당 참가국을 찾을 수 없습니다.</p><a class="kvl-team-roster-link" href="${esc(viewUrl('schedule'))}">전체 경기일정 보기</a>`;return;}
 const list=(d.matches||[]).filter(m=>[m.home,m.away].some(side=>window.KVLCompetitionDataV2.participant(d,side)?.code===t.code)).sort((a,b)=>(date(a)+time(a)).localeCompare(date(b)+time(b))),done=list.filter(m=>score(m)),wins=done.filter(m=>{const s=score(m);return window.KVLCompetitionDataV2.participant(d,m.home)?.code===t.code?s.home>s.away:s.away>s.home;}).length;
 const identity=`${logo(t)?`<img src="${esc(logo(t))}" alt="${esc(name(t))} 엠블럼">`:''}<div><p class="label">TEAM RESULTS · ${esc(t.code)}</p><h2>${esc(name(t))} 경기결과</h2>${en(t)?`<p class="kvl-team-results-en">${esc(en(t))}</p>`:''}<p class="kvl-team-competition">${esc(d.displayName)}</p></div>`;
 root.innerHTML=`<div class="kvl1180-section-head kvl-team-results-head">${rosterIdentity(d,t,identity)}<div class="kvl-team-actions">${rosterButton(d,t)}<a href="${esc(viewUrl('schedule'))}">전체 경기일정 보기</a></div></div><div class="kvl1180-schedule-summary"><strong>${esc(name(t))} · 전체 ${list.length}경기</strong><span>완료 ${done.length} · ${wins}승 ${done.length-wins}패 · 예정 ${list.length-done.length} · 한국시간(KST)</span></div><div class="kvl1180-schedule-list">${matchGroups(list,'team')}</div>`;
 bindInternalRosterLinks(d,root);
}

function statusOf(r){if(r.status==='host-qualified')return {label:r.statusLabel||'개최국 진출',cls:'is-qualified'};if(r.status==='qualified')return {label:r.statusLabel||'결선 진출',cls:'is-qualified'};if(r.status==='out')return {label:r.statusLabel||'예선 종료',cls:'is-out'};return {label:r.statusLabel||'',cls:''};}
function teamCell(t,cls){const p=participant(t)||t,english=en(p)||code(p);return `<span class="${cls}">${logo(p)?teamLink(p,`<img src="${esc(logo(p))}" alt="${esc(name(p))} 엠블럼" loading="lazy">`,'kvl-team-flag-link'):''}<span class="${cls}-copy"><strong>${teamLink(p)}</strong><small>${teamLink(p,esc(english),'kvl-team-en-link')}</small></span></span>`;}
function poolRow(r){const st=statusOf(r),t=r.team||{};return `<div class="kvl1180-pool-row ${st.cls}"><span class="kvl1180-pool-rank">${esc(r.rank??'-')}</span>${teamCell(t,'kvl1180-pool-team')}<span class="kvl1180-pool-w">${esc(r.wins??'-')}</span><span class="kvl1180-pool-l">${esc(r.losses??'-')}</span><span class="kvl1180-pool-pts">${esc(r.points??'-')}</span><span class="kvl1180-pool-ratio">${esc(r.setRatio??'-')}</span><span class="kvl1180-pool-ratio">${esc(r.pointRatio??'-')}</span></div>`;}
function poolCard(p){const rows=p.rows||[],domestic=String(data().competitionFamily||data().family||'').toLowerCase()==='domestic';return `<article class="kvl1180-pool-card"><header class="kvl1180-pool-card-head"><strong>${esc(p.title||`${p.id||''}조`)}</strong><span>${rows.length}${domestic?'팀':'개국'}${p.matchCount!==undefined?' · '+esc(p.matchCount)+'경기':''}</span></header><div class="kvl1180-pool-table-head"><span>순위</span><span>${domestic?'팀':'국가'}</span><span>승</span><span>패</span><span>승점</span><span>세트 득실비</span><span>점수 득실비</span></div>${rows.map(poolRow).join('')}</article>`;}
function poolRankLabel(d,r){const pools=d.standings?.pools||[];for(const p of pools){const found=(p.rows||[]).find(x=>code(x.team)===code(r.team));if(found)return `${groupLabel(p.id||String(p.title||'').replace('조',''))} ${found.rank==null?'순위 미정':found.rank+'위'}`;}return r.rank==null?'순위 미정':`예선 ${r.rank}위`;}
function qfPair(d,r,c){if(c.mode==='single-league'||r.status!=='qualified')return '';if(r.pairingLabel)return String(r.pairingLabel);const m=(d.matches||[]).find(m=>round(m)==='QF'&&[code(m.home),code(m.away)].includes(code(r.team)));if(!m)return '';const other=code(m.home)===code(r.team)?m.away:m.home,rows=d.standings?.combinedRows||[],opponent=rows.find(x=>code(x.team)===code(other));return r.rank!=null&&opponent?.rank!=null?`${r.rank}-${opponent.rank}`:'';}
function combinedRow(d,r,c){const st=statusOf(r),t=r.team||{},pool=poolRankLabel(d,r),pair=qfPair(d,r,c);return `<div class="kvl1180-combined-row ${st.cls}"><span class="kvl1180-combined-rank">${esc(r.rank??'-')}위</span>${teamCell(t,'kvl1180-combined-team')}<span class="kvl1180-combined-pool">${esc(pool)}</span><span class="kvl1180-combined-stat">${esc(r.wins??'-')}</span><span class="kvl1180-combined-stat">${esc(r.losses??'-')}</span><span class="kvl1180-combined-stat">${esc(r.points??'-')}</span><span class="kvl1180-combined-stat">${esc(r.setRatio??'-')}</span><span class="kvl1180-combined-stat">${esc(r.pointRatio??'-')}</span><span><b class="kvl1180-combined-result ${st.cls}">${esc(st.label||'')}</b>${pair?`<small class="kvl1180-qf-pairing">${esc(pair)}</small>`:''}</span></div>`;}
function mobileCombinedLine(d,r,c){const st=statusOf(r),t=r.team||{},pair=qfPair(d,r,c);return `<div class="kvl-shared-combined-line ${code(t)===d.focusTeamCode?'is-korea':''}"><span class="kvl-shared-combined-identity"><span class="kvl-shared-combined-rank">${esc(r.rank??'-')}위</span>${logo(t)?`<span class="kvl-shared-combined-flag"><img src="${esc(logo(t))}" alt="${esc(name(t))} 엠블럼"></span>`:''}<strong class="kvl-shared-combined-team">${teamLink(t)}</strong></span><span class="kvl-shared-combined-result ${st.cls}"><b>${esc(st.label||'')}</b>${pair?`<small>${esc(pair)}</small>`:''}</span><span class="kvl-shared-combined-stat">${esc(r.wins??'-')}승</span><span class="kvl-shared-combined-stat">${esc(r.points??'-')}</span><span class="kvl-shared-combined-stat">${esc(r.setRatio??'-')}</span><span class="kvl-shared-combined-stat">${esc(r.pointRatio??'-')}</span><span class="kvl-shared-combined-stat">${esc(poolRankLabel(d,r))}</span></div>`;}
function combinedBlock(d,rows,c){const title=c.title||c.combinedTitle||'예선 종합순위',single=c.mode==='single-league';return `<section class="kvl1180-combined-block ${single?'is-single-league':''}"><div class="kvl1180-combined-head"><div><p class="label">PRELIMINARY OVERALL</p><h3>${esc(title)}</h3></div><p>${esc(single?'예선 전체 순위 · 공식 결과 기준':'각 조 성적을 대회 규정에 따라 통합한 순위')}</p></div><div class="kvl1180-combined-table"><div class="kvl1180-combined-table-head"><span>순위</span><span>국가</span><span>${single?'구분':'조'}</span><span>승</span><span>패</span><span>승점</span><span>세트 득실비</span><span>점수 득실비</span><span>결과</span></div>${rows.map(r=>combinedRow(d,r,c)).join('')}</div><div class="kvl-shared-combined-mobile"><div class="kvl-shared-combined-table"><div class="kvl-shared-combined-line is-head"><span class="kvl-shared-combined-identity"><span class="kvl-shared-combined-rank-head">순위</span><span class="kvl-shared-combined-country-head">국가</span></span><span>결과</span><span>승</span><span>승점</span><span>세트 득실비</span><span>점수 득실비</span><span>${single?'예선순위':'조순위'}</span></div>${rows.map(r=>mobileCombinedLine(d,r,c)).join('')}</div></div></section>`;}
function renderStandings(d){
  const root=q('[data-kvl-component="standings"]');if(!root)return;const c=cfg(d).standings,s=d.standings||{};
  if(c.mode==='none'){root.innerHTML='<div class="kvl1180-schedule-empty">이 대회는 별도 예선 순위를 사용하지 않습니다.</div>';return;}
  if(c.mode==='single-league'){root.innerHTML=combinedBlock(d,s.rows||[],c);return;}
  root.innerHTML=`<div class="kvl1180-pool-grid">${(s.pools||[]).map(poolCard).join('')}</div>${s.combinedRows?.length?combinedBlock(d,s.combinedRows,c):''}`;
}

function renderFinal(d){
  const top=q('[data-kvl-component="final-top4"]');if(!top)return;
  const rows=(d.status==='upcoming'?[]:(d.finalRanking||[]).filter(x=>d.status!=='active'||x.confirmed===true)).slice().sort((a,b)=>Number(a.rank)-Number(b.rank)).slice(0,4);
  const medal=r=>Number(r)===1?'🥇':Number(r)===2?'🥈':Number(r)===3?'🥉':'';
  top.innerHTML=rows.map(x=>{const p=participant(x.code)||x,asset=logo(p);return `<article data-final-rank="${esc(x.rank)}" class="kvl1180-final-card rank-${esc(x.rank)} ${Number(x.rank)===1?'is-champion':''}"><span class="kvl1180-final-rank" data-rank="${esc(x.rank)}">${medal(x.rank)?`<span class="kvl-final-medal" aria-hidden="true">${medal(x.rank)}</span>`:''}<b>${esc(x.rank)}위</b></span>${asset?`<span class="kvl1180-final-flag">${teamLink(p,`<img src="${esc(asset)}" alt="${esc(x.team||name(p)||'')} 엠블럼" loading="lazy">`,'kvl-team-flag-link')}</span>`:'<span class="kvl1180-final-flag is-pending">?</span>'}<div class="kvl1180-final-copy"><strong>${teamLink(p,esc(x.team||name(p)||'미정'))}</strong><small><span class="kvl-final-result">${esc(x.result||'')}</span>${x.qualification?`<span class="kvl-final-qualification">${esc(x.qualification)}</span>`:''}</small></div></article>`}).join('');
}
function seedMap(d){const map=new Map(),s=d.standings||{},rows=s.rows||s.combinedRows||[];rows.forEach(r=>{const t=r.team||{};[code(t),en(t),name(t)].filter(Boolean).forEach(k=>map.set(k,r.rank));});return map;}
function winner(m){const s=score(m);return !s||s.home===s.away?null:s.home>s.away?m.home:m.away;}
function bteam(m,key,seeds){const t=key==='home'?m.home:m.away,s=score(m),won=!!winner(m)&&name(winner(m))===name(t),k=[code(t),en(t),name(t)].find(x=>seeds.has(x)),seed=k?seeds.get(k):null,sc=key==='home'?s?.home:s?.away,english=en(t)||code(t)||'대진',seedText=seed!=null&&Number.isFinite(Number(seed))&&round(m)==='QF'?` · 예선 ${seed}번 시드`:'';return `<div class="kvl1180-bracket-team ${won?'is-winner':''}">${logo(t)?`<span class="kvl1180-bracket-mark">${teamLink(t,`<img src="${esc(logo(t))}" alt="${esc(name(t))} 엠블럼" loading="lazy">`,'kvl-team-flag-link')}</span>`:`<span class="kvl1180-bracket-mark is-path">?</span>`}<span class="kvl1180-bracket-copy"><strong>${teamLink(t)}</strong><small>${teamLink(t,esc(english),'kvl-team-en-link')}${esc(seedText)}</small></span><b class="kvl1180-team-score">${sc??'-'}</b></div>`;}
function bsets(m){const s=score(m);if(!s?.sets?.length)return '';return `<div class="kvl1180-match-sets">${esc(s.sets.map(x=>`${x?.home??x?.[0]}-${x?.away??x?.[1]}`).join(' · '))}</div>`;}
function bbye(t,seeds){if(!t)return '';const asset=logo(t),k=[code(t),en(t),name(t)].find(x=>seeds.has(x)),seed=k?seeds.get(k):null;return `<article class="kvl1180-match is-bye"><div class="kvl1180-match-head"><strong>준결승 직행</strong><span>${seed!=null?`예선 ${esc(seed)}위`:'직행'}</span></div><div class="kvl1180-bracket-team is-winner">${asset?`<span class="kvl1180-bracket-mark">${teamLink(t,`<img src="${esc(asset)}" alt="${esc(name(t))} 엠블럼" loading="lazy">`,'kvl-team-flag-link')}</span>`:'<span class="kvl1180-bracket-mark is-path">↗</span>'}<span class="kvl1180-bracket-copy"><strong>${teamLink(t)}</strong><small>${esc(en(t)||code(t)||'')}</small></span></div></article>`;}
function bmatch(m,label,seeds){if(!m)return '<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>TBD</strong><span>일정 미정</span></div></article>';return `<article class="kvl1180-match"><div class="kvl1180-match-head"><strong>${esc(label)}</strong><span>${esc(shortDate(date(m)))} · ${esc(time(m)||'미정')} KST</span></div>${bteam(m,'home',seeds)}${bteam(m,'away',seeds)}${bsets(m)}</article>`;}
function renderKnockout(d){
  const root=q('[data-kvl-component="knockout"]');if(!root)return;const c=cfg(d).knockout;if(c.mode==='none'){root.innerHTML='<div class="kvl1180-schedule-empty">이 대회는 결선 토너먼트를 사용하지 않습니다.</div>';return;}
  const all=d.matches||[],qf=all.filter(m=>round(m)==='QF'),sf=all.filter(m=>round(m)==='SF'),final=all.find(m=>round(m)==='FINAL'),bronze=all.find(m=>round(m)==='BRONZE');if(!qf.length&&!sf.length&&!final){root.innerHTML='<div class="kvl1180-schedule-empty">공식 결선 대진 발표 후 토너먼트를 표시합니다.</div>';return;}
  const seeds=seedMap(d),byNext=new Map();qf.forEach((m,i)=>{const k=m.nextMatchId||m.next_match_id||`SF${Math.floor(i/2)+1}`;if(!byNext.has(k))byNext.set(k,[]);byNext.get(k).push({m,label:m.bracketLabel||`QF${i+1}`});});
  const pairs=sf.map((m,i)=>byNext.get(mid(m))||byNext.get(`SF${i+1}`)||[]),used=new Set(pairs.flat().map(x=>mid(x.m))),left=qf.filter(m=>!used.has(mid(m)));while(pairs.length<Math.max(2,sf.length))pairs.push([]);left.forEach((m,i)=>pairs[i%pairs.length].push({m,label:m.bracketLabel||`QF${qf.indexOf(m)+1}`}));
  const direct=sf.map((m,i)=>{const fromQf=new Set((pairs[i]||[]).map(x=>code(winner(x.m))).filter(Boolean));return [m.home,m.away].find(t=>!fromQf.has(code(t)))||null;});
  root.innerHTML=`<div class="kvl1180-bracket"><div class="kvl1180-bracket-ladder"><section class="kvl1180-round kvl1180-round-qf"><h4 class="kvl1180-round-title">${esc(c.qfLabel||'8강 · Quarterfinals')}</h4><div class="kvl1180-round-body">${pairs.map((p,i)=>`<div class="kvl1180-qf-pair">${p.map(x=>bmatch(x.m,x.label,seeds)).join('')}${bbye(direct[i],seeds)}</div>`).join('')}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-sf"><h4 class="kvl1180-round-title">${esc(c.sfLabel||'준결승 · Semifinals')}</h4><div class="kvl1180-round-body">${sf.map((m,i)=>bmatch(m,m.bracketLabel||`SF${i+1}`,seeds)).join('')}</div></section><span class="kvl1180-bracket-gap"></span><section class="kvl1180-round kvl1180-round-final"><h4 class="kvl1180-round-title">${esc(c.finalLabel||'결승 · Final')}</h4><div class="kvl1180-round-body">${bmatch(final,final?.bracketLabel||'FINAL',seeds)}</div></section></div>${bronze?`<div class="kvl1180-bronze"><h4 class="kvl1180-bronze-title">${esc(c.bronzeLabel||'3위 결정전 · Bronze Medal Match')}</h4>${bmatch(bronze,bronze.bracketLabel||'3RD',seeds)}</div>`:''}</div>`;
}
function pcard(p){
 const d=data(),domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';
 const count=p.count??p.rosterCount,asset=p.logo||p.flag;
 if(domestic){
   const school=p.fullName||p.name||'';
   const href='university-team.html?school='+encodeURIComponent(school);
   return `<a class="kvl1180-participant-button" data-team-code="${esc(p.code||'')}" href="${esc(href)}">${asset?`<span class="kvl-participant-flag"><img src="${esc(asset)}" alt="${esc(p.name||'')} 엠블럼" loading="lazy"></span>`:'<span class="kvl-participant-flag" aria-hidden="true"></span>'}<span class="kvl1180-participant-button-copy"><strong>${esc(p.name||'미정')}</strong><small>${esc(p.en||p.code||'')}${count!==undefined?` · ${esc(count)}명`:''}</small></span></a>`;
 }
 const action=rosterAction(d,p),available=action.available;
 if(available&&action.mode==='full')return `<button type="button" class="kvl1180-participant-button" data-team-code="${esc(p.code||'')}" data-roster-internal="true" aria-pressed="false">${asset?`<span class="kvl-participant-flag"><img src="${esc(asset)}" alt="${esc(p.name||'')} 엠블럼" loading="lazy"></span>`:'<span class="kvl-participant-flag" aria-hidden="true"></span>'}<span class="kvl1180-participant-button-copy"><strong>${esc(p.name||'미정')}</strong><small>${esc(p.en||p.code||'')}${count!==undefined?` · ${esc(count)}명`:''}</small></span></button>`;
 if(action.href)return `<a class="kvl1180-participant-button" data-team-code="${esc(p.code||'')}" href="${esc(action.href)}">${asset?`<span class="kvl-participant-flag"><img src="${esc(asset)}" alt="${esc(p.name||'')} 엠블럼" loading="lazy"></span>`:'<span class="kvl-participant-flag" aria-hidden="true"></span>'}<span class="kvl1180-participant-button-copy"><strong>${esc(p.name||'미정')}</strong><small>${esc(p.en||p.code||'')}${count!==undefined?` · ${esc(count)}명`:''}</small></span></a>`;
 return `<button type="button" class="kvl1180-participant-button" data-team-code="${esc(p.code||'')}" disabled aria-disabled="true" title="등록 선수명단 미제공">${asset?`<span class="kvl-participant-flag"><img src="${esc(asset)}" alt="${esc(p.name||'')} 엠블럼" loading="lazy"></span>`:'<span class="kvl-participant-flag" aria-hidden="true"></span>'}<span class="kvl1180-participant-button-copy"><strong>${esc(p.name||'미정')}</strong><small>${esc(p.en||p.code||'')}${count!==undefined?` · ${esc(count)}명`:''} · 명단 미제공</small></span></button>`;
}
function displayGroups(list,c){
  if(c.mode==='groups'){const map=new Map();list.forEach(p=>{const g=p.group||'참가국';if(!map.has(g))map.set(g,[]);map.get(g).push(p);});return [...map.entries()];}
  const columns=Math.min(3,Math.max(1,Number(c.displayColumns)||3)),size=Math.ceil(list.length/columns),out=[];
  for(let i=0;i<columns;i++){const rows=list.slice(i*size,(i+1)*size);if(!rows.length)continue;out.push([`${c.groupLabel||'참가국'} · ${i*size+1}-${i*size+rows.length}`,rows]);}
  return out;
}
function renderParticipants(d){const root=q('[data-kvl-component="participants"]');if(!root)return;const c=cfg(d).participants,list=d.participants||[];if(!list.length){root.innerHTML='<div class="kvl1180-participants-empty">참가국 정보 확인 중입니다.</div>';return;}const groups=displayGroups(list,c),domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';root.innerHTML=`<div class="kvl1180-participant-groups">${groups.map(([g,rows])=>`<article class="kvl1180-participant-group"><header class="kvl1180-participant-group-head"><strong>${esc(g)}</strong><span>${rows.length}${domestic?'팀':'개국'}</span></header><div class="kvl1180-participant-buttons">${rows.map(pcard).join('')}</div></article>`).join('')}</div>`;
 root.onclick=e=>{const btn=e.target.closest('[data-team-code]');if(!btn||!root.contains(btn)||btn.disabled)return;const teamCode=btn.dataset.teamCode,t=window.KVLCompetitionDataV2.participant(d,teamCode),action=rosterAction(d,t);if(action.mode==='full'&&action.available){e.preventDefault();selectRosterTeam(d,teamCode,{push:false,scroll:false});}};
 const params=new URLSearchParams(location.search),wanted=params.get('team')||d.focusTeamCode,first=list.find(p=>String(p.code)===wanted)||(!params.has('team')?list[0]:null);if(first){markRosterSelection(root,first.code);renderRoster(d,first.code);}else{q('[data-kvl-component="roster"]').innerHTML='<p class="kvl1180-roster-pending">이 대회의 참가국을 선택해 주세요.</p>';}}

function renderRoster(d,teamCode){
 const root=q('[data-kvl-component="roster"]');if(!root)return;
 const c=cfg(d).roster,t=(d.participants||[]).find(x=>x.code===teamCode),r=(d.rosters||{})[teamCode];
 if(c.mode==='none'){root.innerHTML='<p class="kvl1180-roster-pending">이 대회는 등록 선수명단을 제공하지 않습니다.</p>';return;}
 if(c.mode==='link-only'){root.innerHTML=`<div class="kvl1180-roster-pending">${esc(t?.name||teamCode)} · ${rosterButton(d,t)}</div>`;return;}
 if(!r?.players?.length){root.innerHTML=`<p class="kvl1180-roster-pending">${esc(d.rosterPendingLabel||'등록 선수명단은 공식 자료 확인 후 연결합니다.')}</p>`;return;}
 const players=r.players.slice().sort((a,b)=>Number(a.number)-Number(b.number));
 const rows=players.map(p=>`<div class="kvl1180-roster-row" role="row" data-player-id="${esc(p.playerId||'')}"><span class="kvl1180-roster-no">${esc(p.number??'-')}</span><span class="kvl1180-roster-name"><strong>${esc(p.en||'-')}</strong></span><span class="kvl1180-roster-korean">${esc(p.name||'-')}</span><span class="kvl1180-roster-pos">${esc(p.position||'-')}</span><span class="kvl1180-roster-dob">${esc(p.dob||'-')}</span><span class="kvl1180-roster-height">${p.heightCm>0?esc(p.heightCm)+'cm':'키 확인 불가'}</span><span class="kvl1180-roster-club ${p.club?.confirmed?'is-confirmed':''}" data-season-label="${esc(d.clubSeasonLabel||'소속팀')} · "><span class="kvl1180-club-main">${esc(p.club?.name||'미확인')}</span>${p.club?.country?`<span class="kvl1180-club-country">${p.club.flag?`<img src="${esc(p.club.flag)}" alt="">`:''}<span>${esc(p.club.country)}${p.club.league?' · '+esc(p.club.league):''}</span></span>`:''}</span><span class="kvl1180-roster-vb">${p.volleybox?`<a class="kvl1180-vb-link" href="${esc(p.volleybox)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.name)} Volleybox 프로필"><span>VB</span><b>↗</b></a>`:'—'}</span><span data-player-action-slot="${esc(p.playerId||'')}" hidden></span></div>`).join('');
 root.innerHTML=`<article class="kvl1180-team-profile"><header class="kvl1180-team-profile-head"><span class="kvl1180-team-profile-flag"><img src="${esc(t?.flag||'')}" alt="${esc(t?.name||'')} 국기"></span><div class="kvl1180-team-profile-copy"><p class="label">SELECTED TEAM · ${esc(teamCode)}</p><h3>${esc(t?.name||teamCode)}</h3><p>${esc(t?.en||'')}</p></div><div class="kvl1180-team-profile-meta">${t?.group?`<span>${esc(groupLabel(t.group))}</span>`:''}<span>${esc(r.statusLabel||'등록 '+players.length+'명')}</span>${d.clubSeasonLabel?`<span>${esc(d.clubSeasonLabel)} ${players.filter(p=>p.club?.confirmed).length}/${players.length} 공식확인</span>`:''}</div></header><div class="kvl1180-roster-block"><div class="kvl1180-roster-headline"><div><h4>등록 선수명단</h4><p>${esc(d.rosterNote||'대회 당시 등록 로스터 Snapshot')}</p></div><div class="kvl1180-print-actions"><button type="button" data-print="selected">선택 국가 인쇄</button><button type="button" data-print="all">전체 ${Object.keys(d.rosters||{}).length}개국 인쇄</button></div></div><div class="kvl1180-roster-table" role="table" aria-label="${esc(t?.name)} 등록 선수명단"><div class="kvl1180-roster-table-head" role="row"><span>등번호</span><span>영문명</span><span>한글명</span><span>POS</span><span>생년월일</span><span>키</span><span>${esc(d.clubSeasonLabel||'소속팀')} · 리그</span><span>VB</span></div>${rows}</div>${d.rosterSourceNote?`<p class="kvl1180-roster-source"><strong>자료 기준</strong> · ${esc(d.rosterSourceNote)}</p>`:''}</div></article>`;
 qa('[data-print]',root).forEach(button=>button.onclick=()=>printRoster(d,teamCode,button.dataset.print));
}
async function printRoster(d,teamCode,mode){
 const teams=(d.participants||[]).filter(t=>d.rosters?.[t.code]?.players?.length&&(mode==='all'||t.code===teamCode));
 let root=document.getElementById('kvl1180PrintRoot');if(!root){root=document.createElement('div');root.id='kvl1180PrintRoot';document.body.appendChild(root);}
 const sheets=teams.flatMap(t=>{const all=d.rosters[t.code].players.slice().sort((a,b)=>Number(a.number)-Number(b.number));return Array.from({length:Math.ceil(all.length/14)},(_,page)=>({t,players:all.slice(page*14,(page+1)*14),count:all.length}));});
 root.innerHTML=sheets.map(({t,players,count},i)=>{return `<section class="kvl-print-sheet"><header class="kvl-print-head"><div class="kvl-print-identity"><img src="${esc(t.flag||'')}" alt=""><div><p>K-Volley Lab · ${esc(d.officialName||d.displayName)}</p><h1>${esc(t.name)} <small>${esc(t.en)} · ${esc(t.code)}</small></h1></div></div><div class="kvl-print-meta"><strong>${t.group?esc(groupLabel(t.group))+' · ':''}${count}명</strong><span>${esc(d.clubSeasonLabel||'소속팀')} 포함</span></div></header><div class="kvl-print-table"><div class="kvl-print-table-head"><span>#</span><span>영문명</span><span>한글명</span><span>POS</span><span>생년월일</span><span>키</span><span>${esc(d.clubSeasonLabel||'소속팀')} · 리그</span></div>${players.map(p=>`<div class="kvl-print-row"><span>${esc(p.number??'-')}</span><span>${esc(p.en||'-')}</span><span>${esc(p.name||'-')}</span><span>${esc(p.position||'-')}</span><span>${esc(p.dob||'-')}</span><span>${p.heightCm>0?esc(p.heightCm)+'cm':'-'}</span><span>${esc([p.club?.name||'미확인',p.club?.country,p.club?.league].filter(Boolean).join(' · '))}</span></div>`).join('')}</div><footer class="kvl-print-foot"><span>${esc(d.rosterPrintNote||'대회 당시 등록 선수명단')}</span><span>${i+1}/${sheets.length}</span></footer></section>`;}).join('');
 await Promise.all([...root.querySelectorAll('img')].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,1500);})));document.body.classList.add('kvl-print-participants-active');window.print();
}
window.addEventListener('afterprint',()=>document.body.classList.remove('kvl-print-participants-active'));
window.addEventListener('beforeprint',()=>{if(document.querySelector('#kvl1180PrintRoot .kvl-print-sheet'))document.body.classList.add('kvl-print-participants-active');});
function renderFocus(d){
 const root=q('[data-kvl-component="focus"]');if(!root)return;
 const f=d.focus;if(!f){root.hidden=true;root.innerHTML='';return;}root.hidden=false;
 const matches=(d.matches||[]).filter(m=>[code(m.home),code(m.away)].includes(f.code)&&score(m)).sort((a,b)=>(date(a)+time(a)).localeCompare(date(b)+time(b))).slice(-3).reverse();
 root.innerHTML=`<div class="kvl1180-lower"><section class="kvl1180-ranking"><div class="kvl1180-ranking-head"><div class="kvl1180-ranking-title"><span class="kvl1180-ranking-flag">${esc(f.flagEmoji||'')}</span><strong>${esc(f.name)} · FIVB World Ranking</strong></div><a href="${esc(f.rankingUrl)}" target="_blank" rel="noopener noreferrer">랭킹 변동 상세보기 →</a></div><div class="kvl1180-ranking-grid">${['대회 시작 전','현재','이번 대회 누적'].map((label,i)=>`<div><span>${label}</span><strong class="is-empty">${esc(f.values?.[i]??'—')}</strong></div>`).join('')}</div></section><section class="kvl1180-results"><div class="kvl1180-results-head"><strong>${esc(f.name)} 최근 경기 결과</strong><a href="${esc(viewUrl('schedule'))}">전체 결과 보기 →</a></div><div class="kvl1180-results-list">${matches.map(m=>{const home=code(m.home)===f.code,s=score(m),a=home?s.home:s.away,b=home?s.away:s.home;return `<div class="kvl1180-result-row"><strong>vs ${esc(name(home?m.away:m.home))}</strong><span>${a} - ${b}</span><em class="${a>b?'win':'loss'}">${a>b?'승':'패'}</em></div>`}).join('')||'<div class="kvl1180-result-row"><strong>완료 경기 없음</strong><span>—</span><em>—</em></div>'}</div></section></div><p class="kvl1180-footnote">${esc(f.note||'')}</p>`;
}

function render(d=data()){applyVisualBaseline(d);applyStructureLabels(d);bindKpis(d);renderQualifications(d);renderCalendar(d);renderSchedule(d);renderStandings(d);renderFinal(d);renderKnockout(d);renderParticipants(d);renderTeamResults(d);renderFocus(d);window.KVLCompetitionTemplateV2?.applyView();document.body.dataset.kvlRenderState='ready';if(window.KVLCompetitionTemplateV2?.currentView()==='rosters'&&location.hash==='#team-roster')requestAnimationFrame(()=>q('#team-roster')?.scrollIntoView({block:'start'}));}
if(!window.KVL_COMPETITION_PAGE_V2?.deferRender){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>render(),{once:true});else render();}
window.addEventListener('popstate',()=>{renderParticipants(data());renderTeamResults(data());});
window.KVLCompetitionComponentsV2={render,printRoster};
})();

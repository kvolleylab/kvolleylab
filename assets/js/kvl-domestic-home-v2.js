/* Domestic Template v2 presentation. Data, standings, brackets and roster routes stay in the shared engine. */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={overview:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',schedule:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h2M14 15h2"/>',groups:'<path d="M4 21V12h4v9M10 21V4h4v17M16 21v-8h4v8M2 21h20"/>',knockout:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 15v5M8 21h8"/>',rosters:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5v2"/>',resources:'<path d="M5 3h9l5 5v13H5V3ZM14 3v6h5M8 13h8M8 17h6"/>',venue:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'};
const icon=key=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]||icons.overview}</svg>`;
const trophy=rank=>international(current)&&Number(rank)>3?'':`<span class="dv2-trophy trophy-${Number(rank)}" aria-hidden="true"><svg viewBox="0 0 28 30" width="28" height="30"><path class="trophy-handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path class="trophy-cup" d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="trophy-shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path class="trophy-stem" d="M12 18h4v6h-4z"/><path class="trophy-base" d="M9 24h10l2 3H7z"/></svg></span>`;
const href=(view,extra)=>window.KVLCompetitionTemplateV2.viewUrl(view,extra);
const isNotRequired=m=>m?.notRequired===true||String(m?.status||'').toLowerCase()==='not_required';
function metricIcon(key){
 const solid={rosters:'users',schedule:'calendar',groups:'layers',knockout:'trophy',venue:'pin'};
 return current?.structure?.overviewMetrics?.iconStyle==='solid'&&solid[key]?`<svg class="is-solid" viewBox="0 0 24 24" aria-hidden="true"><use href="#kvl-icon-${solid[key]}-solid"/></svg>`:icon(key);
}
let current,matchesReady=Promise.resolve();
const international=d=>d?.structure?.presentation==='international-home-v2';
const enabled=d=>(['domestic','pro'].includes(d?.competitionFamily)&&d.structure?.presentation==='domestic-home-v2')||(['avc','fivb','games'].includes(d?.competitionFamily)&&international(d));
const label=d=>d.structure?.labels?.participantsTitle||'참가팀';
const team=code=>(current.participants||[]).find(t=>t.code===code)||{code,name:code||'미정'};
const regional=()=>current?.structure?.audience==='comprehensive';
const teamLogo=t=>{const mark=t.logo||(international(current)?t.flag:'');return regional()?`<span class="kvl-region-mark" aria-label="대표 지역 ${esc(t.region||'미확인')}">${esc(t.region||'지역 미확인')}</span>`:mark?`<img src="${esc(mark)}" alt="" loading="lazy">`:`<span class="dv2-team-mark">${esc((t.name||'미정').replace(/대학교|대$/g,'').slice(0,2))}</span>`;};
const teamHref=t=>current.structure?.participants?.linkMode==='team-roster'?href('rosters',{team:t.code})+'#team-roster':current.structure?.participants?.linkMode==='team-results'?href('team',{team:t.code}):'university-team.html?school='+encodeURIComponent(t.fullName||t.name);
const teamTile=(t,subtitle)=>`<a class="dv2-team-tile" href="${esc(teamHref(t))}">${teamLogo(t)}<b>${esc(t.name)}</b><small>${esc(subtitle??((regional()?'':t.region)||(current.structure?.participants?.mode==='groups'&&t.group?String(t.group).replace(/조$/,'')+'조':label(current))))}</small></a>`;
function heading(title,view,action='전체보기'){return `<div class="dv2-heading"><h2>${esc(title)}</h2>${view?`<a href="${esc(href(view))}">${esc(action)} ›</a>`:''}</div>`;}
function metric(title,value,unit,view,key){return `<a class="dv2-metric" href="${esc(href(view))}"><span class="dv2-metric-icon">${metricIcon(key||view)}</span><span><small>${esc(title)}</small><strong>${esc(value)}<em>${esc(unit)}</em></strong></span><b class="dv2-arrow" aria-hidden="true">›</b></a>`;}
// Summarize the same verified rows as the standings page; never calculate a new rank.
function selectOverviewStanding(d,now=Date.now()){
 const university=d?.competitionFamily==='domestic'&&/^KVL-COMP-UNIV-/.test(d.competitionId||'');
 const league=d?.competitionFamily==='pro'&&d.structure?.presentationCategory==='pro-league'&&/^KVL-COMP-VLEAGUE-/.test(d.competitionId||'');
 if(!university&&!league)return null;
 const grouped=university&&d.structure?.standings?.mode!=='single-league',pools=d.standings?.pools||[];
 const title=league?'정규리그 순위':grouped?'예선 조별 현황':'예선 순위',cta=league?'전체 순위 보기':grouped?'조편성·순위 보기':'예선 순위 보기';
 const model=(state,rows,detail='')=>({state,title,cta,rows,detail});
 const pending=()=>model('pending',[{prefix:'',teamName:'순위 확인 중',teamCode:null}]);
 if(!Number.isFinite(now))return pending();
 const participants=d.participants||[],byCode=new Map(participants.map(t=>[t.code,t]));
 const groups=grouped?pools.map(p=>({id:p.id,rows:p.rows||[],matchCount:p.matchCount})):[{id:'',rows:d.standings?.rows||[]}];
 const poolName=id=>String(id).replace(/조$/,'')+'조';
 const rowCode=r=>r.team?.code||r.teamCode;
 const records=(d.matches||[]).filter(m=>league?/^[1-6]라운드$/.test(m.stage||''):m.stage==='예선');
 const today=new Date(now+9*3600000).toISOString().slice(0,10);
 const excluded=new Set(['cancelled','canceled','postponed','abandoned','취소','연기','미실시']);
 const unfinished=new Set(['scheduled','upcoming','live','in_progress','in-progress','suspended','예정','진행중','경기중','중단']);
 const status=m=>String(m.status||'').toLowerCase();
 const final=m=>{const s=m.score;return s&&Number.isInteger(s.home)&&Number.isInteger(s.away)&&Math.max(s.home,s.away)===3&&Math.min(s.home,s.away)>=0&&Math.min(s.home,s.away)<3&&m.scoreVerification!==false&&!unfinished.has(status(m))&&!excluded.has(status(m))&&!isNotRequired(m);};
 const active=records.filter(m=>!isNotRequired(m)&&!excluded.has(status(m)));
 const beforeStart=d.status==='upcoming'||(active.length>0&&active.every(m=>{const c=matchClock(m);return c&&!m.score&&!['live','in_progress','in-progress','진행중','경기중'].includes(status(m))&&(c.at===null?m.date>today:c.at>now);}));
 if(beforeStart){
  const rows=grouped&&groups.length?groups.map(g=>({prefix:poolName(g.id),teamName:g.rows.length?g.rows.length+'팀':'조편성 확인 중',teamCode:null})):[{prefix:'',teamName:league?'개막 전':'예선 시작 전',teamCode:null}];
  return model('upcoming',rows,grouped?'예선 시작 전':'');
 }
 if(!groups.length||!active.length||!participants.length||byCode.size!==participants.length)return pending();
 const allRows=groups.flatMap(g=>g.rows),codes=allRows.map(rowCode);
 if(codes.length!==participants.length||new Set(codes).size!==participants.length||codes.some(code=>!byCode.has(code)))return pending();
 if(grouped&&(new Set(groups.map(g=>g.id)).size!==groups.length||groups.some(g=>!g.id)||records.some(m=>!groups.some(g=>g.id===m.pool))))return pending();
 const ids=records.map(m=>m.id);
 if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)return pending();
 if(active.some(m=>{const c=matchClock(m);return !c||!byCode.has(m.home?.code)||!byCode.has(m.away?.code)||m.home.code===m.away.code||(m.score&&!final(m))||(!final(m)&&(m.date<today||['completed','finished','final','종료'].includes(status(m))))||(final(m)&&(c.at===null?m.date>today:c.at>now));}))return pending();
 const complete=active.filter(final);
 if(!complete.length)return pending();
 if(league&&(!d.automation||d.automation.source!=='KOVO_PUBLIC_STAT_API'||!d.automation.standingsSource||d.automation.completedMatches!==complete.length))return pending();
 const leaders=[];
 for(const g of groups){
  const members=new Set(g.rows.map(rowCode)),matches=grouped?records.filter(m=>m.pool===g.id):records;
  if(!matches.length||(g.matchCount!=null&&g.matchCount!==matches.length)||matches.some(m=>!members.has(m.home?.code)||!members.has(m.away?.code)))return pending();
  const played=new Map([...members].map(code=>[code,0]));
  for(const m of matches.filter(final)){played.set(m.home.code,played.get(m.home.code)+1);played.set(m.away.code,played.get(m.away.code)+1);}
  if(g.rows.some(r=>{const games=r.games??(r.wins+r.losses);return !Number.isInteger(r.wins)||r.wins<0||!Number.isInteger(r.losses)||r.losses<0||!Number.isInteger(games)||games!==r.wins+r.losses||games!==played.get(rowCode(r));}))return pending();
  const first=g.rows.filter(r=>r.rank===1);
  if(first.length!==1||!played.get(rowCode(first[0])))return pending();
  leaders.push({group:g.id,row:first[0],team:byCode.get(rowCode(first[0]))});
 }
 const required=records.filter(m=>!isNotRequired(m)&&!['cancelled','canceled','abandoned','취소','미실시'].includes(status(m)));
 const allComplete=required.length>0&&required.every(final);
 if(league&&d.regularSeasonComplete===true&&!allComplete)return pending();
 const finished=league?d.regularSeasonComplete===true:allComplete;
 const rows=leaders.map(l=>({prefix:league?(finished?'정규리그 1위':'현재 1위'):grouped?poolName(l.group)+' 1위':finished?'예선 최종 1위':'예선 1위',teamName:l.team.name||l.team.fullName,teamCode:l.team.code}));
 if(rows.some(r=>!r.teamName))return pending();
 if(league&&(!Number.isFinite(leaders[0].row.points)||leaders[0].row.points<0))return pending();
 const detail=league?`승점 ${leaders[0].row.points}점`:grouped?(finished?'예선 최종 순위':'현재 조별 순위'):(finished?'예선 종료':'현재 예선 순위');
 return model(finished?'completed':'active',rows,detail);
}
function overviewStandingMetric(d){
 const m=selectOverviewStanding(d);if(!m)return '';
 return `<a class="dv2-metric dv2-standing-metric" data-standing-state="${esc(m.state)}" href="${esc(href('groups'))}"><span class="dv2-metric-icon">${metricIcon('groups')}</span><span class="dv2-standing-copy"><small class="dv2-standing-label">${esc(m.title)}</small><span class="dv2-standing-lines">${m.rows.map(r=>`<span class="dv2-standing-line"${r.teamCode?` data-standing-leader="${esc(r.teamCode)}"`:''}><span class="dv2-standing-prefix">${esc(r.prefix)}</span><strong class="dv2-standing-team">${esc(r.teamName)}</strong></span>`).join('')}</span>${m.detail?`<small class="dv2-standing-detail">${esc(m.detail)}</small>`:''}<small class="dv2-standing-cta">${esc(m.cta)} <span aria-hidden="true">›</span></small></span></a>`;
}
function ranking(d){
 const ranks=d.finalRanking||[],champ=ranks.find(r=>r.rank===1),regional=d.structure?.audience==='comprehensive';
 const counts=new Map();ranks.forEach(r=>counts.set(Number(r.rank),(counts.get(Number(r.rank))||0)+1));
 const rankText=r=>(counts.get(Number(r.rank))>1?'공동 ':'')+r.rank+'위';
 if(!ranks.length)return '<div class="dv2-empty">최종순위 확정 후 표시합니다.</div>';
 const region=r=>regional?team(r.code).region||'':'';
 const regionText=r=>region(r)?`<span class="dv2-region" aria-label="대표 지역 ${esc(region(r))}">${esc(region(r))}</span>`:'';
 const result=r=>{const value=r.result||'',suffix=' · '+region(r);return region(r)&&value.endsWith(suffix)?value.slice(0,-suffix.length):value;};
 const rows=ranks.map(r=>`<a href="${esc(href('team',{team:r.code}))}"><span class="dv2-rank">${trophy(r.rank)}<span>${esc(rankText(r))}</span></span>${regional?`<span class="dv2-ranked-team"><span class="dv2-ranked-team-copy"><b>${esc(r.team||team(r.code).name)}</b><small>${esc(result(r))}</small></span>${regionText(r)}</span>`:`<b>${esc(r.team||team(r.code).name)}</b><small>${esc(result(r))}</small>`}</a>`).join('');
 return `<div class="dv2-ranking">${champ?`<a class="dv2-champion" href="${esc(href('team',{team:champ.code}))}">${teamLogo(team(champ.code))}<span class="dv2-champion-copy"><small>CHAMPION</small>${regional?`<span class="dv2-team-name-row"><strong>${esc(champ.team||team(champ.code).name)}</strong>${regionText(champ)}</span>`:`<strong>${esc(champ.team||team(champ.code).name)}</strong>`}</span>${trophy(1)}</a>`:''}<div class="dv2-ranking-list">${rows}</div></div>`;
}
function overviewSummary(d){
 const summary=d.structure?.overviewSummary;
 if(!summary)return heading('최종순위','knockout')+ranking(d);
 if(summary.mode==='standings')return overviewStandings(d);
 return heading(summary.title||'대회 안내')+`<dl class="dv2-overview-summary">${(summary.items||[]).map(item=>`<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('')}</dl>`;
}
function overviewStandings(d){
 const rows=d.standings?.rows||[],title=d.structure.labels?.groupsTab||'정규리그 순위';
 const content=rows.length?`<table class="dv2-standings-table" aria-label="${esc(d.structure.labels?.standingsTitle||title)} 요약"><thead><tr>${['순위','팀','승점','승','패'].map(text=>`<th scope="col">${text}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>{
  const t=team(r.team?.code||r.teamCode);
  return `<tr data-standing-team="${esc(t.code)}"><td data-stat="rank">${esc(r.rank??'—')}</td><th scope="row"><a href="${esc(href('team',{team:t.code}))}">${teamLogo(t)}<span>${esc(t.name)}</span></a></th><td data-stat="points">${esc(r.points??'—')}</td><td data-stat="wins">${esc(r.wins??'—')}</td><td data-stat="losses">${esc(r.losses??'—')}</td></tr>`;
 }).join('')}</tbody></table>`:'<p class="dv2-empty">공식 순위 확인 후 표시합니다.</p>';
 return heading(title,'groups','전체 순위')+`<div class="dv2-overview-standings">${content}<p class="dv2-standings-note">${esc(d.standingsNote||'정규리그 공식 결과 기준')}</p></div>`;
}
function overviewTeams(d){
 const previous=d.structure?.overviewTeamOrder==='previous-season-rank'?d.previousSeasonRanking:null;
 const ranks=new Map((previous?.rows||[]).filter(r=>Number.isInteger(r.rank)&&r.rank>0).map(r=>[r.teamCode,r.rank]));
 const sorted=[...d.participants].sort((a,b)=>(ranks.get(a.code)??Infinity)-(ranks.get(b.code)??Infinity)||a.name.localeCompare(b.name,'ko'));
 const columns=d.structure?.overviewTeamColumns===7?' data-desktop-columns="7"':'';
 const note=previous?`<p class="dv2-team-order-note">${esc(previous.season)} 시즌 최종 순위순</p>`:'';
 return heading(label(d),'rosters',`${d.participants.length}${d.structure?.overviewMetrics?.teamUnit||'팀'} 전체보기`)+note+`<div class="dv2-team-strip"${columns}>${sorted.slice(0,d.structure?.overviewTeamCount||6).map(t=>teamTile(t,ranks.has(t.code)?`지난 시즌 ${ranks.get(t.code)}위`:undefined)).join('')}</div>`+(previous?.note?`<p class="dv2-team-order-footnote">${esc(previous.note)}</p>`:'');
}
// Match summaries read the same season records as the schedule, never another season or Cup.
function matchClock(m){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(m.date||''))return null;
 const day=Date.parse(m.date+'T00:00:00+09:00');
 if(!Number.isFinite(day)||new Date(day+9*3600000).toISOString().slice(0,10)!==m.date)return null;
 const hasTime=typeof m.time==='string'&&m.time.trim()!=='';
 if(hasTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time))return null;
 const minutes=hasTime?Number(m.time.slice(0,2))*60+Number(m.time.slice(3)):null;
 return {day,at:minutes===null?null:day+minutes*60000,sort:day+(minutes===null?86399999:minutes*60000)};
}
function selectOverviewMatches(d,now=Date.now()){
 const api=window.KVLCompetitionDataV2;
 return api.selectMatchSummary((d.matches||[]).filter(m=>api.participant(d,m.home)&&api.participant(d,m.away)),now);
}
function divisionSchedule(d,gender,date){
 const u=new URL(d.genderLinks?.[gender]||location.href,location.href);
 if(u.origin!==location.origin)throw Error('Summary links must use this site');
 u.hash='';u.searchParams.set('view','schedule');u.searchParams.delete('team');u.searchParams.delete('date');
 if(date)u.searchParams.set('date',date);
 return u.pathname+u.search;
}
function summaryGame(d,m,kind,today){
 const title=kind==='recent'?'최근 결과':m?.date===today?'오늘 경기':'다음 경기';
 if(!m)return `<section class="dv2-summary-slot" data-kind="${kind}"><h4>${title}</h4><div class="dv2-summary-empty"><b>${kind==='recent'?'아직 확인된 경기 결과가 없습니다.':'확인된 다음 일정이 없습니다.'}</b><span>${kind==='recent'?'이번 시즌 경기 종료 후 표시합니다.':'일정이 확정되면 표시합니다.'}</span></div></section>`;
 const api=window.KVLCompetitionDataV2,state=api.matchSummaryState(m),finished=state.finished,home=api.participant(d,m.home),away=api.participant(d,m.away);
 const date=new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',weekday:'short',timeZone:'Asia/Seoul'}).format(new Date(m.date+'T12:00:00+09:00'));
 const side=(t,win,role)=>`<span class="dv2-summary-side${win?' is-winner':''}">${teamLogo(t)}<b>${esc(t.name||t.fullName)}</b><small>${role}</small></span>`;
 const sets=finished?(m.score.sets||[]).map((s,i)=>{const p=api.pair(s);return p?`<span aria-label="${i+1}세트 ${p.home} 대 ${p.away}">${p.home}–${p.away}</span>`:'';}).join(''):'';
 return `<section class="dv2-summary-slot" data-kind="${kind}"><h4>${title}${kind==='next'?`<span class="dv2-summary-today" data-match-state="${state.kind}">${esc(state.label.replace(/^오늘 경기 /,'').replace('경기 예정','예정'))}</span>`:''}</h4><a class="dv2-summary-game" data-match-id="${esc(m.id)}" href="${esc(divisionSchedule(d,d.gender,m.date))}"><span class="dv2-summary-when">${esc(date)} · ${esc(m.time?m.time+' KST':'시간 미정')}${m.stage?' · '+esc(m.stage):''}</span><span class="dv2-summary-matchup">${side(home,finished&&m.score.home>m.score.away,'홈')}<strong class="dv2-summary-score">${state.score?`${state.score.home} : ${state.score.away}`:'VS'}</strong>${side(away,finished&&m.score.away>m.score.home,'원정')}</span>${finished?`<span class="dv2-summary-sets" aria-label="세트별 점수">${sets||'세트별 점수 확인 중'}</span>`:''}<span class="dv2-summary-venue">${esc(state.detail||(m.venueLabel||'경기장 미정'))}</span><span class="dv2-summary-cta">${finished?'경기 결과 보기':state.kind==='scheduled'?'경기 일정 보기':'경기 현황 보기'} ›</span></a></section>`;
}
function summaryDivision(d){
 const picked=selectOverviewMatches(d);
 return summaryGame(d,picked.recent,'recent',picked.today)+summaryGame(d,picked.next,'next',picked.today);
}
async function loadSummaryDivision(d,gender){
 const contract=window.KVLCompetitionConfigV2,api=window.KVLCompetitionDataV2,page=window.KVL_COMPETITION_PAGE_V2||{};
 const route=contract.locationFor(new URL(divisionSchedule(d,gender),location.href).href,page.collectionRoot||'/data/competitions/');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const read=async url=>{const r=await fetch(url,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Summary data unavailable');return r.json();};
  const config=await read(route.configURL);
  if(contract.validate(config,{slug:route.slug}).length||config.competition.gender!==gender||config.competition.season!==d.season||config.competition.competitionFamily!==d.competitionFamily||config.structure?.presentationCategory!==d.structure.presentationCategory)throw Error('Summary season mismatch');
  const source=await read(new URL(config.data,route.base)),peer=contract.assemble(config,source,route);
  if(api.validate(peer,{production:page.production===true}).length)throw Error('Invalid summary data');
  return api.normalize(peer);
 }finally{clearTimeout(timeout);}
}
function overviewMatches(d,before){
 if(d.structure?.overviewMatches?.mode!=='recent-next'||d.structure.presentationCategory!=='pro-league')return;
 const section=document.createElement('section');section.className='dv2-overview-matches kvl1180-view';section.dataset.view='overview';section.setAttribute('aria-labelledby','dv2-overview-matches-title');
 section.innerHTML='<div class="dv2-heading"><h2 id="dv2-overview-matches-title">최근 결과 · 오늘/다음 경기</h2></div><div class="dv2-division-match-grid"></div><p class="dv2-summary-note">이번 시즌 공식 기록 반영 기준 · 실시간 중계가 아닙니다.</p>';
 before.before(section);
 const genders=d.gender==='women'?['women','men']:['men','women'];
 matchesReady=Promise.all(genders.map(async gender=>{
  const label=gender==='men'?'남자부':'여자부',card=document.createElement('article');card.className='dv2-division-matches';card.dataset.summaryGender=gender;
  card.innerHTML=`<header><h3>${label}<small>${esc(d.season)}</small></h3><a href="${esc(divisionSchedule(d,gender))}">${label} 전체 일정 ›</a></header><div class="dv2-summary-body" aria-busy="true"><p class="dv2-summary-loading">경기 정보를 불러오는 중입니다.</p></div>`;
  section.querySelector('.dv2-division-match-grid').append(card);const body=card.querySelector('.dv2-summary-body');
  try{
   let source=gender===d.gender?d:await loadSummaryDivision(d,gender),refreshing=false;
   const render=()=>{if(section.isConnected){const html=summaryDivision(source);if(body.innerHTML!==html)body.innerHTML=html;}};render();
   const refresh=async()=>{if(refreshing||document.hidden||!section.isConnected)return;refreshing=true;try{source=await loadSummaryDivision(d,gender);delete body.dataset.refreshFailed;render();}catch{if(section.isConnected)body.dataset.refreshFailed='true';}finally{refreshing=false;}};
   const clockTimer=setInterval(()=>{if(!section.isConnected){clearInterval(clockTimer);clearInterval(fetchTimer);document.removeEventListener('visibilitychange',refresh);return;}if(!document.hidden)render();},60000);
   const fetchTimer=setInterval(refresh,300000);document.addEventListener('visibilitychange',refresh);
  }
  catch{if(section.isConnected)body.innerHTML='<p class="dv2-summary-error" role="status">경기 정보를 불러오지 못했습니다. 위의 전체 일정에서 확인해 주세요.</p>';}
  finally{body.setAttribute('aria-busy','false');}
 }));
}
function calendarOptions(d,code){
 return {teamCode:code,teamUrl:teamCode=>href('team',{team:teamCode}),mark:teamLogo,
  scheduleUrl:date=>code?href('team',{team:code,date})+'#team-date-'+date:href('schedule',{date})};
}
function enhanceTeamCalendar(d=current){
 if(!enabled(d))return;
 const root=q('[data-kvl-component="team-results"]'),list=root&&q('.kvl1180-schedule-list',root),params=new URLSearchParams(location.search),code=params.get('team');
 if(!list||!code||q('[data-dv2-team-calendar]',root))return;
 const selected=d.participants.find(t=>t.code===code);if(!selected)return;
 const matches=d.matches.filter(m=>[m.home.code,m.away.code].includes(code));
 const section=document.createElement('section');section.className='dv2-team-calendar';section.dataset.dv2TeamCalendar=code;section.innerHTML=heading(selected.name+' 경기 일정')+'<div class="dv2-calendar" data-dv2-team-month></div>';list.before(section);
 window.KVLMatchCalendarV1?.mount(q('[data-dv2-team-month]',section),d,{...calendarOptions(d,code),records:matches});
 const details=document.createElement('details');details.className='dv2-team-match-list';details.open=true;details.innerHTML='<summary>전체 '+matches.length+'경기 목록</summary>';list.before(details);details.append(list);
 if(params.has('date')){details.open=true;requestAnimationFrame(()=>q('#team-date-'+CSS.escape(params.get('date')),details)?.scrollIntoView({block:'start'}));}
}
function enhanceParticipants(){
 if(!enabled(current))return;
 const root=q('[data-kvl-component="participants"]');if(!root||q('.dv2-participant-search',root.parentElement))return;
 const grouped=current.structure.participants?.mode==='groups'&&(current.participants||[]).some(t=>t.group);
 const searchLabels=current.structure.participants?.searchLabels||{},unit=current.structure.overviewMetrics?.teamUnit||'팀';
 const toolbar=document.createElement('div');toolbar.className='dv2-participant-search';toolbar.innerHTML=`<input type="search" aria-label="${esc(searchLabels.label||'참가학교 검색')}" placeholder="${esc(searchLabels.placeholder||'학교명 검색')}"><span>${esc(searchLabels.sortNote||(grouped?'조별 구분 · 조 안에서 가나다순':'학교명 가나다순'))}</span>`;root.before(toolbar);
 const groups=qa('.kvl1180-participant-group',root);
 groups.sort((a,b)=>q('header strong',a).textContent.localeCompare(q('header strong',b).textContent,'ko',{numeric:true})).forEach(g=>g.parentElement.append(g));
 if(!grouped)root.classList.add('dv2-flat-participants');
 const empty=document.createElement('p');empty.className='dv2-empty';empty.textContent=searchLabels.emptyMessage||'검색한 학교가 없습니다.';empty.hidden=true;root.after(empty);
 q('input',toolbar).addEventListener('input',event=>{
  const search=event.target.value.trim();let found=0;
  for(const group of groups){const cards=qa('[data-team-code]',group);let count=0;for(const card of cards){const show=card.textContent.includes(search);card.hidden=!show;if(show)count++;}group.hidden=!count;found+=count;q('header span',group).textContent=count===cards.length?`${count}${unit}`:`검색 결과 ${count} / ${cards.length}${unit}`;}
  const selected=q('.kvl1180-participant-button.is-active',root),roster=q('[data-kvl-component="roster"]');if(roster&&selected)roster.hidden=selected.hidden;
  empty.hidden=found>0;
 });
}
function enhanceTrophies(){
 qa('#knockout [data-final-rank]').forEach(card=>{
  const rank=q('.kvl1180-final-rank',card);if(!rank||q('.dv2-trophy',rank))return;
  if(international(current)&&Number(card.dataset.finalRank)>3){q('.kvl-final-medal',rank)?.remove();return;}
  const medal=q('.kvl-final-medal',rank);
  if(medal)medal.innerHTML=trophy(card.dataset.finalRank);
  else rank.insertAdjacentHTML('afterbegin',`<span class="kvl-final-medal">${trophy(card.dataset.finalRank)}</span>`);
 });
}
function apply(d){
 if(!enabled(d))return false;
 current=d;document.body.dataset.kvlPresentation=d.structure.presentation;document.body.classList.add('kvl-domestic-home-v2');document.body.classList.toggle('kvl-pro-cup-domestic-v2',d.structure?.presentationCategory==='pro-cup');document.body.classList.toggle('kvl-pro-league-domestic-v2',d.structure?.presentationCategory==='pro-league');enhanceTrophies();
 document.body.dataset.domesticHero=d.structure.heroPresentation==='preserve'?'preserve':'domestic';
 const school=d.structure.audience==='school',division=d.structure.divisionLabel||(d.gender==='women'?'여대부':'남대부');
 const main=q('[data-kvl-shell]');if(main.dataset.domesticHomeReady)return true;main.dataset.domesticHomeReady='true';
 if(d.competitionFamily==='domestic'&&/^KVL-COMP-UNIV-/.test(d.competitionId||'')){
  const hero=q('.kvl1180-hero',main),hub=d.structure.hubUrl||'university-competitions.html';
  hero.classList.add('dv2-hero-with-list');
  hero.insertAdjacentHTML('beforeend',`<a class="dv2-hero-list" href="${esc(hub)}" aria-label="대학배구 대회 목록">대회 목록 <span aria-hidden="true">↗</span></a>`);
 }
 if(d.structure.heroPresentation!=='preserve'){
 const title=d.structure.heroTitle||d.displayName.replace(/\s+(남대부|여대부|남고부|여고부|남중부|여중부)$/,''),split=title.lastIndexOf(' ');
 q('[data-kvl="title"]').innerHTML=split>0?esc(title.slice(0,split))+'<br><em>'+esc(title.slice(split+1))+'</em>':esc(title);
 q('[data-kvl="eyebrow"]').textContent=d.structure.eyebrow||(school?'KVL DOMESTIC · SCHOOL VOLLEYBALL':'KVL DOMESTIC · UNIVERSITY VOLLEYBALL');
 q('[data-kvl="official-name"]').textContent=d.structure.heroTagline||'경기부터 기록까지, 대회의 모든 순간을 한눈에.';
 q('.kvl1180-hero-meta').append(q('.kvl1180-hero-status'));
 }
 const labels={overview:'대회 한눈에',schedule:'경기 일정·결과',groups:d.structure?.labels?.groupsTab||'조별순위',knockout:d.structure?.labels?.knockoutTab||'최종순위',rosters:d.structure?.labels?.rostersTab||label(d),resources:'공식자료'};
 qa('.kvl1180-tabs a').forEach(a=>{a.innerHTML=icon(a.dataset.view)+'<span>'+esc(labels[a.dataset.view])+'</span>';});
 for(const view of d.structure.hiddenViews||[]){q(`.kvl1180-tabs a[data-view="${view}"]`)?.remove();const section=q(`.kvl1180-view[data-view="${view}"]`);if(section){section.hidden=true;section.dataset.kvlEmpty='true';}}
 const gender=q('.kvl1180-gender');gender.insertAdjacentHTML('beforebegin','<span class="dv2-division-label">참가 부문</span>');
 if(!school&&!d.divisionLinks?.length){const pro=d.competitionFamily==='pro'||international(d);q('[data-gender-link="men"]').textContent=pro?'남자부':'남대부';q('[data-gender-link="women"]').textContent=pro?'여자부':'여대부';}
 const overview=q('.kvl1180-view[data-view="overview"]'),pools=(d.standings?.pools||[]).length,singleLeague=d.structure?.standings?.mode==='single-league';
 const arenas=[...new Set((d.matches||[]).map(m=>String(m.venueLabel||'').trim()).filter(Boolean))];
 const singleVenue=arenas.length===1;
 const venueTitle=singleVenue?(d.venueSecondary||arenas[0]):(d.venuePrimary||d.locationLabel||'경기장');
 const venueSupplement=singleVenue?(d.venuePrimary||d.locationLabel||''):(d.venueSecondary||d.venueLabel||'');
 const metrics=d.structure.overviewMetrics||{},teamUnit=metrics.teamUnit||'팀';
 const thirdMetric=overviewStandingMetric(d)||(metrics.third==='qualifiers'
  ?metric(d.structure.labels?.knockoutKpi||'결선 진출',d.knockoutTeamCount??'미정',teamUnit,'knockout')
  :metric(singleLeague?(d.structure.labels?.groupsTab||'리그순위'):pools?'예선 조 편성':'최종순위',singleLeague?d.participants.length:pools||d.finalRanking.length,pools?'개 조':'팀',singleLeague||pools?'groups':'knockout'));
 overview.innerHTML=`${heading('대회 한눈에 보기')}<p class="dv2-subtitle">${esc(division)} · ${d.status==='completed'?'대회 종료':'대회 기록'}</p><div class="dv2-metrics">${metric(label(d),d.participants.length,teamUnit,'rosters')}${metric(metrics.scheduleLabel||'등록 경기',d.matches.length,'경기','schedule')}${thirdMetric}<div class="dv2-metric dv2-venue"><span class="dv2-metric-icon">${metricIcon('venue')}</span><span><small>대회 장소</small><strong>${esc(venueTitle)}</strong><small>${esc(venueSupplement)}</small></span></div></div>`;
 if(d.recordNote)overview.insertAdjacentHTML('beforeend',`<p class="dv2-record-note">${esc(d.recordNote)}</p>`);
 const calendarSection=q('[data-kvl-section="calendar"]');calendarSection.classList.add('dv2-calendar-section');calendarSection.innerHTML=heading('대회 일정','schedule','전체 일정·결과')+'<div class="dv2-calendar" data-dv2-calendar></div>';
 const overviewGrid=document.createElement('div');overviewGrid.className='dv2-overview-grid kvl1180-view';overviewGrid.dataset.view='overview';overview.after(overviewGrid);overviewGrid.append(calendarSection);overviewGrid.insertAdjacentHTML('beforeend',`<section class="dv2-ranking-section">${overviewSummary(d)}</section>`);
 const extra=document.createElement('section');extra.className='dv2-overview-teams kvl1180-view';extra.dataset.view='overview';extra.innerHTML=overviewTeams(d);overviewGrid.after(extra);
 overviewMatches(d,extra);
 const qualifications=q('[data-kvl-section="qualifications"]');if(qualifications){if(d.structure.meaningPlacement==='before-calendar')overview.after(qualifications);else extra.after(qualifications);}
 if(international(d)){
  const groupHeading=q('.kvl1180-combined-head>div>.label'),groupNote=q('.kvl1180-combined-head>p');
  if(groupHeading)groupHeading.textContent=d.structure.labels?.standingsEyebrow||'STANDINGS';
  if(groupNote)groupNote.textContent=d.standingsNote||'';
 }
 window.KVLMatchCalendarV1?.mount(q('[data-dv2-calendar]'),d,calendarOptions(d));
 enhanceParticipants();enhanceTeamCalendar(d);window.KVLCompetitionTemplateV2.applyView();return true;
}
document.addEventListener('keydown',event=>{if(enabled(current)&&event.key===' '&&event.target.matches('.dv2-metric[href]')){event.preventDefault();event.target.click();}});
window.addEventListener('popstate',()=>{if(enabled(current)){q('.dv2-participant-search')?.remove();q('#rosters>.dv2-empty')?.remove();enhanceParticipants();enhanceTrophies();}});
window.KVLDomesticHomeV2={apply,selectOverviewMatches,selectOverviewStanding,enhanceTeamCalendar,get matchesReady(){return matchesReady;}};
})();

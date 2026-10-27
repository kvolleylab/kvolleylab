/* Domestic Template v2 presentation. Data, standings, brackets and roster routes stay in the shared engine. */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={overview:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',schedule:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h2M14 15h2"/>',groups:'<path d="M4 21V12h4v9M10 21V4h4v17M16 21v-8h4v8M2 21h20"/>',knockout:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 15v5M8 21h8"/>',rosters:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5v2"/>',resources:'<path d="M5 3h9l5 5v13H5V3ZM14 3v6h5M8 13h8M8 17h6"/>',venue:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'};
const icon=key=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]||icons.overview}</svg>`;
const trophy=rank=>`<span class="dv2-trophy trophy-${Number(rank)}" aria-hidden="true"><svg viewBox="0 0 28 30" width="28" height="30"><path class="trophy-handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path class="trophy-cup" d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="trophy-shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path class="trophy-stem" d="M12 18h4v6h-4z"/><path class="trophy-base" d="M9 24h10l2 3H7z"/></svg></span>`;
const href=(view,extra)=>window.KVLCompetitionTemplateV2.viewUrl(view,extra);
let current,month,months=[];
const enabled=d=>['domestic','pro'].includes(d?.competitionFamily)&&d.structure?.presentation==='domestic-home-v2';
const label=d=>d.structure?.labels?.participantsTitle||'참가팀';
const team=code=>(current.participants||[]).find(t=>t.code===code)||{code,name:code||'미정'};
const teamLogo=t=>t.logo?`<img src="${esc(t.logo)}" alt="" loading="lazy">`:`<span class="dv2-team-mark">${esc((t.name||'미정').replace(/대학교|대$/g,'').slice(0,2))}</span>`;
const teamHref=t=>current.structure?.participants?.linkMode==='team-roster'?href('rosters',{team:t.code})+'#team-roster':current.structure?.participants?.linkMode==='team-results'?href('team',{team:t.code}):'university-team.html?school='+encodeURIComponent(t.fullName||t.name);
const teamTile=t=>`<a class="dv2-team-tile" href="${esc(teamHref(t))}">${teamLogo(t)}<b>${esc(t.name)}</b><small>${esc(t.region||(current.structure?.participants?.mode==='groups'&&t.group?String(t.group).replace(/조$/,'')+'조':label(current)))}</small></a>`;
function heading(title,view,action='전체보기'){return `<div class="dv2-heading"><h2>${esc(title)}</h2>${view?`<a href="${esc(href(view))}">${esc(action)} ›</a>`:''}</div>`;}
function metric(title,value,unit,view,key){return `<a class="dv2-metric" href="${esc(href(view))}"><span class="dv2-metric-icon">${icon(key||view)}</span><span><small>${esc(title)}</small><strong>${esc(value)}<em>${esc(unit)}</em></strong></span><b class="dv2-arrow" aria-hidden="true">›</b></a>`;}
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
 return heading(summary.title||'대회 안내')+`<dl class="dv2-overview-summary">${(summary.items||[]).map(item=>`<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('')}</dl>`;
}
function initialCalendarMonth(d,dates){
 const today=new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10); // Korea Standard Time
 const lastMatch=(d.matches||[]).map(m=>m.date).filter(Boolean).sort().at(-1);
 if(!dates.length)return undefined;
 if(d.status==='completed'||today>dates.at(-1))return (lastMatch||dates.at(-1)).slice(0,7);
 const thisMonth=today.slice(0,7);return months.includes(thisMonth)?thisMonth:months[0];
}
function calendar(){
 const root=q('[data-dv2-calendar]');if(!root)return;
 if(!months.length){root.innerHTML='<div class="dv2-empty">공식 일정 발표 후 표시합니다.</div>';return;}
 const [year,mo]=month.split('-').map(Number),offset=new Date(Date.UTC(year,mo-1,1)).getUTCDay(),days=new Date(Date.UTC(year,mo,0)).getUTCDate(),cells=[];
 for(let i=0;i<Math.ceil((offset+days)/7)*7;i++){
  const date=new Date(Date.UTC(year,mo-1,i-offset+1)),key=date.toISOString().slice(0,10),games=(current.matches||[]).filter(m=>m.date===key),outside=date.getUTCMonth()!==mo-1,final=games.some(m=>m.round==='FINAL'||m.stage==='결승');
  const content=`<span>${date.getUTCDate()}</span>${games.length?`<small>${final?'결승 · ':''}${games.length}<em>경기</em></small>`:''}`;
  cells.push(games.length?`<button type="button" class="dv2-day has-match${outside?' outside':''}${final?' final':''}" data-dv2-date="${key}" aria-label="${key}, ${games.length}경기${final?', 결승':''}">${content}</button>`:`<div class="dv2-day${outside?' outside':''}">${content}</div>`);
 }
 root.innerHTML=`<div class="dv2-calendar-top"><small>TOURNAMENT CALENDAR</small><h3><span class="dv2-calendar-year">${year}<em>년</em></span><span class="dv2-calendar-month">${String(mo).padStart(2,'0')}<em>월</em></span></h3><div class="dv2-calendar-controls"><button data-dv2-month="-1" aria-label="이전 달" ${month===months[0]?'disabled':''}>‹</button><button data-dv2-month="1" aria-label="다음 달" ${month===months.at(-1)?'disabled':''}>›</button></div></div><div class="dv2-week">${['일','월','화','수','목','금','토'].map(w=>`<span>${w}</span>`).join('')}</div><div class="dv2-calendar-grid">${cells.join('')}</div><p class="dv2-calendar-hint">경기일을 선택하면 대진과 세트별 점수를 볼 수 있습니다.</p>`;
}
function openDay(date){
 const dialog=q('#dv2-day-dialog'),games=(current.matches||[]).filter(m=>m.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
 q('#dv2-day-title',dialog).textContent=date.replaceAll('-','.')+' · '+games.length+'경기';
 q('.dv2-day-matches',dialog).innerHTML=games.map(m=>{
  const home=team(m.home.code),away=team(m.away.code),s=m.score,scored=s&&Number.isFinite(s.home)&&Number.isFinite(s.away);
  return `<article class="dv2-day-match"><div class="dv2-match-meta"><b>${esc(m.stage||'경기')}${m.pool?' · '+esc(m.pool)+'조':''}</b><span>${esc(m.time||'시간 미정')} KST</span></div><div class="dv2-match-teams"><a href="${esc(href('team',{team:home.code}))}">${teamLogo(home)}<b>${esc(home.name)}</b></a><strong>${scored?s.home+' : '+s.away:'VS'}</strong><a href="${esc(href('team',{team:away.code}))}">${teamLogo(away)}<b>${esc(away.name)}</b></a></div><div class="dv2-setline">${(m.reportedSets||s?.sets||[]).map((set,i)=>`<span title="${i+1}세트">${esc(set.home)}-${esc(set.away)}</span>`).join('')||'세트별 득점 확인 중'}</div>${m.scoreNote?`<p class="kvl-score-note">${esc(m.scoreNote)}</p>`:''}<small class="dv2-match-venue">${esc(m.venueLabel||current.venueLabel||'')}</small></article>`;
 }).join('');
 q('.dv2-day-schedule',dialog).href=href('schedule',{date});dialog.showModal();
}
function enhanceParticipants(){
 if(!enabled(current))return;
 const root=q('[data-kvl-component="participants"]');if(!root||q('.dv2-participant-search',root.parentElement))return;
 const grouped=current.structure.participants?.mode==='groups'&&(current.participants||[]).some(t=>t.group);
 const searchLabels=current.structure.participants?.searchLabels||{};
 const toolbar=document.createElement('div');toolbar.className='dv2-participant-search';toolbar.innerHTML=`<input type="search" aria-label="${esc(searchLabels.label||'참가학교 검색')}" placeholder="${esc(searchLabels.placeholder||'학교명 검색')}"><span>${esc(searchLabels.sortNote||(grouped?'조별 구분 · 조 안에서 가나다순':'학교명 가나다순'))}</span>`;root.before(toolbar);
 const groups=qa('.kvl1180-participant-group',root);
 groups.sort((a,b)=>q('header strong',a).textContent.localeCompare(q('header strong',b).textContent,'ko',{numeric:true})).forEach(g=>g.parentElement.append(g));
 if(!grouped)root.classList.add('dv2-flat-participants');
 const empty=document.createElement('p');empty.className='dv2-empty';empty.textContent=searchLabels.emptyMessage||'검색한 학교가 없습니다.';empty.hidden=true;root.after(empty);
 q('input',toolbar).addEventListener('input',event=>{
  const search=event.target.value.trim();let found=0;
  for(const group of groups){const cards=qa('[data-team-code]',group);let count=0;for(const card of cards){const show=card.textContent.includes(search);card.hidden=!show;if(show)count++;}group.hidden=!count;found+=count;q('header span',group).textContent=count===cards.length?`${count}팀`:`검색 결과 ${count} / ${cards.length}팀`;}
  const selected=q('.kvl1180-participant-button.is-active',root),roster=q('[data-kvl-component="roster"]');if(roster&&selected)roster.hidden=selected.hidden;
  empty.hidden=found>0;
 });
}
function enhanceTrophies(){
 qa('#knockout [data-final-rank]').forEach(card=>{
  const rank=q('.kvl1180-final-rank',card);if(!rank||q('.dv2-trophy',rank))return;
  const medal=q('.kvl-final-medal',rank);
  if(medal)medal.innerHTML=trophy(card.dataset.finalRank);
  else rank.insertAdjacentHTML('afterbegin',`<span class="kvl-final-medal">${trophy(card.dataset.finalRank)}</span>`);
 });
}
function apply(d){
 if(!enabled(d))return false;
 current=d;document.body.classList.add('kvl-domestic-home-v2');document.body.classList.toggle('kvl-pro-cup-domestic-v2',d.structure?.presentationCategory==='pro-cup');document.body.classList.toggle('kvl-pro-league-domestic-v2',d.structure?.presentationCategory==='pro-league');enhanceTrophies();
 const school=d.structure.audience==='school',division=d.structure.divisionLabel||(d.gender==='women'?'여대부':'남대부');
 const main=q('[data-kvl-shell]');if(main.dataset.domesticHomeReady)return true;main.dataset.domesticHomeReady='true';
 const hub=d.structure.hubUrl||(school?'domestic-competitions.html?division=school':'university-competitions.html');
 main.insertAdjacentHTML('afterbegin',`<div class="dv2-utility"><span><a href="index.html">홈</a> › <a href="${esc(hub)}">${esc(d.structure.hubCategoryLabel||'국내대회')} · ${esc(d.structure.hubLabel||(school?'중·고 배구':'대학배구'))}</a></span><a href="${esc(hub)}">대회 목록 ↗</a></div>`);
 const title=d.structure.heroTitle||d.displayName.replace(/\s+(남대부|여대부|남고부|여고부|남중부|여중부)$/,''),split=title.lastIndexOf(' ');
 q('[data-kvl="title"]').innerHTML=split>0?esc(title.slice(0,split))+'<br><em>'+esc(title.slice(split+1))+'</em>':esc(title);
 q('[data-kvl="eyebrow"]').textContent=d.structure.eyebrow||(school?'KVL DOMESTIC · SCHOOL VOLLEYBALL':'KVL DOMESTIC · UNIVERSITY VOLLEYBALL');
 q('[data-kvl="official-name"]').textContent=d.structure.heroTagline||'경기부터 기록까지, 대회의 모든 순간을 한눈에.';
 q('.kvl1180-hero-meta').append(q('.kvl1180-hero-status'));
 const labels={overview:'대회 한눈에',schedule:'경기 일정·결과',groups:d.structure?.labels?.groupsTab||'조별순위',knockout:d.structure?.labels?.knockoutTab||'최종순위',rosters:label(d),resources:'공식자료'};
 qa('.kvl1180-tabs a').forEach(a=>{a.innerHTML=icon(a.dataset.view)+'<span>'+esc(labels[a.dataset.view])+'</span>';});
 for(const view of d.structure.hiddenViews||[]){q(`.kvl1180-tabs a[data-view="${view}"]`)?.remove();const section=q(`.kvl1180-view[data-view="${view}"]`);if(section){section.hidden=true;section.dataset.kvlEmpty='true';}}
 const gender=q('.kvl1180-gender');gender.insertAdjacentHTML('beforebegin','<span class="dv2-division-label">참가 부문</span>');
 if(!school&&!d.divisionLinks?.length){const pro=d.competitionFamily==='pro';q('[data-gender-link="men"]').textContent=pro?'남자부':'남대부';q('[data-gender-link="women"]').textContent=pro?'여자부':'여대부';}
 const overview=q('.kvl1180-view[data-view="overview"]'),pools=(d.standings?.pools||[]).length,singleLeague=d.structure?.standings?.mode==='single-league';
 const arenas=[...new Set((d.matches||[]).map(m=>String(m.venueLabel||'').trim()).filter(Boolean))];
 const singleVenue=arenas.length===1;
 const venueTitle=singleVenue?(d.venueSecondary||arenas[0]):(d.venuePrimary||d.locationLabel||'경기장');
 const venueSupplement=singleVenue?(d.venuePrimary||d.locationLabel||''):(d.venueSecondary||d.venueLabel||'');
 overview.innerHTML=`${heading('대회 한눈에 보기')}<p class="dv2-subtitle">${esc(division)} · ${d.status==='completed'?'대회 종료':'대회 기록'}</p><div class="dv2-metrics">${metric(label(d),d.participants.length,'팀','rosters')}${metric('등록 경기',d.matches.length,'경기','schedule')}${metric(singleLeague?(d.structure.labels?.groupsTab||'리그순위'):pools?'예선 조 편성':'최종순위',singleLeague?d.participants.length:pools||d.finalRanking.length,pools?'개 조':'팀',singleLeague||pools?'groups':'knockout')}<div class="dv2-metric dv2-venue"><span class="dv2-metric-icon">${icon('venue')}</span><span><small>대회 장소</small><strong>${esc(venueTitle)}</strong><small>${esc(venueSupplement)}</small></span></div></div>`;
 if(d.recordNote)overview.insertAdjacentHTML('beforeend',`<p class="dv2-record-note">${esc(d.recordNote)}</p>`);
 const calendarSection=q('[data-kvl-section="calendar"]');calendarSection.classList.add('dv2-calendar-section');calendarSection.innerHTML=heading('대회 일정','schedule','전체 일정·결과')+'<div class="dv2-calendar" data-dv2-calendar></div>';
 const overviewGrid=document.createElement('div');overviewGrid.className='dv2-overview-grid kvl1180-view';overviewGrid.dataset.view='overview';overview.after(overviewGrid);overviewGrid.append(calendarSection);overviewGrid.insertAdjacentHTML('beforeend',`<section class="dv2-ranking-section">${overviewSummary(d)}</section>`);
 const extra=document.createElement('section');extra.className='dv2-overview-teams kvl1180-view';extra.dataset.view='overview';extra.innerHTML=heading(label(d),'rosters',`${d.participants.length}팀 전체보기`)+`<div class="dv2-team-strip">${[...d.participants].sort((a,b)=>a.name.localeCompare(b.name,'ko')).slice(0,d.structure?.overviewTeamCount||6).map(teamTile).join('')}</div>`;overviewGrid.after(extra);
 const qualifications=q('[data-kvl-section="qualifications"]');if(qualifications)extra.after(qualifications);
 const dates=[...(d.dateLabel?.match(/\d{4}-\d{2}-\d{2}/g)||[]),...d.matches.map(m=>m.date).filter(Boolean)].sort();
 months=[];if(dates.length){const start=dates[0].slice(0,7),end=dates.at(-1).slice(0,7);let cursor=start;while(cursor<=end&&months.length<24){months.push(cursor);const [y,m]=cursor.split('-').map(Number);cursor=new Date(Date.UTC(y,m,1)).toISOString().slice(0,7);}}month=initialCalendarMonth(d,dates);calendar();
 document.body.insertAdjacentHTML('beforeend','<dialog id="dv2-day-dialog" aria-labelledby="dv2-day-title"><div class="dv2-dialog-heading"><h2 id="dv2-day-title"></h2><button type="button" data-dv2-close aria-label="상세 창 닫기">×</button></div><div class="dv2-day-matches"></div><a class="dv2-day-schedule" href="#">이 날짜 경기 일정·결과 보기 ›</a></dialog>');
 const dialog=q('#dv2-day-dialog');dialog.addEventListener('click',event=>{if(event.target.closest('[data-dv2-close]')||event.target===dialog)dialog.close();});
 enhanceParticipants();window.KVLCompetitionTemplateV2.applyView();return true;
}
document.addEventListener('click',event=>{
 if(!enabled(current))return;const move=event.target.closest('[data-dv2-month]'),day=event.target.closest('[data-dv2-date]');
 if(move&&!move.disabled){month=months[months.indexOf(month)+Number(move.dataset.dv2Month)];calendar();}
 if(day)openDay(day.dataset.dv2Date);
});
document.addEventListener('keydown',event=>{if(enabled(current)&&event.key===' '&&event.target.matches('.dv2-metric[href]')){event.preventDefault();event.target.click();}});
window.addEventListener('popstate',()=>{if(enabled(current)){q('.dv2-participant-search')?.remove();q('#rosters>.dv2-empty')?.remove();enhanceParticipants();enhanceTrophies();}});
window.KVLDomesticHomeV2={apply};
})();

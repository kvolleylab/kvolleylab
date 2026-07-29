(()=>{
const COMPETITION_URL='data/competitions/gosung-2026.json';
const PLAYER_URL='data/master/player_master_229_v2.json';
const BRAND_URL='data/master/university_brand_sources_2026.json';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const schoolName=p=>p.current_roster?.school_name||String(p.current_roster?.team_name||'').replace(' 남자배구부','');
const schoolCode=p=>p.current_roster?.school_code||schoolName(p);
const shortName=n=>String(n||'').replace('국립목포대학교','목포대').replace('경상국립대학교','경상국립대').replace('국립','').replace('대학교','대');
const initials=n=>shortName(n).replace('대','').slice(0,2);
let competition,players=[],brands={teams:{}},division='남대부',stageFilter='전체';
const params=new URLSearchParams(location.search);
const view=params.get('view')||'overview';

function activateView(){
 document.querySelectorAll('.cd-view').forEach(section=>section.classList.toggle('is-active',section.id===view));
 document.querySelectorAll('.cd-jump a').forEach(a=>a.classList.toggle('is-active',a.dataset.view===view));
}
function renderMeta(){
 $('cdTitle').textContent=competition.name;
 $('cdMeta').textContent=`${competition.dates.start} ~ ${competition.dates.end} · ${competition.location} · ${competition.venues.join(' / ')}`;
 $('cdMatchCount').textContent=competition.summary.totalMatches;
 $('cdUpdatedAt').textContent=`최종 업데이트 ${competition.updatedAt}`;
}
function renderKpis(){
 const schools=new Set(players.map(schoolCode).filter(Boolean));
 const heights=players.map(p=>Number(p.physical?.height_cm)).filter(Boolean);
 $('cdTeamCount').textContent=schools.size;
 $('cdPlayerCount').textContent=players.length;
 $('cdAvgHeight').textContent=heights.length?(heights.reduce((a,b)=>a+b,0)/heights.length).toFixed(1):'-';
}
function score(g){return String(g.score||'0-0').split('-').map(Number)}
function winner(g){const[a,b]=score(g);return a>b?g.teamA:g.teamB}
function ratio(won,lost){return lost===0?(won>0?999:0):won/lost}
function brandFor(code,name){return brands.teams?.[code]||Object.values(brands.teams||{}).find(x=>x.school_name===name)||null}
function teamInfo(label){
 const p=players.find(x=>shortName(schoolName(x))===label||schoolName(x)===label);
 return p?{code:schoolCode(p),name:schoolName(p),label}:{code:'',name:label,label};
}
function logoHtml(label,cls='cd-inline-logo'){
 const t=teamInfo(label),brand=brandFor(t.code,t.name);
 if(brand?.status==='asset_ready'&&brand.asset_path)return `<span class="${cls}"><img src="${esc(brand.asset_path)}" alt="${esc(label)} 로고" loading="lazy" onerror="this.parentElement.textContent='${esc(initials(label))}'"></span>`;
 return `<span class="${cls}"><b>${esc(initials(label))}</b></span>`;
}
function renderCalendar(){
 const all=competition.games||[],byDate=all.reduce((m,g)=>{(m[g.date]??=[]).push(g);return m},{});
 const start=new Date(`${competition.dates.start}T00:00:00`),end=new Date(`${competition.dates.end}T00:00:00`);
 const month=new Date(start.getFullYear(),start.getMonth(),1),last=new Date(end.getFullYear(),end.getMonth()+1,0);
 const cells=[];for(let i=0;i<month.getDay();i++)cells.push('<div class="cd-cal-cell is-empty"></div>');
 for(let d=1;d<=last.getDate();d++){
  const date=`${last.getFullYear()}-${String(last.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const games=byDate[date]||[],active=date>=competition.dates.start&&date<=competition.dates.end;
  cells.push(`<a class="cd-cal-cell ${active?'is-tournament':''} ${games.length?'has-games':''}" href="university-competition.html?view=results" title="${esc(date)} ${games.length}경기"><span>${d}</span>${games.length?`<strong>${games.length}경기</strong><small>${[...new Set(games.map(g=>g.stage))].join(' · ')}</small>`:''}</a>`);
 }
 $('cdCalendar').innerHTML=`<div class="cd-cal-title">${last.getFullYear()}년 ${last.getMonth()+1}월</div><div class="cd-cal-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="cd-cal-grid">${cells.join('')}</div>`;
}
function renderStageFilters(list){
 const stages=['전체',...new Set(list.map(g=>g.stage).filter(Boolean))];
 if(!stages.includes(stageFilter))stageFilter='전체';
 $('cdStageFilters').innerHTML=stages.map(stage=>`<button type="button" class="${stage===stageFilter?'is-active':''}" data-stage="${esc(stage)}">${esc(stage)}</button>`).join('');
 $('cdStageFilters').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{stageFilter=btn.dataset.stage;renderResults()}));
}
function renderResults(){
 const all=competition.games.filter(g=>g.division===division);renderStageFilters(all);
 const list=stageFilter==='전체'?all:all.filter(g=>g.stage===stageFilter);
 $('cdResultSummary').textContent=`${division} ${list.length}경기 · ${stageFilter==='전체'?'전체 단계':stageFilter}`;
 const groups=list.reduce((m,g)=>{(m[g.date]??=[]).push(g);return m},{});
 $('cdResults').innerHTML=Object.entries(groups).map(([date,games])=>`<section class="cd-date-group"><div class="cd-date-head"><span>${esc(date)}</span><span>${games.length}경기</span></div>${games.map(g=>{const w=winner(g);return `<article class="cd-match"><div class="cd-match-meta"><time>${esc(g.time)}</time><span>${esc(g.stage)}${g.pool?` · ${esc(g.pool)}조`:''}</span></div><div class="cd-match-board"><div class="cd-side is-left"><strong class="${w===g.teamA?'cd-winner':''}">${esc(g.teamA)}</strong>${logoHtml(g.teamA)}</div><b class="cd-score">${esc(g.score)}</b><div class="cd-side is-right">${logoHtml(g.teamB)}<strong class="${w===g.teamB?'cd-winner':''}">${esc(g.teamB)}</strong></div></div><div class="cd-set-scores">${(g.sets||[]).map(s=>`<span>${esc(s)}</span>`).join('')}</div></article>`}).join('')}</section>`).join('')||'<div class="cd-empty">선택한 단계의 경기결과가 없습니다.</div>';
}
function renderStandings(){
 const prelim=competition.games.filter(g=>g.division===division&&g.pool),pools=[...new Set(prelim.map(g=>g.pool))].sort();
 if(!pools.length){$('cdGroupStandings').innerHTML='<div class="cd-empty">조별리그 순위 데이터가 없습니다.</div>';return}
 $('cdGroupStandings').innerHTML=pools.map(pool=>{const games=prelim.filter(g=>g.pool===pool),table=new Map();const row=team=>{if(!table.has(team))table.set(team,{team,played:0,wins:0,losses:0,setsWon:0,setsLost:0});return table.get(team)};games.forEach(g=>{const[a,b]=score(g),ra=row(g.teamA),rb=row(g.teamB);ra.played++;rb.played++;ra.setsWon+=a;ra.setsLost+=b;rb.setsWon+=b;rb.setsLost+=a;if(a>b){ra.wins++;rb.losses++}else{rb.wins++;ra.losses++}});const rows=[...table.values()].sort((a,b)=>b.wins-a.wins||ratio(b.setsWon,b.setsLost)-ratio(a.setsWon,a.setsLost)||a.team.localeCompare(b.team));return `<article class="cd-standing-card"><h3>${esc(pool)}조</h3><div class="cd-standing-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>세트득실률</span></div>${rows.map((r,i)=>`<div class="cd-standing-row"><strong>${i+1}</strong><span>${esc(r.team)}</span><span>${r.played}</span><span>${r.wins}</span><span>${r.losses}</span><span>${r.setsLost===0?'∞':ratio(r.setsWon,r.setsLost).toFixed(3)}</span></div>`).join('')}</article>`}).join('');
 $('cdStandingNote').textContent=`${division} 조별리그 경기결과를 승수·세트득실률 순으로 정리한 참고 순위입니다.`;
}
function renderPodium(){
 const medal={1:'🥇',2:'🥈',3:'🥉'};
 $('cdPodium').innerHTML=(competition.podium[division]||[]).map(x=>`<article class="cd-rank rank-${x.rank}"><span class="cd-medal" aria-hidden="true">${medal[x.rank]||'🏅'}</span><strong>${x.rank}위</strong>${logoHtml(x.team,'cd-podium-logo')}<h3>${esc(x.team)}</h3></article>`).join('');
}
function markHtml(team){const brand=brandFor(team.code,team.name);if(brand?.status==='asset_ready'&&brand.asset_path)return `<span class="cd-team-mark cd-team-logo"><img src="${esc(brand.asset_path)}" alt="${esc(team.name)} 로고" loading="lazy" onerror="this.parentElement.textContent='${esc(initials(team.name))}'"></span>`;return `<span class="cd-team-mark">${esc(initials(team.name))}</span>`}
function renderTeams(){const map=new Map();players.forEach(p=>{const code=schoolCode(p),name=schoolName(p);if(!code||!name)return;if(!map.has(code))map.set(code,{code,name,count:0});map.get(code).count++});$('cdTeams').innerHTML=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<a class="cd-team-card" href="university-team.html?school=${encodeURIComponent(t.code)}">${markHtml(t)}<span><strong>${esc(shortName(t.name))}</strong><small>${t.count}명 등록</small></span></a>`).join('')}
function renderSources(){$('cdSources').innerHTML=competition.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} →</a>`).join('')}
document.querySelectorAll('.cd-tabs button').forEach(btn=>btn.addEventListener('click',()=>{division=btn.dataset.division;stageFilter='전체';document.querySelectorAll('.cd-tabs button').forEach(x=>x.classList.toggle('is-active',x===btn));renderResults();renderStandings();renderPodium()}));
Promise.all([fetch(COMPETITION_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),fetch(PLAYER_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),fetch(BRAND_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}).catch(()=>({teams:{}}))]).then(([c,p,b])=>{competition=c;players=p;brands=b;activateView();renderMeta();renderKpis();renderCalendar();renderResults();renderStandings();renderPodium();renderTeams();renderSources()}).catch(err=>{console.error(err);$('cdResults').innerHTML='<div class="cd-empty">대회 데이터를 불러오지 못했습니다.</div>'});
})();
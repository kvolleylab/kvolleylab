(()=>{
const COMPETITION_URL='data/competitions/gosung-2026.json';
const PLAYER_URL='data/master/player_master_229_v2.json';
const BRAND_URL='data/master/university_brand_sources_2026.json';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const schoolName=p=>p.current_roster?.school_name||String(p.current_roster?.team_name||'').replace(' 남자배구부','');
const schoolCode=p=>p.current_roster?.school_code||schoolName(p);
const shortName=n=>String(n).replace('국립','').replace('대학교','대');
const initials=n=>shortName(n).replace('대','').slice(0,2);
let competition,players=[],brands={teams:{}},division='남대부',stageFilter='전체';
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
function score(g){return String(g.score).split('-').map(Number)}
function winner(g){const [a,b]=score(g);return a>b?g.teamA:g.teamB}
function renderStageFilters(list){
 const stages=['전체',...new Set(list.map(g=>g.stage).filter(Boolean))];
 if(!stages.includes(stageFilter))stageFilter='전체';
 $('cdStageFilters').innerHTML=stages.map(stage=>`<button type="button" class="${stage===stageFilter?'is-active':''}" data-stage="${esc(stage)}">${esc(stage)}</button>`).join('');
 $('cdStageFilters').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{stageFilter=btn.dataset.stage;renderResults()}));
}
function renderResults(){
 const all=competition.games.filter(g=>g.division===division);
 renderStageFilters(all);
 const list=stageFilter==='전체'?all:all.filter(g=>g.stage===stageFilter);
 $('cdResultSummary').textContent=`${division} ${list.length}경기 · ${stageFilter==='전체'?'전체 단계':stageFilter}`;
 const groups=list.reduce((m,g)=>{(m[g.date]??=[]).push(g);return m},{});
 $('cdResults').innerHTML=Object.entries(groups).map(([date,games])=>`<section class="cd-date-group"><div class="cd-date-head"><span>${esc(date)}</span><span>${games.length}경기</span></div>${games.map(g=>{const w=winner(g);return`<article class="cd-match"><time>${esc(g.time)}</time><span class="cd-stage">${esc(g.stage)}${g.pool?` · ${esc(g.pool)}조`:''}</span><span class="cd-team ${w===g.teamA?'cd-winner':''}">${esc(g.teamA)}</span><strong class="cd-score">${esc(g.score)}</strong><span class="cd-team ${w===g.teamB?'cd-winner':''}">${esc(g.teamB)}</span></article>`}).join('')}</section>`).join('')||'<div class="cd-empty">선택한 단계의 경기결과가 없습니다.</div>';
 renderPodium();
 renderStandings();
}
function renderPodium(){$('cdPodium').innerHTML=competition.podium[division].map(x=>`<article class="cd-rank"><span>${x.rank===1?'CHAMPION':x.rank===2?'RUNNER-UP':'JOINT 3RD'} · ${x.rank}위</span><strong>${esc(x.team)}</strong></article>`).join('')}
function ratio(won,lost){return lost===0?(won>0?999:0):won/lost}
function renderStandings(){
 const prelim=competition.games.filter(g=>g.division===division&&g.pool);
 const pools=[...new Set(prelim.map(g=>g.pool))].sort();
 if(!pools.length){$('cdGroupStandings').innerHTML='<div class="cd-empty">조별리그 순위 데이터가 없습니다.</div>';return}
 $('cdGroupStandings').innerHTML=pools.map(pool=>{
  const games=prelim.filter(g=>g.pool===pool),table=new Map();
  const row=team=>{if(!table.has(team))table.set(team,{team,played:0,wins:0,losses:0,setsWon:0,setsLost:0});return table.get(team)};
  games.forEach(g=>{const [a,b]=score(g),ra=row(g.teamA),rb=row(g.teamB);ra.played++;rb.played++;ra.setsWon+=a;ra.setsLost+=b;rb.setsWon+=b;rb.setsLost+=a;if(a>b){ra.wins++;rb.losses++}else{rb.wins++;ra.losses++}});
  const rows=[...table.values()].sort((a,b)=>b.wins-a.wins||ratio(b.setsWon,b.setsLost)-ratio(a.setsWon,a.setsLost)||(b.setsWon-b.setsLost)-(a.setsWon-a.setsLost)||a.team.localeCompare(b.team));
  return`<article class="cd-standing-card"><h3>${esc(pool)}조</h3><div class="cd-standing-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>세트득실</span></div>${rows.map((r,i)=>`<div class="cd-standing-row"><strong>${i+1}</strong><span>${esc(r.team)}</span><span>${r.played}</span><span>${r.wins}</span><span>${r.losses}</span><span>${r.setsWon}-${r.setsLost}</span></div>`).join('')}</article>`;
 }).join('');
 $('cdStandingNote').textContent=`${division} 조별리그 경기결과를 승수·세트득실 순으로 정리한 참고 순위입니다.`;
}
function brandFor(code,name){
 const direct=brands.teams?.[code];
 if(direct)return direct;
 return Object.values(brands.teams||{}).find(x=>x.school_name===name)||null;
}
function markHtml(team){
 const brand=brandFor(team.code,team.name);
 if(brand?.status==='asset_ready'&&brand.asset_path){
  return `<span class="cd-team-mark cd-team-logo"><img src="${esc(brand.asset_path)}" alt="${esc(team.name)} 로고" loading="lazy" onerror="this.closest('.cd-team-mark').classList.remove('cd-team-logo');this.parentElement.textContent='${esc(initials(team.name))}'"></span>`;
 }
 const title=brand?.status==='source_verified'?'공식 출처 확인 완료 · 원본 파일 반영 대기':'공식 로고 확인 대기';
 return `<span class="cd-team-mark" title="${title}">${esc(initials(team.name))}</span>`;
}
function renderTeams(){
 const map=new Map();
 players.forEach(p=>{const code=schoolCode(p),name=schoolName(p);if(!code||!name)return;if(!map.has(code))map.set(code,{code,name,count:0});map.get(code).count++});
 $('cdTeams').innerHTML=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<a class="cd-team-card" href="university-team.html?school=${encodeURIComponent(t.code)}">${markHtml(t)}<span><strong>${esc(shortName(t.name))}</strong><small>${t.count}명 등록</small></span></a>`).join('');
}
function renderSources(){$('cdSources').innerHTML=competition.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} →</a>`).join('')}
document.querySelectorAll('.cd-tabs button').forEach(btn=>btn.addEventListener('click',()=>{division=btn.dataset.division;stageFilter='전체';document.querySelectorAll('.cd-tabs button').forEach(x=>x.classList.toggle('is-active',x===btn));renderResults()}));
Promise.all([
 fetch(COMPETITION_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
 fetch(PLAYER_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
 fetch(BRAND_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}).catch(()=>({teams:{}}))
]).then(([c,p,b])=>{competition=c;players=p;brands=b;renderMeta();renderKpis();renderResults();renderTeams();renderSources()}).catch(err=>{console.error(err);$('cdResults').innerHTML='<div class="cd-empty">대회 데이터를 불러오지 못했습니다.</div>'});
})();

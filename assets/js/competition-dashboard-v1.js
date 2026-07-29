(()=>{
const COMPETITION_URL='data/competitions/gosung-2026.json';
const PLAYER_URL='data/master/player_master_229_v2.json';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const schoolName=p=>p.current_roster?.school_name||String(p.current_roster?.team_name||'').replace(' 남자배구부','');
const schoolCode=p=>p.current_roster?.school_code||schoolName(p);
const shortName=n=>String(n).replace('국립','').replace('대학교','대');
const initials=n=>shortName(n).replace('대','').slice(0,2);
let competition,players=[],division='남대부';
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
function winner(g){const [a,b]=String(g.score).split('-').map(Number);return a>b?g.teamA:g.teamB}
function renderResults(){
 const list=competition.games.filter(g=>g.division===division);
 $('cdResultSummary').textContent=`${division} ${list.length}경기 · 공식 결과`;
 const groups=list.reduce((m,g)=>{(m[g.date]??=[]).push(g);return m},{});
 $('cdResults').innerHTML=Object.entries(groups).map(([date,games])=>`<section class="cd-date-group"><div class="cd-date-head"><span>${esc(date)}</span><span>${games.length}경기</span></div>${games.map(g=>{const w=winner(g);return`<article class="cd-match"><time>${esc(g.time)}</time><span class="cd-stage">${esc(g.stage)}${g.pool?` · ${esc(g.pool)}조`:''}</span><span class="cd-team ${w===g.teamA?'cd-winner':''}">${esc(g.teamA)}</span><strong class="cd-score">${esc(g.score)}</strong><span class="cd-team ${w===g.teamB?'cd-winner':''}">${esc(g.teamB)}</span></article>`}).join('')}</section>`).join('');
 renderPodium();
}
function renderPodium(){$('cdPodium').innerHTML=competition.podium[division].map(x=>`<article class="cd-rank"><span>${x.rank===1?'CHAMPION':x.rank===2?'RUNNER-UP':'JOINT 3RD'} · ${x.rank}위</span><strong>${esc(x.team)}</strong></article>`).join('')}
function renderTeams(){
 const map=new Map();
 players.forEach(p=>{const code=schoolCode(p),name=schoolName(p);if(!code||!name)return;if(!map.has(code))map.set(code,{code,name,count:0});map.get(code).count++});
 $('cdTeams').innerHTML=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<a class="cd-team-card" href="university-team.html?school=${encodeURIComponent(t.code)}"><span class="cd-team-mark">${esc(initials(t.name))}</span><span><strong>${esc(shortName(t.name))}</strong><small>${t.count}명 등록</small></span></a>`).join('');
}
function renderSources(){$('cdSources').innerHTML=competition.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} →</a>`).join('')}
document.querySelectorAll('.cd-tabs button').forEach(btn=>btn.addEventListener('click',()=>{division=btn.dataset.division;document.querySelectorAll('.cd-tabs button').forEach(x=>x.classList.toggle('is-active',x===btn));renderResults()}));
Promise.all([
 fetch(COMPETITION_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
 fetch(PLAYER_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
]).then(([c,p])=>{competition=c;players=p;renderMeta();renderKpis();renderResults();renderTeams();renderSources()}).catch(err=>{console.error(err);$('cdResults').innerHTML='<div class="cd-empty">대회 데이터를 불러오지 못했습니다.</div>'});
})();
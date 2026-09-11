/* K-Volley Lab · PC competition participants prototype v1 */
(()=>{
'use strict';
const SOURCES=[
  'data/competitions/avc-men-continental-2026-rosters-a.json?v=20260911-pc-participants-1',
  'data/competitions/avc-men-continental-2026-rosters-b.json?v=20260911-pc-participants-1',
  'data/competitions/avc-men-continental-2026-rosters-c.json?v=20260911-pc-participants-1'
];
const FLAG_MAP={JPN:'jp',AUS:'au',BRN:'bh',OMA:'om',IRI:'ir',CHN:'cn',IND:'in',NZL:'nz',QAT:'qa',KOR:'kr',TPE:'tw',THA:'th'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let teams=[];
let selectedTeam='';
const section=()=>document.querySelector('.kvl1180-view[data-view="rosters"]');
const flagUrl=team=>FLAG_MAP[team?.code]?`https://flagcdn.com/w160/${FLAG_MAP[team.code]}.png`:'';
const statusKo=team=>String(team?.status||'').startsWith('FINAL')?`최종 ${team.count||team.players?.length||0}명`:`등록 ${team.count||team.players?.length||0}명`;
function normalizeViewAlias(){
  const u=new URL(location.href);
  if(u.searchParams.get('view')==='teams'){
    u.searchParams.set('view','rosters');
    history.replaceState(null,'',u.pathname+u.search+u.hash);
  }
}
function requestedTeam(){
  const value=new URLSearchParams(location.search).get('team');
  if(!value)return '';
  const decoded=decodeURIComponent(value).toLowerCase();
  const found=teams.find(t=>String(t.name).toLowerCase()===decoded||String(t.code).toLowerCase()===decoded||String(t.en).toLowerCase()===decoded);
  return found?.name||'';
}
function syncUrl(team){
  const u=new URL(location.href);
  u.searchParams.set('view','rosters');
  u.searchParams.set('team',team.code||team.name);
  history.replaceState(null,'',u.pathname+u.search+u.hash);
}
function teamButton(team){
  const active=team.name===selectedTeam,korea=team.code==='KOR';
  return `<button type="button" class="kvl1180-participant-button ${active?'is-active':''} ${korea?'is-korea':''}" data-team="${esc(team.name)}" aria-pressed="${active?'true':'false'}"><img src="${flagUrl(team)}" alt="${esc(team.name)} 국기" loading="lazy"><span class="kvl1180-participant-button-copy"><strong>${esc(team.name)}</strong><small>${esc(team.en)} · ${esc(team.count||team.players?.length||0)}명</small></span></button>`;
}
function groupCard(group){
  const rows=teams.filter(t=>t.group===group);
  return `<article class="kvl1180-participant-group"><header class="kvl1180-participant-group-head"><strong>${esc(group)}조</strong><span>${rows.length}개국</span></header><div class="kvl1180-participant-buttons">${rows.map(teamButton).join('')}</div></article>`;
}
function playerRow(p){
  const official=p.officialName||p.fullName||'-';
  const korean=p.koreanName||'-';
  const dob=p.birthDate||'-';
  const height=Number.isFinite(Number(p.heightCm))&&Number(p.heightCm)>0?`${Number(p.heightCm)}cm`:'키 확인 불가';
  return `<div class="kvl1180-roster-row" role="row"><span class="kvl1180-roster-no">${esc(p.number??'-')}</span><span class="kvl1180-roster-name"><strong>${esc(official)}</strong></span><span class="kvl1180-roster-korean">${esc(korean)}</span><span class="kvl1180-roster-pos">${esc(p.position||'-')}</span><span class="kvl1180-roster-dob">${esc(dob)}</span><span class="kvl1180-roster-height">${esc(height)}</span></div>`;
}
function teamPanel(team){
  const players=(team.players||[]).slice().sort((a,b)=>Number(a.number)-Number(b.number));
  return `<article class="kvl1180-team-profile"><header class="kvl1180-team-profile-head"><span class="kvl1180-team-profile-flag"><img src="${flagUrl(team)}" alt="${esc(team.name)} 국기"></span><div class="kvl1180-team-profile-copy"><p class="label">SELECTED TEAM · ${esc(team.code)}</p><h3>${esc(team.name)}</h3><p>${esc(team.en)}</p></div><div class="kvl1180-team-profile-meta"><span>${esc(team.group)}조</span><span>${esc(statusKo(team))}</span><span>${esc(team.count||players.length)}명</span></div></header><div class="kvl1180-roster-block"><div class="kvl1180-roster-headline"><h4>등록 선수명단</h4><p>등번호 오름차순 · 대회 등록 로스터 기준</p></div><div class="kvl1180-roster-table" role="table" aria-label="${esc(team.name)} 등록 선수명단"><div class="kvl1180-roster-table-head" role="row"><span>등번호</span><span>영문명</span><span>한글명</span><span>POS</span><span>생년월일</span><span>키</span></div>${players.map(playerRow).join('')}</div><p class="kvl1180-roster-source"><strong>자료 기준</strong> · K-Volley Lab 선수명단 MASTER의 공개 필드만 표시합니다. 내부 검수·관찰·연봉 정보는 포함하지 않습니다.</p></div></article>`;
}
function draw(){
  const root=section();if(!root||!teams.length)return;
  const active=teams.find(t=>t.name===selectedTeam)||teams[0];
  selectedTeam=active.name;
  const groupsRoot=root.querySelector('#kvl1180ParticipantGroups');
  const teamRoot=root.querySelector('#kvl1180ParticipantTeam');
  if(groupsRoot)groupsRoot.innerHTML=['A','B','C'].map(groupCard).join('');
  if(teamRoot)teamRoot.innerHTML=teamPanel(active);
}
function selectTeam(name,push=true){
  const team=teams.find(t=>t.name===name);if(!team)return;
  selectedTeam=team.name;
  if(push)syncUrl(team);
  draw();
}
async function fetchTeams(){
  const parts=await Promise.all(SOURCES.map(url=>fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()})));
  return parts.flatMap(p=>p.teams||[]);
}
async function init(){
  normalizeViewAlias();
  const root=section();if(!root)return;
  root.classList.remove('kvl1180-prototype-placeholder');
  root.classList.add('kvl1180-participants-view');
  root.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">PARTICIPATING TEAMS</p><h2>참가국</h2></div><div class="kvl1180-participant-status"><span><strong>12개국</strong></span><span>A · B · C조</span><span>등록 로스터</span></div></div><div id="kvl1180ParticipantGroups" class="kvl1180-participant-groups"><div class="kvl1180-participants-empty">참가국을 불러오는 중입니다.</div></div><div id="kvl1180ParticipantTeam"><div class="kvl1180-participants-empty">선수명단을 불러오는 중입니다.</div></div>`;
  root.addEventListener('click',event=>{const btn=event.target.closest('[data-team]');if(btn)selectTeam(btn.dataset.team,true)});
  try{
    teams=await fetchTeams();
    selectedTeam=requestedTeam()||teams.find(t=>t.code==='KOR')?.name||teams[0]?.name||'';
    draw();
  }catch(err){
    console.error('[KVL PC participants]',err);
    const groups=root.querySelector('#kvl1180ParticipantGroups'),team=root.querySelector('#kvl1180ParticipantTeam');
    if(groups)groups.innerHTML='<div class="kvl1180-participants-empty">참가국 데이터를 불러오지 못했습니다.</div>';
    if(team)team.innerHTML='';
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

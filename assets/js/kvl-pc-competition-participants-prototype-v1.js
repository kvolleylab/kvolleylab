/* K-Volley Lab · PC competition participants prototype v2
 * - official participant ordering
 * - 2026-27 club data policy
 * - Volleybox profile links
 * - selected/all print modes (1 team per A4 landscape page)
 */
(()=>{
'use strict';
const ROSTER_SOURCES=[
  'data/competitions/avc-men-continental-2026-rosters-a.json?v=20260911-pc-participants-2',
  'data/competitions/avc-men-continental-2026-rosters-b.json?v=20260911-pc-participants-2',
  'data/competitions/avc-men-continental-2026-rosters-c.json?v=20260911-pc-participants-2'
];
const COMPETITION_SOURCE='data/competitions/avc-men-continental-2026.json?v=20260911-pc-participants-2';
const VOLLEYBOX_SOURCE='data/competitions/avc-men-continental-2026-volleybox-links.json?v=20260911-pc-participants-2';
const CLUB_SOURCE='data/competitions/avc-men-continental-2026-clubs-2026-27.json?v=20260911-pc-participants-2';
const STYLE_HREF='assets/css/kvl-pc-competition-participants-prototype-v2.css?v=20260911-2';
const FLAG_MAP={JPN:'jp',AUS:'au',BRN:'bh',OMA:'om',IRI:'ir',CHN:'cn',IND:'in',NZL:'nz',QAT:'qa',KOR:'kr',TPE:'tw',THA:'th'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let teams=[];
let competition=null;
let volleyboxMap={};
let clubMap={};
let groupOrder=[];
let selectedTeam='';
const section=()=>document.querySelector('.kvl1180-view[data-view="rosters"]');
const flagUrl=team=>FLAG_MAP[team?.code]?`https://flagcdn.com/w160/${FLAG_MAP[team.code]}.png`:'';
const statusKo=team=>String(team?.status||'').startsWith('FINAL')?`최종 ${team.count||team.players?.length||0}명`:`등록 ${team.count||team.players?.length||0}명`;

function ensureStyle(){
  if(document.getElementById('kvl1180-participants-v2-css'))return;
  const link=document.createElement('link');
  link.id='kvl1180-participants-v2-css';link.rel='stylesheet';link.href=STYLE_HREF;
  document.head.appendChild(link);
}
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
function safeVolleyboxUrl(value){
  if(!value)return '';
  try{const u=new URL(String(value),location.href);return u.protocol==='https:'&&/(^|\.)volleybox\.net$/i.test(u.hostname)?u.href:''}catch{return ''}
}
function playerClub(team,p){
  const rec=clubMap?.[team.code]?.[String(p.number)]||null;
  if(rec?.status==='CONFIRMED'&&rec.club)return {text:rec.club,className:'is-confirmed',title:'26-27 공식 확인'};
  if(rec?.status==='FREE_AGENT')return {text:'FA / 무소속',className:'is-free-agent',title:'26-27 공식 확인'};
  return {text:'미확인',className:'is-unknown',title:'26-27 소속팀 미확인'};
}
function volleyboxLink(team,p,compact=false){
  const url=safeVolleyboxUrl(volleyboxMap?.[team.code]?.[String(p.number)]||'');
  if(!url)return '<span class="kvl1180-vb-empty" aria-label="Volleybox 링크 미확인">—</span>';
  const label=`${p.koreanName||p.officialName||p.fullName||'선수'} Volleybox 프로필`;
  return `<a class="kvl1180-vb-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)}"><span>${compact?'VB':'VB'}</span><b aria-hidden="true">↗</b></a>`;
}
function officialOrderMaps(){
  const groups=Array.isArray(competition?.groups)?competition.groups:[];
  groupOrder=groups.map(g=>g.id).filter(Boolean);
  const teamOrder=new Map();
  groups.forEach((g,gi)=>(g.teams||[]).forEach((name,ti)=>teamOrder.set(name,{gi,ti})));
  return teamOrder;
}
function sortTeams(list){
  const map=officialOrderMaps();
  const fallbackGroup=(g)=>{const i=groupOrder.indexOf(g);return i<0?999:i};
  return list.slice().sort((a,b)=>{
    const ao=map.get(a.name),bo=map.get(b.name);
    const ag=ao?.gi??fallbackGroup(a.group),bg=bo?.gi??fallbackGroup(b.group);
    if(ag!==bg)return ag-bg;
    if(ao&&bo&&ao.ti!==bo.ti)return ao.ti-bo.ti;
    if(ao&&!bo)return -1;if(!ao&&bo)return 1;
    return String(a.en||a.name).localeCompare(String(b.en||b.name),'en',{sensitivity:'base'});
  });
}
function teamButton(team){
  const active=team.name===selectedTeam,korea=team.code==='KOR';
  return `<button type="button" class="kvl1180-participant-button ${active?'is-active':''} ${korea?'is-korea':''}" data-team="${esc(team.name)}" aria-pressed="${active?'true':'false'}"><img src="${flagUrl(team)}" alt="${esc(team.name)} 국기" loading="lazy"><span class="kvl1180-participant-button-copy"><strong>${esc(team.name)}</strong><small>${esc(team.en)} · ${esc(team.count||team.players?.length||0)}명</small></span></button>`;
}
function groupCard(group){
  const rows=teams.filter(t=>t.group===group);
  return `<article class="kvl1180-participant-group"><header class="kvl1180-participant-group-head"><strong>${esc(group)}조</strong><span>${rows.length}개국</span></header><div class="kvl1180-participant-buttons">${rows.map(teamButton).join('')}</div></article>`;
}
function playerRow(team,p){
  const official=p.officialName||p.fullName||'-';
  const korean=p.koreanName||'-';
  const dob=p.birthDate||'-';
  const height=Number.isFinite(Number(p.heightCm))&&Number(p.heightCm)>0?`${Number(p.heightCm)}cm`:'키 확인 불가';
  const club=playerClub(team,p);
  return `<div class="kvl1180-roster-row" role="row"><span class="kvl1180-roster-no">${esc(p.number??'-')}</span><span class="kvl1180-roster-name"><strong>${esc(official)}</strong></span><span class="kvl1180-roster-korean">${esc(korean)}</span><span class="kvl1180-roster-pos">${esc(p.position||'-')}</span><span class="kvl1180-roster-dob">${esc(dob)}</span><span class="kvl1180-roster-height">${esc(height)}</span><span class="kvl1180-roster-club ${club.className}" title="${esc(club.title)}">${esc(club.text)}</span><span class="kvl1180-roster-vb">${volleyboxLink(team,p,true)}</span></div>`;
}
function confirmedClubCount(team){return (team.players||[]).filter(p=>['CONFIRMED','FREE_AGENT'].includes(clubMap?.[team.code]?.[String(p.number)]?.status)).length}
function teamPanel(team){
  const players=(team.players||[]).slice().sort((a,b)=>Number(a.number)-Number(b.number));
  const clubCount=confirmedClubCount(team);
  return `<article class="kvl1180-team-profile"><header class="kvl1180-team-profile-head"><span class="kvl1180-team-profile-flag"><img src="${flagUrl(team)}" alt="${esc(team.name)} 국기"></span><div class="kvl1180-team-profile-copy"><p class="label">SELECTED TEAM · ${esc(team.code)}</p><h3>${esc(team.name)}</h3><p>${esc(team.en)}</p></div><div class="kvl1180-team-profile-meta"><span>${esc(team.group)}조</span><span>${esc(statusKo(team))}</span><span>26-27 소속팀 ${clubCount}/${players.length} 공식확인</span></div></header><div class="kvl1180-roster-block"><div class="kvl1180-roster-headline"><div><h4>등록 선수명단</h4><p>등번호 오름차순 · 공식 확정된 26-27 소속팀만 공개</p></div><div class="kvl1180-print-actions"><button type="button" data-print="selected">선택 국가 인쇄</button><button type="button" data-print="all">전체 12개국 인쇄</button></div></div><div class="kvl1180-roster-table" role="table" aria-label="${esc(team.name)} 등록 선수명단"><div class="kvl1180-roster-table-head" role="row"><span>등번호</span><span>영문명</span><span>한글명</span><span>POS</span><span>생년월일</span><span>키</span><span>26-27 소속팀</span><span>VB</span></div>${players.map(p=>playerRow(team,p)).join('')}</div><p class="kvl1180-roster-source"><strong>자료 기준</strong> · K-Volley Lab 선수명단 MASTER 공개 필드 + 검증된 Volleybox 프로필. 26-27 소속팀은 <b>CONFIRMED/FA만 팀명 공개</b>하며 보도 단계(REPORTED)와 미확인(UNKNOWN)은 ‘미확인’으로 표시합니다. 내부 관찰·연봉 정보는 노출하지 않습니다.</p></div></article>`;
}
function draw(){
  const root=section();if(!root||!teams.length)return;
  const active=teams.find(t=>t.name===selectedTeam)||teams[0];
  selectedTeam=active.name;
  const groupsRoot=root.querySelector('#kvl1180ParticipantGroups');
  const teamRoot=root.querySelector('#kvl1180ParticipantTeam');
  const groups=groupOrder.length?groupOrder:[...new Set(teams.map(t=>t.group))];
  if(groupsRoot)groupsRoot.innerHTML=groups.map(groupCard).join('');
  if(teamRoot)teamRoot.innerHTML=teamPanel(active);
}
function selectTeam(name,push=true){
  const team=teams.find(t=>t.name===name);if(!team)return;
  selectedTeam=team.name;
  if(push)syncUrl(team);
  draw();
}
function printRow(team,p){
  const club=playerClub(team,p);
  const height=Number.isFinite(Number(p.heightCm))&&Number(p.heightCm)>0?`${Number(p.heightCm)}cm`:'-';
  return `<div class="kvl-print-row"><span>${esc(p.number??'-')}</span><span>${esc(p.officialName||p.fullName||'-')}</span><span>${esc(p.koreanName||'-')}</span><span>${esc(p.position||'-')}</span><span>${esc(p.birthDate||'-')}</span><span>${esc(height)}</span><span>${esc(club.text)}</span></div>`;
}
function printPage(team,index,total){
  const players=(team.players||[]).slice().sort((a,b)=>Number(a.number)-Number(b.number));
  return `<section class="kvl-print-sheet"><header class="kvl-print-head"><div class="kvl-print-identity"><img src="${flagUrl(team)}" alt=""><div><p>K-Volley Lab · AVC MEN'S CONTINENTAL CHAMPIONSHIP 2026</p><h1>${esc(team.name)} <small>${esc(team.en)} · ${esc(team.code)}</small></h1></div></div><div class="kvl-print-meta"><strong>${esc(team.group)}조 · ${players.length}명</strong><span>2026-27 소속팀 포함</span></div></header><div class="kvl-print-table"><div class="kvl-print-table-head"><span>#</span><span>영문명</span><span>한글명</span><span>POS</span><span>생년월일</span><span>키</span><span>26-27 소속팀</span></div>${players.map(p=>printRow(team,p)).join('')}</div><footer class="kvl-print-foot"><span>※ 소속팀은 공식확정/FA만 공개하며 미확인·보도 단계는 ‘미확인’으로 표기</span><span>${index}/${total}</span></footer></section>`;
}
function ensurePrintRoot(){
  let root=document.getElementById('kvl1180PrintRoot');
  if(!root){root=document.createElement('div');root.id='kvl1180PrintRoot';document.body.appendChild(root)}
  return root;
}
function waitForImages(root){
  const imgs=[...root.querySelectorAll('img')];
  return Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,1000)})));
}
async function printParticipants(mode){
  const active=teams.find(t=>t.name===selectedTeam)||teams[0];
  const list=mode==='all'?teams:[active];
  const root=ensurePrintRoot();
  root.innerHTML=list.map((team,i)=>printPage(team,i+1,list.length)).join('');
  document.body.classList.add('kvl-print-participants-active');
  await waitForImages(root);
  window.print();
}
function cleanupPrint(){document.body.classList.remove('kvl-print-participants-active')}
async function fetchJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()}
async function fetchBundle(){
  const [rosters,comp,vb,clubs]=await Promise.all([
    Promise.all(ROSTER_SOURCES.map(fetchJson)),fetchJson(COMPETITION_SOURCE),fetchJson(VOLLEYBOX_SOURCE),fetchJson(CLUB_SOURCE)
  ]);
  competition=comp;volleyboxMap=vb?.teams||{};clubMap=clubs?.teams||{};
  return sortTeams(rosters.flatMap(p=>p.teams||[]));
}
async function init(){
  normalizeViewAlias();ensureStyle();
  const root=section();if(!root)return;
  root.classList.remove('kvl1180-prototype-placeholder');root.classList.add('kvl1180-participants-view');
  root.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">PARTICIPATING TEAMS</p><h2>참가국</h2></div><div class="kvl1180-participant-status"><span><strong>12개국</strong></span><span>공식 조편성 순서</span><span>등록 로스터</span></div></div><div class="kvl1180-participant-order-note"><strong>정렬 기준</strong><span>조 순서 → 조 내 공식 추첨/엔트리 표기 순서 · 공식 순서가 없을 때만 영문 국가명 알파벳순</span></div><div id="kvl1180ParticipantGroups" class="kvl1180-participant-groups"><div class="kvl1180-participants-empty">참가국을 불러오는 중입니다.</div></div><div id="kvl1180ParticipantTeam"><div class="kvl1180-participants-empty">선수명단을 불러오는 중입니다.</div></div>`;
  root.addEventListener('click',event=>{
    const teamBtn=event.target.closest('[data-team]');if(teamBtn){selectTeam(teamBtn.dataset.team,true);return}
    const printBtn=event.target.closest('[data-print]');if(printBtn)printParticipants(printBtn.dataset.print);
  });
  window.addEventListener('afterprint',cleanupPrint);
  try{
    teams=await fetchBundle();
    selectedTeam=requestedTeam()||teams.find(t=>t.code==='KOR')?.name||teams[0]?.name||'';
    draw();
  }catch(err){
    console.error('[KVL PC participants v2]',err);
    const groups=root.querySelector('#kvl1180ParticipantGroups'),team=root.querySelector('#kvl1180ParticipantTeam');
    if(groups)groups.innerHTML='<div class="kvl1180-participants-empty">참가국 데이터를 불러오지 못했습니다.</div>';
    if(team)team.innerHTML='';
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

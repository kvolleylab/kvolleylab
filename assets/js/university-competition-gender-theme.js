(()=>{
'use strict';
const WOMEN='여대부';
const MEN='남대부';
const STORAGE_KEY='kvl:gosung-2026:gender';
const COMPETITION_URL='data/competitions/gosung-2026.json';
const BRAND_URL='data/master/university_brand_sources_2026.json';
let mode=MEN;
let syncing=false;
let competition=null;
let brands={teams:{}};
let applyQueued=false;
const cache={teamsHtml:'',teamsTitle:'',knockoutHtml:'',knockoutTitle:'',knockoutNote:'',ruleDisplay:''};

const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const valueOf=btn=>btn?.dataset.calendarDivision||btn?.dataset.division||btn?.dataset.standingDivision||'';
const themeOf=value=>value===WOMEN?'women':'men';
const normalizeName=value=>String(value||'').replace(/국립/g,'').replace(/대학교/g,'대').replace(/\s+/g,'').trim();
const initials=value=>normalizeName(value).replace(/대$/,'').slice(0,2)||'TEAM';
const fromUrl=()=>{
  const raw=new URLSearchParams(location.search).get('gender');
  if(raw==='women'||raw===WOMEN)return WOMEN;
  if(raw==='men'||raw===MEN)return MEN;
  return null;
};
const storedValue=()=>sessionStorage.getItem(STORAGE_KEY)===WOMEN?WOMEN:MEN;
const initialValue=()=>fromUrl()||storedValue();
const store=value=>sessionStorage.setItem(STORAGE_KEY,value===WOMEN?WOMEN:MEN);
const controls=()=>[...document.querySelectorAll('button[data-calendar-division],button[data-division],button[data-standing-division]')];
const dashboardReady=()=>Boolean(
  document.querySelector('#cdCalendar .cd-cal-month')&&
  document.querySelector('#cdResults .cd-date-group,#cdResults .cd-empty')&&
  document.querySelector('#cdPodium .cd-rank')&&
  document.querySelector('#cdTeams .cd-team-card')
);

function applyTheme(value){
  mode=value===WOMEN?WOMEN:MEN;
  if(document.body?.classList.contains('competition-dashboard-page'))document.body.dataset.kvlGenderTheme=themeOf(mode);
}
function rewriteInternalLinks(){
  const gender=mode===WOMEN?'women':'men';
  document.querySelectorAll('a[href*="university-competition.html"]').forEach(a=>{
    const raw=a.getAttribute('href');
    if(!raw)return;
    try{
      const url=new URL(raw,location.href);
      if(!url.pathname.endsWith('/university-competition.html'))return;
      url.searchParams.set('gender',gender);
      a.setAttribute('href',`${url.pathname.split('/').pop()}${url.search}${url.hash}`);
    }catch(_){ }
  });
}
function syncControls(value){
  if(syncing||!dashboardReady())return false;
  syncing=true;
  try{
    controls().filter(btn=>valueOf(btn)===value&&!btn.classList.contains('is-active')).forEach(btn=>btn.click());
  }finally{
    syncing=false;
  }
  return true;
}
function brandFor(name){
  const target=normalizeName(name);
  return Object.values(brands.teams||{}).find(item=>normalizeName(item.school_name)===target)||null;
}
function teamLogo(name,cls='cd-team-mark cd-team-logo'){
  const brand=brandFor(name);
  if(brand?.status==='asset_ready'&&brand.asset_path){
    return `<span class="${cls}"><img src="${esc(brand.asset_path)}" alt="${esc(name)} 로고" loading="lazy" onerror="this.parentElement.textContent='${esc(initials(name))}'"></span>`;
  }
  return `<span class="${cls.replace(' cd-team-logo','')}">${esc(initials(name))}</span>`;
}
function cacheBaseContent(){
  const teams=document.getElementById('cdTeams');
  const teamsTitle=document.querySelector('#teams .cd-section-title h2');
  if(teams&&!cache.teamsHtml&&teams.querySelector('.cd-team-card')){
    cache.teamsHtml=teams.innerHTML;
    cache.teamsTitle=teamsTitle?.textContent||'남대부 참가대학';
  }
  const bracket=document.getElementById('cdKnockoutBracket');
  const title=document.querySelector('.cd-knockout-title h2');
  const note=document.querySelector('.cd-knockout-title>p:last-child');
  const rule=document.querySelector('#standings .cd-knockout-wrap>.cd-rule-card');
  if(bracket&&!cache.knockoutHtml&&bracket.querySelector('.cd-pyramid,.cd-empty')){
    cache.knockoutHtml=bracket.innerHTML;
    cache.knockoutTitle=title?.textContent||'남대부 결선 토너먼트';
    cache.knockoutNote=note?.textContent||'';
    cache.ruleDisplay=rule?.style.display||'';
  }
}
function renderWomenTeams(){
  if(!competition)return;
  const teams=document.getElementById('cdTeams');
  const title=document.querySelector('#teams .cd-section-title h2');
  if(!teams)return;
  const names=[...new Set(competition.games.filter(g=>g.division===WOMEN).flatMap(g=>[g.teamA,g.teamB]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  if(title)title.textContent='여대부 참가대학';
  teams.innerHTML=names.map(name=>`<a class="cd-team-card kvl-women-team-card" href="university-team.html?school=${encodeURIComponent(name)}">${teamLogo(name)}<span><strong>${esc(name)}</strong><small>고성대회 참가</small></span></a>`).join('');
}
function restoreMenTeams(){
  const teams=document.getElementById('cdTeams');
  const title=document.querySelector('#teams .cd-section-title h2');
  if(title)title.textContent=cache.teamsTitle||'남대부 참가대학';
  if(teams&&cache.teamsHtml)teams.innerHTML=cache.teamsHtml;
}
function scoreParts(value){
  const [a,b]=String(value||'0-0').split('-').map(Number);
  return [a||0,b||0];
}
function womenMatchCard(game,label){
  const [a,b]=scoreParts(game.score);
  const winner=a>b?game.teamA:game.teamB;
  const teamRow=(name,points)=>`<div class="kvl-women-bracket-team ${name===winner?'is-winner':''}">${teamLogo(name,'kvl-women-bracket-logo')}<span>${esc(name)}</span><b>${points}</b></div>`;
  return `<article class="kvl-women-bracket-game"><div class="kvl-women-bracket-label">${esc(label)}</div><div class="kvl-women-bracket-meta">${esc(game.date)} · ${esc(game.time)} · ${esc(game.venue||'')}</div>${teamRow(game.teamA,a)}${teamRow(game.teamB,b)}<div class="kvl-women-bracket-sets">${(game.sets||[]).map(s=>`<span>${esc(s)}</span>`).join('')}</div></article>`;
}
function renderWomenKnockout(){
  if(!competition)return;
  const bracket=document.getElementById('cdKnockoutBracket');
  const title=document.querySelector('.cd-knockout-title h2');
  const note=document.querySelector('.cd-knockout-title>p:last-child');
  const rule=document.querySelector('#standings .cd-knockout-wrap>.cd-rule-card');
  if(!bracket)return;
  const games=competition.games.filter(g=>g.division===WOMEN&&!g.pool);
  const semis=games.filter(g=>g.stage==='준결승');
  const final=games.find(g=>g.stage==='결승');
  if(title)title.textContent='여대부 결선 토너먼트';
  if(note)note.textContent='준결승부터 결승까지 여대부 우승 과정을 확인하세요.';
  if(rule)rule.style.display='none';
  if(!final||semis.length<2){
    bracket.innerHTML='<div class="cd-empty">여대부 결선 토너먼트 데이터가 없습니다.</div>';
    return;
  }
  const champion=scoreParts(final.score)[0]>scoreParts(final.score)[1]?final.teamA:final.teamB;
  bracket.innerHTML=`<div class="kvl-women-bracket"><div class="kvl-women-champion">${teamLogo(champion,'kvl-women-bracket-logo')}<span><small>CHAMPION</small><strong>${esc(champion)}</strong></span></div><div class="kvl-women-final">${womenMatchCard(final,'결승')}</div><div class="kvl-women-semis">${semis.map((g,i)=>womenMatchCard(g,`준결승 ${i+1}경기`)).join('')}</div></div>`;
}
function restoreMenKnockout(){
  const bracket=document.getElementById('cdKnockoutBracket');
  const title=document.querySelector('.cd-knockout-title h2');
  const note=document.querySelector('.cd-knockout-title>p:last-child');
  const rule=document.querySelector('#standings .cd-knockout-wrap>.cd-rule-card');
  if(title)title.textContent=cache.knockoutTitle||'남대부 결선 토너먼트';
  if(note&&cache.knockoutNote)note.textContent=cache.knockoutNote;
  if(rule)rule.style.display=cache.ruleDisplay;
  if(bracket&&cache.knockoutHtml)bracket.innerHTML=cache.knockoutHtml;
}
function applyModeContent(){
  cacheBaseContent();
  if(mode===WOMEN){
    renderWomenTeams();
    renderWomenKnockout();
  }else{
    restoreMenTeams();
    restoreMenKnockout();
  }
  rewriteInternalLinks();
}
function queueApply(){
  if(applyQueued)return;
  applyQueued=true;
  requestAnimationFrame(()=>{
    applyQueued=false;
    applyModeContent();
  });
}
function setMode(value,{persist=true,sync=true}={}){
  const next=value===WOMEN?WOMEN:MEN;
  mode=next;
  if(persist)store(next);
  applyTheme(next);
  rewriteInternalLinks();
  if(sync)requestAnimationFrame(()=>{
    if(syncControls(next))queueApply();
  });
  queueApply();
}
function bind(){
  setMode(initialValue(),{persist:true,sync:false});
  controls().forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(syncing)return;
      const value=valueOf(btn);
      if(value!==WOMEN&&value!==MEN)return;
      setMode(value,{persist:true,sync:true});
    });
  });
  document.querySelectorAll('.cd-jump a').forEach(a=>a.addEventListener('click',rewriteInternalLinks));
  const root=document.querySelector('.cd-main');
  if(root){
    const observer=new MutationObserver(()=>{
      if(dashboardReady()){
        syncControls(mode);
        queueApply();
      }
    });
    observer.observe(root,{childList:true,subtree:true});
  }
  Promise.all([
    fetch(COMPETITION_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch(BRAND_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}).catch(()=>({teams:{}}))
  ]).then(([c,b])=>{
    competition=c;
    brands=b||{teams:{}};
    const trySync=()=>{
      if(syncControls(mode)){
        queueApply();
        return;
      }
      setTimeout(trySync,120);
    };
    trySync();
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

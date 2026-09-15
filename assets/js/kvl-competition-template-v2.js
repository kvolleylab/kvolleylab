/* K-Volley Lab · international competition template v2 */
(()=>{
'use strict';
const VIEWS=new Set(['overview','schedule','groups','knockout','rosters','resources']);
const KPI_TARGETS=['?view=rosters&team=KOR','?view=groups','?view=schedule','?view=knockout'];
const STATUS_LABEL={upcoming:'대회 시작 전',active:'대회 진행 중',completed:'대회 종료'};

function data(){return window.KVL_COMPETITION_V2_DATA||{};}
function txt(el,value){if(el&&value!==undefined&&value!==null)el.textContent=String(value);}
function q(sel,root=document){return root.querySelector(sel);}
function qa(sel,root=document){return [...root.querySelectorAll(sel)];}
function currentView(){const v=new URLSearchParams(location.search).get('view')||'overview';return VIEWS.has(v)?v:'overview';}

function applyView(){
  const view=currentView();
  qa('.kvl1180-view[data-view]').forEach(el=>{el.hidden=el.dataset.view!==view;});
  qa('.kvl1180-tabs a[data-view]').forEach(a=>{
    const active=a.dataset.view===view;
    a.classList.toggle('is-active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
}

function bindKpis(){
  qa('.kvl1180-view[data-view="overview"] .kvl1180-kpis .kvl1180-kpi:not(.is-venue)').forEach((card,i)=>{
    const target=KPI_TARGETS[i]; if(!target)return;
    card.dataset.kvlTarget=target; card.tabIndex=0; card.setAttribute('role','link');
    const label=q('.kvl1180-kpi-copy>span',card)?.textContent?.trim()||'대회 정보';
    card.setAttribute('aria-label',`${label} 페이지로 이동`);
    if(card.dataset.kvlBound==='1')return; card.dataset.kvlBound='1';
    const go=()=>{location.href=target;};
    card.addEventListener('click',go);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
  });
}

function applyTheme(d){
  const body=document.body;
  body.dataset.kvlGender=d.gender==='women'?'women':'men';
  const pc=d.hero?.pcImage; const mobile=d.hero?.mobileImage;
  if(pc)body.style.setProperty('--kvl-hero-image',`url("${pc}")`);
  if(d.hero?.position)body.style.setProperty('--kvl-hero-position',d.hero.position);
  if(d.hero?.mobilePosition)body.style.setProperty('--kvl-hero-position-mobile',d.hero.mobilePosition);
  if(mobile){
    let style=q('#kvl-v2-mobile-hero');
    if(!style){style=document.createElement('style');style.id='kvl-v2-mobile-hero';document.head.appendChild(style);}
    style.textContent=`@media(max-width:680px){body.kvl-competition-template-v2{--kvl-hero-image:url("${mobile}")}}`;
  }
}

function applyMeta(d){
  txt(q('[data-kvl="eyebrow"]'),`INTERNATIONAL COMPETITION · ${(d.gender||'men').toUpperCase()}`);
  txt(q('[data-kvl="title"]'),d.displayName);
  txt(q('[data-kvl="official-name"]'),d.officialName);
  txt(q('[data-kvl="dates"]'),d.dateLabel);
  txt(q('[data-kvl="location"]'),d.locationLabel);
  txt(q('[data-kvl="venue"]'),d.venueLabel);
  txt(q('[data-kvl="team-count"]'),d.teamCount ?? '미정');
  txt(q('[data-kvl="group-count"]'),d.groupCount ?? '미정');
  txt(q('[data-kvl="match-count"]'),d.matchCount ?? '미정');
  txt(q('[data-kvl="qualifier-count"]'),d.knockoutTeamCount ?? '미정');
  txt(q('[data-kvl="venue-primary"]'),d.locationLabel||'미정');
  txt(q('[data-kvl="venue-secondary"]'),d.venueLabel||'확정 전');
  const teamBadge=q('[data-kvl="hero-team-count"]'); if(teamBadge)txt(teamBadge,d.teamCount?`${d.teamCount}개국`:'참가국 확정 전');
  const links=d.genderLinks||{};
  const men=q('[data-gender-link="men"]'), women=q('[data-gender-link="women"]');
  if(men&&links.men)men.href=links.men;
  if(women&&links.women)women.href=links.women;
  if(men)men.classList.toggle('is-active',d.gender!=='women');
  if(women)women.classList.toggle('is-active',d.gender==='women');
}

function applyStatus(d){
  const status=['upcoming','active','completed'].includes(d.status)?d.status:'upcoming';
  document.body.dataset.kvlStatus=status;
  txt(q('[data-kvl="hero-status"]'),STATUS_LABEL[status]);
  txt(q('[data-kvl="hero-stage"]'),d.stageLabel||STATUS_LABEL[status]);
  const result=q('.kvl1180-overview-result'); if(!result)return;
  result.dataset.resultMode=status;
  result.innerHTML='';
  if(status==='completed'&&d.champion){
    const strong=document.createElement('strong'); strong.textContent=`우승 ${d.champion}`; result.appendChild(strong);
    if(d.championAchievement){const span=document.createElement('span');span.textContent=d.championAchievement;result.appendChild(span);}
  }else{
    const strong=document.createElement('strong');
    strong.textContent=status==='active'?(d.activeOverviewNote||'조별리그 결과에 따라 예상 8강 대진이 자동 반영됩니다.'):(d.upcomingOverviewNote||'대회 시작 전 · 공식 발표 기준으로 순차 업데이트됩니다.');
    result.appendChild(strong);
  }
}

function applyQualifications(d){
  const map=new Map((d.qualifications||[]).map(x=>[x.id,x]));
  qa('[data-qualification-id]').forEach(card=>{
    const item=map.get(card.dataset.qualificationId)||{};
    txt(q('[data-role="qualification-brand"]',card),item.brand);
    txt(q('[data-role="qualification-pill"]',card),item.pill);
    txt(q('h3',card),item.title);
    txt(q('[data-role="qualification-desc"]',card),item.description);
    txt(q('.kvl1180-stake-foot',card),item.foot);
    const row=q('.kvl1180-stake-confirmed',card);
    const teams=(item.resultTeams||[]).filter(Boolean);
    const show=teams.length>0;
    card.classList.toggle('has-confirmed-result',show);
    if(row){row.hidden=!show;txt(q('strong',row),item.resultLabel||'대회 결과');txt(q('span',row),teams.join(' · '));}
  });
}

function applyFinalRanking(d){
  const byRank=new Map((d.finalRanking||[]).map(x=>[String(x.rank),x]));
  qa('[data-final-rank]').forEach(card=>{
    const item=byRank.get(card.dataset.finalRank);
    if(!item)return;
    txt(q('[data-role="final-team"]',card),item.team||'미정');
    txt(q('[data-role="final-result"]',card),item.result||'');
    const qual=q('.kvl-final-qualification',card);
    if(qual){qual.hidden=!item.qualification;txt(qual,item.qualification||'');}
  });
}

function applyResources(d){
  const root=q('#resourceList'); if(!root)return;
  root.innerHTML='';
  (d.resources||[]).forEach(item=>{
    const article=document.createElement('article'); article.className='kvl1180-source';
    const copy=document.createElement('div'); copy.className='kvl1180-source-copy';
    const strong=document.createElement('strong'); strong.textContent=item.title||'공식자료'; copy.appendChild(strong);
    const a=document.createElement('a'); a.href=item.url||'#'; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='공식페이지 →';
    article.append(copy,a); root.appendChild(article);
  });
}

function apply(){const d=data();applyView();bindKpis();applyTheme(d);applyMeta(d);applyStatus(d);applyQualifications(d);applyFinalRanking(d);applyResources(d);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
window.addEventListener('popstate',apply);
window.KVLCompetitionTemplateV2={apply};
})();

/* K-Volley Lab · international competition template v2 */
(()=>{
'use strict';
const VIEWS=new Set(['overview','schedule','groups','knockout','rosters','resources','team']);
const KPI_TARGETS=['?view=rosters&team=KOR','?view=groups','?view=schedule','?view=knockout'];
const STATUS_LABEL={upcoming:'대회 시작 전',active:'대회 진행 중',completed:'대회 종료'};
const THEME_FAMILIES=new Set(['avc','fivb','domestic']);

function data(){return window.KVL_COMPETITION_V2_DATA||{};}
function txt(el,value){if(el&&value!==undefined&&value!==null)el.textContent=String(value);}
function q(sel,root=document){return root.querySelector(sel);}
function qa(sel,root=document){return [...root.querySelectorAll(sel)];}
function currentView(){const p=new URLSearchParams(location.search),v=p.get('view')||(p.has('team')?'team':'overview');return VIEWS.has(v)?v:'overview';}
function viewUrl(view,params={}){const u=new URL(location.href);u.hash='';u.searchParams.set('view',view);u.searchParams.delete('date');u.searchParams.delete('team');for(const [key,value] of Object.entries(params)){if(value!==undefined&&value!==null)u.searchParams.set(key,value);else u.searchParams.delete(key);}return u.pathname+u.search;}

function applyView(){
  const view=currentView();
  qa('.kvl1180-view[data-view]').forEach(el=>{el.hidden=el.dataset.view!==view||el.dataset.kvlEmpty==='true';});
  qa('.kvl1180-tabs a[data-view]').forEach(a=>{
    const active=a.dataset.view===(view==='team'?'schedule':view);
    a.href=viewUrl(a.dataset.view);
    a.classList.toggle('is-active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
}


function applyTheme(d){
  const body=document.body;
  const gender=d.gender==='women'?'women':'men';
  const requestedFamily=String(d.competitionFamily||d.family||'avc').toLowerCase();
  const family=THEME_FAMILIES.has(requestedFamily)?requestedFamily:'avc';
  body.dataset.kvlGender=gender;
  body.dataset.kvlFamily=family;
  body.dataset.kvlHeroMode=d.hero?.mode==='photo'?'photo':'palette';
  const asset=v=>{try{const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}};
  const showHeroImage=d.hero?.mode!=='color-only'&&d.hero?.showImage!==false;
  for(const [key,value] of [['--kvl-hero-image-desktop',d.hero?.pcImage],['--kvl-hero-image-mobile',d.hero?.mobileImage]]){
    const url=showHeroImage&&value&&asset(value);if(url)body.style.setProperty(key,`url(${JSON.stringify(url)})`);else body.style.removeProperty(key);
  }
  const chunks=showHeroImage&&Array.isArray(d.hero?.b64Chunks)?d.hero.b64Chunks.map(asset).filter(Boolean):[];
  if(chunks.length){
    Promise.all(chunks.map(async url=>{
      const res=await fetch(url,{cache:'force-cache'});
      if(!res.ok)throw new Error(`hero asset ${res.status}`);
      return (await res.text()).replace(/\\s+/g,'');
    })).then(parts=>{
      const dataUrl=`data:${d.hero?.mimeType||'image/webp'};base64,${parts.join('')}`;
      body.style.setProperty('--kvl-hero-image-desktop',`url(${JSON.stringify(dataUrl)})`);
      body.style.setProperty('--kvl-hero-image-mobile',`url(${JSON.stringify(dataUrl)})`);
      body.dataset.kvlHeroReady='true';
    }).catch(()=>{body.dataset.kvlHeroReady='fallback';});
  }else body.removeAttribute('data-kvl-hero-ready');
  for(const [key,value] of [['--kvl-hero-position',d.hero?.position],['--kvl-hero-position-mobile',d.hero?.mobilePosition]]){
    if(value)body.style.setProperty(key,value);else body.style.removeProperty(key);
  }
}

function applyMeta(d){
  if(d.displayName)document.title=d.seo?.title||`${d.displayName} | K-Volley Lab`;
  if(d.seo?.description){let meta=q('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta);}meta.content=d.seo.description;}
  txt(q('[data-kvl="eyebrow"]'),`${d.competitionFamily==='domestic'?'DOMESTIC':'INTERNATIONAL'} COMPETITION · ${(d.gender||'men').toUpperCase()}`);
  txt(q('[data-kvl="title"]'),d.displayName);
  txt(q('[data-kvl="official-name"]'),d.officialName);
  txt(q('[data-kvl="dates"]'),d.dateLabel);
  txt(q('[data-kvl="location"]'),d.locationLabel);
  txt(q('[data-kvl="venue"]'),d.venueLabel);
  txt(q('[data-kvl="team-count"]'),d.teamCount ?? '미정');
  txt(q('[data-kvl="group-count"]'),d.groupCount ?? '미정');
  txt(q('[data-kvl="match-count"]'),d.matchCount ?? '미정');
  txt(q('[data-kvl="qualifier-count"]'),d.knockoutTeamCount ?? '미정');
  txt(q('[data-kvl="venue-primary"]'),d.venuePrimary||d.locationLabel||'미정');
  txt(q('[data-kvl="venue-secondary"]'),d.venueSecondary||d.venueLabel||'확정 전');
  const teamBadge=q('[data-kvl="hero-team-count"]'); if(teamBadge){const domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';txt(teamBadge,d.teamCount?`${d.teamCount}${domestic?'개 대학':'개국'}`:(domestic?'참가대학 확정 전':'참가국 확정 전'));}
  const links=d.genderLinks||{};
  const men=q('[data-gender-link="men"]'), women=q('[data-gender-link="women"]');
  for(const [a,target] of [[men,links.men],[women,links.women]]){
    if(!a)continue;
    if(target){const u=new URL(target,location.href);u.searchParams.set('view',currentView());a.href=u.href;a.removeAttribute('aria-disabled');a.classList.remove('is-disabled');}
    else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.classList.add('is-disabled');}
  }
  if(men)men.classList.toggle('is-active',d.gender!=='women');
  if(women)women.classList.toggle('is-active',d.gender==='women');
}

function applyFamilyLayout(d){
  const domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';
  document.body.classList.toggle('kvl-domestic-template',domestic);
  if(!domestic)return;

  const rosterTab=q('.kvl1180-tabs [data-view="rosters"]');
  if(rosterTab)rosterTab.textContent=d.structure?.labels?.participantsTitle||'참가대학';

  const root=q('.kvl1180-view[data-view="overview"] .kvl1180-kpis');
  if(!root)return;
  root.innerHTML=`
    <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-users-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>참가대학</span><strong data-kvl-domestic="team-count">미정</strong><small data-kvl-domestic-unit="team-count">개 대학</small></div></article>
    <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-users-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>등록선수</span><strong data-kvl-domestic="player-count">수집 중</strong><small data-kvl-domestic-unit="player-count"></small></div></article>
    <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-layers-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>전체 평균신장</span><strong data-kvl-domestic="avg-height-1">수집 중</strong><small data-kvl-domestic-unit="avg-height-1"></small></div></article>
    <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-calendar-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>전체일정</span><strong data-kvl-domestic="match-count">미정</strong><small data-kvl-domestic-unit="match-count">경기</small></div></article>
    <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-layers-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>전체 평균신장</span><strong data-kvl-domestic="avg-height-2">수집 중</strong><small data-kvl-domestic-unit="avg-height-2"></small></div></article>
    <article class="kvl1180-kpi is-domestic-venue"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-pin-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>대회장소</span><strong data-kvl-domestic="venue">미정</strong><small data-kvl-domestic="venue-detail"></small></div></article>`;

  const playerCount=d.registeredPlayerCount;
  const avgHeight=d.averageHeightCm;
  txt(q('[data-kvl-domestic="team-count"]',root),d.teamCount??'미정');
  txt(q('[data-kvl-domestic="player-count"]',root),playerCount??'수집 중');
  txt(q('[data-kvl-domestic-unit="player-count"]',root),playerCount!==undefined&&playerCount!==null?'명':'');
  for(const key of ['avg-height-1','avg-height-2']){
    txt(q(`[data-kvl-domestic="${key}"]`,root),avgHeight??'수집 중');
    txt(q(`[data-kvl-domestic-unit="${key}"]`,root),avgHeight!==undefined&&avgHeight!==null?'cm':'');
  }
  txt(q('[data-kvl-domestic="match-count"]',root),d.matchCount??'미정');
  txt(q('[data-kvl-domestic="venue"]',root),d.venuePrimary||d.locationLabel||'미정');
  txt(q('[data-kvl-domestic="venue-detail"]',root),d.venueSecondary||d.venueLabel||'');

  const targets=[
    viewUrl('rosters'),
    viewUrl('rosters'),
    viewUrl('rosters'),
    viewUrl('schedule'),
    viewUrl('rosters'),
    viewUrl('schedule')
  ];
  qa('.kvl1180-kpi',root).forEach((card,i)=>{card.dataset.kvlTarget=targets[i];});
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
    strong.textContent=status==='completed'?'대회 종료 · 최종 결과 확인 중':status==='active'?(d.activeOverviewNote||'확인된 경기 결과와 공식 대진을 표시합니다.'):(d.upcomingOverviewNote||'대회 시작 전 · 공식 발표 기준으로 순차 업데이트됩니다.');
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
  txt(q('[data-kvl="resources-note"]'),d.resourcesNote||'공식 출처만 연결합니다.');
  const root=q('#resourceList'); if(!root)return;
  root.innerHTML='';
  (d.resources||[]).forEach(item=>{
    let url;try{url=new URL(item.url,location.href);if(!['http:','https:'].includes(url.protocol))return;}catch{return;}
    const article=document.createElement('article'); article.className='kvl1180-source';
    const copy=document.createElement('div'); copy.className='kvl1180-source-copy';
    const strong=document.createElement('strong'); strong.textContent=item.title||'공식자료'; copy.appendChild(strong);
    const a=document.createElement('a'); a.href=url.href; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='공식페이지 →';
    article.append(copy,a); root.appendChild(article);
  });
}

function apply(){const d=data();applyView();applyTheme(d);applyFamilyLayout(d);applyMeta(d);applyStatus(d);applyQualifications(d);applyFinalRanking(d);applyResources(d);}
if(!window.KVL_COMPETITION_PAGE_V2?.deferRender){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();}
window.addEventListener('popstate',apply);
window.KVLCompetitionTemplateV2={apply,applyView,viewUrl,currentView};
})();

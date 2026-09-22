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
  const domestic=String(d.competitionFamily||d.family||'').toLowerCase()==='domestic';
  if(domestic){
    const kpis=q('.kvl1180-view[data-view="overview"] .kvl1180-kpis');
    const cards=kpis?qa('.kvl1180-kpi',kpis):[];
    if(cards[0]){
      txt(q('.kvl1180-kpi-copy>span',cards[0]),d.structure?.labels?.participantsKpi||'참가팀');
      txt(q('.kvl1180-kpi-copy small',cards[0]),d.structure?.labels?.participantsKpiUnit||'팀');
    }
    if(cards[3]){
      txt(q('.kvl1180-kpi-copy small',cards[3]),d.structure?.labels?.knockoutKpiUnit||'팀');
    }
  }
  const teamBadge=q('[data-kvl="hero-team-count"]'); if(teamBadge)txt(teamBadge,d.teamCount?`${d.teamCount}${domestic?'팀':'개국'}`:(domestic?'참가팀 확정 전':'참가국 확정 전'));
  const links=d.genderLinks||{};
  const men=q('[data-gender-link="men"]'), women=q('[data-gender-link="women"]');
  for(const [a,target] of [[men,links.men],[women,links.women]]){
    if(!a)continue;
    if(target){
      const u=new URL(target,location.href),switchView=currentView()==='team'?'schedule':currentView();
      u.searchParams.set('view',switchView);
      u.searchParams.delete('team');
      a.href=u.href;a.removeAttribute('aria-disabled');a.classList.remove('is-disabled');
    }else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.classList.add('is-disabled');}
  }
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

function apply(){const d=data();applyView();applyTheme(d);applyMeta(d);applyStatus(d);applyQualifications(d);applyFinalRanking(d);applyResources(d);}

document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('.kvl1180-tabs a[data-view]');
  if(!link||link.getAttribute('aria-disabled')==='true')return;
  const next=new URL(link.href,location.href),current=new URL(location.href);
  if(next.origin!==current.origin||next.pathname!==current.pathname)return;
  if(next.searchParams.get('competition')!==current.searchParams.get('competition'))return;
  event.preventDefault();
  history.pushState(null,'',next.pathname+next.search);
  applyView();
  const view=currentView(),target=document.querySelector(`.kvl1180-view[data-view="${CSS.escape(view)}"]:not([hidden])`);
  if(target&&matchMedia('(max-width:680px)').matches)target.scrollIntoView({block:'start'});
},{capture:true});

if(!window.KVL_COMPETITION_PAGE_V2?.deferRender){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();}
window.addEventListener('popstate',applyView);
window.KVLCompetitionTemplateV2={apply,applyView,viewUrl,currentView};
})();

/* K-Volley Lab team directory v1: read-only consumers of existing competition and KOVO roster data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLTeamsDirectoryV1=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const SOURCES={
  index:'data/team-rosters/v-league/index.json',
  coaching:'data/team-rosters/v-league/coaches-2026-27.json',
  svIndex:'data/team-rosters/sv-league/index-v1.json',
  school:['school-ibk-2026','school-presidents-2026','school-iksan-2026','school-samcheok-2026','school-spring-2026']
 };
 const CATEGORIES={
  pro:{title:'프로 팀',eyebrow:'PRO VOLLEYBALL'},
  university:{title:'대학 팀',eyebrow:'UNIVERSITY VOLLEYBALL'},
  high:{title:'고교 팀',eyebrow:'HIGH SCHOOL'},
  middle:{title:'중학 팀',eyebrow:'MIDDLE SCHOOL'},
  national:{title:'대한민국 대표팀',eyebrow:'NATIONAL TEAM'},
  international:{title:'국제 대표팀',eyebrow:'INTERNATIONAL NATIONAL TEAMS'}
 };
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const short=x=>String(x||'').trim().replace(/대학교$/,'대');
 const validSeason=x=>/^\d{4}-\d{2}$/.test(String(x||''));
 const validCode=x=>/^[A-Za-z0-9_-]{2,40}$/.test(String(x||''));
 const teamRoute=(gender,season,code)=>'competition-engine.html?competition=v-league-'+gender+'-'+season+'&view=rosters&team='+encodeURIComponent(code);
 const safeLogo=x=>{
  const s=String(x||'');
  if(/^(?:\/?assets\/)[A-Za-z0-9_.\/-]+\.(?:svg|png|jpe?g|webp)(?:\?[A-Za-z0-9=&_.-]+)?$/.test(s))return true;
  try{
   const u=new URL(s);
   if(u.protocol!=='https:')return false;
   if(u.hostname==='www.jtekt-stings.jp')return u.pathname.startsWith('/_next/static/media/')&&/\.(?:svg|png|webp)$/i.test(u.pathname);
   if(u.hostname==='images.microcms-assets.io')return u.pathname.startsWith('/assets/99af67a09e884982ae7d419ecde99396/')&&/\.(?:svg|png|webp)$/i.test(u.pathname);
   if(u.hostname==='tokyo-greatbears.com')return u.pathname.startsWith('/_tgb_content/wp-content/uploads/')&&/\.(?:svg|png|webp)$/i.test(u.pathname);
   return false;
  }catch{return false}
 };
 const safeHref=x=>/^(?:competition-engine|university-team|university-teams|national-team|national-team-history|international-competition-senior-national-team|competition|vnl)\.html(?:\?[A-Za-z0-9%_.=&-]+)?$/.test(String(x||''));
 const totalPlayers=teams=>teams.reduce((n,t)=>n+(Number(t.count)||0),0);
 function buildPro(participants,rosters,staff,gender,season){
  if(!['men','women'].includes(gender)||!validSeason(season)||!Array.isArray(participants)
   ||!rosters||typeof rosters!=='object'||Array.isArray(rosters))throw Error('V-League directory source invalid');
  if(participants.length!==7)throw Error('Expected seven published V-League participants for '+gender);
  const seen=new Set();
  const result=participants.map(t=>{
   if(!t||!validCode(t.code)||!String(t.name||'').trim()||seen.has(t.code))throw Error('Duplicate/invalid V-League club');
   seen.add(t.code);
   const roster=rosters[t.code];
   if(!roster||!Array.isArray(roster.players)||roster.players.some(p=>!p||!p.name))
    throw Error('Current KOVO roster missing for '+t.code);
   const coach=staff?.season===season?staff[gender]?.[t.code]:null;
   return {
    code:t.code,name:t.name,fullName:t.fullName||t.name,logo:safeLogo(t.logo)?t.logo:'',
    gender,season,count:roster.players.length,asOf:roster.asOf||'',
    coach:coach?.name||'',coachRole:coach?.role==='acting'?'감독대행':'감독',coachAsOf:coach?.asOf||'',coachSource:coach?.source||'',
    action:'roster',href:teamRoute(gender,season,t.code),type:'pro'
   };
  });
  if(Object.keys(rosters).filter(x=>Array.isArray(rosters[x]?.players)).length!==7)
   throw Error('Published KOVO club count mismatch');
  return result.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
 }
 function buildSVLeague(index,gender,season){
  if(!index||index.version!=='1.0'||index.league?.id!=='sv-league'||!Array.isArray(index.seasons)
   ||!['men','women'].includes(gender)||!validSeason(season))throw Error('SV.LEAGUE directory source invalid');
  const found=index.seasons.find(s=>s.gender===gender&&s.season===season);
  if(!found)return[];
  if(!Array.isArray(found.teams))throw Error('SV.LEAGUE season teams missing');
  const seen=new Set();
  return found.teams.map((t,order)=>{
   if(!t||!validCode(t.code)||!String(t.name||'').trim()||!String(t.en||'').trim()||seen.has(t.code)
      ||!Number.isInteger(t.count)||t.count<0||!/^data\/team-rosters\/sv-league\/\d{4}-\d{2}\/[a-z0-9_-]+\.json$/.test(String(t.source_path||'')))
    throw Error('Invalid SV.LEAGUE club');
   seen.add(t.code);
   return {code:t.code,name:t.name,en:t.en,fullName:t.en,logo:safeLogo(t.logo)?t.logo:'',
    gender,season,count:t.count,asOf:found.as_of||index.updated_at||'',sourcePath:t.source_path,
    sourceLabel:'JAPAN · SV.LEAGUE',leagueId:'sv',leagueLabel:'SV.LEAGUE',
    action:'roster',href:'',type:'pro-sv',order};
  });
 }
 function buildUniversity(participants,rosters,staff,gender){
  if(!Array.isArray(participants)||!rosters||typeof rosters!=='object')throw Error('University teams unavailable');
  return participants.map(t=>{
   if(!validCode(t.code)||!t.name)throw Error('Invalid university team');
   const coach=gender==='men'?staff?.teams?.[t.code]?.head_coach||'':'';
   const r=rosters[t.code],n=Array.isArray(r?.players)?r.players.length:null;
   return {
    code:t.code,name:t.name,logo:safeLogo(t.logo)?t.logo:'',gender,
    count:n,coach,asOf:'2026',type:'university',action:'link',
    href:gender==='men'?'university-team.html?school='+encodeURIComponent(t.code):
     'competition-engine.html?competition=university-league-women-2026&view=rosters&team='+encodeURIComponent(t.code),
    sourceLabel:'2026 KUSF 대학 U-리그 등록 기준'
   };
  }).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
 }
 function buildSchool(snapshots,division,gender){
  if(!['high','middle'].includes(division)||!['men','women'].includes(gender))throw Error('School filter invalid');
  const found=new Map();
  for(const snap of snapshots){
   if(!snap||!Array.isArray(snap.participants)||!snap.slug)continue;
   for(const t of snap.participants){
    if(!t?.name)continue;
    const key=String(t.name).trim().replace(/\s+/g,'');
    if(found.has(key))continue; // ordered most-recent reviewed competition first
    found.set(key,{
     code:t.code||key,name:t.name,logo:safeLogo(t.logo)?t.logo:'',
     gender,type:division,count:null,coach:'',action:'link',
     sourceLabel:'2026 참가대회 · '+snap.label,
     href:'competition-engine.html?competition='+snap.slug+'&view=participants'
    });
   }
  }
  return [...found.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko'));
 }
 function curated(category){
  if(category==='national')return [
   {code:'KOR-M',name:'대한민국 남자대표팀',type:category,action:'link',sourceLabel:'국가대표 경기·대회 이력',href:'national-team.html?gender=men'},
   {code:'KOR-W',name:'대한민국 여자대표팀',type:category,action:'link',sourceLabel:'국가대표 경기·대회 정보',href:'national-team.html?gender=women'},
   {code:'KOR-H',name:'대표팀 역사',type:category,action:'link',sourceLabel:'연도별 성인·연령별 대표팀 기록',href:'national-team-history.html'}
  ];
  return [
   {code:'INT-S',name:'시니어 국가대표',type:category,action:'link',sourceLabel:'국제 국가대표팀 대회 자료',href:'international-competition-senior-national-team.html'},
   {code:'INT-C',name:'국제대회',type:category,action:'link',sourceLabel:'국제대회·참가팀 정보',href:'competition.html'},
   {code:'INT-V',name:'VNL',type:category,action:'link',sourceLabel:'세계 각국 남녀 대표팀 기록',href:'vnl.html'}
  ];
 }
 function logoMarkup(t){
  const fallback='<span class="ktd-monogram ktd-team-logo-fallback" aria-hidden="true"'+(safeLogo(t.logo)?' hidden':'')+'>'+esc(short(t.name).slice(0,2)||'팀')+'</span>';
  if(safeLogo(t.logo))return '<img class="ktd-team-logo-image" src="'+esc(t.logo)+'" alt="'+esc(t.name)+' 구단·팀 로고" loading="lazy" decoding="async">'+fallback;
  return fallback;
 }
 function countryFlagMarkup(t){
  const iso=String(t.flag_iso2||'');
  const verified=/^[a-z]{2}$/.test(iso);
  const fallback='<span class="ktd-flag-icon ktd-country-flag-fallback" aria-hidden="true"'+(verified?' hidden':'')+'>'+esc(t.flag||'🏐')+'</span>';
  if(!verified)return fallback;
  // Only existing, source-validated ISO alpha-2 codes select self-hosted SVG assets.
  return '<img class="ktd-country-flag-image" src="assets/images/flags/4x3/'+esc(iso)+'.svg" alt="'+esc(t.name)+' 국기" loading="lazy" decoding="async">'+fallback;
 }
 function cardMarkup(t){
  if(t.action==='country')return '<article class="ktd-card ktd-country-card" data-team-code="'+esc(t.code)+'" data-ktd-country-card="'+esc(t.code)+'" role="button" tabindex="0" aria-label="'+esc(t.name)+' 대표팀 명단 보기">'+
   '<div class="ktd-card-body"><div class="ktd-card-logo">'+countryFlagMarkup(t)+'</div>'+
   '<div class="ktd-card-copy"><div class="ktd-card-eyebrow"><strong>국제</strong> · NATIONAL TEAM</div>'+
   '<div class="ktd-card-name-row"><h3>'+esc(t.name)+'</h3></div>'+
   '<p class="ktd-card-meta">'+esc(t.en||t.code)+'</p><p class="ktd-card-meta">'+esc(t.sourceLabel||'선수단 자료 확인 중')+'</p></div></div>'+
   '<button class="ktd-card-action" type="button" data-ktd-country="'+esc(t.code)+'"><span>연도·대회별 명단 보기</span><span aria-hidden="true">›</span></button></article>';
  const g=t.gender==='women'?'WOMEN':t.gender==='men'?'MEN':'';
  const label=t.type==='pro'?'프로':t.type==='pro-sv'?'SV.LEAGUE':t.type==='university'?'대학':t.type==='high'?'고교':t.type==='middle'?'중학':t.type==='national'?'대표팀':'국제';
  const count=t.count===null||t.count===undefined?'':'<span class="ktd-card-count">'+esc(t.count)+'명</span>';
  const meta=t.type==='pro'?'<p class="ktd-card-meta">'+esc(t.coachRole||'감독')+' : <b>'+esc(t.coach||'정보 확인 중')+'</b></p>'+
     (t.asOf?'<p class="ktd-card-meta">명단 기준 '+esc(t.asOf)+'</p>':''):
     t.type==='pro-sv'?'<p class="ktd-card-meta">'+esc(t.en||'')+'</p><p class="ktd-card-meta">JAPAN · '+esc(t.season||'')+'</p>':
     t.type==='university'?'<p class="ktd-card-meta">'+(t.coach?'감독 : <b>'+esc(t.coach)+'</b>':'2026 대학 U-리그')+'</p>':
     '<p class="ktd-card-meta">'+esc(t.sourceLabel||'연결된 자료 보기')+'</p>';
  const action=t.action==='roster'?
   '<button class="ktd-card-action" type="button" data-ktd-roster="'+esc(t.code)+'"><span>선수명단 보기</span><span aria-hidden="true">›</span></button>':
   '<a class="ktd-card-action" href="'+esc(safeHref(t.href)?t.href:'teams.html')+'"><span>'+(t.type==='university'?'팀 정보 보기':t.type==='high'||t.type==='middle'?'대회 기록 보기':'관련 자료 보기')+'</span><span aria-hidden="true">›</span></a>';
  return '<article class="ktd-card" data-gender="'+esc(t.gender||'')+'" data-team-code="'+esc(t.code||'')+'">'+
    '<div class="ktd-card-body"><div class="ktd-card-logo">'+logoMarkup(t)+'</div><div class="ktd-card-copy">'+
    '<div class="ktd-card-eyebrow"><strong>'+esc(label)+'</strong>'+(g?' · '+g:'')+'</div>'+
    '<div class="ktd-card-name-row"><h3>'+esc(t.name)+'</h3>'+count+'</div>'+meta+
    '</div></div>'+action+'</article>';
 }
 function sourcePath(type,slug){return 'data/competitions/'+slug+'/'+type+'.json'}
 const readJSON=async path=>{
  const r=await fetch(path,{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status+' '+path);
  return r.json();
 };
 function start(){
  if(typeof document==='undefined')return;
  const el=id=>document.getElementById(id);
  const grid=el('ktdGrid'),catRow=el('ktdCategories'),genders=el('ktdGenderButtons');
  if(!grid||!catRow||!genders)return;
  const params=new URLSearchParams(location.search);
  const state={
   category:CATEGORIES[params.get('category')]?params.get('category'):'pro',
   gender:['men','women'].includes(params.get('gender'))?params.get('gender'):'men',
   query:'',entries:[],raw:null,season:'2026-27',token:0,teamFromURL:params.get('team')||'',selected:'',
   region:params.get('region')||'all',countryFromURL:params.get('country')||'',selectedCountry:'',
   countryIndex:null,selectionIndex:null,year:params.get('year')||'',
   proLeague:params.get('league')==='sv'?'sv':'vleague',proSeasons:[],requestedSeason:params.get('season')||''
  };
  const rosterArea=el('ktdRosterArea'),rosterHost=el('ktdRosterHost');
  const countryArea=el('ktdCountryArea'),regionRow=el('ktdRegionFilters'),proLeagueRow=el('ktdProLeagueFilters'),proSeasonSelect=el('ktdProSeasonSelect');
  const international=()=>window.KVLInternationalCountriesV1;
  let countryController=null;
  const hideCountry=()=>{
   countryController?.close?.();countryController=null;state.selectedCountry='';
   countryArea.hidden=true;countryArea.replaceChildren();grid.hidden=false;
  };
  const hideRoster=()=>{state.selected='';rosterArea.hidden=true;rosterHost.replaceChildren()};
  function syncUrl(){
   const p=new URLSearchParams(location.search);
   p.set('category',state.category);
   if(state.category!=='national')p.set('gender',state.gender);else p.delete('gender');
   if(state.category==='pro'&&state.selected)p.set('team',state.selected);else p.delete('team');
   if(state.category==='pro'&&state.proLeague==='sv')p.set('league','sv');else p.delete('league');
   if(state.category==='pro'&&state.proLeague==='sv'&&state.season)p.set('season',state.season);else p.delete('season');
   if(state.category==='international'&&state.selectedCountry)p.set('country',state.selectedCountry);else p.delete('country');
   if(state.category==='international'&&state.region!=='all')p.set('region',state.region);else p.delete('region');
   if(state.category==='international'&&state.selectedCountry&&state.year)p.set('year',String(state.year));else p.delete('year');
   history.replaceState(history.state,'',location.pathname+'?'+p.toString()+location.hash);
  }
  function controls(){
   const c=CATEGORIES[state.category];
   el('ktdHeading').textContent=c.title;
   el('ktdSectionEyebrow').textContent=c.eyebrow;
   catRow.querySelectorAll('[data-ktd-category]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.ktdCategory===state.category)));
   genders.hidden=state.category==='national';
   regionRow.hidden=state.category!=='international';
   if(proLeagueRow){
    proLeagueRow.hidden=state.category!=='pro';
    proLeagueRow.querySelectorAll('[data-ktd-pro-league]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.ktdProLeague===state.proLeague)));
   }
   if(proSeasonSelect){
    const values=state.proSeasons.length?state.proSeasons:state.proLeague==='vleague'?[state.season].filter(Boolean):[];
    const current=values.includes(state.season)?state.season:values[0]||'';
    proSeasonSelect.innerHTML=values.length?values.map(s=>'<option value="'+esc(s)+'"'+(s===current?' selected':'')+'>'+esc(s)+'</option>').join(''):'<option value="">등록 시즌 없음</option>';
    proSeasonSelect.disabled=!values.length;
   }
   regionRow.querySelectorAll('[data-ktd-region]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.ktdRegion===state.region)));
   genders.dataset.gender=state.gender;
   genders.querySelectorAll('[data-ktd-gender]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.ktdGender===state.gender)));
   el('ktdSearch').placeholder=state.category==='international'?'국가명·영문명 검색':state.category==='pro'?'구단명 검색':'팀 이름 검색';
  }
  function paint(){
   controls();
   const list=state.category==='international'&&international()
    ?international().filterCountries(state.entries,state.region,state.query)
    :state.entries.filter(t=>!state.query||[t.name,t.en,t.fullName].some(v=>String(v||'').toLowerCase().includes(state.query)));
   grid.innerHTML=list.length?list.map(cardMarkup).join(''):
    '<p class="ktd-empty">'+(state.category==='international'?'선택한 지역에서 등록된 대회 참가 국가가 없습니다. 이것이 모든 국가의 미참가를 뜻하지는 않습니다.':'검색 결과가 없습니다.')+'</p>';
   grid.setAttribute('aria-busy','false');
  }
  function loading(){
   grid.setAttribute('aria-busy','true');
   grid.innerHTML='<p class="ktd-loading">팀 정보를 불러오는 중입니다.</p>';
   el('ktdSummary').textContent='자료를 불러오는 중입니다.';
  }
  function note(msg){el('ktdSourceNote').textContent=msg}
  async function load(){
   const token=++state.token;hideRoster();hideCountry();controls();loading();
   try{
    let list=[],raw=null,summary='',sourceNote='';
    if(state.category==='pro'){
     if(state.proLeague==='sv'){
      const index=await readJSON(SOURCES.svIndex);
      const seasons=(index.seasons||[]).filter(x=>x.gender===state.gender).map(x=>x.season);
      state.proSeasons=[...new Set(seasons)].sort().reverse();
      const wanted=validSeason(state.requestedSeason)&&state.proSeasons.includes(state.requestedSeason)?state.requestedSeason:state.proSeasons[0]||'2026-27';
      state.season=wanted;
      list=buildSVLeague(index,state.gender,wanted);
      raw={league:'sv',index,gender:state.gender,season:wanted};
      if(list.length){
       summary=wanted+' 시즌 · '+list.length+'개 구단 · 등록 선수 '+totalPlayers(list)+'명';
       sourceNote='사용자 제공 2026-27 SV.LEAGUE 시즌 등록 스냅샷 기준 · 14인 경기 엔트리와 구분 · 직접 Volleybox 211명';
      }else{
       summary='현재 SV.LEAGUE는 남자부 2026-27 시즌 명단만 등록되어 있습니다.';
       sourceNote='여자부 SV.LEAGUE 시즌 명단은 이번 범위에서 생성하지 않습니다.';
      }
     }else{
      const index=await readJSON(SOURCES.index);
      const season=index.currentSeason;
      if(!validSeason(season)||!index.seasons?.some(x=>x.season===season&&x.status==='active'))throw Error('활성화된 시즌 정보를 확인할 수 없습니다.');
      state.proSeasons=[season];
      const prefix='v-league-'+state.gender+'-'+season;
      const result=await Promise.all([
       readJSON(sourcePath('data',prefix)),
       readJSON(sourcePath('rosters',prefix)),
       readJSON(SOURCES.coaching).catch(()=>null)
      ]);
      const [competition,rosters,staff]=result;
      list=buildPro(competition.participants,rosters,staff,state.gender,season);
      raw={league:'vleague',participants:competition.participants,rosters,gender:state.gender,season};
      summary=season+' 시즌 · '+list.length+'개 구단 · 등록 선수 '+totalPlayers(list)+'명';
      sourceNote='구단 선수 수는 GitHub KOVO 공시 자동 갱신 명단 기준 · 감독은 2026-27 시즌 별도 확인 자료';
      state.season=season;
     }
    }else if(state.category==='university'){
     const slug='university-league-'+state.gender+'-2026';
     const [competition,rosters,staff]=await Promise.all([
      readJSON(sourcePath('data',slug)),
      readJSON(sourcePath('rosters',slug)),
      readJSON('data/master/university_staff_2026.json').catch(()=>({teams:{}}))
     ]);
     list=buildUniversity(competition.participants,rosters,staff,state.gender);
     summary='2026 KUSF 대학 U-리그 · '+list.length+'개 팀';
     sourceNote='2026 대회별 선수명단 스냅샷입니다. 현행 구단 등록 자동화와 별도로 관리됩니다.';
    }else if(state.category==='high'||state.category==='middle'){
     const division=state.category+'-'+state.gender;
     const names={'school-ibk-2026':'IBK기업은행배','school-presidents-2026':'대통령배','school-iksan-2026':'익산 연맹전','school-samcheok-2026':'삼척 연맹전','school-spring-2026':'춘계대회'};
     const inputs=SOURCES.school.map(prefix=>({slug:prefix+'-'+division,label:names[prefix]||prefix}));
     const values=await Promise.allSettled(inputs.map(x=>readJSON(sourcePath('data',x.slug))));
     const snapshots=values.flatMap((x,i)=>x.status==='fulfilled'?[{slug:inputs[i].slug,label:inputs[i].label,...x.value}]:[]);
     if(!snapshots.length)throw Error('학교 대회 자료를 불러오지 못했습니다.');
     list=buildSchool(snapshots,state.category,state.gender);
     summary='2026 대회 참가 이력에서 확인된 '+list.length+'개 팀';
     sourceNote='2026년 연결된 학교대회 참가 기록을 합쳐 표시합니다. 학교 전체 등록팀 명부가 아닌 대회 참가팀 목록입니다.';
    }else if(state.category==='international'){
     const api=international();
     if(!api)throw Error('국가별 팀 모듈을 불러오지 못했습니다.');
     const [directory,sourceIndex,selection]=await Promise.all([
      readJSON('data/international/country-directory-v1.json'),
      readJSON('data/international/country-roster-index-v1.json'),
      readJSON('data/international/country-selection-index-v1.json')
     ]);
     if(!api.validateIndex(sourceIndex,directory)||!api.validateSelection(selection))
      throw Error('국제 대표팀 출처 색인 오류');
     list=api.cardEntries(directory,sourceIndex,state.gender,selection);
     raw={directory,sourceIndex,selection};
     state.countryIndex=raw;state.selectionIndex=selection;
     summary='2026 기존 대회 참가 국가·지역 '+directory.country_count+'개 · '+(state.gender==='men'?'남자':'여자')+
       ' 명단 스냅샷 '+sourceIndex.snapshots.filter(x=>x.gender===state.gender).length+'건';
     sourceNote='VNL·아시안게임·AVC 2026 대회 등록 자료 기반. 후보·최종 명단은 공식 근거가 있을 때만 별도 구분합니다.';
    }else{
     list=curated(state.category);
     summary='연결된 기존 자료 '+list.length+'개';
     sourceNote='실제 구축된 KVL 자료로 이동합니다. 국가별 선수단 통합 팀 DB는 후속 확장 대상입니다.';
    }
    if(token!==state.token)return;
    state.entries=list;state.raw=raw;
    el('ktdSummary').textContent=summary;
    note(sourceNote);
    paint();syncUrl();
    if(state.category==='pro'&&state.teamFromURL&&list.some(x=>x.code===state.teamFromURL)){
     const chosen=state.teamFromURL;state.teamFromURL='';
     await openRoster(chosen);
    }
    if(state.category==='international'&&state.countryFromURL&&list.some(x=>x.code===state.countryFromURL)){
     const code=state.countryFromURL;state.countryFromURL='';
     openCountry(code);
    }
   }catch(error){
    if(token!==state.token)return;
    state.entries=[];state.raw=null;
    grid.innerHTML='<div class="ktd-error">팀 자료를 불러오지 못했습니다. 새로고침으로 다시 시도하거나 <a href="competition-engine.html?competition=v-league-men-2026-27&view=rosters">V-리그 명단 페이지</a>에서 확인하세요.</div>';
    grid.setAttribute('aria-busy','false');
    el('ktdSummary').textContent='팀 자료 확인 실패';
    note('KVL 데이터 연결 오류 · 기존 명단은 변경되지 않았습니다.');
    console.error('[KVL teams directory]',error);
   }
  }
  function openCountry(code){
   if(state.category!=='international'||!state.raw?.directory)return;
   const country=state.raw.directory.countries.find(c=>c.code===code);
   if(!country)return;
   hideRoster();hideCountry();state.selectedCountry=code;state.countryFromURL='';
   const api=international(),gender=state.gender;
   countryArea.hidden=false;grid.hidden=true;
   countryController=api.render(countryArea,{
    country,index:state.raw.sourceIndex,selection:state.raw.selection,gender,year:state.year,
    onClose:()=>{hideCountry();state.year='';syncUrl();grid.scrollIntoView({behavior:'smooth',block:'start'})},
    onYearChange:year=>{state.year=year;syncUrl()}
   });
   state.year=countryController.year;syncUrl();
   countryArea.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function openRoster(code){
   if(state.category!=='pro'||!state.raw)return;
   const t=state.entries.find(x=>x.code===code);if(!t)return;
   const token=state.token,gender=state.gender,season=state.season;
   if(state.raw.league!=='sv'&&!state.raw.rosters?.[code])return;
   state.selected=code;state.teamFromURL='';syncUrl();
   rosterArea.hidden=false;
   el('ktdRosterHeading').textContent=t.name+' · '+season+' 선수명단';
   rosterHost.innerHTML='<p class="ktd-loading">'+(state.raw.league==='sv'?'시즌 등록 선수와 국적 정보를 불러오고 있습니다.':'검증된 선수 프로필·출신학교 정보를 연결하고 있습니다.')+'</p>';
   try{
    if(state.raw.league==='sv'){
     const team=await readJSON(t.sourcePath);
     if(token!==state.token||state.selected!==code)return;
     const renderer=window.KVLProLeagueRosterV1;
     if(!renderer?.validateTeam?.(team,{code,season})||!renderer.render(rosterHost,team,{logo:t.logo}))throw Error('SV.LEAGUE roster renderer unavailable');
    }else{
     // Season roster is always the publisher-owned JSON. The bridge only adds verified display-level fields.
     const base={competitionId:'KVL-COMP-VLEAGUE-'+(gender==='men'?'M':'W')+'-'+season,
      participants:state.raw.participants,rosters:state.raw.rosters};
     let data=base;
     if(season==='2026-27'&&window.KVLVLeagueDraftBridgeV1){
      try{
       const source=await window.KVLVLeagueDraftBridgeV1.load();
       data=window.KVLVLeagueDraftBridgeV1.reconcileCurrent(base,source);
      }catch(err){console.warn('[KVL teams: verified draft evidence unavailable]',err)}
     }
     if(token!==state.token||state.selected!==code)return;
     const renderer=window.KVLVLeagueRosterV2;
     const done=season==='2026-27'&&renderer?.render(rosterHost,data,t,data.rosters[code].players);
     if(!done)rosterHost.innerHTML='<p class="ktd-empty">현재 시즌 상세 명단은 <a href="'+esc(t.href)+'">V-리그 대회 페이지</a>에서 확인할 수 있습니다.</p>';
    }
    rosterArea.scrollIntoView({behavior:'smooth',block:'start'});
   }catch(err){
    if(token!==state.token||state.selected!==code)return;
    rosterHost.innerHTML='<p class="ktd-error">명단을 표시하지 못했습니다.</p>';
    console.error('[KVL teams roster]',err);
   }
  }
  catRow.addEventListener('click',event=>{
   const button=event.target.closest('[data-ktd-category]');
   if(!button||!CATEGORIES[button.dataset.ktdCategory])return;
   if(state.category===button.dataset.ktdCategory)return;
   state.category=button.dataset.ktdCategory;state.query='';state.teamFromURL='';state.countryFromURL='';state.year='';
   el('ktdSearch').value='';load();
  });
  genders.addEventListener('click',event=>{
   const button=event.target.closest('[data-ktd-gender]');
   if(!button||!['men','women'].includes(button.dataset.ktdGender)||state.gender===button.dataset.ktdGender)return;
   state.gender=button.dataset.ktdGender;state.query='';state.teamFromURL='';state.countryFromURL='';state.year='';
   state.requestedSeason='';el('ktdSearch').value='';load();
  });
  proLeagueRow?.addEventListener('click',event=>{
   const button=event.target.closest('[data-ktd-pro-league]');
   if(state.category!=='pro'||!button||!['vleague','sv'].includes(button.dataset.ktdProLeague)||state.proLeague===button.dataset.ktdProLeague)return;
   state.proLeague=button.dataset.ktdProLeague;state.query='';state.selected='';state.teamFromURL='';state.requestedSeason='';
   el('ktdSearch').value='';load();
  });
  proSeasonSelect?.addEventListener('change',event=>{
   const season=String(event.target.value||'');
   if(state.category!=='pro'||state.proLeague!=='sv'||!validSeason(season)||season===state.season)return;
   state.requestedSeason=season;state.teamFromURL='';load();
  });
  regionRow.addEventListener('click',event=>{
   const button=event.target.closest('[data-ktd-region]');
   if(state.category!=='international'||!button||!international()?.REGIONS[button.dataset.ktdRegion])return;
   state.region=button.dataset.ktdRegion;if(state.selectedCountry){hideCountry();state.year=''}paint();syncUrl();
  });
  // Keep existing monograms/emoji as graceful fallbacks if a verified image asset fails.
  grid.addEventListener('error',event=>{
   const img=event.target;
   if(!img?.matches?.('img.ktd-country-flag-image,img.ktd-team-logo-image'))return;
   img.hidden=true;
   const fallback=img.nextElementSibling;
   if(fallback?.classList.contains('ktd-country-flag-fallback')||fallback?.classList.contains('ktd-team-logo-fallback'))fallback.hidden=false;
  },true);
  grid.addEventListener('click',event=>{
   const countryButton=event.target.closest('[data-ktd-country]');
   if(countryButton){openCountry(countryButton.dataset.ktdCountry);return}
   const countryCard=event.target.closest('[data-ktd-country-card]');
   if(countryCard){openCountry(countryCard.dataset.ktdCountryCard);return}
   const button=event.target.closest('[data-ktd-roster]');
   if(button)openRoster(button.dataset.ktdRoster);
  });
  grid.addEventListener('keydown',event=>{
   const card=event.target.closest('[data-ktd-country-card]');
   if(card&&event.target===card&&(event.key==='Enter'||event.key===' ')){
    event.preventDefault();openCountry(card.dataset.ktdCountryCard);
   }
  });
  el('ktdSearch').addEventListener('input',event=>{
   if(state.selectedCountry){hideCountry();state.year='';syncUrl()}
   state.query=event.target.value.trim().toLowerCase();paint();
  });
  el('ktdRefresh').addEventListener('click',()=>{state.teamFromURL=state.selected||'';state.countryFromURL=state.selectedCountry||'';load()});
  el('ktdCloseRoster').addEventListener('click',()=>{hideRoster();syncUrl()});
  load();
 }
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
 }
 return {SOURCES,CATEGORIES,validSeason,validCode,safeLogo,safeHref,teamRoute,buildPro,buildSVLeague,buildUniversity,buildSchool,curated,cardMarkup,totalPlayers};
});

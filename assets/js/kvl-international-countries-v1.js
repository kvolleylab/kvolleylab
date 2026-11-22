/* Country / competition historical rosters. All official data remains in its source file. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLInternationalCountriesV1=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\x27':'&#39;'}[c]));
const CODE=/^[A-Z]{3}$/;
const ID=/^KVL-P-\d{6}$/;
const ALLOWED_STAGES=new Set(['candidate_pool','longlist','week','final','match']);
const STAGE_LABEL={candidate_pool:'공식 후보 엔트리',longlist:'공식 등록 후보',week:'주차별 엔트리',final:'최종 엔트리',match:'경기 엔트리'};
const REGISTERED_LABEL={final:'최종 명단',departure:'출국 명단',tournament_registration:'대회 공개 명단'};
const REGIONS={all:'전체',asia:'아시아',europe:'유럽',north_america:'북중미',south_america:'남미',oceania:'오세아니아',africa:'아프리카'};
const SAFE_SOURCE=/^data\/(?:competitions|competition)\/[a-z0-9_-]+(?:\/(?:data|rosters))?\.json$/;
const SAFE_CURRENT_CLUB='data/international/player-club-registry-2026-27-v1.json';
const SAFE_COMPETITION=/^(?:competition-engine\.html\?competition=[a-z0-9-]+(?:&view=rosters)?|avc-men-cup\.html|international-competition-avc-men-continental-2026\.html)$/;
const safeExternal=x=>/^https:\/\/(?:en\.volleyballworld\.com|www\.volleyballworld\.com|volleybox\.net|www\.volleybox\.net|asianvolleyball\.net|www\.asianvolleyball\.net|kovo\.co\.kr|www\.kovo\.co\.kr|www\.nikkansports\.com|volleyball\.org\.au)\//.test(String(x||''))?String(x):'';
const safeAnySource=x=>/^https:\/\/[a-z0-9.-]+(?:\/[^\s<>"']*)?$/i.test(String(x||''))?String(x):'';
const norm=x=>String(x||'').trim().normalize('NFKC').toLowerCase().replace(/\s+/g,' ');
const flagEmoji=iso2=>/^[a-z]{2}$/.test(String(iso2||''))?[...iso2.toUpperCase()].map(c=>String.fromCodePoint(c.charCodeAt(0)-65+0x1F1E6)).join(''):'🏐';
const countryFlagImage=country=>{
 const code=String(country?.flag_iso2||'');
 const emoji=esc(flagEmoji(code));
 if(!/^[a-z]{2}$/.test(code))return '<span class="ktd-country-flag-fallback" aria-hidden="true">'+emoji+'</span>';
 return '<img class="ktd-country-flag-image" src="assets/images/flags/4x3/'+esc(code)+'.svg" alt="'+esc(country.name_ko)+' 국기" decoding="async">'+
  '<span class="ktd-country-flag-fallback" aria-hidden="true" hidden>'+emoji+'</span>';
};
const dataCache=new Map();
const readJSON=async p=>{
 if(!SAFE_SOURCE.test(p)&&p!=='data/master/player_master_international_v1.json'&&p!==SAFE_CURRENT_CLUB)throw Error('Unapproved roster source path: '+p);
 if(!dataCache.has(p)){
  dataCache.set(p,fetch(p,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Source unavailable '+p+' HTTP '+r.status);return r.json()}).catch(e=>{dataCache.delete(p);throw e}));
 }
 return dataCache.get(p);
};
function validateDirectory(db){
 if(!db||db.schema_version!==1||!Array.isArray(db.countries)||db.country_count!==db.countries.length)return false;
 const seen=new Set();
 return db.countries.every(c=>{
  if(!CODE.test(c.code)||seen.has(c.code)||!c.name_ko||!c.name_en||!/^[a-z]{2}$/.test(c.flag_iso2)||!REGIONS[c.region])return false;
  seen.add(c.code);return true;
 });
}
function validateIndex(db,directory){
 if(!db||db.schema_version!==1||!Array.isArray(db.snapshots)||db.snapshot_count!==db.snapshots.length||!validateDirectory(directory))return false;
 const ids=new Set(),codes=new Set(directory.countries.map(c=>c.code));
 return db.snapshots.every(s=>{
  if(!codes.has(s.country_code)||!['men','women'].includes(s.gender)||!Number.isInteger(s.year)
   ||s.year<2000||!SAFE_SOURCE.test(s.source_path)||!['embedded','separate','team-array','cup'].includes(s.source_format)
   ||!['final','departure','tournament_registration'].includes(s.stage)||!Number.isInteger(s.player_count)
   ||s.player_count<0||!SAFE_COMPETITION.test(s.competition_url)||ids.has(s.snapshot_id))return false;
  ids.add(s.snapshot_id);return true;
 });
}
function validateSelection(db){
 if(!db||db.schema_version!==1||!Array.isArray(db.sets)||db.recorded_candidate_sets!==db.sets.length)return false;
 const ids=new Set();
 return db.sets.every(s=>{
  if(!s||!CODE.test(s.country_code)||!['men','women'].includes(s.gender)||!Number.isInteger(s.year)
    ||!ALLOWED_STAGES.has(s.stage)||!String(s.competition_slug||'').match(/^[a-z0-9-]+$/)
    ||!String(s.source_id||'').trim()||!safeAnySource(s.source_url)
    ||s.review_status!=='VERIFIED'||!/^[0-9a-f]{64}$/.test(s.source_sha256||'')
    ||!/^\d{4}-\d{2}-\d{2}$/.test(s.reviewed_at||'')
    ||!/^\d{4}-\d{2}-\d{2}$/.test(s.published_at||'')||!Array.isArray(s.players)
    ||!s.snapshot_id||ids.has(s.snapshot_id))return false;
  ids.add(s.snapshot_id);
  const people=new Set();
  return s.players.every(p=>{
   if(!p||!(p.name_ko||p.name_en)||p.verified_player_id&&(!ID.test(p.verified_player_id)||!p.identity_source_id))return false;
   if(p.verified_player_id){if(people.has(p.verified_player_id))return false;people.add(p.verified_player_id);}
   return true;
  });
 });
}
function yearsFor(index,selection,code,gender){
 return [...new Set([
  ...(index?.snapshots||[]).filter(s=>s.country_code===code&&s.gender===gender).map(s=>s.year),
  ...(selection?.sets||[]).filter(s=>s.country_code===code&&s.gender===gender).map(s=>s.year)
 ])].sort((a,b)=>b-a);
}
function cardEntries(directory,index,gender,selection){
 if(!validateIndex(index,directory))throw Error('Invalid country roster index');
 return directory.countries.map(c=>{
  const relevant=index.snapshots.filter(s=>s.country_code===c.code&&s.gender===gender);
  const candidates=(selection?.sets||[]).filter(s=>s.country_code===c.code&&s.gender===gender);
  return {code:c.code,name:c.name_ko,en:c.name_en,region:c.region,gender,
   flag:flagEmoji(c.flag_iso2),flag_iso2:c.flag_iso2,snapshots:relevant.length,
   sourceLabel:relevant.length?gender==='men'?'남자대회 '+relevant.length+'건':'여자대회 '+relevant.length+'건':candidates.length?'후보·선발 자료 '+candidates.length+'건':'선택한 성별의 저장 자료 없음',
   type:'international',action:'country',count:null};
 });
}
function filterCountries(entries,region,q){
 const search=norm(q);
 return entries.filter(c=>(region==='all'||c.region===region)&&(!search||norm(c.name).includes(search)||norm(c.en).includes(search)||norm(c.code).includes(search)));
}
function sourceTeam(ref,json){
 if(!SAFE_SOURCE.test(ref?.source_path))throw Error('Invalid source path');
 if(ref.source_format==='embedded')return json?.rosters?.[ref.source_team_key]||null;
 if(ref.source_format==='separate')return json?.[ref.source_team_key]||null;
 if(ref.source_format==='team-array')return (json?.teams||[]).find(x=>x.code===ref.source_team_key)||null;
 if(ref.source_format==='cup')return (json?.teams||[]).find(x=>x.country===ref.source_team_key)||null;
 return null;
}
function normalizePlayer(p){
 const english=String(p.en||p.name_en||(p.nameKo&&p.name)||'').trim();
 const ko=String(p.nameKo||p.name_ko||p.name||p.en||p.officialName||'').trim();
 const number=Number.isInteger(Number(p.number))&&String(p.number??'')!==''?Number(p.number):null;
 const position=Array.isArray(p.positions)?p.positions.join('/'):String(p.position||'');
 const height=Number(p.heightCm||p.height_cm||p.height)||null;
 const dob=/^\d{4}-\d{2}-\d{2}$/.test(String(p.dob||''))?p.dob:'';
 const official=safeExternal(p.officialProfileUrl||p.vnlProfile||'');
 const volleybox=safeExternal(p.volleybox_url||p.volleybox||'');
 const clubVerified=p.club?.confirmed===true&&typeof p.club.name==='string'&&!!p.club.name.trim()&&!['미확인','unknown','-'].includes(norm(p.club.name));
 return {name:ko,en:english,number,position,height,dob,source_player_id:p.playerId||p.officialPlayerId||'',
  club:clubVerified?p.club.name.trim():'',club_country:clubVerified?String(p.club.country||p.club.leagueCountry||'').trim():'',
  club_league:clubVerified?String(p.club.leagueName||'').trim():'',
  source_entry_status:String(p.entryStatus||''),official_profile:official,volleybox,
  is_volleybox_search:/\/search(?:\?|\/)/.test(volleybox)};
}
function verifiedProfileLink(p,gender,country,master,collision){
 const id=p?.source_player_id;
 if(!ID.test(String(id||''))||collision?.isConflict?.(id)||!Array.isArray(master))return'';
 const matches=master.filter(x=>x?.system?.player_id===id);
 if(matches.length!==1)return'';
 const m=matches[0],identity=m.identity||{};
 if(String(identity.gender||'').toUpperCase()!==(gender==='men'?'M':'W')||norm(identity.nationality)!==norm(country.name_en)
    ||!p.dob||p.dob!==identity.birth_date)return'';
 if(!(p.en&&norm(p.en)===norm(identity.name_en)||p.name&&norm(p.name)===norm(identity.name_ko)))return'';
 return 'player.html?id='+encodeURIComponent(id);
}
/* No cut/withdrawal claims from missing names or unmatched identities. */
function compareSelection(candidate,finalSet){
 if(!candidate||!Array.isArray(candidate.players))return[];
 const reliableFinal=finalSet&&finalSet.stage==='final'&&finalSet.review_status==='VERIFIED'
  &&/^[0-9a-f]{64}$/.test(finalSet.source_sha256||'')
  &&finalSet.identities_complete===true&&finalSet.official_roster_complete===true
  &&finalSet.country_code===candidate.country_code&&finalSet.gender===candidate.gender
  &&finalSet.year===candidate.year&&finalSet.competition_slug===candidate.competition_slug
  &&Array.isArray(finalSet.players)&&finalSet.player_count===finalSet.players.length
  &&finalSet.players.every(p=>ID.test(p.verified_player_id||'')&&p.identity_source_id)
  &&safeAnySource(finalSet.source_url);
 const known=new Set(reliableFinal?finalSet.players.map(p=>p.verified_player_id):[]);
 return candidate.players.map(p=>{
  const id=p.verified_player_id;
  let state='unresolved';
  if(reliableFinal&&ID.test(id||'')&&p.identity_source_id){
   state=known.has(id)?'in_final':'not_in_recorded_final';
  }
  return {...p,selection_state:state};
 });
}
const outcomeLabel=state=>state==='in_final'?'최종 명단 포함':state==='not_in_recorded_final'?'최종 등록 명단에 없음 · 사유 미확인':'비교 근거 미확인';
function render(host,opts){
 const {country,index,selection,gender,onClose,onYearChange}=opts;
 if(!validateSelection(selection))throw Error('Unverified nomination registry');
 const matches=index.snapshots.filter(s=>s.country_code===country.code&&s.gender===gender);
 const allYears=yearsFor(index,selection,country.code,gender);
 const requested=Number(opts.year);
 let year=allYears.includes(requested)?requested:allYears[0]||2026;
 let selectedSnapshot=null,alive=true;
 const candidateSets=()=>selection.sets.filter(s=>s.country_code===country.code&&s.gender===gender&&s.year===year);
 host.innerHTML='<div class="ktd-country-panel">'+
  '<div class="ktd-country-top"><div class="ktd-country-heading"><div class="ktd-country-flag">'+countryFlagImage(country)+'</div>'+
  '<div><p class="ktd-section-eyebrow">NATIONAL TEAM HISTORY · '+esc(country.code)+'</p>'+
  '<h2>'+esc(country.name_ko)+'</h2><p>'+esc(country.name_en)+' · '+(gender==='men'?'남자대표팀':'여자대표팀')+'</p></div></div>'+
  '<div class="ktd-country-head-actions"><button type="button" class="ktd-country-back" data-country-close>← 국가 목록</button>'+
  '<label class="ktd-country-year-select"><span>연도</span><select data-country-year-select aria-label="연도별 명단 선택"></select></label></div></div>'+
  '<section data-country-unified class="ktd-country-unified" aria-label="연도별 통합 선수명단" hidden></section>'+
  '<nav data-country-events class="ktd-country-links" aria-label="대회 바로가기"></nav>'+
  '<section class="ktd-country-selection"><h3>후보·선발 이력</h3><div data-country-selection></div></section>'+
  '<section data-country-roster class="ktd-country-roster" hidden aria-live="polite"></section></div>';
 const onFlagLoadError=event=>{
  const img=event.target;
  if(!img?.matches?.('img.ktd-country-flag-image'))return;
  img.hidden=true;
  const fallback=img.nextElementSibling;
  if(fallback?.classList.contains('ktd-country-flag-fallback'))fallback.hidden=false;
 };
 host.addEventListener('error',onFlagLoadError,true);
 const yearSelect=host.querySelector('[data-country-year-select]'),eventsHost=host.querySelector('[data-country-events]');
 const rosterHost=host.querySelector('[data-country-roster]'),selectionHost=host.querySelector('[data-country-selection]');
 const unifiedHost=host.querySelector('[data-country-unified]');
 let request=0,unifiedTicket=0,unifiedInstance=null;
 async function showUnified(){
  const ticket=++unifiedTicket,displayYear=year;
  unifiedInstance?.destroy?.();unifiedInstance=null;unifiedHost.replaceChildren();unifiedHost.hidden=true;
  const refs=matches.filter(x=>x.year===displayYear);
  if(!refs.length)return;
  const ui=typeof window==='object'?window.KVLInternationalUnifiedRosterV1:null;
  if(!ui){console.warn('[KVL international: unified module unavailable]');return}
  unifiedHost.hidden=false;
  unifiedHost.innerHTML='<p class="ktd-loading">원본 대회명단을 대조하고 있습니다.</p>';
  try{
   const sourceSets=await Promise.all(refs.map(async snapshot=>{
    const raw=await readJSON(snapshot.source_path),team=sourceTeam(snapshot,raw);
    if(!team||!Array.isArray(team.players))throw Error('대회 원본명단 확인 실패: '+snapshot.snapshot_id);
    return {snapshot,team};
   }));
   const [clubIndex,master,currentClubs,volleyboxRegistry]=await Promise.all([
    displayYear===2026&&gender==='men'&&refs.some(x=>x.competition_slug==='avc-men-continental-2026')
      ?readJSON('data/competitions/avc-men-continental-2026-clubs-2026-27.json').catch(err=>{
        console.warn('[KVL international: club evidence unavailable]',err);return null;
       }):Promise.resolve(null),
    sourceSets.some(x=>x.team.players.some(p=>ID.test(p.playerId||'')))
      ?readJSON('data/master/player_master_international_v1.json').catch(err=>{
         console.warn('[KVL international: player ID master unavailable]',err);return [];
       }):Promise.resolve([]),
    readJSON('data/international/player-club-registry-2026-27-v1.json').catch(err=>{
      console.warn('[KVL international: current club registry unavailable]',err);return null;
    }),
    displayYear===2026&&gender==='men'&&refs.some(x=>x.competition_slug==='avc-men-continental-2026')
      ?readJSON('data/competitions/avc-men-continental-2026-volleybox-links.json').catch(err=>{
        console.warn('[KVL international: Volleybox evidence unavailable]',err);return null;
       }):Promise.resolve(null)
   ]);
   if(!alive||ticket!==unifiedTicket||displayYear!==year)return;
   const collision=typeof window==='object'?window.KVLPlayerIdCollisionV1:null;
   const model=ui.build(sourceSets,{
    country,gender,year:displayYear,clubRegistry:clubIndex,playerClubRegistry:currentClubs,volleyboxRegistry,
    profileResolver:raw=>verifiedProfileLink(normalizePlayer(raw),gender,country,master,collision)
   });
   unifiedInstance=ui.render(unifiedHost,model);
  }catch(err){
   if(!alive||ticket!==unifiedTicket||displayYear!==year)return;
   unifiedHost.innerHTML='<p class="ktd-error">통합 명단의 일부 원본 확인에 실패해 잘못된 참가 이력을 만들지 않았습니다. 위의 대회별 명단 보기에서 개별 자료를 확인할 수 있습니다.</p>';
   console.error('[KVL international: unified roster]',err);
  }
 }
 function eventOrderLabel(s){
  const title=String(s?.competition_title||'').replace(/^\d{4}\s*/,'').replace(/(?:남자부|여자부)$/,'').trim();
  if(/^VNL$/i.test(title)||/VNL/i.test(title))return'VNL';
  if(/아시안게임/.test(title))return'아시안게임';
  if(/AVC.*대륙선수권/i.test(title)||/대륙선수권/.test(title))return'AVC 대륙선수권';
  if(/AVC.*컵/i.test(title))return'AVC컵';
  return title||'대회 페이지';
 }
 function eventLinkRank(s){
  const slug=String(s?.competition_slug||'');
  if(slug.startsWith('vnl-'))return 10;
  if(slug.startsWith('asian-games-'))return 20;
  if(slug.includes('continental'))return 30;
  if(slug.includes('cup'))return 40;
  return 50;
 }
 function showYear(){
  selectedSnapshot=null;request++;rosterHost.hidden=true;rosterHost.replaceChildren();
  yearSelect.innerHTML=allYears.length?allYears.map(y=>'<option value="'+y+'"'+(y===year?' selected':'')+'>'+y+'</option>').join(''):
   '<option value="">연도 없음</option>';
  yearSelect.disabled=!allYears.length;
  showUnified();
  const rows=matches.filter(s=>s.year===year).sort((a,b)=>eventLinkRank(a)-eventLinkRank(b)||eventOrderLabel(a).localeCompare(eventOrderLabel(b),'ko'));
  eventsHost.innerHTML=rows.length?
   '<span class="ktd-country-links-label">대회 바로가기</span>'+
   rows.map(s=>'<a href="'+esc(s.competition_url)+'" class="ktd-country-link">'+
     '<span>'+esc(eventOrderLabel(s))+'</span><span aria-hidden="true">↗</span></a>').join(''):'';
  const candidate=candidateSets();
  selectionHost.innerHTML=candidate.length?candidate.map(s=>'<article class="ktd-country-candidate">'+
   '<div><strong>'+esc(s.competition_slug)+' · '+esc(STAGE_LABEL[s.stage])+'</strong><p>'+esc(s.players.length)+'명 · '+esc(s.published_at)+'</p></div>'+
   '<div><button type="button" data-candidate-id="'+esc(s.snapshot_id)+'">후보 확인</button>'+
   '<a href="'+esc(s.source_url)+'" target="_blank" rel="noopener noreferrer">원문 출처</a></div></article>').join(''):
   '<p class="ktd-country-unverified">공식 후보 엔트리는 아직 검증·등록되지 않았습니다. 현재 대회 등록 명단에 없는 선수를 탈락이나 국가 미참가로 판단하지 않습니다.</p>';
 }
 async function showSnapshot(id){
  const snap=matches.find(s=>s.snapshot_id===id&&s.year===year);
  if(!snap)return;
  const ticket=++request;selectedSnapshot=id;
  rosterHost.hidden=false;rosterHost.innerHTML='<p class="ktd-loading">원본 대회 명단을 불러오는 중입니다.</p>';
  try{
   const db=await readJSON(snap.source_path),team=sourceTeam(snap,db);
   if(!team||!Array.isArray(team.players))throw Error('Missing original tournament roster');
   const players=team.players.map(normalizePlayer).sort((a,b)=>{
    const an=Number.isInteger(Number(a.number))?Number(a.number):Number.POSITIVE_INFINITY;
    const bn=Number.isInteger(Number(b.number))?Number(b.number):Number.POSITIVE_INFINITY;
    return an-bn||String(a.en||a.name||'').localeCompare(String(b.en||b.name||''),'en');
   });
   const sourceCountChanged=players.length!==snap.player_count;
   let master=[],clubRegistry=null,volleyboxRegistry=null;
   if(snap.competition_slug==='avc-men-continental-2026'&&gender==='men'){
    try{
     [clubRegistry,volleyboxRegistry]=await Promise.all([
      readJSON('data/competitions/avc-men-continental-2026-clubs-2026-27.json'),
      readJSON('data/competitions/avc-men-continental-2026-volleybox-links.json')
     ]);
    }catch(e){console.warn('[KVL international per-event evidence registry optional]',e)}
   }
   if(players.some(p=>ID.test(p.source_player_id||''))){
    try{master=await readJSON('data/master/player_master_international_v1.json')}catch(e){console.warn('[KVL international master optional]',e)}
   }
   if(!alive||ticket!==request)return;
   const collision=typeof window!=='undefined'?window.KVLPlayerIdCollisionV1:null;
   rosterHost.innerHTML='<header class="ktd-country-roster-head"><div><h3>'+esc(snap.competition_title)+'</h3>'+
    '<p>'+esc(REGISTERED_LABEL[snap.stage])+' · '+esc(players.length)+'명 · '+esc(snap.source_status_label)+'</p></div>'+
    '<button type="button" data-country-roster-close aria-label="대회 명단 닫기">닫기 ×</button></header>'+
    (sourceCountChanged?'<p class="ktd-country-warning">원본 명단이 색인 작성 시점과 달라졌습니다. 정보 재검수가 필요합니다.</p>':'')+
    '<div class="ktd-country-roster-table"><div class="ktd-country-roster-label"><span>NO.</span><span>선수</span><span>POS</span><span>신장</span><span>명단 구분</span></div>'+
    players.map(p=>{
     const link=verifiedProfileLink(p,gender,country,master,collision);
     const profile=p.official_profile?'<a href="'+esc(p.official_profile)+'" target="_blank" rel="noopener noreferrer">공식 프로필</a>':'';
     const registeredVolleybox=volleyboxRegistry?.teams?.[country.code]?.[String(p.number)]||'';
     const volleyboxUrl=/^https:\/\/volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p\d+\/?$/i.test(registeredVolleybox)?registeredVolleybox:p.volleybox;
     const volleyboxSearch=!registeredVolleybox&&p.is_volleybox_search;
     const vol=volleyboxUrl?'<a href="'+esc(volleyboxUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="'+(volleyboxSearch?'Volleybox 검색 결과 열기':'Volleybox 선수 프로필 열기')+'">'+(volleyboxSearch?'VB 검색':'VB-&gt;')+'</a>':'';
     const registered=clubRegistry?.teams?.[country.code]?.[String(p.number)];
     const verified=registered?.status==='CONFIRMED'&&typeof registered.club==='string'
      &&!!registered.club.trim()&&/^https:\/\//.test(registered.source||'');
     const club=verified?registered.club:p.club;
     const leagueCountry=verified?String(registered.leagueCountry||'').trim():p.club_country;
     const leagueName=verified?String(registered.leagueName||'').trim():p.club_league;
     // Match the year-unified roster's country-only label. Do not infer unknown leagues.
     const countryFormatter=typeof window==='object'?window.KVLInternationalUnifiedRosterV1?.countryLabel:null;
     const countryDisplay=leagueCountry?(typeof countryFormatter==='function'?countryFormatter(leagueCountry):leagueCountry.toUpperCase()):'';
     const clubLine=club?'<span class="ktd-country-club"><span>'+esc(club)+'</span>'+
      (countryDisplay?'<span class="ktd-country-club-league"'+(leagueName?' title="'+esc('확인된 리그: '+leagueName)+'"':'')+'> · '+esc(countryDisplay)+'</span>':'')+'</span>':'';
     return '<div class="ktd-country-player"><span class="ktd-country-number">'+esc(p.number??'–')+'</span>'+
       '<span class="ktd-country-person"><strong>'+esc(p.name)+'</strong>'+(p.en&&norm(p.en)!==norm(p.name)?'<small>'+esc(p.en)+'</small>':'')+clubLine+
       '<span class="ktd-country-player-links">'+(link?'<a href="'+esc(link)+'">KVL 프로필</a>':'')+profile+vol+'</span></span>'+
       '<span>'+esc(p.position||'–')+'</span><span>'+(p.height?esc(p.height)+'cm':'–')+'</span>'+
       '<span>'+esc(p.source_entry_status||'대회 명단')+'</span></div>';
    }).join('')+'</div>'+
    '<p class="ktd-country-note">명단 구분은 공개된 원본 상태를 그대로 표시합니다. Active·Reserve 등은 예비 소집 후보나 공식 탈락 여부와 동일하지 않습니다.</p>'+
    (snap.source_url?'<p><a class="ktd-country-source-link" href="'+esc(safeAnySource(snap.source_url))+'" target="_blank" rel="noopener noreferrer">명단 원문 출처 확인</a></p>':'');
   rosterHost.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
   if(!alive||ticket!==request)return;
   rosterHost.innerHTML='<p class="ktd-error">원본 명단을 불러오지 못했습니다. 출처와 연결을 확인해 주세요. <a href="'+esc(snap.competition_url)+'">대회 페이지로 이동</a></p>';
   console.error('[KVL international roster]',err);
  }
 }
 function showCandidate(id){
  const s=candidateSets().find(x=>x.snapshot_id===id);if(!s)return;
  request++;selectedSnapshot=null;
  const finals=candidateSets().find(f=>f.competition_slug===s.competition_slug&&f.stage==='final');
  const checked=compareSelection(s,finals);
  rosterHost.hidden=false;
  rosterHost.innerHTML='<h3>'+esc(s.competition_slug)+' · '+esc(STAGE_LABEL[s.stage])+'</h3>'+
   '<p class="ktd-country-note">공식 출처: '+esc(s.published_at)+' · '+esc(s.source_id)+'</p>'+
   '<div class="ktd-country-candidate-list">'+checked.map(p=>'<div><strong>'+esc(p.name_ko||p.name_en)+'</strong><span>'+esc(outcomeLabel(p.selection_state))+'</span></div>').join('')+'</div>'+
   '<p class="ktd-country-note">최종 명단 비교는 출처·완전성·선수 신원이 각각 검증되었을 때만 수행하며, 미포함 사유는 추정하지 않습니다.</p>';
 }
 host.onclick=event=>{
  const b=event.target.closest('button');if(!b||!host.contains(b))return;
  if(b.hasAttribute('data-country-close')){alive=false;unifiedTicket++;unifiedInstance?.destroy?.();onClose?.();return}
  if(b.hasAttribute('data-country-roster-close')){request++;rosterHost.hidden=true;rosterHost.replaceChildren();return}
  if(b.hasAttribute('data-country-snapshot')){showSnapshot(b.dataset.countrySnapshot);return}
  if(b.hasAttribute('data-candidate-id')){showCandidate(b.dataset.candidateId)}
 };
 host.onchange=event=>{
  if(!event.target.matches('[data-country-year-select]'))return;
  const y=Number(event.target.value);
  if(allYears.includes(y)){year=y;showYear();onYearChange?.(y)}
 };
 showYear();
 return {year,close:()=>{alive=false;request++;unifiedTicket++;unifiedInstance?.destroy?.();host.onclick=null;host.onchange=null;host.removeEventListener('error',onFlagLoadError,true)}};
}
return {esc,REGIONS,flagEmoji,validateDirectory,validateIndex,validateSelection,yearsFor,cardEntries,filterCountries,sourceTeam,normalizePlayer,verifiedProfileLink,compareSelection,outcomeLabel,render};
});

/* Additive KOVO registration bridge. Never overwrite a historical roster or MASTER. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLVLeagueDraftBridgeV1=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';

const SOURCE='data/kovo/official-notices/2026-27/draft_registration_bridge.json';
const EDUCATION_SOURCE='data/draft-applicants/2026-27/education-v1.json';
const idPattern=/^KVL-P-[0-9]{6}$/;
const urlPattern=/^https:\/\/kovo\.co\.kr\/news\/official-notices\/[0-9]+$/;
const validHash=x=>/^[0-9a-f]{64}$/.test(x||'');
const norm=x=>String(x||'').replace(/\s+/g,'').replace(/\((?:수련선수|수련)\)$/,'');
const copy=x=>JSON.parse(JSON.stringify(x));
let fetchPromise=null;

function validBridge(b){
 if(!b||b.schema_version!==1||b.season!=='2026-27'||!Array.isArray(b.registered)
    ||!Array.isArray(b.profiles)||b.registration_count!==b.registered.length
    ||b.profile_count!==b.profiles.length)return false;
 const seen=new Set(),pids=new Set();
 for(const r of b.registered){
  if(!r||!r.applicant_id||seen.has(r.applicant_id)||!['M','W'].includes(r.gender)
     ||!r.team_code||!r.team||!r.name||!Number.isInteger(r.number)||r.number<1
     ||!['S','OH','OP','MB','L'].includes(r.position)||!urlPattern.test(r.registration_source_url)
     ||!validHash(r.registration_notice_sha256)||!r.registration_event_id
     ||(r.player_id&&(!idPattern.test(r.player_id)||pids.has(r.player_id))))return false;
  seen.add(r.applicant_id);
  if(r.player_id)pids.add(r.player_id);
 }
 const profIds=new Set();
 for(const p of b.profiles){
  const id=p?.system?.player_id;
  if(!idPattern.test(id||'')||!pids.has(id)||profIds.has(id)||!p.identity?.name_ko
     ||!['M','W'].includes(p.identity.gender)||p.system.competition_level!=='professional')return false;
  profIds.add(id);
 }
 if(profIds.size!==pids.size)return false;
 return true;
}


function validEducation(input){
 if(!input||input.schema_version!==1||input.season!=='2026-27'
    ||!Array.isArray(input.records)||input.record_count!==input.records.length)return false;
 const seen=new Set();
 for(const gender of ['M','W']){
  const src=input.sources?.[gender];
  if(!src||src.source_id!=='KOVO-2026-27-'+gender+'-'+(gender==='M'?'157978':'157977')
     ||src.source_url!=='https://kovo.co.kr/news/kovo/press/'+(gender==='M'?'157978':'157977')
     ||!validHash(src.source_sha256)||!src.verified_at)return false;
 }
 for(const r of input.records){
  if(!r||!r.applicant_id||seen.has(r.applicant_id)||!r.name||!['M','W'].includes(r.gender)
    ||r.source_id!==input.sources[r.gender].source_id
    ||(!r.high_school&&!r.university)
    ||(r.high_school&&typeof r.high_school!=='string')
    ||(r.university&&typeof r.university!=='string')
    ||r.high_school?.length>100||r.university?.length>100)return false;
  seen.add(r.applicant_id);
 }
 return true;
}

/* Education is a verified source snapshot. The match must be exact by
   applicant ID, gender and name; never guess a Player_ID from school/name. */
function withEducation(bridge,education){
 if(!validBridge(bridge))throw new Error('Invalid V-League draft bridge');
 if(!validEducation(education))throw new Error('Invalid KOVO draft education');
 const result=copy(bridge),rows=new Map(education.records.map(r=>[r.applicant_id,r]));
 const byPlayer=new Map();
 for(const r of result.registered){
  const school=rows.get(r.applicant_id);
  if(!school||school.gender!==r.gender||school.name!==r.name)continue;
  const educationInfo={
   ...(school.high_school?{high_school:school.high_school}:{}),
   ...(school.university?{university:school.university}:{})
  };
  r.education=educationInfo;
  if(r.player_id)byPlayer.set(r.player_id,{name:r.name,gender:r.gender,education:educationInfo});
 }
 for(const p of result.profiles){
  const record=byPlayer.get(p.system?.player_id);
  if(!record||p.identity?.name_ko!==record.name||p.identity?.gender!==record.gender)continue;
  p.current_roster={...p.current_roster,...record.education};
 }
 return result;
}

async function load(){
 if(!fetchPromise)fetchPromise=fetch(SOURCE,{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error('V-League draft bridge unavailable: '+r.status);
  return r.json();
 }).then(async data=>{
  if(!validBridge(data))throw new Error('V-League draft bridge invalid');
  try{
   const response=await fetch(EDUCATION_SOURCE,{cache:'no-store'});
   if(!response.ok)throw new Error('Education source unavailable: '+response.status);
   return withEducation(data,await response.json());
  }catch(error){
   console.warn('[KVL verified draft education unavailable — omitted]',error);
   return data;
  }
 });
 return fetchPromise;
}

/* Team Finder-only recovery path. Do not permanently cache a rejected
   request or an education-only partial success in this page session. */
let teamFinderPromise=null;
async function readReviewed(url,validate){
 let lastError;
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  try{
   const response=await fetch(url,{cache:attempt?'reload':'no-store',signal:controller.signal});
   if(!response.ok)throw Error('HTTP '+response.status+' '+url);
   const data=await response.json();
   if(!validate(data))throw Error('Invalid reviewed source '+url);
   return data;
  }catch(error){lastError=error}
  finally{clearTimeout(timer)}
 }
 throw lastError;
}
function loadForTeamFinder(){
 if(teamFinderPromise)return teamFinderPromise;
 const pending=Promise.allSettled([readReviewed(SOURCE,validBridge),readReviewed(EDUCATION_SOURCE,validEducation)]).then(([registration,education])=>{
  if(registration.status!=='fulfilled')throw registration.reason;
  if(education.status!=='fulfilled'){
   console.warn('[KVL teams: verified draft education unavailable after retry]',education.reason);
   return {bridge:registration.value,educationAvailable:false};
  }
  return {bridge:withEducation(registration.value,education.value),educationAvailable:true};
 });
 teamFinderPromise=pending;
 pending.then(result=>{if(!result.educationAvailable&&teamFinderPromise===pending)teamFinderPromise=null},
  ()=>{if(teamFinderPromise===pending)teamFinderPromise=null});
 return pending;
}

function genderOf(data){
 const code=String(data?.competitionId||data?.competition?.competitionId||'');
 const match=code.match(/^KVL-COMP-VLEAGUE-([MW])-2026-27$/);
 return match?match[1]:null;
}

function applyCompetition(input,bridge){
 const gender=genderOf(input);
 if(!gender)return input;
 if(!validBridge(bridge))throw new Error('Invalid V-League draft bridge');
 const result=copy(input);
 const teams=new Map((result.participants||[]).map(t=>[t.code,t]));
 const profiles=new Map(bridge.profiles.map(p=>[p.system.player_id,p]));
 let latest='',included=0;
 for(const r of bridge.registered.filter(r=>r.gender===gender)){
  const team=teams.get(r.team_code),roster=result.rosters?.[r.team_code];
  if(!team||team.name!==r.team||!roster||!Array.isArray(roster.players)){
   throw new Error('Draft bridge participant identity conflict');
  }
  const matches=roster.players.filter(p=>(r.player_id&&p.playerId===r.player_id)
                                    ||(norm(p.name)===norm(r.name)&&Number(p.number)===r.number));
  if(matches.length>1)throw new Error('Draft bridge duplicate player');
  if(matches.length===1)continue;
  if(roster.players.some(p=>Number(p.number)===r.number))
   throw new Error('Draft bridge jersey conflict');
  const p=r.player_id?profiles.get(r.player_id):null;
  const nationality=p?.identity?.nationality||'';
  roster.players.push({
   number:r.number,name:r.name,en:p?.identity?.name_en||'',position:r.position,
   heightCm:p?.physical?.height_cm||r.height_cm||null,
   dob:p?.identity?.birth_date||null,
   ...(p?.identity?.birth_date?{}:{dobStatus:'not-in-official-public-registration'}),
   nationality:nationality==='KOR'?'대한민국':nationality||'',
   nationalityCode:nationality==='KOR'?'KOR':nationality||'',
   playerId:r.player_id||null,volleybox:p?.links?.volleybox||null,
   sourceId:'KVL-SRC-KOVO-NOTICE-'+r.registration_notice_id,
   registrationSource:r.registration_source_url,
   lastChangeSource:r.registration_source_url,
   registrationDate:null,
   recordStatus:'source-verified-registration-projection',
   profileLinkStatus:r.player_id?'validated-draft-identity':'pending',
   sourceNote:'KOVO 공식 신인선수 등록 공시 확인. 공시일은 입단 효력일이나 경기 엔트리 날짜가 아닙니다. 드래프트 당시 자료는 현재 측정값과 다를 수 있습니다.'
  });
  if(r.notice_published_date>latest)latest=r.notice_published_date;
  if(r.notice_published_date>String(roster.asOf||''))roster.asOf=r.notice_published_date;
  roster.players.sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999));
  roster.statusLabel='등록 공시 대조 '+roster.players.length+'명';
  team.rosterCount=roster.players.length;
  included++;
 }
 if(included&&latest){
  result.rosterNote='KOVO 공식 등록 공시 대조 · 최근 확인된 공시 '+latest+
     ' · 실제 경기별 엔트리 및 선수등록 효력일과는 다를 수 있습니다.';
  result.rosterPrintNote='2026-27 시즌 공식 등록 공시 대조 · '+latest+
     ' 게시 공시까지 반영 · 경기별 엔트리와 구분';
 }
 return result;
}

function profilesFrom(existing,bridge){
 if(!validBridge(bridge))throw new Error('Invalid V-League draft bridge');
 const known=new Map();
 for(const p of existing||[]){
  const id=p?.system?.player_id;
  if(!id)continue;
  const list=known.get(id)||[];
  list.push(p);known.set(id,list);
 }
 const registered=new Map(bridge.registered.filter(r=>r.player_id).map(r=>[r.player_id,r]));
 const safe=[];
 for(const p of bridge.profiles){
  const id=p.system.player_id,r=registered.get(id);
  if(!r||p.identity.name_ko!==r.name||p.identity.gender!==r.gender
      ||p.current_roster?.team_code!==r.team_code)continue;
  const old=known.get(id)||[];
  const mismatch=old.some(x=>{
   const i=x.identity||{};
   return (i.name_ko&&i.name_ko!==r.name)
          ||(i.gender&&i.gender.toUpperCase()!==r.gender)
          ||(i.birth_date&&p.identity.birth_date&&i.birth_date!==p.identity.birth_date);
  });
  if(!mismatch)safe.push(copy(p));
 }
 return safe;
}


/* New, already-published season roster is authoritative. Verify source,
   team, number and name before adding only display-level profile links.
   Never republish or replace the official 14 club source snapshots. */
function reconcileCurrent(input,bridge){
 const gender=genderOf(input);
 if(!gender)return input;
 if(!validBridge(bridge))throw new Error('Invalid V-League draft bridge');
 const result=copy(input);
 const profiles=new Map(bridge.profiles.map(p=>[p.system.player_id,p]));
 const originalIds=new Set(Object.values(result.rosters||{}).flatMap(t=>(t.players||[])
   .map(p=>p.playerId).filter(Boolean)));
 const enriched=new Set();
 for(const r of bridge.registered.filter(x=>x.gender===gender)){
  const t=(result.participants||[]).find(x=>x.code===r.team_code);
  const roster=result.rosters?.[r.team_code];
  if(!t||t.name!==r.team||!roster||!Array.isArray(roster.players))continue;
  const list=roster.players.filter(p=>norm(p.name)===norm(r.name)&&Number(p.number)===r.number);
  if(list.length!==1)continue;
  const p=list[0];
  if(p.registrationSource!==r.registration_source_url)continue;
  if(p.playerId&&p.playerId!==r.player_id)continue;
  const profile=r.player_id?profiles.get(r.player_id):null;
  const canLink=Boolean(profile&&p.playerId!==false
    &&profile.identity?.name_ko===r.name&&profile.identity?.gender===r.gender
    &&profile.current_roster?.team_code===r.team_code
    &&(!p.dob||!profile.identity.birth_date||p.dob===profile.identity.birth_date)
    &&(p.playerId===r.player_id||!originalIds.has(r.player_id))
    &&!enriched.has(r.player_id));
  if(canLink){
   p.playerId=r.player_id;
   p.profileLinkStatus='verified-official-draft-registration';
   enriched.add(r.player_id);
  }
  // Academic source is independent; a verified registration may have no
  // Player ID and still show official high school/university facts.
  const academic=r.education||{};
  if(academic.high_school)p.kvlHighSchool=academic.high_school;
  if(academic.university)p.kvlUniversity=academic.university;
  p.kvlDraft={round:r.draft_round,pick:r.draft_pick,kind:r.draft_kind,
    source:r.draft_source_url,registrationSource:r.registration_source_url,
    playerId:canLink?r.player_id:null};
 }
 return result;
}

/* Return current-professional overlays only while the original KOVO
   registration remains present in the newest live roster. Private notes,
   permanent Player IDs and original school enrollment remain unchanged. */
function activeProfiles(existing,bridge,men,women){
 if(!validBridge(bridge))return[];
 const source=profilesFrom(existing,bridge);
 const byRoster={M:men,W:women};
 const byId=new Map(bridge.registered.filter(r=>r.player_id).map(r=>[r.player_id,r]));
 const current=source.filter(p=>{
  const r=byId.get(p.system.player_id),roster=byRoster[r?.gender]?.[r?.team_code]?.players||[];
  return r&&roster.filter(q=>norm(q.name)===norm(r.name)&&Number(q.number)===r.number
     &&q.registrationSource===r.registration_source_url
     &&(!q.playerId||q.playerId===r.player_id)).length===1;
 });
 const known=new Map((existing||[]).filter(p=>p?.system?.player_id)
    .map(p=>[p.system.player_id,p]));
 return current.map(p=>{
  const x=copy(p),r=byId.get(x.system.player_id),old=known.get(x.system.player_id);
  const prior=old?.current_roster||{},er=r.education||{};
  x.current_roster={
   ...x.current_roster,
   ...(er.high_school?{high_school:er.high_school}:{}),
   ...(er.university?{university:er.university}:{}),
   previous_school:er.university||er.high_school||x.current_roster?.previous_school||'',
  };
  x.roster_history=[...(old?.roster_history||[])];
  if(old?.current_roster?.team_name&&old.current_roster.team_name!==x.current_roster.team_name){
   const row={competition_name:prior.latest_competition_name||'기존 소속 기록',
    competition_start:String(prior.season||''),school_name:prior.school_name||prior.team_name||'',
    jersey_number:prior.jersey_number,position:prior.position};
   x.roster_history.push(row);
  }
  // Leave verified original full DOB/height/profile history unchanged.
  if(old?.identity?.birth_date&&!x.identity.birth_date)x.identity.birth_date=old.identity.birth_date;
  x.source_ids=[...new Set([...(old?.source_ids||[]),...(x.source_ids||[])])];
  return x;
 });
}

return {SOURCE,EDUCATION_SOURCE,validBridge,validEducation,withEducation,load,loadForTeamFinder,applyCompetition,reconcileCurrent,profilesFrom,activeProfiles,genderOf};
});

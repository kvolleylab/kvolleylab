/* Additive KOVO registration bridge. Never overwrite a historical roster or MASTER. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLVLeagueDraftBridgeV1=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';

const SOURCE='data/kovo/official-notices/2026-27/draft_registration_bridge.json';
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

async function load(){
 if(!fetchPromise)fetchPromise=fetch(SOURCE,{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error('V-League draft bridge unavailable: '+r.status);
  return r.json();
 }).then(data=>{
  if(!validBridge(data))throw new Error('V-League draft bridge invalid');
  return data;
 });
 return fetchPromise;
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

return {SOURCE,validBridge,load,applyCompetition,profilesFrom,genderOf};
});

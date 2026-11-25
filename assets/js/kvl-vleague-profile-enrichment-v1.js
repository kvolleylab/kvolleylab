/* Reviewed, display-only player facts. Never alters the official registration snapshot. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLVLeagueProfileEnrichmentV1=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PATH='data/team-rosters/v-league/profile-enrichment-2026-27-v1.json';
 const notice=v=>typeof v==='string'&&/^https:\/\/kovo\.co\.kr\/news\/official-notices\/\d+$/.test(v);
 const playerId=v=>v===null||typeof v==='string'&&/^KVL-P-\d{6}$/.test(v);
 const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 const school=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=100&&!/[<>\r\n]/.test(v);
 const key=x=>[x.gender,x.team,x.number,x.name].join('|');
 const allowed=['high_school','university','career_draft','dob','height_cm','nationality_code'];
 const safeSource=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&['www.kepco.co.kr','kepco.co.kr','www.kbstarsvc.co.kr','kbstarsvc.co.kr','m.pinkspiders.co.kr','pinkspiders.co.kr','www.pinkspiders.co.kr','kovo.co.kr','cdn.kovo.co.kr'].includes(u.hostname)}catch(_){return false}};
 function draft(d){return !!d&&/^(?:19|20)\d{2}(?:-\d{2})?$/.test(d.season)&&((d.kind==='regular'&&Number.isInteger(d.round)&&d.round>0&&d.round<=10&&Number.isInteger(d.pick)&&d.pick>0&&d.pick<=20)||(d.kind==='trainee'&&d.round==null&&d.pick==null))}
 function evidenceOk(es){
  if(!Array.isArray(es)||!es.length)return false;
  if(!es.every(e=>e&&(
   e.kind==='archived_mediaguide_extract'&&/^(2024-2025|2025-2026)$/.test(e.season)&&Number.isInteger(e.row)&&e.row>=2&&e.identity_match==='name+dob+gender'||
   e.kind==='official_club_profile'&&safeSource(e.url)&&date(e.as_of)&&e.identity_match==='team+number+name'||
   ['reviewed_kovo_draft_registration','reviewed_draft_profile'].includes(e.kind)&&safeSource(e.url)&&notice(e.registration_url)&&typeof e.applicant_id==='string'
  )))return false;
  return es.some(e=>e.kind!=='archived_mediaguide_extract'||/원문직접확인/.test(e.status||''))||new Set(es.map(e=>e.season)).size>=2;
 }
 function validate(d){
  if(!d||d.schema_version!==1||d.season!=='2026-27'||!Array.isArray(d.records)||!date(d.as_of))return false;
  const seen=new Set();
  return d.records.every(r=>{
   if(!r||!['M','W'].includes(r.gender)||!/^([A-Z]{3})$/.test(r.team)||!Number.isInteger(r.number)||r.number<0||r.number>99||!school(r.name)||!playerId(r.player_id)||!notice(r.registration_source)||!(r.identity_dob===null||date(r.identity_dob))||seen.has(key(r)))return false;
   seen.add(key(r));
   if('expected_link_id'in r&&!playerId(r.expected_link_id))return false;
   const ks=Object.keys(r.fields||{});if(!ks.length||!ks.every(k=>allowed.includes(k)&&evidenceOk(r.evidence?.[k])))return false;
   for(const k of ks){const v=r.fields[k];if((k==='high_school'||k==='university')&&!school(v)||k==='career_draft'&&!draft(v)||k==='dob'&&!date(v)||k==='height_cm'&&(!Number.isFinite(v)||v<120||v>250)||k==='nationality_code'&&v!=='KOR')return false}
   if(r.resolved_dob_conflict&&(!date(r.resolved_dob_conflict.previous_source)||!date(r.resolved_dob_conflict.comparison)||![r.resolved_dob_conflict.previous_source,r.resolved_dob_conflict.comparison].includes(r.fields.dob)||!r.evidence.dob.some(e=>e.kind==='official_club_profile')))return false;
   return true;
  });
 }
 function apply(input,registry){
  if(!validate(registry))throw Error('Invalid reviewed player enrichment');
  const match=/^KVL-COMP-VLEAGUE-([MW])-2026-27$/.exec(input?.competitionId||'');
  if(!match)return input;
  const output={...input,rosters:{...input.rosters}};
  const byKey=new Map(registry.records.map(r=>[key(r),r]));
  for(const [team,roster] of Object.entries(input.rosters||{})){
   output.rosters[team]={...roster,players:roster.players.map(p=>{
    const r=byKey.get(key({gender:match[1],team,number:Number(p.number),name:p.name}));
    if(!r||p.registrationSource!==r.registration_source)return p;
    if(r.player_id?p.playerId!==r.player_id:(p.playerId!=null&&p.playerId!==r.expected_link_id))return p;
    if(r.identity_dob&&p.dob!==r.identity_dob||p.dob&&r.fields.dob&&p.dob!==r.fields.dob)return p;
    const q={...p};const proof={...(p.kvlProfileEvidence||{})};
    const add=(k,v)=>{q[k]=v};
    for(const [k,v] of Object.entries(r.fields)){
     let done=false;
     if(k==='high_school'&&!q.kvlHighSchool){add('kvlHighSchool',v);done=true}
     if(k==='university'&&!q.kvlUniversity){add('kvlUniversity',v);done=true}
     if(k==='career_draft'&&!q.kvlDraft&&!q.kvlCareerDraft){add('kvlCareerDraft',v);done=true}
     if(k==='dob'&&!q.dob){
      const conflict=q.dobStatus==='source-conflict';
      const resolved=r.resolved_dob_conflict;
      if(!conflict&&q.dobStatus!=='lunar-date-unconfirmed'||conflict&&resolved&&q.sourceDob===resolved.previous_source&&q.comparisonDob===resolved.comparison){
       add('dob',v);done=true;
      }
     }
     if(k==='height_cm'&&!(q.heightCm>0)){add('heightCm',v);done=true}
     if(k==='nationality_code'&&!q.nationalityCode&&!q.nationality){add('nationalityCode',v);add('nationality','대한민국');done=true}
     if(done)proof[k]=r.evidence[k];
    }
    if(Object.keys(proof).length)q.kvlProfileEvidence=proof;
    return q;
   })};
  }
  return output;
 }
 let pending;
 async function load(){
  if(pending)return pending;
  pending=(async()=>{
   let err;
   for(let i=0;i<2;i++){
    try{const res=await fetch(PATH,{cache:'no-cache',signal:typeof AbortSignal.timeout==='function'?AbortSignal.timeout(8000):undefined});if(!res.ok)throw Error('HTTP '+res.status);const d=await res.json();if(!validate(d))throw Error('Invalid reviewed profile dataset');return d}catch(e){err=e}
   }
   throw err;
  })();
  try{return await pending}catch(e){pending=null;throw e}
 }
 return {validate,apply,load,safeSource};
});

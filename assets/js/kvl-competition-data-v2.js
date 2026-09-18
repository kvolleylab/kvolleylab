/* KVL V2 DATA ONLY contract. Shared by the browser loader and production builder. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLCompetitionDataV2=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const MODES={standings:['pools-combined','single-league','none'],participants:['groups','flat'],roster:['full','link-only','none'],knockout:['bracket-8','none']};
const list=x=>Array.isArray(x)?x:[];
// Codes/participant IDs are the only routing identities. Display names never resolve a team.
function participant(d,ref){
 const code=typeof ref==='string'?ref:ref?.code||ref?.teamCode;
 const id=typeof ref==='object'&&(ref?.participantId||ref?.participant_id);
 return list(d.participants).find(t=>code?t.code===code:id&&(t.participantId||t.participant_id)===id)||null;
}
function localTimeLabel(m){
 const label=typeof m.localTimeLabel==='string'?m.localTimeLabel.trim():'';
 if(label)return label.includes('현지')?label:'현지 '+label;
 const value=m.time_local||m.localTime||m.timeLocal;
 if(typeof value!=='string'||!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(value.trim()))return '';
 const date=m.date_local||m.dateLocal,zone=m.timezoneAbbr||m.timezone_abbr||m.timezone_local||m.localTimezone||m.timezoneLocal;
 const country=m.venueCountryKo||m.localCountryKo||m.countryKo||m.country_ko||'';
 return [date&&date!==m.date?date:'',country?country+' 현지':'현지',value.trim(),zone||''].filter(Boolean).join(' ');
}
function rosterTarget(d,ref){
 const t=participant(d,ref),mode=d.structure?.roster?.mode||'full';
 if(!t||mode==='none')return {available:false,mode};
 if(mode==='full')return {available:!!d.rosters?.[t.code]?.players?.length,mode,code:t.code};
 // Only explicitly designated roster links, never a generic team URL.
 const url=t.rosterUrl;
 let safe=false;try{safe=typeof url==='string'&&!!url.trim()&&['https:','http:'].includes(new URL(url,'https://kvl.invalid/').protocol);}catch{}
 return {available:!!safe,mode,code:t.code,url:safe?url:null};
}
function pair(set){const h=set?.home??set?.[0],a=set?.away??set?.[1];return h!==null&&h!==undefined&&h!==''&&a!==null&&a!==undefined&&a!==''&&Number.isFinite(Number(h))&&Number.isFinite(Number(a))?{home:Number(h),away:Number(a)}:null;}
function validate(d,{production=false}={}){
 const errors=[];
 for(const key of ['competitionId','displayName','officialName'])if(typeof d[key]!=='string'||!d[key].trim())errors.push(key+' is required');
 if(!['men','women'].includes(d.gender))errors.push('gender must be men or women');
 if(!['upcoming','active','completed'].includes(d.status))errors.push('invalid status');
 for(const [key,modes] of Object.entries(MODES))if(!modes.includes(d.structure?.[key]?.mode))errors.push('unsupported '+key+' mode');
 const ids=new Set(),teams=new Set(list(d.participants).map(t=>t.code));
 if(teams.size!==list(d.participants).length||teams.has(undefined))errors.push('participants require unique codes');
 for(const m of list(d.matches)){
  if(!m.id||ids.has(m.id))errors.push('matches require unique IDs');ids.add(m.id);
  if(m.date&&!/^\d{4}-\d{2}-\d{2}$/.test(m.date))errors.push(m.id+': invalid date');
  if(m.score){const p=pair(m.score);if(!p||p.home<0||p.away<0)errors.push(m.id+': invalid match score');
   const sets=list(m.score.sets),parsed=sets.map(pair);if(parsed.some(s=>!s||s.home<0||s.away<0||s.home===s.away))errors.push(m.id+': invalid set points');
   if(p&&sets.length&&parsed.every(Boolean)){const h=parsed.filter(s=>s.home>s.away).length,a=sets.length-h;if(h!==p.home||a!==p.away)errors.push(m.id+': set points disagree with match score');}
  }
  if(d.status==='upcoming'&&m.score)errors.push(m.id+': upcoming cannot contain results');
 }
 for(const m of list(d.matches))if(m.nextMatchId&&!ids.has(m.nextMatchId))errors.push(m.id+': unresolved nextMatchId');
 if(d.status==='upcoming'&&(d.champion||list(d.finalRanking).length||list(d.qualifications).some(q=>list(q.resultTeams).length)))errors.push('upcoming cannot contain final results');
 if(d.status==='active'&&list(d.finalRanking).some(x=>x.confirmed!==true))errors.push('active final ranking requires confirmed=true');
 if(production){
  if(d.isTest||/^(SMOKE|DUMMY|KVL-TEMPLATE)/i.test(d.competitionId))errors.push('test data cannot be published with a production starter');
  if(!d.seo?.description||!/^https:\/\//.test(d.seo?.canonical||''))errors.push('production requires SEO description and HTTPS canonical URL');
  if(!d.hero?.pcImage||!d.hero?.mobileImage)errors.push('production requires PC and mobile hero assets');
 }
 return errors;
}
function normalize(source){
 const d=JSON.parse(JSON.stringify(source));
 const side=t=>{const p=participant(d,t);return p?{...p,...t,code:p.code}:t;};
 d.matches=list(d.matches).map(m=>({...m,home:side(m.home),away:side(m.away),localTimeLabel:localTimeLabel(m),score:m.score?{...m.score,sets:list(m.score.sets).map(pair).filter(Boolean)}:null}));
 d.participants=list(d.participants);d.resources=list(d.resources);d.finalRanking=list(d.finalRanking);d.qualifications=list(d.qualifications);d.rosters=d.rosters||{};
 return d;
}
return {validate,normalize,pair,participant,localTimeLabel,rosterTarget,supportedModes:MODES};
});

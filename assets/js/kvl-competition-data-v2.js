/* KVL V2 DATA ONLY contract. Shared by the browser loader and production builder. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLCompetitionDataV2=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const MODES={standings:['pools-combined','single-league','none'],participants:['groups','flat'],roster:['full','link-only','none'],knockout:['bracket-8','bracket-4','bracket-tree','pro-postseason','none']};
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
// Shared home / V-League two-slot summary. Dates are always Korea-local.
function summaryClock(m){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(m?.date||''))return null;
 const day=Date.parse(m.date+'T00:00:00+09:00');
 if(!Number.isFinite(day)||new Date(day+9*3600000).toISOString().slice(0,10)!==m.date)return null;
 const timed=typeof m.time==='string'&&m.time.trim()!=='';
 if(timed&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time))return null;
 const at=timed?Date.parse(m.date+'T'+m.time+':00+09:00'):null;
 return {day,at,sort:at??day+86399999};
}
const summaryStatus=m=>String(m.status||'').toLowerCase();
const summaryLive=m=>['live','in_progress','in-progress','진행중','경기중'].includes(summaryStatus(m));
function summaryFinal(m,{requireVerification=false}={}){
 const s=m.score,status=summaryStatus(m);
 const allowed=requireVerification?['','final','completed','finished','종료']:['','scheduled','upcoming','예정','final','completed','finished','종료'];
 return allowed.includes(status)&&(requireVerification?Boolean(m.scoreVerification):m.scoreVerification!==false)&&s&&Number.isInteger(s.home)&&Number.isInteger(s.away)&&Math.max(s.home,s.away)===3&&Math.min(s.home,s.away)>=0&&Math.min(s.home,s.away)<3;
}
function selectMatchSummary(matches,now=Date.now(),options={}){
 const today=new Date(now+9*3600000).toISOString().slice(0,10);
 const excluded=['cancelled','canceled','postponed','abandoned','not_required','취소','연기','미실시'];
 const records=list(matches).map(m=>({m,c:summaryClock(m)})).filter(r=>r.c&&!r.m.notRequired&&!excluded.includes(summaryStatus(r.m)));
 const byTime=(a,b)=>a.c.sort-b.c.sort||String(a.m.id).localeCompare(String(b.m.id));
 // In-play first, then elapsed/unconfirmed, upcoming and today's final result.
 const priority=r=>summaryLive(r.m)?0:summaryFinal(r.m,options)?3:r.c.at!==null&&r.c.at<=now?1:2;
 const sameDay=records.filter(r=>r.m.date===today).sort((a,b)=>priority(a)-priority(b)||byTime(a,b));
 const todayMatch=sameDay[0]?.m||null;
 const recent=records.filter(r=>summaryFinal(r.m,options)&&(todayMatch?r.m.date<today:r.c.at===null?r.m.date<=today:r.c.at<=now)).sort(byTime).at(-1)?.m||null;
 const future=records.filter(r=>!r.m.score&&['','scheduled','upcoming','예정'].includes(summaryStatus(r.m))&&(r.c.at===null?r.m.date>=today:r.c.at>=now)).sort(byTime)[0]?.m||null;
 return {recent,next:todayMatch||future,today,hasToday:!!todayMatch};
}
function matchSummaryState(m,now=Date.now(),options={}){
 const c=summaryClock(m),today=new Date(now+9*3600000).toISOString().slice(0,10),isToday=m.date===today;
 const finished=summaryFinal(m,options)&&c&&(c.at===null?m.date<=today:c.at<=now);
 if(finished)return {kind:'final',label:isToday?'오늘 경기 종료':'경기 종료',finished:true,score:m.score,detail:''};
 if(summaryLive(m)){
  const p=m.liveScore,observed=Date.parse(p?.observedAt||'');let source;try{source=new URL(m.source);}catch{};
  const valid=p&&p.sourceKey===m.officialSourceKey&&/^023:001:(MALE|FEMALE):\d+$/.test(p.sourceKey||'')&&source?.origin==='https://user-api.kovo.co.kr'&&source.pathname==='/stat/game-schedule'&&Number.isInteger(p.home)&&Number.isInteger(p.away)&&p.home>=0&&p.home<3&&p.away>=0&&p.away<3&&Number.isFinite(observed)&&observed<=now+60000&&c&&observed>=c.day&&new Date(observed+9*3600000).toISOString().slice(0,10)===m.date;
  const stale=!valid||now-observed>30*60000;
  const stamp=valid?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(observed)):'';
  return {kind:stale?'stale':'live',label:!valid?'상태 확인 중':stale?'갱신 지연':'진행 중',finished:false,score:valid?p:null,detail:valid?'세트 스코어 · '+stamp+' 확인':'세트 스코어 확인 중'};
 }
 if(['suspended','중단'].includes(summaryStatus(m)))return {kind:'waiting',label:'경기 중단',finished:false,score:null,detail:'공식 경기 상태 확인 중'};
 if(c&&(c.at!==null&&c.at<=now||['final','completed','finished','종료'].includes(summaryStatus(m))))return {kind:'waiting',label:'상태 확인 중',finished:false,score:null,detail:'공식 경기 상태 확인 중'};
 return {kind:'scheduled',label:isToday?'오늘 경기 예정':'경기 예정',finished:false,score:null,detail:''};
}
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
 if(d.structure?.knockout?.mode==='bracket-tree'){
  const rounds=list(d.bracketRounds),seen=new Set(),byId=new Map(list(d.matches).map(m=>[m.id,m]));
  if(!rounds.length||rounds.at(-1)?.slots?.length!==1)errors.push('bracket-tree must end with one final');
  rounds.forEach((r,i)=>{
   const slots=list(r.slots),next=rounds[i+1];
   if(!slots.length||(next&&slots.length!==list(next.slots).length*2))errors.push('bracket-tree rounds must halve');
   slots.forEach((slot,j)=>{
    const m=byId.get(slot.matchId),bye=slot.byeTeam;
    if((!m&&!bye)||(m&&bye)||(bye&&!teams.has(bye)))errors.push('invalid bracket-tree slot');
    if(m){if(seen.has(m.id))errors.push('duplicate bracket-tree match');seen.add(m.id);if(m.round!==r.round)errors.push(m.id+': bracket round disagrees');}
    if(next){const n=byId.get(next.slots[Math.floor(j/2)]?.matchId),p=m?.score?(Number(m.score.home)>Number(m.score.away)?m.home?.code:m.away?.code):bye;
     if(!n||(m&&m.nextMatchId!==n.id)||(p&&![n.home?.code,n.away?.code].includes(p)))errors.push('broken bracket-tree progression');}
   });
  });
  if(seen.size!==list(d.matches).length)errors.push('bracket-tree omits matches');
 }
 if(d.status==='upcoming'&&(d.champion||list(d.finalRanking).length||list(d.qualifications).some(q=>list(q.resultTeams).length)))errors.push('upcoming cannot contain final results');
 if(d.status==='active'&&list(d.finalRanking).some(x=>x.confirmed!==true))errors.push('active final ranking requires confirmed=true');
 if(production){
  if(d.isTest||/^(SMOKE|DUMMY|KVL-TEMPLATE)/i.test(d.competitionId))errors.push('test data cannot be published with a production starter');
  if(!d.seo?.description||!/^https:\/\//.test(d.seo?.canonical||''))errors.push('production requires SEO description and HTTPS canonical URL');
  const hero=d.hero||{},legacyChunks=Array.isArray(hero.b64Chunks)&&hero.b64Chunks.length>0;
  const hasPcHero=!!hero.pcImage||legacyChunks||(Array.isArray(hero.pcB64Chunks)&&hero.pcB64Chunks.length>0);
  const hasMobileHero=!!hero.mobileImage||legacyChunks||(Array.isArray(hero.mobileB64Chunks)&&hero.mobileB64Chunks.length>0);
  if(!hasPcHero||!hasMobileHero)errors.push('production requires PC and mobile hero assets');
 }
 return errors;
}
function normalize(source){
 const d=JSON.parse(JSON.stringify(source));
 if(d.structure?.genderLinks)d.genderLinks={...d.genderLinks,...d.structure.genderLinks};
 const side=t=>{const p=participant(d,t);return p?{...p,...t,code:p.code}:t;};
 d.matches=list(d.matches).map(m=>({...m,home:side(m.home),away:side(m.away),localTimeLabel:localTimeLabel(m),score:m.score?{...m.score,sets:list(m.score.sets).map(pair).filter(Boolean)}:null}));
 const standings=d.standings&&typeof d.standings==='object'?d.standings:{};
 const standingRow=r=>r&&typeof r==='object'?{...r,team:side(r.team),...(d.structure?.standings?.statusLabels?.[r.status]?{statusLabel:d.structure.standings.statusLabels[r.status]}:{})}:r;
 d.standings={...standings,rows:list(standings.rows).map(standingRow),combinedRows:list(standings.combinedRows).map(standingRow),pools:list(standings.pools).map(p=>({...p,rows:list(p?.rows).map(standingRow)}))};
 d.participants=list(d.participants);d.resources=list(d.resources);d.finalRanking=list(d.finalRanking);d.qualifications=list(d.qualifications);d.rosters=d.rosters||{};
 return d;
}
return {validate,normalize,pair,participant,localTimeLabel,rosterTarget,selectMatchSummary,matchSummaryState,supportedModes:MODES};
});

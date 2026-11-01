/* Opt-in calendar presentation only. Never rewrites match/participant records.
 * KR dates cover 2026/2027. Verified 2026-11-02 against KASA's official
 * almanacs (the 2027 announcement also confirms 2026 Labor/Constitution Day):
 * https://www.kasa.go.kr/prog/bbsArticle/BBSMSTR_000000000010/view.do?bbsId=BBSMSTR_000000000010&nttId=B000000001860Pe2zT3
 * https://www.kasa.go.kr/prog/plcyBrf/brief/kor/sub01_01_04/view.do?plcyBrfNo=431
 * Naver calendar could not be retrieved; no Naver verification is claimed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLCalendarDisplayV1=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const coverage=Object.freeze({from:'2026-01-01',to:'2027-12-31',verifiedAt:'2026-11-02'});
 const holidays=Object.freeze({
  '2026-01-01':'신정','2026-02-16':'설날 연휴','2026-02-17':'설날','2026-02-18':'설날 연휴',
  '2026-03-01':'삼일절','2026-03-02':'삼일절 대체공휴일','2026-05-01':'노동절','2026-05-05':'어린이날',
  '2026-05-24':'부처님오신날','2026-05-25':'부처님오신날 대체공휴일',
  '2026-06-03':'전국동시지방선거','2026-06-06':'현충일','2026-07-17':'제헌절',
  '2026-08-15':'광복절','2026-08-17':'광복절 대체공휴일','2026-09-24':'추석 연휴','2026-09-25':'추석','2026-09-26':'추석 연휴',
  '2026-10-03':'개천절','2026-10-05':'개천절 대체공휴일','2026-10-09':'한글날',
  '2026-12-25':'기독탄신일','2027-01-01':'신정',
  '2027-02-06':'설날 연휴','2027-02-07':'설날','2027-02-08':'설날 연휴','2027-02-09':'설날 대체공휴일',
  '2027-03-01':'삼일절','2027-05-01':'노동절','2027-05-03':'노동절 대체공휴일','2027-05-05':'어린이날',
  '2027-05-13':'부처님오신날','2027-06-06':'현충일','2027-07-17':'제헌절','2027-07-19':'제헌절 대체공휴일',
  '2027-08-15':'광복절','2027-08-16':'광복절 대체공휴일','2027-09-14':'추석 연휴','2027-09-15':'추석','2027-09-16':'추석 연휴',
  '2027-10-03':'개천절','2027-10-04':'개천절 대체공휴일','2027-10-09':'한글날','2027-10-11':'한글날 대체공휴일',
  '2027-12-25':'기독탄신일','2027-12-27':'기독탄신일 대체공휴일'
 });
 function dateInfo(key,region){
  const date=/^\d{4}-\d{2}-\d{2}$/.test(key||'')?new Date(key+'T00:00:00Z'):null;
  if(!date||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==key)return {red:false,name:'',verified:false};
  const verified=region==='KR'&&key>=coverage.from&&key<=coverage.to;
  const name=verified?(holidays[key]||''):'';
  return {red:region==='KR'&&(date.getUTCDay()===0||Boolean(name)),name,verified};
 }
 const normalized=value=>String(value||'').replace(/\s+/g,'').toLowerCase();
 function roundLabel(match){
  for(const value of [match.stage,match.round]){
   const text=String(value||'').trim(),number=text.match(/^(\d+)\s*(?:라운드|R)$/i);
   if(number)return number[1]+'R';
   if(/^\d+$/.test(text))return text+'R';
  }
  const text=String(match.stage||match.round||'');
  if(/준플레이오프|QPO/i.test(text))return '준PO';
  if(/챔피언/i.test(text))return '챔프전';
  if(/^FINAL$/i.test(text))return '결승';
  if(/플레이오프|^PO$/i.test(text))return 'PO';
  return text;
 }
 function timeLabel(value){
  const match=String(value||'').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match?Number(match[1])+'시'+(match[2]==='00'?'':Number(match[2])+'분'):'시간 미정';
 }
 function game(match,data,options={}){
  const participants=data.participants||[];
  const participant=side=>participants.find(p=>p.code===side?.code)||side||{};
  const home=participant(match.home),away=participant(match.away);
  const full=t=>t.fullName||t.name||t.code||'미정';
  const alias=t=>options.teamAliases?.[t.code]||t.name||full(t);
  const venue=String(match.venueLabel||'').trim();
  const entry=Object.entries(options.venueCities||{}).find(([key])=>normalized(key)===normalized(venue));
  // Exact venue metadata only: never infer a relocated game's city from its home team.
  const matched=participants.find(p=>venue&&normalized(p.venue)===normalized(venue));
  const city=entry?.[1]||matched?.city||venue||'장소 미정';
  const round=roundLabel(match),time=timeLabel(match.time);
  // Older approved snapshots encode completion with the registered score and omit status.
  // An explicit live/scheduled/cancelled status always takes precedence over that fallback.
  const score=match.score,finished=!match.status||['final','completed'].includes(match.status),scored=finished&&score&&Number.isInteger(score.home)&&Number.isInteger(score.away)&&score.home>=0&&score.away>=0&&score.home!==score.away;
  const resultLabel=scored?score.home+'-'+score.away:'vs';
  return {round,homeLabel:alias(home),awayLabel:alias(away),resultLabel,line1:[round,alias(home),resultLabel,alias(away)].filter(Boolean).join(' '),line2:`(${city}, ${time})`,
   fullLabel:[match.stage||match.round,full(home)+' '+resultLabel+' '+full(away),venue||'장소 미정',time+' KST'].filter(Boolean).join(' · ')};
 }
 return Object.freeze({coverage,holidays,dateInfo,roundLabel,timeLabel,game});
});

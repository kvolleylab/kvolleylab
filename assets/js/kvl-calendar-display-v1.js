/* Opt-in calendar presentation only. Never rewrites match/participant records.
 * KR dates below cover the 2026-27 V-League calendar, including adjacent cells.
 * Verified 2026-11-01 against KASA's official 2026/2027 almanac announcements:
 * https://www.kasa.go.kr/prog/bbsArticle/BBSMSTR_000000000010/view.do?bbsId=B000000000010&nttId=B000000001860Pe2zT3
 * https://www.kasa.go.kr/prog/plcyBrf/brief/kor/sub01_01_04/view.do?plcyBrfNo=431
 * Naver calendar could not be retrieved; no Naver verification is claimed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLCalendarDisplayV1=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const coverage=Object.freeze({from:'2026-09-27',to:'2027-05-08',verifiedAt:'2026-11-01'});
 const holidays=Object.freeze({
  '2026-10-03':'개천절','2026-10-05':'개천절 대체공휴일','2026-10-09':'한글날',
  '2026-12-25':'기독탄신일','2027-01-01':'신정',
  '2027-02-06':'설날 연휴','2027-02-07':'설날','2027-02-08':'설날 연휴','2027-02-09':'설날 대체공휴일',
  '2027-03-01':'삼일절','2027-05-01':'노동절','2027-05-03':'노동절 대체공휴일','2027-05-05':'어린이날'
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
  if(/챔피언|결승|FINAL/i.test(text))return '챔프전';
  if(/플레이오프|^PO$/i.test(text))return 'PO';
  return text;
 }
 function timeLabel(value){
  const match=String(value||'').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match?Number(match[1])+'시'+(match[2]==='00'?'':Number(match[2])+'분'):'시간 미정';
 }
 function game(match,data,options){
  const participants=data.participants||[];
  const participant=side=>participants.find(p=>p.code===side?.code)||side||{};
  const home=participant(match.home),away=participant(match.away);
  const full=t=>t.fullName||t.name||t.code||'미정';
  const alias=t=>options.teamAliases?.[t.code]||full(t);
  const venue=String(match.venueLabel||'').trim();
  const entry=Object.entries(options.venueCities||{}).find(([key])=>normalized(key)===normalized(venue));
  // Exact venue metadata only: never infer a relocated game's city from its home team.
  const matched=participants.find(p=>venue&&normalized(p.venue)===normalized(venue));
  const city=entry?.[1]||matched?.city||venue||'장소 미정';
  const round=roundLabel(match),time=timeLabel(match.time);
  return {line1:[round,alias(home),'vs',alias(away)].filter(Boolean).join(' '),line2:`(${city}, ${time})`,
   fullLabel:[match.stage||match.round,full(home)+' vs '+full(away),venue||'장소 미정',time+' KST'].filter(Boolean).join(' · ')};
 }
 return Object.freeze({coverage,holidays,dateInfo,roundLabel,timeLabel,game});
});

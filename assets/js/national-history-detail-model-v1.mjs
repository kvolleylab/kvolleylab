const names={AUS:'호주',IRI:'이란',JPN:'일본',PAK:'파키스탄',KAZ:'카자흐스탄',INA:'인도네시아',CHN:'중국',TPE:'차이니스 타이베이',PHI:'필리핀',IND:'인도',QAT:'카타르',THA:'태국',OMA:'오만',BRN:'바레인',VIE:'베트남',KUW:'쿠웨이트',KSA:'사우디아라비아',BAN:'방글라데시',FRA:'프랑스',CZE:'체코',FIN:'핀란드',CUB:'쿠바',CAN:'캐나다',POR:'포르투갈',EGY:'이집트',NED:'네덜란드',TUR:'튀르키예'};
const stages={bronze:'3위 결정전',semifinal:'준결승','Top 12 cross match':'12강 교차전','7th-8th classification':'7·8위전'};
export function internalRecordHref(raw) {
  if(typeof raw!=='string'||!raw||/[\s\\]/.test(raw)||/^[a-z]+:/i.test(raw)||raw.startsWith('//'))return null;
  const path=raw.split(/[?#]/)[0];
  return /^[a-z0-9][a-z0-9/_-]*\.html$/.test(path)&&!path.includes('..') ? raw : null;
}
export function validateSummaryEntry(entry,db) {
  const errors=[],event=db.events.find(e=>e.id===entry?.eventId),sources=new Set(db.sources.map(s=>s.id));
  if(!event)return ['event_missing'];
  if(!entry.sourceIds?.length||entry.sourceIds.some(id=>!sources.has(id)))errors.push('source_invalid');
  if(!entry.basis?.length||entry.basis.some(b=>{
    const original=db.events.find(e=>e.id===b.eventId);
    return !original||JSON.stringify(original[b.field]??null)!==JSON.stringify(b.value);
  }))errors.push('basis_changed');
  if(!Array.isArray(entry.rows)||entry.rows.length>3||entry.rows.some(r=>!r.label||(!r.text&&!r.match)||r.text&&r.match||r.match&&(!r.match.opponent||!/^[0-3][–-][0-3]$/.test(r.match.score))))errors.push('rows_invalid');
  if(entry.recordHref&&!internalRecordHref(entry.recordHref))errors.push('record_link_invalid');
  return errors;
}
function defaultRows(event) {
  const rows=(event.matches||[]).slice(0,2).map(m=>({label:stages[m.stage]||m.stage||'주요 경기',match:{opponent:names[m.opponent]||m.opponent,score:String(m.setScore??`${m.setsWon}-${m.setsLost}`).replace('-', '–')}})).filter(r=>r.match.opponent&&/^[0-3]–[0-3]$/.test(r.match.score));
  if(event.qualificationPath)rows.push({label:'출전 경로',text:event.qualificationPath});
  if(!rows.length){
    const explanation=(event.qualificationOutcomes||[]).find(o=>o.rule||o.reason);
    if(explanation)rows.push({label:explanation.rule?'출전 조건':'진출 경위',text:explanation.rule||explanation.reason});
    else if(event.qualifierParticipation===false)rows.push({label:'예선',text:'예선 경기 미참가'});
  }
  // A verified final standing is useful even when individual matches are not recorded.
  // Never infer a result from rank alone, participation, or a future event's label.
  if(!rows.length&&event.eventStatus==='completed'){
    if(event.fieldVerification?.result==='confirmed'&&event.result)rows.push({label:'최종 성적',text:event.result});
    else if(event.fieldVerification?.participation==='confirmed'&&event.actualParticipation===true)rows.push({label:'참가',text:'대한민국 참가 확인'});
    else rows.push({label:'기록 상태',text:'결과 확인 전'});
  }
  return rows.slice(0,3);
}
function calendarDate(value,short=false) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
  const date=new Date(`${value}T00:00:00Z`);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return '';
  return `${(short?value.slice(5):value).replaceAll('-','.')}(${'일월화수목금토'[date.getUTCDay()]})`;
}
export function compactDates(event) {
  const start=calendarDate(event.startDate),end=calendarDate(event.endDate);
  let label='';
  if(start&&end)label=event.startDate===event.endDate?start:`${start}~${calendarDate(event.endDate,event.startDate.slice(0,4)===event.endDate.slice(0,4))}`;
  else if(end)label=`${end} 종료 · 시작일 확인 중`;
  else if(start)label=`${start} 시작 · 종료일 확인 중`;
  if(label&&event.dateScope==='games_dates')label+=' (올림픽 전체 기간)';
  return label;
}
function locationView(event,db,summaries) {
  const entry=summaries?.locations?.find(l=>l.eventId===event.id&&l.competitionId===event.competitionId);
  if(entry?.verificationStatus==='confirmed'&&entry.label&&entry.verifiedAt&&entry.sourceIds?.length){
    const sources=entry.sourceIds.map(id=>db.sources.find(s=>s.id===id)||summaries.sources?.find(s=>s.id===id));
    if(sources.every(s=>s?.access==='official_source_reviewed'&&s.verifiedAt&&/^https:\/\//.test(s.url)))return {location:entry.label,locationSources:sources};
  }
  return {location:typeof event.location==='string'?event.location:'',locationSources:[]};
}
export function compactEventView(event,db,summaries) {
  const entry=summaries?.schemaVersion===1?summaries.entries?.find(s=>s.eventId===event.id):null;
  const accepted=entry&&validateSummaryEntry(entry,db).length===0?entry:null;
  const rows=accepted?.rows.length?accepted.rows:defaultRows(event),date=compactDates(event);
  const resultOnly=event.eventStatus==='completed'&&rows.length===1&&['최종 성적','참가'].includes(rows[0].label)&&!(event.matches||[]).length;
  const notice=event.verificationStatus==='partial'?'일부 경위 확인 중':accepted?.notice||(resultOnly?'세부 경기 기록 미수록':'');
  return {date,...locationView(event,db,summaries),rows,notice,recordHref:internalRecordHref(event.existingLinks?.kvlHref)||internalRecordHref(accepted?.recordHref),relatedEventIds:accepted?[...new Set(accepted.basis.map(b=>b.eventId))].filter(id=>id!==event.id):[]};
}

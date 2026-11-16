export const failed = e => e.qualificationOutcomes.some(o => ['not_qualified','not_qualified_via_this_route','eliminated'].includes(o.status));
export const olympicRelated = e => e.category.startsWith('olympic') || e.qualificationOutcomes.some(o => /olympic|LA28/i.test(o.target));
export function selectEvents(events, filter='all') {
  return events.filter(e => filter==='key' ? e.importance==='key'||e.importance==='major' : filter==='olympic' ? olympicRelated(e) : filter==='failure' ? failed(e) : true);
}
export function ordered(events) {
  return [...events].sort((a,b) => a.year-b.year || (a.startDate||a.endDate||`${a.year}-99-99`).localeCompare(b.startDate||b.endDate||`${b.year}-99-99`) || Number(a.category==='olympics')-Number(b.category==='olympics') || a.id.localeCompare(b.id));
}
export function dateLabel(e) {
  if(e.startDate&&e.endDate) return (e.startDate===e.endDate ? e.startDate.replaceAll('-','.') : `${e.startDate.replaceAll('-','.')} – ${e.endDate.replaceAll('-','.')}`)+(e.dateScope==='games_dates'?' (올림픽 전체 기간)':'');
  if(e.endDate) return `${e.endDate.replaceAll('-','.')} 종료 · 시작일 확인 중`;
  return `${e.heldYear}년 · 세부 날짜 확인 중`;
}
export function participationLabel(e) {
  if(e.actualParticipation===true) return '실제 참가 확인';
  if(e.participationStatus==='not_applicable') return '출전권 배분·경쟁 기록';
  if(e.actualParticipation===false) return '본선 미출전 확인';
  if(e.participationConfirmed===true) return '대한민국 출전 확정 · 개최 전';
  return '대한민국 출전 미확정';
}
export function validateData(db) {
  const errors=[], ids=new Set(), sources=new Set(db.sources.map(s=>s.id));
  for(const e of db.events){
    if(ids.has(e.id)) errors.push(`duplicate: ${e.id}`); ids.add(e.id);
    if(e.country!=='KOR'||e.gender!=='M'||e.ageCategory!=='senior') errors.push(`scope: ${e.id}`);
    if(!e.sourceIds?.length||e.sourceIds.some(s=>!sources.has(s))) errors.push(`source: ${e.id}`);
    if(e.startDate&&e.endDate&&e.startDate>e.endDate) errors.push(`date: ${e.id}`);
    if(e.eventStatus==='scheduled_confirmed'&&(e.actualParticipation!==null||e.finalRank!==null)) errors.push(`future result: ${e.id}`);
    if(e.actualParticipation===false&&e.finalRank!==null) errors.push(`nonparticipant rank: ${e.id}`);
    if(e.qualifierParticipation===false&&e.eliminationMatch) errors.push(`invented elimination: ${e.id}`);
    if(e.actualParticipation===true&&e.result.includes('본선 진출 실패')) errors.push(`participation conflict: ${e.id}`);
    if(e.officialSourceUrls.some(u=>!/^https:\/\//.test(u))) errors.push(`source URL: ${e.id}`);
  }
  return errors;
}

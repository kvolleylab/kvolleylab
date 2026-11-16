// Pure cycle logic. Never imports, rewrites or clears the national history dataset.
export function validateCycle(cycle){
 const errors=[];const sources=new Set((cycle.sources||[]).map(s=>s.id));
 for(const k of ['id','name','hostCity','year','progressStatus','archiveStatus','checkedAt','updatedAt'])if(!cycle[k])errors.push(`missing:${k}`);
 if(!cycle.rules||!Array.isArray(cycle.rules.allocation))return [...errors,'missing_rules'];
 if(cycle.rules.status!=='official_verified'){
  if(cycle.rules.totalPerGender!==null||cycle.rules.allocation.length)errors.push('unknown_rules_must_have_no_quotas');
 }else{
  if(!Number.isInteger(cycle.rules.totalPerGender)||cycle.rules.totalPerGender<1)errors.push('invalid_total');
  if(!cycle.rules.allocation.length||cycle.rules.allocation.reduce((n,x)=>n+x.count,0)!==cycle.rules.totalPerGender)errors.push('quota_sum');
  for(const x of cycle.rules.allocation){if(!Number.isInteger(x.count)||x.count<1)errors.push('invalid_quota');if(!x.sourceIds?.length||x.sourceIds.some(s=>!sources.has(s)))errors.push('quota_source');}
 }
 if((cycle.sources||[]).some(s=>!/^https:\/\//.test(s.url)))errors.push('source_url');
 for(const x of [...(cycle.rules.details||[]),cycle.korea||{}])if(x.sourceIds?.some(id=>!sources.has(id)))errors.push('unresolved_source');
 return errors;
}
export function summaryView(cycle){
 const errors=validateCycle(cycle);if(errors.length)throw Error(errors.join(','));
 const known=cycle.rules.status==='official_verified';
 return {title:cycle.summaryTitle,known,allocation:known?cycle.rules.allocation:[],totalPerGender:known?cycle.rules.totalPerGender:null,notice:known?'':'공식 출전 규정 발표 전',korea:cycle.archiveStatus==='archived'&&cycle.finalOutcome?.verifiedAt?['대한민국 남자대표팀',cycle.finalOutcome.qualification==='qualified'?'올림픽 본선 출전':'올림픽 본선 진출 실패',cycle.finalOutcome.gamesResult]:cycle.korea.summary,archived:cycle.archiveStatus==='archived'};
}
export function resolveCycle(registry,requestedId){
 const id=requestedId||registry.activeCycleId;
 const archive=registry.archiveIndex.find(x=>x.cycleId===id);
 if(archive)return {...archive,id,file:archive.file,archived:true};
 return registry.cycles.find(x=>x.id===id)||registry.cycles.find(x=>x.id===registry.activeCycleId);
}
export function planCycleTransition(registry,cycles,targetId,review){
 if(!review||review.status!=='approved'||!/^\d{4}-\d{2}-\d{2}$/.test(review.checkedAt)||!review.officialBasisIds?.length)throw Error('관리자 검증과 공식 근거가 필요합니다.');
 const previous=cycles[registry.activeCycleId],next=cycles[targetId];
 if(!previous||!next||next.year<=previous.year)throw Error('전환 대상 오류');
 const outcome=previous.finalOutcome;
 if(previous.progressStatus!=='games_completed'||!outcome||!['qualified','not_qualified'].includes(outcome.qualification)||!outcome.gamesResult||!outcome.verifiedAt||!outcome.officialSourceIds?.length)throw Error('이전 올림픽의 공식 최종 결과 확인이 필요합니다.');
 const previousSources=new Set(previous.sources.map(s=>s.id));const allSources=new Set([...previousSources,...next.sources.map(s=>s.id)]);
 if(outcome.officialSourceIds.some(id=>!previousSources.has(id))||review.officialBasisIds.some(id=>!allSources.has(id)))throw Error('공식 근거 Source ID 연결 오류');
 if(validateCycle(previous).length||validateCycle(next).length)throw Error('주기 데이터 검증 실패');
 if(next.rules.status!=='official_verified'&&!review.approveAwaitingRulesNotice)throw Error('규정 발표 전 안내 전환에 대한 검토가 필요합니다.');
 const archived=structuredClone(previous);archived.archiveStatus='archived';archived.archivedAt=review.checkedAt;
 const file=`archives/${previous.id}_${review.checkedAt.replaceAll('-','')}.json`;
 const result=structuredClone(registry);result.activeCycleId=targetId;result.updatedAt=review.checkedAt;
 result.archiveIndex=[...result.archiveIndex.filter(x=>x.cycleId!==previous.id),{cycleId:previous.id,id:previous.id,label:previous.name,year:previous.year,file,archivedAt:review.checkedAt}];
 result.lastTransitionReview=structuredClone(review);
 return {registry:result,archive:{file,data:archived},nextCycle:structuredClone(next)};
}

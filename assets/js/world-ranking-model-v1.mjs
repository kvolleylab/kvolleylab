import {validateWorldCup,priorOlympicTeams} from './world-cup-model-v1.mjs';
export const rankingGender = value => value === 'women' ? 'women' : 'men';
export function rankingConfig(cycle) {
 const c=cycle?.rankingOverview;
 return cycle?.rules?.status==='official_verified' && c?.cycleId===cycle.id && c.year===cycle.year && cycle.rules.allocation?.some(q=>q.id==='ranking') ? c : null;
}
const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
export function rankingPriorTeams(cup,continental,gender) {
 const event=cup.events.find(e=>e.gender===gender), codes=priorOlympicTeams(cup,continental,gender);
 const awarded=event.olympicResult?.status==='confirmed' && event.olympicResult.verificationStatus==='official_verified' ? event.olympicResult.qualifiedTeams : [];
 return [...new Set([...codes,...awarded])].map(code=>({...event.participants.find(t=>t.code===code),route:code===cup.olympicHost.code?'개최국':awarded.includes(code)?'월드컵':'대륙 출전권'}));
}
export function validateRanking(data,cycle,cup,continental) {
 const errors=[],config=rankingConfig(cycle);
 if(!config || data?.schemaVersion!==1 || data.cycleId!==cycle.id || data.year!==config.year || data.allocationId!=='ranking') errors.push('cycle_mismatch');
 try { if(validateWorldCup(cup,cycle,continental).length) errors.push('pathway_invalid'); } catch { errors.push('pathway_invalid'); }
 if(!data || !cycle || errors.includes('pathway_invalid')) return errors;
 const quota=cycle.rules?.allocation?.find(q=>q.id==='ranking')?.count;
 if(!Number.isInteger(quota)||quota<1) errors.push('quota_invalid');
 const sources=new Map((data.sources||[]).map(s=>[s.id,s]));
 const sourced=ids=>Array.isArray(ids)&&ids.length>0&&ids.every(id=>/^https:\/\//.test(sources.get(id)?.url||'')&&validDate(sources.get(id)?.checkedAt));
 if(data.verificationStatus!=='official_verified'||!validDate(data.checkedAt)||!sourced(data.ruleSourceIds)) errors.push('rule_source');
 if(data.priority?.map(p=>p.id).join(',')!=='continental_representation,remaining_ranked') errors.push('priority_order');
 if(data.events?.length!==2||new Set(data.events?.map(e=>e.gender)).size!==2) errors.push('genders');
 for(const event of data.events||[]) {
  if(!['men','women'].includes(event.gender)){errors.push('gender_invalid');continue;}
  const cutoff=event.cutoff,result=event.result,teams=result?.qualifiedTeams||[];
  if(!validDate(cutoff?.date)||!cutoff.date.startsWith(String(data.year))||!['official_date','date_tbc'].includes(cutoff.status)||!sourced(cutoff.sourceIds)) errors.push('cutoff_invalid');
  if(!/^https:\/\//.test(event.officialRankingUrl||'')) errors.push('ranking_link');
  if(!result||!['pending','confirmed'].includes(result.status)) errors.push('result_status');
  const prior=rankingPriorTeams(cup,continental,event.gender).map(t=>t.code);
  if(teams.length>quota||new Set(teams.map(t=>t.code)).size!==teams.length||teams.some(t=>!t.nameKo||!/^[A-Z]{3}$/.test(t.code)||prior.includes(t.code))) errors.push('award_invalid');
  if(result?.status==='pending'&&teams.length) errors.push('pending_award');
  if(result?.status==='confirmed'&&(teams.length!==quota||result.verificationStatus!=='official_verified'||!sourced(result.sourceIds)||!validDate(result.confirmedAt)||result.confirmedAt<cutoff?.date||result.confirmedAt>data.checkedAt||cutoff?.status!=='official_date')) errors.push('award_unverified');
 }
 return [...new Set(errors)];
}
export function rankingView(data,cycle,cup,continental,gender='men') {
 if(validateRanking(data,cycle,cup,continental).length) throw Error('ranking_data');
 const event=data.events.find(e=>e.gender===gender);if(!event)throw Error('gender_invalid');
 const quota=cycle.rules.allocation.find(q=>q.id==='ranking').count,previous=rankingPriorTeams(cup,continental,gender);
 const awards=event.result.status==='confirmed'?event.result.qualifiedTeams:[];
 const koreaQualified=previous.some(t=>t.code==='KOR')||awards.some(t=>t.code==='KOR');
 return {event,quota,previous,koreaQualified,koreaWorldCup:cup.events.find(e=>e.gender===gender).korea.participationConfirmed,slots:Array.from({length:quota},(_,i)=>({number:i+1,team:awards[i]||null}))};
}

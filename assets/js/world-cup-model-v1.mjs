import {validateContinentalResults, continentalRows} from './continental-results-model-v1.mjs';

export const normalGender = value => value === 'women' ? 'women' : 'men';
export function worldCupConfig(cycle) {
  const config = cycle?.worldCupOverview;
  if (cycle?.rules?.status !== 'official_verified' || !config || config.cycleId !== cycle.id) return null;
  return cycle.rules.allocation?.some(q => q.id === 'world-cup') ? config : null;
}
export function priorOlympicTeams(data, continental, gender) {
  const codes = continentalRows(continental, gender).map(row => row.qualified?.code).filter(Boolean);
  if (data.olympicHost?.verificationStatus === 'official_verified') codes.unshift(data.olympicHost.code);
  return [...new Set(codes)];
}
export function validateWorldCup(data, cycle, continental) {
  const errors = [], config = worldCupConfig(cycle);
  if (!config || data?.schemaVersion !== 1 || data.cycleId !== cycle.id || data.editionYear !== config.year) errors.push('cycle_mismatch');
  if (validateContinentalResults(continental, cycle.id).length) errors.push('continental_invalid');
  const quota = cycle.rules?.allocation?.find(q => q.id === data.allocationId)?.count;
  if (!Number.isInteger(quota) || quota < 1) errors.push('quota_invalid');
  const sources = new Map((data.sources || []).map(s => [s.id,s]));
  const sourced = ids => Array.isArray(ids) && ids.length > 0 && ids.every(id => /^https:\/\//.test(sources.get(id)?.url || '') && sources.get(id)?.checkedAt);
  if (!sourced(data.ruleSourceIds) || !sourced(data.olympicHost?.sourceIds)) errors.push('rule_source');
  if (data.events?.length !== 2 || new Set(data.events?.map(e => e.gender)).size !== 2) errors.push('genders');
  for (const event of data.events || []) {
    if (!['men','women'].includes(event.gender)) { errors.push('gender_invalid'); continue; }
    const teams = event.participants || [], codes = teams.map(t => t.code), unique = new Set(codes);
    if (unique.size !== event.participantCount || teams.length !== unique.size) errors.push('participants_count');
    if (teams.some(t => !/^[A-Z]{3}$/.test(t.code) || !t.nameKo || !/^[a-z]{2}$/.test(t.flagIso2) || !sourced(t.sourceIds) || t.verificationStatus !== 'official_verified' || t.participationConfirmed !== true)) errors.push('participant_invalid');
    if (!sourced(event.metadataSourceIds) || !sourced(event.draw?.sourceIds) || !sourced(event.korea?.sourceIds)) errors.push('event_source');
    if (!unique.has('KOR') || event.korea?.participationConfirmed !== true) errors.push('korea_participation');
    if (event.startDate > event.endDate) errors.push('dates');
    if (event.draw.status === 'completed') {
      const poolTeams = event.pools.flatMap(p => p.teams);
      if (event.pools.length !== event.format.poolCount || new Set(event.pools.map(p => p.id)).size !== event.format.poolCount || poolTeams.length !== unique.size || new Set(poolTeams).size !== unique.size || poolTeams.some(code => !unique.has(code)) || event.pools.some(p => p.teams.length !== event.format.teamsPerPool || !sourced(p.sourceIds))) errors.push('pools_invalid');
    } else if (event.pools.length) errors.push('pools_unconfirmed');
    const prior = priorOlympicTeams(data,continental,event.gender);
    if (prior.some(code => !unique.has(code))) errors.push('prior_participant');
    const result = event.olympicResult, awarded = result?.qualifiedTeams || [];
    if (awarded.length > quota || new Set(awarded).size !== awarded.length || awarded.some(code => !unique.has(code) || prior.includes(code))) errors.push('award_invalid');
    if (awarded.length && (result.verificationStatus !== 'official_verified' || !sourced(result.sourceIds))) errors.push('award_unverified');
    if (result.status === 'confirmed' && awarded.length !== quota) errors.push('award_incomplete');
    const championship=event.championshipResult;
    if (championship?.countryCode && (!unique.has(championship.countryCode) || championship.verificationStatus !== 'official_verified' || !sourced(championship.sourceIds))) errors.push('champion_unverified');
    if (event.status === 'upcoming' && (awarded.length || championship?.countryCode || teams.some(t => t.actualParticipation === true))) errors.push('future_result');
  }
  return [...new Set(errors)];
}
export function worldCupView(data, cycle, continental, gender = 'men') {
  const event = data.events.find(e => e.gender === gender);
  if (!event) throw new Error('gender_invalid');
  const quota = cycle.rules.allocation.find(q => q.id === data.allocationId).count;
  const previousCodes = priorOlympicTeams(data, continental, gender);
  const previous = event.participants.filter(t => previousCodes.includes(t.code));
  const awarded = event.olympicResult.verificationStatus === 'official_verified' ? event.olympicResult.qualifiedTeams : [];
  const champion=event.championshipResult?.verificationStatus==='official_verified' ? event.participants.find(t=>t.code===event.championshipResult.countryCode) : null;
  return {event, quota, previous, champion, koreaOlympicQualified:previousCodes.includes('KOR') || awarded.includes('KOR'), slots:Array.from({length:quota},(_,i) => ({number:i+1,team:event.participants.find(t => t.code === awarded[i]) || null})), koreaPool:event.pools.find(p => p.teams.includes('KOR')) || null};
}

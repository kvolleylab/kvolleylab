// A championship winner is never used as an implicit Olympic qualifier.
export function selectorConfig(cycle) {
  const config = cycle.continentalOverview;
  if (cycle.rules?.status !== 'official_verified' || !config || config.cycleId !== cycle.id) return null;
  if (!cycle.rules.allocation.some(q => q.id === 'continental')) return null;
  return config;
}
export function validateContinentalResults(data, cycleId) {
  const errors = [];
  if (data.schemaVersion !== 1 || data.cycleId !== cycleId) errors.push('cycle_mismatch');
  const sources = new Map((data.sources || []).map(s => [s.id, s]));
  const confederations = new Set((data.confederations || []).map(c => c.id));
  const ids = new Set();
  const pairs = new Set();
  for (const event of data.events || []) {
    if (ids.has(event.id)) errors.push('duplicate_id');
    ids.add(event.id);
    const pair = event.gender + ':' + event.confederation;
    if (pairs.has(pair)) errors.push('duplicate_gender_confederation');
    pairs.add(pair);
    if (!['men', 'women'].includes(event.gender) || !confederations.has(event.confederation)) errors.push('event_scope');
    for (const claim of [event.championship, event.qualification]) {
      if (claim?.verificationStatus !== 'official_verified') continue;
      if (!/^[A-Z]{3}$/.test(claim.country?.code || '') || !claim.country?.nameKo) errors.push('country');
      if (!claim.sourceIds?.length || claim.sourceIds.some(id => !sources.get(id)?.url?.startsWith('https://') || !sources.get(id)?.checkedAt)) errors.push('claim_source');
    }
  }
  if (confederations.size !== 5) errors.push('confederation_count');
  for (const gender of ['men', 'women']) for (const id of confederations) if (!pairs.has(gender + ':' + id)) errors.push('missing_event');
  return [...new Set(errors)];
}
export function continentalRows(data, gender = 'men') {
  if (!['men', 'women'].includes(gender)) throw new Error('invalid_gender');
  return data.confederations.map(region => {
    const event = data.events.find(e => e.gender === gender && e.confederation === region.id);
    const champion = event?.championship?.verificationStatus === 'official_verified' ? event.championship.country : null;
    const qualified = event?.qualification?.status === 'qualified' && event.qualification.verificationStatus === 'official_verified' ? event.qualification.country : null;
    return {region, event, champion, qualified, separatePathway: event?.qualification?.pathway === 'norceca_olympic_playoff'};
  });
}

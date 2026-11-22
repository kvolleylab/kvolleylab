// Host information belongs to an explicitly verified Olympic cycle.
export function hostOverviewView(cycle) {
  const host = cycle?.hostOverview;
  const allocation = cycle?.rules?.allocation?.find(item => item.id === 'host');
  if (cycle?.rules?.status !== 'official_verified' || !host || host.cycleId !== cycle.id || host.verificationStatus !== 'official_verified' || !allocation) return null;
  const sources = new Map((cycle.sources || []).map(source => [source.id, source]));
  const records = [host.country, host.city, host.ceremonies, host.volleyball, host.venue, host.qualification, host.history];
  if (records.some(record => !record?.sourceIds?.length || record.sourceIds.some(id => !/^https:\/\//.test(sources.get(id)?.url || '') || !sources.get(id)?.checkedAt))) return null;
  if (!Number.isInteger(allocation.count) || allocation.count < 1 || host.qualification.status !== 'confirmed' || !host.country.nameKo || !host.city.nameKo || !host.venue.nameKo || !host.venue.cityKo || !host.history.text) return null;
  for (const period of [host.ceremonies, host.volleyball]) {
    if (![period.startDate, period.endDate].every(date => /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(Date.parse(date))) || period.startDate > period.endDate || !period.startDate.startsWith(String(cycle.year)) || !period.endDate.startsWith(String(cycle.year))) return null;
  }
  const ids = [...new Set(records.flatMap(record => record.sourceIds))];
  return { ...host, quota: allocation.count, total: cycle.rules.totalPerGender, sources: ids.map(id => sources.get(id)) };
}

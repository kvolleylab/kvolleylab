import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectorConfig, validateContinentalResults, continentalRows} from '../assets/js/continental-results-model-v1.mjs';
const read = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url)));
const data = read('data/olympics/la2028-continentals-v1.json');
const la = read('data/olympics/la2028_v1.json');
const bris = read('data/olympics/brisbane2032_v1.json');
test('all ten results retain existing competition IDs and separate official evidence', () => {
  assert.deepEqual(validateContinentalResults(data, 'la2028'), []); assert.equal(data.events.length, 10);
  const expected = {men:['JPN','POL','TUN','BRA','USA'],women:['THA','TUR','EGY','BRA','CAN']};
  for (const gender of ['men','women']) {
    const rows = continentalRows(data, gender); assert.deepEqual(rows.map(r => r.champion.code), expected[gender]);
    assert.equal(rows.filter(r => r.qualified).length, 5);
    for (const {event} of rows) {
      assert.ok(event.competitionLink.url.includes(event.id));
      for (const claim of [event.championship,event.qualification]) assert.ok(claim.sourceIds.every(id => data.sources.some(s => s.id===id && new URL(s.url).hostname==='www.fivb.com')));
    }
  }
});
test('NORCECA mens champion USA is not converted into the continental qualifier', () => {
  const r = continentalRows(data,'men').find(r => r.region.id==='NORCECA');
  assert.equal(r.champion.code,'USA'); assert.equal(r.qualified.code,'CUB'); assert.equal(r.separatePathway,true);
  assert.notDeepEqual(r.event.championship.sourceIds,r.event.qualification.sourceIds);
  const woman = continentalRows(data,'women').find(r => r.region.id==='NORCECA');
  assert.equal(woman.champion.code,'CAN'); assert.equal(woman.qualified.code,'CAN');
  assert.notDeepEqual(woman.event.championship.sourceIds,woman.event.qualification.sourceIds);
});
test('unverified qualification never falls back to a verified champion', () => {
  const copy = structuredClone(data); copy.events[0].qualification.verificationStatus='unconfirmed';
  const row=continentalRows(copy)[0];assert.equal(row.champion.code,'JPN'); assert.equal(row.qualified,null);
  copy.events[0].championship.verificationStatus='unconfirmed';assert.equal(continentalRows(copy)[0].champion,null);
});
test('cycle mismatch, missing sources and incomplete event coverage are rejected', () => {
  assert.ok(validateContinentalResults(data,'brisbane2032').includes('cycle_mismatch'));
  const copy=structuredClone(data);copy.events[0].qualification.sourceIds=['missing'];assert.ok(validateContinentalResults(copy,'la2028').includes('claim_source'));
  copy.events.pop();assert.ok(validateContinentalResults(copy,'la2028').includes('missing_event'));
});
test('2032 cannot borrow the LA28 selector even with stale copied config', () => {
  assert.equal(selectorConfig(la).dataUrl,'data/olympics/la2028-continentals-v1.json');
  assert.equal(selectorConfig(bris),null);assert.equal(selectorConfig({...bris,continentalOverview:la.continentalOverview}),null);
  assert.equal(selectorConfig({...la,id:'brisbane2032'}),null);
});
test('gender switches do not mutate historical or Olympic data', () => {
  const before=JSON.stringify(data);const old=JSON.stringify(read('data/national/men-senior-history-v1.json'));
  continentalRows(data,'women');continentalRows(data,'men');assert.equal(JSON.stringify(data),before);assert.equal(JSON.stringify(read('data/national/men-senior-history-v1.json')),old);
  assert.throws(()=>continentalRows(data,'unknown'),/invalid_gender/);
});
test('legacy directory and result master join one-to-one without replacing tournament IDs', () => {
  const directory = read('data/national/continental-championships-2026.json');
  assert.equal(directory.resultsDataUrl, 'data/olympics/la2028-continentals-v1.json');
  assert.deepEqual(directory.competitions.map(c => c.id).sort(), data.events.map(c => c.id).sort());
  for (const item of directory.competitions) {
    const event = data.events.find(e => e.id === item.id);
    assert.equal(item.gender, event.gender);
    assert.equal(item.confederation, event.confederation);
    assert.ok(item.startDate <= item.endDate && item.endDate < directory.updated);
    assert.ok(item.calendar_url.startsWith('https://www.fivb.com/'));
    assert.equal(item.verified_at, data.checkedAt);
    assert.ok(item.revision_note.previousValues);
    assert.equal(item.draw_status, undefined);
    assert.equal(item.schedule_status, undefined);
    if (item.confederation === 'NORCECA') assert.match(item.quota, /미국 제외.*별도 결정전/);
  }
});

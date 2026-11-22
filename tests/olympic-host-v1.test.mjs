import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hostOverviewView} from '../assets/js/olympic-host-model-v1.mjs';
const data = name => JSON.parse(readFileSync(new URL(`../data/olympics/${name}_v1.json`,import.meta.url)));
test('host quota is per gender and ceremonies differ from volleyball dates',()=>{
 const c=data('la2028'),v=hostOverviewView(c);
 assert.equal(v.country.code,'USA'); assert.equal(v.quota,1); assert.equal(v.total,12);
 assert.equal(v.ceremonies.startDate,'2028-07-14'); assert.equal(v.volleyball.startDate,'2028-07-15'); assert.equal(v.venue.cityKo,'애너하임');
 assert.equal(c.rules.allocation.find(q=>q.id==='host').link.url,'#host-country-info');
});
test('host overview never crosses an Olympic cycle or unverified rules',()=>{
 const next=data('brisbane2032');next.hostOverview=data('la2028').hostOverview;
 assert.equal(hostOverviewView(next),null);
 next.rules=data('la2028').rules;assert.equal(hostOverviewView(next),null);
});
test('missing evidence, unconfirmed entry and invalid date ranges fail closed',()=>{
 for(const mutate of [c=>c.hostOverview.venue.sourceIds=['missing'],c=>c.hostOverview.qualification.status='pending',c=>c.hostOverview.volleyball.endDate='2027-07-30']){
  const c=data('la2028');mutate(c);assert.equal(hostOverviewView(c),null);
 }
});
test('host presentation does not mutate the cycle or share World Cup result state',()=>{
 const c=data('la2028'),before=JSON.stringify(c);const v=hostOverviewView(c);
 assert.equal(JSON.stringify(c),before);assert.ok(v.sources.length>=4);
 assert.equal(c.korea.olympicStatus,'not_yet_qualified');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rankingConfig,validateRanking,rankingView} from '../assets/js/world-ranking-model-v1.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const data=read('data/olympics/la2028-ranking-v1.json'),cycle=read('data/olympics/la2028_v1.json'),cup=read('data/national/fivb-world-cup-2027-v1.json'),continental=read('data/olympics/la2028-continentals-v1.json');
const copy=()=>structuredClone(data),validate=d=>validateRanking(d,cycle,cup,continental);
const awarded=()=>{const d=copy();d.checkedAt='2028-06-18';d.events[0].result={status:'confirmed',verificationStatus:'official_verified',sourceIds:['qualification-pdf'],confirmedAt:'2028-06-18',qualifiedTeams:[{code:'KOR',nameKo:'대한민국'},{code:'ITA',nameKo:'이탈리아'},{code:'FRA',nameKo:'프랑스'}]};return d;};
test('official gender-specific cutoff dates stay distinct and future slots remain empty',()=>{
 assert.deepEqual(validate(data),[]);
 assert.equal(data.events[0].cutoff.date,'2028-06-18');assert.equal(data.events[0].cutoff.status,'official_date');
 assert.equal(data.events[1].cutoff.date,'2028-06-11');assert.equal(data.events[1].cutoff.status,'date_tbc');
 for(const g of ['men','women']){const v=rankingView(data,cycle,cup,continental,g);assert.equal(v.quota,3);assert(v.slots.every(s=>s.team===null));assert.equal(v.koreaQualified,false);assert.equal(v.koreaWorldCup,true);}
});
test('existing Olympic qualifiers use Cuba rather than counting champion USA twice',()=>{
 const v=rankingView(data,cycle,cup,continental);assert.equal(v.previous.length,6);
 assert.deepEqual(new Set(v.previous.map(t=>t.code)),new Set(['USA','JPN','POL','TUN','BRA','CUB']));
 assert.equal(v.previous.find(t=>t.code==='USA').route,'개최국');
});
test('verified future World Cup qualifiers join the excluded list without changing ranking awards',()=>{
 const c=structuredClone(cup);c.events[0].status='completed';c.events[0].olympicResult={status:'confirmed',qualifiedTeams:['ITA','FRA','KOR'],verificationStatus:'official_verified',sourceIds:['men-field']};
 const v=rankingView(data,cycle,c,continental);assert.equal(v.previous.length,9);assert.equal(v.koreaQualified,true);assert.equal(v.previous.find(t=>t.code==='KOR').route,'월드컵');assert(v.slots.every(s=>s.team===null));
 assert(validateRanking(awarded(),cycle,c,continental).includes('award_invalid'));
});
test('pending, duplicate and already-qualified ranking awards are rejected',()=>{
 let d=copy();d.events[0].result.qualifiedTeams=[{code:'KOR',nameKo:'대한민국'}];assert(validate(d).includes('pending_award'));
 d=awarded();d.events[0].result.qualifiedTeams[1]=d.events[0].result.qualifiedTeams[0];assert(validate(d).includes('award_invalid'));
 d=awarded();d.events[0].result.qualifiedTeams[0]={code:'USA',nameKo:'미국'};assert(validate(d).includes('award_invalid'));
});
test('final ranking awards need complete official evidence and confirmation after cutoff',()=>{
 const d=awarded();assert.deepEqual(validate(d),[]);assert.equal(rankingView(d,cycle,cup,continental).koreaQualified,true);
 for(const mutate of [d=>d.events[0].result.sourceIds=['missing'],d=>d.events[0].result.confirmedAt='2028-06-17',d=>d.events[0].result.confirmedAt='2028-06-19',d=>d.events[0].result.qualifiedTeams.pop(),d=>d.events[0].result.verificationStatus='unverified',d=>d.events[0].cutoff.status='date_tbc']){const bad=awarded();mutate(bad);assert(validate(bad).includes('award_unverified'));}
});
test('missing source, impossible date, reversed priority and corrupt pathways fail closed',()=>{
 for(const mutate of [d=>d.ruleSourceIds=['missing'],d=>d.events[0].cutoff.date='2028-02-30',d=>d.priority.reverse()]){const d=copy();mutate(d);assert(validate(d).length);assert.throws(()=>rankingView(d,cycle,cup,continental));}
 assert(validateRanking(data,cycle,{},continental).includes('pathway_invalid'));
});
test('unpublished 2032 cannot inherit LA28 ranking quotas or disclosure',()=>{
 const next=read('data/olympics/brisbane2032_v1.json');next.rankingOverview=structuredClone(cycle.rankingOverview);
 assert.equal(rankingConfig(next),null);next.rules=structuredClone(cycle.rules);assert.equal(rankingConfig(next),null);
 assert(validateRanking(data,next,cup,continental).length);
});
test('presenting both genders preserves history, cycle and pathway inputs',()=>{
 const history=read('data/national/men-senior-history-v1.json'),before=JSON.stringify([data,cycle,cup,continental,history]);
 for(const g of ['men','women'])rankingView(data,cycle,cup,continental,g);
 assert.equal(JSON.stringify([data,cycle,cup,continental,history]),before);
});

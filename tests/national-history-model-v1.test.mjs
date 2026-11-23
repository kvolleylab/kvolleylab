import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateData,selectEvents,ordered,dateLabel,participationLabel} from '../assets/js/national-history-model-v1.mjs';
const db=JSON.parse(readFileSync(new URL('../data/national/men-senior-history-v1.json',import.meta.url)));
const record=id=>db.events.find(e=>e.id===id);
test('normalized dataset has valid identity, scope, source references and chronology',()=>{
 assert.deepEqual(validateData(db),[]);
 assert.equal(db.events.length,65);
 for(const e of db.events){assert.ok(e.year>=2000&&e.year<=2028); assert.ok(e.officialName); assert.ok(e.nameKo);assert.ok(e.verifiedAt);for(const o of e.qualificationOutcomes)for(const s of o.sourceIds)assert.ok(db.sources.some(x=>x.id===s));}
});
test('Olympic editions distinguish participation and qualification; Tokyo edition retains held year',()=>{
 for(const y of [2000,2004,2008,2012,2016,2020,2024]){const e=record(`olympics-${y}-men`);assert.ok(e);assert.equal(e.actualParticipation,y===2000);}
 assert.equal(record('olympics-2000-men').finalRank,9);
 assert.equal(record('olympics-2020-men').heldYear,2021);
 for(const y of [2016,2024]){const e=record(`olympics-${y}-men`);assert.equal(e.qualifierParticipation,false);assert.equal(e.eliminationMatch,null);assert.ok(!e.result.includes('예선 탈락'));}
});
test('2025 World Championship entry is preserved even with knockout elimination',()=>{
 const e=db.events.find(e=>e.year===2025&&e.category==='world-championship');assert.equal(e.actualParticipation,true);assert.equal(e.finalRank,27);assert.ok(!e.result.includes('본선 진출 실패'));
});
test('Asian Championship can qualify for World Cup and miss Olympic direct quota at once',()=>{
 const e=record('kor-m-2026-asian-championship');assert.equal(e.finalRank,3);
 assert.ok(e.qualificationOutcomes.some(o=>o.status==='qualified'));
 assert.ok(e.qualificationOutcomes.some(o=>o.status==='not_qualified_via_this_route'));
 assert.ok(selectEvents([e],'failure').length===1);
 assert.deepEqual(e.matches.find(m=>m.opponent==='AUS').setScores,db.conflicts[0].officialVerifiedValue);
});
test('future host dates and confirmed Korea entry do not become played results',()=>{
 for(const e of db.events.filter(e=>e.year>=2027)){assert.equal(e.actualParticipation,null);assert.equal(e.finalRank,null);assert.equal(e.eventStatus,'scheduled_confirmed');}
 assert.equal(record('kor-m-2027-world-cup').participationConfirmed,true);
 assert.equal(record('kor-m-2028-olympics').participationConfirmed,null);
 assert.match(dateLabel(record('kor-m-2028-olympics')),/올림픽 전체 기간/);
 assert.match(participationLabel(record('kor-m-2027-world-cup')),/개최 전/);
});
test('filters include evidenced failure and exclude future uncertainty; dates sort without inventing dates',()=>{
 assert.equal(selectEvents(db.events,'all').length,db.events.length);
 const fail=selectEvents(db.events,'failure');assert.ok(fail.length>0);assert.ok(fail.every(e=>e.year<=2026));
 assert.ok(selectEvents(db.events,'olympic').some(e=>e.id==='kor-m-2027-world-cup'));
 const sorted=ordered(db.events);assert.deepEqual(ordered([...db.events].reverse()).map(e=>e.id),sorted.map(e=>e.id));
 const years2026=sorted.filter(e=>e.year===2026);assert.deepEqual(years2026.map(e=>e.id),['kor-m-2026-avc-cup','kor-m-2026-east-asian-championship','kor-m-2026-asian-championship','kor-m-2026-asian-games']);
});
test('validator rejects fabricated future/nonparticipant results and elimination',()=>{
 const check=(id,patch,reason)=>{const copy=structuredClone(db);Object.assign(copy.events.find(e=>e.id===id),patch);assert.ok(validateData(copy).some(e=>e.startsWith(reason)));};
 check('kor-m-2028-olympics',{finalRank:1},'future result');
 check('olympics-2024-men',{eliminationMatch:{date:'2023-09-01'}},'invented elimination');
 check('olympics-2004-men',{finalRank:9},'nonparticipant rank');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactEventView,compactDates,validateSummaryEntry,internalRecordHref} from '../assets/js/national-history-detail-model-v1.mjs';
const db=JSON.parse(readFileSync(new URL('../data/national/men-senior-history-v1.json',import.meta.url)));
const summaries=JSON.parse(readFileSync(new URL('../data/national/men-senior-history-summaries-v1.json',import.meta.url)));
const event=(id,data=db)=>data.events.find(e=>e.id===id);
const view=(id,data=db,copy=summaries)=>compactEventView(event(id,data),data,copy);

test('every curated summary has a unique event, original evidence and unchanged field basis',()=>{
 assert.equal(summaries.entries.length,16);
 assert.equal(new Set(summaries.entries.map(e=>e.eventId)).size,16);
 for(const entry of summaries.entries){
  assert.deepEqual(validateSummaryEntry(entry,db),[],entry.eventId);
  assert.ok(entry.basis.some(b=>b.eventId===entry.eventId&&b.field==='updatedAt'));
  for(const id of entry.sourceIds)assert.deepEqual(summaries.sources.find(s=>s.id===id),db.sources.find(s=>s.id===id));
 }
});
test('Paris and Rio retain nonparticipation rather than fabricated qualifying elimination',()=>{
 const paris=view('olympics-2024-men');
 assert.deepEqual(paris.rows,[{label:'예선',text:'2023 올림픽 예선 미참가'},{label:'최종 경로',text:'2024 세계랭킹 출전권 미획득'}]);
 for(const id of ['olympics-2024-men','olympics-2016-men']){
  assert.equal(event(id).qualifierParticipation,false);
  assert.ok(view(id).rows.every(r=>!r.match));
  assert.ok(!JSON.stringify(view(id)).includes('예선 탈락'));
 }
 assert.equal(view('olympics-2004-men').notice,'일부 경위 확인 중');
 assert.match(view('olympics-2004-men').rows[0].text,/확인 중/);
});
test('Asian Championship separates match results from the remaining Olympic routes',()=>{
 const result=view('kor-m-2026-asian-championship');
 assert.equal(result.date,'2026.09.04(금)~09.13(일)');
 assert.equal(result.location,'일본 후쿠오카');
 assert.deepEqual(result.rows.slice(0,2),[{label:'준결승',match:{opponent:'일본',score:'0–3'}},{label:'3위 결정전',match:{opponent:'호주',score:'3–2'}}]);
 assert.equal(result.rows[2].text,'2027 월드컵 · 2028 세계랭킹');
 assert.equal(result.recordHref,'international-competition-avc-men-continental-2026.html');
 assert.deepEqual(event('kor-m-2026-asian-championship').qualificationOutcomes.map(o=>o.status),['qualified','not_qualified_via_this_route']);
});
test('a changed underlying result invalidates curated wording and uses current structured records',()=>{
 const copy=structuredClone(db),id='kor-m-2026-asian-championship';
 event(id,copy).matches[0].setScore='1-3';
 assert.ok(validateSummaryEntry(summaries.entries.find(e=>e.eventId===id),copy).includes('basis_changed'));
 const result=view(id,copy);
 assert.equal(result.rows[0].match.score,'1–3');
 assert.ok(!result.rows.some(r=>r.label==='남은 LA28 경로'));
 const broken=structuredClone(summaries.entries[0]);broken.sourceIds=['not-a-source'];
 assert.ok(validateSummaryEntry(broken,db).includes('source_invalid'));
});
test('cross-event summaries retain evidence links and Tokyo keeps its original held-year distinction',()=>{
 for(const year of [2008,2012,2020])assert.ok(view(`olympics-${year}-men`).relatedEventIds.length>0);
 assert.deepEqual(view('olympics-2020-men').rows[0].match,{opponent:'이란',score:'2–3'});
 assert.equal(view('olympics-2020-men').date,'');
 assert.equal(event('olympics-2020-men').heldYear,2021);
});
test('all records work without presentation data and unknown future results remain empty',()=>{
 const before=JSON.stringify({db,summaries});
 for(const e of db.events){
  for(const source of [summaries,null]){
   const result=compactEventView(e,db,source);
   assert.ok(result.rows.length<=3);
   if(e.year>=2027)assert.ok(result.rows.every(r=>!r.match));
  }
 }
 assert.deepEqual(view('olympics-2000-men').rows,[]);
 assert.equal(event('olympics-2000-men').finalRank,9);
 assert.equal(JSON.stringify({db,summaries}),before);
});
test('record buttons only accept internal HTML competition routes',()=>{
 for(const invalid of ['https://example.com','//example.com','javascript:alert(1)','../private.html','/admin.html','data:bad','a\\b.html','bad page.html'])assert.equal(internalRecordHref(invalid),null,invalid);
 assert.equal(view('kor-m-2027-world-cup').recordHref,'fivb-world-cup-2027.html?gender=men');
 assert.equal(view('kor-m-2028-world-ranking').recordHref,'fivb-world-ranking-la28-2028.html?gender=men');
});
test('calendar weekdays preserve cross-year, partial and Olympic-wide date meaning',()=>{
 assert.equal(compactDates({startDate:'2026-12-31',endDate:'2027-01-01'}),'2026.12.31(목)~2027.01.01(금)');
 assert.equal(compactDates({startDate:'2024-02-29',endDate:'2024-02-29'}),'2024.02.29(목)');
 assert.equal(compactDates({startDate:null,endDate:'2025-06-24'}),'2025.06.24(화) 종료 · 시작일 확인 중');
 assert.equal(compactDates({startDate:'2026-02-30',endDate:null}),'');
 assert.equal(compactDates({startDate:null,endDate:null}),'');
 assert.match(view('kor-m-2028-olympics').date,/올림픽 전체 기간/);
});
test('locations require matching event identity and official sources, with no guessed host',()=>{
 assert.equal(summaries.locations.length,4);
 for(const location of summaries.locations){
  assert.equal(view(location.eventId).location,location.label);
  assert.ok(view(location.eventId).locationSources.every(s=>s.access==='official_source_reviewed'));
 }
 const changed=structuredClone(summaries),id='kor-m-2026-asian-championship';
 changed.locations.find(l=>l.eventId===id).sourceIds=['missing-source'];
 assert.equal(view(id,db,changed).location,'');
 const mismatched=structuredClone(summaries);
 mismatched.locations.find(l=>l.eventId===id).competitionId='unrelated-event';
 assert.equal(view(id,db,mismatched).location,'');
 assert.equal(view('olympics-2004-men').location,'');
 assert.equal(view('kor-m-2027-world-cup').location,'폴란드');
});

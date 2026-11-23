import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactEventView,compactDates,validateSummaryEntry,internalRecordHref} from '../assets/js/national-history-detail-model-v1.mjs';
import {selectEvents} from '../assets/js/national-history-model-v1.mjs';
const db=JSON.parse(readFileSync(new URL('../data/national/men-senior-history-v1.json',import.meta.url)));
const summaries=JSON.parse(readFileSync(new URL('../data/national/men-senior-history-summaries-v1.json',import.meta.url)));
const event=(id,data=db)=>data.events.find(e=>e.id===id);
const view=(id,data=db,copy=summaries)=>compactEventView(event(id,data),data,copy);

test('completed Asian Games connects six Korea results and shows three decisive matches',()=>{
 const id='kor-m-2026-asian-games',record=event(id),result=view(id);
 const competition=JSON.parse(readFileSync(new URL('../'+record.existingLinks.matchResultsPath,import.meta.url)));
 const korea=competition.matches.filter(m=>m.home.code==='KOR'||m.away.code==='KOR');
 assert.equal(record.eventStatus,'completed');
 assert.equal(record.finalRank,competition.finalRanking.find(r=>r.code==='KOR').rank);
 assert.equal(record.matches.length,6);
 assert.deepEqual(record.existingLinks.matchIds,korea.map(m=>m.id));
 for(const m of record.matches){
  const original=korea.find(x=>x.id===m.kvlMatchId);
  assert.ok(original,m.kvlMatchId);
  const side=original.home.code==='KOR'?'home':'away',other=side==='home'?'away':'home';
  assert.equal(m.date,original.date);
  assert.equal(m.opponent,original[other].code);
  assert.equal(m.setScore,`${original.score[side]}-${original.score[other]}`);
  if(m.setScores)assert.deepEqual(m.setScores,original.score.sets.map(s=>[s[side],s[other]]));
  assert.ok(m.sourceIds.every(sourceId=>db.sources.some(s=>s.id===sourceId&&s.access==='official_source_reviewed')));
 }
 assert.deepEqual(result.rows,[
  {label:'8강',match:{opponent:'이란',score:'2–3'}},
  {label:'5–8위전',match:{opponent:'인도',score:'1–3'}},
  {label:'7·8위전',match:{opponent:'카타르',score:'3–0'}}
 ]);
 assert.equal(result.date,'2026.09.27(일)~10.03(토)');
 assert.equal(result.location,'일본 아이치');
 assert.equal(result.recordHref,'competition-engine.html?competition=asian-games-men-2026');
 assert.deepEqual(selectEvents([record],'olympic'),[]);
 assert.deepEqual(selectEvents([record],'failure'),[]);
 const changed=structuredClone(db);event(id,changed).matches[5].setScore='3-1';
 assert.ok(validateSummaryEntry(summaries.entries.find(e=>e.eventId===id),changed).includes('basis_changed'));
 assert.ok(!view(id,changed).rows.some(r=>r.label==='7·8위전'));
});

test('every curated summary has a unique event, original evidence and unchanged field basis',()=>{
 assert.equal(summaries.entries.length,28);
 assert.equal(new Set(summaries.entries.map(e=>e.eventId)).size,28);
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
 assert.deepEqual(view('olympics-2000-men').rows,[{label:'최종 성적',text:'본선 참가 · 9위'}]);
 assert.equal(event('olympics-2000-men').finalRank,9);
 assert.equal(JSON.stringify({db,summaries}),before);
});

test('all completed records show facts even without curated summaries, while future results stay pending',()=>{
 const completed=db.events.filter(e=>e.eventStatus==='completed');
 assert.equal(completed.length,62);
 for(const e of completed)for(const source of [summaries,null])assert.ok(compactEventView(e,db,source).rows.length>0,e.id);
 assert.equal(completed.filter(e=>view(e.id).notice==='세부 경기 기록 미수록').length,32);
 assert.deepEqual(view('kor-m-2028-olympics').rows,[]);
 const unknown={...event('olympics-2000-men'),result:'임의 결과',finalRank:1,fieldVerification:{result:'unverified',participation:'confirmed'}};
 assert.deepEqual(compactEventView(unknown,db,null).rows,[{label:'참가',text:'대한민국 참가 확인'}]);
 const pending={...unknown,eventStatus:'scheduled_confirmed'};
 assert.deepEqual(compactEventView(pending,db,null).rows,[]);
});

test('2026 AVC Cup connects all six canonical matches with scores oriented to Korea',()=>{
 const record=event('kor-m-2026-avc-cup');
 const calendar=JSON.parse(readFileSync(new URL('../'+record.existingLinks.matchResultsPath,import.meta.url)));
 const details=JSON.parse(readFileSync(new URL('../'+record.existingLinks.matchDetailsPath,import.meta.url)));
 const participants=JSON.parse(readFileSync(new URL('../'+record.existingLinks.participantsPath,import.meta.url))).participants;
 const code=id=>participants.find(p=>p.participant_id===id).code;
 const korea=calendar.matches.filter(m=>[code(m.home_participant_id),code(m.away_participant_id)].includes('KOR'));
 assert.equal(record.matches.length,6);
 assert.deepEqual(record.existingLinks.matchIds,korea.map(m=>m.match_id));
 for(const m of record.matches){
  const original=korea.find(x=>x.match_id===m.kvlMatchId),home=code(original.home_participant_id)==='KOR';
  assert.equal(m.officialMatchId,original.official_match_id);
  assert.equal(m.date,original.date);
  assert.equal(m.opponent,code(home?original.away_participant_id:original.home_participant_id));
  assert.equal(m.setScore,`${original.result[home?'home_sets':'away_sets']}-${original.result[home?'away_sets':'home_sets']}`);
  assert.deepEqual(m.setScores,details.set_scores[String(m.officialMatchId)].map(v=>{const pair=v.split('-').map(Number);return home?pair:pair.reverse();}));
  assert.ok(m.sourceIds.every(id=>db.sources.some(s=>s.id===id&&s.access==='official_source_reviewed')));
 }
 assert.deepEqual(view(record.id).rows,[{label:'조별리그',text:'B조 3승 1패'},{label:'준결승',match:{opponent:'바레인',score:'3–1'}},{label:'결승',match:{opponent:'인도네시아',score:'0–3'}}]);
 assert.equal(view(record.id).recordHref,'avc-men-cup.html');
 assert.equal(view(record.id).location,'인도 아마다바드');
 assert.equal(record.finalRank,calendar.final_standings.indexOf(participants.find(p=>p.code==='KOR').participant_id)+1);
 const changed=structuredClone(db);event(record.id,changed).matches[5].setScore='1-3';
 assert.ok(validateSummaryEntry(summaries.entries.find(e=>e.eventId===record.id),changed).includes('basis_changed'));
});

test('selected historical matches keep known scores separate from missing dates and full coverage',()=>{
 const expected={
  'kor-m-avc-cup-2014':[['IND','3-0']],
  'kor-m-asian-games-2018':[['PAK','3-0'],['INA','3-0'],['TPE','3-2'],['IRI','0-3']],
  'kor-m-avc-cup-2022':[['CHN','2-3'],['BRN','0-3']],
  'kor-m-avc-challenge-2023':[['BRN','0-3'],['VIE','3-1']]
 };
 for(const [id,matches] of Object.entries(expected)){
  const e=event(id);
  assert.deepEqual(e.matches.map(m=>[m.opponent,m.setScore]),matches);
  assert.equal(e.matchCoverage,'selected_matches');
  assert.equal(e.fieldVerification.matches,'partial');
  assert.equal(e.fieldVerification.dates,'unverified');
  for(const m of e.matches)assert.ok(m.sourceIds.every(id=>e.sourceIds.includes(id)&&db.sources.some(s=>s.id===id)));
  assert.ok(view(id).rows.every(r=>r.match));
 }
 assert.equal(event('kor-m-avc-cup-2014').matches[0].date,null);
 assert.deepEqual(view('kor-m-avc-challenge-2023').rows[1].match,{opponent:'베트남',score:'3–1'});
});

test('2018 AVC Cup resolves the mislabeled 2022 history row with independent official evidence',()=>{
 const e=event('kor-m-avc-cup-2018');
 assert.equal(e.finalRank,8);assert.equal(e.result,'8위');assert.equal(e.matches.length,0);
 assert.ok(!e.sourceIds.includes('hist-avc_cup'));
 assert.ok(e.sourceIds.includes('hist-avc_2018_annual_report'));
 const audit=db.conflicts.find(c=>c.id==='avc-cup-2018-mislabeled-history-row');
 assert.equal(audit.reportedExistingKvlValue,4);assert.equal(audit.officialVerifiedValue,8);
 assert.ok(audit.officialSources.every(id=>e.sourceIds.includes(id)));
 assert.equal(event('kor-m-avc-cup-2022').finalRank,4);
 assert.deepEqual(['all','key','olympic','failure'].map(f=>selectEvents(db.events,f).length),[65,37,16,17]);
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
 assert.equal(summaries.locations.length,10);
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

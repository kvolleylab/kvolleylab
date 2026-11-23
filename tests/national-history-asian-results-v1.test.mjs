import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactEventView,validateSummaryEntry} from '../assets/js/national-history-detail-model-v1.mjs';
import {selectEvents} from '../assets/js/national-history-model-v1.mjs';
import {conflictValue,conflictView} from '../assets/js/national-history-verification-model-v1.mjs';
const load=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const db=load('data/national/men-senior-history-v1.json');
const summaries=load('data/national/men-senior-history-summaries-v1.json');
const get=year=>db.events.find(e=>e.id===`kor-m-asian-championship-${year}`);
const expected={
 2019:{ids:[8,11,17,32,40,46,55,59],opponents:['PAK','KUW','INA','TPE','JPN','IND','IRI','JPN'],wins:6,rank:4,start:'2019-09-13',end:'2019-09-21',location:'이란 테헤란'},
 2021:{ids:[2,16,23,31,39,45,53],opponents:['KSA','KAZ','TPE','IRI','PAK','QAT','PAK'],wins:2,rank:8,start:'2021-09-12',end:'2021-09-19',location:'일본 지바·후나바시'},
 2023:{ids:[5,15,26,32,39],opponents:['BAN','PAK','INA','CHN','TPE'],wins:4,rank:5,start:'2023-08-19',end:'2023-08-26',location:'이란 우르미아'}
};
for(const [year,x] of Object.entries(expected))test(`${year} Asian Championship includes every played Korea match once, with lawful Korea-oriented set scores`,()=>{
 const e=get(year);
 assert.equal(e.matchCoverage,'all_korea_matches');
 assert.equal(e.fieldVerification.matches,'confirmed');
 assert.equal(e.fieldVerification.dates,'confirmed');
 assert.deepEqual(e.matches.map(m=>m.officialMatchId),x.ids);
 assert.deepEqual(e.matches.map(m=>m.opponent),x.opponents);
 assert.equal(new Set(e.matches.map(m=>m.officialMatchId)).size,e.matches.length);
 assert.equal(e.matches.filter(m=>m.setScore.startsWith('3-')).length,x.wins);
 assert.equal(e.finalRank,x.rank);assert.equal(e.startDate,x.start);assert.equal(e.endDate,x.end);
 assert.equal(compactEventView(e,db,summaries).location,x.location);
 for(const m of e.matches){
  assert.ok(m.date>=e.startDate&&m.date<=e.endDate);
  assert.ok(m.sourceIds.length&&m.sourceIds.every(id=>e.sourceIds.includes(id)&&db.sources.some(s=>s.id===id&&s.access==='official_source_reviewed')));
  const won=m.setScores.filter(([a,b])=>a>b).length,lost=m.setScores.length-won;
  assert.equal(m.setScore,`${won}-${lost}`);
  assert.ok((won===3&&lost<3)||(lost===3&&won<3));
  m.setScores.forEach(([a,b],i)=>{const target=i===4?15:25;assert.ok(Math.max(a,b)>=target&&Math.abs(a-b)>=2);assert.ok(Math.max(a,b)===target||Math.abs(a-b)===2);});
 }
 const entry=summaries.entries.find(s=>s.eventId===e.id);
 assert.deepEqual(validateSummaryEntry(entry,db),[]);
 assert.deepEqual(entry.rows.map(r=>r.match.score),e.matches.slice(-3).map(m=>m.setScore.replace('-','–')));
});
test('carry-over results are not duplicate matches and the 2023 six-team phase is not called a quarterfinal',()=>{
 assert.equal(get(2019).matches.filter(m=>m.opponent==='PAK').length,1);
 assert.equal(get(2021).matches.filter(m=>m.opponent==='TPE').length,1);
 assert.deepEqual(get(2023).matches.slice(-3).map(m=>m.stage),['12강','1–6위전','5·6위전']);
 assert.equal(get(2023).matches.at(-1).date,'2023-08-25');
 assert.equal(get(2023).endDate,'2023-08-26');
});
test('a changed historical match invalidates its displayed summary',()=>{
 const copy=structuredClone(db),e=copy.events.find(e=>e.id===get(2023).id);
 e.matches.at(-1).setScore='3-2';
 const entry=summaries.entries.find(s=>s.eventId===e.id);
 assert.ok(validateSummaryEntry(entry,copy).includes('basis_changed'));
 assert.ok(!compactEventView(e,copy,summaries).rows.some(r=>r.label==='5·6위전'));
});
test('participation audit does not silently insert candidates, youth events or 2026 VNL',()=>{
 assert.deepEqual(['all','key','olympic','failure'].map(f=>selectEvents(db.events,f).length),[62,37,16,17]);
 assert.ok(!db.events.some(e=>e.category==='world-league'&&[2015,2016,2017].includes(e.year)));
 assert.ok(!db.events.some(e=>e.year===2026&&e.category==='vnl'));
 assert.ok(db.events.every(e=>e.ageCategory==='senior'));
});
test('verification page handles both set arrays and scalar corrected ranks without crashing',()=>{
 assert.equal(conflictValue([[25,22],[15,10]]),'25–22 · 15–10');
 assert.equal(conflictValue(8),'8');assert.equal(conflictValue(null),'미확인');
 const views=db.conflicts.map(conflictView);
 assert.equal(views.length,2);
 assert.equal(views[1].before,'4');assert.equal(views[1].after,'8');
 assert.match(views[1].title,/2018 AVC컵/);
 assert.ok(views.every(v=>v.title&&v.note));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {selectEvents} from '../assets/js/national-history-model-v1.mjs';
import {compactEventView,validateSummaryEntry} from '../assets/js/national-history-detail-model-v1.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const db=load('data/national/men-senior-history-v1.json');
const summaries=load('data/national/men-senior-history-summaries-v1.json');
const baseline=load('tests/fixtures/national-history-before-worldleague-v1.json');
const get=y=>db.events.find(e=>e.id===`kor-m-world-league-${y}`);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

test('adding World League preserves every prior event, summary, location and their order',()=>{
 const events=db.events.filter(e=>baseline.eventIds.includes(e.id));
 assert.equal(events.length,62);assert.equal(digest(events),baseline.eventsSha256);
 const entries=summaries.entries.filter(e=>baseline.summaryEventIds.includes(e.eventId));
 assert.equal(entries.length,25);assert.equal(digest(entries),baseline.summariesSha256);
 assert.equal(digest(summaries.locations.slice(0,baseline.previousLocationCount)),baseline.locationsSha256);
 assert.deepEqual(db.events.filter(e=>!baseline.eventIds.includes(e.id)).map(e=>e.id),[2015,2016,2017].map(y=>get(y).id));
});

test('overall rank, tied rank and group rank have different scopes',()=>{
 assert.equal(get(2015).finalRank,18);assert.equal(get(2015).finalRankTied,true);assert.equal(get(2015).result,'공동 18위');
 assert.equal(get(2016).finalRank,23);assert.equal(get(2017).finalRank,18);
 assert.deepEqual(get(2017).groupStanding,{group:2,rank:6,sourceIds:['hist-wl17-fin-yearbook']});
 assert.ok(get(2015).sourceIds.includes('hist-wl15-jva-rank'));
});

test('26 verified results have unique dates/opponents, lawful Korea-oriented scores and reviewed sources',()=>{
 const events=[2015,2016,2017].map(get);
 assert.deepEqual(events.map(e=>e.matches.length),[12,9,5]);
 for(const e of events){
  assert.equal(e.actualParticipation,true);assert.equal(e.ageCategory,'senior');
  assert.equal(new Set(e.matches.map(m=>m.date+':'+m.opponent)).size,e.matches.length);
  assert.deepEqual(e.matches.map(m=>m.date),e.matches.map(m=>m.date).sort());
  assert.equal(validateSummaryEntry(summaries.entries.find(s=>s.eventId===e.id),db).length,0);
  for(const m of e.matches){
   assert.ok(m.date>=e.startDate&&m.date<=e.endDate);
   assert.ok(m.sourceIds.length&&m.sourceIds.every(id=>e.sourceIds.includes(id)&&db.sources.some(s=>s.id===id&&s.access==='official_source_reviewed')));
   if(!m.setScores.length){assert.equal(m.fieldVerification.setScores,'unverified');continue;}
   const won=m.setScores.filter(([a,b])=>a>b).length,lost=m.setScores.length-won;
   assert.equal(m.setScore,`${won}-${lost}`);assert.ok((won===3&&lost<3)||(lost===3&&won<3));
   m.setScores.forEach(([a,b],i)=>{const target=i===4?15:25;assert.ok(Math.max(a,b)>=target&&Math.abs(a-b)>=2);assert.ok(Math.max(a,b)===target||Math.abs(a-b)===2);});
  }
 }
 assert.equal(get(2015).matches.filter(m=>m.setScore.startsWith('3-')).length,2);
 assert.equal(get(2016).matches.filter(m=>m.setScore.startsWith('3-')).length,3);
});

test('partial 2017 coverage and missing 2015 set breakdowns cannot look like complete match detail',()=>{
 assert.equal(get(2015).matchCoverage,'all_korea_matches');
 assert.deepEqual(get(2015).matches.filter(m=>!m.setScores.length).map(m=>m.date),['2015-06-07','2015-06-26']);
 assert.equal(get(2015).fieldVerification.setScores,'partial');
 assert.match(compactEventView(get(2015),db,summaries).notice,/2경기 세트별 점수 확인 중/);
 assert.equal(get(2017).matchCoverage,'partial_korea_matches');assert.equal(get(2017).fieldVerification.matches,'partial');
 assert.match(compactEventView(get(2017),db,summaries).notice,/9경기 중 5경기/);
 assert.ok(!get(2017).matches.some(m=>['SLO','NED','SVK'].includes(m.opponent)));
 assert.ok(!get(2017).result.includes('승')); // Partial records are never promoted to full-season W/L.
});

test('official match report and local calendar resolve the documented source differences',()=>{
 const m=get(2017).matches[0];assert.equal(m.officialMatchId,2);assert.deepEqual(m.setScores[3],[25,20]);
 assert.deepEqual(m.setScores.reduce(([a,b],[x,y])=>[a+x,b+y],[0,0]),[112,100]);
 assert.ok(m.sourceIds.includes('hist-wl17-fivb-match2'));
 assert.deepEqual(get(2016).matches.filter(m=>m.stage.endsWith('F2조')).map(m=>m.date),['2016-06-24','2016-06-25','2016-06-26']);
 assert.ok(get(2016).matches.every(m=>m.sourceIds.includes('hist-wl16-fpv-calendar')));
});

test('ordinary World League appearances do not imply Olympic qualification or failure',()=>{
 const old=db.events.filter(e=>baseline.eventIds.includes(e.id));
 for(const f of ['key','olympic','failure'])assert.deepEqual(selectEvents(db.events,f),selectEvents(old,f));
 assert.deepEqual(['all','key','olympic','failure'].map(f=>selectEvents(db.events,f).length),[65,37,16,17]);
 for(const e of [2015,2016,2017].map(get))assert.deepEqual(e.qualificationOutcomes,[]);
});

test('a score or coverage change invalidates the compact summary instead of displaying stale facts',()=>{
 for(const field of ['matches','matchCoverage']){
  const copy=structuredClone(db),e=copy.events.find(e=>e.id===get(2017).id);
  if(field==='matches')e.matches[0].setScore='3-1';else e.matchCoverage='all_korea_matches';
  assert.ok(validateSummaryEntry(summaries.entries.find(s=>s.eventId===e.id),copy).includes('basis_changed'));
 }
});

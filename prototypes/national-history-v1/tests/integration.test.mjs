import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCycle,summaryView,resolveCycle,planCycleTransition} from '../qualification/model.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p));
const registry=json('qualification/cycles_v1.json'),la=json('qualification/la2028_v1.json'),bris=json('qualification/brisbane2032_v1.json');
const history=read('data/roadmap_v1.json');
const main=s=>s.match(/<main class="roadmap"[\s\S]*?<\/main>/)[0];
const approved={targetId:'brisbane2032',status:'approved',checkedAt:'2029-01-10',officialBasisIds:['test-final-result'],approveAwaitingRulesNotice:true};
function completed(){const c=structuredClone(la);c.progressStatus='games_completed';c.sources.push({id:'test-final-result',title:'TEST FIXTURE ONLY',url:'https://example.org/test-fixture-not-evidence'});c.finalOutcome={qualification:'not_qualified',gamesResult:'TEST ONLY — 본선 진출 실패',verifiedAt:'2029-01-10',officialSourceIds:['test-final-result']};return c;}
test('original roadmap HTML, CSS, JS, model and all 62 records remain byte-identical',()=>{
 const manifest=json('baseline/manifest_v1.json');
 assert.equal(createHash('sha256').update(read('baseline/index.html')).digest('hex'),manifest.hashes['index.html']);
 assert.equal(main(read('index.html')),main(read('baseline/index.html')));
 for(const [file,hash] of Object.entries(manifest.hashes).filter(([f])=>f!=='index.html'))assert.equal(createHash('sha256').update(read(file)).digest('hex'),hash,file);
 assert.equal(JSON.parse(history).events.length,62);
});
test('LA28 has exactly the independently sourced 1/5/3/3 allocation',()=>{
 assert.deepEqual(validateCycle(la),[]);assert.deepEqual(summaryView(la).allocation.map(q=>q.count),[1,5,3,3]);assert.equal(summaryView(la).totalPerGender,12);
 assert.equal(la.korea.worldCupStatus,'qualified');assert.equal(la.korea.olympicStatus,'not_yet_qualified');
});
test('2032 shows an announcement notice and absolutely no LA28 quota fallback',()=>{
 assert.deepEqual(validateCycle(bris),[]);const view=summaryView(bris);assert.equal(view.known,false);assert.equal(view.totalPerGender,null);assert.deepEqual(view.allocation,[]);assert.equal(view.notice,'공식 출전 규정 발표 전');
 const contaminated=structuredClone(bris);contaminated.rules.allocation=la.rules.allocation;assert.throws(()=>summaryView(contaminated),/unknown_rules/);
});
test('future preview and invalid URL never mutate the active Olympic cycle or history',()=>{
 const before=JSON.stringify(registry);assert.equal(resolveCycle(registry,'brisbane2032').id,'brisbane2032');assert.equal(resolveCycle(registry,'bad').id,'la2028');assert.equal(resolveCycle(registry).id,'la2028');assert.equal(JSON.stringify(registry),before);assert.equal(read('data/roadmap_v1.json'),history);
});
test('calendar advancement alone cannot activate another cycle',()=>{
 assert.throws(()=>planCycleTransition(registry,{la2028:completed(),brisbane2032:bris},'brisbane2032',{checkedAt:'2040-01-01'}),/관리자 검증/);
});
test('current unfinished LA28 cannot be archived',()=>{
 assert.throws(()=>planCycleTransition(registry,{la2028:la,brisbane2032:bris},'brisbane2032',approved),/최종 결과/);
});
test('missing official final result or unresolved source blocks transition',()=>{
 const c=completed();c.finalOutcome=null;assert.throws(()=>planCycleTransition(registry,{la2028:c,brisbane2032:bris},'brisbane2032',approved),/최종 결과/);
 assert.throws(()=>planCycleTransition(registry,{la2028:completed(),brisbane2032:bris},'brisbane2032',{...approved,officialBasisIds:['missing']}),/Source ID/);
});
test('unpublished 2032 rules need explicit approval of the awaiting-rules notice',()=>{
 assert.throws(()=>planCycleTransition(registry,{la2028:completed(),brisbane2032:bris},'brisbane2032',{...approved,approveAwaitingRulesNotice:false}),/규정 발표 전/);
});
test('transition preserves every LA28 field in the archive and leaves history intact',()=>{
 const previous=completed(),inputs={la2028:previous,brisbane2032:bris};const before=JSON.stringify(inputs);
 const plan=planCycleTransition(registry,inputs,'brisbane2032',approved);
 assert.equal(plan.registry.activeCycleId,'brisbane2032');assert.equal(plan.registry.archiveIndex.length,1);
 const archive=structuredClone(plan.archive.data);archive.archiveStatus=previous.archiveStatus;archive.archivedAt=previous.archivedAt;assert.deepEqual(archive,previous);
 assert.equal(resolveCycle(plan.registry,'la2028').file,plan.archive.file);assert.equal(summaryView(plan.archive.data).korea[1],'올림픽 본선 진출 실패');assert.equal(summaryView(plan.archive.data).korea[2],previous.finalOutcome.gamesResult);assert.equal(summaryView(plan.nextCycle).allocation.length,0);
 assert.equal(JSON.stringify(inputs),before);assert.equal(registry.activeCycleId,'la2028');assert.equal(read('data/roadmap_v1.json'),history);
});
test('existing official source and competition links all remain in the details data',()=>{
 const required=['https://www.fivb.com/continental-championships-set-the-course-for-la28-and-world-cup-qualification/','https://www.fivb.com/volleyball-and-beach-volleyball-qualification-systems-for-la28-olympic-games-confirmed/','https://stillmed.olympics.com/media/Documents/Olympic-Games/LA28/VVO-LA28-Qualification-System.pdf','https://kvolleylab.com/continental-championships-2026.html','https://kvolleylab.com/continental-championship-2026.html?id=avc-men-continental-2026','https://kvolleylab.com/fivb-world-cup-2027.html','https://kvolleylab.com/fivb-world-ranking-la28-2028.html'];
 const urls=[...la.sources,...la.relatedLinks].map(s=>s.url);for(const url of required)assert.ok(urls.includes(url),url);
});
test('unverified rules, incorrect quota sums and absent source IDs are rejected',()=>{
 const c=structuredClone(la);c.rules.allocation[0].count=2;assert.ok(validateCycle(c).includes('quota_sum'));c.rules.allocation[0].sourceIds=['missing'];assert.ok(validateCycle(c).includes('quota_source'));
});

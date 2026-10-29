import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate,lottery,rightID,columns,pickRank} from '../assets/js/draft-board-core.mjs';
import {renderBoard} from '../assets/js/draft-board-render.mjs';
import {joinApplicants} from '../assets/js/draft-applicants-core.mjs';
import {importObserved} from '../scripts/draft_board/import_observed.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const state=read('../data/drafts/2026-27/men.json'),record=read('../data/drafts/2026-27/imports/20261028-men-observed.json');
const sources=read('../data/drafts/2026-27/sources.json'),empty=read('./fixtures/draft-board-empty-2026-27.json');
const applicants=joinApplicants(read('../data/draft-applicants/2026-27/applicants.json'),read('../data/draft-applicants/2026-27/player-links.json'));
const context={applicants,actor:'fixture-admin',now:'2026-10-28T23:55:00Z'};
const pick=(r,t)=>state.picks.find(p=>p.id===rightID('2026-27','M',r,t));
test('uploaded record yields 13 regular selections, 15 explicit passes and five trainees',()=>{
  validate(state);assert.equal(state.event.status,'completed');assert.equal(state.picks.length,28);
  assert.deepEqual([1,2,3,4].map(r=>state.picks.filter(p=>p.round===r&&p.result.status==='selected').length),[7,5,1,0]);
  assert.equal(state.picks.filter(p=>p.result.status==='passed').length,15);
  assert.equal(Object.values(state.trainees).flatMap(g=>g.entries).length,5);
  for(const row of record.picks){const p=pick(row.round,row.original_team);assert.equal(p.result.status,row.status);assert.equal(p.result.actual_team,row.actual_team);if(row.status==='selected')assert.equal(p.result.player.name,row.name);}
});
test('ten draws retain three duplicate records and the fourth draw operational note',()=>{
  const l=lottery(state);assert.equal(l.records.length,10);assert.deepEqual(l.records.filter(r=>r.duplicate).map(r=>r.sequence),[6,7,8]);
  assert.deepEqual(columns(state).map(t=>t.id),['OKF','HDC','WRC','KBI','KEP','SFB','KAL']);
  assert.deepEqual(l.records.map(r=>r.rank),[1,2,3,4,5,null,null,null,6,7]);assert.match(l.records[3].note,/구슬 제외/);
});
test('ball counts and initial probabilities stay official while all seven colors are entered',()=>{
  assert.deepEqual(state.teams.map(t=>[t.balls,t.probability]),empty.teams.map(t=>[t.balls,t.probability]));
  assert.deepEqual(state.teams.map(t=>t.color.name),['파랑','살구색','초록','노랑','빨강','흰색','보라']);
  assert.equal(state.trades.length,0);assert.equal(state.trade_review.status,'pending');
  assert.ok(state.picks.every(p=>p.current_team===p.original_team));assert.equal(pickRank(state,pick(2,'KAL')),1);
});
test('multiple trainee entries and 17 verified profile links are retained without inventing an ID',()=>{
  assert.deepEqual(state.trainees.KBI.entries.map(e=>e.player.name),['이한샘','이산']);
  assert.deepEqual(state.trainees.KEP.entries.map(e=>e.player.name),['옹민혁','이율리']);
  const players=[...state.picks.filter(p=>p.result.player).map(p=>p.result.player),...Object.values(state.trainees).flatMap(g=>g.entries.map(e=>e.player))];
  assert.equal(new Set(players.map(p=>p.applicant_id)).size,18);assert.equal(players.filter(p=>p.player_id).length,17);
  assert.equal(players.find(p=>p.name==='이율리').player_id,null);
});
test('Song Jeongmin affiliation correction is sourced and links the same verified identity',()=>{
  assert.equal(pick(2,'KAL').result.player.name,'송정민');assert.equal(pick(2,'KAL').result.player.affiliation,'수성고');
  assert.equal(pick(2,'KAL').result.player.player_id,'KVL-P-000984');
  assert.equal(record.corrections[0].original,'순천제일고');assert.equal(record.corrections[0].locator,'지명결과!I13');assert.equal(sources.corrections[0].sources.length,2);
});
test('prior saved audit remains first and every imported change has a source cell or event locator',()=>{
  assert.equal(state.audit[0].revision,1);assert.equal(state.audit[0].action,'event');assert.match(state.audit[0].after.note,/2026.10.22/);
  assert.equal(state.revision,56);assert.equal(state.audit.length,56);assert.ok(state.audit.slice(1).every(a=>a.reason.includes(record.source_id)));
  assert.equal(record.sha256,'f70d5fd59e34d9bc51446aaaacc404da6122e52b3a28a15d232aa802a338c9ca');
});
test('import refuses duplicate, mismatched, ambiguous and ownership-changing input',()=>{
  assert.throws(()=>importObserved(state,record,context),/이미 반영/);
  assert.throws(()=>importObserved(empty,{...record,season:'2027-28'},context),/시즌/);
  const unknown=structuredClone(record);unknown.picks[0].name='확인되지 않은 선수';assert.throws(()=>importObserved(empty,unknown,context),/신원/);
  const transfer=structuredClone(record);transfer.picks[0].actual_team='KAL';assert.throws(()=>importObserved(empty,transfer,context),/공식 거래/);
  assert.equal(empty.draws.length,0);
});
test('blank cell remains waiting and cannot produce completed status',()=>{
  const partial=structuredClone(record);partial.picks[0]={round:1,original_team:'OKF',actual_team:'OKF',status:'waiting'};
  const s=importObserved(empty,partial,context);assert.equal(s.picks.find(p=>p.id===rightID('2026-27','M',1,'OKF')).result.status,'waiting');assert.equal(s.event.status,'selecting');
});
test('render distinguishes observed records, official initial probabilities and sourced correction',()=>{
  const html=renderBoard(state,sources);assert.match(html,/사용자 제공 현장 기록/);assert.match(html,/공식 최초 추첨 확률/);assert.match(html,/순천제일고 → 수성고/);assert.match(html,/거래 내역 확인 중/);
  assert.match(html,/data-right="2026-27:M:2:KAL"[\s\S]*?송정민/);assert.match(html,/파랑/);assert.match(html,/살구색/);
});

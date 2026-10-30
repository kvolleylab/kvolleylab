import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate,lottery,lotteryStages,applyCommand,rightID,columns,pickRank} from '../assets/js/draft-board-core.mjs';
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
test('nine actual draws retain duplicates; the final team is automatically seventh',()=>{
  const l=lottery(state);assert.equal(l.records.length,9);assert.deepEqual(l.records.filter(r=>r.duplicate).map(r=>r.sequence),[6,7,8]);
  assert.deepEqual(columns(state).map(t=>t.id),['OKF','HDC','WRC','KBI','KEP','SFB','KAL']);
  assert.deepEqual(l.records.map(r=>r.rank),[1,2,3,4,5,null,null,null,6]);assert.match(l.records[3].note,/구슬 제외/);
  assert.equal(l.automatic.team_id,'KAL');assert.equal(l.automatic.rank,7);assert.ok(l.complete);
  assert.equal(record.draws.length,10,'original transcription must remain unchanged');
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
  assert.equal(state.revision,58);assert.equal(state.audit.length,58);assert.ok(state.audit.slice(1,56).every(a=>a.reason.includes(record.source_id)));
  assert.equal(state.audit[57].action,'draw_remove');assert.equal(state.audit[57].before.team_id,'KAL');assert.match(state.audit[57].reason,/자동 확정/);
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
  const html=renderBoard(state,sources,{admin:true});assert.match(html,/사용자 제공 현장 기록/);assert.match(html,/공식 최초 추첨 확률/);assert.match(html,/순천제일고 → 수성고/);assert.match(html,/거래 내역 확인 중/);
  assert.match(html,/data-right="2026-27:M:2:KAL"[\s\S]*?송정민/);assert.match(html,/파랑/);assert.match(html,/살구색/);
});
test('stage-start probabilities use 100 then 64 balls and do not shrink on duplicates',()=>{
  const stages=lotteryStages(state);assert.deepEqual(stages.map(s=>s.total),[100,64]);
  assert.deepEqual(stages[0].entries.map(e=>e.probability),[30,2,4]);
  assert.deepEqual(stages[1].entries.map(e=>e.probability),[12.5,31.25,54.6875,1.5625]);
  assert.deepEqual(stages[1].entries.map(e=>e.automatic),[false,false,false,true]);
  const incomplete=structuredClone(state);incomplete.event.status='drawing';incomplete.draws=state.draws.slice(0,2);
  assert.equal(lotteryStages(incomplete)[1].total,null);assert.ok(lotteryStages(incomplete).flatMap(s=>s.entries).every(e=>!e.automatic));
  incomplete.teams[0].balls=null;assert.equal(lotteryStages(incomplete)[0].total,null);
});
test('automatic last rank is opt-in and never changes a result identity or an initial allocation',()=>{
  const s=structuredClone(state);s.event.status='drawing';s.draws=s.draws.slice(0,8);assert.equal(lottery(s).automatic,null);
  s.draws=structuredClone(state.draws);s.rules.lottery.automatic_last=false;assert.equal(lottery(s).complete,false);assert.equal(lottery(s).ranks.KAL,undefined);
  assert.throws(()=>applyCommand(state,{type:'draw_add',value:{team_id:'KAL'},reason:'test'},{actor:'test'}),/자동 확정/);
  const replayed=importObserved(empty,record,context);assert.deepEqual(state.picks.map(p=>[p.id,p.result.actual_team,p.result.player]),replayed.picks.map(p=>[p.id,p.result.actual_team,p.result.player]));
  assert.deepEqual(state.teams,replayed.teams);
});
test('public view puts compact results first and only admins receive audit and source detail markup',()=>{
  const html=renderBoard(state,sources,{applicantCount:59});
  assert.ok(html.indexOf('id="draftResults"')<html.indexOf('id="draftAllocation"'));
  assert.match(html,/<strong>59명<\/strong><span>드래프트 참가/);assert.match(html,/<strong>18명<\/strong><span>최종 지명/);
  assert.match(html,/<strong>30\.5%<\/strong>/);assert.match(html,/역대 최저 지명률/);
  assert.match(html,/gender=M&layout=table&sort=source#applicants/);
  for(const text of ['진행 상태','주요 수정 이력','시즌 출처와 확인 필요 자료','기록 기준','지명 완료','실제 지명 ·','시즌 운영 규칙'])assert.ok(!html.includes(text),text);
  assert.equal((html.match(/class="db-pick-name"/g)||[]).length,18);
  assert.match(html,/9회 · 중복 3회 · 7순위 자동 확정/);assert.match(html,/자동 확정<br><small>추첨 없음/);
  const admin=renderBoard(state,sources,{admin:true});assert.match(admin,/주요 수정 이력/);assert.match(admin,/시즌 출처와 확인 필요 자료/);
});
test('summary derives the rate and only uses the historical claim for its verified completed snapshot',()=>{
  const changed=structuredClone(state);changed.picks.find(p=>p.result.status==='selected').result={status:'passed',actual_team:'OKF',player:null};
  const html=renderBoard(changed,sources,{applicantCount:59});assert.match(html,/<strong>28\.8%/);assert.doesNotMatch(html,/역대 최저 지명률/);
  const ongoing={...state,event:{...state.event,status:'selecting'}};assert.match(renderBoard(ongoing,sources,{applicantCount:59}),/현재 지명률/);
  const unknown=renderBoard(state,sources);assert.doesNotMatch(unknown,/NaN|Infinity|30\.5%|역대 최저 지명률/);
  assert.doesNotMatch(renderBoard(state,sources,{applicantCount:0}),/NaN|Infinity/);
});

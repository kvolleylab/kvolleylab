import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate,lottery,lotteryStages,columns,pickRank,applyCommand} from '../assets/js/draft-board-core.mjs';
import {renderBoard,tradeSummary} from '../assets/js/draft-board-render.mjs';
import {mergeResults} from '../assets/js/draft-history-v1.mjs';
import {joinApplicants} from '../assets/js/draft-applicants-core.mjs';
import {mergeListDetails} from '../assets/js/draft-applicant-list.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url))),state=read('data/drafts/2026-27/women.json'),sources=read('data/drafts/2026-27/women-sources.json');
const applicants=joinApplicants(read('data/draft-applicants/2026-27/applicants.json'),read('data/draft-applicants/2026-27/player-links.json')),results=read('data/draft-applicants/2026-27/results.json');
const right=(r,t)=>state.picks.find(p=>p.id===`2026-27:W:${r}:${t}`);
function unobserved(){const seed=structuredClone(state);seed.draws=[];seed.teams.forEach(t=>t.color=null);seed.lottery_result.draw_log_status='unverified';return seed;}
test('official women final PDF: 28 rights, 14 regular plus two trainees, fixed order and four traded rights',()=>{
 validate(state);assert.equal(state.picks.length,28);assert.equal(new Set(state.picks.map(p=>p.id)).size,28);
 assert.deepEqual(columns(state).map(t=>t.id),['IBK','SOO','HHC','KEX','RSP','HPS','GSC']);
 assert.deepEqual([1,2,3,4].map(r=>state.picks.filter(p=>p.round===r&&p.result.status==='selected').length),[7,6,1,0]);
 assert.equal(state.picks.filter(p=>p.result.status==='passed').length,14);assert.equal(state.trades.length,3);assert.equal(state.trades.flatMap(t=>t.legs).length,4);
 for(const [r,t,owner,rank,name] of [[1,'HPS','RSP',6,'오세인'],[2,'RSP','HPS',3,null],[2,'HHC','IBK',5,'곽도연'],[2,'IBK','SOO',7,'이혜수'],[2,'SOO','SOO',6,'김주솔'],[2,'HPS','HPS',2,'강민주']]){const p=right(r,t);assert.equal(p.current_team,owner);assert.equal(p.result.actual_team,owner);assert.equal(pickRank(state,p),rank);assert.equal(p.result.player?.name||null,name);}
 assert.deepEqual([1,3,4].map(r=>right(r,'IBK').current_team),['IBK','IBK','IBK']);assert.deepEqual(state.trainees.HPS.entries.map(e=>e.player.name),['홍수화','노윤아']);
 assert.equal(state.trainees.SOO.status,'not_recorded');assert.equal(state.trainees.RSP.status,'not_recorded');assert.equal(state.trainees.GSC.status,'passed');
});
test('confirmed ranking never invents draws, duplicate counts, colors or automatic rank',()=>{
 const state=unobserved(),l=lottery(state);assert.equal(l.records.length,0);assert.equal(l.logStatus,'unverified');assert.equal(l.automatic,null);assert.equal(l.complete,true);assert.ok(state.teams.every(t=>t.color===null));
 const html=renderBoard(state,sources,{applicantCount:58});assert.match(html,/57명/);assert.match(html,/16명/);assert.match(html,/28\.1%/);assert.match(html,/공식 신청 58명 · 참가 취소 1명/);assert.match(html,/나온 구슬·중복 횟수 미확인/);assert.doesNotMatch(html,/중복 0회|7순위 자동 확정|64개 구슬/);
 assert.equal((html.match(/지명권 양도/g)||[]).length,5); // Four badges plus the allocation note.
 assert.ok(html.indexOf('id="draftResults"')<html.indexOf('id="draftAllocation"'));assert.doesNotMatch(html,/주요 수정 이력|시즌 출처와 확인 필요 자료/);
});
test('owner-confirmed women lottery excludes the first three teams only for the second pool',()=>{
 const [first,second]=lotteryStages(state);
 assert.equal(state.rules.lottery.verification,'user_record');assert.equal(first.total,100);assert.equal(second.total,46);
 assert.deepEqual(first.entries.map(e=>[e.rank,e.team.id,e.probability]),[[1,'IBK',20],[2,'SOO',30],[3,'HHC',4]]);
 assert.deepEqual(second.entries.map(e=>[e.rank,e.team.id]),[[4,'KEX'],[5,'RSP'],[6,'HPS'],[7,'GSC']]);
 assert.deepEqual(second.excluded.map(t=>t.id).sort(),['HHC','IBK','SOO']);
 for(const entry of second.entries){assert.equal(entry.probability,entry.team.balls/46*100);assert.equal(entry.automatic,false);}
 const html=renderBoard(state,sources,{applicantCount:58});
 for(const value of ['1–3순위','4–7순위','100개 구슬 기준','46개 구슬 기준','4.35%','76.09%','17.39%','2.17%'])assert.ok(html.includes(value),value);
 assert.match(html,/각 단계 시작 시 구슬 비율/);assert.match(html,/확인된 추첨 14회 · 중복 8회/);
});
test('public fourth round hides only seven explicit passes; waiting, selected and admin rounds stay available',()=>{
 for(const seed of [state,read('data/drafts/2026-27/men.json')]){
  const snapshot=structuredClone(seed),opts={applicantCount:seed.division==='W'?58:59};
  assert.doesNotMatch(renderBoard(seed,sources,opts),/data-round="4"/);
  assert.match(renderBoard(seed,sources,{...opts,admin:true}),/data-round="4"/);
  for(const status of ['waiting','selected']){
   const variant=structuredClone(seed),p=variant.picks.find(p=>p.round===4);
   p.result=status==='waiting'?{status,actual_team:null,player:null}:{...variant.picks.find(p=>p.result.status==='selected').result};
   assert.match(renderBoard(variant,sources,opts),/data-round="4"/);
  }
  assert.deepEqual(seed,snapshot);assert.equal(seed.picks.length,28);
 }
});
test('exchange summaries keep historical positions and terms through edits and cancellation',()=>{
 const trade=state.trades.find(t=>t.legs.some(l=>l.pick_id==='2026-27:W:2:IBK'));
 assert.equal(trade.conditions,'IBK 고의정(OH) + 2R 지명권 ↔ SOOP 정솔민(L)');
 assert.match(renderBoard(state,sources),/db-trade-exchange[^>]*>IBK 고의정\(OH\) \+ 2R 지명권 ↔ SOOP 정솔민\(L\)/);
 const changed=applyCommand(state,{type:'trade_edit',target:trade.id,value:{...trade,conditions:'IBK 고의정(OH) + 2R 지명권 ↔ SOOP 정솔민(L) · 확인'},reason:'isolated presentation edit'},{actor:'test'});
 assert.deepEqual(changed.picks,state.picks);
 const cancelled=applyCommand(changed,{type:'trade_cancel',target:trade.id,reason:'isolated cancellation'},{actor:'test'});
 assert.equal(cancelled.trades.find(t=>t.id===trade.id).conditions,changed.trades.find(t=>t.id===trade.id).conditions);
 assert.deepEqual(cancelled.picks.map(p=>p.result),state.picks.map(p=>p.result));
 assert.equal(tradeSummary({conditions:'<img src=x onerror=alert(1)>'}).includes('<img'),false);
});
test('actual observations can be added later; false complete logs and contradictory rank edits are rejected atomically',()=>{
 const state=unobserved(),ctx={actor:'test',now:'2026-10-30T08:00:00Z'};
 const first=applyCommand(state,{type:'draw_add',value:{team_id:'IBK'},reason:'video fixture'},ctx);
 const repeated=applyCommand(first,{type:'draw_add',value:{team_id:'IBK'},reason:'video fixture duplicate'},ctx);assert.equal(lottery(repeated).records[1].duplicate,true);assert.equal(lottery(repeated).records[1].rank,null);assert.equal(lottery(repeated).ranks.IBK,1);
 assert.throws(()=>applyCommand(state,{type:'draw_add',value:{team_id:'HPS'},reason:'wrong first'},ctx),/확정 순위/);
 assert.throws(()=>applyCommand(state,{type:'lottery_result',value:{...state.lottery_result,draw_log_status:'complete'},reason:'unobserved'},ctx),/실제 구슬 기록/);assert.equal(state.draws.length,0);
 const corrected=applyCommand(state,{type:'lottery_result',value:{...state.lottery_result,order:['SOO','IBK','HHC','KEX','RSP','HPS','GSC']},reason:'isolated correction fixture'},ctx);assert.deepEqual(corrected.picks,state.picks);
});
test('cancelled swap restores owners but keeps both completed actual teams and all 28 rights',()=>{
 const swap=state.trades.find(t=>t.legs.length===2),s=applyCommand(state,{type:'trade_cancel',target:swap.id,reason:'isolated cancellation fixture'},{actor:'test'});
 assert.equal(s.picks.length,28);assert.equal(s.picks.find(p=>p.id===right(1,'HPS').id).current_team,'HPS');assert.equal(s.picks.find(p=>p.id===right(1,'HPS').id).result.actual_team,'RSP');assert.deepEqual(s.picks.map(p=>p.result),state.picks.map(p=>p.result));assert.equal(s.audit.at(-1).action,'trade_cancel');
});
test('original 58 applicants retained, one sourced withdrawal overlay, 16 selections and trainee labels without fake fifth round',()=>{
 const before=structuredClone(applicants),rows=mergeResults(applicants,results,'2026-27'),women=rows.filter(r=>r.gender==='W');assert.equal(women.length,58);assert.equal(women.filter(r=>r.application_status==='withdrawn').length,1);assert.equal(women.filter(r=>r.selection.status==='selected').length,16);assert.equal(women.filter(r=>r.selection.kind==='trainee').length,2);assert.ok(women.filter(r=>r.selection.kind==='trainee').every(r=>r.selection.round===null&&r.selection.pick===null));assert.deepEqual(applicants,before);
 const details=read('data/draft-applicants/2026-27/women-list-details.json'),enriched=mergeListDetails(rows,details,'2026-27').filter(r=>r.gender==='W');assert.equal(enriched.length,58);assert.ok(enriched.every(r=>r.birth_date&&r.weight_kg&&r.previous_school));
 const broken=structuredClone(results);broken.application_updates[0].applicant_id=women.find(r=>r.selection.status==='selected').applicant_id;assert.throws(()=>mergeResults(applicants,broken,'2026-27'),/application update/);
});

test('provided women video sequence preserves all 14 observations, eight duplicates and six observed ranks',()=>{
 const evidence=read('data/drafts/2026-27/imports/20261030-women-video-observed.json'),draw=lottery(state);
 const sequence=['IBK','SOO','HHC','KEX','RSP','RSP','RSP','KEX','RSP','RSP','RSP','RSP','RSP','HPS'];
 assert.deepEqual(state.draws.map(d=>d.team_id),sequence);assert.deepEqual(evidence.draws.map(d=>d.team_id),sequence);
 assert.deepEqual(draw.records.map(r=>r.rank),[1,2,3,4,5,null,null,null,null,null,null,null,null,6]);
 assert.deepEqual(draw.records.filter(r=>r.duplicate).map(r=>r.sequence),[6,7,8,9,10,11,12,13]);
 assert.equal(draw.records.filter(r=>r.duplicate&&r.team_id==='RSP').length,7);assert.equal(draw.records.filter(r=>r.duplicate&&r.team_id==='KEX').length,1);
 for(const [id,name,balls] of [['IBK','초록',20],['SOO','파랑',30],['HHC','노랑',4],['KEX','흰색',2],['RSP','빨강',35],['HPS','보라',8],['GSC','검정',1]]){
  const t=state.teams.find(t=>t.id===id);assert.equal(t.color.name,name);assert.equal(t.balls,balls);assert.equal(t.probability,balls);
  for(const d of state.draws.filter(d=>d.team_id===id))assert.deepEqual(d.color,t.color);
 }
 assert.equal(draw.logStatus,'partial');assert.equal(draw.automatic,null);assert.equal(draw.ranks.GSC,7);assert.ok(!state.draws.some(d=>d.team_id==='GSC'));
 assert.throws(()=>applyCommand(state,{type:'lottery_result',value:{...state.lottery_result,draw_log_status:'complete'},reason:'last rank still unobserved'},{actor:'test'}),/실제 구슬 기록/);
 assert.equal(sources.observation.source_type,'user_video_transcription');assert.equal(sources.video.verification,'unverified');
 const html=renderBoard(state,sources,{applicantCount:58});assert.match(html,/확인된 추첨 14회 · 중복 8회/);assert.doesNotMatch(html,/나온 구슬·중복 횟수 미확인|7순위 자동 확정/);
 assert.equal((html.match(/class="db-duplicate"/g)||[]).length,8);
});

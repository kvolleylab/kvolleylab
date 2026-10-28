import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyCommand,validate,lottery,pickRank,columns,rightID,createSeason,playerSnapshot,profileURL} from '../assets/js/draft-board-core.mjs';
import {renderBoard} from '../assets/js/draft-board-render.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../data/drafts/2026-27/men.json',import.meta.url)));
const sources=JSON.parse(fs.readFileSync(new URL('../data/drafts/2026-27/sources.json',import.meta.url)));
const base=()=>structuredClone(seed),ID=(team,round=2)=>rightID('2026-27','M',round,team);
let serial=0;
const change=(s,type,value,target,extra={})=>applyCommand(s,{type,value,target,reason:'격리 검증용 가상 사례',...extra},{actor:'fixture-admin',now:'2026-10-28T05:30:00Z',id:`test-${++serial}`});
const transfer=(s,from='SFB',to='OKF',round=2,extra={})=>change(s,'trade_add',{status:'confirmed',date:'2026-10-28',source_url:'https://example.com/official-test',conditions:'가상 검증 자료',legs:[{pick_id:ID(from,round),from,to}],...extra});
const draw=(s,team)=>change(s,'draw_add',{team_id:team});
const pick=(s,team,round=2)=>s.picks.find(p=>p.id===ID(team,round));
const selection=(name='가상선수',team='OKF')=>({status:'selected',actual_team:team,player:{name,affiliation:'가상학교',position:'OH',player_id:null,applicant_id:null},source_url:'https://example.com/result-test'});
test('official seed has 28 distinct rights, 7 allocations, no invented draws/colors/players/trades',()=>{
  validate(base());assert.equal(seed.picks.length,28);assert.equal(new Set(seed.picks.map(p=>p.id)).size,28);
  assert.deepEqual(seed.teams.map(t=>t.balls),[35,30,20,8,4,2,1]);assert.equal(seed.teams.reduce((a,t)=>a+t.probability,0),100);
  assert.ok(seed.teams.every(t=>t.color===null));assert.equal(seed.draws.length+seed.trades.length+seed.audit.length,0);
  assert.ok(seed.picks.every(p=>p.result.status==='waiting'));assert.equal(seed.trade_review.status,'pending');
  assert.equal(sources.allocation.published_at,'2026-10-22');assert.equal(sources.allocation.quote,'올해 드래프트 지명 순서는 지난 시즌 최종 순위의 역순을 기준으로 한 확률 추첨을 통해 결정된다.');
});
test('duplicate draw retained without another rank, six teams does not infer seventh',()=>{
  let s=base();for(const t of ['KAL','KAL','SFB','KEP','OKF','KBI','WRC'])s=draw(s,t);
  const l=lottery(s);assert.equal(l.records.length,7);assert.equal(l.records[1].duplicate,true);assert.equal(l.records[1].rank,null);assert.equal(l.ranks.SFB,2);assert.equal(l.ranks.HDC,undefined);assert.equal(l.complete,false);
  s=draw(s,'HDC');assert.equal(lottery(s).complete,true);
});
test('A 2R to B before lottery affects only that right; B own 2R remains',()=>{
  let s=transfer(base());assert.equal(pick(s,'SFB').current_team,'OKF');assert.equal(pick(s,'OKF').current_team,'OKF');
  for(const r of [1,3,4])assert.equal(pick(s,'SFB',r).current_team,'SFB');
  s=draw(draw(s,'SFB'),'OKF');assert.equal(pickRank(s,pick(s,'SFB')),7);assert.equal(pickRank(s,pick(s,'OKF')),6);
  assert.deepEqual(s.teams,seed.teams);assert.equal(s.picks.length,28);
});
test('round directions and custom order are season data',()=>{
  let s=draw(base(),'SFB');for(const r of [1,3])assert.equal(pickRank(s,pick(s,'SFB',r)),1);for(const r of [2,4])assert.equal(pickRank(s,pick(s,'SFB',r)),7);
  const rules=structuredClone(s.rules);rules.rounds[1].direction='custom';rules.rounds[1].order=s.teams.map(t=>t.id).reverse();
  s=change(s,'rules',rules);assert.equal(pickRank(s,pick(s,'KAL')),1);rules.rounds[1].order[1]='KAL';assert.throws(()=>change(s,'rules',rules),/7팀/);
});
test('swaps are atomic; the right count and one owner per right stay invariant',()=>{
  const s=change(base(),'trade_add',{status:'confirmed',date:'2026-10-28',source_url:'https://example.com/swap',conditions:'가상 맞교환',legs:[{pick_id:ID('SFB'),from:'SFB',to:'OKF'},{pick_id:ID('OKF'),from:'OKF',to:'SFB'}]});
  assert.equal(pick(s,'SFB').current_team,'OKF');assert.equal(pick(s,'OKF').current_team,'SFB');assert.equal(new Set(s.picks.map(p=>p.id)).size,28);
  const bad=structuredClone(s.trades[0]);bad.legs[1].from='KEP';assert.throws(()=>change(base(),'trade_add',bad),/보유팀/);assert.equal(seed.trades.length,0);
});
test('reassignment supports chain; cancellation with dependent trade is rejected or explicit cascade',()=>{
  let s=transfer(base());const first=s.trades[0].id;
  s=change(s,'trade_add',{status:'confirmed',date:'2026-10-28',source_url:'https://example.com/retrade',conditions:'재양도',legs:[{pick_id:ID('SFB'),from:'OKF',to:'KEP'}]});
  assert.equal(pick(s,'SFB').current_team,'KEP');assert.throws(()=>change(s,'trade_cancel',null,first),/후속 거래/);
  const cancelled=change(s,'trade_cancel',null,first,{cascade:true});assert.equal(pick(cancelled,'SFB').current_team,'SFB');assert.ok(cancelled.trades.every(t=>t.status==='cancelled'&&t.cancel_reason));assert.equal(s.trades[0].status,'confirmed');
});
test('cancelling the last reassignment restores prior owner and keeps cancellation history',()=>{
  let s=transfer(base());s=change(s,'trade_add',{status:'confirmed',date:'2026-10-28',source_url:'https://example.com/retrade',conditions:'재양도',legs:[{pick_id:ID('SFB'),from:'OKF',to:'KAL'}]});
  s=change(s,'trade_cancel',null,s.trades[1].id);assert.equal(pick(s,'SFB').current_team,'OKF');assert.equal(s.audit.at(-1).action,'trade_cancel');
});
test('pending trades do not change ownership; confirmation requires official date/source',()=>{
  let s=transfer(base(),'SFB','OKF',2,{status:'pending',date:'',source_url:''});assert.equal(pick(s,'SFB').current_team,'SFB');
  assert.throws(()=>change(s,'trade_edit',{...s.trades[0],status:'confirmed'},s.trades[0].id),/공식 출처/);
  s=change(s,'trade_edit',{...s.trades[0],status:'confirmed',date:'2026-10-28',source_url:'https://example.com/official'},s.trades[0].id);assert.equal(pick(s,'SFB').current_team,'OKF');
});
test('completed selection team is frozen through trade cancellation and changes in current team',()=>{
  let s=transfer(base());s=change(s,'result',selection(),ID('SFB'));const result=structuredClone(pick(s,'SFB').result);
  s=change(s,'trade_cancel',null,s.trades[0].id);assert.equal(pick(s,'SFB').current_team,'SFB');assert.deepEqual(pick(s,'SFB').result,result);
  assert.throws(()=>change(s,'result',selection('가상선수','SFB'),ID('SFB')),/정정/);
  s=change(s,'result',selection('가상선수','SFB'),ID('SFB'),{correct_actual_team:true});assert.equal(pick(s,'SFB').result.actual_team,'SFB');assert.equal(s.audit.at(-1).before.actual_team,'OKF');
});
test('lottery corrections move columns, never players to another right',()=>{
  let s=draw(draw(base(),'SFB'),'OKF');s=change(s,'result',selection('가상선수','SFB'),ID('SFB'));
  const right=structuredClone(pick(s,'SFB'));s=change(s,'draw_move',0,s.draws[1].id);
  assert.equal(columns(s)[0].id,'OKF');assert.deepEqual(pick(s,'SFB'),right);assert.equal(pickRank(s,pick(s,'SFB')),6);
  s=change(s,'draw_remove',null,s.draws[0].id);assert.deepEqual(pick(s,'SFB'),right);
});
test('blank is waiting, pass explicit, completed state rejects incomplete results',()=>{
  let s=base();assert.equal(pick(s,'SFB').result.status,'waiting');assert.throws(()=>change(s,'event',{status:'completed'}),/완료/);
  s=change(s,'result',{status:'passed',actual_team:'SFB'},ID('SFB'));assert.equal(pick(s,'SFB').result.player,null);assert.equal(pick(s,'SFB').result.status,'passed');
  for(const t of s.teams)s=draw(s,t.id);
  for(const p of s.picks.filter(p=>p.result.status==='waiting'))s=change(s,'result',{status:'passed',actual_team:p.current_team},p.id);
  s=change(s,'event',{status:'completed'});assert.equal(s.event.status,'completed');
});
test('multiple trainees, corrections and deletion retain per-entry identity',()=>{
  let s=change(base(),'trainee',selection('수련1','SFB'),'SFB');s=change(s,'trainee',selection('수련2','SFB'),'SFB');
  assert.equal(s.trainees.SFB.entries.length,2);const id=s.trainees.SFB.entries[0].id;
  s=change(s,'trainee',selection('수련1수정','SFB'),'SFB',{entry_id:id});assert.equal(s.trainees.SFB.entries[0].id,id);
  s=change(s,'trainee',null,'SFB',{remove_id:id});assert.equal(s.trainees.SFB.entries.length,1);assert.equal(s.trainees.SFB.entries[0].player.name,'수련2');
  assert.throws(()=>change(s,'trainee',{status:'passed'},'SFB'),/개별 삭제/);
});
test('same applicant/player cannot be drafted twice across rounds and trainees',()=>{
  let s=change(base(),'result',selection('중복선수','SFB'),ID('SFB',1));assert.throws(()=>change(s,'trainee',selection('중복선수','SFB'),'SFB'),/이미 지명/);
  const value=selection('연결선수','OKF');value.player.player_id='KVL-P-000008';s=change(s,'result',value,ID('OKF',1));
  value.player.name='다른이름';assert.throws(()=>change(s,'result',value,ID('OKF',3)),/동일 선수/);
});
test('colors remain unknown until input and draw snapshots preserve prior color',()=>{
  let s=change(base(),'color',{name:'노랑',hex:'#ffff00'},'SFB');s=draw(s,'SFB');s=change(s,'color',{name:'빨강',hex:'#ff0000'},'SFB');assert.equal(s.draws[0].color.name,'노랑');
  assert.throws(()=>change(s,'color',{name:'오류',hex:'red;background:url(x)'},'SFB'),/색상/);
});
test('unknown trade state differs from verified absence; URL and lifecycle validated',()=>{
  let s=base();assert.throws(()=>change(s,'trade_review',{status:'none_confirmed',source_url:''}),/출처/);
  s=change(s,'trade_review',{status:'none_confirmed',source_url:'https://example.com/none',note:'확인 완료'});assert.match(renderBoard(s,sources),/확인된 거래 없음/);
  s=transfer(s);assert.equal(s.trade_review.status,'confirmed');assert.throws(()=>change(s,'trade_review',{status:'none_confirmed',source_url:'https://example.com/none'}),/거래 없음/);
  assert.throws(()=>change(base(),'event',{starts_at:'invalid'}),/일시/);
});
test('profile link only comes from verified existing applicant match; snapshot independent of future edits',()=>{
  const a={name:'윤경',affiliation:'인하대',positions:['OH'],applicant_id:'example',player_id:'KVL-P-000008',match_status:'matched',match:{profile_verified:true}};
  const p=playerSnapshot(a);a.affiliation='새 팀';assert.equal(p.affiliation,'인하대');assert.equal(profileURL(p),'player.html?id=KVL-P-000008');
  assert.equal(playerSnapshot({...a,match_status:'unmatched'}).player_id,null);assert.equal(profileURL({player_id:'javascript:alert(1)'}),null);
});
test('new season is independent, unknown allocation does not borrow previous season data',()=>{
  const fresh=createSeason({season:'2027-28',teams:seed.teams.map(t=>({...t,balls:null,probability:null})),rules:seed.rules,source_id:null});
  assert.ok(fresh.picks.every(p=>p.id.startsWith('2027-28:')));assert.ok(fresh.teams.every(t=>t.balls===null));assert.equal(fresh.audit.length,0);
  assert.throws(()=>{fresh.picks[0].id=seed.picks[0].id;validate(fresh);},/고정 ID/);
});
test('render accessible 7-team matrices, escaped content, transfer badges and preserved actual team',()=>{
  let s=transfer(base());s=change(s,'result',selection('<img src=x onerror=alert(1)>','OKF'),ID('SFB'));
  const html=renderBoard(s,sources);assert.match(html,/지명권 양도/);assert.match(html,/삼성화재 → OK저축은행/);assert.match(html,/실제 지명 · OK저축은행/);
  assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;img/);assert.match(html,/scope="row"/);assert.equal((html.match(/data-right=/g)||[]).length,28);assert.equal((html.match(/data-trainee=/g)||[]).length,7);
});
test('new navigation order and legacy links are preserved',()=>{
  const nav=fs.readFileSync(new URL('../assets/js/kvl-global-sidebar-v1.js',import.meta.url),'utf8');
  assert.ok(nav.indexOf("link('vleague-home'")<nav.indexOf("link('vleague-cup'"));assert.ok(nav.indexOf("link('vleague-cup'")<nav.indexOf("link('vleague-draft'"));
  assert.match(nav,/link\('players-draft','draft-hub.html'/);assert.match(nav,/vleague-draft.*active==='vleague'/);
});

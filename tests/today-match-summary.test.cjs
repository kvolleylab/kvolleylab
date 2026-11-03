'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../assets/js/kvl-competition-data-v2.js');
const now=Date.parse('2026-11-03T20:07:00+09:00'),options={requireVerification:true};
const result={home:3,away:1,sets:[{home:25,away:20},{home:20,away:25},{home:25,away:22},{home:25,away:20}]};
const game=(id,date='2026-11-03',extra={})=>({id,date,time:'19:00',status:'scheduled',...extra});
const previous=game('previous','2026-11-01',{status:'final',score:result,scoreVerification:true}),next=game('next','2026-11-04');
function live(extra={}){return game('today','2026-11-03',{status:'live',officialSourceKey:'023:001:MALE:5',source:'https://user-api.kovo.co.kr/stat/game-schedule?gender=1',liveScore:{home:1,away:1,sourceKey:'023:001:MALE:5',observedAt:'2026-11-03T11:00:00Z'},...extra});}
for(const state of ['scheduled','live','final','suspended'])test(state+': today occupies the next slot all day without duplicating recent',()=>{
 const current=state==='live'?live():game('today','2026-11-03',{status:state,...(state==='final'?{score:result,scoreVerification:true}:{})});
 const records=[previous,current,next],copy=JSON.stringify(records),p=api.selectMatchSummary(records,now,options);
 assert.equal(p.recent.id,'previous');assert.equal(p.next.id,'today');assert(p.hasToday);assert.equal(JSON.stringify(records),copy);
 const view=api.matchSummaryState(current,now,options);
 if(state==='scheduled'){assert.equal(view.kind,'waiting');assert.equal(view.score,null);}
 if(state==='live'){assert.equal(view.kind,'live');assert.equal(view.score.home,1);assert.match(view.detail,/20:00/);}
 if(state==='final'){assert(view.finished);assert.equal(view.score.home,3);}
 if(state==='suspended')assert.equal(view.label,'경기 중단');
});
test('today final moves to recent at Korea midnight and next slot shows the next date',()=>{
 const current=game('today','2026-11-03',{status:'final',score:result,scoreVerification:true});
 const p=api.selectMatchSummary([previous,current,next],Date.parse('2026-11-03T15:00:00Z'),options);
 assert.equal(p.today,'2026-11-04');assert.equal(p.recent.id,'today');assert.equal(p.next.id,'next');
});
test('before start and no-match days use the same slot and never fabricate a score',()=>{
 const current=game('today');assert.equal(api.matchSummaryState(current,Date.parse('2026-11-03T09:00:00Z'),options).label,'오늘 경기 예정');
 const p=api.selectMatchSummary([previous,next],now,options);assert.equal(p.next.id,'next');assert(!p.hasToday);
 assert.equal(api.matchSummaryState(next,now,options).score,null);
});
test('live takes priority on multi-match days; cancelled and postponed games stay excluded',()=>{
 const p=api.selectMatchSummary([previous,game('cancelled',undefined,{status:'cancelled'}),game('postponed',undefined,{status:'postponed'}),game('early',undefined,{time:'14:00',status:'final',score:result,scoreVerification:true}),live(),next],now,options);
 assert.equal(p.next.id,'today');assert.equal(p.recent.id,'previous');
});
test('stale observed scores retain their timestamp and are explicitly delayed',()=>{
 const m=live();m.liveScore.observedAt='2026-11-03T10:00:00Z';const s=api.matchSummaryState(m,now,options);
 assert.equal(s.kind,'stale');assert.equal(s.label,'갱신 지연');assert.equal(s.score.home,1);assert.match(s.detail,/19:00/);
});
test('unproven, cross-match, future, prior-day and malformed scores never appear as live scores',()=>{
 for(const change of [m=>delete m.liveScore,m=>m.liveScore.sourceKey='023:001:FEMALE:6',m=>m.liveScore.observedAt='2026-11-04T11:00:00Z',m=>m.liveScore.observedAt='2026-11-02T11:00:00Z',m=>m.liveScore.home=3,m=>m.source='not a url',m=>m.source='https://example.com/stat/game-schedule']){
  const m=live();change(m);assert.equal(api.matchSummaryState(m,now,options).score,null);assert.equal(api.matchSummaryState(m,now,options).label,'상태 확인 중');
 }
 const m=live({score:result,scoreVerification:true});assert(!api.matchSummaryState(m,now,options).finished);
});
test('home explicit final verification stays stricter than legacy competition results',()=>{
 const m=game('today',undefined,{status:'final',score:result,scoreVerification:false});
 assert(!api.matchSummaryState(m,now,options).finished);assert.equal(api.matchSummaryState(m,now,options).score,null);
});

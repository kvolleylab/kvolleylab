import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=new URL('../',import.meta.url),seed=JSON.parse(await fs.readFile(new URL('tests/fixtures/draft-board-empty-2026-27.json',root)));
const html=await fs.readFile(new URL('v-league-draft.html',root),'utf8');
let persisted=structuredClone(seed),sha='seed',requests=0,deny=false,serial=0;
const json=(v,status=200)=>new Response(JSON.stringify(v),{status});
const fetcher=async(url,options={})=>{
 if(url==='https://api.github.com/user')return json({login:'ui-fixture-admin'});
 if(url==='https://api.github.com/repos/kvolleylab/kvolleylab')return json({permissions:{push:true}});
 if(String(url).startsWith('https://api.github.com/')){
  if(options.method==='PUT'){
   assert.equal(options.headers.Authorization,'Bearer ui-fixture-token');requests++;
   if(deny)return json({},409);
   const body=JSON.parse(options.body);assert.equal(body.sha,sha);persisted=JSON.parse(Buffer.from(body.content,'base64'));sha=`sha-${++serial}`;return json({content:{sha},commit:{sha}});
  }
  return json({content:Buffer.from(JSON.stringify(persisted)).toString('base64'),sha});
 }
 return json(JSON.parse(await fs.readFile(new URL(url,root))));
};
async function tickUntil(check){for(let n=0;n<50;n++){if(check())return;await new Promise(r=>setTimeout(r,5));}assert.ok(check(),'UI operation did not finish');}
test('real page module: admin forms, applicant selection, trades, persistence, errors and unknown season',async t=>{
 const saved={};for(const key of ['window','document','location','history','FormData','fetch'])saved[key]=globalThis[key];
 let dom;
 const open=async(query='')=>{
  dom?.window.close();dom=new JSDOM(html,{url:'https://kvolleylab.com/v-league-draft.html'+query,pretendToBeVisual:true});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,history:dom.window.history,FormData:dom.window.FormData,fetch:fetcher});
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  await import(`../assets/js/draft-board-page.mjs?ui=${++serial}`);
 };
 const $=selector=>document.querySelector(selector);
 const click=selector=>{const el=$(selector);assert.ok(el,selector);el.click();};
 const input=(name,value,event='input')=>{const el=$(`#draftForm [name="${name}"]`);assert.ok(el,name);el.value=value;el.dispatchEvent(new dom.window.Event(event,{bubbles:true}));};
 const submit=async()=>{
  const form=$('#draftForm');if(form.elements.reason)input('reason','격리 UI 테스트');form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  await tickUntil(()=>!$('#editor').open||!$('#formError').hidden);
 };
 const auth=async()=>{click('#adminOpen');input('token','ui-fixture-token');await submit();assert.equal($('#editor').open,false);};
 try{
  await open();
  await t.test('public view, exact original navigation, and local admin flag cannot enable writes',async()=>{
   assert.equal(document.querySelectorAll('[data-right]').length,28);assert.equal(document.querySelectorAll('[data-action="result"]').length,0);
   dom.window.localStorage.setItem('kvlAdminAccess','1');assert.equal(document.querySelectorAll('[data-action="result"]').length,0);assert.match($('#saveStatus').textContent,/저장소 확인 완료/);assert.match($('#draftBoard').textContent,/확률/);
   assert.ok($('#adminLoadBar').hidden);assert.equal($('#season').selectedOptions[0].textContent,'2026년');assert.equal($('#season').value,'2026-27');
   assert.doesNotMatch($('#draftBoard').textContent,/주요 수정 이력|시즌 출처와 확인 필요 자료/);
  });
  await auth();
  await t.test('authenticated editor receives audit, source details and manual reload controls',async()=>{
   assert.equal($('#adminLoadBar').hidden,false);assert.match($('#draftBoard').textContent,/주요 수정 이력/);assert.match($('#draftBoard').textContent,/시즌 출처와 확인 필요 자료/);
  });
  await t.test('lottery settings persist and round edits preserve the separate lottery policy',async()=>{
   click('[data-action="lottery-rules"]');input('resetAfter','3');$('#draftForm [name="automaticLast"]').checked=true;input('verification','user_record','change');input('note','상위3팀 제외 후 재추첨');await submit();
   assert.equal(persisted.rules.lottery.reset_after_rank,3);assert.equal(persisted.rules.lottery.automatic_last,true);
   click('[data-action="rules"]');await submit();assert.equal(persisted.rules.lottery.reset_after_rank,3);assert.equal(persisted.rules.lottery.automatic_last,true);
  });
  await t.test('color editor saves and duplicate draw editor only creates one lottery rank',async()=>{
   click('[data-action="color"][data-target="SFB"]');$('#draftForm [name="unknown"]').checked=false;input('colorName','검증용 빨강');input('hex','#ff0000');await submit();assert.equal(persisted.teams[0].color.name,'검증용 빨강');
   for(let n=0;n<2;n++){click('[data-action="draw-add"]');input('team','SFB','change');await submit();}
   assert.equal(persisted.draws.length,2);assert.match($('#draftDraws').textContent,/1 \/ 7팀 확정/);assert.match($('#draftDraws').textContent,/중복 1회/);
  });
  await t.test('2R transfer form changes one right and leaves recipient own right',async()=>{
   click('[data-action="trade-add"]');input('tradeStatus','confirmed','change');input('date','2026-10-28');input('sourceURL','https://example.com/fixture-official');
   $('[data-leg-pick]').value='2026-27:M:2:SFB';$('[data-leg-pick]').dispatchEvent(new dom.window.Event('change',{bubbles:true}));$('[data-leg-to]').value='OKF';await submit();
   assert.equal($('#editor').open,false);assert.equal(persisted.picks.find(p=>p.id==='2026-27:M:2:SFB').current_team,'OKF');assert.equal(persisted.picks.find(p=>p.id==='2026-27:M:2:OKF').current_team,'OKF');assert.match($('[data-right="2026-27:M:2:SFB"]').textContent,/지명권 양도/);
  });
  await t.test('verified applicant search selects canonical profile and actual team snapshot',async()=>{
   click('[data-action="result"][data-target="2026-27:M:2:SFB"]');input('status','selected','change');input('search','윤경');assert.equal(document.querySelectorAll('[data-applicant]').length,1);click('[data-applicant]');await submit();
   assert.equal($('#editor').open,false);const result=persisted.picks.find(p=>p.id==='2026-27:M:2:SFB').result;assert.equal(result.actual_team,'OKF');assert.equal(result.player.name,'윤경');assert.equal(result.player.player_id,'KVL-P-000008');assert.match($('[data-right="2026-27:M:2:SFB"] .db-pick-name').href,/player.html\?id=KVL-P-000008/);
  });
  await t.test('explicit pass and manual selection work in other rounds',async()=>{
   click('[data-action="result"][data-target="2026-27:M:1:OKF"]');input('status','passed','change');await submit();assert.equal(persisted.picks.find(p=>p.id==='2026-27:M:1:OKF').result.status,'passed');
   click('[data-action="result"][data-target="2026-27:M:3:SFB"]');input('status','selected','change');input('playerName','가상직접입력');input('affiliation','테스트 학교');input('position','MB');await submit();assert.equal(persisted.picks.find(p=>p.id==='2026-27:M:3:SFB').result.player.player_id,null);
  });
  await t.test('multiple trainees save through disabled-team selector and are editable',async()=>{
   for(const name of ['가상수련1','가상수련2']){click('[data-action="trainee"][data-target="SFB"]:not([data-entry])');input('playerName',name);input('affiliation','테스트 학교');input('position','L');await submit();assert.equal($('#editor').open,false);}
   assert.equal(persisted.trainees.SFB.entries.length,2);assert.ok(persisted.trainees.SFB.entries.every(e=>e.actual_team==='SFB'));
   click('[data-action="trainee"][data-entry]');input('position','OH');await submit();assert.equal(persisted.trainees.SFB.entries[0].player.position,'OH');
  });
  await t.test('cancellation form preserves actual drafting team and confirms history',async()=>{
   click('[data-action="trade-edit"]');click('#cancelTrade');await submit();assert.equal($('#editor').open,false);const p=persisted.picks.find(p=>p.id==='2026-27:M:2:SFB');assert.equal(p.current_team,'SFB');assert.equal(p.result.actual_team,'OKF');assert.match($('#draftTrades').textContent,/취소 1건/);
  });
  await t.test('refresh reads saved backend data, removes authentication and retains player snapshot',async()=>{
   const revision=persisted.revision;await open();assert.equal(document.querySelectorAll('[data-action="result"]').length,0);assert.match($('#saveStatus').textContent,new RegExp(`버전 ${revision}`));assert.match($('[data-right="2026-27:M:2:SFB"]').textContent,/윤경/);assert.match($('[data-right="2026-27:M:2:SFB"]').textContent,/실제 지명 · OK저축은행/);
  });
  await t.test('conflict leaves dialog/input visible and does not show saved success',async()=>{
   await auth();deny=true;const revision=persisted.revision;click('[data-action="color"][data-target="SFB"]');input('colorName','저장되면 안 됨');await submit();assert.equal($('#editor').open,true);assert.match($('#formError').textContent,/다른 관리자/);assert.equal($('#draftForm [name="colorName"]').value,'저장되면 안 됨');assert.equal(persisted.revision,revision);deny=false;
  });
  await t.test('unknown season fails explicitly without showing another season data',async()=>{await open('?season=2025-26');assert.match($('#draftError').textContent,/등록되지 않은 시즌/);assert.equal($('#draftBoard').textContent,'');});
  assert.ok(requests>=12);
 }finally{dom?.window.close();for(const [key,value]of Object.entries(saved))globalThis[key]=value;}
});

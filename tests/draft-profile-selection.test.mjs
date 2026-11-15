import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {joinApplicants} from '../assets/js/draft-applicants-core.mjs';
import {mergeResults,draftHubURL} from '../assets/js/draft-history-v1.mjs';
import {findVerifiedDraftSelection,renderVerifiedDraftSelection} from '../assets/js/draft-profile-selection-v1.mjs';

const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.KVL_JSDOM_PATH || 'jsdom');
const read=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const dataset=read('data/draft-applicants/2026-27/applicants.json');
const links=read('data/draft-applicants/2026-27/player-links.json');
const results=read('data/draft-applicants/2026-27/results.json');
const rows=mergeResults(joinApplicants(dataset,links),results,'2026-27');

test('all 34 official picks remain visible; only 30 verified identities can decorate a profile',()=>{
 const picks=rows.filter(row=>row.selection.status==='selected');
 assert.equal(picks.length,34);
 const decorated=picks.filter(row=>findVerifiedDraftSelection(rows,row.player_id,row.name));
 assert.equal(decorated.length,30);
 assert.equal(picks.filter(row=>!row.player_id).length,4);
 assert.ok(decorated.every(row=>row.match_status==='matched'&&row.match.profile_verified));
});

test('official club and pick stay tied to the same existing Player ID',()=>{
 const yoon=rows.find(row=>row.name==='윤경'&&row.selection.status==='selected');
 assert.equal(yoon.player_id,'KVL-P-000008');
 const selected=findVerifiedDraftSelection(rows,yoon.player_id,yoon.name);
 assert.equal(selected.selection.team,'OK저축은행');
 assert.equal(selected.selection.round,1);
 assert.equal(selected.selection.pick,1);
 assert.equal(findVerifiedDraftSelection(rows,yoon.player_id,'다른 선수'),null);
 assert.equal(findVerifiedDraftSelection(rows,'KVL-P-999999',yoon.name),null);
 assert.equal(findVerifiedDraftSelection(rows,null,yoon.name),null);
 assert.equal(findVerifiedDraftSelection([{...yoon,selection:{...yoon.selection,record_status:'REVIEW'}}],yoon.player_id,yoon.name),null);
 assert.equal(findVerifiedDraftSelection([{...yoon,match:{...yoon.match,profile_verified:false}}],yoon.player_id,yoon.name),null);
});

test('draft selection hero is additive and does not overwrite former school or claim roster registration',()=>{
 const yoon=rows.find(row=>row.name==='윤경'&&row.selection.status==='selected');
 const dom=new JSDOM('<main id="playerArea"><section class="pd-hero"><div class="pd-card"><h1 class="pd-title">윤경</h1><div class="pd-badges"></div></div><div class="pd-card"><div class="pd-summary"><div class="pd-stat"><span>소속</span><strong>인하대</strong></div></div></div></section></main>');
 try{
  const area=dom.window.document.getElementById('playerArea'),selected=findVerifiedDraftSelection(rows,yoon.player_id,'윤경');
  assert.equal(renderVerifiedDraftSelection(area,selected,draftHubURL(selected)),true);
  assert.equal(renderVerifiedDraftSelection(area,selected,draftHubURL(selected)),false);
  assert.equal(area.querySelectorAll('#playerDraftSelection').length,1);
  const box=area.querySelector('#playerDraftSelection');
  assert.match(box.textContent,/OK저축은행/);
  assert.match(box.textContent,/1라운드 1순위/);
  assert.match(box.textContent,/등록과 별개/);
  assert.match(box.querySelector('a').getAttribute('href'),/^draft-hub\.html\?/);
  assert.match(box.querySelectorAll('a')[1].getAttribute('href'),/^https:\/\/cdn\.kovo\.co\.kr/);
  assert.equal(area.querySelector('.pd-stat strong').textContent,'인하대');
 }finally{dom.window.close()}
});

test('trainee pick is shown without fictitious round or pick',()=>{
 const trainee=rows.find(row=>row.selection.status==='selected'&&row.selection.kind==='trainee'&&row.player_id);
 assert.ok(trainee);
 const dom=new JSDOM('<main id="playerArea"><section class="pd-hero"><div class="pd-card"><h1 class="pd-title"></h1><div class="pd-badges"></div></div></section></main>');
 try{
  assert.equal(renderVerifiedDraftSelection(dom.window.document.getElementById('playerArea'),trainee,draftHubURL(trainee)),true);
  const text=dom.window.document.getElementById('playerDraftSelection').textContent;
  assert.match(text,/수련선수 지명/);
  assert.doesNotMatch(text,/null순위/);
 }finally{dom.window.close()}
});

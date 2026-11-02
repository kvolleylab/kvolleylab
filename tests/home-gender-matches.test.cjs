'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const slug=g=>'v-league-'+g+'-2026-27';
async function setup({now='2026-11-02T12:00:00Z',edit,fail=()=>false}={}){
 const sources={};for(const g of ['men','women'])for(const s of ['university-league-'+g+'-2026','kovo-cup-'+g+'-2026',slug(g)])sources[s]=JSON.parse(fs.readFileSync(path.join(root,'data/competitions',s,'data.json'),'utf8'));
 if(edit)edit(sources);const before=JSON.stringify(sources),requests=[];
 const dom=new JSDOM(html,{url:'https://kvolleylab.com/',runScripts:'outside-only'}),w=dom.window;
 w.Date.now=()=>Date.parse(now);w.fetch=async url=>{const s=url.split('/')[3];requests.push(s);if(fail(s))throw Error('offline');return {ok:true,json:async()=>sources[s]};};
 const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('home did not finish loading')),2000);const observer=new w.MutationObserver(()=>{if(w.document.querySelector('#home-matches').getAttribute('aria-busy')==='false'){clearTimeout(timer);observer.disconnect();resolve();}});observer.observe(w.document.querySelector('#home-matches'),{attributes:true});});
 for(const script of w.document.querySelectorAll('script:not([src])'))w.eval(script.textContent);
 await ready;return {w,doc:w.document,sources,before,requests,close:()=>w.close()};
}
const score={home:3,away:2,sets:[{home:25,away:20},{home:23,away:25},{home:25,away:22},{home:20,away:25},{home:15,away:12}]};
function game(d,id,date,time,extra={}){return {id,date,time,home:{code:d.participants[0].code},away:{code:d.participants[1].code},...extra};}
function reset(sources){for(const d of Object.values(sources))d.matches=[];}
const pick=(doc,kind,g)=>doc.querySelector(`[data-kind="${kind}"] [data-gender="${g}"]`);
test('operating feeds render both divisions in two cards with exact scores, logos and dated links',async()=>{
 const s=await setup();try{
  assert.equal(s.requests.length,6);assert.equal(s.doc.querySelectorAll('.match-column').length,2);
  assert.deepEqual([...s.doc.querySelectorAll('[data-match-id]')].map(n=>n.dataset.matchId),['VL2627-M-002','VL2627-W-002','VL2627-M-003','VL2627-W-003']);
  for(const g of ['men','women'])for(const kind of ['recent','next']){const row=pick(s.doc,kind,g),url=new URL(row.href);assert.equal(url.searchParams.get('competition'),slug(g));assert.equal(url.searchParams.get('view'),'schedule');assert.equal(url.searchParams.get('date'),kind==='recent'?'2026-11-01':'2026-11-03');assert.equal(row.querySelectorAll('img').length,2);for(const img of row.querySelectorAll('img'))assert(fs.existsSync(path.join(root,new URL(img.src).pathname)));}
  assert.match(pick(s.doc,'recent','women').textContent,/흥국생명.*3 : 0.*SOOP/s);
  assert.deepEqual([...pick(s.doc,'recent','women').querySelectorAll('abbr')].map(n=>n.textContent),['25–20','25–20','25–22']);
  assert.match(pick(s.doc,'next','women').textContent,/IBK기업은행.*VS.*현대건설/s);
  assert.equal(s.doc.querySelectorAll('#match-source a').length,1);assert.match(s.doc.querySelector('#match-source').textContent,/KOVO 공식 홈페이지/);assert(!s.doc.querySelector('#match-source').textContent.includes('U-리그 공식 자료'));
  assert.equal(JSON.stringify(s.sources),s.before);
 }finally{s.close();}
});
test('each division selects independently and excludes unverified, partial, cancelled and invalid fixtures',async()=>{
 const s=await setup({edit:sources=>{reset(sources);for(const g of ['men','women']){const d=sources[slug(g)],date=g==='men'?'2026-11-01':'2026-10-30';d.matches=[game(d,g+'-final',date,'14:00',{score,scoreVerification:true,status:'final'}),game(d,g+'-partial','2026-11-02','10:00',{score:{home:2,away:1},scoreVerification:true}),game(d,g+'-unverified','2026-11-02','11:00',{score,scoreVerification:false}),game(d,g+'-cancelled','2026-11-03','10:00',{status:'cancelled'}),game(d,g+'-live','2026-11-02','12:00',{score,scoreVerification:true,status:'live'}),game(d,g+'-invalid','2026-11-31','10:00'),game(d,g+'-unknown','2026-11-03','11:00',{home:{code:'MISSING'}}),game(d,g+'-next','2026-11-04','19:00')];}}});try{
  for(const g of ['men','women']){assert.equal(pick(s.doc,'recent',g).dataset.matchId,g+'-final');assert.equal(pick(s.doc,'next',g).dataset.matchId,g+'-next');assert.equal(pick(s.doc,'recent',g).querySelectorAll('abbr').length,5);}
  assert.equal(JSON.stringify(s.sources),s.before);
 }finally{s.close();}
});
test('KST boundary retains unknown-time same-day schedules and excludes elapsed start times',async()=>{
 const s=await setup({now:'2026-11-01T15:30:00Z',edit:sources=>{reset(sources);const d=sources[slug('women')];d.matches=[game(d,'past','2026-11-01','23:00'),game(d,'unknown','2026-11-02',''),game(d,'tomorrow','2026-11-03','14:00')];}});try{assert.equal(pick(s.doc,'next','women').dataset.matchId,'unknown');assert.match(pick(s.doc,'next','women').textContent,/시간 미정/);}finally{s.close();}
});
test('female feed failure leaves male results visible and is distinct from an empty season',async()=>{
 const s=await setup({fail:slug=>slug.includes('-women-')});try{assert(pick(s.doc,'recent','men').dataset.matchId);assert.match(pick(s.doc,'recent','women').textContent,/불러오지 못/);assert.match(s.doc.querySelector('#match-source').textContent,/일부 기록 조회 실패/);}finally{s.close();}
 const empty=await setup({edit:reset});try{assert.equal(empty.doc.querySelectorAll('.match-empty').length,4);assert.match(pick(empty.doc,'next','women').textContent,/확인된 다음 일정이 없습니다/);assert(!empty.doc.querySelector('#match-source').textContent.includes('실패'));}finally{empty.close();}
});
test('season end preserves latest result and does not promote past or cancelled fixtures',async()=>{
 const s=await setup({now:'2027-05-01T00:00:00Z'});try{for(const g of ['men','women']){assert(pick(s.doc,'recent',g).dataset.matchId);assert(!pick(s.doc,'next',g).dataset.matchId);}}finally{s.close();}
});
test('home search and competition filters remain independent of the four match rows',async()=>{
 const s=await setup();try{const ids=[...s.doc.querySelectorAll('[data-match-id]')].map(n=>n.dataset.matchId);s.doc.querySelector('#genders [data-gender="women"]').click();s.doc.querySelector('#groups [data-filter="pro"]').click();assert([...s.doc.querySelectorAll('#events a')].every(n=>n.href.includes('-women-')));const q=s.doc.querySelector('#q');q.value='V-리그 여자부';q.dispatchEvent(new s.w.Event('input'));assert(s.doc.querySelector('#find-results a').href.includes('v-league-women'));q.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Escape'}));assert(!s.doc.querySelector('#find-results').classList.contains('show'));assert.deepEqual([...s.doc.querySelectorAll('[data-match-id]')].map(n=>n.dataset.matchId),ids);}finally{s.close();}
});

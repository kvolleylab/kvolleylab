const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('prototypes/vleague-matrix-v3/index.html','utf8');
const source=g=>JSON.parse(fs.readFileSync(`data/competitions/v-league-${g}-2026-27/data.json`));
const config=g=>JSON.parse(fs.readFileSync(`data/competitions/v-league-${g}-2026-27/config.json`));
test('actual compiled HTML: timer binding, gender switching, scheduled refresh, failure status',async()=>{
 let tick,fail=false;const errs=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
 const dom=new JSDOM(html,{url:'https://preview.test/index.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.setInterval=function(fn,ms){assert.ok(this===w||this===globalThis||this===undefined,'timer must not use the timers object as Window');assert.equal(ms,60000);tick=fn;return 12;};w.clearInterval=()=>{};
  w.fetch=async url=>{if(fail)throw Error('network');const g=url.includes('league-men-')?'men':'women';return{ok:true,json:async()=>url.includes('config.json')?config(g):source(g)};};
 }});
 const wait=()=>new Promise(r=>setImmediate(r));await wait();await wait();const d=dom.window.document;
 assert.equal(d.querySelectorAll('.matrix-table').length,6);assert.equal(d.querySelector('#matrix-status').dataset.state,'live');assert.equal(typeof tick,'function');
 d.querySelector('button[data-gender="women"]').click();await wait();assert.equal(d.querySelector('#matrix-gender-name').textContent,'여자부');assert.equal(d.querySelector('.matrix-team').textContent,'GS');
 assert.equal(new URL(d.querySelector('#matrix-season-link').href).searchParams.get('view'),'groups');
 assert.equal(new URL(d.querySelector('#matrix-season-link').href).searchParams.get('competition'),'v-league-women-2026-27');
 fail=true;await tick();assert.equal(d.querySelector('#matrix-status').dataset.state,'error');assert.equal(d.querySelector('.matrix-team').textContent,'GS');
 fail=false;await tick();assert.equal(d.querySelector('#matrix-status').dataset.state,'live');assert.deepEqual(errs,[]);dom.window.close();
});

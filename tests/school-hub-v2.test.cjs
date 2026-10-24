const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
async function setup(query='division=school',fail=false){
  const dom=new JSDOM(read('domestic-competitions.html'),{url:'https://kvolleylab.com/domestic-competitions.html?'+query,runScripts:'outside-only'}),w=dom.window,calls=[];
  w.fetch=async url=>{calls.push(url);if(fail)throw Error('offline');return {ok:true,json:async()=>JSON.parse(read(String(url).split('?')[0]))};};
  w.eval(read('assets/js/school-competitions-hub.js'));
  for(let i=0;i<15&&!w.document.body.dataset.ready;i++)await new Promise(r=>setImmediate(r));
  return {w,doc:w.document,calls};
}
test('canonical school catalog renders six events, verified podiums and no invented CBS results',async()=>{
 const {w,doc,calls}=await setup();try{
  assert.equal(doc.querySelectorAll('.tournament').length,6);
  assert.equal(doc.querySelector('#stat-matches').textContent,'486경기');
  assert.equal(doc.querySelectorAll('.year-block').length,4);
  assert.equal(doc.querySelector('.year-block').open,true);
  assert.equal(doc.querySelectorAll('.tournament:first-child .empty-podium').length,4);
  const ibk=doc.querySelectorAll('.tournament')[1];
  assert.equal(ibk.querySelector('.podium.men .rank b').textContent,'인하사대부고');
  assert.equal(ibk.querySelector('.podium.women .rank b').textContent,'중앙여고');
  assert.equal(ibk.querySelectorAll('.medal-3').length,8);
  for(const a of doc.querySelectorAll('.podium-link,.tournament-link')){
   const url=new URL(a.href);assert.equal(url.origin,w.location.origin);assert.ok(fs.existsSync(path.join(root,url.pathname)));assert.ok(['overview','standings'].includes(url.searchParams.get('view')));
  }
  assert.ok(calls.includes('data/competitions/school-years.json'));
  assert.equal(calls.filter(p=>p.startsWith('data/domestic/')).length,5);
 }finally{w.close();}
});
test('division/search/status preserve the school route and restore correctly after reload',async()=>{
 const {w,doc}=await setup();try{
  doc.querySelector('[data-division="high-women"]').click();
  const search=doc.querySelector('#search');search.value='중앙여고';search.dispatchEvent(new w.Event('input'));
  assert.equal(doc.querySelectorAll('.tournament').length,2);
  assert.equal(new URL(w.location.href).searchParams.get('division'),'school');
  assert.equal(new URL(w.location.href).searchParams.get('category'),'high-women');
  for(const a of doc.querySelectorAll('.podium-link'))assert.equal(new URL(a.href).searchParams.get('division'),'18세이하 여자부');
  const restored=await setup(w.location.search.slice(1));
  try{assert.equal(restored.doc.querySelectorAll('.tournament').length,2);assert.equal(restored.doc.querySelector('#search').value,'중앙여고');}finally{restored.w.close();}
  const status=doc.querySelector('#status');status.value='upcoming';status.dispatchEvent(new w.Event('change'));
  assert.ok(doc.querySelector('.empty-results'));
  doc.querySelector('#reset').click();assert.equal(doc.querySelectorAll('.tournament').length,6);
 }finally{w.close();}
});
test('other domestic routes remain unchanged and unavailable catalogs show an error',async()=>{
 const other=await setup('division=pro');try{assert.equal(other.calls.length,0);assert.equal(other.doc.querySelector('.school-hub-v2'),null);}finally{other.w.close();}
 const failed=await setup('division=school',true);try{assert.match(failed.doc.querySelector('#archive-list').textContent,/불러오지 못했습니다/);assert.equal(failed.doc.querySelectorAll('.tournament').length,0);}finally{failed.w.close();}
});

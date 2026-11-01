/* Focused DOM checks for the new, isolated view. Requires the existing QA jsdom. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH || 'jsdom');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'previews/school-university-v1');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/competitions/school-index-2026.json')));
const html=fs.readFileSync(path.join(source,'index.html'),'utf8');
const script=fs.readFileSync(path.join(source,'school.js'),'utf8');
const pause=()=>new Promise(resolve=>setTimeout(resolve,15));
async function open(query='division=school',missing=false){
  const dom=new JSDOM(html,{url:'https://preview.test/domestic-competitions.html?'+query,runScripts:'outside-only'});
  dom.window.fetch=async url=>({ok:!missing,status:missing?500:200,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url),'utf8'))});
  dom.window.matchMedia=()=>({matches:true});
  dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  if(missing)dom.window.console.error=()=>{};
  dom.window.eval(script);await pause();return dom;
}
(async()=>{
  const dom=await open(),w=dom.window,d=w.document;
  assert.equal(d.querySelector('main').dataset.ready,'true');
  assert.equal(d.querySelectorAll('.univ-featured-card').length,3);
  assert.equal(d.querySelectorAll('.univ-category-card').length,6);
  assert.equal(d.querySelectorAll('.univ-record-card').length,6);
  assert.equal(d.querySelectorAll('[data-division-panel]').length,24);
  assert.equal(catalog.competitions.reduce((sum,item)=>sum+item.gameCount,0),600);
  for(const item of catalog.competitions){
    const card=d.getElementById('record-'+item.competitionId);
    for(const [key,rows] of Object.entries(item.divisionResults)){
      const panel=card.querySelector('[data-division-panel="'+key+'"]');
      assert.equal(new URL(panel.href).searchParams.get('competition'),item.enginePrefix+'-'+key);
      assert.equal(new URL(panel.href).searchParams.get('view'),'knockout');
      const rendered=[...panel.querySelectorAll('.univ-rank-row')];
      assert.deepEqual(rendered.map(row=>row.querySelector('strong').textContent),rows.map(row=>row.team));
      rows.forEach((row,i)=>assert.equal(rendered[i].querySelector('.univ-rank-label').textContent,(rows.filter(r=>r.rank===row.rank).length>1?'공동 ':'')+row.rank+'위'));
    }
  }
  assert.equal(d.querySelectorAll('.school-partial-note').length,4);
  d.querySelector('[data-division="high-women"]').click();
  assert.equal(d.querySelectorAll('[data-division-panel]').length,6);
  assert.equal(new URL(w.location).searchParams.get('category'),'high-women');
  assert.ok([...d.querySelectorAll('.univ-record-link')].every(a=>new URL(a.href).searchParams.get('competition').endsWith('-high-women')));
  const input=d.getElementById('schoolSearch');input.value='선명여고';input.dispatchEvent(new w.Event('input'));
  const expected=catalog.competitions.filter(item=>item.divisionResults['high-women'].some(row=>row.team.includes('선명여고'))).length;
  assert.equal(d.querySelectorAll('.univ-record-card').length,expected);
  input.value='존재하지않는학교';input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.univ-record-card').length,0);
  d.querySelector('[data-reset]').click();assert.equal(d.querySelectorAll('.univ-record-card').length,6);
  d.getElementById('schoolStatus').value='upcoming';d.getElementById('schoolStatus').dispatchEvent(new w.Event('change'));assert.equal(d.querySelectorAll('.univ-record-card').length,0);
  d.querySelector('[data-record-jump="ibk-middle-high-2026"]').click();assert.equal(d.querySelectorAll('.univ-record-card').length,6);
  d.getElementById('schoolSort').value='oldest';d.getElementById('schoolSort').dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelector('.univ-record-card').dataset.competitionId,'spring-middle-high-2026');
  d.getElementById('schoolYearSelect').value='2025';d.getElementById('schoolYearSelect').dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelector('[data-year-toggle="2025"]').getAttribute('aria-expanded'),'true');
  assert.equal(d.querySelector('[data-year-toggle="2026"]').getAttribute('aria-expanded'),'false');
  w.history.replaceState(null,'','?division=school&category=middle-men&q=송산중');w.dispatchEvent(new w.PopStateEvent('popstate'));
  assert.equal(d.getElementById('schoolSearch').value,'송산중');assert.equal(d.querySelectorAll('[data-division-panel="high-men"]').length,0);
  dom.window.close();
  const deep=await open('division=school&category=middle-women&sort=name');assert.equal(deep.window.document.querySelectorAll('[data-division-panel="middle-women"]').length,6);deep.window.close();
  const failure=await open('division=school',true);assert.equal(failure.window.document.querySelector('main').dataset.ready,'error');assert.match(failure.window.document.getElementById('schoolRecords').textContent,/불러오지 못했습니다/);failure.window.close();
  console.log('PASS: 6 competitions / 24 division panels / 87 source podium rows; links, joint ranks, partial records, filtering, sorting, years, URL restoration and fetch failure.');
})().catch(error=>{console.error(error);process.exitCode=1;});

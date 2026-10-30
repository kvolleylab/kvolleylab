import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {mergeListDetails,highlightedApplicant} from '../assets/js/draft-applicant-list.mjs';
import {joinApplicants} from '../assets/js/draft-applicants-core.mjs';
const require=createRequire(import.meta.url),{JSDOM,VirtualConsole}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(new URL('..',import.meta.url).pathname),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const dataset=json('data/draft-applicants/2026-27/applicants.json'),details=json('data/draft-applicants/2026-27/list-details.json'),rows=joinApplicants(dataset,json('data/draft-applicants/2026-27/player-links.json'));
test('official details enrich all 59 men without changing application identities or other divisions',()=>{
  const before=structuredClone(rows),result=mergeListDetails(rows,details,'2026-27'),men=result.filter(p=>p.gender==='M');
  assert.equal(men.length,59);assert.ok(men.every(p=>p.birth_date&&p.weight_kg&&p.previous_school));assert.deepEqual(rows,before);
  for(let i=0;i<rows.length;i++){const {birth_date,weight_kg,previous_school,...rest}=result[i];assert.deepEqual(rest,rows[i]);}
  assert.equal(men[0].birth_date,'2005-01-20');assert.equal(men[0].weight_kg,83.6);assert.equal(men[0].previous_school,'속초고');
  assert.equal(men[58].birth_date,'2003-03-27');assert.equal(men[58].weight_kg,72.8);assert.equal(men[58].previous_school,'인하대');
  assert.equal(men.filter(highlightedApplicant).length,29);
});
test('detail mismatches, duplicate identities, missing rows and unverified sources fail closed',()=>{
  for(const mutate of [d=>d.season='2027-28',d=>d.records.push(d.records[0]),d=>d.records.pop(),d=>d.records[0].name='다른 선수',d=>d.records[0].source_order=2,d=>d.records[0].birth_date='2005-02-31',d=>d.records[0].access_level='PRIVATE',d=>d.source.url='javascript:alert(1)']){const d=structuredClone(details);mutate(d);assert.throws(()=>mergeListDetails(rows,d,'2026-27'));}
});
async function app(failDetails=false){
  const errors=[],vc=new VirtualConsole();vc.on('error',(...s)=>errors.push(s.join(' ')));
  const dom=new JSDOM(read('draft-hub.html'),{url:'https://kvolleylab.com/draft-hub.html?season=2026-27&gender=M&layout=table&sort=source#applicants',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
  w.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='true';};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.Blob=Blob;w.Response=Response;w.DecompressionStream=DecompressionStream;w.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url,w.location.href),file=url.pathname.slice(1);if(failDetails&&file.endsWith('/list-details.json'))return new Response('',{status:503});try{return new Response(read(file),{status:200})}catch{return new Response('',{status:404})}};
  for(const file of ['assets/js/player-school-master-v2.js','assets/js/player-school-master-compat-v2.js','assets/js/player-search-v2.js'])w.eval(read(file));
  await w.KVLPlayerCatalogReady;const modules=new Map();async function module(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(read(file),{context:dom.getInternalVMContext(),identifier:file});modules.set(file,m);await m.link((specifier,ref)=>module(path.posix.normalize(path.posix.join(path.posix.dirname(ref.identifier),specifier))));return m;}
  await (await module('assets/js/draft-hub-v2.mjs')).evaluate();
  return {w,d,errors,close:()=>w.close(),click:selector=>d.querySelector(selector).click(),change:(selector,value)=>{const el=d.querySelector(selector);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));}};
}
test('entry link opens the official ten-column school-grouped list with all verified facts and profile links',async()=>{
  const a=await app();try{const {d}=a;assert.equal(d.querySelector('[data-layout="table"]').getAttribute('aria-pressed'),'true');assert.equal(d.querySelectorAll('.da-official-roster tbody tr').length,59);assert.equal(d.querySelectorAll('.da-official-roster thead th').length,10);assert.equal(d.querySelectorAll('.da-roster-highlight').length,29);assert.equal(d.querySelector('.da-roster-school').rowSpan,3);
    const first=d.querySelector('.da-official-roster tbody tr');assert.match(first.textContent,/2005\.01\.20/);assert.match(first.textContent,/83\.6/);assert.match(first.textContent,/속초고/);assert.equal(d.querySelectorAll('.da-official-roster a[href*="player.html"]').length,53);assert.ok(d.querySelector('#daListNotice').hidden);
    assert.deepEqual([...d.querySelectorAll('.da-roster-order')].map(x=>Number(x.textContent)),Array.from({length:59},(_,i)=>i+1));assert.equal(a.errors.length,0);
  }finally{a.close();}
});
test('search and sorting recompute rowspans, preserve source numbers, and retain cards and women table',async()=>{
  const a=await app();try{
    a.change('#daQuery','윤경');assert.equal(a.d.querySelectorAll('.da-official-roster tbody tr').length,1);assert.equal(a.d.querySelector('.da-roster-order').textContent,'25');assert.equal(a.d.querySelector('.da-roster-school').rowSpan,1);
    a.change('#daQuery','');a.change('#daSort','height_desc');const body=[...a.d.querySelectorAll('.da-official-roster tbody tr')];for(let i=0;i<body.length;i++){const school=body[i].querySelector('.da-roster-school');if(school)for(let n=0;n<school.rowSpan;n++)assert.equal(rows.find(p=>p.applicant_id===body[i+n].dataset.applicant).affiliation,school.textContent);}
    a.click('[data-layout="cards"]');assert.equal(a.d.querySelectorAll('.da-player-card').length,59);a.click('[data-layout="compact"]');assert.equal(a.d.querySelectorAll('.da-compact-grid article').length,59);a.click('[data-layout="table"]');a.click('[data-gender="W"]');assert.equal(a.d.querySelectorAll('.da-official-roster tbody tr').length,58);assert.equal(a.d.querySelectorAll('.da-official-roster thead th').length,10);assert.equal(a.d.querySelectorAll('.da-roster-withdrawn').length,1);assert.match(a.d.querySelector('.da-official-roster').textContent,/2008\./);assert.equal(a.d.body.dataset.gender,'W');
  }finally{a.close();}
});
test('unavailable optional detail source preserves the list and never fills it from current profiles',async()=>{
  const a=await app(true);try{assert.equal(a.d.querySelectorAll('.da-official-roster tbody tr').length,59);assert.equal(a.d.querySelector('#daListNotice').hidden,false);assert.match(a.d.querySelector('.da-official-roster tbody tr').textContent,/미확인/);assert.doesNotMatch(a.d.querySelector('.da-official-roster tbody tr').textContent,/2005\.01\.20/);assert.equal(a.d.querySelectorAll('.da-official-roster a[href*="player.html"]').length,53);}finally{a.close();}
});

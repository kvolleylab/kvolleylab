'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.RUNNER_TEMP||'/tmp';
const target=path.join(ROOT,'dist/KVL_국제대표팀통합명단_v1.html');
const REPORT={status:'RUNNING',type:'ISOLATED_OFFLINE_PROTOTYPE',cases:[],warnings:[]};
const report=path.join(OUT,'kvl-unified-roster-prototype-qa-v1.json');
async function snap(page,label){
 const dims=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(dims.scroll<=dims.viewport+2,'Page overflow '+label+' '+JSON.stringify(dims));
 const filename='kvl-unified-prototype-'+label+'.png';
 await page.screenshot({path:path.join(OUT,filename),fullPage:true});
 return {screenshot:filename,overflow:dims.scroll-dims.viewport};
}
async function run(){
 let browser;
 try{
  assert.ok(fs.existsSync(target),'Missing packaged standalone prototype');
  browser=await chromium.launch({headless:true});
  const errors=[];
  const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto(pathToFileURL(target).href,{waitUntil:'load',timeout:30000});
  await page.locator('.player-row').first().waitFor({timeout:10000});
  assert.equal(await page.locator('.player-row').count(),26);
  assert.equal(await page.locator('.event-card').count(),3);
  assert.equal(await page.locator('.player-row').filter({hasText:'이시카와 유키'}).count(),1);
  const ishikawa=page.locator('.player-row').filter({hasText:'이시카와 유키'});
  assert.match(await ishikawa.innerText(),/1995-12-11/);
  assert.match(await ishikawa.innerText(),/Ziraat Bankkart Ankara/);
  assert.equal(await ishikawa.locator('a.vb-link[href*="volleybox.net"]').count(),1);
  assert.equal(await ishikawa.locator('i.dot.red').count(),1);
  assert.equal(await ishikawa.locator('i.dot.black').count(),1);
  assert.equal(await page.locator('.player-row').filter({hasText:'후카츠'}).count(),2);
  REPORT.cases.push({name:'Desktop 26 real identities, required original attributes and compact dots',status:'PASS',...(await snap(page,'pc-1440'))});
  await page.locator('[data-event-button=VNL]').click();
  assert.equal(await page.locator('.player-row').count(),16);
  await page.locator('[data-event-button=AG]').click();
  assert.equal(await page.locator('.player-row').count(),12);
  await page.locator('[data-event-button=AVC]').click();
  assert.equal(await page.locator('.player-row').count(),14);
  await page.locator('[data-filter=MULTI]').click();
  const multi=await page.locator('.player-row').count();
  assert.ok(multi>8&&multi<20,'multi tournament count '+multi);
  await page.locator('[data-filter=ALL]').click();
  assert.equal(await page.locator('.player-row').count(),26);
  await page.locator('#searchInput').fill('Yamauchi');
  assert.equal(await page.locator('.player-row').count(),1);
  await page.locator('#searchInput').fill('');
  const row=page.locator('.player-row').filter({hasText:'이시카와 유키'});
  await row.locator('.col-club').click();
  await page.locator('#playerDetail.show').waitFor();
  assert.match(await page.locator('#playerDetail').innerText(),/2026 VNL/);
  assert.match(await page.locator('#playerDetail').innerText(),/2026 AVC/);
  await page.locator('#detailClose').click();
  assert.equal(await page.locator('#playerDetail.show').count(),0);
  assert.deepEqual(errors,[]);
  REPORT.cases.push({name:'Event filters 16/12/14, 2+ entries, search and detail panel',status:'PASS',multi});
  await page.close();
  for(const width of [390,360]){
   const m=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
   const jsErrors=[];m.on('pageerror',e=>jsErrors.push(String(e.message)));
   await m.goto(pathToFileURL(target).href,{waitUntil:'load',timeout:30000});
   await m.locator('.player-row').first().waitFor();
   assert.equal(await m.locator('.player-row').count(),26);
   const row=m.locator('.player-row').filter({hasText:'이시카와 유키'});
   assert.match(await row.innerText(),/1995-12-11/);
   assert.match(await row.innerText(),/Ziraat Bankkart Ankara/);
   assert.equal(await row.locator('.vb-link').count(),1);
   assert.equal(await row.locator('i.dot.red').count(),1);
   assert.equal(await row.locator('i.dot.black').count(),1);
   assert.deepEqual(jsErrors,[]);
   REPORT.cases.push({name:'Mobile '+width+'px full attributes, source buttons, no overflow',status:'PASS',...(await snap(m,'mobile-'+width))});
   await m.close();
  }
  REPORT.status='PASS';fs.writeFileSync(report,JSON.stringify(REPORT,null,2));
  console.log(JSON.stringify(REPORT,null,2));
 }catch(err){
  REPORT.status='FAIL';REPORT.error=String(err.stack||err);
  fs.writeFileSync(report,JSON.stringify(REPORT,null,2));
  console.error(REPORT.error);process.exitCode=1;
 }finally{await browser?.close()}
}
run();

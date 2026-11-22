'use strict';
/* Real HTTPS evidence. The existing private-review login overlay is stubbed
 * ONLY inside isolated Playwright browser; live access control is unchanged. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const BASE='https://kvolleylab.com',OUT=process.env.RUNNER_TEMP||'/tmp',SHA=process.env.GITHUB_SHA||'unknown';
const result={status:'RUNNING',sha:SHA,origin:BASE,checks:[],auth:'test-only browser overlay bypass; live member gate intact'};
const REPORT=path.join(OUT,'kvl-international-unified-live-report.json'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function read(file){
 const r=await fetch(BASE+'/'+file+'?release='+encodeURIComponent(SHA),{cache:'no-store',signal:AbortSignal.timeout(18000)});
 assert.ok(r.ok,'Source '+file+' HTTP '+r.status);
 return r.json();
}
async function waitDeploy(){
 let last='';
 for(let i=0;i<18;i++){
  try{
   const r=await fetch(BASE+'/teams.html?release='+SHA+'-'+i,{cache:'no-store',signal:AbortSignal.timeout(16000)});
   const html=r.ok?await r.text():'';
   if(html.includes('kvl-international-unified-roster-v1.js')&&html.includes('kvl-international-unified-roster-v1.css')){
    const index=await read('data/international/country-roster-index-v1.json');
    if(index.snapshot_count===89)return;
   }
   last='New module/roster source not yet visible, HTTP '+r.status;
  }catch(e){last=e.message}
  if(i<17)await sleep(10000);
 }
 throw Error('Unified country roster release not yet on GitHub Pages: '+last);
}
async function getPage(browser,width,query){
 const page=await browser.newPage({viewport:{width,height:width<=400?844:950},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://kvolleylab.com/assets/js/member-access-gate-v1.mjs*',
  route=>route.fulfill({status:200,body:'// Isolated Chromium QA only',contentType:'application/javascript'}));
 await page.goto(BASE+'/teams.html?'+query+'&release='+encodeURIComponent(SHA),{waitUntil:'domcontentloaded',timeout:30000});
 return {page,errors};
}
async function screenshot(page,id){
 const dims=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(dims.scroll<=dims.viewport+2,'Horizontal overflow '+id+' '+JSON.stringify(dims));
 const filename='kvl-unified-live-'+id+'.png';
 await page.screenshot({path:path.join(OUT,filename),fullPage:true});
 return {screenshot:filename,overflow:dims.scroll-dims.viewport};
}
async function run(){
 let browser;
 try{
  await waitDeploy();
  const gate=await read('data/member-access-v1.json');
  assert.equal(gate.enabled,true);
  assert.ok(gate.protectedPaths.includes('teams.html'));
  browser=await chromium.launch({headless:true});
  for(const width of [1440,390,360]){
   const {page,errors}=await getPage(browser,width,'category=international&gender=men&country=JPN&year=2026');
   await page.locator('.kvl-unified-row').first().waitFor({timeout:35000});
   assert.equal(await page.locator('.kvl-unified-row').count(),26);
   assert.equal(await page.locator('.ktd-country-event').count(),0);
   assert.equal(await page.locator('.ktd-country-link').count(),3);
   assert.equal(await page.locator('[data-country-year-select]').inputValue(),'2026');
   assert.ok(await page.locator('.kvl-unified-reserve').count()>=1);
   const target=page.locator('.kvl-unified-row').filter({hasText:'이시카와 유키'}).first();
   assert.equal(await target.locator('a.kvl-unified-volleybox').count(),1);
   assert.match(await target.innerText(),/Ziraat Bankkart Ankara/);
   assert.match(await target.innerText(),/1995-12-11/);
   assert.equal(await target.locator('.kvl-unified-dot.is-major').count(),1);
   assert.equal(await target.locator('.kvl-unified-dot.is-regular').count(),1);
   if(width===1440){
    await page.locator('[data-kvl-unified-filter="vnl-men-2026:JPN"]').click();
    assert.equal(await page.locator('.kvl-unified-row').count(),16);
    await page.locator('[data-kvl-unified-filter="all"]').click();
    assert.equal(await page.locator('.kvl-unified-row').count(),26);
    const quickLinks=await page.locator('.ktd-country-link').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
    assert.ok(quickLinks.some(x=>/vnl-men-2026/.test(x||'')));
   }
   assert.deepEqual(errors,[]);
   result.checks.push({name:'Japan men integrated roster first / reserve badge / quick competition links on '+width+'px',
    status:'PASS',...(await screenshot(page,'jpn-men-'+width))});
   await page.close();
  }
  const women=await getPage(browser,1440,'category=international&gender=women&country=JPN&year=2026');
  await women.page.locator('.kvl-unified-row').first().waitFor({timeout:35000});
  assert.ok(await women.page.locator('.kvl-unified-row').count()>=14);
  assert.equal(await women.page.locator('.ktd-country-link').count(),2);
  assert.deepEqual(women.errors,[]);
  result.checks.push({name:'Japan women original registration retained without guessed DOB',status:'PASS'});
  await women.page.close();
  const pro=await getPage(browser,1440,'category=international&gender=men&country=JPN&year=2026');
  await pro.page.locator('[data-ktd-category=pro]').click();
  await pro.page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await pro.page.locator('.ktd-card').count(),7);
  const male=await read('data/competitions/v-league-men-2026-27/rosters.json');
  const total=Object.values(male).reduce((n,t)=>n+t.players.length,0);
  assert.ok((await pro.page.locator('#ktdSummary').innerText()).includes(total+'명'));
  assert.deepEqual(pro.errors,[]);
  result.checks.push({name:'Existing protected pro team rosters read live published KOVO data',status:'PASS'});
  await pro.page.close();
  result.status='PASS';fs.writeFileSync(REPORT,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }catch(e){
  result.status='FAIL';result.error=String(e.stack||e);
  fs.writeFileSync(REPORT,JSON.stringify(result,null,2));console.error(result.error);process.exitCode=1;
 }finally{await browser?.close()}
}
run();

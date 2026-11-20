'use strict';
/* Real public-site QA. Only the existing private-review login overlay is
 * intercepted within the isolated Chromium QA context. The production access
 * policy, Supabase auth, and deployed JS remain unchanged.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const BASE='https://kvolleylab.com',OUT=process.env.RUNNER_TEMP||'/tmp';
const SHA=process.env.GITHUB_SHA||'unknown';
const REPORT={status:'RUNNING',commit:SHA,origin:BASE,checks:[],auth:'protected; test-only browser login-overlay intercept'};
const output=path.join(OUT,'kvl-international-live-report.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getJson(file){
 const res=await fetch(BASE+'/'+file+'?verify='+encodeURIComponent(SHA),{cache:'no-store',signal:AbortSignal.timeout(20000)});
 assert.ok(res.ok,'HTTPS source '+file+' status='+res.status);
 return res.json();
}
async function waitForDeployment(){
 let error='';
 for(let tries=0;tries<22;tries++){
  try{
   const res=await fetch(BASE+'/teams.html?verify='+encodeURIComponent(SHA)+'-'+tries,
    {cache:'no-store',signal:AbortSignal.timeout(16000)});
   const html=res.ok?await res.text():'';
   if(html.includes('kvl-international-countries-v1.js')&&html.includes('ktdCountryArea')){
    const country=await getJson('data/international/country-directory-v1.json');
    const roster=await getJson('data/international/country-roster-index-v1.json');
    if(country.country_count===40&&roster.snapshot_count===89){
     const flag=await fetch(BASE+'/assets/images/flags/4x3/jp.svg?verify='+encodeURIComponent(SHA),
      {cache:'no-store',signal:AbortSignal.timeout(20000)});
     if(flag.ok&&(await flag.text()).includes('flag-icons-jp'))return {country,roster};
     error='Local Japan flag SVG not yet deployed (HTTP '+flag.status+')';
    }
   }
   error='Page or JSON marker absent (HTTP '+res.status+')';
  }catch(e){error=String(e.message)}
  if(tries<21)await sleep(10000);
 }
 throw Error('International country v1 not deployed at live HTTPS origin: '+error);
}
async function pageFor(browser,width,query){
 const page=await browser.newPage({viewport:{width,height:width<500?844:940},deviceScaleFactor:1});
 await page.route('https://kvolleylab.com/assets/js/member-access-gate-v1.mjs*',
  route=>route.fulfill({status:200,body:'// Isolated QA browser only; no deployed authorization changes',contentType:'application/javascript'}));
 const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto(BASE+'/teams.html?'+query+'&verify='+encodeURIComponent(SHA),
  {waitUntil:'domcontentloaded',timeout:30000});
 return {page,errs};
}
async function screenshot(page,name){
 const metrics=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
 assert.ok(metrics.width<=metrics.viewport+2,'Horizontal overflow '+name+': '+JSON.stringify(metrics));
 const filename='kvl-international-live-'+name+'.png';
 await page.screenshot({path:path.join(OUT,filename),fullPage:true});
 return {screenshot:filename,overflow:metrics.width-metrics.viewport};
}
async function main(){
 let browser;
 try{
  const data=await waitForDeployment();
  const access=await getJson('data/member-access-v1.json');
  assert.equal(access.enabled,true);
  assert.ok(access.protectedPaths.includes('teams.html'),'Existing member gate must remain protecting teams.html');
  browser=await chromium.launch({headless:true});
  const pc=await pageFor(browser,1440,'category=international&gender=men');
  const page=pc.page;
  await page.locator('.ktd-country-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-card').count(),40);
  const realFlags=await page.locator('.ktd-country-card img.ktd-country-flag-image').evaluateAll(async imgs=>{
   return Promise.all(imgs.map(async img=>{
    img.loading='eager';
    try{await img.decode()}catch{}
    return {url:new URL(img.src).pathname,loaded:img.naturalWidth>0,alt:img.alt};
   }));
  });
  assert.equal(realFlags.length,40,'Every country card must have a real flag SVG');
  assert.equal(new Set(realFlags.map(x=>x.url)).size,40);
  assert.ok(realFlags.every(x=>x.loaded&&x.alt.includes('국기')&&x.url.startsWith('/assets/images/flags/4x3/')),
   'All 40 actual HTTPS flag SVGs must load: '+JSON.stringify(realFlags.filter(x=>!x.loaded)));
  REPORT.checks.push({name:'40 actual self-hosted SVG flags loaded from Pages',status:'PASS'});
  await page.locator('[data-ktd-region=asia]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),20);
  await page.locator('[data-ktd-region=europe]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),12);
  await page.locator('[data-ktd-region=all]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),40);
  REPORT.checks.push({name:'Live source index 40 countries / 89 pointers and filtering',status:'PASS',...(await screenshot(page,'list-1440'))});
  await page.locator('.ktd-country-card[data-team-code=JPN] [data-ktd-country]').click();
  await page.locator('.ktd-country-panel').waitFor({timeout:30000});
  const detailFlag=page.locator('.ktd-country-flag img.ktd-country-flag-image');
  assert.ok((await detailFlag.getAttribute('src')).endsWith('/jp.svg'));
  await detailFlag.evaluate(async img=>{await img.decode()});
  assert.equal(await detailFlag.evaluate(img=>img.naturalWidth>0),true);
  assert.equal(await page.locator('#ktdGrid').isVisible(),false);
  assert.equal(await page.locator('.ktd-country-event').count(),3);
  await page.locator('[data-country-snapshot="vnl-men-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),16);
  assert.match(await page.locator('.ktd-country-roster').innerText(),/Reserve/);
  REPORT.checks.push({name:'Live Japan men historical VNL list and Reserve distinction',status:'PASS',...(await screenshot(page,'japan-men-1440'))});
  await page.locator('[data-country-snapshot="avc-men-continental-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),14);
  assert.match(await page.locator('.ktd-country-roster-head').innerText(),/최종 명단/);
  await page.locator('[data-country-close]').click();
  await page.locator('[data-ktd-gender=women]').click();
  await page.locator('.ktd-country-card').first().waitFor({timeout:30000});
  await page.locator('.ktd-country-card[data-team-code=JPN] [data-ktd-country]').click();
  await page.locator('.ktd-country-panel').waitFor({timeout:30000});
  await page.locator('[data-country-snapshot="vnl-women-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),14);
  REPORT.checks.push({name:'Live Japan women VNL original 14 player list',status:'PASS',...(await screenshot(page,'japan-women-1440'))});
  await page.locator('[data-ktd-category=pro]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),7);
  const proCounts=await getJson('data/competitions/v-league-women-2026-27/rosters.json');
  const expected=Object.values(proCounts).reduce((n,t)=>n+t.players.length,0);
  assert.ok((await page.locator('#ktdSummary').innerText()).includes(expected+'명'));
  REPORT.checks.push({name:'Existing pro women 7 clubs and published KOVO roster counts',status:'PASS'});
  assert.deepEqual(pc.errs,[],'Live desktop JavaScript errors');
  await page.close();
  const b=await pageFor(browser,1440,'category=international&country=BRN&gender=men&year=2026');
  await b.page.locator('.ktd-country-panel').waitFor({timeout:30000});
  await b.page.locator('[data-country-snapshot="avc-men-continental-2026:BRN"]').click();
  await b.page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await b.page.locator('.ktd-country-player').count(),13);
  assert.match(await b.page.locator('.ktd-country-roster-head').innerText(),/출국 명단/);
  assert.deepEqual(b.errs,[]);await b.page.close();
  REPORT.checks.push({name:'Direct Bahrain link maintains 13-person departure-list status',status:'PASS'});
  for(const width of [390,360]){
   const list=await pageFor(browser,width,'category=international&gender=men');
   await list.page.locator('.ktd-country-card').first().waitFor({timeout:30000});
   assert.equal(await list.page.locator('.ktd-country-card').count(),40);
   await list.page.locator('#ktdSearch').fill('일본');
   assert.equal(await list.page.locator('.ktd-country-card').count(),1);
   const image=list.page.locator('.ktd-country-card img.ktd-country-flag-image');
   await image.evaluate(async img=>{await img.decode()});
   assert.equal(await image.evaluate(img=>img.naturalWidth>0),true);
   assert.ok((await image.getAttribute('src')).endsWith('/jp.svg'));
   REPORT.checks.push({name:'Live country flag card mobile '+width+'px',status:'PASS',...(await screenshot(list.page,'flag-card-'+width))});
   assert.deepEqual(list.errs,[]);
   await list.page.close();
   const m=await pageFor(browser,width,'category=international&country=JPN&gender=men&year=2026');
   await m.page.locator('.ktd-country-panel').waitFor({timeout:30000});
   await m.page.locator('[data-country-snapshot="vnl-men-2026:JPN"]').click();
   await m.page.locator('.ktd-country-player').first().waitFor({timeout:30000});
   assert.equal(await m.page.locator('.ktd-country-player').count(),16);
   REPORT.checks.push({name:'Live country roster on mobile '+width+'px',status:'PASS',...(await screenshot(m.page,'japan-men-'+width))});
   assert.deepEqual(m.errs,[]);await m.page.close();
  }
  REPORT.status='PASS';REPORT.country_count=data.country.country_count;REPORT.snapshots=data.roster.snapshot_count;
  fs.writeFileSync(output,JSON.stringify(REPORT,null,2));console.log(JSON.stringify(REPORT,null,2));
 }catch(err){
  REPORT.status='FAIL';REPORT.error=String(err.stack||err);
  fs.writeFileSync(output,JSON.stringify(REPORT,null,2));console.error(REPORT.error);process.exitCode=1;
 }finally{await browser?.close()}
}
main();

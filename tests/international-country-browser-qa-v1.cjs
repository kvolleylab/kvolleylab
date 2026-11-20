'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.RUNNER_TEMP||'/tmp';
const BASE='https://kvolleylab.com';
const mime={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const report={status:'RUNNING',cases:[]};
const output=path.join(OUT,'kvl-international-countries-browser-report.json');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function serve(page){
 await page.route('https://kvolleylab.com/**',route=>{
  const u=new URL(route.request().url());
  const target=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));
  if(!target.startsWith(ROOT+path.sep))return route.fulfill({status:403,body:''});
  try{return route.fulfill({status:200,body:fs.readFileSync(target),contentType:mime[path.extname(target)]||'application/octet-stream'})}
  catch{return route.fulfill({status:404,body:''})}
 });
 // The production teams route is member-gated. This is test-only interception in isolated Chromium.
 await page.route('https://kvolleylab.com/assets/js/member-access-gate-v1.mjs*',
  route=>route.fulfill({status:200,body:'// UI test only: do not modify deployed access gate',contentType:'application/javascript'}));
}
async function screenshot(page,label){
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=2,'horizontal overflow: '+label+' '+overflow);
 const file=path.join(OUT,'kvl-international-country-'+label+'.png');
 await page.screenshot({path:file,fullPage:true});
 return {screenshot:path.basename(file),overflow};
}
async function openPage(browser,width,url){
 const page=await browser.newPage({viewport:{width,height:width<450?820:950},deviceScaleFactor:1});
 await serve(page);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('.ktd-country-card').first().waitFor({state:'attached',timeout:30000});
 return {page,errors};
}
async function run(){
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await openPage(browser,1440,'/teams.html?category=international&gender=men');
  assert.equal(await page.locator('.ktd-country-card').count(),40);
  const actualFlags=await page.locator('.ktd-country-card img.ktd-country-flag-image').evaluateAll(async images=>{
   return Promise.all(images.map(async img=>{
    img.loading='eager';
    try{await img.decode()}catch{}
    return {path:new URL(img.src).pathname,loaded:img.naturalWidth>0,alt:img.alt,
     ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height,
     fallbackHidden:img.nextElementSibling?.hidden===true};
   }));
  });
  assert.equal(actualFlags.length,40,'All international country cards need image assets');
  assert.equal(new Set(actualFlags.map(x=>x.path)).size,40,'Use a unique flag asset per ISO code');
  assert.ok(actualFlags.every(x=>x.loaded&&x.alt.includes('국기')&&x.fallbackHidden),
   'Every SVG flag must load locally: '+JSON.stringify(actualFlags.filter(x=>!x.loaded||!x.fallbackHidden)));
  assert.ok(actualFlags.every(x=>/^\\/assets\\/images\\/flags\\/4x3\\/[a-z]{2}\\.svg$/.test(x.path)));
  assert.ok(actualFlags.every(x=>x.ratio>=1.2&&x.ratio<=1.5),'Keep original 4:3 flag imagery within cards');
  assert.equal((await page.locator('.ktd-country-card[data-team-code="JPN"] img').getAttribute('src')),
   'assets/images/flags/4x3/jp.svg');
  report.cases.push({case:'40 self-hosted SVG country flags loaded, including Japan; no CDN',result:'PASS'});
  assert.match(await page.locator('#ktdHeading').innerText(),/국제 대표팀/);
  assert.equal(await page.locator('#ktdGenderButtons').isVisible(),true);
  await page.locator('[data-ktd-region=asia]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),20);
  await page.locator('[data-ktd-region=europe]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),12);
  await page.locator('[data-ktd-region=north_america]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),4);
  await page.locator('[data-ktd-region=africa]').click();
  assert.equal(await page.locator('.ktd-country-card').count(),0);
  assert.match(await page.locator('#ktdGrid').innerText(),/미참가를 뜻하지/);
  await page.locator('[data-ktd-region=all]').click();
  await page.locator('#ktdSearch').fill('Japan');
  assert.equal(await page.locator('.ktd-country-card').count(),1);
  await page.locator('#ktdSearch').fill('');
  report.cases.push({case:'International 40-country directory PC',result:'PASS',...(await screenshot(page,'list-1440'))});
  await page.locator('.ktd-country-card[data-team-code=JPN] [data-ktd-country]').click();
  await page.locator('.ktd-country-panel').waitFor({timeout:10000});
  const detailFlag=page.locator('.ktd-country-flag img.ktd-country-flag-image');
  assert.equal(await detailFlag.count(),1);
  assert.ok((await detailFlag.getAttribute('src')).endsWith('/jp.svg'));
  await detailFlag.evaluate(async img=>{await img.decode()});
  assert.equal(await detailFlag.evaluate(img=>img.naturalWidth>0),true,'Detail flag should render as an SVG');
  assert.match(await page.locator('.ktd-country-heading').innerText(),/일본/);
  assert.match(await page.locator('.ktd-country-years').innerText(),/2026/);
  assert.equal(await page.locator('.ktd-country-event').count(),3);
  assert.match(await page.locator('[data-country-selection]').innerText(),/공식 후보 엔트리는 아직/);
  await page.locator('[data-country-snapshot="vnl-men-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),16);
  assert.match(await page.locator('.ktd-country-roster').innerText(),/Reserve/);
  assert.equal(await page.locator('.ktd-country-player').filter({hasText:'야마우치'}).first().locator('a[href*="player.html?id=KVL-P-000340"]').count(),1);
  report.cases.push({case:'40 countries, 5 region filters, Japan VNL Active/Reserve 16',result:'PASS',...(await screenshot(page,'men-1440'))});
  await page.locator('[data-country-snapshot="avc-men-continental-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),14);
  assert.match(await page.locator('.ktd-country-roster-head').innerText(),/최종 명단/);
  await page.locator('[data-country-close]').click();
  assert.equal(await page.locator('#ktdCountryArea').isVisible(),false);
  await page.locator('[data-ktd-gender=women]').click();
  await page.locator('.ktd-country-card').first().waitFor({state:'attached',timeout:30000});
  assert.equal(await page.locator('.ktd-country-card').count(),40,'country identity does not disappear on gender change');
  await page.locator('.ktd-country-card[data-team-code=JPN] [data-ktd-country]').click();
  await page.locator('.ktd-country-panel').waitFor({timeout:10000});
  assert.equal(await page.locator('.ktd-country-event').count(),2);
  await page.locator('[data-country-snapshot="vnl-women-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),14);
  const womenBody=await page.locator('.ktd-country-roster').innerText();
  assert.match(womenBody,/Wada/);
  assert.match(womenBody,/공식 프로필/);
  report.cases.push({case:'Women Japan roster 14 with original official profile links',result:'PASS'});
  await page.locator('[data-ktd-category=pro]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),7);
  assert.equal(await page.locator('#ktdCountryArea').isVisible(),false);
  report.cases.push({case:'Existing 7-club professional category preserved',result:'PASS'});
  assert.deepEqual(errors,[],'Desktop uncaught errors');
  await page.close();
  const direct=await openPage(browser,1440,'/teams.html?category=international&country=BRN&gender=men&year=2026');
  await direct.page.locator('.ktd-country-panel').waitFor({timeout:30000});
  assert.match(await direct.page.locator('.ktd-country-heading').innerText(),/바레인/);
  assert.ok((await direct.page.locator('.ktd-country-events').innerText()).includes('출국 명단'));
  await direct.page.locator('[data-country-snapshot="avc-men-continental-2026:BRN"]').click();
  await direct.page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await direct.page.locator('.ktd-country-player').count(),13);
  assert.deepEqual(direct.errors,[]);
  report.cases.push({case:'Deep link BRN year 2026 and source-labeled 13-person departure list',result:'PASS'});
  await direct.page.close();
  for(const width of [390,360]){
   const view=await openPage(browser,width,'/teams.html?category=international&gender=men');
   assert.equal(await view.page.locator('.ktd-country-card').count(),40);
   await view.page.locator('#ktdSearch').fill('일본');
   assert.equal(await view.page.locator('.ktd-country-card').count(),1);
   const img=view.page.locator('.ktd-country-card img.ktd-country-flag-image');
   await img.evaluate(async el=>{await el.decode()});
   assert.equal(await img.evaluate(el=>el.naturalWidth>0),true,'Mobile flag image must load');
   assert.ok((await img.getAttribute('src')).endsWith('/jp.svg'));
   report.cases.push({case:'Mobile '+width+'px real flag image and country search',result:'PASS',
    ...(await screenshot(view.page,'list-flag-'+width))});
   assert.deepEqual(view.errors,[]);
   await view.page.close();
   const {page:mobile,errors:mobileErrors}=await openPage(browser,width,'/teams.html?category=international&country=JPN&gender=men&year=2026');
   await mobile.locator('.ktd-country-panel').waitFor({timeout:30000});
   assert.equal(await mobile.locator('#ktdGrid').isVisible(),false,'country details replace long list');
   await mobile.locator('[data-country-snapshot="vnl-men-2026:JPN"]').click();
   await mobile.locator('.ktd-country-player').first().waitFor({timeout:30000});
   assert.equal(await mobile.locator('.ktd-country-player').count(),16);
   assert.deepEqual(mobileErrors,[]);
   report.cases.push({case:'Mobile '+width+'px country and historical source roster',result:'PASS',...(await screenshot(mobile,'men-'+width))});
   await mobile.close();
  }
  report.status='PASS';fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }catch(e){
  report.status='FAIL';report.error=String(e.stack||e);
  fs.writeFileSync(output,JSON.stringify(report,null,2));console.error(report.error);process.exitCode=1;
 }finally{await browser.close()}
}
run();

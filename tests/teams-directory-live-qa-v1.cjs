'use strict';
/* Real public-domain Pages check. Only the private-review gate is stubbed in this test browser;
   actual production authentication and its protectedPaths are not modified. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const BASE='https://kvolleylab.com',OUT=process.env.RUNNER_TEMP||'/tmp';
const sha=process.env.GITHUB_SHA||'unknown',wait=ms=>new Promise(r=>setTimeout(r,ms));
const result={status:'RUNNING',origin:BASE,sha,privateReviewAuth:'test-only access overlay stub',views:[],notes:[]};
const output=path.join(OUT,'kvl-teams-directory-live-report.json');
const read=async url=>{
 const r=await fetch(BASE+'/'+url,{cache:'no-store',signal:AbortSignal.timeout(20000)});
 assert.ok(r.ok,'Public source HTTP '+r.status+' for '+url);
 return r.json();
};
async function ready(){
 let last='';
 for(let i=0;i<18;i++){
  try{
   const r=await fetch(BASE+'/teams.html?release='+encodeURIComponent(sha)+'-'+i,{cache:'no-store',signal:AbortSignal.timeout(12000)});
   const html=r.ok?await r.text():'';
   if(html.includes('id="ktdGrid"')&&html.includes('kvl-teams-directory-v1.js'))return;
   last='HTTP '+r.status+' or new directory marker not yet public';
  }catch(e){last=e.message}
  if(i<17)await wait(10000);
 }
 throw Error('GitHub Pages new teams directory not published: '+last);
}
async function pageFor(browser,width,height){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 // An unauthenticated browser is normally shown the existing private-review login dialog.
 // This interception is confined to QA's browser only, not the deployed site.
 await page.route('https://kvolleylab.com/assets/js/member-access-gate-v1.mjs*',
  route=>route.fulfill({status:200,body:'// QA-only gate interception',contentType:'application/javascript'}));
 return page;
}
async function check(browser,gender,code,player,linked,width){
 const rosters=await read('data/competitions/v-league-'+gender+'-2026-27/rosters.json');
 const count=Object.values(rosters).reduce((n,t)=>n+t.players.length,0);
 const page=await pageFor(browser,width,width===390?844:900);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const url=BASE+'/teams.html?category=pro&gender='+gender+'&release='+encodeURIComponent(sha);
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(response?.ok(),'Public page unavailable: '+response?.status());
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),7);
  const summary=await page.locator('#ktdSummary').innerText();
  assert.ok(summary.includes(count+'명'),'Published total must match current KOVO official roster JSON: '+summary);
  const css=await page.locator('.ktd-card').first().locator('.ktd-card-body').evaluate(el=>{
   const a=el.getBoundingClientRect(),b=el.querySelector('.ktd-card-logo').getBoundingClientRect();
   return {fraction:b.width/a.width,width:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert.ok(css.fraction>=.28&&css.fraction<=.34);
  assert.ok(css.width<=css.viewport+2,'Mobile layout overflow');
  const club=page.locator('.ktd-card[data-team-code="'+code+'"]').first();
  await club.locator('[data-ktd-roster]').click();
  await page.locator('.kvlrv2').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvlrv2-row').count(),rosters[code].players.length);
  const row=page.locator('.kvlrv2-row').filter({hasText:player}).first();
  await row.click();
  const body=await page.locator('.kvlrv2-detail').innerText();
  assert.ok(body.includes(gender==='men'?'남성고':'청수고'));
  if(gender==='men')assert.ok(body.includes('인하대'));
  const link=row.locator('a.kvlrv2-name-link');
  assert.equal(await link.count(),linked?1:0,'Unverified profile links must not be invented');
  if(linked){
   const href=await link.getAttribute('href');
   assert.ok(href.includes('KVL-P-000008'));
   await link.click();
   await page.locator('.pd-title').waitFor({timeout:30000});
   assert.equal((await page.locator('.pd-title').innerText()).trim(),player);
   const profile=await page.locator('#playerArea').innerText();
   assert.ok(profile.includes('OK저축은행')&&profile.includes('남성고')&&profile.includes('인하대'));
   await page.goBack({waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('.kvlrv2').waitFor({timeout:30000});
  }
  assert.deepEqual(errors,[],'public website runtime JS errors');
  const snap=path.join(OUT,'kvl-teams-live-'+gender+'-'+width+'.png');
  await page.screenshot({path:snap,fullPage:true});
  result.views.push({gender,width,club:code,rosterCount:rosters[code].players.length,total:count,player,linked,
   overflow:css.width-css.viewport,status:'PASS',screenshot:path.basename(snap)});
 }finally{await page.close()}
}
async function main(){
 try{
  await ready();
  const access=await read('data/member-access-v1.json');
  assert.equal(access.enabled,true);
  assert.ok(access.protectedPaths.includes('teams.html'),'Do not unlock private review');
  const browser=await chromium.launch({headless:true});
  try{
   await check(browser,'men','OKF','윤경',true,1440);
   await check(browser,'men','OKF','윤경',true,390);
   await check(browser,'women','RSP','김아중',false,1440);
   await check(browser,'women','RSP','김아중',false,390);
  }finally{await browser.close()}
  result.status='PASS';
  result.notes.push('Real HTTPS page and KOVO JSON loaded; auth overlay disabled only in isolated test browser.');
  fs.writeFileSync(output,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
 }catch(e){
  result.status='FAIL';result.error=String(e.stack||e);
  fs.writeFileSync(output,JSON.stringify(result,null,2));
  console.error(result.error);process.exitCode=1;
 }
}
main();

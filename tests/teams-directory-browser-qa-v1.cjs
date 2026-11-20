'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
const OUT=process.env.RUNNER_TEMP||'/tmp';
const BASE='https://kvolleylab.com';
const MIME={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
const json=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const men=json('data/competitions/v-league-men-2026-27/rosters.json'),women=json('data/competitions/v-league-women-2026-27/rosters.json');
const sum=o=>Object.values(o).reduce((a,t)=>a+t.players.length,0);
const report={status:'RUNNING',scenarios:[],warnings:[]};
const reportPath=path.join(OUT,'kvl-teams-directory-browser-report.json');
async function intercept(page){
 await page.route('https://kvolleylab.com/**',route=>{
  const u=new URL(route.request().url());
  const target=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));
  if(!target.startsWith(ROOT+path.sep))return route.fulfill({status:403,body:''});
  try{return route.fulfill({status:200,body:fs.readFileSync(target),contentType:MIME[path.extname(target)]||'application/octet-stream'})}
  catch{return route.fulfill({status:404,body:''})}
 });
 // The whole website is login-gated during private review. QA stubs only
 // the login overlay in its own browser context; production access control remains untouched.
 await page.route('https://kvolleylab.com/assets/js/member-access-gate-v1.mjs*',
  route=>route.fulfill({status:200,body:'// test-only access-gate stub',contentType:'application/javascript'}));
}
async function snapshot(page,name){
 const file=path.join(OUT,'kvl-teams-'+name+'.png');
 await page.screenshot({path:file,fullPage:true});
 const metrics=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 assert.ok(metrics.scrollWidth<=metrics.viewport+2,name+' horizontal overflow: '+JSON.stringify(metrics));
 return {file:path.basename(file),overflow:metrics.scrollWidth-metrics.viewport};
}
async function verifyHomeHero(page,expected){
 const details=await page.evaluate(async()=>{
  const hero=document.querySelector('.ktd-hero');
  const style=getComputedStyle(hero);
  const bg=style.backgroundImage;
  const match=bg.match(/url\(["']?([^"')]+)["']?\)/);
  if(!match)return {background:bg,loaded:false};
  const image=new Image();
  image.src=match[1];
  try{await image.decode()}catch{}
  return {
   asset:new URL(image.src).pathname,
   naturalWidth:image.naturalWidth,
   naturalHeight:image.naturalHeight,
   size:style.backgroundSize,
   position:style.backgroundPosition,
   minHeight:parseFloat(style.minHeight),
   headingColor:getComputedStyle(hero.querySelector('h1')).color,
   copyColor:getComputedStyle(hero.querySelector('p:last-child')).color,
   documentWidth:document.documentElement.scrollWidth,
   viewport:window.innerWidth
  };
 });
 assert.equal(details.asset,'/assets/img/home-hero/'+expected,'Hero must use the exact current Home asset: '+JSON.stringify(details));
 assert.ok(details.naturalWidth>100&&details.naturalHeight>100,'Home HERO image must decode: '+JSON.stringify(details));
 assert.equal(details.size,'cover','Keep the Home hero crop rule');
 assert.equal(details.headingColor,'rgb(255, 255, 255)','Dark Home image requires white heading text');
 assert.ok(details.documentWidth<=details.viewport+2,'Team Finder hero cannot cause page overflow');
 return details;
}
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await intercept(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/teams.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  const desktopHero=await verifyHomeHero(page,'kvl-home-hero-pc-v01.webp');
  assert.ok(desktopHero.minHeight>=318,'Home-sized desktop hero height retained');
  report.scenarios.push({case:'Desktop 1440 Team Finder HERO matches Home PC image',result:'PASS',details:desktopHero});
  assert.equal(await page.locator('.ktd-card').count(),7);
  assert.match(await page.locator('#ktdSummary').innerText(),new RegExp(sum(men)+'명'));
  assert.equal(await page.locator('[data-ktd-category="pro"]').getAttribute('aria-pressed'),'true');
  const first=page.locator('.ktd-card').first();
  const logoFraction=await first.evaluate(el=>{
   const width=el.querySelector('.ktd-card-body').getBoundingClientRect().width;
   const logo=el.querySelector('.ktd-card-logo').getBoundingClientRect().width;
   return logo/width;
  });
  assert.ok(logoFraction>=.29&&logoFraction<=.33,'approved one-third logo column');
  const okCard=page.locator('.ktd-card').filter({hasText:'OK저축은행'}).first();
  assert.match(await okCard.innerText(),/신영철/);
  await okCard.locator('[data-ktd-roster]').click();
  await page.locator('.kvlrv2').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvlrv2-row').count(),men.OKF.players.length);
  await page.locator('.kvlrv2-row').filter({hasText:'윤경'}).first().click();
  assert.match(await page.locator('.kvlrv2-detail').innerText(),/남성고/);
  assert.match(await page.locator('.kvlrv2-detail').innerText(),/인하대/);
  report.scenarios.push({case:'Pro MEN seven current clubs and 2026-27 verified roster',count:sum(men),result:'PASS',...(await snapshot(page,'men-1440'))});
  const link=page.locator('.kvlrv2-row').filter({hasText:'윤경'}).first().locator('.kvlrv2-name-link');
  assert.equal(await link.count(),1);
  await link.click();
  await page.locator('.pd-title').waitFor({timeout:30000});
  assert.equal((await page.locator('.pd-title').innerText()).trim(),'윤경');
  assert.match(await page.locator('#playerArea').innerText(),/OK저축은행/);
  report.scenarios.push({case:'verified direct player-name → existing KVL profile',result:'PASS'});
  await page.goto(BASE+'/teams.html?category=pro&gender=women',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),7);
  assert.match(await page.locator('#ktdSummary').innerText(),new RegExp(sum(women)+'명'));
  const road=page.locator('.ktd-card').filter({hasText:'한국도로공사'}).first();
  assert.match(await road.innerText(),/김영래/);
  const rsp=page.locator('.ktd-card').filter({hasText:'정관장'}).first();
  await rsp.locator('[data-ktd-roster]').click();
  await page.locator('.kvlrv2').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvlrv2-row').count(),women.RSP.players.length);
  const kim=page.locator('.kvlrv2-row').filter({hasText:'김아중'}).first();
  await kim.click();
  assert.match(await page.locator('.kvlrv2-detail').innerText(),/청수고/);
  assert.equal(await page.locator('.kvlrv2-school-grid>div').count(),1);
  assert.equal(await kim.locator('.kvlrv2-name-link').count(),0,'unverified player must not link to guessed ID');
  report.scenarios.push({case:'Pro WOMEN seven current clubs and unverified ID protection',count:sum(women),result:'PASS',...(await snapshot(page,'women-1440'))});
  await page.locator('[data-ktd-category="university"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),6,'women university team directory');
  assert.ok((await page.locator('.ktd-card').first().locator('a.ktd-card-action').getAttribute('href')).includes('university-league-women-2026'));
  await page.locator('[data-ktd-gender="men"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),15,'men university directory');
  report.scenarios.push({case:'KUSF university male 15 / female 6 snapshots linked',result:'PASS'});
  await page.locator('[data-ktd-category="high"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.ok(await page.locator('.ktd-card').count()>=12);
  assert.match(await page.locator('#ktdSourceNote').innerText(),/대회 참가팀 목록/);
  await page.locator('[data-ktd-category="middle"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.ok(await page.locator('.ktd-card').count()>=12);
  report.scenarios.push({case:'School high and middle 2026 official competition participants linked',result:'PASS'});
  await page.locator('[data-ktd-category="national"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),3);
  assert.equal(await page.locator('[data-ktd-gender="men"]').isVisible(),false);
  assert.match(await page.locator('.ktd-grid').innerText().catch(()=>page.locator('#ktdGrid').innerText()),/대한민국 여자대표팀/);
  await page.locator('[data-ktd-category="international"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),40,'40-country international directory must be preserved');
  report.scenarios.push({case:'National/international routes actionable and gender buttons hidden',result:'PASS'});
  await page.locator('[data-ktd-category="pro"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  await page.locator('#ktdSearch').fill('OK저축은행');
  assert.equal(await page.locator('.ktd-card').count(),1);
  await page.locator('#ktdSearch').fill('');
  assert.equal(await page.locator('.ktd-card').count(),7);
  await page.locator('#ktdRefresh').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),7);
  assert.deepEqual(errors,[],'desktop JS page errors');
  await page.close();
  for(const width of [390,360]){
   const mobile=await browser.newPage({viewport:{width,height:820}});
   await intercept(mobile);
   const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
   await mobile.goto(BASE+'/teams.html?category=pro&gender=men',{waitUntil:'domcontentloaded',timeout:30000});
   await mobile.locator('.ktd-card').first().waitFor({timeout:30000});
   const mobileHero=await verifyHomeHero(mobile,'kvl-home-hero-mobile-v01.webp');
   assert.ok(mobileHero.minHeight>=264,'Home-sized mobile hero height retained');
   report.scenarios.push({case:'Mobile '+width+' Team Finder HERO matches Home mobile image',result:'PASS',details:mobileHero});
   assert.equal(await mobile.locator('.ktd-card').count(),7);
   const summary=await mobile.locator('#ktdSummary').innerText();
   assert.match(summary,/등록 선수/);
   await mobile.locator('.ktd-card').filter({hasText:'OK저축은행'}).first().locator('[data-ktd-roster]').click();
   await mobile.locator('.kvlrv2').waitFor({timeout:30000});
   await mobile.locator('.kvlrv2-row').filter({hasText:'윤경'}).first().click();
   const result=await snapshot(mobile,'men-'+width);
   assert.deepEqual(mobileErrors,[]);
   report.scenarios.push({case:'Mobile '+width+'px directory and shared roster',result:'PASS',...result});
   await mobile.close();
  }
  report.status='PASS';
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 }catch(error){
  report.status='FAIL';report.error=String(error.stack||error);
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
  console.error(report.error);process.exitCode=1;
 }finally{await browser.close()}
}
main();

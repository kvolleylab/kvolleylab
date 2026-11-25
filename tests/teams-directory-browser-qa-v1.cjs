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

async function verifyDirectoryColumns(page,expectedColumns,mode){
 const data=await page.evaluate(()=>{
  const grid=document.querySelector('#ktdGrid');
  const cards=[...grid.querySelectorAll(':scope > .ktd-card')];
  const b=cards.slice(0,4).map(card=>{
   const r=card.getBoundingClientRect(),body=card.querySelector('.ktd-card-body'),logo=card.querySelector('.ktd-card-logo'),
         action=card.querySelector('.ktd-card-action'),name=card.querySelector('h3');
   return {top:r.top,left:r.left,width:r.width,height:r.height,
    display:getComputedStyle(body).display,flow:getComputedStyle(body).flexDirection,
    logoWidth:logo.getBoundingClientRect().width,logoHeight:logo.getBoundingClientRect().height,
    actionHeight:action.getBoundingClientRect().height,
    nameVisible:name.getBoundingClientRect().height>0,
    cardOverflow:card.scrollWidth-card.clientWidth};
  });
  return {viewport:innerWidth,cols:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
   count:cards.length,boxes:b,scrollWidth:document.documentElement.scrollWidth};
 });
 assert.ok(data.count>expectedColumns,'Expected a multi-row directory: '+JSON.stringify(data));
 assert.equal(data.cols,expectedColumns,mode+' should use '+expectedColumns+' cards per row: '+JSON.stringify(data));
 assert.ok(data.boxes.slice(0,expectedColumns).every(x=>Math.abs(x.top-data.boxes[0].top)<2),
  mode+' first row not aligned: '+JSON.stringify(data));
 assert.ok(data.boxes[expectedColumns].top>data.boxes[0].top+30,
  mode+' first card on row two is not below row one: '+JSON.stringify(data));
 assert.ok(data.boxes.every(x=>x.nameVisible&&x.actionHeight>=43&&x.cardOverflow<=2),
  mode+' text, buttons or horizontal clipping: '+JSON.stringify(data));
 assert.ok(data.scrollWidth<=data.viewport+2,mode+' page-wide overflow: '+JSON.stringify(data));
 if(mode==='mobile'){
  assert.ok(data.boxes.every(x=>x.display==='flex'&&x.flow==='column'&&x.logoWidth>=x.width*.77&&x.logoHeight>=65),
   'Mobile cards must stack 60px+ logos over names and actions: '+JSON.stringify(data));
 }else{
  assert.ok(data.boxes.every(x=>x.display==='grid'&&x.logoWidth/x.width>=.28&&x.logoWidth/x.width<=.34),
   mode+' needs the original 31% logo column: '+JSON.stringify(data));
 }
 return data;
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
  report.scenarios.push({case:'Wide PC 1440px: 3 horizontal team cards per row',result:'PASS',
   layout:await verifyDirectoryColumns(page,3,'wide PC')});
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
  assert.match(await okCard.innerText(),/감독대행\s*:\s*김재헌/,'Show official acting role instead of former head coach');
  assert.doesNotMatch(await okCard.innerText(),/신영철/,'Do not label resigned coach as current');
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
  await page.goto(BASE+'/teams.html?category=pro&gender=men&league=sv&season=2026-27',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('[data-ktd-pro-league="sv"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#ktdProSeasonSelect').inputValue(),'2026-27');
  assert.equal(await page.locator('.ktd-card').count(),12);
  assert.match(await page.locator('#ktdSummary').innerText(),/12개 구단 · 등록 선수 211명/);
  assert.equal(await page.locator('img.ktd-team-logo-image').count(),12);
  const svLogoState=await page.locator('img.ktd-team-logo-image').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{
   img.loading='eager';try{await img.decode()}catch{}
   return {src:img.src,loaded:img.naturalWidth>0&&img.naturalHeight>0,hidden:img.hidden,fallbackHidden:img.nextElementSibling?.matches('.ktd-team-logo-fallback[hidden]')&&getComputedStyle(img.nextElementSibling).display==='none'};
  })));
  assert.ok(svLogoState.every(x=>x.loaded&&!x.hidden&&x.fallbackHidden),'SV.LEAGUE official logos must load in browser QA: '+JSON.stringify(svLogoState.filter(x=>!x.loaded||x.hidden||!x.fallbackHidden)));
  const failureState=await page.locator('img.ktd-team-logo-image').first().evaluate(img=>{
   const fallback=img.nextElementSibling;
   img.dispatchEvent(new Event('error'));
   const state={imageHidden:getComputedStyle(img).display==='none',fallbackVisible:!fallback.hidden&&getComputedStyle(fallback).display!=='none'};
   img.hidden=false;fallback.hidden=true;
   return state;
  });
  assert.deepEqual(failureState,{imageHidden:true,fallbackVisible:true},'Only the monogram should display on logo failure');
  const jtekt=page.locator('.ktd-card').filter({hasText:'JTEKT 아이치'}).first();
  await jtekt.locator('[data-ktd-roster]').click();
  await page.locator('[data-kvl-pro-league-roster]').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvl-lr-team-logo img').count(),1);
  assert.equal(await page.locator('.kvl-lr-team-logo img').evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0&&img.naturalHeight>0}),true);
  assert.equal(await page.locator('.kvl-lr-row').count(),16);
  const defalco=page.locator('.kvl-lr-row').filter({hasText:'토리 디팔코'}).first();
  assert.equal(await page.locator('.kvl-lr-name-button').count(),16);
  assert.ok((await page.locator('.kvl-lr-name-button').allTextContents()).every(x=>/[가-힣]/.test(x)));
  assert.doesNotMatch(await defalco.innerText(),/Torey Defalco/i);
  await defalco.locator('.kvl-lr-name-button').click();
  assert.match(await page.locator('[data-kvl-lr-detail]').innerText(),/Torey Defalco/i);
  await page.locator('[data-kvl-lr-close]').click();
  assert.equal(await page.locator('[data-kvl-lr-detail]').isVisible(),false);
  assert.match(await defalco.innerText(),/🇺🇸\s*미국/);
  assert.equal(await defalco.locator('.kvl-lr-vb a').getAttribute('href'),'https://volleybox.net/torey-defalco-p2330');
  await page.locator('[data-kvl-lr-nat="foreign"]').click();
  assert.equal(await page.locator('.kvl-lr-row').count(),3);
  await page.locator('[data-kvl-lr-pos="OH"]').click();
  assert.equal(await page.locator('.kvl-lr-row').count(),1);
  assert.match(await page.locator('.kvl-lr-row').innerText(),/토리 디팔코/);
  report.scenarios.push({case:'SV.LEAGUE 2026-27 JTEKT nationality / foreign / position filters',result:'PASS',...(await snapshot(page,'sv-jtekt-1440'))});
  await page.locator('#ktdCloseRoster').click();
  const tokyo=page.locator('.ktd-card').filter({hasText:'도쿄 GB'}).first();
  await tokyo.locator('[data-ktd-roster]').click();
  await page.locator('[data-kvl-pro-league-roster]').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvl-lr-row').count(),20);
  assert.equal(await page.locator('.kvl-lr-recheck').count(),4,'Tokyo source conflicts stay visibly marked instead of silently resolved');
  report.scenarios.push({case:'SV.LEAGUE source conflicts remain explicit RECHECK badges',result:'PASS'});
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
  // Preserve two horizontal cards on medium PC/tablet rather than shrinking into three columns.
  const mid=await browser.newPage({viewport:{width:1024,height:850}});
  await intercept(mid);
  await mid.goto(BASE+'/teams.html?category=pro&gender=men',{waitUntil:'domcontentloaded',timeout:30000});
  await mid.locator('.ktd-card').first().waitFor({timeout:30000});
  report.scenarios.push({case:'Medium PC 1024px: 2 horizontal team cards per row',result:'PASS',
   layout:await verifyDirectoryColumns(mid,2,'medium PC')});
  await mid.close();
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
  report.scenarios.push({case:'International 40 flag cards share the wide-PC 3-column layout',result:'PASS',
   layout:await verifyDirectoryColumns(page,3,'wide PC')});
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
   report.scenarios.push({case:'Mobile '+width+'px: 2 vertically-stacked team cards in a row',result:'PASS',
    layout:await verifyDirectoryColumns(mobile,2,'mobile')});
   const summary=await mobile.locator('#ktdSummary').innerText();
   assert.match(summary,/등록 선수/);
   await mobile.locator('.ktd-card').filter({hasText:'OK저축은행'}).first().locator('[data-ktd-roster]').click();
   await mobile.locator('.kvlrv2').waitFor({timeout:30000});
   await mobile.locator('.kvlrv2-row').filter({hasText:'윤경'}).first().click();
   const result=await snapshot(mobile,'men-'+width);
   await mobile.goto(BASE+'/teams.html?category=pro&gender=men&league=sv&season=2026-27',{waitUntil:'domcontentloaded',timeout:30000});
   await mobile.locator('.ktd-card').first().waitFor({timeout:30000});
   assert.equal(await mobile.locator('.ktd-card').count(),12);
   assert.equal(await mobile.locator('img.ktd-team-logo-image').count(),12);
   const mobileLogoState=await mobile.locator('img.ktd-team-logo-image').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{
    img.loading='eager';try{await img.decode()}catch{}
    return {src:img.src,loaded:img.naturalWidth>0&&img.naturalHeight>0,hidden:img.hidden,fallbackHidden:img.nextElementSibling?.matches('.ktd-team-logo-fallback[hidden]')&&getComputedStyle(img.nextElementSibling).display==='none'};
   })));
   assert.ok(mobileLogoState.every(x=>x.loaded&&!x.hidden&&x.fallbackHidden),'Mobile SV.LEAGUE logos must load: '+JSON.stringify(mobileLogoState.filter(x=>!x.loaded||x.hidden||!x.fallbackHidden)));
   await mobile.locator('.ktd-card').filter({hasText:'JTEKT 아이치'}).first().locator('[data-ktd-roster]').click();
   await mobile.locator('[data-kvl-pro-league-roster]').waitFor({timeout:30000});
   assert.equal(await mobile.locator('.kvl-lr-team-logo img').count(),1);
   assert.equal(await mobile.locator('.kvl-lr-row').count(),16);
   assert.match(await mobile.locator('.kvl-lr-row').filter({hasText:'토리 디팔코'}).first().innerText(),/🇺🇸\s*미국/);
   report.scenarios.push({case:'Mobile '+width+'px SV.LEAGUE season roster keeps nationality and direct VB',result:'PASS',...(await snapshot(mobile,'sv-jtekt-'+width))});
   await mobile.goto(BASE+'/teams.html?category=international&gender=men',{waitUntil:'domcontentloaded',timeout:30000});
   await mobile.locator('.ktd-country-card').first().waitFor({timeout:30000});
   assert.equal(await mobile.locator('.ktd-country-card').count(),40);
   report.scenarios.push({case:'Mobile '+width+'px: country/flag cards also form two columns',result:'PASS',
    layout:await verifyDirectoryColumns(mobile,2,'mobile')});
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

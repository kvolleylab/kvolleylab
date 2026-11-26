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
   if(html.includes('kvl-international-unified-roster-v1.js?v=20261126-international-popup-v1-common-v3')
      &&html.includes('kvl-international-countries-v1.js?v=20261124-season-snapshot-v1')
      &&html.includes('kvl-team-roster-standard-v1.css?v=20261126-international-popup-v1-common-v3')
      &&html.includes('kvl-team-roster-standard-v1.js?v=20261123-club-country-flags-v2-rsv2-common-v3')){
    const [index,clubs]=await Promise.all([
      read('data/international/country-roster-index-v1.json'),
      read('data/international/player-club-registry-2026-27-v1.json')
    ]);
    if(index.snapshot_count===89&&clubs.players?.['40943'])return;
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
async function verifyFullWidthRoster(page){
 const m=await page.locator('.kvl-unified-table').evaluate(table=>{
  const outer=table.getBoundingClientRect(),rows=[...table.querySelectorAll('.kvl-unified-row')];
  const contained=el=>{
   const rect=el.getBoundingClientRect();
   return rect.left>=outer.left-2&&rect.right<=outer.right+2&&el.scrollWidth<=el.clientWidth+2;
  };
  return {tableWidth:table.clientWidth,scrollWidth:table.scrollWidth,viewport:innerWidth,
   documentWidth:document.documentElement.scrollWidth,rows:rows.length,
   allVisible:rows.every(row=>[...row.children].filter(e=>getComputedStyle(e).display!=='none').every(contained)),
   clubVisible:rows.every(row=>contained(row.querySelector('.kvl-unified-club'))),
   vbVisible:rows.every(row=>contained(row.querySelector('.kvl-unified-vb')))};
 });
 assert.ok(m.rows>0&&m.allVisible&&m.clubVisible&&m.vbVisible,'All eight roster fields must fit: '+JSON.stringify(m));
 assert.ok(m.scrollWidth<=m.tableWidth+2&&m.documentWidth<=m.viewport+2,'No desktop horizontal roster/page scroll: '+JSON.stringify(m));
 return m;
}
async function verifyDesktopPopup(page,row){
 const dialog=page.locator('.kvl-unified-profile-dialog');
 assert.equal(await dialog.count(),1);
 assert.equal(await dialog.evaluate(el=>el.open),false,'Do not auto-open a profile');
 const before=await verifyFullWidthRoster(page);
 const href=await row.locator('.kvl-unified-volleybox').getAttribute('href');
 await row.locator('.kvl-unified-name').click();
 await dialog.waitFor({state:'visible'});
 const popup=await dialog.evaluate(el=>{
  const r=el.getBoundingClientRect();
  return {modal:el.matches(':modal'),width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,vw:innerWidth,vh:innerHeight};
 });
 assert.ok(popup.modal&&popup.width<=522&&popup.left>=0&&popup.right<=popup.vw&&popup.top>=0&&popup.bottom<=popup.vh,'Small modal within viewport: '+JSON.stringify(popup));
 assert.match(await dialog.innerText(),/Yuki Ishikawa/);
 assert.match(await dialog.innerText(),/SMS Grup Efeler Ligi/);
 assert.match(await dialog.innerText(),/VNL/);
 assert.equal(await dialog.locator('a[aria-label="Volleybox 선수 프로필 열기"]').getAttribute('href'),href);
 assert.equal(await page.locator('.kvl-unified-table').evaluate(el=>el.clientWidth),before.tableWidth,'Opening profile must not shrink roster');
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'hidden'});
 assert.ok(await row.evaluate(el=>document.activeElement===el),'Restore row focus on Escape');
 await row.press('Enter');
 await dialog.waitFor({state:'visible'});
 await dialog.locator('[data-kvl-unified-close]').click();
 await dialog.waitFor({state:'hidden'});
 await row.locator('.kvl-unified-name').click();
 await dialog.waitFor({state:'visible'});
 await page.mouse.click(10,10);
 await dialog.waitFor({state:'hidden'});
 assert.equal(await page.locator('.kvl-unified-detail:not([hidden])').count(),0);
 assert.equal(await row.locator('.kvl-unified-volleybox').getAttribute('href'),href,'Original VB direct link unchanged');
 return {before,popup};
}

async function run(){
 let browser;
 try{
  await waitDeploy();
  const gate=await read('data/member-access-v1.json');
  assert.equal(gate.enabled,true);
  assert.ok(gate.protectedPaths.includes('teams.html'));
  browser=await chromium.launch({headless:true});
  for(const width of [1440,900,390,360]){
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
   if(width>=821){
    result.checks.push({name:'Desktop all fields visible and profile popup '+width+'px',status:'PASS',...(await verifyDesktopPopup(page,target))});
   }else{
    await target.locator('.kvl-unified-name').click();
    assert.ok(await page.locator('.kvl-rs-columns > .kvl-unified-detail:not([hidden])').isVisible());
    await page.locator('[data-kvl-unified-close]').click();
   }
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

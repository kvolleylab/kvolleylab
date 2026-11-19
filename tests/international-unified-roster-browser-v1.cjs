'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.RUNNER_TEMP||'/tmp',BASE='https://kvolleylab.com';
const MIME={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const REPORT={status:'RUNNING',kind:'isolated production site source files in Chromium',views:[]};
const output=path.join(OUT,'kvl-international-unified-roster-v1-report.json');
async function route(page){
 await page.route('https://kvolleylab.com/**',route=>{
  const url=new URL(route.request().url());
  const file=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(ROOT+path.sep))return route.fulfill({status:403,body:''});
  try{return route.fulfill({status:200,body:fs.readFileSync(file),contentType:MIME[path.extname(file)]||'application/octet-stream'})}
  catch{return route.fulfill({status:404,body:''})}
 });
 // Private site review gate disabled only in this test browser, not in production files.
 await page.route('https://kvolleylab.com/assets/js/member-access-gate-v1.mjs*',
   route=>route.fulfill({status:200,body:'// isolated browser QA only',contentType:'application/javascript'}));
}
async function open(browser,width,query){
 const p=await browser.newPage({viewport:{width,height:width<=400?844:930},deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));await route(p);
 await p.goto(BASE+'/teams.html?'+query,{waitUntil:'domcontentloaded',timeout:30000});
 await p.locator('.ktd-country-panel').waitFor({timeout:30000});
 return {page:p,errors};
}
async function shot(page,name){
 const x=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 assert.ok(x.scrollWidth<=x.width+2,'Horizontal overflow '+name+': '+JSON.stringify(x));
 const file=path.join(OUT,'kvl-unified-country-'+name+'.png');
 await page.screenshot({path:file,fullPage:true});
 return {screenshot:path.basename(file),overflow:x.scrollWidth-x.width};
}
async function testApp(){
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const pc=await open(browser,1440,'category=international&gender=men&country=JPN&year=2026');
  const page=pc.page;
  await page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-event').count(),3);
  assert.equal(await page.locator('.kvl-unified-row').count(),26);
  assert.match(await page.locator('.kvl-unified-count').innerText(),/26명 통합/);
  assert.match(await page.locator('.kvl-unified-count').innerText(),/42건/);
  assert.equal(await page.locator('.kvl-unified-head span').count(),8);
  // PC readability contract: verified events share a card row and roster data is legible.
  const layout=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.ktd-country-event')];
   const px=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
   return {eventCount:cards.length,allCardsSameRow:cards.every(c=>Math.abs(c.getBoundingClientRect().top-cards[0].getBoundingClientRect().top)<2),
     cardWidth:cards[0].getBoundingClientRect().width,
     cardTitlePx:px('.ktd-country-event strong'),
     rowPx:px('.kvl-unified-row'),namePx:px('.kvl-unified-name strong'),
     dobPx:px('.kvl-unified-dob'),clubPx:px('.kvl-unified-club'),
     enPx:px('.kvl-unified-name small'),headPx:px('.kvl-unified-head'),
     volleyboxPx:px('.kvl-unified-volleybox'),
     tableViewport:document.querySelector('.kvl-unified-table').clientWidth,
     tableContent:document.querySelector('.kvl-unified-table').scrollWidth};
  });
  assert.equal(layout.eventCount,3,'Do not invent a Japan AVC Cup entry');
  assert.ok(layout.allCardsSameRow&&layout.cardWidth>=228,'PC cards must sit across one row: '+JSON.stringify(layout));
  for(const [field,minimum] of [['cardTitlePx',16],['rowPx',21],['namePx',24],['dobPx',21],['clubPx',21],['enPx',21],['headPx',21],['volleyboxPx',21]])
   assert.ok(layout[field]>=minimum,field+' below PC readability floor: '+JSON.stringify(layout));
  REPORT.views.push({name:'PC 1440 full 150-percent-equivalent roster fonts',status:'PASS',layout});
  // Match the actual KVL desktop menu font and prevent desktop-to-tablet fallback to tiny type.
  for(const width of [900]){
   const tablet=await open(browser,width,'category=international&gender=men&country=JPN&year=2026');
   const t=tablet.page;
   await t.locator('.kvl-unified-row').first().waitFor({timeout:30000});
   const type=await t.evaluate(()=>{
    const px=s=>parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    return {row:px('.kvl-unified-row'),name:px('.kvl-unified-name strong'),
      en:px('.kvl-unified-name small'),dob:px('.kvl-unified-dob'),club:px('.kvl-unified-club'),
      volleybox:px('.kvl-unified-volleybox'),head:px('.kvl-unified-head'),viewport:innerWidth,
      width:document.documentElement.scrollWidth,
      tableWidth:document.querySelector('.kvl-unified-table').clientWidth,
      tableScroll:document.querySelector('.kvl-unified-table').scrollWidth};
   });
   assert.ok(type.name>=24 && [type.row,type.en,type.dob,type.club,type.volleybox,type.head].every(v=>v>=21),
      '900px PC/tablet width must retain 150-percent-equivalent type: '+JSON.stringify(type));
   assert.ok(type.tableScroll>type.tableWidth,'900px table must scroll internally instead of shrinking text: '+JSON.stringify(type));
   assert.ok(type.width<=type.viewport+2,'900px document should not overflow: '+JSON.stringify(type));
   assert.deepEqual(tablet.errors,[]);
   REPORT.views.push({name:'900px 24/21px fonts with contained roster scroll',status:'PASS',type});
   await t.close();
  }
  const ishikawa=page.locator('.kvl-unified-row').filter({hasText:'이시카와 유키'}).first();
  assert.match(await ishikawa.innerText(),/1995-12-11/);
  assert.match(await ishikawa.innerText(),/Ziraat Bankkart Ankara/);
  assert.equal(await ishikawa.locator('.kvl-unified-volleybox').count(),1);
  assert.equal(await ishikawa.locator('.kvl-unified-dot.is-major').count(),1);
  assert.equal(await ishikawa.locator('.kvl-unified-dot.is-regular').count(),1);
  assert.ok((await page.locator('.kvl-unified-row').allInnerTexts()).filter(t=>t.includes('후카츠')).length===2,'Different Fukatsu #3 preserved');
  REPORT.views.push({name:'Japan MEN real unified roster 26 with DOB, club, Volleybox and tiny participation dots',status:'PASS',...(await shot(page,'jpn-men-1440'))});
  await page.locator('[data-kvl-unified-filter="vnl-men-2026:JPN"]').click();
  assert.equal(await page.locator('.kvl-unified-row').count(),16);
  await page.locator('[data-kvl-unified-filter="asian-games-men-2026:JPN"]').click();
  assert.equal(await page.locator('.kvl-unified-row').count(),12);
  await page.locator('[data-kvl-unified-filter="avc-men-continental-2026:JPN"]').click();
  assert.equal(await page.locator('.kvl-unified-row').count(),14);
  await page.locator('[data-kvl-unified-filter="multi"]').click();
  assert.equal(await page.locator('.kvl-unified-row').count(),14);
  await page.locator('[data-kvl-unified-filter="all"]').click();
  await page.locator('[data-kvl-unified-search]').fill('Yuki Ishikawa');
  assert.equal(await page.locator('.kvl-unified-row').count(),1);
  await page.locator('[data-kvl-unified-search]').fill('');
  await page.locator('.kvl-unified-row').filter({hasText:'이시카와 유키'}).first().locator('.kvl-unified-club').click();
  await page.locator('.kvl-unified-detail:not([hidden])').waitFor({timeout:10000});
  assert.match(await page.locator('.kvl-unified-detail').innerText(),/VNL/);
  assert.match(await page.locator('.kvl-unified-detail').innerText(),/대륙선수권/);
  await page.locator('[data-kvl-unified-close]').click();
  assert.equal(await page.locator('.kvl-unified-detail:not([hidden])').count(),0);
  REPORT.views.push({name:'Original tournament filters 16/12/14, multi 14, search/detail',status:'PASS'});
  await page.locator('[data-country-snapshot="vnl-men-2026:JPN"]').click();
  await page.locator('.ktd-country-player').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-country-player').count(),16,'Existing per-competition roster preserved');

  const snapshotType=await page.evaluate(()=>{
   const px=s=>parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
   return {name:px('.ktd-country-person strong'),en:px('.ktd-country-person small'),
     number:px('.ktd-country-number'),link:px('.ktd-country-player-links a'),
     row:px('.ktd-country-player'),header:px('.ktd-country-roster-label')};
  });
  assert.ok(snapshotType.name>=24 && ['en','number','link','row','header'].every(k=>snapshotType[k]>=21),
   'Separate tournament roster must use 24px names and 21px facts: '+JSON.stringify(snapshotType));
  REPORT.views.push({name:'Separate tournament roster 24/21px text with all existing entries',status:'PASS',snapshotType});
  assert.equal(await page.locator('.kvl-unified-row').count(),26,'Unified table still present');
  assert.match(await page.locator('[data-country-selection]').innerText(),/후보 엔트리/);
  await page.locator('[data-country-year="2026"]').click();
  await page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.kvl-unified-row').count(),26);
  await page.locator('[data-country-close]').click();
  await page.locator('[data-ktd-category="pro"]').click();
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.ktd-card').count(),7);
  assert.deepEqual(pc.errors,[]);
  REPORT.views.push({name:'Existing separate tournament, selection history, year reset and professional roster preserved',status:'PASS'});
  await page.close();
  const wo=await open(browser,1440,'category=international&gender=women&country=JPN&year=2026');
  await wo.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  assert.equal(await wo.page.locator('.ktd-country-event').count(),2);
  assert.equal(await wo.page.locator('.kvl-unified-count').count(),1);
  assert.ok((await wo.page.locator('.kvl-unified-count').innerText()).includes('26건'));
  assert.ok(await wo.page.locator('.kvl-unified-row').count()>=14);
  assert.deepEqual(wo.errors,[]);
  REPORT.views.push({name:'Japan WOMEN source missing DOB stays unguessed',status:'PASS'});
  await wo.page.close();
  const brn=await open(browser,1440,'category=international&gender=men&country=BRN&year=2026');
  await brn.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  assert.equal(await brn.page.locator('.ktd-country-event').count(),2);
  assert.ok(await brn.page.locator('.kvl-unified-row').count()>=14);
  assert.deepEqual(brn.errors,[]);
  REPORT.views.push({name:'Bahrain mens distinct continental and cup source records',status:'PASS'});
  await brn.page.close();
  for(const width of [390,360]){
   const m=await open(browser,width,'category=international&gender=men&country=JPN&year=2026');
   await m.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
   assert.equal(await m.page.locator('.kvl-unified-row').count(),26);
   const row=m.page.locator('.kvl-unified-row').filter({hasText:'이시카와 유키'}).first();
   assert.match(await row.innerText(),/Ziraat Bankkart Ankara/);
   assert.match(await row.innerText(),/1995-12-11/);
   assert.equal(await row.locator('a.kvl-unified-volleybox').count(),1);
   assert.equal(await row.locator('.kvl-unified-dot.is-major').count(),1);
   assert.equal(await row.locator('.kvl-unified-dot.is-regular').count(),1);
   assert.deepEqual(m.errors,[]);
   REPORT.views.push({name:'Mobile '+width+'px keeps player data and dots',status:'PASS',...(await shot(m.page,'jpn-men-'+width))});
   await m.page.close();
  }
  REPORT.status='PASS';fs.writeFileSync(output,JSON.stringify(REPORT,null,2));console.log(JSON.stringify(REPORT,null,2));
 }catch(e){
  REPORT.status='FAIL';REPORT.error=String(e.stack||e);
  fs.writeFileSync(output,JSON.stringify(REPORT,null,2));console.error(REPORT.error);process.exitCode=1;
 }finally{await browser?.close()}
}
testApp();

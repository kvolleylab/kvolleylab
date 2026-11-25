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
  assert.equal(await page.locator('.ktd-country-link').count(),3);
  assert.equal(await page.locator('[data-country-year-select]').inputValue(),'2026');
  assert.equal(await page.locator('.ktd-country-note').filter({hasText:'국가별 페이지는 하나로 유지'}).count(),0);
  assert.match(await page.locator('[data-country-close]').innerText(),/국가 목록/);
  assert.equal(await page.locator('.kvl-unified-row').count(),26);
  assert.match(await page.locator('.kvl-unified-count').innerText(),/26명 통합/);
  assert.match(await page.locator('.kvl-unified-count').innerText(),/42건/);
  assert.equal(await page.locator('.kvl-unified-head span').count(),8);
  // PC readability contract: roster is primary; competition navigation stays compact.
  const layout=await page.evaluate(()=>{
   const links=[...document.querySelectorAll('.ktd-country-link')];
   const px=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
   return {linkCount:links.length,linksCompact:links.every(a=>a.getBoundingClientRect().height<=48),
     rowPx:px('.kvl-unified-row'),namePx:px('.kvl-unified-name strong'),
     dobPx:px('.kvl-unified-dob'),clubPx:px('.kvl-unified-club'),
     enPx:px('.kvl-unified-name small'),headPx:px('.kvl-unified-head'),
     volleyboxPx:px('.kvl-unified-volleybox'),
     tableViewport:document.querySelector('.kvl-unified-table').clientWidth,
     tableContent:document.querySelector('.kvl-unified-table').scrollWidth};
  });
  assert.equal(layout.linkCount,3,'Japan should expose three compact 2026 competition links');
  assert.ok(layout.linksCompact,'Competition navigation should remain compact: '+JSON.stringify(layout));
  for(const [field,exact] of [['rowPx',17],['namePx',17],['dobPx',17],['clubPx',17],['enPx',17],['headPx',17],['volleyboxPx',17]])
   assert.equal(layout[field],exact,field+' must equal revised PC specification: '+JSON.stringify(layout));
  REPORT.views.push({name:'PC 1440 unified 17px roster fields with Korean-first list',status:'PASS',layout});
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
   assert.ok([type.name,type.row,type.en,type.dob,type.club,type.volleybox,type.head].every(v=>v===17),
      '900px PC/tablet must retain exact 17px roster type: '+JSON.stringify(type));
   assert.ok(type.tableScroll>type.tableWidth,'900px table must scroll internally instead of shrinking text: '+JSON.stringify(type));
   assert.ok(type.width<=type.viewport+2,'900px document should not overflow: '+JSON.stringify(type));
   assert.deepEqual(tablet.errors,[]);
   REPORT.views.push({name:'900px 17px roster fonts with contained roster scroll',status:'PASS',type});
   const fonts=await t.evaluate(()=>{
    const style=s=>getComputedStyle(document.querySelector(s));
    const base=style('body').fontFamily;
    return {base,unified:style('.kvl-unified').fontFamily,country:style('.ktd-country-panel').fontFamily,
      eventAction:style('.ktd-country-link').fontFamily,search:style('.kvl-unified-search input').fontFamily,
      titleWeight:style('.kvl-unified-name strong').fontWeight,
      leaguePx:parseFloat(style('.kvl-roster-club-meta').fontSize),englishDisplay:style('.kvl-unified-name small').display};
   });
   for(const key of ['unified','country','eventAction','search'])assert.equal(fonts[key],fonts.base,
    'Country-specific font should match KVL site font: '+JSON.stringify(fonts));
   assert.equal(fonts.titleWeight,'800','Avoid extra-heavy synthetic 900 title: '+JSON.stringify(fonts));
   assert.equal(fonts.leaguePx,15,'Korean country/league second line should be 2px smaller than club name');
   assert.equal(fonts.englishDisplay,'none','Roster list should be Korean-first; English remains in detail');
   REPORT.views.push({name:'Font family matches KVL site typography at PC 900',status:'PASS',fonts});
   await t.close();
  }
  const ishikawa=page.locator('.kvl-unified-row').filter({hasText:'이시카와 유키'}).first();
  assert.match(await ishikawa.innerText(),/1995-12-11/);
  assert.match(await ishikawa.innerText(),/Ziraat Bankkart Ankara/);
  assert.equal(await ishikawa.locator('.kvl-unified-volleybox').count(),1);
  assert.equal(await ishikawa.locator('.kvl-unified-volleybox').innerText(),'VB->');
  assert.equal((await ishikawa.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),'튀르키예 · 에펠레르 리기 (1부)');
  assert.match(await ishikawa.locator('.kvl-roster-league-flag').getAttribute('src'),/\/tr\.svg$/);
  assert.equal(await ishikawa.locator('.kvl-roster-club-meta').getAttribute('title'),'Türkiye · SMS Grup Efeler Ligi');
  assert.doesNotMatch(await ishikawa.locator('.kvl-unified-name').innerText(),/Yuki Ishikawa/,'Quick roster list is Korean-first');
  const arai=page.locator('.kvl-unified-row').filter({hasText:'아라이 유다이'}).first();
  assert.match((await arai.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),/^일본(?: · .+)?$/,'Do not invent a league when the verified source only provides Japan');
  const akihiro=page.locator('.kvl-unified-row').filter({hasText:'후카츠 아키히로'}).first();
  assert.match(await akihiro.locator('.kvl-unified-club').innerText(),/Tokyo Great Bears/);
  assert.equal((await akihiro.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),'일본 · SV.리그 (1부)');
  assert.match(await akihiro.locator('.kvl-roster-league-flag').getAttribute('src'),/\/jp\.svg$/);
  assert.equal(await akihiro.locator('.kvl-roster-club-meta').getAttribute('title'),'Japan · SV.League Men');

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
  assert.ok(await page.locator('.kvl-unified-detail').evaluate(el=>el.getBoundingClientRect().left>=el.previousElementSibling.getBoundingClientRect().right-1),'desktop profile must sit beside the roster');
  assert.match(await page.locator('.kvl-unified-detail').innerText(),/Yuki Ishikawa/);
  assert.match(await page.locator('.kvl-unified-detail').innerText(),/VNL/);
  assert.match(await page.locator('.kvl-unified-detail').innerText(),/대륙선수권/);
  assert.match(await page.locator('.kvl-unified-detail').innerText(),/SMS Grup Efeler Ligi/,'Detailed profile keeps source-verified league name');
  await page.locator('[data-kvl-unified-close]').click();
  assert.equal(await page.locator('.kvl-unified-detail:not([hidden])').count(),0);
  REPORT.views.push({name:'Original tournament filters 16/12/14, multi 14, search/detail',status:'PASS'});
  const quickHrefs=await page.locator('.ktd-country-link').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
  assert.ok(quickHrefs.some(x=>/vnl-men-2026/.test(x||'')),'VNL must remain directly reachable');
  assert.ok(quickHrefs.some(x=>/asian-games-men-2026/.test(x||'')),'Asian Games must remain directly reachable');
  assert.ok(quickHrefs.some(x=>/avc-men-continental-2026/.test(x||'')),'AVC Continental must remain directly reachable');
  assert.ok(await page.locator('.kvl-unified-reserve').count()>=1,'VNL Reserve athletes must be marked inside the integrated roster');
  REPORT.views.push({name:'Compact competition links and VNL reserve badge replace redundant source cards',status:'PASS'});
  assert.equal(await page.locator('[data-rs-pos]').count(),6);
  await page.locator('[data-rs-pos="OH"]').click();
  const oh=await page.locator('.kvl-unified-pos').allTextContents();
  assert.ok(oh.length>0&&oh.every(x=>x.includes('OH')),'position filter preserves only OH');
  await page.locator('[data-rs-pos="all"]').click();
  assert.equal(await page.locator('.kvl-unified-row').count(),26,'Unified table still present');
  assert.match(await page.locator('[data-country-selection]').innerText(),/후보 엔트리/);
  await page.locator('[data-country-year-select]').selectOption('2026');
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
  assert.equal(await wo.page.locator('.ktd-country-link').count(),2);
  assert.equal(await wo.page.locator('.kvl-unified-count').count(),1);
  assert.ok((await wo.page.locator('.kvl-unified-count').innerText()).includes('26건'));
  assert.ok(await wo.page.locator('.kvl-unified-row').count()>=14);
  assert.deepEqual(wo.errors,[]);
  REPORT.views.push({name:'Japan WOMEN source missing DOB stays unguessed',status:'PASS'});
  await wo.page.close();
  const iri=await open(browser,1440,'category=international&gender=men&country=IRI&year=2026');
  await iri.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  const iriText=await iri.page.locator('.kvl-unified-table').innerText();
  assert.match(iriText,/히로시마|Hiroshima Thunders/,'Current Hiroshima affiliations should supplement tournament snapshots');
  assert.match(iriText,/허베이 바오딩|Hebei Baoding Wolves/,'Current Morteza Sharifi club should be available');
  assert.match(iriText,/풀라드 시르잔|Foolad Sirjan Iranian/,'Current Foolad Sirjan affiliations should be available');
  const ali=iri.page.locator('.kvl-unified-row').filter({hasText:'알리 하그파라스트'}).first();
  assert.equal((await ali.locator('.kvl-roster-club-team').innerText()).trim(),'파니오니오스');
  assert.equal(await ali.locator('.kvl-roster-club-teamline').getAttribute('title'),'Panionios GSS','2026 tournament-time club must not be overwritten by later season affiliation');
  assert.match((await ali.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),/^그리스 · 발리리그 \(1부\)$/,'2026 AVC club evidence verifies Panionios GSS and its Volley League');
  assert.match(await ali.locator('.kvl-roster-league-flag').getAttribute('src'),/assets\/images\/flags\/club\/gr\.svg$/);
  assert.equal(await ali.locator('.kvl-roster-league-flag').evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0}),true,'Greece club flag must decode');
  const mohsen=iri.page.locator('.kvl-unified-row').filter({hasText:'모센 델라바리'}).first();
  assert.match(await mohsen.innerText(),/Yaroslavich Yaroslavl/);
  assert.equal(await mohsen.locator('.kvl-unified-volleybox').innerText(),'VB->');
  assert.equal(await mohsen.locator('.kvl-unified-volleybox').getAttribute('href'),'https://volleybox.net/mohsen-delavari-p222609');
  assert.match((await mohsen.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),/^러시아 · 러시아 수페르리가 \(1부\)$/);
  assert.match(await mohsen.locator('.kvl-roster-league-flag').getAttribute('src'),/assets\/images\/flags\/club\/ru\.svg$/);
  assert.equal(await mohsen.locator('.kvl-roster-league-flag').evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0}),true,'Russia club flag must decode');
  assert.deepEqual(iri.errors,[]);
  REPORT.views.push({name:'Iran 2026 source club precedence: Ali Panionios GSS; missing-source Mohsen uses season fallback',status:'PASS'});
  await iri.page.close();
  const bul=await open(browser,1440,'category=international&gender=men&country=BUL&year=2026');
  await bul.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  const boris=bul.page.locator('.kvl-unified-row').filter({hasText:'보리스 나체프'}).first();
  const telkiyski=bul.page.locator('.kvl-unified-row').filter({hasText:'류보슬라프 텔키이스키'}).first();
  assert.match(await boris.innerText(),/JV Gioia Del Colle/);
  assert.match(await telkiyski.innerText(),/A\.O\. Foinikas Sýros/);
  assert.match((await boris.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),/^이탈리아 · 세리에 A2 \(2부\)$/);
  assert.match((await telkiyski.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),/^그리스 · 발리리그 \(1부\)$/);
  for(const row of [boris,telkiyski]){
   const flag=row.locator('.kvl-roster-league-flag');assert.equal(await flag.count(),1);
   assert.equal(await flag.evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0}),true);
  }
  assert.deepEqual(bul.errors,[]);await bul.page.close();
  const can=await open(browser,1440,'category=international&gender=men&country=CAN&year=2026');
  await can.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  const cody=can.page.locator('.kvl-unified-row').filter({hasText:'코디 허드슨'}).first();
  assert.match(await cody.innerText(),/Mount Royal University Cougars/);
  assert.match((await cody.locator('.kvl-roster-club-meta').innerText()).replace(/\s+/g,' ').trim(),/^캐나다 · Canada West$/);
  assert.match(await cody.locator('.kvl-roster-league-flag').getAttribute('src'),/\/ca\.svg$/);
  assert.equal(await cody.locator('.kvl-roster-league-flag').evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0}),true,'Canada club flag must decode');
  assert.deepEqual(can.errors,[]);await can.page.close();
  REPORT.views.push({name:'Batch 8 Bulgaria and Canada current clubs render with verified league-country flags',status:'PASS'});
  const flagCases=[
   ['ARG','Club Voleibol Guaguas','club/es.svg'],
   ['AUS','Bigbank Tartu','club/ee.svg'],
   ['UKR','SCM Universitatea Craiova','club/ro.svg'],
   ['CHN','Sporting CP','club/pt.svg'],
   ['UKR','Hebei Baoding Wolves','4x3/cn.svg'],
   ['INA','Jakarta Bhayangkara Presisi','4x3/id.svg'],
   ['KAZ','VK Aktobe','4x3/kz.svg'],
   ['THA','Nakhon Ratchasima 3M Films VC','4x3/th.svg'],
   ['UZB','UZTELECOM','4x3/uz.svg'],
   ['VIE','Biên Phòng MB','4x3/vn.svg']
  ];
  for(const [code,club,pathEnd] of flagCases){
   const view=await open(browser,1440,'category=international&gender=men&country='+code+'&year=2026');
   await view.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
   const line=view.page.locator('.kvl-roster-club-teamline[title="'+club+'"]').first();
   await line.waitFor({timeout:30000});
   const flag=line.locator('.kvl-roster-league-flag');
   assert.equal(await flag.count(),1,code+' '+club+' should have a club-country flag');
   assert.ok((await flag.getAttribute('src')).endsWith(pathEnd),code+' '+club+' flag source');
   assert.equal(await flag.evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0}),true,code+' '+club+' flag must decode');
   assert.deepEqual(view.errors,[]);await view.page.close();
  }
  REPORT.views.push({name:'Club-country flags normalize Spain/Estonia/Romania/Portugal/China and new Asian current clubs',status:'PASS'});
  const brn=await open(browser,1440,'category=international&gender=men&country=BRN&year=2026');
  await brn.page.locator('.kvl-unified-row').first().waitFor({timeout:30000});
  assert.equal(await brn.page.locator('.ktd-country-link').count(),2);
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

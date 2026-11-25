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
   if(html.includes('id="ktdGrid"')&&html.includes('kvl-teams-directory-v1.js')){
    const href=html.match(/href="(assets\/css\/kvl-teams-directory-v1\.css[^"]*)"/)?.[1];
    if(href){
     const cssResponse=await fetch(BASE+'/'+href,{cache:'no-store',signal:AbortSignal.timeout(12000)});
     const css=cssResponse.ok?await cssResponse.text():'';
     if(html.includes('20261120-grid-v1-logo-hide-20261125')&&html.includes('20261124-svlogos-v1')
        &&html.includes('kvl-pro-league-roster-v1.js?v=20261126-flags-v1')
        &&css.includes('Team directory density v1')&&css.includes('kvl-home-hero-pc-v01.webp')&&css.includes('kvl-home-hero-mobile-v01.webp')){
       const [staff,sv]=await Promise.all([
        read('data/team-rosters/v-league/coaches-2026-27.json'),
        read('data/team-rosters/sv-league/index-v1.json')
       ]);
       const season=sv?.seasons?.find(x=>x.season==='2026-27'&&x.gender==='men');
       if(staff?.men?.OKF?.name==='김재헌'&&staff.men.OKF.role==='acting'&&staff.men.OKF.asOf==='2026-11-17'
          &&season?.team_count===12&&season?.player_count===211&&season?.direct_volleybox_count===211&&season?.recheck_count===5)return;
      }
    }
   }
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
async function verifyLiveHero(page,width){
 const meta=await page.evaluate(async()=>{
  const hero=document.querySelector('.ktd-hero');
  const styles=getComputedStyle(hero);
  const match=styles.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
  if(!match)return {decoded:false,asset:'',cssBackground:styles.backgroundImage};
  const image=new Image();image.src=match[1];
  try{await image.decode()}catch{}
  return {
   asset:new URL(image.src).pathname,
   decoded:image.naturalWidth>100&&image.naturalHeight>100,
   backgroundSize:styles.backgroundSize,
   headingColor:getComputedStyle(hero.querySelector('h1')).color,
   minHeight:parseFloat(styles.minHeight),
   viewport:innerWidth,
   scrollWidth:document.documentElement.scrollWidth
  };
 });
 assert.equal(meta.asset,'/assets/img/home-hero/'+(width<=680?'kvl-home-hero-mobile-v01.webp':'kvl-home-hero-pc-v01.webp'),
  'Live Team Finder must match Home image for current viewport: '+JSON.stringify(meta));
 assert.ok(meta.decoded,'Live Home HERO image must load and decode: '+JSON.stringify(meta));
 assert.equal(meta.backgroundSize,'cover');
 assert.equal(meta.headingColor,'rgb(255, 255, 255)');
 assert.ok(meta.scrollWidth<=meta.viewport+2);
 return meta;
}
async function verifyLiveGrid(page,width){
 const spec=await page.evaluate(()=>{
  const grid=document.getElementById('ktdGrid'),cards=[...grid.querySelectorAll(':scope > .ktd-card')];
  const cols=getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  return {cols,count:cards.length,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   cards:cards.slice(0,4).map(c=>({
    top:c.getBoundingClientRect().top,width:c.getBoundingClientRect().width,
    bodyDisplay:getComputedStyle(c.querySelector('.ktd-card-body')).display,
    flexDirection:getComputedStyle(c.querySelector('.ktd-card-body')).flexDirection,
    logoWidth:c.querySelector('.ktd-card-logo').getBoundingClientRect().width,
    actionHeight:c.querySelector('.ktd-card-action').getBoundingClientRect().height
   }))};
 });
 const expected=width>=1280?3:2;
 assert.equal(spec.cols,expected,'Actual operating Team Finder must respect its responsive grid: '+JSON.stringify(spec));
 assert.ok(spec.cards.slice(0,expected).every(x=>Math.abs(x.top-spec.cards[0].top)<2));
 assert.ok(spec.cards[expected].top>spec.cards[0].top+20);
 assert.ok(spec.cards.every(x=>x.actionHeight>=43&&x.width>140));
 if(width<=660)assert.ok(spec.cards.every(x=>x.bodyDisplay==='flex'&&x.flexDirection==='column'&&x.logoWidth>=x.width*.77),'Mobile card logo must be stacked above team name');
 else assert.ok(spec.cards.every(x=>x.bodyDisplay==='grid'),'Desktop team cards retain the horizontal format');
 assert.ok(spec.scrollWidth<=spec.viewport+2);
 return spec;
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
  const grid=await verifyLiveGrid(page,width);
  result.notes.push('Live '+width+'px Team Finder grid '+grid.cols+' columns ('+(width<=660?'vertical mobile cards':'horizontal desktop cards')+')');
  const hero=await verifyLiveHero(page,width);
  result.notes.push('Live '+width+'px Team Finder HERO reuses Home '+(width<=680?'mobile':'PC')+' image: '+hero.asset);
  assert.equal(await page.locator('.ktd-card').count(),7);
  const summary=await page.locator('#ktdSummary').innerText();
  assert.ok(summary.includes(count+'명'),'Published total must match current KOVO official roster JSON: '+summary);
  const css=await page.locator('.ktd-card').first().locator('.ktd-card-body').evaluate(el=>{
   const a=el.getBoundingClientRect(),b=el.querySelector('.ktd-card-logo').getBoundingClientRect();
   return {fraction:b.width/a.width,width:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  if(width<=660){
   assert.ok(css.fraction>=.77&&css.fraction<=1,
    'Mobile vertical card image area should be full-width, not the old 31% horizontal slot: '+JSON.stringify(css));
  }else{
   assert.ok(css.fraction>=.28&&css.fraction<=.34,
    'PC horizontal cards retain their 31% logo column: '+JSON.stringify(css));
  }
  assert.ok(css.width<=css.viewport+2,'Mobile layout overflow');
  if(gender==='men'){
   const acting=page.locator('.ktd-card[data-team-code="OKF"]');
   assert.match(await acting.innerText(),/감독대행\s*:\s*김재헌/,'Actual site must show official OKF acting coach');
   assert.doesNotMatch(await acting.innerText(),/신영철/,'Former head coach must not be shown as current');
  }
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
async function verifySVLeague(browser,width){
 const index=await read('data/team-rosters/sv-league/index-v1.json');
 const season=index.seasons.find(x=>x.season==='2026-27'&&x.gender==='men');
 assert.ok(season,'SV.LEAGUE 2026-27 men season snapshot missing');
 assert.equal(season.team_count,12);assert.equal(season.player_count,211);
 assert.equal(season.direct_volleybox_count,211);assert.equal(season.recheck_count,5);
 const page=await pageFor(browser,width,width<=660?844:920);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const url=BASE+'/teams.html?category=pro&gender=men&league=sv&season=2026-27&release='+encodeURIComponent(sha);
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(response?.ok(),'SV.LEAGUE Team Finder must be published');
  await page.locator('.ktd-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('[data-ktd-pro-league="sv"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#ktdProSeasonSelect').inputValue(),'2026-27');
  assert.equal(await page.locator('.ktd-card').count(),12);
  assert.match(await page.locator('#ktdSummary').innerText(),/12개 구단 · 등록 선수 211명/);
  assert.equal(await page.locator('img.ktd-team-logo-image').count(),12,'All 12 live SV.LEAGUE cards must use verified team logos');
  const logoState=await page.locator('img.ktd-team-logo-image').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{
   img.loading='eager';try{await img.decode()}catch{}
   return {src:img.src,loaded:img.naturalWidth>0&&img.naturalHeight>0,hidden:img.hidden,fallbackHidden:img.nextElementSibling?.matches('.ktd-team-logo-fallback[hidden]')&&getComputedStyle(img.nextElementSibling).display==='none'};
  })));
  assert.ok(logoState.every(x=>x.loaded&&!x.hidden&&x.fallbackHidden),'Every live SV.LEAGUE logo must decode: '+JSON.stringify(logoState.filter(x=>!x.loaded||x.hidden||!x.fallbackHidden)));
  const grid=await verifyLiveGrid(page,width);
  const jtekt=page.locator('.ktd-card[data-team-code="JTEKT"]').first();
  await jtekt.locator('[data-ktd-roster]').click();
  await page.locator('[data-kvl-pro-league-roster]').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvl-lr-team-logo img').count(),1,'Selected SV.LEAGUE team logo must appear above the roster');
  assert.equal(await page.locator('.kvl-lr-team-logo img').evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0&&img.naturalHeight>0}),true);
  assert.equal(await page.locator('.kvl-lr-row').count(),16);
  const defalco=page.locator('.kvl-lr-row').filter({hasText:'토리 디팔코'}).first();
  assert.equal(await page.locator('.kvl-lr-name-button').count(),16);
  assert.ok((await page.locator('.kvl-lr-name-button').allTextContents()).every(x=>/[가-힣]/.test(x)));
  assert.doesNotMatch(await defalco.innerText(),/Torey Defalco/i);
  const flagState=await page.locator('.kvl-lr-row .kvl-lr-flag-image').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0&&img.naturalHeight>0})));
  assert.equal(flagState.length,16);assert.ok(flagState.every(Boolean));
  assert.match(await defalco.locator('.kvl-lr-flag-image').getAttribute('src'),/\/us\.svg$/);
  await defalco.locator('.kvl-lr-name-button').click();
  assert.equal(await page.locator('[data-kvl-lr-detail] .kvl-lr-flag-image').evaluate(async img=>{try{await img.decode()}catch{}return img.naturalWidth>0}),true);
  assert.match(await page.locator('[data-kvl-lr-detail]').innerText(),/Torey Defalco/i);
  await page.locator('[data-kvl-lr-close]').click();
  assert.equal(await page.locator('[data-kvl-lr-detail]').isVisible(),false);
  assert.match((await defalco.innerText()).replace(/\s+/g,' '),/미국/);
  assert.equal(await defalco.locator('.kvl-lr-vb a').getAttribute('href'),'https://volleybox.net/torey-defalco-p2330');
  await page.locator('[data-kvl-lr-nat="foreign"]').click();
  assert.equal(await page.locator('.kvl-lr-row').count(),3);
  await page.locator('[data-kvl-lr-pos="OH"]').click();
  assert.equal(await page.locator('.kvl-lr-row').count(),1);
  assert.match(await page.locator('.kvl-lr-row').innerText(),/토리 디팔코/);
  await page.locator('#ktdCloseRoster').click();
  const tokyo=page.locator('.ktd-card[data-team-code="TOKYO"]').first();
  await tokyo.locator('[data-ktd-roster]').click();
  await page.locator('[data-kvl-pro-league-roster]').waitFor({timeout:30000});
  assert.equal(await page.locator('.kvl-lr-row').count(),20);
  assert.equal(await page.locator('.kvl-lr-recheck').count(),4);
  assert.deepEqual(errors,[],'SV.LEAGUE live runtime JS errors');
  const snap=path.join(OUT,'kvl-teams-live-svleague-'+width+'.png');
  await page.screenshot({path:snap,fullPage:true});
  result.views.push({type:'svleague',width,teamCount:12,playerCount:211,jtekt:16,tokyo:20,recheck:4,
   columns:grid.cols,status:'PASS',screenshot:path.basename(snap)});
 }finally{await page.close()}
}
async function verifyVLeagueTodayFirst(browser,gender,width){
 const page=await pageFor(browser,width,width<=660?844:900);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  const url=BASE+'/competition-engine.html?competition=v-league-'+gender+'-2026-27&view=overview&release='+encodeURIComponent(sha);
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(response?.ok(),'V-League overview must be published for '+gender);
  await page.locator('.dv2-overview-matches .dv2-division-matches').first().waitFor({timeout:45000});
  await page.waitForFunction(()=>{
   const all=[...document.querySelectorAll('.dv2-division-matches .dv2-summary-body')];
   return all.length===2&&all.every(x=>x.getAttribute('aria-busy')==='false');
  },null,{timeout:45000});
  const metrics=await page.evaluate(()=>{
   const section=document.querySelector('.dv2-overview-matches'),h=section?.querySelector('#dv2-overview-matches-title');
   const cards=[...section.querySelectorAll('[data-summary-gender]')];
   return {heading:h?.textContent,counts:cards.length,divisions:cards.map(c=>({
    gender:c.dataset.summaryGender,
    order:[...c.querySelectorAll('.dv2-summary-slot')].map(x=>x.dataset.kind),
    hasLoading:c.querySelector('.dv2-summary-loading')!==null
   })),viewport:innerWidth,width:document.documentElement.scrollWidth};
  });
  assert.equal(metrics.heading,'오늘/다음 경기 · 최근 결과');
  assert.equal(metrics.counts,2,'Men and women summary columns must both render');
  for(const card of metrics.divisions){
   assert.deepEqual(card.order,['next','recent'],'Actual '+card.gender+' overview must put today/next before recent');
   assert.equal(card.hasLoading,false,'Do not report success before the latest records render');
  }
  assert.ok(metrics.width<=metrics.viewport+2);
  assert.deepEqual(errors,[],'V-League overview runtime errors');
  const file=path.join(OUT,'kvl-teams-live-vleague-summary-'+gender+'-'+width+'.png');
  await page.screenshot({path:file,fullPage:true});
  result.views.push({type:'vleague-summary',gender,width,order:metrics.divisions,status:'PASS',screenshot:path.basename(file)});
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
   await verifySVLeague(browser,1440);
   await verifySVLeague(browser,390);
   // Verify both operational V-League division pages, without altering KOVO live data or the member gate.
   await verifyVLeagueTodayFirst(browser,'men',1440);
   await verifyVLeagueTodayFirst(browser,'women',390);
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

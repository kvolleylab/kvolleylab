'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.RUNNER_TEMP||'/tmp';
const BASE='https://kvolleylab.com';
const mime={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const record={status:'RUNNING',views:[],sha:process.env.GITHUB_SHA||'local',errors:[]};
const out=path.join(OUT,'kvl-age-history-browser-report.json');
function write(){fs.writeFileSync(out,JSON.stringify(record,null,2))}
async function serve(page,requests){
 await page.route('https://kvolleylab.com/**',route=>{
  requests.push(route.request().url());
  const url=new URL(route.request().url());
  const file=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(ROOT+path.sep))return route.fulfill({status:403,body:''});
  if(/\/assets\/js\/(?:member-access-gate-v1|member-session-v1)\.mjs$/.test(file))
   return route.fulfill({status:200,body:'// local UI test: do not contact auth server',contentType:'application/javascript'});
  try{return route.fulfill({status:200,body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'})}
  catch{return route.fulfill({status:404,body:''})}
 });
}
async function run(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const {width,height} of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   await serve(page,requests);
   try{
    const response=await page.goto(BASE+'/national-team-history.html?scope=age',{waitUntil:'domcontentloaded',timeout:30000});
    assert(response&&response.ok(),'History page must load');
    try{await page.locator('.event-card').first().waitFor({timeout:12000});}
    catch(error){
      const diagnostic=await page.evaluate(()=>({url:location.href,ready:document.readyState,body:document.body.className,eventList:document.querySelector('#eventList')?.textContent?.slice(0,550),scripts:[...document.scripts].map(x=>x.src).filter(Boolean)}));
      throw Error('Events did not render: '+JSON.stringify(diagnostic)+' | PAGE ERRORS='+JSON.stringify(errors)+' | REQUESTS='+JSON.stringify(requests.slice(0,35))+' | CAUSE='+error.message);
    }
    assert(await page.locator('.event-card').count()>=20,'Historical age events must display');
    assert.equal((await page.locator('h1').innerText()).trim(),'대한민국 연령별 대표팀','Approved HERO title must not be split by gender');
    assert(await page.locator('#ageGenderSwitch').isVisible(),'Gender switch hidden');
    // Compare computed presentation against the actual KVL national-team home,
    // rather than guessing from a mockup or reusing its full unrelated CSS.
    const reference=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await serve(reference,[]);
    try{
      await reference.goto(BASE+'/national-team.html',{waitUntil:'domcontentloaded',timeout:30000});
      await reference.locator('.gender-switch button').first().waitFor({state:'attached',timeout:10000});
      const referenceStyle=async gender=>{
        await reference.evaluate(gender=>{
          document.querySelector('.nt-page').dataset.gender=gender;
          document.querySelectorAll('.gender-switch button').forEach(b=>
            b.setAttribute('aria-pressed',String(b.dataset.gender===gender)));
        },gender);
        return reference.evaluate(gender=>{
          const switcher=document.querySelector('.gender-switch');
          const b=switcher.querySelector('button[data-gender="'+gender+'"]');
          const st=getComputedStyle(b),wrap=getComputedStyle(switcher);
          return {background:st.backgroundColor,color:st.color,minHeight:st.minHeight,
            fontSize:st.fontSize,fontWeight:st.fontWeight,borderRadius:st.borderRadius,
            paddingLeft:st.paddingLeft,paddingRight:st.paddingRight,
            switchBackground:wrap.backgroundColor};
        },gender);
      };
      const actualStyle=gender=>page.evaluate(gender=>{
        const switcher=document.querySelector('#ageGenderSwitch');
        const b=switcher.querySelector('button[data-age-gender="'+gender+'"]');
        const st=getComputedStyle(b),wrap=getComputedStyle(switcher);
        const label=getComputedStyle(b,'::before').content;
        return {background:st.backgroundColor,color:st.color,minHeight:st.minHeight,
          fontSize:st.fontSize,fontWeight:st.fontWeight,borderRadius:st.borderRadius,
          paddingLeft:st.paddingLeft,paddingRight:st.paddingRight,
          switchBackground:wrap.backgroundColor,pseudo:label,
          activeLevel:getComputedStyle(document.querySelector('#ageLevelTabs [aria-pressed="true"]')).backgroundColor,
          kpiColor:getComputedStyle(document.querySelector('.summary-card strong')).color,
          genderOnBody:document.body.dataset.gender};
      },gender);
      const menReference=await referenceStyle('men');
      const ageMen=await actualStyle('men');
      const {pseudo:menPseudo,activeLevel:menLevel,kpiColor:menKpi,genderOnBody:menBody,...menAppearance}=ageMen;
      assert.deepEqual(menAppearance,menReference,'Men switch must match national home on '+width);
      assert.equal(menBody,'men');
      assert.equal(menLevel,menReference.background);
      assert.equal(menKpi,menReference.background);
      assert(!menPseudo.includes('♂'),'Gender switch must not add extra glyph');
      // Save the reference style to compare after switching later in the test.
      page.__kvlRefStyles={men:menReference,women:await referenceStyle('women')};
      page.__kvlActualStyle=actualStyle;
    }finally{await reference.close();}

    const hero=page.locator('#ageHero');
    assert(await hero.isVisible(),'Approved HERO must be present');
    const heroMetrics=await page.evaluate(async()=>{
      const el=document.querySelector('#ageHero'),img=el.querySelector('img');
      await img.decode();
      const rect=el.getBoundingClientRect();
      return {width:rect.width,height:rect.height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
        currentSrc:img.currentSrc,objectFit:getComputedStyle(img).objectFit};
    });
    assert(heroMetrics.naturalWidth>0&&heroMetrics.naturalHeight>0,'HERO must decode in real browser');
    if(width>=701){
      assert(Math.abs(heroMetrics.width/heroMetrics.height-1197/304)<.05,
        'Desktop approved reference should not crop top/bottom: '+JSON.stringify(heroMetrics));
      assert(heroMetrics.currentSrc.includes('age-hero-approved-pc-v1.svg'));
    }else{
      assert(heroMetrics.currentSrc.includes('age-hero-approved-mobile-v1.svg'));
      assert(heroMetrics.height>=225&&heroMetrics.height<=250,'Mobile hero must preserve readable copy');
      assert(await page.locator('.kvl-age-hero-live-copy h1').isVisible());
    }
    assert(await page.locator('.kvl-age-hero-action').isVisible(),'Visual roadmap CTA is a real link');
    const menu=page.locator('.kvl-global-sidebar');
    await menu.waitFor({timeout:20000});
    const links=await menu.locator('a.kvl-global-sub-link').allTextContents();
    assert(links.some(t=>t.includes('연령별 대표팀')));
    assert(!links.some(t=>t.trim()==='성인 대표팀'));
    const detail=page.locator('.event-card .nt-age-roster-details').first();
    await detail.locator('summary').click();
    assert(await detail.getAttribute('open')!==null,'Details must expand');
    assert(await detail.locator('tbody tr').count()>=10,'First verified roster must show players');
    assert(await detail.locator('tbody tr a[href^="player.html?id="]').count()>=1,'Existing player links must remain');
    const measurements=await page.evaluate(()=>({
     viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
     rosterWidth:document.querySelector('.nt-age-roster-details')?.getBoundingClientRect().width,
     tableWidth:document.querySelector('.nt-age-roster-details table')?.getBoundingClientRect().width,
     headerRowWidth:document.querySelector('.nt-age-roster-details thead tr')?.getBoundingClientRect().width,
     mobileRowDisplay:getComputedStyle(document.querySelector('.nt-age-roster-details tbody tr')).display
    }));
    assert(measurements.documentWidth<=width+2,'Horizontal viewport overflow '+width+': '+JSON.stringify(measurements));
    if(width>=700)assert(measurements.tableWidth>=measurements.rosterWidth-6,'Desktop table must use the whole detail panel: '+JSON.stringify(measurements));
    if(width>=700)assert(measurements.headerRowWidth>=measurements.rosterWidth-8,'Desktop header cells must fill the panel: '+JSON.stringify(measurements));
    if(width<700)assert.equal(measurements.mobileRowDisplay,'grid','Mobile roster must stack into cards');
    // Capture the actual HERO as users first see it, rather than after the roster expands and scrolls.
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(100);
    const png=path.join(OUT,'kvl-national-age-'+width+'.png');
    await page.screenshot({path:png,fullPage:false});
    await page.locator('.kvl-age-hero-action').click();
    assert.equal(new URL(page.url()).hash,'#ageLevelTabs','Roadmap button must take the user to functional age filters');
    await page.locator('#ageLevelTabs button[data-level="U23"]').click();
    assert(await page.locator('.event-card').count()>=1,'U23 filter must show real event');
    await page.locator('[data-age-gender="women"]').click();
    assert.equal(await page.locator('#ageLevelTabs [data-level="all"]').getAttribute('aria-pressed'),'true',
      'Switching division must reset age filter just like national home');
    if(width<700)assert((await page.locator('#ageLevelTabs').evaluate(el=>el.scrollLeft))<=1,
      'Reset age filter must return mobile horizontal scroller to the first chip');
    assert(!new URL(page.url()).searchParams.has('level'),'Stale age filter must leave the URL');
    assert.equal(await page.locator('.event-card').count(),0,'Missing women records must never show male athletes');
    assert(await page.locator('#ageGenderNotice').isVisible());
    // The existing age-chip component animates background colors for 160 ms.
    // Compare settled colors to the reference, not a frame mid-transition.
    await page.waitForTimeout(250);
    const womenAppearance=await page.__kvlActualStyle('women');
    const {pseudo:womenPseudo,activeLevel:womenLevel,kpiColor:womenKpi,genderOnBody:womenBody,...womenButton}=womenAppearance;
    assert.deepEqual(womenButton,page.__kvlRefStyles.women,'Women switch must match home rose style on '+width);
    assert.equal(womenBody,'women','Gender must update the page theme');
    assert.equal(womenLevel,page.__kvlRefStyles.women.background,'Age filter must inherit rose');
    assert.equal(womenKpi,page.__kvlRefStyles.women.background,'KPI accent must inherit rose');
    assert.notEqual(page.__kvlRefStyles.men.background,page.__kvlRefStyles.women.background,'Blue and rose must not match');
    assert(!womenPseudo.includes('♀'),'Gender switch must not add extra glyph');
    const womenNotice=await page.locator('#ageGenderNotice').evaluate(el=>{
      const style=getComputedStyle(el);
      return {border:style.borderLeftColor,background:style.backgroundColor};
    });
    assert.equal(womenNotice.border,page.__kvlRefStyles.women.background,'Women notice uses rose border');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(80);
    await page.screenshot({path:path.join(OUT,'kvl-national-age-women-'+width+'.png'),fullPage:false});

    await page.locator('[data-age-gender="men"]').click();
    assert(await page.locator('.event-card').count()>=1);
    assert.equal((await page.__kvlActualStyle('men')).genderOnBody,'men','Returning to men must restore navy theme');
    assert.deepEqual(errors,[],'Browser JavaScript exceptions: '+errors.join(' / '));
    record.views.push({viewport:width+'x'+height,events:'>=20',status:'PASS',metrics:measurements,hero:heroMetrics,screenshot:path.basename(png)});
   }finally{await page.close()}
  }
  record.status='PASS';write();console.log(JSON.stringify(record,null,2));
 }catch(err){record.status='FAIL';record.errors.push(String(err.stack||err));write();console.error(record.errors.join('\n'));process.exitCode=1}
 finally{await browser.close()}
}
run();

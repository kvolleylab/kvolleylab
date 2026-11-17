'use strict';
/* Release smoke: hits the actual GitHub Pages custom domain, never a routed local fixture. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const BASE='https://kvolleylab.com';
const OUT=process.env.RUNNER_TEMP||'/tmp';
const VERSION=process.env.GITHUB_SHA||'release';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const record={status:'RUNNING',sha:VERSION,origin:BASE,views:[],scopes:[],warnings:[]};
const reportFile=path.join(OUT,'kvl-vleague-roster-v2-live-report.json');
function save(){fs.writeFileSync(reportFile,JSON.stringify(record,null,2))}
async function deployed(){
 let last='';
 for(let attempt=1;attempt<=12;attempt++){
  try{
   const response=await fetch(BASE+'/assets/js/kvl-vleague-roster-v2.js?qa='+encodeURIComponent(VERSION)+'-'+attempt,{cache:'no-store',signal:AbortSignal.timeout(12000)});
   const body=response.ok?await response.text():'';
   if(response.ok&&body.includes('kvlrv2-name-link')&&body.includes('data-vleague-roster-v2'))return;
   last='script HTTP '+response.status+' or release marker absent';
  }catch(e){last=e.message}
  if(attempt<12)await pause(10000);
 }
 throw Error('Updated Pages JS never became public: '+last);
}
async function main(){
 try{
  await deployed();
  const browser=await chromium.launch({headless:true});
  try{
   for(const {gender,team,width,height,name,schoolA,schoolB,linked} of [
    {gender:'men',team:'OKF',width:1440,height:900,name:'윤경',schoolA:'남성고',schoolB:'인하대',linked:true},
    {gender:'men',team:'OKF',width:390,height:844,name:'윤경',schoolA:'남성고',schoolB:'인하대',linked:true},
    {gender:'women',team:'RSP',width:1440,height:900,name:'김아중',schoolA:'청수고',schoolB:null,linked:false},
    {gender:'women',team:'RSP',width:390,height:844,name:'김아중',schoolA:'청수고',schoolB:null,linked:false}
   ]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    const url=BASE+'/competition-engine.html?competition=v-league-'+gender+'-2026-27&view=rosters&team='+team+'&qa='+encodeURIComponent(VERSION);
    try{
     const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
     assert.ok(response?.ok(),'competition page HTTP '+response?.status());
     await page.locator('.kvlrv2').waitFor({timeout:30000});
     const count=await page.locator('.kvlrv2-row').count();
     assert.ok(count>=13,'actual current roster not populated: '+team);
     const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
     assert.ok(metrics.scrollWidth<=metrics.width+2,'horizontal overflow '+gender+' '+width);
     const row=page.locator('.kvlrv2-row').filter({hasText:name}).first();
     await row.click();
     const detail=await page.locator('.kvlrv2-detail').innerText();
     assert.ok(detail.includes(schoolA),name+' official high school missing');
     if(schoolB)assert.ok(detail.includes(schoolB),name+' official university missing');
     else assert.equal(await page.locator('.kvlrv2-school-grid>div').count(),1);
     const nameLink=row.locator('a.kvlrv2-name-link');
     assert.equal(await nameLink.count(),linked?1:0,'incorrect direct name link for '+name);
     if(linked){
      assert.match(await nameLink.getAttribute('href'),/id=KVL-P-000008/);
      await nameLink.click();
      await page.locator('.pd-title').waitFor({timeout:30000});
      assert.equal((await page.locator('.pd-title').innerText()).trim(),name);
      const profileBody=await page.locator('#playerArea').innerText();
      assert.ok(profileBody.includes(schoolA)&&profileBody.includes(schoolB));
      assert.ok(profileBody.includes('OK저축은행'),'registered professional club missing');
     }
     assert.deepEqual(pageErrors,[],'live JavaScript exceptions');
     const screenshot=path.join(OUT,'kvl-vleague-roster-live-'+gender+'-'+width+'.png');
     if(linked){await page.goBack({waitUntil:'domcontentloaded',timeout:30000});await page.locator('.kvlrv2').waitFor({timeout:30000})}
     await page.screenshot({path:screenshot,fullPage:true});
     record.views.push({gender,team,viewport:width+'x'+height,name,rosterCount:count,linked,overflow:metrics.scrollWidth-metrics.width,status:'PASS',screenshot:path.basename(screenshot)});
    }finally{await page.close()}
   }
   for(const [scope,name] of [['pro','김규민'],['national','임시형']]){
    const page=await browser.newPage({viewport:{width:1280,height:820}});
    try{
     await page.goto(BASE+'/player.html?id=KVL-P-001620&scope='+scope,{waitUntil:'domcontentloaded',timeout:30000});
     await page.locator('.pd-title').waitFor({timeout:30000});
     assert.equal((await page.locator('.pd-title').innerText()).trim(),name);
     record.scopes.push({id:'KVL-P-001620',scope,name,status:'PASS'});
    }finally{await page.close()}
   }
  }finally{await browser.close()}
  record.status='PASS';save();console.log(JSON.stringify(record,null,2));
 }catch(error){record.status='FAIL';record.error=String(error.stack||error);save();console.error(record.error);process.exitCode=1}
}
main();
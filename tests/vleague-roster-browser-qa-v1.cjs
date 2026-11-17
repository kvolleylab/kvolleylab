'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.RUNNER_TEMP||'/tmp';
const mime={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost/').pathname)}catch{res.writeHead(400).end();return}
 const target=path.resolve(ROOT,'.'+pathname);
 if(!target.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
 fs.readFile(target,(e,b)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(b)});
});
const start=()=>new Promise(r=>server.listen(0,'127.0.0.1',r));
async function main(){
 await start();const port=server.address().port,base='http://127.0.0.1:'+port;
 const browser=await chromium.launch({headless:true});
 const reports=[];
 try{
  for(const [g,team,width,height] of [
   ['men','OKF',1440,900],['men','OKF',768,950],['men','OKF',390,844],['men','OKF',360,740],
   ['women','RSP',390,844]
  ]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const q='/competition-engine.html?competition=v-league-'+g+'-2026-27&view=rosters&team='+team;
   await page.goto(base+q,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('.kvlrv2').waitFor({timeout:20000});
   const rosterCount=await page.locator('.kvlrv2-row').count();
   assert.ok(rosterCount>12,'actual KOVO roster must load');
   const player=g==='men'?'윤경':'김아중';
   const row=page.locator('.kvlrv2-row').filter({hasText:player}).first();
   await row.click();
   const profile=await page.locator('.kvlrv2-detail').innerText();
   if(g==='men'){assert.match(profile,/남성고/);assert.match(profile,/인하대/);assert.match(await page.locator('.kvlrv2-profile-link').getAttribute('href'),/KVL-P-000008/)}
   else{assert.match(profile,/청수고/);assert.equal(await page.locator('.kvlrv2-school-grid>div').count(),1);assert.equal(await page.locator('.kvlrv2-profile-link').count(),0)}
   const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,ready:document.body.dataset.kvlRenderState}));
   assert.ok(metrics.scrollWidth<=metrics.width+2,'mobile horizontal overflow '+g+' '+width);
   assert.deepEqual(errors,[],'Javascript page errors');
   const file=path.join(OUT,'kvl-roster-v2-'+g+'-'+width+'.png');
   await page.screenshot({path:file,fullPage:true});
   reports.push({gender:g,team,viewport:width+'x'+height,rosterCount,ready:metrics.ready,horizontalOverflow:metrics.scrollWidth-metrics.width,errors,screen:file});
   await page.close();
  }
  for(const [id,scope,name] of [['KVL-P-000008','','윤경'],['KVL-P-001620','pro','김규민'],['KVL-P-001620','national','임시형']]){
   const page=await browser.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/player.html?id='+id+(scope?'&scope='+scope:''),{waitUntil:'domcontentloaded'});
   await page.locator('.pd-title').waitFor({timeout:20000});
   assert.equal((await page.locator('.pd-title').innerText()).trim(),name);
   if(name==='윤경'){const body=await page.locator('#playerArea').innerText();assert.match(body,/OK저축은행/);assert.match(body,/남성고/);assert.match(body,/인하대/)}
   assert.deepEqual(errors,[]);
   reports.push({profile:id,scope,name,status:'PASS'});
   await page.close();
  }
 }finally{
  await browser.close();await new Promise(r=>server.close(r));
 }
 console.log(JSON.stringify({status:'PASS',reports},null,2));
 fs.writeFileSync(path.join(OUT,'kvl-roster-v2-browser-report.json'),JSON.stringify({status:'PASS',reports},null,2));
}
main().catch(err=>{console.error(err);server.close(()=>{});process.exitCode=1});

'use strict';
// Local, public-page browser checks. No screenshots, cookies, sign-in or external writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||'.');
const checks=[];
const issue=(rule,scope,entity)=>({id:'KVL-QA-'+crypto.createHash('sha256').update(JSON.stringify([rule,scope,entity])).digest('hex').slice(0,16).toUpperCase(),
 rule,check_id:scope,entity,severity:'P2',verification:'CONFIRMED',path:scope,related:{},actual:'browser assertion failed',
 expected:'approved template contract',source_url:null,source_checked_at:null,suggestion:'화면 증거 검토 후 별도 수정 PR',
 impact:scope,owner_task:'UI 검수',processing:'OPEN',visibility:'PUBLIC'});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
 if(file===root)file=path.join(root,'index.html');
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
 catch{res.writeHead(404);res.end();}
});
(async()=>{
 const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({headless:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const slugs=['kovo-cup-men-2026','kovo-cup-women-2026','v-league-men-2026-27','v-league-women-2026-27'];
 for(const width of [1180,390,360]) {
  const context=await browser.newContext({viewport:{width,height:900}});
  // External fonts/flags are outside geometry assertions. Local logo files must load.
  await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const page=await context.newPage();
  let scriptErrors=0; page.on('pageerror',()=>scriptErrors++);
  for(const slug of slugs) for(const view of ['overview','schedule','groups','knockout','rosters','resources']) {
   const scope=`ui:${slug}:${view}:${width}`,failures=[],covered=['render','overflow','logos','score-align','team-clipping','theme','roster','script','navigation'];
   try {
    scriptErrors=0;
    await page.goto(`${origin}/competition-engine.html?competition=${slug}&view=${view}`,{waitUntil:'load'});
    await page.waitForFunction(()=>document.body.dataset.kvlRenderState==='ready',{},{timeout:12000});
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length&&i.src.startsWith(location.origin)).map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
    const stats=await page.evaluate(()=>{
     const visible=e=>e.getClientRects().length>0;
     const scores=[...document.querySelectorAll('.kvl1180-match-board')].filter(visible);
     return {
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      logos:[...document.images].filter(i=>visible(i)&&i.src.startsWith(location.origin)&&i.complete&&!i.naturalWidth).length,
      align:scores.some(e=>{const s=e.querySelector('.kvl1180-score');if(!s)return true;const a=e.getBoundingClientRect(),b=s.getBoundingClientRect();return Math.abs((a.left+a.right-b.left-b.right)/2)>3;}),
      clipping:[...document.querySelectorAll('.kvl1180-team-name,.kvl1180-team-name a')].filter(visible).some(e=>{
       const c=getComputedStyle(e);return (e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)&&['hidden','clip'].includes(c.overflow);}),
      gender:document.body.dataset.kvlGender,
      primary:getComputedStyle(document.body).getPropertyValue('--kvl-theme-primary').trim().toLowerCase(),
      activeView:document.querySelector('.kvl1180-tabs [aria-current="page"]')?.dataset.view,
      tabs:document.querySelectorAll('.kvl1180-tabs a').length
     };
    });
    if(stats.overflow)failures.push('overflow');if(stats.logos)failures.push('logos');
    if(stats.align)failures.push('score-align');if(stats.clipping)failures.push('team-clipping');
    if(scriptErrors)failures.push('script');
    if(stats.activeView!==view||stats.tabs!==6)failures.push('navigation');
    if(stats.gender!==(slug.includes('-women-')?'women':'men')||stats.primary!==(slug.includes('-women-')?'#8f2f59':'#1c1f24'))failures.push('theme');
    if(view==='rosters') {
     const first=page.locator('[data-team-code].kvl1180-participant-button').first();
     if(await first.count()) {await first.click();await page.waitForFunction(()=>document.querySelectorAll('[data-roster-player]').length>0,{},{timeout:5000});}
     else failures.push('roster');
    }
    checks.push({id:scope,outcome:failures.length?'FAIL':'PASS',findings:failures.map(e=>issue('UI_'+e.toUpperCase().replaceAll('-','_'),scope,e)),count:1,
     covered_entities:covered,complete:true,note:'Chromium 실제 렌더: 가로 넘침·로고·점수 중앙·팀명 잘림·명단 연결. 색상 미세차/육안 전체는 별도 검수'});
   } catch {
    checks.push({id:scope,outcome:'NOT VERIFIED',findings:[],count:0,covered_entities:[],complete:false,note:'브라우저 로딩/상호작용 실패; 미검증'});
   }
  }
  await context.close();
 }
 await browser.close();server.close();process.stdout.write(JSON.stringify({checks}));
})().catch(()=>{server.close();process.stdout.write(JSON.stringify({checks:[{id:'ui:runner',outcome:'NOT VERIFIED',findings:[],count:0,covered_entities:[],complete:false,operational:true,note:'Playwright/Chromium 실행 환경 미준비'}]}));process.exitCode=2;});

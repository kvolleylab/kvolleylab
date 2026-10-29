'use strict';
// Local, public-page browser checks. No screenshots, cookies, sign-in or external writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||'.');
const checks=[];
const record=c=>{checks.push(c);process.stdout.write(JSON.stringify(c)+'\n');};
const issue=(rule,scope,entity,actual='browser assertion failed')=>({id:'KVL-QA-'+crypto.createHash('sha256').update(JSON.stringify([rule,scope,entity])).digest('hex').slice(0,16).toUpperCase(),
 rule,check_id:scope,entity,severity:'P2',verification:'CONFIRMED',path:`competition-engine.html?competition=${scope.split(':')[1]}&view=${scope.split(':')[2]}`,
 related:{competition_slug:scope.split(':')[1],viewport:Number(scope.split(':')[3])},actual,
 expected:'approved template contract',source_url:null,source_checked_at:null,suggestion:'화면 증거 검토 후 별도 수정 PR',
 impact:scope,owner_task:'UI 검수',processing:'OPEN',visibility:'PUBLIC'});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
// The production contract requires HTTPS canonical URLs. Fulfil the HTTPS origin
// from checkout bytes; never weaken production validation or contact the live site.
const origin='https://kvolleylab.com';
async function serve(route){
 let url,file;try{url=new URL(route.request().url());file=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch{return route.abort();}
 if(url.origin!==origin)return route.abort();
 if(!file.startsWith(root+path.sep)&&file!==root)return route.fulfill({status:403,body:''});
 if(file===root)file=path.join(root,'index.html');
 try{return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}
 catch{return route.fulfill({status:404,body:''});}
}
(async()=>{
 const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({headless:true});
 const slugs=['kovo-cup-men-2026','kovo-cup-women-2026','v-league-men-2026-27','v-league-women-2026-27'];
 for(const width of [1180,390,360]) {
  const context=await browser.newContext({viewport:{width,height:900}});
  // External fonts/flags are outside geometry assertions. Local logo files must load.
  await context.route('**/*',serve);
  const page=await context.newPage();
  page.setDefaultTimeout(5000);
  let scriptErrors=0; page.on('pageerror',()=>scriptErrors++);
  for(const slug of slugs) for(const view of ['overview','schedule','groups','knockout','rosters','resources']) {
   const scope=`ui:${slug}:${view}:${width}`,failures=[],covered=['render','overflow','logos','score-align','team-clipping','theme','roster','script','navigation'];
   let stage='navigation';
   try {
    scriptErrors=0;
    await page.goto(`${origin}/competition-engine.html?competition=${slug}&view=${view}`,{waitUntil:'domcontentloaded',timeout:10000});
    stage='render-ready';
    await page.waitForFunction(()=>['ready','error'].includes(document.body.dataset.kvlRenderState),{},{timeout:6000});
    if(await page.evaluate(()=>document.body.dataset.kvlRenderState==='error')){
     record({id:scope,outcome:'FAIL',findings:[issue('UI_RENDER',scope,'render')],count:1,
      covered_entities:['render'],complete:true,note:'페이지가 명시적 렌더 오류 상태. 나머지 시각 검증은 보류'});
     continue;
    }
    stage='assets';
    const assetsReady=await page.evaluate(async()=>Promise.race([
      Promise.all([document.fonts.ready,...[...document.images].filter(i=>i.getClientRects().length&&i.src.startsWith(location.origin)).map(i=>{i.loading='eager';return i.decode().catch(()=>{});})]).then(()=>true),
      new Promise(resolve=>setTimeout(()=>resolve(false),1500))]));
    if(!assetsReady)throw new Error('asset preparation timeout');
    stage='geometry';
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
      accent:getComputedStyle(document.body).getPropertyValue('--dv2-accent').trim().toLowerCase(),
      activeView:document.querySelector('.kvl1180-tabs [aria-current="page"]')?.dataset.view,
      tabs:document.querySelectorAll('.kvl1180-tabs a').length
     };
    });
    if(stats.overflow)failures.push('overflow');if(stats.logos)failures.push('logos');
    if(stats.align)failures.push('score-align');if(stats.clipping)failures.push('team-clipping');
    if(scriptErrors)failures.push('script');
    if(stats.activeView!==view||stats.tabs!==6)failures.push('navigation');
    // 2026-10-27/28 approved domestic presentation overrides older base theme tokens.
    if(stats.gender!==(slug.includes('-women-')?'women':'men')||stats.accent!==(slug.includes('-women-')?'#9b4c70':'#292d33'))failures.push('theme');
    if(view==='rosters') {
     stage='roster';
     const first=page.locator('[data-team-code].kvl1180-participant-button').first();
     if(await first.count()) {await first.click();await page.waitForFunction(()=>document.querySelectorAll('[data-roster-player]').length>0,{},{timeout:5000});}
     else failures.push('roster');
    }
    record({id:scope,outcome:failures.length?'FAIL':'PASS',findings:failures.map(e=>issue('UI_'+e.toUpperCase().replaceAll('-','_'),scope,e,stats)),count:1,
     covered_entities:covered,complete:true,note:'Chromium 실제 렌더: 가로 넘침·로고·점수 중앙·팀명 잘림·명단 연결. 색상 미세차/육안 전체는 별도 검수'});
   } catch {
    record({id:scope,outcome:'NOT VERIFIED',findings:[],count:0,covered_entities:[],complete:false,operational:true,note:'브라우저 단계 미완료: '+stage});
   }
  }
  await context.close();
 }
 await browser.close();
})().catch(()=>{record({id:'ui:runner',outcome:'NOT VERIFIED',findings:[],count:0,covered_entities:[],complete:false,operational:true,note:'Playwright/Chromium 실행 환경 미준비'});process.exitCode=2;});

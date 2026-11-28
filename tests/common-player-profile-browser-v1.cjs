'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.RUNNER_TEMP||'/tmp';
const BASE='https://kvolleylab.com',ID='KVL-P-001671',NAME='하승우';
const TEAMS=BASE+'/teams.html?category=pro&gender=men&league=vleague&season=2026-27&team=KEP';
const PLAYERS=BASE+'/players.html?id='+ID;
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
/* This stub never contacts the real Supabase project. Session storage is used
 * only in the isolated browser context to simulate a shared backend across navigation. */
const stub=`
const K='kvl-qa-only-notes', B='kvl-qa-only-bookmarks';
const user={id:'qa-only-user',email:'admin@example.test'};
export function createClient(){
 let signed=!new URL(location.href).searchParams.has('qaSignedOut');
 const session=()=>signed?{user,access_token:'qa-only',refresh_token:'qa-only'}:null;
 const ok=(x={})=>({data:{ok:true,...x},error:null});
 const read=k=>JSON.parse(sessionStorage.getItem(k)||'[]');
 const write=(k,v)=>sessionStorage.setItem(k,JSON.stringify(v));
 return {auth:{
  getSession:async()=>({data:{session:session()},error:null}),
  getUser:async()=>({data:{user:signed?user:null},error:null}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
  signOut:async()=>{signed=false;return {error:null}}
 },functions:{invoke:async(name,{body}={})=>{
  if(name==='member-access')return ok({access:signed,role:'admin',account_status:'active'});
  if(name!=='admin-player-workspace'||!signed)return {data:{ok:false,error:'admin_only'},error:null};
  if(body.action==='list_notes')return ok({items:read(K)});
  if(body.action==='list_bookmarks')return ok({items:read(B).map(player_id=>({player_id}))});
  if(body.action==='toggle_bookmark'){const set=new Set(read(B));const saved=!set.has(body.player_id);saved?set.add(body.player_id):set.delete(body.player_id);write(B,[...set]);return ok({saved})}
  if(body.action==='save_note'){
   const rows=read(K),i=rows.findIndex(n=>n.id===body.id);
   if(body.id&&(i<0||rows[i].player_id!==body.player_id||rows[i].revision!==body.expected_revision))return {data:{ok:false,error:'note_changed_reload'},error:null};
   const item={id:body.id||'qa-note-'+(rows.length+1),player_id:body.player_id,season:body.season,title:body.title,body:body.body,revision:body.id?body.expected_revision+1:1,created_at:'2026-11-27T00:00:00Z',updated_at:'2026-11-27T00:00:00Z'};
   if(i>=0)rows[i]=item;else rows.push(item);write(K,rows);return ok({item})
  }
  return ok({items:[]})
 }}};
}
`;
async function intercept(context){
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin!==BASE)return route.abort();
  if(u.pathname.endsWith('/vendor/supabase-js-2.84.0.mjs'))return route.fulfill({status:200,contentType:'application/javascript',body:stub});
  if(u.pathname.endsWith('/member-access-gate-v1.mjs'))return route.fulfill({status:200,contentType:'application/javascript',body:'// QA-only access gate stub'});
  const target=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));
  if(!target.startsWith(ROOT+path.sep))return route.fulfill({status:403,body:''});
  try{return route.fulfill({status:200,contentType:mime[path.extname(target)]||'application/octet-stream',body:fs.readFileSync(target)})}
  catch{return route.fulfill({status:404,body:''})}
 });
}
async function openTeam(page){
 await page.goto(TEAMS,{waitUntil:'domcontentloaded'});
 const row=page.locator('.kvlrv2-row').filter({has:page.locator('.kvlrv2-name strong',{hasText:NAME})}).first();
 await row.waitFor({timeout:30000});await row.locator('.kvlrv2-name strong').click();
 const pane=page.locator('.kvlrv2-detail').filter({has:page.locator('.kvl-cpp-name h3',{hasText:NAME})});
 await pane.waitFor({state:'visible',timeout:30000});
 await pane.locator('[data-kvl-cpp-id="'+ID+'"]').waitFor({timeout:30000});
 return pane;
}
async function editor(pane){
 const e=pane.locator('[data-cpp-note-editor]');await e.waitFor({timeout:30000});await e.locator('summary').click();
 await e.locator('form:not([hidden])').waitFor({timeout:30000});return e;
}
async function profileDesign(pane){
 return pane.locator('.kvl-cpp-summary').evaluate(el=>{
  const props=(node,keys)=>Object.fromEntries(keys.map(k=>[k,getComputedStyle(node)[k]]));
  const head=el.querySelector('.kvl-cpp-name'),name=head.querySelector('h3'),fact=el.querySelector('.kvl-cpp-facts>div'),value=fact.querySelector('dd'),close=head.querySelector('.kvl-cpp-close');
  const dialog=el.closest('dialog');
  return {header:props(head,['backgroundColor','borderRadius','paddingTop','paddingLeft']),name:props(name,['fontFamily','fontSize','fontWeight','lineHeight','color']),row:props(fact,['display','paddingTop','paddingBottom','borderBottomColor']),value:props(value,['fontFamily','fontSize','fontWeight','color','textAlign']),close:props(close,['backgroundColor','borderRadius','fontSize','minHeight']),shell:dialog?{width:Math.round(dialog.getBoundingClientRect().width),...props(dialog,['backgroundColor','borderRadius','maxHeight'])}:null};
 });
}
async function fits(page){
 const size=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(size.scroll<=size.w+2,'page overflow '+JSON.stringify(size));
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report=[];
 try{
  for(const width of [1440,390]){
   const ctx=await browser.newContext({viewport:{width,height:width===1440?900:844},serviceWorkers:'block'});
   await intercept(ctx);const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let pane=await openTeam(page);
   assert.match(await pane.locator('.kvl-cpp-summary').innerText(),/1995-06-02/);
   const teamDesign=await profileDesign(pane);
   assert.equal(await pane.locator('.kvl-cpp-name').count(),1);
   const bookmark=pane.locator('[data-cpp-bookmark="'+ID+'"]');
   await bookmark.waitFor({timeout:30000});await bookmark.click();await page.waitForFunction(id=>document.querySelector('[data-cpp-bookmark="'+id+'"]')?.getAttribute('aria-pressed')==='true',ID);
   let e=await editor(pane);await e.getByLabel('메모 제목').fill('QA 교차 저장');await e.getByLabel('관찰 메모').fill('QA-only first version');
   await e.getByRole('button',{name:'저장',exact:true}).click();await e.getByText('저장되었습니다.',{exact:true}).waitFor({timeout:30000});
   await fits(page);await page.screenshot({path:path.join(OUT,'kvl-common-profile-team-'+width+'.png')});
   await page.goto(PLAYERS,{waitUntil:'domcontentloaded'});
   pane=page.locator('#profileDialog[open]');await pane.waitFor({timeout:30000});
   assert.match(await pane.locator('.kvl-cpp-summary').innerText(),/1995-06-02/);
   const playerDesign=await profileDesign(pane);
   const {shell:teamShell,...teamContent}=teamDesign,{shell:playerShell,...playerContent}=playerDesign;
   assert.deepEqual(playerContent,teamContent,'shared team/player profile visual properties');
   if(width===1440)assert.deepEqual(playerShell,teamShell,'same desktop dialog shell');
   assert.equal(await pane.locator('.kvl-cpp-name').count(),1);
   assert.equal(await pane.locator('iframe').count(),0,'no nested profile page');
   assert.ok(await pane.locator('.kvl-cpp-section h4').count()>=2,'rich direct detail sections');
   assert.match(await pane.locator('.kvl-cpp-full-link').getAttribute('href'),/player\.html\?id=/);
   assert.equal(await pane.locator('[data-save-player="'+ID+'"]').getAttribute('aria-pressed'),'true');
   e=await editor(pane);await e.getByText('QA-only first version',{exact:true}).waitFor({timeout:30000});
   await e.getByRole('button',{name:'수정',exact:true}).click();await e.getByLabel('관찰 메모').fill('QA-only updated version');
   await e.getByRole('button',{name:'수정 저장',exact:true}).click();await e.getByText('저장되었습니다.',{exact:true}).waitFor({timeout:30000});
   await fits(page);await page.screenshot({path:path.join(OUT,'kvl-common-profile-player-'+width+'.png')});
   pane=await openTeam(page);e=await editor(pane);await e.getByText('QA-only updated version',{exact:true}).waitFor({timeout:30000});
   await page.goto(TEAMS+'&qaSignedOut=1',{waitUntil:'domcontentloaded'});const row=page.locator('.kvlrv2-name strong',{hasText:NAME}).first();await row.waitFor({timeout:30000});await row.click();
   await page.locator('.kvl-cpp-summary').filter({hasText:NAME}).waitFor({timeout:30000});
   await page.waitForFunction(()=>window.KVLTeamRosterPrivateState?.ready===true);
   assert.equal(await page.locator('[data-cpp-note-editor]').count(),0,'signed-out page must not mount private notes');
   assert.equal(await page.locator('[data-cpp-bookmark]').count(),0,'signed-out page must not mount bookmark control');
   assert.deepEqual(errors,[]);report.push({width,sharedDOB:true,sharedDesign:true,nativeDetails:true,bookmark:true,noteRoundTrip:true,signedOut:true});
   await ctx.close();
  }
  fs.writeFileSync(path.join(OUT,'kvl-common-profile-browser-report.json'),JSON.stringify({status:'PASS',report},null,2));console.log(report);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const BASE=process.env.KVL_TEST_BASE||'http://127.0.0.1:4177';

const stub=`
export function createClient(){
  globalThis.__kvlSupabaseCreateCount=(globalThis.__kvlSupabaseCreateCount||0)+1;
  const user={email:'admin@example.test'};
  return {
    auth:{
      getUser:async()=>({data:{user},error:null}),
      getSession:async()=>({data:{session:{access_token:'test-access',refresh_token:'test-refresh'}},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      signInWithPassword:async()=>({data:{user,session:{access_token:'test-access',refresh_token:'test-refresh'}},error:null}),
      signOut:async()=>({error:null})
    },
    functions:{
      invoke:async(name)=>{
        if(name==='member-access')return {data:{ok:true,access:true,role:'admin',account_status:'active'},error:null};
        if(name==='admin-player-workspace')return {data:{ok:true,items:[]},error:null};
        return {data:{ok:true},error:null};
      }
    }
  };
}
`;

async function assertTeams(page){
 await page.goto(BASE+'/teams.html?category=pro&gender=men&league=sv&season=2026-27',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('.ktd-card').first().waitFor({timeout:30000});
 await page.waitForFunction(()=>document.documentElement.dataset.memberAccess==='admin'&&window.KVLMemberSession?.role==='admin'&&window.KVLTeamRosterPrivateState?.authenticated===true,null,{timeout:15000});
 assert.equal(await page.locator('.kvl-member-gate').count(),0,'mobile admin must not be blocked by the member gate');
 assert.equal(await page.locator('.ktd-card').count(),12,'admin mobile view must still render the SV.LEAGUE team cards');
 const state=await page.evaluate(()=>({
   creates:globalThis.__kvlSupabaseCreateCount||0,
   access:document.documentElement.dataset.memberAccess,
   session:window.KVLMemberSession,
   privateReady:Boolean(window.KVLTeamRosterPrivateState?.authenticated),
   viewport:innerWidth,
   scrollWidth:document.documentElement.scrollWidth
 }));
 assert.equal(state.creates,1,'teams.html must create only one Supabase browser client');
 assert.equal(state.access,'admin');
 assert.equal(state.session.role,'admin');
 assert.equal(state.privateReady,true);
 assert.ok(state.scrollWidth<=state.viewport+2,'mobile teams page must not overflow');
}

async function assertLogin(page){
 await page.goto(BASE+'/member-login.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#memberSignedIn:not([hidden])').waitFor({timeout:15000});
 const state=await page.evaluate(()=>({
   creates:globalThis.__kvlSupabaseCreateCount||0,
   badge:document.getElementById('memberRoleBadge')?.textContent,
   signedIn:!document.getElementById('memberSignedIn')?.hidden
 }));
 assert.equal(state.creates,1,'login page must also create one browser client');
 assert.equal(state.badge,'ADMIN');
 assert.equal(state.signedIn,true);
}

(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await page.route('**/vendor/supabase-js-2.84.0.mjs*',route=>route.fulfill({status:200,contentType:'application/javascript',body:stub}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await assertTeams(page);
  await assertLogin(page);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'PASS',viewport:390,sharedSupabaseClient:true,adminGate:'PASS',svLeagueCards:12},null,2));
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});

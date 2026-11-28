'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.KVL_PLAYWRIGHT_PATH||'playwright');
const BASE=process.env.KVL_TEST_BASE||'http://127.0.0.1:4177';

const stub=`
export function createClient(){
  globalThis.__kvlSupabaseCreateCount=(globalThis.__kvlSupabaseCreateCount||0)+1;
  const mode=new URL(location.href).searchParams.get('authcase')||'signed';
  const user={id:'kvl-test-admin',email:'admin@example.test'};
  let signedIn=mode!=='wrong';
  let getUserCalls=0;
  return {
    auth:{
      getUser:async()=>{
        getUserCalls+=1;
        if(mode==='wrong'&&getUserCalls===1){
          await new Promise(resolve=>setTimeout(resolve,800));
          return {data:{user},error:null};
        }
        return signedIn?{data:{user},error:null}:{data:{user:null},error:{message:'No active session'}};
      },
      getSession:async()=>({data:{session:signedIn?{user,access_token:'test-access',refresh_token:'test-refresh'}:null},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      signInWithPassword:async({password})=>{
        if(password==='wrong-password'){
          signedIn=false;
          return {data:{user:null,session:null},error:{code:'invalid_credentials',message:'Invalid login credentials'}};
        }
        signedIn=true;
        return {data:{user,session:{user,access_token:'test-access',refresh_token:'test-refresh'}},error:null};
      },
      signOut:async()=>{signedIn=false;return {error:null}}
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

async function assertWrongPassword(page){
 await page.goto(BASE+'/member-login.html?authcase=wrong',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#memberLoginForm').waitFor({state:'visible',timeout:5000});
 await page.locator('#memberEmail').fill('admin@example.test');
 await page.locator('#memberPassword').fill('wrong-password');
 await page.locator('#memberLoginButton').click();
 const alert=page.locator('#memberLoginMessage.error');
 await alert.waitFor({state:'visible',timeout:5000});
 assert.equal((await alert.innerText()).trim(),'이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
 await page.waitForTimeout(1000);
 const state=await page.evaluate(()=>({
   creates:globalThis.__kvlSupabaseCreateCount||0,
   formVisible:!document.getElementById('memberLoginForm')?.hidden,
   signedInVisible:!document.getElementById('memberSignedIn')?.hidden,
   passwordInvalid:document.getElementById('memberPassword')?.getAttribute('aria-invalid'),
   emailInvalid:document.getElementById('memberEmail')?.getAttribute('aria-invalid'),
   alert:document.getElementById('memberLoginMessage')?.textContent,
   alertRole:document.getElementById('memberLoginMessage')?.getAttribute('role')
 }));
 assert.equal(state.creates,1,'wrong-password flow must still use one Supabase client');
 assert.equal(state.formVisible,true,'wrong password must keep the login form visible');
 assert.equal(state.signedInVisible,false,'stale refresh must never overwrite a failed login with success UI');
 assert.equal(state.passwordInvalid,'true');
 assert.equal(state.emailInvalid,'true');
 assert.match(state.alert,/비밀번호가 올바르지 않습니다/);
 assert.equal(state.alertRole,'alert');
}

(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await page.route('**/vendor/supabase-js-2.84.0.mjs*',route=>route.fulfill({status:200,contentType:'application/javascript',body:stub}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await assertTeams(page);
  await assertLogin(page);
  await assertWrongPassword(page);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({
    status:'PASS',
    viewport:390,
    sharedSupabaseClient:true,
    adminGate:'PASS',
    svLeagueCards:12,
    invalidPasswordAlert:'PASS',
    staleRefreshRace:'PASS'
  },null,2));
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});

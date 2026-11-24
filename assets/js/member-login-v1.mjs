import {supabase} from './kvl-supabase-browser-v1.mjs?v=20261124-auth-singleton-v1';
const FUNCTION_NAME='member-access';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);

let uiEpoch=0;
let submitting=false;

function safeNext(){
  const raw=params.get('next')||'index.html';
  try{const u=new URL(raw,location.origin);if(u.origin!==location.origin)return'index.html';return u.pathname.split('/').pop()+u.search+u.hash}catch{return'index.html'}
}
function message(text='',error=false){
  const el=$('memberLoginMessage');
  el.textContent=text;
  el.classList.toggle('error',error);
  el.hidden=!text;
  el.setAttribute('aria-live',error?'assertive':'polite');
}
function markCredentialsInvalid(invalid){
  $('memberEmail').setAttribute('aria-invalid',invalid?'true':'false');
  $('memberPassword').setAttribute('aria-invalid',invalid?'true':'false');
}
function loginErrorMessage(err){
  const code=String(err?.code||'').toLowerCase();
  const raw=String(err?.message||'');
  const lower=raw.toLowerCase();
  if(code==='invalid_credentials'||lower.includes('invalid login credentials'))return'이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.';
  if(code==='over_request_rate_limit'||lower.includes('rate limit'))return'로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  return raw||'로그인에 실패했습니다. 다시 시도해 주세요.';
}
async function accessStatus(){const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action:'status'}});if(error)return null;return data}
function showSignedOut(){$('memberLoginForm').hidden=false;$('memberSignedIn').hidden=true;$('memberPassword').value=''}
function showSignedIn(user,access){
  $('memberLoginForm').hidden=true;$('memberSignedIn').hidden=false;
  $('memberAccountEmail').textContent=user.email||'로그인 계정';
  $('memberRoleBadge').textContent=access?.role==='admin'?'ADMIN':'MEMBER';
  $('memberWorkspaceButton').hidden=access?.role!=='admin';
  markCredentialsInvalid(false);
  message('');
}
async function refresh(){
  const epoch=uiEpoch;
  try{
    const {data,error}=await supabase.auth.getUser();
    if(epoch!==uiEpoch||submitting)return;
    if(error||!data.user){showSignedOut();return}
    const access=await accessStatus();
    if(epoch!==uiEpoch||submitting)return;
    if(access?.access!==true){await supabase.auth.signOut({scope:'local'});if(epoch!==uiEpoch||submitting)return;showSignedOut();message('현재 허용된 관리자 계정만 이용할 수 있습니다.',true);return}
    showSignedIn(data.user,access);
  }catch{
    if(epoch!==uiEpoch||submitting)return;
    showSignedOut();message('로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.',true);
  }
}
$('memberLoginForm').addEventListener('submit',async ev=>{
  ev.preventDefault();
  submitting=true;
  const epoch=++uiEpoch;
  const button=$('memberLoginButton');
  button.disabled=true;
  $('memberLoginForm').setAttribute('aria-busy','true');
  markCredentialsInvalid(false);
  message('로그인 정보를 확인하고 있습니다.');
  try{
    const email=$('memberEmail').value.trim(),password=$('memberPassword').value;
    const {data:signIn,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){
      if(String(error.code||'').toLowerCase()==='invalid_credentials'||String(error.message||'').toLowerCase().includes('invalid login credentials')){
        await supabase.auth.signOut({scope:'local'}).catch(()=>{});
      }
      throw error;
    }
    if(!signIn?.user||!signIn?.session)throw new Error('로그인 세션을 확인할 수 없습니다.');
    const {data,error:userError}=await supabase.auth.getUser();
    if(userError||!data.user)throw userError||new Error('계정을 확인할 수 없습니다.');
    const access=await accessStatus();
    if(access?.access!==true){await supabase.auth.signOut({scope:'local'});throw new Error('현재 허용된 관리자 계정만 이용할 수 있습니다.')}
    if(epoch!==uiEpoch)return;
    showSignedIn(data.user,access);
    location.href=safeNext();
  }catch(err){
    if(epoch!==uiEpoch)return;
    showSignedOut();
    const invalid=String(err?.code||'').toLowerCase()==='invalid_credentials'||String(err?.message||'').toLowerCase().includes('invalid login credentials');
    markCredentialsInvalid(invalid);
    message(loginErrorMessage(err),true);
    if(invalid)$('memberPassword').focus();
  }finally{
    if(epoch===uiEpoch){
      submitting=false;
      button.disabled=false;
      $('memberLoginForm').removeAttribute('aria-busy');
    }
  }
});
$('memberEmail').addEventListener('input',()=>markCredentialsInvalid(false));
$('memberPassword').addEventListener('input',()=>markCredentialsInvalid(false));
$('memberContinueButton').addEventListener('click',()=>location.href='index.html');
$('memberWorkspaceButton').addEventListener('click',()=>location.href='admin-player-workspace.html');
$('memberLogoutButton').addEventListener('click',async()=>{++uiEpoch;submitting=false;await supabase.auth.signOut({scope:'local'});showSignedOut();markCredentialsInvalid(false);message('로그아웃했습니다.')});
void refresh();

import {supabase} from './kvl-supabase-browser-v1.mjs?v=20261124-auth-singleton-v1';
const FUNCTION_NAME='member-access';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);

function safeNext(){
  const raw=params.get('next')||'index.html';
  try{const u=new URL(raw,location.origin);if(u.origin!==location.origin)return'index.html';return u.pathname.split('/').pop()+u.search+u.hash}catch{return'index.html'}
}
function message(text='',error=false){const el=$('memberLoginMessage');el.textContent=text;el.classList.toggle('error',error)}
async function accessStatus(){const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action:'status'}});if(error)return null;return data}
function showSignedOut(){$('memberLoginForm').hidden=false;$('memberSignedIn').hidden=true;$('memberPassword').value=''}
function showSignedIn(user,access){
  $('memberLoginForm').hidden=true;$('memberSignedIn').hidden=false;
  $('memberAccountEmail').textContent=user.email||'로그인 계정';
  $('memberRoleBadge').textContent=access?.role==='admin'?'ADMIN':'MEMBER';
  $('memberWorkspaceButton').hidden=access?.role!=='admin';
  message('');
}
async function refresh(){
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user){showSignedOut();return}
  const access=await accessStatus();
  if(access?.access!==true){await supabase.auth.signOut({scope:'local'});showSignedOut();message('현재 허용된 관리자 계정만 이용할 수 있습니다.',true);return}
  showSignedIn(data.user,access);
}
$('memberLoginForm').addEventListener('submit',async ev=>{
  ev.preventDefault();$('memberLoginButton').disabled=true;message('로그인 확인 중…');
  try{
    const {error}=await supabase.auth.signInWithPassword({email:$('memberEmail').value.trim(),password:$('memberPassword').value});
    if(error)throw error;
    const {data,error:userError}=await supabase.auth.getUser();if(userError||!data.user)throw userError||new Error('계정을 확인할 수 없습니다.');
    const access=await accessStatus();
    if(access?.access!==true){await supabase.auth.signOut({scope:'local'});throw new Error('현재 허용된 관리자 계정만 이용할 수 있습니다.')}
    showSignedIn(data.user,access);location.href=safeNext();
  }catch(err){showSignedOut();message(err.message||'로그인에 실패했습니다.',true)}
  finally{$('memberLoginButton').disabled=false}
});
$('memberContinueButton').addEventListener('click',()=>location.href='index.html');
$('memberWorkspaceButton').addEventListener('click',()=>location.href='admin-player-workspace.html');
$('memberLogoutButton').addEventListener('click',async()=>{await supabase.auth.signOut({scope:'local'});showSignedOut();message('로그아웃했습니다.')});
void refresh();

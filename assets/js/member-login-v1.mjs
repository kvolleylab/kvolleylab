import {supabase,getMemberAccess,safeReturnPath,signOutMember} from './kvl-member-access-v1.mjs';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const returnPath=safeReturnPath(params.get('return')||'players.html');
function message(text='',error=false){$('loginMessage').textContent=text;$('loginMessage').classList.toggle('error',error)}
function showForm(){$('loginCard').hidden=false;$('signedCard').hidden=true}
function showSigned(status){
  $('loginCard').hidden=true;$('signedCard').hidden=false;
  $('signedRole').textContent=status.role==='admin'?'관리자':'회원';
  $('signedEmail').textContent=status.email||'로그인 계정';
  $('signedStatus').textContent=status.role==='admin'?'관리자 권한으로 선수·팀 기능을 검수할 수 있습니다.':'활성 회원 계정입니다.';
  $('adminWorkspaceLink').hidden=status.role!=='admin';
  $('continueLink').href=returnPath;
}
async function refresh(){
  try{
    const status=await getMemberAccess();
    if(status.access){showSigned(status);return}
    if(status.authenticated){
      showForm();message(status.role==='unregistered'?'아직 KVL 회원 접근 권한이 활성화되지 않은 계정입니다.':'현재 사용할 수 없는 회원 계정입니다.',true);return
    }
    showForm();
  }catch(err){showForm();message(err.message||'로그인 상태 확인에 실패했습니다.',true)}
}
$('loginForm').addEventListener('submit',async ev=>{
  ev.preventDefault();const button=$('loginButton');button.disabled=true;message('로그인 확인 중…');
  try{
    const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    if(error)throw error;
    const status=await getMemberAccess();
    if(!status.access){await signOutMember();throw new Error('활성화된 KVL 회원 또는 관리자 계정이 아닙니다.')}
    location.replace(returnPath);
  }catch(err){message(err.message||'로그인에 실패했습니다.',true)}
  finally{button.disabled=false}
});
$('logoutButton').addEventListener('click',async()=>{await signOutMember();showForm();message('로그아웃했습니다.')});
refresh();

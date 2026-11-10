import {createClient} from '../vendor/supabase-js-2.84.0.mjs';
const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co',SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM',FUNCTION_NAME='member-access';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
function nextPath(){const raw=params.get('next')||'players.html';try{const u=new URL(raw,location.origin);if(u.origin!==location.origin)return'players.html';return u.pathname.split('/').pop()+u.search+u.hash}catch{return'players.html'}}
function message(text=''){$('memberLoginMessage').textContent=text}
async function accessStatus(){const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action:'status'}});if(error)return null;return data}
function showSignedIn(user,access){$('memberLoginForm').hidden=true;$('memberSignedIn').hidden=false;$('memberAccountEmail').textContent=user.email||'로그인 계정';$('memberRoleBadge').textContent=access?.role==='admin'?'관리자':'회원';message(access?.access===true?'':'이 계정은 아직 회원 이용 권한이 활성화되지 않았습니다.');$('memberContinueButton').disabled=access?.access!==true}
function showSignedOut(){$('memberLoginForm').hidden=false;$('memberSignedIn').hidden=true;$('memberPassword').value=''}
async function refresh(){const {data,error}=await supabase.auth.getUser();if(error||!data.user){showSignedOut();return}const access=await accessStatus();showSignedIn(data.user,access)}
$('memberLoginForm').addEventListener('submit',async ev=>{ev.preventDefault();$('memberLoginButton').disabled=true;message('로그인 확인 중…');try{const {error}=await supabase.auth.signInWithPassword({email:$('memberEmail').value.trim(),password:$('memberPassword').value});if(error)throw error;const {data}=await supabase.auth.getUser();const access=await accessStatus();if(!data.user)throw new Error('계정을 확인할 수 없습니다.');showSignedIn(data.user,access);if(access?.access===true)location.href=nextPath()}catch(err){message(err.message||'로그인에 실패했습니다.');showSignedOut()}finally{$('memberLoginButton').disabled=false}});
$('memberContinueButton').addEventListener('click',()=>location.href=nextPath());
$('memberLogoutButton').addEventListener('click',async()=>{await supabase.auth.signOut();showSignedOut();message('로그아웃했습니다.')});
void refresh();
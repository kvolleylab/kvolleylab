import {createClient} from '../vendor/supabase-js-2.84.0.mjs';

const CONFIG_URL='data/member-access-v1.json';
const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
const FUNCTION_NAME='member-access';
const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();

function safeNext(){
  const url=new URL(location.href);
  url.searchParams.delete('login_error');
  return url.pathname.split('/').pop()+url.search+url.hash;
}
function loginHref(config){
  const q=new URLSearchParams({next:safeNext()});
  return (config.loginPath||'member-login.html')+'?'+q.toString();
}
function addStyle(){
  if(document.getElementById('kvlMemberGateStyle'))return;
  const style=document.createElement('style');style.id='kvlMemberGateStyle';
  style.textContent=`
    .kvl-member-gate{position:fixed;inset:0;z-index:4000;background:rgba(8,25,43,.76);backdrop-filter:blur(7px);display:grid;place-items:center;padding:20px}
    .kvl-member-gate-card{width:min(460px,100%);background:#fff;border:1px solid #d9e2ea;border-radius:18px;padding:28px;box-shadow:0 28px 90px rgba(0,0,0,.28);font-family:Pretendard,Arial,sans-serif;color:#17304d}
    .kvl-member-gate-card small{display:inline-block;color:#9b7417;font-weight:900;letter-spacing:.09em;font-size:10px}
    .kvl-member-gate-card h2{margin:9px 0 8px;color:#0b2239;font-size:27px;letter-spacing:-.04em}
    .kvl-member-gate-card p{margin:0;color:#6f8091;line-height:1.65;font-size:13px}
    .kvl-member-gate-actions{display:grid;gap:8px;margin-top:20px}
    .kvl-member-gate-actions a{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;text-decoration:none;font-weight:900;font-size:13px}
    .kvl-member-gate-login{background:#143d6b;color:#fff}.kvl-member-gate-home{border:1px solid #ccd7e1;color:#31506d;background:#fff}
    .kvl-member-gate-state{margin-top:12px;color:#8b99a7;font-size:11px}
  `;
  document.head.appendChild(style);
}
function showGate(config,kind='login'){
  addStyle();
  document.querySelector('.kvl-member-gate')?.remove();
  const box=document.createElement('div');box.className='kvl-member-gate';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  const enrolled=kind==='not_enrolled';
  box.innerHTML=`<div class="kvl-member-gate-card">
    <small>K-VOLLEY LAB · MEMBER ACCESS</small>
    <h2>${enrolled?'회원 이용 권한 준비 중':'로그인이 필요한 메뉴입니다'}</h2>
    <p>${enrolled?'로그인은 확인됐지만 아직 K-Volley Lab 회원 이용 권한이 활성화되지 않았습니다. 일반 회원 오픈 전 검수 단계입니다.':'선수·팀의 선수 프로필, 팀 정보, Draft Hub, 선수 비교, 세대추적과 기록은 로그인 회원 기능으로 준비하고 있습니다.'}</p>
    <div class="kvl-member-gate-actions">
      <a class="kvl-member-gate-login" href="${loginHref(config)}">${enrolled?'로그인 계정 확인':'로그인'}</a>
      <a class="kvl-member-gate-home" href="index.html">홈으로</a>
    </div>
    <div class="kvl-member-gate-state">회원가입은 아직 공개하지 않았습니다.</div>
  </div>`;
  document.body.appendChild(box);document.documentElement.dataset.memberAccess='blocked';
}
async function init(){
  let config;try{const r=await fetch(CONFIG_URL,{cache:'no-store'});if(!r.ok)return;config=await r.json()}catch{return}
  const preview=config.previewParam&&new URLSearchParams(location.search).get(config.previewParam)==='1';
  if(!config.protectedPaths?.map(x=>x.toLowerCase()).includes(path))return;
  if(config.enabled!==true&&!preview)return;
  document.documentElement.dataset.memberGateMode=preview?'preview':'live';
  const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  try{
    const {data,error}=await supabase.auth.getUser();
    if(error||!data.user){showGate(config,'login');return}
    const {data:access,error:fnError}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action:'status'}});
    if(fnError||access?.access!==true){showGate(config,access?.account_status==='not_enrolled'?'not_enrolled':'login');return}
    document.documentElement.dataset.memberAccess=access.role||'member';
    window.KVLMemberAccess=Object.freeze({authenticated:true,role:access.role||'member',accountStatus:access.account_status||'active'});
  }catch{showGate(config,'login')}
}
void init();

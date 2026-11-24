import {supabase} from './kvl-supabase-browser-v1.mjs?v=20261124-auth-singleton-v1';

const FUNCTION_NAME='member-access';

let current={authenticated:false,role:null,email:'',access:false};

function safeCurrentPath(){
  const url=new URL(location.href);
  return url.pathname.split('/').pop()+url.search+url.hash;
}
function loginHref(){
  const q=new URLSearchParams({next:safeCurrentPath()||'index.html'});
  return 'member-login.html?'+q.toString();
}
function apply(state){
  current=state;
  document.documentElement.dataset.kvlAuth=state.authenticated&&state.access?(state.role||'member'):'signed-out';
  document.querySelectorAll('[data-kvl-auth-link]').forEach(link=>{
    const signedIn=state.authenticated&&state.access;
    const label=signedIn?(state.role==='admin'?'관리자':'내 계정'):'로그인';
    const href=signedIn?(state.role==='admin'?'admin-player-workspace.html':'players.html'):loginHref();
    const labelEl=link.querySelector('[data-kvl-auth-label]');
    if(labelEl){if(labelEl.textContent!==label)labelEl.textContent=label}
    else if(link.textContent!==label)link.textContent=label;
    if(link.getAttribute('href')!==href)link.setAttribute('href',href);
    if(signedIn){if(link.getAttribute('title')!==(state.email||'로그인 계정'))link.setAttribute('title',state.email||'로그인 계정')}
    else if(link.hasAttribute('title'))link.removeAttribute('title');
  });
  document.querySelectorAll('[data-kvl-auth-role]').forEach(el=>{
    const value=state.authenticated&&state.access?(state.role==='admin'?'ADMIN':'MEMBER'):'';
    if(el.textContent!==value)el.textContent=value;
    el.hidden=!(state.authenticated&&state.access);
  });
  document.querySelectorAll('[data-kvl-auth-logout]').forEach(button=>{
    button.hidden=!(state.authenticated&&state.access);
  });
  window.KVLMemberSession=Object.freeze({...state});
  window.dispatchEvent(new CustomEvent('kvl:member-session',{detail:{...state}}));
}
async function resolve(){
  try{
    const {data,error}=await supabase.auth.getUser();
    if(error||!data.user){apply({authenticated:false,role:null,email:'',access:false});return}
    const {data:access,error:fnError}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action:'status'}});
    if(fnError||access?.access!==true){
      apply({authenticated:true,role:access?.role||null,email:data.user.email||'',access:false,accountStatus:access?.account_status||'blocked'});
      return;
    }
    apply({authenticated:true,role:access.role||'member',email:data.user.email||'',access:true,accountStatus:access.account_status||'active'});
  }catch{
    apply({authenticated:false,role:null,email:'',access:false});
  }
}
document.addEventListener('click',async ev=>{
  const button=ev.target.closest('[data-kvl-auth-logout]');if(!button)return;
  button.disabled=true;
  try{await supabase.auth.signOut({scope:'local'});apply({authenticated:false,role:null,email:'',access:false});location.href='index.html'}
  finally{button.disabled=false}
});
new MutationObserver(()=>apply(current)).observe(document.documentElement,{childList:true,subtree:true});
supabase.auth.onAuthStateChange(()=>setTimeout(()=>void resolve(),0));
void resolve();

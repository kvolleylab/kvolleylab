import {createClient} from '../vendor/supabase-js-2.84.0.mjs';

export const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
export const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
export const MEMBER_ACCESS_FUNCTION='member-access';
export const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

const GATED_PATHS=new Set([
  'players.html','player.html','player-search.html','player-profile.html','growth-timeline.html','teams.html','university-teams.html','university-team.html',
  'draft-hub.html','player-compare.html','player-cohort.html','records.html'
]);

export function safeReturnPath(raw,fallback='players.html'){
  if(!raw)return fallback;
  try{
    const u=new URL(raw,location.origin);
    if(u.origin!==location.origin)return fallback;
    const path=(u.pathname.split('/').pop()||'index.html').toLowerCase();
    if(!GATED_PATHS.has(path))return fallback;
    u.searchParams.delete('memberGate');
    return (u.pathname.split('/').pop()||fallback)+u.search+u.hash;
  }catch{return fallback}
}

export async function getMemberAccess(){
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user)return {ok:true,authenticated:false,access:false,role:'guest'};
  const {data:status,error:invokeError}=await supabase.functions.invoke(MEMBER_ACCESS_FUNCTION,{body:{action:'status'}});
  if(invokeError)throw new Error(invokeError.message||'로그인 상태를 확인할 수 없습니다.');
  if(!status?.ok)throw new Error(status?.error||'로그인 상태를 확인할 수 없습니다.');
  return status;
}

export async function signOutMember(){await supabase.auth.signOut()}

if(typeof window!=='undefined'&&!window.KVLMemberAccessReady){
  window.KVLMemberAccessReady=getMemberAccess().catch(err=>({ok:false,authenticated:false,access:false,role:'error',error:err.message}));
}

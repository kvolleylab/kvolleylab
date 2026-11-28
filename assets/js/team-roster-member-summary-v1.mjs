import {supabase} from './kvl-supabase-browser-v1.mjs?v=20261124-auth-singleton-v1';
import {mountProfileNotes} from './kvl-common-profile-notes-v1.mjs?v=20261127-1';
const PRIVATE_FUNCTION='admin-player-workspace';

function publish(state){
 window.KVLTeamRosterPrivateState=state;
 window.dispatchEvent(new CustomEvent('kvl:team-roster-private-ready',{detail:{authenticated:state.authenticated}}));
}
async function privateApi(action,payload={}){
 const {data,error}=await supabase.functions.invoke(PRIVATE_FUNCTION,{body:{action,...payload}});
 if(error||!data?.ok)throw new Error(data?.error||error?.message||'private workspace unavailable');
 return data;
}
let authEpoch=0;
const signedOut=()=>({ready:true,authenticated:false,bookmarks:new Set(),notePlayers:new Set()});
async function refreshPrivateSummary(){
 const epoch=++authEpoch;
 try{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){if(epoch===authEpoch)publish(signedOut());return}
  const owner=session.user.id;
  const [bm,ns]=await Promise.all([privateApi('list_bookmarks'),privateApi('list_notes')]);
  const {data:{session:latest}}=await supabase.auth.getSession();
  if(epoch!==authEpoch||latest?.user?.id!==owner)return;
  publish({ready:true,authenticated:true,owner,bookmarks:new Set((bm.items||[]).map(x=>x.player_id).filter(Boolean)),notePlayers:new Set((ns.items||[]).map(x=>x.player_id).filter(Boolean))});
 }catch(err){
  if(epoch===authEpoch)publish({...signedOut(),error:true});
  console.warn('[KVL team roster private summary]',err);
 }
}

/* Only identities resolved by the shared catalog receive private controls.
   All changes still pass through the existing authenticated server function. */
const pending=new Set();
function renderActions(){
 const state=window.KVLTeamRosterPrivateState;
 document.querySelectorAll('.kvl-cpp-connection[data-kvl-cpp-id]').forEach(panel=>{
  const id=panel.dataset.kvlCppId;
  if(!/^KVL-P-\d{6}$/.test(id)||(window.KVLPlayerIdCollisionV1?.isConflict(id)||window.KVLCommonProfileBlockedIds?.has(id)))return;
  panel.querySelector('.kvl-cpp-private')?.remove();
  if(!state?.authenticated){panel.querySelector('[data-cpp-note-editor]')?.remove();return;}
  const wrap=document.createElement('div');wrap.className='kvl-cpp-private';
  const button=document.createElement('button');button.type='button';button.dataset.cppBookmark=id;button.disabled=pending.has(id);
  const saved=state.bookmarks.has(id);button.setAttribute('aria-pressed',String(saved));button.textContent=saved?'관심 선수 해제':'관심 선수 등록';
  wrap.append(button);panel.insertBefore(wrap,panel.querySelector('[data-cpp-note-editor]'));
  mountProfileNotes(panel,id,{onChange:async()=>{
   await refreshPrivateSummary();
  }});
 });
}
window.addEventListener('kvl:common-profile-linked',renderActions);
window.addEventListener('kvl:team-roster-private-ready',renderActions);
document.addEventListener('click',async ev=>{
 const button=ev.target.closest('[data-cpp-bookmark]');if(!button)return;
 const id=button.dataset.cppBookmark,state=window.KVLTeamRosterPrivateState;
 if(!state?.authenticated||pending.has(id)||window.KVLPlayerIdCollisionV1?.isConflict(id))return;
 if(button.closest('[data-kvl-cpp-id]')?.dataset.kvlCppId!==id)return;
 pending.add(id);button.disabled=true;
 try{
  const {data:{session}}=await supabase.auth.getSession();
  if(session?.user?.id!==state.owner||window.KVLTeamRosterPrivateState!==state)return;
  await privateApi('toggle_bookmark',{player_id:id});
  await refreshPrivateSummary();
 }catch(err){button.textContent='저장 실패 · 재시도';console.warn('[KVL profile bookmark]',err)}
 finally{pending.delete(id);if(button.isConnected)button.disabled=false;else renderActions()}
});
renderActions();
supabase.auth.onAuthStateChange((event,session)=>{
 const current=window.KVLTeamRosterPrivateState;
 if(event==='SIGNED_OUT'||(current?.owner&&current.owner!==session?.user?.id)){authEpoch++;publish(signedOut());}
 if(event==='SIGNED_IN')setTimeout(refreshPrivateSummary,0);
});
window.addEventListener('focus',()=>refreshPrivateSummary());
await refreshPrivateSummary();

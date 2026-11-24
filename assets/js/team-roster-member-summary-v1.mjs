import {supabase} from './kvl-supabase-browser-v1.mjs?v=20261124-auth-singleton-v1';
const PRIVATE_FUNCTION='admin-player-workspace';

function publish(state){
 window.KVLTeamRosterPrivateState=state;
 window.dispatchEvent(new CustomEvent('kvl:team-roster-private-ready',{detail:{authenticated:state.authenticated}}));
}
async function privateApi(action){
 const {data,error}=await supabase.functions.invoke(PRIVATE_FUNCTION,{body:{action}});
 if(error||!data?.ok)throw new Error(data?.error||error?.message||'private workspace unavailable');
 return data;
}
try{
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){
  publish({ready:true,authenticated:false,bookmarks:new Set(),notePlayers:new Set()});
 }else{
  const [bm,ns]=await Promise.all([privateApi('list_bookmarks'),privateApi('list_notes')]);
  publish({
   ready:true,authenticated:true,
   bookmarks:new Set((bm.items||[]).map(x=>x.player_id).filter(Boolean)),
   notePlayers:new Set((ns.items||[]).map(x=>x.player_id).filter(Boolean))
  });
 }
}catch(err){
 console.warn('[KVL team roster private summary]',err);
 publish({ready:true,authenticated:false,bookmarks:new Set(),notePlayers:new Set(),error:true});
}

import {validateMemberConfig,createMemberService} from './member-service-v1.mjs';
let promise;
export function loadMembers(){
  return promise ||= (async()=>{
    const response=await fetch('data/member-config.json',{cache:'no-store'});
    if(!response.ok)return null;
    const config=validateMemberConfig(await response.json());if(!config)return null;
    const {createClient}=await import('../vendor/supabase-js-2.118.0.mjs');
    const client=createClient(config.url,config.key,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'kvl-member-auth-v1'},global:{fetch:(url,init)=>fetch(url,{...init,cache:'no-store'})}});
    const service=createMemberService(client);
    let timer;
    client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||service.snapshot().user?.id!==session?.user?.id)service.clear();clearTimeout(timer);timer=setTimeout(()=>service.refresh(),0)});
    // SDK stores only authentication tokens. Notes and bookmarks remain in memory.
    window.addEventListener('pagehide',()=>service.clear());
    window.addEventListener('pageshow',event=>{if(event.persisted)service.refresh()});
    window.addEventListener('focus',()=>service.refresh());
    await client.auth.getSession();
    await service.refresh();
    return service;
  })();
}

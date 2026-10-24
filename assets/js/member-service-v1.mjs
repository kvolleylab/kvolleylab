// Supabase Auth + PostgreSQL RLS are authoritative; no private records in browser storage.
export function validateMemberConfig(config) {
  if (config?.enabled !== true) return null;
  const url = new URL(config.supabaseUrl);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('회원 서버 설정을 확인해 주세요.');
  // New publishable keys only: never accept a service_role/secret key or legacy JWT here.
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(config.publishableKey || '')) throw new Error('공개 회원 키 설정을 확인해 주세요.');
  return {url:url.origin,key:config.publishableKey};
}
export function createMemberService(client) {
  let state={user:null,bookmarks:[],notes:[],loading:false,error:''},epoch=0;
  const listeners=new Set();
  const snapshot=()=>({user:state.user?{...state.user}:null,bookmarks:state.bookmarks.map(x=>({...x})),notes:state.notes.map(x=>({...x})),loading:state.loading,error:state.error});
  const emit=()=>listeners.forEach(fn=>fn(snapshot()));
  function clear(error=''){epoch++;state={user:null,bookmarks:[],notes:[],loading:false,error};emit()}
  function checked(result){if(result.error)throw result.error;return result.data}
  function still(ticket){if(ticket!==epoch)throw new Error('로그인 상태가 변경됐습니다. 다시 시도해 주세요.')}
  async function verified(ticket){
    const result=await client.auth.getUser();still(ticket);
    if(result.error||!result.data?.user||!result.data.user.email_confirmed_at)throw new Error('로그인이 필요합니다.');
    const valid=checked(await client.rpc('kvl_member_session_active'));still(ticket);
    if(valid!==true)throw new Error('로그인이 만료됐습니다. 다시 로그인해 주세요.');
    return {id:result.data.user.id,email:result.data.user.email||''};
  }
  async function allRows(table,columns,userId,sort){
    const rows=[];
    for(let offset=0;;offset+=500){
      const page=checked(await client.from(table).select(columns).eq('user_id',userId).order(sort,{ascending:false}).range(offset,offset+499))||[];
      rows.push(...page);if(page.length<500)return rows;
    }
  }
  async function refresh(){
    const ticket=++epoch;state={user:state.user,bookmarks:[],notes:[],loading:true,error:''};emit();
    try{
      const user=await verified(ticket);
      const [bookmarks,notes]=await Promise.all([
        allRows('kvl_player_bookmarks','player_id,created_at',user.id,'created_at'),
        allRows('kvl_player_notes','id,player_id,title,body,revision,created_at,updated_at',user.id,'updated_at')
      ]);still(ticket);
      state={user,bookmarks,notes,loading:false,error:''};emit();
    }catch(error){if(ticket===epoch){state={user:null,bookmarks:[],notes:[],loading:false,error:error.message||'회원 정보를 불러오지 못했습니다.'};emit()}}
    return snapshot();
  }
  async function operation(fn){
    const ticket=epoch,user=await verified(ticket);still(ticket);
    if(user.id!==state.user?.id)throw new Error('로그인 상태가 변경됐습니다.');
    const result=await fn(user);still(ticket);await refresh();return result;
  }
  return {
    snapshot,refresh,clear,
    subscribe(fn){listeners.add(fn);fn(snapshot());return ()=>listeners.delete(fn)},
    async login(email){
      const value=String(email).trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||value.length>254)throw new Error('이메일 주소를 확인해 주세요.');
      checked(await client.auth.signInWithOtp({email:value,options:{emailRedirectTo:new URL('member-auth.html',location.href).href,shouldCreateUser:true}}));
    },
    async logout(){clear();const {error}=await client.auth.signOut({scope:'local'});if(error){clear('서버 로그아웃을 완료하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');throw error}},
    async setBookmark(playerId,save){return operation(async user=>{
      const query=client.from('kvl_player_bookmarks');
      const result=save?await query.insert({player_id:playerId}):await query.delete().eq('user_id',user.id).eq('player_id',playerId);
      if(save&&result.error?.code==='23505')return;checked(result);
    })},
    async addNote(playerId,title,body){return operation(async()=>checked(await client.from('kvl_player_notes').insert({player_id:playerId,title:String(title).trim(),body:String(body).trim()}).select('id').single()))},
    async editNote(note,title,body){return operation(async user=>{
      const data=checked(await client.from('kvl_player_notes').update({title:String(title).trim(),body:String(body).trim(),revision:note.revision+1}).eq('user_id',user.id).eq('id',note.id).eq('revision',note.revision).select('id'));
      if(data?.length!==1)throw new Error('메모가 다른 곳에서 변경됐습니다. 새로고침 후 다시 확인해 주세요.');
    })},
    async deleteNote(note){return operation(async user=>{
      const data=checked(await client.from('kvl_player_notes').delete().eq('user_id',user.id).eq('id',note.id).eq('revision',note.revision).select('id'));
      if(data?.length!==1)throw new Error('메모가 다른 곳에서 변경됐습니다. 새로고침 후 다시 확인해 주세요.');
    })}
  };
}

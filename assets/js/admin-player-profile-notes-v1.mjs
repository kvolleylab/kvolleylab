import {createClient} from '../vendor/supabase-js-2.84.0.mjs';

const params=new URLSearchParams(location.search);
if(params.get('admin')!=='1') {
  // Public player profile remains unchanged.
} else {
  const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
  const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
  const FUNCTION_NAME='admin-player-workspace';
  const playerId=params.get('id')||'';
  const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=value=>{
    if(!value)return '날짜 미상';
    const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);
    return d.toLocaleString('ko-KR',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  };
  const api=async(action,payload={})=>{
    const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action,...payload}});
    if(error)throw new Error(error.message||'관리자 서버 요청에 실패했습니다.');
    if(!data?.ok)throw new Error(data?.error||'관리자 권한을 확인할 수 없습니다.');
    return data;
  };
  function waitForHero(timeout=12000){
    return new Promise((resolve,reject)=>{
      const found=document.querySelector('#playerArea .pd-hero');if(found){resolve(found);return}
      const root=document.getElementById('playerArea');if(!root){reject(new Error('player_area_missing'));return}
      const observer=new MutationObserver(()=>{const hero=root.querySelector('.pd-hero');if(hero){observer.disconnect();resolve(hero)}});
      observer.observe(root,{childList:true,subtree:true});
      setTimeout(()=>{observer.disconnect();reject(new Error('player_profile_timeout'))},timeout);
    });
  }
  function setBackLink(){
    const back=document.querySelector('.pd-back');
    if(back){back.href='admin-player-workspace.html';back.textContent='← 내 선수 공간으로 돌아가기'}
  }
  function renderNotes(notes){
    const section=document.createElement('section');
    section.className='admin-private-notes';
    section.setAttribute('aria-labelledby','adminPrivateNotesTitle');
    const sorted=[...notes].sort((a,b)=>String(b.created_at||b.updated_at||'').localeCompare(String(a.created_at||a.updated_at||'')));
    const cards=sorted.length?sorted.map(n=>{
      const created=fmt(n.created_at),updated=fmt(n.updated_at);
      const changed=String(n.updated_at||'')&&String(n.updated_at)!==String(n.created_at||'');
      return `<article class="admin-private-note">
        <div class="admin-private-note-head">
          <div><span class="admin-private-season">${esc(n.season||'시즌 미지정')}</span><h3>${esc(n.title||'제목 없음')}</h3></div>
          <div class="admin-private-note-tools"><span class="admin-private-note-date">작성 ${esc(created)}</span><a href="admin-player-workspace.html?editNote=${encodeURIComponent(n.id)}">수정</a></div>
        </div>
        <p>${esc(n.body||'')}</p>
        <footer>${changed?`<span>최근 수정 ${esc(updated)}</span>`:''}</footer>
      </article>`;
    }).join(''):`<div class="admin-private-empty"><strong>이 선수에게 남긴 메모가 없습니다.</strong><span>내 선수 공간에서 메모를 작성하면 이 프로필에 날짜순으로 표시됩니다.</span></div>`;
    section.innerHTML=`<div class="admin-private-notes-head">
      <div><p class="admin-private-eyebrow">PRIVATE · ADMIN ONLY</p><h2 id="adminPrivateNotesTitle">내 비공개 메모 <em>${sorted.length}</em></h2><p>이 내용은 현재 관리자 계정에서만 보이며 공개 선수 프로필에는 표시되지 않습니다.</p></div>
      <div class="admin-private-profile-actions"><a href="admin-player-workspace.html?notePlayer=${encodeURIComponent(playerId)}">새 메모 작성</a><a href="admin-player-workspace.html">내 선수 공간</a></div>
    </div>
    <div class="admin-private-notes-list">${cards}</div>`;
    return section;
  }
  function renderAuthRequired(){
    const section=document.createElement('section');section.className='admin-private-notes';
    section.innerHTML='<div class="admin-private-empty"><strong>관리자 로그인이 필요합니다.</strong><span>내 선수 공간에서 로그인한 뒤 다시 프로필을 열어주세요.</span><a href="admin-player-workspace.html">관리자 로그인으로 이동</a></div>';
    return section;
  }

  (async()=>{
    setBackLink();
    const hero=await waitForHero().catch(()=>null);if(!hero)return;
    try{
      const {data,error}=await supabase.auth.getUser();
      if(error||!data.user){hero.insertAdjacentElement('afterend',renderAuthRequired());return}
      await api('status');
      const response=await api('list_notes');
      const notes=(response.items||[]).filter(n=>n.player_id===playerId);
      hero.insertAdjacentElement('afterend',renderNotes(notes));
    }catch(err){
      console.warn('Admin private profile notes unavailable',err);
      hero.insertAdjacentElement('afterend',renderAuthRequired());
    }
  })();
}

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
  let notesCache=[],notesSection=null;

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
  function ensureDialog(){
    let dialog=document.getElementById('profilePrivateNoteDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='profilePrivateNoteDialog';dialog.className='profile-private-note-dialog';
    dialog.innerHTML=`<form id="profilePrivateNoteForm" method="dialog">
      <div class="profile-note-dialog-head"><div><small>PRIVATE NOTE</small><h2>선수 메모</h2></div><button type="button" data-note-close aria-label="닫기">×</button></div>
      <input id="profileNoteId" type="hidden"><input id="profileNoteRevision" type="hidden">
      <div class="profile-note-form-grid">
        <label>시즌<input id="profileNoteSeason" maxlength="20" value="2026-27" required></label>
        <label>제목<input id="profileNoteTitle" maxlength="120" required></label>
      </div>
      <label>메모<textarea id="profileNoteBody" maxlength="10000" rows="9" required></textarea></label>
      <p class="profile-note-private-copy">이 메모는 현재 로그인한 관리자 계정에만 저장됩니다.</p>
      <div class="profile-note-dialog-actions"><button id="profileNoteDelete" class="profile-note-danger" type="button" hidden>삭제</button><span></span><button type="button" data-note-close>취소</button><button class="profile-note-save" type="submit">저장</button></div>
    </form>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-note-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',ev=>{if(ev.target===dialog)dialog.close()});
    dialog.querySelector('#profilePrivateNoteForm').addEventListener('submit',saveNote);
    dialog.querySelector('#profileNoteDelete').addEventListener('click',deleteNote);
    return dialog;
  }
  function openNewNote(){
    const d=ensureDialog();d.querySelector('#profileNoteId').value='';d.querySelector('#profileNoteRevision').value='';
    d.querySelector('#profileNoteSeason').value='2026-27';d.querySelector('#profileNoteTitle').value='';d.querySelector('#profileNoteBody').value='';
    d.querySelector('#profileNoteDelete').hidden=true;d.showModal();d.querySelector('#profileNoteTitle').focus();
  }
  function openEditNote(id){
    const n=notesCache.find(x=>x.id===id);if(!n)return;
    const d=ensureDialog();d.querySelector('#profileNoteId').value=n.id;d.querySelector('#profileNoteRevision').value=String(n.revision);
    d.querySelector('#profileNoteSeason').value=n.season||'2026-27';d.querySelector('#profileNoteTitle').value=n.title||'';d.querySelector('#profileNoteBody').value=n.body||'';
    d.querySelector('#profileNoteDelete').hidden=false;d.showModal();
  }
  async function saveNote(ev){
    ev.preventDefault();const d=ensureDialog();
    const payload={id:d.querySelector('#profileNoteId').value||null,expected_revision:d.querySelector('#profileNoteRevision').value?Number(d.querySelector('#profileNoteRevision').value):null,player_id:playerId,season:d.querySelector('#profileNoteSeason').value.trim(),title:d.querySelector('#profileNoteTitle').value.trim(),body:d.querySelector('#profileNoteBody').value.trim()};
    if(!payload.season||!payload.title||!payload.body)return;
    const save=d.querySelector('.profile-note-save');save.disabled=true;save.textContent='저장 중…';
    try{await api('save_note',payload);d.close();await reloadNotes()}catch(err){alert(err.message||'메모 저장에 실패했습니다.')}
    finally{save.disabled=false;save.textContent='저장'}
  }
  async function deleteNote(){
    const d=ensureDialog(),id=d.querySelector('#profileNoteId').value,revision=Number(d.querySelector('#profileNoteRevision').value);
    if(!id||!revision||!confirm('이 메모를 삭제할까요?'))return;
    try{await api('delete_note',{id,expected_revision:revision});d.close();await reloadNotes()}catch(err){alert(err.message||'메모 삭제에 실패했습니다.')}
  }
  function renderNotes(){
    if(!notesSection)return;
    const sorted=[...notesCache].sort((a,b)=>String(b.created_at||b.updated_at||'').localeCompare(String(a.created_at||a.updated_at||'')));
    const cards=sorted.length?sorted.map(n=>{
      const created=fmt(n.created_at),updated=fmt(n.updated_at);
      const changed=String(n.updated_at||'')&&String(n.updated_at)!==String(n.created_at||'');
      return `<article class="admin-private-note">
        <div class="admin-private-note-head">
          <div><span class="admin-private-season">${esc(n.season||'시즌 미지정')}</span><h3>${esc(n.title||'제목 없음')}</h3></div>
          <div class="admin-private-note-tools"><span class="admin-private-note-date">작성 ${esc(created)}</span><button type="button" data-profile-edit-note="${esc(n.id)}">수정</button></div>
        </div>
        <p>${esc(n.body||'')}</p>
        <footer>${changed?`<span>최근 수정 ${esc(updated)}</span>`:'<span>작성 후 수정 없음</span>'}</footer>
      </article>`;
    }).join(''):`<div class="admin-private-empty"><strong>이 선수에게 남긴 메모가 없습니다.</strong><span>프로필에서 바로 첫 메모를 작성해보세요.</span></div>`;
    notesSection.innerHTML=`<div class="admin-private-notes-head">
      <div><p class="admin-private-eyebrow">PRIVATE · SIGNED IN</p><h2 id="adminPrivateNotesTitle">내 메모 타임라인 <em>${sorted.length}</em></h2><p>작성 날짜별로 기록이 계속 누적됩니다. 수정해도 최초 작성일은 유지되고 최근 수정일이 별도로 표시됩니다.</p></div>
      <div class="admin-private-notes-actions"><button type="button" data-profile-new-note>새 메모</button><a href="admin-player-workspace.html">내 선수 공간</a></div>
    </div><div class="admin-private-notes-list">${cards}</div>`;
  }
  async function reloadNotes(){
    const response=await api('list_notes');notesCache=(response.items||[]).filter(n=>n.player_id===playerId);renderNotes();
  }
  function createNotesSection(){
    const section=document.createElement('section');section.className='admin-private-notes';section.setAttribute('aria-labelledby','adminPrivateNotesTitle');notesSection=section;return section;
  }
  function renderAuthRequired(){
    const section=document.createElement('section');section.className='admin-private-notes';
    section.innerHTML='<div class="admin-private-empty"><strong>관리자 로그인이 필요합니다.</strong><span>내 선수 공간에서 로그인한 뒤 다시 프로필을 열어주세요.</span><a href="admin-player-workspace.html">관리자 로그인으로 이동</a></div>';
    return section;
  }
  document.addEventListener('click',ev=>{
    const t=ev.target.closest('[data-profile-new-note],[data-profile-edit-note]');if(!t)return;
    if(t.hasAttribute('data-profile-new-note'))openNewNote();else openEditNote(t.dataset.profileEditNote);
  });

  (async()=>{
    setBackLink();const hero=await waitForHero().catch(()=>null);if(!hero)return;
    try{
      const {data,error}=await supabase.auth.getUser();
      if(error||!data.user){hero.insertAdjacentElement('afterend',renderAuthRequired());return}
      await api('status');hero.insertAdjacentElement('afterend',createNotesSection());await reloadNotes();
    }catch(err){console.warn('Admin private profile notes unavailable',err);hero.insertAdjacentElement('afterend',renderAuthRequired())}
  })();
}

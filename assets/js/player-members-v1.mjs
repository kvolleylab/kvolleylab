import {loadMembers} from './member-client-v1.mjs';
import {escapeHTML as e} from './player-workspace-core.mjs';

export async function mountMembers(service){
  if(!service)return;
  const $=id=>document.getElementById(id),playerId=new URLSearchParams(location.search).get('id');
  let catalog=new Map(),state=service.snapshot(),busy=false;
  if(window.KVLPlayerCatalogReady){const rows=await window.KVLPlayerCatalogReady;catalog=new Map(rows.map(p=>[p.playerId,{name:p.nameKo||p.nameEn,gender:p.gender,school:p.school||p.team,height:p.height,position:p.rawPosition}]))}
  const dialog=document.createElement('dialog');dialog.id='memberDialog';dialog.className='kvl-member-dialog';dialog.setAttribute('aria-labelledby','memberDialogTitle');document.body.append(dialog);
  const status=document.createElement('div');status.className='kvl-member-status';status.setAttribute('role','status');status.hidden=true;document.body.append(status);let noticeTimer;
  function notice(text){clearTimeout(noticeTimer);status.textContent=text;status.hidden=false;noticeTimer=setTimeout(()=>status.hidden=true,5500)}
  function name(id){return catalog.get(id)?.name||(id===playerId?document.querySelector('.pd-title')?.textContent?.trim():'')||'선수 정보 확인 중'}
  function idFor(button){return button.dataset.playerId||button.dataset.memberBookmark||new URL(button.closest('article,tr')?.querySelector('a[href*="player.html?"]')?.href||location.href).searchParams.get('id')}
  function saved(id){return state.bookmarks.some(x=>x.player_id===id)}
  function frame(title,body){dialog.innerHTML=`<header><h2 id="memberDialogTitle">${e(title)}</h2><button type="button" data-member-close aria-label="닫기">×</button></header>${body}`;if(!dialog.open)dialog.showModal()}
  function account(){
    if(state.user){frame('내 계정',`<p>${e(state.user.email)}</p><p>관심선수와 메모는 로그인한 본인만 볼 수 있습니다.</p><button class="kvl-member-button" data-member-logout>이 브라우저에서 로그아웃</button>`);return}
    frame('이메일로 로그인',`<p>이메일로 보내드리는 링크를 열면 로그인됩니다. 처음 이용하는 이메일은 회원으로 등록됩니다.</p><form id="memberLoginForm"><label>이메일<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="name@example.com"></label><button class="kvl-member-button" type="submit">로그인 링크 받기</button><p role="status" id="memberFormStatus"></p></form><p class="kvl-member-caption">이메일은 로그인에 사용하며, 개인 메모는 다른 회원에게 공개되지 않습니다.</p>`);
  }
  function noteForm(id,note=null){
    if(!state.user)return account();
    frame(`${name(id)} · ${note?'메모 수정':'새 메모'}`,`<form id="memberNoteForm" data-player-id="${e(id)}" data-note-id="${e(note?.id||'')}"><label>제목<input name="title" maxlength="120" value="${e(note?.title||'')}" placeholder="관찰한 내용을 간단히 적어 주세요"></label><label>개인 메모<textarea name="body" maxlength="6000" required rows="7" placeholder="이 메모는 본인만 볼 수 있습니다.">${e(note?.body||'')}</textarea></label><p class="kvl-member-caption">선수의 공개 프로필이나 Draft Hub에는 표시되지 않습니다.</p><button class="kvl-member-button" type="submit">${note?'수정 저장':'메모 저장'}</button><p role="status" id="memberFormStatus"></p></form>`);
    // Retain the revision actually shown to the editor; don't overwrite concurrent edits.
    dialog.noteRevision=note?{...note}:null;
  }
  function noteHTML(note){return `<article class="kvl-private-note"><header><a href="player.html?id=${encodeURIComponent(note.player_id)}">${e(name(note.player_id))}</a><time>${e(new Date(note.updated_at).toLocaleDateString('ko-KR'))}</time></header><h3>${e(note.title||'관찰 메모')}</h3><p class="kvl-note-body">${e(note.body)}</p><footer><button type="button" data-member-edit="${e(note.id)}">수정</button><button type="button" data-member-delete="${e(note.id)}">삭제</button></footer></article>`}
  function privateBody(target,kind){
    if(!target)return;
    if(state.loading){target.innerHTML='<div class="kvl-member-empty">내 기록을 확인하고 있습니다.</div>';return}
    if(!state.user){target.innerHTML='<div class="kvl-member-empty"><h3>로그인하고 내 선수 기록을 모아보세요</h3><p>관심선수와 메모는 본인만 볼 수 있습니다.</p><button type="button" class="kvl-member-button" data-member-login>이메일로 로그인</button></div>';return}
    if(kind==='tracking'){
      target.innerHTML=state.bookmarks.length?`<div class="kvl-member-grid">${state.bookmarks.map(b=>{const p=catalog.get(b.player_id);return `<article class="kvl-watch-card" data-gender="${p?.gender||'M'}"><a href="player.html?id=${encodeURIComponent(b.player_id)}"><h3>${e(name(b.player_id))}</h3><p>${e(p?.school||'소속 미확인')}</p><p>${e(p?.position||'포지션 미확인')} · ${p?.height?e(p.height)+'cm':'키 확인 불가'}</p></a><div><button type="button" data-member-bookmark="${e(b.player_id)}" aria-pressed="true">관심 해제</button><button type="button" data-member-new-note="${e(b.player_id)}">메모 작성</button></div></article>`}).join('')}</div>`:'<div class="kvl-member-empty"><h3>아직 관심선수가 없습니다</h3><p>선수 카드의 책갈피를 눌러 추가해 보세요.</p></div>';
    }else target.innerHTML=state.notes.length?`<div class="kvl-member-grid">${state.notes.map(noteHTML).join('')}</div>`:'<div class="kvl-member-empty"><h3>아직 작성한 메모가 없습니다</h3><p>선수 프로필 또는 내 추적 선수에서 메모를 작성할 수 있습니다.</p></div>';
  }
  function profile(){
    const node=$('playerMemberNotice');if(!node||!playerId||!document.querySelector('.pd-title'))return;
    node.classList.add('kvl-member-profile');
    const signature=JSON.stringify([state.user?.id,state.loading,saved(playerId),state.notes.filter(n=>n.player_id===playerId).map(n=>[n.id,n.revision])]);
    if(node.dataset.memberState===signature)return;node.dataset.memberState=signature;
    node.innerHTML=`<h2>내 선수 기록</h2><p>본인에게만 보이는 관심선수와 메모입니다.</p>${state.user?`<div class="kvl-member-actions"><button type="button" data-member-bookmark="${e(playerId)}" aria-pressed="${saved(playerId)}">${saved(playerId)?'관심선수 해제':'관심선수 등록'}</button><button type="button" class="kvl-member-button" data-member-new-note="${e(playerId)}">메모 작성</button><button type="button" data-member-login>내 계정</button></div><div>${state.notes.filter(n=>n.player_id===playerId).map(noteHTML).join('')}</div>`:'<button type="button" class="kvl-member-button" data-member-login>로그인하고 기록하기</button>'}`;
  }
  function buttons(){
    for(const b of document.querySelectorAll('[data-member-unavailable],[data-save],[data-member-bookmark]')){const id=idFor(b);if(!id)continue;b.dataset.playerId=id;const active=!!state.user&&saved(id);b.setAttribute('aria-pressed',String(active));b.classList.toggle('kvl-is-saved',active);b.setAttribute('aria-label',`${name(id)} ${active?'관심선수 해제':'관심선수 등록'}`)}
    for(const id of ['accountButton','daAccount'])if($(id))$(id).textContent=state.loading?'계정 확인 중':state.user?'내 계정':'로그인';
    document.querySelectorAll('.private-label').forEach(x=>x.textContent='본인만 열람');
  }
  function render(){buttons();privateBody($('trackingBody'),'tracking');privateBody($('notesBody'),'notes');profile()}
  service.subscribe(next=>{const previousUser=state.user?.id;state=next;if(previousUser&&previousUser!==next.user?.id){dialog.innerHTML='';dialog.close()}render()});
  for(const id of ['playerGrid','daResultBody'])if($(id))new MutationObserver(buttons).observe($(id),{childList:true});
  if($('playerArea'))new MutationObserver(profile).observe($('playerArea'),{childList:true,subtree:true});
  async function action(fn){if(busy)return;busy=true;try{await fn()}catch(error){notice(error.message||'작업을 완료하지 못했습니다.')}finally{busy=false}}
  document.addEventListener('click',event=>{
    const t=event.target.closest('button,a');if(!t)return;
    if(t.dataset.view){setTimeout(render,0);return}
    const member=t.matches('#accountButton,#daAccount,[data-account-open],[data-member-unavailable],[data-save],[data-member-login],[data-member-bookmark],[data-member-new-note],[data-member-edit],[data-member-delete],[data-member-confirm-delete],[data-member-close],[data-member-logout]');
    if(!member)return;event.preventDefault();event.stopImmediatePropagation();
    if(t.hasAttribute('data-member-close')){dialog.close();return}
    if(t.hasAttribute('data-member-logout')){action(async()=>{await service.logout();dialog.close();notice('로그아웃했습니다.')});return}
    if(t.matches('[data-member-unavailable],[data-save],[data-member-bookmark]')){const id=idFor(t);if(!state.user)return account();if(id)action(async()=>{await service.setBookmark(id,!saved(id));notice(saved(id)?'관심선수에 추가했습니다.':'관심선수에서 해제했습니다.')});return}
    if(t.dataset.memberNewNote)return noteForm(t.dataset.memberNewNote);
    if(t.dataset.memberEdit){const note=state.notes.find(n=>n.id===t.dataset.memberEdit);if(note)noteForm(note.player_id,note);return}
    if(t.dataset.memberDelete){const note=state.notes.find(n=>n.id===t.dataset.memberDelete);if(note){frame('메모 삭제',`<p>“${e(note.title||'관찰 메모')}”를 삭제할까요?</p><button type="button" class="kvl-member-button" data-member-confirm-delete="${e(note.id)}">삭제</button> <button type="button" data-member-close>취소</button>`);dialog.noteRevision={...note}}return}
    if(t.dataset.memberConfirmDelete){const note=dialog.noteRevision;if(note?.id===t.dataset.memberConfirmDelete)action(async()=>{await service.deleteNote(note);dialog.close();notice('메모를 삭제했습니다.')});return}
    account();
  },true);
  dialog.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;busy=true;const form=event.target,submit=form.querySelector('[type="submit"]'),output=$('memberFormStatus'),fields=new FormData(form);submit.disabled=true;
    try{
      if(form.id==='memberLoginForm'){await service.login(fields.get('email'));output.textContent='이메일의 로그인 링크를 열어 주세요. 이 브라우저에서 링크를 열면 로그인됩니다.'}
      else if(form.id==='memberNoteForm'){
        if(!String(fields.get('body')).trim())throw new Error('메모 내용을 입력해 주세요.');
        if(dialog.noteRevision)await service.editNote(dialog.noteRevision,fields.get('title'),fields.get('body'));
        else await service.addNote(form.dataset.playerId,fields.get('title'),fields.get('body'));
        dialog.close();notice('메모를 저장했습니다.');
      }
    }catch(error){if(output)output.textContent=error.message||'요청을 완료하지 못했습니다.'}finally{busy=false;if(submit.isConnected)submit.disabled=false}
  });
  let backdrop=false;const outside=event=>{const r=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)};
  dialog.addEventListener('pointerdown',event=>backdrop=outside(event));dialog.addEventListener('click',event=>{if(backdrop&&outside(event))dialog.close();backdrop=false});
  dialog.addEventListener('close',()=>{dialog.innerHTML='';dialog.noteRevision=null});
  render();
}
loadMembers().then(mountMembers).catch(()=>{ /* Configuration or server failure preserves the existing fail-closed public UI. */ });

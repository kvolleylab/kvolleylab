import {createClient} from '../vendor/supabase-js-2.84.0.mjs';
import {searchPlayers,escapeHTML as e} from './player-workspace-core.mjs';

const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
const FUNCTION_NAME='admin-player-workspace';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
let players=[],byId=new Map(),bookmarks=new Set(),notes=[],currentView='search';

function msg(text='',error=false){const el=$('workspaceMessage');el.textContent=text;el.classList.toggle('error',error)}
function loginMsg(text='',error=false){const el=$('loginMessage');el.textContent=text;el.classList.toggle('error',error)}
function normalize(p){return {...p,id:p.playerId||p.id,name:p.nameKo||p.name||p.nameEn||p.playerId,team:p.team||p.club||'',school:p.school||'',rawPosition:p.rawPosition||p.position||'',gender:p.gender||''}}
function pname(id){return byId.get(id)?.name||id}
function affiliation(p){return p?.school||p?.team||p?.club||'소속 미확인'}
function affiliationGrade(p){
  const base=affiliation(p),grade=p?.gradeLabel||(p?.grade?String(p.grade)+'학년':'');
  return grade&&base!=='소속 미확인'?base+' · '+grade:base;
}
function playerMeta(p){return [affiliationGrade(p),p?.rawPosition||'포지션 미확인',p?.gender?(p.gender==='W'?'여자':'남자'):''].filter(Boolean)}
function profileHref(id){return 'player.html?id='+encodeURIComponent(id)+'&admin=1&return='+encodeURIComponent('admin-player-workspace.html')}

async function api(action,payload={}){
  const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action,...payload}});
  if(error)throw new Error(error.message||'관리자 서버 요청에 실패했습니다.');
  if(!data?.ok)throw new Error(data?.error||'관리자 권한을 확인할 수 없습니다.');
  return data;
}
function updateCounts(){
  const bm=bookmarks.size,nt=notes.length;
  $('bookmarkCount').textContent=String(bm);$('noteCount').textContent=String(nt);
  $('bookmarkTabCount').textContent=bm?String(bm):'';$('noteTabCount').textContent=nt?String(nt):'';
  $('analysisBookmarkCount').textContent=String(bm);$('analysisNoteCount').textContent=String(nt);
}
function updateNoteSeasonOptions(){
  const select=$('noteSeasonFilter'),previous=select.value;
  const seasons=[...new Set(notes.map(n=>n.season).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ko'));
  select.innerHTML='<option value="">전체 시즌</option>'+seasons.map(s=>`<option value="${e(s)}">${e(s)}</option>`).join('');
  select.value=seasons.includes(previous)?previous:'';
}
async function refreshState(){
  const [status,bm,ns]=await Promise.all([api('status'),api('list_bookmarks'),api('list_notes')]);
  bookmarks=new Set((bm.items||[]).map(x=>x.player_id));notes=ns.items||[];
  updateCounts();updateNoteSeasonOptions();renderCurrent();
}
function showWorkspace(user){$('accountEmail').textContent=user.email||'관리자';$('loginView').hidden=true;$('workspaceView').hidden=false}
function showLogin(){$('workspaceView').hidden=true;$('loginView').hidden=false;$('password').value=''}

function row(p){
  const saved=bookmarks.has(p.id);
  const meta=playerMeta(p);
  return `<article class="player-row">
    <div class="player-avatar" aria-hidden="true">${e((p.name||'K').slice(0,1))}</div>
    <div class="player-main">
      <div class="player-title"><strong>${e(p.name)}</strong></div>
      <div class="player-meta">${meta.map(x=>`<span>${e(x)}</span>`).join('')}</div>
    </div>
    <div class="row-actions">
      <button class="bookmark ${saved?'saved':''}" type="button" data-bookmark="${e(p.id)}">${saved?'★ 관심선수':'☆ 관심선수'}</button>
      <button class="note-button" type="button" data-note-player="${e(p.id)}">메모 작성</button>
      <a class="profile-link" href="${e(profileHref(p.id))}">프로필 보기</a>
    </div>
  </article>`;
}
function renderSearch(){
  if(!players.length)return;
  const result=searchPlayers(players,{q:$('playerQuery').value.trim(),gender:$('genderFilter').value}).slice(0,80);
  $('searchCount').textContent=`검색 결과 ${result.length.toLocaleString('ko-KR')}명${result.length===80?' · 최대 80명 표시':''}`;
  $('searchResults').innerHTML=result.length?result.map(row).join(''):'<div class="empty">조건에 맞는 선수가 없습니다.</div>';
}
function renderBookmarks(){
  const rows=[...bookmarks].map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  $('bookmarkResults').innerHTML=rows.length?rows.map(row).join(''):'<div class="empty"><strong>아직 관심선수가 없습니다.</strong><span>선수 검색에서 ☆ 관심선수를 눌러 추적 목록을 만들어보세요.</span></div>';
}
function filteredNotes(){
  const q=$('noteQuery').value.trim().toLocaleLowerCase(),season=$('noteSeasonFilter').value;
  return notes.filter(n=>{
    const p=byId.get(n.player_id),hay=[n.title,n.body,n.season,p?.name,affiliation(p),n.player_id].join(' ').toLocaleLowerCase();
    return (!q||hay.includes(q))&&(!season||n.season===season);
  });
}
function renderNotes(){
  const list=filteredNotes();$('noteFilterCount').textContent=`${list.length.toLocaleString('ko-KR')}개 표시`;
  $('noteResults').innerHTML=list.length?list.map(n=>{
    const p=byId.get(n.player_id),meta=playerMeta(p),updated=new Date(n.updated_at).toLocaleString('ko-KR');
    return `<article class="note-card">
      <div class="note-card-top">
        <div class="note-player">
          <span class="season-pill">${e(n.season||'시즌 미지정')}</span>
          <strong>${e(pname(n.player_id))}</strong>
          
        </div>
        <button type="button" data-edit-note="${e(n.id)}">수정</button>
      </div>
      <div class="note-player-meta">${meta.map(x=>`<span>${e(x)}</span>`).join('')}</div>
      <h3>${e(n.title)}</h3>
      <p>${e(n.body)}</p>
      <footer><span>최근 수정 ${e(updated)}</span><span>revision ${e(n.revision)}</span></footer>
    </article>`;
  }).join(''):'<div class="empty"><strong>조건에 맞는 메모가 없습니다.</strong><span>검색어 또는 시즌 필터를 바꾸거나 선수 검색에서 새 메모를 작성하세요.</span></div>';
}
function renderAnalysis(){updateCounts()}
function renderCurrent(){
  if(currentView==='search')renderSearch();
  else if(currentView==='bookmarks')renderBookmarks();
  else if(currentView==='notes')renderNotes();
  else renderAnalysis();
}
function changeView(next){
  if(!['search','bookmarks','notes','analysis'].includes(next))return;
  currentView=next;
  for(const name of ['search','bookmarks','notes','analysis'])$(name+'Pane').hidden=name!==next;
  document.querySelectorAll('.tabs [data-view]').forEach(b=>{const active=b.dataset.view===next;b.classList.toggle('active',active);active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  renderCurrent();window.scrollTo({top:Math.max(0,document.querySelector('.tabs').offsetTop-90),behavior:'smooth'});
}

async function toggleBookmark(id){
  msg(bookmarks.has(id)?'관심 선수에서 해제하는 중…':'관심 선수에 등록하는 중…');
  try{
    const d=await api('toggle_bookmark',{player_id:id});
    d.saved?bookmarks.add(id):bookmarks.delete(id);updateCounts();renderCurrent();
    msg(d.saved?'관심 선수에 등록했습니다.':'관심 선수에서 해제했습니다.');
  }catch(err){msg(err.message,true)}
}
function setNoteMeta(id){
  const p=byId.get(id),parts=playerMeta(p);$('notePlayerMeta').textContent=parts.join(' · ')||'선수 개인 기록';
}
function openPlayerNote(id){
  const p=byId.get(id);
  $('noteId').value='';$('noteRevision').value='';$('notePlayer').value=id;$('notePlayerId').textContent='';
  $('notePlayerName').textContent=(p?.name||id)+' · 선수 메모';setNoteMeta(id);
  $('noteSeason').value='2026-27';$('noteTitle').value='';$('noteBody').value='';$('deleteNoteButton').hidden=true;$('noteDialog').showModal();$('noteTitle').focus();
}
function openNote(id){
  const n=notes.find(x=>x.id===id);if(!n)return;
  $('noteId').value=n.id;$('noteRevision').value=String(n.revision);$('notePlayer').value=n.player_id;$('notePlayerId').textContent='';
  $('notePlayerName').textContent=pname(n.player_id)+' · 선수 메모';setNoteMeta(n.player_id);
  $('noteSeason').value=n.season||'2026-27';$('noteTitle').value=n.title;$('noteBody').value=n.body;$('deleteNoteButton').hidden=false;$('noteDialog').showModal();
}
function closeNote(){$('noteDialog').close()}

$('loginForm').addEventListener('submit',async ev=>{
  ev.preventDefault();$('loginButton').disabled=true;loginMsg('관리자 계정을 확인하는 중…');
  try{
    const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;
    const {data,error:userError}=await supabase.auth.getUser();if(userError||!data.user)throw userError||new Error('로그인 계정을 확인할 수 없습니다.');
    await api('status');showWorkspace(data.user);loginMsg('');await loadCatalog();await refreshState();msg('관리자 로그인이 확인됐습니다.');
  }catch(err){await supabase.auth.signOut().catch(()=>{});showLogin();loginMsg(err.message||'로그인에 실패했습니다.',true)}
  finally{$('loginButton').disabled=false}
});
$('logoutButton').addEventListener('click',async()=>{msg('로그아웃 중…');await supabase.auth.signOut();bookmarks.clear();notes=[];showLogin();loginMsg('로그아웃했습니다.')});
$('searchForm').addEventListener('submit',ev=>{ev.preventDefault();renderSearch()});
$('genderFilter').addEventListener('change',renderSearch);
let debounce;$('playerQuery').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(renderSearch,120)});
$('noteQuery').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(renderNotes,120)});
$('noteSeasonFilter').addEventListener('change',renderNotes);
document.querySelector('.tabs').addEventListener('click',ev=>{const b=ev.target.closest('[data-view]');if(b)changeView(b.dataset.view)});
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.bookmark)toggleBookmark(b.dataset.bookmark);
  if(b.dataset.notePlayer)openPlayerNote(b.dataset.notePlayer);
  if(b.dataset.editNote)openNote(b.dataset.editNote);
});
$('noteClose').addEventListener('click',closeNote);$('cancelNoteButton').addEventListener('click',closeNote);
$('noteForm').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const payload={id:$('noteId').value||null,expected_revision:$('noteRevision').value?Number($('noteRevision').value):null,player_id:$('notePlayer').value,season:$('noteSeason').value.trim(),title:$('noteTitle').value.trim(),body:$('noteBody').value.trim()};
  if(!payload.title||!payload.body)return;
  msg('메모 저장 중…');
  try{await api('save_note',payload);closeNote();await refreshState();changeView('notes');msg('메모를 저장했습니다.')}catch(err){msg(err.message,true)}
});
$('deleteNoteButton').addEventListener('click',async()=>{
  const id=$('noteId').value;if(!id||!confirm('이 메모를 삭제할까요?'))return;
  msg('메모 삭제 중…');
  try{await api('delete_note',{id,expected_revision:Number($('noteRevision').value)});closeNote();await refreshState();changeView('notes');msg('메모를 삭제했습니다.')}catch(err){msg(err.message,true)}
});

async function loadCatalog(){
  if(players.length)return;
  const catalog=await window.KVLPlayerCatalogReady;if(!Array.isArray(catalog))throw new Error('선수 DB를 불러올 수 없습니다.');
  players=catalog.map(normalize).filter(p=>p.id);byId=new Map(players.map(p=>[p.id,p]));
  $('catalogStatus').textContent=`공개 DB ${players.length.toLocaleString('ko-KR')}명`;renderSearch();
}
async function restoreSession(){
  try{
    const {data,error}=await supabase.auth.getUser();
    if(error||!data.user){showLogin();return}
    await api('status');showWorkspace(data.user);await loadCatalog();await refreshState();msg('관리자 세션을 복원했습니다.');
  }catch{await supabase.auth.signOut().catch(()=>{});showLogin()}
}
restoreSession();
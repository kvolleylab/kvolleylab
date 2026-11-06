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

async function api(action,payload={}){
  const {data,error}=await supabase.functions.invoke(FUNCTION_NAME,{body:{action,...payload}});
  if(error)throw new Error(error.message||'관리자 서버 요청에 실패했습니다.');
  if(!data?.ok)throw new Error(data?.error||'관리자 권한을 확인할 수 없습니다.');
  return data;
}
async function refreshState(){
  const [status,bm,ns]=await Promise.all([api('status'),api('list_bookmarks'),api('list_notes')]);
  bookmarks=new Set((bm.items||[]).map(x=>x.player_id));notes=ns.items||[];
  $('bookmarkCount').textContent=String(status.bookmark_count??bookmarks.size);
  $('noteCount').textContent=String(status.note_count??notes.length);
  renderCurrent();
}
function showWorkspace(user){$('accountEmail').textContent=user.email||'관리자';$('loginView').hidden=true;$('workspaceView').hidden=false}
function showLogin(){$('workspaceView').hidden=true;$('loginView').hidden=false;$('password').value=''}

function row(p){
  const saved=bookmarks.has(p.id);
  return `<article class="player-row"><div class="player-main"><strong>${e(p.name)}</strong><div class="player-meta"><span>${e(affiliation(p))}</span><span>${e(p.rawPosition||'포지션 미확인')}</span>${p.gender?`<span>${p.gender==='W'?'여자':'남자'}</span>`:''}</div><div class="player-id">${e(p.id)}</div></div><div class="row-actions"><button class="bookmark ${saved?'saved':''}" type="button" data-bookmark="${e(p.id)}">${saved?'★ 관심선수 해제':'☆ 관심선수'}</button><button class="note-button" type="button" data-note-player="${e(p.id)}">메모 작성</button></div></article>`;
}
function renderSearch(){
  if(!players.length)return;
  const result=searchPlayers(players,{q:$('playerQuery').value.trim(),gender:$('genderFilter').value}).slice(0,80);
  $('searchCount').textContent=`검색 결과 ${result.length.toLocaleString('ko-KR')}명${result.length===80?' · 최대 80명 표시':''}`;
  $('searchResults').innerHTML=result.length?result.map(row).join(''):'<div class="empty">조건에 맞는 선수가 없습니다.</div>';
}
function renderBookmarks(){
  const rows=[...bookmarks].map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  $('bookmarkResults').innerHTML=rows.length?rows.map(row).join(''):'<div class="empty">등록한 관심 선수가 없습니다.</div>';
}
function renderNotes(){
  $('noteResults').innerHTML=notes.length?notes.map(n=>`<article class="note-card"><div class="note-card-head"><div><small>${e(n.season||'시즌 미지정')} · ${e(pname(n.player_id))}</small><h3>${e(n.title)}</h3><div class="player-id">${e(n.player_id)}</div></div><button type="button" data-edit-note="${e(n.id)}">수정</button></div><p>${e(n.body)}</p><small class="muted">수정 ${e(new Date(n.updated_at).toLocaleString('ko-KR'))} · revision ${e(n.revision)}</small></article>`).join(''):'<div class="empty">작성한 개인 메모가 없습니다.</div>';
}
function renderCurrent(){currentView==='search'?renderSearch():currentView==='bookmarks'?renderBookmarks():renderNotes()}
function changeView(next){currentView=next;for(const name of ['search','bookmarks','notes'])$(name+'Pane').hidden=name!==next;document.querySelectorAll('.tabs [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===next));renderCurrent()}

async function toggleBookmark(id){
  msg(bookmarks.has(id)?'관심 선수에서 해제하는 중…':'관심 선수에 등록하는 중…');
  try{const d=await api('toggle_bookmark',{player_id:id});d.saved?bookmarks.add(id):bookmarks.delete(id);$('bookmarkCount').textContent=String(bookmarks.size);renderCurrent();msg(d.saved?'관심 선수에 등록했습니다.':'관심 선수에서 해제했습니다.')}catch(err){msg(err.message,true)}
}
function openPlayerNote(id){const p=byId.get(id);$('noteId').value='';$('noteRevision').value='';$('notePlayer').value=id;$('notePlayerId').textContent=id;$('notePlayerName').textContent=(p?.name||id)+' · 선수 메모';$('noteSeason').value='2026-27';$('noteTitle').value='';$('noteBody').value='';$('deleteNoteButton').hidden=true;$('noteDialog').showModal()}
function openNote(id){const n=notes.find(x=>x.id===id);if(!n)return;$('noteId').value=n.id;$('noteRevision').value=String(n.revision);$('notePlayer').value=n.player_id;$('notePlayerId').textContent=n.player_id;$('notePlayerName').textContent=pname(n.player_id)+' · 선수 메모';$('noteSeason').value=n.season||'2026-27';$('noteTitle').value=n.title;$('noteBody').value=n.body;$('deleteNoteButton').hidden=false;$('noteDialog').showModal()}
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
document.querySelector('.tabs').addEventListener('click',ev=>{const b=ev.target.closest('[data-view]');if(b)changeView(b.dataset.view)});
document.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.bookmark)toggleBookmark(b.dataset.bookmark);if(b.dataset.notePlayer)openPlayerNote(b.dataset.notePlayer);if(b.dataset.editNote)openNote(b.dataset.editNote)});
$('noteClose').addEventListener('click',closeNote);$('cancelNoteButton').addEventListener('click',closeNote);
$('noteForm').addEventListener('submit',async ev=>{
  ev.preventDefault();const payload={id:$('noteId').value||null,expected_revision:$('noteRevision').value?Number($('noteRevision').value):null,player_id:$('notePlayer').value,season:$('noteSeason').value.trim(),title:$('noteTitle').value.trim(),body:$('noteBody').value.trim()};if(!payload.title||!payload.body)return;
  msg('메모 저장 중…');try{await api('save_note',payload);closeNote();await refreshState();changeView('notes');msg('메모를 저장했습니다.')}catch(err){msg(err.message,true)}
});
$('deleteNoteButton').addEventListener('click',async()=>{const id=$('noteId').value;if(!id||!confirm('이 메모를 삭제할까요?'))return;msg('메모 삭제 중…');try{await api('delete_note',{id,expected_revision:Number($('noteRevision').value)});closeNote();await refreshState();changeView('notes');msg('메모를 삭제했습니다.')}catch(err){msg(err.message,true)}});

async function loadCatalog(){
  if(players.length)return;const catalog=await window.KVLPlayerCatalogReady;if(!Array.isArray(catalog))throw new Error('선수 DB를 불러올 수 없습니다.');
  players=catalog.map(normalize).filter(p=>p.id);byId=new Map(players.map(p=>[p.id,p]));$('catalogStatus').textContent=`공개 DB ${players.length.toLocaleString('ko-KR')}명`;renderSearch();
}
async function restoreSession(){
  try{const {data,error}=await supabase.auth.getUser();if(error||!data.user){showLogin();return}await api('status');showWorkspace(data.user);await loadCatalog();await refreshState();msg('관리자 세션을 복원했습니다.')}catch{await supabase.auth.signOut().catch(()=>{});showLogin()}
}
restoreSession();
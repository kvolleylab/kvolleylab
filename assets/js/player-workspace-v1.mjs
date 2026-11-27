// Approved B workspace UI, connected to the unchanged production data pipeline.
import {createClient} from '../vendor/supabase-js-2.84.0.mjs';
import {LEVELS,searchPlayers,escapeHTML as e} from './player-workspace-core.mjs?v=20261111-pro-1';
import {loadDraftIndex,loadDraftSeason,validateAgainstCatalog} from './draft-history-v1.mjs';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const paths={cards:'<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',note:'<path d="M14 4H5v17h14v-9M8 9h3M8 13h3M8 17h7m-1-7 7-7-3-3-7 7v3z"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',sliders:'<path d="M3 6h7m4 0h7M3 12h12m4 0h2M3 18h3m4 0h11M10 3v6M15 9v6M6 15v6"/>',flask:'<path d="M9 3h6M10 3v7L4 20h16l-6-10V3M8 14h8"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',plus:'<path d="M12 4v16M4 12h16"/>',shirt:'<path d="m5 5 5-2c0 3 4 3 4 0l5 2 4 7-5 3v9H6v-9l-5-3z" transform="translate(1 1) scale(.9)"/><path d="M10 12h4M12 12v6"/>',check:'<path d="m5 12 4 4L19 6"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[n]||paths.user}</svg>`;
const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
const PRIVATE_FUNCTION='admin-player-workspace';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let players=[],byId=new Map(),draftRows=[],draftIndex=null,draftLoadFailed=false,limit=12,layout=params.get('layout')==='compact'?'compact':'cards',view='search',lastFocus=null;
let bookmarks=new Set(),notes=[],memberReady=false,noteQuery='',noteSeason='';
const UI_KEY='kvl-player-workspace-public-ui-v1';
function persist(){setQueryURL()}
function profileHref(id){const query=new URLSearchParams({id,return:location.pathname+location.search});if(window.KVLPlayerIdCollisionV1?.isConflict(id)&&byId.get(id)?.level==='professional')query.set('scope','pro');return 'player.html?'+query}
function formatDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?String(value||''):d.toLocaleString('ko-KR',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
async function privateApi(action,payload={}){const {data,error}=await supabase.functions.invoke(PRIVATE_FUNCTION,{body:{action,...payload}});if(error||!data?.ok)throw new Error(data?.error||error?.message||'개인 기능을 불러올 수 없습니다.');return data}
function updateMemberBadges(){$('savedBadge').textContent=bookmarks.size?String(bookmarks.size):'';$('notesBadge').textContent=notes.length?String(notes.length):'';if(memberReady){$('memberSummary').hidden=false;$('memberSummary').innerHTML=`<div><h2>내 선수 기록</h2><p>관심선수와 개인 메모가 이 페이지에 바로 연결됩니다.</p></div><div class="member-metrics"><button type="button" data-view="tracking"><strong>${bookmarks.size}</strong>관심선수</button><button type="button" data-view="notes"><strong>${notes.length}</strong>메모</button></div>`;}}
function playerAffiliation(p){return p?.school||p?.team||'소속 미확인'}
function compareButton(p){return p.limited||window.KVLPlayerIdCollisionV1?.isConflict(p.id)?'':`<button class="compare-button" type="button" data-compare-id="${e(p.id)}" data-compare-name="${e(p.name)}">비교 추가</button>`}
function saveButton(p,iconOnly=false){if(window.KVLPlayerIdCollisionV1?.isConflict(p.id))return '';const saved=bookmarks.has(p.id);return `<button class="save-button ${iconOnly?'icon-only':''} ${saved?'saved':''}" type="button" data-save-player="${e(p.id)}" aria-pressed="${saved?'true':'false'}" aria-label="${e(p.name)} ${saved?'관심선수 해제':'관심선수 등록'}">${icon('bookmark')}${iconOnly?'':(saved?'관심선수':'관심선수')}</button>`}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(x=>{x.innerHTML=icon(x.dataset.icon)})}
function getFilters(){const data=new FormData($('filters')),filters=Object.fromEntries(data);delete filters.grade;return {...filters,q:$('playerSearch').value,grades:data.getAll('grade')}}
function updateGradeCaption(){const grades=getFilters().grades;$('gradeSelection').textContent=grades.length?grades.join('·')+'학년':'전체 학년';document.querySelector('[data-all-grades]').hidden=!grades.length}
function syncDependentFilters(){
 const level=$('filters').elements.level.value,select=$('schoolFilter'),previous=select.value;
 const schools=[...new Set(players.filter(p=>!level||p.level===level).map(p=>p.school).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
 const label=level==='professional'?'모든 프로팀':level==='high_school'?'모든 고등학교':level==='university'?'모든 대학교':level==='middle_school'?'모든 중학교':'모든 학교·팀';
 select.innerHTML=`<option value="">${schools.length?label:'해당 학교 없음'}</option>${schools.map(name=>`<option>${e(name)}</option>`).join('')}`;
 select.value=schools.includes(previous)?previous:'';select.disabled=!schools.length;
 const fourth=document.querySelector('[name="grade"][value="4"]');fourth.disabled=['high_school','middle_school'].includes(level);if(fourth.disabled)fourth.checked=false;fourth.closest('label').hidden=fourth.disabled;
 updateGradeCaption();
}
function verifiedHighlights(p){return (p.highlights||[]).filter(h=>h.verification==='verified_official'&&['national','award'].includes(h.kind))}
function careerBadges(p){const entries=verifiedHighlights(p);return entries.length?`<span class="card-highlights">${entries.slice(0,2).map(h=>`<span class="career-badge" title="${e(h.event)}">${e(h.label)}</span>`).join('')}${entries.length>2?`<span class="career-more">외 ${entries.length-2}개 이력</span>`:''}</span>`:''}
function avatar(p){return `<span class="avatar" aria-label="사진 미등록">${icon('shirt')}<span class="position">${e(p.position||'KVL')}</span></span>`}
function pageSize(){return layout==='compact'?36:12}
function syncLayout(){document.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===layout)));$('playerGrid').classList.toggle('compact-grid',layout==='compact')}
function setLayout(next){if(!['cards','compact'].includes(next)||layout===next)return;layout=next;limit=pageSize();persist();renderSearch();syncLayout();document.querySelector(`#${view}View [data-layout="${layout}"]`)?.focus({preventScroll:true})}
function compactPlayer(p){const school=p.school||p.team||'소속 미확인';return `<article class="player-card player-tile ${p.gender==='W'?'player-women':'player-men'}"><a href="${e(profileHref(p.id))}" class="card-profile tile-profile" data-profile="${e(p.id)}" aria-label="${e(p.name)} 공개 프로필 보기"><div class="tile-identity"><h3 class="tile-name">${e(p.name)}</h3><span class="tile-school" title="${e(school)}">${e(school)}</span></div><span class="tile-facts"><span class="tile-position"><span class="sr-only">포지션 </span>${e(p.rawPosition||'미확인')}</span><span class="tile-height"><span class="sr-only">신장 </span>${p.height?`${e(p.height)} <small>cm</small>`:'키 확인 불가'}</span></span></a>${saveButton(p,true)}</article>`}
function playerCard(p){if(layout==='compact')return compactPlayer(p);return `<article class="player-card ${p.gender==='W'?'player-women':'player-men'}"><a href="${e(profileHref(p.id))}" class="card-profile" data-profile="${e(p.id)}" aria-label="${e(p.name)} 공개 프로필 보기"><div class="card-head"><div class="card-identity">${avatar(p)}<div class="card-name"><h3>${e(p.name)}</h3>${p.nameEn?`<small>${e(p.nameEn)}</small>`:''}<div class="card-labels"><span>${e(LEVELS[p.level])}</span><span class="gender-badge">${p.gender==='W'?'여자':'남자'}</span>${p.limited?'<span>연결 정보</span>':''}</div></div></div><div class="card-affiliation"><span class="affiliation-label">${p.school?'학교':'소속'} · 자료 기준</span><strong>${e(p.school||p.team||'소속 미확인')}</strong>${careerBadges(p)}</div></div><div class="card-meta"><span>포지션<b>${e(p.rawPosition||'미확인')}</b></span><span>신장<b>${p.height?`${e(p.height)} <small>cm</small>`:'미확인'}</b></span><span>출생연도<b>${e(p.birthDate?.slice(0,4)||'미확인')}</b></span></div></a><div class="card-bottom">${saveButton(p)}${window.KVLPlayerIdCollisionV1?.isConflict(p.id)?'':'<button class="compare-button" type="button" data-note-player="'+e(p.id)+'">메모</button>'}${compareButton(p)}<button class="card-detail" data-profile="${e(p.id)}">프로필 보기 <span aria-hidden="true">›</span></button></div></article>`}

hydrateIcons();limit=pageSize();
function memberPanel(){return `<div class="empty-state">${icon('lock')}<h3>로그인된 개인 기록을 불러오지 못했습니다.</h3><p>페이지를 새로고침한 뒤 다시 확인해 주세요.</p><button class="button secondary" data-view="search">선수 검색으로 돌아가기</button></div>`}
function changeView(next,scroll=false){
 if(!['search','tracking','notes'].includes(next))return;view=next;
 const searchLike=next==='search'||next==='tracking';
 $('searchView').hidden=!searchLike;$('trackingView').hidden=true;$('notesView').hidden=next!=='notes';
 document.querySelectorAll('.player-tabs [data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.dataset.view===next?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
 if(searchLike)renderSearch();else renderNotes();
 if(scroll)$('playerContent').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderSearch(){
 syncLayout();if(!players.length)return;setQueryURL();const filters=getFilters();let results=searchPlayers(players,filters);
 if(filters.draftSeason){const ids=new Set(draftRows.filter(r=>r.season===filters.draftSeason&&r.application_status==='confirmed'&&r.player_id).map(r=>r.player_id));results=results.filter(p=>ids.has(p.id))}
 if(view==='tracking')results=results.filter(p=>bookmarks.has(p.id));
 $('searchTitle').textContent=view==='tracking'?'내 추적 선수':'어떤 선수를 찾고 계신가요?';
 const kicker=document.querySelector('#searchView .section-kicker');if(kicker)kicker.textContent=view==='tracking'?'MY WATCHLIST':'DISCOVER PLAYERS';
 $('catalogCount').textContent=view==='tracking'?('관심선수 '+bookmarks.size.toLocaleString('ko-KR')+'명'):('공개 DB '+players.length.toLocaleString('ko-KR')+'명');
 $('resultCount').innerHTML=(view==='tracking'?'내 추적 선수 ':'검색 결과 ')+'<b>'+results.length.toLocaleString('ko-KR')+'</b>명';
 const empty=view==='tracking'?'<div class="empty-state">'+icon('bookmark')+'<h3>조건에 맞는 관심선수가 없습니다.</h3><p>선수 검색에서 관심선수를 추가하거나 현재 검색 조건을 바꿔보세요.</p><button class="button secondary" data-view="search">전체 선수 보기</button></div>':'<div class="empty-state"><h3>조건에 맞는 선수가 없습니다.</h3><p>검색 조건을 줄이거나 초기화해 보세요.</p><button class="button secondary" data-reset-filters>검색 조건 초기화</button></div>';
 $('playerGrid').innerHTML=results.length?results.slice(0,limit).map(p=>playerCard(p)).join(''):empty;
 $('loadMore').hidden=results.length<=limit;$('loadMore').innerHTML=`선수 더 보기 · ${Math.min(limit,results.length)} / ${results.length} ${icon('down')}`;
 const notice=$('draftFilterStatus');notice.hidden=!draftLoadFailed&&!filters.draftSeason;if(draftLoadFailed)notice.textContent='드래프트 연결 자료를 불러오지 못했습니다. 전체 선수 검색은 이용할 수 있습니다.';else if(filters.draftSeason)notice.innerHTML=`프로필 연결이 확인된 신청자만 선수 검색에 표시됩니다. 미연결 신청자를 포함한 전체 명단은 <a href="draft-hub.html?season=${encodeURIComponent(filters.draftSeason)}">Draft Hub에서 확인하세요.</a>`;
 window.KVLCompareTray?.render();setQueryURL();
}
function filteredNotes(){
 const q=noteQuery.trim().toLocaleLowerCase();
 return notes.filter(n=>{const p=byId.get(n.player_id),hay=[n.title,n.body,n.season,p?.name,playerAffiliation(p)].join(' ').toLocaleLowerCase();return(!q||hay.includes(q))&&(!noteSeason||n.season===noteSeason)});
}
function noteCard(n){
 const p=byId.get(n.player_id),created=formatDate(n.created_at),updated=formatDate(n.updated_at),changed=String(n.created_at||'')!==String(n.updated_at||'');
 return `<article class="note-card"><div class="note-header"><div><h3>${e(p?.name||n.player_id)} · ${e(n.title||'제목 없음')}</h3><div class="note-context">${e(playerAffiliation(p))} · ${e(n.season||'시즌 미지정')}</div></div><div class="note-date"><span>작성 ${e(created)}</span>${changed?`<b>수정 ${e(updated)}</b>`:''}</div></div><p class="note-text">${e(n.body||'')}</p><div class="note-actions"><button type="button" data-profile="${e(n.player_id)}">선수 프로필</button><button type="button" data-edit-note="${e(n.id)}">수정</button></div></article>`;
}
function renderNoteList(){
 const list=filteredNotes(),listEl=document.querySelector('#notesBody .note-list'),countEl=document.getElementById('memberNoteCount');
 if(countEl)countEl.innerHTML='<b>'+list.length+'</b>개 메모';
 if(listEl)listEl.innerHTML=list.length?list.map(noteCard).join(''):'<div class="empty-state"><h3>메모가 없습니다.</h3><p>선수 카드의 메모 버튼에서 첫 기록을 남겨보세요.</p><button class="button secondary" data-view="search">선수 찾기</button></div>';
}
function renderNotes(){
 const seasons=[...new Set(notes.map(n=>n.season).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ko'));
 $('notesBody').innerHTML=`<div class="workspace-tools"><label class="search-field">메모 검색<input id="memberNoteSearch" type="search" value="${e(noteQuery)}" placeholder="선수명·제목·내용"></label><label>시즌<select id="memberNoteSeasonFilter"><option value="">전체 시즌</option>${seasons.map(s=>`<option value="${e(s)}" ${s===noteSeason?'selected':''}>${e(s)}</option>`).join('')}</select></label><p id="memberNoteCount"></p></div><div class="note-list"></div>`;
 renderNoteList();
}
function setQueryURL(){const url=new URL(location.href),f=getFilters();for(const k of ['q','level','gender','position','school','type','draftSeason','draft']){const value=f[k]||'';value?url.searchParams.set(k,value):url.searchParams.delete(k)}url.searchParams.delete('grade');for(const g of f.grades)url.searchParams.append('grade',g);url.searchParams.set('layout',layout);history.replaceState(null,'',url)}
function restoreFilters(){const form=$('filters');$('playerSearch').value=params.get('q')||'';for(const k of ['level','gender','position','type','draftSeason'])if(params.get(k))form.elements[k].value=params.get(k);form.elements.draft.checked=['1','eligible'].includes(params.get('draft'));syncDependentFilters();let school=params.get('school')||'';if(school.startsWith('code:'))school=players.find(p=>p.schoolCode===school.slice(5))?.school||'';if(school.startsWith('name:'))school=school.slice(5);if(school)form.elements.school.value=school;for(const c of form.querySelectorAll('[name="grade"]'))c.checked=!c.disabled&&params.getAll('grade').includes(c.value);updateGradeCaption();if([...form.elements].some(x=>['school','draftSeason','type'].includes(x.name)&&x.value)||form.elements.draft.checked||params.has('grade')){$('extraFilters').hidden=false;$('moreFilters').setAttribute('aria-expanded','true')}}
function resetFilters(){$('filters').reset();$('playerSearch').value='';syncDependentFilters();limit=pageSize();renderSearch()}
function openProfile(id){const p=byId.get(id);if(!p)return;lastFocus=document.activeElement;const href=profileHref(id);$('profileContent').innerHTML=`<div class="dialog-top"><h2 id="profileName">${e(p.name)} · 선수 프로필</h2><div class="profile-dialog-actions"><a href="${e(href)}">전체 화면</a><button class="close-button" data-close="profileDialog" aria-label="선수 프로필 닫기">×</button></div></div>${globalThis.KVLCommonPlayerProfileV1?.summary({name:p.name,en:p.nameEn,affiliation:p.team||p.school,position:p.rawPosition,height:p.height,dob:p.birthDate,nationality:p.nationality})||''}<div class="kvl-cpp-actions">${saveButton(p)}${window.KVLPlayerIdCollisionV1?.isConflict(p.id)?'':'<button type="button" class="compare-button" data-note-player="'+e(p.id)+'">내 메모</button>'}${compareButton(p)}</div><details class="kvl-cpp-full"><summary>전체 이력 및 출처 보기</summary><iframe class="profile-frame" title="${e(p.name)} 선수 프로필" src="${e(href+'&embed=1')}" loading="lazy"></iframe></details>`;$('profileDialog').showModal();$('profileDialog').scrollTop=0}
function closeProfile(){$('profileDialog').close();$('profileContent').innerHTML='';lastFocus?.focus({preventScroll:true})}
function updateAccountUI(){
 if(!memberReady)return;
 $('accountButton').innerHTML=icon('user')+' 관리자 로그인';
 $('accountDialogBody').innerHTML=`<p><strong>관리자 계정으로 로그인 중입니다.</strong></p><div class="account-choices"><button type="button" data-view="tracking">관심선수 ${bookmarks.size}명</button><button type="button" data-view="notes">개인 메모 ${notes.length}개</button></div><p class="account-disclaimer">선수·팀 페이지 안에서 바로 관심선수와 메모를 사용할 수 있습니다.</p>`;
 updateMemberBadges();
}
async function refreshPrivateState(){
 try{
  const [bm,ns]=await Promise.all([privateApi('list_bookmarks'),privateApi('list_notes')]);
  bookmarks=new Set((bm.items||[]).map(x=>x.player_id));notes=ns.items||[];memberReady=true;updateAccountUI();
  if(view==='notes')renderNotes();else renderSearch();
 }catch(err){memberReady=false;$('accountButton').innerHTML=icon('lock')+' 로그인 확인 필요';$('accountDialogBody').innerHTML='<p>개인 기록을 불러오지 못했습니다. 다시 로그인한 뒤 확인해 주세요.</p>';console.warn('Private player workspace unavailable',err)}
}
async function toggleBookmark(id){
 if(!memberReady)return $('accountDialog').showModal();
 const button=document.querySelector('[data-save-player="'+CSS.escape(id)+'"]');if(button)button.disabled=true;
 try{
  const result=await privateApi('toggle_bookmark',{player_id:id});
  result.saved?bookmarks.add(id):bookmarks.delete(id);updateMemberBadges();renderSearch();
 }catch(err){console.warn(err)}
 finally{document.querySelectorAll('[data-save-player="'+CSS.escape(id)+'"]').forEach(b=>b.disabled=false)}
}
function notePlayerMeta(id){
 const p=byId.get(id);return [p?.name,playerAffiliation(p),p?.rawPosition].filter(Boolean).join(' · ');
}
function openPlayerNote(id){
 if(!memberReady)return $('accountDialog').showModal();
 $('memberNoteId').value='';$('memberNoteRevision').value='';$('memberNotePlayer').value=id;$('memberNoteSeason').value='2026-27';$('memberNoteTitleInput').value='';$('memberNoteBody').value='';$('memberNoteAudit').hidden=true;$('memberNoteError').textContent='';$('memberDeleteNote').hidden=true;
 $('memberNoteTitle').textContent=(byId.get(id)?.name||'선수')+' · 메모';$('memberNotePlayerMeta').textContent=notePlayerMeta(id);$('memberNoteDialog').showModal();$('memberNoteTitleInput').focus();
}
function openNote(id){
 const n=notes.find(x=>x.id===id);if(!n)return;
 $('memberNoteId').value=n.id;$('memberNoteRevision').value=String(n.revision);$('memberNotePlayer').value=n.player_id;$('memberNoteSeason').value=n.season||'2026-27';$('memberNoteTitleInput').value=n.title||'';$('memberNoteBody').value=n.body||'';$('memberNoteError').textContent='';
 $('memberNoteAudit').hidden=false;$('memberNoteAudit').textContent='작성 '+formatDate(n.created_at)+' · 최근 수정 '+formatDate(n.updated_at);$('memberDeleteNote').hidden=false;
 $('memberNoteTitle').textContent=(byId.get(n.player_id)?.name||'선수')+' · 메모';$('memberNotePlayerMeta').textContent=notePlayerMeta(n.player_id);$('memberNoteDialog').showModal();
}
$('accountButton').innerHTML=icon('user')+' 로그인 정보';$('accountButton').addEventListener('click',()=>$('accountDialog').showModal());
document.addEventListener('click',ev=>{const t=ev.target.closest('button,a');if(!t)return;if(t.dataset.close){t.dataset.close==='profileDialog'?closeProfile():$(t.dataset.close).close();return}if(t.dataset.savePlayer){toggleBookmark(t.dataset.savePlayer);return}if(t.dataset.notePlayer){if($('profileDialog').open)closeProfile();openPlayerNote(t.dataset.notePlayer);return}if(t.dataset.editNote){openNote(t.dataset.editNote);return}if(t.hasAttribute('data-account-open')){$('accountDialog').showModal();return}if(t.dataset.view){changeView(t.dataset.view,true);return}if(t.dataset.layout){setLayout(t.dataset.layout);return}if(t.dataset.quick){$('filters').elements.level.value=t.dataset.quick;syncDependentFilters();limit=pageSize();changeView('search',true);return}if(t.dataset.profile){if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey||ev.button!==0)return;ev.preventDefault();openProfile(t.dataset.profile);return}if(t.hasAttribute('data-all-grades')){document.querySelectorAll('[name="grade"]').forEach(c=>c.checked=false);updateGradeCaption();limit=pageSize();renderSearch()}if(t.hasAttribute('data-reset-filters'))resetFilters()});
for(const dialog of document.querySelectorAll('dialog')){let pressed=false;const outside=ev=>{const r=dialog.getBoundingClientRect();return ev.target===dialog&&(ev.clientX<r.left||ev.clientX>=r.right||ev.clientY<r.top||ev.clientY>=r.bottom)};dialog.addEventListener('pointerdown',ev=>pressed=ev.button===0&&outside(ev));dialog.addEventListener('pointercancel',()=>pressed=false);dialog.addEventListener('click',ev=>{const close=pressed&&outside(ev);pressed=false;if(close)dialog.id==='profileDialog'?closeProfile():dialog.close()})}
$('profileDialog').addEventListener('cancel',ev=>{ev.preventDefault();closeProfile()});
$('memberNoteForm').addEventListener('submit',async ev=>{
 ev.preventDefault();if(!memberReady)return;
 const payload={id:$('memberNoteId').value||null,expected_revision:$('memberNoteRevision').value?Number($('memberNoteRevision').value):null,player_id:$('memberNotePlayer').value,season:$('memberNoteSeason').value.trim(),title:$('memberNoteTitleInput').value.trim(),body:$('memberNoteBody').value.trim()};
 if(!payload.title||!payload.body)return;
 $('memberNoteError').textContent='';
 try{await privateApi('save_note',payload);$('memberNoteDialog').close();await refreshPrivateState();if(view!=='notes')changeView(view)}
 catch(err){$('memberNoteError').textContent=err.message||'메모 저장에 실패했습니다.'}
});
$('memberDeleteNote').addEventListener('click',async()=>{
 const id=$('memberNoteId').value;if(!id||!confirm('이 메모를 삭제할까요?'))return;
 try{await privateApi('delete_note',{id,expected_revision:Number($('memberNoteRevision').value)});$('memberNoteDialog').close();await refreshPrivateState()}
 catch(err){$('memberNoteError').textContent=err.message||'메모 삭제에 실패했습니다.'}
});
document.addEventListener('input',ev=>{if(ev.target?.id==='memberNoteSearch'){noteQuery=ev.target.value;renderNoteList()}});
document.addEventListener('change',ev=>{if(ev.target?.id==='memberNoteSeasonFilter'){noteSeason=ev.target.value;renderNoteList()}});
window.addEventListener('message',ev=>{const frame=document.querySelector('.profile-frame');if(ev.origin!==location.origin||ev.source!==frame?.contentWindow)return;if(ev.data?.type==='kvl:close-profile'){closeProfile();return}if(ev.data?.type==='kvl:edit-note'&&ev.data.noteId){closeProfile();openNote(ev.data.noteId);return}if(ev.data?.type==='kvl:new-note'&&ev.data.playerId){closeProfile();openPlayerNote(ev.data.playerId)}});
$('searchForm').addEventListener('submit',ev=>{ev.preventDefault();limit=pageSize();changeView('search',true)});let debounce;$('playerSearch').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>{limit=pageSize();changeView('search')},120)});
$('filters').addEventListener('change',ev=>{if(ev.target.name==='level')syncDependentFilters();else if(ev.target.name==='grade')updateGradeCaption();limit=pageSize();renderSearch()});$('filters').addEventListener('submit',ev=>ev.preventDefault());$('filters').addEventListener('reset',()=>setTimeout(()=>{$('playerSearch').value='';syncDependentFilters();limit=pageSize();renderSearch()},0));
$('moreFilters').addEventListener('click',()=>{const show=$('extraFilters').hidden;$('extraFilters').hidden=!show;$('moreFilters').setAttribute('aria-expanded',String(show))});$('loadMore').addEventListener('click',()=>{limit+=pageSize();renderSearch()});
// Search/layout state is session-only; private bookmarks and notes remain server-side.
window.addEventListener('pagehide',()=>{try{sessionStorage.setItem(UI_KEY,JSON.stringify({url:location.href,limit,scrollY:window.scrollY}))}catch{}});
async function loadHighlights(){try{const r=await fetch('data/national/national_team_history_v1.json',{cache:'no-store'});if(!r.ok)return;const d=await r.json(),events=new Map(d.events.filter(x=>x.roster_status==='verified_official').map(x=>[x.event_id,x])),sources=new Map(d.sources.filter(x=>x.public_source===true&&['official_bulletin','official_roster'].includes(x.source_type)&&x.url?.startsWith('https://')).map(x=>[x.source_id,x])),seen=new Set();for(const row of d.rosters){const p=byId.get(row.player_id),event=events.get(row.event_id),key=row.player_id+':'+row.event_id;if(!p||!event||seen.has(key)||p.gender!==event.gender||(p.birthDate&&row.birth_date&&p.birthDate!==row.birth_date))continue;const source=[row.source_id,...event.source_ids].map(id=>sources.get(id)).find(Boolean);if(!source)continue;(p.highlights??=[]).push({kind:'national',verification:'verified_official',label:`${event.year} ${event.level} 대표팀`,event:event.competition_name_ko,date:event.start_date});seen.add(key)}for(const p of players)p.highlights?.sort((a,b)=>b.date.localeCompare(a.date))}catch(err){console.warn('Optional national highlights unavailable',err)}}
try{
 const catalog=await window.KVLPlayerCatalogReady;if(!Array.isArray(catalog))throw new Error('Player catalog unavailable');
 players=catalog.map(p=>({...p,id:p.playerId,name:p.nameKo||p.nameEn,code:p.displayCode}));byId=new Map(players.map(p=>[p.id,p]));
 $('catalogCount').textContent=`공개 DB ${players.length.toLocaleString('ko-KR')}명`;
 for(const pos of [...new Set(players.flatMap(p=>p.rawPosition.split(/[/,+]/)).filter(Boolean))].sort())$('positionFilter').insertAdjacentHTML('beforeend',`<option>${e(pos)}</option>`);
 try{draftIndex=await loadDraftIndex();const bundles=await Promise.all(draftIndex.seasons.map(s=>loadDraftSeason(s.season)));draftRows=bundles.flatMap(b=>validateAgainstCatalog(b.rows,catalog));for(const s of draftIndex.seasons)$('draftSeason').insertAdjacentHTML('beforeend',`<option value="${e(s.season)}">${e(s.label)} 공식 신청 확인</option>`)}catch(err){draftLoadFailed=true;$('draftSeason').disabled=true;$('draftFilterStatus').hidden=false;$('draftFilterStatus').textContent='드래프트 연결 자료를 불러오지 못했습니다. 전체 선수 검색은 이용할 수 있습니다.';console.warn(err)}
 await loadHighlights();restoreFilters();try{const saved=JSON.parse(sessionStorage.getItem(UI_KEY)||'null');if(saved?.url===location.href){limit=Math.max(limit,Math.min(players.length,saved.limit||limit));requestAnimationFrame(()=>window.scrollTo(0,saved.scrollY||0))}}catch{}
 await refreshPrivateState();if(!memberReady)renderSearch();
 const directNote=params.get('notePlayer'),directEdit=params.get('editNote');
 if(memberReady&&directNote&&byId.has(directNote))openPlayerNote(directNote);else if(memberReady&&directEdit&&notes.some(n=>n.id===directEdit))openNote(directEdit);
 if(directNote||directEdit){const url=new URL(location.href);url.searchParams.delete('notePlayer');url.searchParams.delete('editNote');history.replaceState(null,'',url)}
 if(params.get('id'))openProfile(params.get('id'));
}catch(err){$('catalogCount').textContent='DB 로딩 오류';$('resultCount').textContent='선수 정보를 불러오지 못했습니다.';$('playerGrid').innerHTML='<div class="empty-state"><h3>선수 정보를 불러오지 못했습니다.</h3><p>네트워크 연결을 확인한 후 페이지를 새로고침해 주세요.</p></div>';console.error(err)}

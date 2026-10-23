import {escapeHTML as e} from './player-workspace-core.mjs';
import {loadDraftIndex,loadDraftSeason,draftHubURL,safeReturnURL} from './draft-history-v1.mjs';
const params=new URLSearchParams(location.search),id=params.get('id'),embedded=params.get('embed')==='1'&&window.parent!==window;
if(embedded){document.documentElement.classList.add('kvl-profile-embedded');document.addEventListener('keydown',ev=>{if(ev.key==='Escape')window.parent.postMessage({type:'kvl:close-profile'},location.origin)});document.addEventListener('click',ev=>{const a=ev.target.closest('a[href]');if(a&&!a.hash&&!a.target)a.target='_top'})}
const back=document.querySelector('.pd-back');if(back){back.href=safeReturnURL(params.get('return'));if(back.href.includes('draft-hub.html'))back.textContent='← 드래프트 신청 명단으로 돌아가기'}
const area=document.getElementById('playerArea');
// Keep all legacy profile and timeline renderers. Append independent annual history.
let rows=null,loadFailed=false;
function apply(){
 const title=area?.querySelector('.pd-title');if(!title)return;
 if(!document.getElementById('playerMemberNotice')){const note=document.createElement('div');note.id='playerMemberNotice';note.className='pd-member-notice';note.textContent='관심선수·개인 메모는 회원 로그인과 비공개 저장 기능이 연결된 뒤 이용할 수 있습니다.';area.append(note)}
 if(document.getElementById('playerDraftHistory'))return;
 if(loadFailed){const note=document.createElement('div');note.className='pd-member-notice';note.id='playerDraftHistory';note.textContent='드래프트 이력을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';area.append(note);return}
 if(!rows)return;const relevant=rows.filter(r=>r.player_id===id&&r.match_status==='matched'&&r.match.profile_verified&&r.name===title.textContent.trim());if(!relevant.length)return;
 const section=document.createElement('section');section.id='playerDraftHistory';section.className='pd-card pd-section pd-draft-history';
 section.innerHTML=`<h2>드래프트 이력</h2><p class="pd-history-caption">신청 당시 정보입니다. 기존 소속·학교·대회 기록은 유지됩니다.</p>${relevant.map(r=>{const selected=r.selection.status==='selected',result=selected?`${r.selection.team} · ${r.selection.round}라운드 ${r.selection.pick}순위`:r.selection.status==='undrafted'?'공식 미지명 확인':'지명 결과 미확인';return `<article><a class="pd-draft-title" href="${e(draftHubURL(r))}">${e(r.season)} KOVO 신인선수 드래프트 <span aria-hidden="true">›</span></a><p><b>${r.application_status==='confirmed'?'공식 참가 신청 확인':'공식 철회 확인'}</b></p><p>${e(r.affiliation)}${r.grade?' · '+e(r.grade)+'학년':''} · ${e(r.positions.join('/'))}${r.height_cm?' · '+e(r.height_cm)+'cm':''}</p><p class="pd-draft-result">${e(result)}</p><a href="${e(r.source_url)}" target="_blank" rel="noopener">공식 신청 명단 ↗</a>${r.selection.source_url?` · <a href="${e(r.selection.source_url)}" target="_blank" rel="noopener">공식 지명 결과 ↗</a>`:''}<small>명단 발표 ${e(r.published_at)} · 확인 ${e(r.verified_at)}</small></article>`}).join('')}`;
 area.append(section);
}
const observer=new MutationObserver(apply);if(area)observer.observe(area,{childList:true,subtree:true});
try{const index=await loadDraftIndex();const bundles=await Promise.all(index.seasons.map(s=>loadDraftSeason(s.season)));rows=bundles.flatMap(b=>b.rows).sort((a,b)=>b.season.localeCompare(a.season));apply()}catch(err){loadFailed=true;apply();console.warn('Draft history unavailable',err)}

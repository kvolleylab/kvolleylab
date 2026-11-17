/* Native Competition V2 roster pane, 2026-27 V-League only. */
(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.KVLVLeagueRosterV2=a;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const norm=x=>String(x||'').replace(/\s+/g,'').toLowerCase();
const isTarget=d=>/^KVL-COMP-VLEAGUE-[MW]-2026-27$/.test(String(d?.competitionId||''));
const official=x=>/^https:\/\/kovo\.co\.kr\/news\/official-notices\/[0-9]+$/.test(String(x||''));
function url(p,d,t){
 if(!/^KVL-P-\d{6}$/.test(String(p.playerId||'')))return'';
 const gender=d.competitionId.includes('-M-')?'men':'women';
 const ret='competition-engine.html?competition=v-league-'+gender+'-2026-27&view=rosters&team='+encodeURIComponent(t.code);
 const q=new URLSearchParams({id:p.playerId,return:ret});
 if(typeof window==='object'&&window.KVLPlayerIdCollisionV1?.isConflict(p.playerId))q.set('scope','pro');
 return 'player.html?'+q;
}
const schools=p=>[p.kvlHighSchool?{label:'고등학교',text:p.kvlHighSchool}:null,p.kvlUniversity?{label:'대학교',text:p.kvlUniversity}:null].filter(Boolean);
function render(host,d,team,players){
 if(!isTarget(d)||!host||!team||!Array.isArray(players))return false;
 const source=d.rosters?.[team.code]||{},roster=players.map(p=>({...p}));
 const picks=roster.filter(p=>p.kvlDraft).length;
 const logo=/^(?:\/?assets\/|https:\/\/kvolleylab\.com\/assets\/)/.test(team.logo||'')?`<img src="${esc(team.logo)}" alt="" loading="lazy">`:'';
 host.innerHTML=`<div class="kvlrv2" data-vleague-roster-v2>
 <header class="kvlrv2-header"><div class="kvlrv2-team-logo">${logo||'🏐'}</div><div>
 <p class="kvlrv2-eyebrow">2026–27 V-LEAGUE</p><h3>${esc(team.name)} 선수명단</h3>
 <p>공식 등록 공시 기준 ${roster.length}명 · 경기별 엔트리와 구분</p></div></header>
 <div class="kvlrv2-columns"><section class="kvlrv2-list" aria-label="선수명단">
 <div class="kvlrv2-toolbar"><div class="kvlrv2-filters">
 <button type="button" data-filter="all" aria-pressed="true">전체 선수</button>
 ${picks?`<button type="button" data-filter="rookie" aria-pressed="false">신인 등록 ${picks}</button>`:''}
 </div><label><span class="sr-only">선수명 검색</span><input type="search" data-roster-search placeholder="선수명 검색" autocomplete="off"></label></div>
 <div class="kvlrv2-head" aria-hidden="true"><span>NO.</span><span>선수명</span><span>POS</span><span>키</span></div>
 <div class="kvlrv2-players" data-rows role="listbox" aria-label="선수 선택"></div></section>
 <aside class="kvlrv2-detail" data-detail aria-live="polite" aria-label="선수 상세정보"></aside></div></div>`;
 const list=host.querySelector('[data-rows]'),detail=host.querySelector('[data-detail]');
 const key=p=>String(p.number)+'/'+p.name;
 let filter='all',search='',selected=key(roster.find(p=>p.kvlDraft)||roster[0]||{});
 function show(){
  const data=roster.filter(p=>filter==='all'||p.kvlDraft)
   .filter(p=>!search||norm(p.name).includes(norm(search))||norm(p.en).includes(norm(search))||String(p.number)===search);
  if(!data.some(p=>key(p)===selected))selected=data.length?key(data[0]):'';
  list.innerHTML=data.length?data.map(p=>`<button type="button" role="option" class="kvlrv2-row${key(p)===selected?' is-selected':''}" data-choice="${esc(key(p))}" aria-selected="${key(p)===selected}">
  <span class="kvlrv2-number">${esc(p.number??'—')}</span><span class="kvlrv2-name"><strong>${esc(p.name)}</strong>${p.en?`<small>${esc(p.en)}</small>`:''}</span>
  <span>${esc(p.position||'—')}</span><span>${p.heightCm>0?esc(p.heightCm)+'cm':'—'}</span></button>`).join(''):'<p class="kvlrv2-empty">검색 결과가 없습니다.</p>';
  const p=roster.find(x=>key(x)===selected);
  if(!p){detail.innerHTML='<p class="kvlrv2-empty">선수를 선택해 주세요.</p>';return}
  const academic=schools(p),href=url(p,d,team),draft=p.kvlDraft||null;
  const round=Number.isInteger(draft?.round)?draft.round+'라운드 '+draft.pick+'순위':draft?.kind==='trainee'?'수련선수 지명':'공식 지명';
  detail.innerHTML=`<div class="kvlrv2-profile-head"><small>PLAYER</small><h3>${esc(p.name)}</h3><span>${esc(team.name)} · ${esc(p.position||'선수')}</span></div>
   <div class="kvlrv2-profile-content"><h4>선수 정보</h4>
   <dl class="kvlrv2-facts"><div><dt>등번호</dt><dd>#${esc(p.number??'—')}</dd></div>
   ${p.dob?`<div><dt>생년월일</dt><dd>${esc(p.dob)}</dd></div>`:''}
   ${p.heightCm>0?`<div><dt>신장</dt><dd>${esc(p.heightCm)}cm</dd></div>`:''}</dl>
   ${academic.length?`<section class="kvlrv2-schools"><h4>출신학교</h4><div class="kvlrv2-school-grid">${academic.map(x=>`<div><small>${esc(x.label)}</small><strong>${esc(x.text)}</strong></div>`).join('')}</div></section>`:''}
   ${draft?`<section class="kvlrv2-pick"><small>2026–27 KOVO 신인드래프트</small><strong>${esc(team.name)} · ${esc(round)}</strong></section>`:''}
   ${href?`<a class="kvlrv2-profile-link" href="${esc(href)}">선수 프로필 보기</a>`:''}
   ${official(p.registrationSource)||draft?`<details class="kvlrv2-sources"><summary>공식 출처 보기</summary>
   ${official(p.registrationSource)?`<a href="${esc(p.registrationSource)}" target="_blank" rel="noopener noreferrer">KOVO 등록 공시</a>`:''}
   ${/^https:\/\/cdn\.kovo\.co\.kr\//.test(draft?.source||'')?`<a href="${esc(draft.source)}" target="_blank" rel="noopener noreferrer">신인드래프트 결과</a>`:''}
   </details>`:''}</div>`;
 }
 host.onclick=ev=>{
  const row=ev.target.closest('[data-choice]');
  if(row&&host.contains(row)){selected=row.dataset.choice;show();if(typeof matchMedia==='function'&&matchMedia('(max-width:680px)').matches)detail.scrollIntoView({block:'start',behavior:'smooth'});return}
  const btn=ev.target.closest('[data-filter]');
  if(btn&&host.contains(btn)){filter=btn.dataset.filter;host.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));show()}
 };
 host.oninput=ev=>{if(ev.target.matches('[data-roster-search]')){search=ev.target.value.trim();show()}};
 show();return true;
}
return {isTarget,schools,render};
});
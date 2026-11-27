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
 const standard=typeof window==='object'&&!!host.closest?.('.ktd-page');
 const codes={KOR:'kr',JPN:'jp',CAN:'ca',CHN:'cn',CUB:'cu',BRA:'br',IRI:'ir',GER:'de',PAK:'pk',USA:'us',THA:'th',CMR:'cm',IDN:'id',UKR:'ua',SRB:'rs'};
 const country=p=>codes[p.nationalityCode]||'';
 const flag=p=>country(p)?'<img class="kvl-rs-flag" src="assets/images/flags/'+(country(p)==='cm'?'club':'4x3')+'/'+country(p)+'.svg" alt="" decoding="async">':'';
 const vb=p=>/^https:\/\/(?:www\.)?volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p\d+\/?$/i.test(p.volleybox||'')?'<a class="kvl-rs-vb" href="'+esc(p.volleybox)+'" target="_blank" rel="noopener noreferrer">VB-&gt;</a>':'—';
 const positions=['OH','OP','MB','S','L'];
 const matchesPos=(p,v)=>v==='all'||String(p.position||'').match(/OH|OP|MB|\bS\b|\bL\b/g)?.includes(v);
 const picks=roster.filter(p=>p.kvlDraft).length;
 const logo=/^(?:\/?assets\/|https:\/\/kvolleylab\.com\/assets\/)/.test(team.logo||'')?`<img src="${esc(team.logo)}" alt="" loading="lazy">`:'';
 host.innerHTML=`<div class="kvlrv2" data-vleague-roster-v2>
 <header class="kvlrv2-header"><div class="kvlrv2-team-logo">${logo||'🏐'}</div><div>
 <p class="kvlrv2-eyebrow">2026–27 V-LEAGUE</p><h3>${esc(team.name)} 선수명단</h3>
 <p>공식 등록 공시 기준 ${roster.length}명 · 경기별 엔트리와 구분</p></div></header>
 <div class="kvlrv2-columns"><section class="kvlrv2-list" aria-label="선수명단">
 <div class="kvlrv2-toolbar"><div class="kvlrv2-filters">
 <button type="button" data-filter="all" aria-pressed="true">${standard?'전체':'전체 선수'}</button>
 ${standard?'<button type="button" data-filter="foreign" aria-pressed="false">외국인만</button><button type="button" data-filter="kr" aria-pressed="false">한국인</button>':''}
 ${picks?`<button type="button" data-filter="rookie" aria-pressed="false">신인 등록 ${picks}</button>`:''}
 </div>${standard?'<div class="kvlrv2-filters kvl-rs-pos" role="group" aria-label="포지션 필터">'+['all',...positions].map(x=>'<button type="button" data-rs-pos="'+x+'" aria-pressed="'+(x==='all')+'">'+(x==='all'?'ALL POS':x)+'</button>').join('')+'</div>':''}<label><span class="sr-only">선수명 검색</span><input type="search" data-roster-search placeholder="선수명 검색" autocomplete="off"></label></div>
 <div class="kvlrv2-head" aria-hidden="true"><span>NO.</span><span>선수명</span><span>POS</span><span>키</span></div>
 <div class="kvlrv2-players" data-rows role="listbox" aria-label="선수 선택"></div></section>
 <aside class="kvlrv2-detail" data-detail aria-live="polite" aria-label="선수 상세정보"></aside></div></div>`;
 const list=host.querySelector('[data-rows]'),detail=host.querySelector('[data-detail]');
 const popup=standard?window.KVLTeamRosterStandardV1?.createProfilePopup(host,detail,{dismiss}):null;
 const desktop=()=>!!popup?.isDesktop();
 const key=p=>String(p.number)+'/'+p.name;
 let filter='all',pos='all',search='',selected=desktop()?'':key(roster.find(p=>p.kvlDraft)||roster[0]||{});
 function dismiss(){
  const previous=selected;popup?.close();selected='';show();
  const row=[...list.querySelectorAll('[data-choice]')].find(el=>el.dataset.choice===previous);
  row?.focus({preventScroll:true});
 }
 function show(){
  const data=roster.filter(p=>filter==='all'||filter==='rookie'&&p.kvlDraft||filter==='foreign'&&country(p)&&country(p)!=='kr'||filter==='kr'&&country(p)==='kr').filter(p=>matchesPos(p,pos))
   .filter(p=>!search||norm(p.name).includes(norm(search))||norm(p.en).includes(norm(search))||String(p.number)===search);
  if(!data.some(p=>key(p)===selected))selected=!desktop()&&data.length?key(data[0]):'';
  const scrollTop=list.scrollTop;
  list.innerHTML=data.length?data.map(p=>`<div role="option" tabindex="0" class="kvlrv2-row${key(p)===selected?' is-selected':''}" data-choice="${esc(key(p))}" aria-selected="${key(p)===selected}">
  <span class="kvlrv2-number">${standard&&p.number!=null?'#':''}${esc(p.number??'—')}</span><span class="kvlrv2-name">${url(p,d,team)?`<a class="kvlrv2-name-link" href="${esc(url(p,d,team))}" aria-label="${esc(p.name)} 선수 프로필 보기"><strong>${esc(p.name)}</strong></a>`:`<strong>${esc(p.name)}</strong>`}${!standard&&p.en?`<small>${esc(p.en)}</small>`:''}</span>
  ${standard?`<span class="kvlrv2-dob">${esc(p.dob||'—')}</span><span class="kvlrv2-pos">${esc(p.position||'—')}</span><span class="kvlrv2-height">${p.heightCm>0?esc(p.heightCm)+'cm':'—'}</span><span class="kvl-rs-nationality">${flag(p)}${esc(p.nationality||'미확인')}</span><span class="kvl-rs-vb-cell">${vb(p)}</span>`:`<span>${esc(p.position||'—')}</span><span>${p.heightCm>0?esc(p.heightCm)+'cm':'—'}</span>`}</div>`).join(''):'<p class="kvlrv2-empty">검색 결과가 없습니다.</p>';
  list.scrollTop=scrollTop;
  const p=roster.find(x=>key(x)===selected);
  if(!p){detail.hidden=desktop();detail.innerHTML='<p class="kvlrv2-empty">선수를 선택해 주세요.</p>';popup?.sync();return}
  detail.hidden=false;
  const academic=schools(p),href=url(p,d,team),draft=p.kvlDraft||null;
  const career=standard&&!draft?p.kvlCareerDraft:null;
  const evidence=standard?Object.values(p.kvlProfileEvidence||{}).flat():[];
  const sources=[...new Map(evidence.map(e=>[e.url||e.title,e])).values()];
  const careerRank=career?.kind==='trainee'?'수련선수 지명':career?career.round+'라운드 '+career.pick+'순위':'';
  const measurement=standard&&p.kvlProfileEvidence?.height_cm?.some(e=>e.kind==='reviewed_kovo_draft_registration')?' (드래프트 측정)':'';
  const round=Number.isInteger(draft?.round)?draft.round+'라운드 '+draft.pick+'순위':draft?.kind==='trainee'?'수련선수 지명':'공식 지명';
  detail.innerHTML=`<div class="kvlrv2-profile-head"><small>PLAYER</small>${popup?`<button type="button" class="kvl-rs-profile-close" data-kvl-rs-close>닫기 ×</button>`:''}<h3>${esc(p.name)}</h3>${standard&&p.en?`<span class="kvl-rs-english">${esc(p.en)}</span>`:''}<span>${esc(team.name)} · ${esc(p.position||'선수')}</span></div>
   <div class="kvlrv2-profile-content"><h4>선수 정보</h4>
   <dl class="kvlrv2-facts"><div><dt>등번호</dt><dd>#${esc(p.number??'—')}</dd></div>
   ${p.dob?`<div><dt>생년월일</dt><dd>${esc(p.dob)}</dd></div>`:''}
   ${p.heightCm>0?`<div><dt>신장</dt><dd>${esc(p.heightCm)}cm${esc(measurement)}</dd></div>`:''}${standard?`<div><dt>국적</dt><dd>${flag(p)}${esc(p.nationality||'미확인')}</dd></div><div><dt>Volleybox</dt><dd>${vb(p)}</dd></div>`:''}</dl>
   ${academic.length?`<section class="kvlrv2-schools"><h4>출신학교</h4><div class="kvlrv2-school-grid">${academic.map(x=>`<div><small>${esc(x.label)}</small><strong>${esc(x.text)}</strong></div>`).join('')}</div></section>`:''}
   ${draft?`<section class="kvlrv2-pick"><small>2026–27 KOVO 신인드래프트</small><strong>${esc(team.name)} · ${esc(round)}</strong></section>`:''}
   ${career?`<section class="kvlrv2-pick kvlrv2-career-draft"><small>${esc(career.season)} KOVO 신인드래프트</small><strong>${esc(careerRank)}</strong></section>`:''}
   ${href?`<a class="kvlrv2-profile-link" href="${esc(href)}">선수 프로필 보기</a>`:''}
   ${official(p.registrationSource)||draft||sources.length?`<details class="kvlrv2-sources"><summary>공식 출처 보기</summary>
   ${official(p.registrationSource)?`<a href="${esc(p.registrationSource)}" target="_blank" rel="noopener noreferrer">KOVO 등록 공시</a>`:''}
   ${/^https:\/\/cdn\.kovo\.co\.kr\//.test(draft?.source||'')?`<a href="${esc(draft.source)}" target="_blank" rel="noopener noreferrer">신인드래프트 결과</a>`:''}
   ${sources.map(e=>e.url&&window.KVLVLeagueProfileEnrichmentV1?.safeSource(e.url)?`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${e.kind==='official_club_profile'?'구단 공식 선수 프로필':'검수된 드래프트 자료'}</a>`:e.kind==='archived_mediaguide_extract'?`<span>${esc(e.season)} KOVO 미디어가이드 (검수자료)</span>`:'').join('')}
   </details>`:''}</div>`;
  if(standard&&globalThis.KVLCommonPlayerProfileV1){
   const api=globalThis.KVLCommonPlayerProfileV1;
   const ref={id:p.playerId,verified:p.profileLinkStatus==='verified-official-draft-registration'&&p.kvlDraft?.playerId===p.playerId,name:p.name,en:p.en,gender:d.competitionId.includes('-M-')?'M':'W',dob:p.dob,position:p.position,height:p.heightCm,heightNote:measurement,affiliation:team.name,affiliationLabel:'시즌 소속',nationality:p.nationality,number:p.number,vb:p.volleybox,omitDetails:[...(academic.length?['education']:[]),...(draft||career?['draft']:[]),'sources']};
   if(api.mountSummary(detail,ref,'.kvlrv2-profile-head')){
    detail.querySelector('.kvlrv2-facts')?.remove();
    detail.querySelector('.kvlrv2-profile-content > h4')?.remove();
    api.attach(detail,ref);
   }
  }
  popup?.sync();
 }
 host.onclick=ev=>{
  if(ev.target.closest('[data-kvl-rs-close]')){dismiss();return}
  // The name link navigates; the surrounding row only selects this athlete.
  if(ev.target.closest('.kvl-rs-vb')||(!standard&&ev.target.closest('.kvlrv2-name-link')))return;
  if(standard&&ev.target.closest('.kvlrv2-name-link'))ev.preventDefault();
  const pb=ev.target.closest('[data-rs-pos]');if(pb){pos=pb.dataset.rsPos;host.querySelectorAll('[data-rs-pos]').forEach(x=>x.setAttribute('aria-pressed',String(x===pb)));show();return}
  const row=ev.target.closest('[data-choice]');
  if(row&&host.contains(row)){selected=row.dataset.choice;show();if(!desktop()&&typeof matchMedia==='function'&&matchMedia('(max-width:680px)').matches)detail.scrollIntoView({block:'start',behavior:'smooth'});return}
  const btn=ev.target.closest('[data-filter]');
  if(btn&&host.contains(btn)){filter=btn.dataset.filter;host.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));show()}
 };
 host.onkeydown=ev=>{
  const row=ev.target.closest('[data-choice]');
  if(row&&ev.target===row&&host.contains(row)&&(ev.key==='Enter'||ev.key===' ')){
   ev.preventDefault();selected=row.dataset.choice;show();
  }
 };
 host.oninput=ev=>{if(ev.target.matches('[data-roster-search]')){search=ev.target.value.trim();show()}};
 show();return true;
}
return {isTarget,schools,render};
});
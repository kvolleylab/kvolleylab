/* KVL professional overseas league season roster v1.
 * Season snapshots are immutable by season. Do not replace old-season player membership with current-club data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLProLeagueRosterV1=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const POS=['OH','OP','MB','S','L'];
const VB=/^https:\/\/volleybox\.net\/[a-z0-9-]+-p\d+\/?$/i;
const safeSource=x=>/^https:\/\//.test(String(x||''));
const safePath=x=>/^data\/team-rosters\/sv-league\/\d{4}-\d{2}\/[a-z0-9_-]+\.json$/.test(String(x||''));
const safeLogo=x=>{
 const s=String(x||'');
 if(/^(?:\/?assets\/)[A-Za-z0-9_.\/-]+\.(?:svg|png|jpe?g|webp)(?:\?[A-Za-z0-9=&_.-]+)?$/.test(s))return true;
 try{
  const u=new URL(s);
  if(u.protocol!=='https:')return false;
  if(u.hostname==='www.jtekt-stings.jp')return u.pathname.startsWith('/_next/static/media/')&&/\.(?:svg|png|webp)$/i.test(u.pathname);
  if(u.hostname==='images.microcms-assets.io')return u.pathname.startsWith('/assets/99af67a09e884982ae7d419ecde99396/')&&/\.(?:svg|png|webp)$/i.test(u.pathname);
  if(u.hostname==='tokyo-greatbears.com')return u.pathname.startsWith('/_tgb_content/wp-content/uploads/')&&/\.(?:svg|png|webp)$/i.test(u.pathname);
  return false;
 }catch{return false}
};
function validateIndex(index){
 if(!index||index.version!=='1.0'||index.league?.id!=='sv-league'||!Array.isArray(index.seasons))return false;
 return index.seasons.every(s=>/^\d{4}-\d{2}$/.test(s.season)&&['men','women'].includes(s.gender)
  &&Array.isArray(s.teams)&&s.teams.every(t=>/^[A-Z0-9_-]{2,30}$/.test(t.code||'')&&t.name&&t.en
   &&Number.isInteger(t.count)&&t.count>=0&&safePath(t.source_path)));
}
const height=p=>Number(p?.height_cm??p?.h??0);
const nationality=p=>String(p?.nationality??p?.nat??'').trim();
const volleybox=p=>String(p?.volleybox??p?.vb??'').trim();
function validateTeam(team,expected={}){
 if(!team||team.version!=='1.0'||team.league_id!=='sv-league'||!/^\d{4}-\d{2}$/.test(team.season||'')
  ||team.gender!=='men'||!Array.isArray(team.players)||!team.team?.code||!team.team?.name)return false;
 if(expected.code&&team.team.code!==expected.code)return false;
 if(expected.season&&team.season!==expected.season)return false;
 if(team.players.length!==team.team.count)return false;
 const seen=new Set();
 return team.players.every(p=>{
  const key=String(p.no)+'/'+String(p.en||'');
  if(seen.has(key))return false;seen.add(key);
  return p&&Number.isInteger(Number(p.no))&&p.en&&POS.some(x=>String(p.pos||'').split('/').includes(x))
   &&Number.isInteger(height(p))&&height(p)>150&&height(p)<230
   &&/^[a-z]{2}$/.test(p.iso2||'')&&nationality(p)&&VB.test(volleybox(p))
   &&['VERIFIED','RECHECK'].includes(p.status);
 });
}
function teamEntries(index,gender,season){
 if(!validateIndex(index))throw Error('SV.LEAGUE index invalid');
 const found=index.seasons.find(s=>s.gender===gender&&s.season===season);
 if(!found)return[];
 return found.teams.map((t,order)=>({...t,order,gender,season,type:'pro-sv',action:'roster',
  leagueId:'sv',leagueLabel:'SV.LEAGUE',leagueCountry:'Japan',asOf:found.as_of||index.updated_at||''}));
}
const nameMap=typeof module==='object'&&module.exports?require('./kvl-sv-player-name-ko-v1.js'):(globalThis.KVLSVPlayerNameKoV1||{});
const translated=p=>{const id=volleybox(p).match(/-p(\d+)\/?$/)?.[1],entry=nameMap[id];return entry?.en===p.en?entry.ko:''};
const title=p=>p.ko||translated(p)||p.en||'선수';
const isJapan=p=>p.iso2==='jp';
const clubFlags=new Set(['ee','es','ru','ro','il','no','fi','ng','tn','pr','dk']);
const flagPath=p=>/^[a-z]{2}$/.test(p?.iso2||'')?'assets/images/flags/'+(clubFlags.has(p.iso2)?'club':'4x3')+'/'+p.iso2+'.svg':'';
const flagMarkup=p=>flagPath(p)?'<img class="kvl-lr-flag-image" src="'+esc(flagPath(p))+'" alt="" decoding="async">':'';

function render(host,team,display={}){
 if(!host||!validateTeam(team))throw Error('SV.LEAGUE team snapshot invalid');
 let nat='all',pos='all',query='',selected='';
 const total=team.players.length,foreign=team.players.filter(p=>!isJapan(p)).length,
  recheck=team.players.filter(p=>p.status==='RECHECK').length;
 const logo=safeLogo(display.logo)?String(display.logo):'';
 host.innerHTML='<section class="kvl-league-roster" data-kvl-pro-league-roster>'+
  '<div class="kvl-lr-top"><div class="kvl-lr-identity">'+
   (logo?'<div class="kvl-lr-team-logo"><img src="'+esc(logo)+'" alt="'+esc(team.team.name)+' 팀 로고" loading="eager" decoding="async"><span class="kvl-lr-team-logo-fallback" aria-hidden="true" hidden>'+esc(String(team.team.name||'팀').slice(0,2))+'</span></div>':'')+
   '<div><p class="ktd-section-eyebrow">JAPAN · SV.LEAGUE</p>'+
   '<h3>'+esc(team.team.name)+' <small>'+esc(team.team.en)+'</small></h3>'+
   '<p>'+esc(team.season)+' 시즌 등록 스냅샷 · '+esc(team.as_of)+' 기준</p></div></div>'+
   '<div class="kvl-lr-source-links">'+
    (safeSource(team.team.source)?'<a href="'+esc(team.team.source)+'" target="_blank" rel="noopener noreferrer">시즌 명단 출처</a>':'')+
    (safeSource(team.team.volleybox_team)?'<a href="'+esc(team.team.volleybox_team)+'" target="_blank" rel="noopener noreferrer">팀 Volleybox</a>':'')+
   '</div></div>'+
  '<section class="kvl-lr-kpis" aria-label="SV리그 선수명단 요약">'+
   '<article><span>선수 인원</span><strong>'+total+'명</strong></article>'+
   '<article><span>외국 국적</span><strong>'+foreign+'명</strong></article>'+
   '<article><span>일본 국적</span><strong>'+(total-foreign)+'명</strong></article>'+
   '<article><span>소속 재확인</span><strong>'+recheck+'명</strong></article>'+
  '</section>'+
  '<div class="kvl-lr-controls"><div class="kvl-lr-filters" role="group" aria-label="국적 필터">'+
   '<button type="button" data-kvl-lr-nat="all" aria-pressed="true">전체</button>'+
   '<button type="button" data-kvl-lr-nat="foreign" aria-pressed="false">외국인만</button>'+
   '<button type="button" data-kvl-lr-nat="jp" aria-pressed="false">일본인</button></div>'+
   '<div class="kvl-lr-pos" role="group" aria-label="포지션 필터"><button type="button" data-kvl-lr-pos="all" aria-pressed="true">ALL POS</button>'+
    POS.map(x=>'<button type="button" data-kvl-lr-pos="'+x+'" aria-pressed="false">'+x+'</button>').join('')+'</div>'+
   '<label class="kvl-lr-search"><span class="sr-only">선수명 검색</span><input type="search" placeholder="선수명 검색" data-kvl-lr-search autocomplete="off"></label>'+
  '</div><p class="kvl-lr-count" data-kvl-lr-count></p>'+
  '<div class="kvl-rs-columns"><div class="kvl-lr-table"><div class="kvl-lr-head" aria-hidden="true"><span>NO.</span><span>선수명</span><span>생년월일</span><span>POS</span><span>신장</span><span>국적</span><span>Volleybox</span></div>'+
   '<div data-kvl-lr-rows></div></div><section class="kvl-lr-detail" data-kvl-lr-detail hidden></section></div>'+
  '<p class="kvl-lr-note">시즌 등록 명단 스냅샷입니다. 14인 경기 엔트리와 구분하며, 생년월일은 이번 원본에 없는 경우 추정하지 않습니다. <b>소속 재확인</b>은 구단 시즌 명단과 Volleybox의 소속 표기가 다른 선수입니다.</p>'+
 '</section>';
 const logoImage=host.querySelector('.kvl-lr-team-logo img');
 if(logoImage)logoImage.addEventListener('error',()=>{
  logoImage.hidden=true;
  const fallback=logoImage.nextElementSibling;
  if(fallback?.classList.contains('kvl-lr-team-logo-fallback'))fallback.hidden=false;
 },{once:true});
 const rows=host.querySelector('[data-kvl-lr-rows]'),count=host.querySelector('[data-kvl-lr-count]'),detail=host.querySelector('[data-kvl-lr-detail]');
 const popup=host.closest?.('.ktd-page')?globalThis.KVLTeamRosterStandardV1?.createProfilePopup(host,detail,{dismiss}):null;
 const desktop=()=>!!popup?.isDesktop();
 function dismiss(){
  const previous=selected;popup?.close();selected='';detail.hidden=true;detail.innerHTML='';paint();popup?.sync();
  if(desktop())[...rows.querySelectorAll('[data-kvl-lr-player]')].find(x=>x.dataset.kvlLrPlayer===previous)?.focus({preventScroll:true});
 }
 const visible=()=>team.players.filter(p=>(nat==='all'||nat==='foreign'&&!isJapan(p)||nat==='jp'&&isJapan(p))
  &&(pos==='all'||String(p.pos||'').split('/').includes(pos))
  &&(!query||[title(p),p.en,nationality(p),p.pos].some(x=>norm(x).includes(query))));
 const row=p=>{
  const badge=p.status==='RECHECK'?'<span class="kvl-lr-recheck" title="'+esc(p.note||'출처 간 소속 표기 재확인')+'">소속 재확인</span>':'';
  const flag=flagMarkup(p);
  return '<div class="kvl-lr-row" data-player="'+esc(p.en)+'">'+
   '<span class="kvl-lr-no">'+'#'+esc(p.no)+'</span>'+
   '<span class="kvl-lr-name"><button type="button" class="kvl-lr-name-button" data-kvl-lr-player="'+esc(volleybox(p))+'" aria-expanded="'+String(selected===volleybox(p))+'"><strong>'+esc(title(p))+'</strong></button>'+badge+'</span>'+
   '<span class="kvl-lr-dob">—</span><span class="kvl-lr-position">'+esc(p.pos)+'</span>'+
   '<span class="kvl-lr-height">'+esc(height(p))+'cm</span>'+
   '<span class="kvl-lr-nationality">'+flag+'<span>'+esc(nationality(p))+'</span></span>'+
   '<span class="kvl-lr-vb"><a href="'+esc(volleybox(p))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(p.en)+' Volleybox 선수 프로필 열기">VB-&gt;</a></span>'+
   '<span class="kvl-lr-mobile-facts">생년월일 — · '+esc(p.pos)+' · '+esc(height(p))+'cm</span></div>';
 };
 const paint=()=>{
  const list=visible();
  if(!list.some(p=>volleybox(p)===selected)){selected='';detail.hidden=true;detail.innerHTML='';popup?.sync()}
  rows.innerHTML=list.length?list.map(row).join(''):'<p class="ktd-empty">해당 조건의 선수가 없습니다.</p>';
  count.textContent=list.length+'명 표시 · 시즌 등록 '+total+'명';
  host.querySelectorAll('[data-kvl-lr-nat]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.kvlLrNat===nat)));
  host.querySelectorAll('[data-kvl-lr-pos]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.kvlLrPos===pos)));
 };
 function show(p){
  selected=volleybox(p);
  detail.innerHTML='<div class="kvl-lr-detail-head"><h4>'+esc(title(p))+' <small>'+esc(p.en)+'</small></h4><button type="button" data-kvl-lr-close>닫기 ×</button></div>'+
   '<p>'+flagMarkup(p)+' '+esc(nationality(p))+' · '+esc(p.pos)+' · '+esc(height(p))+'cm · 생년월일 미확인</p>'+
   '<p>'+esc(team.team.name)+' · '+esc(team.season)+' · #'+esc(p.no)+'</p>'+
   (!p.ko&&translated(p)?'<p class="kvl-lr-transliteration">한글명: 음역 표기 (검수 전)</p>':'')+
   '<a href="'+esc(volleybox(p))+'" target="_blank" rel="noopener noreferrer">VB-&gt;</a>';
  paint();detail.hidden=false;popup?.sync();if(!desktop()&&matchMedia('(max-width:920px)').matches)detail.scrollIntoView({block:'nearest'});
 }
 host.onclick=e=>{
  if(e.target.closest('[data-kvl-lr-close]')){dismiss();return}
  if(e.target.closest('a'))return;
  const player=e.target.closest('[data-kvl-lr-player]');
  if(player){const found=visible().find(p=>volleybox(p)===player.dataset.kvlLrPlayer);if(found)show(found);return}
  const row=e.target.closest('[data-player]');if(row){const id=row.querySelector('[data-kvl-lr-player]')?.dataset.kvlLrPlayer;const found=visible().find(p=>volleybox(p)===id);if(found)show(found);return}
  const n=e.target.closest('[data-kvl-lr-nat]');if(n){nat=n.dataset.kvlLrNat;paint();return}
  const p=e.target.closest('[data-kvl-lr-pos]');if(p){pos=p.dataset.kvlLrPos;paint()}
 };
 host.querySelector('[data-kvl-lr-search]').addEventListener('input',e=>{query=norm(e.target.value);paint()});
 paint();popup?.sync();if(!popup&&team.players.length&&matchMedia('(min-width:921px)').matches)show(team.players[0]);
 return {destroy:()=>{popup?.destroy();host.onclick=null;host.replaceChildren()}};
}
return {validateIndex,validateTeam,teamEntries,render,title,flagPath};
});
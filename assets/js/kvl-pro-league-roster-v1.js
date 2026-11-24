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
const safePath=x=>/^data\/team-rosters\/sv-league\/2026-27\/[a-z0-9_-]+\.json$/.test(String(x||''));
function validateIndex(index){
 if(!index||index.version!=='1.0'||index.league?.id!=='sv-league'||!Array.isArray(index.seasons))return false;
 return index.seasons.every(s=>/^\d{4}-\d{2}$/.test(s.season)&&['men','women'].includes(s.gender)
  &&Array.isArray(s.teams)&&s.teams.every(t=>/^[A-Z0-9_-]{2,30}$/.test(t.code||'')&&t.name&&t.en
   &&Number.isInteger(t.count)&&t.count>=0&&safePath(t.source_path)));
}
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
   &&Number.isInteger(Number(p.h))&&Number(p.h)>150&&Number(p.h)<230
   &&/^[a-z]{2}$/.test(p.iso2||'')&&p.nat&&VB.test(p.vb||'')
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
const title=p=>p.ko||p.en||'선수';
const isJapan=p=>p.iso2==='jp';
function render(host,team){
 if(!host||!validateTeam(team))throw Error('SV.LEAGUE team snapshot invalid');
 let nat='all',pos='all',query='';
 const total=team.players.length,foreign=team.players.filter(p=>!isJapan(p)).length,
  recheck=team.players.filter(p=>p.status==='RECHECK').length;
 host.innerHTML='<section class="kvl-league-roster" data-kvl-pro-league-roster>'+
  '<div class="kvl-lr-top"><div><p class="ktd-section-eyebrow">JAPAN · SV.LEAGUE</p>'+
   '<h3>'+esc(team.team.name)+' <small>'+esc(team.team.en)+'</small></h3>'+
   '<p>'+esc(team.season)+' 시즌 등록 스냅샷 · '+esc(team.as_of)+' 기준</p></div>'+
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
  '<div class="kvl-lr-table"><div class="kvl-lr-head" aria-hidden="true"><span>NO.</span><span>선수명</span><span>생년월일</span><span>POS</span><span>신장</span><span>국적</span><span>Volleybox</span></div>'+
   '<div data-kvl-lr-rows></div></div>'+
  '<p class="kvl-lr-note">시즌 등록 명단 스냅샷입니다. 14인 경기 엔트리와 구분하며, 생년월일은 이번 원본에 없는 경우 추정하지 않습니다. <b>소속 재확인</b>은 구단 시즌 명단과 Volleybox의 소속 표기가 다른 선수입니다.</p>'+
 '</section>';
 const rows=host.querySelector('[data-kvl-lr-rows]'),count=host.querySelector('[data-kvl-lr-count]');
 const visible=()=>team.players.filter(p=>(nat==='all'||nat==='foreign'&&!isJapan(p)||nat==='jp'&&isJapan(p))
  &&(pos==='all'||String(p.pos||'').split('/').includes(pos))
  &&(!query||[p.ko,p.en,p.nat,p.pos].some(x=>norm(x).includes(query))));
 const row=p=>{
  const badge=p.status==='RECHECK'?'<span class="kvl-lr-recheck" title="'+esc(p.note||'출처 간 소속 표기 재확인')+'">소속 재확인</span>':'';
  const flag='<span class="kvl-lr-flag" aria-hidden="true">'+esc(p.flag||'')+'</span>';
  return '<div class="kvl-lr-row" data-player="'+esc(p.en)+'">'+
   '<span class="kvl-lr-no">'+esc(p.no)+'</span>'+
   '<span class="kvl-lr-name"><strong>'+esc(title(p))+'</strong>'+(p.ko?'<small>'+esc(p.en)+'</small>':'')+badge+'</span>'+
   '<span class="kvl-lr-dob">—</span><span class="kvl-lr-position">'+esc(p.pos)+'</span>'+
   '<span class="kvl-lr-height">'+esc(p.h)+'cm</span>'+
   '<span class="kvl-lr-nationality">'+flag+'<span>'+esc(p.nat)+'</span></span>'+
   '<span class="kvl-lr-vb"><a href="'+esc(p.vb)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(p.en)+' Volleybox 선수 프로필 열기">VB-&gt;</a></span>'+
   '<span class="kvl-lr-mobile-facts">생년월일 — · '+esc(p.pos)+' · '+esc(p.h)+'cm</span></div>';
 };
 const paint=()=>{
  const list=visible();
  rows.innerHTML=list.length?list.map(row).join(''):'<p class="ktd-empty">해당 조건의 선수가 없습니다.</p>';
  count.textContent=list.length+'명 표시 · 시즌 등록 '+total+'명';
  host.querySelectorAll('[data-kvl-lr-nat]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.kvlLrNat===nat)));
  host.querySelectorAll('[data-kvl-lr-pos]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.kvlLrPos===pos)));
 };
 host.addEventListener('click',e=>{
  const n=e.target.closest('[data-kvl-lr-nat]');if(n){nat=n.dataset.kvlLrNat;paint();return}
  const p=e.target.closest('[data-kvl-lr-pos]');if(p){pos=p.dataset.kvlLrPos;paint()}
 });
 host.querySelector('[data-kvl-lr-search]').addEventListener('input',e=>{query=norm(e.target.value);paint()});
 paint();
 return {destroy:()=>{host.replaceChildren()}};
}
return {validateIndex,validateTeam,teamEntries,render};
});
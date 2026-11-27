/* KVL common profile presentation v1. No identity resolution or private writes. */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fact=(label,value)=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value||'미확인')+'</dd></div>';
function summary(p){
 const height=Number(p.height)>0?String(p.height)+' cm':'키 확인 불가';
 return '<section class="kvl-cpp-summary"><div class="kvl-cpp-name"><h3>'+esc(p.name||'선수')+'</h3>'+ (p.en&&p.en!==p.name?'<span>'+esc(p.en)+'</span>':'')+'</div>'+
 (p.affiliation?'<p class="kvl-cpp-affiliation">'+esc(p.affiliationLabel||'자료 기준 소속')+' · '+esc(p.affiliation)+'</p>':'')+
 '<dl class="kvl-cpp-facts">'+fact('포지션',p.position)+fact('신장',height)+fact('생년월일',p.dob)+ (p.nationality?fact('국적',p.nationality):'')+(p.number!=null&&p.number!==''?fact('등번호',p.number):'')+'</dl></section>';
}
const validId=id=>/^KVL-P-\d{6}$/.test(String(id||''));
const key=v=>String(v||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const vbKey=v=>String(v||'').match(/^https:\/\/(?:www\.)?volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p(\d+)\/?$/i)?.[1]||'';
function resolve(catalog,ref){
 if(!Array.isArray(catalog)||!ref)return null;
 const blocked=id=>root.KVLPlayerIdCollisionV1?.isConflict(id)||!root.KVLPlayerIdCollisionV1;
 const nameMatch=p=>!!((key(ref.name)&&key(ref.name)===key(p.nameKo))||(key(ref.en)&&key(ref.en)===key(p.nameEn)));
 let matches=[];
 if(ref.id){
  if(!validId(ref.id)||blocked(ref.id))return null;
  matches=catalog.filter(p=>p.playerId===ref.id);
 }else if(vbKey(ref.vb)){
  matches=catalog.filter(p=>vbKey(p.volleybox)===vbKey(ref.vb));
 }else return null;
 if(matches.length!==1)return null;
 const p=matches[0];
 if(!validId(p.playerId)||blocked(p.playerId)||!nameMatch(p)||!ref.gender||ref.gender!==p.gender)return null;
 if(ref.dob&&p.birthDate&&ref.dob!==p.birthDate)return null;
 if(!ref.id&&(!vbKey(p.volleybox)||!key(ref.en)||key(ref.en)!==key(p.nameEn)))return null;
 if(ref.id&&!ref.verified&&(!ref.dob||!p.birthDate||ref.dob!==p.birthDate))return null;
 return p;
}
function idFromHref(href){return String(href||'').match(/^player\.html\?id=(KVL-P-\d{6})(?:&|$)/)?.[1]||''}
function attach(detail,ref){
 if(!detail?.isConnected)return;
 const panel=detail.querySelector('.kvl-cpp-summary');if(!panel)return;
 const status=document.createElement('div');status.className='kvl-cpp-connection';status.textContent='공통 선수 정보 연결 확인 중…';panel.after(status);
 Promise.resolve(root.KVLPlayerCatalogReady).then(catalog=>{
  if(!status.isConnected)return;
  const p=resolve(catalog,ref);
  if(!p){status.textContent='공통 선수 ID 미확인 · 원본 명단 정보 유지';return}
  // Master identity fields fill gaps only. A roster's measured height, registration position and season affiliation are never replaced.
  const merged={...ref,name:p.nameKo||ref.name||p.nameEn,en:p.nameEn||ref.en,dob:p.birthDate||ref.dob,height:ref.height||p.height,position:ref.position||p.rawPosition,nationality:ref.nationality||p.nationality};
  panel.outerHTML=summary(merged);
  status.replaceChildren();
  const link=document.createElement('a');link.href='players.html?id='+encodeURIComponent(p.playerId);link.textContent='공통 선수 프로필';status.append(link);
  status.dataset.kvlCppId=p.playerId;
  root.dispatchEvent(new CustomEvent('kvl:common-profile-linked',{detail:{id:p.playerId}}));
 }).catch(()=>{if(status.isConnected)status.textContent='공통 선수 정보 조회 실패 · 원본 명단 정보 유지'});
}
root.KVLCommonPlayerProfileV1=Object.freeze({summary,resolve,idFromHref,attach});
})(globalThis);

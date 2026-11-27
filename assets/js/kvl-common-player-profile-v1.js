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
root.KVLCommonPlayerProfileV1=Object.freeze({summary});
})(globalThis);

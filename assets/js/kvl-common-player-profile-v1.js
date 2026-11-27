/* KVL common profile presentation and fail-closed identity resolution v1. No private writes. */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fact=(label,value,link)=>'<div><dt>'+esc(label)+'</dt><dd'+(label==='국적'?' data-nationality':'')+'>'+ (link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">'+esc(value)+'</a>':esc(value||'미확인'))+'</dd></div>';
const safeUrl=v=>/^https:\/\/[a-z0-9.-]+(?:\/|$)[^\s<>"']*$/i.test(String(v||''))?String(v):'';
const vbUrl=v=>/^https:\/\/(?:(?:www|women)\.)?volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p\d+\/?$/i.test(String(v||''))?String(v):'';
function summary(p){
 const height=Number(p.height)>0?String(p.height)+' cm':'키 확인 불가';
 return '<section class="kvl-cpp-summary"><div class="kvl-cpp-name"><small class="kvl-cpp-kicker">PLAYER</small><h3>'+esc(p.name||'선수')+'</h3>'+ (p.en&&p.en!==p.name?'<span class="kvl-cpp-english">'+esc(p.en)+'</span>':'')+
 (p.affiliation?'<p class="kvl-cpp-affiliation">'+esc(p.affiliationLabel||'자료 기준 소속')+' · '+esc(p.affiliation)+'</p>':'')+'</div>'+
 '<section class="kvl-cpp-section"><h4>선수 정보</h4><dl class="kvl-cpp-facts">'+
 (p.number!=null&&p.number!==''?fact('등번호','#'+p.number):'')+fact('포지션',p.position)+fact('신장',height+(p.heightNote||''))+fact('생년월일',p.dob)+fact('국적',p.nationality)+
 (vbUrl(p.vb)?fact('Volleybox','VB →',vbUrl(p.vb)):'')+'</dl></section></section>';
}
/* Use the approved team header's own dismiss action, not a second header. */
function mountSummary(detail,p,header){
 const previous=detail.querySelector(header);if(!previous)return null;
 previous.insertAdjacentHTML('beforebegin',summary(p));
 const panel=previous.previousElementSibling;
 const close=previous.querySelector('button');
 const flag=detail.querySelector('.kvl-rs-flag,.kvl-lr-flag-image');
 if(flag){const copy=flag.cloneNode(true);copy.classList.add('kvl-cpp-nationality-flag');panel.querySelector('[data-nationality]')?.prepend(copy);}
 if(close){close.classList.add('kvl-cpp-close');panel.querySelector('.kvl-cpp-name').append(close)}
 previous.remove();detail.classList.add('kvl-cpp-detail');
 return panel;
}
function section(title,content){return content?'<section class="kvl-cpp-section"><h4>'+esc(title)+'</h4>'+content+'</section>':''}
function details(p,{draftRows=[],omit=[]}={}){
 const skip=new Set(omit),parts=[];
 const rows=(items)=>'<dl class="kvl-cpp-facts">'+items.map(([k,v,u])=>fact(k,v,u)).join('')+'</dl>';
 const education=[['고등학교',p.highSchool],['대학교',p.university],['학년',p.gradeLabel]].filter(x=>x[1]);
 if(education.length&&!skip.has('education'))parts.push(section('출신학교',rows(education)));
 const career=p.careerDraft;const draft=career?(career.kind==='trainee'?'수련선수 지명':Number.isInteger(career.round)&&Number.isInteger(career.pick)?career.round+'라운드 '+career.pick+'순위':''):'';
 if(draft&&!skip.has('draft'))parts.push('<section class="kvl-cpp-pick"><small>'+esc(career.season||'')+' KOVO 신인드래프트</small><strong>'+esc([career.team,draft].filter(Boolean).join(' · '))+'</strong></section>');
 const basics=[['시즌',p.season],['리그',p.league],['최근 등록 대회',p.latestCompetition]].filter(x=>x[1]);
 if(basics.length&&!skip.has('season'))parts.push(section('등록 정보',rows(basics)));
 const history=(Array.isArray(p.rosterHistory)?p.rosterHistory:[]).map(x=>[x.competition_start||x.competition_date||'',x.competition_name||x.competition_id||'',x.school_name||x.team_name||'',x.jersey_number==null||x.jersey_number===''?'':'#'+x.jersey_number,x.position_primary||x.position||'',x.height_cm?x.height_cm+' cm':''].filter(Boolean).join(' · ')).filter(Boolean);
 const list=values=>'<div class="kvl-cpp-history">'+[...new Set(values)].map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>';
 if(history.length&&!skip.has('history'))parts.push(section('등록·소속 이력',list(history)));
 const national=[...(p.highlights||[]).filter(h=>h.kind==='national'&&h.verification==='verified_official').map(h=>[h.date,h.event||h.label].filter(Boolean).join(' · ')),...(p.nationalHistory||[]).map(h=>typeof h==='string'?h:[h.year,h.team,h.competition].filter(Boolean).join(' · '))].filter(Boolean);
 if(national.length&&!skip.has('national'))parts.push(section('국가대표 이력',list(national)));
 const awards=(p.awards||[]).map(a=>typeof a==='string'?a:[a.year,a.competition,a.title||a.award].filter(Boolean).join(' · ')).filter(Boolean);
 if(awards.length&&!skip.has('awards'))parts.push(section('수상 경력',list(awards)));
 const apps=draftRows.filter(r=>r.player_id===(p.playerId||p.id)&&r.application_status==='confirmed').map(r=>{
 const pick=r.selection||{};return [r.season,'공식 참가 신청',pick.team,Number.isInteger(pick.round)&&Number.isInteger(pick.pick)?pick.round+'라운드 '+pick.pick+'순위':''].filter(Boolean).join(' · ');
 });
 if(apps.length&&!skip.has('applications'))parts.push(section('드래프트 참가 이력',list(apps)));
 const links=[['공식 등록 공시',safeUrl(p.sourceRef?.registration_source)],['FIVB / VNL',safeUrl(p.publicLinks?.fivb_profile)],['KOVO 프로필',safeUrl(p.publicLinks?.kovo_profile)]].filter(x=>x[1]);
 if(links.length&&!skip.has('sources'))parts.push(section('공식 출처','<div class="kvl-cpp-source-links">'+links.map(([label,url])=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>').join('')+'</div>'));
 return parts.join('');
}
const validId=id=>/^KVL-P-\d{6}$/.test(String(id||''));
const key=v=>String(v||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const vbKey=v=>String(v||'').match(/^https:\/\/(?:www\.)?volleybox\.net\/(?:ko\/)?[a-z0-9-]+-p(\d+)\/?$/i)?.[1]||'';
function conflictingIds(records){
 const blocked=new Set(),groups=new Map();
 for(const p of records||[]){if(!validId(p.playerId))continue;const group=groups.get(p.playerId)||[];group.push(p);groups.set(p.playerId,group)}
 for(const [id,group] of groups){
  for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
   const a=group[i],b=group[j];
   const sharedName=(key(a.nameKo)&&key(a.nameKo)===key(b.nameKo))||(key(a.nameEn)&&key(a.nameEn)===key(b.nameEn));
   const bothNamed=!!(key(a.nameKo)||key(a.nameEn))&&!!(key(b.nameKo)||key(b.nameEn));
   if((a.gender&&b.gender&&a.gender!==b.gender)||(a.birthDate&&b.birthDate&&a.birthDate!==b.birthDate)||(bothNamed&&!sharedName)||(vbKey(a.volleybox)&&vbKey(b.volleybox)&&vbKey(a.volleybox)!==vbKey(b.volleybox)))blocked.add(id);
  }
 }
 return blocked;
}
function resolve(catalog,ref){
 if(!Array.isArray(catalog)||!ref)return null;
 const blocked=id=>root.KVLPlayerIdCollisionV1?.isConflict(id)||!root.KVLPlayerIdCollisionV1||root.KVLCommonProfileBlockedIds?.has(id);
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
 if(vbKey(ref.vb)&&vbKey(p.volleybox)&&vbKey(ref.vb)!==vbKey(p.volleybox))return null;
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
  const merged={...ref,name:p.nameKo||ref.name||p.nameEn,en:p.nameEn||ref.en,dob:p.birthDate||ref.dob,height:ref.height||p.height,position:ref.position||p.rawPosition,nationality:ref.nationality||p.nationality,vb:ref.vb||p.volleybox};
  const close=panel.querySelector('.kvl-cpp-close');const flag=panel.querySelector('.kvl-cpp-nationality-flag');panel.insertAdjacentHTML('beforebegin',summary(merged));const next=panel.previousElementSibling;if(close)next.querySelector('.kvl-cpp-name').append(close);if(flag)next.querySelector('.kvl-cpp-facts dd[data-nationality]')?.prepend(flag);panel.remove();
  const extra=details(p,{omit:ref.omitDetails||[]});if(extra){detail.insertAdjacentHTML('beforeend',extra);}
  detail.append(status);
  status.replaceChildren();
  const link=document.createElement('a');link.href='players.html?id='+encodeURIComponent(p.playerId);link.textContent='공통 선수 프로필';status.append(link);
  status.dataset.kvlCppId=p.playerId;
  root.dispatchEvent(new CustomEvent('kvl:common-profile-linked',{detail:{id:p.playerId}}));
 }).catch(()=>{if(status.isConnected)status.textContent='공통 선수 정보 조회 실패 · 원본 명단 정보 유지'});
}
root.KVLCommonPlayerProfileV1=Object.freeze({summary,mountSummary,details,resolve,conflictingIds,idFromHref,attach});
})(globalThis);

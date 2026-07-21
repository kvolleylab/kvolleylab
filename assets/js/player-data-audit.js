(()=>{
const box=document.getElementById('playerAuditStatus');if(!box)return;
const urls=['data/master/player_master_229_v2.json','data/master/player_master_international_v1.json'];
const arr=v=>Array.isArray(v)?v:(Array.isArray(v?.players)?v.players:[]);
const value=(o,path)=>path.split('.').reduce((a,k)=>a?.[k],o);
Promise.all(urls.map(u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${u}: HTTP ${r.status}`);return r.json()}))).then(data=>{
 const domestic=arr(data[0]),international=arr(data[1]),all=[...domestic,...international];
 const ids=all.map(p=>value(p,'system.player_id')).filter(Boolean);const seen=new Set(),dup=new Set();ids.forEach(id=>seen.has(id)?dup.add(id):seen.add(id));
 const missingId=all.filter(p=>!value(p,'system.player_id')).length;
 const missingName=all.filter(p=>!value(p,'identity.name_ko')&&!value(p,'identity.name_en')).length;
 const stats={
  school:domestic.filter(p=>!value(p,'current_roster.school_name')&&!value(p,'current_roster.team_name')).length,
  position:domestic.filter(p=>!value(p,'volleyball.position')&&!value(p,'current_roster.position')).length,
  birth:domestic.filter(p=>!value(p,'identity.birth_date')).length,
  height:domestic.filter(p=>!value(p,'physical.height_cm')).length,
  source:domestic.filter(p=>!(p.source_ids||[]).length).length
 };
 const blocking=dup.size+missingId+missingName;
 box.className=`ps-audit ${blocking?'is-error':'is-warning'}`;
 box.innerHTML=`<div class="ps-audit-head"><strong>${blocking?'선수 DB 구조 오류':'선수 DB 구조 검증 통과 · 내용 보완 중'}</strong><span>국내 ${domestic.length}명 · 국제 ${international.length}명</span></div><div class="ps-audit-grid"><span>중복 ID <b>${dup.size}</b></span><span>ID 누락 <b>${missingId}</b></span><span>이름 누락 <b>${missingName}</b></span><span>학교 누락 <b>${stats.school}</b></span><span>포지션 누락 <b>${stats.position}</b></span><span>생년월일 누락 <b>${stats.birth}</b></span><span>신장 누락 <b>${stats.height}</b></span><span>출처 누락 <b>${stats.source}</b></span></div><p>검색·상세 연결 구조는 자동 점검하며, 누락 항목은 공개 데이터 완성도 개선 대상으로 관리합니다.</p>`;
}).catch(e=>{box.className='ps-audit is-error';box.innerHTML=`<strong>선수 DB 점검 실패</strong><p>${String(e.message||e)}</p>`});
})();
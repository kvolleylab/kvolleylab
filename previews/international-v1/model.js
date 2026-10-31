/* International presentation contract. No ranking calculation, IDs or source text writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLInternationalModel=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const states=new Set(['verified','unverified','not_applicable']);
function validate(p,d){
 const errors=[];
 if(p.version!==1)errors.push('presentation version must be 1');
 if(p.presentation!=='international-home-v1')errors.push('unsupported presentation');
 if(!['avc','fivb','games'].includes(d.competitionFamily))errors.push('international family required');
 if(p.competitionId!==d.competitionId||p.season!==d.season)errors.push('presentation source mismatch');
 const qs=new Map((d.qualifications||[]).map(x=>[x.id,x]));
 for(const s of p.explanation?.cards||[]){if(!qs.has(s.ref))errors.push('missing qualification '+s.ref);if(!['rule','result','ranking'].includes(s.kind))errors.push('invalid card kind');}
 for(const r of [...(p.explanation?.facts||[]),...(p.explanation?.relations||[])]){
  if(!states.has(r.state))errors.push('invalid evidence state');
  if(['verified','not_applicable'].includes(r.state)&&!(r.sources||[]).length)errors.push('evidence required');
 }
 for(const source of Object.values(p.sources||{}))if(!/^https:\/\//.test(source.url||''))errors.push('https source required');
 const refs=[...(p.explanation?.facts||[]),...(p.explanation?.relations||[]),...(p.explanation?.cards||[]),...(p.explanation?.flow||[])];
 for(const row of refs)for(const ref of row.sources||[])if(!p.sources?.[ref])errors.push('missing source '+ref);
 return errors;
}
function explanation(d,p){
 const cards=(p.explanation?.cards||[]).map(s=>{
  const original=(d.qualifications||[]).find(q=>q.id===s.ref);if(!original)return null;
  if(s.kind==='result'&&d.status!=='completed')return {...s,id:original.id,brand:original.brand,title:d.status==='active'?'최종 성적 확정 전':'대회 시작 전',description:'확정된 최종 성적은 대회 종료 후 표시합니다.',foot:'공식 결과 확인 후 표시',resultTeams:[]};
  const resultTeams=d.status==='completed'?(original.resultTeams||[]):d.status==='active'?(s.confirmedResultTeams||[]):[];
  return {...original,...s,resultTeams};
 }).filter(Boolean);
 // Undeclared legacy qualifications remain visible; a presentation must not silently drop text.
 for(const original of d.qualifications||[])if(!cards.some(c=>c.id===original.id))cards.push({...original,kind:'rule',resultTeams:d.status==='completed'?(original.resultTeams||[]):[]});
 return {title:d.meaning?.title||'대회 의미 · 진행 구조',note:d.meaning?.note||'',facts:p.explanation?.facts||[],flow:p.explanation?.flow||[],cards,relations:p.explanation?.relations||[]};
}
function initialMonth(d,months,now=new Date()){
 if(!months.length)return null;
 if(d.status==='completed')return months.at(-1);
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).formatToParts(now);
 const current=parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value;
 return d.status==='active'&&months.includes(current)?current:months[0];
}
function visibleRanking(d){return (d.finalRanking||[]).filter(r=>d.status==='completed'||d.status==='active'&&r.confirmed===true);}
function rankLabel(row,rows){return (rows.filter(x=>Number(x.rank)===Number(row.rank)).length>1?'공동 ':'')+row.rank+'위';}
return {validate,explanation,initialMonth,visibleRanking,rankLabel};
});

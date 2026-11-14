/* Scoped standings extension: no requests, timers or writes to competition data. */
(function(root,factory){
  const api=factory(root.KVLVLeagueMatrixCoreV1||(typeof require==='function'?require('./kvl-vleague-matrix-core-v1.js'):null));
  if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLVLeagueMatrixV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Matrix){
  'use strict';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const enabled=d=>/^KVL-COMP-VLEAGUE-(M|W)-2026-27$/.test(d?.competitionId||'')&&d.structure?.standings?.mode==='single-league';
  function renderRounds(model){
    return model.rounds.map(r=>{
      const state=r.issues.length?'자료 확인 필요':!r.started?'미시작':r.complete?(r.cumulativeComplete?'라운드 종료':'이전 라운드 미완료'):'진행 중';
      const title=`${r.round}ROUND`,visible=r.started;
      return `<section class="matrix-round" aria-labelledby="kvl-matrix-round-${r.round}" data-round="${r.round}"><div class="matrix-round-title"><h4 id="kvl-matrix-round-${r.round}">${title}</h4><span class="matrix-round-state">${state}${visible?' · '+r.completed+'/21':''}</span></div><div class="matrix-table-wrap"><table class="matrix-table" aria-label="${r.round}라운드 승패 조견표"><colgroup><col class="col-rank"><col class="col-total"><col class="col-round"><col class="col-team">${model.teams.map(t=>'<col class="col-result'+(/^[가-힣]{3,}$|^[A-Z]{4,}$/.test(t.short)?' is-wide':'')+'">').join('')}</colgroup><thead><tr><th scope="col">순위</th><th scope="col" aria-label="총승점"><span>총</span><span>승점</span></th><th scope="col" aria-label="라운드 승점"><span>R</span><span>승점</span></th><th scope="col">팀</th>${model.teams.map(t=>`<th scope="col" aria-label="${escape(t.name)}">${escape(t.short)}</th>`).join('')}</tr></thead><tbody>${r.rows.map(t=>`<tr data-team="${escape(t.code)}"><td class="matrix-rank${visible&&t.rank===1?' is-first':''}" aria-label="${visible&&t.rank?`${t.rank}위${t.tied?' 동률':''}`:'순위 미확정'}">${visible?(t.rank??'—'):''}${visible&&t.tied?'<sup>=</sup>':''}</td><td class="matrix-total">${visible?t.points:''}</td><td class="matrix-round-points">${visible?t.rPoints:''}</td><th scope="row" class="matrix-team" aria-label="${escape(t.name)}">${escape(t.short)}</th>${model.teams.map(o=>o.code===t.code?'<td class="matrix-self" aria-label="동일 팀"></td>':`<td data-opponent="${escape(o.code)}" aria-label="${escape(t.name+' 대 '+o.name)}: ${t.sets[o.code]===null?'종료 결과 없음':t.sets[o.code]+'세트 획득'}">${t.sets[o.code]??''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
    }).join('');
  }
  function render(data){
    if(!enabled(data))return '';
    const heading='<header class="matrix-heading"><div><p>ROUND BY ROUND</p><h3 id="kvl-matrix-title">승패 조견표</h3></div><span>2026–27 · 1–6ROUND</span></header>';
    let content;
    try{
      const model=Matrix.build(data,data);
      content=`<p class="matrix-explainer">상대팀 칸은 <strong>획득 세트 수</strong> · 총승점과 순위는 해당 라운드까지 누적</p>${model.issues.length?'<p class="matrix-issue" role="status">자료 확인 필요 · 누락·충돌 결과를 제외했으며 관련 순위는 표시하지 않습니다.</p>':''}<div class="matrix-grid">${renderRounds(model)}</div><p class="matrix-note">팀 순서: 2025–26 최종 성적순 · 종료 경기만 반영 · 공란은 미진행, 0은 0세트 패배<br>진행 중 순위는 잠정 순위입니다. = 표시는 동률입니다.</p>`;
    }catch{
      content='<p class="matrix-issue" role="status">조견표 데이터를 확인할 수 없습니다. 최신 경기 결과를 불러온 뒤 다시 확인해 주세요.</p>';
    }
    return `<section class="kvl-vleague-matrix" data-matrix-gender="${data.gender==='women'?'women':'men'}" aria-labelledby="kvl-matrix-title">${heading}${content}</section>`;
  }
  return {enabled,render,renderRounds};
});

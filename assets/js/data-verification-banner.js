(()=>{
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(!['schedules.html','vnl.html'].includes(path))return;

  const style=document.createElement('style');
  style.textContent=`
    .kvl-data-audit{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:18px;margin:16px 0 22px;padding:14px 16px;border:1px solid #bbf7d0;border-radius:14px;background:#f0fdf4;color:#14532d;font-family:Arial,sans-serif}
    .kvl-data-audit.fail{border-color:#fecaca;background:#fff1f2;color:#991b1b}
    .kvl-data-audit-main{display:flex;align-items:flex-start;gap:10px}.kvl-data-audit-icon{font-size:18px;font-weight:900}.kvl-data-audit strong{display:block;margin-bottom:3px;font-size:14px}.kvl-data-audit p{margin:0;color:inherit;font-size:12px;line-height:1.5;opacity:.88}
    .kvl-data-audit-meta{flex:0 0 auto;text-align:right;font-size:12px;font-weight:700;line-height:1.55}
    @media(max-width:640px){.kvl-data-audit{align-items:flex-start;flex-direction:column}.kvl-data-audit-meta{text-align:left}}
  `;
  document.head.appendChild(style);

  const mount=()=>{
    if(document.querySelector('.kvl-data-audit'))return;
    const target=path==='schedules.html'
      ? document.getElementById('scheduleSeasonSelector')
      : document.querySelector('.vnl-hero');
    if(!target)return;

    fetch('data/validation/vnl-2026-audit.json?v=20260721-2',{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error('audit');return r.json()})
      .then(audit=>{
        const c=audit.checks||{};
        const passed=audit.status==='passed'&&
          c.preliminary_matches===108&&c.teams===18&&c.matches_per_team===12&&
          c.score_text_mismatches===0&&c.winner_mismatches===0&&
          c.set_count_mismatches===0&&c.standings_mismatches===0;
        const box=document.createElement('section');
        box.className=`kvl-data-audit${passed?'':' fail'}`;
        box.setAttribute('role','status');
        box.innerHTML=`<div class="kvl-data-audit-main"><span class="kvl-data-audit-icon">${passed?'✓':'!'}</span><div><strong>${passed?'데이터 검증 완료':'데이터 검증 실패'}</strong><p>${passed?'예선 108경기, 18개 팀 최종 성적, 세트스코어와 세트별 점수를 전수 검산했습니다.':'검증 기준을 통과하지 못해 일부 통계 표시를 중단했습니다.'}</p></div></div><div class="kvl-data-audit-meta">검증일 ${audit.checked_at||'-'}<br>${passed?'오류 0건':'재검수 필요'}</div>`;
        target.insertAdjacentElement('afterend',box);
      })
      .catch(()=>{
        const box=document.createElement('section');
        box.className='kvl-data-audit fail';
        box.innerHTML='<div class="kvl-data-audit-main"><span class="kvl-data-audit-icon">!</span><div><strong>검증 정보 확인 불가</strong><p>검증 파일을 불러오지 못해 데이터 상태를 확인할 수 없습니다.</p></div></div>';
        target.insertAdjacentElement('afterend',box);
      });
  };

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount):mount();
})();
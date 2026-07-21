(()=>{
  const AUDIT_URL='data/validation/vnl-2026-audit.json?v=20260721-1';
  const MATCH_URL='data/matches/vnl-2026-men.json?v=20260721-guard';
  const RESULT_URL='data/results/vnl-2026-men-results.json?v=20260721-guard';
  const expectedChecks={preliminary_matches:108,teams:18,matches_per_team:12,total_wins:108,total_losses:108,score_text_mismatches:0,winner_mismatches:0,set_count_mismatches:0,standings_mismatches:0};
  const fail=(reason)=>{
    const form=document.getElementById('form');
    if(form)form.innerHTML=`<h3>경기 전 팀 흐름</h3><div class="md-empty" style="border-color:#C62828;color:#C62828;font-weight:800">데이터 검증에 실패해 팀 흐름 표시를 차단했습니다.<br><small>${reason}</small></div>`;
    document.documentElement.dataset.kvlDataIntegrity='failed';
  };
  const pass=()=>{
    document.documentElement.dataset.kvlDataIntegrity='passed';
    const hero=document.querySelector('#summary .md-status-line');
    if(hero&&!hero.querySelector('.kvl-verified-badge')){
      const badge=document.createElement('span');
      badge.className='kvl-verified-badge';
      badge.textContent='✓ 데이터 검증 완료';
      badge.style.cssText='margin-left:8px;color:#18794e;font-weight:800';
      hero.appendChild(badge);
    }
  };
  const validate=async()=>{
    try{
      const [audit,matchesData,resultData]=await Promise.all([
        fetch(AUDIT_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('audit');return r.json()}),
        fetch(MATCH_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('matches');return r.json()}),
        fetch(RESULT_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('results');return r.json()})
      ]);
      if(audit.status!=='passed')throw new Error('audit status');
      for(const [k,v] of Object.entries(expectedChecks))if(audit.checks?.[k]!==v)throw new Error(`audit ${k}`);
      const prelim=(matchesData.matches||[]).filter(m=>m.stage==='preliminary');
      if(prelim.length!==108)throw new Error(`match count ${prelim.length}`);
      const resultMap=new Map((resultData.results||[]).map(r=>[r.match_id,r]));
      for(const m of prelim){
        const r=resultMap.get(m.match_id);
        if(!m.score||!r?.final_score)throw new Error(`missing score ${m.match_id}`);
        if(Number(m.score.home_sets)!==Number(r.final_score.home_sets)||Number(m.score.away_sets)!==Number(r.final_score.away_sets))throw new Error(`score mismatch ${m.match_id}`);
        if(Array.isArray(r.sets)&&r.sets.length){
          const hw=r.sets.filter(s=>Number(s.home_points)>Number(s.away_points)).length;
          const aw=r.sets.filter(s=>Number(s.away_points)>Number(s.home_points)).length;
          if(hw!==Number(r.final_score.home_sets)||aw!==Number(r.final_score.away_sets))throw new Error(`set mismatch ${m.match_id}`);
        }
      }
      pass();
    }catch(e){fail(e?.message||'unknown');}
  };
  const observer=new MutationObserver(()=>{if(document.getElementById('form')){observer.disconnect();validate();}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function filterMatches(list,{stage='전체',pool='전체',getStage,getPool}){
    return (list||[]).filter(item=>{
      if(stage!=='전체'&&getStage(item)!==stage)return false;
      if(stage==='예선'&&pool!=='전체'&&getPool(item)!==pool)return false;
      return true;
    });
  }
  function renderStageFilters({container,stages,stage='전체',pools=[],pool='전체',showPoolWhen='예선',onChange}){
    if(!container)return;
    const poolSelect=stage===showPoolWhen?`<label class="cd-pool-filter"><span>예선 조</span><select><option value="전체">전체</option>${pools.map(p=>`<option value="${esc(p)}" ${p===pool?'selected':''}>${esc(p)}조</option>`).join('')}</select></label>`:'';
    container.innerHTML=stages.map(s=>`<button type="button" class="${s===stage?'is-active':''}" data-stage="${esc(s)}">${esc(s)}</button>`).join('')+poolSelect;
    container.querySelectorAll('[data-stage]').forEach(btn=>btn.addEventListener('click',()=>onChange?.({stage:btn.dataset.stage,pool:'전체'})));
    const select=container.querySelector('select');
    if(select)select.addEventListener('change',()=>onChange?.({stage,pool:select.value}));
  }
  window.KVLCompetitionResultsStandard={filterMatches,renderStageFilters};
})();

(()=>{
  const grid=document.querySelector('#school .dc-school-grid');
  if(!grid)return;
  const cards=[...grid.querySelectorAll('.dc-school-card')];
  if(!cards.length)return;

  const labels={live:'진행 중',upcoming:'예정',ended:'종료'};
  const descriptions={
    live:'현재 진행 중인 대회',
    upcoming:'시작일이 가까운 순',
    ended:'최근 종료 대회부터'
  };

  const renderGroups=()=>{
    grid.querySelectorAll('.dc-state-group-title').forEach(node=>node.remove());
    const visible=cards.filter(card=>!card.hidden);
    let lastState='';
    visible.forEach(card=>{
      const state=card.dataset.state||'ended';
      if(state!==lastState){
        const count=visible.filter(item=>(item.dataset.state||'ended')===state).length;
        const heading=document.createElement('div');
        heading.className=`dc-state-group-title dc-state-group-${state}`;
        heading.innerHTML=`<div><strong>${labels[state]||state}</strong><span>${descriptions[state]||''}</span></div><em>${count}개 대회</em>`;
        grid.insertBefore(heading,card);
        lastState=state;
      }
    });
  };

  const filterRow=document.querySelector('#school .dc-filter-row');
  filterRow?.addEventListener('click',()=>requestAnimationFrame(renderGroups));
  renderGroups();
})();
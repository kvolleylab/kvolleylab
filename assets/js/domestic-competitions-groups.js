(()=>{
  const school=document.getElementById('school');
  const grid=school?.querySelector('.dc-school-grid');
  if(!grid)return;
  const cards=[...grid.querySelectorAll('.dc-school-card')];
  if(!cards.length)return;

  const byStart=(a,b)=>String(a.dataset.start||'').localeCompare(String(b.dataset.start||''));
  const byRecentEnd=(a,b)=>String(b.dataset.end||'').localeCompare(String(a.dataset.end||''));
  const titleOf=card=>card.querySelector('h3')?.textContent.trim()||'대회';
  const periodOf=card=>card.querySelector('.dc-card-info>p')?.textContent.trim()||'';
  const hrefOf=card=>card.querySelector('.dc-card-info')?.getAttribute('href')||'#';

  const focus=document.createElement('section');
  focus.className='dc-focus-board';
  focus.setAttribute('aria-label','현재 및 다음 대회');
  const live=cards.filter(card=>card.dataset.state==='live').sort(byStart)[0];
  const upcoming=cards.filter(card=>card.dataset.state==='upcoming').sort(byStart)[0];
  const focusItem=(card,type)=>card?`<a class="dc-focus-card dc-focus-${type}" href="${hrefOf(card)}"><span>${type==='live'?'NOW · 진행 중':'NEXT · 다음 대회'}</span><strong>${titleOf(card)}</strong><small>${periodOf(card)}</small><b>대회 대시보드 보기 →</b></a>`:'';
  focus.innerHTML=`<div class="dc-focus-head"><div><strong>지금 확인할 대회</strong><span>현재 진행 상황과 다음 일정을 먼저 확인하세요.</span></div></div><div class="dc-focus-grid">${focusItem(live,'live')}${focusItem(upcoming,'next')}</div>`;
  const tools=school.querySelector('.dc-overview-tools');
  (tools||grid).before(focus);
  if(!live&&!upcoming)focus.hidden=true;

  const timelineTitle=document.createElement('div');
  timelineTitle.className='dc-timeline-title';
  timelineTitle.innerHTML='<div><strong>2026 대회 일정</strong><span>전체 대회를 개최일 순서대로 확인합니다.</span></div><em>3월 → 9월</em>';
  grid.before(timelineTitle);

  const arrange=filter=>{
    grid.querySelectorAll('.dc-state-group-title').forEach(node=>node.remove());
    const visible=cards.filter(card=>!card.hidden);
    const sorted=[...visible].sort(filter==='ended'?byRecentEnd:byStart);
    sorted.forEach(card=>grid.appendChild(card));
    timelineTitle.querySelector('strong').textContent=filter==='all'?'2026 대회 일정':filter==='live'?'진행 중인 대회':filter==='upcoming'?'예정 대회':'종료 대회';
    timelineTitle.querySelector('span').textContent=filter==='all'?'전체 대회를 개최일 순서대로 확인합니다.':filter==='ended'?'최근 종료된 대회부터 확인합니다.':filter==='upcoming'?'시작일이 가까운 대회부터 확인합니다.':'현재 진행 중인 대회입니다.';
    timelineTitle.querySelector('em').textContent=`${sorted.length}개 대회`;
  };

  const filterRow=school.querySelector('.dc-filter-row');
  filterRow?.addEventListener('click',event=>{
    const button=event.target.closest('button[data-filter]');
    if(!button)return;
    requestAnimationFrame(()=>arrange(button.dataset.filter||'all'));
  });
  arrange('all');
})();
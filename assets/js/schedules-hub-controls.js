(()=>{
  const params=new URLSearchParams(location.search);
  const competition=params.get('competition')||'vnl';
  const season=params.get('season')||'2026';
  const currentTeam=params.get('team')||'';
  const selectorHost=document.getElementById('scheduleSeasonSelector');
  if(!selectorHost)return;

  const shell=document.createElement('section');
  shell.className='schedule-control-shell';
  shell.setAttribute('aria-label','일정 빠른 선택');
  shell.innerHTML='<p class="schedule-control-title">일정 빠른 선택</p><div class="schedule-control-row"></div>';
  selectorHost.parentNode.insertBefore(shell,selectorHost);
  shell.querySelector('.schedule-control-row').appendChild(selectorHost);

  const teamControl=document.createElement('label');
  teamControl.className='schedule-team-quick';
  teamControl.innerHTML='<span>팀</span><select id="scheduleTeamQuick"><option value="">전체 팀</option></select>';
  shell.querySelector('.schedule-control-row').appendChild(teamControl);

  const guide=document.createElement('div');
  guide.className='schedule-filter-guide';
  guide.innerHTML='<strong>세부 필터</strong><span>주차, 개최 지역, 복수 국가와 현지시간 설정은 달력 왼쪽 필터에서 조정합니다.</span>';
  shell.insertAdjacentElement('afterend',guide);

  const dataPath=competition==='vnl'&&season==='2026'?'data/matches/vnl-2026-calendar.json?v=20260721-1':null;
  if(!dataPath){teamControl.style.display='none';return;}

  fetch(dataPath,{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const teams=[...new Set((data.matches||[]).flatMap(row=>[row[3],row[4]]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
    const select=teamControl.querySelector('select');
    select.insertAdjacentHTML('beforeend',teams.map(team=>`<option value="${team}" ${team===currentTeam?'selected':''}>${team}</option>`).join(''));
    select.addEventListener('change',()=>{
      const next=new URL(location.href);
      next.searchParams.set('competition',competition);
      next.searchParams.set('season',season);
      if(select.value)next.searchParams.set('team',select.value);else next.searchParams.delete('team');
      next.searchParams.set('view','calendar');
      location.href=`${next.pathname.split('/').pop()}${next.search}`;
    });
  }).catch(()=>{teamControl.style.display='none'});
})();
(()=>{
  const DATA_URL='data/national/player_id_unmatched_v1.json';
  let queue=new Map();
  const escKey=(name,birth)=>`${String(name||'').trim()}|${String(birth||'').trim()}`;
  const addBadge=el=>{
    if(!el||el.querySelector('.id-pending-badge'))return;
    const badge=document.createElement('span');
    badge.className='id-pending-badge';
    badge.textContent='ID 대기';
    badge.title='Player ID 연결대기 · 이름과 생년월일이 기존 Player Master에 정확 일치하는 행을 아직 확인하지 못했습니다.';
    el.append(' ',badge);
  };
  function applyHistory(){
    document.querySelectorAll('#eventList tbody tr').forEach(row=>{
      const cells=row.querySelectorAll('td');
      if(cells.length<3)return;
      const nameCell=cells[1],birth=String(cells[2].textContent||'').trim();
      if(nameCell.querySelector('a'))return;
      const name=String(nameCell.childNodes[0]?.textContent||nameCell.textContent||'').trim().replace(/\s+C$/,'');
      if(queue.has(escKey(name,birth)))addBadge(nameCell);
    });
    const coverage=document.getElementById('coverageList');
    if(coverage&&queue.size){
      let row=coverage.querySelector('[data-id-pending-row]');
      if(!row){
        row=document.createElement('div');
        row.className='coverage-row';
        row.dataset.idPendingRow='true';
        coverage.appendChild(row);
      }
      row.innerHTML=`<span>Player ID 연결대기</span><b data-status="research_queue">${queue.size}명</b>`;
    }
  }
  function applyCohort(){
    document.querySelectorAll('#cohortGrid .cohort-card:not(.header)').forEach(card=>{
      const nameEl=card.querySelector('.player-name');
      if(!nameEl||nameEl.querySelector('a'))return;
      const name=String(nameEl.childNodes[0]?.textContent||nameEl.textContent||'').trim();
      const meta=String(card.querySelector('.player-meta')?.textContent||'');
      const birth=meta.match(/\d{4}-\d{2}-\d{2}/)?.[0]||'';
      if(queue.has(escKey(name,birth)))addBadge(nameEl);
    });
    const summary=document.getElementById('cohortSummary');
    const year=Number(document.getElementById('birthYearFilter')?.value||0);
    if(summary&&year){
      const pending=[...queue.values()].filter(x=>Number(String(x.birth_date||'').slice(0,4))===year).length;
      summary.textContent=summary.textContent.replace(/ · ID 연결대기 \d+명$/,'')+(pending?` · ID 연결대기 ${pending}명`:'');
    }
  }
  const apply=()=>{applyHistory();applyCohort();};
  fetch(DATA_URL,{cache:'no-store'})
    .then(r=>r.ok?r.json():{queue:[]})
    .then(data=>{
      queue=new Map((data.queue||[]).map(x=>[escKey(x.name_ko,x.birth_date),x]));
      apply();
      const observer=new MutationObserver(apply);
      observer.observe(document.body,{childList:true,subtree:true});
    })
    .catch(err=>console.warn('Player ID pending queue skipped',err));
})();

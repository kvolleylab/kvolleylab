(()=>{
  const params=new URLSearchParams(location.search);
  const division=params.get('division');
  const sections=[...document.querySelectorAll('[data-division-section]')];
  const title=document.getElementById('dcPageTitle');
  const desc=document.getElementById('dcPageDescription');
  const names={pro:'프로',university:'대학',school:'중·고'};

  if(names[division]){
    sections.forEach(section=>section.hidden=section.dataset.divisionSection!==division);
    title.textContent=`2026 국내 ${names[division]} 배구대회`;
    desc.textContent=division==='school'?'2026년 국내 중·고 배구대회 일정과 부문별 입상팀을 한눈에 확인합니다.':division==='university'?'2026년 국내 대학배구 대회 일정과 결과를 관리합니다.':'2026년 국내 프로 컵대회와 별도 프로대회를 관리합니다.';
    document.title=`2026 국내 ${names[division]} 배구대회 | K-Volley Lab`;
  }

  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const teamAliases={'울산스포츠과하고':'울산스포츠과학고','순천팦마중':'순천팔마중','인하부고':'인하사대부고','인하부중':'인하사대부중','찬안고':'천안고'};
  const team=n=>teamAliases[n]||n;
  const teamId=name=>{let hash=2166136261;for(const ch of String(name||'')){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619)}return`school-${(hash>>>0).toString(36)}`};
  const teamLink=name=>{const clean=team(name);return`<a class="dc-team-link" href="team-detail.html?id=${encodeURIComponent(teamId(clean))}&name=${encodeURIComponent(clean)}&level=school">${esc(clean)}</a>`};
  const divisionOrder=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
  const divisionRank=name=>{const normalized=String(name||'').replace(/\s+/g,'');const index=divisionOrder.findIndex(item=>item.replace(/\s+/g,'')===normalized);return index<0?99:index};
  const unpack=(data,row)=>{
    if(!Array.isArray(row))return {...row,team_a:team(row.team_a),team_b:team(row.team_b)};
    const [date,venueIndex,court_order,divisionIndex,stageIndex,team_a,team_b,set_score,sets]=row;
    return{date,venue:data.venues[venueIndex],court_order,division:data.divisions[divisionIndex],stage:data.stages[stageIndex],team_a:team(team_a),team_b:team(team_b),set_score,sets};
  };
  const winner=m=>{const [a,b]=String(m.set_score||'0-0').split('-').map(Number);return a>b?m.team_a:m.team_b};
  const loser=m=>winner(m)===m.team_a?m.team_b:m.team_a;

  function podiums(data){
    const matches=data.matches.map(row=>unpack(data,row));
    return data.divisions.map(division=>{
      const rows=matches.filter(m=>m.division===division);
      const finals=rows.filter(m=>m.stage==='결승').sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const final=finals.at(-1);
      if(!final)return{division,pending:true};
      const semis=rows.filter(m=>m.stage==='준결승'&&String(m.date)<=String(final.date));
      const thirdPlace=rows.filter(m=>/3.?4위|3위/.test(m.stage||'')).sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1);
      const thirds=thirdPlace?[winner(thirdPlace)]:[...new Set(semis.map(loser).filter(Boolean))];
      return{division,champion:winner(final),runnerUp:loser(final),thirds};
    }).sort((a,b)=>divisionRank(a.division)-divisionRank(b.division)||String(a.division).localeCompare(String(b.division),'ko'));
  }

  function renderRanking(box,data){
    const items=podiums(data);
    const complete=items.filter(x=>!x.pending);
    if(!complete.length){box.classList.add('is-pending');box.innerHTML='<strong>대회 입상팀</strong><p>결승 결과 확인 중</p>';return}
    box.innerHTML=`<strong>대회 입상팀</strong><div class="dc-ranking-list">${complete.map(item=>`<section><h4>${esc(item.division)}</h4><p><span>🥇</span>${teamLink(item.champion)}</p><p><span>🥈</span>${teamLink(item.runnerUp)}</p><p><span>🥉</span><span class="dc-third-links">${item.thirds.length?item.thirds.map(teamLink).join('<i>·</i>'):'확인 중'}</span></p></section>`).join('')}</div><button class="dc-ranking-toggle" type="button" aria-expanded="false">전체 입상팀 펼치기</button>`;
    const list=box.querySelector('.dc-ranking-list');
    const button=box.querySelector('.dc-ranking-toggle');
    button.onclick=()=>{const open=box.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'입상팀 접기':'전체 입상팀 펼치기';list.scrollTop=0};
  }

  document.querySelectorAll('[data-ranking-source]').forEach(card=>{
    const id=card.dataset.rankingSource;
    const box=card.querySelector('.dc-ranking');
    fetch(`data/domestic/${encodeURIComponent(id)}.json?v=20260725-3`,{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error('ranking');return r.json()})
      .then(data=>renderRanking(box,data))
      .catch(()=>{box.classList.add('is-pending');box.innerHTML='<strong>대회 입상팀</strong><p>순위 데이터를 불러오지 못했습니다.</p>'});
  });
})();
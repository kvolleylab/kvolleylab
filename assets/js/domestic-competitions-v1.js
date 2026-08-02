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
    desc.textContent=division==='school'?'2026년 국내 중·고 배구대회의 진행 상태, 일정, 경기결과와 입상팀을 한눈에 확인합니다.':division==='university'?'2026년 국내 대학배구 대회 일정과 결과를 관리합니다.':'2026년 국내 프로 컵대회와 별도 프로대회를 관리합니다.';
    document.title=`2026 국내 ${names[division]} 배구대회 | K-Volley Lab`;
  }

  const connectDashboard=(source,href,label)=>{const link=document.querySelector(`[data-ranking-source="${source}"] .dc-card-info`);if(!link)return;link.href=href;link.setAttribute('aria-label',`${label} 대회 대시보드 보기`);const text=link.querySelector('.dc-card-link');if(text)text.textContent='대회 대시보드 보기 →'};
  connectDashboard('middle-high-first-2026','school-competition-samcheok-2026.html?view=overview&layout=20260802-4','한국중고배구 1차 연맹전 삼척대회');
  connectDashboard('middle-high-second-2026','school-competition-iksan-2026.html?view=overview&layout=20260802-4','한국중고배구 2차 연맹전 익산보석배대회');
  connectDashboard('presidents-cup-middle-high-2026','school-competition-presidents-2026.html?view=overview&layout=20260802-4','제59회 대통령배 전국중고배구대회');

  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const teamAliases={'울산스포츠과하고':'울산스포츠과학고','순천팦마중':'순천팔마중','인하부고':'인하사대부고','인하부중':'인하사대부중','찬안고':'천안고','경북사대부설고':'경북사대부고','인하사대부속중':'인하사대부중'};
  const team=n=>teamAliases[n]||n;
  const teamId=name=>{let hash=2166136261;for(const ch of String(name||'')){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619)}return`school-${(hash>>>0).toString(36)}`};
  const teamLink=name=>{const clean=team(name);return`<a class="dc-team-link" href="team-detail.html?id=${encodeURIComponent(teamId(clean))}&name=${encodeURIComponent(clean)}&level=school">${esc(clean)}</a>`};
  const divisionOrder=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
  const divisionRank=name=>{const normalized=String(name||'').replace(/\s+/g,'');const index=divisionOrder.findIndex(item=>item.replace(/\s+/g,'')===normalized);return index<0?99:index};
  const unpack=(data,row)=>{if(!Array.isArray(row))return {...row,team_a:team(row.team_a),team_b:team(row.team_b)};const[date,venueIndex,court_order,divisionIndex,stageIndex,team_a,team_b,set_score,sets]=row;return{date,venue:data.venues[venueIndex],court_order:Number(court_order)||0,division:data.divisions[divisionIndex],stage:data.stages[stageIndex],team_a:team(team_a),team_b:team(team_b),set_score,sets}};
  const score=m=>String(m?.set_score||'').match(/^(\d+)-(\d+)$/)?.slice(1).map(Number)||[];
  const winner=m=>{const[a,b]=score(m);return Number.isFinite(a)&&Number.isFinite(b)?(a>b?m.team_a:m.team_b):''};
  const loser=m=>{const win=winner(m);return win?(win===m.team_a?m.team_b:m.team_a):''};
  const normalizedStage=stage=>String(stage||'').replace(/\s+/g,'').replace(/전$/,'');
  const isFinal=stage=>normalizedStage(stage)==='결승';
  const isSemifinal=stage=>['준결승','4강'].includes(normalizedStage(stage));
  const chronological=(a,b)=>String(a.date).localeCompare(String(b.date))||a.court_order-b.court_order;

  function resolveKnockout(rows){
    const valid=rows.filter(m=>winner(m)).sort(chronological);
    let final=valid.filter(m=>isFinal(m.stage)).at(-1);
    if(!final)final=valid.at(-1);
    if(!final)return{};
    let semis=valid.filter(m=>isSemifinal(m.stage)&&chronological(m,final)<0).slice(-2);
    if(semis.length<2){
      const priorDates=[...new Set(valid.filter(m=>String(m.date)<String(final.date)).map(m=>m.date))].sort();
      const semifinalDate=priorDates.at(-1);
      if(semifinalDate)semis=valid.filter(m=>m.date===semifinalDate).slice(-2);
    }
    return{final,semis};
  }

  function podiums(data){
    const matches=data.matches.map(row=>unpack(data,row));
    return data.divisions.map(division=>{
      const rows=matches.filter(m=>m.division===division);
      const{final,semis=[]}=resolveKnockout(rows);
      if(!final)return{division,pending:true};
      const thirdPlace=rows.filter(m=>/3.?4위|3위/.test(String(m.stage||''))).sort(chronological).at(-1);
      const thirds=thirdPlace?[winner(thirdPlace)]:[...new Set(semis.map(loser).filter(Boolean))];
      return{division,champion:winner(final),runnerUp:loser(final),thirds,thirdsPending:!thirdPlace&&thirds.length<2};
    }).sort((a,b)=>divisionRank(a.division)-divisionRank(b.division)||String(a.division).localeCompare(String(b.division),'ko'));
  }

  function renderRanking(box,data){
    const complete=podiums(data).filter(x=>!x.pending);
    if(!complete.length){box.classList.add('is-pending');box.innerHTML='<strong>대회 입상팀</strong><p>결승 결과 확인 중</p>';return}
    box.classList.remove('is-pending');
    box.innerHTML=`<strong>대회 입상팀</strong><div class="dc-ranking-list">${complete.map(item=>`<section><h4>${esc(item.division)}</h4><p><span>🥇</span>${teamLink(item.champion)}</p><p><span>🥈</span>${teamLink(item.runnerUp)}</p><p><span>🥉</span><span class="dc-third-links">${item.thirds.length?item.thirds.map(teamLink).join('<i>·</i>'):'확인 중'}${item.thirdsPending?'<em> · 확인 중</em>':''}</span></p></section>`).join('')}</div><button class="dc-ranking-toggle" type="button" aria-expanded="false">전체 입상팀 펼치기</button>`;
    const list=box.querySelector('.dc-ranking-list'),button=box.querySelector('.dc-ranking-toggle');
    button.onclick=()=>{const open=box.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'입상팀 접기':'전체 입상팀 펼치기';list.scrollTop=0};
  }

  const schoolSection=document.getElementById('school');
  const schoolGrid=schoolSection?.querySelector('.dc-school-grid');
  const schoolCards=[...(schoolGrid?.querySelectorAll('.dc-school-card')||[])];
  const dateInfo=[
    ['spring-middle-high-2026','2026-03-12','2026-03-19'],
    ['middle-high-first-2026','2026-04-06','2026-04-13'],
    ['middle-high-second-2026','2026-06-07','2026-06-14'],
    ['presidents-cup-middle-high-2026','2026-07-06','2026-07-13']
  ];
  dateInfo.forEach(([source,start,end])=>{const card=schoolGrid?.querySelector(`[data-ranking-source="${source}"]`);if(card){card.dataset.start=start;card.dataset.end=end}});
  if(schoolCards[4]){schoolCards[4].dataset.start='2026-07-31';schoolCards[4].dataset.end='2026-08-06'}
  if(schoolCards[5]){schoolCards[5].dataset.start='2026-08-28';schoolCards[5].dataset.end='2026-09-03'}

  const today=new Date();today.setHours(0,0,0,0);
  const stateOf=card=>{const start=new Date(`${card.dataset.start}T00:00:00`),end=new Date(`${card.dataset.end}T23:59:59`);return today<start?'upcoming':today>end?'ended':'live'};
  const stateLabel={all:'전체',live:'진행 중',upcoming:'예정',ended:'종료'};
  schoolCards.forEach(card=>{const state=stateOf(card);card.dataset.state=state;card.classList.add(`is-${state}`);const badge=card.querySelector('.dc-badge');if(badge)badge.insertAdjacentHTML('afterend',`<span class="dc-state-badge dc-state-${state}">${stateLabel[state]}</span>`)});
  schoolCards.sort((a,b)=>{const order={live:0,upcoming:1,ended:2};const sa=stateOf(a),sb=stateOf(b);if(order[sa]!==order[sb])return order[sa]-order[sb];return sa==='ended'?String(b.dataset.end).localeCompare(String(a.dataset.end)):String(a.dataset.start).localeCompare(String(b.dataset.start))}).forEach(card=>schoolGrid?.appendChild(card));

  if(schoolSection&&schoolGrid){
    const counts={all:schoolCards.length,live:0,upcoming:0,ended:0};schoolCards.forEach(card=>counts[stateOf(card)]++);
    const totalGames=114+85+102+89;
    const tools=document.createElement('div');tools.className='dc-overview-tools';
    tools.innerHTML=`<div class="dc-summary-cards"><article><span>등록 대회</span><strong>${counts.all}</strong><small>개</small></article><article><span>진행 중</span><strong>${counts.live}</strong><small>개</small></article><article><span>예정</span><strong>${counts.upcoming}</strong><small>개</small></article><article><span>결과 반영</span><strong>${totalGames}</strong><small>경기</small></article></div><div class="dc-filter-row" role="group" aria-label="대회 상태 필터">${Object.entries(stateLabel).map(([key,label])=>`<button type="button" data-filter="${key}" class="${key==='all'?'active':''}">${label}<span>${counts[key]}</span></button>`).join('')}</div>`;
    schoolGrid.before(tools);
    tools.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;tools.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));schoolCards.forEach(card=>card.hidden=filter!=='all'&&card.dataset.state!==filter)}));
  }

  document.querySelectorAll('[data-ranking-source]').forEach(card=>{const id=card.dataset.rankingSource,box=card.querySelector('.dc-ranking');fetch(`data/domestic/${encodeURIComponent(id)}.json?v=20260802-4`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('ranking');return r.json()}).then(data=>renderRanking(box,data)).catch(()=>{box.classList.add('is-pending');box.innerHTML='<strong>대회 입상팀</strong><p>순위 데이터를 불러오지 못했습니다.</p>'})});
})();
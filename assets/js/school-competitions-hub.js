(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('division')!=='school')return;

  const main=document.querySelector('main.dc-main');
  if(!main)return;
  document.body.classList.add('school-competitions-hub-page');
  document.title='중·고 배구대회 | K-Volley Lab';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const days=['일','월','화','수','목','금','토'];
  const parseDate=value=>{const [y,m,d]=String(value||'').split('-').map(Number);return new Date(y,m-1,d)};
  const dateLabel=value=>{if(!value)return '일정 미정';const date=parseDate(value);return `${value.replaceAll('-','.') }(${days[date.getDay()]})`};
  const rangeLabel=item=>`${dateLabel(item.startDate)} ~ ${dateLabel(item.endDate)}`;
  const resultHref=item=>`${item.pagePath}${item.pagePath.includes('?')?'&':'?'}view=results`;
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
  const statusOf=item=>{const now=today(),start=parseDate(item.startDate),end=parseDate(item.endDate);end.setHours(23,59,59,999);return now<start?'upcoming':now>end?'completed':'live'};
  const statusLabel={live:'진행 중',upcoming:'예정',completed:'종료'};
  const divisionKeys=[['18세이하 남자부','18U 남'],['18세이하 여자부','18U 여'],['15세이하 남자부','15U 남'],['15세이하 여자부','15U 여']];
  const rankingCache=new Map();

  main.className='sh-main';
  main.innerHTML=`
    <section class="sh-hero">
      <div class="sh-hero-copy"><p class="sh-eyebrow">SCHOOL COMPETITIONS</p><h1>중·고 배구대회</h1><p>현재 진행 대회부터 연도별 결과와 우승 기록까지 한 흐름으로 확인합니다.</p></div>
      <div class="sh-summary"><span id="shYearCount">연도 -개</span><span id="shCompetitionCount">대회 -개</span><span id="shResultCount">결과 -경기</span></div>
    </section>

    <section class="sh-section" aria-labelledby="shFocusTitle">
      <div class="sh-section-head"><div><span class="sh-kicker">NOW / NEXT</span><h2 id="shFocusTitle">지금 확인할 대회</h2><p>진행 중인 대회와 가장 가까운 다음 일정을 먼저 보여줍니다.</p></div><span class="sh-section-meta" id="shToday"></span></div>
      <div id="shFocus" class="sh-focus-grid"><div class="sh-loading">현재 대회를 확인하는 중…</div></div>
    </section>

    <section class="sh-section" aria-labelledby="shSeasonTitle">
      <div class="sh-section-head"><div><span class="sh-kicker">SEASON ARCHIVE</span><h2 id="shSeasonTitle">연도별 대회</h2><p>최신 시즌을 먼저 표시하고, 과거 시즌은 아래로 이어집니다.</p></div><span class="sh-section-meta">최근 대회 우선</span></div>
      <div class="sh-tools"><div class="sh-filters" id="shFilters" role="group" aria-label="대회 상태 필터"></div><div class="sh-order-note">진행 중 → 예정 → 최근 종료 순</div></div>
      <div id="shYears"><div class="sh-loading">시즌 데이터를 불러오는 중…</div></div>
    </section>

    <section class="sh-section" aria-labelledby="shChampionTitle">
      <div class="sh-section-head"><div><span class="sh-kicker">CHAMPIONS HISTORY</span><h2 id="shChampionTitle">역대 우승팀</h2><p>공식 결과가 확인된 시즌부터 대회별 우승 기록을 누적합니다.</p></div><span class="sh-section-meta" id="shChampionSeason">2026 SEASON</span></div>
      <div id="shChampions"><div class="sh-loading">우승 기록을 정리하는 중…</div></div>
      <div class="sh-history-note"><div><strong>이 기록은 앞으로 더 강해집니다.</strong><p>과거 시즌 공식자료가 들어오면 같은 표 아래에 연도가 쌓이고, 이후 학교별 우승 횟수와 대회별 역대 챔피언까지 연결할 수 있습니다.</p></div><div class="sh-history-tags"><span>대회별 기록</span><span>학교별 우승 횟수</span><span>부문별 챔피언</span></div></div>
    </section>

    <div class="sh-archive-note">현재는 검수가 끝난 2026 시즌부터 적용합니다. 2025년 이전 자료는 공식 팸플릿·결과표 확인이 끝나는 순서대로 같은 구조에 추가합니다.</div>`;

  document.getElementById('shToday').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric'}).format(new Date());

  const normalizedStage=stage=>String(stage||'').replace(/\s+/g,'').replace(/전$/,'');
  const isFinal=stage=>normalizedStage(stage)==='결승';
  const teamAliases={'울산스포츠과하고':'울산스포츠과학고','순천팦마중':'순천팔마중','인하부고':'인하사대부고','인하부중':'인하사대부중','찬안고':'천안고','경북사대부설고':'경북사대부고','인하사대부속중':'인하사대부중'};
  const team=name=>teamAliases[name]||name;
  const unpack=(data,row)=>{if(!Array.isArray(row))return {...row,team_a:team(row.team_a),team_b:team(row.team_b)};const[date,venueIndex,court_order,divisionIndex,stageIndex,team_a,team_b,set_score,sets]=row;return{date,venue:data.venues?.[venueIndex],court_order:Number(court_order)||0,division:data.divisions?.[divisionIndex],stage:data.stages?.[stageIndex],team_a:team(team_a),team_b:team(team_b),set_score,sets}};
  const score=m=>String(m?.set_score||'').match(/^(\d+)-(\d+)$/)?.slice(1).map(Number)||[];
  const winner=m=>{const[a,b]=score(m);return Number.isFinite(a)&&Number.isFinite(b)?(a>b?m.team_a:m.team_b):''};
  const chronological=(a,b)=>String(a.date).localeCompare(String(b.date))||a.court_order-b.court_order;
  const resolveFinal=rows=>{const valid=rows.filter(m=>winner(m)).sort(chronological);let final=valid.filter(m=>isFinal(m.stage)).at(-1);if(!final)final=valid.at(-1);return final};

  async function championsFor(item){
    if(!item.rankingSource)return null;
    if(rankingCache.has(item.rankingSource))return rankingCache.get(item.rankingSource);
    const promise=fetch(`data/domestic/${encodeURIComponent(item.rankingSource)}.json?v=20260831-1`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(data=>{const matches=(data.matches||[]).map(row=>unpack(data,row));const result={};(data.divisions||[]).forEach(division=>{const final=resolveFinal(matches.filter(m=>m.division===division));result[division]=final?winner(final):''});return result}).catch(()=>null);
    rankingCache.set(item.rankingSource,promise);return promise;
  }

  const focusCard=(item,type)=>{
    if(!item)return '';
    const live=type==='live';
    const dday=!live?Math.ceil((parseDate(item.startDate)-today())/86400000):null;
    return `<article class="sh-focus-card ${live?'is-live':'is-next'}"><span class="sh-focus-label">${live?'<span class="sh-live-dot"></span>NOW · 진행 중':`NEXT · 다음 대회${Number.isFinite(dday)&&dday>=0?` · D-${dday}`:''}`}</span><h3>${esc(item.shortName||item.name)}</h3><p>${esc(rangeLabel(item))} · ${esc(item.location||'장소 미정')}</p><p class="sh-focus-note">${live?'대회가 진행 중입니다. 최신 일정과 결과를 대회 페이지에서 확인하세요.':'등록된 다음 대회 일정입니다.'}</p><div class="sh-focus-actions"><a class="sh-btn primary" href="${esc(item.pagePath)}">대회 바로가기</a>${live?`<a class="sh-btn" href="${esc(resultHref(item))}">경기결과 보기</a>`:''}</div></article>`;
  };

  const renderFocus=items=>{
    const sorted=[...items].sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
    const live=sorted.filter(i=>statusOf(i)==='live')[0]||null;
    const next=sorted.filter(i=>statusOf(i)==='upcoming')[0]||null;
    const recent=[...items].filter(i=>statusOf(i)==='completed').sort((a,b)=>String(b.endDate).localeCompare(String(a.endDate)))[0]||null;
    const left=live?focusCard(live,'live'):(recent?`<article class="sh-focus-card is-next"><span class="sh-focus-label">RECENT · 최근 종료</span><h3>${esc(recent.shortName||recent.name)}</h3><p>${esc(rangeLabel(recent))} · ${esc(recent.location||'')}</p><p class="sh-focus-note">현재 진행 중인 대회가 없어 가장 최근 종료 대회를 표시합니다.</p><div class="sh-focus-actions"><a class="sh-btn primary" href="${esc(recent.pagePath)}">대회 결과 보기</a></div></article>`:'');
    const right=next?focusCard(next,'next'):`<article class="sh-focus-empty"><strong>NEXT · 다음 대회</strong><p>등록된 다음 대회 일정이 없습니다.<br>공식 일정이 확인되면 이 자리에 자동으로 표시됩니다.</p></article>`;
    document.getElementById('shFocus').innerHTML=left+right;
  };

  const cardHtml=item=>{
    const state=statusOf(item);
    const game=item.gameCount?`<span>결과 ${item.gameCount}경기</span>`:'';
    const side=state==='completed'?`<div class="sh-card-side" data-champions="${esc(item.competitionId)}"><strong>최종 우승팀</strong><div class="sh-side-message"><b>우승 기록 불러오는 중</b>공식 결승 결과를 확인하고 있습니다.</div></div>`:`<div class="sh-card-side"><strong>${state==='live'?'대회 현황':'대회 예정'}</strong><div class="sh-side-message"><b>${state==='live'?'현재 대회 진행 중':'시작 전'}</b>${state==='live'?'최종 우승팀은 대회 종료 후 이 영역에 자동 반영됩니다.':'공식 일정과 참가 정보는 대회 페이지에서 확인하세요.'}</div></div>`;
    return `<article class="sh-card" data-state="${state}" data-competition="${esc(item.competitionId)}"><a class="sh-card-main" href="${esc(item.pagePath)}"><div class="sh-card-top"><span class="sh-series">${esc(item.series||'중·고 대회')}</span><span class="sh-status ${state}">${statusLabel[state]}</span></div><h4>${esc(item.shortName||item.name)}</h4><p class="sh-card-meta">${esc(rangeLabel(item))}<br>${esc(item.location||'장소 미정')}</p><div class="sh-card-stats"><span>4개 부문</span>${game}</div><span class="sh-card-link">대회 보기 →</span></a>${side}</article>`;
  };

  const seasonSort=(a,b)=>{const order={live:0,upcoming:1,completed:2};const sa=statusOf(a),sb=statusOf(b);if(order[sa]!==order[sb])return order[sa]-order[sb];return sa==='completed'?String(b.endDate).localeCompare(String(a.endDate)):String(a.startDate).localeCompare(String(b.startDate))};
  const champGrid=champions=>divisionKeys.map(([key,label])=>`<div class="sh-champ"><span>${label}</span><b>${esc(champions?.[key]||'확인 중')}</b></div>`).join('');

  async function hydrateCardChampions(items){
    await Promise.all(items.map(async item=>{if(statusOf(item)!=='completed')return;const box=document.querySelector(`[data-champions="${CSS.escape(item.competitionId)}"]`);if(!box)return;const champions=await championsFor(item);box.innerHTML=`<strong>최종 우승팀</strong><div class="sh-champs">${champGrid(champions)}</div>`}));
  }

  const renderFilters=items=>{
    const counts={all:items.length,live:0,upcoming:0,completed:0};items.forEach(i=>counts[statusOf(i)]++);
    const labels={all:'전체',live:'진행 중',upcoming:'예정',completed:'종료'};
    const root=document.getElementById('shFilters');
    root.innerHTML=Object.entries(labels).map(([key,label])=>`<button class="sh-filter ${key==='all'?'active':''}" type="button" data-filter="${key}">${label}<span>${counts[key]}</span></button>`).join('');
    root.addEventListener('click',event=>{const button=event.target.closest('button[data-filter]');if(!button)return;root.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));const filter=button.dataset.filter;document.querySelectorAll('.sh-card').forEach(card=>card.hidden=filter!=='all'&&card.dataset.state!==filter)});
  };

  const renderChampionTable=async items=>{
    const rows=await Promise.all(items.map(async item=>({item,champions:statusOf(item)==='completed'?await championsFor(item):null,state:statusOf(item)})));
    const tableRows=rows.map(({item,champions,state})=>`<tr><td>${esc(item.series||item.shortName)}</td>${divisionKeys.map(([key])=>`<td>${state==='completed'?esc(champions?.[key]||'확인 중'):`<span class="pending">${state==='live'?'진행 중':'예정'}</span>`}</td>`).join('')}</tr>`).join('');
    document.getElementById('shChampions').innerHTML=`<div class="sh-champion-wrap"><table class="sh-champion-table"><thead><tr><th>대회</th>${divisionKeys.map(([,label])=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div>`;
  };

  async function load(){
    try{
      const manifest=await fetch('data/competitions/school-years.json?v=20260831-1',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
      const years=[...(manifest.years||[])].sort((a,b)=>b.year-a.year);
      document.getElementById('shYearCount').textContent=`연도 ${years.length}개`;
      const datasets=await Promise.all(years.map(async meta=>{const data=await fetch(`${meta.dataPath}?v=20260831-1`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});return{meta,data}}));
      const allItems=datasets.flatMap(x=>x.data.competitions||[]);
      const gameCount=allItems.reduce((sum,item)=>sum+(Number(item.gameCount)||0),0);
      document.getElementById('shCompetitionCount').textContent=`대회 ${allItems.length}개`;
      document.getElementById('shResultCount').textContent=`결과 ${gameCount}경기`;
      renderFocus(allItems);
      const root=document.getElementById('shYears');root.innerHTML='';
      datasets.forEach(({meta,data})=>{const items=[...(data.competitions||[])].sort(seasonSort);const section=document.createElement('section');section.className='sh-season';section.dataset.year=meta.year;section.innerHTML=`<div class="sh-season-head"><div class="sh-season-title"><h3>${esc(meta.label||`${meta.year} 중·고 배구대회`)}</h3><span>${items.length}개 대회</span></div><p>최신 대회부터 확인합니다.</p></div><div class="sh-grid">${items.map(cardHtml).join('')||'<div class="sh-empty">등록된 대회가 없습니다.</div>'}</div>`;root.appendChild(section);hydrateCardChampions(items)});
      renderFilters(allItems);
      const latest=datasets[0]?.data?.competitions||[];
      document.getElementById('shChampionSeason').textContent=`${datasets[0]?.meta?.year||manifest.latestYear||''} SEASON`;
      await renderChampionTable([...latest].sort(seasonSort));
    }catch(error){document.getElementById('shFocus').innerHTML='<div class="sh-empty">현재 대회 정보를 불러오지 못했습니다.</div>';document.getElementById('shYears').innerHTML='<div class="sh-empty">시즌 대회 데이터를 불러오지 못했습니다.</div>';document.getElementById('shChampions').innerHTML='<div class="sh-empty">우승 기록을 불러오지 못했습니다.</div>';console.error('[KVL school hub]',error)}
  }
  load();
})();

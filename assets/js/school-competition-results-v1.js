(()=>{
  const app=document.getElementById('scrApp');
  if(!app)return;
  const params=new URLSearchParams(location.search);
  const id=params.get('competition')||'spring-middle-high-2026';
  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const fmtDate=s=>{const d=new Date(`${s}T00:00:00`);return `${d.getMonth()+1}월 ${d.getDate()}일`};
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const teamAliases={'울산스포츠과하고':'울산스포츠과학고','순천팦마중':'순천팔마중','인하부고':'인하사대부고','인하부중':'인하사대부중','찬안고':'천안고'};
  const normalizeTeam=name=>teamAliases[name]||name;
  const normalizeMatch=m=>{m.team_a=normalizeTeam(m.team_a);m.team_b=normalizeTeam(m.team_b);if(id==='middle-high-second-2026'&&m.team_a==='현일중'&&m.team_b==='인창중')m.sets=m.sets.map(s=>s==='29-32'?'29-31':s);return m};
  let data=null,activeDate='all',activeDivision='all',activeStage='all',view='calendar';
  const uniq=arr=>[...new Set(arr.filter(Boolean))];
  const filtered=()=>data.matches.filter(m=>(activeDate==='all'||m.date===activeDate)&&(activeDivision==='all'||m.division===activeDivision)&&(activeStage==='all'||m.stage===activeStage));
  const buttons=(items,active,key,labelAll)=>`<div class="scr-filter-row"><button class="scr-filter ${active==='all'?'active':''}" data-${key}="all">${labelAll}</button>${items.map(v=>`<button class="scr-filter ${active===v?'active':''}" data-${key}="${esc(v)}">${key==='date'?fmtDate(v):esc(v)}</button>`).join('')}</div>`;
  const matchCard=m=>`<article class="scr-card"><div class="scr-card-top"><span>${esc(m.venue)} · ${m.court_order}경기</span><span class="scr-stage">${esc(m.stage)}</span></div><div class="scr-match"><strong class="scr-team ${m.winner===m.team_a?'winner':''}">${esc(m.team_a)}</strong><b class="scr-score">${esc(m.set_score)}</b><strong class="scr-team away ${m.winner===m.team_b?'winner':''}">${esc(m.team_b)}</strong></div><div class="scr-sets">${m.sets.map((s,i)=>`<span>${i+1}세트 ${esc(s)}</span>`).join('')}</div><div class="scr-source">${esc(m.division)}</div></article>`;
  function calendar(){
    const start=new Date(`${data.start}T00:00:00`),end=new Date(`${data.end}T00:00:00`);
    const monthStart=new Date(start.getFullYear(),start.getMonth(),1),monthEnd=new Date(end.getFullYear(),end.getMonth()+1,0);
    const gridStart=new Date(monthStart);gridStart.setDate(gridStart.getDate()-gridStart.getDay());
    const gridEnd=new Date(monthEnd);gridEnd.setDate(gridEnd.getDate()+(6-gridEnd.getDay()));
    const cells=[];
    for(let d=new Date(gridStart);d<=gridEnd;d.setDate(d.getDate()+1)){
      const key=iso(d),matches=data.matches.filter(m=>m.date===key),outside=d.getMonth()!==monthStart.getMonth();
      const preview=matches.slice(0,4).map(m=>`<button class="scr-cal-match" data-open-date="${key}"><span>${esc(m.team_a)}</span><b>${esc(m.set_score)}</b><span>${esc(m.team_b)}</span></button>`).join('');
      cells.push(`<div class="scr-cal-day ${outside?'outside':''} ${matches.length?'has-matches':''}"><div class="scr-cal-date"><strong>${d.getDate()}</strong>${matches.length?`<span>${matches.length}경기</span>`:''}</div>${preview}${matches.length>4?`<button class="scr-cal-more" data-open-date="${key}">+${matches.length-4}경기 더보기</button>`:''}</div>`);
    }
    return `<section class="scr-calendar-wrap"><div class="scr-calendar-head"><h2>${start.getFullYear()}년 ${start.getMonth()+1}월</h2><p>날짜 또는 경기를 누르면 상세 결과로 이동합니다.</p></div><div class="scr-weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="scr-calendar">${cells.join('')}</div></section>`;
  }
  function details(rows){const dates=uniq(rows.map(m=>m.date)).sort();return dates.map(date=>{const matches=rows.filter(m=>m.date===date);return `<section class="scr-date-section" id="date-${date}"><div class="scr-date-head"><h2>${fmtDate(date)}</h2><span>${matches.length}경기</span></div><div class="scr-grid">${matches.map(matchCard).join('')}</div></section>`}).join('')}
  function render(){
    const rows=filtered(),divisions=uniq(data.matches.map(m=>m.division)).sort(),stages=uniq(data.matches.map(m=>m.stage)),venues=uniq(data.matches.map(m=>m.venue));
    app.innerHTML=`<div class="scr-view-switch"><button class="${view==='calendar'?'active':''}" data-view="calendar">월간 달력</button><button class="${view==='list'?'active':''}" data-view="list">전체 목록</button></div>${view==='calendar'?calendar():''}<div class="scr-toolbar">${buttons(uniq(data.matches.map(m=>m.date)).sort(),activeDate,'date','전체 날짜')}${buttons(divisions,activeDivision,'division','전체 부문')}${buttons(stages,activeStage,'stage','전체 단계')}</div><div class="scr-summary"><div class="scr-kpi"><span>전체 경기</span><strong>${data.matches.length}</strong></div><div class="scr-kpi"><span>현재 표시</span><strong>${rows.length}</strong></div><div class="scr-kpi"><span>경기장</span><strong>${venues.length}</strong></div><div class="scr-kpi"><span>부문</span><strong>${divisions.length}</strong></div></div><div id="scrDetail">${details(rows)||'<div class="scr-empty">선택한 조건에 해당하는 경기가 없습니다.</div>'}</div><div class="scr-note">${data.notes.map(x=>`• ${esc(x)}`).join('<br>')}</div><a class="scr-back" href="domestic-competitions.html#school">← 국내 중·고 대회 목록</a>`;
    bind();
  }
  function bind(){
    app.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{activeDate=b.dataset.date;render()});
    app.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{activeDivision=b.dataset.division;render()});
    app.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{activeStage=b.dataset.stage;render()});
    app.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
    app.querySelectorAll('[data-open-date]').forEach(b=>b.onclick=()=>{activeDate=b.dataset.openDate;render();requestAnimationFrame(()=>document.getElementById(`date-${activeDate}`)?.scrollIntoView({behavior:'smooth',block:'start'}))});
  }
  fetch(`data/domestic/${encodeURIComponent(id)}.json?v=20260724-3`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('data');return r.json()}).then(d=>{
    if(Array.isArray(d.matches?.[0]))d.matches=d.matches.map(m=>{const [date,venueIndex,court_order,divisionIndex,stageIndex,team_a,team_b,set_score,sets]=m;const [a,b]=set_score.split('-').map(Number);return{date,venue:d.venues[venueIndex],court_order,division:d.divisions[divisionIndex],stage:d.stages[stageIndex],team_a,team_b,set_score,sets,winner:a>b?team_a:team_b}});
    d.matches=d.matches.map(normalizeMatch);d.matches.forEach(m=>{const [a,b]=m.set_score.split('-').map(Number);m.winner=a>b?m.team_a:m.team_b});data=d;
    document.title=`${d.competition} 경기 결과 | K-Volley Lab`;document.getElementById('scrTitle').textContent=d.competition;document.getElementById('scrMeta').textContent=`${d.start} ~ ${d.end} · ${d.location} · 총 ${d.matches.length}경기`;render();
  }).catch(()=>{app.innerHTML='<div class="scr-empty">대회 결과 데이터를 불러오지 못했습니다.</div>'});
})();
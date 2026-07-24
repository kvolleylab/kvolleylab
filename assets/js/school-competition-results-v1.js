(()=>{
  const app=document.getElementById('scrApp');
  if(!app)return;
  const params=new URLSearchParams(location.search);
  const id=params.get('competition')||'spring-middle-high-2026';
  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const fmtDate=s=>{const d=new Date(`${s}T00:00:00`);return `${d.getMonth()+1}월 ${d.getDate()}일`};
  let data=null,activeDate='all',activeDivision='all',activeStage='all';
  const uniq=arr=>[...new Set(arr.filter(Boolean))];
  const filtered=()=>data.matches.filter(m=>(activeDate==='all'||m.date===activeDate)&&(activeDivision==='all'||m.division===activeDivision)&&(activeStage==='all'||m.stage===activeStage));
  const buttons=(items,active,key,labelAll)=>`<div class="scr-filter-row"><button class="scr-filter ${active==='all'?'active':''}" data-${key}="all">${labelAll}</button>${items.map(v=>`<button class="scr-filter ${active===v?'active':''}" data-${key}="${esc(v)}">${key==='date'?fmtDate(v):esc(v)}</button>`).join('')}</div>`;
  function render(){
    const rows=filtered(),dates=uniq(rows.map(m=>m.date)).sort();
    const divisions=uniq(data.matches.map(m=>m.division)).sort();
    const stages=uniq(data.matches.map(m=>m.stage));
    const venues=uniq(data.matches.map(m=>m.venue));
    const groups=dates.map(date=>{
      const matches=rows.filter(m=>m.date===date);
      return `<section class="scr-date-section"><div class="scr-date-head"><h2>${fmtDate(date)}</h2><span>${matches.length}경기</span></div><div class="scr-grid">${matches.map(m=>`<article class="scr-card"><div class="scr-card-top"><span>${esc(m.venue)} · ${m.court_order}경기</span><span class="scr-stage">${esc(m.stage)}</span></div><div class="scr-match"><strong class="scr-team ${m.winner===m.team_a?'winner':''}">${esc(m.team_a)}</strong><b class="scr-score">${esc(m.set_score)}</b><strong class="scr-team away ${m.winner===m.team_b?'winner':''}">${esc(m.team_b)}</strong></div><div class="scr-sets">${m.sets.map((s,i)=>`<span>${i+1}세트 ${esc(s)}</span>`).join('')}</div><div class="scr-source">${esc(m.division)}</div></article>`).join('')}</div></section>`;
    }).join('');
    app.innerHTML=`<div class="scr-toolbar">${buttons(uniq(data.matches.map(m=>m.date)).sort(),activeDate,'date','전체 날짜')}${buttons(divisions,activeDivision,'division','전체 부문')}${buttons(stages,activeStage,'stage','전체 단계')}</div><div class="scr-summary"><div class="scr-kpi"><span>전체 경기</span><strong>${data.matches.length}</strong></div><div class="scr-kpi"><span>현재 표시</span><strong>${rows.length}</strong></div><div class="scr-kpi"><span>경기장</span><strong>${venues.length}</strong></div><div class="scr-kpi"><span>부문</span><strong>${divisions.length}</strong></div></div>${groups||'<div class="scr-empty">선택한 조건에 해당하는 경기가 없습니다.</div>'}<div class="scr-note">${data.notes.map(x=>`• ${esc(x)}`).join('<br>')}</div><a class="scr-back" href="domestic-competitions.html#school">← 국내 중·고 대회 목록</a>`;
    bind();
  }
  function bind(){
    app.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{activeDate=b.dataset.date;render()});
    app.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{activeDivision=b.dataset.division;render()});
    app.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{activeStage=b.dataset.stage;render()});
  }
  fetch(`data/domestic/${encodeURIComponent(id)}.json?v=20260724-2`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('data');return r.json()}).then(d=>{
    if(Array.isArray(d.matches?.[0]))d.matches=d.matches.map(m=>{const [date,venueIndex,court_order,divisionIndex,stageIndex,team_a,team_b,set_score,sets]=m;const [a,b]=set_score.split('-').map(Number);return{date,venue:d.venues[venueIndex],court_order,division:d.divisions[divisionIndex],stage:d.stages[stageIndex],team_a,team_b,set_score,sets,winner:a>b?team_a:team_b}});
    data=d;
    document.title=`${d.competition} 경기 결과 | K-Volley Lab`;
    document.getElementById('scrTitle').textContent=d.competition;
    document.getElementById('scrMeta').textContent=`${d.start} ~ ${d.end} · ${d.location} · 총 ${d.matches.length}경기`;
    render();
  }).catch(()=>{app.innerHTML='<div class="scr-empty">대회 결과 데이터를 불러오지 못했습니다.</div>'});
})();
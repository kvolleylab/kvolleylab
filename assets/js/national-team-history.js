(() => {
  const DATA_URL = 'data/national/national_team_history_v1.json';
  const CONTEXT_URL = 'data/national/national_team_context_v1.json';
  const LINK_URL = 'data/national/player_id_links_v1.json';
  const yearFilter = document.getElementById('yearFilter');
  const levelFilter = document.getElementById('levelFilter');
  const eventList = document.getElementById('eventList');
  const summaryGrid = document.getElementById('summaryGrid');
  const coverageList = document.getElementById('coverageList');
  let db;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const yearOf = date => String(date || '').slice(0, 4);
  const identityKey = r => `${r.name_ko}|${r.birth_date}`;

  function setupFilters() {
    [...new Set(db.events.map(e => e.year))].sort((a,b)=>b-a).forEach(year => yearFilter.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`));
    [...new Set(db.events.map(e => e.level))].sort().forEach(level => levelFilter.insertAdjacentHTML('beforeend', `<option value="${esc(level)}">${esc(level)}</option>`));
  }
  function renderSummary(events) {
    const rosterCount = events.reduce((sum, event) => sum + db.rosters.filter(r => r.event_id === event.event_id).length, 0);
    const birthYears = db.rosters.map(r => yearOf(r.birth_date)).filter(Boolean);
    summaryGrid.innerHTML = [[events.length,'등록 대회'],[rosterCount,'대표선수 기록'],[new Set(birthYears).size,'연결 세대'],[db.scope.target_period,'1차 구축 범위']].map(([v,l])=>`<article class="summary-card"><strong>${esc(v)}</strong><span>${l}</span></article>`).join('');
  }
  function playerLink(r) { return r.player_id ? `<a href="player-profile.html?id=${encodeURIComponent(r.player_id)}">${esc(r.name_ko)}</a>` : `<span>${esc(r.name_ko)}</span>`; }
  function rosterBlock(event, roster) {
    if (!roster.length) {
      const statusText = event.participation_status === 'competition_cancelled' ? '대회 자체가 취소되어 대표 명단이 없습니다.' : event.participation_status === 'qualified_then_withdrew' ? '출전권은 확보했지만 대회 전 철회해 최종 출전 명단이 없습니다.' : event.participation_status === 'not_participated' ? '한국이 해당 대회에 참가하지 않았습니다.' : '공식 대회 기록은 확인됐지만 선수 명단은 아직 구축 중입니다.';
      return `<div class="empty">${esc(statusText)}</div>`;
    }
    return `<div class="table-scroll"><table><thead><tr><th>#</th><th>선수</th><th>출생</th><th>포지션</th><th>키</th><th>세대</th></tr></thead><tbody>${roster.map(r=>`<tr><td>${esc(r.shirt_no)}</td><td>${playerLink(r)}${r.captain?' <span class="captain">C</span>':''}</td><td>${esc(r.birth_date||'-')}</td><td>${esc(r.position||'-')}</td><td>${r.height_cm?`${esc(r.height_cm)}cm`:'-'}</td><td>${yearOf(r.birth_date)?`<a class="cohort-link" href="player-cohort.html?country=KOR&gender=M&birth_year=${yearOf(r.birth_date)}">${yearOf(r.birth_date)}년생</a>`:'-'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderEvents() {
    const year = yearFilter.value, level = levelFilter.value;
    const events = db.events.filter(e => (year==='all'||String(e.year)===year) && (level==='all'||e.level===level));
    renderSummary(events);
    if (!events.length) { eventList.innerHTML='<div class="empty">조건에 맞는 대표팀 기록이 없습니다.</div>'; return; }
    eventList.innerHTML = events.map(event => {
      const roster = db.rosters.filter(r=>r.event_id===event.event_id).sort((a,b)=>(a.shirt_no??999)-(b.shirt_no??999));
      const sources = (event.source_ids||[]).map(id=>db.sources.find(s=>s.source_id===id)).filter(Boolean);
      const dates = event.start_date ? `${esc(event.start_date)} ~ ${esc(event.end_date||'-')}` : '일정 없음';
      return `<article class="event-card"><div class="event-head"><div><div class="eyebrow">${event.year} · ${esc(event.level)} · ${esc(event.organization)}</div><h2>${esc(event.competition_name_ko)}</h2></div><div class="result-badge">${esc(event.result||'결과 확인 중')}</div></div><div class="event-meta"><span>감독 ${esc(event.head_coach||'-')}</span><span>${dates}</span><span>${roster.length?`명단 ${roster.length}명`:'명단 없음'}</span></div>${rosterBlock(event,roster)}${event.note?`<p class="small">${esc(event.note)}</p>`:''}<div class="source-row">상태: <b>${esc(event.roster_status)}</b>${sources.map(s=>` · <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)} 출처</a>`).join('')}</div></article>`;
    }).join('');
  }
  function renderCoverage(){ coverageList.innerHTML=db.coverage.map(item=>`<div class="coverage-row"><span>${item.from===item.to?item.from:`${item.from}–${item.to}`}</span><b data-status="${esc(item.status)}">${esc(item.status)}</b></div>`).join(''); }
  async function init(){
    try{
      const [dataRes, contextRes, linkRes] = await Promise.all([fetch(DATA_URL), fetch(CONTEXT_URL).catch(()=>null), fetch(LINK_URL).catch(()=>null)]);
      if(!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`); db=await dataRes.json();
      if(contextRes&&contextRes.ok){ const ctx=await contextRes.json(); db.events=[...(ctx.events||[]),...db.events]; db.sources=[...(ctx.sources||[]),...db.sources]; }
      if(linkRes&&linkRes.ok){ const links=await linkRes.json(); const map=new Map((links.links||[]).map(x=>[`${x.name_ko}|${x.birth_date}`,x.player_id])); db.rosters.forEach(r=>{if(!r.player_id&&map.has(identityKey(r)))r.player_id=map.get(identityKey(r));}); }
      setupFilters(); renderCoverage(); renderEvents(); yearFilter.addEventListener('change',renderEvents); levelFilter.addEventListener('change',renderEvents);
    }catch(err){ eventList.innerHTML=`<div class="empty">대표팀 DB를 불러오지 못했습니다. ${esc(err.message)}</div>`; }
  }
  init();
})();

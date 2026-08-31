(() => {
  const DATA_URL = 'data/national/national_team_history_v1.json';
  const yearFilter = document.getElementById('yearFilter');
  const levelFilter = document.getElementById('levelFilter');
  const eventList = document.getElementById('eventList');
  const summaryGrid = document.getElementById('summaryGrid');
  const coverageList = document.getElementById('coverageList');
  let db;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const yearOf = date => String(date || '').slice(0, 4);

  function setupFilters() {
    [...new Set(db.events.map(e => e.year))].sort((a,b)=>b-a).forEach(year => {
      yearFilter.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);
    });
    [...new Set(db.events.map(e => e.level))].sort().forEach(level => {
      levelFilter.insertAdjacentHTML('beforeend', `<option value="${esc(level)}">${esc(level)}</option>`);
    });
  }

  function renderSummary(events) {
    const rosterCount = events.reduce((sum, event) => sum + db.rosters.filter(r => r.event_id === event.event_id).length, 0);
    const birthYears = db.rosters.map(r => yearOf(r.birth_date)).filter(Boolean);
    summaryGrid.innerHTML = [
      [events.length, '등록 대회'],
      [rosterCount, '대표선수 기록'],
      [new Set(birthYears).size, '연결 세대'],
      [db.scope.target_period, '1차 구축 범위']
    ].map(([value,label]) => `<article class="summary-card"><strong>${esc(value)}</strong><span>${label}</span></article>`).join('');
  }

  function playerLink(r) {
    if (r.player_id) return `<a href="player-profile.html?id=${encodeURIComponent(r.player_id)}">${esc(r.name_ko)}</a>`;
    return `<span>${esc(r.name_ko)}</span>`;
  }

  function renderEvents() {
    const year = yearFilter.value;
    const level = levelFilter.value;
    const events = db.events.filter(e => (year === 'all' || String(e.year) === year) && (level === 'all' || e.level === level));
    renderSummary(events);
    if (!events.length) {
      eventList.innerHTML = '<div class="empty">조건에 맞는 대표팀 기록이 없습니다.</div>';
      return;
    }
    eventList.innerHTML = events.map(event => {
      const roster = db.rosters.filter(r => r.event_id === event.event_id).sort((a,b)=>a.shirt_no-b.shirt_no);
      const source = db.sources.find(s => (event.source_ids || []).includes(s.source_id));
      return `<article class="event-card">
        <div class="event-head">
          <div><div class="eyebrow">${event.year} · ${esc(event.level)} · ${esc(event.organization)}</div><h2>${esc(event.competition_name_ko)}</h2></div>
          <div class="result-badge">${esc(event.result || '결과 확인 중')}</div>
        </div>
        <div class="event-meta"><span>감독 ${esc(event.head_coach || '-')}</span><span>${esc(event.start_date)} ~ ${esc(event.end_date)}</span><span>명단 ${roster.length}명</span></div>
        <div class="table-scroll"><table><thead><tr><th>#</th><th>선수</th><th>출생</th><th>포지션</th><th>키</th><th>세대</th></tr></thead><tbody>
          ${roster.map(r => `<tr><td>${r.shirt_no}</td><td>${playerLink(r)}${r.captain ? ' <span class="captain">C</span>' : ''}</td><td>${esc(r.birth_date)}</td><td>${esc(r.position)}</td><td>${esc(r.height_cm)}cm</td><td><a class="cohort-link" href="player-cohort.html?country=KOR&gender=M&birth_year=${yearOf(r.birth_date)}">${yearOf(r.birth_date)}년생</a></td></tr>`).join('')}
        </tbody></table></div>
        <div class="source-row">상태: <b>${esc(event.roster_status)}</b>${source ? ` · <a href="${esc(source.url)}" target="_blank" rel="noopener">공식 출처</a>` : ''}</div>
      </article>`;
    }).join('');
  }

  function renderCoverage() {
    coverageList.innerHTML = db.coverage.map(item => `<div class="coverage-row"><span>${item.from === item.to ? item.from : `${item.from}–${item.to}`}</span><b data-status="${esc(item.status)}">${esc(item.status)}</b></div>`).join('');
  }

  async function init() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      db = await res.json();
      setupFilters();
      renderCoverage();
      renderEvents();
      yearFilter.addEventListener('change', renderEvents);
      levelFilter.addEventListener('change', renderEvents);
    } catch (err) {
      eventList.innerHTML = `<div class="empty">대표팀 DB를 불러오지 못했습니다. ${esc(err.message)}</div>`;
    }
  }
  init();
})();

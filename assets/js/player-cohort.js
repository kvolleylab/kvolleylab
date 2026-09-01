(() => {
  const DATA_URL = 'data/national/national_team_history_v1.json';
  const LINK_URL = 'data/national/player_id_links_v1.json';
  const params = new URLSearchParams(location.search);
  const initialYear = Number(params.get('birth_year')) || 2005;
  const levels = ['U16','U17','U18','U19','U20','U21'];
  const grid = document.getElementById('cohortGrid');
  const title = document.getElementById('cohortTitle');
  const summary = document.getElementById('cohortSummary');
  const filter = document.getElementById('birthYearFilter');
  let db;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const birthYear = r => Number(String(r.birth_date || '').slice(0,4));
  const identityKey = r => `${r.name_ko}|${r.birth_date}`;

  function allYears(){ return [...new Set(db.rosters.map(birthYear).filter(Boolean))].sort((a,b)=>b-a); }
  function playerKey(r){ return identityKey(r); }

  function render(year){
    title.textContent = `${year}년생 세대 보기`;
    document.title = `${year}년생 세대 | K-Volley Lab`;
    const rows = db.rosters.filter(r => birthYear(r) === year);
    const players = new Map();
    rows.forEach(r => {
      const key = playerKey(r);
      if (!players.has(key)) players.set(key, {base:r, player_id:r.player_id || null, levels:new Map()});
      const item = players.get(key);
      if (r.player_id && !item.player_id) item.player_id = r.player_id;
      const event = db.events.find(e => e.event_id === r.event_id);
      if (event) item.levels.set(event.level, event);
    });
    summary.textContent = `대한민국 남자 ${year}년생 · 현재 확인된 대표선수 ${players.size}명 · 공식 명단 기반`;
    const head = `<div class="cohort-card header"><div>선수</div>${levels.map(l=>`<div class="stage-cell">${l}</div>`).join('')}</div>`;
    const body = [...players.values()].sort((a,b)=>a.base.name_ko.localeCompare(b.base.name_ko,'ko')).map(item => {
      const r = item.base;
      const name = item.player_id ? `<a class="cohort-link" href="player-profile.html?id=${encodeURIComponent(item.player_id)}">${esc(r.name_ko)}</a>` : esc(r.name_ko);
      return `<div class="cohort-card"><div><div class="player-name">${name}</div><div class="player-meta">${esc(r.position)} · ${esc(r.height_cm)}cm · ${esc(r.birth_date)}</div></div>${levels.map(level => {
        const event = item.levels.get(level);
        return event ? `<div class="stage-cell" title="${esc(event.competition_name_ko)}"><span class="stage-dot">● ${event.year}</span></div>` : '<div class="stage-cell stage-empty">—</div>';
      }).join('')}</div>`;
    }).join('');
    grid.innerHTML = players.size ? head + body : '<div class="empty">이 출생연도의 대표팀 기록이 아직 없습니다.</div>';
    const url = new URL(location.href); url.searchParams.set('birth_year', year); history.replaceState(null,'',url);
  }

  async function init(){
    try{
      const [dataRes, linkRes] = await Promise.all([fetch(DATA_URL), fetch(LINK_URL).catch(()=>null)]);
      if(!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`);
      db = await dataRes.json();
      if (linkRes && linkRes.ok) {
        const linkDb = await linkRes.json();
        const map = new Map((linkDb.links || []).map(x => [`${x.name_ko}|${x.birth_date}`, x.player_id]));
        db.rosters.forEach(r => { if (!r.player_id && map.has(identityKey(r))) r.player_id = map.get(identityKey(r)); });
      }
      const years = allYears();
      filter.innerHTML = years.map(y=>`<option value="${y}" ${y===initialYear?'selected':''}>${y}</option>`).join('');
      const start = years.includes(initialYear) ? initialYear : years[0];
      filter.value = start; render(start);
      filter.addEventListener('change',()=>render(Number(filter.value)));
    }catch(err){ grid.innerHTML = `<div class="empty">세대 DB를 불러오지 못했습니다. ${esc(err.message)}</div>`; }
  }
  init();
})();

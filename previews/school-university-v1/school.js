/* School hub prototype: catalog-only view. No competition/MASTER writes. */
(() => {
  'use strict';
  const main = document.querySelector('.school-university-main');
  if (!main) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const divisions = [
    {key:'high-men',label:'남고부',age:'18세이하 남자부'},
    {key:'high-women',label:'여고부',age:'18세이하 여자부'},
    {key:'middle-men',label:'남중부',age:'15세이하 남자부'},
    {key:'middle-women',label:'여중부',age:'15세이하 여자부'}
  ];
  const $ = id => document.getElementById(id);
  const records = $('schoolRecords');
  let catalogs = [], latestYear = 2026, currentYear = 2026;
  let state = {division:'all',q:'',status:'all',sort:'recent'};
  const openYears = new Set();
  const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
  const status = item => !item.startDate || !item.endDate ? 'unknown' : today < item.startDate ? 'upcoming' : today > item.endDate ? 'completed' : 'live';
  const statusText = item => ({completed:'대회 종료',live:'진행 중',upcoming:'개최 예정',unknown:'일정 확인 중'}[status(item)]);
  const fmt = date => {
    if (!date) return '일정 미정';
    const [y,m,d] = date.split('-').map(Number);
    return `${date.replaceAll('-','.')}(${'일월화수목금토'[new Date(y,m-1,d).getDay()]})`;
  };
  const detailUrl = (item, division = state.division === 'all' ? 'high-men' : state.division, view = 'overview') => {
    if (!item.enginePrefix) return item.pagePath ? new URL(item.pagePath,'https://kvolleylab.com/').href : '';
    const url = new URL('https://kvolleylab.com/competition-engine.html');
    url.searchParams.set('competition',`${item.enginePrefix}-${division}`);
    url.searchParams.set('view',view);
    return url.href;
  };
  const linkAttrs = ' target="_blank" rel="noopener"';
  const icon = type => `<svg viewBox="0 0 24 24" aria-hidden="true">${type === 'date' ? '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' : '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>'}</svg>`;
  const trophy = rank => `<span class="univ-medal"><span class="dv2-trophy trophy-${Number(rank)}" aria-hidden="true"><svg viewBox="0 0 28 30"><path class="trophy-handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path class="trophy-cup" d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="trophy-shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path class="trophy-stem" d="M12 18h4v6h-4z"/><path class="trophy-base" d="M9 24h10l2 3H7z"/></svg></span></span>`;

  function panel(item,division) {
    const rows = (item.divisionResults?.[division.key] || []).filter(row => Number(row.rank) <= 4);
    const isFinished = status(item) === 'completed';
    const heading = division.label + (isFinished ? ' 최종순위' : ' 순위');
    const missing = item.recordStatus === 'partial' && isFinished;
    const body = rows.length ? rows.map(row => {
      const rank = Number(row.rank);
      const shared = rows.filter(r => Number(r.rank) === rank).length > 1;
      return `<div class="univ-rank-row">${rank <= 3 ? trophy(rank) : '<span class="univ-medal is-fourth" aria-hidden="true">4</span>'}<span class="univ-rank-label">${shared ? '공동 ' : ''}${esc(rank)}위</span><strong>${esc(row.team)}</strong></div>`;
    }).join('') : `<div class="univ-rank-empty">${isFinished ? '순위 확인 중' : '입상 순위 미확정'}</div>`;
    return `<a class="univ-ranking-panel ${division.key.endsWith('women') ? 'is-women' : 'is-men'}" data-division-panel="${division.key}" href="${esc(detailUrl(item,division.key,'knockout'))}"${linkAttrs} aria-label="${esc(item.shortName+' '+heading+' 상세 보기')}"><div class="univ-ranking-head"><strong>${heading}</strong><small>전체 순위 →</small></div><div class="univ-ranking-body">${body}${missing && rows.length ? '<p class="school-partial-note">나머지 순위 확인 중</p>' : ''}</div></a>`;
  }
  function record(item) {
    const selected = divisions.filter(d => state.division === 'all' || d.key === state.division);
    const label = state.division === 'all' ? '남고부' : selected[0].label;
    const statusClass = {completed:'is-complete',live:'is-active',upcoming:'is-upcoming'}[status(item)] || '';
    return `<article class="univ-record-card" id="record-${esc(item.competitionId)}" data-competition-id="${esc(item.competitionId)}">
      <div class="univ-record-info"><div class="univ-record-top"><span class="univ-series is-federation">${esc(item.series)}</span><span class="univ-status ${statusClass}">${statusText(item)}</span>${item.recordStatus === 'partial' ? '<span class="school-partial-badge">일부 기록 확인 중</span>' : ''}</div>
      <h3>${esc(item.shortName || item.name)}</h3>
      <p class="univ-record-meta"><span class="univ-meta-icon">${icon('date')}</span><span>${fmt(item.startDate)} ~<br>${fmt(item.endDate)}</span></p>
      <p class="univ-record-meta"><span class="univ-meta-icon">${icon('location')}</span><span>${esc(item.location || '개최지 확인 중')}</span></p>
      <a class="univ-record-link" href="${esc(detailUrl(item))}"${linkAttrs}>${label} 대회 보기 <span aria-hidden="true">→</span></a>
      <div class="school-detail-links"><a href="${esc(detailUrl(item,undefined,'schedule'))}"${linkAttrs}>경기일정·결과</a><a href="${esc(detailUrl(item,undefined,'rosters'))}"${linkAttrs}>참가팀·선수명단</a><a href="${esc(detailUrl(item,undefined,'resources'))}"${linkAttrs}>공식자료</a></div></div>
      <div class="school-record-panels">${selected.map(d => panel(item,d)).join('')}</div></article>`;
  }
  function matching(items) {
    const query = state.q.trim().toLocaleLowerCase('ko');
    return items.filter(item => {
      if (state.status !== 'all' && status(item) !== state.status) return false;
      const schools = divisions.filter(d => state.division === 'all' || d.key === state.division).flatMap(d => (item.divisionResults?.[d.key] || []).map(r => r.team));
      return !query || [item.name,item.shortName,item.series,item.location,...schools].join(' ').toLocaleLowerCase('ko').includes(query);
    }).sort((a,b) => state.sort === 'name' ? a.name.localeCompare(b.name,'ko') : state.sort === 'oldest' ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate));
  }
  function readUrl() {
    const p = new URLSearchParams(location.search);
    state = {division:divisions.some(d => d.key === p.get('category')) ? p.get('category') : 'all',q:p.get('q') || '',status:['completed','live','upcoming'].includes(p.get('status')) ? p.get('status') : 'all',sort:['oldest','name'].includes(p.get('sort')) ? p.get('sort') : 'recent'};
    currentYear = Array.from({length:4},(_,i) => latestYear-i).includes(Number(p.get('year'))) ? Number(p.get('year')) : latestYear;
    openYears.clear();openYears.add(currentYear);
    $('schoolSearch').value = state.q;$('schoolStatus').value = state.status;$('schoolSort').value = state.sort;$('schoolYearSelect').value = String(currentYear);
  }
  function writeUrl(push = true) {
    const url = new URL(location.href);
    url.searchParams.set('division','school');
    for (const [key,value,defaultValue] of [['category',state.division,'all'],['q',state.q,''],['status',state.status,'all'],['sort',state.sort,'recent'],['year',String(currentYear),String(latestYear)]]) {
      if (value === defaultValue) url.searchParams.delete(key); else url.searchParams.set(key,value);
    }
    history[push ? 'pushState' : 'replaceState'](null,'',url);
  }
  function renderRecords() {
    document.querySelectorAll('[data-division]').forEach(btn => btn.setAttribute('aria-pressed',String(btn.dataset.division === state.division)));
    records.classList.toggle('school-selected-division',state.division !== 'all');
    records.innerHTML = Array.from({length:4},(_,index) => {
      const year = latestYear-index;
      const catalog = catalogs.find(c => Number(c.year) === year);
      const list = catalog ? matching(catalog.competitions || []) : [];
      const open = openYears.has(year);
      const content = !catalog ? '<div class="univ-year-placeholder">검수 완료된 기록부터 순차적으로 추가합니다.</div>' : list.length ? `<div class="univ-record-list">${list.map(record).join('')}</div>` : '<div class="school-empty"><p>조건에 맞는 대회가 없습니다.</p><button type="button" data-reset>필터 초기화</button></div>';
      return `<section class="univ-year-block" data-year="${year}"><button class="univ-year-head" type="button" data-year-toggle="${year}" aria-expanded="${open}" aria-controls="school-year-${year}"><strong>${year}<span>SEASON${catalog ? ' ('+list.length+'개 대회)' : ' · 기록 준비 중'}</span></strong><span class="univ-year-chevron" aria-hidden="true">${open ? '⌃' : '⌄'}</span></button><div id="school-year-${year}" class="univ-year-details${open ? '' : ' is-collapsed'}">${content}</div></section>`;
    }).join('');
    const current = catalogs.find(c => Number(c.year) === currentYear);
    $('schoolResultCount').textContent = current ? `${currentYear}년 · ${state.division === 'all' ? '전체 부문' : divisions.find(d => d.key === state.division).label} · ${matching(current.competitions).length}개 대회` : `${currentYear}년 · 기록 준비 중`;
  }
  function renderFeatured() {
    const latest = catalogs.find(c => Number(c.year) === latestYear)?.competitions || [];
    const list = [...latest].sort((a,b) => b.startDate.localeCompare(a.startDate));
    $('featuredTitle').textContent = latestYear+' 대회';
    $('schoolFeaturedGrid').innerHTML = list.slice(0,3).map(item => `<a class="univ-featured-card" href="${esc(detailUrl(item))}"${linkAttrs}><span class="univ-featured-badge">${statusText(item)}</span><div class="univ-featured-content"><p class="univ-featured-year">${latestYear}</p><h3>${esc(item.shortName)}</h3><div class="univ-featured-meta"><span>${fmt(item.startDate)} ~ ${fmt(item.endDate)}</span><span>${esc(item.location)} · 남고·여고·남중·여중</span></div><div class="univ-featured-foot"><span>${esc(item.series)}</span><span class="univ-featured-arrow" aria-hidden="true">→</span></div></div></a>`).join('');
    const names = {'middle-high-second-2026':['익산보석배','익'],'middle-high-first-2026':['삼척연맹전','삼']};
    $('schoolCategoryGrid').innerHTML = list.map(item => {const label = names[item.competitionId]?.[0] || item.series;const symbol = names[item.competitionId]?.[1] || (item.series.startsWith('CBS') ? 'CBS' : item.series.startsWith('IBK') ? 'IBK' : item.series[0]);return `<a class="univ-category-card" href="${esc(location.pathname+location.search)}#record-${esc(item.competitionId)}" data-record-jump="${esc(item.competitionId)}"><div class="univ-category-symbol" aria-hidden="true">${esc(symbol)}</div><div class="univ-category-copy"><h3>${esc(label)}</h3><p>${esc(item.location)} · ${item.startDate.slice(5).replace('-','.')} ~ ${item.endDate.slice(5).replace('-','.')}</p></div><span class="univ-category-arrow" aria-hidden="true">→</span></a>`;}).join('');
  }
  function update() {writeUrl();renderRecords();renderFeatured();}
  function clearFilters() {state = {division:'all',q:'',status:'all',sort:'recent'};$('schoolSearch').value='';$('schoolStatus').value='all';$('schoolSort').value='recent';}
  const moreLink = main.querySelector('.univ-more-link');
  moreLink.href = location.pathname+location.search+'#recordsTitle';
  moreLink.addEventListener('click',event => {
    event.preventDefault();
    const target=$('recordsTitle');target.focus({preventScroll:true});
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  });
  main.addEventListener('click',event => {
    const button = event.target.closest('[data-division]');
    if (button) {state.division=button.dataset.division;update();return;}
    const toggle = event.target.closest('[data-year-toggle]');
    if (toggle) {
      const year = Number(toggle.dataset.yearToggle);const open = !openYears.has(year);
      if (open) {openYears.add(year);currentYear=year;$('schoolYearSelect').value=String(year);writeUrl();} else openYears.delete(year);
      renderRecords();records.querySelector(`[data-year-toggle="${year}"]`).focus({preventScroll:true});return;
    }
    if (event.target.closest('[data-reset]')) {clearFilters();update();$('schoolSearch').focus({preventScroll:true});return;}
    const jump = event.target.closest('[data-record-jump]');
    if (jump) {
      event.preventDefault();clearFilters();currentYear=latestYear;openYears.add(latestYear);$('schoolYearSelect').value=String(latestYear);update();
      const target=$('record-'+jump.dataset.recordJump);if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});}
    }
  });
  $('schoolSearch').addEventListener('input',() => {state.q=$('schoolSearch').value;writeUrl(false);renderRecords();});
  $('schoolStatus').addEventListener('change',() => {state.status=$('schoolStatus').value;update();});
  $('schoolSort').addEventListener('change',() => {state.sort=$('schoolSort').value;update();});
  $('schoolYearSelect').addEventListener('change',() => {currentYear=Number($('schoolYearSelect').value);openYears.clear();openYears.add(currentYear);update();});
  addEventListener('popstate',() => {readUrl();renderRecords();renderFeatured();});
  // The full shared navigation is retained. Links beyond this prototype open the live site.
  function routeNavigation() {
    if (typeof document === 'undefined' || !document.body) return;
    document.querySelectorAll('a[href]').forEach(a => {
      const raw=a.getAttribute('href');if(!raw || raw.startsWith('#')) return;
      const url=new URL(raw,location.href);if(url.origin!==location.origin) return;
      if(url.pathname==='/domestic-competitions.html' && url.searchParams.get('division')==='school') return;
      if(url.pathname.startsWith('/previews/')) return;
      a.href='https://kvolleylab.com'+url.pathname+url.search+url.hash;a.target='_blank';a.rel='noopener';
    });
  }
  const navigationObserver = new MutationObserver(routeNavigation);
  navigationObserver.observe(document.body,{childList:true,subtree:true});
  addEventListener('pagehide',() => navigationObserver.disconnect(),{once:true});
  routeNavigation();
  const json = async path => {const response=await fetch(path,{cache:'no-cache'});if(!response.ok)throw new Error(path+': '+response.status);return response.json();};
  json('data/competitions/school-years.json').then(async manifest => {
    latestYear=Number(manifest.latestYear);catalogs=await Promise.all(manifest.years.map(year=>json(year.dataPath)));
    $('schoolYearSelect').innerHTML=Array.from({length:4},(_,i)=>`<option value="${latestYear-i}">${latestYear-i}년</option>`).join('');
    readUrl();renderFeatured();renderRecords();main.dataset.ready='true';
  }).catch(error => {
    console.error('School prototype:',error);main.dataset.ready='error';
    $('schoolFeaturedGrid').innerHTML='<p class="school-source-note">대회 정보를 불러오지 못했습니다.</p>';
    records.innerHTML='<p class="school-empty">기록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>';
  });
})();

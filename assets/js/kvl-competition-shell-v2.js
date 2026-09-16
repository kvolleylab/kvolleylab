/* K-Volley Lab · Competition V2 shared shell
 * Visual source of truth: validated AVC men/women production geometry.
 * Competition pages provide data only; DOM/class geometry stays common.
 */
(()=>{
'use strict';
function ensureShell(){
  const main=document.querySelector('[data-kvl-shell]');
  if(!main||main.dataset.kvlShellReady==='1')return;
  main.classList.add('kvl1180-main');
  main.dataset.kvlShellReady='1';
  main.innerHTML=`
  <svg class="kvl1180-sprite" aria-hidden="true" focusable="false">
    <symbol id="kvl-icon-calendar-line" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></symbol>
    <symbol id="kvl-icon-pin-line" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
    <symbol id="kvl-icon-users-solid" viewBox="0 0 24 24"><circle cx="8" cy="7" r="3.3"/><circle cx="16.5" cy="8.2" r="2.7"/><path d="M1.7 20c.25-4.6 2.6-7.2 6.3-7.2s6.05 2.6 6.3 7.2H1.7Z"/><path d="M13.1 20c.2-3.55 1.9-5.6 4.65-5.6 2.55 0 4.2 1.95 4.55 5.6h-9.2Z"/></symbol>
    <symbol id="kvl-icon-layers-solid" viewBox="0 0 24 24"><path d="m12 2.4 10 5.2-10 5.2L2 7.6 12 2.4Z"/><path d="m2.9 11.5 9.1 4.7 9.1-4.7.9 2-10 5.2-10-5.2.9-2Z"/><path d="m2.9 16.2 9.1 4.7 9.1-4.7.9 2-10 5.2-10-5.2.9-2Z"/></symbol>
    <symbol id="kvl-icon-calendar-solid" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2.5"/><rect x="6" y="2" width="2.5" height="6" rx="1.2"/><rect x="15.5" y="2" width="2.5" height="6" rx="1.2"/><rect x="6" y="11" width="3" height="3" rx=".5" fill="#fff"/><rect x="10.5" y="11" width="3" height="3" rx=".5" fill="#fff"/><rect x="15" y="11" width="3" height="3" rx=".5" fill="#fff"/><rect x="6" y="15.5" width="3" height="3" rx=".5" fill="#fff"/><rect x="10.5" y="15.5" width="3" height="3" rx=".5" fill="#fff"/></symbol>
    <symbol id="kvl-icon-trophy-solid" viewBox="0 0 24 24"><path d="M7 3h10v5.2c0 4.4-2 7.3-5 7.3s-5-2.9-5-7.3V3Z"/><path d="M7 5H2.7v2.6c0 3.4 2 5.4 5.5 5.7V10c-1.8-.2-2.7-1.1-2.7-2.5V7H7V5Zm10 0h4.3v2.6c0 3.4-2 5.4-5.5 5.7V10c1.8-.2 2.7-1.1 2.7-2.5V7H17V5Z"/><rect x="10.5" y="15" width="3" height="4"/><rect x="7.5" y="19" width="9" height="2.5" rx="1.2"/></symbol>
    <symbol id="kvl-icon-pin-solid" viewBox="0 0 24 24"><path d="M12 2.2a7.8 7.8 0 0 0-7.8 7.8c0 5.5 7.8 12 7.8 12s7.8-6.5 7.8-12A7.8 7.8 0 0 0 12 2.2Z"/><circle cx="12" cy="10" r="2.7" fill="#fff"/></symbol>
    <symbol id="kvl-icon-bars-solid" viewBox="0 0 24 24"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="9" y="8" width="4" height="13" rx="1"/><rect x="15" y="4" width="4" height="17" rx="1"/><rect x="21" y="10" width="2" height="11" rx="1"/></symbol>
    <symbol id="kvl-icon-medal-solid" viewBox="0 0 24 24"><path d="m6 2 4.3 6.2h3.4L18 2h-4l-2 3-2-3H6Z"/><circle cx="12" cy="14.5" r="6.5"/><circle cx="12" cy="14.5" r="2.6" fill="#fff"/></symbol>
    <symbol id="kvl-icon-world-solid" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2.8 12h18.4M12 2.7c2.5 2.7 3.8 5.8 3.8 9.3S14.5 18.6 12 21.3M12 2.7C9.5 5.4 8.2 8.5 8.2 12s1.3 6.6 3.8 9.3" fill="none" stroke="#fff" stroke-width="1.5"/></symbol>
  </svg>

  <section class="kvl1180-hero" aria-labelledby="pageTitle">
    <div class="kvl1180-hero-copy">
      <p class="kvl1180-eyebrow" data-kvl="eyebrow">INTERNATIONAL COMPETITION</p>
      <h1 id="pageTitle" data-kvl="title">KVL Competition</h1>
      <p class="kvl1180-hero-sub" data-kvl="official-name"></p>
      <div class="kvl1180-hero-meta">
        <div class="kvl1180-meta-row"><svg class="kvl1180-icon" aria-hidden="true"><use href="#kvl-icon-calendar-line"/></svg><span data-kvl="dates">일정 확정 전</span></div>
        <div class="kvl1180-meta-row"><svg class="kvl1180-icon" aria-hidden="true"><use href="#kvl-icon-pin-line"/></svg><span class="kvl1180-hero-location"><span data-kvl="location">개최지 확정 전</span><span data-kvl="venue">경기장 확정 전</span></span></div>
      </div>
    </div>
    <div class="kvl1180-hero-status" aria-label="대회 상태"><span data-kvl="hero-status">대회 시작 전</span><span data-kvl="hero-team-count">참가국 확정 전</span><span class="is-accent" data-kvl="hero-stage">공식 일정 확인 중</span></div>
  </section>

  <div class="kvl1180-controlbar">
    <nav class="kvl1180-tabs" aria-label="대회 메뉴">
      <a data-view="overview" href="?view=overview">한눈에 보기</a><a data-view="schedule" href="?view=schedule">경기일정</a><a data-view="groups" href="?view=groups">조별순위</a><a data-view="knockout" href="?view=knockout">최종순위</a><a data-view="rosters" href="?view=rosters">참가국</a><a data-view="resources" href="?view=resources">공식자료</a>
    </nav>
    <nav class="kvl1180-gender" aria-label="성별 전환"><a data-gender-link="men" href="?view=overview">MEN · 남자부</a><a data-gender-link="women" class="is-disabled" aria-disabled="true" href="?view=overview">WOMEN · 여자부</a></nav>
  </div>

  <section class="kvl1180-card kvl1180-view" data-view="overview" aria-labelledby="snapshotTitle">
    <div class="kvl1180-section-head"><div><p class="label">TOURNAMENT SNAPSHOT</p><h2 id="snapshotTitle">대회 한눈에 보기</h2></div><p class="kvl1180-overview-result" data-result-mode="upcoming"><strong>공식 발표 기준으로 순차 업데이트됩니다.</strong></p></div>
    <div class="kvl1180-kpis">
      <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-users-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>참가국</span><strong data-kvl="team-count">미정</strong><small>개국</small></div></article>
      <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-layers-solid"/></svg></div><div class="kvl1180-kpi-copy"><span data-kvl-label="groups-kpi">조 편성</span><strong data-kvl="group-count">미정</strong><small data-kvl-unit="group-count">개 조</small></div></article>
      <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-calendar-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>전체 일정</span><strong data-kvl="match-count">미정</strong><small>경기</small></div></article>
      <article class="kvl1180-kpi"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-trophy-solid"/></svg></div><div class="kvl1180-kpi-copy"><span data-kvl-label="knockout-kpi">결선 진출</span><strong data-kvl="qualifier-count">미정</strong><small>개국</small></div></article>
      <article class="kvl1180-kpi is-venue"><div class="kvl1180-kpi-icon"><svg class="kvl1180-icon is-solid"><use href="#kvl-icon-pin-solid"/></svg></div><div class="kvl1180-kpi-copy"><span>대회 장소</span><strong data-kvl="venue-primary">미정</strong><small data-kvl="venue-secondary">확정 전</small></div></article>
    </div>
  </section>

  <section class="kvl1180-card kvl1180-stakes-card kvl1180-view" data-view="overview" data-kvl-section="qualifications">
    <div class="kvl1180-section-head"><div><p class="label" data-kvl="meaning-eyebrow">ROAD TO THE WORLD</p><h2 data-kvl="meaning-title">대회 의미 · 국제 진출권</h2></div><p data-kvl="meaning-note">대회별 공식 규정과 확정 결과만 표시합니다.</p></div>
    <div class="kvl1180-stakes-grid" data-kvl-component="qualifications"></div><div data-kvl-component="focus"></div>
  </section>

  <section class="kvl1180-card kvl1180-view" data-view="overview" data-kvl-section="calendar">
    <div class="kvl1180-calendar-head"><div><p class="kvl1180-eyebrow">COMPETITION CALENDAR</p><h2>대회 월간 달력</h2></div><p>각 날짜 안에서 경기 시간과 대진을 바로 확인할 수 있습니다.</p></div>
    <div data-kvl-component="calendar"><div class="kvl1180-schedule-empty">대회 달력을 불러오는 중입니다.</div></div>
  </section>

  <section class="kvl1180-card kvl1180-schedule-card kvl1180-view" id="schedule" data-view="schedule" hidden>
    <div class="kvl1180-section-head"><div><p class="label">MATCH SCHEDULE &amp; RESULTS</p><h2>경기일정</h2></div><p data-kvl="schedule-note">한국시간(KST)</p></div>
    <div class="kvl1180-schedule-toolbar"><div class="kvl1180-stage-filters" data-kvl-component="schedule-filters"></div><div class="kvl1180-pool-filter" data-kvl-component="pool-filter" hidden></div></div>
    <div class="kvl1180-schedule-summary" data-kvl-component="schedule-summary"><strong>전체</strong><span>경기 데이터를 불러오는 중입니다.</span></div>
    <div class="kvl1180-schedule-list" data-kvl-component="schedule-list"><div class="kvl1180-schedule-empty">경기일정을 불러오는 중입니다.</div></div>
  </section>

  <section class="kvl1180-card kvl1180-view kvl1180-groups-view" id="groups" data-view="groups" hidden>
    <div class="kvl1180-section-head"><div><p class="label" data-kvl-label="standings-eyebrow">POOL &amp; COMBINED STANDINGS</p><h2 data-kvl-label="standings-title">조별순위</h2></div><div class="kvl1180-groups-status"><span><strong data-kvl="groups-status">공식 결과 기준</strong></span></div></div>
    <div class="kvl1180-groups-rule" data-kvl-component="standings-rule"><span data-kvl="standings-rule">대회 규정에 따라 순위를 계산합니다.</span><div class="kvl1180-groups-legend"><span class="q"><i></i>진출</span><span class="o"><i></i>탈락</span></div></div>
    <div data-kvl-component="standings"><div class="kvl1180-schedule-empty">순위를 불러오는 중입니다.</div></div>
    <p class="kvl1180-groups-footnote" data-kvl="standings-note">공식 결과 기준</p>
  </section>

  <section class="kvl1180-card kvl1180-view kvl1180-knockout-view" id="knockout" data-view="knockout" hidden>
    <div class="kvl1180-section-head"><div><p class="label">FINAL STANDINGS</p><h2 data-kvl-label="knockout-title">최종순위</h2></div><div class="kvl1180-knockout-status"><span><strong data-kvl="knockout-status">공식 결과 기준</strong></span></div></div>
    <div class="kvl1180-final-block">
      <div class="kvl1180-final-block-head"><div><p class="label">FINAL RANKING</p><h3>최종 1~4위</h3></div><p>공식 확정 결과</p></div>
      <div class="kvl1180-final-grid" data-kvl-component="final-top4"></div>
    </div>
    <div class="kvl1180-knockout-block">
      <div class="kvl1180-knockout-subhead"><div><p class="label">KNOCKOUT BRACKET</p><h3 data-kvl="bracket-title">결선 토너먼트</h3></div><p>경기결과 자동 연동</p></div>
      <div data-kvl-component="knockout"><div class="kvl1180-schedule-empty">결선 대진을 불러오는 중입니다.</div></div>
    </div>
  </section>

  <section class="kvl1180-card kvl1180-view kvl1180-participants-view" id="rosters" data-view="rosters" hidden>
    <div class="kvl1180-section-head"><div><p class="label">PARTICIPATING TEAMS</p><h2 data-kvl-label="participants-title">참가국</h2></div><div class="kvl1180-participant-status"><span><strong data-kvl="participants-status">참가국</strong></span></div></div>
    <div data-kvl-component="participants"><div class="kvl1180-schedule-empty">참가국을 불러오는 중입니다.</div></div>
    <div data-kvl-component="roster"></div>
  </section>

  <section class="kvl1180-card kvl1180-view kvl1180-resources-view" id="resources" data-view="resources" hidden>
    <div class="kvl1180-section-head"><div><p class="label">OFFICIAL RESOURCES</p><h2>공식자료</h2></div><p>공식 출처만 연결합니다.</p></div>
    <div class="kvl1180-sources" id="resourceList"></div>
  </section>`;
}
ensureShell();
window.KVLCompetitionShellV2={ensureShell};
})();
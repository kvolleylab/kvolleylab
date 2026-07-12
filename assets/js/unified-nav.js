(() => {
  const originalNav = document.querySelector('header .site-nav, header nav');
  const header = originalNav?.closest('header');
  if (!header) return;

  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const competitionPages = new Set([
    'competition.html','vnl.html','japan.html','brazil.html','poland.html','iran.html','usa.html','france.html',
    'argentina.html','italy.html','canada.html','belgium.html','cuba.html','slovenia.html',
    'bulgaria.html','germany.html','serbia.html','turkiye.html','china.html','ukraine.html'
  ]);
  const playerPages = new Set(['players.html','player.html','player-search.html']);

  let active = '';
  if (path === 'index.html' || path === '') active = 'home';
  else if (playerPages.has(path)) active = 'players';
  else if (competitionPages.has(path)) active = 'competition';
  else if (path === 'schedules.html') active = 'schedules';
  else if (path === 'simulator.html') active = 'simulator';
  else if (path === 'pamphlet-archive.html') active = 'pamphlets';

  const items = [
    ['home','index.html','Home','홈'],
    ['players','players.html','Players','선수'],
    ['competition','competition.html','Competition','대회'],
    ['schedules','schedules.html','Schedules','일정'],
    ['simulator','simulator.html','Simulator','진출계산기'],
    ['pamphlets','pamphlet-archive.html','Pamphlets','팜플렛'],
    ['request','https://forms.gle/MFNYhJX6Bq5zeNmp8','Request','요청']
  ];

  const style = document.createElement('style');
  style.id = 'kvl-unified-header-style';
  style.textContent = `
    .kvl-unified-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 1000 !important;
      box-sizing: border-box !important;
      width: 100% !important;
      height: 76px !important;
      min-height: 76px !important;
      margin: 0 !important;
      padding: 0 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 24px !important;
      background: #0d1727 !important;
      border: 0 !important;
      border-bottom: 1px solid rgba(255,255,255,.12) !important;
      box-shadow: none !important;
      font-family: Arial, sans-serif !important;
    }
    .kvl-unified-logo {
      flex: 0 0 auto !important;
      margin: 0 !important;
      padding: 0 !important;
      color: #e1b84f !important;
      font-family: Arial, sans-serif !important;
      font-size: 24px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      letter-spacing: 0 !important;
      text-decoration: none !important;
      white-space: nowrap !important;
    }
    .kvl-unified-nav {
      flex: 0 1 auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 8px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      overflow: visible !important;
    }
    .kvl-unified-nav a {
      box-sizing: border-box !important;
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 38px !important;
      min-height: 38px !important;
      min-width: 92px !important;
      margin: 0 !important;
      padding: 0 13px !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: transparent !important;
      color: #e7edf5 !important;
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      letter-spacing: 0 !important;
      text-decoration: none !important;
      white-space: nowrap !important;
      transform: none !important;
      box-shadow: none !important;
      overflow: hidden !important;
    }
    .kvl-nav-label-en,
    .kvl-nav-label-ko {
      position: absolute !important;
      inset: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: opacity .16s ease !important;
      pointer-events: none !important;
    }
    .kvl-nav-label-en { opacity: 1 !important; }
    .kvl-nav-label-ko { opacity: 0 !important; }
    .kvl-unified-nav a:hover {
      background: rgba(225,184,79,.14) !important;
      color: #e1b84f !important;
      transform: none !important;
    }
    .kvl-unified-nav a:hover .kvl-nav-label-en { opacity: 0 !important; }
    .kvl-unified-nav a:hover .kvl-nav-label-ko { opacity: 1 !important; }
    .kvl-unified-nav a.active {
      background: #e1b84f !important;
      color: #071b2a !important;
    }
    @media (max-width: 820px) {
      .kvl-unified-header {
        height: 68px !important;
        min-height: 68px !important;
        padding: 0 14px !important;
        gap: 14px !important;
      }
      .kvl-unified-logo { font-size: 20px !important; }
      .kvl-unified-nav {
        flex: 1 1 auto !important;
        justify-content: flex-start !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
        -webkit-overflow-scrolling: touch !important;
      }
      .kvl-unified-nav::-webkit-scrollbar { display: none !important; }
      .kvl-unified-nav a {
        flex: 0 0 auto !important;
        height: 34px !important;
        min-height: 34px !important;
        min-width: 78px !important;
        padding: 0 11px !important;
        font-size: 13px !important;
      }
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  const navHtml = items.map(([key, href, labelEn, labelKo]) => {
    const attrs = key === 'request' ? ' target="_blank" rel="noopener"' : '';
    const cls = active === key ? ' class="active"' : '';
    return `<a${cls} href="${href}" aria-label="${labelKo}" title="${labelKo}"${attrs}><span class="kvl-nav-label-en">${labelEn}</span><span class="kvl-nav-label-ko">${labelKo}</span></a>`;
  }).join('');

  header.className = 'kvl-unified-header';
  header.innerHTML = `
    <a class="kvl-unified-logo" href="index.html">K-Volley Lab</a>
    <nav class="kvl-unified-nav" aria-label="Main navigation">${navHtml}</nav>
  `;
})();

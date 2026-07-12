(() => {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const competitionPages = new Set([
    'vnl.html','japan.html','brazil.html','poland.html','iran.html','usa.html','france.html',
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
    ['home','index.html','Home'],
    ['players','players.html','Players'],
    ['competition','vnl.html','Competition'],
    ['schedules','schedules.html','Schedules'],
    ['simulator','simulator.html','Simulator'],
    ['pamphlets','pamphlet-archive.html','Pamphlets'],
    ['request','https://forms.gle/MFNYhJX6Bq5zeNmp8','Request']
  ];

  nav.innerHTML = items.map(([key, href, label]) => {
    const attrs = key === 'request' ? ' target="_blank" rel="noopener"' : '';
    const cls = active === key ? ' class="active"' : '';
    return `<a${cls} href="${href}"${attrs}>${label}</a>`;
  }).join('');
})();

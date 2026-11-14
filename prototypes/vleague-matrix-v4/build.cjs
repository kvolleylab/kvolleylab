// Presentation-only variant: directly reuse the reviewed v3 engine and controller.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const dataRef = process.argv[2] || 'origin/main';
const destination = process.argv[3] || path.join(__dirname, 'index.html');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = {};
for (const gender of ['men', 'women']) {
  const slug = `v-league-${gender}-2026-27`;
  const atRef = file => JSON.parse(cp.execFileSync('git', ['show', `${dataRef}:data/competitions/${slug}/${file}`], { cwd: root, maxBuffer: 2e6 }));
  const config = atRef('config.json');
  source[gender] = { data: atRef('data.json'), config: { slug: config.slug, structure: { calendarDisplay: config.structure.calendarDisplay } } };
}
const values = {
  FONT: read('assets/css/pretendard-global.css'),
  NAV_CSS: read('assets/css/kvl-global-sidebar-v1.css'),
  SUBMENU_CSS: read('assets/css/kvl-global-sidebar-submenus.css'),
  MATRIX_CSS: read('prototypes/vleague-matrix-v3/matrix.css') + '\n' + read('prototypes/vleague-matrix-v4/brand.css'),
  NAV_JS: read('assets/js/kvl-global-sidebar-v1.js'),
  CORE_JS: read('prototypes/vleague-matrix-v3/core.js'),
  APP_JS: read('prototypes/vleague-matrix-v3/app.js'),
  SNAPSHOT: JSON.stringify(source).replace(/</g, '\\u003c')
};
let html = read('prototypes/vleague-matrix-v3/page.html')
  .replaceAll('v3', 'v4')
  .replace('<body data-gender="men">', '<body class="matrix-brand" data-gender="men">')
  .replace('2026–27 V-LEAGUE · ', 'K-VOLLEY LAB · 2026–27 V-LEAGUE · ')
  .replace('<h1>승패 조견표</h1>', '<h1><em>승패</em> 조견표</h1>')
  .replace('K-VOLLEY LAB · REVIEW PROTOTYPE · 운영 미반영', '<strong>K-VOLLEY LAB</strong><span>2026–27 · 디자인 시안 v4 · 운영 미반영</span>');
for (const [key, value] of Object.entries(values)) html = html.replace(`/*__${key}__*/`, () => value);
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, html);
console.log(JSON.stringify({ destination, dataRef, bytes: Buffer.byteLength(html), completed: Object.fromEntries(Object.entries(source).map(([g, s]) => [g, s.data.matches.filter(m => m.status === 'final').length])) }));

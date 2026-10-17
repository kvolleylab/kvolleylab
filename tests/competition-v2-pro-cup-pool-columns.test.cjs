'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const css = read('assets/css/kvl-competition-components-v2.css');
const geometry = read('assets/css/kvl-competition-geometry-v2.css');
const proStart = css.lastIndexOf('/* PRO · large club logos in pool standings');
assert(proStart >= 0, 'shared PRO pool rules must exist');
const pro = css.slice(proStart);

const columns = pro.match(/grid-template-columns:([^;]+)!important/);
assert(columns, 'PRO pool header/row grid must be defined');
assert.equal(columns[1].trim().split(/\s+/).length, 7,
  'ranking, team, wins, losses, points, set ratio, point ratio require seven tracks');
assert.match(pro, /\.kvl1180-pool-table-head,\s*[^{}]+\.kvl1180-pool-row\{/,
  'headers and rows must share the same grid rule');
assert.match(pro, /\[data-kvl-variant="cup"\] #groups \.kvl1180-pool-grid\{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important;/,
  'two-pool cups must use two readable cards on wide desktop');
assert.match(pro, /max-width:1100px[\s\S]*?grid-template-columns:minmax\(0,1fr\)!important;/,
  'tablet must use one readable cup card per row');
assert.match(geometry, /26px minmax\(84px,1fr\) 24px 24px 32px 42px 42px/,
  'the small-screen shared grid must retain seven columns');

const winsLossesRule = [
  'body.kvl1180-prototype.kvl-competition-template-v2[data-kvl-family="pro"][data-kvl-variant="cup"] #groups :is(.kvl1180-pool-w,.kvl1180-pool-l){',
  '  font-size:var(--kvl-type-standings-value)!important;',
  '}'
].join('\n');
assert(css.includes(winsLossesRule), 'PRO Cup must use shared 15px token for wins and losses');
const pointsRule = [
  '#groups :is(.kvl1180-pool-wl,.kvl1180-pool-pts,.kvl1180-pool-ratio){',
  '  font-size:var(--kvl-type-standings-value)!important;',
  '}'
].join('\n');
assert(read('assets/css/kvl-competition-base-v2.css').includes(pointsRule),
  'points must use the same shared typography token as wins and losses');

const version = 'kvl-competition-components-v2.css?v=20261017-pro-cup-type-parity-1';
for (const shell of ['competition-engine.html', 'competition-engine-prototype.html']) {
  assert(read(shell).includes(version), shell + ' must refresh the shared CSS asset');
}
for (const gender of ['men', 'women']) {
  const stem = 'data/competitions/kovo-cup-' + gender + '-2026/';
  const config = JSON.parse(read(stem + 'config.json'));
  const data = JSON.parse(read(stem + 'data.json'));
  assert.equal(config.competition.competitionFamily, 'pro');
  assert.equal(config.hero.themeVariant, 'cup');
  assert.equal(config.structure.standings.mode, 'pools-combined');
  assert.equal(data.standings.pools.length, 2);
  for (const pool of data.standings.pools) {
    for (const row of pool.rows) {
      for (const field of ['rank', 'team', 'wins', 'losses', 'points', 'setRatio', 'pointRatio'])
        assert(Object.hasOwn(row, field), gender + ' pool row missing ' + field);
    }
  }
}
console.log('PASS: KOVO Cup men/women seven-column standings geometry and W/L/points type parity');

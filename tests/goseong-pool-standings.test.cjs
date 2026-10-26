const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {rebuildPools, calculatePool, ratioLabel} = require('../scripts/rebuild-goseong-pool-standings.cjs');
const root = path.resolve(__dirname, '..');
const read = gender => JSON.parse(fs.readFileSync(path.join(root, `data/competitions/university-goseong-${gender}-2026/data.json`), 'utf8'));
// Official men's totals (/646), women's official set results (/661, /662),
// and the existing Drive match MASTER. These expected totals are independent
// of the generation code and exclude all eight knockout games.
const expected = {
  men: [['CSU',336,299,'1.124'],['SKKU',291,240,'1.213'],['KGU',345,333,'1.036'],['KIU',294,334,'0.880'],['MOK',257,317,'0.811'],['INU',323,268,'1.205'],['JBU',355,343,'1.035'],['MJU',324,327,'0.991'],['HIU',311,309,'1.006'],['KHU',269,335,'0.803'],['HYU',325,236,'1.377'],['GNU',354,322,'1.099'],['CNU',283,291,'0.973'],['HNU',305,328,'0.930'],['WKU',233,323,'0.721']],
  women: [['KWU',150,74,'2.027'],['HNU',120,108,'1.111'],['DEU',62,150,'0.413'],['WKU',249,203,'1.227'],['DKU',264,229,'1.153'],['KIU',185,209,'0.885'],['MCS',192,249,'0.771']]
};

for (const gender of ['men', 'women']) {
  test(`${gender}: every published ratio matches verified preliminary totals and regeneration`, () => {
    const data = read(gender), rebuilt = rebuildPools(data);
    const rows = rebuilt.standings.pools.flatMap(p => p.rows);
    const totals = rebuilt.standings.pools.flatMap(p => Array.from(calculatePool(data, p), r => [r.team, r.pointsFor, r.pointsAgainst, ratioLabel(r.pointsFor, r.pointsAgainst)]));
    assert.deepEqual(totals, expected[gender]);
    assert.deepEqual(rows.map(r => [r.team.code, r.pointRatio]), expected[gender].map(([code,,,ratio]) => [code, ratio]));
    assert.deepEqual(rebuilt, data, 'checked-in output must be reproducible');
  });
  test(`${gender}: later rounds never enter a pool and source data is not mutated`, () => {
    const data = read(gender), before = structuredClone(data), baseline = rebuildPools(data).standings;
    assert.deepEqual(data, before);
    for (const m of data.matches.filter(m => m.stage !== '예선')) {
      m.pool = data.standings.pools[0].id;
      m.score = {home:3,away:0,sets:[{home:25,away:1},{home:25,away:1},{home:25,away:1}]};
    }
    assert.deepEqual(rebuildPools(data).standings, baseline);
    data.matches = data.matches.filter(m => m.stage === '예선');
    assert.deepEqual(rebuildPools(data).standings, baseline);
  });
  test(`${gender}: incomplete or conflicting set data must stop generation`, () => {
    const data = read(gender);
    data.matches[0].score.sets.pop();
    assert.throws(() => rebuildPools(data), /missing set scores/);
    const conflict = read(gender);
    conflict.matches[0].score.sets[0] = {home:0,away:25};
    if (gender === 'women') conflict.matches[0].score.sets[0] = {home:25,away:0};
    assert.throws(() => rebuildPools(conflict), /score conflict/);
  });
}

function fixture(games) {
  const matches = games.map(([home,away,sets], i) => ({id:`T${i}`,stage:'예선',pool:'A',home:{code:home},away:{code:away},score:{home:sets.filter(s=>s[0]>s[1]).length,away:sets.filter(s=>s[1]>s[0]).length,sets:sets.map(([home,away])=>({home,away}))}}));
  return {matches,standings:{pools:[{id:'A',matchCount:matches.length,rows:[...new Set(games.flatMap(g=>g.slice(0,2)))].map(code=>({team:{code}}))}]}};
}
test('equal wins: point ratio beats set ratio, match points and head-to-head', () => {
  const data = fixture([
    ['A','B',[[25,23],[25,23],[25,23]]],
    ['B','C',[[25,0],[25,0],[25,0]]],
    ['C','A',[[25,23],[23,25],[25,23],[23,25],[15,13]]]
  ]);
  const rows = calculatePool(data, data.standings.pools[0]);
  assert.deepEqual(Array.from(rows, r=>r.team), ['B','A','C']);
  assert.equal(rows[0].wins, rows[1].wins);
  assert.ok(rows[0].pointRatio > rows[1].pointRatio);
  assert.ok(rows[0].setRatio < rows[1].setRatio);
  assert.ok(rows[0].matchPoints < rows[1].matchPoints);
});
test('equal wins and point ratio: set ratio is next', () => {
  const data = fixture([
    ['A','B',[[25,23],[25,23],[25,23]]],
    ['B','A',[[25,22],[25,22],[25,23],[23,25]]]
  ]);
  const rows = calculatePool(data, data.standings.pools[0]);
  assert.deepEqual(Array.from(rows, r=>r.team), ['A','B']);
  assert.equal(rows[0].pointRatio, rows[1].pointRatio);
  assert.ok(rows[0].setRatio > rows[1].setRatio);
});
test('fully tied ratios: direct winner takes precedence over team code', () => {
  const data = fixture([
    ['Z','A',[[25,20],[25,20],[25,20]]],
    ['A','D',[[25,20],[25,20],[25,20]]],
    ['C','Z',[[25,20],[25,20],[25,20]]]
  ]);
  const rows = calculatePool(data, data.standings.pools[0]);
  const a = rows.find(r=>r.team==='A'), z = rows.find(r=>r.team==='Z');
  assert.equal(a.pointRatio, z.pointRatio);
  assert.equal(a.setRatio, z.setRatio);
  assert.ok(z.rank < a.rank);
});
test('decimal-half rounding agrees with the official 291 / 240 = 1.213 display', () => {
  assert.equal(ratioLabel(291,240), '1.213');
  assert.equal(ratioLabel(0,75), '0.000');
  assert.equal(ratioLabel(6,0), 'MAX');
});

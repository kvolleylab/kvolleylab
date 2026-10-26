// Rebuild the two existing Goseong pool tables from verified preliminary sets.
// Match records, IDs, participants, final rankings and other events are untouched.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/kvl-tournament-engine.js'), 'utf8'), context);
const engine = context.window.KVLTournamentEngine;
const rules = {rankingRules: ['wins', 'pointRatio', 'setRatio', 'headToHead'], qualifiersPerPool: 2};
// Round positive integer totals, avoiding (291 / 240).toFixed(3) === '1.212'.
const ratioLabel = (won, lost) => lost ? (Math.round(won * 1000 / lost) / 1000).toFixed(3) : won ? 'MAX' : '-';

function calculatePool(data, pool) {
  const teams = new Set(pool.rows.map(row => row.team.code));
  const matches = data.matches.filter(m => m.stage === '예선' && m.pool === pool.id && !m.round);
  assert.equal(matches.length, pool.matchCount, `${pool.id}: incomplete preliminary schedule`);
  const games = matches.map(m => {
    assert.ok(teams.has(m.home.code) && teams.has(m.away.code), `${m.id}: wrong pool membership`);
    const score = m.score, sets = score?.sets;
    assert.ok(score && Array.isArray(sets) && sets.length === score.home + score.away, `${m.id}: missing set scores`);
    assert.ok(sets.every(s => Number.isInteger(s.home) && Number.isInteger(s.away) && s.home >= 0 && s.away >= 0 && s.home !== s.away), `${m.id}: invalid set points`);
    assert.equal(sets.filter(s => s.home > s.away).length, score.home, `${m.id}: home score conflict`);
    assert.equal(sets.filter(s => s.away > s.home).length, score.away, `${m.id}: away score conflict`);
    assert.equal(Math.max(score.home, score.away), 3, `${m.id}: incomplete match`);
    return {id: m.id, teamA: m.home.code, teamB: m.away.code, sets: sets.map(s => [s.home, s.away]), completed: true};
  });
  const calculated = engine.calculate(games, rules);
  assert.equal(calculated.length, teams.size, `${pool.id}: missing team results`);
  return calculated;
}

function rebuildPools(data) {
  const rebuilt = structuredClone(data);
  rebuilt.standings.pools = data.standings.pools.map(pool => ({...pool, rows: Array.from(calculatePool(data, pool), r => ({
    ...pool.rows.find(row => row.team.code === r.team),
    rank: r.rank, wins: r.wins, losses: r.losses, points: r.matchPoints,
    setRatio: ratioLabel(r.setsFor, r.setsAgainst), pointRatio: ratioLabel(r.pointsFor, r.pointsAgainst),
    status: r.qualified ? 'qualified' : 'eliminated'
  }))}));
  return rebuilt;
}

if (require.main === module) {
  for (const gender of ['men', 'women']) {
    const file = path.join(root, `data/competitions/university-goseong-${gender}-2026/data.json`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, JSON.stringify(rebuildPools(data), null, 2) + '\n');
    console.log(`${gender}: ${data.standings.pools.reduce((n, p) => n + p.rows.length, 0)} preliminary rows rebuilt`);
  }
}
module.exports = {rebuildPools, calculatePool, ratioLabel};

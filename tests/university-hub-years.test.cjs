const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const index = JSON.parse(read('data/competitions/university-index-2026.json'));
const before = JSON.stringify(index);
const source = read('assets/js/university-hub-years-v1.js');
const context = {
  document: { querySelector: () => ({}) }, location: {search: ''}, URLSearchParams,
  console, fetch: async url => ({ok: true, json: async () => JSON.parse(read(url.replace(/^\//, '').split('?')[0]))})
};
vm.createContext(context);
vm.runInContext(source.slice(0, source.indexOf('function render()')) + 'globalThis.adapter={fromIndex,panelFor,titleMarkup,row};})();', context);
(async () => {
  const cards = await Promise.all(index.competitions.map(context.adapter.fromIndex));
  let rankCount = 0;
  for (const [i, card] of cards.entries()) {
    const original = index.competitions[i];
    assert.equal(card.url, original.pagePath);
    assert.ok(fs.existsSync(path.join(root, card.url.split('?')[0])), card.url);
    assert.ok(fs.existsSync(path.join(root, card.image.replace(/^\//, '').split('?')[0])), card.image);
    for (const [sex, division] of [['men','남'],['women','여']]) {
      const panel = [...(original.recordPanels || []), ...(original.podiums || [])].find(p => p.division.includes(division));
      assert.deepEqual(JSON.parse(JSON.stringify(card[sex].r)), panel.rankings.slice(0,4).map(r => [r.rank,r.team]));
      rankCount += card[sex].r.length;
    }
    const rendered = context.adapter.row(card);
    assert.ok(!rendered.includes('undefined'));
    if (/고성대회|단양대회/.test(card.title)) {
      assert.equal((rendered.match(/class="tourney-title-line"/g) || []).length, 2);
    }
  }
  const league = cards.find(c => c.id === 'kusf-u-league-2026');
  assert.equal(league.men.label, '남자부 최종순위');
  assert.equal(league.men.note, '');
  assert.ok(!context.adapter.row(league).includes('준결승 결과'));
  assert.equal(JSON.stringify(index), before, 'Adapter must not mutate source records');
  assert.equal(context.adapter.panelFor({}, 'men').r.length, 0);
  assert.ok(context.adapter.titleMarkup('<script>').includes('&lt;script&gt;'));
  const html = read('university-competitions.html');
  assert.ok(html.includes('assets/js/unified-nav.js'));
  assert.ok(!html.includes('assets/js/university-competitions-hub-v2.js'));
  console.log(`PASS: ${cards.length} official HERO assets/routes; ${rankCount} unchanged ranking entries; requested labels/title breaks; empty-data and escaping contracts.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

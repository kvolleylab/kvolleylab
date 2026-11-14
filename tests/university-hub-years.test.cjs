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
vm.runInContext(source.slice(0, source.indexOf('function render()')) + 'globalThis.adapter={fromIndex,fromArchive,panelFor,titleMarkup,row,yearOptions,archiveYears,setArchives:items=>{archives=items}};})();', context);
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
  for (const card of cards) {
    const url = new URL(card.womenUrl, 'https://kvolleylab.com/');
    const slug = url.searchParams.get('competition') || (url.pathname.includes('danyang') ? 'university-danyang-women-2026' : 'university-goseong-women-2026');
    assert.equal(JSON.parse(read('data/competitions/' + slug + '/config.json')).competition.gender, 'women');
    assert.ok(context.adapter.row(card).includes('class="tournament-link"'), 'Current card must retain native whole-card navigation');
    assert.ok(context.adapter.row(card).includes('여자부 보기'), 'Every current card must provide an independent women link');
  }
  const archive = JSON.parse(read('data/archive/university-results-v1.json'));
  assert.equal(archive.competitions.length, 28);
  assert.equal(new Set(archive.competitions.map(c => c.id)).size, 28);
  for (const item of archive.competitions) {
    const card = context.adapter.fromArchive(item, archive.sources);
    const markup = context.adapter.row(card);
    assert.equal(card.resultsOnly, true);
    assert.ok(!markup.includes('--photo:') && !markup.includes('tournament-link'), 'Unpublished archive must not imply an image or standalone page');
    assert.notEqual(context.adapter.row(card, 'archive'), markup, 'Archive accordion and year selector need distinct IDs');
    const expectedRanks = (item.year >= 2024 || item.type !== 'uleague') ? ({
      '2022-second':7,'2018-second':7,'2019-first':6,'2019-second':6,'2020-second':3
    }[item.year+'-'+item.type] || 8) : item.women ? 4 : 2;
    assert.equal((item.men?.rankings.length || 0) + (item.women?.rankings.length || 0), expectedRanks);
    if (!item.women) assert.ok(markup.includes('single-division') && !markup.includes('rank-card women'));
    if (!item.men) {
      assert.equal(item.status,'partially-cancelled');
      assert.ok(markup.includes('single-division') && !markup.includes('rank-card men'));
      assert.ok(markup.includes('여자부 완료 · 남자부 중단') && markup.includes('08.22 중단'));
    }
    if (item.year <= 2023 && item.type === 'uleague') assert.ok(markup.includes('공식 확인된 1·2위만 표시'));
    for (const id of [...(item.sourceIds||[]), ...(item.men?.sourceIds||[]), ...(item.women?.sourceIds || [])]) {
      assert.ok(archive.sources[id]?.url.startsWith('https://'));
    }
  }
  const normalized = archive.competitions.map(c => context.adapter.fromArchive(c, archive.sources));
  context.adapter.setArchives(normalized);
  assert.deepEqual(Array.from(context.adapter.yearOptions()), Array.from({length: 14}, (_,i) => String(2026 - i)));
  assert.deepEqual(Array.from(context.adapter.archiveYears()), Array.from({length: 13}, (_,i) => String(2025 - i)));
  context.adapter.setArchives([...normalized, {year:'2012'}]);
  assert.equal(context.adapter.yearOptions().at(-1), '2012', 'Any earlier sourced year must be auto-discovered');
  const history = archive.competitions.filter(c => c.year <= 2023 && c.type === 'uleague');
  assert.equal(history.length, 11, 'Older U-League years 2013–2023 should be seeded');
  for (const item of history) {
    assert.equal(item.type, 'uleague');
    assert.deepEqual(item.men.rankings.map(r => r.rank), [1,2]);
    if(item.women) assert.deepEqual(item.women.rankings.map(r => r.rank), [1,2]);
    assert.ok(context.adapter.row(context.adapter.fromArchive(item,archive.sources)).includes('kusf.or.kr'));
  }
  const record = (year, type) => archive.competitions.find(c => c.year === year && c.type === type);
  for (const [type,location,men,women] of [
    ['first',/고성/,['중부대','인하대','한양대','경기대'],['단국대','광주여대','목포과학대','경일대']],
    ['second',/제천/,['인하대','경기대','성균관대','중부대'],['단국대','광주여대','우석대','목포과학대']]
  ]) {
    const cup = record(2023,type);
    assert.match(cup.title,location);
    assert.deepEqual(cup.men.rankings.map(r=>r.team),men);
    assert.deepEqual(cup.women.rankings.map(r=>r.team),women);
    assert.deepEqual(cup.men.rankings.map(r=>r.rank),[1,2,3,3]);
    assert.deepEqual(cup.women.rankings.map(r=>r.rank),[1,2,3,3]);
  }
  assert.equal(record(2023, 'uleague').men.rankings[0].team, '경기대');
  assert.equal(record(2023, 'uleague').women.rankings[0].team, '단국대');
  const gos22=record(2022,'first'),muan22=record(2022,'second');
  assert.match(gos22.title,/고성/);
  assert.match(muan22.title,/무안/);
  assert.deepEqual(gos22.men.rankings.map(r=>r.team),['인하대','경기대','성균관대','홍익대']);
  assert.deepEqual(gos22.women.rankings.map(r=>r.team),['경일대','단국대','우석대','호남대']);
  assert.deepEqual(gos22.women.rankings.map(r=>r.rank),[1,2,3,4],'Round robin has distinct 3rd and 4th');
  assert.deepEqual(muan22.men.rankings.map(r=>r.team),['인하대','성균관대','한양대','경기대']);
  assert.deepEqual(muan22.women.rankings.map(r=>r.team),['목포과학대','우석대','단국대']);
  assert.deepEqual(muan22.women.rankings.map(r=>r.rank),[1,2,3],'Unverified 4th cannot be fabricated');
  const haenam18=record(2018,'first'),cheongyang18=record(2018,'second');
  assert.match(haenam18.title,/해남/);
  assert.match(cheongyang18.title,/청양/);
  assert.deepEqual(haenam18.men.rankings.map(r=>r.team),['성균관대','경기대','홍익대','충남대']);
  assert.deepEqual(haenam18.men.rankings.map(r=>r.rank),[1,2,3,3]);
  assert.deepEqual(haenam18.women.rankings.map(r=>r.team),['우석대','서울여대','목포과학대','호남대']);
  assert.deepEqual(haenam18.women.rankings.map(r=>r.rank),[1,2,3,4]);
  assert.deepEqual(cheongyang18.men.rankings.map(r=>r.team),['한양대','경희대','충남대','경기대']);
  assert.deepEqual(cheongyang18.women.rankings.map(r=>r.team),['단국대','목포과학대','우석대']);
  assert.deepEqual(cheongyang18.women.rankings.map(r=>r.rank),[1,2,3]);
  const inje19=record(2019,'first'),haenam19=record(2019,'second');
  assert.deepEqual(inje19.men.rankings.map(r=>r.team),['인하대','홍익대']);
  assert.deepEqual(inje19.women.rankings.map(r=>r.team),['우석대','단국대','목포과학대','서울여대']);
  assert.deepEqual(haenam19.men.rankings.map(r=>r.team),['경기대','경희대']);
  assert.deepEqual(haenam19.women.rankings.map(r=>r.team),['목포과학대','우석대','서울여대','호남대']);
  assert.deepEqual(haenam19.women.rankings.map(r=>r.rank),[1,2,3,3]);
  const gos20=record(2020,'first'),muan20=record(2020,'second'),gos21=record(2021,'first');
  assert.deepEqual(gos20.men.rankings.map(r=>r.team),['성균관대','홍익대','인하대','중부대']);
  assert.deepEqual(gos20.women.rankings.map(r=>r.rank),[1,2,3,4]);
  assert.equal(muan20.men,undefined,"Suspended men's event has no champion");
  assert.deepEqual(muan20.women.rankings.map(r=>r.team),['목포과학대','단국대','우석대']);
  assert.deepEqual(muan20.women.rankings.map(r=>r.rank),[1,2,3]);
  assert.deepEqual(gos21.men.rankings.map(r=>r.team),['홍익대','인하대','경기대','성균관대']);
  assert.deepEqual(gos21.women.rankings.map(r=>r.team),['우석대','단국대','목포과학대','호남대']);
  assert.equal(record(2021,'second'),undefined,'Cancelled Jecheon 2021 must not have awards');
  assert.equal(record(2022, 'uleague').men.rankings[0].team, '인하대');
  assert.equal(record(2022, 'uleague').women.rankings[0].team, '경일대');
  assert.equal(record(2013, 'uleague').women, undefined);
  assert.match(record(2024, 'first').title, /단양/);
  assert.match(record(2024, 'second').title, /고성/);
  assert.deepEqual(record(2024, 'uleague').men.rankings.map(r => r.rank), [1,2,3,4]);
  assert.deepEqual(record(2025, 'uleague').men.rankings.map(r => r.rank), [1,2,3,3]);
  assert.equal(record(2025, 'first').men.rankings[0].team, '조선대');
  assert.equal(record(2024, 'uleague').men.rankings[0].team, '한양대');
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
  console.log(`PASS: ${cards.length} official HERO routes; ${rankCount} unchanged 2026 ranks; 28 sourced archive events / 155 historical ranks; 2013–2026 dynamic year options; optional women panels; no fake links/images.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

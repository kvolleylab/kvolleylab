import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {validateLottery, loadDraftLottery, renderLottery} from '../assets/js/draft-lottery-v1.mjs';
const require = createRequire(import.meta.url);
const {JSDOM} = require(process.env.KVL_JSDOM_PATH || 'jsdom');
const root = new URL('../', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('data/draft-applicants/2026-27/lottery.json', root)));

test('seven official teams total 100 balls, using the existing matching team logos', () => {
  assert.equal(validateLottery(data, '2026-27'), data);
  const participants = JSON.parse(fs.readFileSync(new URL('data/competitions/v-league-men-2026-27/data.json', root))).participants;
  assert.deepEqual(data.divisions.M.teams.map(t => [t.name, t.balls]), [
    ['삼성화재',35],['OK저축은행',30],['한국전력',20],['KB손해보험',8],['우리카드',4],['현대캐피탈',2],['대한항공',1]
  ]);
  for (const t of data.divisions.M.teams) {
    const existing = participants.find(p => p.code === t.team_code);
    assert.equal(existing.name, t.name);
    assert.equal(existing.logo, '/' + t.logo);
    assert.ok(fs.existsSync(new URL(t.logo, root)));
  }
});

test('reject mismatched seasons, missing sources, duplicate teams, and wrong totals', () => {
  assert.throws(() => validateLottery(data, '2027-28'));
  for (const mutate of [
    d => d.divisions.M.source_url = '',
    d => d.divisions.M.record_status = 'DRAFT',
    d => d.divisions.M.teams[0].balls = 34,
    d => d.divisions.M.teams[1].team_code = 'SFB',
    d => d.divisions.M.teams[0].logo = 'https://example.org/logo.svg'
  ]) {
    const copy = structuredClone(data); mutate(copy);
    assert.throws(() => validateLottery(copy, '2026-27'));
  }
});

test('cards show both divisions and clear on an unknown year', () => {
  const dom = new JSDOM('<section id="lottery" hidden></section>');
  try {
    const host = dom.window.document.querySelector('section');
    renderLottery(host, data, '2026-27', 'M');
    assert.equal(host.hidden, false);
    assert.equal(host.querySelectorAll('li').length, 7);
    assert.equal(host.querySelector('li h3').textContent, '삼성화재');
    assert.equal(host.querySelector('li p').textContent, '35개 (35%)');
    assert.equal(host.querySelector('li').firstElementChild.tagName, 'IMG');
    assert.match(host.textContent, /최종 지명 순서와는 다릅니다/);
    renderLottery(host, data, '2026-27', 'W');
    assert.equal(host.hidden, false); assert.equal(host.querySelectorAll('li').length,7);assert.equal(host.querySelector('li h3').textContent,'정관장');assert.equal(host.querySelector('li p').textContent,'35개 (35%)');
    renderLottery(host, data, '2027-28', 'M');
    assert.equal(host.hidden, true);
    renderLottery(host, data, '2026-27', 'M');
    assert.equal(host.querySelectorAll('li').length, 7);
  } finally { dom.window.close(); }
});

test('missing or invalid optional lottery data does not fail the applicant feature', async () => {
  assert.equal(await loadDraftLottery('2027-28', async () => ({ok: false})), null);
  assert.equal(await loadDraftLottery('2026-27', async () => { throw new Error('network'); }), null);
  assert.equal(await loadDraftLottery('2026-27', async () => ({ok: true, json: async () => ({})})), null);
  let called = false;
  assert.equal(await loadDraftLottery('../private', async () => { called = true; }), null);
  assert.equal(called, false);
  assert.deepEqual(await loadDraftLottery('2026-27', async () => ({ok: true, json: async () => data})), data);
});

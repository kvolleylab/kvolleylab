/* KVL domestic main hub HERO parity regression test.
 * Run: node --test tests/domestic-hub-hero-parity.test.cjs
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const shared = read('assets/css/kvl-domestic-hub-hero-v1.css');

test('all domestic main hubs load one shared HERO geometry contract', () => {
  for (const file of [
    'university-competitions.html',
    'comprehensive-competitions.html',
    'domestic-competitions.html'
  ]) {
    assert.match(read(file), /kvl-domestic-hub-hero-v1\.css/);
  }
  const school = read('assets/js/school-competitions-hub.js');
  assert.ok(school.indexOf('school-competitions-hub-v2.css') <
            school.indexOf('kvl-domestic-hub-hero-v1.css'));
});

test('PC and mobile dimensions are shared and content can expand', () => {
  assert.match(shared, /--kvl-domestic-hub-width:\s*1180px/);
  assert.match(shared, /--kvl-domestic-hub-hero-pc:\s*225px/);
  assert.match(shared, /--kvl-domestic-hub-hero-mobile:\s*215px/);
  assert.match(shared, /height:\s*auto/);
  assert.match(shared, /@media\s*\(max-width:\s*680px\)/);
});

test('comprehensive hub is no longer locked to a 3:1 HERO', () => {
  const comprehensive = read('assets/css/comprehensive-competitions-hub.css');
  assert.doesNotMatch(comprehensive, /aspect-ratio:\s*3\s*\/\s*1/);
  assert.doesNotMatch(comprehensive, /min-height:\s*275px/);
  assert.doesNotMatch(comprehensive, /min-height:\s*260px/);
  assert.match(shared, /\.comprehensive-hub\s+\.kvl-common-hero\[data-hero-mode="photo"\]/);
  assert.match(shared, /aspect-ratio:\s*auto/);
  assert.match(shared, /--kvl-common-hero-image-mobile/);
});

test('changes do not target individual Competition Engine V2 HERO nodes', () => {
  assert.doesNotMatch(shared, /\.kvl1180-hero/);
  assert.doesNotMatch(shared, /\.kvl-competition-template-v2/);
});
test('comprehensive PC image occupies the RIGHT 50% media slot (not full background)', () => {
  const [desktop] = shared.split(/@media\s*\(max-width:\s*680px\)/);
  const art = desktop.match(/\.comprehensive-hub \.kvl-common-hero\[data-hero-mode="photo"\]::before\s*\{([^}]+)\}/);
  assert.ok(art, 'dedicated PC image pseudo-element must exist');
  assert.match(art[1], /inset:\s*0\s+0\s+0\s+50%/);
  assert.match(art[1], /background-size:\s*100%\s+100%,\s*auto\s+130%/);
  assert.match(art[1], /background-position:\s*center,\s*right\s+top/);
  assert.match(art[1], /var\(--kvl-common-hero-image\)/);
  assert.match(desktop, /isolation:\s*isolate/);
});
test('mobile keeps its distinct artwork right-aligned and text-safe', () => {
  const [,mobile] = shared.split(/@media\s*\(max-width:\s*680px\)/);
  assert.ok(mobile);
  assert.match(mobile, /var\(--kvl-common-hero-image-mobile\)/);
  assert.match(mobile, /background-size:\s*100%\s+100%,\s*cover/);
  assert.match(mobile, /background-position:\s*center,\s*right center/);
  assert.match(read('comprehensive-competitions.html'), /20261110-comprehensive-right-half-v3/);
});

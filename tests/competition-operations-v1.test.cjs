'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const scaffold = require('../scripts/scaffold-competition-v2.cjs');
const operations = require('../scripts/kvl-competition-operations-v1.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kvl-operations-'));
const slug = 'verified-fixture-2032-men';
const directory = scaffold.create(slug, {root: path.join(root, 'data/competitions')});
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const clone = value => JSON.parse(JSON.stringify(value));
const original = read('operations.json');
const config = read('config.json');
Object.assign(config.competition, {competitionId: 'KVL-COMP-999999', displayName: 'Isolated fixture', officialName: 'Isolated test fixture', season: '2032', gender: 'men', competitionFamily: 'domestic'});
config.hero = {pcImage: '/test-only-pc.webp', mobileImage: '/test-only-mobile.webp'};
config.seo.description = 'Local fixture for operations contract tests only';
write('config.json', config);
for (const [name, content] of [
  ['scripts/official-source.cjs', '// Test-only source adapter fixture.'],
  ['.github/workflows/fixture.yml', 'name: fixture\non: workflow_dispatch\njobs: {}\n'],
  ['docs/verification.md', '# Fixture evidence\nThis local file makes no production verification claim.'],
  ['docs/archive.md', '# Fixture archive procedure\nFinal review, source versions, read-only snapshot, versioned corrections.']
]) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, content);
}
const verified = () => ({status: 'VERIFIED', evidence: 'docs/verification.md', verifiedAt: '2026-10-31T01:02:03Z', verifiedBy: 'test-reviewer'});
function qualified() {
  const m = clone(original);
  m.competition = {...config.competition};
  for (const key of ['displayName', 'officialName', 'competitionFamily']) delete m.competition[key];
  m.competition.slug = slug;
  m.owner = 'test-owner';
  m.page.qa = verified();
  m.sources = [{sourceId: 'KVL-SRC-999999', issuer: 'Fixture issuer', url: 'https://www.kusf.or.kr/', format: 'xlsx', adapterPath: 'scripts/official-source.cjs', parserVersion: '1.0.0', qualification: verified(), permissionReview: verified()}];
  m.master = {spreadsheetId: 'fixture_spreadsheet_0000000001', sheetId: 0, tabTitle: 'Fixtures', writeRange: 'B2:S127', permissionReview: verified(), writeReadback: verified()};
  Object.assign(m.automation, {workflowPath: '.github/workflows/fixture.yml', startDate: '2032-02-01', endDate: '2032-02-29', intervalMinutes: 30, integration: verified(), endGuard: verified()});
  Object.assign(m.archive, {driveFolderId: 'fixture_archive_folder_000001', metadataPath: 'data/archive/competitions/' + slug + '/manifest.json', procedurePath: 'docs/archive.md', graceDays: 14, verification: verified()});
  return m;
}
const opts = {config, slug, repoRoot: root, now: new Date('2032-02-10T00:00:00Z')};
const errors = m => operations.validate(m, opts);
let count = 0;
const check = (label, fn) => { fn(); count++; console.log('PASS ' + label); };

try {
  check('new draft cannot claim operational readiness from a valid page', () => {
    assert.doesNotThrow(() => scaffold.check(directory));
    assert(errors(original).some(error => error.includes('endDate')));
    assert(errors(original).some(error => error.includes('spreadsheetId')));
    assert(errors(original).some(error => error.includes('archive.verification')));
    assert.equal(original.state, 'DRAFT');
    assert.equal(original.automation.enabled, false);
  });
  check('qualified contract can be reviewed without writing state or data', () => {
    const m = qualified();
    assert.deepEqual(errors(m), []);
    write('operations.json', m);
    const before = ['config.json', 'data.json', 'operations.json'].map(name => fs.readFileSync(path.join(directory, name)));
    const result = scaffold.readyToActivate(directory, opts);
    assert.equal(result.operations.state, 'DRAFT');
    assert.equal(result.operations.automation.enabled, false);
    for (const [index, name] of ['config.json', 'data.json', 'operations.json'].entries()) assert.deepEqual(fs.readFileSync(path.join(directory, name)), before[index]);
  });
  check('verification cannot claim completion in the future, including one millisecond ahead', () => {
    const m = qualified();
    m.automation.integration.verifiedAt = opts.now.toISOString();
    assert.deepEqual(errors(m), []);
    m.automation.integration.verifiedAt = new Date(opts.now.getTime() + 1).toISOString();
    assert(errors(m).some(error => error.includes('automation.integration.verifiedAt must not be in the future')));
    m.automation.integration.verifiedAt = '2033-01-01T00:00:00Z';
    assert(operations.validate(m, {...opts, readyToActivate: true}).some(error => error.includes('must not be in the future')));
  });
  check('missing or impossible end date and reversed dates block activation', () => {
    for (const endDate of ['', null, '2032-02-30', '2031-02-29', '2032-01-31']) {
      const m = qualified(); m.automation.endDate = endDate;
      assert(errors(m).some(error => error.includes('endDate')));
    }
    const ended = qualified();
    assert(operations.validate(ended, {...opts, readyToActivate: true, now: new Date('2032-03-01T00:00:00Z')}).some(error => error.includes('is over')));
  });
  check('end date is inclusive in declared timezone', () => {
    assert.deepEqual(operations.validate(qualified(), {...opts, readyToActivate: true, now: new Date('2032-02-29T14:59:59Z')}), []);
    assert(operations.validate(qualified(), {...opts, readyToActivate: true, now: new Date('2032-02-29T15:00:00Z')}).some(error => error.includes('is over')));
  });
  check('archive location, procedure, reviewed verification and frozen records are required', () => {
    for (const change of [
      m => {m.archive.verification.status = 'NOT_VERIFIED';},
      m => {m.archive.driveFolderId = '';},
      m => {m.archive.procedurePath = 'docs/missing.md';},
      m => {m.archive.metadataPath = 'data/archive/another-event/manifest.json';},
      m => {m.archive.readOnlyAfterArchive = false;},
      m => {m.archive.graceDays = null;},
      m => {m.archive.versionedCorrections = false;}
    ]) { const m = qualified(); change(m); assert(errors(m).some(error => error.includes('archive.'))); }
  });
  check('unknown parser or source qualification cannot be marked ready', () => {
    for (const change of [
      m => {m.sources[0].qualification.status = 'NOT_VERIFIED';},
      m => {m.sources[0].qualification.evidence = '';},
      m => {m.sources[0].adapterPath = 'scripts/missing.py';},
      m => {m.sources[0].parserVersion = 'latest';},
      m => {m.sources[0].permissionReview.status = 'FAILED';},
      m => {m.sources.push(clone(m.sources[0]));}
    ]) { const m = qualified(); change(m); assert(errors(m).some(error => error.includes('sources['))); }
  });
  check('MASTER target and bounded exact range require write/readback evidence', () => {
    for (const change of [
      m => {m.master.spreadsheetId = 'https://docs.google.com/spreadsheets/d/id';},
      m => {m.master.sheetId = null;},
      m => {m.master.tabTitle = '';},
      m => {m.master.writeRange = 'A:Z';},
      m => {m.master.writeRange = 'S127:B2';},
      m => {m.master.permissionReview.status = 'NOT_VERIFIED';},
      m => {m.master.writeReadback.status = 'NOT_VERIFIED';}
    ]) { const m = qualified(); change(m); assert(errors(m).some(error => error.includes('master.'))); }
  });
  check('identity mismatch, missing owner, timezone or cadence blocks registration', () => {
    for (const change of [
      m => {m.competition.competitionId = 'KVL-COMP-999998';},
      m => {m.competition.season = '2033';},
      m => {m.competition.gender = 'women';},
      m => {m.owner = '';},
      m => {m.automation.timezone = 'not-a-zone';},
      m => {m.automation.intervalMinutes = null;}
    ]) { const m = qualified(); change(m); assert(errors(m).length > 0); }
  });
  check('workflow integration and end-date stop require evidence', () => {
    for (const change of [
      m => {m.automation.workflowPath = '.github/workflows/missing.yml';},
      m => {m.automation.integration.status = 'NOT_VERIFIED';},
      m => {m.automation.endGuard.status = 'NOT_VERIFIED';},
      m => {m.page.qa.status = 'NOT_VERIFIED';}
    ]) { const m = qualified(); change(m); assert(errors(m).length > 0); }
  });
  check('activation review does not accept an already enabled or archived state', () => {
    for (const [state, enabled] of [['DRAFT', true], ['ACTIVE', true], ['ARCHIVED', false]]) {
      const m = qualified(); m.state = state; m.automation.enabled = enabled;
      assert(operations.validate(m, {...opts, readyToActivate: true}).some(error => /activation review|ACTIVE/.test(error)));
    }
  });
  check('public manifest rejects credential fields, credential URLs and out-of-repo evidence', () => {
    const m = qualified(); m.master.credentials = 'fixture-only';
    assert(errors(m).some(error => error.includes('not allowed')));
    const url = qualified(); url.sources[0].url = 'https://www.kusf.or.kr/?access_token=fixture';
    assert(errors(url).some(error => error.includes('.url')));
    const outside = qualified(); outside.page.qa.evidence = '../external.md';
    assert(errors(outside).some(error => error.includes('.evidence')));
  });
  check('existing two-file page validation remains compatible but cannot pass activation', () => {
    fs.unlinkSync(path.join(directory, 'operations.json'));
    assert.doesNotThrow(() => scaffold.check(directory));
    assert.throws(() => scaffold.readyToActivate(directory, opts), /operations\.json/);
    write('operations.json', qualified());
  });
  check('production test-data rejection cannot be bypassed with validation option', () => {
    const data = read('data.json'); data.isTest = true; write('data.json', data);
    assert.throws(() => scaffold.readyToActivate(directory, {...opts, validation: true}), /test data/);
    delete data.isTest; write('data.json', data);
  });
  check('folder collision preserves existing completed results and all file bytes', () => {
    const data = {status: 'completed', champion: 'PRESERVE', matches: [{id: 'UNCHANGED', score: {home: 3, away: 1}}]};
    write('data.json', data);
    const before = fs.readdirSync(directory).sort().map(name => [name, fs.readFileSync(path.join(directory, name))]);
    assert.throws(() => scaffold.create(slug, {root: path.dirname(directory)}), /EEXIST/);
    for (const [name, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(directory, name)), bytes);
    assert.deepEqual(read('data.json'), data);
  });
  check('a colliding regular file is preserved', () => {
    const target = path.join(root, 'data/competitions/file-collision');
    fs.writeFileSync(target, 'existing content');
    assert.throws(() => scaffold.create('file-collision', {root: path.dirname(target)}), /EEXIST/);
    assert.equal(fs.readFileSync(target, 'utf8'), 'existing content');
  });
  console.log(count + ' operations readiness checks passed');
} finally {
  fs.rmSync(root, {recursive: true, force: true});
}

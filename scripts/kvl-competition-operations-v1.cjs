'use strict';

// Read-only connection contract. This module does not schedule, fetch, write MASTER,
// publish a page, grant access, or change the declared lifecycle state.
const fs = require('node:fs');
const path = require('node:path');
const defaultRepo = path.resolve(__dirname, '..');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && Boolean(value.trim());
const placeholder = /^(?:TODO|TBD|UNKNOWN|NOT[ _-]VERIFIED|미정|미확인|확인 전)$/i;
const filled = value => text(value) && !placeholder.test(value.trim());
const stableId = value => filled(value) && /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,127}$/.test(value);
const handle = value => filled(value) && /^[A-Za-z0-9][A-Za-z0-9-]{0,38}(?:\/[A-Za-z0-9][A-Za-z0-9-]{0,99})?$/.test(value);
const googleId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(value);
const secretParameter = /^(?:access_token|id_token|token|key|api_key|secret|password|signature|sig|credential|authorization)$/i;

function publicURL(value) {
  if (!filled(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !/(^|\.)(?:example\.(?:com|org|net)|invalid|localhost)$/.test(url.hostname) &&
      ![...url.searchParams.keys()].some(key => secretParameter.test(key));
  } catch { return false; }
}

function relativePath(value) {
  return text(value) && /^[A-Za-z0-9_.-][A-Za-z0-9_./-]*$/.test(value) &&
    !value.split('/').some(part => !part || part === '.' || part === '..' || part === '.git');
}

function existingFile(value, repoRoot) {
  if (!relativePath(value)) return false;
  try {
    const root = fs.realpathSync(repoRoot);
    const file = fs.realpathSync(path.resolve(root, value));
    return file.startsWith(root + path.sep) && fs.statSync(file).isFile();
  } catch { return false; }
}

function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function boundedRange(value) {
  if (typeof value !== 'string') return false;
  const match = /^([A-Z]{1,3})([1-9]\d*):([A-Z]{1,3})([1-9]\d*)$/.exec(value);
  if (!match) return false;
  const column = letters => [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  return column(match[1]) <= column(match[3]) && Number(match[2]) <= Number(match[4]) &&
    Number.isSafeInteger(Number(match[4]));
}

function validate(manifest, {config, slug, repoRoot = defaultRepo, readyToActivate = false, now = new Date()} = {}) {
  const errors = [];
  function shape(value, fields, label) {
    if (!object(value)) { errors.push(label + ' is required'); return {}; }
    for (const key of Object.keys(value)) if (!fields.includes(key)) errors.push(label + '.' + key + ' is not allowed in public operations metadata');
    return value;
  }
  function requireValue(condition, message) { if (!condition) errors.push(message); }
  function verification(value, label) {
    const v = shape(value, ['status', 'evidence', 'verifiedAt', 'verifiedBy'], label);
    requireValue(v.status === 'VERIFIED', label + '.status must be VERIFIED');
    requireValue(publicURL(v.evidence) || existingFile(v.evidence, repoRoot), label + '.evidence requires a public HTTPS evidence URL or existing repository file');
    const verifiedTime = Date.parse(v.verifiedAt);
    const timestampValid = typeof v.verifiedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v.verifiedAt) &&
      dateOnly(v.verifiedAt.slice(0, 10)) && Number.isFinite(verifiedTime);
    requireValue(timestampValid, label + '.verifiedAt requires a UTC verification timestamp');
    if (timestampValid) requireValue(verifiedTime <= new Date(now).getTime(), label + '.verifiedAt must not be in the future');
    requireValue(handle(v.verifiedBy), label + '.verifiedBy requires a GitHub user or team handle');
  }
  const m = shape(manifest, ['schemaVersion', 'competition', 'state', 'owner', 'page', 'sources', 'master', 'automation', 'archive'], 'operations');
  requireValue(m.schemaVersion === 1, 'operations.schemaVersion must be 1');
  const identity = shape(m.competition, ['competitionId', 'slug', 'season', 'gender'], 'operations.competition');
  requireValue(stableId(identity.competitionId), 'operations.competition.competitionId requires the existing stable MASTER ID');
  requireValue(typeof identity.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identity.slug), 'operations.competition.slug is required');
  requireValue(filled(identity.season), 'operations.competition.season is required');
  requireValue(['men', 'women'].includes(identity.gender), 'operations.competition.gender must be men or women');
  if (slug) requireValue(identity.slug === slug, 'operations.competition.slug disagrees with directory');
  if (!object(config?.competition)) errors.push('config.competition is required for identity comparison');
  else {
    for (const key of ['competitionId', 'season', 'gender']) requireValue(identity[key] === config.competition[key], 'operations.competition.' + key + ' disagrees with config');
    requireValue(identity.slug === config.slug, 'operations.competition.slug disagrees with config');
  }
  requireValue(['DRAFT', 'READY_FOR_REVIEW', 'ACTIVE', 'FINALIZING', 'ARCHIVED', 'PAUSED'].includes(m.state), 'operations.state is invalid');
  requireValue(handle(m.owner), 'operations.owner requires a GitHub user or team handle');

  const page = shape(m.page, ['route', 'qa'], 'operations.page');
  requireValue(page.route === '/competition-engine.html?competition=' + identity.slug, 'operations.page.route must use the matching shared competition route');
  verification(page.qa, 'operations.page.qa');

  requireValue(Array.isArray(m.sources) && m.sources.length > 0, 'operations.sources requires at least one qualified official source');
  const sourceIds = new Set();
  for (const [index, source] of (Array.isArray(m.sources) ? m.sources : []).entries()) {
    const label = 'operations.sources[' + index + ']';
    const s = shape(source, ['sourceId', 'issuer', 'url', 'format', 'adapterPath', 'parserVersion', 'qualification', 'permissionReview'], label);
    requireValue(stableId(s.sourceId) && !sourceIds.has(s.sourceId), label + '.sourceId requires a unique stable source ID');
    sourceIds.add(s.sourceId);
    requireValue(filled(s.issuer), label + '.issuer is required');
    requireValue(publicURL(s.url), label + '.url requires an official public HTTPS URL without credentials');
    requireValue(['html', 'json', 'rss', 'pdf-text', 'pdf-scan', 'xlsx', 'xls', 'image', 'hwp', 'hwpx'].includes(s.format), label + '.format is required');
    requireValue(existingFile(s.adapterPath, repoRoot) && /\.(?:py|cjs|mjs|js)$/.test(s.adapterPath), label + '.adapterPath requires an existing source adapter');
    requireValue(typeof s.parserVersion === 'string' && /^(?:v?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?|git:[a-f0-9]{40})$/.test(s.parserVersion), label + '.parserVersion requires an exact version or git:commit');
    verification(s.qualification, label + '.qualification');
    verification(s.permissionReview, label + '.permissionReview');
  }

  const master = shape(m.master, ['spreadsheetId', 'sheetId', 'tabTitle', 'writeRange', 'permissionReview', 'writeReadback'], 'operations.master');
  requireValue(googleId(master.spreadsheetId), 'operations.master.spreadsheetId requires the exact Google spreadsheet ID');
  requireValue(Number.isSafeInteger(master.sheetId) && master.sheetId >= 0, 'operations.master.sheetId requires the exact numeric sheet ID');
  requireValue(filled(master.tabTitle) && !/[\u0000-\u001f]/.test(master.tabTitle), 'operations.master.tabTitle is required');
  requireValue(boundedRange(master.writeRange), 'operations.master.writeRange requires a bounded A1 cell range in that tab');
  verification(master.permissionReview, 'operations.master.permissionReview');
  verification(master.writeReadback, 'operations.master.writeReadback');

  const automation = shape(m.automation, ['enabled', 'workflowPath', 'startDate', 'endDate', 'timezone', 'intervalMinutes', 'integration', 'endGuard'], 'operations.automation');
  requireValue(typeof automation.enabled === 'boolean', 'operations.automation.enabled must be boolean');
  requireValue(automation.enabled === (m.state === 'ACTIVE'), 'only an ACTIVE operations state may enable automation');
  requireValue(existingFile(automation.workflowPath, repoRoot) && /^\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml$/.test(automation.workflowPath), 'operations.automation.workflowPath requires an existing GitHub workflow');
  requireValue(dateOnly(automation.startDate), 'operations.automation.startDate requires YYYY-MM-DD');
  requireValue(dateOnly(automation.endDate), 'operations.automation.endDate requires YYYY-MM-DD');
  if (dateOnly(automation.startDate) && dateOnly(automation.endDate)) requireValue(automation.startDate <= automation.endDate, 'operations.automation.endDate must not precede startDate');
  let timezoneValid = false;
  if (text(automation.timezone)) {
    try { new Intl.DateTimeFormat('en-US', {timeZone: automation.timezone}).format(new Date(0)); timezoneValid = true; } catch { /* validation message below */ }
  }
  requireValue(timezoneValid, 'operations.automation.timezone requires an IANA timezone');
  requireValue(Number.isSafeInteger(automation.intervalMinutes) && automation.intervalMinutes >= 5, 'operations.automation.intervalMinutes requires an explicit interval of at least 5 minutes');
  verification(automation.integration, 'operations.automation.integration');
  verification(automation.endGuard, 'operations.automation.endGuard');

  const archive = shape(m.archive, ['driveFolderId', 'metadataPath', 'procedurePath', 'graceDays', 'readOnlyAfterArchive', 'versionedCorrections', 'verification'], 'operations.archive');
  requireValue(googleId(archive.driveFolderId), 'operations.archive.driveFolderId requires the verified existing Drive folder');
  requireValue(relativePath(archive.metadataPath) && archive.metadataPath.startsWith('data/archive/') && archive.metadataPath.endsWith('.json') &&
    archive.metadataPath.includes('/' + identity.slug + '/'), 'operations.archive.metadataPath requires a competition-specific JSON path under data/archive/');
  requireValue(existingFile(archive.procedurePath, repoRoot) && /\.md$/.test(archive.procedurePath), 'operations.archive.procedurePath requires an existing archive procedure');
  requireValue(Number.isSafeInteger(archive.graceDays) && archive.graceDays >= 0, 'operations.archive.graceDays requires an explicit final review period');
  requireValue(archive.readOnlyAfterArchive === true, 'operations.archive.readOnlyAfterArchive must be true');
  requireValue(archive.versionedCorrections === true, 'operations.archive.versionedCorrections must be true');
  verification(archive.verification, 'operations.archive.verification');

  if (readyToActivate) {
    requireValue(['DRAFT', 'READY_FOR_REVIEW'].includes(m.state) && automation.enabled === false, 'activation review requires DRAFT/READY_FOR_REVIEW with automation disabled');
    if (timezoneValid && dateOnly(automation.endDate)) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone: automation.timezone, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(now).map(part => [part.type, part.value]));
      const today = parts.year + '-' + parts.month + '-' + parts.day;
      requireValue(automation.endDate >= today, 'operations.automation.endDate is over; review finalization instead of activation');
    }
  }
  return errors;
}

function check(directory, options = {}) {
  const read = file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  const manifest = read('operations.json');
  const errors = validate(manifest, {...options, config: read('config.json'), slug: path.basename(path.resolve(directory))});
  if (errors.length) throw Error(errors.join('\n'));
  return manifest;
}

module.exports = {validate, check, boundedRange};

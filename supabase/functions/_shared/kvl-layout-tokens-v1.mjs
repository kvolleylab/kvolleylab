/**
 * KVL visual layout draft token contract v1.
 * The browser prototype and server must share this exact allowed field set.
 * Only numeric lengths and predefined enum values are accepted; no CSS strings.
 */
export const TOKEN_RANGES = Object.freeze({
  nameSize:[10,22], logoSize:[26,84], logoX:[-24,24],
  logoY:[-24,24], logoGap:[0,28], tableFont:[11,19],
  rowPad:[3,22], winWidth:[38,100], lossWidth:[38,100],
  winX:[-20,20], lossX:[-20,20], statY:[-15,15],
  heroFont:[20,44]
});
export const TOKEN_ENUMS = Object.freeze({
  nameMode:['natural','two','shrink','one'],
  heroFit:['contain','cover'],
  heroPosition:['center center','left center','right center','70% center']
});
export const FAMILY_KEYS = Object.freeze(['domestic','international','pro']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validSlug(slug) {
  return typeof slug === 'string' && slug.length <= 100 && SLUG.test(slug);
}
export function cleanTokens(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('invalid_tokens');
  if (JSON.stringify(input).length > 8192 || Object.keys(input).length > 20) throw Error('tokens_too_large');
  const cleaned = Object.create(null);
  for (const [key, value] of Object.entries(input)) {
    if (Object.hasOwn(TOKEN_RANGES,key)) {
      const [min,max] = TOKEN_RANGES[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw Error('invalid_token_'+key);
      cleaned[key] = value;
    } else if (Object.hasOwn(TOKEN_ENUMS,key)) {
      if (typeof value !== 'string' || !TOKEN_ENUMS[key].includes(value)) throw Error('invalid_token_'+key);
      cleaned[key] = value;
    } else if (key === 'heroColor') {
      if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw Error('invalid_token_heroColor');
      cleaned[key] = value.toLowerCase();
    } else {
      throw Error('unknown_token_'+key);
    }
  }
  return {...cleaned};
}
export function normalizeScope(scope, scopeKey) {
  if (scope === 'all' && scopeKey === 'all') return {scope, scopeKey};
  if (scope === 'family' && FAMILY_KEYS.includes(scopeKey)) return {scope, scopeKey};
  if (scope === 'competition' && validSlug(scopeKey)) return {scope, scopeKey};
  throw Error('invalid_scope');
}
export function fromEditorScope(editorScope, slug) {
  if (editorScope === 'all') return normalizeScope('all','all');
  if (FAMILY_KEYS.includes(editorScope)) return normalizeScope('family',editorScope);
  return normalizeScope('competition',slug);
}
export function toEditorOverrides(records) {
  if (!Array.isArray(records) || records.length > 300) throw Error('invalid_drafts');
  const out = {schemaVersion:2,type:'kvl-visual-overrides',global:{},families:{},competitions:{}};
  for (const record of records) {
    const {scope,scopeKey} = normalizeScope(record.scope,record.scope_key);
    const tokens = cleanTokens(record.tokens);
    if (scope === 'all') out.global = tokens;
    else if (scope === 'family') out.families[scopeKey] = tokens;
    else out.competitions[scopeKey] = tokens;
  }
  return out;
}
export function revisionValue(value) {
  if (value === null) return null; // null means first insert
  if (!Number.isSafeInteger(value) || value < 1) throw Error('invalid_revision');
  return value;
}

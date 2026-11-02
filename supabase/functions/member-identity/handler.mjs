// The live provider remains disabled until the configured channel has been tested
// for the explicit response contract below. Unit mocks do not establish that contract.
export const IDENTITY_CONTRACT = 'customer-id-and-channel-v1';
const ID = /^[a-zA-Z0-9]{32}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const messages = Object.freeze({
  identity_disabled: '본인확인 연결과 실제 검증을 마친 뒤 이용할 수 있습니다.',
  origin_not_allowed: '이 화면에서는 본인확인을 요청할 수 없습니다.',
  method_not_allowed: '허용되지 않은 요청 방식입니다.',
  invalid_request: '본인확인 요청 형식이 올바르지 않습니다.',
  sign_in_required: '유효한 로그인 세션이 필요합니다. 다시 로그인해 주세요.',
  request_unavailable: '본인확인 요청이 만료되었거나 이미 사용되었습니다. 새로 시작해 주세요.',
  identity_request_rejected: '본인확인을 시작할 수 없습니다. 현재 회원 상태를 다시 확인해 주세요.',
  identity_not_verified: '본인확인이 완료되지 않았습니다.',
  identity_contract_mismatch: '본인확인 결과를 안전하게 확인하지 못했습니다. 운영자 확인이 필요합니다.',
  upstream_unavailable: '인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  identity_saved_refresh_required: '본인확인은 저장되었습니다. 다시 로그인하여 회원 상태를 확인해 주세요.',
  internal_error: '본인확인 요청을 처리하지 못했습니다.',
});

class SafeError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
const fail = (status, code) => { throw new SafeError(status, code); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const timestamp = value => typeof value === 'string' && RFC3339.test(value) ? Date.parse(value) : NaN;

async function readJsonLimited(message, limit, code = 'invalid_request', status = 400) {
  if (!message.body) fail(status, code);
  const reader = message.body.getReader();
  const parts = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); fail(status, code); }
      parts.push(value);
    }
    const joined = new Uint8Array(length); let offset = 0;
    for (const part of parts) { joined.set(part, offset); offset += part.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(joined));
  } catch (error) {
    if (error instanceof SafeError) throw error;
    fail(status, code);
  } finally { reader.releaseLock(); }
}

function readConfig(env) {
  const get = name => typeof env === 'function' ? env(name) : env[name];
  const origins = new Set(String(get('KVL_ALLOWED_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean));
  const config = {
    enabled: get('KVL_IDENTITY_ENABLED') === 'true' && get('KVL_IDENTITY_CONTRACT') === IDENTITY_CONTRACT,
    url: get('SUPABASE_URL'), publicKey: get('SUPABASE_PUBLISHABLE_KEY') || get('SUPABASE_ANON_KEY'),
    serviceKey: get('SUPABASE_SERVICE_ROLE_KEY'), secret: get('PORTONE_API_SECRET'),
    storeId: get('PORTONE_STORE_ID'), channelKey: get('PORTONE_CHANNEL_KEY'), origins,
  };
  try {
    const url = new URL(config.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) config.enabled = false;
    config.url = url.origin;
    if (!origins.size || [...origins].some(value => new URL(value).origin !== value || !value.startsWith('https://'))) config.enabled = false;
  } catch { config.enabled = false; }
  if (![config.publicKey, config.serviceKey, config.secret, config.storeId, config.channelKey].every(v => typeof v === 'string' && v.trim().length)) config.enabled = false;
  return config;
}

function decodeValidatedClaims(token, user, now) {
  // The token has already been checked by GET /auth/v1/user. Decoding alone is never authentication.
  try {
    const segments = token.split('.');
    if (segments.length !== 3) fail(401, 'sign_in_required');
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), c => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (!object(user) || !UUID.test(user.id || '') || user.is_anonymous === true || claims.sub !== user.id
      || claims.role !== 'authenticated' || claims.is_anonymous === true || !UUID.test(claims.session_id || '')
      || !Number.isInteger(claims.exp) || claims.exp * 1000 <= now()) fail(401, 'sign_in_required');
    return { userId: user.id, sessionId: claims.session_id, expiresAt: claims.exp * 1000 };
  } catch { fail(401, 'sign_in_required'); }
}

function validatePending(value, config, now, expectedId) {
  if (!object(value) || !ID.test(value.identityVerificationId || '') || !ID.test(value.customerId || '')
    || value.identityVerificationId !== expectedId || value.storeId !== config.storeId || value.channelKey !== config.channelKey)
    fail(409, 'request_unavailable');
  const created = timestamp(value.createdAt), expires = timestamp(value.expiresAt);
  if (!Number.isFinite(created) || !Number.isFinite(expires) || created > now() + 30000 || expires <= now()
    || expires <= created || expires - created > 600001) fail(409, 'request_unavailable');
  return { ...value, created, expires };
}

export function validatePortOneResult(value, pending, now) {
  if (!object(value) || value.status !== 'VERIFIED') fail(409, 'identity_not_verified');
  const customer = value.verifiedCustomer;
  const verified = timestamp(value.verifiedAt), requested = timestamp(value.requestedAt);
  const name = typeof customer?.name === 'string' ? customer.name.trim() : '';
  // Both echo fields are optional in PortOne's generic API. This opt-in contract
  // intentionally fails closed if this channel does not return them. Store scope is
  // the server's GET query, not a non-existent top-level response.storeId property.
  if (value.id !== pending.identityVerificationId || value.channel?.type !== 'LIVE'
    || value.channel?.key !== pending.channelKey || customer?.id !== pending.customerId
    || !name || [...name].length > 80 || /[\u0000-\u001f\u007f-\u009f]/u.test(name)
    || !Number.isFinite(verified) || !Number.isFinite(requested)
    || requested < pending.created - 5000 || requested > pending.expires
    || verified < requested || verified < pending.created - 5000
    || verified > pending.expires || verified > now() + 30000) fail(409, 'identity_contract_mismatch');
  return { name, verifiedAt: value.verifiedAt };
}

function profileForResponse(value, userId) {
  const keys = ['user_id', 'nickname', 'real_name', 'publish_real_name', 'identity_verified',
    'public_author_name', 'name_source', 'benefits_active', 'onboarding_ready'];
  if (!object(value) || value.user_id !== userId || value.identity_verified !== true
    || typeof value.nickname !== 'string' || typeof value.real_name !== 'string'
    || typeof value.public_author_name !== 'string' || typeof value.publish_real_name !== 'boolean'
    || typeof value.onboarding_ready !== 'boolean' || !['nickname', 'self_entered', 'verified'].includes(value.name_source)
    || value.benefits_active !== false) fail(409, 'identity_saved_refresh_required');
  return Object.fromEntries(keys.map(key => [key, value[key]]));
}

export function createMemberIdentityHandler({ env = {}, fetcher = globalThis.fetch, randomUUID = () => globalThis.crypto.randomUUID(), now = () => Date.now() } = {}) {
  const config = readConfig(env);
  // Native browser/runtime methods require their original receiver.
  const fetchJson = typeof fetcher === 'function' ? fetcher.bind(globalThis) : null;
  const reply = (status, value, origin) => new Response(status === 204 ? null : JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Pragma': 'no-cache',
      'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff',
      ...(origin && config.origins.has(origin) ? {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      } : {}),
    },
  });

  const call = async (url, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetchJson(url, { ...init, redirect: 'error', cache: 'no-store', signal: controller.signal });
      if (!response.ok) {
        try { await response.body?.cancel(); } catch { /* Never echo an upstream error payload. */ }
        return { ok: false, status: response.status };
      }
      return { ok: true, data: await readJsonLimited(response, 65536, 'upstream_unavailable', 502) };
    } catch (error) {
      if (error instanceof SafeError) throw error;
      fail(502, 'upstream_unavailable');
    } finally { clearTimeout(timer); }
  };
  const rpc = (name, body, token, service = false) => call(`${config.url}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: service ? config.serviceKey : config.publicKey,
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  return async function memberIdentity(request) {
    const origin = request.headers.get('origin');
    try {
      if (origin && !config.origins.has(origin)) fail(403, 'origin_not_allowed');
      if (request.method === 'OPTIONS') return reply(204, null, origin);
      if (request.method !== 'POST') fail(405, 'method_not_allowed');
      if (!config.enabled || !fetchJson) fail(503, 'identity_disabled');
      const authorization = request.headers.get('authorization') || '';
      if (authorization.length > 16384 || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)) fail(401, 'sign_in_required');
      const token = authorization.slice(7);
      if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) fail(400, 'invalid_request');
      const input = await readJsonLimited(request, 2048);
      if (!object(input) || !['start', 'complete'].includes(input.action)) fail(400, 'invalid_request');
      const allowed = input.action === 'start' ? ['action'] : ['action', 'identityVerificationId'];
      if (Object.keys(input).some(key => !allowed.includes(key)) || (input.action === 'complete' && !ID.test(input.identityVerificationId || ''))) fail(400, 'invalid_request');

      const userResult = await call(`${config.url}/auth/v1/user`, { method: 'GET', headers: { apikey: config.publicKey, Authorization: `Bearer ${token}` } });
      if (!userResult.ok) fail(userResult.status >= 500 ? 502 : 401, userResult.status >= 500 ? 'upstream_unavailable' : 'sign_in_required');
      const auth = decodeValidatedClaims(token, userResult.data, now);
      const session = await rpc('kvl_onboarding_session_active', {}, token);
      if (!session.ok || session.data !== true) fail(401, 'sign_in_required');
      const binding = { p_user_id: auth.userId, p_session_id: auth.sessionId };

      if (input.action === 'start') {
        const requestId = randomUUID().replace(/-/g, ''), customerId = randomUUID().replace(/-/g, '');
        if (!ID.test(requestId) || !ID.test(customerId) || requestId === customerId) fail(500, 'internal_error');
        if (auth.expiresAt <= now()) fail(401, 'sign_in_required');
        const started = await rpc('kvl_identity_begin', { ...binding, p_verification_id: requestId,
          p_customer_id: customerId, p_store_id: config.storeId, p_channel_key: config.channelKey }, config.serviceKey, true);
        if (!started.ok) fail(409, 'identity_request_rejected');
        const pending = validatePending(started.data, config, now, requestId);
        if (pending.customerId !== customerId) fail(409, 'identity_contract_mismatch');
        return reply(200, { identityVerificationId: requestId, storeId: config.storeId, channelKey: config.channelKey,
          customer: { customerId }, expiresAt: pending.expiresAt }, origin);
      }

      const stored = await rpc('kvl_identity_get_request', { ...binding, p_verification_id: input.identityVerificationId }, config.serviceKey, true);
      if (!stored.ok) fail(409, 'request_unavailable');
      const pending = validatePending(stored.data, config, now, input.identityVerificationId);
      const providerUrl = new URL(`https://api.portone.io/identity-verifications/${encodeURIComponent(pending.identityVerificationId)}`);
      providerUrl.searchParams.set('storeId', config.storeId);
      const result = await call(providerUrl.href, { method: 'GET', headers: { Authorization: `PortOne ${config.secret}` } });
      if (!result.ok) fail(502, 'upstream_unavailable');
      const verified = validatePortOneResult(result.data, pending, now);
      if (auth.expiresAt <= now()) fail(401, 'sign_in_required');
      const consumed = await rpc('kvl_identity_consume', { ...binding, p_verification_id: pending.identityVerificationId,
        p_customer_id: pending.customerId, p_store_id: config.storeId, p_channel_key: config.channelKey,
        p_verified_name: verified.name, p_verified_at: verified.verifiedAt }, config.serviceKey, true);
      if (!consumed.ok || consumed.data?.identity_verified !== true) fail(409, 'request_unavailable');
      let profile;
      try {
        const current = await rpc('kvl_member_get_self', {}, token);
        if (!current.ok) fail(409, 'identity_saved_refresh_required');
        profile = profileForResponse(current.data, auth.userId);
      } catch { fail(409, 'identity_saved_refresh_required'); }
      return reply(200, { identity_verified: true, profile }, origin);
    } catch (error) {
      const safe = error instanceof SafeError ? error : new SafeError(500, 'internal_error');
      return reply(safe.status, { code: safe.code, message: messages[safe.code] }, origin);
    }
  };
}

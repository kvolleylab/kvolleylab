import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemberIdentityHandler, IDENTITY_CONTRACT } from '../supabase/functions/member-identity/handler.mjs';

// All fetches, Auth results, timestamps, and PortOne records below are explicit
// fixtures. These tests do not send an SMS or establish a hosted provider contract.
const NOW = Date.parse('2026-11-02T15:00:00Z');
const ORIGIN = 'https://members-test.example';
const UID = '11111111-1111-4111-8111-111111111111';
const SID = '22222222-2222-4222-8222-222222222222';
const UUIDS = ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'];
const RID = UUIDS[0].replaceAll('-', ''), CID = UUIDS[1].replaceAll('-', '');
const ENV = {
  KVL_IDENTITY_ENABLED: 'true', KVL_IDENTITY_CONTRACT: IDENTITY_CONTRACT, KVL_ALLOWED_ORIGINS: ORIGIN,
  SUPABASE_URL: 'https://project-test.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'unit-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'unit-server-key', PORTONE_API_SECRET: 'unit-portone-secret',
  PORTONE_STORE_ID: 'store-test', PORTONE_CHANNEL_KEY: 'channel-test',
};
const token = (extra = {}) => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({
  sub: UID, session_id: SID, role: 'authenticated', is_anonymous: false, exp: NOW / 1000 + 3600, ...extra,
})).toString('base64url'), 'unit-signature'].join('.');
const pending = () => ({ identityVerificationId: RID, customerId: CID, storeId: ENV.PORTONE_STORE_ID,
  channelKey: ENV.PORTONE_CHANNEL_KEY, createdAt: new Date(NOW).toISOString(), expiresAt: new Date(NOW + 600000).toISOString() });
const provider = () => ({ status: 'VERIFIED', id: RID, channel: { type: 'LIVE', key: ENV.PORTONE_CHANNEL_KEY },
  verifiedCustomer: { id: CID, name: '확인된 이름' }, requestedAt: new Date(NOW).toISOString(), verifiedAt: new Date(NOW + 1000).toISOString() });
const profile = () => ({ user_id: UID, nickname: '', real_name: '확인된 이름', publish_real_name: false,
  identity_verified: true, public_author_name: '', name_source: 'nickname', benefits_active: false, onboarding_ready: false });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

function fixture(options = {}) {
  let uuidCount = 0, consumed = false;
  let currentTime = NOW;
  const calls = [];
  const handler = createMemberIdentityHandler({ env: { ...ENV, ...options.env }, now: () => currentTime,
    randomUUID: () => UUIDS[uuidCount++],
    fetcher: async function(url, init) {
      // Regression for storing native fetch then calling it with the wrong receiver.
      assert.equal(this, globalThis);
      const path = new URL(url).pathname;
      const body = init.body ? JSON.parse(init.body) : null;
      calls.push({ url, path, init, body });
      assert.equal(init.redirect, 'error');
      assert.equal(init.cache, 'no-store');
      if (options.networkError) throw new Error(`upstream details must not leak ${ENV.PORTONE_API_SECRET}`);
      if (path === '/auth/v1/user') return json(options.user || { id: UID, is_anonymous: false }, options.authStatus || 200);
      if (path.endsWith('/kvl_onboarding_session_active')) return json(options.sessionActive ?? true);
      if (path.endsWith('/kvl_identity_begin')) return json(options.started || pending(), options.startStatus || 200);
      if (path.endsWith('/kvl_identity_get_request')) return json(options.pending || pending(), options.pendingStatus || 200);
      if (path.startsWith('/identity-verifications/')) {
        if (options.advanceAfterProvider) currentTime += options.advanceAfterProvider;
        if (options.providerRaw) return new Response(options.providerRaw, { status: 200 });
        return json(options.provider || provider(), options.providerStatus || 200);
      }
      if (path.endsWith('/kvl_identity_consume')) {
        if (consumed || options.consumeStatus) return json({ detail: ENV.PORTONE_API_SECRET }, options.consumeStatus || 409);
        consumed = true;
        return json({ identity_verified: true });
      }
      if (path.endsWith('/kvl_member_get_self')) return json(options.profile || profile(), options.profileStatus || 200);
      throw new Error(`Unexpected fixture endpoint ${path}`);
    },
  });
  const invoke = async (body = { action: 'start' }, overrides = {}) => {
    const request = new Request('https://project-test.supabase.co/functions/v1/member-identity', {
      method: overrides.method || 'POST', headers: { origin: ORIGIN, authorization: `Bearer ${token()}`,
        'content-type': 'application/json', ...overrides.headers },
      ...(!['OPTIONS', 'GET'].includes(overrides.method) ? { body: overrides.rawBody ?? JSON.stringify(body) } : {}),
    });
    const response = await handler(request);
    return { response, body: response.status === 204 ? null : await response.json() };
  };
  return { calls, invoke };
}

test('identity handler is disabled unless every required setting and tested contract gate is present', async () => {
  for (const env of [
    { KVL_IDENTITY_ENABLED: 'false' }, { KVL_IDENTITY_CONTRACT: '' }, { KVL_IDENTITY_CONTRACT: 'untested' },
    { SUPABASE_URL: '' }, { SUPABASE_URL: 'http://untrusted.example' }, { SUPABASE_URL: 'https://example.test/path' },
    { SUPABASE_SERVICE_ROLE_KEY: '' }, { PORTONE_API_SECRET: '' }, { PORTONE_STORE_ID: '' }, { PORTONE_CHANNEL_KEY: '' },
  ]) {
    const { calls, invoke } = fixture({ env });
    const { response, body } = await invoke();
    assert.equal(response.status, 503);
    assert.equal(body.code, 'identity_disabled');
    assert.equal(calls.length, 0);
  }
});

test('exact origin checks, preflight, content type, and bounded strict request bodies', async () => {
  const f = fixture();
  assert.equal((await f.invoke({}, { headers: { origin: 'https://evil.example' } })).response.status, 403);
  assert.equal((await f.invoke({}, { headers: { origin: 'null' } })).response.status, 403);
  const preflight = await f.invoke({}, { method: 'OPTIONS' });
  assert.equal(preflight.response.status, 204);
  assert.equal(preflight.response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal((await f.invoke({}, { method: 'GET' })).response.status, 405);
  assert.equal((await f.invoke({}, { headers: { 'content-type': 'text/plain' } })).response.status, 400);
  for (const body of [null, [], { action: 'unknown' }, { action: 'start', user_id: UID }, { action: 'start', verified: true },
    { action: 'complete', identityVerificationId: RID, name: 'forged' }, { action: 'complete', identityVerificationId: '../other' },
    { action: 'complete', identityVerificationId: 'x'.repeat(33) }]) assert.equal((await f.invoke(body)).response.status, 400);
  assert.equal((await f.invoke({}, { rawBody: '{invalid' })).response.status, 400);
  assert.equal((await f.invoke({}, { rawBody: JSON.stringify({ action: 'start', padding: 'x'.repeat(3000) }) })).response.status, 400);
  assert.equal(f.calls.length, 0);
});

test('bearer is verified server-side and persisted active-session status is required', async () => {
  const f = fixture();
  assert.equal((await f.invoke({}, { headers: { authorization: '' } })).response.status, 401);
  assert.equal(f.calls.length, 0);
  for (const options of [{ authStatus: 401 }, { sessionActive: false }, { user: { id: UUIDS[0], is_anonymous: false } }, { user: { id: UID, is_anonymous: true } }]) {
    const next = fixture(options);
    assert.equal((await next.invoke()).response.status, 401);
    assert.equal(next.calls.some(c => c.path.endsWith('/kvl_identity_begin')), false);
  }
  for (const extra of [{ exp: 1 }, { role: 'service_role' }, { is_anonymous: true }, { session_id: 'invalid' }, { sub: UUIDS[0] }]) {
    const next = fixture();
    assert.equal((await next.invoke({ action: 'start' }, { headers: { authorization: `Bearer ${token(extra)}` } })).response.status, 401);
    assert.equal(next.calls.length, 1);
  }
});

test('start binds server-generated identifiers to validated Auth user/session and returns the SDK contract', async () => {
  const f = fixture();
  const { response, body } = await f.invoke();
  assert.equal(response.status, 200);
  assert.deepEqual(body, { identityVerificationId: RID, storeId: 'store-test', channelKey: 'channel-test',
    customer: { customerId: CID }, expiresAt: pending().expiresAt });
  assert.match(body.identityVerificationId, /^[a-zA-Z0-9]{32}$/);
  const start = f.calls.find(c => c.path.endsWith('/kvl_identity_begin'));
  assert.deepEqual(start.body, { p_user_id: UID, p_session_id: SID, p_verification_id: RID,
    p_customer_id: CID, p_store_id: 'store-test', p_channel_key: 'channel-test' });
  assert.equal(start.init.headers.Authorization, `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
  assert.equal(f.calls[0].init.headers.Authorization, `Bearer ${token()}`);
  assert.equal(f.calls.some(c => c.url.includes('portone.io')), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(JSON.stringify(body).includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
});

test('start rejects unexpected database binding and expired request responses', async () => {
  for (const changes of [{ customerId: RID }, { identityVerificationId: CID }, { channelKey: 'other' }, { expiresAt: new Date(NOW - 1).toISOString() }]) {
    const f = fixture({ started: { ...pending(), ...changes } });
    assert.equal((await f.invoke()).response.status, 409);
  }
});

test('complete first retrieves the request scoped to this user/session, preventing cross-account lookup', async () => {
  for (const options of [{ pendingStatus: 403 }, { pending: { ...pending(), storeId: 'other-store' } },
    { pending: { ...pending(), identityVerificationId: CID } }, { pending: { ...pending(), expiresAt: new Date(NOW - 1).toISOString() } }]) {
    const f = fixture(options);
    assert.equal((await f.invoke({ action: 'complete', identityVerificationId: RID })).response.status, 409);
    assert.equal(f.calls.some(c => c.url.includes('portone.io')), false);
    assert.deepEqual(f.calls.find(c => c.path.endsWith('/kvl_identity_get_request')).body,
      { p_user_id: UID, p_session_id: SID, p_verification_id: RID });
  }
});

test('PortOne lookup uses the exact server-scoped GET contract without leaking the user token', async () => {
  const f = fixture();
  const { response, body } = await f.invoke({ action: 'complete', identityVerificationId: RID });
  assert.equal(response.status, 200);
  const call = f.calls.find(c => c.url.includes('portone.io'));
  assert.equal(call.url, `https://api.portone.io/identity-verifications/${RID}?storeId=store-test`);
  assert.equal(call.init.method, 'GET');
  assert.equal(call.init.body, undefined);
  assert.deepEqual(call.init.headers, { Authorization: `PortOne ${ENV.PORTONE_API_SECRET}` });
  assert.equal(JSON.stringify(call).includes(token()), false);
  const consumed = f.calls.find(c => c.path.endsWith('/kvl_identity_consume'));
  assert.equal(consumed.body.p_verified_name, '확인된 이름');
  assert.equal(consumed.body.p_verified_at, provider().verifiedAt);
  assert.deepEqual(body, { identity_verified: true, profile: profile() });
  assert.equal(body.profile.onboarding_ready, false, 'identity-first completion is not a finished member profile');
  assert.equal(body.profile.benefits_active, false);
});

test('provider results require VERIFIED, exact id, live channel, exact customer echo, safe name, and request-bound timestamps', async () => {
  const bad = [
    { status: 'FAILED' }, { status: 'READY' }, { id: CID }, { channel: { type: 'TEST', key: 'channel-test' } },
    { channel: { type: 'LIVE', key: 'wrong-channel' } }, { channel: { type: 'LIVE' } }, { channel: null },
    { verifiedCustomer: { name: '정상' } }, { verifiedCustomer: { id: RID, name: '정상' } },
    { verifiedCustomer: { id: CID, name: '' } }, { verifiedCustomer: { id: CID, name: 'x'.repeat(81) } },
    { verifiedCustomer: { id: CID, name: '개\n행' } }, { verifiedAt: null }, { verifiedAt: 'not-a-date' },
    { verifiedAt: new Date(NOW - 60000).toISOString() }, { verifiedAt: new Date(NOW + 6000000).toISOString() },
    { requestedAt: new Date(NOW - 60000).toISOString() }, { requestedAt: new Date(NOW + 2000).toISOString() },
  ];
  for (const changes of bad) {
    const f = fixture({ provider: { ...provider(), ...changes } });
    const result = await f.invoke({ action: 'complete', identityVerificationId: RID });
    assert.equal(result.response.status, 409, JSON.stringify(changes));
    assert.equal(f.calls.some(c => c.path.endsWith('/kvl_identity_consume')), false, JSON.stringify(changes));
  }
});

test('provider optional fields are not claimed to be universally supported, and contract-gated missing echoes fail closed', async () => {
  const value = provider();
  delete value.verifiedCustomer.id;
  delete value.channel.key;
  assert.equal(Object.hasOwn(provider(), 'storeId'), false, 'official response has no top-level storeId');
  const f = fixture({ provider: value });
  const { body } = await f.invoke({ action: 'complete', identityVerificationId: RID });
  assert.equal(body.code, 'identity_contract_mismatch');
  assert.equal(f.calls.some(c => c.path.endsWith('/kvl_identity_consume')), false);
});

test('token expiry during provider lookup and database revocation/replay rejection cannot mark a member verified', async () => {
  const expiry = fixture({ advanceAfterProvider: 3601000 });
  assert.equal((await expiry.invoke({ action: 'complete', identityVerificationId: RID })).response.status, 401);
  assert.equal(expiry.calls.some(c => c.path.endsWith('/kvl_identity_consume')), false);
  const revoked = fixture({ consumeStatus: 403 });
  const result = await revoked.invoke({ action: 'complete', identityVerificationId: RID });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.identity_verified, undefined);
  assert.equal(revoked.calls.some(c => c.path.endsWith('/kvl_member_get_self')), false);
});

test('only one concurrent completion can consume the request; the replay response contains no verified flag', async () => {
  const f = fixture();
  const results = await Promise.all([f.invoke({ action: 'complete', identityVerificationId: RID }), f.invoke({ action: 'complete', identityVerificationId: RID })]);
  assert.deepEqual(results.map(r => r.response.status).sort(), [200, 409]);
  assert.equal(results.filter(r => r.body.identity_verified === true).length, 1);
});

test('saved identity followed by failed profile read reports refresh-needed, with no leaked private payload', async () => {
  const f = fixture({ profileStatus: 401 });
  const { response, body } = await f.invoke({ action: 'complete', identityVerificationId: RID });
  assert.equal(response.status, 409);
  assert.equal(body.code, 'identity_saved_refresh_required');
  assert.equal(body.profile, undefined);
});

test('completion response whitelists profile fields and refuses a forged benefit flag or different member', async () => {
  const extra = fixture({ profile: { ...profile(), secret_email: 'not-for-client@example.test', private_audit: 'do not expose' } });
  const result = await extra.invoke({ action: 'complete', identityVerificationId: RID });
  assert.deepEqual(result.body.profile, profile());
  for (const changes of [{ user_id: UUIDS[0] }, { benefits_active: true }, { identity_verified: false }]) {
    const f = fixture({ profile: { ...profile(), ...changes } });
    assert.equal((await f.invoke({ action: 'complete', identityVerificationId: RID })).body.code, 'identity_saved_refresh_required');
  }
});

test('network, malformed upstream JSON, and oversized responses are safe errors without credentials or raw provider details', async () => {
  for (const options of [{ networkError: true }, { providerStatus: 500 }, { providerRaw: '{broken' },
    { providerRaw: JSON.stringify({ raw: 'x'.repeat(70000) }) }]) {
    const f = fixture(options);
    const { response, body } = await f.invoke({ action: 'complete', identityVerificationId: RID });
    assert.equal(response.status, 502);
    const output = JSON.stringify(body);
    assert.equal(output.includes(ENV.PORTONE_API_SECRET), false);
    assert.equal(output.includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
    assert.equal(output.includes(token()), false);
    assert.equal(f.calls.some(c => c.path.endsWith('/kvl_identity_consume')), false);
  }
});

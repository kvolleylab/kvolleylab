import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemberController, validateConfig } from '../prototypes/member-onboarding-v1/client.mjs';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const liveConfig = { enabled: true, projectUrl: 'https://exampleproject.supabase.co',
  publishableKey: 'sb_publishable_testfixtureonly123456789', emailEnabled: true,
  kakaoEnabled: true, identityEnabled: true, identityFunction: 'member-identity' };
const baseProfile = { user_id: A, nickname: '회원가', real_name: '예시이름', publish_real_name: false,
  identity_verified: false, public_author_name: '회원가', name_source: 'self_entered',
  benefits_active: false, onboarding_ready: false };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function fixture(settings = {}) {
  const calls = [];
  const storage = settings.storage ?? new Map();
  const events = new Map();
  let user = settings.user === undefined ? { id: A } : settings.user;
  let profile = { ...baseProfile, ...settings.profile };
  let authCallback;
  const browser = {
    location: { href: settings.href ?? 'https://members.example/index.html' },
    history: { replaceState(_, __, path) { browser.location.href = new URL(path, browser.location.href).href; } },
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    addEventListener: (name, fn) => events.set(name, fn),
  };
  const client = {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange(fn) { authCallback = fn; return { data: { subscription: { unsubscribe() {} } } }; },
      signInWithOtp: async args => { calls.push(['email', args]); return { data: { user: null, session: null }, error: settings.emailError }; },
      signInWithOAuth: async args => { calls.push(['kakao', args]); return { data: {}, error: null }; },
      exchangeCodeForSession: async code => { calls.push(['exchange', code]); return { error: settings.callbackError }; },
      verifyOtp: async args => { calls.push(['verifyOtp', args]); return { error: settings.callbackError }; },
      signOut: async args => {
        calls.push(['signOut', args]);
        if (settings.signOutError) return { error: new Error('offline') };
        user = null; authCallback?.('SIGNED_OUT', null); return { error: null };
      },
    },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (settings.rpc) { const override = await settings.rpc(name, args); if (override) return override; }
      if (name === 'kvl_onboarding_session_active') return { data: settings.active !== false, error: null };
      if (name === 'kvl_member_save_profile') profile = { ...profile, nickname: args.p_nickname,
        real_name: args.p_real_name, publish_real_name: args.p_publish_real_name };
      return { data: { ...profile }, error: null };
    },
    functions: { invoke: async (name, args) => {
      calls.push(['function', name, args]);
      if (settings.invoke) return settings.invoke(name, args);
      return { data: { identityVerificationId: 'a'.repeat(32), storeId: 'store-fixture',
        channelKey: 'channel-fixture', customer: { customerId: 'customer-fixture' } }, error: null };
    } },
  };
  let sdkLoads = 0, popups = 0;
  const controller = createMemberController({ config: settings.config ?? liveConfig, browser,
    callbackUrl: 'https://members.example/index.html',
    makeClient: async () => { calls.push(['makeClient']); return client; },
    loadPortOne: async () => {
      sdkLoads++;
      if (settings.sdkWait) await settings.sdkWait;
      return { requestIdentityVerification: async () => { popups++; return settings.popupResult ?? { identityVerificationId: 'a'.repeat(32) }; } };
    },
  });
  return { controller, client, calls, storage, browser, events, get sdkLoads() { return sdkLoads; },
    get popups() { return popups; }, changeUser(next) { user = next; profile.user_id = next?.id; authCallback?.('SIGNED_IN', { user }); } };
}

test('unconfigured preview never creates an auth client, sends a message, or grants verification/benefits', async () => {
  const f = fixture({ config: { enabled: false } });
  await f.controller.start();
  assert.equal(f.controller.getState().mode, 'unconfigured');
  assert.equal(await f.controller.sendEmail('preview@example.invalid'), false);
  f.controller.enterPreview();
  await f.controller.saveProfile({ nickname: '작성자예시', realName: '예시실명', publishRealName: true, identity_verified: true });
  assert.equal(f.controller.getState().profile.public_author_name, '예시실명');
  assert.equal(f.controller.getState().profile.identity_verified, false);
  assert.equal(f.controller.getState().profile.benefits_active, false);
  assert.equal(await f.controller.verifyIdentity(), false);
  assert.equal(f.calls.length, 0); assert.equal(f.storage.size, 0);
  f.controller.exitPreview(); assert.equal(f.controller.getState().profile, null);
});

test('configuration rejects secret/legacy keys, non-project domains, credentials and URL suffixes', () => {
  for (const patch of [{ publishableKey: 'sb_secret_secretvalue' }, { publishableKey: 'eyJhbGc.legacy.jwt' },
    { projectUrl: 'https://exampleproject.supabase.co.attacker.invalid' }, { projectUrl: 'http://exampleproject.supabase.co' },
    { projectUrl: 'https://secret@exampleproject.supabase.co' }, { projectUrl: 'https://exampleproject.supabase.co/path' },
    { identityFunction: 'unrelated-function' }]) assert.throws(() => validateConfig({ ...liveConfig, ...patch }));
  assert.equal(validateConfig(liveConfig).projectUrl, 'https://exampleproject.supabase.co');
});

test('config fetch retains the browser fetch receiver', async () => {
  let calls = 0;
  const controller = createMemberController({ fetcher: function () {
    assert.equal(this, globalThis); calls++; return Promise.resolve({ ok: true, json: async () => ({ enabled: false }) });
  } });
  await controller.start(); assert.equal(calls, 1);
});

test('email request is not login success, has a fixed callback, and throttles duplicate requests', async () => {
  const f = fixture({ user: null }); await f.controller.start();
  assert.equal(await f.controller.sendEmail('user@example.invalid'), true);
  assert.equal(f.controller.getState().status, 'email_sent'); assert.equal(f.controller.getState().profile, null);
  const args = f.calls.find(c => c[0] === 'email')[1];
  assert.deepEqual(args, { email: 'user@example.invalid', options: { emailRedirectTo: 'https://members.example/index.html', shouldCreateUser: true } });
  assert.equal(await f.controller.sendEmail('user@example.invalid'), false);
  assert.equal(f.calls.filter(c => c[0] === 'email').length, 1);
});

test('Kakao uses provider OAuth and never derives a member identity from an email address', async () => {
  const f = fixture({ user: null }); await f.controller.start(); await f.controller.loginKakao();
  assert.deepEqual(f.calls.find(c => c[0] === 'kakao')[1], { provider: 'kakao', options: { redirectTo: 'https://members.example/index.html' } });
  assert.equal(f.controller.getState().profile, null);
});

test('PKCE code and token-hash callbacks are exchanged once through the correct API and removed from URL', async () => {
  const f = fixture({ href: 'https://members.example/index.html?code=fixture-code' }); await f.controller.start(); await f.controller.start();
  assert.equal(f.calls.filter(c => c[0] === 'exchange').length, 1);
  assert.equal(f.browser.location.href, 'https://members.example/index.html');
  const g = fixture({ href: 'https://members.example/index.html?token_hash=fixture-hash&type=email' }); await g.controller.start();
  assert.deepEqual(g.calls.find(c => c[0] === 'verifyOtp')[1], { token_hash: 'fixture-hash', type: 'email' });
  assert.equal(g.calls.filter(c => c[0] === 'exchange').length, 0);
});

test('ambiguous or unsupported callback values cannot establish a UI session', async () => {
  for (const suffix of ['?code=x&token_hash=y&type=email', '?token_hash=y&type=recovery', '#access_token=x&refresh_token=y']) {
    const f = fixture({ href: 'https://members.example/index.html' + suffix }); await f.controller.start();
    assert.equal(f.controller.getState().profile, null); assert.ok(f.controller.getState().error);
    assert.equal(f.calls.filter(c => c[0] === 'exchange' || c[0] === 'verifyOtp').length, 0);
    assert.equal(f.browser.location.href, 'https://members.example/index.html');
  }
});

test('revoked or foreign-user server profiles never reach the UI', async () => {
  for (const setting of [{ active: false }, { profile: { user_id: B } }]) {
    const f = fixture(setting); await f.controller.start(); assert.equal(f.controller.getState().profile, null);
  }
});

test('profile update contains only permitted fields and a user cannot set verified or benefits flags', async () => {
  const f = fixture(); await f.controller.start();
  await f.controller.saveProfile({ nickname: '수정회원', realName: '직접입력', publishRealName: true, user_id: B, identity_verified: true, benefits_active: true });
  assert.deepEqual(f.calls.find(c => c[0] === 'kvl_member_save_profile')[1], {
    p_nickname: '수정회원', p_real_name: '직접입력', p_publish_real_name: true });
  assert.equal(f.controller.getState().profile.identity_verified, false);
  assert.equal(f.controller.getState().profile.benefits_active, false);
});

test('late profile response cannot restore private information after logout', async () => {
  const wait = deferred(); let delay = false;
  const f = fixture({ rpc: name => name === 'kvl_member_get_self' && delay ? wait.promise : null });
  await f.controller.start(); delay = true;
  const pending = f.controller.refresh();
  await new Promise(r => setTimeout(r, 0)); await f.controller.logout();
  wait.resolve({ data: baseProfile, error: null }); await pending;
  assert.equal(f.controller.getState().profile, null); assert.equal(f.controller.getState().status, 'signed_out');
});

test('failed logout remains cleared on focus/refresh/reload until a fresh login callback succeeds', async () => {
  const f = fixture({ signOutError: true }); await f.controller.start();
  assert.equal(await f.controller.logout(), false);
  await f.controller.refresh(); assert.equal(f.controller.getState().profile, null);
  const reloaded = fixture({ storage: f.storage }); await reloaded.controller.start();
  assert.equal(reloaded.controller.getState().profile, null);
  const callback = fixture({ storage: f.storage, href: 'https://members.example/index.html?code=new-login' });
  await callback.controller.start(); assert.equal(callback.controller.getState().profile.user_id, A);
});

test('logging out while identity start is pending prevents a delayed authentication popup', async () => {
  const wait = deferred(); const f = fixture({ invoke: () => wait.promise }); await f.controller.start();
  const pending = f.controller.verifyIdentity(); await f.controller.logout();
  wait.resolve({ data: { identityVerificationId: 'a'.repeat(32), storeId: 'store', channelKey: 'channel', customer: { customerId: 'customer' } }, error: null });
  await pending; assert.equal(f.sdkLoads, 0); assert.equal(f.popups, 0); assert.equal(f.controller.getState().profile, null);
});

test('logging out while the provider SDK loads prevents a delayed popup and verification request', async () => {
  const wait = deferred(); const f = fixture({ sdkWait: wait.promise }); await f.controller.start();
  const pending = f.controller.verifyIdentity(); await new Promise(r => setTimeout(r, 0));
  await f.controller.logout(); wait.resolve(); await pending;
  assert.equal(f.popups, 0);
  assert.equal(f.calls.filter(c => c[0] === 'function' && c[2].body.action === 'complete').length, 0);
});

test('browser identity success cannot mark a member verified without server confirmation', async () => {
  const f = fixture({ invoke: (_, args) => args.body.action === 'start'
    ? { data: { identityVerificationId: 'a'.repeat(32), storeId: 'store', channelKey: 'channel', customer: { customerId: 'customer' } }, error: null }
    : { data: { identity_verified: false }, error: null } });
  await f.controller.start(); assert.equal(await f.controller.verifyIdentity(), false);
  assert.equal(f.controller.getState().profile.identity_verified, false);
});

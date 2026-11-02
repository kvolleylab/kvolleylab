import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminAuth } from '../previews/admin-login-v1/admin-auth.mjs';

const owner = { id: 293255989, login: 'kvolleylab' };
const repository = { id: 1267923840, full_name: 'kvolleylab/kvolleylab', owner };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => structuredClone(body) });

function fixture({ user = owner, repo = repository, permission = 'admin', permissionUser = owner, now = () => 1000 } = {}) {
  const requests = [];
  let failure = null;
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    if (failure) return response({}, failure);
    if (url.endsWith('/user')) return response(user);
    if (url.endsWith('/permission')) return response({ permission, user: permissionUser });
    return response(repo);
  };
  return { auth: new AdminAuth({ fetcher, now }), requests, fail: status => { failure = status; } };
}

test('empty/invalid input makes no request and never signs in', async () => {
  const { auth, requests } = fixture();
  for (const input of ['', ' ', null, 'bad token', 'x'.repeat(513)]) await assert.rejects(auth.signIn(input), { code: 'input' });
  assert.equal(auth.session, null);
  assert.equal(requests.length, 0);
});

test('owner and server-confirmed admin role succeeds using GET requests only', async () => {
  const { auth, requests } = fixture();
  const result = await auth.signIn('fixture-token-not-a-real-credential');
  assert.equal(result.login, owner.login);
  assert.equal(result.role, 'admin');
  assert.equal(result.expiresAt, 901000);
  assert.equal(requests.length, 3);
  for (const { url, options } of requests) {
    assert.equal(new URL(url).origin, 'https://api.github.com');
    assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.equal(options.headers.Authorization, 'Bearer fixture-token-not-a-real-credential');
    assert.equal(new URL(url).search, '');
    assert.equal(options.body, undefined);
  }
  assert.equal('token' in result, false);
  result.role = 'tampered';
  assert.equal(auth.session.role, 'admin');
});

test('browser fetch keeps its global receiver during sign-in and recheck', async () => {
  let requests = 0;
  const fetcher = async function (url) {
    if (this !== globalThis) throw new TypeError('Illegal invocation');
    requests += 1;
    return url.endsWith('/user') ? response(owner) : url.endsWith('/permission') ?
      response({ permission: 'admin', user: owner }) : response(repository);
  };
  const auth = new AdminAuth({ fetcher });
  assert.equal((await auth.signIn('fixture-not-a-real-credential')).role, 'admin');
  assert.equal((await auth.recheck()).role, 'admin');
  assert.equal(requests, 6);
});

test('a login name without the pinned user ID is refused', async () => {
  const { auth, requests } = fixture({ user: { ...owner, id: 22 } });
  await assert.rejects(auth.signIn('fixture'), { code: 'denied' });
  assert.equal(auth.session, null);
  assert.equal(requests.length, 2);
});

test('a different repository or changed repository owner is refused', async () => {
  for (const repo of [{ ...repository, id: 1 }, { ...repository, full_name: 'elsewhere/repo' }, { ...repository, owner: { id: 2 } }, null]) {
    const { auth } = fixture({ repo });
    await assert.rejects(auth.signIn('fixture'), { code: 'denied' });
    assert.equal(auth.session, null);
  }
});

test('read, write, maintain and missing roles cannot become site admin', async () => {
  for (const permission of ['read', 'write', 'maintain', null, 'ADMIN']) {
    const { auth } = fixture({ permission });
    await assert.rejects(auth.signIn('fixture'), { code: 'denied' });
    assert.equal(auth.session, null);
  }
});

test('permission response must describe the authenticated identity', async () => {
  const { auth } = fixture({ permissionUser: { ...owner, id: 12 } });
  await assert.rejects(auth.signIn('fixture'), { code: 'denied' });
});

test('401/403/404/429 and provider failures remove prior authentication', async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const { auth, fail } = fixture();
    await auth.signIn('fixture');
    fail(status);
    await assert.rejects(auth.recheck());
    assert.equal(auth.session, null);
    await assert.rejects(auth.recheck(), { code: 'required' });
  }
});

test('logout and a new page instance have no remembered identity', async () => {
  const { auth } = fixture();
  await auth.signIn('fixture');
  auth.signOut();
  assert.equal(auth.session, null);
  await assert.rejects(auth.recheck(), { code: 'required' });
  assert.equal(fixture().auth.session, null);
});

test('15-minute expiry invalidates the session and cannot be rechecked', async () => {
  let clock = 1000;
  const { auth } = fixture({ now: () => clock });
  await auth.signIn('fixture');
  clock = 901000;
  assert.equal(auth.session, null);
  await assert.rejects(auth.recheck(), { code: 'required' });
});

test('late success after logout cannot restore authentication', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const auth = new AdminAuth({ fetcher: async url => {
    await pending;
    return url.endsWith('/user') ? response(owner) : url.endsWith('/permission') ? response({ permission: 'admin', user: owner }) : response(repository);
  }});
  const attempt = auth.signIn('fixture');
  auth.signOut();
  release();
  await assert.rejects(attempt, { code: 'cancelled' });
  assert.equal(auth.session, null);
});

test('malformed JSON and network errors fail closed without echoing input', async () => {
  const secret = 'fixture-sensitive-value';
  for (const [fetcher, code] of [
    [async () => { throw new Error(secret); }, 'network'],
    [async () => ({ ok: true, json: async () => { throw new Error(secret); } }), 'response']
  ]) {
    const auth = new AdminAuth({ fetcher });
    await assert.rejects(auth.signIn(secret), error => error.code === code && !error.message.includes(secret));
    assert.equal(auth.session, null);
  }
});

test('request timeout stops verification and clears authentication', async () => {
  const auth = new AdminAuth({ timeoutMs: 5, fetcher: async (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }) });
  await assert.rejects(auth.signIn('fixture'), { code: 'timeout' });
  assert.equal(auth.session, null);
});

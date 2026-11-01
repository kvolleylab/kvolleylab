import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.KVL_JSDOM_PATH || 'jsdom');
const html = await fs.readFile(new URL('../previews/admin-login-v1/index.html', import.meta.url), 'utf8');
const authSource = await fs.readFile(new URL('../previews/admin-login-v1/admin-auth.mjs', import.meta.url), 'utf8');
const uiSource = await fs.readFile(new URL('../previews/admin-login-v1/admin-login.mjs', import.meta.url), 'utf8');

async function setup({ ownerId = 293255989 } = {}) {
  const dom = new JSDOM(html, { url: 'https://kvl-test.invalid/', runScripts: 'outside-only' });
  const context = dom.getInternalVMContext();
  const user = { id: ownerId, login: 'kvolleylab' };
  let requestCount = 0;
  dom.window.fetch = async url => {
    requestCount++;
    const body = url.endsWith('/user') ? user : url.endsWith('/permission') ? { permission: 'admin', user } :
      { id: 1267923840, full_name: 'kvolleylab/kvolleylab', owner: { id: 293255989 } };
    return { ok: true, status: 200, json: async () => body };
  };
  const auth = new vm.SourceTextModule(authSource, { context });
  await auth.link(() => { throw new Error('Unexpected auth import'); });
  const ui = new vm.SourceTextModule(uiSource, { context });
  await ui.link(specifier => { assert.equal(specifier, './admin-auth.mjs'); return auth; });
  await ui.evaluate();
  const $ = id => dom.window.document.getElementById(id);
  const submit = async () => {
    $('token').value = 'fixture-not-a-real-token';
    $('login-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setImmediate(resolve));
  };
  return { dom, $, submit, requestCount: () => requestCount };
}

test('UI clears input, shows confirmed account, rechecks with API and signs out', async () => {
  const { dom, $, submit, requestCount } = await setup();
  try {
    assert.equal($('account-panel').hidden, true);
    await submit();
    assert.equal($('token').value, '');
    assert.equal($('message').hidden, false);
    assert.equal($('message').dataset.kind, 'success');
    assert.equal($('account-panel').hidden, false);
    assert.equal($('login-panel').hidden, true);
    assert.equal($('account-login').textContent, 'kvolleylab');
    assert.equal(requestCount(), 3);
    $('recheck-button').click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requestCount(), 6);
    assert.equal($('account-panel').hidden, false);
    assert.equal(dom.window.localStorage.length, 0);
    assert.equal(dom.window.sessionStorage.length, 0);
    $('logout-button').click();
    assert.equal($('account-panel').hidden, true);
    assert.equal($('login-panel').hidden, false);
    assert.equal($('account-login').textContent, '');
    assert.equal($('session-state').textContent, '로그인 전');
  } finally { dom.window.close(); }
});

test('other account and forged legacy localStorage flag never unlock the UI', async () => {
  const { dom, $, submit } = await setup({ ownerId: 123 });
  try {
    dom.window.localStorage.setItem('kvlAdminAccess', '1');
    await submit();
    assert.equal($('account-panel').hidden, true);
    assert.equal($('message').hidden, false);
    assert.equal($('message').dataset.kind, 'error');
    assert.equal($('token').value, '');
    assert.equal($('session-state').textContent, '로그인 전');
  } finally { dom.window.close(); }
});

test('pagehide/pageshow clears confirmed identity and input', async () => {
  const { dom, $, submit } = await setup();
  try {
    await submit();
    dom.window.dispatchEvent(new dom.window.Event('pagehide'));
    dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pageshow', { persisted: true }));
    assert.equal($('account-panel').hidden, true);
    assert.equal($('account-login').textContent, '');
    assert.equal($('token').value, '');
    assert.equal($('message').dataset.kind, 'info');
    assert.match($('message').textContent, /인증이 종료/);
  } finally { dom.window.close(); }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';

// Run with --experimental-vm-modules. Uses the shipped UI and controller;
// only config/SDK transport responses are fixtures, never actual member accounts.
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.KVL_JSDOM_PATH || '../tools/member-onboarding/node_modules/jsdom');
const base = new URL('../prototypes/member-onboarding-v1/', import.meta.url);
const [html, uiSource, clientSource] = await Promise.all([
  fs.readFile(new URL('index.html', base), 'utf8'),
  fs.readFile(new URL('ui.mjs', base), 'utf8'),
  fs.readFile(new URL('client.mjs', base), 'utf8'),
]);
const flush = () => new Promise(resolve => setImmediate(resolve));

async function setup({ live = false, signOut } = {}) {
  const pageUrl = 'https://kvl-ui.invalid/prototypes/member-onboarding-v1/index.html';
  const dom = new JSDOM(html, { url: pageUrl, runScripts: 'outside-only' });
  const context = dom.getInternalVMContext();
  const requests = [];
  let userChecks = 0;
  const fixtureProfile = {
    user_id: 'fixture-user', nickname: '검수닉네임', real_name: '검수실명',
    publish_real_name: true, identity_verified: true,
    public_author_name: '검수실명', name_source: 'verified', onboarding_ready: true,
  };
  dom.window.structuredClone = structuredClone;
  dom.window.fetch = async (url, options) => {
    requests.push({ url: String(url), method: options?.method || 'GET' });
    assert.equal(String(url), new URL('config.json', pageUrl).href, 'UI must not make an unexpected external request');
    return { ok: true, json: async () => live ? {
      enabled: true, projectUrl: 'https://kvl-fixture.supabase.co',
      publishableKey: 'sb_publishable_not_a_real_key_1234567890',
      emailEnabled: true, kakaoEnabled: true, identityEnabled: true,
      identityFunction: 'member-identity',
    } : { enabled: false } };
  };

  const sdkClient = {
    auth: {
      getUser: async () => { userChecks++; return { data: { user: { id: fixtureProfile.user_id } }, error: null }; },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: signOut || (async () => ({ error: null })),
    },
    rpc: async name => {
      if (name === 'kvl_onboarding_session_active') return { data: true, error: null };
      if (name === 'kvl_member_get_self') return { data: { ...fixtureProfile }, error: null };
      throw new Error(`Unexpected fixture RPC: ${name}`);
    },
  };
  const sdkModule = new vm.SyntheticModule(['createClient'], function () {
    this.setExport('createClient', () => sdkClient);
  }, { context });
  await sdkModule.link(() => { throw new Error('Unexpected SDK import'); });
  await sdkModule.evaluate();

  const client = new vm.SourceTextModule(clientSource, {
    context,
    initializeImportMeta(meta) { meta.url = new URL('client.mjs', pageUrl).href; },
    importModuleDynamically(specifier) {
      assert.equal(live, true, 'Disabled/preview mode must never load an authentication SDK');
      assert.equal(specifier, './vendor/supabase-js.mjs');
      return sdkModule;
    },
  });
  await client.link(() => { throw new Error('Unexpected controller import'); });
  const ui = new vm.SourceTextModule(uiSource, { context });
  await ui.link(specifier => { assert.equal(specifier, './client.mjs'); return client; });
  await ui.evaluate();
  await flush();
  const $ = id => dom.window.document.getElementById(id);
  return { dom, $, requests, fixtureProfile, userChecks: () => userChecks };
}

function change(dom, element, value, type = 'input') {
  if (element.type === 'checkbox') element.checked = value;
  else element.value = value;
  element.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
}

function assertPrivateFieldsCleared($) {
  assert.equal($('member-panel').hidden, true);
  assert.equal($('nickname').value, '');
  assert.equal($('real-name').value, '');
  assert.equal($('email').value, '');
  assert.equal($('publish-real-name').checked, false);
}

test('preview renders untrusted names as text, never authenticates or persists, and both exit controls clear inputs', async () => {
  const { dom, $, requests, userChecks } = await setup();
  try {
    assert.equal($('send-email').disabled, true);
    assert.equal($('kakao-login').disabled, true);
    assert.equal($('connection-banner').hidden, false);

    for (const exitControl of ['exit-preview', 'logout']) {
      $('enter-preview').click();
      assert.equal($('preview-banner').hidden, false);
      assert.equal($('member-panel').hidden, false);
      assert.equal($('verify-identity').disabled, true);
      assert.equal($('identity-status').textContent, '본인확인 전');
      assert.equal($('publish-real-name').checked, false);

      // A crafted event must not bypass disabled controls and start real auth.
      $('email').value = 'preview@example.invalid';
      $('email-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      $('kakao-login').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
      $('verify-identity').dispatchEvent(new dom.window.Event('click', { bubbles: true }));

      change(dom, $('nickname'), '<svg/onload=alert(1)>');
      assert.equal($('author-name').textContent, '<svg/onload=alert(1)>');
      assert.equal($('author-name').childElementCount, 0);
      change(dom, $('publish-real-name'), true, 'change');
      const unsafeName = '<img src=x onerror=alert(1)>';
      change(dom, $('real-name'), unsafeName);
      assert.equal($('author-name').textContent, unsafeName);
      assert.equal($('author-name').childElementCount, 0);
      assert.match($('author-caption').textContent, /본인확인 전/);

      $('profile-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      await flush();
      assert.match($('feedback').textContent, /미리보기에 반영/);
      assert.equal($('save-profile').textContent, '미리보기에 반영');
      assert.equal($('identity-status').textContent, '본인확인 전');
      assert.equal($('author-name').childElementCount, 0);

      $(exitControl).click();
      assertPrivateFieldsCleared($);
      assert.equal($('preview-banner').hidden, true);
      assert.equal(dom.window.document.body.textContent.includes(unsafeName), false);
      assert.equal(dom.window.localStorage.length, 0);
      assert.equal(dom.window.sessionStorage.length, 0);
    }
    assert.equal(requests.length, 1, 'Only the initial config read is allowed');
    assert.equal(userChecks(), 0);
  } finally { dom.window.close(); }
});

test('live-mode logout immediately clears private UI and an offline sign-out cannot restore it on focus', async () => {
  let finishSignOut;
  const waitingSignOut = new Promise(resolve => { finishSignOut = resolve; });
  const { dom, $, fixtureProfile, userChecks } = await setup({ live: true, signOut: () => waitingSignOut });
  try {
    assert.equal($('member-panel').hidden, false);
    assert.equal($('nickname').value, fixtureProfile.nickname);
    assert.equal($('real-name').value, fixtureProfile.real_name);
    assert.equal($('real-name').readOnly, true);
    $('email').value = 'private-fixture@example.invalid';

    $('logout').click();
    assertPrivateFieldsCleared($); // Before the provider response, not only after success.
    assert.equal(dom.window.document.body.textContent.includes(fixtureProfile.real_name), false);
    assert.equal(dom.window.document.body.textContent.includes(fixtureProfile.nickname), false);

    finishSignOut({ error: { message: 'fixture network unavailable' } });
    await flush();
    assertPrivateFieldsCleared($);
    assert.match($('feedback').textContent, /로그아웃/);
    const checksAfterLogout = userChecks();
    dom.window.dispatchEvent(new dom.window.Event('focus'));
    await flush();
    assertPrivateFieldsCleared($);
    assert.equal(userChecks(), checksAfterLogout, 'Logout intent prevents a stale SDK session from silently restoring the profile');
    assert.deepEqual(Object.keys(dom.window.localStorage), ['kvl-member-onboarding-v1:logout-requested']);
    assert.equal(dom.window.localStorage.getItem('kvl-member-onboarding-v1:logout-requested'), '1');
    assert.equal(dom.window.sessionStorage.length, 0);
  } finally { dom.window.close(); }
});

// K-Volley Lab member onboarding v1. Credentials belong to the official SDK only.
const CONFIG_URL = new URL('./config.json', import.meta.url);
const CALLBACK_URL = new URL('./index.html', import.meta.url);
const SAFE_CAPABILITIES = { email: false, kakao: false, identity: false };
const LOGOUT_MARKER = 'kvl-member-onboarding-v1:logout-requested';
const copy = value => structuredClone(value);

export function validateConfig(input) {
  if (!input || input.enabled !== true) return null;
  let url;
  try { url = new URL(input.projectUrl); } catch { throw new Error('INVALID_CONFIG'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
      url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('INVALID_CONFIG');
  }
  // Accept only the explicitly public key format; reject privileged and ambiguous JWT keys.
  if (typeof input.publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(input.publishableKey)) {
    throw new Error('INVALID_CONFIG');
  }
  if (input.identityFunction !== 'member-identity') throw new Error('INVALID_CONFIG');
  return Object.freeze({
    projectUrl: url.origin,
    publishableKey: input.publishableKey,
    emailEnabled: input.emailEnabled === true,
    kakaoEnabled: input.kakaoEnabled === true,
    identityEnabled: input.identityEnabled === true,
    identityFunction: 'member-identity',
  });
}

export function validateProfileInput(input) {
  const nickname = String(input?.nickname ?? '').trim().normalize('NFC');
  const realName = String(input?.realName ?? '').trim().normalize('NFC');
  const publishRealName = input?.publishRealName === true;
  if ([...nickname].length < 2 || [...nickname].length > 40 || /[\p{Cc}\p{Cf}]/u.test(nickname)) {
    throw new Error('닉네임은 2~40자로 입력해 주세요.');
  }
  if ([...realName].length > 80 || /[\p{Cc}\p{Cf}]/u.test(realName)) {
    throw new Error('이름은 줄바꿈 없이 80자 이내로 입력해 주세요.');
  }
  if (publishRealName && !realName) throw new Error('실명을 공개하려면 이름을 입력해 주세요.');
  return { nickname, realName, publishRealName };
}

function profileFromServer(value, expectedUserId) {
  if (!value || value.user_id !== expectedUserId || typeof value.publish_real_name !== 'boolean' ||
      typeof value.identity_verified !== 'boolean' ||
      !['nickname', 'self_entered', 'verified'].includes(value.name_source)) throw new Error('INVALID_PROFILE');
  return {
    user_id: expectedUserId,
    nickname: String(value.nickname ?? ''),
    real_name: String(value.real_name ?? ''),
    publish_real_name: value.publish_real_name,
    identity_verified: value.identity_verified,
    public_author_name: String(value.public_author_name ?? value.nickname ?? ''),
    name_source: value.name_source,
    benefits_active: false, // The owner has not decided or activated specific benefits.
    onboarding_ready: value.onboarding_ready === true && value.identity_verified,
  };
}

async function defaultCreateClient(config) {
  const { createClient } = await import('./vendor/supabase-js.mjs');
  return createClient(config.projectUrl, config.publishableKey, {
    auth: {
      flowType: 'pkce', persistSession: true, autoRefreshToken: true,
      detectSessionInUrl: false, storageKey: 'kvl-member-onboarding-v1',
    },
    global: { fetch: (url, init) => globalThis.fetch(url, { ...init, cache: 'no-store' }) },
  });
}

async function defaultLoadPortOne() {
  const sdk = await import('./vendor/portone-v2.mjs');
  return sdk;
}

// Dependencies are injectable for adversarial tests; the shipped UI uses the defaults.
export function createMemberController(options = {}) {
  const fetcher = (options.fetcher ?? globalThis.fetch)?.bind(globalThis);
  const makeClient = options.makeClient ?? defaultCreateClient;
  const loadPortOne = options.loadPortOne ?? defaultLoadPortOne;
  const browser = options.browser ?? globalThis.window;
  const callbackUrl = options.callbackUrl ?? CALLBACK_URL.href;
  const now = options.now ?? Date.now;
  let client, config, subscription, initialized = false, starting;
  let epoch = 0, currentUserId = null, lastEmailAt = -Infinity;
  let logoutRequested = false;
  let state = {
    mode: 'unconfigured', status: 'loading', pending: null,
    error: null, notice: null, capabilities: { ...SAFE_CAPABILITIES }, profile: null,
  };
  const listeners = new Set();
  const setLogoutIntent = value => {
    logoutRequested = value;
    // This flag contains no personal data or token. Preserve logout intent if the server is offline.
    try {
      if (value) browser?.localStorage?.setItem(LOGOUT_MARKER, '1');
      else browser?.localStorage?.removeItem(LOGOUT_MARKER);
    } catch { /* The in-memory guard still applies when browser storage is unavailable. */ }
  };
  const hasLogoutIntent = () => {
    try { if (browser?.localStorage?.getItem(LOGOUT_MARKER) === '1') logoutRequested = true; } catch {}
    return logoutRequested;
  };
  const emit = patch => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener(copy(state));
  };
  const clear = (patch = {}) => {
    epoch += 1;
    currentUserId = null;
    emit({ status: 'signed_out', profile: null, pending: null, error: null, notice: null, ...patch });
  };
  const rpc = async (name, args) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error('SERVER_REQUEST_FAILED');
    return data;
  };
  const liveRequired = capability => {
    if (state.mode !== 'live' || !client || (capability && !state.capabilities[capability])) {
      throw new Error('NOT_CONNECTED');
    }
  };
  const act = async (name, operation, fallback) => {
    if (state.pending) return false;
    const ticket = epoch;
    emit({ pending: name, error: null, notice: null });
    try {
      const patch = await operation();
      if (ticket !== epoch) return false;
      if (patch) emit(patch);
      return true;
    } catch (error) {
      if (ticket === epoch) emit({ error: error.message === 'NOT_CONNECTED'
        ? '아직 서비스가 연결되지 않았습니다. 미리보기로 화면을 확인해 주세요.'
        : error.message === 'IDENTITY_REFRESH_REQUIRED'
          ? '본인확인은 저장됐으나 회원정보를 다시 불러와야 합니다. 아래의 정보 다시 확인을 눌러 주세요.'
          : fallback });
      return false;
    } finally {
      if (ticket === epoch) emit({ pending: null });
    }
  };

  function takeCallback() {
    if (!browser?.location?.href) return {};
    const url = new URL(browser.location.href);
    const result = {
      code: url.searchParams.get('code'),
      tokenHash: url.searchParams.get('token_hash'),
      type: url.searchParams.get('type'),
      identityId: url.searchParams.get('identityVerificationId'),
      error: url.searchParams.get('error') || url.searchParams.get('error_code') ||
        (url.searchParams.has('identityVerificationId') && url.searchParams.get('code')),
      implicit: /(?:access_token|refresh_token|error)=/.test(url.hash),
    };
    const params = ['code', 'token_hash', 'type', 'error', 'error_code', 'error_description',
      'identityVerificationId', 'message'];
    let changed = false;
    for (const key of params) {
      if (url.searchParams.has(key)) { changed = true; url.searchParams.delete(key); }
    }
    if (result.implicit) { url.hash = ''; changed = true; }
    if (changed) browser.history?.replaceState(null, '', url.pathname + url.search + url.hash);
    return result;
  }

  async function refresh() {
    if (state.mode !== 'live' || !client || state.pending) return copy(state);
    if (hasLogoutIntent()) { if (state.profile || state.status === 'loading') clear(); return copy(state); }
    const ticket = ++epoch;
    try {
      const { data, error } = await client.auth.getUser();
      if (ticket !== epoch) return copy(state);
      const user = data?.user;
      if (error || !user || user.is_anonymous) {
        clear({ notice: state.status === 'email_sent' ? state.notice : null,
          status: state.status === 'email_sent' ? 'email_sent' : 'signed_out' });
        return copy(state);
      }
      if (currentUserId !== user.id) {
        currentUserId = user.id;
        emit({ profile: null, status: 'loading' });
      }
      const active = await rpc('kvl_onboarding_session_active');
      if (ticket !== epoch) return copy(state);
      if (active !== true) { clear({ error: '로그인 상태를 다시 확인해 주세요. 새 로그인 링크로 시작할 수 있습니다.' }); return copy(state); }
      const profile = profileFromServer(await rpc('kvl_member_get_self'), user.id);
      if (ticket !== epoch) return copy(state);
      emit({ status: 'signed_in', profile, error: null });
    } catch {
      if (ticket === epoch) clear({ error: '회원정보를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.' });
    }
    return copy(state);
  }

  async function finishIdentity(identityId) {
    if (!/^[A-Za-z0-9]{32}$/.test(identityId ?? '')) throw new Error('INVALID_IDENTITY_ID');
    const { data, error } = await client.functions.invoke(config.identityFunction, {
      body: { action: 'complete', identityVerificationId: identityId },
    });
    if (error?.context?.json) {
      let detail;
      try { detail = await error.context.json(); } catch {}
      if (detail?.code === 'identity_saved_refresh_required') throw new Error('IDENTITY_REFRESH_REQUIRED');
    }
    if (error || data?.identity_verified !== true) throw new Error('IDENTITY_NOT_VERIFIED');
    const profile = profileFromServer(data.profile, currentUserId);
    if (!profile.identity_verified) throw new Error('IDENTITY_NOT_VERIFIED');
    return { profile, status: 'signed_in', notice: '휴대폰 본인확인 결과를 확인했습니다. 이름 공개 여부를 확인해 주세요.' };
  }

  async function startInternal() {
    const callback = takeCallback();
    try {
      let input = options.config;
      if (input === undefined) {
        const response = await fetcher(CONFIG_URL, { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) throw new Error('INVALID_CONFIG');
        input = await response.json();
      }
      config = validateConfig(input);
      if (!config) { clear({ mode: 'unconfigured' }); return copy(state); }
      if (!/^https:\/\//.test(callbackUrl)) throw new Error('INVALID_CALLBACK');
      client = await makeClient(config);
      emit({ mode: 'live', capabilities: {
        email: config.emailEnabled, kakao: config.kakaoEnabled, identity: config.identityEnabled,
      } });
      subscription = client.auth.onAuthStateChange((event, session) => {
        if (!initialized) return;
        if (event === 'SIGNED_OUT') { clear(); return; }
        if (currentUserId !== (session?.user?.id ?? null)) {
          clear();
          // Never await Supabase methods inside its synchronous auth callback.
          setTimeout(() => { void refresh(); }, 0);
        }
      })?.data?.subscription;
      if (callback.error || callback.implicit || (callback.code && callback.tokenHash)) throw new Error('INVALID_CALLBACK');
      if (!callback.identityId && callback.code) {
        const result = await client.auth.exchangeCodeForSession(callback.code);
        if (result.error) throw new Error('INVALID_CALLBACK');
        setLogoutIntent(false);
      } else if (callback.tokenHash) {
        if (callback.type !== 'email') throw new Error('INVALID_CALLBACK');
        const result = await client.auth.verifyOtp({ token_hash: callback.tokenHash, type: 'email' });
        if (result.error) throw new Error('INVALID_CALLBACK');
        setLogoutIntent(false);
      }
      initialized = true;
      await refresh();
      if (callback.identityId && state.status === 'signed_in' && config.identityEnabled) {
        await act('identity', () => finishIdentity(callback.identityId), '본인확인 결과를 확인하지 못했습니다. 다시 시작해 주세요.');
      }
    } catch {
      initialized = true;
      if (client) clear({ error: '로그인을 완료하지 못했습니다. 원래 로그인한 브라우저에서 새 링크로 다시 시도해 주세요.' });
      else clear({ mode: 'unconfigured', capabilities: { ...SAFE_CAPABILITIES },
        error: '회원 서비스 연결 설정을 확인하지 못했습니다. 미리보기는 이용할 수 있습니다.' });
    }
    browser?.addEventListener?.('pagehide', () => { if (state.mode !== 'preview') clear(); });
    browser?.addEventListener?.('pageshow', event => { if (event.persisted) void refresh(); });
    browser?.addEventListener?.('focus', () => { void refresh(); });
    browser?.addEventListener?.('storage', event => {
      if (event.key !== LOGOUT_MARKER) return;
      logoutRequested = event.newValue === '1';
      if (logoutRequested) clear();
      else void refresh();
    });
    return copy(state);
  }

  return {
    subscribe(listener) { listeners.add(listener); listener(copy(state)); return () => listeners.delete(listener); },
    getState() { return copy(state); },
    start() { return starting ??= startInternal(); },
    refresh,
    async sendEmail(input) {
      const email = String(input ?? '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        emit({ error: '올바른 이메일 주소를 입력해 주세요.', notice: null }); return false;
      }
      if (now() - lastEmailAt < 60000) {
        emit({ error: '잠시 기다린 뒤 다시 요청해 주세요. 받은편지함과 스팸함도 확인해 주세요.' }); return false;
      }
      return act('email', async () => {
        liveRequired('email');
        const result = await client.auth.signInWithOtp({ email,
          options: { emailRedirectTo: callbackUrl, shouldCreateUser: true } });
        if (result.error) throw new Error('EMAIL_REQUEST_FAILED');
        lastEmailAt = now();
        return { status: 'email_sent', profile: null,
          notice: '로그인 링크를 요청했습니다. 받은편지함을 확인하고, 지금 사용하는 브라우저에서 링크를 열어 주세요.' };
      }, '로그인 메일을 요청하지 못했습니다. 이메일 주소와 서비스 연결 상태를 확인해 주세요.');
    },
    loginKakao() {
      return act('kakao', async () => {
        liveRequired('kakao');
        const result = await client.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: callbackUrl } });
        if (result.error) throw new Error('KAKAO_REQUEST_FAILED');
        return { notice: '카카오 로그인 화면으로 이동합니다.' };
      }, '카카오 로그인에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    },
    enterPreview() {
      if (state.mode === 'live') return false;
      clear({ mode: 'preview', status: 'signed_in', capabilities: { ...SAFE_CAPABILITIES },
        notice: '예시 정보로 화면을 확인합니다. 실제 가입·본인인증은 진행되지 않습니다.',
        profile: { user_id: 'preview-only', nickname: '배구노트', real_name: '김민준',
          publish_real_name: false, identity_verified: false, public_author_name: '배구노트',
          name_source: 'nickname', benefits_active: false, onboarding_ready: false } });
      return true;
    },
    exitPreview() { if (state.mode === 'preview') clear({ mode: 'unconfigured' }); },
    async saveProfile(input) {
      let fields;
      try { fields = validateProfileInput(input); }
      catch (error) { emit({ error: error.message, notice: null }); return false; }
      if (state.mode === 'preview') {
        emit({ profile: { ...state.profile, nickname: fields.nickname, real_name: fields.realName,
          publish_real_name: fields.publishRealName,
          name_source: fields.publishRealName ? 'self_entered' : 'nickname',
          public_author_name: fields.publishRealName ? fields.realName : fields.nickname },
          error: null, notice: '미리보기에 반영했습니다. 새로고침하면 예시 정보는 초기화됩니다.' });
        return true;
      }
      return act('profile', async () => {
        liveRequired();
        if (!currentUserId || !state.profile) throw new Error('SIGN_IN_REQUIRED');
        const profile = profileFromServer(await rpc('kvl_member_save_profile', {
          p_nickname: fields.nickname, p_real_name: fields.realName,
          p_publish_real_name: fields.publishRealName,
        }), currentUserId);
        return { profile, notice: '회원정보를 저장했습니다.' };
      }, '회원정보를 저장하지 못했습니다. 로그인 상태와 입력한 내용을 다시 확인해 주세요.');
    },
    verifyIdentity() {
      const ticket = epoch, userId = currentUserId;
      const stillCurrent = () => {
        if (ticket !== epoch || userId !== currentUserId || hasLogoutIntent()) throw new Error('REQUEST_CANCELLED');
      };
      return act('identity', async () => {
        liveRequired('identity');
        if (!currentUserId) throw new Error('SIGN_IN_REQUIRED');
        const { data, error } = await client.functions.invoke(config.identityFunction, { body: { action: 'start' } });
        stillCurrent();
        if (error || !/^[A-Za-z0-9]{32}$/.test(data?.identityVerificationId ?? '') ||
            !data.storeId || !data.channelKey || !data.customer?.customerId) throw new Error('IDENTITY_START_FAILED');
        const sdk = await loadPortOne();
        stillCurrent();
        const result = await sdk.requestIdentityVerification({
          storeId: data.storeId, channelKey: data.channelKey, identityVerificationId: data.identityVerificationId,
          customer: { customerId: data.customer.customerId }, redirectUrl: callbackUrl,
        });
        // A redirect may unload this page. Never interpret a browser result as verified identity.
        if (!result || result.code) throw new Error('IDENTITY_CANCELLED');
        stillCurrent();
        return finishIdentity(data.identityVerificationId);
      }, '본인확인을 완료하지 못했습니다. 인증창을 닫았다면 다시 시작해 주세요.');
    },
    async logout() {
      if (state.mode === 'preview') { clear({ mode: 'unconfigured' }); return true; }
      if (!client) { clear(); return true; }
      // Clear private UI before any network work, including when sign-out itself fails.
      setLogoutIntent(true);
      clear({ pending: 'logout' });
      try {
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) throw error;
        clear({ notice: '로그아웃했습니다.' }); return true;
      } catch {
        clear({ error: '화면의 회원정보는 지웠지만 서버 로그아웃을 확인하지 못했습니다. 연결이 복구되면 다시 로그아웃해 주세요.' });
        return false;
      }
    },
    dispose() { subscription?.unsubscribe(); clear(); listeners.clear(); },
  };
}

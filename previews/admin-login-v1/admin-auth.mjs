// Operator-only authentication experiment. GitHub remains the authority.
// This does not authorize access to private KVL member data or static HTML.
const API = 'https://api.github.com';
const REPOSITORY = 'kvolleylab/kvolleylab';
const REPOSITORY_ID = 1267923840;
const OWNER_ID = 293255989;
const SESSION_MS = 15 * 60 * 1000;

export class AdminAuthError extends Error {
  constructor(code, message) { super(message); this.name = 'AdminAuthError'; this.code = code; }
}

export class AdminAuth {
  #token = ''; #session = null; #generation = 0; #controller = null;
  #fetch; #now; #timeout;

  constructor({ fetcher = globalThis.fetch, now = () => Date.now(), timeoutMs = 12000 } = {}) {
    this.#fetch = fetcher;
    this.#now = now;
    this.#timeout = timeoutMs;
  }

  get session() {
    if (this.#session && this.#now() >= this.#session.expiresAt) this.signOut();
    return this.#session ? { ...this.#session } : null;
  }

  signOut() {
    this.#generation += 1;
    this.#controller?.abort();
    this.#controller = null;
    this.#token = '';
    this.#session = null;
  }

  async #read(path, token, signal) {
    const response = await this.#fetch(`${API}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
      credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal
    });
    if (!response.ok) {
      if (response.status === 401) throw new AdminAuthError('invalid', '인증 정보를 확인할 수 없습니다. 토큰의 값과 유효기간을 확인해 주세요.');
      if ([403, 404].includes(response.status)) throw new AdminAuthError('denied', '관리자 권한을 확인할 수 없습니다. 계정, 선택한 저장소, 토큰 권한 또는 GitHub 요청 제한을 확인해 주세요.');
      if (response.status === 429) throw new AdminAuthError('limited', 'GitHub 요청이 잠시 제한됐습니다. 잠시 후 다시 시도해 주세요.');
      throw new AdminAuthError('service', 'GitHub 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
    return response.json();
  }

  async #verify(token, signal) {
    const [user, repo] = await Promise.all([
      this.#read('/user', token, signal),
      this.#read(`/repos/${REPOSITORY}`, token, signal)
    ]);
    if (signal.aborted) throw new AdminAuthError('cancelled', '인증을 취소했습니다.');
    if (user?.id !== OWNER_ID || typeof user.login !== 'string' || !/^[a-zA-Z0-9-]{1,39}$/.test(user.login) ||
        repo?.id !== REPOSITORY_ID || repo?.full_name?.toLowerCase() !== REPOSITORY || repo?.owner?.id !== OWNER_ID) {
      throw new AdminAuthError('denied', '이 계정은 이번 테스트에 허용된 K-Volley Lab 관리자 계정이 아닙니다.');
    }
    // This endpoint documents a server-confirmed role; public repository visibility is insufficient.
    const role = await this.#read(`/repos/${REPOSITORY}/collaborators/${encodeURIComponent(user.login)}/permission`, token, signal);
    if (role?.permission !== 'admin' || role?.user?.id !== OWNER_ID ||
        role?.user?.login?.toLowerCase() !== user.login.toLowerCase()) {
      throw new AdminAuthError('denied', '관리자 권한이 확인되지 않았습니다. 일반 계정과 쓰기 권한만 있는 계정은 사용할 수 없습니다.');
    }
    return { id: user.id, login: user.login, role: 'admin', repository: REPOSITORY };
  }

  async signIn(value) {
    this.signOut();
    const token = typeof value === 'string' ? value.trim() : '';
    if (!token || token.length > 512 || /\s/.test(token)) throw new AdminAuthError('input', 'GitHub 인증 토큰을 입력해 주세요.');
    const generation = this.#generation;
    const controller = new AbortController();
    this.#controller = controller;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.#timeout);
    try {
      const identity = await this.#verify(token, controller.signal);
      if (generation !== this.#generation || controller.signal.aborted) throw new AdminAuthError('cancelled', '인증을 취소했습니다.');
      const checkedAt = this.#now();
      this.#token = token;
      this.#session = { ...identity, checkedAt, expiresAt: checkedAt + SESSION_MS };
      return this.session;
    } catch (error) {
      const cancelled = generation !== this.#generation;
      if (generation === this.#generation) this.signOut();
      if (timedOut) throw new AdminAuthError('timeout', '인증 응답이 지연됐습니다. 다시 시도해 주세요.');
      if (cancelled) {
        throw new AdminAuthError('cancelled', '인증을 취소했습니다.');
      }
      if (error instanceof AdminAuthError) throw error;
      throw new AdminAuthError('network', '인증 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      clearTimeout(timer);
      if (this.#controller === controller) this.#controller = null;
    }
  }

  async recheck() {
    if (!this.session || !this.#token) {
      throw new AdminAuthError('required', '먼저 관리자 로그인을 진행해 주세요.');
    }
    return this.signIn(this.#token);
  }
}

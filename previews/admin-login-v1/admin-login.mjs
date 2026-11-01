import { AdminAuth } from './admin-auth.mjs';

const auth = new AdminAuth();
const $ = id => document.getElementById(id);
let action = 0;
let pending = false;

function message(text, kind = 'info') {
  $('message').textContent = text;
  $('message').dataset.kind = kind;
  $('message').hidden = !text;
}

function render() {
  const session = auth.session;
  $('login-panel').hidden = Boolean(session);
  $('account-panel').hidden = !session;
  $('login-button').disabled = pending;
  $('token').disabled = pending;
  $('recheck-button').disabled = pending;
  $('cancel-button').hidden = !pending;
  $('session-state').textContent = pending ? '확인 중' : session ? '관리자 인증됨' : '로그인 전';
  $('session-state').dataset.state = pending ? 'checking' : session ? 'authenticated' : 'signed-out';
  $('login-button').textContent = pending ? '관리자 확인 중…' : '관리자로 로그인';
  $('account-login').textContent = session?.login ?? '';
  $('account-role').textContent = session ? 'K-Volley Lab 저장소 소유자 · 관리자' : '';
  $('checked-at').textContent = session ? new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(session.checkedAt) + ' (한국시간)' : '';
  document.documentElement.dataset.authenticated = session ? 'true' : 'false';
}

async function run(operation) {
  const current = ++action;
  pending = true;
  message('GitHub에서 계정과 관리자 권한을 확인하고 있습니다.');
  render();
  try {
    await operation();
    if (current !== action) return;
    message('관리자 인증을 확인했습니다. 권한 재확인과 로그아웃을 테스트할 수 있습니다.', 'success');
  } catch (error) {
    if (current !== action) return;
    message(error.code === 'cancelled' ? '인증을 취소했습니다.' : error.message, 'error');
  } finally {
    if (current === action) {
      pending = false;
      render();
      (auth.session ? $('recheck-button') : $('token')).focus();
    }
  }
}

$('login-form').addEventListener('submit', event => {
  event.preventDefault();
  if (pending) return;
  const token = $('token').value;
  $('token').value = '';
  run(() => auth.signIn(token));
});
$('recheck-button').addEventListener('click', () => { if (!pending) run(() => auth.recheck()); });

function leave(text) {
  ++action;
  auth.signOut();
  pending = false;
  $('token').value = '';
  message(text);
  render();
  $('token').focus();
}
$('logout-button').addEventListener('click', () => leave('이 탭의 관리자 인증을 종료했습니다. 다시 이용하려면 로그인해 주세요.'));
$('cancel-button').addEventListener('click', () => leave('인증을 취소했습니다.'));
window.addEventListener('pagehide', () => { ++action; auth.signOut(); $('token').value = ''; });
window.addEventListener('pageshow', event => {
  pending = false;
  if (event.persisted) message('페이지 이동으로 인증이 종료됐습니다. 다시 로그인해 주세요.');
  render();
});
setInterval(() => {
  if (!pending && document.documentElement.dataset.authenticated === 'true' && !auth.session) {
    message('15분의 테스트 인증 시간이 종료됐습니다. 다시 로그인해 주세요.');
    render();
  }
}, 5000);
render();

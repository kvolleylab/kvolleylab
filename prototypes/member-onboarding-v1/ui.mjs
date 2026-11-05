import { createMemberController } from './client.mjs';

const controller = createMemberController();
const $ = id => document.getElementById(id);
let state = null;
let previousState = null;
let profileSignature = '';
let activeOperation = null;

function setText(id, value) { $(id).textContent = value ?? ''; }
function verifiedProfile() { return state?.mode === 'live' && state.profile?.identity_verified === true; }

function updateAuthorPreview() {
  const publish = $('publish-real-name').checked;
  const nickname = $('nickname').value.trim();
  const realName = $('real-name').value.trim();
  const authorName = publish ? realName || '이름을 입력하세요' : nickname || '닉네임을 입력하세요';
  $('real-name-fields').hidden = !publish;
  $('real-name').required = publish;
  setText('author-name', authorName);
  setText('author-avatar', Array.from(publish ? realName : nickname)[0] || 'K');
  setText('author-name-mode', publish ? '실명 공개' : '닉네임');
  setText('author-caption', publish ? (verifiedProfile() ? '본인확인한 이름으로 표시됩니다.' : '직접 입력한 이름 · 본인확인 전') : '닉네임으로 표시됩니다.');
  setText('real-name-source', verifiedProfile() ? '본인확인한 이름입니다. 이 화면에서는 변경할 수 없습니다.' : '직접 입력한 이름 · 본인확인 전');
  setText('real-name-choice-help', '선택하면 아래 표시 예시가 실명으로 바뀝니다.');
}

function clearForms() {
  $('email-form').reset();
  $('profile-form').reset();
  $('nickname').setCustomValidity('');
  $('real-name').setCustomValidity('');
  profileSignature = '';
}

function setStep(id, { current = false, done = false } = {}) {
  const element = $(id);
  element.classList.toggle('is-current', current);
  element.classList.toggle('is-done', done);
  if (current) element.setAttribute('aria-current', 'step');
  else element.removeAttribute('aria-current');
}

function render(next) {
  previousState = state;
  state = next;
  const preview = next.mode === 'preview';
  const live = next.mode === 'live';
  const hasProfile = Boolean(next.profile);
  const busy = Boolean(next.pending);
  const verified = verifiedProfile();

  if (previousState?.profile && (!hasProfile || previousState.mode !== next.mode)) clearForms();
  if (hasProfile) {
    const signature = JSON.stringify([next.mode, next.profile.user_id, next.profile.nickname, next.profile.real_name, next.profile.publish_real_name, next.profile.identity_verified, next.profile.name_source]);
    if (signature !== profileSignature) {
      $('nickname').value = next.profile.nickname || '';
      $('real-name').value = next.profile.real_name || '';
      $('publish-real-name').checked = next.profile.publish_real_name === true;
      profileSignature = signature;
    }
  }

  $('app').setAttribute('aria-busy', String(busy));
  $('preview-banner').hidden = !preview;
  $('connection-banner').hidden = next.mode !== 'unconfigured';
  $('login-panel').hidden = hasProfile;
  $('member-panel').hidden = !hasProfile;
  $('preview-entry').hidden = next.mode !== 'unconfigured';
  $('email-sent-panel').hidden = !(live && next.status === 'email_sent');
  $('email').disabled = busy || !next.capabilities.email || !live;
  $('send-email').disabled = busy || !next.capabilities.email || !live;
  $('kakao-login').disabled = busy || !next.capabilities.kakao || !live;
  $('enter-preview').disabled = busy;
  $('exit-preview').disabled = false;
  $('nickname').disabled = busy || !hasProfile;
  $('real-name').disabled = busy || !hasProfile;
  $('real-name').readOnly = verified;
  $('publish-real-name').disabled = busy || !hasProfile;
  $('save-profile').disabled = busy || !hasProfile;
  $('verify-identity').disabled = busy || !live || !hasProfile || !next.capabilities.identity || verified;
  $('refresh-profile').hidden = preview;
  $('refresh-profile').disabled = busy || !hasProfile;
  $('logout').disabled = !hasProfile;

  setText('flow-status', busy ? '확인 중' : preview ? '화면 미리보기' : hasProfile ? (verified ? '회원정보 설정' : '본인확인 필요') : live ? '계정 연결' : '연결 준비 중');
  setText('send-email', busy && activeOperation === 'email' ? '링크 전송 중…' : '이메일 인증 링크 받기');
  setText('kakao-login', busy && activeOperation === 'kakao' ? '카카오로 이동 중…' : '카카오로 시작하기');
  setText('save-profile', busy && activeOperation === 'save' ? '반영 중…' : preview ? '미리보기에 반영' : '회원정보 저장');
  setText('logout', preview ? '미리보기 종료' : '로그아웃');
  setText('email-help', live ? '인증 링크를 현재 사용 중인 브라우저에서 열어 주세요.' : '이메일로 보내드리는 링크에서 가입·로그인을 이어갑니다.');

  setStep('step-login', { current: !hasProfile, done: hasProfile && live });
  setStep('step-identity', { current: hasProfile && live && !verified, done: verified });
  setStep('step-profile', { current: hasProfile && (preview || verified) });

  setText('identity-status', verified ? '확인 완료' : preview ? '본인확인 전' : '확인 필요');
  $('identity-status').classList.toggle('verified', verified);
  $('identity-status').classList.toggle('muted', !verified);
  setText('identity-title', verified ? '본인확인을 완료했습니다.' : '본인확인을 진행해 주세요.');
  setText('identity-description', preview ? '이 단계에서 휴대폰 본인확인을 진행하게 됩니다.' : verified ? '확인된 이름을 기준으로 회원정보를 설정할 수 있습니다.' : '회원 기능을 이용하려면 휴대폰 본인확인이 필요합니다.');
  setText('verify-identity', busy && activeOperation === 'identity' ? '본인확인 진행 중…' : verified ? '본인확인 완료' : '휴대폰 본인확인');
  setText('identity-help', preview ? '미리보기에서는 실제 본인인증이 진행되지 않습니다.' : verified ? '본인확인 정보가 계정에 연결되어 있습니다.' : next.capabilities.identity ? '본인확인 화면에서 안내에 따라 진행해 주세요.' : '본인확인 서비스 연결 후 진행할 수 있습니다.');
  setText('onboarding-note', preview ? '미리보기의 정보는 실제 회원정보로 저장되지 않습니다. 본인확인 상태도 변경되지 않습니다.' : next.profile?.onboarding_ready && verified ? '저장할 닉네임과 실명 공개 여부를 확인해 주세요.' : '본인확인이 필요합니다. 회원정보를 먼저 설정할 수 있습니다.');

  const feedback = next.error || next.notice || '';
  $('feedback').hidden = !feedback;
  $('feedback').dataset.kind = next.error ? 'error' : 'info';
  $('feedback').setAttribute('role', next.error ? 'alert' : 'status');
  $('feedback').setAttribute('aria-live', next.error ? 'assertive' : 'polite');
  setText('feedback', feedback);
  updateAuthorPreview();

  if (previousState && !busy) {
    if (next.error && next.error !== previousState.error) $('feedback').focus();
    else if (hasProfile && !previousState.profile) $('profile-heading').focus({ preventScroll: true });
    else if (!hasProfile && previousState.profile) (live ? $('email') : $('enter-preview')).focus();
    else if (next.notice && next.notice !== previousState.notice && previousState.pending) $('feedback').focus();
  }
}

async function invoke(name, operation) {
  if (state?.pending && !['start', 'logout', 'exit'].includes(name)) return;
  activeOperation = name;
  try { await operation(); }
  catch {
    $('feedback').hidden = false;
    $('feedback').dataset.kind = 'error';
    $('feedback').setAttribute('role', 'alert');
    setText('feedback', '요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    $('feedback').focus();
  } finally { activeOperation = null; }
}

$('email-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!state || state.mode !== 'live' || !state.capabilities.email || !$('email-form').reportValidity()) return;
  invoke('email', () => controller.sendEmail($('email').value.trim()));
});
$('kakao-login').addEventListener('click', () => {
  if (state?.mode === 'live' && state.capabilities.kakao) invoke('kakao', () => controller.loginKakao());
});
$('verify-identity').addEventListener('click', () => {
  if (state?.mode === 'live' && state.capabilities.identity && state.profile && !verifiedProfile()) invoke('identity', () => controller.verifyIdentity());
});
$('enter-preview').addEventListener('click', () => invoke('preview', () => controller.enterPreview()));
$('exit-preview').addEventListener('click', () => invoke('exit', () => controller.exitPreview()));
$('logout').addEventListener('click', () => invoke('logout', () => state.mode === 'preview' ? controller.exitPreview() : controller.logout()));
$('refresh-profile').addEventListener('click', () => invoke('refresh', () => controller.refresh()));

$('nickname').addEventListener('input', () => { $('nickname').setCustomValidity(''); updateAuthorPreview(); });
$('real-name').addEventListener('input', () => { $('real-name').setCustomValidity(''); updateAuthorPreview(); });
$('publish-real-name').addEventListener('change', () => { $('real-name').setCustomValidity(''); updateAuthorPreview(); });
$('profile-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!state?.profile || state.pending) return;
  const nickname = $('nickname').value.trim();
  const realName = $('real-name').value.trim();
  const publishRealName = $('publish-real-name').checked;
  $('nickname').setCustomValidity(nickname.length >= 2 ? '' : '닉네임은 2자 이상 입력해 주세요.');
  $('real-name').setCustomValidity(!publishRealName || realName ? '' : '공개할 이름을 입력해 주세요.');
  if (!$('profile-form').reportValidity()) return;
  invoke('save', () => controller.saveProfile({ nickname, realName, publishRealName }));
});

controller.subscribe(render);
invoke('start', () => controller.start());

# Global Admin Login v1 — 2026-11-16

## 목표
K-Volley Lab 로그인 페이지는 공개하되 회원가입은 열지 않고, 현재 허용된 관리자 계정 1개만 실제 로그인 가능하게 한다.
관리자는 로그인 후 일반 K-Volley Lab 홈페이지를 그대로 사용하면서 향후 회원 UX를 검수한다.

## 인증 구조
- 인증 제공: Supabase Auth
- Project: kvl-members-test-v1
- KVL 홈페이지가 로그인 UI와 전역 세션 UI를 제공
- member-access Edge Function이 Auth 사용자 확인 후 관리자/member 권한을 서버에서 재검증

## 현재 권한 상태
검증 시:
- auth.users: 1
- active admin auth users: 1
- non-admin auth users: 0
- member_accounts: 0

따라서 현재 존재하는 Auth 계정은 활성 관리자 계정 1개뿐이다.

## 공개 로그인
- member-login.html에 이메일/비밀번호 로그인 폼 공개
- signInWithPassword 사용
- 회원가입 UI 없음
- signUp 호출 없음
- Kakao 로그인 없음
- 일반 회원계정이 없으며 member-access를 통과하지 못하면 즉시 local signOut
- 비밀번호나 계정 정보는 저장소에 기록하지 않음

## 전역 로그인 상태
새 모듈:
- assets/js/member-session-v1.mjs

동작:
- 모든 unified-nav 페이지에서 현재 Supabase Auth user 확인
- member-access 서버 권한 확인
- 로그아웃 상태: 사이드바/홈 = 로그인
- 관리자 로그인 상태: 사이드바/홈 = 관리자
- 로그아웃은 현재 브라우저 세션만 종료
- 로그인 상태는 같은 Supabase 프로젝트의 브라우저 세션으로 페이지 간 유지

## 선수·팀 게이트
data/member-access-v1.json:
- enabled=true
- signupEnabled=false
- kakaoEnabled=false
- identityVerificationEnabled=false

보호 대상:
선수, 선수 상세, 팀, 팀 상세, Draft Hub, 선수 비교, 대표팀 세대추적, 기록 및 연결 페이지.

## 선수 프로필
관리자 로그인 상태에서 일반 player.html 주소를 열어도:
- 관리자 여부를 서버에서 확인
- 내 비공개 메모 타임라인 자동 표시
- 새 메모 / 수정 가능
- 비관리자 및 로그아웃 방문자는 일반 프로필만 표시

admin=1 query는 관리자 작업공간에서 돌아가기 링크를 바꾸는 용도로만 유지.

## 검증
- latest main 기준 behind 0
- member login JS syntax PASS
- global session JS syntax PASS
- unified nav / global sidebar JS syntax PASS
- player private-note JS syntax PASS
- login DOM missing refs 0
- signUp call 없음
- 회원가입 버튼 없음
- 관리자 아닌 계정 access 거절 로직 존재
- 홈 로그인 링크 존재
- sidebar login/admin/logout control 존재
- player-team gate enabled=true

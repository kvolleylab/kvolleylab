# Admin Player UX + Member Login Preview v2

## 목표
일반회원 로그인은 공개하지 않은 채 관리자 환경에서 실제 회원 로그인 디자인을 검수하고,
선수/메모/프로필 화면의 정보 위계를 개선한다.

## 일반회원 접근 정책
- `data/member-access-v1.json`의 `enabled=false` 유지.
- 일반회원 가입 OFF.
- Kakao 로그인 OFF.
- 본인확인 OFF.
- 공개 `member-login.html`에는 이메일/비밀번호 입력폼을 제거하고 준비중 화면만 노출.
- 실제 로그인 디자인은 `admin-player-workspace.html` 로그인 후 `로그인 미리보기` 탭에서만 확인.
- Supabase schema/Edge Function/Auth 설정은 이번 변경에서 수정하지 않음.

## 관리자 선수 공간 디자인
### 선수 검색
- 분석 액션 제거, `관심선수 / 메모 / 프로필` 3개 액션으로 단순화.
- 선수명 우선 노출.
- 소속/학교+학년을 두 번째 정보 계층으로 확대.
- 포지션/키/등번호/성별을 작은 fact chip으로 배치.
- 프로 선수는 `프로`, current roster는 `2026-27 등록` 배지 표시.
- PC/모바일 카드 여백과 타이포 조정.

### 메모
- 선수명/소속을 상단 identity 영역에 묶음.
- 작성일과 최근 수정일을 오른쪽에 동시에 표시.
- 메모 제목과 본문 글자 크기/행간 확대.
- 하단 액션은 `선수 프로필 / 메모 수정`으로 단순화.
- revision 번호는 사용자 화면에서 제거.

### 관리자 상단
- 큰 안내 Hero를 축소하고 실제 작업 영역을 위로 이동.
- 요약 카드/탭 간격 축소.
- 분석 기능은 계속 숨김/보류.

## 일반회원 로그인 관리자 미리보기
- 좌측: 브랜드/서비스 가치.
- 우측: 이메일/비밀번호, 로그인 유지, 비밀번호 찾기, 로그인 버튼.
- Kakao 시작 버튼.
- 회원가입 진입 링크.
- 모든 입력/버튼은 관리자 디자인 미리보기일 뿐 실제 동작하지 않음.
- 일반 방문자는 이 미리보기 UI에 접근하지 못함.

## 공개 선수 페이지
- 상세 카드 이름/소속/핵심 수치 글자 크기 확대.
- 카드 padding/간격 확대.
- 모바일 상세카드는 1열로 전환해 가독성 개선.
- 간편보기는 모바일 2열 유지.

## 선수 프로필
- 이름 크기를 과도하지 않게 조정.
- 프로필 카드/통계/정보 영역 간격 축소.
- 관리자 비공개 메모 타임라인 본문/날짜/수정 버튼 가독성 개선.

## 검증
- Admin JS syntax PASS.
- Admin DOM reference missing 0.
- Member preview tab/pane 존재.
- Public member-login form/password input 0.
- Gate enabled=false / signup=false / kakao=false.
- Admin CSS/JS and player/profile CSS cache version updated.
- Existing private data preserved: active admin 1 / bookmarks 2 / notes 5.
- member_accounts 0.
- admin-player-workspace Edge Function ACTIVE.
- member-access Edge Function ACTIVE.

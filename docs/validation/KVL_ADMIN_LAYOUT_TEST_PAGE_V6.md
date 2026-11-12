# KVL 관리자 전용 기존 대회 디자인 테스트 페이지 연결 v6

작성/운영: K-Volley Lab | 2026-11-12 KST  
요청 승인: 기존 관리자 Supabase 백엔드에 연결되는 **관리자 전용 테스트 페이지**를 운영 사이트의 별도 경로에 연결. 실제 경기 결과/대회 디자인 게시까지 승인한 것은 아님.  
개발 기준 main: `743bee83ebd5e171e04557f8a5a7d6a8611d37ce`.  
사전 백엔드: Supabase `admin-competition-layout-drafts` ACTIVE v1, migration `20261111234956_competition_layout_drafts_v1`.  
기존 E2E: Mock-run `43050053674`, 실제 Engine PC/모바일 `43042879036`.

## 1. 별도 관리자 테스트 화면

- 배포 대상: `/admin-competition-layout-test.html`
- 실제 연결 사용자 경로: `https://kvolleylab.com/admin-competition-layout-test.html`
- 기존 `admin-player-workspace.html`은 그대로 유지하며 회원 로그인/선수 메모 기능은 수정하지 않음
- `noindex,nofollow,noarchive`와 **사이트 메뉴 미노출**. 테스트 페이지 이름과 배포 범위의 사용 목적을 표시
- 기존 Supabase Auth 사용자 JWT + Edge Function의 `auth.getUser` 및 `admin_accounts.active=true` 응답을 확인한 후에만 편집 workspace 표시
- 편집 iframe은 최초 `about:blank`이며, 관리자 검증 완료 후에만 로드
- 비관리자는 관리자 데이터와 저장/복원 액션 모두 차단; 클라이언트 내부의 공개 경기 데이터는 별도 공개 자료로 취급
- 운영자 로그아웃 시 iframe 제거, 기존 브라우저 세션에서 자동 로그인 시 서버 검증 재실행

> **중요한 보안 구분:** GitHub Pages의 정적 HTML 경로 자체는 누구나 URL을 알면 요청할 수 있다. `noindex`와 링크 미노출은 **접근 권한 통제 수단이 아니다**. 실제 개인 디자인 임시저장과 관리자 액션은 Supabase의 서버 인증과 비공개 테이블 권한으로 보호한다. 페이지 자체의 HTTP 접근까지 비공개로 만들려면 Cloudflare Access 같은 별도의 인증 게이트가 필요하다. 이번 범위에는 해당 서비스 구성 변경이 포함되지 않는다.

## 2. 기존 완료 대회 데이터만 사용

- 테스트 대상: `university-goseong-men-2026` (2026 전국대학배구 고성대회 남자부, 종료)
- 팀 15, 경기 35, 3조 A/B/C 각 5팀. 우승 인하대, 준우승 한양대, 공동 3위 중부대·조선대
- 관리자 테스트 모드 `?adminTest=goseong`의 편집 iframe은 `/data/competitions/.../config.json`과 `data.json`을 **사이트 동일 출처에서 직접 읽기 전용으로 로드**
- 드롭다운에 고성대회 남자부만 표시; 다른 대회 slug 수동 열기 차단; scope `competition` 고정
- `global`, `domestic`, `international`, `pro` 공통 양식 수정·가져오기·다운로드 UI는 이 테스트에서 비활성화
- 부모 관리자 페이지에서도 저장/복원 scope와 slug를 검사하여 잘못된 범위 설정 거부
- 소스 경기 결과, 순위, 선수명단, 학교/팀/경기 ID, 공식 출처/MASTER 및 V-리그 자동화 데이터 변경 없음

## 3. 화면 미리보기 및 게시 절차 분리

- 편집기 내부는 **간소화된** 데이터 기반 미리보기이며, 운영 페이지와 픽셀상 동일한 DOM/CSS라는 뜻이 아님
- `고성대회 실제 화면 비교`는 기존 `competition-engine.html` 2개 iframe을 같은 origin에서 열어 왼쪽 원본, 오른쪽 CSS 미게시 변경을 표시
- PC 1180px, 모바일 390px/360px, 참가팀/순위/경기일정/한눈에
- 저장과 복원은 private Supabase `competition_layout_drafts`/revision history만 변경하며 공식 배포되는 `config.json`, `data.json`, 대회 CSS는 변경하지 않음
- 홈페이지 게시 버튼 **disabled**: 이 단계에서는 코드/네트워크에도 게시 동작 없음

## 4. 검증

- `tests/kvl-admin-layout-test-gate-v6.test.cjs`: 기밀 관리 경계, slug/scope, iframe lazy loading, 실제 완료 대회 데이터 및 스크립트 구문 확인
- `tests/kvl-goseong-admin-preview-bridge-v2.test.cjs`, `tests/kvl-goseong-layout-compare-v1.test.cjs`, Python preview builder 테스트
- `scripts/qa-admin-layout-site-v6.py`: 실제 브라우저/현재 HTML을 이용하되 Supabase/Auth는 가짜 사용자와 임시 SQLite 시뮬레이터로 대체. 실제 Supabase 요청과 계정 사용 **없음**. 관리자 로그인/52px 저장/새로고침/60px 재저장/이력/복원/409/비관리자 차단/재로그인 복원 검증
- `scripts/qa-goseong-local-engine-v2.py`: 현재 Engine JS/CSS 원본에서 4개 화면×3개 너비×원본/수정=24회 렌더 및 데이터 불변 검증
- workflow: `.github/workflows/kvl-admin-layout-test-page-v6.yml`, read-only, 운영 자동화와 무관
- 실제 관리자 비밀번호/토큰은 테스트 코드나 저장소에 포함하지 않음

## 5. 운영 적용·검증 및 복구

- 본 작업은 테스트 페이지 **별도 URL만** 연결하는 사용자의 승인으로 진행한다.
- DB와 Edge Function은 이전 승인에 따라 이미 별도 설치 완료. 새 DB Migration/Edge deployment 없음.
- GitHub PR에서 배포 파일 목록을 검토하여 홈페이지 핵심 파일이 변경되지 않았는지 확인.
- CI 검수 및 PR 병합 후 실제 HTTPS URL과 Pages 최신 main 반영을 재검증하고, 테스트 URL을 운영자에게 제공.
- 운영자 본인의 계정으로 로그인 → 고성대회 남자부 기존 정보 확인 → 로고/팀명/승패 간격 변경 → 임시저장 → 로그아웃/재로그인·버전 복원 → 실제 PC/모바일 비교 검수.
- 인증 로그인/저장에 실패하면 **실제 세션의 비밀번호나 토큰을 공유하지 말고** 오류 메시지/발생 단계만 제보한다.
- 사용자 승인 없는 대회 페이지 디자인의 정식 변경, 공통 템플릿 전파, Supabase Auth 제도 변경은 금지.
- 복구: 테스트 페이지만 별도 PR에서 숨기거나 revert. 기존 대회·회원 기능/데이터에 영향 없음.

## 기록
본 문서는 검수 중 작성되며 CI·배포 URL의 완료 여부는 **실제 GitHub Actions/운영 사이트 확인 증거**가 있을 때만 갱신한다.

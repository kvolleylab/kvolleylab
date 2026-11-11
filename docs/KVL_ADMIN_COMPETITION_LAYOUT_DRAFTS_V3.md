# KVL 기존 대회 디자인 관리자 v3 — 인증형 임시저장 개발 핸드오프

작성: 2026-11-11 KST  
상태: **CODE IMPLEMENTED / STATIC CHECKED / SERVER NOT DEPLOYED / PRODUCTION NOT APPROVED**  
상위 원칙: AGENTS.md, KVL 운영원칙 MASTER v19, Competition Engine V2, docs/KVL_MODEL_INDEPENDENT_OPERATIONS_v1.md  
기준: 2026-11-11 main `41210ae334c100eaa59018c24f010e5f80fd9ba7`; v2 시안 PR #287 `fbc3c00b7f22914318474177da6eebfc2a67a816`.

## 실제 사용자 목표

관리자는 **이미 등록된 대회를 열어 완성된 데이터를 유지하면서 외형만 편집**한다.

- 참가 국가·팀명이 길 때 한 줄/두 줄/자연 줄바꿈, 글씨 크기 조정
- 국기·로고의 크기, 상하·좌우 이동, 아래 간격 공통 조정
- 순위표의 승·패 열 간격 및 숫자 이동, 행 높이/글자 크기
- HERO 이미지 미리보기, 배치, 글씨 색/크기
- 적용 범위: 전체 기본값 / 국내 / 국제 / 프로 / 대회 하나
- 읽기 전용 경기/순위/선수명단 및 Player_ID, Match_ID, Team Code, MASTER, 라이브 결과 수집·갱신 보존

**새 대회 생성기, CSV 경기 수정기, 운영 결과 자동 덮어쓰기 기능은 요청 범위가 아니다.**

## 이번 v3 구현

1. `admin-competition-layout-v3.html`
   - 기존 관리자용 Supabase 이메일·비밀번호 로그인
   - 서버의 active admin 권한을 별도로 확인
   - 기존 편집기 iframe 사용. 현재 범위 저장·전체 임시저장 불러오기·버전 이력·복원
   - **게시 버튼 의도적으로 비활성화**
   - 기존 파일/JSON 다운로드 편집기를 유지하며 v2 단독 사용도 가능

2. `prototypes/kvl-existing-competition-editor-v2.html`
   - 같은 origin 관리자 화면과 연결하는 `exportCurrentDraft`/`applyServerDrafts` API만 추가
   - 기존 대회 JSON 읽기와 렌더·데이터 변경 금지 정책은 그대로 유지

3. `supabase/functions/_shared/kvl-layout-tokens-v1.mjs`
   - 로고/글자/줄바꿈/승패 간격/HERO **화이트리스트 값만 허용**
   - 사용자 CSS/HTML/스크립트 또는 임의 요청 경로 저장 불가
   - 범위별 key와 데이터 양 제한

4. `supabase/functions/admin-competition-layout-drafts/index.ts`
   - 기존 `kvl_admin_private.admin_accounts(active)`를 재확인
   - action: `status`, `list`, `history`, `save`, `restore`
   - 사용자/범위별 저장, revision 기대값 충돌 409, 이력 스냅샷
   - 운영 JSON, Cloudflare, GitHub, MASTER 쓰기 없음

5. `docs/proposals/KVL_LAYOUT_DRAFTS_SCHEMA_V1.sql`
   - private schema와 revision table만 정의하는 **검토용 스키마**
   - Supabase CLI migration 파일도 아니며, **실제 DB에서 실행하지 않음**
   - 별도 승인 뒤 CLI에서 migrations 생성, 보안 검사, DB 검증 및 Edge Function 배포 필요

6. `tests/kvl-admin-layout-drafts-v3.test.mjs`
   - 토큰/범위 허용, 데이터 불변성, 인증/버전 보호 경계에 대한 로컬 단위 검사 소스

## 실행 전 확인해야 할 항목

- 현재 Admin 계정과 Supabase 연결의 정상 작동 및 프로젝트 접근권
- `supabase migration new`로 생성한 정식 migration 후 private schema DDL 실행
- 관리자 이외 계정 403, 인증 만료 401, 비정상 scope/token 400, 동시 저장 충돌 409
- 임시저장/버전 복원 후 페이지 새로고침 및 재로그인 회귀
- 공통 변경이 여자부 로즈·FIVB/AVC/GAMES 등 테마를 침범하지 않는지 비교
- 운영 페이지에 곧바로 적용되지 않으며 실제 Competition Engine V2 DOM/CSS 미리보기 연결은 **v4 후속 과제**
- PC 1180px, 모바일 390/360px, 각 탭·팀 라우팅·달력·순위 및 V-리그 라이브 갱신 회귀
- 계정 및 DB 인증값을 절대 GitHub/브라우저 코드·콘솔에 기록하지 않기

## 작업 및 검증 근거

- feature branch에서만 신규 코드 작업; **main·실 운영 DB·GitHub Actions·Cloudflare 수정 없음**
- GitHub readback으로 v2 편집기 통합 API와 신규 파일 확인
- isolate JS 검증: 15개 assert PASS (토큰 값/범위, 악성 CSS 거부, scope 검증, revision 값, client/editor JS 구문, auth/version boundary)
- Edge Function TypeScript 배포/SQL 트랜잭션과 실제 401/403/409, 관리자 로그인 브라우저 통합 검사는 **NOT EXECUTED**
- 이전 단독 편집기의 축약 미리보기와 진짜 운영 Engine 화면은 **동일하지 않음**; v3도 축약 미리보기 유지

## 다음 개발 목표

**v4**: 실제 Engine V2 DOM을 그대로 관리자 화면에서 미리보기 하는 브리지 → PC/모바일 조작 결과 비교 → 스타일 토큰의 적용 범위 검증 → 관리자 승인과 보호된 GitHub PR 게시 파이프라인(별도 승인) → 버전 롤백. 대회 하나(`university-goseong-men-2026`)를 완료 경기 상태 그대로 시험한 뒤 확장. 본 v3은 편집자가 독립적으로 초안을 저장하는 기반만 제공한다.

## 복구 방법

본 브랜치를 병합하지 않으면 운영 영향은 없다. 나중에 배포가 승인된 후에도 데이터 계약·트리거를 수정하는 작업은 별도 PR로 분리하고, 배포 전 private DB 백업·version history 복구를 확인한다.

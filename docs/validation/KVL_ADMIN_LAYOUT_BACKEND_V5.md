# KVL 기존 대회 관리자 디자인 저장 백엔드 — 실사용 설치 기록 v5

작성일: 2026-11-12 KST  
승인: 사용자가 **기존 Supabase 프로젝트에 전용 테이블 2개와 관리자용 Edge Function 1개 추가**를 명시적으로 승인.  
배포 상태: **SUPABASE DATABASE APPLIED + EDGE FUNCTION ACTIVE / READ-ONLY LIVE BOUNDARY VERIFIED / AUTHENTICATED CRUD NOT VERIFIED / PUBLIC SITE NOT DEPLOYED**

## 1. 대상 및 보호

- Supabase 프로젝트: `kvl-members-test-v1`, ref `byaukvbwdhextiqycrds`, 서울 `ap-northeast-2`
- 기존 관리자 로그인/선수 메모와 같은 프로젝트를 재사용.
- 운영 GitHub `main`, `kvolleylab.com` 페이지, Cloudflare Workers/Pages, 대회 데이터, Player/Match ID, V-리그 결과 자동화, Google Drive MASTER 불변.
- 선수 메모 `admin-player-workspace`와 일반회원 `member-access` Edge Function은 교체하지 않음.
- 공개 회원 가입 및 기존 운영 Auth 설정은 수정하지 않음.

## 2. Supabase SQL 적용

`mcp__Supabase__apply_migration` 성공. 실제 등록 기록:

- `20261111234956_competition_layout_drafts_v1`
- 소스: `supabase/migrations/20261111234956_competition_layout_drafts_v1.sql` (실제 적용한 DDL 기록)
- 기존 `kvl_admin_private` 스키마 내부 추가:
  - `competition_layout_drafts` — 사용자/범위/slug별 디자인 설정, 수정 버전
  - `competition_layout_draft_revisions` — 버전별 설정 이력, 복원 근거

**확인된 접근 보호**:
- 두 테이블 모두 `relrowsecurity=true` (RLS 켜짐)
- `anon` / `authenticated` 테이블 직접 SELECT/INSERT 권한 = `false`
- 데이터 API에 공개하거나 직접 클라이언트 쓰기 권한을 부여하지 않음.
- 관리자 전용 Edge Function에서 실제 user JWT를 `auth.getUser()`로 검증하고 `kvl_admin_private.admin_accounts.active=true`를 확인한 뒤, 비공개 DB 경로에서 CRUD 수행.
- 새 테이블은 최초 설치 후 모두 빈 상태. 기존 메모 5건/관심선수 2건 유지 (검증 당시 수치).

보안 어드바이저의 `rls_enabled_no_policy` **INFO**는 공개 role의 접근을 막는 의도된 전용 테이블 보호 구조에도 표시됨. 직접 GRANT가 없고 RLS가 켜져 있음을 따로 검증. 기존 Auth `auth_leaked_password_protection` **WARN**은 별개의 기존 설정 문제이며 이번 승인 범위 밖이므로 수정하지 않음.

## 3. Edge Function 실제 배포

- 함수: `admin-competition-layout-drafts`
- ID: `19dca43e-1b35-4646-8ce3-85ae1641461d`
- 버전: **v1** · 상태: **ACTIVE**
- `verify_jwt=true`, 허용된 브라우저 출처 `https://kvolleylab.com`
- 서버 코드: `supabase/functions/admin-competition-layout-drafts/index.ts`
- 공용 토큰 계약: `supabase/functions/_shared/kvl-layout-tokens-v1.mjs`
- 배포 도구가 단일 함수 루트 파일들을 요구하므로, 배포 시에만 import 경로 `../_shared/...` → `./_shared/...`로 변경하고 `_shared/kvl-layout-tokens-v1.mjs`를 해당 배포 파일 목록에 포함. 기능 코드는 동일.
- `status`, `list`, `history`, `save`, `restore`; 저장값은 허용된 디자인 속성만 받고, 동시 쓰기는 기대 revision으로 충돌 방지.
- 게시 API, GitHub 쓰기, Cloudflare 및 결과 JSON 덮어쓰기는 **존재하지 않음**.

## 4. 살아 있는 함수에 대한 비인증 경계 확인

2026-11-12 KST [GitHub Actions run #43123488916](https://github.com/kvolleylab/kvolleylab/actions/runs/43123488916) `success`.

- 사이트 출처 CORS 사전 요청: **204**, 허용 Origin은 KVL 사이트
- 자격증명 없는 POST: **401**, 데이터 거부
- 유효하지 않은 JWT POST: **401**, 데이터 거부
- 테스트 사용자 자격증명/개인정보 사용하지 않음, API DB 기록 없음

재현 스크립트: `scripts/verify-admin-layout-edge-boundary-v5.py`.

이것은 **실제 배포된 함수의 비인증 차단과 CORS 테스트**다. 실제 관리자 JWT로 `save` → `list` → `history` → `restore`를 성공 검증한 것은 아니다. 기존 [모의 브라우저 UI E2E #43050053674](https://github.com/kvolleylab/kvolleylab/actions/runs/43050053674)는 별개이며 실제 Supabase 저장 성공 증거로 사용하면 안 된다.

## 5. 다음 실사용 게이트

관리자 UI 페이지 `admin-competition-layout-v3.html`는 **아직 `main`/Pages에 병합·공개되지 않음.** 실제 관리자는 운영 KVL 사이트와 같은 origin으로 페이지가 배치된 뒤 기존 계정으로만 접속할 수 있어야 한다. 구체적으로 다음 순서:

1. 별도의 사용자 승인 후 관리자 전용 경로를 기능 제한·검색 제외 상태로 운영 사이트에 배치. 일반 사용자에게 편집 UI를 제공하지 않음.
2. **종료된 `university-goseong-men-2026` 단일 대회**를 불러와 로고 크기 52px 등 디자인 저장.
3. 브라우저 새로고침/실제 로그아웃·재로그인, 버전 목록/복원, 동시 충돌 409를 확인. 기존 선수 메모와 자동화 회귀 확인.
4. 모바일 360/390과 PC 1180에서 실 Engine 비교 및 실제 디자인 차이 검수.
5. 최종 홈페이지의 **디자인 게시**는 임시저장과 별개로 사용자의 승인 뒤 별도의 PR·배포 게이트가 필요. 자동 게시 절대 금지.

**복구**: 현재 새 테이블이 비어 있으며 기존 다른 운영 테이블/함수를 수정하지 않았음. 성급한 삭제 대신 기능 접근 중단(관리자 UI 미배포) 상태로 유지하고 후속 PR에서 안전하게 점검한다. 기록된 버전의 DB 구조를 다음 시즌에도 재사용할 수 있도록 유지한다.

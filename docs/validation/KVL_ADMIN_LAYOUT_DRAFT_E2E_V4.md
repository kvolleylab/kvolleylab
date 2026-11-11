# KVL 기존 대회 관리자 디자인 임시저장 — 격리 E2E 검증 v4

작성: 2026-11-12 KST  
상태: **DRAFT CODE IMPLEMENTED / ISOLATED BROWSER E2E VERIFIED / LIVE SUPABASE NOT DEPLOYED**  
대상 대회: `university-goseong-men-2026` — 완료, 15팀, 35경기, A/B/C조  
운영 사이트: `https://kvolleylab.com` — **변경 없음**

## 사용자 요구 및 개발 범위

이미 완성된 대회의 경기 결과·순위·선수명단을 그대로 유지한 채 관리자 화면에서 글씨, 줄바꿈, 로고 크기·위치, 승패 열 간격 등 **디자인만 수정해 저장**한다. 저장 후 재접속해 같은 값을 다시 읽고, 이전 버전을 복원하며, 두 창에서 동시 변경한 경우 충돌 경고를 표시해야 한다.

이번 검증은 운영 중인 Supabase를 변경하지 않고 **현재 HTML 관리자 UI + 현재 bundled Supabase JS + 실제 고성대회 공개 JSON을 Chrome에서 실행**하되, OAuth/Auth, 함수 호출에 한해 테스트 전용 가짜 인증과 SQLite 저장소로 대체했다.

## 실제 연결 상태 확인 (읽기 전용)

2026-11-12 점검 당시 Supabase 계정에는 `kvl-members-test-v1` 1개 프로젝트가 연결되어 있었으며 기존 관리자 선수 메모·분석 기능의 `admin-player-workspace` Edge Function 및 관리자계정, notes, bookmarks 등이 존재했다.

- `kvl_admin_private.competition_layout_drafts` / `competition_layout_draft_revisions` 테이블 없음
- `admin-competition-layout-drafts` Edge Function 없음
- 따라서 이번 개발에서는 **실제 Supabase DB migration 또는 Edge Function 배포를 실행하지 않았다**.
- 운영 관리자 계정의 비밀번호/세션은 접근·공유·로그 기록하지 않았다.

기존 `docs/proposals/KVL_LAYOUT_DRAFTS_SCHEMA_V1.sql` 및 `supabase/functions/admin-competition-layout-drafts/index.ts`는 향후 실제 승인 이후 검토·배포할 **미배포 코드**이다. 브라우저 E2E 통과로 데이터베이스 SQL/RLS, Supabase Auth `getUser()`, 실제 Edge Function, 또는 관리자 실계정 테스트 성공이라고 주장하지 않는다.

## 변경점

1. `admin-competition-layout-v3.html`
   - Supabase Functions 응답이 409/403 등 비-2xx일 때 `FunctionsHttpError.context.json()`의 `error` 값을 해석하여 정확히 표시
   - `readyEditor()`를 추가하여 새로고침 시 iframe 편집기가 생성된 다음 저장된 디자인 설정을 복원하도록 수정
2. `scripts/build-goseong-local-engine-preview-v2.py`
   - 작업용 복제본에 기존 관리자 페이지, 기존 대회 편집기, 실제 Supabase JS 번들을 추가
3. `scripts/qa-goseong-local-engine-v2.py`
   - Windows localhost에서 `.mjs` 파일을 반드시 `text/javascript`로 제공하도록 보완
4. `scripts/qa-admin-layout-draft-e2e-v4.py`
   - Windows Chrome에서 테스트 전용 관리자/일반 계정으로 가짜 로그인
   - 브라우저 호출을 모두 Playwright에서 intercept. 실제 `supabase.co`에 요청을 내보내지 않음
   - 변경값을 **별도 임시 SQLite DB**에 기록해 새로고침/로그인 변경 이후에도 남아 있는지 검증
   - 저장버전, 복원, 409 충돌, 권한거부와 화면 동작 검사
5. `.github/workflows/kvl-admin-layout-draft-persistence-v4.yml`
   - Windows GitHub Actions에서 Playwright + 기본 한글 폰트로 재현 가능한 read-only E2E 검사. 결과와 스크린샷을 아티팩트로 보관.

## 검증 증거 — 완료

**GitHub Actions:** [Run #43049257623](https://github.com/kvolleylab/kvolleylab/actions/runs/43049257623) — `conclusion: success`.

**아티팩트:** `kvl-admin-layout-draft-e2e-v4-43049257623` (ID `13869285766`)  
구성: `admin-draft-e2e.json`, `draft-save.png`, `draft-restored.png`, `draft-conflict.png`.

실제 `admin-draft-e2e.json` 확인:
```json
{
  "status": "PASS",
  "mockedSupabase": true,
  "mockedAuth": true,
  "realSupabaseWrites": false,
  "productionDeploy": false,
  "pageErrors": [],
  "network": {"supabase": 16, "github": 6, "blocked": 0},
  "finalDraftRevision": 4
}
```

**검증된 시나리오**

| 순서 | 작업 | 확인 |
|---|---|---|
| 1 | 비로그인 상태 관리자 로그인 창 | PASS |
| 2 | 모의 관리자 로그인 후 기존 고성대회 불러오기 | PASS |
| 3 | 로고크기 52px 저장 (v1) | PASS |
| 4 | 페이지 새로고침 → 52px 복원 | PASS |
| 5 | 로고크기 60px 재저장 (v2) | PASS |
| 6 | 변경 이력에서 v1 선택 → 52px 복원, 새 v3 | PASS |
| 7 | 외부 변경 발생 시 오래된 버전 저장 → 409 충돌 안내 | PASS |
| 8 | 일반 사용자 로그인 → 관리자 접근 차단 | PASS |

재현 중 확인·수정한 결함: Windows Python test HTTP 서버가 `.mjs`를 `text/plain`으로 제공한 문제, select option의 Playwright visible/attached 차이, Windows의 SQLite 커넥션 정리 누락. 이후 마지막 run 성공으로 확인.

## 보호 및 향후 운영 전 검증

- 실제 **경기 35개/참가팀 15개/순위 3조, Team/Match/Player IDs/공식 출처/자동화 모두 미변경**
- 공개 `main`, GitHub Pages, Cloudflare, KOVO/V-리그 Collector 및 실제 Supabase DB/Edge Function **미변경**
- 이번 검증은 모의 서버이므로 실제 PostgreSQL `jsonb`, 트랜잭션, RLS, Auth JWT, SQL 충돌 동작까지 입증하지는 않는다.
- 운영 적용에 앞서 `kvl_admin_private` 스키마/DB migration, 별도의 draft-only Edge Function을 **명시적으로 승인받은 뒤** 적용하고, 관리자 계정에서 저장·재로그인·복원·비관리자 403·동시 409를 재검증해야 한다.
- 관리자 화면은 실제 KVL 사이트와 동일 출처에서 검수할 필요가 있다. 테스트 성공만으로 현재 사이트 배포를 승인받았다고 해석하지 않는다.
- 로고/글씨/승패 디자인의 게시 및 전국대학배구 이외의 공통 적용은 후속 단계에서 별도 검수와 승인 진행.

**복구**: Draft PR 브랜치를 미병합으로 유지하면 운영 영향 없음. 테스트 SQLite 저장소는 GitHub Runner의 임시 폴더이며 종료 시 삭제. 

## 2026-11-12 재로그인 검증 확장

최종 run: [GitHub Actions #43050053674](https://github.com/kvolleylab/kvolleylab/actions/runs/43050053674), `completed/success`.

최종 아티팩트: `kvl-admin-layout-draft-e2e-v4-43050053674` (ID `13868443739`). 모의 관리자 로그아웃 → 일반 사용자 로그인 거부 → **새 관리자 로그인 후 기존 디자인 설정(로고 52px) 자동 복원**까지 추가 검증해 총 9개 E2E 시나리오 `PASS`.

- `admin-draft-e2e.json`: `status=PASS`, `pageErrors=[]`, `mockedSupabase=true`, `mockedAuth=true`, `realSupabaseWrites=false`, `productionDeploy=false`.
- 기존 테스트의 409 revision 충돌 표시와 v1→v2→v3 복원도 재확인.
- 실제 운영 관리자 비밀번호 사용/실 Supabase 연결/DB·Edge 배포는 실시하지 않음. 이는 **격리 모의 서비스 기반 실브라우저 테스트**임.

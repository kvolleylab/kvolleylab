# KVL 관리자 디자인 저장 internal_error — JSONB 이중 인코딩 수정 v1

- 최초 확인: 2026-11-13 15:48 UTC, 운영 Supabase Edge Function `admin-competition-layout-drafts`
- 사용자 증거: 고성대회 남자부 편집기에서 `nameSize=15` 조정 뒤 금색 '현재 범위 임시저장' 클릭, 화면에 `internal_error`.
- 서버 실제 증거: `function_edge_logs`의 HTTP 500 4건(15:48:33, 34, 41, 42 UTC); 같은 시각 `postgres_logs`에 `competition_layout_drafts_tokens_check` 위반. 선행 `status`/`list` 요청은 200.
- 데이터베이스 대조: 임시저장 0행, 수정 이력 0행, 활성 관리자 1명. 잘못된 값은 DB 제약조건에 의해 거부되었고, 기록 및 공식 경기결과는 변경되지 않음.

## 근본 원인

기존 Edge Function은 `postgres@3.4.5` Postgres.js로 `jsonb` 컬럼에 **이미 `JSON.stringify`한 JS 문자열**을 `${JSON.stringify(tokens)}::jsonb`로 바인딩했다. 드라이버가 `jsonb` OID를 인식해 문자열을 한 번 더 JSON 인코딩하면, PostgreSQL에는 JSON 객체가 아닌 JSON 문자열 스칼라가 전달된다.

기존 데이터베이스 `CHECK (jsonb_typeof(tokens) = 'object' AND pg_column_size(tokens) <= 8192)`가 정상적으로 이 문제를 차단하므로, **DB 제약은 완화하거나 제거하지 않는다**.

읽기 전용 SQL 재현:
```sql
select jsonb_typeof('{"nameSize":15}'::text::jsonb) as correct_type,
       jsonb_typeof(to_jsonb('{"nameSize":15}'::text)) as double_encoded_type;
-- object / string
```

## 최소 수정

기존 4개 경로만 모두 변경:

```diff
- ${JSON.stringify(tokens)}::jsonb
+ ${JSON.stringify(tokens)}::text::jsonb
```

- 매개변수를 먼저 `text`로 바인딩해 SQL 문자열 값을 얻은 후, PostgreSQL에서 문자열 내용을 `jsonb` 객체로 파싱한다.
- 신규 저장 / 저장값 수정 / 저장 이력 / 과거 버전 복원을 모두 동일하게 처리.
- 기존 `cleanTokens`, Supabase `auth.getUser`, `admin_accounts.active=true`, `revision_conflict`, private RLS/revokes, 공개 홈페이지 게시 금지 그대로 유지.
- UI/Pages/경기 JSON/선수/자동화/MASTER 변경 없음.

## 테스트

1. `tests/kvl-layout-draft-jsonb-v1.test.cjs`: 4개 JSONB 쓰기 경로의 `::text::jsonb`와 인증·이력·미게시 불변성.
2. `tests/kvl-layout-draft-jsonb-postgres-v1.cjs`: **일회용 PostgreSQL 17** + **Postgres.js 3.4.5**로 기존 잘못된 바인딩을 재현하고, 수정한 JSONB 객체의 저장·수정·이력·복원을 트랜잭션 단위로 확인. 운영 DB 자격증명이나 데이터를 사용하지 않는다.
3. `.github/workflows/kvl-layout-jsonb-binding-v1.yml`: GitHub PR에서 테스트 수행. **CI 성공 전까지 배포 완료라고 표시하지 않는다**.

## 운영 적용 계획·복구

- 기존 관리자 디자인 임시저장 기능 버그픽스에 한해 `admin-competition-layout-drafts` Edge Function v2를 재배포한다. `verify_jwt=true`, 공유 코드 및 Auth 설정 유지.
- 기존 `admin-player-workspace`/회원 기능과 `kvolleylab.com` 정적 사이트는 변경하지 않는다.
- 배포 뒤 비인증 401/잘못된 토큰 401/CORS 204, 기존 새 테이블/메모 데이터 수/보안 상태 확인.
- **실제 로그인한 사용자의 save/list/history/restore는 계정 토큰 없이 수행할 수 없으므로 사용자가 재시험해야 성공 여부가 확인된다.** 비밀번호나 토큰을 공유받지 않는다.
- 문제 시 Supabase Edge Function 배포 이력에서 수정 전 v1(검증 기준)을 확인할 수 있지만, v1은 저장 오류가 있으므로 무작정 복구하지 않고 장애를 보고한 뒤 다음 수정안을 검토한다.

## 2026-11-14 KST — 실제 운영 Edge Function v2 반영

- GitHub PR: [#326](https://github.com/kvolleylab/kvolleylab/pull/326) (**Draft, 미병합**; 이전 backend #322 위에 올린 소스 수정).
- 실제 Postgres.js 3.4.5 + 격리 PostgreSQL 17 회귀 테스트: [GitHub Actions #43458140557](https://github.com/kvolleylab/kvolleylab/actions/runs/43458140557) `success`. 기존 버그 바인딩 `23514` 재현, 변경 후 JSONB 객체 `INSERT`, `UPDATE`, history, restore 모두 PASS. Static 11건 조건 검사도 PASS.
- **Edge Function 실제 재배포:** `byaukvbwdhextiqycrds` / `admin-competition-layout-drafts` **ACTIVE v2**, 기존 함수 ID 유지, `verify_jwt=true`.
- 배포된 코드 재조회: `::text::jsonb` 4곳, 기존 `::jsonb` 잘못된 바인딩 0곳, `auth.getUser`와 `admin_accounts.active=true`, 게시 기능 비활성 유지.
- 보존 확인: 기존 `admin-player-workspace` ACTIVE v4, `member-access` ACTIVE v2; 사용자 메모 5건/관심선수 2건 동일, 테스트 대회 결과 및 다른 테이블 변경 없음.
- 새 private 디자인 테이블: drafts 0행, revision 0행. 이 데이터 수는 **실제 관리자 로그인 후 첫 재시험이 아직 이뤄지지 않았음을 의미**한다.
- `anon` 직접 조회권한 없음, `authenticated` 직접 쓰기권한 없음; 기존 비공개 설계 유지.
- 이 단계에서 실제 관리자 인증 세션의 `save`→`list`→`history`까지는 테스트하지 않았으므로 **성공 확정 표현 금지**. 사용자 브라우저에서 고성대회 남자부의 `nameSize=15` 또는 `logoSize=52`를 다시 선택하고 임시저장을 재시험해야 한다.
- 운영 사이트 HTML/GitHub main/Competition Engine V2/경기·선수 MASTER/자동화는 변경하지 않았다.


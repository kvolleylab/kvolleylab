# KVL Quality Audit v1 점검 결과

확인 시각(KST): 2026-10-30T00:49:10+09:00  
대상 commit: `58311bec50e6cf94079b6c7f6b4152bc9816cf7a`  
읽기 전용 점검입니다. PASS는 명시된 검사 범위에만 적용됩니다.

| 검사 | 결과 | 건수 | 설명 |
|---|---|---:|---|
| matches:kovo-cup-men-2026 | PASS | 12 | 경과 시간으로 경기 종료를 추정하지 않음; KST·식별키·세트 합계 검사 |
| standings:kovo-cup-men-2026 | PASS | 23 | 조별/정규리그 승패·승점 및 컵 결선 연결; 동률 규정 전체는 기존 엔진 테스트 사용 |
| matches:kovo-cup-women-2026 | PASS | 12 | 경과 시간으로 경기 종료를 추정하지 않음; KST·식별키·세트 합계 검사 |
| standings:kovo-cup-women-2026 | PASS | 23 | 조별/정규리그 승패·승점 및 컵 결선 연결; 동률 규정 전체는 기존 엔진 테스트 사용 |
| matches:v-league-men-2026-27 | PASS | 126 | 경과 시간으로 경기 종료를 추정하지 않음; KST·식별키·세트 합계 검사 |
| standings:v-league-men-2026-27 | PASS | 21 | 조별/정규리그 승패·승점 및 컵 결선 연결; 동률 규정 전체는 기존 엔진 테스트 사용 |
| matches:v-league-women-2026-27 | PASS | 126 | 경과 시간으로 경기 종료를 추정하지 않음; KST·식별키·세트 합계 검사 |
| standings:v-league-women-2026-27 | PASS | 21 | 조별/정규리그 승패·승점 및 컵 결선 연결; 동률 규정 전체는 기존 엔진 테스트 사용 |
| competition-links | PASS | 276 | 4개 대상 대회의 경기/대회 ID 중복 및 남녀부·시즌 연결 |
| players:canonical | PASS | 1842 | 같은 원장 안의 ID 검사; 시즌 Snapshot 반복은 중복 ID 발급과 구분 |
| rosters:kovo-cup-men-2026 | PASS | 130 | 대회 당시 Snapshot 기준; 이름만으로 소속/신원 확정하지 않음 |
| rosters:kovo-cup-women-2026 | PASS | 121 | 대회 당시 Snapshot 기준; 이름만으로 소속/신원 확정하지 않음 |
| rosters:v-league-men-2026-27 | PASS | 131 | 대회 당시 Snapshot 기준; 이름만으로 소속/신원 확정하지 않음 |
| rosters:v-league-women-2026-27 | PASS | 121 | 대회 당시 Snapshot 기준; 이름만으로 소속/신원 확정하지 않음 |
| players:data/master/player_master_229_v2.json | PASS | 229 | 같은 원장 안의 ID 검사; 시즌 Snapshot 반복은 중복 ID 발급과 구분 |
| players:data/master/player_master_school_v1.json | PASS | 6 | 같은 원장 안의 ID 검사; 시즌 Snapshot 반복은 중복 ID 발급과 구분 |
| players:data/master/player_master_international_v1.json | PASS | 221 | 같은 원장 안의 ID 검사; 시즌 Snapshot 반복은 중복 ID 발급과 구분 |
| workflow-safety | FAIL | 50 | 기존 권한/스케줄은 변경하지 않음. 쓰기 권한은 용도 검수 후보 |
| paths | PASS | 138 | 핵심 HTML의 정적 링크/자산; 동적 프로필 경로는 기존 DOM 테스트에서 검사 |
| security:json | FAIL | 32200 | 명시적 비공개·인증정보·검수 전 필드 탐지. 무표식 레거시의 공개등급은 별도 미검증 |
| security:legacy-classification | NOT VERIFIED | 4583 | 명시적 access_level 없는 선수 레코드; 기존 검수 근거의 별도 매핑 필요 |
| notices | PASS | 2 | 기존 공시 검수 큐 재사용; 후속 검수로 해결된 공시 제외. 현재 등록 자동 확정 아님 |
| drive:cup | PASS | 24 | 전체 명시 범위 비교 |
| drive:league | PASS | 252 | 전체 명시 범위 비교 |
| official:main | PASS | 4 | 기존 수집기 읽기 성공; 경기 비교는 통합 관측 검사 |
| official:female | PASS | 4 | 기존 수집기 읽기 성공; 경기 비교는 통합 관측 검사 |
| official:ended | PASS | 5 | 기존 수집기 읽기 성공; 경기 비교는 통합 관측 검사 |
| official:observed | PASS | 11 | 관측된 경기만 비교; 전체 시즌 검증 아님 |
| official:full-season | NOT VERIFIED | 0 | 기존 rolling API는 일부 경기만 제공. 전체 컵/시즌 공식 결과·세트 점수 전수 대조는 미완료 |
| deployed:kovo-cup-men-2026 | PASS | 12 | 운영 JSON과 검사 commit 구조 비교; 배포 시각의 증명과 구분 |
| deployed:kovo-cup-women-2026 | PASS | 12 | 운영 JSON과 검사 commit 구조 비교; 배포 시각의 증명과 구분 |
| deployed:v-league-men-2026-27 | PASS | 126 | 운영 JSON과 검사 commit 구조 비교; 배포 시각의 증명과 구분 |
| deployed:v-league-women-2026-27 | PASS | 126 | 운영 JSON과 검사 commit 구조 비교; 배포 시각의 증명과 구분 |
| regression:competition-v2-config.test.cjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:competition-v2-data-contract.test.cjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:competition-v2-production-starter.test.cjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:competition-calendar-gender.test.cjs | PASS | 5 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:kovo-cup-production-template-20261027.test.cjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:competition-v2-pro-cup-pool-columns.test.cjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:kovo-cup-desktop-matchup-alignment.test.cjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:kovo-cup-rosters.test.cjs | PASS | 10 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:vleague-rosters.test.cjs | PASS | 17 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:vleague-match-summary.test.cjs | PASS | 9 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:vleague-postseason.test.cjs | PASS | 6 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:domestic-home-v2.test.cjs | PASS | 21 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:draft-applicants.test.mjs | PASS | 7 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:draft-lottery.test.mjs | PASS | 4 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:draft-profile-routing.test.mjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:player-reviewed-identities.test.mjs | PASS | 6 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:player-integration.test.mjs | FAIL | 15 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:player-profile-coverage.test.mjs | PASS | 1 | 기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용 |
| regression:python | PASS | 127 | 기존 수집기 및 신규 audit 합성 테스트 |
| ui:runner | NOT VERIFIED | 0 | Playwright/Chromium 실행 환경 미준비 |
| drive:roster-full | NOT VERIFIED | 0 | 선수 MASTER는 검수중. v1은 경기 MASTER 비교만 인증 adapter 제공 |
| sync:timestamps | NOT VERIFIED | 0 | Drive 수정 시각/commit 시각은 실제 배포 시각과 다름; 배포 manifest 미설정 |
| draft:selection-results | NOT RUN | 0 | 운영 main의 신청자/프로필은 기존 테스트. 미병합 결과 페이지는 별도 PR 범위 |
| security:release-enforcement | NOT VERIFIED | 0 | 감사 gate 구현; required check/실제 배포 차단 연결은 승인 후 설정 |
| audit:execution | PASS | 0 | 점검 프로그램 실행 완료; 데이터 검증 결과와 구분 |

## 오류·검수 항목

| 오류 ID | 심각도 | 검증 상태 | 규칙 | 경로 |
|---|---|---|---|---|
| KVL-QA-F893D12902695F92 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/apply-schedules-light-theme.yml |
| KVL-QA-808E87682DB4AF8B | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/apply-university-v7-to-site.yml |
| KVL-QA-81F500EF9CAEB467 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/audit-vnl-18-country-pages.yml |
| KVL-QA-BD80CDB8D941365E | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/audit-vnl-player-master-country-coverage.yml |
| KVL-QA-33E93763371830BA | P2 | CONFIRMED | WORKFLOW_YAML | .github/workflows/build-player-timeline-v1.yml |
| KVL-QA-9AF408624F6D48A0 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/build-university-player-master-batch.yml |
| KVL-QA-C86EE5EB60755B49 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/build-vnl-match-master-v1.yml |
| KVL-QA-A965AF7EF78DF107 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/build-vnl-match-results-v1.yml |
| KVL-QA-C8DCE2EF09390771 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/build-vnl-standings-master-v1.yml |
| KVL-QA-1CF493D851E6F666 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/complete-final-four-vnl-rosters.yml |
| KVL-QA-4AF76F765DE8B3CF | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/connect-all-vnl-player-master-v1.yml |
| KVL-QA-ED1252BAFE2C0358 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/connect-schedules-to-match-master-v1.yml |
| KVL-QA-26469250C2757F15 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/connect-usa-player-master-v1.yml |
| KVL-QA-7680EE5A3A32F8B4 | P2 | CONFIRMED | WORKFLOW_YAML | .github/workflows/connect-vnl-schedules-v1.yml |
| KVL-QA-BDB20DE3081D56C3 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/connect-vnl-standings-ui-v1.yml |
| KVL-QA-ED180FB5B1A348BC | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/expand-player-timeline-all-v1.yml |
| KVL-QA-831B8633C5547D6C | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/improve-schedule-visibility.yml |
| KVL-QA-5559320A4075DD77 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/install-global-light-theme.yml |
| KVL-QA-38344311ED5EB758 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/install-unified-navigation.yml |
| KVL-QA-F75F58E7D301A86A | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/kovo-official-notices-collector.yml |
| KVL-QA-BA270EB09B454969 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-argentina-vnl-page.yml |
| KVL-QA-358116836400DADE | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-belgium-vnl-page.yml |
| KVL-QA-894179E42109FAC6 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-bulgaria-china-ukraine-vnl.yml |
| KVL-QA-FC91214A51D6B8E6 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-canada-vnl-page.yml |
| KVL-QA-98CE7E9BF8D73611 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-cuba-vnl-page.yml |
| KVL-QA-85CEE1B18705777E | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-france-vnl-page.yml |
| KVL-QA-069304FEE16D4A1C | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-germany-serbia-turkiye-vnl.yml |
| KVL-QA-C974E749E02A926A | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-italy-vnl-page.yml |
| KVL-QA-F8DA20A7C3DCC851 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/link-usa-iran-slovenia-vnl.yml |
| KVL-QA-B0497870D110AD07 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/materialize-reviewed-batches.yml |
| KVL-QA-8D0D4A00734A4424 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/populate-six-v25-rosters.yml |
| KVL-QA-440E643B078A6C4A | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/rebuild-final-player-master-229.yml |
| KVL-QA-BBB6F1592695C53C | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/register-four-static-vnl-teams.yml |
| KVL-QA-E2BEEE4E5F3AAFD6 | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/register-kyungil-player-master.yml |
| KVL-QA-63C59019AB335BFE | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/register-skku-player-master.yml |
| KVL-QA-05AA485D14D3187A | P3 | SUSPECTED | WORKFLOW_WRITE_REVIEW | .github/workflows/run-populate-six-v25-rosters.yml |
| KVL-QA-CF9992DBB4ABFE4F | P2 | CONFIRMED | JSON_PARSE | data/master/vnl-2026-men-matches-v2.json |
| KVL-QA-F08B7B55D038BE39 | P2 | CONFIRMED | REGRESSION_FAILED | tests/player-integration.test.mjs |

알림 후보 4건. 시범 실행은 Issue를 게시하지 않습니다.
민감 항목의 원문·값·개인 메모·인증정보는 이 보고서에 포함하지 않습니다.

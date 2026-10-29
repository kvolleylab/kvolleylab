# 기존 자동화 현황·중복 분석 v1

기준 main: `58311bec50e6cf94079b6c7f6b4152bc9816cf7a`. 조사일: 2026-10-30 KST.

기존 workflow 49개를 모두 열거했다. 파싱 가능한 workflow 중 최상위 `contents: write` 선언은 34개다. 쓰기 권한은 필요성 검토 대상(P3/SUSPECTED)이며 보안 유출 확정이 아니다. 새 감사 workflow는 별도 1개다.

## 기존 workflow 전체 목록

| 파일 | 기존 역할/이름 | 트리거 | 선언 권한 | 재사용·중복 판단 |
|---|---|---|---|---|
| [apply-schedules-light-theme](../../.github/workflows/apply-schedules-light-theme.yml) | Apply schedules light theme | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [apply-university-v7-to-site](../../.github/workflows/apply-university-v7-to-site.yml) | Apply university roster v7 to site | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [audit-vnl-18-country-pages](../../.github/workflows/audit-vnl-18-country-pages.yml) | Audit VNL 18 country pages | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [audit-vnl-player-master-country-coverage](../../.github/workflows/audit-vnl-player-master-country-coverage.yml) | Audit VNL Player Master country coverage | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [build-player-timeline-v1](../../.github/workflows/build-player-timeline-v1.yml) | 기존 생성/연결 workflow | YAML 파싱 FAIL (줄 66) | 파싱 미완료 | 오류 기록만; 수정 안 함 |
| [build-university-player-master-batch](../../.github/workflows/build-university-player-master-batch.yml) | Build university Player Master batch | PR main 전체; 수동 | contents:write | PR 전체 트리거·쓰기 충돌 검토; 변경 안 함 |
| [build-vnl-match-master-v1](../../.github/workflows/build-vnl-match-master-v1.yml) | Build VNL Match Master v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [build-vnl-match-results-v1](../../.github/workflows/build-vnl-match-results-v1.yml) | Build VNL Match Results v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [build-vnl-standings-master-v1](../../.github/workflows/build-vnl-standings-master-v1.yml) | Build VNL Standings Master v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [complete-final-four-vnl-rosters](../../.github/workflows/complete-final-four-vnl-rosters.yml) | Complete final four VNL rosters | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [connect-all-vnl-player-master-v1](../../.github/workflows/connect-all-vnl-player-master-v1.yml) | Connect all VNL players to Player Master v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [connect-schedules-to-match-master-v1](../../.github/workflows/connect-schedules-to-match-master-v1.yml) | Connect schedules to Match Master v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [connect-usa-player-master-v1](../../.github/workflows/connect-usa-player-master-v1.yml) | Connect USA Player Master v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [connect-vnl-schedules-v1](../../.github/workflows/connect-vnl-schedules-v1.yml) | 기존 생성/연결 workflow | YAML 파싱 FAIL (줄 35) | 파싱 미완료 | 오류 기록만; 수정 안 함 |
| [connect-vnl-standings-ui-v1](../../.github/workflows/connect-vnl-standings-ui-v1.yml) | Connect VNL Standings UI v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [expand-player-timeline-all-v1](../../.github/workflows/expand-player-timeline-all-v1.yml) | Expand Player Timeline all v1 | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [improve-schedule-visibility](../../.github/workflows/improve-schedule-visibility.yml) | Improve schedule visibility | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [install-global-light-theme](../../.github/workflows/install-global-light-theme.yml) | Install global light theme | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [install-unified-navigation](../../.github/workflows/install-unified-navigation.yml) | Install unified navigation | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [kovo-cup-domestic-presentation-smoke](../../.github/workflows/kovo-cup-domestic-presentation-smoke.yml) | KOVO Cup Domestic Presentation Prototype Smoke | 수동; PR 경로 제한; push (feature/kovo-cup-domestic-preview-clean-20261027, 경로 제한) | contents:read | 해당 기존 테스트 호출; 일부 중복 CI 실행 가능 |
| [kovo-cup-final-20261018-live-observation](../../.github/workflows/kovo-cup-final-20261018-live-observation.yml) | KOVO Cup Final One-Day Live Observation 2026-10-18 | cron 0 4 18 10 * UTC; 수동; push (main, 경로 제한) | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-cup-production-20261027-smoke](../../.github/workflows/kovo-cup-production-20261027-smoke.yml) | KOVO Cup production + domestic template focused regression | 수동; PR 경로 제한; push (feature/kovo-cup-production-release-clean-20261027,main, 경로 제한) | contents:read | 해당 기존 테스트 호출; 일부 중복 CI 실행 가능 |
| [kovo-match-collector-pilot](../../.github/workflows/kovo-match-collector-pilot.yml) | KOVO Match Collector Pilot | 수동 | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-match-detail-one-shot](../../.github/workflows/kovo-match-detail-one-shot.yml) | KOVO Official Match Detail One-Shot Probe | 수동; push (main, 경로 제한) | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-match-feed-pilot](../../.github/workflows/kovo-match-feed-pilot.yml) | KOVO Match-Only Feed Pilot | 수동; push (main, 경로 제한) | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-notice-structure-diagnostic](../../.github/workflows/kovo-notice-structure-diagnostic.yml) | KOVO Public Notice Structure Diagnostic | push (main, 경로 제한); 수동 | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-official-notices-collector](../../.github/workflows/kovo-official-notices-collector.yml) | KOVO Official Notices Collector | 수동; cron 13 23 * * * UTC; push (main, 경로 제한) | contents:write | 기존 수집 결과/검수 큐 읽기 재사용 |
| [kovo-public-api-connection-probe](../../.github/workflows/kovo-public-api-connection-probe.yml) | KOVO Public API Connection Probe | push (main, 경로 제한); 수동 | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-public-match-source-discovery](../../.github/workflows/kovo-public-match-source-discovery.yml) | KOVO Public Match Source Discovery | 수동; push (main, 경로 제한) | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-public-schedule-api-probe](../../.github/workflows/kovo-public-schedule-api-probe.yml) | KOVO Public Schedule API Probe | 수동; push (main, 경로 제한) | contents:read | 시험/관측 도구 유지; 수집 스케줄 추가 안 함 |
| [kovo-public-schedule-match-bridge](../../.github/workflows/kovo-public-schedule-match-bridge.yml) | KOVO Public Schedule Match Bridge | 수동; push (main, 경로 제한) | contents:read | 기존 read/normalize 함수 직접 재사용 |
| [link-argentina-vnl-page](../../.github/workflows/link-argentina-vnl-page.yml) | Link Argentina VNL page | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-belgium-vnl-page](../../.github/workflows/link-belgium-vnl-page.yml) | Link Belgium VNL page | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-bulgaria-china-ukraine-vnl](../../.github/workflows/link-bulgaria-china-ukraine-vnl.yml) | Link Bulgaria China Ukraine VNL pages | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-canada-vnl-page](../../.github/workflows/link-canada-vnl-page.yml) | Link Canada VNL page | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-cuba-vnl-page](../../.github/workflows/link-cuba-vnl-page.yml) | Link Cuba VNL page | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-france-vnl-page](../../.github/workflows/link-france-vnl-page.yml) | Link France VNL page | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-germany-serbia-turkiye-vnl](../../.github/workflows/link-germany-serbia-turkiye-vnl.yml) | Link Germany Serbia Türkiye VNL pages | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-italy-vnl-page](../../.github/workflows/link-italy-vnl-page.yml) | Link Italy VNL page | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [link-usa-iran-slovenia-vnl](../../.github/workflows/link-usa-iran-slovenia-vnl.yml) | Link USA Iran Slovenia VNL pages | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [materialize-reviewed-batches](../../.github/workflows/materialize-reviewed-batches.yml) | Materialize reviewed batches | PR main 전체; 수동 | contents:write | PR 전체 트리거·쓰기 충돌 검토; 변경 안 함 |
| [player-draft-integration](../../.github/workflows/player-draft-integration.yml) | Player and Draft Integration | PR 경로 제한; 수동 | contents:read | 해당 기존 테스트 호출; 일부 중복 CI 실행 가능 |
| [populate-six-v25-rosters](../../.github/workflows/populate-six-v25-rosters.yml) | Populate six VNL v25 rosters | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [rebuild-final-player-master-229](../../.github/workflows/rebuild-final-player-master-229.yml) | Rebuild final 229-player Player Master | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [register-four-static-vnl-teams](../../.github/workflows/register-four-static-vnl-teams.yml) | Register four static VNL teams | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [register-kyungil-player-master](../../.github/workflows/register-kyungil-player-master.yml) | Register Kyungil players in Player Master | PR main 전체; 수동 | contents:write | PR 전체 트리거·쓰기 충돌 검토; 변경 안 함 |
| [register-skku-player-master](../../.github/workflows/register-skku-player-master.yml) | Register SKKU players in Player Master | PR main 전체; 수동 | contents:write | PR 전체 트리거·쓰기 충돌 검토; 변경 안 함 |
| [run-populate-six-v25-rosters](../../.github/workflows/run-populate-six-v25-rosters.yml) | Run six VNL v25 roster population | push (main, 경로 제한) | contents:write | 과거 생성/마이그레이션 유지; 재실행 안 함 |
| [validate-university-player-master](../../.github/workflows/validate-university-player-master.yml) | Validate university Player Master | 수동 | contents:read | 과거 생성/마이그레이션 유지; 재실행 안 함 |

## 기존 검사 전체 목록

아래는 기준 main의 실행 가능한 테스트 파일과 수동 검수 페이지 전체 목록이다. fixture JSON/보조 JS는 테스트가 소비하는 자료로 별도 보존한다. 이 표의 “호출”은 이번 프로그램의 호출 범위이며 결과는 PILOT 보고서가 기준이다.

| 파일 | 역할 | v1 호출 |
|---|---|---|
| [competition-calendar-gender.test.cjs](../../tests/competition-calendar-gender.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [competition-calendar-preview.html](../../tests/competition-calendar-preview.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-calendar-width-compare.html](../../tests/competition-calendar-width-compare.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-hero-preview.html](../../tests/competition-hero-preview.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-page-v2-config-smoke.html](../../tests/competition-page-v2-config-smoke.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-page-v2-production-gate.html](../../tests/competition-page-v2-production-gate.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-page-v2-reuse-smoke.html](../../tests/competition-page-v2-reuse-smoke.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-page-v2-structure-engine-smoke.html](../../tests/competition-page-v2-structure-engine-smoke.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-page-v2-team-ux.html](../../tests/competition-page-v2-team-ux.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-page-v2-theme-smoke.html](../../tests/competition-page-v2-theme-smoke.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [competition-v2-config.test.cjs](../../tests/competition-v2-config.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [competition-v2-data-contract.test.cjs](../../tests/competition-v2-data-contract.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [competition-v2-pro-cup-pool-columns.test.cjs](../../tests/competition-v2-pro-cup-pool-columns.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [competition-v2-production-starter.test.cjs](../../tests/competition-v2-production-starter.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [competition-v2-team-ux.test.cjs](../../tests/competition-v2-team-ux.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [comprehensive-hub.test.cjs](../../tests/comprehensive-hub.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [domestic-home-v2.test.cjs](../../tests/domestic-home-v2.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [draft-applicants.test.mjs](../../tests/draft-applicants.test.mjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [draft-lottery-responsive.html](../../tests/draft-lottery-responsive.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [draft-lottery.test.mjs](../../tests/draft-lottery.test.mjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [draft-profile-routing.test.mjs](../../tests/draft-profile-routing.test.mjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [goseong-pool-standings.test.cjs](../../tests/goseong-pool-standings.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [home-hero-preview.html](../../tests/home-hero-preview.html) | 수동 UI/반응형/Production 검수 페이지 | NOT RUN (대상 4대회 Chromium 검사 별도) |
| [kovo-cup-desktop-matchup-alignment.test.cjs](../../tests/kovo-cup-desktop-matchup-alignment.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [kovo-cup-domestic-presentation-prototype.test.cjs](../../tests/kovo-cup-domestic-presentation-prototype.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [kovo-cup-production-template-20261027.test.cjs](../../tests/kovo-cup-production-template-20261027.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [kovo-cup-rosters.test.cjs](../../tests/kovo-cup-rosters.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [national-festival-2026.test.cjs](../../tests/national-festival-2026.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [player-integration.test.mjs](../../tests/player-integration.test.mjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [player-profile-coverage.test.mjs](../../tests/player-profile-coverage.test.mjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [player-reviewed-identities.test.mjs](../../tests/player-reviewed-identities.test.mjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [school-domestic-home-v2.test.cjs](../../tests/school-domestic-home-v2.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [school-hub-v2.test.cjs](../../tests/school-hub-v2.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [school-logos-2026.test.cjs](../../tests/school-logos-2026.test.cjs) | 학교·종합대회·프로토타입/부가 기능 | NOT RUN (v1 첫 대상 밖) |
| [test_draft_applicants.py](../../tests/test_draft_applicants.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_cup_final_20261018_monitor.py](../../tests/test_kovo_cup_final_20261018_monitor.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_live_source_probe.py](../../tests/test_kovo_live_source_probe.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_match_collector.py](../../tests/test_kovo_match_collector.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_match_feed.py](../../tests/test_kovo_match_feed.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_match_schedule_bridge.py](../../tests/test_kovo_match_schedule_bridge.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_official_notices.py](../../tests/test_kovo_official_notices.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_public_match_detail_probe.py](../../tests/test_kovo_public_match_detail_probe.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_public_schedule_probe.py](../../tests/test_kovo_public_schedule_probe.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [test_kovo_verify_roster_contracts.py](../../tests/test_kovo_verify_roster_contracts.py) | 수집기·정규화·등록계약·드래프트 합성 테스트 | Python unittest 전체 호출 |
| [vleague-match-summary.test.cjs](../../tests/vleague-match-summary.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [vleague-postseason.test.cjs](../../tests/vleague-postseason.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |
| [vleague-rosters.test.cjs](../../tests/vleague-rosters.test.cjs) | V2/경기/명단/선수/드래프트 핵심 계약 | 기존 파일 그대로 호출 |

## 수집기·검수기 재사용

| 기존 경로 | 역할 | v1 처리 |
|---|---|---|
| `scripts/kovo_official_notices.py` | 공식 공시·원문→정규화 row/change event/projection/검수 큐 | 새 수집기 없음. 기존 큐와 승인된 후속 공시만 비교 |
| `scripts/kovo_official_change_events.py`, `kovo_verify_roster_contracts.py` | 공시 변화·계약 검증 | 기존 Python 테스트 재사용. 선수 MASTER 쓰기 없음 |
| `scripts/kovo_match_schedule_bridge.py` | 공개 rolling 일정·결과의 bounded 읽기/정규화 | 함수 직접 import. 2026-27 provider 식별 매핑만 감사 adapter에 추가 |
| `scripts/kovo_match_feed.py`, `kovo_match_collector.py` | simulation/수집 pilot | 기존 테스트 호출. 운영 갱신기로 승격하지 않음 |
| `scripts/kovo_public_match_detail_probe.py`, `kovo_public_schedule_probe.py`, `kovo_live_source_probe.py`, `kovo_notice_structure_diagnostic.py` | 읽기 전용 연결/상세/구조 관측 | 진단 근거 재사용. endpoint 재탐색 수집기 신설 안 함 |
| `scripts/kovo_cup_final_20261018_monitor.py` | 10/18 결승 한정 관측 | 이미 반영된 결승을 새 오류로 신고하지 않음 |
| `scripts/build-kovo-cup-rosters-2026.py` | 검수 팸플릿 명단 Snapshot 빌드 | 실행하지 않음. 생성된 공개 명단 검증 |
| `scripts/audit_university_player_master.py`, `validate-university-player-master.yml` | 대학 선수 원장 검수 | 기존 도구 유지. 대학 전체 확장은 후속 범위 |
| `scripts/materialize_*_batch.py`, 등록/연결 빌더 | 과거 검수 배치·원장 생성 | 감사에서 호출하지 않음 |

## 트리거 충돌·권한 판단

- 기존 공시 수집은 UTC 23:13(다음 날 KST 08:13). 신규 제안은 UTC 00:00(KST 09:00)으로 47분 차이다. 실제 스케줄은 아직 활성화하지 않는다. 공시 workflow 스케줄/쓰기 권한은 그대로 유지한다.
- 기존 10/18 결승 monitor에는 연간 cron이 남아 있지만 코드가 2026-10-18 여부를 확인한다. 신규 프로그램으로 대체하거나 삭제하지 않는다.
- `materialize-reviewed-batches.yml`는 main 대상 모든 PR에서 feature branch에 `data/seed`를 commit/push할 수 있다. 별도 감사의 읽기 전용 권한과 독립된 기존 위험이다. Draft PR 생성 후 head/diff를 재조회해 자동 변경 여부를 확인한다.
- `register-kyungil-player-master`, `register-skku-player-master`, `build-university-player-master-batch`도 main 대상 PR 전체에서 실행한다. 과거 고정 건수 계약 때문에 현재 main에서도 실패할 수 있으며 이번 프로그램의 실패와 구분한다.
- 핵심 테스트 일부는 기존 smoke와 신규 감사에 함께 호출된다. 기존 workflow를 줄이지 않았기 때문에 관련 데이터 PR에서 의도된 중복 검증 비용이 발생한다. 중복 수집·데이터 쓰기는 추가하지 않는다.
- 기존 write 권한 34개를 일괄 축소하지 않았다. 사용 중/일회성/폐기 가능한 작업을 운영자가 검토한 뒤 별도 PR로 정리한다.

## 운영 기준 충돌과 적용 판단

| 근거 차이 | 적용 판단 | 상태 |
|---|---|---|
| DESIGN_SYSTEM의 과거 1120/1180, 일정 1400px 혼재 ↔ 최신 1180/390/360 검수 | 최근 승인된 대상별 1180 및 모바일 두 폭 적용 | CONFIRMED 문서 차이, UI 자동 수정 없음 |
| PROJECT_RULES 이름·생년월일 파생 ID ↔ 개발 workflow의 영구 KVL-P ID | 기존 검수 ID 및 연결 보존. 감사는 ID 생성/이름 병합하지 않음 | CONFIRMED 문서 차이 |
| V2 초기 pro 남녀 차콜·2줄 헤더 ↔ 최근 여자 로즈·국내 1줄 헤더 | 최근 적용 범위별 승인 우선. 현재 pro 여성 테마 변수 로즈 확인 | CONFIRMED 범위별 변경 |
| Drive 9월 V2 공통 템플릿의 VALIDATED_PENDING_PRINT_PDF ↔ GitHub 10월 국내/프로 확장 | 공통 기반 보존, 최신 승인된 확장만 적용. 인쇄 검수 완료로 승격하지 않음 | 인쇄 NOT RUN |
| Drive 독립 STATUS/국내 템플릿 원본 검색 미접근 | 검수현황 탭·GitHub 국내 템플릿/결정 로그를 구분해 사용 | NOT VERIFIED |
| 남녀 시즌 선수 MASTER 검수현황 ↔ 대회 Snapshot | 현재등록 후보와 컵/리그 당시 명단의 범위 차이. 이름만으로 이동 확정 금지 | 전체 대조 NOT VERIFIED |
| 미병합 Draft PR #172 결선 수정 ↔ 최신 main/MASTER 반영 완료 | 현재 24경기·결선 연결을 확인. 신규 누락 신고 제외 | PASS (현재 범위) |
| Draft PR #199 드래프트 지명 결과 ↔ 현재 main 신청자/프로필 기능 | 미병합 기능을 운영 완료로 표시하지 않음 | 지명 결과 NOT RUN |

## 반복 수작업 후보

실제 사람의 작업 횟수/시간은 기록을 확보하지 못해 NOT VERIFIED다. 아래 수치는 현재 데이터의 처리 대상 수이며 수행 횟수가 아니다.

| 작업 | 현재 방식·재사용 자산 | 반복 규모/빈도 근거 | 자동화 가능성 | 위험 및 승인 경계 |
|---|---|---|---|---|
| 경기 결과 입력 | 공식 확인→MASTER→검수 JSON/페이지. 공개 bridge 존재 | 컵 24경기; 리그 예정 252경기 | 비교·후보 생성 높음, 전체 공식 상세 수집은 보류 | 높음: 잘못된 결과/동명이 팀. 수정은 승인 PR |
| 경기 상태 변경 | score 존재에 따른 Engine 표시 + 공식 관측 | 대상 276경기, 날짜만으로 종료 판정 금지 | 공식 명시 상태 비교 높음 | 연기/취소·실제 시작시각 혼동 방지 |
| 선수 등록/이동 | 매일 공시 collector→review queue→신원/효력일 검수 | 공시 collector KST 08:13 매일; 실제 공시량 가변 | 수집·차이 탐지는 기존 기능 재사용 | 높음: 기존 ID/임대/말소 해석. 이름 병합 금지 |
| 참가명단 갱신 | 팸플릿/시즌 검수 Snapshot 빌드 | 컵 251명단 행, 리그 252명단 행; 고유 인원과 다름 | 소스·ID 비교 높음 | 과거 참가명단을 현재 소속으로 덮어쓰지 않음 |
| 개최정보 입력 | config/data의 공식명·기간·장소를 검수 반영 | 첫 대상 4개 남녀 대회 config | schema·필수필드 점검 중간 | 미확정 일정 임의 확정 금지 |
| 결과·순위 동기화 | 경기 score와 standings 별도 기록, Engine 계산/표시 | 4대회 승패·승점/결선 | 논리 대조 높음 | 모든 동률 규정 확정 전 자동 순위 덮어쓰기 금지 |
| 시즌별 연결 | 영구 Player ID + 시즌/대회 Snapshot | 공개 catalog 1,842 ID, 시즌 명단 반복 | 참조 무결성 높음 | 새 신원 판정/ID 재발급은 사람 검수 |

## 남은 자동화 공백

공식 전체 시즌·세트별 점수의 완전한 source adapter, Drive 선수 MASTER 전수 비교, 승인된 source별 공개등급 manifest, 배포 시각 manifest, 기존 writer를 포함한 실제 배포 gate, 사용자 알림 실수신 검증은 후속 승인 범위다. 구현되어 있지 않거나 실행하지 않은 항목을 PASS로 표시하지 않는다.

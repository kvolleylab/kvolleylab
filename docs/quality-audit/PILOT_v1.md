# KVL Quality Audit v1 최초 시범 보고

작성: 2026-10-30 KST. **운영 적용·자동 스케줄·실제 Issue 알림 승인 대기**.

## 검사 기준과 결과

작업 시작 및 변경/제출 전 재조회한 main 데이터 기준은 `58311bec50e6cf94079b6c7f6b4152bc9816cf7a`다. 로컬 시범은 이 main 데이터와 feature worktree의 신규 감사 코드를 함께 실행했다. 보고서의 SHA는 검사 데이터의 HEAD이며, 감사 코드는 이 Draft PR의 diff다. 운영 페이지/MASTER/기존 Player ID/기존 workflow를 수정하지 않았다.

최초 전체 시범 확인 시각: **2026-10-30 00:49:10 KST**. [기계 보고서](pilot-report.json), [검사별 읽기 보고서](pilot-report.md), [정제된 오류 이력](pilot-state.json), [합성 테스트 로그](synthetic-tests.log).

| 구분 | 결과 |
|---|---|
| 검사 묶음 | PASS 48 / FAIL 3 / NOT VERIFIED 6 / NOT RUN 1 |
| 객관적 확인 오류 | P2 CONFIRMED 4개. 모두 기존 main에 존재하는 구문/검사 문제 |
| 검토 후보 | P3 SUSPECTED 34개: 기존 workflow의 최상위 contents 쓰기 권한 |
| P0/P1 확정 | 이번 명시 범위에서 0개. 전체 데이터 무결성·보안 인증을 뜻하지 않음 |
| 신규 합성 테스트 | 54/54 PASS |
| Python 회귀 전체 | 127/127 PASS = 기존 73 + 신규 54 |
| 기존 JS 핵심 | 18개 파일, 총 108개 subtest 중 107 PASS / 1 FAIL. 파일 단위 17 PASS / 1 FAIL |
| 로컬 Chromium | NOT VERIFIED. 실행 파일 설치 실패. DOM 테스트를 시각 검증으로 대체하지 않음 |
| main 병합/운영 배포/스케줄 활성화 | NOT RUN (승인 대기) |
| 실제 Issue 게시/사용자 수신 | NOT RUN (승인 대기). fake client로 중복·재시도·권한 검증 |

FAIL 3은 workflow YAML 묶음, JSON 안전성 묶음, 선수 통합 회귀 묶음이다. workflow 묶음에 두 오류가 있어 CONFIRMED 오류 수는 4개다. 기존 오류를 발견한 정상적인 감사 실행과 검사 대상의 PASS는 다르다.

## 실제 읽기 전용 비교 범위

| 검사 | 범위·근거 | 결과 |
|---|---|---|
| 컵 경기 MASTER ↔ GitHub | 경기일정_MASTER의 24경기, 남녀 각 12. A1:S600까지 읽기 범위 확인 | PASS |
| 리그 경기 MASTER ↔ GitHub | 252경기, 남녀 각 126. A1:S600까지 읽기 범위 확인 | PASS |
| 경기 자체 계약 | 4대회 ID/남녀/시즌/조/팀/KST/세트 합계/승패·승점/결선 연결 | PASS |
| 운영 홈페이지 ↔ 검사 JSON | 위 4대회의 공개 data.json 전체 구조 | PASS |
| 공식 rolling feed | main 4건, female 4건, ended 5건. 중복을 합친 11경기 최종 세트승·상태·일정 | PASS (관측 범위 한정) |
| 전체 시즌 공식 전수 | rolling API가 모든 경기·세트 점수를 제공하지 않음 | NOT VERIFIED |
| 공개 선수 catalog | 실제 기존 loader로 1,842개 ID 읽기 | PASS |
| 대회 명단 참조 | 컵 130+121행, 리그 131+121행. 검수된 ID/생년월일/팀 연결. 반복 참가 포함 | PASS (공개 Snapshot 계약) |
| Drive 선수 MASTER | 남녀 검수현황·일부 신원검수 구조만 읽음. 전체 행 비교는 하지 않음 | NOT VERIFIED |
| 공시 후보 | 기존 blocked event 2건은 후속 승인 검수 근거로 해결되어 신규 오류에서 제외 | PASS (큐 범위) |
| 필수 경로 | 7개 핵심 HTML과 정적 링크/자산 138개 검사 단위 | PASS |
| 무표식 공개등급 | 4,583개 선수 식별키 포함 레코드에 명시적 access_level 없음. source/검수 근거 매핑 필요 | NOT VERIFIED |
| 원본→배포 갱신 시각 | Drive 수정 시각과 Git commit을 실제 배포 시각으로 간주하지 않음 | NOT VERIFIED |
| 미병합 드래프트 지명 결과 | main의 신청자·프로필·연도 연결 테스트만 호출 | NOT RUN |

Drive 원문은 임시 입력으로만 읽었고 이 PR에 넣지 않았다. 공식 관측 URL은 `https://user-api.kovo.co.kr`의 기존 공개 일정/종료 feed이며, 서비스 비교 URL은 `https://kvolleylab.com/data/competitions/<slug>/data.json`이다. 공식 근거는 경기 비교 finding에 URL·확인 시각을 함께 기록하도록 구현했다. 오류가 없는 관측 범위와 확인 시각은 report의 check/checked_at으로 남긴다.

2026-27 시즌은 당시 10/31 개막 전이다. 예정 경기를 임의로 종료 처리하지 않았다. 컵 결승/준결승 결과는 현재 main과 MASTER에 반영되어 있어 과거 수정 PR의 문제를 신규 오류로 만들지 않았다.

## 확인된 기존 오류

| 오류 ID | 심각도/상태 | 근거 | 제안·영향 |
|---|---|---|---|
| KVL-QA-33E93763371830BA | P2 / CONFIRMED | `.github/workflows/build-player-timeline-v1.yml` 66행 YAML 파싱 실패 | 과거 생성 workflow의 들여쓰기·수명 검토. 서비스 장애로 단정하지 않음 |
| KVL-QA-7680EE5A3A32F8B4 | P2 / CONFIRMED | `.github/workflows/connect-vnl-schedules-v1.yml` 35행 YAML 파싱 실패 | 연결 workflow 구문 검토. 별도 수정 승인 |
| KVL-QA-CF9992DBB4ABFE4F | P2 / CONFIRMED | `data/master/vnl-2026-men-matches-v2.json` JSON 파싱 실패 | 사용 경로/과거 초안 여부 확인 후 수정. 현재 KOVO 운영 데이터 오류와 구분 |
| KVL-QA-F08B7B55D038BE39 | P2 / CONFIRMED | `player-integration.test.mjs`의 과거 파일 해시 고정 검사 1개 실패 | 최신 승인 CSS와 과거 검수 snapshot 계약의 충돌. 승인된 변경을 고려한 회귀 계약 검토 |

선수 통합 테스트의 실패는 `assets/css/kvl-competition-components-v2.css` 해시 비교다. 현재 main 원본 해시 `760e4259dee8b08bde16b1626114b533c07d5c3d230490b4d91c3d5cd839f9a0`, 기존 테스트 기대 해시 `7d099226bfbe8c812685d96cbe9348b4aa336869d4dd3de227c675316fee2ff0`. 현재 main 원본과 feature의 해당 파일은 동일하다. 실제 Player ID 1,842개 보존 및 나머지 14개 선수 통합 subtest는 PASS다. 이 테스트를 지우거나 과거 해시를 임의 갱신해 녹색으로 만들지 않았다.

## 오탐 방지 검증

- 공식 남녀 통합 번호와 서비스 남녀별 순번을 구분하는 검수 map 및 유일 복합키 연결.
- 종료 API의 실제 첫 서브 시각과 예정 시각 분리.
- 기존 `recordStatus=reviewed-notice-snapshot/pamphlet-transcribed`는 출처 유형이다. PUBLIC/VERIFIED의 검수 상태로 오해하지 않는다. 별도의 명시적 공개등급이 없는 레거시는 NOT VERIFIED로 남긴다.
- 예정 날짜가 과거여도 공식 종료 근거 없이는 오류를 확정하지 않음.
- 같은 이름을 가진 서로 다른 ID 보존, NULL 신원 연결 보존, 시즌 Snapshot 반복을 신규 ID 중복으로 해석하지 않음.
- 부분 feed의 미관측 경기, 출처 접근 실패, shallow clone의 과거 commit 미접근은 데이터 누락과 구분.
- 동일 오류 재발견/심각도 상승/재발/해결, 접근 실패 3회 임계치, 같은 실행 재시도, escalation 댓글 POST 이후 재시도, 민감 항목 redaction을 합성 테스트로 확인.

## 보존·배포 안전 확인

운영 HTML/CSS/JS와 `data/`, `players.json`, 기존 workflow 변경은 없다. 기존 핵심 테스트는 임시 복사본에서 실행한다. 실행 산출물은 scratch 출력에서 정제된 report/state/log만 검수 문서로 옮겼다. 신규 workflow는 `contents: read`; PR은 Issue를 게시하지 않는다. 활성 cron은 없다.

공개 배포 차단 코드는 변경 JSON의 검수 상태·정확한 해시를 검사한다. **실제 배포 방어가 완료되었다고 주장하지 않는다.** required check/main 보호/기존 수집기 direct push 연계가 아직 미설정이므로 security:release-enforcement는 NOT VERIFIED다. 인증정보나 private 원문을 공개 GitHub에 넣어 문제를 우회하지 않는다.

## 반복 실행 및 GitHub Actions 근거

최초 report/state를 입력으로 00:53:08 KST에 같은 검사를 재실행했다. 검사별 결과·건수, 오류 ID 38개, 최초 발견일이 모두 동일했다. 최초 새 CONFIRMED 이벤트 4개 → 반복 실행 새 이벤트 **0개**. [반복 실행 근거](repeat-evidence.json). GitHub Actions의 실제 실행 링크와 Chromium 결과는 Draft PR 생성 후 갱신하며, 그 전에는 NOT RUN이다.

## 승인 요청 범위

구현과 시범 결과를 Draft PR로 검토한다. 이번 작업에서 merge, Pages 배포, schedule, Secrets, Issues write 활성화를 하지 않는다. 승인 후에도 먼저 main 수동 실행을 하고, 사용자 알림 수신과 필요한 Drive 인증을 확인한 다음 매일 KST 09:00 스케줄을 활성화한다. 전체 공식 source/선수 MASTER/배포 gate의 미검증 부분은 별도 승인 작업으로 남긴다.

비용·구독 비종속성과 단계별 설정은 [운영 명세](../KVL_QUALITY_AUDIT_SPEC_v1.md)의 실행/권한/비용 절을 따른다. 자동 점검에 ChatGPT 또는 OpenAI 구독은 필요하지 않다.

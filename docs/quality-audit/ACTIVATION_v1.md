# KVL Quality Audit v1 운영 전환 기록

사용자 승인: 2026-10-30 KST, PR 병합·운영 점검·매일 09:00 KST 점검·Issue 알림 활성화.

현재 상태: **ACTIVE / 최초 운영 실행·Issue 게시·중복 방지 재실행 VERIFIED**. 활성화 commit: `772598bc665eb9029fd8d87fce98499e67e4d4b6` (PR #202).

## 확인한 상태

| 항목 | 결과와 근거 |
|---|---|
| 구현 PR #200 병합 | PASS — `dd49cabf9af4e96b0d7e1a38862ec0213e40455b` |
| 병합 직전 main | `3ef1c6f27c70880e2c6ea7cb173fc94187476b2c`, 새 공시 갱신 보존 |
| 후속 최신 main | `7a3f97947dffe738d48081596aa72d52be95e120`, #199 남녀 드래프트 운영 반영 보존 |
| 합성 테스트 | PASS — 56건 재실행 |
| 운영 검증 PR #201 | PASS — [Actions 41055500344](https://github.com/kvolleylab/kvolleylab/actions/runs/41055500344), PASS 117 / FAIL 3 / NOT VERIFIED 6 / NOT RUN 3 |
| main 운영 실행 | PASS — [Actions 41055901858](https://github.com/kvolleylab/kvolleylab/actions/runs/41055901858), PASS 125 / FAIL 3 / NOT VERIFIED 7 / NOT RUN 1. 점검 실행·P0/P1 gate PASS |
| 매일 09:00 KST schedule | PASS — main에 활성화. 최초 실제 예약 실행은 NOT RUN, 2026-10-31 09:00 KST 예정(시작 지연 가능) |
| Issue 실제 게시·반복 실행 | PASS — 최초 create 4, 재실행 create 0 / update 4 / 댓글 0. Issue #204~#207 |
| 이메일·모바일 실제 수신 | NOT VERIFIED — 계정별 전달 확인 필요 |
| Drive Actions 인증 | NOT VERIFIED — 자격 증명 미설정, 파일은 공개하지 않음 |

GitHub 플러그인에는 workflow dispatch 및 저장소 변수 설정 기능이 없다. 별도 웹 로그인은 완료되지 않아 운영 점검을 로그인 상태에 의존시키지 않는다. 감사 코드·테스트·workflow가 main에 반영될 때 읽기 전용 점검을 실행하며, 일반 사이트 변경을 모두 재검사하는 광범위한 push trigger는 추가하지 않는다. PR과 workflow_dispatch는 유지한다. 일정·알림 활성화 전 main에서 외부 공식 출처와 배포 JSON·브라우저·회귀 검사를 확인한다.

최초 로컬 사전 점검은 갱신된 실행 환경에 jsdom/Chromium과 외부 접근이 없어 해당 항목을 NOT VERIFIED로 분리했다. 기존 시범 성공을 이 환경의 성공으로 대체하지 않는다. 운영 판정은 GitHub Actions의 실제 결과를 근거로 한다.

PR #199의 기존 6개 드래프트 테스트(지명권, 저장소 계약, 관리자 DOM, 관측 결과, 신청자 표, 여자 결과)를 같은 감사의 회귀 검사에서 재사용한다. 운영 관리자 쓰기와 드래프트 전체 화면 시각 검수는 NOT RUN으로 남긴다. 홈페이지·MASTER·기존 수집기·Player ID는 이 운영 전환에서 변경하지 않는다.

복구는 감사 workflow의 일정/승인 설정을 중지하거나 이 활성화 변경을 되돌리는 PR로 진행한다. 원본·서비스 데이터 복구는 필요하지 않다.

## 승인된 활성화 설정

- `cron: '0 0 * * *'`는 UTC 00:00, 한국시간 09:00이다. GitHub 실행 큐에 따라 시작이 지연될 수 있다.
- 승인 사실과 기본 활성 설정을 workflow commit에 함께 남긴다. 별도 로그인·PAT·OpenAI 키·유료 구독이 필요하지 않다.
- 선택적 `KVL_QUALITY_AUDIT_APPROVED` 저장소 변수가 없거나 `true`이면 활성화한다. `false` 또는 예상하지 않은 비어 있지 않은 값이면 일정/감사 코드 반영 실행과 Issue 게시를 중지한다. 변수 삭제는 기본 활성 상태로 복귀하므로 중지할 때는 `false`를 명시한다.
- PR과 수동 읽기 전용 점검은 중지 변수와 관계없이 사용할 수 있다. 수동 Issue 게시에는 `notify=true`도 필요하다.
- 감사 전용 파일이 main에 반영될 때도 동일한 오류 이력 갱신을 수행한다. 기능과 데이터에 변화가 없는 일상 결과에는 새 Issue나 반복 댓글을 만들지 않는다.
- 프로그램은 여전히 명시적인 `KVL_AUDIT_APPROVED=true`, main, 허용된 실행 종류를 모두 요구한다. 승인 기본값은 검토된 workflow가 전달하며 PR에는 쓰기 토큰이 전달되지 않는다.
- 기존 4건의 공개 CONFIRMED 결함은 최초 시범 발견일을 보존해 Issue에 최초 등록한다. 이미 고쳐진 결함은 재검사로 해결 여부를 판단하며 새 오류로 만들지 않는다.

`Watch → Custom → Issues` 및 GitHub `Settings → Notifications`의 이메일/GitHub Mobile 설정으로 알림을 받을 수 있다. 계정 설정과 실제 수신함은 이번 연결에서 확인하지 못했으므로 알림 실수신은 NOT VERIFIED다. 운영 Issue 생성 성공과 이메일 수신 성공을 구분한다.

## main 운영 점검 증거

2026-10-30 21:31 KST, `d35633199e09df09f33cc8b1f434fa70de923b80`에서 공식 3개 endpoint 접근 및 11개 관측 경기, 운영 4대회 JSON, Player ID 1,842개, UI 72개 화면, Python 129건이 통과했다. 기존 회귀 24개 파일의 169개 하위 검사 중 168개가 통과했고 과거 CSS 고정 해시 1개는 기존 FAIL이다. YAML 2개·JSON 1개·과거 CSS 해시를 합해 P2 CONFIRMED 4건이 재확인됐다. P0/P1 신규 결함은 없었다. Drive 인증, 공식 전체 시즌, 레거시 공개등급, 배포 시각과 실제 배포 차단 연결은 NOT VERIFIED이며 관리자 운영 저장은 NOT RUN이다. [해시·세부 검사 증거](activation-main-evidence.json).


## 활성화 후 최종 확인

[운영 실행 41056879688](https://github.com/kvolleylab/kvolleylab/actions/runs/41056879688)의 audit와 notify가 모두 성공했다. 첫 main 검증 이후 반영된 #203 여자 드래프트 변경도 보존했다. 최종 점검은 PASS 125 / FAIL 3 / NOT VERIFIED 7 / NOT RUN 1, P0/P1 gate PASS다. Python 129건·UI 72개 화면 통과, JS 회귀 24개 파일 중 23개 PASS / 기존 player-integration 파일 FAIL이다. JS 하위 검사 범위는 172건이며 실패 파일의 전체를 통과로 표시하지 않는다.

첫 Issue 처리: create 4 / update 0 / resolve 0. 같은 보고서의 실제 notify job 재실행: create 0 / update 4 / resolve 0. 오류 ID·Issue 번호·최초 발견일(2026-10-30 00:49:10 KST)이 유지됐으며 4개 Issue 모두 댓글 0개다. PRIVATE 또는 SUSPECTED 항목은 신규 Issue로 게시되지 않았다. 정상 반복 알림용 별도 메일·댓글은 생성하지 않는다.

| 기존 오류 | 공개 이력 |
|---|---|
| P2 기존 timeline workflow YAML | [#204](https://github.com/kvolleylab/kvolleylab/issues/204) |
| P2 기존 VNL workflow YAML | [#205](https://github.com/kvolleylab/kvolleylab/issues/205) |
| P2 기존 VNL JSON 파싱 | [#206](https://github.com/kvolleylab/kvolleylab/issues/206) |
| P2 기존 player-integration 회귀 | [#207](https://github.com/kvolleylab/kvolleylab/issues/207) |

[최종 실행·artifact 해시·검사·Issue 재실행 증거](activation-live-evidence.json). 기존 오류의 수정은 수행하지 않았다. 최초 예약 이벤트 자체, Drive 인증 연동, 이메일/모바일 수신 및 다른 미검증 항목은 완료했다고 표현하지 않는다. ChatGPT Pro 해지·Plus 변경과 무관하게 GitHub의 Python·Node·Chromium과 기본 GITHUB_TOKEN으로 작동한다.

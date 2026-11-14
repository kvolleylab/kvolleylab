# V-리그 승패 조견표 v4 운영 연결

2026-11-14 · USER APPROVED / IMPLEMENTED / LOCAL QA VERIFIED / RELEASE AUTHORIZED

## 위치와 범위

사용자가 “승패조견표를 '정규리그 순위'페이지의 정규리그 순위 아래에 배치시켜줘”라고 운영 연결을 요청했다. 기존 프로토타입의 배포 보류는 이 승인 범위에서 해제한다. 기준 main은 `d75279c88a0b9ab8d7f304ae16b058ca8523b0a4`이며 PR #329의 라이브 세트 점수 보완을 포함한다. 디자인·계산 원본은 PR #328의 v4 커밋 `3e4fbf0f3936ee8f13936f00962e013516ee9509`이다.

- 대상: `competition-engine.html?competition=v-league-men-2026-27&view=groups`, 여자부도 동일.
- 기존 정규리그 순위 블록 바로 다음에 `승패 조견표`를 추가한다. 한눈에 보기 요약 순위 아래에는 추가하지 않는다.
- PC 2열×3행, 900px 이하 1열. 기존 `previousSeasonRanking`과 `calendarDisplay.teamAliases`를 사용한다.
- 남자 차콜·골드 / 여자 로즈, 총승점 연한 골드, 1위 골드. 세트 0과 공란 구분. 360px에서 SOOP·정관장 열 너비를 확보한다.
- 공통 메뉴, Pretendard, 기존 순위·일정·명단·포스트시즌·남녀 전환 유지. 오래된 일반 Arial 규정보다 현재 승인된 Competition Engine 공통 글꼴을 따른다.

## 데이터와 계산

공개 `data/competitions/v-league-{men,women}-2026-27/data.json`을 읽는다. 원본 JSON, MASTER, 로스터, 선수 ID, 수집기, Worker와 발행 주기를 변경하지 않는다. 별도 수동 DB나 요청·타이머를 추가하지 않는다.

기존 `KVLDomesticHomeV2`의 5분 데이터 읽기/탭 복귀 갱신 → `syncLiveCompetition` → `refreshLiveMatches(true)` → `renderStandings`에서 같은 데이터로 순위표와 조견표를 재계산한다. 결과 수정 시 합산값을 저장하지 않고 처음부터 계산한다. 읽기 실패 때 기존 화면을 유지하며 조견표에 ‘최신 확인 성공’을 표시하지 않는다. 실제 경기 중 수집→MASTER→발행의 새로운 두 주기 검증을 이번 UI 시험으로 대체하지 않는다.

공식 종료(`final`)이며 세트별 점수까지 검증되는 경기만 반영한다. 3–0/3–1 승점 3:0, 3–2 승점 2:1. R승점은 해당 라운드, 총승점·순위는 해당 라운드까지 누적한다. 미래 라운드 숫자는 비우고 진행 중 순위는 잠정임을 표시한다. 동일 중복은 1회, 충돌·누락·검증 실패는 경고 및 관련 순위 보류로 처리한다.

순위: 승점 → 승수 → 세트 득실비 → 점수 득실비 → 2팀 동률 시 최근 맞대결, 3팀 이상 동률 시 해당 팀 간 승수·세트/점수 득실비. 반올림 표시 비율로 비교하지 않는다. 종료 경기 8개 누적 지표가 모두 일치할 때만 기존 공식 대조 순위를 재사용한다. 미해결 동률은 `=`로 표시한다.

근거: [KOVO 2026–27 운영요강](https://cdn.kovo.co.kr/1/games/v-leagues/league-info-test/HK흥국금융%202026~2027%20V-리그%20운영요강.pdf) 제22조, 인쇄 270쪽. 기존 검증 원본 SHA256 `6fc933863c2b26f66ff8f32796e846f641c278cffe06504dbb9fe92265713150`.

## 검수 근거

- [기존 경기일정 MASTER](https://docs.google.com/spreadsheets/d/180no_j27R_uw2adWH2BiWbbZ6QUWKVblqymIqNvkBU8/edit)의 `경기일정_MASTER!A1:S253` 읽기: 남녀 합계 252경기. ID·라운드·날짜·시간·팀·상태·세트 승수·세트별 점수 불일치 0건. 수정 없음.
- 기준 공개 데이터: 남자 13경기 종료(11/14 16:33 KST), 여자 13경기 종료(17:53 KST).
- 계산/DOM 연결 23개 통과: 기존 순위 HTML 보존, 남녀 순서, 실제 결과·승점·순위 일치, 0/공란, 126경기와 3R 진행 중 누적, 중복/수정/누락/동률, 오류 격리.
- 기존 5분 타이머를 호출해 실제 여자부 과거 12경기 스냅샷 → 현재 공개 결과로 자동 교체되는 것을 검증. 실패 때 마지막 표시와 로스터 보존. 로컬 DOM/타이머 시험이며 새로운 경기 중 수집 실행을 뜻하지 않는다.
- 일정·경기 요약·명단·포스트시즌·라이브 복구 포함 선택 회귀 검사 89개 통과. 현재 공식 수집 결과를 넣은 기존 연동 검사 추가 6개 통과. 실패/누락 0. 마지막 열 너비 보정 후 전용 23개 재실행 통과.
- 남녀 각각 360·390·768·1180px 브라우저 iframe viewport 검사: 페이지/표 가로 넘침 0, 잘린 셀 0. 1180px 2열×3행, 나머지 1열. 숫자 14px, 모바일 팀/열 제목 12px. 기존 순위 블록 다음 위치 확인. 실기기 검사는 아님.
- 대학리그 여자부, VNL 남자부, KOVO컵 남자부의 기존 순위 HTML은 조견표 모듈 활성 전후 동일.

반복 실행:

```sh
NODE_PATH=<jsdom-26.1.0-node_modules> node --test tests/vleague-matrix-core.test.cjs tests/vleague-matrix-ui.test.cjs
```

`tests/fixtures/vleague-matrix-20261114.json`은 main `774c1ef2504ab891cef9e33611ef80961cc824f0`에서 추출한 공개 결과의 불변 테스트 전용 스냅샷이다. 운영 화면에서는 읽지 않는다. 전용 CI `vleague-matrix-ui.yml`은 같은 검사를 실행하며 기존 경기 발행 workflow를 수정하지 않는다.

## 변경 파일과 복구

- `competition-engine.html`: 전용 CSS/JS 연결, 컴포넌트 캐시 버전 갱신.
- `assets/js/kvl-competition-components-v2.js`: 단일 리그 순위 출력 다음 조건부 연결 1곳.
- `assets/js/kvl-vleague-matrix-core-v1.js`: 읽기 전용 계산.
- `assets/js/kvl-vleague-matrix-v1.js`: 정확한 두 대회 ID만 표시. 오류가 기존 순위 출력을 막지 않음.
- `assets/css/kvl-vleague-matrix-v1.css`: `.kvl-vleague-matrix` 내부 한정. 공통 테이블 강제 색상/hover를 이 영역에서만 해제.
- 전용 테스트 2개, fixture 1개, CI 1개, 검수/결정 기록.

운영 증거는 릴리스 PR의 최종 설명에 merge SHA·Pages 실행·실제 URL 검증으로 기록한다. 로컬 검증만으로 DEPLOYED라 하지 않는다. 문제 시 운영 연결 커밋을 revert하며 경기·선수 데이터나 자동화 커밋을 되돌리지 않는다.

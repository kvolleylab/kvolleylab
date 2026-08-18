# K-Volley Lab Competition Match Results UI Standard

## Canonical reference
`2026 대한항공배 전국대학배구 고성대회`의 경기결과 화면을 K-Volley Lab 대회 경기결과 UI의 기준으로 사용한다.

## Required structure
모든 대회의 `경기결과` 화면은 가능한 한 다음 공통 구조와 CSS class를 재사용한다.

- `cd-results`
- `cd-date-group`
- `cd-date-head`
- `cd-match`
- `cd-match-meta`
- `cd-match-board`
- `cd-side is-left / is-right`
- `cd-inline-logo`
- `cd-score`
- `cd-set-scores`
- `cd-winner`
- `cd-stage-filters`
- `cd-pool-filter`

## Layout rules
1. 경기는 날짜별 그룹으로 묶는다.
2. PC 경기 한 줄은 `경기정보 → 팀/최종 세트스코어 → 세트별 점수`의 3영역 구조를 유지한다.
3. 세트별 점수는 PC에서 경기행 오른쪽 끝의 pill/chip 형태로 배치한다.
4. 승리팀 강조는 공통 `cd-winner` 규칙을 사용한다.
5. 국내대회는 팀 로고, 국가대항 국제대회는 국기를 `cd-inline-logo` 위치에 표시한다.
6. 대회 성격별 시각적 차별화는 Hero 색상, 대회 로고, 팀 로고/국기 등 브랜딩 요소에 한정하고 경기결과 카드 구조 자체는 바꾸지 않는다.
7. 모바일 반응형도 `competition-dashboard-v1.css`의 공통 경기결과 규칙을 우선한다.

## Stage / pool filtering rule
- 조별리그가 있는 대회는 별도의 `조별결과` 상위 메뉴를 만들지 않는다.
- `경기결과` 화면 안에서 `전체 / 예선 / 준결승 / 결승 ...` 단계 필터를 제공한다.
- `예선`을 선택했을 때만 `예선 조` 선택기(A조/B조/C조 등)를 노출한다.
- 국제대회도 이 규칙을 그대로 적용한다.
- 공통 필터 동작은 `assets/js/competition-results-standard.js`를 우선 재사용한다.

## Implementation policy
새로운 국내/국제 대회 페이지를 만들거나 기존 대회를 개편할 때 별도의 `*-result-row` 또는 별도 조별결과 페이지를 새로 만들지 않는다. 고성대회의 공통 `cd-*` DOM 구조와 `competition-dashboard-v1.css`, `competition-results-standard.js`를 먼저 재사용한다. 대회별 CSS는 데이터/브랜딩 차이를 위한 최소한의 override만 허용한다.

## New competition acceptance check
새 대회를 공개하기 전 다음을 확인한다.
1. 경기결과 DOM이 고성대회 `cd-*` 구조와 동일한가.
2. 세트스코어가 PC에서 오른쪽 끝에 배치되는가.
3. 예선 조가 있으면 경기결과 안에서 조 선택이 가능한가.
4. 별도 `조별결과` 메뉴가 중복 생성되지 않았는가.
5. 대회별 CSS가 공통 결과 레이아웃을 덮어쓰지 않는가.

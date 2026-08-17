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

## Layout rules
1. 경기는 날짜별 그룹으로 묶는다.
2. 경기 한 줄은 `시간/단계 → 왼쪽 팀 → 최종 세트스코어 → 오른쪽 팀 → 세트별 점수` 순서를 유지한다.
3. 승리팀 강조는 공통 `cd-winner` 규칙을 사용한다.
4. 국내대회는 팀 로고, 국가대항 국제대회는 국기를 `cd-inline-logo` 위치에 표시한다.
5. 대회 성격별 시각적 차별화는 Hero 색상, 대회 로고, 팀 로고/국기 등 브랜딩 요소에 한정하고 경기결과 카드 구조 자체는 바꾸지 않는다.
6. 모바일 반응형도 `competition-dashboard-v1.css`의 공통 경기결과 규칙을 우선한다.
7. 대회별 추가 기능(공식 경기 링크, 조별 필터 등)은 공통 경기결과 레이아웃을 깨지 않는 범위에서 추가한다.

## Implementation policy
새로운 국내/국제 대회 페이지를 만들거나 기존 대회를 개편할 때 별도의 `*-result-row` UI를 새로 만들기보다 위 공통 구조를 먼저 재사용한다. 대회별 CSS는 데이터/브랜딩 차이를 위한 최소한의 override만 허용한다.

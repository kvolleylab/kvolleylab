# K-Volley Lab Competition Dashboard Template Rule

새 대회는 기존 고성대회 대시보드 구조를 기준으로 만든다.

- 상위 메뉴는 `한눈에 보기 / 경기결과 / 조별 순위 / 최종 순위 / 참가팀(국) / 공식자료`를 기본값으로 사용한다.
- 조별 경기 결과는 별도 상위 메뉴를 만들지 않고 `경기결과` 안의 단계/조 필터로 제공한다.
- `경기결과`는 `competition-dashboard-v1.css`의 `cd-*` DOM/CSS 구조를 재사용한다.
- 조 필터 동작은 `competition-results-standard.js`를 재사용한다.
- 국제대회 차별화는 Hero 색상, 공식 대회 로고, 국기 등 브랜딩 요소에 한정한다.
- 대회별 CSS로 경기결과 구조를 새로 설계하지 않는다.

새 대회를 공개하기 전 고성대회와 PC/모바일 화면을 비교 검수한다.

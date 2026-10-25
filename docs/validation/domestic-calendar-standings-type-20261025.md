# 달력·조별순위 글씨 크기 — 2026-10-25

- 기준 main: `e71cafc1dae8c99b793e35d2ce4a0d992b2bfe37` (직전 PR #160 배포 후 변경 없음).
- 변경: 공통 domestic CSS 및 세 진입 HTML의 CSS cache version `20261025-2`. JavaScript·JSON·이미지 자산·순위 계산·사다리 엔진은 변경하지 않는다.
- 달력: `년`/`월`은 앞 숫자의 font-size/weight를 상속한다. PC 연도 22px, 월 28px; 모바일 연도 18px, 월 25px로 숫자/단위가 각각 일치한다.
- 운영 조별순위: 대학명과 머리글 17px. 세트/점수/득실비 하위 글씨도 17px. 예선 종합순위 PC 머리글은 17px, 모바일 종합순위 머리글은 해당 대학명과 같은 15px. 긴 머리글은 두 줄로 유지하며 헤더 높이 56px. PC 헤더/행의 동일 열 폭을 조정해 순위와 팀 글씨 사이 여백을 확보한다.
- 검토 Site: 전체 조 선택 및 8개 표 머리글은 대학명과 동일한 PC 16px/모바일 14px. 기존 전체 조/A/B/C 선택과 팀별 기록 동작을 보존한다. 운영 화면은 기존 조별 카드·예선 종합순위 구조를 유지한다.
- Browser QA: 1363px PC, 390px 남대부/360px 여대부에서 computed font 일치, 문서 가로 넘침 없음(1348/375/345px와 scrollWidth 동일). PC 7개 머리글 셀 scrollWidth=clientWidth로 잘림 없음. 모바일 표의 기존 내부 가로 스크롤 유지.
- CSS만 변경하여 JavaScript 회귀 검사를 중복 실행하지 않았다. 새 테스트를 추가하지 않고 실제 브라우저의 글씨 크기/레이아웃/필터를 확인했다. git diff --check 통과. 대회 데이터/원장 재검수는 이번 글씨 크기 작업의 범위 밖이다.
- PC 증빙: [조별순위](domestic-standings-type-pc-20261025.jpg).
- 복구: 해당 PR revert. 데이터 migration 없음. 실제 merge/Pages/live 결과는 release PR에 기록한다.

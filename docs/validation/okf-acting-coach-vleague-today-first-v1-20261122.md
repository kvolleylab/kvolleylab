# 2026-11-22 · OK저축은행 감독대행 공식 갱신 / V-리그 오늘 경기 우선 배치 v1

Status: **USER AUTHORIZED WEBSITE UPDATE / FEATURE BRANCH IMPLEMENTED / QA & PRODUCTION DEPLOYMENT NOT YET VERIFIED**

## 구단 공식 발표와 출처
- 2026-11-17 [OK저축은행 읏맨 프로배구단 공식 소식](https://www.okfinancialsports.com/volleyball/story/news_content.asp?num=4807&page=1): 신영철 감독 자진 사퇴 수용; 2026-11-17 한국전력전부터 김재헌 수석코치 감독대행.
- 보조 확인: [연합뉴스 2026-11-17](https://www.yna.co.kr/view/AKR20261117089800007).
- 정식 신임 감독이 아니라 **감독대행**임을 데이터와 화면에 구별. 현재 구단 선수 명단/원래 감독의 활동 시점을 덮어쓰지 않음.
- 남녀 14개 V-리그 팀 `data/team-rosters/v-league/coaches-2026-27.json`에서 **OKF 단 한 팀**의 현재 감독 데이터만 변경; `transition`에 종전 신영철 감독의 공식 사퇴일·출처 보존. 나머지 팀·시즌 및 KOVO 자동수집/출처 그대로 둠.

## 명단 페이지 적용
- `assets/js/kvl-teams-directory-v1.js`: `role=acting`일 때 `감독대행 : 김재헌`, 그렇지 않으면 기존 `감독 : 이름`. 정상 프로 구단 카드 3열 PC/2열 모바일, 선수·팀 페이지 기존 양식/로고/숫자·선수명 링크 유지.
- `teams.html` 변경된 JS `v=20261122-coach-v1` cache-busting 적용. CSS/팀 페이지 HERO/모바일 스타일은 변경하지 않음.

## V-리그 요약 카드 순서 변경
- `competition-engine.html?competition=v-league-men-2026-27&view=overview`와 동일 여자부 `v-league-women-2026-27`의 공통 요약 `assets/js/kvl-domestic-home-v2.js`.
- 왼쪽 남녀 두 분류 카드 각각의 콘텐츠 순서를 `today/next (data-kind="next")` **먼저**, `recent (data-kind="recent")` 다음으로 변경. 오늘 예정·진행·종료 경기 존재 여부에 따라 기존 제목 `오늘 경기` 또는 `다음 경기` 자동 표기 유지.
- 상단 영역의 안내 제목도 `오늘/다음 경기 · 최근 결과` 순서로 변경. 남녀 교차 데이터 조회·최근 완료 결과·오늘 경기 상태·세트별 득점·공식 근거·미관측/연기 처리를 전혀 수정하지 않음.
- `competition-engine.html`의 `kvl-domestic-home-v2.js` 캐시만 `v=20261122-today-first-v1`. 홈 `index.html`, KOVO 수집 스케줄러, 운영 점수 저장 원본 불변.

## QA / 배포 게이트
- Base main SHA: `1d0ffb88c7f0075ae656e5da6e5a98289d8b38cb`. Reference: `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `docs/KVL_DECISION_LOG.md`.
- `tests/teams-directory-v1.test.cjs`, `tests/teams-directory-browser-qa-v1.cjs`: 현재 OKF 감독대행 이름/날짜/공식 출처, 종전 감독이 현 감독으로 나오지 않음, 나머지 13팀·로스터·명단 연결 보존.
- `tests/vleague-match-summary.test.cjs`: 남녀 2개 카드 각각 `next → recent` 렌더 순서, 완료된 최근 결과/오늘 경기 대진·점수·상태·빈 슬롯/시간 경계 회귀.
- `tests/teams-directory-live-qa-v1.cjs`: 실제 운영 `teams.html`의 JS cache/JSON 확인과 남녀 화면 PC1440/모바일390에서 `감독대행 : 김재헌`.
- GitHub Actions 테스트와 운영 HTTPS 결과는 동일 SHA의 실제 run 및 Pages 성공 후 별도 기록. 미완료 QA를 통과로 표현하지 않음.
- 별도 Google Drive 선수 MASTER 원문 대조: **NOT VERIFIED**, 선수 원본 변경 없음. 스코어/자동화·회원/메모 저장 데이터도 변경 없음.
- 복구는 이번 PR의 코드·데이터(코치 한 항목) 변경만 revert. 신영철 사퇴의 검증된 사실 기록과 운영 경기 점수, 선수 KOVO/MASTER, 자동화, 회원 자료를 무분별하게 이전 상태로 되돌리지 않도록 별도 재검토.

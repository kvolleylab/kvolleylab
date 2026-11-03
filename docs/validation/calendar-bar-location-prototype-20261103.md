# 통합달력 운영 막대 모양·장소 표시 시안 v5

Status: READY FOR REVIEW / PROTOTYPE ONLY / OPERATING SITE NOT DEPLOYED.

## 요청과 기준

현재 시안의 달력은 유지하고, 막대는 운영 홈페이지 통합달력의 모양을 사용하되 기존 계열색을 유지한다. 대회명 뒤에 `(장소)`를 붙인다. 이 요청은 v4의 텍스트 없는 6px 막대 결정을 대체한다. 운영 반영 승인으로 확대하지 않는다.

- 최신 main 확인: `f560f3b0473eca5e3933461f13b725ed4a9cdb32` (PR #245). 운영 통합달력 CSS/JS 및 기간 데이터는 기존 기준과 차이 없음.
- 작업 브랜치: `feature/calendar-layer-preview-20261103`, Draft PR #243, 이전 HEAD `47cd9f32a0ef16079fe9e48a4ecd4c23a40940e3`.
- 현재 운영 `https://kvolleylab.com/competition-calendar.html?year=2026`을 새로고침해 실제 막대 규격 확인: 연간 높이16px, radius3px, 글자8px/600, 옅은22% 배경, 1px 테두리. 운영 `assets/css/competition-calendar-v2.css` 및 `assets/js/competition-calendar-v2.js`와 대조.
- Google Drive 운영원칙 MASTER v18, KVL 대회일정 마스터를 읽기 확인. 비공개 MASTER에서 새로운 데이터를 공개하지 않음.

## 변경

- 달력 3열×4행, 카드·날짜·요일·HERO·사이드바·필터·월 이동·연도 전환·기간 및 링크 연결 유지.
- 연간 막대의 이름을 다시 표시. 운영의 옅은 배경·단선 테두리·둥근 모서리·중립 글자색/크기를 적용. 사용자 지정 계열색 및 Charcoal/Gold 예외 유지.
- 기존 50% 겹침 배치를 유지: 연간16px/8px. 겹침에 가려지지 않도록 글자는 노출되는 아래 절반에 놓는다. 월간26px/13px, 모바일24px/12px 및 기존 날짜 칸 크기 유지. 운영의 상태별 종료 opacity를 추가해 색 구분을 더 약하게 만들지는 않음.
- `대회명 (장소)`를 막대/Tooltip/월간 상세 제목에서 표시. 짧은 막대는 말줄임하며 전체 이름과 장소는 기존 Tooltip에 표시.
- 기존 period.location이 우선. 비어 있는 국내7건은 기존 공개 `data/calendar/2026-domestic-competitions.json`의 정확한 동일 ID location만 읽는다. 이 파일의 구형 날짜·링크·대회 목록은 가져오지 않는다. 학교6건은 최신 school-index-2026의 장소와 일치, 단양은 university-index-2026과 대조.
- `(제천)`/`(경북 영천)` 기존 접미사 중복 방지. 장소 조회 실패는 기간 달력 로딩을 막지 않으며 미등록 장소는 추정하지 않는다.
- 기존 남녀 동일기간 결합과 양쪽 ID/링크 보존. 원본26개 대회·성별·MASTER·JSON·대회 ID·일정 변경 없음.
- Site의 기존 v4 비교 페이지는 before-v4 사본을 참조해 보존. v5 비교 페이지 별도 제공.

## 검수

- `node --check` / `git diff --check` PASS.
- `KVL_JSDOM_PATH=/workspace/scratch/07fcfa46dc78/qa/node_modules/jsdom node --test tests/calendar-cards-prototype.test.cjs`: **32/32 PASS**. 장소 추가/접미사 중복/escaping/장소 피드 실패/남녀 결합까지 검증. 변경된 요구에 맞춰 v4의 무텍스트·기존 제목 assertion만 교체; 기존 회귀 보존.
- PC 실제 브라우저: 12개 카드, 3열, 80개 막대 구간 모두 이름 표시, 높이16px·간격8px, 가로 넘침 없음. v4와 12개 카드 및 모든 날짜 숫자의 x/y/width/height 정확히 일치.
- 모바일360px 월간8월: 일요일 시작, 가로 넘침 없음, 28개 막대 이름 표시, 높이24px, 미등록 장소0. 실제 Tooltip `2026 동아시아 남자배구선수권대회 (몽골 울란바토르)` 확인.
- 검수는 배포와 동일한 소스의 관리형 미리보기에서 수행. 비공개 호스팅 주소는 기존 소유자 로그인 필요.
- 실제 기간 피드에 프로 대회가 없는 기존 한계 유지. 프로색 및 같은 기간 남녀 결합은 격리 fixture로 검증. 공식 전체 일정의 최신 재조사 작업은 아님.
- 기존 PR의 저장소 전체 CI 중 선수 등록 수 assertion 및 unrelated build-batch 실패를 이번 UI 작업의 통과로 표시하지 않는다. 필수 달력 회귀는 모두 통과.

## 파일과 검수 경로

- prototype HTML, prototype 전용 CSS/JS, 회귀검사, 이 기록, 결정 로그.
- 시안: https://kvl-calendar-korean-cards-v1.daewook1029.chatgpt.site/competition-calendar-cards-prototype.html?view=year&year=2026
- 비교: 같은 시안 `/review/calendar-annual-v5.html?category=all&focus=dense`.
- PC 캡처: Site 소스 `dist/review/KVL_calendar_bar_location_v5.jpg`.
- 운영 `competition-calendar.html` 및 공통 UI 수정 없음. `main` 병합 없음.

## 복구·다음 단계

사용자 시안 검수 후에만 운영 반영을 별도 진행한다. 복구는 이번 v5 목적 commit을 되돌리거나 Site의 이전 v4 소스 `1f8c6541f6ff8865ce49fe6c4789f367ee0b57df` 버전을 재배포한다. 이전 비교본은 보존되어 있다.

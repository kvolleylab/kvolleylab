# 연령별 대표팀 HERO 승인 시안 적용 v2 — 개발·검증 인계

- 최초 기준 main: `c5455085ed13f1bb95edae8a0781476a32d45735` (PR #441 배포 SHA).
- 사용자 최신 지시: 2026-11-27 제공한 **첫 번째 시안 스크린샷과 동일한 HERO**를 실제 국가대표팀 연령별 페이지에 반영. 이전에 만든 다른 스포츠 사진, 단순 파일 사이즈 확대, 재생성 이미지 사용 금지.
- 운영 반영을 명시 요청. 브랜치 `fix/national-age-hero-approved-reference-v1-20261127`, 수정 검증 후 사용자 요청에 따라 병합/Pages 배포한다.

## 시안 기준 및 구현
- 선택 시안 원본 이미지 `대한민국 연령별 대표팀 프리미엄 대시보드(1).png`의 HERO x/y 영역을 **그대로 크롭**해 사용. 원본 HERO 시각 비율 약 `1197:304` (=3.94:1), UI 레이아웃에 맞춰 CSS 카드 aspect-ratio를 동일하게 처리.
- 기존 공용 KVL HERO 파일의 등록 픽셀은 PC 2108×406 / 모바일 1258×406. 해당 asset canvas 크기로 등록하되, **PC에서 display ratio 3.94:1를 복원하도록 전체 이미지를 늘림** (crop/cover 금지, typography/스포츠 선수/U단계 잘림 방지). 모바일은 별도 1258×406 그림 위에 HTML 실시간 제목·설명을 배치하며 선수와 태극기를 우측에 유지.
- `assets/img/national-team/age-hero-approved-pc-v1.svg`, `...mobile-v1.svg`: 승인된 원본 스크린샷에서 유래한 경량 WebP 이미지를 SVG Canvas에 내장. 외부 요청 불필요, 자산으로 공식 저장. SVG 내 픽셀 크기 고정.
- `national-team-history.html`: picture source, 실제 HTML h1 및 문구, `href="#ageLevelTabs"` 사용한 접근성 있는 **실클릭 가능한 CTA** 구현. PC 사진 속 기존 CTA 위치에 투명하지만 클릭 가능한 overlay; 모바일은 텍스트가 렌더링된 실제 버튼으로 표시.
- `assets/css/national-age-history-v1.css`: HERO 높이/크기, 모바일 이미지 자르기와 실제 버튼 스타일, 남녀·U16~U23 필터를 승인 시안처럼 골드 라인/네이비 활성 상태로 개선, KPI Gold-outline icon.
- 대회·선수·기록·회원·Supabase JSON, `assets/js/national-team-history.js` 및 세대추적 원장은 변경하지 않음.

## QA와 배포 기준
- `tests/national-age-history-v1.test.cjs`: SVG 2108×406/1258×406, 원본비율, CTA 연결, 기존 기록·ID 유지.
- `tests/national-age-history-browser-v1.cjs`: Chromium 1440×900·390×844에서 사진 로딩, 카드 높이·문구·버튼 클릭, U23, 여자부 자료 미구축, 좌우 스크롤, 선수명단·세대추적.
- 전용 `KVL National Age-Team History QA v1` + PR 변경 파일 확인 + GitHub Pages **동일 SHA 배포 및 실사이트 기본 HTTP 확인** 이후 DEPLOYED 판단.
- 기존 다른 단위 배치/공식수집 워크플로의 실패는 본 PR과 구분.
- 복구: 해당 HERO+CSS+HTML 변경 PR만 revert, 기존 경기/선수 MASTER는 절대 롤백하지 않음.

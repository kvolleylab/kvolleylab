# 국제 국가별 선수명단 PC 글씨·서체 통일 v3 — 2026-11-20

Status: **USER REQUESTED / IMPLEMENTED IN FEATURE BRANCH / PROD NOT YET VERIFIED**.

## 범위와 원인
- 대상 페이지: `teams.html?category=international&gender=men&country=JPN&year=2026` 및 같은 공통 renderer를 쓰는 타 국가·성별·연도의 통합 및 대회별 선수명단.
- 국제 통합명단 `.kvl-unified`는 `Arial,'Malgun Gothic',sans-serif`, 팀 디렉터리 `.ktd-page`는 `Arial,'Malgun Gothic',sans-serif`로 별도 지정했고 공통 `site-theme-light.css`는 `Arial,"Noto Sans KR",sans-serif!important`를 html/body에 지정한다. 같은 환경에서 한글 폰트 fallback이 서로 달라질 수 있다.
- 통합명단 이름 및 표 헤더에 `font-weight:900` 사용; 공통 사이드 메뉴는 일반적으로 700이고, 결과적으로 더 두껍게 보일 수 있다. 폰트 실제 설치·OS fallback은 사용자 PC마다 달라지므로 로컬 폰트 파일 추가/배포 없이 공통 패밀리 선언을 통일한다.
- PC **821px 이상** 글자 크기: 선수 이름 **22 → 20px**, 생년월일·등번호·영문명·POS·신장·소속·Volleybox·표 헤더 **19 → 17px**. Verified 리그 국가/리그명도 명단 정보와 같은 17px.
- 첫 실제 Chromium 검사에서 사이트 본문 computed font가 `Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`이고 국제명단은 `Arial,"Noto Sans KR",sans-serif`여서 **실제 서체 불일치**를 확인했다. 이벤트 버튼·검색칸은 이미 Pretendard를 사용한다.
- 서체를 강제로 지정하지 않고 국제 국가 패널 `.ktd-country-panel`과 통합명단 `.kvl-unified`에 `font-family:inherit`를 적용해 실제 홈페이지의 본문 폰트를 상속하도록 정정했다. 내부 버튼·입력도 상속한다. 통합명단 이름/표 헤더/등번호 및 별도명단 헤더/번호의 두께 900→800.
- 모바일 820px 이하 기존 폰트 크기/배치 규칙, 글로벌 메뉴, 프로팀·KOVO 데이터, 선수 및 대회 원본과 데이터 처리 JS, 페이지 필터/검색/링크, red/black 이력 점, 내부 표 좌우 스크롤 보존.
- `teams.html`의 두 국제명단 CSS URL cache version만 `20261120-type-v3`로 갱신. JS cache 키와 원본 변경 없음.

## 코드/테스트
- `assets/css/kvl-international-unified-roster-v1.css`: 20/17px, 공통 폰트 및 통합명단 굵기, 리그 메타 17px.
- `assets/css/kvl-international-countries-v1.css`: 20/17px, 국가 패널 공통 폰트, 국적·리그 메타 및 헤더 굵기.
- `teams.html`: CSS 캐시 갱신.
- `tests/international-unified-roster-browser-v1.cjs`: PC1440/900에서 fontSize 20/17px 정확한 검사, body/국가패널/통합명단/이벤트 버튼/검색 입력 fontFamily 동등, title weight 800, 국가/리그 메타 17px; 개별 대회명단 20/17px. 기존 남녀·타국/대회 등록 26명·42건/필터/선수/소속팀/Volleybox/이력과 모바일390/360 회귀.

## 근거 및 릴리스 게이트
- Base main `5813a04a255b895ac07059989595aefe66fb6d7d`.
- 읽은 운영 기준: `AGENTS.md`, `PROJECT_RULES.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md`, 현행 GitHub CSS/HTML.
- Google Drive 선수/대회 MASTER 별도 원본 대조: **NOT VERIFIED**. 스타일 변경이고 선수 데이터 수정 자체 없음.
- 초기 Chromium [run #44552598891](https://github.com/kvolleylab/kvolleylab/actions/runs/44552598891)은 PC 20/17px 검사 통과 후 **서체 동등성 실패**를 보고했다(사이트 body Pretendard vs 국제명단 Arial/Noto Sans KR). 이를 근거로 폰트를 `inherit`로 수정했다.
- 수정 후 Chromium/품질 게이트·배포 결과는 실제 Actions 런과 동일 SHA 증거 확인 후 별도 기록한다.
- 문제가 있으면 해당 PR만 revert: 선수 MASTER, KOVO 통보/실경기 자동화, 회원 자료와 과거 경기 명단은 되돌리지 않음.

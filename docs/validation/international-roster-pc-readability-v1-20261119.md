# 국제 국가별 대회 카드·PC 선수명단 가독성 v1 — 2026-11-19

Status: **USER REQUESTED / IMPLEMENTED IN PR #368 / STATIC REVIEW PASS / BROWSER & LIVE DEPLOY NOT VERIFIED**.

## 요청 및 KVL 운영 기준
- 사용자 첨부 PC 화면처럼 `선수·팀 → 팀 → 국제 → 국가 → 연도`의 대회 카드를 가로로 배열한다.
- 기존 KVL UI 및 8개 통합명단 필드 **등번호, 한글/영문 이름, 생년월일, POS, 신장, 소속팀, Volleybox, 대회별 등록 이력**을 유지하며 글씨만 읽기 쉽게 확대한다.
- 대회별 별도 명단 보기, 후보·선발 이력, 40개 국가 색인, 국가/연도/남녀 필터, 검색, 프로팀과 KOVO 수집 연결, 회원 접근 보호 유지.
- 기준 `main` = `add517ea51490305a04595e03631b5411cd13179`; `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md`, `docs/PLAYER_STANDARD.md` 및 PR #366/367 운영 기록을 확인.

## 확정된 소스와 시각 배치
- `data/international/country-roster-index-v1.json`의 일본 2026 남자 자료에는 **3개 대회만 검증 등록**: VNL 16명, 아시안게임 12명, AVC 남자 대륙선수권 14명. 첨부 예시의 일본 AVC컵 4번째 카드를 임의 추가하지 않는다.
- PC `min-width:821px`: `repeat(auto-fill,minmax(228px,1fr))`로 최대 폭 4열의 가로 대회 카드. 1~3개 카드일 때 카드가 전체 화면 폭으로 비정상 확대되지 않음.
- 821~1000px: 카드 최소 폭 210px; 원본 대회명단과 통합명단의 열 폭을 조정해 태블릿 가로 폭도 보호. `max-width:820px`의 기존 모바일 카드/통합명단 규칙 보존.
- 2026-11-19 사용자 재요청: **PC 왼쪽 전역 메뉴** 실제 글씨 크기 `assets/css/kvl-global-sidebar-v1.css`의 `14px`를 roster 기본 크기로 채택. 통합명단 한글 선수 이름 **16px**, 본문/영문 이름/생년월일/POS/신장/소속팀/Volleybox/헤더/검색과 필터 **14px**, 행 높이 **73px**. 별도 대회명단도 선수명 **16px**, 나머지 표/링크 **14px**, 행 높이 **75px**. 후보명단과 대회 메타정보의 기본 텍스트도 PC 14px로 조정. 모바일 820px 이하 레이아웃과 폰트 크기 변경 없음.
- `teams.html` CSS 캐시 버전만 갱신; JS·선수/팀 데이터·KOVO 수집기·MASTER 수정 없음.

## CI 기록 및 유의사항
- PR #368 직전 버전의 국제 통합명단 Chromium 워크플로 run #44341790622 성공, 국가별 roster run #44341790660 성공.
- 팀 디렉터리 run #44341790452 실패: 화면 목록의 국제 분류가 검증된 **40개국**으로 확장된 뒤에도 이전 QA가 `3개`를 기대한 상태였음 (`40 !== 3`). 데이터/화면 소스를 수정하지 않고 **테스트 기대값만 40으로 수정**. 최신 CI 결과 필요.
- 일부 대학 Player Master 워크플로 실패는 본 PC 스타일 수정 범위 밖이며 본 PR의 국제 roster 회귀 성공과 동일시하지 않음.

## 검증 결과
- **PASS (GitHub branch 정적 검사)**: 두 CSS의 중괄호 짝/PC 조건부 규칙 존재, `auto-fill` 카드 그리드, 확대된 문자·행 크기, 모바일 CSS 규칙 유지, HTML CSS 버전 참조, 기존 선수 및 프로 명단 JS 참조, 일본 3개 출처 명단.
- **ADDED, NOT RUN**: `tests/international-unified-roster-browser-v1.cjs`에 PC 1440px 대회 3개 한 줄 배치, 16/14px 폰트 크기 및 PC 900px로 내려가도 기본 14px·넘침 0인지를 검증하도록 추가. 기존 1440/390/360 회귀 경로 유지. 최신 CI 재검증 전에는 새 변경의 PASS를 주장하지 않음.
- **NOT VERIFIED**: 수정된 글씨 크기의 전체 Chromium 브라우저 검사 및 실제 모바일 렌더링, 실제 인증 계정 로그인, 사용자 운영 페이지 `kvolleylab.com`에서의 HTTPS QA, GitHub Pages 배포. PR만 생성한 상태에서 운영 반영·성공으로 표시하지 않음.
- **NOT VERIFIED (not required for CSS-only change)**: Google Drive 별도 원본 재대조. 이미 배포된 출처 색인만 참조함.

## 수정 파일·릴리스 게이트
- `assets/css/kvl-international-countries-v1.css`
- `assets/css/kvl-international-unified-roster-v1.css`
- `teams.html`
- `tests/international-unified-roster-browser-v1.cjs`
- `tests/teams-directory-browser-qa-v1.cjs` (CI 구형 국제팀 3개 기대값을 현재 검증 40개국으로 정정; 운영 기능 변화 없음)
- 문서: 이 파일 및 변경결정 원장.

PR: https://github.com/kvolleylab/kvolleylab/pull/368

운영 배포 전 사용자 **명시적 승인** 후 해당 PR 병합, Pages 완료 확인, 실제 PC 1440/1024 및 모바일 390/360 가로 넘침·3개 대회·26명·카드/별도 명단·Volleybox·원점·프로팀 회귀를 점검한다. 회귀 시 PR 변경만 revert하고 선수 MASTER/원본/자동화는 유지한다.

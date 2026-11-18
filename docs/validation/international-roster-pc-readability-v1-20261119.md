# 국제 국가별 대회 카드·PC 선수명단 가독성 v1 — 2026-11-19

Status: **USER REQUESTED / PR #368 CODE + CHROMIUM QA VERIFIED / PRODUCTION NOT DEPLOYED**.

## 요청 및 KVL 운영 기준
- 사용자 첨부 PC 화면처럼 `선수·팀 → 팀 → 국제 → 국가 → 연도`의 대회 카드를 가로로 배열한다.
- 기존 KVL UI 및 8개 통합명단 필드 **등번호, 한글/영문 이름, 생년월일, POS, 신장, 소속팀, Volleybox, 대회별 등록 이력**을 유지하며 글씨만 읽기 쉽게 확대한다.
- 대회별 별도 명단 보기, 후보·선발 이력, 40개 국가 색인, 국가/연도/남녀 필터, 검색, 프로팀과 KOVO 수집 연결, 회원 접근 보호 유지.
- 기준 `main` = `add517ea51490305a04595e03631b5411cd13179`; `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md`, `docs/PLAYER_STANDARD.md` 및 PR #366/367 운영 기록을 확인.

## 확정된 소스와 시각 배치
- `data/international/country-roster-index-v1.json`의 일본 2026 남자 자료에는 **3개 대회만 검증 등록**: VNL 16명, 아시안게임 12명, AVC 남자 대륙선수권 14명. 첨부 예시의 일본 AVC컵 4번째 카드를 임의 추가하지 않는다.
- PC `min-width:821px`: `repeat(auto-fill,minmax(228px,1fr))`로 최대 폭 4열의 가로 대회 카드. 1~3개 카드일 때 카드가 전체 화면 폭으로 비정상 확대되지 않음.
- 821~1000px: 카드 최소 폭 210px; 원본 대회명단과 통합명단의 열 폭을 조정해 태블릿 가로 폭도 보호. `max-width:820px`의 기존 모바일 카드/통합명단 규칙 보존.
- 2026-11-19 첫 수정안(아래 150% 글씨 요청으로 **대체됨**): **PC 왼쪽 전역 메뉴** 실제 글씨 크기 `assets/css/kvl-global-sidebar-v1.css`의 `14px`를 roster 기본 크기로 채택. 통합명단 한글 선수 이름 **16px**, 본문/영문 이름/생년월일/POS/신장/소속팀/Volleybox/헤더/검색과 필터 **14px**, 행 높이 **73px**. 별도 대회명단도 선수명 **16px**, 나머지 표/링크 **14px**, 행 높이 **75px**. 후보명단과 대회 메타정보의 기본 텍스트도 PC 14px로 조정. 모바일 820px 이하 레이아웃과 폰트 크기 변경 없음.
- `teams.html` CSS 캐시 버전만 갱신; JS·선수/팀 데이터·KOVO 수집기·MASTER 수정 없음.


## 2026-11-19 추가 요청 · 브라우저 150% 체감 글자 크기

사용자가 PC 브라우저를 150%로 확대하면 명단이 읽힌다며 그 크기를 기본 글씨로 요청함.
이전 14px / 이름 16px 대비 1.5배를 적용하되 **브라우저 배율을 강제하지 않고**, 확대된 글씨만 100% 배율에서 표현:
- **통합명단**: 한글 선수 이름 24px, 영문 이름·등번호·생년월일·POS·신장·소속팀·Volleybox·표 헤더 21px, 행 최소 104px.
- **대회별 원본 명단**: 이름 24px, 등번호·영문명·POS·신장·명단 구분·프로필/Volleybox 링크·표 헤더 21px, 행 최소 105px.
- 원래 8개 필드, 날짜·소속팀·외부 링크·색 점 참가 이력·필터 및 상세 화면을 삭제하거나 축약하지 않음. 색점 크기도 늘리지 않아 시각적 비중을 유지함.
- PC `min-width:821px`에서는 통합명단을 최소 1040px의 **셀 내부 스크롤 가능한 표**로 구성하고 열 폭을 재배분한다. 좁은 PC에서도 21px를 재축소하지 않으며, 문서 전체 가로 스크롤을 만들지 않는 것을 목표로 한다. 개별 대회명단도 최소 990px 내부 표 스크롤 허용.
- `max-width:820px` 모바일 CSS 규칙 자체는 그대로 둠. 단, 기존 CSS 캐시는 `?v=20261119-2`로 갱신한다.
- 브라우저 QA에는 1440px에서 24/21px computed fontSize 검사, 900px에서 최소 글씨 유지와 내부 스크롤/문서 overflow 0 검사, 별도 대회명단의 24/21px 확인을 추가했다. 기존 390/360 모바일, 26명/42건, 16/12/14 필터와 프로팀 회귀 검사 경로는 유지한다.

이번 추가 요청은 **기존 PR #368 리뷰용 코드 수정**이지 사용자 운영 홈페이지 병합 승인으로 처리하지 않는다. 테스트 결과·배포 증거를 확인한 후 상태를 갱신하고, 별도 명시적 승인 전 운영 main은 변경하지 않는다.

## CI 기록 및 유의사항
- PR #368 직전 버전의 국제 통합명단 Chromium 워크플로 run #44341790622 성공, 국가별 roster run #44341790660 성공.
- 팀 디렉터리 run #44341790452 실패: 화면 목록의 국제 분류가 검증된 **40개국**으로 확장된 뒤에도 이전 QA가 `3개`를 기대한 상태였음 (`40 !== 3`). 데이터/화면 소스를 수정하지 않고 **테스트 기대값만 40으로 수정**. 최신 수정본 CI 결과는 아래 PC 150% 검증 항목에서 PASS로 확인.
- 일부 대학 Player Master 워크플로 실패는 본 PC 스타일 수정 범위 밖이며 본 PR의 국제 roster 회귀 성공과 동일시하지 않음.

## 검증 결과
- **PASS (GitHub branch 정적 검사)**: 두 CSS의 중괄호 짝/PC 조건부 규칙 존재, `auto-fill` 카드 그리드, 확대된 문자·행 크기, 모바일 CSS 규칙 유지, HTML CSS 버전 참조, 기존 선수 및 프로 명단 JS 참조, 일본 3개 출처 명단.
- **SUPERSEDED, VERIFIED BELOW**: 초기 16/14px 검사는 사용자의 150% 글씨 요구로 24/21px 및 900px 표 내부 스크롤 확인으로 대체했으며, 최신 변경을 포함한 Chromium run #44424948478에서 통과.
- **PARTIAL VERIFIED**: PR #368 기능·모바일 Chromium 검증은 아래 기록처럼 PASS. 실제 관리자 계정 로그인, 사용자 운영 페이지 `kvolleylab.com`에 새 변경이 반영된 HTTPS QA와 GitHub Pages 배포는 아직 미실시. PR만 생성한 상태에서 운영 반영·성공으로 표시하지 않음.
- **NOT VERIFIED (not required for CSS-only change)**: Google Drive 별도 원본 재대조. 이미 배포된 출처 색인만 참조함.


## PC 150% 글씨 확대 — 브라우저 CI 검증 증거 (2026-11-19 KST)

최종 스타일 및 브라우저 테스트 코드를 포함한 코드 SHA `6c4f03ea30fbf71118b8bacf58e5359f1a3c55ef`:
- **PASS** 국제 통합명단 PC/모바일 Playwright Chromium 및 데이터 검증 [run #44424948478](https://github.com/kvolleylab/kvolleylab/actions/runs/44424948478): 1440px 이름 24px·본문 21px, 900px 동일 크기·표 내부 스크롤·문서 전체 overflow 0, 별도 대회명단 24/21px, 일본 남자 26명과 대회 3개/42건, 390/360px 기존 명단 및 데이터/외부 링크/참가 점 확인.
- **PASS** 국가별 국제대회 내역/명단/모바일 Chromium 검증 [run #44424948624](https://github.com/kvolleylab/kvolleylab/actions/runs/44424948624).
- **PASS** 팀 디렉터리 남녀/국가/프로/KOVO/모바일 Chromium 회귀 [run #44424948417](https://github.com/kvolleylab/kvolleylab/actions/runs/44424948417). 기존 40개국과 불일치했던 구형 3개국 QA 기대값 수정 후 통과.
- **NOT VERIFIED**: 실제 `kvolleylab.com` HTTPS 페이지에 새 글씨 크기가 배포되었는지 — 아직 PR 리뷰 단계라 main 병합·Pages 배포·운영 브라우저 검증 미실시. 개인 관리자 계정의 실제 로그인도 검증하지 않았다.
- 일부 대학 Player Master 별도 CI 실패는 기존 다른 경로로, 이번 국제명단 브라우저 3종 PASS와 구분한다.

## 수정 파일·릴리스 게이트
- `assets/css/kvl-international-countries-v1.css`
- `assets/css/kvl-international-unified-roster-v1.css`
- `teams.html`
- `tests/international-unified-roster-browser-v1.cjs`
- `tests/teams-directory-browser-qa-v1.cjs` (CI 구형 국제팀 3개 기대값을 현재 검증 40개국으로 정정; 운영 기능 변화 없음)
- 문서: 이 파일 및 변경결정 원장.

PR: https://github.com/kvolleylab/kvolleylab/pull/368

운영 배포 전 사용자 **명시적 승인** 후 해당 PR 병합, Pages 완료 확인, 실제 PC 1440/1024 및 모바일 390/360 가로 넘침·3개 대회·26명·카드/별도 명단·Volleybox·원점·프로팀 회귀를 점검한다. 회귀 시 PR 변경만 revert하고 선수 MASTER/원본/자동화는 유지한다.

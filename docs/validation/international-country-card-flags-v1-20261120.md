# K-Volley Lab 국제 팀찾기 국기 SVG 이미지 v1 — 2026-11-20

**Status:** USER REQUESTED / FEATURE BRANCH IMPLEMENTED / QA AND PRODUCTION EVIDENCE TO BE CONFIRMED.

## 목표 및 기존 코드
- 대상: `teams.html?category=international&gender=men`, 여자부·지역 필터 포함 전체 40개 국가 카드 및 선택한 국가 상세 헤더.
- 기존: `assets/js/kvl-international-countries-v1.js`의 KVL `flag_iso2`를 이모지 문자로 변환하고 `assets/js/kvl-teams-directory-v1.js`의 `.ktd-flag-icon`에 넣음. 글꼴/운영체제별로 표시가 달라질 수 있고 실제 국기 이미지 파일이 아님.
- 원칙: 기존 카드 로고 열 31% 비율, 문구/링크/출처, 2026년 원본 40개국·지역의 식별자·국가명 및 모바일 레이아웃을 유지. 기존 국제 국가별 명단·선수 데이터 및 프로 구단 로고/명단 UI를 변경하지 않는다.

## 신규 파일의 출처 및 라이선스
- `data/international/country-directory-v1.json`의 40개 국가·지역 각각의 `flag_iso2` (이미 검증된 KVL 데이터 필드)를 그대로 사용.
- 정적 국기 이미지: `assets/images/flags/4x3/{iso2}.svg` 총 40파일. 출처: [lipis/flag-icons](https://github.com/lipis/flag-icons), 고정 commit `ac7e0eb3259eb62aa6100c435607e2fe03896a97`, `flags/4x3/` 폴더. 4:3 SVG; 출처 SVG 내용을 임의 재그리지 않음.
- 라이선스는 `assets/images/flags/LICENSE.txt` (MIT); 출처/주의사항은 `assets/images/flags/SOURCE.md`. SVG 전체 파일 40개를 KVL 저장소에서 직접 호스팅함. 외부 국기 CDN 호출을 추가하지 않는다.
- `차이니스 타이베이` 등은 KVL 기존 `flag_iso2` (예: `tw`)를 보존한다. 경기단체 전용 엠블럼/올림픽 위임 국기를 임의 추정해 바꾸지 않는다. 공식 경기 참가 표장과 국가 flag는 구별하며 별도 근거·승인 전 원본 코드 불변.

## 화면 구현
- 국가 카드에서 `flag_iso2`로만 로컬 SVG 경로를 만들고 `<img alt="국가명 국기" loading="lazy">`로 표시. 잘못된 ISO2 코드는 이미지 URL로 사용하지 않고 원래 이모지 fallback만 표시.
- 파일 오류 시 카드/선택 국가 헤더의 국기 이미지 요소를 숨기고 원래 이모지 fallback을 복구하는 `error` event를 위임해서 사용. 내장 HTML 이벤트 속성/제3자 요청 없음.
- CSS는 국제 국가 카드의 기존 로고 열을 그대로 사용하여 최대 112×84px 국기를 그림자와 얇은 선으로 보여주며 모바일에서는 최대 90×67.5px. 상세 헤더 국기는 기존 75px 프레임 내부에 별도 크기로 표시.
- `teams.html` 국제 국가 CSS/국가 모듈/팀 디렉터리 JS 캐시만 `20261120-flags-v1`로 갱신. 필터, 대회별 명단, 선수 상세, V-리그 자동화, 공개 JSON, 회원/개인메모는 변경하지 않음.

## 검증
- `tests/international-country-history-v1.test.cjs`: 검증된 KVL 국가 ISO2와 실제 SVG 파일 목록 정확히 40개 일치, SVG 루트/출처 `id`/보안 문자, MIT LICENSE 존재, 모든 국가 카드의 alt/자산경로/emoji fallback 확인. 악성/미확인 코드가 이미지 src로 들어가지 않음.
- `tests/international-country-browser-qa-v1.cjs`: PC 1440px에서 40개 SVG 요청 이미지 전부 decode/naturalWidth, 국기 크기 비율/소스 경로/일본 상세 국기 로드, 지역 필터·남녀·선수명단/프로 회귀, 모바일 390·360px 카드 일본 국기 로드/검색/스크롤 및 상세 국가화면 확인.
- 기존 `tests/teams-directory-browser-qa-v1.cjs` 및 국제 통합명단 테스트 유지.
- GitHub Actions/Pages/실제 공개 HTTPS 검증은 동일 SHA를 확인한 뒤 결과 기록. 성공 전에는 DEPLOYED라고 주장하지 않음.

## 운영 및 복구
- 기준 main `07b3fc0420978184ec3c7e5cc0679953bf5a59e8`.
- `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, 기존 팀 카드 CSS·JS, `country-directory-v1.json` 검토.
- **Google Drive 원본과 재대조: NOT VERIFIED.** 이 변경은 이미 KVL에서 검증한 국가 ISO2와 명칭을 사용한 이미지 UI 변경이며 대표팀 선수/경기 원본 자료 변경 없음.
- 복구 시 해당 PR의 변경만 revert. 자동화/선수·대회 MASTER·회원/메모, 기존 KOVO 게시기/출처 JSON은 원복하지 않는다.

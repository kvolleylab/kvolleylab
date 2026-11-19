# KVL 국제 국가별 선수명단 소속 국가 표기 통일 v1 — 2026-11-20

**Status:** USER REQUESTED / FEATURE BRANCH IMPLEMENTATION / PRODUCTION DEPLOYMENT NOT YET VERIFIED

## 문제와 사용자 요구

국제 국가대표팀 통합명단 및 별도 대회명단에서 같은 국가 리그 소속임에도 일부 선수는 `JAPAN`, 일부는 `JAPAN · SV.League Men`으로 표시되어 불규칙하다. 원인은 종전 `assets/js/kvl-international-unified-roster-v1.js`의 `leagueLabel` 및 `assets/js/kvl-international-countries-v1.js` 개별 대회 `clubLine`이 원본 `clubLeague`/`leagueName` 값이 있을 때만 리그명을 추가하기 때문이다.

사용자가 앞서 요청한 기준은 **소속팀 바로 옆에 그 팀이 소속된 리그의 국가명 표시**이다. 따라서 소속 리그 국가와 대회별 상세 리그를 분리해 표현한다.

- 명단 목록에는 국가명만 일관된 대문자+국기 표기로 노출: 예를 들어 `🇯🇵 JAPAN`, `🇮🇹 ITALY`, `🇹🇷 TÜRKIYE`.
- 같은 국가 `Japan`의 모든 출처 검증 소속팀은 원본에 `leagueName`이 있든 없든 **동일하게 `🇯🇵 JAPAN`**. 예전처럼 `Japan · SV.League Men`을 일부 선수에게만 덧붙이지 않음.
- 리그명이 **출처로 확인된 선수**는 목록의 국가 표기에 툴팁 `확인된 리그: ...`를 제공하며 통합 선수 상세정보에서는 리그명도 노출. 국가만 확인된 선수에게는 리그명을 추측하거나 "미확인 리그"를 채워 넣지 않음.
- 소속팀 자체가 확인되지 않은 선수는 기존 `미확인` 표시를 보존하고 국적이나 국가대표팀 국가로 클럽의 리그 국가를 유추하지 않음.
- 통합명단과 개별 대회명단 모두 같은 국가 표시 helper `countryLabel`을 사용 (개별 명단은 통합 JS 사용이 불가할 경우 안전한 국가 대문자 텍스트 fallback).
- 데이터 모델의 `clubCountry`, `clubLeague` 및 `clubProof`는 그대로 보존. 8개 표 필드, 정해진 선수명 **20px**/기본 정보 **17px**, 모바일/PC 반응형과 스크롤, 대회 참여 점, `VB->`/검색 링크, 공식 인원 및 필터 기능은 불변.

## 변경 및 검증 범위

- `assets/js/kvl-international-unified-roster-v1.js`: 단일 `countryLabel` 노출, 목록에는 국가명만 출력하고 상세 화면에는 검증된 리그명 유지.
- `assets/js/kvl-international-countries-v1.js`: 개별 대회명단에서 같은 국가 라벨을 사용하고, 검증된 리그명은 title 힌트로 이동.
- `teams.html`: 두 JS 쿼리 버전 `20261120-country-v1`로 갱신해 브라우저 캐시 무효화. CSS/데이터/글꼴 변경 없음.
- `tests/international-unified-roster-live-v1.test.cjs`: 소스 국가만 있는 일본 소속팀과 상세 리그까지 있는 일본 소속팀의 출력 일치, 26명·42건·국가별 데이터 보호.
- `tests/international-unified-roster-browser-v1.cjs`: PC1440/900 및 모바일390/360에서 실제 Japan 라벨 동등, 국적 혼합/미확인 불추정, 상세 툴팁, 20px/17px, 링크/탐색/기존 프로팀 회귀.

## 근거·릴리스 게이트

- Base GitHub main: `b00ffcdb3e91d31fa264306de6dbecc02f868110`.
- `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `docs/KVL_DECISION_LOG.md`, `docs/validation/international-club-league-vb-v1-20261119.md` 및 실제 두 JS 파일 확인.
- 별도의 Google Drive MASTER 문서 원문 다운로드·재대조 **NOT VERIFIED**; 기존 승인 GitHub 경기/소속·리그 메타 원본에서 **표시 형식만 변경**하므로 신규 정보 추정/저장 없음.
- PR Chromium 및 품질감사, GitHub Pages와 실제 운영 HTTPS 검증은 각 동일 SHA의 실제 Actions 결과를 확인해 별도 기록한다.
- 복구 시 새 PR squash 단독 revert; 선수·대회 DB/원본, KOVO 수집·자동화 및 Supabase 개인정보/회원 접근은 변경/롤백하지 않는다.

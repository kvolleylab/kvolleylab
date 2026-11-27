# 국가대표팀 메뉴 정리 및 연령별 기록 UI v1 — 검증·인계

- 기준 main: `d41bea478d850806b2f51d4d1932357ec45b7f28` (2026-11-27 KST)
- 상태: IMPLEMENTED ON FEATURE BRANCH / **NOT DEPLOYED**
- 승인 범위: 기존 4개 국가대표팀 사이드 메뉴 중 중복 성인 대표팀 하위 항목만 제외. 대표팀 홈·올림픽/대표팀 로드맵은 유지하고, 연령별 대표팀을 기존 DB 기반으로 개선.

## 변경 내용
1. `assets/js/kvl-global-sidebar-v1.js`: 사이드 메뉴 `성인 대표팀` 항목만 제외. `대표팀 홈`, `올림픽·대표팀 로드맵`, `연령별 대표팀`은 유지. `assets/js/unified-nav.js`의 공통 사이드바 캐시 키 갱신.
2. `national-team.html` 및 `assets/js/national-team-home-v2.js`: 콘텐츠에서 기존 비어 있는 성인 히스토리로 가던 링크를 실제 존재하는 올림픽·대표팀 로드맵으로 연결. 기존 연령별 대표팀 링크 및 세대추적 링크 보존.
3. `national-team-history.html` 및 `assets/js/national-team-history.js`: 연령별 보기 선택 시 남녀 전환, U16~U23, 연도 필터, 연대순 대회 카드, 결과, 감독/일정/참가 상태, 펼침형 당시 선수명단, 기존 Player Master 링크, 당시 소속 스냅샷, 세대추적 및 출처 링크. `event=...` deep link는 필터와 펼침 상태를 자동 연동.
4. `assets/css/national-age-history-v1.css`: KVL 대표팀 홈과 동일 계열의 라이트/네이비/골드 1180px 디자인 및 모바일 선수 행 카드형 배치. 연령별 모드에만 적용해 기존 성인 히스토리/세대추적 스타일 보호.
5. 남자 연령별 DB의 기존 자료(2010~2025 일부 연도의 U18/U19/U20/U21/U23)를 읽어 렌더링. 여자 연령별 기록은 현재 연결된 데이터가 없어 실제 참가·선수·성적을 만들어 내지 않고 '자료 미구축 ≠ 미참가/미선발'을 안내.
6. 기존 일부 아카이브와 부분 명단이 중복될 수 있으므로 **화면 렌더링 시에만** event + 선수명 + 생년월일(없으면 등번호) 기준 중복 명단 행을 정리. 공식 JSON/Master/Source ID와 개별 선수 ID는 불변. 공식명단과 원문 재대조 필요 자료는 라벨을 구분함.

## 배포 보호 / 영향 확인
- 변경 경로는 위 페이지·JS·CSS·테스트·검증문서에 제한. `data/national/**`, `data/master/**`, `player*.html`, `player-cohort.html`, `olympic-roadmap.html`, 경기 자동화, 회원/Supabase, GitHub Pages 배포 설정은 수정하지 않음.
- 기존 `national-team-history.html?scope=senior` URL은 제거하지 않고 직접 링크로 접근 가능. 사이드 메뉴만 제외.
- 기존 `national-team-history.html?scope=age&event=...`와 `player-cohort.html`의 상세 이벤트 링크는 그대로 지원.
- 실제 여자 연령별 대표팀 자료를 구축한 것으로 표현하면 안 됨. 정식 데이터 투입 시 출처·성별·참가 상태 검증이 별도로 필요함.
- Google Drive 원본 MASTER의 추가 직접 점검은 NOT VERIFIED (본 변경은 표시만 수정하며 원본 데이터 쓰기가 없음).

## 검증 기준
- `tests/national-age-history-v1.test.cjs` 6개 시나리오: 메뉴 연결, 실제 역사 JSON 로딩, U23 및 모든 연도/성별 전환, 중복 선수 표시 방지, 이벤트 딥링크, 자료 원본 바이트 불변, 모바일 CSS 분리.
- CI `.github/workflows/kvl-national-age-qa-v1.yml` — JS syntax 및 jsdom 기반 회귀 테스트.
- 이 문서 작성 시점에 CI/PC·모바일 실제 브라우저 화면검사는 아직 결과 미기록이며 PR에 성공/실패 사실을 따로 기록해야 함.
- 운영 병합/배포는 사용자의 **명시적 운영 반영 승인 후에만** 실행.

## 복구
- 본 브랜치 PR 단독 revert. 과거 원장과 개인 메모/선수 프로필은 변경되지 않아 별도 복구 없음.

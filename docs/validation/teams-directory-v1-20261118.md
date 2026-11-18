# K-Volley Lab 팀 찾기 v1 · V-리그 공식 명단 재사용 검증

Date: 2026-11-18 KST
Status: USER APPROVED / VERIFIED / DEPLOYED ON MAIN AND LIVE HTTPS QA PASS (2026-11-18 KST).

## 목적·대상

- 기존 임시 문구만 있던 teams.html을 실제 KVL 팀 디렉터리로 교체한다. 선수·팀 사이드바 → 팀, 홈 팀 정보 바로가기 URL은 그대로 유지한다.
- 기본 분류는 프로. 분류 버튼은 프로 / 대학 / 고교 / 중학 / 대표팀 / 국제. rounded rectangle 스타일은 홈의 대회 바로가기와 통일.
- 프로 MEN / WOMEN 각 7개 구단, 카드별 로고는 폭의 약 31%, 구단명·공식 선수 수·감독 표시, 하단 선수명단 보기. PC 2열, 모바일 1열.
- 기존 teams.html 이외의 홈페이지/경기 페이지/사이드바/선수 프로필 원본은 수정하지 않는다.

## 단일 데이터 원천과 자동화

- data/team-rosters/v-league/index.json의 currentSeason을 사용하며 활성 시즌을 확인한다.
- data/competitions/v-league-{men,women}-{season}/data.json에서 팀 코드·이름·기존 로고를 읽는다.
- 같은 대회의 rosters.json에서 **명단 인원 수를 매번 계산**하며 기존 data.json의 예전 rosterCount 값을 사용하지 않는다. KOVO 수집/게시 워크플로가 갱신하면 이 화면에도 그대로 반영된다. 새로고침 버튼으로 브라우저 세션의 최신 JSON을 다시 읽는다.
- 공식 2026-27 명단 화면은 기존 KVLVLeagueRosterV2.render()를 그대로 호출하며, KVLVLeagueDraftBridgeV1.reconcileCurrent()로 출처 검증된 신인 ID·고교·대학만 연결한다. 선수명 클릭 시 기존 player.html 프로필로 이동한다.
- 원본 Player_ID, 남녀 rosters.json, GitHub KOVO 수집기, 경기 점수, Supabase 로그인·개인 메모는 쓰거나 변경하지 않는다. 26개의 프로/대표팀 과거 Player_ID 충돌 보호도 기존 로직을 재사용한다.
- 향후 시즌이 추가되어도 선수 수·구단은 currentSeason으로 읽으며, v2 렌더링이 아직 없는 시즌은 기존 대회 명단 페이지로 연결하고 미지원 시즌을 억지로 가공하지 않는다.

## 감독·비프로 출처

- 2026-27 감독은 data/team-rosters/v-league/coaches-2026-27.json에서 읽는다. 남자 2026-10-08 미디어데이, 여자 2026-10-07 미디어데이, 한국도로공사 김영래 정식 승격 2026-10-29 보도 출처를 해당 데이터에 저장했다.
- 감독 정보는 KOVO 로스터 자동 공시와 분리된 **출처/확인일 기준 스냅샷**이다. 감독 자동 갱신을 구현한 것으로 표기하지 않는다.
- 대학: 2026 KUSF 대학 U-리그 남녀 참가팀 및 해당 대회 로스터 자료를 사용해 남자 15, 여자 6개 팀을 연결한다. 대학 남자 코칭스태프는 검증본 university_staff_2026.json 참고.
- 고교/중학: 2026년 기존 5개 학교대회 참가팀 자료를 합쳐 중복 이름을 제외하고 해당 대회로 연결한다. **전체 학교팀 MASTER나 최신 선수 소속 자동화가 아니다.**
- 대한민국 대표팀: 기존 national-team.html의 명시적 gender 경로; 국제: 기존 국제대회 허브 및 VNL 경로를 안내. 국가별 프로 구단 DB까지 완성됐다는 의미가 아니다.

## 검증 방법·범위

- tests/teams-directory-v1.test.cjs: 14개 구단/현행 공시명단 수/소스 경로와 감독, 기존 명단 불변, 드래프트 32명·프로필 검증 28명, 대학 15/6, 고교/중학 참가팀 dedupe, 잘못된 링크 및 HTML XSS 차단.
- tests/teams-directory-browser-qa-v1.cjs: 실제 Chromium 가상 HTTPS에서 1440px·390px·360px, 남녀부 카드/선수 수/로고 31%, 구단 선택, 로스터 검색/상세/선수명→원래 프로필, 정관장 미검증 신인 링크 차단, 대학·고교·중학·대표팀·국제 분류, PC/모바일 가로 넘침 및 JavaScript 에러 점검.
- 사용자 홈페이지는 일반 회원 오픈 전 **member-access-gate-v1.mjs**로 teams.html 로그인을 보호한다. 테스트 브라우저에서만 이 로그인 오버레이를 임시 무효화해 UI를 검사하며 실제 페이지의 인증 코드는 변경하지 않는다. 이 테스트는 실제 관리자 로그인 인증 시험이 아니다.
- 별도 main 배포 후 실제 HTTPS 화면은 .github/workflows/teams-directory-live-qa-v1.yml로 확인. Pages 배포·공개 화면 검증 PASS가 확인되지 않으면 DEPLOYED로 표기하지 않는다.

## 후속과 복구

- PR: #359; 기준 main SHA: 46d856c4911830fcfb5eaef534c9cf377885cebf.
- 복구: #359 관련 teams.html 및 새 팀 디렉터리 전용 파일만 되돌리며, 현재 KOVO 로스터 게시물·수집기·회원 데이터는 원복하지 않는다.
- 영구 Player_ID 중복 해소는 Issue #334, 비신인 이적·차기 시즌 확장은 Issue #331에 남긴다.
- Google Drive 원본의 이번 세션 독립 대조는 불가했던 경우 NOT VERIFIED로 남긴다. 현재 명단은 운영 GitHub JSON 및 기존 공식 source 기록을 재사용한다.

## 최종 운영 배포 증거 · 2026-11-18

- 사용자 승인 요청 수행 PR #359: https://github.com/kvolleylab/kvolleylab/pull/359
- main squash merge SHA: a73224d3aa45ab39a28904249da34b4c01784c8b
- GitHub Pages deployment: https://github.com/kvolleylab/kvolleylab/actions/runs/44228768536 — SUCCESS at same SHA.
- 실제 HTTPS GitHub Pages browser QA: https://github.com/kvolleylab/kvolleylab/actions/runs/44228772412 — SUCCESS, artifact #14393304623.
- 공개 도메인 kvolleylab.com/teams.html 남자 7팀 149명, 여자 7팀 138명 (2026-11-18 검수 당시 자동 공시명단 기준). 실제 페이지에서 OK저축은행 21명 및 정관장 18명 상세 명단을 로드, 윤경 출신 남성고·인하대 및 프로필 이동, 김아중 청수고만 확인·미검증 프로필 링크 차단을 검증.
- 라이브 PC1440/모바일390 남녀 4화면에서 카드/실제 JSON 수/직접 이름 링크/가로 넘침 0px PASS. 구단 14개 전체, 대학 남15·여6 및 학교 카테고리는 PR 단위 소스/Chromium 검수에서 PASS. 라이브 크로스 디바이스 QA는 남녀 대표 구단 2팀 샘플이며 전체 14팀 각각 운영 GUI 방문을 의미하지 않는다.
- 기존 KVL 회원 접근 정책은 enabled=true, teams.html 보호 유지. 라이브 UI 테스트 브라우저에서만 테스트 전용 인증 오버레이 스텁 사용; 실제 관리자 계정 인증 실습을 수행했다고 주장하지 않는다.
- 기존 대학 Player Master 등록 CI 실패는 별도 기존 작업으로 유지. 2026-27 감독은 소스 확인일 기준 스냅샷이며 자동 갱신 대상이 아니다. KOVO 현행 선수명단 자동화·점수·선수 영구 ID는 변경하지 않았다.

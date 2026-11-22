# 국제 국가별 대표팀 통합 선수명단 v1 · 운영 연결 검증 (2026-11-18 KST)

Status: USER APPROVED / VERIFIED / DEPLOYED ON MAIN / PAGES + REAL COUNTRY + TEAM + UNIFIED LIVE HTTPS QA PASS (2026-11-18 KST).

## 사용자 승인과 범위

2026-11-18 사용자는 실제 작동한 독립 프로토타입 PR #364를 검수하고 **"홈페이지에 반영해"**라고 운영 반영을 승인했다. 단일 독립 HTML을 그대로 운영 화면으로 교체하지 않고, 기존 KVL `teams.html` 내부의 `선수·팀 → 팀 → 국제 → 국가 선택` 화면에 공통 컴포넌트로 적용한다.

기준 운영 main: `22f67b13b08ff7c1c0632c7c84b2f8fef3d869f5`; 디자인 참조: `assets/js/kvl-vleague-roster-v2.js`, `assets/css/kvl-vleague-roster-v2.css`, `docs/PLAYER_STANDARD.md`, `docs/KVL_RESPONSIVE_SCALING_STANDARD_V1.md`, 이전 검증 PR #361 및 독립 시안 PR #364.

## 화면과 원본 보호

- **유지**: 기존 40개 국가·지역 카드, 성별·연도·지역·검색, 국가별 2026 대회 목록과 별도의 `명단 보기` (원본명단), 공식 후보·선발 이력, 국가 목록 복귀, 기존 프로·대학·중고/대표팀 분류, KOVO 공시의 최신 프로 명단.
- **추가**: 해당 국가·성별·연도에서 기존 역사형 대회 목록 **아래에** `2026 통합 선수명단`. 모든 원본 스냅샷을 읽어 **확인 가능한 같은 사람만 하나의 행**으로 표시한다.
- 기본 필드 `등번호 / 한국어·영문 이름 / 생년월일 / 포지션 / 신장 / 검증된 소속팀 / Volleybox / 대회별 이력` 유지. 폰트·카드 크기·간격은 기존 KVL v2에 맞춘다. PC는 컴팩트 테이블, 모바일 390/360은 동일 정보를 세 줄로 재배치하되 가로 페이지 스크롤 방지.
- **참가 이력**은 각 대회당 같은 칸 안의 작은 원 하나: 2026 VNL·아시안게임 **빨강**, AVC 대륙선수권·AVC컵 등 다른 저장 대회 **검정**. 공백/대시는 미확인이지 국가 미참가나 선수 탈락을 뜻하지 않는다. **명단 등록**은 실제 경기 코트 출전과 구분한다.
- **소속팀**은 원본 명단에서 confirmed 또는 2026–27 AVC 시즌 검증 스냅샷의 CONFIRMED+공식 HTTPS 근거만 노출한다. 실시간 소속/이적 확정으로 단정하지 않으며 상충 자료는 상세에 이전 표기를 남긴다.
- **Volleybox**는 검증된 `volleybox.net/...-p숫자` 직접 선수 페이지로만 링크하고, 확인된 검색 주소는 '검색'으로 구분. 선수 KVL 내부 프로필은 기존 `verifiedProfileLink`로 선수 ID+성별+국적+생년월일+영문/한글 이름 및 기존 충돌 격리를 모두 통과한 경우만 노출한다.
- **다른 사람이 같은 등번호 사용**: 통합 불가. 이름이 같아도 서로 다른 생년월일은 분리, 생년월일 없는 대회 기록은 임의로 다른 대회의 기록과 연결하지 않는다. 국제 MASTER / 대회별 원본에 신규 Player_ID를 쓰거나 재발급하지 않는다.
- 한 대회 원본이 빠지거나 인원·계약이 변경되면 통합 명단을 **부분 추정해서 표시하지 않고 오류로 안전 중단**하며 기존 개별 대회 명단 확인 경로는 그대로 유지한다.

## 근거 대회와 시범 사례

일본 남자 2026년: VNL 16명 + 아시안게임 12명 + AVC 대륙선수권 14명 = 대회별 등록 기록 42건, 신원 확인 후 합집합 26명. 동일 #3번의 후카츠 아키히로(1987-07-23)와 후카츠 히데오미(1990-06-01)는 분리한다. 일본은 기존 KVL 2026 AVC컵 등록 명단에 없어 AVC컵 참가점을 임의 생성하지 않는다.

기본 국가·성별·연도는 `data/international/country-roster-index-v1.json`의 현재 **89개 원본 포인터**에서만 조회한다. 다른 국가나 여자부에서 생년월일·이름 등 비교 근거가 없을 때는 임의 통합하지 않으며 필요한 기존 상세 링크를 유지한다. 원본 `rosters.json`의 파일 수와 통합한 인원수를 동일하다고 주장하지 않는다.

## 변경 파일 및 실행

- 신규: `assets/js/kvl-international-unified-roster-v1.js`, `assets/css/kvl-international-unified-roster-v1.css`, 소스 무결성·브라우저·배포 후 라이브 테스트 및 해당 GitHub Actions 워크플로.
- 기존의 제한적 수정: `teams.html`에 스크립트·스타일 추가 및 `assets/js/kvl-international-countries-v1.js`의 기존 대회 목록 아래 통합 명단 마운트. 성별/연도 전환과 비동기 fetch 취소, 국가 이탈 시 상태 해제를 보호한다.
- 변경 금지: 기존 6개 국제대회 원본, 마스터, 등록 후보 원장, 기존 선수 ID, 회원 개인정보, `data/member-access-v1.json`, KOVO 등록 수집·게시기, V-리그 경기·순위 JSON.
- 사전 테스트: `node --test tests/international-unified-roster-live-v1.test.cjs`, 기존 country/history 및 team directory 회귀, `tests/international-unified-roster-browser-v1.cjs` Chromium PC1440/모바일390/360.
- 운영 후 테스트: `tests/international-unified-roster-live-qa-v1.cjs`를 실제 `https://kvolleylab.com`에서 실행하여 일본 남자 26/여자/다른 국가, 출생일·소속팀·Volleybox, 별도 대회 명단 버튼, 모바일 및 기존 프로팀 7개 확인. **실제 PASS 기록 전에는 운영 검증 완료라고 표기하지 않는다.**

## 남은 제한 및 복구

Google Drive의 원본 자료를 독립적으로 대조할 연결 계정은 이전 세션에서도 오류로 접근할 수 없었으므로 **NOT VERIFIED**. 기존 GitHub 검수·게시된 대회 JSON만 사용한다. 2026 후보 엔트리 증거 원장은 여전히 0개이며 이 기능이 자동 후보 수집, 다음 시즌 국가대표 출전 확정 또는 경기 출전 집계를 구현하는 것은 아니다.

문제 발생 시 해당 PR의 `teams.html`·국제 국가 상세 UI와 신규 통합 컴포넌트만 되돌린다. 원본 데이터·KOVO 자동수집·선수 ID·회원 메모를 되돌리거나 재작성하지 않는다.

## 2026-11-18 운영 반영·검증 영수증

- PR: https://github.com/kvolleylab/kvolleylab/pull/366 — 사용자 운영 반영 지시로 병합됨.
- 기능 SHA: `32343f2f8f23bc80204e0ccc120c531c05007329`.
- GitHub Pages 배포: https://github.com/kvolleylab/kvolleylab/actions/runs/44325594905 — **SUCCESS** (동일 SHA).
- 기존 국가별 페이지 실제 HTTPS Chromium QA: https://github.com/kvolleylab/kvolleylab/actions/runs/44325602295 — **SUCCESS** (동일 SHA).
- 기존 팀·KOVO 명단 페이지 실제 HTTPS Chromium QA: https://github.com/kvolleylab/kvolleylab/actions/runs/44325602013 — **SUCCESS** (동일 SHA).
- 통합 명단 기능 Chromium 사전 QA: https://github.com/kvolleylab/kvolleylab/actions/runs/44324278001 — **SUCCESS** (기능 최종 코드 SHA `87edf369d441b0b3814fd61e3ebe7232a6021874`), artifact #14434834932. PC 1440 및 모바일 390/360, 일본 26명, VNL 16·아시안게임 12·AVC 14 필터, 원본 명단 유지, 선수 출생일·소속·Volleybox, 대회 점 및 가로 넘침 0.
- 사전 QA 성공 SHA 이후 PR의 병합 전 코드 변경 없음: docs/KVL_DECISION_LOG.md 추가만 비교 검증.
- 통합 명단 **전용 실제 운영 HTTPS Chromium 테스트**: https://github.com/kvolleylab/kvolleylab/actions/runs/44325602067 — **SUCCESS** at `32343f2f8f23bc80204e0ccc120c531c05007329`, artifact `#14436403456` (real PC 1440·mobile 390/360 screenshots + `kvl-international-unified-live-report.json`). Report status `PASS`, all 3 viewport overflow 0px. Actual Japanese men 26 unique roster rows + original separate event roster; Japanese women original roster without invented DOB; existing live KOVO club source data preserved. Test browser intercepts login overlay only locally; real owner account login was not independently checked.
- 회원 접근 보호 유지(실제 운영자 로그인 직접 검증 아님), 후보 장기 자동수집 없음, 원본 Drive 별도 검증 NOT VERIFIED, 기존 Player_ID와 참가 등록/코트 출전 구분 유지.

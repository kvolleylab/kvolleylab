# K-Volley Lab — Decision Log & Session Handoff

## 2026-11-23 · 국제 국가별 명단 등번호 정렬·상단 조작부 압축·2026/27 메타데이터 재검수 v1

Status: USER REQUESTED / FEATURE BRANCH IMPLEMENTED / QA PASSED / NOT DEPLOYED.
사용자는 `teams.html?category=international&gender=men&country=IRI&year=2026`에서 선수명단을 등번호 순으로 정렬하고, `← 국가 목록`과 연도 드롭다운을 국기·국가명 행 오른쪽에 위아래로 붙여 세로 공간을 줄이며, 다른 국가 선수의 소속팀과 Volleybox 링크도 재점검하도록 요청했다.

기준 main `b6e6fa1c9115c82a9bd69dfe20272d1d7242da11`, 브랜치 `fix/international-roster-order-metadata-v1-20261123`. 통합명단과 대회별 개별명단 모두 숫자 등번호 오름차순, 미확인 번호는 뒤에 둔다. 국가 헤더의 기존 별도 `국가 목록` 행과 연도 toolbar를 하나의 우측 조작부로 합치고 모바일에서도 국기·간격·select를 함께 축소한다.

연결 Google Drive의 2026 CEV·CSV 남미·NORCECA·AVC 남자 대륙선수권·아시안게임 MASTER와 현재 GitHub 공개 명단을 교차했다. 영문명+생년월일 exact match 또는 동일 검증 Volleybox ID만 사용했다. VNL 284명은 유지하면서 직접 Volleybox 프로필을 49→134명으로 늘렸고 150명은 근거 부족으로 검색 링크를 유지한다. 현재 소속 레지스트리는 13→132명으로 확장했다. 후속 대륙 MASTER exact match 76명에 더해 AVC 대륙선수권의 CONFIRMED 소속과 direct Volleybox ID가 동시에 있고 원본 DOB가 충돌하지 않는 43명을 공통 레지스트리에 승격했으며, 더 최신인 11월 기존 값 3건은 우선 보존한다. 인도 2명은 AVC Cup/대륙선수권 사이 DOB 충돌을 발견해 공통 레지스트리에서는 제외하고 대회별 원본만 유지한다. 이란의 Mohsen Delavari는 직접 프로필/현 소속을 확정할 근거가 없어 검색·미확인으로 유지한다. 원본 DOB 충돌이 있는 동일 선수 행은 임의 병합하지 않는다.

JS 문법, 국가별 선수 수/색인 일치, direct/search URL 규칙, current-club 필수 필드, 이란 실제 통합 build의 등번호 정렬을 검증했다. 운영 main 병합·Pages 배포는 사용자 별도 승인 전 수행하지 않는다. 상세 검증·복구 기준은 [검증 및 인계](validation/international-roster-order-metadata-v1-20261123.md)를 따른다.

## 2026-11-22 · V-리그 재시도·공식 보완·성별 장애 격리

Status: USER REQUESTED RESILIENCE / FEATURE BRANCH IMPLEMENTED / NOT DEPLOYED.
기준 main `36ed818f833dce723afa890e5c353cf98d053b4f`. 사용자는 한 번의 오류로
업데이트가 계속 멈추지 않도록 재시도와 여러 공식 보완 경로를 요청했다.
오늘 확인된 정각 전용 달력 검사 결함을 고치고, 동일 경기의 예정/실제 시작시각
차이를 경기 신원과 분리한다. 시즌·단계·성별·경기번호·라운드·날짜·홈/원정 및
승수·득점 충돌 검증은 유지한다. 공식 일정과 문자중계 외 새 공급자는 추가하지 않는다.

공식 GET의 일시 통신/5xx/429만 최대 두 차례 재시도하며 서버 대기 지시를 지킨다.
성별마다 완전한 공식 일정·순위·후보를 검증해 실패 부문의 기존 JSON·관측시각·ID
연결을 보존한다. 검증된 다른 부문은 MASTER의 기존 잠금·수식·CAS·readback을
통과한 경우만 게시한다. 인증·MASTER·보안·최신 main·배포 검증은 우회하지 않는다.
검증된 승수는 있으나 종료세트 득점이 일부 미확인인 경우도 별도로 기록한다.
부분 게시 뒤에는 Actions를 실패 상태로 남겨 기존 알림이 누락되지 않게 한다.
실제 쓰기 후보에 대해 MASTER 변경 전에 DOM 검사를 수행한다.
새 runtime 진단은 시즌 보관 입력에서 엄격히 검사하고 공개 archive에서는 제외한다.
부문 보류·종료세트 누락이 있는 영수증은 정상 시즌 종료 증거로 승격하지 않는다.

선수 MASTER/명단/ID, 국제대회/Cup, 화면 양식, Worker/cron, 비밀키는 변경하지 않는다.
자세한 회귀·읽기 전용 실제 자료 대조·운영 승인과 다음 실경기 확인 항목은
[검증 및 인계](validation/vleague-resilience-v1-20261122.md)를 따른다.
새 PR 병합·운영 배포는 별도 사용자 승인 후 수행하며, 코드 테스트를 실경기 복구 완료로 간주하지 않는다.

## 2026-11-22 · OK저축은행 감독대행 공식 반영 및 V-리그 오늘 경기 우선 표시

Status: USER REQUESTED PRODUCTION / FEATURE BRANCH IMPLEMENTED / RELEASE REQUIRES QA AND PAGES EVIDENCE.
사용자는 2026-27 V-리그 OK저축은행 신영철 감독의 사퇴와 김재헌 감독대행 체제를 홈페이지에 반영하고, V-리그 페이지의 `오늘 경기`와 `최근 결과` 카드 노출 순서를 바꾸어 `오늘 경기`가 먼저 나오도록 요청했다.

**공식 근거:** OK저축은행 읏맨 배구단이 2026-11-17에 발표한 [구단 공식 소식](https://www.okfinancialsports.com/volleyball/story/news_content.asp?num=4807&page=1)에 따르면 신영철 감독은 사퇴했고, 같은 날 한국전력 경기부터 김재헌 수석코치가 감독대행으로 선수단을 지휘한다. 제3자 기사 [연합뉴스 2026-11-17](https://www.yna.co.kr/view/AKR20261117089800007)에서도 교차 확인. 정식 신임 감독 선임으로 단정하지 않는다.

**변경:** `data/team-rosters/v-league/coaches-2026-27.json`에 OKF 현 감독대행 `김재헌`/`role: acting`/`asOf: 2026-11-17` 및 사퇴한 종전 감독 `신영철`의 변경 이력과 공식 발표 URL 기록. `assets/js/kvl-teams-directory-v1.js`는 OKF 카드만 `감독대행 : 김재헌`으로 표시하고 나머지 13개 남녀 팀 감독 표기는 유지한다. KOVO 선수 공시·로스터 파일과 선수 프로필·고교/대학 데이터를 변경하지 않는다.
V-리그 남녀부 `competition-engine.html?competition=v-league-(men|women)-2026-27&view=overview`의 공통 `assets/js/kvl-domestic-home-v2.js` 요약에서 종전 `최근 결과 → 오늘/다음 경기` 순서를 `오늘/다음 경기 → 최근 결과`로 변경한다. 경기 선별 로직, 실시간 세트/득점, 경기 데이터/경기ID/상태·경기시간, KOVO 수집, 홈의 오늘 경기/최근 경기 UI 등은 변경하지 않는다. 화면 제목도 이에 맞춰 순서를 표시한다.

기준 main `1d0ffb88c7f0075ae656e5da6e5a98289d8b38cb`. `teams.html`, `competition-engine.html`의 관련 JS 캐시 쿼리만 갱신. 검증·복구는 [2026-11-22 인계](validation/okf-acting-coach-vleague-today-first-v1-20261122.md) 참조. 운영 배포 상태는 GitHub PR 병합·Pages 성공과 동일 SHA 실제 홈페이지 검증 이후 확인한다.

## 2026-11-21 · Preserve honest waiting states in the live publisher candidate gate

Status: USER REQUESTED REPAIR / IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED.
On base `26842dd922c96219d4f90e0671a62becc05f7709`, repair the candidate UI
checker that expected VS for an unobserved game after kickoff, blocking the
other division's valid live update on11/21. Independently verify scheduled,
waiting, live, pending-final and stale states, exact points and observation
labels; do not weaken checks or change the honest production display.
Unmodified failure artifact: before0/6, after6/6. Current final candidate6/6,
Python292, Node110 and separate synthetic checker22 pass. No source, data,
MASTER, IDs, roster, standings, international/Cup, workflow, Worker or cron
changes. Production merge approval and subsequent natural/live verification
remain required. [Evidence and release gate](validation/vleague-candidate-waiting-gate-v1.md).

## 2026-11-20 · 팀찾기 카드 PC 3열·모바일 2열 반응형 v1

Status: USER APPROVED IMPLEMENTATION / FEATURE BRANCH IMPLEMENTED / RELEASE GATED BY QA.
사용자가 팀찾기 `teams.html`의 팀·국가 카드 목록에서 PC 한 줄에 **3팀**, 모바일 한 줄에 **2팀** 표시하는 구성을 상담한 뒤 `진행해`로 구현을 승인했다. 중간 PC/태블릿의 좁은 가로폭에서 무리하게 3개를 욱여넣지 않도록 이전 추천대로 브라우저 화면폭 기준 **1280px 이상 3열 가로 카드, 661~1279px 2열 가로 카드, 660px 이하 2열 세로 카드**를 적용한다. 카드 목록에만 한정하고, 국가별 선수 명단 표 자체의 컬럼·폰트·정보량은 변경하지 않는다.

모바일 카드(360/390px) 내부 구조는 기존 로고 31% 좌우 배치에서 **위쪽 로고/국기 → 중앙 팀명·확인된 선수 수/감독·출처 → 하단 선수명단/팀정보 버튼**의 세로 정렬로 변경하고, 로고 60~78px와 약 44px 이상의 터치 가능 버튼을 유지한다. 길이가 긴 구단명·국가명은 강제로 말줄임하지 않고 여러 줄 줄바꿈한다. 기존 실제 KOVO 명단·국기 SVG 40개·감독 및 학교/대회 출처 텍스트·선수/팀 링크·전체 카드 개수·남녀 선택·지역/국가 필터·로그인 접근·상단 홈 이미지 HERO는 보호한다. 카드 행 높이는 각 그리드 행에서 동일하게 확장되며 기존 PC 구단 로고 31% 열 구조는 보존한다.

기준 main `7d574422b98c63e808c61859fe0c760484f9df44`. 구현 범위: `assets/css/kvl-teams-directory-v1.css` 후행 반응형 규칙, `teams.html` CSS 캐시 버전, 팀 디렉터리 단위·Chromium·실운영 QA, 검증 문서. [인계](validation/teams-responsive-grid-v1-20261120.md). GitHub Pages/실제 운영 검증 결과는 확인한 동일 SHA 결과만 기록한다.

## 2026-11-20 · 팀찾기 HERO 홈 배경 이미지 재사용 v1

Status: USER REQUESTED / FEATURE BRANCH IMPLEMENTED / PRODUCTION DEPLOY NOT YET VERIFIED.
사용자가 `팀찾기` 페이지 상단 메인 카드 이미지를 `홈`의 메인 카드 이미지와 같게 요청했다. 실제 GitHub main `index.html`의 `.home-hero`는 PC `/assets/img/home-hero/kvl-home-hero-pc-v01.webp`, 680px 이하 모바일 `/assets/img/home-hero/kvl-home-hero-mobile-v01.webp`를 `right center/cover` 배경으로 사용한다. `teams.html`의 `.ktd-hero`는 기존에 이미지 없는 텍스트 영역이었다. 신규 이미지 생성 없이 홈의 **현재 운영 실사용 파일 그대로** 팀찾기 상단 카드에 적용한다.

팀찾기 내용은 팀명과 안내 문구 그대로 유지하면서 PC 318px·모바일 264px의 홈 HERO 높이와 PC 44px·모바일 30px 헤더를 이용하며, 어두운 홈 HERO 이미지에 대비되는 흰색 텍스트와 밝은 설명 문구로 표시한다. 기존 `ktd-main` 1180px 영역 안에서 12px 둥근 모서리를 적용하고 `teams.html` 팀 검색·프로/대학/고교/중학/대표팀/국제 분류·팀/선수 명단·현재 운영 회원 접근·KOVO 자동화·홈 `index.html`은 건드리지 않는다. 참고: 홈과 팀찾기의 전체 페이지 레이아웃은 서로 다르므로 배경 원본/cover 규칙만 동일하게 하고 나머지 페이지 UI는 유지한다.

Base main `2929efbf1149d914acd017cb5f0be0c057d5c7e3`. 변경 범위: `assets/css/kvl-teams-directory-v1.css`, `teams.html` 캐시, 해당 팀 디렉터리 unit/Chromium QA와 검증기록. [검증·복구 인계](validation/teams-hero-match-home-hero-v1-20261120.md). 실제 PR/Pages/운영 HTTPS 테스트 통과를 확인한 뒤 배포 상태를 기록한다.

## 2026-11-20 · 홈 오늘 경기와 V-리그 요약의 득점을 숫자로 통일

Status: USER APPROVED RELEASE / IMPLEMENTED / QA PASSED / DEPLOYMENT PENDING.
사용자가 홈 ‘오늘 경기’ 카드에서 `1세트`, `2세트` 문구를 빼고 득점만 표시하도록 요청했다. 기존 일정표 및 최근 경기 결과와 같은 `20–25 / 25–21` 형태로 홈과 같은 요약 기능의 V-리그 한눈에 보기에도 적용한다. 세트 순서는 유지하며 번호는 툴팁과 접근성 이름에 남긴다. 중앙 세트 승수(0 포함), 진행·종료 확인 중·갱신 지연 상태, KST 관측시각과 공식 검증 조건은 변경하지 않는다.

기준 main `d3b6b8b87d2229f0b7f2d718c23ebc52f07ae073`. 표시 문제와 오늘 자동화 실적을 구분해 [검증 기록](validation/home-live-points-only-v1-20261120.md)에 남긴다. 수집기·MASTER·경기/선수 ID·명단·순위·Cup·국제대회·Worker/cron은 변경하지 않는다. 2026-11-20 사용자가 PR #382 병합·운영 배포를 명시적으로 승인했다. 검증된 head `149d2f263d24c63b2ce36ffd18aa157c0c4dd15e`의 표시 로직을 유지하며 최신 main `82e3567d3234a08d989a4adfc77c7add138479df`의 남녀 최종 결과는 보존한다. 최종 병합·Pages·운영 화면 증거는 [PR #382 배포 기록](https://github.com/kvolleylab/kvolleylab/pull/382)에 누적한다.

## 2026-11-20 · 국제 팀찾기 40개 국가 국기 이미지 적용 v1

Status: USER REQUESTED / FEATURE BRANCH IMPLEMENTED / PAGES RELEASE REQUIRES QA.
사용자가 `https://kvolleylab.com/teams.html?category=international&gender=men`의 `팀 찾기 → 국제` 국가 카드에 국가별 국기 이미지를 넣도록 요청했다. 기존 `kvl-international-countries-v1.js`의 KVL 검증 자료 `flag_iso2`와 국기 이모지만 사용한 렌더링을 확인했다. 국가 카드의 기존 **왼쪽 31% 로고 영역**과 국가명·영문명·대회 출처·버튼을 그대로 유지하면서 각 카드에 **정적 로컬 SVG 국기 이미지**를 적용한다. 국가를 선택했을 때 상세 헤더의 국기까지 동일한 파일을 사용한다. 모바일 카드 크기/간격 및 남녀·지역·국가·연도 필터, 국내 프로팀 구단 로고/명단과 회원 접근은 불변.

기존 40개국의 `data/international/country-directory-v1.json`에서 검증된 ISO alpha-2 코드를 그대로 사용해 `assets/images/flags/4x3/*.svg` 40개를 self-hosting으로 추가한다. 소스는 `lipis/flag-icons` 커밋 `ac7e0eb3259eb62aa6100c435607e2fe03896a97`의 해당 파일(별도 MIT 라이선스 동봉)이며, 동일 원본을 사이트 밖 제3자 CDN에 실시간 의존하지 않는다. 국기 로딩 실패 시 기존 이모지 fallback이 보이고, 불법/미확인 코드로 파일 URL을 조합하지 않는다. 등록된 국가 코드 자체/정치·스포츠 출전 명칭을 변경하거나 경기 데이터/MASTER를 추정하지 않는다.

기준 main `07b3fc0420978184ec3c7e5cc0679953bf5a59e8`. 작업·검증 인계: [40개국 국기 이미지 v1](validation/international-country-card-flags-v1-20261120.md). 실제 운영 배포와 Chromium 검증 결과는 동작 증거를 확인한 뒤 별도 기록한다.

## 2026-11-20 · 국제 국가별 선수명단 소속 리그 국가 라벨 통일 v1

Status: USER REQUESTED / BRANCH IMPLEMENTED / NOT DEPLOYED UNTIL VERIFIED.
사용자가 국가별 대표팀 통합·개별 선수명단에서 일부 소속 표기는 `JAPAN`, 일부는 `JAPAN · SV LEAGUE`처럼 서로 다르게 보이는 문제를 제기했다. 2026-11-19 요청의 핵심은 **구단 소속 리그 국가명 표시**였으므로, 리그명 확인 여부와 무관하게 목록에는 `🇯🇵 JAPAN`처럼 국기와 국가명 대문자만 표시하도록 통일한다. 같은 국가의 실제 소속리그 `SV.League Men` 자료가 있더라도 명단에서 국가명 옆에 가변적으로 덧붙이지 않는다. 출처로 검증된 리그명은 선수 상세정보 및 국가 라벨 툴팁에 보존한다. 해당 국가 자체가 확인되지 않은 선수에게는 국적/소속 리그를 추정하지 않는다.

구현: `assets/js/kvl-international-unified-roster-v1.js`의 공통 `countryLabel`을 국가별 개별 명단에서도 재사용, 비정상 단독 로드에서는 안전한 국가 대문자 fallback. `teams.html` JS 캐시만 변경, 20/17px 서체와 `VB->`, 참가 이력, 원본 선수 및 자동화·회원 기능 불변. 기준 main `b00ffcdb3e91d31fa264306de6dbecc02f868110`; 테스트·복구 기준 [인계](validation/international-roster-country-only-label-v1-20261120.md). 최종 운영 반영/테스트 성공 여부는 실제 PR·Actions/Pages·HTTPS 증거 확인 후 별도 기록한다.

## 2026-11-20 · V-리그 세트 전환 및 종료 직후 공식 득점 보완

Status: USER APPROVED RELEASE / IMPLEMENTED / PR SAFETY QA PASSED / DEPLOYMENT PENDING.
사용자가11/19 실제 갱신 검증 뒤 남은 누락의 보완을 요청했다. 기준main `5813a04a255b895ac07059989595aefe66fb6d7d`. 문자중계의 세트 번호가 승수보다 한 단계 늦은 세트 사이 상태는 종료 득점·승자·연속성이 모두 맞고 다음세트 득점이 없을 때만 인정한다. 거절 전 검증된 숫자 진단도 남긴다. 실제19:59 artifact에는 원시setIng가 없어 당시 값을 확정하지 않는다.

추가 확인한21:42 자연실행은 종료 표시와 불완전 득점 때문에 보완 전 전체 수집이 중단됐다. 당일 정규리그의 공식 종료시각·3승·승자표시·정상 기존 득점이 확인된 경우에만 같은 경기 문자중계의 완전한3~5세트와 대조한다. 전체 득점·승수·기존 점수가 일치해야 확정하며 실패·충돌은 계속 차단한다. 출처는 공개점수와 배포영수증에 보존한다. 이는 기존11/14 문자중계 보완을 종료 직후 검증에 제한적으로 확장하며 순위·MASTER 검수·선수·ID·Cup·국제대회·Worker/cron은 유지한다. [증거·검증·배포 제한](validation/vleague-set-transition-recovery-v1.md). 2026-11-20 사용자가 검증된 PR #379 병합·운영 배포를 명시적으로 승인했다. 기존 head `8144c636`의 V-리그 CI `44553259328` 성공 후 최신 main `b00ffcdb`의 별도 국제명단 화면 변경을 보존하고 작업 기록 문서 충돌만 정리한다. 코드 배포는 병합·Pages·운영 조회 증거로 확인하며, 실제 다음 경기 연속 검증 전 복구 완료로 판정하지 않는다.

## 2026-11-20 · 국제 국가별 선수명단 글꼴 일치 및 PC 20/17px 조정 v3

Status: USER REQUESTED / IMPLEMENTED ON REVIEW BRANCH / DEPLOYMENT NOT YET VERIFIED.
사용자는 국제 국가별 통합·개별 선수명단 글씨체가 다른 이유를 문의하고 **PC 선수명 20px, 나머지 선수 정보(영문명·등번호·생년월일·POS·신장·소속팀·Volleybox·표 제목) 17px**로 추가 축소를 요청했다. 기존 운영 코드의 공통 밝은 테마 `assets/css/site-theme-light.css`는 `Arial,"Noto Sans KR",sans-serif`를 사용하지만 `assets/css/kvl-teams-directory-v1.css`와 국제 통합명단은 `Arial,'Malgun Gothic',sans-serif`를 지정한다. 브라우저의 실제 한글 fallback이 달라질 수 있고 통합명단 선수명/헤더에 쓰인 font-weight 900도 차이를 키운다.

초기 Chromium에서 실제 KVL 본문은 `Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`, 국제명단은 `Arial,"Noto Sans KR",sans-serif`로 확인되어 서체 불일치 재현(CI #44552598891)됐다. 고정 Noto Sans KR 방식은 폐기하고 **국제 국가 패널 및 통합명단이 `font-family:inherit`로 실제 사이트 폰트를 상속**하도록 수정한다. 국제 전용 버튼·검색 입력도 상속하고 통합명단 제목/헤더/등번호의 과도한 굵기는 800으로 조정한다. 기존 글로벌 메뉴와 프로 구단 명단은 변경하지 않는다. 검증된 소속팀·리그 국가/리그명, `VB->`/검색 링크, 원형 대회 참가 이력, 대회별 원본/인원, 모바일 기존 카드·행 구조, 내부 가로 스크롤 및 회원·KOVO 자동화는 보존한다. 기준 main `5813a04a255b895ac07059989595aefe66fb6d7d`. 정적/브라우저/운영 검증 기록은 [v3 QA 인계](validation/international-roster-typography-v3-20261120.md)에 둔다. 운영 배포 여부는 실제 병합과 Pages·실제 HTTPS 확인 후에만 변경한다.

## 2026-11-19 · 국제 국가별 명단 리그 국가와 VB 단축링크 형식 복원

Status: USER REQUESTED REVIEW / FEATURE BRANCH IMPLEMENTATION / NOT DEPLOYED.
사용자가 국제대회 참가팀 기존 명단을 확인하고 소속팀 바로 옆 리그 국가 표시, Volleybox의 `VB->` 단축 표기를 재요청했다. 기존 AVC 남자 대륙선수권 특화 명단 `assets/js/avc-men-roster-runtime.js`는 이미 `🇮🇹 Italy · SuperLega`와 `VB↗`를 제공하지만, 최신 `teams.html`의 국가별 **연도 통합명단**은 검증된 구단만 노출하고 국가/리그 필드를 누락했으며 'Volleybox' 전체 단어를 사용한다. `docs/KVL_MOBILE_COMPETITION_ROSTER_V1.md`의 일반 규격(PC `Volleybox ↗`, 모바일 `VB↗`)과 사용자의 최신 단축 표기는 구분한다.

이번 화면 정합성 변경은 검증된 소속팀과 함께 저장된 `club.country` 및 `CONFIRMED` AVC 2026-27 registry의 `leagueCountry`/`leagueName`만 재사용하고, 추정 리그나 미확인 소속을 생성하지 않는다. 선택된 구단이 바뀌면 리그 메타데이터도 함께 바꿔 국가 혼합을 방지한다. 국가별 개별 대회 명단에는 확인된 소속·리그만 선수명 아래에 추가하고 원래 표 구성을 보존한다. 웹의 직접 링크는 `VB->`, 검색 링크는 `VB 검색`으로 구분하며 22px/19px PC 글씨, 모바일, 기존 40개 국가·대회별 원본·후보·참가 이력·선수 ID·KOVO 자동화·회원 자료는 불변. 기준 main `a7769a705ef14d353bd136bb0666ee3ef7db1bb2`, [검증 원장](validation/international-club-league-vb-v1-20261119.md). 사용자 운영 반영 승인은 받지 않았으므로 브랜치 QA·PR 검수 후 별도 승인 단계까지 main은 변경하지 않는다.



## 2026-11-19 · 국제팀 PC 선수명단 글씨 2px 축소 v2

Status: USER REQUESTED / REVIEW IN PROGRESS / RELEASE NOT YET VERIFIED.
사용자는 직전 PR #368을 홈페이지에 반영해 직접 확인한 후 "2px씩 낮춰"라고 후속 조정을 요청했다. **PC에서 한글 선수명 24→22px, 번호·영문명·생년월일·POS·신장·소속팀·Volleybox·표 헤더 21→19px**만 조정하고 기존 통합·대회별 명단, 작은 참가 점, 내부 스크롤, 여타 기본 서체 및 모바일 스타일은 변경하지 않는다. 2026-11-19 최신 main `eb43ed1f6cacf2507076547c6aa9d04c2a5e4f91`의 PR #368 실제 운영 반영 (GitHub Pages #44482327532 SUCCESS, 팀 디렉터리 운영 QA #44482331714 SUCCESS, 국가별 운영 QA #44482331737 SUCCESS)을 기준으로 한다. CSS 2개·HTML 캐시키·기존 Chromium QA 검증 기준만 수정하며 원본 데이터, 국제/국내 Player_ID, KOVO 수집기, 회원 기능은 불변. [검증/인계](validation/international-roster-font-minus2-v2-20261119.md). 병합·배포 및 운영 QA 증거는 실제 확인 후 별도 기록한다.


## 2026-11-19 · 국제 국가별 대회 카드 가로 정렬 및 PC 선수명단 가독성 v1

Status: USER REQUESTED / PR #368 IMPLEMENTED + CHROMIUM QA PASS / NOT DEPLOYED.
사용자 제공 예시를 기준으로 국제 국가 상세의 대회 카드가 PC에서 가로로 정렬되고 통합 선수명단과 별도 대회명단의 글자·행 간격이 충분히 보이도록 요청했다. 기존 KVL 이름/생년월일/POS/신장/소속팀/Volleybox/대회별 참가 이력과 실제 출처 자료, 남녀·연도·국가 전환·팀 검색 및 KOVO 자동화는 유지한다. 카드에는 확인된 대회만 표시하여 2026 일본 남자 AVC컵을 임의 추가하지 않는다(기존 등록 3개 대회). PC 821px 이상 최대 4열 카드. 2026-11-19 추가 피드백에 따라 왼쪽 메뉴의 실제 기본 글자 크기 14px로 선수 데이터/영문/헤더/출처확인 링크·대회 버튼을 통일하고, 한글 선수 이름은 16px, 행 높이는 통합 73px·대회별 75px로 조정(이 초기 크기안은 아래 150% 확대 요청으로 대체). 모바일 820px 이하 기존 레이아웃 유지. CSS와 `teams.html` 캐시 참조·브라우저 QA 검증 규칙만 수정했다. 과거 구형 팀 디렉터리 QA의 국제 카운트 3개 단언은 기존 승인 국가 40개에 맞게 테스트만 정정했다. 기준 main `add517ea51490305a04595e03631b5411cd13179`, 검토 PR [#368](https://github.com/kvolleylab/kvolleylab/pull/368), [검증·인계](validation/international-roster-pc-readability-v1-20261119.md). 정적 검사 통과. 후속 24/21px 코드에 대한 PR Chromium 검증은 국제 통합명단 #44424948478, 국가별 화면 #44424948624, 팀 디렉터리 #44424948417 모두 **PASS**. 운영 HTTPS 배포·사용자 실계정 확인은 **미실시**. 추가 사용자 의견: 브라우저 150%로 확대했을 때의 가독성을 기준으로 **PC 통합 선수명단 및 대회별 개별 명단의 선수명 24px, 나머지 선수 정보·표 헤더 21px**로 확대한다. 고정 크기 문서 전체 배율은 변경하지 않으며, 통합표 최소 1040px·개별표 최소 990px의 영역 내부 가로 스크롤로 좁은 PC에서도 글자를 작게 만들지 않는다. 기존 모바일 CSS·원본 선수정보·점 표시·Volleybox·링크는 유지한다. PR #368 리뷰 단계만 갱신하며 운영 main 병합은 사용자 별도 승인이 있어야 한다. 사용자 별도 운영 승인 전 병합하지 않는다.


## 2026-11-18 · 국제 국가대표팀 대회별 선수명단 통합 + 소형 참가 이력 v1

Status: USER APPROVED / DEPLOYED ON MAIN / PAGES + COUNTRY + TEAM + UNIFIED LIVE QA PASS (2026-11-18 KST).
사용자 검수 완료 독립 프로토타입 PR #364를 실제 `선수·팀 → 팀 → 국제 → 국가별 연도`에 반영하도록 승인했다. 기존 KVL 선수명단 기본 필드(한글/영문명·생년월일·POS·신장·출처 확인 소속팀·Volleybox·검증된 KVL 프로필)를 줄이거나 삭제하지 않고, 2026 연도별 공개 대회명단의 동일 선수만 정확한 신원 근거(출생일+영문 이름 또는 출생일+동일 Volleybox 프로필 ID)로 통합한다. 등번호만 같거나 생년월일이 없으면 합치지 않는다. 대회별 해당 선수 **공개 명단 등록**은 참가이력 칸에 작은 원으로 표시(중요 VNL·아시안게임 빨강, AVC 및 기타 검정), 실제 코트 출전이나 공식 탈락 판정과 구분한다.

기존 국가 40개국·지역 색인과 대회별 명단 보기, 후보/선발 원장, 프로 및 다른 팀 분류, 기존 회원 접근·KOVO 명단 자동 수집을 모두 보존한다. 2026 일본 남자: VNL16+아시안게임12+AVC 대륙선수권14=원본 등록42건, 동일인 검증 후 26명. 실제 출전하지 않은 2026 일본 AVC컵 카드는 추가하지 않는다. 여자/다른 국가에서 식별 근거가 부족하면 별도 행으로 유지하고 누락은 추정하지 않는다. AVC 2026-27 공식 출처 확인 소속은 실시간 최신 소속으로 단정하지 않는다. 소속 미확인 시 미확인으로 표기한다.

Source of design: `docs/PLAYER_STANDARD.md`, `assets/js/kvl-vleague-roster-v2.js`, PR #364의 독립 HTML, KVL 기존 국제 팀 상세 PR #361. Implementation branch `feature/international-unified-roster-live-v1`, main base `22f67b13b08ff7c1c0632c7c84b2f8fef3d869f5`; verification handoff `docs/validation/international-unified-roster-live-v1-20261118.md`. PR #366은 사용자의 직접 승인으로 squash merge `32343f2f8f23bc80204e0ccc120c531c05007329` 됐으며 GitHub Pages deploy #44325594905 SUCCESS(동일 SHA). 기존 국제 국가별 LIVE QA #44325602295, 기존 팀 페이지 LIVE QA #44325602013도 SUCCESS(동일 SHA). 일본 남자 26명·필드·색점·대회별 버튼·모바일 화면 Chromium 사전 테스트 #44324278001 PASS, 직후 기능 코드 변경 없이 문서만 추가. 통합명단 전용 **실제 운영 HTTPS Chromium** QA #44325602067도 **SUCCESS**(동일 기능 SHA); artifact #14436403456의 운영 화면 PC1440/모바일390·360 및 JSON report.status=PASS, 모든 화면 overflow=0px, 일본 남자 26명, 일본 여자 누락 DOB 불추정, 기존 프로팀 KOVO 현재 명단 연결 확인. 실제 사용자 계정 로그인은 테스트하지 않았으며 테스트 브라우저 내에서만 기존 인증 오버레이를 격리했다. 기존 국가/선수 MASTER·국제대회 원본·KOVO 자동수집기·개인 메모·회원 인증코드 불변. Google Drive 공식 자료의 독립 재대조는 아직 NOT VERIFIED.


## 2026-11-18 · 선수·팀 국제 국가별 역사형 대표팀 명단 및 공식 후보 원장

Status: USER APPROVED / VERIFIED / DEPLOYED ON MAIN / LIVE HTTPS QA PASS (2026-11-18 KST).
사용자가 40개 국제 국가·지역을 나라별로 표시하고 각 국가 페이지에 연도별·대회별 대표팀 선수명단을 누적하며 공식 초반 후보 엔트리도 출처 확인 시 별도 보존하는 3단계 개발을 지시했다. 기존 4개 country_master 영구 ID를 변경하거나 나머지 36개 신규 영구 ID를 추정하지 않는다. 2026 VNL 남녀, 아시안게임 남녀, AVC 남자 대륙선수권과 AVC 남자컵의 원본 명단 89개 포인터를 유지한다. 원본 FINAL, 출국명단, 공개 등록/Active/Reserve를 절대 동일한 상태로 취급하지 않으며 없는 후보 엔트리/미출전/선수 탈락을 생성하지 않는다. 공식 후보 원장은 0개로 시작하여 검증된 원문이 있는 후보·롱리스트·주차·최종·경기 명단만 등록하게 한다. 선수 이름이 같다는 이유로 ID 링크를 만들지 않으며 원본/회원 권한/경기/기존 KOVO 자동화를 보호한다.

Release: PR #361 squash merge `8d1fbae5fb237b2be43b02a4c6fec242c8ead919` (사용자 운영 반영 승인). GitHub Pages build/deploy #44296156330 SUCCESS; 실제 `kvolleylab.com` 국제 국가별 PC/모바일 Chromium QA #44296161095 SUCCESS (40개국·지역, 89 원본 명단 참조, 일본 남자 VNL16·여자 VNL14·대륙선수권 최종14, 바레인 출국13, 기존 V-리그7팀, 1440/390/360px overflow0), 기존 팀 페이지 운영 회귀 #44296161098 SUCCESS. 출처 재생성 workflow #44296161131 SUCCESS (기존 승인 소스만, 신규 공식 후보 수집 아님). `teams.html` 회원 로그인 보호는 유지하고 실제 관리자 로그인 검증은 실시하지 않았다. 2026 공식 후보 독립 검증 0건, 원본 Google Drive는 별도 계정 접근 불가로 NOT VERIFIED. 상세 검증·복구: `docs/validation/international-country-history-v1-20261118.md`.


## 2026-11-18 · 선수·팀 → 팀 통합 디렉터리 v1 / V-리그 최신 자동 명단 연결

Status: USER APPROVED / VERIFIED / DEPLOYED ON MAIN · LIVE HTTPS QA PASS (2026-11-18 KST).
사용자 승인에 따라 기존 '팀' 임시 안내 페이지를 PC/모바일 통합 팀 찾기 화면으로 교체한다. 프로를 기본으로 6개 분류(프로·대학·고교·중학·대표팀·국제), 남녀부 필터, 로고 폭 약 1/3, 팀명·감독·현행 선수 수, 카드 하단 선수명단 보기를 사용한다. 프로 명단은 별도 복사하지 않고 기존 GitHub KOVO 공시 수집기의 시즌별 rosters.json 및 기존 선수명단 v2·신인 검증 브리지와 직접 연결한다. 단순 카드 인원 수는 원본 명단 배열 길이로 매번 계산하고 오래된 competition.data 참여팀 수치를 사용하지 않는다. 미검증 선수 ID 연결/고교·대학교 임의 보완은 금지, 26개 역사 충돌 보호 유지.

대학은 2026 대학 U-리그 검수된 참가·선수명단, 고교/중학은 구축된 2026 학교 대회 참가 목록을 통해 링크한다. 대표팀·국제는 실제 구축된 관련 페이지로 연결한다. 2026-27 감독 정보는 10월 미디어데이와 한국도로공사 정식 선임 출처를 저장한 확인일 기준 스냅샷으로 사용하며 명단 자동 갱신과 별도다. 기존 teams.html 회원 로그인 보호는 제거하지 않는다.

Branch feature/teams-directory-v1-20261118; 기준 main 46d856c4911830fcfb5eaef534c9cf377885cebf; PR #359. 신규 team directory 파일/QA와 teams.html만 교체하고 V-리그 대회 원본·KOVO 자동화·경기 DB·선수 MASTER·Supabase 메모·공통 사이드바는 그대로 유지. 검증·운영 반영·복구 세부: [docs/validation/teams-directory-v1-20261118.md](validation/teams-directory-v1-20261118.md). 운영 배포: PR #359 squash merge a73224d3aa45ab39a28904249da34b4c01784c8b, GitHub Pages run #44228768536 SUCCESS, kvolleylab.com 실제 페이지 Chromium 남녀 PC1440·모바일390 QA run #44228772412 SUCCESS (공식 남149·여138명, OK 21·정관장18 상세, 프로필 및 학교 증거, 가로 넘침 0). 전체 14팀은 별도 PR 검수로 확인하고 운영 실제 브라우저는 남녀 대표 2팀 샘플로 구분한다. 기존 멤버 로그인 보호는 유지하며 테스트만 QA 전용 스텁으로 UI 동작을 측정. 감독은 수동 검증 스냅샷이다. 기존 KOVO 수집기·데이터·회원 기능 불변.


## 2026-11-18 · V-리그 최신 참가팀 명단 v2 + 안전한 선수 프로필·고교/대학 연결

Status: USER APPROVED / VERIFIED / DEPLOYED ON MAIN AND LIVE QA PASS (2026-11-18 KST).
사용자가 검수한 v2 선수명단 디자인을 2026-27 V-리그 남녀 14개 구단의 실제 `참가팀 → 선수명단`에 적용하도록 요청했다. 검증된 신인 등록 32명과 프로필 연결 28명은 기존 KOVO 등록 공시 원장·현재 구단·등번호·원문 URL이 정확히 일치할 때만 인메모리로 연결한다. 남자149·여자138 선수의 기존 명단을 임의 변경하지 않고, 기존 GitHub KOVO 자동 게시기를 유지한다. 공식 KOVO 신청서에 확인된 선수의 출신 고교·대학을 개별 표시하고 미확인 사항은 감춘다. 과거 학교·대표팀·드래프트 이력 및 회원 개인 메모 원본은 삭제/재발급하지 않는다. 과거 동일 Player_ID가 서로 다른 사람에게 중복된 26건은 프로·국가대표 문맥을 분리하며, 충돌 번호의 메모/비교/즐겨찾기 연결을 보류한다. 장기 ID 이관은 Issue #334 별도 단계. **선수명 직접 클릭 → 검증된 기존 프로필 이동**도 승인 범위로 포함한다. 선수 행 자체를 누르면 v2 상세 패널을 선택하며, Player_ID 미검증 선수 이름에는 잘못된 링크를 만들지 않는다. 영구 ID 이관 없이 이 표시·연결 정책을 유지한다.

최신 운영 코드 기준 main `69d4651a7331ac4d5f10e5034b1118e4da05799a`에서 새 브랜치 `feature/vleague-roster-profile-integration-20261118` 생성, 기존 충돌 PR #332를 병합하지 않고 소스 검증 자료만 재사용. [검수 PR #355](https://github.com/kvolleylab/kvolleylab/pull/355), [상세 검증](validation/vleague-roster-profile-v2-20261118.md). 독립 데이터·UI 검사 및 모든 기존 Player·Draft·VLeague 회귀, 실 Chromium PC/모바일 검증과 실제 Pages 배포는 각기 독립 증거로 판정. 운영 증거: PR #355 squash merge be7d39dee62abb8b02cb510930757a7e0a0bfb64, GitHub Pages 성공 run #44149858672, 실제 kvolleylab.com Chromium 남녀 PC·모바일/프로필 연결/ID 충돌 검증 성공 run #44149862456. 전체 14구단은 PR 단위 테스트, 공개 웹 자동 검증은 대표 남녀 각 1구단으로 범위를 구분한다. Google Drive 원본은 이번 세션에서 연결 오류로 NOT VERIFIED. 기존 불합격 대학 등록 및 KOVO Cup focused 회귀는 별도 정비 과제로 유지한다.

## 2026-11-15 · 승패 조견표의 상대팀 칸을 승점으로 정정

Status: USER CLARIFIED / IMPLEMENTED / LOCAL QA VERIFIED / RELEASE AUTHORIZED.
사용자가 상대팀 칸은 해당 경기 획득 승점, R승점은 해당 라운드 합계, 총점은 모든 라운드 합계라고 명확히 정정했다. 11월 14일 v4의 세트 승수 표시와 라운드 시점 총승점 정의를 대체한다. 3–0·3–1은 3:0점, 3–2는 2:1점이며 0점과 미진행 공란을 구분한다. 모든 표의 `총점`에는 현재까지 종료된 정규리그 전체 승점을 동일하게 표시한다. 순위는 해당 라운드까지 누적 기준을 유지하고 설명에 명시한다. 기존 자동화·경기/선수 JSON·팀 순서·디자인·다른 대회를 변경하지 않는다. 기준 main `b775ee2f`. 25개 계산·연결 검사와 남녀 4개 폭 브라우저 검수를 완료했다. 병합·Pages·운영 증거는 release PR에 기록한다. [정의·검수·변경·복구](validation/vleague-matrix-points-v5.md).

## 2026-11-14 · V-리그 승패 조견표 v4 정규리그 순위 아래 연결

Status: USER APPROVED / IMPLEMENTED / LOCAL QA VERIFIED / RELEASE AUTHORIZED.
사용자가 조견표를 기존 '정규리그 순위' 페이지의 순위표 아래에 배치하도록 승인했다. PR #328의 v4 디자인·계산을 최신 main `d75279c88a0b9ab8d7f304ae16b058ca8523b0a4`에 연결한다. 기존 프로토타입 배포 보류를 이번 남녀 2026–27 V-리그 연결 범위에서 대체한다.

두 대회만 고정 6라운드 표를 표시하며 PC 2×3 / 모바일 1열이다. 전년도 순서·공식 약칭·종료 경기 누적 계산을 유지한다. 기존 페이지의 데이터 갱신에 함께 재계산하며 MASTER·JSON·수집/발행 주기·명단·공통 메뉴와 다른 대회는 변경하지 않는다. 계산/연결 및 기존 회귀 89개, 공개 데이터 연동 6개 통과. 남녀 360·390·768·1180px에서 넘침/잘린 셀 0. 실제 경기 중 새 수집 주기 검증과 UI 검증을 구분한다. [출처·계산·검수·수정 파일·복구](validation/vleague-matrix-production-v4.md). 병합·Pages·공개 화면 증거는 릴리스 PR에서 추적한다.

## 2026-11-10 · 종합대회 배구 완성형 HERO v04

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 사용자가 선택 원본을 기준으로 PC·모바일 WebP 제작, PR 제출, 검증 후 main 병합과 실제 Pages 배포 확인까지 명시적으로 승인했다. 기존 v03 및 경기·순위·선수·MASTER는 보존한다. 별도 브랜치의 미병합 PR #281 확대/사진분리 방식 대신 완성형 v04 파노라마를 사용한다.

공통 외형 1180px·PC225px·모바일215px과 기존 HTML 텍스트/링크를 유지한다. 독립 PC2108×406/mobile1258×406, 단일 배경·비율 보존 cover/right center, 중복 오버레이 제거. 모바일의 왼쪽62% 설명문과 주요 피사체 안전영역을 확보한다. 이번 결정은 해당 허브의 이전 v03 이미지 및 중복 그라데이션 표시만 대체하며 다른 허브·상세화면으로 확장하지 않는다. 5개 폭 브라우저 검수 및 관련14개 검사 통과. 기준main `54bb76ca43be9d0bca6c53ce86b699a374f26948`. [제작·측정·기존 검사 실패·복구](validation/comprehensive-hero-v04-20261110.md). 병합·Pages·HTTPS 증거는 릴리스 PR에 기록한다.

## 2026-11-10(KST) · 모델·요금제 독립 운영 및 이번 시즌 인증 유지

Status: USER APPROVED POLICY / DOCUMENTATION UPDATE; 신규 기능 배포·다음 시즌 개통 완료를 뜻하지 않는다.
사용자는 이번 시즌에는 180일 GitHub 토큰을 유지하고, 다음 시즌과 모든 홈페이지 양식을
기본 요금제·다른 모델에서도 재사용할 수 있도록 운영기준에 남기도록 요청했다.
GitHub App 인증 전환은 보류한다. 기존 토큰·Worker·승인 gate·운영 데이터는 변경하지 않는다.
토큰의 실제 만료일은 GitHub 설정에서 별도로 확인해야 하며 이 기록에서 특정 날짜로 확정하지 않는다.

Google Drive의 같은 문서 ID를 유지한 운영원칙 MASTER v19에 11-7~11-9를 추가했다.
확정 양식의 코드·설정·명세·검수 재사용, 모델 밖의 정기 실행, 실행 가능한 인수인계,
다음 시즌 입력·인증·기간·전체 경로 재검증이 원칙이다.
파일 위치·요청 양식·기존 명령·남은 확장은 [운영 안내](KVL_MODEL_INDEPENDENT_OPERATIONS_v1.md)에 둔다.
모든 허브/선수 양식의 자동 생성기나 다음 시즌 원클릭 개통이 완성됐다고 표현하지 않는다.

확인한 main은 `713617e8e043bdf7f7ee61c21b12b0138dc38981`이다.
현재 runtime의 종료 경계는 `2027-04-30T00:00:00+09:00`이며 종료 미포함이다.
사용자의 2027년 5월 이후 중지 허용을 종료 경계 자동 연장 승인으로 해석하지 않는다.
공식 일정이 범위를 벗어나면 근거와 어댑터 지원을 확인한 별도 변경이 필요하다.

이전 11월 7일 기록의 NOT DEPLOYED는 당시 상태다. 후속 배포와 사용자 PC의 Worker 활성화
증거는 [PR #262 최신 운영 기록](https://github.com/kvolleylab/kvolleylab/pull/262#issuecomment-6744152447)과
[PR #270](https://github.com/kvolleylab/kvolleylab/pull/270)을 확인한다.
활성 설정 배포와 경기 중 2회 연속 전체 경로 검증은 구분한다. 이번 문서 작업은 새 라이브 성공 증거가 아니다.
검증 범위는 문서 재조회·참조 파일 존재·문서 diff이며 실제 선수/경기 MASTER나 화면은 수정하지 않는다.

## 2026-11-07 · V-리그 최초 관측 누락·스케줄러 보완 v2

Status: IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED / LIVE RECOVERY NOT VERIFIED. 사용자 추가 수정 요청에 따라 `fix/vleague-missing-observation-v2`에서 작업했다. Base main `208b7babc27d15697e5b55cca934ab1e6a1bf0a1`. 최초 관측이 없는 공식 V-리그 경기는 KST 시작 30분 후 ‘갱신 지연 / 최종 관측 없음 / —’으로 표시하고, watchdog은 `updatedAt`을 라이브 관측으로 인정하지 않는다. Cloudflare 명시적 활성화 설정을 준비하되 기본 설정은 비활성을 유지한다. 18:53 기존 publisher가 남녀 최종 결과를 반영했지만 이전 실행과 4시간 간격이므로 라이브 복구 성공이 아니다. 새 운영 배포 승인·Cloudflare 인증/활성화·실경기 2회 연속 전체 경로 검증은 별도 미완료 단계다. [원인·테스트·화면·배포 및 복구 절차](validation/vleague-missing-observation-v2.md). 선수 MASTER/명단/ID/국제대회/Cup 데이터 불변.

## 2026-11-07 · 대학 허브 기본 템플릿 복원·과거 결과 카드

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 실제 홈페이지 반영 승인 후 이어진 사용자 수정 요청: 공통 글꼴·원래 메인 HERO 여백·국내 템플릿 카드/트로피를 복원하고, 2026 대회 전체 카드의 금색 hover/클릭 및 남녀부 바로가기를 제공한다. PC 왼쪽 HERO·오른쪽 네이비 순위 배치는 유지한다. 2025·2024는 공식 기록을 확인한 U-리그·연맹1·2차전 각3개를 이미지 없는 흰색 결과 카드와 금색 hover로 연결한다. 별도 대회 페이지 없는 과거 기록에는 페이지를 임의 생성하지 않는다. 기존 대회 데이터/Engine V2 불변. 실제 공통 Pretendard 상속은 오래된 일반 Arial 문서보다 이번 기본 템플릿 일치 요청을 우선한 범위 한정 보정이다. Base main `ef239869b3bc303f711228f146011b367668f0d3`. [출처·검수·복구](validation/university-hub-parity-archive-v1.md). 배포 확인은 release PR에 별도 기록한다.

## 2026-11-06 · 대학배구 대회 허브 개편 운영 적용

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 사용자가 승인한 대학대회 프로토타입을 기존 `university-competitions.html` 주소에 적용한다. PC 대회 카드는 왼쪽에 모바일 구도의 축소 HERO, 오른쪽에 남녀 최종순위 카드, 순위 바탕은 네이비 `#1B223A`로 확정했다. 고성·단양 제목은 `2026 대한항공배`와 `전국대학배구 고성대회/단양대회` 두 줄로 표시한다. U-리그 남자 순위 제목의 `6강`과 준결승·결승 안내 문구를 화면에서 제거한다. 2026-10-26의 기존 대학 허브 배치 유지 결정은 이 범위에서 대체한다. 최초 프로토타입 한정 지시 이후 사용자가 명시적으로 실제 홈페이지 반영을 승인했다. 기존 JSON 순위 24건·상태·일정·대회 경로·공식 HERO 자산·공통 메뉴·Competition Engine V2는 보존한다. Base main `cbedc3ea03864e9ca264fdcba9cd3ab614f8c777`. [검수·적용 범위·복구](validation/university-hub-years-v1.md). 병합/Pages 완료 및 운영 화면 확인은 release PR 및 배포 실행 기록으로 구분한다.

## 2026-11-05 · 국제대회 허브 메인 HERO 이미지 적용

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 사용자가 첨부한 붉은 경기장 이미지를 운영 국제대회 페이지 메인 HERO에 반영하도록 요청했다. 기존 `international-competition-senior-national-team.html` 경로와 HERO 크기·문구·골드 글자·6개 카테고리·연도 탐색을 유지하고, 전용 허브 CSS 변수와 PC/모바일 WebP만 연결한다. 업로드한 2048×682 이미지의 구도와 비율을 보존한 웹용 자산을 사용하며 2026-11-02의 영역 채움 결정을 따라 표시 영역에서 `cover`를 적용한다. 이 허브에서는 기존 청색 SVG를 사용자 지정 붉은 이미지로 대체하며 다른 대회 테마에는 적용하지 않는다. Base main `ba981d65e56055fa185304794773ae5e40b14778`. PC1180·모바일390/360에서 경기장과 제목·가로 넘침0·정상 이미지, VNL 선택 후 전체보기의 필터 유지 확인. [변경·검수·복구](validation/international-hub-hero-v1.md). 병합·Pages·운영 확인은 해당 release PR과 구분해 기록한다.

## 2026-10-26 — Draft Hub 팀별 추첨 확률 카드

Status: APPROVED / IMPLEMENTED / VERIFIED. 2026-10-26 사용자가 “반영해”로 운영 적용을 승인했다. 실제 배포 확인은 PR #166에 기록한다. 사용자 요청 URL의 2026-27 남자부에 드래프트 연도와 공식 참가 신청자 사이 로고·팀명·구슬 수(확률)를 표시한다. KOVO 공식 확률 및 총 100개 구슬을 대조하고 기존 V-리그 로고를 재사용한다. 신청자·선수 ID·프로필·지명 결과는 변경하지 않는다. 여자부/미등록 시즌에는 남자부 배분을 노출하지 않으며 로딩 실패는 신청자 기능에 전파하지 않는다. PC/390px/360px, 자동 검사 12개 통과. [검수·출처·적용 파일·복구](validation/draft-lottery-20261026.md). 승인된 운영 적용 범위는 이 추첨 카드이며 다른 기능과 데이터 변경은 포함하지 않는다.

## 2026-10-24 — Six reviewed player names

Status: APPROVED / IMPLEMENTED; final CI and deployment evidence belong to the release PR.

The project owner explicitly confirmed 옹민혁(경일대), 염시원(경희대), 전유석(중부대), 장승호(충남대), 송건환(홍익대), 이소민(광주여대). Apply only these name corrections to the already verified existing IDs and add their official applicant links. Preserve prior names in the correction log, source snapshots, DOB, position and school history. No new ID or name-only automatic merge is authorized. The remaining 12 applicants stay unresolved. The member-service release gate in PR #155 is unchanged.

Implementation: `fix/player-reviewed-identities-20261024`, based on `8c4327c` (PR #156 preserved); [detailed scope, Drive backup, validation and recovery](PLAYER_NAME_REVIEW_20261024.md).

**Purpose:** Durable record of approved decisions so a new ChatGPT Work / Codex / GitHub session can resume without relying on conversation history. This log records **intent and acceptance**, not an assertion that all changes are deployed.

**Last edited:** 2026-10-23. Latest task source verification is recorded below. Historical 2026-10-21 evidence follows. **Session evidence:** GitHub `main` inspected for `index.html`, `players.html`, and `player.html` on 2026-10-21. Relevant Google Drive MASTER was **not re-verified** as part of creating this log.

## Decision status definitions

- `PROPOSED`: idea not approved.
- `APPROVED`: user has chosen the behavior/design, but implementation not implied.
- `PROTOTYPE`: work being tried outside production; preview status must be checked.
- `IMPLEMENTED`: committed in a specified branch, not necessarily deployed.
- `VERIFIED`: functional acceptance checks passed with evidence.
- `DEPLOYED`: verified on operating site after an approved release.

Never turn `APPROVED` into `DEPLOYED` without evidence.

## 2026-10-23 — KVL-PLAYER-002 / KVL-DRAFT-001: Production integration

**Status:** APPROVED by the current user request; IMPLEMENTED and locally VERIFIED in `feature/player-draft-integration-20261023`. This is a pre-merge snapshot; use the PR release verification for DEPLOYED status.

- Integrate the approved B search/grid into existing `players.html`; reuse the old catalog pipeline and profile renderer. Do not publish a replacement player database.
- Maintain existing Player IDs, links, shared navigation, comparisons and the original eligibility board inside one annual `draft-hub.html`.
- Official KOVO applications are independent from eligibility and selection results. Verified links 99; 18 pending remain unlinked. Unknown DOB or known affiliation/grade conflicts require review.
- Real member authentication and per-user data ownership are not implemented. Production private reads/writes stay disabled; prototype A/B notes are not production authentication.
- Current task explicitly authorizes production after PR/QA verification, superseding the old prototype-only release restriction for this scoped integration. It does not authorize identity correction or automatic MASTER merges.
- Main/rollback SHA `7f5b90109c912ee1cdaa93c463a5d667a1a95bdb`, backed up as `backup/player-integration-before-20261023`.
- Full findings, original raw ID overlap caveat, evidence, remaining work and recovery: [integration handoff](PLAYER_DRAFT_INTEGRATION_v1.md).

## Standing decisions

### KVL-OPS-001 — Persistent developer operating rules (2026-10-21)

**Status:** APPROVED. **Source:** user approval on 2026-10-21.
The seven mandatory rules are codified in root `AGENTS.md`: inspect GitHub/Drive; impact analysis; reuse past successful code; isolate edits in branch/prototype; verify PC/mobile and regressions; report changes/tests/unresolved issues; do not change production before user approval. Use the start-up and handoff checklists from `AGENTS.md` for every new environment.

### KVL-UX-001 — Shared homepage experience and navigation

**Status:** APPROVED; homepage `index.html` currently uses `max-width:1180px` on `main` (verified 2026-10-21).
Maintain one recognizable KVL design family across pages. Preserve shared left navigation and menus; change page content without replacing shared navigation. Calendar width was approved to match the 1180px homepage; **calendar deployment was not verified in this log**. Older general documents permitting larger widths should not be treated as overriding the newer page-specific decision.

### KVL-HERO-001 — Hero production assets

**Status:** APPROVED; deployment status varies by page.
Hero image targets: PC **2108 × 406**, mobile **1258 × 406**. Prepare completed images at actual target dimensions rather than using ad hoc CSS stretching/cropping as a substitute. Before connecting a Hero, inspect previously successful commits, storage paths, config wiring, and cache versioning. Preserve aspect and text-safe regions.

### KVL-PLAYER-001 — Player workspace B prototype

**Status:** APPROVED DESIGN / PROTOTYPE. **Not confirmed deployed.**
Preview reference (may expire): `https://kvl-player-workspace-prototype-v1.blackisle17.chatgpt.site/players.html`

Approved behavior and design:
- Male bookmarked player: **dark blue** icon; female: **dark rose-pink** icon.
- Male player card hover: blue outline; female hover: rose-pink outline; remove female-only left-side colored shadow for consistency.
- Bottom action area ("관심선수" and "프로필보기"): both genders get a subtle gender-matched tinted background.
- Filter by high-school/university category with relevant school choices; allow **multi-select grades**.
- Hide internal KVL player IDs on search-result cards.
- Keep gender-sensitive colors, stronger school label, national-team/awards info if supported by data, larger position/height/birth-year text.
- Add grid/compact mode for more cards per screen. Compact card must show **name, school, position, height**.
- Player profile overlay must close via both **X** and clicking the dimmed backdrop.
- Logged-in users may bookmark players and create/edit/delete multiple personal notes; those notes must be private to that user via actual authentication/access control, not published GitHub JSON.

**Protection:** Production `players.html` and `player.html` remain separately wired to legacy player search/details scripts on GitHub `main` in the 2026-10-21 inspection. Do not overwrite their search, comparisons, links, and filters when integrating the B prototype. Test in isolation before production approval.

### KVL-COMP-001 — Competition and schedule structure

**Status:** APPROVED; specific implementation/version must be re-verified for each competition.
Reuse existing common competition engine/template when feasible. Respect distinct tournament formats (group stage / bracket / classifications), gender filters, alphabetic sorting when grouping does not exist, set/point ratio ordering, and existing data IDs/routes. Avoid duplicating a new engine merely to handle one competition unless justified.

### KVL-DATA-001 — Official source and site data separation

**Status:** APPROVED / documented in existing `PROJECT_RULES.md`.
Existing Google Drive competition folders retain originals as the source archive. Confirmed structured data passes validation before JSON/site use. Preserve stable Master IDs and `source_id`. KOVO official-notice collection, match-score collection, and individual player-stat collection are separate scopes; do not imply live updates are functioning without end-to-end test.

## Restart checklist / next-session handoff

1. Identify the requested page/feature and user-approved requirements.
2. Read `AGENTS.md`, this log, existing standards, current `main` files, relevant historical commits, and Drive MASTER when applicable.
3. Capture current SHA and list differences between approved design, prototype, and production.
4. Resume from the existing branch/prototype, not a new duplicate approach, unless the old artifact is demonstrably unavailable.
5. Execute tests and produce a compact status report: `APPROVED | PROTOTYPE | IMPLEMENTED | VERIFIED | DEPLOYED`, changed files, test results, blockers, next action.
6. Log every newly confirmed decision here, keeping obsolete decisions marked `SUPERSEDED` rather than erasing history.

## Open verification items as of 2026-10-21

- B prototype: approved modifications and behavior need a verified implementation and PC/mobile regression test.
- Homepage/calendar 1180px parity: homepage value verified in code; calendar production status still requires verification.
- KOVO live-match collector: do not mark working without a real-match ingestion/update report.
- Older `DESIGN_SYSTEM.md` contains generic size/menu conventions that may predate newer approved screen designs; reconcile per task rather than blanket rewriting it.

## New decision template

```md
### KVL-AREA-NNN — Decision title (YYYY-MM-DD)
Status: PROPOSED | APPROVED | PROTOTYPE | IMPLEMENTED | VERIFIED | DEPLOYED | SUPERSEDED
Applies to: files/pages/competition
Decision: exact approved behavior
Rationale / constraints:
Implementation: branch, PR, commit, deployed URL (only if verified)
QA: PC/mobile, data/logic and regression evidence
Supersedes:
Next action:
```


## 2026-10-24 — Domestic Template v2 운영 반영

사용자가 승인한 국내대회 시안을 실제 홈페이지에 반영하도록 요청했다. 고성·단양 남녀 4개 페이지에 홈형 디자인을 선택 적용하며, 경기 데이터·예선 종합순위·사다리/부전승·대학 상세/선수명단 경로는 기존 공통 엔진을 유지한다. 조편성이 있으면 조별/조 내 가나다순, 없으면 전체 가나다순. 모바일도 실제 사다리를 유지한다. v1의 화면 동결 규칙에 대해 이 범위는 v2로 확장한다. CBS 및 중·고 허브는 별도 시안이며 이번 운영 적용 대상은 아니다. 상세: domestic-template-v2.md, validation/domestic-home-v2-20261024.md.


## 2026-10-24 — 중·고 허브 승인 시안 운영 통합

Status: APPROVED / IMPLEMENTED / VERIFIED (배포와 live 확인은 해당 release PR에 기록). 사용자가 수정된 중·고 시안을 실제 홈페이지에 반영하도록 명시적으로 승인했다. 기존 `domestic-competitions.html?division=school` 주소와 공통 좌측 메뉴를 유지하며, 홈형 Hero·최근 대회·남녀 색상 패널·금색 상호작용·트로피·연도별 펼침을 적용한다. 부문 필터는 `category` 파라미터를 사용해 기존 `division=school` 라우팅을 보존한다. 기존 school-years/catalog 및 domestic 경기 JSON에서 읽고 데이터/선수 ID는 변경하지 않는다. 개별 Hero 미등록 대회는 승인된 공통 자산을 사용한다. 앞선 국내대회 v2 기록의 “중·고 허브는 운영 대상 아님” 제한을 이 허브에 한해 대체한다. 개별 중·고 대회 엔진은 이번 대상이 아니다. QA/복구: [검수 보고서](validation/school-hub-v2-20261024.md).


## 2026-10-25 — 국내대회 기본 템플릿 가독성·달력·트로피 통일

Status: APPROVED / IMPLEMENTED / VERIFIED (배포 결과는 release PR에 기록). 사용자가 기존 운영 고성·단양의 공통 템플릿 수정을 요청했다. 연도는 날짜 열에 맞추고 월은 가운데 정렬, 메뉴/남녀 전환 글씨 확대, overview 참가대학 로고·이름을 참가대학 페이지와 같은 크기로 통일, 경기일 테두리를 내부 표시로 변경한다. Overview 순위와 최종 1~4위는 기존 허브의 SVG 트로피(금/은/동)를 사용하며 PC CSS 메달 장식을 제거한다. 공동 3위/사다리/데이터/링크 의미는 유지한다. PC 및 모바일을 함께 제시한다. 상세와 복구: [검수 보고서](validation/domestic-template-readability-20261025.md).


## 2026-10-25 — 달력 단위·조별순위 글씨 크기 추가 조정

Status: APPROVED / IMPLEMENTED / VERIFIED (배포 결과는 release PR). 기존 운영 기본 템플릿의 추가 수정 요청에 따라 연도 숫자와 년, 월 숫자와 월의 크기를 각각 같게 한다. 조별순위 머리글은 해당 화면의 대학명과 같은 크기로 키우며, 긴 득실비 머리글은 두 줄을 유지한다. 검토 Site의 전체 조 선택창에도 같은 기준을 적용한다. 운영의 공통 CSS/캐시 버전과 검토 Site CSS만 수정한다. 순위 데이터·계산·팀 연결·필터 동작은 변경하지 않는다. 검수: [보고서](validation/domestic-calendar-standings-type-20261025.md).

## 2026-10-25 · 국내대회 조별순위 본문 수치 및 조 요약 크기

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 확인은 release PR에 기록). 사용자의 후속 요청에 따라 순위표 안의 숫자와 진출 표시는 각 표의 대학명 크기를 사용하고, ‘5팀 · 10경기’는 ‘A조’ 크기를 사용한다. 고성·단양 남녀 공통 domestic-home-v2 CSS와 기존 기본 템플릿 Site에 적용한다. 운영 조별/PC 종합 수치는 17px, 모바일 종합 수치는 해당 대학명과 같은 15px, 조 요약은 18px이다. 긴 소수점 수치를 위해 PC 득실비 열을 60px로 조정했다. 데이터·순위 계산·필터·팀 링크는 변경하지 않는다. 검수: [보고서](validation/domestic-standings-values-20261025.md).

## 2026-10-26 · 대학 U-리그에 승인된 국내대회 기본 템플릿 적용

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 결과는 release PR 기록). 사용자가 “이 시안으로 대학 U리그의 페이지도 변경”을 요청했다. 남녀 정식 config에 `domestic-home-v2`를 선택 적용하며 기존 Hero·85경기·순위·학교/선수 경로를 유지한다. 여자부는 단일리그의 `리그순위` 탭·카드와 전체 가나다순 참가대학을 유지한다. 남자부 A/B조 및 6강리그 경기 필터를 유지한다. 모바일에서도 기존 모바일 Hero와 4강 사다리/내부 스크롤을 사용한다. 이전 v2 문서의 U-리그 제외 및 v1의 U-리그 글씨 크기 고정 규칙을 이 범위에서 대체한다. 긴 순위 상태 문구는 줄바꿈한다. 공통 기능 회귀 8/8 및 PC/390px/360px 검수 완료. [보고서](validation/uleague-home-v2-20261026.md).

## 2026-10-26 · 달력 기본 월 및 U-리그 예선 집계 범위 수정

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 완료는 release PR 기록). 기존 운영 페이지에 대한 사용자의 수정 요청. 달력은 진행 중 한국시간의 현재 월, 종료 후 마지막 경기 월, 시작 전 첫 월을 연다. 공통 템플릿 검토 Site에도 적용한다. 남대부 예선 종합순위는 pool 값이 있는 모든 경기를 합산하던 버그로 6강리그 15경기가 섞여 있었다. 예선 standings의 조 및 양 팀 소속이 일치하는 경기만 허용하고 결선 라운드는 제외하여 A/B조 49경기만 집계한다. 기존 승률·득실비 산식, 원본 경기 데이터·최종순위·경기일정 필터는 유지한다. 자동 검증 16/16, 타 대회 순위 DOM 비교 7/7, PC/모바일 검수 완료. [보고서](validation/uleague-preliminary-calendar-20261026.md).

## 2026-10-26 · U-리그 6강리그 최종순위와 4강 연결

Status: APPROVED / IMPLEMENTED / VERIFIED (배포 증거는 release PR 기록). 사용자가 4강 대진표 위에 6강리그 최종순위를 추가하도록 요청했다. 남자 U-리그에만 공통 엔진의 선택형 leagueStage 표시를 적용한다. 기존 15경기를 KUSF 공식 요강의 승점·승수·점수 득실비·세트 득실비·동률 팀 간 성적으로 계산한다. 예선 집계와 분리하고 실제 준결승 참가 4팀을 강조하며, 1위–4위/2위–3위 연결을 사다리 앞에서 설명한다. PC 표/모바일 학교별 카드, 기존 팀 경기기록 경로와 사다리를 유지한다. 원본 경기/선수 데이터 변경 없음. Drive 요강 대조, 자동 검증 19/19, 9개 대회 기존 5개 영역 DOM 동일 및 PC/모바일 확인 완료. [보고서](validation/uleague-six-league-20261026.md).

## 2026-10-26 · 국내대회 기본 템플릿을 중·고 6개 대회에 운영 적용

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 증거는 release PR 기록). 사용자가 중·고 목록의 대회들을 국내대회 기본 템플릿으로 실제 홈페이지에 반영하도록 요청했다. CBS·IBK·대통령배·익산·삼척·춘계 24개 부문을 공통 엔진에 연결한다. 네 부문 선택/남녀 색상/달력/조별 참가학교/트로피/사다리를 공유하고 기존 주소를 유지한다. 모바일 조별순위는 숨겨지던 수치를 학교 아래 나누어 표시한다. 기존 경기·학교명 alias·입상팀·실제 부전승을 유지하며, 4건 원문 세트 불일치와 CBS 미검수 영역은 명시한다. 허브 요약도 상세 기록으로 연결한다. 이전 중·고 개별 상세 및 CBS 적용 제외 결정을 이 범위에서 대체한다. [검수 보고서](validation/school-domestic-home-v2-20261026.md).


## 2026-10-26 · 중·고 예선 종합순위 누락 복구

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 결과는 release PR 기록). 사용자가 중·고 조별순위 안의 예선 순위 누락을 지적했다. 이전 템플릿 이식에서 `overall:false`와 `combined:false`로 숨긴 예선 종합순위를 춘계·삼척·익산·대통령배·IBK의 20개 부문에 복구한다. 공통 엔진의 기존 승률 → 세트 득실비 → 점수 득실비 산식을 그대로 사용하며, 조별 진출 순위와 별개인 KVL 산출 순위임을 유지한다. 예선·사전경기만 집계하며 결선·최종순위는 섞지 않는다. CBS는 조 편성/학교명/전체 기록 미검수 상태이므로 확정 순위를 만들지 않는다. 경기 데이터·공통 렌더러·대학대회는 변경하지 않는다. [검수 보고서](validation/school-preliminary-overall-20261026.md).


## 2026-10-26 · PC 조별순위 카드 반폭 고정·열 간격 통일

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 증거는 release PR 기록). 사용자가 국내대회 기본 템플릿의 PC 조 카드를 한 행 두 개, 각각 동일한 반폭으로 고정하도록 요청했다. `domestic-home-v2`에 한정해 901px 이상에서 2열/16px 간격을 사용하고, 순위·팀·승·패·승점·세트득실비·점수득실비 헤더와 값에 같은 grid를 적용한다. 팀 열은 가변 폭과 추가 오른쪽 여백을 갖고 긴 이름은 말줄임 없이 줄바꿈한다. 승/패/승점은 각각 36px, 득실비 두 열은 각각 88px이며 제목은 한 줄이다. 좁은 PC 창에서도 두 칸을 유지하되 카드 내부만 가로 스크롤한다. 기존 모바일·인쇄·순위 계산·경기/선수 데이터는 유지한다. [검수 보고서](validation/domestic-pool-layout-20261026.md).


## 2026-10-26 · 고성대회 조별순위 점수득실률 누락 복구

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 결과는 release PR 기록). 사용자가 고성대회 순위 규정에 필요한 점수득실률 누락을 지적했다. 남녀 예선 39경기의 기존 세트별 점수와 Drive MASTER/요강·KUVF 공식 결과를 대조해 22팀 pointRatio를 복구한다. 기존 공통 계산기에 승수 → 점수비율 → 세트비율 → 승자승을 명시한 재생성기를 두며 본선 8경기를 제외한다. 현재 순위·진출팀·경기 데이터·선수 ID는 변하지 않는다. 종합순위도 성균관대 291/240을 1.213으로 반올림해 조별 값과 일치시킨다. 기존 KVL 예선 종합순위의 별도 정렬 정책은 유지한다. [검수·출처·복구](validation/goseong-point-ratio-20261026.md).


## 2026-10-26 · 대학배구 메인 카드·트로피 승인 시안 운영 적용

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·운영 확인은 release PR 기록). 사용자가 “대학은 이걸로 홈페이지에 반영”을 요청했다. 기존 대학 메인의 `2026 대회 → 대회별 보기 → 연도별 기록` 구성, Hero, 글자 크기, 간격, 대회·학교·선수 링크와 순위 데이터는 유지하며 국내대회 기본 템플릿의 카드 모양과 금·은·동 SVG 트로피만 적용한다. 승인 시안과 같은 12px 모서리·얇은 테두리·그림자 없는 표면을 페이지 전용 스킨으로 연결한다. 이전 일반 디자인 문서의 카드 장식은 이 범위에서 승인 시안이 우선한다. 함께 요청한 중·고 동일 형식은 별도 PROTOTYPE으로 준비하고 이 대학 운영 PR에는 포함하지 않는다. [범위·검수·복구](validation/university-hub-cards-20261026.md).



## 2026-10-27 · 종합대회 허브 및 전국체전·소년체전 운영 반영

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 결과는 release PR에 기록). 사용자가 전국체전·소년체전 중심 목록 시안을 승인하고, 목록 및 ‘대회 한눈에 보기’ 최종순위에서 지역을 강조한 뒤 실제 홈페이지에 반영하도록 명시적으로 요청했다. 대학 허브 카드 스킨, 남녀 색상, 금·은·동 트로피, 금색 hover, 연도별 펼침을 재사용한다. 전국체전 5부문 60팀·55경기·671명/154개 기존 프로필, 소년체전 4부문 59팀·55경기를 공통 국내대회 템플릿으로 연결한다. 36개 입상팀의 지역은 공식 참가팀 code로 연결하며 목록·overview·최종순위 카드에 16px 배지를 표시한다. 공동 3위, 2개 원문 점수 충돌, 기존 선수 ID와 팀 기록 경로는 유지한다. 내부 원본 보관 위치는 비공개로 유지하고 공개 배포에는 Source ID·공식 URL·무결성 해시만 포함한다. 기존 프로토타입의 운영 미반영 상태를 이 승인 범위에서 대체한다. [범위·검수·복구](validation/comprehensive-regions-release-20261027.md).


## 2026-10-27 · 확정 학교·대학 로고와 학교 소재지 표시

Status: APPROVED / IMPLEMENTED / VERIFIED (local 63 tests + 2 Cup smokes; 26 PC/mobile views + 360px. 최신 main b9f9df9의 동시 KOVO Cup 작업 보존. merge·Pages·live 증거는 [검수 보고서](validation/school-logos-20261027.md) 및 release PR에 기록). 사용자가 ① 학교 전용 로고 보관 폴더의 이름을 바꾸고 프로 로고까지 통합, ② 운영기준에 이미지 규격 기록, ③ 흐린 로고 개선, ④ 경북사대부고의 남색 원형 KNUHS·학교명·흰 날개 교표로 교체, ⑤ 선수명단/학교 페이지에 소재지 표시, ⑥ 남은 로고 확인 항목 설명, ⑦ 확정 로고의 실제 홈페이지 반영을 요청했다. 원본·가공본은 확인 연도별로 모아 보관하고 다음 연도에는 변경 여부를 재확인한다. 운영기준 MASTER v15와 같은 기준을 적용한다.

2026 확정 71개(남고·고등부 클럽 22, 여고 12, 남중 20, 여중 11, 여자대학부 6)를 기존 학교 manifest/runtime에 연결한다. PNG RGBA 512×512, 실제 도안 긴 변 410px, 최소 여백 51px, 비율 유지·중앙 정렬·바깥 투명·내부 흰색/문자/분리 도형 보존을 사용한다. 소재지와 정식 학교명은 `경북 영천 금호중학교`와 같이 공통 팀 상세·명단·인쇄 제목에 표시한다. 학교 소재지는 대표 시·도와 별도 필드로 유지한다. 새 엔진·Master ID·경기/선수/명단 관계 변경은 없다.

CBS 4개·춘계 3개 원문 별칭은 출처 대조 후 해당 competitionId에서만 표시/로고 연결한다. 모종중·홍천군체육회 U15·목포영화중과 이번 확인 목록 밖 학교는 fallback을 유지한다. 정상 프로 SVG 14개와 기존 프로 resolver는 유지한다. 앞선 prototype-only 제한은 이번 사용자의 명시적인 운영 반영 승인 범위에서 대체한다.


## 2026-10-27 · 종합대회 순위 지역 표기를 오른쪽 일반 글씨로 조정

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR에 기록). 운영 반영 요청에 이어 사용자가 지역을 팀명 위의 작은 카드 대신 팀명 오른쪽 끝의 일반 글씨로 표시하도록 수정했다. 종합대회 목록, 전국체전·소년체전 overview 우승팀/최종순위, 최종 입상팀 카드를 같은 방식으로 적용한다. 지역은 400 굵기·배경/테두리 없음·오른쪽 정렬, 긴 팀명은 줄바꿈하며 기존 공동 3위와 팀 링크를 유지한다. 앞선 같은 날짜의 16px 지역 배지 디자인을 이 범위에서 대체한다. 최신 main의 학교 로고·소재지 및 KOVO Cup 변경을 보존한다. [검수·복구](validation/comprehensive-region-text-20261027.md).


## 2026-10-27 · KOVO컵 참가팀에서 팸플릿 선수명단 표시

Status: APPROVED (구현 범위) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 사용자가 국제대회와 같은 팀 선택→명단 목록을 제안한 뒤 진행을 지시했다. 공통 명단 렌더러의 club 옵션으로 남녀 14팀·251명을 연결하고 PC·모바일 모두 팀 카드 전체 아래에 표시한다. 기존 Player ID는 이름·생년월일이 일치하는 54명만 연결하며 새 ID와 Master 수정은 없다. 팸플릿 기준 명단임을 명시하고 실제 경기별 엔트리/현재 구단 명단과 구분한다. 5개 생년월일 충돌과 1개 음력 표기는 확인 중으로 남긴다. 기존 학교의 모바일 아코디언·국제대회 열 구성·경기·순위·Hero는 유지한다. 앞선 Cup pending-only 결정을 이 구현 범위에서 대체한다. 운영 merge는 별도 승인 후 진행한다. [검수·출처·복구](validation/kovo-cup-rosters-20261027.md).


## 2026-10-28 · KOVO컵 명단의 국적에 국기 병기

Status: APPROVED (표시 수정) / IMPLEMENTED / VERIFIED (local preview). 사용자 요청으로 PC 국적 열, 모바일 상세정보, 인쇄 명단에 국기 + 국가명을 표시한다. 기존 국제대회에서 사용하는 FlagCDN 이미지 방식을 재사용하며 검수된 nationalityCode가 있는 경우만 표시한다. 국적 미확인은 그대로 유지하고 선수 데이터·ID는 변경하지 않는다. 기존 공개 승인 대기 상태는 유지한다. [검수 보고서](validation/kovo-cup-rosters-20261027.md).


## 2026-10-28 · KOVO컵 선수정보 공개 및 운영 반영 승인

Status: APPROVED / RELEASE AUTHORIZED. 사용자가 생년월일을 포함한 팸플릿 명단의 `kvolleylab/kvolleylab` 업로드와 운영사이트 반영 요청에 “선수정보 공개 승인”이라고 명시적으로 답했다. 남녀 14팀·251명 명단, 54개 기존 프로필 연결, 국기+국가명 표시, 6개 생년월일 확인 중 표시의 검수 범위로 진행한다. 앞선 공개 승인 대기 기록을 대체하며 CI·merge·운영 화면 검증 결과는 release PR에 기록한다. 원본 PDF/XLSX, 인증된 Drive 주소, 비공개 개인 메모는 공개 대상에 포함하지 않는다. [검수 보고서](validation/kovo-cup-rosters-20261027.md).


## 2026-10-28 · 종합대회 Hero 최종 선택 및 운영 연결

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR에 기록). 사용자가 비교 시안에서 종합대회 배구 02, 전국체전 남자부 04·여자부 07, 소년체전 남자부 09·여자부 12를 명시적으로 선택했다. 기존 운영 반영 요청의 연속 범위로 5종 PC·모바일 10장과 9개 부문을 연결한다. 선택 원본의 남녀 서로 다른 장면, PC 2108×406·모바일 1258×406, 로즈 #8E315E / #6F234A / #E7A8C2를 유지한다. `finished-artwork` 공통 opt-in은 어두운 덮개 없이 contain으로 전체 이미지를 보존한다. 모바일 상세는 하단 배치로 제목과 장면을 분리하며 기존 Hero 최소 높이와 템플릿·경기·명단·지역 표시는 유지한다. 최근 대회 카드는 해당 기본 부문의 Hero를 재사용한다. 운영기준·Hero 가이드 대조, MASTER/WEB 보관, 79개 회귀 검사 및 25개 반응형 이미지 검수 완료. 앞선 공통 홈 이미지와 남녀 동일 장면은 이 선택 범위에서 대체한다. [검수·복구·선택 번호](validation/comprehensive-hero-selected-20261028.md).

## 2026-10-28 · V-리그 대회 화면과 시즌 선수명단 운영 적용

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 화면은 release PR 기록). 사용자가 “V-리그도 대회 페이지 수정하고 선수명단 반영해줘”라고 요청했다. 기존 V-리그 남녀 경로에 공통 domestic-home-v2의 pro-league 옵션을 적용하고 팀 카드 아래 시즌 명단과 국기+국적을 표시한다. 10월 27일 공시까지 대조한 14팀·252명과 기존 exact-match 프로필 55개를 연결한다. 이준 전역 등록, 송민근 자유신분, 최원빈 해외임대, 김영태 MB 변경 및 외국인/아시아쿼터 28명의 공시 국적을 대조했다. Cup 당시 명단과 시즌 명단은 별도 snapshot이다. 기존 v08 Hero, 정규리그 252경기·순위·포스트시즌·선수 ID를 유지한다. 자료 충돌/음력 DOB 6건은 확인 중이다. 앞선 V-리그 pending-only 화면과 prototype 표기를 이번 범위에서 대체한다. [검수·출처·복구](validation/vleague-rosters-20261028.md).

## 2026-10-28 · 종합대회 PC Hero 확대 및 지역 중심 경기결과

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR 기록). 사용자가 PC Hero 장면이 카드의 절반 정도를 차지하도록 확대하고, 국내대회 기본 템플릿에 맞는 경기결과 정렬·팀명 전체 표시·로고 대신 지역을 요청했다. 선택된 5종의 원본 바이트와 모바일을 유지하며 PC의 빈 배경 축소 및 25:7 카드 비율을 적용한다. 이전의 PC contain·고정 높이는 이 범위에서 대체한다. 종합대회에만 지역 일반 글씨를 적용하고 기존 순위 오른쪽 지역은 중복 없이 유지한다. 경기결과는 좌우 같은 팀 영역과 가운데 점수, 긴 이름 줄바꿈을 사용하며 좁은 PC에서는 세트별 점수를 아래로 배치한다. 원본 경기·순위·명단·ID·타 대회 로고 및 동시 V-리그 변경을 보존한다. [검수·범위·복구](validation/comprehensive-layout-20261028.md).


## 2026-10-28 · V-리그 한눈에 순위표·참가팀 전 시즌 순서

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 증거는 release PR). 사용자가 시즌 안내 대신 시즌 순위표와 참가팀의 작년 순위 정렬·PC 한 줄 표시를 요청했다. 기존 정규리그 standings.rows를 재사용해 순위/팀/승점/승/패를 표시하고, overview 참가팀만 KOVO 공식 2025-26 최종순위순(포스트시즌 포함)으로 7팀 한 줄에 배치한다. SOOP의 페퍼저축은행 순위 승계를 명시한다. #189의 overview 시즌 안내를 대체하며 현재 순위·경기·명단·ID·Hero는 유지한다. 남녀 최근 결과+다음 경기 카드는 PROPOSED / NOT IMPLEMENTED: 사용자가 검토 중이므로 추가하지 않는다. [출처·검증·복구](validation/vleague-overview-20261028.md).


## 2026-10-28 · V-리그 남녀 최근 결과·다음 경기

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 증거는 release PR). 사용자가 남녀 각각 최근 결과 1경기 + 다음 예정 1경기를 함께 보여주는 구성을 요청했다. #190의 PROPOSED / NOT IMPLEMENTED 결정을 이 범위에서 대체한다. 한눈에의 순위표 아래·참가팀 위에 남녀 카드 2개를 배치하며 PC 2열/모바일 1열, 최종·세트별 스코어와 KST/대진/경기장 및 날짜 일정 링크를 표시한다. 동일 시즌 기존 경기 데이터를 사용하고 개막 전·결과 없음·다음 일정 없음·부문 로딩 실패를 구분한다. 현재 선수 ID/명단/국기·순위·경기·Hero·타 대회는 유지한다. [검수·선택 기준·복구](validation/vleague-match-summary-20261028.md).


## 2026-10-28 · 종합대회 지역 로고 형태 복원

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR 기록). 사용자가 종합대회 로고 모양을 복원하되 안의 글씨를 지역명으로 표시하도록 요청했다. 공통 텍스트 로고의 둥근 사각형과 남자부 파랑·여자부 로즈 색상을 재사용하고, 공식 참가팀의 대표 시·도를 넣는다. 경기결과·팀 기록·대진표·참가팀·명단 헤더·우승팀·최종 입상팀에 동일 원칙을 적용한다. 직전 일반 글씨만 쓰는 지역 마크 결정을 이 로고 슬롯 범위에서 대체하며, 순위 팀명 오른쪽의 일반 지역 글씨는 유지한다. 가운데 점수·긴 팀명 전체 줄바꿈·PC Hero 크기와 기존 데이터·선수 ID·다른 대회 로고·동시 V-리그 최근 경기 카드는 유지한다. [검수·범위·복구](validation/comprehensive-region-marks-20261028.md).

## 2026-10-28 · V-리그 남자부 마우스 오버를 연한 금색으로 변경

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 확인은 release PR). 사용자가 운영 V-리그 남자부에서 클릭 전에 마우스를 올렸을 때의 회색 음영을 연한 금색으로 변경하도록 요청했다. 기존 공통 CSS에 pro-league 남자부 범위의 hover 배경 `#FFF3D6`만 추가한다. 탭·요약 지표·참가팀·순위표·명단 행·경기일·라운드 필터에 적용하며 남녀 페이지의 남자부 경기 요약 카드도 같은 금색을 쓴다. 여자부 경기 카드의 분홍색, 평상시/선택 배경, 점수 색, 구조·데이터·다른 대회는 유지한다. 검수·복구: [보고서](validation/vleague-men-gold-hover-20261028.md).

## 2026-10-28 · V-리그 남자부 금색 hover 철회 및 기존 색 복원

Status: APPROVED / IMPLEMENTED / RELEASE AUTHORIZED (검증·merge·Pages·live 결과는 release PR). 사용자가 직전 금색 hover 변경에 “그냥 다시 원래대로 돌려줘”라고 요청했다. #194에서 추가한 금색 hover CSS를 제거하고 CSS 연결·기존 cache smoke를 #193의 상태로 정확히 복원한다. 위의 금색 hover 결정을 이 범위에서 대체한다. #192의 최근 결과+다음 경기, 명단·국기·순위·PC 참가팀 배치 및 #193의 종합대회 로고는 유지한다. 기준 main: 605a276b4ea3e77fb7e6d691106051d959a68743. 복원 대상 3개 파일은 985a01d와 바이트 단위로 일치하며 이전 금색 검수 문서·이미지는 이력으로 보존한다.


## 2026-10-28 · 종합대회 최종입상팀의 중복 지역명 제거

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 ‘대진·최종순위’의 ‘최종입상팀’ 카드를 ‘1위 → 경기 로고 → 화성시청 → 우승’으로 표시하도록 요청했다. 이 카드에서 팀명 오른쪽의 지역 글씨만 제거하고 지역 로고·순위 트로피·팀명 링크·우승/준우승/공동 3위를 가운데 세로로 배치한다. #193의 오른쪽 지역 유지 결정을 최종입상팀 카드 범위에서 대체한다. 목록과 한눈에 순위 표시는 변경하지 않으며 데이터·Hero·대진표·명단·다른 대회 렌더링은 유지한다. [검수·복구](validation/comprehensive-podium-region-once-20261028.md).


## 2026-10-28 · 종합대회 목록·대학 U-리그 PC Hero 이미지 비중 확대

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 종합대회 배구 목록과 대학 U-리그의 PC Hero에서 이미지가 카드의 절반 정도를 차지하도록 요청했다. 종합대회 목록은 PC 카드 비율을 3:1로 조정하고 왼쪽 문구·오른쪽 장면을 절반씩 배치한다. U-리그 남녀는 공통 `hero.themeVariant=half-visual` 옵션으로 원본 비율·오른쪽 정렬과 밝은 장면을 유지한다. 기존 사진 규칙의 강제 100%×100% 배경 맞춤 대신 높이 기준 자연 비율을 사용하며, 좁은 PC에서는 기존 제목 폭과 추가 명암으로 가독성을 보존한다. 모바일 자산·배치, 선택 이미지 바이트·색, 경기/명단/ID 및 직전 최종입상팀 수정을 유지한다. 종합대회 목록의 앞선 25:7 비율과 해당 U-리그 PC 사진 표시 결정을 이 범위에서 대체한다. [검수·복구](validation/hub-uleague-hero-half-20261028.md).


## 2026-10-28 · V-리그 포스트시즌 사다리 복구 및 재설계

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 운영 V-리그 포스트시즌 사다리의 표시 오류 확인과 디자인 수정을 요청했다. domestic 스킨 이식 뒤 빠졌던 시리즈 내부 CSS 범위를 공통 컴포넌트에서 복구하고, PC 3단 가로 연결/900px 이하 세로 연결, 진출 기준·팀명·승수·경기별 일정과 결과를 분리한다. 미확정 대진은 ‘진출팀 미정’과 —로 표시하며 남자부 차콜/여자부 로즈 헤더와 중립 점수색을 사용한다. QPO/PO 구분, 홈·원정 역전 시 팀 중복 방지, 시리즈 승자 다음 단계 연결, 종료 후 잔여 경기 미실시 표시를 검증했다. 기존 준PO 조건/3전 2선승/5전 3선승 설정과 선수·경기·순위 원본, 앞선 회색 hover 복원, 동시 종합대회/U-리그 Hero 변경을 유지한다. [범위·검수·복구](validation/vleague-postseason-20261028.md).

## 2026-10-28 · 남자 신인선수 드래프트와 라운드 지명권 거래

Status: APPROVED (사용자가 요청한 구현 범위) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 프로 V-리그 하위에 V-리그 홈 → KOVO컵 → 드래프트를 추가한다. 기존 밝은 배경·네이비 화면과 팀 로고·신청자·검증된 선수 프로필을 재사용한다. 7팀 배분, 중복을 보존하는 추첨, 원지명권 기준 7열×1R~4R·수련선수 결과를 분리한다. 지명권 ID는 시즌·부문·라운드·원래팀으로 고정하며 현재 보유팀과 실제 지명팀을 구분한다. 확정 거래만 반영하고 맞교환·재양도·명시적 연쇄 취소 및 변경 전후 이력을 보존한다. 입력은 별도 data/draft-board 브랜치에 SHA 충돌 검사와 함께 영구 저장한다. 기존 테스트용 관리자 진입을 유지하되 쓰기는 실제 GitHub 저장소 관리자 권한을 요구한다. 이 인증 보완 방식은 구현 선택이며 운영 채택·배포 승인은 아직 받지 않았다. 공식 색상·추첨·거래·결과는 미확인으로 남기고 가상 검증 데이터를 공개 시즌에 넣지 않는다. 기존 신청자 hub/Player ID/MASTER와 최근 V-리그·종합대회 변경을 유지한다. 자동 검사90건·실제 API 저장/브라우저 재조회·PC/모바일 폭 검수를 통과했다. 실제 사용자 토큰을 입력한 브라우저 저장 전 과정은 NOT VERIFIED로 명시한다. [운영 명세](DRAFT_BOARD_v1.md) · [검수·출처·복구](validation/draft-board-20261028.md). 운영 merge·배포는 별도 승인 후 진행한다.

## 2026-10-29 · 제공된 남자 드래프트 실시간 기록 반영

Status: APPROVED (사용자 제공 기록을 참고한 업데이트 범위) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 새 첨부 실시간 기록을 읽어 7팀 색상, 추첨10회/중복3회, 일반 지명13명·패스15개·수련선수5명을 원지명권 기준으로 반영한다. 앞선 초기 미입력 상태를 이 기록 범위에서 대체한다. 사용자 기록과 공식 사전 안내·기사 대조의 출처를 구분하며 송정민 소속은 신청자 명단과 현장 사진 보도에 맞춰 수성고로 정정하고 원문을 보존한다. 18명 모두 기존 신청자와 연결하며 검증된 프로필17개만 제공한다. 최초 배분과 확률은 유지한다. 거래 근거가 없으므로 확인 중 상태를 유지하고 가상 거래를 넣지 않는다. 감사 이력1건에55건을 추가한 revision56을 실제 입력 브랜치에 저장하고 재조회했다. 관련 검사45개 및 PC/360px/390px 검수 통과, 기존 소유자 전용 Site 갱신 완료. 운영사이트 merge·배포 승인 범위는 확장하지 않는다. [검수·출처·복구](validation/draft-board-20261029.md).

## 2026-10-29 · 드래프트 결과 우선 화면·단계별 확률·자동 7순위

Status: APPROVED (사용자가 요청한 화면·기록 수정) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 결과표를 구슬 배분 위로 올리고 선수명·소속·포지션/패스 중심으로 단순화한다. 공개 시즌 선택은 연도로 표시하며 진행 상태 대신 신청59·지명18을 기존 데이터에서 계산한다. 개최 정보와 구슬 글자를 키우고 확률은 신청자 화면의 파랑으로 맞춘다. 저장소 확인·버전·재조회, 주요 수정 이력과 시즌 자료 패널은 실제 관리자에게만 표시하고 공개 관찰 기록 문단은 제거한다. 시즌별 추첨 방식 설정을 추가하고 사용자 정정에 따라 1~3순위100개/4~7순위64개 시작 구슬 비율을 표시한다. 대한항공은 추첨 없이 자동7순위이며 실제 추첨은9회·중복3회다. 앞선10회 기록은 원본과 감사 이력에 보존하고 runtime revision58에 정정한다. 원지명권28개·실제 지명팀·선수·프로필 연결·거래 모델은 유지한다. 사진은 이번 메시지에서 확인되지 않아 정확한 사진 대조는 NOT VERIFIED. 관련50개 검사와 PC/360px/390px 검수 통과. 앞선 공개 상태/이력 표시와10회 추첨 결정을 이 요청 범위에서 대체하며 운영 merge·배포 승인 범위는 확장하지 않는다. [검수·확률 의미·복구](validation/draft-board-ui-20261029.md).


## 2026-10-30 · KVL Quality Audit v1 읽기 전용 시범

Status: IMPLEMENTATION AUTHORIZED / DRAFT PR / RELEASE AND SCHEDULE NOT AUTHORIZED. 사용자가 기존 운영 기준 조사, 독립 감사 프로그램·테스트·GitHub Actions 개발, 실제 읽기 전용 시범 및 Draft PR 제출을 요청했다. `feature/kvl-quality-audit-v1`에서 경기/Player ID/명단/공개등급/기존 회귀/UI 점검과 안정적 오류 ID·중복 없는 Issue 알림 체계를 구현한다. 기존 공식 수집기·테스트·공개 catalog loader를 재사용한다. 운영 홈페이지·MASTER·Player ID·완료된 AVC·기존 workflow는 변경하지 않는다. 신규 schedule은 넣지 않으며 main 병합·배포·Drive 인증·실제 Issue 알림은 별도 사용자 승인 대상이다. ChatGPT/OpenAI 구독 없이 규칙 기반으로 실행한다. [운영 명세](KVL_QUALITY_AUDIT_SPEC_v1.md), [기존 자동화](quality-audit/EXISTING_AUTOMATION_v1.md), [시범 결과](quality-audit/PILOT_v1.md).

## 2026-10-30 · 드래프트 3개 요약 지표·사진 형식의 공식 신청자 목록

Status: APPROVED (사용자 요청 범위) / IMPLEMENTED / VERIFIED / PRIVATE PREVIEW DEPLOYED / READY FOR REVIEW. 사용자가 첨부한 두 사진에 맞춰 기존 신청·지명 문장을 59명 드래프트 참가 / 18명 최종 지명 / 30.5% 역대 최저 지명률로 대체하고, 참가 신청자 버튼은 공식 순번의 목록을 열도록 한다. 지표는 기존 신청자·결과에서 계산하며 역대 최저 문구는 근거 자료·시즌·인원·완료 상태가 일치할 때만 표시한다. 남자 59명 명단은 10열, 소속별 묶음과 대상 29명 초록 음영으로 구성한다. 공식 PDF·첨부 사진에 대조한 생년월일·체중·출신학교를 별도 자료에 보관하며 기존 ID·신청자 원본·53개 프로필 링크·검색·필터·여자부·지명권·입력 revision58은 유지한다. 모바일은 이름까지 먼저 보이고 상세 열은 가로 이동한다. 앞선 신청/지명 문장 표시를 이 범위에서 대체한다. 관련 검사67개와 PC/360px/390px·검색 검수 통과, 소유자 전용 미리보기 배포 성공. 운영 merge·배포 승인 범위는 확장하지 않는다. [사진·출처·검수·복구](validation/draft-summary-list-20261030.md).

## 2026-10-30 · 남녀 신인 드래프트 공식 결과 및 운영 배포 승인

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. 사용자가 여자부를 동일 양식으로 확장하고 실제 결과 검색·반영 후 “실제 홈페이지에 반영시켜”라고 운영 배포를 명시 승인했다. 앞선 드래프트 private-only/미승인 제한을 이 범위에서 대체한다. 최신 사이드바 이름 `신인 드래프트`를 유지한다. 여자 공식 신청58명과 취소1명을 구분해 실제57명·지명16명·28.1%를 표시하고, 58행10열 공식 목록과 기존52개 프로필 연결을 보존한다. KOVO 공식표 기준 14일반+2수련 및 3거래4권리를 원지명권 위치에 반영한다. 확정순위와 실제 구슬 로그를 분리하며 중복·색상·마지막 순위 결정 방식은 미확인으로 둔다. 남자 공식 최종표도 대조하고 홍준범 OP/MB를 감사 이력으로 정정한다. 입력 브랜치 `3a80baab6386c6e45212f119bdd2511874c7a92c`, 남자 revision60/여자 revision41. 공식 원본은 기존 Drive 공식자료 폴더에 보관했다. 관련72개 검사·105개 프로필 회귀 통과. merge·Pages·운영 확인은 PR #199 release 기록으로 구분한다. [자료·검수·복구](validation/draft-women-20261030.md).


## 2026-10-30 · 여자 드래프트 단계별 확률·로즈 Hero·거래 요약·4R 표시

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR 기록). 이전 실제 홈페이지 반영 요청에 이어 운영자가 여자부 1~3순위 후 해당 팀 구슬을 제외하는 방식을 확인했다. 100개/46개 단계 시작 구슬 비율을 공통 추첨 카드로 표시하며, 실제 순서·중복 횟수·색상·7순위 자동 확정은 추정하지 않는다. Hero는 `KVL_COMPETITION_THEME_POLICY_V1`의 #8E315E / #6F234A, 강조 #E7A8C2를 사용한다. 거래 당시 선수·포지션·지명권을 ↔ 요약으로 표시하고, 모든 7개 권리가 패스인 4R만 공개 표에서 생략한다. 관리자 표와 저장된 28개 권리는 유지한다. 치지직 제공 영상은 지역 시청 제한으로 실제 프레임 미확인. [검수·복구](validation/draft-women-refine-20261030.md).

## 2026-10-30 · KVL Quality Audit v1 운영 적용 승인

Status: APPROVED / MAIN INSTALLED / ACTIVATION VERIFICATION IN PROGRESS. 사용자가 PR 병합 → 운영 검증 → 매일 오전 9시 점검·중복 없는 Issue 알림 활성화 순서에 “승인한다”라고 답했다. PR #200을 `dd49cabf9af4e96b0d7e1a38862ec0213e40455b`로 병합했다. 앞선 감사의 RELEASE AND SCHEDULE NOT AUTHORIZED 기록을 이 운영 범위에서 대체한다. GitHub 웹 인증이 완료되지 않아 감사 전용 코드의 main 반영 시 운영 검증을 실행하는 경로를 추가한다. 수동 실행과 최소 권한은 유지하며 먼저 알림 없는 점검을 검증한 뒤 일정·알림을 활성화한다. 최신 #199 드래프트·공시 변경을 보존하고 기존 드래프트 검사를 재사용한다. 홈페이지·MASTER·Player ID·기존 workflow 수정이나 Drive 인증 공개를 승인한 것으로 확대하지 않는다. 실행·활성화 상태는 [운영 전환 기록](quality-audit/ACTIVATION_v1.md)에서 구분한다.

## 2026-10-30 · 승인된 감사 일정·Issue 운영 구성

Status: APPROVED / CONFIGURED (main 실행·병합 증거는 활성화 PR). 기존 사용자 승인에 따라 UTC 00:00/KST 09:00 일정과 감사 전용 코드의 main 반영 시 중복 없는 Issue 갱신을 구성한다. 승인을 코드 이력에 남기고 기본 활성화해 웹 로그인과 별도 PAT 설정에 의존하지 않는다. 선택적 `KVL_QUALITY_AUDIT_APPROVED=false` 또는 다른 비어 있지 않은 미지원 값은 자동 실행·알림을 중지하며 변수 삭제는 기본 활성 상태로 복귀한다. 기존 pilot의 “변수 true 설정 전 무조건 비활성” 조건을 이번 승인된 운영 구성으로 대체한다. 명시적 main·허용 이벤트·런타임 승인 true·최소 권한·PRIVATE 비공개·신규/상승/재발만 알림은 유지한다. Drive 인증과 계정별 알림 수신은 미검증으로 구분한다. [운영 전환 기록](quality-audit/ACTIVATION_v1.md).


## 2026-10-30 · KVL Quality Audit v1 운영 활성 및 알림 재실행 검증

Status: ACTIVE / MAIN VERIFIED / ISSUE PUBLICATION VERIFIED. 사용자 승인에 따라 #200 설치 → #201 main 읽기 전용 운영 검증 → #202 매일 09:00 KST 일정·중복 없는 Issue 알림 활성화를 완료했다. 활성화 commit `772598bc665eb9029fd8d87fce98499e67e4d4b6`, Actions `41056879688`의 audit/notify 성공. 기존 공개 P2 4건을 #204~#207에 최초 발견일 그대로 등록했고 실제 notify 재실행은 create 0 / update 4 / 댓글 0으로 중복을 방지했다. 최종 PASS125/FAIL3/NOT VERIFIED7/NOT RUN1, Python129·UI72 PASS, P0/P1 gate PASS. 동시에 반영된 #199/#203 드래프트와 기존 공시를 보존했다. 기존 오류는 자동 수정하지 않는다. 최초 예약 이벤트(10월31일09시 예정), Drive 인증, 실제 이메일/모바일 수신·배포차단 연결은 미검증으로 남긴다. ChatGPT/OpenAI 구독·키·세션 비종속. [운영 전환·복구·실행 증거](quality-audit/ACTIVATION_v1.md).

## 2026-10-30 · 여자 드래프트 사용자 영상 전사·방송 배분 화면 반영

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (실제 배포 증거는 release PR). 사용자가 원영상에서 확인해 제공한 14회 순서와 첨부 방송 화면의 7팀 색상을 반영한다. 정관장 중복7회·도로공사 중복1회, 총8회이며 중복행은 유지하고 신규 순위는 부여하지 않는다. GS칼텍스는 검정1개와 공식7순위를 유지하되 제공된14회 이후 실제 추첨·자동 확정 여부는 미확인으로 둔다. 이전 색상·중복 미확인 판단을 제공된 범위에서 대체하며 원영상 직접 검증으로 승격하지 않는다. 23개 감사 명령으로 여자 revision45→68, 지명권28개·선수 결과·거래·남자부 보존. 기존 실제 홈페이지 반영 승인 범위의 후속 데이터 갱신이다. [자료·검수·복구](validation/draft-women-draws-20261030.md).


## 2026-10-31 · V-리그 GitHub 자동 업데이트 구축

Status: IMPLEMENTATION AUTHORIZED / IMPLEMENTED / VERIFIED LOCALLY AND ON GITHUB / READY FOR REVIEW / NOT ACTIVE. 사용자가 V-리그의 ChatGPT 비종속 자동 업데이트와 GitHub 실행 가능 여부를 질문한 뒤 “진행해”라고 구축을 지시했다. 기존 MASTER를 원본으로 유지하면서 공식 정규리그 전체 수집 → ID·점수·공식 순위 대조 → 정확한 MASTER 셀 반영·재조회 → 허용 JSON → Pages 검증의 GitHub Actions 경로를 구현한다. 남녀 각 126경기의 공식 연결과 실제 개막전 2경기를 읽기 전용으로 대조했다. 기존 명단·선수 ID·포스트시즌·공통 UI·공시/감사 일정은 유지한다. `KVL_VLEAGUE_UPDATE_APPROVED=true` 전 예약 게시·Issue는 비활성이다. 운영 병합·배포 승인, GitHub용 Google 실행 권한 연결, 실제 MASTER 쓰기·Pages 배포는 아직 완료로 표시하지 않는다. 기존 Quality Audit의 활성화 승인을 새 수집기의 운영 승인으로 확대하지 않는다. [운영 명세](KVL_VLEAGUE_AUTO_UPDATE_v1.md), [실제 자료·검수·복구](validation/vleague-auto-update_v1.md).


## 2026-11-01 · V-리그 자동 업데이트 운영 반영·실행 권한 연결 승인

Status: APPROVED / RELEASE AUTHORIZED / ACTIVATION IN PROGRESS. 사용자가 PR #213 운영 반영과 기존 Google MASTER의 GitHub 실행 권한 연결을 요청하는 확인에 “승인한다”라고 명시적으로 답했다. 앞선 NOT ACTIVE 기록의 승인 대기 상태를 이 범위에서 대체한다. 검증된 정규리그 수집·MASTER 정밀 반영·공개 JSON·Pages 검증과 승인된 일정·중복 없는 실패 Issue를 운영 전환한다. 코드 기준 `857f344a0b8480cdc5eac2e3779115bda2618344`, V-리그 Actions `41213686346` 및 Quality Audit `41213686347` 성공. 기존 선수 등록 workflow 3개 실패는 검수 문서에 기록한 별도 legacy 문제이며 이 승인으로 수정 범위를 확대하지 않는다. 병합, GitHub용 Google 권한 연결, 첫 MASTER 쓰기·재조회, 실제 Pages 반영을 각각 확인한 후 완료 상태를 기록한다. 권한 연결 이전에 검증을 우회하거나 MASTER 확인 없이 자동 공개하지 않는다. [운영 명세](KVL_VLEAGUE_AUTO_UPDATE_v1.md), [검수 근거](validation/vleague-auto-update_v1.md).


## 2026-11-01 · 메뉴의 금색 KVL 배구공을 사용하는 파비콘 검토본

Status: PROTOTYPE / ASSET VERIFIED / NOT DEPLOYED. 사용자가 브라우저 탭의 기본 지구본을 바꾸려는 맥락에서 현재 메뉴 맨 위의 KVL 배구공 심벌을 제안했다. 기존 `kvl-ball-international-gold.webp`를 그대로 재사용한 ICO 16/32/48/64px, 홈의 정적 연결, 공통 내비게이션의 중복 없는 연결을 분리 브랜치에서 준비한다. 사용자의 금색·흰색 표현과 달리 지정된 메뉴 원본은 금색·짙은 남색이므로 이 검토본은 원본 색상을 유지하며 재색칠한 결과로 표시하지 않는다. 원본 자산·제목·메뉴 배치·경기/선수 데이터는 보존한다. 실제 브라우저 검수와 운영 반영 승인은 남아 있다. [변경·검수·복구](validation/kvl-favicon_v1.md), [적용 예상 미리보기](validation/KVL_favicon_preview_v1.html).


## 2026-11-01 · 금색 KVL 배구공 파비콘 운영 반영 승인

Status: APPROVED / RELEASE AUTHORIZED / DEPLOYMENT VERIFICATION PENDING. 사용자가 기존 메뉴의 금색·짙은 남색 KVL 배구공을 그대로 활용한 파비콘과 [PR #214](https://github.com/kvolleylab/kvolleylab/pull/214)의 검토 결과를 확인한 뒤 “승인한다”라고 명시적으로 답했다. 앞선 파비콘 검토본의 운영 승인 대기 상태를 이 범위에서 대체한다. ICO 16/32/48/64px, 홈의 정적 연결, 공통 내비게이션의 중복 없는 연결만 운영 전환한다. 코드 기준은 `0b0d9d687c3d1710307ed064a86a3eb9aa9e6876`, 재확인한 main은 `444eff62474089029c6b5aacfae191d321585364`이다. 브라우저 검수는 작동하는 클라우드 Chrome으로 진행하며 병합·Pages·실제 아이콘 응답·홈/내부 페이지 연결을 확인한 뒤 PR에 배포 증거를 남긴다. 원본 로고·경기/선수 데이터·사이트 제목·기존 메뉴 기능은 이 승인에 따른 변경 대상이 아니다. [검수 및 복구](validation/kvl-favicon_v1.md).


## 2026-11-01 · V-리그 수집기 설치와 최초 연결 확인 결과

Status: APPROVED / CODE INSTALLED / RUNTIME AUTH NOT VERIFIED / FIRST DATA WRITE NOT APPLIED. 사용자 승인에 따라 PR #213을 `444eff62474089029c6b5aacfae191d321585364`로 병합했다. 후속 파비콘 PR #214를 보존한다. 실제 MASTER의 M/R strict dropdown을 확인해 작성기의 `공식검증`을 허용 값 `공식확정`으로 수정하고 20개 조합 회귀를 추가한다. 시트 검증 규칙은 변경하지 않는다. 관리 화면 인증은 도구 시간 초과로 결과 미확인이며 Google 실행 권한·GitHub 활성화 변수는 이번 작업에서 설정하지 않았다. 최초 MASTER 쓰기 요청 중단 후 다시 읽은 두 개막전은 여전히 예정·점수 공란이므로 경기 결과 반영 완료로 표시하지 않는다. 운영 승인 자체는 유지하며 인증·첫 반영·공개 배포 확인을 이어서 완료해야 한다. [상태·검증·이어갈 단계](validation/vleague-activation_v1.md).

## 2026-11-01 · 국제 개정 보류 및 국내 기본 템플릿 VNL 시안

Status: SCOPE CONFIRMED / PROTOTYPE / READY FOR REVIEW / PRODUCTION NOT AUTHORIZED. 사용자의 최신 지시로 국제 템플릿 개정(PR #212)은 잠시 보류하고, 승인된 `domestic-home-v2`를 직접 사용한 2026 VNL 남자부 시안을 별도 브랜치에서 제작한다. VNL의 FIVB 보라색과 기존 ‘대회 의미 · 시즌 구조’ 원문을 유지한다. 기준 main `2791e93f730a13c7f64e209d802b7e1df43b4758`, 브랜치 `feature/vnl-domestic-template-v1`. 국내 공통 파일은 수정하지 않고 빌드 시 미리보기용 실행 조건·CSS 선택자를 연결한다. VNL config/data와 공통 Engine V2, 기존 국내·AVC·VNL 운영 화면은 변경하지 않는다. 국제 공통 템플릿의 개정·확정·다른 대회 적용 및 운영 병합 승인은 포함하지 않는다. [시안·화면·검수·복구](validation/vnl-domestic-template-v1.md).

## 2026-11-01 · VNL 시안 8개 피드백과 국내 팀 달력 보완

Status: REQUESTED CHANGES IMPLEMENTED / PROTOTYPE / READY FOR REVIEW / PRODUCTION NOT AUTHORIZED. 사용자가 기존 운영 VNL Hero·설명 카드 색상 복원, 경기행 5세트 기준 중앙 정렬, 보조 정보 한 줄, 중국 ‘개최국’ 표시, 일반 사다리 실선, 국가 가나다순과 선택 팀 달력을 요청했다. 경기행·부전승·팀 달력은 국내 기본 템플릿에도 같은 형태로 보완하도록 명시했다. 앞선 ‘국내 공통 파일을 수정하지 않는다’는 초기 시안 제약을 이 세 기능과 선택적 원본 Hero 보존의 브랜치 제안 범위에서 대체한다. 공통 소스 4개 파일을 Draft PR #216에서 보완하며 운영 main/Pages·wrapper/config/data·MASTER·기존 ID·Hero 자산은 변경하지 않는다. 국제 템플릿 개정 PR #212는 보류를 유지한다. 국내와 VNL은 같은 달력 렌더러를 사용하고, VNL 표시용 어댑터에서만 국가 정렬·중국 상태 문구를 바꾼다. [변경·화면·검수·승인 후 범위](validation/vnl-domestic-template-v1.md).


## 2026-11-01 · VNL 시안의 국제 기본 기준 채택 및 팀 경기 표시 보완

Status: DESIGN BASELINE ADOPTED / REQUESTED CHANGES IMPLEMENTED / PREVIEW / PRODUCTION NOT AUTHORIZED. 사용자가 현재 2026 VNL 페이지를 국제 기본 템플릿의 기준으로 지정했다. 앞선 국제 기준 확정 보류를 이 디자인 범위에서 대체하며, 별도 대안 PR #212는 재개하지 않는다. 국내 Hero 글자 크기를 VNL 규격으로 맞추고, 경기장·현지시간 문구는 세트 스코어 중심에 정렬한다. 팀 선택 시 달력과 전체 목록을 기본 펼침으로 표시하며 달력에 대진/등록 스코어를 표기한다. 단일 VNL 예선순위의 중복 상태 열만 선택적으로 제거한다. 데이터·MASTER·ID·의미/시즌 구조 원문 및 운영 main은 변경하지 않는다. 적용은 PR #216과 비공개 시안이며 운영 병합/Pages/일괄 적용 승인으로 확대하지 않는다. [국제 기준](international-template-v2.md) · [검수 기록](validation/vnl-domestic-template-v1.md).


## 2026-11-01 · 팀 성적 카드와 예선·전체 승률

Status: REQUESTED CHANGES IMPLEMENTED / VERIFIED / PREVIEW / PRODUCTION NOT AUTHORIZED. 사용자가 경기일정·결과의 팀 로고 선택 시 전체 경기·승·패·승률(예선, 전체)을 대학배구와 같은 양식으로 표시하고 국내 기본 템플릿에도 적용하도록 요청했다. 기존 공통 성적 카드를 5개 지표로 확장하고 달력 위에 둔다. PC는 5칸, 모바일은 3+2칸이며 VNL은 FIVB 보라색을 사용한다. 예선은 명시된 단계 또는 기존 예선 조 소속으로 제한해 U-리그 6강리그/결선을 제외한다. 미완료 경기는 승률 분모에 넣지 않는다. PR #216 및 비공개 시안에서 검증하며 운영 main·원본 config/data·MASTER·ID는 유지한다. [검수 기록](validation/vnl-domestic-template-v1.md).


## 2026-11-01 · 한눈에 보기 요약 항목 및 투명 배경 아이콘

Status: REQUESTED CHANGES IMPLEMENTED / VERIFIED / PREVIEW / PRODUCTION NOT AUTHORIZED. 사용자가 VNL 한눈에 보기 요약을 참가국·전체 일정·파이널 진출·대회 장소로 바꾸고 운영 VNL의 아이콘 모양을 사용하되 색상은 유지하도록 요청했다. 기존 shell의 사람/달력/트로피/위치핀 SVG를 재사용하고 원본 `knockoutTeamCount` 8개국을 대진 화면에 연결한다. 국내 기본 템플릿의 요약 아이콘도 배경을 제거하되 색상·모양·문구·수치는 유지한다. `structure.overviewMetrics` 선택 설정으로 구분하며 공통 엔진/자산을 복제하지 않는다. PR #216 및 비공개 시안만 갱신하며 운영 main·MASTER·config/data는 변경하지 않는다. [검수 기록](validation/vnl-domestic-template-v1.md).


## 2026-11-01 · 요약 아이콘 크기를 운영 VNL에 맞춤

Status: REQUESTED CHANGES IMPLEMENTED / PREVIEW / PRODUCTION NOT AUTHORIZED. 사용자가 요약 아이콘을 운영 홈페이지 VNL과 같은 크기로 확대하고 국내 기본 템플릿의 기본값으로 지정했다. 기존22px를 운영 geometry의 기본 `clamp(28px,2.55vw,36px)`, 좁은 PC27px, 모바일31px로 대체한다. 변경 범위는 `.dv2-metric-icon svg`이며 색상·배경 없음·모양·탭/Hero/다른 트로피는 유지한다. PR #216 및 기존 비공개 시안에서만 반영하며 운영 main/데이터는 변경하지 않는다. [검수 기록](validation/vnl-domestic-template-v1.md).


## 2026-11-01 · VNL 남녀 공통 화면 운영 적용 승인

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. 사용자가 “여자부도 동일하게 만들어주고 이 페이지를 실제 홈페이지에 반영해줘”라고 명시적으로 지시했다. PR #216의 승인 대기 상태를 대체하고 승인된 국내 공통 개선·VNL 남자부 표시 설정·여자부 동일 화면·홈페이지 남녀 진입을 운영 전환한다. 국내 공통 표시 모듈에 국제 opt-in을 추가하며 엔진을 복제하지 않는다. 남자 data.json·의미/시즌 구조·ID·MASTER를 보존한다. 기존 여자 MASTER가 없어 공식1662의116경기·독립순위·252명 공개 명단을 출처별 ID로 검증·연결하며 KVL MASTER 매핑/신체정보·한글명 확인 완료로 표시하지 않는다. 남자 보라/여자 로즈, 국기·계절별 내용은 별도 config/data다. 기존 AVC 운영과 다른 국제대회는 일괄 전환하지 않는다. 병합·Pages·실사이트 증거는 PR #216에 기록한다. [근거·검수·범위·복구](validation/vnl-production-20261101.md).
## 2026-11-01 · V-리그 홈 달력 공휴일·두 줄 대진

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 운영 V-리그 홈 및 남녀 달력을 공휴일 날짜 빨강, 요청한 팀 약칭, `1R KB vs 삼성` / `(평택, 14시)` 두 줄로 수정하도록 요청했다. 기존 경기일 음영은 유지하고 내부 흰 카드·왼쪽 색 띠는 제거한다. 공통 달력의 V-리그 선택 설정으로 적용하며 모바일은 같은 문구를 달력 영역 안의 가로 이동으로 보존한다. 약칭은 표시 전용이며 정식 팀명·ID·명단·경기결과·MASTER는 유지한다. 네이버 직접 조회는 실패해 NOT VERIFIED로 기록하고 공식 KASA 월력요항으로 해당 시즌 공휴일을 대조했다. 기존 포스트시즌 검사2건은 수정 전 main에서도 실패하므로 별도로 기록한다. 중·고 시안의 운영 미승인 범위와 VNL/AVC·다른 대회 화면은 확대 변경하지 않는다. [범위·검수·출처·복구](validation/vleague-calendar-20261101.md).


## 2026-11-01 · V-리그 달력 SOOP·공휴일 음영·모바일 전체 표시

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 운영 달력 후속 수정으로 사용자가 여자부 `S∞P`를 `SOOP`으로, 공휴일을 빨간 날짜+연한 빨강 음영으로, 여자부 평일 날짜를 검정색으로 바꾸고 모바일 가로 이동을 없애도록 요청했다. 앞선 PR #223의 해당 약칭·날짜색·가로 이동 결정을 이 범위에서 대체한다. 남녀 같은 공휴일 색상과 7열 너비 맞춤을 사용하며 모바일 긴 대진은 팀명 단위로 줄바꿈한다. 기존 공식 공휴일 범위와 실제 경기시간·ID·결과·명단·MASTER는 그대로 보존한다. V-리그 선택 설정과 범위 제한 CSS로 적용하며 다른 대회 표시에는 확대하지 않는다. 관련33개 검사 및 PC·390px·360px 달력/상세 창 검수 통과. [검수·색상·변경 범위·복구](validation/vleague-calendar-v2-20261101.md).


## 2026-11-01 · V-리그 올스타전 표시·현재 성별 우선·경기일만 음영

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 올스타전 빨간 글씨, 여자부 최근 결과/다음 경기의 여자 우선 배치, 경기 없는 휴일 음영 제거를 요청했다. 기존 MASTER의2027-01-17 예정일을 대회별 표시 설정으로 연결하고 정규리그 경기로 추가하지 않는다. 현재 성별을 PC 왼쪽/모바일 위에 두며, 달력 음영은 해당 달력의 실제 경기일만 적용한다. 공휴일·일요일 숫자는 빨강으로 유지한다. PR #225의 경기 없는 휴일 음영 결정을 이 범위에서 대체한다. 35개 관련 검사와PC·390px·360px 검수 통과. MASTER·252경기·ID·결과·명단 및 다른 대회 표시 설정은 유지한다. [출처·검수·범위·복구](validation/vleague-calendar-v3-20261101.md).


## 2026-11-01 · 최초 V-리그 실제 반영 성공 기록 보완

Status: USER APPROVED / FIRST MANUAL MASTER WRITE VERIFIED / DEPLOYED VERIFIED. 기존 초기 연결 점검의 미확인 상태를 후속 실행 증거로 갱신한다. Actions 41305975071에서 check·publish 성공, MASTER 556셀 반영 및 재조회 일치, 공개 데이터 커밋 e9fa468eee6b327373ba4da68d802a6dad1f390b와 Pages 빌드 SHA 및 실제 남녀 JSON 일치를 확인했다. 수동 최초 성공과 아직 관측하지 않은 후속 예약 성공은 구분한다. 기존 계정 설정을 다시 요구하지 않는다. [운영 전환 기록](validation/vleague-activation_v1.md).

## 2026-11-01 · 대회 운영 묶음·선수 공시·기사·실행 종료 및 보관

이 절은 11월 1일 검토 당시 기록이다. 정규리그 한정 범위·4/10 종료 및 신규 코드 미승인 상태는 아래 2026-11-02 결정으로 대체한다.

Status: REQUESTED / IMPLEMENTED / LOCALLY VERIFIED / OPERATING MASTER v17 APPLIED / READY FOR REVIEW / NEW CODE NOT DEPLOYED. 사용자가 선수 명단·등록·이적 및 공식 공시·기사 수집을 보완하고, 실행 종료일과 ‘페이지 제작 + MASTER 연결 + 자동 업데이트 + 종료 후 기록 보관’을 대회 추가의 기본 운영 단위로 요청했다. 기존 Google 운영원칙 MASTER를 같은 문서 ID로 v17 갱신하고 재조회했다. GitHub 신규 scaffold에는 비활성 operations manifest와 운영 준비 검사를 추가한다. 기존 V-리그 정규리그는 명시된 KST 기간과 최종 확인 7일 후 2027-04-10 00:00 종료 경계를 사용한다. 이는 공식 대회/포스트시즌 종료일을 주장하지 않는다. 종료는 STOPPED_PENDING_ARCHIVE이며 공식 최종 결과·MASTER·배포·해시 증거 검증 후에만 보관 상태를 인정한다. 로컬 보관 준비 명령은 검증된 스냅샷만 생성하고 외부 쓰기와 정책 자동 변경은 하지 않는다.

선수 공시는 원문 버전·Player_ID·효력일 검토로 연결하며 등록 해지를 등록으로 분류하던 오류와 임대 만료만으로 소속을 되살리던 오류를 수정한다. 기사 RSS는 미확정 메타데이터로 분리한다. 실제 남녀 선수 MASTER의 파일·탭·헤더는 확인했지만 ID 공란·이력 schema·상태값 검토가 남아 외부 writer는 미연결이다. 선수/기사 감시는 경기 기간과 분리하되 2027-06-01 내부 검토기한과 2027-10-31 운영 종료일을 명시한다. 두 날짜 모두 공식 대회 종료일이 아니다. 대학 공식 PDF에서 참가22팀 표를 추출했고 공개 XLSX 구조도 확인했으나 실제 중고·엘리트 선수/결과 엑셀과 OCR 운영 검증은 미완료로 남긴다.

통합 기준 main bc9b0bdcbf8ba5fed891b76d5cc06c9962236c82의 PR #226 올스타전·성별 우선·달력 변경을 보존한다. 진행 중 순위를 확정 포스트시즌 시드로 쓰던 기존 오류가 자동화 UI 검사를 막아 해당 확정 조건만 수정했다. 관련302개 로컬 검사 통과. 검토 PR #227. 신규 코드 운영 병합/배포는 검토 PR과 운영자 승인 후 구분 기록하며 미확정 선수 사실을 승인 없이 반영하지 않는다. [운영 기준](KVL_COMPETITION_AUTOMATION_OPERATING_STANDARD_v1.md) · [검증·남은 연결·복구](validation/competition-automation-extension-20261101.md).
## 2026-11-02 · V-리그 중복 상태 열 제거·모바일 승패승점

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 운영 정규리그 순위의 중복 ‘상태’를 제거하고 모바일에 ‘승·패·승점’을 표시하도록 요청했다. 남녀 config의 기존 `showStatus: false`와 새 선택 설정 `mobileStats: wins-losses-points`를 공통 렌더러에서 처리한다. PC의 결과·득실비는 유지하며 모바일 결과는 팀명 아래에 남긴다. 모바일 360/390px에서 표 전체를 가로 이동 없이 표시한다. 다른 대회의 기본 표시와 조별순위, 데이터·MASTER·ID·산식은 보존한다. [검수·범위·복구](validation/vleague-standings-mobile-20261102.md).

## 2026-11-02 · 챔피언결정전까지 자동화 및 PR #227 운영 적용

Status: EXPLICITLY APPROVED / IMPLEMENTED / RELEASE AUTHORIZED. 사용자는 공식 일정·규정으로 챔피언결정전까지 자동화하고 PR #227을 병합하여 실행 종료일, 공시·기사 수집, 대회 운영 묶음 기준을 운영에 적용하도록 명시적으로 지시했다. 병합·배포·실제 실행의 최종 증거는 PR #227에 기록한다. 기존 11월 1일의 정규리그 한정 지원과 4/10 종료 경계를 대체하며 재승인이 필요한 미승인 작업으로 취급하지 않는다.

KOVO 현행 대회개요와 운영요강 제16·18·19조를 직접 검사했다. 남자 준PO 4/6, PO 4/8~12, 챔피언결정전 4/14~22; 여자 준PO 4/5, PO 4/7~11, 챔피언결정전 4/13~21이다. 최종 대조 7일을 포함한 갱신 종료는 **2027-04-30 00:00 KST 미포함**이다. 미확정 경기별 시간·대진은 추정하지 않으며, 공식 발표 후 기존 MASTER의 빈 예약 행에 등록하고 쓰기 후 재조회한다. 정규리그 최종 순위와 조건부 준PO, 시리즈 조기 종료, 전체 시즌 완료를 구분한다. 남은 불필요 차전은 미실시로 보존한다.

기존 운영원칙 MASTER v17의 같은 문서 ID에 전체 시즌 기본 범위를 명시하고 재조회했다. 기존 공식자료 폴더에 확인한 PDF 두 개를 보관했다. 경기 MASTER M254:M271 18개의 빈 포스트시즌 상태 셀에만 미실시 허용값을 추가하고 주변 검증 규칙·실제 값 보존을 확인했다. 선수 MASTER 자동 writer와 미확정 Player_ID는 이번 병합으로 연결되었다고 표시하지 않는다. 출처·검토 후보 수집과 확정 선수 사실 반영은 별도 상태다. 최종 main `5421f0d928af3065d6e998d9a0bc2b4753c3f065`까지 통합하여 PR #228의 모바일 순위표와 PR #229의 모바일 간격·국기·등번호·달력 점수, 기존 명단·공식 ID를 보존한다. [공식 출처·설계·검증·운영 증거](validation/vleague-postseason-automation-20261102.md).

## 2026-11-02 · V-리그 모바일 간격·국적 국기·등번호·달력 결과

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 모바일 정규리그 순위의 다섯 열 간격 통일, 선수명단 POS 왼쪽 국적 국기, 등번호 확대, 종료 경기 달력의 실제 세트 결과를 요청했다. 같은 폭의 순위 열, 기존 국적의 국기 전용 모바일 표시,20px 등번호, 종료+유효 스코어에 한정한 결과 문구로 적용한다. PR #228의 가변 팀 열 배치를 이 범위에서 대체한다. 다른 대회·PC 명단·인쇄·국적 원문·등록 스코어·ID·MASTER는 유지한다. [검수·범위·복구](validation/vleague-mobile-v2-20261102.md).


## 2026-11-02 · 대회 달력을 V-리그 기준으로 공통화

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED; deployment evidence is recorded in the release PR. 사용자가 ‘다른 대회들의 달력’과 국내대회 기본 템플릿을 V-리그 기준으로 맞추되 1경기와 2경기 이상을 구분하도록 요청했다. 현재 달력의 하루 1경기는 실제 단계·대진/확정 점수·장소·KST, 여러 경기는 N경기 요약 후 날짜 팝업의 전체 목록으로 표시한다. 선택 팀 범위도 같은 원칙이다. 날짜 검정/휴일 빨강, 경기일만 음영, 7열 모바일 맞춤, 내부 흰 카드 제거를 공통 컴포넌트로 승격한다. 기존 V-리그 전용 약칭·도시·올스타전은 별도 설정으로 보존한다.

Base main `7ce64bd0177203b1f5110cd5848a52c606f0a51d`: PR #227의 챔피언결정전 자동화·PR #229의 모바일 명단/순위를 포함한다. 공통 Engine의 47개 대회와 기존 AVC 남녀의 달력만 적용하며 전체 AVC 디자인을 이식하지 않는다. 이전 ‘V-리그 달력만 변경’ 및 ‘팀의 여러 경기를 모두 칸에 표시’ 결정을 이 범위에서 대체한다. config/data/MASTER/ID/경기 결과/명단은 보존한다. 신규 공통 템플릿에도 같은 모듈을 연결한다. [표시 계약·출처·검수·복구](validation/competition-calendar-standard-20261102.md).

## 2026-11-02 · 고성·단양 전용 경로 달력 누락 복구

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED; merge·Pages·live 증거는 release PR. 사용자가 대학 고성·단양 달력 누락을 보고했다. PR #230에서 공통 Engine에는 새 달력을 연결했으나 대학 목록이 사용하는 전용 HTML에 필수 JS/CSS를 빠뜨린 회귀였다. 해당 남녀 페이지, 같은 국내 후처리를 쓰는 종합대회 전용 경로와 기존 Cup 시안의 연결을 보완한다. 디자인·데이터·MASTER·ID·공통 엔진은 바꾸지 않는다. 실제 HTML 의존성으로 실행하는 회귀검사를 추가하고 기존 ‘공통 config 검증이면 모든 진입 경로도 검증됐다’는 검수 범위를 바로잡는다. Base `998157da98f99fcea7f0aef3f3052f34b4f0b42f`. [원인·수정·검수·복구](validation/university-calendar-entrypoints-20261102.md).

## 2026-11-02 · 홈 기준 모바일 공통 헤더·홈 이동 및 대회 HERO 채움

Status: REQUESTED / IMPLEMENTED / PREVIEW VERIFIED (기록된 범위) / RELEASE AUTHORIZED; merge·Pages·live 증거는 release PR 및 검수 기록에 남긴다. 사용자가 모바일 상단을 홈 기준으로 통일하고, 헤더 클릭 시 홈페이지로 이동하며 대회 HERO 이미지가 영역을 꽉 채우도록 요청했다. 공통 내비게이션에 58px 네이비 브랜드 바를 추가하고 전체 바를 `/index.html` 링크로 사용한다. 기존 메뉴 버튼은 별도 동작으로 유지하며 홈의 중복 모바일 바만 숨긴다. PC 메뉴·홈 유틸리티는 유지한다.

대회 공통 CSS의 이미지 레이어는 비율을 보존하는 `cover`로 통일한다. 이전 GAMES·종합대회의 `contain`/전체 구도 보존 및 일부 높이만 맞춤·가로세로 강제 맞춤 결정을 이 이미지 표시 범위에서 대체한다. 원본 이미지 바이트·테마색·기존 PC/모바일 자산·데이터·MASTER·ID·명단·경기 결과는 유지하며 기존 AVC의 화면 전체를 다른 템플릿으로 전환하지 않는다. Base main `be0ffe4f13aebdb59ea45d74ce6a816b2168a7d0`이며 PR #233의 고성·단양 달력 복구를 보존한다. 최종 로컬 검수 후 main 재조회에서도 같은 SHA를 확인했다. 모바일 V-리그 남녀·KOVO컵·VNL·아시안게임·대학 고성, 전국체전 900/901px 경계 및 V-리그 1180px PC에서 헤더·이미지 채움·가로 넘침을 검수했다. 고성 전용 경로의 달력 1개와 AVC 여자 전용 디자인의 기존 이미지 채움·새 헤더도 확인했다. 메뉴 열기/Escape, 헤더의 Enter/빈 영역 클릭으로 홈 이동은 preview에서 정상 동작했다. AVC 남자 준비 전 관찰은 완료 검사로 판단하지 않으며 PASS 기록에서 제외한다. 실제 운영 배포·HTTPS 원본 코드 재확인은 후속 증거와 구분한다. [변경·검수 범위·제약·복구](validation/mobile-header-hero-20261102.md).



## 2026-11-02 · 선수 MASTER 연결 1차

Status: USER REQUESTED / IMPLEMENTED / NATIVE CONNECTION OBSERVED / AUTOMATIC WRITE BLOCKED. 사용자가 “선수 MASTER 연결 1차”를 진행하도록 요청했다. 기존 선수 ID 1명에 대한 번호 또는 포지션 사건의 저장·재조회·현재 시즌 명단 연결 범위이며 전체 후보·등록·이적·해지를 일괄 승인한 것이 아니다. 최신 main `cf2ee1aad55c34ff09cb67f32659d1fe941420e5` 및 운영원칙 MASTER v17·실제 남녀 선수 MASTER를 확인했다. PR #234의 공통 모바일 헤더·HERO와 기존 달력·선수 ID·과거 명단을 보존한다.

우리카드 오재성 `KVL-P-001585`의 이름·생년월일·기존 ID·공식157018과 현재 MASTER/운영 사이트의5번 일치를 확인했다. 공식 공시에는 공시일만 있고 명시적 효력일이 없어 승인 사건을 만들지 않는다. 남자 MASTER의 기존 신원검수 L57에 이번 관측 메모를 저장하고, 전용 `KVL_자동반영이력` 탭710020128의22열 헤더만 준비하여 재조회했다. 적용 이력0행·선수값 변경0·현재등록표와 기존 변동이력 보존을 확인했다.

단일 사건 writer·전체 재조회·중복 방지·현재 시즌 export·Pages SHA/공개 바이트 검증을 구현한다. 명시적 효력일, 최신 원문 revision, 정확한 ID와 셀 메타데이터, 전용 저널을 요구하며 비활성 gate에서는 인증·외부 요청·쓰기0이다. 기존 신뢰 workflow 안에 별도 일일 선수 job을 두고 WIF 범위·키·프로젝트 권한을 확장하지 않는다. 선수 MASTER에는 기존 실행계정 공유가 없고, 이를 설정하려던 Google 로그인은 자동 승인 검토에서 특정 계정 인증 권한 부족으로 거부되어 우회하지 않았다. `enabled=false`와 승인0건을 유지한다. 수동 관측·단위검증·코드 배포와 실제 예약 선수값 쓰기 성공은 별도 상태로 기록한다. [검수·근거·복구](validation/player-master-pilot-20261102.md).


## 2026-11-02 · HERO 경로줄 제거·대학 목록 버튼 및 모바일 달력 3줄

Status: REQUESTED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED; 최종 병합·Pages·운영 증거는 release PR에 기록한다. 사용자가 상단 헤더와 HERO 사이 경로줄을 제거하고 대학배구 대회목록을 HERO 우상단 버튼으로 옮기도록 요청했다. 공통 domestic-home 후처리의 경로줄을 제거하고 대학 U-리그·고성·단양 남녀에만 기존 허브로 이동하는 버튼을 제공한다. PR #234의 공통 모바일 헤더와 홈 링크, HERO cover는 보존한다.

모바일 대회내 달력의 단일 경기는 “단계·홈팀 / vs 또는 실제 등록 결과·원정팀 / (확인된 장소, 시간)” 3행으로 통일한다. 긴 팀명은 한 행 말줄임, 장소는 시간 영역을 남겨 줄이고 전체 문구는 접근성 이름/팝업에 유지한다. 종전의 모바일 추가 줄바꿈·말줄임 없음 결정을 이 표시 범위에서 대체한다. 2경기 이상 N경기/팝업과 PC 배치는 유지한다. Base main `dfad9ca877cff9e53cd5ce0c066002113eae73fb`의 선수 MASTER 작업과 공시 갱신을 보존하며 config/data/MASTER/ID/점수/명단은 변경하지 않는다. [표시 계약·검수·제약·복구](validation/mobile-hero-navigation-calendar-20261102.md).
## 2026-11-02 · 선수 MASTER 편집자 공유 확인과 읽기 진단

Status: EDITOR SHARING VERIFIED / RUNTIME READ PENDING / AUTOMATIC WRITE DISABLED. 사용자가 남자부 선수 MASTER 공유를 완료했다. 20:30 KST native Drive 권한 재조회에서 기존 실행계정의 writer 권한과 두 헤더 행의 일치를 확인했다. 앞선 공유 미설정 상태는 현재 권한 관측으로 대체하며 당시 기록은 보존한다. 실제 서비스계정 읽기를 증명하려고 기존 신뢰 V-리그 workflow에 수동 읽기 전용 진단을 추가한다. 진단 시 기존 경기·선수 쓰기 작업은 제외하고 고정된 한 문서의 metadata·헤더35셀만 Sheets readonly scope로 조회한다. 기존 WIF·키·프로젝트 IAM을 확장하지 않는다. 자동 쓰기는 disabled, 공식 효력일은 미확정이며 이번 확인으로 사건을 승인하지 않는다. Base main `0f02f6b35d939c7a7e63d8ea375031a11baf091a`; PR236 표시 변경을 보존한다. [공유 확인·수동 실행·제약](validation/player-master-access-20261102.md).


## 2026-11-02 · 대학·V리그 한눈에 보기의 조별·정규리그 선두 카드

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED; 최종 회귀·감사 gate와 병합·Pages·실제 HTTPS 확인은 release PR에 기록한다. 사용자는 참가팀 수와 중복되는 순위 카드의 개선을 요청했고, 대학은 각 조 선두, V리그는 현재 1위와 승점을 보여주며 기존 조편성/순위 페이지로 연결하는 제안에 “진행해”라고 승인했다. 기존 해당 두 유형의 조 수/팀 수 요약 결정을 이 범위에서 대체한다. 참가팀·등록 경기·장소 카드와 기존 이동 구조는 유지한다.

대학은 예선만 사용하고 U리그 후속6강리그·대회 우승과 구분한다. 조가 없는 여자U리그는 예선1위로 표시한다. V리그는 공식 정규리그 순위의 기존 rank1을 읽으며 승점으로 재정렬하지 않는다. 시작 전·진행 중·예선/정규리그 완료·순위 확인 중을 구분하고, 경기수/결과 불일치·복수1위·명시적 미검증 자료로 선두를 추정하지 않는다. 연기 경기는 예선 종료 판정에 미완료로 남긴다. 데이터 내용 변경 시각에 임의의TTL을 걸지 않는다.

Base main `0f02f6b35d939c7a7e63d8ea375031a11baf091a`이며 PR #236의 헤더·HERO·대학 목록 버튼·모바일 달력3줄을 보존한다. 새 표시의 대상은 대학ID/family와 pro V리그이며 KOVO컵·학교·종합·VNL·AVC는 기존 카드를 유지한다. config/data/MASTER/ID/명단/원본이미지/순위산식/자동화는 변경하지 않는다. Google 운영원칙 MASTER v17과 기존 공개 데이터/검증 경로를 확인했고 외부 결과를 새로 수집하거나 MASTER를 쓴 것으로 표시하지 않는다. [표시·근거·검수·복구](validation/overview-standing-cards-20261102.md).

## 2026-11-02 · 홈 경기 일정·결과 남녀 동시 표시

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED; 병합·Pages·운영 증거는 release PR에 기록한다. 사용자가 기존 두 카드 안에 남녀의 최근 결과와 다음 경기를 함께 넣는 제안에 진행을 요청하고 모바일 가독성을 강조했다. 기존 홈의 두 흰색 카드를 최근 결과/다음 경기로 유지하고 각 카드에 남자부·여자부 한 경기씩 표시한다. 여자 라벨은 공통 Rose, 스코어는 중립색이며 모바일 팀명14px·스코어28px와 세로 흐름을 적용한다. 기존 남자 3개 feed에 대응 여자 3개만 연결하고 명시적 결과 검수 조건·원본 점수/ID/MASTER·홈 검색/메뉴·Hero를 보존한다. 기록 조회 실패와 일정 없음은 구분하며 각 경기에서 실제 대회/날짜 경로로 이동한다. Initial base `3dd01417357aec3830a206ebfffbe138e7d16b34`; release base `2145e2069b2904ccd554c1056325d4063d7e9d6c`의 PR #238 요약 카드 개선까지 보존한다. [출처·검수·범위·복구](validation/home-gender-matches-20261102.md).

## 2026-11-02 · 선수 MASTER 실제 읽기 진단 성공

Status: EDITOR SHARING VERIFIED / RUNTIME METADATA AND HEADERS VERIFIED / AUTOMATIC WRITE DISABLED. 사용자가 요청된 진단을 실행했고 [Actions #26](https://github.com/kvolleylab/kvolleylab/actions/runs/41444659754)이 21:26:17 KST 성공했다. 실행 SHA는 `e97256be78f77de3e3e60e671d3caaa601825ea2`, attempt1이다. 실제 인증·GET 로그와 다운로드한 report의 내용·해시를 확인했다. `READ_ACCESS_VERIFIED`, metadata/header 일치, no_data_written=true, write_access_tested=false이며 기존 다섯 job은 모두 건너뛰었다. 남자 MASTER metadata와 헤더35셀 접근에 한정한다.

앞선 runtime 읽기 미확인 상태를 이 실행 증거로 대체한다. pilot은 `enabled=false`, `event_scope=null`, `BLOCKED_EFFECTIVE_DATE`로 유지하고 해결된 접근 차단 사유만 제거한다. 공식 효력일·사건 승인·선수 행·여자 MASTER·실제 쓰기·쓰기 후 재조회·자동 게시 완료로 확대하지 않는다. 기존 native 관측 시각과 과거 연결 기록을 보존한다. 기준 main은 실행 SHA와 같으며 PR #238/#239의 표시 작업을 보존한다. [실행 증거·범위·해시·남은 조건](validation/player-master-access-20261102.md).


## 2026-11-03 · 현재값 확인 기록 채택과 오재성 첫 검증

Status: POLICY APPROVED / FIRST NATIVE RECORD VERIFIED / MANUAL IMPLEMENTATION READY FOR REVIEW / GITHUB WRITE NOT EXECUTED / NOT DEPLOYED. 사용자가 “현재값 확인 기록”을 별도로 도입하고 오재성 1명부터 검증하도록 명시했다. 이 승인은 첫 확인 기록의 생성·검증 범위이며, 선수값 변경·전체 선수 확대·새 예약 실행·운영 코드 병합 승인으로 확대하지 않는다. 기존 Google 운영원칙을 같은 문서 ID의 v18로 개정하고 11-3-1절·현재값과 사건의 구분·원문과 시각·첫 범위·변경 이력을 재조회했다.

공식 공시157018·우리카드 현재명단·선수0001550 상세·현재 시즌과 시즌 목록을 조회해 기존 KVL-P-001585/우리카드/남자2026–27/번호5 및 신원 보조값 L을 대조했다. 현재명단의 시즌 필드·명시 기준 시각과 실제 변경 효력일은 없으므로 공식 현재 시즌 맥락만 인정하고 effective_date/source_as_of=null을 보존한다. 현재등록 원본의 날짜 표기를 바꾸지 않는다.

기존 남자 MASTER의 별도 KVL_현재값확인 26열 탭에 native 실행 native-20261103-oh-current-v1의 한 행을 01:02 KST 저장했다. 실제 재조회에서 선수값 변경0셀·지정 현재등록 범위 보존·기존 적용 이력 보존을 확인했다. 동일 실행으로 공식 자료를 다시 조회한 재시도는 already_verified·추가0행이며 원래 관측·검토 시각을 보존한다. 공개 영수증에서 비공개 MASTER 파생 계획 hash를 제외하고 최초 저장 기록과 이번 재조회 시각을 분리했다.

GitHub는 기존 workflow의 player_current_value_check 수동 입력으로 같은 범위를 구현한다. 새 모드에서 기존 다른 job을 제외하고 기존 WIF·계정·기간을 사용한다. 실제 GitHub 선수 행 읽기·확인 기록 쓰기·재조회는 아직 실행하지 않았다. 기존 pilot은 enabled=false/event_scope=null/BLOCKED_EFFECTIVE_DATE, 승인 사건0건을 유지한다. base56006570b078266470765b991fb81ade68abaa3d, [PR #241](https://github.com/kvolleylab/kvolleylab/pull/241). [승인 기준](proposals/player-current-value-policy-v1.md) · [실제 검증·제약·복구·후속 실행](validation/player-current-value-20261103.md).


## 2026-11-03 · 홈·V-리그 기존 칸에 오늘 경기 유지

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED; 병합·Pages·운영 화면의 최종 증거는 release PR에서 확인한다. 사용자는 오늘 경기가 최근/다음 사이에서 사라지는 문제와 15분 점수 확인 불가를 지적했고, 별도 구역 추가는 PC/모바일 공간을 차지하므로 기존 두 칸을 유지하는 제안에 “그렇게 만들어줘”라고 요청했다. 오늘 경기는 기존 다음 칸에서 KST 당일 경기 전·진행·종료까지 유지한다. 최근 결과는 오늘 이전의 확정 결과, 오늘 없으면 기존 다음 일정을 표시한다. 남녀는 독립이며 중복 없이 다음 날 자동 전환한다. 이전 홈·대회 요약의 ‘진행 중 제외/시작 시각 이후 다음 경기 제외’ 결정을 이 표시 범위에서 대체한다.

공식 일정 수집에서 이미 확인하는 세트 승수만 별도 liveScore와 실제 관측 시각으로 연결한다. 최종 score/승패/순위/선수값과 분리하고 경기 연결·공식 출처·관측 시각을 검증한다. 갱신 지연과 상태 미확인을 구분하며 포인트·현재 세트 번호를 추정하지 않는다. 기존 수집 주기·MASTER 게시 gate·ID·명단·달력·검색·메뉴를 보존한다. 진행 중에만 실제 관측 시각 갱신을 허용하고 동일 관측은 변경0이다.

Initial base `f7d51ee1264b8f2811fef618e4f01f597acdb154`, release base `f70e3d1271e8c49f0e2cf2b64e258444e46cc70c`: 기존 자동화가 게시한 오늘 실제 남녀 결과를 보존한다. 실제 경기 MASTER를 읽었으며 수동 결과 쓰기는 하지 않았다. 실패했던 기존 예약 실행41621555027의 failed-jobs 재실행은 공식 수집·MASTER 재조회·Pages 공개 검증까지 성공했다. 실제 진행 중 관측을 이번 세션에서 완료했다고 확대하지 않는다. [표시 계약·테스트·복구·제약](validation/today-match-summary-20261103.md).

## 2026-11-04 · 검수된 연도별 국제대회 허브 운영 연결

사용자가 검토 Site v3의 홈페이지 반영을 승인했다. 베이스 main은 `4d115851ebec134f90c2547e488410bb4f76d26c`, 검토 원본은 PR #246의 `08a169f341626e8f2711631883442ca9a5498024`다. 기존 `international-competition-senior-national-team.html` 경로에서 국제대회 HERO, 다음 개최 문구가 있는 6개 카테고리, 2026 최근3개와 과거 연도 기록을 표시한다. 같은 경로에서 카테고리 선택·해제, 연도 전체보기, 새로고침을 처리한다. 메뉴 활성화는 공통 내비게이션이 담당하고 대회 링크는 기존 registry의 상대 URL을 사용한다. 기존 대회 원본·Competition Engine·MASTER는 보존한다.

운영 경로를 사용한 사전 검수에서 데이터/라우팅 테스트6개와 등록5건의 대상 파일을 확인했다. 브라우저에서 1180px 6열/최근3개, 390·360px 3열×2행/최근1열, 동등한 카드 높이와 가로 넘침0, VNL 필터를 유지하는 전체보기와 기존 상세 링크를 확인했다. 실제 배포는 운영 PR의 병합 및 Pages 실행 결과로 구분한다. 복구는 이 운영 연결 커밋 revert로 한정한다.

## 2026-11-04 · 배구 대회 통합 달력 운영 반영

사용자가 검토한 달력을 운영 홈페이지에 반영하도록 승인했다. 운영 베이스는 `3080d60acf1a629e39b7ed80f39ab9ab754fc5cd`, 일정과 디자인 검토 원본은 PR #243이다. 기존 `competition-calendar.html` 주소에 연간·월간 보기, 성별·대회 필터, 기간·장소 표시와 확인된 추가 일정 13건을 연결한다. 2026년에는 기존 일정을 포함해 39건이다. 연도 경계를 넘는 시즌은 해당 연도의 날짜까지만 표시한다.

남자 V-리그 막대는 연한 차콜로, 여자부는 밝은 분홍으로 표시한다. 분류 버튼의 점은 국제 빨강, 국내 파랑, V-리그 검정이다. 메인카드 위의 브랜드 헤더는 홈으로 연결한다. 900px 이하에서는 다른 대회 페이지와 같은 공통 모바일 헤더를 사용한다. 360·390·900·901·1440px에서 홈 링크가 한 줄만 보이고 로고가 표시되며 가로 넘침이 없음을 확인했다. 공개 배포와 운영 확인은 릴리스 PR에서 추적한다. 복구하려면 운영 반영 커밋을 revert한다.

## 2026-11-05 · 통합달력의 대회 링크와 외부 출처 분리

운영 베이스 `e2aa8903ea81e9ca8fa4858a449a7fb5dddae24b`. 2025–26 V-리그 등에서 모바일 두 번째 터치가 대회 기간의 근거 기사로 이동하는 문제를 수정한다. 막대를 처음 누르면 기존 말풍선을 표시한다. 다시 누르면 KVL 대회 페이지 또는 선택한 기간의 월간 달력 상세 카드로 연결한다. 외부 URL은 별도의 ‘일정 출처 보기 (외부)’ 링크로 구분한다. 서일본 대학 선발대회에는 기존 KVL 경기결과 페이지를 연결한다. 원본 일정과 출처 데이터는 그대로 사용한다. 2026년 39건의 막대 목적지와 모바일 이전 시즌 남녀부 동작을 검사했다. 복구 범위는 이 링크 수정 커밋이다.

## 2026-11-05 · 통합달력 막대와 날짜의 선택 동작 구분

사용자 승인 요청에 따라 모바일 막대의 첫 터치는 말풍선을 열고, 같은 막대의 두 번째 터치는 닫는다. 말풍선 안의 링크는 해당 KVL 대회 페이지로 이동한다. PC에서는 기존 hover 정보를 유지하고 막대 클릭으로 대회 페이지를 연다. 이는 같은 날짜의 이전 ‘두 번째 터치로 이동’ 결정을 대체한다. 별도 대회 페이지가 없는 기존 시즌은 외부 기사가 아닌 기존 달력 상세 카드로 연결한다.

연간·월간 보기 모두 날짜 숫자와 빈 날짜 영역을 누르면 V-리그에서 사용하는 상세창과 경기 카드로 해당 날짜의 대회·등록 경기를 표시한다. 현재 분류·성별 필터, 경기의 한국 날짜, 등록 세트 점수와 경기장을 보존한다. 기존 대회별 공개 JSON과 AVC 컵 부속 결과 자료를 읽으며 원본 데이터를 변경하지 않는다. 자료 실패·등록 경기 없음·기간만 확인됨을 구분한다. 기간 중 매일 경기가 있다고 추정하지 않는다.

Base `a50b3d894015f2a156ce6341ca60b580fbd3196f`. 상태: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED; 운영 배포는 릴리스 PR의 Pages 성공과 공개 파일 확인으로 추적한다. 변경 파일, 검증과 복구는 [검증 기록](validation/calendar-day-interactions-20261105.md)에 남긴다.

여자 VNL과 아시안게임 남녀·CBS배는 현재 등록된 개별 대회 페이지로 이동 경로를 보정한다. 원본 일정의 근거 링크는 변경하지 않는다. CBS배 여자부 선택 시 여자고등부로 진입한다.

## 2026-11-06 — V-League live recovery candidate (#257 / #259)

Status: **IMPLEMENTED / LOCAL QA VERIFIED / NOT DEPLOYED**. Owner requested isolated fixes and review before production deployment. Shared live-score rendering now includes certified completed-set points and a KST observation timestamp; stale scores at 30 minutes are explicitly historical. Added an inert Cloudflare wake-up/watchdog implementation that invokes the existing approved publisher and preserves MASTER/roster identity gates. No activation, merge or deployment is authorized by this entry. Actual two-cycle live acceptance remains open; see [evidence and release gate](validation/vleague-live-recovery-20261106/REPORT.md).

## 2026-11-09 · 국가대표팀 홈 v2 운영 적용 승인

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 사용자가 v2를 실제 홈페이지에 반영하도록 명시적으로 승인했다. 시안 PR #274의 디자인·데이터 기준을 기존 `national-team.html` 주소로 옮기며, 운영 PR에서 병합·Pages·실제 화면 검증을 기록한다.

2026 출전대회 최종 성적을 우선하고 LA28 로드맵·공식 랭킹 스냅샷을 함께 전환한다. 공통 메뉴·HERO·1180px·카드·색상 체계를 유지하고 기존 선수 ID/MASTER·명단·대회 DB·자동화는 보존한다. 최신 main `2190b137d9e2682005ec922333b2ecbb2d38ae8f` 기반의 별도 운영 변경이며 prototype 폴더를 main에 옮기지 않는다. [변경 범위·검수·출처·복구](validation/national-team-home-v2-production-20261109.md).

## 2026-11-10 · Worker redirect runtime compatibility repair

Status: IMPLEMENTED / LOCAL RUNTIME VERIFIED / NOT DEPLOYED. User requested repair
following the 20:23 live failure diagnosis. On base94ac61db…, local workerd reproduced
unsupported redirect:error failing before GitHub requests. Replace with manual plus
non-2xx rejection, preserve credentials' destination and add sanitized failure categories.
No approval gates, tokens, schedules, MASTER or match/player data changed. Real Cloudflare
redeployment and two consecutive live full-path observations remain required.
[Evidence and release instructions](validation/vleague-worker-redirect-20261110.md).

## 2026-11-11 · Isolate match publication from player identity validation

Status: USER REQUESTED REPAIR / IMPLEMENTED / MATCH QA PASSED / NOT DEPLOYED.
After #286, real publisher runs failed before official collection because player
identity tests were in the recurring match gate. Retain roster rendering in that
gate, move player identity validation to its existing player/Cup CI, and require
it before any activated player pilot authenticates. Recognize the new pro MASTER
without concealing cross-source ID collisions. Do not reassign IDs, modify rosters,
MASTERs, international or Cup records, or claim that player integrity is repaired.
Existing match source/readback/allowlist/Pages guards remain mandatory. The concrete
release requires approval; no further Worker deployment is needed for this scope.
Base99d4fc29; [cause, validation, remaining conflicts and release gate](validation/vleague-publisher-isolation-20261111.md).

## 2026-11-13 · Preserve verified partial sets and await the official end marker

Status: USER REQUESTED REPAIR / IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED.
On base `b6f8537b`, retain independently verified same-game completed-set points
when later points are missing, and represent three-set wins without an official
end marker as provisional `종료 확인 중`. Final-result and standings gates remain
strict; 30-minute stale observations remain historical. User-approved cadence is
approximately 20 minutes. Worker configuration and protected data are unchanged.
345 regression tests and six actual-candidate DOM tests passed; a read-only
252-match official/MASTER comparison required no data changes. Production approval
and two consecutive actual live full-path observations are still required.
[Incident, scope, evidence and release gate](validation/vleague-partial-observations-v1.md).

## 2026-11-14 · Supplement missing completed live-set points from official broadcast

Status: USER REQUESTED REPAIR / IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED.
On base `aa517e887`, add bounded anonymous KOVO `/stat/real-time` reads only when
today's regular-season schedule lacks completed-set points. Verify exact game
identity, both sources' win counters and legal terminal points. Keep schedule
wins/final markers/standings authoritative; unavailable or conflicting extra
data cannot block valid schedule publication. Preserve source/timestamps and
retain sanitized point/decision evidence in check/publish artifacts. No Worker,
cron, protected data or UI redesign. Approximately20-minute cadence and30-minute
stale rule remain. New production approval and two consecutive actual live
end-to-end checks are still required. #325's historical NOT DEPLOYED note above
was superseded by its approved merge452628249 and Pages43373473979 on11/13;
this new supplement is not included in that earlier approval.
[Contract, validation and release gate](validation/vleague-live-set-points-v1.md).

## 2026-11-14 · 대학배구 과거 확정 결과 홈페이지 운영 반영 승인

Status: USER APPROVED / RELEASE AUTHORIZED / IMPLEMENTED IN ISOLATED PR. 사용자가 "확정된 부분에서는 홈페이지에 반영해"를 승인했다. 선행 PR #327의 전체 미검증 초안은 운영에 합치지 않고, main `6d3ba0ddc7334c54095e779955c6e76c2b62a6f3` 기준 독립 릴리스 브랜치 `feature/university-verified-archive-release-20261114`에서 공식·학교·지자체 출처로 확인된 대학배구 과거 결과만 연결한다. 과거 27대회·순위 147개(기존 2024/25 6대회·48개 순위 불변), 2013~2023 U-리그 공식 남녀 1·2위, 2018 청양 및 2019~2023 연맹대회 선별 결과를 포함한다. **2018 해남은 독립 검증 부족으로 운영 제외**, 2020 무안 남자부는 최종 순위 미확정으로 비워 두고 여자부 결과만 공개한다. 연도별 선택 및 아코디언은 아카이브 데이터에서 자동 생성한다. 기존 2026 대회 카드 3개, HERO·메뉴·상세 엔진·선수/경기 MASTER·V-리그 실경기 자동화는 변경하지 않는다. GitHub Actions QA·Pages 배포와 운영 확인 전에는 DEPLOYED로 표시하지 않으며 PR #327은 잔여 조사용 Draft로 유지한다. [출처·검수·배포 및 복구](validation/university-historical-release-20261114.md).


## 2026-11-15 · Compact live completed-set points in schedule rows

Status: USER REQUESTED FIX / IMPLEMENTED IN ISOLATED BRANCH / DOM QA PASSED / NOT DEPLOYED.
User reported overlapping first/second-set labels in the Woori Card–Hyundai Capital
live schedule. Base `d12347123c680a09c64607f2d89c881e16fc3ed1`. The existing PC
schedule reserves five point cells within 285px; visible `1세트 20-25` exceeds
a cell's width. Render live completed-set points as `20-25`, matching finished
rows, and preserve the set number in title/aria-label. Applies to men's/women's
schedule and team-result rows; summary cards and the shared CSS stay unchanged.
Bump the production engine script URL to invalidate the cached renderer.
No source, score, ID, MASTER, roster, standings, Worker or cron changes.
37 regression tests plus six DOM checks against the actual published JSON passed.
These are not pixel-layout or continuous live acceptance evidence. Candidate
browser access to the local preview returned ERR_CONNECTION_REFUSED; actual
1440/390/360 layout verification and production approval/deployment remain pending.
Rollback is a revert of this display-only change. Release evidence belongs in its PR.

## 2026-11-16 · Draft Hub 목록 기본값 및 대표팀 AVC 카드 강조 범위

Status: USER REQUESTED / IMPLEMENTED IN ISOLATED BRANCH / STATIC QA VERIFIED / NOT DEPLOYED. 사용자는 `선수·팀 → Draft Hub`에 들어갈 때 선수 명단을 먼저 목록형으로 표시하도록 요청했다. 기본 `layout`만 `cards`에서 `table`로 바꾸며 명시적인 카드·간편 보기 URL, 목록 전환 버튼, 필터·검색·공식 명단 순, 남녀부·모바일을 유지한다.

`대표팀 홈 → 2026 출전대회`에서는 AVC컵 카드의 상단 녹색 강조를 개최지·최종 순위 영역 아래까지 연한 녹색 그라데이션으로 확장한다. 동일 AVC 카드에 일관 적용한다. LA28/월드컵 출전권 안내와 하단 링크는 흰 배경으로 남기며 마우스 hover 또는 키보드 focus 시 강조 영역은 금색, 기존 금색 테두리 hover도 유지한다. 아시안게임 색상은 변경하지 않는다. 자료·MASTER·명단·경기결과·내비게이션·자동화는 변경하지 않는다.

Base `811f270f3dddc04bb0df0e5ed14ddb9ba1b11c07`; isolated branch `fix/draft-list-national-tournament-tint-20261116`. 검증·미실시 브라우저 항목·복구: [검증 기록](validation/draft-list-national-team-card-tint-20261116.md). 운영 배포에는 별도 승인과 Pages·실화면 검증이 필요하다.

## 2026-11-16 · 대표팀 출전대회 카드 대회군 단색 강조 (이전 그라데이션 결정 대체)

Status: USER CORRECTION / IMPLEMENTED IN ISOLATED BRANCH / STATIC QA VERIFIED / NOT DEPLOYED. 최신 사용자는 PR #339의 연녹색 그림자/그라데이션 적용이 의도와 다르다고 정정했다. 실제 의도는 상단 3px 대회군 고유 색상을 **대회명, 기간·개최지, 최종 순위가 있는 전체 상단 정보 영역에 꽉 차는 단색 배경**으로 적용하는 것이다. 상단 별도 색 띠는 제거한다. AVC 계열은 기존 진녹색 `#176638`, 아이치·나고야 아시안게임은 기존 붉은색 `#8c2934`을 사용한다. 흰 글자로 대비를 유지하고 마우스 hover/키보드 focus 시 골드 `#d6b25e`로 전환한다. LA28/월드컵 출전권 안내와 하단 링크는 흰 배경(별도의 출전권 획득 강조 규칙은 그대로)으로 구분한다. 여자대표팀과 PC·모바일에도 같은 규칙이다. 이 결정은 같은 날 앞선 결정 로그의 `얕은 연녹색 그라데이션`과 `아시안게임 색상 변경 없음` 부분을 대체하며, Draft Hub 목록 기본값과 선행 PR #339의 그 외 내용은 유지한다.

Base `0cc1e348d06cca495b6593b111e9a9ad4ac0b7fd`; isolated branch `fix/national-team-solid-family-cards-20261116`. 검증·운영 승인 게이트·복구: [검증 기록](validation/national-team-solid-family-cards-20261116.md). PR #339는 2026-11-16 13:59Z Pages 배포 성공, 본 수정은 승인 전이므로 운영 미반영.


## 2026-11-16 · 올림픽 출전권 요약·남자대표팀 역사 로드맵 운영 연결 승인

Status: USER APPROVED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA PASSED. 사용자가 “운영 연결단계진행해”를 명시했다. 승인된 통합 프로토타입을 `/olympic-roadmap.html`로 운영 연결하고 대표팀 홈의 남자 ROAD TO LA28 하단에서 진입한다. 여자대표팀은 기존 `/la28-volleyball-qualification.html` 안내를 유지한다. 기존 LA28 URL과 내용은 변경하지 않는다. 62개 역사 기록·출처·미확인 목록 및 로드맵 디자인·동작을 보존하고, 올림픽 주기 JSON과 역사 JSON을 분리한다. 2032 미발표 규정에는 배정 숫자를 노출하지 않으며 관리자 검증·공식 최종 결과 없이 주기 전환을 허용하지 않는다.

Base `ff587a18f7878ef984d72b71d6bd1700f25426ca`. 원본 `6cedb89b517e977309416fafd71597692f82cfb8`, 통합 시안 `ce566a591394788a4100db5fd9c0fe807e256e8c`. 당일 최신 대표팀 카드 단색 스타일과 Draft Hub 변경을 유지한다. Node 18개 및 PC·390/360px 브라우저 검증 통과. 병합·Pages·실제 운영 확인 전에는 DEPLOYED로 표시하지 않으며 최종 증거는 운영 연결 PR에 남긴다. [검증 및 한계](validation/olympic-roadmap-production-v1.md), [운영·전환·복구](KVL_OLYMPIC_ROADMAP_OPERATIONS_v1.md).


## 2026-11-17 · 올림픽·대표팀 로드맵 공통 메뉴 연결 보정

Status: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA PASSED. 운영 연결 승인 후 사용자가 홈페이지와 연결이 자연스럽지 않다고 지적했다. 실제 대표팀 홈에서 로드맵으로 이동하면 공통 왼쪽 메뉴·모바일 브랜드 바·로그인이 별도 가로 헤더로 바뀌는 문제를 확인했다. 기존 공통 내비게이션을 로드맵과 검증 페이지에 적용하고, 국가대표팀 하위 메뉴 및 남자대표팀 상단 LA28 현황에서 직접 진입하도록 보정한다. 2026-11-16 운영 문서의 별도 소형 헤더 사용 방침을 대체한다. 로드맵 내부 글꼴·행 높이·색상·필터·62개 기록·주기 설정 및 여자부 기존 경로는 유지한다. Base `196d72ea3727c5f0515462f2a0f048b3fba68bd5`. 기존 Node 18개와 PC/모바일 브라우저 검증 통과. 병합·Pages·실제 운영 검증은 수정 PR에서 기록한다. [확인한 문제·검증·복구](validation/olympic-roadmap-site-connection-v1.md).


## 2026-11-17 · LA28 요약 카드 대회 바로가기 복원

Status: USER CORRECTION / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA PASSED. 사용자가 기존 출전권 한눈에 보기에서 대륙선수권·올림픽 등 대회로 연결되던 기능 누락을 지적했다. 통합 시 단순 정보 카드로 바뀌고 상세 영역에만 남았던 대륙선수권·월드컵·랭킹 링크를 카드 전체에 복원한다. 개최국 카드는 확인된 LA28 공식 실내배구 대회 안내로 연결한다. 내부 대회는 같은 탭에서 이동하고 대회 페이지 상단에서 해당 LA28 통합 로드맵으로 돌아온다. 원래 상세 규정·출처·관련 대회 링크는 모두 유지한다.

Base `816f963e4856e5f96f4bf76bd66ccfb9f07f81c9`; branch `fix/olympic-summary-competition-links-v1`. 주기별 JSON에 선택적 링크를 저장하며 2032에 LA28 링크·숫자를 재사용하지 않는다. 역사 62개와 로드맵 디자인·필터·데이터, 기존 LA28 URL 및 규정 원문은 변경하지 않는다. 기존 18개 검증 및 PC/390/360px 브라우저 이동 확인 통과. 운영 연결 승인에 따른 보정이며 병합·Pages·운영 확인 결과는 PR에 남긴다. [검증·변경 범위·복구](validation/olympic-summary-competition-links-v1.md).


## 2026-11-17 · KOVO 공시 → 팀 최신 명단 GitHub 자동 게시

Status: USER AUTHORIZED / DEPLOYED VERIFIED. 사용자가 최신 팀 명단 자동화는 GPT가 아닌 GitHub에서 수행하고, 집중기간 1시간·시즌 중 3시간·비시즌 하루 1회 주기로 운영하도록 요청했다. 기존 KOVO 공식 공시 수집기의 `registration_rows/change_events → roster_projection/review_queue` 경로 뒤에 안전한 시즌 roster publisher를 연결한다. cron은 매시간 13분에 실행하되 최근 14일 변동 유무와 시즌 상태에 따라 실제 수집 주기를 자동 선택한다. 신규 공식 등록은 Player_ID가 없어도 현재 명단에 제한적으로 표시할 수 있으나 ID를 생성하지 않는다. 삭제는 applied high-confidence 비활성 이벤트가 있을 때만 허용하며 blocked 공시와 연결된 기존 선수는 마지막 검증 상태로 보존한다. 시즌 종료 후에는 공시는 하루 1회 모니터링하지만 종료 시즌 roster는 수정하지 않고 다음 시즌 baseline/currentSeason 전환을 요구한다. roster 변경 commit은 Pages build와 공개 JSON readback까지 검증한다. 2026-11-17 운영 run #46(`44055769916`)에서 최신 공시 projection 286명 + blocked 검토 보존 1명 = 게시 287명을 생성했고, commit `8d7109e2adc296021558852951a4ae7d81e1fd52`에 대해 Pages build 요청과 남녀 roster exact public readback이 모두 성공했다. 배포 artifact의 `public-readback.json` 상태는 `DEPLOYED_VERIFIED`이며 남자 149명·여자 138명이다. 세부 기준은 `docs/KVL_TEAM_ROSTER_AUTOMATION_v1.md`.


## 2026-11-18 · Repair match publisher after current roster growth

Status: USER REQUESTED REPAIR / IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED.
On base `fa485c6e`, current approved roster additions made the recurring UI gate
compare22/19 players against old19/17 counts, preventing official match collection
in18consecutive11/17evening runs. Validate actual roster module identities, links,
known flags and full print output, with addition/removal regressions; display the
actual loaded roster count without modifying any player data. Preserve all source,
MASTER, score, approval, stale and separate identity-validation safeguards. No
Worker or cron changes. Local265Python+101Node+6actual-candidate DOM tests pass;
actual MASTER plan8cells, no write/deployment. New production approval and actual
publisher/readback/Pages/live verification remain required.
[Evidence, limits and release gate](validation/vleague-roster-gate-recovery-v1.md).

## 2026-11-18 · LA28 요약 배경·총 출전권 표시 및 경로줄 제거

Status: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA PASSED. 사용자가 국가대표팀 메뉴의 올림픽·대표팀 로드맵에서 국제대회 메인 HERO 이미지를 출전권 요약 배경에 재사용하고, 별도 상단 경로줄을 제거하며, 현재 올림픽 배지를 총 출전권으로 바꾸도록 요청했다. 국제대회 운영 WebP PC/mobile 두 파일을 동일 경로로 참조하고 원본 바이트·국제대회 화면은 변경하지 않는다. 요약 제목/배정 카드/한국 현황까지만 이미지 배경이며 펼친 규정과 공식 출처는 흰 바탕을 유지한다.

상단 배지는 검증된 주기 데이터의 totalPerGender에서 ‘남녀 각각 총 12장’을 표시한다. 2032 규정 미발표에는 ‘규정 발표 전’이며 숫자를 대입하지 않는다. 이전에 추가한 페이지 전용 경로줄만 제거하고 공통 메뉴·대회 링크·62개 역사 기록·하단 로드맵 디자인/동작은 보존한다. 이번 지시는 기존의 새 HERO 생성 금지 원칙과 충돌하지 않는 운영 이미지 재사용이다.

Base `aede0c23df1bcff61eaf19b0ca084b68c54d4c82`; branch `fix/olympic-summary-arena-v1`. 기존 Node 18/18, PC 및 모바일 390/360px 이미지/배지/넘침, 대회 왕복, 실패 필터, 연도 접기, 2032 미확정 표시 확인. 병합·Pages·운영 검증은 PR에 기록한다. [검증·출처·복구](validation/olympic-summary-arena-v1.md).


## 2026-11-18 · 대륙선수권 우승국·올림픽 출전국 간편 연결

Status: USER APPROVED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA VERIFIED. 사용자가 승인한 시안에 이어 “오케이 홈페이지에 삽입해”로 운영 반영을 승인했다. `올림픽·대표팀 로드맵`의 `2026 대륙선수권 5장`을 누르면 요약 내부에서 남녀 5개 대륙의 우승국과 LA28 대륙 출전권 확보국을 확인한다. 각 행은 기존 대회로 연결하며 상세에서 돌아올 때 성별을 보존한다.

남자 NORCECA는 미국이 대륙선수권 우승, 쿠바가 별도 결정전 출전권 확보다. 개최국 미국과 대륙 배정 1장을 중복 계산하지 않는다. 여자 NORCECA도 우승과 별도 결정전 결과를 독립 필드·출처로 보존한다. FIVB 12건 근거의 결과 JSON을 요약·기존 대륙 허브·상세가 공동 참조한다. 종료 대회의 ‘발표 대기’ 문구는 정정하되 미수록 로스터/경기 DB를 완료 또는 불참으로 간주하지 않는다. 기존 ID, 62개 역사 기록, 하단 디자인/필터/접기·펼치기, 2032 규정 미발표 처리, 기존 URL과 메뉴를 보존한다. 새 HERO·새 대회 페이지·자동화는 추가하지 않는다.

Base `6f1d6bf6cd2975ac6d9fa68912e8318b36cc5cd3`; branch `feature/continental-winners-inline-v1`. 승인 시안 commit `9235092ecc63a704c5354f753ef36a45954ac1e2`. Node 25/25, PC·모바일 390px, 남녀 이동/복귀와 기존 허브 연결 확인. 병합·Pages·운영 확인 전까지 DEPLOYED로 표시하지 않으며 최종 증거는 PR에 기록한다. [검증·한계·복구](validation/continental-winners-inline-v1.md).


## 2026-11-22 · 팀 찾기 선수명단 공통 규격 운영 반영 승인

Status: USER APPROVED / RELEASE AUTHORIZED / IMPLEMENTED / STATIC QA PASSED / NOT YET DEPLOYED. 사용자는 현재 운영 중인 `teams.html`의 팀 카드·분류·`선수명단 보기` 위치와 디자인을 유지하고, 펼쳐지는 선수명단 영역만 공통 규격으로 정리하는 시안을 승인해 “홈페이지에 반영하자”고 지시했다.

공통 요약은 선수 인원·평균 신장·관심선수·메모선수 4개다. 프로는 KOVO 공시 자동 갱신 현재명단을 그대로 사용하며 빠른 목록을 `NO. / 선수명 / POS / 생년월일 / 신장`으로 통일한다. 국제는 목록에서 한글 선수명을 우선하고, 소속팀·국가·리그도 검증된 한국어 표시명을 우선한다. 국기는 소속팀명 옆, 아래 줄은 `국가 · 리그 (1부/2부)`이며 의미 단위 중간 줄바꿈을 금지한다. 예시는 `파도바 🇮🇹 / 이탈리아 · 슈퍼레가 (1부)`다. 국제 목록의 VB→와 참가이력은 유지하고, 기존 선수 상세의 영문 선수명과 원문 팀·리그 정보는 보존한다. 국제 대회카드의 내부 `원본: data/...` 경로는 사용자 화면에서 숨기되 데이터 근거는 삭제하지 않는다.

관심·메모는 Team Finder에 편집 동선을 추가하지 않고 기존 선수 페이지 개인기록을 읽기 전용으로 집계한다. 로그인하지 않은 경우 `—`, 로그인 계정은 해당 명단의 연결된 KVL Player ID 기준 실제 관심선수/메모선수 수를 표시한다. Base `2022d21e8ff5e4a0d235bbc8a286de4c361462bc`; branch `feature/team-roster-standard-v1-20261122`. 기존 대회 페이지 렌더러와 자동화 데이터는 수정하지 않는다. [검증 기록](validation/team-roster-standard-production-v1-20261122.md).


## 2026-11-22 · 월드컵 안내 운영 반영 및 개최국 간편 펼침

Status: USER APPROVED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA VERIFIED. 사용자가 “운영반영해”로 PR #365의 월드컵 개선분을 승인하고 개최국 1장도 KVL 안에서 간단히 안내하도록 요청했다. 월드컵 남녀 대회 개요·참가국·출전권 3장·기존 상세 URL 연결을 운영에 반영한다. 개최국 카드에서는 미국 남녀 자동 출전 각 1장, 혼다 센터(애너하임), 배구 기간과 올림픽 개·폐막 기간을 구분해 펼친다. LA28·Volleyball World·IOC 공식 근거와 확인일을 주기 JSON에 저장한다. 역사 62개·필터·대륙선수권 우승국/출전국·기존 URL·공통 메뉴를 보존하며 2032 미확정 주기에 LA28 숫자나 개최국 정보가 섞이지 않도록 한다.

Base `fd090c3638fdd46f8a25bb5fd82c95420ed48cc7`; branch `codex/world-cup-roadmap-v1`. Node 38/38, PC·모바일 390/360px, 기존 필터·연도 접기와 2032 분리 확인. Drive MASTER는 읽기 대조만 수행했으며 정식 대회 Engine/MASTER 등록·자동화는 별도다. 병합·Pages·운영 검증 전까지 배포 완료로 표시하지 않고 PR #365에 최종 증거를 기록한다. [검증·출처·복구](validation/olympic-world-cup-host-release-v1.md).


## 2026-11-22 · 세계랭킹 출전권 간편 펼침

Status: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA VERIFIED. 앞선 운영 반영 지시에 이어 사용자가 2028 FIVB 세계랭킹도 같은 방식으로 만들도록 요청했다. 네 번째 출전권 카드에서 남녀 기준일, 대륙 대표성 우선 → 미확보국 랭킹순, 아직 미확정인 3장, 대한민국과 이미 확보한 국가를 확인한다. 기존 상세 URL은 공통 데이터를 쓰며 성별을 유지해 로드맵으로 복귀한다. 남자 기준일 2028-06-18, 여자 2028-06-11 잠정은 IOC/FIVB 2026-05-12 규정에 근거한다. 현재 순위·포인트·예상 출전국을 만들지 않는다.

Base `72cf2830536e5d73301f515201d36fa1b21acdfd`; branch `feature/world-ranking-inline-v1`. Node 46/46, PC·모바일 390/360px, 4개 역사 필터·연도 접기·2032 분리 검증. 역사 62개와 마크업·디자인, 기존 개최국/대륙/월드컵 데이터 및 공통 메뉴를 보존한다. Drive MASTER는 읽기 대조했으며 자동화·새 대회 등록은 이번 범위가 아니다. 병합·Pages·운영 검증은 PR에서 기록한다. [검증·출처·한계·복구](validation/world-ranking-inline-v1.md).


## 2026-11-22 · 국제 국가상세 통합명단 우선 UX · VNL 예비표기 · 현재 소속 보강

Status: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / STATIC QA PASSED / BROWSER QA PASSED. 사용자는 기존 국제 국가 카드 디자인은 유지하되 카드 전체를 클릭할 수 있게 하고, 국가 상세 진입 직후 통합 선수명단이 보이도록 요청했다. 기존 연도 버튼은 드롭다운으로 축소하고 “국가별 페이지는 하나로 유지하며…” 안내문과 중복되는 대회별 명단 카드 영역은 기본 화면에서 제거한다. 대신 통합명단 아래에 `대회 바로가기`를 두어 VNL·아시안게임·대륙선수권 등 실제 대회 페이지로 직접 이동할 수 있게 한다. 뒤로가기는 `← 국가 목록`의 단순 텍스트형 버튼으로 통일한다.

VNL 원본에서 `Reserve`로 명시된 선수는 통합명단에서 `VNL 예비` 배지로 표시한다. 이는 VNL 대회별 엔트리 상태이며 대표팀 전체의 영구 예비선수·탈락 상태로 해석하지 않는다.

국제 선수의 현재 소속 보강은 과거 대회명단을 수정하지 않고 별도 `data/international/player-club-registry-2026-27-v1.json` overlay로 관리한다. Volleybox ID와 가능한 경우 DOB를 대조하고, 공개 HTTPS 근거와 `CONFIRMED/REVIEWED` 상태가 있는 레코드만 적용한다. 초기 검증 배치는 이란 남자대표팀 7명이며 히로시마·풀라드 시르잔·허베이 바오딩·우르미아 등 현재 소속 근거를 추가했다. 이 7건의 보강은 전체 국제선수의 미확인 소속이 모두 해결됐다는 의미가 아니며, 근거가 없는 선수는 계속 미확인으로 유지한다.

Base `9a51da092a2187b0cbb71ad678cdea349aab7b6a`; release branch `release2/international-country-roster-ux-v2-20261122`. 원본 89개 roster snapshot·Player ID·VB 링크·회원 접근정책·KOVO 자동화는 변경하지 않는다. [검증 기록](validation/international-country-roster-ux-v2-20261122.md).


## 2026-11-23 · 국제 대표팀 현재 소속 2차 보완

Status: USER REQUESTED / IMPLEMENTED / STATIC QA PASSED / NOT YET DEPLOYED. 사용자가 국제 국가 상세에서 소속팀 미확인 선수가 너무 많다고 지적했다. 국가 상세 UX 자체는 PR #397에서 이미 카드 전체 클릭, 통합명단 우선 진입, 연도 드롭다운, 중복 대회카드 제거, VNL 포함 대회 바로가기, `← 국가 목록`, `VNL 예비` 배지까지 운영 반영되어 있으므로 중복 수정하지 않는다.

2차 데이터 배치에서는 이란 2026 통합명단의 현재 2026-27 소속을 공개 근거로 재확인해 Hazratpour→Paykan Tehran, Haghparast→Panionios Betsson, Yousef Kazemi→Mes Rafsanjan, Shayan Mehrabi→Mehregan Noor, Seyed Matin Hosseini→Sir Susa Scai Perugia, Mohammadnima Bateni→PGE Projekt Warszawa를 current-club registry에 추가한다. Bateni·Haghparast는 대회별 DOB/Volleybox 누락 때문에 동일 선수가 분리되던 신원도 보완한다. 동일 통합 알고리즘 기준 이란은 19개 선수 행 중 18개 소속 확인, Mohsen Delavari 1명만 미확인으로 남는다. 현재 소속 근거를 찾지 못한 선수는 추정하지 않는다. [검증 기록](validation/international-current-club-batch2-20261123.md).


## 2026-11-23 · 대표팀 역사 대회 상세 간소화

Status: USER APPROVED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA VERIFIED. 사용자가 펼친 대회 정보의 가독성 개선 이미지를 확인하고 “이미지처럼 진행해줘”로 승인했다. 대회 행·연도·필터·금색 관문·붉은 실패 표시는 유지하고 펼친 내용만 일정·핵심 경기·출전 경로 중심으로 간소화한다. 세트 점수·검증 메타데이터·공식 출처를 삭제하지 않고 닫힌 ‘세부 기록·출처’로 옮긴다. 대회 기록 버튼으로 기존 KVL 페이지에 연결한다. 기존 시각 보존 방침 중 대회 펼침 영역에 한하여 이번 승인 시안을 적용하며 나머지 행과 상단 요약은 보존한다.

Base `b25e6880e24538b80abc71588d61867f24474aa3`; branch `feature/national-history-simple-detail-v1`. 원본 역사 JSON·렌더러·모델·CSS의 바이트와 62개 기록을 그대로 보존하고 독립 표시 모듈 및 근거 대조형 요약을 추가한다. 원본 변경 시 오래된 요약을 자동 적용하지 않는다. Node 53/53, PC 및 모바일 390/360px, 필터 62/37/16/17, 62개 원본 상세 전수 비교, 키보드·연도 펼침·2032 분리 확인. 병합·Pages·운영 검증 증거는 PR에 기록한다. [검증·변경 파일·복구](validation/national-history-simple-detail-v1.md).

## 2026-11-23 · 출전권 카드 글씨 확대·역사 상세 기간과 장소 강조

Status: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA VERIFIED. 운영 중인 출전권 카드 제목 4개를 각각 2px 확대하고, 펼친 대회의 기간·장소를 요일 포함 형식으로 ‘준결승’과 같은 크기로 보이도록 요청했다. PC 제목 16px·모바일 13px, 상세 기간·장소 14px 남색으로 적용한다. 2026 아시아선수권은 공식 JVA의 일정과 후쿠오카현 기타큐슈 개최지 확인을 거쳐 `2026.09.04(금)~09.13(일) 일본 후쿠오카`로 표시한다. 2026 주요 대회 4개 개최지는 별도 검증 메타데이터로 연결하며 미확인 날짜·장소를 추정하지 않는다.

Base `b6e6fa1c9115c82a9bd69dfe20272d1d7242da11`; branch `fix/roadmap-typography-metadata-v1`. 원본 역사 62개와 결과·참가·출전권 상태를 보존한다. Node 55/55 및 PC·모바일 390/360px 글씨 크기·줄바꿈·4개 출전권 카드·기록 필터 검증 완료. 운영 배포 증거는 PR에 기록한다. [검증·출처·복구](validation/roadmap-typography-metadata-v1.md).

## 2026-11-23 · 이란 대표팀 Mohsen 직접 VB·현재 소속 및 Ali 그리스 국기 보정

Status: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / QA PENDING. 사용자가 이란 대표팀 국가 상세에서 Mohsen Delavari의 Volleybox 검색 링크를 직접 선수 프로필로 바꾸고, 해당 프로필의 현재 소속을 반영하며, Ali Haghparast의 Panionios Betsson 소속 국가 그리스 국기를 바로잡도록 요청했다.

Mohsen은 DOB 2001-11-03과 직접 Volleybox ID p222609를 확인해 VNL 검색 링크를 직접 프로필로 승격하고, current-club overlay에 Yaroslavich Yaroslavl / Russia / Russian Superleague를 REVIEWED로 추가한다. Ali는 기존 Panionios Betsson / Greece 데이터가 맞았으며, 문제는 소속팀 국기 렌더러가 Greece를 gr로 변환하면서 국제 국가카드 전용 40개 SVG 폴더에 존재하지 않는 gr.svg를 참조한 데 있었다. 국제 국가 디렉터리의 40개 국기 세트는 보호하고, 소속팀 전용 Greece/Russia SVG를 별도 경로에 추가한다.

대회 당시 원본 명단의 소속은 변경하지 않고 별도 현재 소속 registry overlay만 갱신한다. VNL 284명은 유지되며 직접 Volleybox 135, 검색 149, invalid 0; current-club registry는 133명이다. [검증 기록](docs/validation/iran-player-link-club-flag-fix-v1-20261123.md).


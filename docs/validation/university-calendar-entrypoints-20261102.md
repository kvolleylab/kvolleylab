# 고성·단양 전용 페이지 달력 복구 — 2026-11-02

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. 운영 수정 요청의 후속 버그 수정이며 최종 병합·Pages·운영 확인은 release PR에 기록한다.

- Base main: `998157da98f99fcea7f0aef3f3052f34b4f0b42f`.
- Branch: `fix/university-calendar-entrypoints-v1`.

## 원인과 범위

대학대회 목록은 고성을 `university-competition.html`, 단양을 `university-competition-danyang.html`로 연다. PR #230에서 공통 달력을 추출하면서 이 전용 HTML에 새 calendar display/widget JS 및 CSS 연결을 빠뜨렸다. 국내 후처리의 선택적 mount 호출이 실행되지 않아, 페이지의 다른 정보는 표시되지만 `[data-dv2-calendar]`는 빈 상태였다. 실제 운영 메뉴 → 고성 경로에서 재현했다.

이전 검수는 `competition-engine.html` 및 수동으로 필요한 스크립트를 주입한 테스트에 집중했다. 47개 config 내부 달력 검증은 통과했지만 실제 전용 진입 HTML의 누락을 검출하지 못했다. 이전 완료 보고의 적용 범위는 이 점에서 불완전했다.

같은 국내 후처리를 읽는 루트 HTML 6개를 전수 확인했다. 공통 Engine을 제외한 다음 5개에 누락된 의존성만 추가하고 관련 기존 자산의 캐시 토큰을 `20261102-calendar-entry-1`로 갱신했다.

- `university-competition.html`: 고성 남녀 및 선택 팀.
- `university-competition-danyang.html`: 단양 남녀 및 선택 팀.
- `national-sports-festival-2026.html`, `national-youth-sports-festival-2026.html`: 같은 원인으로 누락된 종합대회 전용 경로.
- `kovo-cup-domestic-template-prototype.html`: 기존 시안의 같은 연결 누락. `production:false` 상태는 그대로다.

공통 JS/CSS의 동작 자체, 데이터/config/MASTER, 경기·선수·팀 ID, 메뉴 링크, URL 정규화, 성별/부문 전환, Hero 및 다른 화면은 변경하지 않는다. 운영 전용 HTML의 `production:true`를 유지한다. 새 데이터/이미지/대회 콘텐츠 작업이 아니므로 Drive MASTER 쓰기는 없다. 이전 v17 운영 기준 및 이번 최신 main의 관련 승인 이력을 따른다.

## 검수

- 새 `tests/competition-calendar-entrypoints.test.cjs`는 **실제 HTML에 선언된 스크립트만** 로컬 ResourceLoader로 실행한다. 테스트에서 빠진 달력 파일을 별도로 주입하지 않는다.
- 수정 전 고성/단양 남녀 모두 달력 mount 실패를 재현했다. 수정 후 총 61개 관련 검사 통과: 실제 진입 경로 9개 검사, 기존 국내 홈/팀 달력/전국체전/Cup 시안 회귀검사. 첫 배포 검사에서 Cup 시안의 캐시 토큰 허용 목록이 새 토큰을 포함하지 않아 실패했으며, 새 토큰을 추가한 뒤 정렬/캐시 검사 1개를 별도 재실행해 통과했다.
- 새 검사는 모든 국내 후처리 HTML의 의존성 순서와 CSS, 고성/단양 남녀의 URL/달력, 종합대회와 시안, 날짜별 정확한 경기 ID 및 팝업 닫기, 월 이동, 기존 탭, 원본 불변성, 고성 팀 달력과 기본 펼침 목록을 확인한다. 기존 CI에 경로와 검사를 추가했다.
- 실제 브라우저: 고성 남 390px 달력345/345·본문375/375, 고성 여 360px 달력315/315·본문345/345. 메뉴의 남녀 전환으로 이동했다. 고성 7/2 2경기 팝업과 세트 점수 확인.
- 실제 브라우저: 단양 남 PC 본문1180px·달력737/737·페이지1425/1425. 8/20 결승 인하대3:1성균관대와 전체 세트 점수 확인. 단양 여자부로 실제 전환하여 모바일360px 달력315/315·본문345/345 및 결승 5세트 점수도 확인했다.
- `git diff --check` PASS, data/config 변경 없음. 로컬 HTTP 미리보기에서만 production 검증을 끈 별도 복사본을 사용하며, repo의 운영 플래그는 바꾸지 않았다. 자동검사는 HTTPS 실제 경로 및 production 검증을 사용한다.
- 배포 Quality Audit에서 `ubuntu-latest`가 Ubuntu 26.04로 이동하여 고정된 Playwright 1.56.1의 Chromium 설치가 실패했다(`Playwright does not support chromium on ubuntu26.04-x64`). audit 작업만 지원되는 Ubuntu 24.04로 고정했다. 감사 항목·의존성 버전·권한·승인 조건은 유지한다.

배포 후 대학대회 목록의 실제 링크, 남녀 전환, 전용 경로의 달력/팝업을 재확인해야 DEPLOYED로 기록한다. 복구는 이 PR의 연결 보완만 되돌리고 PR #230 공통 표시 규칙이나 병행 데이터 갱신을 되돌리지 않는다.

# 모바일 공통 헤더 및 대회 HERO 채움 — 2026-11-02

Status: REQUESTED / IMPLEMENTED / PREVIEW VERIFIED (아래 확인 범위) / RELEASE AUTHORIZED.

이 문서 작성 시점에는 병합, GitHub Pages 배포 및 운영 URL 재검증 전이다. 최종 커밋·PR·Pages·운영 확인 결과는 이 문서의 후속 기록 또는 release PR에 남긴다.

## 요청과 기준

- 사용자는 홈 기준의 모바일 상단 헤더 통일, 헤더 클릭 시 홈페이지 이동, 대회 HERO 이미지가 홈처럼 영역을 채우는 표시를 요청했다.
- 기준 main: `be0ffe4f13aebdb59ea45d74ce6a816b2168a7d0` — 고성·단양 달력 진입 경로 복구 PR #233을 포함한다.
- 최종 로컬 검수 후 main을 재조회했으며 기준 SHA와 동일함을 확인했다.
- `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `docs/KVL_DECISION_LOG.md`, 홈 HERO 인수인계 및 Google Drive `KVL_운영원칙_MASTER_v17`을 대조했다.
- 기존 홈의 모바일 브랜드 바를 공통 내비게이션으로 승격한다. 최신 사용자 요청이 대회 이미지 표시 범위에서 종전 `contain`·전체 구도 우선·높이만 맞춤 규칙을 대체한다. 원본 자산 자체의 크롭·재생성·재압축은 하지 않는다.

## 변경한 표시와 동작

### 공통 모바일 헤더

- 기존 공통 내비게이션을 사용하는 페이지에 높이 58px, 네이비 `#07182d`, 30px 배구공 로고, 15px `K-Volley Lab` 글씨를 표시한다.
- 헤더 전체를 `/index.html`로 이동하는 링크로 구성한다. 메뉴 버튼은 별도 요소로 유지하여 메뉴를 열 때 홈으로 이동하지 않는다.
- 로고 경로도 루트 절대경로를 사용한다. 링크에 한국어 접근성 이름과 키보드 포커스 표시를 제공한다.
- 공통 헤더가 설치된 뒤에만 홈 전용 `.home-utility`를 모바일에서 숨겨 두 브랜드 바가 겹치지 않게 한다. PC의 홈 바로가기 표시줄은 유지한다.
- 헤더는 메뉴 백드롭과 사이드바 아래에 배치한다. 900px 이하에서 표시하고, PC 및 인쇄에서는 숨긴다.

### 대회 HERO 이미지

- 국내·프로·국제 공통 표시 규칙에서 이미지 레이어를 `cover`로 맞춘다. 빈 띠가 생기던 `contain`, 높이만 맞추던 `auto 100%`, 비율을 변형하던 `100% 100%` 이미지 크기 지정을 교체한다.
- 그라데이션 레이어의 `100% 100%`는 그대로 유지한다. 이미지 자체는 종횡비를 보존하며 화면 비율에 따라 가장자리가 일부 잘릴 수 있다.
- 기존 PC/모바일 이미지 선택, 대회별 테마색, 제목·일정·장소·하단 탭, 가능한 기존 초점 위치 설정을 유지한다. 프로 HERO는 이미 등록된 PC/모바일 초점 위치를 반영한다.
- 별도 국제 엔진 이식이나 AVC 화면 전면 개편은 하지 않는다. 공통 헤더와 요청된 이미지 표시 규칙만 변경한다.

## 변경 파일 범위

| 분류 | 파일 |
| --- | --- |
| 공통 헤더 | `assets/js/kvl-global-sidebar-v1.js`, `assets/css/kvl-global-sidebar-v1.css` |
| 공통 의존성 버전 | `assets/js/unified-nav.js` |
| 대회 HERO 표시 | `assets/css/kvl-domestic-home-v2.css`, `assets/css/kvl-competition-components-v2.css` |
| 주요 진입 경로의 캐시 버전 | `index.html`, `competition-engine.html`, `university-competition.html`, `university-competition-danyang.html`, `national-sports-festival-2026.html`, `national-youth-sports-festival-2026.html` |
| 새 대회 기본 연결 | `templates/competition-page-production-v2.html` |
| 기존 HERO 표시·자산 버전 검사 | `tests/kovo-cup-production-template-20261027.test.cjs`, `tests/competition-v2-pro-cup-pool-columns.test.cjs`, `tests/kovo-cup-desktop-matchup-alignment.test.cjs` |
| 기록 | 본 문서, `docs/KVL_DECISION_LOG.md` |

정확한 최종 변경 목록은 release PR의 파일 목록으로 확인한다. 미리보기 서버·검수 보조 파일은 배포 대상이 아니다.

## 보존 범위

기존 이미지 파일 바이트, 대회 `config.json`·`data.json`, Google Drive MASTER, 경기 결과·순위·선수 명단·Player ID·대회 ID·팀 ID 및 링크 목적지를 변경하지 않는다. PR #233의 달력 의존성과 기존 자동 업데이트 코드를 보존한다. 변경 파일은 표시 코드·캐시 버전·작업 기록에 한정한다.

## 확인한 결과

| 검사 | 결과 | 근거 및 범위 |
| --- | --- | --- |
| 변경 JS 문법 | PASS | 공통 사이드바와 `unified-nav.js`의 `node --check` 통과 |
| 헤더 소스 독립 검토 | PASS | 별도 홈 링크와 메뉴 버튼, 루트 절대경로, 중복 헤더 억제, 메뉴 아래 쌓임 순서, PC/인쇄 숨김 확인 |
| HERO 변경 독립 검토 | PASS | 기준 main과 두 CSS의 diff 대조. 변경이 HERO 이미지 크기·초점 위치 및 관련 주석에 한정됨을 확인 |
| 기존 HERO 테스트 기준 갱신 | PASS — local assertion | PR #234 첫 focused-regressions 실행은 종전 `Hero must never crop` assertion 때문에 실패했다. 최신 요청에 맞춰 PRO PC·모바일 두 규칙의 `cover`를 검사하도록 갱신하고, 변경 CSS는 통과하며 기준 main의 `contain` CSS는 거부됨을 확인했다. 나머지 대회 데이터·결과 검사는 유지하며 전체 CI 재실행 결과는 PR에 기록한다. |
| 모바일 헤더 크기·색상 | PASS — preview | 실제 브라우저 계산값 58px, `rgb(7, 24, 45)` 확인 |
| 홈 중복 표시 | PASS — preview | 공통 헤더가 표시되고 기존 `.home-utility`는 `display:none` |
| V-리그 남자 390px·여자 360px | PASS — preview | 배경 `100% 100%, cover`, 가로 넘침 없음 |
| KOVO컵 남자 390px | PASS — preview | HERO `cover`, 공통 헤더 1개, 가로 넘침 없음 |
| VNL 남자 390px | PASS — preview | HERO `cover`, 공통 헤더 1개, 가로 넘침 없음 |
| 아시안게임 남자 390px | PASS — preview | HERO `cover`, 공통 헤더 1개, 가로 넘침 없음 |
| 대학 고성 전용 경로 390px | PASS — preview | HERO `cover`, 공통 헤더 1개, 달력 1개, 가로 넘침 없음 |
| 전국체전 `finished-artwork` 900px | PASS — preview | HERO `cover`, 헤더 높이 58px, 가로 넘침 없음 |
| 전국체전 `finished-artwork` 901px | PASS — preview | 모바일 헤더 `display:none`, body `padding-top:0`, 가로 넘침 없음 |
| V-리그 남자 PC 1180px | PASS — preview | 모바일 헤더 `display:none`, 사이드바 210px, HERO `cover`, 가로 넘침 없음 |
| AVC 여자 전용 화면 390px | PASS — preview | 기존 전용 디자인의 원본 이미지 채움을 유지하고 새 헤더 1개·58px·가로 넘침 없음을 화면 캡처로 확인 |
| 메뉴 열기·Escape 닫기 | PASS — preview | 메뉴를 열어도 현재 페이지 유지, Escape로 닫기 확인 |
| 홈 이동 | PASS — preview | 헤더 링크의 Enter 및 글씨 밖 오른쪽 빈 헤더 영역 클릭 모두 `/index.html`로 이동 |

focused-regressions의 고정 자산 버전 검사 두 곳도 실제 변경된 `20261102-hero-cover-1`과 일치하도록 갱신했다. 순위·결과·명단·로고·레이아웃 기능 검사는 그대로 유지한다. 수정한 검사 파일의 문법과 새 버전 허용/옛 버전 또는 누락 거부를 로컬에서 확인했고, 전체 CI 결과는 release PR에 기록한다.

## 검증의 한계와 남은 확인

- 미리보기의 HTTP 주소가 대회 SEO의 HTTPS canonical 검증과 맞지 않아, 검수 서버에서만 canonical 호환 처리를 사용한다. 이 보조 처리는 배포하지 않으며 운영 canonical 검증 코드를 변경하지 않는다. 배포 후 실제 HTTPS 운영 URL에서 원본 코드로 다시 확인한다.
- 위 표의 대표 대회 계열, PC 및 900/901px 경계까지 미리보기 검수를 완료했다. 모든 개별 대회 경로를 전수 검사했다는 의미는 아니며 실제 HTTPS 운영 URL 재검증은 배포 후 확인 대기다.
- AVC 남자 페이지의 준비 전 초기 관찰에서 헤더 0개가 기록되었으나, 로딩 완료 상태의 검사 결과가 아니므로 실패로 분류하지 않는다. 최종 결과 출력이 잘려 완료 증거가 남지 않았으므로 이 문서에서는 해당 페이지를 PASS로 기록하지 않는다.
- `tests/domestic-home-v2.test.cjs`는 렌더러·데이터 연결 회귀 검사이며 CSS의 cover·헤더 위치·클릭 영역 검증을 대신하지 않는다. 이 실행 환경에는 jsdom이 없어 해당 테스트를 실행했다고 표시하지 않는다. 이번 변경의 실제 화면·메뉴·링크 동작은 브라우저에서 검증한다.
- 브라우저 반응형 검수이며 물리적 휴대전화 실기기 인증은 아니다.

## 배포와 복구

1. 최신 main과 수정 대상의 변경 여부를 다시 확인하고, 독립 `fix/*` 브랜치와 PR로 검수된 변경만 반영한다.
2. PR의 최종 head를 기준으로 병합한 뒤 Pages 완료와 실제 운영 화면·헤더 이동·선택 이미지 크기를 확인한다.
3. 문제가 확인되면 해당 PR의 변경만 되돌린다. 데이터·자동화·다른 작업의 최신 main을 과거 전체 상태로 되돌리지 않는다.
4. 헤더 복구는 공통 JS/CSS와 loader 버전을 함께 되돌리고, HERO 복구는 두 표시 CSS와 관련 캐시 버전을 함께 되돌린다.

## 후속 배포 증거

PENDING — release PR, 최종 commit, Pages 결과 및 운영 확인 기록을 배포 담당자가 추가한다.

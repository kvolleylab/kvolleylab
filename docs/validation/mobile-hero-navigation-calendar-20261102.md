# HERO 경로줄 정리 및 모바일 대회 달력 3줄 — 2026-11-02

Status: REQUESTED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 최종 PR·병합·Pages·운영 HTTPS 확인 결과는 release PR에 후속 기록한다.

## 요청과 기준

사용자는 상단 헤더와 HERO 사이의 “홈·프로 V-리그 / 대회목록” 경로줄을 제거하고, 대학배구에는 HERO 우상단의 대회목록 버튼을 남기도록 요청했다. 모바일 대회 달력의 단일 경기는 “1R 삼성 / vs 우카 / (대전, 19시)” 3줄을 요청했다.

- 기준 main: `dfad9ca877cff9e53cd5ce0c066002113eae73fb`.
- 직전 PR #234의 공통 모바일 헤더·전체 바 홈 링크·HERO cover를 보존한다.
- AGENTS, PROJECT_RULES, DESIGN_SYSTEM, DEVELOPMENT_WORKFLOW, 최신 decision log와 공통 달력·전용 진입경로 검수 기록을 확인했다.
- Google Drive 운영원칙 MASTER v17(문서 ID `1iu1aWoTdSf2L7VCco5X7pCPxs9qVlM9rskZ8_hI76FY`)을 재조회했다. 기존 국제 테마와 AVC 전용 디자인, 데이터/MASTER/ID 보호 기준을 유지한다.
- 이번 운영 화면 후속 수정 요청을 이 표시 범위의 적용 승인으로 기록한다. 종전 경로줄과 모바일 긴 문구의 추가 줄바꿈/말줄임 없음 규칙은 이번 3줄 표시 범위에서 대체한다.

## 표시와 동작

### HERO

공통 domestic-home-v2 후처리의 `.dv2-utility` DOM 생성과 전용 CSS를 제거한다. 대학 U-리그·고성·단양 남녀 6개 대회에는 기존 대회 ID의 `KVL-COMP-UNIV-*` 분류와 domestic family로 범위를 제한해 HERO 직접 자식 링크 1개를 넣는다. 기존 `structure.hubUrl`을 우선하고, 기존 fallback `university-competitions.html`을 유지한다.

버튼은 “대회 목록”이며 최소 높이 44px, 키보드 포커스 표시, 기존 테마 변수를 사용한다. 모바일에는 HERO 안의 상단 공간을 확보해 제목과 겹치지 않게 한다. PC에도 같은 우상단 링크를 제공한다. 이미지·cover·배경색·기존 텍스트는 보존한다. 학교/종합/프로/VNL에는 대학 전용 버튼을 만들지 않는다. 별도 GAMES 및 기존 AVC에는 이 경로줄이 원래 없어 HERO를 변경하지 않는다.

### 모바일 대회 달력

680px 이하에서 단일 경기를 물리적 3행으로 표시한다.

| 행 | 예정 경기 | 종료 및 유효한 등록 점수가 있는 경기 |
|---|---|---|
| 1 | 단계·홈팀: `1R 삼성` | 단계·홈팀 |
| 2 | `vs 우카` | 실제 세트 결과·원정팀: `3-1 우카` |
| 3 | `(대전, 19시)` | 기존 확인된 장소·시간 |

기존 표시명과 시간 helper를 사용한다. 정시는 “19시”, 실제 분이 있으면 모바일 “19:30”, PC “19시30분”으로 표시한다. 확인되지 않은 장소·시간을 만들지 않는다. 모바일에서 긴 팀명은 한 행 안의 말줄임, 긴 장소명은 장소 부분만 말줄임 처리하고 시간은 유지한다. title/날짜 버튼의 접근성 이름/상세 팝업에는 전체 정보를 남긴다.

하루 2경기 이상은 기존 N경기 요약과 전체 경기 팝업을 유지한다. 선택 팀 달력도 현재 선택된 경기 범위로 같은 규칙을 사용한다. PC의 기존 팀명 배치와 보조 정보 표기는 유지한다. 홈페이지 통합 달력과 경기일정 기간 달력은 이번 개별 대회 달력 범위가 아니다.

## 변경 파일 범위

- 제품 코드: `assets/js/kvl-domestic-home-v2.js`, `assets/css/kvl-domestic-home-v2.css`, `assets/js/kvl-match-calendar-v1.js`, `assets/css/kvl-match-calendar-v1.css`.
- 진입경로 및 두 생성 템플릿: 변경한 domestic 또는 match-calendar 자산의 query만 갱신. shared components, calendar-display, AVC adapter 버전은 유지.
- 기존 DOM/표시 계약 테스트: 대학/중고/종합 경로줄 부재, 대학 버튼 중복·목적지·대회 범위, 모바일 정보 분리·분 표시·결측값·원본 불변성.
- 기존 focused workflow에 school/national 두 기존 DOM 테스트를 추가한다. 검사를 삭제하거나 데이터·순위·점수·로고 검사를 완화하지 않는다.
- 캐시 버전: domestic `20261102-hero-navigation-1`, match-calendar `20261102-calendar-mobile-3lines-1`.

## 검수

| 검사 | 결과와 근거 |
|---|---|
| JS/테스트 문법 및 순수 표시 계약 | PASS. 공통 formatter의 정시/분/자정/결측/잘못된 시각/HTML 문자/상태별 결과 9개 계약 확인 |
| HERO 이미지 보존 | PASS. 기존 background-image/size 선언은 기준 main과 동일 |
| V-리그 남자 390px | 경로줄 0개, HERO top 58px로 공통 헤더 직후 시작. cover 유지, 가로 넘침 없음. 예정 vs와 종료 등록 결과를 분리한 세 행 확인 |
| 대학 고성 360px | 경로줄 0개, 목록 버튼 1개/높이44px/제목과 겹침 없음. 실제 대학 대회 목록으로 이동 확인 |
| 대학 고성 달력 360px | 결승 “한양대 / 1-3 인하대 / 장소·13시” 3행. 7월2일 N경기 선택 시 준결승 2경기 전체 점수·장소·시간 팝업 및 Escape 닫기 확인 |
| 대학 고성 1180px PC | 우상단 목록 버튼과 제목 겹침 없음, 공통 모바일 헤더 숨김, 달력 matchup block 및 side inline 유지, 가로 넘침 없음 |
| VNL 남자 미국 선택 360px | 대학 버튼 없음, 경로줄 없음, 선택 팀 달력 3행. 긴 Ningbo 경기장에서는 장소만 줄고 20:30 시각이 보임. 가로 넘침 없음 |
| 기존 AVC 여자 390px | 변경 calendar query 로드, 공통 달력 1개, 기존 N경기 요약 유지, 가로 넘침 없음. HERO 전용 디자인은 변경 없음 |

이번 preview는 HTTP 주소여서 기존 HTTPS canonical 검증과의 호환을 검수 서버 응답에서만 처리한다. 이 보조 코드는 배포하지 않는다. 실제 HTTPS 운영에서는 원본 검증 그대로 재확인한다. 브라우저 반응형 검수이며 물리적 기기 검수로 표현하지 않는다.

로컬 jsdom 패키지는 없고 정상 npm 설치는 환경의 네트워크 제한으로 실패했다. 우회하지 않았으며 로컬 DOM suite를 실행했다고 표시하지 않는다. 기존 GitHub Actions의 jsdom 단계에서 전체 관련 검사를 실행한 결과를 release PR에 기록한다.

## 보존 및 복구

config/data/원본 이미지/대회·경기·팀·Player ID/명단/MASTER/경기 결과/자동화 코드는 변경하지 않는다. 선수 MASTER 연결 1차와 공시 업데이트를 포함한 기준 main을 보존한다. 문제가 있으면 이 PR의 표시 코드·캐시 버전·테스트/문서 변경만 되돌리며 최신 main 전체나 데이터를 과거 상태로 되돌리지 않는다.

## 배포 증거

PENDING — release PR에 최종 head 검사, 병합 SHA, Pages 결과, 실제 운영 HERO·버튼 이동·달력 표시를 기록한다.

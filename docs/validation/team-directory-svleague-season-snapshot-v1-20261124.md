# 팀 페이지 SV.LEAGUE 시즌 스냅샷·대표팀 역사 소속 고정 v1 — 2026-11-24

## 사용자 요청

1. 2026년도 국가대표팀 명단의 소속팀은 이후 이적과 무관하게 해당 연도·대회 당시 값으로 고정한다.
2. `팀 → 프로`에 해외 프로리그 축을 추가하고, 첫 적용 대상으로 일본 `SV.LEAGUE` 남자부를 연결한다.
3. SV.LEAGUE 팀 명단은 국제대표팀 명단 계열 UI를 사용하되, 대표팀의 `소속팀` 위치에는 `국적`을 표시한다.
4. 시즌별 선수명단을 스냅샷으로 보존하여 2027-28 이적이 2026-27 팀 명단을 덮어쓰지 않게 한다.
5. 용병 탐색을 위해 전체/외국인/일본인, 포지션 필터와 직접 Volleybox 링크를 제공한다.

## Base / Branch

- Base main: `9e8848442889161a1a8c296b63af93f8111732dc`
- Branch: `feature/svleague-team-directory-season-snapshot-v1`
- Production: NOT DEPLOYED
- 사용자 별도 승인 전 main 병합 금지

## 첨부 원본

사용자 제공:
- `일본_SV리그_남자_2026-27_선수명단_Volleybox_v1.xlsx`
- 기준일: 2026-11-23

원본의 `사용안내` 및 12개 팀 시트를 직접 읽어 다음 계약을 보존한다.

- 시즌 등록 선수: 211명
- 구단: 12개
- 직접 Volleybox 선수 프로필: 211명
- 소속 재확인: 5명
- 시즌 선수 등록 자료이며 14인 경기 엔트리가 아님
- 등번호/POS/신장/국적/직접 Volleybox 링크를 원본 그대로 보존
- 생년월일 열은 원본에 없으므로 홈페이지에서 임의 생성하지 않고 `—` 처리
- 한글명이 없는 선수는 영문명을 주 이름으로 표시
- `소속 재확인` 5명은 출처 충돌을 숨기지 않고 RECHECK 배지로 유지

### RECHECK 5명

- Tokyo Great Bears #9 Takahiro Tozaki
- Tokyo Great Bears #15 Yuki Imahashi
- Tokyo Great Bears #16 Takumi Kameyama
- Tokyo Great Bears #28 Kandai Goto
- Shinshu Matsumoto Tridents #19 Takamaru Ichijo

## SV.LEAGUE 공식 팀 수 교차확인

2026-27 SV.LEAGUE 공식 기록/팀 목록에서 남자 12개 팀을 확인한다.

- Voreas Hokkaido
- Tokyo Great Bears
- Shinshu Matsumoto Tridents
- Toray Arrows Shizuoka
- JTEKT STINGS Aichi
- WolfDogs Nagoya
- Osaka Bluteon
- Suntory Sunbirds Osaka
- Nippon Steel Sakai Blazers
- Hiroshima Thunders
- Hokkaido Yellow Stars
- Fragolad Kagoshima

공식 참고:
- https://archive.svleague.jp/ja/form/c2/?round_id=411
- https://archive.svleague.jp/ja/record/team/

선수별 필드는 이번 배치에서 사용자가 제공한 KVL 정리본을 원본으로 하며, 공식 12팀 확인이 선수 211명의 모든 개별 필드를 공식 검증으로 승격시키는 것은 아니다.

## Google Drive 대조

K-Volley Lab 연결 Drive에서 `SV리그 2026-27` 관련 MASTER를 검색했다.
- 국내 2026-27 V-리그 남녀 MASTER 및 국제대회 MASTER는 확인됨
- 이번 일본 SV.LEAGUE 2026-27 전용 MASTER는 확인되지 않음
- Drive 원본은 이번 작업에서 생성·수정하지 않는다.
- 따라서 이번 v1의 데이터 원본은 사용자 첨부 XLSX로 명시한다.

## 데이터 구조

### 프로리그 인덱스

`data/team-rosters/sv-league/index-v1.json`

- 리그: SV.LEAGUE
- 국가: Japan
- 시즌: 2026-27
- 성별: men
- 12개 팀 source_path
- 총 선수 211
- direct Volleybox 211
- RECHECK 5
- 정책: 시즌 스냅샷은 이후 current-club 변경으로 재작성하지 않음

### 팀별 스냅샷

`data/team-rosters/sv-league/2026-27/*.json`

각 파일:
- team code/name/en
- season/as_of/snapshot_type
- 번호
- 영문명 / 확인된 한글명
- POS
- 신장
- 국적 / ISO2 / 국기
- 직접 Volleybox
- VERIFIED / RECHECK
- source policy

## 팀 페이지 UX

`팀 → 프로`에서:
- V-리그
- SV.LEAGUE

두 리그 버튼을 제공한다.

SV.LEAGUE 2026-27:
- 12개 팀 카드
- 기존 Team Finder 3열 PC / 2열 모바일 카드 규칙 재사용
- 2026-11-24 후속 개선에서 JTEKT STINGS Aichi 공식 2026-27 일정 페이지가 실제 경기 카드에 사용하는 12개 구단 로고 자산을 연결
- 공식 로고 자산이 로드되지 않으면 기존 모노그램 폴백으로 자동 전환
- 팀 클릭 시 국제대표팀과 같은 데이터 밀도의 7열 명단
  - NO.
  - 선수명
  - 생년월일
  - POS
  - 신장
  - 국적
  - Volleybox
- 국적은 `🇯🇵 일본`, `🇺🇸 미국` 방식
- 전체 / 외국인만 / 일본인 필터
- ALL POS / OH / OP / MB / S / L 필터
- 선수명 검색
- RECHECK 배지

## 대표팀 역사 소속 고정

기존 문제:
- 국가 상세 통합명단과 대회별 명단이 `player-club-registry-2026-27-v1.json`을 전역 current-club처럼 읽어, 미래 2027 이적이 2026 화면을 덮어쓸 가능성이 있었다.

수정:
- `clubSnapshotPathForYear(2026)` → `data/international/player-club-registry-2026-27-v1.json`
- 2027 및 미매핑 연도 → 빈 경로
- 향후 2027-28 소속은 별도 파일이 생겨야만 2027 화면에서 사용 가능
- 대회 원본에 확인된 소속이 있으면 그 값을 최우선으로 사용
- 시즌 registry는 대회 원본 소속이 비어 있을 때만 같은 연도의 보완값으로 사용

우선순위:
1. 대회 당시 원본/대회 전용 검증 소속
2. 같은 연도 시즌 club snapshot
3. 미확인

따라서 2027 이적은 2026 대표팀 명단과 2026-27 SV.LEAGUE 팀 스냅샷을 재작성하지 않는다.

## 사전 데이터 검증

- SV.LEAGUE teams: 12
- players: 211
- direct Volleybox: 211
- RECHECK: 5
- 팀별 count와 실제 players 배열: 전부 일치
- Tokyo RECHECK: 4
- Shinshu RECHECK: 1
- 나머지 팀 RECHECK: 0

## QA 계획

- Node syntax
- Team Directory unit regression
- SV index/team validator
- 211 direct Volleybox / 5 RECHECK gate
- International roster source precedence test
- 2027이 2026 club snapshot을 상속하지 않는 테스트
- Chromium PC 1440 / mobile 390·360
- JTEKT 16명 / DeFalco 🇺🇸 미국 / foreign+OH filter
- Tokyo RECHECK 4명 표시
- 기존 V-리그 남녀 7팀, 대학/중고/국제 40국 회귀 유지
- KVL Quality Audit public export gate

## SV.LEAGUE 12개 구단 로고 후속 개선

2026-11-24 후속 요청으로 Team Finder의 SV.LEAGUE 카드와 선수명단 상단에 구단 로고를 추가한다.

출처:
- JTEKT STINGS Aichi 공식 사이트 2026-27 일정 페이지
- `https://www.jtekt-stings.jp/`
- 해당 페이지가 상대팀 경기 카드에 사용하는 공식/운영 로고 자산 URL을 12개 팀에 연결
- JTEKT 자체 로고는 같은 공식 사이트의 header logo asset 사용

보안/운영 정책:
- 임의 외부 이미지 URL 허용 금지
- `www.jtekt-stings.jp/_next/static/media/` 및
  `images.microcms-assets.io/assets/99af67a09e884982ae7d419ecde99396/`만 SV 로고 원격 asset으로 화이트리스트
- 그 외 `javascript:`, 임의 도메인, 비 HTTPS URL은 기존 `safeLogo`에서 차단
- 카드 로고 로딩 실패 시 모노그램 폴백
- 선수명단 상단 로고 로딩 실패 시 팀명 두 글자 폴백
- 시즌별 index에 logo URL을 저장하므로 향후 브랜드 변경이 있어도 2026-27 표시를 임의로 덮어쓰지 않는다.

QA 추가:
- 12팀 모두 서로 다른 verified logo URL
- 12개 카드 `img.ktd-team-logo-image`
- PC 1440 / Mobile 390·360 실제 logo decode
- JTEKT 선수명단 상단 logo decode
- 기존 211명/RECHECK 5/외국인 필터 회귀 유지

## 상태

IMPLEMENTED IN FEATURE BRANCH / QA PENDING / NOT DEPLOYED

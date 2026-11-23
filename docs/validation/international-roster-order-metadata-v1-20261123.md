# 국제 국가별 명단 등번호 정렬·상단 조작부 압축·선수 메타데이터 재검수 v1

## 작업 상태
- 요청일: 2026-11-23
- 기준 main: `b6e6fa1c9115c82a9bd69dfe20272d1d7242da11`
- 작업 브랜치: `fix/international-roster-order-metadata-v1-20261123`
- 상태: 구현 및 정적/데이터 검증 완료, 운영 미반영

## 사용자 요청
1. 국가별 선수명단을 등번호 오름차순으로 정렬한다.
2. `← 국가 목록`을 `연도 2026` 드롭다운 위에 배치하고, 두 조작부를 국기·국가명 행의 오른쪽 끝에 붙여 세로 공간을 줄인다.
3. 다른 국가 선수의 2026/27 소속팀과 Volleybox 링크를 재검수하고, 신원이 정확히 연결되는 항목만 갱신한다.

## UI 변경
- 국가 헤더를 좌측 `국기 + 국가명`, 우측 `← 국가 목록 + 연도 드롭다운` 구조로 변경.
- 우측 조작부는 PC/모바일 모두 세로 2단으로 유지하되 간격과 패딩을 축소.
- 연도 통합명단과 대회별 개별명단 모두 숫자 등번호 오름차순.
- 등번호가 없는 선수는 숫자 등번호 선수 뒤에 배치.
- 모바일에서는 국기와 헤더 크기를 함께 축소하여 우측 조작부가 별도 행으로 밀려 세로 공간이 늘어나는 현상을 줄임.

## 데이터 재검수 원칙
- 기존 대회 원본 선수 수·선수 신원·대회 참가 상태는 변경하지 않는다.
- 동일 선수 연결은 정확한 영문명 + 정확한 생년월일 또는 이미 검증된 동일 Volleybox 선수 ID만 사용한다.
- 직접 프로필을 특정할 근거가 없으면 기존 `VB 검색`을 유지한다.
- 소속팀은 공개 근거가 있는 `CONFIRMED` 또는 `REVIEWED`만 표시한다.
- 더 최신인 2026년 11월 검증값이 있는 선수는 9월 MASTER 값으로 되돌리지 않는다.

## 재검수에 사용한 연결 Drive MASTER
- `KVL_2026_CEV_Mens_European_Championship_선수명단_MASTER.xlsm`
  - Drive ID: `1SLPvMniXM3W2ivwSliNbrW59lhsvwppC`
- `KVL_2026_CSV_Mens_South_American_Championship_선수명단_MASTER.xlsx`
  - Drive ID: `1W3JP9qKtdN3qIQf6ImJyZDxF1Dh4ydin`
- `KVL_2026_NORCECA_Mens_Continental_Championship_선수명단_MASTER.xlsx`
  - Drive ID: `1R_mM1Amnm0CjYezYvcobn8a3HIiDQVie`
- `KVL_2026_AVC_Mens_Continental_Championship_선수명단_MASTER_v2.xlsx`
  - Drive ID: `1NwEjUuvNbFfq5EZ-o8avQQC4XpLzcvnS`
- `KVL_2026_Asian_Games_Mens_Volleyball_선수명단_MASTER_v1.xlsx`
  - Drive ID: `18hlWasoq71_ROFe8F_0f186NAU-iP6d6`

VNL 폴더의 `01_MASTER`에는 일정·결과 MASTER만 확인되어, 선수 소속/직접 Volleybox 링크는 후속 2026 대륙선수권 MASTER와 동일 시즌 공개 대회 명단을 교차 사용했다.

## 반영 결과
### Volleybox
- VNL 남자 선수 총수: 284명, 변경 없음.
- 작업 전 직접 프로필: 49명.
- 작업 후 직접 프로필: 134명.
- 직접 프로필로 승격: 85명.
  - 유럽·남미·NORCECA 후속 MASTER exact match: 62명.
  - AVC 대륙선수권·아시안게임 동일 선수 exact match: 이란 11명 + 중국 12명 = 23명.
- 검색 링크 유지: 150명.
- 잘못된/비허용 URL: 0명.

### 2026/27 소속팀
- `data/international/player-club-registry-2026-27-v1.json` 검증 선수: 13명 → 134명.
- 유럽·남미·NORCECA 후속 MASTER exact match 기반 76명 보강 후, AVC 대륙선수권 `CONFIRMED` + direct Volleybox ID가 함께 있는 45명을 공통 레지스트리에 추가했다.
- AVC 추가분: 일본 14, 호주 6, 바레인 1, 오만 1, 이란 4, 중국 5, 인도 14.
- 최신 11월 Iran 등 기존 `CONFIRMED/REVIEWED` 값 3건은 9월 AVC 값으로 되돌리지 않았다.
- 레지스트리 134명 모두 선수 ID·DOB·소속팀·HTTPS 공개 출처·허용 status 검사 통과.

### 이란 2026 남자 페이지 확인
통합 모델을 실제 build하여 등번호 정렬을 확인했다.
- 정렬: PASS.
- 대표적인 최신 표시:
  - #5 Mobin Nasri Mastanabad — Hiroshima Thunders
  - #8 Mohammadreza Hazratpourtalatappeh — Paykan Tehran
  - #10 Amin Esmaeilnezhad — Hiroshima Thunders
  - #17 Ali Hajipour Moghadam Faroji — Foolad Sirjan Iranian
  - #20 Yousef Kazemi Poshtpari — Mes Rafsanjan
  - #22 Ali Haghparast — Panionios Betsson
  - #29 Seyed Matin Hosseini Tolouti — Sir Susa Scai Perugia
  - #49 Morteza Sharifi — Hebei Baoding Wolves
  - #99 Mohammadnima Bateni — PGE Projekt Warszawa
- Mohsen Delavari는 직접 선수 프로필·현 소속팀을 확정할 근거가 없어 `VB 검색 / 소속 미확인` 유지.
- Ilshan Davoodipour는 서로 다른 대회에서 #2/#11로 나타나며 신원은 동일 VB로 연결되지만 원본 DOB 충돌/차이가 있어 억지로 한 행으로 병합하지 않는다.

## 구현 파일
- `assets/js/kvl-international-countries-v1.js`
- `assets/css/kvl-international-countries-v1.css`
- `assets/js/kvl-international-unified-roster-v1.js`
- `data/competitions/vnl-men-2026/data.json`
- `data/international/player-club-registry-2026-27-v1.json`
- `teams.html`

## 검증 결과
- 국제 국가별 JS 문법: PASS.
- 통합명단 JS 문법: PASS.
- 통합명단 등번호 정렬 코드: PASS.
- 대회별 개별명단 등번호 정렬 코드: PASS.
- 국가 헤더 우측 조작부: PASS.
- 구형 독립 toolbar 제거: PASS.
- VNL 선수 수 284명 및 국가별 색인 player_count 일치: PASS.
- VNL Volleybox: direct 134 / search 150 / bad 0.
- current club registry: 134 / invalid 0.
- `teams.html` 캐시 버전 갱신: PASS.

## 운영 보호
이번 작업은 branch/PR 검수 단계까지만 수행한다. 사용자 별도 운영 반영 승인 전에는 main 병합 및 GitHub Pages 배포를 하지 않는다.

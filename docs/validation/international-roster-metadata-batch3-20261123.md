# 국제 남자대표팀 선수 메타데이터 3차 전수 정리 — 2026-11-23

## 작업 순서
1. Volleybox 검색/누락 링크를 직접 선수 프로필로 검수·전환
2. 2026/27 현재 소속팀 overlay 보강
3. 소속 국가명·국기 매핑 정규화

## 범위
- 2026 남자 대표팀 국가 상세 원본: VNL, AVC 대륙선수권, AVC컵, 아시안게임
- 35개 국가, 57개 남자 2026 roster snapshot
- 실제 KVL 통합 알고리즘 결과: **586명**
- 원본 대회명단 행 합계: 796건

## 1. Volleybox 직접 링크

### VNL
- 선수 수: 284명 유지
- 직접 프로필: 135 → **279**
- 검색 링크: 149 → **5**
- 링크 없음 / invalid: 0

직접 링크 전환은 다음 근거만 허용했다.
- CEV / CSV / NORCECA MASTER의 동일 국가 + 동일 DOB + 신원 일치
- 다른 2026 대회의 동일 이름 + 동일 DOB + 동일 직접 Volleybox ID
- 공개 Volleybox 직접 프로필의 이름·DOB 교차 확인

### VNL 검색 링크 유지 5명
공식 VNL DOB와 Volleybox 또는 후속 MASTER DOB가 충돌하므로 직접 프로필을 강제 연결하지 않는다.
- Domenico Pace
- Lorenzo Cortesia
- Dimitar Dimitrov
- Berkay Bayraktar
- Murat Yenipazar

### 아시아 대회 원본 링크 보강
대회별 원본 명단에서도 VB→가 보이도록 exact name+DOB 근거가 있는 행만 보강했다.
- Asian Games: 인도 10명, 이란 Hossein Haji Kalateh, 파키스탄 Khizar Hayat
- AVC Continental: NZL Carrick Corson, Seth Grant, Thomas Vesty, Liam Chris Smith
- AVC Cup: Liam Chris Smith, Adam Al Jaradi
- 대만 Wang Ping Hsun의 기존 `/zh/` 직접 Volleybox URL을 공통 파서가 인식하도록 locale 규칙을 `/ko/` 전용에서 임의 2글자 locale로 일반화했다.

### 실제 국가 통합명단 기준
- 586명 중 직접 Volleybox: **549명**
- 검색 링크: **8명**
- 링크 없음: **29명**

링크 없음 29명은 주로 DOB가 없거나, 이름만으로는 동일인 확정이 어려운 키르기스스탄·카타르·뉴질랜드·바레인·홍콩 등의 일부 선수다. 근거 없이 연결하지 않는다.

### Naji Mahmoud fail-closed
Qatar Naji Mahmoud는 공개 DB에 서로 다른 DOB를 가진 Volleybox 프로필이 존재했다.
- p30740: 1994-12-16
- p131063: 1992-01-01
반면 Volleyball World 2026과 공식 아시안게임 자료는 **1992-12-16**으로 일치한다.

따라서 AVC Continental DOB는 공식값 1992-12-16으로 정정하고, Asian Games / AVC Continental / AVC Cup의 직접 Volleybox 연결은 검색 링크로 되돌렸다. AVC direct-link 보조 registry의 QAT #19 override도 삭제했다.

기존 인도 원본의 Erin Varghese(p133911), Shameemudheen Ammarambath(p133455) 대회 간 DOB 충돌은 이번 범위에서도 원본을 추정 수정하지 않고 fail-closed 상태를 유지한다.

## 2. 2026/27 현재 소속
- current-club registry: 133 → **361명**
- VNL 284명 중 현재 소속 확인: **270명**
- VNL 미확인: **14명**
- 실제 2026 남자 통합 586명 중 현재 소속 확인: **366명**
- 통합 미확인: **220명**

CEV·CSV·NORCECA·AVC·Asian Games MASTER와 직접 Volleybox 2026/27 시즌 행을 사용했다. `CONFIRMED` 또는 `REVIEWED` + HTTPS 근거가 있고 DOB가 충돌하지 않는 행만 overlay에 포함한다. 과거 대회 당시 원본 club 필드는 현재 소속으로 덮어쓰지 않는다.

추가 공개 검증 예:
- Julio Cesar Cardenas Morales → Al-Hilal VC
- Ožbi Slatinšek → OK Fužinar Ravne
- Vitalii Shchytkov → ON Hotels Alanya Belediyespor
- Liam Chris Smith → Bay of Plenty
- 미국: Micah Christenson, Taylor Averill, Torey Defalco, Andrew Rowan 등 2026/27 시즌 근거 확인
- 캐나다: Cory Schoenherr, Erik Siksna, Jackson Howe, Xander Ketrzynski 등 2026/27 시즌 근거 확인

최신 시즌 근거가 없는 Cole Hartke, Jeffrey Jendryk II, Cody Hudson 및 일부 저노출 국가 선수는 미확인으로 유지한다.

## 3. 소속국가·국기 정규화
- `leagueCountry` 한글값 `중국` 1건 → `China`
- 기존 4x3 국가 국기 자산을 사용하는 렌더러 매핑 추가:
  - Indonesia → id
  - Philippines → ph
  - Thailand → th
  - Vietnam → vn
  - New Zealand → nz
- 소속팀 전용 보조 국기:
  - 기존 Greece gr / Russia ru
  - 추가 Portugal pt / Romania ro / Spain es / Estonia ee / Azerbaijan az / Saudi Arabia sa
- current-club registry **361명 전수 검사 결과, 소속국가가 있는데 표시 가능한 국기 경로가 없는 행 0건**
- `leagueCountry`는 canonical English 값으로 통일하며 사용자 화면에서는 한국어 국가명을 표시한다.

## 보호 원칙
- 이름만으로 Volleybox ID를 추정하지 않는다.
- DOB 충돌은 fail-closed.
- 현재 소속은 별도 overlay로만 적용한다.
- 최신 시즌 근거가 없는 선수는 `미확인` 유지.
- 국제 국가 디렉터리의 기존 40개 국가카드 국기 세트는 변경하지 않는다.
- 추가 SVG는 소속팀 국가 표시 전용이다.

## QA 계약
- VNL 284 / direct 279 / search 5 / invalid 0
- 실제 2026 남자 통합 586 / direct 549 / search 8 / no-link 29
- current-club registry >= 361
- 실제 통합 current-club 366 / unknown 220
- `leagueCountry` 한글값 0
- current-club flag path 누락 0
- PC Chromium에서 Spain / Estonia / Romania / Portugal / Saudi Arabia / Azerbaijan + Indonesia / Thailand / Vietnam / New Zealand 국기 실제 decode
- `/zh/` 포함 localized Volleybox direct URL 정상 인식
- Naji Mahmoud ambiguous direct ID는 직접 연결하지 않음
- 기존 Japan/Iran/프로팀/회원 gate 회귀 없음

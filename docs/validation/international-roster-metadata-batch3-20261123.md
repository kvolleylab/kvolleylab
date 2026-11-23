# 국제 남자대표팀 선수 메타데이터 3차 전수 정리 — 2026-11-23

## 작업 순서
1. VNL의 `VB 검색`을 직접 Volleybox 선수 프로필로 전환
2. 2026/27 현재 소속팀 overlay 보강
3. 소속 국가명·국기 매핑 정규화

## 범위
- 2026 남자 대표팀 국가 상세 원본: VNL, AVC 대륙선수권, AVC컵, 아시안게임
- 35개 국가, 57개 남자 2026 roster snapshot
- 통합 신원 기준 약 592명

## 1. Volleybox 직접 링크
### VNL
- 선수 수: 284명 유지
- 직접 프로필: 135 → **279**
- 검색 링크: 149 → **5**
- invalid: 0

직접 링크 전환은 다음 근거만 허용했다.
- CEV / CSV / NORCECA MASTER의 동일 영문명 + 동일 DOB
- 동일 2026 대회에서 검증된 동일 Volleybox ID
- 공개 Volleybox 직접 프로필의 이름·DOB 대조

### 검색 링크 유지 5명
공식 VNL DOB와 Volleybox 또는 후속 MASTER DOB가 충돌하므로 강제 연결하지 않는다.
- Domenico Pace
- Lorenzo Cortesia
- Dimitar Dimitrov
- Berkay Bayraktar
- Murat Yenipazar

## 2. 2026/27 현재 소속
- current-club registry: 133 → **360명**
- VNL 284명 중 현재 소속 확인: **270명**
- VNL 미확인: **14명**
- 2026 남자 통합 약 592명 중 소속 확인: **375명**
- 통합 미확인: **217명**

대륙 MASTER와 직접 Volleybox 2026/27 시즌 행을 사용했고, `CONFIRMED` 또는 `REVIEWED` + HTTPS 근거가 있는 행만 overlay에 포함했다. 과거 대회 당시 원본 club 필드는 변경하지 않았다.

VNL에서 최신 시즌 근거가 확인되지 않는 선수는 미확인으로 유지한다. 현재 대표적인 미확인에는 Cole Hartke, Jeffrey Jendryk II, Cody Hudson, 일부 쿠바·중국 선수 등이 포함된다.

추가 공개 검증 예:
- Julio Cesar Cardenas Morales → Al-Hilal VC
- Ožbi Slatinšek → OK Fužinar Ravne
- Vitalii Shchytkov → ON Hotels Alanya Belediyespor
- 미국 다수: Micah Christenson, Taylor Averill, Torey Defalco, Andrew Rowan 등 2026/27 시즌 행 확인
- 캐나다 다수: Cory Schoenherr, Erik Siksna, Jackson Howe, Xander Ketrzynski 등 2026/27 시즌 행 확인

## 3. 소속국가·국기 정규화
- `leagueCountry`의 한글 `중국` 1건 → `China`
- 기존 40개 국가 국기 자산을 사용하는 매핑 추가:
  - Indonesia → id
  - Philippines → ph
  - Thailand → th
  - Vietnam → vn
- 소속팀 전용 보조 국기 추가:
  - Portugal pt
  - Romania ro
  - Spain es
  - Estonia ee
  - Azerbaijan az
  - Saudi Arabia sa
- 기존 보조 국기 Greece gr / Russia ru 유지
- current-club registry 360명 전수 검사 결과 **소속국가가 있는데 표시 가능한 국기 경로가 없는 행 0건**

## 보호 원칙
- 이름만으로 Volleybox ID를 추정하지 않는다.
- DOB 충돌은 fail-closed.
- 현재 소속은 대회 원본을 덮어쓰지 않고 overlay로만 표시.
- 최신 시즌 근거가 없는 선수는 `미확인` 유지.
- 국제 국가 디렉터리의 기존 40개 국가카드 국기 세트는 변경하지 않는다. 추가 6개 SVG는 소속팀 국가 표시 전용이다.

## QA 계약
- VNL 284 / direct 279 / search 5
- current-club registry >= 360
- `leagueCountry` 한글값 0
- club-country flag coverage 누락 0
- PC Chromium에서 Spain / Estonia / Romania / Portugal / Saudi Arabia / Azerbaijan + Indonesia / Thailand / Vietnam 국기 실제 decode
- 기존 Japan/Iran/프로팀/회원 gate 회귀 없음

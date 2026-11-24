# 국제 남자 현재 소속 VNL 보강 배치 8 — 2026-11-24

## 범위

배치 7 운영 반영 후 VNL 남자 current-club 미확인 18명을 마지막으로 재검수한다. 쿠바 4명과 불가리아 4명을 우선 확인하고, 이탈리아·캐나다·미국·세르비아·튀르키예·중국의 기존 보류 선수도 2026-11-24 기준 최신 공개 근거를 다시 확인한다.

과거 대회 roster snapshot의 소속 필드는 수정하지 않는다. 직접 Volleybox ID와 VNL DOB가 일치하고 2026/27 현재 소속 근거가 확인되는 선수만 `data/international/player-club-registry-2026-27-v1.json` overlay에 REVIEWED로 추가한다.

## 결과

- VNL 선수: 284명 유지
- current-club registry: 306 → 309명
- VNL current-club coverage: 266 → 269 / 284명
- Volleybox: direct 279 / search 5 / invalid 0 유지
- 신규 current-club: 3명
- 잔여 current-club 미확인: 15명
- VNL 원본 선수 수·등번호·포지션·Active/Reserve 상태·Volleybox 링크는 변경하지 않음

### 신규 3명

1. Boris Nachev p72294
   - DOB: 2004-04-22
   - current club: JV Gioia Del Colle
   - league country: Italy
   - league: Serie A2
   - 구단 공식 영입 발표와 2026년 11월 실경기 명단을 확인.
   - source: https://www.joyvolleypallavolo.com/dalla-superlega-arriva-il-centrale-bulgaro-boris-nachev/
   - current roster evidence: https://www.joyvolleypallavolo.com/joy-volley-arriva-il-terzo-successo-consecutivo-porto-viro-superata-3-1/

2. Lyuboslav Telkiyski p28895
   - DOB: 2001-08-24
   - current club: A.O. Foinikas Sýros
   - league country: Greece
   - league: Volley League
   - direct Volleybox identity/DOB와 2026-11-22 Foinikas 실제 선발 출전을 교차 확인.
   - identity source: https://volleybox.net/lyuboslav-telkiyski-p28895
   - current evidence: https://volleyweek.bg/en/article/28408-Valchinov-and-Telkiyski-complete-comeback-from-02-down-against-Aris-Angelov-plays-amid-unpaid-wages-scandal

3. Cody Hudson p180756
   - DOB: 2005-02-02
   - current club: Mount Royal University Cougars
   - league country: Canada
   - league: Canada West
   - direct Volleybox identity/DOB와 Mount Royal 공식 2026/27 roster를 교차 확인.
   - identity source: https://volleybox.net/cody-hudson-p180756
   - current roster: https://mrucougars.com/sports/mens-volleyball/roster

## 불가리아 재검수

- Boris Nachev: REVIEWED 반영.
- Lyuboslav Telkiyski: REVIEWED 반영.
- Denislav Bardarov: Halkbank의 2026/27 current club 자체는 최신 공개 roster에서 확인된다. 그러나 VNL은 아직 Volleybox search 링크이고, 직접 후보 p79752는 공개 DOB가 없어 기존 direct-link 승격 기준을 충족하지 않는다. current-club overlay가 direct Volleybox identity를 키로 사용하는 현 구조에서는 먼저 연결하지 않고 fail-closed 유지한다.
  - candidate: https://volleybox.net/denislav-bardarov-p79752
- Dimitar Dimitrov: Energa Indykpol AZS Olsztyn의 2026/27 영입 및 공식 DOB 2000-12-11은 확인되지만, Volleybox 후보 p60269의 DOB가 2000-11-12로 충돌한다. direct/overlay 모두 보류한다.

## 쿠바 4명 재검수

Drive NORCECA MASTER의 2026-09-21 UNKNOWN 상태를 보존하고 최신 시즌 근거를 다시 확인했다.

- Javier Octavio Concepcion Rojas p8305: 최신 공개 경력은 2025/26까지 확인되며 2026/27 새 소속을 확정하지 못함.
- Lazaro Yudiel Arrechea Najarro p8111: 최신 공개 경력은 2024/25까지 확인되며 2026/27 새 소속을 확정하지 못함.
- Nivaldo Nadhir Dias Gomez: VNL 신원은 확인되지만 검증 가능한 direct Volleybox 선수 프로필과 2026/27 current club을 확정하지 못함.
- Yonder Roman Garcia Alvarez p3555: 2026 Club World 공개 DB도 team이 TBD로 남아 있어 current club을 추정하지 않음.

4명 모두 fail-closed 유지.

## 기타 잔여 보류 재검수

- Domenico Pace p14438: KVL/공식 DOB 2000-08-02와 Volleybox DOB 충돌. 기존 보류 유지.
- Lorenzo Cortesia: KVL DOB와 Volleybox 후보 DOB 충돌. search 유지.
- Jeffrey Jendryk II p6000: 2025/26 이후 2026/27 새 소속 공식 확정 근거 부족.
- Kyle Dagostino p23898: Chaumont 합류 예정이 시즌 시작 전에 종료된 뒤 2026/27 current club 공식 확정 근거 부족.
- Nemanja Mašulović p15441: CEV 2026 European Cups 표기는 이전 2025/26 시즌 Allianz Milano 기록이다. Allianz Milano 2026/27 발표에서는 departure로 분류되며 새 팀을 확정하지 못함.
- Berkay Bayraktar: VNL DOB 1998-07-03 vs Volleybox 후보 p23861 DOB 1998-01-01 충돌.
- Murat Yenipazar p3191: VNL DOB 1993-01-01 vs direct Volleybox/공식 DOB 1993-09-23 충돌.
- Zhai Wu p35907 / Zongshuai Qu p27738: 중국 대표팀 공식 자료의 등록 지역은 확인되지만 이를 2026/27 current club으로 단정하지 않음.

## Drive MASTER 대조

- CEV MASTER: Denislav Bardarov의 Halkbank 2026/27 표기가 확인되나 direct Volleybox DOB 검증 기준을 충족하지 않아 overlay는 보류.
- CEV MASTER: Nemanja Mašulović는 기존부터 26/27 새 소속 미확인으로 기록되어 있으며 최신 Allianz 발표와도 모순되지 않음.
- NORCECA MASTER: Lazaro Arrechea, Yonder Garcia 등 쿠바 잔여 선수는 2026-09-21 당시 current club UNKNOWN. 최신 검수에서도 확정 근거가 생기지 않아 그대로 유지.
- Drive 원본 파일은 수정하지 않음.

## 표시 보완

Cody Hudson의 Canada current club 추가로 통합명단 상세 국가 라벨에서 Canada emoji 매핑 누락이 드러났다. 팀명단 표준 렌더러는 이미 Canada `ca.svg`를 지원하므로, 통합명단 `LEAGUE_FLAGS`에 `Canada: 🇨🇦`만 추가한다. 기존 국가·국기 자산 구조는 변경하지 않는다.

## 검증 목표

- registry count >= 309
- VNL current-club coverage >= 269 / 284
- direct Volleybox 279 / search 5 유지
- Boris / Lyuboslav / Cody exact current-club fields 확인
- Denislav / Dimitar / Nemanja / Murat / Berkay fail-closed 유지
- PC 1440에서 불가리아·캐나다 current club 및 league-country flag 실제 렌더링 확인
- 공개 JSON manifest SHA-256 exact match
- 기존 International Unified Roster 회귀 테스트 및 Quality Audit에서 신규 회귀 없음 확인

## 보호

Base: `a3b778559b9c2ac48ff1e2cd7c07805b090258ac`  
Branch: `feature/international-current-club-vnl-batch8-v1`

사용자 별도 승인 전 main 병합 및 운영 배포 금지.

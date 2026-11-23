# 국제 남자 현재 소속팀 보강 3차 — 2026-11-23

## 목적
Volleybox 직접 프로필 보강 1단계 뒤, 동일 선수의 2026/27 현재 소속이 이미 검수된 자료를 KVL current-club overlay에 연결한다.

## 근거와 승인 기준
- CEV·CSV·NORCECA 2026 MASTER에서 영문명+DOB가 VNL과 exact match.
- 해당 MASTER에서 26/27 소속 상태가 확정/REPORTED이고 직접 Volleybox ID가 동일한 경우 52명 추가.
- 미국·캐나다는 2026/27 Volleybox 선수/팀 페이지 및 실제 시즌 로스터·경기에서 현재 소속을 확인한 17명을 추가.
- 모든 항목은 공개 HTTPS source, 직접 Volleybox ID, DOB를 보존한다.
- 대회 당시 원본 club 필드는 덮어쓰지 않고 current-club registry overlay만 갱신한다.

## 결과
- current-club registry: 133 → **202명** (+69)
- VNL 284명 중 current-club overlay 적용 가능: 108 → **177명**
- VNL current-club 미확인: 176 → **107명**

## 주요 추가 예시
- USA: Erik Shoji → Berlin Recycling Volleys; Jake Hanes → Olympiakós; Merrick McHenry → Gas Sales Bluenergy Piacenza; Torey Defalco → JTEKT Stings Aichi; Micah Ma'a → Galatasaray Madeş Mobilya.
- CAN: Xander Ketrzynski → Incheon Korean Air Jumbos; Jackson Howe → Cucine Lube Civitanova; Pearson Eshenko → AO Floísvos; Skyler Varga → Toray Arrows Shizuoka; Jackson Young → Altekma SK.
- FRA: Antoine Brizard → Osaka Bluteon; Stephen Boyer → JTEKT Stings Aichi; Trevor Clevenot → Ziraat Bankkart Ankara.
- SLO: Alen Pajenk/Jani Kovačič/Rok Bračko/Tine Urnaut/Uroš Planinšič/Luka Marovt → ACH Volley Ljubljana 등.
- BUL: Aleksandar Nikolov/Simeon Nikolov → Cucine Lube Civitanova; Martin Atanasov → Olympiakós.

## 표시 원칙
- current-club registry에 없는 선수는 계속 `미확인`으로 둔다.
- leagueCountry는 표시 렌더러가 사용하는 영문 정규값으로 저장한다.
- MASTER 확인일은 CEV 2026-09-22, NORCECA 2026-09-21을 유지한다.
- 웹 최신 검수 배치는 2026-11-23으로 기록한다.

## 다음 단계
소속 데이터는 맞지만 로컬 국기 자산이 없는 Spain·Estonia·Romania·Portugal와 비정규 국가값 `중국`을 별도 국가·국기 정규화 단계에서 보완한다.

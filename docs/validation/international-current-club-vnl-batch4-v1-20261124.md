# 국제 남자 현재 소속 VNL 보강 배치 4 — 2026-11-24

## 원칙
대회 당시 roster snapshot은 수정하지 않는다. 이미 직접 Volleybox 프로필로 연결된 선수 중 KVL DOB와 신원이 일치하고, 2026/27 현재 시즌의 공식 리그·구단·대학 또는 최신 공개 팀 로스터에서 소속이 확인되는 경우만 current-club overlay에 REVIEWED로 추가한다.

## 반영 8명
| VB ID | 선수 | 현재 소속 | 국가 | 근거 |
|---|---|---|---|---|
| 27593 | Brodie Hofer | Jastrzębie Barkom | Poland | https://www.tauronliga.pl/players/id/369/tour/53/section/playersByTeam/nocookies/1.html |
| 26700 | Luke Herr | AONS Milon Athens | Greece | https://cev.eu/team/13161-aons-milon-nea-smyrni-athens/player/83370-herr-luke |
| 216089 | Quintin Greenidge | Hawaii Univ. | USA | https://hawaiiathletics.com/sports/mens-volleyball/roster/2027 |
| 91503 | Henri Leon | Gas Sales Bluenergy Piacenza | Italy | https://www.gassalespiacenza.it/giocatore/henri-leon/ |
| 76868 | Thomas Pujol | Alterna Stade Poitevin | France | https://volleybox.net/alterna-stade-poitevin-t1858 |
| 72170 | Alessandro Alberto Bovolenta | Gas Sales Bluenergy Piacenza | Italy | https://en.volleyballworld.com/volleyball/competitions/superlega/players/182409 |
| 28911 | Paolo Porro | Gas Sales Bluenergy Piacenza | Italy | https://en.volleyballworld.com/volleyball/competitions/superlega/players/172961 |
| 24845 | Leandro Ausibio Mosca | MA Acqua S.Bernardo Cuneo | Italy | https://cuneovolley.it/prima-squadra/giocatori |

## Google Drive MASTER 대조
- KVL_국제대회_선수마스터_v1은 현재 샘플 행만 있는 템플릿 상태라 이번 8명과 충돌하는 등록값이 없다.
- KVL_2026_NORCECA_Mens_Continental_Championship_선수명단_MASTER의 Luke Herr는 2026-09-21 확인 당시 2026/27 소속 UNKNOWN으로 기록되어 있다. 이번 배치는 2026-11-24 기준 CEV 2027 European Cups의 AONS Milon ATHENS 현재 선수 페이지로 더 최신 근거를 보강한다.
- CEV/NORCECA MASTER에 없는 VNL 선수는 Drive에 없는 값을 임의 생성하지 않고 현재 시즌 공개 로스터 근거만 overlay에 사용한다.

## 보류
- Cody Hudson (VB p180756): KVL DOB 2005-02-02와 프로필 신원은 맞지만 공개 경력이 Mount Royal Univ. 2024/25에서 끝나 현재 2026/27 소속 근거가 부족해 제외.
- Domenico Pace (VB p14438): KVL 및 Piacenza 공식 DOB는 2000-08-02이나 현재 Volleybox 프로필은 2000-10-02로 표시되어 DOB 충돌 상태. 소속은 Piacenza로 공식 확인되지만 이번 exact-identity 배치에서는 fail-closed로 제외.
- 기존 VNL 검색 링크 6명과 Ilija Ivović 등 선행 DOB 충돌 보류 건은 변경하지 않는다.

## 결과
- current-club registry: 217명 → 225명
- 대회 원본 roster snapshot 변경 없음
- 신규 8명은 REVIEWED + HTTPS 공개 근거 보유
- Cody Hudson·Domenico Pace는 강제 연결하지 않음
- Base: 2271ed94f980dde108beeb754356954b42f4cf67
- Branch: feature/international-current-club-vnl-batch4-v1

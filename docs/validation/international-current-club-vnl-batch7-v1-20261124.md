# 국제 남자 현재 소속 VNL 보강 배치 7 — 2026-11-24

## 범위
배치 6 운영 반영 후 남은 direct Volleybox current-club 미확인 중 튀르키예·일본·폴란드·브라질·슬로베니아·독일·우크라이나를 순서대로 재검수했다. 대회 당시 roster snapshot은 변경하지 않고 2026/27 최신 구단·리그·연맹 로스터가 확인되는 선수만 overlay에 REVIEWED로 추가한다.

## 결과
- current-club registry: 277 → 306명
- VNL current-club coverage: 237 → 최소 266명 / 284명
- 신규 current-club: 29명
  - Türkiye 5
  - Japan 4
  - Poland 4
  - Brazil 4
  - Slovenia 4
  - Germany 4
  - Ukraine 4
- VNL Volleybox 링크 자체는 변경하지 않음
- 신규 29명은 기존 VNL direct Volleybox ID 기반이며 KVL DOB와 registry DOB를 동일하게 유지

## 보류
### Murat Yenipazar — p3191
- KVL VNL DOB: 1993-01-01
- Volleybox p3191 및 Halkbank/에이전시 공개 DOB: 1993-09-23
- current club은 Halkbank로 확인되지만 identity DOB가 충돌하므로 registry overlay에 넣지 않는다.
- 별도 DOB 정정 검수 없이 current-club만 먼저 연결하지 않는다.

### Berkay Bayraktar — search 유지
- KVL VNL DOB: 1998-07-03
- current club Ziraat Bankkart는 CEV 2027/VolleyballTV에서 확인.
- Volleybox 후보 p23861은 birthdate 1998-01-01로 KVL과 충돌.
- direct Volleybox 승격 및 registry overlay 모두 fail-closed 유지.

## 국가별 반영

### Türkiye 5명
- Ahmet Samet Baltaci p52285 → Halkbank Spor Kulübü
- Bedirhan Bülbül p10751 → Fenerbahçe Medicana
- Beytullah Hatipoglu p45733 → Fenerbahçe Medicana
- Berk Dilmenler p33360 → Altekma SK
- Ömercan Burak Karahan p118641 → Halkbank Spor Kulübü

### Japan 4명
- Akihiro Fukatsu p2818 → Tokyo Great Bears
- Masato Kai p82735 → Osaka Bluteon
- Motoki Eiro p26358 → Hiroshima Thunders
- Kentaro Takahashi p8347 → JTEKT STINGS Aichi

### Poland 4명
- Bartlomiej Boladz p790 → Aluron CMC Warta Zawiercie
- Bartlomiej Lemanski p3633 → PGE Projekt Warszawa
- Marcel Bakaj p147770 → Stal Nysa
- Jakub Kochanowski p2597 → Aluron CMC Warta Zawiercie

### Brazil 4명
- Adriano Fernandes P.X.Cavalcante p29045 → Itas Trentino
- Douglas Pureza p5231 → SESI Bauru
- Lucas Adriano Araújo Barreto p7361 → SESI Bauru
- Matheus Silva Gonçalves p5860 → Sada Cruzeiro Vôlei

### Slovenia 4명
- Tonček Štern p4311 → ACH Volley Ljubljana
- Jošt Kržič p104246 → ACH Volley Ljubljana
- Ožbi Slatinšek p275333 → OK Fužinar Ravne
- Valentin Predan p237253 → OK i-Vent Maribor

### Germany 4명
- Eric Burggräf p25303 → VK ČEZ Karlovarsko
- Filip John p28935 → Shinshu Matsumoto Tridents
- Jan Zimmermann p2691 → ZAKSA Kędzierzyn-Koźle
- Leonard Graven p49188 → VfB Friedrichshafen

### Ukraine 4명
- Illa Kovalov p17268 → Stilon Gorzów
- Maksym Drozd p17062 → Epicentr - Podolyany Horodok
- Vitalii Shchytkov p5636 → On Hotels Alanya Belediyespor
- Oleksandr Nalozhnyi p26079 → Epicentr - Podolyany Horodok

## Drive MASTER 대조
- CEV MASTER의 Ahmet Samet Baltacı, Bartłomiej Bołądź, Bartłomiej Lemański 등 기존 확정값은 현재 시즌 공개 로스터와 일치.
- CEV MASTER에서 9월 당시 Leonard Graven, Maksym Drozd 등 일부가 26/27 미확인으로 남아 있었으나, 11월 DVV/CEV/리그의 최신 current roster로 재확인했다.
- AVC MASTER의 일본 일부 선수는 당시 대회 최종 14인 중심이라 VNL 후보 전체를 포함하지 않으므로, 최신 SV.League roster를 우선한다.
- CSV MASTER의 Matheus Gonçalves는 Sada Cruzeiro 2026/27 CONFIRMED 상태와 최신 VolleyballTV가 일치한다.
- Drive 원본은 수정하지 않고 current-club overlay만 최신화한다.

## 병합 후 Audit 참고
main의 KVL Quality Audit #486은 PASS 117 / FAIL 5로 종료됐으며, 직전 main #484와 동일한 전역 실패군(workflow-safety, security:json, home-gender-matches, vleague-rosters, player-integration)이다. 배치 6 전용 international roster QA는 SUCCESS였으므로 이 전역 백로그와 batch 7 검증을 분리한다.

## 보호
Base: `688cb36bcb06b9689ca7d2780eee29477b38fd06`
Branch: `feature/international-current-club-vnl-batch7-v1`

Node/source regression, public export gate, Chromium PC/mobile QA 이후 READY FOR REVIEW로 올린다. 사용자 별도 승인 전 main 병합/운영 배포 금지.

# 국제 남자 VNL Volleybox 직접 링크 전수 보강 1차 — 2026-11-23

## 목적
2026 남자대표팀 국가 상세에서 `VB 검색`으로 남아 있던 VNL 선수 149명을 재검수하고, 선수 신원이 확정되는 경우만 직접 Volleybox 선수 프로필로 승격한다.

## 원칙
- 영문명만으로 연결하지 않는다.
- VNL DOB와 Volleybox DOB가 일치하는 경우를 기본 승인 조건으로 한다.
- CEV·CSV·NORCECA 2026 MASTER의 영문명+DOB exact match를 보조 근거로 사용한다.
- 동명이인 또는 DOB 충돌은 검색 링크를 유지한다.
- 프로필에 DOB가 없거나 직접 선수페이지가 확인되지 않으면 검색 링크를 유지한다.
- VNL 참가 선수 수·등번호·포지션·엔트리 상태·공식 VNL 프로필은 변경하지 않는다.

## 결과
- VNL 선수: 284명 유지
- 직접 Volleybox: 135 → **277명**
- 검색 링크: 149 → **7명**
- invalid URL: **0명**
- 이번 배치 직접 승격: **142명**

## 검색 링크 유지 7명
1. Lorenzo Cortesia — KVL DOB `1999-07-26`, Volleybox p7060 DOB `1999-09-26` 충돌.
2. Berkay Bayraktar — KVL DOB `1998-07-03`, Volleybox p23861 DOB `1998-01-01` 충돌.
3. Dimitar Dimitrov — KVL DOB `2000-12-11`, Volleybox p60269 DOB `2000-11-12` 충돌.
4. Pablo Sergio Koukartsev — p263178 직접 프로필은 있으나 DOB가 공개되어 있지 않아 동일 인물 확정 근거 부족.
5. Denislav Bardarov — p79752 이름은 확인되나 Volleybox 공개 프로필에서 DOB 확인 불가.
6. Julio Cesar Cardenas Morales — 검색 결과에서 사용자 계정만 확인되고 검증 가능한 `-p####` 선수 프로필을 확정하지 못함.
7. Nivaldo Nadhir Dias Gomez — 검증 가능한 직접 선수 프로필을 확정하지 못함.

## 대표적으로 확인한 직접 프로필
- USA: Erik Shoji p1222, Jake Hanes p45744, Micah Christenson p1244, Torey Defalco p2330, Cole Hartke p216308
- CAN: Luke Herr p26700, Xander Ketrzynski p23662, Pearson Eshenko p4381
- FRA: Antoine Brizard p5216, Stephen Boyer p2525, Trevor Clevenot p1795
- BUL: Aleksandar Nikolov p33775, Simeon Nikolov p79734, Boris Nachev p72294
- SLO: Tine Urnaut p1136, Rok Možič p32231, Jošt Kržič p104246
- CUB: Miguel Angel Lopez Castro p6623, Marlon Yant Herrera p8301, Daniel Martinez Campos p144908
- CHN: Baoqi Yang p146462, Changli Wang p195445, Zhihong Xue p37205

## 데이터 보호
이번 변경은 `data/competitions/vnl-men-2026/data.json`의 Volleybox URL과 link type만 보강한다. 현재 소속팀 보강은 다음 단계의 `player-club-registry-2026-27-v1.json` 작업으로 분리한다.

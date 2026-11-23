# 국제 소속팀 국가·국기 정규화 v1 — 2026-11-23

## 목적
현재 소속팀 데이터가 맞더라도 소속 리그 국가의 로컬 SVG가 없거나 국가명이 비정규 값이면 국기가 비거나 잘못 보일 수 있다. 국제 국가카드의 엄격한 40개 국기 세트는 유지하면서 소속팀 표시 전용 자산을 보강한다.

## 문제 확인
- Spain: Martin Ramos, Tobias Krick
- Estonia: Beau Graham
- Romania: Stefan Negic, Sašo Štalekar, Serhii Yevstratov
- Portugal: Yongzhen Li
- Yurii Synytsia: `leagueCountry: 중국` → renderer가 ISO2를 해석하지 못함
- Greece/Russia는 앞선 PR #403에서 club 전용 SVG를 이미 보강함.

## 변경
1. `assets/images/flags/club/es.svg`, `ee.svg`, `ro.svg`, `pt.svg` 추가.
   - 기존 프로젝트가 사용하는 flag-icons와 동일한 upstream MIT 자산을 사용한다.
2. `kvl-team-roster-standard-v1.js`
   - Estonia → `ee`, 한국어 `에스토니아` 추가.
   - 아시아 current-club 확장 대비 `Indonesia/id`, `Thailand/th`, `Kazakhstan/kz`, `Uzbekistan/uz`, `Vietnam/vn` 및 한국어 표시명을 추가한다. 해당 SVG는 기존 40개 국가카드 자산을 재사용한다.
   - club 전용 supplemental flag 경로를 `gr/ru/es/ee/ro/pt`로 확장.
3. current-club registry
   - Yurii Synytsia의 `중국`을 표준값 `China`로 정규화.
4. `teams.html` cache version 갱신.

## 보호 원칙
- 국제 국가 디렉터리 40개 `assets/images/flags/4x3` 집합은 변경하지 않는다.
- 선수 소속팀/리그 자체는 이번 단계에서 새로 추정하지 않는다.
- 기존 Greece/Russia 처리와 동일한 club-only 자산 방식을 따른다.

## 검증
- club-only SVG 6개(gr, ru, es, ee, ro, pt)가 존재하고 active content가 없는지 확인.
- renderer가 각 supplemental 국가에 올바른 club-only 경로를 사용하는지 확인.
- Indonesia·Thailand·Kazakhstan·Uzbekistan·Vietnam은 기존 `4x3` 국기 자산과 ISO2 매핑이 모두 존재하는지 확인.
- Yurii Synytsia의 leagueCountry가 `China`인지 확인.

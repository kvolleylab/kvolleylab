# 국제 선수 소속국가 국기·국가명 정규화 v1 — 2026-11-23

## 작업 목적
국제 대표팀 통합명단의 현재 소속팀은 맞지만, 소속 국가가 KVL 국제 국가카드의 40개 국기 세트 밖에 있거나 국가명 표기가 통일되지 않아 국기가 비는 문제를 전수 보정한다.

## 확인된 문제
- 기존 소속국가 중 Spain, Romania, Portugal, Estonia는 `COUNTRY_ISO2` 일부 매핑이 있어도 KVL 국제 국가카드 전용 40개 `assets/images/flags/4x3` 세트에 SVG가 없어 클럽 국기가 로드되지 않았다.
- 2단계 current-club 보강으로 Indonesia, Kazakhstan, Thailand, Uzbekistan, Vietnam 소속이 추가됐지만 roster standard 렌더러에 국가 코드/한국어 이름 매핑이 없었다.
- Yurii Synytsia의 Hebei Baoding Wolves 소속국가가 `중국`으로 저장돼 있어 `China` 기반 공통 매핑을 타지 못했다.

## 변경
1. `assets/js/kvl-team-roster-standard-v1.js`
   - 국가 매핑 추가: Estonia→ee, Kazakhstan→kz, Indonesia→id, Thailand→th, Uzbekistan→uz, Vietnam→vn.
   - 한국어 국가명 추가: 에스토니아/카자흐스탄/인도네시아/태국/우즈베키스탄/베트남.
   - 리그 표시 추가: Indonesian Proliga, Kazakhstan League, Qatar League, Thailand League.
   - 이 네 리그는 확인된 1부 리그로 표시한다.
2. 소속팀 전용 국기
   - `assets/images/flags/club/es.svg`
   - `assets/images/flags/club/ro.svg`
   - `assets/images/flags/club/pt.svg`
   - `assets/images/flags/club/ee.svg`
   - 원본은 기존 KVL 국기 자산과 같은 lipis/flag-icons 4x3 SVG다.
3. 기존 40개 국제 국가카드 국기 세트는 수정·확장하지 않는다.
   - Indonesia/Kazakhstan/Thailand/Uzbekistan/Vietnam/China는 이미 존재하는 4x3 자산(id/kz/th/uz/vn/cn)을 재사용한다.
4. `data/international/player-club-registry-2026-27-v1.json`
   - Yurii Synytsia의 `leagueCountry`: `중국` → `China`.
   - 선수 신원·소속팀·DOB는 변경하지 않는다.
   - 레지스트리 총 217명 유지.
5. `teams.html`
   - team roster standard 캐시 버전 → `20261123-club-country-flags-v2`.

## 브라우저 검증 계약
PC 격리 Chromium 및 운영 Live QA에서 다음 클럽의 국기를 실제 decode한다.
- Club Voleibol Guaguas → Spain → club/es.svg
- Bigbank Tartu → Estonia → club/ee.svg
- SCM Universitatea Craiova → Romania → club/ro.svg
- Sporting CP → Portugal → club/pt.svg
- Hebei Baoding Wolves → China → 4x3/cn.svg
- Jakarta Bhayangkara Presisi → Indonesia → 4x3/id.svg
- VK Aktobe → Kazakhstan → 4x3/kz.svg
- Nakhon Ratchasima 3M Films VC → Thailand → 4x3/th.svg
- UZTELECOM → Uzbekistan → 4x3/uz.svg
- Biên Phòng MB → Vietnam → 4x3/vn.svg

## 보호 원칙
- 현재 소속팀 자체를 추정하거나 변경하지 않는다.
- 국제 국가카드용 40개 승인 국기 세트는 그대로 보존한다.
- 소속국가가 국가카드 범위 밖이면 `flags/club` 보조 자산만 사용한다.
- 선수/대회 원본 roster snapshot은 수정하지 않는다.

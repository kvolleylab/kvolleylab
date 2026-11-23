# 이란 대표팀 선수 링크·현재 소속·클럽 국기 보정 v1 — 2026-11-23

## 사용자 요청
- Mohsen Delavari의 Volleybox 검색 링크를 선수 직접 프로필 링크로 교체한다.
- 같은 프로필에 확인되는 2026/27 현재 소속팀을 KVL 현재 소속 overlay에 반영한다.
- Ali Haghparast의 Panionios Betsson 소속 국가가 Greece임에도 국기 표시가 잘못되는 문제를 보정한다.

## 확인 근거
- Mohsen Delavari 직접 프로필: https://volleybox.net/mohsen-delavari-p222609
  - DOB: 2001-11-03
  - Position: Opposite
  - 2026/27 club: Yaroslavich Yaroslavl
- Yaroslavich Yaroslavl: https://volleybox.net/yaroslavich-yaroslavl-t2002?season_id=127
  - Country: Russia
  - 2026/27: Russian Superleague
- Ali Haghparast 직접 프로필: https://volleybox.net/ali-haghparast-p155347
  - 2026/27 club: Panionios Betsson
- Panionios Betsson: https://volleybox.net/panionios-t4110?season_id=127
  - Country: Greece

## 변경
1. `data/competitions/vnl-men-2026/data.json`
   - Mohsen: `VB 검색` → `https://volleybox.net/mohsen-delavari-p222609`
   - link type: `search` → `profile`
   - VNL 284명은 유지. 직접 VB 135 / 검색 149 / invalid 0.
2. `data/international/player-club-registry-2026-27-v1.json`
   - Volleybox ID `222609` 추가.
   - Yaroslavich Yaroslavl / Russia / Russian Superleague / REVIEWED.
   - 전체 current-club registry 133명.
3. `assets/js/kvl-team-roster-standard-v1.js`
   - Russia ISO2/한국어/리그명을 추가한다.
   - 소속국가 국기 중 국제 국가카드 40개 자산에 없는 Greece/Russia는 별도 club-flag SVG를 사용한다.
4. `assets/images/flags/club/gr.svg`, `ru.svg`
   - 국제 국가 디렉터리의 엄격한 40개 SVG 세트는 건드리지 않고 소속팀 국가 표시에만 사용한다.
5. `teams.html`
   - team-roster-standard JS 캐시 버전을 갱신한다.

## 보호 원칙
- 대회 당시 원본 club 필드를 현재 소속으로 덮어쓰지 않는다.
- 현재 소속은 별도 current-club registry overlay로만 적용한다.
- 동일 인물 확인은 직접 Volleybox ID와 DOB가 일치한 경우만 허용한다.
- 국제 국가 디렉터리 40개 자체 국기 자산 수와 구조는 변경하지 않는다.

## 화면 검증 계약
- Ali Haghparast: `Panionios Betsson` + `그리스 · 발리리그 (1부)` + 실제 `club/gr.svg` 디코딩.
- Mohsen Delavari: `Yaroslavich Yaroslavl` + `러시아 · 러시아 수페르리가 (1부)` + 실제 `club/ru.svg` 디코딩.
- Mohsen의 VB 버튼은 `VB->`이며 href가 직접 프로필 `p222609`여야 한다.

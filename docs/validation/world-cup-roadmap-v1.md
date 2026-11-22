# FIVB 월드컵 · 로드맵 통합 v1 검토

검증일: 2026-11-18 (KST)  
기준 main: `22f67b13b08ff7c1c0632c7c84b2f8fef3d869f5`  
상태: 2026-11-18 당시 검토용 프로토타입 기록. 2026-11-22 사용자 운영 반영 승인과 개최국 추가는 [운영 검증 기록](olympic-world-cup-host-release-v1.md)을 따른다.

## 변경 내용

- 로드맵의 `2027 FIVB 월드컵 3장`을 간편 펼침으로 연결했다. 남녀별 개최지·기간·한국 참가 경로·조 추첨 상태·올림픽 출전권 3자리를 표시한다.
- 기존 `fivb-world-cup-2027.html` 주소와 공통 내비게이션을 유지했다. 32개 참가국, 참가 경로, 기존 올림픽 출전권 확보국, 공식 여자 조 편성을 추가했다.
- 요약에서 상세 페이지를 왕복해도 남녀 선택을 유지한다. 기존 `#menPanel`, `#womenPanel` 북마크도 지원한다.
- 월드컵 우승국, 월드컵 참가 확정, 실제 참가, LA28 출전권 확보를 별도 필드로 관리한다. 미래 결과는 빈 원과 `결과 미확정`으로 표시한다.
- 출전권 수량은 올림픽 주기 JSON에서 읽는다. 2032 규정 미발표 시 LA28 숫자와 월드컵 패널을 노출하지 않는다.

## 공식 자료 대조

| 항목 | 남자 | 여자 |
|---|---|---|
| 대회 | 2027 FIVB 남자 월드컵 | 2027 FIVB 여자 월드컵 |
| 개최 | 폴란드 | 미국·캐나다 |
| 기간 | 2027.09.10–09.26 | 2027.08.20–09.05 |
| 참가 확정 | 32개국 · 한국 포함 | 32개국 · 한국 포함 |
| 한국 경로 | 2026 아시아선수권 3위 | 2026.10.02 세계랭킹 기준 |
| 조 편성 | 2026.12.03 추첨 예정 · 시작 시각 확인 전 | 2026.10.26 추첨 완료 |
| 한국 조 | 미확정 | B조: 브라질·체코·케냐·대한민국 |
| LA28 월드컵 배정 | 기확보국 제외 최종 순위 상위 3개국 | 동일 |
| 한국 LA28 상태 | 아직 미확보 | 아직 미확보 |

월드컵 1~3위에 무조건 3장을 주는 방식으로 표현하지 않는다. 미국은 개최국으로 이미 출전권을 확보했으며, 대륙선수권 우승국과 출전권 획득국이 다를 수 있다. 기존 대륙선수권의 검증된 `qualification` 데이터를 공유해 이 중복을 처리한다.

## 보존 및 검증

- 역사 데이터 62개, 역사 CSS·JS·모델, 대륙선수권 데이터·모듈은 기존 main과 동일하다. 로드맵의 역사 `<main>`도 그대로 유지했다.
- Node 테스트 34개 통과: 기존 25개 + 월드컵 9개. 중복 참가국, 출처 누락, 잘못된 조 구성, 미래 결과 입력, 기확보국 재배정, 2032 오노출을 검사한다.
- 합성 테스트의 대회 종료 결과는 테스트 안에만 존재한다. 실제 JSON에는 미래 우승국·출전권 획득국을 입력하지 않았다.
- 실제 Chromium PC와 390px·360px 너비 프레임에서 확인했다. 모바일 실기기 검증은 아니다. 가로 넘침 없음, 남녀 전환, 상세 왕복, 접기·Enter 열기, 기존 대륙선수권 연결을 확인했다.
- 필터 결과: 전체 62 / 핵심 대회 37 / 올림픽 16 / 진출 실패 17. 2026년 접기·펼치기 정상.
- 2032 전환: `공식 출전 규정 발표 전`, 배정 카드 0개, 월드컵 패널 0개, 역사 기록 62개.

## 기존 데이터와의 연결

`data/olympics/la2028_v1.json`의 `worldCupOverview`가 새 월드컵 JSON을 가리킨다. 출전권 수량은 같은 주기의 `rules.allocation`을 사용하고, 기확보국은 기존 `la2028-continentals-v1.json`의 출전권 결과를 재사용한다. 역사 DB와는 별도 모듈이며 역사 기록을 덮어쓰지 않는다.

기존 Google Drive `국가대표팀_국제대회_출전권_MASTER`(최종 수정 2026-07-25)는 구 명칭·한국 참가 미확정 상태가 남아 있다. 이번에는 읽기 대조만 했으며 수정·동기화하지 않았다. 기존 공개 개요 페이지를 확장한 것으로, 대회 Engine·MASTER 정식 등록이나 자동 수집 완료를 의미하지 않는다.

## 미확인 및 후속 항목

- 남자 조 추첨 결과·시작 시각, 한국 경기별 세부 일정, 선수명단은 이번 검증 범위에서 확정하지 않았다.
- 2027 최종 순위·우승국·LA28 월드컵 출전권 3개국은 대회 종료 후 공식 결과로 갱신해야 한다.
- MASTER 명칭·참가 상태 정정, 정식 대회 ID 등록, 경기·명단 자동 수집 연결은 별도 작업이다.
- 운영 반영은 사용자 검수 이후 진행한다. 기존 `/la28-volleyball-qualification.html` URL은 변경하지 않는다.

## 변경 파일

기존: `olympic-roadmap.html`, `fivb-world-cup-2027.html`, `assets/js/olympic-qualification-summary-v1.js`, `data/olympics/la2028_v1.json`.

추가: `assets/css/world-cup-overview-v1.css`, `assets/js/world-cup-model-v1.mjs`, `assets/js/world-cup-ui-v1.js`, `assets/js/world-cup-selector-v1.js`, `assets/js/world-cup-page-v1.js`, `data/national/fivb-world-cup-2027-v1.json`, `tests/world-cup-v1.test.mjs`.

기록: 이 검토 문서, `docs/KVL_DECISION_LOG.md`, `scripts/quality_audit/public-review-manifest.json`.

검토 사이트의 링크 보정 스크립트·모바일 QA 프레임·리디렉트 index는 운영 변경에 포함하지 않는다. 검토 범위 밖의 메뉴는 기존 운영 사이트로 연결한다.

## 공식 출처

출처별 확인일·주장별 source ID는 `data/national/fivb-world-cup-2027-v1.json`에 저장했다. 기존 규정·명칭 변경 출처의 과거 확인일은 새로 확인한 것처럼 덮어쓰지 않았다.

- [남자 32개 참가국](https://en.volleyballworld.com/news/the-field-is-set-32-teams-bound-for-the-2027-fivb-men-s-volleyball-world-cup-in-poland)
- [남자 조 추첨 일정](https://en.volleyballworld.com/news/designed-for-the-world-stage-2027-men-s-world-cup-unveils-its-official-logo)
- [여자 32개 참가국](https://en.volleyballworld.com/news/qualified-teams-confirmed-for-the-2027-fivb-volleyball-women-s-world-cup)
- [여자 공식 조 편성](https://www.fivb.com/2027-fivb-womens-volleyball-world-cup-pools-revealed-during-global-draw/)
- [LA28 남자 기확보국](https://en.volleyballworld.com/news/la-2028-men-s-volleyball-who-qualified-so-far)
- [LA28 여자 기확보국](https://en.volleyballworld.com/news/la-2028-women-s-volleyball-six-down-six-to-go)
- [FIVB LA28 출전권 규정](https://www.fivb.com/volleyball-and-beach-volleyball-qualification-systems-for-la28-olympic-games-confirmed/)
- [IOC 규정 PDF](https://stillmed.olympics.com/media/Documents/Olympic-Games/LA28/VVO-LA28-Qualification-System.pdf)
- [2027 월드컵 명칭 변경](https://www.fivb.com/the-fivb-volleyball-world-cup-takes-the-sport-into-a-new-era/)

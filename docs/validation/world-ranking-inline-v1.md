# LA28 세계랭킹 간편 안내 v1

검증일: 2026-11-22 · Base: `72cf2830536e5d73301f515201d36fa1b21acdfd` · Branch: `feature/world-ranking-inline-v1`.

Status: IMPLEMENTED / LOCAL QA VERIFIED. 사용자의 운영 반영 지시에 이어 “2028 fivb 세계랭킹에 대한것도 만들어줘” 요청을 같은 운영 연결 범위로 적용한다. 병합·Pages·실제 운영 확인은 PR에 기록하며 그 전에는 DEPLOYED로 표기하지 않는다.

## 동작과 변경 범위

- 로드맵의 네 번째 `2028 FIVB 세계랭킹 3장` 카드가 같은 페이지에서 열린다. 남녀 전환, 기준일, 배정 순서, 미확정 3장, 대한민국 현황과 이미 확보한 국가를 표시한다.
- 기존 `fivb-world-ranking-la28-2028.html`을 동일 데이터의 상세 화면으로 갱신한다. 공식 랭킹, 랭킹 반영 대회, 월드컵, 대륙선수권 링크를 유지한다. 돌아오면 같은 성별의 랭킹 패널을 연다. 기존 `#menPanel/#womenPanel` 북마크도 지원한다.
- 실제 랭킹 수치나 예상 출전국은 생성하지 않는다. 이미 확보한 국가는 기존 개최국·대륙 결과를 참조하며 월드컵 결과가 공식 확정되면 해당 국가도 제외 목록에 합류한다. 월드컵 참가 확정과 올림픽 출전권은 구분한다.
- 새 HERO·공통 메뉴·역사 기록의 수정은 없다. 로드맵 본문 마크업, 62개 기록, 기존 4개 필터와 행 디자인을 보존한다.

## 공식 검증 및 기존 안내 보완

| 항목 | 확인 내용 | 근거 |
| --- | --- | --- |
| 기본 배정 | 남녀 각각 3장 | IOC/FIVB LA28 규정 D.1 |
| 남자 기준일 | 2028-06-18 | 같은 문서 D.1 및 일정표 |
| 여자 기준일 | 2028-06-11, 잠정(TBC) | 같은 문서 D.1 및 일정표 |
| 배정 순서 | 아직 출전국이 없는 대륙을 우선 고려한 후 나머지 미확보국을 랭킹순으로 배정 | 같은 문서 D.1 |
| 사용 순위 | 2028 VNL 예선 종료 시점의 FIVB 세계랭킹. VNL 대회 최종 순위와 구분 | 같은 문서 및 FIVB 체계 발표 |
| 대한민국 | 기존 공식 검증 월드컵 데이터상 남녀 참가 확정, LA28 아직 미확보 | 기존 `fivb-world-cup-2027-v1.json`의 성별 출처 |

공식 출처:

- [IOC/FIVB 규정 PDF, 2026-05-12판](https://stillmed.olympics.com/media/Documents/Olympic-Games/LA28/VVO-LA28-Qualification-System.pdf)
- [FIVB LA28 체계 발표](https://www.fivb.com/volleyball-and-beach-volleyball-qualification-systems-for-la28-olympic-games-confirmed/)
- [FIVB 세계랭킹 안내](https://www.fivb.com/volleyball/rankings/) 및 연결된 [남자](https://en.volleyballworld.com/volleyball/world-ranking/men) / [여자](https://en.volleyballworld.com/volleyball/world-ranking/women) 공식 랭킹.
- [2023년 발표 캘린더 설명](https://www.fivb.com/all-you-need-to-know-about-the-2025-2028-volleyball-calendar/)은 기존 참고 링크로 보존한다. 새 기준일 근거는 최신 규정 PDF다.

기존 랭킹 상세 페이지의 단순 상위 3개국 설명에 빠져 있던 대륙 대표성 순서와 남녀별 기준일을 보완했다. 통합 상세 규정에는 이미 있던 내용을 같은 근거로 일치시킨다. 사용하지 않은 개최국 출전권 등 특별 재배정은 공식 규정에 따르며 기본 3장에 임의 가산하지 않는다.

[Drive 출전권 MASTER](https://docs.google.com/spreadsheets/d/16TgHUtXhKyjyi-cuToL1_A_hIzbZfo0KYRYdC4AXxK8/edit)와 관련 원본 폴더를 읽기 대조했다. MASTER는 2026-07-25 기준으로 옛 세계선수권 명칭과 아시아선수권 전 상태를 포함한다. 이번에는 MASTER를 쓰거나 새 대회 ID·Engine·자동화를 등록하지 않는다. 출전권 안내 모듈에 공식 최신 근거를 별도 저장한다. 원본 PDF를 공개 저장소에 복제하지 않는다.

## 데이터 및 운영

- `data/olympics/la2028-ranking-v1.json`: 성별 기준일/잠정 여부, 배정 우선순서, 결과·검증 상태, 출처·확인일. 규정 확정과 결과 pending은 독립한다.
- `data/olympics/la2028_v1.json`: `rankingOverview`를 통해 전용 자료와 기존 상세 URL 연결. 카드의 숫자는 주기 allocation을 읽는다.
- `world-ranking-model-v1.mjs`: 주기 일치, 공식 출처, 날짜, 중복/기확보국, 완전한 결과와 확인일 검증. 검증 실패 시 결과를 노출하지 않는다.
- 확정 결과는 `result.status=confirmed`, 공식 검증·출처, 기준일 이후 `confirmedAt`, 전체 배정국이 있어야 한다. 여자 잠정일은 공식 확정 후 갱신한다. 실제 확정국과 순위를 알고리즘으로 예측하지 않는다.
- 2032에는 LA28 설정을 복사하지 않는다. 규정 미발표 상태에서는 이 패널과 숫자가 나오지 않으며 역사 기록은 남는다. 기존 주기 전환·보관 정책을 유지한다.

## 검증

- Node 46/46: 역사 7 + 주기 11 + 대륙 7 + 월드컵 9 + 개최국 4 + 랭킹 8. 실제 실행 파일은 `tests/national-history-model-v1.test.mjs`, `tests/olympic-cycle-v1.test.mjs`, `tests/continental-results-v1.test.mjs`, `tests/world-cup-v1.test.mjs`, `tests/olympic-host-v1.test.mjs`, `tests/world-ranking-v1.test.mjs`.
- PC 및 모바일 iframe 390/360px: 카드 열기/닫기, 남녀 기준일·잠정 표시, 출전권 3장 pending, 가로 넘침 없음. 실제 브라우저 렌더를 확인했다.
- 상세 페이지 여자 선택 → 로드맵 복귀 시 여자 패널 유지. 공식·관련 대회 링크 확인.
- 역사 필터: 전체 62 / 핵심 37 / 올림픽 16 / 진출 실패 17. 2026 연도 접기·펼치기 정상.
- 2032 미발표 화면: 랭킹 패널 0개, LA28 배정 수량 없음, 역사 62개 유지.
- 최신 main blob SHA와 역사 JSON/JS/model/CSS, 대륙 결과, 월드컵 데이터, 공통 메뉴, 2032 설정의 8개 파일 일치. 역사 `<main>` 마크업 동일.
- 공개 JSON 2개의 정확한 SHA-256 및 검수 근거를 manifest에 저장한다. 공개 export CI 및 Pages 결과는 PR에 기록한다.

## 변경 파일

`olympic-roadmap.html`, `fivb-world-ranking-la28-2028.html`, `assets/js/olympic-qualification-summary-v1.js`, `assets/js/world-ranking-{model,ui,selector,page}-v1.*`, `assets/css/world-ranking-v1.css`, `data/olympics/la2028_v1.json`, `data/olympics/la2028-ranking-v1.json`, `tests/world-ranking-v1.test.mjs`, `scripts/quality_audit/public-review-manifest.json`, 이 검증 문서와 `docs/KVL_DECISION_LOG.md`.

## 미확정·한계·복구

- 2028 최종 랭킹, 세 국가, 여자 기준일 최종 확정은 아직 미확정이다. 공식 랭킹 표가 동적 로드되어 이번 검증에서 현재 순위·점수의 숫자 스냅샷은 확보하지 못했다. KVL 실시간 랭킹 자동화를 의미하지 않는다.
- 기존 월드컵 조·세부 경기/명단 미확정 상태와 역사 부분 확인 상태를 그대로 둔다.
- 기존 전체 저장소 CI의 선수 MASTER/로스터 수량 등 별도 실패는 이 범위에서 변경하지 않는다. 해당 PR의 현재 check 결과를 별도 확인하며 전체 CI 통과로 표현하지 않는다.
- 복구는 이 PR의 범위만 revert하고 Pages를 재배포한다. 기존 역사·개최국·대륙·월드컵 데이터 및 URL은 그대로 유지된다. 장애 시 카드 오류 안내에서 기존 상세 URL과 재시도를 제공한다.

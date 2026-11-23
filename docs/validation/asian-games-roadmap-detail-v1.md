# 2026 아시안게임 로드맵 경기 상세 복구 v1

확인일: 2026-11-23 (KST)
기준 main: `d0934179edb1d19b25aba7e1916c355d5cdb1d60`
작업 브랜치: `fix/asian-games-roadmap-detail-v1`

## 문제와 변경

운영 로드맵의 `kor-m-2026-asian-games`는 종료·참가·최종 7위가 저장되어 있었지만 `matches: []`이고 간단 요약도 없었다. 반면 기존 대회 결과 DB에는 대한민국 6경기가 존재했다. 그 결과 펼침 영역에 날짜·장소·대회 이동 버튼만 표시됐다.

공식 결과와 기존 경기 DB를 대조하여 역사 원본에 한국 6경기, 기본 펼침에는 8강·5–8위전·7·8위전 3경기를 연결했다. 전체 6경기와 공식 출처는 기존 ‘세부 기록·출처’에 남긴다. 대회 기록 버튼은 기존 `competition-engine.html?competition=asian-games-men-2026`로 연결한다.

## 결과와 근거

| 일자 | 단계 | 상대 | 대한민국 기준 세트 스코어 | KVL 경기 ID |
| --- | --- | --- | --- | --- |
| 2026-09-27 | 조별리그 D조 | 필리핀 | 3–0 | AG26-M04 |
| 2026-09-28 | 조별리그 D조 | 차이니스 타이베이 | 3–1 | AG26-M15 |
| 2026-09-29 | 조별리그 D조 | 중국 | 2–3 | AG26-M23 |
| 2026-10-01 | 8강 | 이란 | 2–3 | AG26-M30 |
| 2026-10-02 | 5–8위전 | 인도 | 1–3 | AG26-M39 |
| 2026-10-03 | 7·8위전 | 카타르 | 3–0 | AG26-M45 |

최종 7위·참가 상태·대회 기간은 기존 기록과 일치하여 그대로 보존했다. 이번 확인은 대한민국 6경기의 날짜·상대·세트 승수와 결선 3경기의 세트별 득점이다. 조별리그 세트별 득점은 신규 검증·전사 범위에 포함하지 않았다. 전체 대회 48경기를 새로 검증했다는 의미도 아니다.

공식 결과 시스템은 JavaScript 앱이므로 공개 검색으로 출처를 확인한 다음 실제 경기 화면에서 일정과 스코어를 읽었다. 공식 대회 경기 번호와 기존 KVL ID가 다를 수 있으므로 KVL ID를 재사용한다. 경기 시작 시각은 이번 역사 데이터에 전사하지 않는다.

- [AINAGOC/Bornan 공식 남자부 일정·결과](https://results.asiangames2026.org/#/discipline/VVO/schedule/by-event/M.TEAM6-------------)
- [공식 8강 대한민국–이란](https://results.asiangames2026.org/#/discipline/VVO/results/M.TEAM6-------------.QFNL.000400--)
- [공식 5–8위전 인도–대한민국](https://results.asiangames2026.org/#/discipline/VVO/results/M.TEAM6-------------.SF5-.000200--)
- [공식 7·8위전 카타르–대한민국](https://results.asiangames2026.org/#/discipline/VVO/results/M.TEAM6-------------.SF5-.000400--)
- [JVA 최종 순위](https://www.jva.or.jp/international/2026/asia_men/?entry=results)
- [JVA 대회 일정·개요](https://www.jva.or.jp/international/2026/asia_men/)

Drive의 아시안게임 폴더를 읽기 대조했다. 선수명단 MASTER는 존재하지만 `02_대회통합` 및 공식원본의 `05_결과_기록` 폴더는 비어 있었다. 별도 결과 MASTER를 만들어 덮어쓰지 않았으며 Drive는 수정하지 않았다. 기존 `data/competitions/asian-games-men-2026/data.json`과 연결해 관리한다.

## 보존과 데이터 경계

- 전체 역사 62개와 대회 ID 유지. 다른 61개 이벤트는 기준 main과 구조적으로 완전히 동일하다.
- 기존 요약 16개와 원본 출처는 유지하고 아시안게임 요약 1개·공식 출처 4개를 추가했다.
- 올림픽 출전 경로·실패 판정은 변경하지 않았다. 아시안게임의 8강 패배를 올림픽 진출 실패로 분류하지 않는다.
- 상단 LA28 4개 카드·2032 규정 미확정 구조·공통 메뉴·CSS·행 높이·폰트·색상은 변경하지 않는다.
- 경기 DB를 참조하는 경로와 기존 경기 ID 6개를 기록했다. 향후 변경 시 회귀 테스트가 상대·날짜·스코어 불일치를 검출하며 요약의 원본 근거가 달라지면 오래된 요약은 자동 적용하지 않는다.
- 전체 원본의 확인일을 일괄 승격하지 않았다. 수정된 이벤트와 새 출처의 확인일만 2026-11-23이다.
- 공개 데이터 manifest는 변경한 두 JSON의 해시·출처·검토 범위만 갱신했다. 공개 경기 정보만 포함한다.

기존 prototype 보존 테스트는 두 파일의 해시도 고정하고 있었다. 사용자 요청으로 공식 결과를 추가하는 정당한 변경이므로 역사 데이터 및 국가명 표시 renderer 해시만 새 기준으로 갱신했다. 원래 commit과 이전 해시는 fixture의 `reviewedAmendments.previousHashes`에 남겼다. CSS·모델 등 다른 보존 해시는 바꾸지 않았다.

## 검증

- Node 회귀 검사 56/56 통과, 실패·생략 0.
- 신규 검사: 종료 대회의 6경기를 기존 경기 DB의 홈/원정 기준과 대조, 최종 순위, 공식 출처 연결, 기본 3행, 변경된 원본에 대한 오래된 요약 배제, 올림픽/진출 실패 필터 제외.
- 기존 검사: 국가대표 모델·상세·올림픽 주기·대륙선수권·월드컵·개최국·세계랭킹. 상단 규정과 2032 미확정 분리 유지.
- 실제 Chrome PC에서 7위·기간·장소·결선 3행·전체 6경기·출처 및 기존 대회 링크 확인. 접기·재펼치기 정상.
- 필터 기록 수 전체 62 / 핵심 37 / 올림픽 출전 경로 16 / 진출 실패 17 유지.
- Chrome iframe 반응형 390/360/320px에서 3행과 날짜·장소·버튼 표시 확인. 문서 가로 넘침 없음(각 clientWidth/scrollWidth 375/375, 345/345, 305/305). 320px에서는 상대국이 다음 줄로 자연스럽게 표시된다. 실제 휴대전화 기기 검증은 아니다.
- `git diff --check` 통과.

## 수정 파일

1. `data/national/men-senior-history-v1.json`
2. `data/national/men-senior-history-summaries-v1.json`
3. `assets/js/national-history-roadmap-v1.js` — 상대국 한글명 5개
4. `assets/js/national-history-detail-model-v1.mjs` — 같은 상대국 표시
5. `assets/js/national-history-detail-v1.js` — 모델 캐시 갱신
6. `olympic-roadmap.html` — 스크립트 캐시 갱신
7. `scripts/quality_audit/public-review-manifest.json`
8. `tests/national-history-detail-v1.test.mjs`
9. `tests/olympic-cycle-v1.test.mjs` — 보존 기준 테스트명 명확화
10. `tests/fixtures/olympic-roadmap-baseline-v1.json`
11. `docs/KVL_DECISION_LOG.md`
12. 이 검증 문서

## 운영 및 복구

앞선 운영 반영 승인에 이어 보고된 누락을 수정하는 범위다. 이 문서 작성 시점은 로컬 검증 완료이며, PR의 검증 기록에 CI·병합·Pages와 운영 URL 확인 결과를 이어 기록한다. 운영 확인 전 배포 완료로 주장하지 않는다.

복구가 필요하면 이 수정 PR의 변경만 revert한다. 다른 동시 작업이나 기존 대회 결과 DB를 되돌리지 않는다. 복구 기준은 위 main SHA이며 과거 기록 62개·기존 상단 출전권 자료는 손실 없이 유지한다.

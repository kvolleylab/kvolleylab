# 대표팀 로드맵 아시아선수권 보완·참가 대회 대조 v1

2026-11-23 · 남자 성인대표팀 · 기존 간소화 화면 유지

## 변경 결과

2019·2021·2023 아시아선수권에 대한민국의 실제 20경기를 추가했다. 날짜, 상대, 라운드, 세트스코어와 세트별 점수를 AVC 공식 결과집과 경기 기록지에서 확인했다. 대회 기간·개최지도 연결했다. 기본 펼침은 마지막 주요 경기 3행이며, 전체 경기와 공식 출처는 기존 ‘세부 기록·출처’에 보존한다.

| 대회 | 최종 순위 | 한국 경기 | 승패 | 대회 기간 | 장소 |
| --- | --- | --- | --- | --- | --- |
| 2019 아시아선수권 | 4위 | 8 | 6승 2패 | 2019.09.13–09.21 | 이란 테헤란 |
| 2021 아시아선수권 | 8위 | 7 | 2승 5패 | 2021.09.12–09.19 | 일본 지바·후나바시 |
| 2023 아시아선수권 | 5위 | 5 | 4승 1패 | 2023.08.19–08.26 | 이란 우르미아 |

2019·2021의 조별리그 결과 승계는 새 경기로 중복 집계하지 않는다. 2023 중국전은 결과집의 `Ranking 1–6`에 맞춰 `1–6위전`으로 표시한다. 한국의 마지막 경기일인 8월 25일과 대회 종료일인 8월 26일을 구분한다. 이 세 대회의 기존 최종 순위는 변경하지 않았다.

## 공식 근거와 재현 위치

새 출처 22개에는 URL, 발행기관, 확인일, PDF 페이지/공식 경기번호를 저장했다. 공식 PDF는 직접 내려받아 텍스트를 추출했으며 스캔된 2021 P-2 기록지와 주요 P-4 결과표는 렌더링해 대조했다. 원본 PDF는 공개 저장소에 추가하지 않는다. 아래 링크와 JSON의 `sources[].locator`로 재검증할 수 있다.

| 연도 | 주된 공식 자료 | 확인 범위 |
| --- | --- | --- |
| 2019 | [AVC 최종 결과집 10](https://asianvolleyball.net/new/wp-content/uploads/2019/09/ASM-2019-DailyBulletin-10_opt.pdf), [JVA 대회 개요](https://www.jva.or.jp/international/2019/asianchampionship_men/) | 최종 4위, 8강·준결승·3위전, 기간·장소·결과 승계 방식 |
| 2021 | [AVC 최종 결과집 8](https://asianvolleyball.net/new/wp-content/uploads/2021/09/MAVC2021_Daily-Bulletin-No.8.pdf), [JVA 대회 개요](https://www.jva.or.jp/international/2021/asianchampionship_men/) | 최종 8위, 기간·두 경기장·결과 승계 방식 |
| 2023 | [AVC 최종 결과집 08](https://asianvolleyball.net/new/wp-content/uploads/2023/08/22-Asian-Sr.-Mens-Volleyball-Championship-Daily-Bulletin-_08.pdf), [AVC 결과집 02](https://asianvolleyball.net/new/wp-content/uploads/2023/08/22-Asian-Sr.-Mens-Volleyball-Championship-Daily-Bulletin-02.pdf) | 최종 5위, 표지의 8월 19–26일·우르미아 개최 정보 |

경기별 추적:

- 2019: AVC bulletin 02/03/04/06/07/10, 공식 경기 8·11·17·32·40·46·55·59. 첫 5경기와 마지막 3경기를 서로 다른 날짜의 결과집으로 확인했다.
- 2021: AVC 개별 P-2 PDF `2_KSA_KOR`, `16_KOR_KAZ`, `23_TPE_KOR`, `31_IRI_KOR`, `M39_PAK_KOR`, `M45_QAT_KOR`, `M53_PAK_KOR`. 7·8위전은 한국 기준 23–25, 15–25, 26–28이다.
- 2023: AVC bulletin 02/04/05/06/07, 경기 5·15·26·32·39. 공식 아카이브의 `04_draft.pdf`라는 파일명은 그대로 보존했다. 12강·1–6위전·5·6위전은 각각 P-4 단계 제목을 확인했다.

## 기존 DB·MASTER 대조

읽기 기준 main: `d8531b9841c03c1fa5d1ab94fd5e5aa495163413`. 기존 ID와 데이터를 조회했으며 MASTER·선수명단·경기 원본을 수정하거나 새 ID로 교체하지 않았다.

| 대조 대상 | 확인 결과 | 처리 |
| --- | --- | --- |
| `data/master/competition_master.json` | 3개: 2026 VNL 남자, 2026 대학리그 남자, 2026 AVC컵 남자 | AVC컵은 기존 `KVL-COMP-000003` 연결 유지. 대학리그는 대상 밖 |
| `data/competition/vnl-2026-men-participants.json` | 18개 참가국에 대한민국 없음 | 대회 존재만으로 한국 참가 기록을 추가하지 않음 |
| `data/national/national-team-home-v2.json` | 2026 남자 대회 4개 모두 로드맵에 존재 | AVC컵·동아시아·아시아선수권·아시안게임 ID 일치, 누락 0 |
| 연대기 2000–2019의 10개 shard와 `national_team_history_v1.json` | 총 44개: U18 10, U19 12, U20 11, U21 10, U23 1 | 성인대표팀 실적으로 복사하지 않음 |
| [Drive 대회일정 MASTER](https://docs.google.com/spreadsheets/d/17pRiWG-3oVoBJ8N2b4fvcKro8y9a2OpRlFn9PMRxejw/edit) | 최근 일정 중심. 이번 2019·2021·2023 경기 결과 원본은 없음 | 읽기 대조만 수행, 공식 결과집→검수된 역사 조회 데이터에 수록 |
| Drive `05_결과_기록` | 조회 시 파일 없음 | 원본 존재·동기화 완료로 표시하지 않음 |

이 검사는 위 입력 범위의 대조다. 2000–2028 모든 국제대회에 대한 전수 수록 완료를 뜻하지 않는다. 반복 개최, 청소년 명단 또는 대회 일정만으로 성인대표팀 참가를 추정하지 않는다.

## 후속 수록 후보·미확인 사항

| 후보 | 확인한 사실 | 남은 확인과 이번 처리 |
| --- | --- | --- |
| 2015 월드리그 | [JVA 경기 결과](https://www.jva.or.jp/international/2015/worldleague/?entry=results)와 [프랑스협회 공식 자료](https://www.ffvb.org/data/Files/2015%20-%20LIGUE%20MONDIALE/DP_LIGUE_MONDIALE_2015_V16_bd.pdf)에서 한국 참가 확인 | KVA 표는 2016 연도가 중복되고 JVA 순위 목록에도 표기 해석 문제가 있음. 최종 순위 확정 및 전체 경기 정리 후 추가할 후보로 유지 |
| 2016 월드리그 | [KVA 역대표](https://www.kva.or.kr/user/template.do?fileNm=bsns4_10), [JVA 결과](https://www.jva.or.jp/international/2016/worldleague/?entry=results)에서 한국 참가·전체 23위 확인 | 개별 경기·기간을 정리할 후속 수록 후보. 이번 타임라인에 새 행을 만들지 않음 |
| 2017 월드리그 | [FIVB 공식 랭킹 아카이브](https://www.fivb.com/volleyball/rankings/archive/fivb-senior-world-ranking-men/)의 2020-01-31 표에서 한국 `Rk.2017=18` 확인. 표 설명은 2017 월드리그를 명시 | FIVB 월드리그 옛 사이트는 직접 접근 실패. 경기 기록과 함께 수록할 후속 후보 |

최종 성적만 있고 세부 경기가 미수록인 완료 기록은 35개에서 32개로 감소했다. 2015년 이전 아시아선수권, 과거 월드리그 및 올림픽 예선의 미확인 경기·경위는 기존 확인 필요 목록에 남겨 둔다. 2027년 대회 개최와 한국 참가 확정도 계속 구분한다.

## 보존·회귀 검증

- 기존 대회 62개 ID와 배열 순서 보존. 세 대상 외 59개 이벤트 객체 완전 일치.
- 기존 22개 요약 객체 완전 일치. 3개 추가 후 25개. 요약은 원본 `basis` 대조로 보호.
- 기존 필터 결과 전체/핵심/올림픽/실패 = 62/37/16/17 유지.
- CSS·연도별 기본 펼침·기존 링크·현재 연도 표시·올림픽 규정 데이터 변경 없음. 국가명 사전에는 쿠웨이트·사우디아라비아·방글라데시만 추가.
- 검증 페이지의 정정 값이 세트 배열일 때만 `.map()`을 호출하던 오류 수정. 2018 AVC컵의 숫자 `4 → 8` 기록도 정상 렌더링하며 정정 제목도 각 기록에 맞춘다.
- `node --test tests/*.test.mjs`: 67/67 통과. 20경기별 득점/세트스코어 일치, 경기번호 중복·기간 범위·승계 경기 중복, 원본 변경 시 요약 무효화, 기존 주기 전환·2032 숫자 차단·아카이브 보존 포함.
- 공개 JSON 검토 게이트 `validate_changed`: PASS. 변경된 두 JSON의 승인 출처 목록과 실제 SHA-256 일치.
- PC 1348px 및 CSS viewport 390/360/320px 브라우저에서 확인. 모바일 기본/출처 펼침 모두 수평 넘침 0. 실제 휴대전화 기기 테스트는 수행하지 않음.
- 2019/2021/2023 상세에서 각각 8/7/5경기 노출 확인. 기본 상세는 주요 3경기만 표시. 필터·연도 펼침과 검증 목록 62개 및 정정 내역 2개 정상 표시.

## 변경 파일과 배포

- 역사/요약: `data/national/men-senior-history-v1.json`, `data/national/men-senior-history-summaries-v1.json`
- 국가명/캐시: `assets/js/national-history-roadmap-v1.js`, `assets/js/national-history-detail-model-v1.mjs`, `assets/js/national-history-detail-v1.js`, `olympic-roadmap.html`
- 검증 화면: `assets/js/national-history-verification-v1.js`, `assets/js/national-history-verification-model-v1.mjs`, `national-team-history-verification.html`
- 검증: `tests/national-history-asian-results-v1.test.mjs`, `tests/national-history-detail-v1.test.mjs`, `tests/fixtures/olympic-roadmap-baseline-v1.json`, `scripts/quality_audit/public-review-manifest.json`
- 운영 기록: 이 문서, `docs/KVL_DECISION_LOG.md`

Branch `feature/roadmap-asian-history-v1`. 사용자 기존 운영 반영 지시 및 이번 진행 지시 범위에서 PR 검토·Pages 배포·실서비스 확인을 수행한다. 병합 SHA, Pages run, 운영 확인 결과는 해당 PR에 기록한다. 배포 전 로컬 검증을 운영 배포 완료로 부르지 않는다. 복구는 이번 병합만 되돌리며 병행 중인 선수 소속·명단 작업을 포함하지 않는다.

배포 준비 시 최신 main `48e63d7e85f6c372e7ca4b8fd624c5c33638f989`와 다시 대조했다. 대상 소스·데이터의 동시 변경은 없었고, 결정 로그·공개 검토 목록에는 다른 작업의 최신 항목을 보존해 병합했다.

# 대한민국 남자대표팀 역사 로드맵 v1 검증·인계

확인일: 2026-11-16 · 상태: PROTOTYPE / READY FOR REVIEW / PRODUCTION NOT CHANGED

기준 main: `811f270f3dddc04bb0df0e5ed14ddb9ba1b11c07`  
브랜치: `feature/national-history-roadmap-v1`

## 결과와 범위

2000–2028년 대한민국 남자 성인대표팀의 주요 기록 62개, 공식 출처 51개, 추가 확인 항목 16개를 분리했다. 모든 대회의 전수 수록은 아니다. 사진·로고·HERO 없이 기준 시안의 흰색 패널, 남색 제목, 금색 관문, 왼쪽 세로 타임라인을 재현했다. 최근 3년(2024–2026)과 이후 확인 대회는 펼치고 2000–2023은 접었다. 상세를 누르면 참가·결과·출전권·공식 출처를 표시한다.

| 핵심 항목 | 확인된 처리 | 미확인/주의 |
|---|---|---|
| 2000 시드니 | 본선 참가 · 9위 | 1999 예선 세부 결과는 추가 확인 |
| 2004 아테네 | 본선 진출 실패 | 예선 순위·탈락 확정 경기 미확인, 예선 탈락으로 단정하지 않음 |
| 2008 베이징 | 도쿄 예선 3위 · 출전권 미획득 | 탈락 확정 경기 미확인 |
| 2012 런던 | 예선 6위 · 출전권 미획득 | 세부 승패·탈락 확정 경기 미확인 |
| 2016 리우 | 예선 미참가 · 본선 미진출 | 예선 경기에 패해 탈락했다고 표시하지 않음 |
| 2020 도쿄 | 2020 아시아 최종예선 준결승 이란전 2–3 패 | 본선은 2021년 개최, 공식 명칭 Tokyo 2020 유지 |
| 2024 파리 | 2023 예선 미참가 · 랭킹 출전권 미획득 | 예선 탈락으로 표시하지 않음 |
| 2025 세계선수권 | 본선 참가 · 27위 · 16강 진출 실패 | 본선 출전 실패와 구분 |
| 2026 아시아선수권 | 3위 · 2027 월드컵 출전 확정 | LA28 아시아 직행권만 미획득, 다른 경로 남음 |
| 2027 월드컵 | 폴란드 9/10–26 · 한국 출전 확정 | LA28 미확보 팀 중 상위 3팀 출전권 경로 |
| 2028 랭킹 | 6/18 마감, 3장 배분 절차 | 한국 결과 미확정, 대륙 대표성 우선 규정 상세 보존 |
| 2028 LA28 | 개최 확인 · 한국 출전 미확정 | 7/14–30은 올림픽 전체 기간, 남자배구 세부 일정 아님 |

## 발견한 기존 데이터 불일치

`data/national/national-team-home-v2.json`의 2026 아시아선수권 한국–호주 3위 결정전 세트 점수:

- 기존: 25-22 / 25-21 / 15-25 / 21-25 / 15-10
- 공식: 16-25 / 25-18 / 22-25 / 25-18 / 15-9
- 공식 경기: https://en.volleyballworld.com/volleyball/competitions/avc-men-continental/schedule/28853/?match=korea-vs-australia

프로토타입에 공식 값을 사용하고 운영 데이터는 수정하지 않았다. 별도 운영 승인 후 정정 후보다.

## 기존 데이터 연결 조사

| 읽은 자료 | 확인·연결 |
|---|---|
| `data/master/competition_master.json` | AVC컵 기존 ID `KVL-COMP-000003` 유지 |
| `data/international/senior-competitions.json` | 기존 대회 slug 유지 |
| `data/national/national-team-home-v2.json` | 2026 AVC컵·동아시아·아시아선수권·아시안게임의 기존 projection ID 연결 |
| `data/national/continental-championships-2026.json` | 2026년 8월 대회 전 상태로 결과 자료보다 오래됨 |
| `national_team_history_2000_2001`~`2018_2019`, `v1` | U18–U23 자료. 남자 성인 역사에 혼합하지 않음 |
| Drive 대회 출전구조 MASTER | `대회_출전구조 A1:Z30`, `한국_진행현황 A1:L25`, `출처_목록 A1:J25` 읽음. 2026.07.25 상태로 최신 결과보다 오래됨 |
| Drive 경기결과 양식 | `경기결과 A1:P10` 확인, 헤더만 있는 템플릿 |
| Drive 운영 MASTER v19 | 읽기 확인. 쓰기 없음 |

입력 근거 JSON → `scripts/build_data.py` → 정규화된 `data/roadmap_v1.json` → `model.mjs` 필터·검증 → UI. HTML에 대회 결과를 직접 하드코딩하지 않는다. 미래 참가 확정과 실제 참가, 대회 성적과 여러 출전권 결과를 독립 필드로 유지한다. 날짜가 미확인이어도 참가·결과 확인 범위를 분리한다. 자동 동기화·크론·DB 쓰기는 없다.

## 실행 검증

- Node 표준 테스트 7개 통과: 범위/ID/출처, 올림픽 구분, 2025 본선, 2026 복수 경로, 미래 결과 방지, 필터·정렬, 허위 결과 거부.
- Chrome PC 1363×936: 가로 넘침 없음. 전체 62 / 핵심 37 / 올림픽 16 / 진출 실패 17개.
- 390px CSS 뷰포트: document width=scrollWidth=390. 기본 전체 화면 캡처.
- 360px CSS 뷰포트: 상세 펼침 후 clientWidth=scrollWidth=345(데스크톱 스크롤바 15px). 가로 넘침 없음.
- 연도 및 과거 그룹 접기·펼치기, 상세 열기/닫기, 키보드 Enter, 현재 연도 이동, 맨 위로, 공식 출처 href, 검증 목록 확인.
- `?filter=failure&event=olympics-2000-men` 접근 시 필터가 전체로 보정되고 해당 과거 연도·기록이 열리는 것을 확인.
- 브라우저 확장 기능의 metadata 오류만 관찰, 앱 자체 오류는 관찰되지 않음.
- 실제 Android/iOS 기기·터치 하드웨어와 운영 페이지 통합 회귀는 미실행. 기존 운영 코드 변경이 없어 전체 저장소 테스트는 수행하지 않음.
- 상세 증거: `prototypes/national-history-v1/tests/qa_evidence_v1.json`.

## 미확인·부분 확인 목록

1. **2000 · 1999-12 아시아예선 우승, 최종 중국전 3-0, 3전 전승** — 미확인. JOC는 1999-12-25~29 상하이 예선과 우승팀 출전권만 확인. 실제 한국 우승 결과와 경기 점수는 추가 공식 원문 필요.
2. **2004 · 2004-05-22~30 도쿄 예선 7위·1승6패** — 미확인. 언론이 최종 일본전 전부터 본선행 좌절됐다고 서술. 최종전 일본전 0-3을 탈락 확정 경기로 기재하면 안 됨.
3. **2008 · 탈락 확정 경기 및 시각** — 미확인. 최종 3위와 출전권 미획득은 확정.
4. **2012 · 3승4패·탈락 확정 경기** — 미확인. 6위 최종순위는 JVA 공식 보고서로 확정.
5. **2016 · 당시 한국의 정확한 랭킹 숫자와 예선 참가권 미획득 확정일** — 미확인. 예선 미참가 및 본선 미진출 확정. 경기 패배에 의한 예선 탈락 아님.
6. **2019 · 도쿄 2020 대륙간 올림픽 예선 대한민국 참가·결과** — 미확인. 2020 아시아 최종예선의 준결승 탈락 기록은 별도로 확정됨.
7. **2024 · 2022 국가대표 시즌 종료 및 2024 랭킹 마감 시 한국의 정확한 순위** — 미확인. 예선 24개국 미포함 및 최종 12개국 미포함은 공식 문서로 확정.
8. **과거 동아시아선수권 한국 파견팀의 정식 성인대표/A대표 여부 및 최종 결과 원문** — 부분 확인. 확인된 참가·결과와 미확인 세부 필드를 분리해 보존합니다.
9. **2015–2017 월드리그 순위: KVA 표의 2016 연도 중복 오기 때문에 자동 전재 보류** — 부분 확인. 확인된 참가·결과와 미확인 세부 필드를 분리해 보존합니다.
10. **2002·2010·2018 세계선수권 개별 예선 경위와 최종 탈락 경기** — 부분 확인. 확인된 참가·결과와 미확인 세부 필드를 분리해 보존합니다.
11. **2018 VNL FIVB 원본 최종 순위표의 직접 접근** — 부분 확인. 확인된 참가·결과와 미확인 세부 필드를 분리해 보존합니다.
12. **역사표 기반 과거 대회의 정확한 시작·종료일, 개별 경기 전적** — 부분 확인. 확인된 참가·결과와 미확인 세부 필드를 분리해 보존합니다.
13. **2027 AVC 남자컵·동아시아선수권** — 미확인. 이번 공식 검색에서 2027 구체 일정·개최지·대한민국 참가 확정 근거 확보 못함. 반복 개최 이력만으로 추가하면 안 됨.
14. **2027 VNL 대한민국 참가** — 미확인. FIVB 장기 캘린더상 대회 개최와 한국 참가 자격은 별도. 확인한 공식 자료에서 대한민국 참가 확정 근거 없음. 로드맵에 한국 참가 대회로 넣지 않을 것.
15. **2025 네이션스컵 개막일** — 부분 확인. 종료일 6월 24일과 순위는 공식 기사로 확인. 개막일은 별도 일정 원문 확인 필요.
16. **2028 올림픽 남자배구 세부 경기일** — 부분 확인. 7월 14~30일은 전체 올림픽 기간. 남자배구 경기를 이 기간 전체로 단정하지 않을 것.

## 변경 파일과 복구

이번 변경은 `prototypes/national-history-v1/`와 이 검증 문서, 결정 로그의 추가 항목으로 한정한다. 운영 페이지·공용 CSS·MASTER·원본 경기 DB·자동화·회원/메모는 변경하지 않는다.

- `prototypes/national-history-v1/README.md`
- `prototypes/national-history-v1/data/current_research.json`
- `prototypes/national-history-v1/data/major_research.json`
- `prototypes/national-history-v1/data/olympic_research.json`
- `prototypes/national-history-v1/data/roadmap_v1.json`
- `prototypes/national-history-v1/index.html`
- `prototypes/national-history-v1/model.mjs`
- `prototypes/national-history-v1/roadmap.css`
- `prototypes/national-history-v1/roadmap.js`
- `prototypes/national-history-v1/scripts/build_data.py`
- `prototypes/national-history-v1/tests/model.test.mjs`
- `prototypes/national-history-v1/tests/qa_evidence_v1.json`
- `prototypes/national-history-v1/tests/viewport.html`
- `prototypes/national-history-v1/verification.html`
- `prototypes/national-history-v1/verification.js`
- `docs/validation/national-history-roadmap-v1.md`
- `docs/KVL_DECISION_LOG.md` (추가 항목만)

복구는 미리보기 버전 폐기 또는 해당 프로토타입 커밋 revert로 완료한다. 운영 연결이 없으므로 운영 DB 복구는 필요 없다. 운영 반영을 원하면 이 시안에 대한 승인 후 최신 main에 맞춰 대표팀 홈 어댑터 연결·회귀 검증·배포를 별도 수행한다. 본 PR 자체를 운영 배포 승인으로 해석하지 않는다.

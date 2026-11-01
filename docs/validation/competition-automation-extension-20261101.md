# 대회 운영 묶음·선수 공시·기사 자동화 확장 검증

작성일: 2026-11-01. 최초 조사 main: `2b13d05ee5ce2b2055e3f8a4c1b011c2437b48c3`.
최종 통합 main: `e95126d65a346407f5128477750c1f328f148198`(최신 PR #225 달력 수정 보존).
브랜치: `feature/competition-automation-lifecycle-v1`.

상태: **요청 범위 구현·로컬 검증 완료 / 운영 MASTER v17 반영·재조회 완료 / READY FOR REVIEW / 신규 코드 운영 미배포**.
기존 승인된 V-리그 수집의 최초 실제 성공과 이번 확장 기능의 배포 상태를 구분한다.

## 변경 범위

- V-리그 정규리그 시작/종료 경계와 최종 확인 기간, 종료 후 보관 증거 검증.
- 등록 해지 및 임대 종료의 잘못된 현재등록 추론 수정.
- 공시 ID·원문 버전·효력일·Player_ID 검토를 연결한 후보와 검토 완료 export.
- 공식 RSS의 별도 기사 메타데이터 수집, 장애 분리, 중복·정정 기록.
- 신규 대회 scaffold의 operations manifest와 운영 준비 gate.
- 기존 Google 운영원칙 MASTER v16→v17, 공통 운영기준·startup 문서 연결.
- 대학 PDF·공개 XLSX 실제 표본 파싱·한계 기록.
- 첫 경기 결과 이후 진행 중 순위를 포스트시즌 확정 시드로 사용하던 기존 오류 수정.

UI는 위 포스트시즌 확정 조건만 수정했다. CSS·화면 구조·최신 달력 변경·기존 대회 결과·공식 ID·수동 검토 내용은 보존했다.
공식 선수 사실을 확인 없이 사이트나 Google 선수 MASTER에 게시하지 않았다.

## 실제 외부 변경

기존 Google Docs `1iu1aWoTdSf2L7VCco5X7pCPxs9qVlM9rskZ8_hI76FY`를 같은 ID로 v17 갱신했다.
원래 문서 구조·회원 운영 정책·과거 변경 이력은 유지했다.
새 여섯 절(대회 운영 묶음, 실행 기간, 선수 사건, 기사, 파일 형식, 보관),
버전·관련 문서·변경 이력을 반영하고 native 문서의 제목·본문·heading을 다시 읽어 확인했다.
Google Sheets 값·서식·권한은 이 작업에서 변경하지 않았다.

## 실제 선수 MASTER 확인

남녀 `2026-27_V리그_선수명단_MASTER_검수중`의 native metadata와 관련 탭 헤더를 읽었다.
`현재등록_공시기반`에 Player_ID 열은 있지만 확인한 상위 행은 미연결이다.
`KOVO_선수별변동이력`은 기존19열 구조이며 Player_ID·효력일·원문 revision을 갖춘 새 사건 계약과 다르다.
따라서 기존 표에 이름만으로 새 사건을 쓰지 않는다. 상세 target mapping 및 적용 전 조건은
[선수 업데이트 문서](../KVL_PLAYER_UPDATES_v1.md)를 따른다.

## 검증 증거

최종 영향 범위 검사는 **302개 통과**다.

| 범위 | 검사 수 | 결과 |
|---|---:|---|
| 기존 V-리그 source·standings·MASTER·publish·ops | 143 | PASS |
| 실행 기간·종료·보관 검증/준비 | 33 | PASS |
| 공시 파서·후보 명단 | 21 | PASS |
| 선수/기사/공개 출력 및 읽기 전용 MASTER 계획 | 33 | PASS |
| config/data·starter·operations 준비 | 35 | PASS |
| 기존 명단·경기 요약·포스트시즌 DOM | 37 | PASS |

Python 16파일 AST, Node syntax, 변경 workflow3개 YAML 및 shell24개 구문, diff 공백 검사도 통과했다.
공개 설정3개의 출처·적합성·정확 SHA-256을 기존 review manifest에 연결하고 export gate를 통과했다.
이는 운영 설정 메타데이터의 검토이며 선수 후보 사실의 승인이나 외부 writer 연결을 뜻하지 않는다.
새 read-only `Competition Automation Contracts v1` workflow가 관련 회귀를 PR에서 실행한다.

현재 main의 정규리그 결과가 입력된 상태에서 기존 포스트시즌 DOM 검사2개가 실패했다.
진행 중 standings의 rank를 확정 진출팀으로 표시하던 원인을 수정하여 기존 assertion을 유지한 채
5개 회귀를 추가했고 11개 포스트시즌 검사가 모두 통과했다. 공식 명시 대진과 실제 PO 승자는
진행 중에도 반영하며 현재 순위만으로 진출팀을 추정하지 않는다. 새 브라우저 시각 스크린샷은
이번 변경에서 만들지 않았다. 레이아웃/CSS는 변경하지 않았고 DOM 기능·기존 스타일 검사를 사용했다.
실제 현재 인덱스 dry run은 공식 후보319개(명단219·이벤트100), 승인0·검토 export0이었다.
정정이 필요한 158328 공시는 파서 새로 수집 전 승인 차단됨을 확인했다.

대학/중고 표본의 측정값과 확인하지 못한 범위는
[공식 파일 가능성 검증](academic-source-feasibility-20261101.md)에 기록했다.
RSS 두 곳은 실제 HTTP200·XML 파싱을 확인했으며 당시 배구 제목 일치는0개였다.
연결 성공을 전체 배구 뉴스 수집 성공으로 표현하지 않는다.

## 운영 전환과 복구

새 코드의 main 병합·GitHub Actions 활성 실행은 이 문서만으로 완료 처리하지 않는다.
저장소 AGENTS의 운영자 승인 규칙에 따라 검토 가능한 PR과 검사 결과를 제출한다.
선수 MASTER 외부 writer 및 미확정 Player_ID 반영은 포함하지 않는다.
기존 v1 승인과 연결을 다시 요구하지 않으며 새 기능의 운영 적용 범위만 구분한다.

복구는 feature commit을 되돌리되, 기존 MASTER·정상 게시 데이터는 실제 상태를 재조회하여 판단한다.
즉시 경기 자동 게시 중지는 기존 `KVL_VLEAGUE_UPDATE_APPROVED=false`를 사용한다.
공시/기사 작업은 별도 workflow이며 해당 자동화의 운영 설정과 실행 이력을 확인한다.
보관 완료 표시를 되돌리거나 기존 스냅샷을 덮어쓰는 방식으로 정정하지 않는다.

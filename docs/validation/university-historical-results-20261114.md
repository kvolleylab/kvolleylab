# 대학배구 허브 역대 U-리그 기록 자동 확장 — 2026-11-14

- 상태: **USER REQUESTED / IMPLEMENTED IN FEATURE BRANCH / PRODUCTION NOT DEPLOYED**
- 기준 main: `774c1ef2504ab891cef9e33611ef80961cc824f0`
- 브랜치: `feature/university-historical-results-2013-2023`
- 운영 경로(변경 대상): `university-competitions.html`

## 요청 및 구현 범위

대학배구 허브의 과거 대회결과가 2024년까지만 있는 문제를 해결한다. 기존 2026년 세 대회와 2025·2024년 U-리그/연맹1·2차전의 공식 기록, 순위, 링크, HERO, 카드/트로피, 모바일 배치 및 금색 hover는 유지한다. 2023년에는 UI 옵션만 있으나 원본 데이터가 없었으며 2022년 이전은 연도 목록도 없었다.

새 결과를 `data/archive/university-results-v1.json`에 추가하면 `assets/js/university-hub-years-v1.js`가 고정 연도 목록 대신 JSON의 실제 연도에서 최신순으로 선택창 및 아코디언을 생성한다. 따라서 향후 2012년, 2000년 등의 신규 검증 기록을 추가해도 연도 코드를 수정할 필요가 없다. `?year=YYYY` 경로도 등록된 연도에서 동작한다. 자료가 존재하지 않는 연도나 출처 확인이 불가능한 대회는 표시하지 않는다.

## 이번에 추가한 검증된 기록

- 2013~2023년 **남자부 U-리그 11개 연도**, 우승·준우승 22개 순위.
- 2020~2023년 **여자부 U-리그 4개 연도**, 우승·준우승 8개 순위.
- 기존 2024·2025년 대회 6개/남녀 48개 순위는 변경하지 않는다.
- 총 과거 17개 대회 요약, 남녀 78개 공식 확인 순위.
- 2013~2019 여자부 우승/준우승은 참조 KUSF 역대표에 없어 해당 연도에는 남자부 카드만 표시한다. **여자부 개최 여부를 단정하지 않는다.**
- 2013~2023년 3·4위는 확인되지 않았으므로 생성하지 않는다. 카드에 '공식 확인된 1·2위만 표시'를 명시한다.
- 기간을 검증하지 못한 연도에는 실제 날짜처럼 보이는 가공 데이터를 넣지 않고 '대회 기간 자료 확인 중'으로 표시한다.
- 새 항목은 상세 경기/로스터/선수정보나 신규 대회 자동화가 아닌 **결과 요약 카드**다. 별도의 대회 페이지가 없으므로 링크는 공식 결과 기록으로만 연결한다.

## 공식 출처와 적용 기준

- KUSF 대학스포츠 U-리그 공식 소개 페이지, '역대 종목별 우승팀 현황'의 대학배구 남자·여자부: https://www.kusf.or.kr/league/league_info.html
- 2023 한국대학배구연맹 개최 알림(2023.04.05~10.11): https://kuvf.co.kr/31/?bmode=view&idx=14478564
- 2022 한국대학배구연맹 개최 알림: https://kuvf.co.kr/31/?bmode=view&idx=11109524
- 2022 남자부 9월 26일 결승 변경 공지: https://kuvf.co.kr/31/?bmode=view&idx=12613597
- 2021 남녀부 개최 기간 참고, 한국대학배구연맹 연간 계획: https://www.kuvf.co.kr/32

원본 파일을 Drive로 복제하지 않는다. Google Drive K-volley lab의 대학대회 소스 및 최신 `KVL_운영원칙_MASTER_v19`를 확인했으나 2013~2023 경기 결과 MASTER는 별도 확정되지 않았다. 공개 KUSF 역대표를 직접 결과 근거로 사용한다. ID, 선수/학교/경기 DB, 2026 대회 엔진·자동화, 기존 Google Drive MASTER는 변경하지 않는다.

## 변경 파일

1. `data/archive/university-results-v1.json` — 공식 요약 기록과 출처 메타데이터.
2. `assets/js/university-hub-years-v1.js` — 연도 자동 생성, 남녀 일부 기록 지원, 날짜 미확인 표시, 출처 이름 표기.
3. `university-competitions.html` — 정적 선택창 연도 목록 정리와 JS 캐시 무효화.
4. `assets/css/university-hub-years-v1.css` — 여자부 결과가 없는 과거 연도용 PC 2열 카드.
5. `tests/university-hub-years.test.cjs` — 과거 17대회·78순위·동적 연도·부분 기록/2026 회귀 검사.
6. `scripts/quality_audit/public-review-manifest.json` — 공개 데이터 원본 출처·검증일·SHA-256 갱신.
7. `docs/KVL_DECISION_LOG.md` — 추가 작업 결정 기록.

## 검증/제약

- 변환된 JavaScript 및 테스트 소스 구문 검사: 통과.
- 신규 결과 JSON 파싱·ID 유일성(17개)·공식 출처 URL·기존 2024/2025 순위 불변 확인.
- 공개 JSON SHA-256: `4e96919f14b585b9dce02c004dedf367163f460c781d68793b2765626ca260ac` (기존 manifest SHA와 SHA 구현을 교차 확인).
- 해당 변경은 **feature 브랜치**로 격리되어 있으며 운영 `main`에는 반영하지 않는다.
- 실제 PC1440px / 모바일390·360px 브라우저 시각검증, GitHub Actions 실행 및 GitHub Pages 배포는 별도 수행·검증해야 한다. 실행하지 않은 항목은 PASS로 표기하지 않는다.

## 향후 과거 대회 추가 방법

기존 원본을 확인하고 대회별 ID, 연도, 유형, 제목, 확인된 일정 및 남/녀 공식 순위와 출처 ID를 `data/archive/university-results-v1.json`에 넣는다. 가공·미확인 순위는 비워 둔다. `public-review-manifest.json`의 원본 SHA-256·출처 IDs·검증일을 갱신하고 테스트/PC/모바일 검수를 수행한다. UI 연도 옵션 변경은 별도로 필요하지 않다.

## 배포 승인/복구

GitHub PR 검토 및 사용자 별도 운영 반영 승인 후 merge/Pages/live 화면 검증한다. 미배포 상태에서는 운영 페이지가 달라지지 않는 것이 정상이다. 문제가 있으면 해당 신규 PR의 squash/merge commit만 되돌린다.

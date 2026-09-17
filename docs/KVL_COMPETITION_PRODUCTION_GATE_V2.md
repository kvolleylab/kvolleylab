# Competition Page V2 최종 Gate

검증 코드 SHA: `2d6a86a282a5b4f6e08c433129969ecf4418fdfd`
재개 시 main: `beb07e851968f99ec6562bcf562fa1225de26179`
상태: **VALIDATED_PENDING_WOMEN_PARITY_AND_PRINT_PDF**. PRODUCTION_READY는 아니다.

## 판정

| 요청 항목 | 판정 | 근거/경계 |
| --- | --- | --- |
| 새 대회를 데이터 연결로 지금 생성 | PASS | Production starter + JSON + 선택적 normalizer. 배포 승격과는 별개 |
| 남자 대회 | PASS | 기존 대표 치수 18/18 기록 유지, 독립 가상대회 남자 검증 통과 |
| 여자 대회 | FAIL | 신규 Rose 공통 엔진 기능은 통과했지만, 기존 여자 production 완전 재현 조건은 2/18 일치로 미충족 |
| 참가국 국기 확대 | PASS | PC/Mobile 국기 영역 최대 사용, contain, 원본 비율, 긴 이름 잘림 없음 |
| 세트별 점수 기본 표시 | PASS | 기존 renderer로 3/4/5세트 실점수 출력, 예정 점수 없음 |
| PC 1180 | PASS | 화면/기능/overflow 검사 |
| Mobile 390 | PASS | 화면/기능/overflow 검사 |
| Mobile 360 | PASS | 화면/기능/overflow 검사 및 시각 확인 |
| upcoming / active / completed | PASS | 미확정 결과 없음, confirmed 3·4위만 있는 active도 확인 |
| roster print | FAIL | 선택 18명→2장, 전체 116명→9장 DOM은 통과. 실제 인쇄/PDF 출력 미검증 |
| Production Ready | FAIL | 여자 원본 재현 및 실제 인쇄 PDF Gate 미통과 |

## 완료한 변경

- 여자 production SyntaxError: template literal 안의 백틱 2개 이스케이프, HTML의 해당 JS 캐시 버전 갱신. 디자인 수정 없음 (`beb07e85`).
- 공통 참가국: 국기 전용 열 최대 64px, 높이 PC 44px/Mobile 42px, object-fit contain, 긴 국가명·영문명 줄바꿈. 기본 카드 높이는 기존 값을 유지하고 긴 문구가 있을 때만 필요한 만큼 증가.
- 공통 경기: 기존 score.sets[] 기본 출력 유지, null/빈 점수 guard. CSS가 표의 순서로 가짜 8강 대진을 붙이던 규칙 제거. 실제 QF 경기 데이터/명시 pairingLabel로만 대진 표시.
- 긴 Hero 제목은 기존 크기·위치를 유지하며 줄바꿈. 메뉴/KPI/달력은 현재 경로와 상태 query를 보존. 미정 순위의 null 문자열 제거.
- 확정 순위가 일부만 존재할 때 메달 숫자·색을 데이터 rank에 연결. 선수명단은 14명 단위 인쇄 페이지 분할.
- Production starter와 validation 분리: static SEO, noindex 제거, 테스트 데이터 빌드 차단. DATA ONLY normalizer 시작점 및 생성 가이드 추가.
- 독립 가상대회: 8개국·20경기(단일리그 변형 36경기), 자체 생성 일정·세트 결과·가상 선수. 기존 AVC/VNL 대회 데이터를 복제하지 않음. Hero 자산만 로딩 검증에 재사용.

## 검증 근거

- `competition-v2-production-gate-results.json`: 144/144 PASS (첫 배포).
- `competition-v2-production-focused-results.json`: 긴 제목/대진/확정 메달 보완 후 영향 범위 42/42 PASS. 남녀 공통 geometry 18쌍 차이 0. 최초 144 검사만으로 긴 Hero 제목 잘림을 놓쳤으며, 시각 검수에서 발견 후 검사 조건을 보강했다.
- `competition-v2-women-baseline-results.json`: SyntaxError 수정 후 여자 원본과 공통 엔진 18조건 비교, PC 일정·최종순위만 대표 치수 일치. 16조건 차이, 후보 overflow 0.
- `competition-v2-vnl-focused-results.json`: VNL 일정/참가국 × 3폭, 오류/overflow 0. 116경기·18개국 기존 데이터 연결 유지.
- `competition-v2-print-validation.json`: 선택/전체 인쇄 DOM 페이지 수·선수 수와 출력 제약.
- `node tests/competition-v2-production-starter.test.cjs`: 10개 데이터/생성 계약 검사 PASS.
- 실제 메뉴 이동에서 active/women 유지, 조별리그 및 A조 필터 수 확인. 360px에서 3/4/5세트 점수, 긴 Hero 제목·참가국 카드 시각 확인.

## 여자부 기준 충돌

기존 남녀 production 자체가 같은 규격이 아니다. 예를 들어 390px에서 여자 원본 최종카드는 폭148/높이232.66px, V2는 폭72/높이146px이며, 원본은 2열·V2는 4열이다. 경기 행 높이도 원본127.06px/V2 112.30px이다.

앞으로 사용할 공통 기준안은 기존 AVC에서 추출된 V2 geometry 한 벌이다. 신규 남녀 대회는 동일 엔진으로 렌더링하며 테마·데이터만 다르고, 18쌍 치수 일치를 확인했다. 여자 전용 임시 geometry CSS를 추가하지 않았다.

그러나 공통 규격 채택만으로 사용자가 최초 요구한 ‘기존 남자와 여자 production 각각의 사실상 동일 재현’을 통과했다고 볼 수 없다. 기존 두 규격을 동시에 유지하면서 색상 외 geometry를 동일하게 만드는 조건은 충돌한다. 따라서 이 조건을 임의로 완화해 PASS로 바꾸지 않았다. 기존 여자 production은 SyntaxError 수정 외 보존했다.

## 인쇄 미완료 범위

브라우저 인쇄 버튼은 실행되어 선택/전체 print root를 생성한다. 선택18명은14+4, 전체8개국116명은9개 sheet로 분할된다. 현재 연결 브라우저에서 인쇄 대화상자는 나타나지 않았고, 지원되는 content.export 호출은 `CDP does not support command tab_content_export`로 실패했다. 별도로 만든 PDF를 실제 브라우저 출력 검증으로 대신하지 않았다.

남은 작업은 실제 브라우저에서 PDF를 저장하고 모든 페이지의 한글/국기/행/페이지 분할/잘림을 확인하는 것이다.

## Production 보호와 지원 범위

AVC 남자 HTML, `vnl.html`, VNL production 및 기존 production CSS/JSON은 이 마감 작업에서 변경하지 않았다. 여자 HTML/JS는 위 SyntaxError 최소 수정만 허용 범위로 변경했다. 어떤 기존 production 페이지도 공통 엔진으로 교체하지 않았다.

현재 knockout은 bracket-8/none만 검증 지원한다. 4강 시작/16강/5~8위/기타 순위결정전은 공통 graph renderer 확장 대상이며 지금 지원된다고 주장하지 않는다. 상세 데이터 필드·생성법·확장 방식은 `KVL_COMPETITION_PRODUCTION_STARTER_V2.md`를 따른다.

Drive 동기화 대상: `KVL_COMPETITION_PAGE_TEMPLATE_V2`, `KVL_운영원칙_MASTER_v14` (v13은 원본 보존). 모든 Gate가 통과해도 기존 production 교체에는 사용자의 명시적인 반영 요청이 필요하다.

## 이번 마감의 수정/추가 파일

- `assets/css/kvl-competition-components-v2.css`
- `assets/js/kvl-avc-women-template-v1.js`
- `assets/js/kvl-competition-components-v2.js`
- `assets/js/kvl-competition-data-v2.js`
- `assets/js/kvl-competition-loader-v2.js`
- `assets/js/kvl-competition-template-v2.js`
- `docs/KVL_COMPETITION_PAGE_TEMPLATE_V2.md`
- `docs/KVL_COMPETITION_PRODUCTION_GATE_V2.md`
- `docs/KVL_COMPETITION_PRODUCTION_STARTER_V2.md`
- `docs/KVL_COMPETITION_REBUILD_AUDIT_V2.md`
- `docs/KVL_COMPETITION_RENDER_ENGINE_V2.md`
- `docs/competition-v2-print-validation.json`
- `docs/competition-v2-production-focused-results.json`
- `docs/competition-v2-production-gate-results.json`
- `docs/competition-v2-vnl-focused-results.json`
- `docs/competition-v2-women-baseline-results.json`
- `international-competition-avc-women-continental-2026.html`
- `scripts/create-competition-v2.cjs`
- `templates/competition-data-adapter-v2.cjs`
- `templates/competition-data-v2.starter.json`
- `templates/competition-page-pc-mobile-v2.html`
- `templates/competition-page-pc-mobile-v2.manifest.json`
- `templates/competition-page-production-v2.html`
- `tests/competition-page-v2-production-gate.html`
- `tests/competition-page-v2-structure-engine-smoke.html`
- `tests/competition-v2-production-gate.js`
- `tests/competition-v2-production-starter.test.cjs`
- `tests/fixtures/competition-v2-dummy.js`

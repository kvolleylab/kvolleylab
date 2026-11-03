# 국제대회 연도별 허브 프로토타입 v2

- 작업일: 2026-11-04 KST. 상태: PROTOTYPE / READY FOR REVIEW. KVL 운영 배포·main 병합 없음.
- 기준 main: `f560f3b0473eca5e3933461f13b725ed4a9cdb32`. 수정 전 feature 원격 HEAD: `74fa9eb6d1de0981d8bc3ab6f8483d5c04965ff3`.
- 검토: https://kvl-international-years-v1.daewook1029.chatgpt.site/
- 기존 Draft PR: https://github.com/kvolleylab/kvolleylab/pull/246
- v1의 source/운영기준 검토는 [기존 검수 기록](international-years-prototype-v1.md)을 따른다. 이번에 최신 main과 feature HEAD를 다시 대조했다.

## 최종 변경

HERO → 대회 종류 6개 → 2026년 최근3개 → 2025년 이하 아코디언 순서다. 종류 메뉴는 연도 블록 밖에서 한 번만 렌더링한다. 기본 HERO·최근 카드·공통 메뉴·원래 대회 링크는 유지했다.

`?category=vnl` 등은 모든 연도에 적용되는 필터다. 선택된 카테고리는 Purple 테두리/배경·상태점·aria-current로 표시한다. 같은 항목을 다시 누르거나 국제대회 홈을 누르면 초기화된다. URL에서 상태를 읽으므로 새로고침에도 유지된다. 필터 상태에서는 해당 종류의 등록 대회를 연도별로 모두 보여주며, 기본 홈만 최근3개 정책을 적용한다.

연도의 전체대회보기는 `?year=2026&view=all&category=vnl`처럼 카테고리를 보존한다. 연도별 보기로 돌아갈 때도 유지한다. 상단 종류 변경은 해당 종류의 전체 연도 화면으로 이동한다. 대륙선수권은 AVC 이름에 의존하지 않고 `family=continental` 전체를 필터링하므로 향후 CEV/NORCECA/CSV/CAVB 등록에도 같은 구조를 사용한다. 기존 family와 games 매핑은 변경하지 않았다.

## 공통 시각 아이콘

`international-hub-icons-v1.mjs`에 자체 SVG 6개를 분리했다. 공통 64×64 캔버스, 2.2px 선, 배구공 구성, 옅은 Navy 바탕, 라벨 위치·hover·선택 상태를 통일했다. PC 표시52px, 모바일48px이며 카드 높이는 각각112px·105px이다. 이벤트별 공식 엠블럼·시즌 로고 자산과 OG/WC/CC/AG/MS 문자 마크를 사용하지 않는다.

| 종류 | 시각 요소 |
| --- | --- |
| 올림픽 | 배구 메달·원형 구조·월계 |
| 세계선수권 | 경위선 지구본·배구공 |
| VNL | 배구 네트·배구공·식별용 VNL |
| 대륙선수권 | 여러 대륙의 지구·배구공 |
| 아시안게임 | 태양·배구공·시상대 |
| 종합경기대회 | 성화·배구공 |

## 검수

Node 테스트6개 PASS: 실제 registry의 최근/전체/6분류, 날짜와 최근 선정 정책, 원본 데이터 불변, 상태 보정, 여러 연도의 동일 카테고리 필터, URL 상태 보존. 과거 연도 필터 테스트에만 독립 fixture를 사용하며 runtime/미리보기 데이터에 포함하지 않는다. 신규 아이콘과 수정 mjs 문법 검사 PASS.

| viewport | 기본 카드 | 카테고리 | 가로 넘침 / 텍스트 잘림 |
| --- | --- | --- | --- |
| 1180px | 동일 폭291px, 동일 y좌표의3개 | 6열, 동일 높이112px | 없음 / 없음 |
| 390px | 1열3개 | 3열×2행, 동일 높이105px | 없음 / 없음 |
| 360px | 1열3개 | 3열×2행, 동일 높이105px | 없음 / 없음 |

Cloud Browser 고정폭 iframe으로 실제 화면과 DOM 치수를 확인했다. 모든 폭에서 기본3개·전체5개·선택 카테고리의 연도 전체보기 동작을 확인했다. PC에서6종류 각각의 결과0/0/1/2/2/0개, 선택 해제, 2025년 펼침 안내를 확인했다. 모바일은 VNL/대륙선수권 필터 및 선택 유지 전체보기를 확인했다. 실제 URL 새로고침 후 VNL 선택과5개 연도 아코디언이 유지됐다. 검사 중 `.hub-year .hub-shortcuts`는0개, 전체 `.hub-shortcut`은6개다. 기존 대회 URL/slug와 HERO 이미지를 보존했다.

실제 등록은 모두2026년인5개다. 과거 연도의 실데이터 출력은 등록 자료가 없어 확인할 수 없으며, 연도 간 필터 동작은 단위 테스트로 검증했다. 가상의 과거 대회·여자 VNL·미등록 국제대회를 화면에 추가하지 않았다. 모바일 검수는 실제 기기 대신 브라우저 viewport로 수행했다.

## 변경 범위·복구·다음 단계

프로토타입 HTML/CSS, controller/model, 자체 아이콘 모듈, 테스트 및 문서만 수정했다. 운영 허브·Competition Engine·AVC/VNL/아시안게임·원본 registry·Drive MASTER는 변경하지 않았다. 코드 비교에서 protected production 경로 diff는0이다.

복구는 이 revision을 feature 브랜치에서 revert하거나 검토 Site를 이전 저장 버전으로 되돌리는 범위다. KVL production 복구 작업은 필요 없다. 사용자 검수 후 별도 명시적 운영 반영 승인이 있어야 최신 main에 맞춰 운영 적용을 진행한다.

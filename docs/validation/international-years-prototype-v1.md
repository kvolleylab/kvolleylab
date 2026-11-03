# 국제대회 연도별 허브 프로토타입 v1

- 제작·운영: K-Volley Lab
- 작업일: 2026-11-04 KST
- 상태: PROTOTYPE / READY FOR REVIEW. KVL 운영 반영·main 병합 미승인.
- 기준 main: f560f3b0473eca5e3933461f13b725ed4a9cdb32 (#245 보존).
- 범위: 국제대회 허브의 연도별 탐색 시안만 추가. 기존 엔진·AVC/VNL/아시안게임 페이지·등록 데이터·Drive MASTER 미변경.

## 확인한 기준

Google Drive: KVL_운영원칙_MASTER_v18(11월 3일 개정 내용), KVL_COMPETITION_HERO_IMAGE_GUIDE_v1(10월 13일 수정본), KVL_COMPETITION_PAGE_TEMPLATE_V2를 읽었다. 저장소 AGENTS.md, PROJECT_RULES.md, DESIGN_SYSTEM.md, DEVELOPMENT_WORKFLOW_v1.md, KVL_DECISION_LOG.md, 테마 정책, 실제 국제/대학 허브 구현을 확인했다. 일반 디자인 문서의 과거 다크 화면/1120px·1400px 허용은 최신 사용자 요구인 밝은 배경·1180px과 현재 공통 CSS보다 우선하지 않는다. 이미 완성된 HERO를 사용하므로 가이드의 이전 원본 제작 치수와 Decision Log의 2108×406 최신 치수 차이는 새 이미지 제작으로 확대하지 않는다.

## 구현

`international-competitions-hub-prototype.html`이 별도 진입점이다. 기존 공통 헤더·HERO와 `international-senior-hub-v1.css`를 그대로 불러온다. 원본 최근 카드 렌더러/자산 해석은 프로토타입 전용 모듈로 재사용해 운영 스크립트를 변경하지 않는다. 변경은 연도 아코디언·목록 라우팅·카테고리 SVG 및 모바일 긴 결과 배지 줄바꿈/대비에 국한한다.

- 2026 펼침, 2025~2022 접힘. 데이터에 다른 연도가 추가되면 자동 포함된다.
- 최근 3개: 진행 중 우선, 종료일 DESC, 시작일 DESC, 미래 제외, showInRecent 및 recentPolicy.limit(최대3) 준수. KST 날짜 경계.
- `?year=2026&view=all`: 전체 등록 대회, 예정 포함, 종료일/시작일 내림차순.
- 여섯 category query는 실제 필터. games + asian-games ID는 asian-games로 호환 매핑, 나머지 games는 multi-sport. 원본 family 수정 없음.
- 공식 연도 로고를 복제하지 않은 자체 선형 SVG 6개. 캔버스40px·선1.7px·표시크기/반경 통일.
- 데이터 없음과 조회 실패 구분. 실패에는 실제 재시도 버튼. 아코디언 키보드/aria-expanded, 필터 aria-current, focus-visible 지원.
- 별도 비공개 Site에서는 data-production-origin으로 기존 대회 경로를 https://kvolleylab.com 에 연결한다. path/query/slug는 원본 그대로다. 공통 메뉴의 시니어 허브만 검토 화면으로 돌아오며 나머지 메뉴는 기존 운영 링크다.

## 실제 등록 데이터와 상태 차이

senior-competitions.json schemaVersion11의 2026 등록은 총5개다. 최근3개는 아시안게임 남자(10/03 종료), 아시안게임 여자(09/22), AVC 남자(09/13). 전체보기에는 AVC 여자(08/30), VNL 남자(08/02)가 추가된다.

원본 index의 남자 아시안게임 상태/강조문구는 `대회 진행 중 / 10월 1일 8강`으로 오래됐다. 실제 같은 대회 `data.json`의 `completed / 이란 금메달 · 대회 종료`를 프로토타입 런타임에서 우선한다. 원본 index 및 상세 데이터는 수정하지 않았다. 상세 조회 실패 시 날짜 기반 종료 표기를 사용하며 오래된 라운드 문구나 추정 우승팀을 표시하지 않는다. 완료된 상세 정보도 해당 시점이 미래이면 결과를 표시하지 않는다.

분류별 등록 수: 올림픽0, 세계선수권0, VNL1, 대륙선수권2, 아시안게임2, 종합경기대회0. 비어 있는 분류와 과거 연도에 가상 대회를 추가하지 않았다. 등록된5개 범위의 시안이며 미등록 국제대회 전수 수집 작업은 아니다.

## 검수 결과

- Node 테스트4개 PASS: 실제 registry 순서/전체/6분류/빈 연도, KST 자정·진행/예정·미래 제외, 오래된 상태 보정 및 원본 불변, 종료일 동률 정렬·family 매핑.
- 신규 mjs 3개 문법 검사 PASS.
- Cloud Browser의 고정폭 iframe으로 1180/390/360px 검수. 각 폭에서 기본3개·전체5개·6개 필터의 실제 클릭과 표시를 확인했다. 모든 측정에서 가로 넘침 false, 제목·메타·배지·아이콘 텍스트 overflow 없음.
- PC 최근3개 같은 y 좌표·동일 폭, 종류6열. 모바일 최근카드1열, 종류3열.
- 2025 아코디언 안내, 모바일 메뉴 열기/닫기, 돌아가기, 원래 대회 URL 연결 확인.
- 기존 HERO 이미지 재사용 확인: 아시안 남/여 b64 청크, AVC 남/여 source-page 이미지, VNL config 자산. Site 복사본 source-manifest.json에 SHA-256 기록.
- 운영 자체 배포/실경기 수집 검증은 작업 범위가 아니며 실시하지 않음. 실제 모바일 기기 터치 검수 대신 동일 CSS viewport의 브라우저 검수.

## 변경 파일 및 복구

신규 HTML1, CSS1, 모듈3, 테스트1, 이 보고서와 Decision Log 추가 기록. 운영 HTML/CSS/JS/JSON에는 diff가 없다. PR 미병합 상태에서는 운영 복구가 필요 없다. 시안 폐기는 feature 브랜치 및 비공개 검토 Site에만 한정하며 기존 사이트를 롤백하지 않는다.

다음 단계: 사용자가 시안을 검수한 뒤 운영 반영을 명시적으로 요청하면 최신 main과 동시 변경분을 다시 대조하고, 기존 허브 연결 범위만 별도 PR로 적용한다.

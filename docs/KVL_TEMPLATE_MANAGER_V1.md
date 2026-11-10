# KVL Template Manager v1 — 격리 관리자 프로토타입

- 상태: **PROTOTYPE / LOCAL FILE ONLY / NOT DEPLOYED**
- 작성: 2026-11-11 KST
- 기준: KVL `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md`, `docs/KVL_COMPETITION_PAGE_TEMPLATE_V2.md`, Drive 운영원칙 MASTER v19
- 기준 main: `c6a82d62cd1e4ad00d25ee5093bbbf40cf814a26`
- 핵심 목표: 디자인 변경, HERO 이미지 변환, 경기·참가팀 엑셀형 수정을 하나의 **브라우저 로컬 시안**에서 검증하기

## 시작 방법

1. 저장소의 `prototypes/kvl-template-manager-v1.html`은 CSS·JavaScript를 내부에 포함한 단일 파일입니다. 로컬 복사본을 다운로드해 브라우저로 열어도 실행됩니다.
2. 저장소 없이 단일 파일로 시험하려면 제공된 `KVL_Template_Manager_v1.html`을 내려받아 더블클릭합니다.
3. 기본 샘플 대회는 **허구의 테스트 데이터**이며 운영 기록이 아닙니다.
4. 실제 대회 편집은 `data/competitions/<slug>/config.json`와 `data.json`을 복사하여 각각 가져옵니다. 기존 파일을 덮어쓰지 않고 시작합니다.
5. 대회 정보·디자인·경기·참가팀을 편집하고 `데이터 검증`을 누릅니다.
6. `config.json`, `data.json`, `design-overrides-v1.json`, PC/모바일 WebP를 각각 내려받습니다. **다운로드만으로 운영 페이지에 적용되지 않습니다.**

## 기능과 구분

| 기능 | v1 상태 | 실제 게시를 위한 추가 작업 |
|---|---|---|
| HERO 사진 선택·PC/모바일 미리보기 | 구현(브라우저 로컬 Object URL) | 업로드 권한 및 이미지 라이선스 확인 |
| PC/모바일 WebP 변환 | 구현(2108×406 / 1258×406) | 정식 자산 경로 저장·원본 품질/인물 크롭 검수 |
| 이미지 위치·contain/cover 조절 | 구현(현행 V2 `hero.position`, `mobilePosition`, `size`, `mobileSize`로 내보내기) | PC/모바일 실제 Engine 표시 비교 |
| 대회명·계열·성별·기간·개최지 | 구현 | 출처 검수 및 실제 MASTER 대조 |
| 경기·참가팀 입력 | 구현, 기존 JSON 숨은 필드 보존 | 경기 ID/팀 코드 검증 후 MASTER 연결 |
| 경기 CSV 가져오기 | 구현(추가 전용; 중복 ID 즉시 중단) | 출처·공식자료 매칭과 변경 이력 |
| 글자 색·크기 / 아이콘 크기·위치 | **미리보기 전용** | 공통 Engine V2의 디자인 override 렌더러·스키마 검증 |
| 순위·승점 자동 계산 | **미구현** | 대회 규정별 계산기, 검증 데이터셋 |
| Google Sheets 실시간 연동 | **미구현** | 문서 ID/권한/탭·헤더 확인, 단방향 staged sync |
| 저장 / 되돌리기 | JSON 로컬 다운로드(서버 저장 없음) | Supabase 임시 저장, 변경 이력, 버전 복원 |
| 관리자 인증·웹에서 직접 게시 | **미구현 / 버튼 비활성** | Supabase 서버측 권한, 검수/승인, GitHub PR/배포 게이트 |

## 입력 계약

- 대상은 Competition Engine V2의 두 객체: `config.json`과 `data.json`입니다.
- `config.competition`은 `competitionId`, `displayName`, `officialName`, `season`, `gender`, `competitionFamily` 식별 필드를 유지합니다.
- `data.participants[].code`, `data.matches[].id`, `data.matches[].home.code`, `away.code`는 연결키입니다. 이름으로 ID를 재매핑하지 않습니다.
- 결과 편집 시 `scoreVerification`을 **false**, 상태를 `pending_review`로 표시합니다. 공식 검수 없이 확정 결과로 간주하지 않습니다.
- 원본 `rosters`, `standings`, `officialSourceKey`, `source`, `scoreVerification`, `qualifications` 등 다른 키는 수정되지 않는 한 보존됩니다. 원본 JSON이 아닌 실제 MASTER를 자동 갱신하지는 않습니다.
- CSV 양식 헤더: `id,date,time,stage,home,away,venue,homeScore,awayScore`; UTF-8 BOM 허용, 인용된 쉼표·개행 허용. 경기 ID는 기존·CSV 내 중복을 금지하고, 참가팀 코드와 날짜/점수는 가져온 후 검증합니다.
- 임의의 클라우드 통신, 쿠키, 비밀번호, access token, 로컬 브라우저 지속 저장은 **없습니다**. 운영 이미지 로딩은 공식 웹사이트 `https://kvolleylab.com`의 공개 HERO 경로에 한합니다.

## HERO 주의사항

- v1은 선택한 사진을 Canvas로 PC/모바일 각각 새로 렌더링합니다. `contain`은 이미지를 비율 보존하여 전부 보여주므로 배경 여백이 생길 수 있습니다. `cover`는 여백 없는 채움을 위해 잘릴 수 있습니다.
- 내보낸 `config.json`은 새 사진이 선택된 경우 `assets/img/competition-hero/kvl-hero-<slug>-{pc|mobile}-v01.webp` 경로를 가리킵니다. 실제 파일을 그 경로로 업로드하지 않으면 그림이 표시되지 않습니다.
- 시안의 HERO 높이/오버레이/텍스트 영역은 작업용 축약 미리보기입니다. 1180/390/360 폭의 실제 운영 Engine 검사와 동일하다고 주장하지 않습니다.

## 게시 전 보호 및 검수 게이트

1. 사용자 승인 없이 `main` / Production / 공식 MASTER를 수정하지 않습니다. 본 작업은 새 파일만 추가합니다.
2. 향후 인증은 **Supabase Auth + 서버 측 관리자 역할 검사(RLS / Edge Function)** 로 처리합니다. `assets/js/admin-access.js`의 브라우저 비밀번호 방식을 게시 권한에 재사용하지 않습니다.
3. 디자인 수정은 기본 템플릿 전체와 대회별 override로 구분하고, 국내/국제/성별 표준을 기본값으로 유지합니다.
4. 경기·로스터·선수 ID/팀 코드, 기존 라이브 스코어 15분 갱신 파이프라인, KOVO 공지와 MASTER 쓰기 범위는 독립시킵니다.
5. 공식 결과/순위는 출처와 승인 상태를 확인한 뒤, 검증된 GitHub PR을 통해 게시합니다. 운영 자동화 대회는 관리자 덮어쓰기 금지 정책을 먼저 설계합니다.
6. 게시 작업 전 config/data schema 검증, 바뀐 필드 diff, 이미지 MIME/해시, PC·모바일 QA, 롤백 가능성, Pages SHA 및 실제 HTTP를 확인해야 합니다.

## 1차 검수 순서

- 샘플 정보 편집 → HERO 시안 반영 확인
- 경기 추가/삭제 → 팀 코드 검증, 점수 정합 검증 확인
- CSV 양식 다운로드 → CSV 가져오기 후 중복 ID 재가져오기 차단 확인
- 실제 대회 config/data 불러오기 → 원본 ID, 숨은 필드가 내보내기에 남아 있는지 JSON diff
- PC WebP(2108×406), 모바일 WebP(1258×406) 로컬 파일 디코딩 확인
- PC/모바일 미리보기 1180/390/360 및 키보드 입력 확인

## 후속 단계

**v2**는 서버측 관리자 인증과 Supabase 드래프트 저장, 버전 이력, 실제 Engine의 디자인 override 스키마를 결합하고, 운영 JSON과의 양방향 충돌을 검출합니다. **v3**는 Excel XLSX/Google Sheets MASTER 연동, 대회별 공식 규정 순위 산식, 게시 승인 및 GitHub PR 생성, 배포 검증·복원을 목표로 합니다.

현재 v1은 편집기 프로토타입에 한정합니다. 사용자 승인 전 실제 운영 페이지로 배포하지 않습니다.
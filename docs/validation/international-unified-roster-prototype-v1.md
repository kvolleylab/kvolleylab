# KVL 국제 대표팀 2026 통합 선수명단 프로토타입 v1

Date: 2026-11-18 KST
Status: USER REQUESTED / ISOLATED PROTOTYPE / NOT DEPLOYED

## 기준 양식 및 요청 배경
사용자는 앞선 이미지 시안의 생년월일·소속팀·신장·Volleybox 누락과 과도한 대회 이력 동그라미 표현을 정정했다. 기존 KVL 팀 페이지와 v2 명단, 선수프로필을 유지하면서 오른쪽에 **대회별 작은 원형 참가 표시만 추가**하도록 시연한다.

검토 기준: AGENTS.md, PROJECT_RULES.md, DESIGN_SYSTEM.md, docs/PLAYER_STANDARD.md, docs/KVL_RESPONSIVE_SCALING_STANDARD_V1.md, assets/js/kvl-international-countries-v1.js 및 css, assets/js/kvl-vleague-roster-v2.js 및 css, player.html, assets/css/player-profile-integration-v1.css.
기준 main: 22f67b13b08ff7c1c0632c7c84b2f8fef3d869f5.

## 실제 구현 범위
- 현재 KVL 팀 카테고리·국제대표팀 헤더·국기·연도·대회명·명단 보기 구조 참고.
- 대회 세 가지: 2026 VNL, 2026 아시안게임, 2026 AVC 남자 대륙선수권.
- 아래 2026 통합 선수명단 표는 NO. / 한글·영문명 / 생년월일 / POS / 신장 / 검증된 소속팀 / Volleybox / 참가 이력.
- 참가이력은 같은 칸에 지름 8~9px 점 3개. VNL·아시안게임 빨강, 대륙선수권 검정. 해당 대회 기록 미확인 시 대시.
- 대회별 명단 보기 필터와 전체/2개 이상/선수명 검색, 선수 선택 시 상세에 대회별 등번호·원본 상태, KVL/Volleybox/공식 프로필 링크.
- PC 1440px 컴팩트 목록, 모바일 390/360px 필드를 유지한 다행 카드형 목록. 본문 가로 넘침 방지.

## 자료 신원 무결성
- 운영 GitHub 원본 VNL 일본 남자 16명, 아시안게임 12명, AVC 대륙선수권 최종 14명 = 대회별 선수기록 42건.
- 정확한 영문 이름+생년월일 또는 동일 Volleybox 영구 선수 페이지 번호+생년월일을 동시에 확인한 선수만 통합한다. 같은 등번호라는 이유로 합치지 않는다.
- 이 기준의 통합 결과 26명. 후카츠 아키히로(1987-07-23)와 후카츠 히데오미(1990-06-01)는 서로 다른 선수이며 같은 등번호 3번을 유지한다.
- 래리 이크 에브바데-단과 표기 차이가 있는 대륙선수권 자료는 동일 공개 Volleybox 프로필 번호와 생년월일이 확인될 때만 하나로 묶는다.
- KVL 기존 선수 프로필은 국제 MASTER에서 한국어/영어명·성별·국적·생년월일이 정확하게 일치하는 단 하나의 영구 ID에서만 연결한다. 기존 식별자 충돌 블록은 제외한다.
- 검증 소속팀은 data/competitions/avc-men-continental-2026-clubs-2026-27.json의 2026-09 확정 상태 또는 아시안게임 당시 confirmed 출처에서만 표시한다. 자료상 다른 명칭은 선수 상세에 남긴다. 최신 실시간 소속을 추정하지 않는다.
- 2026 일본 AVC 남자컵 참가명단은 등록되지 않았으므로 포함하지 않는다.
- VNL Active / Reserve 또는 대회 최종 명단 포함은 경기 코트 출전으로 단정하지 않는다.

## 실행 및 검증
- node scripts/build-international-unified-roster-prototype-v1.cjs
- node --test tests/international-unified-roster-prototype-v1.test.cjs
- node scripts/build-international-unified-roster-prototype-v1.cjs --output=dist/KVL_국제대표팀통합명단_v1.html
- GitHub Actions: syntax, 출처 인원 수 16/12/14, 통합 26, 소속팀·DOB·Volleybox 필드, 모바일·PC 실제 Chromium, 필터·검색·상세 팝업, 화면 가로 넘침.
- Actions 산출물: 외부 데이터 호출 없이 직접 열리는 독립 단일 HTML 및 화면 캡처. 실제 사용자 다운로드 파일명 KVL_국제대표팀통합명단_v1.html.
- Google Drive 원본 별도 접근 불가 시 NOT VERIFIED. 기존 KVL GitHub 공식자료 검수본에서만 파생.

## 운영 제한
프로토타입 전용 브랜치에만 위치하고 운영 main, teams.html, 실제 국가·선수 MASTER, 대회 원본명단, KOVO 자동화, Supabase 개인 메모와 회원 접근 정책은 변경하지 않는다. 사용자 검수·명시적 운영 승인 전에는 정식 홈페이지 연결 금지. 2026년 일본 남자 사례에 한정하며 40개국 전체 및 전 시즌 자동 통합 준비 완료로 확대 해석하지 않는다.

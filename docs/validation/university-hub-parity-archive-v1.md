# 대학배구 허브 디자인 복원·2024/2025 결과 연결

Date: 2026-11-07 KST. Base main: `ef239869b3bc303f711228f146011b367668f0d3`.
Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. Deployment evidence is recorded in the release PR after Pages/live verification.

## 승인·변경 범위

기존 실제 홈페이지 반영 승인에 이어 사용자가 글꼴·기본 템플릿 차이, 원래 대회 hover/클릭, 여자부 이동, 메인 HERO 복원과 과거 2025·2024 결과 연결을 요청했다. 해당 허브만 수정한다.

- 2026년: 왼쪽 공식 모바일 HERO, 오른쪽 네이비 `#1B223A`와 기존 남녀 순위 배치 유지. 전체 카드 링크 복원, 별도 남자부·여자부 링크 추가. 네이티브 링크라 Enter·새 탭 열기가 가능하다.
- 공통 글꼴 상속, 12px 카드 곡률, 그림자 제거, 국내 기본 템플릿 트로피 재사용. 팀명 PC13/mobile12px, 순위 PC12/mobile11px. 이전 프로토타입의 Arial/Malgun Gothic 강제 지정 및 과한 굵기를 제거했다.
- `DESIGN_SYSTEM.md`의 과거 Arial 권장과 달리 실제 공통 `pretendard-global.css`, 2026-10-15 HOME handoff 및 현행 국내 템플릿은 Pretendard다. 이번 사용자 요청인 기존 템플릿 일치를 따라 허브에서 공통 폰트를 상속하며 공유 CSS는 수정하지 않는다.
- 메인 HERO 이미지는 원래 자산 그대로다. 달라 보였던 원인은 허브 로컬 폰트·추가 상단20px·이중 좌우 여백이었다. 원래 `.univ-hub-main` 폭/여백/공통 HERO를 복원했다.
- 과거 6개 대회는 이미지 없는 흰색 결과 카드, 금색 border/title hover. 별도 대회 페이지가 없으므로 가짜 대회 링크를 만들지 않고 공식 남녀 결과 출처 링크만 제공한다. 연도 선택 및 과거 연도 아코디언 모두 연결한다.
- 2024년 연맹1차=단양, 2차=고성. 2025년 연맹1차=고성, 2차=단양. 연맹전 남자 순위는 A그룹임을 화면에서 안내한다.

## 결과 검증·출처

새 파일 `data/archive/university-results-v1.json`에 공식 출처 ID/URL/확인일/산출 기준을 함께 보관한다. 기존 2026 JSON/MASTER/Competition Engine V2/공통 메뉴/자동화/다른 대회 파일은 변경하지 않는다. 경기별 상세 페이지·자동화 등록이 아닌 과거 허브 결과 요약이다.

Google Drive KVL_운영원칙_MASTER_v18과 대학 폴더 검색 확인. 2024/2025 대학 결과 MASTER는 검색에서 발견되지 않았다(`NOT VERIFIED`: 해당 MASTER 존재/내용). 공개 연맹 공식 일정·결승·준결승을 직접 대조했다. 2024 U-리그 남자부는 준결승 없이 6강 리그 상위2팀의 결승이므로 3·4위는 당시 6강 순위를 유지한다. 그 외 토너먼트 준결승 탈락팀은 공동3위로 요약한다.

| 연도·대회 | 남자 1위 / 2위 / 3위(·4위) | 여자 1위 / 2위 / 공동3위 | 공식 결과 |
|---|---|---|---|
|2025 U-리그|인하 / 중부 / 한양·성균관|경일 / 단국 / 광주여·목포과학|[남](https://kuvf.goosisoft.com/534), [여](https://www.kuvf.co.kr/539)|
|2025 고성|조선 / 인하 / 명지·성균관|광주여 / 경일 / 목포과학·호남|[남](https://kuvf.goosisoft.com/561), [여](https://www.kuvf.co.kr/580)|
|2025 단양|한양 / 조선 / 홍익·중부|경일 / 목포과학 / 단국·광주여|[남](https://kuvf.goosisoft.com/592), [여](https://kuvf.co.kr/598)|
|2024 U-리그|한양 / 인하 / 성균관(3)·중부(4)|광주여 / 경일 / 단국·우석|[남 결승](https://kuvf.goosisoft.com/480), [6강](https://kuvf.goosisoft.com/482), [여](https://www.kuvf.co.kr/486)|
|2024 단양|인하 / 한양 / 성균관·중부|우석 / 광주여 / 단국·목포과학|[남](https://kuvf.goosisoft.com/493), [여](https://kuvf.co.kr/505)|
|2024 고성|인하 / 중부 / 경기·경희|단국 / 광주여 / 경일·우석|[남](https://kuvf.co.kr/512), [여](https://kuvf.co.kr/523)|

## QA

- `node --check assets/js/university-hub-years-v1.js`: PASS.
- `node tests/university-hub-years.test.cjs`: PASS. 기존 24순위 불변/공식3이미지, 남녀6경로, 과거6대회48순위/출처 참조/2024시리즈 순서/3·4위 구분/이미지 및 가짜 페이지 없음/서로 다른 DOM ID.
- `git diff --check`: PASS.
- Quality Audit 56개 단위 검사 PASS. 새 공개 JSON의 출처·확인일·SHA-256을 `scripts/quality_audit/public-review-manifest.json`에 등록한 뒤 export gate PASS. 기존 manifest 항목/검증기는 변경하지 않는다.
- 브라우저 PC1348px, mobile360/390 iframe(내부345/375px): 가로 넘침0. 원래 메인 HERO PC225px/mobile215px, 공통 Pretendard, 2026 네이비 배경, archive 흰색·이미지 없음 확인.
- 연도2024 선택→연맹1차 필터→단양 1개, 전체 보기→2026 3개 복귀, 2025 아코디언 펼치기 3개/중복ID없음 확인.
- 2026 고성 전체 카드 Enter→남자부 URL, 모바일 여자부 버튼→여자부 URL 확인. 로컬 HTTP에서 상세 Engine이 HTTPS canonical 검증으로 로딩을 거부하므로 검증기를 변경하지 않고 실제 HTTPS 운영 상세 페이지를 확인한다.
- 실제 HTTPS U-리그 여자부: ready / women / 올바른 대회 제목 확인. 나머지 여자부/발행 후 클릭 결과는 PR 배포 증거에 추가한다.

## 복구

이 릴리스 squash commit만 revert한다. 기존 대회/MASTER/Engine 데이터는 건드리지 않았으므로 별도 데이터 복원은 필요하지 않다. 2024/2025 요약 JSON은 이 변경에서만 새로 추가한다.

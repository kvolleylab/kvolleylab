# KVL 2026 전국대학배구 고성대회 남자부 — 기존 디자인 PC·모바일 비교 v1

작성: 2026-11-11 KST  
작업 범위: **완료된 실제 대회 화면의 디자인만 비교**, 운영 데이터/화면 미수정  
상태: **IMPLEMENTED (isolated prototype) / SOURCE-CONTRACT VERIFIED / LOCAL FIXTURE SCREENSHOTS / LIVE-SITE BROWSER NOT VERIFIED / NOT DEPLOYED**

## 기준 자료

- 운영 대회: `competition-engine.html?competition=university-goseong-men-2026`
- 해당 config: `data/competitions/university-goseong-men-2026/config.json`
- 해당 데이터: `data/competitions/university-goseong-men-2026/data.json`
- 기준 최신 main 확인: `99d4fc29ffe50b37c09e95ed6c05eb97efce847f` (이번 작업 시작 시 재조회; 장기 고정값 아님)
- 기존 디자인 편집기 Draft PR #287 → 관리자 저장 Draft PR #288 위에 쌓은 **격리 비교 PR**
- 운영원칙: KVL `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md`, Google Drive 운영원칙 MASTER v19

## 실제 기존 대회 데이터 상태 (읽기 전용)

- 대회명: 2026 대한항공배 전국대학배구 고성대회 · 남대부
- 상태: `completed`
- 참가팀: 15개, 전체 경기: 35개
- 조별순위: A/B/C조 각 5팀
- 1위 인하대, 2위 한양대, 공동 3위 중부대·조선대 (원본 최종순위 기준)
- 조 A 일부 원본값: 조선대 4승·0패·11점, 성균관대 3승·1패·9점, 경기대 2승·2패·7점, 경일대 1승·3패·3점, 목포대 0승·4패·0점
- 기존 Team ID, 경기 ID, 로고 URL, standings, 선수 연결/자동화는 전혀 변경하지 않음

## 이번에 구현한 실제 엔진 비교

1. `prototypes/kvl-goseong-engine-compare-v1.html`
   - 같은 출처에서 2개의 **실제** `competition-engine.html` iframe을 독립적으로 로드하도록 구성
   - 좌측: Engine 원본 스타일; 우측: 한정된 CSS만 추가한 변경 미리보기
   - 실제 화면 폭 선택: PC 1180px / 모바일 390px / 모바일 360px
   - 화면: 참가팀·로고(`?view=rosters`), 조별순위·승패(`?view=groups`), 경기일정·스코어(`?view=schedule`), 대회 한눈에(`?view=overview`)
   - 변경값 JSON 다운로드만 가능. 서버 저장이나 게시 호출 **없음**

2. `assets/js/kvl-goseong-layout-compare-v1.js`
   - 인가된 `goseong-men-2026` slug 및 iframe의 실제 URL·기본 `kvl-competition-template-v2` 클래스를 검사
   - **운영 데이터 JavaScript 객체는 수정하지 않고** 별도 `style#kvl-goseong-compare-v1` 요소만 추가
   - 실제 참여팀 클래스 `.kvl1180-participant-button`, `.kvl-participant-flag`, `.kvl1180-participant-button-copy strong`; 한눈에 카드 `.dv2-team-tile`; 경기 로고 `.kvl1180-inline-logo`
   - 실제 조별순위 `.kvl1180-pool-table-head`, `.kvl1180-pool-w` / `.kvl1180-pool-l` 동시 이동
   - CSS 항목은 화이트리스트 숫자/enum/색상만 허용. 임의 CSS/HTML 저장 불가
   - 원본 프레임은 디자인이 변경되지 않음. `{ }` 적용 시 CSS 0자여서 실질적으로 원본과 동일

## 1차 비교 제안값 (모두 시안, 미승인)

| 항목 | 기존 기준 | 비교 시안 |
| --- | --- | --- |
| 팀명 | 기존 KVL 줄바꿈 | 두 줄 공간 확보, 글씨 13px(모바일 11.2px) |
| 로고/참가팀 | 대략 48px(모바일 38px, 대상 컴포넌트) | 46px(모바일 36px) |
| 로고 상하 | 0px | 2px 위 |
| 로고 아래 간격 | 기존 컴포넌트값 | 9px |
| 조별순위 승 머리글·숫자 | 기준 | 오른쪽 3px |
| 조별순위 패 머리글·숫자 | 기준 | 왼쪽 3px |
| 조별순위 행 상하 | 기존 CSS | 10px (원본 CSS와 차이 계산) |
| HERO/결과/선수명단 | 기존 | **변경 없음** |

원본 KVL CSS에 이미 여러 viewport-specific `!important` 규칙이 있으므로, 데스크톱/모바일 실제 iframe에서 computed-style 검사 후 추가 충돌이 있는지 확인해야 한다.

## 검증 결과

### 실제 소스 기반 코드·데이터 검증

- GitHub main의 실제 config/data 재조회 완료
- CSS target DOM 클래스가 기존 `assets/js/kvl-competition-components-v2.js`와 `kvl-domestic-home-v2.js`에 있는지 확인
- DIL 도구 실행 내 JS **17개 단위 Assertion PASS** (비정상 CSS 입력 차단, slug 한정, 중복 스타일 노드 방지, 기존 data 원본 불변, HTML 화면 선택 등)
- `tests/kvl-goseong-layout-compare-v1.test.cjs`에 동등한 회귀 검사 추가
- 운영 `main` 및 실제 기존 대회 `config.json`, `data.json`, JS/CSS를 변경하지 않음

### 로컬 브라우저 (재현용 fixture, 운영 화면 캡처 아님)

로컬 실행 환경은 GitHub와 운영 사이트의 외부 네트워크 DNS/탐색이 차단되어, **원본 운영 페이지의 실제 브라우저 스크린샷을 확보하지 못함**.

대신 실제 2026 고성 참가팀 15개/승패 5행 및 운영 엔진에서 읽은 DOM 클래스·해당 CSS 규칙을 사용한 격리 fixture로 PC 1180, 모바일 390/360 픽셀을 Chromium `page.set_content`으로 재현했다. 이미지 일부(목포대/경일대/조선대)는 저장소의 원본 SVG, 기타는 **검증용 대체 표식**이다. 별도 풀네임 카드도 오버플로 검수용이며 운영 표시명 변경이 아니다. HERO 배경 및 모든 대회 섹션의 전체 CSS는 재현하지 않았다.

- 1180px: 로고 48→46px, 이름 14→13px, 승 +3px/패 -3px
- 390px, 360px: 로고 38→36px, 이름 12→11.2px, 승 +3px/패 -3px
- 3개 viewport 모두 참가팀 수 **15↔15**, A조 순위 **5↔5**, 문자/승패/점수 동일, 바깥 페이지 전체 overflow=0
- 로컬 fixture는 운영 페이지의 외형·CSS 전부를 대신하지 않는다. 실제 페이지 게이트 **NOT VERIFIED**

### 실제 Engine 브라우저 게이트 (미실행)

- 같은 origin에 격리 preview 배치 뒤 실제 Engine PC 1180/모바일 390/360의 캡처·computed style 확인
- 페이지의 roster tab, group tab, schedule tab, TEAM 링크, 성별 전환, 모바일 달력 날짜 팝업, 긴 이름·내부 horizontal scroll 비교
- 기존 라이브 V-리그 자동화 불변 확인(이번 CSS는 고성 남자부 iframe에만 한정, 운영 파일 미변경)
- 스크롤, 클릭, hover, 포커스, alt text·접근성 검수

## 운영 적용과 복구

**운영 반영 승인 없음.** 본 PR은 #288 위에 쌓인 격리 feature PR이며 main / 운영 Pages / Supabase / Cloudflare / MASTER / 선수 DB 데이터에는 손대지 않는다. 별도 운영 배포 승인 전까지 기존 대회 화면은 바뀌지 않는다.

실제 프리뷰 승인 후에는:
1. 데이터 불변 및 원본과 수정안 차이 재검증
2. PC·모바일 실제 브라우저 게이트 완료
3. 관리자 인증형 드래프트 저장·게시 승인 분리
4. GitHub PR로 style override만 게시, 실패 시 revert

이 검수는 **디자인 범위의 시각 비교**이지, 운영 디자인 변경·새 대회 생성이나 경기 데이터 정정이 아니다.

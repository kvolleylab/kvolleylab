# K-Volley Lab — Decision Log & Session Handoff

## 2026-10-26 — Draft Hub 팀별 추첨 확률 카드

Status: APPROVED / IMPLEMENTED / VERIFIED. 2026-10-26 사용자가 “반영해”로 운영 적용을 승인했다. 실제 배포 확인은 PR #166에 기록한다. 사용자 요청 URL의 2026-27 남자부에 드래프트 연도와 공식 참가 신청자 사이 로고·팀명·구슬 수(확률)를 표시한다. KOVO 공식 확률 및 총 100개 구슬을 대조하고 기존 V-리그 로고를 재사용한다. 신청자·선수 ID·프로필·지명 결과는 변경하지 않는다. 여자부/미등록 시즌에는 남자부 배분을 노출하지 않으며 로딩 실패는 신청자 기능에 전파하지 않는다. PC/390px/360px, 자동 검사 12개 통과. [검수·출처·적용 파일·복구](validation/draft-lottery-20261026.md). 승인된 운영 적용 범위는 이 추첨 카드이며 다른 기능과 데이터 변경은 포함하지 않는다.

## 2026-10-24 — Six reviewed player names

Status: APPROVED / IMPLEMENTED; final CI and deployment evidence belong to the release PR.

The project owner explicitly confirmed 옹민혁(경일대), 염시원(경희대), 전유석(중부대), 장승호(충남대), 송건환(홍익대), 이소민(광주여대). Apply only these name corrections to the already verified existing IDs and add their official applicant links. Preserve prior names in the correction log, source snapshots, DOB, position and school history. No new ID or name-only automatic merge is authorized. The remaining 12 applicants stay unresolved. The member-service release gate in PR #155 is unchanged.

Implementation: `fix/player-reviewed-identities-20261024`, based on `8c4327c` (PR #156 preserved); [detailed scope, Drive backup, validation and recovery](PLAYER_NAME_REVIEW_20261024.md).

**Purpose:** Durable record of approved decisions so a new ChatGPT Work / Codex / GitHub session can resume without relying on conversation history. This log records **intent and acceptance**, not an assertion that all changes are deployed.

**Last edited:** 2026-10-23. Latest task source verification is recorded below. Historical 2026-10-21 evidence follows. **Session evidence:** GitHub `main` inspected for `index.html`, `players.html`, and `player.html` on 2026-10-21. Relevant Google Drive MASTER was **not re-verified** as part of creating this log.

## Decision status definitions

- `PROPOSED`: idea not approved.
- `APPROVED`: user has chosen the behavior/design, but implementation not implied.
- `PROTOTYPE`: work being tried outside production; preview status must be checked.
- `IMPLEMENTED`: committed in a specified branch, not necessarily deployed.
- `VERIFIED`: functional acceptance checks passed with evidence.
- `DEPLOYED`: verified on operating site after an approved release.

Never turn `APPROVED` into `DEPLOYED` without evidence.

## 2026-10-23 — KVL-PLAYER-002 / KVL-DRAFT-001: Production integration

**Status:** APPROVED by the current user request; IMPLEMENTED and locally VERIFIED in `feature/player-draft-integration-20261023`. This is a pre-merge snapshot; use the PR release verification for DEPLOYED status.

- Integrate the approved B search/grid into existing `players.html`; reuse the old catalog pipeline and profile renderer. Do not publish a replacement player database.
- Maintain existing Player IDs, links, shared navigation, comparisons and the original eligibility board inside one annual `draft-hub.html`.
- Official KOVO applications are independent from eligibility and selection results. Verified links 99; 18 pending remain unlinked. Unknown DOB or known affiliation/grade conflicts require review.
- Real member authentication and per-user data ownership are not implemented. Production private reads/writes stay disabled; prototype A/B notes are not production authentication.
- Current task explicitly authorizes production after PR/QA verification, superseding the old prototype-only release restriction for this scoped integration. It does not authorize identity correction or automatic MASTER merges.
- Main/rollback SHA `7f5b90109c912ee1cdaa93c463a5d667a1a95bdb`, backed up as `backup/player-integration-before-20261023`.
- Full findings, original raw ID overlap caveat, evidence, remaining work and recovery: [integration handoff](PLAYER_DRAFT_INTEGRATION_v1.md).

## Standing decisions

### KVL-OPS-001 — Persistent developer operating rules (2026-10-21)

**Status:** APPROVED. **Source:** user approval on 2026-10-21.
The seven mandatory rules are codified in root `AGENTS.md`: inspect GitHub/Drive; impact analysis; reuse past successful code; isolate edits in branch/prototype; verify PC/mobile and regressions; report changes/tests/unresolved issues; do not change production before user approval. Use the start-up and handoff checklists from `AGENTS.md` for every new environment.

### KVL-UX-001 — Shared homepage experience and navigation

**Status:** APPROVED; homepage `index.html` currently uses `max-width:1180px` on `main` (verified 2026-10-21).
Maintain one recognizable KVL design family across pages. Preserve shared left navigation and menus; change page content without replacing shared navigation. Calendar width was approved to match the 1180px homepage; **calendar deployment was not verified in this log**. Older general documents permitting larger widths should not be treated as overriding the newer page-specific decision.

### KVL-HERO-001 — Hero production assets

**Status:** APPROVED; deployment status varies by page.
Hero image targets: PC **2108 × 406**, mobile **1258 × 406**. Prepare completed images at actual target dimensions rather than using ad hoc CSS stretching/cropping as a substitute. Before connecting a Hero, inspect previously successful commits, storage paths, config wiring, and cache versioning. Preserve aspect and text-safe regions.

### KVL-PLAYER-001 — Player workspace B prototype

**Status:** APPROVED DESIGN / PROTOTYPE. **Not confirmed deployed.**
Preview reference (may expire): `https://kvl-player-workspace-prototype-v1.blackisle17.chatgpt.site/players.html`

Approved behavior and design:
- Male bookmarked player: **dark blue** icon; female: **dark rose-pink** icon.
- Male player card hover: blue outline; female hover: rose-pink outline; remove female-only left-side colored shadow for consistency.
- Bottom action area ("관심선수" and "프로필보기"): both genders get a subtle gender-matched tinted background.
- Filter by high-school/university category with relevant school choices; allow **multi-select grades**.
- Hide internal KVL player IDs on search-result cards.
- Keep gender-sensitive colors, stronger school label, national-team/awards info if supported by data, larger position/height/birth-year text.
- Add grid/compact mode for more cards per screen. Compact card must show **name, school, position, height**.
- Player profile overlay must close via both **X** and clicking the dimmed backdrop.
- Logged-in users may bookmark players and create/edit/delete multiple personal notes; those notes must be private to that user via actual authentication/access control, not published GitHub JSON.

**Protection:** Production `players.html` and `player.html` remain separately wired to legacy player search/details scripts on GitHub `main` in the 2026-10-21 inspection. Do not overwrite their search, comparisons, links, and filters when integrating the B prototype. Test in isolation before production approval.

### KVL-COMP-001 — Competition and schedule structure

**Status:** APPROVED; specific implementation/version must be re-verified for each competition.
Reuse existing common competition engine/template when feasible. Respect distinct tournament formats (group stage / bracket / classifications), gender filters, alphabetic sorting when grouping does not exist, set/point ratio ordering, and existing data IDs/routes. Avoid duplicating a new engine merely to handle one competition unless justified.

### KVL-DATA-001 — Official source and site data separation

**Status:** APPROVED / documented in existing `PROJECT_RULES.md`.
Existing Google Drive competition folders retain originals as the source archive. Confirmed structured data passes validation before JSON/site use. Preserve stable Master IDs and `source_id`. KOVO official-notice collection, match-score collection, and individual player-stat collection are separate scopes; do not imply live updates are functioning without end-to-end test.

## Restart checklist / next-session handoff

1. Identify the requested page/feature and user-approved requirements.
2. Read `AGENTS.md`, this log, existing standards, current `main` files, relevant historical commits, and Drive MASTER when applicable.
3. Capture current SHA and list differences between approved design, prototype, and production.
4. Resume from the existing branch/prototype, not a new duplicate approach, unless the old artifact is demonstrably unavailable.
5. Execute tests and produce a compact status report: `APPROVED | PROTOTYPE | IMPLEMENTED | VERIFIED | DEPLOYED`, changed files, test results, blockers, next action.
6. Log every newly confirmed decision here, keeping obsolete decisions marked `SUPERSEDED` rather than erasing history.

## Open verification items as of 2026-10-21

- B prototype: approved modifications and behavior need a verified implementation and PC/mobile regression test.
- Homepage/calendar 1180px parity: homepage value verified in code; calendar production status still requires verification.
- KOVO live-match collector: do not mark working without a real-match ingestion/update report.
- Older `DESIGN_SYSTEM.md` contains generic size/menu conventions that may predate newer approved screen designs; reconcile per task rather than blanket rewriting it.

## New decision template

```md
### KVL-AREA-NNN — Decision title (YYYY-MM-DD)
Status: PROPOSED | APPROVED | PROTOTYPE | IMPLEMENTED | VERIFIED | DEPLOYED | SUPERSEDED
Applies to: files/pages/competition
Decision: exact approved behavior
Rationale / constraints:
Implementation: branch, PR, commit, deployed URL (only if verified)
QA: PC/mobile, data/logic and regression evidence
Supersedes:
Next action:
```


## 2026-10-24 — Domestic Template v2 운영 반영

사용자가 승인한 국내대회 시안을 실제 홈페이지에 반영하도록 요청했다. 고성·단양 남녀 4개 페이지에 홈형 디자인을 선택 적용하며, 경기 데이터·예선 종합순위·사다리/부전승·대학 상세/선수명단 경로는 기존 공통 엔진을 유지한다. 조편성이 있으면 조별/조 내 가나다순, 없으면 전체 가나다순. 모바일도 실제 사다리를 유지한다. v1의 화면 동결 규칙에 대해 이 범위는 v2로 확장한다. CBS 및 중·고 허브는 별도 시안이며 이번 운영 적용 대상은 아니다. 상세: domestic-template-v2.md, validation/domestic-home-v2-20261024.md.


## 2026-10-24 — 중·고 허브 승인 시안 운영 통합

Status: APPROVED / IMPLEMENTED / VERIFIED (배포와 live 확인은 해당 release PR에 기록). 사용자가 수정된 중·고 시안을 실제 홈페이지에 반영하도록 명시적으로 승인했다. 기존 `domestic-competitions.html?division=school` 주소와 공통 좌측 메뉴를 유지하며, 홈형 Hero·최근 대회·남녀 색상 패널·금색 상호작용·트로피·연도별 펼침을 적용한다. 부문 필터는 `category` 파라미터를 사용해 기존 `division=school` 라우팅을 보존한다. 기존 school-years/catalog 및 domestic 경기 JSON에서 읽고 데이터/선수 ID는 변경하지 않는다. 개별 Hero 미등록 대회는 승인된 공통 자산을 사용한다. 앞선 국내대회 v2 기록의 “중·고 허브는 운영 대상 아님” 제한을 이 허브에 한해 대체한다. 개별 중·고 대회 엔진은 이번 대상이 아니다. QA/복구: [검수 보고서](validation/school-hub-v2-20261024.md).


## 2026-10-25 — 국내대회 기본 템플릿 가독성·달력·트로피 통일

Status: APPROVED / IMPLEMENTED / VERIFIED (배포 결과는 release PR에 기록). 사용자가 기존 운영 고성·단양의 공통 템플릿 수정을 요청했다. 연도는 날짜 열에 맞추고 월은 가운데 정렬, 메뉴/남녀 전환 글씨 확대, overview 참가대학 로고·이름을 참가대학 페이지와 같은 크기로 통일, 경기일 테두리를 내부 표시로 변경한다. Overview 순위와 최종 1~4위는 기존 허브의 SVG 트로피(금/은/동)를 사용하며 PC CSS 메달 장식을 제거한다. 공동 3위/사다리/데이터/링크 의미는 유지한다. PC 및 모바일을 함께 제시한다. 상세와 복구: [검수 보고서](validation/domestic-template-readability-20261025.md).


## 2026-10-25 — 달력 단위·조별순위 글씨 크기 추가 조정

Status: APPROVED / IMPLEMENTED / VERIFIED (배포 결과는 release PR). 기존 운영 기본 템플릿의 추가 수정 요청에 따라 연도 숫자와 년, 월 숫자와 월의 크기를 각각 같게 한다. 조별순위 머리글은 해당 화면의 대학명과 같은 크기로 키우며, 긴 득실비 머리글은 두 줄을 유지한다. 검토 Site의 전체 조 선택창에도 같은 기준을 적용한다. 운영의 공통 CSS/캐시 버전과 검토 Site CSS만 수정한다. 순위 데이터·계산·팀 연결·필터 동작은 변경하지 않는다. 검수: [보고서](validation/domestic-calendar-standings-type-20261025.md).

## 2026-10-25 · 국내대회 조별순위 본문 수치 및 조 요약 크기

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 확인은 release PR에 기록). 사용자의 후속 요청에 따라 순위표 안의 숫자와 진출 표시는 각 표의 대학명 크기를 사용하고, ‘5팀 · 10경기’는 ‘A조’ 크기를 사용한다. 고성·단양 남녀 공통 domestic-home-v2 CSS와 기존 기본 템플릿 Site에 적용한다. 운영 조별/PC 종합 수치는 17px, 모바일 종합 수치는 해당 대학명과 같은 15px, 조 요약은 18px이다. 긴 소수점 수치를 위해 PC 득실비 열을 60px로 조정했다. 데이터·순위 계산·필터·팀 링크는 변경하지 않는다. 검수: [보고서](validation/domestic-standings-values-20261025.md).

## 2026-10-26 · 대학 U-리그에 승인된 국내대회 기본 템플릿 적용

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 결과는 release PR 기록). 사용자가 “이 시안으로 대학 U리그의 페이지도 변경”을 요청했다. 남녀 정식 config에 `domestic-home-v2`를 선택 적용하며 기존 Hero·85경기·순위·학교/선수 경로를 유지한다. 여자부는 단일리그의 `리그순위` 탭·카드와 전체 가나다순 참가대학을 유지한다. 남자부 A/B조 및 6강리그 경기 필터를 유지한다. 모바일에서도 기존 모바일 Hero와 4강 사다리/내부 스크롤을 사용한다. 이전 v2 문서의 U-리그 제외 및 v1의 U-리그 글씨 크기 고정 규칙을 이 범위에서 대체한다. 긴 순위 상태 문구는 줄바꿈한다. 공통 기능 회귀 8/8 및 PC/390px/360px 검수 완료. [보고서](validation/uleague-home-v2-20261026.md).

## 2026-10-26 · 달력 기본 월 및 U-리그 예선 집계 범위 수정

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 완료는 release PR 기록). 기존 운영 페이지에 대한 사용자의 수정 요청. 달력은 진행 중 한국시간의 현재 월, 종료 후 마지막 경기 월, 시작 전 첫 월을 연다. 공통 템플릿 검토 Site에도 적용한다. 남대부 예선 종합순위는 pool 값이 있는 모든 경기를 합산하던 버그로 6강리그 15경기가 섞여 있었다. 예선 standings의 조 및 양 팀 소속이 일치하는 경기만 허용하고 결선 라운드는 제외하여 A/B조 49경기만 집계한다. 기존 승률·득실비 산식, 원본 경기 데이터·최종순위·경기일정 필터는 유지한다. 자동 검증 16/16, 타 대회 순위 DOM 비교 7/7, PC/모바일 검수 완료. [보고서](validation/uleague-preliminary-calendar-20261026.md).

## 2026-10-26 · U-리그 6강리그 최종순위와 4강 연결

Status: APPROVED / IMPLEMENTED / VERIFIED (배포 증거는 release PR 기록). 사용자가 4강 대진표 위에 6강리그 최종순위를 추가하도록 요청했다. 남자 U-리그에만 공통 엔진의 선택형 leagueStage 표시를 적용한다. 기존 15경기를 KUSF 공식 요강의 승점·승수·점수 득실비·세트 득실비·동률 팀 간 성적으로 계산한다. 예선 집계와 분리하고 실제 준결승 참가 4팀을 강조하며, 1위–4위/2위–3위 연결을 사다리 앞에서 설명한다. PC 표/모바일 학교별 카드, 기존 팀 경기기록 경로와 사다리를 유지한다. 원본 경기/선수 데이터 변경 없음. Drive 요강 대조, 자동 검증 19/19, 9개 대회 기존 5개 영역 DOM 동일 및 PC/모바일 확인 완료. [보고서](validation/uleague-six-league-20261026.md).

## 2026-10-26 · 국내대회 기본 템플릿을 중·고 6개 대회에 운영 적용

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 증거는 release PR 기록). 사용자가 중·고 목록의 대회들을 국내대회 기본 템플릿으로 실제 홈페이지에 반영하도록 요청했다. CBS·IBK·대통령배·익산·삼척·춘계 24개 부문을 공통 엔진에 연결한다. 네 부문 선택/남녀 색상/달력/조별 참가학교/트로피/사다리를 공유하고 기존 주소를 유지한다. 모바일 조별순위는 숨겨지던 수치를 학교 아래 나누어 표시한다. 기존 경기·학교명 alias·입상팀·실제 부전승을 유지하며, 4건 원문 세트 불일치와 CBS 미검수 영역은 명시한다. 허브 요약도 상세 기록으로 연결한다. 이전 중·고 개별 상세 및 CBS 적용 제외 결정을 이 범위에서 대체한다. [검수 보고서](validation/school-domestic-home-v2-20261026.md).


## 2026-10-26 · 중·고 예선 종합순위 누락 복구

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 결과는 release PR 기록). 사용자가 중·고 조별순위 안의 예선 순위 누락을 지적했다. 이전 템플릿 이식에서 `overall:false`와 `combined:false`로 숨긴 예선 종합순위를 춘계·삼척·익산·대통령배·IBK의 20개 부문에 복구한다. 공통 엔진의 기존 승률 → 세트 득실비 → 점수 득실비 산식을 그대로 사용하며, 조별 진출 순위와 별개인 KVL 산출 순위임을 유지한다. 예선·사전경기만 집계하며 결선·최종순위는 섞지 않는다. CBS는 조 편성/학교명/전체 기록 미검수 상태이므로 확정 순위를 만들지 않는다. 경기 데이터·공통 렌더러·대학대회는 변경하지 않는다. [검수 보고서](validation/school-preliminary-overall-20261026.md).


## 2026-10-26 · PC 조별순위 카드 반폭 고정·열 간격 통일

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 증거는 release PR 기록). 사용자가 국내대회 기본 템플릿의 PC 조 카드를 한 행 두 개, 각각 동일한 반폭으로 고정하도록 요청했다. `domestic-home-v2`에 한정해 901px 이상에서 2열/16px 간격을 사용하고, 순위·팀·승·패·승점·세트득실비·점수득실비 헤더와 값에 같은 grid를 적용한다. 팀 열은 가변 폭과 추가 오른쪽 여백을 갖고 긴 이름은 말줄임 없이 줄바꿈한다. 승/패/승점은 각각 36px, 득실비 두 열은 각각 88px이며 제목은 한 줄이다. 좁은 PC 창에서도 두 칸을 유지하되 카드 내부만 가로 스크롤한다. 기존 모바일·인쇄·순위 계산·경기/선수 데이터는 유지한다. [검수 보고서](validation/domestic-pool-layout-20261026.md).


## 2026-10-26 · 고성대회 조별순위 점수득실률 누락 복구

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·live 결과는 release PR 기록). 사용자가 고성대회 순위 규정에 필요한 점수득실률 누락을 지적했다. 남녀 예선 39경기의 기존 세트별 점수와 Drive MASTER/요강·KUVF 공식 결과를 대조해 22팀 pointRatio를 복구한다. 기존 공통 계산기에 승수 → 점수비율 → 세트비율 → 승자승을 명시한 재생성기를 두며 본선 8경기를 제외한다. 현재 순위·진출팀·경기 데이터·선수 ID는 변하지 않는다. 종합순위도 성균관대 291/240을 1.213으로 반올림해 조별 값과 일치시킨다. 기존 KVL 예선 종합순위의 별도 정렬 정책은 유지한다. [검수·출처·복구](validation/goseong-point-ratio-20261026.md).


## 2026-10-26 · 대학배구 메인 카드·트로피 승인 시안 운영 적용

Status: APPROVED / IMPLEMENTED / VERIFIED (merge·Pages·운영 확인은 release PR 기록). 사용자가 “대학은 이걸로 홈페이지에 반영”을 요청했다. 기존 대학 메인의 `2026 대회 → 대회별 보기 → 연도별 기록` 구성, Hero, 글자 크기, 간격, 대회·학교·선수 링크와 순위 데이터는 유지하며 국내대회 기본 템플릿의 카드 모양과 금·은·동 SVG 트로피만 적용한다. 승인 시안과 같은 12px 모서리·얇은 테두리·그림자 없는 표면을 페이지 전용 스킨으로 연결한다. 이전 일반 디자인 문서의 카드 장식은 이 범위에서 승인 시안이 우선한다. 함께 요청한 중·고 동일 형식은 별도 PROTOTYPE으로 준비하고 이 대학 운영 PR에는 포함하지 않는다. [범위·검수·복구](validation/university-hub-cards-20261026.md).



## 2026-10-27 · 종합대회 허브 및 전국체전·소년체전 운영 반영

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 결과는 release PR에 기록). 사용자가 전국체전·소년체전 중심 목록 시안을 승인하고, 목록 및 ‘대회 한눈에 보기’ 최종순위에서 지역을 강조한 뒤 실제 홈페이지에 반영하도록 명시적으로 요청했다. 대학 허브 카드 스킨, 남녀 색상, 금·은·동 트로피, 금색 hover, 연도별 펼침을 재사용한다. 전국체전 5부문 60팀·55경기·671명/154개 기존 프로필, 소년체전 4부문 59팀·55경기를 공통 국내대회 템플릿으로 연결한다. 36개 입상팀의 지역은 공식 참가팀 code로 연결하며 목록·overview·최종순위 카드에 16px 배지를 표시한다. 공동 3위, 2개 원문 점수 충돌, 기존 선수 ID와 팀 기록 경로는 유지한다. 내부 원본 보관 위치는 비공개로 유지하고 공개 배포에는 Source ID·공식 URL·무결성 해시만 포함한다. 기존 프로토타입의 운영 미반영 상태를 이 승인 범위에서 대체한다. [범위·검수·복구](validation/comprehensive-regions-release-20261027.md).


## 2026-10-27 · 확정 학교·대학 로고와 학교 소재지 표시

Status: APPROVED / IMPLEMENTED / VERIFIED (local 63 tests + 2 Cup smokes; 26 PC/mobile views + 360px. 최신 main b9f9df9의 동시 KOVO Cup 작업 보존. merge·Pages·live 증거는 [검수 보고서](validation/school-logos-20261027.md) 및 release PR에 기록). 사용자가 ① 학교 전용 로고 보관 폴더의 이름을 바꾸고 프로 로고까지 통합, ② 운영기준에 이미지 규격 기록, ③ 흐린 로고 개선, ④ 경북사대부고의 남색 원형 KNUHS·학교명·흰 날개 교표로 교체, ⑤ 선수명단/학교 페이지에 소재지 표시, ⑥ 남은 로고 확인 항목 설명, ⑦ 확정 로고의 실제 홈페이지 반영을 요청했다. 원본·가공본은 확인 연도별로 모아 보관하고 다음 연도에는 변경 여부를 재확인한다. 운영기준 MASTER v15와 같은 기준을 적용한다.

2026 확정 71개(남고·고등부 클럽 22, 여고 12, 남중 20, 여중 11, 여자대학부 6)를 기존 학교 manifest/runtime에 연결한다. PNG RGBA 512×512, 실제 도안 긴 변 410px, 최소 여백 51px, 비율 유지·중앙 정렬·바깥 투명·내부 흰색/문자/분리 도형 보존을 사용한다. 소재지와 정식 학교명은 `경북 영천 금호중학교`와 같이 공통 팀 상세·명단·인쇄 제목에 표시한다. 학교 소재지는 대표 시·도와 별도 필드로 유지한다. 새 엔진·Master ID·경기/선수/명단 관계 변경은 없다.

CBS 4개·춘계 3개 원문 별칭은 출처 대조 후 해당 competitionId에서만 표시/로고 연결한다. 모종중·홍천군체육회 U15·목포영화중과 이번 확인 목록 밖 학교는 fallback을 유지한다. 정상 프로 SVG 14개와 기존 프로 resolver는 유지한다. 앞선 prototype-only 제한은 이번 사용자의 명시적인 운영 반영 승인 범위에서 대체한다.


## 2026-10-27 · 종합대회 순위 지역 표기를 오른쪽 일반 글씨로 조정

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR에 기록). 운영 반영 요청에 이어 사용자가 지역을 팀명 위의 작은 카드 대신 팀명 오른쪽 끝의 일반 글씨로 표시하도록 수정했다. 종합대회 목록, 전국체전·소년체전 overview 우승팀/최종순위, 최종 입상팀 카드를 같은 방식으로 적용한다. 지역은 400 굵기·배경/테두리 없음·오른쪽 정렬, 긴 팀명은 줄바꿈하며 기존 공동 3위와 팀 링크를 유지한다. 앞선 같은 날짜의 16px 지역 배지 디자인을 이 범위에서 대체한다. 최신 main의 학교 로고·소재지 및 KOVO Cup 변경을 보존한다. [검수·복구](validation/comprehensive-region-text-20261027.md).


## 2026-10-27 · KOVO컵 참가팀에서 팸플릿 선수명단 표시

Status: APPROVED (구현 범위) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 사용자가 국제대회와 같은 팀 선택→명단 목록을 제안한 뒤 진행을 지시했다. 공통 명단 렌더러의 club 옵션으로 남녀 14팀·251명을 연결하고 PC·모바일 모두 팀 카드 전체 아래에 표시한다. 기존 Player ID는 이름·생년월일이 일치하는 54명만 연결하며 새 ID와 Master 수정은 없다. 팸플릿 기준 명단임을 명시하고 실제 경기별 엔트리/현재 구단 명단과 구분한다. 5개 생년월일 충돌과 1개 음력 표기는 확인 중으로 남긴다. 기존 학교의 모바일 아코디언·국제대회 열 구성·경기·순위·Hero는 유지한다. 앞선 Cup pending-only 결정을 이 구현 범위에서 대체한다. 운영 merge는 별도 승인 후 진행한다. [검수·출처·복구](validation/kovo-cup-rosters-20261027.md).


## 2026-10-28 · KOVO컵 명단의 국적에 국기 병기

Status: APPROVED (표시 수정) / IMPLEMENTED / VERIFIED (local preview). 사용자 요청으로 PC 국적 열, 모바일 상세정보, 인쇄 명단에 국기 + 국가명을 표시한다. 기존 국제대회에서 사용하는 FlagCDN 이미지 방식을 재사용하며 검수된 nationalityCode가 있는 경우만 표시한다. 국적 미확인은 그대로 유지하고 선수 데이터·ID는 변경하지 않는다. 기존 공개 승인 대기 상태는 유지한다. [검수 보고서](validation/kovo-cup-rosters-20261027.md).


## 2026-10-28 · KOVO컵 선수정보 공개 및 운영 반영 승인

Status: APPROVED / RELEASE AUTHORIZED. 사용자가 생년월일을 포함한 팸플릿 명단의 `kvolleylab/kvolleylab` 업로드와 운영사이트 반영 요청에 “선수정보 공개 승인”이라고 명시적으로 답했다. 남녀 14팀·251명 명단, 54개 기존 프로필 연결, 국기+국가명 표시, 6개 생년월일 확인 중 표시의 검수 범위로 진행한다. 앞선 공개 승인 대기 기록을 대체하며 CI·merge·운영 화면 검증 결과는 release PR에 기록한다. 원본 PDF/XLSX, 인증된 Drive 주소, 비공개 개인 메모는 공개 대상에 포함하지 않는다. [검수 보고서](validation/kovo-cup-rosters-20261027.md).


## 2026-10-28 · 종합대회 Hero 최종 선택 및 운영 연결

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR에 기록). 사용자가 비교 시안에서 종합대회 배구 02, 전국체전 남자부 04·여자부 07, 소년체전 남자부 09·여자부 12를 명시적으로 선택했다. 기존 운영 반영 요청의 연속 범위로 5종 PC·모바일 10장과 9개 부문을 연결한다. 선택 원본의 남녀 서로 다른 장면, PC 2108×406·모바일 1258×406, 로즈 #8E315E / #6F234A / #E7A8C2를 유지한다. `finished-artwork` 공통 opt-in은 어두운 덮개 없이 contain으로 전체 이미지를 보존한다. 모바일 상세는 하단 배치로 제목과 장면을 분리하며 기존 Hero 최소 높이와 템플릿·경기·명단·지역 표시는 유지한다. 최근 대회 카드는 해당 기본 부문의 Hero를 재사용한다. 운영기준·Hero 가이드 대조, MASTER/WEB 보관, 79개 회귀 검사 및 25개 반응형 이미지 검수 완료. 앞선 공통 홈 이미지와 남녀 동일 장면은 이 선택 범위에서 대체한다. [검수·복구·선택 번호](validation/comprehensive-hero-selected-20261028.md).

## 2026-10-28 · V-리그 대회 화면과 시즌 선수명단 운영 적용

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 화면은 release PR 기록). 사용자가 “V-리그도 대회 페이지 수정하고 선수명단 반영해줘”라고 요청했다. 기존 V-리그 남녀 경로에 공통 domestic-home-v2의 pro-league 옵션을 적용하고 팀 카드 아래 시즌 명단과 국기+국적을 표시한다. 10월 27일 공시까지 대조한 14팀·252명과 기존 exact-match 프로필 55개를 연결한다. 이준 전역 등록, 송민근 자유신분, 최원빈 해외임대, 김영태 MB 변경 및 외국인/아시아쿼터 28명의 공시 국적을 대조했다. Cup 당시 명단과 시즌 명단은 별도 snapshot이다. 기존 v08 Hero, 정규리그 252경기·순위·포스트시즌·선수 ID를 유지한다. 자료 충돌/음력 DOB 6건은 확인 중이다. 앞선 V-리그 pending-only 화면과 prototype 표기를 이번 범위에서 대체한다. [검수·출처·복구](validation/vleague-rosters-20261028.md).

## 2026-10-28 · 종합대회 PC Hero 확대 및 지역 중심 경기결과

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR 기록). 사용자가 PC Hero 장면이 카드의 절반 정도를 차지하도록 확대하고, 국내대회 기본 템플릿에 맞는 경기결과 정렬·팀명 전체 표시·로고 대신 지역을 요청했다. 선택된 5종의 원본 바이트와 모바일을 유지하며 PC의 빈 배경 축소 및 25:7 카드 비율을 적용한다. 이전의 PC contain·고정 높이는 이 범위에서 대체한다. 종합대회에만 지역 일반 글씨를 적용하고 기존 순위 오른쪽 지역은 중복 없이 유지한다. 경기결과는 좌우 같은 팀 영역과 가운데 점수, 긴 이름 줄바꿈을 사용하며 좁은 PC에서는 세트별 점수를 아래로 배치한다. 원본 경기·순위·명단·ID·타 대회 로고 및 동시 V-리그 변경을 보존한다. [검수·범위·복구](validation/comprehensive-layout-20261028.md).


## 2026-10-28 · V-리그 한눈에 순위표·참가팀 전 시즌 순서

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 증거는 release PR). 사용자가 시즌 안내 대신 시즌 순위표와 참가팀의 작년 순위 정렬·PC 한 줄 표시를 요청했다. 기존 정규리그 standings.rows를 재사용해 순위/팀/승점/승/패를 표시하고, overview 참가팀만 KOVO 공식 2025-26 최종순위순(포스트시즌 포함)으로 7팀 한 줄에 배치한다. SOOP의 페퍼저축은행 순위 승계를 명시한다. #189의 overview 시즌 안내를 대체하며 현재 순위·경기·명단·ID·Hero는 유지한다. 남녀 최근 결과+다음 경기 카드는 PROPOSED / NOT IMPLEMENTED: 사용자가 검토 중이므로 추가하지 않는다. [출처·검증·복구](validation/vleague-overview-20261028.md).


## 2026-10-28 · V-리그 남녀 최근 결과·다음 경기

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 증거는 release PR). 사용자가 남녀 각각 최근 결과 1경기 + 다음 예정 1경기를 함께 보여주는 구성을 요청했다. #190의 PROPOSED / NOT IMPLEMENTED 결정을 이 범위에서 대체한다. 한눈에의 순위표 아래·참가팀 위에 남녀 카드 2개를 배치하며 PC 2열/모바일 1열, 최종·세트별 스코어와 KST/대진/경기장 및 날짜 일정 링크를 표시한다. 동일 시즌 기존 경기 데이터를 사용하고 개막 전·결과 없음·다음 일정 없음·부문 로딩 실패를 구분한다. 현재 선수 ID/명단/국기·순위·경기·Hero·타 대회는 유지한다. [검수·선택 기준·복구](validation/vleague-match-summary-20261028.md).


## 2026-10-28 · 종합대회 지역 로고 형태 복원

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR 기록). 사용자가 종합대회 로고 모양을 복원하되 안의 글씨를 지역명으로 표시하도록 요청했다. 공통 텍스트 로고의 둥근 사각형과 남자부 파랑·여자부 로즈 색상을 재사용하고, 공식 참가팀의 대표 시·도를 넣는다. 경기결과·팀 기록·대진표·참가팀·명단 헤더·우승팀·최종 입상팀에 동일 원칙을 적용한다. 직전 일반 글씨만 쓰는 지역 마크 결정을 이 로고 슬롯 범위에서 대체하며, 순위 팀명 오른쪽의 일반 지역 글씨는 유지한다. 가운데 점수·긴 팀명 전체 줄바꿈·PC Hero 크기와 기존 데이터·선수 ID·다른 대회 로고·동시 V-리그 최근 경기 카드는 유지한다. [검수·범위·복구](validation/comprehensive-region-marks-20261028.md).

## 2026-10-28 · V-리그 남자부 마우스 오버를 연한 금색으로 변경

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·운영 확인은 release PR). 사용자가 운영 V-리그 남자부에서 클릭 전에 마우스를 올렸을 때의 회색 음영을 연한 금색으로 변경하도록 요청했다. 기존 공통 CSS에 pro-league 남자부 범위의 hover 배경 `#FFF3D6`만 추가한다. 탭·요약 지표·참가팀·순위표·명단 행·경기일·라운드 필터에 적용하며 남녀 페이지의 남자부 경기 요약 카드도 같은 금색을 쓴다. 여자부 경기 카드의 분홍색, 평상시/선택 배경, 점수 색, 구조·데이터·다른 대회는 유지한다. 검수·복구: [보고서](validation/vleague-men-gold-hover-20261028.md).

## 2026-10-28 · V-리그 남자부 금색 hover 철회 및 기존 색 복원

Status: APPROVED / IMPLEMENTED / RELEASE AUTHORIZED (검증·merge·Pages·live 결과는 release PR). 사용자가 직전 금색 hover 변경에 “그냥 다시 원래대로 돌려줘”라고 요청했다. #194에서 추가한 금색 hover CSS를 제거하고 CSS 연결·기존 cache smoke를 #193의 상태로 정확히 복원한다. 위의 금색 hover 결정을 이 범위에서 대체한다. #192의 최근 결과+다음 경기, 명단·국기·순위·PC 참가팀 배치 및 #193의 종합대회 로고는 유지한다. 기준 main: 605a276b4ea3e77fb7e6d691106051d959a68743. 복원 대상 3개 파일은 985a01d와 바이트 단위로 일치하며 이전 금색 검수 문서·이미지는 이력으로 보존한다.


## 2026-10-28 · 종합대회 최종입상팀의 중복 지역명 제거

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 ‘대진·최종순위’의 ‘최종입상팀’ 카드를 ‘1위 → 경기 로고 → 화성시청 → 우승’으로 표시하도록 요청했다. 이 카드에서 팀명 오른쪽의 지역 글씨만 제거하고 지역 로고·순위 트로피·팀명 링크·우승/준우승/공동 3위를 가운데 세로로 배치한다. #193의 오른쪽 지역 유지 결정을 최종입상팀 카드 범위에서 대체한다. 목록과 한눈에 순위 표시는 변경하지 않으며 데이터·Hero·대진표·명단·다른 대회 렌더링은 유지한다. [검수·복구](validation/comprehensive-podium-region-once-20261028.md).


## 2026-10-28 · 종합대회 목록·대학 U-리그 PC Hero 이미지 비중 확대

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 종합대회 배구 목록과 대학 U-리그의 PC Hero에서 이미지가 카드의 절반 정도를 차지하도록 요청했다. 종합대회 목록은 PC 카드 비율을 3:1로 조정하고 왼쪽 문구·오른쪽 장면을 절반씩 배치한다. U-리그 남녀는 공통 `hero.themeVariant=half-visual` 옵션으로 원본 비율·오른쪽 정렬과 밝은 장면을 유지한다. 기존 사진 규칙의 강제 100%×100% 배경 맞춤 대신 높이 기준 자연 비율을 사용하며, 좁은 PC에서는 기존 제목 폭과 추가 명암으로 가독성을 보존한다. 모바일 자산·배치, 선택 이미지 바이트·색, 경기/명단/ID 및 직전 최종입상팀 수정을 유지한다. 종합대회 목록의 앞선 25:7 비율과 해당 U-리그 PC 사진 표시 결정을 이 범위에서 대체한다. [검수·복구](validation/hub-uleague-hero-half-20261028.md).


## 2026-10-28 · V-리그 포스트시즌 사다리 복구 및 재설계

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR). 사용자가 운영 V-리그 포스트시즌 사다리의 표시 오류 확인과 디자인 수정을 요청했다. domestic 스킨 이식 뒤 빠졌던 시리즈 내부 CSS 범위를 공통 컴포넌트에서 복구하고, PC 3단 가로 연결/900px 이하 세로 연결, 진출 기준·팀명·승수·경기별 일정과 결과를 분리한다. 미확정 대진은 ‘진출팀 미정’과 —로 표시하며 남자부 차콜/여자부 로즈 헤더와 중립 점수색을 사용한다. QPO/PO 구분, 홈·원정 역전 시 팀 중복 방지, 시리즈 승자 다음 단계 연결, 종료 후 잔여 경기 미실시 표시를 검증했다. 기존 준PO 조건/3전 2선승/5전 3선승 설정과 선수·경기·순위 원본, 앞선 회색 hover 복원, 동시 종합대회/U-리그 Hero 변경을 유지한다. [범위·검수·복구](validation/vleague-postseason-20261028.md).

## 2026-10-28 · 남자 신인선수 드래프트와 라운드 지명권 거래

Status: APPROVED (사용자가 요청한 구현 범위) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 프로 V-리그 하위에 V-리그 홈 → KOVO컵 → 드래프트를 추가한다. 기존 밝은 배경·네이비 화면과 팀 로고·신청자·검증된 선수 프로필을 재사용한다. 7팀 배분, 중복을 보존하는 추첨, 원지명권 기준 7열×1R~4R·수련선수 결과를 분리한다. 지명권 ID는 시즌·부문·라운드·원래팀으로 고정하며 현재 보유팀과 실제 지명팀을 구분한다. 확정 거래만 반영하고 맞교환·재양도·명시적 연쇄 취소 및 변경 전후 이력을 보존한다. 입력은 별도 data/draft-board 브랜치에 SHA 충돌 검사와 함께 영구 저장한다. 기존 테스트용 관리자 진입을 유지하되 쓰기는 실제 GitHub 저장소 관리자 권한을 요구한다. 이 인증 보완 방식은 구현 선택이며 운영 채택·배포 승인은 아직 받지 않았다. 공식 색상·추첨·거래·결과는 미확인으로 남기고 가상 검증 데이터를 공개 시즌에 넣지 않는다. 기존 신청자 hub/Player ID/MASTER와 최근 V-리그·종합대회 변경을 유지한다. 자동 검사90건·실제 API 저장/브라우저 재조회·PC/모바일 폭 검수를 통과했다. 실제 사용자 토큰을 입력한 브라우저 저장 전 과정은 NOT VERIFIED로 명시한다. [운영 명세](DRAFT_BOARD_v1.md) · [검수·출처·복구](validation/draft-board-20261028.md). 운영 merge·배포는 별도 승인 후 진행한다.

## 2026-10-29 · 제공된 남자 드래프트 실시간 기록 반영

Status: APPROVED (사용자 제공 기록을 참고한 업데이트 범위) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 새 첨부 실시간 기록을 읽어 7팀 색상, 추첨10회/중복3회, 일반 지명13명·패스15개·수련선수5명을 원지명권 기준으로 반영한다. 앞선 초기 미입력 상태를 이 기록 범위에서 대체한다. 사용자 기록과 공식 사전 안내·기사 대조의 출처를 구분하며 송정민 소속은 신청자 명단과 현장 사진 보도에 맞춰 수성고로 정정하고 원문을 보존한다. 18명 모두 기존 신청자와 연결하며 검증된 프로필17개만 제공한다. 최초 배분과 확률은 유지한다. 거래 근거가 없으므로 확인 중 상태를 유지하고 가상 거래를 넣지 않는다. 감사 이력1건에55건을 추가한 revision56을 실제 입력 브랜치에 저장하고 재조회했다. 관련 검사45개 및 PC/360px/390px 검수 통과, 기존 소유자 전용 Site 갱신 완료. 운영사이트 merge·배포 승인 범위는 확장하지 않는다. [검수·출처·복구](validation/draft-board-20261029.md).

## 2026-10-29 · 드래프트 결과 우선 화면·단계별 확률·자동 7순위

Status: APPROVED (사용자가 요청한 화면·기록 수정) / IMPLEMENTED / VERIFIED / READY FOR REVIEW. 결과표를 구슬 배분 위로 올리고 선수명·소속·포지션/패스 중심으로 단순화한다. 공개 시즌 선택은 연도로 표시하며 진행 상태 대신 신청59·지명18을 기존 데이터에서 계산한다. 개최 정보와 구슬 글자를 키우고 확률은 신청자 화면의 파랑으로 맞춘다. 저장소 확인·버전·재조회, 주요 수정 이력과 시즌 자료 패널은 실제 관리자에게만 표시하고 공개 관찰 기록 문단은 제거한다. 시즌별 추첨 방식 설정을 추가하고 사용자 정정에 따라 1~3순위100개/4~7순위64개 시작 구슬 비율을 표시한다. 대한항공은 추첨 없이 자동7순위이며 실제 추첨은9회·중복3회다. 앞선10회 기록은 원본과 감사 이력에 보존하고 runtime revision58에 정정한다. 원지명권28개·실제 지명팀·선수·프로필 연결·거래 모델은 유지한다. 사진은 이번 메시지에서 확인되지 않아 정확한 사진 대조는 NOT VERIFIED. 관련50개 검사와 PC/360px/390px 검수 통과. 앞선 공개 상태/이력 표시와10회 추첨 결정을 이 요청 범위에서 대체하며 운영 merge·배포 승인 범위는 확장하지 않는다. [검수·확률 의미·복구](validation/draft-board-ui-20261029.md).


## 2026-10-30 · KVL Quality Audit v1 읽기 전용 시범

Status: IMPLEMENTATION AUTHORIZED / DRAFT PR / RELEASE AND SCHEDULE NOT AUTHORIZED. 사용자가 기존 운영 기준 조사, 독립 감사 프로그램·테스트·GitHub Actions 개발, 실제 읽기 전용 시범 및 Draft PR 제출을 요청했다. `feature/kvl-quality-audit-v1`에서 경기/Player ID/명단/공개등급/기존 회귀/UI 점검과 안정적 오류 ID·중복 없는 Issue 알림 체계를 구현한다. 기존 공식 수집기·테스트·공개 catalog loader를 재사용한다. 운영 홈페이지·MASTER·Player ID·완료된 AVC·기존 workflow는 변경하지 않는다. 신규 schedule은 넣지 않으며 main 병합·배포·Drive 인증·실제 Issue 알림은 별도 사용자 승인 대상이다. ChatGPT/OpenAI 구독 없이 규칙 기반으로 실행한다. [운영 명세](KVL_QUALITY_AUDIT_SPEC_v1.md), [기존 자동화](quality-audit/EXISTING_AUTOMATION_v1.md), [시범 결과](quality-audit/PILOT_v1.md).

## 2026-10-30 · 드래프트 3개 요약 지표·사진 형식의 공식 신청자 목록

Status: APPROVED (사용자 요청 범위) / IMPLEMENTED / VERIFIED / PRIVATE PREVIEW DEPLOYED / READY FOR REVIEW. 사용자가 첨부한 두 사진에 맞춰 기존 신청·지명 문장을 59명 드래프트 참가 / 18명 최종 지명 / 30.5% 역대 최저 지명률로 대체하고, 참가 신청자 버튼은 공식 순번의 목록을 열도록 한다. 지표는 기존 신청자·결과에서 계산하며 역대 최저 문구는 근거 자료·시즌·인원·완료 상태가 일치할 때만 표시한다. 남자 59명 명단은 10열, 소속별 묶음과 대상 29명 초록 음영으로 구성한다. 공식 PDF·첨부 사진에 대조한 생년월일·체중·출신학교를 별도 자료에 보관하며 기존 ID·신청자 원본·53개 프로필 링크·검색·필터·여자부·지명권·입력 revision58은 유지한다. 모바일은 이름까지 먼저 보이고 상세 열은 가로 이동한다. 앞선 신청/지명 문장 표시를 이 범위에서 대체한다. 관련 검사67개와 PC/360px/390px·검색 검수 통과, 소유자 전용 미리보기 배포 성공. 운영 merge·배포 승인 범위는 확장하지 않는다. [사진·출처·검수·복구](validation/draft-summary-list-20261030.md).

## 2026-10-30 · 남녀 신인 드래프트 공식 결과 및 운영 배포 승인

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. 사용자가 여자부를 동일 양식으로 확장하고 실제 결과 검색·반영 후 “실제 홈페이지에 반영시켜”라고 운영 배포를 명시 승인했다. 앞선 드래프트 private-only/미승인 제한을 이 범위에서 대체한다. 최신 사이드바 이름 `신인 드래프트`를 유지한다. 여자 공식 신청58명과 취소1명을 구분해 실제57명·지명16명·28.1%를 표시하고, 58행10열 공식 목록과 기존52개 프로필 연결을 보존한다. KOVO 공식표 기준 14일반+2수련 및 3거래4권리를 원지명권 위치에 반영한다. 확정순위와 실제 구슬 로그를 분리하며 중복·색상·마지막 순위 결정 방식은 미확인으로 둔다. 남자 공식 최종표도 대조하고 홍준범 OP/MB를 감사 이력으로 정정한다. 입력 브랜치 `3a80baab6386c6e45212f119bdd2511874c7a92c`, 남자 revision60/여자 revision41. 공식 원본은 기존 Drive 공식자료 폴더에 보관했다. 관련72개 검사·105개 프로필 회귀 통과. merge·Pages·운영 확인은 PR #199 release 기록으로 구분한다. [자료·검수·복구](validation/draft-women-20261030.md).


## 2026-10-30 · 여자 드래프트 단계별 확률·로즈 Hero·거래 요약·4R 표시

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (merge·Pages·live 증거는 release PR 기록). 이전 실제 홈페이지 반영 요청에 이어 운영자가 여자부 1~3순위 후 해당 팀 구슬을 제외하는 방식을 확인했다. 100개/46개 단계 시작 구슬 비율을 공통 추첨 카드로 표시하며, 실제 순서·중복 횟수·색상·7순위 자동 확정은 추정하지 않는다. Hero는 `KVL_COMPETITION_THEME_POLICY_V1`의 #8E315E / #6F234A, 강조 #E7A8C2를 사용한다. 거래 당시 선수·포지션·지명권을 ↔ 요약으로 표시하고, 모든 7개 권리가 패스인 4R만 공개 표에서 생략한다. 관리자 표와 저장된 28개 권리는 유지한다. 치지직 제공 영상은 지역 시청 제한으로 실제 프레임 미확인. [검수·복구](validation/draft-women-refine-20261030.md).

## 2026-10-30 · KVL Quality Audit v1 운영 적용 승인

Status: APPROVED / MAIN INSTALLED / ACTIVATION VERIFICATION IN PROGRESS. 사용자가 PR 병합 → 운영 검증 → 매일 오전 9시 점검·중복 없는 Issue 알림 활성화 순서에 “승인한다”라고 답했다. PR #200을 `dd49cabf9af4e96b0d7e1a38862ec0213e40455b`로 병합했다. 앞선 감사의 RELEASE AND SCHEDULE NOT AUTHORIZED 기록을 이 운영 범위에서 대체한다. GitHub 웹 인증이 완료되지 않아 감사 전용 코드의 main 반영 시 운영 검증을 실행하는 경로를 추가한다. 수동 실행과 최소 권한은 유지하며 먼저 알림 없는 점검을 검증한 뒤 일정·알림을 활성화한다. 최신 #199 드래프트·공시 변경을 보존하고 기존 드래프트 검사를 재사용한다. 홈페이지·MASTER·Player ID·기존 workflow 수정이나 Drive 인증 공개를 승인한 것으로 확대하지 않는다. 실행·활성화 상태는 [운영 전환 기록](quality-audit/ACTIVATION_v1.md)에서 구분한다.

## 2026-10-30 · 승인된 감사 일정·Issue 운영 구성

Status: APPROVED / CONFIGURED (main 실행·병합 증거는 활성화 PR). 기존 사용자 승인에 따라 UTC 00:00/KST 09:00 일정과 감사 전용 코드의 main 반영 시 중복 없는 Issue 갱신을 구성한다. 승인을 코드 이력에 남기고 기본 활성화해 웹 로그인과 별도 PAT 설정에 의존하지 않는다. 선택적 `KVL_QUALITY_AUDIT_APPROVED=false` 또는 다른 비어 있지 않은 미지원 값은 자동 실행·알림을 중지하며 변수 삭제는 기본 활성 상태로 복귀한다. 기존 pilot의 “변수 true 설정 전 무조건 비활성” 조건을 이번 승인된 운영 구성으로 대체한다. 명시적 main·허용 이벤트·런타임 승인 true·최소 권한·PRIVATE 비공개·신규/상승/재발만 알림은 유지한다. Drive 인증과 계정별 알림 수신은 미검증으로 구분한다. [운영 전환 기록](quality-audit/ACTIVATION_v1.md).


## 2026-10-30 · KVL Quality Audit v1 운영 활성 및 알림 재실행 검증

Status: ACTIVE / MAIN VERIFIED / ISSUE PUBLICATION VERIFIED. 사용자 승인에 따라 #200 설치 → #201 main 읽기 전용 운영 검증 → #202 매일 09:00 KST 일정·중복 없는 Issue 알림 활성화를 완료했다. 활성화 commit `772598bc665eb9029fd8d87fce98499e67e4d4b6`, Actions `41056879688`의 audit/notify 성공. 기존 공개 P2 4건을 #204~#207에 최초 발견일 그대로 등록했고 실제 notify 재실행은 create 0 / update 4 / 댓글 0으로 중복을 방지했다. 최종 PASS125/FAIL3/NOT VERIFIED7/NOT RUN1, Python129·UI72 PASS, P0/P1 gate PASS. 동시에 반영된 #199/#203 드래프트와 기존 공시를 보존했다. 기존 오류는 자동 수정하지 않는다. 최초 예약 이벤트(10월31일09시 예정), Drive 인증, 실제 이메일/모바일 수신·배포차단 연결은 미검증으로 남긴다. ChatGPT/OpenAI 구독·키·세션 비종속. [운영 전환·복구·실행 증거](quality-audit/ACTIVATION_v1.md).

## 2026-10-30 · 여자 드래프트 사용자 영상 전사·방송 배분 화면 반영

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED (실제 배포 증거는 release PR). 사용자가 원영상에서 확인해 제공한 14회 순서와 첨부 방송 화면의 7팀 색상을 반영한다. 정관장 중복7회·도로공사 중복1회, 총8회이며 중복행은 유지하고 신규 순위는 부여하지 않는다. GS칼텍스는 검정1개와 공식7순위를 유지하되 제공된14회 이후 실제 추첨·자동 확정 여부는 미확인으로 둔다. 이전 색상·중복 미확인 판단을 제공된 범위에서 대체하며 원영상 직접 검증으로 승격하지 않는다. 23개 감사 명령으로 여자 revision45→68, 지명권28개·선수 결과·거래·남자부 보존. 기존 실제 홈페이지 반영 승인 범위의 후속 데이터 갱신이다. [자료·검수·복구](validation/draft-women-draws-20261030.md).


## 2026-10-31 · V-리그 GitHub 자동 업데이트 구축

Status: IMPLEMENTATION AUTHORIZED / IMPLEMENTED / VERIFIED LOCALLY AND ON GITHUB / READY FOR REVIEW / NOT ACTIVE. 사용자가 V-리그의 ChatGPT 비종속 자동 업데이트와 GitHub 실행 가능 여부를 질문한 뒤 “진행해”라고 구축을 지시했다. 기존 MASTER를 원본으로 유지하면서 공식 정규리그 전체 수집 → ID·점수·공식 순위 대조 → 정확한 MASTER 셀 반영·재조회 → 허용 JSON → Pages 검증의 GitHub Actions 경로를 구현한다. 남녀 각 126경기의 공식 연결과 실제 개막전 2경기를 읽기 전용으로 대조했다. 기존 명단·선수 ID·포스트시즌·공통 UI·공시/감사 일정은 유지한다. `KVL_VLEAGUE_UPDATE_APPROVED=true` 전 예약 게시·Issue는 비활성이다. 운영 병합·배포 승인, GitHub용 Google 실행 권한 연결, 실제 MASTER 쓰기·Pages 배포는 아직 완료로 표시하지 않는다. 기존 Quality Audit의 활성화 승인을 새 수집기의 운영 승인으로 확대하지 않는다. [운영 명세](KVL_VLEAGUE_AUTO_UPDATE_v1.md), [실제 자료·검수·복구](validation/vleague-auto-update_v1.md).


## 2026-11-01 · V-리그 자동 업데이트 운영 반영·실행 권한 연결 승인

Status: APPROVED / RELEASE AUTHORIZED / ACTIVATION IN PROGRESS. 사용자가 PR #213 운영 반영과 기존 Google MASTER의 GitHub 실행 권한 연결을 요청하는 확인에 “승인한다”라고 명시적으로 답했다. 앞선 NOT ACTIVE 기록의 승인 대기 상태를 이 범위에서 대체한다. 검증된 정규리그 수집·MASTER 정밀 반영·공개 JSON·Pages 검증과 승인된 일정·중복 없는 실패 Issue를 운영 전환한다. 코드 기준 `857f344a0b8480cdc5eac2e3779115bda2618344`, V-리그 Actions `41213686346` 및 Quality Audit `41213686347` 성공. 기존 선수 등록 workflow 3개 실패는 검수 문서에 기록한 별도 legacy 문제이며 이 승인으로 수정 범위를 확대하지 않는다. 병합, GitHub용 Google 권한 연결, 첫 MASTER 쓰기·재조회, 실제 Pages 반영을 각각 확인한 후 완료 상태를 기록한다. 권한 연결 이전에 검증을 우회하거나 MASTER 확인 없이 자동 공개하지 않는다. [운영 명세](KVL_VLEAGUE_AUTO_UPDATE_v1.md), [검수 근거](validation/vleague-auto-update_v1.md).


## 2026-11-01 · 메뉴의 금색 KVL 배구공을 사용하는 파비콘 검토본

Status: PROTOTYPE / ASSET VERIFIED / NOT DEPLOYED. 사용자가 브라우저 탭의 기본 지구본을 바꾸려는 맥락에서 현재 메뉴 맨 위의 KVL 배구공 심벌을 제안했다. 기존 `kvl-ball-international-gold.webp`를 그대로 재사용한 ICO 16/32/48/64px, 홈의 정적 연결, 공통 내비게이션의 중복 없는 연결을 분리 브랜치에서 준비한다. 사용자의 금색·흰색 표현과 달리 지정된 메뉴 원본은 금색·짙은 남색이므로 이 검토본은 원본 색상을 유지하며 재색칠한 결과로 표시하지 않는다. 원본 자산·제목·메뉴 배치·경기/선수 데이터는 보존한다. 실제 브라우저 검수와 운영 반영 승인은 남아 있다. [변경·검수·복구](validation/kvl-favicon_v1.md), [적용 예상 미리보기](validation/KVL_favicon_preview_v1.html).


## 2026-11-01 · 금색 KVL 배구공 파비콘 운영 반영 승인

Status: APPROVED / RELEASE AUTHORIZED / DEPLOYMENT VERIFICATION PENDING. 사용자가 기존 메뉴의 금색·짙은 남색 KVL 배구공을 그대로 활용한 파비콘과 [PR #214](https://github.com/kvolleylab/kvolleylab/pull/214)의 검토 결과를 확인한 뒤 “승인한다”라고 명시적으로 답했다. 앞선 파비콘 검토본의 운영 승인 대기 상태를 이 범위에서 대체한다. ICO 16/32/48/64px, 홈의 정적 연결, 공통 내비게이션의 중복 없는 연결만 운영 전환한다. 코드 기준은 `0b0d9d687c3d1710307ed064a86a3eb9aa9e6876`, 재확인한 main은 `444eff62474089029c6b5aacfae191d321585364`이다. 브라우저 검수는 작동하는 클라우드 Chrome으로 진행하며 병합·Pages·실제 아이콘 응답·홈/내부 페이지 연결을 확인한 뒤 PR에 배포 증거를 남긴다. 원본 로고·경기/선수 데이터·사이트 제목·기존 메뉴 기능은 이 승인에 따른 변경 대상이 아니다. [검수 및 복구](validation/kvl-favicon_v1.md).

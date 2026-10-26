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

# K-Volley Lab — Decision Log & Session Handoff

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

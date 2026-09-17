# Competition Engine V2 — final gate continuation

Current status: **VALIDATED_PENDING_PRINT_PDF**. The common engine and config/data route work; PRODUCTION_READY is withheld until an actual browser PDF is available and inspected.

Resumed from `12b0403788c7143c85aa5fd761b321a1191717e3`. The completed 144-case and 42-case validations were retained, not restarted. Final engine code: `bf41268a35f86ce7044a077cd087b4a572c922d1`.

## Remaining gate decisions

| Gate | Result | Evidence / boundary |
| --- | --- | --- |
| Women production SyntaxError | PASS | The previous two-backtick fix remains in the current production JS; syntax check passes. No additional production edit |
| Men/women geometry basis | PASS, basis resolved | Preserve both completed production pages. Future men/women use the existing shared V2 geometry with palette/data differences. No women-only CSS or new design |
| Legacy women exact reproduction | Not claimed | Historical 16/18 differences remain documented. The latest user scope asks to preserve the finished pages and establish a shared engine for future competitions; this task does not transplant either page |
| Config/data-only creation | PASS | One shared `competition-engine.html?competition=<slug>`; two JSON files per competition; no per-competition HTML generation or registry edit |
| Optional modules | PASS | Registered DATA ONLY transformations, declared schema fields, duplicate/unknown module rejection, reusable Node/browser starter |
| PC 1180 / Mobile 390 / Mobile 360 | PASS | 6 views × 3 widths through the new config route; no document overflow, country clipping or flag distortion |
| Set points / participant flags | PASS | Existing 3/4/5-set renderer and contain flags used unchanged through the new loader |
| Unconfirmed qualification results | PASS | Removed legacy CSS-generated “대회 결과 / 일본” from the V2 scope. Only qualifications[].resultTeams supplies results; existing production CSS unchanged |
| Roster print DOM | PASS | 18 players → 2 sheets (14+4); 116 players / 8 countries → 9 sheets |
| Actual browser print/PDF | FAIL — unverified | Print button invoked; connected Chrome content export returns `CDP does not support command "tab_content_export".` No PDF artifact exists; glyphs/page breaks/clipping cannot be approved |
| PRODUCTION_READY | FAIL / pending | Actual PDF inspection is the only remaining engine approval gate |

The first new-route run found no geometry or data error but flagged the validation robots string. The site adds `nosnippet,noimageindex` to the required `noindex,nofollow,noarchive`; the check now verifies required directives instead of rejecting valid additional restrictions. The global private review policy remains unchanged.

## Common architecture

| Category | Final ownership |
| --- | --- |
| Common UI | Hero, six navigation views, KPI, qualification cards, calendar, schedule/date headers/filters/set points, standings rows, final cards, bracket cards, participant cards/flags, roster/print, official resource cards and responsive geometry |
| Config | Competition identity/name/season, gender, family palette, Hero assets, SEO, structure modes and module declarations |
| Competition data | Status, dates/venues, teams/groups, schedules/results, standings/final rankings, confirmed qualification outcomes, rosters and official sources |
| Optional modules | Source normalization and reusable rules that return existing schema fields; no adapter-generated HTML/CSS |
| Future structure extensions | Shared bracket graph/round renderer and common contract, not competition-specific templates; 4/16-team and classification formats remain unsupported until implemented and validated |

## Files and creation

See `docs/KVL_COMPETITION_PRODUCTION_STARTER_V2.md` for required/optional fields, folder rules, CLI steps, URL linking, modules and validation.

Core additions: `competition-engine.html`; `assets/js/kvl-competition-config-v2.js`; `assets/js/kvl-competition-modules-v2.js`; config/content/module starters; `scripts/scaffold-competition-v2.cjs`.

Core edits: loader accepts config/data/modules and updates runtime SEO; shell/controller/components wait for validated asynchronous data on the shared route. Existing inline-data consumers retain their initialization path. The only CSS change removes fixed qualification result text from the common V2 scope; PC/mobile dimensions are unchanged.

Verification additions: existing Horizon dummy exported to config/data/rosters/qualifications JSON, one shared validation entry, 9 config contract checks plus module starter check, new-route 18-case browser checks and stored evidence. This is the previously validated independent dummy dataset, not another copy of AVC/VNL or a newly invented real tournament.

A new competition needs a new config/data directory and approved Hero assets. No existing competition file changes. The new route generates metadata at runtime; clients that do not execute JavaScript see generic metadata. Existing site-wide PRIVATE_REVIEW_MODE still blocks indexing. The prior static HTML builder is retained for compatibility, not used as the default creation workflow.

## Production boundary

No changes after `12b0403` to:

- `international-competition-avc-men-continental-2026.html`
- `international-competition-avc-women-continental-2026.html`
- their production CSS/JS/runtime JSON
- `vnl.html` and its production dependencies

The first routing commit temporarily replaced the existing competition directory. It was restored byte-for-byte (blob `a2ee052bdec470a6cdf67667a2cd81ae8d59f648`) and the new route moved to `competition-engine.html`. The final diff leaves the existing `competition.html` unchanged.

The women SyntaxError repair was already committed at `beb07e851968f99ec6562bcf562fa1225de26179`; this continuation only confirmed it. No engine promotion or redesign of existing production occurred.

## Evidence and remaining action

- `docs/competition-v2-config-route-results.json`: new config path, 18 cases
- `docs/competition-v2-config-final-gates.json`: continuation checks and production protection
- `docs/competition-v2-print-validation.json`: real browser output limitation, unchanged print implementation
- Existing `competition-v2-production-gate-results.json`, `competition-v2-production-focused-results.json`, `competition-v2-women-baseline-results.json`, `competition-v2-vnl-focused-results.json`: retained prior evidence

To close the remaining gate, save actual browser print output for the selected 18-player country and all 116 players, then inspect every PDF page for Korean glyphs, flags, missing rows, page breaks and clipping. Expected totals are 2 and 9 pages. Until those actual outputs pass, keep productionReady=false. No generated substitute PDF or DOM-only check counts as this gate.

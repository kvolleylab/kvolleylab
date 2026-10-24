# School hub v2 production integration · 2026-10-24

Status: APPROVED / IMPLEMENTED / VERIFIED locally; production merge and live verification are recorded in the release PR. The user explicitly requested that the approved page be added to the actual website.

Base and rollback reference: `9e91dade1efa8086627c345e76c7151a2ee7f087`. Branch: `feature/school-hub-home-v2`. Approved prototype: https://kvl-school-home-v1.blackisle17.chatgpt.site (source `5d59975dbef5e9671dc56ba95dcac28efad7060e`).

## Scope and behavior

The existing `domestic-competitions.html?division=school` route renders the approved home-style school hub. Whole-card gold hover/focus, gold series pills, centered division headings, blue male and rose female panels, gold/silver/bronze trophy icons, recent Hero cards and year disclosures are retained. Site navigation is the unchanged shared production sidebar. Prototype labels and private template links are removed. The site's existing review-mode/indexing policy is unchanged.

`division=school` remains in the URL; the selected school division uses `category=high-women` etc. Search, sorting and status are URL-persisted. Internal links use the existing event page and official division parameter.

The runtime reads the existing school-years manifest, each catalog, and the five domestic result JSONs. It uses the existing final/semifinal podium algorithm and aliases, separates shared bronze teams visually, and leaves CBS/unknown thirds unconfirmed. No new result database, IDs, rosters or player/team paths are introduced. Later year catalogs registered in school-years are loaded by the same renderer. The previous three empty years remain explicit pending placeholders.

Existing shared Hero assets are reused; per-event bitmaps are not currently registered. Optional catalog cardHero references override the shared fallback later. Google Drive `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1` (file `1xQS01BmCU-jpFm2DODnPPkEj3znujV-IT3kvVvY8--k`, modified 2026-10-13) was inspected; no image bytes are edited or uploaded. The latest explicit user approval for gold hub labels/hover and the approved prototype supersedes older generic restrictions on gold labels within this hub scope. No official result-source re-audit or MASTER mutation is part of this UI release.

## Validation

- `node --check assets/js/school-competitions-hub.js`: pass.
- `node --test tests/school-hub-v2.test.cjs` with the existing jsdom test dependency: 3 integration tests pass (canonical catalog/podiums, URL and reload, route isolation/error fallback).
- Browser: six tournaments, 486 registered games; all featured images load; male/female header colors and gold hover match the prototype. Whole-card hit area resolves to the existing overview route.
- Women + 중앙여고 returns IBK and spring, keeps correct official division links, and survives browser reload.
- Keyboard Enter expands 2025 and preserves other year states.
- 360/390/680px responsive QA has no document overflow (345/375/665px usable width). Shared mobile menu remains functional.
- Source diff changes no match/master/roster JSON, other tournament pages, shared navigation, homepage, or calendar.
- Local desktop and mobile evidence: `school-hub-v2-home-20261024.jpg`, `school-hub-v2-archive-20261024.jpg`, `school-hub-v2-mobile-20261024.jpg`.

Recovery: revert this scoped release commit/PR. The previous school renderer and script URL are restored; data and shared navigation require no rollback.

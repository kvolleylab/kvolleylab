# Player List + Unified Team Workspace v1 — 2026-11-17

Status: IMPLEMENTED IN ISOLATED BRANCH / REFINED STATIC QA VERIFIED / BROWSER QA NOT RUN / NOT DEPLOYED

## Base
- stacked on PR #345 branch head: b1564d2332a8ea441b58c1131058d8d58673b0d4
- branch: feature/player-team-workspace-v1-20261117

## Scope
1. players.html gets Draft-Hub-style list mode in addition to detailed cards and compact view.
2. List mode is the new default for player database scanning.
3. Existing search, filters, tracking-only view, bookmark, memo, compare and profile actions remain available in list rows.
4. teams.html becomes a unified team directory derived from the same KVLPlayerCatalogReady Player Master catalog.
5. team-detail.html becomes a unified roster page using the same catalog.
6. Team roster rows expose bookmark toggle, new private memo, compare and profile actions.
7. No duplicate team/player/member database is introduced.

## Data model
Team groups are computed from current normalized player affiliation:
- professional: current team
- university/high_school/middle_school: current school
- national/international/domestic: available current affiliation
Group identity includes level + gender + current affiliation key.

## Protected data
- Supabase schema unchanged.
- Edge Functions unchanged.
- Existing bookmark/note rows untouched during implementation.
- Player Master source files unchanged.
- Draft data and competition data unchanged.
- Existing university-team.html analytics page remains available.

## Legacy compatibility
team-detail.html retains fallback resolution for legacy name/id query parameters when a matching current affiliation exists.

## Static QA evidence
- Changed/new JS module syntax: PASS.
- Referenced DOM IDs missing: 0.
- Player layouts table/cards/compact wired: PASS; default table confirmed.
- Existing tracking bookmark filter remains wired.
- Team pages use the same player-search-v2 catalog loader.
- All seven Player Master/national-link sources loaded for the grouping test.
- Normalized catalog in test: 854 unique Player IDs.
- Team groups: 53; professional 14, university 22, international 11, middle_school 2, high_school 3, national 1.
- Duplicate current-team membership across group keys: 0 players.
- Team roster direct actions wired to the existing admin-player-workspace bookmark/note API and compare tray.
- Team hub cards are intentionally simplified: team identity, current roster count, tracked-player count, season and short player preview; average-height/position analytics moved out of the hub.
- Team detail includes direct `전체 / 관심 / 메모` personal filters, position chips, and grade chips only when grade data exists.
- Team detail `메모 선수` metric counts unique players with notes rather than total note rows.
- Visual identity policy: 14 verified V-League SVG logos; verified school logos from `school_logo_manifest_2026`; flags for current international/national team groups; unverified schools keep initials rather than invented logos.
- Supabase readback after code-only work: auth users 1 / active admins 1 / member accounts 0 / bookmarks 2 / notes 5.
- Existing university-team.html remains unchanged.
- Direct member view routes: `players.html?view=tracking` and `players.html?view=notes` are wired; team detail links to both.

## Refined team UX static checks
- Team directory/detail module syntax: PASS.
- DOM references missing: 0.
- Hub analytics overload removed: average height and position distribution are not rendered in directory cards.
- Hub tracked-player count uses the same private bookmark source as the player workspace.
- Detail personal scopes `전체 / 관심 / 메모`: wired.
- Position chips: wired.
- Grade chips: rendered only when actual grade data exists.
- `메모 선수` is calculated from unique player IDs, not total note rows.
- Supabase readback remains auth 1 / active admin 1 / bookmarks 2 / notes 5.

## Team visual identity QA
- V-League visual coverage: 14/14 current pro teams use repository SVG logos.
- International visual coverage: 11/11 current international national-team groups have ISO2 flag mappings.
- Korea national-team group uses the Korea flag.
- School/university logos are display-only and limited to verified entries in `school_logo_manifest_2026`; missing assets keep initials.
- Visual resolver/module syntax: PASS.
- Team directory default: `프로 + MEN`; gender is split into MEN/WOMEN.
- Category tabs intentionally omit `전체` and follow `프로 → 대학 → 고교 → 중학 → 대표팀 → 국제`.
- Category button geometry copies the home `대회 바로가기` filter: 1px border, 5px radius, navy active state.
- Team card layout: logo approximately left 1/3; metadata right 2/3; coach and roster count; separate bottom roster CTA.
- V-League head coach metadata: 14/14 teams stored separately from player roster data.

## Browser review pages
- `review-team-directory-v1.html`: branch-only visual review entry, not in member protected-path config.
- `review-team-detail-v1.html`: branch-only visual review entry; use real team query parameters.
- These review pages intentionally cannot write private bookmark/note data because the Supabase Edge Functions allow the production `https://kvolleylab.com` origin only.
- Delete review HTML files before production merge.

## Team card v3 static QA
- Team directory and staff module syntax: PASS.
- V-League coach metadata: 14 teams = men 7 + women 7.
- Default category/gender: professional + MEN.
- No `전체` category tab.
- Category order: 프로 → 대학 → 고교 → 중학 → 대표팀 → 국제.
- Card desktop main grid: logo 1fr / information 2fr.
- Card fields: level·MEN/WOMEN, team name, roster count, head coach, roster CTA.
- Category control matches home competition shortcut filter geometry and active navy state.

## QA gate
Before release:
- PC/mobile browser review on an actual served preview.
- Visual density review for player list rows at 1180/768/390/360 widths.
- Team card and roster-row interaction check with the signed-in admin session.
- Bookmark add/remove and memo create smoke test, then confirm the intentional data delta.
- Production merge/Pages check only after explicit user approval.

## Release
Do not merge or deploy without explicit user approval.

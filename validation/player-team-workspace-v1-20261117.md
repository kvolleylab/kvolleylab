# Player List + Unified Team Workspace v1 — 2026-11-17

Status: IMPLEMENTED IN ISOLATED BRANCH / STATIC QA VERIFIED / BROWSER QA NOT RUN / NOT DEPLOYED

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
- Supabase readback after code-only work: auth users 1 / active admins 1 / member accounts 0 / bookmarks 2 / notes 5.
- Existing university-team.html remains unchanged.
- Direct member view routes: `players.html?view=tracking` and `players.html?view=notes` are wired; team detail links to both.

## QA gate
Before release:
- PC/mobile browser review on an actual served preview.
- Visual density review for player list rows at 1180/768/390/360 widths.
- Team card and roster-row interaction check with the signed-in admin session.
- Bookmark add/remove and memo create smoke test, then confirm the intentional data delta.
- Production merge/Pages check only after explicit user approval.

## Release
Do not merge or deploy without explicit user approval.

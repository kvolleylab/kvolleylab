# Player List + Unified Team Workspace v1 — 2026-11-17

Status: IMPLEMENTED IN ISOLATED BRANCH / QA PENDING / NOT DEPLOYED

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

## QA gate
Before release:
- syntax checks for all new/changed JS modules
- DOM reference checks
- player list/card/compact render contract
- team grouping counts and unique player checks
- direct bookmark/note API action wiring
- existing compare tray wiring
- PC/mobile browser review
- Supabase bookmark/note count readback unchanged until intentional user action

## Release
Do not merge or deploy without explicit user approval.

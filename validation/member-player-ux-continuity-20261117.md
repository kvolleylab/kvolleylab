# Member Player UX Continuity — 2026-11-17

Status: IMPLEMENTED IN ISOLATED BRANCH / STATIC QA VERIFIED / NOT DEPLOYED

## Base
- main: `196d72ea3727c5f0515462f2a0f048b3fba68bd5`
- branch: `fix/member-player-ux-continuity-20261117`

## Scope
This follow-up preserves the integrated `players.html` member flow already merged in PR #344.

Changes are intentionally limited to:
1. Signed-in global account link always opens `players.html`, including the current admin account.
2. The ADMIN/MEMBER role badge remains visible, so role identity is not lost.
3. If the private bookmark/note state cannot be loaded, the player page offers a direct re-login action and preserves the current player-search query string.
4. The unused hidden tracking section no longer references a missing `trackingTitle` element.
5. Asset query versions are bumped for the changed member-session/player-workspace modules.

## Protected behavior
- No Supabase schema changes.
- No Edge Function changes.
- No bookmark/note mutations.
- No player data, MASTER, competition data, routing catalog, or filters changed.
- Admin workspace remains reachable from the explicit admin button on the login page; it is simply no longer the default global account destination.

## Data integrity baseline
Verified before this branch:
- Auth users: 1
- Active admins: 1
- Member accounts: 0
- Bookmarks: 2
- Notes: 5

## Static QA
- Branch is 0 commits behind base main and contains only the expected UX/documentation files.
- `member-session-v1.mjs`: module syntax PASS.
- `player-workspace-v1.mjs`: module syntax PASS, including existing top-level await.
- `unified-nav.js`: script syntax PASS.
- Existing tracking bookmark filter, bookmark toggle, note list/save/delete actions, and profile postMessage bridge remain present.
- Supabase readback after the code-only change still reports auth users 1 / active admins 1 / member accounts 0 / bookmarks 2 / notes 5.
- Browser pixel/interaction QA is not claimed in this environment.

## Release gate
Do not merge to `main` without explicit user approval.
After approval, verify GitHub Pages and the live PC/mobile flow:
`login -> players.html -> interest filter -> profile -> memo -> notes`.

## Recovery
Revert the commits on `fix/member-player-ux-continuity-20261117` or close the PR without merge.

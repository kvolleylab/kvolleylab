# KVL Admin Player Workspace v1

## Scope
- The public navigation is unchanged.
- `admin-player-workspace.html` is intentionally not linked from the public menu.
- No signup, Kakao login, password-reset link, or general-member route is exposed in this version.
- The existing public player catalog and canonical Player IDs remain the source for player identity.

## Authorization
- Browser code uses only the Supabase publishable key.
- Email/password sign-in is handled by Supabase Auth.
- Every data request goes through the `admin-player-workspace` Edge Function.
- The Edge Function re-validates the access token with Supabase Auth and then checks `kvl_admin_private.admin_accounts.active=true`.
- The browser never receives the database URL, secret key, or service-role key.
- Edge Function CORS is restricted to `https://kvolleylab.com`.

## Private data
- `kvl_admin_private.bookmarks`: admin watchlist.
- `kvl_admin_private.notes`: admin-only notes, default UI season 2026-27.
- Notes are not published to any public/member analysis page.
- Update/delete requests carry the current revision so stale edits do not overwrite newer notes.

## Supabase
- Project: `kvl-members-test-v1`
- Region: `ap-northeast-2`
- Edge Function: `admin-player-workspace`, deployed version 2.
- Existing migration history includes `20261102163611 admin_player_workspace`.

## Verification
- Client module syntax: `node --check assets/js/admin-player-workspace-v1.mjs` PASS.
- Supabase Edge Function deployment: ACTIVE, version 2.
- Active admin account count was verified as 1 before this release.
- The assistant never receives or stores the administrator password.
- A real successful login + bookmark + note + logout/relogin persistence check must be completed by the owner after Pages deployment.

## Known limitation
- Password recovery is deliberately not linked here yet because the project's earlier recovery redirect still pointed to localhost. A KVL recovery route will be implemented separately before general-member login is opened.

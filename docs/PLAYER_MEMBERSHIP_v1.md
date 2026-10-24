# Player Membership v1 — Implementation and release gate

Date: 2026-10-24 (Asia/Seoul). Base: `8237ba5ae5d2f901fdb69c6ca6723d3828ec2d90`.

Status: **IMPLEMENTED / LOCALLY VERIFIED / NOT DEPLOYED OR ACTIVATED**. The user requested completion of the remaining applicant review and private membership functions. The current Supabase connection is not installed/confirmed, so hosted authentication, real email delivery and hosted RLS have not been tested. `data/member-config.json` remains disabled. Do not mark these as complete from a UI screenshot or local tests.

## Scope and retained behavior

The public site stays on GitHub Pages. Changes are restricted to member integration on the existing `players.html`, `player.html`, `draft-hub.html`, one callback page, scoped CSS/modules, database migrations, tests and handoff documentation. Shared navigation, home, competitions, all public player data and existing 99 applicant links are unchanged. The KOVO Cup update in PR #154 is retained; integrity checks now recognize that approved main as the protected-file baseline.

The old preparation UI remains when membership is disabled or configuration cannot be loaded. When activated, existing bookmark controls use the authenticated service. Search and draft display still work without authentication. The existing profile renderer and permanent URLs remain authoritative.

## Implemented membership behavior

- Email magic-link login and automatic first-time registration through Supabase Auth, using PKCE. No custom password or session issuer.
- Existing player cards and Draft Hub cards can add/remove a bookmark. The saved icon keeps the male dark-blue/female dark-rose theme.
- My watchlist displays the existing player's school, position, height and canonical profile link.
- Multiple notes per player with create, edit, individual delete and a delete confirmation. Revision checks reject stale concurrent edits.
- Private note content renders as text, not HTML. Note content and bookmark records never enter localStorage/sessionStorage or public JSON. The official SDK stores authentication tokens separately; every data operation is still authorized by the server.
- Account switches, pagehide and logout clear private in-memory data. Late responses from the previous account are rejected.
- Reads paginate past the REST default row limit.

## Server authorization

`supabase/migrations/202610240001_player_members.sql` defines:

| Record | Key/ownership | Access |
|---|---|---|
| `kvl_player_bookmarks` | `user_id + player_id` | Owner SELECT/INSERT/DELETE only |
| `kvl_player_notes` | Note UUID, `user_id + player_id` index | Owner SELECT/INSERT/UPDATE/DELETE only |
| `kvl_private.player_ids` | Existing canonical Player ID only | Migration/service access; no member table access |

The ID allowlist has 1,842 identifiers from the unchanged public loader, with no copied names, dates of birth or new player records. It is a foreign-key reference index, not a replacement player MASTER. Seeding is append-only (`ON CONFLICT DO NOTHING`), so old private history survives future catalog additions.

Both member tables have RLS enabled and forced. Ownership uses server-verified `auth.uid()`. Anonymous roles have no table grants. Column grants prevent caller-supplied `user_id`, ID reassignment or timestamp changes. Session checks reject unverified email accounts, anonymous users, expired JWT claims, missing sessions, mismatched sessions and signed-out sessions. The private `SECURITY DEFINER` helper fixes an empty search path and schema-qualifies all references; it returns only whether the current session is valid. The public status function is `SECURITY INVOKER`.

The browser accepts only a Supabase HTTPS project URL and a new `sb_publishable_` key. Service-role keys, secret keys and arbitrary server URLs are rejected. No privileged key is committed or requested in chat.

## Tests and evidence

- Previous integration suite: Python 14 + JavaScript 24 = 38 passed, including all 1,842 existing profile renderers and 99 linked applicant profiles.
- New membership tests: 19 passed. PostgreSQL RLS is executed in PGlite (real PostgreSQL/WASM), with separate A/B authenticated roles. Other tests cover client state and DOM rendering.
- RLS tests cover anonymous denial, A/B separation, guessed note IDs, write/update/delete attacks, ownership transfer, unknown player IDs, unverified/expired/revoked sessions and conflicting revisions.
- DOM tests cover note HTML/script injection and clearing an unsaved editor on account change/logout.
- Browser UI fixture: PC 1180px and mobile 390px, no horizontal overflow; multiple notes, create/edit/delete and logout cleanup checked. **Synthetic records were used for UI testing. This does not verify real login or hosted storage.** The untracked fixture is excluded from Git and release files.
- Evidence: [validation directory](validation/player-membership-v1/). [Mobile form](validation/player-membership-v1/member-mobile-ui.jpg).

Reproduce:

```sh
npm ci --prefix tools/membership
KVL_JSDOM_PATH="$PWD/tools/membership/node_modules/jsdom" node --experimental-vm-modules --test tests/member-security.test.mjs tests/member-service.test.mjs tests/member-ui.test.mjs
```

## Exact remaining activation steps

1. Install/connect the suggested Supabase plugin and select the intended KVL project. Read its current Auth/API/database configuration before changing it. Reuse an existing project when available. Do not create a paid project without a concrete authorized plan.
2. Apply the schema migration and `supabase/seeds/player-id-allowlist.sql` through the connected service. Keep `kvl_private` out of exposed API schemas.
3. Configure canonical Site URL `https://kvolleylab.com` and the exact callback allowlist `https://kvolleylab.com/member-auth.html`. Preserve email verification. Configure a real sender/custom SMTP if one is not already available; the default Supabase sender is restricted to organization team addresses and is unsuitable for a general membership launch.
4. With two real test accounts, verify login/PKCE callback, logout, browser refresh, cross-device persistence, A/B private CRUD denial using direct REST requests, revoked-session rejection, and successful email delivery. Do not count the local fixtures as these checks. Avoid sending to other people or copying real private notes for a test.
5. Only after these pass, set the public project URL/publishable key and `enabled:true`, record hosted QA evidence and complete the PR/release. No secret belongs in that file.

Recovery: set `enabled:false` to restore preparation UI without deleting private data. Revert scoped frontend files if necessary. Never drop member tables or revoke all users merely to roll back the UI.

Official implementation references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [sessions and logout](https://supabase.com/docs/guides/auth/sessions), [email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp). These were checked on 2026-10-24.

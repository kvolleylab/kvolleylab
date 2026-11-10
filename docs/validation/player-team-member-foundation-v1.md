# Player · Team Member Foundation v1 — 2026-11-10

## Direction
KVL의 로그인 우선 개발 방향을 분석 기능 확장에서 선수·팀 사용 경험으로 전환한다.

현재 핵심 흐름:
1. 선수 검색
2. 선수 프로필 확인
3. 관심선수
4. 선수별 날짜 메모 누적
5. 이후 일반회원 로그인으로 전역 확장

선수/경기 분석 기능은 삭제하지 않지만 관리자 UI에서 보류 상태로 숨긴다.

## Pro player integration
Source:
- 2026-27 V-League men roster snapshot
- 2026-27 V-League women roster snapshot

Result:
- Total pro players: 252
- Men: 131
- Women: 121
- Existing/reused Player IDs: 57
- New permanent Player IDs: 195
- New range: KVL-P-001646 ~ KVL-P-001840
- All 252 roster entries now have a unique Player ID.
- Historical 2026-10-28 roster audit is preserved unchanged.
- New integration audit: `data/sources/v-league-2026-27/pro-player-master-integration-20261110.json`

Identity rule:
- preserve an existing roster Player ID,
- then unique exact Korean name + DOB,
- for an existing DOB-conflict row, reuse a unique same-name canonical identity when one exists while retaining the conflict note,
- otherwise allocate a new pro Player ID above the repository high-water mark.

## Player catalog/profile
- Added `data/master/player_master_pro_v1.json`.
- Player search recognizes `professional` / 프로.
- `players.html` has a 프로 filter and #프로 V-리그 quick entry.
- Player detail loads the pro master and shows current club, jersey, position and V-League roster link.
- Admin player search uses the same catalog, so pro players are also available for watchlist and notes.

## Persistent player notes
Admin player profiles now support:
- new note directly from the profile,
- date-based accumulated note timeline,
- original created timestamp,
- separate latest-updated timestamp,
- edit and delete,
- season/title/body,
- persistence through the existing authenticated admin Edge Function.

Public player profiles do not receive private notes.

## Admin workspace
Visible admin UX is intentionally reduced to:
- 선수 검색
- 관심선수
- 내 메모

Player/match analysis backend and data are retained but the visible analysis tab/action is paused.

## General-member access foundation
Supabase migration:
`20261110142211 member_access_foundation_v1`

Private table:
`kvl_members_private.member_accounts`

Shared Edge Function:
`member-access`

Access rules:
- active administrator -> role=admin, access granted
- active member row -> role=member, access granted
- signed-in Auth user without an active member row -> access denied
- guest -> access denied

The new member table has RLS enabled and no direct grants to public/anon/authenticated.

## Login and gate rollout
- Added `member-login.html`.
- General signup remains CLOSED.
- Player·Team gate mode is currently `preview`, not `enforced`.
- Gate coverage includes current/legacy player routes (`players`, `player`, `player-search`, `player-profile`, `growth-timeline`), team routes, Draft Hub, compare, cohort and records.
- Public visitors are not blocked yet.
- Add `?memberGate=1` to a Player·Team page to test the redirect/login gate before rollout.
- Shared sidebar shows a Player·Team login-readiness badge and recognizes an existing admin session.
- Switching `GATE_MODE` from `preview` to `enforced` is deliberately deferred until general-member onboarding is approved.

## General-member onboarding still pending
Before enforcing the gate:
1. approve email/Kakao onboarding UX,
2. connect identity verification provider and validate LIVE response,
3. set production Auth Site URL / allowed redirect URLs to kvolleylab.com,
4. add production password recovery route,
5. create and verify at least two real member accounts,
6. connect member-private watchlist/notes storage,
7. test logout/session expiry/blocked account behavior.

The old Draft PR #242 is historical reference only and is not merged because it predates the current hosted Supabase project.

## Supabase verification
- active admin: 1
- existing admin bookmarks: 2
- existing admin notes: 2
- member accounts: 0
- `member-access` Edge Function: ACTIVE v1
- `admin-player-workspace` remains ACTIVE v4
- leaked-password-protection warning remains a project/plan setting issue.
- RLS-with-no-policy INFO on deliberately server-only private tables means direct client access remains denied.

## Rollback
- The member gate remains preview-only, so disabling the new scripts does not lock public pages.
- Pro integration can be reverted by removing the pro master source and restoring the two roster JSON files.
- Existing admin bookmarks/notes are not migrated or deleted.

# KVL Analysis · Player Analysis v1

## Purpose
관리자 전용 로그인 UX 안에서 선수별 시즌 분석을 실제로 작성·수정·삭제하고, 기존 개인 메모를 분석 근거로 연결한다. 일반 회원 공개는 아직 활성화하지 않는다.

## Data model
Private table: `kvl_admin_private.player_analyses`

Fields:
- player_id
- season
- title
- summary
- strengths
- improvements
- tactical_notes
- recent_changes
- related_note_ids
- publication_status: `private` | `member_candidate`
- revision
- created_at / updated_at

The table references `auth.users(id)` and is deleted with the user account. It is in the private schema, RLS is enabled, and privileges are revoked from `public`, `anon`, and `authenticated`.

## Authorization
All reads/writes use the existing `admin-player-workspace` Edge Function.
The function:
1. validates the current Supabase Auth token,
2. checks `kvl_admin_private.admin_accounts.active=true`,
3. scopes every analysis query to the authenticated admin user,
4. validates that related note IDs belong to the same user and same player,
5. uses revision matching for update/delete conflict protection.

## UX
- Player rows now include `선수 분석`.
- Analysis list supports search, season filter, and status filter.
- Analysis editor includes season, status, title, summary, strengths, improvements, tactical traits, recent changes, and related notes.
- Existing notes for the same player can be selected as supporting notes.
- `회원 공개 후보` is internal classification only; no member/public endpoint is created.
- KVL Player IDs remain hidden in the visible signed-in UX.

## Verification
- Supabase migration `20261108145217 admin_player_analysis_v1` applied successfully.
- Edge Function `admin-player-workspace` deployed ACTIVE as version 3.
- Admin client JS syntax: PASS.
- Admin client DOM references missing: 0.
- All analysis editor/list DOM IDs present: PASS.
- Edge actions list/save/delete analyses present: PASS.
- Related-note ownership validation present: PASS.
- No synthetic analysis rows inserted during validation.

## Owner acceptance
After Pages deploy:
1. 관리자 로그인.
2. 선수 검색 또는 관심선수에서 `선수 분석` 클릭.
3. 분석 작성 + 기존 메모 1개 연결.
4. `나만 보기` 저장 후 분석 탭에서 확인.
5. 수정하여 `회원 공개 후보`로 변경.
6. 로그아웃/재로그인 후 분석 유지 확인.
7. 분석 삭제 후 목록/카운트 반영 확인.

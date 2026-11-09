# KVL Analysis · Match Analysis v1

## Purpose
관리자 전용 KVL Analysis에서 실제 KVL 경기 ID를 기준으로 경기 사전분석과 사후리뷰를 작성하고, 기존 선수 분석과 개인 메모를 경기 단위 자료에 연결한다.

## Match source
v1 automatically loads:
- `data/competitions/v-league-men-2026-27/data.json`
- `data/competitions/v-league-women-2026-27/data.json`

The existing KVL match IDs such as `VL2627-M-001` are used as the stable match key. Team names, date, time, stage, venue and current score are rendered from the current competition data. A snapshot of match metadata is also stored with each analysis.

## Data model
Private table: `kvl_admin_private.match_analyses`

Core fields:
- competition_key / match_id
- season
- analysis_type: `pre_match` | `post_match`
- match metadata snapshot
- title / summary
- serve_receive
- attack_plan
- block_defense
- rotation_matchups
- key_points
- result_review
- related_player_analysis_ids
- related_note_ids
- publication_status: `private` | `member_candidate`
- revision / timestamps

One administrator can keep one pre-match analysis and one post-match review for the same competition match.

## Authorization and protection
- The table is under the private schema.
- RLS is enabled and privileges are revoked from `public`, `anon`, and `authenticated`.
- All access goes through `admin-player-workspace` Edge Function.
- The Edge Function validates Auth, active admin allow-list, linked player-analysis ownership and linked-note ownership.
- Update/delete operations require the current revision.
- `member_candidate` is internal classification only. No public/member endpoint exists.

## UX
- KVL Analysis now has `선수 분석 / 경기 분석` sub-tabs.
- Match analysis supports list search and filters by competition, pre/post type and visibility status.
- New analysis selects a real V-League match, with team filtering.
- Match card shows current date, stage, venue and score when available.
- The editor includes tactical sections for serve/receive, attack, block/defense, rotation matchups, key points and result review.
- Existing player analyses and notes can be attached as supporting evidence.

## Verification
- Supabase migration `20261109232212 admin_match_analysis_v1` applied successfully.
- Edge Function `admin-player-workspace` ACTIVE version 4.
- Admin client JS syntax: PASS.
- Admin client missing DOM references: 0.
- All match analysis UI IDs present: PASS.
- Match list/save/delete API actions present: PASS.
- Duplicate match/type guard present: PASS.
- Linked player analysis and note ownership checks present: PASS.
- Existing player analysis flow remains present.
- No synthetic match analysis record was created during validation.

## Owner acceptance
1. 관리자 로그인 → 분석 → 경기 분석.
2. V-리그 남자부에서 경기 선택.
3. 사전분석 작성 + 개인 메모/선수분석 연결.
4. 저장 후 경기 카드의 대진·날짜·결과 표시 확인.
5. 같은 경기 사후리뷰 별도 작성.
6. `회원 공개 후보` 변경.
7. 로그아웃/재로그인 후 두 분석 유지 확인.
8. 수정/삭제 후 카운트·목록 즉시 반영 확인.

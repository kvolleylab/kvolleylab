# K-Volley Lab — 2026 KOVO Cup / domestic-template UI prototype

## Roster follow-up — 2026-10-27

Status: IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED on 2026-10-28. Owner explicitly approved publication of the reviewed player information; CI, merge and live results are recorded in the release PR.

The owner requested club team selection to show the player list, like international participants, and then instructed implementation. The archived pamphlet comparison and all 14 original player pages have now been checked: 130 men, 121 women. Two `rosters` JSON modules use the shared renderer's opt-in club profile. Exact identity matches link 54 pre-existing profiles; 197 names remain unlinked. Five conflicting birth dates and one lunar-date case display pending. English names, explicit country values and validated Volleybox URLs are supplementary fields from existing reviewed team sheets, not inferred from the pamphlet. This supersedes the earlier untranscribed/pending-only status below for the Cup only. V-League season rosters remain unchanged. See [evidence, limitations and rollback](validation/kovo-cup-rosters-20261027.md).

Status: PROTOTYPE ONLY, 2026-10-27 KST.

Entry: /kovo-cup-domestic-template-prototype.html?competition=kovo-cup-men-2026
Women: /kovo-cup-domestic-template-prototype.html?competition=kovo-cup-women-2026

## Reused sources
- Google Drive KVL_운영원칙_MASTER_v14 and KVL_COMPETITION_HERO_IMAGE_GUIDE_v1.
- GitHub docs/KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md.
- Existing common Competition Engine V2 Shell, Controller, Components and opt-in domestic-home-v2 presentation.
- Canonical config and data: data/competitions/kovo-cup-{men,women}-2026.
- Existing original KOVO Cup v02 WebP: men/women independently, each PC 2108x406 and mobile 1258x406. Original bytes unmodified.
- Existing seven men/seven women SVG logos, original team/match IDs unchanged.

## Implementation
- Separate noindex HTML preview only. Original competition engine and kovo-cup.html untouched.
- Source data is loaded from canonical production JSON and converted in memory to domestic-home-v2 visual presentation. Source family and data JSON remain unchanged.
- Optional presentationCategory=pro-cup drives Cup-specific breadcrumb, men/women division labels, and participant-team search wording in existing domestic shared presenter. No extra renderer copied.
- The shared pool row supports team logos for this preview by opting into already verified assets, preserving school-level domestic text marks.
- Existing domestic-template composition: Hero, large tabs, overview metrics, monthly calendar/day modal, championship trophies, team cards, full match schedule, rankings, bracket, resources.
- Pro Cup theme: Charcoal Black and Gold for main competition titles/trophies; women additionally Rose accent. Scores are neutral gray (#4B5563).
- Hero uses contain without crop or distortion and the original PC/mobile Hero references. Preview-only CSS is scoped to its HTML page.
- Private/player data, existing routes, Hero files, member settings and operational pages are not modified.

## Data validation caveat
As observed from latest main at prototype start on Oct 27, women's Cup data marks the tournament completed with GS Caltex champion and all 12 games scored. Men's Cup source still shows active and lacks 2026-10-24 semifinal/2026-10-25 final scores. This is a source-data freshness issue, not filled by guesses in the prototype. A separate verified results sync is needed for the male final.

## Focused smoke
1. node tests/kovo-cup-domestic-presentation-prototype.test.cjs
2. node tests/competition-v2-pro-cup-pool-columns.test.cjs
3. Manual PC 1180 and mobile 390/360 Hero, theme, calendar modal, tabs, gender switch and score readability check.

No production replacement. Only after user's visual approval should a separate production promotion be requested.

## Production promotion and domestic-template improvements (2026-10-27)
- Owner approved promoting the domestic-home-v2 visual structure into the existing KOVO Cup men/women production slugs. Do not redirect to a new event-only page. Canonical competitionId, data paths, matching IDs and existing PC/mobile v02 Hero remain unchanged.
- Config keeps `competition.competitionFamily=pro` as source-of-truth. Opt-in `structure.presentation=domestic-home-v2`, `presentationThemeFamily=domestic`, `presentationCategory=pro-cup` selects shared visuals with original charcoal/gold Cup Hero and women rose accents.
- Shared domestic-home-v2 standard now displays actual stadium name when all matches use one arena; earlier venue primary/secondary behavior is retained for multi-venue events.
- Shared final ranking labels tied positions as '공동 N위' instead of presenting two plain N위 entries. The 2026 men's and women's Cup have joint third (both verified semifinal losers, no 3rd-place match).
- Shared pro-Cup match row styling aligns crests/club names/center set scores into symmetric columns on desktop/mobile; no club-specific hacks. Numeric scores stay neutral #4B5563.
- Participant team card can open an inline verified-roster panel using the existing international-style shared roster renderer. A generic `allowPendingSelect` opt-in allows users to see the correct 'official roster pending verification' message without inventing athletes.
- **Important data restriction:** The official Cup media guide is available in K-Volley Lab Drive under 2026 KOVO컵/01_공식자료, but the scanned roster pages are not yet transcribed and matched to KVL Player IDs. No unverified player list is shipped with this UI change. Similarly 2026-27 V-League official roster masters remain under verification; season rosters must not be silently relabeled as Cup participation.
- KOVO Cup men final-source synchronization: 2026-10-24 semifinals KAL 3-0 WRC and KEP 1-3 HDC, 2026-10-25 final KAL 3-1 HDC. Validated set points stored with source links in GitHub competition JSON and in Google Drive 2026_KOVO컵_경기일정_MASTER rows 23-25. No other scores changed.
- Per-team roster publishing remains a separate identity-verification task; pending roster UI is not a claim of completed roster publishing.

## Quick release gates
- Verify 2026 men/women Cup: 12/12 scored, winner and runner-up, two co-third teams, all 7 official logos, original Hero file paths, and round pairing.
- Verify regular domestic university and school pages remain unchanged except common generic label improvements.
- Verify both V-League team-card roster selection gracefully displays pending state without exposing partial player data.
- CI: `node tests/kovo-cup-production-template-20261027.test.cjs`, `node tests/kovo-cup-domestic-presentation-prototype.test.cjs`, `node tests/competition-v2-pro-cup-pool-columns.test.cjs`.

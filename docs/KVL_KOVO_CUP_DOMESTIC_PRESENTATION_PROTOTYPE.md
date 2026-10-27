# K-Volley Lab — 2026 KOVO Cup / domestic-template UI prototype

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

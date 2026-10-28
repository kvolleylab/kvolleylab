# 종합대회 목록·대학 U-리그 PC Hero 이미지 확대

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence belong to the release PR.

Base: `20296f34153b783828868411f0baac490373b873` (#196 podium correction preserved). Branch: `fix/hub-uleague-hero-half-20261028`.

## Scope and decision

The user requested images occupying approximately half of the PC Heroes on the comprehensive hub and university U-League. This continues the authorized production design corrections.

- Comprehensive hub: use a 3:1 PC card instead of 25:7, constrain width explicitly, and reserve half the content width for copy. At 681–1100px use proportional 166.667% image width to maintain the right-side scene without stretching it. Keep the existing minimum card height and mobile rules.
- University U-League men and women: opt into the shared `hero.themeVariant=half-visual` contract. At >=681px use natural image proportions (`auto 100%`) and right-center anchoring instead of the old forced 100%×100% rule. Reduce the overlay over the right half. Above 1100px reserve half the content width for copy; narrower PC retains the previous copy width with stronger left-side contrast so titles do not break awkwardly.
- Keep all six existing PC/mobile assets and their bytes. No generation, asset edits, re-encoding, source-data changes or new event-specific renderer. Preserve mobile image selection/geometry, other competition themes, shared navigation, calendar, results, final-six standings, rosters and all IDs.
- Changes: two existing CSS files, two U-League config opt-ins, two entry-point CSS cache keys, existing cache-version assertion, decision and validation records.

## Verification

- Read current GitHub main, relevant operating/decision documents and current Google Drive Hero image guide. Its older fixed safe-area guidance is superseded by the user's explicit half-image request for these PC Heroes only. Archived originals remain unchanged.
- National festival, comprehensive hub, domestic home and focused Cup alignment tests: **47 passed, 0 failed**. Focused CSS/cache smoke rerun after final CSS corrections also passed; diff whitespace check passed.
- Browser baseline confirmed U-League's effective CSS stretched the photo to 100%×100% despite the newer domestic stylesheet. The opt-in now wins that selector without changing other pages.
- Inspected all three Heroes at 1180px, and measured 1440 / 1024 / 901 / 681 / 390px. PC titles, source asset choice, natural fit and mobile fallback verified.
- Final narrow-width fixes rechecked at 1024 and 681px for all three; U-League women 901px visually inspected. Comprehensive 3:1 sizing initially produced intrinsic minimum-width overflow; explicit width:100%/min-width:0 fixed it. Final checks show no page overflow or text clipping.
- Final examples: comprehensive hub 1138×379 at 1440px, 967×322 at 1024px and 624×274 at 681px. U-League uses 1180×242 at 1440px, 955×242 at 1180px and 666×242 at 681px. Mobile retains 375×218 U-League and 349×259 hub at a 390px iframe viewport (scrollbar included).
- Viewport checks are browser responsive QA, not physical-device certification.

## Release and recovery

CSS cache version: `20261028-hero-half-1`. Merge the reviewed head, wait for Pages and verify the six changed runtime files plus live PC Heroes before recording DEPLOYED.

Recovery: revert this PR. Original images, source documents and sports data require no restoration.

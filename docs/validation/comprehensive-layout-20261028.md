# 종합대회 Hero · 경기결과 지역 표시 수정

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence belong to the release PR.

Initial base: `d9ae7a085c30e5a90cf5d717371a9c3fcbbf7d09`. Rebased base: `9139634058313722efd8b7e52a138c4822b7aaee` (V-League overview PR #190 preserved). Branch: `fix/comprehensive-hero-matchups-20261028`.

## Approved behavior

The user requested a PC Hero scene occupying approximately half the card, corrected domestic-template matchup positioning, complete team names, and representative regions instead of comprehensive-competition logos. This is a correction within the previously authorized production integration.

- Keep selected images 02 / 04 / 07 / 09 / 12 and all ten original WebP bytes. PC scales by height, with a 25:7 card ratio above 1100px, instead of shrinking the padded full canvas. The clipped left portion is background padding; the scene retains its full height and aspect. Detail cards measure 1180×330 and 955×267 in the checked PC viewports. The hub retains a 275px minimum. This explicitly supersedes the previous contain-only PC treatment and fixed PC height for these completed comprehensive Heroes.
- At 681–1100px, cap enlargement at 125% width and align to the bottom, protecting title contrast. At <=680px, keep the existing mobile asset, contain sizing, bottom placement, height and rose/navy treatment. No new overlay, image generation or color conversion.
- Retain time / centered matchup / five-set score lanes on wide PC. Use elastic equal team columns, a centered fixed score, and full wrapping names. At 901–1100px, put set scores beneath the matchup to preserve space after the sidebar. Mobile centers each region and full team name around the score.
- Comprehensive event identities use participant `region` as plain 400-weight text in schedules, team results, brackets/byes, participant tiles and roster headings. Existing right-aligned region text on podium/champion cards remains, without an additional duplicate mark. Other domestic, pro and international identities retain their existing logos.
- Preserve participant/roster navigation, stage filters, source discrepancy warnings, joint third place, bracket paths, scores, all IDs and raw source data.

## Source and regression checks

- Read latest GitHub main, root operating instructions, previous successful Hero and domestic matchup implementation, Drive operating MASTER v15 (same session) and current Hero image guide. No new assets or official sports data were introduced, so the existing archived MASTER/WEB files remain authoritative.
- Nine canonical configs differ only in `hero.size`; raw data, images and source IDs are unchanged. No AVC/VNL, player master or school-logo mapping changes.
- Seven relevant test suites: **107 passed, 0 failed** after rebasing onto PR #190. National festival integration cases additionally verify every schedule team name and representative region against participant records, and verify no team images are emitted in the regional surfaces.
- Browser: five selected Heroes at 1440 / 1180 / 390px; final PC ratio rechecked for all five at 1440 and 1180; 681px youth women's contrast inspected after the compact-width correction. PC image sizing, mobile asset selection and absence of horizontal page overflow verified.
- National boys U18 and youth girls U15 schedules: 1440 / 1180 / 1024 / 901 / 681 / 680 / 390 / 360px. All rendered names fit without clipping, scores are centered, regions do not overlap names, no schedule logos, no page overflow. The 901px failure found during QA was fixed by moving set scores below the matchup; 901 and 1024 were then rechecked for both routes.
- PC final-ranking and knockout views inspected; regions and trophies remain readable without duplicate logos. Existing functional tests cover participant search, selected/all rosters, printing, team-results navigation, division links, calendar dialogs and official score conflicts.
- JavaScript syntax, whitespace checks and focused KOVO geometry test pass. Browser checks are responsive viewport checks, not physical-device certification.

## Release and recovery

Refresh the four entry points' changed CSS/JS cache keys. Merge only the reviewed PR head, wait for GitHub Pages, and compare live HTML/CSS/JS/config bytes against this checkout. Preserve pre-existing unrelated CI failures separately from relevant regression checks.

Recovery: revert this release PR. Original image assets and raw competition data are unchanged; no Drive file restoration or data migration is required.

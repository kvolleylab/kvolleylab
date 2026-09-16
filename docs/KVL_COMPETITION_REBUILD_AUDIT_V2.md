# Competition shared engine rebuild audit

K-Volley Lab · 2026-09-16 · validation only

## Baseline and boundaries

Inspected main: `91dad4c956d6ce6ff137e581f5fd9ef011746c05`.
Visual sources are the AVC men and women production HTML pages and their final browser DOM, not a new design. The original production HTML/CSS/JS/JSON files remain unchanged. No production promotion is authorized.

Drive readback confirmed `KVL_운영원칙_MASTER_v13`, `KVL_COMPETITION_PAGE_TEMPLATE_V2` and `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1`. Template documents are under `K-Volley Lab Data/00_KVL_Data_Center`; hero assets are under `05_BRAND_ASSETS/02_COMPETITION_HERO/{00_GUIDE,01_INTERNATIONAL,02_DOMESTIC,99_ARCHIVE}`. AVC competition data is under `01_국제대회/02_대회별_선수명단/2026/{02_AVC_Mens_Continental_Championship,03_AVC_Womens_Continental_Championship}/{00_공식원본,01_선수명단,02_대회통합}`. VNL uses `01_국제대회/2026_VNL_남자부/{01_MASTER,02_SOURCE,03_BACKUP,04_WEB_EXPORT}`.

## Actual baseline conflict

Production men and women are not identical apart from palette. In the same browser viewport, both had a 218px hero and 103.58px KPI card. However the first qualification brand was 19px in men versus 12.267px in women, paragraph text was 14px versus 10.2225px, and card height was 218.86px versus 194.59px. Thus exact parity with both and a single gender-independent geometry cannot simultaneously be claimed.

The validation implementation provisionally extracts the men's production geometry for all themes. This is not a user-approved replacement of women's production. Cross-gender discrepancies must remain open until the common baseline decision is accepted. No successful visual parity claim is made by this commit.

## A/B/C ownership

| Class | Owned values |
|---|---|
| A: shared engine | Hero geometry, navigation, KPI, qualification cards, focus results, calendar, schedule/date rows/filters, standings, final cards, bracket, participants, roster, resources, responsive layout |
| B: theme | Green/Rose/Purple/Navy palette, gender label; artwork is an explicit data asset |
| C: competition | Names, participants, matches, score data, rules, qualification results, structure modes, final results, sources, asset URLs |

Adapters may normalize data and call the engine. They must not generate card/layout HTML or CSS. New competitions use the same shell. `none` modes and missing/uncertain data must not fabricate results.

## Changes

- Freeze the men's production CSS dependency chain into `kvl-competition-geometry-v2.css`, remove competition-specific generated text/artwork, and replace legacy gender selectors with the common engine selector. Production assets are not edited.
- Restore common site CSS and navigation in the validation shell.
- Remove fake `data-avc-gender=men` from women; apply common geometry with theme tokens.
- Fix desktop/mobile hero custom-property precedence, duplicate KPI handlers, gender navigation view preservation, missing scores, and completed state without a confirmed champion.
- Add common focus rankings/results, pool filtering, selected-country URL persistence and roster profile rendering.
- Connect AVC men's same production roster A/B/C sources, club overlay and Volleybox mapping: 12 teams, 165 rows. Women stays explicitly pending; no names are invented.
- Correct VNL validation input from the obsolete 78-row schedule to the 108-row Drive `일정_DB` extract, plus 8 existing final matches. All 108 preliminary score pairs were cross-checked by MASTER match ID against the 116-match set-score JSON. Original VNL production sources are unchanged.
- Add read-only production-vs-engine iframe comparison at 1180/390/360 for all six views. Numeric geometry mismatch tolerance is 1 CSS pixel. No comparison modifies the reference document.

## Source freshness conflicts

- Men's AVC Drive competition workbook currently reflects only early September 4 results; production JSON has final results.
- VNL Drive workbook has 108 completed preliminary games and final schedule slots; GitHub final/116-set-score JSON supplies completed finals.
- Old VNL 78-row JSON has IDs not aligned to the canonical 108-row MASTER after its partial schedule. It must not be used to join canonical set scores.
- These are existing source discrepancies; this change does not overwrite either MASTER or production.

## Validation gates

Automated data contract: men 26 games/12 teams/165 players, women 26 games/12 teams, VNL 116 games/18 teams; null score rejection passed.
Visual cross-validation: pending browser matrix; no parity pass is asserted.
VNL hero artwork: no dedicated approved hero asset exists in the inspected repository; purple background remains pending an asset, without changing geometry.
Known remaining scope: preserve production roster printing and exact section copy/auxiliary status elements; inspect all visual diffs before promotion.

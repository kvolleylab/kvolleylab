# Competition shared engine rebuild audit

K-Volley Lab · resumed validation review · production unchanged

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
Browser matrix completed: 54 cases, 3 competitions × 3 widths × 6 views. After two focused rechecks, AVC men representative component metrics match in 18/18 cases. Women matches 2/18 (desktop schedule and final ranking); the remaining 16 retain source discrepancies. No full visual parity pass is asserted.
VNL hero artwork: no dedicated approved hero asset exists in the inspected repository; purple background remains pending an asset, without changing geometry.
Roster print rendering and controls have been restored in the shared renderer. Browser print-to-paper/PDF layout has not been validated. Remaining scope: women source resolution, approved VNL hero, auxiliary copy and full visual review before any promotion.


## Resumed work and verification

- Resumed from `27c3addb1914611f0078ddbf27af2d8746c65ed3`; tested rendering through `9c0e0c52d446e3cb47bad7f6a9a855944ab715e9`.
- Removed the extra match-number line that increased mobile AVC schedule cards by 22px; normalized official IDs remain in data.
- Restored roster club labels at mobile widths only, official club count, source note and shared print actions. Source row metrics now match the selected KOR production roster.
- Final result and qualification labels now render from data within the existing card hierarchy. Removed hardcoded AVC advancement text from frozen CSS. VNL does not display AVC Olympic/World Cup claims.
- Restored the final-card mobile 146px minimum and official-resource button/card dimensions from the production cascade, including site-wide overrides missed by the earlier extraction.
- Kept medal colors independent of competition theme, as in the original medal design.
- Constrained mobile Hero metadata to its container; zero candidate overflow cases across the matrix.
- Comparison waits for the shared navigation and fonts, versions candidate URLs, and never labels errors or candidate overflow as a match. `METRICS_MATCH` explicitly means representative geometry only, not complete text/pixel equivalence.
- Removed validation-only footer notes that added an artificial scrollbar. Validation identity remains in page titles and the comparison harness.
- Data contract rerun after roster normalization change: AVC men 26/12/165, AVC women 26/12/0 connected players, VNL 116/18. Missing scores remain missing.

### Evidence and limits

The first matrix at `26dea2b2` returned men 16/18 and women 2/18 representative metric matches, VNL 18 reuse-review cases, and zero candidate overflow cases. Men's 1180 overview was a navigation initialization race; a focused reread matched. Men's 390 resources was 15px narrower because the validation note caused a vertical scrollbar; after removing the note the card measured 344×54px and its link 70.67×22px, equal to production. The full matrix was not repeated after these targeted changes.

Reference men final ranking and candidate VNL final ranking were inspected as rendered screenshots. The VNL score/result copy is data-derived and its dedicated Hero image remains absent. Metric sampling checks the first visible component per selector, not every card, image crop or auxiliary label. Detailed visual approval remains open.

### Women's production blocker

`assets/js/kvl-avc-women-template-v1.js` contains unescaped backticks around `01_선수명단` inside the line-45 template literal. The browser reports `SyntaxError: Invalid or unexpected token`, and `node --check` independently reproduces it. The entire script fails to parse. This is an existing production error, not a change introduced by this validation work.

At 390px the current female reference uses two final-ranking columns while the shared engine uses the male reference's four columns; bracket match heights and standings structures also differ. Reproducing both current sources exactly while allowing only palette changes is therefore not a satisfiable gate. Do not introduce female-only or competition-only layout overrides to hide this conflict. Resolve the reference/common-baseline decision with the owner; production repair or promotion still requires explicit authorization.

### Protected files and remaining work

No original AVC men/women HTML, production CSS/JS/JSON, or `vnl.html` has been changed. All code changes are in V2 shared/adapter/validation/template files. Existing source-freshness discrepancies above remain untouched.

Before final acceptance: resolve women's reference error and common geometry; complete the detailed auxiliary-content/visual review; connect an approved VNL Hero asset; verify print layout. Metrics alone must not promote the engine to production.

VNL 360px resources retain a 15px width difference caused by different total content height/vertical scrollbar presence in the 900px-tall desktop iframe; card height, padding, gap, radius and link geometry match. This is recorded as a difference, not silently counted as full parity.

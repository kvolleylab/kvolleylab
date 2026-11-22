# International country roster UX v2 + current-club registry — 2026-11-22

Status: USER REQUESTED / IMPLEMENTED ON ISOLATED BRANCH / STATIC QA PASSED / BROWSER QA PENDING

## Base
- main: `fd090c3638fdd46f8a25bb5fd82c95420ed48cc7`
- branch: `feature/international-country-roster-ux-v2-20261122`

## Approved Team Finder behavior

### Country cards
- Existing card visuals and bottom `연도·대회별 명단 보기` row remain.
- The entire country card is clickable.
- Keyboard Enter/Space on the focused card opens the country detail.
- Existing flag assets, region filters and search remain.

### Country detail
- The detail opens directly to the integrated roster.
- The old explanatory sentence about one country page / snapshot types is not shown.
- Year selection is a compact dropdown.
- Back navigation is simplified to `← 국가 목록`.
- Redundant event cards are removed from the primary view.
- A compact `대회 바로가기` row remains below the integrated roster, ordered VNL → Asian Games → continental championship → cup when those events exist.
- VNL therefore retains a direct route to its competition page without requiring a redundant roster card.

### VNL Reserve
- A player whose VNL source row has `Reserve` status receives a small `VNL 예비` badge in the integrated roster.
- This is event-specific display evidence, not a permanent player status or a statement that the player was cut from another event.

## Current club registry

New public overlay:
`data/international/player-club-registry-2026-27-v1.json`

Purpose:
- supplement tournament snapshots with a more current, separately reviewed club affiliation;
- never rewrite the historical tournament roster;
- match by verified Volleybox player ID and, when both are available, DOB;
- require an HTTPS public source;
- accept only explicit `CONFIRMED` or `REVIEWED` records;
- fail closed on DOB mismatch.

### Seed batch
Seven Iran men's national-team players that previously rendered without a usable current club were reviewed.

CONFIRMED:
- Amin Esmaeilnezhad → Hiroshima Thunders · Japan · SV.LEAGUE
- Mobin Nasri Mastanabad → Hiroshima Thunders · Japan · SV.LEAGUE
- Ali Hajipour Moghadam Faroji → Foolad Sirjan Iranian · Iran · Iranian Super League
- Mohammad Valizadeh → Foolad Sirjan Iranian · Iran · Iranian Super League
- Esmaeil Mosaferdashliboroun → Foolad Sirjan Iranian · Iran · Iranian Super League
- Morteza Sharifi → Hebei Baoding Wolves · China · Chinese Volleyball Super League

REVIEWED:
- Ilshan Davoodipour → Shahrdari Urmia VC · Iran · Iranian Super League
  - current public team database evidence is available, but this row is intentionally not labeled as an official transfer announcement.

Sources are stored per row in the registry.

### Display aliases
The Team Finder roster overlay displays verified Korean aliases where available:
- Hiroshima Thunders → 히로시마
- Hebei Baoding Wolves → 허베이 바오딩
- Chinese Volleyball Super League → 중국 슈퍼리그
- existing Korean-first club/league aliases remain.

Original club/league source strings remain in the model and detailed player context.

## Important limitation
This seed does **not** mean every international player with a missing club has been resolved.
VNL tournament sources contain many deliberately missing or unconfirmed club fields. Those remain unknown until a current public source is reviewed and added to the registry. No club is inferred from nationality, league, jersey number, or name similarity.

## Protected behavior
Unchanged:
- 89 historical source pointers
- original tournament roster JSON
- Player IDs
- Volleybox links
- tournament-history dots and filters
- member access gate
- KOVO/V-League roster automation
- player detail English names and original source strings

## QA contract
- country card full-click + keyboard navigation
- integrated roster visible immediately
- year dropdown
- old explanatory copy absent
- no primary event cards
- compact competition direct links
- VNL Reserve badge
- current-club registry DOB/source safeguards
- PC 1440 / 900 and mobile 390 / 360 no document overflow
- live Pages QA after merge

## Rollback
Revert the release PR. The registry is an additive overlay; historical roster sources are unchanged.

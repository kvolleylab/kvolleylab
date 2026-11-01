# V-리그 정규리그 순위 표시 — 2026-11-02

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence are recorded in the release PR.

Base main: `bc9b0bdcbf8ba5fed891b76d5cc06c9962236c82` (PR #226). Branch: `fix/vleague-standings-mobile-v1`.

## Requested behavior and scope

- Both V-League divisions remove the redundant **상태** column through existing `structure.standings.showStatus: false`.
- Desktop retains **순위 / 팀 / 승 / 패 / 승점 / 세트 득실비 / 점수 득실비 / 결과**. Data, ordering and qualification labels are unchanged.
- At680px and below, optional `mobileStats: "wins-losses-points"` displays **승 / 패 / 승점** beside the rank and full linked team name. The existing result label remains below the team name. All columns fit390px and360px without horizontal scrolling.
- This option requires a single league with status hidden. Unset settings preserve existing VNL/AVC, university, school and Cup mobile layouts. The common renderer is extended, not duplicated.
- Zero remains0; missing values remain `-`. No standings calculation, ranking rule or source fact was changed.
- Shared component JS/CSS, both division configs and their exact public-review hashes, component cache token `20261102-vleague-standings-1`, focused tests and documentation are the only changes.
- Existing black/gold men's and rose women's theme values and Arial/Korean fallback remain unchanged. No new theme colors.
- All division data/roster JSON files are byte-identical to base. No MASTER, IDs, match results, timings, players, calendars, Hero or protected AVC/VNL config changes. Production validation stays enabled; only the local HTTP QA copy disables it.

## Validation

- Related roster, standings, selected-team calendar, VNL production, V-League calendar and recent/next regressions: **53/53 PASS**.
- Actual existing `KOVO_PUBLIC_STAT_API` published snapshot integration at1180/390/360 for both divisions: **6/6 PASS**. No fabricated results or new data collection.
- Checks cover exact source wins/losses/points, unchanged desktop ratios/results, missing/zero values, links, data immutability and opt-out layout.
- Browser PC1440 (1180px content convention): both division tables have8 columns/7 teams; men's header/value x-position differences are0 for all8 columns, rows1130/1130 client/scroll width.
- Browser360: both division tables330/330 client/scroll width, document360px, no clipped team names, stats or result labels. Browser390: table360/360 and document390px. Result badges remain visible below full team names.
- Team link continues to the selected team's existing calendar/results route, including IBK.
- JS syntax, `git diff --check`, unchanged source-data bytes and reviewed-public-config hash gate: PASS.
- Prior clean-main evidence records two unrelated pending-postseason assertion failures; this display change does not claim all repository CI is green. Current workflow results are recorded in the release PR.

Screenshots: [men360](vleague-standings-mobile-20261102/men-360.jpg), [women360](vleague-standings-mobile-20261102/women-360.jpg), [PC](vleague-standings-mobile-20261102/men-pc.jpg).

## Recovery

Revert only this PR to restore the prior status/mobile columns. Preserve subsequent automated results; no data or MASTER rollback is required. Configuration contract is recorded in [domestic template](../domestic-template-v2.md).

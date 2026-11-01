# V-리그 달력 후속 수정 — 2026-11-01

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence are recorded in the release PR.

## Scope and decision

Base main: `2b13d05ee5ce2b2055e3f8a4c1b011c2437b48c3` (PR #223). Branch: `fix/vleague-calendar-holiday-mobile-v2`.

The user's follow-up replaces the earlier calendar-only `S∞P` alias and mobile horizontal-scroll decision. Women now use `SOOP`; both divisions show red Sunday/public/substitute-holiday numbers with pale-red day backgrounds. Ordinary date numbers are neutral black, including the women's rose-themed calendar. All seven columns fit at 390px and 360px.

The earlier verified holiday list/coverage and source evidence remain unchanged: [v1 source and validation record](vleague-calendar-20261101.md). No new holiday claims, Naver verification, or match-time changes are introduced. Holiday status comes from the verified date list/Sunday rule, never from the match time. A Saturday alone is not marked as a public holiday. Holidays without a match receive the same date/background treatment.

## Display and isolation

- Women calendar alias: `structure.calendarDisplay.teamAliases.SOO = SOOP`. Canonical names, IDs and full-name links are unchanged.
- Normal date: `#20252B`; holiday date: `#C53040`; holiday day background: `#FFE9E9`, identical for both divisions. Existing normal match-day theme shading remains. Matchup `#294259` and location/time `#61758A` remain neutral.
- PC retains `1R KB vs 삼성` / `(평택, 14시)`. Mobile allows wrapping between whole team groups, e.g. `1R SOOP` / `vs 정관장` / `(광주, 19시)`, so team names are neither split internally nor truncated. Compact mobile text is a deliberate tradeoff to show all seven columns together; the date remains 13px and tapping a day opens the existing larger full-name details.
- Remove the 644px minimum width, scroll wrapper and horizontal-scroll hint. Width follows the container. The existing shared renderer serves both overview and selected-team calendars.
- Changes are scoped to the existing `vleague-compact` opt-in and `.dv2-vleague-calendar`. Other domestic, VNL and AVC calendar presentations do not opt in.
- Cache token: `20261101-vleague-calendar-2` for the display helper, domestic JS and domestic CSS. Production validation remains enabled. The local HTTP QA copy alone disables canonical HTTPS validation and is not committed.
- No match data, result, schedule time, roster, Player ID, MASTER, theme family, navigation or Hero changes. Men config is unchanged. The public-review manifest records the exact reviewed women config hash and this user request.

## Verification

- Calendar formatting/holiday/interaction, selected-team calendar, paired V-League summary, VNL production, and Cup geometry regressions: **33/33 passed**.
- All 252 registered season fixtures keep their source-derived round, teams, venue and time; tests verify source immutability and full-name day dialogs. University opt-out retains its original calendar.
- Browser women PC viewport1440: inner calendar clientWidth/scrollWidth **717/717**, no matchup/location clipping, normal dates `rgb(32,37,43)` and matchup 11px.
- Browser men/women390: calendar **331/331**, document width375 within viewport390 (15px scrollbar). All seven columns fit; no clipped team groups.
- Browser women360, February2027: calendar **301/301**, document width345 within viewport360; no clipped team/location spans. Dates6/7/8/9 and Sundays14/21/28 use `rgb(197,48,64)` on `rgb(255,233,233)`. No horizontal calendar scrolling.
- Month navigation retains shading; tapping February9 opens the existing SOOP–GS칼텍스 dialog at16:00 with the full venue and schedule link. SOOP is visible in both PC/mobile matchups.
- `git diff --check`, JS syntax and reviewed-public-config hash gate: passed before publication.
- The earlier clean-main comparison documented two unrelated pending-postseason assertion failures. No claim that the full repository suite passes; these are not changed by this display-only correction. Release PR records current CI results separately.

Screenshots: [men390](vleague-calendar-v2-20261101/men-390.jpg), [women360 / February holidays](vleague-calendar-v2-20261101/women-360.jpg), [women PC](vleague-calendar-v2-20261101/women-pc.jpg).

## Recovery

Revert this follow-up PR to restore PR #223's alias, date-only holiday highlight and local calendar scroll. Match/roster/MASTER rollback is unnecessary. Preserve subsequent automated data updates when reverting.

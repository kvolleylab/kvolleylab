# 종합대회 지역 로고 형태 복원

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence belong to the release PR.

Base: `a0a0036062d35a8e94c4741a938a5fc74fb4370d` (V-League recent/upcoming matches PR #192 preserved). Branch: `fix/comprehensive-region-marks-20261028`.

## Approved behavior and scope

The user requested restoring comprehensive competition logo shapes with representative region names inside. This is a scoped correction within the previously authorized production integration.

- Reuse rounded text-logo styling, existing men's blue and women's rose tokens, and official participant `region` values. No new image assets or team-name abbreviations.
- Apply to both national festivals: schedule/team-results identities, bracket and byes, participant cards, roster headers, overview champion and final-ranking logo slots. Keep previously approved right-aligned plain region text in ranking rows.
- Context sizes: 44px schedule / 38px mobile, 64px participants and roster header / 48px mobile, 32px bracket and 60px final ranking. Keep centered scores, full wrapping team names and narrow-PC set-score lanes.
- Preserve selected Hero images and dimensions, all schedules/results/rankings/rosters/IDs, team navigation and filters, and non-comprehensive logos. Preserve V-League overview and match-summary changes from latest main.
- Change only the shared CSS, two renderers, three affected HTML cache keys, focused cache-key assertion and this decision/validation record.

## Verification

- Current main, operating instructions, existing text-logo implementation and latest decisions checked. Drive MASTER v15 and Hero guide were checked earlier in this ongoing task; no new source data or assets are introduced.
- `node --check` for both JS renderers and `git diff --check`: pass.
- Relevant existing test suites: **73 passed, 0 failed** (national festival, comprehensive hub, domestic home, KOVO desktop alignment and V-League). Initial attempt had a missing local jsdom path; rerun using the installed dependency completed successfully.
- Browser national boys U18 schedules at 1180, 901 and 390px: square region marks render, no clipped team names or page overflow. Visual inspection at 1180/390px confirms centered score and complete long names.
- Youth girls U15 schedule at 360px: 38px rose marks, `#8E315E` text and `#FFF0F6` background, no clipped names or horizontal overflow.
- Youth girls U15 final rankings / bracket at 360px: 60px podium and 32px bracket marks; correct region names and trophies retained. Participant cards use 48px marks without overflow.
- National men's general overview at 1180px: 44px champion and 64px participant marks; no page overflow.
- Responsive browser checks are viewport checks, not physical-device certification. Existing functional tests cover participant/roster navigation, calendar dialogs, source discrepancies and division routing.

## Release and recovery

Cache version: `20261028-comprehensive-region-marks-1` in national-sports-festival-2026.html, national-youth-sports-festival-2026.html and competition-engine.html.

Merge the reviewed head, wait for Pages completion and verify changed runtime files against the live site before marking DEPLOYED in the release PR. Keep unrelated pre-existing workflow failures separate.

Recovery: revert this release PR. No source-data, asset or Drive restoration is required.

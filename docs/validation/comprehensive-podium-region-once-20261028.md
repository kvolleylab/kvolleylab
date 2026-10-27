# 종합대회 최종입상팀 중복 지역명 제거

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Release PR records merge, Pages and live evidence.

Base: `f5d23a215e9c29cfcb7a6b9b29daf2f46085449c` (#195 V-League hover restoration preserved). Branch: `fix/comprehensive-podium-region-once-20261028`.

## Scope

User requested only rank, region logo, full team name and result in the final podium cards. Remove the extra right-side region span and wrapper from the shared final-ranking renderer. Its non-regional output is unchanged. Existing centered styles now align the team name below the region logo. Keep trophies, team links, joint third place, regional data and result-suffix cleanup. Hub/overview region displays, Hero, schedule, bracket, rosters and all source data are unchanged. This continues the user's authorized production design corrections.

Only the component JS cache key changes in the two festival entry pages and competition-engine.html: `20261028-comprehensive-podium-region-once-1`. No CSS changes or new assets.

## Validation

- Latest main and operating documents/decisions checked; Drive MASTER v15 was verified earlier in this ongoing task. This correction introduces no source-data or asset changes.
- JavaScript syntax and diff whitespace checks passed.
- National festival, comprehensive hub and domestic home suites: **46 passed, 0 failed**. Existing regional assertion now verifies the region in the podium logo and absence of a duplicate text span.
- Browser: national men's general final ranking at 1180px and 390px shows `1위 / 경기 / 화성시청 / 우승`, centered, with no duplicated region. All four placements and team links preserved.
- Youth girls U15 at 360px shows the correct four region logos and result labels with no duplicate region or horizontal overflow.
- Responsive checks use browser viewport widths, not physical devices.

## Release and recovery

Merge reviewed head, wait for Pages, compare the four changed runtime files with live bytes and check the live podium. Record DEPLOYED evidence in release PR.

Recovery: revert this PR. No data migration or source-file restoration.

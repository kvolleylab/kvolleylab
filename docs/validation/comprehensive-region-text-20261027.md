# 종합대회 지역 일반 글씨 · 2026-10-27

Status: IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, deployment and live verification are recorded in the release PR.

Base: `ab53b3d79682b8110cfd720c21fb55a44945f8a1`. Branch: `fix/comprehensive-region-text-20261027`.

## Change and scope

The user corrected the approved production design: show representative regions at the right end of each team-name row, without badges or bold type. Applied to the comprehensive hub, national sports festival and national youth sports festival overview champion/ranking rows, and final podium cards. Regions use weight 400 with no border/background; team names wrap independently. Existing result descriptions, joint third places, team links and trophies remain.

Changed files: the hub JS/CSS, shared domestic overview JS/CSS, final-card renderer, three page cache versions, existing region-selector assertions and this decision/QA record. No competition data, roster, source metadata or IDs changed. The official region mapping from PR #176 is retained. No new Drive data verification was needed for this presentation-only correction.

Latest main school logo/location and KOVO Cup work is preserved. In particular, the existing PRO Cup CSS tail is byte-identical to the base. Regional markup/styles remain conditional on the comprehensive audience.

## Verification

- JS syntax checks: all three changed scripts pass. `git diff --check` passes.
- Existing comprehensive hub, national festival, domestic overview, school domestic and team UX suites: **80/80 pass**, no skips. Only old badge class selectors were renamed in existing assertions.
- PC (1348px content viewport): hub, national festival men's university overview and final podium. All representative-region text has computed font-weight 400, transparent background and 0px border. Region right edges match their team-row right edges.
- Mobile (360px frame, 345px usable viewport): hub's 36 regions, youth women's U15 overview and all four final podium cards. No page overflow or clipped team rows; long school names wrap and regions remain at the right.
- Preview copies alone disable the canonical production URL check for local HTTP QA; production HTML retains production:true. The preview server and generated dist are temporary and not committed.

## Release and recovery

Use a reviewed PR and the existing GitHub Pages release path under the user's continuing authorization to update the operating homepage. Record exact head/merge SHA, Pages result and live checks in the PR. Recovery: revert only this correction's merge commit, preserving concurrent changes. No data rollback is required.

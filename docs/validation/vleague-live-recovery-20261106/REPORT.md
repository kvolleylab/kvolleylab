# V-League live recovery — 2026-11-06

**Status: IMPLEMENTED / LOCAL QA VERIFIED / NOT DEPLOYED / LIVE ACCEPTANCE INCOMPLETE.**

Related issues: [#257](https://github.com/kvolleylab/kvolleylab/issues/257), [#259](https://github.com/kvolleylab/kvolleylab/issues/259). Do not close either issue merely on merge or successful tests.

Initial main: `cbedc3ea03864e9ca264fdcba9cd3ab614f8c777`. Before submission, fast-forwarded the isolated `fix/vleague-live-recovery-v1` branch to `30c2805e0d29b8bd06a3c6e8fe4253d8fffc7747`, preserving the independently approved university hub release #260. Before remote submission, rebased onto `6bef7f7d81a1159dc67620040fed8a8a6dcb9788` to also preserve the independent private administrator workspace #261.

## Findings backed by observations

| Layer | Evidence | Finding |
|---|---|---|
| Trigger | V-League schedule runs created/started 2026-11-06 15:35:00 and 19:41:38 KST | 4h 6m 38s between run creation events; this is a trigger delivery gap, not a four-hour runner queue in those two runs. Exact GitHub-internal cause is unavailable. |
| Existing publisher | [Run 42204606790](https://github.com/kvolleylab/kvolleylab/actions/runs/42204606790), publish artifact 13495862331 | Official 252-match reconciliation passed; observed at 19:43:03 KST; two MASTER status cells written and read back; publication gate passed. |
| Google MASTER | Native `경기일정_MASTER!A1:S15` read from `2026-27_V리그_경기일정_MASTER`, spreadsheet `180no_j27R_uw2adWH2BiWbbZ6QUWKVblqymIqNvkBU8` | M006/W006 were 진행중, final-score columns blank. MASTER was not altered during this recovery. Keeping these final columns blank for live scores is intentional. |
| JSON | Production M006/W006 plus run artifact | `liveScore` contained men's 0:1 and women's 1:0 at 19:43:03; no per-set live points were exported. |
| Pages | [Run 42204837587](https://github.com/kvolleylab/kvolleylab/actions/runs/42204837587), head `cbedc3e…` | Existing data publication succeeded. This does not prove correct rendering on every page. |
| Actual browser | Fresh public home showed 0:1 / 1:0 with 갱신 지연 and 19:43, but following the men's match link opened the schedule row with `VS` and no live timestamp | Schedule rendering used final `score` only; the home failure reported earlier was not reproducible in the fresh session. No evidence proves cache was the original home failure. |
| Cache/Console | Direct public JSON HTTP 200; max-age 600; last-modified 10:44:01 UTC. Live page had no relevant application console error | Cache can delay old-client delivery, but is not established as the root cause. Minute-bucket query keys and no-store are preventive defenses; asset version keys are updated. |
| Later official source | Read-only collector snapshot 23:11:47 KST, 252 matches, all gates pass | Both Nov 6 matches had ended: men 대한항공 1–3 한국전력 (23–25,25–18,24–26,25–27); women IBK 3–1 GS (28–26,25–19,25–27,25–21). Those later final results were not written to production by this task. |

GitHub documents that scheduled jobs may be delayed or dropped under load: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule. This is a platform limitation consistent with the observed gaps; we cannot identify an internal platform incident from repository evidence alone.

## Implementation

- `scripts/kovo_vleague_source.py`, `scripts/kovo_vleague_update.py`: retain `hspoint/aspoint` as provisional set-win counters; certify only completed `hsNpoint/asNpoint` pairs that satisfy volleyball set-ending rules and agree with those counters. Store these as `liveSets` with `status=completed`. Omit partial or contradictory set points. Confirmed final results still require the existing end marker, complete points, result checks, standings reconciliation and MASTER checks. On finalization remove provisional fields. No fabricated scores or name-based ID matching.
- `assets/js/kvl-competition-data-v2.js`: one shared live state contract; validate official source, match key, count and observation time. At >=30 minutes, the main score becomes `—`; the last observed score is explicitly labeled with its KST timestamp. Inconsistent/missing points do not invalidate independently verified set wins.
- `index.html`, shared competition components, domestic overview, match calendar and loader: show set wins and completed set points on home, overview, schedule and day dialog; re-evaluate age every minute, fetch every five minutes, refresh after returning to the page and recover from initial peer-division fetch errors. Update matches/standings without replacing loaded roster modules. Polling does not jump to the schedule anchor again. Scope layout changes to pro-league.
- `infra/vleague-scheduler/`: inert Cloudflare Worker + Durable Object implementation; external wake-up of the existing publisher, no direct data/MASTER writes. Durable overlap protection, dispatch retry suppression, public-data watchdog and one-time incident/recovery notification to Issue #257. See [activation and rollback](../../../infra/vleague-scheduler/README.md).
- `.github/workflows/vleague-auto-update-v1.yml`: recognizable publisher run name, default-off match-only input for the auxiliary trigger, relevant PR checks. Existing publish approvals, WIF/Google credential handling, lifecycle, concurrency and player gates remain in place.

Player connection reviewed from `data/player-updates/master_targets.json` and `pilot.json`: exact men's/women's MASTER IDs and Player_ID mappings are unchanged; the existing event pilot remains blocked on effective-date evidence. No roster, player record, MASTER connection, standings data, official match ID, international or KOVO Cup production payload was edited.

## Verification

| Check | Result |
|---|---|
| Official source/updater/MASTER/standings/publish safety | 183 Python tests passed |
| Player MASTER, identity/current-value and workflow regressions | 186 Python tests passed; final workflow-only gate recheck 9 passed |
| Existing competition lifecycle/end-of-season | 45 Python tests passed |
| V-League UI, real official final candidate, calendar, roster, postseason, live recovery and scheduler | 87 Node tests passed, 0 skipped; final targeted live suite 5 and expanded scheduler suite 10 passed |
| Shared competition contract/config, domestic home/team calendar and KOVO Cup regression | 82 Node tests passed |
| Worker bundling and config | Wrangler 4.158.0 `deploy --dry-run` succeeded, 9.21 KiB worker, Durable Object binding recognized, both approval flags false, nothing uploaded |
| Synthetic two observations 15 minutes apart | Passed: first-set score → updated wins/sets → second update; open calendar/schedule/overview refresh, roster object and match IDs preserved |
| Fetch failures and age boundary | Passed: initial other-division failure retries; later failure preserves explicitly historical score; exactly 30 minutes triggers delay |
| Actual live consecutive cycles | **NOT VERIFIED**: source matches were already final during this work; replay fixtures are not actual live evidence |

The calendar regression fixture clock was moved to after both Nov 1 matches, since asserting final results before their scheduled start is inconsistent with the shared timestamp check. The workflow input whitelist was extended for the new default-off match-only input. These changes do not relax source or production approval checks.

## Browser verification

The actual Chrome browser loaded the modified site in fixed-width **1440, 390 and 360 CSS-pixel iframes**. This validates responsive layout, DOM rendering and navigation, not Android/iOS hardware. The local preview uses synthetic first-set points clearly labeled above the page and a fixed 19:45 KST clock. Only the preview disables the HTTPS-canonical SEO gate because its origin is HTTP; the production gate remains enabled in committed code and HTTPS jsdom integration.

| Page | 1440 | 390 | 360 |
|---|---|---|---|
| Home, both divisions | verified | verified | verified |
| V-League overview, both divisions | verified | verified | verified |
| Men's schedule | verified | verified | verified |
| Women's schedule | verified | verified | verified |

Visible records agreed: men's 0–1 / first set 21–25; women's 1–0 / first set 25–20; both 19:43 KST. **The point pairs in this table are synthetic layout fixtures, not the historical Nov 6 first-set scores.** All measured document widths equaled the requested viewport width after hiding the desktop scrollbar only in the preview. The operational first-set point pairs were not archived at 19:43, so they cannot be retrospectively certified from this session.

Evidence images: [home 1440](home-1440.jpg), [home 360](home-360.jpg), [overview 360](overview-360.jpg), [men schedule 1440](schedule-men-1440.jpg), [women schedule 390](schedule-women-390.jpg).

## Release and actual-live acceptance gate

1. Obtain explicit owner approval to merge/deploy this PR. No production write/merge has been performed by this recovery task.
2. Verify merge SHA, Pages run, served asset contents and both public JSONs independently from visual rendering. Perform an approved match-only reconciliation to catch up final results; verify exact MASTER readback and publication receipt.
3. Connect the existing Cloudflare account and activate the bounded worker only after approval. No available Cloudflare connector/account credentials were found in this session. Do not create a different account or claim cron activation from a dry-run.
4. During a real match, record at least two consecutive observations after the first completed set, including men's and women's coverage. For each cycle preserve: trigger event/run ID; official source key/time/wins/points; exact MASTER status/final columns and readback receipt; public JSON SHA/time; Pages run/SHA; home/overview/schedule/day-dialog screenshots at the three widths. Final-score MASTER columns stay empty until official final verification.
5. Confirm subsequent scheduled invocations continue. Verify a real incident/recovery notification and operator delivery settings; worker self-failure alerting needs Cloudflare configuration. Keep #257/#259 open until this entire acceptance gate passes.

| Required actual live cycle | Run/API/MASTER/JSON/Pages chain | PC/mobile visible result | Status |
|---|---|---|---|
| Cycle 1 after one completed set | pending after approved deployment | pending | NOT VERIFIED |
| Cycle 2 at a later observation | pending after approved deployment | pending | NOT VERIFIED |

This report intentionally distinguishes existing historical publication, local repairs, a successful dry-run and actual production recovery.

## GitHub PR verification update

PR [#262](https://github.com/kvolleylab/kvolleylab/pull/262) was submitted with tested tree `fe8bc7b3b8f9a1a201c852e413857d5fb5bbf924` (remote commit `3ab7c951ab2241823d719a7f52df0cc1c491424c`). Local and remote trees were identical. [V-League validation 42238082961](https://github.com/kvolleylab/kvolleylab/actions/runs/42238082961) passed source/MASTER safety tests, UI regressions, a fresh official collection and actual candidate rendering; publish and player writes were correctly skipped.

A focused Cup regression rejected only the new CSS cache-version string; its accepted-version list was extended without relaxing geometry checks and this regression was added to the V-League workflow. No Cup production layout/data changed.

Other existing repository workflows are not all green: university batch generation attempts to update an existing file without its SHA (HTTP 422), SKKU registration expects 16 MASTER rows but finds 127, and Kyungil registration expects the earlier 78-row state. Their script/data files are unchanged in this PR. The legacy connect-vnl-schedules/build-player-timeline workflow failures also existed on main `6bef7f7` ([42237223684](https://github.com/kvolleylab/kvolleylab/actions/runs/42237223684), [42237221696](https://github.com/kvolleylab/kvolleylab/actions/runs/42237221696)). These are separately recorded limitations, not permission to alter player MASTER or protected international workflows.

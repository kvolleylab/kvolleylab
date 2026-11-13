# V-League partial observations and delayed end marker repair

Date: 2026-11-13 KST. Base: `b6f8537b2b55658679429f30bc837d9e43953975`.
Status: IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED.

## Actual incident

[PR #262 evidence](https://github.com/kvolleylab/kvolleylab/pull/262#issuecomment-6823966907)
records the November 12 natural publishers. Run 43212862453 observed the source
at 20:54:18 KST and published successfully. Run 43215778073 failed at 21:13:39
with `Winning result has no official end marker yet`. The log does not identify
which match caused the exception. Run 43218810135 observed at 21:34:08 and
published successfully. The observation gap was 39m50s although dispatches
continued approximately every 20 minutes. Code deployment success is separate
from these score-publication receipts.

The earlier live observations also showed verified first-set points disappearing
when later set-point rows were incomplete. Both Python and shared JavaScript
required points for every completed set, suppressing a valid prefix.

## Behavior

- Certify each contiguous completed-set prefix against official win counters.
  Missing later points no longer erase a valid earlier set. Never invent points.
- If points disappear, retain only independently validated earlier rows for the
  same source, match and date, with their original per-set observation timestamps.
  Present conflicting points prevent retention; monotonic wins are required.
- A three-set win without the official end marker is provisional `finalPending`,
  displayed as `종료 확인 중` / `최종 결과 미확정`. It does not certify a final
  winner or enter final-result MASTER fields or standings. Official end-marker
  and final-set validation remain mandatory for finalization.
- Fresh 0–1, partial 1–2 and provisional 1–3 appear in the primary score position.
  At 30 minutes the primary score is withheld and the historical score is labelled
  `갱신 지연`, preserving the existing stale-data rule.
- The shared helper cache key changes on home and competition-engine entrypoints.
  Worker, cron, credentials, protected player data, IDs, Cup and international
  data remain unchanged. No new Worker deployment is needed.

## Verification

345 regression tests passed: 188 V-League Python tests, 45 lifecycle tests,
9 current-value workflow tests, 4 job-isolation tests, and 99 Node tests covering
live recovery, home summaries, calendars, rosters, postseason, Cup alignment and
the scheduler. These are automated tests, not actual live acceptance evidence.

Read-only official collection at 2026-11-13 01:22:44 KST covered all 252 matches.
Independent Google 경기일정_MASTER was read in FORMULA mode. Candidate status
was READY; match/standings/export gates passed, MASTER changed cells = 0,
candidate changed files = 0, production_written = false, master_written = false.
Six DOM tests against that actual candidate passed for male/female pages with
modelled 1180/390/360 widths. DOM models are not real viewport screenshots.

`git diff --check` passed. No workflow dispatch, MASTER write, merge or deployment
was performed for this repair. Existing 27 player-identity conflicts remain in
their separate validation scope and were not repaired or bypassed.

## Remaining acceptance and release

Production approval is still required. After approval, verify code Pages first,
then natural publisher source observation, MASTER write/readback, public JSON,
score Pages and actual home/male/female schedule display for at least two
consecutive in-play observations. About 20 minutes is the user's accepted cadence;
30-minute stale-data warnings remain required. Actual 1440/390/360 browser checks
and continuous live recovery have not passed for this revision.

Standings reconciliation remains strict: an official standings snapshot ahead of
confirmed results can still stop publication. That separate condition was not
established as the cause of the November 12 failure, and this patch does not
invent or relax standings. Worker external monitoring, Cloudflare failure alerts
and GitHub email/push receipt remain separately unverified.

Rollback is a reviewed revert of this code change with normal approved Pages
deployment, never manual invention or rewriting of protected score/player data.

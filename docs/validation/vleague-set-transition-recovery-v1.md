# V-League set and match-end transition recovery v1

Date: 2026-11-20 KST. Base: `5813a04a255b895ac07059989595aefe66fb6d7d`.
Status: USER APPROVED RELEASE / IMPLEMENTED / PR SAFETY QA PASSED / DEPLOYMENT PENDING.

## Actual failures and evidence limits

- [11/19 publisher44510394737](https://github.com/kvolleylab/kvolleylab/actions/runs/44510394737):
  preview19:58:26 and publish19:59:07 KST both observed women's0–2 but selected
  only the first set19–25 with `REALTIME_SET_COUNTER_MISMATCH`. The old validator
  rejected before recording broadcast counters/points. Its exact historical
  `setIng` value cannot be reconstructed, and synthetic tests are not a replay.
  The next20:19 observation supplied both19–25 and20–25.
- [21:42 publisher44526366955](https://github.com/kvolleylab/kvolleylab/actions/runs/44526366955):
  check job135568001594 failed21:43:49 with `SourceError: Final result lacks
  complete per-set points`, before the supplemental lookup. No MASTER/site
  write occurred; source-observations was empty. The log does not identify the
  raw failing game, so do not assert that it was the women's row.
- [22:02 publisher44529509291](https://github.com/kvolleylab/kvolleylab/actions/runs/44529509291)
  observed22:04:21 women's final1–3,19–25/20–25/25–18/23–25, wrote/read back
  four MASTER cells, committed the base SHA above, and passed
  [Pages44529895442](https://github.com/kvolleylab/kvolleylab/actions/runs/44529895442).
  Its public readback was `DEPLOYED_VERIFIED`22:05:17. This later natural recovery
  used the old code and is not evidence that this repair has shipped.

## Small, bounded changes

1. For a nonfinal set break, permit `setIng == sum(set wins)` only when all those
   sets have contiguous legal terminal points, their winners exactly match the
   broadcast counters, and there are no nonzero next-set points. Preserve exact
   game identity, schedule-counter corroboration and prefix conflict checks.
   Larger counter lags, missing points, unfinished/deuce rallies and conflicts
   still cannot supplement the score.
2. Record validated numeric wins, current/expected set number and points before
   the counter rejection. Record `BETWEEN_SETS` or `CURRENT` for an accepted
   counter. No raw response, player, lineup, feed, MASTER or credential data.
3. A same-day regular-season schedule row with an end time, legal3-win result,
   matching W/L marker and a nonempty valid but truncated point prefix may be
   held internally as `final_points_pending`. Only the full collector opts in;
   direct normalization and past/postseason rules stay strict. The same game's
   broadcast must supply exactly matching win counters and all legal3–5 sets,
   agreeing with every existing schedule point. Only then is the already-ended
   result validated as final. Missing end markers stay provisional; incomplete,
   unavailable or conflicting supplements still fail before export. The pending
   state cannot leave collection or pass the updater's export validation.
4. Final supplement provenance travels as `final_points_source_url` in the
   source snapshot, `scoreSourceUrl` in the public match, and an official URL in
   the publication receipt. Preserve that attribution when the schedule catches
   up with the unchanged final result. MASTER keeps its primary schedule URL.

No invented scores, permissive fallback, standings relaxation, schedule interval,
Worker deployment, authentication or approval changes. Existing official ranks,
final correction/manual-lock safeguards, player MASTER/rosters/IDs, international
competitions and Cup remain protected.

## Validation

- 234 source/standings/MASTER/publication Python regressions passed, including
  27 new transition/final/attribution tests with both-gender boundary subcases.
- 45 lifecycle,9 player-current-value workflow and4 job-isolation tests passed.
- 101 existing Node regressions and6 actual-candidate DOM checks passed. The
  first Node invocation lacked the existing jsdom dependency; after installing
  the workflow's pinned26.1.0 package outside the checkout, all checks passed.
- Independent review found no blocking issue; `git diff --check` passed.
- 11/20 00:13:51 KST fresh official collection and independent MASTER FORMULA
  snapshot:252matches,17finals in each division, both official standings
  reconciled, `READY`, changed MASTER cells0, master_written=false and
  production_written=false. Nov19 men's1–3/four sets and women's1–3/four sets
  match the existing MASTER and published data. This is a read-only final-result
  check; the new live-transition branches cannot be exercised by these now-final
  source responses.
- GitHub PR validation results are recorded in the release PR. DOM
  fixtures/candidate rendering do not establish real1440/390/360 browser success.

## Release and next actual match

On 2026-11-20 KST the user explicitly approved PR379 merge and production release.
Head8144c636 passed V-League CI44553259328. Concurrent mainb00ffcdb only
conflicted in the shared decision log; preserve both entries and all unrelated UI changes.
Final merge, Pages and live evidence are recorded in PR379 and PR262 comments.
Do not force-dispatch or manually write MASTER to manufacture acceptance evidence.
After approval, verify code Pages separately from natural score publication.
Use source-observations decisions/counters, actual MASTER receipt, commit hashes,
Pages/public readback and real home/overview/schedule at two consecutive live
observations. Approximately20minutes is accepted;30minutes without an observation
requires stale indication and operational alert. Worker external monitoring,
Cloudflare failure alert delivery and GitHub email/push receipt remain unverified.

Official schedule rechecked11/20 00:10:51 KST:19:00 men's Hyundai Capital–KEPCO
(023:001:MALE:35), women's Korea Expressway–IBK(023:001:FEMALE:36). Requery on the
actual verification run. If no relevant transition occurs, do not claim it tested.
Rollback is a reviewed revert of this repair, never a hand-edited match result.

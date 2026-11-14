# V-League completed live-set points: official broadcast supplement

Date: 2026-11-14 KST. Base: `aa517e8874573d345899bf8d4b7b08bb5e2f7245`.
Status: IMPLEMENTED / LOCAL QA PASSED / NOT DEPLOYED.

## Actual incident and official contract

[PR #262 evidence](https://github.com/kvolleylab/kvolleylab/pull/262#issuecomment-6873914516)
records game023:001:MALE:25. Wins advanced0–1/1–1/1–2/1–3 while liveSets
contained only28–30. Natural15:52/16:12/16:32 KST publishers succeeded20 minutes
apart; the last published all four final sets at16:34:37. Final publication is
not in-play completeness. Older artifacts lack raw point fields, so individual
omission decisions cannot be reconstructed exactly. #325 preserves verified
points and tolerates a delayed end marker; it does not obtain missing points.

The public KOVO app `https://kovo.co.kr/assets/index-CjC1zYBc.js` exposes
`/stat/real-time`, used by its `/textBroadCast` page. `payload.game` contains
homeSetPoint/awaySetPoint, setIng, homeS1Point through homeS5Point and their away
counterparts. The request takes season, round, gnum, gcode, hcode and acode.
Anonymous reads were verified on11/14. At16:40 KST game26 returned1–0, first
set26–24 and ongoing second set4–7. At16:49 schedule still supplied only26–24
while broadcast supplied second set14–10. Ongoing rally points are NOT certified
as completed sets. A size=1 request returned the complete men's game25 object
with all four final sets and only one feed row, verifying the bounded query.
The statistical detail `/stat/game-schedule/26` at16:39 still had0–0 counters
and first-set points, so that route was not selected as the live supplement.

## Behavior

- Schedule remains authoritative for identity, wins, final state, MASTER results
  and standings. Only today's regular-season live games with missing completed
  points receive a broadcast lookup (at most4 per collection, page0/size1).
- Match season, game number, round, home/away codes, date and start time exactly.
  Check integer counters/set number, gaps, terminal/deuce/fifth-set rules and
  winners against BOTH sources. Reject conflicts with confirmed schedule points
  and broadcast counters behind schedule. An ahead broadcast may provide only
  the schedule-confirmed prefix. Never promote wins or infer a final marker.
- Supplemental failure/mismatch leaves the valid schedule publisher running.
  Preserve older verified points with their original timestamps/source URL.
  New accepted points carry liveSets[].sourceUrl and publication attribution.
- Both check/publish artifacts retain source-observations.json: bounded numeric
  match fields, source URLs, end marker, time, selected-prefix count and fixed
  decision codes. No raw MASTER/HTTP bodies, credentials, players, lineups or
  feeds. Evidence survives later gate failures; report summaries show counts.
- Postseason broadcast contracts are unverified: existing postseason collection
  is unchanged. No Worker, cron, credentials or approval-variable change.

## Verification

364 regressions:207 V-League Python,45 lifecycle,9 current-value workflow,
4 job-isolation,99 Node. New cases cover second/third/fifth sets, women, identity
mismatch, conflict/invalid points, ahead/behind counters, source outages,
provisional three-set wins, lookup bounds, attribution, retention timestamps,
candidate export and failure-time evidence. No synthetic case is live proof.

Read-only actual collection at16:46:25 KST covered252 matches. Independent
경기일정_MASTER A1:S253 FORMULA read: candidate READY, MASTER changed cells0,
production_written=false, master_written=false; quality/public-export gates
passed. Six DOM tests against that actual candidate passed. At that time the
women's second set was still underway; correctly no unfinished set was added.
DOM tests do not establish real1440/390/360 browser acceptance.

## Release and limitations

Repair requested, new production approval still required. After merge/Pages,
compare artifacts, actual MASTER write/readback, public JSON, score Pages and
real home/overview/schedule across two natural in-play observations. About20
minutes is accepted; the30-minute stale rule stays. Worker external monitoring,
Cloudflare failure notifications and email/push receipt remain unverified.

Rollback through a reviewed approved revert; no manual invented scores. No
forced dispatch, direct MASTER write, protected player/roster/ID/Cup/international
change or new code deployment was performed for this repair.

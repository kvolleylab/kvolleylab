# V-League publisher recovery — 2026-11-18

Status: IMPLEMENTED / LOCAL QA PASSED / PR CI PENDING / NOT DEPLOYED.
Base: `fa485c6eece793654a34579cee00aceccba4c0d5`.
Branch: `fix/vleague-publisher-recovery-20261118`.

## Proven incident

On 2026-11-17 the official-notices roster publisher updated current registrations.
The recurring match publisher still tested historical participant roster counts
and fixed totals (men131/women121), rather than the current roster module.
The first persistent failure was [44055728114](https://github.com/kvolleylab/kvolleylab/actions/runs/44055728114),
18:27:22 KST, check job133944574586, `Preserve existing V-League page behavior`.
The real log reports six assertion failures: men22!=19 and women19!=17 across
selection/desktop/mobile/print tests. All18 runs through
[44108803184](https://github.com/kvolleylab/kvolleylab/actions/runs/44108803184)
at23:57:26 failed that step; official collection and publish were skipped.
Failed preview artifacts14315497433/14340300510 contain only the Pages configuration
check, not score observations. They are not evidence of a failed KOVO request.

Last success [44052643315](https://github.com/kvolleylab/kvolleylab/actions/runs/44052643315)
started18:07:22; artifact14313928004 observed18:08:52, MASTER readback=true,
changed_cells=0, no data write, public verification18:09:13 at5cf437e8.
Both19:00 games were still scheduled then.

The09:17 run43986411375 separately stopped on MAIN_HEAD_CHANGED and recovered
at12:02 run44007291804. This is not the cause of the evening outage.

## Repair and preserved contracts

- Compare actual rendered roster identities/counts/links/known nationality flags
  and print output against the approved current roster module. Unknown nationality
  remains unknown; unlinked registrations must not acquire a fabricated profile.
- Exercise registration additions/removals in isolated in-memory UI tests.
- Show actual loaded roster size in the team card and the known season-notice
  count label. Do not mutate the source roster or historical metadata.
- Bump the engine renderer cache key.
- Do not remove/skip tests, weaken score validation, change the workflow approval
  gate, or use continue-on-error. Player identity CI remains separate and strict.
- No MASTER/roster/match ID/score/standings/international/Cup data changes.
  No Worker/cron/token/auth changes, dispatch, merge or deployment.

Affected surfaces: shared club roster count display, V-League roster UI tests,
engine script URL. The score parser, source supplementation, match status,
30-minute stale behavior and publication write/readback guards are unchanged.

## Verification

- Python source/standings/MASTER/ops207 + lifecycle45 + player workflow9 +
  job-isolation4 =265 passed.
- Actual recurring Node gate101 passed (previous99 included six failures;
  added two registration-change tests). No skip.
- Actual official candidate DOM6 passed at1180/390/360 logical widths. These are
  DOM tests, not browser pixel/viewport evidence and not live-match acceptance.
- Anonymous official full-season collection at01:23:42 KST11/18:252matches,
  each division15final matches, official standings reconciliation and public
  export checks PASS.
- Independent Google MASTER FORMULA read, then second fresh official collection
  at01:26:20: READY, MASTER checked,8 changed cells planned (M:P rows30/31),
  master_written=false, production_written=false. This is a read-only plan, not
  proof of an actual write/readback. Full MASTER snapshot remains private.

| 11/17 match | Official/candidate set wins | Verified completed-set points | Current MASTER/public JSON |
|---|---|---|---|
| Men KEP–OKF / VL2627-M-015 /29 |3–2|21–25,25–18,25–21,23–25,18–16|scheduled, no scores|
| Women IBK–RSP / VL2627-W-015 /30 |1–3|25–21,23–25,25–27,16–25|scheduled, no scores|

The women’s fifth set was not played and is not invented. Both current official
fixtures for11/18 are19:00KST: Samsung–Woori31 and SOOP–Hyundai32.

Actual public browser1363×936: both11/17 schedule rows show dash, `갱신 지연`,
`최종 관측 없음`; home and overview still show11/15 as latest completed results.
The current tool has no viewport resize API, so actual1440/390/360 remains NOT
VERIFIED. No candidate UI browser deployment has occurred.

## Scheduler and notification evidence

About20-minute workflow_dispatch creation continued (17dispatches plus one native
schedule in the18-failure interval). This does not mean successful observations.
The existing issue244 was updated18:28:37; Worker issue257 comment6944175415 at
18:32 reported the failure. Latest notify job returned FAILURE_UNCHANGED; no
repeat alert was needed. GET /health403 is ACCESS UNAVAILABLE, not proof of a
Worker outage. Email/push receipt and external Worker failure monitoring remain
NOT VERIFIED. Overnight out-of-window non-execution is expected.

## Release gate and remaining work

The owner must approve this new PR before production merge/deployment under
AGENTS.md. After approval: merge exact reviewed head, verify code Pages, then
observe the next permitted natural publisher. Check Google authentication,
8-cell automatic write/readback, data commit, score Pages and exact public JSON
separately; do not substitute code Pages success for score publication success.

During the next actual games, verify at least two consecutive approximate20-minute
observations end-to-end, including0–1/0–2, all completed sets and partial fifth-set
exclusion. Keep30-minute stale indication and notification checks. This repair
is not evidence of two consecutive live updates.

Known separate risk: official standings disagreement can still block publication
(the11/15 KEX played mismatch); this patch does not weaken that safety policy or
claim it resolved. Existing player identity CI findings are also separate and
must remain visible. Rollback: revert this PR; never roll back protected data or
replace official scores manually to make a test pass.

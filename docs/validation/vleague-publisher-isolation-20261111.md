# V-League match publisher isolation — 2026-11-11

Status: IMPLEMENTED / LOCAL MATCH CHECKS PASSED / NOT DEPLOYED.
Base: `99d4fc29ffe50b37c09e95ed6c05eb97efce847f`.
Related: #257, #259, #262, #282, #286.

## Observed failure

After #286 connected 252 professional players, the shared publisher check failed
before official collection. Actual runs 42876714975 (03:35 KST) and 43027769964
(22:17 KST) failed the same three roster tests. Collection and publish were skipped.
Cloudflare still created dispatch runs. The public feeds retained 11/10 23:19 data.

The old tests expected 55 linked players and did not read the new professional
MASTER. This was not merely a stale assertion: IDs KVL-P-001620 through
KVL-P-001645 collide with different people in the national identity source.
An exhaustive source comparison also exposes a pre-existing KVL-P-000009
disagreement. None of these IDs or data records is changed in this repair.

## Change and safety boundary

- Split existing roster UI tests from player data/identity tests. All 16 existing
  roster UI tests remain in the recurring match check.
- Match source, standings, match-ID, lifecycle, MASTER readback, public-export,
  exact-output and Pages verification gates remain required.
- Player CI continues to run strict identity tests and now reacts to changes in
  every referenced MASTER. Cup CI retains both the identity and UI suites.
- Player tests recognize the approved 252-player pro MASTER, preserve unknown
  birth dates, and explicitly reject conflicting identities across sources.
  Three data tests pass; the cross-source conflict test correctly fails.
- Add an identity check before Google authentication in an activated player pilot.
  No `continue-on-error`, credential change, approval bypass or player-ID reassignment.
- Match publication only writes its existing three allowlisted generated paths;
  preservation tests now also cover both rosters, pro MASTER, national identity
  links, an international competition and Cup data.

This PR restores the ability to publish verified match results independently.
It does **not** repair or authorize migration of conflicting player identities.
A reviewed migration must account for existing national histories, roster links,
bookmarks and private notes before any affected ID changes.

## Validation

- Python source/MASTER/update/publication: 183 passed.
- Lifecycle: 45 passed; existing manual-mode guards: 9 passed.
- New workflow isolation guards: 4 passed (player conflicts cannot authorize player
  writes, match check failure still blocks publishing, PRs cannot publish).
- Exact recurring Node match/UI suite: 96 passed.
- Actual official source preview: 252 matches, both divisions reconciled with
  official standings. No production or MASTER write.
- Read-only official observation at 22:48:48 KST plus the actual Google MASTER
  A1:S600 snapshot passed the existing update planner (`READY`), quality audit and
  public-export gate. The proposed nine cells belong only to M010/W010 final
  status and scores plus W020's official start-time correction. No write/readback
  or production deployment is claimed. The initial connector `FORMATTED_VALUE`
  export represented numeric scores as strings and was rejected; rereading with
  the publisher's `FORMULA` mode passed without changing validation or sheet cells.
- Actual candidate DOM suite: 6 passed (simulated 1180/390/360 DOM, **not** actual
  browser screenshots and **not** live-match acceptance evidence).
- Current official finals: WRC–KAL 3–2 (18–25,25–22,25–16,22–25,15–12);
  HHC–GSC 0–3 (27–29,16–25,17–25).
- The same source also corrects W020's scheduled time from 16:00 to 14:00; this is
  generated preview data only, not a manually edited result or identity.
- Strict player identity check remains failed on 27 existing conflicts;
  do not describe all repository CI as green.

## Release and completion gate

User requested repair, while the existing no-new-code-deployment-without-approval
instruction remains the release gate. Submit the concrete PR for approval; do not
force dispatch or write MASTER from the verification session. This repair needs
GitHub workflow/test deployment only, not another Cloudflare Worker deployment.

After approved merge, observe the next natural scheduler execution: official API →
MASTER write/readback → generated commit → Pages → public JSON and actual screens.
One recovered final-result publication is insufficient. Two consecutive actual
in-game updates and PC1440/mobile390/360 remain required for full recovery.
The observed roughly 20-minute dispatch intervals need separate timing review;
the 15-minute continuity requirement is not passed by this change.

Rollback: revert this repair commit. It changes workflow/tests/documentation only;
rollback does not rewrite match results or player data.

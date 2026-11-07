# V-League wake-up and watchdog v1

Status: implemented and locally tested; **not deployed or activated**. Production activation requires the owner's approval and access to the existing Cloudflare account. No account ID, token, cron or billing change is included here.

## Responsibilities

Every five minutes in the approved season window, inspect the existing main-branch publisher and the two public JSON feeds. If no publisher is running and at least 15 minutes have passed since the last publisher/dispatch intent, dispatch `vleague-auto-update-v1.yml` with `publish=true, match_only=true`. The worker never receives Google credentials, writes MASTER, calculates results, or commits site data.

The existing `KVL_VLEAGUE_UPDATE_APPROVED` repository variable, lifecycle gate, exact MASTER connection, publication gate, readback, restricted generated-path commit and Pages checks remain authoritative. Native cron remains enabled as another trigger. GitHub's existing main-ref concurrency group serializes both trigger sources. A Durable Object lease prevents worker overlap and durable dispatch intent suppresses retries after ambiguous HTTP responses. An in-flight/stuck publisher is never cancelled by this worker.

Detect a >=30 minute publisher-creation gap during the noon-midnight window, failed/stuck publishers, unavailable public feeds, and >=30 minute stale observations for started matches. Notify Issue #257 once on incident onset and once on recovery, with readback deduplication after timeouts. Watching/subscribing to that issue controls the operator's GitHub delivery preferences; email/push receipt is not verified by this program. GET `/health` exposes only a timestamp, status, public match IDs and reason codes; it cannot trigger writes. Cron/worker failure itself must be monitored with Cloudflare's failure alerts or an external availability monitor (not configured in this PR).

## Activation after approval

1. Merge the reviewed application PR and verify its Pages deployment before enabling dispatches. Confirm `KVL_VLEAGUE_UPDATE_APPROVED=true` remains the owner's intended setting.
2. Select the existing Cloudflare account; check Workers/Durable Objects availability and any billing consequence before provisioning. This was not verified in the current session.
3. Use Wrangler **4.158.0** (the version used for the successful `deploy --dry-run`) or a separately reviewed version. Configure the existing account via the operator's secure CLI session. Never put tokens in source, chat, screenshots or public Actions logs.
4. Create/reuse a narrowly scoped, expiring GitHub credential restricted to `kvolleylab/kvolleylab`: Actions read/write, Issues read/write and metadata read. No Google credential, Contents write or organization-wide scope is needed in Cloudflare. Store it with `wrangler secret put GITHUB_TOKEN --config infra/vleague-scheduler/wrangler.jsonc` through secure input.
5. Deploy the worker first with both approval flags false and no cron. The config checked into this PR is inert by default. Confirm GET `/health` and the Durable Object binding.
6. After the owner approves activation, explicitly deploy `wrangler.active.jsonc`. It contains both flags set to string `true` and UTC cron `2,7,12,17,22,27,32,37,42,47,52,57 0,3-14 * * *`, with the same worker name and durable storage as the inert config. Use `CLOUDFLARE_SEND_METRICS=false npx wrangler@4.158.0 deploy --config infra/vleague-scheduler/wrangler.active.jsonc`. Committing this file alone does not deploy or activate anything. Runtime bounds allow 12:00–23:59 KST plus the 09:17–09:21 daily reconciliation window, from 2026-10-31 through 2027-04-29 inclusive. The 00:17 UTC tick covers daily reconciliation. End is exactly 2027-04-30 00:00 KST, matching the existing manifest; it does not auto-extend seasons.
7. Observe a real scheduled worker invocation, workflow dispatch, completed publisher, fresh public JSON and a controlled alert/recovery readback. Do not call a dry-run or successful HTTP 204 proof of live publication.
8. Complete the two actual match-time cycles in the validation report. GitHub scheduling/runner availability and KOVO responses can still delay publication; this worker removes dependence on native cron alone, not every upstream outage.

## Rollback

Deploy `infra/vleague-scheduler/wrangler.jsonc` (both approval flags false, empty cron list); revoke only the dedicated GitHub credential if necessary. Native GitHub cron remains unchanged. Application rollback is a reviewed revert of this PR's code; do not reset main or roll back unrelated match/player data. If a bad official observation is suspected, stop publishing with the existing approval gate and use the existing manual correction policy.

## Tests

`node --test tests/vleague-scheduler.test.mjs`

Wrangler dry-run builds the actual worker, checks bindings and uploads nothing:

`CLOUDFLARE_SEND_METRICS=false npx wrangler@4.158.0 deploy --config infra/vleague-scheduler/wrangler.jsonc --dry-run`

Mock-based unit tests cover approvals, end-of-season cutoff, running/native-run suppression, dispatch ambiguity, missing schedules, public stale scores, alert/recovery deduplication, credential destination, a read-only health route and the durable lease. They do not certify Cloudflare account access or actual cron delivery.

The active config can also be built safely with the same command using `wrangler.active.jsonc` and **`--dry-run`**. Record the actual deployed version, Cron Trigger, first scheduled invocation, first dispatched publisher, Pages run and health timestamp after activation. Do not infer activation from local configuration or a build.

For started fixtures with no live observation, the watchdog measures 30 minutes from the scheduled start. `updatedAt` is metadata and cannot reset this deadline. See [2026-11-07 repair evidence](../../docs/validation/vleague-missing-observation-v2.md).

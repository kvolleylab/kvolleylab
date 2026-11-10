# Worker request compatibility repair — 2026-11-10

Status: IMPLEMENTED / LOCAL RUNTIME VERIFIED / NOT DEPLOYED / LIVE RECOVERY NOT VERIFIED.
Base: 94ac61dbdb6f03f371ea6d684518e1a6d750e262.

## Cause and boundary
The deployed requestJSON sends `redirect:'error'` to every fetch. Cloudflare Workers
rejects this mode before any network request. The first GitHub runs request therefore
cannot reach authentication or workflow dispatch. Node fetch/mocked tests accepted the
option, and Wrangler dry-run only bundled the code; neither exercised this runtime path.
Cloudflare documentation: https://developers.cloudflare.com/workers/runtime-apis/request/

Wrangler4.158.0's local workerd reproduced the exact Request construction error:
`Invalid redirect value, must be one of "follow" or "manual"`.
With the production scheduler and dummy responses, original mode made 0 requests;
fixed mode completed 4 mocked calls including dispatch. This is runtime compatibility
proof, not evidence of production credentials, real dispatch or two live publications.
Authenticated Cloudflare account logs remain unavailable (browser is at login).

## Repair
- Use manual redirect mode and reject non-2xx responses. Never follow Location or
  send credentials to a redirect destination.
- Persist/log only bounded stage/reason/HTTP status on fatal failure. Do not log raw
  exceptions, response bodies, URLs, headers or secrets. Existing read-only /health,
  approvals, season bounds, durable dispatch intent and concurrency stay unchanged.
- Keep MASTER, match/player identities, rosters, standings and other competitions unchanged.

## Validation
- node --test tests/vleague-scheduler.test.mjs: 14 passed.
- scripts/validation/vleague-worker-runtime.mjs: original-mode negative control and
  fixed-mode request construction/dispatch path passed in local workerd.
- Wrangler4.158.0 deploy --config infra/vleague-scheduler/wrangler.active.jsonc --dry-run:
  successful bundle and bindings, no upload.
- git diff --check: passed.

Run the local runtime check with:
```sh
npm install --prefix /tmp/kvl-worker-runtime --no-audit --no-fund wrangler@4.158.0
KVL_MINIFLARE_MODULE=/tmp/kvl-worker-runtime/node_modules/miniflare/dist/src/index.js node scripts/validation/vleague-worker-runtime.mjs
```
No live credentials are used by this check.

## Release and acceptance
After reviewed release approval, use the existing authenticated operator PC/account,
checkout the reviewed commit and deploy the active config (not the inert default):
```powershell
$env:CLOUDFLARE_ACCOUNT_ID = '2ef381596357806c1c9b00931354d31'
npx.cmd --yes wrangler@4.158.0 deploy --config .\infra\vleague-scheduler\wrangler.active.jsonc
```
Reuse the existing Worker secret; do not paste it into chat or source, and do not rotate
credentials merely because this runtime error occurred. Inspect read-only /health after
the next scheduled tick. If a separate HTTP401/403 appears, diagnose credential access
without broadening permissions automatically. No force dispatch is required.
Verify actual workflow_dispatch, publisher log, MASTER readback, public JSON, Pages and
1440/390/360 screens for two consecutive real live observations before marking recovered.
The local compatibility repair does not meet this live acceptance gate.

Rollback uses the existing inert config only if the operator chooses to stop the faulty
supplementary scheduler. Preserve native cron and all match/player data. External failure
monitoring, Cloudflare alerts and GitHub notification receipt remain unverified.

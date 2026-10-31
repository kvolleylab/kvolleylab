# KVL gold volleyball favicon v1

Date: 2026-11-01 (Asia/Seoul)
Status: DEPLOYED / LIVE VERIFIED
Base commit: `444eff62474089029c6b5aacfae191d321585364`
Branch: `feature/kvl-gold-favicon-20261101`

## Purpose and source

The user identified the volleyball-shaped KVL mark already at the top of the site's menu as the preferred browser-tab icon. Reuse that exact image rather than adding literal KVL text or generating a new logo.

Source: `assets/images/brand/kvl-ball-international-gold.webp`
Source blob: `7d321f9806cb0aad7ea97b836c89f4d45d949f7d`
Source SHA-256: `43fd63707e2323724f1b702294069541bc0b42166ec371ac3d9208017ca8d857`
Menu wiring: `assets/css/school-logo-runtime.css`, `.kvl-global-mark`.
Original dimensions: 192 x 192, transparent exterior.
Verified source appearance: gold lines and a dark navy ball. The user described gold/white, but the specifically identified existing menu asset is gold/navy. This candidate preserves the exact source colors; it does not claim to be a white recoloring.
Standards checked: AGENTS.md, PROJECT_RULES.md, DEVELOPMENT_WORKFLOW_v1.md, DESIGN_SYSTEM.md, KVL_DECISION_LOG.md, current menu source, and Google Drive KVL_운영원칙_MASTER_v16.

## Changes and scope

- Add root `favicon.ico` with RGBA 16, 32, 48 and 64 px frames. Original proportions and colors remain unchanged. The root location also supports browsers' default favicon lookup.
- Add one static icon link to `index.html`.
- Add a seven-line, idempotent icon-link block to `assets/js/unified-nav.js`. Existing `rel~="icon"` links are respected.
- Use `/favicon.ico?v=kvl-gold-v1` for explicit links.
- Add the self-contained review mockup `KVL_favicon_preview_v1.html`. It labels both 16 px light/dark tab examples as a preview, not a live browser screenshot.
- No source logo, menu geometry, page title, match/player data, routing, search or competition presentation logic is changed.

## Verification

PASS: original WebP decoded as 192 x 192 RGBA; direct PNG conversion matched the source pixel-for-pixel during review.
PASS: ICO directory contains exactly 16, 32, 48 and 64 px frames with transparency.
PASS: each added icon resource is derived from the existing source; no generative processing or recoloring.
PASS: removing the one added home link restores the original homepage byte-for-byte.
PASS: removing the seven-line icon block restores the original shared script byte-for-byte.
PASS: `node --check assets/js/unified-nav.js`.
PASS: independent review found no material regression risk and confirmed no duplicate icon link on home.
Initial prototype check (superseded by CI and cloud verification below): native Chromium rendering and physical desktop/mobile browser inspection were not run. The local browser binary is absent; the official Playwright installer returned an invalid/truncated archive. Do not label the HTML mockup as browser-tested.
Initial prototype check (superseded below): production merge, Pages deployment and live icon request verification had not run.

## Release and recovery

The user explicitly approved production deployment of PR #214 with “승인한다” on 2026-11-01 (Asia/Seoul), after the exact existing gold/navy menu mark and scoped change were presented. This supersedes the prototype's approval-pending state. Release authorization is limited to this favicon change.
Before merging, verify the current main head and the scoped diff; merge through PR, confirm Pages completion and `/favicon.ico?v=kvl-gold-v1` responds with a valid ICO, and check home plus one interior page in the real browser. Browsers may retain the previous icon or common script until their cache refreshes.
Recovery: revert this favicon commit only, preserving newer unrelated changes. No data rollback is necessary.

Preview: [KVL_favicon_preview_v1.html](KVL_favicon_preview_v1.html).

## Approved release handoff — 2026-11-01

- User release approval: “승인한다”, referring to the reviewed favicon and PR #214.
- Main rechecked at `444eff62474089029c6b5aacfae191d321585364`; candidate runtime code remains `0b0d9d687c3d1710307ed064a86a3eb9aa9e6876`.
- Independent review reconfirmed the six-file scope and no material regression issue. Three failing player-registration/batch workflows were reproduced in the previous V-League baseline and are unrelated to this favicon.
- A working cloud Chrome browser was opened for release verification. Baseline home title, one sidebar, search field, and no horizontal overflow at 1363 px were verified; baseline has no icon link. The earlier local Chromium installation limitation does not prevent live-browser checks now.
- Follow the [release PR #214](https://github.com/kvolleylab/kvolleylab/pull/214) for exact final code/merge SHA, Quality Audit and Pages runs, live ICO byte verification, and post-deployment browser results. Do not infer deployment from this authorization record alone.

## Candidate CI browser verification

[Quality Audit run 41215871832](https://github.com/kvolleylab/kvolleylab/actions/runs/41215871832), code head `0b0d9d687c3d1710307ed064a86a3eb9aa9e6876`: success. Chromium 141.0.7390.37 / Playwright 1.56.1 executed the candidate code. Artifact report contains 72 rendered UI cases plus the runner check, all PASS; no UI findings. Coverage: KOVO Cup men/women and V-League men/women, six views, at 1180/390/360 px. The overall audit gate passed; three existing non-UI findings and the separately identified legacy registration workflow failures were not caused by this change. Home/favicon-specific checks remain in the cloud-browser post-deployment verification. This approval commit only changes documentation.

## Production verification — completed 2026-11-01 KST

- PR #214 merged as `0f5dc8d06b3e8139e7809f31eba97e34e36314b0` after the explicit user approval. [Pages run 41216436496](https://github.com/kvolleylab/kvolleylab/actions/runs/41216436496) completed successfully (build, report-build-status, deploy).
- Public HTTPS reads of `/favicon.ico?v=kvl-gold-v1`, `/`, and the home version of `assets/js/unified-nav.js` all returned 200. All three matched the validated candidate bytes exactly. ICO MIME: `image/vnd.microsoft.icon`; 17,235 bytes; SHA-256 `0795d4f28f7027fde4c40319ee15118131af84b1dded805db651fa91897bfcad`.
- Cloud Chrome home reload: one expected icon link, one sidebar, existing title and search field, no horizontal overflow at 1363 px.
- Actual navigation from home to `players.html`: one identical icon link, existing title, one sidebar and no horizontal overflow.
- Opening the public ICO URL in Chrome produced a complete 64 x 64 image. [Saved screenshot](kvl_favicon_live_0f5dc8d_v1.jpg) depicts the actual deployed icon resource, not browser tab chrome.
- 72 candidate PC/mobile UI cases passed before release. The follow-up approval commit changed documentation only.
- Existing push failures in VNL schedule connection and player timeline workflows also occurred at prior main; their files were unchanged. They did not prevent the Pages deployment and were not modified in this scope.
- User-browser cache behavior cannot be inspected from this remote browser. Reopening an old tab or a hard refresh may be necessary if it still shows a previously cached icon.

[Machine-readable release evidence](kvl_favicon_release_v1.json). This snapshot is archived in a verification branch; the deployed runtime remains the merge SHA above.

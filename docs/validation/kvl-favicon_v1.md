# KVL gold volleyball favicon v1

Date: 2026-11-01 (Asia/Seoul)
Status: PROTOTYPE / ASSET VERIFIED / NOT DEPLOYED
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
NOT RUN: native Chromium rendering and physical desktop/mobile browser inspection. The local browser binary is absent; the official Playwright installer returned an invalid/truncated archive. Do not label the HTML mockup as browser-tested.
NOT RUN: production merge, Pages deployment and live icon request verification.

## Release and recovery

Production approval has not been given for this favicon. The user's design preference does not by itself authorize deploying the change under AGENTS.md.
After release authorization, verify the current main head and the scoped diff; merge through PR, confirm Pages completion and `/favicon.ico?v=kvl-gold-v1` responds with a valid ICO, and check home plus one interior page in the real browser. Browsers may retain the previous icon or common script until their cache refreshes.
Recovery: revert this favicon commit only, preserving newer unrelated changes. No data rollback is necessary.

Preview: [KVL_favicon_preview_v1.html](KVL_favicon_preview_v1.html).

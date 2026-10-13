# KVL Competition Hero: repeatable image publishing

## Why image publishing stalled (2026-10-13)
Generated WebP files existed inside the ChatGPT runtime, but the GitHub connector's `create_blob` accepts a base64 **string**, not a local `/mnt/data` file path or a downloaded ZIP reference. The repository config continued pointing at older SVG files. CSS changes would not fix this. A working GitHub connector is **not** equivalent to a working binary-file transfer.

## Verified deployment contract
- Use KVL main and inspect latest commit before touching files.
- Use a **single finished WebP file for each Hero**, not CSS-assembled fragments.
- KOVO Cup: men BLACK / GOLD, women ROSE.
- PC 2108×406; mobile 1258×406. Preserve subject scale in the asset itself.
- Keep the left title area readable with effects baked into the image; not blank.
- Do not modify global CSS or existing production AVC/VNL pages.
- Stage all four image files and **both configs together**. Never point config to nonexistent assets.
- `hero.pcImage`, `hero.mobileImage`, `hero.mimeType=image/webp`; bump asset version query for cache.
- Preview both `?competition=kovo-cup-men-2026` and `?competition=kovo-cup-women-2026` at 1180px desktop, 390px and 360px mobile.
- Verify image URL returns actual WebP and dimensions. Inspect clipping and text visibility.
- Never report 'deployed' until the pushed commit and live URLs are confirmed.

## One-command publishing from a GitHub-authenticated local clone
```bash
python -m pip install Pillow
python scripts/publish-competition-hero.py /path/to/kovo_cup_hero_final_v02.zip --push
```
This script validates exact four filenames and pixels, requires clean/up-to-date main, copies WebPs to `assets/img/competition-hero/`, updates both competition configs, commits files atomically, and pushes if requested.

If editing from a ChatGPT session, first determine whether a **real binary bridge** is available. The GitHub connector supports base64 `create_blob` + `create_tree` + `create_commit` + `update_ref`, but *only* when base64 bytes can actually be passed into the connector. Do not claim support based on API discovery alone. Otherwise use this local-clone script. Do not fall back to SVG placeholders, fake path-only commits, or CSS patches.

### Verification links
- https://kvolleylab.com/competition-engine.html?competition=kovo-cup-men-2026
- https://kvolleylab.com/competition-engine.html?competition=kovo-cup-women-2026

## 2026-10-13 live failure diagnosis and verified recovery

- The real four-file v02 ZIP exists in the ChatGPT container, with non-empty WebP assets (men PC 144628 bytes, men mobile 103052 bytes, women PC 114942 bytes, women mobile 85100 bytes).
- Git connectivity from that container was tested using `git ls-remote https://github.com/kvolleylab/kvolleylab.git HEAD`, which failed with `Could not resolve host: github.com` (DNS/network egress issue, **not** a GitHub token permission problem).
- The connected GitHub API can write UTF-8 files and supports `create_blob` base64, but its input does not accept the runtime's local file path or connector file URI. The two sandboxes cannot currently pass hundreds of kilobytes of image bytes directly. Being able to create a Git blob is not proof an image has reached GitHub.
- Therefore never switch the image path until all four destination WebPs are visible at GitHub and downloadable. Never use placeholder SVG, reuse earlier artwork, or claim deployment to paper over the bridge problem.

### Recovery path A: authorized local Git checkout (preferred)
1. Download the full v02 ZIP from the ChatGPT conversation to the device with a working GitHub-authenticated clone.
2. From the repository root run `python -m pip install Pillow` and `python scripts/publish-competition-hero.py /absolute/path/kovo_cup_hero_final_v02.zip --push`.
3. Verify GitHub `main` commit, four `assets/img/competition-hero/*v02.webp` URLs (HTTP 200, correct file contents), both `data/competitions/kovo-cup-*/config.json` references, then browser desktop/mobile Hero screenshots.

### Recovery path B: GitHub web UI file upload
Upload the four extracted files to `assets/img/competition-hero/` through GitHub web UI, commit them, then update both competition config files to v02 `image/webp` URLs with a new cache query. Validate desktop/mobile. If an isolated GitHub upload is used, do not change config until all four assets exist.

### Operational definition of done
Only count COMPLETE when (1) all four v02 WebPs are on GitHub main, (2) both config files point to them, (3) actual image responses and visible PC/mobile pages are verified, and (4) no CSS adjustments or protected production dependencies were changed. Until then report ASSET READY / DEPLOY PENDING.

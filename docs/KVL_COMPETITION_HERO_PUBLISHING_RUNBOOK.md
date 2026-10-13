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

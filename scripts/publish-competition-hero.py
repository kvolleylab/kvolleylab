#!/usr/bin/env python3
"""Validate/copy finished Hero bytes and prepare an atomic six-file publication.

Default: validate and prepare files; no remote mutation. Use the companion
publish-competition-hero.mcp.js in WORK for authenticated GitHub publication.
The optional --push path requires independently configured local Git credentials.
"""
import argparse
import hashlib
import io
import json
import re
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIZES = {"pc": (2108, 406), "mobile": (1258, 406)}


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def describe(path):
    content = path.read_bytes()
    return {
        "path": path.relative_to(ROOT).as_posix(), "localPath": str(path),
        "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest(),
        "gitBlobSha": hashlib.sha1(f"blob {len(content)}\0".encode() + content).hexdigest(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--asset-key", default="kovo-cup-2026")
    parser.add_argument("--men-slug", default="kovo-cup-men-2026")
    parser.add_argument("--women-slug", default="kovo-cup-women-2026")
    parser.add_argument("--version", default="v02")
    parser.add_argument("--cache-version", default="20261013-kovo-hero-v02")
    parser.add_argument("--manifest", type=Path, required=True,
                        help="Scratch output consumed by the WORK publisher")
    parser.add_argument("--push", action="store_true",
                        help="Optional authenticated local Git commit/push")
    args = parser.parse_args()
    from PIL import Image

    for value in [args.asset_key, args.men_slug, args.women_slug, args.cache_version]:
        if not re.fullmatch(r"[a-z0-9-]+", value):
            raise SystemExit(f"Invalid identifier: {value}")
    if not re.fullmatch(r"v[0-9]+", args.version):
        raise SystemExit("Version must be v followed by digits")
    if args.men_slug == args.women_slug:
        raise SystemExit("Men/women targets must be distinct")
    if git("branch", "--show-current") != "main":
        raise SystemExit("Use an isolated checkout of current main")
    if args.push:
        if git("status", "--porcelain"):
            raise SystemExit("Local --push requires a clean working tree")
        git("fetch", "origin", "main")
        if git("rev-parse", "HEAD") != git("rev-parse", "origin/main"):
            raise SystemExit("Update main before publishing")

    planned = []
    targets = {"men": args.men_slug, "women": args.women_slug}
    expected_names = {
        f"kvl-hero-{args.asset_key}-{gender}-{device}-{args.version}.webp"
        for gender in targets for device in SIZES
    }
    with zipfile.ZipFile(args.archive) as archive:
        members = [i for i in archive.infolist() if not i.is_dir()]
        names = [Path(i.filename).name for i in members]
        if len(names) != 4 or set(names) != expected_names:
            raise SystemExit("ZIP must contain exactly the four expected unique WebP filenames")
        source = dict(zip(names, members))
        for gender, slug in targets.items():
            config_path = ROOT / f"data/competitions/{slug}/config.json"
            config = json.loads(config_path.read_text(encoding="utf-8"))
            if config.get("slug") != slug or config["competition"]["gender"] != gender:
                raise SystemExit(f"Config identity mismatch: {slug}")
            if config["competition"].get("competitionFamily") != "pro":
                raise SystemExit("This verified contain contract currently requires the PRO family")
            hero = config["hero"]
            for device, size in SIZES.items():
                name = f"kvl-hero-{args.asset_key}-{gender}-{device}-{args.version}.webp"
                if source[name].file_size > 20 * 1024 * 1024:
                    raise SystemExit(f"Unexpected image size: {name}")
                raw = archive.read(source[name])
                with Image.open(io.BytesIO(raw)) as im:
                    im.load()
                    if im.format != "WEBP" or im.size != size:
                        raise SystemExit(f"Invalid WebP/dimensions: {name}: {im.size}")
                    if "A" in im.getbands() and im.getextrema()[-1][0] < 255:
                        raise SystemExit(f"Hero must be opaque: {name}")
                dest = ROOT / "assets/img/competition-hero" / name
                if dest.exists() and dest.read_bytes() != raw:
                    raise SystemExit(f"Existing version has different bytes; bump version: {name}")
                planned.append((dest, raw))
                hero["pcImage" if device == "pc" else "mobileImage"] = (
                    f"/assets/img/competition-hero/{name}?v={args.cache_version}")
            for key in ["b64Chunks", "pcB64Chunks", "mobileB64Chunks"]:
                hero.pop(key, None)
            hero.update({"mimeType": "image/webp", "mode": "photo", "showImage": True,
                         "position": "right center", "mobilePosition": "right center",
                         "size": "contain", "mobileSize": "contain",
                         "assetNote": "Original complete WebP bytes: PC 2108x406 / mobile 1258x406. Shared PRO contain contract preserves the entire image without crop or stretch; existing overlay and geometry retained."})
            planned.append((config_path, (json.dumps(config, ensure_ascii=False, indent=2) + "\n").encode()))

    # Validate everything before writing any file. No CSS/JS/other competition edits.
    for path, content in planned:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    manifest = {"repository": "kvolleylab/kvolleylab", "branch": "main",
                "baseCommit": git("rev-parse", "HEAD"), "baseTree": git("rev-parse", "HEAD^{tree}"),
                "files": [describe(path) for path, _ in planned],
                "targets": targets, "version": args.version, "cacheVersion": args.cache_version}
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"manifest": str(args.manifest.resolve()), "baseCommit": manifest["baseCommit"],
                      "files": [{k: v for k, v in f.items() if k != "localPath"} for f in manifest["files"]]}, indent=2))
    if args.push:
        git("add", "--", *[f["path"] for f in manifest["files"]])
        if not git("diff", "--cached", "--name-only"):
            print("Already published; no commit created")
            return
        git("commit", "-m", f"Publish {args.asset_key} {args.version} complete Hero images")
        git("push", "origin", "main")
        print("PUSHED", git("rev-parse", "HEAD"))
    else:
        print("PREPARED only. Publish with the WORK companion; verify live HTTP and browser output.")


if __name__ == "__main__":
    main()

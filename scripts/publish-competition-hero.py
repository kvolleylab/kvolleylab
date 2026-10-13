#!/usr/bin/env python3
"""Publish finished KVL competition Hero images without CSS hacks.

Usage:
  python scripts/publish-competition-hero.py /path/to/kovo_cup_hero_final_v02.zip --push

Requires a local clone with GitHub push credentials and Pillow.
Does not change any CSS or other competitions.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/img/competition-hero"
TARGETS = {
    "men": "kovo-cup-men-2026",
    "women": "kovo-cup-women-2026",
}
SIZES = {"pc": (2108, 406), "mobile": (1258, 406)}

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path, help="ZIP with four complete WebP images")
    parser.add_argument("--push", action="store_true", help="Push the tested commit to origin/main")
    args = parser.parse_args()
    from PIL import Image

    if git("branch", "--show-current") != "main":
        raise SystemExit("ERROR: switch to main first")
    if git("status", "--porcelain"):
        raise SystemExit("ERROR: working tree is not clean")
    git("fetch", "origin", "main")
    if git("rev-parse", "HEAD") != git("rev-parse", "origin/main"):
        raise SystemExit("ERROR: main is not at latest origin/main")

    modified = []
    with zipfile.ZipFile(args.archive) as z:
        names = {Path(name).name: name for name in z.namelist() if not name.endswith("/")}
        for gender, slug in TARGETS.items():
            for device, expected in SIZES.items():
                filename = f"kvl-hero-kovo-cup-2026-{gender}-{device}-v02.webp"
                if filename not in names:
                    raise SystemExit(f"Missing ZIP member: {filename}")
                content = z.read(names[filename])
                with tempfile.NamedTemporaryFile(suffix=".webp") as fp:
                    fp.write(content)
                    fp.flush()
                    with Image.open(fp.name) as im:
                        if im.size != expected or im.format != "WEBP":
                            raise SystemExit(f"INVALID {filename}: {im.size}, {im.format}; need {expected} WEBP")
                dest = ASSETS / filename
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(content)
                modified.append(dest)
                print(f"ASSET {filename}: {expected[0]}x{expected[1]}, sha256={hashlib.sha256(content).hexdigest()}")

            config = ROOT / f"data/competitions/{slug}/config.json"
            data = json.loads(config.read_text(encoding="utf-8"))
            hero = data["hero"]
            for device, field in [("pc", "pcImage"), ("mobile", "mobileImage")]:
                filename = f"kvl-hero-kovo-cup-2026-{gender}-{device}-v02.webp"
                hero[field] = f"/assets/img/competition-hero/{filename}?v=20261013-kovo-hero-v02"
            hero["mimeType"] = "image/webp"
            hero["mode"] = "photo"
            hero["showImage"] = True
            hero["position"] = "right center"
            hero["mobilePosition"] = "right center"
            hero["assetNote"] = "Complete single-image PC 2108x406 / mobile 1258x406; no slug CSS crop or stretch."
            config.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            modified.append(config)

    for file in modified:
        git("add", str(file.relative_to(ROOT)))
    print(git("diff", "--cached", "--stat"))
    git("commit", "-m", "Connect KOVO Cup men/women v02 complete Hero WebP images")
    print("COMMIT:", git("rev-parse", "HEAD"))
    if args.push:
        subprocess.check_call(["git", "push", "origin", "main"], cwd=ROOT)
        print("PUSH OK. Verify image URLs and both page routes at PC/mobile widths.")
    else:
        print("Committed locally only. Use --push after review.")

if __name__ == "__main__":
    main()

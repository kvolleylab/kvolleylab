"""Build an isolated, source-faithful KVL Goseong layout preview.

Copies the actual maintained Engine V2 assets and the completed 2026 Goseong
men's competition record to a separate local web root. No production writes.

Usage:
  python scripts/build-goseong-local-engine-preview-v2.py /tmp/kvl-goseong-preview
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SLUG = "university-goseong-men-2026"
COMPETITIONS = (SLUG, "university-goseong-women-2026")
DIRS = (
    "assets/css",
    "assets/js",
    "assets/vendor",
    "assets/images/brand",
    "assets/images/universities",
    "assets/images/school-logos",
    "data/competitions/university-goseong-men-2026",
    "data/competitions/university-goseong-women-2026",
)
FILES = (
    "competition-engine.html",
    "admin-competition-layout-test.html",
    "prototypes/kvl-existing-competition-editor-v2.html",
    "prototypes/kvl-goseong-engine-compare-v1.html",
    "assets/js/kvl-goseong-layout-compare-v1.js",
    "data/master/school_logo_manifest_2026.json",
    "assets/images/competitions/university-goseong-men-2026-hero.webp",
    "assets/images/competitions/university-goseong-women-2026-hero.webp",
)
OPTIONAL = (
    "assets/favicon.ico",
    "assets/img/brand/kvl-logo.svg",
    "assets/img/home-hero/kvl-home-hero-pc-v01.webp",
)
HTML_ENTRY = "prototypes/kvl-goseong-engine-compare-v1.html"
BUILDER_VERSION = 2


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_external_destination(dst: Path) -> None:
    root = ROOT.resolve()
    dst = dst.resolve()
    if dst == root or dst in root.parents or root in dst.parents:
        raise ValueError("Preview directory must be outside the GitHub checkout")
    if dst.exists() and any(dst.iterdir()):
        raise ValueError("Preview destination must be new or empty (no overwrites)")


def build(dst: Path) -> dict:
    dst = dst.resolve()
    ensure_external_destination(dst)
    records: dict[str, dict] = {}

    def copy_one(rel: str, optional: bool = False) -> None:
        src = ROOT / rel
        if not src.is_file():
            if optional:
                return
            raise FileNotFoundError(str(src))
        if src.is_symlink():
            raise ValueError("Refusing symlink input: " + rel)
        target = dst / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)
        if digest(src) != digest(target):
            raise ValueError("Copy checksum mismatch: " + rel)
        records[rel] = {"sha256": digest(src), "bytes": src.stat().st_size}

    for folder in DIRS:
        directory = ROOT / folder
        if not directory.is_dir():
            raise FileNotFoundError(str(directory))
        for item in directory.rglob("*"):
            if item.is_symlink():
                raise ValueError("Refusing symlink: " + str(item))
            if item.is_file():
                copy_one(str(item.relative_to(ROOT)))

    for filename in FILES:
        copy_one(filename)
    for filename in OPTIONAL:
        copy_one(filename, optional=True)

    # Localhost cannot satisfy the canonical HTTPS check for production assets.
    # Keep the actual loader/render/shell/CSS/DOM bytes intact; only disable its
    # production-only canonical validator in this copied HTML wrapper.
    engine = dst / "competition-engine.html"
    original = engine.read_text(encoding="utf-8")
    if original.count("production:true") != 1:
        raise ValueError("The maintained Engine entrypoint changed: review before build")
    engine.write_text(
        original.replace("production:true", "production:false", 1),
        encoding="utf-8",
    )

    config = json.loads((dst / "data/competitions" / SLUG / "config.json").read_text(encoding="utf-8"))
    data = json.loads((dst / "data/competitions" / SLUG / "data.json").read_text(encoding="utf-8"))
    if config.get("slug") != SLUG or config["competition"]["gender"] != "men":
        raise ValueError("Wrong Goseong competition configuration")
    if data.get("status") != "completed":
        raise ValueError("Goseong source has not been marked completed")
    if (len(data.get("participants", [])), len(data.get("matches", [])),
        len(data.get("standings", {}).get("pools", []))) != (15, 35, 3):
        raise ValueError("Unexpected Goseong source counts; inspect updated MASTER")

    (dst / "index.html").write_text(
        '<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        '<meta name="robots" content="noindex,nofollow">'
        '<meta http-equiv="refresh" content="0;url=/' + HTML_ENTRY + '">'
        '<title>KVL 고성대회 로컬 비교</title></head><body>'
        '<a href="/' + HTML_ENTRY + '">격리 비교 실행</a></body></html>',
        encoding="utf-8",
    )

    receipt = {
        "schemaVersion": BUILDER_VERSION,
        "competition": SLUG,
        "mode": "isolated-local-preview",
        "recordCounts": {"teams": 15, "matches": 35, "pools": 3},
        "engineEntrypointPatch": "production:true -> production:false",
        "engineRenderingAssetsExactCopies": True,
        "sourcePaths": records,
        "excluded": [
            "Supabase credentials and private notes",
            "Google Drive MASTER writes",
            "GitHub production main deployment",
        ],
    }
    out = dst / "validation"
    out.mkdir(exist_ok=True)
    (out / "source-provenance.json").write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return {
        "path": str(dst),
        "files": len(records),
        "sourceData": receipt["recordCounts"],
        "start": "python -m http.server 8765 --bind 127.0.0.1 --directory " + str(dst),
        "url": "http://127.0.0.1:8765/",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("destination", type=Path, help="New empty directory outside repository")
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.destination), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError) as exc:
        sys.exit("Preview builder failed safely: " + str(exc))

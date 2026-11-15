#!/usr/bin/env python3
"""One-time reviewed 2026-27 KOVO draft bridge seed on an isolated PR branch.

Never writes original Player MASTER, KOVO source, historical roster, Google
Sheets or the operating branch. Requires the same 32/28 source-verified
results as the reviewed PR evidence. Existing seed is immutable; source
changes require a new explicitly reviewed reconciliation.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

from kvl_player_updates import public_security_scan
from kvl_vleague_draft_sync import OUT, generate

MANIFEST = "scripts/quality_audit/public-review-manifest.json"
EVIDENCE = "docs/validation/kovo-draft-roster-automation-20261114.md"

def canonical(root):
    projection = generate(root)
    if (projection.get("season") != "2026-27" or projection.get("registration_count") != 32
            or projection.get("profile_count") != 28
            or len(projection.get("review", {}).get("draft_blocked", [])) != 6):
        raise ValueError("DRAFT_SOURCE_COUNTS_CHANGED_REVIEW_REQUIRED")
    public_security_scan(projection)
    return projection, (json.dumps(projection, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

def source_entry(projection, sha):
    notice_ids = sorted({f"KVL-SRC-KOVO-NOTICE-{p['registration_notice_id']}"
                         for p in projection["registered"]})
    return {
        "access_level": "PUBLIC", "record_status": "VERIFIED",
        "source_ids": ["KOVO-2026-27-M-FINAL", "KOVO-2026-27-W-FINAL"] + notice_ids,
        "verified_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sha256": sha,
        "evidence": EVIDENCE,
        "review_note": (
            "KOVO 2026-27 공식 신인 지명 34건 중 해당 구단 등록 공시 본문 SHA·"
            "등록 이벤트·팀·등번호·중복·기존 ID 대조로 안전한 등록32·프로필28만 공개. "
            "신원 미확인 6건/일반 등록명·변동 후보27건은 자동 프로필 연결·MASTER 쓰기 금지. "
            "공시 게시일을 효력일 또는 경기 엔트리 날짜로 단정하지 않는다."
        ),
    }

def run(root, check=False):
    root = Path(root).resolve()
    projection, content = canonical(root)
    output_path, manifest_path = root / OUT, root / MANIFEST
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schema_version") != 1 or not isinstance(manifest.get("files"), dict):
        raise ValueError("PUBLIC_MANIFEST_SCHEMA_UNKNOWN")
    existing = manifest["files"].get(OUT)
    sha = hashlib.sha256(content).hexdigest()
    if existing and existing.get("sha256") != sha:
        raise ValueError("SEED_SOURCE_CHANGED_REVIEW_REQUIRED")
    if output_path.exists() and output_path.read_bytes() != content:
        raise ValueError("EXISTING_BRIDGE_SOURCE_CHANGED_REVIEW_REQUIRED")
    if check:
        if (not output_path.exists() or not existing or existing.get("sha256") != sha
                or existing.get("record_status") != "VERIFIED"
                or existing.get("access_level") != "PUBLIC"):
            raise ValueError("REVIEWED_BRIDGE_SEED_MISSING")
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(content)
        if not existing:
            manifest["files"][OUT] = source_entry(projection, sha)
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"status": "READ_ONLY_PASS" if check else "REVIEWED_SEED_READY",
            "sha256": sha, "registered": 32, "profiles": 28}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(args.root, check=args.check), ensure_ascii=False))

if __name__ == "__main__":
    main()

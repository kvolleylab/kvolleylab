#!/usr/bin/env python3
"""One-time verified 2026-27 academic-source export and manifest.

Only source-evidenced school names. Re-running with same bytes makes zero
changes. A different official document requires a reviewed new version.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

from kvl_draft_education_v1 import OUT, generate
from kvl_player_updates import public_security_scan

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "scripts/quality_audit/public-review-manifest.json"
EVIDENCE = "docs/validation/kovo-draft-roster-automation-20261114.md"


def run(root, check=False):
    root = Path(root).resolve()
    result = generate(root)
    public_security_scan(result)
    payload = (json.dumps(result, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()
    target = root / OUT
    manifest_path = root / MANIFEST
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schema_version") != 1 or not isinstance(manifest.get("files"), dict):
        raise ValueError("PUBLIC_REVIEW_MANIFEST_INVALID")
    previous = manifest["files"].get(OUT)
    if target.exists() and target.read_bytes() != payload:
        raise ValueError("EDUCATION_SOURCE_CHANGED_REVIEW_REQUIRED")
    if previous and previous.get("sha256") != digest:
        raise ValueError("EDUCATION_PUBLIC_HASH_CHANGED_REVIEW_REQUIRED")
    if check:
        if not previous or not target.is_file() or target.read_bytes() != payload:
            raise ValueError("EDUCATION_REVIEWED_EXPORT_MISSING")
    else:
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
        if not previous:
            manifest["files"][OUT] = {
                "access_level": "PUBLIC", "record_status": "VERIFIED",
                "source_ids": [result["sources"]["M"]["source_id"],
                               result["sources"]["W"]["source_id"]],
                "verified_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "sha256": digest,
                "evidence": EVIDENCE,
                "review_note": (
                    "KOVO 2026-27 드래프트 공식 신청자 PDF 남녀 117명 중 정확한 "
                    "applicant_id·이름·소속·출생연도·원문 SHA 대조를 통과한 공개 고교/대학 출신 "
                    "학교명만 분리. 중학교·산업체·학력 미확정 사실은 학교로 추측하지 않음."
                ),
            }
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"status": "VERIFIED", "sha256": digest, "records": result["record_count"],
            "mode": "read-only" if check else "write"}


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",default=str(ROOT))
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    print(json.dumps(run(args.root,check=args.check),ensure_ascii=False))

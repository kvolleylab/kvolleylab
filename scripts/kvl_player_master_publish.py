#!/usr/bin/env python3
"""Publish/verify only the committed current-roster files and pilot journal.

Uses the existing trusted workflow, Pages configuration, GitHub client and build
endpoint. The player monitoring/review window is independent of the match window.
No MASTER data, Google credential, repository setting or historical roster is
written here. A fresh verified receipt from this run is required.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, build_opener

import kovo_vleague_ops as ops
from kvl_player_master_export import export_from_receipt, validate_receipt
from kvl_player_master_pilot import preflight, _output_dir, _write


PUBLIC_PATHS = (
    "data/competitions/v-league-men-2026-27/rosters.json",
    "data/competitions/v-league-women-2026-27/rosters.json",
    "data/player-updates/applied_master_events.json",
)


class PublishError(ValueError):
    pass


def require_ready(root, environment=None, now=None):
    result = preflight(root, environment=environment, now=now)
    if result.get("ready") is not True:
        raise PublishError("PLAYER_PILOT_NOT_READY")
    return result


def committed_files(root, expected_sha):
    """Bind exact bytes to HEAD; git diff alone would miss an untracked journal."""
    ops.require(ops.git_head(root) == expected_sha, "MAIN_HEAD_CHANGED")
    result = {}
    for relative in PUBLIC_PATHS:
        path = root / relative
        ops.require(path.resolve() == path and path.is_file() and path.stat().st_size <= ops.MAX_BYTES,
                    "LOCAL_DATA_INVALID")
        try:
            raw = path.read_bytes()
            committed = subprocess.run(["git", "show", f"{expected_sha}:{relative}"], cwd=root,
                                       capture_output=True, check=True).stdout
        except (OSError, subprocess.SubprocessError):
            raise ops.OpsError("LOCAL_DATA_UNCOMMITTED") from None
        ops.require(raw == committed, "LOCAL_DATA_UNCOMMITTED")
        ops.require(isinstance(ops.decode_json(raw), dict), "LOCAL_DATA_INVALID")
        result[relative] = raw
    return result


def read_public_bytes(url, *, timeout=20):
    """Unauthenticated, no-redirect, fixed-site and fixed-path byte verification."""
    parts = urlsplit(url)
    query = parse_qs(parts.query)
    ops.require(parts.scheme == "https" and parts.netloc == "kvolleylab.com"
                and parts.path.lstrip("/") in PUBLIC_PATHS and not parts.fragment
                and set(query) == {"kvl_verify"} and len(query["kvl_verify"]) == 1
                and re.fullmatch(r"[0-9a-f]{40}-\d+", query["kvl_verify"][0]), "INVALID_ENDPOINT")
    request = Request(url, headers={"Accept": "application/json", "Cache-Control": "no-cache, no-store",
                                   "Pragma": "no-cache", "User-Agent": "KVolleyLab-Player-Master-Verify/1.0"})
    try:
        with build_opener(ops.NoRedirect()).open(request, timeout=timeout) as response:
            ops.require(response.status == 200 and response.geturl() == url, "SITE_NOT_VERIFIED")
            raw = response.read(ops.MAX_BYTES + 1)
            ops.require(len(raw) <= ops.MAX_BYTES, "RESPONSE_TOO_LARGE")
            ops.decode_json(raw)
            return raw
    except (HTTPError, URLError, OSError, TimeoutError):
        raise ops.OpsError("SITE_NOT_VERIFIED") from None


def verify_bytes(expected, sha, reader, timeout=10):
    result = {}
    nonce = time.time_ns()
    for relative, raw in expected.items():
        try:
            result[relative] = reader(ops.SITE + "/" + relative + f"?kvl_verify={sha}-{nonce}",
                                      timeout=timeout) == raw
        except ops.OpsError:
            result[relative] = False
    return result


def publish(root, expected_sha, receipt, *, client=None, environment=None,
            public_reader=read_public_bytes, timeout=300, interval=5,
            sleeper=time.sleep, clock=time.monotonic, now=None):
    root = Path(root).resolve()
    environment = os.environ if environment is None else environment
    ops.require(1 <= timeout <= 600 and 1 <= interval <= 30, "INVALID_WAIT_LIMIT")
    expected_sha = ops.valid_sha(expected_sha)
    gate = require_ready(root, environment, now)
    validate_receipt(receipt, now=now)
    if any(receipt.get(key) != value for key, value in gate["event_scope"].items()):
        raise PublishError("RECEIPT_OUTSIDE_APPROVED_SCOPE")
    # An export must already have been committed. A receipt cannot publish a
    # roster that was never reconciled or silently regenerate missing evidence.
    export = export_from_receipt(root, receipt, now=now)
    if export["changed_files"]:
        raise PublishError("VERIFIED_EXPORT_NOT_COMMITTED")
    expected = committed_files(root, expected_sha)
    client = client or ops.GitHubClient.from_environment(environment)
    ops.inspect_pages(client=client, environment=environment)
    ops.require(ops.remote_head(client) == expected_sha, "MAIN_HEAD_CHANGED")
    build = ops.latest_build(client)
    outcomes = verify_bytes(expected, expected_sha, public_reader)
    same_built = bool(build and build["commit"] == expected_sha and build["status"] == "built")
    in_progress = bool(build and build["commit"] == expected_sha and build["status"] in {"queued", "building"})
    requested = not in_progress and (not same_built or not all(outcomes.values()))
    old_error = ops.canonical(build) if build and build["status"] == "errored" else None
    if requested:
        require_ready(root, environment, now)
        validate_receipt(receipt, now=now)
        ops.require(ops.remote_head(client) == expected_sha, "MAIN_HEAD_CHANGED")
        response = client.request("POST", ops.PREFIX + "/pages/builds")
        ops.require(isinstance(response, dict) and response.get("status") in {"queued", "building"}
                    and response.get("url") == ops.API + ops.PREFIX + "/pages/builds/latest",
                    "BUILD_RESPONSE_INVALID")
    deadline = clock() + timeout
    while clock() < deadline:
        require_ready(root, environment, now)
        if build and build["commit"] == expected_sha:
            if build["status"] == "errored" and not (requested and ops.canonical(build) == old_error):
                raise ops.OpsError("BUILD_FAILED")
            if build["status"] == "built":
                ops.require(ops.remote_head(client) == expected_sha, "MAIN_HEAD_CHANGED")
                outcomes = verify_bytes(expected, expected_sha, public_reader,
                                        timeout=min(10, max(0.1, (deadline - clock()) / len(PUBLIC_PATHS))))
                if all(outcomes.values()):
                    ops.require(committed_files(root, expected_sha) == expected, "LOCAL_DATA_INVALID")
                    return {"schema_version": 1, "status": "PLAYER_MASTER_DEPLOYED_VERIFIED",
                            "expected_sha": expected_sha, "built_sha": build["commit"],
                            "build_requested": requested, "verified_files": list(PUBLIC_PATHS),
                            "event_id": receipt["event_id"], "player_id": receipt["player_id"],
                            "verified_at": (now or datetime.now(timezone.utc)).isoformat(),
                            "verified_file_sha256": {path: hashlib.sha256(raw).hexdigest()
                                                     for path, raw in expected.items()}}
        remaining = deadline - clock()
        if remaining <= 0:
            break
        sleeper(min(interval, remaining))
        build = ops.latest_build(client, timeout=min(20, max(0.1, deadline - clock())))
    raise ops.OpsError("SITE_NOT_VERIFIED" if build and build.get("commit") == expected_sha
                       and build.get("status") == "built" else "BUILD_TIMEOUT")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--sha", required=True)
    parser.add_argument("--output", type=Path, required=True,
                        help="Existing private run directory containing receipt.json; receives deploy.json")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        output = _output_dir(root, args.output)
    except ValueError:
        parser.exit(2, "PLAYER_PUBLISH_BLOCKED: invalid private output directory\n")
    try:
        # Disabled/invalid pilot exits before even reading a receipt or token.
        require_ready(root)
        receipt = json.loads((output / "receipt.json").read_text(encoding="utf-8"))
        result = publish(root, args.sha, receipt)
    except (PublishError, ops.OpsError) as error:
        result = {"schema_version": 1, "status": "PLAYER_PUBLICATION_BLOCKED", "reason": str(error)}
    except (OSError, ValueError, KeyError, TypeError):
        result = {"schema_version": 1, "status": "PLAYER_PUBLICATION_BLOCKED", "reason": "INVALID_VERIFIED_EXPORT"}
    _write(output / "deploy.json", result)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result["status"] == "PLAYER_MASTER_DEPLOYED_VERIFIED" else 2


if __name__ == "__main__":
    raise SystemExit(main())

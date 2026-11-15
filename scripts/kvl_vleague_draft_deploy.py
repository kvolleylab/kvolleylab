#!/usr/bin/env python3
"""Explicit, opt-in GitHub Pages build for the source-validated draft bridge.

GitHub GITHUB_TOKEN pushes do not trigger a Pages build. This separate step
requests/observes the existing legacy main Pages build and verifies the exact
public bridge bytes. It requires a trusted current-main workflow and a
repository approval variable; no Google credentials are needed.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener

import kovo_vleague_ops as ops
from kvl_vleague_draft_sync import OUT, generate


def require_context(env):
    ops.require(env.get("KVL_DRAFT_ROSTER_PUBLISH_APPROVED") == "true", "PUBLISH_NOT_APPROVED")
    ops.require(
        env.get("GITHUB_REPOSITORY") == ops.REPOSITORY
        and env.get("GITHUB_REF") == "refs/heads/main"
        and env.get("GITHUB_EVENT_NAME") in {"schedule", "workflow_dispatch", "push"}
        and env.get("GITHUB_WORKFLOW_REF") ==
            ops.REPOSITORY + "/.github/workflows/kovo-official-notices-collector.yml@refs/heads/main",
        "UNTRUSTED_CONTEXT",
    )


def committed_bridge(root):
    path = root / OUT
    ops.require(path.is_file() and path.stat().st_size <= ops.MAX_BYTES, "LOCAL_DATA_INVALID")
    raw = path.read_bytes()
    try:
        committed = subprocess.check_output(["git", "show", "HEAD:" + OUT], cwd=root)
    except (OSError, subprocess.CalledProcessError):
        raise ops.OpsError("LOCAL_DATA_UNCOMMITTED") from None
    ops.require(raw == committed, "LOCAL_DATA_UNCOMMITTED")
    ops.require(json.loads(raw) == generate(root), "LOCAL_DATA_INVALID")
    return raw


def public_bridge(sha, nonce, *, timeout=15):
    sha = ops.valid_sha(sha)
    url = ops.SITE + "/" + OUT + "?kvl_verify=" + sha + "-" + str(nonce)
    parts = urlsplit(url)
    ops.require(parts.scheme == "https" and parts.hostname == "kvolleylab.com"
                and parts.path == "/" + OUT, "INVALID_ENDPOINT")
    request = Request(url, headers={
        "Accept": "application/json", "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache", "User-Agent": "KVL-Draft-Pages-Verify/1.0",
    })
    try:
        with build_opener(ops.NoRedirect()).open(request, timeout=timeout) as response:
            ops.require(response.status == 200 and response.geturl() == url, "SITE_NOT_VERIFIED")
            raw = response.read(ops.MAX_BYTES + 1)
            ops.require(len(raw) <= ops.MAX_BYTES, "RESPONSE_TOO_LARGE")
            return raw
    except (HTTPError, URLError, OSError, TimeoutError):
        return None


def publish(root, expected_sha, *, environment=None, client=None,
            reader=public_bridge, sleeper=time.sleep, clock=time.monotonic,
            timeout=360, interval=12):
    env = environment or os.environ
    require_context(env)
    root = Path(root).resolve()
    sha = ops.valid_sha(expected_sha)
    ops.require(ops.git_head(root) == sha, "MAIN_HEAD_CHANGED")
    expected = committed_bridge(root)
    client = client or ops.GitHubClient.from_environment(env)
    ops.inspect_pages(client=client, environment=env)
    ops.require(ops.remote_head(client) == sha, "MAIN_HEAD_CHANGED")
    initial = ops.latest_build(client)
    nonce = time.time_ns()
    if initial and initial.get("status") == "built" and initial.get("commit") == sha:
        if reader(sha, nonce) == expected:
            return {"status": "DEPLOYED_VERIFIED", "sha": sha, "build_requested": False}
    in_progress = bool(initial and initial.get("commit") == sha
                       and initial.get("status") in {"queued", "building"})
    if not in_progress:
        require_context(env)
        ops.require(ops.remote_head(client) == sha, "MAIN_HEAD_CHANGED")
        result = client.request("POST", ops.PREFIX + "/pages/builds")
        ops.require(isinstance(result, dict) and result.get("status") in {"queued", "building"},
                    "BUILD_RESPONSE_INVALID")
    deadline = clock() + timeout
    while clock() < deadline:
        now = ops.latest_build(client)
        if now and now.get("commit") == sha:
            if now.get("status") == "errored":
                raise ops.OpsError("BUILD_FAILED")
            if now.get("status") == "built":
                ops.require(ops.remote_head(client) == sha, "MAIN_HEAD_CHANGED")
                if reader(sha, time.time_ns()) == expected:
                    return {"status": "DEPLOYED_VERIFIED", "sha": sha,
                            "build_requested": not in_progress}
        remaining = deadline - clock()
        if remaining <= 0:
            break
        sleeper(min(interval, remaining))
    raise ops.OpsError("SITE_NOT_VERIFIED")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--sha", required=True)
    parser.add_argument("--report", default="")
    args = parser.parse_args()
    try:
        result = publish(args.root, args.sha)
    except (ops.OpsError, OSError, ValueError):
        result = {"status": "FAILED", "reason": "DRAFT_BRIDGE_PAGES_NOT_VERIFIED"}
    if args.report:
        Path(args.report).write_text(json.dumps(result, ensure_ascii=False) + "\n")
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["status"] == "DEPLOYED_VERIFIED" else 1


if __name__ == "__main__":
    raise SystemExit(main())

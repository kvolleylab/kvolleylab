#!/usr/bin/env python3
"""Explicit Pages build/verification and sanitized failure tracking for V-league.

GitHub's branch build endpoint accepts installation tokens with pages:write:
https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build
GITHUB_TOKEN pushes do not themselves start Pages builds:
https://docs.github.com/en/actions/concepts/security/github_token

No Pages settings, branches, files, credentials, or repository permissions are
changed here. Operational actions require the approved trusted-main job;
inspect-pages is limited to fixed read-only configuration queries.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

REPOSITORY = "kvolleylab/kvolleylab"
PREFIX = "/repos/" + REPOSITORY
API = "https://api.github.com"
SITE = "https://kvolleylab.com"
DATA_PATHS = (
    "data/competitions/v-league-men-2026-27/data.json",
    "data/competitions/v-league-women-2026-27/data.json",
)
ISSUE_TITLE = "[V-리그 자동 업데이트] 운영 확인 필요"
ISSUE_MARKER = "<!-- kvl-vleague-failure-v1:"
MAX_BYTES = 3_000_000
UPDATER_CODES = {
    "SourceError": "SOURCE_VALIDATION_FAILED", "UpdateError": "UPDATE_VALIDATION_FAILED",
    "StandingsError": "STANDINGS_VALIDATION_FAILED", "MasterError": "MASTER_SYNC_FAILED",
}
SAFE_CODES = {
    "PUBLISH_NOT_APPROVED", "UNTRUSTED_CONTEXT", "TOKEN_MISSING", "BAD_REPOSITORY",
    "PAGES_NOT_BRANCH_MAIN", "PAGES_DOMAIN_CHANGED", "MAIN_HEAD_CHANGED", "LOCAL_GIT_FAILED",
    "LOCAL_DATA_UNCOMMITTED", "LOCAL_DATA_INVALID", "INVALID_SHA", "INVALID_ENDPOINT",
    "HTTP_401", "HTTP_403", "HTTP_404", "HTTP_409", "HTTP_422", "HTTP_429", "HTTP_ERROR",
    "NETWORK_ERROR", "RESPONSE_INVALID", "REDIRECT_BLOCKED", "RESPONSE_TOO_LARGE",
    "BUILD_FAILED", "BUILD_TIMEOUT", "SITE_NOT_VERIFIED", "BUILD_RESPONSE_INVALID",
    "SOURCE_VALIDATION_FAILED", "UPDATE_VALIDATION_FAILED", "STANDINGS_VALIDATION_FAILED",
    "MASTER_SYNC_FAILED", "UPDATER_FAILED", "REPORT_INVALID", "RUN_URL_INVALID",
    "ISSUE_LOOKUP_LIMIT", "DUPLICATE_TRACKING_ISSUES", "INVALID_WAIT_LIMIT",
}


class OpsError(RuntimeError):
    def __init__(self, code, *, http_status=None):
        self.code = code if code in SAFE_CODES else "RESPONSE_INVALID"
        self.http_status = http_status
        super().__init__(self.code)


def require(condition, code):
    if not condition:
        raise OpsError(code)


def check_context(environment=None):
    env = os.environ if environment is None else environment
    require(env.get("KVL_VLEAGUE_PUBLISH_APPROVED") == "true", "PUBLISH_NOT_APPROVED")
    require(env.get("GITHUB_REPOSITORY") == REPOSITORY
            and env.get("GITHUB_REF") == "refs/heads/main"
            and env.get("GITHUB_EVENT_NAME") in ("schedule", "workflow_dispatch"),
            "UNTRUSTED_CONTEXT")
    return env


def valid_sha(value):
    require(isinstance(value, str) and re.fullmatch(r"[0-9a-f]{40}", value), "INVALID_SHA")
    return value


def valid_run_url(value):
    require(isinstance(value, str) and re.fullmatch(
        r"https://github\.com/kvolleylab/kvolleylab/actions/runs/[1-9]\d*(?:/attempts/[1-9]\d*)?", value),
        "RUN_URL_INVALID")
    return value


def validate_endpoint(method, path):
    require(isinstance(path, str) and path.startswith(PREFIX), "INVALID_ENDPOINT")
    parts = urlsplit(path)
    require(not parts.scheme and not parts.netloc and not parts.fragment, "INVALID_ENDPOINT")
    exact = {
        "GET": {PREFIX, PREFIX + "/git/ref/heads/main", PREFIX + "/pages",
                PREFIX + "/pages/builds/latest"},
        "POST": {PREFIX + "/pages/builds", PREFIX + "/issues"},
    }
    if parts.path in exact.get(method, set()):
        require(not parts.query, "INVALID_ENDPOINT")
        return
    if method == "GET" and parts.path == PREFIX + "/issues":
        query = parse_qs(parts.query)
        require(set(query) == {"state", "per_page", "page"}
                and query["state"] == ["all"] and query["per_page"] == ["100"]
                and len(query["page"]) == 1 and re.fullmatch(r"(?:[1-9]|10)", query["page"][0]),
                "INVALID_ENDPOINT")
        return
    if method == "PATCH" and re.fullmatch(re.escape(PREFIX) + r"/issues/[1-9]\d*", parts.path):
        require(not parts.query, "INVALID_ENDPOINT")
        return
    raise OpsError("INVALID_ENDPOINT")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise OpsError("REDIRECT_BLOCKED")


def decode_json(raw):
    def reject_constant(value):
        raise ValueError("non-JSON numeric literal")
    try:
        return json.loads(raw, parse_constant=reject_constant)
    except (ValueError, UnicodeError) as exc:
        raise OpsError("RESPONSE_INVALID") from exc


class GitHubClient:
    def __init__(self, token, *, opener=None):
        require(isinstance(token, str) and bool(token), "TOKEN_MISSING")
        self._token = token
        self.opener = opener or build_opener(NoRedirect())

    @classmethod
    def from_environment(cls, environment=None):
        env = os.environ if environment is None else environment
        return cls(env.get("GH_TOKEN", ""))

    def request(self, method, path, payload=None, *, timeout=20):
        validate_endpoint(method, path)
        require(0 < timeout <= 30, "INVALID_WAIT_LIMIT")
        if method == "GET":
            require(payload is None, "INVALID_ENDPOINT")
        body = None if payload is None else json.dumps(payload, ensure_ascii=False, allow_nan=False).encode()
        request = Request(API + path, data=body, method=method, headers={
            "Accept": "application/vnd.github+json", "Authorization": "Bearer " + self._token,
            "X-GitHub-Api-Version": "2026-03-10", "Content-Type": "application/json",
            "User-Agent": "KVolleyLab-VLeague-Ops/1.0",
        })
        expected = 201 if method == "POST" else 200
        try:
            with self.opener.open(request, timeout=timeout) as response:
                require(response.status == expected and response.geturl() == API + path, "RESPONSE_INVALID")
                raw = response.read(MAX_BYTES + 1)
                require(len(raw) <= MAX_BYTES, "RESPONSE_TOO_LARGE")
                return decode_json(raw)
        except HTTPError as exc:
            code = f"HTTP_{exc.code}" if f"HTTP_{exc.code}" in SAFE_CODES else "HTTP_ERROR"
            # Never read, format, or publish an authenticated HTTP response body.
            raise OpsError(code, http_status=exc.code) from None
        except (URLError, TimeoutError, OSError):
            raise OpsError("NETWORK_ERROR") from None


def read_public_json(url, *, timeout=20):
    parts = urlsplit(url)
    require(parts.scheme == "https" and parts.netloc == "kvolleylab.com"
            and parts.path.lstrip("/") in DATA_PATHS and not parts.fragment, "INVALID_ENDPOINT")
    query = parse_qs(parts.query)
    require(set(query) == {"kvl_verify"} and len(query["kvl_verify"]) == 1
            and re.fullmatch(r"[0-9a-f]{40}-\d+", query["kvl_verify"][0]), "INVALID_ENDPOINT")
    request = Request(url, headers={"Accept": "application/json", "Cache-Control": "no-cache, no-store",
                                   "Pragma": "no-cache", "User-Agent": "KVolleyLab-VLeague-Verify/1.0"})
    try:
        with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
            require(response.status == 200 and response.geturl() == url, "SITE_NOT_VERIFIED")
            raw = response.read(MAX_BYTES + 1)
            require(len(raw) <= MAX_BYTES, "RESPONSE_TOO_LARGE")
            return decode_json(raw)
    except HTTPError as exc:
        raise OpsError("SITE_NOT_VERIFIED", http_status=exc.code) from None
    except (URLError, TimeoutError, OSError):
        raise OpsError("SITE_NOT_VERIFIED") from None


def git_head(root):
    try:
        result = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, text=True,
                                capture_output=True, check=True)
        return valid_sha(result.stdout.strip())
    except (OSError, subprocess.SubprocessError):
        raise OpsError("LOCAL_GIT_FAILED") from None


def require_committed_data(root):
    try:
        result = subprocess.run(["git", "diff", "--quiet", "HEAD", "--", *DATA_PATHS],
                                cwd=root, capture_output=True)
    except OSError:
        raise OpsError("LOCAL_GIT_FAILED") from None
    require(result.returncode == 0, "LOCAL_DATA_UNCOMMITTED")


def expected_data(root):
    result = {}
    for relative in DATA_PATHS:
        path = Path(root) / relative
        try:
            require(path.is_file() and path.stat().st_size <= MAX_BYTES, "LOCAL_DATA_INVALID")
            result[relative] = decode_json(path.read_bytes())
            require(isinstance(result[relative], dict), "LOCAL_DATA_INVALID")
        except OSError:
            raise OpsError("LOCAL_DATA_INVALID") from None
    return result


def canonical(value):
    try:
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
    except (TypeError, ValueError):
        raise OpsError("RESPONSE_INVALID") from None


def remote_head(client, *, timeout=20):
    ref = client.request("GET", PREFIX + "/git/ref/heads/main", timeout=timeout)
    require(isinstance(ref, dict) and ref.get("ref") == "refs/heads/main"
            and isinstance(ref.get("object"), dict) and ref["object"].get("type") == "commit", "RESPONSE_INVALID")
    return valid_sha(ref["object"].get("sha"))


def inspect_pages(*, client=None, environment=None):
    """Read fixed repository/Pages configuration using a pages:read token.

    This inspection is safe in an unapproved PR check job: it has no publishing
    gate because it performs only two fixed GETs, and exposes no raw response.
    All mutations remain exclusively in the context-gated operational actions.
    """
    client = client or GitHubClient.from_environment(environment)
    repository = client.request("GET", PREFIX)
    require(isinstance(repository, dict) and repository.get("full_name") == REPOSITORY
            and repository.get("default_branch") == "main", "BAD_REPOSITORY")
    pages = client.request("GET", PREFIX + "/pages")
    require(isinstance(pages, dict) and pages.get("build_type") == "legacy"
            and pages.get("source") == {"branch": "main", "path": "/"}, "PAGES_NOT_BRANCH_MAIN")
    require(pages.get("cname") == "kvolleylab.com", "PAGES_DOMAIN_CHANGED")
    return {"status": "PAGES_CONFIG_VERIFIED", "build_type": "legacy",
            "source": {"branch": "main", "path": "/"}, "pages_url": SITE}


def preflight(root, *, client=None, environment=None, expected_sha=None):
    env = check_context(environment)
    client = client or GitHubClient.from_environment(env)
    head = git_head(root)
    if expected_sha is not None:
        require(head == valid_sha(expected_sha), "MAIN_HEAD_CHANGED")
    inspect_pages(client=client, environment=env)
    require(remote_head(client) == head, "MAIN_HEAD_CHANGED")
    require_committed_data(root)
    expected_data(root)
    return {"status": "PREFLIGHT_OK", "expected_sha": head,
            "source": {"branch": "main", "path": "/"}, "pages_url": SITE}


def latest_build(client, *, timeout=20):
    try:
        build = client.request("GET", PREFIX + "/pages/builds/latest", timeout=timeout)
    except OpsError as exc:
        if exc.http_status == 404:
            return None
        raise
    require(isinstance(build, dict) and build.get("status") in ("built", "building", "queued", "errored"),
            "BUILD_RESPONSE_INVALID")
    valid_sha(build.get("commit"))
    return build


def verify_public(expected, expected_sha, reader, *, timeout=20, nonce=None):
    nonce = time.time_ns() if nonce is None else nonce
    outcomes = {}
    for relative in DATA_PATHS:
        url = SITE + "/" + relative + f"?kvl_verify={expected_sha}-{nonce}"
        try:
            actual = reader(url, timeout=timeout)
            outcomes[relative] = canonical(actual) == canonical(expected[relative])
        except OpsError:
            outcomes[relative] = None
    return outcomes


def deploy(root, expected_sha, *, client=None, environment=None, public_reader=read_public_json,
           timeout=600, interval=10, sleeper=time.sleep, clock=time.monotonic):
    require(1 <= timeout <= 600 and 1 <= interval <= 30, "INVALID_WAIT_LIMIT")
    env = check_context(environment)
    client = client or GitHubClient.from_environment(env)
    preflight(root, client=client, environment=env, expected_sha=expected_sha)
    expected = expected_data(root)
    build = latest_build(client)
    outcomes = verify_public(expected, expected_sha, public_reader)
    if build and build["status"] == "built" and build["commit"] == expected_sha and all(v is True for v in outcomes.values()):
        require(remote_head(client) == expected_sha, "MAIN_HEAD_CHANGED")
        return {"status": "DEPLOYED_VERIFIED", "expected_sha": expected_sha,
                "built_sha": expected_sha, "build_requested": False, "verified_files": list(DATA_PATHS)}

    current_in_progress = bool(build and build["commit"] == expected_sha
                               and build["status"] in ("building", "queued"))
    same_built = bool(build and build["commit"] == expected_sha and build["status"] == "built")
    request_build = not current_in_progress and (not same_built or any(v is False for v in outcomes.values()))
    previous_error = canonical({key: build.get(key) for key in
                                ("url", "created_at", "updated_at", "commit", "status")}) \
        if build and build["status"] == "errored" else None
    if request_build:
        check_context(env)
        require(remote_head(client) == expected_sha, "MAIN_HEAD_CHANGED")
        response = client.request("POST", PREFIX + "/pages/builds")
        require(isinstance(response, dict) and response.get("status") in ("queued", "building")
                and response.get("url") == API + PREFIX + "/pages/builds/latest", "BUILD_RESPONSE_INVALID")
    deadline = clock() + timeout
    while clock() < deadline:
        remaining = min(20, max(0.1, deadline - clock()))
        build = latest_build(client, timeout=remaining)
        if build and build["commit"] == expected_sha:
            if build["status"] == "errored":
                observed_error = canonical({key: build.get(key) for key in
                                            ("url", "created_at", "updated_at", "commit", "status")})
                # The latest endpoint may briefly expose the previous failed
                # build after a rebuild request was accepted. Await the new job.
                if not (request_build and previous_error == observed_error):
                    raise OpsError("BUILD_FAILED")
            if build["status"] == "built":
                require(remote_head(client, timeout=min(20, max(0.1, deadline-clock()))) == expected_sha,
                        "MAIN_HEAD_CHANGED")
                if clock() >= deadline:
                    break
                outcomes = verify_public(expected, expected_sha, public_reader,
                                         timeout=min(10, max(0.1, (deadline-clock()) / 2)))
                if all(value is True for value in outcomes.values()):
                    return {"status": "DEPLOYED_VERIFIED", "expected_sha": expected_sha,
                            "built_sha": build["commit"], "build_requested": request_build,
                            "verified_files": list(DATA_PATHS)}
        remaining = deadline - clock()
        if remaining <= 0:
            break
        sleeper(min(interval, remaining))
    raise OpsError("SITE_NOT_VERIFIED" if build and build.get("commit") == expected_sha
                   and build.get("status") == "built" else "BUILD_TIMEOUT")


def safe_failure(report, ops_report=None):
    require(isinstance(report, dict) and (ops_report is None or isinstance(ops_report, dict)), "REPORT_INVALID")
    raw_code = (ops_report or {}).get("error_code") or report.get("error_code")
    if not isinstance(raw_code, str):
        raw_code = None
    code = UPDATER_CODES.get(raw_code, raw_code if raw_code in SAFE_CODES else "UPDATER_FAILED")
    summary = {"reason_code": code, "master_written": report.get("master_written") is True,
               "master_readback_verified": report.get("master_readback_verified") is True,
               "production_written": report.get("production_written") is True,
               "master_may_be_ahead": report.get("master_written") is True
                                      or report.get("production_written") is True
                                      or code == "MASTER_SYNC_FAILED",
               "counts": {}}
    for gender in ("MALE", "FEMALE"):
        group = report.get("divisions", {}).get(gender, {}) if isinstance(report.get("divisions"), dict) else {}
        if not isinstance(group, dict):
            continue
        values = {key: group[key] for key in ("matched", "completed", "changed_matches")
                  if type(group.get(key)) is int and 0 <= group[key] <= 126}
        if values:
            summary["counts"][gender] = values
    return summary


def issue_body(summary, run_url, fingerprint):
    lines = [f"{ISSUE_MARKER}{fingerprint} -->", "## V-리그 자동 업데이트 확인 필요", "",
             f"사유 코드: `{summary['reason_code']}`", "", f"실행 기록: {run_url}", "",
             "자동 갱신이 완료됐다고 확인할 수 없어 운영 상태 확인이 필요합니다.",
             "다음 실행은 공식 기록·MASTER·운영 데이터·배포 상태를 다시 대조합니다.", "",
             f"MASTER 변경 기록: {str(summary['master_written']).lower()}",
             f"MASTER 읽기 대조 완료: {str(summary['master_readback_verified']).lower()}",
             f"로컬 운영 데이터 작성: {str(summary['production_written']).lower()}"]
    if summary["master_may_be_ahead"]:
        lines += ["", "MASTER가 먼저 갱신되고 홈페이지는 아직 반영되지 않았을 수 있습니다.",
                  "기존 결과를 지우지 않고 다음 실행에서 동일 데이터와 배포를 다시 확인합니다."]
    for gender, counts in summary["counts"].items():
        label = "남자부" if gender == "MALE" else "여자부"
        lines += ["", label + ": " + ", ".join(f"{key}={value}" for key, value in sorted(counts.items()))]
    return "\n".join(lines) + "\n"


def notify_failure(report, run_url, *, ops_report=None, client=None, environment=None):
    env = check_context(environment)
    valid_run_url(run_url)
    client = client or GitHubClient.from_environment(env)
    summary = safe_failure(report, ops_report)
    fingerprint = hashlib.sha256(canonical(summary).encode()).hexdigest()
    marker = f"{ISSUE_MARKER}{fingerprint} -->"
    matches = []
    for page in range(1, 11):
        items = client.request("GET", PREFIX + f"/issues?state=all&per_page=100&page={page}")
        require(isinstance(items, list), "RESPONSE_INVALID")
        for issue in items:
            if isinstance(issue, dict) and not issue.get("pull_request") and issue.get("title") == ISSUE_TITLE \
                    and isinstance(issue.get("body"), str) and ISSUE_MARKER in issue["body"]:
                matches.append(issue)
        if len(items) < 100:
            break
    else:
        raise OpsError("ISSUE_LOOKUP_LIMIT")
    require(len(matches) <= 1, "DUPLICATE_TRACKING_ISSUES")
    body = issue_body(summary, run_url, fingerprint)
    if matches:
        existing = matches[0]
        number = existing.get("number")
        require(type(number) is int and number > 0, "RESPONSE_INVALID")
        if existing.get("state") == "open" and marker in existing["body"]:
            return {"status": "FAILURE_UNCHANGED", "issue_number": number, "reason_code": summary["reason_code"]}
        result = client.request("PATCH", PREFIX + f"/issues/{number}", {"body": body, "state": "open"})
        require(isinstance(result, dict) and result.get("number") == number, "RESPONSE_INVALID")
        status = "FAILURE_ISSUE_UPDATED"
    else:
        result = client.request("POST", PREFIX + "/issues", {"title": ISSUE_TITLE, "body": body})
        require(isinstance(result, dict) and type(result.get("number")) is int and result["number"] > 0, "RESPONSE_INVALID")
        number, status = result["number"], "FAILURE_ISSUE_CREATED"
    return {"status": status, "issue_number": number, "reason_code": summary["reason_code"]}


def write_report(path, report):
    if not path:
        return
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_suffix(target.suffix + ".tmp")
    temp.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(target)


def read_failure_report(path):
    """Early workflow failures may happen before a receipt can be written.

    A missing receipt carries no assumption about MASTER or data writes. It
    should still produce one generic, sanitized operational failure notice.
    Existing malformed/unreadable reports are never treated as trusted input.
    """
    try:
        return decode_json(Path(path).read_bytes())
    except FileNotFoundError:
        return {"status": "FAILED", "error_code": "UPDATER_FAILED"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    subs = parser.add_subparsers(dest="action", required=True)
    inspect = subs.add_parser("inspect-pages")
    inspect.add_argument("--report", type=Path)
    for action in ("preflight", "deploy"):
        item = subs.add_parser(action)
        item.add_argument("--root", type=Path, default=Path("."))
        item.add_argument("--report", type=Path)
        if action == "deploy":
            item.add_argument("--sha", required=True)
    notify = subs.add_parser("notify-failure")
    notify.add_argument("--report", type=Path, required=True)
    notify.add_argument("--ops-report", type=Path)
    notify.add_argument("--run-url", required=True)
    args = parser.parse_args(argv)
    try:
        if args.action == "inspect-pages":
            result = inspect_pages()
        elif args.action == "preflight":
            result = preflight(args.root.resolve())
        elif args.action == "deploy":
            result = deploy(args.root.resolve(), valid_sha(args.sha))
        else:
            report = read_failure_report(args.report)
            ops_report = decode_json(args.ops_report.read_bytes()) if args.ops_report and args.ops_report.exists() else None
            result = notify_failure(report, args.run_url, ops_report=ops_report)
        if args.action != "notify-failure":
            write_report(args.report, result)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (OpsError, OSError) as exc:
        code = exc.code if isinstance(exc, OpsError) else "REPORT_INVALID"
        result = {"status": "FAILED", "error_code": code, "site_deployment_verified": False,
                  "recovery": "RECONCILE_MASTER_AND_SITE_ON_NEXT_RUN"}
        if args.action != "notify-failure":
            write_report(args.report, result)
        print(json.dumps(result, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

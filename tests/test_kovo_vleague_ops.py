"""No-network deployment, trust gate, exact-commit and failure-redaction tests."""
from copy import deepcopy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kovo_vleague_ops as ops

SHA = "a" * 40
OTHER = "b" * 40
ENV = {"KVL_VLEAGUE_PUBLISH_APPROVED": "true", "GITHUB_REPOSITORY": ops.REPOSITORY,
       "GITHUB_REF": "refs/heads/main", "GITHUB_EVENT_NAME": "schedule"}
RUN = "https://github.com/kvolleylab/kvolleylab/actions/runs/12345"


class FakeClock:
    def __init__(self): self.value = 0
    def __call__(self): return self.value
    def sleep(self, seconds): self.value += seconds


class FakeClient:
    def __init__(self, builds=None):
        self.calls = []
        self.builds = builds or [{"status": "built", "commit": SHA}]
        self.heads = [SHA]
        self.pages = {"build_type": "legacy", "source": {"branch": "main", "path": "/"},
                      "cname": "kvolleylab.com"}
        self.repository = {"full_name": ops.REPOSITORY, "default_branch": "main"}
        self.issues = []

    def request(self, method, path, payload=None, *, timeout=20):
        ops.validate_endpoint(method, path)
        self.calls.append((method, path, deepcopy(payload)))
        if method == "GET" and path == ops.PREFIX: return self.repository
        if path == ops.PREFIX + "/pages": return self.pages
        if path == ops.PREFIX + "/git/ref/heads/main":
            head = self.heads[0]
            if len(self.heads) > 1: self.heads.pop(0)
            return {"ref": "refs/heads/main", "object": {"type": "commit", "sha": head}}
        if method == "GET" and path == ops.PREFIX + "/pages/builds/latest":
            value = self.builds[0]
            if len(self.builds) > 1: self.builds.pop(0)
            if isinstance(value, Exception): raise value
            return value
        if method == "POST" and path == ops.PREFIX + "/pages/builds":
            return {"status": "queued", "url": ops.API + ops.PREFIX + "/pages/builds/latest"}
        if method == "GET" and "/issues?" in path: return self.issues
        if method == "POST" and path == ops.PREFIX + "/issues":
            result = {"number": 777, "state": "open", **payload}
            self.issues = [result]
            return result
        if method == "PATCH" and "/issues/" in path:
            self.issues[0].update(payload)
            return self.issues[0]
        raise AssertionError((method, path))

    def writes(self): return [x for x in self.calls if x[0] != "GET"]


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.expected = {}
        for index, relative in enumerate(ops.DATA_PATHS):
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            value = {"season": "2026-27", "matches": [{"id": index, "score": {"home": 3, "away": 0}}]}
            path.write_text(json.dumps(value))
            self.expected[relative] = value
        self.git = patch.object(ops, "git_head", return_value=SHA)
        self.clean = patch.object(ops, "require_committed_data")
        self.git.start(); self.clean.start()
        self.clock = FakeClock()

    def tearDown(self):
        self.git.stop(); self.clean.stop(); self.temp.cleanup()

    def live(self, url, *, timeout=20):
        self.assertIn("kvl_verify=" + SHA + "-", url)
        return deepcopy(self.expected[urlsplit(url).path.lstrip("/")])

    def run_deploy(self, client, reader=None, **options):
        return ops.deploy(self.root, SHA, client=client, environment=ENV,
                          public_reader=reader or self.live, timeout=30, interval=5,
                          sleeper=self.clock.sleep, clock=self.clock, **options)

    def test_preflight_reads_only_and_requires_current_branch_pages(self):
        client = FakeClient()
        result = ops.preflight(self.root, client=client, environment=ENV)
        self.assertEqual(result["status"], "PREFLIGHT_OK")
        self.assertEqual(result["expected_sha"], SHA)
        self.assertEqual(client.writes(), [])

    def test_unapproved_or_untrusted_context_cannot_call_api(self):
        for changes in ({"KVL_VLEAGUE_PUBLISH_APPROVED": "false"}, {"KVL_VLEAGUE_PUBLISH_APPROVED": "TRUE"},
                        {"GITHUB_REF": "refs/heads/feature/test"}, {"GITHUB_EVENT_NAME": "pull_request_target"},
                        {"GITHUB_REPOSITORY": "someone/fork"}):
            client = FakeClient()
            with self.assertRaises(ops.OpsError):
                ops.preflight(self.root, client=client, environment={**ENV, **changes})
            self.assertEqual(client.calls, [])

    def test_custom_workflow_or_other_branch_path_domain_is_blocked(self):
        for changes in ({"build_type": "workflow"}, {"source": {"branch": "gh-pages", "path": "/"}},
                        {"source": {"branch": "main", "path": "/docs"}}, {"cname": "other.example"}):
            client = FakeClient(); client.pages.update(changes)
            with self.assertRaises(ops.OpsError): self.run_deploy(client)
            self.assertEqual(client.writes(), [])

    def test_other_default_branch_is_blocked(self):
        client = FakeClient(); client.repository["default_branch"] = "staging"
        with self.assertRaisesRegex(ops.OpsError, "BAD_REPOSITORY"): self.run_deploy(client)

    def test_already_matching_sha_and_both_documents_do_not_rebuild(self):
        client = FakeClient()
        result = self.run_deploy(client)
        self.assertEqual(result["status"], "DEPLOYED_VERIFIED")
        self.assertFalse(result["build_requested"])
        self.assertEqual(client.writes(), [])

    def test_previous_failed_deploy_rebuilds_without_new_data_commit(self):
        client = FakeClient(builds=[{"status": "errored", "commit": SHA},
                                    {"status": "queued", "commit": SHA},
                                    {"status": "built", "commit": SHA}])
        result = self.run_deploy(client)
        self.assertTrue(result["build_requested"])
        self.assertEqual(len(client.writes()), 1)
        self.assertEqual(client.writes()[0][1], ops.PREFIX + "/pages/builds")

    def test_latest_can_briefly_show_old_failure_after_rebuild_request(self):
        old = {"status": "errored", "commit": SHA, "url": "old-build"}
        client = FakeClient(builds=[old, old, {"status": "queued", "commit": SHA},
                                    {"status": "built", "commit": SHA}])
        self.assertEqual(self.run_deploy(client)["status"], "DEPLOYED_VERIFIED")
        self.assertGreaterEqual(self.clock.value, 10)

    def test_new_failed_rebuild_is_distinct_from_previous_failure(self):
        client = FakeClient(builds=[{"status": "errored", "commit": SHA, "url": "old-build"},
                                    {"status": "errored", "commit": SHA, "url": "new-build"}])
        with self.assertRaisesRegex(ops.OpsError, "BUILD_FAILED"): self.run_deploy(client)

    def test_wrong_build_sha_is_not_success_even_with_matching_content(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}])
        with self.assertRaisesRegex(ops.OpsError, "BUILD_TIMEOUT"): self.run_deploy(client)
        self.assertEqual(self.clock.value, 30)
        self.assertEqual(len(client.writes()), 1)

    def test_matching_build_sha_still_requires_both_live_documents(self):
        client = FakeClient()
        def one_stale(url, *, timeout=20):
            return {"stale": True} if "women" in url else self.live(url, timeout=timeout)
        with self.assertRaisesRegex(ops.OpsError, "SITE_NOT_VERIFIED"): self.run_deploy(client, one_stale)
        self.assertEqual(len(client.writes()), 1)

    def test_cache_propagation_is_polled_after_successful_build(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}, {"status": "built", "commit": SHA}])
        requests = []
        def eventually_current(url, *, timeout=20):
            requests.append(url)
            return {"stale": True} if len(requests) <= 4 else self.live(url, timeout=timeout)
        result = self.run_deploy(client, eventually_current)
        self.assertEqual(result["status"], "DEPLOYED_VERIFIED")
        self.assertGreaterEqual(self.clock.value, 5)
        self.assertEqual(len(client.writes()), 1)

    def test_existing_in_progress_expected_build_is_not_duplicated(self):
        client = FakeClient(builds=[{"status": "queued", "commit": SHA}, {"status": "built", "commit": SHA}])
        self.assertFalse(self.run_deploy(client)["build_requested"])
        self.assertEqual(client.writes(), [])

    def test_main_advance_before_build_request_stops_without_write(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}])
        client.heads = [SHA, OTHER]
        with self.assertRaisesRegex(ops.OpsError, "MAIN_HEAD_CHANGED"): self.run_deploy(client)
        self.assertEqual(client.writes(), [])

    def test_uncommitted_local_data_cannot_be_deployed(self):
        with patch.object(ops, "require_committed_data", side_effect=ops.OpsError("LOCAL_DATA_UNCOMMITTED")):
            client = FakeClient()
            with self.assertRaisesRegex(ops.OpsError, "LOCAL_DATA_UNCOMMITTED"): self.run_deploy(client)
            self.assertEqual(client.writes(), [])

    def test_build_failure_does_not_claim_site_was_updated(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}, {"status": "errored", "commit": SHA}])
        with self.assertRaisesRegex(ops.OpsError, "BUILD_FAILED"): self.run_deploy(client)

    def test_public_unavailable_does_not_force_rebuild_of_same_successful_sha(self):
        client = FakeClient()
        def offline(url, *, timeout=20): raise ops.OpsError("SITE_NOT_VERIFIED")
        with self.assertRaisesRegex(ops.OpsError, "SITE_NOT_VERIFIED"): self.run_deploy(client, offline)
        self.assertEqual(client.writes(), [])

    def test_semantic_json_comparison_ignores_format_and_key_order(self):
        self.assertEqual(ops.canonical({"b": [1, 2], "a": 3}), ops.canonical({"a": 3, "b": [1, 2]}))
        self.assertNotEqual(ops.canonical({"value": True}), ops.canonical({"value": 1}))


class NotificationTests(unittest.TestCase):
    def report(self):
        return {"error_code": "MasterError", "master_written": True, "master_readback_verified": True,
                "production_written": True, "raw_master": "PRIVATE SECRET", "error": "token=SECRET",
                "divisions": {"MALE": {"matched": 126, "completed": 1, "changed_matches": 1, "raw": "PRIVATE"}}}

    def test_create_sanitized_issue_and_unchanged_run_has_no_mutation(self):
        client = FakeClient()
        result = ops.notify_failure(self.report(), RUN, client=client, environment=ENV)
        self.assertEqual(result["status"], "FAILURE_ISSUE_CREATED")
        body = client.issues[0]["body"]
        self.assertNotIn("SECRET", body)
        self.assertNotIn("PRIVATE", body)
        self.assertIn("MASTER_SYNC_FAILED", body)
        self.assertIn("MASTER가 먼저 갱신", body)
        writes = len(client.writes())
        result = ops.notify_failure(self.report(), RUN.replace("12345", "12346"), client=client, environment=ENV)
        self.assertEqual(result["status"], "FAILURE_UNCHANGED")
        self.assertEqual(len(client.writes()), writes)

    def test_changed_reason_updates_same_issue_without_comments(self):
        client = FakeClient()
        ops.notify_failure(self.report(), RUN, client=client, environment=ENV)
        result = ops.notify_failure(self.report(), RUN, ops_report={"error_code": "BUILD_FAILED"},
                                    client=client, environment=ENV)
        self.assertEqual(result["issue_number"], 777)
        self.assertEqual(client.writes()[-1][0], "PATCH")
        self.assertFalse(any("/comments" in x[1] for x in client.calls))

    def test_recurrence_reopens_stable_issue(self):
        client = FakeClient()
        ops.notify_failure(self.report(), RUN, client=client, environment=ENV)
        client.issues[0]["state"] = "closed"
        ops.notify_failure(self.report(), RUN, client=client, environment=ENV)
        self.assertEqual(client.writes()[-1][2]["state"], "open")
        self.assertEqual(sum(x[0] == "POST" for x in client.writes()), 1)

    def test_unknown_error_text_and_malicious_url_are_never_published(self):
        for error in ("secret=VERY_PRIVATE", ["secret"], {"token": "secret"}):
            summary = ops.safe_failure({"error_code": error})
            self.assertEqual(summary["reason_code"], "UPDATER_FAILED")
            self.assertNotIn("secret", json.dumps(summary))
        client = FakeClient()
        with self.assertRaisesRegex(ops.OpsError, "RUN_URL_INVALID"):
            ops.notify_failure(self.report(), "https://evil.example/token", client=client, environment=ENV)
        self.assertEqual(client.calls, [])

    def test_duplicate_tracking_issues_fail_without_overwriting_either(self):
        client = FakeClient()
        ops.notify_failure(self.report(), RUN, client=client, environment=ENV)
        client.issues.append({**client.issues[0], "number": 778})
        before = len(client.writes())
        with self.assertRaisesRegex(ops.OpsError, "DUPLICATE_TRACKING_ISSUES"):
            ops.notify_failure(self.report(), RUN, client=client, environment=ENV)
        self.assertEqual(len(client.writes()), before)

    def test_early_workflow_failure_without_report_still_creates_safe_notice(self):
        client = FakeClient()
        with tempfile.TemporaryDirectory() as folder, \
                patch.dict(ops.os.environ, ENV, clear=True), \
                patch.object(ops.GitHubClient, "from_environment", return_value=client), \
                redirect_stdout(io.StringIO()) as output:
            code = ops.main(["notify-failure", "--report", str(Path(folder) / "absent.json"),
                             "--run-url", RUN])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(output.getvalue())["status"], "FAILURE_ISSUE_CREATED")
        self.assertIn("UPDATER_FAILED", client.issues[0]["body"])
        self.assertNotIn("MASTER가 먼저 갱신", client.issues[0]["body"])

    def test_preflight_failure_receipt_can_explain_missing_updater_receipt(self):
        client = FakeClient()
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "preflight.json"
            path.write_text(json.dumps({"error_code": "PAGES_NOT_BRANCH_MAIN"}))
            with patch.dict(ops.os.environ, ENV, clear=True), \
                    patch.object(ops.GitHubClient, "from_environment", return_value=client), \
                    redirect_stdout(io.StringIO()):
                code = ops.main(["notify-failure", "--report", str(Path(folder) / "absent.json"),
                                 "--ops-report", str(path), "--run-url", RUN])
        self.assertEqual(code, 0)
        self.assertIn("PAGES_NOT_BRANCH_MAIN", client.issues[0]["body"])


class TransportTests(unittest.TestCase):
    def test_pages_inspection_is_read_only_in_unapproved_pr(self):
        client = FakeClient()
        env = {"GITHUB_EVENT_NAME": "pull_request", "GITHUB_REF": "refs/pull/1/merge",
               "GITHUB_REPOSITORY": ops.REPOSITORY, "KVL_VLEAGUE_PUBLISH_APPROVED": "false"}
        result = ops.inspect_pages(client=client, environment=env)
        self.assertEqual(result["status"], "PAGES_CONFIG_VERIFIED")
        self.assertEqual([(method, path) for method, path, _ in client.calls],
                         [("GET", ops.PREFIX), ("GET", ops.PREFIX + "/pages")])
        self.assertEqual(client.writes(), [])

    def test_pages_inspection_rejects_bad_configuration_without_mutation(self):
        for change in ({"build_type": "workflow"}, {"source": {"branch": "main", "path": "/docs"}},
                       {"source": {"branch": "other", "path": "/"}}, {"cname": "other.example"}):
            client = FakeClient(); client.pages.update(change)
            with self.assertRaises(ops.OpsError): ops.inspect_pages(client=client, environment={})
            self.assertEqual(client.writes(), [])
        client = FakeClient(); client.repository["default_branch"] = "other"
        with self.assertRaisesRegex(ops.OpsError, "BAD_REPOSITORY"):
            ops.inspect_pages(client=client, environment={})

    def test_pages_inspection_cli_writes_only_sanitized_receipt(self):
        client = FakeClient()
        client.pages["private_field"] = "DO_NOT_COPY"
        with tempfile.TemporaryDirectory() as folder, \
                patch.dict(ops.os.environ, {"GITHUB_EVENT_NAME": "pull_request"}, clear=True), \
                patch.object(ops.GitHubClient, "from_environment", return_value=client), \
                redirect_stdout(io.StringIO()) as output:
            path = Path(folder) / "pages.json"
            result = ops.main(["inspect-pages", "--report", str(path)])
            written = path.read_text()
        self.assertEqual(result, 0)
        self.assertEqual(json.loads(written)["status"], "PAGES_CONFIG_VERIFIED")
        self.assertNotIn("DO_NOT_COPY", written + output.getvalue())
        self.assertEqual(client.writes(), [])

    def test_endpoint_allowlist_rejects_other_repo_settings_and_raw_upload(self):
        for method, path in (("POST", "/repos/other/repo/issues"), ("DELETE", ops.PREFIX + "/pages"),
                             ("PUT", ops.PREFIX + "/contents/file"), ("POST", ops.PREFIX + "/pages"),
                             ("GET", ops.PREFIX + "/issues?state=all&per_page=100&page=1&token=secret")):
            with self.assertRaisesRegex(ops.OpsError, "INVALID_ENDPOINT"): ops.validate_endpoint(method, path)

    def test_http_failure_never_discloses_token_or_response_body(self):
        class Opener:
            def open(self, request, timeout):
                raise HTTPError(request.full_url, 403, "SECRET BODY", {}, io.BytesIO(b"SECRET BODY"))
        client = ops.GitHubClient("SECRET TOKEN", opener=Opener())
        with self.assertRaises(ops.OpsError) as found:
            client.request("GET", ops.PREFIX + "/pages")
        self.assertEqual(str(found.exception), "HTTP_403")
        self.assertNotIn("SECRET", str(found.exception))

    def test_redirects_do_not_forward_authentication(self):
        with self.assertRaisesRegex(ops.OpsError, "REDIRECT_BLOCKED"):
            ops.NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.example/")

    def test_missing_token_fails_before_network(self):
        with self.assertRaisesRegex(ops.OpsError, "TOKEN_MISSING"):
            ops.GitHubClient.from_environment({})

    def test_non_json_numeric_literals_are_rejected(self):
        with self.assertRaisesRegex(ops.OpsError, "RESPONSE_INVALID"): ops.decode_json('{"score":NaN}')


if __name__ == "__main__":
    unittest.main()

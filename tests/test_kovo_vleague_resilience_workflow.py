"""Partial source recovery preserves approval gates and honest failure reports."""
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import textwrap
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "tests"))
import kovo_vleague_ops as ops
from test_kvl_player_current_value_workflow import named_blocks, condition, permitted, trusted_context

RUN = "https://github.com/kvolleylab/kvolleylab/actions/runs/12345"


class ResilienceWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = (ROOT / ".github/workflows/vleague-auto-update-v1.yml").read_text()
        cls.jobs = named_blocks(cls.text.split("\njobs:\n", 1)[1], r"^  ([a-z_]+):\s*$")

    def test_source_isolation_does_not_relax_publish_approval_or_main_guards(self):
        expression = condition(self.jobs["publish"])
        base = trusted_context(**{"inputs.publish": True, "inputs.match_only": True})
        self.assertTrue(permitted(expression, base))
        self.assertTrue(permitted(expression, {**base, "github.event_name": "schedule"}))
        for changes in (
            {"inputs.publish": False}, {"github.repository": "untrusted/fork"},
            {"github.ref": "refs/heads/fix/test"}, {"github.event_name": "pull_request"},
            {"vars.KVL_VLEAGUE_UPDATE_APPROVED": "false"},
            {"needs.lifecycle.result": "failure"}, {"needs.lifecycle.outputs.allow_update": "false"},
            {"needs.check.result": "failure"}, {"inputs.player_master_access_check": True},
            {"inputs.player_current_value_check": True},
        ):
            with self.subTest(changes=changes):
                self.assertFalse(permitted(expression, {**base, **changes}))

    def test_preview_and_publisher_both_use_fresh_isolated_source_reads(self):
        for name, publishing in (("check", False), ("publish", True)):
            commands = [line for line in self.jobs[name].splitlines()
                        if "run: python -B scripts/kovo_vleague_update.py " in line]
            self.assertEqual(len(commands), 1, name)
            command = commands[0]
            self.assertIn("--isolate-divisions", command)
            self.assertEqual("--publish" in command, publishing)
            if publishing:
                self.assertIn("--verify-candidate-ui", command)
            self.assertNotIn("--source-file", command)
            self.assertNotIn("--master-snapshot", command)
        self.assertNotIn("continue-on-error:", self.jobs["check"])
        self.assertNotIn("continue-on-error:", self.jobs["publish"])

    def test_partial_failure_is_terminal_after_deployment_and_saved_receipts(self):
        publish = self.jobs["publish"]
        deploy = publish.index("scripts/kovo_vleague_ops.py deploy")
        receipts = publish.index("- name: Keep sanitized publication receipts only")
        terminal = publish.index("- name: Report held divisions or incomplete points after verified partial publication")
        self.assertLess(deploy, receipts)
        self.assertLess(receipts, terminal)
        self.assertIn("if: always()", publish[receipts:terminal])
        self.assertIn("report.json", publish[receipts:terminal])
        self.assertIn("source-observations.json", publish[receipts:terminal])
        self.assertIn("deploy.json", publish[receipts:terminal])
        block = publish[terminal:]
        self.assertIn("if: steps.window.outputs.allow_update == 'true'", block)
        self.assertNotIn("continue-on-error", block)
        script = re.search(r"python -B - <<'PY'\n(.*?)\n          PY", block, re.S)
        self.assertIsNotNone(script)
        code = compile(textwrap.dedent(script.group(1)), "workflow-partial-failure", "exec")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "kvl-vleague-publish/report.json"
            path.parent.mkdir()
            with patch.dict(os.environ, {"RUNNER_TEMP": directory}):
                path.write_text(json.dumps({"held_divisions": []}))
                exec(code, {})
                for held in (["MALE"], ["FEMALE"], ["MALE", "FEMALE"]):
                    path.write_text(json.dumps({"held_divisions": held}))
                    with self.subTest(held=held), self.assertRaisesRegex(SystemExit, "PARTIAL_SOURCE_FAILURE"):
                        exec(code, {})
                path.write_text(json.dumps({"held_divisions": [], "incomplete_live_points": [
                    {"source_key": "023:001:FEMALE:40", "expected_sets": 2, "verified_sets": 1}]}))
                with self.assertRaisesRegex(SystemExit, "LIVE_POINTS_INCOMPLETE"):
                    exec(code, {})
                path.write_text(json.dumps({"held_divisions": [], "incomplete_live_points": []}))
                exec(code, {})

    def test_pending_standings_fail_after_publication_without_echoing_raw_values(self):
        block = self.jobs["publish"].split("- name: Report held divisions or incomplete points after verified partial publication", 1)[1]
        script = re.search(r"python -B - <<'PY'\n(.*?)\n          PY", block, re.S)
        code = compile(textwrap.dedent(script.group(1)), "workflow-standings-pending", "exec")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "kvl-vleague-publish/report.json"
            path.parent.mkdir()
            with patch.dict(os.environ, {"RUNNER_TEMP": directory}):
                for pending in ([], ["MALE"], ["FEMALE"], ["MALE", "FEMALE"],
                                None, {}, False, "PRIVATE_DIAGNOSTIC", [{"raw_master": "PRIVATE_DIAGNOSTIC"}]):
                    with self.subTest(pending=pending):
                        path.write_text(json.dumps({"status": "PARTIAL_READY" if pending else "READY",
                            "held_divisions": [], "incomplete_live_points": [],
                            "standings_reconciliation_pending": pending}))
                        if pending == []:
                            exec(code, {})
                        else:
                            with self.assertRaisesRegex(SystemExit, "STANDINGS_RECONCILIATION_PENDING") as caught:
                                exec(code, {})
                            self.assertNotIn("PRIVATE_DIAGNOSTIC", str(caught.exception))

    def test_terminal_partial_failure_reaches_the_existing_deduplicated_notifier(self):
        expression = condition(self.jobs["notify_failure"])
        base = trusted_context(**{"inputs.publish": True, "inputs.match_only": True,
                                  "needs.publish.result": "failure"})
        self.assertTrue(permitted(expression, base))
        self.assertFalse(permitted(expression, {**base, "needs.publish.result": "success"}))
        for key, value in (("vars.KVL_VLEAGUE_UPDATE_APPROVED", "false"),
                           ("github.ref", "refs/heads/fix/test"),
                           ("github.repository", "untrusted/fork"),
                           ("inputs.player_master_access_check", True)):
            with self.subTest(key=key):
                self.assertFalse(permitted(expression, {**base, key: value}))


class PartialFailureReportingTests(unittest.TestCase):
    def report(self, **changes):
        result = {"status": "PARTIAL_READY", "error_code": "PartialSourceError",
                  "held_divisions": ["FEMALE"], "master_written": False,
                  "master_readback_verified": True, "production_written": False}
        result.update(changes)
        return result

    def body(self, report, deployment=None):
        return ops.issue_body(ops.safe_failure(report, deployment), RUN, "a" * 64)

    def test_partial_failure_reports_only_allowlisted_divisions_not_raw_errors(self):
        secret = "not-a-real-secret-do-not-copy"
        report = self.report(held_divisions=["FEMALE", secret, {"token": secret}, "MALE", "FEMALE"],
                             division_failures={"FEMALE": {"error_code": secret}},
                             error_message=secret, raw_master_values=[[secret]],
                             divisions={"MALE": {"matched": 126, "completed": True, "changed_matches": 999}})
        safe = ops.safe_failure(report)
        self.assertEqual(safe["reason_code"], "PARTIAL_SOURCE_FAILURE")
        self.assertEqual(safe["held_divisions"], ["MALE", "FEMALE"])
        self.assertEqual(safe["counts"], {"MALE": {"matched": 126}})
        self.assertNotIn(secret, json.dumps(safe))
        self.assertNotIn(secret, self.body(report))

    def test_malformed_held_division_data_cannot_become_alert_text(self):
        for held in ("FEMALE\nAuthorization: private", {"MALE": "private"}, None, 1):
            with self.subTest(held=held):
                safe = ops.safe_failure(self.report(held_divisions=held))
                self.assertEqual(safe["held_divisions"], [])
                self.assertNotIn("private", json.dumps(safe))

    def test_preview_partial_report_does_not_claim_successful_publication(self):
        body = self.body(self.report())
        self.assertIn("FEMALE", body)
        self.assertNotIn("Pages 게시를 확인했습니다", body)
        self.assertIn("Pages 게시는 아직 확인되지 않았습니다", body)

    def test_local_write_without_deploy_receipt_does_not_claim_site_publication(self):
        report = self.report(master_written=True, production_written=True)
        body = self.body(report, {"status": "PREFLIGHT_OK"})
        self.assertNotIn("Pages 게시를 확인했습니다", body)
        self.assertIn("Pages 게시는 아직 확인되지 않았습니다", body)

    def test_verified_partial_deployment_reports_publication_and_remaining_failure(self):
        report = self.report(master_written=True, production_written=True)
        deployment = {"status": "DEPLOYED_VERIFIED", "expected_sha": "a" * 40,
                      "built_sha": "a" * 40}
        safe = ops.safe_failure(report, deployment)
        body = ops.issue_body(safe, RUN, "b" * 64)
        self.assertEqual(safe["reason_code"], "PARTIAL_SOURCE_FAILURE")
        self.assertTrue(safe["site_deployment_verified"])
        self.assertFalse(safe["master_may_be_ahead"])
        self.assertIn("Pages 게시를 확인했습니다", body)
        self.assertIn("보류 부문: FEMALE", body)
        self.assertIn("기존 관측시각은 갱신하지 않았습니다", body)

    def test_deployment_failure_takes_precedence_over_partial_source_report(self):
        report = self.report(master_written=True, production_written=True)
        safe = ops.safe_failure(report, {"status": "FAILED", "error_code": "BUILD_FAILED"})
        self.assertEqual(safe["reason_code"], "BUILD_FAILED")
        self.assertTrue(safe["master_may_be_ahead"])
        self.assertNotIn("Pages 게시를 확인했습니다", ops.issue_body(safe, RUN, "c" * 64))

    def test_unknown_error_never_leaks_as_a_reason_code(self):
        safe = ops.safe_failure(self.report(error_code="arbitrary private error"))
        self.assertEqual(safe["reason_code"], "UPDATER_FAILED")
        self.assertNotIn("arbitrary private error", json.dumps(safe))

    def test_incomplete_points_remain_a_failure_after_verified_wins_publication(self):
        report = self.report(error_code="IncompleteLivePoints", held_divisions=[],
                             production_written=True, incomplete_live_points=[{
                                 "source_key": "023:001:FEMALE:40", "expected_sets": 3,
                                 "verified_sets": 1, "raw_response": "private ignored text"}])
        safe = ops.safe_failure(report, {"status": "DEPLOYED_VERIFIED"})
        self.assertEqual(safe["reason_code"], "LIVE_POINTS_INCOMPLETE")
        self.assertEqual(safe["incomplete_live_points"], [{
            "source_key": "023:001:FEMALE:40", "expected_sets": 3, "verified_sets": 1}])
        body = ops.issue_body(safe, RUN, "d" * 64)
        self.assertIn("종료세트 득점 일부가 미확인", body)
        self.assertIn("1/3세트 득점 검증", body)
        self.assertIn("Pages 게시 확인: true", body)
        self.assertNotIn("private ignored text", body)

    def test_incomplete_preview_does_not_claim_pages_verification(self):
        report = self.report(error_code="IncompleteLivePoints", held_divisions=[],
                             incomplete_live_points=[{"source_key": "023:001:MALE:39",
                                                      "expected_sets": 2, "verified_sets": 1}])
        self.assertIn("Pages 게시 확인: false", self.body(report))

    def test_invalid_points_diagnostics_cannot_leak_or_be_reported_as_verified(self):
        valid = {"source_key": "023:001:FEMALE:40", "expected_sets": 3, "verified_sets": 1}
        invalid = [
            {**valid, "source_key": "023:001:FEMALE:40\nprivate"},
            {**valid, "source_key": "private"}, {**valid, "source_key": "023:001:FEMALE:1001"},
            {**valid, "source_key": "023:001:FEMALE:0"},
            {**valid, "expected_sets": True}, {**valid, "verified_sets": True},
            {**valid, "expected_sets": 6}, {**valid, "verified_sets": -1},
            {**valid, "verified_sets": 3}, {**valid, "verified_sets": "1"},
            None, "private",
        ]
        for item in invalid:
            with self.subTest(item=item):
                report = self.report(error_code="IncompleteLivePoints", held_divisions=[],
                                     incomplete_live_points=[item])
                safe = ops.safe_failure(report)
                self.assertEqual(safe["incomplete_live_points"], [])
                self.assertNotIn("private", json.dumps(safe))
        report = self.report(error_code="IncompleteLivePoints", held_divisions=[],
                             incomplete_live_points=[valid] * 10)
        self.assertEqual(len(ops.safe_failure(report)["incomplete_live_points"]), 4)

    def test_held_division_and_other_division_incomplete_points_are_both_reported(self):
        report = self.report(held_divisions=["FEMALE"], incomplete_live_points=[{
            "source_key": "023:001:MALE:39", "expected_sets": 2, "verified_sets": 1}])
        safe = ops.safe_failure(report)
        self.assertEqual(safe["reason_code"], "PARTIAL_SOURCE_FAILURE")
        body = ops.issue_body(safe, RUN, "e" * 64)
        self.assertIn("보류 부문: FEMALE", body)
        self.assertIn("023:001:MALE:39: 1/2세트 득점 검증", body)

    def test_master_failure_overrides_incomplete_score_diagnostics(self):
        report = self.report(error_code="MasterError", held_divisions=["FEMALE"],
                             incomplete_live_points=[{"source_key": "023:001:MALE:39",
                                                      "expected_sets": 2, "verified_sets": 1}])
        safe = ops.safe_failure(report)
        self.assertEqual(safe["reason_code"], "MASTER_SYNC_FAILED")
        self.assertNotIn("site_deployment_verified", safe)
        self.assertNotIn("Pages 게시를 확인했습니다", ops.issue_body(safe, RUN, "f" * 64))


if __name__ == "__main__":
    unittest.main()

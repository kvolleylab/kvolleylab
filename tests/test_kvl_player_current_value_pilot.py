"""Runtime boundaries, using in-memory Sheets and fixed official evidence only."""
import contextlib
import copy
from datetime import timedelta
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "tests"))
import kvl_player_current_value as current
import kvl_player_current_value_pilot as runtime
from test_kvl_player_current_value import FakeClient, NOW, fixture


def environment():
    return {"GITHUB_ACTIONS": "true", "GITHUB_REPOSITORY": current.REPOSITORY,
            "GITHUB_REF": "refs/heads/main", "GITHUB_WORKFLOW_REF": current.WORKFLOW_REF,
            "GITHUB_EVENT_NAME": "workflow_dispatch", "KVL_PLAYER_CURRENT_VALUE_CHECK": "true",
            "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": current.SERVICE_ACCOUNT,
            "GITHUB_RUN_ID": "41444659755", "GITHUB_RUN_ATTEMPT": "1"}


def evidence():
    value = fixture()[0]
    value["current"]["normalized_sha256"] = runtime.CURRENT_NORMALIZED_SHA256
    return value


class CurrentValueRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / "checkout"
        for relative in (runtime.PILOT_PATH, runtime.TARGETS_PATH, runtime.EVENT_PILOT_PATH, runtime.MONITORING_PATH):
            destination = self.root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
        self.env = environment()
        self.proof = evidence()
        _, master, journal = fixture()
        self.client = FakeClient(master, journal)
        self.fetch = mock.Mock(side_effect=lambda: copy.deepcopy(self.proof))
        self.factory = mock.Mock(return_value=self.client)

    def update_config(self, relative, edit):
        path = self.root / relative
        data = json.loads(path.read_text())
        edit(data)
        path.write_text(json.dumps(data), encoding="utf-8")

    def run_record(self, **kwargs):
        options = {"environment": self.env, "now": NOW, "source_fetch": self.fetch, "client_factory": self.factory}
        options.update(kwargs)
        return runtime.record_verification(self.root, self.proof, **options)

    def assert_sanitized(self, report):
        serialized = json.dumps(report, ensure_ascii=False)
        for forbidden in ("PRIVATE", "Bearer ", "raw-server-response", "1992-04-02", "1992.04.02",
                          "plan_hash", "expected_master", current.SERVICE_ACCOUNT):
            self.assertNotIn(forbidden, serialized)
        self.assertEqual(report["player_cells_changed"], 0)
        self.assertEqual(report["event_journal_rows_added"], 0)
        self.assertEqual(report["roster_files_changed"], 0)
        self.assertFalse(report["publication_performed"])
        self.assertIsNone(report["effective_date"])
        self.assertEqual(report["effective_date_status"], "unknown")

    def assert_no_remote(self, report):
        self.assertFalse(report["ready"])
        self.assertFalse(report["service_client_creation_attempted"])
        self.assertFalse(report["write_attempted"])
        self.fetch.assert_not_called()
        self.factory.assert_not_called()
        self.assertEqual(self.client.appends, [])
        self.assert_sanitized(report)

    def test_preflight_requires_no_token_source_fetch_or_client(self):
        with mock.patch.object(runtime, "collect_source_evidence", side_effect=AssertionError("must not fetch")), \
             mock.patch.object(current.CurrentValueSheetsClient, "from_environment", side_effect=AssertionError("must not auth")):
            result = runtime.preflight(self.root, environment=self.env, now=NOW)
        self.assertTrue(result["ready"])
        self.assertTrue(result["github_runtime_verified"])
        self.assertFalse(result["service_client_creation_attempted"])
        self.assertFalse(result["service_client_created"])
        self.assertFalse(result["workflow_authentication_precedes_record"])
        self.assertEqual(result["github_runtime"]["run_id"], "41444659755")
        self.assertNotIn("attempt", result["github_runtime"])
        self.assert_sanitized(result)

    def test_every_trusted_context_gate_blocks_before_source_or_auth(self):
        replacements = {"GITHUB_ACTIONS": "false", "GITHUB_REPOSITORY": "fork/kvolleylab",
                        "GITHUB_REF": "refs/heads/feature", "GITHUB_WORKFLOW_REF": current.WORKFLOW_REF.replace("main", "feature"),
                        "GITHUB_EVENT_NAME": "schedule", "KVL_PLAYER_CURRENT_VALUE_CHECK": "false",
                        "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": "wrong", "GITHUB_RUN_ID": "native-123"}
        for key, value in replacements.items():
            with self.subTest(key=key):
                env = dict(self.env, **{key: value})
                self.assert_no_remote(self.run_record(environment=env))
                missing = dict(self.env)
                del missing[key]
                self.assert_no_remote(self.run_record(environment=missing))
        for value in ("", "0", "-12", "1.2", "12\nready=true", "1" * 26, 123):
            with self.subTest(run_id=value):
                self.assert_no_remote(self.run_record(environment=dict(self.env, GITHUB_RUN_ID=value)))

    def test_fixed_approval_scope_and_capabilities_are_not_widenable(self):
        path = self.root / runtime.PILOT_PATH
        original = path.read_bytes()
        mutations = [lambda x: x.update(enabled=False), lambda x: x.update(enabled=1),
                     lambda x: x.update(execution_mode="schedule"), lambda x: x.update(approved_on="2026-11-02"),
                     lambda x: x.update(reviewer="KVL-OP-OTHER"), lambda x: x.update(expected_current_sha256="0" * 64),
                     lambda x: x["scope"].update(player_id="KVL-P-001586"), lambda x: x["scope"].update(value="3"),
                     lambda x: x.update(effective_date="2026-09-16"), lambda x: x.update(player_cell_writes=True),
                     lambda x: x.update(event_journal_writes=True), lambda x: x.update(automatic_schedule=True),
                     lambda x: x.update(publication=True), lambda x: x.update(maximum_observation_age_seconds=3600),
                     lambda x: x.update(unapproved_extra=True)]
        for number, edit in enumerate(mutations):
            with self.subTest(mutation=number):
                path.write_bytes(original)
                self.update_config(runtime.PILOT_PATH, edit)
                self.assert_no_remote(self.run_record())

    def test_event_pilot_must_stay_disabled_and_target_must_stay_fixed(self):
        for relative, edit in (
            (runtime.EVENT_PILOT_PATH, lambda x: x.update(enabled=True)),
            (runtime.EVENT_PILOT_PATH, lambda x: x.update(event_scope={"player_id": current.SCOPE["player_id"]})),
            (runtime.EVENT_PILOT_PATH, lambda x: x.update(status="APPROVED")),
            (runtime.TARGETS_PATH, lambda x: x["targets"][0].update(sheet_id=current.JOURNAL_ID)),
            (runtime.TARGETS_PATH, lambda x: x.update(header_row=1)),
            (runtime.TARGETS_PATH, lambda x: x["targets"].append(copy.deepcopy(x["targets"][0]))),
        ):
            with self.subTest(relative=relative, edit=edit):
                path = self.root / relative
                original = path.read_bytes()
                self.update_config(relative, edit)
                self.assert_no_remote(self.run_record())
                path.write_bytes(original)

    def test_existing_monitoring_start_review_and_end_gates_apply(self):
        from datetime import datetime, timezone
        for value in (datetime(2026, 10, 31, tzinfo=timezone.utc),
                      datetime(2027, 6, 1, tzinfo=timezone.utc), datetime(2027, 11, 1, tzinfo=timezone.utc)):
            with self.subTest(now=value):
                self.assert_no_remote(self.run_record(now=value))
        self.update_config(runtime.MONITORING_PATH, lambda x: x["monitoring_window"].update(enabled=False))
        self.assert_no_remote(self.run_record())

    def test_local_config_duplicate_keys_and_symlinks_block(self):
        path = self.root / runtime.PILOT_PATH
        path.write_text('{"enabled": true, "enabled": false}')
        self.assert_no_remote(self.run_record())
        path.unlink()
        path.symlink_to(ROOT / runtime.PILOT_PATH)
        self.assert_no_remote(self.run_record())

    def test_collect_returns_only_validated_evidence_without_authentication(self):
        report, proof = runtime.collect_evidence(self.root, environment=self.env, now=NOW, source_fetch=self.fetch)
        self.assertTrue(report["ready"])
        self.assertEqual(report["status"], "OFFICIAL_EVIDENCE_READY")
        self.assertEqual(proof, self.proof)
        self.fetch.assert_called_once_with()
        self.factory.assert_not_called()
        self.assertFalse(report["service_client_creation_attempted"])
        self.assertFalse(report["workflow_authentication_precedes_record"])
        self.assert_sanitized(report)

    def test_stale_or_revised_prepared_evidence_blocks_even_fresh_source_requests(self):
        mutations = [lambda x: x.update(observed_at=current.timestamp(NOW - timedelta(minutes=6))),
                     lambda x: x["notice"].update(html_sha256="f" * 64),
                     lambda x: x["current"].update(normalized_sha256="f" * 64),
                     lambda x: x["current"].update(number="3"),
                     lambda x: x.update(private_note="PRIVATE SECRET")]
        for edit in mutations:
            with self.subTest(edit=edit):
                original = copy.deepcopy(self.proof)
                edit(self.proof)
                result = self.run_record()
                self.assertEqual(result["stage"], "prepared_evidence")
                self.assert_no_remote(result)
                self.proof = original

    def test_fresh_source_must_reconfirm_the_prepared_semantic_revision(self):
        fresh = copy.deepcopy(self.proof)
        fresh["current"]["season_context_sha256"] = "b" * 64
        self.fetch.side_effect = lambda: fresh
        result = self.run_record()
        self.assertEqual(result["reason"], "official_evidence_changed_between_fetches")
        self.assertFalse(result["service_client_creation_attempted"])
        self.factory.assert_not_called()
        self.assertEqual(self.client.appends, [])
        self.assert_sanitized(result)

    def test_current_value_record_writes_only_one_separate_row_and_proves_github_origin(self):
        original_files = {path: path.read_bytes() for path in self.root.rglob("*.json")}
        original_master = copy.deepcopy(self.client.master)
        result = self.run_record()
        self.assertEqual(result["status"], "CURRENT_VALUE_RECORD_READBACK_VERIFIED")
        self.assertEqual(result["record_rows_added"], 1)
        self.assertEqual(result["execution_origin"], "github_actions")
        self.assertTrue(result["github_runtime_verified"])
        self.assertTrue(result["github_service_account_readback_verified"])
        self.assertTrue(result["workflow_authentication_precedes_record"])
        self.assertTrue(result["service_client_creation_attempted"])
        self.assertTrue(result["service_client_created"])
        self.assertTrue(result["master_read_range_unchanged"])
        self.assertTrue(result["verification_record_readback_verified"])
        self.assertEqual(self.client.master, original_master)
        self.assertEqual(len(self.client.appends), 1)
        self.assertEqual(self.client.appends[0][current.HEADERS.index("run_id")], self.env["GITHUB_RUN_ID"])
        self.assertEqual(self.factory.call_args.kwargs["mode"], "record")
        self.assertEqual(self.factory.call_args.kwargs["expected_current_sha256"], runtime.CURRENT_NORMALIZED_SHA256)
        self.assertEqual(original_files, {path: path.read_bytes() for path in self.root.rglob("*.json")})
        self.assert_sanitized(result)

    def test_same_run_retry_is_idempotent_across_attempt_and_fetch_time_changes(self):
        first = self.run_record()
        self.env["GITHUB_RUN_ATTEMPT"] = "2"
        self.proof["observed_at"] = current.timestamp(NOW - timedelta(seconds=2))
        self.proof["notice"]["fetched_at"] = current.timestamp(NOW - timedelta(seconds=5))
        self.proof["current"]["fetched_at"] = current.timestamp(NOW - timedelta(seconds=4))
        self.proof["current"]["profile_fetched_at"] = current.timestamp(NOW - timedelta(seconds=3))
        retry = self.run_record()
        self.assertEqual(retry["action"], "already_verified")
        self.assertEqual(retry["record_rows_added"], 0)
        self.assertFalse(retry["write_attempted"])
        self.assertEqual(retry["verification_id"], first["verification_id"])
        self.assertEqual(retry["observed_at"], first["observed_at"])
        self.assertEqual(len(self.client.appends), 1)
        self.env["GITHUB_RUN_ID"] = "41444659756"
        another = self.run_record()
        self.assertEqual(another["record_rows_added"], 1)
        self.assertNotEqual(another["verification_id"], first["verification_id"])
        self.assertEqual(len(self.client.appends), 2)

    def mutate_before_append(self, action):
        original = self.client.read_verification_journal
        calls = []

        def read():
            result = original()
            calls.append(True)
            if len(calls) == 2:
                action()
            return result
        self.client.read_verification_journal = read

    def test_config_window_and_context_rechecked_immediately_before_append(self):
        actions = [
            lambda: self.update_config(runtime.PILOT_PATH, lambda x: x.update(enabled=False)),
            lambda: self.update_config(runtime.MONITORING_PATH, lambda x: x["monitoring_window"].update(enabled=False)),
            lambda: self.update_config(runtime.TARGETS_PATH, lambda x: x.update(verification_basis="Changed during execution")),
            lambda: self.env.update(GITHUB_EVENT_NAME="schedule"),
            lambda: self.env.update(GITHUB_RUN_ID="41444659999"),
        ]
        originals = {path: path.read_bytes() for path in self.root.rglob("*.json")}
        for number, action in enumerate(actions):
            with self.subTest(change=number):
                self.env = environment()
                for path, body in originals.items():
                    path.write_bytes(body)
                _, master, journal = fixture()
                self.client = FakeClient(master, journal)
                self.factory.return_value = self.client
                self.mutate_before_append(action)
                result = self.run_record()
                self.assertEqual(result["stage"], "pre_append_recheck")
                self.assertFalse(result["write_attempted"])
                self.assertEqual(result["record_rows_added"], 0)
                self.assertEqual(self.client.appends, [])
                self.assert_sanitized(result)

    def test_clock_advancing_beyond_five_minutes_before_append_blocks(self):
        clock = [NOW]
        self.mutate_before_append(lambda: clock.__setitem__(0, NOW + timedelta(minutes=6)))
        result = self.run_record(now=lambda: clock[0])
        self.assertEqual(result["stage"], "pre_append_recheck")
        self.assertEqual(result["reason"], "official_evidence_invalid_or_stale_before_append")
        self.assertFalse(result["write_attempted"])
        self.assertEqual(self.client.appends, [])

    def test_config_changed_during_source_fetch_blocks_client_construction(self):
        def fetch():
            self.update_config(runtime.TARGETS_PATH, lambda x: x.update(verified_on="2026-11-03"))
            return self.proof
        result = self.run_record(source_fetch=fetch)
        self.assertEqual(result["reason"], "configuration_changed_during_run")
        self.factory.assert_not_called()
        self.assertFalse(result["service_client_creation_attempted"])

    def test_unexpected_source_auth_and_sheet_failures_never_echo_raw_text(self):
        leak = "PRIVATE Bearer SECRET raw-server-response user@example.com"
        failures = ["source", "auth", "read", "prepare"]
        for stage in failures:
            with self.subTest(stage=stage):
                self.fetch = mock.Mock(side_effect=lambda: copy.deepcopy(self.proof))
                _, master, journal = fixture()
                self.client = FakeClient(master, journal)
                self.factory = mock.Mock(return_value=self.client)
                if stage == "source":
                    self.fetch.side_effect = RuntimeError(leak)
                elif stage == "auth":
                    self.factory.side_effect = RuntimeError(leak)
                elif stage == "read":
                    self.client.read_snapshot = mock.Mock(side_effect=RuntimeError(leak))
                else:
                    self.client.master["rows"][0]["values"][1] = 3
                result = self.run_record()
                self.assertFalse(result["ready"])
                self.assertFalse(result["write_attempted"])
                self.assertTrue(result["workflow_authentication_precedes_record"])
                self.assertEqual(result["service_client_created"], stage in {"read", "prepare"})
                self.assertEqual(self.client.appends, [])
                self.assert_sanitized(result)

    def test_lost_write_response_uses_readback_without_second_append(self):
        self.client.response_lost = True
        result = self.run_record()
        self.assertEqual(result["status"], "CURRENT_VALUE_RECORD_READBACK_VERIFIED")
        self.assertTrue(result["uncertain_write_response"])
        self.assertEqual(len(self.client.appends), 1)
        self.assert_sanitized(result)

    def test_unverified_write_reports_unknown_row_count_instead_of_zero_or_success(self):
        self.client.response_lost = True
        self.client.drop_write = True
        result = self.run_record()
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(result["write_attempted"])
        self.assertIsNone(result["record_rows_added"])
        self.assertEqual(result["record_state"], "UNVERIFIED_AFTER_WRITE_ATTEMPT")
        self.assertFalse(result["verification_record_readback_verified"])
        self.assertEqual(len(self.client.appends), 1)
        self.assert_sanitized(result)

    def cli(self, args):
        output = io.StringIO()
        with mock.patch.dict(runtime.os.environ, self.env, clear=True), \
             mock.patch.object(runtime, "_now", return_value=NOW), \
             mock.patch.object(runtime, "collect_source_evidence", self.fetch), \
             mock.patch.object(current.CurrentValueSheetsClient, "from_environment", self.factory), \
             contextlib.redirect_stdout(output):
            code = runtime.main(["--root", str(self.root), *args])
        return code, output.getvalue()

    def test_cli_ready_output_is_fixed_and_no_auth(self):
        output = self.base / "github_output"
        self.env["GITHUB_OUTPUT"] = str(output)
        code, stdout = self.cli(["--check-ready", "--github-output", str(output)])
        self.assertEqual(code, 0)
        self.assertEqual(output.read_text(), "ready=true\nreason=ready\n")
        self.fetch.assert_not_called()
        self.factory.assert_not_called()
        self.assertNotIn("PRIVATE", stdout)
        self.env["GITHUB_EVENT_NAME"] = "schedule"
        output.unlink()
        code, _ = self.cli(["--check-ready", "--github-output", str(output)])
        self.assertEqual(code, 0)
        self.assertEqual(output.read_text(), "ready=false\nreason=trusted_manual_runtime_required\n")

    def test_cli_collect_writes_minimal_proof_and_report_only_outside_checkout(self):
        output = self.base / "runtime" / "evidence.json"
        code, stdout = self.cli(["--collect-evidence", "--output", str(output)])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(output.read_text()), self.proof)
        report = json.loads(output.with_name("report.json").read_text())
        self.assert_sanitized(report)
        self.assertEqual({p.name for p in output.parent.iterdir()}, {"evidence.json", "report.json"})
        self.factory.assert_not_called()
        self.assertNotIn("fetched_at", stdout)

    def test_cli_failed_collection_removes_stale_proof_and_saves_sanitized_report(self):
        output = self.base / "runtime" / "evidence.json"
        output.parent.mkdir()
        output.write_text('{"stale": true}')
        self.fetch.side_effect = RuntimeError("PRIVATE Bearer SECRET raw-server-response")
        code, stdout = self.cli(["--collect-evidence", "--output", str(output)])
        self.assertEqual(code, 1)
        self.assertFalse(output.exists())
        report = json.loads(output.with_name("report.json").read_text())
        self.assertFalse(report["ready"])
        self.assert_sanitized(report)
        self.assertNotIn("PRIVATE", stdout)
        self.factory.assert_not_called()

    def test_cli_rejects_inside_checkout_nonjson_and_symlink_paths_before_any_requests(self):
        outside = self.base / "outside"
        outside.mkdir()
        link = self.base / "linked"
        link.symlink_to(outside, target_is_directory=True)
        paths = (self.root / "evidence.json", self.base / "evidence.txt", link / "evidence.json")
        for path in paths:
            with self.subTest(path=path):
                code, _ = self.cli(["--collect-evidence", "--output", str(path)])
                self.assertEqual(code, 2)
                self.fetch.assert_not_called()
                self.factory.assert_not_called()

    def test_cli_oversized_or_duplicate_prepared_json_fails_before_requests(self):
        proof_path, report_path = self.base / "evidence.json", self.base / "report.json"
        for body in (" " * (runtime.MAX_JSON_BYTES + 1), '{"scope": {}, "scope": {}}'):
            proof_path.write_text(body)
            code, stdout = self.cli(["--record", "--evidence", str(proof_path), "--output", str(report_path)])
            self.assertEqual(code, 2)
            self.fetch.assert_not_called()
            self.factory.assert_not_called()
            self.assert_sanitized(json.loads(report_path.read_text()))
            self.assertNotIn("scope", stdout)

    def test_artifact_failure_after_verified_append_preserves_actual_write_result(self):
        receipt = self.run_record()
        self.assertTrue(receipt["write_attempted"])
        evidence_path, report_path = self.base / "evidence.json", self.base / "report.json"
        evidence_path.write_text(json.dumps(self.proof))
        with mock.patch.object(runtime, "record_verification", return_value=receipt), \
             mock.patch.object(runtime, "_write_json", side_effect=OSError("PRIVATE raw-server-response")) as writer:
            code, stdout = self.cli(["--record", "--evidence", str(evidence_path), "--output", str(report_path)])
        self.assertEqual(code, 2)
        self.assertIn("write_attempted=true", stdout)
        self.assertIn("record_readback_verified=true", stdout)
        self.assertNotIn("PRIVATE", stdout)
        fallback = writer.call_args.args[2]
        self.assertEqual(fallback["result_before_artifact_error"], "CURRENT_VALUE_RECORD_READBACK_VERIFIED")
        self.assertTrue(fallback["write_attempted"])
        self.assertEqual(fallback["record_rows_added"], 1)
        self.assertTrue(fallback["verification_record_readback_verified"])
        self.assert_sanitized(fallback)


if __name__ == "__main__":
    unittest.main()

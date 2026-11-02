"""Disabled/invalid pilots make no requests; approved scope drives real modules."""
import copy
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "tests"))
import kvl_player_master_pilot as pilot
import kvl_player_updates as updates
from test_kvl_player_master_apply import fixture as writer_fixture, FakeClient, NOW

ENV = {"GITHUB_REPOSITORY": pilot.REPOSITORY, "GITHUB_REF": "refs/heads/main",
       "GITHUB_WORKFLOW_REF": pilot.WORKFLOW_REF, "GITHUB_EVENT_NAME": "schedule"}


def save(root, path, value):
    destination = root / path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")


def fixture(root, enabled=True, explicit_date=True):
    config, _, _, snapshot, journal, _ = writer_fixture()
    body = '<p>선수명 : 김테스트</p><p>변경전/변경후 : OH → L</p>'
    if explicit_date:
        body += '<p>적용일 : 2026-11-03</p>'
    raw = {"id": 42, "createdAt": "2026-11-01T00:00:00Z",
           "titles": [{"languageCode": "ko", "title": "2026-2027시즌 삼성화재 선수 포지션 변경"}],
           "bodies": [{"languageCode": "ko", "body": body}]}
    index = {"season": "2026-27", "notices": [pilot.normalize_detail(raw)]}
    candidate = updates.official_candidates(index)[0]
    review = {key: candidate[key] for key in ("candidate_id", "revision_id", "source_version", "source_url")}
    review.update(decision="approve", player_id="KVL-P-000001", identity_basis="canonical_id_review",
                  reviewer="KVL-OP-TEST", reviewed_at="2026-11-04", effective_date="2026-11-03",
                  effective_date_basis="official_notice_text", effective_date_evidence={
                      "source_url": candidate["source_url"], "locator": "paragraph:3", "asserted_date": "2026-11-03"})
    ledger, exported = updates.build_ledger(index, {}, [review], {"KVL-P-000001"})
    event = exported["events"][0]
    scope = {key: event[key] for key in pilot.SCOPE_FIELDS}
    event_scope = {key: event[key] for key in pilot.SCOPE_KEYS}
    config["pilot_scope"] = event_scope
    journal["scope"] = event_scope
    settings = {"schema_version": 1, "enabled": enabled,
                "status": "READY_FOR_PILOT" if enabled else "BLOCKED_EFFECTIVE_DATE_AND_RUNTIME_ACCESS",
                "scope": scope, "event_scope": event_scope if enabled else None}
    monitoring = {"monitoring_window": {"enabled": True, "season": "2026-27", "timezone": "Asia/Seoul",
                  "starts_on": "2026-11-01", "ends_on": "2027-10-31", "review_due_on": "2027-06-01"}}
    for path, value in ((pilot.PILOT_PATH, settings), (pilot.TARGETS_PATH, config), (pilot.EVENTS_PATH, exported),
                        (pilot.LEDGER_PATH, ledger), (pilot.MONITORING_PATH, monitoring)):
        save(root, path, value)
    return config, exported, ledger, snapshot, journal, raw


class PlayerPilotTests(unittest.TestCase):
    def setUp(self):
        self.checkout = tempfile.TemporaryDirectory()
        self.output = tempfile.TemporaryDirectory()
        self.addCleanup(self.checkout.cleanup)
        self.addCleanup(self.output.cleanup)
        self.root, self.out = Path(self.checkout.name), Path(self.output.name)

    def test_disabled_pilot_returns_before_loading_other_files_or_authentication(self):
        save(self.root, pilot.PILOT_PATH, {"schema_version": 1, "enabled": False,
             "status": "BLOCKED_EFFECTIVE_DATE_AND_RUNTIME_ACCESS", "scope": {}, "event_scope": None})
        def forbidden(*args, **kwargs):
            self.fail("disabled pilot attempted an external operation")
        report = pilot.run_pilot(self.root, self.out, environment=ENV, now=NOW,
                                 fetch_notice=forbidden, client_factory=forbidden, exporter=forbidden)
        self.assertEqual(report["status"], "BLOCKED")
        self.assertFalse(report["ready"])
        self.assertEqual(report["source_requests"], 0)
        self.assertFalse(report["authentication_attempted"])
        self.assertFalse((self.out / "receipt.json").exists())

    def test_enabled_without_approved_event_scope_still_blocks_before_other_files(self):
        save(self.root, pilot.PILOT_PATH, {"schema_version": 1, "enabled": True, "scope": {}, "event_scope": None})
        report = pilot.preflight(self.root, environment=ENV, now=NOW)
        self.assertEqual(report["reason"], "approved_event_scope_missing")

    def test_preflight_can_be_ready_without_calling_any_external_service(self):
        fixture(self.root)
        with patch.object(pilot, "detail", side_effect=AssertionError("network in preflight")):
            report = pilot.preflight(self.root, environment=ENV, now=NOW)
        self.assertTrue(report["ready"], report)
        self.assertEqual(report["source_requests"], 0)
        self.assertFalse(report["authentication_attempted"])

    def test_official_posted_date_does_not_enable_runtime_even_with_manual_review_date(self):
        fixture(self.root, explicit_date=False)
        report = pilot.preflight(self.root, environment=ENV, now=NOW)
        self.assertFalse(report["ready"])
        self.assertEqual(report["reason"], "explicit_effective_date_required")
        self.assertEqual(report["source_requests"], 0)

    def test_wrong_workflow_branch_repo_event_or_expired_window_are_blocked(self):
        for field, value in (("GITHUB_WORKFLOW_REF", "other"), ("GITHUB_REF", "refs/heads/feature/x"),
                             ("GITHUB_REPOSITORY", "fork/project"), ("GITHUB_EVENT_NAME", "pull_request")):
            fixture(self.root)
            report = pilot.preflight(self.root, environment={**ENV, field: value}, now=NOW)
            self.assertFalse(report["ready"])
            self.assertEqual(report["reason"], "trusted_runtime_context_required")
        fixture(self.root)
        monitoring = json.loads((self.root / pilot.MONITORING_PATH).read_text())
        monitoring["monitoring_window"]["review_due_on"] = "2026-11-04"
        save(self.root, pilot.MONITORING_PATH, monitoring)
        self.assertEqual(pilot.preflight(self.root, environment=ENV, now=NOW)["reason"], "player_monitoring_window_closed")

    def test_changed_source_revision_blocks_before_google_authentication(self):
        inputs = fixture(self.root)
        changed = copy.deepcopy(inputs[5])
        changed["bodies"][0]["body"] += "<p>공식 정정</p>"
        called = []
        def forbidden(*args):
            called.append("auth")
            self.fail("changed source must block authentication")
        report = pilot.run_pilot(self.root, self.out, environment=ENV, now=NOW,
                                 fetch_notice=lambda ident: changed, client_factory=forbidden)
        self.assertEqual(report["status"], "FAILED")
        self.assertEqual(report["reason"], "fresh_official_revision_requires_new_review")
        self.assertEqual(report["source_requests"], 1)
        self.assertEqual(called, [])
        self.assertFalse((self.out / "receipt.json").exists())

    def test_fresh_proof_comes_from_actual_reparsed_body_and_explicit_date(self):
        inputs = fixture(self.root)
        scope = json.loads((self.root / pilot.PILOT_PATH).read_text())["scope"]
        fetched = []
        proof = pilot.fresh_source(inputs[2], scope, "2026-27", lambda ident: fetched.append(ident) or inputs[5], now=NOW)
        self.assertEqual(fetched, [42])
        self.assertEqual(proof["parsed_effective_date"], "2026-11-03")
        self.assertEqual(proof["source_body_sha256"], inputs[2]["candidates"][0]["source_body_sha256"])

    def test_success_uses_atomic_writer_and_exports_only_after_readback(self):
        inputs = fixture(self.root)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        order = []
        def factory(config, target):
            order.append("auth")
            return client
        def exporter(root, receipt, **kwargs):
            order.append("export")
            self.assertEqual(receipt["status"], "MASTER_READBACK_VERIFIED")
            self.assertEqual(len(client.requests), 1)
            self.assertTrue(kwargs["apply"])
            return {"changed_files": ["data/player-updates/applied_master_events.json"], "value_changes": 0}
        report = pilot.run_pilot(self.root, self.out, environment=ENV, now=NOW,
                                 fetch_notice=lambda ident: order.append("source") or inputs[5],
                                 client_factory=factory, exporter=exporter)
        self.assertEqual(report["status"], "MASTER_VERIFIED_LOCAL_EXPORT_COMPLETE", report)
        self.assertEqual(order, ["source", "auth", "export"])
        self.assertTrue(report["receipt_written"])
        self.assertEqual(report["changed_master_cells"], 2)
        public = "".join(path.read_text() for path in self.out.iterdir())
        self.assertNotIn("PRIVATE_NOTE_PRESERVE", public)
        self.assertNotIn("SYNTHETIC_LOCAL_ONLY_NOTE", public)

    def test_readback_failure_never_runs_exporter_or_writes_verified_receipt(self):
        inputs = fixture(self.root)
        client = FakeClient(inputs[0], inputs[3], inputs[4], drop_journal=True)
        def forbidden(*args, **kwargs):
            self.fail("export after failed readback")
        report = pilot.run_pilot(self.root, self.out, environment=ENV, now=NOW,
                                 fetch_notice=lambda ident: inputs[5], client_factory=lambda *args: client,
                                 exporter=forbidden)
        self.assertEqual(report["status"], "FAILED")
        self.assertTrue(report["master_write_attempted"])
        self.assertFalse(report["receipt_written"])
        self.assertFalse((self.out / "receipt.json").exists())

    def test_gate_is_rechecked_immediately_before_atomic_master_write(self):
        inputs = fixture(self.root)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        original = pilot.preflight
        checks = []
        def gate(*args, **kwargs):
            checks.append(1)
            if len(checks) >= 5:
                return pilot._blocked("player_monitoring_window_closed", NOW)
            return original(*args, **kwargs)
        with patch.object(pilot, "preflight", side_effect=gate):
            report = pilot.run_pilot(self.root, self.out, environment=ENV, now=NOW,
                                     fetch_notice=lambda ident: inputs[5], client_factory=lambda *args: client)
        self.assertEqual(report["status"], "FAILED")
        self.assertEqual(client.requests, [])
        self.assertFalse(report["master_write_attempted"])
        self.assertFalse(report["receipt_written"])

    def test_outputs_inside_checkout_rejected_before_source_or_auth(self):
        fixture(self.root)
        with self.assertRaises(pilot.PilotError):
            pilot.run_pilot(self.root, self.root / "public-output", environment=ENV, now=NOW)

    def test_cli_disabled_preflight_sets_github_outputs_and_require_ready_fails(self):
        fixture(self.root, enabled=False)
        outputs = self.out / "github-output"
        argv = ["--preflight", "--root", str(self.root), "--output", str(self.out), "--github-output", str(outputs)]
        with patch.dict(os.environ, ENV, clear=True):
            self.assertEqual(pilot.main(argv), 0)
            self.assertEqual(pilot.main(argv + ["--require-ready"]), 2)
        self.assertIn("ready=false\nreason=pilot_disabled\n", outputs.read_text())


if __name__ == "__main__":
    unittest.main()

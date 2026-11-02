"""Exact Pages commit/bytes, independent player window, and no-auth gates."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "scripts"), str(ROOT / "tests")]
import kvl_player_master_export as export
import kvl_player_master_publish as publish
import kovo_vleague_ops as ops
from test_kvl_player_master_export import fixture, NOW
from test_kovo_vleague_ops import FakeClient, FakeClock, SHA, OTHER


class PlayerMasterPublishTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.receipt = fixture(self.root)
        export.export_from_receipt(self.root, self.receipt, apply=True, now=NOW)
        self.expected = {path: (self.root / path).read_bytes() for path in publish.PUBLIC_PATHS}
        self.ready = {"ready": True, "event_scope": {key: self.receipt[key] for key in
                      ("event_id", "player_id", "source_id", "revision_id")}}
        self.gate = patch.object(publish, "preflight", return_value=self.ready)
        self.gate_mock = self.gate.start()
        self.addCleanup(self.gate.stop)
        self.committed = patch.object(publish, "committed_files", return_value=self.expected)
        self.committed_mock = self.committed.start()
        self.addCleanup(self.committed.stop)
        self.clock = FakeClock()

    def reader(self, url, *, timeout=20):
        self.assertIn("kvl_verify=" + SHA + "-", url)
        return self.expected[urlsplit(url).path.lstrip("/")]

    def run_publish(self, client, reader=None):
        return publish.publish(self.root, SHA, self.receipt, client=client,
                               environment={}, public_reader=reader or self.reader,
                               now=NOW, timeout=20, interval=5,
                               sleeper=self.clock.sleep, clock=self.clock)

    def test_matching_rosters_journal_and_actual_build_sha_need_no_rebuild(self):
        client = FakeClient()
        result = self.run_publish(client)
        self.assertEqual(result["status"], "PLAYER_MASTER_DEPLOYED_VERIFIED")
        self.assertEqual(result["built_sha"], SHA)
        self.assertEqual(result["verified_files"], list(publish.PUBLIC_PATHS))
        self.assertEqual(result["verified_file_sha256"], {
            path: hashlib.sha256(raw).hexdigest() for path, raw in self.expected.items()})
        self.assertEqual(client.writes(), [])

    def test_one_build_request_then_repeat_does_not_rebuild(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER},
                                    {"status": "queued", "commit": SHA},
                                    {"status": "built", "commit": SHA}])
        result = self.run_publish(client)
        self.assertTrue(result["build_requested"])
        self.assertEqual(len(client.writes()), 1)
        repeated = self.run_publish(client)
        self.assertFalse(repeated["build_requested"])
        self.assertEqual(len(client.writes()), 1)

    def test_equivalent_json_with_different_bytes_does_not_pass(self):
        def changed_bytes(url, **options):
            raw = self.reader(url, **options)
            return json.dumps(json.loads(raw), ensure_ascii=False, separators=(",", ":")).encode()
        with self.assertRaisesRegex(ops.OpsError, "SITE_NOT_VERIFIED"):
            self.run_publish(FakeClient(), changed_bytes)

    def test_matching_bytes_from_wrong_build_sha_do_not_pass(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}])
        with self.assertRaisesRegex(ops.OpsError, "BUILD_TIMEOUT"):
            self.run_publish(client)

    def test_main_change_blocks_build_request(self):
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}])
        client.heads = [SHA, OTHER]
        with self.assertRaisesRegex(ops.OpsError, "MAIN_HEAD_CHANGED"):
            self.run_publish(client)
        self.assertEqual(client.writes(), [])

    def test_player_window_closing_during_reads_blocks_pages_post(self):
        self.gate_mock.side_effect = [self.ready, {"ready": False, "reason": "player_monitoring_window_closed"}]
        client = FakeClient(builds=[{"status": "built", "commit": OTHER}])
        with self.assertRaisesRegex(publish.PublishError, "PLAYER_PILOT_NOT_READY"):
            self.run_publish(client)
        self.assertTrue(client.calls)
        self.assertEqual(client.writes(), [])

    def test_disabled_pilot_never_constructs_authenticated_client(self):
        self.gate_mock.return_value = {"ready": False, "reason": "pilot_disabled"}
        with patch.object(ops.GitHubClient, "from_environment") as auth:
            with self.assertRaisesRegex(publish.PublishError, "PLAYER_PILOT_NOT_READY"):
                publish.publish(self.root, SHA, {}, environment={}, now=NOW)
            auth.assert_not_called()

    def test_receipt_outside_reviewed_scope_or_export_drift_blocks_before_api(self):
        client = FakeClient()
        self.ready["event_scope"]["revision_id"] = "KVL-PCR-" + "f" * 64
        with self.assertRaisesRegex(publish.PublishError, "RECEIPT_OUTSIDE_APPROVED_SCOPE"):
            self.run_publish(client)
        self.assertEqual(client.calls, [])
        self.ready["event_scope"]["revision_id"] = self.receipt["revision_id"]
        roster = self.root / publish.PUBLIC_PATHS[0]
        value = json.loads(roster.read_text())
        value["KAL"]["players"][0]["number"] = 99
        roster.write_text(json.dumps(value))
        with self.assertRaises(ValueError):
            self.run_publish(client)
        self.assertEqual(client.calls, [])

    def test_uncommitted_files_block_before_any_github_call(self):
        self.committed_mock.side_effect = ops.OpsError("LOCAL_DATA_UNCOMMITTED")
        client = FakeClient()
        with self.assertRaisesRegex(ops.OpsError, "LOCAL_DATA_UNCOMMITTED"):
            self.run_publish(client)
        self.assertEqual(client.calls, [])

    def test_public_reader_rejects_unapproved_host_or_historical_path_before_network(self):
        urls = ("https://other.example/data/player-updates/applied_master_events.json?kvl_verify=" + SHA + "-1",
                "https://kvolleylab.com/data/competitions/kovo-cup-men-2026/rosters.json?kvl_verify=" + SHA + "-1",
                "https://kvolleylab.com/data/player-updates/applied_master_events.json?token=private")
        with patch.object(publish, "build_opener") as network:
            for url in urls:
                with self.assertRaisesRegex(ops.OpsError, "INVALID_ENDPOINT"):
                    publish.read_public_bytes(url)
            network.assert_not_called()

    def test_committed_bytes_comparison_includes_new_journal_and_rejects_local_drift(self):
        self.committed.stop()
        with patch.object(ops, "git_head", return_value=SHA), patch.object(publish.subprocess, "run") as git:
            git.side_effect = [type("Result", (), {"stdout": self.expected[path]})() for path in publish.PUBLIC_PATHS]
            self.assertEqual(publish.committed_files(self.root, SHA), self.expected)
            self.assertTrue(any(publish.PUBLIC_PATHS[2] in call.args[0][-1] for call in git.call_args_list))
            git.reset_mock()
            git.side_effect = [type("Result", (), {"stdout": b"different committed bytes"})()]
            with self.assertRaisesRegex(ops.OpsError, "LOCAL_DATA_UNCOMMITTED"):
                publish.committed_files(self.root, SHA)


if __name__ == "__main__":
    unittest.main()

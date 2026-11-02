"""Verified current-roster export boundaries and repeated-event preservation."""
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import kvl_player_master_export as export

NOW = datetime(2026, 11, 2, 6, tzinfo=timezone.utc)
MEN = "data/competitions/v-league-men-2026-27/rosters.json"
WOMEN = "data/competitions/v-league-women-2026-27/rosters.json"
HISTORY = "data/competitions/kovo-cup-men-2026/rosters.json"
PID = "KVL-P-000001"
SOURCE = "KVL-SRC-VLEAGUE-2026-27-ROSTER-20261028"


def save(root, path, value):
    target = root / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fixture(root, current=7, desired="13", kind="number_change"):
    player = {"playerId": PID, "name": "검수선수", "number": current,
              "position": "OH", "sourceId": SOURCE, "dob": "2000-01-01",
              "sourceNote": "existing reviewed snapshot", "registrationSource": "https://kovo.co.kr/news/official-notices/41",
              "registrationDate": "2026-10-01",
              "lastChangeSource": "https://kovo.co.kr/news/official-notices/42" if export.canonical_value(kind, current)
                                  == export.canonical_value(kind, desired) else "https://kovo.co.kr/news/official-notices/41"}
    if kind == "position_change":
        player["number"], player["position"] = 7, current
    teammate = {"playerId": "KVL-P-000002", "name": "기존선수", "number": 10,
                "position": "S", "sourceId": SOURCE, "sourceNote": "preserve"}
    save(root, MEN, {"KAL": {"sourceId": SOURCE, "asOf": "2026-10-28",
                            "rosterKind": "season-notice-snapshot", "players": [player, teammate]}})
    save(root, WOMEN, {"GSC": {"sourceId": SOURCE, "players": [{
        "playerId": "KVL-P-000003", "name": "다른선수", "number": 3,
        "position": "L", "sourceId": SOURCE}]}})
    save(root, MEN.replace("rosters.json", "data.json"), {"participants": [{"code": "KAL", "name": "대한항공"}]})
    save(root, WOMEN.replace("rosters.json", "data.json"), {"participants": [{"code": "GSC", "name": "GS칼텍스"}]})
    save(root, HISTORY, {"KAL": {"players": [copy.deepcopy(player)]}})
    return {
        "schema_version": 1, "status": "MASTER_READBACK_VERIFIED", "season": "2026-27",
        "target_id": "vleague-men-2026-27-player-master", "gender": "남", "team": "대한항공",
        "player_id": PID, "event_id": "KVL-PE-" + export.digest([PID, "KVL-SRC-KOVO-NOTICE-42", "change"])[:24],
        "candidate_id": "KVL-PC-" + "b" * 24, "revision_id": "KVL-PCR-" + "c" * 64,
        "source_id": "KVL-SRC-KOVO-NOTICE-42", "source_url": "https://kovo.co.kr/news/official-notices/42",
        "source_version": "d" * 64, "kind": kind,
        "expected_previous_value": "7" if kind == "number_change" else "OH",
        "desired_value": desired, "target_value_before": current,
        "master_readback": {"verified": True, "value": desired, "player_id": PID,
                            "source_url": "https://kovo.co.kr/news/official-notices/42", "row_number": 4},
        "changed_cells": 1, "journal_rows_added": 1, "application_status": "applied", "uncertain_write_response": False,
        "effective_date": "2026-11-01", "plan_hash": "e" * 64,
        "source_readback_at": "2026-11-02T05:45:00Z", "verified_at": "2026-11-02T05:50:00Z",
    }


class MasterExportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.receipt = fixture(self.root)

    def export(self, receipt=None, apply=False):
        return export.export_from_receipt(self.root, receipt or self.receipt, apply=apply, now=NOW)

    def read(self, path):
        return json.loads((self.root / path).read_text())

    def snapshot(self):
        return {str(path.relative_to(self.root)): path.read_bytes() for path in self.root.rglob("*") if path.is_file()}

    def assert_blocked_without_writes(self, receipt=None):
        before = self.snapshot()
        with self.assertRaises(ValueError):
            self.export(receipt, apply=True)
        self.assertEqual(before, self.snapshot())

    def test_check_is_read_only_and_apply_changes_only_verified_field(self):
        before = self.snapshot()
        report = self.export()
        self.assertEqual(before, self.snapshot())
        self.assertEqual(report["changed_files"], [MEN, export.JOURNAL_PATH])
        self.assertEqual(report["value_changes"], 1)
        self.assertFalse(report["external_writes"])
        self.export(apply=True)
        expected = json.loads(before[MEN])
        expected["KAL"]["players"][0]["number"] = 13
        expected["KAL"]["players"][0]["lastChangeSource"] = self.receipt["source_url"]
        self.assertEqual(expected, self.read(MEN))
        self.assertEqual(self.read(MEN)["KAL"]["sourceId"], self.read(MEN)["KAL"]["players"][0]["sourceId"])
        for path, content in before.items():
            if path != MEN:
                self.assertEqual(content, (self.root / path).read_bytes(), path)
        self.assertEqual(before[HISTORY], (self.root / HISTORY).read_bytes())

    def test_existing_correct_value_records_provenance_without_touching_roster(self):
        self.receipt = fixture(self.root, current=13)
        self.receipt.update(application_status="verified_existing", changed_cells=0)
        before = self.snapshot()
        report = self.export(apply=True)
        self.assertEqual(report["changed_files"], [export.JOURNAL_PATH])
        self.assertEqual(report["value_changes"], 0)
        self.assertEqual(report["provenance_changes"], 1)
        self.assertEqual(before[MEN], (self.root / MEN).read_bytes())
        event = self.read(export.JOURNAL_PATH)["events"][0]
        self.assertFalse(event["website_value_changed"])
        self.assertFalse(event["website_source_changed"])
        self.assertEqual(event["roster_source_id"], SOURCE)
        self.assertEqual(event["source_id"], self.receipt["source_id"])

    def test_correct_value_with_old_source_updates_only_last_change_source(self):
        self.receipt = fixture(self.root, current=13)
        self.receipt.update(application_status="verified_existing", changed_cells=0)
        men = self.read(MEN)
        player = men["KAL"]["players"][0]
        player["lastChangeSource"] = "https://kovo.co.kr/news/official-notices/41"
        save(self.root, MEN, men)
        before = self.snapshot()
        report = self.export(apply=True)
        self.assertEqual(report["value_changes"], 0)
        self.assertEqual(report["metadata_changes"], 1)
        self.assertEqual(report["provenance_changes"], 1)
        expected = json.loads(before[MEN])
        expected["KAL"]["players"][0]["lastChangeSource"] = self.receipt["source_url"]
        self.assertEqual(self.read(MEN), expected)
        self.assertEqual((self.root / HISTORY).read_bytes(), before[HISTORY])
        entry = self.read(export.JOURNAL_PATH)["events"][0]
        self.assertFalse(entry["website_value_changed"])
        self.assertTrue(entry["website_source_changed"])
        repeated = self.export(apply=True)
        self.assertEqual(repeated["changed_files"], [])
        self.assertEqual(repeated["value_changes"], 0)
        self.assertEqual(repeated["metadata_changes"], 0)

    def test_missing_last_change_source_and_applied_source_drift_are_blocked(self):
        men = self.read(MEN)
        del men["KAL"]["players"][0]["lastChangeSource"]
        save(self.root, MEN, men)
        self.assert_blocked_without_writes()
        self.receipt = fixture(self.root)
        self.export(apply=True)
        men = self.read(MEN)
        men["KAL"]["players"][0]["lastChangeSource"] = "https://kovo.co.kr/news/official-notices/99"
        save(self.root, MEN, men)
        self.assert_blocked_without_writes()

    def test_existing_journal_duplicate_player_source_revision_is_rejected(self):
        self.export(apply=True)
        journal = self.read(export.JOURNAL_PATH)
        duplicate = copy.deepcopy(journal["events"][0])
        duplicate["event_id"] = "KVL-PE-" + "f" * 24
        journal["events"].append(duplicate)
        save(self.root, export.JOURNAL_PATH, journal)
        self.assert_blocked_without_writes()

    def test_same_event_revision_repeat_changes_zero_files(self):
        self.export(apply=True)
        before = self.snapshot()
        self.receipt.update(application_status="already_applied", changed_cells=0, journal_rows_added=0,
                            verified_at="2026-11-02T05:55:00Z", plan_hash="f" * 64)
        report = self.export(apply=True)
        self.assertEqual(report["changed_files"], [])
        self.assertEqual(report["value_changes"], 0)
        self.assertEqual(report["provenance_changes"], 0)
        self.assertEqual(before, self.snapshot())

    def test_changed_event_id_cannot_duplicate_same_player_source_revision(self):
        self.export(apply=True)
        self.assert_blocked_without_writes(dict(self.receipt, event_id="KVL-PE-" + "f" * 24))

    def test_unverified_or_mismatched_readback_is_rejected(self):
        for field, value in (("verified", False), ("player_id", "KVL-P-000099"),
                             ("value", "99"), ("source_url", "https://kovo.co.kr/news/official-notices/99")):
            with self.subTest(field=field):
                receipt = copy.deepcopy(self.receipt)
                receipt["master_readback"][field] = value
                self.assert_blocked_without_writes(receipt)
        receipt = dict(self.receipt, status="local_plan_only_not_applied")
        self.assert_blocked_without_writes(receipt)

    def test_stale_future_and_private_receipts_are_rejected(self):
        for changes in ({"verified_at": "2026-10-31T05:00:00Z"},
                        {"source_readback_at": "2026-11-03T05:00:00Z"},
                        {"effective_date": "2026-11-03"},
                        {"private_note": "not for publication"}):
            with self.subTest(changes=changes):
                self.assert_blocked_without_writes(dict(self.receipt, **changes))

    def test_out_of_scope_season_gender_kind_and_team_are_rejected(self):
        for changes in ({"season": "2025-26"}, {"gender": "여"}, {"kind": "transfer"},
                        {"team": "현대캐피탈"}, {"target_id": "historical-cup-master"}):
            with self.subTest(changes=changes):
                self.assert_blocked_without_writes(dict(self.receipt, **changes))

    def test_duplicate_id_even_in_other_gender_is_rejected(self):
        women = self.read(WOMEN)
        women["GSC"]["players"][0]["playerId"] = PID
        save(self.root, WOMEN, women)
        self.assert_blocked_without_writes()

    def test_missing_id_does_not_fall_back_to_matching_name(self):
        men = self.read(MEN)
        men["KAL"]["players"][0]["playerId"] = None
        save(self.root, MEN, men)
        self.assert_blocked_without_writes()

    def test_current_value_conflict_is_rejected(self):
        men = self.read(MEN)
        men["KAL"]["players"][0]["number"] = 99
        save(self.root, MEN, men)
        self.assert_blocked_without_writes()

    def test_source_revision_correction_requires_reconciliation(self):
        self.export(apply=True)
        receipt = dict(self.receipt, revision_id="KVL-PCR-" + "f" * 64,
                       source_version="f" * 64)
        self.assert_blocked_without_writes(receipt)

    def test_applied_source_changed_without_revision_is_rejected(self):
        self.export(apply=True)
        receipt = dict(self.receipt, source_version="f" * 64)
        self.assert_blocked_without_writes(receipt)
        receipt = copy.deepcopy(self.receipt)
        receipt.update(source_id="KVL-SRC-KOVO-NOTICE-43", source_url="https://kovo.co.kr/news/official-notices/43")
        receipt["master_readback"]["source_url"] = receipt["source_url"]
        self.assert_blocked_without_writes(receipt)

    def test_applied_value_drift_is_not_silently_overwritten(self):
        self.export(apply=True)
        men = self.read(MEN)
        men["KAL"]["players"][0]["number"] = 7
        save(self.root, MEN, men)
        self.assert_blocked_without_writes()

    def test_korean_position_maps_to_existing_canonical_code(self):
        self.receipt = fixture(self.root, current="OH", desired="미들 블로커", kind="position_change")
        before_history = (self.root / HISTORY).read_bytes()
        self.export(apply=True)
        self.assertEqual(self.read(MEN)["KAL"]["players"][0]["position"], "MB")
        self.assertEqual(before_history, (self.root / HISTORY).read_bytes())
        for source, expected in (("아웃사이드히터", "OH"), ("아포짓", "OP"), ("리베로", "L"), ("세터", "S")):
            self.assertEqual(export.canonical_value("position_change", source), expected)

    def test_invalid_values_and_broken_roster_source_are_rejected(self):
        for value in (True, -1, "=SUM(A1)", "3.1", "13번"):
            receipt = copy.deepcopy(self.receipt)
            receipt["desired_value"] = receipt["master_readback"]["value"] = value
            self.assert_blocked_without_writes(receipt)
        men = self.read(MEN)
        men["KAL"]["players"][0]["sourceId"] = "different-source"
        save(self.root, MEN, men)
        self.assert_blocked_without_writes()

    def test_real_writer_receipt_contract_including_resolved_uncertain_response(self):
        # This crosses the actual writer/export boundary; neither component can
        # silently introduce a receipt field the other fails to understand.
        sys.path.insert(0, str(ROOT / "tests"))
        from test_kvl_player_master_apply import fixture as writer_fixture, prepare, FakeClient, NOW as writer_now
        import kvl_player_master_apply as writer
        inputs = writer_fixture()
        client = FakeClient(inputs[0], inputs[3], inputs[4], response_lost=True)
        receipt = writer.apply_application(client, prepare(inputs), now=writer_now)
        self.assertTrue(receipt["uncertain_write_response"])
        self.assertEqual(export.validate_receipt(receipt, now=writer_now), ("L", "OH"))


if __name__ == "__main__":
    unittest.main()

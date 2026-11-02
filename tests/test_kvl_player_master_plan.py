"""Read-only MASTER matching, schema, revision and preservation boundaries."""
import copy
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import kvl_player_updates as updates

spec = importlib.util.spec_from_file_location("master_plan", ROOT / "scripts/kvl_player_master_plan.py")
plan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plan)
NOW = datetime(2026, 11, 4, 12, tzinfo=timezone.utc)


def fixture():
    config = json.loads((ROOT / "data/player-updates/master_targets.json").read_text())
    source = {"season": "2026-27", "notices": [{"id": 42, "title": "2026-2027시즌 삼성화재 선수 포지션 변경",
              "team": "삼성화재", "gender": "남", "published_at": "2026-11-01", "html_sha256": "a" * 64,
              "source_url": "https://kovo.co.kr/news/official-notices/42", "players": [], "events": [{
                  "kind": "position_change", "player_name": "김테스트", "gender": "남", "new_position": "L",
                  "previous_position": "OH", "confidence": "high", "effective_date": "2026-11-03",
                  "effective_date_basis": "explicit_effective_date"}]}]}
    candidate = updates.official_candidates(source)[0]
    decision = {key: candidate[key] for key in ("candidate_id", "revision_id", "source_version", "source_url")}
    decision.update(decision="approve", player_id="KVL-P-000001", identity_basis="canonical_id_review",
                    reviewer="KVL-OP-TEST", reviewed_at="2026-11-02", effective_date="2026-11-03",
                    effective_date_basis="official_notice_text", effective_date_evidence={
                        "source_url": candidate["source_url"], "locator": "paragraph:2", "asserted_date": "2026-11-03"})
    ledger, exported = updates.build_ledger(source, {}, [decision], {"KVL-P-000001"})
    target = config["targets"][0]
    snapshot = {key: target[key] for key in ("spreadsheet_id", "spreadsheet_title", "sheet_id", "sheet_title", "snapshot_kind")}
    snapshot.update(header_row=3, headers=config["headers"], fetched_at="2026-11-04T11:30:00Z",
                    formula_metadata_complete=True, lock_metadata_complete=True, rows=[{
                        "row_number": 4, "values": ["삼성화재", "7", "김테스트", "", "OH", "", "", "", "등록",
                            "https://kovo.co.kr/news/official-notices/41", "KVL-P-000001", "SYNTHETIC_LOCAL_ONLY_NOTE", "검토완료"],
                        "formulas": [""] * 13, "manual_locked": False}])
    return config, exported, ledger, [snapshot], {"complete": True, "events": []}


class MasterPlanTests(unittest.TestCase):
    def test_exact_id_and_schema_create_only_local_position_plan(self):
        inputs = fixture()
        before = copy.deepcopy(inputs)
        result = plan.build_plan(*inputs, now=NOW)
        self.assertEqual(inputs, before)
        self.assertEqual(result["runtime_connector"], "NOT_CONNECTED")
        self.assertEqual(result["writeback"], inputs[0]["writeback"])
        self.assertEqual(len(result["changes"]), 1)
        self.assertEqual(result["changes"][0]["updates"][0], {"cell": "E4", "before": "OH", "after": "L"})
        self.assertNotIn("SYNTHETIC_LOCAL_ONLY_NOTE", json.dumps(result))

    def test_blank_or_duplicate_id_does_not_fall_back_to_identical_name(self):
        for scenario in ("blank", "duplicate"):
            inputs = fixture()
            rows = inputs[3][0]["rows"]
            if scenario == "blank":
                rows[0]["values"][10] = ""
            else:
                rows.append(dict(copy.deepcopy(rows[0]), row_number=5))
            result = plan.build_plan(*inputs, now=NOW)
            self.assertEqual(result["changes"], [])
            self.assertTrue(any("player_id" in reason for reason in result["blocked"][0]["reasons"]))

    def test_formulas_manual_locks_and_unknown_metadata_block_plans(self):
        for scenario in ("formula", "locked", "unknown_formula", "unknown_lock"):
            inputs = fixture()
            snapshot = inputs[3][0]
            if scenario == "formula":
                snapshot["rows"][0]["formulas"][4] = '=IF(TRUE,"OH","L")'
            elif scenario == "locked":
                snapshot["rows"][0]["manual_locked"] = True
            elif scenario == "unknown_formula":
                snapshot["formula_metadata_complete"] = False
            else:
                snapshot["lock_metadata_complete"] = False
            self.assertEqual(plan.build_plan(*inputs, now=NOW)["changes"], [])

    def test_header_tab_and_historical_snapshot_mismatch_block_plans(self):
        for change in ({"headers": ["different"] * 13}, {"sheet_id": 999}, {"snapshot_kind": "tournament_snapshot"}):
            inputs = fixture()
            inputs[3][0].update(change)
            self.assertEqual(plan.build_plan(*inputs, now=NOW)["changes"], [])

    def test_stale_snapshot_future_date_or_missing_journal_block_plans(self):
        for scenario in ("stale", "future", "missing_history"):
            inputs = fixture()
            if scenario == "stale":
                inputs[3][0]["fetched_at"] = "2026-10-01T00:00:00Z"
            elif scenario == "future":
                inputs[1]["events"][0]["effective_date"] = "2027-01-01"
            else:
                inputs[4]["complete"] = False
            self.assertEqual(plan.build_plan(*inputs, now=NOW)["changes"], [])

    def test_corrected_applied_revision_requires_reconciliation(self):
        inputs = fixture()
        event = inputs[1]["events"][0]
        inputs[4]["events"].append({"event_id": event["event_id"], "player_id": event["player_id"],
                                  "source_id": event["source_id"], "revision_id": "previous-revision"})
        result = plan.build_plan(*inputs, now=NOW)
        self.assertEqual(result["changes"], [])
        self.assertIn("source_revision_correction_requires_explicit_reconciliation", result["blocked"][0]["reasons"])

    def test_exact_applied_revision_is_idempotently_skipped(self):
        inputs = fixture()
        event = inputs[1]["events"][0]
        inputs[4]["events"].append({key: event[key] for key in ("event_id", "player_id", "source_id", "revision_id")})
        result = plan.build_plan(*inputs, now=NOW)
        self.assertEqual(result["changes"], [])
        self.assertEqual(result["skipped"][0]["reason"], "exact_revision_already_applied")

    def test_unverified_membership_status_vocabulary_is_not_invented(self):
        inputs = fixture()
        inputs[1]["events"][0]["kind"] = "registration"
        inputs[2]["candidates"][0]["kind"] = "registration"
        result = plan.build_plan(*inputs, now=NOW)
        self.assertEqual(result["changes"], [])
        self.assertIn("membership_status_mapping_not_verified", result["blocked"][0]["reasons"])

    def test_no_reviewed_events_reports_real_connection_gaps(self):
        config, _, _, _, _ = fixture()
        result = plan.build_plan(config, {"events": []}, {}, [], {}, now=NOW)
        self.assertEqual(result["no_update_reasons"], ["no_reviewed_events"])
        self.assertTrue(all("fresh_runtime_snapshot_missing" in reasons for reasons in result["target_readiness"].values()))


if __name__ == "__main__":
    unittest.main()

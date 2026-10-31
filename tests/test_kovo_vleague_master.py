"""MASTER conflict, identity, retry and precise-cell tests (synthetic only)."""
from __future__ import annotations

import copy
import json
import os
from pathlib import Path
import re
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kovo_vleague_master as master


def fixture_row(mid="VL2627-M-001", home="대한항공", away="현대캐피탈"):
    female = "-W-" in mid
    return [mid, "v-league-2026-27", "여자" if female else "남자", "1", "정규리그",
            "2026-10-31", "토", "14:00", home, away, "검증 체육관", "보존 도시",
            "예정", "", "", "", "https://www.kovo.co.kr/", "교차검증", "내부 검토 메모 보존"]


def fixture_record(**overrides):
    record = {"match_id": "VL2627-M-001", "competition_slug": "v-league-men-2026-27",
              "round": 1, "date": "2026-10-31", "time": "14:00", "venue": "검증 체육관",
              "home_code": "KAL", "away_code": "HDC", "home_name": "대한항공", "away_name": "현대캐피탈",
              "status": "final", "score": {"home": 3, "away": 0, "sets": [
                  {"home": 25, "away": 22}, {"home": 25, "away": 23}, {"home": 25, "away": 22}]},
              "source_url": "https://user-api.kovo.co.kr/stat/game-schedule/1?gcode=001&seasonCode=023&leagueCode=201",
              "source_key": "023:001:MALE:1", "source_verified": True}
    record.update(overrides)
    return record


class FakeClient:
    spreadsheet_id = master.MASTER_SPREADSHEET_ID

    def __init__(self, values, *, error_after_write=False, drop_write=False):
        self.values = copy.deepcopy(values)
        self.calls = []
        self.error_after_write = error_after_write
        self.drop_write = drop_write

    def read_values(self):
        return copy.deepcopy(self.values)

    def batch_update_values(self, updates):
        self.calls.append(copy.deepcopy(updates))
        if not self.drop_write:
            for item in updates:
                m = re.search(r"!([A-S])(\d+)$", item["range"])
                row, col = int(m[2]) - 1, ord(m[1]) - 65
                while len(self.values[row]) < 19:
                    self.values[row].append("")
                self.values[row][col] = item["values"][0][0]
        if self.error_after_write:
            raise TimeoutError("request failed after server commit")


class MasterTests(unittest.TestCase):
    def setUp(self):
        self.values = [master.HEADERS.copy(), fixture_row()]
        self.record = fixture_record()

    def plan(self, values=None, record=None, **kwargs):
        return master.build_update_plan(self.values if values is None else values,
                                        [self.record if record is None else record], **kwargs)

    def test_exact_cells_preserve_notes_and_city(self):
        plan = self.plan()
        self.assertEqual({c["column"] for c in plan["changes"]}, {13, 14, 15, 16, 17, 18})
        self.assertNotIn("내부 검토", json.dumps(plan, ensure_ascii=False))
        client = FakeClient(self.values)
        receipt = master.apply_update_plan(client, plan)
        self.assertEqual(receipt["status"], "VERIFIED")
        self.assertEqual(client.values[1][12:16], ["종료", 3, 0, "25-22, 25-23, 25-22"])
        self.assertEqual(client.values[1][:12], self.values[1][:12])
        self.assertEqual(client.values[1][18], self.values[1][18])

    def test_shuffled_rows_are_matched_by_id(self):
        values = [master.HEADERS.copy(), fixture_row("VL2627-M-002", "KB손해보험", "삼성화재"), fixture_row()]
        plan = self.plan(values)
        self.assertTrue(all(c["row"] == 3 for c in plan["changes"]))
        client = FakeClient(values)
        master.apply_update_plan(client, plan)
        self.assertEqual(client.values[1], values[1])
        self.assertEqual(client.values[2][12], "종료")

    def test_duplicate_master_ids_fail(self):
        with self.assertRaisesRegex(master.MasterError, "Duplicate MASTER"):
            self.plan(self.values + [fixture_row()])

    def test_duplicate_source_ids_fail(self):
        with self.assertRaisesRegex(master.MasterError, "duplicate matched"):
            master.build_update_plan(self.values, [self.record, self.record])

    def test_wrong_workbook_and_header_fail(self):
        with self.assertRaisesRegex(master.MasterError, "workbook"):
            self.plan(spreadsheet_id="not-the-master")
        values = copy.deepcopy(self.values)
        values[0][13] = "다른 열"
        with self.assertRaisesRegex(master.MasterError, "header"):
            self.plan(values)

    def test_home_away_identity_not_reversed(self):
        record = fixture_record(home_name="현대캐피탈", away_name="대한항공")
        with self.assertRaisesRegex(master.MasterError, "identity conflict"):
            self.plan(record=record)

    def test_wrong_gender_round_or_season_fails(self):
        for changes in ({"competition_slug": "v-league-women-2026-27"},
                        {"round": 2}, {"source_key": "824:002:MALE:1"}):
            with self.subTest(changes=changes), self.assertRaises(master.MasterError):
                self.plan(record=fixture_record(**changes))

    def test_formulas_are_never_overwritten(self):
        for column in master.WRITABLE_COLUMNS:
            values = copy.deepcopy(self.values)
            values[1][column - 1] = "=1+1"
            with self.subTest(column=column), self.assertRaisesRegex(master.MasterError, "Formula"):
                self.plan(values)

    def test_manual_lock_markers_and_explicit_ids(self):
        for note in ("[LOCK] 운영자가 고정", "수동 확정", "자동갱신 금지", "[잠금]", "[MANUAL]"):
            values = copy.deepcopy(self.values)
            values[1][18] = note
            with self.subTest(note=note), self.assertRaisesRegex(master.MasterError, "Manual lock"):
                self.plan(values)
        with self.assertRaisesRegex(master.MasterError, "Manual lock"):
            self.plan(locked_match_ids=[self.record["match_id"]])

    def test_empty_response_cannot_clear_master(self):
        with self.assertRaises(master.MasterError):
            self.plan([])
        with self.assertRaises(master.MasterError):
            master.build_update_plan(self.values, [])

    def test_changed_user_value_blocks_entire_batch(self):
        plan = self.plan()
        client = FakeClient(self.values)
        client.values[1][13] = 2
        with self.assertRaisesRegex(master.MasterError, "expected value conflict"):
            master.apply_update_plan(client, plan)
        self.assertFalse(client.calls)

    def test_changed_protected_note_blocks_entire_batch(self):
        plan = self.plan()
        client = FakeClient(self.values)
        client.values[1][18] = "방금 사용자가 수정"
        with self.assertRaisesRegex(master.MasterError, "protected cells changed"):
            master.apply_update_plan(client, plan)
        self.assertFalse(client.calls)

    def test_rows_moved_after_plan_require_rebuild(self):
        values = self.values + [fixture_row("VL2627-M-002", "KB손해보험", "삼성화재")]
        plan = self.plan(values)
        client = FakeClient(values)
        client.values[1], client.values[2] = client.values[2], client.values[1]
        with self.assertRaisesRegex(master.MasterError, "rows moved"):
            master.apply_update_plan(client, plan)
        self.assertFalse(client.calls)

    def test_retry_old_plan_after_master_saved_is_noop(self):
        plan = self.plan()
        client = FakeClient(self.values)
        master.apply_update_plan(client, plan)
        receipt = master.apply_update_plan(client, plan)
        self.assertEqual(len(client.calls), 1)
        self.assertEqual(receipt["changed_cells"], 0)
        self.assertEqual(receipt["already_applied_cells"], len(plan["changes"]))

    def test_rebuilt_plan_after_master_saved_is_noop(self):
        client = FakeClient(self.values)
        master.apply_update_plan(client, self.plan())
        plan = self.plan(client.values)
        self.assertEqual(plan["changes"], [])
        receipt = master.apply_update_plan(client, plan)
        self.assertEqual(receipt["changed_cells"], 0)
        self.assertEqual(len(client.calls), 1)

    def test_timeout_after_success_uses_readback(self):
        client = FakeClient(self.values, error_after_write=True)
        receipt = master.apply_update_plan(client, self.plan())
        self.assertEqual(receipt["status"], "VERIFIED_AFTER_UNCERTAIN_RESPONSE")
        self.assertEqual(len(client.calls), 1)

    def test_unconfirmed_write_fails_and_never_claims_verified(self):
        client = FakeClient(self.values, drop_write=True, error_after_write=True)
        with self.assertRaisesRegex(master.MasterError, "expected value conflict"):
            master.apply_update_plan(client, self.plan())
        self.assertEqual(len(client.calls), 1)

    def test_final_correction_and_regression_require_review(self):
        client = FakeClient(self.values)
        master.apply_update_plan(client, self.plan())
        amended = fixture_record(score={"home": 3, "away": 0, "sets": [
            {"home": 25, "away": 20}, {"home": 25, "away": 23}, {"home": 25, "away": 22}]})
        for record in (amended, fixture_record(status="scheduled"), fixture_record(time="15:00")):
            with self.subTest(record=record), self.assertRaises(master.MasterError):
                self.plan(client.values, record)

    def test_manual_score_is_protected_even_without_final_status(self):
        values = copy.deepcopy(self.values)
        values[1][13] = 2
        with self.assertRaisesRegex(master.MasterError, "Existing score correction"):
            self.plan(values)

    def test_semantically_same_final_set_spacing_preserved(self):
        client = FakeClient(self.values)
        master.apply_update_plan(client, self.plan())
        client.values[1][15] = "25-22,25-23,25-22"
        self.assertEqual(self.plan(client.values)["changes"], [])

    def test_live_partial_score_is_not_written(self):
        record = fixture_record(status="live", score={"home": 1, "away": 0})
        plan = self.plan(record=record)
        self.assertFalse({14, 15, 16} & {c["column"] for c in plan["changes"]})
        client = FakeClient(self.values)
        master.apply_update_plan(client, plan)
        self.assertEqual(client.values[1][12:16], ["진행중", "", "", ""])

    def test_cancelled_cannot_silently_become_scheduled(self):
        values = copy.deepcopy(self.values)
        values[1][12] = "취소"
        with self.assertRaisesRegex(master.MasterError, "Administrative"):
            self.plan(values, fixture_record(status="scheduled"))

    def test_reschedule_changes_only_authorized_columns(self):
        record = fixture_record(status="scheduled", date="2026-11-02", time="19:00", venue="새 체육관")
        plan = self.plan(record=record)
        self.assertEqual({c["column"] for c in plan["changes"]}, {6, 7, 8, 11, 17, 18})
        self.assertEqual(next(c["value"] for c in plan["changes"] if c["column"] == 7), "월")

    def test_unverified_or_nonofficial_source_refused(self):
        for changes in ({"source_verified": False}, {"review_status": "SOURCE_REVIEW_REQUIRED"},
                        {"source_url": "https://example.com/score"},
                        {"source_url": "https://user-api.kovo.co.kr/score?token=secret"}):
            with self.subTest(changes=changes), self.assertRaises(master.MasterError):
                self.plan(record=fixture_record(**changes))

    def test_plan_tampering_and_wrong_client_refused(self):
        plan = self.plan()
        plan["changes"][0]["column"] = 19
        with self.assertRaisesRegex(master.MasterError, "checksum"):
            master.apply_update_plan(FakeClient(self.values), plan)
        client = FakeClient(self.values)
        client.spreadsheet_id = "another-workbook"
        with self.assertRaisesRegex(master.MasterError, "Wrong MASTER"):
            master.apply_update_plan(client, self.plan())

    def test_missing_credentials_fail_closed_without_ambient_lookup(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaisesRegex(master.MasterError, "not configured"):
            master.SheetsClient.from_environment()

    def test_short_lived_access_token_is_not_exposed(self):
        with patch.dict(os.environ, {"KVL_GOOGLE_ACCESS_TOKEN": "test-token"}, clear=True):
            client = master.SheetsClient.from_environment()
        self.assertEqual(client.spreadsheet_id, master.MASTER_SPREADSHEET_ID)
        self.assertNotIn("test-token", repr(client))

    def test_client_checks_tab_identity_before_values_read(self):
        client = master.SheetsClient(lambda *args: None)
        with patch.object(client, "_request", return_value={"spreadsheetId": master.MASTER_SPREADSHEET_ID,
                           "sheets": [{"properties": {"sheetId": 123, "title": master.MASTER_SHEET_NAME}}]}):
            with self.assertRaisesRegex(master.MasterError, "tab"):
                client.read_values()

    def test_client_forbids_whole_row_or_note_write(self):
        client = master.SheetsClient(lambda *args: None)
        for range_name in ("'경기일정_MASTER'!A2:S2", "'경기일정_MASTER'!S2", "'다른시트'!N2"):
            with self.subTest(range=range_name), self.assertRaises(master.MasterError):
                client.batch_update_values([{"range": range_name, "majorDimension": "ROWS", "values": [[1]]}])


if __name__ == "__main__":
    unittest.main()

"""Real failure boundaries for the one-event MASTER pilot, without network writes."""
import copy
from datetime import timedelta
import importlib.util
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "tests"))
import kvl_player_master_apply as apply
import kvl_player_updates as updates
from test_kvl_player_master_plan import fixture as base_fixture, NOW


def fixture():
    config, exported, ledger, snapshots, _ = base_fixture()
    snapshot = snapshots[0]
    snapshot.update(fetched_at=apply.timestamp(NOW), all_rows_read=True,
                    grid_row_count=100, grid_column_count=13)
    snapshot["rows"].append({"row_number": 5, "values": ["우리카드", "15", "별도선수", "", "S", "", "", "", "등록",
                              "https://kovo.co.kr/news/official-notices/3", "KVL-P-000002", "PRIVATE_NOTE_PRESERVE", "확인"],
                              "formulas": [""] * 13, "manual_locked": False})
    for row in snapshot["rows"]:
        row.update(notes=[""] * 13, data_validations=[{} for _ in range(13)], explicit_link_uris=[""] * 13)
    snapshot.update(validation_metadata_complete=True, protected_ranges=[],
                    header_formulas=[""] * 13, header_notes=[""] * 13,
                    header_data_validations=[{} for _ in range(13)],
                    header_explicit_link_uris=[""] * 13,
                    header_manual_locked=False, header_protected=False)
    event = exported["events"][0]
    config["pilot_scope"] = {key: event[key] for key in apply.SCOPE_KEYS}
    target = config["targets"][0]
    target["journal"] = {"sheet_id": 800001, "title": apply.JOURNAL_TITLE, "header_row": 1,
                         "headers": apply.JOURNAL_HEADERS[:]}
    journal = {"spreadsheet_id": target["spreadsheet_id"], "sheet_id": 800001, "sheet_title": apply.JOURNAL_TITLE,
               "header_row": 1, "headers": apply.JOURNAL_HEADERS[:], "scope": copy.deepcopy(config["pilot_scope"]),
               "fetched_at": apply.timestamp(NOW), "formula_metadata_complete": True, "lock_metadata_complete": True,
               "all_rows_read": True, "grid_row_count": 100, "grid_column_count": 22, "protected": False, "rows": [],
               "validation_metadata_complete": True, "protected_ranges": [],
               "header_formulas": [""] * 22, "header_notes": [""] * 22,
               "header_data_validations": [{} for _ in range(22)],
               "header_explicit_link_uris": [""] * 22,
               "header_manual_locked": False, "header_protected": False}
    proof = {key: ledger["candidates"][0][key] for key in ("source_id", "source_version", "revision_id", "source_body_sha256")}
    proof["fetched_at"] = apply.timestamp(NOW)
    proof["parsed_effective_date"] = ledger["candidates"][0]["effective_date"]
    return [config, exported, ledger, snapshot, journal, proof]


class FakeClient:
    def __init__(self, config, snapshot, journal, *, response_lost=False, drop_journal=False, unrelated_edit=False):
        self.spreadsheet_id = snapshot["spreadsheet_id"]
        self.config = config
        self.snapshot, self.journal = copy.deepcopy(snapshot), copy.deepcopy(journal)
        self.requests = []
        self.response_lost, self.drop_journal, self.unrelated_edit = response_lost, drop_journal, unrelated_edit

    def read_snapshot(self):
        return copy.deepcopy(self.snapshot)

    def read_journal(self, scope):
        return copy.deepcopy(self.journal)

    def batch_apply(self, requests):
        self.requests.append(copy.deepcopy(requests))
        for request in requests:
            update = request["updateCells"]
            start = update["start"]
            row_number = start["rowIndex"] + 1
            values = [next(iter(cell["userEnteredValue"].values())) for cell in update["rows"][0]["values"]]
            if start["sheetId"] == self.snapshot["sheet_id"]:
                row = next(row for row in self.snapshot["rows"] if row["row_number"] == row_number)
                row["values"][start["columnIndex"]] = values[0]
                if update["fields"] == apply.SOURCE_WRITE_FIELDS:
                    row["explicit_link_uris"][start["columnIndex"]] = update["rows"][0]["values"][0]["userEnteredFormat"]["textFormat"]["link"]["uri"]
            elif not self.drop_journal:
                row = next((row for row in self.journal["rows"] if row["row_number"] == row_number), None)
                if row is None:
                    row = {"row_number": row_number, "values": [""] * 22, "formulas": [""] * 22,
                           "notes": [""] * 22, "data_validations": [{} for _ in range(22)],
                           "explicit_link_uris": [""] * 22, "manual_locked": False}
                    self.journal["rows"].append(row)
                    self.journal["rows"].sort(key=lambda item: item["row_number"])
                row["values"] = values
        if self.unrelated_edit:
            self.snapshot["rows"][1]["values"][11] = "CONCURRENT_USER_CHANGE"
        if self.response_lost:
            raise TimeoutError("response lost after server accepted the atomic batch")


def prepare(inputs):
    return apply.prepare_application(*inputs[:5], source_readback=inputs[5], now=NOW)


class PlayerMasterApplyTests(unittest.TestCase):
    def test_atomic_value_source_history_then_repeat_zero_writes(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        before_other = copy.deepcopy(client.snapshot["rows"][1])
        receipt = apply.apply_application(client, plan, now=NOW)
        self.assertEqual(receipt["changed_cells"], 2)
        self.assertEqual(receipt["journal_rows_added"], 1)
        self.assertEqual(receipt["status"], "MASTER_READBACK_VERIFIED")
        self.assertEqual(len(client.requests), 1)
        self.assertEqual(len(client.requests[0]), 3)
        self.assertEqual(client.snapshot["rows"][1], before_other)
        self.assertEqual(client.snapshot["rows"][0]["values"][10], "KVL-P-000001")
        inputs[3], inputs[4] = client.read_snapshot(), client.read_journal(inputs[0]["pilot_scope"])
        again = apply.apply_application(client, prepare(inputs), now=NOW)
        self.assertEqual(again["changed_cells"], 0)
        self.assertEqual(again["journal_rows_added"], 0)
        self.assertEqual(again["application_status"], "already_applied")
        self.assertEqual(len(client.requests), 1)

    def test_correct_existing_value_has_only_baseline_journal_and_no_fake_change(self):
        inputs = fixture()
        row = inputs[3]["rows"][0]
        row["values"][4], row["values"][9] = "L", inputs[1]["events"][0]["source_url"]
        plan = prepare(inputs)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        receipt = apply.apply_application(client, plan, now=NOW)
        self.assertEqual(receipt["application_status"], "verified_existing")
        self.assertEqual(receipt["changed_cells"], 0)
        self.assertEqual(receipt["journal_rows_added"], 1)
        self.assertEqual(len(client.requests[0]), 1)
        self.assertEqual(client.snapshot, inputs[3])

    def test_source_cell_updates_text_and_explicit_click_target_with_narrow_format_mask(self):
        inputs = fixture()
        row = inputs[3]["rows"][0]
        old_source = row["values"][9]
        row["explicit_link_uris"][9] = old_source
        row["explicit_link_uris"][2] = "https://kovo.co.kr/news/official-notices/39"
        plan = prepare(inputs)
        requests = apply.batch_requests(plan)
        source_request = next(item["updateCells"] for item in requests
                              if item["updateCells"]["start"].get("columnIndex") == 9)
        self.assertEqual(source_request["fields"], "userEnteredValue,userEnteredFormat.textFormat.link.uri")
        self.assertEqual(source_request["rows"][0]["values"][0]["userEnteredFormat"],
                         {"textFormat": {"link": {"uri": inputs[1]["events"][0]["source_url"]}}})
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        receipt = apply.apply_application(client, plan, now=NOW)
        self.assertEqual(client.snapshot["rows"][0]["explicit_link_uris"][9], receipt["source_url"])
        self.assertEqual(client.snapshot["rows"][0]["explicit_link_uris"][2], row["explicit_link_uris"][2])
        self.assertEqual(receipt["changed_cells"], 2)

    def test_correct_source_text_with_stale_explicit_link_repairs_one_cell_then_repeats_zero_writes(self):
        inputs = fixture()
        row = inputs[3]["rows"][0]
        row["values"][4], row["values"][9] = "L", inputs[1]["events"][0]["source_url"]
        row["explicit_link_uris"][9] = "https://kovo.co.kr/news/official-notices/41"
        plan = prepare(inputs)
        self.assertEqual(len(plan["updates"]), 1)
        self.assertEqual(plan["updates"][0]["cell"], "J4")
        self.assertEqual(plan["updates"][0]["before"], plan["updates"][0]["after"])
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        receipt = apply.apply_application(client, plan, now=NOW)
        self.assertEqual(receipt["changed_cells"], 1)
        inputs[3], inputs[4] = client.read_snapshot(), client.read_journal(inputs[0]["pilot_scope"])
        repeated = apply.apply_application(client, prepare(inputs), now=NOW)
        self.assertEqual(repeated["changed_cells"], 0)
        self.assertEqual(repeated["journal_rows_added"], 0)
        self.assertEqual(len(client.requests), 1)

    def test_source_link_readback_mismatch_blocks_receipt(self):
        class KeepOldClickTarget(FakeClient):
            def batch_apply(self, requests):
                super().batch_apply(requests)
                self.snapshot["rows"][0]["explicit_link_uris"][9] = "https://kovo.co.kr/news/official-notices/41"
        inputs = fixture()
        client = KeepOldClickTarget(inputs[0], inputs[3], inputs[4])
        with self.assertRaisesRegex(apply.PlayerMasterError, "master_readback_mismatch"):
            apply.apply_application(client, prepare(inputs), now=NOW)

    def test_transport_does_not_allow_general_format_changes_with_source_link(self):
        inputs = fixture()
        class Transport(apply.PlayerSheetsClient):
            def _request(self, method, suffix, body=None):
                self.calls.append((method, suffix, body))
                return {}
        client = Transport(inputs[0], inputs[0]["targets"][0], lambda *args: None)
        client.calls = []
        requests = apply.batch_requests(prepare(inputs))
        for scenario in ("broad_mask", "bold", "wrong_uri"):
            with self.subTest(scenario=scenario):
                changed = copy.deepcopy(requests)
                source_request = next(item["updateCells"] for item in changed
                                      if item["updateCells"]["start"].get("columnIndex") == 9)
                if scenario == "broad_mask":
                    source_request["fields"] = "userEnteredValue,userEnteredFormat"
                elif scenario == "bold":
                    source_request["rows"][0]["values"][0]["userEnteredFormat"]["textFormat"]["bold"] = True
                else:
                    source_request["rows"][0]["values"][0]["userEnteredFormat"]["textFormat"]["link"]["uri"] = "https://kovo.co.kr/news/official-notices/99"
                with self.assertRaises(apply.PlayerMasterError):
                    client.batch_apply(changed)
                self.assertEqual(client.calls, [])
        client.batch_apply(requests)
        self.assertEqual(len(client.calls), 1)

    def test_no_source_date_or_stale_source_blocks_before_write(self):
        for scenario in ("date", "stale", "changed_source", "missing_source"):
            with self.subTest(scenario=scenario):
                inputs = fixture()
                if scenario == "date":
                    inputs[1]["events"][0]["effective_date"] = ""
                elif scenario == "stale":
                    inputs[5]["fetched_at"] = apply.timestamp(NOW - timedelta(minutes=6))
                elif scenario == "changed_source":
                    inputs[5]["source_body_sha256"] = "b" * 64
                else:
                    inputs[5].clear()
                with self.assertRaises(ValueError):
                    prepare(inputs)

    def test_publication_date_and_conflicting_or_unverified_effective_date_cannot_authorize_write(self):
        for scenario in ("publication_basis", "conflicting_date", "missing_parsed_proof", "fallback_candidate"):
            with self.subTest(scenario=scenario):
                inputs = fixture()
                event, candidate = inputs[1]["events"][0], inputs[2]["candidates"][0]
                if scenario == "publication_basis":
                    event["effective_date_basis"] = "notice_date_fallback"
                elif scenario == "conflicting_date":
                    event["effective_date"] = "2026-10-01"
                    event["effective_date_evidence"]["asserted_date"] = "2026-10-01"
                elif scenario == "missing_parsed_proof":
                    del inputs[5]["parsed_effective_date"]
                else:
                    candidate.update(effective_date="", effective_date_basis="notice_date_fallback")
                    candidate["revision_id"] = "KVL-PCR-" + updates.digest({key: value for key, value in candidate.items()
                                                         if key not in {"revision_id", "review_status"}})
                    event["revision_id"] = candidate["revision_id"]
                    for record in (inputs[0]["pilot_scope"], inputs[4]["scope"], inputs[5]):
                        record["revision_id"] = candidate["revision_id"]
                with self.assertRaisesRegex(apply.PlayerMasterError, "explicit_official_effective_date"):
                    prepare(inputs)

    def test_destination_validation_requires_review_without_removing_the_rule(self):
        rule = {"condition": {"type": "ONE_OF_LIST", "values": [{"userEnteredValue": "OH"}]}, "strict": True}
        for destination in ("value", "source", "journal"):
            with self.subTest(destination=destination):
                inputs = fixture()
                if destination == "journal":
                    row = apply._destination_row(inputs[4], 2, 22)
                    row["data_validations"][0] = copy.deepcopy(rule)
                    inputs[4]["rows"].append(row)
                else:
                    inputs[3]["rows"][0]["data_validations"][4 if destination == "value" else 9] = copy.deepcopy(rule)
                before = copy.deepcopy(inputs)
                with self.assertRaisesRegex(apply.PlayerMasterError, "destination_data_validation_requires_review"):
                    prepare(inputs)
                self.assertEqual(inputs, before)

    def test_journal_protected_header_is_allowed_but_append_range_is_blocked(self):
        inputs = fixture()
        journal = inputs[4]
        journal.update(protected=True, header_protected=True,
                       protected_ranges=[{"range": {"sheetId": journal["sheet_id"],
                                                     "startRowIndex": 0, "endRowIndex": 1}}])
        client = FakeClient(inputs[0], inputs[3], journal)
        receipt = apply.apply_application(client, prepare(inputs), now=NOW)
        self.assertEqual(receipt["journal_rows_added"], 1)
        blocked = fixture()
        blocked[4].update(protected=True, protected_ranges=[{"range": {
            "sheetId": blocked[4]["sheet_id"], "startRowIndex": 1, "endRowIndex": 2}}])
        with self.assertRaisesRegex(apply.PlayerMasterError, "journal_destination_protected_or_locked"):
            prepare(blocked)

    def test_header_formula_or_explicit_lock_requires_review_in_both_tabs(self):
        for tab in (3, 4):
            for scenario in ("formula", "lock"):
                with self.subTest(tab=tab, scenario=scenario):
                    inputs = fixture()
                    if scenario == "formula":
                        inputs[tab]["header_formulas"][0] = '=CONCAT("구","단")'
                    else:
                        inputs[tab]["header_notes"][0] = "[LOCK]"
                    with self.assertRaisesRegex(apply.PlayerMasterError, "header_formula_or_manual_lock"):
                        prepare(inputs)

    def test_ordinary_notes_are_preserved_and_metadata_edits_block_preflight(self):
        inputs = fixture()
        inputs[3]["rows"][0]["notes"][4] = "Preserve this operator note"
        destination = apply._destination_row(inputs[4], 2, 22)
        destination["notes"][0] = "Existing journal note"
        inputs[4]["rows"].append(destination)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        apply.apply_application(client, prepare(inputs), now=NOW)
        self.assertEqual(client.snapshot["rows"][0]["notes"][4], "Preserve this operator note")
        self.assertEqual(client.journal["rows"][0]["notes"][0], "Existing journal note")
        for metadata in ("note", "validation", "header_note"):
            with self.subTest(metadata=metadata):
                inputs = fixture()
                plan = prepare(inputs)
                client = FakeClient(inputs[0], inputs[3], inputs[4])
                if metadata == "note":
                    client.snapshot["rows"][0]["notes"][4] = "Concurrent note"
                elif metadata == "validation":
                    client.snapshot["rows"][0]["data_validations"][4] = {"condition": {"type": "TEXT_NOT_CONTAINS", "values": [{"userEnteredValue": "L"}]}}
                else:
                    client.journal["header_notes"][0] = "Concurrent header note"
                with self.assertRaises(apply.PlayerMasterError):
                    apply.apply_application(client, plan, now=NOW)
                self.assertEqual(client.requests, [])

    def test_metadata_edit_after_write_blocks_success_receipt(self):
        class EditHeaderAfterWrite(FakeClient):
            def batch_apply(self, requests):
                super().batch_apply(requests)
                self.snapshot["header_notes"][0] = "Concurrent metadata edit"
        inputs = fixture()
        client = EditHeaderAfterWrite(inputs[0], inputs[3], inputs[4])
        with self.assertRaisesRegex(apply.PlayerMasterError, "master_readback_metadata_changed"):
            apply.apply_application(client, prepare(inputs), now=NOW)

    def test_unknown_id_duplicate_id_wrong_team_and_newer_value_block(self):
        for scenario in ("missing_id", "duplicate_id", "team", "newer_value", "future"):
            with self.subTest(scenario=scenario):
                inputs = fixture()
                row = inputs[3]["rows"][0]
                if scenario == "missing_id":
                    row["values"][10] = ""
                elif scenario == "duplicate_id":
                    inputs[3]["rows"][1]["values"][10] = row["values"][10]
                elif scenario == "team":
                    row["values"][0] = "대한항공"
                elif scenario == "newer_value":
                    row["values"][4] = "MB"
                else:
                    event = inputs[1]["events"][0]
                    event["effective_date"] = "2027-01-01"
                    event["effective_date_evidence"]["asserted_date"] = "2027-01-01"
                with self.assertRaises(ValueError):
                    prepare(inputs)

    def test_formula_protection_manual_marker_and_incomplete_coverage_block(self):
        for scenario in ("formula", "protected", "manual_marker", "unknown_lock", "partial_rows", "journal_protected"):
            with self.subTest(scenario=scenario):
                inputs = fixture()
                row = inputs[3]["rows"][0]
                if scenario == "formula":
                    row["formulas"][4] = '=IF(TRUE,"OH","L")'
                elif scenario == "protected":
                    row["manual_locked"] = True
                elif scenario == "manual_marker":
                    row["values"][11] = "[LOCK]"
                elif scenario == "unknown_lock":
                    inputs[3]["lock_metadata_complete"] = False
                elif scenario == "partial_rows":
                    inputs[3]["all_rows_read"] = False
                else:
                    inputs[4]["protected"] = True
                with self.assertRaises(ValueError):
                    prepare(inputs)

    def test_preflight_detects_concurrent_row_and_history_change_without_write(self):
        for where in ("row", "journal"):
            inputs = fixture()
            plan = prepare(inputs)
            client = FakeClient(inputs[0], inputs[3], inputs[4])
            if where == "row":
                client.snapshot["rows"][0]["values"][11] = "concurrent edit"
            else:
                client.journal["grid_row_count"] = 101
            with self.assertRaises(apply.PlayerMasterError):
                apply.apply_application(client, plan, now=NOW)
            self.assertEqual(client.requests, [])

    def test_snapshot_timestamp_changes_do_not_create_false_conflict(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        client.snapshot["fetched_at"] = apply.timestamp(NOW - timedelta(seconds=1))
        client.journal["fetched_at"] = apply.timestamp(NOW - timedelta(seconds=1))
        receipt = apply.apply_application(client, plan, now=NOW)
        self.assertTrue(receipt["master_readback"]["verified"])

    def test_uncertain_response_is_resolved_by_readback_without_retry(self):
        inputs = fixture()
        client = FakeClient(inputs[0], inputs[3], inputs[4], response_lost=True)
        receipt = apply.apply_application(client, prepare(inputs), now=NOW)
        self.assertTrue(receipt["uncertain_write_response"])
        self.assertEqual(len(client.requests), 1)

    def test_missing_journal_or_unrelated_readback_change_blocks_publication(self):
        for flags in ({"drop_journal": True}, {"unrelated_edit": True}):
            inputs = fixture()
            client = FakeClient(inputs[0], inputs[3], inputs[4], **flags)
            with self.assertRaises(apply.PlayerMasterError):
                apply.apply_application(client, prepare(inputs), now=NOW)
            self.assertEqual(len(client.requests), 1)

    def test_revision_correction_and_drift_after_applied_event_block(self):
        for scenario in ("revision", "drift", "duplicate"):
            inputs = fixture()
            client = FakeClient(inputs[0], inputs[3], inputs[4])
            apply.apply_application(client, prepare(inputs), now=NOW)
            inputs[3], inputs[4] = client.snapshot, client.journal
            if scenario == "revision":
                inputs[4]["rows"][0]["values"][3] = "previous revision"
            elif scenario == "drift":
                inputs[3]["rows"][0]["values"][4] = "OH"
            else:
                inputs[4]["rows"].append(dict(copy.deepcopy(inputs[4]["rows"][0]), row_number=3))
            with self.assertRaises(apply.PlayerMasterError):
                prepare(inputs)

    def test_empty_legacy_complete_flag_is_not_a_pilot_journal(self):
        inputs = fixture()
        inputs[4] = {"complete": True, "events": []}
        with self.assertRaises(apply.PlayerMasterError):
            prepare(inputs)

    def test_membership_multiple_events_and_scope_tampering_block(self):
        for scenario in ("membership", "multiple", "scope"):
            inputs = fixture()
            if scenario == "membership":
                inputs[1]["events"][0]["kind"] = "registration"
            elif scenario == "multiple":
                inputs[1]["events"].append(copy.deepcopy(inputs[1]["events"][0]))
            else:
                inputs[0]["pilot_scope"]["player_id"] = "KVL-P-000002"
            with self.assertRaises(apply.PlayerMasterError):
                prepare(inputs)

    def test_alternative_event_id_cannot_relabel_the_same_player_source(self):
        inputs = fixture()
        alternative = "KVL-PE-" + "f" * 24
        inputs[1]["events"][0]["event_id"] = alternative
        inputs[0]["pilot_scope"]["event_id"] = alternative
        inputs[4]["scope"]["event_id"] = alternative
        with self.assertRaisesRegex(apply.PlayerMasterError, "event_id_does_not_match"):
            prepare(inputs)

    def test_plans_receipts_and_requests_never_expose_other_rows_or_private_notes(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[0], inputs[3], inputs[4])
        receipt = apply.apply_application(client, plan, now=NOW)
        public = json.dumps([plan, receipt, client.requests])
        self.assertNotIn("SYNTHETIC_LOCAL_ONLY_NOTE", public)
        self.assertNotIn("PRIVATE_NOTE_PRESERVE", public)
        self.assertNotIn("KVL-P-000002", public)

    def test_transport_rejects_tab_creation_id_writes_and_credential_leaks(self):
        inputs = fixture()
        client = apply.PlayerSheetsClient(inputs[0], inputs[0]["targets"][0], lambda *args: None)
        for requests in ([{"addSheet": {"properties": {"title": "new"}}}],
                         [{"updateCells": {"start": {"sheetId": inputs[3]["sheet_id"], "rowIndex": 3, "columnIndex": 10},
                          "rows": [{"values": [{"userEnteredValue": {"stringValue": "KVL-P-000002"}}]}], "fields": "userEnteredValue"}}]):
            with self.assertRaises(apply.PlayerMasterError):
                client.batch_apply(requests)

    def test_bounded_transport_detects_formula_note_and_protected_row_metadata(self):
        inputs = fixture()
        target = inputs[0]["targets"][0]
        metadata = {"spreadsheetId": target["spreadsheet_id"], "properties": {"title": target["spreadsheet_title"]},
                    "sheets": [{"properties": {"sheetId": target["sheet_id"], "title": target["sheet_title"],
                                               "gridProperties": {"rowCount": 100, "columnCount": 13}},
                                "protectedRanges": [{"range": {"sheetId": target["sheet_id"], "startRowIndex": 4,
                                                               "endRowIndex": 5, "startColumnIndex": 0, "endColumnIndex": 13}}]}]}
        headers = [{"userEnteredValue": {"stringValue": value}} for value in inputs[0]["headers"]]
        target_cells = [{"userEnteredValue": {"stringValue": str(value)}} for value in inputs[3]["rows"][0]["values"]]
        target_cells[4] = {"userEnteredValue": {"formulaValue": '=IF(TRUE,"OH","L")'},
                           "effectiveValue": {"stringValue": "OH"}, "note": "[LOCK]",
                           "dataValidation": {"condition": {"type": "ONE_OF_LIST", "values": [{"userEnteredValue": "OH"}]}}}
        target_cells[9]["userEnteredFormat"] = {"textFormat": {"bold": True,
            "link": {"uri": inputs[3]["rows"][0]["values"][9]}}}
        headers[0]["note"] = "Verified schema"
        other_cells = [{"userEnteredValue": {"stringValue": str(value)}} for value in inputs[3]["rows"][1]["values"]]
        grid = {"spreadsheetId": target["spreadsheet_id"], "sheets": [{"properties": {"sheetId": target["sheet_id"]},
                    "data": [{"startRow": 2, "startColumn": 0, "rowData": [
                        {"values": headers}, {"values": target_cells}, {"values": other_cells}]}]}]}
        class Transport(apply.PlayerSheetsClient):
            def _request(self, method, suffix, body=None):
                self.calls.append((method, suffix))
                return copy.deepcopy(metadata if len(self.calls) == 1 else grid)
        client = Transport(inputs[0], target, lambda *args: None, clock=lambda: NOW)
        client.calls = []
        snapshot = client.read_snapshot()
        self.assertEqual(snapshot["headers"], inputs[0]["headers"])
        self.assertEqual(snapshot["rows"][0]["formulas"][4], '=IF(TRUE,"OH","L")')
        self.assertTrue(snapshot["rows"][0]["manual_locked"])
        self.assertEqual(snapshot["rows"][0]["notes"][4], "[LOCK]")
        self.assertEqual(snapshot["rows"][0]["data_validations"][4], target_cells[4]["dataValidation"])
        self.assertEqual(snapshot["header_notes"][0], "Verified schema")
        self.assertEqual(snapshot["rows"][0]["explicit_link_uris"][9], inputs[3]["rows"][0]["values"][9])
        self.assertTrue(snapshot["rows"][1]["manual_locked"])
        self.assertTrue(snapshot["all_rows_read"])
        self.assertIn("A1%3AM100", client.calls[1][1])
        self.assertTrue(all(method == "GET" for method, _ in client.calls))

    def test_missing_or_duplicate_target_tab_is_not_silently_recreated(self):
        inputs = fixture()
        target = inputs[0]["targets"][0]
        class Transport(apply.PlayerSheetsClient):
            def _request(self, method, suffix, body=None):
                self.calls.append(method)
                return {"spreadsheetId": target["spreadsheet_id"], "properties": {"title": target["spreadsheet_title"]}, "sheets": []}
        client = Transport(inputs[0], target, lambda *args: None)
        client.calls = []
        with self.assertRaises(apply.PlayerMasterError):
            client.read_snapshot()
        self.assertEqual(client.calls, ["GET"])


if __name__ == "__main__":
    unittest.main()

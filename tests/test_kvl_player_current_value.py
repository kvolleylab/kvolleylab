import copy
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys
import unittest
from urllib.parse import parse_qs, urlencode, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kvl_player_current_value as current


NOW = datetime(2026, 11, 3, 2, 0, tzinfo=timezone.utc)
CURRENT_HASH = "3" * 64


def stamp(seconds=0):
    return current.timestamp(NOW + timedelta(seconds=seconds))


def source():
    return {"schema_version": 1, "scope": copy.deepcopy(current.SCOPE), "observed_at": stamp(-10),
            "notice": {"id": current.NOTICE_ID, "url": current.NOTICE_URL, "html_sha256": current.NOTICE_SHA256,
                       "published_at": "2026-09-16", "fetched_at": stamp(-30), "player_name": "오재성",
                       "previous_value": "3", "value": "5", "effective_date": None},
            "current": {"roster_url": current.ROSTER_URL, "profile_url": current.PROFILE_URL,
                        "official_player_id": current.OFFICIAL_PLAYER_ID, "normalized_sha256": CURRENT_HASH,
                        "fetched_at": stamp(-20), "profile_fetched_at": stamp(-15), "source_as_of": None,
                        "player_name": "오재성", "birth_date": "1992-04-02", "team_id": "1009", "number": "5",
                        "position": "L", "status": "REGISTER", "visible": True, "roster_match_count": 1,
                        "profile_matches_roster": True, "season_context_verified": True,
                        "season_context_sha256": "a" * 64, "season_basis": "official_current_context_only"}}


def row(number, values):
    return {"row_number": number, "values": values, "formulas": [""] * len(values), "notes": [""] * len(values),
            "data_validations": [{} for _ in values], "explicit_link_uris": [""] * len(values), "manual_locked": False}


def tab(headers, title, sheet_id, row_count, rows):
    return {"spreadsheet_id": current.SPREADSHEET_ID, "sheet_id": sheet_id, "sheet_title": title,
            "header_row": 1, "headers": headers[:], "rows": rows, "grid_row_count": row_count,
            "grid_column_count": len(headers), "fetched_at": stamp(-1), "formula_metadata_complete": True,
            "lock_metadata_complete": True, "validation_metadata_complete": True, "all_rows_read": True,
            "protected_ranges": [], "protected": False, "header_formulas": [""] * len(headers),
            "header_notes": [""] * len(headers), "header_data_validations": [{} for _ in headers],
            "header_explicit_link_uris": [""] * len(headers), "header_manual_locked": False, "header_protected": False}


def fixture():
    selected = row(57, ["우리카드", 5, "오재성", "OH JAE SEONG", "L", "1992.04.02", 175, "대한민국",
                        "등록", current.NOTICE_URL, current.SCOPE["player_id"], "", "검수완료"])
    other = row(58, ["우리카드", 9, "다른선수", "", "L", "2000-01-01", 174, "대한민국", "등록", "", "", "", ""])
    other["notes"][11] = "PRIVATE MASTER NOTE: must never appear in any receipt"
    master = tab(current.CURRENT_HEADERS, current.CURRENT_TITLE, current.CURRENT_ID, 300, [selected, other])
    master.update(spreadsheet_title=current.SPREADSHEET_TITLE, header_row=3, snapshot_kind="current_roster")
    master.pop("protected")
    journal = tab(current.HEADERS, current.JOURNAL_TITLE, current.JOURNAL_ID, 200, [])
    return source(), master, journal


def prepare(inputs, *, run_id="native-20261103-oh-current-v1", now=NOW):
    return current.prepare_verification(*inputs, expected_current_sha256=CURRENT_HASH,
                                        reviewer="KVL-OP-CURRENT-REVIEW", reviewed_at=stamp(-1), run_id=run_id, now=now)


class FakeClient:
    spreadsheet_id = current.SPREADSHEET_ID

    def __init__(self, master, journal):
        self.master, self.journal = copy.deepcopy(master), copy.deepcopy(journal)
        self.now = NOW
        self.appends = []
        self.response_lost = False
        self.drop_write = False
        self.concurrent_master_edit = False
        self.concurrent_journal_append = False
        self.duplicate_after_write = False
        self.auto_url_links = False
        self.hidden_link_after_write = None

    def read_snapshot(self):
        result = copy.deepcopy(self.master)
        result["fetched_at"] = current.timestamp(self.now)
        return result

    def read_verification_journal(self):
        result = copy.deepcopy(self.journal)
        result["fetched_at"] = current.timestamp(self.now)
        return result

    def append_verification(self, values):
        self.appends.append(copy.deepcopy(values))
        if self.concurrent_journal_append:
            foreign = values[:]
            foreign[current.HEADERS.index("run_id")] = "99999"
            foreign[current.HEADERS.index("verification_id")] = current.verification_id("99999")
            self.journal["rows"].append(row(2, foreign))
        if not self.drop_write:
            number = max([1] + [item["row_number"] for item in self.journal["rows"]]) + 1
            appended = row(number, values[:])
            if self.auto_url_links:
                appended["explicit_link_uris"][11] = current.NOTICE_URL
                appended["explicit_link_uris"][14] = current.ROSTER_URL
            if self.hidden_link_after_write:
                index, link = self.hidden_link_after_write
                appended["explicit_link_uris"][index] = link
            self.journal["rows"].append(appended)
        if self.duplicate_after_write:
            self.journal["rows"].append(row(number + 1, values[:]))
        if self.concurrent_master_edit:
            self.master["rows"][1]["values"][11] = "USER MODIFIED THIS DURING THE APPEND"
        if self.response_lost:
            raise TimeoutError("PRIVATE NETWORK DETAILS must not be published")


class CurrentValueTests(unittest.TestCase):
    def test_same_number_writes_only_one_verification_row_and_sanitizes_receipt(self):
        inputs = fixture()
        original = copy.deepcopy(inputs)
        plan = prepare(inputs)
        client = FakeClient(inputs[1], inputs[2])
        receipt = current.apply_verification(client, plan, now=NOW)
        self.assertEqual(inputs, original)
        self.assertEqual(client.master, inputs[1])
        self.assertEqual(len(client.appends), 1)
        self.assertEqual(len(client.appends[0]), 26)
        self.assertEqual(receipt["status"], "CURRENT_VALUE_RECORD_READBACK_VERIFIED")
        self.assertEqual(receipt["record_rows_added"], 1)
        self.assertEqual(receipt["player_cells_changed"], 0)
        self.assertEqual(receipt["event_journal_rows_added"], 0)
        self.assertEqual(receipt["roster_files_changed"], 0)
        self.assertIsNone(receipt["effective_date"])
        self.assertFalse(receipt["publication_performed"])
        self.assertEqual(receipt["sources"]["notice_publication_precision"], "date")
        self.assertEqual(receipt["sources"]["notice_fetched_at"], stamp(-30))
        self.assertEqual(receipt["sources"]["profile_fetched_at"], stamp(-15))
        self.assertEqual(receipt["sources"]["role"], "current_execution_recheck")
        self.assertEqual(receipt["stored_record"]["observed_at"], stamp(-10))
        self.assertEqual(receipt["stored_record"]["roster_fetched_at"], stamp(-20))
        self.assertEqual(receipt["stored_record"]["master_read_at"], stamp(-1))
        self.assertNotIn("plan_hash", receipt)
        self.assertNotIn("PRIVATE", json.dumps(receipt))
        self.assertNotIn("1992-04-02", json.dumps(receipt))
        self.assertNotIn("1992.04.02", json.dumps(receipt))
        self.assertNotIn("MASTER_READBACK_VERIFIED", json.dumps(receipt))
        self.assertEqual(client.journal["rows"][0]["values"][8], "")
        self.assertEqual(client.journal["rows"][0]["values"][18], "")

    def test_native_dotted_and_iso_birth_dates_confirm_without_changing_raw_snapshot(self):
        for birthday in ("1992.04.02", "1992-04-02"):
            with self.subTest(birthday=birthday):
                inputs = fixture()
                inputs[1]["rows"][0]["values"][5] = birthday
                raw_snapshot = copy.deepcopy(inputs[1])
                raw_hash = current.digest(current._stable_snapshot(inputs[1]))
                plan = prepare(inputs)
                self.assertEqual(plan["expected_master_sha256"], raw_hash)
                client = FakeClient(inputs[1], inputs[2])
                receipt = current.apply_verification(client, plan, now=NOW)
                self.assertEqual(client.master, raw_snapshot)
                self.assertEqual(client.master["rows"][0]["values"][5], birthday)
                self.assertEqual(current.digest(current._stable_snapshot(client.master)), raw_hash)
                self.assertEqual(receipt["player_cells_changed"], 0)

    def test_ambiguous_impossible_or_different_birth_dates_block(self):
        for birthday in ("1992/04/02", "1992.4.02", "1992.04-02", "1992-04.02",
                         "1992.02.30", "1992-02-30", "1992.04.03", 33696, True):
            with self.subTest(birthday=birthday):
                inputs = fixture()
                inputs[1]["rows"][0]["values"][5] = birthday
                with self.assertRaises(current.CurrentValueError):
                    prepare(inputs)

    def test_current_master_position_must_match_official_libero_without_a_formula(self):
        for position in ("OH", "MB", "리베로", "", "L "):
            with self.subTest(position=position):
                inputs = fixture()
                inputs[1]["rows"][0]["values"][4] = position
                with self.assertRaisesRegex(current.CurrentValueError, "master_position_mismatch"):
                    prepare(inputs)
        inputs = fixture()
        inputs[1]["rows"][0]["formulas"][4] = '=IF(TRUE,"L","OH")'
        with self.assertRaisesRegex(current.CurrentValueError, "locked_or_formula"):
            prepare(inputs)

    def test_birth_date_format_edit_after_preparation_is_still_a_concurrent_raw_change(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[1], inputs[2])
        client.master["rows"][0]["values"][5] = "1992-04-02"
        with self.assertRaisesRegex(current.CurrentValueError, "master_changed_before_record"):
            current.apply_verification(client, plan, now=NOW)
        self.assertEqual(client.appends, [])

    def test_same_run_retry_keeps_original_record_with_new_observation_times(self):
        evidence, master, journal = fixture()
        client = FakeClient(master, journal)
        first = current.apply_verification(client, prepare((evidence, master, journal)), now=NOW)
        stored = copy.deepcopy(client.journal)
        client.now = NOW + timedelta(seconds=60)
        evidence["observed_at"] = stamp(55)
        evidence["notice"]["fetched_at"] = stamp(40)
        evidence["current"]["fetched_at"] = stamp(45)
        evidence["current"]["profile_fetched_at"] = stamp(50)
        evidence["current"]["roster_response_sha256"] = "b" * 64
        repeated = current.prepare_verification(
            evidence, client.read_snapshot(), client.read_verification_journal(), expected_current_sha256=CURRENT_HASH,
            reviewer="KVL-OP-SECOND-REVIEW", reviewed_at=stamp(59), run_id="native-20261103-oh-current-v1", now=client.now)
        receipt = current.apply_verification(client, repeated, now=client.now)
        self.assertEqual(receipt["action"], "already_verified")
        self.assertEqual(receipt["record_rows_added"], 0)
        self.assertFalse(receipt["write_attempted"])
        self.assertEqual(receipt["observed_at"], stamp(-10))
        self.assertEqual(receipt["stored_record"], first["stored_record"])
        self.assertEqual(receipt["stored_record"]["reviewer"], "KVL-OP-CURRENT-REVIEW")
        self.assertEqual(receipt["stored_record"]["reviewed_at"], stamp(-1))
        self.assertEqual(receipt["sources"]["role"], "current_execution_recheck")
        self.assertEqual(receipt["sources"]["observed_at"], stamp(55))
        self.assertEqual(receipt["sources"]["roster_fetched_at"], stamp(45))
        self.assertEqual(receipt["sources"]["notice_fetched_at"], stamp(40))
        self.assertEqual(receipt["sources"]["master_read_at"], stamp(60))
        self.assertEqual(receipt["rechecked_at"], stamp(60))
        self.assertEqual(client.journal, stored)
        self.assertEqual(len(client.appends), 1)

    def test_public_receipt_does_not_fingerprint_private_master_notes(self):
        receipts, private_plans = [], []
        for note in ("PRIVATE assessment version A", "PRIVATE assessment version B"):
            inputs = fixture()
            inputs[1]["rows"][0]["notes"][11] = note
            plan = prepare(inputs)
            private_plans.append(plan)
            client = FakeClient(inputs[1], inputs[2])
            receipts.append(current.apply_verification(client, plan, now=NOW))
        self.assertNotEqual(private_plans[0]["plan_hash"], private_plans[1]["plan_hash"])
        self.assertNotEqual(private_plans[0]["expected_master_row_sha256"], private_plans[1]["expected_master_row_sha256"])
        self.assertEqual(receipts[0], receipts[1])
        for private, receipt in zip(private_plans, receipts):
            public_text = json.dumps(receipt)
            self.assertNotIn(private["plan_hash"], public_text)
            self.assertNotIn(private["expected_master_sha256"], public_text)
            self.assertNotIn(private["expected_master_row_sha256"], public_text)
            self.assertNotIn("PRIVATE", public_text)

    def test_google_same_url_auto_links_verify_then_retry_without_a_second_append(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[1], inputs[2])
        client.auto_url_links = True
        receipt = current.apply_verification(client, plan, now=NOW)
        self.assertEqual(receipt["record_rows_added"], 1)
        self.assertEqual(client.journal["rows"][0]["explicit_link_uris"][11], current.NOTICE_URL)
        self.assertEqual(client.journal["rows"][0]["explicit_link_uris"][14], current.ROSTER_URL)
        original = copy.deepcopy(client.journal)
        repeated = prepare((inputs[0], client.read_snapshot(), client.read_verification_journal()))
        retry_receipt = current.apply_verification(client, repeated, now=NOW)
        self.assertEqual(retry_receipt["action"], "already_verified")
        self.assertEqual(len(client.appends), 1)
        self.assertEqual(client.journal, original)

    def test_hidden_wrong_url_and_links_in_other_columns_block_after_readback(self):
        for index, target in ((11, "https://example.test/hidden"), (14, current.NOTICE_URL),
                              (0, current.NOTICE_URL), (25, current.ROSTER_URL)):
            with self.subTest(index=index, target=target):
                inputs = fixture()
                client = FakeClient(inputs[1], inputs[2])
                client.auto_url_links = True
                client.hidden_link_after_write = (index, target)
                with self.assertRaisesRegex(current.CurrentValueError, "url_link_mismatch|unexpected_link"):
                    current.apply_verification(client, prepare(inputs), now=NOW)
                self.assertEqual(len(client.appends), 1)

    def test_existing_record_link_change_before_apply_is_detected_without_append(self):
        inputs = fixture()
        client = FakeClient(inputs[1], inputs[2])
        client.auto_url_links = True
        current.apply_verification(client, prepare(inputs), now=NOW)
        repeated = prepare((inputs[0], client.read_snapshot(), client.read_verification_journal()))
        client.journal["rows"][0]["explicit_link_uris"][11] = ""
        with self.assertRaisesRegex(current.CurrentValueError, "journal_changed_before_record"):
            current.apply_verification(client, repeated, now=NOW)
        self.assertEqual(len(client.appends), 1)

    def test_new_explicit_manual_run_adds_one_new_record(self):
        inputs = fixture()
        client = FakeClient(inputs[1], inputs[2])
        first = current.apply_verification(client, prepare(inputs), now=NOW)
        next_plan = prepare((inputs[0], client.read_snapshot(), client.read_verification_journal()), run_id="41449999111")
        second = current.apply_verification(client, next_plan, now=NOW)
        self.assertNotEqual(first["verification_id"], second["verification_id"])
        self.assertEqual(second["record_rows_added"], 1)
        self.assertEqual(len(client.journal["rows"]), 2)
        self.assertEqual(client.master, inputs[1])

    def test_lost_write_response_reads_back_without_rewriting(self):
        inputs = fixture()
        client = FakeClient(inputs[1], inputs[2])
        client.response_lost = True
        receipt = current.apply_verification(client, prepare(inputs), now=NOW)
        self.assertTrue(receipt["uncertain_write_response"])
        self.assertEqual(len(client.appends), 1)
        self.assertNotIn("PRIVATE", json.dumps(receipt))

    def test_failed_write_and_missing_record_never_gets_a_success_receipt_or_retry(self):
        inputs = fixture()
        client = FakeClient(inputs[1], inputs[2])
        client.drop_write = client.response_lost = True
        with self.assertRaisesRegex(current.CurrentValueError, "readback_changed_or_missing"):
            current.apply_verification(client, prepare(inputs), now=NOW)
        self.assertEqual(len(client.appends), 1)

    def test_current_value_source_and_duplicate_identity_conflicts_block(self):
        mutations = [
            lambda x: x[1]["rows"][0]["values"].__setitem__(1, 3),
            lambda x: x[1]["rows"][0]["values"].__setitem__(9, "https://kovo.co.kr/news/official-notices/155579"),
            lambda x: x[1]["rows"][0]["explicit_link_uris"].__setitem__(9, "https://example.test/old"),
            lambda x: x[1]["rows"][1]["values"].__setitem__(10, current.SCOPE["player_id"]),
            lambda x: x[1]["rows"][0]["values"].__setitem__(5, "2007-08-15"),
            lambda x: x[1]["rows"][0]["formulas"].__setitem__(1, "=5"),
        ]
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                inputs = fixture()
                mutate(inputs)
                with self.assertRaises(current.PlayerMasterError):
                    prepare(inputs)

    def test_missing_or_unverified_current_evidence_and_wrong_scope_block(self):
        mutations = [
            lambda x: x[0].pop("current"),
            lambda x: x[0]["scope"].__setitem__("player_id", "KVL-P-001548"),
            lambda x: x[0]["scope"].__setitem__("field", "position"),
            lambda x: x[0]["current"].__setitem__("official_player_id", "0001551"),
            lambda x: x[0]["current"].__setitem__("profile_matches_roster", False),
            lambda x: x[0]["current"].__setitem__("season_context_verified", False),
            lambda x: x[0]["current"].__setitem__("roster_match_count", 2),
            lambda x: x[0]["current"].__setitem__("visible", 1),
            lambda x: x[0]["current"].__setitem__("status", "RELEASED"),
            lambda x: x[0]["current"].__setitem__("normalized_sha256", "f" * 64),
            lambda x: x[0]["notice"].__setitem__("html_sha256", "f" * 64),
            lambda x: x[0]["notice"].__setitem__("effective_date", "2026-09-16"),
            lambda x: x[0]["current"].__setitem__("source_as_of", "2026-11-03"),
            lambda x: x[0]["current"].__setitem__("private_note", "not allowed"),
        ]
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                inputs = fixture()
                mutate(inputs)
                with self.assertRaises(current.PlayerMasterError):
                    prepare(inputs)

    def test_dates_require_real_precision_and_fresh_timezone_aware_reads(self):
        cases = [("notice", "published_at", "2026-11-04"),
                 ("notice", "published_at", "2026-09-16T09:30:10.390613"),
                 ("current", "fetched_at", stamp(1)),
                 ("current", "profile_fetched_at", stamp(-301)),
                 ("current", "fetched_at", "2026-11-03T01:59:00")]
        for group, key, value in cases:
            with self.subTest(group=group, key=key, value=value):
                inputs = fixture()
                inputs[0][group][key] = value
                with self.assertRaises(current.PlayerMasterError):
                    prepare(inputs)
        for value in (stamp(1), stamp(-301), "2026-11-03T01:59:00"):
            inputs = fixture()
            inputs[0]["observed_at"] = value
            with self.assertRaises(current.PlayerMasterError):
                prepare(inputs)
        inputs = fixture()
        inputs[0]["notice"]["published_at"] = "2026-09-16T09:30:10+09:00"
        self.assertTrue(prepare(inputs)["append_required"])

    def test_empty_journal_destination_protection_or_formula_blocks(self):
        inputs = fixture()
        inputs[2]["protected_ranges"] = [{"range": {"sheetId": current.JOURNAL_ID, "startRowIndex": 1,
                                                      "endRowIndex": 200, "startColumnIndex": 0, "endColumnIndex": 26}}]
        with self.assertRaisesRegex(current.PlayerMasterError, "protected_or_locked"):
            prepare(inputs)
        for kind in ("formulas", "notes", "data_validations"):
            inputs = fixture()
            extra = row(2, [""] * 26)
            extra[kind][0] = {"condition": {"type": "BOOLEAN"}} if kind == "data_validations" else "=1"
            inputs[2]["rows"].append(extra)
            with self.assertRaises(current.PlayerMasterError):
                prepare(inputs)

    def test_duplicate_and_semantic_conflict_records_are_not_rewritten(self):
        inputs = fixture()
        client = FakeClient(inputs[1], inputs[2])
        current.apply_verification(client, prepare(inputs), now=NOW)
        existing = (inputs[0], client.read_snapshot(), client.read_verification_journal())
        duplicate = copy.deepcopy(existing[2]["rows"][0])
        duplicate["row_number"] = 3
        existing[2]["rows"].append(duplicate)
        with self.assertRaisesRegex(current.CurrentValueError, "duplicate_verification_id"):
            prepare(existing)
        existing[2]["rows"].pop()
        existing[0]["current"]["season_context_sha256"] = "b" * 64
        with self.assertRaisesRegex(current.CurrentValueError, "semantic_revision_requires_review"):
            prepare(existing)

    def test_concurrent_master_edit_before_write_blocks_without_append(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[1], inputs[2])
        client.master["rows"][1]["values"][11] = "USER EDIT"
        with self.assertRaisesRegex(current.CurrentValueError, "master_changed_before_record"):
            current.apply_verification(client, plan, now=NOW)
        self.assertEqual(client.appends, [])

    def test_concurrent_changes_after_append_fail_without_overwriting_or_retries(self):
        for flag in ("concurrent_master_edit", "concurrent_journal_append", "duplicate_after_write"):
            with self.subTest(flag=flag):
                inputs = fixture()
                client = FakeClient(inputs[1], inputs[2])
                setattr(client, flag, True)
                with self.assertRaises(current.CurrentValueError):
                    current.apply_verification(client, prepare(inputs), now=NOW)
                self.assertEqual(len(client.appends), 1)
                self.assertEqual(client.master["rows"][0], inputs[1]["rows"][0])

    def test_raw_source_hash_changes_do_not_change_semantic_key_but_never_store_raw_data(self):
        inputs = fixture()
        first = prepare(inputs)
        inputs[0]["current"].update(roster_response_sha256="b" * 64, profile_response_sha256="c" * 64)
        other = prepare(inputs)
        self.assertEqual(first["evidence_sha256"], other["evidence_sha256"])
        self.assertEqual(first["verification_id"], other["verification_id"])
        inputs[0]["current"]["roster_response_sha256"] = "raw response is forbidden"
        with self.assertRaises(current.CurrentValueError):
            prepare(inputs)

    def test_overwide_or_incomplete_current_scope_cannot_claim_global_uniqueness(self):
        for key, value in (("grid_row_count", 301), ("all_rows_read", False)):
            inputs = fixture()
            inputs[1][key] = value
            with self.assertRaises(current.CurrentValueError):
                prepare(inputs)

    def test_stale_evidence_before_apply_and_modified_plan_do_not_write(self):
        inputs = fixture()
        plan = prepare(inputs)
        client = FakeClient(inputs[1], inputs[2])
        with self.assertRaisesRegex(current.CurrentValueError, "stale"):
            current.apply_verification(client, plan, now=NOW + timedelta(minutes=6))
        plan["row_values"][7] = "3"
        with self.assertRaisesRegex(current.CurrentValueError, "plan_changed"):
            current.apply_verification(client, plan, now=NOW)
        self.assertEqual(client.appends, [])


class Response:
    status = 200

    def __init__(self, url, value):
        self.url, self.value = url, value

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def geturl(self):
        return self.url

    def read(self, size):
        return json.dumps(self.value).encode()[:size]


class RecordingOpener:
    def __init__(self):
        self.requests = []

    def open(self, request, timeout):
        self.requests.append(request)
        return Response(request.full_url, {"replies": [{}]})


def client_config():
    config = json.loads((Path(__file__).resolve().parents[1] / "data/player-updates/master_targets.json").read_text())
    return config, config["targets"][0]


class CurrentValueTransportTests(unittest.TestCase):
    def client(self, mode="read"):
        config, target = client_config()
        opener = RecordingOpener()
        client = current.CurrentValueSheetsClient(config, target, lambda *args: None, mode=mode,
                                                 expected_current_sha256=CURRENT_HASH, opener=opener, clock=lambda: NOW)
        return client, opener

    def test_default_client_is_read_only_and_old_event_writer_is_unavailable(self):
        client, opener = self.client()
        with self.assertRaisesRegex(current.CurrentValueError, "not_enabled"):
            client.append_verification(prepare(fixture())["row_values"])
        with self.assertRaisesRegex(current.CurrentValueError, "event_writer_not_available"):
            client.batch_apply([])
        with self.assertRaisesRegex(current.CurrentValueError, "event_journal_not_part"):
            client.read_journal({})
        self.assertEqual(opener.requests, [])

    def test_record_transport_only_sends_literal_26_cell_append_to_new_tab(self):
        client, opener = self.client("record")
        values = prepare(fixture())["row_values"]
        client.append_verification(values)
        self.assertEqual(len(opener.requests), 1)
        request = opener.requests[0]
        self.assertEqual(request.method, "POST")
        self.assertEqual(request.full_url, "https://sheets.googleapis.com/v4/spreadsheets/" + current.SPREADSHEET_ID + ":batchUpdate")
        body = json.loads(request.data)
        append = body["requests"][0]["appendCells"]
        self.assertEqual(append["sheetId"], current.JOURNAL_ID)
        self.assertEqual(append["fields"], "userEnteredValue")
        self.assertEqual([cell["userEnteredValue"]["stringValue"] for cell in append["rows"][0]["values"]], values)
        self.assertFalse(body["includeSpreadsheetInResponse"])

    def test_arbitrary_updates_tab_creation_and_formula_cells_are_blocked_before_network(self):
        client, opener = self.client("record")
        for request in ({"addSheet": {}}, {"updateCells": {}}, {"deleteSheet": {"sheetId": current.CURRENT_ID}}):
            with self.assertRaises(current.CurrentValueError):
                client._request("POST", ":batchUpdate", {"requests": [request], "includeSpreadsheetInResponse": False})
        values = prepare(fixture())["row_values"]
        values[22] = "=IMPORTDATA(\"https://example.test\")"
        with self.assertRaisesRegex(current.CurrentValueError, "invalid_literal"):
            client.append_verification(values)
        self.assertEqual(opener.requests, [])

    def test_unrelated_tabs_and_oversized_read_ranges_are_blocked_before_network(self):
        client, opener = self.client()
        with self.assertRaisesRegex(current.CurrentValueError, "outside_fixed_tabs"):
            client._read_tab("KVL_자동반영이력", 710020128, 22, 1)
        for span in ("'현재등록_공시기반'!A1:M301", "'현재등록_공시기반'!A1:Z300",
                     "'KVL_자동반영이력'!A1:V200", "'KVL_현재값확인'!A1:Z201"):
            with self.subTest(span=span):
                with self.assertRaisesRegex(current.CurrentValueError, "outside_fixed_ranges"):
                    client._request("GET", "?" + urlencode({"ranges": span, "includeGridData": "true", "fields": "sheets"}))
        self.assertEqual(opener.requests, [])

    def test_grown_current_grid_is_blocked_after_metadata_and_before_any_cell_request(self):
        class MetadataOpener(RecordingOpener):
            def open(self, request, timeout):
                self.requests.append(request)
                return Response(request.full_url, {
                    "spreadsheetId": current.SPREADSHEET_ID, "properties": {"title": current.SPREADSHEET_TITLE},
                    "sheets": [{"properties": {"sheetId": current.CURRENT_ID, "title": current.CURRENT_TITLE,
                                               "gridProperties": {"rowCount": 301, "columnCount": 13}}},
                               {"properties": {"sheetId": current.JOURNAL_ID, "title": current.JOURNAL_TITLE,
                                               "gridProperties": {"rowCount": 200, "columnCount": 26}}}]})
        config, target = client_config()
        opener = MetadataOpener()
        client = current.CurrentValueSheetsClient(config, target, lambda *args: None,
                                                 expected_current_sha256=CURRENT_HASH, opener=opener, clock=lambda: NOW)
        with self.assertRaisesRegex(current.CurrentValueError, "outside_bounded_scope"):
            client.read_snapshot()
        self.assertEqual(len(opener.requests), 1)
        self.assertNotIn("ranges=", opener.requests[0].full_url)

    def test_shared_grid_reader_parses_only_fixed_current_and_verification_tabs(self):
        evidence, expected_master, expected_journal = fixture()

        def grid_cells(values, notes=None):
            result = []
            for index, value in enumerate(values):
                key = "numberValue" if isinstance(value, (int, float)) else "stringValue"
                cell = {"userEnteredValue": {key: value}, "effectiveValue": {key: value}}
                if notes and notes[index]:
                    cell["note"] = notes[index]
                result.append(cell)
            return result

        class GridOpener(RecordingOpener):
            def open(self, request, timeout):
                self.requests.append(request)
                query = parse_qs(urlsplit(request.full_url).query)
                if "ranges" not in query:
                    value = {"spreadsheetId": current.SPREADSHEET_ID, "properties": {"title": current.SPREADSHEET_TITLE},
                             "sheets": [{"properties": {"sheetId": current.CURRENT_ID, "title": current.CURRENT_TITLE,
                                                        "gridProperties": {"rowCount": 300, "columnCount": 13}}},
                                        {"properties": {"sheetId": current.JOURNAL_ID, "title": current.JOURNAL_TITLE,
                                                        "gridProperties": {"rowCount": 200, "columnCount": 26}}}]}
                elif query["ranges"] == ["'현재등록_공시기반'!A1:M300"]:
                    value = {"spreadsheetId": current.SPREADSHEET_ID,
                             "sheets": [{"properties": {"sheetId": current.CURRENT_ID, "title": current.CURRENT_TITLE},
                                         "data": [{"startRow": 2, "rowData": [{"values": grid_cells(current.CURRENT_HEADERS)}]},
                                                  {"startRow": 56, "rowData": [
                                                      {"values": grid_cells(item["values"], item["notes"])}
                                                      for item in expected_master["rows"]]}]}]}
                else:
                    if query["ranges"] != ["'KVL_현재값확인'!A1:Z200"]:
                        raise AssertionError("Unexpected non-allowlisted grid request")
                    value = {"spreadsheetId": current.SPREADSHEET_ID,
                             "sheets": [{"properties": {"sheetId": current.JOURNAL_ID, "title": current.JOURNAL_TITLE},
                                         "data": [{"startRow": 0, "rowData": [{"values": grid_cells(current.HEADERS)}]}]}]}
                return Response(request.full_url, value)

        config, target = client_config()
        opener = GridOpener()
        client = current.CurrentValueSheetsClient(config, target, lambda *args: None, opener=opener,
                                                 expected_current_sha256=CURRENT_HASH, clock=lambda: NOW)
        master, journal = client.read_snapshot(), client.read_verification_journal()
        plan = prepare((evidence, master, journal))
        self.assertTrue(plan["append_required"])
        self.assertEqual(master["rows"][0]["row_number"], 57)
        self.assertEqual(master["rows"][0]["values"][10], current.SCOPE["player_id"])
        self.assertEqual(len(opener.requests), 4)
        self.assertTrue(all(request.method == "GET" for request in opener.requests))

    def test_wrong_workbook_and_automatic_or_wrong_account_contexts_are_blocked(self):
        config, target = client_config()
        target["spreadsheet_id"] = "different_workbook_id_123456789"
        with self.assertRaises(current.CurrentValueError):
            current.CurrentValueSheetsClient(config, target, lambda *args: None, expected_current_sha256=CURRENT_HASH)
        config, target = client_config()
        environment = {"GITHUB_REPOSITORY": current.REPOSITORY, "GITHUB_REF": "refs/heads/main",
                       "GITHUB_WORKFLOW_REF": current.WORKFLOW_REF, "GITHUB_EVENT_NAME": "schedule",
                       "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": current.SERVICE_ACCOUNT, "KVL_GOOGLE_ACCESS_TOKEN": "not-a-real-token"}
        with self.assertRaisesRegex(current.CurrentValueError, "trusted_manual"):
            current.CurrentValueSheetsClient.from_environment(config, target, expected_current_sha256=CURRENT_HASH,
                                                               environment=environment)
        environment["GITHUB_EVENT_NAME"] = "workflow_dispatch"
        environment["KVL_PLAYER_MASTER_SERVICE_ACCOUNT"] = "wrong-account@example.test"
        with self.assertRaisesRegex(current.CurrentValueError, "trusted_manual"):
            current.CurrentValueSheetsClient.from_environment(config, target, expected_current_sha256=CURRENT_HASH,
                                                               environment=environment)


if __name__ == "__main__":
    unittest.main()

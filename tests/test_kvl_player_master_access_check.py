"""A disabled pilot can prove bounded read access without any write capability."""
import copy
from datetime import datetime, timezone
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import kvl_player_master_access_check as access

ENV = {"GITHUB_REPOSITORY": access.REPOSITORY, "GITHUB_REF": "refs/heads/main",
       "GITHUB_WORKFLOW_REF": access.WORKFLOW_REF, "GITHUB_EVENT_NAME": "workflow_dispatch",
       "KVL_PLAYER_MASTER_ACCESS_CHECK": "true", "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": access.SERVICE_ACCOUNT}
NOW = datetime(2026, 11, 2, 12, tzinfo=timezone.utc)
SECRET = "test-token-never-log"


class Response:
    status = 200

    def __init__(self, value, url):
        self.payload = value if isinstance(value, bytes) else json.dumps(value).encode()
        self.url = url

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self, size):
        return self.payload[:size]

    def geturl(self):
        return self.url


class Opener:
    def __init__(self, responses):
        self.responses, self.requests, self.response_url = list(responses), [], None

    def open(self, request, timeout):
        self.requests.append(request)
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return Response(item, self.response_url or request.full_url)


class AccessCheckTests(unittest.TestCase):
    def setUp(self):
        self.checkout, self.output = tempfile.TemporaryDirectory(), tempfile.TemporaryDirectory()
        self.addCleanup(self.checkout.cleanup)
        self.addCleanup(self.output.cleanup)
        self.root, self.out = Path(self.checkout.name), Path(self.output.name)
        self.config = json.loads((ROOT / "data/player-updates/master_targets.json").read_text())
        self.pilot = {"schema_version": 1, "enabled": False, "event_scope": None}
        self.save()
        self.target = next(target for target in self.config["targets"] if target["id"] == access.TARGET_ID)
        self.metadata = {"spreadsheetId": access.SPREADSHEET_ID,
                         "properties": {"title": self.target["spreadsheet_title"]}, "sheets": [
                             {"properties": {"sheetId": access.CURRENT_ID, "title": access.CURRENT_TITLE}},
                             {"properties": {"sheetId": access.JOURNAL_ID, "title": access.JOURNAL_TITLE}}]}
        self.headers = {"spreadsheetId": access.SPREADSHEET_ID, "valueRanges": [
            {"range": span, "majorDimension": "ROWS", "values": [headers]}
            for span, headers in zip(access.RANGES, (self.config["headers"], access.JOURNAL_HEADERS))]}

    def save(self):
        directory = self.root / "data/player-updates"
        directory.mkdir(parents=True, exist_ok=True)
        for name, value in (("pilot.json", self.pilot), ("master_targets.json", self.config)):
            (directory / name).write_text(json.dumps(value), encoding="utf-8")

    def run_read(self, opener, environment=None):
        return access.read_access(self.root, environment=environment or {**ENV, "KVL_GOOGLE_ACCESS_TOKEN": SECRET},
                                  opener=opener, now=NOW)

    def test_preflight_needs_no_token_or_network_and_does_not_authorize_writes(self):
        before = {p: p.read_bytes() for p in self.root.rglob("*.json")}
        with patch.object(access, "build_opener", side_effect=AssertionError("network before explicit read")):
            report = access.preflight(self.root, environment=ENV, now=NOW)
        self.assertTrue(report["ready"])
        self.assertFalse(report["authentication_attempted"])
        self.assertFalse(report["read_access_verified"])
        self.assertFalse(report["write_access_tested"])
        self.assertTrue(report["no_data_written"])
        self.assertEqual(before, {p: p.read_bytes() for p in self.root.rglob("*.json")})

    def test_wrong_context_or_account_blocks_before_authentication(self):
        for key in ENV:
            with self.subTest(key=key):
                opener = Opener([])
                report = self.run_read(opener, {**ENV, key: "untrusted"})
                self.assertEqual(report["reason"], "trusted_manual_context_required")
                self.assertFalse(report["authentication_attempted"])
                self.assertEqual(opener.requests, [])

    def test_enabled_writer_or_scope_expansion_blocks_before_requests(self):
        mutations = [(self.pilot, "enabled", True), (self.target, "spreadsheet_id", "another-workbook"),
                     (self.target, "sheet_title", "another-tab"), (self.target["journal"], "sheet_id", 123)]
        for obj, key, value in mutations:
            with self.subTest(key=key):
                old, obj[key] = obj[key], value
                self.save()
                opener = Opener([])
                report = self.run_read(opener)
                self.assertFalse(report["ready"])
                self.assertEqual(opener.requests, [])
                obj[key] = old
        self.save()

    def test_success_uses_only_two_fixed_gets_and_exact_header_ranges(self):
        opener = Opener([self.metadata, self.headers])
        report = self.run_read(opener)
        self.assertEqual(report["status"], "READ_ACCESS_VERIFIED")
        self.assertTrue(report["read_access_verified"] and report["headers_valid"] and report["metadata_valid"])
        self.assertFalse(report["write_access_tested"])
        self.assertEqual(len(opener.requests), 2)
        for req in opener.requests:
            self.assertEqual(req.get_method(), "GET")
            self.assertIsNone(req.data)
            self.assertEqual(req.get_header("Authorization"), "Bearer " + SECRET)
            parsed = urlsplit(req.full_url)
            self.assertEqual(parsed.netloc, "sheets.googleapis.com")
            self.assertTrue(parsed.path.startswith("/v4/spreadsheets/" + access.SPREADSHEET_ID))
        query = parse_qs(urlsplit(opener.requests[1].full_url).query)
        self.assertEqual(query["ranges"], list(access.RANGES))
        self.assertNotIn(SECRET, json.dumps(report))
        self.assertNotIn("values", report)

    def test_wrong_workbook_or_headers_and_extra_rows_cannot_produce_verified_report(self):
        for kind in ("workbook", "header", "extra-row", "range"):
            metadata, headers = copy.deepcopy(self.metadata), copy.deepcopy(self.headers)
            if kind == "workbook":
                metadata["spreadsheetId"] = "wrong-workbook"
            elif kind == "header":
                headers["valueRanges"][0]["values"][0][0] = SECRET
            elif kind == "extra-row":
                headers["valueRanges"][0]["values"].append([SECRET])
            else:
                headers["valueRanges"][0]["range"] = "A1:Z9999"
            with self.subTest(kind=kind):
                report = self.run_read(Opener([metadata, headers]))
                self.assertEqual(report["status"], "FAILED")
                self.assertFalse(report["read_access_verified"])
                self.assertTrue(report["no_data_written"])
                self.assertNotIn(SECRET, json.dumps(report))

    def test_missing_token_http_errors_and_other_exceptions_are_sanitized(self):
        opener = Opener([])
        report = self.run_read(opener, ENV)
        self.assertEqual(report["reason"], "access_token_missing_or_invalid")
        self.assertEqual(opener.requests, [])
        for error, expected in ((HTTPError("https://private/" + SECRET, 403, SECRET, {}, None), "google_sheets_http_403"),
                                (RuntimeError(SECRET), "google_sheets_read_failed")):
            report = self.run_read(Opener([error]))
            self.assertEqual(report["reason"], expected)
            self.assertNotIn(SECRET, json.dumps(report))
            self.assertFalse(report["write_access_tested"])

    def test_redirect_and_oversized_response_are_rejected(self):
        opener = Opener([self.metadata])
        opener.response_url = "https://untrusted.example/"
        self.assertEqual(self.run_read(opener)["reason"], "unexpected_sheets_response")
        opener = Opener([b"x" * (access.MAX_RESPONSE_BYTES + 1)])
        self.assertEqual(self.run_read(opener)["reason"], "sheets_response_too_large")
        self.assertIsNone(access._NoRedirect().redirect_request(None, None, 302, None, None, "https://untrusted.example/"))

    def test_cli_output_is_private_and_does_not_accept_checkout_or_artifact_symlink(self):
        with patch.dict(os.environ, ENV, clear=True), patch("sys.stdout", new_callable=io.StringIO):
            args = ["--preflight", "--root", str(self.root), "--output"]
            self.assertEqual(access.main(args + [str(self.root / "public")]), 2)
            self.assertFalse((self.root / "public").exists())
            self.assertEqual(access.main(args + [str(self.out)]), 0)
            report = json.loads((self.out / "report.json").read_text())
            self.assertEqual(report["status"], "READY_FOR_READ_ONLY_CHECK")
            (self.out / "report.json").unlink()
            victim = self.root / "data/player-updates/pilot.json"
            before = victim.read_bytes()
            (self.out / "report.json").symlink_to(victim)
            self.assertEqual(access.main(args + [str(self.out)]), 2)
            self.assertEqual(victim.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()

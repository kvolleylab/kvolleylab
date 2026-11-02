#!/usr/bin/env python3
"""Explicit manual, GET-only access check for the disabled men's MASTER pilot."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

from kvl_player_master_apply import JOURNAL_HEADERS, JOURNAL_TITLE

REPOSITORY = "kvolleylab/kvolleylab"
WORKFLOW_REF = REPOSITORY + "/.github/workflows/vleague-auto-update-v1.yml@refs/heads/main"
SERVICE_ACCOUNT = "kvl-v-league-updater@kvl-automation.iam.gserviceaccount.com"
SPREADSHEET_ID = "1WD2odv51xNDx9BqRfAjkkLVu0p_DX2EX_GEbqR-G4og"
TARGET_ID = "vleague-men-2026-27-player-master"
CURRENT_TITLE, CURRENT_ID, JOURNAL_ID = "현재등록_공시기반", 710020121, 710020128
RANGES = (f"'{CURRENT_TITLE}'!A3:M3", f"'{JOURNAL_TITLE}'!A1:V1")
BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets/" + SPREADSHEET_ID
MAX_RESPONSE_BYTES = 64_000


class AccessCheckError(ValueError):
    pass


def require(condition, code):
    if not condition:
        raise AccessCheckError(code)


def _configuration(root, environment):
    expected = {"GITHUB_REPOSITORY": REPOSITORY, "GITHUB_REF": "refs/heads/main",
                "GITHUB_WORKFLOW_REF": WORKFLOW_REF, "GITHUB_EVENT_NAME": "workflow_dispatch",
                "KVL_PLAYER_MASTER_ACCESS_CHECK": "true",
                "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": SERVICE_ACCOUNT}
    require(all(environment.get(key) == value for key, value in expected.items()), "trusted_manual_context_required")
    def read(name):
        path = root / "data/player-updates" / name
        require(path.resolve().is_relative_to(root) and not path.is_symlink(), "local_configuration_outside_checkout")
        return json.loads(path.read_text(encoding="utf-8"))
    pilot, config = read("pilot.json"), read("master_targets.json")
    require(pilot.get("schema_version") == 1 and pilot.get("enabled") is False, "player_writer_must_remain_disabled")
    targets = [item for item in config["targets"] if item.get("id") == TARGET_ID]
    require(len(targets) == 1, "unique_men_target_required")
    target, journal = targets[0], targets[0].get("journal", {})
    require(target.get("spreadsheet_id") == SPREADSHEET_ID and target.get("gender") == "남"
            and target.get("sheet_title") == CURRENT_TITLE and target.get("sheet_id") == CURRENT_ID
            and config.get("header_row") == 3 and len(config["headers"]) == 13,
            "fixed_men_target_mismatch")
    require(journal.get("title") == JOURNAL_TITLE and journal.get("sheet_id") == JOURNAL_ID
            and journal.get("header_row") == 1 and journal.get("headers") == JOURNAL_HEADERS,
            "fixed_journal_target_mismatch")
    return config, target


def _report(now=None):
    return {"schema_version": 1, "status": "BLOCKED", "ready": False, "reason": "not_checked",
            "checked_at": (now or datetime.now(timezone.utc)).isoformat(), "target_id": TARGET_ID,
            "read_access_verified": False, "metadata_valid": False, "headers_valid": False,
            "authentication_attempted": False, "no_data_written": True, "write_access_tested": False}


def preflight(root, *, environment=None, now=None):
    """Validate only local configuration; neither authentication nor requests occur."""
    report = _report(now)
    try:
        _configuration(Path(root).resolve(), os.environ if environment is None else environment)
        report.update(status="READY_FOR_READ_ONLY_CHECK", ready=True, reason="ready")
    except AccessCheckError as error:
        report["reason"] = str(error)
    except Exception:
        report["reason"] = "invalid_local_configuration"
    return report


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _get(opener, suffix, token):
    url = BASE_URL + suffix
    request = Request(url, headers={"Accept": "application/json", "Authorization": "Bearer " + token}, method="GET")
    with opener.open(request, timeout=25) as response:
        require(response.status == 200 and response.geturl() == url, "unexpected_sheets_response")
        payload = response.read(MAX_RESPONSE_BYTES + 1)
    require(len(payload) <= MAX_RESPONSE_BYTES, "sheets_response_too_large")
    value = json.loads(payload)
    require(isinstance(value, dict) and "error" not in value, "invalid_sheets_response")
    return value


def read_access(root, *, environment=None, opener=None, now=None):
    """Read workbook metadata and exactly two header rows. No write method exists."""
    environment = os.environ if environment is None else environment
    report = preflight(root, environment=environment, now=now)
    if not report["ready"]:
        return report
    try:
        config, target = _configuration(Path(root).resolve(), environment)
        token = environment.get("KVL_GOOGLE_ACCESS_TOKEN", "")
        require(isinstance(token, str) and token and not any(char.isspace() for char in token), "access_token_missing_or_invalid")
        opener = opener or build_opener(_NoRedirect())
        report["authentication_attempted"] = True
        metadata = _get(opener, "?" + urlencode({"fields": "spreadsheetId,properties(title),sheets(properties(sheetId,title))"}), token)
        require(metadata.get("spreadsheetId") == SPREADSHEET_ID
                and metadata.get("properties", {}).get("title") == target["spreadsheet_title"], "workbook_metadata_mismatch")
        properties = [sheet.get("properties", {}) for sheet in metadata.get("sheets", [])]
        for title, sheet_id in ((CURRENT_TITLE, CURRENT_ID), (JOURNAL_TITLE, JOURNAL_ID)):
            matches = [item for item in properties if item.get("title") == title]
            require(len(matches) == 1 and matches[0].get("sheetId") == sheet_id, "tab_metadata_mismatch")
        report["metadata_valid"] = True
        payload = _get(opener, "/values:batchGet?" + urlencode({"ranges": RANGES, "majorDimension": "ROWS",
                       "valueRenderOption": "UNFORMATTED_VALUE"}, doseq=True), token)
        require(payload.get("spreadsheetId") == SPREADSHEET_ID and len(payload.get("valueRanges", [])) == 2,
                "bounded_header_response_mismatch")
        for actual, span, headers in zip(payload["valueRanges"], RANGES, (config["headers"], JOURNAL_HEADERS)):
            require(actual.get("range") in {span, span.replace("'", "")} and actual.get("majorDimension") == "ROWS"
                    and actual.get("values") == [headers], "exact_header_schema_mismatch")
        report.update(status="READ_ACCESS_VERIFIED", reason="read_only_headers_verified",
                      read_access_verified=True, headers_valid=True)
    except AccessCheckError as error:
        report.update(status="FAILED", ready=False, reason=str(error))
    except HTTPError as error:
        report.update(status="FAILED", ready=False, reason=f"google_sheets_http_{int(error.code)}")
    except Exception:
        report.update(status="FAILED", ready=False, reason="google_sheets_read_failed")
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--preflight", action="store_true")
    mode.add_argument("--read", action="store_true")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        root, output = args.root.resolve(), args.output.resolve()
        require(not output.is_relative_to(root), "output_must_be_outside_checkout")
        destination = output / "report.json"
        require(not destination.is_symlink(), "artifact_symlink_not_allowed")
        report = (preflight if args.preflight else read_access)(root)
        output.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"PLAYER_MASTER_ACCESS_CHECK status={report['status']} reason={report['reason']} no_data_written=true write_access_tested=false")
        return 0 if report["ready"] else 2
    except (AccessCheckError, OSError):
        print("PLAYER_MASTER_ACCESS_CHECK status=FAILED reason=runtime_output_error no_data_written=true write_access_tested=false")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

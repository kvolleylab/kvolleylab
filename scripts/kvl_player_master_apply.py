#!/usr/bin/env python3
"""One reviewed player event: precise MASTER cells, atomic journal, readback.

No workbook/tab/ID creation and no membership changes are permitted here.
The separate, preconfigured journal covers this pilot only, not legacy history.
Snapshots contain private rows and must remain outside public Git. Plans and
receipts contain allowlisted facts and hashes only. Sheets has no cell CAS;
fresh preflight and readback detect optimistic conflicts, not a human edit lock.
"""
from __future__ import annotations

import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

from kvl_player_master_plan import aware_datetime, build_plan, snapshot_problems
from kvl_player_updates import (digest, public_security_scan, validate_public_export,
                                validate_public_ledger)

JOURNAL_TITLE = "KVL_자동반영이력"
JOURNAL_HEADERS = [
    "Event_ID", "Player_ID", "Source_ID", "Revision_ID", "Source_Version",
    "Season", "Gender", "Team", "Kind", "Effective_Date", "Source_URL",
    "Value_Column", "Before_Value", "After_Value", "Before_Source_URL",
    "After_Source_URL", "Applied_At", "Status", "Row_Number",
    "Row_Before_SHA256", "Row_After_SHA256", "Approval_SHA256",
]
SCOPE_KEYS = ("event_id", "player_id", "source_id", "revision_id")
LOCK_MARKER = re.compile(r"\[\s*(?:LOCK|MANUAL|수동|잠금)\s*\]|자동\s*갱신\s*금지|수동\s*확정", re.I)
MAX_SOURCE_AGE_SECONDS = 300
MAX_GRID_ROWS = 2000
VALUE_COLUMNS = {"number_change": ("B", "number"), "position_change": ("E", "position")}
SOURCE_WRITE_FIELDS = "userEnteredValue,userEnteredFormat.textFormat.link.uri"
POSITION_CODES = {"세터": "S", "아웃사이드히터": "OH", "아포짓": "OP", "아포짓스파이커": "OP",
                  "미들블로커": "MB", "리베로": "L"}


class PlayerMasterError(ValueError):
    """Sanitized fail-closed error; never include the private row or credentials."""


def require(condition, code):
    if not condition:
        raise PlayerMasterError(code)


def timestamp(now):
    return now.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def fresh(value, now, maximum=MAX_SOURCE_AGE_SECONDS):
    parsed = aware_datetime(value)
    return parsed is not None and 0 <= (now - parsed).total_seconds() <= maximum


def normalized(value, kind):
    value = str(value).strip()
    if kind == "number_change":
        require(re.fullmatch(r"\d{1,3}", value) is not None and 1 <= int(value) <= 999,
                "invalid_reviewed_number")
        return str(int(value))
    value = POSITION_CODES.get(value.replace(" ", ""), value)
    require(value in {"S", "OH", "OP", "MB", "L"}, "invalid_reviewed_position")
    return value


def _scope(config):
    scope = config.get("pilot_scope", {})
    require(set(scope) == set(SCOPE_KEYS) and all(isinstance(v, str) and v for v in scope.values()),
            "one_explicit_pilot_scope_required")
    require(re.fullmatch(r"KVL-P-\d{6}", scope["player_id"]) is not None,
            "existing_player_id_required")
    require(scope["event_id"] == "KVL-PE-" + digest([scope["player_id"], scope["source_id"], "change"])[:24],
            "event_id_does_not_match_player_source_identity")
    return scope


def _stable_snapshot(snapshot):
    return {key: value for key, value in snapshot.items() if key != "fetched_at"}


def _sheet_metadata(snapshot):
    return {key: value for key, value in snapshot.items() if key not in {"fetched_at", "rows"}}


def _require_cell_metadata(snapshot, columns, label):
    """Keep formulas, validation and notes in preflight/readback hashes."""
    require(snapshot.get("validation_metadata_complete") is True,
            f"{label}_validation_metadata_unknown")
    for key in ("header_formulas", "header_notes", "header_data_validations", "header_explicit_link_uris"):
        require(isinstance(snapshot.get(key), list) and len(snapshot[key]) == columns,
                f"{label}_header_metadata_incomplete")
    require(type(snapshot.get("header_manual_locked")) is bool
            and type(snapshot.get("header_protected")) is bool
            and isinstance(snapshot.get("protected_ranges"), list),
            f"{label}_header_or_protection_metadata_unknown")
    # A protected header is legitimate. A formula or explicit manual lock in
    # the schema header requires review even if its effective text matches.
    require(not any(snapshot["header_formulas"])
            and not snapshot["header_manual_locked"]
            and not any(LOCK_MARKER.search(str(note)) for note in snapshot["header_notes"]),
            f"{label}_header_formula_or_manual_lock")
    for row in snapshot.get("rows", []):
        require(isinstance(row.get("notes"), list) and len(row["notes"]) == columns
                and isinstance(row.get("data_validations"), list)
                and len(row["data_validations"]) == columns
                and isinstance(row.get("explicit_link_uris"), list)
                and len(row["explicit_link_uris"]) == columns,
                f"{label}_cell_metadata_incomplete")
        require(all(isinstance(note, str) for note in row["notes"])
                and all(isinstance(rule, dict) for rule in row["data_validations"])
                and all(isinstance(uri, str) for uri in row["explicit_link_uris"]),
                f"{label}_cell_metadata_invalid")


def _destination_row(snapshot, row_number, columns):
    rows = [row for row in snapshot.get("rows", []) if row["row_number"] == row_number]
    require(len(rows) <= 1, "duplicate_destination_row")
    if rows:
        return copy.deepcopy(rows[0])
    return {"row_number": row_number, "values": [""] * columns,
            "formulas": [""] * columns, "notes": [""] * columns,
            "data_validations": [{} for _ in range(columns)], "explicit_link_uris": [""] * columns,
            "manual_locked": False}


def _require_writable_destination(snapshot, row, indexes, label):
    require(row.get("manual_locked") is False
            and not any(LOCK_MARKER.search(str(note)) for note in row["notes"])
            and not any(PlayerSheetsClient._intersects(span, snapshot["sheet_id"], row["row_number"],
                                                       len(row["values"]))
                        for span in snapshot["protected_ranges"]), f"{label}_destination_protected_or_locked")
    # This narrow pilot has no generic Sheets validation/formula evaluator.
    # Preserve every rule, and fail closed if a destination has any rule.
    require(not any(row["data_validations"][index] for index in indexes),
            f"{label}_destination_data_validation_requires_review")


def _journal_config(target):
    result = target.get("journal", {})
    require(result.get("title") == JOURNAL_TITLE and result.get("header_row") == 1
            and result.get("headers") == JOURNAL_HEADERS and type(result.get("sheet_id")) is int
            and result["sheet_id"] != target["sheet_id"], "preconfigured_journal_required")
    return result


def journal_events(config, target, journal, now):
    """Validate the whole dedicated pilot journal; do not certify legacy history."""
    spec, scope = _journal_config(target), _scope(config)
    require(journal.get("spreadsheet_id") == target["spreadsheet_id"]
            and journal.get("sheet_id") == spec["sheet_id"]
            and journal.get("sheet_title") == spec["title"]
            and journal.get("headers") == JOURNAL_HEADERS and journal.get("header_row") == 1,
            "journal_target_or_schema_mismatch")
    require(journal.get("scope") == scope, "journal_scope_mismatch")
    require(journal.get("formula_metadata_complete") is True
            and journal.get("lock_metadata_complete") is True
            and journal.get("all_rows_read") is True, "journal_metadata_or_coverage_unknown")
    require(fresh(journal.get("fetched_at"), now), "journal_snapshot_not_fresh")
    require(type(journal.get("grid_row_count")) is int and 2 <= journal["grid_row_count"] <= MAX_GRID_ROWS,
            "journal_grid_outside_bounds")
    require(journal.get("grid_column_count", 0) >= len(JOURNAL_HEADERS), "journal_grid_too_small")
    _require_cell_metadata(journal, len(JOURNAL_HEADERS), "journal")
    require(journal.get("protected") is False or bool(journal["protected_ranges"]),
            "journal_protection_metadata_missing")
    seen_rows, seen_events, seen_revisions, entries = set(), set(), set(), []
    for row in journal.get("rows", []):
        number, values, formulas = row.get("row_number"), row.get("values", []), row.get("formulas", [])
        require(type(number) is int and 2 <= number <= journal["grid_row_count"] and number not in seen_rows,
                "invalid_or_duplicate_journal_row")
        seen_rows.add(number)
        require(len(values) == len(JOURNAL_HEADERS) and len(formulas) == len(JOURNAL_HEADERS),
                "incomplete_journal_row")
        require(row.get("manual_locked") is False and not any(formulas)
                and not any(isinstance(value, str) and value.startswith("=") for value in values),
                "journal_formula_or_lock")
        if not any(value != "" for value in values):
            continue
        entry = dict(zip(JOURNAL_HEADERS, values))
        identity = (entry["Player_ID"], entry["Source_ID"], entry["Revision_ID"])
        require(identity not in seen_revisions, "duplicate_applied_player_source_revision")
        seen_revisions.add(identity)
        require(entry["Event_ID"] and entry["Event_ID"] not in seen_events, "duplicate_or_empty_journal_event")
        seen_events.add(entry["Event_ID"])
        require(entry["Player_ID"] == scope["player_id"] and entry["Source_ID"] == scope["source_id"]
                and entry["Event_ID"] == scope["event_id"], "journal_contains_out_of_scope_event")
        require(entry["Revision_ID"] == scope["revision_id"], "source_revision_correction_requires_review")
        require(entry["Status"] in {"applied", "verified_existing"}, "journal_status_not_applied")
        entries.append(entry)
    return entries


def prepare_application(config, exported, ledger, snapshot, journal, *, source_readback=None, now=None):
    """Return a sanitized one-event plan, or raise before any external write.

    source_readback is a trusted in-process result of the runtime entrypoint's
    fresh official fetch and parse. It is not a signed receipt or an input-file
    authorization mechanism; callers must not fabricate freshness for a cache.
    """
    now = now or datetime.now(timezone.utc)
    validate_public_export(exported)
    validate_public_ledger(ledger)
    scope = _scope(config)
    require(len(exported.get("events", [])) == 1, "exactly_one_reviewed_event_required")
    event = exported["events"][0]
    require(all(event.get(key) == value for key, value in scope.items()), "event_outside_pilot_scope")
    require(event.get("kind") in VALUE_COLUMNS, "membership_or_other_event_not_allowed")
    target = next((item for item in config["targets"] if item["gender"] == event.get("gender")), None)
    require(target is not None, "verified_gender_target_missing")
    require(not snapshot_problems(config, target, snapshot, now), "master_snapshot_invalid")
    _require_cell_metadata(snapshot, len(config["headers"]), "master")
    require(fresh(snapshot.get("fetched_at"), now) and snapshot.get("all_rows_read") is True,
            "master_snapshot_not_fresh_or_incomplete")
    candidate = next((item for item in ledger.get("candidates", []) if item.get("revision_id") == scope["revision_id"]), None)
    require(candidate is not None, "current_candidate_missing")
    require(candidate["revision_id"] == "KVL-PCR-" + digest({key: value for key, value in candidate.items()
                        if key not in {"revision_id", "review_status"}}), "candidate_revision_checksum_mismatch")
    source_readback = source_readback or {}
    require(fresh(source_readback.get("fetched_at"), now), "fresh_official_source_readback_required")
    for key in ("source_id", "source_version", "revision_id", "source_body_sha256"):
        require(source_readback.get(key) == candidate.get(key), "official_source_revision_changed")
    # The pilot is intentionally stricter than the general human-review ledger:
    # publication dates and a manually asserted date cannot authorize a write.
    # The runtime entrypoint builds this proof from a fresh official GET.
    require(event.get("effective_date_basis") == "official_notice_text"
            and candidate.get("effective_date_basis") == "explicit_effective_date"
            and bool(candidate.get("effective_date"))
            and candidate["effective_date"] == event.get("effective_date")
            and source_readback.get("parsed_effective_date") == event.get("effective_date"),
            "explicit_official_effective_date_mismatch_or_missing")
    history = journal_events(config, target, journal, now)
    local = build_plan(config, exported, ledger, [snapshot], {"complete": True, "events": [
        {"event_id": item["Event_ID"], "player_id": item["Player_ID"], "source_id": item["Source_ID"],
         "revision_id": item["Revision_ID"]} for item in history]}, now=now)
    require(not local["blocked"], "review_or_master_plan_blocked")
    matches = [row for row in snapshot["rows"] if row["values"][10] == scope["player_id"]]
    require(len(matches) == 1, "player_id_not_unique")
    row = matches[0]
    column, field = VALUE_COLUMNS[event["kind"]]
    index = ord(column) - ord("A")
    desired = normalized(event["observed"].get("new_" + field, ""), event["kind"])
    previous = normalized(event["observed"].get("previous_" + field, ""), event["kind"])
    actual = normalized(row["values"][index], event["kind"])
    require(actual in {previous, desired}, "master_value_conflicts_with_reviewed_transition")
    require(re.fullmatch(r"https://kovo\.co\.kr/news/official-notices/\d+", event.get("source_url", "")) is not None,
            "exact_official_source_url_required")
    require(not LOCK_MARKER.search(str(row["values"][11]) + " " + str(row["values"][12])),
            "manual_lock_marker")
    existing = history[0] if history else None
    if existing:
        require(existing["Source_Version"] == event["source_version"]
                and existing["Effective_Date"] == event["effective_date"]
                and existing["Source_URL"] == event["source_url"]
                and existing["After_Value"] == desired
                and existing["Approval_SHA256"] == digest(event), "applied_journal_evidence_conflict")
        require(actual == desired and row["values"][9] == event["source_url"]
                and row["explicit_link_uris"][9] in {"", event["source_url"]}, "applied_event_master_drift")
    updates = []
    if not existing:
        for col, before, after in ((column, row["values"][index], desired),
                                   ("J", row["values"][9], event["source_url"])):
            changed = normalized(before, event["kind"]) != after if col == column else (
                before != after or bool(row["explicit_link_uris"][9] and row["explicit_link_uris"][9] != after))
            if changed:
                update = {"cell": f"{col}{row['row_number']}", "before": before, "after": after}
                if col == "J":
                    update.update(before_link_uri=row["explicit_link_uris"][9], after_link_uri=after)
                updates.append(update)
    after_row = copy.deepcopy(row)
    _require_writable_destination(snapshot, row,
                                  [ord(update["cell"][0]) - ord("A") for update in updates], "master")
    for update in updates:
        after_row["values"][ord(update["cell"][0]) - ord("A")] = update["after"]
        if update["cell"].startswith("J"):
            after_row["explicit_link_uris"][9] = update["after_link_uri"]
    filled = [item["row_number"] for item in journal.get("rows", []) if any(value != "" for value in item["values"])]
    next_row = max([1] + filled) + 1
    require(existing is not None or next_row <= journal["grid_row_count"], "journal_capacity_exhausted")
    status = "already_applied" if existing else "applied" if updates else "verified_existing"
    journal_values = [] if existing else [
        event["event_id"], event["player_id"], event["source_id"], event["revision_id"], event["source_version"],
        event["season"], event["gender"], event["team_as_published"], event["kind"], event["effective_date"],
        event["source_url"], column, str(row["values"][index]), desired, row["values"][9], event["source_url"],
        timestamp(now), status, str(row["row_number"]), digest(row), digest(after_row), digest(event),
    ]
    expected_journal_rows = copy.deepcopy(journal.get("rows", []))
    if journal_values:
        destination = _destination_row(journal, next_row, len(JOURNAL_HEADERS))
        _require_writable_destination(journal, destination, range(len(JOURNAL_HEADERS)), "journal")
        require(not any(destination["formulas"]) and not any(value != "" for value in destination["values"]),
                "journal_destination_not_empty")
        destination["values"] = journal_values[:]
        expected_journal_rows = [item for item in expected_journal_rows if item["row_number"] != next_row]
        expected_journal_rows.append(destination)
        expected_journal_rows.sort(key=lambda item: item["row_number"])
    plan = {"schema_version": 1, "config": copy.deepcopy(config), "target_id": target["id"],
            "target": copy.deepcopy(target), "event": copy.deepcopy(event), "value_column": column,
            "expected_previous_value": previous, "desired_value": desired, "target_value_before": row["values"][index],
            "row_number": row["row_number"], "updates": updates, "application_status": status,
            "source_readback_at": source_readback["fetched_at"], "prepared_at": timestamp(now),
            "expected_snapshot_sha256": digest(_stable_snapshot(snapshot)),
            "expected_metadata_sha256": digest(_sheet_metadata(snapshot)),
            "expected_row_sha256": digest(row), "expected_after_row_sha256": digest(after_row),
            "unchanged_rows_sha256": digest([item for item in snapshot["rows"] if item["row_number"] != row["row_number"]]),
            "expected_journal_sha256": digest(_stable_snapshot(journal)),
            "expected_journal_metadata_sha256": digest(_sheet_metadata(journal)),
            "expected_journal_rows_sha256": digest(expected_journal_rows),
            "journal_row_number": next_row if not existing else None, "journal_values": journal_values,
            "existing_journal_entry": existing}
    plan["plan_hash"] = digest(plan)
    public_security_scan(plan)
    return plan


def _cell_request(sheet_id, row, column, value, explicit_link_uri=None):
    require(isinstance(value, (str, int, float)) and not isinstance(value, bool), "unsafe_cell_value")
    require(not (isinstance(value, str) and value.startswith("=")), "formula_like_cell_value")
    entered = {"stringValue": value} if isinstance(value, str) else {"numberValue": value}
    cell, fields = {"userEnteredValue": entered}, "userEnteredValue"
    if explicit_link_uri is not None:
        require(column == 10 and isinstance(value, str) and explicit_link_uri == value
                and re.fullmatch(r"https://kovo\.co\.kr/news/official-notices/\d+", value) is not None,
                "source_link_must_match_official_cell_value")
        cell["userEnteredFormat"] = {"textFormat": {"link": {"uri": explicit_link_uri}}}
        fields = SOURCE_WRITE_FIELDS
    return {"updateCells": {"start": {"sheetId": sheet_id, "rowIndex": row - 1, "columnIndex": column - 1},
                            "rows": [{"values": [cell]}], "fields": fields}}


def batch_requests(plan):
    require(plan.get("plan_hash") == digest({key: value for key, value in plan.items() if key != "plan_hash"}),
            "plan_checksum_mismatch")
    requests = []
    for update in plan["updates"]:
        require(update["cell"] in {f"{plan['value_column']}{plan['row_number']}", f"J{plan['row_number']}"},
                "update_outside_pilot_cells")
        if update["cell"].startswith("J"):
            require(update.get("after_link_uri") == update["after"], "source_link_binding_missing")
        requests.append(_cell_request(plan["target"]["sheet_id"], plan["row_number"],
                                      ord(update["cell"][0]) - 64, update["after"],
                                      update.get("after_link_uri") if update["cell"].startswith("J") else None))
    if plan["journal_values"]:
        cells = [{"userEnteredValue": {"stringValue": str(value)}} for value in plan["journal_values"]]
        requests.append({"updateCells": {"start": {"sheetId": plan["target"]["journal"]["sheet_id"],
                        "rowIndex": plan["journal_row_number"] - 1, "columnIndex": 0},
                        "rows": [{"values": cells}], "fields": "userEnteredValue"}})
    return requests


def apply_application(client, plan, *, now=None):
    """Re-read, atomically write values+journal once, then verify all readback."""
    clock = (lambda: now) if now is not None else (lambda: datetime.now(timezone.utc))
    requests = batch_requests(plan)
    require(fresh(plan.get("source_readback_at"), clock()), "official_source_readback_expired")
    require(getattr(client, "spreadsheet_id", None) == plan["target"]["spreadsheet_id"], "wrong_master_client")
    before = client.read_snapshot()
    before_journal = client.read_journal(_scope(plan["config"]))
    require(digest(_stable_snapshot(before)) == plan["expected_snapshot_sha256"], "master_changed_since_prepare")
    require(digest(_stable_snapshot(before_journal)) == plan["expected_journal_sha256"], "journal_changed_since_prepare")
    checked_at = clock()
    require(fresh(before.get("fetched_at"), checked_at), "master_preflight_not_fresh")
    journal_events(plan["config"], plan["target"], before_journal, checked_at)
    require(fresh(plan.get("source_readback_at"), checked_at), "official_source_readback_expired_before_write")
    uncertain = False
    if requests:
        try:
            client.batch_apply(requests)
        except Exception:
            uncertain = True
    after = client.read_snapshot()
    after_journal = client.read_journal(_scope(plan["config"]))
    verified_at = clock()
    require(not snapshot_problems(plan["config"], plan["target"], after, verified_at), "master_readback_metadata_invalid")
    _require_cell_metadata(after, len(plan["config"]["headers"]), "master")
    require(digest(_sheet_metadata(after)) == plan["expected_metadata_sha256"], "master_readback_metadata_changed")
    require(fresh(after.get("fetched_at"), verified_at), "master_readback_not_fresh")
    rows = [row for row in after["rows"] if row["values"][10] == plan["event"]["player_id"]]
    require(len(rows) == 1 and rows[0]["row_number"] == plan["row_number"]
            and digest(rows[0]) == plan["expected_after_row_sha256"], "master_readback_mismatch")
    require(digest([row for row in after["rows"] if row["row_number"] != plan["row_number"]])
            == plan["unchanged_rows_sha256"], "unrelated_master_rows_changed")
    history = journal_events(plan["config"], plan["target"], after_journal, verified_at)
    require(digest(_sheet_metadata(after_journal)) == plan["expected_journal_metadata_sha256"]
            and digest(after_journal.get("rows", [])) == plan["expected_journal_rows_sha256"],
            "journal_readback_metadata_or_rows_changed")
    require(len(history) == 1, "journal_readback_event_missing_or_duplicate")
    expected = dict(zip(JOURNAL_HEADERS, plan["journal_values"])) if plan["journal_values"] else plan["existing_journal_entry"]
    require(history[0] == expected, "journal_readback_mismatch")
    event = plan["event"]
    receipt = {"schema_version": 1, "status": "MASTER_READBACK_VERIFIED", "season": event["season"],
               "target_id": plan["target_id"], "gender": event["gender"], "team": event["team_as_published"],
               "player_id": event["player_id"], "event_id": event["event_id"], "candidate_id": event["candidate_id"],
               "revision_id": event["revision_id"], "source_id": event["source_id"], "source_url": event["source_url"],
               "source_version": event["source_version"], "effective_date": event["effective_date"], "kind": event["kind"],
               "expected_previous_value": plan["expected_previous_value"], "desired_value": plan["desired_value"],
               "target_value_before": plan["target_value_before"], "application_status": plan["application_status"],
               "changed_cells": len(plan["updates"]), "journal_rows_added": int(bool(plan["journal_values"])),
               "source_readback_at": plan["source_readback_at"], "verified_at": timestamp(verified_at), "plan_hash": plan["plan_hash"],
               "uncertain_write_response": uncertain,
               "master_readback": {"verified": True, "value": plan["desired_value"], "player_id": event["player_id"],
                                   "source_url": event["source_url"], "row_number": plan["row_number"]}}
    public_security_scan(receipt)
    return receipt


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class PlayerSheetsClient:
    """Sheets-only authenticated transport, pinned to the explicit pilot workbook."""

    def __init__(self, config, target, authorize_headers, *, opener=None, clock=None):
        require(target in config["targets"], "unapproved_player_master_target")
        _scope(config)
        _journal_config(target)
        self.config, self.target = copy.deepcopy(config), copy.deepcopy(target)
        self.spreadsheet_id = target["spreadsheet_id"]
        require(re.fullmatch(r"[A-Za-z0-9_-]{20,100}", self.spreadsheet_id) is not None, "invalid_spreadsheet_id")
        self._base = "https://sheets.googleapis.com/v4/spreadsheets/" + self.spreadsheet_id
        self._authorize, self._opener = authorize_headers, opener or build_opener(_NoRedirect())
        self._clock = clock or (lambda: datetime.now(timezone.utc))

    @classmethod
    def from_environment(cls, config, target):
        token = os.environ.get("KVL_GOOGLE_ACCESS_TOKEN", "")
        if token:
            require(not any(char.isspace() for char in token), "invalid_google_access_token")
            return cls(config, target, lambda method, url, headers: headers.update({"Authorization": "Bearer " + token}))
        credential_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
        require(credential_path and Path(credential_path).is_file(), "player_master_credentials_not_configured")
        try:
            import google.auth
            from google.auth.transport.requests import Request as AuthRequest
            credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/spreadsheets"])
            auth_request = AuthRequest()
        except Exception:
            raise PlayerMasterError("player_master_credentials_could_not_load") from None
        return cls(config, target, lambda method, url, headers: credentials.before_request(auth_request, method, url, headers))

    def _request(self, method, suffix, body=None):
        url = self._base + suffix
        headers = {"Accept": "application/json"}
        payload = None if body is None else json.dumps(body, ensure_ascii=False).encode()
        if payload is not None:
            headers["Content-Type"] = "application/json; charset=utf-8"
        try:
            self._authorize(method, url, headers)
            with self._opener.open(Request(url, data=payload, headers=headers, method=method), timeout=25) as response:
                require(response.status == 200 and response.geturl() == url, "unexpected_sheets_response")
                raw = response.read(8_000_001)
                require(len(raw) <= 8_000_000, "sheets_response_too_large")
            result = json.loads(raw)
            require(isinstance(result, dict) and "error" not in result, "invalid_sheets_response")
            return result
        except HTTPError as error:
            raise PlayerMasterError(f"google_sheets_http_{error.code}") from None
        except (URLError, TimeoutError, OSError):
            raise PlayerMasterError("google_sheets_network_failure") from None
        except PlayerMasterError:
            raise
        except Exception:
            raise PlayerMasterError("google_sheets_authentication_or_parse_failure") from None

    def _metadata(self):
        result = self._request("GET", "?" + urlencode({"fields": "spreadsheetId,properties(title),sheets(properties,protectedRanges)"}))
        require(result.get("spreadsheetId") == self.spreadsheet_id
                and result.get("properties", {}).get("title") == self.target["spreadsheet_title"], "master_workbook_changed")
        return result

    def _read_tab(self, title, sheet_id, columns, header_row):
        metadata = self._metadata()
        matches = [sheet for sheet in metadata.get("sheets", []) if sheet.get("properties", {}).get("title") == title]
        require(len(matches) == 1 and matches[0]["properties"].get("sheetId") == sheet_id, "master_tab_changed")
        sheet = matches[0]
        grid = sheet["properties"].get("gridProperties", {})
        row_count = grid.get("rowCount", 0)
        require(header_row < row_count <= MAX_GRID_ROWS and grid.get("columnCount", 0) >= columns, "master_grid_outside_bounds")
        quoted = "'" + title.replace("'", "''") + "'"
        result = self._request("GET", "?" + urlencode({
            "ranges": f"{quoted}!A1:{chr(64 + columns)}{row_count}", "includeGridData": "true",
            "fields": "spreadsheetId,sheets(properties(sheetId,title),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue,formattedValue,note,dataValidation,userEnteredFormat(textFormat(link))))))"}))
        returned = result.get("sheets", [])
        require(len(returned) == 1 and returned[0].get("properties", {}).get("sheetId") == sheet_id,
                "master_grid_response_target_mismatch")
        rows, raw_by_row = [], {}
        for block in returned[0].get("data", []):
            require(block.get("startColumn", 0) == 0, "unexpected_grid_start_column")
            for offset, raw in enumerate(block.get("rowData", [])):
                number = block.get("startRow", 0) + offset + 1
                require(number not in raw_by_row, "overlapping_grid_data")
                raw_by_row[number] = raw.get("values", [])
        headers, header_formulas, header_notes, header_validations, header_links = [], [], [], [], []
        header_locked, header_protected = False, False
        # Editors' account details are not needed for lock decisions. Preserve
        # the structural protection metadata so a concurrent change is visible.
        protection = [{key: copy.deepcopy(value) for key, value in item.items()
                       if key in {"range", "namedRangeId", "unprotectedRanges", "warningOnly"}}
                      for item in sheet.get("protectedRanges", [])]
        for number, cells in sorted(raw_by_row.items()):
            cells = cells[:columns] + [{}] * max(0, columns - len(cells))
            values, formulas, notes, validations, links = [], [], [], [], []
            for cell in cells:
                entered = cell.get("userEnteredValue", {})
                effective = cell.get("effectiveValue", entered)
                values.append(effective.get("stringValue", effective.get("numberValue", effective.get("boolValue", ""))))
                formulas.append(entered.get("formulaValue", ""))
                notes.append(cell.get("note", ""))
                validations.append(copy.deepcopy(cell.get("dataValidation", {})))
                links.append(cell.get("userEnteredFormat", {}).get("textFormat", {}).get("link", {}).get("uri", ""))
            protected = any(self._intersects(item, sheet_id, number, columns) for item in protection)
            if number == header_row:
                headers = values
                header_formulas, header_notes, header_validations = formulas, notes, validations
                header_links = links
                header_locked = any(LOCK_MARKER.search(str(note)) for note in notes)
                header_protected = protected
            if number > header_row and (any(value != "" for value in values) or any(formulas) or any(notes) or any(validations) or any(links)):
                rows.append({"row_number": number, "values": values, "formulas": formulas,
                             "notes": notes, "data_validations": validations, "explicit_link_uris": links,
                             "manual_locked": protected or any(LOCK_MARKER.search(str(note)) for note in notes)
                             or (columns == 13 and bool(LOCK_MARKER.search(str(values[11]) + " " + str(values[12]))))})
        return {"headers": headers, "rows": rows, "grid_row_count": row_count,
                "grid_column_count": grid.get("columnCount"), "fetched_at": timestamp(self._clock()),
                "formula_metadata_complete": True, "lock_metadata_complete": True, "all_rows_read": True,
                "validation_metadata_complete": True, "protected_ranges": protection,
                "header_formulas": header_formulas, "header_notes": header_notes,
                "header_data_validations": header_validations, "header_manual_locked": header_locked,
                "header_explicit_link_uris": header_links,
                "header_protected": header_protected,
                "protected": bool(protection)}

    @staticmethod
    def _intersects(protection, sheet_id, row, columns):
        span = protection.get("range")
        if not isinstance(span, dict):
            return True  # Named/unknown protection cannot be safely resolved.
        return (span.get("sheetId", sheet_id) == sheet_id
                and span.get("startRowIndex", 0) <= row - 1 < span.get("endRowIndex", MAX_GRID_ROWS)
                and span.get("startColumnIndex", 0) < columns and span.get("endColumnIndex", columns) > 0)

    def read_snapshot(self):
        result = self._read_tab(self.target["sheet_title"], self.target["sheet_id"], 13, self.config["header_row"])
        result.pop("protected")
        result.update({key: self.target[key] for key in ("spreadsheet_id", "spreadsheet_title", "sheet_id", "sheet_title", "snapshot_kind")})
        result["header_row"] = self.config["header_row"]
        return result

    def read_journal(self, scope):
        require(scope == _scope(self.config), "journal_scope_mismatch")
        spec = _journal_config(self.target)
        result = self._read_tab(spec["title"], spec["sheet_id"], len(JOURNAL_HEADERS), 1)
        result.update(spreadsheet_id=self.spreadsheet_id, sheet_id=spec["sheet_id"], sheet_title=spec["title"],
                      header_row=1, scope=copy.deepcopy(scope))
        return result

    def batch_apply(self, requests):
        require(isinstance(requests, list) and 1 <= len(requests) <= 3, "invalid_pilot_batch_size")
        journal_count = 0
        for request in requests:
            require(set(request) == {"updateCells"}, "only_exact_cell_updates_allowed")
            update = request["updateCells"]
            require(set(update) == {"start", "rows", "fields"} and len(update["rows"]) == 1, "unsafe_update_fields")
            start, values = update["start"], update["rows"][0].get("values", [])
            source_cell = start.get("sheetId") == self.target["sheet_id"] and start.get("columnIndex") == 9
            require(update["fields"] == (SOURCE_WRITE_FIELDS if source_cell else "userEnteredValue"),
                    "unsafe_update_fields")
            require(type(start.get("rowIndex")) is int and 0 <= start["rowIndex"] < MAX_GRID_ROWS,
                    "update_row_outside_bounds")
            if start.get("sheetId") == self.target["sheet_id"]:
                require(start["rowIndex"] >= self.config["header_row"]
                        and start.get("columnIndex") in {1, 4, 9} and len(values) == 1, "update_outside_player_cells")
            else:
                require(start.get("sheetId") == self.target["journal"]["sheet_id"]
                        and start["rowIndex"] >= 1 and start.get("columnIndex") == 0
                        and len(values) == len(JOURNAL_HEADERS), "update_outside_journal_cells")
                journal_count += 1
            for cell in values:
                expected_keys = {"userEnteredValue", "userEnteredFormat"} if source_cell else {"userEnteredValue"}
                require(set(cell) == expected_keys and len(cell["userEnteredValue"]) == 1
                        and set(cell["userEnteredValue"]) <= {"stringValue", "numberValue"}, "unsafe_cell_request")
                value = next(iter(cell["userEnteredValue"].values()))
                require(not isinstance(value, str) or not value.startswith("="), "formula_in_write_request")
                if source_cell:
                    require(isinstance(value, str)
                            and re.fullmatch(r"https://kovo\.co\.kr/news/official-notices/\d+", value) is not None
                            and cell["userEnteredFormat"] == {"textFormat": {"link": {"uri": value}}},
                            "source_link_or_format_outside_allowed_fields")
        require(journal_count == 1, "atomic_player_write_requires_one_journal_row")
        return self._request("POST", ":batchUpdate", {"requests": requests, "includeSpreadsheetInResponse": False})

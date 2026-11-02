#!/usr/bin/env python3
"""One explicitly requested current-value observation; never a player change event.

The caller supplies fresh, independently fetched official evidence. This module
does not accept a saved evidence file as authorization. Raw MASTER snapshots and
private plans stay in memory; only the allowlisted receipt may be published.
There is no source fetch, tab creation, scheduler, roster export, or CLI here.
"""
from __future__ import annotations

import copy
from datetime import date, datetime, timezone
import os
import re
from urllib.parse import parse_qs
from urllib.request import build_opener
from zoneinfo import ZoneInfo

from kvl_player_master_apply import (
    PlayerMasterError, PlayerSheetsClient, _NoRedirect, _destination_row,
    _require_cell_metadata, _require_writable_destination, _sheet_metadata,
    _stable_snapshot, timestamp,
)
from kvl_player_master_plan import aware_datetime
from kvl_player_updates import digest, known_player_ids, public_security_scan

RECORD_TYPE = "official_current_state"
SCOPE = {"player_id": "KVL-P-001585", "season": "2026-27", "gender": "남",
         "team": "우리카드", "field": "number", "value": "5"}
SPREADSHEET_ID = "1WD2odv51xNDx9BqRfAjkkLVu0p_DX2EX_GEbqR-G4og"
SPREADSHEET_TITLE = "2026-27_V리그_남자부_선수명단_MASTER_검수중"
CURRENT_TITLE, CURRENT_ID = "현재등록_공시기반", 710020121
JOURNAL_TITLE, JOURNAL_ID = "KVL_현재값확인", 710020129
MAX_CURRENT_ROWS, JOURNAL_ROWS = 300, 200
MAX_AGE_SECONDS = 300
NOTICE_ID = 157018
NOTICE_URL = "https://kovo.co.kr/news/official-notices/157018"
NOTICE_SHA256 = "bf8be0d5a538ef75fdada84e7befb39ce7bd8b12551ed97734d1555a97d47579"
ROSTER_URL = "https://user-api.kovo.co.kr/teams/1009/players"
PROFILE_URL = "https://user-api.kovo.co.kr/players/0001550"
OFFICIAL_PLAYER_ID = "0001550"
SERVICE_ACCOUNT = "kvl-v-league-updater@kvl-automation.iam.gserviceaccount.com"
REPOSITORY = "kvolleylab/kvolleylab"
WORKFLOW_REF = REPOSITORY + "/.github/workflows/vleague-auto-update-v1.yml@refs/heads/main"
CURRENT_HEADERS = ["구단", "등번호", "선수명", "풀네임", "포지션", "생년월일", "키(cm)",
                   "국적", "등록 상태", "원문 공시", "Player_ID", "비고", "현재등록 판단"]
HEADERS = [
    "verification_id", "record_type", "player_id", "season", "gender", "team", "field", "value",
    "effective_date", "effective_date_status", "notice_id", "notice_url", "notice_html_sha256",
    "notice_published_at", "roster_url", "official_player_id", "roster_normalized_sha256",
    "roster_fetched_at", "roster_as_of", "observed_at", "master_value", "master_read_at",
    "reviewer", "reviewed_at", "run_id", "evidence_sha256",
]
RAW_HASH_KEYS = {"roster_response_sha256", "profile_response_sha256", "season_context_response_sha256"}
METADATA_FIELDS = "spreadsheetId,properties(title),sheets(properties,protectedRanges)"
GRID_FIELDS = "spreadsheetId,sheets(properties(sheetId,title),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue,formattedValue,note,dataValidation,userEnteredFormat(textFormat(link))))))"


class CurrentValueError(PlayerMasterError):
    """Only fixed error codes may cross the runtime/artifact boundary."""


def require(condition, code):
    if not condition:
        raise CurrentValueError(code)


def _now(value=None):
    value = value or datetime.now(timezone.utc)
    require(isinstance(value, datetime) and value.tzinfo is not None, "aware_runtime_clock_required")
    return value.astimezone(timezone.utc)


def _sha(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def _time(value, now, label, *, fresh=False):
    parsed = aware_datetime(value)
    require(parsed is not None and parsed <= now, label + "_invalid_or_future")
    if fresh:
        require(0 <= (now - parsed).total_seconds() <= MAX_AGE_SECONDS, label + "_stale")
    return parsed


def _publication(value, now):
    # The KOVO body has an explicit publication DATE. Its API createdAt has
    # no timezone; never silently add one to that timestamp.
    if isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        try:
            published = date.fromisoformat(value)
        except ValueError:
            raise CurrentValueError("notice_publication_invalid") from None
        require(published <= now.astimezone(ZoneInfo("Asia/Seoul")).date(), "notice_publication_future")
    else:
        published = _time(value, now, "notice_publication").astimezone(ZoneInfo("Asia/Seoul")).date()
    require(published.isoformat() == "2026-09-16", "notice_publication_revision_changed")
    return value


def _number(value):
    require(not isinstance(value, bool), "invalid_current_number")
    if isinstance(value, float):
        require(value.is_integer(), "invalid_current_number")
        value = int(value)
    value = str(value).strip()
    require(re.fullmatch(r"\d{1,3}", value) is not None, "invalid_current_number")
    return str(int(value))


def _birth_date(value):
    """Compare the two reviewed MASTER date formats without changing raw cells."""
    require(isinstance(value, str) and re.fullmatch(r"\d{4}([.-])\d{2}\1\d{2}", value) is not None,
            "master_birth_date_invalid")
    try:
        return date.fromisoformat(value.replace(".", "-"))
    except ValueError:
        raise CurrentValueError("master_birth_date_invalid") from None


def _run_id(value):
    require(isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}", value) is not None,
            "invalid_explicit_run_id")
    return value


def verification_id(run_id):
    """One record per explicit execution, independent of retry/fetch times."""
    return "KVL-CVV-" + digest({"record_type": RECORD_TYPE, "scope": SCOPE, "run_id": _run_id(run_id)})[:24]


def validate_source_evidence(evidence, *, expected_current_sha256, now=None):
    """Validate trusted fresh-fetch results; do not promote publication to effect."""
    now = _now(now)
    require(isinstance(evidence, dict) and set(evidence) == {"schema_version", "scope", "notice", "current", "observed_at"},
            "invalid_source_evidence_schema")
    require(evidence["schema_version"] == 1 and evidence["scope"] == SCOPE, "source_scope_mismatch")
    require(_sha(expected_current_sha256), "approved_current_source_hash_required")
    observed = _time(evidence["observed_at"], now, "observation", fresh=True)
    notice, current = evidence["notice"], evidence["current"]
    notice_keys = {"id", "url", "html_sha256", "published_at", "fetched_at", "player_name",
                   "previous_value", "value", "effective_date"}
    current_keys = {"roster_url", "profile_url", "official_player_id", "normalized_sha256", "fetched_at",
                    "profile_fetched_at", "source_as_of", "player_name", "birth_date", "team_id", "number",
                    "position", "status", "visible", "roster_match_count", "profile_matches_roster",
                    "season_context_verified", "season_context_sha256", "season_basis"}
    require(isinstance(notice, dict) and set(notice) == notice_keys, "invalid_notice_evidence_schema")
    require(isinstance(current, dict) and current_keys <= set(current) <= current_keys | RAW_HASH_KEYS,
            "invalid_current_evidence_schema")
    require(type(notice["id"]) is int and notice["id"] == NOTICE_ID and notice["url"] == NOTICE_URL
            and notice["html_sha256"] == NOTICE_SHA256, "notice_source_revision_changed")
    require(notice["player_name"] == "오재성" and _number(notice["previous_value"]) == "3"
            and _number(notice["value"]) == "5" and notice["effective_date"] is None,
            "notice_identity_value_or_date_mismatch")
    _publication(notice["published_at"], observed)
    require(current["roster_url"] == ROSTER_URL and current["profile_url"] == PROFILE_URL
            and current["official_player_id"] == OFFICIAL_PLAYER_ID, "current_official_source_mismatch")
    require(current["normalized_sha256"] == expected_current_sha256, "current_source_semantic_revision_changed")
    require(current["player_name"] == "오재성" and current["birth_date"] == "1992-04-02"
            and current["team_id"] == "1009" and _number(current["number"]) == "5"
            and current["position"] == "L" and current["status"] == "REGISTER"
            and current["visible"] is True and type(current["roster_match_count"]) is int
            and current["roster_match_count"] == 1 and current["profile_matches_roster"] is True,
            "current_player_identity_not_confirmed")
    require(current["season_context_verified"] is True and _sha(current["season_context_sha256"])
            and current["season_basis"] == "official_current_context_only" and current["source_as_of"] is None,
            "current_season_context_not_confirmed")
    fetched = [notice["fetched_at"], current["fetched_at"], current["profile_fetched_at"]]
    for value in fetched:
        require(_time(value, now, "official_fetch", fresh=True) <= observed,
                "observation_precedes_official_fetch")
    require(all(_sha(current[key]) for key in RAW_HASH_KEYS & set(current)), "invalid_optional_source_hash")
    stable = {"schema_version": 1, "scope": SCOPE,
              "notice": {key: value for key, value in notice.items() if key != "fetched_at"},
              "current": {key: value for key, value in current.items()
                          if key not in {"fetched_at", "profile_fetched_at"} | RAW_HASH_KEYS}}
    return {"evidence_sha256": digest(stable), "observed_at": timestamp(observed), "fetched_at": fetched,
            "public_sources": {"notice_id": NOTICE_ID, "notice_url": NOTICE_URL, "notice_html_sha256": NOTICE_SHA256,
                               "notice_published_at": notice["published_at"],
                               "notice_publication_precision": "date" if len(notice["published_at"]) == 10 else "timestamp",
                               "notice_fetched_at": timestamp(aware_datetime(notice["fetched_at"])),
                               "roster_url": ROSTER_URL,
                               "profile_url": PROFILE_URL, "official_player_id": OFFICIAL_PLAYER_ID,
                               "roster_normalized_sha256": expected_current_sha256, "source_as_of": None,
                               "roster_fetched_at": timestamp(aware_datetime(current["fetched_at"])),
                               "profile_fetched_at": timestamp(aware_datetime(current["profile_fetched_at"])),
                               "season_basis": current["season_basis"],
                               "season_context_sha256": current["season_context_sha256"],
                               **{key: current[key] for key in RAW_HASH_KEYS & set(current)}}}


def _master_row(snapshot, now):
    require(isinstance(snapshot, dict), "master_snapshot_missing")
    expected = {"spreadsheet_id": SPREADSHEET_ID, "spreadsheet_title": SPREADSHEET_TITLE,
                "sheet_id": CURRENT_ID, "sheet_title": CURRENT_TITLE, "snapshot_kind": "current_roster",
                "header_row": 3, "headers": CURRENT_HEADERS}
    require(all(snapshot.get(key) == value for key, value in expected.items()), "fixed_master_target_changed")
    require(type(snapshot.get("grid_row_count")) is int and 4 <= snapshot["grid_row_count"] <= MAX_CURRENT_ROWS
            and snapshot.get("grid_column_count", 0) >= 13, "master_grid_outside_bounded_scope")
    require(all(snapshot.get(key) is True for key in
                ("all_rows_read", "formula_metadata_complete", "lock_metadata_complete")), "master_read_coverage_unknown")
    _time(snapshot.get("fetched_at"), now, "master_read", fresh=True)
    _require_cell_metadata(snapshot, 13, "current_master")
    numbers, matches = set(), []
    for row in snapshot.get("rows", []):
        number = row.get("row_number")
        require(type(number) is int and 4 <= number <= snapshot["grid_row_count"] and number not in numbers,
                "invalid_or_duplicate_master_row")
        numbers.add(number)
        require(len(row.get("values", [])) == 13 and len(row.get("formulas", [])) == 13
                and type(row.get("manual_locked")) is bool, "master_row_metadata_incomplete")
        if row["values"][10] == SCOPE["player_id"]:
            matches.append(row)
    require(len(matches) == 1, "player_id_not_globally_unique")
    require(SCOPE["player_id"] in known_player_ids(), "player_id_missing_from_existing_registry")
    row = matches[0]
    require(row["values"][0] == "우리카드" and row["values"][2] == "오재성"
            and _birth_date(row["values"][5]) == date(1992, 4, 2), "master_identity_mismatch")
    require(row["values"][4] == "L", "master_position_mismatch")
    require(_number(row["values"][1]) == "5", "current_value_mismatch_no_write_allowed")
    require(row["values"][9] == NOTICE_URL and row["explicit_link_uris"][9] in {"", NOTICE_URL},
            "master_notice_source_mismatch")
    require(row["manual_locked"] is False and not any(row["formulas"][i] for i in (0, 1, 2, 4, 5, 9, 10)),
            "master_identity_or_value_locked_or_formula")
    return row


def _record(values, now, expected_current_sha256):
    require(isinstance(values, list) and len(values) == len(HEADERS)
            and all(isinstance(value, str) and not value.startswith("=") for value in values),
            "invalid_literal_verification_record")
    entry = dict(zip(HEADERS, values))
    require(entry["record_type"] == RECORD_TYPE and all(entry[key] == value for key, value in SCOPE.items()),
            "verification_record_outside_scope")
    require(entry["verification_id"] == verification_id(entry["run_id"]), "verification_id_run_mismatch")
    require(entry["effective_date"] == "" and entry["effective_date_status"] == "unknown"
            and entry["roster_as_of"] == "", "observation_must_not_assert_effective_date")
    require(entry["notice_id"] == str(NOTICE_ID) and entry["notice_url"] == NOTICE_URL
            and entry["notice_html_sha256"] == NOTICE_SHA256 and entry["roster_url"] == ROSTER_URL
            and entry["official_player_id"] == OFFICIAL_PLAYER_ID
            and entry["roster_normalized_sha256"] == expected_current_sha256
            and entry["master_value"] == "5" and _sha(entry["evidence_sha256"]), "verification_evidence_conflict")
    require(re.fullmatch(r"KVL-OP-[A-Z0-9_-]{2,40}", entry["reviewer"]) is not None, "public_reviewer_id_required")
    observed = _time(entry["observed_at"], now, "stored_observation")
    _publication(entry["notice_published_at"], observed)
    require(_time(entry["roster_fetched_at"], now, "stored_roster_fetch") <= observed,
            "stored_observation_precedes_fetch")
    _time(entry["master_read_at"], now, "stored_master_read")
    _time(entry["reviewed_at"], now, "stored_review")
    return entry


def _canonical_journal_rows(rows):
    """Ignore only Google's same-target URL auto-links; keep input snapshots raw."""
    result = copy.deepcopy(rows)
    allowed = {11: NOTICE_URL, 14: ROSTER_URL}
    for row in result:
        values, links = row.get("values", []), row.get("explicit_link_uris", [])
        require(len(values) == len(HEADERS) and len(links) == len(HEADERS),
                "verification_journal_link_metadata_incomplete")
        for index, link in enumerate(links):
            if index in allowed:
                require(values[index] == allowed[index] and link in {"", allowed[index]},
                        "verification_journal_url_link_mismatch")
                links[index] = ""
            else:
                require(link == "", "verification_journal_unexpected_link")
    return result


def _journal_entries(journal, now, expected_current_sha256, evidence_sha256):
    require(isinstance(journal, dict), "verification_journal_missing")
    fixed = {"spreadsheet_id": SPREADSHEET_ID, "sheet_id": JOURNAL_ID, "sheet_title": JOURNAL_TITLE,
             "header_row": 1, "headers": HEADERS, "grid_row_count": JOURNAL_ROWS, "grid_column_count": len(HEADERS)}
    require(all(journal.get(key) == value for key, value in fixed.items()), "verification_journal_schema_changed")
    require(all(journal.get(key) is True for key in
                ("all_rows_read", "formula_metadata_complete", "lock_metadata_complete")),
            "verification_journal_coverage_unknown")
    _time(journal.get("fetched_at"), now, "verification_journal_read", fresh=True)
    _require_cell_metadata(journal, len(HEADERS), "verification_journal")
    entries, rows, identifiers = [], set(), set()
    for row in journal.get("rows", []):
        number = row.get("row_number")
        require(type(number) is int and 2 <= number <= JOURNAL_ROWS and number not in rows,
                "invalid_or_duplicate_verification_row")
        rows.add(number)
        require(len(row.get("formulas", [])) == len(HEADERS) and not any(row["formulas"])
                and row.get("manual_locked") is False and not any(row["notes"])
                and not any(row["data_validations"]),
                "verification_journal_formula_lock_or_unreviewed_metadata")
        _canonical_journal_rows([row])
        entry = _record(row.get("values"), now, expected_current_sha256)
        require(entry["verification_id"] not in identifiers, "duplicate_verification_id")
        identifiers.add(entry["verification_id"])
        require(entry["evidence_sha256"] == evidence_sha256, "verification_semantic_revision_requires_review")
        entries.append((number, entry))
    return entries


def prepare_verification(source_evidence, master_snapshot, verification_journal, *, expected_current_sha256,
                         reviewer, reviewed_at, run_id, now=None):
    """Return an in-memory, checksummed append-only plan. No I/O or mutation."""
    now = _now(now)
    run_id = _run_id(run_id)
    require(isinstance(reviewer, str) and re.fullmatch(r"KVL-OP-[A-Z0-9_-]{2,40}", reviewer) is not None,
            "public_reviewer_id_required")
    reviewed = _time(reviewed_at, now, "review")
    proof = validate_source_evidence(source_evidence, expected_current_sha256=expected_current_sha256, now=now)
    master_row = _master_row(master_snapshot, now)
    entries = _journal_entries(verification_journal, now, expected_current_sha256, proof["evidence_sha256"])
    ident = verification_id(run_id)
    existing = [(number, row) for number, row in entries if row["verification_id"] == ident]
    require(len(existing) <= 1, "duplicate_verification_id")
    row_number = existing[0][0] if existing else max([1] + [number for number, _ in entries]) + 1
    require(row_number <= JOURNAL_ROWS, "verification_journal_capacity_exhausted")
    if existing:
        row_values = [existing[0][1][header] for header in HEADERS]
    else:
        values = {"verification_id": ident, "record_type": RECORD_TYPE, **SCOPE,
                  "effective_date": "", "effective_date_status": "unknown", "notice_id": str(NOTICE_ID),
                  "notice_url": NOTICE_URL, "notice_html_sha256": NOTICE_SHA256,
                  "notice_published_at": source_evidence["notice"]["published_at"], "roster_url": ROSTER_URL,
                  "official_player_id": OFFICIAL_PLAYER_ID, "roster_normalized_sha256": expected_current_sha256,
                  "roster_fetched_at": timestamp(aware_datetime(source_evidence["current"]["fetched_at"])),
                  "roster_as_of": "", "observed_at": proof["observed_at"], "master_value": "5",
                  "master_read_at": timestamp(aware_datetime(master_snapshot["fetched_at"])), "reviewer": reviewer,
                  "reviewed_at": timestamp(reviewed), "run_id": run_id, "evidence_sha256": proof["evidence_sha256"]}
        row_values = [values[header] for header in HEADERS]
        _record(row_values, now, expected_current_sha256)
    expected_rows = copy.deepcopy(verification_journal.get("rows", []))
    if not existing:
        destination = _destination_row(verification_journal, row_number, len(HEADERS))
        _require_writable_destination(verification_journal, destination, range(len(HEADERS)), "verification_journal")
        require(not any(destination["formulas"]) and not any(destination["values"]), "verification_destination_not_empty")
        destination["values"] = row_values[:]
        expected_rows.append(destination)
        expected_rows.sort(key=lambda row: row["row_number"])
    plan = {"schema_version": 1, "record_type": RECORD_TYPE, "scope": copy.deepcopy(SCOPE),
            "verification_id": ident, "run_id": run_id, "row_number": row_number, "row_values": row_values,
            "append_required": not bool(existing), "source_fetched_at": proof["fetched_at"],
            "source_observed_at": proof["observed_at"], "source_public": proof["public_sources"],
            "evidence_sha256": proof["evidence_sha256"], "expected_current_sha256": expected_current_sha256,
            "prepared_at": timestamp(now), "expected_master_sha256": digest(_stable_snapshot(master_snapshot)),
            "expected_master_row_sha256": digest(master_row),
            "expected_journal_sha256": digest(_stable_snapshot(verification_journal)),
            "expected_journal_metadata_sha256": digest(_sheet_metadata(verification_journal)),
            "expected_journal_rows_sha256": digest(_canonical_journal_rows(expected_rows))}
    plan["plan_hash"] = digest(plan)
    return plan


def apply_verification(client, plan, *, now=None):
    """Re-read, append at most once, then verify; never retry an uncertain write."""
    clock = (lambda: _now(now)) if now is not None else _now
    require(isinstance(plan, dict) and plan.get("plan_hash") == digest({key: value for key, value in plan.items()
                                                                      if key != "plan_hash"}), "verification_plan_changed")
    require(plan.get("scope") == SCOPE and plan.get("record_type") == RECORD_TYPE
            and getattr(client, "spreadsheet_id", None) == SPREADSHEET_ID, "verification_plan_target_mismatch")
    for value in plan["source_fetched_at"] + [plan["source_observed_at"]]:
        _time(value, clock(), "official_evidence", fresh=True)
    before, before_journal = client.read_snapshot(), client.read_verification_journal()
    checked = clock()
    _master_row(before, checked)
    _journal_entries(before_journal, checked, plan["expected_current_sha256"], plan["evidence_sha256"])
    require(digest(_stable_snapshot(before)) == plan["expected_master_sha256"], "master_changed_before_record")
    require(digest(_stable_snapshot(before_journal)) == plan["expected_journal_sha256"], "verification_journal_changed_before_record")
    for value in plan["source_fetched_at"] + [plan["source_observed_at"]]:
        _time(value, clock(), "official_evidence", fresh=True)
    uncertain = False
    if plan["append_required"]:
        try:
            client.append_verification(plan["row_values"])
        except Exception:
            # The service may have accepted the row before the response was
            # lost. Read once and verify; never append blindly a second time.
            uncertain = True
    after, after_journal = client.read_snapshot(), client.read_verification_journal()
    verified = clock()
    after_row = _master_row(after, verified)
    entries = _journal_entries(after_journal, verified, plan["expected_current_sha256"], plan["evidence_sha256"])
    require(digest(_stable_snapshot(after)) == plan["expected_master_sha256"]
            and digest(after_row) == plan["expected_master_row_sha256"], "master_changed_during_record")
    require(digest(_sheet_metadata(after_journal)) == plan["expected_journal_metadata_sha256"]
            and digest(_canonical_journal_rows(after_journal.get("rows", []))) == plan["expected_journal_rows_sha256"],
            "verification_journal_readback_changed_or_missing")
    matched = [(number, entry) for number, entry in entries if entry["verification_id"] == plan["verification_id"]]
    require(len(matched) == 1 and matched[0][0] == plan["row_number"]
            and [matched[0][1][header] for header in HEADERS] == plan["row_values"], "verification_record_readback_mismatch")
    entry = matched[0][1]
    stored_record = {key: entry[key] for key in ("verification_id", "run_id", "observed_at", "roster_fetched_at",
                                                "master_read_at", "reviewer", "reviewed_at", "notice_published_at")}
    stored_record.update(effective_date=None, effective_date_status="unknown", roster_as_of=None)
    recheck_sources = copy.deepcopy(plan["source_public"])
    recheck_sources.update(role="current_execution_recheck", observed_at=plan["source_observed_at"],
                           master_read_at=after["fetched_at"], completed_at=timestamp(verified))
    receipt = {"schema_version": 1, "record_type": RECORD_TYPE, "status": "CURRENT_VALUE_RECORD_READBACK_VERIFIED",
               "action": "recorded" if plan["append_required"] else "already_verified",
               "verification_id": plan["verification_id"], "run_id": plan["run_id"], "scope": copy.deepcopy(SCOPE),
               "effective_date": None, "effective_date_status": "unknown", "observed_at": entry["observed_at"],
               # observed_at remains an alias for the stored record for callers;
               # all sources timestamps explicitly describe this execution's recheck.
               "stored_record": stored_record, "rechecked_at": timestamp(verified), "sources": recheck_sources,
               "evidence_sha256": plan["evidence_sha256"],
               "record_rows_added": int(plan["append_required"]), "player_cells_changed": 0,
               "event_journal_rows_added": 0, "roster_files_changed": 0,
               "write_attempted": bool(plan["append_required"]), "uncertain_write_response": uncertain,
               "master_readback_verified": True, "master_read_range_unchanged": True,
               "verification_record_readback_verified": True, "publication_performed": False}
    public_security_scan(receipt)
    return receipt


class CurrentValueSheetsClient(PlayerSheetsClient):
    """Fixed men workbook reader; its only write is one new observation row.

Transport/grid parsing are shared with the existing client. Its constructor,
event scope, event writer, and export path are deliberately not reused.
"""

    def __init__(self, config, target, authorize_headers, *, mode="read", opener=None, clock=None,
                 expected_current_sha256):
        require(mode in {"read", "record"}, "invalid_current_value_mode")
        require(_sha(expected_current_sha256), "approved_current_source_hash_required")
        require(target in config.get("targets", []), "unapproved_current_value_target")
        fixed = {"spreadsheet_id": SPREADSHEET_ID, "spreadsheet_title": SPREADSHEET_TITLE,
                 "sheet_id": CURRENT_ID, "sheet_title": CURRENT_TITLE, "gender": "남", "snapshot_kind": "current_roster"}
        require(all(target.get(key) == value for key, value in fixed.items())
                and config.get("headers") == CURRENT_HEADERS and config.get("header_row") == 3,
                "fixed_current_value_target_mismatch")
        self.config, self.target = copy.deepcopy(config), copy.deepcopy(target)
        self.spreadsheet_id, self.mode = SPREADSHEET_ID, mode
        self.expected_current_sha256 = expected_current_sha256
        self._base = "https://sheets.googleapis.com/v4/spreadsheets/" + SPREADSHEET_ID
        self._authorize, self._opener = authorize_headers, opener or build_opener(_NoRedirect())
        self._clock = clock or (lambda: datetime.now(timezone.utc))

    @classmethod
    def from_environment(cls, config, target, *, mode="read", expected_current_sha256, environment=None):
        environment = os.environ if environment is None else environment
        fixed = {"GITHUB_REPOSITORY": REPOSITORY, "GITHUB_REF": "refs/heads/main",
                 "GITHUB_WORKFLOW_REF": WORKFLOW_REF, "GITHUB_EVENT_NAME": "workflow_dispatch",
                 "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": SERVICE_ACCOUNT}
        require(all(environment.get(key) == value for key, value in fixed.items()), "trusted_manual_current_value_context_required")
        token = environment.get("KVL_GOOGLE_ACCESS_TOKEN", "")
        require(isinstance(token, str) and token and not any(char.isspace() for char in token), "current_value_token_invalid")
        return cls(config, target, lambda method, url, headers: headers.update({"Authorization": "Bearer " + token}),
                   mode=mode, expected_current_sha256=expected_current_sha256)

    def _request(self, method, suffix, body=None):
        if method == "GET":
            require(body is None and suffix.startswith("?"), "current_value_get_outside_metadata_grid")
            query = parse_qs(suffix[1:], keep_blank_values=True)
            require(all(len(values) == 1 for values in query.values()), "ambiguous_current_value_query")
            if "ranges" in query:
                span = query["ranges"][0]
                current_span = re.fullmatch(re.escape("'" + CURRENT_TITLE + "'!A1:M") + r"(\d{1,3})", span)
                require(set(query) == {"ranges", "includeGridData", "fields"}
                        and query["includeGridData"] == ["true"]
                        and query["fields"] == [GRID_FIELDS]
                        and ((current_span is not None and 4 <= int(current_span[1]) <= MAX_CURRENT_ROWS)
                             or span == f"'{JOURNAL_TITLE}'!A1:Z{JOURNAL_ROWS}"),
                        "current_value_grid_outside_fixed_ranges")
            else:
                require(set(query) == {"fields"} and query["fields"] == [METADATA_FIELDS],
                        "current_value_metadata_query_invalid")
        else:
            require(self.mode == "record" and method == "POST" and suffix == ":batchUpdate",
                    "current_value_write_not_enabled")
            require(isinstance(body, dict) and set(body) == {"requests", "includeSpreadsheetInResponse"}
                    and body["includeSpreadsheetInResponse"] is False and isinstance(body["requests"], list)
                    and len(body["requests"]) == 1, "only_one_verification_append_allowed")
            request = body["requests"][0]
            require(isinstance(request, dict) and set(request) == {"appendCells"}, "only_verification_append_cells_allowed")
            append = request["appendCells"]
            require(isinstance(append, dict) and set(append) == {"sheetId", "rows", "fields"}
                    and append["sheetId"] == JOURNAL_ID and append["fields"] == "userEnteredValue"
                    and isinstance(append["rows"], list) and len(append["rows"]) == 1
                    and isinstance(append["rows"][0], dict)
                    and set(append["rows"][0]) == {"values"}, "verification_append_target_or_fields_invalid")
            cells = append["rows"][0]["values"]
            require(isinstance(cells, list) and len(cells) == len(HEADERS), "verification_append_width_invalid")
            require(all(isinstance(cell, dict) and set(cell) == {"userEnteredValue"}
                        and isinstance(cell["userEnteredValue"], dict)
                        and set(cell["userEnteredValue"]) == {"stringValue"} for cell in cells),
                    "verification_append_nonliteral_cell")
            _record([cell["userEnteredValue"]["stringValue"] for cell in cells], _now(self._clock()),
                    self.expected_current_sha256)
        return super()._request(method, suffix, body)

    def _metadata(self):
        # Every shared-reader metadata lookup checks bounds BEFORE a grid GET;
        # a sheet growth between separate reads cannot widen the request.
        metadata = super()._metadata()
        for title, sheet_id in ((CURRENT_TITLE, CURRENT_ID), (JOURNAL_TITLE, JOURNAL_ID)):
            matches = [sheet["properties"] for sheet in metadata.get("sheets", [])
                       if sheet.get("properties", {}).get("title") == title]
            require(len(matches) == 1 and matches[0].get("sheetId") == sheet_id,
                    "current_value_fixed_tab_changed")
            grid = matches[0].get("gridProperties", {})
            if sheet_id == CURRENT_ID:
                require(4 <= grid.get("rowCount", 0) <= MAX_CURRENT_ROWS and grid.get("columnCount", 0) >= 13,
                        "master_grid_outside_bounded_scope")
            else:
                require(grid.get("rowCount") == JOURNAL_ROWS and grid.get("columnCount") == len(HEADERS),
                        "verification_journal_schema_changed")
        return metadata

    def _read_tab(self, title, sheet_id, columns, header_row):
        require((title, sheet_id, columns, header_row) in {
            (CURRENT_TITLE, CURRENT_ID, 13, 3), (JOURNAL_TITLE, JOURNAL_ID, len(HEADERS), 1)},
            "current_value_read_outside_fixed_tabs")
        return super()._read_tab(title, sheet_id, columns, header_row)

    def read_verification_journal(self):
        result = self._read_tab(JOURNAL_TITLE, JOURNAL_ID, len(HEADERS), 1)
        result.update(spreadsheet_id=SPREADSHEET_ID, sheet_id=JOURNAL_ID, sheet_title=JOURNAL_TITLE, header_row=1)
        return result

    def append_verification(self, row_values):
        require(self.mode == "record", "current_value_write_not_enabled")
        _record(row_values, _now(self._clock()), self.expected_current_sha256)
        cells = [{"userEnteredValue": {"stringValue": value}} for value in row_values]
        return self._request("POST", ":batchUpdate", {"requests": [{"appendCells": {
            "sheetId": JOURNAL_ID, "rows": [{"values": cells}], "fields": "userEnteredValue"}}],
            "includeSpreadsheetInResponse": False})

    def batch_apply(self, requests):
        raise CurrentValueError("event_writer_not_available_in_current_value_client")

    def read_journal(self, scope):
        raise CurrentValueError("event_journal_not_part_of_current_value_verification")

#!/usr/bin/env python3
"""Narrow, verified updates to the existing 2026-27 V-League Sheets MASTER.

This module never creates a workbook, inserts rows, changes formatting, or reads
ChatGPT connector credentials. Read ``FORMULA`` values, plan exact cells, reread
immediately before a RAW batch update, and verify after writing. Google Sheets
does not provide cell compare-and-swap: these checks are optimistic conflict
detection, not a transaction lock against simultaneous human editing.

API references:
https://developers.google.com/workspace/sheets/api/guides/values
https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate
https://google-auth.readthedocs.io/en/latest/reference/google.auth.html

Plans contain public match values and hashes of protected cells, never the full
MASTER or private notes. Callers must keep source/master planning artifacts
private and must not publish site data until ``apply_update_plan`` succeeds.

Official postseason fixtures may initialize only the 18 previously blank,
reserved rows 254:271 (nine per division). Existing match identities, notes,
city cells and validation/formatting remain protected.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import date
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


MASTER_SPREADSHEET_ID = "180no_j27R_uw2adWH2BiWbbZ6QUWKVblqymIqNvkBU8"
MASTER_SHEET_NAME = "경기일정_MASTER"
MASTER_SHEET_ID = 330275994
MASTER_RANGE = "'경기일정_MASTER'!A1:S600"
HEADERS = ["MatchID", "SeasonID", "성별", "라운드", "단계", "날짜", "요일",
           "시간(KST)", "홈팀", "원정팀", "경기장", "도시", "상태", "홈세트",
           "원정세트", "세트스코어", "SourceURL", "검증상태", "비고"]
WRITABLE_COLUMNS = frozenset((6, 7, 8, 11, 13, 14, 15, 16, 17, 18))  # one-based
INITIAL_IDENTITY_COLUMNS = frozenset((1, 2, 3, 4, 5, 9, 10))
POSTSEASON_PHASES = {"QPO": ("204", "준플레이오프", 1),
                     "PO": ("202", "플레이오프", 3),
                     "CH": ("203", "챔피언결정전", 5)}
POSTSEASON_ROWS = {
    f"VL2627-{gender}-{phase}-{game:03d}": 254 + offset + index
    for gender, offset in (("M", 0), ("W", 9))
    for index, (phase, game) in enumerate(
        [(phase, game) for phase, (_, _, maximum) in POSTSEASON_PHASES.items()
         for game in range(1, maximum + 1)])
}
STATUS_LABELS = {"scheduled": "예정", "live": "진행중", "final": "종료",
                 "postponed": "연기", "cancelled": "취소", "not_required": "미실시"}
MATCH_ID = re.compile(r"VL2627-([MW])-(\d{3})\Z")
POSTSEASON_ID = re.compile(r"VL2627-([MW])-(QPO|PO|CH)-(\d{3})\Z")
LOCK_MARKER = re.compile(r"\[\s*(?:LOCK|MANUAL|수동|잠금)\s*\]|자동\s*갱신\s*금지|수동\s*확정", re.I)
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class MasterError(ValueError):
    """A source, identity, authentication, or optimistic write check failed."""


def _require(condition, message):
    if not condition:
        raise MasterError(message)


def _cell(value):
    return "" if value is None else value


def _row(values):
    _require(isinstance(values, list) and len(values) <= 19, "Unexpected MASTER row width")
    padded = [_cell(v) for v in values] + [""] * (19 - len(values))
    _require(all(type(v) in (str, int, float, bool) for v in padded), "Unexpected MASTER cell type")
    return padded


def _hash(value):
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def _protected_hash(row, changed_columns):
    return _hash([None if i + 1 in changed_columns else v for i, v in enumerate(row)])


def _identity(mid):
    regular = MATCH_ID.fullmatch(mid) if isinstance(mid, str) else None
    if regular:
        _require(1 <= int(regular.group(2)) <= 126, "MASTER MatchID is outside the verified regular season")
        return regular.group(1), None, None
    post = POSTSEASON_ID.fullmatch(mid) if isinstance(mid, str) else None
    _require(post is not None and mid in POSTSEASON_ROWS, "Unexpected MASTER MatchID")
    return post.group(1), post.group(2), int(post.group(3))


def _row_at(values, number):
    return _row(values[number - 1]) if number <= len(values) else [""] * 19


def _index(values):
    _require(isinstance(values, list) and 2 <= len(values) <= 600, "MASTER values must include bounded header and rows")
    _require(_row(values[0]) == HEADERS, "MASTER header does not match the verified A:S schema")
    records = {}
    for row_number, value in enumerate(values[1:], 2):
        row = _row(value)
        if not any(v != "" for v in row):
            continue
        mid = row[0]
        _identity(mid)
        _require(mid not in records, f"Duplicate MASTER MatchID: {mid}")
        _require(row[1] == "v-league-2026-27", f"Wrong MASTER season: {mid}")
        records[mid] = (row_number, row)
    _require(records, "Empty MASTER")
    return records


def _official_url(url):
    _require(isinstance(url, str) and len(url) <= 2000, "Missing official source URL")
    parsed = urlsplit(url)
    _require(parsed.scheme == "https" and parsed.hostname in
             {"kovo.co.kr", "www.kovo.co.kr", "user-api.kovo.co.kr", "dbbank.kovo.co.kr"}
             and parsed.port is None and not parsed.username and not parsed.password and not parsed.fragment,
             "Source URL must be a verified public KOVO HTTPS URL")
    _require(not re.search(r"(?:token|key|secret|signature|cookie|authorization)=", parsed.query, re.I),
             "Credential-bearing source URL is forbidden")
    return url


def _text(record, key):
    value = record.get(key)
    _require(isinstance(value, str) and value.strip() and not value.startswith("="), f"Missing or unsafe {key}")
    return value


def _desired_values(record, row):
    mid = record["match_id"]
    division, phase, series_game = _identity(mid)
    male = division == "M"
    gender, slug = ("남자", "v-league-men-2026-27") if male else ("여자", "v-league-women-2026-27")
    _require(record.get("competition_slug") == slug and row[2] == gender, f"Gender or competition conflict: {mid}")
    round_number = str(record.get("round", ""))
    if phase is None:
        _require(round_number in {"1", "2", "3", "4", "5", "6"} and str(row[3]) == round_number
                 and row[4] == "정규리그" and record.get("phase_id", "201") == "201",
                 f"Regular-season round conflict: {mid}")
    else:
        phase_id, label, _ = POSTSEASON_PHASES[phase]
        _require(record.get("phase_id") == phase_id and record.get("stage") == label
                 and type(record.get("series_game")) is int and record["series_game"] == series_game
                 and round_number == str(series_game) and str(row[3]) == round_number and row[4] == label,
                 f"Postseason phase or game conflict: {mid}")
    _require(_text(record, "home_name") == row[8] and _text(record, "away_name") == row[9]
             and row[8] != row[9], f"Home/away identity conflict: {mid}")
    source_key = record.get("source_key", "")
    expected_gender = "MALE" if male else "FEMALE"
    _require(isinstance(source_key, str) and re.fullmatch(rf"023:001:{expected_gender}:(?:[1-9]\d{{0,2}}|1000)", source_key),
             f"Official source identity missing: {mid}")
    _require(record.get("source_verified") is not False and
             record.get("review_status", "VERIFIED") in {"VERIFIED", "OFFICIAL_VERIFIED"},
             f"Source is not verified: {mid}")
    source_url = _official_url(record.get("source_url"))
    if phase is not None:
        query = parse_qs(urlsplit(source_url).query)
        _require(query.get("seasonCode") == ["023"] and query.get("leagueCode") == [phase_id]
                 and query.get("gender") == ["1" if male else "2"] and query.get("gcode") == ["001"],
                 f"Postseason source URL conflicts with the fixture: {mid}")
    status = record.get("status")
    _require(status in STATUS_LABELS, f"Unsupported match status: {mid}")
    _require(status != "not_required" or (phase is not None and record.get("notRequired") is True
             and record.get("non_play_reason") in {"series_clinched", "qualification_gap"}),
             f"Unproven unplayed postseason fixture: {mid}")
    day = _text(record, "date")
    try:
        parsed_day = date.fromisoformat(day)
    except ValueError:
        raise MasterError(f"Invalid date: {mid}") from None
    _require(parsed_day.isoformat() == day and date(2026, 10, 1) <= parsed_day <= date(2027, 5, 1),
             f"Date outside 2026-27 season: {mid}")
    time = _text(record, "time")
    _require(re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", time), f"Invalid KST time: {mid}")
    venue = _text(record, "venue")
    desired = {6: day, 7: "월화수목금토일"[parsed_day.weekday()], 8: time,
               11: venue, 13: STATUS_LABELS[status], 17: source_url, 18: "공식확정"}
    _require(row[12] in set(STATUS_LABELS.values()) | {"진행 중"}, f"Unknown existing MASTER status: {mid}")
    if row[12] in {"연기", "취소", "미실시"} and desired[13] != row[12]:
        raise MasterError(f"Administrative status correction requires review: {mid}")
    if status == "final":
        try:
            from kovo_vleague_standings import validate_final_match
        except ImportError:
            from scripts.kovo_vleague_standings import validate_final_match
        home_code = record.get("home_code", record.get("home", {}).get("code"))
        away_code = record.get("away_code", record.get("away", {}).get("code"))
        _require(isinstance(home_code, str) and isinstance(away_code, str) and home_code != away_code,
                 f"Missing canonical team codes: {mid}")
        final = {"id": mid, "stage": row[4], "status": "final",
                 "home": {"code": home_code}, "away": {"code": away_code}, "score": record.get("score")}
        try:
            validate_final_match(final)
        except ValueError as exc:
            raise MasterError(f"Invalid final score: {mid}") from exc
        score = record["score"]
        desired.update({14: score["home"], 15: score["away"],
                        16: ", ".join(f"{s['home']}-{s['away']}" for s in score["sets"])})
        _require(all(row[c - 1] == "" or _equivalent(row[c - 1], desired[c], c) for c in (14, 15, 16)),
                 f"Existing score correction requires review: {mid}")
    else:
        # Partial/live points are deliberately excluded from this MASTER writer.
        _require(all(row[c - 1] == "" for c in (14, 15, 16)), f"Nonfinal update would overwrite a score: {mid}")
    if row[12] == "종료":
        _require(status == "final", f"Final status regression: {mid}")
        protected = (6, 7, 8, 11, 13, 14, 15, 16)
        _require(all(_equivalent(row[c - 1], desired[c], c) for c in protected),
                 f"Existing final record correction requires review: {mid}")
        # Preserve the user's existing final source/verification annotation.
        desired[17], desired[18] = row[16], row[17]
    return desired


def _equivalent(actual, expected, column):
    if type(actual) is bool or type(expected) is bool:
        return type(actual) is type(expected) and actual == expected
    if column == 16 and isinstance(actual, str) and isinstance(expected, str):
        return re.sub(r"\s+", "", actual) == re.sub(r"\s+", "", expected)
    return actual == expected


def _verify_qualification_gap(target, records, gender, validate_final_match):
    """Reconcile an official final rank-3/4 decision with all regular results."""
    evidence = target.get("qualification_evidence")
    _require(isinstance(evidence, dict) and evidence.get("official_standings_verified") is True
             and type(evidence.get("regular_completed")) is int and evidence["regular_completed"] == 126,
             "Missing verified final standings for the unused semi-playoff")
    source = urlsplit(_official_url(evidence.get("source_url")))
    query = parse_qs(source.query)
    _require(source.hostname == "user-api.kovo.co.kr" and source.path == "/stat/league/team-rank"
             and query.get("seasonCode") == ["023"] and query.get("leagueCode") == ["201"]
             and query.get("gender") == ["1" if gender == "M" else "2"],
             "Qualification decision needs this division's official regular standings")
    regular = [r for r in records if _identity(r.get("match_id"))[:2] == (gender, None)]
    _require(len(regular) == 126 and len({r["match_id"] for r in regular}) == 126
             and all(r.get("status") == "final" for r in regular),
             "Qualification decision requires all 126 verified regular results")
    points, appearances = {}, {}
    for match in regular:
        try:
            score = validate_final_match({"status": "final", "score": match.get("score"),
                "home": {"code": match.get("home_code")}, "away": {"code": match.get("away_code")}})
        except ValueError as exc:
            raise MasterError("Invalid regular result in qualification evidence") from exc
        for side, other in (("home", "away"), ("away", "home")):
            code = match[side + "_code"]
            appearances[code] = appearances.get(code, 0) + 1
            award = (2 if score[other] == 2 else 3) if score[side] == 3 else (1 if score[side] == 2 else 0)
            points[code] = points.get(code, 0) + award
    _require(len(points) == 7 and set(appearances.values()) == {36},
             "Qualification evidence lacks the complete seven-team regular season")
    third, fourth = evidence.get("third"), evidence.get("fourth")
    _require(isinstance(third, dict) and isinstance(fourth, dict)
             and type(third.get("points")) is int and type(fourth.get("points")) is int
             and third.get("code") == target.get("home_code")
             and fourth.get("code") == target.get("away_code")
             and third["code"] != fourth["code"]
             and points.get(third["code"]) == third["points"]
             and points.get(fourth["code"]) == fourth["points"]
             and third["points"] - fourth["points"] > 3,
             "Unused semi-playoff conflicts with final qualification points or teams")


def _verify_unplayed_series(records, index):
    """Derive unused games only from this fresh batch's complete winning series."""
    targets = [r for r in records if r.get("status") == "not_required"]
    if not targets:
        return
    try:
        from kovo_vleague_standings import validate_final_match
    except ImportError:
        from scripts.kovo_vleague_standings import validate_final_match
    for target in targets:
        mid = target.get("match_id")
        gender, phase, game = _identity(mid)
        _require(mid in index and phase is not None, "An unplayed fixture must already exist in MASTER")
        if target.get("non_play_reason") == "qualification_gap":
            _require(phase == "QPO" and target.get("notRequired") is True,
                     "Only a semi-playoff can be unused because of a qualification gap")
            _verify_qualification_gap(target, records, gender, validate_final_match)
            continue
        needed = {"QPO": 1, "PO": 2, "CH": 3}[phase]
        finals = sorted((r for r in records if r.get("status") == "final"
                         and _identity(r.get("match_id"))[:2] == (gender, phase)),
                        key=lambda r: r.get("series_game", 0))
        wins, teams, clinched = {}, None, 0
        for expected_game, final in enumerate(finals, 1):
            _require(not clinched and final.get("series_game") == expected_game,
                     "Postseason clinch evidence has missing or extra games")
            pair = {final.get("home_code"), final.get("away_code")}
            _require(len(pair) == 2 and (teams is None or teams == pair),
                     "Postseason clinch evidence changes teams")
            teams = pair
            try:
                score = validate_final_match({"status": "final", "score": final.get("score"),
                    "home": {"code": final.get("home_code")}, "away": {"code": final.get("away_code")}})
            except ValueError as exc:
                raise MasterError("Invalid postseason clinch score") from exc
            winner = final["home_code"] if score["home"] > score["away"] else final["away_code"]
            wins[winner] = wins.get(winner, 0) + 1
            if wins[winner] == needed:
                clinched = expected_game
        _require(clinched and game > clinched and teams == {target.get("home_code"), target.get("away_code")}
                 and target.get("notRequired") is True and target.get("non_play_reason") == "series_clinched",
                 "Unplayed fixture lacks verified series-winning results")


def build_update_plan(values, matched_records, *, spreadsheet_id=MASTER_SPREADSHEET_ID,
                      locked_match_ids=()):
    """Plan existing cells and bounded blank postseason rows; no mutation."""
    _require(spreadsheet_id == MASTER_SPREADSHEET_ID, "Unapproved MASTER workbook")
    index = _index(values)
    _require(isinstance(matched_records, list) and 0 < len(matched_records) <= 270,
             "Expected 1..270 verified season matches")
    _require(all(isinstance(r, dict) for r in matched_records), "Expected a matched record")
    _verify_unplayed_series(matched_records, index)
    locks = set(locked_match_ids)
    guards, changes, seen = [], [], set()
    for record in matched_records:
        _require(isinstance(record, dict), "Expected a matched record")
        mid = record.get("match_id")
        _require(isinstance(mid, str) and mid not in seen and (mid in index or mid in POSTSEASON_ROWS),
                 "Missing or duplicate matched MatchID")
        seen.add(mid)
        creation = mid not in index
        if creation:
            row_number = POSTSEASON_ROWS[mid]
            row = _row_at(values, row_number)
            _require(all(v == "" for v in row), f"Reserved postseason MASTER row is not blank: {mid}")
        else:
            row_number, row = index[mid]
        _require(mid not in locks and not LOCK_MARKER.search(str(row[18])), f"Manual lock requires review: {mid}")
        _require(not any(isinstance(row[c - 1], str) and row[c - 1].startswith("=")
                         for c in WRITABLE_COLUMNS), f"Formula in target cells: {mid}")
        if creation:
            division, phase, game = _identity(mid)
            template = [""] * 19
            identity = {1: mid, 2: "v-league-2026-27", 3: "남자" if division == "M" else "여자",
                        4: str(game), 5: POSTSEASON_PHASES[phase][1],
                        9: _text(record, "home_name"), 10: _text(record, "away_name")}
            for column, value in identity.items():
                template[column - 1] = value
            template[12] = "예정"
            desired = {**identity, **_desired_values(record, template)}
        else:
            desired = _desired_values(record, row)
        changed_columns = []
        for column, value in sorted(desired.items()):
            if not _equivalent(row[column - 1], value, column):
                changed_columns.append(column)
                changes.append({"match_id": mid, "row": row_number, "column": column,
                                "expected": row[column - 1], "value": value})
        guard = {"match_id": mid, "row": row_number, "changed_columns": changed_columns,
                 "protected_hash": _protected_hash(row, set(changed_columns))}
        if creation:
            guard["create_postseason"] = True
        guards.append(guard)
    plan = {"schema_version": 1, "spreadsheet_id": spreadsheet_id, "sheet_name": MASTER_SHEET_NAME,
            "sheet_id": MASTER_SHEET_ID, "range": MASTER_RANGE,
            "checked_match_ids": sorted(seen), "guards": guards, "changes": changes}
    plan["plan_hash"] = _hash(plan)
    return plan


def _validate_plan(plan):
    _require(isinstance(plan, dict) and plan.get("schema_version") == 1, "Unsupported MASTER plan")
    _require(plan.get("spreadsheet_id") == MASTER_SPREADSHEET_ID and plan.get("sheet_name") == MASTER_SHEET_NAME
             and plan.get("sheet_id") == MASTER_SHEET_ID and plan.get("range") == MASTER_RANGE,
             "MASTER plan targets an unapproved workbook or tab")
    _require(plan.get("plan_hash") == _hash({k: v for k, v in plan.items() if k != "plan_hash"}), "MASTER plan checksum mismatch")
    _require(isinstance(plan.get("guards"), list) and 0 < len(plan["guards"]) <= 270
             and isinstance(plan.get("changes"), list), "Invalid MASTER plan lists")
    guarded = {g["match_id"]: g for g in plan["guards"]}
    _require(len(guarded) == len(plan["guards"]) and sorted(guarded) == plan.get("checked_match_ids"), "Invalid MASTER plan identities")
    for mid, guard in guarded.items():
        _identity(mid)
        if guard.get("create_postseason"):
            _require(mid in POSTSEASON_ROWS and guard.get("row") == POSTSEASON_ROWS[mid]
                     and set(guard.get("changed_columns", [])) <= WRITABLE_COLUMNS | INITIAL_IDENTITY_COLUMNS,
                     "Unapproved postseason initialization")
    cells = set()
    for change in plan["changes"]:
        column, row_number = change.get("column"), change.get("row")
        guard = guarded.get(change.get("match_id"), {})
        allowed = WRITABLE_COLUMNS | INITIAL_IDENTITY_COLUMNS if guard.get("create_postseason") else WRITABLE_COLUMNS
        _require(type(column) is int and column in allowed and type(row_number) is int
                 and 2 <= row_number <= 600 and (row_number, column) not in cells, "Unapproved MASTER target cell")
        cells.add((row_number, column))
        _require(guard.get("row") == row_number and column in guard.get("changed_columns", []), "Ungrounded MASTER cell")
        if guard.get("create_postseason"):
            _require(change.get("expected") == "", "New postseason cells must have been blank")
        _require(type(change.get("value")) in (str, int, float) and
                 not (isinstance(change["value"], str) and change["value"].startswith("=")), "Unsafe MASTER cell value")


def _check_current(values, plan, *, after_write=False):
    index = _index(values)
    rows = {}
    for guard in plan["guards"]:
        mid = guard["match_id"]
        if mid not in index and guard.get("create_postseason"):
            row_number = guard["row"]
            row = _row_at(values, row_number)
            _require(not after_write and all(v == "" for v in row),
                     f"Postseason blank row changed or initialization was not verified: {mid}")
        else:
            _require(mid in index, f"MASTER row removed: {mid}")
            row_number, row = index[mid]
        rows[mid] = row
        _require(row_number == guard["row"], f"MASTER rows moved; rebuild plan: {mid}")
        _require(not LOCK_MARKER.search(str(row[18])), f"Manual lock requires review: {mid}")
        _require(_protected_hash(row, set(guard["changed_columns"])) == guard["protected_hash"],
                 f"MASTER protected cells changed; rebuild plan: {mid}")
    pending = []
    for change in plan["changes"]:
        actual = rows[change["match_id"]][change["column"] - 1]
        if actual == change["value"]:
            continue
        _require(not after_write and actual == change["expected"],
                 f"MASTER expected value conflict: {change['match_id']} column {change['column']}")
        pending.append(change)
    return pending


def apply_update_plan(client, plan):
    """Reread, compare, update only planned cells, then verify; idempotent retry."""
    _validate_plan(plan)
    _require(getattr(client, "spreadsheet_id", None) == MASTER_SPREADSHEET_ID, "Wrong MASTER client")
    pending = _check_current(client.read_values(), plan)
    uncertain = False
    if pending:
        updates = [{"range": f"'{MASTER_SHEET_NAME}'!{chr(64 + c['column'])}{c['row']}",
                    "majorDimension": "ROWS", "values": [[c["value"]]]} for c in pending]
        try:
            client.batch_update_values(updates)
        except Exception:
            # A timeout can mean the write succeeded. Never blindly resend it.
            uncertain = True
        _check_current(client.read_values(), plan, after_write=True)
    return {"status": "VERIFIED_AFTER_UNCERTAIN_RESPONSE" if uncertain else "VERIFIED",
            "spreadsheet_id": MASTER_SPREADSHEET_ID, "sheet_id": MASTER_SHEET_ID,
            "plan_hash": plan["plan_hash"], "changed_cells": len(pending),
            "already_applied_cells": len(plan["changes"]) - len(pending),
            "changed_match_ids": sorted({c["match_id"] for c in pending}),
            "verified_match_count": len(plan["checked_match_ids"])}


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class SheetsClient:
    """An explicitly authenticated client restricted to the one verified MASTER."""

    def __init__(self, authorize_headers, *, spreadsheet_id=MASTER_SPREADSHEET_ID):
        _require(spreadsheet_id == MASTER_SPREADSHEET_ID, "Unapproved MASTER workbook")
        self.spreadsheet_id = spreadsheet_id
        self._authorize = authorize_headers
        self._opener = build_opener(_NoRedirect())
        self._base = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheet_id

    @classmethod
    def from_environment(cls):
        token = os.environ.get("KVL_GOOGLE_ACCESS_TOKEN", "")
        if token:
            _require(not any(c.isspace() for c in token), "Invalid configured Google access token")
            return cls(lambda method, url, headers: headers.update({"Authorization": "Bearer " + token}))
        credential_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
        _require(credential_path and Path(credential_path).is_file(),
                 "Google MASTER credentials are not configured; site-only publication is prohibited")
        try:
            import google.auth
            from google.auth.transport.requests import Request as AuthRequest
            credentials, _ = google.auth.default(scopes=SCOPES)
            auth_request = AuthRequest()
        except Exception:
            raise MasterError("Configured Google MASTER credentials could not be loaded") from None
        return cls(lambda method, url, headers: credentials.before_request(auth_request, method, url, headers))

    def _request(self, method, suffix, body=None):
        url = self._base + suffix
        headers = {"Accept": "application/json"}
        data = None if body is None else json.dumps(body, ensure_ascii=False).encode()
        if data is not None:
            headers["Content-Type"] = "application/json; charset=utf-8"
        try:
            self._authorize(method, url, headers)
            request = Request(url, data=data, headers=headers, method=method)
            with self._opener.open(request, timeout=25) as response:
                _require(response.status == 200 and response.geturl() == url, "Unexpected Sheets API response")
                raw = response.read(2_000_001)
                _require(len(raw) <= 2_000_000, "Oversized Sheets API response")
            result = json.loads(raw)
            _require(isinstance(result, dict) and "error" not in result, "Sheets API did not return a valid object")
            return result
        except HTTPError as exc:
            raise MasterError(f"Google Sheets HTTP {exc.code}") from None
        except (URLError, TimeoutError, OSError):
            raise MasterError("Google Sheets network request failed") from None
        except MasterError:
            raise
        except Exception:
            # OAuth/library errors can contain credential configuration; omit them.
            raise MasterError("Google Sheets authentication or response parsing failed") from None

    def _verify_metadata(self):
        fields = "spreadsheetId,sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))"
        metadata = self._request("GET", "?" + urlencode({"fields": fields}))
        _require(metadata.get("spreadsheetId") == self.spreadsheet_id, "Sheets returned a different workbook")
        matches = [s.get("properties", {}) for s in metadata.get("sheets", [])
                   if s.get("properties", {}).get("title") == MASTER_SHEET_NAME]
        _require(len(matches) == 1 and matches[0].get("sheetId") == MASTER_SHEET_ID,
                 "Verified MASTER tab is missing or replaced")
        grid = matches[0].get("gridProperties", {})
        _require(grid.get("rowCount", 0) >= 271 and grid.get("columnCount", 0) >= 19, "MASTER grid is smaller than the verified schema")

    def read_values(self):
        self._verify_metadata()
        suffix = "/values/" + quote(MASTER_RANGE, safe="") + "?" + urlencode({
            "valueRenderOption": "FORMULA", "dateTimeRenderOption": "FORMATTED_STRING"})
        values = self._request("GET", suffix).get("values")
        _index(values)
        return values

    get_values = read_values

    def batch_update_values(self, updates):
        _require(isinstance(updates, list) and 0 < len(updates) <= 270 * len(WRITABLE_COLUMNS | INITIAL_IDENTITY_COLUMNS), "Invalid Sheets update count")
        for update in updates:
            match = re.fullmatch(r"'경기일정_MASTER'!([A-S])(\d{1,3})", update.get("range", ""))
            _require(match is not None, "Sheets update outside approved cells")
            column, row_number = ord(match.group(1)) - 64, int(match.group(2))
            _require(2 <= row_number <= 600 and (column in WRITABLE_COLUMNS or
                     (column in INITIAL_IDENTITY_COLUMNS and 254 <= row_number <= 271)),
                     "Sheets update outside approved cells")
            _require(update.get("majorDimension") == "ROWS" and isinstance(update.get("values"), list)
                     and len(update["values"]) == 1 and len(update["values"][0]) == 1, "Only single-cell Sheets writes are permitted")
        return self._request("POST", "/values:batchUpdate", {
            "valueInputOption": "RAW", "data": updates, "includeValuesInResponse": False})

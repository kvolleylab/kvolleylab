#!/usr/bin/env python3
"""Update-window gate and local archive preparation for the V-League adapter.

Clock boundaries control permission to update, never sporting completion. The
policy is reviewed repository configuration, not automatically extended from a
changed fixture, a source timestamp, a manual dispatch, or next year's season.
The default gate is read-only. Only ``prepare-archive`` creates a new local
archive after validation; it never changes the policy pointer, credentials,
MASTER, remote repository, or a previous archive.
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, time, timedelta, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
from tempfile import TemporaryDirectory
from urllib.parse import parse_qsl, urlsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from kovo_vleague_standings import StandingsError, validate_final_match

DEFAULT_POLICY = "config/automation/vleague-2026-27_v1.json"
REGULAR_STAGE = re.compile(r"[1-6]라운드")
SEASON_SCOPE = "season_through_championship"
POSTSEASON_SERIES = {
    "QPO": {"stage": "준플레이오프", "wins": 1, "maximum": 1},
    "PO": {"stage": "플레이오프", "wins": 2, "maximum": 3},
    "CH": {"stage": "챔피언결정전", "wins": 3, "maximum": 5},
}


class LifecycleError(ValueError):
    """A fixed, public-safe reason code; never include source/private payloads."""


def require(condition, code):
    if not condition:
        raise LifecycleError(code)


def utc_now():
    return datetime.now(timezone.utc)


def timestamp(value):
    try:
        require(isinstance(value, str), "TIMESTAMP_INVALID")
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        require(result.tzinfo is not None and result.utcoffset() is not None, "TIMESTAMP_TIMEZONE_REQUIRED")
        return result
    except (ValueError, TypeError) as exc:
        if isinstance(exc, LifecycleError):
            raise
        raise LifecycleError("TIMESTAMP_INVALID") from None


def calendar_day(value):
    try:
        require(isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value), "FIXTURE_DATE_INVALID")
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        raise LifecycleError("FIXTURE_DATE_INVALID") from None


def local_path(root, relative):
    require(isinstance(relative, str) and relative and "\\" not in relative, "PATH_INVALID")
    parts = PurePosixPath(relative)
    require(not parts.is_absolute() and ".." not in parts.parts, "PATH_INVALID")
    result = (Path(root) / relative).resolve()
    require(result.is_relative_to(Path(root).resolve()), "PATH_OUTSIDE_REPOSITORY")
    return result


def read_json(path):
    try:
        result = json.loads(Path(path).read_text(encoding="utf-8"))
        require(isinstance(result, dict), "JSON_OBJECT_REQUIRED")
        return result
    except (OSError, ValueError, TypeError):
        raise LifecycleError("POLICY_OR_EVIDENCE_UNREADABLE") from None


def official_url(value):
    require(isinstance(value, str), "OFFICIAL_SOURCE_REQUIRED")
    parsed = urlsplit(value)
    require(parsed.scheme == "https" and parsed.hostname in
            {"kovo.co.kr", "www.kovo.co.kr", "user-api.kovo.co.kr", "cdn.kovo.co.kr"}
            and parsed.port in (None, 443) and not parsed.username and not parsed.password
            and parsed.path not in ("", "/"), "OFFICIAL_SOURCE_REQUIRED")
    require(not any(re.search(r"(?:^|[-_])(?:token|secret|password|signature|sig|credential|authorization|key)(?:$|[-_])", key, re.I)
                    for key, _ in parse_qsl(parsed.query)), "OFFICIAL_SOURCE_URL_HAS_CREDENTIAL_PARAMETERS")


def validate_policy(policy):
    require(policy.get("schema_version") == 1 and policy.get("phase_scope") == SEASON_SCOPE,
            "POLICY_SCOPE_INVALID")
    require(policy.get("auto_next_season") is False and policy.get("auto_postseason") is True,
            "AUTOMATIC_SCOPE_EXPANSION_PROHIBITED")
    require(policy.get("included_phases") == ["regular_season", "semi_playoff", "playoff", "championship"],
            "POLICY_PHASES_INVALID")
    require(isinstance(policy.get("automation_id"), str) and
            re.fullmatch(r"[a-z0-9-]+", policy["automation_id"]), "AUTOMATION_ID_INVALID")
    require(isinstance(policy.get("season"), str) and re.fullmatch(r"\d{4}-\d{2}", policy["season"]),
            "SEASON_INVALID")
    try:
        zone = ZoneInfo(policy["timezone"])
    except (KeyError, TypeError, ZoneInfoNotFoundError):
        raise LifecycleError("TIMEZONE_INVALID") from None
    window, basis = policy.get("update_window", {}), policy.get("schedule_basis", {})
    require(isinstance(window, dict) and isinstance(basis, dict), "POLICY_WINDOW_INVALID")
    start, end = timestamp(window.get("starts_at")), timestamp(window.get("ends_at"))
    days = window.get("reconciliation_days")
    require(window.get("end_exclusive") is True and type(days) is int and 0 <= days <= 14,
            "RECONCILIATION_WINDOW_INVALID")
    first, last = calendar_day(basis.get("first_fixture_day")), calendar_day(basis.get("last_fixture_day"))
    require(first <= last and start < end, "POLICY_WINDOW_INVALID")
    require(start == datetime.combine(first, time.min, zone)
            and end == datetime.combine(last + timedelta(days=days + 1), time.min, zone),
            "WINDOW_DOES_NOT_MATCH_REVIEWED_BASIS")
    timestamp(basis.get("observed_at"))
    require(isinstance(basis.get("repository_commit"), str) and
            re.fullmatch(r"[0-9a-f]{40}", basis["repository_commit"]), "BASIS_COMMIT_REQUIRED")
    require(basis.get("postseason_format") == {
        "semi_playoff": {"maximum_games": 1, "wins_required": 1, "third_fourth_points_gap_maximum": 3},
        "playoff": {"maximum_games": 3, "wins_required": 2},
        "championship": {"maximum_games": 5, "wins_required": 3}}, "POSTSEASON_FORMAT_REVIEW_REQUIRED")
    competitions, evidence = policy.get("competitions"), basis.get("evidence")
    require(isinstance(competitions, list) and competitions and all(isinstance(c, dict) for c in competitions),
            "COMPETITION_SCOPE_INVALID")
    ids, paths, genders = set(), set(), set()
    for item in competitions:
        cid, slug, path, gender = item.get("competition_id"), item.get("slug"), item.get("data_path"), item.get("gender")
        require(isinstance(cid, str) and re.fullmatch(r"[A-Za-z0-9-]+", cid) and cid not in ids,
                "COMPETITION_SCOPE_INVALID")
        require(isinstance(slug, str) and re.fullmatch(r"[a-z0-9-]+", slug)
                and isinstance(path, str) and path == f"data/competitions/{slug}/data.json" and path not in paths,
                "COMPETITION_PATH_INVALID")
        require(gender in ("MALE", "FEMALE") and gender not in genders, "DIVISION_SCOPE_INVALID")
        require(type(item.get("expected_regular_matches")) is int and item["expected_regular_matches"] > 0,
                "EXPECTED_MATCH_COUNT_REQUIRED")
        ids.add(cid); paths.add(path); genders.add(gender)
    require(isinstance(evidence, list) and len(evidence) == len(competitions)
            and all(isinstance(e, dict) for e in evidence)
            and {e.get("competition_id") for e in evidence} == ids, "BOTH_DIVISIONS_NEED_SOURCE_EVIDENCE")
    evidence_dates = []
    for item in evidence:
        require(bool(item.get("source_id")) and item.get("evidence_kind") == "official_competition_regulations"
                and isinstance(item.get("sha256"), str) and re.fullmatch(r"[0-9a-f]{64}", item["sha256"]),
                "SCHEDULE_EVIDENCE_REQUIRED")
        official_url(item.get("source_url"))
        evidence_dates.append(calendar_day(item.get("last_possible_fixture_day")))
        division = next(c["gender"] for c in competitions if c["competition_id"] == item["competition_id"])
        periods = basis.get("division_periods", {}).get(division, {})
        require(isinstance(periods, dict) and set(periods) == {"semi_playoff", "playoff", "championship"},
                "POSTSEASON_PERIODS_REQUIRED")
        previous_end = first
        for phase in ("semi_playoff", "playoff", "championship"):
            period = periods[phase]
            require(isinstance(period, dict), "POSTSEASON_PERIOD_INVALID")
            phase_start, phase_end = calendar_day(period.get("starts_on")), calendar_day(period.get("ends_on"))
            require(previous_end < phase_start <= phase_end <= last, "POSTSEASON_PERIOD_INVALID")
            previous_end = phase_end
        require(previous_end == evidence_dates[-1], "POSTSEASON_LAST_POSSIBLE_DAY_MISMATCH")
    require(max(evidence_dates) == last, "LAST_FIXTURE_BASIS_INVALID")
    require(isinstance(policy.get("identity_state_path"), str)
            and policy["identity_state_path"] not in paths, "IDENTITY_STATE_PATH_REQUIRED")
    return zone, start, end, last


def load_policy(root, relative=DEFAULT_POLICY):
    policy = read_json(local_path(root, relative))
    validate_policy(policy)
    return policy


def postseason_status(data, regular_complete):
    """Validate series completion without inventing fixtures or deciding a date.

    Required wins follow the reviewed 2026-27 competition format. A published
    potential fourth/fifth game is not an unfinished match once its series has
    already been clinched. It is counted as not played only when its ordinal is
    after that actual clincher; a missing earlier game or a played extra game
    remains an error. Regular-season ranks determine conditional QPO eligibility
    only after every regular fixture has a valid final result.
    """
    by_stage = {rule["stage"]: key for key, rule in POSTSEASON_SERIES.items()}
    matches = [m for m in data["matches"] if m.get("stage") in by_stage]
    require(len({m.get("id") for m in matches}) == len(matches)
            and all(isinstance(m.get("id"), str) and m["id"] for m in matches),
            "POSTSEASON_FIXTURE_ID_INVALID")
    seeds, qpo_required = {}, None
    if regular_complete:
        rows = data.get("standings", {}).get("rows", [])
        if (isinstance(rows, list) and len(rows) == 7
                and all(isinstance(row, dict) and type(row.get("rank")) is int
                        and type(row.get("points")) is int and row["points"] >= 0
                        and isinstance(row.get("team"), dict) and isinstance(row["team"].get("code"), str)
                        and row["team"]["code"] for row in rows)
                and {row["rank"] for row in rows} == set(range(1, 8))
                and len({row["team"]["code"] for row in rows}) == 7):
            seeds = {row["rank"]: row for row in rows}
            require(seeds[3]["points"] >= seeds[4]["points"], "POSTSEASON_SEED_POINTS_INVALID")
            qpo_required = seeds[3]["points"] - seeds[4]["points"] <= 3
    series, completed, ignored = {}, 0, 0
    for key, rule in POSTSEASON_SERIES.items():
        games = [m for m in matches if m["stage"] == rule["stage"]]
        ordinals = {}
        for match in games:
            ordinal = match.get("seriesGame")
            require(type(ordinal) is int and 1 <= ordinal <= rule["maximum"]
                    and match.get("round") == f"{ordinal}차전" and ordinal not in ordinals,
                    "POSTSEASON_GAME_ORDINAL_INVALID")
            require(match.get("status") in ("scheduled", "live", "final", "postponed", "cancelled", "not_required"),
                    "POSTSEASON_STATUS_INVALID")
            ordinals[ordinal] = match
        required = qpo_required if key == "QPO" else True
        pair, wins, winner, clincher, played, not_played = None, {}, None, None, 0, 0
        last_result_day = None
        for ordinal, match in sorted(ordinals.items()):
            if clincher is not None:
                require(match.get("status") in ("scheduled", "not_required", "cancelled") and match.get("score") is None,
                        "POSTSEASON_GAME_AFTER_CLINCH")
                not_played += 1
                continue
            if required is False:
                require(match.get("status") in ("scheduled", "not_required", "cancelled") and match.get("score") is None,
                        "UNREQUIRED_QPO_WAS_PLAYED")
                not_played += 1
                continue
            require(match.get("status") != "not_required", "POSTSEASON_NOT_REQUIRED_UNPROVEN")
            if match.get("status") != "final":
                continue
            require(regular_complete and seeds and all(n in ordinals and ordinals[n].get("status") == "final"
                                                      for n in range(1, ordinal)),
                    "POSTSEASON_FINAL_BEFORE_PREREQUISITE")
            try:
                score = validate_final_match(match)
            except StandingsError:
                raise LifecycleError("FINAL_RESULT_INVALID") from None
            result_day = calendar_day(match.get("date"))
            preceding_series = None if key == "QPO" else series["QPO" if key == "PO" else "PO"]
            predecessor_day = preceding_series.get("last_result_day") if preceding_series else None
            require((last_result_day is None or result_day >= last_result_day)
                    and (predecessor_day is None or result_day >= calendar_day(predecessor_day)),
                    "POSTSEASON_FINAL_CHRONOLOGY_INVALID")
            last_result_day = result_day
            actual_pair = {match["home"]["code"], match["away"]["code"]}
            require(pair is None or actual_pair == pair, "POSTSEASON_SERIES_TEAM_MISMATCH")
            pair = actual_pair
            if key == "QPO":
                expected_pair = {seeds[3]["team"]["code"], seeds[4]["team"]["code"]}
                require(match["home"]["code"] == seeds[3]["team"]["code"], "POSTSEASON_HOME_RIGHT_MISMATCH")
            elif key == "PO":
                third = series["QPO"]["winner"] if qpo_required else seeds[3]["team"]["code"]
                require(third is not None and series["QPO"]["complete"], "POSTSEASON_FINAL_BEFORE_PREREQUISITE")
                expected_pair = {seeds[2]["team"]["code"], third}
            else:
                require(series["PO"]["complete"] and series["PO"]["winner"] is not None,
                        "POSTSEASON_FINAL_BEFORE_PREREQUISITE")
                expected_pair = {seeds[1]["team"]["code"], series["PO"]["winner"]}
            require(actual_pair == expected_pair, "POSTSEASON_QUALIFICATION_MISMATCH")
            won = match["home" if score["home"] == 3 else "away"]["code"]
            wins[won] = wins.get(won, 0) + 1
            played += 1
            if wins[won] == rule["wins"]:
                winner, clincher = won, ordinal
        complete = required is False or winner is not None
        completed += played
        ignored += not_played
        series[key] = {"required": required, "matched": len(games), "played": played,
                       "not_played": not_played, "complete": complete, "winner": winner,
                       "clinching_game": clincher,
                       "last_result_day": last_result_day.isoformat() if last_result_day is not None else None}
    complete = regular_complete and bool(seeds) and all(item["complete"] for item in series.values())
    return {"matched": len(matches), "completed": completed,
            "unresolved": max(0, len(matches) - completed - ignored), "not_played": ignored,
            "qpo_required": qpo_required, "complete": complete,
            "champion": series["CH"]["winner"] if complete else None, "series": series}


def fixture_status(root, policy, candidates=None):
    """Inspect fixed regular coverage and the complete postseason locally."""
    result = {}
    for item in policy["competitions"]:
        path = item["data_path"]
        config = read_json(local_path(root, str(PurePosixPath(path).with_name("config.json"))))
        require(config.get("slug") == item["slug"]
                and config.get("competition", {}).get("competitionId") == item["competition_id"],
                "CANONICAL_COMPETITION_ID_MISMATCH")
        data = candidates[path] if candidates is not None else read_json(local_path(root, path))
        matches = data.get("matches")
        require(isinstance(matches, list) and all(isinstance(m, dict) for m in matches), "FIXTURES_INVALID")
        regular = [m for m in matches if isinstance(m.get("stage"), str) and REGULAR_STAGE.fullmatch(m["stage"])]
        require(len(regular) == item["expected_regular_matches"]
                and len({m.get("id") for m in regular}) == len(regular)
                and all(isinstance(m.get("id"), str) and m["id"] for m in regular), "FIXTURE_COVERAGE_INVALID")
        supported = regular + [m for m in matches if m.get("stage") in
                               {rule["stage"] for rule in POSTSEASON_SERIES.values()}]
        require(len(supported) == len(matches), "UNSUPPORTED_SEASON_STAGE")
        dates = [calendar_day(m.get("date")) for m in supported]
        completed = 0
        for match in regular:
            if match.get("status") != "final":
                continue
            try:
                validate_final_match(match)
            except StandingsError:
                raise LifecycleError("FINAL_RESULT_INVALID") from None
            completed += 1
        postseason = postseason_status(data, completed == len(regular))
        completed_dates = [calendar_day(m["date"]) for m in supported if m.get("status") == "final"]
        result[item["competition_id"]] = {
            "matched": len(regular), "completed": completed, "unresolved": len(regular) - completed,
            "first_fixture_day": min(dates).isoformat(), "last_fixture_day": max(dates).isoformat(),
            "last_completed_fixture_day": max(completed_dates).isoformat() if completed_dates else None,
            "postseason": postseason, "season_complete": completed == len(regular) and postseason["complete"],
        }
    return result


def hashed_json(root, reference, archive_directory):
    require(isinstance(reference, dict), "ARCHIVE_REFERENCE_INVALID")
    path = local_path(root, reference.get("path"))
    require(path.is_relative_to(archive_directory), "ARCHIVE_EVIDENCE_MUST_BE_SNAPSHOTTED")
    expected = reference.get("sha256")
    require(isinstance(expected, str) and re.fullmatch(r"[0-9a-f]{64}", expected), "ARCHIVE_HASH_REQUIRED")
    try:
        raw = path.read_bytes()
    except OSError:
        raise LifecycleError("ARCHIVE_EVIDENCE_MISSING") from None
    require(hashlib.sha256(raw).hexdigest() == expected, "ARCHIVE_HASH_MISMATCH")
    return read_json(path)


def verify_archive(root, policy, divisions, now):
    """A manifest is accepted only with final data and hashed verification receipts.

    Official completion entries are explicit reviewed evidence, not inferred by
    this program from dates, scores or a flag on a competition page. Creating and
    reviewing that evidence remains a separate closeout task.
    """
    relative = policy.get("archive_manifest_path")
    if relative is None:
        return None
    manifest_path = local_path(root, relative)
    archive_directory = local_path(root, f"data/automation/archive/{policy['automation_id']}")
    require(manifest_path.is_relative_to(archive_directory), "ARCHIVE_MANIFEST_PATH_INVALID")
    manifest = read_json(manifest_path)
    require(manifest.get("schema_version") == 1 and manifest.get("automation_id") == policy["automation_id"]
            and manifest.get("season") == policy["season"] and manifest.get("phase_scope") == policy["phase_scope"],
            "ARCHIVE_SCOPE_INVALID")
    created = timestamp(manifest.get("created_at"))
    require(created <= now and all(group["season_complete"] for group in divisions.values()),
            "ARCHIVE_REQUIRES_FINAL_RESULTS")
    require(created >= timestamp(policy["update_window"]["ends_at"]), "ARCHIVE_BEFORE_UPDATE_WINDOW_CLOSED")
    ids = {c["competition_id"] for c in policy["competitions"]}
    official = manifest.get("official_completion")
    require(isinstance(official, list) and len(official) == len(ids)
            and all(isinstance(e, dict) for e in official)
            and {e.get("competition_id") for e in official} == ids, "OFFICIAL_COMPLETION_REQUIRED")
    zone = ZoneInfo(policy["timezone"])
    final_day_start = max(datetime.combine(calendar_day(d["last_completed_fixture_day"]), time.min, zone)
                          for d in divisions.values())
    require(final_day_start <= created, "ARCHIVE_BEFORE_FINAL_FIXTURE_DAY")
    for entry in official:
        require(entry.get("review_status") == "VERIFIED" and entry.get("phase_scope") == policy["phase_scope"]
                and isinstance(entry.get("source_id"), str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.:-]{2,127}", entry["source_id"]),
                "OFFICIAL_COMPLETION_REQUIRED")
        official_url(entry.get("source_url"))
        division_day = calendar_day(divisions[entry["competition_id"]]["last_completed_fixture_day"])
        require(datetime.combine(division_day, time.min, zone) <= timestamp(entry.get("verified_at")) <= created,
                "OFFICIAL_COMPLETION_TIME_INVALID")
    expected_paths = {c["data_path"] for c in policy["competitions"]} | {policy["identity_state_path"]}
    snapshots = manifest.get("snapshots")
    require(isinstance(snapshots, list) and len(snapshots) == len(expected_paths)
            and all(isinstance(s, dict) for s in snapshots)
            and {s.get("source_path") for s in snapshots} == expected_paths, "ARCHIVE_SNAPSHOT_COVERAGE_INVALID")
    hashes = {}
    for entry in snapshots:
        hashed_json(root, entry, archive_directory)
        source = local_path(root, entry["source_path"])
        require(hashlib.sha256(source.read_bytes()).hexdigest() == entry["sha256"],
                "ARCHIVE_DOES_NOT_MATCH_CURRENT_DATA")
        hashes[entry["source_path"]] = entry["sha256"]
    receipts = manifest.get("receipts", {})
    require(isinstance(receipts, dict), "ARCHIVE_RECEIPTS_REQUIRED")
    publication = hashed_json(root, receipts.get("publication"), archive_directory)
    require(publication.get("season") == policy["season"] and publication.get("status") == "READY"
            and publication.get("mode") == "MASTER_VERIFIED_LOCAL_DATA_READY"
            and publication.get("master_checked") is True and publication.get("master_readback_verified") is True,
            "ARCHIVE_MASTER_VERIFICATION_REQUIRED")
    gate = publication.get("publication_gate", {})
    require(gate.get("status") == "PASS" and isinstance(gate.get("files"), dict)
            and set(gate["files"]) == expected_paths, "ARCHIVE_PUBLICATION_VERIFICATION_REQUIRED")
    require(final_day_start <= timestamp(publication.get("checked_at")) <= timestamp(gate.get("checked_at")) <= created,
            "ARCHIVE_RECEIPT_TIME_INVALID")
    for path, sha in hashes.items():
        require(gate["files"][path].get("sha256") == sha, "ARCHIVE_PUBLICATION_HASH_MISMATCH")
    for item in policy["competitions"]:
        verified = publication.get("divisions", {}).get(item["gender"], {})
        require(verified.get("matched") == item["expected_regular_matches"]
                and verified.get("completed") == item["expected_regular_matches"]
                and verified.get("standings_verified") is True, "ARCHIVE_FINAL_STANDINGS_REQUIRED")
        expected_postseason = divisions[item["competition_id"]]["postseason"]
        post = verified.get("postseason", {})
        require(isinstance(post, dict) and all(post.get(key) == expected_postseason[key]
                for key in ("matched", "completed", "complete", "champion")),
                "ARCHIVE_FINAL_POSTSEASON_REQUIRED")
    deployment = hashed_json(root, receipts.get("deployment"), archive_directory)
    commit = deployment.get("expected_sha")
    require(deployment.get("status") == "DEPLOYED_VERIFIED" and isinstance(commit, str)
            and re.fullmatch(r"[0-9a-f]{40}", commit) and deployment.get("built_sha") == commit
            and set(deployment.get("verified_files", [])) == {c["data_path"] for c in policy["competitions"]},
            "ARCHIVE_DEPLOYMENT_VERIFICATION_REQUIRED")
    require(manifest.get("deployment_commit") == commit, "ARCHIVE_DEPLOYMENT_COMMIT_MISMATCH")
    exact_hashes = deployment.get("verified_file_sha256")
    require(isinstance(exact_hashes, dict) and set(exact_hashes) == {c["data_path"] for c in policy["competitions"]}
            and all(exact_hashes[path] == hashes[path] for path in exact_hashes), "ARCHIVE_DEPLOYMENT_FILE_HASH_MISMATCH")
    require(timestamp(gate["checked_at"]) <= timestamp(deployment.get("verified_at")) <= created,
            "ARCHIVE_DEPLOYMENT_TIME_INVALID")
    payload_hashes = deployment.get("verified_payload_sha256")
    require(isinstance(payload_hashes, dict) and set(payload_hashes) == {c["data_path"] for c in policy["competitions"]},
            "ARCHIVE_DEPLOYMENT_HASHES_REQUIRED")
    for item in policy["competitions"]:
        content = read_json(local_path(root, item["data_path"]))
        canonical = json.dumps(content, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
        require(payload_hashes[item["data_path"]] == hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
                "ARCHIVE_DEPLOYMENT_HASH_MISMATCH")
    return hashlib.sha256(manifest_path.read_bytes()).hexdigest()


def evaluate(root, policy, *, now=None, candidates=None):
    zone, start, end, last = validate_policy(policy)
    now = utc_now() if now is None else now
    require(isinstance(now, datetime) and now.tzinfo is not None and now.utcoffset() is not None,
            "CURRENT_TIME_MUST_HAVE_TIMEZONE")
    divisions = fixture_status(root, policy, candidates)
    archive_sha = verify_archive(root, policy, divisions, now)
    result = {"schema_version": 1, "automation_id": policy["automation_id"], "season": policy["season"],
              "checked_at": now.astimezone(timezone.utc).isoformat(), "timezone": policy["timezone"],
              "starts_at": start.isoformat(), "ends_at": end.isoformat(), "end_exclusive": True,
              "phase_scope": policy["phase_scope"], "divisions": divisions,
              "official_competition_end_inferred": False, "allow_update": False,
              "master_written": False, "production_written": False}
    if archive_sha:
        result.update(status="SKIPPED", phase="ARCHIVED", reason_code="VERIFIED_ARCHIVE",
                      archive_manifest_sha256=archive_sha)
    elif now < start:
        result.update(status="SKIPPED", phase="BEFORE_UPDATE_WINDOW", reason_code="UPDATE_WINDOW_NOT_STARTED")
    elif now >= end:
        result.update(status="SKIPPED", phase="STOPPED_PENDING_ARCHIVE", reason_code="UPDATE_WINDOW_CLOSED",
                      archive_blockers=["OFFICIAL_COMPLETION_AND_ARCHIVE_NOT_VERIFIED"] +
                      (["UNFINISHED_REGULAR_SEASON"] if any(d["unresolved"] for d in divisions.values()) else []) +
                      (["UNFINISHED_POSTSEASON"] if any(not d["postseason"]["complete"] for d in divisions.values()) else []))
    else:
        require(all(calendar_day(d["first_fixture_day"]) >= start.astimezone(zone).date()
                    and calendar_day(d["last_fixture_day"]) < end.astimezone(zone).date()
                    for d in divisions.values()), "SCHEDULE_OUTSIDE_REVIEWED_UPDATE_WINDOW")
        phase = "RECONCILING" if now >= datetime.combine(last + timedelta(days=1), time.min, zone) else "UPDATING"
        result.update(status="READY", phase=phase, reason_code="UPDATE_WINDOW_OPEN", allow_update=True)
    return result


def require_update_window(root, *, candidates=None):
    """Publisher guard: uses only real wall time and the pinned adapter policy."""
    policy = load_policy(root)
    require(policy["season"] == "2026-27" and policy["automation_id"] == "vleague-2026-27-regular"
            and {c["gender"]: (c["competition_id"], c["slug"]) for c in policy["competitions"]} ==
            {"MALE": ("KVL-COMP-VLEAGUE-M-2026-27", "v-league-men-2026-27"),
             "FEMALE": ("KVL-COMP-VLEAGUE-W-2026-27", "v-league-women-2026-27")}
            and all(c["expected_regular_matches"] == 126 for c in policy["competitions"])
            and policy["identity_state_path"] == "data/kovo/vleague/2026-27/state_v1.json",
            "PUBLISHER_SCOPE_MISMATCH")
    result = evaluate(root, policy, candidates=candidates)
    require(result["allow_update"], result["reason_code"])
    return result


def prepare_archive(root, official_completion_path, publication_receipt_path, deployment_receipt_path,
                    *, policy_relative=DEFAULT_POLICY, now=None):
    """Validate a complete temporary tree, then promote one new immutable version.

    The archive namespace is exclusively reserved with mkdir only after all
    checks pass. Renaming the complete version into that new namespace exposes
    the manifest and its files together. Existing namespaces are never reused.
    """
    root = Path(root).resolve()
    policy_file = local_path(root, policy_relative)
    policy_bytes = policy_file.read_bytes()
    policy = load_policy(root, policy_relative)
    require(policy.get("archive_manifest_path") is None, "ARCHIVE_POINTER_ALREADY_CONFIGURED")
    now = utc_now() if now is None else now
    require(isinstance(now, datetime) and now.tzinfo is not None and now.utcoffset() is not None,
            "CURRENT_TIME_MUST_HAVE_TIMEZONE")
    divisions = fixture_status(root, policy)
    require(all(group["season_complete"] for group in divisions.values()), "ARCHIVE_REQUIRES_FINAL_RESULTS")
    namespace_relative = f"data/automation/archive/{policy['automation_id']}"
    namespace = local_path(root, namespace_relative)
    require(not namespace.exists(), "ARCHIVE_ALREADY_EXISTS")
    version_relative = namespace_relative + "/verified_v1"
    manifest_relative = version_relative + "/manifest_v1.json"
    completion = read_json(official_completion_path)
    require(set(completion) == {"schema_version", "automation_id", "season", "phase_scope", "official_completion"}
            and completion.get("schema_version") == 1
            and completion.get("automation_id") == policy["automation_id"]
            and completion.get("season") == policy["season"] and completion.get("phase_scope") == policy["phase_scope"],
            "OFFICIAL_COMPLETION_SCOPE_INVALID")
    completion_fields = {"competition_id", "review_status", "phase_scope", "source_id", "source_url", "verified_at"}
    require(isinstance(completion["official_completion"], list)
            and all(isinstance(entry, dict) and set(entry) == completion_fields
                    for entry in completion["official_completion"]), "OFFICIAL_COMPLETION_FIELDS_INVALID")
    receipts = {"publication": Path(publication_receipt_path).read_bytes(),
                "deployment": Path(deployment_receipt_path).read_bytes()}
    expected_paths = {c["data_path"] for c in policy["competitions"]} | {policy["identity_state_path"]}
    originals = {relative: local_path(root, relative).read_bytes() for relative in expected_paths}
    configs = {str(PurePosixPath(c["data_path"]).with_name("config.json")) for c in policy["competitions"]}
    original_configs = {relative: local_path(root, relative).read_bytes() for relative in configs}
    with TemporaryDirectory(prefix=".kvl-archive-prepare-", dir=root) as temporary:
        staged_root = Path(temporary)
        for relative, raw in {**originals, **original_configs}.items():
            target = staged_root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
        snapshots, references = [], {}
        for index, relative in enumerate(sorted(expected_paths)):
            target_relative = f"{version_relative}/snapshots/{index:02d}-{PurePosixPath(relative).name}"
            target = staged_root / target_relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(originals[relative])
            snapshots.append({"source_path": relative, "path": target_relative,
                              "sha256": hashlib.sha256(originals[relative]).hexdigest()})
        receipt_fields = {
            "publication": {"schema_version", "season", "checked_at", "status", "mode", "source_coverage", "divisions",
                            "changed_files", "master_checked", "master_changed_cells", "production_written", "master_written",
                            "master_readback_verified", "quality_audit", "publication_gate", "lifecycle",
                            "postseason_source_coverage", "live_points_checks"},
            "deployment": {"status", "expected_sha", "built_sha", "build_requested", "verified_files", "verified_at",
                           "verified_file_sha256", "verified_payload_sha256"},
        }
        for label, raw in receipts.items():
            original_receipt = json.loads(raw)
            require(isinstance(original_receipt, dict) and set(original_receipt) <= receipt_fields[label], "ARCHIVE_RECEIPT_FIELDS_INVALID")
            # Keep the exact input digest for audit, but archive only fields the
            # verifier consumes. Optional diagnostics cannot smuggle raw/private
            # MASTER material into the public snapshot through nested objects.
            if label == "publication":
                gate = original_receipt.get("publication_gate")
                groups = original_receipt.get("divisions")
                require(original_receipt.get("schema_version") == 1 and isinstance(gate, dict)
                        and isinstance(gate.get("files"), dict) and set(gate["files"]) == expected_paths
                        and isinstance(groups, dict)
                        and set(groups) == {c["gender"] for c in policy["competitions"]}, "ARCHIVE_RECEIPT_FIELDS_INVALID")
                receipt = {key: original_receipt.get(key) for key in
                           ("schema_version", "season", "checked_at", "status", "mode", "master_checked", "master_readback_verified")}
                receipt["divisions"] = {}
                for gender, group in groups.items():
                    require(isinstance(group, dict) and isinstance(group.get("postseason"), dict),
                            "ARCHIVE_RECEIPT_FIELDS_INVALID")
                    receipt["divisions"][gender] = {key: group.get(key) for key in ("matched", "completed", "standings_verified")}
                    receipt["divisions"][gender]["postseason"] = {
                        key: group["postseason"].get(key) for key in ("matched", "completed", "complete", "champion")}
                receipt["publication_gate"] = {
                    "status": gate.get("status"), "checked_at": gate.get("checked_at"),
                    "files": {path: {"sha256": entry.get("sha256")} for path, entry in gate["files"].items()}}
            else:
                require("build_requested" not in original_receipt or type(original_receipt["build_requested"]) is bool,
                        "ARCHIVE_RECEIPT_FIELDS_INVALID")
                receipt = original_receipt
            target_relative = f"{version_relative}/receipts/{label}.json"
            receipt_file = staged_root / target_relative
            receipt_file.parent.mkdir(parents=True, exist_ok=True)
            receipt_file.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            references[label] = {"path": target_relative, "input_sha256": hashlib.sha256(raw).hexdigest(),
                                 "sha256": hashlib.sha256(receipt_file.read_bytes()).hexdigest()}
        deployment = read_json(staged_root / references["deployment"]["path"])
        manifest = {"schema_version": 1, "automation_id": policy["automation_id"], "season": policy["season"],
                    "phase_scope": policy["phase_scope"], "created_at": now.astimezone(timezone.utc).isoformat(),
                    "official_completion": completion["official_completion"], "snapshots": snapshots,
                    "receipts": references, "deployment_commit": deployment.get("expected_sha")}
        (staged_root / manifest_relative).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        proposed_policy = dict(policy, archive_manifest_path=manifest_relative)
        decision = evaluate(staged_root, proposed_policy, now=now)
        require(decision["phase"] == "ARCHIVED", "ARCHIVE_VALIDATION_INCOMPLETE")
        # Reuse the public export scanner before copying receipts or data into
        # a public repository path; raw MASTER/credential payloads are rejected.
        from quality_audit.checks import security
        public_paths = [manifest_relative] + [s["path"] for s in snapshots] + [r["path"] for r in references.values()]
        require(security(staged_root, public_paths)[0]["outcome"] == "PASS", "ARCHIVE_PUBLICATION_SECURITY_FAILED")
        require(policy_file.read_bytes() == policy_bytes and
                all(local_path(root, relative).read_bytes() == raw
                    for relative, raw in {**originals, **original_configs}.items()), "ARCHIVE_INPUT_CHANGED_DURING_PREPARATION")
        namespace.parent.mkdir(parents=True, exist_ok=True)
        try:
            namespace.mkdir()  # Atomic exclusive reservation; never replace even an empty existing archive.
        except FileExistsError:
            raise LifecycleError("ARCHIVE_ALREADY_EXISTS") from None
        try:
            (staged_root / version_relative).rename(namespace / "verified_v1")
        except Exception:
            try:
                namespace.rmdir()  # Remove only our still-empty reservation, never someone else's files.
            except OSError:
                pass
            raise
    return {"status": "ARCHIVE_PREPARED_NOT_ACTIVATED", "automation_id": policy["automation_id"],
            "manifest_path": manifest_relative, "manifest_sha256": decision["archive_manifest_sha256"],
            "proposed_policy_patch": {"archive_manifest_path": manifest_relative},
            "policy_changed": False, "master_written": False, "remote_written": False,
            "next_action": "Review the archive and proposed policy pointer together; no commit, deployment, or policy activation was performed."}


def archive_main(argv):
    parser = argparse.ArgumentParser(description="Prepare a verified local V-League archive without changing policy or remote state.")
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--policy", default=DEFAULT_POLICY)
    parser.add_argument("--official-completion", type=Path, required=True)
    parser.add_argument("--publication-receipt", type=Path, required=True)
    parser.add_argument("--deployment-receipt", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        result = prepare_archive(args.root, args.official_completion, args.publication_receipt,
                                 args.deployment_receipt, policy_relative=args.policy)
    except Exception as exc:
        print(json.dumps({"status": "ARCHIVE_NOT_PREPARED", "error_code": "LifecycleError",
                          "reason_code": str(exc) if isinstance(exc, LifecycleError) else "ARCHIVE_PREPARATION_FAILED",
                          "policy_changed": False, "master_written": False, "remote_written": False}))
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv and argv[0] == "prepare-archive":
        return archive_main(argv[1:])
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--policy", default=DEFAULT_POLICY)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--github-output", type=Path)
    parser.add_argument("--require-open", action="store_true", help="Fail closed immediately before a publishing side effect")
    args = parser.parse_args(argv)
    code = 0
    try:
        policy = load_policy(args.root, args.policy)
        result = evaluate(args.root, policy)
        if args.require_open and not result["allow_update"]:
            result.update(status="FAILED", error_code="LifecycleError")
            code = 1
    except Exception as exc:
        result = {"schema_version": 1, "status": "FAILED", "phase": "BLOCKED", "allow_update": False,
                  "error_code": "LifecycleError", "reason_code": str(exc) if isinstance(exc, LifecycleError) else "LIFECYCLE_VALIDATION_FAILED",
                  "master_written": False, "production_written": False}
        code = 1
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.github_output:
        with args.github_output.open("a", encoding="utf-8") as output:
            output.write(f"allow_update={str(result['allow_update']).lower()}\nphase={result['phase']}\n")
    print(json.dumps(result, ensure_ascii=False))
    return code


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Read-only, fail-closed cell plan from reviewed events and local MASTER snapshots.

No connector, network call, sheet creation, row insertion or external write exists.
Input snapshots must include current formulas/locks and a complete revision journal.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import re
from zoneinfo import ZoneInfo
from kvl_player_updates import DEFAULT, digest, iso_date, read, write, public_security_scan


def aware_datetime(value):
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo is not None else None
    except ValueError:
        return None


def snapshot_problems(config, target, snapshot, now):
    if not snapshot:
        return ["fresh_runtime_snapshot_missing"]
    problems = []
    for key in ("spreadsheet_id", "spreadsheet_title", "sheet_id", "sheet_title", "snapshot_kind"):
        if snapshot.get(key) != target[key]:
            problems.append(f"target_{key}_mismatch")
    if snapshot.get("snapshot_kind") != "current_roster":
        problems.append("historical_snapshot_cannot_update_current_roster")
    if snapshot.get("header_row") != config["header_row"] or snapshot.get("headers") != config["headers"]:
        problems.append("exact_header_schema_mismatch")
    fetched = aware_datetime(snapshot.get("fetched_at"))
    if not fetched or not 0 <= (now - fetched).total_seconds() <= config["maximum_snapshot_age_hours"] * 3600:
        problems.append("snapshot_stale_or_timestamp_unknown")
    if snapshot.get("formula_metadata_complete") is not True:
        problems.append("formula_metadata_unknown")
    if snapshot.get("lock_metadata_complete") is not True:
        problems.append("protection_and_manual_lock_metadata_unknown")
    numbers = []
    for row in snapshot.get("rows", []):
        row_number = row.get("row_number")
        if not isinstance(row_number, int) or row_number <= config["header_row"]:
            problems.append("invalid_row_number")
        numbers.append(row_number)
        if len(row.get("values", [])) != len(config["headers"]) or len(row.get("formulas", [])) != len(config["headers"]):
            problems.append("incomplete_row_values_or_formulas")
        if not isinstance(row.get("manual_locked"), bool):
            problems.append("row_manual_lock_state_unknown")
    if len(set(numbers)) != len(numbers):
        problems.append("duplicate_row_number")
    return sorted(set(problems))


def build_plan(config, exported, ledger, snapshots, journal, now=None):
    now = now or datetime.now(timezone.utc)
    candidates = {row["revision_id"]: row for row in ledger.get("candidates", [])}
    event_counts = Counter(event.get("event_id") for event in exported.get("events", []))
    snapshot_map = {item.get("spreadsheet_id"): item for item in snapshots}
    snapshot_counts = Counter(item.get("spreadsheet_id") for item in snapshots)
    target_status = {}
    for target in config["targets"]:
        target_status[target["id"]] = snapshot_problems(config, target, snapshot_map.get(target["spreadsheet_id"]), now)
        if snapshot_counts[target["spreadsheet_id"]] > 1:
            target_status[target["id"]].append("duplicate_runtime_snapshot")
    changes, blocked, skipped = [], [], []
    for event in exported.get("events", []):
        problems = []
        event_id, player_id = event.get("event_id", ""), event.get("player_id", "")
        candidate = candidates.get(event.get("revision_id"))
        target = next((target for target in config["targets"] if target["gender"] == event.get("gender")), None)
        if event_counts[event_id] != 1:
            problems.append("duplicate_event_id")
        if not re.fullmatch(r"KVL-P-\d{6}", player_id):
            problems.append("existing_player_id_required")
        if exported.get("status") != "reviewed_export_only" or event.get("status") != "reviewed_export_not_applied":
            problems.append("reviewed_event_required")
        if not candidate or candidate.get("review_status") != "reviewed_export_not_applied":
            problems.append("current_reviewed_source_revision_required")
        elif any(event.get(key) != candidate.get(key) for key in ("candidate_id", "source_id", "source_version", "source_url", "kind", "gender", "season", "observed")):
            problems.append("event_source_or_revision_content_mismatch")
        elif candidate.get("source_type") != "official_notice" or candidate.get("blocking_reasons"):
            problems.append("unblocked_official_source_required")
        if event.get("season") != config["season"]:
            problems.append("season_mismatch")
        effective = iso_date(event.get("effective_date"))
        if not effective:
            problems.append("reviewed_effective_date_required")
        elif effective > now.astimezone(ZoneInfo("Asia/Seoul")).date().isoformat():
            problems.append("future_effective_date_not_applied")
        if event.get("kind") == "roster_snapshot":
            problems.append("historical_roster_observation_not_a_current_membership_update")
        if journal.get("complete") is not True:
            problems.append("complete_applied_revision_journal_missing")
        related = [old for old in journal.get("events", []) if old.get("player_id") == player_id and old.get("source_id") == event.get("source_id")]
        if any(old.get("revision_id") != event.get("revision_id") for old in related):
            problems.append("source_revision_correction_requires_explicit_reconciliation")
        if not target:
            problems.append("verified_gender_target_missing")
        else:
            problems.extend(target_status[target["id"]])
        row = None
        if target and not target_status[target["id"]]:
            snapshot = snapshot_map[target["spreadsheet_id"]]
            id_index = ord(config["player_id_column"]) - ord("A")
            matches = [entry for entry in snapshot.get("rows", []) if entry["values"][id_index] == player_id]
            if not matches:
                problems.append("player_id_not_found_no_name_matching_or_id_filling")
            elif len(matches) != 1:
                problems.append("duplicate_player_id_in_target")
            else:
                row = matches[0]
                if row["manual_locked"]:
                    problems.append("row_manually_locked_or_protected")
                if any(row["formulas"]) or any(isinstance(value, str) and value.startswith("=") for value in row["values"]):
                    problems.append("formula_row_requires_manual_review")
                if row["values"][0] != event.get("team_as_published"):
                    problems.append("current_team_context_conflict")
        mapping = config.get("allowed_cell_mappings", {}).get(event.get("kind"))
        if mapping is None:
            problems.append("membership_status_mapping_not_verified")
        if problems:
            blocked.append({"event_id": event_id, "player_id": player_id,
                            "target_id": target["id"] if target else None,
                            "kind": event.get("kind"), "reasons": sorted(set(problems))})
            continue
        if any(old.get("event_id") == event_id and old.get("revision_id") == event.get("revision_id") for old in related):
            skipped.append({"event_id": event_id, "reason": "exact_revision_already_applied"})
            continue
        value = event.get("observed", {}).get(mapping["event_field"])
        if value in (None, "") or (isinstance(value, str) and value.startswith("=")):
            blocked.append({"event_id": event_id, "reasons": ["missing_or_formula_like_reviewed_value"]})
            continue
        updates = []
        for column, after in ((mapping["value_column"], value), (config["source_column"], event["source_url"])):
            index = ord(column) - ord("A")
            before = row["values"][index]
            if before != after:
                updates.append({"cell": f"{column}{row['row_number']}", "before": before, "after": after})
        changes.append({"event_id": event_id, "player_id": player_id, "target_id": target["id"],
                        "spreadsheet_id": target["spreadsheet_id"], "sheet_id": target["sheet_id"],
                        "sheet_title": target["sheet_title"], "row_number": row["row_number"],
                        "source_id": event["source_id"], "source_version": event["source_version"],
                        "revision_id": event["revision_id"], "effective_date": effective,
                        "expected_row_sha256": digest(row), "expected_snapshot_sha256": digest(snapshot),
                        "updates": updates, "status": "local_plan_only_not_applied"})
    cells = Counter((change["spreadsheet_id"], change["sheet_id"], update["cell"])
                    for change in changes for update in change["updates"])
    conflicted = [change for change in changes if any(cells[(change["spreadsheet_id"], change["sheet_id"], update["cell"])] > 1 for update in change["updates"])]
    for change in conflicted:
        blocked.append({"event_id": change["event_id"], "reasons": ["multiple_events_target_same_cell_requires_ordered_review"]})
    changes = [change for change in changes if change not in conflicted]
    return {"schema_version": 1, "configuration_status": config["configuration_status"],
            "runtime_connector": config.get("runtime_connector", "NOT_CONNECTED"),
            "writeback": config.get("writeback", "NOT_IMPLEMENTED"),
            "readback_activation": config.get("readback_activation", "NOT_CONNECTED"),
            "scope": "Local review plan only. The separate one-event writer requires explicit activation, fresh source/row/metadata readback and a verified application journal.",
            "target_readiness": target_status, "reviewed_event_count": len(exported.get("events", [])),
            "changes": changes, "blocked": blocked, "skipped": skipped,
            "no_update_reasons": ["no_reviewed_events"] if not exported.get("events") else []}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--targets", type=Path, default=DEFAULT / "master_targets.json")
    parser.add_argument("--events", type=Path, default=DEFAULT / "reviewed_events.json")
    parser.add_argument("--ledger", type=Path, default=DEFAULT / "official_candidates.json")
    parser.add_argument("--snapshots", type=Path)
    parser.add_argument("--journal", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT / "master_change_plan.json")
    args = parser.parse_args()
    snapshots = read(args.snapshots, {}).get("snapshots", []) if args.snapshots else []
    journal = read(args.journal, {}) if args.journal else {}
    plan = build_plan(read(args.targets), read(args.events, {"events": []}), read(args.ledger, {}), snapshots, journal)
    public_security_scan(plan)
    write(args.output, plan)
    print(f"MASTER_PLAN local_changes={len(plan['changes'])} blocked={len(plan['blocked'])} runtime={plan['runtime_connector']} writeback={plan['writeback']}")


if __name__ == "__main__":
    main()

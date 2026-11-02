#!/usr/bin/env python3
"""Export one verified MASTER receipt into the existing current-season roster.

This command only prepares local, allowlisted JSON files. It does not authenticate,
write to Sheets, push Git commits, change player identities, or edit past rosters.
"""
import argparse
import copy
from datetime import date, datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from zoneinfo import ZoneInfo

from kvl_player_updates import digest, public_security_scan


SEASON = "2026-27"
GENDERS = {"남": "men", "여": "women"}
JOURNAL_PATH = "data/player-updates/applied_master_events.json"
RECEIPT_KEYS = {
    "schema_version", "status", "season", "target_id", "gender", "team", "player_id",
    "event_id", "candidate_id", "revision_id", "source_id", "source_url", "kind",
    "expected_previous_value", "desired_value", "master_readback", "verified_at",
    "changed_cells", "journal_rows_added", "application_status", "target_value_before",
    "source_version", "effective_date", "plan_hash", "source_readback_at", "uncertain_write_response",
}
READBACK_KEYS = {"verified", "value", "player_id", "source_url", "row_number"}
PROVENANCE_KEYS = (
    "season", "target_id", "gender", "team", "player_id", "event_id", "candidate_id",
    "revision_id", "source_id", "source_version", "source_url", "kind",
    "effective_date", "expected_previous_value", "desired_value",
)
JOURNAL_EVENT_KEYS = set(PROVENANCE_KEYS) | {
    "roster_path", "roster_source_id", "verified_at", "source_readback_at", "plan_hash",
    "master_application_status", "website_value_changed", "website_source_changed",
}
POSITIONS = {"세터": "S", "아웃사이드히터": "OH", "아포짓": "OP",
             "아포짓스파이커": "OP", "미들블로커": "MB", "리베로": "L"}


def canonical_value(kind, value):
    if kind == "number_change":
        if isinstance(value, bool) or not re.fullmatch(r"[0-9]{1,3}", str(value)):
            raise ValueError("A reviewed integer jersey number is required")
        number = int(value)
        if number < 1:
            raise ValueError("A positive reviewed jersey number is required")
        return number
    if kind == "position_change":
        if not isinstance(value, str):
            raise ValueError("A reviewed position is required")
        position = re.sub(r"\s+", "", value).upper()
        position = POSITIONS.get(position, position)
        if position not in {"MB", "OH", "OP", "L", "S"}:
            raise ValueError("Unsupported reviewed position")
        return position
    raise ValueError("Only jersey-number or position changes are in scope")


def _timestamp(value):
    try:
        result = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        raise ValueError("An explicit verification timestamp is required") from None
    if result.tzinfo is None:
        raise ValueError("Verification timestamps must include a timezone")
    return result


def validate_receipt(receipt, now=None):
    """Accept the sanitized writer contract, never a raw row or unverified plan."""
    now = now or datetime.now(timezone.utc)
    if not isinstance(receipt, dict) or set(receipt) != RECEIPT_KEYS:
        raise ValueError("Unexpected or missing fields in the sanitized MASTER receipt")
    public_security_scan(receipt)
    if receipt["schema_version"] != 1 or receipt["status"] != "MASTER_READBACK_VERIFIED":
        raise ValueError("Verified MASTER readback is required")
    gender = receipt["gender"]
    if receipt["season"] != SEASON or gender not in GENDERS:
        raise ValueError("Only the configured 2026-27 current-season roster is in scope")
    if receipt["target_id"] != f"vleague-{GENDERS[gender]}-{SEASON}-player-master":
        raise ValueError("The verified target does not match the season and gender")
    if not isinstance(receipt["team"], str) or not receipt["team"].strip():
        raise ValueError("An explicit verified team is required")
    for key, pattern in (
        ("player_id", r"KVL-P-\d{6}"),
        ("event_id", r"KVL-PE-[a-f0-9]{24}"),
        ("candidate_id", r"KVL-PC-[a-f0-9]{24}"),
        ("revision_id", r"KVL-PCR-[a-f0-9]{64}"),
        ("source_version", r"[a-f0-9]{64}"),
        ("plan_hash", r"[a-f0-9]{64}"),
    ):
        if not isinstance(receipt[key], str) or not re.fullmatch(pattern, receipt[key]):
            raise ValueError(f"Invalid public {key}")
    match = re.fullmatch(r"KVL-SRC-KOVO-NOTICE-(\d+)", str(receipt["source_id"]))
    if not match or receipt["source_url"] != f"https://kovo.co.kr/news/official-notices/{match[1]}":
        raise ValueError("The official notice URL must match the reviewed source ID")
    if receipt["event_id"] != "KVL-PE-" + digest([receipt["player_id"], receipt["source_id"], "change"])[:24]:
        raise ValueError("The event ID must match the stable reviewed player/source identity")
    for key in ("verified_at", "source_readback_at"):
        if not 0 <= (now - _timestamp(receipt[key])).total_seconds() <= 24 * 3600:
            raise ValueError("Fresh source and MASTER readback are required")
    try:
        effective = date.fromisoformat(receipt["effective_date"])
    except (TypeError, ValueError):
        raise ValueError("An explicit effective date is required") from None
    if effective > now.astimezone(ZoneInfo("Asia/Seoul")).date():
        raise ValueError("Future changes cannot update the current roster")
    if receipt["application_status"] not in {"applied", "verified_existing", "already_applied"}:
        raise ValueError("A successful MASTER application or verification is required")
    if not isinstance(receipt["uncertain_write_response"], bool):
        raise ValueError("Invalid MASTER response status")
    for key in ("changed_cells", "journal_rows_added"):
        if type(receipt[key]) is not int or receipt[key] < 0:
            raise ValueError("Invalid MASTER receipt count")
    readback = receipt["master_readback"]
    if not isinstance(readback, dict) or set(readback) != READBACK_KEYS or readback["verified"] is not True:
        raise ValueError("Verified MASTER readback is required")
    if readback["player_id"] != receipt["player_id"] or readback["source_url"] != receipt["source_url"]:
        raise ValueError("MASTER readback identity or source does not match the receipt")
    if type(readback["row_number"]) is not int or readback["row_number"] <= 3:
        raise ValueError("Invalid verified MASTER row")
    desired = canonical_value(receipt["kind"], receipt["desired_value"])
    previous = canonical_value(receipt["kind"], receipt["expected_previous_value"])
    if canonical_value(receipt["kind"], readback["value"]) != desired:
        raise ValueError("MASTER readback value does not match the reviewed value")
    return desired, previous


def _json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def _sha(value):
    return hashlib.sha256(value).hexdigest() if value is not None else None


def _read(root, relative, optional=False):
    path = root / relative
    if path.resolve() != path or path.is_symlink():
        raise ValueError("Export paths must remain inside the checkout")
    if optional and not path.exists():
        return None, None
    raw = path.read_bytes()
    return raw, json.loads(raw)


def _validate_journal(journal):
    if not isinstance(journal, dict) or set(journal) != {"schema_version", "scope", "events"}:
        raise ValueError("Unexpected public application journal structure")
    if journal["schema_version"] != 1 or journal["scope"] != "verified-current-season-player-master-export":
        raise ValueError("Unsupported application journal scope")
    if not isinstance(journal["events"], list):
        raise ValueError("Application journal events must be a list")
    seen, seen_revisions = set(), set()
    for entry in journal["events"]:
        if not isinstance(entry, dict) or set(entry) != JOURNAL_EVENT_KEYS:
            raise ValueError("Unexpected application journal event fields")
        identity = (entry["player_id"], entry["source_id"], entry["revision_id"])
        if identity in seen_revisions:
            raise ValueError("Duplicate applied player/source revisions require reconciliation")
        seen_revisions.add(identity)
        if entry["event_id"] != "KVL-PE-" + digest([entry["player_id"], entry["source_id"], "change"])[:24]:
            raise ValueError("An applied event ID conflicts with its player/source identity")
        if entry["event_id"] in seen:
            raise ValueError("Duplicate applied event IDs require reconciliation")
        seen.add(entry["event_id"])
    public_security_scan(journal)


def export_from_receipt(root, receipt, apply=False, now=None):
    """Check/prepare exact local paths; an exact repeated receipt changes no bytes."""
    root = Path(root).resolve()
    desired, previous = validate_receipt(receipt, now)
    raw_files, rosters = {}, {}
    for gender, slug in GENDERS.items():
        relative = f"data/competitions/v-league-{slug}-{SEASON}/rosters.json"
        raw_files[relative], rosters[gender] = _read(root, relative)
    matches = [(gender, code, index, player)
               for gender, teams in rosters.items() for code, roster in teams.items()
               for index, player in enumerate(roster["players"])
               if player.get("playerId") == receipt["player_id"]]
    if len(matches) != 1:
        raise ValueError("The existing player ID must appear exactly once across current-season rosters")
    gender, code, index, player = matches[0]
    if gender != receipt["gender"]:
        raise ValueError("Current roster gender conflicts with the verified target")
    slug = GENDERS[gender]
    folder = f"data/competitions/v-league-{slug}-{SEASON}"
    relative = f"{folder}/rosters.json"
    _, competition = _read(root, f"{folder}/data.json")
    teams = [team for team in competition["participants"] if team["code"] == code]
    if len(teams) != 1 or teams[0]["name"] != receipt["team"]:
        raise ValueError("Current roster team conflicts with the verified team")
    roster = rosters[gender][code]
    if not roster.get("sourceId") or player.get("sourceId") != roster["sourceId"]:
        raise ValueError("Existing roster source linkage must be preserved")
    field = "number" if receipt["kind"] == "number_change" else "position"
    current = canonical_value(receipt["kind"], player.get(field))
    if current not in (previous, desired):
        raise ValueError("Current roster value conflicts with the reviewed before/after values")
    if "lastChangeSource" not in player or not isinstance(player["lastChangeSource"], str):
        raise ValueError("The existing roster last-change source field must be reviewed")
    current_source = player["lastChangeSource"]
    journal_raw, journal = _read(root, JOURNAL_PATH, optional=True)
    raw_files[JOURNAL_PATH] = journal_raw
    if journal is None:
        journal = {"schema_version": 1, "scope": "verified-current-season-player-master-export", "events": []}
    _validate_journal(journal)
    provenance = {key: receipt[key] for key in PROVENANCE_KEYS}
    provenance.update(expected_previous_value=previous, desired_value=desired)
    same = [entry for entry in journal["events"] if entry["event_id"] == receipt["event_id"]]
    related = [entry for entry in journal["events"] if entry["player_id"] == receipt["player_id"]
               and entry["source_id"] == receipt["source_id"]]
    if any(entry["revision_id"] != receipt["revision_id"] for entry in related):
        raise ValueError("A corrected source revision requires explicit reconciliation")
    updates = {}
    if same:
        entry = same[0]
        if any(entry[key] != value for key, value in provenance.items()):
            raise ValueError("An applied event conflicts with the current source or review")
        if entry["roster_path"] != relative or entry["roster_source_id"] != roster["sourceId"]:
            raise ValueError("An applied event conflicts with the current roster source")
        if current != desired or current_source != receipt["source_url"]:
            raise ValueError("An applied event has drifted; explicit reconciliation is required")
    else:
        if current != desired or current_source != receipt["source_url"]:
            candidate = copy.deepcopy(rosters[gender])
            candidate[code]["players"][index][field] = desired
            candidate[code]["players"][index]["lastChangeSource"] = receipt["source_url"]
            # Link the changed/current field to its verified notice. Registration
            # dates, registration sources, snapshot source IDs and player IDs
            # retain their original meaning and remain byte-for-byte values.
            updates[relative] = _json_bytes(candidate)
        journal["events"].append({**provenance, "roster_path": relative,
                                  "roster_source_id": roster["sourceId"],
                                  "verified_at": receipt["verified_at"],
                                  "source_readback_at": receipt["source_readback_at"],
                                  "plan_hash": receipt["plan_hash"],
                                  "master_application_status": receipt["application_status"],
                                  "website_value_changed": current != desired,
                                  "website_source_changed": current_source != receipt["source_url"]})
        _validate_journal(journal)
        updates[JOURNAL_PATH] = _json_bytes(journal)
    # A final read guards against checkout changes since validation. Only these
    # allowlisted files can be written; past competitions are never destinations.
    if apply:
        for path, original in raw_files.items():
            current_bytes = (root / path).read_bytes() if (root / path).exists() else None
            if current_bytes != original:
                raise ValueError("Local roster or journal changed during export; retry from fresh inputs")
        for path, content in updates.items():
            (root / path).parent.mkdir(parents=True, exist_ok=True)
            (root / path).write_bytes(content)
        for path, content in updates.items():
            if (root / path).read_bytes() != content:
                raise ValueError("Local export readback failed")
    return {"schema_version": 1, "status": "LOCAL_EXPORT_APPLIED" if apply else "LOCAL_EXPORT_CHECKED",
            "event_id": receipt["event_id"], "player_id": receipt["player_id"],
            "value_changes": int(relative in updates and current != desired),
            "metadata_changes": int(relative in updates and current_source != receipt["source_url"]),
            "provenance_changes": int(JOURNAL_PATH in updates),
            "changed_files": list(updates), "external_writes": False,
            "file_hashes": {path: {"before": _sha(raw), "after": _sha(updates.get(path, raw))}
                            for path, raw in raw_files.items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="Validate without writing (default)")
    mode.add_argument("--apply", action="store_true", help="Write only the verified local roster/journal")
    args = parser.parse_args()
    try:
        result = export_from_receipt(args.root, json.loads(args.receipt.read_text(encoding="utf-8")), args.apply)
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(1, f"MASTER_EXPORT_BLOCKED: {error}\n")
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()

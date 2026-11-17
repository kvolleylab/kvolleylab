#!/usr/bin/env python3
"""Publish a safe current V-League roster snapshot from normalized KOVO notices.

This script is deterministic and GitHub-only. It never invents Player_ID values.
Official additions may appear as unlinked roster entries; removals require an
applied high-confidence removal/transfer event. Review-held players remain in
the published roster until the underlying notice is resolved.
"""
from __future__ import annotations

import argparse
import csv
from copy import deepcopy
from datetime import date, datetime, timedelta
import json
import os
from pathlib import Path
import re
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = Path("data/team-rosters/v-league/index.json")
AUTOMATION_PATH = Path("data/team-rosters/v-league/automation.json")

TEAM_CODE_BY_NAME = {
    "대한항공": "KAL", "현대캐피탈": "HDC", "우리카드": "WRC",
    "KB손해보험": "KBI", "한국전력": "KEP", "OK저축은행": "OKF",
    "삼성화재": "SFB", "GS칼텍스": "GSC", "한국도로공사": "KEX",
    "현대건설": "HHC", "흥국생명": "HPS", "IBK기업은행": "IBK",
    "정관장": "RSP", "SOOP": "SOO",
}
TEAM_NAME_BY_CODE = {value: key for key, value in TEAM_CODE_BY_NAME.items()}
MEN_CODES = {"KAL", "HDC", "WRC", "KBI", "KEP", "OKF", "SFB"}
WOMEN_CODES = {"GSC", "KEX", "HHC", "HPS", "IBK", "RSP", "SOO"}
POSITION_MAP = {
    "세터": "S", "아웃사이드히터": "OH", "아포짓": "OP",
    "미들블로커": "MB", "리베로": "L",
}
INACTIVE_KINDS = {
    "registration_termination", "contract_termination", "release",
    "retirement", "voluntary_termination",
}
ANNOTATION_RE = re.compile(
    r"\s*\((수련선수|수련|수런선수|외국국적동포\s*선수)\)\s*",
    re.I,
)


class PublishError(RuntimeError):
    pass


def load_json(root: Path, rel: str | Path):
    path = root / rel
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PublishError(f"INVALID_JSON:{rel}") from exc


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def active_season(root: Path):
    index = load_json(root, INDEX_PATH)
    current = index.get("currentSeason")
    rows = [row for row in index.get("seasons", []) if row.get("season") == current]
    if len(rows) != 1:
        raise PublishError("CURRENT_SEASON_NOT_UNIQUE")
    return index, rows[0]


def clean_name(value):
    return ANNOTATION_RE.sub("", str(value or "")).strip()


def normalize_name(value):
    return re.sub(r"\s+", "", clean_name(value)).casefold()


def normalize_position(value):
    raw = re.sub(r"\s+", "", str(value or ""))
    return POSITION_MAP.get(raw, str(value or "").strip())


def source_set(row, projected=False):
    keys = ("registration_source", "last_change_source") if projected else (
        "registrationSource", "lastChangeSource"
    )
    return {str(row.get(key) or "").strip() for key in keys if row.get(key)}


def read_events(root: Path, rel: str):
    path = root / rel
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    except OSError as exc:
        raise PublishError("EVENT_LEDGER_UNREADABLE") from exc


def flatten_rosters(rosters, gender):
    rows = []
    for code, team in rosters.items():
        if code not in TEAM_NAME_BY_CODE:
            raise PublishError(f"UNKNOWN_TEAM_CODE:{code}")
        for player in team.get("players", []):
            rows.append({
                "gender": gender,
                "team": TEAM_NAME_BY_CODE[code],
                "code": code,
                "player": player,
            })
    return rows


def event_names(event):
    return {
        normalize_name(event.get("player_name")),
        normalize_name(event.get("registered_name")),
    } - {""}


def explicit_removal(existing, events, applied_ids):
    target = normalize_name(existing["player"].get("name"))
    team = existing["team"]
    gender = existing["gender"]
    for event in events:
        if event.get("event_id") not in applied_ids:
            continue
        if event.get("season") != "":
            # The current-season filter is applied by the caller's ledger path
            # and by projection applied IDs. Keep malformed season rows out.
            pass
        if event.get("confidence") != "high" or event.get("gender") != gender:
            continue
        if target not in event_names(event):
            continue
        kind = event.get("kind")
        if kind in INACTIVE_KINDS:
            return event
        if kind == "transfer" and event.get("from_team") == team and event.get("to_team") != team:
            return event
        if kind == "loan" and event.get("from_team") == team and (
            event.get("to_team") or event.get("destination")
        ):
            return event
    return None


def projection_latest_change(projection):
    values = [
        row.get("latest_change_date") for row in projection.get("active_players", [])
        if row.get("latest_change_date")
    ]
    return max(values) if values else ""


def cadence_decision(root: Path, now: datetime, event_name: str):
    _, season = active_season(root)
    config = load_json(root, AUTOMATION_PATH)
    cadence = config["cadence"]
    if event_name == "workflow_dispatch" and config.get("manual_dispatch_always_runs", True):
        return {"run": True, "mode": "manual", "interval_hours": 0}

    timezone = ZoneInfo(config.get("timezone", "Asia/Seoul"))
    local = now.astimezone(timezone)
    start = date.fromisoformat(season["startsOn"])
    end = date.fromisoformat(season["endsOn"])
    if season.get("frozen"):
        return {"run": False, "mode": "frozen", "interval_hours": 0}

    projection = load_json(root, season["projection"])
    latest_raw = projection_latest_change(projection)
    latest = date.fromisoformat(latest_raw) if latest_raw else None
    intensive_days = int(cadence.get("intensive_recent_change_days", 14))

    if start <= local.date() <= end:
        if latest and latest >= local.date() - timedelta(days=intensive_days):
            interval = int(cadence.get("intensive_hours", 1))
            mode = "intensive"
        else:
            interval = int(cadence.get("active_season_hours", 3))
            mode = "active"
        anchor = int(cadence.get("active_anchor_hour_kst", 8))
        should_run = interval == 1 or ((local.hour - anchor) % interval == 0)
    else:
        interval = int(cadence.get("offseason_hours", 24))
        mode = "offseason"
        should_run = local.hour == int(cadence.get("offseason_run_hour_kst", 8))

    return {
        "run": bool(should_run),
        "mode": mode,
        "interval_hours": interval,
        "local_time": local.isoformat(),
        "latest_change_date": latest_raw,
    }


def projected_match(projected, existing_rows, used_indexes):
    exact = [
        (idx, row) for idx, row in enumerate(existing_rows)
        if idx not in used_indexes
        and row["gender"] == projected.get("gender")
        and row["team"] == projected.get("team")
        and normalize_name(row["player"].get("name")) == normalize_name(projected.get("name"))
    ]
    if len(exact) == 1:
        return exact[0], "name"

    p_sources = source_set(projected, projected=True)
    by_number_source = [
        (idx, row) for idx, row in enumerate(existing_rows)
        if idx not in used_indexes
        and row["gender"] == projected.get("gender")
        and row["team"] == projected.get("team")
        and str(row["player"].get("number") or "") == str(projected.get("number") or "")
        and p_sources.intersection(source_set(row["player"]))
    ]
    if len(by_number_source) == 1:
        return by_number_source[0], "number+source"
    return None, ""


def new_player(projected, team_source_id):
    official = str(projected.get("name") or "").strip()
    name = clean_name(official)
    annotation = official.replace(name, "").strip() if name != official else ""
    source = projected.get("last_change_source") or projected.get("registration_source") or ""
    registration_date = projected.get("latest_change_date") or ""
    payload = {
        "number": int(projected["number"]) if str(projected.get("number") or "").isdigit() else projected.get("number"),
        "name": name,
        "en": "",
        "position": normalize_position(projected.get("position")),
        "heightCm": None,
        "dob": None,
        "nationality": None,
        "nationalityCode": None,
        "playerId": None,
        "volleybox": None,
        "sourceId": team_source_id,
        "registrationSource": projected.get("registration_source") or source,
        "lastChangeSource": source,
        "registrationDate": registration_date,
        "recordStatus": "official-notice-current-unlinked",
        "profileLinkStatus": "pending-player-id",
        "profileBasis": "kovo-official-notice-projection",
        "sourceNote": "KOVO 공식 공시 기준 현재 등록. Player_ID 및 상세 프로필 연결은 별도 검증 대기.",
    }
    if annotation:
        payload["registrationNote"] = annotation.strip("() ")
        payload["officialRegisteredName"] = official
    return payload


def updated_player(existing, projected):
    player = deepcopy(existing)
    number = projected.get("number")
    if str(number or "").isdigit():
        number = int(number)
    player["number"] = number
    position = normalize_position(projected.get("position"))
    if position:
        player["position"] = position
    if projected.get("registration_source"):
        player["registrationSource"] = projected["registration_source"]
    if projected.get("last_change_source"):
        player["lastChangeSource"] = projected["last_change_source"]
    player["currentProjectionStatus"] = projected.get("last_status") or ""
    return player


def validate_output(rosters):
    seen_ids = {}
    for code, team in rosters.items():
        numbers = {}
        for player in team.get("players", []):
            number = str(player.get("number") or "")
            if number:
                if number in numbers:
                    raise PublishError(f"DUPLICATE_TEAM_NUMBER:{code}:{number}")
                numbers[number] = player.get("name")
            player_id = player.get("playerId")
            if player_id:
                if player_id in seen_ids:
                    raise PublishError(f"DUPLICATE_PLAYER_ID:{player_id}")
                seen_ids[player_id] = code


def publish(root: Path, write: bool):
    index, season = active_season(root)
    if season.get("frozen"):
        raise PublishError("CURRENT_SEASON_FROZEN")

    projection = load_json(root, season["projection"])
    review = load_json(root, season["reviewQueue"])
    if projection.get("season") != season["season"]:
        raise PublishError("PROJECTION_SEASON_MISMATCH")

    men = load_json(root, season["men"])
    women = load_json(root, season["women"])
    existing_rows = flatten_rosters(men, "남") + flatten_rosters(women, "여")
    events = read_events(root, season["changeEvents"])
    applied_ids = set(projection.get("audit", {}).get("applied_event_ids", []))
    blocked_sources = {
        row.get("source_url") for row in review.get("blocked_events", []) if row.get("source_url")
    }

    output = {"남": deepcopy(men), "여": deepcopy(women)}
    for roster in output.values():
        for team in roster.values():
            team["players"] = []

    used = set()
    alias_matches = []
    additions = []
    holds = []
    removals = []
    team_rows = {}

    for projected in projection.get("active_players", []):
        team = projected.get("team")
        gender = projected.get("gender")
        code = TEAM_CODE_BY_NAME.get(team)
        if not code or gender not in ("남", "여"):
            raise PublishError(f"UNKNOWN_PROJECTED_TEAM:{gender}:{team}")
        target = output[gender]
        if code not in target:
            raise PublishError(f"TEAM_GENDER_MISMATCH:{gender}:{team}")

        matched, reason = projected_match(projected, existing_rows, used)
        if matched:
            idx, existing = matched
            used.add(idx)
            player = updated_player(existing["player"], projected)
            if reason == "number+source":
                alias_matches.append({
                    "team": team, "existing": existing["player"].get("name"),
                    "official": projected.get("name"), "number": projected.get("number"),
                })
        else:
            player = new_player(projected, target[code].get("sourceId", ""))
            additions.append({
                "gender": gender, "team": team, "name": player.get("name"),
                "number": player.get("number"), "source": player.get("lastChangeSource"),
            })
        target[code]["players"].append(player)
        team_rows.setdefault((gender, code), []).append(projected)

    for idx, existing in enumerate(existing_rows):
        if idx in used:
            continue
        player = existing["player"]
        player_sources = source_set(player)
        if player_sources.intersection(blocked_sources):
            held = deepcopy(player)
            held["recordStatus"] = "review-hold"
            note = str(held.get("sourceNote") or "").strip()
            suffix = " 최신 공시가 검토 대기 상태여서 마지막 검증 명단을 유지합니다."
            held["sourceNote"] = (note + suffix).strip()
            output[existing["gender"]][existing["code"]]["players"].append(held)
            holds.append({
                "gender": existing["gender"], "team": existing["team"],
                "name": player.get("name"), "reason": "blocked_notice_source",
            })
            continue

        event = explicit_removal(existing, events, applied_ids)
        if event:
            removals.append({
                "gender": existing["gender"], "team": existing["team"],
                "name": player.get("name"), "event_id": event.get("event_id"),
                "kind": event.get("kind"), "source": event.get("source_url"),
            })
            continue

        held = deepcopy(player)
        held["recordStatus"] = "review-hold"
        note = str(held.get("sourceNote") or "").strip()
        suffix = " Projection에서 제외됐지만 high-confidence 비활성 이벤트가 없어 마지막 검증 명단을 유지합니다."
        held["sourceNote"] = (note + suffix).strip()
        output[existing["gender"]][existing["code"]]["players"].append(held)
        holds.append({
            "gender": existing["gender"], "team": existing["team"],
            "name": player.get("name"), "reason": "missing_explicit_removal",
        })

    for gender, roster in output.items():
        for code, team in roster.items():
            rows = team_rows.get((gender, code), [])
            if rows:
                dates = [row.get("latest_change_date") for row in rows if row.get("latest_change_date")]
                latest_row = max(rows, key=lambda row: row.get("latest_change_date") or "")
                if dates:
                    team["asOf"] = max(dates)
                source = latest_row.get("last_change_source") or latest_row.get("registration_source")
                if source:
                    team["sourceUrl"] = source
                    team["sourceLinkLabel"] = "KOVO 공식 공시"
            team["players"].sort(key=lambda row: (
                int(row.get("number")) if str(row.get("number") or "").isdigit() else 9999,
                str(row.get("name") or ""),
            ))

    validate_output(output["남"])
    validate_output(output["여"])

    report = {
        "schema_version": 1,
        "season": season["season"],
        "projection_count": len(projection.get("active_players", [])),
        "published_count": sum(len(team.get("players", [])) for roster in output.values() for team in roster.values()),
        "matched_existing": len(used),
        "official_additions_unlinked": len(additions),
        "explicit_removals": len(removals),
        "review_holds": len(holds),
        "alias_matches": len(alias_matches),
        "additions": additions,
        "removals": removals,
        "holds": holds,
        "alias_match_details": alias_matches,
        "team_counts": {
            code: len(team.get("players", []))
            for roster in output.values() for code, team in roster.items()
        },
        "changed_files": [],
    }

    if write:
        if write_json(root / season["men"], output["남"]):
            report["changed_files"].append(season["men"])
        if write_json(root / season["women"], output["여"]):
            report["changed_files"].append(season["women"])
    return report


def write_github_output(path, values):
    if not path:
        return
    with Path(path).open("a", encoding="utf-8") as handle:
        for key, value in values.items():
            if isinstance(value, bool):
                value = "true" if value else "false"
            handle.write(f"{key}={value}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(ROOT))
    parser.add_argument("--check-cadence", action="store_true")
    parser.add_argument("--publish", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report")
    parser.add_argument("--github-output")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    if args.check_cadence:
        decision = cadence_decision(
            root,
            datetime.now(tz=ZoneInfo("UTC")),
            os.environ.get("GITHUB_EVENT_NAME", ""),
        )
        write_github_output(args.github_output, decision)
        print(json.dumps(decision, ensure_ascii=False))
        return

    if not (args.publish or args.dry_run):
        parser.error("choose --check-cadence, --publish or --dry-run")

    report = publish(root, write=args.publish)
    if args.report:
        write_json(Path(args.report), report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

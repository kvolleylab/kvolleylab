#!/usr/bin/env python3
"""Stage or apply validated KOVO regular-season updates to the existing KVL data.

Default operation is read-only. Publishing additionally requires trusted main,
explicit runtime activation, a live source read and authenticated MASTER
read/write/readback. The Google Sheet remains the authoritative editable MASTER.
Only the two V-league data.json files and this collector's identity state may
change. No player, roster, template, Cup or international data is written.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlsplit

from kovo_vleague_source import collect_season, SourceError, validate_request_url
from kovo_vleague_standings import calculate_standings, validate_final_match, StandingsError
from kovo_vleague_master import build_update_plan, apply_update_plan, SheetsClient

SEASON = "2026-27"
DIVISIONS = {"MALE": "men", "FEMALE": "women"}
EXPECTED_GAMES = 126
STATE_PATH = "data/kovo/vleague/2026-27/state_v1.json"
DATA_PATHS = {g: f"data/competitions/v-league-{v}-{SEASON}/data.json" for g, v in DIVISIONS.items()}
ALLOWED_OUTPUTS = set(DATA_PATHS.values()) | {STATE_PATH}
KST = timezone(timedelta(hours=9))


class UpdateError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise UpdateError(message)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def compact_name(value):
    return re.sub(r"\s+", "", str(value))


def record_round(match):
    m = re.fullmatch(r"([1-6])라운드", match.get("stage", ""))
    return int(m.group(1)) if m else None


def expected_source(record):
    require(record.get("season_id") == "023" and record.get("match_type") == "001"
            and record.get("phase_id") == "201" and record.get("gender") in DIVISIONS,
            "Unexpected source competition")
    require(type(record.get("number")) is int and 1 <= record["number"] <= 252,
            "Invalid official game number")
    require(record.get("source_key") == f"023:001:{record['gender']}:{record['number']}",
            "Official identity does not match source fields")
    validate_request_url(record["source_url"])
    require(record.get("status") in ("scheduled", "live", "final", "postponed", "cancelled"),
            "Unknown official match state")


def validate_snapshot(snapshot):
    require(snapshot.get("schema_version") == 1 and snapshot.get("season") == SEASON
            and snapshot.get("source") == "KOVO_PUBLIC_STAT_API", "Untrusted source snapshot")
    coverage = snapshot.get("coverage", {})
    require(coverage.get("kind") == "season" and coverage.get("complete") is True
            and set(coverage.get("genders", [])) == set(DIVISIONS), "Incomplete source coverage")
    records = snapshot.get("matches")
    require(isinstance(records, list) and len(records) == 252, "Expected 252 regular-season matches")
    require(len({m.get("source_key") for m in records}) == len(records), "Duplicate official game identity")
    for gender in DIVISIONS:
        require(sum(m.get("gender") == gender for m in records) == EXPECTED_GAMES,
                "Incomplete division schedule")
    for record in records:
        expected_source(record)
    try:
        stamp = datetime.fromisoformat(snapshot["fetched_at"].replace("Z", "+00:00"))
        require(stamp.tzinfo is not None, "Source timestamp needs a timezone")
    except (KeyError, ValueError, TypeError) as exc:
        raise UpdateError("Invalid source observation timestamp") from exc
    ranks = snapshot.get("official_standings", [])
    require(len(ranks) == 2 and {r.get("gender") for r in ranks} == set(DIVISIONS),
            "Official standings snapshots are incomplete")
    return records


def join_records(originals, snapshot, previous_state=None):
    """Map all games by proven provider identity; first mapping uses round+teams.

    Official game numbers alternate genders and are NOT the numeric suffix of
    KVL's per-gender MatchID. Exact round/home/away is unique in this season;
    dates are allowed to change without changing the permanent local ID.
    """
    records = validate_snapshot(snapshot)
    previous = previous_state or {}
    require(not previous or previous.get("season") == SEASON, "State belongs to another season")
    prior_links = previous.get("links", {})
    links, matched, used, provider_teams = {}, [], set(), {g: {} for g in DIVISIONS}
    for gender, data in originals.items():
        games = [m for m in data.get("matches", []) if record_round(m)]
        require(len(games) == EXPECTED_GAMES and len({m["id"] for m in games}) == EXPECTED_GAMES,
                "Local regular-season schedule is incomplete or duplicated")
        require(len(data.get("participants", [])) == 7, "Expected seven local teams")
    for source in records:
        gender = source["gender"]
        data = originals[gender]
        names = {p["name"]: p["code"] for p in data["participants"]}
        require(len(names) == 7, "Local team names are ambiguous")
        codes = {}
        for side in ("home", "away"):
            official = source[side]
            require(official["name"] in names, "Official team name needs a reviewed mapping")
            codes[side] = names[official["name"]]
            prior_code = provider_teams[gender].setdefault(official["provider_code"], codes[side])
            require(prior_code == codes[side], "Official team identity collision")
            require(sum(code == codes[side] for code in provider_teams[gender].values()) == 1,
                    "One local team has multiple official provider identities")
        candidates = [m for m in data["matches"] if record_round(m) == source["round"]
                      and m.get("home", {}).get("code") == codes["home"]
                      and m.get("away", {}).get("code") == codes["away"]]
        require(len(candidates) == 1, "Match join is missing or ambiguous; review required")
        local = candidates[0]
        require(local["id"] not in used, "Two official games map to one local MatchID")
        used.add(local["id"])
        link = {"match_id": local["id"], "gender": gender, "round": source["round"],
                "home_code": codes["home"], "away_code": codes["away"],
                "home_provider_code": source["home"]["provider_code"],
                "away_provider_code": source["away"]["provider_code"]}
        old_link = prior_links.get(source["source_key"])
        require(old_link is None or old_link == link, "Persisted official/local game identity changed")
        links[source["source_key"]] = link
        record = {"match_id": local["id"], "competition_slug": f"v-league-{DIVISIONS[gender]}-{SEASON}",
                  "gender": gender, "round": source["round"], "date": source["date"], "time": source["time"],
                  "venue": source["venue"], "home_code": codes["home"], "away_code": codes["away"],
                  "home_name": source["home"]["name"], "away_name": source["away"]["name"],
                  "status": source["status"], "source_key": source["source_key"],
                  "source_url": source["source_url"], "source_verified": True, "score": None}
        if source["status"] == "final":
            record["score"] = {**source["sets_won"], "sets": deepcopy(source["sets"])}
            validate_final_match({"id": local["id"], "stage": local["stage"], "status": "final",
                                  "home": {"code": codes["home"]}, "away": {"code": codes["away"]},
                                  "score": record["score"]})
        if local.get("score") is not None:
            require(source["status"] == "final" and local["score"] == record["score"],
                    "Final result correction or regression requires review")
            require(local["date"] == record["date"] and local.get("time") == record["time"],
                    "Final match schedule correction requires review")
        if local.get("status") in ("cancelled", "postponed"):
            require(local["status"] == record["status"], "Administrative state change requires review")
        if local.get("manualOverride") or local.get("automationLocked"):
            require(local.get("score") == record["score"] and local["date"] == record["date"]
                    and local.get("time") == record["time"]
                    and local.get("status", "final" if local.get("score") else "scheduled") == record["status"]
                    and compact_name(local.get("venueLabel")) == compact_name(record["venue"]),
                    "Manually locked match changed")
        if compact_name(local.get("venueLabel", "")) == compact_name(record["venue"]):
            record["venue"] = local.get("venueLabel", record["venue"])
        matched.append(record)
    require(set(prior_links).issubset(links), "Official source removed a previously linked game")
    return matched, links, provider_teams


def prepare_update(originals, snapshot, previous_state=None, master_values=None):
    matched, links, provider_teams = join_records(originals, snapshot, previous_state)
    by_id = {r["match_id"]: r for r in matched}
    candidates, totals = {}, {}
    stamp = datetime.fromisoformat(snapshot["fetched_at"].replace("Z", "+00:00")).astimezone(KST)
    kst_label = stamp.strftime("%Y-%m-%d %H:%M KST")
    for gender, original in originals.items():
        candidate = deepcopy(original)
        for match in candidate["matches"]:
            record = by_id.get(match["id"])
            if record is None:
                continue  # postseason and unrelated records are outside this adapter
            before = deepcopy(match)
            match.update(date=record["date"], time=record["time"], venueLabel=record["venue"],
                         localTimeLabel=f"한국 현지 {record['time']} KST", status=record["status"])
            # Never expose partial live scores as final scores.
            if record["status"] == "final":
                match["score"] = deepcopy(record["score"])
                match["scoreVerification"] = True
            match["officialSourceKey"] = record["source_key"]
            match["source"] = record["source_url"]
            if match != before:
                match["updatedAt"] = snapshot["fetched_at"]
        official = deepcopy(next(x for x in snapshot["official_standings"] if x["gender"] == gender))
        validate_request_url(official["source_url"])
        participant_names = {p["code"]: p["name"] for p in candidate["participants"]}
        for row in official["rows"]:
            provider_code = row["provider_code"]
            require(provider_code in provider_teams[gender], "Official rank team is not in the season schedule")
            row["team_code"] = provider_teams[gender][provider_code]
            require(isinstance(row.get("name"), str)
                    and compact_name(row["name"]) == compact_name(participant_names[row["team_code"]]),
                    "Official rank team name conflicts with its schedule/local identity")
        calculated = calculate_standings(candidate["participants"], candidate["matches"], official_ranks=official)
        require(calculated.get("review_required") is False, "Standings need review; publication stopped")
        candidate["standings"] = {"rows": calculated["rows"]}
        completed = len(calculated["counted_match_ids"])
        any_started = completed > 0 or any(r["status"] == "live" for r in matched if r["gender"] == gender)
        if any_started:
            candidate["status"] = "active"  # regular-season completion does not crown the season champion
            phase = "정규리그 종료 · 포스트시즌 확인 중" if completed == EXPECTED_GAMES else "정규리그 진행 중"
            candidate["stageLabel"] = ("남자부" if gender == "MALE" else "여자부") + " · " + phase
            candidate["standingsStatus"] = "정규리그 종료" if completed == EXPECTED_GAMES else "정규리그 진행 중"
            candidate["activeOverviewNote"] = "KOVO 공식 경기 결과와 순위를 대조해 반영합니다."
        candidate["standingsRule"] = "KOVO 공식 순위 · 종료 경기의 승점·승패·세트 및 점수 합계 대조"
        candidate["scheduleNote"] = "KOVO 공식 정규리그 일정·종료 경기 결과 기준 · 경기 시각은 한국시간(KST)입니다."
        # Compare meaningful content first so unchanged polls never churn timestamps or commits.
        for key in ("standingsNote", "updatedAt", "automation"):
            candidate.pop(key, None)
        previous_comparable = deepcopy(original)
        for key in ("standingsNote", "updatedAt", "automation"):
            previous_comparable.pop(key, None)
        if candidate == previous_comparable and original.get("automation", {}).get("version") == 1:
            candidate = deepcopy(original)
        else:
            candidate["standingsNote"] = f"KOVO 공식 결과·순위 대조 · {completed}/{EXPECTED_GAMES}경기 종료 · {kst_label} 반영"
            candidate["updatedAt"] = snapshot["fetched_at"]
            candidate["automation"] = {"version": 1, "source": "KOVO_PUBLIC_STAT_API",
                                       "standingsSource": official["source_url"],
                                       "regularSeasonOnly": True, "completedMatches": completed}
        candidates[DATA_PATHS[gender]] = candidate
        totals[gender] = {"matched": EXPECTED_GAMES, "completed": completed,
                          "standings_verified": True,
                          "changed_matches": sum(a != b for a, b in zip(original["matches"], candidate["matches"]))}
    previous_state = previous_state or {}
    state = {"schema_version": 1, "season": SEASON, "links": links}
    if state == {k: previous_state.get(k) for k in state}:
        state = deepcopy(previous_state)
    else:
        state["updated_at"] = snapshot["fetched_at"]
    candidates[STATE_PATH] = state
    originals_by_path = {DATA_PATHS[g]: value for g, value in originals.items()}
    originals_by_path[STATE_PATH] = previous_state or None
    changes = [path for path, candidate in candidates.items() if candidate != originals_by_path[path]]
    master_plan = build_update_plan(master_values, matched) if master_values is not None else None
    report = {"schema_version": 1, "season": SEASON, "checked_at": snapshot["fetched_at"],
              "status": "READY" if master_plan is not None else "SOURCE_AND_SITE_VERIFIED_MASTER_NOT_CHECKED",
              "mode": "STAGING_ONLY", "source_coverage": 252, "divisions": totals,
              "changed_files": changes, "master_checked": master_plan is not None,
              "master_changed_cells": len(master_plan["changes"]) if master_plan else None,
              "production_written": False, "master_written": False}
    return {"candidates": candidates, "expected": originals_by_path, "changed_files": changes,
            "matched": matched, "master_plan": master_plan, "report": report}


def check_local_preconditions(root, plan):
    for relative, expected in plan["expected"].items():
        require(relative in ALLOWED_OUTPUTS, "Disallowed output path")
        path = Path(root) / relative
        current = read_json(path) if path.exists() else None
        require(current == expected, "Local data changed during collection; rebuild from latest main")


def quality_audit_gate(root, plan):
    """Reuse the existing KVL Quality Audit's pure match/standings checks."""
    from quality_audit import checks
    results = []
    for relative in DATA_PATHS.values():
        config = read_json(Path(root) / Path(relative).with_name("config.json"))
        data = plan["candidates"][relative]
        results += [checks.matches(config, data, relative), checks.standings(config, data, relative)]
    require(all(check["outcome"] == "PASS" for check in results), "KVL Quality Audit rejected candidate data")
    return [{"id": check["id"], "outcome": check["outcome"], "count": check["count"]} for check in results]


def write_candidates(root, plan):
    check_local_preconditions(root, plan)
    for relative in plan["changed_files"]:
        require(relative in ALLOWED_OUTPUTS, "Output path is not allowlisted")
        write_json(Path(root) / relative, plan["candidates"][relative])


def ensure_publish_context(root):
    require(os.environ.get("KVL_VLEAGUE_PUBLISH_APPROVED") == "true", "Automatic publishing is not activated")
    require(os.environ.get("GITHUB_REF") == "refs/heads/main"
            and os.environ.get("GITHUB_REPOSITORY") == "kvolleylab/kvolleylab", "Publishing requires trusted KVL main")
    require(os.environ.get("GITHUB_EVENT_NAME") in ("schedule", "workflow_dispatch"), "Unapproved publishing event")
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    remote = subprocess.check_output(["git", "ls-remote", "origin", "refs/heads/main"], cwd=root, text=True).split()[0]
    require(head == remote, "Main advanced before MASTER write; retry on current main")
    require(not subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=no"], cwd=root, text=True),
            "Tracked working files changed before publishing")


def report_markdown(report):
    lines = ["# V-리그 자동 업데이트 v1", "", f"상태: **{report['status']}**", "",
             f"공식 일정: {report.get('source_coverage', 0)}경기", "",
             "| 부문 | 연결 경기 | 종료 경기 | 순위 대조 |", "|---|---:|---:|---|"]
    for gender, values in report.get("divisions", {}).items():
        lines.append(f"| {'남자' if gender == 'MALE' else '여자'} | {values['matched']} | {values['completed']} | 통과 |")
    lines += ["", f"MASTER 확인: {'완료' if report.get('master_checked') else '실행환경 인증 미연결 / 미검증'}",
              f"MASTER 변경 셀: {report.get('master_changed_cells', '미확인')}",
              f"운영 파일 쓰기: {report.get('production_written', False)}",
              f"실행 모드: {report.get('mode', 'STAGING_ONLY')}"]
    if report.get("error_code"):
        lines += ["", "검증 또는 연결 실패로 적용을 중단했습니다. 기존 운영 데이터를 유지합니다.",
                  f"오류 종류: `{report['error_code']}`"]
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--source-file", type=Path, help="Read-only snapshot replay; disallowed when publishing")
    parser.add_argument("--master-snapshot", type=Path, help="Private local snapshot for read-only end-to-end validation")
    parser.add_argument("--check-master", action="store_true", help="Read MASTER using the execution environment's credentials")
    parser.add_argument("--publish", action="store_true", help="Authenticated MASTER update followed by allowlisted local data write")
    args = parser.parse_args()
    root = args.root.resolve()
    report = {"schema_version": 1, "season": SEASON, "status": "FAILED", "mode": "STAGING_ONLY",
              "production_written": False, "master_written": False}
    args.output.mkdir(parents=True, exist_ok=True)
    try:
        require(not args.output.resolve().is_relative_to(root / "data"), "Report output must be outside production data")
        if args.publish:
            require(args.source_file is None and args.master_snapshot is None, "Publishing cannot replay file snapshots")
            ensure_publish_context(root)
        originals = {gender: read_json(root / relative) for gender, relative in DATA_PATHS.items()}
        previous = read_json(root / STATE_PATH) if (root / STATE_PATH).exists() else None
        snapshot = read_json(args.source_file) if args.source_file else collect_season()
        values, client = None, None
        if args.master_snapshot:
            raw = read_json(args.master_snapshot)
            values = raw.get("values") if isinstance(raw, dict) else raw
        elif args.check_master or args.publish:
            client = SheetsClient.from_environment()
            values = client.read_values()
        plan = prepare_update(originals, snapshot, previous, values)
        report = plan["report"]
        report["quality_audit"] = quality_audit_gate(root, plan)
        if args.publish:
            ensure_publish_context(root)
            check_local_preconditions(root, plan)
            require(plan["master_plan"] is not None, "MASTER must be checked before site update")
            receipt = apply_update_plan(client, plan["master_plan"])
            report["master_written"] = bool(plan["master_plan"]["changes"])
            report["master_readback_verified"] = True
            # A later Git push failure leaves MASTER ahead; next run is idempotent.
            write_candidates(root, plan)
            report["production_written"] = bool(plan["changed_files"])
            report["mode"] = "MASTER_VERIFIED_LOCAL_DATA_READY"
        else:
            for relative, candidate in plan["candidates"].items():
                write_json(args.output / "candidate" / relative, candidate)
        (args.output / "changed-files.txt").write_text("\n".join(plan["changed_files"]) + "\n", encoding="utf-8")
        write_json(args.output / "report.json", report)
        (args.output / "report.md").write_text(report_markdown(report), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False))
        return 0
    except Exception as exc:
        # Do not put raw MASTER values, authentication exceptions or HTTP bodies
        # into public artifacts. Full source/parser errors remain local exceptions.
        report.update(status="FAILED", error_code=type(exc).__name__)
        write_json(args.output / "report.json", report)
        (args.output / "report.md").write_text(report_markdown(report), encoding="utf-8")
        print(f"V-league update stopped: {type(exc).__name__}", file=sys.stderr)
        if isinstance(exc, (UpdateError, SourceError, StandingsError)):
            print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

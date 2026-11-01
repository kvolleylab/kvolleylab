#!/usr/bin/env python3
"""Stage or apply validated KOVO season updates through the championship.

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
from tempfile import TemporaryDirectory
from urllib.parse import parse_qs, urlsplit

from kovo_vleague_source import collect_season, SourceError, validate_request_url, POSTSEASON_PHASES
from kovo_vleague_standings import calculate_standings, validate_final_match, StandingsError
from kovo_vleague_master import build_update_plan, apply_update_plan, SheetsClient
from kvl_competition_lifecycle import LifecycleError, require_update_window, postseason_status

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
            and record.get("phase_id") in {"201", *POSTSEASON_PHASES} and record.get("gender") in DIVISIONS,
            "Unexpected source competition")
    require(type(record.get("number")) is int and 1 <= record["number"] <= 1000,
            "Invalid official game number")
    require(record.get("source_key") == f"023:001:{record['gender']}:{record['number']}",
            "Official identity does not match source fields")
    validate_request_url(record["source_url"])
    params = parse_qs(urlsplit(record["source_url"]).query)
    require(urlsplit(record["source_url"]).path == "/stat/game-schedule"
            and params.get("leagueCode") == [record["phase_id"]]
            and params.get("gender") == ["1" if record["gender"] == "MALE" else "2"],
            "Source URL conflicts with game phase/gender")
    if record["phase_id"] in POSTSEASON_PHASES:
        phase = POSTSEASON_PHASES[record["phase_id"]]
        require(record.get("fixture_ready") is True and record.get("stage") == phase["stage"]
                and type(record.get("series_game")) is int
                and 1 <= record["series_game"] <= phase["max_games"],
                "Unresolved or invalid postseason fixture")
    require(record.get("status") in ("scheduled", "live", "final", "postponed", "cancelled"),
            "Unknown official match state")


def validate_snapshot(snapshot):
    require(snapshot.get("schema_version") == 1 and snapshot.get("season") == SEASON
            and snapshot.get("source") == "KOVO_PUBLIC_STAT_API", "Untrusted source snapshot")
    coverage = snapshot.get("coverage", {})
    require(coverage.get("kind") == "season" and coverage.get("complete") is True
            and coverage.get("phase") == "through_championship"
            and set(coverage.get("genders", [])) == set(DIVISIONS), "Incomplete source coverage")
    records = snapshot.get("matches")
    require(isinstance(records, list) and 252 <= len(records) <= 270,
            "Expected 252 regular-season matches and at most 18 postseason fixtures")
    require(len({m.get("source_key") for m in records}) == len(records), "Duplicate official game identity")
    for gender in DIVISIONS:
        require(sum(m.get("gender") == gender and m.get("phase_id") == "201" for m in records) == EXPECTED_GAMES,
                "Incomplete division schedule")
        for phase_id, phase in POSTSEASON_PHASES.items():
            legs = [r.get("series_game") for r in records if r.get("gender") == gender
                    and r.get("phase_id") == phase_id]
            require(len(legs) <= phase["max_games"] and len(set(legs)) == len(legs),
                    "Duplicate or excessive postseason series games")
    post_coverage = coverage.get("postseason", [])
    require(isinstance(post_coverage, list) and len(post_coverage) == 6
            and {(c.get("gender"), c.get("phase_id")) for c in post_coverage}
            == {(g, p) for g in DIVISIONS for p in POSTSEASON_PHASES}
            and all(c.get("complete") is True for c in post_coverage),
            "Postseason source coverage is incomplete")
    pending = snapshot.get("pending_matches", [])
    require(isinstance(pending, list) and len(pending) <= 18, "Invalid pending postseason list")
    for record in pending:
        require(isinstance(record, dict) and record.get("phase_id") in POSTSEASON_PHASES
                and record.get("fixture_ready") is False and record.get("status") == "scheduled"
                and record.get("sets") is None and record.get("sets_won") == {"home": 0, "away": 0},
                "Unresolved postseason fixture has result data")
        expected_source({**record, "fixture_ready": True})
    all_records = records + pending
    require(len(all_records) <= 270 and len({r.get("source_key") for r in all_records}) == len(all_records)
            and len({r.get("number") for r in all_records}) == len(all_records),
            "Duplicate or excessive season identities")
    for coverage_row in post_coverage:
        observed = [r for r in all_records if r.get("gender") == coverage_row["gender"]
                    and r.get("phase_id") == coverage_row["phase_id"]]
        require(type(coverage_row.get("received")) is int and coverage_row["received"] == len(observed)
                and {r.get("series_game") for r in observed} == set(range(1, len(observed) + 1)),
                "Postseason coverage does not match observed series games")
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


def _series_clinch(records, gender, phase_id):
    """Validate published series identities and final order before any omission."""
    games = sorted((r for r in records if r["gender"] == gender and r.get("phase_id") == phase_id),
                   key=lambda r: r["series_game"])
    pairs = {frozenset((r["home_code"], r["away_code"])) for r in games}
    require(len(pairs) <= 1, "Official postseason series has inconsistent teams")
    finals = [r for r in games if r["status"] == "final"]
    require([r["series_game"] for r in finals] == list(range(1, len(finals) + 1)),
            "Official postseason results are missing an earlier series game")
    target = {"204": 1, "202": 2, "203": 3}[phase_id]
    wins, clinched_at = {}, None
    for record in finals:
        require(clinched_at is None, "Official result exists after a postseason series was won")
        code = record["home_code"] if record["score"]["home"] > record["score"]["away"] else record["away_code"]
        wins[code] = wins.get(code, 0) + 1
        if wins[code] == target:
            clinched_at = record["series_game"]
    return clinched_at


def _mapped_official_standings(data, snapshot, gender, provider_teams):
    official = deepcopy(next(x for x in snapshot["official_standings"] if x["gender"] == gender))
    validate_request_url(official["source_url"])
    participant_names = {p["code"]: p["name"] for p in data["participants"]}
    for row in official["rows"]:
        provider_code = row["provider_code"]
        require(provider_code in provider_teams[gender], "Official rank team is not in the season schedule")
        row["team_code"] = provider_teams[gender][provider_code]
        require(isinstance(row.get("name"), str)
                and compact_name(row["name"]) == compact_name(participant_names[row["team_code"]]),
                "Official rank team name conflicts with its schedule/local identity")
    return official


def _unrequired_qpo_evidence(originals, snapshot, matched, provider_teams):
    """Only final, fully reconciled regular standings can waive a published QPO."""
    evidence = {}
    for gender, original in originals.items():
        regular = [r for r in matched if r["gender"] == gender and r.get("phase_id", "201") == "201"]
        if len(regular) != EXPECTED_GAMES or any(r["status"] != "final" for r in regular):
            continue
        by_id = {r["match_id"]: r for r in regular}
        fixtures = [deepcopy(m) for m in original["matches"] if record_round(m)]
        for match in fixtures:
            record = by_id[match["id"]]
            match.update(status="final", score=deepcopy(record["score"]),
                         date=record["date"], time=record["time"])
        official = _mapped_official_standings(original, snapshot, gender, provider_teams)
        calculated = calculate_standings(original["participants"], fixtures, official_ranks=official)
        require(calculated.get("review_required") is False and len(calculated["counted_match_ids"]) == EXPECTED_GAMES,
                "QPO waiver requires reconciled final regular standings")
        rows = {row["rank"]: row for row in calculated["rows"]}
        require(set(rows) == set(range(1, 8)), "QPO waiver requires all seven official ranks")
        third, fourth = rows[3], rows[4]
        if third["points"] - fourth["points"] > 3:
            evidence[gender] = {"regular_completed": EXPECTED_GAMES, "source_url": official["source_url"],
                                "third": {"code": third["team"]["code"], "points": third["points"]},
                                "fourth": {"code": fourth["team"]["code"], "points": fourth["points"]},
                                "official_standings_verified": True}
    return evidence


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
    for source in sorted(records, key=lambda r: r["phase_id"] != "201"):
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
        post = POSTSEASON_PHASES.get(source["phase_id"])
        if post:
            local_id = f"VL2627-{'M' if gender == 'MALE' else 'W'}-{post['code']}-{source['series_game']:03d}"
            candidates = [m for m in data["matches"] if m.get("id") == local_id]
            require(len(candidates) <= 1, "Duplicate local postseason identity")
            local = candidates[0] if candidates else {"id": local_id, "stage": post["stage"]}
            require(local.get("stage") == post["stage"], "Local postseason stage conflicts with identity")
            if candidates:
                require(local.get("seriesGame") == source["series_game"]
                        and local.get("home", {}).get("code") == codes["home"]
                        and local.get("away", {}).get("code") == codes["away"],
                        "Previously published postseason fixture identity changed")
                require(local.get("officialSourceKey") in (None, source["source_key"]),
                        "Previously published postseason provider identity changed")
        else:
            candidates = [m for m in data["matches"] if record_round(m) == source["round"]
                          and m.get("home", {}).get("code") == codes["home"]
                          and m.get("away", {}).get("code") == codes["away"]]
            require(len(candidates) == 1, "Match join is missing or ambiguous; review required")
            local = candidates[0]
        require(local["id"] not in used, "Two official games map to one local MatchID")
        used.add(local["id"])
        game_round = source["series_game"] if post else source["round"]
        link = {"match_id": local["id"], "gender": gender, "round": game_round,
                "home_code": codes["home"], "away_code": codes["away"],
                "home_provider_code": source["home"]["provider_code"],
                "away_provider_code": source["away"]["provider_code"]}
        if post:
            link.update(phase_id=source["phase_id"], series_game=source["series_game"])
        old_link = prior_links.get(source["source_key"])
        require(old_link is None or old_link == link, "Persisted official/local game identity changed")
        links[source["source_key"]] = link
        record = {"match_id": local["id"], "competition_slug": f"v-league-{DIVISIONS[gender]}-{SEASON}",
                  "gender": gender, "round": game_round, "date": source["date"], "time": source["time"],
                  "venue": source["venue"], "home_code": codes["home"], "away_code": codes["away"],
                  "home_name": source["home"]["name"], "away_name": source["away"]["name"],
                  "status": source["status"], "source_key": source["source_key"],
                  "source_url": source["source_url"], "source_verified": True, "score": None}
        if post:
            record.update(phase_id=source["phase_id"], stage=post["stage"], series_game=source["series_game"])
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
    qpo_waivers = _unrequired_qpo_evidence(originals, snapshot, matched, provider_teams)
    clinches = {(g, p): _series_clinch(matched, g, p) for g in DIVISIONS for p in POSTSEASON_PHASES}
    kept = []
    for record in matched:
        phase_id, gender = record.get("phase_id"), record["gender"]
        clinched_at = clinches.get((gender, phase_id))
        waiver = qpo_waivers.get(gender) if phase_id == "204" else None
        if waiver is not None or clinched_at is not None and record.get("series_game", 0) > clinched_at:
            require(record["status"] == "scheduled", "Unneeded series leg has an unexpected official state")
            if waiver is not None:
                require(record["home_code"] == waiver["third"]["code"]
                        and record["away_code"] == waiver["fourth"]["code"],
                        "Unrequired QPO teams conflict with final third/fourth place")
            existing = next((m for m in originals[gender]["matches"] if m.get("id") == record["match_id"]), None)
            if existing is None:
                # Do not create an unused MASTER row that was never published.
                links.pop(record["source_key"])
                continue
            require(not (existing.get("manualOverride") or existing.get("automationLocked")),
                    "Manually locked postseason match changed")
            record.update(status="not_required", notRequired=True,
                          non_play_reason="qualification_gap" if waiver is not None else "series_clinched",
                          date=existing["date"], time=existing["time"], venue=existing["venueLabel"])
            if waiver is not None:
                record["qualification_evidence"] = deepcopy(waiver)
        kept.append(record)
    matched = kept
    # KOVO removes unneeded later legs after a series is clinched. Keep previously
    # published identities and explicitly record 'not required', never a fake
    # cancellation or a score. The same winning-series proof guards MASTER.
    for key in set(prior_links) - set(links):
        old = prior_links[key]
        phase_id, gender = old.get("phase_id"), old.get("gender")
        require(phase_id in POSTSEASON_PHASES and gender in DIVISIONS,
                "Official source removed a previously linked game")
        clinched_at = clinches[(gender, phase_id)]
        waiver = qpo_waivers.get(gender) if phase_id == "204" else None
        locals_ = [m for m in originals[gender]["matches"] if m.get("id") == old.get("match_id")]
        require((waiver is not None or clinched_at is not None and old.get("series_game", 0) > clinched_at)
                and len(locals_) == 1 and locals_[0].get("score") is None
                and locals_[0].get("status", "scheduled") in ("scheduled", "not_required"),
                "Official source removed an unresolved postseason game")
        local = locals_[0]
        if waiver is not None:
            require(old["home_code"] == waiver["third"]["code"]
                    and old["away_code"] == waiver["fourth"]["code"],
                    "Unrequired QPO teams conflict with final third/fourth place")
        require(not (local.get("manualOverride") or local.get("automationLocked")),
                "Manually locked postseason match changed")
        names = {p["code"]: p["name"] for p in originals[gender]["participants"]}
        require(local.get("officialSourceKey") == key
                and local.get("home", {}).get("code") == old["home_code"]
                and local.get("away", {}).get("code") == old["away_code"],
                "Unneeded series leg changed its published source identity")
        restored = {"match_id": local["id"], "competition_slug": f"v-league-{DIVISIONS[gender]}-{SEASON}",
                        "gender": gender, "round": old["series_game"], "series_game": old["series_game"],
                        "phase_id": phase_id, "stage": POSTSEASON_PHASES[phase_id]["stage"],
                        "date": local["date"], "time": local["time"], "venue": local["venueLabel"],
                        "home_code": old["home_code"], "away_code": old["away_code"],
                        "home_name": names[old["home_code"]], "away_name": names[old["away_code"]],
                        "status": "not_required", "notRequired": True,
                        "non_play_reason": "qualification_gap" if waiver is not None else "series_clinched",
                        "source_key": key, "source_url": local["source"], "source_verified": True, "score": None}
        if waiver is not None:
            restored["qualification_evidence"] = deepcopy(waiver)
        matched.append(restored)
        links[key] = deepcopy(old)
    return matched, links, provider_teams


def prepare_update(originals, snapshot, previous_state=None, master_values=None):
    matched, links, provider_teams = join_records(originals, snapshot, previous_state)
    by_id = {r["match_id"]: r for r in matched}
    candidates, totals = {}, {}
    stamp = datetime.fromisoformat(snapshot["fetched_at"].replace("Z", "+00:00")).astimezone(KST)
    kst_label = stamp.strftime("%Y-%m-%d %H:%M KST")
    for gender, original in originals.items():
        candidate = deepcopy(original)
        existing_ids = {m["id"] for m in candidate["matches"]}
        for record in matched:
            if record["gender"] != gender or record["match_id"] in existing_ids:
                continue
            require(record.get("phase_id") in POSTSEASON_PHASES, "New regular-season identity is forbidden")
            candidate["matches"].append({
                "id": record["match_id"], "stage": record["stage"], "pool": "",
                "round": f"{record['series_game']}차전", "seriesGame": record["series_game"],
                "home": {"code": record["home_code"], "name": record["home_name"]},
                "away": {"code": record["away_code"], "name": record["away_name"]},
            })
            existing_ids.add(record["match_id"])
        for match in candidate["matches"]:
            record = by_id.get(match["id"])
            if record is None:
                continue
            before = deepcopy(match)
            match.update(date=record["date"], time=record["time"], venueLabel=record["venue"],
                         localTimeLabel=f"한국 현지 {record['time']} KST", status=record["status"])
            # Never expose partial live scores as final scores.
            if record["status"] == "final":
                match["score"] = deepcopy(record["score"])
                match["scoreVerification"] = True
            if record["status"] == "not_required":
                match.update(notRequired=True, non_play_reason=record["non_play_reason"])
            match["officialSourceKey"] = record["source_key"]
            match["source"] = record["source_url"]
            if match != before:
                match["updatedAt"] = snapshot["fetched_at"]
        official = _mapped_official_standings(candidate, snapshot, gender, provider_teams)
        calculated = calculate_standings(candidate["participants"], candidate["matches"], official_ranks=official)
        require(calculated.get("review_required") is False, "Standings need review; publication stopped")
        candidate["standings"] = {"rows": calculated["rows"]}
        completed = len(calculated["counted_match_ids"])
        regular_complete = completed == EXPECTED_GAMES
        candidate["regularSeasonComplete"] = regular_complete
        postseason = postseason_status(candidate, regular_complete)
        post_summary = {k: postseason[k] for k in ("matched", "completed", "complete", "champion")}
        any_started = completed > 0 or any(r["status"] == "live" for r in matched if r["gender"] == gender)
        if any_started:
            candidate["status"] = "completed" if postseason["complete"] else "active"
            phase = ("챔피언결정전 종료" if postseason["complete"] else
                     "포스트시즌 진행 중" if regular_complete and postseason["matched"] else
                     "정규리그 종료 · 포스트시즌 대진 확인 중" if regular_complete else "정규리그 진행 중")
            candidate["stageLabel"] = ("남자부" if gender == "MALE" else "여자부") + " · " + phase
            candidate["standingsStatus"] = "정규리그 종료" if completed == EXPECTED_GAMES else "정규리그 진행 중"
            candidate["activeOverviewNote"] = "KOVO 공식 경기 결과와 순위를 대조해 반영합니다."
        candidate["standingsRule"] = "KOVO 공식 순위 · 종료 경기의 승점·승패·세트 및 점수 합계 대조"
        candidate["scheduleNote"] = "KOVO 공식 정규리그·준플레이오프·플레이오프·챔피언결정전 일정 및 결과 기준 · 경기 시각은 한국시간(KST)입니다."
        # Compare meaningful content first so unchanged polls never churn timestamps or commits.
        for key in ("standingsNote", "updatedAt", "automation"):
            candidate.pop(key, None)
        previous_comparable = deepcopy(original)
        for key in ("standingsNote", "updatedAt", "automation"):
            previous_comparable.pop(key, None)
        if candidate == previous_comparable and original.get("automation", {}).get("version") == 2:
            candidate = deepcopy(original)
        else:
            candidate["standingsNote"] = f"KOVO 공식 결과·순위 대조 · {completed}/{EXPECTED_GAMES}경기 종료 · {kst_label} 반영"
            candidate["updatedAt"] = snapshot["fetched_at"]
            candidate["automation"] = {"version": 2, "source": "KOVO_PUBLIC_STAT_API",
                                       "standingsSource": official["source_url"],
                                       "regularSeasonOnly": False, "completedMatches": completed,
                                       "postseason": post_summary}
        candidates[DATA_PATHS[gender]] = candidate
        totals[gender] = {"matched": EXPECTED_GAMES, "completed": completed,
                          "standings_verified": True, "postseason": post_summary,
                          "pending_postseason_fixtures": sum(r["gender"] == gender for r in snapshot.get("pending_matches", [])),
                          "changed_matches": sum(next((m for m in original["matches"] if m["id"] == after["id"]), None) != after
                                                 for after in candidate["matches"])}
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
              "mode": "STAGING_ONLY", "source_coverage": len(snapshot["matches"]), "divisions": totals,
              "postseason_source_coverage": deepcopy(snapshot["coverage"]["postseason"]),
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


def publication_gate(plan):
    """Check exact candidate bytes using the existing public-export contract.

    This runtime receipt describes automated official-source reconciliation and
    output security checks. It neither claims human review nor updates the
    persistent manual-review manifest or reclassifies preserved legacy fields.
    """
    from quality_audit.checks import security
    from quality_audit.export_gate import validate_changed

    require(set(plan["candidates"]) == ALLOWED_OUTPUTS,
            "Publication requires exactly the three allowlisted JSON outputs")
    paths = sorted(ALLOWED_OUTPUTS)
    source_ids = {}
    for gender, relative in DATA_PATHS.items():
        source_ids[relative] = sorted({r["source_url"] for r in plan["matched"] if r["gender"] == gender}
                                      | {c["source_url"] for c in plan["report"].get("postseason_source_coverage", []) if c["gender"] == gender}
                                      | {plan["candidates"][relative]["automation"]["standingsSource"]})
    source_ids[STATE_PATH] = sorted({r["source_url"] for r in plan["matched"]})
    for sources in source_ids.values():
        require(bool(sources), "Publication evidence is missing official sources")
        for source_url in sources:
            validate_request_url(source_url)

    checked_at = datetime.now(timezone.utc).isoformat()
    entries = {}
    with TemporaryDirectory(prefix="kvl-vleague-publication-") as temporary:
        root = Path(temporary)
        for relative in paths:
            file = root / relative
            write_json(file, plan["candidates"][relative])
            entries[relative] = {
                "access_level": "PUBLIC", "record_status": "VERIFIED",
                "source_ids": source_ids[relative], "verified_at": checked_at,
                "checked_at": checked_at, "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
                "verification_method": "automated official-season schedule/final-score and standings reconciliation; public-export security checks",
                "verification_scope": "Regular season and official postseason fixtures/results through the championship; preserved metadata retains its existing provenance.",
            }
        failures = validate_changed(root, paths, entries)
        security_results = security(root, paths)
    passed = not failures and security_results[0]["outcome"] == "PASS"
    return {"check": "PUBLIC_VERIFIED_AUTOMATED_EXPORT", "status": "PASS" if passed else "FAIL",
            "checked_at": checked_at, "file_count": len(paths), "rejected_file_count": len(failures),
            # Never attach rejected payloads, sensitive finding pointers or a
            # VERIFIED assertion for files that failed the nested-record scan.
            "files": entries if passed else {},
            "security": [{"id": item["id"], "outcome": item["outcome"], "count": item["count"]}
                         for item in security_results]}


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


class WindowCheckedSheets:
    """Recheck real time immediately before a MASTER mutation, after rereading."""

    def __init__(self, client, root, candidates):
        self.client, self.root, self.candidates = client, root, candidates
        self.spreadsheet_id = client.spreadsheet_id

    def read_values(self):
        return self.client.read_values()

    def batch_update_values(self, updates):
        require_update_window(self.root, candidates=self.candidates)
        return self.client.batch_update_values(updates)


def report_markdown(report):
    lines = ["# V-리그 자동 업데이트 v1", "", f"상태: **{report['status']}**", "",
             f"공식 일정: {report.get('source_coverage', 0)}경기", "",
             "| 부문 | 정규 연결 | 정규 종료 | 포스트시즌 연결/종료 | 순위 대조 |", "|---|---:|---:|---:|---|"]
    for gender, values in report.get("divisions", {}).items():
        post = values.get("postseason", {})
        lines.append(f"| {'남자' if gender == 'MALE' else '여자'} | {values['matched']} | {values['completed']} | {post.get('matched', 0)}/{post.get('completed', 0)} | 통과 |")
    if report.get("postseason_source_coverage"):
        waiting = sum(c.get("fixture_state") == "not_published" for c in report["postseason_source_coverage"])
        lines += ["", f"포스트시즌 공식 경로 확인: {len(report['postseason_source_coverage'])}개 · 아직 개별 편성 전: {waiting}개",
                  "공식 개별 대진·시간·장소가 확인된 경기만 MASTER에 등록합니다. 빈 응답은 대회 종료를 뜻하지 않습니다."]
    lines += ["", f"MASTER 확인: {'완료' if report.get('master_checked') else '실행환경 인증 미연결 / 미검증'}",
              f"MASTER 변경 셀: {report.get('master_changed_cells', '미확인')}",
              f"운영 파일 쓰기: {report.get('production_written', False)}",
              f"실행 모드: {report.get('mode', 'STAGING_ONLY')}"]
    if report.get("lifecycle"):
        lifecycle = report["lifecycle"]
        lines += ["", f"자동 갱신 단계: {lifecycle['phase']}",
                  f"갱신 마감(미포함): {lifecycle['ends_at']}",
                  "갱신 마감은 운영상 중단 시각이며, 공식 대회 종료 또는 기록 보관 완료를 의미하지 않습니다."]
    if report.get("error_code"):
        lines += ["", "검증 또는 연결 실패로 후속 적용을 중단했습니다. MASTER·운영 파일·배포 상태를 재대조해야 합니다.",
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
            report["lifecycle"] = require_update_window(root)
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
        report["publication_gate"] = publication_gate(plan)
        require(report["publication_gate"]["status"] == "PASS", "KVL public-export security rejected candidate data")
        if args.publish:
            ensure_publish_context(root)
            report["lifecycle"] = require_update_window(root, candidates=plan["candidates"])
            check_local_preconditions(root, plan)
            require(plan["master_plan"] is not None, "MASTER must be checked before site update")
            receipt = apply_update_plan(WindowCheckedSheets(client, root, plan["candidates"]), plan["master_plan"])
            report["master_written"] = bool(plan["master_plan"]["changes"])
            report["master_readback_verified"] = True
            # A later Git push failure leaves MASTER ahead; next run is idempotent.
            report["lifecycle"] = require_update_window(root, candidates=plan["candidates"])
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
        if isinstance(exc, LifecycleError):
            report["lifecycle_reason_code"] = str(exc)
        write_json(args.output / "report.json", report)
        (args.output / "report.md").write_text(report_markdown(report), encoding="utf-8")
        print(f"V-league update stopped: {type(exc).__name__}", file=sys.stderr)
        if isinstance(exc, (UpdateError, SourceError, StandingsError, LifecycleError)):
            print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

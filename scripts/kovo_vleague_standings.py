#!/usr/bin/env python3
"""Strict, match-only standings for the 2026-27 KOVO regular season.

This module has no network or write operations. It consumes Competition Engine
matches with an explicit ``status: final`` and complete per-set points. Historical
scores without an explicit final status must be reviewed by the caller first.

The current season's complete official tie-break text was NOT VERIFIED during
implementation. The candidate points/wins/set quotient/point quotient order is
therefore never published by default. A matching official KOVO standings snapshot
is authoritative for rank independently of that missing rule text: every played
team and all eight raw totals must reconcile before its ranks can be adopted.
The caller must also verify the snapshot's season/gender and map provider IDs to
local team codes. Unplayed teams retain their participant order and a null rank.
"""
from __future__ import annotations

from copy import deepcopy
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction
import re
from urllib.parse import parse_qs, urlparse


REGULAR_STAGES = frozenset(f"{number}라운드" for number in range(1, 7))
POSTSEASON_STAGES = frozenset(("준플레이오프", "플레이오프", "챔피언결정전"))
CANDIDATE_ORDER = ("points", "wins", "setRatio", "pointRatio")
OFFICIAL_TOTAL_FIELDS = {
    "played": "games", "wins": "wins", "losses": "losses", "points": "points",
    "sets_won": "setWins", "sets_lost": "setLosses",
    "points_won": "pointsFor", "points_lost": "pointsAgainst",
}


class StandingsError(ValueError):
    """Input cannot be safely used to replace existing published data."""


def _require(condition, message):
    if not condition:
        raise StandingsError(message)


def _nonnegative_integer(value, label):
    _require(type(value) is int and value >= 0, f"{label}: nonnegative integer required")
    return value


def _team_code(team):
    _require(isinstance(team, dict), "team object required")
    value = team.get("code")
    _require(isinstance(value, str) and re.fullmatch(r"[A-Z0-9]{2,10}", value),
             "valid local team code required")
    return value


def validate_final_match(match):
    """Return a new normalized score dict, or raise ``StandingsError``.

    The input is {status:'final',home:{code},away:{code},
    score:{home:3,away:0,sets:[{home:25,away:20}, ...]}}. It must end exactly
    when a team wins its third set. A completed set stops at 25 (15 in set 5),
    or at the first two-point margin after deuce. Administrative/forfeit scores
    require a separate reviewed policy and are not silently inferred here.
    """
    _require(isinstance(match, dict), "match object required")
    _require(match.get("status") == "final", "explicit final status required")
    home_code, away_code = _team_code(match.get("home")), _team_code(match.get("away"))
    _require(home_code != away_code, "same team on both sides")
    score = match.get("score")
    _require(isinstance(score, dict), "final score object required")
    home = _nonnegative_integer(score.get("home"), "home set wins")
    away = _nonnegative_integer(score.get("away"), "away set wins")
    _require(max(home, away) == 3 and min(home, away) <= 2, "invalid final match score")
    sets = score.get("sets")
    _require(isinstance(sets, list) and len(sets) == home + away,
             "complete per-set points required for every final set")
    _require(3 <= len(sets) <= 5, "final requires three to five sets")
    won = {"home": 0, "away": 0}
    normalized = []
    for index, value in enumerate(sets):
        _require(isinstance(value, dict), "set score object required")
        if "complete" in value:
            _require(value["complete"] is True, "final contains an incomplete set")
        h = _nonnegative_integer(value.get("home"), f"set {index + 1} home points")
        a = _nonnegative_integer(value.get("away"), f"set {index + 1} away points")
        top, bottom = max(h, a), min(h, a)
        target = 15 if index == 4 else 25
        legal = ((top == target and bottom <= target - 2)
                 or (top > target and top - bottom == 2))
        _require(legal, f"set {index + 1}: impossible final points {h}-{a}")
        won["home" if h > a else "away"] += 1
        if index < len(sets) - 1:
            _require(max(won.values()) < 3, "extra set after match already ended")
        normalized.append({"home": h, "away": a})
    _require((won["home"], won["away"]) == (home, away),
             "set winners disagree with final match score")
    return {"home": home, "away": away, "sets": normalized}


def _display_ratio(won, lost):
    if lost == 0:
        return "MAX" if won else "-"
    return format((Decimal(won) / Decimal(lost)).quantize(
        Decimal("0.001"), rounding=ROUND_HALF_UP), ".3f")


def _ratio_key(won, lost):
    # The first tuple member puts infinity above every finite ratio. Fractions
    # prevent equal rounded displays from falsely becoming mathematical ties.
    return (1, Fraction(0)) if lost == 0 and won else (0, Fraction(won, lost or 1))


def _sort_key(row):
    return (row["points"], row["wins"],
            _ratio_key(row["setWins"], row["setLosses"]),
            _ratio_key(row["pointsFor"], row["pointsAgainst"]))


def _official_source_url(snapshot):
    value = snapshot.get("source_url")
    _require(isinstance(value, str), "official standings source_url required")
    parsed = urlparse(value)
    _require(parsed.scheme == "https" and parsed.netloc == "user-api.kovo.co.kr"
             and parsed.path == "/stat/league/team-rank" and not parsed.fragment,
             "unapproved official standings source")
    query = parse_qs(parsed.query)
    _require(query.get("seasonCode") == ["023"] and query.get("leagueCode") == ["201"]
             and query.get("round") == ["0"] and query.get("gender") in (["1"], ["2"]),
             "official standings must cover the 2026-27 whole regular season")
    return value


def _reconcile_official(snapshot, played_rows):
    _require(isinstance(snapshot, dict), "official_ranks must be a sourced snapshot object")
    source_url = _official_source_url(snapshot)
    official_rows = snapshot.get("rows")
    _require(isinstance(official_rows, list), "official standings rows required")
    derived = {row["team"]["code"]: row for row in played_rows}
    observed = {}
    for official in official_rows:
        _require(isinstance(official, dict), "official standing row required")
        code = official.get("team_code")
        _require(isinstance(code, str) and code in derived,
                 "official standing contains an unknown or unplayed team")
        _require(code not in observed, "duplicate official standing team")
        for official_key, local_key in OFFICIAL_TOTAL_FIELDS.items():
            total = _nonnegative_integer(official.get(official_key), f"{code} {official_key}")
            _require(total == derived[code][local_key],
                     f"official standings mismatch for {code} {official_key}")
        rank = _nonnegative_integer(official.get("rank"), f"{code} rank")
        _require(rank > 0, "played team must have a positive official rank")
        observed[code] = rank
    _require(set(observed) == set(derived), "official standings played-team coverage mismatch")
    _require(set(observed.values()) == set(range(1, len(derived) + 1)),
             "official standings ranks must be unique and consecutive for played teams")
    return observed, source_url


def calculate_standings(participants, matches, *, rules_verified=False, official_ranks=None):
    """Compute metrics and optionally reconcile authoritative official ranks.

    ``official_ranks`` accepts the collector's gender snapshot after local-ID
    mapping: {source_url, rows:[{team_code,rank,played,wins,losses,points,
    sets_won,sets_lost,points_won,points_lost}]}. Every played team must occur
    exactly once. All raw totals must agree; source lag/conflict raises an error.

    ``rules_verified`` is an internal caller assertion, not a CLI permission or
    a user override. The caller must have archived and verified the current KOVO
    points/wins/set-quotient/point-quotient rule before setting it. It does not
    assert an unimplemented later tie-break. Without an official snapshot,
    unresolved equal teams share the same rank and require review. Without
    either source authority or verified rules, metrics are returned with null
    ranks and review_required. No alphabetical ordering breaks a ranking tie.
    """
    _require(type(rules_verified) is bool, "rules_verified must be boolean")
    _require(isinstance(participants, list) and 2 <= len(participants) <= 7,
             "two to seven participants required")
    _require(isinstance(matches, list), "matches list required")
    stats = {}
    names = set()
    for participant in participants:
        code = _team_code(participant)
        _require(code not in stats, "duplicate participant code")
        name = participant.get("name")
        _require(isinstance(name, str) and name.strip(), "participant name required")
        _require(name not in names, "duplicate participant name")
        names.add(name)
        team = {key: deepcopy(participant[key]) for key in ("code", "name", "fullName", "en")
                if key in participant}
        stats[code] = {"rank": None, "team": team, "poolId": "LEAGUE",
                       "games": 0, "wins": 0, "losses": 0, "points": 0,
                       "setWins": 0, "setLosses": 0, "pointsFor": 0, "pointsAgainst": 0,
                       "setRatio": "-", "pointRatio": "-", "statusLabel": "경기 전"}
    ids, identities, source_keys = set(), set(), set()
    counted, excluded, issues = [], [], []
    for match in matches:
        _require(isinstance(match, dict), "match object required")
        match_id = match.get("id")
        _require(isinstance(match_id, str) and match_id, "match id required")
        _require(match_id not in ids, "duplicate match id")
        ids.add(match_id)
        stage = match.get("stage")
        _require(isinstance(stage, str), "match stage required")
        if stage not in REGULAR_STAGES:
            excluded.append(match_id)
            if stage not in POSTSEASON_STAGES:
                issues.append({"code": "UNRECOGNIZED_STAGE", "match_id": match_id,
                               "stage": stage})
            continue
        home_code = _team_code(match.get("home"))
        away_code = _team_code(match.get("away"))
        _require(home_code in stats and away_code in stats, "match team missing from participants")
        _require(home_code != away_code, "same team on both sides")
        day = match.get("date")
        _require(isinstance(day, str) and re.fullmatch(r"20\d{2}-\d{2}-\d{2}", day),
                 "valid match date required")
        try:
            date.fromisoformat(day)
        except ValueError as exc:
            raise StandingsError("invalid match date") from exc
        identity = (day, frozenset((home_code, away_code)))
        _require(identity not in identities, "duplicate match identity")
        identities.add(identity)
        source_key = match.get("source_key")
        if source_key is not None:
            _require(isinstance(source_key, str) and source_key, "invalid source match key")
            _require(source_key not in source_keys, "duplicate source match identity")
            source_keys.add(source_key)
        status = match.get("status")
        if status is None:
            _require(match.get("score") is None, "legacy score lacks explicit final status")
            status = "scheduled"
        _require(status in ("scheduled", "live", "final", "postponed", "cancelled"),
                 "unsupported match status")
        if status != "final":
            if status != "live":
                _require(match.get("score") is None, "non-playing match contains a score")
            excluded.append(match_id)
            continue
        score = validate_final_match(match)
        home, away = stats[home_code], stats[away_code]
        for current, side, other in ((home, "home", "away"),
                                     (away, "away", "home")):
            current["games"] += 1
            current["setWins"] += score[side]
            current["setLosses"] += score[other]
            current["pointsFor"] += sum(value[side] for value in score["sets"])
            current["pointsAgainst"] += sum(value[other] for value in score["sets"])
        winner, loser = (home, away) if score["home"] == 3 else (away, home)
        winner["wins"] += 1
        loser["losses"] += 1
        five_sets = len(score["sets"]) == 5
        winner["points"] += 2 if five_sets else 3
        loser["points"] += 1 if five_sets else 0
        counted.append(match_id)
    rows = list(stats.values())
    for row in rows:
        row["setRatio"] = _display_ratio(row["setWins"], row["setLosses"])
        row["pointRatio"] = _display_ratio(row["pointsFor"], row["pointsAgainst"])
        if row["games"]:
            row["statusLabel"] = "순위 확인 필요"
    played_rows = [row for row in rows if row["games"]]
    unplayed_rows = [row for row in rows if not row["games"]]
    provenance = {
        "basis": "METRICS_ONLY",
        "formal_rules_status": "CALLER_VERIFIED" if rules_verified else "NOT_VERIFIED",
        "formal_rules_source_url": None,
        "formal_rules_query_outcome": ("VERIFIED_BY_CALLER" if rules_verified
                                       else "CURRENT_SEASON_RULE_TEXT_NOT_VERIFIED"),
        "candidate_order": list(CANDIDATE_ORDER),
        "official_standings_source_url": None,
        "note": "현 시즌 동률 규정 원문 미확인: 공식 순위와 모든 원시 합계가 일치할 때만 공식 순위 채택",
    }
    if official_ranks is not None:
        ranks, source_url = _reconcile_official(official_ranks, played_rows)
        for row in played_rows:
            row["rank"] = ranks[row["team"]["code"]]
            row["statusLabel"] = f'{row["rank"]}위'
        played_rows.sort(key=lambda row: row["rank"])
        rows = played_rows + unplayed_rows
        provenance.update({"basis": "OFFICIAL_SNAPSHOT_RECONCILED",
                           "official_standings_source_url": source_url,
                           "official_observed_at": official_ranks.get("observed_at")})
    elif rules_verified:
        played_rows.sort(key=_sort_key, reverse=True)
        index = 0
        while index < len(played_rows):
            end = index + 1
            while end < len(played_rows) and _sort_key(played_rows[index]) == _sort_key(played_rows[end]):
                end += 1
            tied = end - index > 1
            for row in played_rows[index:end]:
                row["rank"] = index + 1
                row["statusLabel"] = "동률 · 공식 순위 확인 필요" if tied else f'{index + 1}위'
            if tied:
                issues.append({"code": "UNRESOLVED_TIE",
                               "team_codes": [row["team"]["code"] for row in played_rows[index:end]]})
            index = end
        rows = played_rows + unplayed_rows
        provenance["basis"] = "VERIFIED_PRIMARY_CRITERIA_ONLY"
    elif counted:
        issues.append({"code": "FORMAL_RULES_NOT_VERIFIED",
                       "message": "공식 순위 스냅샷 대조 또는 현 시즌 순위 규정 확인 필요"})
    return {"rows": rows, "review_required": bool(issues), "issues": issues,
            "counted_match_ids": counted, "excluded_match_ids": excluded,
            "rule_provenance": provenance}

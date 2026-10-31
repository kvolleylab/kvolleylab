#!/usr/bin/env python3
"""Read KOVO's public 2026-27 regular-season schedule and official team totals.

These routes and query parameters were observed in the public KOVO web app
(`/assets/index-D20G7jIw.js`) and verified without authentication on 2026-10-31.
The full schedule response contains per-set points; the homepage's small
`/mains/games/schedules` response is deliberately NOT used for season coverage.

This module only returns a validated source snapshot. It does not write MASTER,
competition data, player records, Git commits, or deployment state.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date, datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


API_ORIGIN = "https://user-api.kovo.co.kr"
PAGE_SIZE = 200
MAX_BYTES = 2_000_000
MAX_PAGES = 10
SEASONS = {
    "2026-27": {
        "season_id": "023", "match_type": "001", "phase_id": "201",
        "expected_matches_per_gender": 126, "rounds": 6, "teams": 7,
        "start_year": 2026, "end_year": 2027,
    }
}
GENDERS = {"MALE": "1", "FEMALE": "2"}


class SourceError(ValueError):
    """The official source is incomplete, changed, or inconsistent; do not apply."""


def require(condition, message):
    if not condition:
        raise SourceError(message)


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def integer(value, label, *, minimum=0, maximum=100000):
    require(type(value) is int and minimum <= value <= maximum,
            f"Invalid integer field: {label}")
    return value


def text_value(value, label, *, maximum=100):
    require(isinstance(value, str) and 0 < len(value) <= maximum
            and not any(ord(c) < 32 for c in value), f"Invalid text field: {label}")
    return value


def valid_date(value, label):
    require(isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value),
            f"Invalid date field: {label}")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise SourceError(f"Invalid date field: {label}") from exc


def clock_value(value, label, *, empty=False):
    if empty and value in (None, ""):
        return None
    require(isinstance(value, str)
            and re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?", value),
            f"Invalid time field: {label}")
    return value[:5]


def validate_request_url(url):
    """Only the public routes/queries actually used for this season are allowed."""
    parts = urlsplit(url)
    require(parts.scheme == "https" and parts.hostname == "user-api.kovo.co.kr"
            and parts.port is None and not parts.username and not parts.password
            and not parts.fragment, "Unexpected source URL")
    pairs = parse_qsl(parts.query, keep_blank_values=True)
    require(len(pairs) == len(dict(pairs)), "Duplicate source query keys")
    params = dict(pairs)
    require(params.get("seasonCode") == "023" and params.get("leagueCode") == "201"
            and params.get("gender") in ("1", "2"), "Unapproved season/phase/gender")
    if parts.path == "/stat/game-schedule":
        require(set(params) == {"gcode", "seasonCode", "leagueCode", "gender", "page", "size"}
                and params["gcode"] == "001" and params["size"] == str(PAGE_SIZE)
                and re.fullmatch(r"[0-9]", params["page"]), "Unapproved schedule query")
    elif parts.path == "/stat/league/team-rank":
        require(set(params) == {"seasonCode", "leagueCode", "gender", "round", "page", "size"}
                and params["round"] == "0" and params["page"] == "0"
                and params["size"] == "30", "Unapproved standings query")
    else:
        raise SourceError("Unapproved source path")
    return url


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SourceError("Source redirected; access/contract review required")


def envelope_payload(data):
    require(isinstance(data, dict) and isinstance(data.get("result"), dict),
            "Official JSON envelope is missing")
    status = data["result"].get("status")
    require(type(status) is int and status == 200,
            f"Official envelope status is not successful: {status if type(status) is int else 'invalid'}")
    require("payload" in data, "Official payload is missing")
    return data["payload"]


class PublicClient:
    """Bounded anonymous GETs, no cookies/auth, gentle retries on transient errors."""

    def __init__(self, *, timeout=20, retries=2, delay=1.0, opener=None, sleeper=time.sleep):
        require(1 <= timeout <= 30 and 0 <= retries <= 2 and delay >= 1,
                "Invalid public-client limits")
        self.timeout, self.retries, self.delay = timeout, retries, delay
        self.opener = opener or build_opener(NoRedirect())
        self.sleep = sleeper
        self.called = False

    def __call__(self, url):
        validate_request_url(url)
        if self.called:
            self.sleep(self.delay)
        self.called = True
        request = Request(url, method="GET", headers={
            "Accept": "application/json", "Accept-Language": "ko",
            "Origin": "https://kovo.co.kr",
            "Referer": "https://kovo.co.kr/games/v-leagues/schedules",
            "X-Service-Name": "user", "User-Agent": "KVolleyLab-VLeague-Source/1.0",
        })
        for attempt in range(self.retries + 1):
            try:
                with self.opener.open(request, timeout=self.timeout) as response:
                    require(response.status == 200 and response.geturl() == url,
                            "Unexpected HTTP status or redirect")
                    require("json" in response.headers.get("Content-Type", "").lower(),
                            "Source did not return JSON")
                    body = response.read(MAX_BYTES + 1)
                    require(len(body) <= MAX_BYTES, "Official response exceeds size limit")
                try:
                    result = json.loads(body)
                except (UnicodeError, ValueError) as exc:
                    raise SourceError("Official response is not valid JSON") from exc
                envelope_payload(result)
                return result
            except HTTPError as exc:
                if exc.code in (401, 403, 429):
                    raise SourceError(f"Source denied or rate limited ({exc.code}); no retry") from exc
                if exc.code < 500 or attempt == self.retries:
                    raise SourceError(f"Source HTTP error ({exc.code})") from exc
            except (URLError, TimeoutError, OSError) as exc:
                if attempt == self.retries:
                    raise SourceError("Source connection failed after bounded retries") from exc
            self.sleep(2 ** (attempt + 1))
        raise SourceError("Source request did not complete")


def schedule_url(season, gender, page=0):
    config = SEASONS[season]
    return API_ORIGIN + "/stat/game-schedule?" + urlencode({
        "gcode": config["match_type"], "seasonCode": config["season_id"],
        "leagueCode": config["phase_id"], "gender": GENDERS[gender],
        "page": page, "size": PAGE_SIZE,
    })


def standings_url(season, gender):
    config = SEASONS[season]
    return API_ORIGIN + "/stat/league/team-rank?" + urlencode({
        "seasonCode": config["season_id"], "leagueCode": config["phase_id"],
        "gender": GENDERS[gender], "round": 0, "page": 0, "size": 30,
    })


def validate_final_sets(sets, won):
    require(len(sets) in (3, 4, 5), "Final result lacks complete per-set points")
    totals = {"home": 0, "away": 0}
    for index, points in enumerate(sets):
        require(max(totals.values()) < 3, "Points exist after a match-winning set")
        h, a = points["home"], points["away"]
        target = 15 if index == 4 else 25
        top, low = max(h, a), min(h, a)
        require((top == target and low <= target - 2)
                or (top > target and top - low == 2), "Impossible final set score")
        totals["home" if h > a else "away"] += 1
    require(totals == won and max(totals.values()) == 3,
            "Per-set winners disagree with official match result")


def normalize_match(raw, *, season, gender, source_url, observed_at):
    config = SEASONS[season]
    require(isinstance(raw, dict), "Schedule row is not an object")
    require(raw.get("seasonCode") == config["season_id"]
            and raw.get("leagueCode") == config["phase_id"]
            and raw.get("gender") == GENDERS[gender], "Schedule row has wrong season/phase/gender")
    require(raw.get("gpart") == config["phase_id"], "Unexpected game phase")
    season_name = text_value(raw.get("seasonName"), "seasonName", maximum=160)
    require(str(config["start_year"]) in season_name and str(config["end_year"]) in season_name,
            "Official season name conflicts with configured season")
    number = integer(raw.get("gnum"), "gnum", minimum=1, maximum=1000)
    round_number = integer(raw.get("round"), "round", minimum=1, maximum=config["rounds"])
    day = valid_date(raw.get("gdate"), "gdate")
    require(date(config["start_year"], 7, 1) <= day <= date(config["end_year"], 6, 30),
            "Game date is outside this season")
    start = clock_value(raw.get("gstime"), "gstime")
    end = clock_value(raw.get("getime"), "getime", empty=True)
    sides = {}
    for side, code_key, name_key in (("home", "hcode", "hsname"), ("away", "acode", "asname")):
        code = raw.get(code_key)
        require(isinstance(code, str) and re.fullmatch(r"[12]\d{3}", code)
                and code[0] == GENDERS[gender], "Invalid official team code")
        sides[side] = {"provider_code": code, "name": text_value(raw.get(name_key), name_key)}
    require(sides["home"]["provider_code"] != sides["away"]["provider_code"], "Same team on both sides")
    won = {"home": integer(raw.get("hspoint"), "hspoint", maximum=3),
           "away": integer(raw.get("aspoint"), "aspoint", maximum=3)}
    points = []
    trailing = False
    for set_number in range(1, 6):
        h = integer(raw.get(f"hs{set_number}point"), f"hs{set_number}point", maximum=199)
        a = integer(raw.get(f"as{set_number}point"), f"as{set_number}point", maximum=199)
        if h == a == 0:
            trailing = True
        else:
            require(not trailing, "Gap between observed sets")
            points.append({"home": h, "away": a})
    if end is not None:
        validate_final_sets(points, won)
        status = "final"
    elif points or max(won.values()) > 0:
        require(max(won.values()) < 3, "Winning result has no official end marker yet")
        status = "live"
    else:
        status = "scheduled"
    result_marker = raw.get("result")
    if status == "final":
        expected = "W" if won["home"] > won["away"] else "L"
        require(result_marker == expected, "Official winner marker disagrees with set wins")
    else:
        require(result_marker in (None, ""), "Non-final game has winner marker")
    return {
        "source_key": f"{config['season_id']}:{config['match_type']}:{gender}:{number}",
        "season_id": config["season_id"], "match_type": config["match_type"],
        "gender": gender, "number": number, "phase_id": config["phase_id"],
        "phase_name": text_value(raw.get("leagueName"), "leagueName"),
        "round": round_number, "date": day.isoformat(), "time": start,
        "venue": text_value(raw.get("place"), "place"),
        "home": sides["home"], "away": sides["away"], "status": status,
        "sets_won": won, "sets": points if points else None,
        "source_url": source_url,
        "detail_url": API_ORIGIN + f"/stat/game-schedule/{number}?" + urlencode({
            "gcode": config["match_type"], "seasonCode": config["season_id"],
            "leagueCode": config["phase_id"],
        }),
        "observed_at": observed_at,
    }


def read_gender_schedule(fetcher, *, season, gender, observed_at):
    config = SEASONS[season]
    rows, urls, total, pages = [], [], None, None
    for page_number in range(MAX_PAGES):
        url = schedule_url(season, gender, page_number)
        payload = envelope_payload(fetcher(url))
        require(isinstance(payload, dict) and isinstance(payload.get("content"), list)
                and isinstance(payload.get("page"), dict), "Full schedule page contract is missing")
        meta, content = payload["page"], payload["content"]
        size = integer(meta.get("size"), "page.size", minimum=1, maximum=PAGE_SIZE)
        number = integer(meta.get("number"), "page.number", maximum=MAX_PAGES - 1)
        count = integer(meta.get("totalElements"), "page.totalElements", minimum=1, maximum=1000)
        page_count = integer(meta.get("totalPages"), "page.totalPages", minimum=1, maximum=MAX_PAGES)
        require(number == page_number and page_count == math.ceil(count / size),
                "Inconsistent schedule pagination")
        require(count == config["expected_matches_per_gender"], "Unexpected full-season game count")
        require((total is None or total == count) and (pages is None or pages == page_count),
                "Schedule changed while paging; retry a fresh snapshot")
        require(len(content) == min(size, count - page_number * size), "Incomplete schedule page")
        total, pages = count, page_count
        rows.extend(normalize_match(row, season=season, gender=gender,
                                    source_url=url, observed_at=observed_at) for row in content)
        urls.append(url)
        if page_number + 1 == pages:
            break
    require(len(rows) == total, "Full-season coverage is incomplete")
    require(len({row["source_key"] for row in rows}) == total, "Duplicate official match identities")
    teams = Counter(code for row in rows for code in (row["home"]["provider_code"], row["away"]["provider_code"]))
    rounds = Counter(row["round"] for row in rows)
    require(len(teams) == config["teams"] and set(teams.values()) == {36},
            "Incomplete or unexpected team schedule coverage")
    require(rounds == Counter({n: 21 for n in range(1, config["rounds"] + 1)}),
            "Incomplete or unexpected round coverage")
    return rows, {"gender": gender, "expected": total, "received": len(rows),
                  "pages": pages, "teams": len(teams), "source_urls": urls}


def normalize_standings(data, *, season, gender, source_url, observed_at):
    config = SEASONS[season]
    payload = envelope_payload(data)
    require(isinstance(payload, list) and len(payload) <= config["teams"],
            "Official standings payload is not a team list")
    rows = []
    for raw in payload:
        require(isinstance(raw, dict) and raw.get("season") == config["season_id"]
                and raw.get("gpart") == config["phase_id"] and raw.get("spart") == GENDERS[gender]
                and type(raw.get("round")) is int and raw["round"] == 0,
                "Standings row has wrong season/phase/gender/round")
        code = raw.get("tcode")
        require(isinstance(code, str) and re.fullmatch(r"[12]\d{3}", code)
                and code[0] == GENDERS[gender], "Invalid standings team code")
        wins, losses = integer(raw.get("win"), "win", maximum=36), integer(raw.get("lost"), "lost", maximum=36)
        league_points = raw.get("winp")
        require(type(league_points) in (int, float) and math.isfinite(league_points)
                and league_points == int(league_points) and 0 <= league_points <= 108,
                "Invalid league points")
        rows.append({
            "provider_code": code, "name": text_value(raw.get("tsname"), "tsname"),
            "rank": integer(raw.get("rank"), "rank", minimum=1, maximum=7),
            "played": wins + losses, "wins": wins, "losses": losses,
            "points": int(league_points),
            "sets_won": integer(raw.get("swin"), "swin", maximum=108),
            "sets_lost": integer(raw.get("slost"), "slost", maximum=108),
            "points_won": integer(raw.get("point"), "point", maximum=50000),
            "points_lost": integer(raw.get("lpoint"), "lpoint", maximum=50000),
            "updated_date": valid_date(raw.get("udate"), "udate").isoformat(),
        })
    require(len({row["provider_code"] for row in rows}) == len(rows), "Duplicate standings teams")
    return {"gender": gender, "source_url": source_url, "observed_at": observed_at, "rows": rows}


def collect_season(season="2026-27", *, fetcher=None, include_standings=True, now=None):
    """Return both complete regular-season schedules; raise on any partial result.

    `fetcher(url)` is injectable for offline tests and must return the unmodified
    official JSON envelope. Official standings contain only teams with played
    games early in the season; the downstream reconciler must compare every
    total with the finished matches before trusting their rank.
    """
    require(season in SEASONS, "Season has no reviewed official mapping")
    reader = fetcher or PublicClient()
    stamp = now or utc_now()
    matches, coverage, standings = [], [], []
    for gender in GENDERS:
        observed, covered = read_gender_schedule(reader, season=season, gender=gender, observed_at=stamp)
        matches.extend(observed)
        coverage.append(covered)
        if include_standings:
            url = standings_url(season, gender)
            standings.append(normalize_standings(reader(url), season=season, gender=gender,
                                                 source_url=url, observed_at=stamp))
    require(len({m["number"] for m in matches}) == len(matches), "Official global game numbers overlap")
    matches.sort(key=lambda m: (m["date"], m["time"], m["number"]))
    stable = [{k: v for k, v in m.items() if k != "observed_at"} for m in matches]
    return {"schema_version": 1, "season": season, "fetched_at": stamp,
            "source": "KOVO_PUBLIC_STAT_API", "coverage": {
                "kind": "season", "phase": "regular", "complete": True,
                "genders": list(GENDERS), "details": coverage,
            }, "matches": matches, "official_standings": standings,
            "content_sha256": hashlib.sha256(json.dumps(stable, ensure_ascii=False,
                sort_keys=True, separators=(",", ":")).encode()).hexdigest()}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--season", default="2026-27")
    parser.add_argument("--output", required=True, help="Review snapshot path, never an operating data file")
    args = parser.parse_args(argv)
    try:
        result = collect_season(args.season)
        destination = Path(args.output)
        require("data/competitions/" not in destination.as_posix(), "Review output cannot be production competition data")
        destination.parent.mkdir(parents=True, exist_ok=True)
        temp = destination.with_suffix(destination.suffix + ".tmp")
        temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temp.replace(destination)
        print("KOVO_VLEAGUE_SOURCE_OK", json.dumps({"matches": len(result["matches"]),
              "final": sum(m["status"] == "final" for m in result["matches"]),
              "coverage_complete": result["coverage"]["complete"]}))
        return 0
    except (SourceError, OSError) as exc:
        print("KOVO_VLEAGUE_SOURCE_BLOCKED", type(exc).__name__, str(exc)[:180])
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

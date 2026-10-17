#!/usr/bin/env python3
"""KOVO DB BANK public match-result collector (read-only, review-stage).

Uses only explicitly supplied, publicly accessible match URLs. It does not
authenticate, discover opaque IDs, bypass access controls, or publish to the
K-Volley Lab website. Python standard library only.
"""
import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

HOST = "dbbank.kovo.co.kr"
MATCH_PATH = "/game/11110_pop_result.asp"
MAX_BYTES = 2_000_000
TEAMS = (
    "IBK기업은행", "한국도로공사", "OK저축은행", "페퍼저축은행",
    "현대캐피탈", "흥국생명", "현대건설", "GS칼텍스",
    "대한항공", "한국전력", "KB손해보험", "삼성화재",
    "우리카드", "정관장", "SOOP",
)


class AccessDenied(RuntimeError):
    pass


class ParseError(RuntimeError):
    pass


def validate_url(value):
    u = urlsplit(value)
    if u.scheme != "https" or u.hostname != HOST or u.port is not None:
        raise ValueError("Only https://dbbank.kovo.co.kr is permitted")
    if u.username or u.password or u.fragment or u.path.lower() != MATCH_PATH.lower():
        raise ValueError("Not an allowed public DB BANK match page")
    params = parse_qs(u.query, keep_blank_values=True)
    if set(params) - {"PID", "PSET"} or len(params.get("PID", [])) != 1:
        raise ValueError("Only a single public match PID (and optional PSET) is permitted")
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,100}", params["PID"][0]):
        raise ValueError("Invalid opaque match PID")
    if "PSET" in params and (len(params["PSET"]) != 1
                            or not re.fullmatch(r"[1-5]", params["PSET"][0])):
        raise ValueError("Invalid PSET")
    return value


class PageTables(HTMLParser):
    """Extract cell text, heading text and page text without saving raw HTML."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.table, self.row, self.cell = [], None, None, None
        self.depth, self.skip, self.texts = 0, 0, []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.skip += 1
        if self.skip:
            return
        if tag == "table":
            if not self.depth:
                self.table = []
            self.depth += 1
        elif tag == "tr" and self.depth and self.row is None:
            self.row = []
        elif tag in ("td", "th") and self.row is not None and self.cell is None:
            self.cell = []
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_data(self, data):
        if self.skip or not data.strip():
            return
        self.texts.append(data.strip())
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self.skip = max(self.skip - 1, 0)
            return
        if self.skip:
            return
        if tag in ("td", "th") and self.cell is not None and self.row is not None:
            self.row.append(re.sub(r"\s+", " ", "".join(self.cell)).strip())
            self.cell = None
        elif tag == "tr" and self.row is not None:
            if any(self.row):
                self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.depth:
            self.depth -= 1
            if not self.depth:
                self.tables.append(self.table)
                self.table = None


def page_decode(raw, content_type=""):
    head = raw[:5000].decode("ascii", errors="ignore")
    tag = re.search(r"charset\s*=\s*['\"]?\s*([-\w]+)", content_type + " " + head, re.I)
    choices = [tag.group(1)] if tag else []
    choices += ["utf-8", "cp949", "euc-kr"]
    for enc in dict.fromkeys(choices):
        try:
            return raw.decode(enc)
        except (UnicodeError, LookupError):
            continue
    raise ParseError("Unknown or damaged page encoding")


def request_public_page(url):
    validate_url(url)
    request = Request(url, headers={
        "User-Agent": "KVolleyLab-MatchCollector/0.1 (+read-only public match records)",
        "Accept": "text/html",
        "Accept-Language": "ko-KR,ko;q=0.9",
    }, method="GET")
    try:
        with urlopen(request, timeout=18) as response:
            if response.status != 200:
                raise AccessDenied(f"HTTP {response.status}")
            # Redirects to login, a new host, or a different path are not accepted.
            if urlsplit(response.geturl()).path.lower() != MATCH_PATH.lower():
                raise AccessDenied("Redirected away from public match page")
            validate_url(response.geturl())
            raw = response.read(MAX_BYTES + 1)
            charset = response.headers.get("Content-Type", "")
    except HTTPError as exc:
        if exc.code in (401, 403, 404, 429):
            raise AccessDenied(f"HTTP {exc.code}; do not bypass access controls") from exc
        raise
    except URLError as exc:
        raise AccessDenied(f"Network unavailable: {exc.reason}") from exc
    if len(raw) > MAX_BYTES:
        raise ParseError("Page exceeds 2MB safety bound")
    return page_decode(raw, charset)


def canonical_team(cell):
    normalized = re.sub(r"\s+", "", cell)
    names = [t for t in TEAMS if t.upper() in normalized.upper()]
    return sorted(names, key=len, reverse=True)[0] if len(names) == 1 else None


def cell_points(row, team_index):
    """Read consecutive set columns following a team, stopping at TOTAL."""
    points = []
    for cell in row[team_index + 1:]:
        token = cell.strip().replace(",", "")
        if not token:
            continue
        if not re.fullmatch(r"\d+", token):
            break
        value = int(token)
        if value > 45:  # TOTAL score, not a set score
            break
        points.append(value)
        if len(points) == 5:
            break
    return points if 3 <= len(points) <= 5 else []


def result_from_table(table):
    # Only inspect an actual score table, not team/player stat tables.
    header_idx = next((i for i, row in enumerate(table)
                       if "1SET" in "".join(row).upper()
                       and "2SET" in "".join(row).upper()
                       and "TOTAL" in "".join(row).upper()), -1)
    if header_idx < 0:
        return None
    candidates = []
    for row in table[header_idx + 1:header_idx + 6]:
        matched = [(i, canonical_team(cell)) for i, cell in enumerate(row)]
        matched = [(i, team) for i, team in matched if team]
        if len(matched) != 1:
            continue
        i, team = matched[0]
        points = cell_points(row, i)
        if points:
            candidates.append((team, points))
    if len(candidates) != 2 or candidates[0][0] == candidates[1][0]:
        return None
    home, away = candidates
    if len(home[1]) != len(away[1]):
        return None
    sets = [{"home": a, "away": b} for a, b in zip(home[1], away[1])]
    if any(a["home"] == a["away"] for a in sets):
        return None
    h = sum(p["home"] > p["away"] for p in sets)
    a = len(sets) - h
    if max(h, a) != 3 or min(h, a) > 2:
        return None
    return {"home_team": home[0], "away_team": away[0],
            "score": {"home": h, "away": a, "sets": sets}}


def parse_match(html, url, expect=None):
    validate_url(url)
    if re.search(r"<input\b[^>]*type\s*=\s*['\"]?password", html, re.I):
        raise AccessDenied("Login form detected; not a public match record")
    page = PageTables()
    page.feed(html)
    full_text = " ".join(page.texts)
    if "경기결과" not in full_text or "경기번호" not in full_text:
        raise ParseError("Not a KOVO DB BANK result page (or login required)")
    dates = re.findall(r"\b(20\d{2})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})", full_text)
    if not dates:
        raise ParseError("No match date found")
    match_date = "%s-%02d-%02d" % (dates[0][0], int(dates[0][1]), int(dates[0][2]))
    results = [v for table in page.tables if (v := result_from_table(table))]
    if len(results) != 1:
        raise ParseError(f"Expected one valid score table, found {len(results)}")
    game = results[0]
    extras = {}
    for table in page.tables:
        for row in table:
            for index, cell in enumerate(row[:-1]):
                if cell.strip() in ("경기번호", "관중수", "경기장"):
                    extras[{"경기번호": "game_number", "관중수": "attendance",
                            "경기장": "venue"}[cell.strip()]] = row[index + 1].strip()
    if not extras.get("game_number"):
        raise ParseError("No match number in game info table")
    spec = expect or {}
    for field, observed in (("date", match_date),
                            ("home_team", game["home_team"]),
                            ("away_team", game["away_team"])):
        if spec.get(field) and spec[field] != observed:
            raise ParseError(f"Source match mismatch: {field} expected {spec[field]} got {observed}")
    if spec.get("score") and spec["score"] != "%s-%s" % (
            game["score"]["home"], game["score"]["away"]):
        raise ParseError("Unexpected final set score")
    return {"date": match_date, **game, **extras}


def inspect_stats_structure(html):
    """Return non-PII player-table structural diagnostics; NEVER player values."""
    page = PageTables()
    page.feed(html)
    candidates = []
    allowed_positions = {"S", "L", "MB", "OH", "OP", "OS", "O", "SETTER", "LIBERO"}
    for table in page.tables:
        header = " ".join(" ".join(row) for row in table[:5]).upper()
        if not ("PLAYER" in header and "포지션" in header and "득점" in header):
            continue
        shapes = []
        for row in table:
            positions = [i for i, cell in enumerate(row)
                         if cell.strip().upper() in allowed_positions]
            if not positions or len(row) < 12:
                continue
            shapes.append({
                "columns": len(row),
                "position_indices": positions[:3],
                "numeric_cells": sum(bool(re.fullmatch(r"\d+(?:\.\d+)?", cell.strip()))
                                     for cell in row),
            })
        candidates.append({
            "rows": len(table),
            "first_five_column_counts": [len(row) for row in table[:5]],
            "player_row_shapes": shapes[:6],
            "player_rows_detected": len(shapes),
        })
    return {"all_tables": len(page.tables), "candidate_tables": len(candidates),
            "candidates": candidates[:6]}


def extract_player_candidates(html, team_order):
    """Provisional player scoring rows from two 21-column DB BANK tables.

    Team assignment is based solely on table ordering and MUST be verified
    before publication. Field index 9 (total points) was compared to public
    official table output; index 10-12 remain candidate metrics only.
    """
    page = PageTables()
    page.feed(html)
    tables = []
    for table in page.tables:
        header = " ".join(" ".join(row) for row in table[:5]).upper()
        if "PLAYER" in header and "포지션" in header and "득점" in header:
            tables.append(table)
    if len(tables) != 2 or len(team_order) != 2:
        return {"status": "unverified_table_structure", "teams": []}

    teams = []
    valid_positions = {"S", "L", "MB", "OH", "OP", "OS", "O"}
    for team, table in zip(team_order, tables):
        rows = []
        for cells in table:
            if len(cells) != 21 or cells[2].strip().upper() not in valid_positions:
                continue
            number, name, position, height = map(str.strip, cells[:4])
            if not re.fullmatch(r"\d{1,3}", number):
                continue
            if not 1 <= len(name) <= 60 or re.search(r"[<>]", name):
                raise ParseError("Invalid player name in candidate row")
            if not height.isdigit() or not 130 <= int(height) <= 230:
                raise ParseError("Invalid player height in candidate row")
            def integer_or_null(value):
                value = value.strip().replace(",", "")
                if not value:
                    return None
                if not re.fullmatch(r"\d{1,3}", value):
                    raise ParseError("Unexpected player metric; stop before publishing")
                return int(value)
            points = integer_or_null(cells[9])
            attack = integer_or_null(cells[10])
            block = integer_or_null(cells[11])
            serve = integer_or_null(cells[12])
            if points is not None and points > 70:
                raise ParseError("Unrealistic player points")
            if points is not None and any(v is not None and v > points
                                          for v in (attack, block, serve)):
                raise ParseError("Candidate points inconsistent with total")
            rows.append({
                "number": number, "name": name, "position": position,
                "height_cm": int(height), "points": points,
                "attack_points_candidate": attack,
                "block_points_candidate": block,
                "serve_points_candidate": serve,
            })
        if not rows or len({(r["number"], r["name"]) for r in rows}) != len(rows):
            return {"status": "unverified_player_rows", "teams": []}
        teams.append({"team": team, "assignment": "table_order_unverified",
                      "players": rows})
    return {"status": "parsed_review_required", "teams": teams}


def collect_one(entry, html=None):
    url = validate_url(entry["url"])
    source = request_public_page(url) if html is None else html
    match = parse_match(source, url, entry.get("expect"))
    stats_structure = inspect_stats_structure(source)
    player_candidates = extract_player_candidates(source, [match["home_team"], match["away_team"]])
    for check in entry.get("player_checks", []):
        hits = [p for t in player_candidates["teams"]
                if t["team"] == check["team"]
                for p in t["players"] if p["name"] == check["name"]]
        if len(hits) != 1 or hits[0]["points"] != check["points"]:
            raise ParseError("Known official player score did not match source page")
    return {
        "schema_version": 1,
        "source": "KOVO DB BANK public match result",
        "source_url": url,
        "collected_utc": datetime.now(timezone.utc).isoformat(),
        "source_sha256": hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "status": "parsed_review_required",
        "player_stats_status": player_candidates["status"],
        "player_stats_candidates": player_candidates,
        "player_spot_checks_passed": len(entry.get("player_checks", [])),
        "player_stats_structure": stats_structure,
        **match,
    }


def collect_manifest(manifest, output, delay=1):
    entries = json.loads(Path(manifest).read_text(encoding="utf-8"))["matches"]
    if not 1 <= len(entries) <= 20 or delay < 1:
        raise ValueError("1..20 entries and at least 1 second between requests required")
    urls = [validate_url(e["url"]) for e in entries]
    match_ids = [parse_qs(urlsplit(url).query)["PID"][0] for url in urls]
    if len(set(match_ids)) != len(match_ids):
        raise ValueError("Duplicate match PID (PSET variants are the same match)")
    results = []
    for i, entry in enumerate(entries):
        record = collect_one(entry)
        results.append(record)
        totals = [len(t["players"]) for t in record["player_stats_candidates"]["teams"]]
        print("PLAYER_ROWS", record["date"], record["player_stats_status"],
              "counts=" + str(totals), flush=True)
        diag = record["player_stats_structure"]
        signatures = [
            {"rows": c["rows"], "detected": c["player_rows_detected"],
             "shapes": c["player_row_shapes"][:2]}
            for c in diag["candidates"]
        ]
        print("STATS_SCHEMA", record["date"],
              json.dumps({"candidate_tables": diag["candidate_tables"],
                          "signatures": signatures}, ensure_ascii=False), flush=True)
        if i != len(entries) - 1:
            time.sleep(delay)
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Only atomic write after all requests and validations succeed.
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps({"schema_version": 1, "matches": results},
                               ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)
    print(f"MATCH_COLLECT_OK count={len(results)} review_required=true output={path}")
    return results


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", default="data/kovo/match-collector/pilot_sources.json")
    p.add_argument("--output", default="data/kovo/match-collector/pilot_results.json")
    p.add_argument("--delay", type=float, default=1)
    args = p.parse_args()
    try:
        collect_manifest(args.manifest, args.output, args.delay)
    except (ValueError, KeyError, AccessDenied, ParseError, OSError, HTTPError) as exc:
        print(f"MATCH_COLLECT_BLOCKED {type(exc).__name__}: {str(exc)[:250]}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

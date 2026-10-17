#!/usr/bin/env python3
"""Read-only KOVO *public website* metadata probe; no private endpoints/ID guessing.

Observes publicly served HTML and a bounded number of same-origin JS assets,
reporting only structural metadata and safely redacted candidate endpoint paths.
Never sends credentials, cookies, Authorization, or requests to inferred APIs.
"""
import argparse
from html.parser import HTMLParser
import json
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ALLOWED_HOST = "kovo.co.kr"
ENTRY_PATHS = ("/game/v-league", "/game/kovo-cup", "/")
PATH_WORDS = ("schedule", "match", "game", "league", "score", "result", "cup")
MAX_RESPONSE_BYTES = 2_000_000
MAX_PUBLIC_STATIC_JS_BYTES = 8_000_000
MAX_ASSETS = 3


class Blocked(RuntimeError):
    pass


def first_party(url):
    parts = urlsplit(url)
    return (parts.scheme == "https" and parts.hostname == ALLOWED_HOST
            and parts.port is None and not parts.username and not parts.password)


class SameOriginRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not first_party(newurl):
            raise Blocked("Off-origin redirect refused")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch_public(url):
    if not first_party(url):
        raise Blocked("Only public kovo.co.kr URLs are permitted")
    opener = build_opener(SameOriginRedirect)
    req = Request(url, method="GET", headers={
        "User-Agent": "KVolleyLab-SourceDiscovery/0.1 (public metadata audit)",
        "Accept": "text/html, application/javascript, text/javascript, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
    })
    try:
        with opener.open(req, timeout=15) as resp:
            if not first_party(resp.geturl()):
                raise Blocked("Redirected off-origin")
            size_limit = (MAX_PUBLIC_STATIC_JS_BYTES if urlsplit(resp.geturl()).path.endswith(".js")
                          else MAX_RESPONSE_BYTES)
            data = resp.read(size_limit + 1)
            if len(data) > size_limit:
                return "", {"status": "size_limit", "content_type": resp.headers.get("Content-Type", "").split(";")[0],
                            "bytes_read": size_limit + 1, "pathname": urlsplit(resp.geturl()).path}
            return data.decode("utf-8", "replace"), {
                "status": resp.status,
                "content_type": resp.headers.get("Content-Type", "").split(";")[0],
                "bytes": len(data),
                "pathname": urlsplit(resp.geturl()).path,
            }
    except HTTPError as ex:
        return "", {"status": ex.code, "reason": "HTTP response; no retry"}
    except (URLError, TimeoutError, OSError) as ex:
        return "", {"status": "unreachable", "reason": type(ex).__name__}


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.srcs = []
        self.nextdata = False
        self.links = []

    def handle_starttag(self, tag, attrs):
        args = dict(attrs)
        if tag == "script":
            if args.get("src"):
                self.srcs.append(args["src"])
            if args.get("id") == "__NEXT_DATA__":
                self.nextdata = True
        if tag == "link" and args.get("rel") in ("modulepreload", "preload") and args.get("as") == "script":
            if args.get("href"):
                self.links.append(args["href"])


def public_js_paths(html, base):
    parsed = Scripts()
    parsed.feed(html)
    paths = []
    for raw in parsed.srcs + parsed.links:
        url = urljoin(base, raw)
        if first_party(url) and urlsplit(url).path.lower().endswith(".js"):
            # Strip query parameters; log/store no potentially sensitive values.
            clean = "https://" + ALLOWED_HOST + urlsplit(url).path
            if clean not in paths:
                paths.append(clean)
    return paths, parsed.nextdata


def endpoint_path_hints(js):
    """Only publicly literal path candidates; does not call or claim API validity."""
    raw = re.findall(r"""["'\\x60]((?:https://(?:user-api\.)?kovo\.co\.kr)?/[A-Za-z0-9_/?=&%.-]{5,220})["'\\x60]""", js)
    result = []
    for value in raw:
        p = urlsplit(value)
        if p.hostname and p.hostname not in ("user-api.kovo.co.kr", "kovo.co.kr"):
            continue
        if any(word in p.path.lower() for word in PATH_WORDS):
            path = re.sub(r"/[A-Za-z0-9_-]{25,}", "/{id}", p.path)
            if path not in result:
                result.append(path)
    return result[:30]


def route_contexts(js):
    """Short public-code callsite hints for known schedule route literals."""
    routes = ("/games/v-leagues/schedules", "/games/kovo-cups/schedules",
              "mains/games/schedules", "mains/games/schedules/ended",
              "main/game/season", "main/game/event/list",
              "/matches/", "/stats/games", "/stat/game-schedule/",
              "/games/schedules", "/view-point/games",
              "user-api.kovo.co.kr")
    found = []
    for route in routes:
        for hit in list(re.finditer(re.escape(route), js))[:2]:
            start, end = hit.span()
            # Avoid writing secrets or opaque IDs from arbitrary JS to job logs.
            around = js[max(0, start-115):min(len(js), end+170)]
            around = re.sub(r"[A-Za-z0-9_-]{25,}", "{opaque}", around)
            around = re.sub(r"([?&](?:token|key|sid|auth|session)=[^&'\"\s]+)",
                            "[redacted-query]", around, flags=re.I)
            found.append({"route": route, "context": around})
    return found


def host_hints(js):
    return sorted(set(re.findall(r"https://(?:[a-z0-9-]+\.)?kovo\.co\.kr", js, re.I)))[:20]


def official_game_api_calls(js):
    """Extract bounded game API path hints from public Axios callsites only."""
    result=[]
    for match in re.finditer(r"\bue\.(get|post)\(",js):
        segment=js[match.end():match.end()+160].lstrip()
        if not segment or segment[0] not in ('"', "'", chr(96)):
            continue
        value=segment[1:].split(segment[0],1)[0]
        path=value.split(chr(36)+chr(123),1)[0].split("?",1)[0]
        if not path or len(path)>110 or "://" in path:
            continue
        if not any(keyword in path.lower() for keyword in PATH_WORDS):
            continue
        entry={"method":match.group(1).upper(),"path":path}
        if entry not in result:
            result.append(entry)
    return result[:100]


def probe(max_assets=3):
    if not 0 <= max_assets <= MAX_ASSETS:
        raise Blocked("Max assets is 0..3")
    output = {"kind": "public_site_metadata_probe",
              "guarantees": "No private API calls or PID guessing; not proof of live score access",
              "entries": [], "asset_hints": []}
    seen = []
    for path in ENTRY_PATHS:
        base = f"https://{ALLOWED_HOST}{path}"
        html, meta = fetch_public(base)
        js_paths, nextdata = public_js_paths(html, base) if html else ([], False)
        output["entries"].append({**meta, "requested_path": path,
                                  "next_data_marker": nextdata,
                                  "public_js_count": len(js_paths),
                                  "public_js_paths": [urlsplit(x).path for x in js_paths[:15]],
                                  "html_words": {
                                      "schedule": "경기일정" in html,
                                      "live": "LIVE" in html or "실시간" in html,
                                  }})
        for js in js_paths:
            if js not in seen:
                seen.append(js)
    # Never request arbitrary discovered URLs; only same-origin static .js assets.
    for url in seen[:max_assets]:
        code, meta = fetch_public(url)
        output["asset_hints"].append({
            "pathname": urlsplit(url).path,
            **meta,
            "candidate_route_paths": endpoint_path_hints(code) if code else [],
            "route_callsite_hints": route_contexts(code) if code else [],
            "first_party_host_hints": host_hints(code) if code else [],
            "official_game_api_calls": official_game_api_calls(code) if code else [],
            "realtime_keywords": [word for word in ("websocket", "EventSource", "score", "match", "game")
                                  if word.lower() in code.lower()],
        })
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-assets", type=int, default=3)
    args = parser.parse_args()
    try:
        output = probe(args.max_assets)
        print("KOVO_PUBLIC_DISCOVERY", json.dumps(output, ensure_ascii=False))
    except (Blocked, ValueError) as ex:
        print("KOVO_PUBLIC_DISCOVERY_BLOCKED", type(ex).__name__, str(ex), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

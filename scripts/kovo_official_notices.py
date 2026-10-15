#!/usr/bin/env python3
"""KOVO public official-notice collector; metadata and normalized facts only."""
import argparse
import csv
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from kovo_official_change_events import parse_events, FIELDS as EVENT_FIELDS

API = "https://user-api.kovo.co.kr"
SITE = "https://kovo.co.kr/news/official-notices"
TEAMS = {
    "대한항공": "남", "현대캐피탈": "남", "우리카드": "남",
    "KB손해보험": "남", "한국전력": "남", "OK저축은행": "남", "삼성화재": "남",
    "GS칼텍스": "여", "한국도로공사": "여", "현대건설": "여",
    "흥국생명": "여", "IBK기업은행": "여", "정관장": "여",
    "SOOP": "여", "페퍼저축은행": "여",
}
KEYWORDS = ("선수등록", "추가등록", "추가선수 등록", "추가 선수 등록",
            "임의해지", "임의탈퇴", "자유신분", "이적", "FA", "보상선수",
            "외국인", "아시아쿼터", "신인선수", "계약", "방출", "임대",
            "계약해지", "계약 해지", "등록말소", "은퇴", "퇴단")
FIELDS = ("notice_id", "notice_date", "notice_title", "notice_kind", "team", "gender",
          "number", "player_name", "position", "salary_krw", "option_krw",
          "total_krw", "remarks", "source_url")


def korean_text(items, field):
    if not isinstance(items, list):
        return ""
    for entry in items:
        if isinstance(entry, dict) and str(entry.get("languageCode", "")).lower() in ("ko", "kor"):
            return str(entry.get(field) or "")
    return next((str(x[field]) for x in items if isinstance(x, dict) and x.get(field)), "")


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.table, self.row, self.cell = [], [], None, None
        self.depth = 0
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "table":
            if self.depth == 0:
                self.table = []
            self.depth += 1
        if self.depth and tag == "tr" and self.row is None:
            self.row = []
        if self.depth and tag in ("td", "th") and self.row is not None and self.cell is None:
            self.cell = []
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_data(self, data):
        if not self.skip and self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        if tag in ("td", "th") and self.cell is not None and self.row is not None:
            self.row.append(re.sub(r"\s+", " ", "".join(self.cell)).strip())
            self.cell = None
        elif tag == "tr" and self.row is not None:
            if any(self.row):
                self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.depth:
            self.depth -= 1
            if self.depth == 0:
                self.tables.append(self.table)
                self.table = []


def money_to_krw(value):
    value = str(value or "").strip().replace(",", "").replace(" ", "")
    return round(float(value) * 1000) if re.fullmatch(r"\d+(?:\.\d+)?", value) else None


def detect_kind(title):
    if "임의해지 해지" in title or "임의해지해지" in title:
        return "reinstatement"
    if "해외임대" in title or "임대" in title:
        return "loan"
    if "임의해지" in title or "임의탈퇴" in title:
        return "voluntary_termination"
    if "계약해지" in title or "계약 해지" in title:
        return "contract_termination"
    if "방출" in title or "퇴단" in title:
        return "release"
    if "은퇴" in title:
        return "retirement"
    if "자유신분" in title:
        return "free_agent"
    if "보상선수" in title or re.search(r"\bFA\b", title, re.I):
        return "fa"
    if "이적" in title:
        return "transfer"
    if "외국인" in title or "아시아쿼터" in title:
        return "foreign_or_asian_quota"
    if "배번 변경" in title or "등번호 변경" in title:
        return "number_change"
    if "포지션 변경" in title:
        return "position_change"
    if "선수등록" in title or "추가선수 등록" in title or "추가 선수 등록" in title:
        return "registration"
    return "other_player_notice"

def detect_team(title):
    for name in sorted(TEAMS, key=len, reverse=True):
        if name in title:
            return name, TEAMS[name]
    return "", ""


def relevant(title, created, season, since):
    if created and str(created)[:10] < since:
        return False
    normalized = re.sub(r"[\s./]", "-", title)
    season_hit = season in normalized or season.replace("-", "-20") in normalized
    return season_hit or any(word.lower() in title.lower() for word in KEYWORDS)


def extract_rows(bodies):
    parser = TableParser()
    parser.feed(korean_text(bodies, "body"))
    results = []
    for table in parser.tables:
        for header_index, headers in enumerate(table):
            normalized = [re.sub(r"[\s()[\]./·-]", "", c).lower() for c in headers]
            def idx(*names):
                return next((i for i, cell in enumerate(normalized)
                             if any(cell == name or cell.startswith(name) for name in names)), -1)
            name_col, pos_col = idx("성명", "선수명", "이름"), idx("포지션", "위치")
            if name_col < 0 or pos_col < 0:
                continue
            num_col, sal_col, opt_col = idx("구분", "등번호", "번호"), idx("연봉"), idx("옵션")
            tot_col, remarks_col = idx("합계", "총액", "총보수"), idx("비고", "특이사항")
            thousand = any("천원" in header for header in headers)
            for cells in table[header_index + 1:]:
                def get(i):
                    return cells[i].strip() if 0 <= i < len(cells) else ""
                name, pos = get(name_col), get(pos_col)
                if not name or not pos or name in ("성명", "합계", "총계", "계") or len(name) > 70:
                    continue
                def amount(i):
                    return money_to_krw(get(i)) if thousand else None
                results.append({
                    "number": get(num_col), "player_name": name, "position": pos,
                    "salary_krw": amount(sal_col), "option_krw": amount(opt_col),
                    "total_krw": amount(tot_col), "remarks": get(remarks_col)[:300],
                })
            break
    unique = {(r["number"], r["player_name"], r["position"]): r for r in results}
    return list(unique.values())


def request_json(endpoint):
    req = Request(API + endpoint, headers={
        "Accept": "application/json",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Origin": "https://kovo.co.kr",
        "Referer": SITE,
        "User-Agent": "KVolleyLab-Official-Public-Notices/1.0",
    }, method="GET")
    last = None
    for attempt in range(3):
        try:
            with urlopen(req, timeout=18) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status}")
                raw = response.read(2_000_001)
                if len(raw) > 2_000_000:
                    raise RuntimeError("response > 2 MB")
            data = json.loads(raw)
            result = data.get("result") if isinstance(data, dict) else None
            if not isinstance(result, dict) or result.get("status") != 200 or data.get("payload") is None:
                raise RuntimeError(f"Invalid KOVO envelope: {result}")
            return data["payload"]
        except HTTPError as exc:
            last = f"HTTP {exc.code}"
            if exc.code in (400, 401, 403, 404):
                break
        except (URLError, TimeoutError, OSError, RuntimeError, ValueError) as exc:
            last = f"{type(exc).__name__}: {str(exc)[:130]}"
            if "envelope" in str(exc):
                break
        if attempt < 2:
            time.sleep(1.5 * (2 ** attempt))
    raise RuntimeError(f"API failure {endpoint}: {last}")


def list_page(page):
    endpoint = "/contents/news/official-notices?" + urlencode({
        "page": page, "size": 10, "sort": "order,desc", "pinned": "false",
    })
    payload = request_json(endpoint)
    if not isinstance(payload, dict) or not isinstance(payload.get("content"), list):
        raise RuntimeError("invalid listing shape")
    return payload["content"]


def detail(notice_id):
    payload = request_json(f"/contents/news/official-notices/{notice_id}")
    if not isinstance(payload, dict) or int(payload.get("id", -1)) != notice_id:
        raise RuntimeError(f"invalid detail {notice_id}")
    return payload


def normalize_detail(data):
    ident = int(data["id"])
    title = korean_text(data.get("titles"), "title")
    team, gender = detect_team(title)
    bodies = data.get("bodies") or []
    body = korean_text(bodies, "body")
    return {
        "id": ident,
        "published_at": data.get("createdAt") or "",
        "title": title, "kind": detect_kind(title), "team": team, "gender": gender,
        "source_url": f"{SITE}/{ident}",
        "html_sha256": hashlib.sha256(body.encode("utf-8")).hexdigest(),
        "players": extract_rows(bodies),
        "events": parse_events(body,title,ident,(data.get("createdAt") or "")[:10],detect_kind(title),team,gender,f"{SITE}/{ident}"),
    }


def write_json(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def collect(args):
    if not 0 <= args.max_pages <= 200 or not 1 <= args.max_details <= 1000:
        raise ValueError("unsafe page/detail count")
    if args.delay < 0.5:
        raise ValueError("delay must be >= 0.5")
    out = Path(args.output_dir)
    archive = out / "index.json"
    previous = json.loads(archive.read_text(encoding="utf-8")) if archive.exists() else {}
    if previous and previous.get("season") != args.season:
        raise RuntimeError("season mismatch in existing index")
    old = {int(x["id"]): x for x in previous.get("notices", [])}
    candidates, seen = [], set()
    pages = 0
    if args.notice_id:
        candidates = [args.notice_id]
    else:
        for page in range(args.max_pages):
            entries = list_page(page)
            pages += 1
            if not entries:
                break
            cutoff_reached = False
            for n in entries:
                created = n.get("createdAt") or ""
                if created[:10] and created[:10] < args.from_date:
                    cutoff_reached = True
                    continue
                title = korean_text(n.get("titles"), "title")
                if relevant(title, created, args.season, args.from_date):
                    ident = n.get("id")
                    if isinstance(ident, int) and ident not in seen:
                        seen.add(ident)
                        candidates.append(ident)
            if cutoff_reached or len(entries) < 10:
                break
            time.sleep(args.delay)
    if len(candidates) > args.max_details:
        raise RuntimeError(f"Found {len(candidates)} matching posts; raise --max-details")
    changes = []
    for index, ident in enumerate(candidates):
        n = normalize_detail(detail(ident))
        if old.get(ident) != n:
            changes.append({
                "id": ident, "change": "new" if ident not in old else "updated",
                "title": n["title"], "url": n["source_url"],
            })
        old[ident] = n
        if (index + 1) % 10 == 0:
            print(f"DETAILS_FETCHED {index + 1}", flush=True)
        if index < len(candidates) - 1:
            time.sleep(args.delay)
    notices = sorted(old.values(), key=lambda n: n["id"], reverse=True)
    rows = []
    for n in notices:
        for p in n.get("players", []):
            rows.append({
                "notice_id": n["id"], "notice_date": n["published_at"][:10],
                "notice_title": n["title"], "notice_kind": n["kind"],
                "team": n["team"], "gender": n["gender"], **p,
                "source_url": n["source_url"],
            })
    events = [event for notice in notices for event in notice.get("events", [])]
    with (out / "change_events.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=EVENT_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(sorted(events, key=lambda ev:(ev["effective_date"],ev["notice_id"],ev["event_id"])))
    write_json(archive, {
        "schema_version": 1, "season": args.season, "source": SITE,
        "scope": "Partial archive of public notices. Not a confirmed current roster.",
        "notices": notices,
    })
    with (out / "registration_rows.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    if changes:
        write_json(out / "latest_changes.json", {"season": args.season, "changes": changes})
    write_json(out / "run_report.json", {
        "run_utc": datetime.now(timezone.utc).isoformat(),
        "pages_fetched": pages, "details_fetched": len(candidates),
        "archived_notices": len(notices), "table_rows": len(rows), "change_events": len(events), "high_confidence_events": sum(ev["confidence"]=="high" for ev in events),
        "new_or_updated": len(changes), "notice_id": args.notice_id,
    })
    print(f"COLLECT_OK pages={pages} details={len(candidates)} archived={len(notices)} rows={len(rows)} events={len(events)} changes={len(changes)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--season", default="2026-27")
    parser.add_argument("--from-date", default="2026-04-01")
    parser.add_argument("--max-pages", type=int, default=6)
    parser.add_argument("--max-details", type=int, default=90)
    parser.add_argument("--notice-id", type=int, default=None)
    parser.add_argument("--delay", type=float, default=0.8)
    parser.add_argument("--output-dir", default="data/kovo/official-notices/2026-27")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}", args.season):
        parser.error("season must be YYYY-YY")
    try:
        collect(args)
    except Exception as exc:
        print(f"COLLECT_FAILED {type(exc).__name__}: {str(exc)[:220]}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

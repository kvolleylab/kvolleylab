#!/usr/bin/env python3
"""Versioned player review ledger and metadata-only RSS discovery; no MASTER writes.

Run after kovo_official_notices.py. An approved record produces a review export,
not a change to live membership, historical competition rosters or player IDs.
"""
import argparse
from collections import Counter
import csv
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo
from kovo_official_notices import detect_kind, FIELDS as ROSTER_CSV_FIELDS
from kovo_official_change_events import FIELDS as EVENT_CSV_FIELDS

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "data/player-updates"
KINDS = {"registration", "transfer", "reinstatement", "foreign_or_asian_quota",
         "free_agent", "voluntary_termination", "registration_termination",
         "contract_termination", "release", "retirement", "loan", "number_change",
         "position_change", "roster_snapshot"}
EVENT_FIELDS = ("registered_name", "from_team", "to_team", "destination", "jersey_number",
                "position", "previous_number", "new_number", "previous_position",
                "new_position", "loan_start", "loan_end")
MAX_FEED_BYTES = 2_000_000
SENSITIVE_QUERY = re.compile(r"token|signature|secret|password|credential|authorization|api.?key|authcode|(?:^|[-_])(?:key|sig|auth)(?:$|[-_])", re.I)
PUBLIC_OPERATOR = re.compile(r"KVL-OP-[A-Z0-9_-]{2,40}")
PUBLIC_LOCATOR = re.compile(r"(?:(?:paragraph|table|row|page|line|section):\d{1,5}(?:[.-]\d{1,5}){0,2}|field:(?:registered_on|effective_on|loan_start|transfer_on|termination_on))")
PRIVATE_KEYS = {"private_note", "private_notes", "email", "phone", "address", "password", "secret",
                "access_token", "refresh_token", "authorization", "credentials", "api_key"}
CANDIDATE_KEYS = {"source_id", "kind", "name_as_published", "gender", "team_as_published", "candidate_id",
                  "source_version", "source_url", "source_title", "source_type", "published_at", "source_body_sha256",
                  "season", "observed", "effective_date", "effective_date_basis", "parser_confidence", "blocking_reasons",
                  "revision_id", "review_status"}
NEWS_KEYS = {"candidate_id", "source_id", "source_type", "publisher", "title", "url", "feed_url", "published_at",
             "published_at_raw", "status", "may_update_player_master", "revision_id", "first_seen_at"}
EXPORT_KEYS = {"event_id", "player_id", "kind", "gender", "season", "candidate_id", "revision_id", "source_id",
               "source_version", "source_url", "published_at", "effective_date", "effective_date_basis",
               "effective_date_evidence", "observed", "team_as_published", "identity_basis", "reviewer", "reviewed_at", "status"}


def public_keys(value, allowed, label):
    if not isinstance(value, dict) or set(value) - set(allowed):
        raise ValueError(f"Unexpected fields in public {label}; original input retained, publication blocked")


def public_security_scan(value):
    """Do not echo rejected content. Covers historical records as well as new ones."""
    if isinstance(value, dict):
        if any(str(key).casefold() in PRIVATE_KEYS for key in value):
            raise ValueError("Private field in public output; publication blocked")
        for item in value.values():
            public_security_scan(item)
    elif isinstance(value, list):
        for item in value:
            public_security_scan(item)
    elif isinstance(value, str):
        if re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", value):
            raise ValueError("Email-like value in public output; publication blocked")
        if re.search(r"(?<![A-Za-z0-9])(?:01[016789]|\+82[-. ]?1[016789])[-. ]?\d{3,4}[-. ]?\d{4}(?![A-Za-z0-9])", value):
            raise ValueError("Phone-like value in public output; publication blocked")
        if re.search(r"-----BEGIN .*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._-]+", value, re.I):
            raise ValueError("Credential-like value in public output; publication blocked")
        for url in re.findall(r"https?://[^\s<>\"']+", value):
            parsed = urlsplit(url)
            if parsed.username or parsed.password or any(SENSITIVE_QUERY.search(key) for key, _ in parse_qsl(parsed.query, keep_blank_values=True)):
                raise ValueError("Authenticated or signed URL in public output; publication blocked")


def validate_public_ledger(data):
    if not data:
        return
    public_keys(data, {"schema_version", "master_connection", "scope", "candidates", "review_issues"}, "candidate ledger")
    for row in data.get("candidates", []):
        public_keys(row, CANDIDATE_KEYS, "candidate")
        public_keys(row.get("observed", {}), EVENT_FIELDS, "observed fields")
    for issue in data.get("review_issues", []):
        public_keys(issue, {"revision_id", "reason", "reasons"}, "review issue")
    public_security_scan(data)


def validate_public_news(data):
    if not data:
        return
    public_keys(data, {"schema_version", "scope", "candidates"}, "news ledger")
    for row in data.get("candidates", []):
        public_keys(row, NEWS_KEYS, "news candidate")
        if row.get("status") != "unverified_report" or row.get("may_update_player_master") is not False:
            raise ValueError("News must remain unverified metadata")
    public_security_scan(data)


def valid_date_evidence(evidence, source_url, effective):
    return (isinstance(evidence, dict) and set(evidence) == {"source_url", "locator", "asserted_date"}
            and evidence.get("source_url") == source_url and evidence.get("asserted_date") == effective
            and PUBLIC_LOCATOR.fullmatch(str(evidence.get("locator", ""))) is not None)


def validate_public_export(data):
    public_keys(data, {"schema_version", "master_connection", "status", "events"}, "event export")
    for event in data.get("events", []):
        public_keys(event, EXPORT_KEYS, "reviewed event")
        public_keys(event.get("observed", {}), EVENT_FIELDS, "observed fields")
        if not PUBLIC_OPERATOR.fullmatch(str(event.get("reviewer", ""))):
            raise ValueError("Public operator ID required; publication blocked")
        if event.get("kind") != "roster_snapshot" and not valid_date_evidence(event.get("effective_date_evidence"), event.get("source_url"), event.get("effective_date")):
            raise ValueError("Structured official source locator required; publication blocked")
    public_security_scan(data)


def validate_public_reviews(data):
    public_keys(data, {"schema_version", "scope", "reviews"}, "review manifest")
    keys = {"candidate_id", "revision_id", "source_version", "source_url", "decision", "player_id", "identity_basis",
            "effective_date", "effective_date_basis", "effective_date_evidence", "reviewer", "reviewed_at"}
    for review in data.get("reviews", []):
        public_keys(review, keys, "review decision")
        if not PUBLIC_OPERATOR.fullmatch(str(review.get("reviewer", ""))):
            raise ValueError("Public operator ID required in review manifest")
        if review.get("effective_date_evidence") and not valid_date_evidence(review["effective_date_evidence"], review.get("source_url"), review.get("effective_date")):
            raise ValueError("Public structured source locator required in review manifest")
    public_security_scan(data)


def validate_public_outputs(output_dir=DEFAULT, notice_dir=None):
    for filename, validator in (("official_candidates.json", validate_public_ledger),
                                ("news_candidates.json", validate_public_news),
                                ("reviewed_events.json", validate_public_export),
                                ("reviewed_mappings.json", validate_public_reviews)):
        if (output_dir / filename).exists():
            validator(read(output_dir / filename))
    for filename in ("config.json", "master_targets.json", "master_change_plan.json"):
        if (output_dir / filename).exists():
            public_security_scan(read(output_dir / filename))
    if notice_dir:
        for path in notice_dir.glob("*.json"):
            public_security_scan(read(path))
        for filename, fields in (("registration_rows.csv", ROSTER_CSV_FIELDS), ("change_events.csv", EVENT_CSV_FIELDS)):
            path = notice_dir / filename
            if path.exists():
                with path.open(encoding="utf-8-sig", newline="") as stream:
                    rows = csv.DictReader(stream)
                    if set(rows.fieldnames or []) - set(fields):
                        raise ValueError("Unexpected public CSV columns; publication blocked")
                    for row in rows:
                        public_security_scan(row)


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode()).hexdigest()


def read(path, default=None):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def iso_date(value):
    try:
        return date.fromisoformat(str(value)).isoformat()
    except (TypeError, ValueError):
        return ""


def monitoring_status(config, today=None):
    window = config.get("monitoring_window", {})
    required = ("starts_on", "ends_on", "review_due_on")
    if any(not iso_date(window.get(key)) for key in required):
        raise ValueError("explicit valid monitoring start, end and review dates required")
    if not window["starts_on"] <= window["review_due_on"] <= window["ends_on"]:
        raise ValueError("review date must be within the monitoring window")
    if (date.fromisoformat(window["ends_on"]) - date.fromisoformat(window["starts_on"])).days > 366:
        raise ValueError("monitoring window must be reviewed at least annually")
    today = today or datetime.now(ZoneInfo(window.get("timezone", "Asia/Seoul"))).date().isoformat()
    if not iso_date(today):
        raise ValueError("invalid monitoring date")
    reason = "active"
    if window.get("enabled") is not True:
        reason = "disabled"
    elif today < window["starts_on"]:
        reason = "before_monitoring_start"
    elif today > window["ends_on"]:
        reason = "monitoring_ended"
    elif today >= window["review_due_on"]:
        reason = "season_review_due"
    return {"allowed": reason == "active", "reason": reason, "today": today,
            "season": window.get("season", ""), "starts_on": window["starts_on"],
            "ends_on": window["ends_on"], "review_due_on": window["review_due_on"],
            "season_rollover": "manual_review_required"}


def notice_season(notice, record, index):
    match = re.search(r"(20\d{2})\s*[-/]\s*(20\d{2}|\d{2})", notice.get("title", ""))
    if match:
        return f"{match[1]}-{match[2][-2:]}"
    return record.get("season") or index.get("season", "")


def known_player_ids():
    result = set()
    for name in ("data/master/player_master_229_v2.json", "data/master/player_master_school_v1.json",
                 "data/national/player_id_links_v1.json"):
        data = read(ROOT / name, [])
        for player in data if isinstance(data, list) else data.get("players", data.get("links", [])):
            ident = player.get("player_id") or player.get("system", {}).get("player_id")
            if ident:
                result.add(ident)
    return result


def official_candidates(index):
    """Use source identity and observed fields; never match a name to a Player_ID."""
    candidates = []
    for notice in index.get("notices", []):
        source_id = f"KVL-SRC-KOVO-NOTICE-{notice['id']}"
        source_version = digest({key: notice.get(key, "") for key in
                                 ("id", "title", "published_at", "html_sha256")})
        records = [dict(p, kind="roster_snapshot", confidence="review") for p in notice.get("players", [])]
        records += notice.get("events", [])
        for record in records:
            kind = record.get("kind", "other_player_notice")
            observed = {key: record.get(key, "") for key in EVENT_FIELDS}
            if kind == "roster_snapshot":
                observed["jersey_number"] = record.get("number", "")
            identity = {"source_id": source_id, "kind": kind,
                        "name_as_published": record.get("player_name", "").strip(),
                        "gender": record.get("gender") or notice.get("gender", ""),
                        "team_as_published": notice.get("team", "")}
            basis = record.get("effective_date_basis", "legacy_unverified")
            effective = iso_date(record.get("effective_date")) if basis in {
                "explicit_effective_date", "loan_start"} else ""
            candidate = dict(identity, candidate_id="KVL-PC-" + digest(identity)[:24],
                             source_version=source_version, source_url=notice.get("source_url", ""),
                             source_title=notice.get("title", ""), source_type="official_notice",
                             published_at=notice.get("published_at", ""),
                             source_body_sha256=notice.get("html_sha256", ""),
                             season=notice_season(notice, record, index),
                             observed=observed, effective_date=effective,
                             effective_date_basis=basis, parser_confidence=record.get("confidence", "review"))
            reasons = []
            if kind != "roster_snapshot" and kind != detect_kind(notice.get("title", "")):
                reasons.append("source_parser_refresh_required")
            if not re.fullmatch(r"[0-9a-f]{64}", candidate["source_body_sha256"]):
                reasons.append("missing_source_version")
            if kind not in KINDS:
                reasons.append("unsupported_notice_kind")
            if re.search(r"[,，、]|\s및\s", identity["name_as_published"]):
                reasons.append("multiple_names_require_separate_evidence")
            if not identity["name_as_published"] or not identity["gender"] or not identity["team_as_published"]:
                reasons.append("missing_identity_context")
            if kind == "transfer" and not (observed["from_team"] and observed["to_team"]):
                reasons.append("transfer_missing_explicit_teams")
            candidate["blocking_reasons"] = reasons
            candidates.append(candidate)
    counts = Counter(c["candidate_id"] for c in candidates)
    unique = {}
    for candidate in candidates:
        if counts[candidate["candidate_id"]] > 1:
            candidate["blocking_reasons"].append("duplicate_identity_in_notice")
        candidate["revision_id"] = "KVL-PCR-" + digest(candidate)
        unique[candidate["revision_id"]] = candidate
    return list(unique.values())


def review_export(candidates, decisions, player_ids):
    """A revision-specific, human-reviewed plan, with no live write side effect."""
    by_revision = {candidate["revision_id"]: candidate for candidate in candidates}
    seen, approved, rejected, issues = set(), [], set(), []
    for decision in decisions:
        revision = decision.get("revision_id", "")
        candidate = by_revision.get(revision)
        problems = []
        if revision in seen:
            raise ValueError("duplicate review for one revision")
        seen.add(revision)
        if not candidate:
            issues.append({"revision_id": revision, "reason": "stale_or_unknown_revision"})
            continue
        if decision.get("source_version") != candidate["source_version"] or decision.get("candidate_id") != candidate["candidate_id"]:
            problems.append("review_not_pinned_to_source_version")
        if not PUBLIC_OPERATOR.fullmatch(str(decision.get("reviewer", ""))) or not iso_date(decision.get("reviewed_at")):
            problems.append("public_operator_id_and_review_date_required")
        if decision.get("decision") == "reject" and not problems:
            rejected.add(revision)
            continue
        if decision.get("decision") != "approve":
            problems.append("decision_must_be_approve_or_reject")
        pid = decision.get("player_id", "")
        if pid not in player_ids:
            problems.append("player_id_not_in_existing_canonical_registry")
        if decision.get("identity_basis") not in {"canonical_id_review", "name_birth_date_review", "official_registration_id_review"}:
            problems.append("reviewed_identity_basis_required")
        if decision.get("source_url") != candidate["source_url"]:
            problems.append("review_source_mismatch")
        effective = iso_date(decision.get("effective_date"))
        if candidate["kind"] != "roster_snapshot":
            if not effective or decision.get("effective_date_basis") != "official_notice_text" or not valid_date_evidence(decision.get("effective_date_evidence"), candidate["source_url"], effective):
                problems.append("reviewed_effective_date_and_evidence_required")
        if candidate["kind"] == "loan" and not (candidate["observed"]["destination"] and candidate["observed"]["loan_start"]):
            problems.append("loan_missing_destination_or_start")
        if candidate["kind"] in {"position_change", "number_change"} and not candidate["observed"]["new_" + ("position" if candidate["kind"] == "position_change" else "number")]:
            problems.append("change_missing_new_value")
        problems += candidate["blocking_reasons"]
        if problems:
            issues.append({"revision_id": revision, "reasons": sorted(set(problems))})
            continue
        role = "snapshot" if candidate["kind"] == "roster_snapshot" else "change"
        approved.append({"event_id": "KVL-PE-" + digest([pid, candidate["source_id"], role])[:24],
                         "player_id": pid, "kind": candidate["kind"],
                         "gender": candidate["gender"], "season": candidate["season"],
                         "candidate_id": candidate["candidate_id"], "revision_id": revision,
                         "source_id": candidate["source_id"], "source_version": candidate["source_version"],
                         "source_url": candidate["source_url"], "published_at": candidate["published_at"],
                         "effective_date": effective if candidate["kind"] != "roster_snapshot" else "",
                         "effective_date_basis": decision.get("effective_date_basis", ""),
                         "effective_date_evidence": decision.get("effective_date_evidence", {}) if candidate["kind"] != "roster_snapshot" else {},
                         "observed": candidate["observed"], "team_as_published": candidate["team_as_published"],
                         "identity_basis": decision["identity_basis"], "reviewer": decision["reviewer"],
                         "reviewed_at": decision["reviewed_at"], "status": "reviewed_export_not_applied"})
    duplicates = Counter(event["event_id"] for event in approved)
    for event in approved:
        if duplicates[event["event_id"]] > 1:
            issues.append({"revision_id": event["revision_id"], "reason": "multiple_candidates_for_same_official_player_event"})
    return [event for event in approved if duplicates[event["event_id"]] == 1], rejected, issues


def build_ledger(index, previous, decisions, player_ids):
    validate_public_ledger(previous)
    current = official_candidates(index)
    approved, rejected, issues = review_export(current, decisions, player_ids)
    approved_ids = {event["revision_id"] for event in approved}
    incoming = {candidate["revision_id"] for candidate in current}
    current_sources = {f"KVL-SRC-KOVO-NOTICE-{notice['id']}" for notice in index.get("notices", [])}
    # Preserve history even when a bounded scan does not return an older notice.
    history = []
    for old in previous.get("candidates", []):
        if old["revision_id"] not in incoming:
            item = dict(old)
            if item["source_id"] in current_sources:
                item["review_status"] = "superseded_requires_new_review"
            history.append(item)
    for item in current:
        item["review_status"] = "reviewed_export_not_applied" if item["revision_id"] in approved_ids else (
            "rejected" if item["revision_id"] in rejected else "needs_review")
    ledger = {"schema_version": 1, "master_connection": "NOT_CONNECTED",
            "scope": "Official source candidates; human identity/effective-date review required. No absence-derived events.",
            "candidates": sorted(history + current, key=lambda item: (item["source_id"], item["candidate_id"], item["revision_id"])),
            "review_issues": issues}
    exported = {"schema_version": 1, "master_connection": "NOT_CONNECTED",
                "status": "reviewed_export_only", "events": approved}
    validate_public_ledger(ledger)
    validate_public_export(exported)
    return ledger, exported


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, value):
        self.parts.append(value)


def plain(value):
    parser = PlainText()
    parser.feed(value or "")
    return re.sub(r"\s+", " ", "".join(parser.parts)).strip()[:500]


def safe_url(value, hosts):
    split = urlsplit(value)
    if split.scheme != "https" or split.hostname not in hosts or split.username or split.password or split.port not in (None, 443):
        raise ValueError("URL must use an allowlisted publisher HTTPS host")
    pairs = parse_qsl(split.query, keep_blank_values=True)
    if any(SENSITIVE_QUERY.search(key) for key, _ in pairs):
        raise ValueError("Credential or signature query parameters cannot be retained")
    query = [(k, v) for k, v in pairs
             if not k.casefold().startswith("utm_") and k.casefold() not in {"fbclid", "gclid"}]
    return urlunsplit(("https", split.hostname, split.path or "/", urlencode(query), ""))


def parse_feed(data, source, keywords):
    if len(data) > MAX_FEED_BYTES or re.search(br"<!\s*(?:DOCTYPE|ENTITY)", data, re.I):
        raise ValueError("oversized feed or XML entities are not allowed")
    root = ET.fromstring(data)
    atom = "{http://www.w3.org/2005/Atom}"
    is_atom = root.tag == atom + "feed"
    if root.tag != "rss" and not is_atom:
        raise ValueError("not an RSS/Atom feed")
    entries = root.findall(atom + "entry") if is_atom else root.findall("./channel/item")
    result = []
    for entry in entries[:500]:
        title = plain(entry.findtext(atom + "title" if is_atom else "title"))
        if not title or not any(word.casefold() in title.casefold() for word in keywords):
            continue
        if is_atom:
            link = next((el.get("href", "") for el in entry.findall(atom + "link") if el.get("rel", "alternate") == "alternate"), "")
            raw_date = entry.findtext(atom + "published") or entry.findtext(atom + "updated") or ""
        else:
            link, raw_date = entry.findtext("link") or "", entry.findtext("pubDate") or ""
        try:
            url = safe_url(link.strip(), source["article_hosts"])
        except ValueError:
            continue
        try:
            when = datetime.fromisoformat(raw_date.replace("Z", "+00:00")) if is_atom else parsedate_to_datetime(raw_date)
            published_at = when.isoformat() if when.tzinfo else ""
        except (TypeError, ValueError, OverflowError):
            published_at = ""
        item = {"candidate_id": "KVL-NEWS-" + digest(url)[:24], "source_id": source["id"],
                "source_type": "publisher_rss", "publisher": source["publisher"], "title": title,
                "url": url, "feed_url": source["url"], "published_at": published_at,
                "published_at_raw": raw_date[:100], "status": "unverified_report",
                "may_update_player_master": False}
        item["revision_id"] = digest(item)
        result.append(item)
    return result


def fetch_feed(source):
    hosts = source["feed_hosts"]
    url = safe_url(source["url"], hosts)

    class PublisherRedirect(HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            safe_url(newurl, hosts)
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    request = Request(url, headers={"User-Agent": "KVL-Public-RSS-Metadata/1.0 (+https://github.com/kvolleylab/kvolleylab)",
                                   "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with build_opener(PublisherRedirect()).open(request, timeout=20) as response:
        return response.read(MAX_FEED_BYTES + 1)


def collect_news(config, previous, fetch=fetch_feed, now=None):
    validate_public_news(previous)
    now = now or datetime.now(timezone.utc).isoformat()
    records = {item["revision_id"]: item for item in previous.get("candidates", [])}
    report = []
    for source in config.get("news_sources", []):
        if not source.get("enabled"):
            continue
        try:
            items = parse_feed(fetch(source), source, config.get("news_keywords", []))
            for item in items:
                if item["revision_id"] not in records:
                    records[item["revision_id"]] = dict(item, first_seen_at=now)
            report.append({"source_id": source["id"], "status": "ok", "matched_titles": len(items)})
        except Exception as error:
            # Independent publisher failures never erase candidates or stop official notices.
            report.append({"source_id": source["id"], "status": "error", "error_type": type(error).__name__})
    result = {"schema_version": 1, "scope": "Title/link/date metadata only; title filter has incomplete coverage; no official player facts.",
              "candidates": sorted(records.values(), key=lambda item: (item["candidate_id"], item["revision_id"]))}
    validate_public_news(result)
    return result, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", type=Path, default=ROOT / "data/kovo/official-notices/2026-27/index.json")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT)
    parser.add_argument("--reviews", type=Path, default=DEFAULT / "reviewed_mappings.json")
    parser.add_argument("--config", type=Path, default=DEFAULT / "config.json")
    parser.add_argument("--collect-news", action="store_true")
    parser.add_argument("--check-window", action="store_true", help="Check dates before any network collection")
    parser.add_argument("--github-output", type=Path)
    parser.add_argument("--validate-public", action="store_true", help="Fail closed on private fields or credentials before committing public output")
    args = parser.parse_args()
    if args.validate_public:
        validate_public_outputs(args.output_dir, args.index.parent)
        print("PUBLIC_OUTPUT_VALIDATION_OK")
        return
    config = read(args.config, {})
    guard = monitoring_status(config)
    if args.github_output:
        with args.github_output.open("a", encoding="utf-8") as output:
            output.write("active=" + str(guard["allowed"]).lower() + "\n")
    if args.check_window or not guard["allowed"]:
        write(args.output_dir / "run_report.json", {"monitoring": guard, "master_connection": "NOT_CONNECTED"})
        print(json.dumps({"monitoring": guard}, ensure_ascii=False))
        return
    index = read(args.index)
    if not index or not isinstance(index.get("notices"), list):
        raise ValueError("valid official notice index required")
    review = read(args.reviews, {"reviews": []})
    ledger, export = build_ledger(index, read(args.output_dir / "official_candidates.json", {}), review["reviews"], known_player_ids())
    write(args.output_dir / "official_candidates.json", ledger)
    write(args.output_dir / "reviewed_events.json", export)
    news_report = []
    if args.collect_news:
        news, news_report = collect_news(config, read(args.output_dir / "news_candidates.json", {}))
        write(args.output_dir / "news_candidates.json", news)
    summary = {"run_utc": datetime.now(timezone.utc).isoformat(), "official_candidates": len(ledger["candidates"]),
               "reviewed_events": len(export["events"]), "review_issues": ledger["review_issues"],
               "master_connection": "NOT_CONNECTED", "monitoring": guard,
               "news_fetch_requested": args.collect_news, "news_sources": news_report}
    write(args.output_dir / "run_report.json", summary)
    print(json.dumps(summary, ensure_ascii=False))
    for source in news_report:
        if source["status"] == "error":
            print(f"::warning title=RSS metadata collection failed::{source['source_id']}: {source['error_type']}; prior candidates retained")


if __name__ == "__main__":
    main()

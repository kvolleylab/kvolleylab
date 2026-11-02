"""Read the five public KOVO sources for the approved one-player observation.

This adapter observes a current value, not a historical effective date.  Its
fixed URLs, identity and reviewed hashes cannot be expanded by runtime input.
No source body, provider audit fields or credentials are returned or written.
"""
import hashlib
import json
from datetime import date, datetime, timezone
from urllib.error import HTTPError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from kovo_official_change_events import date_iso, extract_lines, parse_events, value


API = "https://user-api.kovo.co.kr"
NOTICE_URL = "https://kovo.co.kr/news/official-notices/157018"
NOTICE_API_URL = API + "/contents/news/official-notices/157018"
ROSTER_URL = API + "/teams/1009/players"
PROFILE_URL = API + "/players/0001550"
CURRENT_SEASON_URL = API + "/main/game/season"
SEASONS_URL = API + "/matches/001/seasons"
SOURCE_URLS = (NOTICE_API_URL, ROSTER_URL, PROFILE_URL, CURRENT_SEASON_URL, SEASONS_URL)
NOTICE_TITLE = "2026-2027시즌 우리카드 선수 배번 변경 등록"
NOTICE_HTML_SHA256 = "bf8be0d5a538ef75fdada84e7befb39ce7bd8b12551ed97734d1555a97d47579"
CURRENT_NORMALIZED_SHA256 = "36193372cc161608ac02826cd1f97759aac72908cc0548072aaf65b40b7c2331"
MAX_RESPONSE_BYTES = 2_000_000
TIMEOUT_SECONDS = 18
PROFILE_FIELDS = ("playerCode", "teamCode", "teamName", "name", "position", "backNumber", "birthDate")
IDENTITY = {"playerCode": "0001550", "teamCode": "1009", "name": "오재성", "birthDate": "1992-04-02"}
ERROR_CODES = frozenset({
    "source_time_invalid", "source_url_not_allowed", "source_redirect_blocked",
    "source_http_failed", "source_response_too_large", "source_json_invalid",
    "source_envelope_invalid", "source_fetch_failed", "source_validation_failed",
    "notice_identity_mismatch", "notice_body_ambiguous", "notice_revision_changed",
    "notice_publication_date_invalid", "notice_player_ambiguous", "notice_change_mismatch",
    "current_roster_invalid", "current_player_ambiguous", "current_player_identity_mismatch",
    "current_registration_invalid", "current_profile_mismatch",
    "current_normalized_revision_changed", "current_season_changed", "current_season_invalid",
})


class CurrentValueSourceError(RuntimeError):
    """Only a fixed, non-sensitive error code is safe for a runtime report."""

    def __init__(self, code):
        self.code = code if isinstance(code, str) and code in ERROR_CODES else "source_validation_failed"
        super().__init__(self.code)


def _require(condition, code):
    if not condition:
        raise CurrentValueSourceError(code)


def _sha256(value):
    canonical = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _utcnow():
    return datetime.now(timezone.utc)


def _clock(now):
    if now is None:
        return lambda: _utcnow().isoformat()
    try:
        instant = datetime.fromisoformat(now.replace("Z", "+00:00")) if isinstance(now, str) else now
        _require(isinstance(instant, datetime) and instant.tzinfo is not None
                 and instant.utcoffset() is not None, "source_time_invalid")
        stamp = instant.astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError, OverflowError):
        raise CurrentValueSourceError("source_time_invalid") from None
    return lambda: stamp


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise CurrentValueSourceError("source_redirect_blocked")


def _unique_json_object(pairs):
    result = {}
    for key, item in pairs:
        _require(key not in result, "source_json_invalid")
        result[key] = item
    return result


def _invalid_json_constant(_value):
    raise CurrentValueSourceError("source_json_invalid")


def _fetch_json(url):
    """Fixed HTTPS GETs, verified TLS, no redirects, bounded response, no retries."""
    _require(url in SOURCE_URLS, "source_url_not_allowed")
    request = Request(url, headers={
        "Accept": "application/json", "Accept-Language": "ko",
        "Origin": "https://kovo.co.kr", "Referer": NOTICE_URL,
        "User-Agent": "KVolleyLab-Current-Value-Observation/1.0",
    }, method="GET")
    try:
        with build_opener(_NoRedirect()).open(request, timeout=TIMEOUT_SECONDS) as response:
            _require(response.status == 200, "source_http_failed")
            _require(response.geturl() == url, "source_redirect_blocked")
            raw = response.read(MAX_RESPONSE_BYTES + 1)
            _require(len(raw) <= MAX_RESPONSE_BYTES, "source_response_too_large")
        try:
            return json.loads(raw, object_pairs_hook=_unique_json_object, parse_constant=_invalid_json_constant)
        except (UnicodeError, ValueError, TypeError, RecursionError):
            raise CurrentValueSourceError("source_json_invalid") from None
    except CurrentValueSourceError:
        raise
    except HTTPError as exc:
        code = "source_redirect_blocked" if 300 <= exc.code < 400 else "source_http_failed"
        raise CurrentValueSourceError(code) from None
    except Exception:
        raise CurrentValueSourceError("source_fetch_failed") from None


def _read(url, fetch_json, clock):
    try:
        envelope = fetch_json(url)
    except CurrentValueSourceError as exc:
        raise CurrentValueSourceError(exc.code) from None
    except Exception:
        raise CurrentValueSourceError("source_fetch_failed") from None
    fetched_at = clock()  # Completion time, never the start of the five-request run.
    _require(isinstance(envelope, dict), "source_envelope_invalid")
    result = envelope.get("result")
    _require(isinstance(result, dict) and type(result.get("status")) is int
             and result["status"] == 200 and envelope.get("payload") is not None,
             "source_envelope_invalid")
    return envelope["payload"], fetched_at


def _korean_text(items, field, code):
    _require(isinstance(items, list) and all(isinstance(item, dict) for item in items), code)
    texts = [item.get(field) for item in items if item.get("languageCode") in ("ko", "kor")]
    _require(bool(texts) and all(isinstance(text, str) and text for text in texts), code)
    _require(len(set(texts)) == 1, code)
    return texts[0]


def _notice(payload, fetched_at):
    _require(isinstance(payload, dict) and type(payload.get("id")) is int
             and payload["id"] == 157018 and payload.get("visible") is True
             and payload.get("isDeleted") is False and payload.get("deletedAt") is None,
             "notice_identity_mismatch")
    title = _korean_text(payload.get("titles"), "title", "notice_identity_mismatch")
    _require(title == NOTICE_TITLE, "notice_identity_mismatch")
    body = _korean_text(payload.get("bodies"), "body", "notice_body_ambiguous")
    body_sha256 = hashlib.sha256(body.encode("utf-8")).hexdigest()
    _require(body_sha256 == NOTICE_HTML_SHA256, "notice_revision_changed")
    published = [date_iso(value(line, ["공시일"])) for line in extract_lines(body)
                 if value(line, ["공시일"])]
    _require(published == ["2026-09-16"], "notice_publication_date_invalid")
    events = parse_events(body, title, 157018, published[0], "number_change", "우리카드", "남", NOTICE_URL)
    matches = [event for event in events if event.get("player_name") == "오재성"]
    _require(len(matches) == 1, "notice_player_ambiguous")
    event = matches[0]
    _require(event.get("season") == "2026-27" and event.get("previous_number") == "3"
             and event.get("new_number") == "5" and event.get("confidence") == "high"
             and event.get("effective_date_basis") == "notice_date_fallback",
             "notice_change_mismatch")
    return {"id": 157018, "url": NOTICE_URL, "html_sha256": body_sha256,
            "published_at": published[0], "fetched_at": fetched_at, "player_name": "오재성",
            "previous_value": "3", "value": "5", "effective_date": None}


def _roster_player(payload):
    _require(isinstance(payload, list) and 1 <= len(payload) <= 500
             and all(isinstance(row, dict) for row in payload), "current_roster_invalid")
    matches = [row for row in payload if row.get("playerCode") == IDENTITY["playerCode"]]
    _require(len(matches) == 1, "current_player_ambiguous")
    identifiers = [row.get("playerCode") for row in payload]
    _require(all(isinstance(ident, str) and ident for ident in identifiers)
             and len(set(identifiers)) == len(identifiers), "current_roster_invalid")
    player = matches[0]
    _require(all(player.get(key) == expected for key, expected in IDENTITY.items()),
             "current_player_identity_mismatch")
    _require(player.get("status") == ["REGISTER"] and player.get("visible") is True
             and player.get("isTemp") is False, "current_registration_invalid")
    _require(type(player.get("backNumber")) is int and isinstance(player.get("position"), str),
             "current_roster_invalid")
    return player


def _current_values(profile, roster):
    _require(isinstance(profile, dict) and all(key in profile for key in PROFILE_FIELDS),
             "current_profile_mismatch")
    _require(all(profile.get(key) == expected for key, expected in IDENTITY.items()),
             "current_player_identity_mismatch")
    _require(type(profile.get("backNumber")) is int and profile.get("teamName") == "우리카드"
             and roster.get("teamName") in (None, "우리카드")
             and all(profile[key] == roster.get(key) for key in PROFILE_FIELDS if key != "teamName"),
             "current_profile_mismatch")
    selected = {key: profile[key] for key in PROFILE_FIELDS}
    digest = _sha256(selected)
    _require(digest == CURRENT_NORMALIZED_SHA256, "current_normalized_revision_changed")
    return digest


def _season_context(current, seasons):
    _require(isinstance(current, dict), "current_season_invalid")
    _require(current.get("seasonCode") == "023" and current.get("gcode") == "001",
             "current_season_changed")
    _require(isinstance(seasons, list) and all(isinstance(season, dict) for season in seasons),
             "current_season_invalid")
    matches = [season for season in seasons if season.get("season") == "023"]
    _require(len(matches) == 1, "current_season_invalid")
    selected = matches[0]
    _require(selected.get("match") == "001" and selected.get("sname") == "2026-2027 V-리그"
             and selected.get("name") == "HK흥국금융 2026~2027 V-리그", "current_season_changed")
    config = selected.get("config")
    _require(isinstance(config, dict) and config.get("visible") is True, "current_season_invalid")
    try:
        opened, closed = (date.fromisoformat(selected[key]) for key in ("openedAt", "closedAt"))
        _require(opened.isoformat() == selected["openedAt"] and closed.isoformat() == selected["closedAt"]
                 and opened < closed, "current_season_invalid")
    except (TypeError, ValueError, KeyError):
        raise CurrentValueSourceError("current_season_invalid") from None
    # Only the current context and selected season enter this hash.  Changes to
    # other seasons, or unrelated provider metadata, are not this observation.
    context = {"current": {key: current[key] for key in ("gcode", "seasonCode")},
               "selected_season": {key: selected[key] for key in
                   ("match", "season", "name", "sname", "openedAt", "closedAt")}}
    return _sha256(context)


def collect_source_evidence(*, now=None, fetch_json=None):
    """Return the core's sanitized evidence contract after five fixed GETs.

    ``fetch_json(url)`` may be injected for tests and must return a KOVO JSON
    envelope. ``now`` is an aware datetime/ISO instant for deterministic tests;
    without it, each fetched_at is recorded after that actual request returns.
    This function does not manage approval, execution periods, or MASTER writes.
    """
    clock = _clock(now)
    fetcher = _fetch_json if fetch_json is None else fetch_json
    _require(callable(fetcher), "source_fetch_failed")
    try:
        raw_notice, notice_time = _read(NOTICE_API_URL, fetcher, clock)
        notice = _notice(raw_notice, notice_time)
        raw_roster, roster_time = _read(ROSTER_URL, fetcher, clock)
        roster = _roster_player(raw_roster)
        profile, profile_time = _read(PROFILE_URL, fetcher, clock)
        digest = _current_values(profile, roster)
        current_season, _ = _read(CURRENT_SEASON_URL, fetcher, clock)
        seasons, _ = _read(SEASONS_URL, fetcher, clock)
        season_digest = _season_context(current_season, seasons)
        return {
            "schema_version": 1,
            "scope": {"player_id": "KVL-P-001585", "season": "2026-27", "gender": "남",
                      "team": "우리카드", "field": "number", "value": "5"},
            "notice": notice,
            "current": {
                "roster_url": ROSTER_URL, "profile_url": PROFILE_URL,
                "official_player_id": "0001550", "normalized_sha256": digest,
                "fetched_at": roster_time, "profile_fetched_at": profile_time, "source_as_of": None,
                "player_name": "오재성", "birth_date": "1992-04-02", "team_id": "1009",
                "number": "5", "position": "L", "status": "REGISTER", "visible": True,
                "roster_match_count": 1, "profile_matches_roster": True,
                "season_context_verified": True, "season_context_sha256": season_digest,
                "season_basis": "official_current_context_only",
            },
            "observed_at": clock(),
        }
    except CurrentValueSourceError as exc:
        raise CurrentValueSourceError(exc.code) from None
    except Exception:
        raise CurrentValueSourceError("source_validation_failed") from None

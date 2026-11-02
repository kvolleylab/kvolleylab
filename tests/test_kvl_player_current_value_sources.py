"""Read-only source scope, identity, date semantics and transport boundaries."""
import copy
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kvl_player_current_value_sources as sources


NOW = datetime(2026, 11, 3, 1, 2, 3, tzinfo=timezone.utc)
# Minimal test HTML, not an archived official notice.  Production uses its
# independently reviewed full-body hash; tests substitute only this fixture's.
BODY = "<p>선수명 : 오재성</p><p>변경전/변경후 : 3번 -&gt; 5번</p><p>공시일 : 2026년 9월 16일</p>"
BODY_HASH = hashlib.sha256(BODY.encode()).hexdigest()


def envelope(payload):
    return {"result": {"status": 200, "message": "OK"}, "payload": payload}


def fixtures():
    player = {"playerCode": "0001550", "teamCode": "1009", "teamName": "우리카드",
              "name": "오재성", "position": "L", "backNumber": 5, "birthDate": "1992-04-02"}
    roster = {**player, "teamName": None, "status": ["REGISTER"], "visible": True,
              "isTemp": False, "modifiedAt": "2026-10-19T09:45:58.407212"}
    notice = {"id": 157018, "visible": True, "isDeleted": False, "deletedAt": None,
              "createdAt": "2026-09-15T00:00:00",  # Deliberately not the body publication date.
              "titles": [{"languageCode": "ko", "title": sources.NOTICE_TITLE}],
              "bodies": [{"languageCode": "ko", "platform": "PC", "body": BODY}]}
    season = {"match": "001", "season": "023", "name": "HK흥국금융 2026~2027 V-리그",
              "sname": "2026-2027 V-리그", "openedAt": "2026-10-31", "closedAt": "2027-04-22",
              "config": {"visible": True}}
    return {sources.NOTICE_API_URL: envelope(notice), sources.ROSTER_URL: envelope([roster]),
            sources.PROFILE_URL: envelope(player),
            sources.CURRENT_SEASON_URL: envelope({"seasonCode": "023", "gcode": "001"}),
            sources.SEASONS_URL: envelope([season])}


class FakeResponse:
    def __init__(self, raw, url=sources.NOTICE_API_URL, status=200):
        self.raw, self.url, self.status, self.limit = raw, url, status, None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def geturl(self):
        return self.url

    def read(self, limit):
        self.limit = limit
        return self.raw[:limit]


class CurrentValueSourcesTests(unittest.TestCase):
    def setUp(self):
        self.data, self.calls = fixtures(), []
        self.hash_patch = patch.object(sources, "NOTICE_HTML_SHA256", BODY_HASH)
        self.hash_patch.start()
        self.addCleanup(self.hash_patch.stop)

    def fetch(self, url):
        self.calls.append(url)
        return copy.deepcopy(self.data[url])

    def collect(self, **kwargs):
        return sources.collect_source_evidence(now=NOW, fetch_json=self.fetch, **kwargs)

    def assert_blocked(self, code):
        with self.assertRaises(sources.CurrentValueSourceError) as caught:
            self.collect()
        self.assertEqual(str(caught.exception), code)
        self.assertEqual(caught.exception.code, code)

    def test_five_fixed_gets_return_current_observation_with_no_inferred_effective_date(self):
        report = self.collect()
        self.assertEqual(self.calls, list(sources.SOURCE_URLS))
        self.assertEqual(report["scope"], {"player_id": "KVL-P-001585", "season": "2026-27",
                         "gender": "남", "team": "우리카드", "field": "number", "value": "5"})
        self.assertEqual(report["notice"]["published_at"], "2026-09-16")
        self.assertIsNone(report["notice"]["effective_date"])
        self.assertIsNone(report["current"]["source_as_of"])
        self.assertEqual(report["current"]["normalized_sha256"], sources.CURRENT_NORMALIZED_SHA256)
        self.assertEqual(report["current"]["season_basis"], "official_current_context_only")
        self.assertEqual(report["observed_at"], NOW.isoformat())
        self.assertNotIn("modifiedAt", json.dumps(report))
        self.assertNotIn("bodies", json.dumps(report))

    def test_full_notice_revision_is_pinned_even_when_target_change_is_identical(self):
        self.data[sources.NOTICE_API_URL]["payload"]["bodies"][0]["body"] += "<p>다른 선수 정정</p>"
        self.assert_blocked("notice_revision_changed")
        self.assertEqual(self.calls, [sources.NOTICE_API_URL])

    def test_notice_id_missing_or_ambiguous_korean_body_is_rejected(self):
        for mutation, code in (
            (lambda p: p.update(id=157019), "notice_identity_mismatch"),
            (lambda p: p.update(visible=False), "notice_identity_mismatch"),
            (lambda p: p.update(bodies=[]), "notice_body_ambiguous"),
            (lambda p: p["bodies"].append({"languageCode": "ko", "body": "other"}), "notice_body_ambiguous"),
        ):
            with self.subTest(code=code):
                self.data = fixtures()
                mutation(self.data[sources.NOTICE_API_URL]["payload"])
                self.assert_blocked(code)

    def test_body_date_and_one_target_change_must_be_reparsed(self):
        for body, code in (
            (BODY.replace("공시일", "게시 정보"), "notice_publication_date_invalid"),
            (BODY.replace("9월 16일", "9월 17일"), "notice_publication_date_invalid"),
            (BODY.replace("3번", "4번"), "notice_change_mismatch"),
            (BODY + "<p>선수명 : 오재성</p><p>변경전/변경후 : 3번 -&gt; 5번</p>", "notice_player_ambiguous"),
            (BODY + "<p>적용일 : 2026-09-16</p>", "notice_change_mismatch"),
        ):
            with self.subTest(code=code):
                self.data = fixtures()
                self.data[sources.NOTICE_API_URL]["payload"]["bodies"][0]["body"] = body
                with patch.object(sources, "NOTICE_HTML_SHA256", hashlib.sha256(body.encode()).hexdigest()):
                    self.assert_blocked(code)

    def test_missing_duplicate_or_changed_identity_in_current_roster_is_rejected(self):
        self.data[sources.ROSTER_URL]["payload"] = [{"playerCode": "other"}]
        self.assert_blocked("current_player_ambiguous")
        self.data = fixtures()
        self.data[sources.ROSTER_URL]["payload"] *= 2
        self.assert_blocked("current_player_ambiguous")
        for key, value in (("birthDate", "1992-04-03"), ("teamCode", "1001"), ("name", "동명이인")):
            self.data = fixtures()
            self.data[sources.ROSTER_URL]["payload"][0][key] = value
            self.assert_blocked("current_player_identity_mismatch")

    def test_unregistered_hidden_or_temporary_record_is_rejected(self):
        for key, value in (("status", []), ("status", ["RETIRED"]), ("status", ["REGISTER", "RETIRED"]),
                           ("visible", False), ("visible", None), ("isTemp", True)):
            with self.subTest(key=key, value=value):
                self.data = fixtures()
                self.data[sources.ROSTER_URL]["payload"][0][key] = value
                self.assert_blocked("current_registration_invalid")

    def test_profile_disagreement_and_consistent_but_unreviewed_new_value_both_block(self):
        self.data[sources.PROFILE_URL]["payload"]["backNumber"] = 6
        self.assert_blocked("current_profile_mismatch")
        self.data[sources.ROSTER_URL]["payload"][0]["backNumber"] = 6
        self.assert_blocked("current_normalized_revision_changed")
        self.data = fixtures()
        del self.data[sources.PROFILE_URL]["payload"]["birthDate"]
        self.assert_blocked("current_profile_mismatch")
        self.data = fixtures()
        self.data[sources.PROFILE_URL]["payload"]["backNumber"] = "5"
        self.assert_blocked("current_profile_mismatch")

    def test_other_players_seasons_and_audit_metadata_do_not_change_selected_hashes(self):
        before = self.collect()
        self.data[sources.ROSTER_URL]["payload"].append({"playerCode": "other", "backNumber": 99})
        self.data[sources.ROSTER_URL]["payload"][0]["modifiedAt"] = "unqualified-provider-time"
        self.data[sources.PROFILE_URL]["payload"]["image"] = "https://cdn.kovo.co.kr/new.webp"
        self.data[sources.SEASONS_URL]["payload"].append({"season": "022", "name": "older season"})
        after = self.collect()
        self.assertEqual(before, after)

    def test_changed_or_ambiguous_season_context_is_rejected(self):
        self.data[sources.CURRENT_SEASON_URL]["payload"]["seasonCode"] = "024"
        self.assert_blocked("current_season_changed")
        self.data = fixtures()
        self.data[sources.SEASONS_URL]["payload"] *= 2
        self.assert_blocked("current_season_invalid")
        self.data = fixtures()
        self.data[sources.SEASONS_URL]["payload"][0]["sname"] = "2025-2026 V-리그"
        self.assert_blocked("current_season_changed")
        self.data = fixtures()
        self.data[sources.SEASONS_URL]["payload"][0]["config"]["visible"] = False
        self.assert_blocked("current_season_invalid")
        self.data = fixtures()
        self.data[sources.SEASONS_URL]["payload"][0]["closedAt"] = "2026-10-30"
        self.assert_blocked("current_season_invalid")

    def test_real_clock_is_sampled_after_each_fetch_and_naive_override_is_rejected(self):
        instants = [NOW + timedelta(seconds=i) for i in range(6)]
        with patch.object(sources, "_utcnow", side_effect=instants):
            report = sources.collect_source_evidence(fetch_json=self.fetch)
        self.assertEqual(report["notice"]["fetched_at"], instants[0].isoformat())
        self.assertEqual(report["current"]["fetched_at"], instants[1].isoformat())
        self.assertEqual(report["current"]["profile_fetched_at"], instants[2].isoformat())
        self.assertEqual(report["observed_at"], instants[5].isoformat())
        self.calls.clear()
        with self.assertRaisesRegex(sources.CurrentValueSourceError, "^source_time_invalid$"):
            sources.collect_source_evidence(now=NOW.replace(tzinfo=None), fetch_json=self.fetch)
        self.assertEqual(self.calls, [])

    def test_bad_envelope_and_arbitrary_errors_never_escape_as_raw_messages(self):
        self.data[sources.NOTICE_API_URL] = {"result": {"status": 403, "message": "PRIVATE_RAW_MESSAGE"}}
        self.assert_blocked("source_envelope_invalid")
        with self.assertRaisesRegex(sources.CurrentValueSourceError, "^source_fetch_failed$"):
            sources.collect_source_evidence(now=NOW, fetch_json=lambda _: (_ for _ in ()).throw(
                RuntimeError("PRIVATE_TOKEN_URL")))
        self.assertEqual(str(sources.CurrentValueSourceError("PRIVATE_MESSAGE")), "source_validation_failed")

    def test_transport_is_fixed_get_no_redirect_bounded_and_strict_json(self):
        with patch.object(sources, "build_opener") as builder:
            for url in ("http://user-api.kovo.co.kr/players/0001550", sources.PROFILE_URL + "?next=x",
                        "https://untrusted.invalid/players/0001550"):
                with self.assertRaisesRegex(sources.CurrentValueSourceError, "^source_url_not_allowed$"):
                    sources._fetch_json(url)
            builder.assert_not_called()
            response = FakeResponse(json.dumps(envelope({"test": True})).encode())
            builder.return_value.open.return_value = response
            self.assertTrue(sources._fetch_json(sources.NOTICE_API_URL)["payload"]["test"])
            request = builder.return_value.open.call_args.args[0]
            self.assertEqual(request.get_method(), "GET")
            self.assertIsNone(request.data)
            self.assertFalse(request.has_header("Authorization"))
            self.assertEqual(response.limit, sources.MAX_RESPONSE_BYTES + 1)
            self.assertEqual(builder.return_value.open.call_args.kwargs["timeout"], sources.TIMEOUT_SECONDS)
            with self.assertRaisesRegex(sources.CurrentValueSourceError, "^source_redirect_blocked$"):
                builder.call_args.args[0].redirect_request(request, None, 302, "", {}, "https://other.invalid")
            for raw, code in ((b"x" * (sources.MAX_RESPONSE_BYTES + 1), "source_response_too_large"),
                              (b'{"a":1,"a":2}', "source_json_invalid"),
                              (b'{"a":NaN}', "source_json_invalid"), (b"not-json", "source_json_invalid")):
                builder.return_value.open.return_value = FakeResponse(raw)
                with self.assertRaisesRegex(sources.CurrentValueSourceError, "^" + code + "$"):
                    sources._fetch_json(sources.NOTICE_API_URL)
            builder.return_value.open.side_effect = HTTPError(sources.NOTICE_API_URL, 302, "PRIVATE", {}, None)
            with self.assertRaisesRegex(sources.CurrentValueSourceError, "^source_redirect_blocked$"):
                sources._fetch_json(sources.NOTICE_API_URL)


if __name__ == "__main__":
    unittest.main()

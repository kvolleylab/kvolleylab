"""Offline contract/regression tests; public excerpts are not whole-season input."""
from copy import deepcopy
from datetime import date, timedelta
import io
import itertools
import json
from pathlib import Path
import sys
import unittest
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kovo_vleague_source as source

FIXTURE = json.loads((Path(__file__).parent / "fixtures/kovo_vleague/public_contract_v1.json").read_text())
STAMP = "2026-10-31T09:00:00+00:00"


def synthetic_season(gender):
    """Deliberately synthetic six-round schedule for complete-coverage tests."""
    prefix = source.GENDERS[gender]
    codes = [prefix + f"{number:03}" for number in range(1, 8)]
    base = deepcopy(FIXTURE["schedules"]["m" if gender == "MALE" else "w"]["rows"][1])
    result = []
    for round_number in range(1, 7):
        for hcode, acode in itertools.combinations(codes, 2):
            index = len(result)
            row = deepcopy(base)
            row.update(gnum=index * 2 + (1 if gender == "MALE" else 2),
                       gender=prefix, round=round_number, hcode=hcode, acode=acode,
                       hsname="Synthetic " + hcode, asname="Synthetic " + acode,
                       gdate=(date(2026, 10, 31) + timedelta(days=index)).isoformat())
            result.append(row)
    return result


class FakeSeasonSource:
    def __init__(self, size=200):
        self.size = size
        self.rows = {g: synthetic_season(g) for g in source.GENDERS}
        self.calls = []

    def __call__(self, url):
        self.calls.append(url)
        source.validate_request_url(url)
        query = parse_qs(urlsplit(url).query)
        gender = "MALE" if query["gender"] == ["1"] else "FEMALE"
        if urlsplit(url).path == "/stat/league/team-rank":
            return {"result": {"status": 200}, "payload": []}
        page = int(query["page"][0])
        rows = self.rows[gender]
        return {"result": {"status": 200}, "payload": {
            "content": deepcopy(rows[page*self.size:(page+1)*self.size]),
            "page": {"number": page, "size": self.size, "totalElements": len(rows),
                     "totalPages": (len(rows)+self.size-1)//self.size}}}


class SourceContractTests(unittest.TestCase):
    def normalize(self, row, gender="MALE"):
        return source.normalize_match(row, season="2026-27", gender=gender,
                                      source_url=source.schedule_url("2026-27", gender), observed_at=STAMP)

    def test_verified_opening_match_points_and_global_game_numbers(self):
        men = self.normalize(FIXTURE["schedules"]["m"]["rows"][0])
        women = self.normalize(FIXTURE["schedules"]["w"]["rows"][0], "FEMALE")
        self.assertEqual(men["source_key"], "023:001:MALE:1")
        self.assertEqual(women["source_key"], "023:001:FEMALE:2")
        self.assertEqual(men["sets"], [{"home": 25, "away": 22}, {"home": 25, "away": 23}, {"home": 25, "away": 22}])
        self.assertEqual(women["sets"], [{"home": 25, "away": 18}, {"home": 25, "away": 21}, {"home": 25, "away": 22}])
        self.assertEqual(men["status"], "final")
        self.assertEqual(women["home"]["provider_code"], "2005")

    def test_upcoming_zero_is_scheduled_not_final(self):
        item = self.normalize(FIXTURE["schedules"]["m"]["rows"][1])
        self.assertEqual(item["status"], "scheduled")
        self.assertIsNone(item["sets"])

    def test_final_requires_per_set_points_and_correct_winner(self):
        for mutation in (lambda r: r.pop("hs2point"),
                         lambda r: r.update(hs2point=0, as2point=0),
                         lambda r: r.update(hspoint=2),
                         lambda r: r.update(result="L"),
                         lambda r: r.update(getime="")):
            row = deepcopy(FIXTURE["schedules"]["m"]["rows"][0])
            mutation(row)
            with self.assertRaises(source.SourceError):
                self.normalize(row)

    def test_deuce_terminal_points_and_fifth_set_rules(self):
        valid = [{"home": 25, "away": 20}, {"home": 20, "away": 25},
                 {"home": 37, "away": 35}, {"home": 22, "away": 25},
                 {"home": 16, "away": 14}]
        source.validate_final_sets(valid, {"home": 3, "away": 2})
        for points in ({"home": 26, "away": 20}, {"home": 25, "away": 24}):
            bad = deepcopy(valid)
            bad[0] = points
            with self.assertRaises(source.SourceError):
                source.validate_final_sets(bad, {"home": 3, "away": 2})

    def test_no_sets_after_match_has_finished(self):
        points = [{"home": 25, "away": 20}] * 3 + [{"home": 20, "away": 25}]
        with self.assertRaises(source.SourceError):
            source.validate_final_sets(points, {"home": 3, "away": 1})

    def test_wrong_season_gender_cup_or_boolean_score_rejected(self):
        for fields in ({"seasonCode": "022"}, {"leagueCode": "212"},
                       {"gender": "2"}, {"seasonName": "2025~2026 V-리그"},
                       {"hspoint": True}, {"gdate": "2026-02-30"}):
            row = deepcopy(FIXTURE["schedules"]["m"]["rows"][0])
            row.update(fields)
            with self.assertRaises(source.SourceError):
                self.normalize(row)

    def test_complete_both_gender_season_and_stable_hash(self):
        fixture = FakeSeasonSource()
        result = source.collect_season(fetcher=fixture, now=STAMP)
        self.assertEqual(len(result["matches"]), 252)
        self.assertTrue(result["coverage"]["complete"])
        self.assertEqual(len(fixture.calls), 4)
        later = source.collect_season(fetcher=fixture, now="2026-10-31T10:00:00+00:00")
        self.assertEqual(result["content_sha256"], later["content_sha256"])

    def test_all_pages_are_fetched_and_validated(self):
        fixture = FakeSeasonSource(size=60)
        result = source.collect_season(fetcher=fixture, now=STAMP)
        self.assertEqual(len(result["matches"]), 252)
        self.assertEqual(len(fixture.calls), 8)
        self.assertEqual([x["pages"] for x in result["coverage"]["details"]], [3, 3])

    def test_small_homepage_payload_is_never_complete_season(self):
        def latest_only(url):
            return {"result": {"status": 200}, "payload": FIXTURE["schedules"]["m"]["rows"]}
        with self.assertRaisesRegex(source.SourceError, "Full schedule"):
            source.collect_season(fetcher=latest_only, now=STAMP)

    def test_empty_short_duplicate_and_round_incomplete_sources_fail(self):
        for modify in (lambda r: r.clear(), lambda r: r.pop(),
                       lambda r: r.__setitem__(1, deepcopy(r[0])),
                       lambda r: r[0].update(round=2)):
            fixture = FakeSeasonSource()
            modify(fixture.rows["MALE"])
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=fixture, now=STAMP)

    def test_metadata_cannot_hide_truncation_or_stale_page(self):
        fixture = FakeSeasonSource(size=60)
        for mode in ("truncated", "wrong_page", "changed_total"):
            def broken(url):
                data = fixture(url)
                if "/stat/game-schedule?" in url:
                    if mode == "truncated": data["payload"]["content"].pop()
                    if mode == "wrong_page": data["payload"]["page"]["number"] += 1
                    if mode == "changed_total": data["payload"]["page"]["totalElements"] = 127
                return data
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=broken, now=STAMP)

    def test_standings_only_played_teams_are_source_valid(self):
        observed = FIXTURE["standings"]["m"]
        normalized = source.normalize_standings(observed, season="2026-27", gender="MALE",
                    source_url=observed["source_url"], observed_at=STAMP)
        self.assertEqual(len(normalized["rows"]), 2)
        kal = normalized["rows"][0]
        self.assertEqual((kal["provider_code"], kal["played"], kal["points"], kal["points_won"], kal["points_lost"]),
                         ("1001", 1, 3, 75, 67))

    def test_envelope_error_is_not_an_empty_success(self):
        for status in (404, 403, "200", True, 500):
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=lambda u: {"result": {"status": status}, "payload": []})

    def test_unknown_season_fails_before_fetch(self):
        def no_fetch(url): self.fail("Must not request an unverified season")
        with self.assertRaises(source.SourceError):
            source.collect_season("2027-28", fetcher=no_fetch)

    def test_only_observed_exact_anonymous_queries_allowed(self):
        base = source.schedule_url("2026-27", "MALE")
        source.validate_request_url(base)
        for url in (base.replace("user-api.kovo.co.kr", "attacker.example"),
                    base.replace("https://", "http://"), base + "&token=hidden",
                    base + "&gender=2", base.replace("seasonCode=023", "seasonCode=024"),
                    base.replace("/stat/game-schedule", "/mains/games/schedules")):
            with self.assertRaises(source.SourceError): source.validate_request_url(url)


class PublicClientTests(unittest.TestCase):
    def test_auth_and_rate_limit_are_terminal_and_no_credentials_sent(self):
        url = source.schedule_url("2026-27", "MALE")
        for status in (401, 403, 429):
            calls, sleeps = [], []
            class Opener:
                def open(self, request, timeout):
                    calls.append(request)
                    raise HTTPError(url, status, "denied", {}, None)
            with self.assertRaises(source.SourceError):
                source.PublicClient(opener=Opener(), sleeper=sleeps.append)(url)
            self.assertEqual(len(calls), 1)
            self.assertEqual(sleeps, [])
            headers = {k.lower(): v for k, v in calls[0].header_items()}
            self.assertFalse({"authorization", "cookie", "x-api-key"} & headers.keys())

    def test_network_retries_are_bounded(self):
        count, sleeps = [], []
        class Opener:
            def open(self, request, timeout):
                count.append(1)
                raise URLError("temporary")
        with self.assertRaises(source.SourceError):
            source.PublicClient(opener=Opener(), sleeper=sleeps.append)(source.schedule_url("2026-27", "MALE"))
        self.assertEqual(len(count), 3)
        self.assertEqual(sleeps, [2, 4])

    def test_json_envelope_error_does_not_become_success(self):
        url = source.schedule_url("2026-27", "MALE")
        class Response(io.BytesIO):
            status = 200
            headers = {"Content-Type": "application/json"}
            def geturl(self): return url
        class Opener:
            def open(self, request, timeout):
                return Response(b'{"result":{"status":404},"payload":null}')
        with self.assertRaises(source.SourceError):
            source.PublicClient(opener=Opener(), sleeper=lambda x: None)(url)


if __name__ == "__main__":
    unittest.main()

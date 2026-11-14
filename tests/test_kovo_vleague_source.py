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


def synthetic_postseason(gender="MALE", phase="202", leg=1, *, final=False, away_wins=False):
    """Synthetic current-season record using the observed official roundName contract."""
    row = deepcopy(FIXTURE["schedules"]["m" if gender == "MALE" else "w"]["rows"][0 if final else 1])
    prefix = source.GENDERS[gender]
    rule = source.POSTSEASON_PHASES[phase]
    day = {"204": 6, "202": 8, "203": 14}[phase] + 2 * (leg - 1) - (gender == "FEMALE")
    row.update(leagueCode=phase, gpart=phase, leagueName=rule["stage"],
               round=1, roundName=f"{rule['stage']} {leg}차전", gender=prefix,
               gnum={"204": 253, "202": 255, "203": 261}[phase] + (leg - 1) * 2 + (gender == "FEMALE"),
               hcode=prefix + "001", acode=prefix + "002", hsname="Synthetic " + prefix + "001",
               asname="Synthetic " + prefix + "002", gdate=f"2027-04-{day:02d}")
    if final and away_wins:
        row["hcode"], row["acode"] = row["acode"], row["hcode"]
        row["hsname"], row["asname"] = row["asname"], row["hsname"]
        row["hspoint"], row["aspoint"] = row["aspoint"], row["hspoint"]
        for n in range(1, 6):
            row[f"hs{n}point"], row[f"as{n}point"] = row[f"as{n}point"], row[f"hs{n}point"]
        row["result"] = "L"
    return row


class FakeSeasonSource:
    def __init__(self, size=200):
        self.size = size
        self.rows = {g: synthetic_season(g) for g in source.GENDERS}
        self.postseason = {(g, p): [] for g in source.GENDERS for p in source.POSTSEASON_PHASES}
        self.calls = []

    def __call__(self, url):
        self.calls.append(url)
        source.validate_request_url(url)
        query = parse_qs(urlsplit(url).query)
        if urlsplit(url).path == "/stat/real-time":
            # A missing optional broadcast must not stop the season publisher.
            return {"result": {"status": 200}, "payload": {"game": {}}}
        gender = "MALE" if query["gender"] == ["1"] else "FEMALE"
        if urlsplit(url).path == "/stat/league/team-rank":
            return {"result": {"status": 200}, "payload": []}
        phase = query["leagueCode"][0]
        if phase in source.POSTSEASON_PHASES:
            rows = self.postseason[(gender, phase)]
            return {"result": {"status": 200}, "payload": {"content": deepcopy(rows),
                    "page": {"number": 0, "size": 200, "totalElements": len(rows), "totalPages": 1 if rows else 0}}}
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

    def test_live_provisional_winner_marker_remains_unverified(self):
        # KOVO may supply W/L while the match is underway and getime is blank.
        # Neither marker may turn provisional set wins into a final result.
        for gender in source.GENDERS:
            for marker in ("W", "L", "", None):
                with self.subTest(gender=gender, marker=marker):
                    row = deepcopy(FIXTURE["schedules"]["m" if gender == "MALE" else "w"]["rows"][1])
                    row.update(hspoint=1, aspoint=0, hs1point=25, as1point=20,
                               getime="", result=marker)
                    match = self.normalize(row, gender)
                    self.assertEqual(match["status"], "live")
                    self.assertEqual(match["sets_won"], {"home": 1, "away": 0})
                    self.assertEqual(match["sets"], [{"home": 25, "away": 20}])
                    self.assertNotIn("winner", match)

    def test_scheduled_and_unknown_provisional_winner_markers_still_fail(self):
        scheduled = deepcopy(FIXTURE["schedules"]["m"]["rows"][1])
        for marker in ("W", "L", "?", 0):
            with self.subTest(scheduled_marker=marker):
                with self.assertRaises(source.SourceError):
                    self.normalize({**scheduled, "result": marker})
        live = {**scheduled, "hspoint": 1, "hs1point": 25, "as1point": 20}
        for marker in ("?", 0, True):
            with self.subTest(live_marker=marker):
                with self.assertRaises(source.SourceError):
                    self.normalize({**live, "result": marker})
        pending = self.normalize({**live, "hspoint": 3, "result": "W"})
        self.assertEqual(pending["status"], "live")
        self.assertTrue(pending["final_pending"])
        with self.assertRaises(source.SourceError):
            self.normalize({**live, "hspoint": 3, "aspoint": 3})

    def test_full_season_read_accepts_live_marker_but_does_not_finalize_game(self):
        reader = FakeSeasonSource()
        for gender in source.GENDERS:
            row = reader.rows[gender][0]
            row.update(hspoint=1, aspoint=0, hs1point=25, as1point=20,
                       getime="", result="W")
        snapshot = source.collect_season(fetcher=reader, now=STAMP)
        self.assertTrue(snapshot["coverage"]["complete"])
        self.assertEqual(len(snapshot["matches"]), 252)
        for gender in source.GENDERS:
            observed = [m for m in snapshot["matches"]
                        if m["gender"] == gender and m["number"] in (1, 2)]
            self.assertEqual(len(observed), 1)
            self.assertEqual(observed[0]["status"], "live")
            self.assertEqual(observed[0]["sets_won"], {"home": 1, "away": 0})

    def test_full_season_accepts_winning_counter_before_end_without_certifying_final(self):
        reader = FakeSeasonSource()
        row = reader.rows["MALE"][0]
        row.update(hspoint=1, aspoint=3, hs1point=23, as1point=25, getime="", result="L")
        snapshot = source.collect_season(fetcher=reader, now=STAMP)
        pending = next(m for m in snapshot["matches"] if m["gender"] == "MALE")
        self.assertTrue(snapshot["coverage"]["complete"])
        self.assertEqual(len(snapshot["matches"]), 252)
        self.assertEqual(pending["status"], "live")
        self.assertTrue(pending["final_pending"])
        self.assertEqual(pending["sets_won"], {"home": 1, "away": 3})
        self.assertNotIn("winner", pending)

    def test_final_requires_per_set_points_and_correct_winner(self):
        for mutation in (lambda r: r.pop("hs2point"),
                         lambda r: r.update(hs2point=0, as2point=0),
                         lambda r: r.update(hspoint=2),
                         lambda r: r.update(result="L")):
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
        self.assertEqual(len(fixture.calls), 10)
        self.assertEqual(len(result["coverage"]["postseason"]), 6)
        self.assertTrue(all(r["fixture_state"] == "not_published" for r in result["coverage"]["postseason"]))
        later = source.collect_season(fetcher=fixture, now="2026-10-31T10:00:00+00:00")
        self.assertEqual(result["content_sha256"], later["content_sha256"])

    def test_all_pages_are_fetched_and_validated(self):
        fixture = FakeSeasonSource(size=60)
        result = source.collect_season(fetcher=fixture, now=STAMP)
        self.assertEqual(len(result["matches"]), 252)
        self.assertEqual(len(fixture.calls), 14)
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
                if "/stat/game-schedule?" in url and "leagueCode=201" in url:
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

    def test_postseason_phase_round_name_and_global_ids_are_preserved(self):
        reader = FakeSeasonSource()
        reader.postseason[("MALE", "203")] = [synthetic_postseason(phase="203", leg=n) for n in range(1, 6)]
        result = source.collect_season(fetcher=reader, now=STAMP)
        observed = [r for r in result["matches"] if r["phase_id"] == "203"]
        self.assertEqual([r["series_game"] for r in observed], [1, 2, 3, 4, 5])
        self.assertEqual([r["round"] for r in observed], [1] * 5)
        self.assertEqual(observed[-1]["source_key"], "023:001:MALE:269")
        self.assertEqual(observed[-1]["stage"], "챔피언결정전")
        self.assertEqual(len(result["matches"]), 257)

    def test_postseason_missing_or_wrong_leg_is_not_guessed_from_row_order(self):
        for change in ({"roundName": "플레이오프"}, {"roundName": "플레이오프 4차전"},
                       {"roundName": "플레이오프 2차전"}, {"leagueName": "챔피언결정전"}):
            reader = FakeSeasonSource()
            row = synthetic_postseason()
            row.update(change)
            reader.postseason[("MALE", "202")] = [row]
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=reader, now=STAMP)

    def test_unpublished_and_incomplete_postseason_pages_are_different(self):
        reader = FakeSeasonSource()
        for replacement in ({"content": [], "page": {"size": 200, "number": 0, "totalElements": 1, "totalPages": 1}},
                            {"content": [], "page": {"size": 200, "number": 0, "totalElements": 0, "totalPages": 1}}):
            def broken(url):
                if "leagueCode=202" in url:
                    return {"result": {"status": 200}, "payload": replacement}
                return reader(url)
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=broken, now=STAMP)

    def test_unconfirmed_postseason_teams_time_or_venue_stay_pending(self):
        for change in ({"hcode": None, "hsname": "정규리그 2위"}, {"gstime": ""}, {"place": None}):
            reader = FakeSeasonSource()
            row = synthetic_postseason()
            row.update(change)
            reader.postseason[("MALE", "202")] = [row]
            result = source.collect_season(fetcher=reader, now=STAMP)
            self.assertEqual(len(result["matches"]), 252)
            self.assertEqual(len(result["pending_matches"]), 1)
            self.assertFalse(result["pending_matches"][0]["fixture_ready"])
        row = synthetic_postseason(final=True)
        row["hcode"] = None
        reader.postseason[("MALE", "202")] = [row]
        with self.assertRaises(source.SourceError):
            source.collect_season(fetcher=reader, now=STAMP)

    def test_postseason_global_number_collision_and_excess_games_fail(self):
        for rows in ([{**synthetic_postseason(), "gnum": 1}],
                     [synthetic_postseason(phase="204", leg=1)] * 2):
            reader = FakeSeasonSource()
            reader.postseason[("MALE", rows[0]["leagueCode"])] = rows
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=reader, now=STAMP)

    def test_postseason_team_totals_are_not_accepted_as_regular_standings(self):
        url = source.standings_url("2026-27", "MALE").replace("leagueCode=201", "leagueCode=203")
        with self.assertRaises(source.SourceError):
            source.validate_request_url(url)


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

class VerifiedLiveSetTests(unittest.TestCase):
    def test_only_completed_sets_corroborated_by_win_counts_are_published(self):
        sets = [{"home": 28, "away": 26}, {"home": 7, "away": 9}]
        self.assertEqual(source.verified_live_sets(sets, {"home": 1, "away": 0}),
                         [{"home": 28, "away": 26, "status": "completed"}])
        for invalid in (None, [], [{"home": 24, "away": 23}], [{"home": 25, "away": 26}], [{"home": 20, "away": 25}]):
            self.assertEqual(source.verified_live_sets(invalid, {"home": 1, "away": 0}), [])

    def test_two_two_with_partial_fifth_publishes_four_completed_sets_only(self):
        sets = [{"home": 25, "away": 20}, {"home": 20, "away": 25}] * 2 + [{"home": 8, "away": 7}]
        self.assertEqual(len(source.verified_live_sets(sets, {"home": 2, "away": 2})), 4)

    def test_partial_prefix_survives_later_missing_points(self):
        first = [{"home": 23, "away": 25}]
        self.assertEqual(source.verified_live_sets(first, {"home": 1, "away": 2}),
                         [{"home": 23, "away": 25, "status": "completed"}])
        self.assertEqual(source.verified_live_sets(first, {"home": 0, "away": 0}), [])
        self.assertEqual(source.verified_live_sets(first, {"home": 1, "away": 0}), [])
        self.assertEqual(len(source.verified_live_sets(first + [{"home": 7, "away": 9}],
                                                      {"home": 1, "away": 1})), 1)

"""Synthetic source safety regressions; not actual publication or recovery evidence."""
from copy import deepcopy
from email.utils import formatdate
import errno
import io
import json
from pathlib import Path
import socket
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_kovo_vleague_source import FakeSeasonSource, STAMP, synthetic_postseason, source
import test_kovo_vleague_live_points as live_contract
import test_kovo_vleague_final_supplement as ended_contract


class StartTimeIdentityTests(unittest.TestCase):
    def fixture(self, gender="MALE"):
        case = live_contract.LivePointsTests()
        case.setUp()
        if gender == "FEMALE":
            case.match.update(gender=gender, source_key="023:001:FEMALE:2", number=2,
                              source_url=source.schedule_url("2026-27", gender))
            case.match["home"]["provider_code"] = "2005"
            case.match["away"]["provider_code"] = "2008"
            case.game.update(gameNum=2, homeCode="2005", awayCode="2008")
        return case

    def test_valid_start_difference_requires_all_immutable_identity_fields(self):
        for gender in source.GENDERS:
            with self.subTest(gender=gender):
                case = self.fixture(gender)
                case.match["time"], case.game["gameStartTime"] = "14:02", "14:00"
                before = deepcopy(case.match)
                observations, _ = case.run_supplement()
                evidence = observations[0]
                self.assertEqual(evidence["decision"], "SUPPLEMENTED")
                self.assertEqual(evidence["selected_sets"], 3)
                self.assertEqual(case.match["time"], "14:02")
                self.assertEqual(case.match["sets_won"], before["sets_won"])
                identity = evidence["realtime"]["identity"]
                self.assertEqual(identity["mismatched_fields"], [])
                self.assertTrue(identity["schedule_context_valid"])
                self.assertEqual(identity["schedule_start_time"], "14:02")
                self.assertEqual(identity["realtime_start_time"], "14:00")
                self.assertEqual(identity["start_time_comparison"], "DIFFERENT")
                self.assertNotIn("DO_NOT_PERSIST", json.dumps(observations))

    def test_time_difference_never_overrides_identity_or_prefix_conflict(self):
        mutations = {"seasonCode": "022", "round": 2, "gameNum": 999,
                     "gameDate": "2026-11-01", "homeCode": "1009", "awayCode": "1009"}
        for field, value in mutations.items():
            with self.subTest(field=field):
                case = self.fixture()
                case.match["time"], case.game["gameStartTime"] = "14:02", "14:00"
                case.game[field] = value
                before = deepcopy(case.match)
                observations, _ = case.run_supplement()
                self.assertEqual(case.match, before)
                self.assertEqual(observations[0]["decision"], "REALTIME_IDENTITY_MISMATCH")
                self.assertIn(field, observations[0]["realtime"]["identity"]["mismatched_fields"])
                self.assertNotIn("points", observations[0]["realtime"])
        case = self.fixture()
        case.match["time"], case.game["gameStartTime"] = "14:02", "14:00"
        case.game["homeS1Point"] = 22
        before = deepcopy(case.match)
        observations, _ = case.run_supplement()
        self.assertEqual(case.match, before)
        self.assertEqual(observations[0]["decision"], "COMPLETED_POINTS_CONFLICT")

    def test_unreviewed_phase_type_gender_or_source_key_is_not_rescued_by_time(self):
        for field, value in [("phase_id", "202"), ("match_type", "002"),
                             ("gender", "FEMALE"), ("source_key", "023:001:MALE:999")]:
            with self.subTest(field=field):
                case = self.fixture()
                case.match.update(time="14:02", **{field: value})
                case.game["gameStartTime"] = "14:00"
                diagnostics = {}
                with self.assertRaisesRegex(source.SourceError, "REALTIME_IDENTITY_MISMATCH"):
                    source.live_game_points({"result": {"status": 200},
                                             "payload": {"game": case.game}},
                                            case.match, observation=diagnostics)
                self.assertFalse(diagnostics["identity"]["schedule_context_valid"])

    def test_missing_or_malformed_times_are_blocked_without_copying_raw_values(self):
        for bad in [None, "", "24:00", "14:99", True, 1400, {"raw": "DO_NOT_PERSIST"}]:
            for side in ["schedule", "realtime"]:
                with self.subTest(side=side, bad=bad):
                    case = self.fixture()
                    if side == "schedule":
                        case.match["time"] = bad
                    else:
                        case.game["gameStartTime"] = bad
                    before = deepcopy(case.match)
                    observations, _ = case.run_supplement()
                    self.assertEqual(case.match, before)
                    self.assertEqual(observations[0]["decision"], "REALTIME_IDENTITY_MISMATCH")
                    identity = observations[0]["realtime"]["identity"]
                    self.assertEqual(identity["start_time_comparison"], "INVALID")
                    self.assertNotIn("DO_NOT_PERSIST", json.dumps(observations))

    def test_valid_time_difference_does_not_change_final_confirmation_contract(self):
        for gender in source.GENDERS:
            reader, observations = ended_contract.EndedSeason(gender), []
            reader.row["gstime"] = "14:02"
            reader.broadcast["payload"]["game"]["gameStartTime"] = "14:00"
            snapshot = reader.collect(observations)
            match = next(m for m in snapshot["matches"] if m["number"] == reader.row["gnum"])
            self.assertEqual(match["status"], "final")
            self.assertEqual(match["sets"], [{"home": h, "away": a} for h, a in ended_contract.FOUR])
            evidence = next(o for o in observations if o["source_key"] == match["source_key"])
            self.assertEqual(evidence["decision"], "FINAL_SUPPLEMENTED")
            self.assertEqual(evidence["realtime"]["identity"]["start_time_comparison"], "DIFFERENT")


class BoundedReadRetryTests(unittest.TestCase):
    url = source.schedule_url("2026-27", "MALE")

    def reader(self, outcomes):
        calls, sleeps = [], []
        outcomes = iter(outcomes)
        url = self.url
        class Response(io.BytesIO):
            status = 200
            headers = {"Content-Type": "application/json"}
            def geturl(self):
                return url
        class Opener:
            def open(self, request, timeout):
                calls.append(request)
                result = next(outcomes)
                if isinstance(result, Exception):
                    raise result
                return Response(result)
        return source.PublicClient(opener=Opener(), sleeper=sleeps.append), calls, sleeps

    def error(self, code, retry_after=None):
        headers = {} if retry_after is None else {"Retry-After": retry_after}
        return HTTPError(self.url, code, "DO_NOT_EXPOSE_RESPONSE", headers, None)

    def test_transient_http_gets_retry_then_succeed_without_credentials(self):
        client, calls, sleeps = self.reader([self.error(503), self.error(429, "7"),
                                           b'{"result":{"status":200},"payload":[]}'])
        self.assertEqual(client(self.url)["payload"], [])
        self.assertEqual(len(calls), 3)
        self.assertEqual(sleeps, [2, 7])
        for request in calls:
            self.assertEqual(request.get_method(), "GET")
            self.assertFalse({"authorization", "cookie", "x-api-key"}
                             & {k.lower() for k, _ in request.header_items()})

    def test_retry_limit_http_date_and_server_long_wait_are_bounded(self):
        for code in [429, 500, 503]:
            client, calls, sleeps = self.reader([self.error(code)] * 3)
            with self.assertRaises(source.SourceError):
                client(self.url)
            self.assertEqual(len(calls), 3)
            self.assertEqual(sleeps, [2, 4])
        with patch.object(source.time, "time", return_value=1700000000):
            client, calls, sleeps = self.reader([self.error(429, formatdate(1700000005, usegmt=True)),
                                               b'{"result":{"status":200},"payload":[]}'])
            client(self.url)
            self.assertEqual(sleeps, [5])
        for value in ["31", "3600", "-1", "invalid"]:
            client, calls, sleeps = self.reader([self.error(429, value)])
            with self.assertRaises(source.SourceError):
                client(self.url)
            self.assertEqual(len(calls), 1)
            self.assertEqual(sleeps, [])

    def test_access_denial_bad_json_and_invalid_envelopes_are_not_retried(self):
        for outcome in [self.error(400), self.error(401), self.error(403), self.error(404),
                        b'not JSON', b'{"result":{"status":429},"payload":[]}']:
            client, calls, sleeps = self.reader([outcome])
            with self.assertRaises(source.SourceError):
                client(self.url)
            self.assertEqual(len(calls), 1)
            self.assertEqual(sleeps, [])

    def test_only_transient_transport_errors_retry(self):
        for error in [TimeoutError(), URLError(TimeoutError()),
                      URLError(socket.gaierror(socket.EAI_AGAIN, "temporary"))]:
            client, calls, sleeps = self.reader([error, b'{"result":{"status":200},"payload":[]}'])
            client(self.url)
            self.assertEqual(len(calls), 2)
            self.assertEqual(sleeps, [2])
        for error in [URLError("certificate invalid"), PermissionError(errno.EACCES, "denied"),
                      URLError(socket.gaierror(socket.EAI_NONAME, "unknown host"))]:
            client, calls, sleeps = self.reader([error])
            with self.assertRaises(source.SourceError):
                client(self.url)
            self.assertEqual(len(calls), 1)
            self.assertEqual(sleeps, [])


class CompleteDivisionCollectionTests(unittest.TestCase):
    def test_explicit_division_still_reads_full_regular_postseason_and_rank(self):
        for gender in source.GENDERS:
            reader = FakeSeasonSource()
            snapshot = source.collect_season(fetcher=reader, now=STAMP, genders=(gender,))
            self.assertEqual(snapshot["coverage"]["genders"], [gender])
            self.assertEqual(len(snapshot["matches"]), 126)
            self.assertEqual({m["gender"] for m in snapshot["matches"]}, {gender})
            self.assertTrue(snapshot["coverage"]["complete"])
            self.assertEqual(len(snapshot["coverage"]["postseason"]), 3)
            self.assertEqual(len(snapshot["official_standings"]), 1)
            self.assertEqual(len(reader.calls), 5)
            self.assertTrue(all(parse_qs(urlsplit(u).query)["gender"] == [source.GENDERS[gender]]
                                for u in reader.calls))

    def test_default_collects_both_and_bad_subset_is_rejected_before_requests(self):
        self.assertEqual(len(source.collect_season(fetcher=FakeSeasonSource(), now=STAMP)["matches"]), 252)
        for genders in [(), [], ["MALE"], "MALE", ("MALE", "MALE"), ("OTHER",), (True,)]:
            reader = FakeSeasonSource()
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=reader, now=STAMP, genders=genders)
            self.assertEqual(reader.calls, [])
        reader = FakeSeasonSource()
        with self.assertRaisesRegex(source.SourceError, "requires official standings"):
            source.collect_season(fetcher=reader, now=STAMP, genders=("MALE",), include_standings=False)
        self.assertEqual(reader.calls, [])

    def test_requested_division_requires_each_postseason_phase_and_rank_response(self):
        for gender in source.GENDERS:
            for failed_phase in ["204", "202", "203", "rank"]:
                with self.subTest(gender=gender, failed_phase=failed_phase):
                    reader = FakeSeasonSource()
                    def broken(url):
                        query = parse_qs(urlsplit(url).query)
                        rank = urlsplit(url).path == "/stat/league/team-rank"
                        if (failed_phase == "rank" and rank
                                or not rank and query["leagueCode"] == [failed_phase]):
                            return {"result": {"status": 200}, "payload": None}
                        return reader(url)
                    with self.assertRaises(source.SourceError):
                        source.collect_season(fetcher=broken, now=STAMP, genders=(gender,))

    def test_incomplete_requested_division_or_global_number_collision_still_fails(self):
        for gender in source.GENDERS:
            reader = FakeSeasonSource()
            reader.rows[gender].pop()
            with self.assertRaises(source.SourceError):
                source.collect_season(fetcher=reader, now=STAMP, genders=(gender,))
            reader = FakeSeasonSource()
            row = synthetic_postseason(gender)
            row["gnum"] = reader.rows[gender][0]["gnum"]
            reader.postseason[(gender, "202")] = [row]
            with self.assertRaisesRegex(source.SourceError, "global game numbers overlap"):
                source.collect_season(fetcher=reader, now=STAMP, genders=(gender,))

    def test_unrequested_invalid_division_is_not_read_or_substituted(self):
        reader = FakeSeasonSource()
        reader.rows["FEMALE"] = []
        snapshot = source.collect_season(fetcher=reader, now=STAMP, genders=("MALE",))
        self.assertEqual(len(snapshot["matches"]), 126)
        self.assertEqual(snapshot["coverage"]["genders"], ["MALE"])
        with self.assertRaises(source.SourceError):
            source.collect_season(fetcher=reader, now=STAMP, genders=("FEMALE",))

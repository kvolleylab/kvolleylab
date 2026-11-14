"""Synthetic contract/regression tests, not evidence of deployed live recovery."""
from copy import deepcopy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kovo_vleague_source as source
import kovo_vleague_update as update
from test_kovo_vleague_source import FIXTURE, STAMP, FakeSeasonSource
from test_kovo_vleague_update import fixture_bundle


class LivePointsTests(unittest.TestCase):
    def setUp(self):
        raw = deepcopy(FIXTURE["schedules"]["m"]["rows"][0])
        raw.update(hspoint=1, aspoint=2, getime="", result="L",
                   hs1point=23, as1point=25, hs2point=0, as2point=0,
                   hs3point=0, as3point=0, hs4point=0, as4point=0, hs5point=0, as5point=0)
        self.match = source.normalize_match(raw, season="2026-27", gender="MALE",
                            source_url=source.schedule_url("2026-27", "MALE"), observed_at=STAMP)
        m = self.match
        self.game = {"seasonCode": m["season_id"], "round": m["round"], "gameNum": m["number"],
                     "homeCode": m["home"]["provider_code"], "awayCode": m["away"]["provider_code"],
                     "gameDate": m["date"], "gameStartTime": m["time"],
                     "homeSetPoint": 1, "awaySetPoint": 2, "setIng": 4}
        for n, (h, a) in enumerate([(23, 25), (25, 18), (20, 25), (4, 6), (0, 0)], 1):
            self.game.update({f"homeS{n}Point": h, f"awayS{n}Point": a})

    def run_supplement(self, game=None, stamp=STAMP):
        observations, calls = [], []
        def reader(url):
            calls.append(url)
            return {"result": {"status": 200}, "payload": {
                "game": self.game if game is None else game,
                "player": [{"private_test_sentinel": "DO_NOT_PERSIST"}],
                "lineup": "DO_NOT_PERSIST", "feed": "DO_NOT_PERSIST"}}
        source.supplement_live_points([self.match], reader, stamp, observations)
        return observations, calls

    def test_completes_missing_second_third_set_without_promoting_inplay_fourth(self):
        before = deepcopy(self.match)
        evidence, calls = self.run_supplement()
        self.assertEqual(self.match["sets"], [{"home": 23, "away": 25},
                                             {"home": 25, "away": 18}, {"home": 20, "away": 25}])
        self.assertEqual(self.match["sets_won"], before["sets_won"])
        self.assertEqual(self.match["status"], "live")
        self.assertEqual(self.match["source_url"], before["source_url"])
        self.assertEqual(len(calls), 1)
        self.assertEqual(evidence[0]["decision"], "SUPPLEMENTED")
        self.assertEqual(evidence[0]["schedule"]["points"], before["sets"])
        self.assertEqual(len(evidence[0]["realtime"]["points"]), 4)
        self.assertNotIn("DO_NOT_PERSIST", json.dumps(evidence))
        self.assertEqual(self.match["live_points_source_url"], calls[0])

    def test_same_contract_for_women(self):
        self.match.update(gender="FEMALE", source_key="023:001:FEMALE:2", number=2,
                          source_url=source.schedule_url("2026-27", "FEMALE"))
        self.match["home"]["provider_code"] = "2005"
        self.match["away"]["provider_code"] = "2008"
        self.game.update(gameNum=2, homeCode="2005", awayCode="2008")
        evidence, _ = self.run_supplement()
        self.assertEqual(evidence[0]["selected_sets"], 3)

    def test_wrong_game_season_home_away_date_time_round_or_type_never_merges(self):
        for field, value in [("gameNum", 999), ("seasonCode", "022"), ("homeCode", "2005"),
                             ("awayCode", "1009"), ("gameDate", "2026-11-01"),
                             ("gameStartTime", "13:00"), ("round", 2), ("round", True)]:
            with self.subTest(field=field, value=value):
                before = deepcopy(self.match)
                evidence, _ = self.run_supplement({**self.game, field: value})
                self.assertEqual(self.match, before)
                self.assertEqual(evidence[0]["decision"], "REALTIME_IDENTITY_MISMATCH")

    def test_conflicting_completed_points_do_not_override_schedule(self):
        evidence, _ = self.run_supplement({**self.game, "homeS1Point": 22})
        self.assertEqual(evidence[0]["decision"], "COMPLETED_POINTS_CONFLICT")
        self.assertEqual(len(self.match["sets"]), 1)

    def test_incomplete_second_does_not_certify_third_or_invent_points(self):
        evidence, _ = self.run_supplement({**self.game, "homeS2Point": 24})
        self.assertEqual(evidence[0]["decision"], "REALTIME_POINTS_INCOMPLETE")
        self.assertEqual(len(self.match["sets"]), 1)

    def test_missing_set_in_middle_rejects_supplement(self):
        evidence, _ = self.run_supplement({**self.game, "homeS2Point": 0, "awayS2Point": 0})
        self.assertEqual(evidence[0]["decision"], "REALTIME_POINTS_GAP")

    def test_behind_broadcast_does_not_roll_back_wins(self):
        evidence, _ = self.run_supplement({**self.game, "awaySetPoint": 1, "setIng": 3})
        self.assertEqual(evidence[0]["decision"], "REALTIME_BEHIND_SCHEDULE")
        self.assertEqual(self.match["sets_won"], {"home": 1, "away": 2})

    def test_ahead_broadcast_can_fill_only_schedule_confirmed_prefix(self):
        game = {**self.game, "awaySetPoint": 3, "setIng": 4, "homeS4Point": 18, "awayS4Point": 25}
        self.run_supplement(game)
        self.assertEqual(len(self.match["sets"]), 3)
        self.assertEqual(self.match["sets_won"], {"home": 1, "away": 2})
        self.assertNotIn("final_pending", self.match)

    def test_winning_counter_still_requires_schedule_final_marker(self):
        self.match.update(sets_won={"home": 1, "away": 3}, final_pending=True)
        self.run_supplement({**self.game, "awaySetPoint": 3, "homeS4Point": 18, "awayS4Point": 25})
        self.assertEqual(len(self.match["sets"]), 4)
        self.assertEqual(self.match["status"], "live")
        self.assertTrue(self.match["final_pending"])

    def test_fifth_set_15_point_rule(self):
        self.match.update(sets_won={"home": 3, "away": 2}, final_pending=True)
        self.run_supplement({**self.game, "homeSetPoint": 3, "setIng": 5,
                            "homeS4Point": 25, "awayS4Point": 20,
                            "homeS5Point": 16, "awayS5Point": 14})
        self.assertEqual(len(self.match["sets"]), 5)
        self.assertEqual(self.match["status"], "live")

    def test_boolean_missing_negative_and_noninteger_points_are_rejected(self):
        for value in [True, None, -1, "25", 25.0, 200]:
            with self.subTest(value=value):
                evidence, _ = self.run_supplement({**self.game, "homeS2Point": value})
                self.assertEqual(evidence[0]["decision"], "REALTIME_INVALID_FIELDS")
                self.assertEqual(len(self.match["sets"]), 1)

    def test_optional_connection_denial_keeps_valid_primary_and_sanitizes_error(self):
        before, evidence = deepcopy(self.match), []
        def failed(url):
            raise source.SourceError("secret_DO_NOT_PERSIST")
        source.supplement_live_points([self.match], failed, STAMP, evidence)
        self.assertEqual(self.match, before)
        self.assertEqual(evidence[0]["decision"], "REALTIME_UNAVAILABLE")
        self.assertNotIn("secret", json.dumps(evidence))

    def test_no_lookup_for_final_complete_future_or_previous_day(self):
        for mode in ["final", "complete", "future", "yesterday", "postseason"]:
            with self.subTest(mode=mode):
                original = deepcopy(self.match)
                if mode == "final": self.match["status"] = "final"
                if mode == "complete": self.match["sets_won"] = {"home": 0, "away": 1}
                if mode == "future": self.match["date"] = "2026-11-01"
                if mode == "yesterday": self.match["date"] = "2026-10-30"
                if mode == "postseason": self.match["phase_id"] = "203"
                _, calls = self.run_supplement()
                self.assertFalse(calls)
                self.match = original

    def test_kst_date_and_per_collection_lookup_budget(self):
        observations, calls = [], []
        def failed(url):
            calls.append(url)
            raise source.SourceError("unavailable")
        source.supplement_live_points([deepcopy(self.match) for _ in range(6)], failed,
                                     "2026-10-30T15:30:00Z", observations)
        self.assertEqual(len(calls), source.MAX_LIVE_LOOKUPS)
        self.assertEqual(observations[-1]["decision"], "LOOKUP_LIMIT")

    def test_allowlist_rejects_expanded_query_cup_other_season_or_host(self):
        url = source.live_points_url(self.match)
        self.assertEqual(source.validate_request_url(url), url)
        for bad in [url + "&size=1", url.replace("size=1", "size=10000"),
                    url.replace("gcode=001", "gcode=002"), url.replace("season=023", "season=022"),
                    url.replace("user-api.kovo.co.kr", "example.com"), url + "&token=bad"]:
            with self.subTest(url=bad):
                with self.assertRaises(source.SourceError): source.validate_request_url(bad)

    def test_source_provenance_and_original_timestamp_survive_retention(self):
        self.run_supplement()
        rows = update.retained_live_sets({}, self.match, self.match["sets_won"], STAMP)
        self.assertEqual(len(rows), 3)
        self.assertTrue(all(r["sourceUrl"] == self.match["live_points_source_url"] for r in rows))
        local = {"source": self.match["source_url"], "officialSourceKey": self.match["source_key"],
                 "date": self.match["date"], "liveScore": {**self.match["sets_won"],
                 "sourceKey": self.match["source_key"], "observedAt": STAMP}, "liveSets": rows}
        self.match.pop("live_points_source_url")
        self.match["sets"] = self.match["sets"][:1]
        later = "2026-10-31T09:20:00Z"
        retained = update.retained_live_sets(local, self.match, self.match["sets_won"], later)
        self.assertEqual(retained[1:], rows[1:])
        self.assertEqual(retained[0]["observedAt"], later)

    def test_collect_season_emits_evidence_without_affecting_full_coverage(self):
        reader = FakeSeasonSource()
        row = reader.rows["MALE"][0]
        row.update(hspoint=1, aspoint=2, hs1point=23, as1point=25)
        evidence = []
        snapshot = source.collect_season(fetcher=reader, now=STAMP, live_observations=evidence)
        self.assertEqual(len(snapshot["matches"]), 252)
        self.assertEqual(evidence[0]["decision"], "REALTIME_IDENTITY_MISMATCH")

    def test_supplement_flows_to_public_live_sets_but_not_final_master_fields(self):
        originals, snapshot, values = fixture_bundle(finals=False)
        match = next(m for m in snapshot["matches"] if m["gender"] == "MALE")
        match.update(status="live", sets_won={"home": 1, "away": 2},
                     sets=[{"home": 23, "away": 25}])
        self.match = match
        self.game.update(gameNum=match["number"], homeCode=match["home"]["provider_code"],
                         awayCode=match["away"]["provider_code"], gameDate=match["date"],
                         gameStartTime=match["time"])
        self.run_supplement()
        plan = update.prepare_update(originals, snapshot, master_values=values)
        output = plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]
        self.assertEqual(len(output["liveSets"]), 3)
        self.assertEqual(output["liveScore"]["home"], 1)
        self.assertEqual(output["liveScore"]["away"], 2)
        self.assertIsNone(output.get("score"))
        self.assertTrue(all(row["sourceUrl"] == source.live_points_url(match) for row in output["liveSets"]))
        gate = update.publication_gate(plan)
        self.assertEqual(gate["status"], "PASS")
        self.assertIn(source.live_points_url(match), gate["files"][update.DATA_PATHS["MALE"]]["source_ids"])
        # The updater's existing MASTER contract still forbids provisional results.
        record = next(r for r in plan["matched"] if r["source_key"] == match["source_key"])
        self.assertIsNone(record["score"])

    def test_evidence_artifact_survives_later_collection_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, out = Path(tmp) / "root", Path(tmp) / "output"
            for path in update.DATA_PATHS.values():
                update.write_json(root / path, {})
            def failed(*, live_observations):
                live_observations.append({"source_key": "023:001:MALE:1", "decision": "REALTIME_UNAVAILABLE"})
                raise source.SourceError("Bounded diagnostic test")
            with patch.object(sys, "argv", ["updater", "--root", str(root), "--output", str(out)]), \
                    patch.object(update, "collect_season", side_effect=failed):
                self.assertEqual(update.main(), 1)
            evidence = json.loads((out / "source-observations.json").read_text())
            self.assertTrue(evidence["live_read"])
            self.assertEqual(evidence["matches"][0]["decision"], "REALTIME_UNAVAILABLE")
            self.assertEqual(json.loads((out / "report.json").read_text())["status"], "FAILED")


if __name__ == "__main__":
    unittest.main()

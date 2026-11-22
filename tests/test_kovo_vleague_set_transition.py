"""Synthetic boundary regressions; these are not a replay of a live API response."""
from copy import deepcopy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kovo_vleague_source as source
import kovo_vleague_update as update
from test_kovo_vleague_source import FIXTURE, STAMP
from test_kovo_vleague_update import fixture_bundle


class SetTransitionTests(unittest.TestCase):
    def make_match(self, gender="FEMALE", points=None, known=None):
        points = points or [(19, 25), (21, 25)]
        won = {"home": sum(h > a for h, a in points),
               "away": sum(h < a for h, a in points)}
        raw = deepcopy(FIXTURE["schedules"]["m" if gender == "MALE" else "w"]["rows"][0])
        raw.update(hspoint=won["home"], aspoint=won["away"], getime="", result="L")
        known = len(points) - 1 if known is None else known
        for n in range(1, 6):
            h, a = points[n - 1] if n <= known else (0, 0)
            raw.update({f"hs{n}point": h, f"as{n}point": a})
        match = source.normalize_match(raw, season="2026-27", gender=gender,
                    source_url=source.schedule_url("2026-27", gender), observed_at=STAMP)
        return match, self.make_game(match, points, won, len(points))

    def make_game(self, match, points, won, current_set):
        game = {"seasonCode": match["season_id"], "round": match["round"],
                "gameNum": match["number"], "homeCode": match["home"]["provider_code"],
                "awayCode": match["away"]["provider_code"], "gameDate": match["date"],
                "gameStartTime": match["time"], "homeSetPoint": won["home"],
                "awaySetPoint": won["away"], "setIng": current_set,
                "extra_private_field": "DO_NOT_PERSIST"}
        for n in range(1, 6):
            h, a = points[n - 1] if n <= len(points) else (0, 0)
            game.update({f"homeS{n}Point": h, f"awayS{n}Point": a})
        return game

    def supplement(self, match, game):
        observations = []
        payload = {"result": {"status": 200}, "payload": {
            "game": game, "player": "DO_NOT_PERSIST", "lineup": "DO_NOT_PERSIST",
            "feed": [{"secret": "DO_NOT_PERSIST"}]}}
        source.supplement_live_points([match], lambda _: payload, STAMP, observations)
        return observations[0]

    def test_one_through_four_set_breaks_keep_both_genders_exact_wins(self):
        # Alternating winners keep the first four sets non-final (2-2).
        all_points = [(19, 25), (26, 24), (21, 25), (25, 23)]
        for gender in ("MALE", "FEMALE"):
            for count in range(1, 5):
                with self.subTest(gender=gender, count=count):
                    match, game = self.make_match(gender, all_points[:count])
                    original = deepcopy(match)
                    evidence = self.supplement(match, game)
                    self.assertEqual(evidence["decision"], "SUPPLEMENTED")
                    self.assertEqual(evidence["selected_sets"], count)
                    self.assertEqual(evidence["realtime"]["counter_state"], "BETWEEN_SETS")
                    self.assertEqual(evidence["realtime"]["current_set"], count)
                    self.assertEqual(evidence["realtime"]["expected_current_set"], count + 1)
                    self.assertEqual(match["sets_won"], original["sets_won"])
                    self.assertEqual(match["status"], "live")
                    self.assertEqual(match["sets"], [{"home": h, "away": a}
                                                     for h, a in all_points[:count]])
                    self.assertNotIn("DO_NOT_PERSIST", json.dumps(evidence))

    def test_more_than_one_step_behind_or_ahead_is_still_rejected_and_diagnosed(self):
        for current_set in (1, 4, 5):
            with self.subTest(current_set=current_set):
                match, game = self.make_match()
                game["setIng"] = current_set
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                self.assertEqual(match, original)
                self.assertEqual(evidence["decision"], "REALTIME_SET_COUNTER_MISMATCH")
                self.assertEqual(evidence["realtime"]["current_set"], current_set)
                self.assertEqual(evidence["realtime"]["expected_current_set"], 3)
                self.assertEqual(evidence["realtime"]["wins"], {"home": 0, "away": 2})
                self.assertEqual(len(evidence["realtime"]["points"]), 2)
                self.assertNotIn("DO_NOT_PERSIST", json.dumps(evidence))

    def test_set_counter_invalid_types_and_ranges_remain_rejected(self):
        for value in (None, True, False, "2", 2.0, -1, 0, 6):
            with self.subTest(value=value):
                match, game = self.make_match()
                game["setIng"] = value
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                self.assertEqual(match, original)
                self.assertEqual(evidence["decision"], "REALTIME_INVALID_FIELDS")

    def test_zero_wins_never_certify_a_set(self):
        match, game = self.make_match()
        game.update(homeSetPoint=0, awaySetPoint=0, setIng=1)
        original = deepcopy(match)
        evidence = self.supplement(match, game)
        self.assertEqual(match, original)
        self.assertEqual(evidence["decision"], "REALTIME_BEHIND_SCHEDULE")

    def test_tied_deuce_and_incomplete_last_set_cannot_create_a_break(self):
        for h, a in [(21, 24), (24, 24), (24, 25), (25, 26), (26, 26)]:
            with self.subTest(points=(h, a)):
                match, game = self.make_match()
                game.update(homeS2Point=h, awayS2Point=a)
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                self.assertEqual(match, original)
                self.assertEqual(evidence["decision"], "REALTIME_SET_COUNTER_MISMATCH")

    def test_legal_points_must_equal_the_broadcast_winner_counters(self):
        match, game = self.make_match()
        # Two completed away wins cannot corroborate a claimed 1-1 break.
        game.update(homeSetPoint=1, awaySetPoint=1)
        original = deepcopy(match)
        evidence = self.supplement(match, game)
        self.assertEqual(match, original)
        self.assertEqual(evidence["decision"], "REALTIME_SET_COUNTER_MISMATCH")

    def test_next_set_points_reject_lagging_counter_even_if_terminal(self):
        for h, a in [(1, 0), (12, 10), (25, 23)]:
            with self.subTest(points=(h, a)):
                match, game = self.make_match()
                game.update(homeS3Point=h, awayS3Point=a)
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                self.assertEqual(match, original)
                self.assertEqual(evidence["decision"], "REALTIME_SET_COUNTER_MISMATCH")

    def test_missing_completed_set_and_gap_remain_rejected(self):
        for gap in (False, True):
            with self.subTest(gap=gap):
                match, game = self.make_match()
                game.update(homeS2Point=0, awayS2Point=0)
                if gap:
                    game.update(homeS3Point=1, awayS3Point=0)
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                self.assertEqual(match, original)
                self.assertEqual(evidence["decision"],
                                 "REALTIME_POINTS_GAP" if gap else "REALTIME_SET_COUNTER_MISMATCH")

    def test_break_cannot_overwrite_different_completed_schedule_points(self):
        match, game = self.make_match()
        game["homeS1Point"] = 20
        original = deepcopy(match)
        evidence = self.supplement(match, game)
        self.assertEqual(match, original)
        self.assertEqual(evidence["decision"], "COMPLETED_POINTS_CONFLICT")

    def test_behind_break_never_rolls_schedule_back(self):
        match, _ = self.make_match()
        game = self.make_game(match, [(19, 25)], {"home": 0, "away": 1}, 1)
        original = deepcopy(match)
        evidence = self.supplement(match, game)
        self.assertEqual(match, original)
        self.assertEqual(evidence["decision"], "REALTIME_BEHIND_SCHEDULE")

    def test_ahead_break_can_publish_only_the_schedule_confirmed_prefix(self):
        match, _ = self.make_match(points=[(19, 25)], known=0)
        game = self.make_game(match, [(19, 25), (21, 25)], {"home": 0, "away": 2}, 2)
        evidence = self.supplement(match, game)
        self.assertEqual(evidence["selected_sets"], 1)
        self.assertEqual(match["sets"], [{"home": 19, "away": 25}])
        self.assertEqual(match["sets_won"], {"home": 0, "away": 1})

    def test_wrong_game_identity_rejects_before_recording_its_fields(self):
        for field, value in [("gameNum", 999), ("homeCode", "BAD"), ("awayCode", "BAD"),
                             ("seasonCode", "022"), ("round", 2),
                             ("gameDate", "2026-11-19"), ("gameStartTime", "25:00")]:
            with self.subTest(field=field):
                match, game = self.make_match()
                game[field] = value
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                self.assertEqual(match, original)
                self.assertEqual(evidence["decision"], "REALTIME_IDENTITY_MISMATCH")
                self.assertNotIn("wins", evidence["realtime"])
                self.assertNotIn("points", evidence["realtime"])

    def test_normal_fourth_and_fifth_set_still_exclude_inplay_points(self):
        for points in [[(19, 25), (25, 23), (21, 25)],
                       [(19, 25), (25, 23), (21, 25), (26, 24)]]:
            with self.subTest(completed=len(points)):
                match, game = self.make_match(points=points)
                count = len(points)
                game.update(setIng=count + 1,
                            **{f"homeS{count + 1}Point": 8, f"awayS{count + 1}Point": 6})
                evidence = self.supplement(match, game)
                self.assertEqual(evidence["realtime"]["counter_state"], "CURRENT")
                self.assertEqual(evidence["selected_sets"], count)
                self.assertEqual(len(match["sets"]), count)

    def test_final_fifth_set_requires_exact_counter_and_never_promotes_final_status(self):
        points = [(19, 25), (25, 23), (21, 25), (26, 24), (16, 14)]
        for current_set in (4, 5):
            with self.subTest(current_set=current_set):
                match, game = self.make_match(points=points)
                game["setIng"] = current_set
                original = deepcopy(match)
                evidence = self.supplement(match, game)
                if current_set == 4:
                    self.assertEqual(match, original)
                    self.assertEqual(evidence["decision"], "REALTIME_SET_COUNTER_MISMATCH")
                else:
                    self.assertEqual(evidence["selected_sets"], 5)
                    self.assertEqual(evidence["realtime"]["counter_state"], "CURRENT")
                    self.assertEqual(match["status"], "live")
                    self.assertTrue(match["final_pending"])

    def test_both_gender_breaks_flow_to_live_json_but_not_final_master_scores(self):
        originals, snapshot, values = fixture_bundle(finals=False)
        for gender in ("MALE", "FEMALE"):
            match = next(m for m in snapshot["matches"] if m["gender"] == gender)
            match.update(status="live", sets_won={"home": 0, "away": 2},
                         sets=[{"home": 19, "away": 25}])
            game = self.make_game(match, [(19, 25), (21, 25)], match["sets_won"], 2)
            evidence = self.supplement(match, game)
            self.assertEqual(evidence["decision"], "SUPPLEMENTED")
        plan = update.prepare_update(originals, snapshot, master_values=values)
        for gender in ("MALE", "FEMALE"):
            match = next(m for m in snapshot["matches"] if m["gender"] == gender)
            record = next(r for r in plan["matched"] if r["source_key"] == match["source_key"])
            candidate = plan["candidates"][update.DATA_PATHS[gender]]
            public = next(m for m in candidate["matches"] if m["id"] == record["match_id"])
            self.assertEqual((public["liveScore"]["home"], public["liveScore"]["away"]), (0, 2))
            self.assertEqual([(r["home"], r["away"]) for r in public["liveSets"]], [(19, 25), (21, 25)])
            self.assertTrue(all(r["observedAt"] == STAMP for r in public["liveSets"]))
            self.assertIsNone(public.get("score"))
            self.assertIsNone(record["score"])
        self.assertEqual(update.publication_gate(plan)["status"], "PASS")
        self.assertFalse(plan["report"]["master_written"])
        self.assertFalse(plan["report"]["production_written"])


if __name__ == "__main__":
    unittest.main()

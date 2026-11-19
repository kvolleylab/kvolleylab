"""Synthetic integration regressions; never evidence of a real live deployment."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from test_kovo_vleague_update import fixture_bundle, IntegrationSource, candidate_originals
from test_kovo_vleague_source import STAMP
import kovo_vleague_source as source
import kovo_vleague_update as update
from kovo_vleague_standings import StandingsError


class FinalAttributionTests(unittest.TestCase):
    def supplemented_bundle(self):
        originals, _, values = fixture_bundle()
        reader = IntegrationSource()
        games = {}
        for gender in source.GENDERS:
            row = reader.rows[gender][0]
            games[row["gnum"]] = {
                "seasonCode": row["seasonCode"], "round": row["round"],
                "gameNum": row["gnum"], "homeCode": row["hcode"], "awayCode": row["acode"],
                "gameDate": row["gdate"], "gameStartTime": row["gstime"],
                "homeSetPoint": row["hspoint"], "awaySetPoint": row["aspoint"],
                "setIng": row["hspoint"] + row["aspoint"],
                **{f"{side}S{n}Point": row[f"{short}s{n}point"]
                   for side, short in (("home", "h"), ("away", "a")) for n in range(1, 6)},
            }
            for n in range(2, 6):
                row[f"hs{n}point"] = row[f"as{n}point"] = 0
        def fetch(url):
            if urlsplit(url).path == "/stat/real-time":
                game = games[int(parse_qs(urlsplit(url).query)["gnum"][0])]
                return {"result": {"status": 200}, "payload": {"game": deepcopy(game)}}
            return reader(url)
        snapshot = source.collect_season(fetcher=fetch, now=STAMP)
        return originals, snapshot, values

    def test_full_source_to_master_plan_json_and_export_receipt_both_genders(self):
        originals, snapshot, values = self.supplemented_bundle()
        before = deepcopy((originals, values))
        plan = update.prepare_update(originals, snapshot, master_values=values)
        gate = update.publication_gate(plan)
        self.assertEqual(gate["status"], "PASS")
        self.assertEqual((originals, values), before)
        for gender, path in update.DATA_PATHS.items():
            with self.subTest(gender=gender):
                observed = next(m for m in snapshot["matches"] if m["gender"] == gender)
                match = plan["candidates"][path]["matches"][0]
                self.assertEqual(match["status"], "final")
                self.assertEqual(len(match["score"]["sets"]), sum(observed["sets_won"].values()))
                self.assertEqual(match["scoreSourceUrl"], source.live_points_url(observed))
                self.assertIn(match["scoreSourceUrl"], gate["files"][path]["source_ids"])
                self.assertNotIn("liveScore", match)
                matched = next(r for r in plan["matched"] if r["match_id"] == match["id"])
                self.assertEqual(matched["score"], match["score"])
                self.assertEqual(plan["candidates"][path]["participants"], originals[gender]["participants"])
        self.assertTrue(plan["master_plan"]["changes"])
        self.assertFalse(plan["report"]["production_written"])
        self.assertFalse(plan["report"]["master_written"])

    def test_final_attribution_survives_schedule_catching_up_without_new_result(self):
        originals, snapshot, _ = self.supplemented_bundle()
        plan = update.prepare_update(originals, snapshot)
        published = candidate_originals(plan)
        for record in snapshot["matches"]:
            record.pop("final_points_source_url", None)
        again = update.prepare_update(published, snapshot,
                                      previous_state=plan["candidates"][update.STATE_PATH])
        self.assertEqual(again["changed_files"], [])
        gate = update.publication_gate(again)
        for gender, path in update.DATA_PATHS.items():
            url = published[gender]["matches"][0]["scoreSourceUrl"]
            self.assertIn(url, gate["files"][path]["source_ids"])

    def test_incomplete_or_wrongly_attributed_final_snapshot_cannot_escape(self):
        originals, snapshot, _ = fixture_bundle()
        baseline = deepcopy(snapshot["matches"][0])
        for mutation in [
            {"status": "final_points_pending"},
            {"final_points_source_url": "https://example.com/fake"},
            {"final_points_source_url": source.live_points_url(baseline), "end_time": None},
            {"final_points_source_url": source.live_points_url(baseline), "end_time": "25:00"},
            {"final_points_source_url": source.live_points_url(baseline), "sets": baseline["sets"][:1]},
        ]:
            with self.subTest(mutation=mutation):
                snapshot["matches"][0] = {**baseline, **mutation}
                with self.assertRaises((update.UpdateError, StandingsError)):
                    update.prepare_update(originals, snapshot)

    def test_official_standings_mismatch_remains_blocking_after_supplement(self):
        originals, snapshot, _ = self.supplemented_bundle()
        snapshot["official_standings"][0]["rows"][0]["points"] += 1
        with self.assertRaises(StandingsError):
            update.prepare_update(originals, snapshot)


if __name__ == "__main__":
    unittest.main()

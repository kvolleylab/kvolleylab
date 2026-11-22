"""Synthetic end-transition safety regressions, not actual live-match evidence."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_kovo_vleague_source import FakeSeasonSource, STAMP, synthetic_postseason, source


THREE = [(26, 24), (25, 18), (25, 17)]
FOUR = [(19, 25), (20, 25), (25, 18), (23, 25)]
FIVE = [(25, 20), (20, 25), (27, 25), (23, 25), (18, 16)]


def set_result(row, points, *, prefix=1, end="21:30"):
    home = sum(h > a for h, a in points)
    row.update(hspoint=home, aspoint=len(points)-home, getime=end,
               result="W" if home == 3 else "L")
    for n in range(1, 6):
        h, a = points[n-1] if n <= prefix else (0, 0)
        row.update({f"hs{n}point": h, f"as{n}point": a})
    return row


def broadcast(row, points):
    game = {"seasonCode": row["seasonCode"], "round": row["round"],
            "gameNum": row["gnum"], "homeCode": row["hcode"], "awayCode": row["acode"],
            "gameDate": row["gdate"], "gameStartTime": row["gstime"],
            "homeSetPoint": row["hspoint"], "awaySetPoint": row["aspoint"],
            "setIng": len(points)}
    for n in range(1, 6):
        h, a = points[n-1] if n <= len(points) else (0, 0)
        game.update({f"homeS{n}Point": h, f"awayS{n}Point": a})
    return {"result": {"status": 200}, "payload": {"game": game,
            "players": [{"ignored": "NEVER_COPY_PLAYER_DATA"}]}}


class EndedSeason(FakeSeasonSource):
    def __init__(self, gender="FEMALE", points=FOUR, *, prefix=1, end="21:30"):
        super().__init__()
        self.gender = gender
        self.row = set_result(self.rows[gender][0], points, prefix=prefix, end=end)
        self.broadcast = broadcast(self.row, points)
        self.unavailable = False

    def __call__(self, url):
        if urlsplit(url).path == "/stat/real-time":
            self.calls.append(url)
            source.validate_request_url(url)
            query = parse_qs(urlsplit(url).query)
            assert query["gnum"] == [str(self.row["gnum"])]
            assert query["page"] == ["0"] and query["size"] == ["1"]
            if self.unavailable:
                raise source.SourceError("unavailable synthetic source")
            return deepcopy(self.broadcast)
        return super().__call__(url)

    def collect(self, observations=None, *, now=STAMP):
        return source.collect_season(fetcher=self, now=now,
                                     live_observations=observations)


class FinalSupplementTests(unittest.TestCase):
    def test_both_genders_three_four_five_sets_and_deuce_require_all_final_points(self):
        for gender in source.GENDERS:
            for points in (THREE, FOUR, FIVE):
                for prefix in (1, len(points)-1):
                    with self.subTest(gender=gender, sets=len(points), prefix=prefix):
                        reader = EndedSeason(gender, points, prefix=prefix)
                        observations = []
                        snapshot = reader.collect(observations)
                        match = next(m for m in snapshot["matches"] if m["number"] == reader.row["gnum"])
                        self.assertEqual(match["status"], "final")
                        self.assertEqual(match["sets"], [{"home": h, "away": a} for h, a in points])
                        self.assertEqual(match["final_points_source_url"], source.live_points_url(match))
                        self.assertNotIn("live_points_source_url", match)
                        self.assertNotIn("final_pending", match)
                        self.assertEqual(len(snapshot["matches"]), 252)
                        self.assertTrue(snapshot["coverage"]["complete"])
                        self.assertFalse(any(m["status"] == "final_points_pending" for m in snapshot["matches"]))
                        evidence = next(o for o in observations if o["source_key"] == match["source_key"])
                        self.assertEqual(evidence["decision"], "FINAL_SUPPLEMENTED")
                        self.assertEqual(evidence["selected_sets"], len(points))
                        self.assertEqual(evidence["schedule"]["end_time"], "21:30")
                        self.assertNotIn("NEVER_COPY_PLAYER_DATA", str(observations))

    def test_complete_schedule_remains_authoritative_without_extra_request(self):
        reader = EndedSeason(prefix=4)
        snapshot = reader.collect()
        match = next(m for m in snapshot["matches"] if m["number"] == reader.row["gnum"])
        self.assertEqual(match["status"], "final")
        self.assertNotIn("final_points_source_url", match)
        self.assertFalse(any("/stat/real-time?" in u for u in reader.calls))

    def test_direct_normalization_stays_strict(self):
        reader = EndedSeason()
        with self.assertRaises(source.SourceError):
            source.normalize_match(reader.row, season="2026-27", gender=reader.gender,
                                   source_url=source.schedule_url("2026-27", reader.gender), observed_at=STAMP)
        with self.assertRaises(source.SourceError):
            source.read_gender_schedule(reader, season="2026-27", gender=reader.gender, observed_at=STAMP)

    def test_unavailable_missing_incomplete_conflicting_or_extra_points_fail_closed(self):
        mutations = {
            "unavailable": lambda r: setattr(r, "unavailable", True),
            "game missing": lambda r: r.broadcast["payload"].pop("game"),
            "only prefix": lambda r: r.broadcast["payload"]["game"].update(homeS2Point=0,awayS2Point=0,homeS3Point=0,awayS3Point=0,homeS4Point=0,awayS4Point=0),
            "missing last": lambda r: r.broadcast["payload"]["game"].update(homeS4Point=0,awayS4Point=0),
            "unfinished last": lambda r: r.broadcast["payload"]["game"].update(homeS4Point=21,awayS4Point=21),
            "prefix conflict": lambda r: r.broadcast["payload"]["game"].update(homeS1Point=18),
            "winner conflict": lambda r: r.broadcast["payload"]["game"].update(homeS4Point=25,awayS4Point=23),
            "extra set": lambda r: r.broadcast["payload"]["game"].update(homeS5Point=1,awayS5Point=0),
            "counter lag": lambda r: r.broadcast["payload"]["game"].update(setIng=3),
            "counter ahead": lambda r: r.broadcast["payload"]["game"].update(setIng=5),
            "different wins": lambda r: r.broadcast["payload"]["game"].update(homeSetPoint=2,awaySetPoint=3,setIng=5),
        }
        for label, mutate in mutations.items():
            with self.subTest(label=label):
                reader, observations = EndedSeason(), []
                mutate(reader)
                with self.assertRaisesRegex(source.SourceError, "complete corroborated"):
                    reader.collect(observations)
                self.assertTrue(observations)
                self.assertNotEqual(observations[-1]["decision"], "FINAL_SUPPLEMENTED")

    def test_identity_fields_must_match_exactly(self):
        wrong = {"seasonCode": "022", "round": 2, "gameNum": 42,
                 "homeCode": "2007", "awayCode": "2006", "gameDate": "2026-11-01",
                 "gameStartTime": "25:00"}
        for field, value in wrong.items():
            with self.subTest(field=field):
                reader, observations = EndedSeason(), []
                reader.broadcast["payload"]["game"][field] = value
                with self.assertRaises(source.SourceError):
                    reader.collect(observations)
                self.assertEqual(observations[-1]["decision"], "REALTIME_IDENTITY_MISMATCH")

    def test_invalid_schedule_is_not_rescued_by_healthy_broadcast(self):
        mutations = {
            "no prefix": {"hs1point": 0, "as1point": 0},
            "unfinished prefix": {"hs1point": 22, "as1point": 24},
            "wrong prefix winner": {"hs1point": 25, "as1point": 19, "hs2point": 25, "as2point": 20},
            "missing field": {"hs1point": None},
            "gap": {"hs3point": 25, "as3point": 18},
            "invalid final wins": {"aspoint": 2},
            "winner marker": {"result": "W"},
        }
        for label, values in mutations.items():
            with self.subTest(label=label):
                reader = EndedSeason()
                reader.row.update(values)
                with self.assertRaises(source.SourceError):
                    reader.collect()
                self.assertFalse(any("/stat/real-time?" in u for u in reader.calls))

    def test_missing_end_marker_never_becomes_final(self):
        reader = EndedSeason(end="")
        snapshot = reader.collect()
        match = next(m for m in snapshot["matches"] if m["number"] == reader.row["gnum"])
        self.assertEqual(match["status"], "live")
        self.assertTrue(match["final_pending"])
        self.assertNotIn("final_points_source_url", match)

    def test_past_future_and_postseason_incomplete_finals_remain_blocked(self):
        for now in ("2026-10-30T09:00:00Z", "2026-11-01T09:00:00Z"):
            with self.subTest(now=now):
                reader = EndedSeason()
                with self.assertRaises(source.SourceError):
                    reader.collect(now=now)
                self.assertFalse(any("/stat/real-time?" in u for u in reader.calls))
        row = set_result(synthetic_postseason(final=True), THREE)
        with self.assertRaises(source.SourceError):
            source.normalize_match(row, season="2026-27", gender="MALE", phase_id="202",
                                   source_url=source.schedule_url("2026-27", "MALE", phase_id="202"),
                                   observed_at="2027-04-08T12:00:00Z", allow_final_supplement=True)


if __name__ == "__main__":
    unittest.main()

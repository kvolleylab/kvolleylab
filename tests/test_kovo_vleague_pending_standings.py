"""Synthetic API ordering regressions, not evidence of a live recovery.

Official standings can include a just-ended game before schedule.getime arrives.
Only that fully reconciled ordering gap may retain the previous rank table while
publishing independently certified finalPending points. No operational writes.
"""
from copy import deepcopy
from datetime import datetime, timedelta
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import kovo_vleague_update as update
import kovo_vleague_source as source
import kovo_vleague_master as master
from kovo_vleague_standings import calculate_standings, OFFICIAL_TOTAL_FIELDS, StandingsError
from test_kovo_vleague_update import fixture_bundle, candidate_originals, seed_root, MemorySheets
from test_kovo_vleague_resilience import division_snapshot


SCORES = {
    (3, 0): [(25, 20)] * 3,
    (0, 3): [(20, 25)] * 3,
    (3, 1): [(25, 20), (20, 25), (25, 20), (25, 20)],
    (1, 3): [(20, 25), (25, 20), (20, 25), (20, 25)],
    (3, 2): [(25, 20), (20, 25), (25, 20), (20, 25), (15, 13)],
    (2, 3): [(20, 25), (25, 20), (20, 25), (25, 20), (13, 15)],
}


def set_ranks(snapshot, originals, *, include_pending=False):
    for gender, original in originals.items():
        records = [r for r in snapshot["matches"] if r["gender"] == gender]
        local = deepcopy(original["matches"])
        for match, record in zip(local, records):
            if record["status"] == "final" or include_pending and record.get("final_pending"):
                match.update(status="final", score={**record["sets_won"], "sets": record["sets"]})
            else:
                match.pop("score", None)
                match["status"] = record["status"]
        rows = calculate_standings(original["participants"], local, rules_verified=True)["rows"]
        official = next(r for r in snapshot["official_standings"] if r["gender"] == gender)
        official["rows"] = [
            {"provider_code": source.GENDERS[gender] + row["team"]["code"][1:].zfill(3),
             "name": row["team"]["name"], "rank": index,
             **{field: row[key] for field, key in OFFICIAL_TOTAL_FIELDS.items()}}
            for index, row in enumerate(rows, 1) if row["games"]]


def bundle(gender="MALE", wins=(2, 3)):
    raw, initial, values = fixture_bundle(finals=False)
    for g in update.DIVISIONS:
        records = [r for r in initial["matches"] if r["gender"] == g]
        # All seven teams already have verified standings; all numbers synthetic.
        for record in records[:6]:
            record.update(status="final", end_time="20:00", sets_won={"home": 3, "away": 0},
                          sets=[{"home": 25, "away": 20}] * 3)
    target = [r for r in initial["matches"] if r["gender"] == gender][6]
    initial["fetched_at"] = target["date"] + "T09:00:00+00:00"
    target.update(status="live", sets_won={"home": 0, "away": 0}, sets=[])
    set_ranks(initial, raw)
    prior = update.prepare_update(raw, initial, master_values=values)
    client = MemorySheets(values)
    master.apply_update_plan(client, prior["master_plan"])
    client.writes.clear()
    originals, state = candidate_originals(prior), prior["candidates"][update.STATE_PATH]
    snapshot = deepcopy(initial)
    snapshot["fetched_at"] = (datetime.fromisoformat(initial["fetched_at"]) + timedelta(minutes=20)).isoformat()
    pending = next(r for r in snapshot["matches"] if r["source_key"] == target["source_key"])
    pending.update(sets_won={"home": wins[0], "away": wins[1]}, final_pending=True,
                   sets=[{"home": h, "away": a} for h, a in SCORES[wins]])
    pending["live_points_source_url"] = source.live_points_url(pending)
    set_ranks(snapshot, originals, include_pending=True)
    return originals, snapshot, state, client, pending


class PendingStandingsTests(unittest.TestCase):
    def plan(self, original, snapshot, state, client):
        return update.prepare_update(original, snapshot, state, client.values)

    def test_both_divisions_all_terminal_scores_keep_rank_and_publish_only_live(self):
        for gender in update.DIVISIONS:
            for wins in SCORES:
                with self.subTest(gender=gender, wins=wins):
                    original, snapshot, state, client, pending = bundle(gender, wins)
                    before = deepcopy((original, snapshot, state, client.values))
                    plan = self.plan(original, snapshot, state, client)
                    candidate = plan["candidates"][update.DATA_PATHS[gender]]
                    game = next(m for m in candidate["matches"] if m.get("officialSourceKey") == pending["source_key"])
                    self.assertEqual(game["status"], "live")
                    self.assertTrue(game["liveScore"]["finalPending"])
                    self.assertEqual((game["liveScore"]["home"], game["liveScore"]["away"]), wins)
                    self.assertEqual(len(game["liveSets"]), sum(wins))
                    self.assertNotIn("score", game)
                    self.assertEqual(candidate["standings"], original[gender]["standings"])
                    self.assertIn(original[gender]["standingsNote"], candidate["standingsNote"])
                    self.assertEqual(plan["report"]["standings_reconciliation_pending"], [gender])
                    self.assertFalse(plan["report"]["divisions"][gender]["standings_verified"])
                    self.assertEqual(plan["report"]["status"], "PARTIAL_READY")
                    self.assertEqual(plan["report"]["error_code"], "StandingsReconciliationPending")
                    self.assertEqual(plan["master_plan"]["changes"], [])
                    self.assertEqual(before, (original, snapshot, state, client.values))

    def test_isolated_pipeline_keeps_quality_security_master_and_honest_receipt(self):
        original, snapshot, state, client, pending = bundle()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            seed_root(root, original, state)
            plan = update.prepare_isolated_update(root, original, state, client.values,
                                                  lambda g: division_snapshot(snapshot, g))
            self.assertEqual(plan["report"]["held_divisions"], [])
            self.assertEqual(plan["report"]["standings_reconciliation_pending"], ["MALE"])
            self.assertTrue(all(r["outcome"] == "PASS" for r in update.quality_audit_gate(root, plan)))
            gate = update.publication_gate(plan)
            self.assertEqual(gate["status"], "PASS")
            entry = gate["files"][update.DATA_PATHS["MALE"]]
            self.assertIn("prior verified standings preserved", entry["verification_method"])
            self.assertIn("no new final result or rank", entry["verification_scope"])
            self.assertEqual(update.incomplete_live_points(plan), [])
            master.apply_update_plan(client, plan["master_plan"])
            self.assertEqual(client.writes, [])

    def test_wrong_official_totals_or_structure_never_get_the_ordering_exception(self):
        mutations = [(field, lambda rows, f=field: rows[0].__setitem__(f, rows[0][f] + 1))
                     for field in OFFICIAL_TOTAL_FIELDS]
        mutations += [
            ("missing team", lambda rows: rows.pop()),
            ("duplicate team", lambda rows: rows.__setitem__(-1, deepcopy(rows[0]))),
            ("duplicate rank", lambda rows: rows[-1].__setitem__("rank", rows[0]["rank"])),
            ("boolean", lambda rows: rows[-1].__setitem__("points", True)),
            ("name", lambda rows: rows[-1].__setitem__("name", "UNTRUSTED")),
        ]
        for label, mutation in mutations:
            with self.subTest(label=label):
                original, snapshot, state, client, _ = bundle()
                rows = next(r for r in snapshot["official_standings"] if r["gender"] == "MALE")["rows"]
                mutation(rows)
                with self.assertRaises((StandingsError, update.UpdateError)):
                    self.plan(original, snapshot, state, client)
                self.assertEqual(client.writes, [])

    def test_unrelated_changes_or_unverified_pending_points_still_block(self):
        def change_final(original, snapshot, state, client, pending):
            game = next(r for r in snapshot["matches"] if r["gender"] == "MALE" and r["status"] == "final")
            game["sets"][0] = {"home": 25, "away": 19}
        cases = {
            "incomplete points": lambda o, s, st, c, p: p["sets"].pop(),
            "illegal fifth": lambda o, s, st, c, p: p["sets"][-1].update(home=14, away=15),
            "winner mismatch": lambda o, s, st, c, p: p["sets_won"].update(home=3, away=2),
            "old observation": lambda o, s, st, c, p: s.update(fetched_at=(datetime.fromisoformat(s["fetched_at"]) + timedelta(days=1)).isoformat()),
            "changed final": change_final,
            "changed schedule": lambda o, s, st, c, p: s["matches"][10].update(time="15:00"),
            "tampered old totals": lambda o, s, st, c, p: o["MALE"]["standings"]["rows"][0].update(points=999),
            "tampered old rank": lambda o, s, st, c, p: o["MALE"]["standings"]["rows"][0].update(rank=7),
            "untrusted prior": lambda o, s, st, c, p: o["MALE"]["automation"].update(version=1),
            "different source": lambda o, s, st, c, p: o["MALE"]["automation"].update(standingsSource="https://example.com"),
            "missing identity state": lambda o, s, st, c, p: st.clear(),
            "missing identity links": lambda o, s, st, c, p: st.update(links={}),
        }
        for label, mutation in cases.items():
            with self.subTest(label=label):
                args = bundle()
                mutation(*args)
                with self.assertRaises((StandingsError, update.UpdateError)):
                    self.plan(*args[:4])

    def test_first_connection_does_not_get_pending_order_exception(self):
        original, snapshot, state, client, _ = bundle()
        with self.assertRaises(StandingsError):
            self.plan(original, snapshot, None, client)

    def test_final_end_marker_returns_to_strict_normal_pipeline_without_duplicate_result(self):
        original, snapshot, state, client, pending = bundle()
        first = self.plan(original, snapshot, state, client)
        current = candidate_originals(first)
        again = self.plan(current, snapshot, first["candidates"][update.STATE_PATH], client)
        self.assertEqual(again["changed_files"], [])
        self.assertEqual(again["candidates"][update.DATA_PATHS["MALE"]]["standingsNote"].count(update.STANDINGS_PENDING_PREFIX), 1)
        pending.update(status="final", end_time="20:25")
        pending.pop("final_pending")
        pending.pop("live_points_source_url")
        snapshot["fetched_at"] = (datetime.fromisoformat(snapshot["fetched_at"]) + timedelta(minutes=20)).isoformat()
        final = self.plan(current, snapshot, first["candidates"][update.STATE_PATH], client)
        candidate = final["candidates"][update.DATA_PATHS["MALE"]]
        game = next(m for m in candidate["matches"] if m.get("officialSourceKey") == pending["source_key"])
        self.assertEqual(game["status"], "final")
        self.assertEqual(game["score"], {**pending["sets_won"], "sets": pending["sets"]})
        self.assertNotIn("liveScore", game)
        self.assertNotIn("standingsReconciliationPending", candidate)
        self.assertNotIn(update.STANDINGS_PENDING_PREFIX, candidate["standingsNote"])
        self.assertEqual(final["report"]["standings_reconciliation_pending"], [])
        self.assertTrue(final["report"]["divisions"]["MALE"]["standings_verified"])
        self.assertEqual(len(final["master_plan"]["changes"]), 4)
        master.apply_update_plan(client, final["master_plan"])
        second = self.plan(candidate_originals(final), snapshot, final["candidates"][update.STATE_PATH], client)
        self.assertEqual(second["changed_files"], [])
        self.assertEqual(second["master_plan"]["changes"], [])

    def test_diagnostics_are_typed_aggregates_not_raw_exception_text(self):
        original, snapshot, state, client, _ = bundle()
        ranks = next(r for r in snapshot["official_standings"] if r["gender"] == "MALE")["rows"]
        ranks[0]["played"] += 1
        with tempfile.TemporaryDirectory() as tmp:
            seed_root(Path(tmp), original, state)
            plan = update.prepare_isolated_update(Path(tmp), original, state, client.values,
                                                  lambda g: division_snapshot(snapshot, g))
        diagnostic = plan["report"]["division_failures"]["MALE"]["standings_diagnostic"]
        self.assertEqual(set(diagnostic), {"code", "team", "field", "official", "derived"})
        self.assertEqual(diagnostic["code"], "OFFICIAL_TOTAL_MISMATCH")
        for value in ({"raw": "secret"}, {**diagnostic, "official": True},
                      {**diagnostic, "team": "secret/token"}, {**diagnostic, "field": "payload"}):
            self.assertIsNone(update.safe_standings_diagnostic(StandingsError("secret", diagnostic=value)))


if __name__ == "__main__":
    unittest.main()

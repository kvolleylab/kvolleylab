"""Synthetic, offline division-isolation regressions; not live recovery evidence.

Fixtures and the in-memory Sheet contain no operational credentials or private
MASTER data. Network collection and actual production writes are never used.
"""
from copy import deepcopy
from datetime import datetime, timedelta
from contextlib import redirect_stderr, redirect_stdout
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import kovo_vleague_update as update
import kovo_vleague_master as master
import kovo_vleague_source as source
import kvl_competition_lifecycle as lifecycle
from test_kovo_vleague_update import fixture_bundle, candidate_originals, seed_root, MemorySheets, STAMP, add_postseason


def division_snapshot(snapshot, gender):
    """Restrict an already synthetic complete season to the requested division."""
    result = deepcopy(snapshot)
    result["coverage"]["genders"] = [gender]
    result["coverage"]["postseason"] = [r for r in result["coverage"]["postseason"] if r["gender"] == gender]
    for key in ("matches", "pending_matches", "official_standings"):
        result[key] = [r for r in result.get(key, []) if r["gender"] == gender]
    return result


class DivisionIsolationTests(unittest.TestCase):
    def setUp(self):
        raw, initial, rows = fixture_bundle(finals=False)
        for gender in update.DIVISIONS:
            first = next(r for r in initial["matches"] if r["gender"] == gender)
            first.update(status="live", sets_won={"home": 0, "away": 1}, sets=[{"home": 21, "away": 25}])
        prior = update.prepare_update(raw, initial, master_values=rows)
        self.originals = candidate_originals(prior)
        self.previous = prior["candidates"][update.STATE_PATH]
        self.client = MemorySheets(rows)
        master.apply_update_plan(self.client, prior["master_plan"])
        self.client.writes.clear()
        self.snapshot = deepcopy(initial)
        self.snapshot["fetched_at"] = (datetime.fromisoformat(STAMP) + timedelta(minutes=20)).isoformat()
        for r in self.snapshot["matches"] + self.snapshot["official_standings"]:
            r["observed_at"] = self.snapshot["fetched_at"]
        for gender in update.DIVISIONS:
            first = next(r for r in self.snapshot["matches"] if r["gender"] == gender)
            first.update(sets_won={"home": 1, "away": 1},
                         sets=[{"home": 21, "away": 25}, {"home": 25, "away": 20}])
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        self.output = Path(self.temp.name) / "report"
        seed_root(self.root, self.originals, self.previous)

    def collect(self, gender, failures=()):
        if gender in failures:
            raise source.SourceError("SYNTHETIC_RESPONSE_MUST_NOT_APPEAR_IN_REPORT")
        return division_snapshot(self.snapshot, gender)

    def plan(self, failures=(), collector=None, values=None):
        return update.prepare_isolated_update(
            self.root, self.originals, self.previous,
            self.client.values if values is None else values,
            collector or (lambda gender: self.collect(gender, failures)))

    def bytes(self):
        return {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS}

    def test_either_source_failure_preserves_its_bytes_observation_and_identity(self):
        for failed in update.DIVISIONS:
            with self.subTest(failed=failed):
                seed_root(self.root, self.originals, self.previous)
                before = self.bytes()
                healthy = next(g for g in update.DIVISIONS if g != failed)
                plan = self.plan((failed,))
                self.assertEqual(plan["report"]["status"], "PARTIAL_READY")
                self.assertEqual(plan["report"]["held_divisions"], [failed])
                self.assertEqual(plan["report"]["verified_divisions"], [healthy])
                self.assertEqual(plan["report"]["source_coverage"], 126)
                self.assertEqual(set(plan["report"]["division_observed_at"]), {healthy})
                held = plan["candidates"][update.DATA_PATHS[failed]]
                self.assertEqual(held, self.originals[failed])
                self.assertEqual(held["matches"][0]["liveScore"]["observedAt"], STAMP)
                fresh = plan["candidates"][update.DATA_PATHS[healthy]]["matches"][0]
                self.assertEqual(fresh["liveScore"]["home"], 1)
                self.assertEqual(len(fresh["liveSets"]), 2)
                self.assertEqual(fresh["liveScore"]["observedAt"], self.snapshot["fetched_at"])
                old_links = {k: v for k, v in self.previous["links"].items() if v["gender"] == failed}
                new_links = {k: v for k, v in plan["candidates"][update.STATE_PATH]["links"].items() if v["gender"] == failed}
                self.assertEqual(old_links, new_links)
                self.assertEqual(set(plan["master_plan"]["checked_match_ids"]),
                                 {m["id"] for m in self.originals[healthy]["matches"]})
                self.assertNotIn("SYNTHETIC_RESPONSE", json.dumps(plan["report"]))
                update.write_candidates(self.root, plan)
                self.assertEqual((self.root / update.DATA_PATHS[failed]).read_bytes(), before[update.DATA_PATHS[failed]])

    def test_both_sources_fail_closed_without_new_candidates_or_local_changes(self):
        before = self.bytes()
        with self.assertRaises(update.DivisionsUnavailable) as caught:
            self.plan(tuple(update.DIVISIONS))
        self.assertEqual(set(caught.exception.failures), set(update.DIVISIONS))
        self.assertTrue(all(v == {"stage": "source", "error_code": "SourceError"}
                            for v in caught.exception.failures.values()))
        self.assertEqual(before, self.bytes())
        self.assertEqual(self.client.writes, [])

    def test_incomplete_or_duplicate_snapshot_is_held_and_never_counted_verified(self):
        edits = [lambda s: s["coverage"].update(complete=False),
                 lambda s: s["matches"].pop(),
                 lambda s: s["coverage"]["postseason"].pop(),
                 lambda s: s["matches"].__setitem__(1, deepcopy(s["matches"][0]))]
        for failed in update.DIVISIONS:
            for edit in edits:
                with self.subTest(failed=failed, edit=edits.index(edit)):
                    def collector(gender):
                        snap = self.collect(gender)
                        if gender == failed:
                            edit(snap)
                        return snap
                    plan = self.plan(collector=collector)
                    self.assertEqual(plan["report"]["held_divisions"], [failed])
                    self.assertEqual(plan["report"]["division_failures"][failed]["stage"], "candidate")
                    self.assertEqual(plan["candidates"][update.DATA_PATHS[failed]], self.originals[failed])

    def test_global_number_collision_across_accepted_divisions_stops_the_transaction(self):
        originals, snapshot, values = fixture_bundle(finals=False)
        female = next(r for r in snapshot["matches"] if r["gender"] == "FEMALE")
        female["number"] = next(r["number"] for r in snapshot["matches"] if r["gender"] == "MALE")
        female["source_key"] = f"023:001:FEMALE:{female['number']}"
        with self.assertRaisesRegex(update.UpdateError, "overlap across divisions"):
            update.prepare_isolated_update(self.root, originals, None, values,
                                           lambda g: division_snapshot(snapshot, g))

    def test_new_game_number_cannot_collide_with_a_preserved_division(self):
        add_postseason(self.snapshot, gender="MALE", legs=1)
        added = next(r for r in self.snapshot["matches"] if r["gender"] == "MALE" and r["phase_id"] == "202")
        held_key = next(k for k, v in self.previous["links"].items() if v["gender"] == "FEMALE")
        added["number"] = int(held_key.rsplit(":", 1)[1])
        added["source_key"] = f"023:001:MALE:{added['number']}"
        before = self.bytes()
        with self.assertRaisesRegex(update.UpdateError, "conflicts with a preserved division"):
            self.plan(("FEMALE",))
        self.assertEqual(before, self.bytes())

    def test_missing_point_diagnostic_counts_certified_retained_sets(self):
        for retained in (False, True):
            with self.subTest(retained=retained):
                originals = deepcopy(self.originals)
                local = originals["MALE"]["matches"][0]
                local["liveScore"].update(home=0, away=2)
                if retained:
                    local["liveSets"].append({"home": 20, "away": 25, "status": "completed", "observedAt": STAMP})
                snapshot = deepcopy(self.snapshot)
                first = next(r for r in snapshot["matches"] if r["gender"] == "MALE")
                first.update(sets_won={"home": 0, "away": 2}, sets=[{"home": 21, "away": 25}])
                plan = update.prepare_isolated_update(self.root, originals, self.previous, self.client.values,
                                                      lambda g: division_snapshot(snapshot, g))
                diagnostic = update.incomplete_live_points(plan)
                self.assertEqual(diagnostic, [] if retained else [
                    {"source_key": first["source_key"], "expected_sets": 2, "verified_sets": 1}])
                if retained:
                    points = plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]["liveSets"]
                    self.assertEqual(points[1]["observedAt"], STAMP)

    def test_healthy_division_master_lock_or_formula_blocks_every_write(self):
        for failed in update.DIVISIONS:
            healthy = next(g for g in update.DIVISIONS if g != failed)
            target = self.originals[healthy]["matches"][0]["id"]
            for column, value in ((18, "[LOCK]"), (7, "=TIME(14,0,0)")):
                with self.subTest(failed=failed, column=column):
                    values = deepcopy(self.client.values)
                    next(r for r in values[1:] if r[0] == target)[column] = value
                    before = self.bytes()
                    with self.assertRaises(master.MasterError):
                        self.plan((failed,), values=values)
                    self.assertEqual(before, self.bytes())
                    self.assertEqual(self.client.writes, [])

    def test_partial_then_full_recovery_reuses_ids_and_advances_only_real_observations(self):
        first = self.plan(("FEMALE",))
        master.apply_update_plan(self.client, first["master_plan"])
        update.write_candidates(self.root, first)
        old_female_ids = [m["id"] for m in self.originals["FEMALE"]["matches"]]
        second = update.prepare_isolated_update(
            self.root, candidate_originals(first), first["candidates"][update.STATE_PATH],
            self.client.values, self.collect)
        self.assertEqual(second["report"]["status"], "READY")
        self.assertEqual(second["report"]["held_divisions"], [])
        self.assertEqual(set(second["report"]["verified_divisions"]), set(update.DIVISIONS))
        self.assertEqual([m["id"] for m in second["candidates"][update.DATA_PATHS["FEMALE"]]["matches"]], old_female_ids)
        self.assertEqual(second["candidates"][update.STATE_PATH]["links"], self.previous["links"])
        self.assertEqual(second["candidates"][update.DATA_PATHS["FEMALE"]]["matches"][0]["liveScore"]["observedAt"],
                         self.snapshot["fetched_at"])
        self.assertNotIn(update.DATA_PATHS["MALE"], second["changed_files"])

    def test_publication_receipt_does_not_certify_a_preserved_division_as_fresh(self):
        plan = self.plan(("FEMALE",))
        result = update.publication_gate(plan)
        self.assertEqual(result["status"], "PASS")
        held = update.DATA_PATHS["FEMALE"]
        self.assertEqual(result["preserved_unobserved_files"], [held])
        self.assertNotIn(held, result["files"])
        self.assertEqual(set(result["files"]), {update.DATA_PATHS["MALE"], update.STATE_PATH})
        self.assertTrue(all("women" not in c["id"] for c in update.quality_audit_gate(self.root, plan)))

    def test_held_candidate_cannot_be_modified_or_listed_as_changed(self):
        for tamper in ("payload", "changed_files"):
            with self.subTest(tamper=tamper):
                plan = self.plan(("FEMALE",))
                held = update.DATA_PATHS["FEMALE"]
                if tamper == "payload":
                    plan["candidates"][held]["updatedAt"] = self.snapshot["fetched_at"]
                else:
                    plan["changed_files"].append(held)
                with self.assertRaisesRegex(update.UpdateError, "Unobserved division must remain unchanged"):
                    update.publication_gate(plan)

    def test_unsafe_nested_payload_is_blocked_even_when_its_division_is_held(self):
        for gender in update.DIVISIONS:
            with self.subTest(gender=gender):
                plan = self.plan(("FEMALE",))
                path = update.DATA_PATHS[gender]
                private = {"access_level": "PRIVATE", "note": "SYNTHETIC_PRIVATE_SENTINEL"}
                plan["candidates"][path]["resources"].append(private)
                if gender == "FEMALE":
                    plan["expected"][path]["resources"].append(deepcopy(private))
                receipt = update.publication_gate(plan)
                self.assertEqual(receipt["status"], "FAIL")
                self.assertEqual(receipt["files"], {})
                self.assertNotIn("SYNTHETIC_PRIVATE_SENTINEL", json.dumps(receipt))

    def test_unexpected_collector_exception_is_not_downgraded_to_partial_success(self):
        before = self.bytes()
        with self.assertRaises(RuntimeError):
            self.plan(collector=lambda _gender: (_ for _ in ()).throw(RuntimeError("synthetic authentication failure")))
        self.assertEqual(before, self.bytes())

    def invoke(self, failures, *extra):
        def collector(*, genders, **_kwargs):
            self.assertEqual(len(genders), 1)
            return self.collect(genders[0], failures)
        argv = ["kovo_vleague_update.py", "--root", str(self.root), "--output", str(self.output),
                "--isolate-divisions", *extra]
        with patch.object(sys, "argv", argv), patch.object(update, "collect_season", side_effect=collector), \
                patch.object(lifecycle, "utc_now", return_value=datetime.fromisoformat(self.snapshot["fetched_at"])), \
                patch.object(update.SheetsClient, "from_environment", return_value=self.client), \
                patch.object(update, "ensure_publish_context"), \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            return update.main()

    def test_cli_partial_staging_never_writes_master_or_operating_files(self):
        before = self.bytes()
        self.assertEqual(self.invoke(("FEMALE",)), 0)
        self.assertEqual(before, self.bytes())
        self.assertEqual(self.client.writes, [])
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["status"], "PARTIAL_READY")
        self.assertFalse(report["master_checked"])
        self.assertFalse(report["master_written"])
        self.assertFalse(report["production_written"])
        self.assertEqual(update.read_json(self.output / "candidate" / update.DATA_PATHS["FEMALE"]), self.originals["FEMALE"])

    def test_cli_partial_publish_requires_readback_and_preserves_held_bytes(self):
        held = update.DATA_PATHS["FEMALE"]
        before = (self.root / held).read_bytes()
        self.assertEqual(self.invoke(("FEMALE",), "--publish"), 0)
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["status"], "PARTIAL_READY")
        self.assertTrue(report["master_checked"])
        self.assertTrue(report["master_readback_verified"])
        self.assertTrue(report["production_written"])
        self.assertEqual((self.root / held).read_bytes(), before)

    def use_final_snapshot(self):
        # This is a separate synthetic final scenario, never a replay of live evidence.
        self.originals, self.snapshot, rows = fixture_bundle(finals=True)
        self.previous = None
        self.client = MemorySheets(rows)
        (self.root / update.STATE_PATH).unlink(missing_ok=True)
        seed_root(self.root, self.originals)

    def test_partial_final_publish_writes_only_healthy_master_cells_and_reads_back(self):
        for failed in update.DIVISIONS:
            with self.subTest(failed=failed):
                self.use_final_snapshot()
                healthy = next(g for g in update.DIVISIONS if g != failed)
                before = self.bytes() if (self.root / update.STATE_PATH).exists() else {
                    p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
                held_rows = deepcopy([r for r in self.client.values[1:] if r[2] == ("남자" if failed == "MALE" else "여자")])
                self.assertEqual(self.invoke((failed,), "--publish"), 0)
                report = update.read_json(self.output / "report.json")
                self.assertTrue(report["master_written"])
                self.assertTrue(report["master_readback_verified"])
                self.assertGreater(report["master_changed_cells"], 0)
                self.assertEqual(len(self.client.writes), 1)
                self.assertGreaterEqual(self.client.reads, 3)
                held_after = [r for r in self.client.values[1:] if r[2] == ("남자" if failed == "MALE" else "여자")]
                self.assertEqual(held_rows, held_after)
                self.assertEqual((self.root / update.DATA_PATHS[failed]).read_bytes(), before[update.DATA_PATHS[failed]])
                public = update.read_json(self.root / update.DATA_PATHS[healthy])["matches"][0]
                self.assertEqual(public["status"], "final")
                self.assertEqual(len(public["score"]["sets"]), sum(public["score"][s] for s in ("home", "away")))

    def test_final_master_readback_failure_never_writes_public_candidates(self):
        self.use_final_snapshot()
        before = {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
        with patch.object(self.client, "batch_update_values", side_effect=lambda updates: self.client.writes.append(deepcopy(updates))):
            self.assertEqual(self.invoke(("FEMALE",), "--publish"), 1)
        self.assertEqual(len(self.client.writes), 1)
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()})
        self.assertFalse((self.root / update.STATE_PATH).exists())
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["error_code"], "MasterError")
        self.assertFalse(report["production_written"])
        self.assertFalse(report.get("master_readback_verified", False))

    def test_candidate_ui_failure_prevents_master_mutation_and_public_writes(self):
        before = self.bytes()
        with patch.object(update, "verify_candidate_ui", side_effect=update.UpdateError("Synthetic DOM failure")), \
                patch.object(update, "apply_update_plan") as apply:
            self.assertEqual(self.invoke(("FEMALE",), "--publish", "--verify-candidate-ui"), 1)
        apply.assert_not_called()
        self.assertEqual(self.client.writes, [])
        self.assertEqual(before, self.bytes())
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["status"], "FAILED")
        self.assertFalse(report["production_written"])

    def test_cli_both_failed_is_sanitized_and_does_not_stage_a_candidate(self):
        before = self.bytes()
        self.assertEqual(self.invoke(tuple(update.DIVISIONS)), 1)
        self.assertEqual(before, self.bytes())
        self.assertFalse((self.output / "candidate").exists())
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["status"], "FAILED")
        self.assertEqual(report["verified_divisions"], [])
        self.assertEqual(set(report["held_divisions"]), set(update.DIVISIONS))
        self.assertNotIn("SYNTHETIC_RESPONSE", (self.output / "report.json").read_text())


if __name__ == "__main__":
    unittest.main()

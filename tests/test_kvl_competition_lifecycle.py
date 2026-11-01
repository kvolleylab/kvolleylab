"""Offline clock, closeout-evidence and publisher regressions; synthetic seasons.

No credentials, network calls, MASTER writes or production files are used. Archive
receipts in these tests are explicitly synthetic; no live archive is asserted.
"""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import kvl_competition_lifecycle as lifecycle
import kovo_vleague_update as update
from test_kovo_vleague_update import fixture_bundle, seed_root, MemorySheets, finish_regular_snapshot, add_postseason

POLICY_FIXTURE = update.read_json(Path(__file__).resolve().parents[1] / lifecycle.DEFAULT_POLICY)
START = datetime.fromisoformat(POLICY_FIXTURE["update_window"]["starts_at"])
END = datetime.fromisoformat(POLICY_FIXTURE["update_window"]["ends_at"])
LAST = datetime.fromisoformat(POLICY_FIXTURE["schedule_basis"]["last_fixture_day"] + "T00:00:00+09:00")
ACTIVE = datetime.fromisoformat("2026-11-01T12:00:00+00:00")
ARCHIVE_TIME = END + timedelta(hours=12)


class SeasonFixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.output = Path(self.temp.name) / "report"
        self.originals, self.snapshot, self.master_values = fixture_bundle()
        seed_root(self.root, self.originals)
        self.policy = lifecycle.load_policy(self.root)

    def evaluate(self, now, policy=None):
        return lifecycle.evaluate(self.root, self.policy if policy is None else policy, now=now)

    def invoke_publisher(self, *, clock=ACTIVE, client=None, arguments=()):
        argv = ["kovo_vleague_update.py", "--root", str(self.root), "--output", str(self.output), "--publish", *arguments]
        with patch.object(sys, "argv", argv), patch.object(update, "ensure_publish_context"), \
                patch.object(lifecycle, "utc_now", side_effect=clock if callable(clock) else lambda: clock), \
                patch.object(update, "collect_season", return_value=deepcopy(self.snapshot)) as collect, \
                patch.object(update.SheetsClient, "from_environment", return_value=client) as connect, \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            code = update.main()
        return code, collect, connect

    def complete_regular_fixtures(self):
        for data in self.originals.values():
            data["matches"] = [m for m in data["matches"] if lifecycle.REGULAR_STAGE.fullmatch(m["stage"])]
            for match in data["matches"]:
                match["status"] = "final"
                match["score"] = {"home": 3, "away": 0, "sets": [{"home": 25, "away": 20}] * 3}
                match["scoreVerification"] = True
            data["standings"]["rows"] = [
                {"rank": rank, "team": {"code": participant["code"]}, "points": 54}
                for rank, participant in enumerate(data["participants"], 1)]
        seed_root(self.root, self.originals, {"schema_version": 1, "season": "2026-27", "links": {}})

    def complete_postseason(self, *, qpo=True):
        self.complete_regular_fixtures()
        for gender, data in self.originals.items():
            teams = [p["code"] for p in data["participants"]]
            if not qpo:
                data["standings"]["rows"][3]["points"] = 50
            for series, home, away, maximum, first_day in (
                    ("QPO", teams[2], teams[3], 1, 17),
                    ("PO", teams[1], teams[2], 3, 15),
                    ("CH", teams[0], teams[1], 5, 8)):
                rule = lifecycle.POSTSEASON_SERIES[series]
                for number in range(1, maximum + 1):
                    final = number <= rule["wins"] and (series != "QPO" or qpo)
                    match = {"id": f"SYNTHETIC-{gender}-{series}-{number}", "stage": rule["stage"],
                             "round": f"{number}차전", "seriesGame": number,
                             "date": (LAST - timedelta(days=first_day - (number - 1) * 2)).date().isoformat(),
                             "time": "19:00", "home": {"code": home}, "away": {"code": away},
                             "status": "final" if final else "scheduled"}
                    if final:
                        match["score"] = {"home": 3, "away": 0, "sets": [{"home": 25, "away": 20}] * 3}
                    data["matches"].append(match)
        seed_root(self.root, self.originals, {"schema_version": 1, "season": "2026-27", "links": {}})

    def create_synthetic_archive(self):
        self.complete_postseason()
        prefix = f"data/automation/archive/{self.policy['automation_id']}"
        snapshots = []
        for index, relative in enumerate(sorted(update.ALLOWED_OUTPUTS)):
            target = f"{prefix}/snapshot-{index}.json"
            raw = (self.root / relative).read_bytes()
            (self.root / target).parent.mkdir(parents=True, exist_ok=True)
            (self.root / target).write_bytes(raw)
            snapshots.append({"source_path": relative, "path": target, "sha256": hashlib.sha256(raw).hexdigest()})
        publication = {
            "schema_version": 1, "season": "2026-27", "status": "READY", "mode": "MASTER_VERIFIED_LOCAL_DATA_READY",
            "checked_at": (LAST + timedelta(days=1, minutes=17)).isoformat(), "master_checked": True, "master_readback_verified": True,
            "divisions": {g: {"matched": 126, "completed": 126, "standings_verified": True,
                              "postseason": lifecycle.postseason_status(self.originals[g], True)} for g in update.DIVISIONS},
            "publication_gate": {"status": "PASS", "checked_at": (LAST + timedelta(days=1, minutes=17, seconds=1)).isoformat(),
                                 "files": {e["source_path"]: {"sha256": e["sha256"]} for e in snapshots}},
        }
        deployment = {"status": "DEPLOYED_VERIFIED", "expected_sha": "a" * 40, "built_sha": "a" * 40,
                      "verified_at": (LAST + timedelta(days=1, minutes=20)).isoformat(), "verified_files": list(update.DATA_PATHS.values()),
                      "verified_file_sha256": {e["source_path"]: e["sha256"] for e in snapshots
                                               if e["source_path"] in update.DATA_PATHS.values()},
                      "verified_payload_sha256": {p: update.digest(update.read_json(self.root / p))
                                                  for p in update.DATA_PATHS.values()}}
        receipts = {}
        for label, receipt in (("publication", publication), ("deployment", deployment)):
            relative = f"{prefix}/{label}.json"
            update.write_json(self.root / relative, receipt)
            receipts[label] = {"path": relative, "sha256": hashlib.sha256((self.root / relative).read_bytes()).hexdigest()}
        manifest = {
            "schema_version": 1, "automation_id": self.policy["automation_id"], "season": "2026-27",
            "phase_scope": lifecycle.SEASON_SCOPE, "created_at": ARCHIVE_TIME.isoformat(),
            "official_completion": [
                {"competition_id": c["competition_id"], "review_status": "VERIFIED", "phase_scope": lifecycle.SEASON_SCOPE,
                 "source_id": "SYNTHETIC-COMPLETION-" + c["gender"], "source_url": "https://kovo.co.kr/news/kovo/press/123456",
                 "verified_at": (END + timedelta(hours=10)).isoformat()} for c in self.policy["competitions"]],
            "snapshots": snapshots, "receipts": receipts, "deployment_commit": "a" * 40,
        }
        self.policy["archive_manifest_path"] = f"{prefix}/manifest_v1.json"
        update.write_json(self.root / self.policy["archive_manifest_path"], manifest)
        return manifest

    def write_manifest(self, manifest):
        update.write_json(self.root / self.policy["archive_manifest_path"], manifest)

    def change_receipt(self, manifest, label, mutate):
        entry = manifest["receipts"][label]
        path = self.root / entry["path"]
        content = update.read_json(path)
        mutate(content)
        update.write_json(path, content)
        entry["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.write_manifest(manifest)


class WindowBoundaryTests(SeasonFixture):
    def test_regular_season_cutoff_no_longer_stops_postseason_or_championship(self):
        for now in (datetime.fromisoformat("2027-04-10T00:00:00+09:00"), LAST + timedelta(hours=23, minutes=59)):
            result = self.evaluate(now)
            self.assertTrue(result["allow_update"])
            self.assertEqual(result["phase"], "UPDATING")
            self.assertEqual(result["phase_scope"], lifecycle.SEASON_SCOPE)

    def test_start_inclusive_end_exclusive_with_utc_equivalence(self):
        cases = [(START - timedelta(microseconds=1), False, "BEFORE_UPDATE_WINDOW"),
                 (START, True, "UPDATING"), (START.astimezone(timezone.utc), True, "UPDATING"),
                 (END - timedelta(microseconds=1), True, "RECONCILING"),
                 (END, False, "STOPPED_PENDING_ARCHIVE"),
                 (END.astimezone(timezone.utc), False, "STOPPED_PENDING_ARCHIVE")]
        for now, allowed, phase in cases:
            with self.subTest(now=now):
                result = self.evaluate(now)
                self.assertEqual(result["allow_update"], allowed)
                self.assertEqual(result["phase"], phase)
                self.assertFalse(result["official_competition_end_inferred"])

    def test_reconciliation_begins_next_korean_calendar_day_not_utc_midnight(self):
        midnight = (LAST + timedelta(days=1)).astimezone(timezone.utc)
        before = self.evaluate(midnight - timedelta(seconds=1))
        after = self.evaluate(midnight)
        self.assertEqual(before["phase"], "UPDATING")
        self.assertEqual(after["phase"], "RECONCILING")

    def test_configurable_buffer_requires_matching_explicit_deadline(self):
        policy = deepcopy(self.policy)
        policy["update_window"]["reconciliation_days"] = 2
        with self.assertRaisesRegex(lifecycle.LifecycleError, "WINDOW_DOES_NOT_MATCH"):
            self.evaluate(ACTIVE, policy)
        policy["update_window"]["ends_at"] = (LAST + timedelta(days=3)).isoformat()
        self.assertFalse(self.evaluate(LAST + timedelta(days=3), policy)["allow_update"])

    def test_missing_or_naive_timezone_is_rejected(self):
        with self.assertRaisesRegex(lifecycle.LifecycleError, "CURRENT_TIME_MUST_HAVE_TIMEZONE"):
            self.evaluate(datetime(2026, 11, 1))
        for key in ("starts_at", "ends_at"):
            policy = deepcopy(self.policy)
            policy["update_window"][key] = policy["update_window"][key][:-6]
            with self.subTest(key=key), self.assertRaisesRegex(lifecycle.LifecycleError, "TIMEZONE_REQUIRED"):
                self.evaluate(ACTIVE, policy)
        policy = deepcopy(self.policy)
        policy["timezone"] = "Not/A_Timezone"
        with self.assertRaisesRegex(lifecycle.LifecycleError, "TIMEZONE_INVALID"):
            self.evaluate(ACTIVE, policy)

    def test_both_divisions_need_evidence_and_fixed_scope(self):
        for mutate in (lambda p: p["schedule_basis"]["evidence"].pop(),
                       lambda p: p.update(auto_next_season=True), lambda p: p.update(auto_postseason=False),
                       lambda p: p.update(phase_scope="regular_season")):
            policy = deepcopy(self.policy)
            mutate(policy)
            with self.assertRaises(lifecycle.LifecycleError):
                self.evaluate(ACTIVE, policy)

    def test_policy_preserves_existing_canonical_competition_ids_separate_from_slugs(self):
        policy = deepcopy(self.policy)
        policy["competitions"][0]["competition_id"] = policy["competitions"][0]["slug"]
        policy["schedule_basis"]["evidence"][0]["competition_id"] = policy["competitions"][0]["slug"]
        with self.assertRaisesRegex(lifecycle.LifecycleError, "CANONICAL_COMPETITION_ID_MISMATCH"):
            self.evaluate(ACTIVE, policy)

    def test_changed_fixture_cannot_silently_extend_window(self):
        self.originals["FEMALE"]["matches"][-1]["date"] = END.date().isoformat()
        seed_root(self.root, self.originals)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "SCHEDULE_OUTSIDE_REVIEWED_UPDATE_WINDOW"):
            self.evaluate(ACTIVE)
        result = self.evaluate(END)
        self.assertFalse(result["allow_update"])
        self.assertIn("UNFINISHED_REGULAR_SEASON", result["archive_blockers"])

    def test_closed_window_and_next_year_do_not_auto_activate(self):
        for now in (END + timedelta(days=15), END + timedelta(days=365)):
            result = self.evaluate(now)
            self.assertEqual(result["phase"], "STOPPED_PENDING_ARCHIVE")
            self.assertEqual(result["season"], "2026-27")
        self.assertIsNone(self.policy["archive_manifest_path"])

    def test_finished_fixtures_without_official_closeout_are_not_archived(self):
        self.complete_regular_fixtures()
        result = self.evaluate(END)
        self.assertEqual(result["phase"], "STOPPED_PENDING_ARCHIVE")
        self.assertTrue(all(d["completed"] == 126 for d in result["divisions"].values()))
        self.assertNotIn("UNFINISHED_REGULAR_SEASON", result["archive_blockers"])
        self.assertIn("UNFINISHED_POSTSEASON", result["archive_blockers"])


class PostseasonCompletionTests(SeasonFixture):
    def test_short_series_clinch_does_not_require_unplayed_remaining_games(self):
        self.complete_postseason()
        result = self.evaluate(END)
        for division in result["divisions"].values():
            self.assertTrue(division["season_complete"])
            self.assertEqual(division["postseason"]["completed"], 6)
            self.assertEqual(division["postseason"]["not_played"], 3)
            self.assertEqual(division["postseason"]["unresolved"], 0)
            self.assertIsNotNone(division["postseason"]["champion"])
        self.assertEqual(result["phase"], "STOPPED_PENDING_ARCHIVE")
        self.assertNotIn("UNFINISHED_POSTSEASON", result["archive_blockers"])

    def test_qpo_not_held_when_gap_exceeds_three_and_remaining_slots_not_required(self):
        self.complete_postseason(qpo=False)
        for data in self.originals.values():
            for match in data["matches"]:
                if match["stage"] in {"준플레이오프", "플레이오프", "챔피언결정전"} and match["status"] == "scheduled":
                    match.update(status="not_required", notRequired=True)
            result = lifecycle.postseason_status(data, True)
            self.assertFalse(result["qpo_required"])
            self.assertTrue(result["complete"])
            self.assertEqual(result["not_played"], 4)
            self.assertEqual(result["completed"], 5)

    def test_three_point_gap_requires_qpo_and_cannot_skip_to_playoff(self):
        self.complete_postseason()
        data = self.originals["MALE"]
        data["standings"]["rows"][3]["points"] = 51
        self.assertTrue(lifecycle.postseason_status(data, True)["qpo_required"])
        data["matches"] = [m for m in data["matches"] if m["stage"] != "준플레이오프"]
        with self.assertRaisesRegex(lifecycle.LifecycleError, "POSTSEASON_FINAL_BEFORE_PREREQUISITE"):
            lifecycle.postseason_status(data, True)

    def test_regular_results_without_championship_cannot_be_archived(self):
        self.complete_regular_fixtures()
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_REQUIRES_FINAL_RESULTS"):
            lifecycle.prepare_archive(self.root, "unused", "unused", "unused", now=ARCHIVE_TIME)

    def test_full_five_game_championship_counts_all_actual_games(self):
        self.complete_postseason()
        data = self.originals["MALE"]
        for match in data["matches"]:
            if match["stage"] != "챔피언결정전":
                continue
            home_win = match["seriesGame"] in (1, 3, 5)
            match["status"] = "final"
            match["score"] = {"home": 3 if home_win else 0, "away": 0 if home_win else 3,
                              "sets": [{"home": 25 if home_win else 20, "away": 20 if home_win else 25}] * 3}
        result = lifecycle.postseason_status(data, True)
        self.assertTrue(result["complete"])
        self.assertEqual(result["series"]["CH"]["clinching_game"], 5)
        self.assertEqual(result["completed"], 8)
        self.assertEqual(result["not_played"], 1)

    def test_final_after_clinch_or_missing_earlier_game_is_rejected(self):
        for defect, expected in (("extra", "POSTSEASON_GAME_AFTER_CLINCH"),
                                 ("missing", "POSTSEASON_FINAL_BEFORE_PREREQUISITE")):
            self.complete_postseason()
            data = self.originals["MALE"]
            if defect == "extra":
                game = next(m for m in data["matches"] if m["stage"] == "챔피언결정전" and m["seriesGame"] == 4)
                game["status"] = "final"
                game["score"] = {"home": 3, "away": 0, "sets": [{"home": 25, "away": 20}] * 3}
            else:
                data["matches"] = [m for m in data["matches"]
                                   if not (m["stage"] == "챔피언결정전" and m["seriesGame"] == 1)]
            with self.subTest(defect=defect), self.assertRaisesRegex(lifecycle.LifecycleError, expected):
                lifecycle.postseason_status(data, True)

    def test_wrong_qualifier_and_unproven_not_required_cannot_complete(self):
        for defect, expected in (("team", "POSTSEASON_QUALIFICATION_MISMATCH"),
                                 ("not_required", "POSTSEASON_NOT_REQUIRED_UNPROVEN")):
            self.complete_postseason()
            data = self.originals["MALE"]
            first = next(m for m in data["matches"] if m["stage"] == "챔피언결정전" and m["seriesGame"] == 1)
            if defect == "team":
                first["away"] = {"code": data["participants"][6]["code"]}
            else:
                first["status"] = "not_required"
                first.pop("score")
            with self.subTest(defect=defect), self.assertRaisesRegex(lifecycle.LifecycleError, expected):
                lifecycle.postseason_status(data, True)

    def test_current_standings_do_not_establish_postseason_eligibility(self):
        data = deepcopy(self.originals["MALE"])
        data["standings"]["rows"] = [{"rank": rank, "points": 100 - rank * 10,
                                     "team": {"code": team["code"]}}
                                    for rank, team in enumerate(data["participants"], 1)]
        result = lifecycle.postseason_status(data, False)
        self.assertIsNone(result["qpo_required"])
        self.assertFalse(result["complete"])
        self.assertIsNone(result["champion"])

    def test_championship_result_cannot_predate_its_playoff_qualification(self):
        self.complete_postseason()
        data = self.originals["MALE"]
        first = next(m for m in data["matches"] if m["stage"] == "챔피언결정전" and m["seriesGame"] == 1)
        first["date"] = "2027-04-01"
        with self.assertRaisesRegex(lifecycle.LifecycleError, "POSTSEASON_FINAL_CHRONOLOGY_INVALID"):
            lifecycle.postseason_status(data, True)


class ArchiveEvidenceTests(SeasonFixture):
    def test_verified_archive_requires_final_data_and_all_hashed_receipts(self):
        self.create_synthetic_archive()
        before = {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS}
        result = self.evaluate(ARCHIVE_TIME)
        self.assertEqual(result["phase"], "ARCHIVED")
        self.assertFalse(result["allow_update"])
        self.assertEqual(len(result["archive_manifest_sha256"]), 64)
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS})

    def test_unfinished_postponed_or_cancelled_match_blocks_archiving(self):
        for status in ("scheduled", "live", "postponed", "cancelled"):
            self.create_synthetic_archive()
            path = self.root / update.DATA_PATHS["MALE"]
            data = update.read_json(path)
            data["matches"][0]["status"] = status
            update.write_json(path, data)
            # Existing postseason finals cannot legitimize an unresolved
            # prerequisite regular fixture: the new full-season validator
            # rejects the inconsistent sporting chain before archive receipts.
            with self.subTest(status=status), self.assertRaisesRegex(lifecycle.LifecycleError, "POSTSEASON_FINAL_BEFORE_PREREQUISITE"):
                self.evaluate(ARCHIVE_TIME)

    def test_official_completion_is_distinct_from_calendar_or_result_completion(self):
        for mutate in (lambda m: m.update(official_completion=[]),
                       lambda m: m["official_completion"][0].update(review_status="CANDIDATE"),
                       lambda m: m["official_completion"][0].update(phase_scope="postseason"),
                       lambda m: m["official_completion"][0].update(source_url="https://example.org/story")):
            manifest = self.create_synthetic_archive()
            mutate(manifest)
            self.write_manifest(manifest)
            with self.assertRaises(lifecycle.LifecycleError):
                self.evaluate(ARCHIVE_TIME)

    def test_snapshot_tampering_or_changed_current_data_invalidates_archive(self):
        manifest = self.create_synthetic_archive()
        target = self.root / manifest["snapshots"][0]["path"]
        target.write_text(target.read_text() + " ")
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_HASH_MISMATCH"):
            self.evaluate(ARCHIVE_TIME)
        self.create_synthetic_archive()
        target = self.root / update.DATA_PATHS["FEMALE"]
        data = update.read_json(target)
        data["scheduleNote"] = "A later unverified change"
        update.write_json(target, data)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_DOES_NOT_MATCH_CURRENT_DATA"):
            self.evaluate(ARCHIVE_TIME)

    def test_missing_master_readback_standings_or_deployment_cannot_archive(self):
        cases = [("publication", lambda r: r.update(master_readback_verified=False), "ARCHIVE_MASTER_VERIFICATION_REQUIRED"),
                 ("publication", lambda r: r["divisions"]["MALE"].update(standings_verified=False), "ARCHIVE_FINAL_STANDINGS_REQUIRED"),
                 ("publication", lambda r: r["divisions"]["MALE"].pop("postseason"), "ARCHIVE_FINAL_POSTSEASON_REQUIRED"),
                 ("publication", lambda r: r["divisions"]["MALE"]["postseason"].update(champion="WRONG"), "ARCHIVE_FINAL_POSTSEASON_REQUIRED"),
                 ("deployment", lambda r: r.update(built_sha="b" * 40), "ARCHIVE_DEPLOYMENT_VERIFICATION_REQUIRED"),
                 ("deployment", lambda r: r["verified_files"].pop(), "ARCHIVE_DEPLOYMENT_VERIFICATION_REQUIRED"),
                 ("deployment", lambda r: r["verified_payload_sha256"].update({update.DATA_PATHS["MALE"]: "0" * 64}),
                  "ARCHIVE_DEPLOYMENT_HASH_MISMATCH"),
                 ("deployment", lambda r: r.pop("verified_payload_sha256"), "ARCHIVE_DEPLOYMENT_HASHES_REQUIRED")]
        for label, mutate, code in cases:
            manifest = self.create_synthetic_archive()
            self.change_receipt(manifest, label, mutate)
            with self.subTest(code=code), self.assertRaisesRegex(lifecycle.LifecycleError, code):
                self.evaluate(ARCHIVE_TIME)

    def test_early_clinch_cannot_skip_the_configured_correction_window(self):
        manifest = self.create_synthetic_archive()
        manifest["created_at"] = (END - timedelta(seconds=1)).isoformat()
        self.write_manifest(manifest)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_BEFORE_UPDATE_WINDOW_CLOSED"):
            self.evaluate(END - timedelta(seconds=1))

    def test_past_completion_or_deployment_receipt_cannot_describe_later_final_data(self):
        manifest = self.create_synthetic_archive()
        manifest["official_completion"][0]["verified_at"] = "2026-10-31T10:00:00+09:00"
        self.write_manifest(manifest)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "OFFICIAL_COMPLETION_TIME_INVALID"):
            self.evaluate(ARCHIVE_TIME)
        manifest = self.create_synthetic_archive()
        self.change_receipt(manifest, "publication", lambda r: r.update(checked_at="2026-10-31T10:00:00+09:00"))
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_RECEIPT_TIME_INVALID"):
            self.evaluate(ARCHIVE_TIME)
        manifest = self.create_synthetic_archive()
        self.change_receipt(manifest, "deployment", lambda r:
                            r["verified_file_sha256"].update({update.DATA_PATHS["MALE"]: "0" * 64}))
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_DEPLOYMENT_FILE_HASH_MISMATCH"):
            self.evaluate(ARCHIVE_TIME)

    def test_publication_receipt_must_cover_exact_snapshot_hashes(self):
        manifest = self.create_synthetic_archive()
        self.change_receipt(manifest, "publication", lambda r:
                            r["publication_gate"]["files"][update.DATA_PATHS["MALE"]].update(sha256="0" * 64))
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_PUBLICATION_HASH_MISMATCH"):
            self.evaluate(ARCHIVE_TIME)

    def test_evidence_cannot_escape_snapshot_directory(self):
        manifest = self.create_synthetic_archive()
        manifest["receipts"]["publication"]["path"] = "../private-master.json"
        self.write_manifest(manifest)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "PATH_INVALID"):
            self.evaluate(ARCHIVE_TIME)


class PublisherWindowTests(SeasonFixture):
    def test_manual_publish_before_start_or_after_end_never_collects_or_connects(self):
        for now in (START - timedelta(seconds=1), END, END + timedelta(days=365)):
            code, collect, connect = self.invoke_publisher(clock=now)
            self.assertEqual(code, 1)
            collect.assert_not_called()
            connect.assert_not_called()
            self.assertFalse(update.read_json(self.output / "report.json")["master_written"])
            self.assertFalse((self.root / update.STATE_PATH).exists())

    def test_missing_policy_fails_closed_without_source_or_master_request(self):
        (self.root / lifecycle.DEFAULT_POLICY).unlink()
        code, collect, connect = self.invoke_publisher()
        self.assertEqual(code, 1)
        collect.assert_not_called()
        connect.assert_not_called()

    def test_replay_flags_cannot_override_publishing_deadline(self):
        for flag in ("--source-file", "--master-snapshot"):
            code, collect, connect = self.invoke_publisher(clock=END, arguments=(flag, "unused.json"))
            self.assertEqual(code, 1)
            collect.assert_not_called()
            connect.assert_not_called()

    def test_actual_clock_is_rechecked_after_master_prewrite_read(self):
        client = MemorySheets(self.master_values)
        now = [END - timedelta(seconds=1)]
        original_read = client.read_values

        def read_values():
            values = original_read()
            if client.reads == 2:
                now[0] = END
            return values

        client.read_values = read_values
        code, _, _ = self.invoke_publisher(clock=lambda: now[0], client=client)
        self.assertEqual(code, 1)
        self.assertEqual(client.writes, [])
        self.assertFalse((self.root / update.STATE_PATH).exists())

    def test_closing_after_master_write_blocks_local_write_and_preserves_truthful_receipt(self):
        client = MemorySheets(self.master_values)
        now = [END - timedelta(seconds=1)]
        original_read = client.read_values

        def read_values():
            values = original_read()
            if client.reads == 3:
                now[0] = END
            return values

        client.read_values = read_values
        before = {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
        code, _, _ = self.invoke_publisher(clock=lambda: now[0], client=client)
        self.assertEqual(code, 1)
        self.assertEqual(len(client.writes), 1)
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["error_code"], "LifecycleError")
        self.assertTrue(report["master_written"])
        self.assertTrue(report["master_readback_verified"])
        self.assertFalse(report["production_written"])
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()})


class ArchivePreparationTests(SeasonFixture):
    def test_actual_updater_report_through_championship_prepares_sanitized_archive(self):
        # Exercise the publisher's actual report schema against closeout, using
        # synthetic source/MASTER/Pages receipts and an explicitly simulated
        # future clock. No credentials, source requests, or network writes.
        self.originals, self.snapshot, self.master_values = fixture_bundle(finals=False)
        finish_regular_snapshot(self.originals, self.snapshot)
        for gender in update.DIVISIONS:
            add_postseason(self.snapshot, gender=gender, legs=2, final_legs=2)
            add_postseason(self.snapshot, gender=gender, phase="203", legs=3, final_legs=3, home="001", away="002")
        published_at = LAST + timedelta(days=1, minutes=17)
        self.snapshot["fetched_at"] = published_at.isoformat()
        seed_root(self.root, self.originals)

        class SyntheticFutureClock(datetime):
            @classmethod
            def now(cls, tz=None):
                return published_at.astimezone(tz) if tz else published_at.replace(tzinfo=None)

        client = MemorySheets(self.master_values)
        with patch.object(update, "datetime", SyntheticFutureClock):
            code, _, _ = self.invoke_publisher(clock=published_at, client=client)
        self.assertEqual(code, 0)
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["mode"], "MASTER_VERIFIED_LOCAL_DATA_READY")
        self.assertTrue(report["master_readback_verified"])
        self.assertEqual(len(report["postseason_source_coverage"]), 6)
        self.assertTrue(all(d["postseason"]["complete"] for d in report["divisions"].values()))
        self.assertTrue(client.writes)
        deployment = {"status": "DEPLOYED_VERIFIED", "expected_sha": "a" * 40, "built_sha": "a" * 40,
                      "verified_at": (published_at + timedelta(minutes=3)).isoformat(),
                      "verified_files": list(update.DATA_PATHS.values()),
                      "verified_file_sha256": {p: hashlib.sha256((self.root / p).read_bytes()).hexdigest()
                                               for p in update.DATA_PATHS.values()},
                      "verified_payload_sha256": {p: update.digest(update.read_json(self.root / p))
                                                  for p in update.DATA_PATHS.values()}}
        completion = {"schema_version": 1, "automation_id": self.policy["automation_id"], "season": "2026-27",
                      "phase_scope": lifecycle.SEASON_SCOPE, "official_completion": [
                          {"competition_id": c["competition_id"], "review_status": "VERIFIED",
                           "phase_scope": lifecycle.SEASON_SCOPE, "source_id": "SYNTHETIC-COMPLETION-" + c["gender"],
                           "source_url": "https://kovo.co.kr/news/kovo/press/123456",
                           "verified_at": (END + timedelta(hours=10)).isoformat()} for c in self.policy["competitions"]]}
        update.write_json(self.output / "deployment.json", deployment)
        update.write_json(self.output / "official-completion.json", completion)
        result = lifecycle.prepare_archive(self.root, self.output / "official-completion.json", self.output / "report.json",
                                           self.output / "deployment.json", now=ARCHIVE_TIME)
        self.assertEqual(result["status"], "ARCHIVE_PREPARED_NOT_ACTIVATED")
        manifest = update.read_json(self.root / result["manifest_path"])
        archived_report = update.read_json(self.root / manifest["receipts"]["publication"]["path"])
        self.assertNotIn("postseason_source_coverage", archived_report)
        for gender in update.DIVISIONS:
            self.assertEqual(archived_report["divisions"][gender]["postseason"],
                             report["divisions"][gender]["postseason"])
        self.assertEqual(manifest["receipts"]["publication"]["input_sha256"],
                         hashlib.sha256((self.output / "report.json").read_bytes()).hexdigest())

    def inputs(self):
        manifest = self.create_synthetic_archive()
        folder = self.output / "archive-inputs"
        folder.mkdir(parents=True, exist_ok=True)
        for label, reference in manifest["receipts"].items():
            (folder / f"{label}.json").write_bytes((self.root / reference["path"]).read_bytes())
        update.write_json(folder / "official-completion.json", {
            "schema_version": 1, "automation_id": self.policy["automation_id"], "season": "2026-27",
            "phase_scope": lifecycle.SEASON_SCOPE, "official_completion": manifest["official_completion"]})
        namespace = self.root / f"data/automation/archive/{self.policy['automation_id']}"
        shutil.rmtree(namespace)
        self.policy["archive_manifest_path"] = None
        return folder

    def prepare(self, folder):
        return lifecycle.prepare_archive(self.root, folder / "official-completion.json", folder / "publication.json",
                                          folder / "deployment.json", now=ARCHIVE_TIME)

    def assert_no_partial_archive(self):
        self.assertFalse((self.root / f"data/automation/archive/{self.policy['automation_id']}").exists())
        self.assertEqual(list(self.root.glob(".kvl-archive-prepare-*")), [])

    def test_unfinished_current_season_refuses_before_opening_proof_files(self):
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_REQUIRES_FINAL_RESULTS"):
            self.prepare(Path("these-proof-files-do-not-exist"))
        self.assert_no_partial_archive()

    def test_complete_future_season_prepares_verified_local_version_without_policy_or_data_write(self):
        folder = self.inputs()
        policy_before = (self.root / lifecycle.DEFAULT_POLICY).read_bytes()
        data_before = {path: (self.root / path).read_bytes() for path in update.ALLOWED_OUTPUTS}
        result = self.prepare(folder)
        self.assertEqual(result["status"], "ARCHIVE_PREPARED_NOT_ACTIVATED")
        self.assertFalse(result["policy_changed"])
        self.assertFalse(result["master_written"])
        self.assertFalse(result["remote_written"])
        self.assertEqual(policy_before, (self.root / lifecycle.DEFAULT_POLICY).read_bytes())
        self.assertEqual(data_before, {path: (self.root / path).read_bytes() for path in update.ALLOWED_OUTPUTS})
        proposed = dict(self.policy, **result["proposed_policy_patch"])
        checked = self.evaluate(ARCHIVE_TIME, proposed)
        self.assertEqual(checked["phase"], "ARCHIVED")
        self.assertEqual(checked["archive_manifest_sha256"], result["manifest_sha256"])
        self.assertEqual(list(self.root.glob(".kvl-archive-prepare-*")), [])

    def test_existing_archive_even_empty_is_never_overwritten(self):
        folder = self.inputs()
        namespace = self.root / f"data/automation/archive/{self.policy['automation_id']}"
        namespace.mkdir(parents=True)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_ALREADY_EXISTS"):
            self.prepare(folder)
        marker = namespace / "existing.json"
        marker.write_text('{"preserve": true}')
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_ALREADY_EXISTS"):
            self.prepare(folder)
        self.assertEqual(marker.read_text(), '{"preserve": true}')

    def test_invalid_final_receipt_leaves_no_partial_archive(self):
        folder = self.inputs()
        receipt = update.read_json(folder / "deployment.json")
        receipt["built_sha"] = "b" * 40
        update.write_json(folder / "deployment.json", receipt)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_DEPLOYMENT_VERIFICATION_REQUIRED"):
            self.prepare(folder)
        self.assert_no_partial_archive()

    def test_extra_raw_master_fields_in_receipt_are_not_copied_into_public_archive(self):
        folder = self.inputs()
        receipt = update.read_json(folder / "publication.json")
        receipt["raw_master"] = {"values": [["SYNTHETIC_PRIVATE_NOTE"]]}
        update.write_json(folder / "publication.json", receipt)
        with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_RECEIPT_FIELDS_INVALID"):
            self.prepare(folder)
        self.assert_no_partial_archive()

    def test_optional_nested_receipt_diagnostics_are_not_public_archive_content(self):
        folder = self.inputs()
        receipt = update.read_json(folder / "publication.json")
        receipt["lifecycle"] = {"raw_master": {"private_note": "SYNTHETIC_PRIVATE_DIAGNOSTIC"}}
        update.write_json(folder / "publication.json", receipt)
        input_sha = hashlib.sha256((folder / "publication.json").read_bytes()).hexdigest()
        result = self.prepare(folder)
        manifest = update.read_json(self.root / result["manifest_path"])
        self.assertEqual(manifest["receipts"]["publication"]["input_sha256"], input_sha)
        for path in (self.root / Path(result["manifest_path"]).parent).rglob("*.json"):
            self.assertNotIn("SYNTHETIC_PRIVATE_DIAGNOSTIC", path.read_text())

    def test_failed_promotion_removes_only_our_empty_reservation(self):
        folder = self.inputs()
        with patch.object(Path, "rename", side_effect=OSError("synthetic rename failure")):
            with self.assertRaises(OSError):
                self.prepare(folder)
        self.assert_no_partial_archive()

    def test_source_change_during_validation_blocks_promotion_without_reverting_user_edit(self):
        folder = self.inputs()
        real_evaluate = lifecycle.evaluate
        target = self.root / update.DATA_PATHS["MALE"]

        def validate_then_change(*args, **kwargs):
            result = real_evaluate(*args, **kwargs)
            data = update.read_json(target)
            data["scheduleNote"] = "Concurrent reviewed update"
            update.write_json(target, data)
            return result

        with patch.object(lifecycle, "evaluate", side_effect=validate_then_change):
            with self.assertRaisesRegex(lifecycle.LifecycleError, "ARCHIVE_INPUT_CHANGED_DURING_PREPARATION"):
                self.prepare(folder)
        self.assert_no_partial_archive()
        self.assertEqual(update.read_json(target)["scheduleNote"], "Concurrent reviewed update")


class GateCommandTests(SeasonFixture):
    def invoke_gate(self, now, *arguments):
        report, output = self.output / "lifecycle.json", self.output / "github-output"
        self.output.mkdir(parents=True, exist_ok=True)
        argv = ["kvl_competition_lifecycle.py", "--root", str(self.root), "--report", str(report),
                "--github-output", str(output), *arguments]
        with patch.object(sys, "argv", argv), patch.object(lifecycle, "utc_now", return_value=now), redirect_stdout(io.StringIO()):
            code = lifecycle.main()
        return code, update.read_json(report), output.read_text()

    def test_normal_closed_window_is_successful_skip_for_scheduler(self):
        code, report, output = self.invoke_gate(END)
        self.assertEqual(code, 0)
        self.assertEqual(report["status"], "SKIPPED")
        self.assertIn("allow_update=false", output)
        self.assertNotIn("error_code", report)

    def test_mutation_guard_closed_window_is_failure(self):
        code, report, _ = self.invoke_gate(END, "--require-open")
        self.assertEqual(code, 1)
        self.assertEqual(report["reason_code"], "UPDATE_WINDOW_CLOSED")

    def test_invalid_configuration_is_failure_not_normal_closed_skip(self):
        (self.root / lifecycle.DEFAULT_POLICY).write_text("not JSON")
        code, report, output = self.invoke_gate(ACTIVE)
        self.assertEqual(code, 1)
        self.assertEqual(report["status"], "FAILED")
        self.assertEqual(report["phase"], "BLOCKED")
        self.assertIn("allow_update=false", output)


if __name__ == "__main__":
    unittest.main()

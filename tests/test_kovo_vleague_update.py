"""Offline updater integration tests: synthetic full seasons and public snippets.

No private MASTER snapshot, credentials, network call or operating site writes
are used. The two opening score excerpts come from public_contract_v1.json;
all team identities and the 252-game schedule in this test are synthetic.
"""
from copy import deepcopy
from datetime import date, datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import kovo_vleague_update as update
import kovo_vleague_source as source
import kovo_vleague_master as master
from kovo_vleague_standings import StandingsError
from test_kovo_vleague_source import FakeSeasonSource, FIXTURE, STAMP


class IntegrationSource(FakeSeasonSource):
    def __init__(self, finals=True):
        super().__init__()
        self.ranks = {}
        for gender, tag in (("MALE", "m"), ("FEMALE", "w")):
            self.ranks[gender] = deepcopy(FIXTURE["standings"][tag])
            if not finals:
                self.ranks[gender]["payload"] = []
                continue
            first = self.rows[gender][0]
            public = FIXTURE["schedules"][tag]["rows"][0]
            for key in ("getime", "hspoint", "aspoint", "result"):
                first[key] = public[key]
            for number in range(1, 6):
                for side in ("h", "a"):
                    first[f"{side}s{number}point"] = public[f"{side}s{number}point"]
            for row, side in zip(self.ranks[gender]["payload"], ("h", "a")):
                row["tcode"] = first[f"{side}code"]
                row["tsname"] = first[f"{side}sname"]

    def __call__(self, url):
        result = super().__call__(url)
        if urlsplit(url).path == "/stat/league/team-rank":
            gender = "MALE" if parse_qs(urlsplit(url).query)["gender"] == ["1"] else "FEMALE"
            return deepcopy(self.ranks[gender])
        return result


def fixture_bundle(finals=True):
    snapshot = source.collect_season(fetcher=IntegrationSource(finals), now=STAMP)
    originals = {}
    master_rows = [master.HEADERS.copy()]
    for gender, letter in (("MALE", "M"), ("FEMALE", "W")):
        records = sorted((r for r in snapshot["matches"] if r["gender"] == gender), key=lambda r: r["number"])
        providers = sorted({r[side]["provider_code"] for r in records for side in ("home", "away")})
        team_codes = {provider: f"{letter}{number + 1:02d}" for number, provider in enumerate(providers)}
        participants = [{"code": team_codes[provider], "name": "Synthetic " + provider,
                         "logo": "KEEP_LOGO.svg", "rosterCount": 20} for provider in providers]
        matches = []
        for index, record in enumerate(records, 1):
            mid = f"VL2627-{letter}-{index:03d}"
            match = {"id": mid, "date": record["date"], "time": record["time"],
                     "stage": f"{record['round']}라운드", "pool": "", "round": "",
                     "home": {"code": team_codes[record["home"]["provider_code"]]},
                     "away": {"code": team_codes[record["away"]["provider_code"]]},
                     "venueLabel": record["venue"],
                     "localTimeLabel": f"한국 현지 {record['time']} KST", "customNote": "KEEP_MATCH_NOTE"}
            matches.append(match)
            master_rows.append([mid, "v-league-2026-27", "남자" if letter == "M" else "여자",
                                str(record["round"]), "정규리그", record["date"],
                                "월화수목금토일"[date.fromisoformat(record["date"]).weekday()],
                                record["time"], record["home"]["name"], record["away"]["name"],
                                record["venue"], "KEEP_CITY", "예정", "", "", "",
                                "https://www.kovo.co.kr/", "교차검증", "KEEP_PRIVATE_SYNTHETIC_NOTE"])
        originals[gender] = {"status": "upcoming", "stageLabel": "개막 전", "participants": participants,
                             "matches": matches, "standings": {"rows": []},
                             "meaning": {"title": "KEEP_MEANING"}, "resources": ["KEEP_RESOURCE"],
                             "qualifications": [], "finalRanking": [],
                             "previousSeasonRanking": {"season": "2025-26", "rows": ["KEEP_ORDER"]},
                             "rosterNote": "KEEP_ROSTER_NOTE", "rosterSourceNote": "KEEP_ROSTER_SOURCE"}
    return originals, snapshot, master_rows


def candidate_originals(plan):
    return {gender: deepcopy(plan["candidates"][path]) for gender, path in update.DATA_PATHS.items()}


def seed_root(root, originals, state=None):
    for gender, relative in update.DATA_PATHS.items():
        update.write_json(root / relative, originals[gender])
        slug = Path(relative).parent.name
        update.write_json((root / relative).with_name("config.json"), {
            "slug": slug, "schemaVersion": 2,
            "competition": {"competitionId": "SYNTHETIC-" + gender,
                            "season": "2026-27", "gender": update.DIVISIONS[gender]},
        })
    if state is not None:
        update.write_json(root / update.STATE_PATH, state)


class MemorySheets:
    spreadsheet_id = master.MASTER_SPREADSHEET_ID

    def __init__(self, values):
        self.values = deepcopy(values)
        self.reads = 0
        self.writes = []

    def read_values(self):
        self.reads += 1
        return deepcopy(self.values)

    def batch_update_values(self, updates):
        self.writes.append(deepcopy(updates))
        for item in updates:
            location = re.search(r"!([A-S])(\d+)$", item["range"])
            self.values[int(location[2]) - 1][ord(location[1]) - 65] = item["values"][0][0]


class UpdaterJoinTests(unittest.TestCase):
    def setUp(self):
        self.originals, self.snapshot, self.master_values = fixture_bundle()

    def test_global_official_numbers_do_not_become_local_id_suffixes(self):
        matched, links, _ = update.join_records(self.originals, self.snapshot)
        self.assertEqual(len(matched), 252)
        self.assertEqual(links["023:001:FEMALE:2"]["match_id"], "VL2627-W-001")
        self.assertEqual(links["023:001:MALE:3"]["match_id"], "VL2627-M-002")
        self.assertEqual(links["023:001:FEMALE:252"]["match_id"], "VL2627-W-126")

    def test_changed_fixture_date_preserves_match_id_and_link(self):
        _, initial_links, _ = update.join_records(self.originals, self.snapshot)
        source_match = next(r for r in self.snapshot["matches"] if r["source_key"] == "023:001:MALE:3")
        source_match["date"] = "2026-11-10"
        source_match["time"] = "19:00"
        matched, links, _ = update.join_records(self.originals, self.snapshot,
                                               {"season": "2026-27", "links": initial_links})
        changed = next(r for r in matched if r["source_key"] == "023:001:MALE:3")
        self.assertEqual(changed["match_id"], "VL2627-M-002")
        self.assertEqual(changed["date"], "2026-11-10")
        self.assertEqual(links, initial_links)

    def test_missing_duplicate_and_wrong_gender_sources_fail(self):
        missing = deepcopy(self.snapshot)
        missing["matches"].pop()
        duplicate = deepcopy(self.snapshot)
        duplicate["matches"][1] = deepcopy(duplicate["matches"][0])
        wrong_gender = deepcopy(self.snapshot)
        wrong_gender["matches"][0]["gender"] = "FEMALE"
        for value in (missing, duplicate, wrong_gender):
            with self.subTest(kind=len(value["matches"])), self.assertRaises(update.UpdateError):
                update.join_records(self.originals, value)

    def test_local_missing_duplicate_and_unknown_team_fail(self):
        missing = deepcopy(self.originals)
        missing["MALE"]["matches"].pop()
        duplicate = deepcopy(self.originals)
        duplicate["MALE"]["matches"][1] = deepcopy(duplicate["MALE"]["matches"][0])
        for originals in (missing, duplicate):
            with self.assertRaises(update.UpdateError):
                update.join_records(originals, self.snapshot)
        self.snapshot["matches"][0]["home"]["name"] = "Unmapped official alias"
        with self.assertRaises(update.UpdateError):
            update.join_records(self.originals, self.snapshot)

    def test_provider_code_cannot_refer_to_two_local_teams(self):
        target = next(r for r in self.snapshot["matches"] if r["source_key"] == "023:001:MALE:3")
        target["away"]["provider_code"] = target["home"]["provider_code"]
        with self.assertRaises(update.UpdateError):
            update.join_records(self.originals, self.snapshot)

    def test_one_local_team_cannot_split_across_provider_codes(self):
        target = next(r for r in self.snapshot["matches"] if r["source_key"] == "023:001:MALE:3")
        target["home"]["provider_code"] = "1999"
        with self.assertRaises(update.UpdateError):
            update.join_records(self.originals, self.snapshot)

    def test_persisted_identity_cannot_be_remapped_or_removed(self):
        _, links, _ = update.join_records(self.originals, self.snapshot)
        state = {"season": "2026-27", "links": deepcopy(links)}
        state["links"]["023:001:MALE:3"]["match_id"] = "VL2627-M-003"
        with self.assertRaises(update.UpdateError):
            update.join_records(self.originals, self.snapshot, state)
        state["links"] = links
        state["links"]["023:001:MALE:999"] = deepcopy(links["023:001:MALE:3"])
        with self.assertRaises(update.UpdateError):
            update.join_records(self.originals, self.snapshot, state)

    def test_existing_final_correction_and_regression_are_blocked(self):
        first_plan = update.prepare_update(self.originals, self.snapshot)
        originals = candidate_originals(first_plan)
        for mode in ("points", "scheduled", "live", "date"):
            changed = deepcopy(self.snapshot)
            row = next(r for r in changed["matches"] if r["source_key"] == "023:001:MALE:1")
            if mode == "points":
                row["sets"][0]["away"] -= 1
            elif mode == "date":
                row["date"] = "2026-11-02"
            else:
                row["status"] = mode
                row["sets_won"] = {"home": 0, "away": 0}
                row["sets"] = None
            with self.subTest(mode=mode), self.assertRaises(update.UpdateError):
                update.join_records(originals, changed)

    def test_manual_lock_protects_venue_and_status(self):
        local = self.originals["MALE"]["matches"][1]
        local["automationLocked"] = True
        for mode in ("venue", "status"):
            changed = deepcopy(self.snapshot)
            row = next(r for r in changed["matches"] if r["source_key"] == "023:001:MALE:3")
            if mode == "venue":
                row["venue"] = "A different venue"
            else:
                row["status"] = "live"
                row["sets_won"] = {"home": 1, "away": 0}
                row["sets"] = [{"home": 25, "away": 20}]
            with self.subTest(mode=mode), self.assertRaises(update.UpdateError):
                update.join_records(self.originals, changed)


class UpdaterPlanTests(unittest.TestCase):
    def setUp(self):
        self.originals, self.snapshot, self.master_values = fixture_bundle()

    def test_in_progress_match_never_receives_final_score(self):
        originals, snapshot, _ = fixture_bundle(finals=False)
        live = next(r for r in snapshot["matches"] if r["source_key"] == "023:001:MALE:1")
        live.update(status="live", sets_won={"home": 1, "away": 0}, sets=[{"home": 25, "away": 20}])
        plan = update.prepare_update(originals, snapshot)
        male = plan["candidates"][update.DATA_PATHS["MALE"]]
        self.assertEqual(male["matches"][0]["status"], "live")
        self.assertNotIn("score", male["matches"][0])
        self.assertEqual(plan["report"]["divisions"]["MALE"]["completed"], 0)
        self.assertTrue(all(row["wins"] == row["losses"] == 0 for row in male["standings"]["rows"]))

    def test_preserves_roster_participant_future_and_postseason_metadata(self):
        postseason = {"id": "VL2627-M-POST-1", "date": "2027-04-01", "stage": "플레이오프",
                      "home": {"code": "M01"}, "away": {"code": "M02"}, "custom": "KEEP_POSTSEASON"}
        self.originals["MALE"]["matches"].append(postseason)
        before = deepcopy(self.originals)
        plan = update.prepare_update(self.originals, self.snapshot)
        self.assertEqual(self.originals, before)
        candidate = plan["candidates"][update.DATA_PATHS["MALE"]]
        for key in ("participants", "rosterNote", "rosterSourceNote", "previousSeasonRanking",
                    "meaning", "resources", "qualifications", "finalRanking"):
            self.assertEqual(candidate[key], before["MALE"][key])
        self.assertEqual(candidate["matches"][-1], postseason)
        future = candidate["matches"][100]
        self.assertNotIn("score", future)
        self.assertEqual(future["customNote"], "KEEP_MATCH_NOTE")
        self.assertEqual(future["id"], before["MALE"]["matches"][100]["id"])
        self.assertEqual(set(plan["changed_files"]), update.ALLOWED_OUTPUTS)

    def test_snapshot_replay_is_idempotent_even_with_new_fetch_time(self):
        first = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        client = MemorySheets(self.master_values)
        master.apply_update_plan(client, first["master_plan"])
        later = deepcopy(self.snapshot)
        later["fetched_at"] = "2026-10-31T10:45:00+00:00"
        for row in later["matches"]:
            row["observed_at"] = later["fetched_at"]
        for rank in later["official_standings"]:
            rank["observed_at"] = later["fetched_at"]
        second = update.prepare_update(candidate_originals(first), later,
                                       first["candidates"][update.STATE_PATH], client.values)
        self.assertEqual(second["changed_files"], [])
        self.assertEqual(second["master_plan"]["changes"], [])
        self.assertEqual(second["candidates"], first["candidates"])
        self.assertEqual(second["report"]["divisions"]["MALE"]["changed_matches"], 0)

    def test_master_plan_missing_is_explicitly_not_ready(self):
        plan = update.prepare_update(self.originals, self.snapshot)
        self.assertIsNone(plan["master_plan"])
        self.assertFalse(plan["report"]["master_checked"])
        self.assertEqual(plan["report"]["status"], "SOURCE_AND_SITE_VERIFIED_MASTER_NOT_CHECKED")
        checked = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        self.assertEqual(checked["report"]["status"], "READY")
        self.assertEqual(len(checked["master_plan"]["checked_match_ids"]), 252)
        self.assertNotIn("KEEP_PRIVATE_SYNTHETIC_NOTE", json.dumps(checked["report"]))

    def test_official_rank_mismatch_stops_the_whole_update(self):
        self.snapshot["official_standings"][0]["rows"][0]["points_won"] += 1
        with self.assertRaises(StandingsError):
            update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)

    def test_official_rank_name_cannot_contradict_provider_and_local_identity(self):
        # Keep the provider ID and every numeric total correct: the label alone
        # must not silently identify a different team under a valid code.
        for invalid_name in ("A different team", None, 1001):
            snapshot = deepcopy(self.snapshot)
            snapshot["official_standings"][0]["rows"][0]["name"] = invalid_name
            with self.subTest(name=invalid_name), self.assertRaisesRegex(update.UpdateError, "team name conflicts"):
                update.prepare_update(self.originals, snapshot, master_values=self.master_values)

    def test_official_rank_name_ignores_whitespace_only_variation(self):
        baseline = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        snapshot = deepcopy(self.snapshot)
        rank_row = snapshot["official_standings"][0]["rows"][0]
        rank_row["name"] = " \t" + rank_row["name"].replace(" ", "  ") + "\n "
        result = update.prepare_update(self.originals, snapshot, master_values=self.master_values)
        self.assertEqual(result["candidates"], baseline["candidates"])
        self.assertEqual(result["master_plan"], baseline["master_plan"])

    def test_optimistic_local_precondition_blocks_every_write(self):
        plan = update.prepare_update(self.originals, self.snapshot)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            seed_root(root, self.originals)
            target = root / update.DATA_PATHS["FEMALE"]
            concurrent = deepcopy(self.originals["FEMALE"])
            concurrent["rosterNote"] = "Concurrent change"
            update.write_json(target, concurrent)
            before = {p: (root / p).read_bytes() for p in update.DATA_PATHS.values()}
            with self.assertRaisesRegex(update.UpdateError, "changed during collection"):
                update.write_candidates(root, plan)
            self.assertFalse((root / update.STATE_PATH).exists())
            self.assertEqual(before, {p: (root / p).read_bytes() for p in update.DATA_PATHS.values()})

    def test_allowlisted_write_leaves_config_rosters_and_other_competitions_intact(self):
        plan = update.prepare_update(self.originals, self.snapshot)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            seed_root(root, self.originals)
            protected = ["data/competitions/v-league-men-2026-27/config.json",
                         "data/competitions/v-league-women-2026-27/rosters.json",
                         "data/competitions/kovo-cup-men-2026/data.json"]
            for relative in protected:
                update.write_json(root / relative, {"must": "remain unchanged"})
            before = {p: (root / p).read_bytes() for p in protected}
            update.write_candidates(root, plan)
            self.assertEqual(before, {p: (root / p).read_bytes() for p in protected})
            self.assertEqual(update.read_json(root / update.STATE_PATH), plan["candidates"][update.STATE_PATH])

    def test_disallowed_output_is_rejected(self):
        plan = update.prepare_update(self.originals, self.snapshot)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            seed_root(root, self.originals)
            plan["changed_files"].insert(0, "index.html")
            plan["candidates"]["index.html"] = {"unexpected": "write"}
            with self.assertRaisesRegex(update.UpdateError, "allowlisted"):
                update.write_candidates(root, plan)
            self.assertFalse((root / "index.html").exists())


class PublishContextTests(unittest.TestCase):
    approved = {"KVL_VLEAGUE_PUBLISH_APPROVED": "true", "GITHUB_REF": "refs/heads/main",
                "GITHUB_REPOSITORY": "kvolleylab/kvolleylab", "GITHUB_EVENT_NAME": "schedule"}

    def test_publishing_default_off_and_wrong_context_rejected_before_git(self):
        contexts = [{}, {**self.approved, "KVL_VLEAGUE_PUBLISH_APPROVED": "false"},
                    {**self.approved, "GITHUB_REF": "refs/heads/feature/test"},
                    {**self.approved, "GITHUB_REPOSITORY": "someone/fork"},
                    {**self.approved, "GITHUB_EVENT_NAME": "pull_request"}]
        for context in contexts:
            with self.subTest(context=context), patch.dict(os.environ, context, clear=True), \
                    patch.object(update.subprocess, "check_output") as command:
                with self.assertRaises(update.UpdateError):
                    update.ensure_publish_context(Path("unused"))
                command.assert_not_called()

    def test_only_clean_current_main_can_publish(self):
        with patch.dict(os.environ, self.approved, clear=True):
            for responses in (["abc\n", "def\trefs/heads/main\n"],
                              ["abc\n", "abc\trefs/heads/main\n", " M data/file.json\n"]):
                with self.subTest(responses=responses), patch.object(update.subprocess, "check_output", side_effect=responses):
                    with self.assertRaises(update.UpdateError):
                        update.ensure_publish_context(Path("unused"))
            with patch.object(update.subprocess, "check_output", side_effect=["abc\n", "abc\trefs/heads/main\n", ""]):
                update.ensure_publish_context(Path("unused"))


class MainFlowTests(unittest.TestCase):
    def setUp(self):
        self.originals, self.snapshot, self.master_values = fixture_bundle()
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.output = Path(self.temp.name) / "review"
        seed_root(self.root, self.originals)

    def invoke(self, arguments=(), client=None, *, trusted=False):
        argv = ["kovo_vleague_update.py", "--root", str(self.root), "--output", str(self.output), *arguments]
        with patch.object(sys, "argv", argv), patch.object(update, "collect_season", return_value=deepcopy(self.snapshot)), \
                patch.object(update.SheetsClient, "from_environment", return_value=client) as connect, \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            if trusted:
                with patch.object(update, "ensure_publish_context"):
                    result = update.main()
            else:
                result = update.main()
        return result, connect

    def test_default_mode_never_connects_or_writes_master_or_operating_files(self):
        before = {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
        result, connect = self.invoke()
        self.assertEqual(result, 0)
        connect.assert_not_called()
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()})
        self.assertFalse((self.root / update.STATE_PATH).exists())
        report = update.read_json(self.output / "report.json")
        self.assertFalse(report["production_written"])
        self.assertFalse(report["master_written"])
        self.assertTrue((self.output / "candidate" / update.DATA_PATHS["MALE"]).exists())

    def test_publish_cannot_replay_source_or_master_files(self):
        for option in ("--source-file", "--master-snapshot"):
            with self.subTest(option=option), patch.object(update, "apply_update_plan") as write_master:
                result, connect = self.invoke(["--publish", option, "does-not-need-to-exist.json"], trusted=True)
                self.assertEqual(result, 1)
                connect.assert_not_called()
                write_master.assert_not_called()

    def test_publish_requires_master_plan_before_any_write(self):
        client = MemorySheets(self.master_values)
        client.read_values = lambda: None
        with patch.object(update, "apply_update_plan") as write_master:
            result, _ = self.invoke(["--publish"], client, trusted=True)
        self.assertEqual(result, 1)
        write_master.assert_not_called()
        self.assertFalse((self.root / update.STATE_PATH).exists())
        self.assertEqual(client.writes, [])

    def test_master_failure_prevents_site_write(self):
        client = MemorySheets(self.master_values)
        before = {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
        with patch.object(update, "apply_update_plan", side_effect=master.MasterError("synthetic conflict")):
            result, _ = self.invoke(["--publish"], client, trusted=True)
        self.assertEqual(result, 1)
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()})
        self.assertFalse((self.root / update.STATE_PATH).exists())

    def test_quality_audit_failure_prevents_master_and_site_write(self):
        config_path = (self.root / update.DATA_PATHS["MALE"]).with_name("config.json")
        config = update.read_json(config_path)
        config["schemaVersion"] = 999
        update.write_json(config_path, config)
        client = MemorySheets(self.master_values)
        before = {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
        result, _ = self.invoke(["--publish"], client, trusted=True)
        self.assertEqual(result, 1)
        self.assertEqual(client.writes, [])
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()})
        self.assertFalse((self.root / update.STATE_PATH).exists())

    def test_nested_private_draft_or_sensitive_payload_blocks_all_publication(self):
        secret = "SYNTHETIC_PUBLICATION_SECRET"
        payloads = ({"access_level": "PRIVATE", "note": secret},
                    {"record_status": "DRAFT", "note": secret},
                    {"client_secret": secret})
        for payload in payloads:
            with self.subTest(payload_kind=next(iter(payload))):
                originals = deepcopy(self.originals)
                originals["MALE"]["resources"].append({"nested": [payload]})
                seed_root(self.root, originals)
                before = {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()}
                client = MemorySheets(self.master_values)
                with patch.object(update, "apply_update_plan", wraps=update.apply_update_plan) as write_master:
                    result, _ = self.invoke(["--publish"], client, trusted=True)
                self.assertEqual(result, 1)
                write_master.assert_not_called()
                self.assertEqual(client.writes, [])
                self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.DATA_PATHS.values()})
                self.assertFalse((self.root / update.STATE_PATH).exists())
                self.assertFalse((self.output / "candidate").exists())
                report = update.read_json(self.output / "report.json")
                self.assertTrue(all(item["outcome"] == "PASS" for item in report["quality_audit"]))
                self.assertEqual(report["publication_gate"]["status"], "FAIL")
                self.assertEqual(report["publication_gate"]["rejected_file_count"], 1)
                self.assertEqual(report["publication_gate"]["files"], {})
                self.assertFalse(report["master_written"])
                self.assertFalse(report["production_written"])
                for artifact in self.output.rglob("*"):
                    if artifact.is_file():
                        self.assertNotIn(secret, artifact.read_text())

    def test_publication_receipts_hash_exact_payloads_without_noop_churn(self):
        client = MemorySheets(self.master_values)
        before_check = datetime.now(timezone.utc)
        result, _ = self.invoke(["--publish"], client, trusted=True)
        after_check = datetime.now(timezone.utc)
        self.assertEqual(result, 0)
        receipt = update.read_json(self.output / "report.json")["publication_gate"]
        self.assertEqual(receipt["status"], "PASS")
        self.assertEqual(set(receipt["files"]), update.ALLOWED_OUTPUTS)
        self.assertLessEqual(before_check, datetime.fromisoformat(receipt["checked_at"]))
        self.assertLessEqual(datetime.fromisoformat(receipt["checked_at"]), after_check)
        before = {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS}
        hashes = {}
        for relative, entry in receipt["files"].items():
            hashes[relative] = hashlib.sha256(before[relative]).hexdigest()
            self.assertEqual(entry["sha256"], hashes[relative])
            self.assertEqual(entry["access_level"], "PUBLIC")
            self.assertEqual(entry["record_status"], "VERIFIED")
            self.assertEqual(entry["checked_at"], receipt["checked_at"])
            self.assertEqual(entry["verified_at"], receipt["checked_at"])
            self.assertIn("automated", entry["verification_method"])
            self.assertTrue(entry["source_ids"])
            for url in entry["source_ids"]:
                source.validate_request_url(url)
        self.snapshot["fetched_at"] = "2026-10-31T10:45:00+00:00"
        result, _ = self.invoke(["--publish"], client, trusted=True)
        self.assertEqual(result, 0)
        report = update.read_json(self.output / "report.json")
        self.assertEqual(report["changed_files"], [])
        self.assertFalse(report["master_written"])
        self.assertFalse(report["production_written"])
        self.assertEqual(len(client.writes), 1)
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS})
        self.assertEqual(hashes, {p: e["sha256"] for p, e in report["publication_gate"]["files"].items()})

    def test_publish_reads_back_master_before_local_write_and_second_run_is_noop(self):
        client = MemorySheets(self.master_values)
        result, _ = self.invoke(["--publish"], client, trusted=True)
        self.assertEqual(result, 0)
        self.assertGreaterEqual(client.reads, 3)  # initial, immediately-before, after-write
        self.assertEqual(len(client.writes), 1)
        report = update.read_json(self.output / "report.json")
        self.assertTrue(report["master_written"])
        self.assertTrue(report["master_readback_verified"])
        self.assertTrue(report["production_written"])
        before = {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS}
        self.snapshot["fetched_at"] = "2026-10-31T10:45:00+00:00"
        result, _ = self.invoke(["--publish"], client, trusted=True)
        self.assertEqual(result, 0)
        self.assertEqual(len(client.writes), 1)
        self.assertEqual(before, {p: (self.root / p).read_bytes() for p in update.ALLOWED_OUTPUTS})
        report = update.read_json(self.output / "report.json")
        self.assertFalse(report["production_written"])
        self.assertFalse(report["master_written"])

    def test_readonly_master_check_does_not_leak_private_cells_into_artifacts(self):
        client = MemorySheets(self.master_values)
        result, _ = self.invoke(["--check-master"], client)
        self.assertEqual(result, 0)
        self.assertEqual(client.writes, [])
        self.assertTrue(update.read_json(self.output / "report.json")["master_checked"])
        for path in self.output.rglob("*"):
            if path.is_file():
                self.assertNotIn("KEEP_PRIVATE_SYNTHETIC_NOTE", path.read_text())


if __name__ == "__main__":
    unittest.main()

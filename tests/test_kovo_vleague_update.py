"""Offline updater integration tests: synthetic full seasons and public snippets.

No private MASTER snapshot, credentials, network call or operating site writes
are used. The two opening score excerpts come from public_contract_v1.json;
all team identities and the 252-game schedule in this test are synthetic.
"""
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
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
import kvl_competition_lifecycle as lifecycle
from kovo_vleague_standings import StandingsError, calculate_standings, OFFICIAL_TOTAL_FIELDS
from test_kovo_vleague_source import FakeSeasonSource, FIXTURE, STAMP, synthetic_postseason


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


def add_postseason(snapshot, *, gender="MALE", phase="202", legs=1, final_legs=0, home="002", away="003"):
    snapshot["matches"] = [r for r in snapshot["matches"] if not (r["gender"] == gender and r["phase_id"] == phase)]
    for leg in range(1, legs + 1):
        raw = synthetic_postseason(gender, phase, leg, final=leg <= final_legs)
        prefix = source.GENDERS[gender]
        raw.update(hcode=prefix + home, acode=prefix + away, hsname="Synthetic " + prefix + home,
                   asname="Synthetic " + prefix + away)
        snapshot["matches"].append(source.normalize_match(raw, season="2026-27", gender=gender,
                 phase_id=phase, source_url=source.schedule_url("2026-27", gender, phase_id=phase), observed_at=STAMP))
    next(c for c in snapshot["coverage"]["postseason"] if c["gender"] == gender and c["phase_id"] == phase).update(received=legs)


def finish_regular_snapshot(originals, snapshot, *, close_qpo_gap=False):
    """Fully synthetic final season, with explicit reconciled official totals."""
    for gender in update.DIVISIONS:
        local = deepcopy(originals[gender])
        for match in local["matches"]:
            flipped = close_qpo_gap and match["home"]["code"].endswith("03") and match["away"]["code"].endswith("04") and update.record_round(match) <= 3
            match.update(status="final", score={"home": 0 if flipped else 3, "away": 3 if flipped else 0,
                         "sets": [{"home": 20 if flipped else 25, "away": 25 if flipped else 20}] * 3})
        for record in snapshot["matches"]:
            if record["gender"] == gender and record["phase_id"] == "201":
                flipped = close_qpo_gap and record["home"]["provider_code"].endswith("003") and record["away"]["provider_code"].endswith("004") and record["round"] <= 3
                record.update(status="final", sets_won={"home": 0 if flipped else 3, "away": 3 if flipped else 0},
                              sets=[{"home": 20 if flipped else 25, "away": 25 if flipped else 20}] * 3)
        calculated = calculate_standings(local["participants"], local["matches"], rules_verified=True)
        rank_snapshot = next(s for s in snapshot["official_standings"] if s["gender"] == gender)
        rank_snapshot["rows"] = [{"provider_code": source.GENDERS[gender] + row["team"]["code"][1:],
                                  "name": row["team"]["name"], "rank": rank,
                                  **{src: row[local_key] for src, local_key in OFFICIAL_TOTAL_FIELDS.items()}}
                                 for rank, row in enumerate(calculated["rows"], 1)]
        # Provider identifiers have four digits; synthetic local codes have two.
        for row in rank_snapshot["rows"]:
            row["provider_code"] = source.GENDERS[gender] + row["provider_code"][1:].zfill(3)


def seed_root(root, originals, state=None):
    policy = update.read_json(Path(__file__).resolve().parents[1] / lifecycle.DEFAULT_POLICY)
    update.write_json(root / lifecycle.DEFAULT_POLICY, policy)
    for gender, relative in update.DATA_PATHS.items():
        update.write_json(root / relative, originals[gender])
        slug = Path(relative).parent.name
        update.write_json((root / relative).with_name("config.json"), {
            "slug": slug, "schemaVersion": 2,
            "competition": {"competitionId": next(c["competition_id"] for c in policy["competitions"] if c["gender"] == gender),
                            "season": "2026-27", "gender": update.DIVISIONS[gender]},
        })
    if state is not None:
        update.write_json(root / update.STATE_PATH, state)


class PostseasonUpdateTests(unittest.TestCase):
    def setUp(self):
        self.originals, self.snapshot, self.master_values = fixture_bundle(finals=False)

    def test_empty_phase_requests_do_not_create_fake_postseason_games(self):
        plan = update.prepare_update(self.originals, self.snapshot)
        for gender, path in update.DATA_PATHS.items():
            self.assertEqual(len(plan["candidates"][path]["matches"]), 126)
            self.assertEqual(plan["report"]["divisions"][gender]["postseason"]["matched"], 0)
            self.assertFalse(plan["report"]["divisions"][gender]["postseason"]["complete"])

    def test_new_official_fixture_gets_stable_series_id_and_preserves_regular_ids(self):
        add_postseason(self.snapshot, legs=3)
        plan = update.prepare_update(self.originals, self.snapshot)
        candidate = plan["candidates"][update.DATA_PATHS["MALE"]]
        self.assertEqual([m["id"] for m in candidate["matches"][:126]], [m["id"] for m in self.originals["MALE"]["matches"]])
        self.assertEqual([m["id"] for m in candidate["matches"][126:]], [f"VL2627-M-PO-{n:03d}" for n in (1, 2, 3)])
        self.assertEqual([m["round"] for m in candidate["matches"][126:]], ["1차전", "2차전", "3차전"])
        self.assertEqual(plan["report"]["divisions"]["MALE"]["matched"], 126)
        self.assertEqual(plan["report"]["divisions"]["MALE"]["postseason"]["matched"], 3)
        later = deepcopy(self.snapshot)
        next(r for r in later["matches"] if r.get("series_game") == 2)["date"] = "2027-04-11"
        new = update.prepare_update(candidate_originals(plan), later, plan["candidates"][update.STATE_PATH])
        self.assertEqual(new["candidates"][update.STATE_PATH], plan["candidates"][update.STATE_PATH])
        self.assertEqual(new["candidates"][update.DATA_PATHS["MALE"]]["matches"][-2]["id"], "VL2627-M-PO-002")

    def test_postseason_pending_fixture_is_not_promoted_or_written(self):
        add_postseason(self.snapshot)
        pending = self.snapshot["matches"].pop()
        pending["fixture_ready"] = False
        pending["time"] = None
        self.snapshot["pending_matches"] = [pending]
        plan = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        self.assertEqual(len(plan["matched"]), 252)
        self.assertEqual(len(plan["candidates"][update.DATA_PATHS["MALE"]]["matches"]), 126)
        self.assertEqual(plan["report"]["divisions"]["MALE"]["pending_postseason_fixtures"], 1)

    def test_postseason_coverage_cannot_hide_a_missing_fixture(self):
        add_postseason(self.snapshot, legs=3)
        self.snapshot["matches"].pop()
        with self.assertRaisesRegex(update.UpdateError, "coverage"):
            update.prepare_update(self.originals, self.snapshot)

    def test_regular_season_completion_keeps_season_active_and_locks_standings(self):
        finish_regular_snapshot(self.originals, self.snapshot)
        add_postseason(self.snapshot, legs=2, final_legs=2)
        plan = update.prepare_update(self.originals, self.snapshot)
        candidate = plan["candidates"][update.DATA_PATHS["MALE"]]
        self.assertTrue(candidate["regularSeasonComplete"])
        self.assertEqual(candidate["status"], "active")
        self.assertEqual(sum(r["games"] for r in candidate["standings"]["rows"]), 252)
        self.assertEqual(plan["report"]["divisions"]["MALE"]["completed"], 126)
        self.assertEqual(plan["report"]["divisions"]["MALE"]["postseason"]["completed"], 2)

    def test_championship_clinch_completes_only_that_division(self):
        finish_regular_snapshot(self.originals, self.snapshot)
        add_postseason(self.snapshot, legs=2, final_legs=2)
        add_postseason(self.snapshot, phase="203", legs=3, final_legs=3, home="001", away="002")
        plan = update.prepare_update(self.originals, self.snapshot)
        self.assertEqual(plan["candidates"][update.DATA_PATHS["MALE"]]["status"], "completed")
        self.assertEqual(plan["candidates"][update.DATA_PATHS["FEMALE"]]["status"], "active")
        post = plan["report"]["divisions"]["MALE"]["postseason"]
        self.assertEqual(post, {"matched": 5, "completed": 5, "complete": True, "champion": "M01"})

    def test_swept_series_retains_published_unused_leg_and_marks_not_required(self):
        finish_regular_snapshot(self.originals, self.snapshot)
        add_postseason(self.snapshot, legs=3)
        first = update.prepare_update(self.originals, self.snapshot)
        original_ids = [m["id"] for m in first["candidates"][update.DATA_PATHS["MALE"]]["matches"]]
        later = deepcopy(self.snapshot)
        add_postseason(later, legs=2, final_legs=2)
        plan = update.prepare_update(candidate_originals(first), later, first["candidates"][update.STATE_PATH])
        candidate = plan["candidates"][update.DATA_PATHS["MALE"]]
        self.assertEqual([m["id"] for m in candidate["matches"]], original_ids)
        unused = candidate["matches"][-1]
        self.assertEqual((unused["status"], unused["notRequired"], unused["non_play_reason"]),
                         ("not_required", True, "series_clinched"))
        self.assertNotIn("score", unused)
        self.assertEqual(set(plan["candidates"][update.STATE_PATH]["links"]), set(first["candidates"][update.STATE_PATH]["links"]))
        repeat = update.prepare_update(candidate_originals(plan), later, plan["candidates"][update.STATE_PATH])
        self.assertEqual(repeat["changed_files"], [])

    def test_unused_legs_never_seen_before_are_not_created(self):
        finish_regular_snapshot(self.originals, self.snapshot)
        add_postseason(self.snapshot, legs=3, final_legs=2)
        plan = update.prepare_update(self.originals, self.snapshot)
        self.assertEqual(len(plan["candidates"][update.DATA_PATHS["MALE"]]["matches"]), 128)
        self.assertEqual(len(plan["matched"]), 254)

    def test_missing_unfinished_leg_and_changed_existing_provider_identity_block(self):
        add_postseason(self.snapshot, legs=3)
        first = update.prepare_update(self.originals, self.snapshot)
        for mode in ("removed", "provider_changed"):
            changed = deepcopy(self.snapshot)
            if mode == "removed":
                add_postseason(changed, legs=2)
            else:
                row = next(r for r in changed["matches"] if r.get("series_game") == 1)
                row.update(number=999, source_key="023:001:MALE:999")
            with self.assertRaises(update.UpdateError):
                update.prepare_update(candidate_originals(first), changed, first["candidates"][update.STATE_PATH])

    def test_postseason_result_before_prior_leg_or_after_clinch_is_blocked(self):
        for mode in ("missing_earlier", "extra_result"):
            snapshot = deepcopy(self.snapshot)
            add_postseason(snapshot, legs=3, final_legs=3)
            if mode == "missing_earlier":
                row = next(r for r in snapshot["matches"] if r.get("series_game") == 1)
                row.update(status="scheduled", sets_won={"home": 0, "away": 0}, sets=None)
            with self.assertRaises(update.UpdateError):
                update.prepare_update(self.originals, snapshot)

    def test_new_fixture_master_readback_then_series_clinch_and_unused_row(self):
        finish_regular_snapshot(self.originals, self.snapshot)
        add_postseason(self.snapshot, legs=3)
        first = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        client = MemorySheets(self.master_values)
        receipt = master.apply_update_plan(client, first["master_plan"])
        self.assertEqual(receipt["status"], "VERIFIED")
        row_number = master.POSTSEASON_ROWS["VL2627-M-PO-003"]
        self.assertEqual(client.values[row_number - 1][0], "VL2627-M-PO-003")
        self.assertEqual(client.values[row_number - 1][12], "예정")
        self.assertTrue(all(row[18] == "KEEP_PRIVATE_SYNTHETIC_NOTE" for row in client.values[1:253]))
        self.assertTrue(all(row[18] == "" for row in client.values[253:]))
        later = deepcopy(self.snapshot)
        add_postseason(later, legs=2, final_legs=2)
        next_plan = update.prepare_update(candidate_originals(first), later,
                                         first["candidates"][update.STATE_PATH], client.values)
        second_receipt = master.apply_update_plan(client, next_plan["master_plan"])
        self.assertEqual(second_receipt["status"], "VERIFIED")
        self.assertEqual(client.values[row_number - 1][12], "미실시")
        self.assertEqual(client.values[row_number - 1][13:16], ["", "", ""])
        replay = update.prepare_update(candidate_originals(next_plan), later,
                                      next_plan["candidates"][update.STATE_PATH], client.values)
        self.assertEqual(replay["master_plan"]["changes"], [])
        self.assertEqual(replay["changed_files"], [])

    def test_unused_leg_manual_lock_remains_protected(self):
        finish_regular_snapshot(self.originals, self.snapshot)
        add_postseason(self.snapshot, legs=3)
        first = update.prepare_update(self.originals, self.snapshot)
        originals = candidate_originals(first)
        originals["MALE"]["matches"][-1]["automationLocked"] = True
        later = deepcopy(self.snapshot)
        add_postseason(later, legs=2, final_legs=2)
        with self.assertRaisesRegex(update.UpdateError, "locked"):
            update.prepare_update(originals, later, first["candidates"][update.STATE_PATH])

    def test_qpo_removed_after_final_points_gap_is_recorded_and_playoff_continues(self):
        add_postseason(self.snapshot, phase="204", home="003", away="004")
        first = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        client = MemorySheets(self.master_values)
        master.apply_update_plan(client, first["master_plan"])
        later = deepcopy(self.snapshot)
        finish_regular_snapshot(self.originals, later)
        add_postseason(later, phase="204", legs=0)
        add_postseason(later, phase="202", legs=2, final_legs=2)
        plan = update.prepare_update(candidate_originals(first), later, first["candidates"][update.STATE_PATH], client.values)
        record = next(r for r in plan["matched"] if r["match_id"] == "VL2627-M-QPO-001")
        self.assertEqual(record["non_play_reason"], "qualification_gap")
        evidence = record["qualification_evidence"]
        self.assertEqual(evidence["regular_completed"], 126)
        self.assertTrue(evidence["official_standings_verified"])
        self.assertEqual(evidence["source_url"], source.standings_url("2026-27", "MALE"))
        self.assertEqual(evidence["third"], {"code": "M03", "points": 72})
        self.assertEqual(evidence["fourth"], {"code": "M04", "points": 54})
        self.assertEqual(plan["report"]["divisions"]["MALE"]["postseason"]["completed"], 2)
        receipt = master.apply_update_plan(client, plan["master_plan"])
        self.assertEqual(receipt["status"], "VERIFIED")
        self.assertEqual(client.values[master.POSTSEASON_ROWS["VL2627-M-QPO-001"] - 1][12], "미실시")
        again = update.prepare_update(candidate_originals(plan), later, plan["candidates"][update.STATE_PATH], client.values)
        self.assertEqual(again["changed_files"], [])
        self.assertEqual(again["master_plan"]["changes"], [])

    def test_qpo_still_published_after_gap_is_marked_not_required_without_cancellation(self):
        add_postseason(self.snapshot, phase="204", home="003", away="004")
        first = update.prepare_update(self.originals, self.snapshot)
        later = deepcopy(self.snapshot)
        finish_regular_snapshot(self.originals, later)
        plan = update.prepare_update(candidate_originals(first), later, first["candidates"][update.STATE_PATH])
        match = plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][-1]
        self.assertEqual((match["status"], match["non_play_reason"]), ("not_required", "qualification_gap"))
        self.assertNotIn("score", match)

    def test_qpo_required_by_reconciled_points_cannot_disappear(self):
        add_postseason(self.snapshot, phase="204", home="003", away="004")
        first = update.prepare_update(self.originals, self.snapshot)
        later = deepcopy(self.snapshot)
        finish_regular_snapshot(self.originals, later, close_qpo_gap=True)
        add_postseason(later, phase="204", legs=0)
        with self.assertRaisesRegex(update.UpdateError, "unresolved postseason"):
            update.prepare_update(candidate_originals(first), later, first["candidates"][update.STATE_PATH])

    def test_qpo_waiver_cannot_use_unreconciled_official_rank_totals(self):
        add_postseason(self.snapshot, phase="204", home="003", away="004")
        first = update.prepare_update(self.originals, self.snapshot)
        later = deepcopy(self.snapshot)
        finish_regular_snapshot(self.originals, later)
        add_postseason(later, phase="204", legs=0)
        third = next(row for group in later["official_standings"] if group["gender"] == "MALE"
                     for row in group["rows"] if row["rank"] == 3)
        third["points"] += 1
        with self.assertRaises(StandingsError):
            update.prepare_update(candidate_originals(first), later, first["candidates"][update.STATE_PATH])

    def test_qpo_waiver_requires_published_third_fourth_team_identity(self):
        add_postseason(self.snapshot, phase="204", home="001", away="002")
        first = update.prepare_update(self.originals, self.snapshot)
        later = deepcopy(self.snapshot)
        finish_regular_snapshot(self.originals, later)
        add_postseason(later, phase="204", legs=0)
        with self.assertRaisesRegex(update.UpdateError, "third/fourth"):
            update.prepare_update(candidate_originals(first), later, first["candidates"][update.STATE_PATH])

    def test_master_independently_rejects_tampered_qpo_qualification_evidence(self):
        add_postseason(self.snapshot, phase="204", home="003", away="004")
        first = update.prepare_update(self.originals, self.snapshot, master_values=self.master_values)
        client = MemorySheets(self.master_values)
        master.apply_update_plan(client, first["master_plan"])
        later = deepcopy(self.snapshot)
        finish_regular_snapshot(self.originals, later)
        add_postseason(later, phase="204", legs=0)
        valid = update.prepare_update(candidate_originals(first), later,
                                      first["candidates"][update.STATE_PATH], client.values)
        for mode in ("points", "verification", "source_phase", "missing_regular", "teams"):
            records = deepcopy(valid["matched"])
            qpo = next(r for r in records if r["match_id"] == "VL2627-M-QPO-001")
            proof = qpo["qualification_evidence"]
            if mode == "points": proof["third"]["points"] += 1
            elif mode == "verification": proof["official_standings_verified"] = False
            elif mode == "source_phase": proof["source_url"] = proof["source_url"].replace("leagueCode=201", "leagueCode=203")
            elif mode == "missing_regular": records.remove(next(r for r in records if r["match_id"] == "VL2627-M-001"))
            else: proof["third"]["code"] = "M01"
            with self.subTest(mode=mode), self.assertRaises(master.MasterError):
                master.build_update_plan(client.values, records)


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
            while len(self.values) < int(location[2]):
                self.values.append([""] * 19)
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
        self.assertEqual(male["matches"][0]["liveScore"], {"home": 1, "away": 0,
                         "sourceKey": live["source_key"], "observedAt": snapshot["fetched_at"]})
        self.assertEqual(male["matches"][0]["liveSets"], [{"home": 25, "away": 20, "status": "completed", "observedAt": snapshot["fetched_at"]}])
        self.assertNotIn("scoreVerification", male["matches"][0])
        self.assertEqual(update.publication_gate(plan)["status"], "PASS")
        self.assertEqual(plan["report"]["divisions"]["MALE"]["completed"], 0)
        self.assertTrue(all(row["wins"] == row["losses"] == 0 for row in male["standings"]["rows"]))

    def test_live_observation_refreshes_without_polluting_final_results(self):
        originals, snapshot, _ = fixture_bundle(finals=False)
        row = snapshot["matches"][0]
        row.update(status="live", sets_won={"home": 1, "away": 0}, sets=[{"home": 25, "away": 20}])
        first = update.prepare_update(originals, snapshot)
        updated = {g: first["candidates"][path] for g, path in update.DATA_PATHS.items()}
        same = update.prepare_update(updated, snapshot, first["candidates"][update.STATE_PATH])
        self.assertEqual(same["changed_files"], [])
        snapshot["fetched_at"] = (datetime.fromisoformat(snapshot["fetched_at"]) + timedelta(minutes=15)).isoformat()
        again = update.prepare_update(updated, snapshot, first["candidates"][update.STATE_PATH])
        self.assertEqual(again["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]["liveScore"]["observedAt"], snapshot["fetched_at"])
        self.assertIn(update.DATA_PATHS["MALE"], again["changed_files"])
        row["sets_won"]["home"] = 0
        with self.assertRaises(update.UpdateError):
            update.prepare_update(updated, snapshot)

    def test_final_result_removes_provisional_snapshot(self):
        originals = deepcopy(self.originals)
        originals["MALE"]["matches"][0]["liveScore"] = {"home": 1, "away": 0,
            "sourceKey": self.snapshot["matches"][0]["source_key"], "observedAt": self.snapshot["fetched_at"]}
        originals["MALE"]["matches"][0]["liveSets"] = [{"home": 25, "away": 20, "status": "completed"}]
        plan = update.prepare_update(originals, self.snapshot)
        match = plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]
        self.assertNotIn("liveScore", match)
        self.assertNotIn("liveSets", match)
        self.assertEqual(max(match["score"]["home"], match["score"]["away"]), 3)

    def test_preserves_roster_participant_future_and_postseason_metadata(self):
        postseason = {"id": "VL2627-M-POST-1", "date": "2027-04-01", "stage": "플레이오프",
                      "home": {"code": "M01"}, "away": {"code": "M02"}, "custom": "KEEP_POSTSEASON",
                      "seriesGame": 1, "round": "1차전", "status": "scheduled", "time": "14:00"}
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
                         "data/competitions/v-league-men-2026-27/rosters.json",
                         "data/master/player_master_pro_vleague_2026_27_v1.json",
                         "data/national/player_id_links_v1.json",
                         "data/competitions/asian-games-men-2026/data.json",
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
                patch.object(lifecycle, "utc_now", return_value=datetime.fromisoformat(STAMP)), \
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


class PartialObservationRecoveryTests(unittest.TestCase):
    def test_missing_points_preserve_certified_prefix_with_original_timestamp(self):
        originals, snapshot, _ = fixture_bundle(finals=False)
        row = snapshot["matches"][0]
        row.update(status="live", sets_won={"home": 0, "away": 1}, sets=[{"home": 23, "away": 25}])
        first = update.prepare_update(originals, snapshot)
        originals = candidate_originals(first)
        previous = deepcopy(originals["MALE"]["matches"][0]["liveSets"])
        row.update(sets_won={"home": 1, "away": 2}, sets=None)
        snapshot["fetched_at"] = (datetime.fromisoformat(snapshot["fetched_at"]) + timedelta(minutes=20)).isoformat()
        plan = update.prepare_update(originals, snapshot)
        match = plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]
        self.assertEqual(match["liveSets"], previous)
        self.assertEqual(match["liveScore"]["home"], 1)
        self.assertNotIn("score", match)
        # Present contradictory points must not be replaced by old points.
        row["sets"] = [{"home": 8, "away": 9}]
        changed = update.prepare_update(originals, snapshot)
        self.assertEqual(changed["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]["liveSets"], [])
        # Different fixture date cannot inherit earlier points.
        row.update(sets=None, date="2026-11-20")
        changed = update.prepare_update(originals, snapshot)
        self.assertEqual(changed["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]["liveSets"], [])

    def test_pending_end_allows_other_division_final_and_never_finalizes_master(self):
        originals, snapshot, master_rows = fixture_bundle()
        row = next(r for r in snapshot["matches"] if r["gender"] == "MALE")
        final_row = deepcopy(row)
        row.update(status="live", final_pending=True)
        next(r for r in snapshot["official_standings"] if r["gender"] == "MALE")["rows"] = []
        plan = update.prepare_update(originals, snapshot, master_values=master_rows)
        male = plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]
        female = plan["candidates"][update.DATA_PATHS["FEMALE"]]["matches"][0]
        self.assertTrue(male["liveScore"]["finalPending"])
        self.assertNotIn("score", male)
        self.assertEqual(female["status"], "final")
        matched = next(r for r in plan["matched"] if r["gender"] == "MALE")
        self.assertIsNone(matched["score"])
        self.assertEqual(matched["status"], "live")
        self.assertEqual(plan["report"]["divisions"]["MALE"]["completed"], 0)
        self.assertEqual(update.publication_gate(plan)["status"], "PASS")
        # Complete official end evidence promotes the same identity next poll.
        original_snapshot = fixture_bundle()[1]
        final_plan = update.prepare_update(candidate_originals(plan), original_snapshot)
        final = final_plan["candidates"][update.DATA_PATHS["MALE"]]["matches"][0]
        self.assertEqual(final["status"], "final")
        self.assertNotIn("liveScore", final)
        self.assertEqual(final["id"], male["id"])

    def test_pending_flag_cannot_bypass_counter_or_final_guards(self):
        originals, snapshot, _ = fixture_bundle(finals=False)
        row = snapshot["matches"][0]
        for home, away, pending in [(3, 3, True), (3, 1, False), (2, 1, True)]:
            with self.subTest(home=home, away=away, pending=pending):
                row.update(status="live", sets_won={"home": home, "away": away}, final_pending=pending)
                with self.assertRaises(update.UpdateError):
                    update.prepare_update(originals, snapshot)

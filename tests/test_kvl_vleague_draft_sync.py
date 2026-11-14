"""Independent offline checks: public draft selection + KOVO registration sync."""
import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import kvl_vleague_draft_sync as bridge


class KvlVLeagueDraftSyncTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = {key: bridge.read(ROOT, p) for key, p in bridge.SOURCE_PATHS.items()}

    def test_real_official_draft_registration_joins(self):
        output = bridge.build(self.raw)
        self.assertEqual(len(self.raw["results"]["results"]), 34)
        self.assertTrue(20 <= output["registration_count"] <= 34)
        self.assertEqual(output["registration_count"], len(output["registered"]))
        self.assertEqual(output["profile_count"], len(output["profiles"]))
        self.assertTrue(output["registration_count"] > output["profile_count"])
        self.assertGreaterEqual(len(output["review"]["draft_blocked"]), 4)
        self.assertEqual(len({p["applicant_id"] for p in output["registered"]}),
                         len(output["registered"]))
        self.assertEqual(len({p["system"]["player_id"] for p in output["profiles"]}),
                         len(output["profiles"]))
        self.assertNotIn("salary", json.dumps(output).lower())
        self.assertNotIn("effective_date", json.dumps(output).lower())

    def test_reviewed_yoon_registration_is_not_draft_as_registration_date(self):
        output = bridge.build(self.raw)
        yoon = next(x for x in output["registered"] if x["name"] == "윤경")
        self.assertEqual(yoon["team"], "OK저축은행")
        self.assertEqual(yoon["team_code"], "OKF")
        self.assertEqual(yoon["number"], 20)
        self.assertEqual(yoon["draft_round"], 1)
        self.assertEqual(yoon["draft_pick"], 1)
        self.assertEqual(yoon["registration_notice_id"], 158550)
        self.assertTrue(yoon["registration_notice_sha256"])
        self.assertEqual(yoon["player_id"], "KVL-P-000008")

    def test_mismatched_old_identity_is_not_reassigned(self):
        output = bridge.build(self.raw)
        found = [x for x in output["registered"] if x["name"] == "여광우"]
        self.assertEqual(len(found), 1)
        self.assertIsNone(found[0]["player_id"])
        self.assertFalse(any(p["identity"]["name_ko"] == "여광우" for p in output["profiles"]))
        self.assertTrue(any(p["name"] == "여광우" and p["reason"] == "linked_player_identity_conflict"
                            for p in output["review"]["draft_blocked"]))

    def test_missing_link_never_creates_id(self):
        output = bridge.build(self.raw)
        for name in ("이율리", "김아중", "오해솔"):
            items = [x for x in output["registered"] if x["name"] == name]
            self.assertEqual(len(items), 1)
            self.assertIsNone(items[0]["player_id"])
        self.assertFalse(any(p["name"] == "Audrey Pak" for p in output["registered"]))
        self.assertTrue(any(p["name"] == "Audrey Pak" for p in output["review"]["draft_blocked"]))

    def test_invalid_official_source_hash_blocks_publication(self):
        src = copy.deepcopy(self.raw)
        yoon = next(p for p in src["notices"]["notices"] if p["id"] == 158550)
        yoon["html_sha256"] = "missing"
        output = bridge.build(src)
        self.assertFalse(any(x["name"] == "윤경" for x in output["registered"]))
        self.assertTrue(any(x["name"] == "윤경" and x["reason"] == "official_source_version_missing"
                            for x in output["review"]["draft_blocked"]))

    def test_conflicting_published_number_blocks_new_entry(self):
        src = copy.deepcopy(self.raw)
        src["men"]["OKF"]["players"].append({"name": "다른 선수", "number": 20})
        output = bridge.build(src)
        self.assertFalse(any(x["name"] == "윤경" for x in output["registered"]))
        self.assertTrue(any(x["name"] == "윤경" and x["reason"] == "published_jersey_number_conflict"
                            for x in output["review"]["draft_blocked"]))

    def test_profile_source_does_not_destroy_school_history(self):
        output = bridge.build(self.raw)
        yoon = next(x for x in output["profiles"] if x["identity"]["name_ko"] == "윤경")
        self.assertEqual(yoon["system"]["player_id"], "KVL-P-000008")
        self.assertEqual(yoon["current_roster"]["previous_school"], "인하대")
        self.assertEqual(yoon["current_roster"]["team_name"], "OK저축은행")
        self.assertFalse(yoon["current_roster"]["draft_eligible"])
        self.assertEqual(yoon["identity"]["birth_date"], "2006-08-30")

    def test_same_input_produces_identical_public_projection(self):
        self.assertEqual(bridge.generate(ROOT), bridge.generate(ROOT))


if __name__ == "__main__":
    unittest.main()

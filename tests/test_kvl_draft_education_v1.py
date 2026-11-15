"""Safe academic origin data from verified KOVO draft applicant PDFs."""
import copy
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import kvl_draft_education_v1 as edu


class DraftEducationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = {key: edu.read(ROOT, value) for key, value in edu.PATHS.items()}

    def rows(self):
        return {x["name"]: x for x in edu.build(self.data)["records"]}

    def test_official_examples_both_when_verified(self):
        rows = self.rows()
        for name, high, uni in (
            ("윤경", "남성고", "인하대"),
            ("임인규", "수성고", "인하대"),
            ("전유석", "문일고", "중부대"),
        ):
            self.assertEqual(rows[name]["high_school"], high)
            self.assertEqual(rows[name]["university"], uni)

    def test_draftees_without_university_do_not_get_fabricated_school(self):
        rows = self.rows()
        self.assertEqual(rows["김아중"]["high_school"], "청수고")
        self.assertNotIn("university", rows["김아중"])
        self.assertEqual(rows["한재원"]["high_school"], "인하사대부고")
        self.assertNotIn("university", rows["한재원"])
        self.assertEqual(rows["배하준"]["university"], "성균관대")
        self.assertNotIn("high_school", rows["배하준"])
        self.assertNotIn("이율리", rows, "non-school military/municipal teams must not appear as schools")
        self.assertEqual(rows["Audrey Pak"]["university"], "UCLA")

    def test_no_middle_school_is_mislabeled_high_school(self):
        result = edu.build(self.data)
        self.assertTrue(all(not x.get("high_school", "").endswith("중") for x in result["records"]))
        self.assertTrue(all(x.get("high_school") or x.get("university") for x in result["records"]))
        self.assertFalse(any("birth_date" in x or "weight_kg" in x
                             or "email" in x for x in result["records"]))

    def test_identity_or_document_change_blocks_public_data(self):
        src = copy.deepcopy(self.data)
        src["M"]["records"][0]["name"] = "다른 이름"
        with self.assertRaisesRegex(ValueError, "EDUCATION_NAME"):
            edu.build(src)
        src = copy.deepcopy(self.data)
        src["W"]["source"]["sha256"] = "different"
        with self.assertRaisesRegex(ValueError, "OFFICIAL_EDUCATION_PDF_SOURCE_CHANGED"):
            edu.build(src)

    def test_repeatable_from_official_sources(self):
        self.assertEqual(edu.generate(ROOT), edu.generate(ROOT))
        result = edu.generate(ROOT)
        self.assertEqual(result["record_count"], len(result["records"]))
        self.assertGreaterEqual(len(result["records"]), 90)
        self.assertEqual(len(set(x["applicant_id"] for x in result["records"])), len(result["records"]))


if __name__ == "__main__":
    unittest.main()

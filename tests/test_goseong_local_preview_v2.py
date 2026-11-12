"""Offline safety tests for local Goseong preview builder (no external services)."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/build-goseong-local-engine-preview-v2.py"
spec = importlib.util.spec_from_file_location("kvl_goseong_preview_builder", SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class TestGoseongPreviewBuilder(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        builder.ROOT = self.root
        for directory in builder.DIRS:
            (self.root / directory).mkdir(parents=True, exist_ok=True)
        source = {
            "competition": {"gender": "men"},
            "slug": builder.SLUG,
        }
        data = {
            "status":"completed",
            "participants":[{"code":str(i)} for i in range(15)],
            "matches":[{"id":"M"+str(i)} for i in range(35)],
            "standings":{"pools":[{}, {}, {}]},
        }
        for file in builder.FILES:
            target = self.root / file
            target.parent.mkdir(parents=True,exist_ok=True)
            if file.endswith("/config.json"):
                target.write_text(json.dumps(source))
            elif file.endswith("/data.json"):
                target.write_text(json.dumps(data))
            elif file == "competition-engine.html":
                target.write_text('<script>const app={production:true};</script>')
            else:
                target.write_text("fixture input\n")
        for slug in builder.COMPETITIONS:
            base = self.root / "data/competitions" / slug
            (base / "config.json").write_text(json.dumps(source if slug == builder.SLUG else
                {"slug":slug,"competition":{"gender":"women"}}))
            (base / "data.json").write_text(json.dumps(data))
        self.destination = Path(self.temp.name) / "preview"

    def test_exact_copy_except_local_production_flag(self):
        result = builder.build(self.destination)
        self.assertEqual(result["sourceData"],{"teams":15,"matches":35,"pools":3})
        config = self.destination / "data/competitions" / builder.SLUG / "data.json"
        self.assertEqual(config.read_bytes(),(self.root / config.relative_to(self.destination)).read_bytes())
        self.assertIn("production:false",(self.destination/"competition-engine.html").read_text())
        self.assertIn("production:true",(self.root/"competition-engine.html").read_text())
        receipt = json.loads((self.destination/"validation/source-provenance.json").read_text())
        self.assertEqual(receipt["recordCounts"]["teams"],15)
        self.assertIn("competition-engine.html",receipt["sourcePaths"])
        self.assertEqual(receipt["mode"],"isolated-local-preview")

    def test_does_not_overwrite_existing_destination(self):
        self.destination.mkdir()
        (self.destination/"important.txt").write_text("leave me")
        with self.assertRaises(ValueError):
            builder.build(self.destination)
        self.assertEqual((self.destination/"important.txt").read_text(),"leave me")

    def test_cannot_write_inside_repository(self):
        with self.assertRaises(ValueError):
            builder.build(self.root / "sandbox")

    def test_reject_unexpected_edited_results(self):
        src = self.root / "data/competitions" / builder.SLUG / "data.json"
        d=json.loads(src.read_text())
        d["matches"].pop()
        src.write_text(json.dumps(d))
        with self.assertRaises(ValueError):
            builder.build(self.destination)


if __name__ == "__main__":
    unittest.main()

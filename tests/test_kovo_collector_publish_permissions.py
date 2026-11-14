"""KOVO collector and Pages publishing must stay independently permissioned."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class KovoWorkflowPrivilegeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = (ROOT / ".github/workflows/kovo-official-notices-collector.yml").read_text(encoding="utf-8")

    def test_read_only_default_and_no_pages_permission_on_collector(self):
        text = self.workflow
        header, rest = text.split("\njobs:\n", 1)
        self.assertIn("permissions:\n  contents: read", header)
        collect, publish = rest.split("\n  publish_bridge:\n", 1)
        self.assertIn("    permissions:\n      contents: write", collect)
        self.assertNotIn("pages: write", collect)
        self.assertIn("    permissions:\n      contents: read\n      pages: write", publish)
        self.assertNotIn("contents: write", publish)

    def test_pages_publication_requires_operator_variable_and_main(self):
        text=self.workflow
        _, publish=text.split("\n  publish_bridge:\n",1)
        self.assertIn("needs: collect", publish)
        self.assertIn("github.ref == 'refs/heads/main'", publish)
        self.assertIn("needs.collect.result == 'success'", publish)
        self.assertIn("vars.KVL_DRAFT_ROSTER_PUBLISH_APPROVED == 'true'", publish)
        self.assertIn("needs.collect.outputs.bridge_changed == 'true'", publish)
        self.assertIn("inputs.publish_bridge == true", publish)
        self.assertIn('kvl_vleague_draft_deploy.py', publish)

    def test_source_failed_cannot_publish_and_retries_are_idempotent(self):
        text=self.workflow
        collect, publish=text.split("\n  publish_bridge:\n",1)[0],text.split("\n  publish_bridge:\n",1)[1]
        self.assertIn("scripts/kvl_vleague_draft_sync.py --write", collect)
        self.assertIn("scripts/kvl_vleague_draft_sync.py --check", collect)
        self.assertIn("test_kvl_vleague_draft_sync.py", collect)
        self.assertIn('steps.draft-bridge.outcome == \'success\'', collect)
        self.assertIn('steps.draft-bridge.outcome != \'success\'', collect)
        self.assertIn("outputs.bridge_changed", publish)
        self.assertNotIn("google-github-actions/auth", collect)

if __name__=='__main__':
    unittest.main()

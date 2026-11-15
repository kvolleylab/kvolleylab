"""Guard the dedicated draft bridge publisher from unapproved network actions."""
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from kvl_vleague_draft_deploy import publish
import kovo_vleague_ops as ops

REPO = "kvolleylab/kvolleylab"
CONTEXT = {
    "GITHUB_REPOSITORY": REPO,
    "GITHUB_REF": "refs/heads/main",
    "GITHUB_EVENT_NAME": "schedule",
    "GITHUB_WORKFLOW_REF": REPO + "/.github/workflows/kovo-official-notices-collector.yml@refs/heads/main",
    "KVL_DRAFT_ROSTER_PUBLISH_APPROVED": "true",
}


class DraftDeployGuardTests(unittest.TestCase):
    def test_missing_explicit_approval_cannot_authenticate_or_build(self):
        args = dict(environment={**CONTEXT, "KVL_DRAFT_ROSTER_PUBLISH_APPROVED": ""},
                    client=Mock())
        with self.assertRaises(ops.OpsError) as caught:
            publish(Path("."), "0"*40, **args)
        self.assertEqual(caught.exception.code, "PUBLISH_NOT_APPROVED")
        args["client"].request.assert_not_called()

    def test_untrusted_pr_cannot_publish_even_with_approval(self):
        args = dict(environment={**CONTEXT, "GITHUB_REF": "refs/heads/feature/example"},
                    client=Mock())
        with self.assertRaises(ops.OpsError) as caught:
            publish(Path("."), "0"*40, **args)
        self.assertEqual(caught.exception.code, "UNTRUSTED_CONTEXT")
        args["client"].request.assert_not_called()

    def test_wrong_workflow_cannot_publish(self):
        args = dict(environment={**CONTEXT, "GITHUB_WORKFLOW_REF": REPO + "/.github/workflows/other.yml@refs/heads/main"},
                    client=Mock())
        with self.assertRaises(ops.OpsError) as caught:
            publish(Path("."), "0"*40, **args)
        self.assertEqual(caught.exception.code, "UNTRUSTED_CONTEXT")
        args["client"].request.assert_not_called()


if __name__ == "__main__":
    unittest.main()

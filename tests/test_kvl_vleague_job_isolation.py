"""Match publication stays independent; player writes still require identities."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_kvl_player_current_value_workflow import named_blocks, condition, permitted, trusted_context

ROOT = Path(__file__).resolve().parents[1]


class VLeagueJobIsolationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = (ROOT / '.github/workflows/vleague-auto-update-v1.yml').read_text()
        cls.jobs = named_blocks(cls.text.split('\njobs:\n', 1)[1], r'^  ([a-z_]+):\s*$')

    def test_failed_player_identity_does_not_block_match_only_publication(self):
        context = trusted_context(**{'inputs.publish': True, 'inputs.match_only': True})
        self.assertTrue(permitted(condition(self.jobs['publish']), context))
        self.assertFalse(permitted(condition(self.jobs['player_master_pilot']), context))
        self.assertIn('tests/vleague-roster-ui.test.cjs', self.jobs['check'])
        self.assertNotIn('tests/vleague-rosters.test.cjs', self.jobs['check'])
        self.assertIn('needs: [lifecycle, check]', self.jobs['publish'])

    def test_match_guards_still_block_invalid_or_unapproved_publication(self):
        base = trusted_context(**{'inputs.publish': True, 'inputs.match_only': True})
        for key, value in [('needs.check.result', 'failure'),
                           ('needs.lifecycle.outputs.allow_update', 'false'),
                           ('vars.KVL_VLEAGUE_UPDATE_APPROVED', 'false'),
                           ('github.ref', 'refs/heads/fix/test'),
                           ('github.event_name', 'pull_request')]:
            with self.subTest(key=key):
                self.assertFalse(permitted(condition(self.jobs['publish']), {**base, key: value}))

    def test_player_identity_failure_blocks_authentication_and_player_write(self):
        pilot = self.jobs['player_master_pilot']
        guard = pilot.index('run: node --test tests/vleague-rosters.test.cjs')
        auth = pilot.index('uses: google-github-actions/auth@v3')
        write = pilot.index('scripts/kvl_player_master_pilot.py --apply')
        self.assertLess(guard, auth)
        self.assertLess(auth, write)
        self.assertNotIn('continue-on-error:', pilot)
        self.assertIn("if: steps.player-gate.outputs.ready == 'true'", pilot[:guard])

    def test_identity_ci_covers_every_master_dependency_and_retains_ui_tests(self):
        ci = (ROOT / '.github/workflows/player-master-pilot-ci.yml').read_text()
        for path in ['data/master/player_master_pro_vleague_2026_27_v1.json',
                     'data/master/player_master_229_v2.json',
                     'data/master/player_master_school_v1.json',
                     'data/national/player_id_links_v1.json',
                     'tests/vleague-roster-ui.test.cjs']:
            self.assertEqual(ci.count("      - '" + path + "'"), 2, path)
        self.assertIn('node --test tests/vleague-rosters.test.cjs tests/vleague-roster-ui.test.cjs', ci)
        self.assertNotIn('continue-on-error:', ci)


if __name__ == '__main__':
    unittest.main()

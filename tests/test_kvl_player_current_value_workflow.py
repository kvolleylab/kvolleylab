"""Exercise manual-mode isolation and authentication boundaries in the workflow.

Only the folded condition/scalar blocks used here are read; no YAML package is
needed in the otherwise standard-library Player MASTER CI environment.
"""
import ast
from itertools import product
from pathlib import Path
import re
import subprocess
import textwrap
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github/workflows/vleague-auto-update-v1.yml'
REPOSITORY = 'kvolleylab/kvolleylab'
NEW_JOB = 'player_current_value_check'
OLD_JOBS = {'lifecycle', 'check', 'publish', 'player_master_pilot',
            'player_master_access_check', 'notify_failure'}


def named_blocks(text, pattern):
    matches = list(re.finditer(pattern, text, re.MULTILINE))
    return {match.group(1): text[match.start():matches[i + 1].start() if i + 1 < len(matches) else len(text)]
            for i, match in enumerate(matches)}


def condition(job):
    match = re.search(r'^    if: >-\n((?:      [^\n]*\n)+)', job, re.MULTILINE)
    if match is None:
        raise AssertionError('Expected an explicit folded job condition')
    return ' '.join(line.strip() for line in match.group(1).splitlines())


def permitted(expression, context):
    """Evaluate the workflow's actual boolean guards for the tested contexts."""
    expression = re.sub(r'\b(?:github|inputs|vars|needs|steps)\.[A-Za-z0-9_.-]+',
                        lambda match: repr(context.get(match.group(0), '')), expression)
    expression = re.sub(r'\btrue\b', 'True', expression)
    expression = re.sub(r'\bfalse\b', 'False', expression)
    expression = expression.replace('&&', ' and ').replace('||', ' or ')
    expression = re.sub(r'!(?!=)', ' not ', expression)

    def visit(node):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.BoolOp):
            values = [bool(visit(value)) for value in node.values]
            return all(values) if isinstance(node.op, ast.And) else any(values)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            return not visit(node.operand)
        if isinstance(node, ast.Compare) and len(node.ops) == 1:
            left, right = visit(node.left), visit(node.comparators[0])
            if isinstance(node.ops[0], ast.Eq):
                return left == right
            if isinstance(node.ops[0], ast.NotEq):
                return left != right
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.args and not node.keywords:
            if node.func.id == 'always':
                return True
            if node.func.id == 'cancelled':
                return context.get('_cancelled', False)
        raise AssertionError('Unsupported workflow expression node: ' + type(node).__name__)

    return bool(visit(ast.parse(expression.strip(), mode='eval').body))


def trusted_context(**changes):
    result = {
        'github.repository': REPOSITORY,
        'github.ref': 'refs/heads/main',
        'github.event_name': 'workflow_dispatch',
        'github.event.schedule': '17 0 * * *',
        'github.event.pull_request.head.repo.full_name': REPOSITORY,
        'inputs.publish': False,
        'inputs.player_master_access_check': False,
        'vars.KVL_VLEAGUE_UPDATE_APPROVED': 'true',
        'needs.lifecycle.result': 'success',
        'needs.lifecycle.outputs.allow_update': 'true',
        'needs.check.result': 'success',
        'needs.publish.result': 'success',
    }
    result.update(changes)
    return result


class CurrentValueWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = WORKFLOW.read_text(encoding='utf-8')
        cls.jobs = named_blocks(cls.text.split('\njobs:\n', 1)[1], r'^  ([a-z_]+):\s*$')
        cls.current = cls.jobs[NEW_JOB]

    def active(self, context):
        return {name for name, job in self.jobs.items() if permitted(condition(job), context)}

    def test_new_input_is_explicit_boolean_and_off_by_default(self):
        input_text = self.text.split('    inputs:\n', 1)[1].split('  pull_request:', 1)[0]
        inputs = named_blocks(input_text, r'^      ([a-z_]+):\s*$')
        self.assertEqual(set(inputs), {'publish', 'player_master_access_check', NEW_JOB})
        self.assertRegex(inputs[NEW_JOB], r'(?m)^        type: boolean$')
        self.assertRegex(inputs[NEW_JOB], r'(?m)^        default: false$')
        self.assertIn('다른 실행 선택보다 우선', inputs[NEW_JOB])

    def test_only_explicit_main_manual_request_can_start_the_new_job(self):
        for repository, ref, event, flag, publish, access in product(
                (REPOSITORY, 'untrusted/fork'), ('refs/heads/main', 'refs/heads/feature'),
                ('workflow_dispatch', 'schedule', 'pull_request', 'push', 'workflow_run'),
                (None, False, True), (False, True), (False, True)):
            context = trusted_context(**{'github.repository': repository, 'github.ref': ref,
                                         'github.event_name': event, 'inputs.publish': publish,
                                         'inputs.player_master_access_check': access})
            if flag is not None:
                context['inputs.player_current_value_check'] = flag
            with self.subTest(repository=repository, ref=ref, event=event, flag=flag,
                              publish=publish, access=access):
                expected = repository == REPOSITORY and ref == 'refs/heads/main' and event == 'workflow_dispatch' and flag is True
                self.assertEqual(permitted(condition(self.current), context), expected)
        self.assertFalse(permitted(condition(self.current), trusted_context(
            **{'inputs.player_current_value_check': True, '_cancelled': True})))

    def test_current_value_mode_suppresses_every_other_job_even_with_publish_and_access_selected(self):
        self.assertEqual(set(self.jobs), OLD_JOBS | {NEW_JOB})
        for publish, access, result in product((False, True), (False, True), ('success', 'failure')):
            context = trusted_context(**{'inputs.player_current_value_check': True,
                                         'inputs.publish': publish, 'inputs.player_master_access_check': access,
                                         'needs.publish.result': result})
            with self.subTest(publish=publish, access=access, result=result):
                self.assertEqual(self.active(context), {NEW_JOB})

    def test_existing_modes_keep_their_behavior_when_new_input_is_absent_or_false(self):
        cases = [
            ({}, {'lifecycle', 'check'}),
            ({'inputs.publish': True}, {'lifecycle', 'check', 'publish', 'player_master_pilot'}),
            ({'inputs.player_master_access_check': True}, {'player_master_access_check'}),
            ({'inputs.player_master_access_check': True, 'inputs.publish': True}, {'player_master_access_check'}),
            ({'github.event_name': 'schedule'}, {'lifecycle', 'check', 'publish', 'player_master_pilot'}),
            ({'github.event_name': 'schedule', 'github.event.schedule': '7,22,37,52 3-14 * * *'},
             {'lifecycle', 'check', 'publish'}),
            ({'github.event_name': 'schedule', 'vars.KVL_VLEAGUE_UPDATE_APPROVED': 'false'},
             {'player_master_pilot'}),
            ({'github.event_name': 'pull_request', 'github.ref': 'refs/pull/1/merge'}, {'lifecycle', 'check'}),
            ({'inputs.publish': True, 'needs.publish.result': 'failure'},
             {'lifecycle', 'check', 'publish', 'player_master_pilot', 'notify_failure'}),
        ]
        for changes, expected in cases:
            for supplied in (False, True):
                context = trusted_context(**changes)
                if supplied:
                    context['inputs.player_current_value_check'] = False
                with self.subTest(changes=changes, supplied=supplied):
                    self.assertEqual(self.active(context), expected)

    def test_new_job_has_only_required_permissions_and_no_dependency_on_match_publisher(self):
        match = re.search(r'^    permissions:\n((?:      [^\n]+\n)+)', self.current, re.MULTILINE)
        permissions = dict(line.strip().split(': ', 1) for line in match.group(1).splitlines())
        self.assertEqual(permissions, {'contents': 'read', 'id-token': 'write'})
        self.assertNotRegex(self.current, r'(?m)^    needs:')
        self.assertIn('persist-credentials: false', self.current)
        self.assertNotIn('GH_TOKEN:', self.current)
        self.assertNotRegex(self.current, r'\bgit\s+(?:add|commit|push|config)\b')
        self.assertNotRegex(self.current, r'(?i)uses:.*(?:deploy|pages)')

    def test_fresh_sources_and_latest_main_are_checked_before_authentication_and_recording(self):
        preflight = self.current.index('--check-ready')
        sources = self.current.index('--collect-evidence')
        main_check = self.current.index("['git', 'ls-remote', 'origin', 'refs/heads/main']")
        authentication = self.current.index('uses: google-github-actions/auth@v3')
        record = self.current.index('--record')
        self.assertLess(preflight, sources)
        self.assertLess(sources, main_check)
        self.assertLess(main_check, authentication)
        self.assertLess(authentication, record)
        steps = re.split(r'(?m)^      - ', self.current)[1:]
        gated = [step for step in steps if any(marker in step for marker in (
            '--collect-evidence', "['git', 'ls-remote'", 'uses: google-github-actions/auth@v3', '--record'))]
        self.assertEqual(len(gated), 4)
        for step in gated:
            self.assertIn("if: steps.current-gate.outputs.ready == 'true'", step)
            self.assertNotIn('if: always()', step)
            self.assertNotIn('continue-on-error: true', step)
        self.assertIn('workload_identity_provider: ${{ vars.KVL_GOOGLE_WORKLOAD_IDENTITY_PROVIDER }}', self.current)
        self.assertIn('service_account: ${{ vars.KVL_GOOGLE_SERVICE_ACCOUNT }}', self.current)
        self.assertIn('access_token_scopes: https://www.googleapis.com/auth/spreadsheets\n', self.current)
        self.assertIn('create_credentials_file: false', self.current)
        self.assertIn('export_environment_variables: false', self.current)
        token_steps = [step for step in steps if 'KVL_GOOGLE_ACCESS_TOKEN:' in step]
        self.assertEqual(len(token_steps), 1)
        self.assertIn('--record', token_steps[0])

    def test_latest_main_guard_blocks_changed_or_unreadable_main_with_sanitized_errors(self):
        match = re.search(r"python -B - <<'PY'\n(.*?)^          PY$", self.current, re.MULTILINE | re.DOTALL)
        program = textwrap.dedent(match.group(1))
        head = 'a' * 40
        with patch('subprocess.check_output', side_effect=[head + '\n', head + '\trefs/heads/main\n']) as reader:
            exec(compile(program, '<workflow-main-guard>', 'exec'), {})
            self.assertEqual(reader.call_count, 2)
        for responses, expected in (
            ([head + '\n', 'b' * 40 + '\trefs/heads/main\n'], 'main changed before authentication'),
            ([head + '\n', ''], 'main changed before authentication'),
            (subprocess.CalledProcessError(1, ['secret-command'], stderr='private-response'), 'main could not be verified'),
            (subprocess.TimeoutExpired(['secret-command'], 30, stderr='private-response'), 'main could not be verified'),
        ):
            with self.subTest(expected=expected), patch('subprocess.check_output', side_effect=responses):
                with self.assertRaises(SystemExit) as result:
                    exec(compile(program, '<workflow-main-guard>', 'exec'), {})
                self.assertIn(expected, str(result.exception))
                self.assertNotIn('secret-command', str(result.exception))
                self.assertNotIn('private-response', str(result.exception))

    def test_only_sanitized_report_is_uploaded_and_existing_read_diagnostic_stays_read_only(self):
        steps = re.split(r'(?m)^      - ', self.current)[1:]
        uploads = [step for step in steps if 'uses: actions/upload-artifact@v4' in step]
        self.assertEqual(len(uploads), 1)
        self.assertIn('path: ${{ runner.temp }}/player-current-value/report.json\n', uploads[0])
        self.assertNotIn('evidence.json', uploads[0])
        self.assertNotIn('path: |', uploads[0])
        self.assertNotIn('*', uploads[0])
        self.assertIn('retention-days: 7', uploads[0])
        self.assertIn('access_token_scopes: https://www.googleapis.com/auth/spreadsheets.readonly',
                      self.jobs['player_master_access_check'])
        self.assertIn('scripts/kvl_player_master_pilot.py --apply', self.jobs['player_master_pilot'])
        self.assertNotIn('scripts/kvl_player_master_pilot.py', self.current)

    def test_existing_schedules_and_concurrency_are_preserved_without_new_automatic_trigger(self):
        events = self.text.split('\non:\n', 1)[1].split('\npermissions:\n', 1)[0]
        self.assertEqual(set(re.findall(r'^  ([a-z_]+):', events, re.MULTILINE)),
                         {'workflow_dispatch', 'pull_request', 'schedule'})
        self.assertEqual(re.findall(r"- cron: '([^']+)'", events),
                         ['17 0 * * *', '7,22,37,52 3-14 * * *'])
        self.assertIn('group: kvl-vleague-${{ github.event.pull_request.number || github.ref }}', self.text)
        self.assertIn('cancel-in-progress: false', self.text)


if __name__ == '__main__':
    unittest.main()

"""Synthetic acceptance cases; no real MASTER edits or network calls."""
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from scripts.quality_audit.core import assessed, check, finding, reconcile, public_finding, stable_id
from scripts.quality_audit import checks
from scripts.quality_audit.sources import official_checks, official_row, master_rows, drive_checks, MASTER_COLUMNS
from scripts.quality_audit.issues import decode_issue, issue_body, plan, publish_allowed, publish, add_pipeline_status

TIME = '2026-10-30T09:00:00+09:00'


def sample():
    config = {'schemaVersion': 2, 'slug': 'test', 'competition': {
        'competitionId': 'COMP', 'season': '2026', 'gender': 'men'}}
    game = {'id': 'M1', 'date': '2026-10-20', 'time': '14:00', 'stage': '조별리그', 'pool': 'A',
            'home': {'code': 'H'}, 'away': {'code': 'A'}, 'status': 'final',
            'score': {'home': 3, 'away': 0, 'sets': [{'home': 25, 'away': 20}] * 3}}
    data = {'matches': [game], 'participants': [{'code': 'H', 'name': 'Home', 'group': 'A'},
                                              {'code': 'A', 'name': 'Away', 'group': 'A'}]}
    return config, data


class MatchRules(unittest.TestCase):
    def test_normal_pass(self):
        c, d = sample()
        self.assertEqual(checks.matches(c, d, 'fixture')['outcome'], 'PASS')

    def test_ended_still_scheduled(self):
        local = [{'id': 'm', 'status': 'scheduled'}]
        result = checks.compare_matches(local, [{'id': 'm', 'status': 'final'}], 'official')
        self.assertEqual(result['findings'][0]['rule'], 'ENDED_STILL_SCHEDULED')

    def test_expired_date_does_not_infer_final(self):
        c, d = sample(); d['matches'][0].pop('score'); d['matches'][0]['status'] = 'scheduled'
        self.assertEqual(checks.matches(c, d, 'fixture')['outcome'], 'PASS')

    def test_score_mismatch(self):
        c, d = sample(); d['matches'][0]['score']['sets'][2] = {'home': 20, 'away': 25}
        self.assertIn('SET_TOTAL_MISMATCH', [f['rule'] for f in checks.matches(c, d, 'fixture')['findings']])

    def test_missing_set_points(self):
        c, d = sample(); d['matches'][0]['score']['sets'] = []
        self.assertEqual(checks.score_errors(d['matches'][0]['score']), ['MISSING_SET_POINTS'])

    def test_invalid_final_tie(self):
        self.assertEqual(checks.score_errors({'home': 3, 'away': 3}), ['INVALID_FINAL_SCORE'])

    def test_deuce_and_fifth_set(self):
        score = dict(home=3, away=2, sets=[dict(home=37, away=35), dict(home=20, away=25),
                    dict(home=25, away=20), dict(home=23, away=25), dict(home=17, away=15)])
        self.assertEqual(checks.score_errors(score), [])
        score['sets'][-1] = dict(home=17, away=14)
        self.assertEqual(checks.score_errors(score), ['INVALID_SET_POINTS'])

    def test_duplicate_match_and_team(self):
        c, d = sample(); d['matches'] *= 2
        r = checks.matches(c, d, 'fixture')
        self.assertIn('DUPLICATE_MATCH_ID', [f['rule'] for f in r['findings']])

    def test_wrong_pool_and_team_link(self):
        c, d = sample(); d['matches'][0]['away']['code'] = 'UNKNOWN'
        rules = {f['rule'] for f in checks.matches(c, d, 'fixture')['findings']}
        self.assertTrue({'POOL_LINK', 'TEAM_LINK'} <= rules)

    def test_timezone_cross_midnight(self):
        c, d = sample(); m = d['matches'][0]
        m.update(date='2026-10-21', time='00:30', start_at='2026-10-20T15:30:00Z')
        self.assertEqual(checks.matches(c, d, 'fixture')['outcome'], 'PASS')
        m['start_at'] = '2026-10-21T00:30:00Z'
        self.assertIn('KST_MISMATCH', [f['rule'] for f in checks.matches(c, d, 'fixture')['findings']])

    def test_official_postponement_is_not_a_final(self):
        c = checks.compare_matches([dict(id='m', status='scheduled')], [dict(id='m', status='postponed')], 'official')
        self.assertEqual(c['findings'][0]['expected'], 'postponed')
        self.assertEqual(c['findings'][0]['rule'], 'SOURCE_STATUS')

    def test_partial_feed_does_not_claim_missing_records(self):
        self.assertEqual(checks.compare_matches([{'id': 'm'}], [], 'source')['outcome'], 'NOT VERIFIED')
        self.assertFalse(checks.compare_matches([{'id': 'm'}], [], 'source')['findings'])

    def test_full_master_missing_is_distinct(self):
        c = checks.compare_matches([{'id': 'm'}], [], 'master', complete=True)
        self.assertEqual(c['findings'][0]['rule'], 'SOURCE_MATCH_MISSING')

    def test_duplicate_source_id_stops_compare(self):
        c = checks.compare_matches([{'id': 'm'}], [{'id': 'm'}, {'id': 'm'}], 'source')
        self.assertEqual(c['outcome'], 'NOT VERIFIED')

    def test_standings_logic(self):
        c, d = sample(); d['standings'] = {'pools': [{'id': 'A', 'rows': [
            {'team': {'code': 'H'}, 'wins': 0, 'losses': 0, 'points': 0},
            {'team': {'code': 'A'}, 'wins': 0, 'losses': 1, 'points': 0}]}]}
        self.assertEqual(len(checks.standings(c, d, 'fixture')['findings']), 2)

    def test_unknown_state_is_not_a_scheduled_game(self):
        c, d = sample(); d['matches'][0]['status'] = 'mystery'
        self.assertIn('UNKNOWN_MATCH_STATE', {f['rule'] for f in checks.matches(c, d, 'fixture')['findings']})

    def test_cross_competition_duplicate_id(self):
        c, d = sample(); c['slug'] = 'kovo-cup-men-2026'
        other = deepcopy(c); other['slug'] = 'kovo-cup-women-2026'
        other['competition'].update(competitionId='OTHER', gender='women')
        r = checks.competition_links([(c, d), (other, d)])
        self.assertEqual(r['findings'][0]['rule'], 'CROSS_COMPETITION_MATCH_ID')


class PlayerRules(unittest.TestCase):
    def test_duplicate_player_id(self):
        c, _ = checks.player_rows([{'playerId': 'P1'}, {'playerId': 'P1'}], 'players', 'fixture')
        self.assertEqual(c['findings'][0]['rule'], 'DUPLICATE_PLAYER_ID')

    def test_same_name_never_merges(self):
        c, ids = checks.player_rows([{'playerId': 'P1', 'name': '같은이름'},
                                    {'playerId': 'P2', 'name': '같은이름'}], 'players', 'fixture')
        self.assertEqual(c['outcome'], 'PASS'); self.assertEqual(len(ids), 2)

    def test_roster_unknown_player(self):
        c, d = sample(); roster = {'H': {'sourceId': 'S', 'players': [{'playerId': 'missing'}]}}
        r = checks.rosters(c, d, roster, {}, 'fixture')
        self.assertEqual(r['findings'][0]['rule'], 'PLAYER_LINK_MISSING')

    def test_pending_player_link_preserved(self):
        c, d = sample(); roster = {'H': {'players': [{'name': '보류', 'playerId': None}]}}
        self.assertEqual(checks.rosters(c, d, roster, {}, 'fixture')['outcome'], 'PASS')

    def test_dob_conflict(self):
        c, d = sample(); roster = {'H': {'sourceId': 'S', 'players': [{'playerId': 'P', 'dob': '2000-01-02'}]}}
        r = checks.rosters(c, d, roster, {'P': {'birthDate': '2000-01-01'}}, 'fixture')
        self.assertEqual(r['findings'][0]['rule'], 'PLAYER_DOB_CONFLICT')


class Lifecycle(unittest.TestCase):
    def setUp(self):
        self.f = finding('SCORE', 'matches', 'M1', severity='P2', actual=1, expected=2)

    def call(self, findings=(), previous=None, outcome=None, covered=('M1',), run='1'):
        c = assessed('matches', findings, covered=covered)
        if outcome:
            c = check('matches', outcome, covered=covered)
        return reconcile([c], previous, at=TIME, commit='test', run_id=run)

    def test_stable_id_excludes_value_and_severity(self):
        other = finding('SCORE', 'matches', 'M1', severity='P0', actual=99)
        self.assertEqual(self.f['id'], other['id'])

    def test_repeat_no_notification_and_first_date_preserved(self):
        a, ev = self.call([self.f]); b, ev2 = self.call([self.f], a, run='2')
        self.assertEqual(ev[0]['event'], 'NEW_CONFIRMED'); self.assertEqual(ev2, [])
        self.assertEqual(b['findings'][self.f['id']]['first_seen'], TIME)

    def test_escalation(self):
        a, _ = self.call([self.f]); self.f['severity'] = 'P0'
        _, ev = self.call([self.f], a, run='2'); self.assertEqual(ev[0]['event'], 'ESCALATED')

    def test_resolved_and_reopened(self):
        a, _ = self.call([self.f]); b, ev = self.call(previous=a, run='2')
        self.assertEqual(b['findings'][self.f['id']]['verification'], 'RESOLVED'); self.assertEqual(ev, [])
        _, ev = self.call([self.f], b, run='3'); self.assertEqual(ev[0]['event'], 'REOPENED')

    def test_not_verified_not_run_or_missing_coverage_cannot_resolve(self):
        a, _ = self.call([self.f])
        for outcome in ('NOT VERIFIED', 'NOT RUN'):
            b, _ = self.call(previous=a, outcome=outcome, run='2')
            self.assertEqual(b['findings'][self.f['id']]['verification'], 'CONFIRMED')
        b, _ = self.call(previous=a, covered=(), run='2')
        self.assertEqual(b['findings'][self.f['id']]['verification'], 'CONFIRMED')

    def test_transient_access_warning_after_three_distinct_runs(self):
        c = check('drive:cup', 'NOT VERIFIED', operational=True)
        state = None
        for n in range(1, 4):
            state, ev = reconcile([c], state, at=TIME, run_id=str(n))
            self.assertEqual(len(ev), int(n == 3))
        state, ev = reconcile([c], state, at=TIME, run_id='3')
        self.assertFalse(ev); self.assertEqual(state['operations']['drive:cup']['consecutive_failures'], 3)
        state, ev = reconcile([check('drive:cup', 'PASS')], state, at=TIME, run_id='4')
        self.assertEqual(next(iter(state['findings'].values()))['verification'], 'RESOLVED')

    def test_unimplemented_check_does_not_become_an_access_warning(self):
        state = None
        for n in range(5):
            state, ev = reconcile([check('future', 'NOT VERIFIED')], state, at=TIME, run_id=str(n))
        self.assertFalse(ev); self.assertFalse(state['operations'])

    def test_private_finding_is_redacted_and_can_resolve(self):
        secret = 'DO-NOT-EXPOSE'
        f = finding('NONPUBLIC_DATA', 'security:json', secret, sensitive=True, actual=secret, path=secret,
                    source_url='https://private/' + secret, related={'player': secret})
        state, _ = reconcile([assessed('security:json', [f], covered=[secret])], at=TIME)
        safe = public_finding(state['findings'][f['id']])
        self.assertNotIn(secret, json.dumps(safe))
        self.assertEqual(public_finding(safe), safe)
        state['findings'][f['id']] = safe
        result, _ = reconcile([check('security:json', 'PASS', covered=[secret])], state, at=TIME)
        self.assertEqual(result['findings'][f['id']]['verification'], 'RESOLVED')


class SourceAndSecurity(unittest.TestCase):
    def test_access_failure_is_not_data_failure(self):
        def fail(_):
            raise ConnectionError('secret-cookie')
        results = official_checks([], fetch=fail)
        self.assertTrue(all(c['outcome'] == 'NOT VERIFIED' for c in results))
        self.assertNotIn('secret-cookie', json.dumps(results))

    def test_missing_drive_auth(self):
        from unittest.mock import patch
        with patch.dict('os.environ', {}, clear=True):
            r = drive_checks([])
        self.assertEqual([c['outcome'] for c in r], ['NOT VERIFIED'] * 2)

    def test_bad_drive_secret_is_sanitized_and_not_a_data_failure(self):
        from unittest.mock import patch
        with patch.dict('os.environ', {'KVL_AUDIT_DRIVE_MAP': 'secret-invalid-json'}):
            r = drive_checks([])
        self.assertEqual([c['outcome'] for c in r], ['NOT VERIFIED'] * 2)
        self.assertNotIn('secret-invalid-json', json.dumps(r))

    def test_master_header_and_scores(self):
        header = MASTER_COLUMNS
        r = ['M1', 'kovo-cup-2026', '남자', 'A', '조별리그', '2026-10-20', '', '14:00',
             'Home', 'Away', '', '', '종료', '3', '0', '25-20 25-20 25-20']
        self.assertEqual(master_rows([header, r])[0]['score']['home'], 3)
        with self.assertRaises(ValueError): master_rows([['Wrong']])

    def test_reordered_master_columns_are_not_a_confirmed_match_error(self):
        header = list(MASTER_COLUMNS); header[5], header[6] = header[6], header[5]
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'cup-master.json').write_text(json.dumps({'values': [header]}))
            result = drive_checks([], tmp)[0]
        self.assertEqual(result['outcome'], 'NOT VERIFIED')
        self.assertEqual(result['findings'], [])

    def test_publication_gate_fail_closed(self):
        self.assertFalse(checks.publication_records([{'player_id': 'P'}]))
        self.assertFalse(checks.publication_records([dict(access_level='PUBLIC', record_status='DRAFT', source_id='S')]))
        self.assertFalse(checks.publication_records([dict(access_level='PRIVATE', record_status='VERIFIED', source_id='S')]))
        self.assertTrue(checks.publication_records([dict(access_level='PUBLIC', record_status='VERIFIED', source_id='S')]))

    def test_nested_private_fields_never_output_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'x.json').write_text(json.dumps({'players': [{'private_notes': 'SECRET'}]}))
            result = checks.security(tmp, ['x.json'])[0]
        self.assertEqual(result['findings'][0]['severity'], 'P0')
        self.assertNotIn('SECRET', json.dumps(public_finding(result['findings'][0])))

    def test_approved_legacy_snapshot_provenance_is_not_review_status(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'x.json').write_text(json.dumps({'playerId': 'P1', 'recordStatus': 'reviewed-notice-snapshot'}))
            results = checks.security(tmp, ['x.json'])
        self.assertEqual(results[0]['outcome'], 'PASS')
        self.assertEqual(results[1]['outcome'], 'NOT VERIFIED')

    def test_provider_numbers_are_not_local_league_numbers(self):
        raw = dict(match='001', season={'value': '023', 'name': '2026~2027'},
                   league={'value': '201', 'name': '정규리그'}, gender='FEMALE', number=2, round=1,
                   gameDate='2026-10-31', startTime='16:00', currentSet=0, endTime=None,
                   homeTeam={'code': '1', 'name': 'GS칼텍스', 'score': 0},
                   awayTeam={'code': '2', 'name': '한국도로공사', 'score': 0})
        row = official_row(raw, 'main', mapping={'023:001:FEMALE:2': 'VL2627-W-001'})
        self.assertEqual(row['id'], 'VL2627-W-001')
        self.assertIsNone(official_row(raw, 'main', mapping={}))

    def test_ended_actual_start_is_not_scheduled_time(self):
        raw = dict(match='002', season={'value': '824', 'name': 'Cup'},
                   league={'value': '214', 'name': '결승'}, gender='FEMALE', number=12,
                   gameDate='2026-10-18', startTime='13:34', endTime='15:00',
                   homeTeam={'code': '1', 'name': 'Home', 'score': 3},
                   awayTeam={'code': '2', 'name': 'Away', 'score': 1})
        self.assertNotIn('time', official_row(raw, 'ended'))

    def test_json_parse_finding_resolves_after_successful_recheck(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp, 'test.json'); p.write_text('{')
            a, _ = reconcile(checks.security(tmp, ['test.json']), at=TIME)
            p.write_text('{}')
            b, _ = reconcile(checks.security(tmp, ['test.json']), a, at=TIME)
        self.assertEqual(next(iter(b['findings'].values()))['verification'], 'RESOLVED')


class ExportAndWorkflow(unittest.TestCase):
    def test_changed_export_requires_matching_reviewed_digest(self):
        from hashlib import sha256
        from scripts.quality_audit.export_gate import validate_changed
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'data').mkdir(); f = Path(tmp, 'data', 'test.json'); f.write_text('{"matches": []}')
            e = dict(access_level='PUBLIC', record_status='VERIFIED', source_ids=['OFFICIAL'],
                     verified_at=TIME, sha256=sha256(f.read_bytes()).hexdigest())
            self.assertEqual(validate_changed(tmp, ['data/test.json'], {}), ['data/test.json'])
            self.assertEqual(validate_changed(tmp, ['data/test.json'], {'data/test.json': e}), [])
            f.write_text('{}')
            self.assertEqual(validate_changed(tmp, ['data/test.json'], {'data/test.json': e}), ['data/test.json'])

    def test_manifest_cannot_override_private_or_draft_nested_data(self):
        from hashlib import sha256
        from scripts.quality_audit.export_gate import validate_changed
        for payload in ({'private_notes': 'SECRET'}, {'record_status': 'DRAFT'}, {'access_level': 'PREMIUM'}):
            with tempfile.TemporaryDirectory() as tmp:
                f = Path(tmp, 'players.json'); f.write_text(json.dumps(payload))
                e = dict(access_level='PUBLIC', record_status='VERIFIED', source_ids=['S'],
                         verified_at=TIME, sha256=sha256(f.read_bytes()).hexdigest())
                self.assertEqual(validate_changed(tmp, ['players.json'], {'players.json': e}), ['players.json'])

    def test_approved_daily_workflow_separates_write_token(self):
        import yaml
        p = Path(__file__).resolve().parents[1] / '.github/workflows/kvl-quality-audit-v1.yml'
        wf = yaml.safe_load(p.read_text()); events = wf.get('on', wf.get(True))
        self.assertEqual(set(events), {'workflow_dispatch', 'pull_request', 'push', 'schedule'})
        self.assertEqual(events['schedule'], [{'cron': '0 0 * * *'}])
        self.assertEqual(events['push']['branches'], ['main'])
        self.assertEqual(events['push']['paths'], ['.github/workflows/kvl-quality-audit-v1.yml',
                                                'scripts/quality_audit/**', 'tests/test_quality_audit.py'])
        self.assertEqual(wf['permissions'], {'contents': 'read'})
        self.assertEqual(wf['jobs']['audit']['permissions']['contents'], 'read')
        self.assertNotIn('write', wf['jobs']['audit']['permissions'].values())
        self.assertEqual(wf['jobs']['notify']['permissions'], {'contents': 'read', 'issues': 'write'})
        self.assertIn('KVL_QUALITY_AUDIT_APPROVED', wf['jobs']['notify']['if'])
        self.assertIn('refs/heads/main', wf['jobs']['notify']['if'])

    def test_runtime_failure_has_report_without_exception_message(self):
        from scripts.quality_audit.runner import failure_report
        report, state = failure_report('ValueError', run_id='test')
        self.assertEqual(report['summary'], {'NOT VERIFIED': 1})
        self.assertEqual(report['findings'][0]['rule'], 'AUDIT_RUNTIME')
        self.assertFalse(report['runtime']['chatgpt_subscription_required'])


class Issues(unittest.TestCase):
    def setUp(self):
        state, _ = reconcile([assessed('scope', [finding('RULE', 'scope', 'P')], covered=['P'])], at=TIME)
        self.f = next(iter(state['findings'].values()))
        self.existing = {'number': 10, 'state': 'open', 'body': issue_body(self.f)}

    def test_new_confirmed_creates_one_issue(self):
        self.assertEqual(plan({'findings': [self.f]}, [])[0]['action'], 'create')

    def test_repeat_only_quiet_update_even_without_cache(self):
        ops = plan({'findings': [self.f]}, [self.existing])
        self.assertEqual(ops[0]['action'], 'update'); self.assertIsNone(ops[0]['event'])

    def test_private_and_suspected_do_not_create(self):
        self.f['visibility'] = 'PRIVATE'; self.assertFalse(plan({'findings': [self.f]}, []))
        self.f['visibility'] = 'PUBLIC'; self.f['verification'] = 'SUSPECTED'
        self.assertFalse(plan({'findings': [self.f]}, []))

    def test_missing_current_findings_does_not_close(self):
        self.assertFalse(plan({'findings': []}, [self.existing]))

    def test_issue_ledger_roundtrip(self):
        self.assertEqual(decode_issue(self.existing), self.f)

    def test_ambiguous_ledger_aborts(self):
        with self.assertRaises(ValueError): plan({'findings': [self.f]}, [self.existing, self.existing])

    def test_publishing_never_on_pr_or_feature_branch(self):
        for event in ('workflow_dispatch', 'schedule', 'push', 'pull_request', 'pull_request_target', 'workflow_run'):
            for ref in ('refs/heads/main', 'refs/heads/feature/test', 'refs/pull/201/merge'):
                for approved in ('true', 'false', '', 'invalid'):
                    env = dict(KVL_AUDIT_APPROVED=approved, GITHUB_REF=ref, GITHUB_EVENT_NAME=event)
                    expected = (event in {'workflow_dispatch', 'schedule', 'push'}
                                and ref == 'refs/heads/main' and approved == 'true')
                    with self.subTest(event=event, ref=ref, approved=approved):
                        self.assertEqual(publish_allowed(env), expected)
        self.assertFalse(publish_allowed({}))

    def test_fake_client_updates_do_not_comment(self):
        class Fake:
            def __init__(self): self.calls = []
            def request(self, method, path, payload=None): self.calls.append((method, path)); return []
        fake = Fake(); publish(plan({'findings': [self.f]}, [self.existing]), fake)
        self.assertEqual(fake.calls, [('PATCH', '/issues/10')])

    def test_pipeline_failure_repeats_quietly_and_recovers(self):
        report = add_pipeline_status({'findings': []}, [], 'failure', run_id='1')
        issue = dict(number=11, state='open', body=issue_body(report['findings'][0]))
        same = add_pipeline_status({'findings': []}, [issue], 'failure', run_id='2')
        self.assertIsNone(plan(same, [issue])[0]['event'])
        recovered = add_pipeline_status({'findings': []}, [issue], 'success', run_id='3')
        self.assertEqual(plan(recovered, [issue])[0]['action'], 'resolve')

    def test_private_data_gate_is_not_published_as_execution_failure(self):
        self.f['visibility'] = 'PRIVATE'; self.f['severity'] = 'P0'
        report = {'findings': [public_finding(self.f)], 'gate': {'outcome': 'FAIL'},
                  'checks': [{'id': 'audit:execution', 'outcome': 'PASS'}]}
        add_pipeline_status(report, [], 'failure', run_id='1')
        self.assertEqual(plan(report, []), [])

    def test_escalation_retry_after_comment_before_patch_is_idempotent(self):
        class Fake:
            def __init__(self): self.comments = []; self.calls = []
            def request(self, method, path, payload=None):
                self.calls.append((method, path))
                if method == 'GET': return self.comments
                if method == 'POST': self.comments.append(payload)
        fake = Fake(); self.f['severity'] = 'P0'
        publish(plan({'findings': [self.f]}, [self.existing]), fake)
        self.f['occurrences'] += 1
        publish(plan({'findings': [self.f]}, [self.existing]), fake)
        self.assertEqual(len(fake.comments), 1)


if __name__ == '__main__':
    unittest.main()

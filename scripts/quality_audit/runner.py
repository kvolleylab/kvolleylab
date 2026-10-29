"""Orchestrate independent checks with explicit coverage; keep evidence outside the site."""
import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

from . import checks as rules
from .core import check, assessed, finding, now_kst, reconcile, public_finding, render_markdown
from .sources import official_checks, drive_checks, deployed_checks

CORE_TESTS = [
    'competition-v2-config.test.cjs', 'competition-v2-data-contract.test.cjs',
    'competition-v2-production-starter.test.cjs', 'competition-calendar-gender.test.cjs',
    'kovo-cup-production-template-20261027.test.cjs', 'competition-v2-pro-cup-pool-columns.test.cjs',
    'kovo-cup-desktop-matchup-alignment.test.cjs', 'kovo-cup-rosters.test.cjs',
    'vleague-rosters.test.cjs', 'vleague-match-summary.test.cjs', 'vleague-postseason.test.cjs',
    'domestic-home-v2.test.cjs', 'draft-applicants.test.mjs', 'draft-lottery.test.mjs',
    'draft-profile-routing.test.mjs', 'player-reviewed-identities.test.mjs',
    'player-integration.test.mjs', 'player-profile-coverage.test.mjs',
]


def execute(command, root, timeout=90):
    return subprocess.run(command, cwd=root, env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
                          text=True, capture_output=True, timeout=timeout)


def implementation_digest(root):
    files = list((root / 'scripts/quality_audit').glob('*.py'))
    files += list((root / 'scripts/quality_audit').glob('*.cjs'))
    files += list((root / 'scripts/quality_audit').glob('*.json'))
    files += [root / 'scripts/quality_audit/requirements.txt', root / 'tests/test_quality_audit.py',
              root / '.github/workflows/kvl-quality-audit-v1.yml']
    digest = hashlib.sha256()
    for file in sorted(files):
        digest.update(file.relative_to(root).as_posix().encode() + b'\0' + file.read_bytes() + b'\0')
    return digest.hexdigest()


def inventory(root):
    import yaml
    rows, findings, covered = [], [], []
    for p in sorted((root / '.github/workflows').glob('*.y*ml')):
        rel, scope = p.relative_to(root).as_posix(), 'workflow-safety'
        covered.append(rel)
        try:
            data = yaml.safe_load(p.read_text())
            triggers = data.get('on', data.get(True, {})) or {}
            perms = data.get('permissions', {})
            row = dict(path=rel, name=data.get('name', p.name), events=list(triggers),
                       schedule=triggers.get('schedule', []), permissions=perms,
                       commands=[s['run'].splitlines()[0][:150] for j in data.get('jobs', {}).values()
                                 for s in j.get('steps', []) if 'run' in s])
            rows.append(row)
            if perms == 'write-all' or isinstance(perms, dict) and perms.get('contents') == 'write':
                # A writer may be intentional. Do not label it a confirmed security breach.
                findings.append(finding('WORKFLOW_WRITE_REVIEW', scope, rel, path=rel,
                                        severity='P3', status='SUSPECTED', actual='contents write',
                                        expected='review necessity and branch restrictions'))
        except yaml.YAMLError as exc:
            line = getattr(getattr(exc, 'problem_mark', None), 'line', -1) + 1
            rows.append(dict(path=rel, syntax='FAIL', line=line))
            findings.append(finding('WORKFLOW_YAML', scope, rel, path=rel, severity='P2',
                                    actual=f'YAML parse failure at line {line}', expected='valid YAML'))
    return rows, assessed('workflow-safety', findings, count=len(rows), covered=covered,
                           note='기존 권한/스케줄은 변경하지 않음. 쓰기 권한은 용도 검수 후보')


def regression(root):
    results = []
    # Some existing tests emit validation JSON. Run those unchanged in a disposable copy.
    with tempfile.TemporaryDirectory(prefix='kvl-audit-tests-') as temp:
        checkout = Path(temp) / 'repo'
        shutil.copytree(root, checkout, ignore=shutil.ignore_patterns('__pycache__', 'node_modules', '.audit', 'test-results'))
        # A git worktree pointer can be read by tests needing historical baseline blobs.
        for test in CORE_TESTS:
            scope = 'regression:' + test
            try:
                run = execute(['node', '--experimental-vm-modules', '--test', '--test-reporter=tap', 'tests/' + test], checkout)
                if 'MODULE_NOT_FOUND' in run.stdout + run.stderr or 'fatal: path' in run.stdout + run.stderr:
                    results.append(check(scope, 'NOT VERIFIED', note='의존성 또는 과거 기준 commit 미접근; 회귀 실패와 구분', operational=True))
                    continue
                n = re.search(r'^# tests (\d+)', run.stdout, re.M)
                f = [] if run.returncode == 0 else [finding('REGRESSION_FAILED', scope, test,
                    path='tests/' + test, severity='P2', actual=run.returncode, expected=0)]
                c = assessed(scope, f, count=int(n[1]) if n else 1, covered=[test],
                             note='기존 테스트 그대로 호출; 임시 복사본만 쓰기 허용')
                c['evidence'] = {'exit_code': run.returncode,
                                 'stdout_sha256': hashlib.sha256(run.stdout.encode()).hexdigest()}
                results.append(c)
            except (OSError, subprocess.TimeoutExpired) as exc:
                results.append(check(scope, 'NOT VERIFIED', note='실행 환경 실패: ' + type(exc).__name__, operational=True))
        try:
            run = execute([sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py'], checkout)
            n = re.search(r'Ran (\d+) tests', run.stderr)
            f = [] if run.returncode == 0 else [finding('REGRESSION_FAILED', 'regression:python', 'python', severity='P2')]
            c = assessed('regression:python', f, count=int(n[1]) if n else 0, covered=['python'],
                         note='기존 수집기 및 신규 audit 합성 테스트')
            c['evidence'] = {'exit_code': run.returncode,
                             'stdout_sha256': hashlib.sha256((run.stdout + run.stderr).encode()).hexdigest()}
            results.append(c)
        except (OSError, subprocess.TimeoutExpired) as exc:
            results.append(check('regression:python', 'NOT VERIFIED', note=type(exc).__name__))
    return results


def notices(root):
    """Read the existing projection/review queue; no second collector or name-only merge."""
    base = 'data/kovo/official-notices/2026-27/'
    queue = rules.read(root, base + 'roster_review_queue.json')
    reviewed = rules.read(root, 'data/sources/v-league-2026-27/roster-audit.json')
    resolved = {str(x.get('noticeId')) for x in reviewed.get('supplementalChanges', [])}
    covered, findings = [], []
    for event in queue.get('blocked_events', []):
        eid = str(event['event_id']); covered.append(eid)
        if str(event.get('notice_id')) in resolved:
            continue  # Already reviewed later; stale queue is not a new player error.
        findings.append(finding('NOTICE_REVIEW_CANDIDATE', 'notices', eid, severity='P3',
                                status='SUSPECTED', path=base + 'roster_review_queue.json',
                                source_url=event.get('source_url'),
                                actual='unresolved candidate', expected='explicit identity and effective-date review'))
    c = assessed('notices', findings, count=len(covered), covered=covered,
                 note='기존 공시 검수 큐 재사용; 후속 검수로 해결된 공시 제외. 현재 등록 자동 확정 아님')
    return c


def run(root, *, live=False, core_tests=False, ui=False, master_input=None, previous=None, run_id=None):
    root = Path(root).resolve()
    commit = execute(['git', 'rev-parse', 'HEAD'], root).stdout.strip()
    checked = now_kst(); checks = []; all_local = []; loaded = []
    for slug in rules.SLUGS:
        base = f'data/competitions/{slug}/'
        try:
            config, data = rules.read(root, base + 'config.json'), rules.read(root, base + 'data.json')
            checks.extend([rules.matches(config, data, base + 'data.json'), rules.standings(config, data, base + 'data.json')])
            loaded.append((config, data, rules.read(root, base + 'rosters.json'), base + 'rosters.json'))
            all_local += rules.normalized_local(config, data)
        except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
            f = finding('INPUT_CONTRACT', 'matches:' + slug, slug, path=base, severity='P1', actual=type(exc).__name__)
            checks.append(check('matches:' + slug, 'FAIL', findings=[f], complete=False, note='입력 스키마 오류; 이후 비교 보류'))
    if len(loaded) == len(rules.SLUGS):
        checks.append(rules.competition_links(loaded))
    else:
        checks.append(check('competition-links', 'NOT VERIFIED', note='입력 오류가 있는 대회는 상호 연결 확정 보류'))
    try:
        catalog = execute(['node', 'scripts/quality_audit/catalog.cjs', str(root)], root, timeout=30)
        if catalog.returncode:
            raise ValueError('catalog unavailable')
        rows = json.loads(catalog.stdout)
        result, identities = rules.player_rows(rows, 'players:canonical', 'assets/js/player-search-v2.js')
        checks.append(result)
        for config, data, roster, path in loaded:
            checks.append(rules.rosters(config, data, roster, identities, path))
    except (OSError, ValueError, subprocess.TimeoutExpired):
        checks.append(check('players:canonical', 'NOT VERIFIED', note='공개 카탈로그 loader 실행 실패; 연결 검증 보류'))
    for path in rules.PLAYER_FILES:
        try:
            c, _ = rules.player_rows(rules.read(root, path), 'players:' + path, path)
            checks.append(c)
        except (OSError, ValueError, TypeError):
            checks.append(check('players:' + path, 'NOT VERIFIED', note='원장 입력 검증 실패'))
    try:
        inv, c = inventory(root); checks.append(c)
    except ImportError:
        inv = []; checks.append(check('workflow-safety', 'NOT VERIFIED', note='PyYAML 의존성 미설치'))
    checks.append(rules.paths_check(root))
    public_json = [p.relative_to(root).as_posix() for p in (root / 'data').rglob('*.json')]
    checks += rules.security(root, public_json)
    try:
        checks.append(notices(root))
    except (OSError, ValueError, KeyError, TypeError):
        checks.append(check('notices', 'NOT VERIFIED', note='공시 검수 큐/후속 검수 근거 접근 실패'))
    checks += drive_checks(all_local, master_input)
    checks += official_checks(all_local) if live else [check('official:live', 'NOT RUN', note='--live 미지정')]
    checks += deployed_checks(root, rules.SLUGS) if live else [check('deployed:live', 'NOT RUN', note='--live 미지정')]
    checks += regression(root) if core_tests else [check('regression', 'NOT RUN', note='--core-tests 미지정')]
    if ui:
        try:
            r = execute(['node', 'scripts/quality_audit/ui.cjs', str(root)], root, timeout=360)
            checks += [json.loads(line) for line in r.stdout.splitlines() if line.strip()]
            if r.returncode and not any(c['id'] == 'ui:runner' for c in checks):
                checks.append(check('ui:runner', 'NOT VERIFIED', note='브라우저 실행 미완료', operational=True))
        except subprocess.TimeoutExpired as exc:
            output = exc.stdout.decode('utf-8', errors='replace') if isinstance(exc.stdout, bytes) else exc.stdout or ''
            for line in output.splitlines():
                try:
                    c = json.loads(line)
                    if c.get('id', '').startswith('ui:') and c.get('outcome') in {'PASS', 'FAIL', 'NOT VERIFIED'}:
                        checks.append(c)
                except ValueError:
                    continue
            checks.append(check('ui:runner', 'NOT VERIFIED', note='브라우저 전체 제한시간 초과; 완료된 화면의 결과만 보존', operational=True))
        except (OSError, ValueError):
            checks.append(check('ui:runner', 'NOT VERIFIED', note='Playwright/Chromium 실행 실패', operational=True))
    else:
        checks.append(check('ui:browser', 'NOT RUN', note='--ui 미지정; DOM 테스트 통과를 시각 검증으로 간주하지 않음'))
    checks += [check('drive:roster-full', 'NOT VERIFIED', note='선수 MASTER는 검수중. v1은 경기 MASTER 비교만 인증 adapter 제공'),
               check('sync:timestamps', 'NOT VERIFIED', note='Drive 수정 시각/commit 시각은 실제 배포 시각과 다름; 배포 manifest 미설정'),
               check('draft:selection-results', 'NOT RUN', note='운영 main의 신청자/프로필은 기존 테스트. 미병합 결과 페이지는 별도 PR 범위'),
               check('security:release-enforcement', 'NOT VERIFIED', note='감사 gate 구현; required check/실제 배포 차단 연결은 승인 후 설정')]
    checks.append(check('audit:execution', 'PASS', covered=['runner'], note='점검 프로그램 실행 완료; 데이터 검증 결과와 구분'))
    registry, events = reconcile(checks, previous, at=checked, commit=commit, run_id=run_id)
    # Only sanitized state can be persisted as an artifact/cache in a public repository.
    safe_registry = dict(schema_version=1, findings={k: public_finding(v) for k, v in registry['findings'].items()},
                         operations=registry['operations'])
    public_checks = [{k: v for k, v in c.items() if k not in {'findings', 'covered_entities'}} for c in checks]
    report = dict(schema_version=1, checked_at=checked, github_sha=commit, mode='READ_ONLY',
                  checks=public_checks, findings=list(safe_registry['findings'].values()),
                  events=events, summary=dict(Counter(c['outcome'] for c in checks)),
                  inventory=inv, runtime={'openai_api_required': False, 'chatgpt_subscription_required': False,
                                          'audit_code_sha256': implementation_digest(root)})
    return report, safe_registry


def failure_report(kind, *, previous=None, run_id=None, commit='UNKNOWN'):
    # Never output exceptions, response bodies or credentials from a failed run.
    at = now_kst()
    f = finding('AUDIT_RUNTIME', 'audit:execution', 'runner', severity='P2',
                actual=kind, expected='completed read-only audit')
    checks = [check('audit:execution', 'NOT VERIFIED', findings=[f],
                    note='점검 프로그램 실행 실패. 서비스 데이터 오류로 분류하지 않음')]
    state, events = reconcile(checks, previous, at=at, commit=commit, run_id=run_id)
    state['findings'] = {k: public_finding(v) for k, v in state['findings'].items()}
    report = dict(schema_version=1, checked_at=at, github_sha=commit, mode='READ_ONLY',
                  checks=[{k: v for k, v in checks[0].items() if k not in {'findings', 'covered_entities'}}],
                  findings=list(state['findings'].values()), events=events, summary={'NOT VERIFIED': 1},
                  inventory=[], runtime={'openai_api_required': False, 'chatgpt_subscription_required': False})
    return report, state


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--root', default='.'); p.add_argument('--output', required=True)
    p.add_argument('--live', action='store_true'); p.add_argument('--core-tests', action='store_true')
    p.add_argument('--ui', action='store_true'); p.add_argument('--master-input')
    p.add_argument('--state'); p.add_argument('--run-id'); p.add_argument('--gate', action='store_true')
    a = p.parse_args()
    root, output = Path(a.root).resolve(), Path(a.output).resolve()
    if output.is_relative_to(root):
        p.error('output must be outside the repository')
    prev, failed = None, False
    try:
        prev = json.loads(Path(a.state).read_text()) if a.state and Path(a.state).exists() else None
        report, state = run(root, live=a.live, core_tests=a.core_tests, ui=a.ui,
                            master_input=a.master_input, previous=prev, run_id=a.run_id)
    except Exception as exc:
        failed = True
        report, state = failure_report(type(exc).__name__, run_id=a.run_id)
    data_gate_failed = a.gate and any(f['verification'] == 'CONFIRMED' and f['severity'] in {'P0', 'P1'} for f in report['findings'])
    report['gate'] = {'enforced': a.gate, 'outcome': 'FAIL' if data_gate_failed else 'PASS'}
    output.mkdir(parents=True, exist_ok=True)
    (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    (output / 'report.md').write_text(render_markdown(report), encoding='utf-8')
    (output / 'state.json').write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'summary': report['summary'], 'findings': len(report['findings']),
                      'events': len(report['events']), 'mode': 'READ_ONLY'}, ensure_ascii=False))
    # Audit runtime/coverage failure is distinct from confirmed data defects.
    if failed:
        return 2
    if data_gate_failed:
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

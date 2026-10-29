"""GitHub Issues ledger; gated writes, pagination, stable identity and quiet updates."""
import argparse
from copy import deepcopy
import json
import os
from pathlib import Path
import re
from urllib.request import Request

MARKER = 'kvl-quality-audit:v1'
ID = re.compile(r'^KVL-QA-[A-F0-9]{16}$')
LEDGER = re.compile(r'<!-- kvl-quality-audit-state:v1\n(.*?)\n-->', re.S)


def decode_issue(issue):
    body = issue.get('body') or ''
    m = LEDGER.search(body)
    if not m or len(m[1]) > 40000 or issue.get('pull_request'):
        return None
    try:
        f = json.loads(m[1])
    except ValueError:
        return None
    if not isinstance(f, dict) or not ID.fullmatch(str(f.get('id', ''))):
        return None
    if f.get('visibility') != 'PUBLIC' or f.get('severity') not in {'P0', 'P1', 'P2', 'P3'}:
        return None
    if f.get('verification') not in {'CONFIRMED', 'RESOLVED', 'SUSPECTED', 'NOT VERIFIED'}:
        return None
    if not all(k in f for k in ('check_id', 'entity', 'first_seen', 'last_seen', 'rule')):
        return None
    return f


def issue_body(f):
    def safe(value):
        # JSON representation escapes newlines; avoid accidental mentions or HTML comments.
        return json.dumps(value, ensure_ascii=False).replace('@', '＠').replace('<', '&lt;').replace('>', '&gt;')
    lines = [f"<!-- {MARKER} {f['id']} -->", f"**{f['severity']} · {f['verification']} · {f['rule']}**", '',
             f"- 오류 ID: `{f['id']}`", f"- 최초 발견(KST): {f['first_seen']}",
             f"- 마지막 확인(KST): {f['last_seen']}", f"- 검사 commit: `{f.get('github_sha', 'UNKNOWN')}`"]
    for key, label in [('path', '경로'), ('related', '관련 식별키'), ('actual', '기존값'),
                       ('expected', '기대값'), ('source_url', '공식 근거'), ('source_checked_at', '근거 확인 시각'),
                       ('suggestion', '수정 제안'), ('impact', '영향 범위'), ('owner_task', '담당 작업'), ('processing', '처리 상태')]:
        lines.append('- ' + label + ': ' + safe(f.get(key)))
    lines += ['', '자동 수정은 수행하지 않습니다. 해결 상태는 해당 대상을 재검증한 경우에만 갱신합니다.',
              '', '<!-- kvl-quality-audit-state:v1',
              json.dumps(f, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e'), '-->']
    return '\n'.join(lines)


def plan(report, existing):
    """Issue history is authoritative even if the Actions cache was lost."""
    index = {}
    for issue in existing:
        f = decode_issue(issue)
        if f:
            if f['id'] in index:
                raise ValueError('Duplicate audit issue IDs; manual review required')
            index[f['id']] = (issue, f)
    operations = []
    for item in report['findings']:
        f = deepcopy(item)
        if f.get('visibility') != 'PUBLIC':
            continue
        pair = index.get(f['id'])
        if pair is None:
            if f['verification'] == 'CONFIRMED':
                operations.append({'action': 'create', 'finding': f})
            continue
        issue, old = pair
        f['first_seen'] = old['first_seen']
        if f['verification'] == 'RESOLVED':
            if old['verification'] != 'RESOLVED':
                operations.append({'action': 'resolve', 'number': issue['number'], 'finding': f})
            continue
        if f['verification'] != 'CONFIRMED':
            # A failed source read does not resolve a prior confirmed defect.
            continue
        event = None
        if old['verification'] == 'RESOLVED':
            event = 'REOPENED'
        elif int(f['severity'][1]) < int(old['severity'][1]):
            event = 'ESCALATED'
        elif old['verification'] != 'CONFIRMED':
            event = 'NEW_CONFIRMED'
        # Manual close is not proof of repair; keep OPEN data status without reopening on each run.
        operations.append({'action': 'update', 'number': issue['number'], 'finding': f,
                           'event': event, 'reopen': event == 'REOPENED',
                           'transition_key': str(old.get('last_run') or old['last_seen']) + ':' + old['severity']})
    return operations


class GitHub:
    def __init__(self, repo, token):
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo):
            raise ValueError('Invalid repository')
        self.base = 'https://api.github.com/repos/' + repo
        self.token = token

    def request(self, method, path, payload=None):
        headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
                   'Authorization': 'Bearer ' + self.token, 'User-Agent': 'KVL-Quality-Audit/1'}
        raw = json.dumps(payload).encode() if payload is not None else None
        if raw is not None:
            headers['Content-Type'] = 'application/json'
        req = Request(self.base + path, method=method, data=raw, headers=headers)
        # Fixed GitHub origin and relative fixed API routes. No source-derived URLs.
        from .sources import NoRedirect
        from urllib.request import build_opener
        with build_opener(NoRedirect).open(req, timeout=25) as response:
            body = response.read(8_000_001)
            if len(body) > 8_000_000:
                raise ValueError('GitHub response limit')
        return json.loads(body) if body else None

    def list_issues(self):
        result = []
        for page in range(1, 101):
            items = self.request('GET', f'/issues?state=all&per_page=100&page={page}')
            result.extend(items)
            if len(items) < 100:
                return result
        raise ValueError('Pagination incomplete; refusing writes')


def publish_allowed(env):
    return (env.get('KVL_AUDIT_APPROVED') == 'true' and env.get('GITHUB_REF') == 'refs/heads/main'
            and env.get('GITHUB_EVENT_NAME') in {'schedule', 'workflow_dispatch'})


def publish(operations, client):
    for op in operations:
        f = op['finding']
        payload = dict(title=f"[{f['severity']}] {f['rule']} · {f['id']}", body=issue_body(f))
        if op['action'] == 'create':
            client.request('POST', '/issues', payload)
        else:
            if op['action'] == 'resolve':
                payload.update(state='closed', state_reason='completed')
            elif op.get('reopen'):
                payload['state'] = 'open'
            # Body edits keep last_seen current without routine comment notifications.
            # Reopening emits GitHub's native notification. Severity escalation uses one comment.
            if op.get('event') == 'ESCALATED':
                # Stable across a retry after comment POST but before ledger PATCH.
                from hashlib import sha256
                transition = sha256((op['transition_key'] + ':' + f['severity']).encode()).hexdigest()[:16]
                marker = f"<!-- kvl-audit-escalation:{f['id']}:{transition} -->"
                comments = []
                for page in range(1, 101):
                    batch = client.request('GET', f"/issues/{op['number']}/comments?per_page=100&page={page}")
                    comments.extend(batch)
                    if len(batch) < 100:
                        break
                else:
                    raise ValueError('Comment pagination incomplete')
                if not any(marker in (c.get('body') or '') for c in comments):
                    client.request('POST', f"/issues/{op['number']}/comments", {'body': marker + '\n심각도가 ' + f['severity'] + '로 상승했습니다.'})
            client.request('PATCH', f"/issues/{op['number']}", payload)


def add_pipeline_status(report, existing, result, *, run_id=None, commit='UNKNOWN'):
    from .core import assessed, check, finding, reconcile
    previous = {'findings': {}, 'operations': {}}
    for issue in existing:
        f = decode_issue(issue)
        if f and f['rule'] == 'OP_EXECUTION':
            previous['findings'][f['id']] = f
    scope = 'pipeline:execution'
    findings = [] if result == 'success' else [finding('OP_EXECUTION', scope, 'workflow', severity='P2',
        actual='audit pipeline did not complete', expected='successful workflow and report artifact',
        suggestion='Actions 실행 단계/의존성/아티팩트를 확인합니다. 서비스 데이터 오류와 구분합니다.')]
    state, _ = reconcile([assessed(scope, findings, covered=['workflow'])], previous,
                         run_id=run_id, commit=commit)
    report['findings'].extend(state['findings'].values())
    return report


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--report'); p.add_argument('--hydrate'); p.add_argument('--publish', action='store_true')
    p.add_argument('--execution-result', choices=['success', 'failure', 'cancelled', 'skipped'])
    a = p.parse_args()
    if a.publish and not publish_allowed(os.environ):
        p.error('Issue publication requires approval variable, trusted main and manual/scheduled event')
    client = GitHub(os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN'])
    existing = client.list_issues()
    if a.hydrate:
        dest = Path(a.hydrate)
        state = json.loads(dest.read_text()) if dest.exists() else {'schema_version': 1, 'findings': {}, 'operations': {}}
        for issue in existing:
            f = decode_issue(issue)
            if f:
                state['findings'][f['id']] = f
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(state, ensure_ascii=False))
    if a.report:
        if Path(a.report).exists():
            report = json.loads(Path(a.report).read_text())
        elif a.execution_result:
            report = {'findings': []}
            a.execution_result = 'failure'
        else:
            raise FileNotFoundError('Audit report unavailable')
        if a.execution_result:
            add_pipeline_status(report, existing, a.execution_result,
                                run_id=os.environ.get('GITHUB_RUN_ID'), commit=os.environ.get('GITHUB_SHA', 'UNKNOWN'))
        operations = plan(report, existing)
        if a.publish:
            publish(operations, client)
        print(json.dumps({'mode': 'published' if a.publish else 'dry-run',
                          'actions': {k: sum(x['action'] == k for x in operations) for k in ('create', 'update', 'resolve')}}))


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('ISSUE_LEDGER_NOT_VERIFIED ' + type(exc).__name__)
        raise SystemExit(2)

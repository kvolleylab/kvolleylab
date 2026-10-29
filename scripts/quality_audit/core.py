"""Stable findings, conservative lifecycle and public-output boundary."""
from copy import deepcopy
from datetime import datetime
from hashlib import sha256
import json
from zoneinfo import ZoneInfo

KST = ZoneInfo('Asia/Seoul')
OUTCOMES = {'PASS', 'FAIL', 'NOT VERIFIED', 'NOT RUN'}
LEVELS = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3}


def now_kst():
    return datetime.now(KST).isoformat(timespec='seconds')


def stable_id(rule, scope, entity):
    key = json.dumps([rule, scope, str(entity)], ensure_ascii=False, separators=(',', ':'))
    return 'KVL-QA-' + sha256(key.encode()).hexdigest()[:16].upper()


def finding(rule, scope, entity, *, severity='P2', status='CONFIRMED',
            actual=None, expected=None, path=None, source_url=None,
            source_checked_at=None, related=None, sensitive=False, suggestion=None):
    assert severity in LEVELS
    assert status in {'CONFIRMED', 'SUSPECTED', 'NOT VERIFIED'}
    return dict(id=stable_id(rule, scope, entity), rule=rule, check_id=scope,
                entity=str(entity), severity=severity, verification=status,
                path=path or scope, related=related or {}, actual=actual, expected=expected,
                source_url=source_url, source_checked_at=source_checked_at,
                suggestion=suggestion or '근거를 검토한 뒤 별도 수정 PR을 승인합니다.',
                impact=path or scope, owner_task='운영자 검수', processing='OPEN',
                visibility='PRIVATE' if sensitive else 'PUBLIC')


def check(key, outcome, *, findings=(), count=0, covered=(), note='', complete=True, operational=False):
    assert outcome in OUTCOMES
    return dict(id=key, outcome=outcome, findings=list(findings), count=count,
                covered_entities=sorted(set(map(str, covered))), note=note,
                complete=complete and outcome in {'PASS', 'FAIL'}, operational=operational)


def assessed(key, findings, *, count=0, covered=(), note=''):
    findings = list(findings)
    result = ('FAIL' if any(f['verification'] == 'CONFIRMED' for f in findings)
              else 'NOT VERIFIED' if findings else 'PASS')
    return check(key, result, findings=findings, count=count, covered=covered, note=note)


def public_finding(item):
    """Never serialize secret values/paths/IDs, including exception text, to public output."""
    f = deepcopy(item)
    if f.get('redacted'):
        return f
    if f.get('visibility') != 'PUBLIC':
        # Opaque identity only. Even the source scope may be confidential.
        f.update(entity='REDACTED', path='REDACTED', related={}, actual='REDACTED',
                 expected='REDACTED', source_url=None, source_checked_at=None,
                 impact='REDACTED', check_id='restricted-' + sha256(f['check_id'].encode()).hexdigest()[:16],
                 suggestion='비공개 검수 환경에서 원본을 확인합니다.', owner_task='비공개 검수')
        f['entity'] = 'opaque-' + sha256(item['entity'].encode()).hexdigest()[:16]
        f['redacted'] = True
    return f


def reconcile(checks, previous=None, *, at=None, commit='UNKNOWN', run_id=None):
    """No resolution on missing coverage; retries of the same run are idempotent."""
    at = at or now_kst()
    previous = previous or {'findings': {}, 'operations': {}}
    registry = deepcopy(previous.get('findings', {}))
    ops = deepcopy(previous.get('operations', {}))
    events, seen = [], set()
    for c in checks:
        for source in c['findings']:
            f = deepcopy(source)
            fid = f['id']
            if fid in seen:
                continue
            seen.add(fid)
            old = registry.get(fid)
            f.update(first_seen=old['first_seen'] if old else at, last_seen=at,
                     github_sha=commit, resolved_at=None,
                     occurrences=(old.get('occurrences', 0) if old else 0) +
                                 (0 if old and run_id and old.get('last_run') == run_id else 1),
                     last_run=run_id)
            # Human workflow state is not reset by an unchanged observation.
            if old and old.get('verification') != 'RESOLVED':
                f['processing'] = old.get('processing', 'OPEN')
                f['owner_task'] = old.get('owner_task', f['owner_task'])
            event = None
            if f['verification'] == 'CONFIRMED':
                if not old or old['verification'] in {'SUSPECTED', 'NOT VERIFIED'}:
                    event = 'NEW_CONFIRMED'
                elif old['verification'] == 'RESOLVED':
                    event = 'REOPENED'
                elif LEVELS[f['severity']] < LEVELS[old['severity']]:
                    event = 'ESCALATED'
            if event:
                events.append({'id': fid, 'event': event,
                               'public': f['visibility'] == 'PUBLIC'})
            registry[fid] = f
        if c.get('operational') and c['outcome'] == 'NOT VERIFIED':
            oldop = ops.get(c['id'], {})
            n = oldop.get('consecutive_failures', 0)
            if not run_id or oldop.get('last_run') != run_id:
                n += 1
            warned = oldop.get('warned', False)
            if n >= 3 and not warned:
                events.append({'id': stable_id('OP_ACCESS', c['id'], 'availability'),
                               'event': 'OPERATION_WARNING', 'check_id': c['id'], 'public': True})
                warned = True
            ops[c['id']] = dict(consecutive_failures=n, warned=warned, last_run=run_id)
            if n >= 3:
                op = finding('OP_ACCESS', c['id'], 'availability', severity='P2',
                             actual='persistent access/execution failure', expected='successful read-only check')
                prior = registry.get(op['id'], {})
                op.update(first_seen=prior.get('first_seen', at), last_seen=at,
                          github_sha=commit, last_run=run_id, occurrences=n, resolved_at=None)
                registry[op['id']] = op
                seen.add(op['id'])
        elif c['outcome'] in {'PASS', 'FAIL'} and c['id'] in ops:
            ops[c['id']] = dict(consecutive_failures=0, warned=False, last_run=run_id)
            opid = stable_id('OP_ACCESS', c['id'], 'availability')
            if opid in registry:
                registry[opid].update(verification='RESOLVED', processing='RESOLVED',
                                      resolved_at=at, last_seen=at, github_sha=commit)
    coverage = {c['id']: c for c in checks if c['complete']}
    for c in list(coverage.values()):
        coverage['restricted-' + sha256(c['id'].encode()).hexdigest()[:16]] = {
            'covered_entities': ['opaque-' + sha256(e.encode()).hexdigest()[:16] for e in c['covered_entities']]}
    for fid, old in registry.items():
        if fid in seen or old['verification'] == 'RESOLVED':
            continue
        c = coverage.get(old['check_id'])
        if c and old['entity'] in c['covered_entities']:
            old.update(verification='RESOLVED', processing='RESOLVED', resolved_at=at,
                       last_seen=at, github_sha=commit, last_run=run_id)
    return dict(schema_version=1, findings=registry, operations=ops), events


def render_markdown(report):
    lines = ['# KVL Quality Audit v1 점검 결과', '',
             f"확인 시각(KST): {report['checked_at']}  ",
             f"대상 commit: `{report['github_sha']}`  ",
             '읽기 전용 점검입니다. PASS는 명시된 검사 범위에만 적용됩니다.', '',
             '| 검사 | 결과 | 건수 | 설명 |', '|---|---|---:|---|']
    def cell(v):
        return str(v).replace('|', '\\|').replace('\n', ' ').replace('<', '&lt;')
    for c in report['checks']:
        lines.append('| ' + ' | '.join(map(cell, [c['id'], c['outcome'], c['count'], c['note']])) + ' |')
    lines += ['', '## 오류·검수 항목', '', '| 오류 ID | 심각도 | 검증 상태 | 규칙 | 경로 |',
              '|---|---|---|---|---|']
    for f in report['findings']:
        lines.append('| ' + ' | '.join(map(cell, [f['id'], f['severity'], f['verification'],
                                                 f['rule'], f['path']])) + ' |')
    lines += ['', f"알림 후보 {len(report['events'])}건. 시범 실행은 Issue를 게시하지 않습니다.",
              '민감 항목의 원문·값·개인 메모·인증정보는 이 보고서에 포함하지 않습니다.', '']
    return '\n'.join(lines)

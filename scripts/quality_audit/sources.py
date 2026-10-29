"""Bounded read-only adapters; raw Drive rows never enter audit output."""
from datetime import datetime
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import quote
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler

from .core import check, now_kst
from .checks import compare_matches

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import kovo_match_schedule_bridge as bridge

MAX_BYTES = 4_000_000
MASTER_COLUMNS = ['MatchID', 'SeasonID', '성별', '라운드', '단계', '날짜', '요일', '시간(KST)',
                  '홈팀', '원정팀', '경기장', '도시', '상태', '홈세트', '원정세트', '세트스코어',
                  'SourceURL', '검증상태', '비고']


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('Redirect rejected')


def get_json(url, *, token=None):
    headers = {'Accept': 'application/json', 'User-Agent': 'KVL-Quality-Audit/1'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = Request(url, method='GET', headers=headers)
    with build_opener(NoRedirect).open(req, timeout=20) as response:
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError('Size limit')
    return json.loads(body)


def official_row(raw, kind, mapping=None, local=()):
    """Reuse observed KOVO parser, add known 2026-27 season identity, never match by name alone."""
    # Unknown explicit state must not be silently treated as a completed match.
    explicit = raw.get('status')
    if explicit not in (None, 'SCHEDULED', 'LIVE', 'FINAL', 'CANCELLED', 'POSTPONED'):
        raise ValueError('Unknown official state')
    item = bridge.normalize(raw, kind)
    g = {'MALE': 'men', 'FEMALE': 'women'}[item['gender']]
    if item['season_id'] == '824' and item['match_type'] == '002':
        mid = f"KOVOCUP26-{item['number']:02d}"
        season = 'kovo-cup-2026'
        stage = bridge.ROUND_CODES.get(item['phase_id'])
    elif item['season_id'] == '023' and item['match_type'] == '001' and item['phase_id'] == '201':
        if mapping is None:
            mapping = json.loads(Path(__file__).with_name('provider-map.json').read_text())['matches']
        mid = mapping.get(item['source_key'])
        season = 'v-league-2026-27'
        if type(raw.get('round')) is not int or not 1 <= raw['round'] <= 6:
            raise ValueError('Unknown league round')
        stage = f"{raw['round']}라운드"
        if not mid:
            candidates = [m for m in local if m['season_id'] == season and m['gender'] == g
                          and m['date'] == item['date'] and m['stage'] == stage
                          and m['home_name'] == item['home']['name'] and m['away_name'] == item['away']['name']]
            if len(candidates) != 1:
                return None
            mid = candidates[0]['id']
    else:
        return None
    if not stage:
        raise ValueError('Unknown Cup stage')
    state = explicit.lower() if explicit else item['status']
    if explicit in ('CANCELLED', 'POSTPONED') and raw.get('endTime'):
        raise ValueError('Conflicting official cancellation')
    result = dict(id=mid, date=item['date'], gender=g, season_id=season,
                  stage=stage, home_name=item['home']['name'], away_name=item['away']['name'], status=state)
    time = str(raw.get('startTime') or '')[:5]
    # Ended endpoint startTime is ACTUAL first serve, not the scheduled fixture time.
    if state == 'scheduled' and re.fullmatch(r'\d{2}:\d{2}', time):
        result['time'] = time
    if state == 'final':
        result['score'] = item['sets_won']
    elif state in {'scheduled', 'postponed', 'cancelled'}:
        result['score'] = None
    return result


def official_checks(local, fetch=bridge.read_public_json):
    results, combined, conflicted, unmapped, evidence_urls = [], {}, set(), 0, {}
    for kind, path in [('main', bridge.SOURCE_PATHS[2]), ('female', bridge.SOURCE_PATHS[0]),
                       ('ended', bridge.SOURCE_PATHS[1])]:
        key = 'official:' + kind
        try:
            raw = fetch(path)
            rows = [official_row(r, kind, local=local) for r in raw]
            unmapped += sum(r is None for r in rows)
            rows = [r for r in rows if r]
            for row in rows:
                if row['id'] in combined and combined[row['id']] != row:
                    conflicted.add(row['id'])
                combined[row['id']] = row
                evidence_urls[row['id']] = bridge.ORIGIN + path
            c = check(key, 'PASS', count=len(rows), note='기존 수집기 읽기 성공; 경기 비교는 통합 관측 검사')
            c.update(source_url=bridge.ORIGIN + path, source_checked_at=now_kst())
            results.append(c)
        except Exception as exc:
            # No exception message, URL query, response or credentials in public logs.
            results.append(check(key, 'NOT VERIFIED', note='공식 출처 접근/계약 검증 실패: ' + type(exc).__name__, complete=False, operational=True))
    results.append(compare_matches(local, [dict(r, source_url=evidence_urls[k]) for k, r in combined.items() if k not in conflicted],
        'official:observed', source_url='https://kovo.co.kr/games/v-leagues/schedules',
        checked_at=now_kst(), complete=False))
    if conflicted or unmapped:
        results.append(check('official:identity-coverage', 'NOT VERIFIED', count=len(conflicted) + unmapped,
                             note='미연결 또는 관측 간 상충 경기; 임의 매칭/결과 확정 금지'))
    results.append(check('official:full-season', 'NOT VERIFIED',
                         note='기존 rolling API는 일부 경기만 제공. 전체 컵/시즌 공식 결과·세트 점수 전수 대조는 미완료'))
    return results


def master_rows(values):
    if not values or values[0][:19] != MASTER_COLUMNS:
        raise ValueError('Unsupported MASTER header')
    records = []
    for row in values[1:]:
        if not row or not any(row):
            continue
        row = list(row) + [None] * (19 - len(row))
        mid, season, gender, rnd, phase, date, _, time, home, away, _, _, state, hs, aws, sets = row[:16]
        if not mid or gender not in ('남자', '여자') or season not in ('kovo-cup-2026', 'v-league-2026-27'):
            raise ValueError('Unsupported MASTER row')
        status = {'예정': 'scheduled', '종료': 'final', '연기': 'postponed', '취소': 'cancelled', '진행중': 'live'}.get(state)
        if status is None:
            raise ValueError('Unknown MASTER status')
        score = None
        if hs not in (None, '') or aws not in (None, ''):
            parsed = []
            for s in str(sets or '').split():
                if not re.fullmatch(r'\d+-\d+', s):
                    raise ValueError('Unknown set-point format')
                h, a = map(int, s.split('-')); parsed.append({'home': h, 'away': a})
            score = dict(home=int(hs), away=int(aws), sets=parsed)
        records.append(dict(id=mid, season_id=season, gender='men' if gender == '남자' else 'women',
                            stage=str(rnd) + '라운드' if phase == '정규리그' else phase,
                            date=date, time=time, home_name=home, away_name=away, status=status, score=score))
    return records


def drive_checks(local, input_dir=None):
    """Opt-in private local export or allowlisted Sheets read with read-only credentials."""
    results = []
    # File IDs are never hardcoded/published here; configure a private mapping in a Secret.
    for name, season in [('cup', 'kovo-cup-2026'), ('league', 'v-league-2026-27')]:
        scope = 'drive:' + name
        try:
            mapping = json.loads(os.environ.get('KVL_AUDIT_DRIVE_MAP', '{}'))
            if input_dir:
                payload = json.loads((Path(input_dir) / f'{name}-master.json').read_text())
            elif name in mapping and os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
                import google.auth
                from google.auth.transport.requests import Request as AuthRequest
                credentials, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/spreadsheets.readonly'])
                credentials.refresh(AuthRequest())
                entry = mapping[name]
                if not re.fullmatch(r'[a-zA-Z0-9_-]+', entry['id']):
                    raise ValueError('Invalid file ID')
                # Fixed bounded public-facts table; cannot point at a private-note worksheet.
                rng = quote("'경기일정_MASTER'!A1:S600", safe='')
                payload = get_json('https://sheets.googleapis.com/v4/spreadsheets/' + entry['id'] + '/values/' + rng,
                                   token=credentials.token)
            else:
                results.append(check(scope, 'NOT VERIFIED', note='Actions 읽기 전용 Drive 인증 미설정; 자료 미접근이며 데이터 누락 아님', operational=True))
                continue
            remote = master_rows(payload['values'])
            selected = [m for m in local if m['season_id'] == season]
            results.append(compare_matches(selected, remote, scope, checked_at=now_kst(), complete=True, sensitive=True))
        except Exception as exc:
            results.append(check(scope, 'NOT VERIFIED', note='MASTER 접근/스키마 검증 실패: ' + type(exc).__name__, complete=False, operational=True))
    return results


def deployed_checks(root, slugs, fetch=get_json):
    results = []
    for slug in slugs:
        scope = 'deployed:' + slug
        path = f'data/competitions/{slug}/data.json'
        url = 'https://kvolleylab.com/' + path
        try:
            actual = fetch(url)
            expected = json.loads((Path(root) / path).read_text())
            from .core import finding, assessed
            # Structural equality ignores transport whitespace, never derives deployment time from Last-Modified.
            errors = [] if actual == expected else [finding('DEPLOYED_DATA_DIFF', scope, slug,
                path=path, severity='P2', status='SUSPECTED', actual='different content', expected='current commit',
                source_url=url, source_checked_at=now_kst())]
            results.append(assessed(scope, errors, count=len(expected.get('matches', [])), covered=[slug],
                                    note='운영 JSON과 검사 commit 구조 비교; 배포 시각의 증명과 구분'))
        except Exception as exc:
            results.append(check(scope, 'NOT VERIFIED', note='홈페이지 데이터 접근 실패: ' + type(exc).__name__, complete=False, operational=True))
    return results

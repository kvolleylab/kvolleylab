"""Pure rules. No updater, ID allocator, name-only merger or inferred result."""
from collections import Counter, defaultdict
from datetime import datetime
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, unquote

from .core import KST, assessed, check, finding

SLUGS = ('kovo-cup-men-2026', 'kovo-cup-women-2026',
         'v-league-men-2026-27', 'v-league-women-2026-27')
PLAYER_FILES = ('data/master/player_master_229_v2.json',
                'data/master/player_master_school_v1.json',
                'data/master/player_master_international_v1.json')
PAGES = ('index.html', 'competition-engine.html', 'schedules.html', 'players.html',
         'player.html', 'draft-hub.html', 'v-league.html')


def read(root, path):
    return json.loads((Path(root) / path).read_text(encoding='utf-8-sig'))


def local_path(root, base, target):
    u = urlsplit(target)
    if u.scheme or u.netloc or not u.path:
        return None
    p = (Path(root) / unquote(u.path).lstrip('/') if u.path.startswith('/')
         else Path(base).parent / unquote(u.path)).resolve()
    if not p.is_relative_to(Path(root).resolve()):
        raise ValueError('Path escapes repository')
    return p


def match_state(m):
    value = m.get('status')
    aliases = {'종료': 'final', 'completed': 'final', 'finished': 'final',
               '예정': 'scheduled', '연기': 'postponed', '취소': 'cancelled'}
    # Engine v2 uses presence of a score to display completed fixtures.
    return aliases.get(value, value) if value else ('final' if m.get('score') else 'scheduled')


def score_errors(score):
    if not isinstance(score, dict):
        return ['MISSING_SCORE']
    h, a, sets = score.get('home'), score.get('away'), score.get('sets')
    if any(type(v) is not int or not 0 <= v <= 3 for v in (h, a)) or max(h, a) != 3 or h == a:
        return ['INVALID_FINAL_SCORE']
    if not isinstance(sets, list) or len(sets) != h + a:
        return ['MISSING_SET_POINTS']
    wins = [0, 0]
    for i, s in enumerate(sets):
        if not isinstance(s, dict):
            return ['INVALID_SET_POINTS']
        x, y = s.get('home'), s.get('away')
        if any(type(v) is not int or v < 0 for v in (x, y)):
            return ['INVALID_SET_POINTS']
        target, hi, lo = (15 if i == 4 else 25), max(x, y), min(x, y)
        if hi < target or hi - lo < 2 or (hi > target and hi - lo != 2):
            return ['INVALID_SET_POINTS']
        if 3 in wins:
            return ['EXTRA_SET_AFTER_WIN']
        wins[0 if x > y else 1] += 1
    return [] if wins == [h, a] else ['SET_TOTAL_MISMATCH']


def matches(config, data, path):
    scope, errors = 'matches:' + config.get('slug', path), []
    rows, teams = data.get('matches', []), data.get('participants', [])
    comp = config.get('competition', {})
    ids, fixtures = set(), set()
    team_by_id = {p['code']: p for p in teams if p.get('code')}
    def add(rule, entity, actual=None, expected=None, severity='P1'):
        errors.append(finding(rule, scope, entity, path=path, severity=severity,
                              actual=actual, expected=expected,
                              related={'competition_id': comp.get('competitionId'),
                                       'season_id': comp.get('season'), 'match_id': entity}))
    for field in ('competitionId', 'season', 'gender'):
        if not comp.get(field):
            add('COMPETITION_REQUIRED', field, None, field)
    if config.get('schemaVersion') != 2:
        add('SCHEMA_VERSION', 'schema', config.get('schemaVersion'), 2)
    if len(team_by_id) != len(teams):
        add('DUPLICATE_TEAM_ID', 'participants', len(teams), len(team_by_id))
    for i, m in enumerate(rows):
        mid = m.get('id') or f'row-{i}'
        if not m.get('id'):
            add('MISSING_MATCH_ID', mid)
        if mid in ids:
            add('DUPLICATE_MATCH_ID', mid, mid, 'unique')
        ids.add(mid)
        codes = [m.get(s, {}).get('code') for s in ('home', 'away')]
        for side, code in zip(('home', 'away'), codes):
            if code not in team_by_id:
                # Explicit unknown postseason slots are not missing teams.
                if not code and m.get(side, {}).get('label') and match_state(m) == 'scheduled':
                    continue
                add('TEAM_LINK', mid + ':' + side, code, 'participant code')
        if codes[0] and codes[0] == codes[1]:
            add('SAME_TEAMS', mid, codes, 'different teams')
        key = (m.get('date'), m.get('time'), *codes)
        if all(key) and key in fixtures:
            add('DUPLICATE_FIXTURE', mid, list(key), 'unique fixture')
        fixtures.add(key)
        try:
            local = datetime.fromisoformat(m['date'] + 'T' + m['time']).replace(tzinfo=KST)
            if m.get('start_at'):
                utc = datetime.fromisoformat(m['start_at'].replace('Z', '+00:00'))
                if utc.tzinfo is None or utc.astimezone(KST) != local:
                    add('KST_MISMATCH', mid, m['start_at'], local.isoformat())
        except (KeyError, ValueError, TypeError):
            add('MATCH_DATETIME', mid, [m.get('date'), m.get('time')], 'YYYY-MM-DD HH:MM KST')
        if not m.get('stage'):
            add('MISSING_STAGE', mid, None, 'round or phase', 'P2')
        if match_state(m) not in {'scheduled', 'live', 'final', 'postponed', 'cancelled'}:
            add('UNKNOWN_MATCH_STATE', mid, match_state(m), 'explicit supported state')
        if m.get('pool'):
            if any(team_by_id.get(code, {}).get('group') != m['pool'] for code in codes):
                add('POOL_LINK', mid, codes, m['pool'])
        if match_state(m) == 'final':
            for rule in score_errors(m.get('score')):
                add(rule, mid, m.get('score'), '3 wins and consistent set points')
        elif match_state(m) in ('scheduled', 'cancelled', 'postponed') and m.get('score'):
            add('STATUS_SCORE_CONFLICT', mid, match_state(m), 'official reviewed status')
    covered = ids | {mid + ':' + side for mid in ids for side in ('home', 'away')}
    covered |= {'participants', 'schema', 'competitionId', 'season', 'gender'}
    return assessed(scope, errors, count=len(rows), covered=covered,
                    note='경과 시간으로 경기 종료를 추정하지 않음; KST·식별키·세트 합계 검사')


def competition_links(loaded):
    errors, seen_games, seen_competitions, covered = [], set(), set(), []
    for config, data, *_ in loaded:
        slug, comp = config['slug'], config['competition']
        covered.append(slug)
        expected_gender = 'women' if '-women-' in slug else 'men'
        expected_season = '2026-27' if slug.startswith('v-league-') else '2026'
        if comp['gender'] != expected_gender or comp['season'] != expected_season:
            errors.append(finding('COMPETITION_IDENTITY', 'competition-links', slug, severity='P1'))
        cid = comp['competitionId']; covered.append(cid)
        if cid in seen_competitions:
            errors.append(finding('DUPLICATE_COMPETITION_ID', 'competition-links', cid, severity='P1'))
        seen_competitions.add(cid)
        for m in data['matches']:
            mid = m['id']; covered.append(mid)
            if mid in seen_games:
                errors.append(finding('CROSS_COMPETITION_MATCH_ID', 'competition-links', mid, severity='P1'))
            seen_games.add(mid)
    return assessed('competition-links', errors, count=len(seen_games), covered=covered,
                    note='4개 대상 대회의 경기/대회 ID 중복 및 남녀부·시즌 연결')


def standings(config, data, path):
    scope, errors = 'standings:' + config['slug'], []
    st = data.get('standings', {})
    pools = st.get('pools') or [{'id': None, 'rows': st.get('rows', [])}]
    covered = []
    for pool in pools:
        rows = pool.get('rows', [])
        codes = {r.get('team', {}).get('code') for r in rows}
        stats = {c: dict(wins=0, losses=0, points=0) for c in codes}
        for m in data.get('matches', []):
            if pool['id'] and m.get('pool') != pool['id']:
                continue
            if not pool['id'] and not re.fullmatch(r'[1-6]라운드', m.get('stage', '')):
                continue
            h, a = [m.get(s, {}).get('code') for s in ('home', 'away')]
            if h not in codes or a not in codes or match_state(m) != 'final' or score_errors(m.get('score')):
                continue
            hs, aws = m['score']['home'], m['score']['away']
            winner, loser = (h, a) if hs > aws else (a, h)
            stats[winner]['wins'] += 1
            stats[loser]['losses'] += 1
            stats[winner]['points'] += 2 if min(hs, aws) == 2 else 3
            stats[loser]['points'] += 1 if min(hs, aws) == 2 else 0
        for row in rows:
            code = row.get('team', {}).get('code')
            for field in ('wins', 'losses', 'points'):
                entity = f'{pool["id"]}:{code}:{field}'
                covered.append(entity)
                if row.get(field) != stats[code][field]:
                    errors.append(finding('STANDINGS_TOTAL', scope, entity, path=path,
                                          severity='P1', actual=row.get(field), expected=stats[code][field]))
    final = next((m for m in data.get('matches', []) if m.get('stage') == '결승'), None)
    if final and match_state(final) == 'final' and not score_errors(final.get('score')):
        winner = final['home' if final['score']['home'] > final['score']['away'] else 'away']['code']
        champion = next((r.get('code') for r in data.get('finalRanking', []) if r.get('rank') == 1), None)
        covered.append('champion')
        if champion != winner:
            errors.append(finding('CHAMPION_LINK', scope, 'champion', path=path, severity='P1',
                                  actual=champion, expected=winner))
        semifinal_winners = {m['home' if m['score']['home'] > m['score']['away'] else 'away']['code']
            for m in data['matches'] if m.get('stage') == '준결승' and not score_errors(m.get('score'))}
        covered.append('finalists')
        if len(semifinal_winners) == 2 and semifinal_winners != {final['home']['code'], final['away']['code']}:
            errors.append(finding('KNOCKOUT_LINK', scope, 'finalists', path=path, severity='P1'))
    return assessed(scope, errors, count=len(covered), covered=covered,
                    note='조별/정규리그 승패·승점 및 컵 결선 연결; 동률 규정 전체는 기존 엔진 테스트 사용')


def player_rows(rows, scope, path):
    errors, seen, covered = [], {}, []
    for i, p in enumerate(rows):
        pid = p.get('system', {}).get('player_id') or p.get('playerId') or p.get('player_id')
        entity = pid or f'row-{i}'
        covered.append(entity)
        if not pid or pid in seen:
            errors.append(finding('DUPLICATE_PLAYER_ID' if pid else 'MISSING_PLAYER_ID',
                                  scope, entity, path=path, severity='P1', actual=pid, expected='unique existing ID'))
        if pid:
            seen[pid] = p
    return assessed(scope, errors, count=len(rows), covered=covered,
                    note='같은 원장 안의 ID 검사; 시즌 Snapshot 반복은 중복 ID 발급과 구분'), seen


def rosters(config, data, roster, identities, path):
    scope, errors, covered = 'rosters:' + config['slug'], [], []
    participant_ids = {p['code'] for p in data['participants']}
    assigned = defaultdict(set)
    for code, team in roster.items():
        covered.append(code)
        if code not in participant_ids:
            errors.append(finding('ROSTER_TEAM_LINK', scope, code, path=path, severity='P1'))
        counts = Counter(p.get('playerId') for p in team.get('players', []) if p.get('playerId'))
        for pid, count in counts.items():
            entity = f'{code}:{pid}'
            covered.append(entity)
            assigned[pid].add(code)
            if count > 1:
                errors.append(finding('DUPLICATE_ROSTER_PLAYER', scope, entity, path=path, severity='P1'))
        for p in team.get('players', []):
            pid = p.get('playerId')
            if not pid:  # Pending links are intentionally preserved, never inferred by name.
                continue
            entity = f'{code}:{pid}'
            covered.append(entity)
            canonical = identities.get(pid)
            if canonical is None:
                errors.append(finding('PLAYER_LINK_MISSING', scope, entity, path=path, severity='P1',
                                      actual=pid, expected='existing canonical identity'))
            elif (p.get('dob') and canonical.get('birthDate') and p['dob'] != canonical['birthDate']):
                errors.append(finding('PLAYER_DOB_CONFLICT', scope, entity, path=path, severity='P1',
                                      actual=p['dob'], expected=canonical['birthDate'], related={'player_id': pid}))
            if not (p.get('sourceId') or p.get('registrationSource') or team.get('sourceId')):
                errors.append(finding('IDENTITY_SOURCE_MISSING', scope, entity, path=path,
                                      status='SUSPECTED', related={'player_id': pid}))
    for pid, teams in assigned.items():
        covered.append(pid)
        if len(teams) > 1:
            errors.append(finding('MULTIPLE_SNAPSHOT_TEAMS', scope, pid, path=path, severity='P1',
                                  actual=sorted(teams), expected='review transfer effective dates', status='SUSPECTED'))
    return assessed(scope, errors, count=sum(len(t.get('players', [])) for t in roster.values()),
                    covered=covered, note='대회 당시 Snapshot 기준; 이름만으로 소속/신원 확정하지 않음')


def compare_matches(local, remote, scope, *, source_url=None, checked_at=None,
                    complete=False, sensitive=False):
    """Compare by stable IDs only. Missing partial-feed rows are never deletions."""
    errors, covered = [], []
    by_id = {m['id']: m for m in remote}
    if len(by_id) != len(remote):
        return check(scope, 'NOT VERIFIED', note='출처 ID 중복; 비교 보류', complete=False)
    local_ids = {m['id'] for m in local}
    fields = ('date', 'time', 'gender', 'season_id', 'home_name', 'away_name', 'stage', 'status', 'score')
    for m in local:
        other = by_id.get(m['id'])
        if other is None:
            if complete:
                errors.append(finding('SOURCE_MATCH_MISSING', scope, m['id'], severity='P1',
                                      actual='present', expected='source record', sensitive=sensitive))
                covered.append(m['id'])
            continue
        covered.append(m['id'])
        for field in fields:
            entity = m['id'] + ':' + field
            if field not in other:  # Provider may not supply time or set points.
                continue
            covered.append(entity)
            lhs, rhs = m.get(field), other[field]
            if field == 'score' and isinstance(rhs, dict) and 'sets' not in rhs and isinstance(lhs, dict):
                lhs = {k: lhs.get(k) for k in ('home', 'away')}
            if lhs != rhs:
                rule = 'ENDED_STILL_SCHEDULED' if field == 'status' and rhs == 'final' else 'SOURCE_' + field.upper()
                errors.append(finding(rule, scope, entity, severity='P1', actual=lhs, expected=rhs,
                                      related={'match_id': m['id']}, source_url=other.get('source_url', source_url),
                                      source_checked_at=checked_at, sensitive=sensitive))
    if complete:
        for missing in sorted(set(by_id) - local_ids):
            covered.append(missing)
            errors.append(finding('SERVICE_MATCH_MISSING', scope, missing, severity='P1',
                                  actual=None, expected='source record', sensitive=sensitive))
    if not covered:
        return check(scope, 'NOT VERIFIED', note='대상 경기의 공식 관측 없음; 종료·취소·누락 추정 금지', complete=False)
    return assessed(scope, errors, count=len(set(local_ids) & set(by_id)), covered=covered,
                    note=('전체 명시 범위 비교' if complete else '관측된 경기만 비교; 전체 시즌 검증 아님'))


def normalized_local(config, data):
    names = {t['code']: t['name'] for t in data['participants']}
    return [dict(id=m['id'], date=m['date'], time=m['time'],
                 gender=config['competition']['gender'],
                 season_id='kovo-cup-2026' if config['slug'].startswith('kovo-cup') else 'v-league-2026-27',
                 home_name=names.get(m['home'].get('code')),
                 away_name=names.get(m['away'].get('code')), stage=m.get('stage'),
                 status=match_state(m), score=m.get('score')) for m in data['matches']]


def publication_records(records):
    """Fail-closed gate for a NEW public export; missing metadata is never VERIFIED."""
    return all(isinstance(r, dict) and r.get('access_level') == 'PUBLIC' and
               r.get('record_status') == 'VERIFIED' and r.get('source_id') for r in records)


def security(root, paths):
    errors, examined, coverage, legacy = [], 0, [], 0
    private_keys = {'private_notes', 'personal_notes', 'scouting_notes', 'access_token',
                    'refresh_token', 'service_role_key', 'password', 'client_secret'}
    def walk(obj, path, pointer=''):
        nonlocal examined, legacy
        if isinstance(obj, list):
            for i, v in enumerate(obj):
                walk(v, path, f'{pointer}/{i}')
        elif isinstance(obj, dict):
            examined += 1
            level = obj.get('access_level', obj.get('accessLevel'))
            state = obj.get('record_status')
            # Legacy Engine recordStatus describes provenance (e.g. pamphlet-transcribed),
            # not the PUBLIC/VERIFIED review contract. Do not invent a failed review.
            if state is None and obj.get('recordStatus') in {'VERIFIED', 'DRAFT', 'PENDING', 'UNVERIFIED', 'REJECTED'}:
                state = obj['recordStatus']
            sensitive = (isinstance(level, str) and level.upper() in {'PRIVATE', 'PREMIUM', 'MEMBER'})
            sensitive |= any(k.lower() in private_keys and bool(v) for k, v in obj.items())
            entity = path + pointer
            coverage.append(entity)
            if sensitive:
                errors.append(finding('NONPUBLIC_DATA', 'security:json', entity,
                                      path=path, severity='P0', sensitive=True))
            elif ((level is not None and level != 'PUBLIC') or
                  (state is not None and state != 'VERIFIED') or
                  (level == 'PUBLIC' and state != 'VERIFIED')):
                errors.append(finding('UNVERIFIED_PUBLIC_RECORD', 'security:json', entity,
                                      path=path, severity='P1', actual=state, expected='PUBLIC + VERIFIED', sensitive=True))
            elif ('player_id' in obj or 'playerId' in obj) and level is None:
                legacy += 1
            for k, v in obj.items():
                walk(v, path, pointer + '/' + k)
    for p in paths:
        coverage.append(p)
        try:
            walk(read(root, p), p)
        except (OSError, ValueError):
            errors.append(finding('JSON_PARSE', 'security:json', p, path=p, severity='P2',
                                  actual='invalid JSON', expected='valid JSON'))
    result = assessed('security:json', errors, count=examined, covered=coverage,
                      note='명시적 비공개·인증정보·검수 전 필드 탐지. 무표식 레거시의 공개등급은 별도 미검증')
    return [result, check('security:legacy-classification', 'NOT VERIFIED' if legacy else 'PASS',
                         count=legacy, note='명시적 access_level 없는 선수 레코드; 기존 검수 근거의 별도 매핑 필요')]


def paths_check(root):
    errors, covered = [], []
    from html.parser import HTMLParser
    class Links(HTMLParser):
        def handle_starttag(self, tag, attrs):
            for k, v in attrs:
                if v and ((tag in {'script', 'img'} and k == 'src') or
                          (tag in {'a', 'link'} and k == 'href')):
                    self.links.append(v)
    for path in PAGES:
        covered.append(path)
        full = Path(root) / path
        if not full.exists():
            errors.append(finding('REQUIRED_PATH', 'paths', path, path=path, severity='P1'))
            continue
        parser = Links(); parser.links = []
        parser.feed(full.read_text(encoding='utf-8'))
        for target in parser.links:
            entity = path + ':' + target
            covered.append(entity)
            try:
                local = local_path(root, full, target)
                if local is not None and not local.exists():
                    errors.append(finding('LOCAL_LINK', 'paths', entity, path=path,
                                          actual=target, expected='existing path'))
            except ValueError:
                errors.append(finding('UNSAFE_PATH', 'paths', entity, path=path, severity='P1'))
    return assessed('paths', errors, count=len(covered), covered=covered,
                    note='핵심 HTML의 정적 링크/자산; 동적 프로필 경로는 기존 DOM 테스트에서 검사')

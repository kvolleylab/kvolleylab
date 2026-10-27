#!/usr/bin/env python3
"""Attach NSF107 match-detail rosters without modifying any Player MASTER.

Usage: python scripts/build-national-festival-rosters-2026.py /path/to/nsf-official
The input is the already archived official bracket/detail HTML collection.
Only exact name + school + gender + 2026 grade matches reuse existing profile IDs.
"""
import collections
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ID = 'KVL-SRC-NSF107-RESULTS-2026'
DIVISIONS = {'men-general': 127, 'men-university': 129, 'men-u18': 174,
             'women-general': 98, 'women-u18': 143}
MASTER_FILES = ['data/master/player_master_229_v2.json',
                'data/master/player_master_school_v1.json',
                'data/domestic/university-u-league-women-2026.json',
                'data/domestic/university-danyang-women-2026.json']


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def normalized(value):
    return re.sub(r'\s+', '', str(value or '')).replace('국립목포대학교', '목포대학교')


class RosterParser(HTMLParser):
    """Read the two PC tables once; ignore duplicate mobile markup."""
    def __init__(self):
        super().__init__()
        self.tables = []
        self.table = self.row = self.cell = None
        self.checked = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'table' and attrs.get('class') == 'pcView':
            self.table = []
        elif self.table is not None:
            if tag == 'tr':
                self.row = []
                self.checked = False
            elif tag == 'td':
                self.cell = []
            elif tag == 'img' and 'checkbox_check' in attrs.get('src', ''):
                self.checked = True

    def handle_data(self, value):
        if self.cell is not None:
            self.cell.append(value)

    def handle_endtag(self, tag):
        if self.table is None:
            return
        if tag == 'td' and self.cell is not None:
            self.row.append(' '.join(''.join(self.cell).split()))
            self.cell = None
        elif tag == 'tr' and self.row:
            assert len(self.row) == 4, self.row
            _, name, affiliation, position = self.row
            match = re.fullmatch(r'(.*?)\[(.*?)\]', affiliation)
            self.table.append({'name': name, 'affiliation': match[1] if match else affiliation,
                               'grade': int(match[2]) if match and match[2].isdigit() else None,
                               'position': position, 'appearanceMarked': self.checked})
            self.row = None
        elif tag == 'table':
            self.tables.append(self.table)
            self.table = None


def identity_index():
    index = collections.defaultdict(set)
    for filename in MASTER_FILES:
        raw = read(ROOT / filename)
        if isinstance(raw, list):
            for player in raw:
                identity, roster = player['identity'], player.get('current_roster', {})
                if str(roster.get('season')) != '2026':
                    continue
                key = (identity.get('gender'), normalized(identity.get('name_ko')),
                       normalized(roster.get('school_name')), str(roster.get('grade', '')))
                index[key].add(player['system']['player_id'])
        else:
            for player in raw['players']:
                key = ('W', normalized(player['name']), normalized(player['s']), str(player.get('g', '')))
                index[key].add(player['id'])
    return index


def main(source_root):
    source_root = Path(source_root)
    index = identity_index()
    source_index = read(ROOT / 'data/sources/national-sports-festival-2026/source-index.json')
    archived = {Path(f['path']).name: f['sha256'] for s in source_index['sources']
                for f in s.get('files', []) if f['path'].startswith('details/')}
    audit = {'checkedAt': '2026-10-26', 'sourceId': SOURCE_ID,
             'identityRule': 'Exact name + affiliation + gender + grade in existing 2026 roster; no fuzzy or name-only links.',
             'masterFiles': MASTER_FILES, 'divisions': [], 'unlinked': []}
    for division, expected in DIVISIONS.items():
        folder = ROOT / 'data/competitions' / f'national-sports-festival-{division}-2026'
        config, data = read(folder / 'config.json'), read(folder / 'data.json')
        games = collections.defaultdict(list)
        for match in data['matches']:
            filename = match['id'].removeprefix('KVL-M-NSF107-') + '.html'
            raw = (source_root / 'details' / filename).read_bytes()
            assert hashlib.sha256(raw).hexdigest() == archived[filename], filename
            parser = RosterParser()
            parser.feed(raw.decode('utf-8'))
            assert len(parser.tables) == 2, filename
            for side, players in zip(['home', 'away'], parser.tables):
                assert players and len(players) == len({p['name'] for p in players}), filename
                games[match[side]['code']].append({'matchId': match['id'], 'sourceUrl': match['sourceUrl'], 'players': players})
        assert set(games) == {t['code'] for t in data['participants']}
        rosters = {}
        for team in data['participants']:
            team_games = games[team['code']]
            signatures = {tuple((p['name'], p['affiliation'], p['grade'], p['position'])
                                for p in g['players']) for g in team_games}
            assert len(signatures) == 1, ('Roster changed across matches; review required', team['code'])
            players = []
            for row in team_games[0]['players']:
                player = {k: v for k, v in row.items() if k != 'appearanceMarked'}
                player.update(sourceId=SOURCE_ID, sourceUrl=team_games[0]['sourceUrl'])
                key = ('W' if division.startswith('women') else 'M', normalized(row['name']),
                       normalized(row['affiliation']), str(row['grade']))
                ids = index.get(key, set()) if row['grade'] is not None else set()
                if len(ids) == 1:
                    player['playerId'] = next(iter(ids))
                    player['identityLinkBasis'] = 'exact-name-affiliation-gender-grade-2026'
                else:
                    audit['unlinked'].append({'division': division, 'team': team['name'], 'name': row['name'],
                                              'reason': 'ambiguous' if len(ids) > 1 else 'no-exact-existing-roster-match'})
                players.append(player)
            team['rosterCount'] = len(players)
            rosters[team['code']] = {'statusLabel': f'공식 참가선수 {len(players)}명',
                                    'sourceId': SOURCE_ID, 'sourceUrl': team_games[0]['sourceUrl'],
                                    'sourceUrls': [g['sourceUrl'] for g in team_games], 'players': players}
        count = sum(len(r['players']) for r in rosters.values())
        linked = sum(bool(p.get('playerId')) for r in rosters.values() for p in r['players'])
        assert count == expected, (division, count)
        data.update(rosters=rosters, rosterNote='2026 전국체전 공식 참가선수 · 가나다순',
                    rosterSourceNote='선수명·소속·학년·포지션은 대한체육회 경기 상세의 참가선수 표기입니다. 등번호와 신장은 해당 자료에 제공되지 않습니다.',
                    rosterVerification={'checkedAt': '2026-10-26', 'teamCount': len(rosters), 'playerCount': count,
                                        'linkedProfileCount': linked, 'sourceId': SOURCE_ID})
        data['resourcesNote'] = '대한체육회 최종 대진·세부전적·참가선수·메달명세를 2026.10.26 대조했습니다.'
        config['structure']['participants']['linkMode'] = 'team-roster'
        config['structure']['roster'] = {'mode': 'full', 'layout': 'domestic-snapshot', 'domesticTeamRoute': 'competition'}
        write(folder / 'config.json', config)
        write(folder / 'data.json', data)
        audit['divisions'].append({'division': division, 'teams': len(rosters), 'players': count, 'linkedProfiles': linked})
    audit['totals'] = {key: sum(d[key] for d in audit['divisions']) for key in ['teams', 'players', 'linkedProfiles']}
    write(ROOT / 'data/sources/national-sports-festival-2026/roster-link-audit.json', audit)
    print(json.dumps({'divisions': audit['divisions'], 'totals': audit['totals']}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main(sys.argv[1])

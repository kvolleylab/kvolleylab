#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path

MASTER = Path('data/master/player_master.json')
EXPECTED_COUNT = 229
EXPECTED_IDS = [f'KVL-P-{n:06d}' for n in range(1, EXPECTED_COUNT + 1)]

players = json.loads(MASTER.read_text(encoding='utf-8'))
ids = [p['system']['player_id'] for p in players]

errors = []
warnings = []

if len(players) != EXPECTED_COUNT:
    errors.append(f'count={len(players)} expected={EXPECTED_COUNT}')
if ids != EXPECTED_IDS:
    errors.append('player_id sequence is not continuous from KVL-P-000001 to KVL-P-000229')
if len(ids) != len(set(ids)):
    errors.append('duplicate player_id detected')

for index, player in enumerate(players, start=1):
    pid = player.get('system', {}).get('player_id', f'row-{index}')
    system = player.get('system', {})
    identity = player.get('identity', {})
    physical = player.get('physical', {})

    for key, expected in (
        ('status', 'active'),
        ('data_confidence', 'reviewed'),
        ('id_status', 'permanent'),
    ):
        if system.get(key) != expected:
            errors.append(f'{pid}: system.{key}={system.get(key)!r}')

    if not identity.get('name_ko'):
        errors.append(f'{pid}: missing identity.name_ko')
    if identity.get('nationality') != 'KOR':
        errors.append(f'{pid}: nationality is not KOR')
    if not identity.get('birth_date'):
        warnings.append(f'{pid}: missing birth_date')
    if physical.get('height_cm') is None:
        warnings.append(f'{pid}: missing height_cm')
    if not system.get('display_code'):
        warnings.append(f'{pid}: missing display_code')
    if 'current_roster' not in player:
        warnings.append(f'{pid}: current_roster absent from Player Master')

codes = [p.get('system', {}).get('display_code') for p in players if p.get('system', {}).get('display_code')]
for code, count in Counter(codes).items():
    if count > 1:
        warnings.append(f'duplicate display_code: {code} x{count}')

print(json.dumps({
    'player_count': len(players),
    'first_id': ids[0] if ids else None,
    'last_id': ids[-1] if ids else None,
    'errors': errors,
    'warning_count': len(warnings),
    'warnings': warnings,
}, ensure_ascii=False, indent=2))

if errors:
    raise SystemExit(1)

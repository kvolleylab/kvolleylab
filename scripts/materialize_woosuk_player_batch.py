#!/usr/bin/env python3
import json
from pathlib import Path

rows = [
    ('SJY-000526','손재영','2000-05-26',178,88,2,4,'OH','경북체육고','p.32'),
    ('OTH-010328','오태훈','2001-03-28',173,60,5,4,'L','문일고','p.32'),
    ('BDH-040209','백동현','2004-02-09',180,75,18,4,'OH','성지고','p.32'),
    ('JIC-020812','장인천','2002-08-12',185,80,3,4,'S','순천제일고','p.32'),
    ('OSB-030609','오승빈','2003-06-09',183,75,7,3,'OH','성지고','p.32'),
    ('KWJ-041213','강원중','2004-12-13',186,95,8,3,'MB','옥천고','p.32'),
    ('MTJ-060101','문태준','2006-01-01',186,99,6,2,'MB','광희고','p.32'),
    ('PCW-070804','박천욱','2007-08-04',175,68,12,1,'OH','문일고','p.32'),
    ('SJH-071024','서재현','2007-10-24',185,90,9,1,'OP','성지고','p.33'),
    ('SJK-070223','송재권','2007-02-23',180,78,15,1,'S','문일고','p.33'),
    ('PSJ-060320','박서준','2006-03-20',188,78,1,1,'MB','성지고','p.33'),
]

batch = []
for number, row in enumerate(rows, start=219):
    code, name, birth_date, height, weight, jersey, grade, position, previous_school, page = row
    batch.append({
        'system': {'player_id': f'KVL-P-{number:06d}', 'display_code': code, 'created_at': '2026-07-12', 'updated_at': '2026-07-12', 'status': 'active', 'data_confidence': 'reviewed', 'id_status': 'permanent'},
        'identity': {'name_ko': name, 'name_en': '', 'name_native': name, 'gender': 'M', 'nationality': 'KOR', 'birth_date': birth_date, 'birth_year': int(birth_date[:4]), 'birth_place': '', 'hand': 'Unknown'},
        'physical': {'height_cm': height, 'weight_kg': weight, 'spike_cm': None, 'block_cm': None},
        'links': {'volleybox': '', 'fivb_profile': '', 'kovo_profile': '', 'instagram': '', 'youtube': '', 'photo': ''},
        'source_ids': ['SRC-DOM-UNIV-2026-WOOSUK-001'],
        'current_roster': {'team_name': '우석대학교 남자배구부', 'season': 2026, 'jersey_number': jersey, 'grade': grade, 'position': position, 'previous_school': previous_school},
        'source_ref': {'file': '대학배구_선수명단_v6.xlsx', 'sheet': '전체_통합DB', 'page': page},
    })

out = Path('data/seed/player_master_registration_batch_woosuk_2026_v1.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(batch, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(out)

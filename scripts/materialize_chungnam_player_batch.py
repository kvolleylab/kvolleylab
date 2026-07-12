#!/usr/bin/env python3
import json
from pathlib import Path

rows = [
    ('KJS-040803','김준서','2004-08-03',179,70,6,4,'S','경북체고','p.28'),
    ('JSH-040315','장승훈','2004-03-15',189,92,10,4,'MB','제천산업고','p.28'),
    ('HDG-041207','황대국','2004-12-07',180,77,5,4,'L','영생고','p.28'),
    ('KMB-040607','김민범','2004-06-07',182,80,8,3,'OH','송림고','p.28'),
    ('KCHJ-050702','김찬종','2005-07-02',188,93,13,3,'MB','천안고','p.28'),
    ('SDG-040117','신동건','2004-01-17',192,78,15,3,'OP','송산고','p.28'),
    ('LDY-050106','이동윤','2005-01-06',196,88,18,3,'MB','경북체고','p.28'),
    ('KJY-060208','김재욱','2006-02-08',176,70,2,2,'L','대전중앙고','p.28'),
    ('LJH-060401','임종현','2006-04-01',184,75,9,2,'OH','제천산업고','p.28'),
    ('CJM-060615','최지민','2006-06-15',195,88,11,2,'MB','대전중앙고','p.28'),
    ('HJY-060705','홍준영','2006-07-05',187,75,1,2,'OH','현일고','p.29'),
    ('PJS-070721','박진수','2007-07-21',188,77,7,1,'MB','광희고','p.29'),
    ('LJH-070701','이지훈','2007-07-01',189,81,3,1,'S','천안고','p.29'),
    ('CSY-070215','조성원','2007-02-15',187,78,12,1,'OP','천안고','p.29'),
    ('CHH-071106','조훈희','2007-11-06',187,82,17,1,'OH','영생고','p.29'),
]

batch = []
for number, row in enumerate(rows, start=191):
    code, name, birth_date, height, weight, jersey, grade, position, previous_school, page = row
    batch.append({
        'system': {'player_id': f'KVL-P-{number:06d}', 'display_code': code, 'created_at': '2026-07-12', 'updated_at': '2026-07-12', 'status': 'active', 'data_confidence': 'reviewed', 'id_status': 'permanent'},
        'identity': {'name_ko': name, 'name_en': '', 'name_native': name, 'gender': 'M', 'nationality': 'KOR', 'birth_date': birth_date, 'birth_year': int(birth_date[:4]), 'birth_place': '', 'hand': 'Unknown'},
        'physical': {'height_cm': height, 'weight_kg': weight, 'spike_cm': None, 'block_cm': None},
        'links': {'volleybox': '', 'fivb_profile': '', 'kovo_profile': '', 'instagram': '', 'youtube': '', 'photo': ''},
        'source_ids': ['SRC-DOM-UNIV-2026-CHUNGNAM-001'],
        'current_roster': {'team_name': '충남대학교 남자배구부', 'season': 2026, 'jersey_number': jersey, 'grade': grade, 'position': position, 'previous_school': previous_school},
        'source_ref': {'file': '대학배구_선수명단_v6.xlsx', 'sheet': '전체_통합DB', 'page': page},
    })

out = Path('data/seed/player_master_registration_batch_chungnam_2026_v1.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(batch, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(out)

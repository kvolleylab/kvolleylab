#!/usr/bin/env python3
import json
from pathlib import Path

rows = [
    ('HSY-040626','황세영','2004-06-26',179,76,12,4,'L','진주동명고','p.30'),
    ('BHJ-040304','방휘진','2004-03-04',175,90,10,4,'S','진주동명고','p.30'),
    ('GSB-051108','기승빈','2005-11-08',184,79,2,3,'OP','광주전자고','p.30'),
    ('KYJ-050624','김용준','2005-06-24',179,72,5,3,'OH','진주동명고','p.30'),
    ('MSH-050227','문시훈','2005-02-27',178,79,14,3,'OH','익산남성고','p.30'),
    ('LSM-050817','이승민','2005-08-17',199,76,18,3,'MB','송산고','p.30'),
    ('KJY-060807','김주원','2006-08-07',185,75,7,2,'OH','천안고','p.30'),
    ('NJG-060424','노진경','2006-04-24',170,60,8,2,'L','진주동명고','p.30'),
    ('LMJ-050331','이민준','2005-03-31',183,71,3,2,'S','동해광희고','p.31'),
    ('KDY-070214','김도영','2007-02-14',185,77,17,1,'MB','진주동명고','p.31'),
    ('KJS-071126','김준석','2007-11-26',183,80,15,1,'OH','대전중앙고','p.31'),
    ('MJY-060325','맹준우','2006-03-25',185,77,9,1,'OP','성지고','p.31'),
    ('BSJ-071207','방세진','2007-12-07',190,79,1,1,'OH','동해광희고','p.31'),
]

batch = []
for number, row in enumerate(rows, start=206):
    code, name, birth_date, height, weight, jersey, grade, position, previous_school, page = row
    batch.append({
        'system': {'player_id': f'KVL-P-{number:06d}', 'display_code': code, 'created_at': '2026-07-12', 'updated_at': '2026-07-12', 'status': 'active', 'data_confidence': 'reviewed', 'id_status': 'permanent'},
        'identity': {'name_ko': name, 'name_en': '', 'name_native': name, 'gender': 'M', 'nationality': 'KOR', 'birth_date': birth_date, 'birth_year': int(birth_date[:4]), 'birth_place': '', 'hand': 'Unknown'},
        'physical': {'height_cm': height, 'weight_kg': weight, 'spike_cm': None, 'block_cm': None},
        'links': {'volleybox': '', 'fivb_profile': '', 'kovo_profile': '', 'instagram': '', 'youtube': '', 'photo': ''},
        'source_ids': ['SRC-DOM-UNIV-2026-GYEONGSANG-001'],
        'current_roster': {'team_name': '경상국립대학교 남자배구부', 'season': 2026, 'jersey_number': jersey, 'grade': grade, 'position': position, 'previous_school': previous_school},
        'source_ref': {'file': '대학배구_선수명단_v6.xlsx', 'sheet': '전체_통합DB', 'page': page},
    })

out = Path('data/seed/player_master_registration_batch_gyeongsang_2026_v1.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(batch, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(out)

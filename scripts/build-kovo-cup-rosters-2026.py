#!/usr/bin/env python3
"""Build Cup pamphlet snapshots from the archived comparison (read-only XLSX).

Usage: python build-kovo-cup-rosters-2026.py comparison.xlsx pro-master-rows.json pamphlet.pdf
The supplementary JSON contains A:J values of the 14 existing team sheets.
No Player MASTER mutation, new IDs, name-only matching, or current-roster substitution.
"""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'KVL-SRC-KOVOCUP-2026-PAMPHLET'
COUNTRIES = {'대한민국':'KOR','미국':'USA','이란':'IRI','파키스탄':'PAK','브라질':'BRA','중국':'CHN'}
EXTRAS = {'타루샤':'THARUSHA CHAMATH','리누스':'LINUS WEBER','아라우조':'RAFAEL ARAUJO','마틴':'METIN AHMADI'}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def date(value):
    return str(value or '')[:10].replace('.', '-')

def main(comparison, supplements, pamphlet):
    workbook = openpyxl.load_workbook(comparison, read_only=True, data_only=True)
    rows = list(workbook['전체선수대조'].values)[8:]
    teams = read(Path(supplements))
    identities = {x['player_id']:x for x in read(ROOT/'data/national/player_id_links_v1.json')['links']}
    for filename in ['data/master/player_master_229_v2.json','data/master/player_master_school_v1.json']:
        raw = read(ROOT/filename)
        for p in raw if isinstance(raw,list) else raw['players']:
            identities.setdefault(p['system']['player_id'], p['identity'])
    audit = {'sourceId':SOURCE,'verifiedAt':'2026-10-27','sourceTitle':'2026 여수·NH농협컵 프로배구대회 공식 팸플릿',
             'sourceSha256':hashlib.sha256(Path(pamphlet).read_bytes()).hexdigest(),
             'comparisonSha256':hashlib.sha256(Path(comparison).read_bytes()).hexdigest(),
             'scope':'Pamphlet-listed players; not match-day entries or current club membership.',
             'profileRule':'Reuse the pre-existing ID only after exact Korean name + date of birth; conflicts remain unlinked.',
             'nationalityRule':'Existing reviewed team-sheet country values are retained only when explicit; pending values are not inferred. Pamphlet does not state nationality.',
             'supplementaryFields':'English names, explicit country values and Volleybox URLs come from existing V-League team sheets A:J, matched on Korean name and prior DOB. Four additional English names are transcribed from the pamphlet. Country is a legacy team-sheet field; missing values stay unknown.',
             'teams':[],'unlinked':[],'conflicts':[]}
    combined = {}
    for gender, label in [('men','남자부'),('women','여자부')]:
        folder = ROOT/'data/competitions'/f'kovo-cup-{gender}-2026'
        conf, data = read(folder/'config.json'), read(folder/'data.json')
        rosters = {}
        for team in data['participants']:
            players=[]
            for row in rows:
                if row[0]!=label or row[1]!=team['name'] or row[19]!='포함': continue
                name, dob = row[2], date(row[11])
                sheet = ('남_' if gender=='men' else '여_')+team['name']
                candidates=[r for r in teams.get(sheet,[])[5:] if len(r)>5 and r[1]==name and date(r[5])==date(row[10])]
                supplement=candidates[0] if len(candidates)==1 else []
                en = supplement[2] if len(supplement)>2 and supplement[2] else EXTRAS.get(name,'')
                country=supplement[8] if len(supplement)>8 and supplement[8] in COUNTRIES else None
                vb=supplement[9] if len(supplement)>9 and re.match(r'^https://(?:[a-z]+\.)?volleybox\.net/',supplement[9] or '') else None
                pid=row[17]
                identity=identities.get(pid,{})
                verified=bool(pid and identity.get('name_ko')==name and identity.get('birth_date')==dob and not row[21])
                p={'number':row[5],'name':name,'en':en,'position':row[7],'heightCm':row[9],
                   'dob':dob,'nationality':country,'nationalityCode':COUNTRIES.get(country),
                   'playerId':pid if verified else None,'volleybox':vb,'sourceId':SOURCE,'sourcePage':row[13],
                   'recordStatus':'pamphlet-transcribed','profileLinkStatus':'exact-match' if verified else 'pending'}
                notes=[]
                if row[12]:
                    notes.append(str(row[12]).replace(' 00:00:00',''))
                    audit['conflicts'].append({'team':team['code'],'name':name,'difference':notes[-1],'sourcePage':row[13]})
                if row[10] and date(row[10])!=dob:
                    p['sourceDob']=dob;p['comparisonDob']=date(row[10]);p['dob']=None
                    p['dobStatus']='source-conflict'
                if row[21]:
                    p['sourceDob']=dob;p['dob']=None;p['dobStatus']='calendar-unconfirmed'
                    notes.append('기존 자료에 음력 표기 있음. 양력 생년월일 확인 중.')
                if notes:p['sourceNote']='기존 명단과 팸플릿 표기 비교: '+' / '.join(notes)
                if not verified:audit['unlinked'].append({'team':team['code'],'name':name,'existingId':pid,'reason':'DOB conflict' if pid else 'No verified existing profile ID'})
                players.append(p)
            assert players,team
            assert len({p['number'] for p in players})==len(players),team
            players.sort(key=lambda p:(float(p['number']),p['name']))
            roster={'statusLabel':f'팸플릿 수록 {len(players)}명','sourceId':SOURCE,'sourcePage':players[0]['sourcePage'],
                    'sourceTitle':audit['sourceTitle'],'rosterKind':'official-pamphlet','players':players}
            rosters[team['code']]=roster
            team['rosterCount']=len(players)
            audit['teams'].append({'gender':gender,'teamCode':team['code'],'name':team['name'],'count':len(players),
                                  'profileLinks':sum(bool(p['playerId']) for p in players),'sourcePage':players[0]['sourcePage']})
        assert sum(len(r['players']) for r in rosters.values())==({'men':130,'women':121}[gender])
        conf['structure']['roster'].update({'profile':'club','placement':'below-participants',
            'title':'2026 KOVO컵 선수명단','selectHint':'팀을 선택하면 아래에서 2026 KOVO컵 선수명단을 볼 수 있습니다.'})
        conf['modules']=[x for x in conf['modules'] if x['id']!='rosters']+[{'id':'rosters','source':'rosters.json'}]
        data['rosterNote']='공식 팸플릿 수록 명단 · 실제 경기별 엔트리와 다를 수 있습니다.'
        data['rosterSourceNote']='2026 여수·NH농협컵 공식 팸플릿 기준. 국적은 기존 검수자료에서 확인된 값만 표시합니다. 자료가 다른 생년월일과 음력 여부는 확인 중입니다.'
        data['rosterPrintNote']='공식 팸플릿 수록 선수 · 경기별 엔트리 및 현재 소속과 구분'
        write(folder/'config.json',conf);write(folder/'data.json',data);write(folder/'rosters.json',rosters)
        combined[gender]=rosters
    audit['totalPlayers']=sum(t['count'] for t in audit['teams'])
    audit['profileLinks']=sum(t['profileLinks'] for t in audit['teams'])
    write(ROOT/'data/sources/kovo-cup-2026/roster-audit.json',audit)
    print(json.dumps({'teams':len(audit['teams']),'players':audit['totalPlayers'],'profileLinks':audit['profileLinks'],
                      'dobPending':sum(p['dob'] is None for rs in combined.values() for r in rs.values() for p in r['players'])}))

if __name__=='__main__':main(*sys.argv[1:])

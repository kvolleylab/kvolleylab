#!/usr/bin/env python3
"""Build public season snapshots from reviewed Drive exports and KOVO facts.

Usage: python scripts/build-vleague-rosters-2026-27.py men-drive.txt women-drive.txt public-notices.json
Inputs stay outside the repository. Only allowlisted public profile fields are emitted.
Membership comes from the official-notice projection plus explicitly reviewed later notices;
Cup snapshots supplement identity fields only after the current registration is established.
"""
import collections
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'KVL-SRC-VLEAGUE-2026-27-ROSTER-20261028'
DATE = '2026-10-28'
COUNTRIES = {'대한민국':'KOR','미국':'USA','이란':'IRI','파키스탄':'PAK','브라질':'BRA',
             '중국':'CHN','일본':'JPN','캐나다':'CAN','쿠바':'CUB','독일':'GER',
             '스리랑카':'SRI','태국':'THA','카메룬':'CMR','인도네시아':'IDN','우크라이나':'UKR','세르비아':'SRB'}
POSITIONS = {'세터':'S','아웃사이드히터':'OH','아포짓':'OP','미들블로커':'MB','리베로':'L'}

def read(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def date(s):
    s=str(s or '').replace('.', '-')[:10]
    return s if re.fullmatch(r'\d{4}-\d{2}-\d{2}',s) else None
def number(s): return int(s) if str(s).isdigit() else None
def height(s):
    return float(s) if re.fullmatch(r'\d+(?:\.\d+)?',str(s or '')) else None
def clean(s): return re.sub(r'\s+','',s or '')

def main(men, women, notices_file):
    notices = read(notices_file)
    facts = {}
    for n in notices:
        text=re.sub(r'\s+',' ',n['text']).strip()
        country=re.search(r'국적\s*:\s*(\S+)',text)
        alias=re.search(r'등록명\s*:\s*([^)]*)',text)
        facts[n['id']]={'noticeId':n['id'],'title':n['title'],'publishedAt':n['publishedAt'],
                       'sourceUrl':n['sourceUrl'],'textSha256':hashlib.sha256(n['text'].encode()).hexdigest()}
        if country:
            assert country[1] in COUNTRIES, country[1]
            facts[n['id']].update(nationality=country[1],nationalityCode=COUNTRIES[country[1]],registeredName=alias[1].strip())
    assert len([f for f in facts.values() if 'nationality' in f])==28
    # Both October 27 originals are read directly, not inferred from the parser.
    returned=next(n for n in notices if n['id']==158242)
    released=next(n for n in notices if n['id']==158241)
    assert '이준' in clean(returned['text']) and '13번' in returned['text'] and '아웃사이드히터' in returned['text']
    assert '송민근' in released['text'] and '자유신분' in released['text']
    facts[158242].update(playerName='이준',team='대한항공',action='military-return-registration',number=13,position='OH',effectiveDate='2026-10-27')
    facts[158241].update(playerName='송민근',team='대한항공',action='free-agent',effectiveDate='2026-10-27')
    position_change=next(n for n in notices if n['id']==157686)
    assert '김영태' in position_change['text'] and '아웃사이드히터 → 미들블로커' in position_change['text']
    facts[157686].update(playerName='김영태',team='대한항공',action='position-change',position='MB',effectiveDate='2026-10-17')
    projection_path=ROOT/'data/kovo/official-notices/2026-27/roster_projection.json'
    active=read(projection_path)['active_players']
    active=[p for p in active if not(p['team']=='대한항공' and p['name']=='송민근')]
    assert not any(p['team']=='대한항공' and p['name']=='이준' for p in active)
    active.append({'gender':'남','team':'대한항공','name':'이준','number':'13','position':'아웃사이드히터',
                   'registration_source':returned['sourceUrl'],'last_change_source':returned['sourceUrl'],
                   'last_status':'military-return-registration','latest_change_date':'2026-10-27'})
    changed=[p for p in active if p['team']=='대한항공' and p['name']=='김영태']
    assert len(changed)==1
    changed[0].update(position='미들블로커',last_change_source=position_change['sourceUrl'],latest_change_date='2026-10-17')
    national=read(ROOT/'data/national/national_team_history_2016_2017.json')
    assert national['scope']['country']=='KOR'
    lee=next(p for p in national['rosters'] if p.get('player_id')=='KVL-P-001542' and p['event_id']=='KVL-NT-KOR-M-U19-2017-FIVB')
    assert lee['name_ko']=='이준' and lee['birth_date']=='1999-07-30'
    lee_source=next(s['url'] for s in national['sources'] if s['source_id']=='KVL-SRC-JVA-FIVB-2017-U19-P3-077')
    identities={p['player_id']:p for p in read(ROOT/'data/national/player_id_links_v1.json')['links']}
    for filename in ['data/master/player_master_229_v2.json','data/master/player_master_school_v1.json']:
        raw=read(ROOT/filename)
        for p in raw if isinstance(raw,list) else raw['players']:
            identities.setdefault(p['system']['player_id'],p['identity'])
    lookup=collections.defaultdict(set)
    for pid,p in identities.items(): lookup[(p.get('name_ko'),p.get('birth_date'))].add(pid)
    audit={'sourceId':SOURCE,'verifiedAt':DATE,'season':'2026-27',
           'membershipBasis':'Archived KOVO first registration + subsequent changes through 2026-10-20, with directly reviewed 2026-10-27 notices 158241/158242. Not a match-day entry list or a real-time register.',
           'projectionSha256':sha(projection_path),'inputsSha256':{'men':sha(men),'women':sha(women)},
           'profileRule':'Unique exact Korean name + DOB in existing canonical identities; known source conflicts remain unlinked.',
           'fieldScope':'Public names, number, position, DOB, height, nationality, verified profile and Volleybox URLs only. No salaries, private notes or authenticated Drive links.',
           'nationalityRule':'Foreign/Asian-quota nationalities from all 28 KOVO registration originals; other explicit reviewed MASTER values retained. Unknown is not inferred.',
           'teams':[],'unlinked':[],'pending':[],'excluded':[],
           'supplementalChanges':[facts[157686],facts[158241],facts[158242]],
           'resolvedReviewItems':[{'name':'김영태','issue':'Direct original 157686 resolves the trainee-suffix parser mismatch: MB, effective 2026-10-17.'}]}
    for gender,sx,src in [('men','남',men),('women','여',women)]:
        segments=Path(src).read_text(encoding='utf-8').split('\f')
        sheets={}
        for segment in segments[3:10]:
            rows=list(csv.reader(io.StringIO(segment)))
            team=rows[0][1].split('|')[1].strip()
            sheets[team]=[r for r in rows[5:] if len(r)>21 and r[2]]
        history=list(csv.DictReader(io.StringIO(segments[0])))
        folder=ROOT/'data/competitions'/f'v-league-{gender}-2026-27'
        config,data=read(folder/'config.json'),read(folder/'data.json')
        cup=read(ROOT/'data/competitions'/f'kovo-cup-{gender}-2026/rosters.json')
        rosters={}
        for team in data['participants']:
            players=[]
            registrations=[p for p in active if p['gender']==sx and p['team']==team['name']]
            for a in registrations:
                nid=int(a['registration_source'].rsplit('/',1)[1]);fact=facts.get(nid,{})
                name=fact.get('registeredName',a['name'])
                rows=[r for r in sheets[team['name']] if clean(r[2])==clean(name)]
                assert len(rows)<=1,(team['name'],name)
                r=rows[0] if rows else None
                cp=next((p for p in cup[team['code']]['players'] if p['name']==name),None)
                p={'number':number(a['number']),'name':name,'en':r[3] if r else cp['en'] if cp else '',
                   'position':POSITIONS.get(a['position'],r[5] if r else None),
                   'heightCm':height(r[7]) if r else cp['heightCm'] if cp else None,
                   'dob':date(r[6]) if r else cp['dob'] if cp else None,
                   'nationality':fact.get('nationality') or (r[9] if r and r[9] in COUNTRIES else None),
                   'nationalityCode':fact.get('nationalityCode') or (COUNTRIES.get(r[9]) if r else None),
                   'playerId':None,'volleybox':r[10] if r and re.match(r'^https://(?:[a-z]+\.)?volleybox\.net/',r[10]) else None,
                   'sourceId':SOURCE,'registrationSource':a['registration_source'],'lastChangeSource':a['last_change_source'],
                   'registrationDate':a['latest_change_date'],'recordStatus':'reviewed-notice-snapshot',
                   'profileLinkStatus':'pending','profileBasis':'reviewed-season-master' if r else 'official-cup-pamphlet-2026'}
                if fact.get('nationality'): p['nationalitySource']=fact['sourceUrl']
                if name=='이준' and team['code']=='KAL':
                    old=[h for h in history if h['성명_원문']==name and '대한항공' in h['구단']]
                    assert len(old)==1
                    old=old[0];p.update(en=old['영문명_원문'],dob=date(old['생년월일']),heightCm=height(old['신장_cm']),
                        nationality='대한민국',nationalityCode='KOR',nationalitySource=lee_source,
                        profileBasis='official-media-guide-2024-25',sourceNote='2026-10-27 전역 등록 공시. 생년월일·영문명·키는 2024-25 공식 미디어가이드 참고이며 현재 측정값과 다를 수 있습니다.')
                if cp and cp.get('dobStatus'):
                    p.update(dob=None,dobStatus=cp['dobStatus'],sourceDob=cp.get('sourceDob'),comparisonDob=cp.get('comparisonDob'),sourceNote=cp['sourceNote'])
                elif not p.get('sourceNote'):
                    p['sourceNote']='소속·등번호·포지션은 시즌 등록 공시 기준. 기본 프로필은 기존 검수자료 및 공식 미디어가이드 참고이며 현재 측정값과 다를 수 있습니다.'
                ids=lookup.get((name,p['dob']),set()) if p['dob'] else set()
                if len(ids)==1:p.update(playerId=next(iter(ids)),profileLinkStatus='exact-match')
                else:audit['unlinked'].append({'team':team['code'],'name':name,'reason':'source-conflict' if p.get('dobStatus') else 'no unique exact existing identity'})
                if not p['dob'] or not p['nationality'] or not p['heightCm']:
                    audit['pending'].append({'team':team['code'],'name':name,'fields':[key for key in ['dob','nationality','heightCm'] if not p[key]]})
                assert p['number'] is not None and p['position'] in {'S','OH','OP','MB','L'},p
                players.append(p)
            assert len({p['number'] for p in players})==len(players),team
            players.sort(key=lambda p:(p['number'],p['name']))
            rosters[team['code']]={'statusLabel':f'등록 공시 기준 {len(players)}명','sourceId':SOURCE,
                'rosterKind':'season-notice-snapshot','asOf':'2026-10-27','sourceUrl':'https://kovo.co.kr/news/official-notices',
                'sourceLinkLabel':'KOVO 공식 공시','players':players}
            team['rosterCount']=len(players)
            audit['teams'].append({'gender':gender,'teamCode':team['code'],'name':team['name'],'count':len(players),'profileLinks':sum(bool(p['playerId']) for p in players)})
            for r in sheets[team['name']]:
                if not any(p['name']==r[2] for p in players):audit['excluded'].append({'team':team['code'],'name':r[2],'reason':'not in reviewed active registration projection'})
        config['structure'].update(presentation='domestic-home-v2',presentationThemeFamily='domestic',presentationCategory='pro-league',
            divisionLabel='남자부' if gender=='men' else '여자부',hubUrl='v-league.html',hubCategoryLabel='프로 V-리그',hubLabel='V-리그',
            eyebrow='PRO VOLLEYBALL · V-LEAGUE',heroTagline=config['competition']['officialName'],overviewTeamCount=7,
            overviewSummary={'title':'시즌 안내','items':[{'label':'정규리그','value':'7개 구단 · 6라운드 · 126경기'},
                {'label':'포스트시즌','value':'준PO · 단판 / PO · 3전 2선승 / 챔피언결정전 · 5전 3선승'},
                {'label':'선수명단','value':'2026-10-27 등록 공시까지 대조 · 경기별 엔트리와 구분'}]})
        config['structure']['labels']['knockoutTab']='포스트시즌'
        config['structure']['participants'].update(sort='name-ko',searchLabels={'label':'참가팀 검색','placeholder':'팀명 검색','sortNote':'팀명 가나다순','emptyMessage':'해당 팀을 찾을 수 없습니다.'})
        config['structure']['roster'].update(profile='club',placement='below-participants',title='2026-27 V-리그 선수명단',
            printLabel='시즌 등록 공시 기준 명단',selectHint='팀을 선택하면 아래에서 2026-27 V-리그 선수명단을 볼 수 있습니다.')
        config['modules']=[m for m in config['modules'] if m['id']!='rosters']+[{'id':'rosters','source':'rosters.json'}]
        config['seo']['title']=config['competition']['displayName']+' | K-Volley Lab'
        config['seo']['description']=config['competition']['displayName']+' 경기일정, 정규리그 순위, 참가팀 선수명단과 포스트시즌.'
        data['rosterNote']='2026-10-27 등록 공시까지 대조한 시즌 명단 · 실제 경기별 엔트리와 다를 수 있습니다.'
        data['rosterSourceNote']='KOVO 등록·이적·해지·해외임대 공시와 시즌 검수명단 대조. 외국인·아시아쿼터 국적은 등록 공시 원문 기준입니다. 기본 프로필은 공식 미디어가이드 등 기존 검수자료를 참고하며 자료가 다른 생년월일은 확인 중입니다.'
        data['rosterPrintNote']='2026-27 시즌 등록 공시 기준 · 2026-10-27까지 대조 · 경기별 엔트리와 구분'
        write(folder/'config.json',config);write(folder/'data.json',data);write(folder/'rosters.json',rosters)
    audit['totalPlayers']=sum(t['count'] for t in audit['teams']);audit['profileLinks']=sum(t['profileLinks'] for t in audit['teams'])
    write(ROOT/'data/sources/v-league-2026-27/roster-audit.json',audit)
    write(ROOT/'data/sources/v-league-2026-27/reviewed-notices-20261028.json',{'verifiedAt':DATE,'sourceId':SOURCE,'facts':list(facts.values())})
    print(json.dumps({k:audit[k] for k in ['totalPlayers','profileLinks','pending']},ensure_ascii=False))

if __name__=='__main__':main(*sys.argv[1:])

"""Compile reviewed evidence into a portable, versioned public projection. No network writes."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-11-16'
BASE = '811f270f3dddc04bb0df0e5ed14ddb9ba1b11c07'
load = lambda name: json.loads((ROOT / 'data' / name).read_text())
old, recent, olympic = load('major_research.json'), load('current_research.json'), load('olympic_research.json')
sources = {}
def source(key, item):
    sources[key] = {'id': key, 'title': item['title'], 'url': item['url'],
                    'publisher': item.get('publisher', '공식 협회·연맹'), 'verifiedAt': DATE,
                    'access': item.get('access', 'official_source_reviewed'),
                    'locator': item.get('locator'), 'version': item.get('version'),
                    'publishedAt': item.get('published', item.get('publishedAt'))}
for key, s in old['sources'].items(): source('hist-'+key,s)
for s in recent['sources']: source('now-'+s['id'],s)
for s in olympic['sources']: source('oly-'+s['id'],s)

events = []
def event(id, year, name, official, category, participated, confirmed, result, ids, **extra):
    e = dict(id=id, competitionId=id, country='KOR', gender='M', ageCategory='senior',
             year=year, editionYear=year, heldYear=year, nameKo=name, officialName=official,
             category=category, startDate=None, endDate=None, dateScope='competition',
             eventStatus='completed', actualParticipation=participated,
             participationConfirmed=confirmed, participationStatus='participated' if participated else 'not_qualified',
             finalRank=None, result=result, qualificationOutcomes=[], qualifierParticipation=None,
             qualificationPath=None, eliminationStage=None, eliminationMatch=None, matches=[],
             importance='normal', displayStyle='neutral', verificationStatus='confirmed',
             verificationScope='실제 참가 여부·표시 결과', fieldVerification={}, sourceIds=ids,
             officialSourceUrls=[sources[s]['url'] for s in ids], verifiedAt=DATE, updatedAt=DATE,
             notes=[], existingLinks={})
    e.update(extra)
    e['fieldVerification'] = {**e['fieldVerification'], 'participation':'confirmed',
        'result':'pending' if e['eventStatus']!='completed' else 'confirmed',
        'dates':'confirmed' if e['startDate'] and e['endDate'] else 'partial' if e['endDate'] else 'unverified'}
    events.append(e)
    return e

for r in old['entries']:
    q=[]
    for o in r.get('qualificationOutcomes',[]):
        q.append({'target':o['targetEvent'],'status':o['status'],'label':o.get('label') or o.get('reason'),
                  'reason':o.get('reason'),'route':o.get('route'),'sourceIds':['hist-'+s for s in r['sourceKeys']]})
    e=event(r['id'],r['year'],r['nameKo'],r['officialName'],r['category'],r['actualParticipation'],r['participationConfirmed'],r['result'],['hist-'+s for s in r['sourceKeys']],startDate=r['startDate'],endDate=r['endDate'],finalRank=r['finalRank'],importance=r['importance'],notes=r.get('notes',[]),qualificationOutcomes=q,matches=r.get('matches',[]),verificationStatus=r['verificationStatus'])
    if r['id']=='kor-m-asian-games-2023':
        e['editionYear']=2022
        e['result']='7위'
        e['notes'].append('2022 항저우 아시안게임은 2023년에 개최. 대회 명칭과 실제 개최연도를 별도로 보존합니다.')
    if r['id']=='kor-m-challenger-cup-2022': e['result']='3위';q[0]['label']='2023 VNL 승격권 미획득'
    if r['id']=='kor-m-avc-challenge-2024': e['result']='3위';q[0]['label']='챌린저컵 아시아 우승팀 출전권 미획득'
    if r['id']=='kor-m-vnl-2018': q[0]['label']='2019 VNL 잔류 실패'
    if not r['actualParticipation']: q[0]['label']='본선 진출 실패'

for r in olympic['olympics']:
    ids=['oly-'+s for s in r['sourceIds']]
    q=[{'target':r['id'],'status':r['qualificationStatus'],'label':'올림픽 출전' if r['participated'] else '본선 진출 실패','sourceIds':ids}]
    qp=r['qualifierParticipation'] if isinstance(r['qualifierParticipation'],bool) else None
    e=event(r['id'],r['year'],r['nameKo'],r['nameOfficial'],'olympics',r['participated'],r['participated'],r['result'],ids,finalRank=r['rank'],qualificationOutcomes=q,importance='key',displayStyle='gate' if r['participated'] else 'neutral',verificationStatus=r['verifiedStatus'],notes=r.get('caveats',[]),qualificationPath=r.get('reason'),qualifierParticipation=qp,eliminationStage=r.get('eliminationStage'),eliminationMatch=r.get('eliminationMatch'),heldYear=r.get('heldYear',r['year']))
    e['fieldVerification']['qualifierParticipation']='confirmed' if qp is not None else 'unverified'
    if r['year']==2020: e['notes'].append('도쿄 2020 본선은 2021년 개최. 출전권 도전이 종료된 2020년 항목에 함께 보존합니다.')
    if 'qualifier' in r:
        z=r['qualifier'];match=r.get('eliminationMatch')
        event(z['id'],z['year'],z['nameKo'],z['nameOfficial'],'olympic-qualifier',True,True,z['result'],ids,startDate=z['startDate'],endDate=z['endDate'],finalRank=z['rank'],importance='key',qualificationOutcomes=[{'target':r['id'],'status':'not_qualified','label':'올림픽 출전권 미획득','sourceIds':ids}],qualifierParticipation=True,eliminationStage=r.get('eliminationStage'),eliminationMatch=match,notes=r.get('caveats',[]),matches=([{'date':match['date'],'stage':'준결승','opponent':match['opponent'],'setScore':match['score'],'setScores':match['sets']}] if match else []))
    if r['year'] in (2016,2024):
        label='최종예선 참가권 미획득' if r['year']==2016 else '예선 미참가 · 랭킹 출전권 미획득'
        event('qualification-'+str(r['year'])+'-men',r['year'],'올림픽 출전권 경쟁',r['nameOfficial']+' — Qualification','qualification-allocation',None,None,label,ids,participationStatus='not_applicable',importance='key',qualifierParticipation=False,qualificationPath=r['reason'],qualificationOutcomes=[{'target':r['id'],'status':'not_qualified','label':label,'sourceIds':ids}],notes=['실제 예선 경기에 참가해 탈락한 기록과 구분합니다.'])

existing = {
 'kor-m-2026-avc-cup':('avc-men-cup-2026','KVL-COMP-000003','avc-men-cup.html'),
 'kor-m-2026-east-asian-championship':('east-asian-men-2026',None,None),
 'kor-m-2026-asian-championship':('avc-men-continental-2026',None,'international-competition-avc-men-continental-2026.html'),
 'kor-m-2026-asian-games':('asian-games-men-2026',None,'competition-engine.html?competition=asian-games-men-2026'),
}
for r in recent['records']:
    ids=['now-'+s for s in r['sources']]
    q=[{**o,'sourceIds':ids} for o in r['qualificationOutcomes']]
    e=event(r['id'],r['year'],r['nameKo'],r['officialName'],r['type'].replace('_','-'),r['participated'],True if r['participationStatus']=='confirmed' else None,r['result'],ids,startDate=r['startDate'],endDate=r['endDate'],finalRank=r['rank'],eventStatus=r['eventStatus'],participationStatus=('participated' if r['participated'] else r['participationStatus']),importance='key' if r['type'] in ['world_cup','olympics','qualification_allocation','asian_championship','world_championship'] else 'major',displayStyle='gate' if r['type'] in ['world_cup','asian_championship','olympics'] else 'neutral',qualificationOutcomes=q,qualificationPath=r.get('qualificationPath'),notes=r.get('notes',[]),matches=r.get('matchResults',[]),dateScope=r.get('dateScope','competition'),verificationStatus=r['verification'])
    if r.get('phaseResult'): e['notes'].insert(0,r['phaseResult'])
    if r['id']=='kor-m-2026-asian-championship':
        e['result']='3위'
        for outcome in e['qualificationOutcomes']:
            if outcome['target']=='2028-olympics-asia-direct': outcome['status']='not_qualified_via_this_route'
    if r['id'] in existing:
        slug,master,href=existing[r['id']]
        e['competitionId']=slug
        e['existingLinks']={'homeProjectionId':slug,'competitionMasterId':master,'kvlHref':href,'homeProjectionPath':'data/national/national-team-home-v2.json','registryId':slug if href else None}
    if r['id']=='kor-m-2027-world-cup': e['location']='폴란드'
    if r['id']=='kor-m-2028-olympics': e['location']='미국 · 로스앤젤레스'

pending=[]
for r in olympic['unverifiedCandidates']:
    pending.append({'year':r['year'],'item':r['claim'],'status':'미확인','note':r['note']})
for s in old['unconfirmed']: pending.append({'year':None,'item':s,'status':'부분 확인','note':'확인된 참가·결과와 미확인 세부 필드를 분리해 보존합니다.'})
for r in recent['unresolved']: pending.append({'year':None,'item':r['item'],'status':'미확인' if r['status']=='unverified' else '부분 확인','note':r['reason']})
for e in events:
    # Records can be verified for participation/result while dates remain unknown.
    if not e['startDate']: e['notes'].append('개최연도는 확인했으며 정확한 대회 시작·종료일은 추가 확인 중입니다.' if not e['endDate'] else '대회 종료일 확인 · 시작일은 추가 확인 중입니다.')
    if e['category']=='olympics' and e['actualParticipation'] is False: e['dateScope']='edition_year'
    e['sourceIds']=list(dict.fromkeys(e['sourceIds']))
events.sort(key=lambda e:(e['year'],e['startDate'] or e['endDate'] or f"{e['year']}-99-99",e['category']=='olympics',e['id']))
db={'schemaVersion':1,'version':'v1','verifiedAt':DATE,'updatedAt':DATE,'baseCommit':BASE,
    'scope':{'country':'KOR','gender':'M','ageCategory':'senior','startYear':2000,'endYear':2028},
    'cycle':{'name':'ROAD TO LA28','olympicYear':2028,'startYear':2025},
    'displayPolicy':{'recentYears':3,'currentYear':2026,'archiveThrough':2023,'unknownDates':'known-dates-first'},
    'coverageNote':'2000–2028 주요 기록을 선별 수록했습니다. 기록이 없거나 날짜가 미확인인 것은 대한민국의 불참을 의미하지 않습니다.',
    'sources':list(sources.values()),'events':events,'unresolved':pending,'conflicts':recent.get('conflicts',[]),
    'integration':{'mode':'reviewed_static_projection','productionChanged':False,'automatedSyncEnabled':False,
       'qualificationMasterStatus':'READ_VERIFIED_STALE_2026_07_25','historyScopeFinding':'기존 national_team_history_2000_2019 및 v1은 U18–U23 연령별 기록. 성인 연대기로 자동 전환하지 않음.',
       'existingInputs':['data/master/competition_master.json','data/international/senior-competitions.json','data/national/national-team-home-v2.json','data/national/continental-championships-2026.json']}}
(ROOT/'data'/'roadmap_v1.json').write_text(json.dumps(db,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'events':len(events),'sources':len(sources),'unresolved':len(pending),'years':len(set(e['year'] for e in events))}))

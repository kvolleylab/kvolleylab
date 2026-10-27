#!/usr/bin/env python3
"""Build NSF youth snapshots from archived official bracket, detail and medal records.
Usage: python scripts/build-youth-festival-2026.py /path/to/youth-festival-2026
No Player MASTER or existing team identity is changed.
"""
import copy, json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
DIVS = [('men-u12','남자 12세 이하부'),('men-u15','남자 15세 이하부'),('women-u12','여자 12세 이하부'),('women-u15','여자 15세 이하부')]
ROUNDS = ['R16','QF','SF','FINAL']
LABELS = {'R16':'1회전','QF':'8강','SF':'준결승','FINAL':'결승'}
PAGE = 'national-youth-sports-festival-2026.html'
SOURCE = 'KVL-SRC-NYSF55-RESULTS-2026'
MEDALS_URL = 'https://meet.sports.or.kr/junior/medal/medalClass.do?searchClassCd=08&searchKindCd='
def read(p): return json.loads(p.read_text())
def write(p,d): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def build(source):
    medals = read(source/'medals.json')
    venues = read(source/'venues.json')
    base = read(ROOT/'data/competitions/national-sports-festival-men-general-2026/config.json')
    all_divisions = {}
    for key,label in DIVS:
        raw = read(source/(key+'-complete.json'))
        slug = 'national-youth-sports-festival-'+key+'-2026'
        participants = []
        for t in raw['teams']:
            # Full registered name from the official bracket; detail view truncates three names.
            name=t['ENTRANT_TEAM_NM'];display=t['FULL_NAME']
            assert name==display or name.startswith(display.split('...')[0]),(name,display)
            participants.append({'code':'NYSF55-'+t['ENTRANT_TEAM_CD'],'name':name,'fullName':name,'region':t['SIDO_NM'],'officialTeamId':t['ENTRANT_TEAM_CD'],'drawPosition':int(t['POSITION']),'sourceId':SOURCE})
        teams={t['officialTeamId']:t for t in participants};by_code={t['code']:t for t in participants};matches=[]
        for r in raw['matches']:
            score=list(map(int,r['SCORE'].split(':')))
            assert score==r['DERIVED_SCORE'] and max(score)==2 and min(score)<2
            for i,(h,a) in enumerate(r['SETS']):
                hi,lo=max(h,a),min(h,a);target=15 if i==2 else 25
                assert (hi==target and lo<=target-2) or (hi>target and hi-lo==2),(key,r['RH_CD'],i,h,a)
            round_={'1':'R16','7':'QF','8':'SF','9':'FINAL'}[r['RH_CD'][2]]
            home,away=teams[r['ENTRANT_TEAM_CD_L']]['code'],teams[r['ENTRANT_TEAM_CD_R']]['code']
            assert ('NYSF55-'+r['WINNER_TEAM_CD'])==(home if score[0]>score[1] else away)
            matches.append({'id':'KVL-M-NYSF55-'+r['DETAIL_CLASS_CD']+'-'+r['RH_CD'],'date':'2026-'+r['GM_DT'].replace('/','-'),'time':r['GM_STM'],'timeStatus':'scheduled','stage':LABELS[round_],'round':round_,'home':{'code':home},'away':{'code':away},'score':{'home':score[0],'away':score[1],'sets':[{'home':h,'away':a} for h,a in r['SETS']]},'venueLabel':venues[raw['label']],'sourceId':SOURCE,'sourceUrl':r['DETAIL_URL'],'dataStatus':'verified'})
        win=lambda m:m['home']['code'] if m['score']['home']>m['score']['away'] else m['away']['code']
        lose=lambda m:m['away']['code'] if m['score']['home']>m['score']['away'] else m['home']['code']
        for m in matches:
            if m['round']=='FINAL':continue
            nxt=ROUNDS[ROUNDS.index(m['round'])+1]
            targets=[n for n in matches if n['round']==nxt and win(m) in [n['home']['code'],n['away']['code']]]
            assert len(targets)==1;m['nextMatchId']=targets[0]['id']
        final=next(m for m in matches if m['round']=='FINAL');slots={'FINAL':[{'matchId':final['id']}]};by_id={m['id']:m for m in matches}
        for i in [2,1,0]:
            slots[ROUNDS[i]]=[]
            for parent in slots[ROUNDS[i+1]]:
                n=by_id[parent['matchId']]
                for side in ['home','away']:
                    code=n[side]['code'];previous=[m for m in matches if m['round']==ROUNDS[i] and win(m)==code]
                    if previous:assert len(previous)==1;slots[ROUNDS[i]].append({'matchId':previous[0]['id']})
                    else:assert i==0;slots[ROUNDS[i]].append({'byeTeam':code})
        ranks=[]
        for medal in medals:
            if medal['division']!=raw['label']:continue
            candidates=[t for t in participants if t['region']==medal['region'] and t['name']==medal['team']]
            assert len(candidates)==1;team=candidates[0];rank={'금':1,'은':2,'동':3}[medal['medal']]
            assert team['code']==win(final) if rank==1 else team['code']==lose(final) if rank==2 else team['code'] in [lose(m) for m in matches if m['round']=='SF']
            ranks.append({'rank':rank,'code':team['code'],'team':team['name'],'result':('우승' if rank==1 else '준우승' if rank==2 else '공동 3위')+' · '+team['region'],'confirmed':True,'sourceId':'KVL-SRC-NYSF55-MEDALS-2026'})
        assert len(ranks)==4 and len(matches)==len(participants)-1
        c=copy.deepcopy(base);c['slug']=slug
        c['competition'].update(competitionId='KVL-COMP-NYSF55-'+key.upper()+'-2026',displayName='제55회 전국소년체육대회 배구 · '+label,officialName='제55회 전국소년체육대회 배구 '+label,gender='women' if key.startswith('women') else 'men')
        c['structure'].update(divisionKey=key,divisionLabel=label,heroTitle='제55회 전국소년체육대회 배구',hubUrl='comprehensive-competitions.html',eyebrow='KVL DOMESTIC · NATIONAL YOUTH SPORTS FESTIVAL')
        c['structure']['participants'].update(groupLabel=label+' 참가팀',linkMode='team-results')
        c['structure']['participants']['searchLabels'].update(label='참가팀 검색',placeholder='학교명 또는 시·도 검색')
        c['structure']['roster']={'mode':'none'}
        c['structure']['knockout']['title']=label+' 전체 토너먼트'
        c['seo']={'title':'제55회 전국소년체육대회 배구 '+label+' | K-Volley Lab','description':'제55회 전국소년체육대회 배구 '+label+' 참가팀, 대진표, 경기결과와 입상팀.'}
        d={'status':'completed','stageLabel':label+' · 경기 종료','dateLabel':'2026-05-23 ~ 2026-05-26','locationLabel':'부산광역시','venueLabel':venues[raw['label']],'venuePrimary':venues[raw['label']],'venueSecondary':venues[raw['label']],'groupCount':0,'knockoutTeamCount':len(participants),'activeOverviewNote':'','scheduleNote':'한국시간(KST) · 공식 경기일정의 예정시각입니다.','participants':participants,'matches':sorted(matches,key=lambda m:(m['date'],m['time'],m['id'])),'standings':{},'finalRanking':ranks,'champion':by_code[win(final)]['name'],'bracketRounds':[{'round':r,'label':LABELS[r],'slots':slots[r]} for r in ROUNDS],'qualifications':[],'divisionLinks':[{'key':k,'label':l,'gender':'women' if k.startswith('women') else 'men','url':PAGE+'?competition=national-youth-sports-festival-'+k+'-2026'} for k,l in DIVS],'resourcesNote':'대한체육회 공식 대진표·세부전적·메달명세를 2026.10.27 대조했습니다.','resources':[{'title':'대한체육회 공식 대진표 · '+label,'url':raw['url']},{'title':'대한체육회 공식 배구 메달명세','url':MEDALS_URL},{'title':'대한배구협회 경기결과 및 중계 안내','url':'https://www.kva.or.kr/info/m/notice/view.do?boardSeq=2355'}],'domesticRules':{'knockout':{'title':'전국소년체전 배구 토너먼트','body':'2세트를 먼저 이기는 팀이 다음 라운드로 진출합니다. 공식 대진 결과와 메달명세에 따라 준결승 패배 두 팀은 공동 3위로 표시합니다.','sourceUrl':raw['url']}},'sourceVerification':{'checkedAt':'2026-10-27','officialParticipants':len(participants),'officialMatches':len(matches),'verifiedMatches':len(matches),'sourceConflicts':[]}}
        folder=ROOT/'data/competitions'/slug;write(folder/'config.json',c);write(folder/'data.json',d);all_divisions[key]=raw
        print(key,len(participants),len(matches),d['champion'])
    write(source/'normalized-official-input.json',{'checkedAt':'2026-10-27','divisions':all_divisions,'medals':medals,'medalsUrl':MEDALS_URL,'venues':venues})
if __name__=='__main__':build(pathlib.Path(sys.argv[1]))

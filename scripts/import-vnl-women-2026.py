"""Build a source-scoped VNL women snapshot; never edits any existing MASTER.
Inputs: official schedule API JSON, extracted official standings tables, roster tables.
Source evidence and extraction commands: docs/validation/vnl-production-20261101.md.
"""
from pathlib import Path
import json,sys,hashlib
from datetime import datetime,timedelta,timezone
repo=Path(__file__).resolve().parents[1]
schedule,standings,rosters=map(Path,sys.argv[1:4])
s=json.loads(schedule.read_text());tables=json.loads(standings.read_text());rs=json.loads(rosters.read_text())
base='https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/'
ko=dict(BEL='벨기에',BRA='브라질',BUL='불가리아',CAN='캐나다',CHN='중국',CZE='체코',DOM='도미니카공화국',FRA='프랑스',GER='독일',ITA='이탈리아',JPN='일본',NED='네덜란드',POL='폴란드',SRB='세르비아',THA='태국',TUR='튀르키예',UKR='우크라이나',USA='미국')
iso=dict(BEL='be',BRA='br',BUL='bg',CAN='ca',CHN='cn',CZE='cz',DOM='do',FRA='fr',GER='de',ITA='it',JPN='jp',NED='nl',POL='pl',SRB='rs',THA='th',TUR='tr',UKR='ua',USA='us')
teams={t['no']:{'code':t['code'],'name':ko[t['code']],'en':t['name'],'flag':'https://flagcdn.com/w80/'+iso[t['code']]+'.png','officialTeamId':t['no'],'rosterUrl':base+'teams/women/'+str(t['no'])+'/players/','rosterCount':len(rs[t['code']])} for t in s['allTeams'] if t['tournamentCode']=='WVNL2026'}
bycode={t['code']:t for t in teams.values()};raw=[m for m in s['matches'] if m['gender']=='Women' and m['tournamentNo']==1662]
assert len(raw)==116 and len(teams)==18
matchid=lambda no:'VBW-M-2026-VNL-W-'+str(no)
matches=[]
for m in raw:
 utc=datetime.fromisoformat(m['matchDateUtc'].replace('Z','+00:00'));kst=utc.astimezone(timezone(timedelta(hours=9)))
 local=datetime.fromisoformat(m['matchDateTimeLocal']);offset=(local-utc.replace(tzinfo=None)).total_seconds()/3600;zone='UTC'+('+' if offset>=0 else '')+str(int(offset))
 p=m['pool']['code'];stage,rd={'QF':('8강','QF'),'SF':('준결승','SF'),'F3-4':('3위결정전','BRONZE'),'F1-2':('결승','FINAL')}.get(p,('예선','PRELIMINARY'))
 n=m['matchNoInTournament'];nextno={109:113,110:113,111:114,112:114,113:116,114:116}.get(n)
 nextm=next((x['matchNo'] for x in raw if x['matchNoInTournament']==nextno),None)
 sets=[{'home':x['pointsTeamA'],'away':x['pointsTeamB']} for x in m['sets'] if x['pointsTeamA']!=x['pointsTeamB']]
 assert len(sets)==m['teamAScore']+m['teamBScore'] and sum(x['home']>x['away'] for x in sets)==m['teamAScore']
 matches.append({'id':matchid(m['matchNo']),'sourceId':'VBW-VNL-2026-W-SCHEDULE','officialMatchId':m['matchNo'],'sourceUrl':'https://en.volleyballworld.com'+m['matchCenterUrl'],'date':kst.strftime('%Y-%m-%d'),'time':kst.strftime('%H:%M'),'date_local':local.strftime('%Y-%m-%d'),'time_local':local.strftime('%H:%M'),'localTimeLabel':m['city']+' 현지 '+local.strftime('%H:%M')+' '+zone,'venueLabel':m['court'] or m['city'],'stage':stage,'round':rd,'bracketLabel':rd+str(n-108 if rd=='QF' else n-112) if rd in ['QF','SF'] else rd,'nextMatchId':matchid(nextm) if nextm else '', 'home':{'code':teams[m['teamANo']]['code']},'away':{'code':teams[m['teamBNo']]['code']},'status':'completed','score':{'home':m['teamAScore'],'away':m['teamBScore'],'sets':sets}})
rows=[]
for row in tables[0]:
 code=row['code'];v={c['key'].split()[1]:c['value'] for c in row['cells']};rank=int(v['position']);qual=rank<=7 or code=='CHN'
 rows.append({'rank':rank,'team':{'code':code},'played':int(v['matchestotal']),'wins':int(v['matcheswon']),'losses':int(v['matcheslost']),'points':int(v['matchpoints']),'setRatio':v['setsratio'],'pointRatio':v['pointsratio'],'status':'host-qualified' if code=='CHN' else 'qualified' if qual else 'out','statusLabel':'개최국' if code=='CHN' else '파이널 진출' if qual else '예선 종료'})
 # Independent official standings must agree with the imported preliminary matches.
 games=[m for m in matches if m['stage']=='예선' and code in [m['home']['code'],m['away']['code']]];wins=points=0
 for m in games:
  own='home' if m['home']['code']==code else 'away';other='away' if own=='home' else 'home';a,b=m['score'][own],m['score'][other];wins+=a>b;points+=3 if a>b and b<2 else 2 if a>b else 1 if a==2 else 0
 assert (len(games),wins,len(games)-wins,points)==(rows[-1]['played'],rows[-1]['wins'],rows[-1]['losses'],rows[-1]['points'])
ranks=[]
for row in tables[1]:
 code=row['code'];rank=int(row['cells'][0]['value']);t=bycode[code];ranks.append({'rank':rank,'code':code,'team':t['name'],'en':t['en'],'flag':t['flag'],'result':{1:'우승 · 결승 브라질에 3-1',2:'준우승',3:'3위',4:'4위'}.get(rank,'8강' if rank<=8 else '예선 종료')})
assert len(rows)==18 and len(ranks)==18 and sum(r['wins'] for r in rows)==108
c=json.loads((repo/'data/competitions/vnl-men-2026/config.json').read_text());c.update(slug='vnl-women-2026')
c['competition']={'competitionId':'VBW-TOURNAMENT-1662','displayName':'2026 VNL 여자부','officialName':'Volleyball Nations League 2026 · Women','season':'2026','gender':'women','competitionFamily':'fivb'}
c['structure']['divisionLabel']='여자부';c['structure']['participants']['groupLabel']='VNL 2026 여자부 참가국'
c['hero']={'pcImage':'/assets/images/competitions/vnl-women-2026-hero-pc-v01.webp','mobileImage':'/assets/images/competitions/vnl-women-2026-hero-mobile-v01.webp','alt':'KVL 제작 여자 국제배구 경기 일러스트','showImage':True,'mode':'photo','position':'right top','mobilePosition':'right center','mimeType':'image/webp'}
c['seo']={'title':'2026 VNL 여자부 | K-Volley Lab','description':'2026 VNL 여자부 116경기 일정과 결과, 예선순위, 파이널 대진, 최종순위 및 18개국 공식 등록 선수명단.'}
qualified=[bycode[r['team']['code']]['name'] for r in rows if r['status'] in ['qualified','host-qualified']]
d={'status':'completed','stageLabel':'VNL FINALS','dateLabel':'2026-06-03 ~ 2026-07-26','locationLabel':'글로벌 투어','venueLabel':'파이널 · 마카오','venuePrimary':'글로벌 투어','venueSecondary':'파이널 · 마카오','teamCount':18,'groupCount':108,'matchCount':116,'knockoutTeamCount':8,'champion':'튀르키예','championAchievement':'2026 VNL 우승','scheduleNote':'전체 116경기 · 한국시간(KST) 기준 · 경기장 세부명 미제공 시 공식 개최도시 표시','standingsNote':'108경기 종료 · 상위 7개국 + 개최국 중국 파이널 진출','standingsRule':'공식 예선 종합순위 · 결선 경기 제외','meaning':{'eyebrow':'SEASON STRUCTURE','title':'대회 의미 · 시즌 구조','note':'VNL은 예선 리그와 8강 파이널로 구성됩니다.'},'qualifications':[{'id':'finals','className':'is-wc','brand':'VNL 파이널','pill':'8개국','title':'상위 7개국 + 개최국','description':'18개국이 3주에 걸쳐 팀당 12경기를 치릅니다. 예선 상위 7개국과 파이널 개최국 중국이 마카오에서 열리는 8강 토너먼트에 진출합니다.','foot':'예선 → 8강 → 준결승 → 결승·3위결정전','resultTeams':qualified},{'id':'champion','className':'is-la','brand':'시즌 최종 성적','pill':'2026','title':'튀르키예 우승','description':'튀르키예가 결승에서 브라질을 3-1로 꺾고 2026 VNL 여자부 우승을 차지했습니다. 이탈리아가 3위, 중국이 4위를 기록했습니다.','foot':'우승·입상과 18개국 최종 성적','resultTeams':['튀르키예']},{'id':'ranking','className':'is-wr','brand':'FIVB 세계랭킹','pill':'공식 랭킹','title':'VNL 경기 랭킹 반영','description':'VNL 경기 결과는 FIVB World Ranking 계산에 반영됩니다. 공식 경기 자료에서 경기별 랭킹 포인트를 확인할 수 있습니다.','foot':'이 페이지는 별도 국제대회 출전권을 확정하지 않습니다.','resultTeams':[]}], 'matches':matches,'standings':{'rows':rows},'participants':list(teams.values()),'finalRanking':ranks[:4],'finalRankingFull':ranks,'rosters':{code:{'players':ps,'sourceUrl':bycode[code]['rosterUrl'],'sourceId':'VBW-VNL-2026-W-ROSTERS'} for code,ps in rs.items()},'rosterNote':'Volleyball World 2026 대회 공식 명단','rosterSourceNote':'2026-11-01 공식 명단 확인 · 공식 표기명·등번호·포지션만 수록. 한글명·신체정보·소속·KVL Player ID는 미확인.','rosterPendingLabel':'공식 등록 선수명단 확인 중','resources':[{'title':'Volleyball World · VNL 여자부 공식 순위','url':base+'standings/women/'},{'title':'Volleyball World · 2026 대회 방식','url':base+'competition/formula'},{'title':'Volleyball World · VNL 여자부 공식 선수명단','url':base+'teams/women/'},{'title':'Volleyball World · VNL 일정·결과','url':base+'schedule/'},{'title':'Volleyball World · 여자 세계랭킹','url':'https://en.volleyballworld.com/volleyball/world-ranking/women'}],'sourceMetadata':{'driveArchiveId':'1RRGRqNFHywSVpWl5RrGNWkUK63IVneCc','retrievedAt':'2026-11-01','competitionIdentity':'Official Volleyball World tournament 1662; KVL MASTER mapping pending','sourceIds':['VBW-VNL-2026-W-SCHEDULE','VBW-VNL-2026-W-STANDINGS','VBW-VNL-2026-W-ROSTERS'],'inputSha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [schedule,standings,rosters]}}}
folder=repo/'data/competitions/vnl-women-2026';folder.mkdir(exist_ok=True)
for name,obj in [('config.json',c),('data.json',d)]: (folder/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'matches':len(matches),'preliminary':sum(m['stage']=='예선' for m in matches),'teams':len(teams),'players':sum(len(r['players']) for r in d['rosters'].values()),'validation':'official standings agree'},ensure_ascii=False))

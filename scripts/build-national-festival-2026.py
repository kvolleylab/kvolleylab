#!/usr/bin/env python3
"""Build the five NSF107 competition snapshots from archived official records.
Usage: python scripts/build-national-festival-2026.py /path/to/normalized-official-input.json
Only competition config/data are written; team/player MASTER identities are untouched.
"""
import json,sys,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
DIVS=[('men-general','남자 일반부'),('men-university','남자 대학부'),('men-u18','남자 18세 이하부'),('women-general','여자 일반부'),('women-u18','여자 18세 이하부')]
PAGE='national-sports-festival-2026.html'
ROUNDS=['R16','QF','SF','FINAL']; LABELS={'R16':'1회전','QF':'8강','SF':'준결승','FINAL':'결승'}
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def norm(name):return re.sub(r'\s+','',name).replace('대학교','대').replace('여자','여').replace('고등학교','고').replace('중학교','중')
def valid_set(s,index):
 hi,lo=max(s.values()),min(s.values());target=15 if index==4 else 25
 return (hi==target and lo<=target-2) or (hi>target and hi-lo==2)
def main(path):
 source=json.loads(pathlib.Path(path).read_text());logos={}
 for p in (ROOT/'data/competitions').glob('*/data.json'):
  if p.parent.name.startswith('national-sports-festival'):continue
  for t in json.loads(p.read_text()).get('participants',[]):
   if t.get('logo'):
    for n in [t.get('name'),t.get('fullName')]:
     if n:logos[norm(n)]=t['logo']
 summary=[]
 for key,label in DIVS:
  raw=source['divisions'][key];folder=ROOT/'data/competitions'/('national-sports-festival-'+key+'-2026');c=json.loads((folder/'config.json').read_text());d=json.loads((folder/'data.json').read_text())
  teams=[];draw=source['draw']['divisions'][key]['participants'];by_region={p['region']:p for p in draw}
  for t in raw['teams']:
   p=by_region[t['SIDO_NM']];assert int(t['POSITION'])==p['drawOrder'];name=p['name'];result_name=t['FULL_NAME']
   if '.' in result_name:assert name.startswith(result_name.split('.')[0]),(key,name,result_name)
   else:name=result_name
   team={'code':'NSF107-'+t['ENTRANT_TEAM_CD'],'name':name,'fullName':name,'region':t['SIDO_NM'],'officialTeamId':t['ENTRANT_TEAM_CD'],'drawPosition':int(t['POSITION']),'sourceId':'KVL-SRC-NSF107-RESULTS-2026','drawTeamName':p['name'],'drawSourceId':'KVL-SRC-NSF107-DRAW-2026','sourcePage':p['sourcePage']}
   if norm(name) in logos:team['logo']=logos[norm(name)]
   teams.append(team)
  lookup={p['officialTeamId']:p for p in teams};matches=[]
  for r in raw['matches']:
   round_={'1':'R16','7':'QF','8':'SF','9':'FINAL'}[r['RH_CD'][2]];match_id='KVL-M-NSF107-'+r['DETAIL_CLASS_CD']+'-'+r['RH_CD'];sets=[{'home':h,'away':a} for h,a in r['SETS']];h,a=r['DERIVED_SCORE'];original=list(map(int,r['SCORE'].split(':')))
   assert max(h,a)==3 and min(h,a)<3
   # Official summary and set-detail must agree on the winner, even when totals conflict.
   assert (h>a)==(original[0]>original[1])
   m={'id':match_id,'date':'2026-'+r['GM_DT'].replace('/','-'),'time':r['GM_STM'],'timeStatus':'scheduled','stage':LABELS[round_],'round':round_,'bracketLabel':LABELS[round_], 'home':{'code':lookup[r['ENTRANT_TEAM_CD_L']]['code']},'away':{'code':lookup[r['ENTRANT_TEAM_CD_R']]['code']},'score':{'home':h,'away':a,'sets':sets},'venueLabel':d['venueSecondary'],'sourceId':'KVL-SRC-NSF107-RESULTS-2026','sourceUrl':r['DETAIL_URL'],'officialRoundId':r['RH_CD'],'officialRoundLabel':r['ROUND_LABEL'],'officialMatchScore':{'home':original[0],'away':original[1]},'dataStatus':'source-conflict' if r['SCORE_CONFLICT'] else 'verified'}
   if r['SCORE_CONFLICT']:
    m['scoreBasis']='official-set-detail-derived';m['scoreNote']='공식 세부전적의 4세트로 산출한 3–1을 표시합니다. 공식 요약에는 3–0으로 기재되어 원문 간 불일치를 확인 중입니다.'
   invalid_sets=[i+1 for i,s in enumerate(sets) if not valid_set(s,i)]
   if invalid_sets:
    assert match_id=='KVL-M-NSF107-080301-088002' and invalid_sets==[1],(match_id,invalid_sets)
    m.update(dataStatus='source-conflict',scoreBasis='official-match-summary',reportedSets=sets,invalidSetNumbers=invalid_sets,scoreNote='공식 경기결과 3–1을 표시합니다. 원문 1세트 24–25는 2점 차 종료 규칙에 맞지 않아 확인이 필요합니다. 세트 득점은 원문 그대로 보존했습니다.')
    m['score']['sets']=[]
   matches.append(m)
  win=lambda m:m['home']['code'] if m['score']['home']>m['score']['away'] else m['away']['code']
  lose=lambda m:m['away']['code'] if m['score']['home']>m['score']['away'] else m['home']['code']
  for m in matches:
   if m['round']=='FINAL':continue
   nxt=ROUNDS[ROUNDS.index(m['round'])+1];targets=[n for n in matches if n['round']==nxt and win(m) in [n['home']['code'],n['away']['code']]];assert len(targets)==1,(key,m['id']);m['nextMatchId']=targets[0]['id']
  final=next(m for m in matches if m['round']=='FINAL');ordered={'FINAL':[{'matchId':final['id']}]};by_id={m['id']:m for m in matches}
  for index in [2,1,0]:
   round_=ROUNDS[index];ordered[round_]=[]
   for parent in ordered[ROUNDS[index+1]]:
    n=by_id[parent['matchId']]
    for side in ['home','away']:
     p=n[side]['code'];prev=[m for m in matches if m['round']==round_ and win(m)==p]
     assert len(prev)<=1
     if prev:ordered[round_].append({'matchId':prev[0]['id']})
     else:assert index==0;ordered[round_].append({'byeTeam':p})
  ranks=[];medals=[r for r in source['medals']['results'] if r['division']==label.replace(' ','')]
  for medal in medals:
   p=next(p for p in teams if p['region']==medal['region']);rank={'금':1,'은':2,'동':3}[medal['medal']]
   assert p['code']==win(final) if rank==1 else p['code']==lose(final) if rank==2 else p['code'] in [lose(m) for m in matches if m['round']=='SF']
   ranks.append({'rank':rank,'code':p['code'],'team':p['name'],'result':('우승' if rank==1 else '준우승' if rank==2 else '공동 3위')+' · '+p['region'],'confirmed':True,'sourceId':'KVL-SRC-NSF107-MEDALS-2026','officialMedalTeamName':medal['team']})
  assert len(ranks)==4 and len(matches)==len(teams)-1
  d.update(status='completed',stageLabel=label+' · 경기 종료',dateLabel=min(m['date'] for m in matches)+' ~ '+max(m['date'] for m in matches),groupCount=0,knockoutTeamCount=len(teams),activeOverviewNote='',participants=teams,matches=sorted(matches,key=lambda m:(m['date'],m['time'],m['id'])),standings={},finalRanking=ranks,champion=next(r['team'] for r in ranks if r['rank']==1),bracketRounds=[{'round':r,'label':LABELS[r],'slots':ordered[r]} for r in ROUNDS],qualifications=[])
  d['divisionLinks']=[{'key':k,'label':l,'gender':'women' if k.startswith('women') else 'men','url':PAGE+'?competition=national-sports-festival-'+k+'-2026'} for k,l in DIVS]
  d.pop('genderLinks',None)
  d['locationLabel']='제주 · '+('제주시' if key=='men-u18' else '서귀포시');d['venuePrimary']=d['venueSecondary']
  d['scheduleNote']='한국시간(KST) · 공식 예정시각 표기. 첫 경기 이후에는 앞 경기 종료 후 연속 진행되어 실제 시작시각과 다를 수 있습니다.'
  d['resourcesNote']='대한체육회 최종 대진·세부전적·참가선수·메달명세를 2026.10.26 대조했습니다.' if d.get('rosters') else '대한체육회 최종 대진·세부전적·메달명세를 2026.10.26 대조했습니다. 선수 개인명단 연결은 별도 검수 후 제공합니다.'
  d['resources']=[{'title':'대한체육회 공식 대진표 · '+label,'url':raw['url']},{'title':'대한체육회 공식 배구 메달명세','url':source['medals']['sourceUrl']},{'title':'대한배구협회 기술총회 자료 · 경기방식','url':source['technicalUrl']},{'title':'대한배구협회 사전 대진표 및 연습일정','url':source['draw']['sourceUrl']},{'title':'대한배구협회 경기결과·경기시각 안내','url':source['resultsNoticeUrl']}]
  d['domesticRules']={'knockout':{'title':'전국체전 배구 토너먼트 경기방식','body':'모든 부문은 3세트 선취 토너먼트로 진행합니다. 3·4위전과 5~8위 순위결정전은 실시하지 않으며 준결승 패배 두 팀은 공동 3위입니다. 부전승은 공식 참가팀과 승자 진출 경로를 기준으로 표시합니다.','note':'대한배구협회 기술총회 자료 · 1. 경기방법','sourceUrl':source['technicalUrl']}}
  conflicts=[m for m in matches if m['dataStatus']=='source-conflict']
  if conflicts:d['recordNote']=' '.join(m['stage']+' · '+lookup[m['home']['code'].removeprefix('NSF107-')]['name']+'–'+lookup[m['away']['code'].removeprefix('NSF107-')]['name']+': '+m['scoreNote'] for m in conflicts)
  else:d.pop('recordNote',None)
  d['sourceVerification']={'checkedAt':'2026-10-26','officialParticipants':len(teams),'officialMatches':len(matches),'verifiedMatches':len(matches)-len(conflicts),'sourceConflicts':[m['id'] for m in conflicts]}
  c['structure'].update(presentation='domestic-home-v2',audience='comprehensive',divisionKey=key,divisionLabel=label,heroTitle='제107회 전국체육대회 배구',hubUrl='comprehensive-competitions.html',hubLabel='종합대회',eyebrow='KVL DOMESTIC · NATIONAL SPORTS FESTIVAL',hiddenViews=['groups'])
  c['structure']['labels'].update(participantsTitle='참가팀',participantsKpi='참가팀',knockoutTab='대진·최종순위')
  c['structure']['schedule']['stages']=['전체','1회전','8강','준결승','결승']
  c['structure']['knockout']={'mode':'bracket-tree','title':label+' 전체 토너먼트','showFinalRanking':True,'finalRankingTitle':'최종 입상팀 · 공동 3위'}
  c['structure']['participants']={'mode':'flat','groupLabel':label+' 참가팀','linkMode':'team-results','searchLabels':{'label':'참가팀 검색','placeholder':'팀명 또는 시·도 검색','sortNote':'팀명 가나다순','emptyMessage':'검색한 참가팀이 없습니다.'}}
  if d.get('rosters'):
   assert set(d['rosters'])=={t['code'] for t in teams},'Recheck rosters after participant changes'
   for t in teams:t['rosterCount']=len(d['rosters'][t['code']]['players'])
   c['structure']['participants']['linkMode']='team-roster'
   c['structure']['roster']={'mode':'full','layout':'domestic-snapshot','domesticTeamRoute':'competition'}
  c['structure'].pop('kpiTargets',None)
  c['hero']={'pcImage':'/assets/img/home-hero/kvl-home-hero-pc-v01.webp','mobileImage':'/assets/img/home-hero/kvl-home-hero-mobile-v01.webp','showImage':True,'mode':'photo','position':'center center','mobilePosition':'72% center','alt':'K-Volley Lab 배구대회 공통 브랜드 이미지'}
  c['seo']['description']='제107회 전국체육대회 배구 '+label+' 참가팀, 전체 토너먼트 대진, 경기·세트별 결과와 최종 입상팀.'
  write(folder/'config.json',c);write(folder/'data.json',d);summary.append({'division':key,'teams':len(teams),'matches':len(matches),'reportedSets':sum(len(m.get('reportedSets',m['score']['sets'])) for m in matches),'byes':sum('byeTeam' in x for x in ordered['R16']),'conflicts':len(conflicts)})
 print(json.dumps(summary,ensure_ascii=False,indent=2))
if __name__=='__main__':main(sys.argv[1])

"""Read-only adapter: public KVL snapshots -> isolated national hub preview."""
import json, pathlib, shutil, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]; HERE=pathlib.Path(__file__).resolve().parent
read=lambda p:json.loads((ROOT/p).read_text())
# Cross-check the currently rendered AVC group-C roster by exact name + DOB.
def avc_player(p,clubs,rows):
 hits=[x for x in rows if x['koreanName']==p['nameKo'] and x['birthDate']==p['dob']]
 number=hits[0]['number'] if len(hits)==1 else p.get('number')
 club=clubs.get('teams',{}).get('KOR',{}).get(str(number),{})
 return {'name':p['nameKo'],'number':number,'position':p['position'],'club':club.get('club') if club.get('status')=='CONFIRMED' else None,'profileId':profile(p['nameKo'],p['dob'])}

links=read('data/national/player_id_links_v1.json')['links']
def profile(name,dob):
 hits={x['player_id'] for x in links if x['name_ko']==name and x['birth_date']==dob}
 return next(iter(hits)) if len(hits)==1 else None
out={'version':1,'snapshotDate':'2026-11-08','baseCommit':'fc0df22a57b90078cb3d7ba76e6a8cdbdf770ed2','teams':{}}
for gender in ['men','women']:
 slug=f'asian-games-{gender}-2026'; data=read(f'data/competitions/{slug}/data.json'); roster=read(f'data/competitions/{slug}/rosters.json')['KOR']
 names={x['code']:x['name'] for x in data['participants']}; matches=[]
 for x in data['matches']:
  if 'KOR' not in [x['home']['code'],x['away']['code']]:continue
  h=x['home']['code']=='KOR'; sc=x.get('score'); opp=x['away' if h else 'home']['code']
  matches.append({'id':x['id'],'date':x['date'],'time':x.get('time'),'opponent':names.get(opp,opp),'opponentCode':opp,'score':[sc['home' if h else 'away'],sc['away' if h else 'home']] if sc else None,'sets':[[s['home' if h else 'away'],s['away' if h else 'home']] for s in (sc or {}).get('sets',[])],'stage':x.get('placementLabel',x['stage']),'competition':'2026 아시안게임','href':f'competition-engine.html?competition={slug}&view=schedule&date={x["date"]}'})
 rank=next((x['result'] for x in data.get('finalRanking',[]) if x['code']=='KOR' and x.get('confirmed')),None)
 comp=[{'id':slug,'title':'아이치·나고야 아시안게임','family':'games','organization':'아시안게임','dates':data['dateLabel'],'location':data['locationLabel'],'result':rank or '결과 미확인','href':f'competition-engine.html?competition={slug}'}]
 a=read(f'data/competitions/avc-{gender}-continental-2026.json')
 for x in a['matches']:
  if '대한민국' not in [x.get('teamA'),x.get('teamB')]:continue
  h=x['teamA']=='대한민국'; score=[x.get('setsA' if h else 'setsB'),x.get('setsB' if h else 'setsA')]
  matches.append({'id':x['id'],'date':x['date'],'time':x.get('time'),'opponent':x['teamB' if h else 'teamA'],'score':score if all(isinstance(n,int) for n in score) else None,'sets':[(s if h else s[::-1]) for s in x.get('sets',[])],'stage':x['stage'],'competition':'2026 AVC 대륙선수권','href':f'international-competition-avc-{gender}-continental-2026.html'})
 comp.append({'id':f'avc-{gender}-continental-2026','title':'AVC 대륙선수권','family':'avc','organization':'AVC','dates':f'{a["startDate"]} ~ {a["endDate"]}','location':'일본 · 기타큐슈' if gender=='men' else '중국 · 톈진','result':'종료 · 결과 보기','href':f'international-competition-avc-{gender}-continental-2026.html'})
 players=[]
 for p in roster['players']:
  players.append({'number':p.get('number'),'name':p['name'],'position':p['position'].replace('OPP','OP'),'club':p.get('club',{}).get('name') if p.get('club',{}).get('confirmed') else None,'profileId':profile(p['name'],p.get('dob')) if gender=='men' else None,'snapshotId':p['playerId']})
 rosters=[{'id':slug,'label':'2026 아시안게임','status':'대회 등록 명단','players':players,'source':'2026 아시안게임 대회 등록 명단 · KVL 검수 Snapshot','sourceDate':'2026-10-01' if gender=='men' else '2026-09-22','href':f'competition-engine.html?competition={slug}&view=teams'}]
 if gender=='men':
  a=read('data/competitions/avc-men-continental-2026-rosters.json');team=next(x for x in a['teams'] if x['code']=='KOR'); clubs=read('data/competitions/avc-men-continental-2026-clubs-2026-27.json')
  rosters.append({'id':'avc-men-continental-2026','label':'2026 AVC 대륙선수권','status':team['status'],'players':[avc_player(p,clubs,next(t['players'] for t in read('data/competitions/avc-men-continental-2026-rosters-c.json')['teams'] if t['code']=='KOR')) for p in team['players']],'source':'2026 AVC 대륙선수권 · KVL 최종 14명 Snapshot','sourceDate':team['verifiedAt'],'href':'international-competition-avc-men-continental-2026.html#players'})
 else:rosters.append({'id':'avc-women-continental-2026','label':'2026 AVC 대륙선수권','status':'홈 명단 연결 준비','players':[],'source':'대회 상세 페이지에서 등록 자료를 확인하세요.','sourceDate':None,'href':'international-competition-avc-women-continental-2026.html'})
 if gender=='men':
  cup=read('data/matches/avc-2026-calendar.json'); cupmeta=next(x for x in read('data/master/competition_master.json') if x['system']['slug']=='avc-men-cup-2026')
  comp.append({'id':'avc-men-cup-2026','title':'AVC Men’s Cup','family':'avc','organization':'AVC','dates':cupmeta['format']['dates'],'location':'인도 · 아마다바드','result':str(cup['final_standings'].index('KVL-COMP-000003-P07')+1)+'위','href':'avc-men-cup.html'})
  cr=next(x for x in read('data/competition/avc-men-cup-2026-men-rosters.json')['teams'] if x['country_ko']=='대한민국')
  rosters.append({'id':'avc-men-cup-2026','label':'2026 AVC Men’s Cup','status':'공식 엔트리','coach':cr.get('coach'),'players':[{'name':p['name_ko'],'number':p['number'],'position':p['positions'][0],'club':None,'profileId':profile(p['name_ko'],p['dob'])} for p in cr['players']],'source':'Volleyball World 공식 대회 엔트리 · KVL 검수 Snapshot','sourceDate':None,'href':'national-team-tournament-roster.html?competition=avc-men-cup-2026&country=대한민국'})
 out['teams'][gender]={'label':'남자대표팀' if gender=='men' else '여자대표팀','matches':sorted(matches,key=lambda x:x['date']+(x.get('time') or ''),reverse=True),'competitions':comp,'rosters':rosters,'historyAvailable':gender=='men'}
(HERE/'snapshot.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
# Only explicit public projection fields enter the prototype. No salaries/notes/master writes.
if __name__=='__main__':
 import sys
 if len(sys.argv)>1:
  dst=pathlib.Path(sys.argv[1]);dst.mkdir(parents=True,exist_ok=True)
  for f in ['index.html','style.css','app.js','snapshot.json','qa.html']:
   if (HERE/f).exists():shutil.copy2(HERE/f,dst/('national-team.html' if f=='index.html' else f))
  (dst/'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KVL 국가대표팀 프로토타입 v1</title><meta http-equiv="refresh" content="0;url=national-team.html"><a href="national-team.html">국가대표팀 홈 열기</a></html>')
  for folder in ['assets/css','assets/js']:
   shutil.copytree(ROOT/folder,dst/folder,dirs_exist_ok=True)
  for f in ['assets/img/home-hero/kvl-home-hero-pc-v01.webp','assets/img/home-hero/kvl-home-hero-mobile-v01.webp','assets/images/brand/kvl-ball-international-gold.webp','assets/images/brand/kvl-ball-domestic-navywhite.webp','favicon.ico']:
   target=dst/f;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/f,target)
  print('Built independent preview',dst)

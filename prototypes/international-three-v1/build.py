#!/usr/bin/env python3
"""Build an isolated, static review site from immutable KVL production inputs.
No writes outside the prototype output directory; no production source changes.
"""
from pathlib import Path
import json, shutil, re, hashlib, sys, datetime

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
OUT = Path(sys.argv[1]) if len(sys.argv)>1 else HERE/'dist'
OUT.mkdir(parents=True, exist_ok=True)
def read(path): return json.loads((REPO/path).read_text())
def write(path, obj):
    p=OUT/path; p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
def copy(path):
    src=REPO/path; dst=OUT/path; dst.parent.mkdir(parents=True,exist_ok=True)
    if src.is_dir(): shutil.copytree(src,dst,dirs_exist_ok=True)
    else: shutil.copy2(src,dst)
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
for path in ['assets','data/competition','data/matches/avc-2026-calendar.json']:
    copy(path)
for p in (REPO/'data/competitions').glob('avc-men-continental-2026*'): copy(str(p.relative_to(REPO)))
for slug in ['asian-games-men-2026','asian-games-women-2026','vnl-men-2026']: copy('data/competitions/'+slug)
for name in ['avc-men-cup.html','international-competition-avc-men-continental-2026.html','competition-engine.html']:
    p=OUT/'reference'/name; p.parent.mkdir(exist_ok=True)
    reference=(REPO/name).read_text().replace('<head>','<head><base href="/"><meta name="robots" content="noindex,nofollow">',1)
    # Local HTTP review cannot satisfy production's HTTPS canonical guard.
    if name=='competition-engine.html': reference=reference.replace('production:true','production:false')
    p.write_text(reference)

FLAGS={'JPN':'jp','IRI':'ir','KOR':'kr','AUS':'au','BRN':'bh','OMA':'om','NZL':'nz','THA':'th','CHN':'cn','TPE':'tw','IND':'in','QAT':'qa','INA':'id','KAZ':'kz'}
SLUGS=['avc-men-cup-2026','asian-games-men-2026','asian-games-women-2026','avc-men-continental-2026']
def flag(code): return 'https://flagcdn.com/w160/'+FLAGS.get(code,code.lower())+'.png'
def ratio(a,b): return ('MAX' if a else '0.000') if not b else f'{a/b:.3f}'
def settings(c, count=8):
    s=c['structure']; s.update(presentation='international-home-v2',heroPresentation='preserve',meaningPlacement='before-calendar',divisionLabel='여자부' if c['competition']['gender']=='women' else '남자부',hubUrl='https://kvolleylab.com/competition.html?division=national',hubCategoryLabel='국제대회',hubLabel='아시안게임' if c['competition']['competitionFamily']=='games' else 'AVC',overviewMetrics={'scheduleLabel':'전체 일정','third':'qualifiers','teamUnit':'개국','iconStyle':'solid'},teamResults={'summary':'record','preliminaryStages':['조별리그']},finalRankingPresentation='full-table')
    s['participants'].update(linkMode='team-roster',sort='name-ko',searchLabels={'label':'참가국 검색','placeholder':'국가명 검색','sortNote':'국가명 가나다순','emptyMessage':'검색한 국가가 없습니다.'})
    s['labels'].update(rostersTab='참가국·선수명단',knockoutTab='대진·최종순위',participantsTitle='참가국',knockoutKpi=f'{count}강 진출',knockoutKpiUnit='개국')
    return c
def save(slug,c,d,r):
    write('prototype-data/'+slug+'/config.json',c)
    write('prototype-data/'+slug+'/data.json',d)
    write('prototype-data/'+slug+'/rosters.json',r)

# Existing Engine V2 competitions: retain match, participant, standing and player objects.
for gender in ['men','women']:
    slug=f'asian-games-{gender}-2026'; base='data/competitions/'+slug+'/'
    c=settings(read(base+'config.json')); d=read(base+'data.json'); r=read(base+'rosters.json')
    c['structure']['meaningPresentation']={'mode':'compact','type':'C'}
    links={g:'/?competition=asian-games-'+g+'-2026' for g in ['men','women']}
    c['structure']['genderLinks']=links; d['genderLinks']=links
    d['activeOverviewNote']='대회 종료 · '+('이란 금메달 · 대한민국 7위' if gender=='men' else '중국 금메달 · 대한민국 4위')
    if gender=='men': d['standingsNote']='KVL 비교용 표시 기준 · '+d['standingsNote']
    n=d['teamCount']
    d['meaning']={'eyebrow':'ASIAN GAMES 2026','title':'대회 의미 · 메달 경쟁','note':'아시아 종합경기대회의 공식 배구 종목','items':[
        {'title':'아시아 종합대회의 메달 경쟁','description':'아시아 국가대표가 금·은·동메달을 겨루는 무대입니다. LA28 올림픽 직행권을 배정하는 대회는 아닙니다.'},
        {'title':f'{n}개국 · 조별리그 → 8강','description':f'4개 조의 상위 2팀이 8강에 진출했습니다. 메달 토너먼트와 순위결정전으로 1~{n}위를 확정했습니다.'}]}
    d['resources'] += [{'title':'JVA 공식 최종순위','url':f'https://www.jva.or.jp/international/2026/asia_{gender}/?entry=results'},{'title':'JVA 공식 경기 일정·결과','url':f'https://www.jva.or.jp/international/2026/asia_{gender}/?entry=schedule'}]
    save(slug,c,d,r)

def base_config(slug,cid,title,official,teams):
    return settings({'schemaVersion':2,'slug':slug,'competition':{'competitionId':cid,'displayName':title,'officialName':official,'season':'2026','gender':'men','competitionFamily':'avc'},'structure':{'calendar':True,'labels':{'groupsTab':'조별순위','groupsKpi':'조 편성','groupsKpiUnit':'개 조','standingsTitle':'조별순위','standingsEyebrow':'PRELIMINARY ROUND'},'schedule':{'stages':['전체','조별리그','8강','준결승','순위결정전','3위결정전','결승']},'standings':{'mode':'pools-combined','combinedTitle':'예선 종합 비교'},'participants':{'mode':'groups','groupLabel':'공식 참가국'},'roster':{'mode':'full'},'knockout':{'mode':f'bracket-{teams}','title':'결선 토너먼트'}},'hero':{},'seo':{'title':title+' | K-Volley Lab','description':title+' 경기일정·결과, 순위와 대회 당시 등록 선수명단.'},'data':'data.json','modules':[{'id':'rosters','source':'rosters.json'}]},teams)
def basic_data(n,g,m,k,dates,location,venue):
    return dict(status='completed',stageLabel='대회 종료',dateLabel=dates,locationLabel=location,venueLabel=venue,venuePrimary=location,venueSecondary=venue,teamCount=n,groupCount=g,matchCount=m,knockoutTeamCount=k,focusTeamCode='KOR',qualifications=[],resourcesNote='공식 대회·협회 자료',rosterPendingLabel='공식 등록명단',rosterNote='대회 당시 등록 선수명단',rosterSourceNote='운영 KVL 공개 명단을 그대로 연결합니다.',rosterDataNote='기존 ID와 확인된 프로필을 유지하며, 미확인 값은 추정하지 않습니다.',rosterPrintNote='대회 당시 등록 선수명단',rosterMissingLabel='미확인')

# Legacy AVC Cup data-only adapter: stable competition, participant and match IDs.
slug=SLUGS[0]; ps=read('data/competition/avc-men-cup-2026-men-participants.json'); raw=read('data/matches/avc-2026-calendar.json'); detail=read('data/competition/avc-men-cup-2026-results-detail.json'); ro=read('data/competition/avc-men-cup-2026-men-rosters.json')
c=base_config(slug,ps['competition_id'],"2026 AVC 남자컵", "AVC Volleyball Men's Cup 2026",4)
c['structure']['schedule']['stages'].remove('8강'); c['structure']['meaningPresentation']={'mode':'compact','type':'C'}
c['hero']={'showImage':True,'mode':'photo','pcImage':'/assets/images/competitions/avc-men-cup-2026-logo.png','mobileImage':'/assets/images/competitions/avc-men-cup-2026-logo.png','position':'right center','mobilePosition':'right center','alt':"2026 AVC Men's Cup 공식 대회 로고"}
c['structure']['heroAssetPresentation']='official-logo'
byid={p['participant_id']:p for p in ps['participants']}
group={pid:g for g,ids in detail['pool_members'].items() for pid in ids}
d=basic_data(11,2,32,4,'2026.06.20 ~ 06.28','인도 · 아메다바드','Veer Savarkar Sports Complex')
d.update(champion='인도네시아',championAchievement='2026 AVC 남자컵 우승',activeOverviewNote='대회 종료 · 인도네시아 우승 · 대한민국 준우승',scheduleNote='한국시간(KST) 기준 · 인도 현지시간(IST)은 KST보다 3시간 30분 느립니다.',standingsRule='A조 6개국 · B조 5개국. 각 조 상위 2팀이 준결승에 진출했습니다.',standingsNote='KVL 비교용 · 조 순위 → 승률 → 경기당 승점 → 세트·점수 득실비. 공식 대진 시드와 구분합니다.',clubSeasonLabel='대회 당시 소속팀')
d['participants']=[{'participantId':p['participant_id'],'code':p['code'],'name':p['country_ko'],'en':p['country'],'flag':flag(p['code']),'group':group[p['participant_id']],'count':14,'officialTeamId':p['volleyball_world_team_id']} for p in ps['participants']]
d['matches']=[]
ids={m['official_match_id']:m['match_id'] for m in raw['matches']}
for m in raw['matches']:
    no=m['official_match_id']; rnd='POOL' if no<=28212 else {28214:'SF',28215:'SF',28218:'BRONZE',28219:'FINAL'}.get(no,'PLACEMENT')
    stage={'POOL':'조별리그','SF':'준결승','BRONZE':'3위결정전','FINAL':'결승','PLACEMENT':'순위결정전'}[rnd]
    h=byid[m['home_participant_id']]['code']; a=byid[m['away_participant_id']]['code']
    local=datetime.datetime.fromisoformat(m['date']+'T'+m['time'])-datetime.timedelta(hours=3,minutes=30)
    x={'id':m['match_id'],'officialMatchId':no,'date':m['date'],'time':m['time'],'localTimeLabel':(f'{local:%m.%d} ' if local.date().isoformat()!=m['date'] else '')+f'인도 현지 {local:%H:%M} IST','stage':stage,'round':rnd,'home':{'code':h,'participantId':m['home_participant_id']},'away':{'code':a,'participantId':m['away_participant_id']},'venueLabel':d['venueLabel'],'status':m['status'],'score':{'home':m['result']['home_sets'],'away':m['result']['away_sets'],'sets':[{'home':int(s.split('-')[0]),'away':int(s.split('-')[1])} for s in detail['set_scores'][str(no)]]}}
    if rnd=='POOL': x['pool']=x['group']=group[m['home_participant_id']]
    if rnd=='SF': x.update(nextMatchId=ids[28219],bracketLabel='SF1' if no==28214 else 'SF2')
    if rnd=='PLACEMENT': x.update(placement=True,placementLabel={28213:'9·10위 결정전',28216:'7·8위 결정전',28217:'5·6위 결정전'}[no])
    d['matches'].append(x)
d['standings']={'pools':[],'combinedRows':[]}
combined=[]
for pool,rows in detail['pools'].items():
    converted=[]
    for r in rows:
        code=byid[r['participant_id']]['code']; pf=pa=0
        for m in d['matches']:
            if m['round']!='POOL' or code not in [m['home']['code'],m['away']['code']]:continue
            home=m['home']['code']==code
            for s in m['score']['sets']: pf+=s['home' if home else 'away']; pa+=s['away' if home else 'home']
        row={'rank':r['rank'],'team':{'code':code},'played':r['played'],'wins':r['won'],'losses':r['lost'],'points':r['points'],'setRatio':ratio(r['sets_won'],r['sets_lost']),'pointRatio':ratio(pf,pa),'status':'qualified' if r['rank']<=2 else 'out','statusLabel':'4강 진출' if r['rank']<=2 else '순위결정·대회 종료'}
        converted.append(row); combined.append((row,r['rank']))
    d['standings']['pools'].append({'id':pool,'title':pool+'조','rows':converted})
combined.sort(key=lambda z:(z[1],-z[0]['wins']/z[0]['played'],-z[0]['points']/z[0]['played'],-float(z[0]['setRatio'].replace('MAX','999')),-float(z[0]['pointRatio'].replace('MAX','999'))))
d['standings']['combinedRows']=[dict(row,rank=i+1) for i,(row,_) in enumerate(combined)]
d['finalRanking']=[{'rank':i+1,'code':byid[pid]['code'],'team':byid[pid]['country_ko'],'result':['우승','준우승','3위'][i] if i<3 else f'{i+1}위','confirmed':True} for i,pid in enumerate(raw['final_standings'])]
d['meaning']={'eyebrow':'AVC CUP 2026','title':'대회 의미 · 대회 구조','note':'11개국이 겨룬 아시아 국가대표 컵대회','items':[{'title':'아시아 국가대표의 컵대회','description':'아시아 국가대표가 국제 경쟁력을 겨루는 컵대회입니다. 국제 경기 경험을 쌓고 대륙 무대의 정상에 도전합니다.'},{'title':'2개 조 → 4강 · 순위결정전','description':'A조 6팀·B조 5팀이 예선을 치렀습니다. 각 조 상위 2팀이 4강에 진출하고, 나머지 팀은 조별 순위에 따라 최종순위를 결정했습니다.'}]}
d['resources']=[{'title':"Volleyball World · AVC Men's Cup",'url':'https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/'},{'title':'공식 대회 방식 · 11개국 참가','url':'https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/news/avc-men-s-cup-to-serve-off-on-saturday-in-india'},{'title':'공식 최종 결과','url':'https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/news/indonesia-triumph-in-ahmedabad-for-first-ever-avc-cup-honors'}]
r={}
for t in ro['teams']:
    code=byid[t['participant_id']]['code']; players=[]
    for p in t['players']:
        x={'number':p['number'],'en':p['name'],'name':p.get('name_ko') or p['name'],'position':'/'.join(p.get('positions',[])),'dob':p.get('dob'),'heightCm':p.get('height_cm'),'volleybox':p.get('volleybox_url')}
        for key in ['playerId','player_id']:
            if p.get(key): x['playerId']=p[key]
        players.append(x)
    r[code]={'statusLabel':'공식 등록명단 14명','coach':t.get('coach'),'players':players}
save(slug,c,d,r)

# Continental: exact original identities/results, public split roster projection.
slug=SLUGS[-1]; raw=read('data/competitions/'+slug+'.json')
teams=sum([read(f'data/competitions/{slug}-rosters-{g}.json')['teams'] for g in ['a','b','c']],[])
byname={t['name']:t for t in teams}
c=base_config(slug,raw['competitionId'],'2026 AVC 남자 대륙선수권',raw['officialName'],8)
c['structure']['meaningPresentation']={'mode':'preserved-fragment','type':'A','source':'/prototype-assets/continental-stakes.json'}
c['structure']['genderLinks']={'men':'/?competition='+slug,'women':'https://kvolleylab.com/international-competition-avc-women-continental-2026.html'}
c['hero']={'showImage':True,'mode':'photo','pcImage':'/assets/img/competition-hero/kvl-hero-avc-men-user-photo-v1.webp','mobileImage':'/assets/img/competition-hero/kvl-hero-avc-men-user-photo-v1.webp','position':'center center','mobilePosition':'center center','alt':'AVC 남자 대륙선수권 기존 HERO'}
d=basic_data(12,3,26,8,'2026.09.04 ~ 09.13','일본 · 기타큐슈','기타큐슈시 종합체육관')
d.update(champion='일본',championAchievement='2026 AVC 남자 대륙선수권 우승',activeOverviewNote='대회 종료 · 일본 우승 · 대한민국 3위',scheduleNote=raw['timezoneNote'],standingsRule='각 조 상위 2팀 + 성적이 좋은 조 3위 2팀이 8강에 진출했습니다.',standingsNote='기존 KVL 표시 기준 · 조 순위 → 승리 수 → 승점 → 세트·점수 득실비. 진출국은 확정 대진 기준입니다.',clubSeasonLabel='26/27 소속팀',meaning={'eyebrow':'ROAD TO THE WORLD','title':'대회 의미 · 국제 진출권','note':''})
d['participants']=[{'code':t['code'],'name':t['name'],'en':t['en'],'flag':flag(t['code']),'group':t['group'],'count':len(t['players'])} for t in teams]
d['matches']=[]
for m in raw['matches']:
    rnd={'조별리그':'POOL','8강':'QF','준결승':'SF','결승':'FINAL','3위결정전':'BRONZE'}.get(m['stage'],'BRONZE' if m['id']=='3RD' else 'PLACEMENT')
    x={'id':m['id'],'date':m['date'],'time':m.get('time',''),'localTimeLabel':'일본 현지 '+m.get('time','')+' JST','stage':m['stage'],'round':rnd,'pool':m.get('group',''),'group':m.get('group',''),'home':{'code':byname[m['teamA']]['code']},'away':{'code':byname[m['teamB']]['code']},'score':{'home':m['setsA'],'away':m['setsB'],'sets':[{'home':s[0],'away':s[1]} for s in m['sets']]},'venueLabel':raw['venue'],'status':'completed'}
    if rnd=='QF': x['nextMatchId']='SF1' if m['id'] in ['QF1','QF2'] else 'SF2'
    if rnd=='SF': x['nextMatchId']='FINAL'
    d['matches'].append(x)
stats={p['code']:{'rank':0,'team':{'code':p['code']},'played':0,'wins':0,'losses':0,'points':0,'sf':0,'sa':0,'pf':0,'pa':0} for p in d['participants']}
for m in d['matches']:
    if m['round']!='POOL':continue
    a,b=stats[m['home']['code']],stats[m['away']['code']]; h,w=m['score']['home'],m['score']['away']
    for x,own,opp,side in [(a,h,w,'home'),(b,w,h,'away')]:
        x['played']+=1;x['wins']+=own>opp;x['losses']+=own<opp;x['points']+=3 if own==3 and opp<2 else 2 if own==3 else 1 if own==2 else 0;x['sf']+=own;x['sa']+=opp
        x['pf']+=sum(s[side] for s in m['score']['sets']);x['pa']+=sum(s['away' if side=='home' else 'home'] for s in m['score']['sets'])
def key(x): return (-x['wins'],-x['points'],-(x['sf']/x['sa'] if x['sa'] else 999),-(x['pf']/x['pa'] if x['pa'] else 999))
qual={m[s]['code'] for m in d['matches'] if m['round']=='QF' for s in ['home','away']}
def row(x,rank): return {k:v for k,v in dict(x,rank=rank,setRatio=ratio(x['sf'],x['sa']),pointRatio=ratio(x['pf'],x['pa']),status='qualified' if x['team']['code'] in qual else 'out',statusLabel='8강 진출' if x['team']['code'] in qual else '조별리그 종료').items() if k not in ['sf','sa','pf','pa']}
pools=[]
for g in raw['groups']:
    rows=sorted([stats[byname[n]['code']] for n in g['teams']],key=key)
    for i,x in enumerate(rows):x['rank']=i+1
    pools.append({'id':g['id'],'title':g['id']+'조','rows':[row(x,i+1) for i,x in enumerate(rows)]})
d['standings']={'pools':pools,'combinedRows':[row(x,i+1) for i,x in enumerate(sorted(stats.values(),key=lambda x:(x['rank'],*key(x))))]}
final=['JPN','IRI','KOR','AUS','THA','CHN','TPE','IND','BRN','OMA','QAT','NZL']; names={t['code']:t['name'] for t in teams}
d['finalRanking']=[{'rank':i+1,'code':code,'team':names[code],'result':['우승','준우승','3위'][i] if i<3 else f'{i+1}위','confirmed':True} for i,code in enumerate(final)]
d['resources']=[{'title':s.get('label','공식 자료'),'url':s['url']} for s in raw['sources'] if s.get('url')]+[{'title':'Volleyball World · 공식 최종순위 1–12위','url':'https://en.volleyballworld.com/volleyball/competitions/avc-men-continental/standings/'},{'title':'JVA 공식 최종 결과','url':'https://www.jva.or.jp/international/2026/asianchampionship_men/?entry=results'}]
vb=read('data/competitions/'+slug+'-volleybox-links.json')['teams']; clubs=read('data/competitions/'+slug+'-clubs-2026-27.json')['teams']; r={}
for t in teams:
    players=[]
    for p in t['players']:
        rec=clubs.get(t['code'],{}).get(str(p['number']),{}); confirmed=rec.get('status') in ['CONFIRMED','FREE_AGENT']
        x={'number':p['number'],'en':p.get('officialName',p.get('fullName')),'name':p.get('koreanName') or p.get('fullName'),'position':p.get('position'),'dob':p.get('birthDate'),'heightCm':p.get('heightCm'),'volleybox':vb.get(t['code'],{}).get(str(p['number'])),'club':{'name':('FA / 무소속' if rec.get('status')=='FREE_AGENT' else rec.get('club')) if confirmed else '미확인','confirmed':confirmed,'country':rec.get('leagueCountry','') if confirmed else ''}}
        if p.get('playerId'):x['playerId']=p['playerId']
        players.append(x)
    r[t['code']]={'statusLabel':t.get('status','공식 등록명단'),'players':players}
save(slug,c,d,r)

# Source-exact protected fragment. Styles are isolated, not redesigned.
original=(REPO/'international-competition-avc-men-continental-2026.html').read_text()
start=original.index('  <section class="kvl1180-card kvl1180-stakes-card')
end=original.index('\n  </section>',start)+len('\n  </section>')
fragment=original[start:end]
sprite=re.search(r'<svg class="kvl1180-sprite".*?</svg>',original,re.S).group()
stylefiles=re.findall(r'<link rel="stylesheet" href="([^"]+)',original)
def css_text(path):
    path=path.split('?')[0]; p=REPO/path.lstrip('/')
    text=p.read_text()
    def imp(m):return '' if m[1].startswith('https:') else css_text(str((p.parent/m[1].split('?')[0]).relative_to(REPO)))
    text=re.sub(r'@import\s+url\(["\']([^"\']+)["\']\);',imp,text)
    # Change document-root selectors only; every original declaration is retained.
    text=re.sub(r'(?<![\w-])body(?![\w-])','.legacy-body',text)
    text=re.sub(r'(?<![\w-])html(?![\w-])','.legacy-html',text).replace(':root',':host')
    return text
styles='\n'.join(css_text(p) for p in stylefiles[:4])
styles+='\n'+ '\n'.join(re.findall(r'<style>(.*?)</style>',original,re.S)).replace('body','.legacy-body')
styles+='\n'+css_text(stylefiles[-1])
for path in ['assets/css/pretendard-global.css','assets/css/school-logo-runtime.css','assets/css/kvl-global-sidebar-v1.css','assets/css/kvl-global-sidebar-submenus.css','assets/css/kvl-pc-competition-participants-prototype-v2.css','assets/css/kvl-competition-standard.css']:
    styles+='\n'+css_text(path)
js=(REPO/'assets/js/kvl-pc-avc-hybrid-1180-prototype-v1.js').read_text()
korea=js[js.index('function renderKorea('):js.index('function calendarTeam(')]
write('prototype-assets/continental-stakes.json',{'html':fragment,'sprite':sprite,'css':styles,'rawMatches':raw['matches'],'sourceSha256':hashlib.sha256(fragment.encode()).hexdigest()})
(OUT/'prototype-assets/legacy-korea.js').write_text('window.KVLLegacyKorea=(root,matches)=>{const $=id=>root.getElementById(id);const esc=x=>String(x??"\").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c]));const completed=m=>Number.isFinite(m.setsA)&&Number.isFinite(m.setsB);'+korea+'renderKorea(matches);};')
entry=(REPO/'competition-engine.html').read_text().replace('production:true','production:false').replace("collectionRoot:'/data/competitions/'","collectionRoot:'/prototype-data/'")
entry=entry.replace('<script>window.KVL_COMPETITION_PAGE_V2=', '<script>if(!new URLSearchParams(location.search).has("competition"))history.replaceState(null,"","?competition=avc-men-cup-2026");</script><script>window.KVL_COMPETITION_PAGE_V2=')
entry=entry.replace('<script src="/assets/js/kvl-competition-loader-v2.js', '<script src="/prototype-assets/legacy-korea.js" defer></script><script src="/prototype-assets/presentation.js" defer></script>\n<script src="/assets/js/kvl-competition-loader-v2.js')
entry=entry.replace('</head>','<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/prototype-assets/presentation.css"></head>')
(OUT/'index.html').write_text(entry)
for name in ['presentation.js','presentation.css','review.html','qa.html','compare.html']:
    dest=OUT/name if name.endswith('.html') else OUT/'prototype-assets'/name
    shutil.copy2(HERE/name,dest)
manifest={'baseCommit':'c293deb68296a271694e8c09da50f4d6274f0160','protectedFragmentSha256':hashlib.sha256(fragment.encode()).hexdigest(),'competitions':{s:json.loads((OUT/'prototype-data'/s/'config.json').read_text())['competition']['competitionId'] for s in SLUGS},'sharedEngineFiles':{str(p.relative_to(REPO)):sha(p) for p in (REPO/'assets/js').glob('kvl-competition-*-v2.js')}}
write('prototype-assets/provenance.json',manifest)
print('Built',OUT,'— 4 isolated competition screens')

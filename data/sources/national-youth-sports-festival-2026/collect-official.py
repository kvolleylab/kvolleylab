import urllib.request,urllib.parse,json,re,html,pathlib,concurrent.futures
OUT=pathlib.Path(__file__).parent;BASE='https://meet.sports.or.kr/junior/';(OUT/'details').mkdir(exist_ok=True)
def read(url,p,data=None):
 if p.exists():return p.read_text()
 req=urllib.request.Request(url,data=json.dumps(data).encode() if data else None,headers={'Content-Type':'application/json; charset=UTF-8'} if data else {})
 for attempt in range(2):
  try:s=urllib.request.urlopen(req,timeout=30).read().decode('utf-8');p.write_text(s);return s
  except Exception:
   if attempt:raise

def maps(s,var):
 raw=re.search(r'let\s+'+var+r'\s*=\s*"(.*?)";',s,re.S).group(1)
 return [dict((k,html.unescape(v)) for k,v in re.findall(r'([A-Z_]+)=((?:(?!, [A-Z_]+=).)*)',part)) for part in re.findall(r'\{(.*?)\}',raw)]
def txt(s):return ' '.join(html.unescape(re.sub(r'<[^>]+>',' ',s)).split())
def division(kind):
 code=kind['MINOR_CD'];labels={'01':'men-u12','02':'men-u15','06':'women-u12','07':'women-u15'};key=labels[code]
 det=json.loads(read(BASE+'schedule/selectDetailClassCdListAjax.do',OUT/('detail-codes-'+code+'.json'),{'searchClassCd':'08','searchKindCd':code}))['codeList'][0]['DETAIL_CLASS_CD']
 url=BASE+'schedule/scheduleTDaejin.do?'+urllib.parse.urlencode({'searchClassCd':'08','searchKindCd':code,'searchDetailClassCd':det});s=read(url,OUT/(key+'.html'))
 d={'division':key,'kind':code,'detail':det,'label':kind['CODE_NM'],'url':url,'teams':maps(s,'daeJinList'),'matches':maps(s,'daejinResultList')};(OUT/(key+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2));print(key,len(d['teams']),len(d['matches']),flush=True);return d
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:divs=list(pool.map(division,json.loads((OUT/'kind-codes.json').read_text())['codeList']))
def detail(job):
 key,m=job;url=BASE+'schedule/scheduleDetailT.do?'+urllib.parse.urlencode({'searchClassCd':'08','searchDetailClassCd':m['DETAIL_CLASS_CD'],'searchRhCd':m['RH_CD'],'searchPcntGbn':'T'})
 s=read(url,OUT/'details'/(m['DETAIL_CLASS_CD']+'-'+m['RH_CD']+'.html'))
 names=[txt(re.search(r'<ul[^>]*class="'+side+r'-matches[^\"]*"[^>]*>(.*?)</ul>',s,re.S).group(1)) for side in ['left','right']]
 block=re.search(r'<ul class="detailed-record">(.*?)</ul>',s,re.S).group(1);sets=[]
 for li in re.findall(r'<li>(.*?)</li>',block,re.S):
  pts=[txt(x) for x in re.findall(r'<span[^>]*>(.*?)</span>',li,re.S)]
  if len(pts)==2 and all(p.isdigit() for p in pts):sets.append(list(map(int,pts)))
 top=re.search(r'<div class="scoreTop">(.*?)</div>',s,re.S).group(1);stage=txt(re.findall(r'<span[^>]*>(.*?)</span>',top,re.S)[-1]);score=list(map(int,m['SCORE'].split(':')))
 derived=[sum(h>a for h,a in sets),sum(a>h for h,a in sets)]
 return key,{**m,'HOME_NAME':names[0],'AWAY_NAME':names[1],'SETS':sets,'ROUND_LABEL':stage,'DETAIL_URL':url,'DERIVED_SCORE':derived,'SCORE_CONFLICT':derived!=score}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(detail,[(d['division'],m) for d in divs for m in d['matches']]))
for d in divs:
 d['matches']=[m for key,m in results if key==d['division']];names={}
 for m in d['matches']:
  loser=next(t['ENTRANT_TEAM_CD'] for t in d['teams'] if t['SIDO_CD']==m['LOSER_SIDO_CD'])
  m['ENTRANT_TEAM_CD_L'],m['ENTRANT_TEAM_CD_R']=(m['WINNER_TEAM_CD'],loser) if m['WINNER_GB']=='1' else (loser,m['WINNER_TEAM_CD'])
 for m in d['matches']:names[m['ENTRANT_TEAM_CD_L']]=m['HOME_NAME'];names[m['ENTRANT_TEAM_CD_R']]=m['AWAY_NAME']
 for t in d['teams']:t['FULL_NAME']=names[t['ENTRANT_TEAM_CD']]
 (OUT/(d['division']+'-complete.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2));print('DONE',d['division'],len(d['teams']),len(d['matches']),'conflicts',sum(m['SCORE_CONFLICT'] for m in d['matches']),flush=True)

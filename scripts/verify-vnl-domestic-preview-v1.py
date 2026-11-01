"""Verify source/data isolation and recorded browser evidence for this prototype."""
from pathlib import Path
import hashlib, json, subprocess, sys

repo = Path(__file__).resolve().parents[1]
dist = Path(sys.argv[1]).resolve()
base = '2791e93f730a13c7f64e209d802b7e1df43b4758'
evidence = json.loads((repo/'docs/validation/vnl-domestic-v2-browser-evidence.json').read_text())
provenance = json.loads((dist/'previews/vnl-domestic-v1/generated/provenance.json').read_text())
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)

for path, digest in provenance['inputs'].items():
    current = (repo/path).read_bytes()
    approved = subprocess.check_output(['git','show',f'{base}:{path}'], cwd=repo)
    check('recorded branch source hash: '+path, hashlib.sha256(current).hexdigest() == digest)
    check('exact preview input: '+path, (dist/path).read_bytes() == current)
    if path.startswith('data/'):
        check('unchanged original data: '+path, current == approved)

shared = {'assets/js/kvl-domestic-home-v2.js','assets/css/kvl-domestic-home-v2.css','assets/js/kvl-competition-components-v2.js','assets/css/kvl-competition-components-v2.css'}
changed = subprocess.check_output(['git','diff','--name-only',base],cwd=repo,text=True).splitlines()
check('only four requested shared source files changed', {p for p in changed if p.startswith('assets/')} == shared)
check('no wrapper, config, MASTER, roster or Hero asset edits', all(p in shared or p.startswith(('docs/','previews/','scripts/','tests/')) for p in changed))

data = json.loads((repo/'data/competitions/vnl-men-2026/data.json').read_text())
meaning = evidence['meaning']
check('meaning title and note retained', all(data['meaning'][k] in meaning['text'] for k in ('title','note')))
for original, rendered in zip(data['qualifications'], meaning['cards'], strict=True):
    check('full explanation: '+original['id'], all(original[k] in rendered['text'] for k in ('brand','pill','title','description','foot')) and all(t in rendered['text'] for t in original['resultTeams']))
    check('description/result separation: '+original['id'], 'resultTop' not in rendered or rendered['resultTop'] >= rendered['descriptionBottom'])
check('explanation visible between metrics and calendar', meaning['visible'] and meaning['closedDetails'] == 0 and meaning['afterMetrics'] and meaning['beforeCalendar'])
views = evidence['views']
check('six views at three widths', len(views) == 18 and len({(v['width'],v['view']) for v in views}) == 18)
check('all tabs render without page overflow', all(v['visible'] and v['tabs'] == 6 and v['page'] <= v['viewport'] for v in views))
check('1180px desktop main', all(v['main'] == 1180 for v in views if v['width'] == 1600))
check('original single-league standings, no final aggregation', len(data['standings']['rows']) == 18 and all(r['played'] == 12 for r in data['standings']['rows']))
for hero in evidence['hero']:
    a,b=hero['original'],hero['preview']
    check('Hero title and image placement restored: '+str(hero['width']), a['title']==b['title'] and all(a['hero'][k]==b['hero'][k] for k in ('size','position','gradient')) and b['hero']['imageReady'])
    check('original meaning card colors restored: '+str(hero['width']),a['cards']==b['cards'])
fixtures=evidence['fixtures']
check('three and five sets retain the same matchup position', {x['setCount'] for x in fixtures}=={3,5} and len({(x['board']['left'],x['board']['width'],x['sets']['left'],x['sets']['width']) for x in fixtures})==1)
check('five fixed set columns and single-line venue', all(x['sets']['width']==285 and x['detailWhiteSpace']=='nowrap' and abs(x['detailHeight']-float(x['detailLine'].removesuffix('px')))<1 for x in fixtures))
check('domestic fixtures use the same columns', all(x['columns']==fixtures[0]['columns'] and x['board']['width']==400 and x['sets']['width']==285 for x in evidence['domesticFixture']))
check('normal VNL bracket connectors stay solid', all(not p['bye'] and p['afterBackground']=='none' and p['afterBorder']=='solid' and all(c['style']=='solid' for c in p['childLines']) for b in evidence['brackets'] for p in b['pairs']))
check('actual domestic byes keep dashed connectors', all(p['bye'] and any(c['bye'] and c['style']=='dashed' for c in p['childLines']) for p in evidence['domesticBye']))
check('China display says host only', bool(evidence['china']) and all('개최국' in s and '파이널 진출' not in s for s in evidence['china']))
check('all participant countries use Korean alphabetical order', len(evidence['countries'])==18 and all(text.startswith(team['name']) for text,team in zip(evidence['countries'],sorted(data['participants'],key=lambda t:t['name']),strict=True)))
calendar=evidence['teamCalendar']
check('selected-team calendar opens only that team match',calendar['popup']['matchCount']==1 and '벨기에0 : 3쿠바' in calendar['popup']['text'] and 'team=CUB&date=2026-07-15' in calendar['popup']['link'])
check('calendar detail retains selected team and opens date list',calendar['returned']['calendarTeam']=='CUB' and calendar['returned']['calendars']==1 and calendar['returned']['open'] and calendar['returned']['day'] and calendar['returned']['page']<=calendar['returned']['viewport'])
check('domestic team calendar shares actual season games',evidence['domesticCalendar']['team']=='MOK' and len(evidence['domesticCalendar']['days'])==4)
check('no application console errors',not evidence['appErrors'])
result = {'status':'PASS','baseCommit':base,'checks':checks,'viewChecks':len(views),'data':{'countries':len(data['participants']),'matches':len(data['matches']),'preliminaryMatches':sum(m['stage']=='예선' for m in data['matches']),'rosterPlayers':sum(len(r['players']) for r in data['rosters'].values())},'sourceHashes':provenance['inputs']}
(repo/'docs/validation/vnl-domestic-v2-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))

"""Cross-check revision 3 browser observations and protected source/data boundaries."""
from pathlib import Path
import hashlib, json, subprocess, sys

repo = Path(__file__).resolve().parents[1]
dist = Path(sys.argv[1]).resolve()
base = '2791e93f730a13c7f64e209d802b7e1df43b4758'
e = json.loads((repo/'docs/validation/vnl-domestic-v3-browser-evidence.json').read_text())
provenance = json.loads((dist/'previews/vnl-domestic-v1/generated/provenance.json').read_text())
checks = []

def check(name, condition):
    assert condition, name
    checks.append(name)

for path, digest in provenance['inputs'].items():
    current = (repo/path).read_bytes()
    check('source and built asset: '+path, hashlib.sha256(current).hexdigest() == digest and (dist/path).read_bytes() == current)
    if path.startswith('data/'):
        check('protected original data: '+path, current == subprocess.check_output(['git','show',f'{base}:{path}'],cwd=repo))
shared = {'assets/js/kvl-domestic-home-v2.js','assets/css/kvl-domestic-home-v2.css','assets/js/kvl-competition-components-v2.js','assets/css/kvl-competition-components-v2.css'}
changed = subprocess.check_output(['git','diff','--name-only',base],cwd=repo,text=True).splitlines()
check('four bounded shared source changes only', {p for p in changed if p.startswith('assets/')} == shared)
check('no production wrapper, data, config, MASTER or Hero asset edits', all(p in shared or p.startswith(('docs/','previews/','scripts/','tests/')) for p in changed))
check('six tabs at three widths', len(e['views']) == 18 and len({(v['width'],v['view']) for v in e['views']}) == 18)
check('all views render without whole-page overflow', all(v['visible'] and v['tabs']==6 and v['page']<=v['viewport'] for v in e['views']))
check('desktop main remains 1180px', all(v['main']==1180 for v in e['views'] if v['width']==1600))
for h in e['domesticHero']:
    reference=next(v for v in e['hero'] if v['width']==h['width'])
    check('domestic/VNL Hero font parity '+str(h['width']), h['fonts']==reference['fonts'])
    check('original VNL title color '+str(h['width']), reference['appearance']['titleColor']=='rgb(242, 232, 207)')
check('3- and 5-set fixtures share score-centered one-line metadata', {r['sets'] for r in e['fixtures']}=={3,5} and all(abs(r['scoreCenter']-r['detailCenter'])<.1 and abs(r['detailHeight']-float(r['detailLine'].removesuffix('px')))<1 and r['whiteSpace']=='nowrap' for r in e['fixtures']))
for table in e['standings']:
    check('status omitted, result retained '+str(table['width']), '상태' not in table['head'] and '결과' in table['head'] and table['columns']==(8 if table['width']==1600 else 6) and table['rows']==18 and '개최국' in table['china'] and '파이널 진출' not in table['china'])
for cal in e['teamCalendar']:
    check('team calendar and full list expanded '+str(cal['width']), cal['team']=='CUB' and cal['open'] and cal['rows']==12 and cal['page']<=cal['viewport'] and all(not g.get('overflow',False) for g in cal['games']) and any(g['label']=='이란 3-1 쿠바' for g in cal['games']))
check('date popup retains selected-team result', e['popup']['open'] and e['popup']['matchCount']==1 and '벨기에0 : 3쿠바' in e['popup']['text'] and 'team=CUB&date=2026-07-15' in e['popup']['link'])
check('popup link retains team and complete list', e['returned']=={'day':True,'open':True,'rows':12,'team':'CUB'})
check('team calendar previous month shows eight matches', e['previousMonth']['month']=='2026년06월' and len(e['previousMonth']['games'])==8)
check('domestic calendar and list share actual games', e['domesticCalendar']['team']=='MOK' and e['domesticCalendar']['open'] and e['domesticCalendar']['rows']==len(e['domesticCalendar']['games'])==4)
data=json.loads((repo/'data/competitions/vnl-men-2026/data.json').read_text())
check('meaning remains visible and never collapsed', e['meaning']['visible'] and e['meaning']['closedDetails']==0)
check('meaning title and note retained', all(data['meaning'][k] in e['meaning']['text'] for k in ('title','note')))
for card in data['qualifications']:
    check('complete original explanation '+card['id'], all(card[k] in e['meaning']['text'] for k in ('brand','pill','title','description','foot')) and all(t in e['meaning']['text'] for t in card['resultTeams']))
check('original preliminary totals exclude finals', len(data['standings']['rows'])==18 and all(r['played']==12 for r in data['standings']['rows']))
check('no observed application console errors', not e['appErrors'])
result={'status':'PASS','baseCommit':base,'checks':checks,'viewChecks':len(e['views']),'sourceHashes':provenance['inputs'],'consoleNote':'Browser extension metadata errors excluded; no application errors observed.'}
(repo/'docs/validation/vnl-domestic-v3-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','checks':len(checks),'viewChecks':len(e['views'])}))

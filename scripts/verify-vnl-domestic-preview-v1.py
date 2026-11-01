"""Verify source/data isolation and recorded browser evidence for this prototype."""
from pathlib import Path
import hashlib, json, subprocess, sys

repo = Path(__file__).resolve().parents[1]
dist = Path(sys.argv[1]).resolve()
base = '2791e93f730a13c7f64e209d802b7e1df43b4758'
evidence = json.loads((repo/'docs/validation/vnl-domestic-v1-browser-evidence.json').read_text())
provenance = json.loads((dist/'previews/vnl-domestic-v1/generated/provenance.json').read_text())
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)

for path, digest in provenance['inputs'].items():
    current = (repo/path).read_bytes()
    approved = subprocess.check_output(['git','show',f'{base}:{path}'], cwd=repo)
    check('unchanged source: '+path, current == approved and hashlib.sha256(current).hexdigest() == digest)
    check('unchanged preview input: '+path, (dist/path).read_bytes() == current)

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
result = {'status':'PASS','baseCommit':base,'checks':checks,'viewChecks':len(views),'data':{'countries':len(data['participants']),'matches':len(data['matches']),'preliminaryMatches':sum(m['stage']=='예선' for m in data['matches']),'rosterPlayers':sum(len(r['players']) for r in data['rosters'].values())},'sourceHashes':provenance['inputs']}
(repo/'docs/validation/vnl-domestic-v1-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))

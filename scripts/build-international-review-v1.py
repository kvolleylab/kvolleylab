"""Package the isolated review without changing or duplicating maintained engine sources."""
from pathlib import Path
import json
import shutil
import sys

repo = Path(__file__).resolve().parents[1]
dest = Path(sys.argv[1]).resolve()
if dest == repo or repo in dest.parents:
    raise SystemExit('Use a separate review hosting directory')
dest.mkdir(parents=True, exist_ok=True)
for folder in ['assets/css', 'assets/js', 'assets/images/brand', 'assets/images/competitions',
               'data/competitions/vnl-men-2026', 'previews/international-v1']:
    source = repo / folder
    if source.exists():
        shutil.copytree(source, dest / folder, dirs_exist_ok=True)
for path in ['data/master/school_logo_manifest_2026.json', 'assets/images/universities/kuvf-logo.png',
             'docs/international-template-v3-proposal.md', 'docs/validation/international-vnl-review-v1.md',
             'docs/validation/international-vnl-checks-v1.json', 'templates/international-presentation-v1.starter.json']:
    if (repo / path).exists():
        (dest / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(repo / path, dest / path)
for source in (repo / 'docs/validation').glob('international-vnl-*'):
    (dest / 'docs/validation').mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest / 'docs/validation' / source.name)
(dest / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/previews/international-v1/index.html?competition=vnl-men-2026"><title>KVL 국제대회 시안</title><a href="/previews/international-v1/index.html?competition=vnl-men-2026">2026 VNL 남자부 시안 열기</a></html>')
print(json.dumps({'directory': str(dest), 'files': len(list(dest.rglob('*')))}, ensure_ascii=False))

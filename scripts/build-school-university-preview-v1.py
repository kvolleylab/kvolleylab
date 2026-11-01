#!/usr/bin/env python3
"""Build an isolated school hub review site; production source remains untouched."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, required=True, help='Sites static output directory')
args = parser.parse_args()
out = args.output.resolve()
if out == ROOT or ROOT in out.parents:
    raise SystemExit('Use a separate preview output directory, outside the production checkout.')
out.mkdir(parents=True, exist_ok=True)
source = ROOT / 'previews/school-university-v1'
shutil.copytree(ROOT / 'assets', out / 'assets', dirs_exist_ok=True)
shutil.copytree(source, out / 'previews/school-university-v1', dirs_exist_ok=True)
shutil.copy2(source / 'index.html', out / 'domestic-competitions.html')
(out / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/domestic-competitions.html?division=school"><title>중·고 배구대회 시안</title><a href="/domestic-competitions.html?division=school">시안 열기</a></html>', encoding='utf-8')
(out / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
manifest_path = 'data/competitions/school-years.json'
manifest = json.loads((ROOT / manifest_path).read_text())
paths = [manifest_path] + [year['dataPath'] for year in manifest['years']]
checksums = {}
for rel in paths:
    target = out / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / rel, target)
    checksums[rel] = hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
build = {'prototype': 'school-university-v1', 'productionApproved': False,
         'baseCommit': 'ff9cd11e4dfe22f9b51a36a1ac1190f5ad4e9a52',
         'sourceHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
         'catalogSha256': checksums}
(out / 'preview-build.json').write_text(json.dumps(build, indent=2, ensure_ascii=False)+'\n')
print(json.dumps({'output': str(out), 'catalogs': len(paths)-1, 'prototype': True}))

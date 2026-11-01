"""Compose an isolated VNL preview from the maintained domestic template, never editing it."""
from pathlib import Path
import hashlib,json,shutil,sys,re
repo=Path(__file__).resolve().parents[1]
dest=Path(sys.argv[1]).resolve()
if dest==repo or repo in dest.parents: raise SystemExit('Use a separate hosting directory')
dest.mkdir(parents=True,exist_ok=True)
for folder in ['assets/css','assets/js','assets/images/brand','assets/images/competitions','data/competitions/vnl-men-2026','data/competitions/vnl-women-2026','previews/vnl-domestic-v1']:
    shutil.copytree(repo/folder,dest/folder,dirs_exist_ok=True)
for item in ['assets/favicon.ico','data/master/school_logo_manifest_2026.json']:
    source=repo/item
    if source.exists():
        (dest/item).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest/item)
# Reference wrapper is QA-only: local/private hosts cannot satisfy the production
# HTTPS canonical validator. Its engine, styles and competition data stay intact.
(dest/'competition-engine.html').write_text((repo/'competition-engine.html').read_text().replace('production:true','production:false'))
qa=repo/'previews/vnl-domestic-v1/qa.html'
(dest/'previews/vnl-domestic-v1/reference-qa.html').write_text(qa.read_text().replace('/previews/vnl-domestic-v1/index.html','/competition-engine.html'))
for slug in ['university-goseong-men-2026','university-league-women-2026']:
    shutil.copytree(repo/'data/competitions'/slug,dest/'data/competitions'/slug,dirs_exist_ok=True)
    (dest/'previews/vnl-domestic-v1'/('qa-'+slug+'.html')).write_text(qa.read_text().replace('/previews/vnl-domestic-v1/index.html','/competition-engine.html').replace('vnl-men-2026',slug))
out=dest/'previews/vnl-domestic-v1/generated';out.mkdir(parents=True,exist_ok=True)
# Production and preview now use the same opt-in implementation. No selector or gate patch.
receipt={'baseCommit':'2791e93f730a13c7f64e209d802b7e1df43b4758','executionPatch':'none; production international-home-v2 opt-in','inputs':{}}
for filename in ['assets/js/kvl-domestic-home-v2.js','assets/css/kvl-domestic-home-v2.css','assets/css/kvl-international-home-v2.css','assets/js/kvl-competition-components-v2.js','assets/css/kvl-competition-components-v2.css','data/competitions/vnl-men-2026/config.json','data/competitions/vnl-men-2026/data.json','data/competitions/vnl-women-2026/config.json','data/competitions/vnl-women-2026/data.json']:
    receipt['inputs'][filename]=hashlib.sha256((repo/filename).read_bytes()).hexdigest()
(dest/'previews/vnl-domestic-v1/index.html').write_text((repo/'competition-engine.html').read_text().replace('production:true','production:false').replace('<title>','<meta name="robots" content="noindex,nofollow"><title>'))
(dest/'previews/vnl-domestic-v1/qa-women.html').write_text(qa.read_text().replace('vnl-men-2026','vnl-women-2026'))
(out/'provenance.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
(dest/'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/previews/vnl-domestic-v1/index.html?competition=vnl-men-2026"><title>VNL 국내 기본 템플릿 시안</title><a href="/previews/vnl-domestic-v1/index.html?competition=vnl-men-2026">시안 열기</a></html>')
print(json.dumps({'directory':str(dest),'inputs':len(receipt['inputs']),'status':'built'},ensure_ascii=False))

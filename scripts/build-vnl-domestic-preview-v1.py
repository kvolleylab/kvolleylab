"""Compose an isolated VNL preview from the maintained domestic template, never editing it."""
from pathlib import Path
import hashlib,json,shutil,sys
repo=Path(__file__).resolve().parents[1]
dest=Path(sys.argv[1]).resolve()
if dest==repo or repo in dest.parents: raise SystemExit('Use a separate hosting directory')
dest.mkdir(parents=True,exist_ok=True)
for folder in ['assets/css','assets/js','assets/images/brand','assets/images/competitions','data/competitions/vnl-men-2026','previews/vnl-domestic-v1']:
    shutil.copytree(repo/folder,dest/folder,dirs_exist_ok=True)
for item in ['assets/favicon.ico','data/master/school_logo_manifest_2026.json']:
    source=repo/item
    if source.exists():
        (dest/item).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest/item)
out=dest/'previews/vnl-domestic-v1/generated';out.mkdir(parents=True,exist_ok=True)
js=repo/'assets/js/kvl-domestic-home-v2.js'
old="const enabled=d=>['domestic','pro'].includes(d?.competitionFamily)&&d.structure?.presentation==='domestic-home-v2';"
new="const enabled=d=>(['domestic','pro'].includes(d?.competitionFamily)||(document.body.id==='kvl-vnl-domestic-preview'&&d?.competitionFamily==='fivb'&&d?.competitionId==='KVL-COMP-000001'&&d?.season==='2026'))&&d.structure?.presentation==='domestic-home-v2';"
source=js.read_text();assert source.count(old)==1,'Upstream execution gate changed; review required'
(out/'domestic-home.js').write_text(source.replace(old,new))
receipt={'baseCommit':'2791e93f730a13c7f64e209d802b7e1df43b4758','executionPatch':'one preview-only enabled gate; no competition family change','inputs':{}}
for name,filename in [('components.css','assets/css/kvl-competition-components-v2.css'),('domestic-home.css','assets/css/kvl-domestic-home-v2.css')]:
    source=(repo/filename).read_text()
    # Build-derived selector aliases. Never maintain a second engine or mutate the domestic files.
    derived=source.replace('[data-kvl-family="domestic"]','[data-vnl-domestic-preview]').replace('.is-domestic-single-league','.is-single-league')
    (out/name).write_text(derived)
    receipt['inputs'][filename]=hashlib.sha256((repo/filename).read_bytes()).hexdigest()
receipt['inputs'][str(js.relative_to(repo))]=hashlib.sha256(js.read_bytes()).hexdigest()
for filename in ['data/competitions/vnl-men-2026/config.json','data/competitions/vnl-men-2026/data.json']:
    receipt['inputs'][filename]=hashlib.sha256((repo/filename).read_bytes()).hexdigest()
(out/'provenance.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
(dest/'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/previews/vnl-domestic-v1/index.html?competition=vnl-men-2026"><title>VNL 국내 기본 템플릿 시안</title><a href="/previews/vnl-domestic-v1/index.html?competition=vnl-men-2026">시안 열기</a></html>')
print(json.dumps({'directory':str(dest),'inputs':len(receipt['inputs']),'status':'built'},ensure_ascii=False))

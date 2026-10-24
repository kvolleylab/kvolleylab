"""Build the isolated preview from unchanged tracked dependencies + three UI files.

Usage: python3 scripts/package-calendar-cards-prototype.py /absolute/site/checkout
Does not edit the operating calendar, data, shared assets, or deployment config.
"""
from pathlib import Path
import json
import re
import shutil
import sys

repo = Path(__file__).resolve().parents[1]
site = Path(sys.argv[1]).resolve()
dist = site / 'dist'
dist.mkdir(parents=True, exist_ok=True)
page = 'competition-calendar-cards-prototype.html'
files = {page}
# Follow literal CSS/JS dependencies, including assets inserted by unified-nav.
# No player database, match-results file, or other site page is packaged.
pending = [page]
while pending:
    name = pending.pop()
    source = repo / name
    if source.suffix not in {'.html', '.css', '.js'}:
        continue
    text = source.read_text()
    refs = re.findall(r'''(?:["'(])((?:assets/)[\w./-]+\.(?:css|js|webp|png|svg|woff2?))(?:\?[^"')\s]*)?''', text)
    for ref in refs:
        target = repo / ref
        if target.is_file() and ref not in files:
            files.add(ref)
            pending.append(ref)
    if source.suffix == '.css':
        for relative in re.findall(r'''url\(["']?([^"')?#]+)''', text):
            if relative.startswith(('data:', 'http', '/')):
                continue
            target = (source.parent / relative).resolve()
            if target.is_file() and target.is_relative_to(repo):
                ref = target.relative_to(repo).as_posix()
                if ref not in files:
                    files.add(ref)
                    pending.append(ref)
for p in (repo / 'data/calendar').glob('*.json'):
    files.add(p.relative_to(repo).as_posix())
for ref in files:
    dest = dist / ref
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(repo / ref, dest)
(dist / 'index.html').write_text('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=competition-calendar-cards-prototype.html?view=year&amp;year=2026"><title>경기일정 달력 시안 | K-Volley Lab</title></head><body><a href="competition-calendar-cards-prototype.html?view=year&amp;year=2026">달력 시안 열기</a></body></html>')
# QA harness is explicit and noindex; it renders the real page at actual iframe
# viewport widths, without injecting CSS into the calendar or altering data.
qa = 'tests/calendar-cards-responsive.html'
if (repo / qa).exists():
    (dist / 'tests').mkdir(exist_ok=True)
    shutil.copy2(repo / qa, dist / qa)
print(json.dumps({'files': len(files), 'bytes': sum((dist/p).stat().st_size for p in files), 'entry': str(dist/page)}, ensure_ascii=False))

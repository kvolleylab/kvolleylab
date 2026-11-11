"""Browser QA against the actual Competition Engine V2 copied into a local preview.

Prerequisites: Python Playwright and Chromium. Does not access or edit
kvolleylab.com, GitHub main, Supabase, Cloudflare or Google Drive.

  python scripts/build-goseong-local-engine-preview-v2.py /tmp/kvl-goseong
  python scripts/qa-goseong-local-engine-v2.py /tmp/kvl-goseong
"""
from __future__ import annotations
import argparse
from contextlib import contextmanager
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
import time
from urllib.parse import urlencode

SLUG = "university-goseong-men-2026"
WIDTHS = (1180, 390, 360)
VIEWS = ("rosters", "groups", "schedule", "overview")
RECOMMENDED = {
    "nameMode": "two",
    "nameSize": 13,
    "logoSize": 46,
    "logoX": 0,
    "logoY": -2,
    "logoGap": 9,
    "winX": 3,
    "lossX": -3,
    "rowPad": 10,
}
DOM_SNAPSHOT = """() => {
  const d = window.KVL_COMPETITION_V2_DATA || {};
  const q = s => document.querySelector(s);
  const info = el => {
    if (!el) return null;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return {width: r.width, height: r.height, font: s.fontSize,
      transform: s.transform, x: r.x, y: r.y};
  };
  const standings = d.standings || {};
  return {
    status: document.body.dataset.kvlRenderState || '',
    teams: d.participants?.length,
    matches: d.matches?.length,
    pools: standings.pools?.length,
    teamIds: (d.participants || []).map(t => t.code),
    matchIds: (d.matches || []).map(m => m.id),
    groupRows: (standings.pools || []).map(p => (p.rows || []).map(
      r => [r.team?.code, r.wins, r.losses, r.points]
    )),
    sourceResult: (d.finalRanking || []).map(r => [r.code,r.rank,r.result]),
    logo: info(q('#rosters .kvl-participant-flag')),
    teamName: info(q('#rosters .kvl1180-participant-button-copy strong')),
    wins: info(q('#groups .kvl1180-pool-row .kvl1180-pool-w')),
    losses: info(q('#groups .kvl1180-pool-row .kvl1180-pool-l')),
    winsHead: info(q('#groups .kvl1180-pool-table-head>span:nth-child(3)')),
    lossesHead: info(q('#groups .kvl1180-pool-table-head>span:nth-child(4)')),
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    visibleView: q('main .kvl1180-view:not([hidden])')?.dataset.view ?? null,
    tabs: document.querySelectorAll('.kvl1180-tabs a[data-view]').length,
    dataState: document.body.dataset.kvlRenderState,
  };
}"""
APPLY = """tokens => {
  const api = window.KVLGoseongCompareV1;
  if (!api) throw Error('KVL compare module is missing');
  return api.applyDocument(document, tokens, 'university-goseong-men-2026');
}"""


@contextmanager
def serve(directory: Path):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=4)


def source_data(root: Path):
    comp = root / "data/competitions" / SLUG
    cfg = json.loads((comp / "config.json").read_text(encoding="utf-8"))
    d = json.loads((comp / "data.json").read_text(encoding="utf-8"))
    assert cfg["slug"] == SLUG and cfg["competition"]["gender"] == "men"
    assert d["status"] == "completed"
    assert (len(d["participants"]),len(d["matches"]),len(d["standings"]["pools"])) == (15,35,3)
    return d


def qa(root: Path, output: Path, executable: str | None = None):
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageChops

    d = source_data(root)
    output.mkdir(parents=True,exist_ok=True)
    cases = []
    errors = []
    with serve(root) as origin, sync_playwright() as p:
        options = {"headless":True}
        if executable:
            options["executable_path"] = executable
        browser = p.chromium.launch(**options)
        try:
            for width in WIDTHS:
                for view in VIEWS:
                    url = origin + "/competition-engine.html?" + urlencode({
                        "competition": SLUG, "view": view
                    })
                    row = {"width":width, "view":view, "before":None, "after":None}
                    pages = {}
                    for label in ("before","after"):
                        page = browser.new_page(
                            viewport={"width":width,"height":900}, device_scale_factor=1
                        )
                        page.on("pageerror",lambda err, label=label: errors.append({
                            "width":width,"view":view,"mode":label,"error":str(err)
                        }))
                        response=page.goto(url,wait_until="domcontentloaded",timeout=20000)
                        if not response or response.status != 200:
                            raise AssertionError(f"HTTP error in {view} {width}: {response.status if response else 'empty'}")
                        page.locator('body[data-kvl-render-state="ready"]').wait_for(timeout=20000)
                        if label=="after":
                            page.add_script_tag(path=str(root/"assets/js/kvl-goseong-layout-compare-v1.js"))
                            page.evaluate(APPLY, RECOMMENDED)
                            # Two frames ensure layout is fully applied before measuring.
                            page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
                        snap=page.evaluate(DOM_SNAPSHOT)
                        if snap["status"]!="ready" or (snap["teams"],snap["matches"],snap["pools"])!=(15,35,3):
                            raise AssertionError(f"Rendered record count mismatch {width}/{view}/{label}: {snap}")
                        file=f"{view}-{width}-{label}.png"
                        page.screenshot(path=str(output/file), full_page=True, animations="disabled")
                        row[label]={"image":file,"sha256":sha256((output/file).read_bytes()).hexdigest(),
                                    "computed":snap}
                        pages[label]=page
                    before,after=row["before"]["computed"],row["after"]["computed"]
                    for field in ("teams","matches","pools","teamIds","matchIds","groupRows","sourceResult"):
                        if before[field]!=after[field]:
                            raise AssertionError(f"DATA CHANGED in {view}/{width}: {field}")
                    if view=="rosters":
                        expect_logo = 46 if width==1180 else 36
                        actual_logo=after["logo"]["width"] if after["logo"] else None
                        if actual_logo is None or abs(actual_logo-expect_logo)>1.5:
                            raise AssertionError(f"Logo width mismatch {view}/{width}: expected {expect_logo}, got {actual_logo}")
                        expect_name=13 if width==1180 else 11.2
                        actual_name=float(after["teamName"]["font"].replace("px",""))
                        if abs(actual_name-expect_name)>.7:
                            raise AssertionError(f"Name size mismatch: {width}: {actual_name}")
                    if view=="groups":
                        for field,expected in (("wins",3),("losses",-3),
                                               ("winsHead",3),("lossesHead",-3)):
                            transform=(after[field] or {}).get("transform","")
                            if not transform.endswith(f", {expected}, 0)") and expected != 0:
                                raise AssertionError(f"{field} transform not active ({width}): {transform}")
                    if before["scrollWidth"]>before["viewportWidth"]+2:
                        row["preexistingPageOverflow"]=before["scrollWidth"]-before["viewportWidth"]
                    if after["scrollWidth"]>after["viewportWidth"]+2 and before["scrollWidth"]<=before["viewportWidth"]+2:
                        raise AssertionError(f"Introduced page overflow in {width}/{view}")
                    for page in pages.values():
                        page.close()
                    # Produce a side-by-side image only after both FULL renderer captures pass.
                    left=Image.open(output/row["before"]["image"]).convert("RGB")
                    right=Image.open(output/row["after"]["image"]).convert("RGB")
                    height=max(left.height,right.height)
                    side=Image.new("RGB",(left.width+right.width,height),"#eef2f6")
                    side.paste(left,(0,0));side.paste(right,(left.width,0))
                    compare=f"{view}-{width}-compare.jpg"
                    side.save(output/compare,quality=88)
                    row["sideBySide"]=compare
                    cases.append(row)
        finally:
            browser.close()

    result={
        "status":"PASS" if not errors else "REVIEW_ERRORS",
        "mode":"ACTUAL_LOCAL_COMPETITION_ENGINE_V2",
        "source":"repo checked-out Engine and official completed competition JSON, served at loopback",
        "productionWrites":False,
        "caseCount":len(cases),
        "cases":cases,
        "pageErrors":errors,
    }
    (output/"browser-qa.json").write_text(
        json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"
    )
    return result


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("preview_root",type=Path)
    parser.add_argument("--output",type=Path,default=Path("goseong-browser-qa-v2"))
    parser.add_argument("--chromium",default=None,help="Optional Chromium executable")
    args=parser.parse_args()
    result=qa(args.preview_root.resolve(),args.output.resolve(),args.chromium)
    print(json.dumps({k:v for k,v in result.items() if k!="cases"},ensure_ascii=False,indent=2))

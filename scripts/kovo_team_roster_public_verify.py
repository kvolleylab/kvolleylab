#!/usr/bin/env python3
"""Verify that the exact committed V-League roster JSON is public on Pages."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import time
from urllib.request import Request, urlopen

SITE="https://kvolleylab.com"

def canonical(value):
    return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(",",":"))

def load(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))

def fetch_json(url,timeout=15):
    req=Request(url,headers={"User-Agent":"K-Volley-Lab-roster-verifier/1"})
    with urlopen(req,timeout=timeout) as response:
        if response.status!=200:
            raise RuntimeError("PUBLIC_HTTP_STATUS")
        return json.loads(response.read().decode("utf-8-sig"))

def verify(root:Path,sha:str,site=SITE,attempts=24,delay=5):
    if not re.fullmatch(r"[0-9a-f]{40}",sha):
        raise RuntimeError("INVALID_SHA")
    index=load(root/"data/team-rosters/v-league/index.json")
    season=next(row for row in index["seasons"] if row["season"]==index["currentSeason"])
    paths=[season["men"],season["women"]]
    expected={path:load(root/path) for path in paths}
    last={}
    for attempt in range(1,attempts+1):
        outcomes={}
        for path in paths:
            url=site.rstrip("/")+"/"+path+"?kvl_roster_verify="+sha+"-"+str(attempt)
            try:
                outcomes[path]=canonical(fetch_json(url))==canonical(expected[path])
            except Exception:
                outcomes[path]=False
        last=outcomes
        if all(outcomes.values()):
            return {"status":"DEPLOYED_VERIFIED","sha":sha,"season":season["season"],
                    "verified_files":paths,"attempt":attempt}
        if attempt<attempts:
            time.sleep(delay)
    raise RuntimeError("ROSTER_PUBLIC_READBACK_FAILED:"+json.dumps(last,sort_keys=True))

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",default=".")
    p.add_argument("--sha",required=True)
    p.add_argument("--report")
    args=p.parse_args()
    result=verify(Path(args.root).resolve(),args.sha)
    if args.report:
        path=Path(args.report);path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    main()

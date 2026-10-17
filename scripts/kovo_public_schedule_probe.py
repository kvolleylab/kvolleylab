#!/usr/bin/env python3
"""One-shot public KOVO schedule API capability probe; no persistent polling.

URLs/parameters and client headers are taken from the actual public KOVO
SPA code. Sends NO cookies, session IDs, Authorization or X-API-KEY.
Logs strictly limited schema metadata, not whole game/athlete records.
"""
import json
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

API_ORIGIN="https://user-api.kovo.co.kr"
PATHS=(
    "/mains/games/schedules",
    "/mains/games/schedules?gender=FEMALE",
    "/mains/games/schedules/ended?gender=FEMALE",
)
MAX_BYTES=1_500_000


def validate_url(url):
    p=urlsplit(url)
    if p.scheme!="https" or p.hostname!="user-api.kovo.co.kr" or p.port or p.username or p.password:
        raise ValueError("wrong API origin")
    allowed={API_ORIGIN+path for path in PATHS}
    if url not in allowed:
        raise ValueError("not an explicitly discovered public schedule path")
    return url


def fetch_public(url):
    validate_url(url)
    req=Request(url,method="GET",headers={
        "Accept":"application/json",
        "Accept-Language":"ko-KR,ko;q=0.9",
        "Origin":"https://kovo.co.kr",
        "Referer":"https://kovo.co.kr/games/v-leagues/schedules",
        "X-Service-Name":"user",
        "User-Agent":"KVolleyLab-Public-Schedule-Probe/0.1",
    })
    try:
        with urlopen(req,timeout=15) as res:
            if urlsplit(res.geturl()).hostname!="user-api.kovo.co.kr":
                raise ValueError("unexpected redirect")
            raw=res.read(MAX_BYTES+1)
            if len(raw)>MAX_BYTES:
                return {"status":"size_limit","content_type":res.headers.get("Content-Type","").split(";")[0]}
            mime=res.headers.get("Content-Type","").split(";")[0]
            if "json" not in mime.lower() and raw.lstrip()[:1] not in (b"{",b"["):
                return {"status":"unexpected_content_type","content_type":mime}
            data=json.loads(raw)
            return {"status":res.status,"content_type":mime,
                    "byte_count":len(raw),"schema":describe(data)}
    except HTTPError as ex:
        return {"status":ex.code,"classification":"permission_error" if ex.code in (401,403,429)
                else "http_error"}
    except (URLError,OSError,TimeoutError,ValueError,json.JSONDecodeError) as ex:
        return {"status":"failed","error_class":type(ex).__name__}


def safe_key_summary(value):
    if isinstance(value,dict):
        keys=list(value)
        return {"type":"object","keys":keys[:35],"key_count":len(keys)}
    if isinstance(value,list):
        return {"type":"array","length":len(value),
                "sample_keys":list(value[0])[:35] if value and isinstance(value[0],dict) else []}
    return {"type":type(value).__name__}


def match_only_sample(payload):
    """Whitelist only game identity/time and team-score-shaped keys."""
    if not isinstance(payload,list):
        return []
    safe_fields=("gameDate","number","startTime","endTime","gender","currentSet",
                 "round","match","season","league","productId")
    records=[]
    for item in payload[:6]:
        if not isinstance(item,dict):
            continue
        info={}
        for field in safe_fields:
            val=item.get(field)
            if type(val) in (str,int,float,bool) and len(str(val))<=70:
                info[field]=val
            elif isinstance(val,dict):
                info[field]={"keys":list(val)[:15]}
        for side in ("homeTeam","awayTeam"):
            val=item.get(side)
            if not isinstance(val,dict):
                info[side]={"type":type(val).__name__}
                continue
            info[side]={"keys":list(val)[:30]}
            for field in ("teamName","name","shortName","score","setScore","setWins",
                          "setsWon","setCount","teamScore","currentScore","code"):
                v=val.get(field)
                if type(v) in (str,int,float,bool) and len(str(v))<=65:
                    info[side][field]=v
                elif isinstance(v,dict):
                    info[side][field+"_keys"]=list(v)[:15]
        records.append(info)
    return records


def describe(obj):
    info={"envelope":safe_key_summary(obj)}
    if isinstance(obj,dict):
        for key in ("result","payload","data","content","items","matches","schedules","games","status","message"):
            if key not in obj:
                continue
            val=obj[key]
            info[key]=safe_key_summary(val)
            if isinstance(val,dict):
                for nested in ("content","items","matches","schedules","games","data","list"):
                    if nested in val:
                        info[key+"."+nested]=safe_key_summary(val[nested])
            if key=="payload" and isinstance(val,list):
                info["match_identity_and_score_fields"]=match_only_sample(val)
            if key=="result" and isinstance(val,dict):
                info["result_status"]=val.get("status") if type(val.get("status")) in (int,str) else None
    return info


def main():
    for i,path in enumerate(PATHS):
        if i: time.sleep(1)
        status=fetch_public(API_ORIGIN+path)
        print("KOVO_SCHEDULE_API_PROBE",json.dumps({"path":path,**status},ensure_ascii=False),flush=True)
        if status.get("status") in (401,403,429):
            print("KOVO_PROBE_HALT access policy or rate limit",flush=True)
            break
    return 0


if __name__=="__main__":
    sys.exit(main())

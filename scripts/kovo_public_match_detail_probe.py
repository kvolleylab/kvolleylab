#!/usr/bin/env python3
"""Single confirmed public KOVO match detail path probe (not live polling).

Obtain official game IDs from the already-verified anonymous schedule API.
Call ONLY the game's stat/game-schedule detail path exposed by KOVO public JS.
No guessed PIDs or credentials; do not log individual players or statistics.
"""
import json
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

API="https://user-api.kovo.co.kr"
TARGET_DATE="2026-10-17"
TARGET_GAME_NO=10
MAX_BYTES=1_500_000

def request(url):
    uri=urlsplit(url)
    if uri.scheme!="https" or uri.hostname!="user-api.kovo.co.kr" or uri.username or uri.password or uri.port:
        raise ValueError("Not first-party API")
    if (uri.path!="/mains/games/schedules?gender=FEMALE" and
        uri.path!="/mains/games/schedules" and
        not re.fullmatch(r"/stat/game-schedule/\d{1,4}",uri.path)):
        raise ValueError("Unapproved API path")
    req=Request(url,method="GET",headers={
        "Accept":"application/json",
        "Accept-Language":"ko-KR,ko;q=0.9",
        "Origin":"https://kovo.co.kr",
        "Referer":"https://kovo.co.kr/stat/game-schedule",
        "X-Service-Name":"user",
        "User-Agent":"KVolleyLab-Public-MatchDetail-Probe/0.1",
    })
    try:
        with urlopen(req,timeout=15) as res:
            if urlsplit(res.geturl()).hostname!="user-api.kovo.co.kr":
                raise ValueError("Unexpected API redirect")
            raw=res.read(MAX_BYTES+1)
            if len(raw)>MAX_BYTES:
                return None,{"status":"response_too_large"}
            response=json.loads(raw)
            if not isinstance(response,dict) or not isinstance(response.get("result"),dict):
                return None,{"status":"bad_envelope"}
            return response,{"status":res.status,"result_status":response["result"].get("status")}
    except HTTPError as ex:
        return None,{"status":ex.code}
    except (URLError,TimeoutError,OSError,ValueError,json.JSONDecodeError) as ex:
        return None,{"status":"failed","error_class":type(ex).__name__}

def source_match(rows):
    matches=[row for row in rows if (
        isinstance(row,dict) and row.get("number")==TARGET_GAME_NO
        and row.get("gameDate")==TARGET_DATE
        and row.get("gender")=="FEMALE"
        and row.get("homeTeam",{}).get("name")=="흥국생명"
        and row.get("awayTeam",{}).get("name")=="GS칼텍스"
    )]
    if len(matches)!=1:
        raise ValueError("No unique verified historical match target")
    return matches[0]

def detail_url(item):
    for key in ("season","league","homeTeam","awayTeam"):
        if not isinstance(item.get(key),dict):
            raise ValueError("Unexpected schedule fields")
    values={
        "gcode":str(item["match"]),
        "seasonCode":str(item["season"]["value"]),
        "leagueCode":str(item["league"]["value"]),
        "gender":str(item["gender"]),
        "round":str(item["round"]),
        "tcode":str(item["homeTeam"]["code"]),
        "acode":str(item["awayTeam"]["code"]),
        "gdate":str(item["gameDate"]),
    }
    if not (values["gcode"]=="002" and values["seasonCode"]=="824" and
            values["leagueCode"]=="213" and values["gender"]=="FEMALE"):
        raise ValueError("Official game identity did not match expected event")
    if any(not re.fullmatch(r"[A-Za-z0-9_-]{1,30}",v) for k,v in values.items() if k!="gdate"):
        raise ValueError("Unexpected official identifier")
    if not re.fullmatch(r"20\d{2}-\d{2}-\d{2}",values["gdate"]):
        raise ValueError("Unexpected official game date")
    path="/stat/game-schedule/"+str(item["number"])
    return API+path+"?"+urlencode(values)

def shape(value,depth=0):
    if depth>=4: return type(value).__name__
    if isinstance(value,dict):
        out={}
        for key,v in list(value.items())[:45]:
            if any(word in key.lower() for word in ("player","person","member","lineup",
                                                    "birth","phone","email","token","cookie",
                                                    "secret","salary")):
                continue
            out[key]=shape(v,depth+1)
        return out
    if isinstance(value,list):
        return {"type":"array","length":len(value),
                "first_item_shape":shape(value[0],depth+1) if value else None}
    # values are not returned: structure only, including match point numbers.
    return type(value).__name__

def main():
    schedule,meta=request(API+"/mains/games/schedules")
    if not schedule or schedule.get("result",{}).get("status")!=200:
        print("KOVO_DETAIL_SOURCE_BLOCKED",json.dumps(meta))
        return 1
    rows=schedule.get("payload",[])
    if not isinstance(rows,list):
        return 1
    target=source_match(rows)
    url=detail_url(target)
    response,detail_meta=request(url)
    summary={
        "official_game_number":TARGET_GAME_NO,
        "official_season":"824",
        "official_cup_phase":"213",
        "source_path":urlsplit(url).path,
        "query_keys":sorted(["gcode","seasonCode","leagueCode","gender","round","tcode","acode","gdate"]),
        "http":detail_meta,
        "payload_shape":shape(response.get("payload")) if response else None,
        "caution":"Metadata-only; no individual data, no proven live updates"
    }
    print("KOVO_PUBLIC_GAME_DETAIL",json.dumps(summary,ensure_ascii=False))
    return 0 if response and response.get("result",{}).get("status")==200 else 2

if __name__=="__main__":
    try: sys.exit(main())
    except (ValueError,KeyError,TypeError) as ex:
        print("KOVO_PUBLIC_GAME_DETAIL_BLOCKED",type(ex).__name__,str(ex),file=sys.stderr)
        sys.exit(1)

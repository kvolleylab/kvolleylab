#!/usr/bin/env python3
"""KOVO public *match-only* schedule bridge; review artifact, never production.

Public KOVO app was observed calling /mains/games/schedules (optionally gender)
and /mains/games/schedules/ended. This adapter matches only officially named
2026 KOVO Cup fixtures to local IDs using date, both teams, round and match
number. No individual player data, no simulated scores, no writes to site.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ORIGIN="https://user-api.kovo.co.kr"
SOURCE_PATHS=(
    "/mains/games/schedules?gender=FEMALE",
    "/mains/games/schedules/ended?gender=FEMALE",
    "/mains/games/schedules",
)
SEASON_IDS={"824":{"MALE":"kovo-cup-men-2026","FEMALE":"kovo-cup-women-2026"}}
ROUND_CODES={"212":"조별리그","213":"준결승","214":"결승"}
MAX_SIZE=1_500_000

class SourceError(ValueError):
    pass

def require(test,why):
    if not test: raise SourceError(why)

def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def read_public_json(path):
    require(path in SOURCE_PATHS,"Unapproved API path")
    request=Request(ORIGIN+path,method="GET",headers={
        "Accept":"application/json","Accept-Language":"ko-KR,ko;q=0.9",
        "Origin":"https://kovo.co.kr",
        "Referer":"https://kovo.co.kr/games/v-leagues/schedules",
        "X-Service-Name":"user",
        "User-Agent":"KVolleyLab-MatchOnly-Schedule/0.1",
    })
    with urlopen(request,timeout=15) as response:
        require(response.status==200,"KOVO HTTP failure")
        require(response.geturl()==ORIGIN+path,"Redirect or mutated official URL")
        body=response.read(MAX_SIZE+1)
        require(len(body)<=MAX_SIZE,"Oversized API payload")
    envelope=json.loads(body)
    require(isinstance(envelope,dict) and isinstance(envelope.get("result"),dict)
            and envelope["result"].get("status")==200
            and isinstance(envelope.get("payload"),list),"Unexpected public API envelope")
    require(len(envelope["payload"])<=100,"Unexpectedly broad schedule response")
    return envelope["payload"]

def simple(value):
    if not isinstance(value,(str,int)) or isinstance(value,bool):raise SourceError("Invalid scalar")
    s=str(value)
    require(1<=len(s)<=95,"Invalid scalar length")
    return s

def team(value):
    require(isinstance(value,dict),"team object required")
    name=simple(value.get("name"))
    code=value.get("code",value.get("value"))
    require(isinstance(code,(str,int)) and not isinstance(code,bool),"official team code missing")
    wins=value.get("score")
    require(type(wins) is int and 0<=wins<=3,"invalid KOVO set wins")
    return {"name":name,"provider_code":simple(code),"sets_won":wins}

def normalize(raw,kind):
    require(isinstance(raw,dict),"match object")
    season=raw.get("season")
    league=raw.get("league")
    require(isinstance(season,dict) and isinstance(league,dict),"season and league required")
    sid=simple(season.get("value"))
    lid=simple(league.get("value"))
    gender=simple(raw.get("gender"))
    require(gender in ("FEMALE","MALE"),"unknown gender")
    match_type=simple(raw.get("match"))
    number=raw.get("number")
    require(type(number) is int and 0<number<=500,"invalid official match number")
    date=simple(raw.get("gameDate"))
    require(re.fullmatch(r"20\d{2}-\d{2}-\d{2}",date),"invalid match date")
    home=team(raw.get("homeTeam"))
    away=team(raw.get("awayTeam"))
    require(home["name"]!=away["name"],"identical teams")
    end=raw.get("endTime")
    current=raw.get("currentSet")
    if end:
        status="final"
        require(max(home["sets_won"],away["sets_won"])==3,
                "final must have three winning sets")
    elif current is not None and type(current) is int and current>0:
        status="live"
        require(1<=current<=5 and max(home["sets_won"],away["sets_won"])<3,
                "impossible live status")
    else:
        status="scheduled"
        require(home["sets_won"]==away["sets_won"]==0,
                "scheduled match with nonzero score")
    return {
        "source_key":":".join((sid,match_type,gender,str(number))),
        "season_id":sid,"season_name":simple(season.get("name")),
        "phase_id":lid,"phase_name":simple(league.get("name")),
        "gender":gender,"match_type":match_type,"number":number,"date":date,
        "home":home,"away":away,"status":status,
        "current_set":current if type(current) is int and current>0 else None,
        "sets_won":{"home":home["sets_won"],"away":away["sets_won"]},
        "has_set_points":False,
        "source_kind":kind,
    }

def identity_equal(a,b):
    fields=("source_key","date","home","away","phase_id")
    return all(a[field]==b[field] for field in fields)

def merge_reports(records):
    merged={}
    for record in records:
        key=record["source_key"]
        other=merged.get(key)
        if not other:
            merged[key]=record
            continue
        require(identity_equal(record,other),"Conflicting match identities across endpoints")
        require(record["status"]==other["status"] and
                record["sets_won"]==other["sets_won"],
                "Conflicting match states across endpoints")
        if record["source_kind"]=="ended":
            merged[key]=record
    return sorted(merged.values(),key=lambda x:(x["date"],x["number"],x["gender"]))

def local_matches(root,slug):
    path=Path(root)/"data"/"competitions"/slug/"data.json"
    data=json.loads(path.read_text(encoding="utf-8"))
    lookup={p["code"]:p["name"] for p in data["participants"]}
    return [(m,lookup) for m in data["matches"]]

def join_local(record,root):
    slug=SEASON_IDS.get(record["season_id"],{}).get(record["gender"])
    if not slug:
        return {"local_status":"NO_APPROVED_COMPETITION_MAPPING","match_id":None}
    expected_stage=ROUND_CODES.get(record["phase_id"])
    require(expected_stage is not None,"unmapped official Cup round")
    hits=[]
    for match,names in local_matches(root,slug):
        h=names.get(match.get("home",{}).get("code"))
        a=names.get(match.get("away",{}).get("code"))
        if (match["date"]==record["date"] and h==record["home"]["name"]
                and a==record["away"]["name"] and match["stage"]==expected_stage):
            hits.append(match)
    if len(hits)!=1:
        return {"local_status":"UNMATCHED_OR_AMBIGUOUS","match_id":None}
    match=hits[0]
    # Only KOVO Cup numbered fixtures (not V-League rounds) may use ID number check.
    suffix=re.search(r"KOVOCUP26-(\d+)$",match["id"])
    require(suffix and int(suffix.group(1))==record["number"],
            "Official game number disagrees with local Cup fixture")
    official=record["sets_won"]
    existing=match.get("score")
    if existing:
        require(existing["home"]==official["home"] and existing["away"]==official["away"],
                "Official set score conflicts with existing website; manual review required")
    if record["status"]=="final" and not existing:
        disposition="FINAL_AWAITING_SET_POINTS_AND_REVIEW"
    elif record["status"]=="live":
        disposition="LIVE_PROVISIONAL_NO_SET_POINTS"
    elif record["status"]=="final":
        disposition="FINAL_SET_TOTAL_MATCHES_SITE"
    else:
        disposition="SCHEDULED_CONFIRMED"
    return {"local_status":disposition,"match_id":match["id"],"competition_slug":slug}

def build(source_batches,root):
    all_records=[]
    for kind,batch in source_batches:
        require(kind in ("main","ended","female"),"source kind")
        for row in batch:
            all_records.append(normalize(row,kind))
    records=merge_reports(all_records)
    for row in records:
        row.update(join_local(row,root))
    return {
        "schema_version":1,
        "mode":"SOURCE_REVIEW_REQUIRED",
        "fetched_at":utc_now(),
        "source_host":"user-api.kovo.co.kr",
        "match_only":True,
        "update_site":False,
        "matches":records,
        "totals":{"observations":len(all_records),
                  "unique_games":len(records),
                  "matched":sum(bool(x.get("match_id")) for x in records),
                  "live":sum(x["status"]=="live" for x in records)}
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",default=".")
    parser.add_argument("--output",default="data/kovo/match-feed/official_schedule_review.json")
    args=parser.parse_args()
    try:
        raw=[]
        for index,(kind,path) in enumerate((
            ("main",SOURCE_PATHS[2]),
            ("female",SOURCE_PATHS[0]),
            ("ended",SOURCE_PATHS[1])
        )):
            if index:time.sleep(1)
            raw.append((kind,read_public_json(path)))
        result=build(raw,args.root)
        dest=Path(args.output)
        dest.parent.mkdir(parents=True,exist_ok=True)
        temp=dest.with_suffix(dest.suffix+".tmp")
        temp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        temp.replace(dest)
        print("KOVO_MATCH_IDENTITY_OK",json.dumps(result["totals"]),flush=True)
        for row in result["matches"]:
            print("KOVO_MATCH",row["source_key"],row["date"],row["status"],
                  row.get("match_id"),row["local_status"],flush=True)
        return 0
    except (SourceError,KeyError,TypeError,HTTPError,URLError,OSError,ValueError) as exc:
        print("KOVO_MATCH_IDENTITY_BLOCKED",type(exc).__name__,str(exc)[:180],file=sys.stderr)
        return 1

if __name__=="__main__":
    sys.exit(main())

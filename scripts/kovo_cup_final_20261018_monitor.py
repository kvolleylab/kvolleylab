#!/usr/bin/env python3
"""Read-only, one-event observation of the official 2026 KOVO Cup women's final.

For 2026-10-18 GS Caltex vs Korea Expressway, official game #12 ONLY.
Writes timestamped observations to workflow-local JSONL for later comparison.
No player data; no KVL production updates; no credentials; no guessed IDs.
A manual --once smoke check may run before game day without collecting anything else.
"""
import argparse
from datetime import date, datetime, time as clocktime, timedelta, timezone
import json
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from zoneinfo import ZoneInfo

from kovo_match_schedule_bridge import (
    ORIGIN, SourceError, read_public_json, normalize, join_local,
)

KST=ZoneInfo("Asia/Seoul")
EVENT_DATE=date(2026,10,18)
OPEN_TIME=clocktime(12,55)
CLOSE_TIME=clocktime(18,30)
FIXTURE_ID="KOVOCUP26-12"
GAME_KEY="824:002:FEMALE:12"
HOME="GS칼텍스"
AWAY="한국도로공사"
SCHEDULE_PATH="/mains/games/schedules?gender=FEMALE"
ENDED_PATH="/mains/games/schedules/ended?gender=FEMALE"
MIN_INTERVAL_SECONDS=180


def official_target(rows,kind,root):
    candidates=[]
    for row in rows:
        if not isinstance(row,dict):
            continue
        if str(row.get("number"))!="12" or row.get("gameDate")!="2026-10-18":
            continue
        normalized=normalize(row,kind)
        if normalized["source_key"]!=GAME_KEY:
            raise SourceError("Official game ID disagrees with known final")
        if normalized["phase_id"]!="214" or normalized["gender"]!="FEMALE":
            raise SourceError("Unexpected official final phase or gender")
        if normalized["home"]["name"]!=HOME or normalized["away"]["name"]!=AWAY:
            raise SourceError("Official final matchup differs from reviewed fixture")
        joint=join_local(normalized,root)
        if joint.get("match_id")!=FIXTURE_ID:
            raise SourceError("Official final cannot be matched uniquely to website")
        candidates.append({**normalized,**joint})
    if len(candidates)>1:
        raise SourceError("Duplicate observations for one match in a single response")
    return candidates[0] if candidates else None


def poll(root,fetch=read_public_json):
    first=official_target(fetch(SCHEDULE_PATH),"female",root)
    if first and first["status"]!="final":
        return first
    # Ended endpoint is consulted after the schedule endpoint no longer carries
    # the game, or when it says final. Never infer final based on the clock.
    ended=official_target(fetch(ENDED_PATH),"ended",root)
    if first and ended:
        if first["status"]!=ended["status"] or first["sets_won"]!=ended["sets_won"]:
            raise SourceError("Conflicting official schedule and ended results")
    return ended or first


def snapshot(record, at):
    if record is None:
        return {"observed_at_utc":at.isoformat(timespec="seconds"),
                "game_key":GAME_KEY,"match_id":FIXTURE_ID,
                "status":"not_in_public_window","source":"KOVO_PUBLIC_SCHEDULE",
                "sets_won":None,"current_set":None,
                "set_points":None}
    return {
        "observed_at_utc":at.isoformat(timespec="seconds"),
        "game_key":record["source_key"],
        "match_id":record["match_id"],
        "status":record["status"],
        "sets_won":record["sets_won"],
        "current_set":record["current_set"],
        "source":record["source_kind"],
        "local_match_status":record["local_status"],
        "set_points":None,
        "note":"OBSERVATION_ONLY_NOT_LIVE_SITE_DATA"
    }


def change_signature(item):
    return (item["status"],str(item["sets_won"]),item["current_set"])


def monitor(root,output,once=False,interval=300,now_fn=None,sleep_fn=time.sleep,
            fetch=read_public_json,max_checks=None):
    if interval<MIN_INTERVAL_SECONDS:
        raise ValueError("Polling under 180 seconds is not permitted by pilot")
    now_fn=now_fn or (lambda:datetime.now(timezone.utc))
    kst=now_fn().astimezone(KST)
    if not once and kst.date()!=EVENT_DATE:
        raise SourceError("Schedule is valid on 2026-10-18 KST ONLY; this run will never repeat in 2027")
    if not once and kst.time()>CLOSE_TIME:
        raise SourceError("Match observation window already ended")
    file=Path(output)
    file.parent.mkdir(parents=True,exist_ok=True)
    previous=None
    final_confirmations=0
    checks=0
    consecutive_errors=0
    # File is job-local. The workflow uploads it even when an error occurs.
    with file.open("w",encoding="utf-8") as log:
        while True:
            observed_at=now_fn()
            local=observed_at.astimezone(KST)
            if not once and (local.date()!=EVENT_DATE or local.time()>CLOSE_TIME):
                break
            if not once and local.time()<OPEN_TIME:
                sleep_fn(min(60,max(1,((datetime.combine(EVENT_DATE,OPEN_TIME,tzinfo=KST)-local).total_seconds()))))
                continue
            try:
                record=poll(root,fetch=fetch)
                item=snapshot(record,observed_at)
                if previous is not None:
                    old=previous
                    if old["status"]=="final" and item["status"]!="final":
                        raise SourceError("Final-to-nonfinal rollback")
                    if old["status"]=="live" and item["status"]=="scheduled":
                        raise SourceError("Live-to-scheduled regression")
                    if old["sets_won"] and item["sets_won"]:
                        old_w=old["sets_won"]
                        new_w=item["sets_won"]
                        if new_w["home"]<old_w["home"] or new_w["away"]<old_w["away"]:
                            raise SourceError("Official cumulative sets regressed")
                changed=previous is None or change_signature(previous)!=change_signature(item)
                item["changed_from_previous"]=changed
                item["poll_number"]=checks+1
                log.write(json.dumps(item,ensure_ascii=False)+"\n")
                log.flush()
                print("CUP_FINAL_OBSERVATION",json.dumps(item,ensure_ascii=False),flush=True)
                previous=item
                consecutive_errors=0
                final_confirmations=(final_confirmations+1 if item["status"]=="final" else 0)
                if final_confirmations>=2:
                    print("CUP_FINAL_STABLE_FINAL confirmed_twice=true",flush=True)
                    break
            except (SourceError,ValueError,TypeError,KeyError,OSError,HTTPError,URLError,TimeoutError) as ex:
                # Write the error but never fabricate score or mask a discrepancy.
                warning={"observed_at_utc":observed_at.isoformat(timespec="seconds"),
                         "status":"error","error_class":type(ex).__name__,
                         "error_message":str(ex)[:160],"match_id":FIXTURE_ID}
                log.write(json.dumps(warning,ensure_ascii=False)+"\n")
                log.flush()
                print("CUP_FINAL_SOURCE_WARNING",json.dumps(warning,ensure_ascii=False),flush=True)
                consecutive_errors+=1
                if (isinstance(ex,HTTPError) and ex.code in (401,403,429)) or consecutive_errors>=3:
                    print("CUP_FINAL_HALT access-denied-or-repeated-source-errors",flush=True)
                    return 2
                if "regress" in str(ex).lower() or "disagrees" in str(ex).lower() or "conflict" in str(ex).lower():
                    return 2
            checks+=1
            if once or max_checks is not None and checks>=max_checks:
                break
            sleep_fn(interval)
    print("CUP_FINAL_MONITOR_COMPLETE",json.dumps({
        "checks":checks,"final_confirmations":final_confirmations,
        "mode":"ONCE" if once else "ONE_DAY_TEST",
        "site_updated":False,
        "output":str(file)
    }),flush=True)
    return 0


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",default=".")
    parser.add_argument("--output",default="data/kovo/match-feed/2026-10-18-final-observations.jsonl")
    parser.add_argument("--once",action="store_true")
    parser.add_argument("--interval",type=int,default=300)
    args=parser.parse_args()
    try:
        return monitor(args.root,args.output,once=args.once,interval=args.interval)
    except (SourceError,ValueError) as ex:
        print("CUP_FINAL_MONITOR_BLOCKED",type(ex).__name__,str(ex),file=sys.stderr)
        return 1


if __name__=="__main__":
    sys.exit(main())

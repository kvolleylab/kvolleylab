#!/usr/bin/env python3
"""Build deterministic, auditable 2026-27 KOVO roster and salary projection.

Input comes only from KOVO public official notices previously collected into
index.json. This is NOT a KOVO real-time registration certificate: missing
announcements, unavailable roster entries, and external deals may remain.
No Google Drive writes and no publication to the production website.
"""
import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path

BASE = Path("data/kovo/official-notices/2026-27")
ACTIVE_EVENTS = {"registration", "reinstatement", "foreign_or_asian_quota", "transfer"}
INACTIVE_EVENTS = {"free_agent", "voluntary_termination", "contract_termination", "release", "retirement"}


def normal(value):
    return re.sub(r"\s+", "", str(value or "")).casefold()


def base_rosters(notices):
    people, warnings = {}, []
    first = [n for n in notices if re.search(r"선수등록\s*\(1차\)", n.get("title", ""))]
    for notice in sorted(first, key=lambda n: n["id"]):
        gender, team = notice.get("gender", ""), notice.get("team", "")
        if not gender or not team:
            warnings.append({"notice_id": notice["id"], "reason": "initial_roster_missing_team"})
            continue
        for player in notice.get("players", []):
            name = player.get("player_name", "")
            if not name:
                continue
            key = (gender, normal(team), normal(name))
            if key in people:
                warnings.append({"notice_id": notice["id"], "reason": "duplicate_initial_roster", "name": name, "team": team})
                continue
            people[key] = {
                "gender": gender, "team": team, "name": name,
                "number": str(player.get("number", "")), "position": player.get("position") or "",
                "registration_source": notice["source_url"], "last_change_source": notice["source_url"],
                "latest_change_date": notice.get("published_at", "")[:10],
                "salary_krw": player.get("salary_krw"), "option_krw": player.get("option_krw"),
                "total_krw": player.get("total_krw"), "contract_source": notice["source_url"],
                "salary_date": notice.get("published_at", "")[:10],
                "last_status": "first_registration",
            }
    return people, warnings


def make_entry(ev, team, existing=None):
    entry = dict(existing or {
        "gender": ev["gender"], "team": team, "name": ev["player_name"],
        "number": "", "position": "", "registration_source": ev["source_url"],
        "last_change_source": "", "latest_change_date": "",
        "salary_krw": None, "option_krw": None, "total_krw": None,
        "contract_source": "", "salary_date": "", "last_status": "",
    })
    entry.update({
        "gender": ev["gender"], "team": team, "name": ev["player_name"],
        "last_change_source": ev["source_url"], "latest_change_date": ev["effective_date"] or ev["notice_date"],
        "last_status": ev["kind"],
    })
    if ev.get("jersey_number"):
        entry["number"] = str(ev["jersey_number"])
    if ev.get("position"):
        entry["position"] = ev["position"]
    if ev.get("salary_krw") is not None or ev.get("option_krw") is not None:
        entry["salary_krw"] = ev.get("salary_krw")
        entry["option_krw"] = ev.get("option_krw")
        entry["total_krw"] = (
            ev["salary_krw"] + ev["option_krw"]
            if ev.get("salary_krw") is not None and ev.get("option_krw") is not None else None
        )
        entry["contract_source"] = ev["source_url"]
        entry["salary_date"] = ev["effective_date"] or ev["notice_date"]
    return entry


def project(notices, as_of=None):
    as_of = as_of or datetime.now(ZoneInfo("Asia/Seoul")).date().isoformat()
    active, warnings = base_rosters(notices)
    blocked = []
    applied = []
    historical = 0
    for notice in sorted(notices, key=lambda n: n["id"]):
        for ev in notice.get("events", []):
            if ev.get("season") != "2026-27":
                historical += 1
                continue
            ev = dict(ev)
            ev["source_url"] = ev.get("source_url") or notice["source_url"]
            gender, name, kind = ev.get("gender"), ev.get("player_name"), ev.get("kind")
            if ev.get("confidence") != "high" or not gender or not name or name in ("없음", "해당없음"):
                blocked.append({"event_id": ev.get("event_id"), "notice_id": notice["id"], "reason": "not_verified", "name": name, "kind": kind, "source_url": ev["source_url"]})
                continue
            if kind not in ACTIVE_EVENTS | INACTIVE_EVENTS | {"loan", "number_change", "position_change"}:
                blocked.append({"event_id": ev.get("event_id"), "notice_id": notice["id"], "reason": "unsupported_event", "name": name, "kind": kind, "source_url": ev["source_url"]})
                continue
            event_team = notice.get("team") or ev.get("to_team") or ev.get("from_team") or ""
            teams = [ev.get("to_team"),ev.get("from_team"),event_team]
            lookup_keys = [(gender, normal(t), normal(name)) for t in teams if t]
            target = next((k for k in lookup_keys if k in active), None)
            # Do not match same-name players across teams by name alone.
            if kind in ACTIVE_EVENTS:
                dest = ev.get("to_team") or event_team
                if not dest:
                    blocked.append({"event_id":ev.get("event_id"), "notice_id":notice["id"],"reason":"missing_destination","name":name,"kind":kind,"source_url":ev["source_url"]})
                    continue
                destkey=(gender,normal(dest),normal(name))
                old = active.get(destkey)
                if kind == "transfer":
                    prev=ev.get("from_team")
                    if not prev or normal(prev)==normal(dest):
                        blocked.append({"event_id":ev.get("event_id"),"notice_id":notice["id"],"reason":"ambiguous_transfer_source","name":name,"kind":kind,"source_url":ev["source_url"]})
                        continue
                    fromkey=(gender,normal(prev),normal(name))
                    if fromkey in active:
                        old=active.pop(fromkey)
                    elif old is None:
                        # KOVO verified destination; prior team may predate first-registration.
                        warnings.append({"notice_id":notice["id"],"reason":"transfer_source_not_in_base","name":name,"from_team":prev})
                active[destkey]=make_entry(ev,dest,old)
                applied.append(ev["event_id"])
            elif kind in INACTIVE_EVENTS or kind=="loan":
                if kind=="loan" and ev.get("loan_end") and ev["loan_end"] < as_of:
                    warnings.append({"notice_id":notice["id"],"reason":"loan_expired_unverified_return","name":name})
                    continue
                if target:
                    del active[target]
                    applied.append(ev["event_id"])
                else:
                    warnings.append({"notice_id":notice["id"],"reason":"inactive_event_not_in_base","name":name,"team":event_team})
            elif kind in ("number_change","position_change"):
                if not target:
                    blocked.append({"event_id":ev.get("event_id"),"notice_id":notice["id"],"reason":"change_target_not_found","name":name,"kind":kind,"source_url":ev["source_url"]})
                    continue
                if kind == "number_change" and not ev.get("new_number"):
                    blocked.append({"event_id":ev.get("event_id"),"notice_id":notice["id"],"reason":"new_number_missing","name":name,"source_url":ev["source_url"]})
                    continue
                if kind == "position_change" and not ev.get("new_position"):
                    blocked.append({"event_id":ev.get("event_id"),"notice_id":notice["id"],"reason":"new_position_missing","name":name,"source_url":ev["source_url"]})
                    continue
                if kind=="number_change":active[target]["number"]=ev["new_number"]
                else:active[target]["position"]=ev["new_position"]
                active[target]["latest_change_date"]=ev.get("effective_date") or ev["notice_date"]
                active[target]["last_change_source"]=ev["source_url"]
                active[target]["last_status"]=kind
                applied.append(ev["event_id"])
    rows = sorted(active.values(),key=lambda z:(z["gender"],z["team"],int(z["number"]) if str(z["number"]).isdigit() else 999,z["name"]))
    by_team=Counter((r["gender"],r["team"]) for r in rows)
    invalid_money=[{"team":r["team"],"name":r["name"],"reason":"salary_component_mismatch","source_url":r["contract_source"]}
                   for r in rows if r["salary_krw"] is not None and r["option_krw"] is not None
                   and r["total_krw"] != r["salary_krw"] + r["option_krw"]]
    name_multi=defaultdict(list)
    for r in rows:name_multi[(r["gender"],normal(r["name"]))].append({"team":r["team"],"number":r["number"]})
    duplicates=[{"gender":k[0],"name":k[1],"team_records":v,"rule":"not_same_player_without_dob"}
                for k,v in name_multi.items() if len(v)>1]
    return {
        "schema_version":1, "season":"2026-27", "status":"public_notices_projection_not_official_live_register",
        "basis":"2026-27 first registration + subsequent 2026-27 player-level official events; prior season is reference only",
        "active_players":rows,
        "audit":{
            "total":len(rows), "teams":[{"gender":k[0],"team":k[1],"total":v} for k,v in sorted(by_team.items())],
            "applied_events":len(applied), "applied_event_ids":applied,
            "prior_season_events_ignored":historical,
            "blocked_events":blocked, "warnings":warnings,
            "salary_mismatches":invalid_money,"same_name_multi_team":duplicates
        }
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",default=str(BASE/"index.json"))
    p.add_argument("--output",default=str(BASE/"roster_projection.json"))
    p.add_argument("--review-output",default=str(BASE/"roster_review_queue.json"))
    args=p.parse_args()
    notices=json.loads(Path(args.input).read_text(encoding="utf-8"))["notices"]
    snapshot=project(notices)
    out=Path(args.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    queue={
        "schema_version":1,"season":"2026-27",
        "rule":"Read-only candidate queue. Review official notice and KVL Player_ID before editing Drive MASTER.",
        "blocked_events":snapshot["audit"]["blocked_events"],
        "warnings":snapshot["audit"]["warnings"],
        "potential_homonyms":snapshot["audit"]["same_name_multi_team"],
        "salary_mismatches":snapshot["audit"]["salary_mismatches"],
    }
    Path(args.review_output).write_text(json.dumps(queue,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print("PROJECTION_OK active="+str(snapshot["audit"]["total"])+" applied="+str(snapshot["audit"]["applied_events"])+
          " warnings="+str(len(snapshot["audit"]["warnings"]))+" blocked="+str(len(snapshot["audit"]["blocked_events"])))
    if snapshot["audit"]["salary_mismatches"]:
        raise SystemExit("Salary arithmetic audit failed")


if __name__=="__main__":
    main()

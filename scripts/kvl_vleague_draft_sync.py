#!/usr/bin/env python3
"""Safe, deterministic 2026-27 draft-pick -> KOVO registration public bridge.

This is an ADDITIVE public presentation projection, NOT a Google Drive MASTER
writer or a legal current-registration certificate. Only official selected
draft results and high-confidence public KOVO registration events can enter.
Identity conflicts never generate a profile link. No removals/transfers by
inference, no salary, and no dates invented from a posting date.
"""
from __future__ import annotations

import argparse
import copy
from datetime import date
import hashlib
import json
from pathlib import Path
import re

SEASON = "2026-27"
BASE = Path(__file__).resolve().parents[1]
OUT = "data/kovo/official-notices/2026-27/draft_registration_bridge.json"
SOURCE_PATHS = {
    "applicants": "data/draft-applicants/2026-27/applicants.json",
    "links": "data/draft-applicants/2026-27/player-links.json",
    "results": "data/draft-applicants/2026-27/results.json",
    "notices": "data/kovo/official-notices/2026-27/index.json",
    "projection": "data/kovo/official-notices/2026-27/roster_projection.json",
    "men": "data/competitions/v-league-men-2026-27/rosters.json",
    "women": "data/competitions/v-league-women-2026-27/rosters.json",
    "university": "data/master/player_master_229_v2.json",
    "school": "data/master/player_master_school_v1.json",
    "professional": "data/master/player_master_pro_vleague_2026_27_v1.json",
    "national": "data/national/player_id_links_v1.json",
}
TEAMS = {
    "KAL": ("대한항공", "M"), "HDC": ("현대캐피탈", "M"),
    "WRC": ("우리카드", "M"), "KBI": ("KB손해보험", "M"),
    "KEP": ("한국전력", "M"), "OKF": ("OK저축은행", "M"),
    "SFB": ("삼성화재", "M"), "GSC": ("GS칼텍스", "W"),
    "KEX": ("한국도로공사", "W"), "HHC": ("현대건설", "W"),
    "HPS": ("흥국생명", "W"), "IBK": ("IBK기업은행", "W"),
    "RSP": ("정관장", "W"), "SOO": ("SOOP", "W"),
}
POS = {
    "세터": "S", "아웃사이드히터": "OH", "미들블로커": "MB",
    "아포짓": "OP", "아포짓스파이커": "OP", "리베로": "L",
}
URL = re.compile(r"^https://kovo[.]co[.]kr/news/official-notices/([0-9]+)$")
PID = re.compile(r"^KVL-P-[0-9]{6}$")


def clean(value):
    """Only accepted KOVO trainee suffixes. Typos stay in the review queue."""
    value = re.sub(r"\s+", "", str(value or ""))
    return re.sub(r"\((?:수련선수|수련)\)$", "", value)


def read(root, rel):
    return json.loads((root / rel).read_text(encoding="utf-8"))


def canonical_identities(data):
    by_id = {}
    for key in ("university", "school", "professional"):
        for p in data[key]:
            pid = p.get("system", {}).get("player_id")
            if pid:
                by_id.setdefault(pid, []).append(p)
    for p in data["national"].get("links", []):
        pid = p.get("player_id")
        if pid:
            by_id.setdefault(pid, []).append({
                "identity": {"name_ko": p.get("name_ko"), "birth_date": p.get("birth_date"),
                             "gender": p.get("gender", "M"), "nationality": "KOR"},
                "source_ref": {"file": SOURCE_PATHS["national"]},
            })
    return by_id


def build(data):
    applicants = {p["applicant_id"]: p for p in data["applicants"]["applicants"]}
    links = {p["applicant_id"]: p for p in data["links"]["links"]}
    notices = {int(n["id"]): n for n in data["notices"]["notices"]}
    current = {}
    for p in data["projection"]["active_players"]:
        g = "M" if p.get("gender") == "남" else "W" if p.get("gender") == "여" else ""
        current.setdefault((g, p.get("team"), clean(p.get("name"))), []).append(p)
    identities = canonical_identities(data)
    site = {**data["men"], **data["women"]}
    results = data["results"].get("results", [])
    registered, profiles, blocked = [], [], []
    seen_ids, seen_picks = set(), set()

    def review(app, reason, *, source=""):
        blocked.append({"applicant_id": app["applicant_id"], "gender": app["gender"],
                        "name": app["name"], "reason": reason, "source_url": source})

    for result in sorted(results, key=lambda r: (r.get("season", ""), r.get("applicant_id", ""))):
        a = applicants.get(result.get("applicant_id"))
        if not a:
            raise ValueError("draft_result_without_official_applicant")
        if (a["applicant_id"] in seen_picks or a["season"] != SEASON or result.get("season") != SEASON
                or result.get("status") != "selected" or result.get("record_status") != "VERIFIED"
                or result.get("access_level") != "PUBLIC" or not result.get("source_url", "").startswith("https://cdn.kovo.co.kr/")
                or (result.get("team_code") not in TEAMS)
                or TEAMS[result["team_code"]] != (result.get("team"), a["gender"])):
            raise ValueError("invalid_or_duplicated_official_draft_selection")
        seen_picks.add(a["applicant_id"])
        key = (a["gender"], result["team"], clean(a["name"]))
        matches = current.get(key, [])
        if len(matches) != 1:
            review(a, "official_registration_not_uniquely_verified")
            continue
        p = matches[0]
        url = p.get("last_change_source", "")
        match = URL.fullmatch(url)
        number = str(p.get("number") or "")
        pos = POS.get(p.get("position"), "")
        if (not match or not number.isdigit() or not 1 <= int(number) <= 999 or not pos
                or p.get("last_status") != "registration"):
            review(a, "unsupported_registration_event", source=url)
            continue
        notice = notices.get(int(match[1]))
        if not notice or notice.get("source_url") != url or not re.fullmatch(r"[0-9a-f]{64}", notice.get("html_sha256", "")):
            review(a, "official_source_version_missing", source=url)
            continue
        events = [e for e in notice.get("events", [])
                  if (e.get("season") == SEASON and e.get("kind") == "registration"
                      and e.get("confidence") == "high" and e.get("gender") == p.get("gender")
                      and clean(e.get("player_name")) == clean(p["name"])
                      and e.get("to_team") == result["team"]
                      and str(e.get("jersey_number", "")) == number)]
        if len(events) != 1:
            review(a, "source_event_not_uniquely_verified", source=url)
            continue
        team_roster = site[result["team_code"]]["players"]
        conflict = [x for x in team_roster if int(x.get("number") or 0) == int(number)
                    and clean(x.get("name")) != clean(a["name"])]
        if conflict:
            review(a, "published_jersey_number_conflict", source=url)
            continue
        link = links.get(a["applicant_id"], {})
        profile_id = None
        canonical = None
        if (link.get("status") == "matched" and link.get("profile_verified") is True
                and PID.fullmatch(link.get("player_id", "")) and link.get("evidence")):
            candidate_id = link["player_id"]
            refs = identities.get(candidate_id, [])
            # A validated draft link still cannot silently overwrite a different
            # current MASTER name, DOB or gender. Unknown IDs can receive a
            # source-limited profile; never synthesize a full birth date.
            values = {(x.get("identity", {}).get("name_ko"),
                       x.get("identity", {}).get("birth_date") or None,
                       str(x.get("identity", {}).get("gender") or a["gender"]).upper())
                      for x in refs}
            known_names = {x[0] for x in values if x[0]}
            known_genders = {x[2] for x in values}
            known_dobs = {x[1] for x in values if x[1]}
            if ((known_names and known_names != {a["name"]})
                    or known_genders - {a["gender"]}
                    or len(known_dobs) > 1
                    or (known_dobs and a.get("birth_year") and
                        not all(str(d).startswith(str(a["birth_year"])) for d in known_dobs))
                    or candidate_id in seen_ids):
                review(a, "linked_player_identity_conflict", source=url)
            else:
                profile_id = candidate_id
                canonical = next((x for x in refs if x.get("system", {}).get("player_id") == profile_id), None)
                seen_ids.add(profile_id)
        else:
            review(a, "player_id_not_verified", source=url)

        item = {
            "applicant_id": a["applicant_id"], "name": a["name"], "gender": a["gender"],
            "team": result["team"], "team_code": result["team_code"],
            "number": int(number), "position": pos,
            "height_cm": a.get("height_cm"), "birth_year": a.get("birth_year"),
            "former_affiliation": a.get("affiliation") or "",
            "draft_kind": result.get("kind"), "draft_round": result.get("round"),
            "draft_pick": result.get("pick"), "draft_source_url": result["source_url"],
            "player_id": profile_id, "registration_source_url": url,
            "registration_notice_id": int(match[1]),
            "registration_notice_sha256": notice["html_sha256"],
            "registration_event_id": events[0]["event_id"],
            "notice_published_date": str(notice.get("published_at") or "")[:10],
            "registration_source_type": "official_KOVO_registration",
        }
        registered.append(item)
        if profile_id:
            known_identity = canonical.get("identity", {}) if canonical else {}
            old_roster = canonical.get("current_roster", {}) if canonical else {}
            raw_dob = known_identity.get("birth_date") or None
            name_en = known_identity.get("name_en") or ""
            nationality = known_identity.get("nationality") or ""
            profile = {
                "system": {"player_id": profile_id, "display_code": "",
                           "status": "active", "data_confidence": "official-registration-and-reviewed-draft-link",
                           "id_status": "permanent", "data_scope": "domestic",
                           "competition_level": "professional"},
                "identity": {"name_ko": a["name"], "name_en": name_en, "gender": a["gender"],
                             "nationality": nationality, "birth_date": raw_dob,
                             "birth_year": int(a.get("birth_year") or (raw_dob or "0")[:4] or 0)},
                "physical": {"height_cm": (canonical or {}).get("physical", {}).get("height_cm") or a.get("height_cm"),
                             "weight_kg": (canonical or {}).get("physical", {}).get("weight_kg")},
                "volleyball": {"position": pos, "level": "professional",
                               "team_name": result["team"], "team_code": result["team_code"],
                               "league": "V-League", "season": SEASON,
                               "entry_status": "Official KOVO registration notice"},
                "current_roster": {"team_name": result["team"], "team_code": result["team_code"],
                                   "season": SEASON, "jersey_number": int(number),
                                   "grade": "", "position": pos, "draft_eligible": False,
                                   "previous_school": a.get("affiliation") or old_roster.get("school_name") or "",
                                   "latest_competition_name": "2026-27 V-리그",
                                   "latest_competition_start": "2026"},
                "links": copy.deepcopy((canonical or {}).get("links") or {}),
                "roster_history": copy.deepcopy((canonical or {}).get("roster_history") or []),
                "source_ids": list(dict.fromkeys([*((canonical or {}).get("source_ids") or []),
                                                 result.get("source_id"), "KVL-SRC-KOVO-NOTICE-"+match[1]])),
                "source_ref": {"file": OUT, "verification": "KOVO official notice + validated draft pick",
                               "registration_source": url, "last_change_source": url,
                               "as_of": str(notice.get("published_at") or "")[:10]},
            }
            profiles.append(profile)

    # Explicitly report other new official names, without manufacturing a
    # same-person match, release, transfer, registered date, or KVL Player_ID.
    selected = {(r["gender"], r["team"], clean(r["name"])) for r in registered}
    manual = []
    for (gender, team, key), candidates in current.items():
        code = next((c for c, pair in TEAMS.items() if pair == (team, gender)), None)
        if not code or not candidates or (gender, team, key) in selected:
            continue
        roster = site[code]["players"]
        if any(clean(x.get("name")) == key for x in roster):
            continue
        # Existing foreign registered-name aliases and prior reviewed return
        # events are not automatically taken to mean a new person.
        manual.append({"gender": gender, "team": team, "name": candidates[0].get("name"),
                       "reason": "non_draft_or_name_alias_requires_review"})
    registered.sort(key=lambda x: (x["gender"], x["team_code"], x["number"], x["name"]))
    profiles.sort(key=lambda x: x["system"]["player_id"])
    blocked.sort(key=lambda x: (x["gender"], x["name"], x["reason"]))
    manual.sort(key=lambda x: (x["gender"], x["team"], x["name"]))
    return {
        "schema_version": 1, "season": SEASON,
        "scope": "Additive public V-League draft registration projection; not Google Drive MASTER, legal registration certificate or match entry list",
        "source_kind": "official_kovo_public_notices_and_reviewed_draft_selections",
        "registration_count": len(registered), "profile_count": len(profiles),
        "registered": registered, "profiles": profiles,
        "review": {"draft_blocked": blocked, "other_roster_candidates": manual},
    }


def generate(root):
    data = {key: read(root, path) for key, path in SOURCE_PATHS.items()}
    output = build(data)
    # SHA of each input is evidence of exactly which revision was used, not
    # a review/approval for unrelated records.
    output["input_sha256"] = {
        key: hashlib.sha256((root / rel).read_bytes()).hexdigest()
        for key, rel in SOURCE_PATHS.items()
    }
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(BASE))
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    output = generate(root)
    encoded = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    target = root / OUT
    if args.check and (not target.exists() or target.read_text(encoding="utf-8") != encoded):
        raise SystemExit("DRAFT_ROSTER_BRIDGE_STALE")
    if args.write:
        target.write_text(encoded, encoding="utf-8")
    print(json.dumps({
        "registration_count": output["registration_count"],
        "profile_count": output["profile_count"],
        "blocked_draft_count": len(output["review"]["draft_blocked"]),
        "other_review_count": len(output["review"]["other_roster_candidates"]),
        "mode": "write" if args.write else "check" if args.check else "preview",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

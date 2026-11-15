#!/usr/bin/env python3
"""Verified public education facts from the 2026-27 KOVO draft applicant PDFs.

This is a separate, immutable-period education snapshot: high school and
university fields only, not inferred degrees, admissions, transfers or dates.
It never writes original Player IDs, Google Sheets MASTER, historical records
or the registered-draft bridge.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = "data/draft-applicants/2026-27/education-v1.json"
PATHS = {
    "applicants": "data/draft-applicants/2026-27/applicants.json",
    "M": "data/draft-applicants/2026-27/list-details.json",
    "W": "data/draft-applicants/2026-27/women-list-details.json",
}
SOURCE_IDS = {"M": "KOVO-2026-27-M-157978", "W": "KOVO-2026-27-W-157977"}
EXPECTED = {"M": 59, "W": 58}
OVERSEAS_UNIVERSITIES = {"UCLA", "Ontario Tech Uni"}
HIGH_RE = re.compile(r"(?:고|여상|상고|공고|고등학교)$")
UNIV_RE = re.compile(r"(?:대학교|대)$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")


def read(root, relative):
    return json.loads((root / relative).read_text(encoding="utf-8"))


def clean(value):
    return str(value or "").strip()


def high_school(value):
    value = clean(value)
    return value if HIGH_RE.search(value) else ""


def university(value):
    value = clean(value)
    return value if UNIV_RE.search(value) or value in OVERSEAS_UNIVERSITIES else ""


def build(data):
    applicants = data["applicants"]
    if applicants.get("season") != "2026-27" or not isinstance(applicants.get("applicants"), list):
        raise ValueError("APPLICANT_SEASON_OR_SCHEMA_MISMATCH")
    full = applicants["applicants"]
    if len(full) != 117 or len({p["applicant_id"] for p in full}) != 117:
        raise ValueError("APPLICANT_SNAPSHOT_CHANGED_REVIEW_REQUIRED")
    official = {}
    lookup = {}
    for gender in ("M", "W"):
        src = data[gender]
        basis = src.get("source") or {}
        if (src.get("season") != "2026-27"
            or src.get("division") != gender
            or len(src.get("records", [])) != EXPECTED[gender]
            or basis.get("source_id") != SOURCE_IDS[gender]
            or not SHA_RE.fullmatch(str(basis.get("sha256", "")))
            or basis.get("url") != f"https://kovo.co.kr/news/kovo/press/{SOURCE_IDS[gender].split('-')[-1]}"):
            raise ValueError("OFFICIAL_EDUCATION_PDF_SOURCE_CHANGED")
        official[gender] = {
            "source_id": basis["source_id"], "source_url": basis["url"],
            "source_sha256": basis["sha256"], "verified_at": src["verified_at"]
        }
        for row in src["records"]:
            rid = row["applicant_id"]
            if rid in lookup or row.get("record_status") != "VERIFIED" or row.get("access_level") != "PUBLIC":
                raise ValueError("DUPLICATE_OR_UNVERIFIED_EDUCATION_RECORD")
            if row.get("source_id") != SOURCE_IDS[gender] or not DATE_RE.fullmatch(row.get("birth_date", "")):
                raise ValueError("INVALID_EDUCATION_SOURCE_IDENTITY")
            lookup[rid] = (gender, row)
    if len(lookup) != len(full):
        raise ValueError("EDUCATION_APPLICANT_COVERAGE_CHANGED")
    rows = []
    for a in sorted(full, key=lambda p: p["applicant_id"]):
        gender = a.get("gender")
        detail_pair = lookup.get(a["applicant_id"])
        if gender not in ("M", "W") or not detail_pair or detail_pair[0] != gender:
            raise ValueError("EDUCATION_GENDER_OR_IDENTITY_MISMATCH")
        d = detail_pair[1]
        if (d["name"] != a["name"] or d["affiliation"] != a["affiliation"]
            or d["source_order"] != a["source_order"]
            or not d["birth_date"].startswith(str(a.get("birth_year", "")))
            or a.get("access_level") != "PUBLIC" or a.get("record_status") != "VERIFIED"
            or a.get("source_id") != SOURCE_IDS[gender]):
            raise ValueError("EDUCATION_NAME_BIRTH_YEAR_OR_AFFILIATION_CONFLICT")
        cat = a.get("category")
        affiliation, prior = clean(a["affiliation"]), clean(d.get("previous_school"))
        hs = high_school(prior) if cat == "university" else ""
        uni = university(affiliation) if cat == "university" else ""
        if cat == "high_school":
            hs = high_school(affiliation)
        elif cat == "industrial":
            hs = high_school(prior)
            uni = university(prior)
        elif cat == "overseas_korean":
            uni = university(prior)
        elif cat != "university":
            raise ValueError("UNKNOWN_DRAFT_APPLICANT_CATEGORY")
        # Old middle schools, industrial clubs and unverified prior schools
        # must not be labeled 'high school' or 'university'.
        if not hs and not uni:
            continue
        row = {
            "applicant_id": a["applicant_id"], "name": a["name"], "gender": gender,
            "source_id": SOURCE_IDS[gender],
        }
        if hs: row["high_school"] = hs
        if uni: row["university"] = uni
        rows.append(row)
    return {
        "schema_version": 1,
        "season": "2026-27",
        "scope": "2026-27 verified KOVO draft applicant PDF education facts only; no presumed degree or enrollment",
        "sources": official,
        "record_count": len(rows),
        "records": rows,
    }


def generate(root):
    data = {key: read(root, path) for key, path in PATHS.items()}
    result = build(data)
    result["input_sha256"] = {
        key: hashlib.sha256((root / path).read_bytes()).hexdigest()
        for key, path in PATHS.items()
    }
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(ROOT))
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--write", action="store_true")
    group.add_argument("--check", action="store_true")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    value = generate(root)
    out = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    path = root / OUT
    if args.check and (not path.is_file() or path.read_text(encoding="utf-8") != out):
        raise SystemExit("KOVO_DRAFT_EDUCATION_STALE")
    if args.write:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(out, encoding="utf-8")
    print(json.dumps({
        "status": "verified", "records": value["record_count"],
        "both": sum(bool(r.get("high_school") and r.get("university")) for r in value["records"]),
        "high_school": sum(bool(r.get("high_school")) for r in value["records"]),
        "university": sum(bool(r.get("university")) for r in value["records"]),
        "mode": "write" if args.write else "check" if args.check else "preview",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

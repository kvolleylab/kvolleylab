#!/usr/bin/env python3
"""Build the 2026 university men's Player Master registration batch.

This script joins each university Seed file with its permanent-ID mapping file,
validates the 207 approved candidate rows, and writes a Player Master-shaped JSON
batch without modifying data/master/player_master.json.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = ROOT / "data" / "seed"
OUTPUT = SEED_DIR / "university_player_master_registration_batch_v1.json"

SCHOOLS = [
    ("skku", "player_master_seed_domestic_univ_skku_2026_v1.json"),
    ("hongik", "player_master_seed_domestic_univ_hongik_2026_v1.json"),
    ("kyunghee", "player_master_seed_domestic_univ_kyunghee_2026_v1.json"),
    ("myongji", "player_master_seed_domestic_univ_myongji_2026_v1.json"),
    ("kyungil", "player_master_seed_domestic_univ_kyungil_2026_v1.json"),
    ("honam", "player_master_seed_domestic_univ_honam_2026_v1.json"),
    ("joongbu", "player_master_seed_domestic_univ_joongbu_2026_v1.json"),
    ("hanyang", "player_master_seed_domestic_univ_hanyang_2026_v1.json"),
    ("kyonggi", "player_master_seed_domestic_univ_kyonggi_2026_v1.json"),
    ("chosun", "player_master_seed_domestic_univ_chosun_2026_v1.json"),
    ("mokpo", "player_master_seed_domestic_univ_mokpo_2026_v1.json"),
    ("chungnam", "player_master_seed_domestic_univ_chungnam_2026_v1.json"),
    ("gyeongsang", "player_master_seed_domestic_univ_gyeongsang_2026_v1.json"),
    ("woosuk", "player_master_seed_domestic_univ_woosuk_2026_v1.json"),
]

EXPECTED_COUNT = 207
EXPECTED_FIRST_ID = "KVL-P-000017"
EXPECTED_LAST_ID = "KVL-P-000223"


def load_json(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path.relative_to(ROOT)}")
    with path.open("r", encoding="utf-8") as file:
        value = json.load(file)
    if not isinstance(value, list):
        raise ValueError(f"Expected a JSON array: {path.relative_to(ROOT)}")
    return value


def build_record(seed: dict, mapping: dict, school_slug: str) -> dict:
    draft_id = mapping["draft_player_id"]
    if seed.get("draft_id") != draft_id:
        raise ValueError(f"Draft ID mismatch: {draft_id}")
    if seed.get("name_ko") != mapping.get("name_ko"):
        raise ValueError(f"Name mismatch: {draft_id}")

    birth_date = mapping.get("birth_date")
    birth_year = int(birth_date[:4]) if birth_date else None
    today = date.today().isoformat()

    return {
        "system": {
            "player_id": mapping["proposed_player_id"],
            "display_code": mapping.get("display_code"),
            "created_at": today,
            "updated_at": today,
            "status": "pending_review",
            "data_confidence": "unreviewed",
            "id_status": "reserved",
        },
        "identity": {
            "name_ko": seed["name_ko"],
            "name_en": "",
            "name_native": seed["name_ko"],
            "gender": "M",
            "nationality": "KOR",
            "birth_date": birth_date,
            "birth_year": birth_year,
            "birth_place": "",
            "hand": "Unknown",
        },
        "physical": {
            "height_cm": seed.get("height_cm"),
            "weight_kg": seed.get("weight_kg"),
            "spike_cm": None,
            "block_cm": None,
        },
        "links": {
            "volleybox": "",
            "fivb_profile": "",
            "kovo_profile": "",
            "instagram": "",
            "youtube": "",
            "photo": "",
        },
        "source_ids": [f"SRC-DOM-UNIV-2026-{school_slug.upper()}-001"],
        "registration_review": {
            "source_draft_id": draft_id,
            "jersey_no": seed.get("jersey_no"),
            "position": seed.get("position"),
            "previous_school": seed.get("previous_school"),
            "review_status": mapping.get("review_status", "needs_review"),
        },
    }


def main() -> None:
    records: list[dict] = []

    for school_slug, seed_filename in SCHOOLS:
        seed_rows = load_json(SEED_DIR / seed_filename)
        mapping_rows = load_json(SEED_DIR / f"{school_slug}_player_id_mapping_v1.json")
        seed_by_draft_id = {row["draft_id"]: row for row in seed_rows}

        for mapping in mapping_rows:
            draft_id = mapping["draft_player_id"]
            seed = seed_by_draft_id.get(draft_id)
            if seed is None:
                raise ValueError(f"Mapping has no Seed row: {draft_id}")
            records.append(build_record(seed, mapping, school_slug))

    records.sort(key=lambda row: row["system"]["player_id"])
    ids = [row["system"]["player_id"] for row in records]

    if len(records) != EXPECTED_COUNT:
        raise ValueError(f"Expected {EXPECTED_COUNT} records, found {len(records)}")
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate proposed player IDs detected")
    if ids[0] != EXPECTED_FIRST_ID or ids[-1] != EXPECTED_LAST_ID:
        raise ValueError(f"Unexpected ID range: {ids[0]} through {ids[-1]}")

    expected_ids = [f"KVL-P-{number:06d}" for number in range(17, 224)]
    if ids != expected_ids:
        raise ValueError("Proposed player ID sequence contains a gap or ordering error")

    with OUTPUT.open("w", encoding="utf-8") as file:
        json.dump(records, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"Created {OUTPUT.relative_to(ROOT)} with {len(records)} records")


if __name__ == "__main__":
    main()

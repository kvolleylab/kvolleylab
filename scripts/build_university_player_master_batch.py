#!/usr/bin/env python3
"""Build the 2026 university men's Player Master registration batch.

Joins each school's Seed file with its permanent-ID mapping file, validates
identity links and ID continuity, and writes a 207-player review batch without
modifying data/master/player_master.json.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = ROOT / "data" / "seed"
OUTPUT = SEED_DIR / "player_master_registration_batch_univ_2026_v1.json"

SCHOOLS = [
    ("skku", "player_master_seed_domestic_univ_skku_2026_v1.json", "SKKU"),
    ("hongik", "player_master_seed_domestic_univ_hongik_2026_v1.json", "HONGIK"),
    ("kyunghee", "player_master_seed_domestic_univ_kyunghee_2026_v1.json", "KYUNGHEE"),
    ("myongji", "player_master_seed_domestic_univ_myongji_2026_v1.json", "MYONGJI"),
    ("kyungil", "player_master_seed_domestic_univ_kyungil_2026_v1.json", "KYUNGIL"),
    ("honam", "player_master_seed_domestic_univ_honam_2026_v1.json", "HONAM"),
    ("joongbu", "player_master_seed_domestic_univ_joongbu_2026_v1.json", "JOONGBU"),
    ("hanyang", "player_master_seed_domestic_univ_hanyang_2026_v1.json", "HANYANG"),
    ("kyonggi", "player_master_seed_domestic_univ_kyonggi_2026_v1.json", "KYONGGI"),
    ("chosun", "player_master_seed_domestic_univ_chosun_2026_v1.json", "CHOSUN"),
    ("mokpo", "player_master_seed_domestic_univ_mokpo_2026_v1.json", "MOKPO"),
    ("chungnam", "player_master_seed_domestic_univ_chungnam_2026_v1.json", "CHUNGNAM"),
    ("gyeongsang", "player_master_seed_domestic_univ_gyeongsang_2026_v1.json", "GYEONGSANG"),
    ("woosuk", "player_master_seed_domestic_univ_woosuk_2026_v1.json", "WOOSUK"),
]

EXPECTED_COUNT = 207
EXPECTED_IDS = [f"KVL-P-{n:06d}" for n in range(17, 224)]


def load_json(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError(f"Expected JSON list: {path}")
    return data


def normalize_seed(row: dict[str, Any]) -> dict[str, Any]:
    """Normalize both legacy nested Seed rows and newer flat Seed rows."""
    if "draft_id" in row:
        return {
            "draft_id": row["draft_id"],
            "name_ko": row["name_ko"],
            "jersey_no": row.get("jersey_no"),
            "position": row.get("position"),
            "height_cm": row.get("height_cm"),
            "weight_kg": row.get("weight_kg"),
            "previous_school": row.get("previous_school"),
        }

    system = row.get("system", {})
    identity = row.get("identity", {})
    classification = row.get("classification", {})
    physical = row.get("physical", {})
    roster = row.get("roster", {})
    return {
        "draft_id": system.get("player_id"),
        "name_ko": identity.get("name_ko"),
        "jersey_no": roster.get("jersey_number"),
        "position": classification.get("primary_position"),
        "height_cm": physical.get("height_cm"),
        "weight_kg": physical.get("weight_kg"),
        "previous_school": roster.get("previous_school"),
    }


def build_record(seed: dict[str, Any], mapping: dict[str, Any], source_code: str) -> dict[str, Any]:
    return {
        "system": {
            "player_id": mapping["proposed_player_id"],
            "display_code": mapping.get("display_code"),
            "created_at": "2026-07-11",
            "updated_at": "2026-07-11",
            "status": "pending_review",
            "data_confidence": "unreviewed",
            "id_status": "proposed",
        },
        "identity": {
            "name_ko": seed["name_ko"],
            "name_en": "",
            "name_native": seed["name_ko"],
            "gender": "M",
            "nationality": "KOR",
            "birth_date": mapping.get("birth_date"),
            "birth_year": None,
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
        "source_ids": [f"SRC-DOM-UNIV-2026-{source_code}-001"],
        "registration_review": {
            "draft_player_id": mapping["draft_player_id"],
            "jersey_no": seed.get("jersey_no"),
            "position": seed.get("position"),
            "previous_school": seed.get("previous_school"),
            "review_status": mapping.get("review_status", "needs_review"),
        },
    }


def main() -> None:
    batch: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for slug, seed_filename, source_code in SCHOOLS:
        seeds = [normalize_seed(row) for row in load_json(SEED_DIR / seed_filename)]
        mappings = load_json(SEED_DIR / f"{slug}_player_id_mapping_v1.json")
        seed_by_draft = {row["draft_id"]: row for row in seeds}

        for mapping in mappings:
            draft_id = mapping["draft_player_id"]
            if draft_id not in seed_by_draft:
                raise ValueError(f"Mapping draft ID missing from Seed: {draft_id}")

            seed = seed_by_draft[draft_id]
            if seed["name_ko"] != mapping["name_ko"]:
                raise ValueError(f"Name mismatch for {draft_id}")

            player_id = mapping["proposed_player_id"]
            if player_id in seen_ids:
                raise ValueError(f"Duplicate proposed player ID: {player_id}")
            seen_ids.add(player_id)
            batch.append(build_record(seed, mapping, source_code))

    batch.sort(key=lambda row: row["system"]["player_id"])
    actual_ids = [row["system"]["player_id"] for row in batch]

    if len(batch) != EXPECTED_COUNT:
        raise ValueError(f"Expected {EXPECTED_COUNT} records, got {len(batch)}")
    if actual_ids != EXPECTED_IDS:
        raise ValueError("Proposed IDs must be continuous from KVL-P-000017 to KVL-P-000223")

    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(batch, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"Created {OUTPUT.relative_to(ROOT)} with {len(batch)} records")


if __name__ == "__main__":
    main()

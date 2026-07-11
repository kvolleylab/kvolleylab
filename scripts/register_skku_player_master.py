#!/usr/bin/env python3

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "data" / "master" / "player_master.json"
BATCH = ROOT / "data" / "seed" / "player_master_registration_batch_skku_2026_v1.json"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    master = load(MASTER)
    batch = load(BATCH)

    if len(master) != 16:
        raise ValueError(f"Expected 16 existing Player Master records, got {len(master)}")
    if len(batch) != 16:
        raise ValueError(f"Expected 16 SKKU records, got {len(batch)}")

    existing_ids = [row["system"]["player_id"] for row in master]
    expected_existing = [f"KVL-P-{n:06d}" for n in range(1, 17)]
    if existing_ids != expected_existing:
        raise ValueError("Existing Player Master IDs are not KVL-P-000001 through KVL-P-000016")

    formal_batch = []
    for row in batch:
        formal_batch.append({
            "system": row["system"],
            "identity": row["identity"],
            "physical": row["physical"],
            "links": row["links"],
            "source_ids": row["source_ids"],
        })

    batch_ids = [row["system"]["player_id"] for row in formal_batch]
    expected_batch = [f"KVL-P-{n:06d}" for n in range(17, 33)]
    if batch_ids != expected_batch:
        raise ValueError("SKKU batch IDs are not KVL-P-000017 through KVL-P-000032")

    merged = master + formal_batch
    all_ids = [row["system"]["player_id"] for row in merged]
    if len(all_ids) != len(set(all_ids)):
        raise ValueError("Duplicate Player Master IDs detected")
    if all_ids != [f"KVL-P-{n:06d}" for n in range(1, 33)]:
        raise ValueError("Final Player Master IDs are not continuous through KVL-P-000032")

    MASTER.write_text(json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("Registered 16 SKKU players; Player Master now contains 32 records")


if __name__ == "__main__":
    main()

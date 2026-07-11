#!/usr/bin/env python3

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "data" / "master" / "player_master.json"
BATCH = ROOT / "data" / "seed" / "player_master_registration_batch_hongik_2026_v1.json"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    master = load(MASTER)
    batch = load(BATCH)

    if len(master) != 32:
        raise ValueError(f"Expected 32 existing Player Master records, got {len(master)}")
    if len(batch) != 16:
        raise ValueError(f"Expected 16 Hongik records, got {len(batch)}")

    existing_ids = [row["system"]["player_id"] for row in master]
    if existing_ids != [f"KVL-P-{n:06d}" for n in range(1, 33)]:
        raise ValueError("Existing Player Master IDs are not continuous through KVL-P-000032")

    formal_batch = [
        {
            "system": row["system"],
            "identity": row["identity"],
            "physical": row["physical"],
            "links": row["links"],
            "source_ids": row["source_ids"],
        }
        for row in batch
    ]

    batch_ids = [row["system"]["player_id"] for row in formal_batch]
    if batch_ids != [f"KVL-P-{n:06d}" for n in range(33, 49)]:
        raise ValueError("Hongik batch IDs are not KVL-P-000033 through KVL-P-000048")

    merged = master + formal_batch
    all_ids = [row["system"]["player_id"] for row in merged]
    if len(all_ids) != len(set(all_ids)):
        raise ValueError("Duplicate Player Master IDs detected")
    if all_ids != [f"KVL-P-{n:06d}" for n in range(1, 49)]:
        raise ValueError("Final Player Master IDs are not continuous through KVL-P-000048")

    MASTER.write_text(json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("Registered 16 Hongik players; Player Master now contains 48 records")


if __name__ == "__main__":
    main()

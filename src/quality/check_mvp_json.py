#!/usr/bin/env python3
"""Quality checks for the p5 MVP JSON export."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_PATH = ROOT / "app" / "public" / "data" / "oil_power_mvp.json"
REQUIRED_HIGHLIGHTS = ["VEN", "SAU", "CAN", "USA", "CHN", "IND", "RUS", "IRN", "IRQ", "JPN", "KOR"]
REQUIRED_FIELDS = [
    "country_name",
    "iso3",
    "year",
    "oil_reserves",
    "oil_production",
    "oil_consumption",
    "reserve_rank",
    "production_rank",
    "consumption_rank",
    "global_reserve_share",
    "global_production_share",
    "global_consumption_share",
    "net_oil_balance_proxy",
    "production_consumption_ratio",
    "oil_power_index",
]


def main() -> None:
    payload = json.loads(INPUT_PATH.read_text())
    rows = payload["rows"]
    metadata = payload["metadata"]
    anchor_year = metadata["anchorYear"]
    errors: list[str] = []
    seen: set[tuple[str, int]] = set()

    for index, row in enumerate(rows):
        missing = [field for field in REQUIRED_FIELDS if field not in row]
        if missing:
            errors.append(f"row {index} missing fields: {', '.join(missing)}")
        key = (row["iso3"], row["year"])
        if key in seen:
            errors.append(f"duplicate iso3-year: {key}")
        seen.add(key)

    anchor_rows = {row["iso3"]: row for row in rows if row["year"] == anchor_year}
    for iso3 in REQUIRED_HIGHLIGHTS:
        row = anchor_rows.get(iso3)
        if not row:
            errors.append(f"missing highlighted country at anchor year: {iso3}")
            continue
        for field in ["oil_reserves", "oil_production", "oil_consumption"]:
            if row[field] is None:
                errors.append(f"{iso3} missing {field} at anchor year {anchor_year}")

    if not metadata["completeYears"]:
        errors.append("metadata.completeYears is empty")
    if anchor_year not in metadata["completeYears"]:
        errors.append("anchor year is not listed in completeYears")

    if errors:
        print("\n".join(errors))
        raise SystemExit(1)

    print(f"passed MVP JSON checks ({len(rows):,} rows, anchor year {anchor_year})")


if __name__ == "__main__":
    main()

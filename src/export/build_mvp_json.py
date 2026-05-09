#!/usr/bin/env python3
"""Export the compact JSON used by the no-map p5 MVP."""

from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_PATH = ROOT / "data" / "canonical" / "oil_power_country_year.csv"
OUTPUT_PATH = ROOT / "app" / "public" / "data" / "oil_power_mvp.json"
HIGHLIGHT_ISO3 = ["VEN", "SAU", "CAN", "USA", "CHN", "IND", "RUS", "IRN", "IRQ", "JPN", "KOR"]
FIELDS = [
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


def parse_value(field: str, value: str) -> str | int | float | None:
    if value == "":
        return None
    if field == "year" or field.endswith("_rank"):
        return int(value)
    if field in {"country_name", "iso3"}:
        return value
    return float(value)


def main() -> None:
    with INPUT_PATH.open(newline="") as handle:
        rows = [
            {field: parse_value(field, row[field]) for field in FIELDS}
            for row in csv.DictReader(handle)
        ]

    complete_years = sorted(
        {
            int(row["year"])
            for row in rows
            if row["oil_reserves"] is not None
            and row["oil_production"] is not None
            and row["oil_consumption"] is not None
        }
    )
    anchor_year = 2020 if 2020 in complete_years else max(complete_years)
    highlight_rows = [row for row in rows if row["year"] == anchor_year and row["iso3"] in HIGHLIGHT_ISO3]
    missing_highlights = sorted(set(HIGHLIGHT_ISO3) - {str(row["iso3"]) for row in highlight_rows})
    if missing_highlights:
        raise SystemExit(f"missing highlighted countries for {anchor_year}: {', '.join(missing_highlights)}")

    # The sketch needs visual zeroes for demand-only countries that have no
    # reported reserves or production rows in OWID. Keep canonical CSV nulls.
    for row in rows:
        for field in [
            "oil_reserves",
            "oil_production",
            "oil_consumption",
            "global_reserve_share",
            "global_production_share",
            "global_consumption_share",
        ]:
            if row[field] is None:
                row[field] = 0.0

        production = float(row["oil_production"])
        consumption = float(row["oil_consumption"])
        row["net_oil_balance_proxy"] = production - consumption
        row["production_consumption_ratio"] = None if consumption == 0 else production / consumption

    payload = {
        "metadata": {
            "title": "Oil Power MVP",
            "narrative": "Having oil underground is not the same as having oil power.",
            "anchorYear": anchor_year,
            "completeYears": complete_years,
            "highlightIso3": HIGHLIGHT_ISO3,
            "source": "Our World in Data grapher CSVs compiled in data/canonical/oil_power_country_year.csv",
        },
        "rows": rows,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUTPUT_PATH} ({len(rows):,} rows, {len(complete_years)} complete years)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build country-year refining bridge proxy from crude imports and refined exports."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CRUDE_PATH = ROOT / "data" / "canonical" / "crude_trade_edges.csv"
REFINED_PATH = ROOT / "data" / "canonical" / "refined_trade_edges.csv"
COUNTRY_DIM_PATH = ROOT / "data" / "canonical" / "dim_country.csv"
OUTPUT_PATH = ROOT / "app" / "public" / "data" / "refining_proxy.json"


def parse_float(value: str) -> float:
    return 0.0 if value == "" else float(value)


def add_trade_totals(
    path: Path,
    totals: dict[tuple[int, str], dict[str, float]],
    import_key: str,
    export_key: str,
) -> None:
    with path.open(newline="") as handle:
        for row in csv.DictReader(handle):
            year = int(row["year"])
            value = parse_float(row["trade_value_thousand_usd"])
            totals[(year, row["importer_iso3"])][import_key] += value
            totals[(year, row["exporter_iso3"])][export_key] += value


def main() -> None:
    for path in [CRUDE_PATH, REFINED_PATH, COUNTRY_DIM_PATH]:
        if not path.exists():
            raise SystemExit(f"missing required file: {path}")

    with COUNTRY_DIM_PATH.open(newline="") as handle:
        countries = {row["iso3"]: row["country_name"] for row in csv.DictReader(handle)}

    totals: dict[tuple[int, str], dict[str, float]] = defaultdict(
        lambda: {
            "crude_import_value_thousand_usd": 0.0,
            "crude_export_value_thousand_usd": 0.0,
            "refined_import_value_thousand_usd": 0.0,
            "refined_export_value_thousand_usd": 0.0,
        }
    )
    add_trade_totals(CRUDE_PATH, totals, "crude_import_value_thousand_usd", "crude_export_value_thousand_usd")
    add_trade_totals(REFINED_PATH, totals, "refined_import_value_thousand_usd", "refined_export_value_thousand_usd")

    by_year_bridge_total: dict[int, float] = defaultdict(float)
    rows = []
    for (year, iso3), row in sorted(totals.items()):
        if iso3 not in countries:
            continue
        crude_in = row["crude_import_value_thousand_usd"]
        refined_out = row["refined_export_value_thousand_usd"]
        bridge = min(crude_in, refined_out)
        row.update(
            {
                "year": year,
                "iso3": iso3,
                "country_name": countries[iso3],
                "refining_bridge_value_thousand_usd": bridge,
            }
        )
        by_year_bridge_total[year] += bridge
        rows.append(dict(row))

    max_bridge_by_year: dict[int, float] = defaultdict(float)
    for row in rows:
        year = int(row["year"])
        max_bridge_by_year[year] = max(max_bridge_by_year[year], float(row["refining_bridge_value_thousand_usd"]))

    for row in rows:
        year = int(row["year"])
        bridge = float(row["refining_bridge_value_thousand_usd"])
        total = by_year_bridge_total[year]
        max_bridge = max_bridge_by_year[year]
        row["share_of_year_refining_bridge"] = 0 if total == 0 else bridge / total
        row["bridge_norm"] = 0 if max_bridge == 0 else bridge / max_bridge

    payload = {
        "metadata": {
            "title": "Refining bridge proxy",
            "source": "Derived from CEPII BACI HS17 crude 270900 imports and refined petroleum 271000 exports",
            "unit": "trade_value_thousand_usd",
            "method": "country-year proxy: min(crude imports, refined petroleum exports)",
            "years": sorted({row["year"] for row in rows}),
        },
        "rows": rows,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUTPUT_PATH} ({len(rows):,} country-year rows)")


if __name__ == "__main__":
    main()

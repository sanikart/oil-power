#!/usr/bin/env python3
"""Export compact refined petroleum trade JSON for the p5 app."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_PATH = ROOT / "data" / "canonical" / "refined_trade_edges.csv"
OUTPUT_PATH = ROOT / "app" / "public" / "data" / "refined_trade_edges.json"
MAX_EDGES_PER_YEAR = 90


def parse_float(value: str) -> float:
    return 0.0 if value == "" else float(value)


def main() -> None:
    if not INPUT_PATH.exists():
        raise SystemExit(f"missing {INPUT_PATH}; run src/transform/build_refined_trade_edges.py")

    by_year: dict[int, list[dict[str, object]]] = defaultdict(list)
    with INPUT_PATH.open(newline="") as handle:
        for row in csv.DictReader(handle):
            year = int(row["year"])
            value = parse_float(row["trade_value_thousand_usd"])
            quantity = parse_float(row["quantity_metric_tons"])
            by_year[year].append(
                {
                    "year": year,
                    "exporter_iso3": row["exporter_iso3"],
                    "exporter_name": row["exporter_name"],
                    "importer_iso3": row["importer_iso3"],
                    "importer_name": row["importer_name"],
                    "trade_value_thousand_usd": value,
                    "quantity_metric_tons": quantity,
                }
            )

    rows = []
    for year, edges in sorted(by_year.items()):
        edges.sort(key=lambda row: float(row["trade_value_thousand_usd"]), reverse=True)
        top_edges = edges[:MAX_EDGES_PER_YEAR]
        max_value = max((float(row["trade_value_thousand_usd"]) for row in top_edges), default=0.0)
        total_value = sum(float(row["trade_value_thousand_usd"]) for row in edges)
        for edge in top_edges:
            edge["share_of_year_trade"] = 0 if total_value == 0 else float(edge["trade_value_thousand_usd"]) / total_value
            edge["value_norm"] = 0 if max_value == 0 else float(edge["trade_value_thousand_usd"]) / max_value
        rows.extend(top_edges)

    payload = {
        "metadata": {
            "title": "Bilateral refined petroleum trade edges",
            "source": "CEPII BACI HS17 V202601, product 271000 refined petroleum oils and preparations",
            "unit": "trade_value_thousand_usd; quantity_metric_tons",
            "maxEdgesPerYear": MAX_EDGES_PER_YEAR,
            "years": sorted(by_year),
        },
        "edges": rows,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUTPUT_PATH} ({len(rows):,} exported edges across {len(by_year)} years)")


if __name__ == "__main__":
    main()

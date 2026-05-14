#!/usr/bin/env python3
"""Quality checks for bilateral crude trade JSON."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_PATH = ROOT / "app" / "public" / "data" / "crude_trade_edges.json"
REQUIRED_FIELDS = [
    "year",
    "exporter_iso3",
    "importer_iso3",
    "trade_value_thousand_usd",
    "quantity_metric_tons",
    "share_of_year_trade",
    "value_norm",
]


def main() -> None:
    payload = json.loads(INPUT_PATH.read_text())
    errors = []
    seen = set()
    for index, edge in enumerate(payload.get("edges", [])):
        missing = [field for field in REQUIRED_FIELDS if field not in edge]
        if missing:
            errors.append(f"edge {index} missing fields: {', '.join(missing)}")
        key = (edge.get("year"), edge.get("exporter_iso3"), edge.get("importer_iso3"))
        if key in seen:
            errors.append(f"duplicate year-exporter-importer edge: {key}")
        seen.add(key)
        if edge.get("exporter_iso3") == edge.get("importer_iso3"):
            errors.append(f"self edge: {key}")
        if float(edge.get("trade_value_thousand_usd", 0)) <= 0:
            errors.append(f"non-positive trade value: {key}")
        if not 0 <= float(edge.get("value_norm", 0)) <= 1:
            errors.append(f"value_norm outside [0, 1]: {key}")

    if 2020 not in payload.get("metadata", {}).get("years", []):
        errors.append("2020 missing from trade years")
    if not payload.get("edges"):
        errors.append("no trade edges exported")

    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    print(f"passed trade JSON checks ({len(payload['edges']):,} edges)")


if __name__ == "__main__":
    main()

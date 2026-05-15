#!/usr/bin/env python3
"""Quality checks for refined petroleum trade and refining proxy JSON."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REFINED_PATH = ROOT / "app" / "public" / "data" / "refined_trade_edges.json"
PROXY_PATH = ROOT / "app" / "public" / "data" / "refining_proxy.json"
REQUIRED_EDGE_FIELDS = [
    "year",
    "exporter_iso3",
    "importer_iso3",
    "trade_value_thousand_usd",
    "quantity_metric_tons",
    "share_of_year_trade",
    "value_norm",
]
REQUIRED_PROXY_FIELDS = [
    "year",
    "iso3",
    "crude_import_value_thousand_usd",
    "refined_export_value_thousand_usd",
    "refining_bridge_value_thousand_usd",
    "share_of_year_refining_bridge",
    "bridge_norm",
]


def check_edges(errors: list[str]) -> None:
    payload = json.loads(REFINED_PATH.read_text())
    seen = set()
    for index, edge in enumerate(payload.get("edges", [])):
        missing = [field for field in REQUIRED_EDGE_FIELDS if field not in edge]
        if missing:
            errors.append(f"refined edge {index} missing fields: {', '.join(missing)}")
        key = (edge.get("year"), edge.get("exporter_iso3"), edge.get("importer_iso3"))
        if key in seen:
            errors.append(f"duplicate refined edge: {key}")
        seen.add(key)
        if edge.get("exporter_iso3") == edge.get("importer_iso3"):
            errors.append(f"self refined edge: {key}")
        if float(edge.get("trade_value_thousand_usd", 0)) <= 0:
            errors.append(f"non-positive refined value: {key}")
        if not 0 <= float(edge.get("value_norm", 0)) <= 1:
            errors.append(f"refined value_norm outside [0, 1]: {key}")

    if 2020 not in payload.get("metadata", {}).get("years", []):
        errors.append("2020 missing from refined trade years")
    if not payload.get("edges"):
        errors.append("no refined edges exported")


def check_proxy(errors: list[str]) -> None:
    payload = json.loads(PROXY_PATH.read_text())
    seen = set()
    for index, row in enumerate(payload.get("rows", [])):
        missing = [field for field in REQUIRED_PROXY_FIELDS if field not in row]
        if missing:
            errors.append(f"proxy row {index} missing fields: {', '.join(missing)}")
        key = (row.get("year"), row.get("iso3"))
        if key in seen:
            errors.append(f"duplicate proxy row: {key}")
        seen.add(key)
        for field in REQUIRED_PROXY_FIELDS:
            if field in {"year", "iso3"}:
                continue
            if float(row.get(field, 0)) < 0:
                errors.append(f"negative proxy field {field}: {key}")
        if not 0 <= float(row.get("bridge_norm", 0)) <= 1:
            errors.append(f"bridge_norm outside [0, 1]: {key}")

    if 2020 not in payload.get("metadata", {}).get("years", []):
        errors.append("2020 missing from refining proxy years")
    if not any(float(row.get("refining_bridge_value_thousand_usd", 0)) > 0 for row in payload.get("rows", [])):
        errors.append("no positive refining bridge rows")


def main() -> None:
    errors: list[str] = []
    check_edges(errors)
    check_proxy(errors)
    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    refined = json.loads(REFINED_PATH.read_text())
    proxy = json.loads(PROXY_PATH.read_text())
    print(f"passed refined checks ({len(refined['edges']):,} edges, {len(proxy['rows']):,} proxy rows)")


if __name__ == "__main__":
    main()

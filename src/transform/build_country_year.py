#!/usr/bin/env python3
"""Build the first canonical country-year oil-power table from OWID CSVs."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from statistics import fmean


ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "config" / "source_urls.json"
OUTPUT_PATH = ROOT / "data" / "canonical" / "oil_power_country_year.csv"
COUNTRY_DIM_PATH = ROOT / "data" / "canonical" / "dim_country.csv"
WORLD_CODE = "OWID_WRL"


def parse_float(value: str) -> float | None:
    if value == "":
        return None
    return float(value)


def read_metric(source: dict[str, str]) -> tuple[dict[tuple[str, int], dict[str, object]], dict[int, float]]:
    path = ROOT / source["raw_path"]
    value_column = source["value_column"]
    canonical_column = source["canonical_column"]
    rows: dict[tuple[str, int], dict[str, object]] = {}
    world_by_year: dict[int, float] = {}

    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            code = raw["Code"].strip()
            if not code:
                continue
            year = int(raw["Year"])
            value = parse_float(raw[value_column])
            if code == WORLD_CODE and value is not None:
                world_by_year[year] = value
            if code.startswith("OWID_"):
                continue

            key = (code, year)
            rows[key] = {
                "country_name": raw["Entity"].strip(),
                "iso3": code,
                "year": year,
                canonical_column: value,
            }

    return rows, world_by_year


def pct_rank_values(values: list[float]) -> dict[float, float]:
    if not values:
        return {}
    unique = sorted(set(values))
    if len(unique) == 1:
        return {unique[0]: 1.0}
    return {value: index / (len(unique) - 1) for index, value in enumerate(unique)}


def safe_divide(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator in (None, 0):
        return None
    return numerator / denominator


def add_rank(rows: list[dict[str, object]], metric: str, rank_column: str) -> None:
    by_year: dict[int, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        if row.get(metric) is not None:
            by_year[int(row["year"])].append(row)

    for year_rows in by_year.values():
        year_rows.sort(key=lambda item: float(item[metric]), reverse=True)
        previous_value = None
        previous_rank = 0
        for index, row in enumerate(year_rows, start=1):
            value = row[metric]
            rank = previous_rank if value == previous_value else index
            row[rank_column] = rank
            previous_value = value
            previous_rank = rank


def add_oil_power_index(rows: list[dict[str, object]]) -> None:
    by_year: dict[int, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        by_year[int(row["year"])].append(row)

    components = [
        ("global_reserve_share", "reserve_component", 0.30),
        ("global_production_share", "production_component", 0.40),
        ("global_consumption_share", "consumption_component", 0.30),
    ]

    for year_rows in by_year.values():
        rank_maps: dict[str, dict[float, float]] = {}
        for source_column, _, _ in components:
            values = [float(row[source_column]) for row in year_rows if row.get(source_column) is not None]
            rank_maps[source_column] = pct_rank_values(values)

        for row in year_rows:
            weighted_scores: list[float] = []
            weights: list[float] = []
            for source_column, component_column, weight in components:
                value = row.get(source_column)
                component = None if value is None else rank_maps[source_column][float(value)]
                row[component_column] = component
                if component is not None:
                    weighted_scores.append(component * weight)
                    weights.append(weight)
            row["oil_power_index"] = sum(weighted_scores) / sum(weights) if weights else None


def archetype(row: dict[str, object]) -> str:
    reserves = row.get("reserve_component")
    production = row.get("production_component")
    consumption = row.get("consumption_component")
    ratio = row.get("production_consumption_ratio")

    if reserves is not None and production is not None and consumption is not None:
        if reserves >= 0.85 and production >= 0.85 and consumption >= 0.85:
            return "Full-Spectrum Oil Power"
        if reserves >= 0.85 and production < 0.50:
            return "Sleeping Giant"
        if production >= 0.85 and (consumption < 0.60 or (ratio is not None and ratio >= 1.5)):
            return "Export Power"
        if consumption >= 0.85 and (production < 0.60 or (ratio is not None and ratio < 0.75)):
            return "Demand Giant"
        if reserves >= 0.85:
            return "Resource Giant"
    return "Oil Participant"


def main() -> None:
    config = json.loads(CONFIG_PATH.read_text())
    merged: dict[tuple[str, int], dict[str, object]] = {}
    world_totals: dict[str, dict[int, float]] = {}

    for source in config["owid"].values():
        rows, world_by_year = read_metric(source)
        canonical_column = source["canonical_column"]
        world_totals[canonical_column] = world_by_year
        for key, row in rows.items():
            target = merged.setdefault(
                key,
                {"country_name": row["country_name"], "iso3": row["iso3"], "year": row["year"]},
            )
            target[canonical_column] = row.get(canonical_column)

    output_rows = sorted(merged.values(), key=lambda item: (str(item["iso3"]), int(item["year"])))
    for row in output_rows:
        reserves = row.get("oil_reserves")
        production = row.get("oil_production")
        consumption = row.get("oil_consumption")
        year = int(row["year"])
        row["global_reserve_share"] = safe_divide(reserves, world_totals["oil_reserves"].get(year))
        row["global_production_share"] = safe_divide(production, world_totals["oil_production"].get(year))
        row["global_consumption_share"] = safe_divide(consumption, world_totals["oil_consumption"].get(year))
        row["net_oil_balance_proxy"] = None if production is None or consumption is None else production - consumption
        row["production_consumption_ratio"] = safe_divide(production, consumption)
        row["reserve_to_production_years"] = safe_divide(reserves, production)
        row["reserve_to_consumption_years"] = safe_divide(reserves, consumption)

    add_rank(output_rows, "oil_reserves", "reserve_rank")
    add_rank(output_rows, "oil_production", "production_rank")
    add_rank(output_rows, "oil_consumption", "consumption_rank")
    add_oil_power_index(output_rows)

    for row in output_rows:
        row["oil_archetype"] = archetype(row)

    fieldnames = [
        "country_name",
        "iso3",
        "year",
        "oil_reserves",
        "oil_production",
        "oil_consumption",
        "global_reserve_share",
        "global_production_share",
        "global_consumption_share",
        "reserve_rank",
        "production_rank",
        "consumption_rank",
        "net_oil_balance_proxy",
        "production_consumption_ratio",
        "reserve_to_production_years",
        "reserve_to_consumption_years",
        "reserve_component",
        "production_component",
        "consumption_component",
        "oil_power_index",
        "oil_archetype",
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    country_rows = {}
    for row in output_rows:
        country_rows[str(row["iso3"])] = {
            "iso3": row["iso3"],
            "country_name": row["country_name"],
        }

    with COUNTRY_DIM_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["iso3", "country_name"])
        writer.writeheader()
        writer.writerows(country_rows[iso3] for iso3 in sorted(country_rows))

    latest_year = max(int(row["year"]) for row in output_rows)
    latest_rows = [row for row in output_rows if int(row["year"]) == latest_year]
    top_producers = sorted(
        (row for row in latest_rows if row.get("oil_production") is not None),
        key=lambda row: float(row["oil_production"]),
        reverse=True,
    )[:5]
    print(f"wrote {OUTPUT_PATH} ({len(output_rows):,} rows)")
    print(f"wrote {COUNTRY_DIM_PATH} ({len(country_rows):,} countries)")
    print(f"latest year: {latest_year}")
    print("top production countries:", ", ".join(f"{row['iso3']}={row['oil_production']}" for row in top_producers))


if __name__ == "__main__":
    main()

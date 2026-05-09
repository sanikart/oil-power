#!/usr/bin/env python3
"""Basic quality checks for the country-year oil-power table."""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_PATH = ROOT / "data" / "canonical" / "oil_power_country_year.csv"
NON_NEGATIVE_FIELDS = ["oil_reserves", "oil_production", "oil_consumption"]


def parse_float(value: str) -> float | None:
    if value == "":
        return None
    return float(value)


def main() -> None:
    errors: list[str] = []
    seen_keys: set[tuple[str, str]] = set()

    with INPUT_PATH.open(newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)

    for line_number, row in enumerate(rows, start=2):
        key = (row["iso3"], row["year"])
        if key in seen_keys:
            errors.append(f"duplicate iso3-year at line {line_number}: {key}")
        seen_keys.add(key)

        for field in NON_NEGATIVE_FIELDS:
            value = parse_float(row[field])
            if value is not None and value < 0:
                errors.append(f"negative {field} at line {line_number}: {value}")

        index = parse_float(row["oil_power_index"])
        if index is not None and not 0 <= index <= 1:
            errors.append(f"oil_power_index outside [0, 1] at line {line_number}: {index}")

    if errors:
        print("\n".join(errors))
        raise SystemExit(1)

    print(f"passed country-year checks ({len(rows):,} rows, {len(seen_keys):,} unique iso3-year keys)")


if __name__ == "__main__":
    main()

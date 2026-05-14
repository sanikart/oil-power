#!/usr/bin/env python3
"""Build canonical bilateral crude petroleum trade edges from CEPII BACI."""

from __future__ import annotations

import csv
import zipfile
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACI_ZIP = ROOT / "data" / "raw" / "baci" / "BACI_HS17_V202601.zip"
OUTPUT_PATH = ROOT / "data" / "canonical" / "crude_trade_edges.csv"
COUNTRY_DIM_PATH = ROOT / "data" / "canonical" / "dim_country.csv"
HS_CODE = "270900"
YEARS = range(2017, 2025)


def read_country_iso(zip_file: zipfile.ZipFile) -> dict[str, dict[str, str]]:
    country_file = next(name for name in zip_file.namelist() if "country_codes" in name.lower())
    with zip_file.open(country_file) as raw:
        reader = csv.DictReader((line.decode("utf-8-sig") for line in raw))
        mapping = {}
        for row in reader:
            code = (row.get("country_code") or row.get("i") or "").strip()
            iso3 = (row.get("country_iso3") or row.get("iso_3digit_alpha") or row.get("iso3") or "").strip()
            name = (
                row.get("country_name")
                or row.get("country_name_abbreviation")
                or row.get("country_name_full")
                or row.get("country")
                or ""
            ).strip()
            if code and iso3:
                mapping[code] = {"iso3": iso3, "country_name": name or iso3}
        return mapping


def normalize_quantity(value: str) -> float | None:
    value = value.strip()
    if not value or value.upper() == "NA":
        return None
    return float(value)


def main() -> None:
    if not BACI_ZIP.exists():
        raise SystemExit(f"missing BACI zip: {BACI_ZIP}\nDownload from https://www.cepii.fr/DATA_DOWNLOAD/baci/data/BACI_HS17_V202601.zip")

    with COUNTRY_DIM_PATH.open(newline="") as handle:
        app_iso3 = {row["iso3"] for row in csv.DictReader(handle)}

    edge_totals: dict[tuple[int, str, str], dict[str, float | int | str | None]] = {}
    skipped_missing_iso = 0
    skipped_not_in_app = 0

    with zipfile.ZipFile(BACI_ZIP) as zip_file:
        country_map = read_country_iso(zip_file)
        for year in YEARS:
            member = f"BACI_HS17_Y{year}_V202601.csv"
            if member not in zip_file.namelist():
                print(f"skipping missing {member}")
                continue
            with zip_file.open(member) as raw:
                reader = csv.DictReader((line.decode("utf-8-sig") for line in raw))
                for row in reader:
                    if row["k"].strip() != HS_CODE:
                        continue
                    exporter = country_map.get(row["i"].strip())
                    importer = country_map.get(row["j"].strip())
                    if not exporter or not importer:
                        skipped_missing_iso += 1
                        continue
                    exporter_iso3 = exporter["iso3"]
                    importer_iso3 = importer["iso3"]
                    if exporter_iso3 == importer_iso3:
                        continue
                    if exporter_iso3 not in app_iso3 or importer_iso3 not in app_iso3:
                        skipped_not_in_app += 1
                        continue
                    key = (year, exporter_iso3, importer_iso3)
                    target = edge_totals.setdefault(
                        key,
                        {
                            "year": year,
                            "exporter_iso3": exporter_iso3,
                            "exporter_name": exporter["country_name"],
                            "importer_iso3": importer_iso3,
                            "importer_name": importer["country_name"],
                            "trade_value_thousand_usd": 0.0,
                            "quantity_metric_tons": 0.0,
                            "quantity_missing": 0,
                        },
                    )
                    target["trade_value_thousand_usd"] = float(target["trade_value_thousand_usd"]) + float(row["v"])
                    quantity = normalize_quantity(row["q"])
                    if quantity is None:
                        target["quantity_missing"] = int(target["quantity_missing"]) + 1
                    else:
                        target["quantity_metric_tons"] = float(target["quantity_metric_tons"]) + quantity

    rows = sorted(edge_totals.values(), key=lambda row: (int(row["year"]), -float(row["trade_value_thousand_usd"])))
    fieldnames = [
        "year",
        "exporter_iso3",
        "exporter_name",
        "importer_iso3",
        "importer_name",
        "trade_value_thousand_usd",
        "quantity_metric_tons",
        "quantity_missing",
    ]
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"wrote {OUTPUT_PATH} ({len(rows):,} edges, HS {HS_CODE})")
    print(f"skipped missing ISO mappings: {skipped_missing_iso:,}")
    print(f"skipped countries outside app dimension: {skipped_not_in_app:,}")


if __name__ == "__main__":
    main()

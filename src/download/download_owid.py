#!/usr/bin/env python3
"""Download OWID oil CSVs used by the country-year dataset."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "config" / "source_urls.json"


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        data = response.read()
    destination.write_bytes(data)
    print(f"downloaded {destination} ({len(data):,} bytes)")


def main() -> None:
    config = json.loads(CONFIG_PATH.read_text())
    for source in config["owid"].values():
        download(source["url"], ROOT / source["raw_path"])


if __name__ == "__main__":
    main()

# Oil Power: Unified Dataset

This repository builds a public dataset for comparing countries across five oil-power dimensions:

- who has oil, using proved reserves
- who pumps oil, using annual production
- who burns oil, using annual consumption
- who buys from whom, using bilateral crude petroleum trade flows
- who pays how much, using import value and quantity

The first compiled layer uses Our World in Data country-year oil metrics. The bilateral trade network layer is scaffolded for CEPII BACI HS 2709 crude petroleum files.

## Current Outputs

```text
data/canonical/oil_power_country_year.csv
```

Planned outputs:

```text
data/canonical/oil_power_country_year.parquet
data/canonical/crude_trade_edges.parquet
data/canonical/crude_importer_year.parquet
data/canonical/crude_exporter_year.parquet
data/marts/oil_power_country_profiles.parquet
```

## Quick Start

```bash
python3 src/download/download_owid.py
python3 src/transform/build_country_year.py
python3 src/export/build_mvp_json.py
python3 src/quality/check_country_year.py
python3 src/quality/check_mvp_json.py
```

## Interactive MVP

This branch contains a third no-map p5.js story canvas. Each highlighted country is drawn as an abstract knowledge-graph cluster with three circles:

- `Has`: proved oil reserves
- `Pumps`: annual oil production
- `Burns`: annual oil consumption

Countries are placed by rough directional world-region logic, not by geographic boundaries, projections, outlines, or a map view.

```bash
python3 -m http.server 8000 --directory app
```

Open `http://localhost:8000`.

The MVP JSON treats missing reserve/production values as visual zeroes so demand-only countries such as Japan and South Korea can appear as consumption powers. The canonical CSV keeps upstream nulls unchanged.

## Sources

- Our World in Data oil proved reserves: https://ourworldindata.org/grapher/oil-proved-reserves
- Our World in Data oil production: https://ourworldindata.org/grapher/oil-production-by-country
- Our World in Data oil consumption: https://ourworldindata.org/grapher/oil-consumption-by-country
- CEPII BACI: https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/baci_webpage.html
- UN Comtrade Plus: https://comtradeplus.un.org/

## Caveat

This dataset should not be interpreted as a perfect measurement of contract oil prices or physical barrel movements. Bilateral trade values and quantities can be affected by CIF/FOB valuation, re-exports, crude quality, sanctions, reporting gaps, and timing differences.

## License

Code is MIT licensed. Raw and derived data remain subject to upstream source terms; see `DATA_LICENSE.md`.

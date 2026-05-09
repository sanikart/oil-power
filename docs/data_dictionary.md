# Data Dictionary

## `oil_power_country_year`

| Field | Meaning |
|---|---|
| `country_name` | Country name from OWID |
| `iso3` | ISO-3 country code |
| `year` | Calendar year |
| `oil_reserves` | Proved oil reserves from OWID source CSV |
| `oil_production` | Oil production from OWID source CSV |
| `oil_consumption` | Oil consumption from OWID source CSV |
| `global_reserve_share` | Country reserves divided by OWID world reserves for the year |
| `global_production_share` | Country production divided by OWID world production for the year |
| `global_consumption_share` | Country consumption divided by OWID world consumption for the year |
| `reserve_rank` | Annual country rank by proved reserves |
| `production_rank` | Annual country rank by production |
| `consumption_rank` | Annual country rank by consumption |
| `net_oil_balance_proxy` | Production minus consumption |
| `production_consumption_ratio` | Production divided by consumption |
| `reserve_to_production_years` | Reserves divided by annual production in source units |
| `reserve_to_consumption_years` | Reserves divided by annual consumption in source units |
| `oil_power_index` | Percentile-normalized composite score: 30% reserves, 40% production, 30% consumption |
| `oil_archetype` | Initial label derived from relative reserve, production, and consumption strength |

## Planned `crude_trade_edges`

| Field | Meaning |
|---|---|
| `exporter_iso3` | Seller/exporting country |
| `importer_iso3` | Buyer/importing country |
| `year` | Calendar year |
| `hs_code` | HS commodity code, filtered to `2709` |
| `trade_value_usd` | Annual crude trade value |
| `quantity_tonnes` | Annual crude trade quantity |
| `avg_unit_value_usd_per_tonne` | Trade value divided by tonnes |
| `importer_supplier_share` | Supplier share within buyer imports |
| `exporter_customer_share` | Buyer share within seller exports |

## `oil_power_mvp.json`

Compact JSON export for the p5.js MVP at `app/public/data/oil_power_mvp.json`.

The export preserves the country-year fields needed by the visualization and adds metadata for the anchor year, complete visualization years, highlighted countries, and source note. Missing reserve/production/consumption values are converted to visual zeroes in this export only; the canonical CSV remains the source of truth.

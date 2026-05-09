# Oil Power: Unified Dataset Plan

## Working title

**Oil Power: Who Has It, Who Pumps It, Who Burns It, Who Buys From Whom, and Who Pays How Much**

## 1. Product thesis

Most oil dashboards answer only one question: **who has the most oil?**

That misses the real story. Oil power is split across five dimensions:

1. **Who has it?** — proved reserves.
2. **Who pumps it?** — crude/oil production.
3. **Who burns it?** — oil consumption.
4. **Who buys from whom?** — bilateral crude oil trade flows.
5. **Who pays how much?** — import bill and average unit price paid.

The unified dataset should make it possible to compare countries as **resource holders**, **producers**, **consumers**, **buyers**, **suppliers**, and **price-takers**.

---

## 2. Core data sources

### 2.1 Reserves, production, and consumption

Use **Our World in Data (OWID)** as the clean base layer for country-year energy metrics.

OWID’s oil reserves, production, and consumption datasets are based on the **Energy Institute Statistical Review of World Energy 2025**, which analyses data on world energy markets from the prior year.

Recommended OWID tables:

| Dimension | Dataset | Grain | Notes |
|---|---|---:|---|
| Has it | Oil proved reserves | country-year | Proved reserves by country |
| Pumps it | Oil production by country | country-year | Production time series |
| Burns it | Oil consumption by country | country-year | Consumption time series |
| Burns it per person | Per-capita oil consumption | country-year | Useful for lifestyle/dependence views |

Primary references:
- https://ourworldindata.org/grapher/oil-proved-reserves
- https://ourworldindata.org/grapher/oil-production-by-country
- https://ourworldindata.org/grapher/oil-consumption-by-country
- https://www.energyinst.org/statistical-review/resources-and-data-downloads

### 2.2 Bilateral oil trade: who buys from whom

Use **CEPII BACI** as the preferred bilateral trade-flow source.

BACI provides annual bilateral trade flows for around 200 countries at the HS 6-digit product level, covering roughly 5,000 products. It is built for country-product trade analysis and is better suited than raw customs data when building a global network because it harmonizes bilateral trade reports.

Filter to crude petroleum:

```text
HS code: 2709
Commodity: Petroleum oils and oils from bituminous minerals, crude
```

Primary references:
- https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/baci_webpage.html
- https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37
- https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/DescriptionBACI.html

### 2.3 Alternative / validation source for trade and prices

Use **UN Comtrade** as a validation and fallback source.

UN Comtrade / Comtrade Plus supports reporter-partner trade flows by HS commodity, including **HS 2709**, with fields such as trade value, net weight, gross weight, quantity, and quantity unit.

Primary references:
- https://comtradeplus.un.org/
- Example HS 2709 flow page: https://comtradeplus.un.org/TradeFlow?AggregateBy=none&BreakdownMode=plus&CommodityCodes=2709&Flows=X&Frequency=A&Partners=0&Reporters=all&period=2024

### 2.4 Optional sector-quality source

Use **IEA Oil Information** as a high-quality cross-check where coverage fits.

IEA Oil Information includes imports from many origins and exports to many destinations for crude oil and refined products, reported in kilotonnes. Its coverage is strongest for OECD and selected countries, not necessarily the whole world.

Primary reference:
- https://www.iea.org/data-and-statistics/data-product/oil-information

---

## 3. Unified data model

Build two main tables and several derived views.

### 3.1 Country-year fact table

This is the central analytical table.

```text
country_year_oil_power
```

Suggested schema:

| Column | Type | Description |
|---|---|---|
| `country_name` | string | Canonical country name |
| `iso3` | string | ISO-3 country code |
| `region` | string | Region / continent |
| `income_group` | string | Optional World Bank income group |
| `year` | int | Calendar year |
| `oil_reserves` | float | Proved oil reserves, normalized unit |
| `oil_production` | float | Oil production, normalized unit |
| `oil_consumption` | float | Oil consumption, normalized unit |
| `oil_consumption_per_capita` | float | Per-capita consumption |
| `population` | float | Optional join |
| `gdp_current_usd` | float | Optional join |
| `global_reserve_share` | float | Country reserves / world reserves |
| `global_production_share` | float | Country production / world production |
| `global_consumption_share` | float | Country consumption / world consumption |
| `reserve_rank` | int | Annual rank by reserves |
| `production_rank` | int | Annual rank by production |
| `consumption_rank` | int | Annual rank by consumption |
| `net_oil_balance_proxy` | float | Production - consumption |
| `production_consumption_ratio` | float | Production / consumption |
| `reserve_to_production_years` | float | Reserves / annual production |
| `reserve_to_consumption_years` | float | Reserves / annual consumption |
| `oil_power_index` | float | Composite score |
| `oil_archetype` | string | Interpretable country class |

### 3.2 Bilateral trade edge table

This is the network table.

```text
crude_trade_edges
```

Suggested schema:

| Column | Type | Description |
|---|---|---|
| `year` | int | Calendar year |
| `exporter_name` | string | Exporting country |
| `exporter_iso3` | string | Exporting country ISO-3 |
| `importer_name` | string | Importing country |
| `importer_iso3` | string | Importing country ISO-3 |
| `hs_code` | string | `2709` |
| `commodity_name` | string | Crude petroleum |
| `trade_value_usd` | float | Trade value |
| `quantity_tonnes` | float | Quantity |
| `avg_unit_value_usd_per_tonne` | float | Trade value / tonnes |
| `importer_supplier_share` | float | Supplier share of importer’s crude imports |
| `exporter_customer_share` | float | Buyer share of exporter’s crude exports |
| `edge_rank_for_importer` | int | Supplier rank for importer-year |
| `edge_rank_for_exporter` | int | Customer rank for exporter-year |

### 3.3 Importer-year table

Useful for “who pays how much” and dependency narratives.

```text
crude_importer_year
```

Suggested schema:

| Column | Type | Description |
|---|---|---|
| `importer_iso3` | string | Importer |
| `year` | int | Year |
| `total_crude_import_value_usd` | float | Total crude import bill |
| `total_crude_import_quantity_tonnes` | float | Total crude import quantity |
| `avg_import_price_usd_per_tonne` | float | Weighted average price |
| `import_bill_pct_gdp` | float | Import bill / GDP |
| `top_supplier_iso3` | string | Largest supplier |
| `top_supplier_share` | float | Largest supplier share |
| `supplier_concentration_hhi` | float | Sum of squared supplier shares |
| `num_active_suppliers` | int | Count of suppliers above threshold |
| `import_dependency_proxy` | float | Imports / consumption, if units allow |

### 3.4 Exporter-year table

Useful for “who depends on selling to whom.”

```text
crude_exporter_year
```

Suggested schema:

| Column | Type | Description |
|---|---|---|
| `exporter_iso3` | string | Exporter |
| `year` | int | Year |
| `total_crude_export_value_usd` | float | Total crude export value |
| `total_crude_export_quantity_tonnes` | float | Total crude export quantity |
| `avg_export_price_usd_per_tonne` | float | Weighted average price |
| `top_customer_iso3` | string | Largest buyer |
| `top_customer_share` | float | Largest buyer share |
| `customer_concentration_hhi` | float | Sum of squared customer shares |
| `num_active_customers` | int | Count of buyers above threshold |

---

## 4. Unit strategy

This project will fail if units are sloppy.

Use a clear unit contract:

### Recommended canonical units

| Measure | Canonical unit |
|---|---|
| Reserves | million tonnes, or barrels after documented conversion |
| Production | million tonnes per year, or barrels per day converted to annual barrels |
| Consumption | million tonnes per year, TWh, or barrels-equivalent |
| Trade quantity | tonnes |
| Trade value | current USD |
| Price paid | USD per tonne |

### Practical recommendation

For the first version:

- Keep trade prices in **USD per tonne**.
- Avoid converting every price into USD/barrel unless you have crude-grade density.
- If you do add USD/barrel, label it as an approximation.

Formula:

```text
avg_unit_value_usd_per_tonne = trade_value_usd / quantity_tonnes
```

Approximate barrel conversion, only if needed:

```text
avg_unit_value_usd_per_barrel ≈ avg_unit_value_usd_per_tonne / 7.33
```

Caveat: barrels per tonne varies by crude density/API gravity.

---

## 5. Derived metrics

### 5.1 Core power shares

```text
reserve_power = country_reserves / world_reserves
production_power = country_production / world_production
consumption_power = country_consumption / world_consumption
```

### 5.2 Composite oil power index

Default weighting:

```text
oil_power_index =
  0.30 * normalized_reserve_power +
  0.40 * normalized_production_power +
  0.30 * normalized_consumption_power
```

Why production gets more weight: oil underground matters, but market and geopolitical power depend heavily on oil that actually reaches the market.

### 5.3 Net oil balance proxy

```text
net_oil_balance_proxy = oil_production - oil_consumption
```

Interpretation:

- Positive: likely exporter / supply-side power.
- Negative: likely importer / demand-side vulnerability.

This is a proxy, not a customs-trade balance.

### 5.4 Supplier dependency

For each importer-year:

```text
importer_supplier_share =
  imports_from_supplier / total_imports_by_importer
```

Supplier concentration:

```text
supplier_concentration_hhi =
  sum(importer_supplier_share^2)
```

Interpretation:

| HHI | Dependency signal |
|---:|---|
| `< 0.15` | diversified |
| `0.15–0.25` | moderately concentrated |
| `> 0.25` | highly concentrated |

### 5.5 Customer dependency

For each exporter-year:

```text
exporter_customer_share =
  exports_to_customer / total_exports_by_exporter
```

Customer concentration:

```text
customer_concentration_hhi =
  sum(exporter_customer_share^2)
```

### 5.6 Price paid

For importer-supplier-year:

```text
avg_unit_value_usd_per_tonne =
  trade_value_usd / quantity_tonnes
```

For importer-year:

```text
avg_import_price_usd_per_tonne =
  total_import_value_usd / total_import_quantity_tonnes
```

Price premium/discount:

```text
price_premium_vs_global =
  importer_avg_price / global_avg_price - 1
```

---

## 6. Country archetypes

Each country-year can receive one or more labels.

| Archetype | Logic |
|---|---|
| **Resource Giant** | High reserve share |
| **Sleeping Giant** | High reserves, low production |
| **Export Power** | High production, low consumption, high exports |
| **Demand Giant** | High consumption, low production |
| **Supplier-Dependent Burner** | High import dependency and high supplier concentration |
| **Full-Spectrum Oil Power** | High reserves, production, and consumption |
| **Price Taker** | Pays materially above global average import price |
| **Discount Buyer** | Pays materially below global average import price |
| **Fragile Petro-State** | High oil rents / GDP, concentrated customer base |
| **Transit / Re-export Anomaly** | Trade flows large relative to production/reserves |

---

## 7. Data pipeline

### 7.1 Folder layout

```text
oil-power/
  data/
    raw/
      owid/
      baci/
      comtrade_validation/
      iea_optional/
      country_metadata/
    interim/
    canonical/
    marts/
  notebooks/
  src/
    download/
    normalize/
    transform/
    metrics/
    quality/
    export/
  app/
  docs/
```

### 7.2 Pipeline stages

#### Stage 1 — Download raw data

Inputs:

- OWID reserves CSV
- OWID production CSV
- OWID consumption CSV
- BACI HS6 annual files
- BACI country code mapping
- Optional: UN Comtrade HS 2709 validation extract
- Optional: IEA Oil Information CSV
- Optional: World Bank GDP/population

#### Stage 2 — Normalize identifiers

Actions:

- Map all country names to ISO-3.
- Preserve original source names.
- Handle aggregate regions separately.
- Remove or flag non-country aggregates such as “World”, “Europe”, or “High-income countries” depending on chart need.

Output:

```text
dim_country
```

#### Stage 3 — Normalize oil country-year facts

Actions:

- Standardize units.
- Convert to canonical units.
- Validate world totals where possible.
- Create ranks and global shares.

Output:

```text
country_year_oil_power.parquet
```

#### Stage 4 — Build trade network

Actions:

- Load BACI annual HS6 data.
- Filter `product == 2709`.
- Convert quantities to tonnes if needed.
- Keep positive quantity and positive value rows.
- Compute unit value.
- Filter impossible outliers.
- Compute importer and exporter totals.
- Compute supplier/customer shares and concentration.

Outputs:

```text
crude_trade_edges.parquet
crude_importer_year.parquet
crude_exporter_year.parquet
```

#### Stage 5 — Join facts and network summaries

Actions:

- Join `country_year_oil_power` with importer-year and exporter-year summaries.
- Create archetype labels.
- Create country profile summaries.
- Create top-N trade edges per year for frontend performance.

Outputs:

```text
oil_power_country_year.parquet
oil_power_trade_edges_topn.parquet
oil_power_country_profiles.parquet
```

#### Stage 6 — Export for visualization

Outputs:

- Parquet for analysis.
- CSV for Kaggle / public sharing.
- GeoParquet for geospatial.
- PMTiles or vector tiles for world map layers.
- JSON sidecars for frontend filters and metadata.

---

## 8. Quality checks

### 8.1 Basic checks

- No negative reserves, production, consumption, quantity, or value.
- No duplicate `iso3 + year` rows in country-year table.
- No duplicate `exporter_iso3 + importer_iso3 + year + hs_code` rows in edge table.
- All trade edges have valid ISO-3 codes.
- Unit value is non-null when quantity and value are positive.

### 8.2 Outlier checks

Flag but do not automatically drop:

- Unit prices far above or below annual global crude-price range.
- Very small quantity with huge value.
- Trade value with zero or missing quantity.
- Countries with imports much larger than domestic consumption.
- Exporters with exports far above production.

### 8.3 Reconciliation checks

For each year:

```text
global_import_quantity ≈ global_export_quantity
global_import_value ≈ global_export_value
```

Expect differences. Customs data will not reconcile perfectly.

### 8.4 Source caveats to expose in metadata

- Proved reserves are not pure geology; they depend on economics, technology, prices, and reporting standards.
- Trade value can be CIF or FOB depending on source and reporting side.
- Unit value is not identical to contract price.
- Quantity-to-barrel conversion depends on crude quality.
- Sanctions, re-exports, blending, and shipping routes can distort country-to-country flows.
- Consumption measures use/demand, not individual blame.

---

## 9. Narrative modules

### Narrative 1 — “Oil underground is not oil power”

**Question:** Which countries have huge reserves but do not dominate production?

Views:

- Reserves vs production scatter.
- Highlight Venezuela, Canada, Saudi Arabia, Iran, Iraq, Russia, United States.
- Country profile panel explaining reserve-production gap.

User takeaway:

> Having oil underground does not automatically mean controlling the oil market.

### Narrative 2 — “The demand giants”

**Question:** Which countries burn the most oil, regardless of reserves?

Views:

- Consumption ranking race.
- Consumption per capita map.
- Production vs consumption diagonal chart.
- Highlight United States, China, India, Japan, South Korea, Germany.

User takeaway:

> Some countries are oil powerful because they are massive buyers, not because they are major reserve holders.

### Narrative 3 — “The hidden network of crude”

**Question:** Who buys oil from whom?

Views:

- Sankey: exporter → importer.
- Flow map.
- Importer supplier mix panel.
- Exporter customer mix panel.

User interaction:

- Select importer: show top suppliers.
- Select exporter: show top buyers.
- Select year: animate shifts.

User takeaway:

> Oil dependence is a network problem, not just a national production problem.

### Narrative 4 — “The price of dependence”

**Question:** Which countries pay more for crude oil imports?

Views:

- Import bill map.
- Average USD/tonne map.
- Price premium/discount chart.
- Supplier concentration vs price paid scatter.

User takeaway:

> Price paid depends on supplier mix, crude quality, transport, sanctions, timing, and market leverage.

### Narrative 5 — “Supplier concentration risk”

**Question:** Which countries rely too heavily on a few suppliers?

Views:

- Importer HHI map.
- Top supplier share ranking.
- Dependency timeline.
- “What if top supplier disappears?” scenario.

User takeaway:

> A country can have a moderate import bill but high strategic vulnerability if one supplier dominates.

### Narrative 6 — “Exporters need buyers too”

**Question:** Which producers depend on a small set of customers?

Views:

- Exporter customer concentration map.
- Exporter → top buyer Sankey.
- Export customer HHI timeline.

User takeaway:

> Exporters are not always in control; they can be buyer-dependent too.

### Narrative 7 — “Before and after shocks”

**Question:** How do oil trade routes shift after geopolitical or market shocks?

Views:

- Year-over-year edge change map.
- Supplier mix before/after selector.
- Country duel mode.

Examples:

- Russia → India / China shifts after 2022.
- U.S. export growth after shale expansion.
- Middle East supplier shifts into Asia.
- Europe supplier diversification.

User takeaway:

> Oil trade networks rewire after shocks, but not instantly and not evenly.

---

## 10. Interaction design

### 10.1 Global mode selector

Top-level tabs:

1. **Has it** — reserves.
2. **Pumps it** — production.
3. **Burns it** — consumption.
4. **Buys from whom** — bilateral trade.
5. **Pays how much** — import bill and unit value.

### 10.2 Year slider

A single year slider controls all views.

Features:

- Play animation.
- Pin two years for comparison.
- Show “change since selected base year.”

### 10.3 Map interactions

Map modes:

- Choropleth by reserves, production, consumption, import bill, average price, HHI.
- Flow overlay for trade edges.
- Bubble overlay for magnitude.
- Click country to open profile panel.

Country tooltip:

```text
Country
Year
Reserve rank
Production rank
Consumption rank
Import bill
Average import price
Top supplier
Top buyer
Archetype
```

### 10.4 Country profile panel

For selected country:

Sections:

1. **Identity**
   - Archetype
   - Region
   - OPEC / non-OPEC optional
2. **Has / Pumps / Burns**
   - Reserves
   - Production
   - Consumption
   - Ranks
3. **Buys from**
   - Top suppliers
   - Supplier shares
   - Supplier concentration
4. **Sells to**
   - Top buyers
   - Customer shares
   - Customer concentration
5. **Pays**
   - Import bill
   - Average import price
   - Premium/discount vs global average
6. **Timeline**
   - 20-year trend of all major metrics

### 10.5 Country duel mode

Compare two countries side by side.

Examples:

- Saudi Arabia vs United States
- China vs India
- Russia vs Iraq
- Norway vs UAE
- Venezuela vs Canada
- Japan vs South Korea

Views:

- Reserves / production / consumption cards.
- Import supplier mix.
- Export customer mix.
- Average import price.
- Archetype over time.

### 10.6 Network explorer

User selects:

- Year.
- Importer or exporter.
- Minimum flow threshold.
- Unit: tonnes or USD.
- Top N edges.

Outputs:

- Sankey.
- Flow map.
- Edge table.
- Supplier/customer concentration score.

### 10.7 “Find countries like this” interaction

Let users filter by archetype:

- “High reserves, low production”
- “High consumption, low reserves”
- “High imports, concentrated supplier base”
- “Pays above global average”
- “Export-heavy but customer-concentrated”

This turns the dashboard from static charts into discovery.

---

## 11. MVP scope

Do not build everything first.

### MVP v1: country-year + trade network

Build:

1. OWID reserves, production, consumption ingestion.
2. BACI HS 2709 edge ingestion.
3. Country-year unified table.
4. Bilateral trade edge table.
5. Importer-year price/import bill table.
6. Three map modes:
   - has it,
   - pumps it,
   - burns it.
7. One flow view:
   - who buys from whom.
8. One price view:
   - who pays how much.
9. Country profile panel.

### MVP visual set

- World map with mode selector.
- Production vs consumption scatter.
- Reserves vs production scatter.
- Sankey or chord-style network for top crude flows.
- Import bill and average price paid chart.
- Country profile panel.

### MVP deliverables

```text
data/canonical/oil_power_country_year.parquet
data/canonical/crude_trade_edges.parquet
data/canonical/crude_importer_year.parquet
data/canonical/crude_exporter_year.parquet
data/marts/oil_power_country_profiles.parquet
docs/data_dictionary.md
docs/source_notes.md
app/interactive_dashboard
```

---

## 12. v2 scope

Add:

- GDP and population.
- Import bill as % of GDP.
- Oil rents as % of GDP.
- OPEC membership.
- Regional blocs.
- IEA cross-checks for selected countries.
- UN Comtrade validation for suspicious BACI flows.
- Event annotations:
  - COVID-19 demand shock.
  - Russia invasion of Ukraine.
  - OPEC+ production decisions.
  - Major sanctions periods.
  - U.S. shale expansion.
- PMTiles/vector-tile export for a fast map frontend.
- Public Kaggle dataset release with derived tables.

---

## 13. Data dictionary draft

### `oil_power_country_year`

| Field | Meaning |
|---|---|
| `iso3` | Country ISO-3 |
| `year` | Year |
| `oil_reserves` | Proved oil reserves in canonical unit |
| `oil_production` | Annual oil production in canonical unit |
| `oil_consumption` | Annual oil consumption in canonical unit |
| `global_reserve_share` | Share of world reserves |
| `global_production_share` | Share of world production |
| `global_consumption_share` | Share of world consumption |
| `net_oil_balance_proxy` | Production minus consumption |
| `production_consumption_ratio` | Production divided by consumption |
| `oil_power_index` | Composite score |
| `oil_archetype` | Human-readable country class |

### `crude_trade_edges`

| Field | Meaning |
|---|---|
| `exporter_iso3` | Seller/exporting country |
| `importer_iso3` | Buyer/importing country |
| `year` | Year |
| `trade_value_usd` | Crude trade value |
| `quantity_tonnes` | Crude trade quantity |
| `avg_unit_value_usd_per_tonne` | Implied unit value |
| `importer_supplier_share` | Supplier share within buyer’s imports |
| `exporter_customer_share` | Buyer share within seller’s exports |

### `crude_importer_year`

| Field | Meaning |
|---|---|
| `total_crude_import_value_usd` | Annual crude import bill |
| `total_crude_import_quantity_tonnes` | Annual crude import quantity |
| `avg_import_price_usd_per_tonne` | Weighted average price paid |
| `top_supplier_iso3` | Largest supplier |
| `top_supplier_share` | Share from largest supplier |
| `supplier_concentration_hhi` | Supplier concentration |

---

## 14. Suggested technical stack

### Data engineering

- Python
- DuckDB
- Polars
- PyArrow
- Parquet
- dbt optional
- Great Expectations or custom validation checks

### Geospatial

- Natural Earth or geoBoundaries country polygons
- GeoPandas
- GeoParquet
- Tippecanoe / PMTiles for web map performance

### Frontend

- React or SvelteKit
- MapLibre GL
- Observable Plot / ECharts / D3
- DuckDB-WASM optional for local analytical querying
- Apache Arrow / Parquet in browser optional for advanced exploration

### Publishing

- GitHub repository
- Static web app
- Kaggle dataset release
- Data documentation in Markdown
- Reproducible Makefile or task runner

---

## 15. Build sequence

### Week 1: data spine

- Download OWID reserves, production, consumption.
- Download BACI and filter HS 2709.
- Build country mapping.
- Create canonical Parquet tables.
- Write basic validation checks.

### Week 2: metrics

- Compute global shares and ranks.
- Compute import bill and average price.
- Compute supplier/customer concentration.
- Create archetype labels.
- Build country profile mart.

### Week 3: visual MVP

- Build map mode selector.
- Build country profile panel.
- Build production vs consumption scatter.
- Build reserves vs production scatter.
- Build Sankey/flow view for top trade routes.

### Week 4: polish and narrative

- Add guided story mode.
- Add country duel mode.
- Add source notes and caveats.
- Add top insight cards.
- Export public CSVs.
- Publish dashboard.

---

## 16. Public release strategy

Publish two versions:

### Full analytical dataset

Parquet-first.

```text
oil_power_country_year.parquet
crude_trade_edges.parquet
crude_importer_year.parquet
crude_exporter_year.parquet
```

### Kaggle-friendly dataset

CSV + README.

```text
oil_power_country_year.csv
crude_trade_edges_topn.csv
crude_importer_year.csv
crude_exporter_year.csv
data_dictionary.csv
README.md
```

Do not include massive all-year all-edge data in the first Kaggle version if it becomes too large. Use top-N flows per importer-year and link to full Parquet externally.

---

## 17. README positioning

Suggested README intro:

> This dataset combines country-level oil reserves, production, and consumption with bilateral crude petroleum trade flows. It is designed to answer five questions: who has oil, who pumps it, who burns it, who buys from whom, and who pays how much. The dataset is intended for data visualization, geopolitical energy analysis, and network exploration.

Suggested caveat:

> The dataset should not be interpreted as a perfect measurement of contract oil prices or physical barrel movements. Bilateral trade values and quantities reflect reported customs trade flows and can be affected by CIF/FOB valuation, re-exports, crude quality, sanctions, reporting gaps, and timing differences.

---

## 18. Strong demo narratives for launch

Use these as clickable story cards in the app:

1. **The difference between oil-rich and oil-powerful**
   - Reserves vs production.
2. **The world’s biggest oil burners**
   - Consumption vs production.
3. **Who feeds Asia’s demand?**
   - Exporter-to-importer flows into China, India, Japan, South Korea.
4. **The supplier concentration trap**
   - Countries dependent on one or two crude suppliers.
5. **Who pays a premium?**
   - Import prices by country and supplier.
6. **How trade routes changed after shocks**
   - Before/after year comparisons.
7. **The full-spectrum oil powers**
   - Countries that rank highly across reserves, production, and consumption.

---

## 19. First implementation checklist

- [ ] Create repo.
- [ ] Add source URLs to config.
- [ ] Download OWID CSVs.
- [ ] Download BACI HS data and country codes.
- [ ] Filter HS 2709.
- [ ] Build ISO-3 country dimension.
- [ ] Normalize units.
- [ ] Build country-year table.
- [ ] Build crude trade edge table.
- [ ] Compute import bill.
- [ ] Compute average price paid.
- [ ] Compute supplier/customer concentration.
- [ ] Add quality checks.
- [ ] Export Parquet.
- [ ] Export CSV sample.
- [ ] Build first notebook.
- [ ] Build first dashboard mock.
- [ ] Write source notes.
- [ ] Write data caveats.
- [ ] Publish MVP.

---

## 20. Bottom line

The unified dataset should have two clean primitives:

```text
country-year facts:
  who has, pumps, burns

country-country-year edges:
  who buys from whom, and how much they pay
```

Everything else — maps, rankings, Sankeys, archetypes, risk scores, and narratives — should be derived from those two primitives.

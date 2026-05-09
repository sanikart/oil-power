# Source Notes

## OWID Country-Year Metrics

The first compiled table uses these Our World in Data CSV endpoints:

- `oil-proved-reserves.csv`
- `oil-production-by-country.csv`
- `oil-consumption-by-country.csv`

Rows with empty country codes are skipped. Aggregate OWID pseudo-countries such as `OWID_WRL`, `OWID_AFR`, and income groups are used only where needed for world denominators and are not emitted as country rows.

## BACI Trade Network

The planned trade layer uses CEPII BACI annual HS6 files filtered to:

```text
HS code: 2709
Commodity: Petroleum oils and oils from bituminous minerals, crude
```

Large BACI raw files are intentionally ignored by git. Put downloaded BACI files under `data/raw/baci/` and keep derived public artifacts under `data/canonical/` or `data/marts/`.

## Caveats

- Proved reserves depend on economics, technology, prices, and reporting standards.
- Production and consumption units must be interpreted from the upstream OWID metadata before mixing with trade quantities.
- Trade value can reflect CIF or FOB valuation depending on source and reporting side.
- Unit value is not the same as contract oil price.
- Quantity-to-barrel conversion depends on crude density and should be labeled approximate.

# BACI Input Notes

Download BACI HS6 annual files and country codes from CEPII:

https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/baci_webpage.html

Expected raw location:

```text
data/raw/baci/
```

The MVP trade pipeline should filter HS product code `2709` and produce:

```text
data/canonical/crude_trade_edges.csv
data/canonical/crude_importer_year.csv
data/canonical/crude_exporter_year.csv
```

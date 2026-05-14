.PHONY: download-owid build-country-year build-mvp-data build-trade-data check-country-year check-mvp-data check-trade-data all

download-owid:
	python3 src/download/download_owid.py

build-country-year:
	python3 src/transform/build_country_year.py

build-mvp-data:
	python3 src/export/build_mvp_json.py

build-trade-data:
	python3 src/transform/build_crude_trade_edges.py
	python3 src/export/build_trade_json.py

check-country-year:
	python3 src/quality/check_country_year.py

check-mvp-data:
	python3 src/quality/check_mvp_json.py
check-trade-data:
	python3 src/quality/check_trade_json.py

all: download-owid build-country-year build-mvp-data check-country-year check-mvp-data

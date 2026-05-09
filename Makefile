.PHONY: download-owid build-country-year check-country-year all

download-owid:
	python3 src/download/download_owid.py

build-country-year:
	python3 src/transform/build_country_year.py

check-country-year:
	python3 src/quality/check_country_year.py

all: download-owid build-country-year check-country-year

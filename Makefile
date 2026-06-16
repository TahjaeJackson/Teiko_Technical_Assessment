# Author: Tahjae Jackson
# Description: Makefile to execute the entire assessment

.PHONY: setup pipeline dashboard # allows make dashboard to run since there is a folder with that name

PYTHON = python3

setup:
	pip install -r requirements.txt

pipeline:
	$(PYTHON) load_data.py
	$(PYTHON) part2_data_overview.py
	$(PYTHON) part3_statistical_overview.py
	$(PYTHON) part4_subset_analysis.py

dashboard:
	cd dashboard && npm install && npm run dev

# Author: Tahjae Jackson
# Description: Makefile to execute the entire assessment

PYTHON = python3

setup:
	pip install -r requirements.txt

pipeline:
	$(PYTHON) load_data.py
	$(PYTHON) part2_data_overview.py
	$(PYTHON) part3_statistical_overview.py
	$(PYTHON) part4_subset_analysis.py

dashboard:
	cd dashboard && streamlit run app.py

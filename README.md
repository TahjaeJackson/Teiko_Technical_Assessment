# Teiko Technical Assessment

## Overview

This project analyzes immune cell population data collected from clinical trial samples. The solution loads the raw dataset into a normalized SQLite database, performs exploratory analysis, generates summary statistics, conducts statistical comparisons between responders and non-responders, and performs a targeted subset analysis on baseline melanoma PBMC samples treated with miraclib. The project is organized as a reproducible data pipeline that can be executed end-to-end using a Makefile. All generated outputs, including tables, reports, and plots, are saved automatically for dashboard visualization and grading.


# Database Schema Design

The database schema was designed based on findings from the exploratory analysis documented in:

```text
notebooks/data_analysis.ipynb
```

This notebook was used to understand the structure of the dataset before creating the database.

## Exploratory Findings

The dataset contains:

* **10,500 samples**
* **3,500 unique subjects**
* **5 immune cell populations per sample**

Exploratory analysis revealed several important relationships:

### 1. Sample identifiers are unique

Every sample identifier appears exactly once in the dataset, making it an appropriate primary key for the samples table.

### 2. Subjects contribute multiple samples

Analysis showed that each subject contributes exactly three samples. This creates a natural **one-to-many relationship**:

```text
Subject -> Multiple Samples
```

Storing subject information in every sample record would introduce unnecessary redundancy.

### 3. Subject attributes remain constant

The exploratory notebook verified that:
* Age
* Sex
* Condition
remain constant across all samples belonging to the same subject. Since these attributes do not vary between samples, they are stored once in a dedicated subjects table.

### 4. Cell populations repeat for every sample

Each sample contains measurements for multiple immune cell populations:

* B cells
* CD4 T cells
* CD8 T cells
* NK cells
* Monocytes

These measurements are stored separately in a cell count table to avoid wide-table duplication and improve scalability.


# Database Schema

The final database consists of three normalized tables.

## subjects

Stores subject-level metadata.

| Column     | Description               |
| ---------- | ------------------------- |
| subject_id | Unique subject identifier |
| age        | Subject age               |
| sex        | Subject sex               |
| condition  | Clinical condition        |

**Primary Key**

```text
subject_id
```

## samples

Stores sample-level metadata.

| Column                    | Description                     |
| ------------------------- | ------------------------------- |
| sample_id                 | Unique sample identifier        |
| subject_id                | Subject reference               |
| project                   | Study project                   |
| treatment                 | Treatment received              |
| response                  | Treatment response              |
| sample_type               | Sample type                     |
| time_from_treatment_start | Timepoint relative to treatment |

**Primary Key**

```text
sample_id
```

**Foreign Key**

```text
subject_id -> subjects.subject_id
```

## cell_counts

Stores immune cell population measurements.

| Column     | Description      |
| ---------- | ---------------- |
| sample_id  | Sample reference |
| population | Cell population  |
| count      | Cell count       |

**Composite Primary Key**

```text
(sample_id, population)
```

**Foreign Key**

```text
sample_id -> samples.sample_id
```

This structure eliminates duplicated metadata while remaining flexible enough to support additional cell populations in the future.

## Scalability Considerations

The schema was designed to support larger studies without requiring structural changes. New projects can be added by inserting additional records into the `samples` table, while the normalized design prevents duplication of subject information as the number of samples grows. The `cell_counts` table stores measurements in a long format, allowing additional immune cell populations to be added as rows rather than requiring new columns or tables. This structure supports efficient querying and remains flexible for descriptive analyses, statistical testing, dashboard reporting, and future machine learning workflows.

# Repository Structure

```text
Teiko_Technical_Assessment/
│
├── datasheets/
│   └── cell-count.csv
│
├── notebooks/
│   ├── data_analysis.ipynb
│   ├── data_overview.ipynb
│   ├── statistical_overview.ipynb
│
├── outputs/
│   ├── sample_population_frequencies.csv
│   ├── statistical_results.csv
│   ├── statistical_report.txt
│   ├── subset_analysis_report.txt
│   ├── google_form_answer.txt
│   └── plots/
│
├── dashboard/
│   └── React/Vite interactive dashboard for exploring analysis results and visualizations
│
├── load_data.py
├── part2_data_overview.py
├── part3_statistical_overview.py
├── part4_subset_analysis.py
├── requirements.txt
├── Makefile
└── README.md
```

---

# File Descriptions

### load_data.py

Loads the raw CSV dataset and initializes the SQLite database.

### part2_data_overview.py

Calculates total cell counts and relative frequencies for each immune cell population.

### part3_statistical_overview.py

Generates boxplots and performs Mann–Whitney U tests comparing responders and non-responders.

### part4_subset_analysis.py

Performs the baseline melanoma PBMC subset analysis and generates the assessment answer.

### dashboard/app.py

Interactive Streamlit dashboard for visualizing generated outputs.

### data_analysis.ipynb

Exploratory notebook used to evaluate dataset structure and inform schema design decisions.

### data_overview.ipynb

Notebook version of Part 2 analysis.

### statistical_overview.ipynb

Notebook version of Part 3 statistical analysis.

### outputs/

Contains all generated reports, plots, and tables produced by the pipeline.

### datasheets/cell-count.csv

Raw source dataset supplied for the assessment.


# Pipeline Workflow
The project is executed sequentially.

## Part 1 — Database Initialization

```bash
python load_data.py
```
Creates the SQLite database and loads the normalized tables.


## Part 2 — Relative Frequency Analysis
```bash
python part2_data_overview.py
```

Calculates:
* Total cells per sample
* Relative frequency of each cell population

Output:
```text
outputs/sample_population_frequencies.csv
```


## Part 3 — Statistical Analysis
```bash
python part3_statistical_overview.py
```
Generates:
* Boxplots
* Mann–Whitney U test results
* Statistical summary report

Outputs:
```text
outputs/statistical_results.csv
outputs/statistical_report.txt
outputs/plots/
```

## Part 4 — Subset Analysis

```bash
python part4_subset_analysis.py
```
Filters:
* Melanoma samples
* PBMC samples
* Miraclib-treated subjects
* Baseline measurements

Generates:
```text
outputs/subset_analysis_report.txt
outputs/google_form_answer.txt
```

# Running the Project

## Install Dependencies

```bash
make setup
```

## Run Complete Pipeline

```bash
make pipeline
```

## Launch Dashboard
# link: http://10.3.5.27:8080/

```bash
make dashboard
```

# Design Decisions

Several design choices were made to improve maintainability and scalability:

* Database normalization was used to eliminate duplicated subject metadata.
* Analysis stages were separated into independent scripts to simplify debugging and reuse.
* Generated outputs are saved to disk to support dashboard visualization and grading.
* Statistical analysis uses the Mann–Whitney U test because no directional hypothesis was specified and the test does not assume normality.
* A Makefile was included to provide a reproducible execution workflow consistent with the assessment requirements.

The resulting structure supports reproducible analysis, clear separation of responsibilities, and straightforward extension for future studies.

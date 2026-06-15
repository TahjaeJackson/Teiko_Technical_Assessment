"""
Author: Tahjae Jackson
Date: June 15, 2026
Description: This script performs the Part 4 subset analysis. It identifies baseline melanoma PBMC samples treated with miraclib and generates summary statistics
requested in the assessment.

"""
# importing libraries
import sqlite3
import pandas as pd
from pathlib import Path

# importing helper functions from part 3

from part3_statistical_overview import (
    load_frequency_data,
    load_samples,
    load_subjects,
    create_analysis_dataframe
)

DB_NAME = "cell_count.db"
OUTPUT_FILE = "outputs/subset_analysis_report.txt"
ANSWER_FILE = "outputs/google_form_answer.txt"

"""
Description: Creates the subset required for Part 4
Input: merged analysis dataframe
Output: filtered dataframe
"""
def create_subset(analysis_df):

    subset = analysis_df[
        (analysis_df["condition"] == "melanoma")
        &
        (analysis_df["treatment"] == "miraclib")
        &
        (analysis_df["sample_type"] == "PBMC")
        &
        (analysis_df["time_from_treatment_start"] == 0)
    ]

    return subset

"""
Description: Counts samples from each project
Input: subset dataframe
Output: project summary
"""
def get_project_counts(subset):

    return (
        subset
        .groupby("project")["sample_id"]
        .nunique()
        .reset_index(name="sample_count")
    )

"""
Description: Counts responder and non-responder subjects
Input: subset dataframe
Output: response summary
"""
def get_response_counts(subset):

    return (
        subset
        .groupby("response")["subject_id"]
        .nunique()
        .reset_index(name="subject_count")
    )
    
"""
Description: Counts male and female subjects
Input: subset dataframe
Output: sex summary
"""
def get_sex_counts(subset):
    return (subset.groupby("sex")["subject_id"].nunique().reset_index(name="subject_count"))
    
"""
Description: Calculates average B-cell count for melanoma male responders at baseline
Input: subset dataframe
Output: average B-cell count
"""
def calculate_bcell_average(subset):

    answer_df = subset[
        (subset["population"] == "b_cell")
        &
        (subset["sex"] == "male")
        &
        (subset["response"] == "yes")
    ]
    return round(answer_df["count"].mean(),2)

def save_report(project_df,response_df,sex_df,average_bcell):

    Path("outputs").mkdir(exist_ok=True)

    with open(OUTPUT_FILE, "w") as f:

        f.write("PART 4 SUBSET ANALYSIS\n\n")
        f.write("Samples per project\n")
        f.write(project_df.to_string(index=False))

        f.write("\n\n")

        f.write("Responder status\n")
        f.write(response_df.to_string(index=False))

        f.write("\n\n")

        f.write("Sex breakdown\n")
        f.write(sex_df.to_string(index=False))

        f.write("\n\n")

        f.write(
            f"Average B-cell count for melanoma male responders at baseline: {average_bcell}"
        )

    with open(ANSWER_FILE, "w") as f:
        f.write(str(average_bcell))
        


def main():

    conn = None

    try:

        print("Connecting to database...")
        conn = sqlite3.connect(DB_NAME)
        freq_df = load_frequency_data()
        samples = load_samples(conn)
        subjects = load_subjects(conn)
        analysis_df = create_analysis_dataframe(freq_df, samples, subjects)

        subset = create_subset(analysis_df)
        project_df = get_project_counts(subset)
        response_df = get_response_counts(subset)
        sex_df = get_sex_counts(subset)
        average_bcell = calculate_bcell_average(subset)

        save_report(
            project_df,
            response_df,
            sex_df,
            average_bcell
        )

        print("\nSubset analysis completed successfully")
        print(f"\nGoogle Form Answer: {average_bcell}")

    except FileNotFoundError as e:
        print(f"File not found: {e}")

    except sqlite3.Error as e:
        print(f"Database error: {e}")

    except Exception as e:
        print(f"Unexpected error: {e}")

    finally:

        if conn:
            conn.close()


if __name__ == "__main__":
    main()
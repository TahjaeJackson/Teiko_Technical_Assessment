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
    load_samples,
    load_subjects,
    create_analysis_dataframe
)

DB_NAME = "cell_count.db"
OUTPUT_FILE = "outputs/subset_analysis_report.txt"
ANSWER_FILE = "outputs/google_form_answer.txt"

"""
Description: Loads the Part 2 frequency table generated earlier in the pipeline
Input: None
Output: Frequency dataframe
"""
def load_frequency_data():

    frequency_file = "outputs/sample_population_frequencies.csv"
    if not Path(frequency_file).exists():
        raise FileNotFoundError(
            "outputs/sample_population_frequencies.csv not found. "
            "Run the pipeline before running Part 4."
        )
    return pd.read_csv(
        frequency_file
    )

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
        (subset["sex"] == "M")
        &
        (subset["response"] == "yes")
    ]
    return round(answer_df["count"].mean(),2)

def save_report(project_df, response_df, sex_df, average_bcell):

    Path("outputs").mkdir(exist_ok=True)

    project_counts = dict(zip(project_df.iloc[:, 0], project_df.iloc[:, 1]))
    response_counts = dict(zip(response_df.iloc[:, 0], response_df.iloc[:, 1]))
    sex_counts = dict(zip(sex_df.iloc[:, 0], sex_df.iloc[:, 1]))

    total_samples = sum(project_counts.values())
    total_subjects = sum(response_counts.values())

    with open(OUTPUT_FILE, "w") as f:

        f.write("PART 4: SUBSET ANALYSIS\n\n")

        f.write("Dataset Overview\n")
        f.write(f"• Total samples analyzed: {total_samples}\n")
        f.write(f"• Total subjects analyzed: {total_subjects}\n\n")

        f.write("Project Distribution\n")
        for project, count in project_counts.items():
            pct = 100 * count / total_samples
            f.write(
                f"• {project}: {count} samples ({pct:.1f}% of all samples)\n"
            )

        f.write("\n")

        f.write("Responder Distribution\n")
        for status, count in response_counts.items():
            pct = 100 * count / total_subjects
            label = "Responders" if str(status).lower() == "yes" else "Non-responders"
            f.write(
                f"• {label}: {count} subjects ({pct:.1f}%)\n"
            )

        f.write("\n")

        f.write("Sex Distribution\n")
        for sex, count in sex_counts.items():
            label = "Female" if str(sex).upper() == "F" else "Male"
            pct = 100 * count / total_subjects
            f.write(
                f"• {label}: {count} subjects ({pct:.1f}%)\n"
            )

        f.write("\n")

        f.write("Targeted Subset Finding\n")
        f.write(
            f"The average baseline B-cell count among melanoma male "
            f"responders was {average_bcell:.2f}.\n"
        )

    with open(ANSWER_FILE, "w") as f:
        f.write(f" For Melanoma males, the average number of B cells for responders at time = 0 is {average_bcell:.2f} cells")


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
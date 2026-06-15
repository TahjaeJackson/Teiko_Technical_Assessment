"""
Author: Tahjae Jackson
Date: June 15, 2026

Description:
This script performs the statistical analysis requested in Part 3.
It compares relative cell population frequencies between
responders and non-responders, generates boxplots,
and outputs statistical results for dashboard reporting.
"""

# Importing libraries

import sqlite3
from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import mannwhitneyu


DB_NAME = "cell_count.db"
SUMMARY_FILE = "outputs/sample_population_frequencies.csv"
RESULTS_FILE = "outputs/statistical_results.csv"
REPORT_FILE = "outputs/statistical_report.txt"
PLOTS_FOLDER = "outputs/plots"

"""
Description: Loads Part 2 summary table
Output: summary dataframe
"""
def load_summary_table():
    return pd.read_csv(SUMMARY_FILE)

"""
Description: Loads sample metadata
Input: database connection
Output: sample dataframe
"""
def load_samples(conn):

    query = """
    SELECT *
    FROM samples
    """

    return pd.read_sql(query, conn)


"""
Description: Loads subject metadata
Input: database connection
Output: subject dataframe
"""
def load_subjects(conn):

    query = """
    SELECT *
    FROM subjects
    """

    return pd.read_sql(query, conn)

"""
Description: Combines summary table with sample and subject metadata.
Input: summary table, sample metadata, subject metadata
Output: analysis dataframe
"""
def create_analysis_dataframe(summary_df,samples,subjects):

    analysis_df = summary_df.merge(
        samples,
        on="sample_id"
    )

    analysis_df = analysis_df.merge(
        subjects,
        on="subject_id"
    )

    return analysis_df

"""
Description: Filters dataset to melanoma PBMC samples treated with miraclib.
Input: analysis dataframe
Output: filtered dataframe
"""
def filter_dataset(analysis_df):

    filtered_df = analysis_df[
        (analysis_df["condition"] == "melanoma")
        &
        (analysis_df["treatment"] == "miraclib")
        &
        (analysis_df["sample_type"] == "PBMC")
    ]

    return filtered_df

"""
Description: Generates boxplots for each immune cell population.
Input: filtered dataframe
"""
def generate_boxplots(filtered_df):

    Path(PLOTS_FOLDER).mkdir(
        parents=True,
        exist_ok=True
    )

    populations = filtered_df["population"].unique()

    for pop in populations:

        subset = filtered_df[filtered_df["population"] == pop]
        plt.figure(figsize=(6,4))

        subset.boxplot(column="percentage",by="response")

        plt.title(pop)
        plt.suptitle("")
        plt.ylabel("Relative Frequency (%)")

        plt.savefig(
            f"{PLOTS_FOLDER}/{pop}_boxplot.png",
            bbox_inches="tight"
        )

        plt.close()
        
"""
Description: Performs Mann-Whitney U test for each cell population.
Input: filtered dataframe
Output: results dataframe
"""
def perform_statistical_analysis(filtered_df):

    results = []
    populations = filtered_df["population"].unique()
    for pop in populations:
        subset = filtered_df[ filtered_df["population"] == pop]
        responders = subset[subset["response"] == "yes"]["percentage"]
        nonresponders = subset[subset["response"] == "no"]["percentage"]

        stat, p_value = mannwhitneyu(
            responders,
            nonresponders,
            alternative="two-sided"
        )

        median_yes = responders.median()
        median_no = nonresponders.median()

        results.append(
            {
                "population": pop,
                "median_responder": round(median_yes, 2),
                "median_nonresponder": round(median_no, 2),
                "difference": round(
                    median_yes - median_no,
                    2
                ),
                "p_value": round(p_value, 6)
            }
        )

    return pd.DataFrame(results)

"""
Description: Saves statistical results table.
Input: results dataframe
"""
def save_results(results_df):

    results_df.to_csv(
        RESULTS_FILE,
        index=False
    )

"""
Description: Creates dashboard-friendly report.
Input: results dataframe
"""
def create_report(results_df):

    significant = results_df[ results_df["p_value"] < 0.05]
    report_lines = []
    report_lines.append(
        "PART 3 STATISTICAL ANALYSIS\n"
    )

    if len(significant) == 0:
        report_lines.append(
            "No statistically significant differences were detected."
        )
    else:
        for _, row in significant.iterrows():

            report_lines.append(
                f"{row['population']} showed a statistically significant difference "
                f"(p={row['p_value']:.4f}). "
                f"Responders had a median frequency of "
                f"{row['median_responder']}% compared with "
                f"{row['median_nonresponder']}% for non-responders."
            )

    with open(REPORT_FILE, "w") as f:
        f.write("\n".join(report_lines))
        

def main():

    conn = None
    try:

        print("Connecting to database...")
        conn = sqlite3.connect(DB_NAME)
        print("Loading datasets...")
        summary_df = load_summary_table()
        samples = load_samples(conn)
        subjects = load_subjects(conn)
        print("Creating analysis dataframe...")
        analysis_df = create_analysis_dataframe(
            summary_df,
            samples,
            subjects
        )
        print("Filtering melanoma PBMC miraclib samples...")
        filtered_df = filter_dataset(
            analysis_df
        )
        print("Generating boxplots...")
        generate_boxplots(filtered_df)
        print("Performing statistical analysis...")
        results_df = perform_statistical_analysis(
            filtered_df
        )
        print("Saving results...")
        save_results(results_df)
        print("Creating report...")
        create_report(results_df)
        print(
            "\nStatistical overview completed successfully"
        )

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
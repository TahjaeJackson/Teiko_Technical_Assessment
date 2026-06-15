"""
Author: Tahjae Jackson
Date: June 15, 2026
Description:  This script serves as the initial analysis of the data. It will create a table share useful information about the frequency of each cell type in each sample.
"""

# Importing libraries

import pandas as pd
import sqlite3
from pathlib import Path


DB_NAME = "cell_count.db"
OUTPUT_FILE = "outputs/sample_population_frequencies.csv"

"""
Description: Load cell counts table from SQLite.
Input: database connection object
"""
def load_cell_counts(conn):
   

    query = """
    SELECT *
    FROM cell_counts
    """

    return pd.read_sql(query, conn)


"""
Description: Calculates the total cells per sample
Input: cell count
Output: total cell count
"""
def calculate_total_counts(cell_counts):

    total_counts = (
        cell_counts
        .groupby("sample_id")["count"]
        .sum()
        .reset_index()
    )

    total_counts.rename(
        columns={"count": "total_count"},
        inplace=True
    )

    return total_counts



"""
Description: Creates the relative frequency summary table 
Input: cell count and total cell count
Output: Summary table 
"""
def create_summary_table(cell_counts, total_counts):

    summary = cell_counts.merge(
        total_counts,
        on="sample_id"
    )

    summary["percentage"] = (
        summary["count"]
        / summary["total_count"]
        * 100
    )

    summary = summary[
        [
            "sample_id",
            "total_count",
            "population",
            "count",
            "percentage"
        ]
    ]

    summary["count"] = summary["count"].astype(int)
    summary["total_count"] = summary["total_count"].astype(int)
    summary["percentage"] = summary["percentage"].round(2)

    return summary


"""
Description: Saves the output table as a csv file
Input: summary df

"""
def save_summary(summary):

    Path("outputs").mkdir(exist_ok=True)

    summary.to_csv(
        OUTPUT_FILE,
        index=False
    )


def main():

    conn = None

    try:

        print("Connecting to database...")

        conn = sqlite3.connect(DB_NAME)

        print("Loading cell count data...")
        cell_counts = load_cell_counts(conn)

        print("Calculating total counts...")
        total_counts = calculate_total_counts(cell_counts)

        print("Creating summary table...")
        summary = create_summary_table(
            cell_counts,
            total_counts
        )

        print("Saving output...")
        save_summary(summary)

        print("\n Data overview completed successfully")
        print(f"Rows: {len(summary)}")
        print(f"Unique samples: {summary['sample_id'].nunique()}")
        print(f"Unique populations: {summary['population'].nunique()}")

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
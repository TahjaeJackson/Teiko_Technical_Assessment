"""
Author: Tahjae Jackson
Date: June 14, 2026
Description: python script that initializes the database with justified schema and loads all rows from cell-count.csv.

"""

import sqlite3
import pandas as pd

DB_NAME = "cell_count.db"

# cell columns from the datasheet 
CELL_COLUMNS = [
    "b_cell",
    "cd8_t_cell",
    "cd4_t_cell",
    "nk_cell",
    "monocyte"
]

"""
Description: Create database tables based on the relational schema.
Input: database connection object
"""
def create_tables(conn):
   
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subjects (
        subject_id TEXT PRIMARY KEY,
        age INTEGER,
        sex TEXT,
        condition TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS samples (
        sample_id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        project TEXT,
        treatment TEXT,
        response TEXT,
        sample_type TEXT,
        time_from_treatment_start REAL,

        FOREIGN KEY(subject_id)
            REFERENCES subjects(subject_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cell_counts (
        sample_id TEXT,
        population TEXT,
        count REAL,

        PRIMARY KEY(sample_id, population),

        FOREIGN KEY(sample_id)
            REFERENCES samples(sample_id)
    )
    """)
    
    # applying indexing to facilitate ease of indexing 
    
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_samples_subject
    ON samples(subject_id)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_cell_counts_sample
    ON cell_counts(sample_id)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_cell_counts_type
    ON cell_counts(population)
    """)


"""
Description:  Load unique subjects into the subjects table.
Input: df object of csv and database connection object
Output: Size of subject's table 
"""
def load_subjects(conn, df):
    
    cursor = conn.cursor()

    # extracting the unique entries of the subjects' personal data 
    subjects_df = (df[["subject", "age", "sex", "condition"]].drop_duplicates())

    cursor.executemany("""
    INSERT OR REPLACE INTO subjects
    (subject_id, age, sex, condition)
    VALUES (?, ?, ?, ?)
    """, subjects_df.values.tolist())

    return len(subjects_df)

"""
Description: Load sample metadata into the samples table.
Input: df object of csv and database connection object
Output: size of the samples table 
"""
def load_samples(conn, df):

    cursor = conn.cursor()

    samples_df = df[
        [
            "sample",
            "subject",
            "project",
            "treatment",
            "response",
            "sample_type",
            "time_from_treatment_start"
        ]
    ]

    cursor.executemany("""
    INSERT OR REPLACE INTO samples
    (
        sample_id,
        subject_id,
        project,
        treatment,
        response,
        sample_type,
        time_from_treatment_start
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, samples_df.values.tolist())

    return len(samples_df)

"""
Description: Convert cell counts from wide format to long format and load into the cell_counts table.
Input: df object of csv and database connection object
Output: Size of cell count table
"""
def load_cell_counts(conn, df):
    
    cursor = conn.cursor()

    # converting from wide format to long format for ease of querying 
    
    long_df = df.melt(
        id_vars=["sample"],
        value_vars=CELL_COLUMNS,
        var_name="population",
        value_name="count"
    )

    cell_rows = long_df.values.tolist()

    cursor.executemany("""
    INSERT OR REPLACE INTO cell_counts
    (sample_id, population, count)
    VALUES (?, ?, ?)
    """, cell_rows)

    return len(cell_rows)


def main():
    try: 
        # loading datasheet
        df = pd.read_csv("datasheets/cell-count.csv")

        # establishing database connection object
        conn = sqlite3.connect(DB_NAME)
        conn.execute("PRAGMA foreign_keys = ON")

        # Initializing the tables 
        create_tables(conn)
        
        # Populating the tables 
        subject_count = load_subjects(conn, df)
        sample_count = load_samples(conn, df)
        cell_count = load_cell_counts(conn, df)

        conn.commit()
        
        # Success message
        print("Database created successfully.")
        print(f"Subjects loaded: {subject_count}")
        print(f"Samples loaded: {sample_count}")
        print(f"Cell measurements loaded: {cell_count}")
    
    except FileNotFoundError:
        print("CSV file not found.")

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

    finally:
        if conn:
            conn.close()
    
    


if __name__ == "__main__":
    main()
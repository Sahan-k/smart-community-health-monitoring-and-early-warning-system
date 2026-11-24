"""
Migration: Increase model_version column length in risk_assessments table to VARCHAR(255).
Preserves all existing data.
Run once: python -m backend.app.database.migrations.alter_model_version_length
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from sqlalchemy import text
from backend.app.database.connection import engine


def run():
    with engine.begin() as conn:
        # Alter column type to VARCHAR(255)
        conn.execute(text("""
            ALTER TABLE risk_assessments 
            ALTER COLUMN model_version TYPE VARCHAR(255);
        """))
    print("[Migration] risk_assessments.model_version column expanded to VARCHAR(255) successfully.")


if __name__ == "__main__":
    run()

"""
Migration: Add username column to users table.
Run once: python backend/app/database/migrations/add_username_column.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from sqlalchemy import text
from backend.app.database.connection import engine

def run():
    with engine.begin() as conn:
        # Add column if not exists
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='username'
                ) THEN
                    ALTER TABLE users ADD COLUMN username VARCHAR(80) UNIQUE;
                END IF;
            END$$;
        """))
        # Back-fill: set username = phone_number for existing rows that have no username
        conn.execute(text("""
            UPDATE users SET username = phone_number
            WHERE username IS NULL AND phone_number IS NOT NULL;
        """))
    print("[Migration] username column added/backfilled successfully.")

if __name__ == "__main__":
    run()

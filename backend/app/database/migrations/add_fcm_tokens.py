"""
Migration: Add fcm_tokens table for Firebase Cloud Messaging web push.
Run once: python -m backend.app.database.migrations.add_fcm_tokens
"""
import sys
import os
from pathlib import Path

# Ensure project root is on path
project_root = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(project_root))

from sqlalchemy import text
from backend.app.database.connection import engine


MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_is_active ON fcm_tokens(is_active);
"""


def run_migration():
    with engine.begin() as conn:
        conn.execute(text(MIGRATION_SQL))
    print("[Migration] fcm_tokens table created (or already exists). Done.")


if __name__ == "__main__":
    run_migration()

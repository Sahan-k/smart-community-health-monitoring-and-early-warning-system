"""
Migration: Add email_alert_log table for HIGH RISK email deduplication.
Run once: python -m backend.app.database.migrations.add_email_alert_log

This table records every HIGH RISK email that was successfully dispatched.
Before sending, the email service checks this table to avoid re-sending
the same alert to the same address (duplicate-alert prevention).
"""
import sys
from pathlib import Path

# Ensure project root is on sys.path
project_root = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(project_root))

from sqlalchemy import text
from backend.app.database.connection import engine


MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS email_alert_log (
    id              SERIAL PRIMARY KEY,
    alert_id        INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    recipient_email VARCHAR(150) NOT NULL,
    sent_at         TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE (alert_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_email_alert_log_alert_id
    ON email_alert_log(alert_id);

CREATE INDEX IF NOT EXISTS idx_email_alert_log_recipient
    ON email_alert_log(recipient_email);
"""


def run_migration():
    with engine.begin() as conn:
        conn.execute(text(MIGRATION_SQL))
    print("[Migration] email_alert_log table created (or already exists). Done.")


if __name__ == "__main__":
    run_migration()

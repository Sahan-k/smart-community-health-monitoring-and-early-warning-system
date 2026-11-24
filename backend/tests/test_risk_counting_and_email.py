"""
Test Suite: Unified Report Counting & Email Notification Flow
=============================================================
Tests:
  1. 1 report  → LOW RISK
  2. 2 reports → MEDIUM RISK
  3. 3 reports → HIGH RISK
  4. 3 reports from the same user → HIGH RISK
  5. 3 reports from different users → HIGH RISK
  6. Rolling 24-hour active window (25h+ expired, 23h active)
  7. High Risk alert triggers background email notification
  8. Duplicate-alert prevention skips already-sent emails
  9. SMTP authentication failure logging & isolation
"""

import os
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database.connection import Base
from backend.app.models.db_models import User, HealthReport, Alert, RiskAssessment
from backend.app.models.schemas import HealthReportCreate
from backend.app.core.risk_window import (
    get_risk_thresholds,
    get_risk_window_hours,
    get_active_window_start,
)
from backend.app.routes.reports_routes import create_report, calculate_taluk_risk
from backend.app.services.email_service import (
    send_high_risk_alert_emails,
    _already_sent,
    _record_sent,
    _ensure_log_table_exists,
)
from fastapi import BackgroundTasks


class UnifiedReportCountingTests(unittest.TestCase):
    def setUp(self):
        # In-memory SQLite for testing
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Seed two distinct test users
        self.user_a = User(
            id=101,
            username="UserA",
            full_name="User Alpha",
            email="user_a@example.com",
            password_hash="hash_a",
            role="community_member",
        )
        self.user_b = User(
            id=102,
            username="UserB",
            full_name="User Beta",
            email="user_b@example.com",
            password_hash="hash_b",
            role="community_member",
        )
        self.db.add_all([self.user_a, self.user_b])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def submit(self, user, disease="Viral Fever", taluk="Taluk_Test", district="District_Test"):
        bg = BackgroundTasks()
        payload = HealthReportCreate(
            disease=disease,
            symptoms="High fever and severe chills",
            cases_count=1,
            state="Karnataka",
            district=district,
            taluk=taluk,
            latitude=12.9716,
            longitude=77.5946,
        )
        out = create_report(payload, bg, self.db, user)
        return out, bg

    def test_single_report_is_low_risk(self):
        """1 report in taluk = LOW RISK."""
        out1, bg1 = self.submit(self.user_a)
        
        # Check risk assessment in DB
        rep1 = self.db.query(HealthReport).filter(HealthReport.id == out1.id).first()
        self.assertIsNotNone(rep1.risk_assessment)
        self.assertEqual(rep1.risk_assessment.risk_level, "Low")
        # No email alert scheduled for Low risk
        self.assertEqual(len(bg1.tasks), 0)

    def test_two_reports_is_medium_risk(self):
        """2 reports in same taluk = MEDIUM RISK."""
        out1, bg1 = self.submit(self.user_a)
        out2, bg2 = self.submit(self.user_a)

        rep2 = self.db.query(HealthReport).filter(HealthReport.id == out2.id).first()
        self.assertEqual(rep2.risk_assessment.risk_level, "Medium")
        # Medium risk generates in-app alert but NO email alert
        self.assertEqual(len(bg2.tasks), 0)

    def test_three_reports_same_user_is_high_risk_and_triggers_email(self):
        """User A submits 3 reports in same taluk → HIGH RISK + email alert."""
        out1, bg1 = self.submit(self.user_a)
        out2, bg2 = self.submit(self.user_a)
        out3, bg3 = self.submit(self.user_a)

        rep3 = self.db.query(HealthReport).filter(HealthReport.id == out3.id).first()
        self.assertEqual(rep3.risk_assessment.risk_level, "High")

        # Background task for sending email MUST be scheduled
        self.assertEqual(len(bg3.tasks), 1)
        task = bg3.tasks[0]
        self.assertEqual(task.func, send_high_risk_alert_emails)

    def test_three_reports_different_users_is_high_risk(self):
        """User A (2 reports) + User B (1 report) in same taluk → HIGH RISK."""
        out1, _ = self.submit(self.user_a)
        out2, _ = self.submit(self.user_a)
        out3, bg3 = self.submit(self.user_b)

        rep3 = self.db.query(HealthReport).filter(HealthReport.id == out3.id).first()
        self.assertEqual(rep3.risk_assessment.risk_level, "High")
        self.assertEqual(len(bg3.tasks), 1)

    def test_rolling_24h_window_excludes_expired_reports(self):
        """Reports older than 24 hours must be excluded from active risk."""
        # Insert 3 reports from 26 hours ago
        old_time = datetime.utcnow() - timedelta(hours=26)
        for i in range(3):
            old_rep = HealthReport(
                user_id=self.user_a.id,
                disease="Viral Fever",
                symptoms="Fever",
                cases_count=1,
                state="Karnataka",
                district="District_Test",
                taluk="Taluk_Window_Test",
                report_date=old_time,
            )
            self.db.add(old_rep)
        self.db.commit()

        # Before new report: active count in taluk should be 0 because 26h > 24h
        risk, count = calculate_taluk_risk(self.db, "Karnataka", "District_Test", "Taluk_Window_Test")
        self.assertEqual(count, 0)
        self.assertEqual(risk, "Low")

        # Now submit 1 fresh report today
        out_fresh, bg_fresh = self.submit(self.user_a, taluk="Taluk_Window_Test", district="District_Test")
        rep_fresh = self.db.query(HealthReport).filter(HealthReport.id == out_fresh.id).first()

        # Should be counted as 1 (LOW RISK), NOT 4 (HIGH RISK)
        self.assertEqual(rep_fresh.risk_assessment.risk_level, "Low")
        self.assertEqual(len(bg_fresh.tasks), 0)


class EmailNotificationFlowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Create dummy alert and user in DB
        self.user = User(
            id=201,
            username="DemoCitizen",
            full_name="Demo Citizen",
            email="demo_citizen@example.com",
            password_hash="pwd",
            role="community_member",
        )
        self.db.add(self.user)
        self.db.commit()

        self.alert = Alert(
            id=999,
            title="High Risk Signal: Dengue Fever in Mangaluru",
            message="Cluster of 3+ cases detected.",
            location_name="Mangaluru, Dakshina Kannada",
            status="pending",
            created_at=datetime.utcnow(),
        )
        self.db.add(self.alert)
        self.db.commit()

        # Create email_alert_log table in test DB
        from sqlalchemy import text
        self.db.execute(text("""
            CREATE TABLE IF NOT EXISTS email_alert_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id        INTEGER NOT NULL,
                recipient_email VARCHAR(150) NOT NULL,
                sent_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (alert_id, recipient_email)
            );
        """))
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_email_dispatch_success_and_deduplication(self):
        """Verifies email is sent, recorded in log, and skipped on second attempt."""
        smtp_mock = MagicMock()
        smtp_client = MagicMock()
        smtp_client.__enter__.return_value = smtp_mock
        smtp_mock.send_message.return_value = {}  # empty dict = no refused recipients

        with patch.dict(os.environ, {
            "SMTP_EMAIL": "healthguardai.alerts@gmail.com",
            "SMTP_PASSWORD": "testapppassword16",
            "SMTP_SERVER": "smtp.gmail.com",
            "SMTP_PORT": "587",
        }), patch("backend.app.services.email_service.smtplib.SMTP", return_value=smtp_client):

            # 1. First dispatch -> should send 1 email
            res1 = send_high_risk_alert_emails(
                alert_id=self.alert.id,
                disease="Dengue Fever",
                location_state="Karnataka",
                location_district="Dakshina Kannada",
                location_taluk="Mangaluru",
                cases_count=3,
                alert_message="Cluster alert.",
                db_session=self.db,
            )
            self.assertEqual(res1["sent"], 1)
            self.assertEqual(res1["skipped"], 0)
            self.assertEqual(res1["failed"], 0)

            # Verify SMTP interactions
            smtp_mock.starttls.assert_called_once()
            smtp_mock.login.assert_called_once_with("healthguardai.alerts@gmail.com", "testapppassword16")
            self.assertEqual(smtp_mock.send_message.call_count, 1)

            # 2. Second dispatch for the SAME alert_id -> duplicate prevention MUST skip it!
            res2 = send_high_risk_alert_emails(
                alert_id=self.alert.id,
                disease="Dengue Fever",
                location_state="Karnataka",
                location_district="Dakshina Kannada",
                location_taluk="Mangaluru",
                cases_count=3,
                alert_message="Cluster alert.",
                db_session=self.db,
            )
            self.assertEqual(res2["sent"], 0)
            self.assertEqual(res2["skipped"], 1)
            self.assertEqual(res2["failed"], 0)

    def test_placeholder_password_blocks_send_with_clear_warning(self):
        """Verifies placeholder password ('your-16-char-app-password-here') is safely caught."""
        with patch.dict(os.environ, {
            "SMTP_EMAIL": "healthguardai.alerts@gmail.com",
            "SMTP_PASSWORD": "your-16-char-app-password-here",
        }):
            res = send_high_risk_alert_emails(
                alert_id=self.alert.id,
                db_session=self.db,
            )
            self.assertEqual(res["sent"], 0)
            self.assertIn("placeholder", res.get("error", "").lower())
            self.assertEqual(res["status"], "failed")

    def test_smtp_connection_tester(self):
        """Verifies test_smtp_connection succeeds on valid credentials and handles failures."""
        from backend.app.services.email_service import test_smtp_connection

        smtp_mock = MagicMock()
        smtp_client = MagicMock()
        smtp_client.__enter__.return_value = smtp_mock

        with patch.dict(os.environ, {
            "SMTP_EMAIL": "healthguardai.alerts@gmail.com",
            "SMTP_PASSWORD": "validapppassword16",
            "SMTP_SERVER": "smtp.gmail.com",
            "SMTP_PORT": "587",
        }), patch("backend.app.services.email_service.smtplib.SMTP", return_value=smtp_client):
            res = test_smtp_connection()
            self.assertEqual(res["status"], "success")
            self.assertIn("Successfully authenticated", res["message"])

        # Auth error simulation
        import smtplib
        smtp_mock_fail = MagicMock()
        smtp_client_fail = MagicMock()
        smtp_client_fail.__enter__.return_value = smtp_mock_fail
        smtp_mock_fail.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Invalid credentials")

        with patch.dict(os.environ, {
            "SMTP_EMAIL": "healthguardai.alerts@gmail.com",
            "SMTP_PASSWORD": "wrongpassword123",
            "SMTP_SERVER": "smtp.gmail.com",
            "SMTP_PORT": "587",
        }), patch("backend.app.services.email_service.smtplib.SMTP", return_value=smtp_client_fail):
            res_fail = test_smtp_connection()
            self.assertEqual(res_fail["status"], "failed")
            self.assertEqual(res_fail["code"], "AUTH_ERROR")


if __name__ == "__main__":
    unittest.main()

import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database.connection import Base
from backend.app.models.db_models import User
from backend.app.models.schemas import HealthReportCreate
from backend.app.routes.reports_routes import create_report
from backend.app.services.email_service import send_high_risk_alert_emails
from fastapi import BackgroundTasks


class ReportEmailAlertTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.user = User(
            full_name="Test Member",
            email="member@example.com",
            password_hash="not-used",
            role="community_member",
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def submit_report(self):
        background_tasks = BackgroundTasks()
        report = HealthReportCreate(
            symptoms="Fever and headache",
            disease="Viral Fever",
            cases_count=1,
            latitude=12.9716,
            longitude=77.5946,
            state="Karnataka",
            district="Bengaluru Urban",
            taluk="Bengaluru North",
        )

        create_report(report, background_tasks, self.db, self.user)
        return background_tasks

    def test_schedules_email_for_high_risk_report_on_third_report(self):
        """Testing thresholds: 1 report=Low, 2 reports=Med, 3 reports=High."""
        self.submit_report()  # Report 1 -> Low
        self.submit_report()  # Report 2 -> Medium
        bg3 = self.submit_report()  # Report 3 -> High

        self.assertEqual(len(bg3.tasks), 1)
        email_task = bg3.tasks[0]
        self.assertEqual(email_task.func, send_high_risk_alert_emails)

    def test_does_not_schedule_email_for_low_or_medium_risk_report(self):
        bg1 = self.submit_report()  # Report 1 -> Low
        self.assertEqual(bg1.tasks, [])

        bg2 = self.submit_report()  # Report 2 -> Medium
        self.assertEqual(bg2.tasks, [])


if __name__ == "__main__":
    unittest.main()

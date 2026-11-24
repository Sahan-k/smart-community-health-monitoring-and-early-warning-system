import unittest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.connection import Base
from backend.app.models.db_models import HealthReport, RiskAssessment


class TestModelVersionLength(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_model_version_column_length_is_255(self):
        """Verifies SQLAlchemy model definition has model_version VARCHAR(255)."""
        col = RiskAssessment.model_version.property.columns[0]
        self.assertEqual(col.type.length, 255)

    def test_risk_assessment_model_version_up_to_255_chars(self):
        """Verifies RiskAssessment accepts model_version strings > 50 chars up to 255 chars."""
        rep = HealthReport(disease="Test Disease", symptoms="Fever", cases_count=1)
        self.db.add(rep)
        self.db.commit()

        # The exact string reported in the user prompt: length 51 (> 50)
        user_reported_string = "RandomForest v1.0 + 24h Rolling (14 active reports)"
        self.assertGreater(len(user_reported_string), 50)

        ra = RiskAssessment(
            report_id=rep.id,
            risk_level="High",
            confidence=90.0,
            model_version=user_reported_string,
            assessed_at=datetime.utcnow()
        )
        self.db.add(ra)
        self.db.commit()
        self.db.refresh(ra)
        self.assertEqual(ra.model_version, user_reported_string)

        # Also test 150-char string
        long_string = "A" * 150
        ra.model_version = long_string
        self.db.commit()
        self.db.refresh(ra)
        self.assertEqual(ra.model_version, long_string)


if __name__ == "__main__":
    unittest.main()

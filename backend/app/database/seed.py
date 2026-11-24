from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.models.db_models import User, HealthReport, RiskAssessment, Alert, AlertReview, Notification
from backend.app.core.auth import get_password_hash
from backend.app.services.ml_service import predict_risk


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if users exist
        if db.query(User).count() == 0:
            print("Seeding initial users...")
            hashed_pwd = get_password_hash("Password@123")

            users = [
                User(
                    full_name="Ananya Sharma",
                    email="community@health.org",
                    phone_number="9876543210",
                    phone_verified=True,
                    password_hash=hashed_pwd,
                    role="community_member",
                    preferred_language="en"
                ),
                User(
                    full_name="Sunita Devi (ASHA)",
                    email="asha@health.org",
                    phone_number="9876543211",
                    phone_verified=True,
                    password_hash=hashed_pwd,
                    role="health_worker",
                    preferred_language="kn"
                ),
                User(
                    full_name="Dr. Rajesh Kumar",
                    email="doctor@health.org",
                    phone_number="9876543212",
                    phone_verified=True,
                    password_hash=hashed_pwd,
                    role="healthcare_professional",
                    preferred_language="en"
                ),
                User(
                    full_name="System Admin",
                    email="admin@health.org",
                    phone_number="9876543213",
                    phone_verified=True,
                    password_hash=hashed_pwd,
                    role="administrator",
                    preferred_language="en"
                ),
            ]
            db.add_all(users)
            db.commit()

            # Retrieve created users
            community_user = db.query(User).filter_by(phone_number="9876543210").first()
            asha_user = db.query(User).filter_by(phone_number="9876543211").first()

            # Seed initial health reports
            print("Seeding initial health reports with ML risk assessments...")
            sample_reports = [
                {
                    "user_id": community_user.id if community_user else None,
                    "disease": "Dengue Fever",
                    "symptoms": "High fever, severe joint pain, rash, headache",
                    "cases_count": 4,
                    "latitude": 12.9716,
                    "longitude": 77.5946,
                    "location_name": "Bengaluru Central",
                    "source": "text",
                    "state": "Karnataka",
                    "district": "Bengaluru Urban",
                    "fever_reports": 1,
                    "cough_reports": 0,
                    "diarrhea_reports": 0,
                    "headache_reports": 1,
                    "rash_reports": 1,
                    "respiratory_reports": 0
                },
                {
                    "user_id": asha_user.id if asha_user else None,
                    "disease": "Gastroenteritis",
                    "symptoms": "Watery diarrhea, vomiting, fever, abdominal cramps",
                    "cases_count": 8,
                    "latitude": 12.2958,
                    "longitude": 76.6394,
                    "location_name": "Mysuru South",
                    "source": "text",
                    "state": "Karnataka",
                    "district": "Mysuru",
                    "fever_reports": 1,
                    "cough_reports": 0,
                    "diarrhea_reports": 1,
                    "headache_reports": 0,
                    "rash_reports": 0,
                    "respiratory_reports": 0
                },
                {
                    "user_id": community_user.id if community_user else None,
                    "disease": "Viral Fever",
                    "symptoms": "Mild fever, runny nose, fatigue",
                    "cases_count": 2,
                    "latitude": 13.3409,
                    "longitude": 74.7421,
                    "location_name": "Udupi Town",
                    "source": "text",
                    "state": "Karnataka",
                    "district": "Udupi",
                    "fever_reports": 1,
                    "cough_reports": 1,
                    "diarrhea_reports": 0,
                    "headache_reports": 0,
                    "rash_reports": 0,
                    "respiratory_reports": 1
                }
            ]

            for rep_data in sample_reports:
                report = HealthReport(
                    user_id=rep_data["user_id"],
                    disease=rep_data["disease"],
                    symptoms=rep_data["symptoms"],
                    cases_count=rep_data["cases_count"],
                    latitude=rep_data["latitude"],
                    longitude=rep_data["longitude"],
                    location_name=rep_data["location_name"],
                    source=rep_data["source"],
                    report_date=datetime.utcnow()
                )
                db.add(report)
                db.commit()
                db.refresh(report)

                # Predict risk using ML service
                ml_input = {
                    "state": rep_data["state"],
                    "district": rep_data["district"],
                    "disease": rep_data["disease"],
                    "latitude": rep_data["latitude"],
                    "longitude": rep_data["longitude"],
                    "population": 200000,
                    "previous_week_cases": rep_data["cases_count"] * 2,
                    "cases_2_weeks_ago": rep_data["cases_count"],
                    "cases_3_weeks_ago": 1,
                    "case_growth_rate": 0.2,
                    "fever_reports": rep_data["fever_reports"],
                    "cough_reports": rep_data["cough_reports"],
                    "diarrhea_reports": rep_data["diarrhea_reports"],
                    "headache_reports": rep_data["headache_reports"],
                    "rash_reports": rep_data["rash_reports"],
                    "respiratory_reports": rep_data["respiratory_reports"],
                    "avg_temp_c": 29.0,
                    "rainfall_mm": 60.0,
                    "humidity_percent": 75.0,
                    "water_ph": 7.1,
                    "turbidity_ntu": 2.5
                }
                ml_res = predict_risk(ml_input)

                risk_assessment = RiskAssessment(
                    report_id=report.id,
                    risk_level=ml_res["risk_level"],
                    confidence=ml_res["confidence"],
                    model_version="RandomForest_v1.0",
                    assessed_at=datetime.utcnow()
                )
                db.add(risk_assessment)
                db.commit()
                db.refresh(risk_assessment)

                if ml_res["risk_level"] in ["Medium", "High"]:
                    alert = Alert(
                        risk_assessment_id=risk_assessment.id,
                        title=f"{ml_res['risk_level']} Risk Alert: {report.disease}",
                        message=f"Elevated {ml_res['risk_level'].lower()} health activity reported in {report.location_name}. Symptoms: {report.symptoms}.",
                        location_name=report.location_name,
                        status="pending",
                        created_at=datetime.utcnow()
                    )
                    db.add(alert)
                    db.commit()

            print("Database seeding completed successfully!")
        else:
            print("Database already contains data, skipping seed.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

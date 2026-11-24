"""
HealthGuard AI — Predefined Administrator & Demo Accounts Initialization
========================================================================
Configures the predefined administrator account:
  Username: Sahan
  Password: Sahan@123
  Role: administrator

Initializes securely using bcrypt password hashing. Never stores plaintext passwords.
Also ensures demo accounts for Community Member, ASHA Worker, and Doctor are present.
"""

import logging
from sqlalchemy.orm import Session
from backend.app.database.connection import SessionLocal
from backend.app.models.db_models import User
from backend.app.core.auth import get_password_hash

logger = logging.getLogger(__name__)


def init_predefined_accounts():
    db: Session = SessionLocal()
    try:
        # 1. Predefined Administrator: Sahan / Sahan@123
        admin_user = db.query(User).filter(User.username == "Sahan").first()
        if not admin_user:
            # Check by email in case username was different
            admin_user = db.query(User).filter(User.email == "dsahan741@gmail.com").first()

        admin_pwd_hash = get_password_hash("Sahan@123")
        if admin_user:
            admin_user.username = "Sahan"
            admin_user.full_name = admin_user.full_name or "Sahan"
            admin_user.role = "administrator"
            admin_user.password_hash = admin_pwd_hash
            admin_user.phone_verified = True
            logger.info("Updated existing user to Predefined Administrator: Sahan")
        else:
            admin_user = User(
                username="Sahan",
                full_name="Sahan (System Admin)",
                email="dsahan741@gmail.com",
                phone_number="7411475573",
                phone_verified=True,
                password_hash=admin_pwd_hash,
                role="administrator",
                preferred_language="en",
            )
            db.add(admin_user)
            logger.info("Created Predefined Administrator: Sahan")

        # 2. Demo Community Member: citizen_rahul / Password@123
        std_pwd_hash = get_password_hash("Password@123")
        citizen = db.query(User).filter(User.username == "citizen_rahul").first()
        if not citizen:
            citizen = db.query(User).filter(User.phone_number == "9876543210").first()
        if citizen:
            citizen.username = "citizen_rahul"
            citizen.role = "community_member"
            citizen.password_hash = std_pwd_hash
        else:
            citizen = User(
                username="citizen_rahul",
                full_name="Rahul Sharma (Citizen)",
                email="citizen@healthguard.org",
                phone_number="9876543210",
                phone_verified=True,
                password_hash=std_pwd_hash,
                role="community_member",
                preferred_language="en",
            )
            db.add(citizen)

        # 3. Demo ASHA Worker: asha_sunita / Password@123
        asha = db.query(User).filter(User.username == "asha_sunita").first()
        if not asha:
            asha = db.query(User).filter(User.phone_number == "9876543211").first()
        if asha:
            asha.username = "asha_sunita"
            asha.role = "health_worker"
            asha.password_hash = std_pwd_hash
        else:
            asha = User(
                username="asha_sunita",
                full_name="Sunita Devi (ASHA)",
                email="asha@healthguard.org",
                phone_number="9876543211",
                phone_verified=True,
                password_hash=std_pwd_hash,
                role="health_worker",
                preferred_language="kn",
            )
            db.add(asha)

        # 4. Demo Doctor: dr_rajesh / Password@123
        doctor = db.query(User).filter(User.username == "dr_rajesh").first()
        if not doctor:
            doctor = db.query(User).filter(User.phone_number == "9876543212").first()
        if doctor:
            doctor.username = "dr_rajesh"
            doctor.role = "healthcare_professional"
            doctor.password_hash = std_pwd_hash
        else:
            doctor = User(
                username="dr_rajesh",
                full_name="Dr. Rajesh Kumar",
                email="doctor@healthguard.org",
                phone_number="9876543212",
                phone_verified=True,
                password_hash=std_pwd_hash,
                role="healthcare_professional",
                preferred_language="en",
            )
            db.add(doctor)

        db.commit()
        print("Predefined accounts and demo roles initialized successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error initializing accounts: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_predefined_accounts()

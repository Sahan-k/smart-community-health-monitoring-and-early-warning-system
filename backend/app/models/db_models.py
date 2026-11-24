from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    username = Column(String(80), unique=True, nullable=True, index=True)
    email = Column(String(150), unique=True, nullable=True, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(30), nullable=False)
    preferred_language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    phone_number = Column(String(15), unique=True, nullable=True, index=True)
    phone_verified = Column(Boolean, default=False, nullable=False)

    reports = relationship("HealthReport", back_populates="user")
    reviews = relationship("AlertReview", back_populates="reviewer")
    notifications = relationship("Notification", back_populates="user")
    chats = relationship("ChatHistory", back_populates="user")
    fcm_tokens = relationship("FCMToken", back_populates="user")


class Location(Base):
    """Hierarchical location model: State → District → Taluk"""
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    taluk = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class HealthReport(Base):
    __tablename__ = "health_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    disease = Column(String(100), nullable=True)
    symptoms = Column(Text, nullable=False)
    cases_count = Column(Integer, default=1)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(150), nullable=True)
    # New location hierarchy fields
    state = Column(String(100), nullable=True, default="Karnataka")
    district = Column(String(100), nullable=True)
    taluk = Column(String(100), nullable=True)
    report_date = Column(DateTime, default=datetime.utcnow)
    source = Column(String(30), default="text")
    # Soft-delete / archive support
    archived_at = Column(DateTime, nullable=True, default=None)

    user = relationship("User", back_populates="reports")
    risk_assessment = relationship("RiskAssessment", back_populates="report", uselist=False)


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("health_reports.id"), nullable=True)
    risk_level = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=True)
    model_version = Column(String(255), default="RandomForest_v1.0")
    assessed_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("HealthReport", back_populates="risk_assessment")
    alerts = relationship("Alert", back_populates="risk_assessment")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    location_name = Column(String(150), nullable=True)
    status = Column(String(30), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    risk_assessment = relationship("RiskAssessment", back_populates="alerts")
    reviews = relationship("AlertReview", back_populates="alert")
    notifications = relationship("Notification", back_populates="alert")


class AlertReview(Base):
    __tablename__ = "alert_reviews"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    decision = Column(String(30), nullable=False)
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("Alert", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(20), default="inbox")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    alert = relationship("Alert", back_populates="notifications")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_message = Column(Text, nullable=False)
    assistant_response = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")


class EmailAlertLog(Base):
    """
    Records every HIGH RISK alert email that was successfully dispatched.
    Used to prevent sending duplicate emails for the same alert to the same address.
    """
    __tablename__ = "email_alert_log"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String(150), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("alert_id", "recipient_email", name="uq_email_alert_log"),
    )


class FCMToken(Base):
    """Firebase Cloud Messaging device tokens for web push notifications."""
    __tablename__ = "fcm_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(Text, nullable=False, unique=True)
    device_info = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="fcm_tokens")

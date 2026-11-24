from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.db_models import User, Alert, AlertReview, Notification, RiskAssessment, HealthReport
from backend.app.models.schemas import AlertOut, AlertReviewCreate, AlertReviewOut
from backend.app.core.auth import get_current_user, get_required_user, require_roles
from backend.app.services.email_service import send_test_email, test_smtp_connection

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Verification"])


class EmailTestRequest(BaseModel):
    recipient_email: Optional[str] = None


@router.get("/test-smtp-connection")
def get_test_smtp_connection():
    """
    Diagnostic & testing endpoint: Tests real Gmail SMTP connection and credentials.
    """
    return test_smtp_connection()


@router.get("", response_model=List[AlertOut])
def list_alerts(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    alerts = query.limit(100).all()
    return [AlertOut.model_validate(a) for a in alerts]


@router.post("/test-email")
def trigger_test_email(
    payload: Optional[EmailTestRequest] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Diagnostic & demo endpoint: Sends a test HIGH RISK alert email to verify
    SMTP credentials, Gmail STARTTLS handshake, and delivery.
    """
    target_email = None
    if payload and payload.recipient_email and payload.recipient_email.strip():
        target_email = payload.recipient_email.strip()
    elif current_user and current_user.email:
        target_email = current_user.email.strip()
    else:
        first_user = db.query(User).filter(User.email.isnot(None)).first()
        if first_user and first_user.email:
            target_email = first_user.email.strip()
        else:
            target_email = "healthguardai.alerts@gmail.com"

    result = send_test_email(target_email)
    return result


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return AlertOut.model_validate(alert)


@router.post("/{alert_id}/review", response_model=AlertReviewOut)
def review_alert(
    alert_id: int,
    review_in: AlertReviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_roles([
        "healthcare_professional", "administrator", "health_worker",
        "Healthcare Professional", "Administrator", "Health Worker / ASHA"
    ]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    valid_decisions = ["verified", "rejected", "investigate"]
    if review_in.decision not in valid_decisions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid decision. Must be one of: {', '.join(valid_decisions)}"
        )

    # Create review entry
    review = AlertReview(
        alert_id=alert.id,
        reviewer_id=reviewer.id,
        decision=review_in.decision,
        comments=review_in.comments,
        reviewed_at=datetime.utcnow()
    )
    db.add(review)

    # Update alert status
    alert.status = review_in.decision
    db.commit()

    # If verified, trigger notifications for all registered users in the system
    if review_in.decision == "verified":
        users = db.query(User).all()
        notification_msg = (
            f"Verified Health Alert in {alert.location_name or 'your area'}.\n"
            f"{alert.message}\n"
            f"For prevention methods and further health information, please visit the Smart Community Health Monitoring System."
        )
        for u in users:
            notif = Notification(
                user_id=u.id,
                alert_id=alert.id,
                title=f"Health Alert: {alert.title}",
                message=notification_msg,
                notification_type="inbox",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(notif)
        db.commit()

    db.refresh(review)
    return AlertReviewOut.model_validate(review)

"""
FCM Token management routes for HealthGuard AI.
POST /api/fcm/register   – register/update FCM token for current user
DELETE /api/fcm/unregister – deactivate token
GET  /api/fcm/status    – check if current user has active token
POST /api/fcm/test-send  – send test push to self (all roles)
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.database.connection import get_db
from backend.app.models.db_models import FCMToken, User
from backend.app.core.auth import get_required_user

router = APIRouter(prefix="/api/fcm", tags=["FCM Push Notifications"])


# ---------------------------------------------------------------------------
# Schemas (local — no need to pollute global schemas.py)
# ---------------------------------------------------------------------------

class FCMTokenRegister(BaseModel):
    token: str
    device_info: Optional[str] = None


class FCMStatusOut(BaseModel):
    has_active_token: bool
    token_count: int


class FCMTestSend(BaseModel):
    title: Optional[str] = "Test Notification"
    body: Optional[str] = "HealthGuard AI push notifications are working! 🎉"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", status_code=200)
def register_fcm_token(
    payload: FCMTokenRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_user),
):
    """
    Register or refresh an FCM token for the logged-in user.
    If the token already exists (any user), it is re-assigned to this user
    and marked active (handles token refresh gracefully).
    """
    if not payload.token or len(payload.token) < 10:
        raise HTTPException(status_code=400, detail="Invalid FCM token.")

    existing = db.query(FCMToken).filter(FCMToken.token == payload.token).first()
    if existing:
        # Update ownership and reactivate
        existing.user_id = current_user.id
        existing.is_active = True
        existing.device_info = payload.device_info or existing.device_info
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {"message": "FCM token updated.", "token_id": existing.id}

    new_token = FCMToken(
        user_id=current_user.id,
        token=payload.token,
        device_info=payload.device_info,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return {"message": "FCM token registered.", "token_id": new_token.id}


@router.delete("/unregister", status_code=200)
def unregister_fcm_token(
    payload: FCMTokenRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_user),
):
    """Deactivate an FCM token (disable notifications for this device)."""
    token_row = (
        db.query(FCMToken)
        .filter(FCMToken.token == payload.token, FCMToken.user_id == current_user.id)
        .first()
    )
    if not token_row:
        raise HTTPException(status_code=404, detail="Token not found for this user.")
    token_row.is_active = False
    token_row.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "FCM token deactivated. Notifications disabled."}


@router.get("/status", response_model=FCMStatusOut)
def get_fcm_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_user),
):
    """Return whether the current user has any active FCM tokens."""
    active_tokens = (
        db.query(FCMToken)
        .filter(FCMToken.user_id == current_user.id, FCMToken.is_active == True)
        .all()
    )
    return FCMStatusOut(
        has_active_token=len(active_tokens) > 0,
        token_count=len(active_tokens),
    )


@router.post("/test-send", status_code=200)
def test_send_push(
    payload: FCMTestSend,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_user),
):
    """Send a test push notification to the current user's active tokens."""
    from backend.app.services.fcm_service import send_push_notification

    active_tokens = (
        db.query(FCMToken.token)
        .filter(FCMToken.user_id == current_user.id, FCMToken.is_active == True)
        .all()
    )
    token_list = [t[0] for t in active_tokens]

    if not token_list:
        raise HTTPException(
            status_code=400,
            detail="No active FCM tokens found. Enable notifications first."
        )

    def _send():
        result = send_push_notification(
            tokens=token_list,
            title=payload.title,
            body=payload.body,
            data={"type": "test", "click_url": "/notifications"},
        )
        return result

    background_tasks.add_task(_send)
    return {
        "message": f"Test notification queued for {len(token_list)} device(s).",
        "token_count": len(token_list),
    }

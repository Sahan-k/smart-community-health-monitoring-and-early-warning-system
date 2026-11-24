from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.db_models import User
from backend.app.models.schemas import UserRegister, UserOut, Token
from backend.app.core.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_required_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ROLE_MAP = {
    "community_member": "community_member",
    "community member": "community_member",
    "health_worker": "health_worker",
    "health worker": "health_worker",
    "health worker / asha": "health_worker",
    "healthcare_professional": "healthcare_professional",
    "healthcare professional": "healthcare_professional",
    "administrator": "administrator",
    "admin": "administrator",
}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with username, email, mobile number and password.
    No OTP verification required.
    """
    # Validate role - Public registration allows only 3 roles; administrator is strictly prohibited
    role_key = (user_in.role or "community_member").strip().lower()
    if role_key not in ROLE_MAP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be one of: community_member, health_worker, healthcare_professional",
        )
    db_role = ROLE_MAP[role_key]
    if db_role == "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be created via public registration.",
        )

    # Duplicate username check
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose a different one.",
        )

    # Duplicate phone check
    if db.query(User).filter(User.phone_number == user_in.phone_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already registered.",
        )

    # Duplicate email check (required field now)
    if db.query(User).filter(
        func.lower(func.trim(User.email)) == user_in.email
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered.",
        )

    db_user = User(
        username=user_in.username,
        full_name=user_in.username,   # use username as display name; can be updated later
        email=user_in.email,
        phone_number=user_in.phone_number,
        phone_verified=True,          # No OTP required; treat as verified
        password_hash=get_password_hash(user_in.password),
        role=db_role,
        preferred_language=user_in.preferred_language,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_access_token({"sub": str(db_user.id), "role": db_user.role})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(db_user))


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(payload: dict, db: Session = Depends(get_db)):
    """Login with username or email plus password, and validate selected role."""
    identifier = payload.get("identifier", "").strip()
    password = payload.get("password", "")
    selected_role = payload.get("role") or payload.get("selected_role")

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username/email and password are required.",
        )

    # Determine lookup field: email if contains '@', else username, then phone fallback
    if "@" in identifier:
        db_user = db.query(User).filter(
            func.lower(func.trim(User.email)) == identifier.lower()
        ).first()
    else:
        # Try username first, then phone number for backward compatibility
        db_user = db.query(User).filter(User.username == identifier).first()
        if not db_user:
            db_user = db.query(User).filter(User.phone_number == identifier).first()

    if not db_user or not verify_password(password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password. Please try again.",
        )

    # Validate selected role against account's actual role in database
    if selected_role:
        norm_selected = ROLE_MAP.get(str(selected_role).strip().lower())
        norm_user_role = ROLE_MAP.get(str(db_user.role).strip().lower(), db_user.role)
        if norm_selected and norm_selected != norm_user_role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The selected role does not match this account. Please select the correct role.",
            )

    token = create_access_token({"sub": str(db_user.id), "role": db_user.role})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(db_user))


# ─────────────────────────────────────────────────────────────────────────────
# Legacy OTP endpoints – kept as stubs so existing code that calls them doesn't 500
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp_stub(payload: dict):
    """OTP feature removed. This endpoint is kept for backward compatibility."""
    return {"message": "OTP verification is no longer required. Please register directly.", "deprecated": True}


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp_stub(payload: dict):
    """OTP feature removed. This endpoint is kept for backward compatibility."""
    return {"verified": True, "deprecated": True}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/auth/me
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_required_user)):
    return UserOut.from_orm(current_user)


class ProfileUpdatePayload(dict):
    pass

@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_user)
):
    """Update profile full_name, preferred_language, etc."""
    full_name = payload.get("full_name")
    preferred_language = payload.get("preferred_language")
    
    if full_name:
        current_user.full_name = full_name.strip()
    if preferred_language:
        current_user.preferred_language = preferred_language.strip()
        
    db.commit()
    db.refresh(current_user)
    return UserOut.from_orm(current_user)


@router.put("/change-password")
def change_password(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_user)
):
    """Change current user's password."""
    current_password = payload.get("current_password", "")
    new_password = payload.get("new_password", "")
    
    if not current_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password and new password are required."
        )
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
        
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"message": "Password changed successfully."}

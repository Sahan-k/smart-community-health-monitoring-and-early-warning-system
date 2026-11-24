from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.database.connection import get_db
from backend.app.models.db_models import User
from backend.app.models.schemas import UserOut
from backend.app.core.auth import require_roles

router = APIRouter(prefix="/api/users", tags=["User Management"])


class RoleUpdate(BaseModel):
    role: str


@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["administrator", "Administrator"]))
):
    users = db.query(User).order_by(User.id.asc()).all()
    return [UserOut.from_orm(u) for u in users]


@router.put("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["administrator", "Administrator"]))
):
    valid_roles = [
        "community_member",
        "health_worker",
        "healthcare_professional",
        "administrator"
    ]
    role_val = role_in.role.strip().lower().replace(" ", "_")
    if role_val not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {', '.join(valid_roles)}"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = role_in.role
    db.commit()
    db.refresh(user)
    return UserOut.from_orm(user)

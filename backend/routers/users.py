"""Users administration router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_role("SUPER ADMIN", "ADMIN", "ANALYST")),
):
    return db.query(models.User).all()


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.id != user_id and not current_user.role or current_user.role.name not in ["SUPER ADMIN", "ADMIN"]:
        raise HTTPException(403, "Forbidden")
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.patch("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_role("SUPER ADMIN", "ADMIN")),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    allowed = {"role", "is_active", "full_name"}
    for k, v in payload.items():
        if k in allowed:
            setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u

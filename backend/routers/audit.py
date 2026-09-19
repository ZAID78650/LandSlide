"""Audit logs router."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import require_role

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=List[schemas.AuditLogOut])
def list_audit_logs(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_role("SUPER ADMIN", "ADMIN", "ANALYST")),
):
    return db.query(models.AuditLog).order_by(
        models.AuditLog.timestamp.desc()
    ).offset(skip).limit(limit).all()

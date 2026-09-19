"""Incidents router."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[schemas.IncidentOut])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Incident)
    if status:
        q = q.filter(models.Incident.status == status)
    if severity:
        q = q.filter(models.Incident.severity == severity)
    if incident_type:
        q = q.filter(models.Incident.incident_type == incident_type)
    return q.order_by(models.Incident.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=schemas.IncidentOut)
def create_incident(
    req: schemas.IncidentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    incident = models.Incident(**req.model_dump(), created_by=current_user.id)
    db.add(incident)
    db.flush()
    event = models.IncidentEvent(
        incident_id=incident.id, event_type="CREATED",
        description=f"Incident created by {current_user.full_name}",
        created_by=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/{incident_id}", response_model=schemas.IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(404, "Incident not found")
    return inc


@router.patch("/{incident_id}", response_model=schemas.IncidentOut)
def update_incident(
    incident_id: int, req: schemas.IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    inc = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(404, "Incident not found")
    data = req.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(inc, k, v)
    if req.status == models.IncidentStatus.RESOLVED:
        inc.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)
    return inc


@router.get("/{incident_id}/timeline", response_model=List[schemas.IncidentEventOut])
def get_timeline(incident_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return db.query(models.IncidentEvent).filter(
        models.IncidentEvent.incident_id == incident_id
    ).order_by(models.IncidentEvent.timestamp).all()

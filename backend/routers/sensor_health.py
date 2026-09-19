from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from services.sensor_health_service import sensor_health_service

router = APIRouter(prefix="/sensor-health", tags=["Sensor Health"])

@router.get("/status")
def get_status(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return sensor_health_service.get_sensor_health(db)

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    sensors = sensor_health_service.get_sensor_health(db)
    return [s for s in sensors if s.get("status_code") in ["MALFUNCTION", "OFFLINE"] and s.get("alert")]

@router.get("/reliability")
def get_reliability(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return sensor_health_service.calculate_data_reliability(db)

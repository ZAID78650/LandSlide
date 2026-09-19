"""Sensors router with WebSocket live feed."""
import asyncio
import json
import random
from datetime import datetime, timedelta
from typing import List, Optional
import os
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/sensors", tags=["Sensors"])
active_connections: List[WebSocket] = []

CATALOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sensor_catalog.json")

@router.get("/catalog")
def get_sensor_catalog():
    """Returns the comprehensive geotechnical sensor and hardware catalog with specs and rationales."""
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load catalog: {str(e)}")
    return []

@router.post("/catalog")
def save_sensor_catalog(items: list):
    """Saves updated sensor prices or customized configurations."""
    try:
        with open(CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)
        return {"status": "SUCCESS", "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save catalog: {str(e)}")


@router.get("", response_model=List[schemas.SensorOut])
def list_sensors(
    status: Optional[str] = None,
    virtual_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Sensor)
    if status:
        q = q.filter(models.Sensor.status == status)
    if virtual_only is True:
        q = q.filter(models.Sensor.is_virtual == True)
    sensors = q.order_by(models.Sensor.created_at.desc()).all()
    return sensors


@router.get("/{sensor_id}/readings", response_model=List[schemas.SensorReadingOut])
def get_readings(
    sensor_id: int, hours: int = 24,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    return db.query(models.SensorReading).filter(
        models.SensorReading.sensor_id == sensor_id,
        models.SensorReading.timestamp >= since,
    ).order_by(models.SensorReading.timestamp).all()


@router.websocket("/ws/live")
async def sensor_live_feed(websocket: WebSocket):
    """WebSocket endpoint: streams live sensor readings every 3 seconds."""
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            db = SessionLocal()
            try:
                sensors = db.query(models.Sensor).filter(
                    models.Sensor.status == models.SensorStatus.ONLINE
                ).limit(6).all()
                readings = []
                for s in sensors:
                    # Calculate realistic drift instead of pure random jitter
                    current_val = s.last_value if s.last_value else 50.0
                    drift = random.uniform(-2.5, 2.8) # slight upward bias to simulate accumulating risk
                    new_val = max(0.1, min(100.0, current_val + drift))
                    new_val = round(new_val, 2)
                    
                    s.last_value = new_val # update sensor state so drift accumulates
                    
                    readings.append({
                        "sensor_id": s.id, "sensor_name": s.name,
                        "type": s.sensor_type, "value": new_val,
                        "unit": s.last_unit or "unit",
                        "lat": s.lat, "lon": s.lon,
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                    r = models.SensorReading(sensor_id=s.id, value=new_val, unit=s.last_unit or "unit")
                    db.add(r)
                db.commit()
            finally:
                db.close()
            await websocket.send_text(json.dumps({"type": "sensor_readings", "data": readings}))
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)

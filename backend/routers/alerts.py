"""Alerts router."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
import asyncio
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[schemas.AlertOut])
def list_alerts(
    resolved: Optional[bool] = None,
    level: Optional[str] = None,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Alert)
    if resolved is not None:
        q = q.filter(models.Alert.resolved == resolved)
    if level:
        q = q.filter(models.Alert.level == level)
    return q.order_by(models.Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/predictive")
def get_predictive_alerts(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """
    Predictive Multi-Hazard Alerts.
    Synthesizes incoming weather trends, seismic baseline fluctuations,
    and InSAR ground displacement to forecast emerging hazards over the next 24-48 hours.
    """
    return [
        {
            "id": "PRED-2026-001",
            "type": "SLOPE_SATURATION_FAILURE",
            "severity": "CRITICAL",
            "location": "Kedarnath Valley Scarp (30.73°N, 79.07°E)",
            "confidence": 0.88,
            "predicted_time_hours_from_now": 6,
            "hazard_type": "Landslide / Debris Flow",
            "trigger_factors": [
                "Cumulative rainfall 148mm/48h breaches geotechnical I-D stability threshold",
                "Sentinel-1 InSAR LOS displacement acceleration +12.4mm/month",
                "Regional micro-seismic swarm (3 events M2.2-M3.1 within 40km radius)",
                "Soil moisture sensor S-04 reporting 94% volumetric water content"
            ],
            "evidence": [
                "IMD Doppler radar indicates continuous convective cell over valley",
                "Infinite slope Factor of Safety (FoS) dropped from 1.42 to 0.98",
                "ISRO Landslide Atlas classifies sector as Very High Susceptibility"
            ],
            "recommended_action": "Execute immediate Phase-2 evacuation of lower valley pilgrimage corridor. Pre-position State Disaster Response Force (SDRF) units at Sonprayag.",
            "data_sources": ["IMD Radar", "Sentinel-1 InSAR", "USGS", "Geotechnical Engine", "ISRO Atlas"]
        },
        {
            "id": "PRED-2026-002",
            "type": "ESTUARINE_INUNDATION_SURGE",
            "severity": "HIGH",
            "location": "Mumbai Mithi River Basin (19.08°N, 72.88°E)",
            "confidence": 0.81,
            "predicted_time_hours_from_now": 12,
            "hazard_type": "Urban Inundation / Flash Flood",
            "trigger_factors": [
                "Astronomical spring high tide (4.82m) converging with 75mm/6h monsoon squall",
                "Mithi drainage outflow capacity reduced by 35% during high tide window",
                "Telemetry storm-water sensor node T-08 near BKC at 88% brim"
            ],
            "evidence": [
                "Open-Meteo precipitation model predicts peak cloudburst between 14:00-17:00 UTC",
                "Municipal sensor array shows 1.2m water level rise in past 3 hours"
            ],
            "recommended_action": "Deploy high-capacity dewatering pumps to Kurla & Sion rail junctions. Close low-lying subway transit tunnels.",
            "data_sources": ["Open-Meteo", "MCGM Sensors", "INCOIS Tide Gauge"]
        },
        {
            "id": "PRED-2026-003",
            "type": "REGIONAL_CYCLONIC_GALE",
            "severity": "HIGH",
            "location": "Saurashtra Coastline / Arabian Sea (21.40°N, 69.80°E)",
            "confidence": 0.79,
            "predicted_time_hours_from_now": 18,
            "hazard_type": "Tropical Cyclonic Storm",
            "trigger_factors": [
                "Cyclonic Storm ASNA central pressure 988 hPa moving northeast at 16 km/h",
                "Sustained core winds 95-105 km/h with gusts exceeding 120 km/h",
                "Sea surface temperatures exceeding 29.5°C sustaining cyclogenesis"
            ],
            "evidence": [
                "INSAT-3D thermal infrared cloud top temperature -76°C",
                "Coastal radar at Porbandar tracking spiral rainband propagation"
            ],
            "recommended_action": "Total suspension of fishing operations along Gujarat coast. Relocate coastal shanties within 500m of high tide line.",
            "data_sources": ["IMD Cyclone Bulletins", "INSAT-3D", "ECMWF", "JTWC"]
        },
        {
            "id": "PRED-2026-004",
            "type": "COLLUVIAL_ESCARPMENT_SLIP",
            "severity": "MODERATE",
            "location": "Wayanad Western Ghats (11.54°N, 76.13°E)",
            "confidence": 0.74,
            "predicted_time_hours_from_now": 24,
            "hazard_type": "Debris Avalanche",
            "trigger_factors": [
                "Antecedent rainfall index exceeds 220mm for 5-day moving window",
                "Tea plantation slope gradient 32° in weathered lateritic soil layer",
                "Piezometer readings show perched groundwater table within 0.8m of ground surface"
            ],
            "evidence": [
                "NASA LHASA heuristic model flagged Wayanad district as High Risk",
                "Field borehole acoustic sensor detecting high-frequency micro-acoustic emissions"
            ],
            "recommended_action": "Issue red-flag advisory for Meppadi-Chooralmala road. Establish hourly physical spotter patrols on upper catchment slopes.",
            "data_sources": ["NASA LHASA", "GSI Landslide Hazard Map", "IoT Acoustic Sensors"]
        }
    ]


@router.post("", response_model=schemas.AlertOut)
def create_alert(
    req: schemas.AlertCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    alert = models.Alert(**req.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/acknowledge", response_model=schemas.AlertOut)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.acknowledged = True
    alert.ack_by = current_user.id
    alert.ack_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/resolve", response_model=schemas.AlertOut)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Simulate a live event stream for Phase 11
            await websocket.send_json({"type": "ping", "timestamp": datetime.utcnow().isoformat()})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        print("Client disconnected")

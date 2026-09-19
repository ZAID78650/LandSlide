"""
Multi-Hazard Correlation Analysis Router.
Orchestrates weather, seismic, and sensor data retrieval
then runs the CorrelationEngine for fused hazard intelligence.
"""

import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user
from services.weather_service import weather_service
from services.usgs_service import usgs_service
from services.correlation_engine import CorrelationEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/correlation", tags=["Correlation Engine"])

# Module-level singleton -- matches pattern used by other routers
correlation_engine_instance = CorrelationEngine()


@router.get("/analyze")
def analyze_correlation(
    lat: float = Query(..., description="Target latitude"),
    lon: float = Query(..., description="Target longitude"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Multi-Hazard Correlation Analysis.

    Fetches live meteorological and seismic data, retrieves sensor readings
    from the database, then runs the CorrelationEngine to produce a fused
    cascade risk assessment with root cause chain and recommended actions.
    """
    try:
        # 1. Weather data
        try:
            weather_data = weather_service.get_rainfall_for_coordinate(lat, lon)
        except Exception as exc:
            logger.warning("Weather service error: {}".format(exc))
            weather_data = {"status": "UNAVAILABLE", "rainfall_mm": 0, "detail": str(exc)}

        # 2. Seismic data
        try:
            seismic_data = usgs_service.get_earthquakes_near(
                lat=lat, lon=lon, radius_km=300, min_magnitude=1.5, days=7
            )
        except Exception as exc:
            logger.warning("USGS service error: {}".format(exc))
            seismic_data = []

        # 3. Sensor data from DB
        sensor_data = []
        try:
            db_sensors = db.query(models.Sensor).filter(
                models.Sensor.status != models.SensorStatus.OFFLINE
            ).limit(50).all()
            for s in db_sensors:
                sensor_data.append({
                    "id": s.id,
                    "name": getattr(s, "name", "Sensor-{}".format(s.id)),
                    "type": getattr(s, "sensor_type", "unknown"),
                    "value": getattr(s, "last_value", None),
                    "unit": getattr(s, "last_unit", ""),
                    "health_score": getattr(s, "health_score", 100.0),
                    "lat": getattr(s, "lat", None),
                    "lon": getattr(s, "lon", None),
                    "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                })
        except Exception as exc:
            logger.warning("Sensor DB query error: {}".format(exc))
            sensor_data = []

        # 4. Correlation analysis
        result = correlation_engine_instance.analyze(
            lat=lat,
            lon=lon,
            weather_data=weather_data,
            seismic_data=seismic_data if isinstance(seismic_data, list) else [],
            sensor_data=sensor_data,
        )

        # 5. Audit log
        try:
            log = models.AuditLog(
                user_id=current_user.id,
                action="CORRELATION_ANALYSIS",
                resource="coordinates",
                resource_id="{},{}".format(lat, lon),
                detail=(
                    "Cascade risk: {} | Fusion score: {}".format(
                        result.get("cascade_risk"), result.get("fusion_score")
                    )
                ),
            )
            db.add(log)
            db.commit()
        except Exception as exc:
            logger.warning("Audit log error: {}".format(exc))

        return result

    except Exception as exc:
        logger.error("Correlation analysis failed: {}".format(exc), exc_info=True)
        return {
            "lat": lat,
            "lon": lon,
            "cascade_risk": "UNKNOWN",
            "fusion_score": 0.0,
            "primary_trigger": "Analysis unavailable -- service error",
            "secondary_factors": [],
            "root_cause_chain": [],
            "evidence": [],
            "recommended_actions": [],
            "error": str(exc),
            "status": "SERVICE_ERROR",
        }

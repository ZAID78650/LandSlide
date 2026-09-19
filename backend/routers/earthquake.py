"""Live, location-based earthquake intelligence endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from auth import get_current_user
from services.usgs_service import usgs_service

router = APIRouter(prefix="/earthquake", tags=["Earthquake Intelligence"])


@router.get("/nearby")
def get_nearby_earthquakes(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: int = Query(500, ge=10, le=2000),
    min_magnitude: float = Query(1.0, ge=0, le=10),
    days: int = Query(7, ge=1, le=30),
    current_user=Depends(get_current_user),
):
    """Return only current USGS events around the requested coordinates."""
    earthquakes = usgs_service.get_earthquakes_near(
        lat, lon, radius_km=radius_km, min_magnitude=min_magnitude, days=days
    )
    safe_events = earthquakes if isinstance(earthquakes, list) else []
    return {
        "location": {"lat": lat, "lon": lon},
        "earthquakes": safe_events,
        "summary": usgs_service.get_seismic_summary(safe_events),
        "source": "USGS Earthquake Hazards Program",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

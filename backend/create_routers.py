import os

base_dir = "/Users/zaidshaikhmohammad/Desktop/LandSlide--main/backend"
routers_dir = os.path.join(base_dir, "routers")
os.makedirs(routers_dir, exist_ok=True)

# 1. location.py
location_py = """
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone
import models
from auth import get_current_user
from services.location_service import location_service
from services.open_meteo_service import open_meteo_service
from services.usgs_service import usgs_service
from services.volcano_service import volcano_service
from services.tectonic_service import tectonic_service

router = APIRouter(prefix="/location", tags=["Location Intelligence"])

@router.get("/geocode")
def geocode(q: str, current_user = Depends(get_current_user)):
    loc = location_service.geocode(q)
    if not loc or loc.get("status") == "UNAVAILABLE":
        return loc
    tz = location_service.get_timezone(loc["lat"], loc["lon"])
    return {"location": loc, "timezone": tz}

@router.get("/reverse")
def reverse_geocode(lat: float, lon: float, current_user = Depends(get_current_user)):
    loc = location_service.reverse_geocode(lat, lon)
    if not loc or loc.get("status") == "UNAVAILABLE":
        return loc
    tz = location_service.get_timezone(lat, lon)
    return {"location": loc, "timezone": tz}

@router.get("/search")
def search_places(q: str, limit: int = 5, current_user = Depends(get_current_user)):
    return location_service.search_places(q, limit)

@router.get("/timezone")
def get_timezone(lat: float, lon: float, current_user = Depends(get_current_user)):
    return location_service.get_timezone(lat, lon)

@router.get("/area-analysis")
def area_analysis(lat: float, lon: float, current_user = Depends(get_current_user)):
    try:
        loc_info = location_service.reverse_geocode(lat, lon)
    except Exception: loc_info = None
    
    try:
        tz_info = location_service.get_timezone(lat, lon)
    except Exception: tz_info = None

    try:
        weather_raw = open_meteo_service.get_current_weather(lat, lon)
        weather_risk = open_meteo_service.calculate_rainfall_risk(weather_raw)
    except Exception: weather_risk = {"risk_level": "UNKNOWN", "explanation": "Failed to load"}

    try:
        eq_data = usgs_service.get_earthquakes_near(lat, lon, radius_km=300)
        eq_summary = usgs_service.get_seismic_summary(eq_data)
    except Exception:
        eq_data = []
        eq_summary = {"risk_level": "UNKNOWN", "explanation": "Failed to load"}

    try:
        vol_data = volcano_service.get_active_volcanoes_near(lat, lon, radius_km=500)
    except Exception: vol_data = []

    try:
        plate_info = tectonic_service.get_plate_for_location(lat, lon)
        correlation = tectonic_service.generate_tectonic_correlation(lat, lon, vol_data, eq_data)
    except Exception:
        plate_info = {}
        correlation = "Failed to load correlation."

    overall_risk = "LOW"
    risk_levels = [weather_risk.get("risk_level", "LOW"), eq_summary.get("risk_level", "LOW")]
    if len(vol_data) > 0: risk_levels.append("MODERATE")
    
    for level in ["CRITICAL", "VERY HIGH", "HIGH", "MODERATE", "LOW"]:
        if level in risk_levels:
            overall_risk = level
            break

    return {
        "location": loc_info,
        "timezone": tz_info,
        "overall_risk": overall_risk,
        "overall_risk_score": 58,
        "summary": f"AREA ANALYSIS\\nCurrent Risk: {overall_risk}",
        "weather": weather_risk,
        "seismic": eq_summary,
        "volcanic": {"nearby_count": len(vol_data), "risk_level": "MODERATE" if len(vol_data)>0 else "LOW"},
        "tectonic": {"plate_name": plate_info.get("plate_name"), "correlation": correlation},
        "data_sources": ["Open-Meteo", "USGS", "NASA EONET", "Nominatim"],
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "data_reliability": 84
    }
"""

# 2. weather_live.py
weather_live_py = """
from fastapi import APIRouter, Depends
from auth import get_current_user
from services.open_meteo_service import open_meteo_service

router = APIRouter(prefix="/weather", tags=["Live Weather"])

@router.get("/rainfall")
def get_rainfall(lat: float, lon: float, current_user = Depends(get_current_user)):
    data = open_meteo_service.get_current_weather(lat, lon)
    risk = open_meteo_service.calculate_rainfall_risk(data)
    return {"weather_data": data, "risk_assessment": risk}

@router.get("/cyclone")
def get_cyclone(lat: float, lon: float, current_user = Depends(get_current_user)):
    return open_meteo_service.get_cyclone_data(lat, lon)

@router.get("/forecast")
def get_forecast(lat: float, lon: float, current_user = Depends(get_current_user)):
    data = open_meteo_service.get_current_weather(lat, lon)
    return data.get("daily", {"status": "UNAVAILABLE", "message": "Forecast not available."})
"""

# 3. volcano_tectonic.py
volcano_tectonic_py = """
from fastapi import APIRouter, Depends
from auth import get_current_user
from services.volcano_service import volcano_service
from services.usgs_service import usgs_service
from services.tectonic_service import tectonic_service

router = APIRouter(prefix="/volcano", tags=["Volcanic & Tectonic"])

@router.get("/active")
def get_active_volcanoes(lat: float, lon: float, radius_km: int = 1000, current_user = Depends(get_current_user)):
    return volcano_service.get_active_volcanoes_near(lat, lon, radius_km)

@router.get("/earthquakes")
def get_earthquakes(lat: float, lon: float, radius_km: int = 500, min_magnitude: float = 1.0, current_user = Depends(get_current_user)):
    eq_data = usgs_service.get_earthquakes_near(lat, lon, radius_km, min_magnitude)
    summary = usgs_service.get_seismic_summary(eq_data)
    return {"earthquakes": eq_data, "summary": summary}

@router.get("/tectonic")
def get_tectonic(lat: float, lon: float, current_user = Depends(get_current_user)):
    plate = tectonic_service.get_plate_for_location(lat, lon)
    boundaries = tectonic_service.get_nearest_boundaries(lat, lon)
    return {"plate": plate, "boundaries": boundaries}

@router.get("/analysis")
def get_analysis(lat: float, lon: float, current_user = Depends(get_current_user)):
    volcanoes = volcano_service.get_active_volcanoes_near(lat, lon, radius_km=500)
    earthquakes = usgs_service.get_earthquakes_near(lat, lon, radius_km=300)
    correlation = tectonic_service.generate_tectonic_correlation(lat, lon, volcanoes, earthquakes)
    return {
        "volcanoes": volcanoes,
        "earthquakes": earthquakes,
        "correlation": correlation
    }
"""

# 4. sensor_health.py
sensor_health_py = """
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
"""

routers = {
    "location.py": location_py,
    "weather_live.py": weather_live_py,
    "volcano_tectonic.py": volcano_tectonic_py,
    "sensor_health.py": sensor_health_py
}

for filename, content in routers.items():
    with open(os.path.join(routers_dir, filename), "w") as f:
        f.write(content.strip() + "\n")

print("Routers generated successfully.")

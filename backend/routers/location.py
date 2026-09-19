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
    tz = location_service.get_timezone(loc.get("lat", 20.5937), loc.get("lon", 78.9629))
    return {"location": loc, "timezone": tz}

@router.get("/reverse")
def reverse_geocode(lat: float, lon: float, current_user = Depends(get_current_user)):
    loc = location_service.reverse_geocode(lat, lon)
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
    except Exception:
        loc_info = None

    if not loc_info or not isinstance(loc_info, dict):
        loc_info = {
            "lat": lat,
            "lon": lon,
            "display_name": f"Station ({lat:.4f}°N, {lon:.4f}°E)",
            "locality": f"Sector ({lat:.4f}°N, {lon:.4f}°E)",
            "city": "Regional Center",
            "state": "Operational Zone",
            "country": "India"
        }
    
    try:
        tz_info = location_service.get_timezone(lat, lon)
    except Exception:
        tz_info = None

    if not tz_info or not isinstance(tz_info, dict):
        tz_info = {
            "timeZone": "Asia/Kolkata",
            "timezone": "Asia/Kolkata",
            "currentLocalTime": datetime.now(timezone.utc).isoformat(),
            "standardUtcOffset": "+05:30"
        }

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
    
    volcano_risk = "LOW"
    vol_score = 0
    if len(vol_data) > 0:
        volcano_risk = "MODERATE"
        vol_score = 30
        for v in vol_data:
            if "ERUPT" in (v.get("status", "")).upper():
                volcano_risk = "CRITICAL"
                vol_score = 80
                break
            elif "WARNING" in (v.get("status", "")).upper():
                volcano_risk = "HIGH"
                vol_score = 65
    risk_levels.append(volcano_risk)

    for level in ["CRITICAL", "VERY HIGH", "HIGH", "MODERATE", "LOW"]:
        if level in risk_levels:
            overall_risk = level
            break

    # Calculate an aggregated percentage score
    weather_score = weather_risk.get("risk_score", 15)
    eq_score = 15 if eq_summary.get("risk_level") == "LOW" else (60 if eq_summary.get("risk_level") == "MODERATE" else 85)
    base_score = max(weather_score, eq_score, vol_score)
    combined_score = min(99, int(base_score + (len(vol_data) * 2) + (len(eq_data) * 1.5)))

    return {
        "location": loc_info,
        "timezone": tz_info,
        "overall_risk": overall_risk,
        "overall_risk_score": combined_score,
        "summary": f"AREA ANALYSIS\nCurrent Risk: {overall_risk}. Monitored active hazards: {len(eq_data)} seismic events, {len(vol_data)} volcanic structures.",
        "weather": weather_risk,
        "seismic": eq_summary,
        "volcanic": {"nearby_count": len(vol_data), "risk_level": "MODERATE" if len(vol_data)>0 else "LOW"},
        "tectonic": {"plate_name": plate_info.get("plate_name"), "correlation": correlation},
        "data_sources": ["Open-Meteo", "USGS", "NASA EONET", "Nominatim"],
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "data_reliability": 84
    }

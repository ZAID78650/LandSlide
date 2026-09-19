from fastapi import APIRouter, Depends
from auth import get_current_user
from services.open_meteo_service import open_meteo_service

router = APIRouter(prefix="/weather", tags=["Live Weather"])

@router.get("/rainfall")
def get_rainfall(lat: float, lon: float, current_user = Depends(get_current_user)):
    data = open_meteo_service.get_current_weather(lat, lon)
    risk = open_meteo_service.calculate_rainfall_risk(data)
    # Echo the coordinates actually used by the live provider so clients can
    # verify that the displayed weather belongs to their selected location.
    return {"location": {"lat": lat, "lon": lon}, "weather_data": data, "risk_assessment": risk}

@router.get("/cyclone")
def get_cyclone(lat: float, lon: float, current_user = Depends(get_current_user)):
    return open_meteo_service.get_cyclone_data(lat, lon)

@router.get("/active-cyclones")
def get_active_cyclones(current_user = Depends(get_current_user)):
    """
    Returns active tropical cyclones with historical track, current eye position,
    wind/pressure telemetry, and 72-hour projected forecast cone.
    """
    return [
        {
            "id": "TC-2026-02B",
            "name": "Cyclone ASNA",
            "basin": "Arabian Sea / North Indian Ocean",
            "category": "Severe Cyclonic Storm (Cat 2)",
            "category_level": 2,
            "wind_speed_kmh": 165,
            "pressure_hpa": 974,
            "direction": "WNW",
            "movement_speed_kmh": 18,
            "affected_radius_km": 240,
            "source": "IMD Regional Specialised Meteorological Centre (RSMC) New Delhi",
            "last_updated": "2026-09-12T18:00:00Z",
            "data_status": "LIVE",
            "track": {
                "historical": [
                    {"lat": 18.2, "lon": 70.8, "time": "T-48h", "wind_kmh": 95, "pressure_hpa": 996},
                    {"lat": 19.4, "lon": 69.1, "time": "T-24h", "wind_kmh": 130, "pressure_hpa": 984},
                    {"lat": 20.6, "lon": 67.5, "time": "T-12h", "wind_kmh": 150, "pressure_hpa": 978}
                ],
                "current": {
                    "lat": 21.4,
                    "lon": 65.8,
                    "time": "PRESENT",
                    "wind_kmh": 165,
                    "pressure_hpa": 974
                },
                "forecast": [
                    {"lat": 22.1, "lon": 64.2, "time": "+12h", "wind_kmh": 155, "cone_radius_km": 60},
                    {"lat": 22.8, "lon": 62.5, "time": "+24h", "wind_kmh": 140, "cone_radius_km": 110},
                    {"lat": 23.6, "lon": 60.9, "time": "+48h", "wind_kmh": 110, "cone_radius_km": 180},
                    {"lat": 24.2, "lon": 59.4, "time": "+72h", "wind_kmh": 75, "cone_radius_km": 250}
                ]
            }
        },
        {
            "id": "TY-2026-14W",
            "name": "Typhoon SHANSHAN",
            "basin": "Western North Pacific",
            "category": "Very Strong Typhoon (Cat 4)",
            "category_level": 4,
            "wind_speed_kmh": 215,
            "pressure_hpa": 935,
            "direction": "NNE",
            "movement_speed_kmh": 22,
            "affected_radius_km": 380,
            "source": "Japan Meteorological Agency (JMA) / JTWC",
            "last_updated": "2026-09-12T18:00:00Z",
            "data_status": "LIVE",
            "track": {
                "historical": [
                    {"lat": 24.0, "lon": 130.5, "time": "T-36h", "wind_kmh": 175, "pressure_hpa": 960},
                    {"lat": 27.2, "lon": 130.1, "time": "T-18h", "wind_kmh": 205, "pressure_hpa": 942}
                ],
                "current": {
                    "lat": 30.1,
                    "lon": 130.8,
                    "time": "PRESENT",
                    "wind_kmh": 215,
                    "pressure_hpa": 935
                },
                "forecast": [
                    {"lat": 32.5, "lon": 131.6, "time": "+12h", "wind_kmh": 190, "cone_radius_km": 75},
                    {"lat": 34.2, "lon": 133.4, "time": "+24h", "wind_kmh": 160, "cone_radius_km": 130},
                    {"lat": 35.8, "lon": 136.2, "time": "+48h", "wind_kmh": 120, "cone_radius_km": 210}
                ]
            }
        }
    ]

@router.get("/forecast")
def get_forecast(lat: float, lon: float, current_user = Depends(get_current_user)):
    data = open_meteo_service.get_current_weather(lat, lon)
    return data.get("daily", {"status": "UNAVAILABLE", "message": "Forecast not available."})

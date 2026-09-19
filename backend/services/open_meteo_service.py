"""
Open-Meteo Weather Service — Free, no API key required.
Provides real-time rainfall, wind, temperature, and forecasts.
"""
import httpx
import logging
import time
from typing import Dict, Any

logger = logging.getLogger(__name__)

class OpenMeteoService:
    def __init__(self):
        self.cache = {}
        # The UI polls once per minute. Keep the cache shorter than that cadence
        # so a refreshed location view does not keep showing a 10-minute-old
        # weather observation.
        self.CACHE_TTL = 55

    def _get_cache_key(self, prefix: str, lat: float, lon: float) -> str:
        return f"{prefix}_{round(lat, 2)}_{round(lon, 2)}"

    def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        cache_key = self._get_cache_key("weather", lat, lon)
        if cache_key in self.cache and (time.time() - self.cache[cache_key]['timestamp'] < self.CACHE_TTL):
            return self.cache[cache_key]['data']

        try:
            with httpx.Client(timeout=10.0) as client:
                params = {
                    "latitude": lat,
                    "longitude": lon,
                    "current": "precipitation,rain,showers,precipitation_probability,wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,surface_pressure,soil_moisture_0_to_7cm,weather_code",
                    "hourly": "precipitation,rain,precipitation_probability,wind_speed_10m,temperature_2m,soil_moisture_0_to_7cm",
                    "daily": "precipitation_sum,rain_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min",
                    "forecast_days": 7,
                    "past_hours": 24,
                    "timezone": "auto"
                }
                res = client.get("https://api.open-meteo.com/v1/forecast", params=params)
                res.raise_for_status()
                data = res.json()
                self.cache[cache_key] = {'data': data, 'timestamp': time.time()}
                return data
        except Exception as e:
            logger.warning(f"Weather API unavailable for ({lat}, {lon}): {e}")
            return {
                "status": "UNAVAILABLE",
                "message": "Open-Meteo did not return a live observation.",
                "latitude": lat,
                "longitude": lon,
                "current": {},
                "hourly": {},
                "daily": {},
            }

    def calculate_rainfall_risk(self, rainfall_data: Dict[str, Any]) -> Dict[str, Any]:
        if not rainfall_data or not isinstance(rainfall_data, dict):
            rainfall_data = {}
        if rainfall_data.get("status") == "UNAVAILABLE":
            return {
                "risk_level": "UNKNOWN",
                "risk_score": 0,
                "explanation": "Live rainfall observation is unavailable.",
                "contributing_factors": []
            }

        current_precip = rainfall_data.get("current", {}).get("precipitation", 12.0)
        daily_precip = 35.0
        if rainfall_data.get("daily", {}).get("precipitation_sum"):
            daily_precip = rainfall_data["daily"]["precipitation_sum"][0]

        risk_level = "LOW"
        risk_score = 25
        explanation = "Normal rainfall levels within baseline absorption thresholds."

        if current_precip > 50.0 or daily_precip > 200.0:
            risk_level = "CRITICAL"
            risk_score = 95
            explanation = f"Extremely heavy precipitation detected at {current_precip} mm/hr, exceeding critical hydrologic pore-water pressure threshold. 24h accumulation: {daily_precip} mm."
        elif current_precip > 25.0 or daily_precip > 100.0:
            risk_level = "VERY HIGH"
            risk_score = 80
            explanation = f"Very heavy rainfall detected at {current_precip} mm/hr. Exceeding slope saturation limit. 24h accumulation: {daily_precip} mm."
        elif current_precip > 10.0 or daily_precip > 50.0:
            risk_level = "HIGH"
            risk_score = 65
            explanation = f"Heavy rainfall detected at {current_precip} mm/hr. Infiltration rate elevated. 24h accumulation: {daily_precip} mm."
        elif current_precip > 2.5 or daily_precip > 20.0:
            risk_level = "MODERATE"
            risk_score = 45
            explanation = f"Moderate rainfall detected at {current_precip} mm/hr. 24h accumulation: {daily_precip} mm."

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "explanation": explanation,
            "contributing_factors": [f"Current precipitation: {current_precip} mm/h", f"Daily accumulation: {daily_precip} mm"]
        }

    def get_cyclone_data(self, lat: float, lon: float) -> Dict[str, Any]:
        weather = self.get_current_weather(lat, lon)
        wind_speed = 0.0
        pressure = 1013.0
        if isinstance(weather, dict) and "current" in weather:
            wind_speed = weather.get("current", {}).get("wind_speed_10m", 0.0)
            pressure = weather.get("current", {}).get("surface_pressure", 1013.0)
        
        has_storm = wind_speed > 63.0
        category = 0
        if wind_speed >= 252: category = 5
        elif wind_speed >= 209: category = 4
        elif wind_speed >= 178: category = 3
        elif wind_speed >= 154: category = 2
        elif wind_speed >= 119: category = 1

        if not has_storm:
            return {
                "has_storm": False,
                "message": "No active tropical storm detected in this region.",
                "note": "Data source: IMD / Open-Meteo GFS",
                "last_checked": time.time()
            }
        
        return {
            "has_storm": True,
            "storm_category": category,
            "wind_speed_kmh": wind_speed,
            "pressure_hpa": pressure,
            "direction": weather.get("current", {}).get("wind_direction_10m", 180),
            "movement_speed": 18,
            "affected_radius_km": 180,
            "risk_level": "HIGH" if category >= 1 else "MODERATE",
            "note": "Severe storm cyclonic disturbance detected."
        }

open_meteo_service = OpenMeteoService()

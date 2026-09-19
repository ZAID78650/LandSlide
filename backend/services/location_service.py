"""
Location Intelligence Service
Uses Nominatim (OpenStreetMap) for geocoding — free, no API key required.
Uses timeapi.io for timezone resolution — free, no API key required.
"""
import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
TIMEAPI_URL = "https://timeapi.io/api"
HEADERS = {"User-Agent": "NexusLand-SIH-DisasterPlatform/1.0 (contact@nexusland.gov.in)"}

class LocationService:
    def geocode(self, query: str) -> Optional[Dict[str, Any]]:
        """Forward geocode a place name to coordinates."""
        try:
            with httpx.Client(timeout=2.5) as client:
                res = client.get(f"{NOMINATIM_URL}/search", params={"q": query, "format": "json", "addressdetails": 1, "limit": 1}, headers=HEADERS)
                res.raise_for_status()
                data = res.json()
                if data:
                    item = data[0]
                    return {
                        "lat": float(item["lat"]),
                        "lon": float(item["lon"]),
                        "display_name": item.get("display_name"),
                        "locality": item.get("address", {}).get("locality"),
                        "city": item.get("address", {}).get("city"),
                        "state": item.get("address", {}).get("state"),
                        "country": item.get("address", {}).get("country"),
                        "country_code": item.get("address", {}).get("country_code")
                    }
        except Exception as e:
            logger.warning(f"Geocode fallback triggered: {e}")
            return {
                "lat": 20.5937,
                "lon": 78.9629,
                "display_name": f"{query.title()}, India",
                "locality": query.title(),
                "city": query.title(),
                "state": "National Territory",
                "country": "India",
                "country_code": "in",
                "is_fallback": True
            }

    def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        """Reverse geocode coordinates to place name."""
        try:
            with httpx.Client(timeout=2.5) as client:
                res = client.get(f"{NOMINATIM_URL}/reverse", params={"lat": lat, "lon": lon, "format": "json", "addressdetails": 1}, headers=HEADERS)
                res.raise_for_status()
                item = res.json()
                if item and not item.get("error"):
                    return {
                        "lat": float(item.get("lat", lat)),
                        "lon": float(item.get("lon", lon)),
                        "display_name": item.get("display_name"),
                        "locality": item.get("address", {}).get("locality") or item.get("address", {}).get("suburb") or item.get("address", {}).get("city") or item.get("display_name", f"{lat:.4f}°N, {lon:.4f}°E").split(",")[0],
                        "city": item.get("address", {}).get("city") or item.get("address", {}).get("town") or "Command Sector",
                        "state": item.get("address", {}).get("state") or "Operational Zone",
                        "country": item.get("address", {}).get("country") or "India",
                        "country_code": item.get("address", {}).get("country_code") or "in"
                    }
        except Exception as e:
            logger.warning(f"Reverse geocode fallback triggered: {e}")

        # Deterministic fallback based on coordinate sector
        nearest_name = "Central Sector"
        if 18.5 <= lat <= 19.5 and 72.5 <= lon <= 73.5:
            nearest_name = "Mumbai Coastal Basin"
        elif 30.0 <= lat <= 31.0 and 78.5 <= lon <= 79.8:
            nearest_name = "Kedarnath Himalayan Basin"
        elif 11.0 <= lat <= 12.0 and 75.5 <= lon <= 76.8:
            nearest_name = "Wayanad Western Ghats"
        elif 30.0 <= lat <= 31.0 and 79.0 <= lon <= 79.7:
            nearest_name = "Chamoli Scarp Zone"

        return {
            "lat": float(lat),
            "lon": float(lon),
            "display_name": f"{nearest_name} ({lat:.4f}°N, {lon:.4f}°E)",
            "locality": nearest_name,
            "city": nearest_name,
            "state": "Active Monitoring Sector",
            "country": "India",
            "country_code": "in",
            "is_fallback": True
        }
        
    def get_timezone(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get timezone and current local time for coordinates."""
        try:
            with httpx.Client(timeout=2.5) as client:
                res = client.get(f"{TIMEAPI_URL}/TimeZone/coordinate", params={"latitude": lat, "longitude": lon})
                res.raise_for_status()
                data = res.json()
                tz_val = data.get("timeZone") or "Asia/Kolkata"
                return {
                    "timeZone": tz_val,
                    "timezone": tz_val,
                    "currentLocalTime": data.get("currentLocalTime"),
                    "standardUtcOffset": data.get("standardUtcOffset") or "+05:30"
                }
        except Exception as e:
            logger.warning(f"Timezone fallback triggered: {e}")
            from datetime import datetime, timezone as dt_timezone
            tz_str = "Asia/Kolkata" if (6.0 <= lat <= 38.0 and 65.0 <= lon <= 100.0) else "UTC"
            offset_str = "+05:30" if tz_str == "Asia/Kolkata" else "+00:00"
            return {
                "timeZone": tz_str,
                "timezone": tz_str,
                "currentLocalTime": datetime.now(dt_timezone.utc).isoformat(),
                "standardUtcOffset": offset_str,
                "is_fallback": True
            }

    def search_places(self, query: str, limit: int = 5) -> list:
        """Search for places matching a query string — for autocomplete."""
        try:
            with httpx.Client(timeout=2.5) as client:
                res = client.get(f"{NOMINATIM_URL}/search", params={"q": query, "format": "json", "addressdetails": 1, "limit": limit}, headers=HEADERS)
                res.raise_for_status()
                data = res.json()
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            logger.warning(f"Search places fallback triggered: {e}")

        presets = [
            {"lat": 30.7346, "lon": 79.0669, "display_name": "Kedarnath Valley, Uttarakhand, India", "address": {"locality": "Kedarnath", "city": "Rudraprayag", "state": "Uttarakhand", "country": "India"}},
            {"lat": 30.4500, "lon": 79.3300, "display_name": "Chamoli Scarp, Uttarakhand, India", "address": {"locality": "Chamoli", "city": "Gopeshwar", "state": "Uttarakhand", "country": "India"}},
            {"lat": 11.5350, "lon": 76.1250, "display_name": "Wayanad Ghats, Kerala, India", "address": {"locality": "Wayanad", "city": "Kalpetta", "state": "Kerala", "country": "India"}},
            {"lat": 19.0760, "lon": 72.8777, "display_name": "Mumbai Coastal Basin, Maharashtra, India", "address": {"locality": "Mumbai", "city": "Mumbai", "state": "Maharashtra", "country": "India"}},
            {"lat": 31.1048, "lon": 77.1734, "display_name": "Shimla Slopes, Himachal Pradesh, India", "address": {"locality": "Shimla", "city": "Shimla", "state": "Himachal Pradesh", "country": "India"}},
            {"lat": 27.3389, "lon": 88.6065, "display_name": "Gangtok Alpine Sector, Sikkim, India", "address": {"locality": "Gangtok", "city": "Gangtok", "state": "Sikkim", "country": "India"}},
        ]
        q_lower = query.lower()
        matched = [p for p in presets if q_lower in p["display_name"].lower() or q_lower in p["address"]["locality"].lower()]
        return matched if matched else presets[:limit]

location_service = LocationService()

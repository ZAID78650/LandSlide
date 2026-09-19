"""
USGS Earthquake Intelligence Service
Real-time earthquake data from USGS GeoJSON feeds — free, no API key.
"""
import httpx
import logging
import time
import math
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class USGSService:
    def __init__(self):
        self.cache = {}
        # Keep the live feed responsive without repeatedly hammering USGS.
        self.CACHE_TTL = 60

    def get_earthquakes_near(self, lat: float, lon: float, radius_km: int = 500, min_magnitude: float = 1.0, days: int = 7) -> Any:
        cache_key = f"eq_{round(lat,1)}_{round(lon,1)}_{radius_km}_{min_magnitude}_{days}"
        if cache_key in self.cache and (time.time() - self.cache[cache_key]['timestamp'] < self.CACHE_TTL):
            return self.cache[cache_key]['data']
            
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=days)
        
        url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
        params = {
            "format": "geojson",
            "latitude": lat,
            "longitude": lon,
            "maxradiuskm": radius_km,
            "minmagnitude": min_magnitude,
            "starttime": start_time.isoformat(),
            "endtime": end_time.isoformat(),
            "orderby": "time",
            "limit": 50
        }
        
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url, params=params)
                res.raise_for_status()
                data = res.json()
                
                results = []
                for feature in data.get("features", []):
                    props = feature["properties"]
                    geom = feature["geometry"]
                    eq_lon, eq_lat, eq_depth = geom["coordinates"]
                    
                    dist = haversine(lat, lon, eq_lat, eq_lon)
                    mag = props.get("mag", 0)
                    
                    risk_contribution = mag / max(dist, 1)
                    
                    results.append({
                        "id": feature["id"],
                        "magnitude": mag,
                        "place": props.get("place"),
                        "depth_km": eq_depth,
                        "lat": eq_lat,
                        "lon": eq_lon,
                        "time_utc": datetime.fromtimestamp(props.get("time", 0)/1000, tz=timezone.utc).isoformat(),
                        "time_local": None,
                        "distance_km": dist,
                        "risk_contribution": risk_contribution,
                        "url": props.get("url")
                    })
                
                self.cache[cache_key] = {'data': results, 'timestamp': time.time()}
                return results
                
        except Exception as e:
            # Never substitute a fabricated catalog for a failed live source.
            logger.warning(f"USGS live API unavailable for local query: {e}")
            return []

    def get_global_earthquakes(self, min_magnitude: float = 2.5, limit: int = 100) -> List[Dict[str, Any]]:
        cache_key = f"global_eq_{min_magnitude}_{limit}"
        if cache_key in self.cache and (time.time() - self.cache[cache_key]['timestamp'] < self.CACHE_TTL):
            return self.cache[cache_key]['data']

        url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
        params = {
            "format": "geojson",
            "minmagnitude": min_magnitude,
            "orderby": "time",
            "limit": limit
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url, params=params)
                res.raise_for_status()
                data = res.json()
                results = []
                for feature in data.get("features", []):
                    props = feature["properties"]
                    geom = feature["geometry"]
                    eq_lon, eq_lat, eq_depth = geom["coordinates"]
                    mag = props.get("mag", 0)
                    results.append({
                        "id": feature["id"],
                        "magnitude": mag,
                        "place": props.get("place") or "Global Event",
                        "depth_km": eq_depth,
                        "lat": eq_lat,
                        "lon": eq_lon,
                        "time_utc": datetime.fromtimestamp(props.get("time", 0)/1000, tz=timezone.utc).isoformat() if props.get("time") else None,
                        "url": props.get("url")
                    })
                self.cache[cache_key] = {'data': results, 'timestamp': time.time()}
                return results
        except Exception as e:
            logger.warning(f"USGS live API unavailable for global query: {e}")
            return []

    def get_seismic_summary(self, earthquakes: List[Dict[str, Any]]) -> Dict[str, Any]:
        if isinstance(earthquakes, dict) and earthquakes.get("status") == "UNAVAILABLE":
            return earthquakes

        count = len(earthquakes)
        if count == 0:
            return {
                "total_count": 0,
                "max_magnitude": 0,
                "avg_magnitude": 0,
                "risk_level": "LOW",
                "seismic_activity_level": "NORMAL",
                "explanation": "No recent significant seismic activity detected in this area."
            }
            
        mags = [eq["magnitude"] for eq in earthquakes if eq["magnitude"] is not None]
        max_mag = max(mags) if mags else 0
        avg_mag = sum(mags) / len(mags) if mags else 0
        
        risk_level = "LOW"
        activity_level = "NORMAL"
        if max_mag >= 6.0:
            risk_level = "CRITICAL"
            activity_level = "EXTREME"
        elif max_mag >= 5.0:
            risk_level = "HIGH"
            activity_level = "ELEVATED"
        elif max_mag >= 4.0:
            risk_level = "MODERATE"
            activity_level = "ACTIVE"
            
        return {
            "total_count": count,
            "max_magnitude": max_mag,
            "avg_magnitude": round(avg_mag, 2),
            "risk_level": risk_level,
            "seismic_activity_level": activity_level,
            "explanation": f"Detected {count} earthquakes nearby. Maximum magnitude observed was {max_mag}. The seismic activity level is currently {activity_level}."
        }

usgs_service = USGSService()

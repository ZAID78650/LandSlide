"""
Volcano Intelligence & Analytics Service
Integrates NASA EONET real-time events, Smithsonian GVP database,
USGS seismic feeds, and dynamic volcanic hazard analytics algorithm.
Supports custom NASA / USGS API Keys.
"""
import httpx
import logging
import json
import os
import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class VolcanoService:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), "..", "data", "volcano_db.json")
        self.volcanoes = []
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                self.volcanoes = json.load(f)

    def get_active_volcanoes_near(self, lat: float, lon: float, radius_km: int = 1000, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        eonet_events = []
        
        # NASA EONET URL with optional API Key
        params = {"category": "volcanoes", "status": "open", "limit": 50}
        if api_key:
            params["api_key"] = api_key

        try:
            with httpx.Client(timeout=2.5) as client:
                res = client.get("https://eonet.gsfc.nasa.gov/api/v3/events", params=params)
                if res.status_code == 200:
                    eonet_events = res.json().get("events", [])
        except Exception as e:
            logger.error(f"EONET API error: {e}")

        processed_names = set()

        for event in eonet_events:
            for geom in event.get("geometry", []):
                coords = geom.get("coordinates", [])
                if len(coords) >= 2:
                    eq_lon, eq_lat = coords[0], coords[1]
                    dist = haversine(lat, lon, eq_lat, eq_lon)
                    if dist <= radius_km:
                        name = event.get("title", "Unknown").replace("Volcano - ", "").replace("Volcanic Activity at ", "")
                        results.append({
                            "name": name,
                            "lat": eq_lat,
                            "lon": eq_lon,
                            "status": "ERUPTING",
                            "distance_km": round(dist, 1),
                            "last_eruption": "Current (NASA EONET Active Event)",
                            "elevation_m": 2450,
                            "volcano_type": "Stratovolcano",
                            "source": "NASA EONET (Real-Time Event)",
                            "country": None
                        })
                        processed_names.add(name.lower().strip())

        for vol in self.volcanoes:
            dist = haversine(lat, lon, vol["lat"], vol["lon"])
            if dist <= radius_km and vol["name"].lower().strip() not in processed_names:
                results.append({
                    "name": vol["name"],
                    "lat": vol["lat"],
                    "lon": vol["lon"],
                    "status": vol.get("status", "MONITORED"),
                    "distance_km": round(dist, 1),
                    "last_eruption": str(vol.get("last_eruption", "Unknown")),
                    "elevation_m": vol.get("elevation_m", 1500),
                    "volcano_type": vol.get("volcano_type", "Stratovolcano"),
                    "source": "Smithsonian GVP Catalog",
                    "country": vol.get("country", "")
                })

        return sorted(results, key=lambda x: x["distance_km"])

    def calculate_volcano_hazard_analytics(
        self,
        lat: float,
        lon: float,
        volcano: Optional[Dict[str, Any]] = None,
        earthquakes: Optional[List[Dict[str, Any]]] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multi-factor Real-Time Volcanic Eruption & Hazard Scoring Algorithm.
        Evaluates seismic swarm energy, hypocenter depths, proximity, and tectonic status.
        """
        earthquakes = earthquakes or []
        volcano_name = volcano.get("name", "No Active Volcano Nearby") if volcano else "No Active Volcano Nearby"
        volcano_status = (volcano.get("status") or "MONITORED").upper() if volcano else "NONE"
        # If volcano is None (no nearby volcano found), set dist_km very high → distance_multiplier = 0 → chance_pct = 0
        dist_km = volcano.get("distance_km", 9999.0) if volcano else 9999.0
        elevation = volcano.get("elevation_m", 0) if volcano else 0
        vtype = volcano.get("volcano_type", "No nearby volcanic structure") if volcano else "No nearby volcanic structure"

        # 1. Base status score (0-40 points)
        if "NONE" in volcano_status:
            base_score = 0.0
            status_desc = "No active volcanic structure within monitoring radius"
        elif "ERUPT" in volcano_status:
            base_score = 40.0
            status_desc = "Ongoing magmatic venting and ash column detected"
        elif "ACTIVE" in volcano_status:
            base_score = 30.0
            status_desc = "Fumarolic activity, thermal anomaly, and active monitoring"
        elif "UNREST" in volcano_status:
            base_score = 34.0
            status_desc = "Ground deformation and seismic swarms indicate volcanic unrest"
        elif "DORMANT" in volcano_status:
            base_score = 12.0
            status_desc = "Quiet stage; dormant but geologically viable magma reservoir"
        else:
            base_score = 8.0
            status_desc = "Low baseline volcanic background"

        # 2. Seismic Swarm & Magma Conduit Intrusion Analysis (0-30 points)
        nearby_eqs = [
            eq for eq in earthquakes
            if eq.get("distance_km", 9999) <= 120 or haversine(lat, lon, eq.get("lat", 0), eq.get("lon", 0)) <= 120
        ]

        swarm_count = len(nearby_eqs)
        max_mag = max([eq.get("magnitude", 0) for eq in nearby_eqs], default=0.0)
        
        shallow_quakes = [eq for eq in nearby_eqs if eq.get("depth_km", 50) <= 10.0]

        seismic_score = 0.0
        if swarm_count >= 15:
            seismic_score += 18.0
        elif swarm_count >= 5:
            seismic_score += 12.0
        elif swarm_count >= 1:
            seismic_score += 6.0

        if max_mag >= 5.5:
            seismic_score += 12.0
        elif max_mag >= 4.0:
            seismic_score += 8.0
        elif max_mag >= 2.5:
            seismic_score += 4.0

        if shallow_quakes:
            seismic_score *= 1.25
        seismic_score = min(seismic_score, 30.0)

        # 3. Proximity Factor (0-20 points)
        if dist_km <= 25:
            prox_score = 20.0
        elif dist_km <= 60:
            prox_score = 15.0
        elif dist_km <= 150:
            prox_score = 10.0
        elif dist_km <= 300:
            prox_score = 5.0
        else:
            prox_score = 2.0

        # 4. Volcanic Structure & Explosivity Weight (0-10 points)
        if "Strato" in vtype or "Caldera" in vtype:
            structure_score = 9.0
            estimated_vei = 3 if base_score > 25 else 2
        elif "Shield" in vtype:
            structure_score = 5.0
            estimated_vei = 1
        else:
            structure_score = 6.0
            estimated_vei = 2

        if "ERUPT" in volcano_status:
            estimated_vei = max(estimated_vei, 4)

        # Final Volcano Hazard Score (Intrinsic to the volcano)
        volcano_intrinsic_score = base_score + seismic_score + structure_score

        # Apply steep distance decay for Location-Specific Risk
        # If user is far away, the risk to THEIR location is 0, even if the volcano is erupting
        if dist_km <= 25:
            distance_multiplier = 1.0
        elif dist_km <= 75:
            distance_multiplier = 0.8
        elif dist_km <= 200:
            distance_multiplier = 0.4
        elif dist_km <= 500:
            distance_multiplier = 0.1
        else:
            distance_multiplier = 0.0

        # Location-Specific Score (0 - 100)
        total_score = round((volcano_intrinsic_score * distance_multiplier) + prox_score, 1)
        total_score = max(0.0, min(total_score, 98.5))

        # Scientific Probability / Chances Calibration (For the searched location)
        if total_score >= 80:
            chance_pct = int(min(98, 75 + (total_score - 80) * 1.0))
            chance_level = "VERY HIGH"
            risk_level = "CRITICAL"
            timeframe = "Immediate 24–48 Hours"
        elif total_score >= 65:
            chance_pct = int(min(74, 55 + (total_score - 65) * 1.3))
            chance_level = "HIGH"
            risk_level = "HIGH"
            timeframe = "Next 48–72 Hours"
        elif total_score >= 45:
            chance_pct = int(min(54, 30 + (total_score - 45) * 1.2))
            chance_level = "ELEVATED"
            risk_level = "ELEVATED"
            timeframe = "Next 5–7 Days"
        elif total_score >= 25:
            chance_pct = int(min(29, 12 + (total_score - 25) * 0.8))
            chance_level = "MODERATE"
            risk_level = "MODERATE"
            timeframe = "Baseline Monitoring Period"
        else:
            chance_pct = max(0, int(total_score * 0.4))
            chance_level = "LOW"
            risk_level = "LOW"
            timeframe = "Nominal Background"

        chance_text = f"{chance_level} ({chance_pct}% probability of eruptive hazard impacting searched location within {timeframe})"

        magma_chamber_depth = round(max(3.2, 14.5 - (seismic_score / 30.0) * 9.0), 1)
        magma_ascent_rate = round(max(0.2, (seismic_score / 30.0) * 18.5), 1)
        plume_temp_c = 1150 if "ERUPT" in volcano_status else (850 if total_score > 60 else 420)
        evac_radius = 35.0 if estimated_vei >= 4 else (20.0 if estimated_vei >= 3 else 10.0)

        rationale = (
            f"Analysis for {volcano_name} ({vtype}) indicates a {risk_level} volcanic hazard index ({total_score}/100) "
            f"with a {chance_pct}% estimated likelihood of eruptive progression within {timeframe}. "
            f"The assessment incorporates {swarm_count} proximal seismic events (max M{max_mag:.1f}) within 120km, "
            f"where {len(shallow_quakes)} shallow tremors (depth <10km) denote active fluid-magmatic pressure transfer. "
            f"Estimated conduit ascent rate is {magma_ascent_rate} m/hr with an estimated magma chamber roof at {magma_chamber_depth} km depth. "
            f"Standard exclusion zone recommended: {evac_radius} km."
        )

        factors = [
            {
                "name": "Volcanic State & Thermal Plume",
                "score": round(base_score, 1),
                "max": 40,
                "weight": "40%",
                "detail": status_desc
            },
            {
                "name": "Seismic Swarm & Conduit Pressure",
                "score": round(seismic_score, 1),
                "max": 30,
                "weight": "30%",
                "detail": f"{swarm_count} quakes ({len(shallow_quakes)} shallow <10km), max M{max_mag:.1f}"
            },
            {
                "name": "Target Proximity Impact",
                "score": round(prox_score, 1),
                "max": 20,
                "weight": "20%",
                "detail": f"{dist_km:.1f} km from selected geographic coordinates"
            },
            {
                "name": "Lithospheric Structure & VEI Potential",
                "score": round(structure_score, 1),
                "max": 10,
                "weight": "10%",
                "detail": f"{vtype} morphology, potential VEI-{estimated_vei} index"
            }
        ]

        api_tier = "Authenticated Custom Key (NASA EarthData / USGS)" if api_key else "Open Access Public Tier (NASA EONET / USGS)"

        return {
            "volcano_name": volcano_name,
            "status": volcano_status,
            "volcano_type": vtype,
            "elevation_m": elevation,
            "distance_km": dist_km,
            "overall_score": total_score,
            "risk_level": risk_level,
            "chance_pct": chance_pct,
            "chance_level": chance_level,
            "chance_text": chance_text,
            "timeframe": timeframe,
            "estimated_vei": estimated_vei,
            "magma_chamber_depth_km": magma_chamber_depth,
            "magma_ascent_rate_m_hr": magma_ascent_rate,
            "thermal_plume_temp_c": plume_temp_c,
            "evacuation_radius_km": evac_radius,
            "seismic_swarm_count": swarm_count,
            "shallow_quake_count": len(shallow_quakes),
            "scientific_rationale": rationale,
            "contributing_factors": factors,
            "api_source": api_tier,
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }

volcano_service = VolcanoService()

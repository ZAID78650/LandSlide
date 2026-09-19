"""
Multi-Hazard Correlation and Root Cause Analysis Engine.
Cross-correlates earthquake activity, rainfall intensity, soil saturation,
and slope gradient to produce a fused hazard intelligence report.
All data is passed in as parameters — no external API calls.
"""

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class CorrelationEngine:
    """
    Multi-hazard correlation engine that fuses seismic, meteorological,
    geotechnical, and sensor data into a unified cascade risk assessment.
    """

    # Himalayan empirical rainfall I-D threshold: I = 14.82 * D^(-0.39)
    _ID_ALPHA = 14.82
    _ID_BETA = -0.39

    def analyze(
        self,
        lat: float,
        lon: float,
        weather_data: Optional[Dict[str, Any]] = None,
        seismic_data: Optional[List[Dict[str, Any]]] = None,
        sensor_data: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Perform full multi-hazard correlation analysis.

        Args:
            lat: Target latitude.
            lon: Target longitude.
            weather_data: Dict from weather_service (keys: rainfall_mm, status, detail).
            seismic_data: List of earthquake dicts from usgs_service.
            sensor_data: List of sensor dicts.

        Returns:
            Comprehensive correlation analysis dict.
        """
        weather_data = weather_data or {}
        seismic_data = seismic_data or []
        sensor_data = sensor_data or []

        timestamp = _now_iso()

        # 1. Extract & score individual hazard signals
        rainfall_signal = self._score_rainfall(weather_data, timestamp)
        seismic_signal = self._score_seismic(lat, lon, seismic_data, timestamp)
        soil_signal = self._score_soil_sensors(sensor_data, timestamp)
        slope_signal = self._score_slope_sensors(lat, lon, sensor_data, timestamp)

        signals = [rainfall_signal, seismic_signal, soil_signal, slope_signal]

        # 2. Fusion score (weighted average of normalised sub-scores)
        weights = [0.35, 0.25, 0.25, 0.15]
        weighted_sum = sum(s["score"] * w for s, w in zip(signals, weights))
        fusion_score = round(min(1.0, max(0.0, weighted_sum)), 3)

        # 3. Cascade risk level
        cascade_risk = self._cascade_risk_level(fusion_score)

        # 4. Primary trigger & secondary factors
        primary_trigger, secondary_factors = self._identify_triggers(signals)

        # 5. Root cause chain
        root_cause_chain = self._build_root_cause_chain(signals, weights, timestamp)

        # 6. Evidence list
        evidence = self._build_evidence(
            lat, lon, weather_data, seismic_data, sensor_data, signals, timestamp
        )

        # 7. Recommended actions
        recommended_actions = self._recommended_actions(fusion_score, cascade_risk, signals)

        return {
            "lat": lat,
            "lon": lon,
            "analysis_timestamp": timestamp,
            "fusion_score": fusion_score,
            "cascade_risk": cascade_risk,
            "primary_trigger": primary_trigger,
            "secondary_factors": secondary_factors,
            "root_cause_chain": root_cause_chain,
            "evidence": evidence,
            "recommended_actions": recommended_actions,
            "signal_breakdown": {
                "rainfall": rainfall_signal,
                "seismic": seismic_signal,
                "soil_saturation": soil_signal,
                "slope_stability": slope_signal,
            },
            "data_sources": [
                {"name": "IMD Gridded Rainfall 0.25 deg", "type": "METEOROLOGICAL", "reliability": 0.88},
                {"name": "USGS FDSN Earthquake Catalog", "type": "SEISMIC", "reliability": 0.96},
                {"name": "IoT Sensor Network", "type": "IN_SITU", "reliability": 0.75},
                {"name": "Himalayan I-D Threshold (Caine/IMD)", "type": "EMPIRICAL_MODEL", "reliability": 0.82},
            ],
        }

    def _score_rainfall(self, weather_data: Dict[str, Any], timestamp: str) -> Dict[str, Any]:
        rainfall_mm = _safe_float(weather_data.get("rainfall_mm"), 0.0)
        status = weather_data.get("status", "UNAVAILABLE")

        intensity_mm_hr = rainfall_mm / 24.0
        duration_hrs = 24.0
        threshold = self._ID_ALPHA * (duration_hrs ** self._ID_BETA)
        exceedance = intensity_mm_hr / threshold if threshold > 0 else 0.0

        if exceedance >= 2.0:
            score = 0.95
            tier = "SEVERE_EXCEEDANCE"
        elif exceedance >= 1.0:
            score = 0.75
            tier = "THRESHOLD_EXCEEDED"
        elif exceedance >= 0.7:
            score = 0.50
            tier = "NEAR_THRESHOLD"
        else:
            score = max(0.0, exceedance / 0.7) * 0.35
            tier = "BELOW_THRESHOLD"

        if status == "UNAVAILABLE":
            score = score * 0.5

        return {
            "name": "Rainfall / I-D Threshold",
            "score": round(score, 3),
            "tier": tier,
            "rainfall_mm": rainfall_mm,
            "intensity_mm_hr": round(intensity_mm_hr, 3),
            "threshold_mm_hr": round(threshold, 3),
            "exceedance_ratio": round(exceedance, 3),
            "data_source": "IMD Gridded Rainfall 0.25 deg / I-D Empirical Model",
            "data_type": "METEOROLOGICAL",
            "status": status,
            "confidence": 0.88 if status == "VERIFIED" else 0.45,
            "timestamp": timestamp,
        }

    def _score_seismic(
        self, lat: float, lon: float, seismic_data: List[Dict[str, Any]], timestamp: str
    ) -> Dict[str, Any]:
        if not seismic_data:
            return {
                "name": "Seismic Activity",
                "score": 0.0,
                "tier": "NO_DATA",
                "max_magnitude": 0,
                "event_count": 0,
                "nearest_km": None,
                "data_source": "USGS FDSN Earthquake Catalog",
                "data_type": "SEISMIC",
                "status": "UNAVAILABLE",
                "confidence": 0.0,
                "timestamp": timestamp,
            }

        mags = [_safe_float(eq.get("magnitude"), 0.0) for eq in seismic_data]
        max_mag = max(mags) if mags else 0.0
        avg_mag = sum(mags) / len(mags) if mags else 0.0

        distances = []
        for eq in seismic_data:
            eq_lat = _safe_float(eq.get("lat"), lat)
            eq_lon = _safe_float(eq.get("lon"), lon)
            d = _haversine(lat, lon, eq_lat, eq_lon)
            distances.append(d)
        nearest_km = round(min(distances), 1) if distances else None

        proximity_factor = 1.0
        if nearest_km is not None:
            proximity_factor = max(0.1, 1.0 - (nearest_km / 500.0))

        if max_mag >= 6.0:
            base = 0.90
        elif max_mag >= 5.0:
            base = 0.70
        elif max_mag >= 4.0:
            base = 0.45
        elif max_mag >= 3.0:
            base = 0.25
        else:
            base = 0.10

        score = min(1.0, base * proximity_factor)

        return {
            "name": "Seismic Activity",
            "score": round(score, 3),
            "tier": "ELEVATED" if score > 0.5 else "NORMAL",
            "max_magnitude": max_mag,
            "avg_magnitude": round(avg_mag, 2),
            "event_count": len(seismic_data),
            "nearest_km": nearest_km,
            "data_source": "USGS FDSN Earthquake Catalog",
            "data_type": "SEISMIC",
            "status": "VERIFIED",
            "confidence": 0.96,
            "timestamp": timestamp,
        }

    def _score_soil_sensors(self, sensor_data: List[Dict[str, Any]], timestamp: str) -> Dict[str, Any]:
        soil_sensors = [
            s for s in sensor_data
            if isinstance(s, dict) and str(s.get("type", "")).lower() in (
                "soil_moisture", "soil moisture", "pore_pressure", "pore pressure"
            )
        ]

        if not soil_sensors:
            return {
                "name": "Soil Saturation",
                "score": 0.0,
                "tier": "NO_SENSOR",
                "avg_moisture_pct": None,
                "sensor_count": 0,
                "data_source": "IoT Sensor Network",
                "data_type": "IN_SITU",
                "status": "UNAVAILABLE",
                "confidence": 0.0,
                "timestamp": timestamp,
            }

        values = [_safe_float(s.get("value"), 0.0) for s in soil_sensors]
        avg_val = sum(values) / len(values)
        norm = min(1.0, avg_val / 100.0)

        if norm >= 0.85:
            score = 0.90
        elif norm >= 0.70:
            score = 0.65
        elif norm >= 0.50:
            score = 0.40
        else:
            score = norm * 0.40

        return {
            "name": "Soil Saturation",
            "score": round(score, 3),
            "tier": "SATURATED" if norm >= 0.85 else ("HIGH" if norm >= 0.70 else "MODERATE"),
            "avg_moisture_pct": round(avg_val, 1),
            "sensor_count": len(soil_sensors),
            "data_source": "IoT Sensor Network - Soil Moisture Probes",
            "data_type": "IN_SITU",
            "status": "VERIFIED",
            "confidence": min(0.90, 0.50 + len(soil_sensors) * 0.10),
            "timestamp": timestamp,
        }

    def _score_slope_sensors(
        self, lat: float, lon: float, sensor_data: List[Dict[str, Any]], timestamp: str
    ) -> Dict[str, Any]:
        slope_sensors = [
            s for s in sensor_data
            if isinstance(s, dict) and str(s.get("type", "")).lower() in (
                "inclinometer", "displacement", "tiltmeter", "strain"
            )
        ]

        if not slope_sensors:
            heuristic_slope = 20.0 + abs(lat - 20.0) * 0.8
            heuristic_slope = min(45.0, heuristic_slope)
            norm = heuristic_slope / 45.0
            score = round(norm * 0.40, 3)
            return {
                "name": "Slope Gradient / Stability",
                "score": score,
                "tier": "ESTIMATED",
                "slope_deg_estimate": round(heuristic_slope, 1),
                "sensor_count": 0,
                "data_source": "Geographic Heuristic (no slope sensor)",
                "data_type": "ESTIMATED",
                "status": "PARTIAL",
                "confidence": 0.30,
                "timestamp": timestamp,
            }

        displacements = [_safe_float(s.get("value"), 0.0) for s in slope_sensors]
        max_disp = max(displacements)

        if max_disp > 25.0:
            score = 0.95
            tier = "TERTIARY_CREEP"
        elif max_disp > 8.0:
            score = 0.65
            tier = "SECONDARY_CREEP"
        else:
            score = max(0.0, max_disp / 8.0) * 0.35
            tier = "PRIMARY_CREEP"

        return {
            "name": "Slope Gradient / Stability",
            "score": round(score, 3),
            "tier": tier,
            "max_displacement_mm_day": max_disp,
            "sensor_count": len(slope_sensors),
            "data_source": "IoT Sensor Network - Inclinometers / Displacement Sensors",
            "data_type": "IN_SITU",
            "status": "VERIFIED",
            "confidence": min(0.90, 0.55 + len(slope_sensors) * 0.10),
            "timestamp": timestamp,
        }

    def _cascade_risk_level(self, fusion_score: float) -> str:
        if fusion_score >= 0.80:
            return "CRITICAL"
        elif fusion_score >= 0.60:
            return "HIGH"
        elif fusion_score >= 0.40:
            return "MODERATE"
        elif fusion_score >= 0.20:
            return "LOW"
        else:
            return "MINIMAL"

    def _identify_triggers(self, signals: List[Dict[str, Any]]):
        sorted_signals = sorted(signals, key=lambda s: s["score"], reverse=True)
        primary = sorted_signals[0]
        secondaries = [s for s in sorted_signals[1:] if s["score"] >= 0.25]

        trigger_descriptions = {
            "Rainfall / I-D Threshold": "Extreme rainfall exceeding Himalayan I-D threshold",
            "Seismic Activity": "Elevated seismic activity causing slope destabilisation",
            "Soil Saturation": "Critical soil saturation reducing effective shear strength",
            "Slope Gradient / Stability": "Progressive slope displacement indicating creep acceleration",
        }
        secondary_descriptions = {
            "Rainfall / I-D Threshold": "Sustained rainfall maintaining elevated pore-water pressure",
            "Seismic Activity": "Background seismic loading contributing to cumulative fatigue",
            "Soil Saturation": "Elevated antecedent soil moisture reducing infiltration capacity",
            "Slope Gradient / Stability": "Pre-existing slope deformation amplifying failure potential",
        }

        primary_trigger = trigger_descriptions.get(primary["name"], primary["name"])
        secondary_factors = [
            secondary_descriptions.get(s["name"], s["name"]) for s in secondaries
        ]

        return primary_trigger, secondary_factors

    def _build_root_cause_chain(
        self, signals: List[Dict[str, Any]], weights: List[float], timestamp: str
    ) -> List[Dict[str, Any]]:
        chain = []
        total_weighted = sum(s["score"] * w for s, w in zip(signals, weights))
        if total_weighted <= 0:
            total_weighted = 1.0

        sorted_pairs = sorted(
            zip(signals, weights), key=lambda x: x[0]["score"] * x[1], reverse=True
        )

        step_names = {
            "Rainfall / I-D Threshold": "Precipitation Loading",
            "Seismic Activity": "Seismic Destabilisation",
            "Soil Saturation": "Hydrological Weakening",
            "Slope Gradient / Stability": "Mechanical Slope Failure",
        }

        for step_idx, (sig, w) in enumerate(sorted_pairs, start=1):
            contribution = (sig["score"] * w / total_weighted) * 100.0
            chain.append({
                "step": step_idx,
                "factor": step_names.get(sig["name"], sig["name"]),
                "contribution_pct": round(contribution, 1),
                "data_source": sig.get("data_source", "Unknown"),
                "confidence": sig.get("confidence", 0.0),
                "score": sig["score"],
                "data_type": sig.get("data_type", "UNKNOWN"),
                "timestamp": timestamp,
            })

        return chain

    def _build_evidence(
        self,
        lat: float,
        lon: float,
        weather_data: Dict[str, Any],
        seismic_data: List[Dict[str, Any]],
        sensor_data: List[Dict[str, Any]],
        signals: List[Dict[str, Any]],
        timestamp: str,
    ) -> List[Dict[str, Any]]:
        evidence = []
        rain_sig = signals[0]

        evidence.append({
            "category": "Meteorological",
            "factor": "IMD Rainfall ({} mm/24h)".format(rain_sig.get("rainfall_mm", 0)),
            "status": "VERIFIED" if weather_data.get("status") == "VERIFIED" else "PARTIAL",
            "detail": (
                "Rainfall intensity: {:.2f} mm/h vs I-D threshold: {:.2f} mm/h [{}]".format(
                    rain_sig.get("intensity_mm_hr", 0),
                    rain_sig.get("threshold_mm_hr", 0),
                    rain_sig.get("tier", "UNKNOWN"),
                )
            ),
            "source": "IMD 0.25 deg Gridded Rainfall Dataset",
            "confidence": rain_sig.get("confidence", 0.0),
            "timestamp": timestamp,
        })

        seis_sig = signals[1]
        if seismic_data:
            max_mag = seis_sig.get("max_magnitude", 0)
            count = seis_sig.get("event_count", 0)
            evidence.append({
                "category": "Seismic",
                "factor": "USGS Seismic Activity (Mmax={}, n={})".format(max_mag, count),
                "status": "VERIFIED",
                "detail": (
                    "{} earthquake(s) detected. Maximum magnitude: {}. "
                    "Nearest event: {} km.".format(
                        count, max_mag, seis_sig.get("nearest_km", "N/A")
                    )
                ),
                "source": "USGS FDSN Earthquake Catalog",
                "confidence": 0.96,
                "timestamp": timestamp,
            })
        else:
            evidence.append({
                "category": "Seismic",
                "factor": "No seismic data available",
                "status": "UNAVAILABLE",
                "detail": "USGS seismic query returned no events for this region.",
                "source": "USGS FDSN Earthquake Catalog",
                "confidence": 0.0,
                "timestamp": timestamp,
            })

        soil_sig = signals[2]
        evidence.append({
            "category": "Geotechnical",
            "factor": "Soil Saturation ({}%)".format(soil_sig.get("avg_moisture_pct", "N/A")),
            "status": soil_sig.get("status", "UNAVAILABLE"),
            "detail": (
                "Average soil moisture: {}% from {} sensor(s). "
                "Saturation tier: {}.".format(
                    soil_sig.get("avg_moisture_pct", "N/A"),
                    soil_sig.get("sensor_count", 0),
                    soil_sig.get("tier", "UNKNOWN"),
                )
            ),
            "source": soil_sig.get("data_source", "IoT Network"),
            "confidence": soil_sig.get("confidence", 0.0),
            "timestamp": timestamp,
        })

        slope_sig = signals[3]
        evidence.append({
            "category": "Slope Stability",
            "factor": "Slope Displacement ({})".format(slope_sig.get("tier", "UNKNOWN")),
            "status": slope_sig.get("status", "UNAVAILABLE"),
            "detail": (
                "Max displacement: {} [{}]. Sensor count: {}.".format(
                    slope_sig.get("max_displacement_mm_day", slope_sig.get("slope_deg_estimate", "N/A")),
                    slope_sig.get("tier", "UNKNOWN"),
                    slope_sig.get("sensor_count", 0),
                )
            ),
            "source": slope_sig.get("data_source", "IoT Network"),
            "confidence": slope_sig.get("confidence", 0.0),
            "timestamp": timestamp,
        })

        return evidence

    def _recommended_actions(
        self,
        fusion_score: float,
        cascade_risk: str,
        signals: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        actions = []

        actions.append({
            "tier": "Monitor",
            "action": "Continue automated sensor polling at 15-minute intervals",
            "responsible_agency": "State Disaster Management Authority (SDMA)",
            "urgency": "ROUTINE",
        })

        if fusion_score >= 0.30:
            actions.append({
                "tier": "Alert",
                "action": "Issue advisory to district administration and emergency services",
                "responsible_agency": "National Disaster Management Authority (NDMA)",
                "urgency": "ELEVATED",
            })

        if fusion_score >= 0.55:
            actions.append({
                "tier": "Alert",
                "action": "Deploy rapid geotechnical assessment team to the site",
                "responsible_agency": "Geological Survey of India (GSI)",
                "urgency": "HIGH",
            })

        if fusion_score >= 0.70:
            actions.append({
                "tier": "Evacuate",
                "action": "Initiate precautionary evacuation of at-risk settlements within 2 km radius",
                "responsible_agency": "District Collector / SDMA",
                "urgency": "URGENT",
            })

        if fusion_score >= 0.85:
            actions.append({
                "tier": "Emergency Response",
                "action": "Activate Incident Response System (IRS). Deploy NDRF/SDRF teams immediately.",
                "responsible_agency": "National Disaster Response Force (NDRF)",
                "urgency": "CRITICAL",
            })

        return actions


correlation_engine = CorrelationEngine()

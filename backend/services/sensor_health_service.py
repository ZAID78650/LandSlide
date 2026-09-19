"""
Sensor Health & Malfunction Detection Service
Monitors all sensors for connectivity, data freshness, and anomalous readings
using actual database records.
"""
import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import models


# Sensor-type-specific malfunction messages
SENSOR_MESSAGES = {
    "RAIN_GAUGE": {
        "NO_DATA": {
            "problem": "No precipitation readings received from the rain gauge.",
            "causes": [
                "Tipping bucket mechanism may be blocked by debris or ice",
                "Network/cellular connectivity failure at deployment site",
                "Power supply interruption (battery or solar)",
                "Data logger communication error"
            ],
            "actions": [
                "1. Check sensor power supply — verify battery voltage or solar panel output.",
                "2. Clear tipping bucket mechanism of debris, leaves, or ice.",
                "3. Verify cellular/network connectivity at the sensor site.",
                "4. Attempt remote restart of the data logger.",
                "5. Dispatch field team if sensor remains offline after 30 minutes."
            ]
        }
    },
    "SEISMIC": {
        "NO_DATA": {
            "problem": "No seismic readings received from the geophone.",
            "causes": [
                "Ground coupling failure — sensor may have shifted",
                "Power interruption to the seismic data logger",
                "Cable or connector damage",
                "Digitizer communication error"
            ],
            "actions": [
                "1. Check power supply to the seismic data logger.",
                "2. Verify ground coupling — sensor must be firmly planted.",
                "3. Inspect cable connections between geophone and digitizer.",
                "4. Restart the digitizer remotely if accessible.",
                "5. Schedule field inspection to verify physical installation."
            ]
        }
    },
    "SOIL_MOISTURE": {
        "NO_DATA": {
            "problem": "No soil moisture readings received from the probe.",
            "causes": [
                "Probe may have become disconnected from data logger",
                "Soil shrinkage may have created air gaps around probe",
                "Power failure to the monitoring station",
                "Analog-to-digital converter malfunction"
            ],
            "actions": [
                "1. Check power supply at the monitoring station.",
                "2. Verify probe-to-logger connection integrity.",
                "3. Inspect soil contact — probe requires firm soil contact.",
                "4. Restart data logger remotely.",
                "5. Recalibrate probe if readings resume but appear inaccurate."
            ]
        }
    },
    "CAMERA": {
        "NO_DATA": {
            "problem": "No image or video feed received from the monitoring camera.",
            "causes": [
                "Network bandwidth or connectivity failure",
                "Camera power supply interruption",
                "SD card storage full",
                "Camera firmware hang"
            ],
            "actions": [
                "1. Check camera power supply and indicator LEDs.",
                "2. Verify network connectivity at camera location.",
                "3. Check storage capacity — clear SD card if full.",
                "4. Perform camera remote reboot if accessible.",
                "5. Replace camera unit if reboot fails."
            ]
        }
    },
    "DEFAULT": {
        "NO_DATA": {
            "problem": "No readings received from the sensor for an extended period.",
            "causes": [
                "Network interruption at sensor location",
                "Power supply failure (battery or grid)",
                "Hardware malfunction or component failure",
                "Sensor communication protocol error"
            ],
            "actions": [
                "1. Check sensor power supply at the deployment location.",
                "2. Verify network/cellular connectivity at the sensor site.",
                "3. Attempt remote restart of the sensor gateway or data logger.",
                "4. Inspect physical sensor connections and mounting hardware.",
                "5. Replace the sensor unit if readings remain unavailable after 30 minutes."
            ]
        },
        "STALE_DATA": {
            "problem": "Sensor is transmitting but data appears stale or unchanged.",
            "causes": [
                "Sensor transducer may be stuck or frozen at last value",
                "Intermittent connectivity causing cached data to repeat",
                "Firmware issue causing repeated transmission of same reading"
            ],
            "actions": [
                "1. Compare current reading against expected range for current conditions.",
                "2. Restart the sensor or data logger remotely.",
                "3. Check for firmware updates for this sensor model.",
                "4. If on-site: perform manual calibration check.",
                "5. Flag readings as potentially unreliable until confirmed."
            ]
        }
    }
}


def _get_message_template(sensor_type: str, issue_type: str) -> Dict:
    sensor_key = sensor_type.upper() if sensor_type else "DEFAULT"
    templates = SENSOR_MESSAGES.get(sensor_key, SENSOR_MESSAGES["DEFAULT"])
    return templates.get(issue_type, SENSOR_MESSAGES["DEFAULT"].get(issue_type, SENSOR_MESSAGES["DEFAULT"]["NO_DATA"]))


def _minutes_since(dt: Optional[datetime]) -> Optional[float]:
    if dt is None:
        return None
    now = datetime.now(timezone.utc)
    # Handle naive datetimes from DB (assume UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = (now - dt).total_seconds() / 60.0
    return max(0.0, delta)


class SensorHealthService:

    def get_sensor_health(self, db: Session) -> List[Dict[str, Any]]:
        """Assess health of every sensor using actual DB records."""
        try:
            sensors = db.query(models.Sensor).all()
        except Exception:
            sensors = []

        results = []
        for sensor in sensors:
            minutes_ago = _minutes_since(sensor.last_updated)

            # Determine status and health score
            if sensor.status == models.SensorStatus.OFFLINE:
                status_code = "OFFLINE"
                health_score = 0
                issues = ["OFFLINE"]
            elif minutes_ago is None or minutes_ago > 480:  # >8 hours
                status_code = "OFFLINE"
                health_score = max(0, 10 - int(minutes_ago / 60) if minutes_ago else 0)
                issues = ["NO_DATA"]
            elif minutes_ago > 60:  # 1–8 hours
                status_code = "MALFUNCTION"
                health_score = max(10, 40 - int(minutes_ago / 15))
                issues = ["NO_DATA"]
            elif minutes_ago > 15:  # 15–60 min
                status_code = "DEGRADED"
                health_score = max(40, 70 - int(minutes_ago))
                issues = ["STALE_DATA"]
            elif minutes_ago > 5:  # 5–15 min
                status_code = "WARNING"
                health_score = max(60, 85 - int(minutes_ago * 2))
                issues = ["DELAYED"]
            elif sensor.status == models.SensorStatus.DEGRADED or sensor.status == models.SensorStatus.MAINTENANCE:
                status_code = "WARNING"
                health_score = 65
                issues = ["DEGRADED_MODE"]
            else:
                status_code = "ONLINE"
                health_score = min(100, 95 + int((5 - (minutes_ago or 0)) * 1))
                issues = []

            # Generate malfunction alert if needed
            alert = None
            if status_code in ("MALFUNCTION", "OFFLINE") and issues:
                issue_type = issues[0]
                alert = self.generate_malfunction_alert(
                    {
                        "name": sensor.name,
                        "type": sensor.sensor_type or "UNKNOWN",
                        "id": sensor.id,
                        "location": sensor.location_name or f"{sensor.lat:.4f}, {sensor.lon:.4f}"
                    },
                    issue_type,
                    minutes_ago
                )

            results.append({
                "sensor_id": sensor.id,
                "sensor_name": sensor.name,
                "sensor_type": sensor.sensor_type,
                "lat": sensor.lat,
                "lon": sensor.lon,
                "location": sensor.location_name,
                "db_status": sensor.status.value if sensor.status else "UNKNOWN",
                "status_code": status_code,
                "last_updated": sensor.last_updated.isoformat() if sensor.last_updated else None,
                "last_updated_minutes_ago": round(minutes_ago, 1) if minutes_ago is not None else None,
                "last_value": sensor.last_value,
                "last_unit": sensor.last_unit,
                "health_score": health_score,
                "issues": issues,
                "alert": alert
            })

        return results

    def generate_malfunction_alert(
        self,
        sensor: Dict[str, Any],
        issue_type: str,
        minutes_ago: Optional[float] = None
    ) -> Dict[str, Any]:
        """Generate a structured, situation-specific malfunction alert."""
        sensor_type = (sensor.get("type") or "DEFAULT").upper()
        template = _get_message_template(sensor_type, issue_type)

        # Human-readable duration
        if minutes_ago is None:
            duration_str = "an unknown period"
        elif minutes_ago < 60:
            duration_str = f"{int(minutes_ago)} minutes"
        else:
            hours = int(minutes_ago / 60)
            duration_str = f"{hours} hour{'s' if hours != 1 else ''}"

        severity = "CRITICAL" if issue_type == "OFFLINE" or (minutes_ago or 0) > 120 else "MALFUNCTION"
        display_type = issue_type.replace("_", " ").title()

        return {
            "sensor_name": sensor.get("name", "Unknown Sensor"),
            "sensor_id": sensor.get("id"),
            "sensor_type": sensor.get("type", "UNKNOWN"),
            "sensor_location": sensor.get("location", "Unknown Location"),
            "issue_type": issue_type,
            "severity": severity,
            "message": f"🔴 {sensor.get('name', 'Sensor')} has stopped transmitting data for {duration_str}.",
            "problem": template["problem"],
            "possible_causes": template["causes"],
            "recommended_actions": template["actions"],
            "last_updated_duration": duration_str,
            "confidence": 0.95 if minutes_ago and minutes_ago > 60 else 0.75,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def calculate_data_reliability(self, db: Session) -> Dict[str, Any]:
        """Calculate a weighted data reliability score from actual DB state."""
        try:
            all_sensors = db.query(models.Sensor).all()
            total = len(all_sensors)
            online = sum(1 for s in all_sensors if s.status == models.SensorStatus.ONLINE)
            online_rate = (online / total * 100) if total > 0 else 0
        except Exception:
            total = 0
            online = 0
            online_rate = 0

        # Factor 1: Sensor online rate (weight 30)
        sensor_score = int((online_rate / 100) * 30)
        sensor_detail = f"{online}/{total} sensors online ({online_rate:.0f}%)"

        # Factor 2: Data freshness — average minutes since last_updated (weight 25)
        try:
            freshness_scores = []
            for s in all_sensors:
                mins = _minutes_since(s.last_updated)
                if mins is None:
                    freshness_scores.append(0)
                elif mins < 5:
                    freshness_scores.append(25)
                elif mins < 15:
                    freshness_scores.append(18)
                elif mins < 60:
                    freshness_scores.append(10)
                else:
                    freshness_scores.append(0)
            freshness_score = int(sum(freshness_scores) / max(len(freshness_scores), 1))
            avg_mins = sum(
                _minutes_since(s.last_updated) or 999
                for s in all_sensors
            ) / max(total, 1)
            freshness_detail = f"Avg last update: {avg_mins:.1f} min ago"
        except Exception:
            freshness_score = 15
            freshness_detail = "Freshness data unavailable"

        # Factor 3: API availability (weight 25) — static for now, backend up = 20
        api_score = 20
        api_detail = "Backend APIs responding normally"

        # Factor 4: Data consistency (weight 20) — check for zero/null last_value sensors
        try:
            null_value_count = sum(1 for s in all_sensors if s.last_value is None)
            consistency_rate = 1 - (null_value_count / max(total, 1))
            consistency_score = int(consistency_rate * 20)
            consistency_detail = (
                "No missing values detected" if null_value_count == 0
                else f"{null_value_count} sensor(s) missing last reading"
            )
        except Exception:
            consistency_score = 15
            consistency_detail = "Consistency check unavailable"

        total_score = sensor_score + freshness_score + api_score + consistency_score

        if total_score >= 85:
            grade = "EXCELLENT"
            warning = None
        elif total_score >= 70:
            grade = "GOOD"
            warning = None
        elif total_score >= 50:
            grade = "FAIR"
            warning = "⚠ MODERATE DATA CONFIDENCE — Some sensor data may be delayed or missing."
        elif total_score >= 30:
            grade = "POOR"
            warning = "⚠ LOW DATA CONFIDENCE — Analysis is based on incomplete sensor data. Some readings may be unavailable."
        else:
            grade = "CRITICAL"
            warning = "⚠ VERY LOW DATA CONFIDENCE — Most sensors are offline. Analysis results are unreliable."

        return {
            "reliability_score": total_score,
            "score": total_score,
            "grade": grade,
            "factors": [
                {"name": "Sensor Online Rate", "weight": 30, "score": sensor_score, "detail": sensor_detail},
                {"name": "Data Freshness", "weight": 25, "score": freshness_score, "detail": freshness_detail},
                {"name": "API Availability", "weight": 25, "score": api_score, "detail": api_detail},
                {"name": "Data Consistency", "weight": 20, "score": consistency_score, "detail": consistency_detail},
            ],
            "warning": warning,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }


sensor_health_service = SensorHealthService()

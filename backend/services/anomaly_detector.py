"""
Sensor Anomaly Detection and Automatic Malfunction Diagnosis Engine.
Uses statistical thresholding and cross-validation across sensor cohorts
to detect spikes, dropouts, drift, and communication loss.
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


# Expected value ranges per sensor type (min, max, normal_min, normal_max)
_SENSOR_RANGES: Dict[str, Dict[str, float]] = {
    "soil_moisture":   {"min": 0.0,    "max": 100.0,  "normal_min": 10.0,   "normal_max": 85.0},
    "soil moisture":   {"min": 0.0,    "max": 100.0,  "normal_min": 10.0,   "normal_max": 85.0},
    "pore_pressure":   {"min": -10.0,  "max": 500.0,  "normal_min": 0.0,    "normal_max": 250.0},
    "inclinometer":    {"min": -90.0,  "max": 90.0,   "normal_min": -30.0,  "normal_max": 30.0},
    "displacement":    {"min": 0.0,    "max": 1000.0, "normal_min": 0.0,    "normal_max": 50.0},
    "tiltmeter":       {"min": -45.0,  "max": 45.0,   "normal_min": -15.0,  "normal_max": 15.0},
    "strain":          {"min": -5000.0,"max": 5000.0, "normal_min": -500.0, "normal_max": 500.0},
    "rainfall":        {"min": 0.0,    "max": 500.0,  "normal_min": 0.0,    "normal_max": 200.0},
    "temperature":     {"min": -20.0,  "max": 60.0,   "normal_min": -5.0,   "normal_max": 45.0},
    "groundwater":     {"min": 0.0,    "max": 50.0,   "normal_min": 0.5,    "normal_max": 30.0},
}

_SPIKE_MULTIPLIER = 3.0
_DROPOUT_THRESHOLD = -999.0


class AnomalyDetector:
    """
    Detects and diagnoses sensor anomalies using statistical thresholding
    and cross-sensor cohort validation.
    """

    def detect_anomalies(self, sensors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process a list of sensor dicts and return enriched list with anomaly info.

        Each sensor dict should contain:
            id, name, type, value, unit, health_score, lat (opt), lon (opt),
            last_reading (opt), status (opt)

        Returns:
            List of sensor dicts with added keys:
                anomaly_detected (bool), anomaly_type, diagnosis,
                cross_validation_status, analysis_timestamp
        """
        if not sensors:
            return []

        # Group sensors by type for cross-validation
        type_groups: Dict[str, List[Dict[str, Any]]] = {}
        for sensor in sensors:
            stype = str(sensor.get("type", "unknown")).lower().strip()
            type_groups.setdefault(stype, []).append(sensor)

        enriched = []
        for sensor in sensors:
            stype = str(sensor.get("type", "unknown")).lower().strip()
            cohort = type_groups.get(stype, [])

            diagnosis = self.diagnose_malfunction(sensor)
            anomaly_detected = diagnosis["type"] != "normal"

            cross_status = self._cross_validate(sensor, cohort)

            enriched.append({
                **sensor,
                "anomaly_detected": anomaly_detected,
                "anomaly_type": diagnosis["type"],
                "diagnosis": diagnosis,
                "cross_validation_status": cross_status,
                "analysis_timestamp": _now_iso(),
            })

        return enriched

    def diagnose_malfunction(self, sensor: Dict[str, Any]) -> Dict[str, Any]:
        """
        Diagnose a single sensor's malfunction type.

        Returns:
            {
                type: 'spike'|'dropout'|'drift'|'comm_loss'|'normal',
                severity: 'CRITICAL'|'HIGH'|'MODERATE'|'LOW',
                description: str,
                recommended_action: str,
                confidence: float,
            }
        """
        health_score = _safe_float(sensor.get("health_score"), 100.0)
        value = sensor.get("value")
        stype = str(sensor.get("type", "unknown")).lower().strip()
        status = str(sensor.get("status", "")).lower()
        last_reading = sensor.get("last_reading")

        # Communication loss detection
        if status in ("offline", "disconnected", "error") or value is None:
            return {
                "type": "comm_loss",
                "severity": "CRITICAL" if health_score < 30 else "HIGH",
                "description": (
                    "Sensor is offline or returning null values. "
                    "Status: '{}'. Last reading: {}.".format(
                        sensor.get("status", "unknown"), last_reading
                    )
                ),
                "recommended_action": (
                    "Dispatch field technician to inspect sensor connection and power supply. "
                    "Switch to backup sensor if available."
                ),
                "confidence": 0.95,
            }

        float_value = _safe_float(value, 0.0)

        # Dropout / sentinel value
        if float_value <= _DROPOUT_THRESHOLD or float_value == -9999.0:
            return {
                "type": "dropout",
                "severity": "HIGH",
                "description": (
                    "Sensor returned sentinel dropout value ({}). "
                    "Data acquisition pipeline likely broken.".format(float_value)
                ),
                "recommended_action": (
                    "Check data logger firmware and cable integrity. "
                    "Exclude this reading from analysis until repaired."
                ),
                "confidence": 0.90,
            }

        ranges = _SENSOR_RANGES.get(stype, {})
        abs_min = ranges.get("min")
        abs_max = ranges.get("max")
        norm_max = ranges.get("normal_max")

        # Out-of-range spike
        if abs_min is not None and abs_max is not None:
            if float_value < abs_min or float_value > abs_max:
                return {
                    "type": "spike",
                    "severity": "CRITICAL" if health_score < 30 else "HIGH",
                    "description": (
                        "Value {} is outside physical bounds [{}, {}] for sensor type '{}'.".format(
                            float_value, abs_min, abs_max, stype
                        )
                    ),
                    "recommended_action": (
                        "Verify sensor calibration. If multiple consecutive spikes, "
                        "replace sensor unit and recalibrate."
                    ),
                    "confidence": 0.92,
                }

            # Spike relative to normal max
            if norm_max is not None and float_value > norm_max * _SPIKE_MULTIPLIER:
                return {
                    "type": "spike",
                    "severity": "HIGH",
                    "description": (
                        "Value {} exceeds {}x normal maximum ({}) for '{}'. "
                        "Likely electrical transient or loose contact.".format(
                            float_value, _SPIKE_MULTIPLIER, norm_max, stype
                        )
                    ),
                    "recommended_action": (
                        "Apply median filter to readings. Inspect wiring and grounding. "
                        "Consider sensor replacement if persistent."
                    ),
                    "confidence": 0.80,
                }

        # Health-score based drift / degradation
        if health_score < 30:
            return {
                "type": "drift",
                "severity": "CRITICAL",
                "description": (
                    "Health score critically low ({:.1f}/100). "
                    "Sensor is likely drifting due to ageing, fouling, or moisture ingress.".format(
                        health_score
                    )
                ),
                "recommended_action": (
                    "Immediate calibration required. Remove sensor from active monitoring "
                    "and substitute with standby unit."
                ),
                "confidence": 0.85,
            }

        if health_score < 50:
            return {
                "type": "drift",
                "severity": "MODERATE",
                "description": (
                    "Health score degraded ({:.1f}/100). "
                    "Progressive drift may be corrupting readings.".format(health_score)
                ),
                "recommended_action": (
                    "Schedule recalibration within 48 hours. "
                    "Apply drift correction factor until serviced."
                ),
                "confidence": 0.75,
            }

        # Normal
        severity = "LOW" if health_score < 70 else None
        return {
            "type": "normal",
            "severity": severity,
            "description": (
                "Sensor operating within expected parameters. "
                "Health score: {:.1f}/100.".format(health_score)
            ),
            "recommended_action": (
                "Continue routine monitoring. Schedule next calibration per maintenance schedule."
            ),
            "confidence": 0.90,
        }

    def _cross_validate(
        self, sensor: Dict[str, Any], cohort: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Cross-validate sensor reading against others of the same type.
        Flags discrepancy if sensor value deviates more than 2 std-devs from cohort mean.
        """
        if len(cohort) < 2:
            return {
                "status": "INSUFFICIENT_PEERS",
                "detail": "Only one sensor of this type -- cross-validation not possible.",
                "discrepancy_detected": False,
            }

        values = []
        for s in cohort:
            v = s.get("value")
            if v is not None:
                try:
                    values.append(float(v))
                except (TypeError, ValueError):
                    pass

        if len(values) < 2:
            return {
                "status": "INSUFFICIENT_DATA",
                "detail": "Not enough numeric readings from peer sensors.",
                "discrepancy_detected": False,
            }

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std = math.sqrt(variance)

        own_value = _safe_float(sensor.get("value"), mean)
        z_score = abs(own_value - mean) / std if std > 0 else 0.0
        discrepancy = z_score > 2.0

        return {
            "status": "DISCREPANCY_DETECTED" if discrepancy else "CONSISTENT",
            "detail": (
                "This sensor: {:.2f}. Cohort mean: {:.2f} +/- {:.2f}. Z-score: {:.2f}.".format(
                    own_value, mean, std, z_score
                )
            ),
            "cohort_mean": round(mean, 3),
            "cohort_std": round(std, 3),
            "z_score": round(z_score, 3),
            "discrepancy_detected": discrepancy,
        }


anomaly_detector = AnomalyDetector()

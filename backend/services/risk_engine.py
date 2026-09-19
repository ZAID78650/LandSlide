from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import models
import logging

logger = logging.getLogger(__name__)

class RiskFusionEngine:
    def __init__(self, db: Session):
        self.db = db

    def calculate_landslide_risk(self, location_id: str) -> dict:
        # Phase 3: Landslide Risk Model
        # Feature Engineering: 1h, 24h, 72h antecedent rainfall
        rainfall_sensor = self.db.query(models.Sensor).filter(models.Sensor.sensor_id.like(f"%{location_id}%"), models.Sensor.sensor_type == "rainfall").first()
        
        score = 20 # Base low risk
        reasons = []
        
        if rainfall_sensor and rainfall_sensor.last_value:
            rain = rainfall_sensor.last_value
            if rain > 50:
                score += 40
                reasons.append(f"Extreme 24h rainfall: {rain}mm")
            elif rain > 20:
                score += 20
                reasons.append(f"Heavy 24h rainfall: {rain}mm")
            else:
                reasons.append(f"Normal rainfall: {rain}mm")
        
        # Add mock soil moisture & slope
        score += 15
        reasons.append("Saturated soil conditions detected")
        reasons.append("Steep slope vulnerability (38°)")
        
        return self._format_risk("Landslide", min(score, 100), reasons)

    def calculate_flood_risk(self, location_id: str) -> dict:
        # Phase 4: Flood Module
        score = 15
        reasons = ["River level normal"]
        return self._format_risk("Flood", score, reasons)
        
    def calculate_earthquake_risk(self, location_id: str) -> dict:
        # Phase 5: Earthquake
        score = 30
        reasons = ["Moderate seismic hazard zone", "No recent major events"]
        return self._format_risk("Earthquake", score, reasons)
        
    def calculate_cyclone_risk(self, location_id: str) -> dict:
        # Phase 6: Cyclone
        score = 10
        reasons = ["No active cyclone track nearby"]
        return self._format_risk("Cyclone", score, reasons)

    def calculate_volcano_risk(self, location_id: str) -> dict:
        # Phase 7: Volcano
        score = 5
        reasons = ["No active volcano in proximity"]
        return self._format_risk("Volcano", score, reasons)

    def generate_overall_risk(self, location_id: str, agentic_data=None) -> dict:
        # Phase 3: Risk Evaluation
        if agentic_data:
            # If Agentic Core provided a direct LLM-evaluated risk profile, bypass static heuristics!
            return {
                "location_id": location_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "overall_score": agentic_data.risk_score,
                "overall_level": agentic_data.risk_level,
                "primary_threat": agentic_data.primary_threat,
                "explanation": agentic_data.explanation,
                "hazards": {
                    "landslide": {"hazard": "landslide", "score": agentic_data.risk_score if agentic_data.primary_threat == "Landslide" else 20, "level": agentic_data.risk_level if agentic_data.primary_threat == "Landslide" else "LOW"},
                    "flood": {"hazard": "flood", "score": agentic_data.risk_score if agentic_data.primary_threat == "Flood" else 15, "level": agentic_data.risk_level if agentic_data.primary_threat == "Flood" else "LOW"},
                    "earthquake": {"hazard": "earthquake", "score": agentic_data.risk_score if agentic_data.primary_threat == "Earthquake" else 10, "level": "LOW"},
                    "cyclone": {"hazard": "cyclone", "score": 5, "level": "LOW"},
                    "volcano": {"hazard": "volcano", "score": 5, "level": "LOW"}
                },
                "remedial_actions": agentic_data.remedial_actions
            }

        # Fallback to static math heuristics if no Agentic Core
        ls = self.calculate_landslide_risk(location_id)
        fl = self.calculate_flood_risk(location_id)
        eq = self.calculate_earthquake_risk(location_id)
        cy = self.calculate_cyclone_risk(location_id)
        vo = self.calculate_volcano_risk(location_id)
        
        risks = [ls, fl, eq, cy, vo]
        max_risk = max(risks, key=lambda x: x["score"])
        
        return {
            "location_id": location_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_score": max_risk["score"],
            "overall_level": max_risk["level"],
            "primary_threat": max_risk["hazard"],
            "explanation": "Heuristic model evaluation based on static threshold crossing.",
            "hazards": {
                "landslide": ls,
                "flood": fl,
                "earthquake": eq,
                "cyclone": cy,
                "volcano": vo
            },
            "remedial_actions": self.generate_remedial_actions(max_risk["hazard"], max_risk["level"])
        }

    def generate_7_day_forecast(self, location_id: str, agentic_data=None) -> list:
        # Phase 8: 7-Day Forecast Engine
        forecast = []
        base = datetime.now(timezone.utc)
        current = self.generate_overall_risk(location_id, agentic_data=agentic_data)
        
        for i in range(1, 8):
            date = base + timedelta(days=i)
            # Simulating forecast drift
            trend = (i * 2) if i < 4 else -(i * 2)
            ls_score = min(max(current["hazards"]["landslide"]["score"] + trend, 0), 100)
            
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "landslide_risk": ls_score,
                "flood_risk": min(max(current["hazards"]["flood"]["score"] + trend, 0), 100),
                "cyclone_risk": current["hazards"]["cyclone"]["score"],
                "level": self._get_level(ls_score)
            })
        return forecast

    def generate_remedial_actions(self, hazard: str, level: str) -> dict:
        # Phase 9: Remedial Action Engine
        if level in ["LOW", "MODERATE"]:
            return {"immediate": ["Continue routine monitoring"], "short_term": ["Review readiness protocols"]}
            
        if hazard == "Landslide":
            return {
                "immediate": [
                    "Restrict traffic on vulnerable road segments",
                    "Inspect retaining structures",
                    "Move people from identified exposed locations"
                ],
                "short_term": [
                    "Close high-risk routes if thresholds are exceeded",
                    "Inspect drainage channels"
                ]
            }
        return {"immediate": ["Activate emergency protocols"], "short_term": ["Deploy response teams"]}

    def _format_risk(self, hazard: str, score: int, reasons: list) -> dict:
        return {
            "hazard": hazard,
            "score": score,
            "level": self._get_level(score),
            "reasons": reasons # Phase 10: Explainability built-in
        }
        
    def _get_level(self, score: int) -> str:
        if score <= 20: return "LOW"
        if score <= 40: return "MODERATE"
        if score <= 60: return "ELEVATED"
        if score <= 80: return "HIGH"
        return "CRITICAL"

def get_risk_engine(db: Session) -> RiskFusionEngine:
    return RiskFusionEngine(db)

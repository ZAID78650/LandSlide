"""
Tectonic Plate Intelligence Service
Uses bundled PB2002-derived simplified plate boundary data.
"""
import json
import os
import math
from typing import Dict, Any, List

def point_in_polygon(x, y, polygon):
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

class TectonicService:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), "..", "data", "tectonic_plates.json")
        self.plates_data = {}
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                self.plates_data = json.load(f)

    def get_plate_for_location(self, lat: float, lon: float) -> Dict[str, Any]:
        features = self.plates_data.get("features", [])
        for feature in features:
            geom = feature.get("geometry", {})
            if geom.get("type") == "Polygon":
                poly = geom["coordinates"][0]
                # coordinates are [lon, lat]
                if point_in_polygon(lon, lat, poly):
                    return {
                        "plate_name": feature["properties"]["name"],
                        "plate_type": feature["properties"]["type"],
                        "boundary_type": feature["properties"]["boundary_type"],
                        "description": f"Located on the {feature['properties']['name']}"
                    }
        return {"plate_name": "Unknown", "plate_type": "Unknown", "boundary_type": "Unknown", "description": "Plate not identified"}

    def get_nearest_boundaries(self, lat: float, lon: float, radius_km: int = 500) -> Dict[str, Any]:
        # Simplify boundary calculation for mock bounding boxes
        return {
            "nearest_boundary_km": 150,
            "boundary_type": "Convergent",
            "plates_involved": ["Unknown"],
            "risk_note": "Proximity to boundary poses seismic risk."
        }

    def generate_tectonic_correlation(self, lat: float, lon: float, volcanoes: List, earthquakes: List) -> str:
        plate = self.get_plate_for_location(lat, lon)
        plate_name = plate.get("plate_name", "Unknown Plate")
        boundary = plate.get("boundary_type", "Unknown boundary")
        
        eq_count = len(earthquakes) if isinstance(earthquakes, list) else 0
        vol_count = len(volcanoes) if isinstance(volcanoes, list) else 0

        correlation = f"The selected location lies within the {plate_name}, near a {boundary} boundary. "
        
        if eq_count > 0:
            correlation += f"Recent seismic data shows elevated activity with {eq_count} events nearby. "
        else:
            correlation += "Recent seismic data shows normal activity. "
            
        if vol_count > 0:
            correlation += f"There are {vol_count} active volcanoes in the broader region. "
            
        correlation += "This region has historically experienced moderate seismic events. Monitoring is recommended."
        return correlation

tectonic_service = TectonicService()

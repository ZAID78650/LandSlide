"""
Standalone 24/7 Global Multi-Hazard Data Pipeline
=================================================
Fetches live global data for all 5 hazards (Earthquakes, Volcanos, Cyclones, Rainfall, and Landslides)
down to country and city levels from USGS, GDACS, and Open-Meteo.
Generates standardized GeoJSON ('live_global_hazards.geojson') for GeoNode (https://github.com/GeoNode/geonode).
Can be run via cron (*/15 * * * *) or executed directly.
"""

import os
import sys

# Add backend directory to sys.path so we share the single authoritative engine
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.hazard_pipeline import hazard_pipeline

def main():
    print("================================================================")
    print("Initializing 24/7 Global Hazard Sync Pipeline (USGS + GDACS + Open-Meteo)...")
    print("GeoNode Layer Integration Target: https://github.com/GeoNode/geonode")
    print("================================================================")
    
    stats = hazard_pipeline.sync_pipeline()
    
    print("\n--- INGESTION SUMMARY ---")
    print(f"Total Live Hazards Ingested: {stats['total_hazards']}")
    print(f"  • Earthquakes (USGS 24h):  {stats['earthquakes']}")
    print(f"  • Cyclones (GDACS/IMD):     {stats['cyclones']}")
    print(f"  • Volcanoes (GDACS/Smith):  {stats['volcanoes']}")
    print(f"  • Landslides (GDACS/ISRO):  {stats['landslides']}")
    print(f"  • Rainfall (Open-Meteo):    {stats['rainfall']}")
    print(f"Sync Duration:               {stats['sync_duration_ms']} ms")
    print(f"GeoNode Layer Reference:     {stats['geonode_layer_ref']}")
    print(f"Output File:                 live_global_hazards.geojson")
    print("================================================================")

if __name__ == "__main__":
    main()

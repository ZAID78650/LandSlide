"""
Hazard Ingestion Pipeline & GeoNode Layer Endpoints
===================================================
Provides REST access to the 24/7 Multi-Hazard Ingestion Pipeline,
individual hazard feeds, GeoNode layer catalog (https://github.com/GeoNode/geonode),
and real-time analytics.
"""

import os
import json
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from auth import get_current_user
from services.hazard_pipeline import (
    hazard_pipeline,
    OUTPUT_GEOJSON_PATH,
    FRONTEND_DATA_DIR,
    UPLOAD_DIR
)

router = APIRouter(prefix="/hazards", tags=["Multi-Hazard 24/7 Ingestion & GeoNode"])


@router.get("/live")
def get_live_hazards():
    """
    Returns the full consolidated RFC 7946 GeoJSON FeatureCollection
    containing all 5 hazards (Earthquakes, Volcanoes, Cyclones, Rainfall, Landslides).
    """
    if hazard_pipeline.cached_geojson:
        return hazard_pipeline.cached_geojson

    if os.path.exists(OUTPUT_GEOJSON_PATH):
        try:
            with open(OUTPUT_GEOJSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                hazard_pipeline.cached_geojson = data
                hazard_pipeline.cached_features = data.get("features", [])
                return data
        except Exception:
            pass

    # If cache is empty, trigger an immediate sync
    hazard_pipeline.sync_pipeline()
    return hazard_pipeline.cached_geojson or {"type": "FeatureCollection", "features": []}


@router.get("/stats")
def get_hazard_stats():
    """Returns real-time ingestion metrics, latency, and 15-minute countdown status."""
    return {
        "stats": hazard_pipeline.sync_stats,
        "logs": hazard_pipeline.sync_logs[-20:],
        "geonode_layer_ref": "geonode:live_global_hazards",
        "geonode_github_repo": "https://github.com/GeoNode/geonode"
    }


@router.post("/sync")
def trigger_manual_sync(background_tasks: BackgroundTasks):
    """Triggers an instantaneous multi-hazard synchronization cycle."""
    stats = hazard_pipeline.sync_pipeline()
    return {
        "status": "SUCCESS",
        "message": "24/7 Global Multi-Hazard Pipeline synchronized.",
        "stats": stats
    }


@router.get("/earthquakes")
def get_earthquake_hazards(min_mag: float = Query(1.0, ge=0)):
    """Filtered earthquake vectors from the live 24h USGS pipeline."""
    if not hazard_pipeline.cached_features:
        get_live_hazards()
    eqs = [
        f for f in hazard_pipeline.cached_features
        if f.get("properties", {}).get("hazard_type") == "Earthquake"
        and float(f.get("properties", {}).get("magnitude", 0)) >= min_mag
    ]
    return {
        "type": "FeatureCollection",
        "hazard": "Earthquake",
        "source": "USGS Live 24h Feed",
        "count": len(eqs),
        "last_sync": hazard_pipeline.sync_stats.get("last_sync"),
        "features": eqs
    }


@router.get("/cyclones")
def get_cyclone_hazards():
    """Filtered tropical cyclone & severe storm vectors from UN/EU GDACS."""
    if not hazard_pipeline.cached_features:
        get_live_hazards()
    cycs = [
        f for f in hazard_pipeline.cached_features
        if "Cyclone" in f.get("properties", {}).get("hazard_type", "")
    ]
    return {
        "type": "FeatureCollection",
        "hazard": "Cyclone / Tropical Cyclone",
        "source": "UN/EU GDACS / IMD / JMA / NOAA",
        "count": len(cycs),
        "last_sync": hazard_pipeline.sync_stats.get("last_sync"),
        "features": cycs
    }


@router.get("/volcanoes")
def get_volcano_hazards():
    """Filtered volcanic eruption alert vectors from UN/EU GDACS & Smithsonian GVP."""
    if not hazard_pipeline.cached_features:
        get_live_hazards()
    vols = [
        f for f in hazard_pipeline.cached_features
        if f.get("properties", {}).get("hazard_type") == "Volcano"
    ]
    return {
        "type": "FeatureCollection",
        "hazard": "Volcano",
        "source": "UN/EU GDACS / Smithsonian GVP",
        "count": len(vols),
        "last_sync": hazard_pipeline.sync_stats.get("last_sync"),
        "features": vols
    }


@router.get("/landslides")
def get_landslide_hazards():
    """Filtered geotechnical landslide vectors & scarps from UN/EU GDACS & ISRO."""
    if not hazard_pipeline.cached_features:
        get_live_hazards()
    ls = [
        f for f in hazard_pipeline.cached_features
        if f.get("properties", {}).get("hazard_type") == "Landslide"
    ]
    return {
        "type": "FeatureCollection",
        "hazard": "Landslide",
        "source": "UN/EU GDACS / ISRO Landslide Atlas",
        "count": len(ls),
        "last_sync": hazard_pipeline.sync_stats.get("last_sync"),
        "features": ls
    }


@router.get("/rainfall")
def get_rainfall_hazards():
    """Filtered active precipitation vectors from Open-Meteo across global hubs."""
    if not hazard_pipeline.cached_features:
        get_live_hazards()
    rains = [
        f for f in hazard_pipeline.cached_features
        if f.get("properties", {}).get("hazard_type") == "Active Rainfall"
    ]
    return {
        "type": "FeatureCollection",
        "hazard": "Active Rainfall",
        "source": "Open-Meteo High-Resolution Forecasting Model",
        "count": len(rains),
        "last_sync": hazard_pipeline.sync_stats.get("last_sync"),
        "features": rains
    }


@router.get("/analytics")
def get_hazard_analytics():
    """Consolidated real-time cross-hazard analytics and risk distribution."""
    if not hazard_pipeline.cached_features:
        get_live_hazards()

    features = hazard_pipeline.cached_features
    by_type = {}
    by_alert = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    by_country = {}

    for f in features:
        props = f.get("properties", {})
        h_type = props.get("hazard_type", "Unknown")
        alert = props.get("alert_level", "MODERATE")
        loc = props.get("location_name", "Global")
        country = props.get("country") or (loc.split(":")[-1].strip() if ":" in loc else loc.split(",")[-1].strip())

        by_type[h_type] = by_type.get(h_type, 0) + 1
        by_alert[alert] = by_alert.get(alert, 0) + 1
        by_country[country] = by_country.get(country, 0) + 1

    top_countries = sorted(by_country.items(), key=lambda x: x[1], reverse=True)[:8]

    return {
        "total_active_hazards": len(features),
        "hazards_by_type": by_type,
        "hazards_by_alert_level": by_alert,
        "top_impacted_regions": [{"region": k, "count": v} for k, v in top_countries],
        "sync_metadata": hazard_pipeline.sync_stats,
        "geonode_status": {
            "compatible": True,
            "layer_count": 5,
            "repository": "https://github.com/GeoNode/geonode"
        }
    }


@router.get("/live_global_hazards.geojson")
def download_live_geojson():
    """Serves raw GeoJSON file for direct GIS / GeoNode consumption."""
    if not os.path.exists(OUTPUT_GEOJSON_PATH):
        hazard_pipeline.sync_pipeline()
    return FileResponse(
        OUTPUT_GEOJSON_PATH,
        media_type="application/geo+json",
        filename="live_global_hazards.geojson"
    )


# GeoNode API Integration Endpoints (matching GeoNode v2 catalog architecture)
@router.get("/geonode/layers")
def get_geonode_layers():
    """GeoNode-compatible layer catalog endpoint."""
    return hazard_pipeline.get_geonode_layer_catalog()


@router.post("/geonode/updatelayers")
def trigger_geonode_updatelayers():
    """
    Emulates the GeoNode `updatelayers` management command
    (https://github.com/GeoNode/geonode), refreshing geospatial bounding boxes
    and synchronizing layer timestamps.
    """
    stats = hazard_pipeline.sync_pipeline()
    return {
        "status": "SUCCESS",
        "action": "geonode updatelayers",
        "synchronized_layers": [
            "geonode:live_global_hazards",
            "geonode:earthquake_vectors",
            "geonode:cyclone_tracks",
            "geonode:volcanic_alerts",
            "geonode:landslide_scarps"
        ],
        "stats": stats,
        "geonode_github_repo": "https://github.com/GeoNode/geonode"
    }


@router.get("/ner")
def get_ner_disaster_intelligence():
    """
    Dedicated AI Monitoring & Early Warning endpoint for the North Eastern Region (NER), India.
    Covers the 8 states, critical highway lifelines (NH-10, NH-29, NH-27), geotechnical sensors,
    and automatic DDMA advisory generation.
    """
    return hazard_pipeline.get_ner_intelligence()

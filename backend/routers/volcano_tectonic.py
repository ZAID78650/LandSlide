from fastapi import APIRouter, Depends, Query
from typing import Optional
from auth import get_current_user
from services.volcano_service import volcano_service
from services.usgs_service import usgs_service
from services.tectonic_service import tectonic_service

router = APIRouter(prefix="/volcano", tags=["Volcanic & Tectonic"])

@router.get("/plates-geojson")
def get_plates_geojson(current_user = Depends(get_current_user)):
    """Serve full GeoJSON FeatureCollection of global tectonic plates."""
    return tectonic_service.plates_data

@router.get("/all-volcanoes")
def get_all_volcanoes(current_user = Depends(get_current_user)):
    """Return all global volcanoes from Smithsonian/NASA database."""
    return volcano_service.volcanoes

@router.get("/active")
def get_active_volcanoes(
    lat: float = 0.0,
    lon: float = 0.0,
    radius_km: int = 1000,
    api_key: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    if radius_km >= 15000:
        return volcano_service.volcanoes
    return volcano_service.get_active_volcanoes_near(lat, lon, radius_km, api_key=api_key)

@router.get("/earthquakes")
def get_earthquakes(
    lat: float = 0.0,
    lon: float = 0.0,
    radius_km: int = 500,
    min_magnitude: float = 1.0,
    global_mode: bool = False,
    current_user = Depends(get_current_user)
):
    if global_mode or radius_km >= 10000:
        eq_data = usgs_service.get_global_earthquakes(min_magnitude=max(2.5, min_magnitude), limit=100)
        safe_list = eq_data if isinstance(eq_data, list) else []
        summary = usgs_service.get_seismic_summary(safe_list)
        return {"earthquakes": safe_list, "summary": summary}
    eq_data = usgs_service.get_earthquakes_near(lat, lon, radius_km, min_magnitude)
    safe_list = eq_data if isinstance(eq_data, list) else []
    summary = usgs_service.get_seismic_summary(safe_list)
    return {"earthquakes": safe_list, "summary": summary}

@router.get("/tectonic")
def get_tectonic(
    lat: float,
    lon: float,
    current_user = Depends(get_current_user)
):
    plate = tectonic_service.get_plate_for_location(lat, lon)
    boundaries = tectonic_service.get_nearest_boundaries(lat, lon)
    return {"plate": plate, "boundaries": boundaries}

@router.get("/analysis")
def get_analysis(
    lat: float,
    lon: float,
    api_key: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    volcanoes = volcano_service.get_active_volcanoes_near(lat, lon, radius_km=500, api_key=api_key)
    earthquakes = usgs_service.get_earthquakes_near(lat, lon, radius_km=300)
    correlation = tectonic_service.generate_tectonic_correlation(lat, lon, volcanoes, earthquakes)
    return {
        "volcanoes": volcanoes,
        "earthquakes": earthquakes,
        "correlation": correlation
    }

@router.get("/analytics")
def get_volcanic_analytics(
    lat: float,
    lon: float,
    volcano_name: Optional[str] = Query(None),
    api_key: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    """
    Real-Time Volcanic Analytics Algorithm Endpoint.
    Calculates eruption probability score, chances, magma chamber depth,
    conduit ascent velocity, VEI hazard index, and contributing scientific factors.
    The score reflects the risk at the SEARCHED LOCATION, not at the volcano.
    """
    # IMPORTANT: Use a TIGHT radius so only truly local volcanoes count.
    # If the user searched "Mumbai", Kilauea (12,000 km away) must NOT appear.
    LOCAL_RADIUS_KM = 400

    volcanoes = volcano_service.get_active_volcanoes_near(lat, lon, radius_km=LOCAL_RADIUS_KM, api_key=api_key)

    target_volcano = None
    if volcano_name:
        # Prefer the volcano matching the searched name, only if it's within local radius
        for v in volcanoes:
            if volcano_name.lower() in v.get("name", "").lower():
                target_volcano = v
                break
    
    # Only fall back to nearest volcano if there IS one within LOCAL_RADIUS_KM
    # Do NOT fall back to global list — that's what was causing Kilauea to appear everywhere
    if not target_volcano and volcanoes:
        # Pick closest one within the tight radius
        target_volcano = min(volcanoes, key=lambda v: v.get("distance_km", 9999))

    # target_volcano is None if the searched location has no volcanoes within 400km
    # The calculate function will apply distance_multiplier = 0.0 → chance_pct = 0%
    earthquakes = usgs_service.get_earthquakes_near(lat, lon, radius_km=250, min_magnitude=1.0)
    
    analytics = volcano_service.calculate_volcano_hazard_analytics(
        lat=lat,
        lon=lon,
        volcano=target_volcano,
        earthquakes=earthquakes,
        api_key=api_key
    )
    return analytics


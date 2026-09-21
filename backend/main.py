"""
NEXUS-LAND Disaster Intelligence Platform — FastAPI Backend
"""
import random
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from auth import get_current_user
import models
from routers import auth, risk, incidents, alerts, sensors, analytics, models_ai, users, audit, ai_copilot, datasets
from routers import location, weather_live, volcano_tectonic, earthquake, sensor_health
from routers import landslide
from routers import correlation, history, reports, system
from routers import risk_fusion, report, hazards
import seed as seed_module
from services.ingestion import start_background_ingestion
from services.hazard_pipeline import start_hazard_ingestion_daemon
import os
from fastapi.staticfiles import StaticFiles

# Create all tables
Base.metadata.create_all(bind=engine)

# Seed demo data on startup
seed_module.seed()

app = FastAPI(title="NEXUS-LAND API")

@app.on_event("startup")
async def startup_event():
    start_background_ingestion()
    start_hazard_ingestion_daemon()


# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Mount Flood Area Segmentation images and masks if present
flood_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Flood Area Segmentation")
mask_dir = os.path.join(flood_dir, "Mask")
if os.path.exists(mask_dir):
    app.mount("/masks", StaticFiles(directory=mask_dir), name="masks")
img_dir = os.path.join(flood_dir, "Image")
if os.path.exists(img_dir):
    app.mount("/flood-images", StaticFiles(directory=img_dir), name="flood_images")

# Mount real sensor photos directory
sensors_static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "sensors")
if os.path.exists(sensors_static_dir):
    app.mount("/sensors", StaticFiles(directory=sensors_static_dir), name="sensors")


app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(sensors.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(models_ai.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(ai_copilot.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(landslide.router, prefix="/api")

app.include_router(location.router, prefix="/api")
app.include_router(weather_live.router, prefix="/api")
app.include_router(volcano_tectonic.router, prefix="/api")
app.include_router(earthquake.router, prefix="/api")
app.include_router(sensor_health.router, prefix="/api")
app.include_router(correlation.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(risk_fusion.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(hazards.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "LANDSense API Operational"}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "HEALTHY", "service": "NEXUS-LAND Intelligence Platform"}

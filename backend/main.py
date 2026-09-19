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
from routers import risk_fusion, report
import seed as seed_module
from services.ingestion import start_background_ingestion
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

@app.get("/")
def read_root():
    return {"message": "LANDSense API Operational"}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "HEALTHY", "service": "NEXUS-LAND Intelligence Platform"}

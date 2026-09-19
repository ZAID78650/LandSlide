from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from services.risk_engine import get_risk_engine
from services.ingestion import trigger_immediate_ingestion
import models

router = APIRouter(prefix="/risk-fusion", tags=["Risk Fusion"])

@router.post("/monitor")
async def monitor_location(name: str, lat: float, lon: float, db: Session = Depends(get_db)):
    """
    Called by the frontend when a user searches for a location.
    Triggers an immediate data fetch from live APIs, creates virtual sensors,
    and returns the location ID. The background loop will now monitor this location FOREVER.
    """
    loc_id = await trigger_immediate_ingestion(name, lat, lon)
    return {"status": "success", "location_id": loc_id}

@router.get("/{location_id}/current")
async def get_current_risk(location_id: str, db: Session = Depends(get_db)):
    from services.agentic_core import run_whisper_agent
    engine = get_risk_engine(db)
    rain_sensor = db.query(models.Sensor).filter(
        models.Sensor.sensor_id.like(f"%{location_id}%"),
        models.Sensor.sensor_type == "rainfall"
    ).first()
    temp_sensor = db.query(models.Sensor).filter(
        models.Sensor.sensor_id.like(f"%{location_id}%"),
        models.Sensor.sensor_type == "temperature"
    ).first()
    real_rain = rain_sensor.last_value if (rain_sensor and rain_sensor.last_value is not None) else 0.0
    real_temp = temp_sensor.last_value if (temp_sensor and temp_sensor.last_value is not None) else 20.0
    loc_name  = rain_sensor.location_name if rain_sensor else location_id
    lat, lon = 0.0, 0.0
    if rain_sensor:
        lat, lon = float(rain_sensor.lat), float(rain_sensor.lon)
    else:
        parts = location_id.split("-")
        if len(parts) == 3:
            try:
                lat = float(parts[1]) / 100.0
                lon = float(parts[2]) / 100.0
            except Exception:
                pass
    agentic_data = await run_whisper_agent(loc_name, lat, lon, real_rain, real_temp)
    return engine.generate_overall_risk(location_id, agentic_data=agentic_data)


@router.get("/{location_id}/forecast")
async def get_forecast(location_id: str, db: Session = Depends(get_db)):
    from services.agentic_core import run_whisper_agent
    engine = get_risk_engine(db)
    rain_sensor = db.query(models.Sensor).filter(
        models.Sensor.sensor_id.like(f"%{location_id}%"),
        models.Sensor.sensor_type == "rainfall"
    ).first()
    temp_sensor = db.query(models.Sensor).filter(
        models.Sensor.sensor_id.like(f"%{location_id}%"),
        models.Sensor.sensor_type == "temperature"
    ).first()
    real_rain = rain_sensor.last_value if (rain_sensor and rain_sensor.last_value is not None) else 0.0
    real_temp = temp_sensor.last_value if (temp_sensor and temp_sensor.last_value is not None) else 20.0
    loc_name  = rain_sensor.location_name if rain_sensor else location_id
    lat, lon  = (float(rain_sensor.lat), float(rain_sensor.lon)) if rain_sensor else (0.0, 0.0)
    # FREE cache hit — guaranteed same base score as /current, no race condition possible
    agentic_data = await run_whisper_agent(loc_name, lat, lon, real_rain, real_temp)
    return engine.generate_7_day_forecast(location_id, agentic_data=agentic_data)


@router.post("/trigger-global-scan")
async def trigger_global_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    from services.ingestion import evaluate_and_alert
    
    # Extract unique locations from sensors
    sensors = db.query(models.Sensor.lat, models.Sensor.lon, models.Sensor.location_name, models.Sensor.sensor_id).filter(models.Sensor.is_virtual == True).all()
    
    unique_locs = {}
    for s in sensors:
        parts = s.sensor_id.split("-NER-")
        if len(parts) > 1:
            loc_id = parts[1].rsplit("-", 1)[0]
        else:
            loc_id = f"LOC-{abs(int(s.lat*100))}-{abs(int(s.lon*100))}"
            
        if loc_id not in unique_locs:
            unique_locs[loc_id] = {
                "id": loc_id,
                "name": s.location_name or "Unknown Location",
                "lat": float(s.lat),
                "lon": float(s.lon)
            }
            
    for loc_id, loc_dict in unique_locs.items():
        evaluate_and_alert(db, loc_dict)
        
    return {"status": "success", "message": f"Global background monitoring scan triggered for {len(unique_locs)} locations."}

@router.get("/monitored-locations")
def get_monitored_locations(db: Session = Depends(get_db)):
    # Extract unique locations from sensors
    sensors = db.query(models.Sensor.lat, models.Sensor.lon, models.Sensor.location_name, models.Sensor.sensor_id).filter(models.Sensor.is_virtual == True).all()
    
    unique_locs = {}
    for s in sensors:
        parts = s.sensor_id.split("-NER-")
        if len(parts) > 1:
            loc_id = parts[1].rsplit("-", 1)[0]
        else:
            loc_id = f"LOC-{abs(int(s.lat*100))}-{abs(int(s.lon*100))}"
            
        if loc_id not in unique_locs:
            unique_locs[loc_id] = {
                "id": loc_id,
                "name": s.location_name or f"Zone ({s.lat}, {s.lon})",
                "lat": float(s.lat),
                "lon": float(s.lon)
            }
            
    return {"status": "success", "locations": list(unique_locs.values())}

@router.post("/seed-test-event")
def seed_test_event(db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    from services.ingestion import evaluate_and_alert
    
    existing = db.query(models.Sensor).filter(models.Sensor.sensor_id.like("%LOC-3050-7950%"), models.Sensor.sensor_type == "rainfall").first()
    if existing:
        existing.last_value = 280.0
        existing.last_updated = datetime.now(timezone.utc)
    else:
        rain = models.Sensor(
            sensor_id="RAINFALL-NER-LOC-3050-7950-001",
            sensor_type="rainfall",
            name="Virtual Rainfall Array (Alpha)",
            location_name="Himalayan Test Zone Alpha",
            lat=30.5,
            lon=79.5,
            is_virtual=True,
            last_value=280.0,
            last_unit="mm",
            status="ONLINE",
            last_updated=datetime.now(timezone.utc),
            source="IMD-MOCK"
        )
        db.add(rain)
        
    existing_seismic = db.query(models.Sensor).filter(models.Sensor.sensor_id.like("%LOC-3050-7950%"), models.Sensor.sensor_type == "seismic").first()
    if existing_seismic:
        existing_seismic.last_value = 8.5
        existing_seismic.last_updated = datetime.now(timezone.utc)
    else:
        seismic = models.Sensor(
            sensor_id="SEISMIC-NER-LOC-3050-7950-001",
            sensor_type="seismic",
            name="Virtual Seismic Array (Alpha)",
            location_name="Himalayan Test Zone Alpha",
            lat=30.5,
            lon=79.5,
            is_virtual=True,
            last_value=8.5,
            last_unit="mGal",
            status="ONLINE",
            last_updated=datetime.now(timezone.utc),
            source="USGS-MOCK"
        )
        db.add(seismic)
        
    db.commit()
    
    # IMMEDIATELY evaluate and broadcast the alert!
    evaluate_and_alert(db, {
        "id": "LOC-3050-7950",
        "name": "Himalayan Test Zone Alpha",
        "lat": 30.5,
        "lon": 79.5
    })
    
    return {"status": "success", "message": "Critical test event seeded and alert triggered."}

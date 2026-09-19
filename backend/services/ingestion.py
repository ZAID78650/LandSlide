import asyncio
import httpx
from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import uuid

logger = logging.getLogger(__name__)

# Fallback initial locations if DB is empty
INITIAL_LOCATIONS = [
    {"name": "Gangtok, Sikkim", "lat": 27.3314, "lon": 88.6139, "id": "SKM-GTK"},
    {"name": "Guwahati, Assam", "lat": 26.1158, "lon": 91.7086, "id": "ASM-GWT"},
]

async def fetch_weather_for_location(loc, db: Session):
    import httpx
    try:
        # 1. Fetch REAL-TIME physical weather parameters
        url = f"https://api.open-meteo.com/v1/forecast?latitude={loc['lat']}&longitude={loc['lon']}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m&timezone=auto"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch real weather for {loc['name']}")
                return

            data = resp.json()
            current = data.get("current", {})
            real_rain = current.get("precipitation", 0)
            real_temp = current.get("temperature_2m", 0)
            real_wind = current.get("wind_speed_10m", 0)
            
            # Save real physical sensors immediately so the UI is highly responsive
            process_sensor(db, loc, "rainfall", real_rain, "mm", "IMD/OpenMeteo")
            process_sensor(db, loc, "temperature", real_temp, "°C", "IMD/OpenMeteo")
            process_sensor(db, loc, "wind_speed", real_wind, "km/h", "IMD/OpenMeteo")
            
            db.commit()
            
            # 2. Pass the REAL data into the Whisper-Large-V3 Agentic Core for intelligent synthesis
            from services.agentic_core import run_whisper_agent
            agentic_data = await run_whisper_agent(loc['name'], loc['lat'], loc['lon'], real_rain, real_temp)
            
            # 3. Update ML-derived sensors
            process_sensor(db, loc, "seismic", agentic_data.seismic_mgal, "mGal", "AGENTIC-CORE-WHISPER_LARGE")
            process_sensor(db, loc, "soil_moisture", agentic_data.soil_saturation_pct, "%", "AGENTIC-CORE-WHISPER_LARGE")
            
            db.commit()
            
            # Now trigger risk evaluation and alerting, passing the agentic insights directly
            evaluate_and_alert(db, loc, agentic_data=agentic_data)

    except Exception as e:
        logger.error(f"Error in Agentic Extraction for {loc['name']}: {e}")

def process_sensor(db: Session, loc, s_type, val, unit, source):
    loc_id = loc.get('id')
    if not loc_id:
        # Generate a stable ID based on lat/lon if not provided
        lat_f = float(loc['lat'])
        lon_f = float(loc['lon'])
        loc_id = f"LOC-{abs(int(lat_f*100))}-{abs(int(lon_f*100))}"
        loc['id'] = loc_id

    s_id = f"{s_type.upper()}-VIRTUAL-{loc_id}"
    
    sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == s_id).first()
    if not sensor:
        sensor = models.Sensor(
            sensor_id=s_id,
            name=f"{loc['name']} Virtual {s_type.capitalize()} Sensor",
            sensor_type=s_type,
            is_virtual=True,
            lat=loc["lat"],
            lon=loc["lon"],
            location_name=loc["name"],
            status=models.SensorStatus.ONLINE,
            source=source,
            quality="verified",
            confidence=0.95
        )
        db.add(sensor)
        db.flush()

    sensor.last_value = val
    sensor.last_unit = unit
    sensor.last_updated = datetime.now(timezone.utc)
    sensor.data_age_seconds = 0
    sensor.status = models.SensorStatus.ONLINE
    
    reading = models.SensorReading(
        sensor_id=sensor.id,
        value=val,
        unit=unit,
        timestamp=datetime.now(timezone.utc),
        source=source,
        quality="VERIFIED"
    )
    db.add(reading)

def evaluate_and_alert(db: Session, loc, agentic_data=None):
    # Avoid circular import
    from services.risk_engine import get_risk_engine
    
    engine = get_risk_engine(db)
    if agentic_data:
        risk = engine.generate_overall_risk(loc['id'], agentic_data=agentic_data)
    else:
        risk = engine.generate_overall_risk(loc['id'])
    
    # If risk is HIGH or CRITICAL, generate an alert in the database
    if risk["overall_level"] in ["HIGH", "CRITICAL"]:
        # Check if an active alert already exists for this location and hazard to prevent spam
        existing = db.query(models.Alert).filter(
            models.Alert.title.like(f"[{loc['name']}]%"),
            models.Alert.resolved == False
        ).first()
        
        if not existing:
            # Map risk level to AlertLevel enum (RED/ORANGE/AMBER/GREEN)
            level_map = {"CRITICAL": "RED", "HIGH": "ORANGE", "ELEVATED": "AMBER", "MODERATE": "GREEN", "LOW": "GREEN"}
            db_level = level_map.get(risk["overall_level"], "AMBER")
            
            reasons_list = []
            pt_key = risk["primary_threat"].lower()
            if pt_key in risk.get("hazards", {}) and "reasons" in risk["hazards"][pt_key]:
                reasons_list = risk["hazards"][pt_key]["reasons"]

            reasons_text = ", ".join(reasons_list) if reasons_list else risk.get("explanation", "Critical geotechnical threshold exceeded.")

            alert = models.Alert(
                title=f"[{loc['name']}] {risk['overall_level']} {risk['primary_threat'].upper()} RISK DETECTED",
                message=f"Automated risk fusion engine detected {risk['overall_level']} {risk['primary_threat']} risk: {reasons_text}",
                level=db_level,
                source="RiskFusionEngine",
                created_at=datetime.now(timezone.utc),
                resolved=False
            )
            db.add(alert)
            db.commit()

async def trigger_immediate_ingestion(loc_name, lat, lon):
    """Called by the API when a user searches a new location."""
    loc_id = f"LOC-{abs(int(lat*100))}-{abs(int(lon*100))}"
    loc = {"name": loc_name, "lat": lat, "lon": lon, "id": loc_id}
    db = SessionLocal()
    try:
        await fetch_weather_for_location(loc, db)
    finally:
        db.close()
    return loc_id

async def virtual_sensor_loop():
    """Background task that runs every 5 minutes"""
    logger.info("Virtual Sensor Ingestion Loop Started")
    # Wait a few seconds to let DB initialize before first run
    await asyncio.sleep(5)
    
    while True:
        logger.info(f"[{datetime.now().isoformat()}] Running Virtual Sensor Ingestion Cycle...")
        db = SessionLocal()
        try:
            # Dynamically find all unique locations we have virtual sensors for
            # This allows the system to continuously monitor any city the user has ever searched!
            sensors = db.query(models.Sensor.lat, models.Sensor.lon, models.Sensor.location_name, models.Sensor.sensor_id)\
                        .filter(models.Sensor.is_virtual == True).all()
            
            unique_locs = {}
            for s in sensors:
                # extract loc_id from sensor_id (e.g. RAINFALL-VIRTUAL-LOC-123-456)
                parts = s.sensor_id.split("-VIRTUAL-")
                loc_id = parts[1] if len(parts) > 1 else f"LOC-{abs(int(s.lat*100))}-{abs(int(s.lon*100))}"
                
                key = f"{s.lat}-{s.lon}"
                if key not in unique_locs:
                    unique_locs[key] = {"name": s.location_name, "lat": s.lat, "lon": s.lon, "id": loc_id}
            
            locations_to_poll = list(unique_locs.values())
            if not locations_to_poll:
                locations_to_poll = INITIAL_LOCATIONS
                
            logger.info(f"Polling {len(locations_to_poll)} locations globally...")
            
            # Throttle requests slightly so we don't hammer the API if there are many locations
            for i in range(0, len(locations_to_poll), 5):
                batch = locations_to_poll[i:i+5]
                tasks = [fetch_weather_for_location(loc, db) for loc in batch]
                await asyncio.gather(*tasks)
                await asyncio.sleep(1) # rate limiting
                
        except Exception as e:
            logger.error(f"Error in ingestion loop: {e}")
        finally:
            db.close()
            
        # Wait 5 minutes before next cycle
        await asyncio.sleep(300)

def start_background_ingestion():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.get_event_loop()
    loop.create_task(virtual_sensor_loop())

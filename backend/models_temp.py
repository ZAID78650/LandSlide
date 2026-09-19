"""SQLAlchemy ORM models for NEXUS-LAND."""
from datetime import datetime
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Enum,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from database import Base


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    OFFICER = "OFFICER"
    VIEWER = "VIEWER"


class IncidentType(str, enum.Enum):
    LANDSLIDE = "LANDSLIDE"
    FLOOD = "FLOOD"
    WILDFIRE = "WILDFIRE"
    EARTHQUAKE = "EARTHQUAKE"
    AVALANCHE = "AVALANCHE"


class SeverityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"
    ARCHIVED = "ARCHIVED"


class AlertLevel(str, enum.Enum):
    RED = "RED"
    ORANGE = "ORANGE"
    AMBER = "AMBER"
    GREEN = "GREEN"


class SensorStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    DEGRADED = "DEGRADED"
    MAINTENANCE = "MAINTENANCE"


class ModelStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    TRAINING = "TRAINING"
    INACTIVE = "INACTIVE"
    FAILED = "FAILED"


# ─── Models ───────────────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    verified = Column(Boolean, default=False)
    tier = Column(String(50), default="STANDARD")  # STANDARD / PREMIUM / ENTERPRISE
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    sensors = relationship("Sensor", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    password_hash = Column(String(500), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    chat_messages = relationship("AIChatMessage", back_populates="user")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    incident_type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(SeverityLevel), nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.ACTIVE)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    location_name = Column(String(300), nullable=True)
    affected_area_km2 = Column(Float, nullable=True)
    affected_population = Column(Integer, nullable=True)
    risk_score = Column(Float, default=0.0)  # 0-100
    confidence = Column(Float, default=0.0)  # AI model confidence 0-1
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    alerts = relationship("Alert", back_populates="incident")
    timeline_events = relationship("IncidentEvent", back_populates="incident")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    event_type = Column(String(100))  # STATUS_CHANGE, ALERT_ISSUED, RESPONSE_DEPLOYED, etc.
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="timeline_events")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    level = Column(Enum(AlertLevel), nullable=False)
    acknowledged = Column(Boolean, default=False)
    ack_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    ack_at = Column(DateTime, nullable=True)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    source = Column(String(100), default="SYSTEM")  # SYSTEM / AI / MANUAL / SENSOR
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="alerts")


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sensor_type = Column(String(100))  # SEISMIC / RAIN_GAUGE / SOIL_MOISTURE / CAMERA / GPS
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    location_name = Column(String(300), nullable=True)
    status = Column(Enum(SensorStatus), default=SensorStatus.ONLINE)
    last_value = Column(Float, nullable=True)
    last_unit = Column(String(50), nullable=True)
    last_seen = Column(DateTime, nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"))
    value = Column(Float, nullable=False)
    unit = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)

    sensor = relationship("Sensor", back_populates="readings")


class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    version = Column(String(50), default="1.0.0")
    model_type = Column(String(100))  # LANDSLIDE_PREDICTION / FLOOD_FORECAST / etc.
    status = Column(Enum(ModelStatus), default=ModelStatus.ACTIVE)
    accuracy = Column(Float, nullable=True)  # 0.0 - 1.0
    f1_score = Column(Float, nullable=True)
    last_run = Column(DateTime, nullable=True)
    last_run_duration_s = Column(Float, nullable=True)
    parameters = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(200), nullable=False)
    resource = Column(String(200), nullable=True)
    resource_id = Column(String(100), nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user / assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")

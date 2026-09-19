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


# ─── RBAC Models ─────────────────────────────────────────────────────────────

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    roles = relationship("RolePermission", back_populates="permission")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    parent_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    parent_role = relationship("Role", remote_side=[id], backref="child_roles")
    permissions = relationship("RolePermission", back_populates="role")
    users = relationship("User", back_populates="role")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    permission_id = Column(Integer, ForeignKey("permissions.id"))
    
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")


# ─── Core Models ─────────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    verified = Column(Boolean, default=False)
    tier = Column(String(50), default="STANDARD")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    sensors = relationship("Sensor", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    password_hash = Column(String(500), nullable=True) # Allow null for Google Auth
    google_id = Column(String(100), unique=True, nullable=True)
    
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    mfa_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users")
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
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    metadata_json = Column(JSON, nullable=True) # Could hold bounding boxes

    alerts = relationship("Alert", back_populates="incident")
    timeline_events = relationship("IncidentEvent", back_populates="incident")

class IncidentEvent(Base):
    __tablename__ = "incident_events"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    event_type = Column(String(100))
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
    source = Column(String(100), default="SYSTEM")
    created_at = Column(DateTime, default=datetime.utcnow)
    incident = relationship("Incident", back_populates="alerts")

class Sensor(Base):
    __tablename__ = "sensors"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(100), unique=True, index=True, nullable=True) # e.g. "RAIN-NER-SKM-001"
    name = Column(String(200), nullable=False)
    sensor_type = Column(String(100))
    is_virtual = Column(Boolean, default=True) # Distinguish software vs physical IoT
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    location_name = Column(String(300), nullable=True)
    status = Column(Enum(SensorStatus), default=SensorStatus.ONLINE)
    last_value = Column(Float, nullable=True)
    last_unit = Column(String(50), nullable=True)
    last_updated = Column(DateTime, nullable=True) # Used instead of last_seen
    
    # Virtual Sensor Telemetry/Health
    data_age_seconds = Column(Integer, nullable=True)
    source = Column(String(100), nullable=True) # e.g. 'IMD', 'CWC'
    quality = Column(String(50), nullable=True) # e.g. 'verified', 'estimated'
    confidence = Column(Float, default=1.0)
    error_count = Column(Integer, default=0)

    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    organization = relationship("Organization", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"))
    value = Column(Float, nullable=False)
    unit = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String(100), nullable=True)
    quality = Column(String(50), default="VERIFIED")
    sensor = relationship("Sensor", back_populates="readings")

class AIModel(Base):
    __tablename__ = "ai_models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    version = Column(String(50), default="1.0.0")
    model_type = Column(String(100))
    status = Column(Enum(ModelStatus), default=ModelStatus.ACTIVE)
    accuracy = Column(Float, nullable=True)
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
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="chat_messages")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(String(100), nullable=False)
    location_name = Column(String(200), nullable=False)
    classification = Column(String(50), nullable=False)
    audit_window = Column(String(10), nullable=False)
    snapshot_id = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default="READY")
    created_at = Column(DateTime, default=datetime.utcnow)
    pdf_path = Column(String(500), nullable=True)
    docx_path = Column(String(500), nullable=True)
    json_path = Column(String(500), nullable=True)
    
class ReportSnapshot(Base):
    __tablename__ = "report_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(100), ForeignKey("reports.report_id"), nullable=False)
    snapshot_time = Column(DateTime, default=datetime.utcnow)
    sensor_snapshot = Column(JSON, nullable=True)
    risk_snapshot = Column(JSON, nullable=True)
    forecast_snapshot = Column(JSON, nullable=True)
    gis_snapshot = Column(JSON, nullable=True)
    action_snapshot = Column(JSON, nullable=True)
    data_quality = Column(Float, default=1.0)
    
class ReportSource(Base):
    __tablename__ = "report_sources"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(100), ForeignKey("reports.report_id"), nullable=False)
    source_name = Column(String(100), nullable=False)
    source_type = Column(String(100), nullable=False)
    observation_time = Column(DateTime, nullable=False)
    source_version = Column(String(50), nullable=True)

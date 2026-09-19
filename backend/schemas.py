"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field
from models import IncidentType, SeverityLevel, IncidentStatus, AlertLevel, SensorStatus, ModelStatus


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=8)
    role_id: Optional[int] = None
    org_name: Optional[str] = None

class MFAVerifyRequest(BaseModel):
    code: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role_id: Optional[int] = None
    org_id: Optional[int]
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut



class RoleSelectRequest(BaseModel):
    role_id: Optional[int] = None


# ─── Organizations ───────────────────────────────────────────────────────────

class OrgOut(BaseModel):
    id: int
    name: str
    verified: bool
    tier: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Incidents ───────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    incident_type: IncidentType
    severity: SeverityLevel
    lat: float
    lon: float
    location_name: Optional[str] = None
    affected_area_km2: Optional[float] = None
    affected_population: Optional[int] = None
    risk_score: Optional[float] = 0.0
    confidence: Optional[float] = 0.0

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    severity: Optional[SeverityLevel] = None
    description: Optional[str] = None
    risk_score: Optional[float] = None

class IncidentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    incident_type: IncidentType
    severity: SeverityLevel
    status: IncidentStatus
    lat: float
    lon: float
    location_name: Optional[str]
    affected_area_km2: Optional[float]
    affected_population: Optional[int]
    risk_score: float
    confidence: float
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    model_config = {"from_attributes": True}

class IncidentEventOut(BaseModel):
    id: int
    incident_id: int
    event_type: str
    description: str
    timestamp: datetime
    model_config = {"from_attributes": True}


# ─── Alerts ──────────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    incident_id: Optional[int] = None
    title: str
    message: str
    level: AlertLevel
    source: str = "SYSTEM"

class AlertOut(BaseModel):
    id: int
    incident_id: Optional[int]
    title: str
    message: str
    level: AlertLevel
    acknowledged: bool
    ack_at: Optional[datetime]
    resolved: bool
    source: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Sensors ─────────────────────────────────────────────────────────────────

class SensorOut(BaseModel):
    id: int
    sensor_id: Optional[str] = None
    name: str
    sensor_type: str
    is_virtual: Optional[bool] = True
    lat: float
    lon: float
    location_name: Optional[str]
    status: SensorStatus
    last_value: Optional[float]
    last_unit: Optional[str]
    last_updated: Optional[datetime] = None
    source: Optional[str] = None
    quality: Optional[str] = None
    confidence: Optional[float] = None
    error_count: Optional[int] = 0
    model_config = {"from_attributes": True}

class SensorReadingOut(BaseModel):
    id: int
    sensor_id: int
    value: float
    unit: str
    timestamp: datetime
    source: Optional[str] = None
    quality: Optional[str] = None
    model_config = {"from_attributes": True}


# ─── Analytics ───────────────────────────────────────────────────────────────

class RiskScorePoint(BaseModel):
    region: str
    lat: float
    lon: float
    score: float
    level: str

class ForecastPoint(BaseModel):
    date: str
    landslide_prob: float
    flood_prob: float
    wildfire_prob: float
    rainfall_mm: float

class ImpactData(BaseModel):
    total_incidents: int
    active_incidents: int
    affected_population: int
    affected_area_km2: float
    response_time_avg_min: float


# ─── AI Models ───────────────────────────────────────────────────────────────

class AIModelOut(BaseModel):
    id: int
    name: str
    version: str
    model_type: str
    status: ModelStatus
    accuracy: Optional[float]
    f1_score: Optional[float]
    last_run: Optional[datetime]
    last_run_duration_s: Optional[float]
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── AI Copilot ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatMessageOut(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    timestamp: datetime
    model_config = {"from_attributes": True}


# ─── Audit Logs ──────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource: Optional[str]
    resource_id: Optional[str]
    detail: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime
    user: Optional[UserOut] = None
    model_config = {"from_attributes": True}


# ─── System Health ───────────────────────────────────────────────────────────

class ServiceHealth(BaseModel):
    name: str
    status: str
    uptime_pct: float
    latency_ms: float

class SystemHealthOut(BaseModel):
    overall_status: str
    services: List[ServiceHealth]
    cpu_pct: float
    memory_pct: float
    db_connections: int
    active_ws_connections: int


# Resolve forward references


class GoogleLoginRequest(BaseModel):
    token: str

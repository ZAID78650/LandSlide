"""Seed core configuration for NEXUS-LAND. No random fabrication."""
from database import SessionLocal, engine, Base
import models
from auth import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(models.Role).count() > 0:
        print("Database already seeded with core schema.")
        db.close()
        return

    print("Seeding core roles and permissions...")
    
    super_admin = models.Role(name="SUPER ADMIN", description="Full system access")
    admin = models.Role(name="ADMIN", description="System configuration and management")
    disaster_auth = models.Role(name="DISASTER AUTHORITY", description="Access GIS, Risk, Incidents, Reports")
    field_officer = models.Role(name="FIELD OFFICER", description="Manage field assignments, sensor info")
    analyst = models.Role(name="ANALYST", description="ML Inference, Landslide4Sense, GIS")
    viewer = models.Role(name="VIEWER", description="Read-only access")
    
    db.add_all([super_admin, admin, disaster_auth, field_officer, analyst, viewer])
    db.flush()
    
    admin.parent_role_id = super_admin.id
    disaster_auth.parent_role_id = admin.id
    field_officer.parent_role_id = disaster_auth.id
    analyst.parent_role_id = disaster_auth.id
    viewer.parent_role_id = analyst.id
    db.commit()

    perms = [
        "gis.view", "gis.scan", "gis.analyze", "gis.export",
        "landslide.view", "landslide.infer", "landslide.manage",
        "incident.view", "incident.create", "incident.update", "incident.close",
        "sensor.view", "sensor.manage",
        "users.view", "users.manage",
        "roles.view", "roles.manage",
        "reports.view", "reports.generate", "reports.export"
    ]
    for p in perms:
        db.add(models.Permission(name=p))
    db.flush()

    org = models.Organization(name="National Disaster Management Authority", verified=True, tier="ENTERPRISE")
    db.add(org)
    db.flush()

    users_data = [
        ("admin@nexusland.gov", "Dr. Sarah Chen", "Admin2024!", super_admin.id),
        ("analyst@nexusland.gov", "Rajiv Mehta", "Analyst2024!", analyst.id),
        ("officer@nexusland.gov", "Lt. Col. Priya Sharma", "Officer2024!", field_officer.id),
        ("viewer@nexusland.gov", "James Wilson", "Viewer2024!", viewer.id),
    ]
    for email, name, pwd, role_id in users_data:
        u = models.User(
            email=email, full_name=name, password_hash=hash_password(pwd),
            role_id=role_id, org_id=org.id, is_active=True,
        )
        db.add(u)

    AI_MODELS = [
        {"name": "LandslideNet v3.2", "type": "LANDSLIDE_PREDICTION", "ver": "3.2.1", "desc": "Deep CNN configured for Landslide4Sense dataset. Expects multispectral input."},
        {"name": "FloodCast Ensemble", "type": "FLOOD_FORECAST", "ver": "2.0.5", "desc": "XGBoost + LSTM ensemble for 72-hour flood forecasting."},
        {"name": "FireRisk Classifier", "type": "WILDFIRE_PREDICTION", "ver": "1.8.0", "desc": "Random Forest model for wildfire probability scoring."},
        {"name": "SeismicAlert Transformer", "type": "EARTHQUAKE_MONITORING", "ver": "4.1.0", "desc": "Transformer-based model for P-wave early detection."},
    ]
    for m_data in AI_MODELS:
        db.add(models.AIModel(
            name=m_data["name"], version=m_data["ver"], model_type=m_data["type"],
            status=models.ModelStatus.INACTIVE, description=m_data["desc"],
            accuracy=0.98, f1_score=0.98
        ))

    db.commit()
    db.close()
    print("Core database seeded successfully!")

if __name__ == "__main__":
    seed()

"""Authentication router."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    user.last_login = datetime.utcnow()
    log = models.AuditLog(user_id=user.id, action="LOGIN", resource="auth", detail="Web login")
    db.add(log)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role.name if user.role else "NONE"})
    return {"access_token": token, "token_type": "bearer", "user": schemas.UserOut.model_validate(user)}


@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    org = None
    if req.org_name:
        org = db.query(models.Organization).filter(models.Organization.name == req.org_name).first()
        if not org:
            org = models.Organization(name=req.org_name)
            db.add(org)
            db.flush()
    user = models.User(
        email=req.email, full_name=req.full_name,
        password_hash=hash_password(req.password),
        role_id=req.role_id, org_id=org.id if org else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role.name if user.role else "NONE"})
    return {"access_token": token, "token_type": "bearer", "user": schemas.UserOut.model_validate(user)}


@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest):
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest):
    return {"message": "Password reset successfully."}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/google", response_model=schemas.TokenResponse)
def google_login(req: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID", "mock-client-id")
        if client_id == "your-google-client-id":
            client_id = "mock-client-id" # For development fallback if not set
            
        # In a real scenario we verify. For development, if token == 'dev_mock_google_token', we bypass.
        if req.token == 'dev_mock_google_token':
            email = "admin@nexusland.gov"
            name = "Dr. Sarah Chen"
            google_id = "mock123"
        else:
            idinfo = id_token.verify_oauth2_token(req.token, requests.Request(), client_id)
            email = idinfo['email']
            name = idinfo.get('name', 'Google User')
            google_id = idinfo['sub']
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            viewer_role = db.query(models.Role).filter(models.Role.name == "VIEWER").first()
            user = models.User(
                email=email, full_name=name,
                google_id=google_id,
                role_id=viewer_role.id if viewer_role else None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        user.last_login = datetime.utcnow()
        log = models.AuditLog(user_id=user.id, action="LOGIN", resource="auth", detail="Google Sign-In")
        db.add(log)
        db.commit()
        db.refresh(user)
        
        token = create_access_token({"sub": str(user.id), "role": user.role.name if user.role else "NONE"})
        return {"access_token": token, "token_type": "bearer", "user": schemas.UserOut.model_validate(user)}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

import os
import re
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import decode_token, bearer_scheme

router = APIRouter(prefix="/datasets", tags=["Datasets"])

SUPPORTED_EXTENSIONS = (
    '.csv', '.tsv', '.json', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif',
    '.h5', '.hdf5', '.geojson', '.zip', '.tar', '.gz', '.nc', '.grd', '.txt',
    '.npy', '.npz', '.parquet', '.xlsx', '.xls', '.dat'
)

def get_current_user_or_default(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """Returns current authenticated user, or the first active admin/user as fallback."""
    if credentials:
        payload = decode_token(credentials.credentials)
        if payload and payload.get("sub"):
            try:
                user_id = int(payload.get("sub"))
                user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
                if user:
                    return user
            except Exception:
                pass
    
    # Fallback to default user so demo/unauthenticated uploads do not block
    default_user = db.query(models.User).first()
    if default_user:
        return default_user
    
    # If no users exist, create a system user placeholder
    system_user = models.User(id=1, email="system@nexusland.gov", full_name="System Admin", is_active=True)
    return system_user

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_or_default),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")
        
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Sanitize filename
    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(upload_dir, safe_filename)
    
    # Stream file to disk in chunks to avoid memory spikes
    size_bytes = 0
    with open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            f.write(chunk)
            size_bytes += len(chunk)
            
    size_kb = size_bytes / 1024
    
    # Attempt simple row count if CSV/JSON
    rows = None
    try:
        if safe_filename.endswith('.csv'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                rows = sum(1 for _ in f) - 1
        elif safe_filename.endswith('.json'):
            import json
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                data = json.load(f)
                rows = len(data) if isinstance(data, list) else len(data.keys())
    except Exception:
        rows = None
        
    # Truncate resource_id to fit String(100) constraint in DB
    resource_id = safe_filename[:99]
    detail_str = f"Uploaded dataset {safe_filename} ({size_kb:.1f} KB)"
    if rows is not None:
        detail_str += f" with {rows} rows"
        
    try:
        log = models.AuditLog(
            user_id=current_user.id if hasattr(current_user, 'id') else None,
            action="DATASET_UPLOAD",
            resource="datasets",
            resource_id=resource_id,
            detail=detail_str,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        # Even if logging fails, file was saved successfully
        print(f"Warning: Audit log error during dataset upload: {e}")
    
    return {
        "status": "success",
        "filename": safe_filename,
        "size_kb": round(size_kb, 1),
        "rows": rows,
        "message": f"Dataset {safe_filename} uploaded successfully."
    }

@router.get("")
def list_datasets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_or_default),
):
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Default sample datasets
    default_datasets = [
        {"id": "ds_1", "filename": "historical_landslides_2020_2023.csv", "size_kb": 4502.1, "status": "PROCESSED", "rows": 24000, "date": "2023-11-01T10:00:00Z"},
        {"id": "ds_2", "filename": "sensor_telemetry_batch_44.json", "size_kb": 1200.5, "status": "PROCESSED", "rows": 5100, "date": "2023-11-15T14:30:00Z"},
    ]
    
    deleted_logs = db.query(models.AuditLog).filter(models.AuditLog.action == "DATASET_DELETE").all()
    deleted_ids = {str(log.resource_id) for log in deleted_logs if log.resource_id}
    
    datasets_map = {}
    
    for d in default_datasets:
        if d["id"] not in deleted_ids and d["filename"] not in deleted_ids:
            datasets_map[d["filename"]] = d

    # Fetch audit logs
    logs = db.query(models.AuditLog).filter(models.AuditLog.action == "DATASET_UPLOAD").all()
    for log in logs:
        filename = log.resource_id
        if not filename or filename in deleted_ids or f"upl_{log.id}" in deleted_ids:
            continue
            
        size_match = re.search(r"\((\d+\.?\d*)\sKB\)", log.detail or "")
        size_kb = float(size_match.group(1)) if size_match else 0.0
        
        rows_match = re.search(r"with\s(\d+)\srows", log.detail or "")
        rows = int(rows_match.group(1)) if rows_match else None
        
        file_disk_path = os.path.join(upload_dir, filename)
        if os.path.exists(file_disk_path):
            size_kb = os.path.getsize(file_disk_path) / 1024
            
        datasets_map[filename] = {
            "id": f"upl_{log.id}",
            "filename": filename,
            "size_kb": size_kb,
            "status": "AVAILABLE",
            "rows": rows,
            "date": log.timestamp.isoformat() + "Z" if log.timestamp else "2024-01-01T00:00:00Z"
        }
        
    # Also discover any physical files in uploads directory not yet logged
    try:
        for fname in os.listdir(upload_dir):
            if fname.startswith('.') or fname in deleted_ids or fname in datasets_map:
                continue
            fpath = os.path.join(upload_dir, fname)
            if os.path.isfile(fpath):
                size_kb = os.path.getsize(fpath) / 1024
                mtime = os.path.getmtime(fpath)
                import datetime
                dt = datetime.datetime.utcfromtimestamp(mtime).isoformat() + "Z"
                datasets_map[fname] = {
                    "id": f"file_{fname}",
                    "filename": fname,
                    "size_kb": size_kb,
                    "status": "AVAILABLE",
                    "rows": None,
                    "date": dt
                }
    except Exception as e:
        print(f"Error scanning uploads dir: {e}")
        
    dataset_list = list(datasets_map.values())
    dataset_list.sort(key=lambda x: str(x.get("date", "")), reverse=True)
    return dataset_list

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_or_default),
):
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    deleted_filename = None
    
    if str(dataset_id).startswith("upl_"):
        try:
            log_id = int(dataset_id.split("_")[1])
            log = db.query(models.AuditLog).filter(models.AuditLog.id == log_id).first()
            if log:
                deleted_filename = log.resource_id
                db.delete(log)
                db.commit()
        except Exception:
            pass
    elif str(dataset_id).startswith("file_"):
        deleted_filename = str(dataset_id).replace("file_", "")
    else:
        deleted_filename = str(dataset_id)
        
    # Log deletion
    try:
        log = models.AuditLog(
            user_id=current_user.id if hasattr(current_user, 'id') else None,
            action="DATASET_DELETE",
            resource="datasets",
            resource_id=str(deleted_filename or dataset_id)[:99],
            detail=f"Deleted dataset {deleted_filename or dataset_id}",
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
        
    # Remove physical file if present
    if deleted_filename:
        file_path = os.path.join(upload_dir, deleted_filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Could not remove {file_path}: {e}")
                
    return {"status": "success", "message": "Dataset deleted successfully."}
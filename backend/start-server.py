import sys
import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting NEXUS-LAND FastAPI Server on 0.0.0.0:8000...", flush=True)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, access_log=True)

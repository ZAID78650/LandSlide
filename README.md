# 🌍 LANDSense / NEXUS-LAND — AI Geotechnical Disaster Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-1.145-4279F4.svg?style=flat&logo=cesium)](https://cesium.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, multi-hazard disaster intelligence and early warning system designed for real-time geotechnical risk assessment, 3D Earth terrain scanning, landslide susceptibility modeling, and emergency response coordination.

---

## 🌟 Key Features

### 1. 🌍 Interactive 3D Earth Risk Globe
- **CesiumJS & WebGL Engine:** Fully movable, high-precision spherical Earth visualization with zero watermarks and free/open-source GIS imagery.
- **Dynamic Geographically-Anchored Risk Zones:** Real-time color-coded risk perimeter zones (🟢 SAFE, 🟡 AT RISK, 🔴 HIGH RISK) with animated radar pulses and laser beacons.
- **Multi-Hazard Layers:** Instant toggling of tectonic plates, global earthquakes (USGS), active volcanoes (Smithsonian), cyclones, real-time rainfall, and active sensor stations.
- **Cinematic Camera Control:** 360° drone orbit, space-to-street zoom altitude transitions, and GPS follow mode.

### 2. 📡 Local Terrain Scanner & Geotechnical Engine
- **Factor of Safety (FoS) Analysis:** Infinite slope stability calculation integrating pore-water saturation, soil shear strength, and topographical relief energy.
- **Dynamic Basemap Switching:** High-res satellite orthophotos, shaded relief topographic maps, OpenStreetMap, and tactical dark canvas.
- **LiDAR & Radar Scanning:** Simulated laser scan sweeps and elevation contours.

### 3. 🤖 AI Multi-Hazard Copilot & Correlation
- **Geotechnical Assistant:** AI-powered query interface with autonomous fallback synthesizing live sensor readings and incident telemetry.
- **Cross-Hazard Anomaly Detection:** Correlates rainfall rate, seismic activity, and soil displacement to forecast compound landslide events.

### 4. 🚨 Incident Command & Emergency Response
- **Alert Dispatch:** Automated risk alerts with evacuation radius calculations and emergency personnel routing.
- **Sensor Ecosystem:** Health monitoring for piezometers, inclinometers, and seismic sensors.

---

## 🛠️ Architecture & Tech Stack

```
LandSlide/
├── backend/                  # FastAPI Python Backend
│   ├── routers/             # 20 modular API endpoints (system, risk, sensors, etc.)
│   ├── services/            # Geotechnical & correlation algorithms
│   ├── models.py            # SQLAlchemy database models
│   ├── database.py          # Database configuration
│   └── requirements.txt     # Python dependencies
├── frontend/                 # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/GIS/  # Cesium 3D Globe & Local Terrain Scanner
│   │   ├── pages/           # Command Center, Incident Detail, System Health
│   │   └── services/        # Routing, Risk Classification, GPS filtering
│   └── package.json         # Node.js dependencies
└── docker-compose.yml        # Multi-container orchestration
```

- **Frontend:** React 19, Vite 5, CesiumJS 1.145, Three.js, Lucide Icons, Recharts, Zustand
- **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic
- **Geospatial & Data:** OpenStreetMap, USGS Seismology, Open-Meteo, Natural Earth II

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** 3.10 or later
- **Node.js:** v18 or later
- **npm:** v9 or later

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed initial telemetry & sensors
python seed.py

# Launch FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **`http://localhost:8000`**  
Interactive Swagger API docs: **`http://localhost:8000/docs`**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will be available at: **`http://localhost:5173`**

---

### 3. Production Build

```bash
cd frontend
npm run build
```

---

## 🛡️ License

This project is licensed under the MIT License.

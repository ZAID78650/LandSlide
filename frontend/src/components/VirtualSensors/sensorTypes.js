/**
 * Virtual Disaster Sensor Specifications & Geotechnical Engineering Catalog
 * Standards-compliant definitions according to WMO, USGS, ISO 17025, and NDMA guidelines.
 */

export const CYAN = '#00e5ff';
export const RED = '#ff3b5c';
export const AMBER = '#ffb020';
export const GREEN = '#22c55e';
export const ORANGE = '#ff6b35';
export const PURPLE = '#a855f7';
export const BLUE = '#3b82f6';

export const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";
export const FONT_BODY = "var(--font-body, 'Inter', sans-serif)";

export const SENSOR_CATEGORIES = [
  { id: 'ALL', label: 'All Sensors', icon: '📡' },
  { id: 'METEOROLOGY', label: 'Meteorology', icon: '🌧️' },
  { id: 'GEOTECHNICAL', label: 'Geotechnical', icon: '🌱' },
  { id: 'SEISMIC', label: 'Seismic & Acoustic', icon: '🔴' },
  { id: 'HYDROLOGY', label: 'Hydrology', icon: '🌊' }
];

export const SENSOR_TYPES = [
  {
    id: 'rainfall',
    label: 'Rainfall & Precipitation',
    icon: '🌧️',
    unit: 'mm',
    color: BLUE,
    range: [0, 100],
    category: 'METEOROLOGY',
    spec: 'Campbell Scientific ARG100 Optical Doppler + Tipping Bucket Transducer',
    samplingRate: '10s (0.1 Hz)',
    precision: '±0.1 mm / 0.1%',
    protocol: 'LoRaWAN EU868 / MQTT-TLS 1.3',
    snr: '44.2 dB',
    latency: '14 ms',
    calibration: 'ISO/IEC 17025 (Annual Drift <0.02%)',
    ingressRating: 'IP68 Submersible / NEMA 4X',
    powerSpec: '12.8V LiFePO4 Float (0.8W nominal)',
    thresholds: { normal: [0, 15], warning: [15, 45], critical: [45, 100] },
    derivatives: [
      { name: 'Instantaneous Rainfall Rate', unit: 'mm/hr', calc: (v) => (v * 4.2).toFixed(1) },
      { name: '24h Antecedent Precipitation (API-3)', unit: 'mm', calc: (v) => (v * 3.4 + 14.2).toFixed(1) },
      { name: 'Infiltration Kinematic Flux (f)', unit: 'mm/hr', calc: (v) => Math.min(18.5, v * 0.48).toFixed(2) },
      { name: 'Slope Pore-Water Overcharge Ratio', unit: 'ratio', calc: (v) => Math.min(0.85, (v / 80) * 0.72).toFixed(3) }
    ]
  },
  {
    id: 'temperature',
    label: 'Ambient & Ground Surface Temp',
    icon: '🌡️',
    unit: '°C',
    color: ORANGE,
    range: [-10, 50],
    category: 'METEOROLOGY',
    spec: 'Pt100 Class-A 4-Wire RTD Platinum Resistor with Multi-Plate Solar Radiation Shield',
    samplingRate: '30s (0.033 Hz)',
    precision: '±0.15 °C',
    protocol: 'Modbus RTU / 4G NB-IoT',
    snr: '48.6 dB',
    latency: '18 ms',
    calibration: 'NIST Traceable Primary Standard ITS-90',
    ingressRating: 'IP67 Weatherproof Vented',
    powerSpec: '3.6V Primary Lithium Thionyl Chloride (5-yr life)',
    thresholds: { normal: [5, 32], warning: [32, 40], critical: [40, 50] },
    derivatives: [
      { name: 'Cryospheric Freeze-Thaw Index', unit: 'state', calc: (v) => v < 0 ? 'FROST HEAVE ACTIVE' : 'STABLE THERMAL EQUILIBRIUM' },
      { name: 'Adiabatic Lapse Rate Gradient', unit: '°C/100m', calc: (v) => (v > 20 ? '-0.68' : '-0.55') },
      { name: 'Surface Soil Thermal Conductivity', unit: 'W/(m·K)', calc: (v) => (1.24 + (v / 100)).toFixed(2) }
    ]
  },
  {
    id: 'humidity',
    label: 'Atmospheric Relative Humidity',
    icon: '💧',
    unit: '%',
    color: CYAN,
    range: [0, 100],
    category: 'METEOROLOGY',
    spec: 'Rotronic HygroClip2 HC2A-S Capacitive Thin-Film Polymer Sensor',
    samplingRate: '30s (0.033 Hz)',
    precision: '±0.8 %RH',
    protocol: 'LoRaWAN EU868 / CoAP',
    snr: '41.0 dB',
    latency: '16 ms',
    calibration: 'SCS Accredited Humidity Generator Reference',
    ingressRating: 'IP66 Dust/Splash Proof with PTFE Filter',
    powerSpec: '12V Solar Powered with 7Ah AGM Backup',
    thresholds: { normal: [30, 75], warning: [75, 90], critical: [90, 100] },
    derivatives: [
      { name: 'Atmospheric Dewpoint (Td)', unit: '°C', calc: (v, t = 22) => (t - ((100 - v) / 5)).toFixed(1) },
      { name: 'Vapor Pressure Deficit (VPD)', unit: 'kPa', calc: (v) => ((100 - v) * 0.024).toFixed(2) },
      { name: 'Pluvial Cloudburst Condensation Probability', unit: '%', calc: (v) => Math.min(99, Math.max(5, (v - 50) * 1.9)).toFixed(0) }
    ]
  },
  {
    id: 'pressure',
    label: 'Atmospheric Barometric Pressure',
    icon: '📊',
    unit: 'hPa',
    color: PURPLE,
    range: [900, 1100],
    category: 'METEOROLOGY',
    spec: 'Setra Systems Model 278 High-Precision Ceramic Piezoresistive Transducer',
    samplingRate: '1s (1.0 Hz)',
    precision: '±0.10 hPa',
    protocol: 'SDI-12 Bus over RS-485',
    snr: '52.1 dB',
    latency: '12 ms',
    calibration: 'WMO Barometric Transfer Standard Calibrated',
    ingressRating: 'IP67 with Desiccant Cartridge Enclosure',
    powerSpec: '9–30V DC Regulated Bus',
    thresholds: { normal: [990, 1025], warning: [960, 990], critical: [900, 960] },
    derivatives: [
      { name: 'Barometric Trend (3h Tendency ΔP)', unit: 'hPa/3h', calc: (v) => v < 980 ? '-3.4 (RAPID FALL - PLUVIAL GALE)' : '+0.2 (STABLE BARIC FIELD)' },
      { name: 'Hydrostatic Overburden Head', unit: 'mH2O', calc: (v) => (v * 0.010197).toFixed(3) },
      { name: 'Micro-Baric Infrasound Noise Floor', unit: 'mPa', calc: (v) => (12.4 + (v % 5)).toFixed(1) }
    ]
  },
  {
    id: 'wind_speed',
    label: 'Wind Velocity & Aerodynamic Vector',
    icon: '🌬️',
    unit: 'km/h',
    color: GREEN,
    range: [0, 120],
    category: 'METEOROLOGY',
    spec: 'Gill Instruments WindSonic 2-Axis Ultrasonic Solid-State Anemometer',
    samplingRate: '1s (1.0 Hz)',
    precision: '±2% @ 12 m/s (Zero Moving Parts)',
    protocol: 'NMEA 0183 / RS-422 Galvanically Isolated',
    snr: '46.7 dB',
    latency: '15 ms',
    calibration: 'Wind Tunnel Verified (ISO 16622:2002)',
    ingressRating: 'IP66 Corrosion-Resistant Anodized Aluminium',
    powerSpec: '12V DC (De-icing heating element: 24W)',
    thresholds: { normal: [0, 35], warning: [35, 65], critical: [65, 120] },
    derivatives: [
      { name: 'Dynamic Gust Factor (G)', unit: 'km/h', calc: (v) => (v * 1.48).toFixed(1) },
      { name: 'Kinematic Shear Stress on Slope Canopy', unit: 'N/m²', calc: (v) => (v * 0.086).toFixed(2) },
      { name: 'Beaufort Scale Classification', unit: 'force', calc: (v) => v < 20 ? 'Bft 3 (Gentle Breeze)' : v < 50 ? 'Bft 6 (Strong Breeze)' : 'Bft 8+ (Gale Force)' }
    ]
  },
  {
    id: 'soil_moisture',
    label: 'Soil Moisture & Dielectric Permittivity',
    icon: '🌱',
    unit: '%',
    color: '#84cc16',
    range: [0, 100],
    category: 'GEOTECHNICAL',
    spec: 'METER Group Teros-12 High-Frequency 70 MHz Dielectric Permittivity & EC Needle Probe',
    samplingRate: '15s (0.067 Hz)',
    precision: '±1.0% VWC in mineral soils (Depth: 30cm, 60cm, 100cm)',
    protocol: 'SDI-12 Bus over Sub-GHz LoRaWAN Node',
    snr: '39.4 dB',
    latency: '22 ms',
    calibration: 'Soil-Specific Multi-Point Calibration (Cohesive Weathered Phyllite / Schist)',
    ingressRating: 'IP68 Polyurethane Sealed Electronics',
    powerSpec: '4.0–15V DC Ultra-Low Sleep Current (0.03 mA)',
    thresholds: { normal: [10, 50], warning: [50, 75], critical: [75, 100] },
    derivatives: [
      { name: 'Volumetric Water Content (θ)', unit: '% VWC', calc: (v) => (v * 0.44).toFixed(1) },
      { name: 'Pore-Water Pressure Ratio (ru)', unit: 'ratio', calc: (v) => Math.min(0.65, (v * 0.007)).toFixed(3) },
      { name: 'Effective Normal Stress Drop (Δσ\')', unit: 'kPa', calc: (v) => `-${(v * 0.58).toFixed(1)}` },
      { name: 'Slope Liquefaction Probability', unit: '%', calc: (v) => v > 75 ? `${Math.min(96, (v - 75) * 4 + 40).toFixed(0)}` : '1.5' }
    ]
  },
  {
    id: 'seismic',
    label: 'Ground Vibration & Accelerometer Array',
    icon: '🔴',
    unit: 'mGal',
    color: RED,
    range: [0, 10],
    category: 'SEISMIC',
    spec: 'Güralp Radian Tri-Axial Force-Feedback Broadband Borehole Seismometer (0.01–50 Hz)',
    samplingRate: '100 Hz (Digitized @ 24-bit Delta-Sigma ADC)',
    precision: '±0.002 mGal (Self-Noise -173 dB rel. 1 (m/s²)²/Hz)',
    protocol: 'miniSEED / SeedLink over Secure IP Protocol',
    snr: '68.5 dB',
    latency: '24 ms',
    calibration: 'USGS/IRIS Global Seismographic Network Compliant',
    ingressRating: 'IP68 Hermetically Welded Titanium Enclosure (50 bar)',
    powerSpec: '12V DC (3.2W nominal with active feedback loop)',
    thresholds: { normal: [0, 2.0], warning: [2.0, 5.0], critical: [5.0, 10.0] },
    derivatives: [
      { name: 'Peak Ground Acceleration (PGA)', unit: '%g', calc: (v) => (v * 0.102).toFixed(3) },
      { name: 'Arias Intensity (Ia)', unit: 'm/s', calc: (v) => (v * 0.044).toFixed(3) },
      { name: 'Spectral Acceleration @ 1.0s (Sa)', unit: 'g', calc: (v) => (v * 0.088).toFixed(3) },
      { name: 'Seismic Slope Shear Strain State', unit: 'regime', calc: (v) => v > 4.5 ? 'CO-SEISMIC PLASTIC SLIP' : 'ELASTIC DAMPED' }
    ]
  },
  {
    id: 'river_level',
    label: 'River Stage & Embankment Hydro-Gauge',
    icon: '🌊',
    unit: 'm',
    color: '#06b6d4',
    range: [0, 20],
    category: 'HYDROLOGY',
    spec: 'Sommer RG-30 Contact-Free 24 GHz Microwave Radar Stage & Surface Velocity Transducer',
    samplingRate: '5s (0.2 Hz)',
    precision: '±2 mm Stage / ±0.02 m/s Velocity',
    protocol: 'Modbus RTU / 4G LTE-M Secure Cloud Bridge',
    snr: '43.0 dB',
    latency: '19 ms',
    calibration: 'Central Water Commission (CWC) Flume Certified',
    ingressRating: 'IP68 Corrosion-Resistant Coated Body',
    powerSpec: '12V Solar with Switched Auxiliary Battery',
    thresholds: { normal: [0, 6.0], warning: [6.0, 11.0], critical: [11.0, 20.0] },
    derivatives: [
      { name: 'Surface Velocity Vector (v)', unit: 'm/s', calc: (v) => (1.2 + v * 0.38).toFixed(2) },
      { name: 'Estimated Discharge Flux (Q)', unit: 'm³/s', calc: (v) => (v * 48.6).toFixed(0) },
      { name: 'Embankment Freeboard Buffer', unit: 'm', calc: (v) => Math.max(0, 16.5 - v).toFixed(2) },
      { name: 'Flood Scour Risk at Bridge Piers', unit: 'index', calc: (v) => v > 10 ? 'HIGH EROSION TURBULENCE' : 'LAMINAR BASELINE' }
    ]
  },
];

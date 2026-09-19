import React, { useState, useEffect, useMemo } from 'react';

// Direct imports of real sensor photos generated for this platform
import rainGaugeImg from '../assets/sensors/rain_gauge.jpg';
import piezometerImg from '../assets/sensors/piezometer.jpg';
import tiltmeterImg from '../assets/sensors/tiltmeter.jpg';
import soilMoistureImg from '../assets/sensors/soil_moisture.jpg';
import crackmeterImg from '../assets/sensors/crackmeter.jpg';
import geophoneImg from '../assets/sensors/geophone.jpg';
import ultrasonicImg from '../assets/sensors/ultrasonic.jpg';
import weatherStationImg from '../assets/sensors/weather_station.jpg';
import loraNodeImg from '../assets/sensors/lora_node.jpg';
import gatewayImg from '../assets/sensors/gateway.jpg';
import edgeComputeImg from '../assets/sensors/edge_compute.jpg';
import solarPowerImg from '../assets/sensors/solar_power.jpg';
import hydrostaticImg from '../assets/sensors/hydrostatic.jpg';
import enclosureImg from '../assets/sensors/enclosure.jpg';
import slopeTerrainImg from '../assets/sensors/slope_terrain.jpg';

// Guaranteed image mapping dictionary by ID
const SENSOR_IMAGE_MAP = {
  1: rainGaugeImg,
  2: piezometerImg,
  3: tiltmeterImg,
  4: soilMoistureImg,
  5: crackmeterImg,
  6: geophoneImg,
  7: ultrasonicImg,
  8: weatherStationImg,
  9: loraNodeImg,
  10: gatewayImg,
  11: edgeComputeImg,
  12: solarPowerImg,
  13: hydrostaticImg,
  14: enclosureImg,
};

// Real-time simulated telemetry readings for live dynamic feel
const SIMULATED_TELEMETRY = {
  1: { value: '28.4 mm/hr', status: 'INTENSE RAIN', color: '#ffb020', metric: 'PRECIPITATION INTENSITY' },
  2: { value: '142.8 kPa', status: 'RISING PRESSURE', color: '#ff3b5c', metric: 'PORE-WATER PRESSURE (u)' },
  3: { value: '+1.84° / -0.22°', status: 'CREEP DETECTED', color: '#ff3b5c', metric: 'BIAXIAL SCARP TILT' },
  4: { value: '88.4% VWC', status: 'NEAR SATURATION', color: '#ffb020', metric: 'ROOT-ZONE MOISTURE' },
  5: { value: '+2.38 mm', status: 'DILATION ACTIVE', color: '#ff3b5c', metric: 'CRACK OPENING RATE' },
  6: { value: '14.2 mm/s', status: 'ACOUSTIC NOISE', color: '#ffb020', metric: 'MICRO-SEISMIC VELOCITY' },
  7: { value: '3.42 m Head', status: 'GULLY SURGE', color: '#00e5ff', metric: 'STREAM WATER LEVEL' },
  8: { value: '48 km/h • 982 hPa', status: 'CYCLONIC DROP', color: '#ffb020', metric: 'WIND & BARO PRESSURE' },
  9: { value: 'RSSI -68 dBm', status: '15km LINK GOOD', color: '#22c55e', metric: 'LoRaWAN RF LINK' },
  10: { value: '4G LTE-M1 • 99.9%', status: 'CLOUD CONNECTED', color: '#22c55e', metric: 'BACKHAUL GATEWAY' },
  11: { value: '240MHz • 38.4°C', status: 'TINYML INFERRING', color: '#22c55e', metric: 'EDGE CONTROLLER' },
  12: { value: '13.4V • 94% SoC', status: 'MPPT HARVESTING', color: '#22c55e', metric: 'SOLAR BATTERY' },
  13: { value: '11.85 m Head', status: 'WATER TABLE RISE', color: '#00e5ff', metric: 'GROUNDWATER HEAD' },
  14: { value: 'IP67 • IK10', status: 'SURGE GROUNDED', color: '#22c55e', metric: 'CABINET & MAST' },
};

// Currency definitions
const CURRENCIES = {
  INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 1 / 83.5, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 1 / 91.0, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 1 / 106.5, label: 'GBP (£)' },
};

// Comprehensive Fallback Catalog with 14 real-world instruments
const DEFAULT_CATALOG = [
  {
    id: 1,
    name: "Tipping Bucket Rain Gauge",
    model: "Campbell Scientific TE525 / MISOL Pro-RG",
    category: "METEOROLOGICAL",
    purpose: "Real-time precipitation rate & antecedent rainfall accumulation",
    measured_param: "Rainfall Intensity (mm/hr), Cumulative Volume (mm)",
    why_this_sensor: "Rainfall infiltration is the primary landslide trigger worldwide. This sensor monitors instantaneous precipitation intensity down to 0.2mm and tracks 7-day cumulative rainfall against empirical Caine (1980) and Guzzetti Intensity-Duration (I-D) collapse thresholds.",
    suitability_and_benefits: "Operates 100% passively with dual balanced tipping spoons requiring zero quiescent power. Anodized aluminum funnel resists severe UV radiation and acidic mountain rain. Built-in debris screen and siphon prevent splash loss, debris blockage, and insect nesting.",
    price_inr: 12500,
    price_usd: 150,
    accuracy: "±1% up to 50 mm/hr, 0.2 mm/tip",
    interface: "Digital Reed Switch / Pulse Output",
    power: "0 μA (Passive contact closure)",
    ingress: "IP67 / Outdoor All-Weather",
    operating_range: "-20°C to +65°C",
    required: true,
    default_qty: 1,
    installation_guide: "Mount level on a 2-inch stainless mast at 1.5m above ground, clear of vegetation with an unobstructed 45° inverted sky cone.",
    schematic: "rain_gauge",
    imageUrl: rainGaugeImg
  },
  {
    id: 2,
    name: "Vibrating Wire Piezometer",
    model: "Geokon Model 4500S / RST VW2100",
    category: "GEOTECHNICAL",
    purpose: "Subsurface pore-water pressure (u) & water table tracking",
    measured_param: "Pore-water Pressure (0-350 kPa), Hydrostatic Head",
    why_this_sensor: "Catastrophic slope shear is governed by Terzaghi's effective stress law: σ' = σ - u. As rainwater infiltrates down to the shear band, pore pressure (u) escalates, reducing inter-granular soil friction to near zero and triggering sudden, liquefactive slope failure.",
    suitability_and_benefits: "Vibrating wire frequency readout is completely immune to electrical cable resistance, contact moisture, and thermal drift over 500m+ borehole depths. Hermetically welded 316L stainless steel diaphragm resists acidic groundwater for 15+ years without calibration drift.",
    price_inr: 28500,
    price_usd: 340,
    accuracy: "±0.1% Full Scale, 0.025 kPa resolution",
    interface: "Vibrating Wire Frequency (1200-2800 Hz) / SDI-12",
    power: "12V pulse (50 mA for 200 ms, 0 μA sleep)",
    ingress: "IP68 Hermetic Submersible (50 bar)",
    operating_range: "-20°C to +80°C",
    required: true,
    default_qty: 2,
    installation_guide: "Lower into a 76mm rotary borehole across the estimated slip surface. Embed in clean Ottawa silica sand filter and cap with bentonite pellet seals.",
    schematic: "piezometer",
    imageUrl: piezometerImg
  },
  {
    id: 3,
    name: "Biaxial MEMS Inclinometer / Tiltmeter",
    model: "Sisgeo Digital MEMS / Campbell MD900",
    category: "GEOTECHNICAL",
    purpose: "Biaxial angular tilt (θx, θy) & slope creep deformation",
    measured_param: "Biaxial Tilt Angle (±15°), Creep Velocity (deg/hr)",
    why_this_sensor: "Monitors the physical rotational deflection of the unstable slope crown. Crucially distinguishes between stable seasonal elastic movement and rapid tertiary creep acceleration (Saito's creep rupture law) hours to days prior to catastrophic failure.",
    suitability_and_benefits: "Ultra-low thermal hysteresis with integrated 32-bit Kalman filtering and digital temperature compensation. Digital RS-485 Modbus RTU / SDI-12 multi-drop bus allows daisy-chaining 20+ sensors across the slope scarp over a single 4-core cable.",
    price_inr: 22000,
    price_usd: 265,
    accuracy: "±0.001° (0.017 mm/m), 0.0001° resolution",
    interface: "RS-485 Modbus RTU / SDI-12",
    power: "9-18V DC, 8 mA active, 25 μA sleep",
    ingress: "IP68 Submersible / Cast Marine-Alloy",
    operating_range: "-40°C to +85°C",
    required: true,
    default_qty: 2,
    installation_guide: "Anchor rigidly into competent bedrock or reinforced concrete footing using 3-point leveling plate aligned orthogonal to scarp strike.",
    schematic: "tiltmeter",
    imageUrl: tiltmeterImg
  },
  {
    id: 4,
    name: "Multi-Depth Soil Moisture TDR Probe",
    model: "Sentek Drill & Drop 1.2m / Campbell TDR200",
    category: "HYDROLOGY",
    purpose: "Multi-layer volumetric water content (VWC %) profile",
    measured_param: "Volumetric Soil Moisture (0-100% VWC at 10, 30, 60, 100cm)",
    why_this_sensor: "Measures the downward propagation velocity of the monsoon wetting front. Reveals matrix suction loss in unsaturated topsoil layers before groundwater reaches deep bedrock slip interfaces, warning of impending soil saturation.",
    suitability_and_benefits: "Segmented capacitance/TDR sensors measure multiple subterranean strata simultaneously through a single probe without disturbing natural soil compaction. Immune to soil salinity, fertilizer ions, and root moisture uptake fluctuations.",
    price_inr: 18500,
    price_usd: 220,
    accuracy: "±2% VWC, 0.1% resolution",
    interface: "SDI-12 / RS-485",
    power: "5-14V DC, 15 mA active, 30 μA sleep",
    ingress: "IP68 Fully Hermetic Sealed Probe",
    operating_range: "-20°C to +70°C",
    required: true,
    default_qty: 1,
    installation_guide: "Slurry-less installation: auger a tapered hole to 1.2m and press probe directly into undisturbed soil profile for zero-void soil contact.",
    schematic: "soil_moisture",
    imageUrl: soilMoistureImg
  },
  {
    id: 5,
    name: "Vibrating Wire Crackmeter / Jointmeter",
    model: "Geokon 4420 / Encardio EDJ-40V",
    category: "GEOTECHNICAL",
    purpose: "Surface tension crack dilation & scarp opening rate",
    measured_param: "Displacement (0-100 mm), Opening Velocity (mm/day)",
    why_this_sensor: "Tension cracks at the scarp crest are the primary visible surface manifestation of tensile failure. Accelerating crack expansion rate (mm/hr) provides an unmistakable real-time physical confirmation of imminent slab detachment.",
    suitability_and_benefits: "Invar steel linkage minimizes thermal expansion errors across hot sunny days and freezing mountain nights. Ball-and-socket swivel joints allow 3D rotational shearing without bending the transducer shaft. IP68 submersible against torrential downpours.",
    price_inr: 19500,
    price_usd: 235,
    accuracy: "±0.1% F.S., 0.01 mm resolution",
    interface: "Vibrating Wire / 4-20mA / SDI-12",
    power: "12V pulse (35 mA for 150 ms)",
    ingress: "IP68 Submersible (1.5 MPa)",
    operating_range: "-30°C to +80°C",
    required: false,
    default_qty: 1,
    installation_guide: "Anchor expanding rock bolts into firm rock on opposite sides of tension crack; mount telescopic gauge with swivel bearings aligned across fracture.",
    schematic: "crackmeter",
    imageUrl: crackmeterImg
  },
  {
    id: 6,
    name: "SM-24 10Hz Geophone / Micro-Seismic Sensor",
    model: "Geo Space SM-24 / Sercel SG-10",
    category: "SEISMIC",
    purpose: "Micro-seismic tremors & subterranean fracture acoustic emission",
    measured_param: "Ground Particle Velocity (0.01-100 mm/s), 10-250 Hz",
    why_this_sensor: "Before bulk mass detachment occurs, shearing along the internal slip plane produces micro-acoustic emissions and high-frequency tremors. Also detects regional micro-earthquakes that can instantaneously trigger secondary slope liquefaction.",
    suitability_and_benefits: "High sensitivity moving coil design generates its own voltage without needing external excitation power. Extremely rugged, withstands severe mountain rockfall impacts, with high temperature stability.",
    price_inr: 8500,
    price_usd: 102,
    accuracy: "High (28.8 V/m/s sensitivity)",
    interface: "Differential Analog / 24-bit ADC SPI",
    power: "0 μA (Passive electromagnetic induction)",
    ingress: "IP67 Ruggedized Heavy Spike Enclosure",
    operating_range: "-40°C to +100°C",
    required: false,
    default_qty: 1,
    installation_guide: "Bury spike firmly into undisturbed hillside soil or anchor directly into bedrock with dental plaster / epoxy.",
    schematic: "geophone",
    imageUrl: geophoneImg
  },
  {
    id: 7,
    name: "Ultrasonic Stream & Debris Flow Level Gauge",
    model: "MaxBotix MB7389 / Senix ToughSonic 14",
    category: "HYDROLOGY",
    purpose: "Debris flow surge front detection & mountain gully hydrographs",
    measured_param: "Distance to Water/Debris Surface (0.3m to 10m), Surge Velocity",
    why_this_sensor: "Rainfall-induced landslides often transform into channelized hyper-concentrated debris flows traveling at 10 m/s down steep gullies. Non-contact ultrasonic ranging detects the rapid arrival of the surge wave.",
    suitability_and_benefits: "Non-contact measurement prevents sensor destruction from 500kg boulders and slurry that would destroy submerged pressure transducers. Narrow acoustic beam pattern ignores side walls.",
    price_inr: 14500,
    price_usd: 175,
    accuracy: "±1 cm, 1 mm resolution",
    interface: "RS-485 / Analog 0-5V / Pulse Width",
    power: "3.3-5.5V DC, 3.5 mA average",
    ingress: "IP67 Chemically Resistant PVDF Housing",
    operating_range: "-40°C to +65°C",
    required: false,
    default_qty: 1,
    installation_guide: "Mount cantilevered on bridge girder or overhead gully cable 3 to 5 meters above high-water mark with clear downward acoustic path.",
    schematic: "ultrasonic",
    imageUrl: ultrasonicImg
  },
  {
    id: 8,
    name: "All-in-One Ultrasonic Weather Station",
    model: "Gill MaxiMet GMX500 / Davis Vantage Pro2",
    category: "METEOROLOGICAL",
    purpose: "Wind speed/direction, barometric pressure plunge, temperature & humidity",
    measured_param: "Wind (0-60 m/s), Pressure (300-1100 hPa), Temp (-40 to +70°C), RH (0-100%)",
    why_this_sensor: "Captures macro-meteorological boundary conditions. Rapid barometric pressure drop signals approaching severe convective cloudbursts; strong wind gusts exert aerodynamic drag on mountain trees, accelerating root-anchored slope pullout.",
    suitability_and_benefits: "Solid-state ultrasonic transit-time anemometer has zero moving cups or bearings that can seize from freezing rain, snow, or bird perching. Integrated electronic compass.",
    price_inr: 38000,
    price_usd: 455,
    accuracy: "Wind ±3%, Pressure ±0.5 hPa, Temp ±0.3°C",
    interface: "SDI-12 / RS-232 / RS-485",
    power: "9-30V DC, 25 mA active, 2 mA sleep",
    ingress: "IP66 UV-Stabilized Engineering Thermoplastic",
    operating_range: "-40°C to +70°C",
    required: false,
    default_qty: 1,
    installation_guide: "Mount at top of 3m station mast clear of surrounding thermal radiation sources and wind turbulence.",
    schematic: "weather_station",
    imageUrl: weatherStationImg
  },
  {
    id: 9,
    name: "Long-Range LoRaWAN SX1262 Transceiver Node",
    model: "Dragino LSN50v2 / RAK WisBlock IP67",
    category: "COMMUNICATION",
    purpose: "15km Sub-GHz telemetry over non-line-of-sight mountain ridges",
    measured_param: "RF RSSI (dBm), SNR (dB), Packet Delivery Ratio (%)",
    why_this_sensor: "Disaster-prone high-altitude scarps almost always lack 4G cellular coverage. LoRaWAN operates in sub-GHz bands (868/915 MHz) capable of diffracting over mountain ridges and through dense pine forest canopy for 15+ km.",
    suitability_and_benefits: "High link budget (163 dB) with -148 dBm sensitivity. Transmits encrypted packets with AES-128 cryptographic security. Consumes just 25 mA during a 1.2-second transmission burst, then sleeps at 1.5 μA.",
    price_inr: 6500,
    price_usd: 78,
    accuracy: "Link Budget 163 dB, 15 km Line-of-sight",
    interface: "SPI / UART / LoRaWAN Class A & C",
    power: "3.3V DC, 22 dBm TX (110 mA max, 1.5 μA sleep)",
    ingress: "IP67 Weatherproof Enclosure with N-type RF port",
    operating_range: "-40°C to +85°C",
    required: true,
    default_qty: 1,
    installation_guide: "Mount on mast above snowline; install 5.8 dBi fiberglass omnidirectional collinear antenna with surge arrestor.",
    schematic: "lora_node",
    imageUrl: loraNodeImg
  },
  {
    id: 10,
    name: "4G/LTE Cat-M1 & Satellite Fallback Gateway",
    model: "Teltonika RUT241 / Quectel BG95 Dual-SIM",
    category: "COMMUNICATION",
    purpose: "LoRaWAN-to-Cloud IP backhaul with automatic satellite failover",
    measured_param: "Uptime, 4G RSRP/RSRQ Signal, Backhaul Latency (ms)",
    why_this_sensor: "Aggregates telemetry from up to 50 field sensor nodes and transmits directly to the NEXUS-LAND cloud platform. Dual SIM cards with different telecom carriers ensure instant failover when a tower goes offline.",
    suitability_and_benefits: "Industrial hardware watchdog prevents lockups; automatic APN configuration; optional Iridium satellite modem fallback for ultra-remote Himalayan sectors where all terrestrial cellular towers fail during catastrophes.",
    price_inr: 18500,
    price_usd: 222,
    accuracy: "99.98% High Availability Uptime",
    interface: "Ethernet, Dual SIM 4G Cat-4/M1, WiFi, RS-485",
    power: "9-30V DC, 2.5W average",
    ingress: "IP67 Rugged Enclosure with Heavy-Duty Glands",
    operating_range: "-40°C to +75°C",
    required: true,
    default_qty: 1,
    installation_guide: "Install at high-elevation repeater mast with unobstructed valley line-of-sight to sensor nodes and cell tower.",
    schematic: "gateway",
    imageUrl: gatewayImg
  },
  {
    id: 11,
    name: "Edge AI Industrial Controller Node",
    model: "ESP32-S3 Industrial / STM32L4 Bus Master",
    category: "COMPUTE",
    purpose: "Multi-bus sensor polling, TinyML anomaly inference & transmission scheduler",
    measured_param: "Onboard System Temp, Bus Voltage, Memory, Flash Log",
    why_this_sensor: "Acts as the station's autonomous field intelligence. Conducts continuous sensor polling, applies Kalman filters to discard false noise spikes, runs TinyML trigger models on-device, and raises transmission frequency during emergencies.",
    suitability_and_benefits: "Dual Xtensa 32-bit LX7 cores with vector instructions for edge inference. Integrated 16-bit differential ADC for analog transducers; native SDI-12 and RS-485 transceiver drivers with 15kV ESD protection. Micro-amp sleep mode.",
    price_inr: 5800,
    price_usd: 70,
    accuracy: "240 MHz Dual Core, 16-bit ADC",
    interface: "SDI-12, RS-485, I2C, SPI, UART, CAN",
    power: "3.3V-12V DC, 45 mA active, 12 μA deep sleep",
    ingress: "IP67 Conformal Coated PCB Enclosure",
    operating_range: "-40°C to +85°C",
    required: true,
    default_qty: 1,
    installation_guide: "House inside central weatherproof junction box with silicone sealing gasket and silica gel desiccator pack.",
    schematic: "edge_compute",
    imageUrl: edgeComputeImg
  },
  {
    id: 12,
    name: "12V 20Ah LiFePO4 Battery & MPPT Solar Power Pack",
    model: "30W Monocrystalline PV + IP67 LiFePO4 Smart BMS",
    category: "POWER",
    purpose: "24/7 Off-Grid Power Autonomy with 7+ days zero-sunlight monsoon reserve",
    measured_param: "Battery State of Charge (%), Solar Input Power (W), Pack Voltage (V)",
    why_this_sensor: "Landslides occur during days of continuous heavy monsoon cloudbursts when solar irradiance drops to nearly 0 W/m². The power subsystem must sustain uninterrupted 24/7 operation without grid electricity.",
    suitability_and_benefits: "Lithium Iron Phosphate (LiFePO4) chemistry delivers 3,500+ cycles (>10 year lifespan), operates in freezing sub-zero conditions without capacity collapse, and will not experience thermal runaway. MPPT charger achieves 99% conversion efficiency in diffuse fog.",
    price_inr: 14800,
    price_usd: 178,
    accuracy: "3,500+ Cycles @ 80% DoD, 256 Wh Capacity",
    interface: "Regulated 12V / 5V / 3.3V DC Rail + I2C/Modbus BMS",
    power: "Output: 12V 5A continuous; Input: 30W Monocrystalline PV",
    ingress: "IP67 Submersible Battery Housing + Anodized PV Frame",
    operating_range: "-20°C to +60°C",
    required: true,
    default_qty: 1,
    installation_guide: "Mount solar panel facing south at 35° tilt angle; secure battery inside vented lower equipment chest protected from direct sun.",
    schematic: "solar_power",
    imageUrl: solarPowerImg
  },
  {
    id: 13,
    name: "Submersible Hydrostatic Level Transmitter",
    model: "Keller Series 26Y / Gems 2200",
    category: "HYDROLOGY",
    purpose: "Continuous groundwater table elevation (hw) in open standpipes",
    measured_param: "Hydrostatic Head (0-20 mH2O), Groundwater Temp",
    why_this_sensor: "Monitors water table height inside observation boreholes. Rapid rise in water table corresponds directly to rising buoyancy forces that reduce the normal force stabilizing colluvial slopes.",
    suitability_and_benefits: "Vented polyurethane cable with internal capillary tube compensates automatically for atmospheric barometric pressure swings. Hastelloy C-276 diaphragm resists corrosive groundwater.",
    price_inr: 16500,
    price_usd: 198,
    accuracy: "±0.25% F.S., 1 mm resolution",
    interface: "4-20mA / SDI-12 / RS-485 Modbus",
    power: "10-30V DC, 18 mA active",
    ingress: "IP68 Continuous Submersion (30 bar)",
    operating_range: "-10°C to +80°C",
    required: false,
    default_qty: 1,
    installation_guide: "Lower into slotted PVC standpipe to 2m below minimum expected dry-season water table; clamp cable at wellhead with Kevlar strain relief.",
    schematic: "hydrostatic",
    imageUrl: hydrostaticImg
  },
  {
    id: 14,
    name: "Ruggedized IP67 Enclosure, Mast & Surge Protection",
    model: "Fibox ARCA 403021 + 3m Galvanized Mast + GDT Lightning Rod",
    category: "HOUSING",
    purpose: "Physical and electrical defense against rockfall, torrential rain & lightning strikes",
    measured_param: "Cabinet Internal Temperature (°C), Relative Humidity (%)",
    why_this_sensor: "Mountain ridge stations are exposed to direct lightning strikes, freezing rain, falling rocks, and wildlife tampering. Without hardened physical and galvanic protection, the entire station will be disabled in its first storm.",
    suitability_and_benefits: "Impact-resistant glass-fiber reinforced polycarbonate (IK10 rated); multi-stage Gas Discharge Tube (GDT) and transient voltage suppression (TVS) diodes shunt up to 20kA lightning surges harmlessly to ground copper rod.",
    price_inr: 11500,
    price_usd: 138,
    accuracy: "IK10 Impact / IP67 Ingress",
    interface: "M12 & M16 Waterproof Cable Glands, Padlockable",
    power: "Passive Mechanical & Galvanic Protection",
    ingress: "IP67 / NEMA 4X / IK10",
    operating_range: "-40°C to +120°C",
    required: true,
    default_qty: 1,
    installation_guide: "Drive 2.5m copper-bonded earth grounding rod to achieve <5 Ohm resistance; anchor guyed mast with triple 6mm stainless steel wire ropes.",
    schematic: "enclosure",
    imageUrl: enclosureImg
  }
];

// Curated Deployment Presets
const DEPLOYMENT_PRESETS = {
  COMMUNITY: {
    title: "Community Early Warning Node",
    badge: "TIER 1 • VILLAGE EARLY WARNING",
    desc: "Low-cost high-reliability alert station for rural mountain communities. Focuses on precipitation rate, topsoil saturation, and scarp tilt with LoRaWAN telemetry.",
    quantities: { 1: 1, 3: 1, 4: 1, 9: 1, 11: 1, 12: 1, 14: 1 }
  },
  BOREHOLE: {
    title: "Deep Borehole Inclinometer Array",
    badge: "TIER 2 • SUBSURFACE DEEP PROFILING",
    desc: "Rigorous scientific monitoring of deep rotational slip surfaces. Measures pore-water pressure, multi-depth VWC, surface tension cracks, and biaxial tilt.",
    quantities: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1 }
  },
  HIGHWAY: {
    title: "Critical Highway / Rail Sentry",
    badge: "TIER 3 • INFRASTRUCTURE LIFELINE",
    desc: "High-frequency AI telemetry for highway rock cuts and railway avalanche/landslide zones. Includes geophone acoustic emissions, debris flow radar, and dual-SIM gateway.",
    quantities: { 1: 1, 2: 1, 3: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2, 10: 1, 11: 1, 12: 2, 14: 1 }
  },
  FULL: {
    title: "Full Multi-Hazard Mission Critical Array",
    badge: "TIER 4 • COMPREHENSIVE 360°",
    desc: "Complete 14-component instrumentation suite capturing surface meteorology, subsurface hydrodynamics, seismic acoustic emissions, and redundant telemetry.",
    quantities: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2, 10: 1, 11: 1, 12: 2, 13: 1, 14: 1 }
  }
};

// Component to render an Engineering Schematic SVG for each sensor type
function SensorSchematic({ type, style = {} }) {
  switch (type) {
    case 'rain_gauge':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <path d="M 60 20 L 140 20 L 125 55 L 125 125 L 75 125 L 75 55 Z" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="3 1" />
          <path d="M 65 24 L 135 24 L 100 55 Z" fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" strokeWidth="1.5" />
          <polygon points="100,75 80,95 120,95" fill="none" stroke="#ffb020" strokeWidth="2" />
          <circle cx="100" cy="75" r="3" fill="#ffb020" />
          <line x1="100" y1="55" x2="100" y2="70" stroke="#00e5ff" strokeWidth="2" strokeDasharray="2 2" />
          <rect x="94" y="105" width="12" height="6" fill="#22c55e" rx="1" />
          <text x="100" y="145" textAnchor="middle" fill="#8a9ab5" fontSize="9" fontFamily="monospace">0.2mm TIPPING SPOON</text>
          <text x="100" y="15" textAnchor="middle" fill="#00e5ff" fontSize="9" fontFamily="monospace">AERODYNAMIC FUNNEL</text>
        </svg>
      );
    case 'piezometer':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="75" y="25" width="50" height="90" rx="3" fill="rgba(41, 121, 255, 0.15)" stroke="#2979ff" strokeWidth="2" />
          <rect x="80" y="115" width="40" height="20" rx="2" fill="rgba(34, 197, 94, 0.25)" stroke="#22c55e" strokeWidth="2" strokeDasharray="2 2" />
          <line x1="100" y1="45" x2="100" y2="95" stroke="#ff3b5c" strokeWidth="2" />
          <circle cx="100" cy="70" r="10" fill="none" stroke="#ffb020" strokeWidth="1.5" strokeDasharray="3 1" />
          <path d="M 100 25 L 100 10" stroke="#8a9ab5" strokeWidth="3" />
          <text x="100" y="150" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">POROUS SINTERED FILTER</text>
          <text x="100" y="73" textAnchor="middle" fill="#ffb020" fontSize="8" fontFamily="monospace">VW COIL</text>
        </svg>
      );
    case 'tiltmeter':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="55" y="45" width="90" height="65" rx="6" fill="rgba(0, 229, 255, 0.1)" stroke="#00e5ff" strokeWidth="2" />
          <circle cx="100" cy="77" r="22" fill="none" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="100" y1="52" x2="100" y2="102" stroke="#ff3b5c" strokeWidth="2" />
          <line x1="75" y1="77" x2="125" y2="77" stroke="#00e5ff" strokeWidth="2" />
          <circle cx="100" cy="77" r="4" fill="#ffb020" />
          <text x="100" y="32" textAnchor="middle" fill="#00e5ff" fontSize="9" fontFamily="monospace">BIAXIAL ORTHOGONAL (X/Y)</text>
          <text x="100" y="135" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">32-BIT DIGITAL KALMAN FILTER</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="45" y="35" width="110" height="90" rx="6" fill="rgba(255,255,255,0.05)" stroke="#8a9ab5" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx="100" cy="80" r="24" fill="none" stroke="#00e5ff" strokeWidth="2" />
          <path d="M 90 80 L 100 70 L 110 80 L 100 90 Z" fill="#ffb020" />
          <text x="100" y="145" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">HARDWARE MODULE SPECIFICATION</text>
        </svg>
      );
  }
}

// Visual Component that GUARANTEES the real photo is shown prominently
function SensorVisual({ item, viewMode = 'PHOTO', onToggleMode, onInspect }) {
  const imgSrc = SENSOR_IMAGE_MAP[item.id] || item.imageUrl || rainGaugeImg;
  const telemetry = SIMULATED_TELEMETRY[item.id] || { value: 'ONLINE', status: 'ACTIVE', color: '#22c55e', metric: 'STATUS' };

  return (
    <div
      onClick={onInspect}
      style={{
        position: 'relative',
        width: '100%',
        height: '220px',
        overflow: 'hidden',
        borderRadius: '8px',
        background: '#090b10',
        cursor: 'pointer',
        border: '1px solid rgba(0, 229, 255, 0.2)'
      }}
      className="sensor-photo-container"
    >
      {/* Tactical Corner Reticles */}
      <div className="tactical-corner tactical-corner-tl" />
      <div className="tactical-corner tactical-corner-tr" />
      <div className="tactical-corner tactical-corner-bl" />
      <div className="tactical-corner tactical-corner-br" />

      {/* Real Hardware Photograph or Blueprint based on viewMode */}
      {viewMode === 'BLUEPRINT' ? (
        <div style={{ width: '100%', height: '100%', padding: '12px' }}>
          <SensorSchematic type={item.schematic} />
        </div>
      ) : (
        <>
          <img
            src={imgSrc}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'contrast(1.08) brightness(0.95)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="sensor-img-hover"
          />
          {/* Animated Sweeping Laser Line on Card */}
          <div className="sensor-scan-line" />
        </>
      )}

      {/* Top Left: Live Real-Time Telemetry Pill */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(8, 10, 14, 0.88)',
        border: `1px solid ${telemetry.color}`,
        borderRadius: '4px',
        padding: '3px 8px',
        zIndex: 8,
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: telemetry.color,
          boxShadow: `0 0 8px ${telemetry.color}`
        }} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
          {telemetry.value}
        </span>
      </div>

      {/* Top Right: Photo vs Schematic Toggle */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 8
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMode && onToggleMode(item.id, viewMode === 'PHOTO' ? 'BLUEPRINT' : 'PHOTO');
          }}
          style={{
            background: 'rgba(8, 10, 14, 0.88)',
            border: '1px solid rgba(0, 229, 255, 0.5)',
            color: 'var(--cyan)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)'
          }}
        >
          {viewMode === 'PHOTO' ? '📷 REAL PHOTO' : '📐 CAD BLUEPRINT'}
        </button>
      </div>

      {/* Bottom Overlay: Ingress & Interface Pills */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '10px',
        right: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 8
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{
            background: 'rgba(0, 229, 255, 0.25)',
            border: '1px solid rgba(0, 229, 255, 0.6)',
            color: '#00e5ff',
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '3px',
            fontFamily: 'var(--font-mono)',
            backdropFilter: 'blur(4px)'
          }}>
            {item.ingress}
          </span>
          <span style={{
            background: 'rgba(34, 197, 94, 0.25)',
            border: '1px solid rgba(34, 197, 94, 0.6)',
            color: '#22c55e',
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '3px',
            fontFamily: 'var(--font-mono)',
            backdropFilter: 'blur(4px)'
          }}>
            {item.interface.split('/')[0]}
          </span>
        </div>

        <span style={{
          fontSize: '10px',
          color: '#cbd5e1',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'var(--font-mono)'
        }}>
          🔍 CLICK TO ZOOM
        </span>
      </div>
    </div>
  );
}

// Tactical Mountain Slope Stations with Geotechnical Instrumentation
const TERRAIN_STATIONS = [
  {
    id: 'ST-01',
    name: 'Summit Ridge Telemetry Gateway',
    zone: 'SUMMIT CREST (STABLE BEDROCK)',
    altitude: '2,240m ASL',
    slopeAngle: '12° Crest Flat',
    coords: '31.1072°N, 77.1768°E',
    pinPos: { left: '81%', top: '16%' },
    svgPos: { x: 810, y: 80 },
    color: 'var(--cyan)',
    statusText: 'ONLINE • MESH ROOT',
    primarySensorId: 10, // 4G Gateway
    secondarySensorId: 12, // Solar System
    sensorTypes: ['4G LTE-M / Iridium Satellite Gateway', '50W Solar PV + MPPT', '12V LiFePO4 Smart Battery'],
    geotechnicalSignificance: 'Acts as the redundant master telemetry root. Collects Sub-GHz LoRa packets from down-slope sensor clusters and relays real-time geotechnical warnings to the Cloud Civil Defense dashboard via satellite fallback if terrestrial fiber is severed.',
    governingPhysics: 'Line-of-Sight Fresnel Zone Clearance (915 MHz) & Monocrystalline PV Photovoltaic Autonomy with 14-day zero-sun buffer.',
    alertThreshold: 'Loss of Gateway Heartbeat > 5 min -> Automatic Alert Trigger'
  },
  {
    id: 'ST-02',
    name: 'Crown Scarp Tension Crackmeter & Tilt',
    zone: 'HEAD SCARP EXTENSION ZONE',
    altitude: '2,160m ASL',
    slopeAngle: '44° Steep Rock Scarp',
    coords: '31.1061°N, 77.1752°E',
    pinPos: { left: '63%', top: '34%' },
    svgPos: { x: 630, y: 170 },
    color: 'var(--amber)',
    statusText: 'WARNING • ACTIVE DILATION',
    primarySensorId: 5, // Crackmeter
    secondarySensorId: 3, // Tiltmeter
    sensorTypes: ['Quartz Vibrating Wire Crackmeter', 'Biaxial MEMS Inclinometer', 'Micro-Seismic Geophone'],
    geotechnicalSignificance: 'Monitors progressive tensile opening of the detachment crown scarp. Creep acceleration here indicates tensile failure of the upper soil mass, preconditioning the slope for sudden rotational or planar slide release.',
    governingPhysics: "Saito's Creep Rupture Model (1969): Rate of crack opening acceleration d²w/dt² inversely models remaining time to catastrophic slope detachment: tr = t0 + C/(dw/dt).",
    alertThreshold: 'Extension > 2.0 mm/day or Angular Tilt > 1.5° -> Tertiary Creep Alarm'
  },
  {
    id: 'ST-03',
    name: 'Mid-Slope Borehole Shear Plane & Piezometer',
    zone: 'CRITICAL ROTATIONAL SHEAR BAND',
    altitude: '2,050m ASL',
    slopeAngle: '38° Colluvial Slope',
    coords: '31.1048°N, 77.1734°E',
    pinPos: { left: '44%', top: '53%' },
    svgPos: { x: 440, y: 265 },
    color: 'var(--red)',
    statusText: 'CRITICAL • HIGH PORE PRESSURE',
    primarySensorId: 2, // Vibrating Wire Piezometer
    secondarySensorId: 4, // Soil Moisture TDR
    sensorTypes: ['12m Deep Vibrating Wire Piezometer', 'In-Place Borehole Inclinometer', 'Multi-depth TDR Soil Moisture Array'],
    geotechnicalSignificance: 'Directly penetrates the active slip surface at 8.2m depth. Measures pore-water pressure buildup and deep shear displacement. This is the single most critical station governing total slope collapse.',
    governingPhysics: "Terzaghi's Principle of Effective Stress: σ' = σ - u. High pore pressure (u) cancels normal clamping stress across the shear plane, drastically dropping available shear resistance τ = c' + σ' tan φ'.",
    alertThreshold: 'Pore-Water Pressure > 135 kPa or Shear Slip > 10 mm -> EVACUATION RED ALERT'
  },
  {
    id: 'ST-04',
    name: 'Toe Gully Inflow & Debris Flow Radar',
    zone: 'COLLUVIUM ACCUMULATION & DISCHARGE GULLY',
    altitude: '1,920m ASL',
    slopeAngle: '22° Valley Channel',
    coords: '31.1025°N, 77.1710°E',
    pinPos: { left: '19%', top: '75%' },
    svgPos: { x: 190, y: 375 },
    color: 'var(--cyan)',
    statusText: 'MONITORING • MONSOON RUNOFF',
    primarySensorId: 1, // Rain Gauge
    secondarySensorId: 7, // Ultrasonic Debris Level
    sensorTypes: ['Dual-Tipping Bucket Rain Gauge', 'High-Frequency Ultrasonic Debris Radar', 'Hydrostatic Stage Sensor'],
    geotechnicalSignificance: 'Monitors precipitation intensity (mm/hr) and flash flood debris surge in the toe channel. Seepage breakout at the toe signals slope saturation and rapid liquefactive mudflow transformation.',
    governingPhysics: 'Caine (1980) & Guzzetti Intensity-Duration (I-D) Empirical Threshold: I = 14.82 * D^(-0.39). Exceeding this boundary initiates mass debris mobilization.',
    alertThreshold: 'Precipitation Intensity > 25 mm/hr or Channel Surge > 3.0m -> Flash Mudflow Siren'
  }
];

export default function SensorPricingPage() {
  const [items, setItems] = useState(() => {
    // Merge DEFAULT_CATALOG with guaranteed bundled images
    return DEFAULT_CATALOG.map(i => ({
      ...i,
      imageUrl: SENSOR_IMAGE_MAP[i.id] || i.imageUrl
    }));
  });

  const [quantities, setQuantities] = useState(() => {
    const q = {};
    DEFAULT_CATALOG.forEach(item => { q[item.id] = item.default_qty || 1; });
    return q;
  });

  const [currency, setCurrency] = useState('INR');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('CARDS'); // 'CARDS' | 'TOPOGRAPHY' | 'AUTONOMY' | 'BOM_TABLE'
  const [cardVisualModes, setCardVisualModes] = useState({});
  const [inspectModalItem, setInspectModalItem] = useState(null);
  const [activePreset, setActivePreset] = useState('FULL');
  const [editMode, setEditMode] = useState(false);
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Hero Spotlight Sensor (Defaults to #2: Vibrating Wire Piezometer)
  const [spotlightId, setSpotlightId] = useState(2);

  // Power & Autonomy states
  const [samplingRateMin, setSamplingRateMin] = useState(5);
  const [pvWatts, setPvWatts] = useState(30);
  const [batteryAh, setBatteryAh] = useState(20);
  const [cableLengthMeters, setCableLengthMeters] = useState(120);

  // Real-time Terrain Analytics & Field Simulation States
  const [terrainLayers, setTerrainLayers] = useState({
    optical: true,
    sensorPins: true,
    bishopFos: true,
    porePressure: true,
    loraMesh: true,
    lidarScan: true,
    thermalHeatmap: false,
  });

  const [simStormActive, setSimStormActive] = useState(false);
  const [selectedTerrainStationId, setSelectedTerrainStationId] = useState('ST-03');
  const [packetStreamPaused, setPacketStreamPaused] = useState(false);

  // Dynamic real-time fluctuating sensor telemetry
  const [liveTerrainTelemetry, setLiveTerrainTelemetry] = useState({
    rainfall: 28.4,
    rainCumulative: 214.2,
    porePressure: 142.8,
    soilMoisture: 88.4,
    tiltX: 1.84,
    tiltY: -0.22,
    crackOpening: 2.38,
    crackRate: 0.18,
    debrisStage: 3.42,
    seismicNoise: 14.2,
    fos: 1.08,
    batteryVoltage: 13.41,
    solarWatts: 38.2,
    rssi: -68,
    lastUpdate: 'LIVE',
  });

  // Real-time LoRaWAN Packet stream buffer
  const [packetLogs, setPacketLogs] = useState([
    { id: 48192, time: '04:26:48 UTC', node: 'ST-03 MID-SLOPE', type: 'SDI-12 / VW', hex: '0x8F 0x14 0x2A 0x6E', reading: 'VW_u: 142.8 kPa | VWC: 88.4%', rssi: -68, snr: '+9.4 dB', status: 'CRC_OK' },
    { id: 48193, time: '04:26:50 UTC', node: 'ST-02 SCARP', type: 'RS-485 / MEMS', hex: '0x3E 0x01 0xB4 0x90', reading: 'θx: +1.84° | Δw: 2.38mm', rssi: -72, snr: '+8.1 dB', status: 'WARN_CREEP' },
    { id: 48194, time: '04:26:52 UTC', node: 'ST-04 TOE GULLY', type: 'PULSE / 4-20mA', hex: '0x11 0x02 0x1C 0x55', reading: 'Rain: 28.4 mm/h | Stage: 3.42m', rssi: -64, snr: '+11.2 dB', status: 'CRC_OK' },
    { id: 48195, time: '04:26:54 UTC', node: 'ST-01 GATEWAY', type: '4G LTE-M MQTT', hex: '0xAA 0x55 0x00 0xFF', reading: 'Uplink Cloud Broker: ACK (16ms)', rssi: -58, snr: '+14.0 dB', status: 'CLOUD_SYNC' },
  ]);

  // Telemetry fluctuation polling engine
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTerrainTelemetry(prev => {
        const storm = simStormActive;
        const noise = (Math.random() - 0.5);

        const rainfall = storm 
          ? +(Math.min(95, Math.max(65, prev.rainfall + noise * 4))).toFixed(1)
          : +(Math.min(36, Math.max(22, prev.rainfall + noise * 1.5))).toFixed(1);

        const porePressure = storm
          ? +(Math.min(210, Math.max(175, prev.porePressure + noise * 3))).toFixed(1)
          : +(Math.min(148, Math.max(138, prev.porePressure + noise * 0.8))).toFixed(1);

        const soilMoisture = storm ? +(Math.min(99.4, 94.0 + noise * 1)).toFixed(1) : +(Math.min(91, Math.max(85, prev.soilMoisture + noise * 0.5))).toFixed(1);

        const crackOpening = storm ? +(prev.crackOpening + 0.04).toFixed(2) : +(2.38 + Math.sin(Date.now() / 8000) * 0.05).toFixed(2);
        const tiltX = storm ? +(prev.tiltX + 0.03).toFixed(2) : +(1.84 + Math.sin(Date.now() / 10000) * 0.03).toFixed(2);
        
        const debrisStage = storm ? +(Math.min(6.5, Math.max(4.8, prev.debrisStage + noise * 0.2))).toFixed(2) : +(Math.min(3.8, Math.max(3.1, prev.debrisStage + noise * 0.05))).toFixed(2);
        const seismicNoise = storm ? +(Math.min(65, Math.max(38, prev.seismicNoise + noise * 3))).toFixed(1) : +(Math.min(17, Math.max(11, prev.seismicNoise + noise * 0.6))).toFixed(1);

        // Bishop Factor of Safety decreases dynamically as pore pressure spikes
        const fos = storm 
          ? +(0.81 + noise * 0.03).toFixed(2)
          : +(1.08 + Math.sin(Date.now() / 6000) * 0.02).toFixed(2);

        const batteryVoltage = +(13.4 + noise * 0.06).toFixed(2);
        const solarWatts = storm ? +(12.4 + noise * 2).toFixed(1) : +(38.2 + noise * 1.8).toFixed(1);
        const rssi = Math.round(-68 + noise * 4);

        return {
          rainfall,
          rainCumulative: +(prev.rainCumulative + (rainfall / 3600)).toFixed(2),
          porePressure,
          soilMoisture,
          tiltX,
          tiltY: -0.22,
          crackOpening,
          crackRate: storm ? 1.45 : 0.18,
          debrisStage,
          seismicNoise,
          fos,
          batteryVoltage,
          solarWatts,
          rssi,
          lastUpdate: new Date().toLocaleTimeString(),
        };
      });

      if (!packetStreamPaused) {
        setPacketLogs(prev => {
          const nowStr = new Date().toISOString().substring(11, 19) + ' UTC';
          const nodes = [
            { node: 'ST-03 MID-SLOPE', type: 'SDI-12 / VW', prefix: 'VW_u: 142.8 kPa', rssi: -68 },
            { node: 'ST-02 SCARP', type: 'RS-485 / MEMS', prefix: 'θx: +1.84° / 2.38mm', rssi: -72 },
            { node: 'ST-04 TOE GULLY', type: 'PULSE / 4-20mA', prefix: 'Rain: 28.4 mm/h', rssi: -64 },
            { node: 'ST-01 GATEWAY', type: 'LTE-M UPLINK', prefix: 'MQTT_PUB CLOUD_ACK', rssi: -58 }
          ];
          const chosen = nodes[Math.floor(Math.random() * nodes.length)];
          const newPkt = {
            id: (prev[0]?.id || 48200) + 1,
            time: nowStr,
            node: chosen.node,
            type: chosen.type,
            hex: '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0'),
            reading: chosen.prefix,
            rssi: chosen.rssi + Math.round((Math.random() - 0.5) * 6),
            snr: `+${(8 + Math.random() * 5).toFixed(1)} dB`,
            status: simStormActive ? 'STORM_BURST' : 'CRC_OK'
          };
          return [newPkt, ...prev.slice(0, 14)];
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [simStormActive, packetStreamPaused]);

  // Clear stale old localStorage that had no image assets
  useEffect(() => {
    try {
      localStorage.removeItem('nexus_sensor_prices');
    } catch {
      // ignore
    }
  }, []);


  const handleToggleCardVisual = (id, newMode) => {
    setCardVisualModes(prev => ({ ...prev, [id]: newMode }));
  };

  const handleQuantityChange = (id, delta) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [id]: updated };
    });
    setActivePreset('CUSTOM');
  };

  const handleSetPreset = (key) => {
    setActivePreset(key);
    const preset = DEPLOYMENT_PRESETS[key];
    if (preset) {
      const newQ = {};
      items.forEach(item => {
        newQ[item.id] = preset.quantities[item.id] || 0;
      });
      setQuantities(newQ);
    }
  };

  const formatPrice = (inrVal) => {
    const rate = CURRENCIES[currency].rate;
    const sym = CURRENCIES[currency].symbol;
    const val = Math.round(inrVal * rate);
    return `${sym}${val.toLocaleString()}`;
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.interface.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (!sortCol) return 0;
        if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
        if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [items, selectedCategory, searchQuery, sortCol, sortAsc]);

  const spotlightItem = useMemo(() => {
    return items.find(i => i.id === spotlightId) || items[0];
  }, [items, spotlightId]);

  const selectedTerrainStation = useMemo(() => {
    return TERRAIN_STATIONS.find(s => s.id === selectedTerrainStationId) || TERRAIN_STATIONS[2];
  }, [selectedTerrainStationId]);

  // Financial BOM calculation
  const bomSummary = useMemo(() => {
    let hardwareSubtotalInr = 0;
    let requiredSubtotalInr = 0;
    let optionalSubtotalInr = 0;
    let totalActiveComponents = 0;

    items.forEach(item => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        const lineTotal = item.price_inr * qty;
        hardwareSubtotalInr += lineTotal;
        totalActiveComponents += qty;
        if (item.required) requiredSubtotalInr += lineTotal;
        else optionalSubtotalInr += lineTotal;
      }
    });

    const cableCostInr = cableLengthMeters * 85;
    const mountingKitInr = 7500;
    const shippingFreightInr = Math.round(hardwareSubtotalInr * 0.05);
    const taxesInr = Math.round((hardwareSubtotalInr + cableCostInr + mountingKitInr) * 0.18);
    const grandTotalInr = hardwareSubtotalInr + cableCostInr + mountingKitInr + shippingFreightInr + taxesInr;

    return {
      hardwareSubtotalInr,
      requiredSubtotalInr,
      optionalSubtotalInr,
      totalActiveComponents,
      cableCostInr,
      mountingKitInr,
      shippingFreightInr,
      taxesInr,
      grandTotalInr
    };
  }, [items, quantities, cableLengthMeters]);

  // Power simulation
  const powerAutonomy = useMemo(() => {
    let baseWhPerDay = 24.0;
    const pollsPerDay = (24 * 60) / Math.max(1, samplingRateMin);
    let sensorWhPerDay = 0;

    items.forEach(item => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        sensorWhPerDay += qty * pollsPerDay * 0.00025;
      }
    });

    const totalDailyWh = baseWhPerDay + sensorWhPerDay;
    const batteryWhCapacity = batteryAh * 12 * 0.85;
    const autonomyDays = (batteryWhCapacity / totalDailyWh).toFixed(1);
    const dailySolarHarvestWh = pvWatts * 4.2 * 0.8;

    return {
      totalDailyWh: totalDailyWh.toFixed(1),
      batteryWhCapacity: batteryWhCapacity.toFixed(0),
      autonomyDays,
      dailySolarHarvestWh: dailySolarHarvestWh.toFixed(0),
      isAdequate: dailySolarHarvestWh >= totalDailyWh * 1.5
    };
  }, [items, quantities, samplingRateMin, pvWatts, batteryAh]);

  const handleExportCSV = () => {
    const headers = ["ID", "Sensor/Component", "Model", "Category", "Required", "Unit Price (INR)", "Quantity", "Total (INR)", "Accuracy", "Interface", "Purpose"];
    const rows = items
      .filter(item => (quantities[item.id] || 0) > 0)
      .map(item => [
        item.id,
        `"${item.name}"`,
        `"${item.model}"`,
        item.category,
        item.required ? "YES" : "OPTIONAL",
        item.price_inr,
        quantities[item.id] || 0,
        item.price_inr * (quantities[item.id] || 0),
        `"${item.accuracy}"`,
        `"${item.interface}"`,
        `"${item.purpose}"`
      ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NEXUS_LAND_SENSOR_BOM_${activePreset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 56px)', overflowY: 'auto', background: 'var(--bg-void)' }}>
      {/* Top Breadcrumb & Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
              MISSION CRITICAL HARDWARE INTELLIGENCE
            </span>
            <span className="chip chip-green" style={{ fontSize: '10px' }}>● 14 REAL SENSORS ONLINE</span>
            <span className="chip chip-cyan" style={{ fontSize: '10px' }}>ISO 18674 COMPLIANT</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            Geotechnical Sensor & Telemetry Intelligence
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            High-resolution authentic imagery, geotechnical physical rationale, real-time simulated telemetry, and dynamic BOM calculations.
          </p>
        </div>

        {/* Global Controls: Currency & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
            {Object.keys(CURRENCIES).map(curr => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: 'none',
                  background: currency === curr ? 'var(--cyan)' : 'transparent',
                  color: currency === curr ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {curr}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📥</span> Export BOM (CSV)
          </button>
        </div>
      </div>

      {/* FEATURED HERO SPOTLIGHT BANNER: SHOWCASES THE SENSOR PROUDLY */}
      <div className="panel" style={{
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(14, 18, 26, 0.95), rgba(8, 10, 14, 0.98))',
        border: '1px solid rgba(0, 229, 255, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(0, 229, 255, 0.08)'
      }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />
            <span className="label-caps" style={{ color: 'var(--cyan)' }}>FEATURED FIELD INSTRUMENT SPOTLIGHT • 8K OPTICAL VIEW</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            CLICK ANY THUMBNAIL BELOW TO INSPECT HARDWARE
          </span>
        </div>
        <div className="panel-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 440px) 1fr', gap: '24px', alignItems: 'center' }}>
            {/* Left: Big Hero Image with Scanner Frame */}
            <div style={{
              position: 'relative',
              height: '270px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.15)',
              background: '#040608'
            }}>
              <div className="tactical-corner tactical-corner-tl" />
              <div className="tactical-corner tactical-corner-tr" />
              <div className="tactical-corner tactical-corner-bl" />
              <div className="tactical-corner tactical-corner-br" />

              <img
                src={SENSOR_IMAGE_MAP[spotlightItem.id] || spotlightItem.imageUrl}
                alt={spotlightItem.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'contrast(1.1) brightness(1.02)'
                }}
              />
              <div className="sensor-scan-line" />

              {/* Tactical HUD Overlay Details */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid var(--cyan)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#00e5ff',
                fontFamily: 'var(--font-mono)'
              }}>
                ● LIVE CALIBRATED OPTICAL FEED
              </div>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid #22c55e',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#22c55e',
                fontFamily: 'var(--font-mono)'
              }}>
                {SIMULATED_TELEMETRY[spotlightItem.id]?.value}
              </div>
            </div>

            {/* Right: Detailed Spotlight Description */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="chip chip-cyan" style={{ fontSize: '10px' }}>{spotlightItem.category}</span>
                <span className="chip chip-green" style={{ fontSize: '10px' }}>{spotlightItem.ingress}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Model: {spotlightItem.model}</span>
              </div>

              <h3 style={{ margin: '4px 0 8px 0', fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                {spotlightItem.name}
              </h3>

              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
                {spotlightItem.why_this_sensor}
              </p>

              {/* Key Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ACCURACY</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{spotlightItem.accuracy}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INTERFACE</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{spotlightItem.interface}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>EST. UNIT PRICE</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{formatPrice(spotlightItem.price_inr)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setInspectModalItem(spotlightItem)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🔍</span> Inspect Full Technical Datasheet
                </button>
                <button
                  className="btn"
                  onClick={() => handleQuantityChange(spotlightItem.id, 1)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-default)' }}
                >
                  + Add 1 Unit to BOM ({quantities[spotlightItem.id] || 0} in cart)
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Thumbnail Strip for All 14 Sensors */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {items.map(item => {
                const isSelected = item.id === spotlightId;
                const thumbImg = SENSOR_IMAGE_MAP[item.id] || item.imageUrl;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSpotlightId(item.id)}
                    style={{
                      flexShrink: 0,
                      width: '68px',
                      height: '52px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 10px rgba(0, 229, 255, 0.5)' : 'none',
                      opacity: isSelected ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    title={item.name}
                  >
                    <img src={thumbImg} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Deployment Packages */}
      <div className="panel" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(17, 19, 22, 0.95), rgba(26, 28, 34, 0.95))' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--cyan)' }}>⚡</span>
            <span className="label-caps">TURNKEY REAL-WORLD DEPLOYMENT PACKAGES</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            1-CLICK DEPLOYMENT PRESETS
          </span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {Object.entries(DEPLOYMENT_PRESETS).map(([key, pack]) => {
              const isSelected = activePreset === key;
              return (
                <div
                  key={key}
                  onClick={() => handleSetPreset(key)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.25s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: isSelected ? 'var(--cyan)' : 'var(--text-muted)',
                      letterSpacing: '0.08em'
                    }}>
                      {pack.badge}
                    </span>
                    {isSelected && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    {pack.title}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {pack.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View Mode Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
          <button
            onClick={() => setActiveTab('CARDS')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'CARDS' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'CARDS' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📸</span> HARDWARE CATALOG & SPECS ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab('TOPOGRAPHY')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'TOPOGRAPHY' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'TOPOGRAPHY' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⛰️</span> REAL-TIME TERRAIN ANALYTICS
            <span style={{
              background: activeTab === 'TOPOGRAPHY' ? 'rgba(0,0,0,0.25)' : 'rgba(255,59,92,0.2)',
              color: activeTab === 'TOPOGRAPHY' ? '#000' : 'var(--red)',
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '10px',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              ● LIVE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('AUTONOMY')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'AUTONOMY' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'AUTONOMY' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡</span> POWER & SOLAR AUTONOMY ({powerAutonomy.autonomyDays} DAYS)
          </button>
          <button
            onClick={() => setActiveTab('BOM_TABLE')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'BOM_TABLE' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'BOM_TABLE' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span> BOM COST MATRIX
          </button>
        </div>

        {/* Global Photos vs Blueprints Switcher */}
        {activeTab === 'CARDS' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VIEW ALL AS:</span>
            <button
              onClick={() => {
                const modes = {};
                items.forEach(i => { modes[i.id] = 'PHOTO'; });
                setCardVisualModes(modes);
              }}
              className="btn"
              style={{ padding: '5px 12px', fontSize: '11px', background: 'rgba(0, 229, 255, 0.12)', border: '1px solid var(--cyan)', color: 'var(--cyan)' }}
            >
              📷 Real Photos
            </button>
            <button
              onClick={() => {
                const modes = {};
                items.forEach(i => { modes[i.id] = 'BLUEPRINT'; });
                setCardVisualModes(modes);
              }}
              className="btn"
              style={{ padding: '5px 12px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)' }}
            >
              📐 Blueprints
            </button>
          </div>
        )}
      </div>

      {/* Category Sub-Filters and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'GEOTECHNICAL', 'METEOROLOGICAL', 'HYDROLOGY', 'SEISMIC', 'COMMUNICATION', 'COMPUTE', 'POWER', 'HOUSING'].map(cat => {
            const count = cat === 'ALL' ? items.length : items.filter(i => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-panel)',
                  color: isSelected ? 'var(--cyan)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="🔍 Search sensor, protocol, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ width: '100%', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SENSOR CARDS VIEW */}
      {activeTab === 'CARDS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px' }}>
          {/* Left: Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {filteredItems.map(item => {
              const qty = quantities[item.id] || 0;
              const isIncluded = qty > 0;
              const cardMode = cardVisualModes[item.id] || 'PHOTO';

              return (
                <div
                  key={item.id}
                  className="panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: isIncluded ? '1px solid rgba(0, 229, 255, 0.35)' : '1px solid var(--border-subtle)',
                    boxShadow: isIncluded ? '0 0 16px rgba(0, 229, 255, 0.08)' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  {/* Real-World Sensor Visual with Camera Frame */}
                  <div style={{ padding: '12px 12px 0 12px' }}>
                    <SensorVisual
                      item={item}
                      viewMode={cardMode}
                      onToggleMode={handleToggleCardVisual}
                      onInspect={() => setInspectModalItem(item)}
                    />
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          #{item.id} • {item.category}
                        </span>
                        <h4 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                          {item.name}
                        </h4>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Model: {item.model}
                        </div>
                      </div>
                      <span className={`chip ${item.required ? 'chip-red' : 'chip-green'}`} style={{ fontSize: '9px' }}>
                        {item.required ? 'CORE MUST-HAVE' : 'OPTIONAL EXPANSION'}
                      </span>
                    </div>

                    {/* Operational Purpose */}
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px', lineHeight: 1.4 }}>
                      {item.purpose}
                    </div>

                    {/* WHY THIS SENSOR IS ESSENTIAL (Operational Rationale) */}
                    <div style={{
                      background: 'rgba(0, 229, 255, 0.04)',
                      border: '1px solid rgba(0, 229, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px' }}>🎯</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                          WHY THIS SENSOR IS ESSENTIAL:
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        {item.why_this_sensor}
                      </p>
                    </div>

                    {/* WHY SUITABLE & BENEFICIAL (Engineering Advantages) */}
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.04)',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px' }}>🛡️</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                          SUITABILITY & FIELD ADVANTAGES:
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {item.suitability_and_benefits}
                      </p>
                    </div>

                    {/* Specifications Matrix */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                      fontSize: '11px',
                      marginBottom: '16px',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Accuracy:</span>{' '}
                        <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{item.accuracy}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Interface:</span>{' '}
                        <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{item.interface}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Operating:</span>{' '}
                        <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{item.operating_range}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Power:</span>{' '}
                        <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{item.power}</span>
                      </div>
                    </div>

                    {/* Card Footer: Price & Quantity Controls */}
                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>UNIT PRICE</div>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                          {formatPrice(item.price_inr)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            style={{
                              padding: '4px 8px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isIncluded ? 'var(--cyan)' : 'var(--text-muted)' }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            style={{
                              padding: '4px 8px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => setInspectModalItem(item)}
                          className="btn"
                          style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.05)' }}
                          title="Inspect deep technical datasheet, borehole installation, and wiring pinout"
                        >
                          🔍 Specs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Live Interactive BOM Summary Sidebar */}
          <div style={{ position: 'sticky', top: '10px', height: 'fit-content' }}>
            <div className="panel" style={{ border: '1px solid var(--border-cyan)', background: 'linear-gradient(180deg, rgba(17, 19, 22, 0.95), rgba(10, 12, 16, 0.98))' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label-caps">LIVE HARDWARE PROCUREMENT BOM</span>
                <span className="chip chip-cyan">{bomSummary.totalActiveComponents} UNITS</span>
              </div>
              <div className="panel-body">
                <div style={{ background: 'rgba(0, 229, 255, 0.08)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(0, 229, 255, 0.2)', marginBottom: '14px', fontSize: '11px' }}>
                  <div style={{ color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>ACTIVE ARCHITECTURE:</div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{DEPLOYMENT_PRESETS[activePreset]?.title || "Custom Engineering BOM"}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sensors & Telemetry:</span>
                    <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatPrice(bomSummary.hardwareSubtotalInr)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Mounting Hardware & Mast:</span>
                    <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatPrice(bomSummary.mountingKitInr)}</span>
                  </div>

                  {/* Umbilical Cable Slider */}
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Armored Cable ({cableLengthMeters}m):</span>
                      <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatPrice(bomSummary.cableCostInr)}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      step="10"
                      value={cableLengthMeters}
                      onChange={(e) => setCableLengthMeters(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--cyan)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>20m</span>
                      <span>150m</span>
                      <span>300m</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Shipping & Packaging (5%):</span>
                    <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatPrice(bomSummary.shippingFreightInr)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Taxes & Duty (18% GST):</span>
                    <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatPrice(bomSummary.taxesInr)}</span>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-default)', margin: '14px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>TOTAL DEPLOYMENT:</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(bomSummary.grandTotalInr)}
                  </span>
                </div>

                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontWeight: 700, marginBottom: '2px' }}>
                    <span>🔋</span> OFF-GRID SOLAR AUTONOMY:
                  </div>
                  <div style={{ color: '#cbd5e1' }}>
                    Estimated <strong style={{ color: '#fff' }}>{powerAutonomy.autonomyDays} days</strong> continuous operation under 0% sunlight (heavy monsoon overcast).
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={handleExportCSV} style={{ width: '100%', justifyContent: 'center' }}>
                    <span>📥</span> Export Procurement BOM (.CSV)
                  </button>
                  <button
                    onClick={() => handleSetPreset('COMMUNITY')}
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}
                  >
                    🔄 Reset to Baseline Village Node
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME TERRAIN ANALYTICS & SENSING SCHEMATIC */}
      {activeTab === 'TOPOGRAPHY' && (
        <div className="panel" style={{ marginBottom: '20px' }}>
          <div className="panel-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <span className="label-caps" style={{ color: 'var(--cyan)' }}>
                🏔️ REAL-TIME TERRAIN SENSING & BISHOP STABILITY ANALYTICS
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                FIELD-DEPLOYED TELEMETRY • LORAWAN MESH TOPOLOGY • SUBSURFACE BOREHOLE SHEAR BAND • LIVE FoS PREDICTION
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid var(--border-cyan)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: simStormActive ? 'var(--red)' : 'var(--green)',
                  boxShadow: `0 0 8px ${simStormActive ? 'var(--red)' : 'var(--green)'}`
                }} />
                <span style={{ color: simStormActive ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                  {simStormActive ? 'STORM SURGE MODE' : 'POLLING ACTIVE (2.0s)'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: '#cbd5e1' }}>14/14 CHANNELS OK</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--cyan)' }}>CRC 100%</span>
              </div>

              {/* Storm Drill Trigger Button */}
              <button
                onClick={() => setSimStormActive(!simStormActive)}
                className="btn"
                style={{
                  background: simStormActive ? 'rgba(255, 59, 92, 0.2)' : 'rgba(255, 176, 32, 0.15)',
                  border: `1px solid ${simStormActive ? 'var(--red)' : 'var(--amber)'}`,
                  color: simStormActive ? 'var(--red)' : 'var(--amber)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{simStormActive ? '✓' : '⛈️'}</span>
                {simStormActive ? 'RESTORE NORMAL SENSING' : 'DRILL: TRIGGER MONSOON SURGE'}
              </button>
            </div>
          </div>

          <div className="panel-body" style={{ padding: '20px' }}>
            {/* Tactical Layer Toggle Toolbar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'rgba(10, 15, 26, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '4px' }}>
                  ANALYTIC LAYERS:
                </span>

                <button
                  onClick={() => setTerrainLayers(p => ({ ...p, optical: !p.optical }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terrainLayers.optical ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${terrainLayers.optical ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                    color: terrainLayers.optical ? 'var(--cyan)' : 'var(--text-secondary)'
                  }}
                >
                  📷 OPTICAL REALITY
                </button>

                <button
                  onClick={() => setTerrainLayers(p => ({ ...p, bishopFos: !p.bishopFos }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terrainLayers.bishopFos ? 'rgba(255, 59, 92, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${terrainLayers.bishopFos ? 'var(--red)' : 'var(--border-subtle)'}`,
                    color: terrainLayers.bishopFos ? 'var(--red)' : 'var(--text-secondary)'
                  }}
                >
                  🔬 BISHOP SLIP ARC ({liveTerrainTelemetry.fos})
                </button>

                <button
                  onClick={() => setTerrainLayers(p => ({ ...p, porePressure: !p.porePressure }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terrainLayers.porePressure ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${terrainLayers.porePressure ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                    color: terrainLayers.porePressure ? 'var(--cyan)' : 'var(--text-secondary)'
                  }}
                >
                  💧 PORE PRESSURE PLUME ({liveTerrainTelemetry.porePressure} kPa)
                </button>

                <button
                  onClick={() => setTerrainLayers(p => ({ ...p, loraMesh: !p.loraMesh }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terrainLayers.loraMesh ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${terrainLayers.loraMesh ? 'var(--green)' : 'var(--border-subtle)'}`,
                    color: terrainLayers.loraMesh ? 'var(--green)' : 'var(--text-secondary)'
                  }}
                >
                  ⚡ LoRaWAN 868MHz MESH
                </button>

                <button
                  onClick={() => setTerrainLayers(p => ({ ...p, lidarScan: !p.lidarScan }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terrainLayers.lidarScan ? 'rgba(255, 176, 32, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${terrainLayers.lidarScan ? 'var(--amber)' : 'var(--border-subtle)'}`,
                    color: terrainLayers.lidarScan ? 'var(--amber)' : 'var(--text-secondary)'
                  }}
                >
                  🎯 LiDAR CV RETICLE
                </button>

                <button
                  onClick={() => setTerrainLayers(p => ({ ...p, sensorPins: !p.sensorPins }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terrainLayers.sensorPins ? 'rgba(217, 70, 239, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${terrainLayers.sensorPins ? '#d946ef' : 'var(--border-subtle)'}`,
                    color: terrainLayers.sensorPins ? '#d946ef' : 'var(--text-secondary)'
                  }}
                >
                  📍 HUD PIN CALLOUTS
                </button>
              </div>

              {/* Real-time Global FoS Assessment */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>SLOPE STABILITY:</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: liveTerrainTelemetry.fos < 1.0 ? 'rgba(255, 59, 92, 0.25)' : liveTerrainTelemetry.fos <= 1.15 ? 'rgba(255, 176, 32, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: liveTerrainTelemetry.fos < 1.0 ? 'var(--red)' : liveTerrainTelemetry.fos <= 1.15 ? 'var(--amber)' : 'var(--green)',
                  border: `1px solid ${liveTerrainTelemetry.fos < 1.0 ? 'var(--red)' : liveTerrainTelemetry.fos <= 1.15 ? 'var(--amber)' : 'var(--green)'}`
                }}>
                  FoS = {liveTerrainTelemetry.fos} ({liveTerrainTelemetry.fos < 1.0 ? 'FAILURE IMMINENT' : liveTerrainTelemetry.fos <= 1.15 ? 'METASTABLE / CRITICAL' : 'STABLE'})
                </span>
              </div>
            </div>

            {/* PHOTOGRAPHIC MOUNTAIN TERRAIN VIEWPORT WITH ANALYTICS OVERLAY */}
            <div
              className={simStormActive ? 'storm-warning-active' : ''}
              style={{
                width: '100%',
                height: '520px',
                background: '#04070e',
                borderRadius: '10px',
                border: `1px solid ${simStormActive ? 'var(--red)' : 'var(--border-cyan)'}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: simStormActive ? '0 0 30px rgba(255, 59, 92, 0.4)' : '0 8px 32px rgba(0, 229, 255, 0.15)',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
              }}
            >
              {/* Tactical Corners */}
              <div className="tactical-corner tactical-corner-tl" />
              <div className="tactical-corner tactical-corner-tr" />
              <div className="tactical-corner tactical-corner-bl" />
              <div className="tactical-corner tactical-corner-br" />

              {/* Storm Mode Flash Warning Banner */}
              {simStormActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(90deg, rgba(255, 59, 92, 0.95), rgba(185, 28, 28, 0.95))',
                  color: '#fff',
                  padding: '10px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 25,
                  boxShadow: '0 4px 20px rgba(255, 59, 92, 0.6)',
                  animation: 'warningStrobeGlow 1s infinite'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🚨</span>
                    <span>[LEVEL-4 EMERGENCY] CRITICAL FoS BREACH ({liveTerrainTelemetry.fos}) • TERTIARY BOREHOLE SHEAR ACCELERATION DETECTED</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#ff3b5c' }}>
                      SIRENS & CELL BROADCAST ACTIVE
                    </span>
                    <button
                      onClick={() => setSimStormActive(false)}
                      style={{
                        background: '#fff',
                        color: '#b91c1c',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      RESET DRILL
                    </button>
                  </div>
                </div>
              )}

              {/* REAL MOUNTAIN SLOPE PHOTOGRAPH */}
              <img
                src={slopeTerrainImg}
                alt="Active Mountain Slope Landslide Hazard Sensing Field"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: simStormActive
                    ? 'brightness(0.65) contrast(1.3) saturate(1.1) hue-rotate(-12deg)'
                    : terrainLayers.optical
                    ? 'brightness(0.85) contrast(1.1)'
                    : 'brightness(0.35) contrast(1.4) grayscale(0.5)',
                  transition: 'filter 0.5s ease'
                }}
              />

              {/* Dark Vignette & Edge Shading for Maximum Overlay Legibility */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(ellipse at 50% 50%, rgba(5, 10, 20, 0.15) 0%, rgba(3, 6, 12, 0.8) 100%)',
                pointerEvents: 'none',
                zIndex: 2
              }} />

              {/* Storm Rain Streak Overlay (Simulated Weather) */}
              {simStormActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'repeating-linear-gradient(115deg, rgba(0, 229, 255, 0.08) 0px, rgba(0, 229, 255, 0.08) 2px, transparent 2px, transparent 18px)',
                  pointerEvents: 'none',
                  zIndex: 3
                }} />
              )}

              {/* Sweeping LiDAR Scan Line */}
              {terrainLayers.lidarScan && (
                <div className="sensor-scan-line" style={{ zIndex: 10 }} />
              )}

              {/* High-Tech Optical Spatial Reticle HUD at Bottom */}
              {terrainLayers.lidarScan && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  background: 'rgba(5, 10, 20, 0.88)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.7)'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)' }} />
                  <span>🎯 CV LiDAR SCANNER: <strong>ACTIVE SWEEP</strong></span>
                  <span style={{ color: 'var(--cyan)' }}>LAT: 31.1048°N</span>
                  <span style={{ color: 'var(--cyan)' }}>LON: 77.1734°E</span>
                  <span style={{ color: 'var(--green)' }}>REFLECTANCE: 94.2%</span>
                  <span style={{ color: simStormActive ? 'var(--red)' : 'var(--amber)' }}>
                    KINEMATIC DISPLACEMENT: {simStormActive ? '+4.8 mm/hr (TERTIARY)' : '+0.42 mm/day (CREEP)'}
                  </span>
                </div>
              )}

              {/* Top-Left Geographic Position Callout */}
              <div style={{
                position: 'absolute',
                top: simStormActive ? '48px' : '16px',
                left: '16px',
                background: 'rgba(5, 10, 20, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                zIndex: 12,
                transition: 'top 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>● OPTICAL FIELD TELEMETRY</span>
                  <span>SLOPE SECTOR 4B (HIMALAYAN TRANSECT)</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  RESOLUTION: 8K LIDAR FUSION • ELEVATION SPAN: 1,920m - 2,240m ASL
                </div>
              </div>

              {/* Top-Right Real-time Sensor Metric Ticker Over Photo */}
              <div style={{
                position: 'absolute',
                top: simStormActive ? '48px' : '16px',
                right: '16px',
                background: 'rgba(5, 10, 20, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 12,
                transition: 'top 0.3s ease'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9px', display: 'block' }}>RAIN INTENSITY</span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{liveTerrainTelemetry.rainfall} mm/h</span>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9px', display: 'block' }}>PORE PRESSURE (u)</span>
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>{liveTerrainTelemetry.porePressure} kPa</span>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9px', display: 'block' }}>CROWN DILATION</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700 }}>+{liveTerrainTelemetry.crackOpening} mm</span>
                </div>
              </div>

              {/* SVG ANALYTICAL & TELEMETRY LAYER OVER REAL IMAGE */}
              <svg
                viewBox="0 0 1000 500"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 5
                }}
              >
                <defs>
                  <filter id="hazardGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="cyanPulseGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="saturationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.06" />
                  </linearGradient>
                  <linearGradient id="failureWedgeGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff3b5c" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ff3b5c" stopOpacity="0.04" />
                  </linearGradient>
                </defs>

                {/* Subsurface Pore-Water Saturation Plume */}
                {terrainLayers.porePressure && (
                  <g>
                    <path
                      d="M 630 180 Q 450 250 190 380 L 190 450 Q 480 420 650 240 Z"
                      fill="url(#saturationGrad)"
                    />
                    {/* Seepage percolation streamline arrows */}
                    <path d="M 600 200 Q 480 270 240 390" fill="none" stroke="#00e5ff" strokeWidth="1.8" strokeDasharray="5 5" opacity="0.85" />
                    <path d="M 560 230 Q 440 300 280 410" fill="none" stroke="#00e5ff" strokeWidth="1.4" strokeDasharray="5 5" opacity="0.7" />
                    <text x="280" y="435" fill="#00e5ff" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700" opacity="0.95">
                      SUBSURFACE PORE-WATER SATURATION PLUME (u = {liveTerrainTelemetry.porePressure} kPa • Ru = 0.52)
                    </text>
                  </g>
                )}

                {/* Bishop Critical Slip Surface Hazard Arc */}
                {terrainLayers.bishopFos && (
                  <g>
                    <path
                      d="M 190 375 Q 430 360 630 170"
                      fill="none"
                      stroke="#ff3b5c"
                      strokeWidth={simStormActive ? '5' : '3.5'}
                      strokeDasharray="10 5"
                      className="slip-surface-hazard"
                      filter="url(#hazardGlow)"
                    />
                    {/* Failure wedge shaded area */}
                    <path
                      d="M 190 375 Q 430 360 630 170 L 630 230 L 440 330 L 190 375 Z"
                      fill="url(#failureWedgeGrad)"
                    />
                    <text x="350" y="335" fill="#ff3b5c" fontSize="12" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="1px">
                      POTENTIAL ROTATIONAL SLIP PLANE (BISHOP FoS = {liveTerrainTelemetry.fos})
                    </text>
                    {/* Shear traction vector arrows */}
                    {[260, 350, 450, 540].map((ax, idx) => (
                      <g key={idx} transform={`translate(${ax}, ${345 - idx * 32}) rotate(34)`}>
                        <line x1="0" y1="0" x2="-22" y2="0" stroke="#ff3b5c" strokeWidth="2" strokeDasharray="3 2" />
                        <polygon points="-22,0 -16,-4 -16,4" fill="#ff3b5c" />
                      </g>
                    ))}
                  </g>
                )}

                {/* 12m Borehole Inclinometer & Piezometer Stem into Rock */}
                <g transform="translate(440, 265)">
                  <line x1="0" y1="0" x2="0" y2="120" stroke="#00e5ff" strokeWidth="3" strokeDasharray="4 2" />
                  <rect x="-8" y="0" width="16" height="40" fill="rgba(255, 176, 32, 0.5)" />
                  <circle cx="0" cy="115" r="7" fill="#ff3b5c" stroke="#fff" strokeWidth="1.5" />
                  <text x="18" y="30" fill="#ffb020" fontSize="10" fontFamily="var(--font-mono)">0-1.2m TDR VWC</text>
                  <text x="18" y="118" fill="#ff3b5c" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">12m VW PIEZOMETER</text>
                </g>

                {/* Tension Head Scarp Fracture Opening */}
                <g transform="translate(630, 170)">
                  <path d="M -15 -10 L 0 0 L 15 -8 L 30 2" stroke="#ff3b5c" strokeWidth="3" fill="none" />
                  <text x="-70" y="-18" fill="#ff3b5c" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">
                    CROWN EXTENSION FISSURE (+{liveTerrainTelemetry.crackOpening}mm)
                  </text>
                </g>

                {/* LoRaWAN 868MHz Mesh Topology & Wireless Signal Paths */}
                {terrainLayers.loraMesh && (
                  <g>
                    {/* Toe to Mid-Slope */}
                    <path d="M 190 375 Q 315 310 440 265" fill="none" stroke="#00e5ff" strokeWidth="2.5" className="lora-signal-beam" />
                    {/* Mid-Slope to Crown */}
                    <path d="M 440 265 Q 535 210 630 170" fill="none" stroke="#22c55e" strokeWidth="2.5" className="lora-signal-beam" />
                    {/* Crown to Summit Gateway */}
                    <path d="M 630 170 Q 720 120 810 80" fill="none" stroke="#22c55e" strokeWidth="2.5" className="lora-signal-beam" />
                    {/* Direct Long-Range Redundant Link (Toe to Gateway) */}
                    <path d="M 190 375 Q 520 160 810 80" fill="none" stroke="#ffb020" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" />
                    {/* Gateway to Satellite Uplink */}
                    <path d="M 810 80 L 920 30" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 3" opacity="0.85" />

                    {/* Traveling Energy Packet Pulses */}
                    <circle cx={440 + Math.sin(Date.now() / 400) * 80} cy={265 - Math.sin(Date.now() / 400) * 40} r="4" fill="#fff" filter="url(#cyanPulseGlow)" />
                    <circle cx={630 + Math.cos(Date.now() / 350) * 70} cy={170 - Math.cos(Date.now() / 350) * 35} r="4" fill="#22c55e" filter="url(#cyanPulseGlow)" />

                    {/* Satellite Node Callout at Top Right */}
                    <g transform="translate(920, 30)">
                      <circle cx="0" cy="0" r="16" fill="rgba(0, 229, 255, 0.15)" stroke="var(--cyan)" strokeWidth="1.5" />
                      <text x="-8" y="5" fontSize="13">🛰️</text>
                      <text x="-32" y="26" fill="var(--cyan)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">IRIDIUM SATELLITE</text>
                    </g>
                  </g>
                )}

                {/* Elevation Contours */}
                <g opacity="0.75">
                  <line x1="60" y1="80" x2="160" y2="80" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" />
                  <text x="170" y="84" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">2,240m ASL (SUMMIT RIDGE)</text>

                  <line x1="60" y1="170" x2="160" y2="170" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" />
                  <text x="170" y="174" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">2,160m ASL (HEAD SCARP)</text>

                  <line x1="60" y1="265" x2="160" y2="265" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" />
                  <text x="170" y="269" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">2,050m ASL (BOREHOLE SHEAR BAND)</text>

                  <line x1="60" y1="375" x2="160" y2="375" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" />
                  <text x="170" y="379" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">1,920m ASL (TOE GULLY)</text>
                </g>
              </svg>

              {/* INTERACTIVE SENSOR HOTSPOT PINS & LIVE HUD BADGES OVER REAL IMAGE */}
              {terrainLayers.sensorPins && TERRAIN_STATIONS.map((st) => {
                const isSelected = selectedTerrainStationId === st.id;
                const valDisplay =
                  st.id === 'ST-01' ? `${liveTerrainTelemetry.batteryVoltage}V • ${liveTerrainTelemetry.rssi}dBm` :
                  st.id === 'ST-02' ? `θ: +${liveTerrainTelemetry.tiltX}° • Δw: +${liveTerrainTelemetry.crackOpening}mm` :
                  st.id === 'ST-03' ? `u: ${liveTerrainTelemetry.porePressure} kPa • VWC: ${liveTerrainTelemetry.soilMoisture}%` :
                  `${liveTerrainTelemetry.rainfall} mm/h • Stage: ${liveTerrainTelemetry.debrisStage}m`;

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedTerrainStationId(st.id)}
                    style={{
                      position: 'absolute',
                      left: st.pinPos.left,
                      top: st.pinPos.top,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: 16,
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {/* Outer Expanding Ping Ring Animation */}
                    <div
                      className="sensor-ping-ring"
                      style={{
                        borderColor: st.color,
                        boxShadow: `0 0 14px ${st.color}`,
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />

                    {/* Sensor Pin Icon Button */}
                    <div style={{
                      width: isSelected ? '42px' : '36px',
                      height: isSelected ? '42px' : '36px',
                      borderRadius: '50%',
                      background: isSelected ? st.color : 'rgba(10, 15, 26, 0.94)',
                      color: isSelected ? '#000' : '#fff',
                      border: `2px solid ${st.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: `0 0 18px ${st.color}`,
                      transition: 'all 0.2s ease'
                    }}>
                      {st.id === 'ST-01' ? '📡' : st.id === 'ST-02' ? '📐' : st.id === 'ST-03' ? '💧' : '🌧️'}
                    </div>

                    {/* Pinned Tactical HUD Callout Tag */}
                    <div style={{
                      position: 'absolute',
                      top: st.id === 'ST-01' ? '48px' : '-56px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(5, 10, 20, 0.92)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${isSelected ? st.color : 'var(--border-subtle)'}`,
                      boxShadow: isSelected ? `0 0 20px ${st.color}77` : '0 4px 14px rgba(0,0,0,0.7)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: st.color, fontFamily: 'var(--font-mono)' }}>{st.id}</span>
                        <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 600 }}>{st.name.split(' ')[0]}</span>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: st.color,
                          boxShadow: `0 0 6px ${st.color}`
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {valDisplay}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STATION QUICK SWITCHER TABS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginTop: '16px',
              marginBottom: '20px'
            }}>
              {TERRAIN_STATIONS.map(st => {
                const isSelected = selectedTerrainStationId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedTerrainStationId(st.id)}
                    style={{
                      background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? st.color : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 16px ${st.color}33` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: st.color, fontFamily: 'var(--font-mono)' }}>{st.id} • {st.altitude}</span>
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isSelected ? st.color : 'rgba(255,255,255,0.06)',
                        color: isSelected ? '#000' : 'var(--text-secondary)',
                        fontWeight: 700
                      }}>
                        {isSelected ? 'SELECTED' : 'VIEW'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {st.zone}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED STATION TACTICAL DEEP-DIVE INSPECTOR */}
            <div style={{
              background: 'var(--bg-card)',
              border: `1px solid ${selectedTerrainStation.color}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: `0 0 24px ${selectedTerrainStation.color}22`,
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '14px',
                marginBottom: '18px',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: selectedTerrainStation.color,
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {selectedTerrainStation.id}
                    </span>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>
                      {selectedTerrainStation.name}
                    </h3>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    ZONE: {selectedTerrainStation.zone} • ALTITUDE: {selectedTerrainStation.altitude} • COORDS: {selectedTerrainStation.coords}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setSpotlightId(selectedTerrainStation.primarySensorId);
                      setActiveTab('CARDS');
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    <span>🔍</span> SPOTLIGHT SENSOR IN HARDWARE BOM
                  </button>
                </div>
              </div>

              {/* 3-Column Tactical Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Column 1: Real Field Hardware Instrumentation Photo */}
                <div>
                  <span className="label-caps" style={{ color: 'var(--cyan)', marginBottom: '10px', display: 'block' }}>
                    📷 DEPLOYED FIELD HARDWARE PHOTOGRAPH
                  </span>
                  <div style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-cyan)',
                    height: '200px',
                    background: '#07090d',
                    marginBottom: '10px'
                  }}>
                    <img
                      src={SENSOR_IMAGE_MAP[selectedTerrainStation.primarySensorId]}
                      alt={selectedTerrainStation.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {selectedTerrainStation.sensorTypes[0]}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Integrated Hardware Cluster:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1', fontSize: '11px' }}>
                      {selectedTerrainStation.sensorTypes.map((st, idx) => (
                        <li key={idx}>{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Column 2: Live Telemetry Metrics & Dynamic 24h Trend Waveform */}
                <div>
                  <span className="label-caps" style={{ color: 'var(--amber)', marginBottom: '10px', display: 'block' }}>
                    📈 LIVE TELEMETRY & 24-HOUR TREND WAVEFORM
                  </span>

                  <div style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PRIMARY METRIC READING:</span>
                      <strong style={{ fontSize: '13px', color: selectedTerrainStation.color, fontFamily: 'var(--font-mono)' }}>
                        {selectedTerrainStation.id === 'ST-01' ? `${liveTerrainTelemetry.batteryVoltage}V (94% SoC)` :
                         selectedTerrainStation.id === 'ST-02' ? `+${liveTerrainTelemetry.crackOpening} mm (Rate: +${liveTerrainTelemetry.crackRate} mm/h)` :
                         selectedTerrainStation.id === 'ST-03' ? `${liveTerrainTelemetry.porePressure} kPa (Ru = 0.52)` :
                         `${liveTerrainTelemetry.rainfall} mm/hr (Stage: ${liveTerrainTelemetry.debrisStage}m)`}
                      </strong>
                    </div>

                    {/* Animated SVG Sparkline Waveform */}
                    <div style={{ height: '70px', width: '100%', position: 'relative' }}>
                      <svg viewBox="0 0 300 70" style={{ width: '100%', height: '100%' }}>
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={selectedTerrainStation.color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={selectedTerrainStation.color} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={
                            selectedTerrainStation.id === 'ST-03'
                              ? "M 0 50 Q 50 48 100 45 T 200 35 T 250 20 L 300 12 L 300 70 L 0 70 Z"
                              : selectedTerrainStation.id === 'ST-02'
                              ? "M 0 55 Q 60 52 120 48 T 220 38 T 260 22 L 300 15 L 300 70 L 0 70 Z"
                              : "M 0 58 Q 70 55 140 45 T 220 40 T 270 28 L 300 20 L 300 70 L 0 70 Z"
                          }
                          fill="url(#trendGrad)"
                        />
                        <path
                          d={
                            selectedTerrainStation.id === 'ST-03'
                              ? "M 0 50 Q 50 48 100 45 T 200 35 T 250 20 L 300 12"
                              : selectedTerrainStation.id === 'ST-02'
                              ? "M 0 55 Q 60 52 120 48 T 220 38 T 260 22 L 300 15"
                              : "M 0 58 Q 70 55 140 45 T 220 40 T 270 28 L 300 20"
                          }
                          fill="none"
                          stroke={selectedTerrainStation.color}
                          strokeWidth="2.5"
                        />
                        {/* Current peak point */}
                        <circle cx="300" cy="15" r="4" fill="#fff" stroke={selectedTerrainStation.color} strokeWidth="2" />
                      </svg>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      <span>-24 HOURS</span>
                      <span>-12 HOURS</span>
                      <span>-6 HOURS</span>
                      <span style={{ color: selectedTerrainStation.color, fontWeight: 700 }}>NOW ({liveTerrainTelemetry.lastUpdate})</span>
                    </div>
                  </div>

                  {/* Diagnostic telemetry parameters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>RF SIGNAL LINK</span>
                      <span style={{ color: 'var(--cyan)' }}>RSSI {liveTerrainTelemetry.rssi} dBm (SNR +9.4dB)</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>POWER HARVEST</span>
                      <span style={{ color: 'var(--green)' }}>{liveTerrainTelemetry.solarWatts}W MPPT (13.4V)</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>INTERFACE PROTOCOL</span>
                      <span style={{ color: '#cbd5e1' }}>SDI-12 v1.4 / RS-485</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '9px' }}>INGRESS RATING</span>
                      <span style={{ color: 'var(--green)' }}>IP68 Hermetic (50 bar)</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Geotechnical Collapse Physics & Early Warning Role */}
                <div>
                  <span className="label-caps" style={{ color: 'var(--green)', marginBottom: '10px', display: 'block' }}>
                    🔬 GEOTECHNICAL PHYSICS & EARLY WARNING ROLE
                  </span>

                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                      GOVERNING GEOMECHANICAL LAW:
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#cbd5e1',
                      fontStyle: 'italic',
                      background: 'rgba(0, 229, 255, 0.05)',
                      padding: '8px',
                      borderRadius: '4px',
                      borderLeft: '3px solid var(--cyan)',
                      marginBottom: '10px'
                    }}>
                      {selectedTerrainStation.governingPhysics}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {selectedTerrainStation.geotechnicalSignificance}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 59, 92, 0.08)',
                    border: '1px solid rgba(255, 59, 92, 0.3)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '11px'
                  }}>
                    <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                      ⚠️ AUTOMATED EARLY WARNING THRESHOLD:
                    </div>
                    <div style={{ color: '#e2e8f0' }}>
                      {selectedTerrainStation.alertThreshold}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REAL-TIME LORAWAN TELEMETRY PACKET CONSOLE */}
            <div style={{
              background: '#04070d',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(10, 15, 26, 0.9)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="term-cursor" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    LIVE LoRaWAN & SDI-12 PACKET STREAM TERMINAL
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    (SUBSCRIBED: /topo/sensors/live/#)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setPacketStreamPaused(!packetStreamPaused)}
                    style={{
                      background: packetStreamPaused ? 'var(--amber)' : 'rgba(255,255,255,0.06)',
                      color: packetStreamPaused ? '#000' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {packetStreamPaused ? '▶ RESUME' : '⏸ PAUSE'}
                  </button>
                  <button
                    onClick={() => setPacketLogs([])}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              {/* Console log rows */}
              <div style={{
                padding: '12px 16px',
                maxHeight: '160px',
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: '1.6',
                background: '#030509'
              }}>
                {packetLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>Waiting for next telemetry burst...</div>
                ) : (
                  packetLogs.map(pkt => (
                    <div key={pkt.id} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '2px 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>[{pkt.time}]</span>
                      <span style={{ color: 'var(--cyan)' }}>PKT#{pkt.id}</span>
                      <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{pkt.node}</span>
                      <span style={{ color: '#94a3b8' }}>HEX: {pkt.hex}</span>
                      <span style={{ color: '#fff' }}>&rarr; {pkt.reading}</span>
                      <span style={{ color: pkt.rssi > -70 ? 'var(--green)' : 'var(--amber)' }}>RSSI: {pkt.rssi}dBm</span>
                      <span style={{ color: 'var(--green)' }}>SNR: {pkt.snr}</span>
                      <span style={{
                        color: pkt.status === 'CRC_OK' ? 'var(--green)' : pkt.status === 'WARN_CREEP' ? 'var(--amber)' : 'var(--red)',
                        fontWeight: 700
                      }}>
                        [{pkt.status}]
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POWER & SOLAR AUTONOMY CALCULATOR */}
      {activeTab === 'AUTONOMY' && (
        <div className="panel" style={{ marginBottom: '20px' }}>
          <div className="panel-header">
            <span className="label-caps">DYNAMIC SOLAR & OFF-GRID POWER AUTONOMY SIMULATOR</span>
            <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
              REAL-WORLD MONSOON CLOUD-COVER STRESS SIMULATION
            </span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px' }}>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '12px' }}>Power Configuration & Environmental Variables</h4>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sensor Sampling & Transmission Interval:</span>
                    <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                      Every {samplingRateMin} {samplingRateMin === 1 ? 'Minute' : 'Minutes'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 5, 15, 60].map(val => (
                      <button
                        key={val}
                        onClick={() => setSamplingRateMin(val)}
                        className="btn"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          background: samplingRateMin === val ? 'var(--cyan)' : 'var(--bg-card)',
                          color: samplingRateMin === val ? '#000' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)'
                        }}
                      >
                        {val === 60 ? '1 Hour (Ultra-Eco)' : `${val} Min`}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monocrystalline PV Panel Capacity:</span>
                    <strong style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{pvWatts} Watts</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[20, 30, 50, 100].map(val => (
                      <button
                        key={val}
                        onClick={() => setPvWatts(val)}
                        className="btn"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          background: pvWatts === val ? 'var(--amber)' : 'var(--bg-card)',
                          color: pvWatts === val ? '#000' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)'
                        }}
                      >
                        {val}W Panel
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>12V LiFePO4 Smart Battery Pack:</span>
                    <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{batteryAh} Ah ({batteryAh * 12} Wh)</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[10, 20, 40].map(val => (
                      <button
                        key={val}
                        onClick={() => setBatteryAh(val)}
                        className="btn"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          background: batteryAh === val ? 'var(--green)' : 'var(--bg-card)',
                          color: batteryAh === val ? '#000' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)'
                        }}
                      >
                        {val}Ah ({val * 12}Wh)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-cyan)' }}>
                <span className="label-caps" style={{ color: 'var(--cyan)' }}>POWER BUDGET ASSESSMENT</span>
                
                <div style={{ margin: '16px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AUTONOMOUS RUNTIME WITHOUT SUN</div>
                  <div style={{ fontSize: '38px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.autonomyDays} <span style={{ fontSize: '16px', fontWeight: 600 }}>DAYS</span>
                  </div>
                  <span className={`chip ${parseFloat(powerAutonomy.autonomyDays) >= 6 ? 'chip-green' : 'chip-amber'}`}>
                    {parseFloat(powerAutonomy.autonomyDays) >= 6 ? '✓ EXCEEDS 6-DAY MONSOON SPEC' : '⚠️ RECOMMEND HIGHER Ah BATTERY'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Usable Battery Energy:</span>
                    <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{powerAutonomy.batteryWhCapacity} Wh</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Daily System Consumption:</span>
                    <strong style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{powerAutonomy.totalDailyWh} Wh/day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg. Daily PV Generation:</span>
                    <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{powerAutonomy.dailySolarHarvestWh} Wh/day</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOM TABLE VIEW */}
      {activeTab === 'BOM_TABLE' && (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps">COMPREHENSIVE HARDWARE SPECIFICATION & PRICING TABLE</span>
            <button className={`btn ${editMode ? 'btn-primary' : ''}`} onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Save Custom Prices' : '✏️ Edit Unit Prices'}
            </button>
          </div>
          <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>#</th>
                  <th>Visual Photo</th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Sensor / Component</th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Category</th>
                  <th onClick={() => handleSort('model')} style={{ cursor: 'pointer' }}>Model</th>
                  <th onClick={() => handleSort('price_inr')} style={{ cursor: 'pointer' }}>Unit Price ({currency})</th>
                  <th>Quantity</th>
                  <th>Line Total</th>
                  <th>Accuracy</th>
                  <th>Interface</th>
                  <th>Ingress</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const qty = quantities[item.id] || 0;
                  const lineTotalInr = item.price_inr * qty;
                  const itemImg = SENSOR_IMAGE_MAP[item.id] || item.imageUrl;
                  return (
                    <tr key={item.id} style={{ background: qty > 0 ? 'rgba(0, 229, 255, 0.02)' : 'transparent' }}>
                      <td>{item.id}</td>
                      <td>
                        <div
                          onClick={() => setInspectModalItem(item)}
                          style={{
                            width: '54px',
                            height: '40px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-cyan)',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={itemImg} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.purpose}</div>
                      </td>
                      <td><span className="chip" style={{ fontSize: '10px' }}>{item.category}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item.model}</td>
                      <td>
                        {editMode ? (
                          <input
                            type="number"
                            value={item.price_inr}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItems(items.map(i => i.id === item.id ? { ...i, price_inr: val, price_usd: Math.round(val / 83.5) } : i));
                            }}
                            className="input-field"
                            style={{ width: '85px', padding: '3px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 'bold', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                            {formatPrice(item.price_inr)}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            style={{ padding: '2px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: '#fff', cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{qty}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            style={{ padding: '2px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: '#fff', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold', color: qty > 0 ? '#fff' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatPrice(lineTotalInr)}
                      </td>
                      <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{item.accuracy}</td>
                      <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{item.interface}</td>
                      <td><span className="chip chip-green" style={{ fontSize: '10px' }}>{item.ingress}</span></td>
                      <td>
                        <span className={`chip ${item.required ? 'chip-red' : 'chip-green'}`} style={{ fontSize: '9px' }}>
                          {item.required ? 'YES' : 'OPT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL TECHNICAL DATASHEET & 8K PHOTO INSPECTION MODAL */}
      {inspectModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-cyan)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 64px rgba(0,0,0,0.9)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 229, 255, 0.04)'
            }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  REAL FIELD SENSOR SPECIFICATION • ISO 18674 STANDARD
                </span>
                <h3 style={{ margin: '2px 0 0 0', color: '#fff' }}>{inspectModalItem.name}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Model: {inspectModalItem.model} | Category: {inspectModalItem.category}
                </div>
              </div>
              <button
                onClick={() => setInspectModalItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Dual Visual (Real Photo & Blueprint) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', height: '240px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-cyan)' }}>
                  <img
                    src={SENSOR_IMAGE_MAP[inspectModalItem.id] || inspectModalItem.imageUrl}
                    alt={inspectModalItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="sensor-scan-line" />
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.85)',
                    border: '1px solid #22c55e',
                    color: '#22c55e',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    ● 8K REAL PHOTO
                  </span>
                </div>

                <div style={{ position: 'relative', height: '240px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#090b10' }}>
                  <SensorSchematic type={inspectModalItem.schematic} />
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.85)',
                    border: '1px solid var(--cyan)',
                    color: 'var(--cyan)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    ● CAD SCHEMATIC
                  </span>
                </div>
              </div>

              {/* Physical Phenomenon & Operational Role */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: 'var(--cyan)', marginBottom: '4px', fontSize: '13px' }}>🎯 Operational Geotechnical Role:</h4>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  {inspectModalItem.why_this_sensor}
                </p>
              </div>

              {/* Field Suitability & Durability */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: 'var(--green)', marginBottom: '4px', fontSize: '13px' }}>🛡️ Field Survivability & Engineering Benefits:</h4>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  {inspectModalItem.suitability_and_benefits}
                </p>
              </div>

              {/* Borehole & Installation Guide */}
              <div style={{ background: 'rgba(255, 176, 32, 0.06)', border: '1px solid rgba(255, 176, 32, 0.2)', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <h4 style={{ color: 'var(--amber)', margin: '0 0 4px 0', fontSize: '12px' }}>🔧 Installation & Mounting Protocol:</h4>
                <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.45, margin: 0 }}>
                  {inspectModalItem.installation_guide}
                </p>
              </div>

              {/* Complete Specifications Grid */}
              <table className="data-table" style={{ fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', width: '35%' }}>Measurement Parameter</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{inspectModalItem.measured_param}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Measurement Accuracy</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{inspectModalItem.accuracy}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Electrical Interface / Protocol</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{inspectModalItem.interface}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Ingress Protection Rating</td>
                    <td><span className="chip chip-green">{inspectModalItem.ingress}</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Operating Temperature Range</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{inspectModalItem.operating_range}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Power Consumption</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{inspectModalItem.power}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Unit Estimated Cost</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--cyan)' }}>
                      {formatPrice(inspectModalItem.price_inr)} ({formatPrice(Math.round(inspectModalItem.price_inr * (quantities[inspectModalItem.id] || 1)))} for {quantities[inspectModalItem.id] || 1} units)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                NEXUS-LAND FIELD HARDWARE DATABASE • 2026 EDITION
              </div>
              <button className="btn btn-primary" onClick={() => setInspectModalItem(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

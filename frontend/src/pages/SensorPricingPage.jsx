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

// Additional field instrumentation and remote sensing assets
import terrainWidePanoramicImg from '../assets/sensors/terrain_wide_panoramic.jpg';
import terrainDroneLidarImg from '../assets/sensors/terrain_drone_lidar.jpg';
import terrainInsarImg from '../assets/sensors/terrain_insar_interferometry.jpg';
import terrainThermalSeepageImg from '../assets/sensors/terrain_thermal_seepage.jpg';
import terrainMultispectralNdviImg from '../assets/sensors/terrain_multispectral_ndvi.jpg';
import gnssRtkStationImg from '../assets/sensors/gnss_rtk_station.jpg';
import laserDistanceMeterImg from '../assets/sensors/laser_distance_meter.jpg';
import fiberOpticDasImg from '../assets/sensors/fiber_optic_das.jpg';
import ipiInclinometerStringImg from '../assets/sensors/ipi_inclinometer_string.jpg';
import tdrCoaxialProbeImg from '../assets/sensors/tdr_coaxial_probe.jpg';
import aeRockfallDetectorImg from '../assets/sensors/ae_rockfall_detector.jpg';
import debrisBarrierSensorImg from '../assets/sensors/debris_barrier_sensor.jpg';

// Comprehensive 27-Asset Image Mapping Dictionary
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
  15: slopeTerrainImg,
  16: terrainWidePanoramicImg,
  17: terrainDroneLidarImg,
  18: terrainInsarImg,
  19: terrainThermalSeepageImg,
  20: terrainMultispectralNdviImg,
  21: gnssRtkStationImg,
  22: laserDistanceMeterImg,
  23: fiberOpticDasImg,
  24: ipiInclinometerStringImg,
  25: tdrCoaxialProbeImg,
  26: aeRockfallDetectorImg,
  27: debrisBarrierSensorImg,
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
  15: { value: '8K Telephoto • Clear', status: 'OPTICAL ACTIVE', color: '#00e5ff', metric: 'SCARP SURFACE RGB' },
  16: { value: '3.4 GigaPixel • 180°', status: 'PANORAMIC STITCH', color: '#00e5ff', metric: 'TALUS SLOPE TRANSECT' },
  17: { value: '142 pts/m² • DEM', status: 'POINT CLOUD ACQUIRED', color: '#00e5ff', metric: 'AIRBORNE LIDAR ELEV' },
  18: { value: '-4.2 mm/yr Creep', status: 'INSAR PHASE DETECT', color: '#ffb020', metric: 'SAR INTERFEROGRAM' },
  19: { value: 'ΔT = -4.8°C Seep', status: 'THERMAL ANOMALY', color: '#00e5ff', metric: 'LWIR HYDRO-SEEPAGE' },
  20: { value: 'NDVI 0.38 (Drop)', status: 'CANOPY DIE-OFF', color: '#ffb020', metric: 'MULTISPECTRAL VEG' },
  21: { value: 'ΔE: +3.2mm, ΔN: -1.1mm', status: 'TECTONIC DRIFT', color: '#ff3b5c', metric: 'GNSS RTK 3D DISPL' },
  22: { value: '418.294 m (-1.8mm)', status: 'SCARP RETRACTION', color: '#ffb020', metric: 'LASER DISTOMETER' },
  23: { value: '48 nε @ 2.4kHz', status: 'MICRO-FRACTURE', color: '#ff3b5c', metric: 'DAS FIBER STRAIN' },
  24: { value: 'Profile: 8.4mm @ 9m', status: 'SHEAR BULGE', color: '#ff3b5c', metric: 'IPI INCLINOMETER' },
  25: { value: 'Ka = 34.2 (82% VWC)', status: 'SATURATION FRONT', color: '#ffb020', metric: 'TDR COAXIAL PROBE' },
  26: { value: '42 AE Hits/min', status: 'CRACK ACOUSTIC', color: '#ff3b5c', metric: 'ULTRASONIC AE RATE' },
  27: { value: '68.4 kN Retention', status: 'DEBRIS IMPACT', color: '#ffb020', metric: 'RING-NET LOAD CELL' },
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
  },
  {
    id: 15,
    name: "Ridge Gateway 8K Telephoto Optical Sentry",
    model: "NEXUS-CAM 8K Optical Telephoto PTZ",
    category: "REMOTE SENSING",
    purpose: "Automated optical head scarp telephoto surveillance and visual crack tracking",
    measured_param: "Visible RGB Surface Spectrum, Photogrammetric Deformation (mm)",
    why_this_sensor: "Provides continuous high-resolution optical ground truth of the head scarp face. Computer vision algorithms cross-validate crack opening displacements against physical crackmeter telemetry.",
    suitability_and_benefits: "Optical zoom up to 30x with heated anti-fog lens element. Solar-powered low-light CMOS sensor captures high-contrast rock joints even under dense monsoon cloud cover.",
    price_inr: 45000,
    price_usd: 540,
    accuracy: "8K Ultra-HD (0.5mm surface pixel resolution at 500m)",
    interface: "RTSP / 4G LTE-M / Ethernet",
    power: "12V DC, 4.5W active",
    ingress: "IP67 Heated Dome",
    operating_range: "-30°C to +65°C",
    required: false,
    default_qty: 0,
    installation_guide: "Mount on summit telemetry mast with uninterrupted line of sight across opposite canyon headwall.",
    schematic: "enclosure",
    imageUrl: slopeTerrainImg
  },
  {
    id: 16,
    name: "Alpine Wide Panoramic Transect Camera",
    model: "Gigapixel Talus Slopemaster G-360",
    category: "REMOTE SENSING",
    purpose: "Macro catchment-scale slope transect & debris runout corridor mapping",
    measured_param: "180° Panoramic Surface Displacement, Colluvial Talus Geometry",
    why_this_sensor: "Captures the complete geological context spanning crest tension cracks to the valley toe deposition fan, identifying incipient rockfall paths before runout occurs.",
    suitability_and_benefits: "Seamless automated multi-tile gigapixel stitching. Ruggedized marine-grade aluminum housing with internal desiccator and solar deflector shield.",
    price_inr: 52000,
    price_usd: 620,
    accuracy: "Ultra-Wide Panoramic 120 Megapixel",
    interface: "Ethernet / Fiber / 4G",
    power: "12V DC, 6.0W",
    ingress: "IP67 Stainless Mount",
    operating_range: "-35°C to +70°C",
    required: false,
    default_qty: 0,
    installation_guide: "Install across the opposing valley shoulder on concrete footing providing 180° panoramic coverage of the slope catchment.",
    schematic: "enclosure",
    imageUrl: terrainWidePanoramicImg
  },
  {
    id: 17,
    name: "Airborne Drone LiDAR 3D DEM Scanner",
    model: "DJI Zenmuse L2 / Riegl VUX-1 LiDAR Scanner",
    category: "REMOTE SENSING",
    purpose: "Penetrates dense mountain forest canopy to generate bare-earth Digital Elevation Models",
    measured_param: "3D Elevation Point Cloud, Volumetric Mass Balance (m³), Micro-Topography",
    why_this_sensor: "Traditional optical imagery cannot penetrate dense pine forest canopies. Multi-echo pulsed laser LiDAR filters foliage to reveal hidden historical slip scarps, tension benches, and graben trenches.",
    suitability_and_benefits: "Shoots 240,000 pulses/sec with up to 5 returns per pulse. Differential DEM subtraction reveals micro-subsidence before physical fissures crack the topsoil.",
    price_inr: 125000,
    price_usd: 1500,
    accuracy: "±2 cm Absolute Vertical Accuracy, 140 pts/m²",
    interface: "LAS / GeoTIFF / LASzip Cloud API",
    power: "UAV Dock 24V / Periodic Mission",
    ingress: "IP54 Rugged Pod",
    operating_range: "-20°C to +50°C",
    required: false,
    default_qty: 0,
    installation_guide: "Program autonomous flight grid 80m AGL with 70% sidelap; tie survey into RTK base station benchmarks.",
    schematic: "ultrasonic",
    imageUrl: terrainDroneLidarImg
  },
  {
    id: 18,
    name: "Sentinel-1 DInSAR Phase Map Processor",
    model: "ESA Copernicus Sentinel-1 C-Band InSAR Engine",
    category: "REMOTE SENSING",
    purpose: "Satellite radar interferometry measuring millimeter-scale slope creep across square kilometers",
    measured_param: "Line-of-Sight (LOS) Displacement Velocity (mm/yr), Interferometric Coherence",
    why_this_sensor: "Constrains regional tectonic and landslide slip kinematics over entire mountain valleys without requiring dangerous physical climbing across crumbling cliffs.",
    suitability_and_benefits: "All-weather day-and-night C-band synthetic aperture radar penetrates clouds, fog, and torrential monsoon downpours. 6-day revisit interval provides consistent temporal baselines.",
    price_inr: 32000,
    price_usd: 385,
    accuracy: "±1.5 mm/yr Line-of-Sight Velocity",
    interface: "REST Cloud API / GeoJSON",
    power: "Cloud SaaS (0W Field Load)",
    ingress: "Spaceborne C-Band SAR",
    operating_range: "Global Orbital Coverage",
    required: false,
    default_qty: 0,
    installation_guide: "Calibrate satellite ascending and descending orbital tracks against on-site corner cube radar reflectors.",
    schematic: "geophone",
    imageUrl: terrainInsarImg
  },
  {
    id: 19,
    name: "Thermal Infrared Ground Seepage Camera",
    model: "FLIR Vue Pro R 640 LWIR Radiometric Imager",
    category: "REMOTE SENSING",
    purpose: "Detects hidden groundwater seepage emergence zones and saturated slip plane outcrops",
    measured_param: "Long-Wave Infrared Surface Temperature (7.5-14 μm), Thermal Seepage Anomaly (°C)",
    why_this_sensor: "Subterranean groundwater in mountains is significantly colder or warmer than sun-baked rock. Thermal radiometric thermography reveals localized spring emergence zones where pore-water pressure is highest.",
    suitability_and_benefits: "Radiometric calibration records temperature data in every pixel with 40 mK thermal sensitivity. Uncooled VOx microbolometer requires minimal power and zero cryocooling maintenance.",
    price_inr: 68000,
    price_usd: 815,
    accuracy: "< 40 mK NETD, ±2°C Radiometric",
    interface: "RS-232 / USB / HDMI / 4-20mA",
    power: "5V DC, 2.1W",
    ingress: "IP66 Sealed Aluminum",
    operating_range: "-20°C to +50°C",
    required: false,
    default_qty: 0,
    installation_guide: "Orient sensor facing colluvial slope toe at 45° depression angle; log predawn thermal baselines before sunrise solar heating.",
    schematic: "enclosure",
    imageUrl: terrainThermalSeepageImg
  },
  {
    id: 20,
    name: "Sentinel-2 Multi-spectral NDVI Canopy Stress Analyzer",
    model: "ESA Copernicus Sentinel-2 B4/B8 Red-Edge Analytics",
    category: "REMOTE SENSING",
    purpose: "Detects pre-failure root shear stress and vegetation die-off along crown tension cracks",
    measured_param: "Normalized Difference Vegetation Index (NDVI), Canopy Chlorophyll Absorption",
    why_this_sensor: "As an incipient landslide begins shearing, root systems of trees and shrubs are severed meters below ground weeks before catastrophic detachment, causing localized NDVI drops.",
    suitability_and_benefits: "13 spectral bands including dedicated red-edge and NIR bands. Free public orbital revisit with automated cloud-masking algorithms.",
    price_inr: 24000,
    price_usd: 288,
    accuracy: "10m Spatial Resolution, 0.01 NDVI index",
    interface: "Cloud GeoTIFF / STAC API",
    power: "Cloud SaaS (0W Field Load)",
    ingress: "Spaceborne Optical",
    operating_range: "Global Orbital Revisit",
    required: false,
    default_qty: 0,
    installation_guide: "Automated ingestion pipeline processes 10m Red/NIR tiles upon satellite overpass every 5 days.",
    schematic: "weather_station",
    imageUrl: terrainMultispectralNdviImg
  },
  {
    id: 21,
    name: "Dual-Frequency GNSS RTK Rover Pillar",
    model: "Trimble NetR9 / Leica GR30 Choke-Ring Geodetic Station",
    category: "GEOTECHNICAL",
    purpose: "Continuous millimeter-precision 3D absolute surface displacement tracking",
    measured_param: "3D Displacement Vectors (ΔEast, ΔNorth, ΔUp in mm), Velocity (mm/day)",
    why_this_sensor: "Monitors absolute surface movement of the unstable rock slab anchored directly into bedrock. Provides the definitive benchmark for all relative geotechnical sensors.",
    suitability_and_benefits: "Choke-ring ground plane suppresses multipath reflections from wet rocks and snow. Dual-frequency GPS, GLONASS, Galileo, and BeiDou tracking delivers reliable centimeter positioning in seconds.",
    price_inr: 95000,
    price_usd: 1140,
    accuracy: "±1.2 mm + 0.5 ppm Horizontal, ±2.5 mm Vertical",
    interface: "NMEA-0183 / RTCM 3.2 / RS-232 / Ethernet",
    power: "9-36V DC, 3.2W average",
    ingress: "IP68 Submersible Mast Enclosure",
    operating_range: "-40°C to +65°C",
    required: false,
    default_qty: 1,
    installation_guide: "Drill 4 expansion rock anchors into competent bedrock crest; grout stainless geodetic pillar with leveling tribrach.",
    schematic: "tiltmeter",
    imageUrl: gnssRtkStationImg
  },
  {
    id: 22,
    name: "Long-Range Laser Distance Scarp Rangefinder",
    model: "Leica Disto TOF-1000 / Dimetix D-Series Industrial",
    category: "GEOTECHNICAL",
    purpose: "Non-contact continuous distance monitoring of dangerous vertical scarp walls",
    measured_param: "Line-of-Sight Distance (0.2m to 1,500m), Retraction Rate (mm/hr)",
    why_this_sensor: "Vertical scarp faces are too dangerous for technicians to bolt sensors directly onto. This long-range pulsed laser sits safely across the canyon and shoots a laser beam to track wall bulging.",
    suitability_and_benefits: "Eye-safe Class 2 laser measures natural rough rock surfaces without retro-reflective prisms up to 500m. Built-in optical heating window prevents alpine icing and condensation.",
    price_inr: 48000,
    price_usd: 575,
    accuracy: "±1.0 mm at 100m distance, 0.1 mm resolution",
    interface: "RS-422 / RS-485 / 4-20mA / Modbus",
    power: "10-30V DC, 1.8W (with heater 12W)",
    ingress: "IP67 Stainless Housing",
    operating_range: "-40°C to +60°C",
    required: false,
    default_qty: 0,
    installation_guide: "Anchor to stable bedrock opposite the scarp; align optical sighting scope to targeted shear slab face.",
    schematic: "ultrasonic",
    imageUrl: laserDistanceMeterImg
  },
  {
    id: 23,
    name: "Distributed Acoustic & Strain (DAS) Fiber Optic Cable",
    model: "Silixa iDAS / OptaSense High-Definition DAS Optical Unit",
    category: "GEOTECHNICAL",
    purpose: "Continuous optical backscatter strain & micro-crack acoustic emission along 10km route",
    measured_param: "Micro-strain (με), Acoustic Energy (0-10 kHz), Shear Location (±1m)",
    why_this_sensor: "Acts as thousands of virtual geophones and strain gauges along a single standard telecommunication fiber optic cable trenched across an entire mountain slope or railway lifeline.",
    suitability_and_benefits: "Completely immune to lightning, electromagnetic interference, and moisture corrosion. A single interrogator interrogates 10km of cable with sub-meter spatial resolution.",
    price_inr: 165000,
    price_usd: 1980,
    accuracy: "1 nε Micro-strain resolution, 1m spatial channel",
    interface: "Gigabit Ethernet / Optical SC-APC",
    power: "12-24V DC, 18W (Interrogator Node)",
    ingress: "Armored Steel Direct Burial (IP68)",
    operating_range: "-40°C to +85°C",
    required: false,
    default_qty: 0,
    installation_guide: "Trench single-mode armored fiber cable 0.5m deep across scarp strike in serpentine geometry; couple directly with sand-bentonite backfill.",
    schematic: "crackmeter",
    imageUrl: fiberOpticDasImg
  },
  {
    id: 24,
    name: "In-Place Inclinometer (IPI) Wheeled Sensor String",
    model: "Slope Indicator Digital MEMS IPI / Durham Geo Digitilt",
    category: "GEOTECHNICAL",
    purpose: "Automated continuous subsurface horizontal deflection profile inside grooved casing",
    measured_param: "Lateral Borehole Deflection Profile (mm), Slip Surface Depth (m)",
    why_this_sensor: "Traditional manual inclinometer probes require a technician to lower a probe down a borehole weekly. An IPI string stays permanently installed in the borehole, logging continuous movement every minute.",
    suitability_and_benefits: "Articulated stainless steel gauge segments with precision wheeled carriages link together on a single multi-drop digital bus. Detects shear plane location down to 0.1m depth accuracy.",
    price_inr: 58000,
    price_usd: 695,
    accuracy: "±0.05 mm/m, 0.001 mm resolution",
    interface: "RS-485 Modbus RTU / SDI-12",
    power: "12V DC, 15 mA active per segment",
    ingress: "IP68 Submersible (20 bar)",
    operating_range: "-20°C to +75°C",
    required: false,
    default_qty: 1,
    installation_guide: "Assemble wheeled sensor segments with 1m spacing rods; lower into keyway-aligned inclinometer casing across suspected shear band.",
    schematic: "tiltmeter",
    imageUrl: ipiInclinometerStringImg
  },
  {
    id: 25,
    name: "Multi-Rod TDR Soil Dielectric & Shear Waveguide",
    model: "Campbell Scientific TDR200 / coaxial shear cable",
    category: "HYDROLOGY",
    purpose: "Measures soil dielectric permittivity (Ka) and detects subsurface shear cable severance",
    measured_param: "Apparent Dielectric Permittivity, Coaxial Cable Impedance Reflection",
    why_this_sensor: "Transmits picosecond rise-time electromagnetic pulses down a subterranean waveguide. If the slip plane shears, the coaxial cable is crimped or sheared, immediately reflecting the pulse and pin-pointing the exact failure depth.",
    suitability_and_benefits: "Simultaneously tracks high-precision volumetric soil moisture and physical slip plane shear tearing. Unaffected by high electrical conductivity in salty clays.",
    price_inr: 34000,
    price_usd: 408,
    accuracy: "±1.5% VWC, 0.5 cm shear location accuracy",
    interface: "SDI-12 / RS-232 / USB",
    power: "12V DC, 85 mA active during pulse",
    ingress: "IP68 Submersible Sensor Head",
    operating_range: "-30°C to +70°C",
    required: false,
    default_qty: 1,
    installation_guide: "Grout RG-8 foam coaxial cable in 50mm borehole with brittle cement-bentonite mix; connect to surface TDR reflectometer pulse tester.",
    schematic: "soil_moisture",
    imageUrl: tdrCoaxialProbeImg
  },
  {
    id: 26,
    name: "Acoustic Emission (AE) Rockfall Micro-Cracking Detector",
    model: "Physical Acoustics PAC R15I-AST 150kHz Resonant Piezo",
    category: "GEOTECHNICAL",
    purpose: "Captures ultrasonic emissions from micro-cracking inside brittle rock joints prior to detachment",
    measured_param: "AE Ringdown Counts, Energy (MARSE), Amplitude (0-100 dBae), Frequency (150 kHz)",
    why_this_sensor: "Before a large rock slab detaches from a cliff face, microscopic crystalline bonds shear, producing ultrasonic acoustic bursts (100-300 kHz) hours or days in advance.",
    suitability_and_benefits: "Integral low-noise preamplifier drives signals over 200m coax cable without attenuation. Auto-sensor testing (AST) electronically verifies sensor bond coupling to rock face remotely.",
    price_inr: 26000,
    price_usd: 312,
    accuracy: "150 kHz Resonant Peak, > 80 dB Dynamic Range",
    interface: "Differential BNC / 24-bit DSP Core",
    power: "12-24V DC, 20 mA",
    ingress: "IP67 Weather-tight Stainless Case",
    operating_range: "-40°C to +85°C",
    required: false,
    default_qty: 0,
    installation_guide: "Bond sensor face to smooth dressed rock surface with high-acoustic-impedance epoxy; protect with silicone weather shield.",
    schematic: "geophone",
    imageUrl: aeRockfallDetectorImg
  },
  {
    id: 27,
    name: "Flexible Ring-Net Debris Barrier Instrumented Load Cell",
    model: "Geobrugg VX080 1500 kJ / Rockfall Net Retaining Sentry",
    category: "HYDROLOGY",
    purpose: "Monitors dynamic tension load on retaining ring-nets during debris flow surges and boulder impacts",
    measured_param: "Guy Wire Cable Tension (0-300 kN), Debris Flow Mass Retained (Tonnes)",
    why_this_sensor: "Heavy rainfall washes boulders and slurry into gully channels. Steel ring-net barriers catch the torrent; instrumented load cells measure impact force in real time and warn when barrier capacity is near 100% full.",
    suitability_and_benefits: "High-tensile stainless steel compression/tension load pin with redundant dual strain gauge bridges. Withstands 200% mechanical overload without permanent calibration shift.",
    price_inr: 39000,
    price_usd: 468,
    accuracy: "±0.5% Full Scale (±1.5 kN)",
    interface: "4-20mA / CANopen / RS-485",
    power: "10-30V DC, 25 mA active",
    ingress: "IP68 Submersible Galvanized Stainless",
    operating_range: "-40°C to +80°C",
    required: false,
    default_qty: 1,
    installation_guide: "Install shackle load pin directly into top support cable anchor clevis; run armored signal conduit to bank telemetry node.",
    schematic: "crackmeter",
    imageUrl: debrisBarrierSensorImg
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
    quantities: { 1: 1, 2: 1, 3: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2, 10: 1, 11: 1, 12: 2, 14: 1, 22: 1, 26: 1, 27: 1 }
  },
  FULL: {
    title: "Full Multi-Hazard Mission Critical Array",
    badge: "TIER 4 • COMPREHENSIVE 360°",
    desc: "Complete 27-asset multi-hazard instrumentation suite capturing surface meteorology, subsurface hydrodynamics, seismic acoustic emissions, GNSS RTK, and remote sensing.",
    quantities: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2, 10: 1, 11: 1, 12: 2, 13: 1, 14: 1, 21: 1, 22: 1, 24: 1, 25: 1, 26: 1, 27: 1 }
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

// 6 Selectable Terrain Imagery & Remote Sensing Scenes
const TERRAIN_SCENE_OPTIONS = [
  {
    id: 'OPTICAL_RIDGE',
    name: '01. Ridge Summit Optical Station (8K Telephoto)',
    tag: 'OPTICAL REALITY',
    image: slopeTerrainImg,
    description: 'Direct high-resolution optical telephoto of active monitoring masts, 50W solar station, and alpine terrain.',
    idealFor: 'Daylight visual verification & physical station mount inspection',
    color: 'var(--cyan)'
  },
  {
    id: 'PANORAMIC_TRANSECT',
    name: '02. Alpine Wide Transect (Panoramic Survey)',
    tag: 'WIDE TRANSECT',
    image: terrainWidePanoramicImg,
    description: 'High alpine talus cone and colluvial valley catchment transect under stormy monsoon conditions.',
    idealFor: 'Macro slope stability & whole-catchment runout trajectory analysis',
    color: 'var(--green)'
  },
  {
    id: 'LIDAR_DEM',
    name: '03. Airborne Drone LiDAR 3D DEM (Point Cloud)',
    tag: 'LiDAR POINT CLOUD',
    image: terrainDroneLidarImg,
    description: 'High-density 120 pts/m² 3D digital elevation point cloud displaying scarp morphology and shear displacements.',
    idealFor: 'Micro-topography contouring & rotational slip mass volumetric estimation',
    color: '#38bdf8'
  },
  {
    id: 'INSAR_FRINGES',
    name: '04. Sentinel-1 DInSAR Phase Deformation (Radar)',
    tag: 'RADAR InSAR',
    image: terrainInsarImg,
    description: 'Synthetic aperture radar interferometric phase fringes displaying 28.3mm displacement cycles.',
    idealFor: 'Millimeter-scale regional creep velocity & spatial strain field mapping',
    color: '#e879f9'
  },
  {
    id: 'THERMAL_SEEPAGE',
    name: '05. Thermal Infrared Groundwater Seepage (LWIR)',
    tag: 'THERMAL FLIR',
    image: terrainThermalSeepageImg,
    description: 'Long-wave infrared thermography identifying cold groundwater emergence anomalies at 11.2°C.',
    idealFor: 'Subsurface pore pressure localization & shear band hydraulic weakening',
    color: 'var(--amber)'
  },
  {
    id: 'MULTISPECTRAL_NDVI',
    name: '06. Sentinel-2 Multi-spectral Vegetation Stress (NDVI)',
    tag: 'MULTI-SPECTRAL',
    image: terrainMultispectralNdviImg,
    description: 'Near-infrared/red band ratio identifying root-shear distress and canopy die-off along crown tension cracks.',
    idealFor: 'Vegetation biomechanical degradation & root reinforcement loss tracking',
    color: '#4ade80'
  }
];

// Tactical Mountain Slope Stations with Geotechnical Instrumentation & Multi-Angle Photos
const TERRAIN_STATIONS = [
  {
    id: 'ST-01',
    name: 'Summit Ridge Telemetry Gateway',
    zone: 'SUMMIT CREST (STABLE BEDROCK)',
    altitude: '2,240m ASL',
    slopeAngle: '12° Crest Flat',
    coords: '31.1072°N, 77.1768°E',
    pinPos: { left: '82%', top: '20%' },
    svgPos: { x: 820, y: 100 },
    color: 'var(--cyan)',
    statusText: 'ONLINE • MESH ROOT',
    primarySensorId: 10, // 4G Gateway
    secondarySensorId: 12, // Solar System
    hardwarePhotos: [
      { title: '4G LTE-M & Satellite Gateway', image: gatewayImg, role: 'Primary Telemetry Uplink Root', model: 'MultiTech Conduit IP67' },
      { title: '50W Solar PV & LiFePO4 Station', image: solarPowerImg, role: '14-Day Zero-Sun Autonomy Pack', model: 'Victron MPPT 75/15 + 20Ah' },
      { title: 'Choke-Ring GNSS RTK Rover', image: gnssRtkStationImg, role: 'Millimeter Bedrock Creep Monitor', model: 'Trimble NetR9 Dual-Freq' },
      { title: 'Armored NEMA 4X Stainless Enclosure', image: enclosureImg, role: 'IP67 Environmental Housing', model: 'Fibox ARCA Stainless' }
    ],
    sensorTypes: ['4G LTE-M / Iridium Satellite Gateway', '50W Solar PV + MPPT', '12V LiFePO4 Smart Battery', 'GNSS RTK Choke-Ring Rover'],
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
    pinPos: { left: '62%', top: '36%' },
    svgPos: { x: 620, y: 180 },
    color: 'var(--amber)',
    statusText: 'WARNING • ACTIVE DILATION',
    primarySensorId: 5, // Crackmeter
    secondarySensorId: 3, // Tiltmeter
    hardwarePhotos: [
      { title: 'Quartz Vibrating Wire Crackmeter', image: crackmeterImg, role: 'Detachment Scarp Fissure Dilation', model: 'RST Model VW2100' },
      { title: 'Biaxial MEMS Inclinometer / Tiltmeter', image: tiltmeterImg, role: 'Biaxial Rotational Slope Creep', model: 'Sisgeo Digital MD900' },
      { title: 'Reflectorless Optical Scarp Laser', image: laserDistanceMeterImg, role: 'Non-Contact Scarp Rangefinding', model: 'Leica Disto Pulsed TOF' },
      { title: 'Acoustic Emission (AE) Sensor', image: aeRockfallDetectorImg, role: 'Micro-Crack Ultrasonic Acoustic', model: 'PAC R15I-AST 150kHz' }
    ],
    sensorTypes: ['Quartz Vibrating Wire Crackmeter', 'Biaxial MEMS Inclinometer', 'Reflectorless Laser Distance', 'Micro-Seismic Geophone'],
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
    pinPos: { left: '44%', top: '56%' },
    svgPos: { x: 440, y: 280 },
    color: 'var(--red)',
    statusText: 'CRITICAL • HIGH PORE PRESSURE',
    primarySensorId: 2, // Vibrating Wire Piezometer
    secondarySensorId: 4, // Soil Moisture TDR
    hardwarePhotos: [
      { title: '12m Subsurface VW Piezometer', image: piezometerImg, role: 'Subsurface Pore-Water Pressure (u)', model: 'Geokon Model 4500S' },
      { title: 'In-Place Inclinometer (IPI) String', image: ipiInclinometerStringImg, role: 'Multi-Depth Shear Plane Deflection', model: 'Slope Indicator Digital MEMS' },
      { title: 'Multi-Depth TDR Soil Probe', image: tdrCoaxialProbeImg, role: 'Volumetric Water Content Waveguide', model: 'Campbell TDR-200 Probe' },
      { title: 'Distributed Acoustic Sensing (DAS)', image: fiberOpticDasImg, role: 'Continuous Optical Strain Fiber', model: 'Silixa iDAS 10km Aperture' }
    ],
    sensorTypes: ['12m Deep Vibrating Wire Piezometer', 'In-Place Borehole Inclinometer', 'Multi-depth TDR Soil Moisture Array', 'Fiber Optic DAS'],
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
    pinPos: { left: '18%', top: '76%' },
    svgPos: { x: 180, y: 380 },
    color: 'var(--cyan)',
    statusText: 'MONITORING • MONSOON RUNOFF',
    primarySensorId: 1, // Rain Gauge
    secondarySensorId: 7, // Ultrasonic Debris Level
    hardwarePhotos: [
      { title: 'Dual-Tipping Bucket Rain Gauge', image: rainGaugeImg, role: 'Precipitation Intensity & Volume', model: 'Campbell Scientific TE525' },
      { title: 'Ultrasonic Debris Flow Radar', image: ultrasonicImg, role: 'Runout Stream Stage & Surge Head', model: 'Massa M300 High-Frequency' },
      { title: 'Flexible Ring-Net Debris Barrier', image: debrisBarrierSensorImg, role: 'Dynamic Impact Retention & Load Cell', model: 'Geobrugg VX080 1500 kJ' },
      { title: 'Hydrostatic Stage Pressure Sensor', image: hydrostaticImg, role: 'Submersible Groundwater Level', model: 'Keller 36XiW Stage Probe' }
    ],
    sensorTypes: ['Dual-Tipping Bucket Rain Gauge', 'High-Frequency Ultrasonic Debris Radar', 'Flexible Debris Barrier Load Cell', 'Hydrostatic Stage Sensor'],
    geotechnicalSignificance: 'Monitors precipitation intensity (mm/hr) and flash flood debris surge in the toe channel. Seepage breakout at the toe signals slope saturation and rapid liquefactive mudflow transformation.',
    governingPhysics: 'Caine (1980) & Guzzetti Intensity-Duration (I-D) Empirical Threshold: I = 14.82 * D^(-0.39). Exceeding this boundary initiates mass debris mobilization.',
    alertThreshold: 'Precipitation Intensity > 25 mm/hr or Channel Surge > 3.0m -> Flash Mudflow Siren'
  }
];

// Complete 27-Asset Field Instrumentation & Remote Sensing Atlas
const ALL_FIELD_ASSETS = [
  { id: 1, name: 'Tipping Bucket Rain Gauge', model: 'Campbell TE525', category: 'METEOROLOGICAL', image: rainGaugeImg, param: 'Precipitation Intensity (mm/hr)', accuracy: '±1.0%', interface: 'Pulse Switch', ingress: 'IP67', role: 'Monitors rainfall infiltration triggers against Caine empirical thresholds.' },
  { id: 2, name: 'Vibrating Wire Piezometer', model: 'Geokon 4500S', category: 'GEOTECHNICAL', image: piezometerImg, param: 'Pore-Water Pressure (kPa)', accuracy: '±0.1% FS', interface: 'Vibrating Wire', ingress: 'IP68 (50 bar)', role: 'Directly tracks effective stress reduction across the critical rotational shear band.' },
  { id: 3, name: 'Biaxial MEMS Inclinometer', model: 'Sisgeo MD900', category: 'GEOTECHNICAL', image: tiltmeterImg, param: 'Biaxial Tilt Angle (θx, θy)', accuracy: '±0.001°', interface: 'RS-485 Modbus', ingress: 'IP68', role: 'Monitors scarp angular creep acceleration according to Saito rupture law.' },
  { id: 4, name: 'TDR Soil Moisture Array', model: 'Decagon 5TE', category: 'HYDROLOGICAL', image: soilMoistureImg, param: 'Volumetric Water Content (% VWC)', accuracy: '±2.0%', interface: 'SDI-12', ingress: 'IP68', role: 'Detects infiltration wetting fronts preconditioning colluvium for liquefaction.' },
  { id: 5, name: 'Quartz Tension Crackmeter', model: 'RST VW2100', category: 'GEOTECHNICAL', image: crackmeterImg, param: 'Fracture Extension (mm)', accuracy: '±0.02 mm', interface: 'Vibrating Wire', ingress: 'IP68', role: 'Measures tensile opening rate of head scarp detachment fissures.' },
  { id: 6, name: 'Triaxial Seismic Geophone', model: 'Instantel Minimate', category: 'METEOROLOGICAL', image: geophoneImg, param: 'Peak Particle Velocity (mm/s)', accuracy: '±0.1 mm/s', interface: 'Analog / 24-bit', ingress: 'IP67', role: 'Captures micro-tremors and shear acoustic emissions prior to slope release.' },
  { id: 7, name: 'Ultrasonic Debris Flow Radar', model: 'Massa M300', category: 'HYDROLOGICAL', image: ultrasonicImg, param: 'Channel Flow Stage (m)', accuracy: '±2.5 mm', interface: '4-20 mA / SDI-12', ingress: 'IP68', role: 'Provides non-contact real-time tracking of flash floods and boulder slurry pulses.' },
  { id: 8, name: 'All-in-One Weather Station', model: 'Vaisala WXT536', category: 'METEOROLOGICAL', image: weatherStationImg, param: 'Wind, Baro, Temp, Rain, RH', accuracy: 'Class A WMO', interface: 'SDI-12 / RS-485', ingress: 'IP67', role: 'Monitors atmospheric storm fronts and cyclonic barometric pressure drops.' },
  { id: 9, name: 'Sub-GHz LoRaWAN Field Node', model: 'Dragino LSN50', category: 'TELECOM, POWER & AI', image: loraNodeImg, param: 'RF Telemetry (868/915 MHz)', accuracy: '-148 dBm Sens.', interface: 'LoRaWAN Class A', ingress: 'IP67', role: 'Transmits encrypted sensor packets over 15km line-of-sight mountain terrain.' },
  { id: 10, name: '4G LTE-M / Satellite Gateway', model: 'MultiTech IP67', category: 'TELECOM, POWER & AI', image: gatewayImg, param: 'Cellular & Iridium Uplink', accuracy: '99.99% Uptime', interface: 'Ethernet / LTE-M', ingress: 'IP67', role: 'Master slope telemetry aggregator relaying early warning alarms to civil defense.' },
  { id: 11, name: 'ESP32-S3 Edge AI Core', model: 'Espressif Dual 240MHz', category: 'TELECOM, POWER & AI', image: edgeComputeImg, param: 'Real-Time TinyML Inference', accuracy: '32-bit FPU', interface: 'CAN / SPI / I2C', ingress: 'Conformal IP65', role: 'Runs on-device geotechnical anomaly models with sub-second alert triggers.' },
  { id: 12, name: 'LiFePO4 Solar Power System', model: 'Victron MPPT + 20Ah', category: 'TELECOM, POWER & AI', image: solarPowerImg, param: 'Autonomous Battery Storage', accuracy: '99% MPPT Eff.', interface: 'VE.Direct / CAN', ingress: 'IP65', role: 'Provides 14-day zero-sun continuous power during prolonged monsoon cloud cover.' },
  { id: 13, name: 'Hydrostatic Stage Transmitter', model: 'Keller 36XiW', category: 'HYDROLOGICAL', image: hydrostaticImg, param: 'Subsurface Water Table (m)', accuracy: '±0.05% FS', interface: 'RS-485 Modbus', ingress: 'IP68 (30 bar)', role: 'Monitors phreatic surface water table rise behind retaining barriers.' },
  { id: 14, name: 'Armored NEMA 4X Cabinet', model: 'Fibox ARCA Stainless', category: 'TELECOM, POWER & AI', image: enclosureImg, param: 'Mechanical Equipment Housing', accuracy: 'IK10 Impact', interface: 'Gland Plate', ingress: 'IP67 / NEMA 4X', role: 'Protects sensitive instrumentation from alpine snow, rock impact, and rodents.' },
  { id: 15, name: 'Ridge Gateway 8K Telephoto View', model: 'Terrain Optical Scene 01', category: 'REMOTE SENSING & LiDAR', image: slopeTerrainImg, param: 'Optical Telephoto Panorama', accuracy: '8K Optical', interface: 'Visible RGB', ingress: 'Alpine Field', role: 'High-resolution field view of summit telemetry station and scarp.' },
  { id: 16, name: 'Alpine Wide Panoramic Transect', model: 'Terrain Optical Scene 02', category: 'REMOTE SENSING & LiDAR', image: terrainWidePanoramicImg, param: 'Panoramic Talus Catchment', accuracy: 'Ultra-Wide', interface: 'Visible RGB', ingress: 'Alpine Field', role: 'Macro slope stability & whole-catchment debris runout trajectory analysis.' },
  { id: 17, name: 'Airborne Drone LiDAR 3D DEM', model: 'Terrain LiDAR Scene 03', category: 'REMOTE SENSING & LiDAR', image: terrainDroneLidarImg, param: '3D Elevation Point Cloud', accuracy: '120 pts/m²', interface: 'LiDAR Laser Scan', ingress: 'Aerial Sensor', role: 'Micro-topography contouring and rotational slip mass volumetric estimation.' },
  { id: 18, name: 'Sentinel-1 DInSAR Phase Map', model: 'Terrain Radar Scene 04', category: 'REMOTE SENSING & LiDAR', image: terrainInsarImg, param: 'Interferometric Phase Fringe', accuracy: '1.5 mm/yr Creep', interface: 'C-Band Radar', ingress: 'Satellite SAR', role: 'Millimeter-scale regional creep velocity and spatial strain field mapping.' },
  { id: 19, name: 'Thermal Infrared Seepage Survey', model: 'Terrain Thermal Scene 05', category: 'REMOTE SENSING & LiDAR', image: terrainThermalSeepageImg, param: 'LWIR Radiometric Thermogram', accuracy: '< 30 mK NETD', interface: 'FLIR 7.5-14 µm', ingress: 'Thermography', role: 'Identifies cold groundwater emergence points weakening shear band strength.' },
  { id: 20, name: 'Sentinel-2 Multi-spectral NDVI', model: 'Terrain NDVI Scene 06', category: 'REMOTE SENSING & LiDAR', image: terrainMultispectralNdviImg, param: 'Normalized Veg. Index (NDVI)', accuracy: '10m Spatial Res.', interface: 'B8/B4 Multi-spec', ingress: 'Satellite Optical', role: 'Detects root-shear distress and canopy die-off along crown tension cracks.' },
  { id: 21, name: 'GNSS RTK Choke-Ring Rover', model: 'Trimble NetR9 Geodetic', category: 'GEOTECHNICAL', image: gnssRtkStationImg, param: '3D Crustal Displacement', accuracy: '±1.2 mm Horiz.', interface: 'NMEA / RTCM3', ingress: 'IP68 Bedrock', role: 'Continuously monitors absolute 3D millimeter-scale tectonic and scarp drift.' },
  { id: 22, name: 'Laser Distance Scarp Rangefinder', model: 'Leica Disto Pulsed TOF', category: 'GEOTECHNICAL', image: laserDistanceMeterImg, param: 'Reflectorless Scarp Distance', accuracy: '±1.0 mm up to 1.5km', interface: 'RS-485 / 4-20mA', ingress: 'IP67 Armored', role: 'Non-contact optical laser monitoring of inaccessible vertical head scarp walls.' },
  { id: 23, name: 'Fiber Optic DAS Acoustic Cable', model: 'Silixa iDAS Optical Fiber', category: 'GEOTECHNICAL', image: fiberOpticDasImg, param: 'Distributed Acoustic Strain', accuracy: '1 nε Micro-strain', interface: 'Single-Mode Fiber', ingress: 'Direct Burial', role: 'Continuous 10km spatial strain sensing detecting crack propagation acoustics.' },
  { id: 24, name: 'In-Place Inclinometer (IPI) String', model: 'Slope Indicator Digital MEMS', category: 'GEOTECHNICAL', image: ipiInclinometerStringImg, param: 'Borehole Shear Deflection', accuracy: '±0.05 mm/m', interface: 'RS-485 Addressable', ingress: 'Submersible 200m', role: 'Chain of wheeled torpedoes inside grooved casing profiling active shear planes.' },
  { id: 25, name: 'Multi-Rod TDR Soil Waveguide', model: 'Campbell TDR-200 Probe', category: 'HYDROLOGICAL', image: tdrCoaxialProbeImg, param: 'Dielectric Permittivity Ka', accuracy: '±1.0% VWC', interface: 'High-Freq Pulse', ingress: 'Hermetic IP68', role: 'High-frequency pulse reflectometer detecting soil moisture saturation boundaries.' },
  { id: 26, name: 'Acoustic Emission (AE) Sensor', model: 'PAC R15I-AST Piezo', category: 'GEOTECHNICAL', image: aeRockfallDetectorImg, param: 'High-Frequency AE Hits (kHz)', accuracy: '20 kHz - 1 MHz', interface: 'Piezo Preamplifier', ingress: 'Weather-tight', role: 'Detects ultrasonic micro-cracking inside rock joints hours before rock mass detachment.' },
  { id: 27, name: 'Flexible Ring-Net Debris Barrier', model: 'Geobrugg VX080 1500 kJ', category: 'HYDROLOGICAL', image: debrisBarrierSensorImg, param: 'Impact Dynamic Retention Load', accuracy: '1,500 kJ Capacity', interface: 'Load Cell Switch', ingress: 'High-Tensile Steel', role: 'Intercepts channelized debris flows and triggers automated highway closure sirens.' },
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

  // Real-World Power & Environmental Adaptation States
  const [powerScenario, setPowerScenario] = useState('MONSOON'); // 'MONSOON' | 'CLEARSKY' | 'SUBZERO' | 'CYCLONE' | 'CUSTOM'
  const [cloudCoverPct, setCloudCoverPct] = useState(90);
  const [ambientTempC, setAmbientTempC] = useState(18);
  const [snowDustLossPct, setSnowDustLossPct] = useState(5);
  const [panelTiltDeg, setPanelTiltDeg] = useState(35);
  const [aiAdaptivePowerShedding, setAiAdaptivePowerShedding] = useState(true);
  const [simHour, setSimHour] = useState(12.0); // 12:00 PM Solar Noon Peak
  const [simSpeed, setSimSpeed] = useState(1); // 0 = pause, 1 = 1x, 10 = 10x, 60 = 60x
  const [liveBatterySoc, setLiveBatterySoc] = useState(88.4);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(true);
  const [zeroCalibrated, setZeroCalibrated] = useState(false);
  const [diagnosticScanActive, setDiagnosticScanActive] = useState(false);
  const [scanStage, setScanStage] = useState(0); // 0=idle, 1=excitation, 2=sweep, 3=fft, 4=wavelet, 5=poly, 6=certified
  const [scanProgress, setScanProgress] = useState(100);
  const [diagViewMode, setDiagViewMode] = useState('OSCILLOSCOPE'); // 'OSCILLOSCOPE' | 'FFT_SPECTRUM' | 'PHASE_SPACE' | 'CALIBRATION'
  const [selectedDiagAlgorithm, setSelectedDiagAlgorithm] = useState('FFT'); // 'FFT' | 'WAVELET' | 'POLYNOMIAL' | 'KALMAN'
  const [injectedNoise, setInjectedNoise] = useState(false);
  const [diagOscTick, setDiagOscTick] = useState(0);
  const [spotlightThumbCategory, setSpotlightThumbCategory] = useState('ALL');
  const [spotlightVisualMode, setSpotlightVisualMode] = useState('OPTICAL'); // 'OPTICAL' | 'THERMAL' | 'LIDAR'
  const [graphTimeWindow, setGraphTimeWindow] = useState('LIVE');
  const [graphStreamingActive, setGraphStreamingActive] = useState(true);
  const [graphCriticalPulse, setGraphCriticalPulse] = useState(false);

  // Progressive real-time multi-channel geotechnical stream buffer with authentic physics
  const [progressiveTelemetryData, setProgressiveTelemetryData] = useState(() => {
    const pts = [];
    for (let i = 24; i >= 0; i--) {
      const t = Date.now() - i * 1500;
      const progress = (24 - i) / 24; // 0.0 to 1.0

      // Hydrological infiltration wave: rises dynamically from 122 kPa, crosses 135 kPa, crests at 148.4 kPa
      const hydroWave = Math.sin(progress * Math.PI * 2.2) * 5.2 + Math.cos(progress * 6.5) * 1.8;
      const pore = +(122.0 + progress * 24.5 + hydroWave).toFixed(1);
      const stress = +(210.0 - pore).toFixed(1);

      // Tertiary creep displacement (mm): non-linear acceleration from 11.2 mm to 17.8 mm
      const disp = +(11.2 + 6.2 * Math.pow(progress, 1.85) + Math.sin(i * 0.8) * 0.06).toFixed(2);
      
      // Creep velocity (mm/hr): accelerates from 0.16 to 2.8 mm/hr
      const velocityMmHr = Math.max(0.12, +(0.16 + 2.6 * Math.pow(progress, 2.2)).toFixed(2));
      // Saito Inverse Velocity (hr/mm): plunges from 6.25 hr/mm down to 0.38 hr/mm heading toward 0
      const invVel = +(1.0 / velocityMmHr).toFixed(2);

      // Convective storm hyetograph: distinct rain squalls from 8 to 56 mm/hr
      const stormCells = Math.sin(progress * Math.PI * 3.2) * 20.0 + Math.cos(progress * 7.0) * 10.0;
      const rainRate = Math.max(6.0, +(28.0 + stormCells + (i % 4 === 0 ? 14 : -6)).toFixed(1));
      const cumRain = +(192.0 + progress * 26.0 + Math.sin(progress * 4.0) * 1.5).toFixed(1);

      // Acoustic emissions (hits/min): episodic shear micro-fracturing bursts
      const isBurst = (i === 19 || i === 12 || i === 5 || i === 0);
      const ae = Math.round(20 + Math.sin(progress * 5.5) * 12 + (isBurst ? 68 + Math.random() * 32 : Math.random() * 8));
      const ppv = +(5.8 + Math.sin(progress * 14.0) * 4.8 + (isBurst ? 9.2 : 0)).toFixed(1);

      // Multi-depth soil VWC (%): downward vertical infiltration gradient
      const vwc10 = +(85.5 + progress * 8.5 + Math.sin(progress * 4.5) * 1.4).toFixed(1);
      const vwc30 = +(79.5 + progress * 8.0 + Math.sin(progress * 3.8) * 1.1).toFixed(1);
      const vwc60 = +(74.8 + progress * 6.5 + Math.sin(progress * 3.2) * 0.8).toFixed(1);
      const vwc100 = +(68.2 + progress * 5.4 + Math.sin(progress * 2.2) * 0.6).toFixed(1);

      pts.push({
        time: new Date(t).toLocaleTimeString('en-US', { hour12: false }),
        porePressure: pore,
        effectiveStress: stress,
        displacementMm: disp,
        velocityMmHr: velocityMmHr,
        inverseVelocity: invVel,
        rainfallRate: rainRate,
        cumulativeRain: cumRain,
        aeHits: ae,
        ppvVelocity: ppv,
        vwc10cm: vwc10,
        vwc30cm: vwc30,
        vwc60cm: vwc60,
        vwc100cm: vwc100
      });
    }
    return pts;
  });

  // Live Streaming Progressive Telemetry Updater with Realistic Physical Wave Dynamics
  useEffect(() => {
    if (!graphStreamingActive) return;
    const timer = setInterval(() => {
      setProgressiveTelemetryData(prev => {
        const last = prev[prev.length - 1];
        const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        const pulse = graphCriticalPulse ? 2.4 : 1.0;

        // Dynamic pore pressure: hydraulic wave around failure boundary
        const hydroOsc = Math.sin(Date.now() / 2500) * 0.85 + (Math.random() - 0.48) * 0.5;
        const poreDelta = (graphCriticalPulse ? 2.2 : 0.14) + hydroOsc;
        const nextPore = Math.min(168, Math.max(120, +(last.porePressure + poreDelta).toFixed(1)));
        const nextStress = +(210.0 - nextPore).toFixed(1);

        // Tertiary accelerating creep: displacement step
        const creepRate = (0.045 + (nextPore > 135 ? (nextPore - 135) * 0.009 : 0)) * pulse;
        const nextDisp = +(last.displacementMm + creepRate + (Math.random() - 0.5) * 0.01).toFixed(2);
        
        // Creep velocity in mm/hr & Saito Inverse Velocity
        const instantaneousVel = Math.max(0.12, +(creepRate * 220).toFixed(2));
        const nextInvVel = +(Math.min(6.5, 1.0 / instantaneousVel)).toFixed(2);

        // Convective storm hyetograph wave
        const stormWave = Math.sin(Date.now() / 4000) * 18;
        const nextRain = +(Math.max(6.0, 32.0 + stormWave + (Math.random() - 0.5) * 6.0)).toFixed(1);
        const nextCumRain = +(last.cumulativeRain + nextRain / 2400).toFixed(1);

        // Episodic acoustic micro-fracturing bursts
        const burstChance = Math.random() < (graphCriticalPulse ? 0.65 : 0.22);
        const nextAe = Math.round(Math.max(16, burstChance ? 78 + Math.random() * 48 : 26 + Math.sin(Date.now() / 3000) * 12));
        const nextPpv = +(6.0 + (burstChance ? 10.5 : 0) + Math.sin(Date.now() / 1600) * 3.5).toFixed(1);

        // Multi-depth soil moisture downward infiltration
        const nextVwc10 = Math.min(98.5, +(last.vwc10cm + (nextRain > 30 ? 0.16 : -0.04) + (Math.random() - 0.5) * 0.2).toFixed(1));
        const nextVwc30 = Math.min(95.0, +(last.vwc30cm + (nextVwc10 > 90 ? 0.11 : -0.02) + (Math.random() - 0.5) * 0.15).toFixed(1));
        const nextVwc60 = Math.min(90.0, +(last.vwc60cm + 0.05 + (Math.random() - 0.5) * 0.1).toFixed(1));
        const nextVwc100 = Math.min(84.0, +(last.vwc100cm + 0.03 + (Math.random() - 0.5) * 0.08).toFixed(1));

        const newPoint = {
          time: nowStr,
          porePressure: nextPore,
          effectiveStress: nextStress,
          displacementMm: nextDisp,
          velocityMmHr: instantaneousVel,
          inverseVelocity: nextInvVel,
          rainfallRate: nextRain,
          cumulativeRain: nextCumRain,
          aeHits: nextAe,
          ppvVelocity: nextPpv,
          vwc10cm: nextVwc10,
          vwc30cm: nextVwc30,
          vwc60cm: nextVwc60,
          vwc100cm: nextVwc100
        };

        return [...prev.slice(1), newPoint];
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [graphStreamingActive, graphCriticalPulse]);

  const [activeGraphStation, setActiveGraphStation] = useState('STATION_A');
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState(null); // { graphId, index, x, y, data }
  const [inclinometerMode, setInclinometerMode] = useState('CUMULATIVE'); // 'CUMULATIVE' | 'STRAIN_RATE'
  const [saitoScaleMode, setSaitoScaleMode] = useState('INVERSE'); // 'INVERSE' | 'VELOCITY'
  const [rainfallGraphMode, setRainfallGraphMode] = useState('BOTH'); // 'BOTH' | 'RATE_ONLY' | 'CUMULATIVE_ONLY'
  const [visibleGraphChannels, setVisibleGraphChannels] = useState({
    pore: true,
    stress: true,
    disp: true,
    saito: true,
    rainBars: true,
    rainCum: true,
    aeHits: true,
    ppv: true,
    vwc10: true,
    vwc30: true,
    vwc60: true,
    vwc100: true
  });

  const handleDownloadTelemetryCsv = () => {
    playTacticalAudio('click');
    const headers = [
      'Timestamp',
      'PorePressure_kPa',
      'EffectiveStress_kPa',
      'Displacement_mm',
      'Saito_InverseVelocity_d_mm',
      'RainfallRate_mm_h',
      'CumulativeRain_mm',
      'AE_Hits_min',
      'PPV_Velocity_mm_s',
      'VWC_10cm_pct',
      'VWC_30cm_pct',
      'VWC_60cm_pct',
      'VWC_100cm_pct'
    ];
    const rows = progressiveTelemetryData.map(pt => [
      pt.time,
      pt.porePressure,
      pt.effectiveStress,
      pt.displacementMm,
      pt.inverseVelocity,
      pt.rainfallRate,
      pt.cumulativeRain,
      pt.aeHits,
      pt.ppvVelocity,
      pt.vwc10cm,
      pt.vwc30cm,
      pt.vwc60cm,
      pt.vwc100cm
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEXUS_GEOTECHNICAL_TELEMETRY_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Oscilloscope live sweep animation tick
  useEffect(() => {
    if (!showDiagnosticsPanel) return;
    const timer = setInterval(() => {
      setDiagOscTick(prev => (prev + 1) % 200);
    }, 60);
    return () => clearInterval(timer);
  }, [showDiagnosticsPanel]);

  // Automated Multi-Stage Diagnostic Scan Sequencer
  const handleRunDiagnosticScan = () => {
    if (diagnosticScanActive) return;
    playTacticalAudio('alert');
    setDiagnosticScanActive(true);
    setScanStage(1);
    setScanProgress(18);

    setTimeout(() => {
      setScanStage(2);
      setScanProgress(38);
    }, 700);

    setTimeout(() => {
      setScanStage(3);
      setScanProgress(62);
    }, 1400);

    setTimeout(() => {
      setScanStage(4);
      setScanProgress(82);
    }, 2100);

    setTimeout(() => {
      setScanStage(5);
      setScanProgress(96);
    }, 2800);

    setTimeout(() => {
      playTacticalAudio('click');
      setScanStage(6);
      setScanProgress(100);
      setDiagnosticScanActive(false);
    }, 3600);
  };

  // Export ISO 18674 Laboratory Calibration Certificate
  const handleDownloadCalibrationCert = () => {
    playTacticalAudio('click');
    const certData = {
      certificate_id: `ISO18674-CERT-GEO-${spotlightItem.id}-2026`,
      standard: "ISO 18674-4: Geotechnical Investigation & Field Monitoring - Vibrating Wire & Piezometer Systems",
      issued_date: new Date().toISOString(),
      instrument_details: {
        id: spotlightItem.id,
        name: spotlightItem.name,
        model: spotlightItem.model,
        serial_number: `SN-GEO-${(spotlightItem.id * 9187).toString(16).toUpperCase()}`,
        category: spotlightItem.category,
        interface: spotlightItem.interface,
        rated_accuracy: spotlightItem.accuracy,
        ingress_protection: spotlightItem.ingress
      },
      automated_scan_results: {
        resonant_frequency_f0_hz: 2418.62,
        quality_factor_q: 142.8,
        damping_ratio_zeta: 0.0182,
        signal_to_noise_ratio_db: injectedNoise ? 34.2 : 51.4,
        coil_resistance_ohms: 182.4,
        insulation_resistance_megohms: 540.0,
        thermistor_temperature_c: 18.4,
        zero_drift_tare_offset: zeroCalibrated ? 0.000 : 0.012
      },
      calibration_polynomial: {
        equation: "P = A*f^2 + B*f + C + D*(T - T0)",
        A: -0.000342,
        B: 1.2842,
        C: -14.21,
        D: 0.0384,
        non_linearity_corridor_pct_fs: 0.038
      },
      validation_status: "PASSED • CERTIFIED ACCURATE WITHIN ±0.05% FULL SCALE",
      lead_geotechnical_engineer: "Dr. Sarah Chen, Ph.D., P.E. (Chief Instrumentation Scientist)"
    };

    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISO18674_CALIBRATION_CERT_${spotlightItem.model.replace(/[\/\s]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


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

  // Terrain Scene & 27-Asset Gallery States
  const [selectedTerrainSceneId, setSelectedTerrainSceneId] = useState('OPTICAL_RIDGE');
  const [stationPhotoIndex, setStationPhotoIndex] = useState(0);
  const [showAtlasModal, setShowAtlasModal] = useState(false);
  const [atlasCategory, setAtlasCategory] = useState('ALL');
  const [atlasSearch, setAtlasSearch] = useState('');
  const [atlasLightboxAsset, setAtlasLightboxAsset] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [packetNodeFilter, setPacketNodeFilter] = useState('ALL');
  const [waveformHistory, setWaveformHistory] = useState([42, 48, 55, 62, 70, 78, 86, 95, 108, 118, 126, 134, 138, 140, 142.8]);

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

  // Synthesized Web Audio API Tactical Sound Effects
  const playTacticalAudio = (type) => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'packet') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.03);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(980, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio autoplay policy handled silently
    }
  };

  // Reset station photo index when switching stations
  useEffect(() => {
    setStationPhotoIndex(0);
  }, [selectedTerrainStationId]);

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

  const activeTerrainScene = useMemo(() => {
    return TERRAIN_SCENE_OPTIONS.find(s => s.id === selectedTerrainSceneId) || TERRAIN_SCENE_OPTIONS[0];
  }, [selectedTerrainSceneId]);

  const filteredAtlasAssets = useMemo(() => {
    return ALL_FIELD_ASSETS.filter(item => {
      const matchCat = atlasCategory === 'ALL' || item.category === atlasCategory;
      const matchSearch = atlasSearch === '' ||
        item.name.toLowerCase().includes(atlasSearch.toLowerCase()) ||
        item.model.toLowerCase().includes(atlasSearch.toLowerCase()) ||
        item.param.toLowerCase().includes(atlasSearch.toLowerCase()) ||
        item.role.toLowerCase().includes(atlasSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [atlasCategory, atlasSearch]);

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

  // Comprehensive Real-World Power Simulation & Autonomy Model
  const powerAutonomy = useMemo(() => {
    // Temperature Derating Factor on LiFePO4 Battery Capacity
    let tempDerateFactor = 1.0;
    if (ambientTempC < 0) {
      tempDerateFactor = Math.max(0.55, 0.90 - Math.abs(ambientTempC) * 0.025);
    } else if (ambientTempC < 20) {
      tempDerateFactor = 0.90 + (ambientTempC / 20) * 0.10;
    } else if (ambientTempC > 45) {
      tempDerateFactor = Math.max(0.85, 1.0 - (ambientTempC - 45) * 0.015);
    }

    // Nominal and Usable Battery Energy (12.8V LiFePO4 nominal)
    const nominalBatteryWh = batteryAh * 12.8;
    const usableBatteryWh = nominalBatteryWh * 0.90 * tempDerateFactor; // 90% Depth of Discharge

    // Standard Polling Consumption without AI Shedding
    const standardPollsPerDay = (24 * 60) / Math.max(1, samplingRateMin);
    let standardSensorWh = 0;
    items.forEach(item => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        const drawPerPollWh = item.category === 'REMOTE SENSING' ? 0.0012 : 0.00035;
        standardSensorWh += qty * standardPollsPerDay * drawPerPollWh;
      }
    });

    // Base Station Quiescent Draw (ESP32-S3 + LoRaWAN receiver + 4G Cat-M standby)
    const standardBaseWhPerDay = 32.0; 
    const standardTotalDailyWh = standardBaseWhPerDay + standardSensorWh;
    const autonomyDaysStandard = (usableBatteryWh / standardTotalDailyWh).toFixed(1);

    // AI Adaptive Power-Shedding Mode:
    const adaptivePollsPerDay = (24 * 60) / 15; // 15 min interval
    const adaptiveSensorWh = standardSensorWh * (adaptivePollsPerDay / standardPollsPerDay) * 0.45;
    const adaptiveBaseWhPerDay = 11.5; // Ultra-low-power LoRaWAN Class A only
    const adaptiveTotalDailyWh = adaptiveBaseWhPerDay + adaptiveSensorWh;
    const autonomyDaysAdaptive = (usableBatteryWh / adaptiveTotalDailyWh).toFixed(1);

    // Solar Generation Model based on Cloud Cover, Snow/Dust Soiling, and Tilt
    const cloudTransmission = Math.max(0.08, 1 - (cloudCoverPct / 100) * 0.88);
    const soilingTransmission = Math.max(0.40, 1 - (snowDustLossPct / 100));
    const effectivePeakSunHours = 5.2 * cloudTransmission * soilingTransmission;
    const mpptEfficiency = 0.986; // Victron BlueSolar / SmartSolar MPPT efficiency
    const dailySolarHarvestWh = pvWatts * effectivePeakSunHours * mpptEfficiency;

    // Instantaneous values at current simHour
    const isDaylight = simHour >= 6.0 && simHour <= 18.0;
    const sunAngleFactor = isDaylight ? Math.sin((Math.PI * (simHour - 6.0)) / 12.0) : 0;
    const instantIrradianceWm2 = Math.max(0, Math.round(1000 * Math.pow(sunAngleFactor, 1.1) * cloudTransmission * soilingTransmission));
    
    // Instantaneous PV Watts
    const cellTempC = ambientTempC + (instantIrradianceWm2 * 0.025);
    const tempLoss = 1 - 0.0038 * Math.max(0, cellTempC - 25);
    const instantPvWatts = Math.max(0, (pvWatts * (instantIrradianceWm2 / 1000) * tempLoss * mpptEfficiency)).toFixed(1);

    // Instantaneous Load Watts
    const isSheddingActive = aiAdaptivePowerShedding && liveBatterySoc < 35;
    const instantLoadWatts = isSheddingActive ? (0.75).toFixed(1) : (1.45 + (60 / samplingRateMin) * 0.03).toFixed(1);

    // Net Power Balance & Battery Current
    const netPowerWatts = (parseFloat(instantPvWatts) - parseFloat(instantLoadWatts)).toFixed(1);
    
    // Battery Operating Voltage along LiFePO4 curve
    const socRatio = Math.max(0.01, Math.min(1.0, liveBatterySoc / 100));
    const battV = (10.2 + 2.6 * Math.pow(socRatio, 0.22) + 0.8 * Math.pow(socRatio, 4)).toFixed(2);
    const battCurrentAmps = (parseFloat(netPowerWatts) / parseFloat(battV)).toFixed(2);

    // MPPT Tracking Mode
    let mpptMode = 'NIGHT_STANDBY';
    if (parseFloat(instantPvWatts) > 0.8) {
      if (liveBatterySoc < 85) mpptMode = 'BULK_MPPT';
      else if (liveBatterySoc < 98) mpptMode = 'ABSORPTION_CV';
      else mpptMode = 'FLOAT_TRICKLE';
    }

    // 24-Hour Profile for Area Chart
    const profile24h = [];
    for (let h = 0; h < 24; h += 1) {
      const inDay = h >= 6 && h <= 18;
      const angle = inDay ? Math.sin((Math.PI * (h - 6)) / 12) : 0;
      const irr = Math.max(0, 1000 * Math.pow(angle, 1.1) * cloudTransmission * soilingTransmission);
      const pvGen = Math.max(0, pvWatts * (irr / 1000) * 0.98);
      const load = isSheddingActive ? 0.75 : (1.45 + (60 / samplingRateMin) * 0.03);
      profile24h.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        hNum: h,
        solarGen: parseFloat(pvGen.toFixed(1)),
        loadDraw: parseFloat(load.toFixed(1)),
        net: parseFloat((pvGen - load).toFixed(1))
      });
    }

    const currentAutonomyDays = aiAdaptivePowerShedding ? autonomyDaysAdaptive : autonomyDaysStandard;

    return {
      nominalBatteryWh: nominalBatteryWh.toFixed(0),
      usableBatteryWh: usableBatteryWh.toFixed(0),
      tempDerateFactor: tempDerateFactor.toFixed(2),
      standardTotalDailyWh: standardTotalDailyWh.toFixed(1),
      adaptiveTotalDailyWh: adaptiveTotalDailyWh.toFixed(1),
      totalDailyWh: (aiAdaptivePowerShedding ? adaptiveTotalDailyWh : standardTotalDailyWh).toFixed(1),
      autonomyDaysStandard,
      autonomyDaysAdaptive,
      autonomyDays: currentAutonomyDays,
      dailySolarHarvestWh: dailySolarHarvestWh.toFixed(0),
      effectivePeakSunHours: effectivePeakSunHours.toFixed(1),
      instantIrradianceWm2,
      instantPvWatts,
      instantLoadWatts,
      netPowerWatts,
      battV,
      battCurrentAmps,
      mpptMode,
      profile24h,
      isAdequate: parseFloat(dailySolarHarvestWh) >= parseFloat(standardTotalDailyWh) * 1.3
    };
  }, [items, quantities, samplingRateMin, pvWatts, batteryAh, ambientTempC, cloudCoverPct, snowDustLossPct, simHour, aiAdaptivePowerShedding, liveBatterySoc]);

  // Diurnal Simulation Clock & Battery Dynamics Engine
  useEffect(() => {
    if (activeTab !== 'AUTONOMY' || simSpeed === 0) return;
    const timer = setInterval(() => {
      setSimHour(prev => {
        const next = (prev + (simSpeed * 0.04)) % 24;
        return parseFloat(next.toFixed(2));
      });
      setLiveBatterySoc(prev => {
        const isCharging = parseFloat(powerAutonomy.netPowerWatts) > 0;
        const delta = isCharging ? 0.08 : -0.04;
        const nextSoc = Math.max(12, Math.min(100, prev + delta));
        return parseFloat(nextSoc.toFixed(1));
      });
    }, 400);
    return () => clearInterval(timer);
  }, [activeTab, simSpeed, powerAutonomy.netPowerWatts]);

  const applyPowerScenario = (scenario) => {
    setPowerScenario(scenario);
    playTacticalAudio('click');
    if (scenario === 'MONSOON') {
      setCloudCoverPct(92);
      setAmbientTempC(18);
      setSnowDustLossPct(5);
      setSamplingRateMin(1);
    } else if (scenario === 'CLEARSKY') {
      setCloudCoverPct(10);
      setAmbientTempC(34);
      setSnowDustLossPct(2);
      setSamplingRateMin(5);
    } else if (scenario === 'SUBZERO') {
      setCloudCoverPct(75);
      setAmbientTempC(-14);
      setSnowDustLossPct(55);
      setSamplingRateMin(15);
    } else if (scenario === 'CYCLONE') {
      setCloudCoverPct(100);
      setAmbientTempC(22);
      setSnowDustLossPct(15);
      setSamplingRateMin(1);
    }
  };


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
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />
            <span className="label-caps" style={{ color: 'var(--cyan)' }}>FEATURED FIELD INSTRUMENT SPOTLIGHT • MULTI-SPECTRAL FIELD SCAN</span>
          </div>
          {/* Real-time Optical Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '2px' }}>MODE:</span>
            <button
              onClick={() => { playTacticalAudio('click'); setSpotlightVisualMode('OPTICAL'); }}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                border: spotlightVisualMode === 'OPTICAL' ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                background: spotlightVisualMode === 'OPTICAL' ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0,0,0,0.4)',
                color: spotlightVisualMode === 'OPTICAL' ? 'var(--cyan)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              📷 OPTICAL RGB
            </button>
            <button
              onClick={() => { playTacticalAudio('click'); setSpotlightVisualMode('THERMAL'); }}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                border: spotlightVisualMode === 'THERMAL' ? '1px solid #ff7b00' : '1px solid var(--border-subtle)',
                background: spotlightVisualMode === 'THERMAL' ? 'rgba(255, 123, 0, 0.22)' : 'rgba(0,0,0,0.4)',
                color: spotlightVisualMode === 'THERMAL' ? '#ff9e3b' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              🌡️ THERMAL LWIR
            </button>
            <button
              onClick={() => { playTacticalAudio('click'); setSpotlightVisualMode('LIDAR'); }}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                border: spotlightVisualMode === 'LIDAR' ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
                background: spotlightVisualMode === 'LIDAR' ? 'rgba(34, 197, 94, 0.22)' : 'rgba(0,0,0,0.4)',
                color: spotlightVisualMode === 'LIDAR' ? '#4ade80' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              📡 LIDAR 3D
            </button>
          </div>
        </div>
        <div className="panel-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 440px) 1fr', gap: '24px', alignItems: 'center' }}>
            {/* Left: Big Hero Image with Scanner Frame */}
            <div style={{
              position: 'relative',
              height: '270px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: spotlightVisualMode === 'THERMAL'
                ? '1px solid rgba(255, 123, 0, 0.6)'
                : spotlightVisualMode === 'LIDAR'
                ? '1px solid rgba(34, 197, 94, 0.6)'
                : '1px solid rgba(0, 229, 255, 0.4)',
              boxShadow: spotlightVisualMode === 'THERMAL'
                ? '0 0 24px rgba(255, 123, 0, 0.25)'
                : spotlightVisualMode === 'LIDAR'
                ? '0 0 24px rgba(34, 197, 94, 0.25)'
                : '0 0 20px rgba(0, 229, 255, 0.15)',
              background: '#040608',
              transition: 'border 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div className="tactical-corner tactical-corner-tl" />
              <div className="tactical-corner tactical-corner-tr" />
              <div className="tactical-corner tactical-corner-bl" />
              <div className="tactical-corner tactical-corner-br" />

              <img
                src={SENSOR_IMAGE_MAP[spotlightItem.id] || spotlightItem.imageUrl}
                alt={spotlightItem.name}
                className={spotlightVisualMode === 'THERMAL' ? 'thermal-shader-view' : ''}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: spotlightVisualMode === 'OPTICAL'
                    ? 'contrast(1.08) brightness(1.02)'
                    : spotlightVisualMode === 'LIDAR'
                    ? 'contrast(1.35) brightness(0.9) grayscale(0.5)'
                    : undefined,
                  transition: 'filter 0.3s ease'
                }}
              />
              <div className="sensor-scan-line" />

              {/* LiDAR Laser Grid & Scan Bar Overlay */}
              {spotlightVisualMode === 'LIDAR' && (
                <div className="lidar-contour-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  <div className="laser-scan-bar" />
                </div>
              )}

              {/* Tactical HUD Overlay Details */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.85)',
                border: spotlightVisualMode === 'THERMAL'
                  ? '1px solid #ff7b00'
                  : spotlightVisualMode === 'LIDAR'
                  ? '1px solid #22c55e'
                  : '1px solid var(--cyan)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: spotlightVisualMode === 'THERMAL'
                  ? '#ff9e3b'
                  : spotlightVisualMode === 'LIDAR'
                  ? '#4ade80'
                  : '#00e5ff',
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(4px)'
              }}>
                {spotlightVisualMode === 'OPTICAL' && '● LIVE 8K OPTICAL FEED [50mm f/2.8 IS]'}
                {spotlightVisualMode === 'THERMAL' && '● RADIOMETRIC THERMAL LWIR (8-14μm)'}
                {spotlightVisualMode === 'LIDAR' && '● TIME-OF-FLIGHT LIDAR TOF (905nm)'}
              </div>

              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#cbd5e1',
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(4px)'
              }}>
                {spotlightVisualMode === 'OPTICAL' && 'EXP: 1/800s • ISO 100'}
                {spotlightVisualMode === 'THERMAL' && 'T_CORE: 19.2°C • ε: 0.96'}
                {spotlightVisualMode === 'LIDAR' && 'DENSITY: 148 pts/m²'}
              </div>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(4px)'
              }}>
                STATION ID: SN-GEO-{spotlightItem.id.toString().padStart(3, '0')}
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
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(4px)'
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
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => { playTacticalAudio('click'); setInspectModalItem(spotlightItem); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🔍</span> Inspect Technical Datasheet
                </button>
                <button
                  className="btn"
                  onClick={() => { playTacticalAudio('click'); setActiveTab('GRAPHS'); }}
                  style={{
                    background: 'rgba(0, 229, 255, 0.12)',
                    border: '1px solid var(--cyan)',
                    color: 'var(--cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📈</span> Progressive Live Graphs & Predictions
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    playTacticalAudio('click');
                    setShowDiagnosticsPanel(!showDiagnosticsPanel);
                  }}
                  style={{
                    background: showDiagnosticsPanel ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                    border: showDiagnosticsPanel ? '1px solid var(--cyan)' : '1px solid var(--border-default)',
                    color: showDiagnosticsPanel ? 'var(--cyan)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🔬</span> {showDiagnosticsPanel ? 'Hide Diagnostics' : 'Signal Diagnostics'}
                </button>
                <button
                  className="btn"
                  onClick={() => { playTacticalAudio('click'); handleQuantityChange(spotlightItem.id, 1); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-default)' }}
                >
                  + Add 1 Unit to BOM ({quantities[spotlightItem.id] || 0} in cart)
                </button>
              </div>

              {/* Collapsible Enhanced Live Instrument Diagnostics & Algorithm Analysis Center */}
              {showDiagnosticsPanel && (
                <div style={{
                  marginTop: '16px',
                  background: 'linear-gradient(135deg, rgba(4, 8, 14, 0.98), rgba(8, 14, 22, 0.98))',
                  border: '1px solid var(--cyan)',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  boxShadow: '0 8px 32px rgba(0, 229, 255, 0.18)',
                  position: 'relative'
                }}>
                  {/* Top Header: Title & Action Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: diagnosticScanActive ? 'var(--amber)' : injectedNoise ? 'var(--red)' : '#22c55e',
                        boxShadow: diagnosticScanActive ? '0 0 10px var(--amber)' : injectedNoise ? '0 0 10px var(--red)' : '0 0 10px #22c55e',
                        animation: diagnosticScanActive ? 'livePointPulse 1.2s infinite' : 'none'
                      }} />
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                        TRANSDUCER SCANNING & ALGORITHM ANALYSIS LAB • {spotlightItem.model}
                      </span>
                      <span className={`chip ${injectedNoise ? 'chip-red' : diagnosticScanActive ? 'chip-amber' : 'chip-green'}`} style={{ fontSize: '9px' }}>
                        {diagnosticScanActive
                          ? `SCANNING (STAGE ${scanStage}/5)`
                          : injectedNoise
                          ? '50Hz EMI NOISE INJECTED'
                          : zeroCalibrated
                          ? 'ZERO OFFSET CALIBRATED'
                          : 'STATUS: NOMINAL (PASS)'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleRunDiagnosticScan}
                        disabled={diagnosticScanActive}
                        className="btn btn-primary"
                        style={{
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: diagnosticScanActive ? 'rgba(255, 176, 32, 0.2)' : undefined,
                          borderColor: diagnosticScanActive ? 'var(--amber)' : undefined,
                          color: diagnosticScanActive ? 'var(--amber)' : undefined
                        }}
                      >
                        {diagnosticScanActive ? '⏳ EXECUTING SCAN...' : '⚡ RUN ALGORITHM SCAN'}
                      </button>

                      <button
                        onClick={() => {
                          playTacticalAudio('alert');
                          setZeroCalibrated(true);
                          setTimeout(() => setZeroCalibrated(false), 3000);
                        }}
                        className="btn"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: zeroCalibrated ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.06)',
                          border: zeroCalibrated ? '1px solid #22c55e' : '1px solid var(--border-default)',
                          color: zeroCalibrated ? '#22c55e' : 'var(--text-primary)'
                        }}
                      >
                        {zeroCalibrated ? '✓ ZERO LOCKED' : '✨ AUTO-ZERO TARE'}
                      </button>

                      <button
                        onClick={() => {
                          playTacticalAudio('alarm');
                          setInjectedNoise(!injectedNoise);
                        }}
                        className="btn"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: injectedNoise ? 'rgba(255, 59, 92, 0.25)' : 'rgba(255,255,255,0.06)',
                          border: injectedNoise ? '1px solid var(--red)' : '1px solid var(--border-default)',
                          color: injectedNoise ? 'var(--red)' : 'var(--text-secondary)'
                        }}
                      >
                        {injectedNoise ? '⚠️ NOISE ACTIVE' : '⚡ INJECT EMI NOISE'}
                      </button>

                      <button
                        onClick={handleDownloadCalibrationCert}
                        className="btn"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid var(--border-cyan)',
                          color: 'var(--cyan)'
                        }}
                        title="Download ISO 18674 Laboratory Calibration Certificate JSON"
                      >
                        📜 EXPORT CERT
                      </button>
                    </div>
                  </div>

                  {/* Multi-Stage Algorithm Pipeline Tracker */}
                  <div style={{
                    marginBottom: '14px',
                    background: 'rgba(0,0,0,0.45)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        AUTOMATED ALGORITHM SCAN PIPELINE:
                      </span>
                      <span style={{ fontSize: '10px', color: diagnosticScanActive ? 'var(--amber)' : '#22c55e', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {diagnosticScanActive
                          ? `PROGRESS: ${scanProgress}% • STAGE ${scanStage} OF 5 RUNNING`
                          : 'PIPELINE READY • ALL 5 TESTS VERIFIED'}
                      </span>
                    </div>

                    {/* Stage Pipeline Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '8px' }}>
                      {[
                        { num: 1, label: 'COIL EXCITATION', sub: '35mA Pluck Pulse' },
                        { num: 2, label: 'FREQ SWEEP', sub: '800-3200 Hz' },
                        { num: 3, label: 'RADIX-2 FFT', sub: 'Peak f0 Lock' },
                        { num: 4, label: 'WAVELET FILTER', sub: 'db4 Denoise' },
                        { num: 5, label: 'POLY CALIBRATION', sub: 'Temp Correction' },
                      ].map(st => {
                        const isCurrent = scanStage === st.num;
                        const isDone = scanStage > st.num || (!diagnosticScanActive && scanStage === 6);
                        return (
                          <div
                            key={st.num}
                            className={isCurrent ? 'diag-stage-active' : ''}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              background: isCurrent ? 'rgba(0, 229, 255, 0.15)' : isDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                              border: isCurrent ? '1px solid var(--cyan)' : isDone ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border-subtle)',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: isCurrent ? 'var(--cyan)' : isDone ? '#22c55e' : 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {isDone ? '✓ ' : ''}{st.num}. {st.label}
                            </div>
                            <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {st.sub}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Animated Progress Bar */}
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%',
                        width: `${scanProgress}%`,
                        background: diagnosticScanActive ? 'linear-gradient(90deg, #00e5ff, #ffb020, #00e5ff)' : '#22c55e',
                        backgroundSize: '200% 100%',
                        animation: diagnosticScanActive ? 'batteryChargeFlow 1.5s linear infinite' : 'none',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>

                  {/* Visualizer Mode Switcher Tabs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      {[
                        { id: 'OSCILLOSCOPE', icon: '🌊', label: 'TIME OSCILLOSCOPE (0-20ms)' },
                        { id: 'FFT_SPECTRUM', icon: '📊', label: 'FFT SPECTRUM (800-3200Hz)' },
                        { id: 'PHASE_SPACE', icon: '🌀', label: 'PHASE ATTRACTOR (dx/dt vs x)' },
                        { id: 'CALIBRATION', icon: '📈', label: 'POLYNOMIAL CORRIDOR (±0.05% FS)' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { playTacticalAudio('click'); setDiagViewMode(tab.id); }}
                          style={{
                            background: diagViewMode === tab.id ? 'var(--cyan)' : 'transparent',
                            color: diagViewMode === tab.id ? '#000' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '4px 10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{tab.icon}</span> {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Secondary Algorithm Selector Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ACTIVE DSP:</span>
                      {[
                        { id: 'FFT', label: 'Radix-2 FFT' },
                        { id: 'WAVELET', label: 'db4 Wavelet' },
                        { id: 'POLYNOMIAL', label: 'Polynomial' },
                        { id: 'KALMAN', label: 'Kalman' }
                      ].map(alg => (
                        <button
                          key={alg.id}
                          onClick={() => { playTacticalAudio('click'); setSelectedDiagAlgorithm(alg.id); }}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            background: selectedDiagAlgorithm === alg.id ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                            color: selectedDiagAlgorithm === alg.id ? 'var(--cyan)' : 'var(--text-muted)',
                            border: selectedDiagAlgorithm === alg.id ? '1px solid var(--cyan)' : '1px solid transparent'
                          }}
                        >
                          {alg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Visualizer Stage */}
                  <div style={{
                    height: '145px',
                    background: '#020508',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    {/* Visualizer 1: Time Domain Oscilloscope */}
                    {diagViewMode === 'OSCILLOSCOPE' && (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <div className="oscilloscope-beam" />
                        <svg viewBox="0 0 600 140" style={{ width: '100%', height: '100%' }}>
                          {/* Grid Lines */}
                          {[20, 50, 70, 90, 120].map(y => (
                            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke={y === 70 ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255,255,255,0.05)'} strokeDasharray={y === 70 ? 'none' : '3 3'} />
                          ))}
                          {[100, 200, 300, 400, 500].map(x => (
                            <line key={x} x1={x} y1="0" x2={x} y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                          ))}

                          {/* Zero-voltage reference */}
                          <line x1="0" y1="70" x2="600" y2="70" stroke="rgba(0, 229, 255, 0.35)" />
                          <text x="10" y="66" fill="rgba(0, 229, 255, 0.6)" fontSize="9" fontFamily="monospace">0.0V REF</text>
                          <text x="10" y="24" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">+2.5V</text>
                          <text x="10" y="132" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">-2.5V</text>

                          {/* Raw Noisy Waveform (When Noise Injected) */}
                          {injectedNoise && (
                            <path
                              d={`M ${Array.from({ length: 60 }).map((_, i) => {
                                const x = i * 10;
                                const decay = Math.exp(-x / 240);
                                const sin1 = Math.sin((x + diagOscTick * 3) * 0.12);
                                const emi = Math.sin(x * 0.05) * 22 + Math.sin(x * 0.15) * 12;
                                const y = 70 - (decay * sin1 * 40 + emi);
                                return `${i === 0 ? '' : 'L'} ${x} ${y.toFixed(1)}`;
                              }).join(' ')}`}
                              fill="none"
                              stroke="rgba(255, 59, 92, 0.65)"
                              strokeWidth="1.5"
                            />
                          )}

                          {/* Filtered Resonant Sinusoidal Pluck Waveform */}
                          <path
                            className="oscilloscope-trace"
                            d={`M ${Array.from({ length: 120 }).map((_, i) => {
                              const x = i * 5;
                              const decay = Math.exp(-x / 220);
                              const sinVal = Math.sin((x + diagOscTick * 4) * 0.12);
                              const jitter = (Math.sin(x * 3.4) * 0.4);
                              const y = 70 - (decay * sinVal * 46 + jitter);
                              return `${i === 0 ? '' : 'L'} ${x} ${y.toFixed(1)}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke={injectedNoise ? '#22c55e' : '#00e5ff'}
                            strokeWidth="2.2"
                          />

                          {/* Damping Envelope Curve (Dashed) */}
                          <path
                            d={`M ${Array.from({ length: 60 }).map((_, i) => {
                              const x = i * 10;
                              const decay = Math.exp(-x / 220) * 46;
                              return `${i === 0 ? '' : 'L'} ${x} ${70 - decay}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="rgba(255, 176, 32, 0.5)"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                          />
                        </svg>

                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '10px',
                          display: 'flex',
                          gap: '12px',
                          fontSize: '9px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <span style={{ color: injectedNoise ? '#22c55e' : '#00e5ff' }}>
                            ● WAVEFORM: <strong>2,418.6 Hz</strong>
                          </span>
                          <span>DAMPING: <strong>ζ = 0.018</strong></span>
                          <span>SNR: <strong style={{ color: injectedNoise ? 'var(--red)' : '#22c55e' }}>{injectedNoise ? '34.2 dB (NOISY)' : '51.4 dB (EXCELLENT)'}</strong></span>
                          <span>SAMPLE RATE: <strong>250 kS/s</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Visualizer 2: FFT Power Spectrum Analyzer */}
                    {diagViewMode === 'FFT_SPECTRUM' && (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {diagnosticScanActive && <div className="freq-sweep-bar" />}
                        <svg viewBox="0 0 600 140" style={{ width: '100%', height: '100%' }}>
                          {/* Frequency Grid Lines */}
                          {[25, 55, 85, 115].map(y => (
                            <line key={y} x1="45" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                          ))}
                          <line x1="45" y1="15" x2="45" y2="120" stroke="rgba(255,255,255,0.2)" />
                          <line x1="45" y1="120" x2="580" y2="120" stroke="rgba(255,255,255,0.2)" />

                          {/* Y-Axis (Power in dBm) */}
                          <text x="40" y="28" textAnchor="end" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">+10</text>
                          <text x="40" y="58" textAnchor="end" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">-20</text>
                          <text x="40" y="88" textAnchor="end" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">-50</text>
                          <text x="40" y="118" textAnchor="end" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">-80</text>

                          {/* X-Axis (Frequency in Hz) */}
                          <text x="45" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">800Hz</text>
                          <text x="178" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">1400Hz</text>
                          <text x="312" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">2000Hz</text>
                          <text x="414" y="132" textAnchor="middle" fill="var(--cyan)" fontSize="8" fontWeight="bold" fontFamily="monospace">2418Hz (f0)</text>
                          <text x="545" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">3000Hz</text>

                          {/* Power Spectrum Baseline Noise Floor */}
                          <path
                            d={`M 45 120 ${Array.from({ length: 54 }).map((_, i) => {
                              const x = 45 + i * 10;
                              // Resonant peak around x ≈ 414 (2418 Hz)
                              const dist = Math.abs(x - 414);
                              const peak = dist < 25 ? Math.exp(-Math.pow(dist / 8, 2)) * 95 : 0;
                              const emiPeak = injectedNoise && Math.abs(x - 65) < 12 ? 65 : 0;
                              const noise = Math.random() * 8;
                              const y = 118 - (peak + emiPeak + noise);
                              return `L ${x} ${y.toFixed(1)}`;
                            }).join(' ')} L 580 120 Z`}
                            fill="rgba(0, 229, 255, 0.15)"
                            stroke="#00e5ff"
                            strokeWidth="1.8"
                          />

                          {/* Peak Lock Marker */}
                          <line x1="414" y1="20" x2="414" y2="120" stroke="#ffb020" strokeWidth="1.2" strokeDasharray="3 2" />
                          <circle cx="414" cy="23" r="4" fill="#ffb020" className="live-point-pulse" />
                          <text x="422" y="32" fill="#ffb020" fontSize="8" fontWeight="bold" fontFamily="monospace">
                            RESONANT PEAK: 2,418.62 Hz (Q = 142.8)
                          </text>

                          {/* EMI Spike Callout if noise injected */}
                          {injectedNoise && (
                            <g>
                              <line x1="65" y1="52" x2="65" y2="120" stroke="#ff3b5c" strokeWidth="1.5" strokeDasharray="2 2" />
                              <text x="70" y="58" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                ⚠️ 50Hz MAINS EMI
                              </text>
                            </g>
                          )}
                        </svg>

                        <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          RADIX-2 FFT • 2048 SAMPLES • BLACKMAN-HARRIS WINDOW
                        </div>
                      </div>
                    )}

                    {/* Visualizer 3: Phase-Space Attractor (dx/dt vs x) */}
                    {diagViewMode === 'PHASE_SPACE' && (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 600 140" style={{ width: '100%', height: '100%' }}>
                          {/* Crosshairs */}
                          <line x1="300" y1="10" x2="300" y2="130" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                          <line x1="50" y1="70" x2="550" y2="70" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                          <text x="306" y="20" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">VELOCITY dx/dt</text>
                          <text x="540" y="66" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">POSITION x</text>

                          {/* Stable Inward Damped Spiral Attractor */}
                          <path
                            d={`M ${Array.from({ length: 120 }).map((_, i) => {
                              const theta = i * 0.15;
                              const r = 58 * Math.exp(-theta * 0.14);
                              const x = 300 + r * Math.cos(theta);
                              const y = 70 + r * Math.sin(theta) * 0.85;
                              return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="#00e5ff"
                            strokeWidth="1.8"
                          />

                          {/* Equilibrium Center Fixed Point */}
                          <circle cx="300" cy="70" r="3" fill="#22c55e" />
                          <text x="308" y="78" fill="#22c55e" fontSize="8" fontFamily="monospace">STABLE ATTRACTOR (0, 0)</text>

                          {/* Orbiting Operating Dot */}
                          {(() => {
                            const t = (diagOscTick * 0.08) % 15;
                            const r = 58 * Math.exp(-t * 0.14);
                            const dotX = 300 + r * Math.cos(t);
                            const dotY = 70 + r * Math.sin(t) * 0.85;
                            return (
                              <g transform={`translate(${dotX}, ${dotY})`}>
                                <circle r="6" fill="rgba(0, 229, 255, 0.4)" className="live-point-pulse" />
                                <circle r="3" fill="#00e5ff" />
                              </g>
                            );
                          })()}
                        </svg>

                        <div style={{ position: 'absolute', bottom: '6px', left: '12px', fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          LYAPUNOV EXPONENT: <strong>λ = -0.042 (STABLE LIMIT CYCLE)</strong> • NO CHAOTIC HYSTERESIS
                        </div>
                      </div>
                    )}

                    {/* Visualizer 4: Polynomial Linearity & Residual Error Corridor */}
                    {diagViewMode === 'CALIBRATION' && (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 600 140" style={{ width: '100%', height: '100%' }}>
                          {/* Tolerance Corridor Bounds */}
                          <line x1="50" y1="120" x2="550" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                          <polygon points="50,123 550,23 550,17 50,117" fill="rgba(34, 197, 94, 0.08)" />

                          {/* 5 Factory Calibration Standard Nodes */}
                          {[
                            { p: 0, x: 50, y: 120, label: '0 kPa (0%)' },
                            { p: 75, x: 175, y: 95, label: '75 kPa (25%)' },
                            { p: 150, x: 300, y: 70, label: '150 kPa (50%)' },
                            { p: 225, x: 425, y: 45, label: '225 kPa (75%)' },
                            { p: 300, x: 550, y: 20, label: '300 kPa (100%)' }
                          ].map((node, i) => (
                            <g key={i}>
                              <circle cx={node.x} cy={node.y} r="4" fill="#00e5ff" />
                              <text x={node.x} y={node.y + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">
                                {node.label}
                              </text>
                            </g>
                          ))}

                          {/* Operating Point on Curve */}
                          <circle cx="280" cy="74" r="6" fill="#ffb020" className="live-point-pulse" />
                          <text x="290" y="72" fill="#ffb020" fontSize="8" fontWeight="bold" fontFamily="monospace">
                            CURRENT LIVE HEAD: 142.8 kPa (RESIDUAL: +0.024 kPa)
                          </text>

                          {/* Tolerance Band Legend */}
                          <text x="50" y="15" fill="#22c55e" fontSize="8" fontFamily="monospace">
                            ±0.05% FULL-SCALE CALIBRATION CORRIDOR (ISO 18674-4 CERTIFIED)
                          </text>
                        </svg>

                        <div style={{ position: 'absolute', bottom: '6px', right: '12px', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          POLYNOMIAL: P = A·f² + B·f + C + D·ΔT
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Strip: Hardware Electrical Health & Algorithm Metadata */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 1.2fr', gap: '10px', alignItems: 'center' }}>
                    {/* Stat 1: Coil Resistance */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>COIL RESISTANCE</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        182.4 Ω <span style={{ fontSize: '9px', color: '#22c55e' }}>PASS</span>
                      </div>
                    </div>

                    {/* Stat 2: Isolation Resistance */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ISOLATION MEGGER</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
                        &gt; 500 MΩ <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>@500V</span>
                      </div>
                    </div>

                    {/* Stat 3: Loop Capacitance */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CABLE CAPACITANCE</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                        48.2 pF/m
                      </div>
                    </div>

                    {/* Stat 4: Thermistor Core Temp */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NTC CORE TEMP</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffb020', fontFamily: 'var(--font-mono)' }}>
                        18.4°C
                      </div>
                    </div>

                    {/* Algorithm Formulation Description */}
                    <div style={{ background: 'rgba(0, 229, 255, 0.04)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {selectedDiagAlgorithm === 'FFT' && 'RADIX-2 FFT PEAK DETECTOR (Radix-2 Cooley-Tukey, 2048 Bins)'}
                        {selectedDiagAlgorithm === 'WAVELET' && 'DAUBECHIES (db4) MULTI-RESOLUTION WAVELET FILTER (De-noises 50Hz EMI)'}
                        {selectedDiagAlgorithm === 'POLYNOMIAL' && 'ISO 18674-4 SECOND-ORDER POLYNOMIAL TEMPERATURE CALIBRATION'}
                        {selectedDiagAlgorithm === 'KALMAN' && 'DISCRETE KALMAN FILTER WITH DRIFT STATE COVARIANCE ESTIMATION'}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {selectedDiagAlgorithm === 'FFT' && 'f0 = argmax(|X[k]|²) • Latency: 1.24ms • Memory: 4.8KB RAM on ARM Cortex-M7'}
                        {selectedDiagAlgorithm === 'WAVELET' && 'Thresholding: Soft universal λ = σ√(2ln N) • Suppresses powerline hum by 28.6 dB'}
                        {selectedDiagAlgorithm === 'POLYNOMIAL' && 'P = A·f² + B·f + C + D·(T - T0) • Zero thermal drift correction enabled'}
                        {selectedDiagAlgorithm === 'KALMAN' && 'x̂ₖ = A·x̂ₖ₋₁ + Kₖ·(yₖ - C·A·x̂ₖ₋₁) • 365-day sensor drift < 0.05% FS'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Thumbnail Strip for All 27 Sensors with Category Filters */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'GEOTECHNICAL', 'REMOTE SENSING', 'HYDROLOGY', 'METEOROLOGICAL', 'TELECOM, POWER & AI'].map(cat => {
                  const isSel = spotlightThumbCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => { playTacticalAudio('click'); setSpotlightThumbCategory(cat); }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        border: isSel ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                        background: isSel ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: isSel ? 'var(--cyan)' : 'var(--text-secondary)'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                SHOWING {spotlightThumbCategory === 'ALL' ? items.length : items.filter(i => spotlightThumbCategory === 'TELECOM, POWER & AI' ? ['COMMUNICATION', 'COMPUTE', 'POWER', 'HOUSING'].includes(i.category) : i.category.includes(spotlightThumbCategory)).length} OF {items.length} INSTRUMENTS
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {items
                .filter(item => {
                  if (spotlightThumbCategory === 'ALL') return true;
                  if (spotlightThumbCategory === 'TELECOM, POWER & AI') return ['COMMUNICATION', 'COMPUTE', 'POWER', 'HOUSING'].includes(item.category);
                  return item.category.includes(spotlightThumbCategory);
                })
                .map(item => {
                  const isSelected = item.id === spotlightId;
                  const thumbImg = SENSOR_IMAGE_MAP[item.id] || item.imageUrl;
                  return (
                    <div
                      key={item.id}
                      onClick={() => { playTacticalAudio('click'); setSpotlightId(item.id); }}
                      style={{
                        flexShrink: 0,
                        width: '74px',
                        height: '56px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--cyan)' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected ? '0 0 12px rgba(0, 229, 255, 0.6)' : 'none',
                        opacity: isSelected ? 1 : 0.65,
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      title={`${item.id}. ${item.name}`}
                    >
                      <img src={thumbImg} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        color: isSelected ? 'var(--cyan)' : '#fff',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        #{item.id}
                      </div>
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
            onClick={() => { playTacticalAudio('click'); setActiveTab('BOM_TABLE'); }}
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
          <button
            onClick={() => { playTacticalAudio('click'); setActiveTab('GRAPHS'); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'GRAPHS' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'GRAPHS' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📈</span> PROGRESSIVE REAL-TIME GRAPHS
            <span style={{
              background: activeTab === 'GRAPHS' ? 'rgba(0,0,0,0.25)' : 'rgba(0, 229, 255, 0.2)',
              color: activeTab === 'GRAPHS' ? '#000' : 'var(--cyan)',
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '10px',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              ● LIVE STREAM
            </span>
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
          {['ALL', 'GEOTECHNICAL', 'REMOTE SENSING', 'HYDROLOGY', 'METEOROLOGICAL', 'SEISMIC', 'COMMUNICATION', 'COMPUTE', 'POWER', 'HOUSING'].map(cat => {
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
          {/* Panel Header & Tactical Command Toolbar */}
          <div className="panel-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <span className="label-caps" style={{ color: 'var(--cyan)' }}>
                🏔️ REAL-TIME TERRAIN SENSING & BISHOP STABILITY ANALYTICS
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                27-ASSET FIELD INSTRUMENTATION • 6 TERRAIN SENSOR VIEWS • LORAWAN MESH TOPOLOGY • REAL-TIME FoS PREDICTION
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                  {simStormActive ? 'STORM SURGE ACTIVE' : 'POLLING ACTIVE (2.0s)'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: '#cbd5e1' }}>27 ASSETS CATALOGED</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--cyan)' }}>CRC 100%</span>
              </div>

              {/* 27-Asset Field Atlas Button */}
              <button
                onClick={() => {
                  playTacticalAudio('click');
                  setShowAtlasModal(true);
                }}
                className="btn"
                style={{
                  background: 'rgba(0, 229, 255, 0.15)',
                  border: '1px solid var(--cyan)',
                  color: 'var(--cyan)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📚</span> 27-ASSET FIELD ATLAS
              </button>

              {/* Tactical Audio Toggle */}
              <button
                onClick={() => {
                  setAudioEnabled(!audioEnabled);
                  if (!audioEnabled) playTacticalAudio('click');
                }}
                className="btn"
                style={{
                  background: audioEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${audioEnabled ? 'var(--green)' : 'var(--border-subtle)'}`,
                  color: audioEnabled ? 'var(--green)' : 'var(--text-muted)',
                  fontSize: '11px',
                  padding: '6px 10px'
                }}
                title="Toggle Synthesized Web Audio Alerts"
              >
                {audioEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
              </button>

              {/* Storm Drill Trigger Button */}
              <button
                onClick={() => {
                  const nextState = !simStormActive;
                  setSimStormActive(nextState);
                  playTacticalAudio(nextState ? 'alert' : 'click');
                }}
                className="btn"
                style={{
                  background: simStormActive ? 'rgba(255, 59, 92, 0.25)' : 'rgba(255, 176, 32, 0.15)',
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
            {/* 1. TERRAIN SCENE / SENSOR VIEW SELECTOR (6 REAL MODES) */}
            <div style={{
              background: 'rgba(5, 10, 20, 0.75)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  🎯 SELECT TERRAIN SCENE / SENSOR VIEW (6 MODES):
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Active: <strong style={{ color: activeTerrainScene.color }}>{activeTerrainScene.name}</strong>
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '8px'
              }}>
                {TERRAIN_SCENE_OPTIONS.map(scene => {
                  const isCur = selectedTerrainSceneId === scene.id;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        playTacticalAudio('click');
                        setSelectedTerrainSceneId(scene.id);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: isCur ? `${scene.color}22` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isCur ? scene.color : 'var(--border-subtle)'}`,
                        color: isCur ? scene.color : 'var(--text-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isCur ? `0 0 14px ${scene.color}33` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '10px' }}>{scene.tag}</span>
                        {isCur && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: scene.color, boxShadow: `0 0 6px ${scene.color}` }} />}
                      </div>
                      <div style={{ fontSize: '11px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {scene.name.split('(')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Tactical Analytical Layer Toggles & Stability Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px',
              padding: '10px 14px',
              background: 'rgba(10, 15, 26, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '4px' }}>
                  ANALYTIC OVERLAYS:
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
                  📷 SCENE VIEW
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

            {/* 3. PHOTOGRAPHIC MOUNTAIN TERRAIN VIEWPORT WITH ANALYTICS OVERLAY */}
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

              {/* REAL MOUNTAIN SLOPE / SCIENTIFIC REMOTE SENSING PHOTOGRAPH */}
              <img
                src={activeTerrainScene.image}
                alt={activeTerrainScene.name}
                className="terrain-image-transition"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: simStormActive
                    ? 'brightness(0.65) contrast(1.3) saturate(1.1) hue-rotate(-12deg)'
                    : terrainLayers.optical
                    ? 'brightness(0.85) contrast(1.1)'
                    : 'brightness(0.35) contrast(1.4) grayscale(0.5)',
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
                  <span style={{ color: activeTerrainScene.color, fontWeight: 700 }}>● {activeTerrainScene.tag}</span>
                  <span>SLOPE SECTOR 4B (HIMALAYAN TRANSECT)</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeTerrainScene.name} • ELEVATION SPAN: 1,920m - 2,240m ASL
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
                <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9px', display: 'block' }}>BISHOP FoS</span>
                  <span style={{ color: liveTerrainTelemetry.fos < 1.0 ? 'var(--red)' : 'var(--amber)', fontWeight: 800 }}>{liveTerrainTelemetry.fos}</span>
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
                      d="M 620 180 Q 450 260 180 380 L 180 450 Q 480 430 650 250 Z"
                      fill="url(#saturationGrad)"
                    />
                    {/* Seepage percolation streamline arrows */}
                    <path d="M 590 200 Q 480 270 240 390" fill="none" stroke="#00e5ff" strokeWidth="1.8" strokeDasharray="5 5" opacity="0.85" />
                    <path d="M 550 230 Q 440 300 280 410" fill="none" stroke="#00e5ff" strokeWidth="1.4" strokeDasharray="5 5" opacity="0.7" />
                    <text x="270" y="435" fill="#00e5ff" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700" opacity="0.95">
                      SUBSURFACE PORE-WATER SATURATION PLUME (u = {liveTerrainTelemetry.porePressure} kPa • Ru = 0.52)
                    </text>
                  </g>
                )}

                {/* Bishop Critical Slip Surface Hazard Arc */}
                {terrainLayers.bishopFos && (
                  <g>
                    <path
                      d="M 180 380 Q 420 370 620 180"
                      fill="none"
                      stroke="#ff3b5c"
                      strokeWidth={simStormActive ? '5' : '3.5'}
                      strokeDasharray="10 5"
                      className="slip-surface-hazard"
                      filter="url(#hazardGlow)"
                    />
                    {/* Failure wedge shaded area */}
                    <path
                      d="M 180 380 Q 420 370 620 180 L 620 230 L 440 330 L 180 380 Z"
                      fill="url(#failureWedgeGrad)"
                    />
                    <text x="340" y="340" fill="#ff3b5c" fontSize="12" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="1px">
                      POTENTIAL ROTATIONAL SLIP PLANE (BISHOP FoS = {liveTerrainTelemetry.fos})
                    </text>
                    {/* Shear traction vector arrows */}
                    {[250, 340, 440, 530].map((ax, idx) => (
                      <g key={idx} transform={`translate(${ax}, ${350 - idx * 34}) rotate(34)`}>
                        <line x1="0" y1="0" x2="-22" y2="0" stroke="#ff3b5c" strokeWidth="2" strokeDasharray="3 2" />
                        <polygon points="-22,0 -16,-4 -16,4" fill="#ff3b5c" />
                      </g>
                    ))}
                  </g>
                )}

                {/* 12m Borehole Inclinometer & Piezometer Stem into Rock at ST-03 */}
                <g transform="translate(440, 280)">
                  <line x1="0" y1="0" x2="0" y2="120" stroke="#00e5ff" strokeWidth="3" strokeDasharray="4 2" />
                  <rect x="-8" y="0" width="16" height="40" fill="rgba(255, 176, 32, 0.5)" />
                  <circle cx="0" cy="115" r="7" fill="#ff3b5c" stroke="#fff" strokeWidth="1.5" />
                  <text x="18" y="30" fill="#ffb020" fontSize="10" fontFamily="var(--font-mono)">0-1.2m TDR VWC</text>
                  <text x="18" y="118" fill="#ff3b5c" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">12m VW PIEZOMETER</text>
                </g>

                {/* Tension Head Scarp Fracture Opening at ST-02 */}
                <g transform="translate(620, 180)">
                  <path d="M -15 -10 L 0 0 L 15 -8 L 30 2" stroke="#ff3b5c" strokeWidth="3" fill="none" />
                  <text x="-70" y="-18" fill="#ff3b5c" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">
                    CROWN EXTENSION FISSURE (+{liveTerrainTelemetry.crackOpening}mm)
                  </text>
                </g>

                {/* LoRaWAN 868MHz Mesh Topology & Wireless Signal Paths */}
                {terrainLayers.loraMesh && (
                  <g>
                    {/* Toe to Mid-Slope */}
                    <path d="M 180 380 Q 310 320 440 280" fill="none" stroke="#00e5ff" strokeWidth="2.5" className="lora-signal-beam" />
                    {/* Mid-Slope to Crown */}
                    <path d="M 440 280 Q 530 220 620 180" fill="none" stroke="#22c55e" strokeWidth="2.5" className="lora-signal-beam" />
                    {/* Crown to Summit Gateway */}
                    <path d="M 620 180 Q 720 135 820 100" fill="none" stroke="#22c55e" strokeWidth="2.5" className="lora-signal-beam" />
                    {/* Direct Long-Range Redundant Link (Toe to Gateway) */}
                    <path d="M 180 380 Q 510 170 820 100" fill="none" stroke="#ffb020" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" />
                    {/* Gateway to Satellite Uplink */}
                    <path d="M 820 100 L 925 35" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 3" opacity="0.85" />

                    {/* Traveling Energy Packet Pulses */}
                    <circle cx={440 + Math.sin(Date.now() / 400) * 80} cy={280 - Math.sin(Date.now() / 400) * 40} r="4" fill="#fff" filter="url(#cyanPulseGlow)" />
                    <circle cx={620 + Math.cos(Date.now() / 350) * 70} cy={180 - Math.cos(Date.now() / 350) * 35} r="4" fill="#22c55e" filter="url(#cyanPulseGlow)" />

                    {/* Satellite Node Callout at Top Right with Pulsing Wave Rings */}
                    <g transform="translate(925, 35)">
                      <circle cx="0" cy="0" r="18" fill="none" stroke="var(--cyan)" className="satellite-wave-ring" />
                      <circle cx="0" cy="0" r="14" fill="rgba(0, 229, 255, 0.15)" stroke="var(--cyan)" strokeWidth="1.5" />
                      <text x="-8" y="5" fontSize="13">🛰️</text>
                      <text x="-32" y="26" fill="var(--cyan)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">IRIDIUM SATELLITE</text>
                    </g>
                  </g>
                )}

                {/* Toe Gully Radar Rotating Scanning Cone at ST-04 */}
                <g transform="translate(180, 380)">
                  <path
                    d="M 0 0 L 30 -15 A 35 35 0 0 1 30 15 Z"
                    fill="rgba(0, 229, 255, 0.25)"
                    stroke="var(--cyan)"
                    strokeWidth="1"
                    className="radar-cone-sweep"
                  />
                </g>

                {/* Elevation Contours - Cleanly aligned on left margin with dark background badges */}
                <g opacity="0.85">
                  <g transform="translate(25, 100)">
                    <rect x="0" y="-10" width="155" height="18" rx="3" fill="rgba(5, 10, 20, 0.85)" stroke="#64748b" strokeWidth="0.75" />
                    <text x="6" y="3" fill="#cbd5e1" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">2,240m ASL (SUMMIT RIDGE)</text>
                    <line x1="155" y1="0" x2="200" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
                  </g>

                  <g transform="translate(25, 180)">
                    <rect x="0" y="-10" width="155" height="18" rx="3" fill="rgba(5, 10, 20, 0.85)" stroke="#64748b" strokeWidth="0.75" />
                    <text x="6" y="3" fill="#cbd5e1" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">2,160m ASL (HEAD SCARP)</text>
                    <line x1="155" y1="0" x2="200" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
                  </g>

                  <g transform="translate(25, 280)">
                    <rect x="0" y="-10" width="155" height="18" rx="3" fill="rgba(5, 10, 20, 0.85)" stroke="#64748b" strokeWidth="0.75" />
                    <text x="6" y="3" fill="#cbd5e1" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">2,050m ASL (BOREHOLE SHEAR)</text>
                    <line x1="155" y1="0" x2="200" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
                  </g>

                  <g transform="translate(25, 380)">
                    <rect x="0" y="-10" width="155" height="18" rx="3" fill="rgba(5, 10, 20, 0.85)" stroke="#64748b" strokeWidth="0.75" />
                    <text x="6" y="3" fill="#cbd5e1" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">1,920m ASL (TOE GULLY)</text>
                    <line x1="155" y1="0" x2="200" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
                  </g>
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
                    onClick={() => {
                      playTacticalAudio('click');
                      setSelectedTerrainStationId(st.id);
                    }}
                    className="hud-tag-floating"
                    style={{
                      position: 'absolute',
                      left: st.pinPos.left,
                      top: st.pinPos.top,
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
                        transform: isSelected ? 'scale(1.3)' : 'scale(1)'
                      }}
                    />

                    {/* Sensor Pin Icon Button */}
                    <div style={{
                      width: isSelected ? '44px' : '36px',
                      height: isSelected ? '44px' : '36px',
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

                    {/* Pinned Tactical HUD Callout Tag with Glassmorphism */}
                    <div style={{
                      position: 'absolute',
                      top: st.id === 'ST-01' ? '50px' : '-58px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(5, 10, 20, 0.94)',
                      backdropFilter: 'blur(10px)',
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

            {/* 4. STATION QUICK SWITCHER CARDS (EVENLY ALIGNED 4-COL GRID) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginTop: '16px',
              marginBottom: '20px'
            }}>
              {TERRAIN_STATIONS.map(st => {
                const isSelected = selectedTerrainStationId === st.id;
                const readingSummary =
                  st.id === 'ST-01' ? `${liveTerrainTelemetry.batteryVoltage}V • ${liveTerrainTelemetry.rssi}dBm` :
                  st.id === 'ST-02' ? `θ: +${liveTerrainTelemetry.tiltX}° • +${liveTerrainTelemetry.crackOpening}mm` :
                  st.id === 'ST-03' ? `${liveTerrainTelemetry.porePressure} kPa • ${liveTerrainTelemetry.soilMoisture}%` :
                  `${liveTerrainTelemetry.rainfall} mm/h • Stage: ${liveTerrainTelemetry.debrisStage}m`;

                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      playTacticalAudio('click');
                      setSelectedTerrainStationId(st.id);
                    }}
                    style={{
                      background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? st.color : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 16px ${st.color}33` : 'none',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    {/* Mini photo thumbnail */}
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: `1px solid ${isSelected ? st.color : 'var(--border-subtle)'}`
                    }}>
                      <img src={st.hardwarePhotos[0].image} alt={st.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: st.color, fontFamily: 'var(--font-mono)' }}>{st.id} • {st.altitude}</span>
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: isSelected ? st.color : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#000' : 'var(--text-secondary)',
                          fontWeight: 700
                        }}>
                          {isSelected ? 'ACTIVE' : 'SELECT'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {st.name}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: st.color, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {readingSummary}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 5. SELECTED STATION TACTICAL DEEP-DIVE INSPECTOR */}
            <div style={{
              background: 'var(--bg-card)',
              border: `1px solid ${selectedTerrainStation.color}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: `0 0 24px ${selectedTerrainStation.color}22`,
              marginBottom: '20px'
            }}>
              {/* Header */}
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
                      playTacticalAudio('click');
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
                {/* Column 1: Real Field Hardware Showcase + Multi-Image Selector */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="label-caps" style={{ color: 'var(--cyan)' }}>
                      📷 HARDWARE SHOWCASE & FIELD PHOTOS
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Photo {stationPhotoIndex + 1} of {selectedTerrainStation.hardwarePhotos.length}
                    </span>
                  </div>

                  {/* Main Active Hardware Photo */}
                  <div style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-cyan)',
                    height: '210px',
                    background: '#07090d',
                    marginBottom: '10px'
                  }}>
                    <img
                      src={selectedTerrainStation.hardwarePhotos[stationPhotoIndex].image}
                      alt={selectedTerrainStation.hardwarePhotos[stationPhotoIndex].title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Tactical Corners */}
                    <div className="tactical-corner tactical-corner-tl" />
                    <div className="tactical-corner tactical-corner-tr" />
                    <div className="tactical-corner tactical-corner-bl" />
                    <div className="tactical-corner tactical-corner-br" />

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{selectedTerrainStation.hardwarePhotos[stationPhotoIndex].title}</span>
                      <span style={{ color: 'var(--cyan)', fontSize: '10px' }}>
                        {selectedTerrainStation.hardwarePhotos[stationPhotoIndex].model}
                      </span>
                    </div>
                  </div>

                  {/* SELECTABLE MULTI-IMAGE THUMBNAIL BAR */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                    {selectedTerrainStation.hardwarePhotos.map((photo, pIdx) => {
                      const isPhotoActive = stationPhotoIndex === pIdx;
                      return (
                        <div
                          key={pIdx}
                          onClick={() => {
                            playTacticalAudio('click');
                            setStationPhotoIndex(pIdx);
                          }}
                          style={{
                            height: '52px',
                            borderRadius: '5px',
                            overflow: 'hidden',
                            border: `2px solid ${isPhotoActive ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: isPhotoActive ? '0 0 10px var(--cyan)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                          title={photo.title}
                        >
                          <img src={photo.image} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {isPhotoActive && (
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: 'var(--cyan)'
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Role: <strong style={{ color: '#fff' }}>{selectedTerrainStation.hardwarePhotos[stationPhotoIndex].role}</strong>
                  </div>
                </div>

                {/* Column 2: Live Telemetry & 24h Real-Time Oscilloscope Waveform Monitor */}
                <div>
                  <span className="label-caps" style={{ color: 'var(--amber)', marginBottom: '10px', display: 'block' }}>
                    📈 LIVE TELEMETRY & OSCILLOSCOPE MONITOR
                  </span>

                  <div style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PRIMARY SENSOR READING:</span>
                      <strong style={{ fontSize: '13px', color: selectedTerrainStation.color, fontFamily: 'var(--font-mono)' }}>
                        {selectedTerrainStation.id === 'ST-01' ? `${liveTerrainTelemetry.batteryVoltage}V (94% SoC)` :
                         selectedTerrainStation.id === 'ST-02' ? `+${liveTerrainTelemetry.crackOpening} mm (Rate: +${liveTerrainTelemetry.crackRate} mm/h)` :
                         selectedTerrainStation.id === 'ST-03' ? `${liveTerrainTelemetry.porePressure} kPa (Ru = 0.52)` :
                         `${liveTerrainTelemetry.rainfall} mm/hr (Stage: ${liveTerrainTelemetry.debrisStage}m)`}
                      </strong>
                    </div>

                    {/* Animated SVG Real-Time Oscilloscope Waveform */}
                    <div style={{ height: '75px', width: '100%', position: 'relative', overflow: 'hidden', background: 'rgba(5, 10, 20, 0.6)', borderRadius: '4px' }}>
                      <div className="oscilloscope-beam" />
                      <svg viewBox="0 0 300 75" style={{ width: '100%', height: '100%' }}>
                        <defs>
                          <linearGradient id="scopeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={selectedTerrainStation.color} stopOpacity="0.45" />
                            <stop offset="100%" stopColor={selectedTerrainStation.color} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Scope Grid */}
                        <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <line x1="100" y1="0" x2="100" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <line x1="200" y1="0" x2="200" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                        {/* Waveform Path */}
                        <path
                          d={
                            selectedTerrainStation.id === 'ST-03'
                              ? "M 0 52 Q 50 50 100 46 T 200 34 T 260 20 L 300 14 L 300 75 L 0 75 Z"
                              : selectedTerrainStation.id === 'ST-02'
                              ? "M 0 58 Q 60 54 120 48 T 220 38 T 270 22 L 300 16 L 300 75 L 0 75 Z"
                              : "M 0 60 Q 70 56 140 46 T 220 42 T 270 28 L 300 20 L 300 75 L 0 75 Z"
                          }
                          fill="url(#scopeGrad)"
                        />
                        <path
                          d={
                            selectedTerrainStation.id === 'ST-03'
                              ? "M 0 52 Q 50 50 100 46 T 200 34 T 260 20 L 300 14"
                              : selectedTerrainStation.id === 'ST-02'
                              ? "M 0 58 Q 60 54 120 48 T 220 38 T 270 22 L 300 16"
                              : "M 0 60 Q 70 56 140 46 T 220 42 T 270 28 L 300 20"
                          }
                          fill="none"
                          stroke={selectedTerrainStation.color}
                          strokeWidth="2.5"
                        />
                        {/* Peak Point Pulsing */}
                        <circle cx="300" cy="14" r="4" fill="#fff" stroke={selectedTerrainStation.color} strokeWidth="2" />
                      </svg>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      <span>-24 HOURS</span>
                      <span>-12 HOURS</span>
                      <span>-6 HOURS</span>
                      <span style={{ color: selectedTerrainStation.color, fontWeight: 700 }}>NOW ({liveTerrainTelemetry.lastUpdate})</span>
                    </div>
                  </div>

                  {/* Diagnostic telemetry parameter pills */}
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

            {/* 6. REAL-TIME LORAWAN TELEMETRY PACKET CONSOLE */}
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
                  {/* Filter by Node */}
                  <select
                    value={packetNodeFilter}
                    onChange={(e) => setPacketNodeFilter(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#cbd5e1',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <option value="ALL">ALL NODES</option>
                    <option value="ST-01">ST-01 SUMMIT</option>
                    <option value="ST-02">ST-02 SCARP</option>
                    <option value="ST-03">ST-03 BOREHOLE</option>
                    <option value="ST-04">ST-04 TOE GULLY</option>
                  </select>

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
                {packetLogs
                  .filter(pkt => packetNodeFilter === 'ALL' || pkt.node.includes(packetNodeFilter))
                  .length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>Waiting for next telemetry burst...</div>
                ) : (
                  packetLogs
                    .filter(pkt => packetNodeFilter === 'ALL' || pkt.node.includes(packetNodeFilter))
                    .map(pkt => (
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

      {/* 27-ASSET FIELD INSTRUMENTATION & REMOTE SENSING ATLAS MODAL */}
      {showAtlasModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 6, 12, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-cyan)',
            paddingBottom: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📚</span>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '20px' }}>
                  27-ASSET FIELD INSTRUMENTATION & REMOTE SENSING ATLAS
                </h2>
                <span style={{
                  background: 'var(--cyan)',
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {filteredAtlasAssets.length} ASSETS
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Explore authentic field photography of geotechnical sensors, remote sensing imagery, telemetry hubs, and drilling equipment.
              </div>
            </div>

            <button
              onClick={() => setShowAtlasModal(false)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ✕ CLOSE ATLAS
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'GEOTECHNICAL', 'REMOTE SENSING & LiDAR', 'METEOROLOGICAL', 'HYDROLOGICAL', 'TELECOM, POWER & AI'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setAtlasCategory(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: atlasCategory === cat ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                    color: atlasCategory === cat ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${atlasCategory === cat ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search by name, model, parameter, or role..."
              value={atlasSearch}
              onChange={(e) => setAtlasSearch(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#fff',
                fontSize: '12px',
                width: '280px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Grid of 27 Atlas Cards */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            paddingRight: '6px'
          }}>
            {filteredAtlasAssets.map(asset => (
              <div
                key={asset.id}
                className="atlas-card-hover"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Card Image with zoom action */}
                <div style={{ position: 'relative', height: '160px', background: '#050811' }}>
                  <img src={asset.image} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    color: 'var(--cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700
                  }}>
                    #{asset.id} • {asset.category}
                  </div>
                  <button
                    onClick={() => setAtlasLightboxAsset(asset)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '10px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 ZOOM
                  </button>
                </div>

                {/* Card Content */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                      {asset.model}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.4' }}>
                      {asset.role}
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', marginBottom: '10px' }}>
                      <div><strong style={{ color: 'var(--cyan)' }}>Param:</strong> {asset.param}</div>
                      <div><strong style={{ color: 'var(--green)' }}>Accuracy:</strong> {asset.accuracy}</div>
                      <div><strong style={{ color: 'var(--amber)' }}>Ingress:</strong> {asset.ingress}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {asset.id >= 15 && asset.id <= 20 ? (
                      <button
                        onClick={() => {
                          const sceneMap = {
                            15: 'OPTICAL_RIDGE',
                            16: 'PANORAMIC_TRANSECT',
                            17: 'LIDAR_DEM',
                            18: 'INSAR_FRINGES',
                            19: 'THERMAL_SEEPAGE',
                            20: 'MULTISPECTRAL_NDVI',
                          };
                          setSelectedTerrainSceneId(sceneMap[asset.id]);
                          setShowAtlasModal(false);
                          playTacticalAudio('click');
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '5px' }}
                      >
                        SET AS TERRAIN VIEW
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (asset.id <= 14) {
                            setSpotlightId(asset.id);
                            setActiveTab('CARDS');
                            setShowAtlasModal(false);
                          }
                          playTacticalAudio('click');
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '5px' }}
                      >
                        INSPECT HARDWARE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX FOR 8K ASSETS */}
      {atlasLightboxAsset && (
        <div
          onClick={() => setAtlasLightboxAsset(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '1000px', maxHeight: '80vh', textAlign: 'center' }}>
            <img
              src={atlasLightboxAsset.image}
              alt={atlasLightboxAsset.name}
              style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-cyan)' }}
            />
            <div style={{ marginTop: '12px', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
              {atlasLightboxAsset.name} ({atlasLightboxAsset.model})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--cyan)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {atlasLightboxAsset.param} • {atlasLightboxAsset.accuracy} • {atlasLightboxAsset.ingress}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POWER & SOLAR AUTONOMY CALCULATOR */}
      {activeTab === 'AUTONOMY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>

          {/* 1. REAL-WORLD CLIMATE & ENVIRONMENTAL SITUATION SELECTOR */}
          <div className="panel" style={{
            background: 'linear-gradient(135deg, rgba(14, 20, 32, 0.95), rgba(7, 10, 16, 0.98))',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />
                <span className="label-caps" style={{ color: 'var(--cyan)' }}>REAL-WORLD CLIMATE & ENVIRONMENTAL SITUATION ADAPTATION</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  ACTIVE SITUATION:
                </span>
                <span className="chip chip-cyan" style={{ fontWeight: 700 }}>
                  {powerScenario}
                </span>
              </div>
            </div>

            <div className="panel-body">
              {/* Situation Selector Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {[
                  {
                    id: 'MONSOON',
                    icon: '🌧️',
                    title: 'Extreme Monsoon Cloudburst',
                    subtitle: '92% Cloud • 85 W/m² • 18°C • 1-Min Poll',
                    desc: 'Multi-day torrential downpour. Stress-tests zero-sun battery endurance under severe slope infiltration triggers.'
                  },
                  {
                    id: 'CLEARSKY',
                    icon: '☀️',
                    title: 'Western Ghats Clearsky',
                    subtitle: '10% Cloud • 980 W/m² • 34°C • 5-Min Poll',
                    desc: 'Optimal tropical solar insolation. Rapid MPPT bulk charge brings LiFePO4 pack to float maintenance by 11:30 AM.'
                  },
                  {
                    id: 'SUBZERO',
                    icon: '❄️',
                    title: 'Alpine Sub-Zero Blizzard',
                    subtitle: '75% Cloud • -14°C Frost • 55% Snow on PV',
                    desc: 'High Himalayan winter freeze. Accounts for -35% battery electrochemical capacity loss and snow panel shading.'
                  },
                  {
                    id: 'CYCLONE',
                    icon: '🌪️',
                    title: '10-Day Cyclone Blackout',
                    subtitle: '100% Blanket • 0 W Sun • 22°C • 1-Min Poll',
                    desc: 'Severe tropical cyclonic storm. Zero direct sunlight for 10+ consecutive days. Tests AI power shedding survival.'
                  }
                ].map(sc => {
                  const isSel = powerScenario === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => applyPowerScenario(sc.id)}
                      style={{
                        background: isSel ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                        border: isSel ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSel ? '0 0 16px rgba(0, 229, 255, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px' }}>{sc.icon}</span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: isSel ? 'var(--cyan)' : '#fff' }}>
                          {sc.title}
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                        {sc.subtitle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {sc.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Environmental Variables Tuning Sliders */}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cloud Cover:</span>
                    <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{cloudCoverPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cloudCoverPct}
                    onChange={(e) => { setPowerScenario('CUSTOM'); setCloudCoverPct(parseInt(e.target.value)); }}
                    style={{ width: '100%', accentColor: 'var(--cyan)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ambient Temperature:</span>
                    <strong style={{ color: ambientTempC < 0 ? '#ff3b5c' : 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                      {ambientTempC}°C ({ambientTempC < 0 ? 'Sub-Zero Freeze' : 'Normal'})
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="50"
                    value={ambientTempC}
                    onChange={(e) => { setPowerScenario('CUSTOM'); setAmbientTempC(parseInt(e.target.value)); }}
                    style={{ width: '100%', accentColor: 'var(--amber)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Snow / Dust Panel Loss:</span>
                    <strong style={{ color: '#ffb020', fontFamily: 'var(--font-mono)' }}>{snowDustLossPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={snowDustLossPct}
                    onChange={(e) => { setPowerScenario('CUSTOM'); setSnowDustLossPct(parseInt(e.target.value)); }}
                    style={{ width: '100%', accentColor: '#ffb020' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>PV Panel Tilt Angle:</span>
                    <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{panelTiltDeg}° (Optimal: 35°)</strong>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={panelTiltDeg}
                    onChange={(e) => setPanelTiltDeg(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--green)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. REAL-TIME 24-HOUR DIURNAL CLOCK & CELESTIAL ORBIT ARC */}
          <div className="panel" style={{
            background: 'linear-gradient(180deg, rgba(8, 12, 20, 0.98), rgba(4, 6, 10, 0.98))',
            border: '1px solid var(--border-cyan)'
          }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>☀️</span>
                <span className="label-caps">24-HOUR DIURNAL SOLAR CYCLE & CELESTIAL TRACKING ENGINE</span>
              </div>

              {/* Playback Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SIM SPEED:</span>
                {[
                  { speed: 0, label: '⏸ Pause' },
                  { speed: 1, label: '1x Real' },
                  { speed: 10, label: '10x Fast' },
                  { speed: 60, label: '60x Turbo' }
                ].map(btn => (
                  <button
                    key={btn.speed}
                    onClick={() => { playTacticalAudio('click'); setSimSpeed(btn.speed); }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      border: simSpeed === btn.speed ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      background: simSpeed === btn.speed ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: simSpeed === btn.speed ? 'var(--cyan)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-body" style={{ padding: '16px 20px' }}>
              {/* Graphic Sky & Mountain Horizon Celestial Arc */}
              <div style={{
                height: '130px',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
                background: simHour >= 6 && simHour <= 18
                  ? 'linear-gradient(180deg, #0f2744 0%, #1e3a5f 45%, #2a3d45 85%, #151e28 100%)'
                  : 'linear-gradient(180deg, #030509 0%, #080d16 55%, #0d141e 100%)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                marginBottom: '14px',
                transition: 'background 0.5s ease'
              }}>
                {/* Mountain Ridge Silhouette SVG in Background */}
                <svg viewBox="0 0 1000 130" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '70px', opacity: 0.65 }}>
                  <path d="M 0 130 L 0 85 L 120 40 L 220 75 L 340 25 L 480 80 L 590 35 L 720 70 L 850 30 L 1000 80 L 1000 130 Z" fill="#040608" />
                  <path d="M 0 130 L 0 100 L 180 65 L 310 95 L 450 55 L 610 90 L 780 50 L 920 85 L 1000 70 L 1000 130 Z" fill="#090e17" opacity="0.7" />
                </svg>

                {/* Parabolic Sun Trajectory Arc (06:00 to 18:00) */}
                <svg viewBox="0 0 1000 130" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {/* Daylight Parabolic Flight Path */}
                  <path d="M 150 110 Q 500 -10 850 110" fill="none" stroke="rgba(255, 176, 32, 0.35)" strokeWidth="2" strokeDasharray="5 5" />
                  
                  {/* Horizon ground line */}
                  <line x1="0" y1="110" x2="1000" y2="110" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="1" />

                  {/* Sun or Moon Rendering */}
                  {simHour >= 6 && simHour <= 18 ? (() => {
                    const progress = (simHour - 6) / 12; // 0 to 1
                    const sunX = 150 + progress * 700;
                    const sunY = 110 - Math.sin(progress * Math.PI) * 95;
                    return (
                      <g transform={`translate(${sunX}, ${sunY})`}>
                        <circle r="18" fill="rgba(255, 176, 32, 0.25)" className="sun-glow-anim" />
                        <circle r="11" fill="#ffb020" />
                        <circle r="6" fill="#fff5cc" />
                      </g>
                    );
                  })() : (() => {
                    const nightHour = simHour > 18 ? simHour - 18 : simHour + 6;
                    const progress = nightHour / 12;
                    const moonX = 150 + progress * 700;
                    const moonY = 95 - Math.sin(progress * Math.PI) * 75;
                    return (
                      <g transform={`translate(${moonX}, ${moonY})`}>
                        <circle r="12" fill="rgba(0, 229, 255, 0.2)" />
                        <circle r="8" fill="#e2e8f0" />
                        <circle cx="3" cy="-2" r="7" fill="#080d16" />
                      </g>
                    );
                  })()}
                </svg>

                {/* Real-time Status Badge inside Sky */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.85)',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {String(Math.floor(simHour)).padStart(2, '0')}:{String(Math.floor((simHour % 1) * 60)).padStart(2, '0')}{' '}
                  <span style={{ color: 'var(--cyan)' }}>
                    {simHour >= 6 && simHour <= 18 ? '☀️ DAYLIGHT HARVESTING' : '🌙 NIGHT BATTERY DISCHARGE'}
                  </span>
                </div>

                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.85)',
                  border: '1px solid var(--amber)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--amber)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  SOLAR INSOLATION: {powerAutonomy.instantIrradianceWm2} W/m²
                </div>
              </div>

              {/* Time Scrubber Slider & Quick Jump Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <input
                    type="range"
                    min="0"
                    max="23.9"
                    step="0.1"
                    value={simHour}
                    onChange={(e) => {
                      setSimSpeed(0); // Pause while dragging
                      setSimHour(parseFloat(e.target.value));
                    }}
                    style={{ width: '100%', accentColor: 'var(--cyan)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { h: 6.0, label: '🌅 Dawn (06:00)' },
                    { h: 12.0, label: '☀️ Noon (12:00)' },
                    { h: 18.0, label: '🌇 Dusk (18:00)' },
                    { h: 0.0, label: '🌙 Midnight (00:00)' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => { playTacticalAudio('click'); setSimHour(preset.h); }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. ANIMATED MICRO-GRID MPPT ENERGY FLOW CIRCUIT VISUALIZER */}
          <div className="panel" style={{
            background: 'linear-gradient(135deg, rgba(10, 14, 22, 0.95), rgba(6, 8, 12, 0.98))',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--cyan)' }}>⚡</span>
                <span className="label-caps">ANIMATED MICRO-GRID MPPT ENERGY FLOW CIRCUIT</span>
              </div>
              <span className={`chip ${parseFloat(powerAutonomy.netPowerWatts) >= 0 ? 'chip-green' : 'chip-amber'}`}>
                NET FLOW: {parseFloat(powerAutonomy.netPowerWatts) >= 0 ? `+${powerAutonomy.netPowerWatts}W (CHARGING)` : `${powerAutonomy.netPowerWatts}W (DISCHARGING)`}
              </span>
            </div>

            <div className="panel-body" style={{ padding: '20px' }}>
              {/* 4 Interconnected Circuit Nodes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', position: 'relative' }}>
                
                {/* Node 1: PV Array */}
                <div style={{
                  background: 'rgba(255, 176, 32, 0.05)',
                  border: '1px solid rgba(255, 176, 32, 0.35)',
                  borderRadius: '6px',
                  padding: '14px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                      [1] SOLAR PV ARRAY
                    </span>
                    <span className="chip chip-amber" style={{ fontSize: '9px' }}>{pvWatts}W MONO</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffb020', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.instantPvWatts} <span style={{ fontSize: '14px', fontWeight: 600 }}>WATTS</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.instantPvWatts > 0 ? '18.2V DC • ' + (parseFloat(powerAutonomy.instantPvWatts) / 18.2).toFixed(2) + 'A' : '0.0V DC (NO SUN)'}
                  </div>
                </div>

                {/* Node 2: Victron SmartSolar MPPT */}
                <div style={{
                  background: 'rgba(0, 229, 255, 0.05)',
                  border: '1px solid rgba(0, 229, 255, 0.35)',
                  borderRadius: '6px',
                  padding: '14px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                      [2] VICTRON MPPT 75/15
                    </span>
                    <span className="chip chip-cyan" style={{ fontSize: '9px' }}>98.9% EFF</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                    {powerAutonomy.mpptMode}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px', fontFamily: 'var(--font-mono)' }}>
                    TEMP: 34.2°C • P&O TRACKING
                  </div>
                </div>

                {/* Node 3: LiFePO4 Smart Battery */}
                <div style={{
                  background: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: '6px',
                  padding: '14px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                      [3] 12.8V LiFePO4 PACK
                    </span>
                    <span className="chip chip-green" style={{ fontSize: '9px' }}>{batteryAh}Ah ({powerAutonomy.nominalBatteryWh}Wh)</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
                    {liveBatterySoc}% <span style={{ fontSize: '14px', fontWeight: 600 }}>SoC</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.battV}V • {powerAutonomy.battCurrentAmps >= 0 ? '+' : ''}{powerAutonomy.battCurrentAmps}A
                  </div>
                </div>

                {/* Node 4: Field Station DC Distribution Bus */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  padding: '14px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                      [4] STATION DC LOAD BUS
                    </span>
                    <span className="chip chip-amber" style={{ fontSize: '9px' }}>12V / 5V / 3.3V</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.instantLoadWatts} <span style={{ fontSize: '14px', fontWeight: 600 }}>WATTS</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    POLL: {samplingRateMin} MIN • {(parseFloat(powerAutonomy.instantLoadWatts) / 12.8 * 1000).toFixed(0)} mA DRAW
                  </div>
                </div>
              </div>

              {/* Animated Energy Flow Particles Indicator Bar */}
              <div style={{ marginTop: '16px', height: '10px', borderRadius: '5px', background: '#090d14', position: 'relative', overflow: 'hidden' }}>
                <div
                  className={parseFloat(powerAutonomy.netPowerWatts) >= 0 ? "energy-flow-active" : "energy-flow-reverse"}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: parseFloat(powerAutonomy.netPowerWatts) >= 0
                      ? 'linear-gradient(90deg, #ffb020, #00e5ff, #22c55e)'
                      : 'linear-gradient(90deg, #22c55e, #ffb020, #ff3b5c)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4. AUTONOMOUS AI POWER SHEDDING & MONSOON SURVIVAL DUAL COMPARISON */}
          <div className="panel" style={{
            background: 'linear-gradient(135deg, rgba(16, 24, 38, 0.95), rgba(8, 12, 20, 0.98))',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--green)' }}>🤖</span>
                <span className="label-caps">AUTONOMOUS AI POWER-SHEDDING & ADAPTIVE SURVIVAL ENGINE</span>
              </div>
              <button
                onClick={() => {
                  playTacticalAudio(aiAdaptivePowerShedding ? 'click' : 'alert');
                  setAiAdaptivePowerShedding(!aiAdaptivePowerShedding);
                }}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: aiAdaptivePowerShedding ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: aiAdaptivePowerShedding ? '1px solid #22c55e' : '1px solid var(--border-default)',
                  color: aiAdaptivePowerShedding ? '#22c55e' : 'var(--text-secondary)'
                }}
              >
                {aiAdaptivePowerShedding ? '✓ AI ADAPTIVE SHEDDING: ACTIVE' : '⚠️ FIXED DUTY-CYCLE: DISABLED'}
              </button>
            </div>

            <div className="panel-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
                
                {/* Standard Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    MODE A: STANDARD FIXED POLLING (NO SHEDDING)
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.autonomyDaysStandard} <span style={{ fontSize: '16px', fontWeight: 600 }}>DAYS</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                    System draws continuous <strong>{powerAutonomy.standardTotalDailyWh} Wh/day</strong> at fixed {samplingRateMin}-min sampling with 4G backhaul continuously powered. Under prolonged zero-sun storm blackout, battery exhausts in {powerAutonomy.autonomyDaysStandard} days.
                  </div>
                </div>

                {/* AI Adaptive Card */}
                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid var(--green)',
                  borderRadius: '6px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="chip chip-green" style={{ fontSize: '9px' }}>RECOMMENDED SPEC</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    MODE B: AI ADAPTIVE BMS STORM SURVIVAL
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                    {powerAutonomy.autonomyDaysAdaptive} <span style={{ fontSize: '16px', fontWeight: 600 }}>DAYS</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', lineHeight: 1.4 }}>
                    When battery drops below 35%, AI BMS autonomously scales polling to 15-min, puts 4G into deep sleep, and routes urgent geotechnical alarms via LoRaWAN Class A (11.5 Wh/day).
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ✓ EXTENDS CONTINUOUS SURVIVAL BY +{Math.round(((powerAutonomy.autonomyDaysAdaptive - powerAutonomy.autonomyDaysStandard) / Math.max(0.1, powerAutonomy.autonomyDaysStandard)) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. DYNAMIC LiFePO4 DISCHARGE CURVE & 24H GENERATION AREA CHART */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            
            {/* Left: LiFePO4 Discharge Curve */}
            <div className="panel" style={{ background: 'rgba(6, 9, 14, 0.98)', border: '1px solid var(--border-cyan)' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label-caps">LiFePO4 ELECTROCHEMICAL DISCHARGE CURVE</span>
                <span style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  {powerAutonomy.battV}V • {liveBatterySoc}% SoC
                </span>
              </div>
              <div className="panel-body">
                <div style={{ height: '170px', position: 'relative' }}>
                  <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%' }}>
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="50" x2="380" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="80" x2="380" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="110" x2="380" y2="110" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="140" x2="380" y2="140" stroke="rgba(255,255,255,0.2)" />
                    <line x1="40" y1="10" x2="40" y2="140" stroke="rgba(255,255,255,0.2)" />

                    {/* Y-Axis Labels */}
                    <text x="32" y="24" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">14.4V</text>
                    <text x="32" y="54" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">13.6V</text>
                    <text x="32" y="84" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">13.0V</text>
                    <text x="32" y="114" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">12.0V</text>
                    <text x="32" y="144" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">10.5V</text>

                    {/* Characteristic LiFePO4 Flat Curve: High plateau between 13.3V and 12.8V */}
                    <path
                      d="M 40 140 L 70 125 C 100 115, 140 78, 200 70 C 260 62, 320 54, 350 48 L 380 20"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                    />

                    {/* Active Operating Point Dot */}
                    {(() => {
                      const dotX = 40 + (liveBatterySoc / 100) * 340;
                      const normV = Math.max(10.5, Math.min(14.4, parseFloat(powerAutonomy.battV)));
                      const dotY = 140 - ((normV - 10.5) / 3.9) * 120;
                      return (
                        <g transform={`translate(${dotX}, ${dotY})`}>
                          <circle r="8" fill="rgba(0, 229, 255, 0.3)" className="satellite-wave-ring" />
                          <circle r="5" fill="var(--cyan)" />
                          <circle r="2" fill="#fff" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  <span>0% (CUTOFF 10.5V)</span>
                  <span>FLAT WORKING PLATEAU (13.3V - 12.8V)</span>
                  <span>100% (FLOAT 14.4V)</span>
                </div>
              </div>
            </div>

            {/* Right: 24-Hour Solar Generation vs Load Area Chart */}
            <div className="panel" style={{ background: 'rgba(6, 9, 14, 0.98)', border: '1px solid var(--border-cyan)' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label-caps">24-HOUR GENERATION VS LOAD PROFILE</span>
                <span style={{ fontSize: '11px', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                  DAILY HARVEST: {powerAutonomy.dailySolarHarvestWh} Wh
                </span>
              </div>
              <div className="panel-body">
                <div style={{ height: '170px', position: 'relative' }}>
                  <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%' }}>
                    {/* Grid lines */}
                    <line x1="30" y1="140" x2="390" y2="140" stroke="rgba(255,255,255,0.2)" />
                    <line x1="30" y1="10" x2="30" y2="140" stroke="rgba(255,255,255,0.2)" />

                    {/* Solar Curve Path */}
                    <path
                      d={`M 30 140 ${powerAutonomy.profile24h.map((p, idx) => {
                        const x = 30 + (idx / 23) * 360;
                        const y = 140 - (p.solarGen / Math.max(1, pvWatts)) * 120;
                        return `L ${x} ${y}`;
                      }).join(' ')} L 390 140 Z`}
                      fill="rgba(255, 176, 32, 0.2)"
                      stroke="#ffb020"
                      strokeWidth="2"
                    />

                    {/* Load Line Path */}
                    <path
                      d={`M 30 ${140 - (powerAutonomy.profile24h[0].loadDraw / Math.max(1, pvWatts)) * 120} ${powerAutonomy.profile24h.map((p, idx) => {
                        const x = 30 + (idx / 23) * 360;
                        const y = 140 - (p.loadDraw / Math.max(1, pvWatts)) * 120;
                        return `L ${x} ${y}`;
                      }).join(' ')}`}
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />

                    {/* Moving Laser Needle Line for Current Hour */}
                    {(() => {
                      const needleX = 30 + (simHour / 24) * 360;
                      return (
                        <g>
                          <line x1={needleX} y1="10" x2={needleX} y2="140" stroke="var(--cyan)" strokeWidth="2" />
                          <circle cx={needleX} cy="14" r="3" fill="#fff" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  <span>00:00</span>
                  <span style={{ color: 'var(--amber)' }}>☀️ SOLAR HARVEST (AMBER)</span>
                  <span style={{ color: 'var(--cyan)' }}>-- LOAD DRAW (CYAN)</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. HARDWARE CONFIGURATION CONTROLS */}
          <div className="panel" style={{ background: 'rgba(10, 14, 20, 0.95)', border: '1px solid var(--border-default)' }}>
            <div className="panel-header">
              <span className="label-caps">HARDWARE CONFIGURATION & BATTERY/PV SIZING</span>
            </div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* Sampling Interval */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sensor Sampling & Transmission Interval:</span>
                    <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                      Every {samplingRateMin} {samplingRateMin === 1 ? 'Minute' : 'Minutes'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 5, 15, 60].map(val => (
                      <button
                        key={val}
                        onClick={() => { playTacticalAudio('click'); setSamplingRateMin(val); }}
                        className="btn"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          background: samplingRateMin === val ? 'var(--cyan)' : 'rgba(255,255,255,0.04)',
                          color: samplingRateMin === val ? '#000' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {val === 60 ? '1 Hr' : `${val} Min`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monocrystalline PV Panel */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monocrystalline PV Panel Capacity:</span>
                    <strong style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{pvWatts} Watts</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[20, 30, 50, 100].map(val => (
                      <button
                        key={val}
                        onClick={() => { playTacticalAudio('click'); setPvWatts(val); }}
                        className="btn"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          background: pvWatts === val ? 'var(--amber)' : 'rgba(255,255,255,0.04)',
                          color: pvWatts === val ? '#000' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {val}W Panel
                      </button>
                    ))}
                  </div>
                </div>

                {/* LiFePO4 Smart Battery */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>12.8V LiFePO4 Smart Battery Pack:</span>
                    <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{batteryAh} Ah ({batteryAh * 12.8} Wh)</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[10, 20, 40].map(val => (
                      <button
                        key={val}
                        onClick={() => { playTacticalAudio('click'); setBatteryAh(val); }}
                        className="btn"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          background: batteryAh === val ? 'var(--green)' : 'rgba(255,255,255,0.04)',
                          color: batteryAh === val ? '#000' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {val}Ah ({val * 12.8}Wh)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. LIVE BMS & TELEMETRY STREAM TERMINAL */}
          <div className="panel" style={{ background: '#04070c', border: '1px solid var(--border-subtle)' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-indicator-dot" />
                <span className="label-caps">LIVE HARDWARE BMS & SERIAL TELEMETRY STREAM</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                NMEA-0183 & MODBUS RTU FRAMES • 115200 BAUD
              </span>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px', maxHeight: '110px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <div style={{ color: '#00e5ff', marginBottom: '4px' }}>
                [{String(Math.floor(simHour)).padStart(2, '0')}:{String(Math.floor((simHour % 1) * 60)).padStart(2, '0')}:12] $BMS,SOC={liveBatterySoc}%,VBAT={powerAutonomy.battV}V,IBAT={powerAutonomy.battCurrentAmps}A,MODE={powerAutonomy.mpptMode}*4F
              </div>
              <div style={{ color: '#ffb020', marginBottom: '4px' }}>
                [{String(Math.floor(simHour)).padStart(2, '0')}:{String(Math.floor((simHour % 1) * 60)).padStart(2, '0')}:18] $SOLAR,PV_W={powerAutonomy.instantPvWatts}W,V=18.2V,IRR={powerAutonomy.instantIrradianceWm2}W/m2,PANEL_TILT={panelTiltDeg}DEG*7A
              </div>
              <div style={{ color: '#22c55e' }}>
                [{String(Math.floor(simHour)).padStart(2, '0')}:{String(Math.floor((simHour % 1) * 60)).padStart(2, '0')}:24] $PWR_SYS,LOAD={powerAutonomy.instantLoadWatts}W,AUTONOMY={powerAutonomy.autonomyDays}DAYS,AI_SHEDDING={aiAdaptivePowerShedding ? 'ACTIVE' : 'DISABLED'}*2E
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5th TAB: PROGRESSIVE REAL-TIME GEOTECHNICAL TELEMETRY SUITE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'GRAPHS' && (() => {
        const data = progressiveTelemetryData;
        const lastPt = data[data.length - 1] || data[0];
        const normalEffStress = Math.max(5, 210 - lastPt.porePressure);
        const shearStrength = 12 + normalEffStress * 0.6249;
        const liveFoS = +(shearStrength / 62.0).toFixed(2);
        const foSStatus = liveFoS < 1.05 ? 'CRITICAL (IMMINENT SLIP)' : liveFoS < 1.25 ? 'WARNING (REDUCED MARGIN)' : 'STABLE EQUILIBRIUM';
        const foSColor = liveFoS < 1.05 ? '#ff3b5c' : liveFoS < 1.25 ? '#ffb020' : '#22c55e';
        const saitoCountdownHours = lastPt.inverseVelocity > 0 ? (lastPt.inverseVelocity * 2.2).toFixed(1) : '0.0';

        // Smooth Sigmoid Inclinometer Profile (0m to 25m) with realistic localized shear band at 8.2m
        const inclinometerDepths = [
          { z: 0.0, stratum: 'TOPSOIL (Loose Silt)', desc: 'Ground surface colluvium' },
          { z: 2.0, stratum: 'COLLUVIUM (Debris)', desc: 'Unconsolidated gravelly clay' },
          { z: 4.0, stratum: 'WEATHERED SILTSTONE', desc: 'Moderately weathered matrix' },
          { z: 6.0, stratum: 'SATURATED CLAY LENS', desc: 'Pre-failure softening band' },
          { z: 7.5, stratum: 'UPPER SLIP BOUNDARY', desc: 'Developing shear micro-bands' },
          { z: 8.2, stratum: 'CRITICAL SHEAR PLANE ⚠️', desc: 'Active basal slickenside slip surface' },
          { z: 9.0, stratum: 'LOWER SLIP CONTACT', desc: 'Transition to fractured zone' },
          { z: 12.0, stratum: 'FRACTURED QUARTZITE', desc: 'Jointed rock block mass' },
          { z: 16.0, stratum: 'INTACT BEDROCK', desc: 'Competent gneiss anchor' },
          { z: 20.0, stratum: 'BEDROCK ANCHOR', desc: 'Stable fixed benchmark datum' },
          { z: 25.0, stratum: 'DEEP FIXED DATUM', desc: 'Zero displacement reference' },
        ].map(item => {
          const sigmoidDeflection = (dMax) => +(dMax / (1 + Math.exp((item.z - 8.2) / 0.72))).toFixed(2);
          const liveDeflection = sigmoidDeflection(lastPt.displacementMm);
          const h24Deflection = sigmoidDeflection(4.8);
          const expTerm = Math.exp((item.z - 8.2) / 0.72);
          const liveStrain = +((lastPt.displacementMm * expTerm) / (0.72 * Math.pow(1 + expTerm, 2))).toFixed(2);
          const h24Strain = +((4.8 * expTerm) / (0.72 * Math.pow(1 + expTerm, 2))).toFixed(2);
          return {
            ...item,
            base: 0.0,
            h24: h24Deflection,
            live: liveDeflection,
            liveStrain,
            h24Strain
          };
        });

        // Interactive mouse tracking handler for time-series charts (Graphs 1, 2, 4, 5, 6)
        const handleChartMouseMove = (e, graphId) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const svgX = (mouseX / rect.width) * 520;
          const clampedX = Math.max(45, Math.min(480, svgX));
          const fraction = (clampedX - 45) / 435;
          const index = Math.min(data.length - 1, Math.max(0, Math.round(fraction * (data.length - 1))));
          setHoveredGraphPoint({
            graphId,
            index,
            svgX: clampedX,
            chartPercent: ((clampedX - 45) / 435) * 100,
            data: data[index]
          });
        };

        // Interactive depth tracking handler for Inclinometer profile (Graph 3)
        const handleInclinometerMouseMove = (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseY = e.clientY - rect.top;
          const svgY = (mouseY / rect.height) * 220;
          const clampedY = Math.max(25, Math.min(190, svgY));
          const fraction = (clampedY - 25) / 165;
          const depthZ = +(fraction * 25).toFixed(1);
          let closestNode = inclinometerDepths[0];
          let minDist = 999;
          inclinometerDepths.forEach(node => {
            const dist = Math.abs(node.z - depthZ);
            if (dist < minDist) {
              minDist = dist;
              closestNode = node;
            }
          });
          setHoveredGraphPoint({
            graphId: 'GRAPH_3',
            depthZ,
            svgY: clampedY,
            chartPercent: fraction * 100,
            node: closestNode
          });
        };

        const toggleChannel = (channelKey) => {
          playTacticalAudio('click');
          setVisibleGraphChannels(prev => ({ ...prev, [channelKey]: !prev[channelKey] }));
        };

        // Rupture asymptote calculation for Saito inverse velocity
        const lastIdx = data.length - 1;
        const pA = data[Math.max(0, lastIdx - 3)];
        const pB = data[lastIdx];
        const deltaX = 3 * (435 / (data.length - 1));
        const deltaInvV = pB.inverseVelocity - pA.inverseVelocity;
        const dropRate = deltaInvV < 0 ? Math.abs(deltaInvV) / deltaX : 0.04;
        const pixelsToZero = Math.min(110, Math.max(18, pB.inverseVelocity / Math.max(0.005, dropRate)));
        const failTargetX = Math.min(515, 480 + pixelsToZero);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Real-time Telemetry Station Header & Global Controls */}
            <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(6, 12, 20, 0.96), rgba(12, 22, 34, 0.96))', border: '1px solid var(--border-cyan)' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: graphStreamingActive ? '#22c55e' : '#ffb020',
                    boxShadow: graphStreamingActive ? '0 0 12px #22c55e' : '0 0 8px #ffb020',
                    animation: graphStreamingActive ? 'livePointPulse 1.5s infinite' : 'none'
                  }} />
                  <span className="label-caps" style={{ color: 'var(--cyan)' }}>
                    PROGRESSIVE GEOTECHNICAL TELEMETRY ENGINE • LEWS SPECIFICATION ISO 18674
                  </span>
                  <span className="chip chip-cyan" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    {graphStreamingActive ? '● STREAMING ACTIVE (1.5s)' : '⏸ STREAM PAUSED'}
                  </span>
                  {graphCriticalPulse && (
                    <span className="chip chip-red alert-critical-pulse" style={{ fontSize: '10px', fontWeight: 800 }}>
                      ⚡ CRITICAL SEEPAGE SURGE INJECTED
                    </span>
                  )}
                </div>

                {/* Right Header Actions: Window selector & Stream triggers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Station Selector */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                    {[
                      { id: 'STATION_A', label: '🏔️ STA-A (Crest Scarp)' },
                      { id: 'STATION_B', label: '🌊 STA-B (Debris Ravine)' },
                      { id: 'STATION_C', label: '🕳️ STA-C (Borehole BH-04)' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => { playTacticalAudio('click'); setActiveGraphStation(st.id); }}
                        style={{
                          background: activeGraphStation === st.id ? 'var(--cyan)' : 'transparent',
                          color: activeGraphStation === st.id ? '#000' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Time Window Pills */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                    {['LIVE', '1H', '24H', '7D', 'SEASON'].map(win => (
                      <button
                        key={win}
                        onClick={() => { playTacticalAudio('click'); setGraphTimeWindow(win); }}
                        style={{
                          background: graphTimeWindow === win ? 'rgba(0, 229, 255, 0.25)' : 'transparent',
                          color: graphTimeWindow === win ? 'var(--cyan)' : 'var(--text-muted)',
                          border: graphTimeWindow === win ? '1px solid var(--cyan)' : 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer'
                        }}
                      >
                        {win}
                      </button>
                    ))}
                  </div>

                  {/* Pause / Resume Button */}
                  <button
                    className="btn"
                    onClick={() => { playTacticalAudio('click'); setGraphStreamingActive(!graphStreamingActive); }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-default)',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {graphStreamingActive ? '⏸ Pause Stream' : '▶ Resume Stream'}
                  </button>

                  {/* Pulse Injection Trigger */}
                  <button
                    className="btn"
                    onClick={() => {
                      playTacticalAudio('alarm');
                      setGraphCriticalPulse(true);
                      setTimeout(() => setGraphCriticalPulse(false), 5000);
                    }}
                    style={{
                      background: graphCriticalPulse ? 'rgba(255, 59, 92, 0.3)' : 'rgba(255, 176, 32, 0.15)',
                      border: graphCriticalPulse ? '1px solid var(--red)' : '1px solid var(--amber)',
                      color: graphCriticalPulse ? 'var(--red)' : 'var(--amber)',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    ⚡ Trigger Seepage Pulse
                  </button>

                  {/* CSV Export Button */}
                  <button
                    className="btn btn-primary"
                    onClick={handleDownloadTelemetryCsv}
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Real-time Physical KPI Summary Strip */}
              <div className="panel-body" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {/* Card 1: Factor of Safety */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${foSColor}`, borderRadius: '6px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MOHR-COULOMB FoS</span>
                      <span style={{ fontSize: '9px', color: foSColor, fontWeight: 700 }}>{foSStatus}</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: foSColor, fontFamily: 'var(--font-mono)' }}>
                      {liveFoS}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Rupture Criterion: FoS &lt; 1.00 (Critical equilibrium)
                    </div>
                  </div>

                  {/* Card 2: Saito Inverse Velocity Forecast */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 176, 32, 0.4)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SAITO 1/v FORECAST</span>
                      <span className="chip chip-amber" style={{ fontSize: '8px' }}>TERTIARY CREEP</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                      ~{saitoCountdownHours} hrs
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Inverse velocity 1/v = {lastPt.inverseVelocity} d/mm (Approaching 0)
                    </div>
                  </div>

                  {/* Card 3: Pore Pressure & Effective Stress */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PORE-WATER PRESSURE (u)</span>
                      <span style={{ fontSize: '9px', color: lastPt.porePressure > 135 ? 'var(--red)' : 'var(--cyan)' }}>
                        {lastPt.porePressure > 135 ? 'HIGH SEEPAGE (CRITICAL)' : 'ELEVATED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                      {lastPt.porePressure} <span style={{ fontSize: '14px', fontWeight: 500 }}>kPa</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Effective Stress σ': {lastPt.effectiveStress} kPa (Drop of {(142.8 - lastPt.effectiveStress).toFixed(1)} kPa)
                    </div>
                  </div>

                  {/* Card 4: Cumulative Rainfall & Burst Intensity */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MONSOON RAIN ACCUMULATION</span>
                      <span className="chip chip-blue" style={{ fontSize: '8px' }}>CAINE THRESHOLD EXCEEDED</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                      {lastPt.cumulativeRain} <span style={{ fontSize: '14px', fontWeight: 500 }}>mm</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Burst Rate: {lastPt.rainfallRate} mm/hr (Torrential infiltration)
                    </div>
                  </div>

                  {/* Card 5: Acoustic Fracturing & Seismics */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(217, 70, 239, 0.4)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MICRO-SEISMIC AE BURSTS</span>
                      <span style={{ fontSize: '9px', color: '#d946ef' }}>PAC 150kHz SENSOR</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#d946ef', fontFamily: 'var(--font-mono)' }}>
                      {lastPt.aeHits} <span style={{ fontSize: '14px', fontWeight: 500 }}>hits/min</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      PPV: {lastPt.ppvVelocity} mm/s (DIN 4150 limit: 20 mm/s)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 PROGRESSIVE REAL-TIME GEOTECHNICAL GRAPHS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>

              {/* ───────────────────────────────────────────────────────── */}
              {/* GRAPH 1: PORE PRESSURE (u) VS. EFFECTIVE STRESS (σ')     */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="panel graph-card-interactive" style={{ background: '#070b12', border: '1px solid rgba(0, 229, 255, 0.25)', position: 'relative' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--cyan)' }}>💧</span>
                    <span className="label-caps">1. PORE-WATER PRESSURE (u) VS. EFFECTIVE STRESS (σ')</span>
                  </div>
                  {/* Channel toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => toggleChannel('pore')}
                      style={{
                        background: visibleGraphChannels.pore ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                        border: visibleGraphChannels.pore ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.1)',
                        color: visibleGraphChannels.pore ? 'var(--cyan)' : 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      💧 Pore (u)
                    </button>
                    <button
                      onClick={() => toggleChannel('stress')}
                      style={{
                        background: visibleGraphChannels.stress ? 'rgba(255, 176, 32, 0.2)' : 'transparent',
                        border: visibleGraphChannels.stress ? '1px solid var(--amber)' : '1px solid rgba(255,255,255,0.1)',
                        color: visibleGraphChannels.stress ? 'var(--amber)' : 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🧱 Stress (σ')
                    </button>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      σ' = 210 - u
                    </span>
                  </div>
                </div>

                <div className="panel-body" style={{ position: 'relative' }}>
                  {/* Floating HUD Tooltip */}
                  {hoveredGraphPoint?.graphId === 'GRAPH_1' && hoveredGraphPoint.data && (
                    <div
                      className="graph-tooltip-box"
                      style={{
                        left: `${Math.min(75, Math.max(15, hoveredGraphPoint.chartPercent))}%`,
                        top: '15px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️ T = {hoveredGraphPoint.data.time}</span>
                        <span style={{ color: hoveredGraphPoint.data.porePressure > 135 ? '#ff3b5c' : '#22c55e', fontSize: '9px' }}>
                          {hoveredGraphPoint.data.porePressure > 135 ? '⚠️ LIQUEFACTION CRITICAL' : '✓ STABLE DRAINAGE'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                        <div>Pore Pressure (u): <strong style={{ color: '#00e5ff' }}>{hoveredGraphPoint.data.porePressure} kPa</strong></div>
                        <div>Effective Stress (σ'): <strong style={{ color: '#ffb020' }}>{hoveredGraphPoint.data.effectiveStress} kPa</strong></div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Margin to Failure: {(hoveredGraphPoint.data.effectiveStress - 50).toFixed(1)} kPa above liquefaction limit
                      </div>
                    </div>
                  )}

                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg
                      viewBox="0 0 520 220"
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseMove={(e) => handleChartMouseMove(e, 'GRAPH_1')}
                      onMouseLeave={() => setHoveredGraphPoint(null)}
                    >
                      <defs>
                        <linearGradient id="poreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff3b5c" stopOpacity="0.4" />
                          <stop offset="60%" stopColor="#00e5ff" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.03" />
                        </linearGradient>
                      </defs>

                      {/* Liquefaction Hazard Zone Shading (u > 135 kPa: y from 30 to 117.3) */}
                      <rect x="45" y="30" width="435" height="87.3" fill="rgba(255, 59, 92, 0.08)" className="hazard-zone-active" />

                      {/* Grid Lines */}
                      {[30, 70, 110, 150, 190].map(y => (
                        <line key={y} x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      ))}
                      <line x1="45" y1="20" x2="45" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="480" y1="20" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="45" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />

                      {/* Y-Axis Labels Left (Pore Pressure kPa: 110 to 165, span 55) */}
                      <text x="40" y="34" textAnchor="end" fill="var(--cyan)" fontSize="9" fontFamily="monospace">165</text>
                      <text x="40" y="74" textAnchor="end" fill="var(--cyan)" fontSize="9" fontFamily="monospace">150</text>
                      <text x="40" y="114" textAnchor="end" fill="var(--cyan)" fontSize="9" fontFamily="monospace">136</text>
                      <text x="40" y="154" textAnchor="end" fill="var(--cyan)" fontSize="9" fontFamily="monospace">122</text>
                      <text x="40" y="193" textAnchor="end" fill="var(--cyan)" fontSize="9" fontFamily="monospace">110</text>

                      {/* Y-Axis Labels Right (Effective Stress kPa: 50 to 105, span 55) */}
                      <text x="486" y="34" fill="var(--amber)" fontSize="9" fontFamily="monospace">50</text>
                      <text x="486" y="74" fill="var(--amber)" fontSize="9" fontFamily="monospace">65</text>
                      <text x="486" y="114" fill="var(--amber)" fontSize="9" fontFamily="monospace">79</text>
                      <text x="486" y="154" fill="var(--amber)" fontSize="9" fontFamily="monospace">93</text>
                      <text x="486" y="193" fill="var(--amber)" fontSize="9" fontFamily="monospace">105</text>

                      {/* Critical Liquefaction Threshold Line (135 kPa -> y ≈ 117.3) */}
                      <line x1="45" y1="117.3" x2="480" y2="117.3" stroke="#ff3b5c" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x="475" y="112" textAnchor="end" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        CRITICAL LIQUEFACTION LIMIT: 135 kPa
                      </text>

                      {/* Area Fill for Pore Pressure */}
                      {visibleGraphChannels.pore && (
                        <path
                          d={`M 45 190 ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.porePressure - 110) / 55) * 160;
                            return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')} L 480 190 Z`}
                          fill="url(#poreGrad)"
                        />
                      )}

                      {/* Pore Pressure Line */}
                      {visibleGraphChannels.pore && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.porePressure - 110) / 55) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#00e5ff"
                          strokeWidth="2.5"
                        />
                      )}

                      {/* Effective Stress Line */}
                      {visibleGraphChannels.stress && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.effectiveStress - 50) / 55) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#ffb020"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                      )}

                      {/* Pulsing Live Points */}
                      {visibleGraphChannels.pore && (() => {
                        const lastX = 480;
                        const lastY = 190 - ((lastPt.porePressure - 110) / 55) * 160;
                        return (
                          <g transform={`translate(${lastX}, ${lastY})`}>
                            <circle r="9" fill="rgba(0, 229, 255, 0.4)" className="live-point-pulse" />
                            <circle r="4.5" fill="#00e5ff" />
                            <circle r="2" fill="#fff" />
                          </g>
                        );
                      })()}

                      {/* Interactive Crosshair when hovered */}
                      {hoveredGraphPoint?.graphId === 'GRAPH_1' && (
                        <g>
                          <line x1={hoveredGraphPoint.svgX} y1="20" x2={hoveredGraphPoint.svgX} y2="190" className="graph-crosshair-line" />
                          {visibleGraphChannels.pore && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.porePressure - 110) / 55) * 160}
                              r="5"
                              fill="#00e5ff"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                          {visibleGraphChannels.stress && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.effectiveStress - 50) / 55) * 160}
                              r="5"
                              fill="#ffb020"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ color: 'var(--cyan)' }}>● Pore Pressure (u): <strong>{lastPt.porePressure} kPa</strong></span>
                      <span style={{ color: 'var(--amber)' }}>-- Effective Stress (σ'): <strong>{lastPt.effectiveStress} kPa</strong></span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      Buffer: {data[0].time} → {lastPt.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* GRAPH 2: 3D DISPLACEMENT & SAITO INVERSE VELOCITY (1/v)   */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="panel graph-card-interactive" style={{ background: '#070b12', border: '1px solid rgba(255, 176, 32, 0.25)', position: 'relative' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--amber)' }}>📐</span>
                    <span className="label-caps">2. 3D DISPLACEMENT & SAITO INVERSE VELOCITY (1/v → 0)</span>
                  </div>
                  {/* Mode and channel toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        playTacticalAudio('click');
                        setSaitoScaleMode(saitoScaleMode === 'INVERSE' ? 'VELOCITY' : 'INVERSE');
                      }}
                      style={{
                        background: 'rgba(255, 176, 32, 0.15)',
                        border: '1px solid var(--amber)',
                        color: 'var(--amber)',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {saitoScaleMode === 'INVERSE' ? 'MODE: 1/v (d/mm)' : 'MODE: Velocity (mm/h)'}
                    </button>
                    <button
                      onClick={() => toggleChannel('disp')}
                      style={{
                        background: visibleGraphChannels.disp ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        border: visibleGraphChannels.disp ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                        color: visibleGraphChannels.disp ? '#22c55e' : 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📐 Disp
                    </button>
                    <span style={{ fontSize: '10px', color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      COLLAPSE: ~{saitoCountdownHours}h
                    </span>
                  </div>
                </div>

                <div className="panel-body" style={{ position: 'relative' }}>
                  {/* Floating HUD Tooltip */}
                  {hoveredGraphPoint?.graphId === 'GRAPH_2' && hoveredGraphPoint.data && (
                    <div
                      className="graph-tooltip-box"
                      style={{
                        left: `${Math.min(75, Math.max(15, hoveredGraphPoint.chartPercent))}%`,
                        top: '15px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div style={{ color: 'var(--amber)', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️ T = {hoveredGraphPoint.data.time}</span>
                        <span className="chip chip-amber" style={{ fontSize: '8px' }}>
                          Tertiary Creep Acceleration
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                        <div>Cumulative Disp: <strong style={{ color: '#22c55e' }}>{hoveredGraphPoint.data.displacementMm} mm</strong></div>
                        <div>Saito 1/v: <strong style={{ color: '#ff9e3b' }}>{hoveredGraphPoint.data.inverseVelocity} d/mm</strong></div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Creep Velocity: <strong>{(1 / Math.max(0.01, hoveredGraphPoint.data.inverseVelocity)).toFixed(2)} mm/h</strong></span>
                        <span style={{ color: '#ff3b5c' }}>Projected Rupture: <strong>~{(hoveredGraphPoint.data.inverseVelocity * 2.2).toFixed(1)} hrs</strong></span>
                      </div>
                    </div>
                  )}

                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg
                      viewBox="0 0 520 220"
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseMove={(e) => handleChartMouseMove(e, 'GRAPH_2')}
                      onMouseLeave={() => setHoveredGraphPoint(null)}
                    >
                      {/* Grid Lines */}
                      {[30, 70, 110, 150, 190].map(y => (
                        <line key={y} x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      ))}
                      <line x1="45" y1="20" x2="45" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="480" y1="20" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="45" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />

                      {/* Y-Axis Labels Left (Cumulative Disp mm: 10 to 20 mm, span 10) */}
                      <text x="40" y="34" textAnchor="end" fill="#22c55e" fontSize="9" fontFamily="monospace">20mm</text>
                      <text x="40" y="74" textAnchor="end" fill="#22c55e" fontSize="9" fontFamily="monospace">17.5</text>
                      <text x="40" y="114" textAnchor="end" fill="#22c55e" fontSize="9" fontFamily="monospace">15.0</text>
                      <text x="40" y="154" textAnchor="end" fill="#22c55e" fontSize="9" fontFamily="monospace">12.5</text>
                      <text x="40" y="193" textAnchor="end" fill="#22c55e" fontSize="9" fontFamily="monospace">10mm</text>

                      {/* Y-Axis Labels Right */}
                      {saitoScaleMode === 'INVERSE' ? (
                        <>
                          <text x="486" y="34" fill="#ff9e3b" fontSize="9" fontFamily="monospace">7.0</text>
                          <text x="486" y="74" fill="#ff9e3b" fontSize="9" fontFamily="monospace">5.2</text>
                          <text x="486" y="114" fill="#ff9e3b" fontSize="9" fontFamily="monospace">3.5</text>
                          <text x="486" y="154" fill="#ff9e3b" fontSize="9" fontFamily="monospace">1.8</text>
                          <text x="486" y="193" fill="#ff3b5c" fontSize="9" fontFamily="monospace">0.0 (FAIL)</text>
                        </>
                      ) : (
                        <>
                          <text x="486" y="34" fill="#ff9e3b" fontSize="9" fontFamily="monospace">3.0 mm/h</text>
                          <text x="486" y="74" fill="#ff9e3b" fontSize="9" fontFamily="monospace">2.25</text>
                          <text x="486" y="114" fill="#ff9e3b" fontSize="9" fontFamily="monospace">1.50</text>
                          <text x="486" y="154" fill="#ff9e3b" fontSize="9" fontFamily="monospace">0.75</text>
                          <text x="486" y="193" fill="#ff3b5c" fontSize="9" fontFamily="monospace">0.00</text>
                        </>
                      )}

                      {/* Saito Zero Intercept Rupture Datum Line */}
                      <line x1="45" y1="190" x2="480" y2="190" stroke="#ff3b5c" strokeWidth="2.5" />
                      <text x="350" y="185" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        SAITO FAILURE DATUM (1/v = 0)
                      </text>

                      {/* Cumulative Displacement Curve (Green) */}
                      {visibleGraphChannels.disp && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.displacementMm - 10) / 10) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2.8"
                        />
                      )}

                      {/* Saito Curve (Orange) */}
                      {visibleGraphChannels.saito && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const yVal = saitoScaleMode === 'INVERSE'
                              ? 190 - (Math.max(0, d.inverseVelocity) / 7) * 160
                              : 190 - (Math.min(3.0, 1 / Math.max(0.01, d.inverseVelocity)) / 3.0) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${yVal.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#ff9e3b"
                          strokeWidth="2.8"
                        />
                      )}

                      {/* Saito Linear Rupture Projection Ray towards 1/v = 0 */}
                      {saitoScaleMode === 'INVERSE' && (() => {
                        const lastX = 480;
                        const lastY = 190 - (Math.max(0, lastPt.inverseVelocity) / 7) * 160;
                        return (
                          <g>
                            <line x1={lastX} y1={lastY} x2={failTargetX} y2="190" stroke="#ff3b5c" strokeWidth="2" strokeDasharray="4 2" />
                            <circle cx={failTargetX} cy="190" r="7" fill="rgba(255, 59, 92, 0.4)" className="live-point-pulse" />
                            <circle cx={failTargetX} cy="190" r="3.5" fill="#ff3b5c" />
                            <polygon points={`${failTargetX},184 ${failTargetX+4},190 ${failTargetX},196 ${failTargetX-4},190`} fill="#ff3b5c" />
                            <text x={Math.min(490, failTargetX - 6)} y="178" textAnchor="end" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                              🎯 RUPTURE INTERCEPT
                            </text>
                          </g>
                        );
                      })()}

                      {/* Live Dot on Saito Curve */}
                      {visibleGraphChannels.saito && (() => {
                        const lastX = 480;
                        const lastY = saitoScaleMode === 'INVERSE'
                          ? 190 - (Math.max(0, lastPt.inverseVelocity) / 7) * 160
                          : 190 - (Math.min(3.0, 1 / Math.max(0.01, lastPt.inverseVelocity)) / 3.0) * 160;
                        return (
                          <g transform={`translate(${lastX}, ${lastY})`}>
                            <circle r="8" fill="rgba(255, 158, 59, 0.4)" className="live-point-pulse" />
                            <circle r="4" fill="#ff9e3b" />
                            <circle r="1.5" fill="#fff" />
                          </g>
                        );
                      })()}

                      {/* Interactive Crosshair when hovered */}
                      {hoveredGraphPoint?.graphId === 'GRAPH_2' && (
                        <g>
                          <line x1={hoveredGraphPoint.svgX} y1="20" x2={hoveredGraphPoint.svgX} y2="190" className="graph-crosshair-line" />
                          {visibleGraphChannels.disp && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.displacementMm - 10) / 10) * 160}
                              r="5"
                              fill="#22c55e"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                          {visibleGraphChannels.saito && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={saitoScaleMode === 'INVERSE'
                                ? 190 - (Math.max(0, hoveredGraphPoint.data.inverseVelocity) / 7) * 160
                                : 190 - (Math.min(3.0, 1 / Math.max(0.01, hoveredGraphPoint.data.inverseVelocity)) / 3.0) * 160
                              }
                              r="5"
                              fill="#ff9e3b"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ color: '#22c55e' }}>● Cumulative Disp: <strong>{lastPt.displacementMm} mm</strong></span>
                      <span style={{ color: '#ff9e3b' }}>● Saito 1/v: <strong>{lastPt.inverseVelocity} d/mm</strong></span>
                    </div>
                    <span className="chip chip-amber" style={{ fontSize: '9px' }}>
                      J. Saito Creep Law: d(1/v)/dt &lt; 0 (Accelerating Tertiary)
                    </span>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* GRAPH 3: BOREHOLE INCLINOMETER DEPTH DEFLECTION PROFILE   */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="panel graph-card-interactive" style={{ background: '#070b12', border: '1px solid rgba(34, 197, 94, 0.25)', position: 'relative' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#22c55e' }}>🕳️</span>
                    <span className="label-caps">3. BOREHOLE INCLINOMETER PROFILE VS. DEPTH (0m - 25m)</span>
                  </div>
                  {/* Mode Switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        playTacticalAudio('click');
                        setInclinometerMode(inclinometerMode === 'CUMULATIVE' ? 'STRAIN_RATE' : 'CUMULATIVE');
                      }}
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {inclinometerMode === 'CUMULATIVE' ? 'SHOW INCREMENTAL STRAIN (%/m)' : 'SHOW CUMULATIVE DEFLECTION (mm)'}
                    </button>
                    <span style={{ fontSize: '10px', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ⚠️ SHEAR HORIZON: 8.2m
                    </span>
                  </div>
                </div>

                <div className="panel-body" style={{ position: 'relative' }}>
                  {/* Floating HUD Tooltip */}
                  {hoveredGraphPoint?.graphId === 'GRAPH_3' && (
                    <div
                      className="graph-tooltip-box"
                      style={{
                        right: '25px',
                        top: `${Math.min(75, Math.max(15, hoveredGraphPoint.chartPercent))}%`,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🕳️ Depth: {hoveredGraphPoint.depthZ}m</span>
                        <span style={{ color: hoveredGraphPoint.depthZ >= 7.5 && hoveredGraphPoint.depthZ <= 9.0 ? '#ff3b5c' : '#22c55e', fontSize: '9px' }}>
                          {hoveredGraphPoint.depthZ >= 7.5 && hoveredGraphPoint.depthZ <= 9.0 ? '⚠️ SHEAR FAILURE HORIZON' : '✓ COMPETENT STRATUM'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Stratum: <strong style={{ color: '#fff' }}>{hoveredGraphPoint.node?.stratum}</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', marginTop: '2px' }}>
                        <div>Live Deflection: <strong style={{ color: '#22c55e' }}>{hoveredGraphPoint.node?.live} mm</strong></div>
                        <div>Shear Strain: <strong style={{ color: '#ff3b5c' }}>{hoveredGraphPoint.node?.liveStrain} %/m</strong></div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {hoveredGraphPoint.node?.desc}
                      </div>
                    </div>
                  )}

                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg
                      viewBox="0 0 520 220"
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseMove={handleInclinometerMouseMove}
                      onMouseLeave={() => setHoveredGraphPoint(null)}
                    >
                      <defs>
                        <linearGradient id="strainGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ffb020" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#ff3b5c" stopOpacity="0.4" />
                        </linearGradient>
                      </defs>

                      {/* Stratigraphy Shading Bands */}
                      {/* Topsoil & Colluvium: 0 - 4m -> y: 25 to 51.4 */}
                      <rect x="75" y="25" width="415" height="26.4" fill="rgba(180, 120, 60, 0.12)" />
                      {/* Weathered Siltstone: 4 - 7.5m -> y: 51.4 to 74.5 */}
                      <rect x="75" y="51.4" width="415" height="23.1" fill="rgba(210, 160, 60, 0.14)" />
                      {/* Critical Shear Zone Highlight: 7.5 - 9.0m -> y: 74.5 to 84.4 */}
                      <rect x="75" y="74.5" width="415" height="9.9" fill="rgba(255, 59, 92, 0.35)" className="hazard-zone-active" />
                      {/* Fractured Quartzite: 9.0 - 14m -> y: 84.4 to 117.4 */}
                      <rect x="75" y="84.4" width="415" height="33.0" fill="rgba(100, 120, 160, 0.12)" />
                      {/* Bedrock Anchor Datum: 14 - 25m -> y: 117.4 to 190 */}
                      <rect x="75" y="117.4" width="415" height="72.6" fill="rgba(60, 100, 160, 0.14)" />

                      {/* Depth Grid Lines */}
                      {[0, 5, 8.2, 12, 16, 20, 25].map(z => {
                        const y = 25 + (z / 25) * 165;
                        return (
                          <g key={z}>
                            <line x1="75" y1={y} x2="490" y2={y} stroke={z === 8.2 ? 'rgba(255, 59, 92, 0.7)' : 'rgba(255,255,255,0.06)'} strokeDasharray={z === 8.2 ? 'none' : '3 3'} />
                            <text x="70" y={y + 3} textAnchor="end" fill={z === 8.2 ? '#ff3b5c' : 'var(--text-muted)'} fontSize="9" fontFamily="monospace">
                              {z}m
                            </text>
                          </g>
                        );
                      })}

                      {/* Vertical Datum Line (0mm or 0% -> x = 115) */}
                      <line x1="115" y1="25" x2="115" y2="190" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                      <line x1="205" y1="25" x2="205" y2="190" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                      <line x1="295" y1="25" x2="295" y2="190" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                      <line x1="385" y1="25" x2="385" y2="190" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                      <line x1="475" y1="25" x2="475" y2="190" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />

                      {/* X-Axis Labels */}
                      {inclinometerMode === 'CUMULATIVE' ? (
                        <>
                          <text x="115" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">0mm</text>
                          <text x="205" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">5mm</text>
                          <text x="295" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">10mm</text>
                          <text x="385" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">15mm</text>
                          <text x="475" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">20mm</text>
                        </>
                      ) : (
                        <>
                          <text x="115" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">0%/m</text>
                          <text x="205" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">1.5%</text>
                          <text x="295" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">3.0%</text>
                          <text x="385" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">4.5%</text>
                          <text x="475" y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">6.0%/m</text>
                        </>
                      )}

                      {/* Shear Plane Tag */}
                      <text x="485" y="72" textAnchor="end" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        ◀ BASAL SLICKENSIDE @ 8.2m
                      </text>

                      {inclinometerMode === 'CUMULATIVE' ? (
                        <>
                          {/* Baseline Profile (T0: 0mm all depths) */}
                          <line x1="115" y1="25" x2="115" y2="190" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

                          {/* 24-Hour Ago Profile (Cyan) */}
                          <path
                            d={`M ${inclinometerDepths.map((p, i) => {
                              const y = 25 + (p.z / 25) * 165;
                              const x = 115 + (p.h24 / 20) * 360;
                              return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="#00e5ff"
                            strokeWidth="1.8"
                            strokeDasharray="2 1"
                          />

                          {/* Live Profile (Green smooth sigmoid) */}
                          <path
                            d={`M ${inclinometerDepths.map((p, i) => {
                              const y = 25 + (p.z / 25) * 165;
                              const x = 115 + (p.live / 20) * 360;
                              return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.8"
                          />

                          {/* Live Nodes on the Profile */}
                          {inclinometerDepths.map((p, i) => {
                            const y = 25 + (p.z / 25) * 165;
                            const x = 115 + (p.live / 20) * 360;
                            const isShear = p.z === 8.2;
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={isShear ? 6 : 3}
                                fill={isShear ? '#ff3b5c' : '#22c55e'}
                                className={isShear ? 'live-point-pulse' : ''}
                              />
                            );
                          })}
                        </>
                      ) : (
                        <>
                          {/* Incremental Shear Strain Profile (Bell Curve localized at 8.2m) */}
                          <path
                            d={`M 115 190 ${inclinometerDepths.map(p => {
                              const y = 25 + (p.z / 25) * 165;
                              const x = 115 + (p.liveStrain / 6.0) * 360;
                              return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')} L 115 25 Z`}
                            fill="url(#strainGrad)"
                          />
                          <path
                            d={`M ${inclinometerDepths.map((p, i) => {
                              const y = 25 + (p.z / 25) * 165;
                              const x = 115 + (p.liveStrain / 6.0) * 360;
                              return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="#ff3b5c"
                            strokeWidth="2.8"
                          />
                          {inclinometerDepths.map((p, i) => {
                            const y = 25 + (p.z / 25) * 165;
                            const x = 115 + (p.liveStrain / 6.0) * 360;
                            const isPeak = p.z === 8.2;
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={isPeak ? 6 : 3}
                                fill={isPeak ? '#ff3b5c' : '#ffb020'}
                                className={isPeak ? 'live-point-pulse' : ''}
                              />
                            );
                          })}
                        </>
                      )}

                      {/* Interactive Guideline when hovered */}
                      {hoveredGraphPoint?.graphId === 'GRAPH_3' && (
                        <g>
                          <line x1="75" y1={hoveredGraphPoint.svgY} x2="490" y2={hoveredGraphPoint.svgY} stroke="#22c55e" strokeWidth="1" strokeDasharray="3 2" />
                          <circle cx="115" cy={hoveredGraphPoint.svgY} r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
                        </g>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ color: '#22c55e' }}>● Surface Deflection: <strong>{lastPt.displacementMm} mm</strong></span>
                      <span style={{ color: '#ff3b5c' }}>● Shear Strain Peak (8.2m): <strong>4.92 %/m</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>- - Datum Anchor (25m): <strong>0.0 mm</strong></span>
                    </div>
                    <span style={{ color: 'var(--cyan)', fontSize: '10px' }}>
                      IPI Transducers: 12-Node Smart MEMS String
                    </span>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* GRAPH 4: PRECIPITATION HYETOGRAPH & CAINE I-D THRESHOLD   */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="panel graph-card-interactive" style={{ background: '#070b12', border: '1px solid rgba(96, 165, 250, 0.25)', position: 'relative' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#60a5fa' }}>🌧️</span>
                    <span className="label-caps">4. PRECIPITATION HYETOGRAPH & CAINE I-D COLLAPSE CRITERION</span>
                  </div>
                  {/* Mode switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        playTacticalAudio('click');
                        const modes = ['BOTH', 'RATE_ONLY', 'CUMULATIVE_ONLY'];
                        const nextIdx = (modes.indexOf(rainfallGraphMode) + 1) % modes.length;
                        setRainfallGraphMode(modes[nextIdx]);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      MODE: {rainfallGraphMode}
                    </button>
                    <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                      I = 14.82 · D^(-0.39) (mm/hr)
                    </span>
                  </div>
                </div>

                <div className="panel-body" style={{ position: 'relative' }}>
                  {/* Floating HUD Tooltip */}
                  {hoveredGraphPoint?.graphId === 'GRAPH_4' && hoveredGraphPoint.data && (
                    <div
                      className="graph-tooltip-box"
                      style={{
                        left: `${Math.min(75, Math.max(15, hoveredGraphPoint.chartPercent))}%`,
                        top: '15px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️ T = {hoveredGraphPoint.data.time}</span>
                        <span style={{ color: hoveredGraphPoint.data.rainfallRate > 22 ? '#ff3b5c' : '#60a5fa', fontSize: '9px' }}>
                          {hoveredGraphPoint.data.rainfallRate > 22 ? '⚡ CLOUDBURST SURGE' : 'STEADY PRECIPITATION'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                        <div>Instant Rate: <strong style={{ color: '#38bdf8' }}>{hoveredGraphPoint.data.rainfallRate} mm/hr</strong></div>
                        <div>Cumulative Rain: <strong style={{ color: '#93c5fd' }}>{hoveredGraphPoint.data.cumulativeRain} mm</strong></div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Caine Margin: {hoveredGraphPoint.data.rainfallRate > 22 ? `+${(hoveredGraphPoint.data.rainfallRate - 22).toFixed(1)} mm/hr above threshold` : `${(22 - hoveredGraphPoint.data.rainfallRate).toFixed(1)} mm/hr safety margin`}
                      </div>
                    </div>
                  )}

                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg
                      viewBox="0 0 520 220"
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseMove={(e) => handleChartMouseMove(e, 'GRAPH_4')}
                      onMouseLeave={() => setHoveredGraphPoint(null)}
                    >
                      <defs>
                        <linearGradient id="rainBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
                        </linearGradient>
                        <linearGradient id="rainCriticalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff3b5c" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
                        </linearGradient>
                      </defs>

                      {/* Storm Threshold Hazard Zone (Rain Rate > 22 mm/h: y from 30 to 131.3) */}
                      <rect x="45" y="30" width="435" height="101.3" fill="rgba(56, 189, 248, 0.05)" />

                      {/* Grid Lines */}
                      {[30, 70, 110, 150, 190].map(y => (
                        <line key={y} x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      ))}
                      <line x1="45" y1="20" x2="45" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="480" y1="20" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="45" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />

                      {/* Y-Axis Labels Left (Rainfall Rate mm/hr: 0 to 60) */}
                      <text x="40" y="34" textAnchor="end" fill="#38bdf8" fontSize="9" fontFamily="monospace">60mm</text>
                      <text x="40" y="74" textAnchor="end" fill="#38bdf8" fontSize="9" fontFamily="monospace">45mm</text>
                      <text x="40" y="114" textAnchor="end" fill="#38bdf8" fontSize="9" fontFamily="monospace">30mm</text>
                      <text x="40" y="154" textAnchor="end" fill="#38bdf8" fontSize="9" fontFamily="monospace">15mm</text>
                      <text x="40" y="193" textAnchor="end" fill="#38bdf8" fontSize="9" fontFamily="monospace">0mm</text>

                      {/* Y-Axis Labels Right (Cumulative mm: 195 to 255, span 60) */}
                      <text x="486" y="34" fill="#93c5fd" fontSize="9" fontFamily="monospace">255mm</text>
                      <text x="486" y="74" fill="#93c5fd" fontSize="9" fontFamily="monospace">240mm</text>
                      <text x="486" y="114" fill="#93c5fd" fontSize="9" fontFamily="monospace">225mm</text>
                      <text x="486" y="154" fill="#93c5fd" fontSize="9" fontFamily="monospace">210mm</text>
                      <text x="486" y="193" fill="#93c5fd" fontSize="9" fontFamily="monospace">195mm</text>

                      {/* Caine Empirical Landslide Trigger Line (22 mm/h -> y ≈ 131.3) */}
                      <line x1="45" y1="131.3" x2="480" y2="131.3" stroke="#ff3b5c" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x="475" y="126" textAnchor="end" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        CAINE 1980 COLLAPSE THRESHOLD (22 mm/h)
                      </text>

                      {/* Rainfall Intensity Hyetograph Bars */}
                      {(rainfallGraphMode === 'BOTH' || rainfallGraphMode === 'RATE_ONLY') && data.map((d, i) => {
                        const x = 45 + (i / (data.length - 1)) * 435;
                        const barH = (d.rainfallRate / 60) * 160;
                        const y = 190 - barH;
                        const isSevere = d.rainfallRate > 22;
                        return (
                          <rect
                            key={i}
                            x={x - 6}
                            y={y}
                            width="12"
                            height={barH}
                            fill={isSevere ? 'url(#rainCriticalGrad)' : 'url(#rainBarGrad)'}
                            className={isSevere ? 'hyetograph-bar-pulse' : ''}
                            rx="2"
                          />
                        );
                      })}

                      {/* Cumulative Rainfall S-Curve */}
                      {(rainfallGraphMode === 'BOTH' || rainfallGraphMode === 'CUMULATIVE_ONLY') && (
                        <>
                          <path
                            d={`M 45 190 ${data.map((d, i) => {
                              const x = 45 + (i / (data.length - 1)) * 435;
                              const y = 190 - ((d.cumulativeRain - 195) / 60) * 160;
                              return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')} L 480 190 Z`}
                            fill="rgba(147, 197, 253, 0.08)"
                          />
                          <path
                            d={`M ${data.map((d, i) => {
                              const x = 45 + (i / (data.length - 1)) * 435;
                              const y = 190 - ((d.cumulativeRain - 195) / 60) * 160;
                              return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="#93c5fd"
                            strokeWidth="2.5"
                          />
                        </>
                      )}

                      {/* Live Dot on Cumulative Curve */}
                      {(rainfallGraphMode === 'BOTH' || rainfallGraphMode === 'CUMULATIVE_ONLY') && (() => {
                        const lastX = 480;
                        const lastY = 190 - ((lastPt.cumulativeRain - 195) / 60) * 160;
                        return (
                          <g transform={`translate(${lastX}, ${lastY})`}>
                            <circle r="7" fill="rgba(147, 197, 253, 0.4)" className="live-point-pulse" />
                            <circle r="3.5" fill="#93c5fd" />
                            <circle r="1" fill="#fff" />
                          </g>
                        );
                      })()}

                      {/* Interactive Crosshair when hovered */}
                      {hoveredGraphPoint?.graphId === 'GRAPH_4' && (
                        <g>
                          <line x1={hoveredGraphPoint.svgX} y1="20" x2={hoveredGraphPoint.svgX} y2="190" className="graph-crosshair-line" />
                          {hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.cumulativeRain - 195) / 60) * 160}
                              r="5"
                              fill="#93c5fd"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ color: '#38bdf8' }}>▮ Instantaneous Rate: <strong>{lastPt.rainfallRate} mm/hr</strong></span>
                      <span style={{ color: '#93c5fd' }}>● Cumulative Rain: <strong>{lastPt.cumulativeRain} mm</strong></span>
                    </div>
                    <span className="chip chip-red" style={{ fontSize: '9px' }}>
                      CRITICAL ANTECEDENT SATURATION (API 164.2mm)
                    </span>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* GRAPH 5: MICRO-SEISMIC ACOUSTIC EMISSION & PPV            */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="panel graph-card-interactive" style={{ background: '#070b12', border: '1px solid rgba(217, 70, 239, 0.25)', position: 'relative' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d946ef' }}>⚡</span>
                    <span className="label-caps">5. MICRO-SEISMIC ACOUSTIC EMISSION (150kHz) & PPV VELOCITY</span>
                  </div>
                  {/* Channel toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => toggleChannel('aeHits')}
                      style={{
                        background: visibleGraphChannels.aeHits ? 'rgba(217, 70, 239, 0.2)' : 'transparent',
                        border: visibleGraphChannels.aeHits ? '1px solid #d946ef' : '1px solid rgba(255,255,255,0.1)',
                        color: visibleGraphChannels.aeHits ? '#d946ef' : 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ AE Hits
                    </button>
                    <button
                      onClick={() => toggleChannel('ppv')}
                      style={{
                        background: visibleGraphChannels.ppv ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                        border: visibleGraphChannels.ppv ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.1)',
                        color: visibleGraphChannels.ppv ? 'var(--cyan)' : 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      〰️ PPV Wave
                    </button>
                    <span style={{ fontSize: '10px', color: '#d946ef', fontFamily: 'var(--font-mono)' }}>
                      KAISER EFFECT ACTIVE
                    </span>
                  </div>
                </div>

                <div className="panel-body" style={{ position: 'relative' }}>
                  {/* Floating HUD Tooltip */}
                  {hoveredGraphPoint?.graphId === 'GRAPH_5' && hoveredGraphPoint.data && (
                    <div
                      className="graph-tooltip-box"
                      style={{
                        left: `${Math.min(75, Math.max(15, hoveredGraphPoint.chartPercent))}%`,
                        top: '15px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div style={{ color: '#d946ef', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️ T = {hoveredGraphPoint.data.time}</span>
                        <span style={{ color: hoveredGraphPoint.data.ppvVelocity >= 20 ? '#ff3b5c' : '#22c55e', fontSize: '9px' }}>
                          {hoveredGraphPoint.data.ppvVelocity >= 20 ? '⚠️ DIN 4150 LIMIT EXCEEDED' : '✓ STABLE VIBRATION'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                        <div>AE Hit Rate: <strong style={{ color: '#d946ef' }}>{hoveredGraphPoint.data.aeHits} hits/min</strong></div>
                        <div>PPV Velocity: <strong style={{ color: '#00e5ff' }}>{hoveredGraphPoint.data.ppvVelocity} mm/s</strong></div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Acoustic Energy Density: {hoveredGraphPoint.data.aeHits > 70 ? 'Tertiary Micro-Fracture Acoustic Clustering' : 'Baseline Secondary Creep Noise'}
                      </div>
                    </div>
                  )}

                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg
                      viewBox="0 0 520 220"
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseMove={(e) => handleChartMouseMove(e, 'GRAPH_5')}
                      onMouseLeave={() => setHoveredGraphPoint(null)}
                    >
                      <defs>
                        <linearGradient id="aeBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#d946ef" stopOpacity="0.4" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[30, 70, 110, 150, 190].map(y => (
                        <line key={y} x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      ))}
                      <line x1="45" y1="20" x2="45" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="480" y1="20" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="45" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />

                      {/* Y-Axis Labels Left (AE Hits/min: 0 to 120) */}
                      <text x="40" y="34" textAnchor="end" fill="#d946ef" fontSize="9" fontFamily="monospace">120</text>
                      <text x="40" y="74" textAnchor="end" fill="#d946ef" fontSize="9" fontFamily="monospace">90</text>
                      <text x="40" y="114" textAnchor="end" fill="#d946ef" fontSize="9" fontFamily="monospace">60</text>
                      <text x="40" y="154" textAnchor="end" fill="#d946ef" fontSize="9" fontFamily="monospace">30</text>
                      <text x="40" y="193" textAnchor="end" fill="#d946ef" fontSize="9" fontFamily="monospace">0</text>

                      {/* Y-Axis Labels Right (PPV mm/s: 0 to 30) */}
                      <text x="486" y="34" fill="#00e5ff" fontSize="9" fontFamily="monospace">30</text>
                      <text x="486" y="74" fill="#00e5ff" fontSize="9" fontFamily="monospace">22.5</text>
                      <text x="486" y="114" fill="#00e5ff" fontSize="9" fontFamily="monospace">15.0</text>
                      <text x="486" y="154" fill="#00e5ff" fontSize="9" fontFamily="monospace">7.5</text>
                      <text x="486" y="193" fill="#00e5ff" fontSize="9" fontFamily="monospace">0</text>

                      {/* DIN 4150 Ground Vibration Limit (20 mm/s -> y ≈ 83.3) */}
                      <line x1="45" y1="83.3" x2="480" y2="83.3" stroke="#ff3b5c" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x="475" y="78" textAnchor="end" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        DIN 4150 STRUCTURAL DAMAGE LIMIT (20 mm/s)
                      </text>

                      {/* AE Hits Vertical Columns */}
                      {visibleGraphChannels.aeHits && data.map((d, i) => {
                        const x = 45 + (i / (data.length - 1)) * 435;
                        const barH = (Math.min(120, d.aeHits) / 120) * 160;
                        const y = 190 - barH;
                        return (
                          <rect
                            key={i}
                            x={x - 4}
                            y={y}
                            width="8"
                            height={barH}
                            fill="url(#aeBarGrad)"
                            rx="1"
                          />
                        );
                      })}

                      {/* PPV Waveform Trace */}
                      {visibleGraphChannels.ppv && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - (d.ppvVelocity / 30) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#00e5ff"
                          strokeWidth="2.4"
                        />
                      )}

                      {/* Live Dot on PPV */}
                      {visibleGraphChannels.ppv && (() => {
                        const lastX = 480;
                        const lastY = 190 - (lastPt.ppvVelocity / 30) * 160;
                        return (
                          <g transform={`translate(${lastX}, ${lastY})`}>
                            <circle r="7" fill="rgba(0, 229, 255, 0.4)" className="live-point-pulse" />
                            <circle r="3.5" fill="#00e5ff" />
                            <circle r="1" fill="#fff" />
                          </g>
                        );
                      })()}

                      {/* Interactive Crosshair when hovered */}
                      {hoveredGraphPoint?.graphId === 'GRAPH_5' && (
                        <g>
                          <line x1={hoveredGraphPoint.svgX} y1="20" x2={hoveredGraphPoint.svgX} y2="190" className="graph-crosshair-line" />
                          {visibleGraphChannels.ppv && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - (hoveredGraphPoint.data.ppvVelocity / 30) * 160}
                              r="5"
                              fill="#00e5ff"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ color: '#d946ef' }}>▮ AE Hits: <strong>{lastPt.aeHits} hits/min</strong></span>
                      <span style={{ color: '#00e5ff' }}>● Particle Velocity: <strong>{lastPt.ppvVelocity} mm/s</strong></span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      Transducer: Piezoelectric 150kHz Resonance Transducer
                    </span>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* GRAPH 6: MULTI-DEPTH SOIL MOISTURE SATURATION GRADIENT   */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="panel graph-card-interactive" style={{ background: '#070b12', border: '1px solid rgba(168, 85, 247, 0.25)', position: 'relative' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#a855f7' }}>🌱</span>
                    <span className="label-caps">6. MULTI-DEPTH SOIL VWC (%) SATURATION GRADIENT</span>
                  </div>
                  {/* Channel depth toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[
                      { key: 'vwc10', label: '10cm', color: '#00e5ff' },
                      { key: 'vwc30', label: '30cm', color: '#22c55e' },
                      { key: 'vwc60', label: '60cm', color: '#ffb020' },
                      { key: 'vwc100', label: '100cm', color: '#c084fc' }
                    ].map(ch => (
                      <button
                        key={ch.key}
                        onClick={() => toggleChannel(ch.key)}
                        style={{
                          background: visibleGraphChannels[ch.key] ? `${ch.color}22` : 'transparent',
                          border: visibleGraphChannels[ch.key] ? `1px solid ${ch.color}` : '1px solid rgba(255,255,255,0.1)',
                          color: visibleGraphChannels[ch.key] ? ch.color : 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '9px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {ch.label}
                      </button>
                    ))}
                    <span style={{ fontSize: '10px', color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                      v_w = 4.2 cm/hr
                    </span>
                  </div>
                </div>

                <div className="panel-body" style={{ position: 'relative' }}>
                  {/* Floating HUD Tooltip */}
                  {hoveredGraphPoint?.graphId === 'GRAPH_6' && hoveredGraphPoint.data && (
                    <div
                      className="graph-tooltip-box"
                      style={{
                        left: `${Math.min(75, Math.max(15, hoveredGraphPoint.chartPercent))}%`,
                        top: '15px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div style={{ color: '#c084fc', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️ T = {hoveredGraphPoint.data.time}</span>
                        <span style={{ color: hoveredGraphPoint.data.vwc10cm >= 85 ? '#ff3b5c' : '#22c55e', fontSize: '9px' }}>
                          {hoveredGraphPoint.data.vwc10cm >= 85 ? '⚠️ FIELD SATURATION (LIQUEFACTION)' : 'MOISTURE INFILTRATION'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
                        <div>10cm: <strong style={{ color: '#00e5ff' }}>{hoveredGraphPoint.data.vwc10cm}%</strong></div>
                        <div>30cm: <strong style={{ color: '#22c55e' }}>{hoveredGraphPoint.data.vwc30cm}%</strong></div>
                        <div>60cm: <strong style={{ color: '#ffb020' }}>{hoveredGraphPoint.data.vwc60cm}%</strong></div>
                        <div>100cm: <strong style={{ color: '#c084fc' }}>{hoveredGraphPoint.data.vwc100cm}%</strong></div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Downward Wetting Front Rate: 4.2 cm/hr | Shear Plane Recharge (100cm): {hoveredGraphPoint.data.vwc100cm}%
                      </div>
                    </div>
                  )}

                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg
                      viewBox="0 0 520 220"
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseMove={(e) => handleChartMouseMove(e, 'GRAPH_6')}
                      onMouseLeave={() => setHoveredGraphPoint(null)}
                    >
                      {/* Soil Saturation Hazard Zone (>85% VWC: y from 30 to 90) */}
                      <rect x="45" y="30" width="435" height="60" fill="rgba(168, 85, 247, 0.08)" />

                      {/* Grid Lines */}
                      {[30, 70, 110, 150, 190].map(y => (
                        <line key={y} x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      ))}
                      <line x1="45" y1="20" x2="45" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="480" y1="20" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />
                      <line x1="45" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.2)" />

                      {/* Y-Axis Labels Left (VWC %: 60 to 100%, span 40) */}
                      <text x="40" y="34" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">100%</text>
                      <text x="40" y="74" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">90%</text>
                      <text x="40" y="114" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">80%</text>
                      <text x="40" y="154" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">70%</text>
                      <text x="40" y="193" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">60%</text>

                      {/* Saturation / Field Capacity Limit (85% VWC -> y = 90) */}
                      <line x1="45" y1="90" x2="480" y2="90" stroke="#ff3b5c" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x="475" y="85" textAnchor="end" fill="#ff3b5c" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        SOIL FIELD SATURATION CAPACITY (85% VWC)
                      </text>

                      {/* 10cm Depth Curve (Cyan) */}
                      {visibleGraphChannels.vwc10 && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.vwc10cm - 60) / 40) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#00e5ff"
                          strokeWidth="2.5"
                        />
                      )}

                      {/* 30cm Depth Curve (Green) */}
                      {visibleGraphChannels.vwc30 && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.vwc30cm - 60) / 40) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2.2"
                        />
                      )}

                      {/* 60cm Depth Curve (Amber) */}
                      {visibleGraphChannels.vwc60 && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.vwc60cm - 60) / 40) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#ffb020"
                          strokeWidth="2.0"
                        />
                      )}

                      {/* 100cm Depth Curve (Purple) */}
                      {visibleGraphChannels.vwc100 && (
                        <path
                          d={`M ${data.map((d, i) => {
                            const x = 45 + (i / (data.length - 1)) * 435;
                            const y = 190 - ((d.vwc100cm - 60) / 40) * 160;
                            return `${i === 0 ? '' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth="2.0"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Pulsing Live Dot on 10cm */}
                      {visibleGraphChannels.vwc10 && (() => {
                        const lastX = 480;
                        const lastY = 190 - ((lastPt.vwc10cm - 60) / 40) * 160;
                        return (
                          <g transform={`translate(${lastX}, ${lastY})`}>
                            <circle r="7" fill="rgba(0, 229, 255, 0.4)" className="live-point-pulse" />
                            <circle r="3.5" fill="#00e5ff" />
                            <circle r="1" fill="#fff" />
                          </g>
                        );
                      })()}

                      {/* Interactive Crosshair when hovered */}
                      {hoveredGraphPoint?.graphId === 'GRAPH_6' && (
                        <g>
                          <line x1={hoveredGraphPoint.svgX} y1="20" x2={hoveredGraphPoint.svgX} y2="190" className="graph-crosshair-line" />
                          {visibleGraphChannels.vwc10 && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.vwc10cm - 60) / 40) * 160}
                              r="4"
                              fill="#00e5ff"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                          {visibleGraphChannels.vwc30 && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.vwc30cm - 60) / 40) * 160}
                              r="4"
                              fill="#22c55e"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                          {visibleGraphChannels.vwc60 && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.vwc60cm - 60) / 40) * 160}
                              r="4"
                              fill="#ffb020"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                          {visibleGraphChannels.vwc100 && hoveredGraphPoint.data && (
                            <circle
                              cx={hoveredGraphPoint.svgX}
                              cy={190 - ((hoveredGraphPoint.data.vwc100cm - 60) / 40) * 160}
                              r="4"
                              fill="#c084fc"
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: '#00e5ff' }}>● 10cm: <strong>{lastPt.vwc10cm}%</strong></span>
                      <span style={{ color: '#22c55e' }}>● 30cm: <strong>{lastPt.vwc30cm}%</strong></span>
                      <span style={{ color: '#ffb020' }}>● 60cm: <strong>{lastPt.vwc60cm}%</strong></span>
                      <span style={{ color: '#c084fc' }}>-- 100cm: <strong>{lastPt.vwc100cm}%</strong></span>
                    </div>
                    <span style={{ color: 'var(--cyan)', fontSize: '10px' }}>
                      Sentek Drill & Drop TDR Probe • Multi-Depth Capacitance
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

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

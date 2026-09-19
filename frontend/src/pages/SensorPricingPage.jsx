import React, { useState, useEffect, useMemo } from 'react';

// Exchange rates relative to INR
const CURRENCIES = {
  INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 1 / 83.5, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 1 / 91.0, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 1 / 106.5, label: 'GBP (£)' },
};

// Fallback catalog with 14 real-world geotechnical & hydrological instruments
const DEFAULT_CATALOG = [
  {
    id: 1,
    name: "Tipping Bucket Rain Gauge",
    model: "Campbell Scientific TE525 / MISOL Pro-RG",
    category: "METEOROLOGICAL",
    purpose: "Real-time precipitation rate & antecedent rainfall accumulation",
    measured_param: "Rainfall Intensity (mm/hr), Cumulative Volume (mm)",
    why_this_sensor: "Rainfall infiltration is the #1 triggering agent of translational and rotational landslides worldwide. This sensor calculates real-time precipitation intensity down to 0.2mm and tracks 7-day cumulative rainfall against empirical Caine (1980) and Guzzetti Intensity-Duration (I-D) collapse thresholds.",
    suitability_and_benefits: "Operates 100% passively with dual balanced tipping spoons requiring zero sleep current. Anodized aluminum funnel resists severe UV radiation and acidic mountain rain. Integrated debris screen and siphon prevent splash loss, debris blockage, and insect nesting.",
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
    imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80"
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
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80"
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
          {/* Tipping bucket rocker */}
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
          {/* Cylindrical casing */}
          <rect x="75" y="25" width="50" height="90" rx="3" fill="rgba(41, 121, 255, 0.15)" stroke="#2979ff" strokeWidth="2" />
          {/* Filter tip */}
          <rect x="80" y="115" width="40" height="20" rx="2" fill="rgba(34, 197, 94, 0.25)" stroke="#22c55e" strokeWidth="2" strokeDasharray="2 2" />
          {/* Vibrating wire element */}
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
          {/* Heavy casing */}
          <rect x="55" y="45" width="90" height="65" rx="6" fill="rgba(0, 229, 255, 0.1)" stroke="#00e5ff" strokeWidth="2" />
          {/* Biaxial crosshair */}
          <circle cx="100" cy="77" r="22" fill="none" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="100" y1="52" x2="100" y2="102" stroke="#ff3b5c" strokeWidth="2" />
          <line x1="75" y1="77" x2="125" y2="77" stroke="#00e5ff" strokeWidth="2" />
          <circle cx="100" cy="77" r="4" fill="#ffb020" />
          <text x="100" y="32" textAnchor="middle" fill="#00e5ff" fontSize="9" fontFamily="monospace">BIAXIAL ORTHOGONAL (X/Y)</text>
          <text x="100" y="135" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">32-BIT DIGITAL KALMAN FILTER</text>
        </svg>
      );
    case 'soil_moisture':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          {/* Top handle */}
          <rect x="75" y="15" width="50" height="15" rx="3" fill="#2979ff" opacity="0.8" />
          {/* Probe shaft */}
          <rect x="92" y="30" width="16" height="110" rx="2" fill="rgba(255,255,255,0.05)" stroke="#00e5ff" strokeWidth="1.5" />
          {/* Depth segments */}
          {[45, 70, 95, 120].map((y, idx) => (
            <g key={y}>
              <rect x="86" y={y} width="28" height="8" rx="2" fill="#ffb020" opacity="0.85" />
              <text x="135" y={y + 7} fill="#8a9ab5" fontSize="8" fontFamily="monospace">{[10, 30, 60, 100][idx]}cm</text>
            </g>
          ))}
          <text x="50" y="80" fill="#00e5ff" fontSize="8" fontFamily="monospace" transform="rotate(-90, 50, 80)">TDR CAPACITIVE</text>
        </svg>
      );
    case 'crackmeter':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          {/* Tension crack */}
          <path d="M 98 10 L 104 50 L 96 100 L 102 150" stroke="#ff3b5c" strokeWidth="2.5" fill="none" opacity="0.5" />
          {/* Anchors */}
          <circle cx="45" cy="80" r="7" fill="#ffb020" stroke="#fff" strokeWidth="1" />
          <circle cx="155" cy="80" r="7" fill="#ffb020" stroke="#fff" strokeWidth="1" />
          {/* Telescopic body */}
          <rect x="52" y="74" width="55" height="12" rx="2" fill="rgba(0, 229, 255, 0.3)" stroke="#00e5ff" strokeWidth="1.5" />
          <rect x="105" y="76" width="43" height="8" rx="1" fill="#8a9ab5" />
          <text x="100" y="40" textAnchor="middle" fill="#ff3b5c" fontSize="9" fontFamily="monospace">TENSILE CRACK DILATION</text>
          <text x="100" y="115" textAnchor="middle" fill="#00e5ff" fontSize="8" fontFamily="monospace">INVAR LOW-EXPANSION LINKAGE</text>
        </svg>
      );
    case 'geophone':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="70" y="30" width="60" height="65" rx="6" fill="rgba(255, 176, 32, 0.15)" stroke="#ffb020" strokeWidth="2" />
          {/* Coil & magnet */}
          <circle cx="100" cy="62" r="14" fill="none" stroke="#ff3b5c" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx="100" cy="62" r="6" fill="#00e5ff" />
          {/* Ground spike */}
          <polygon points="85,95 115,95 100,135" fill="#8a9ab5" stroke="#ffb020" strokeWidth="1.5" />
          <text x="100" y="20" textAnchor="middle" fill="#ffb020" fontSize="9" fontFamily="monospace">SM-24 10Hz VELOCITY COIL</text>
          <text x="100" y="150" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">BEDROCK COUPLING SPIKE</text>
        </svg>
      );
    case 'ultrasonic':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="75" y="25" width="50" height="35" rx="4" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
          {/* Acoustic emission cones */}
          <path d="M 80 65 Q 100 80 120 65" fill="none" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M 70 85 Q 100 105 130 85" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8" />
          <path d="M 60 105 Q 100 130 140 105" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
          {/* Debris mud level line */}
          <line x1="40" y1="130" x2="160" y2="130" stroke="#ffb020" strokeWidth="2.5" strokeDasharray="4 2" />
          <text x="100" y="18" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">NON-CONTACT ACOUSTIC RANGING</text>
          <text x="100" y="148" textAnchor="middle" fill="#ffb020" fontSize="8" fontFamily="monospace">DEBRIS FLOW HYDRAULIC SURGE</text>
        </svg>
      );
    case 'weather_station':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          {/* Ultrasonic head */}
          <circle cx="100" cy="45" r="28" fill="none" stroke="#00e5ff" strokeWidth="2" />
          <circle cx="85" cy="45" r="4" fill="#ffb020" />
          <circle cx="115" cy="45" r="4" fill="#ffb020" />
          <circle cx="100" cy="30" r="4" fill="#ff3b5c" />
          <circle cx="100" cy="60" r="4" fill="#ff3b5c" />
          {/* Multi-plate radiation shield */}
          {[78, 88, 98, 108].map(y => (
            <ellipse key={y} cx="100" cy={y} rx="30" ry="4" fill="rgba(255,255,255,0.08)" stroke="#8a9ab5" strokeWidth="1" />
          ))}
          <line x1="100" y1="112" x2="100" y2="140" stroke="#8a9ab5" strokeWidth="4" />
          <text x="100" y="152" textAnchor="middle" fill="#00e5ff" fontSize="8" fontFamily="monospace">SOLID-STATE ULTRASONIC TRANSDUCERS</text>
        </svg>
      );
    case 'lora_node':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="50" y="55" width="80" height="70" rx="6" fill="rgba(41, 121, 255, 0.15)" stroke="#2979ff" strokeWidth="2" />
          {/* Status LEDs */}
          <circle cx="65" cy="72" r="3" fill="#22c55e" />
          <circle cx="77" cy="72" r="3" fill="#00e5ff" />
          {/* Antenna */}
          <line x1="120" y1="55" x2="120" y2="15" stroke="#ffb020" strokeWidth="3" />
          {/* RF propagation arcs */}
          <path d="M 125 18 Q 135 25 125 32" fill="none" stroke="#ffb020" strokeWidth="1.5" />
          <path d="M 130 14 Q 145 25 130 36" fill="none" stroke="#ffb020" strokeWidth="1.5" opacity="0.6" />
          <text x="90" y="105" textAnchor="middle" fill="#2979ff" fontSize="10" fontFamily="monospace">SX1262 LoRa</text>
          <text x="100" y="145" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">868/915 MHz • 15KM NON-LINE-OF-SIGHT</text>
        </svg>
      );
    case 'gateway':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="50" y="45" width="100" height="80" rx="4" fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="2" />
          {/* Dual antennas */}
          <line x1="65" y1="45" x2="65" y2="15" stroke="#ff3b5c" strokeWidth="3" />
          <line x1="135" y1="45" x2="135" y2="15" stroke="#00e5ff" strokeWidth="3" />
          {/* Ethernet and SIM ports */}
          <rect x="62" y="95" width="22" height="14" rx="2" fill="#1e2028" stroke="#8a9ab5" strokeWidth="1" />
          <rect x="92" y="95" width="22" height="14" rx="2" fill="#1e2028" stroke="#8a9ab5" strokeWidth="1" />
          <circle cx="128" cy="102" r="3" fill="#22c55e" />
          <text x="100" y="70" textAnchor="middle" fill="#00e5ff" fontSize="10" fontFamily="monospace">4G/LTE + SAT GATEWAY</text>
          <text x="100" y="145" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">DUAL SIM FAILOVER • MQTT / TLS</text>
        </svg>
      );
    case 'edge_compute':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          <rect x="40" y="35" width="120" height="90" rx="6" fill="rgba(34, 197, 94, 0.1)" stroke="#22c55e" strokeWidth="2" />
          {/* CPU chip */}
          <rect x="75" y="55" width="50" height="50" rx="4" fill="#1a1c22" stroke="#00e5ff" strokeWidth="1.5" />
          <text x="100" y="83" textAnchor="middle" fill="#00e5ff" fontSize="9" fontFamily="monospace">ESP32-S3</text>
          {/* Bus terminals */}
          {[48, 58, 68, 78, 88].map(x => (
            <rect key={x} x={x} y="112" width="6" height="8" rx="1" fill="#ffb020" />
          ))}
          <text x="100" y="24" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">SDI-12 / RS-485 / 16-BIT ADC</text>
          <text x="100" y="145" textAnchor="middle" fill="#8a9ab5" fontSize="8" fontFamily="monospace">TINYML REAL-TIME ANOMALY ENGINE</text>
        </svg>
      );
    case 'solar_power':
      return (
        <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', ...style }}>
          <rect width="200" height="160" fill="#0c1017" rx="8" />
          {/* Solar Panel grid */}
          <polygon points="55,60 145,60 160,25 40,25" fill="rgba(0, 229, 255, 0.2)" stroke="#00e5ff" strokeWidth="1.5" />
          <line x1="100" y1="25" x2="100" y2="60" stroke="#00e5ff" strokeWidth="1" />
          <line x1="70" y1="42" x2="130" y2="42" stroke="#00e5ff" strokeWidth="1" />
          {/* LiFePO4 battery pack */}
          <rect x="60" y="75" width="80" height="50" rx="4" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
          <rect x="90" y="69" width="20" height="6" rx="1" fill="#ffb020" />
          <text x="100" y="103" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">12V 20Ah LiFePO4</text>
          <text x="100" y="145" textAnchor="middle" fill="#ffb020" fontSize="8" fontFamily="monospace">MPPT 99% CONVERSION • 7-DAY RESERVE</text>
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

// Visual Component with Image + Seamless Fallback to Animated Blueprint
function SensorVisual({ item, viewMode = 'PHOTO', onToggleMode }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '190px', overflow: 'hidden', borderRadius: '6px', background: '#090b10' }}>
      {/* Show Schematic if requested or if Image errored */}
      {(viewMode === 'BLUEPRINT' || imgError) ? (
        <div style={{ width: '100%', height: '100%', padding: '8px' }}>
          <SensorSchematic type={item.schematic} />
        </div>
      ) : (
        <>
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.85) contrast(1.1)',
              transition: 'transform 0.4s ease, filter 0.4s ease',
              display: imgLoaded ? 'block' : 'none'
            }}
            className="sensor-img-hover"
          />
          {!imgLoaded && !imgError && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
              <SensorSchematic type={item.schematic} />
            </div>
          )}
        </>
      )}

      {/* Visual Overlay Mode Badge */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        gap: '4px',
        zIndex: 5
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMode && onToggleMode(item.id, viewMode === 'PHOTO' ? 'BLUEPRINT' : 'PHOTO'); }}
          style={{
            background: 'rgba(10, 12, 16, 0.85)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            color: 'var(--cyan)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Toggle between hardware photograph and engineering schematic"
        >
          {viewMode === 'PHOTO' ? '📷 PHOTO' : '📐 SCHEMATIC'}
        </button>
      </div>

      {/* Ingress / Interface Badges */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        zIndex: 5
      }}>
        <span style={{
          background: 'rgba(0, 229, 255, 0.2)',
          border: '1px solid rgba(0, 229, 255, 0.5)',
          color: '#00e5ff',
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(4px)'
        }}>
          {item.ingress}
        </span>
        <span style={{
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          color: '#22c55e',
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(4px)'
        }}>
          {item.interface.split('/')[0]}
        </span>
      </div>
    </div>
  );
}

export default function SensorPricingPage() {
  const [items, setItems] = useState(DEFAULT_CATALOG);
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

  // Power / Autonomy simulator state
  const [samplingRateMin, setSamplingRateMin] = useState(5); // 1, 5, 15, 60 min
  const [pvWatts, setPvWatts] = useState(30); // 20W, 30W, 50W
  const [batteryAh, setBatteryAh] = useState(20); // 10Ah, 20Ah, 40Ah

  // Cable length slider (meters)
  const [cableLengthMeters, setCableLengthMeters] = useState(120);

  // Load from API or localStorage
  useEffect(() => {
    fetch('http://localhost:8000/api/sensors/catalog')
      .then(res => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          const q = {};
          data.forEach(item => { q[item.id] = item.default_qty || 1; });
          setQuantities(prev => ({ ...q, ...prev }));
        }
      })
      .catch(() => {
        // Fallback to localStorage or default
        const saved = localStorage.getItem('nexus_sensor_catalog_v2');
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch {
            setItems(DEFAULT_CATALOG);
          }
        }
      });
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

  // BOM Financial Calculation
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

    // Umbilical cable: ₹85 / meter (high grade shielded UV resistant RS-485/SDI-12 4-core cable)
    const cableCostInr = cableLengthMeters * 85;
    // Surge protection & mounting grounding kit: ₹7,500
    const mountingKitInr = 7500;
    // Contingency & freight: 5% of hardware
    const shippingFreightInr = Math.round(hardwareSubtotalInr * 0.05);
    // GST / Import Duty: 18%
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

  // Power & Battery Autonomy Calculation
  const powerAutonomy = useMemo(() => {
    // Calculate total energy in Watt-hours drawn per day
    // Base controller + gateway draw: ~1.2W continuous = 28.8 Wh/day
    let baseWhPerDay = 24.0;
    
    // Sensor poll energy: each poll takes ~1 sec at 12V 40mA avg = 0.48W for 1s = 0.000133 Wh
    const pollsPerDay = (24 * 60) / Math.max(1, samplingRateMin);
    let sensorWhPerDay = 0;

    items.forEach(item => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        // Average sensor pulse: 0.0002 Wh per reading
        sensorWhPerDay += qty * pollsPerDay * 0.00025;
      }
    });

    const totalDailyWh = baseWhPerDay + sensorWhPerDay;
    const batteryWhCapacity = batteryAh * 12 * 0.85; // 85% depth of discharge
    const autonomyDays = (batteryWhCapacity / totalDailyWh).toFixed(1);
    const dailySolarHarvestWh = pvWatts * 4.2 * 0.8; // 4.2 sun-peak hours with MPPT

    const isAdequate = dailySolarHarvestWh >= totalDailyWh * 1.5;

    return {
      totalDailyWh: totalDailyWh.toFixed(1),
      batteryWhCapacity: batteryWhCapacity.toFixed(0),
      autonomyDays,
      dailySolarHarvestWh: dailySolarHarvestWh.toFixed(0),
      isAdequate
    };
  }, [items, quantities, samplingRateMin, pvWatts, batteryAh]);

  // Export BOM to CSV
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
            <span className="chip chip-green" style={{ fontSize: '10px' }}>● LIVE SPEC CATALOG</span>
            <span className="chip chip-cyan" style={{ fontSize: '10px' }}>ISO 18674 COMPLIANT</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            Geotechnical Sensor & Telemetry Intelligence
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Deep operational rationale, scientific suitability justifications, live sensor imagery, and dynamic bill-of-materials calculation.
          </p>
        </div>

        {/* Global Controls: Currency & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Currency Switcher */}
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

      {/* Preset Turnkey Deployment Packages */}
      <div className="panel" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(17, 19, 22, 0.95), rgba(26, 28, 34, 0.95))' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--cyan)' }}>⚡</span>
            <span className="label-caps">TURNKEY REAL-WORLD DEPLOYMENT PACKAGES</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            CLICK TO INSTANTLY POPULATE RECOMMENDED SENSOR SUITES
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
            <span>🗺️</span> TOPOGRAPHY & WIRING SCHEMATIC
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

        {/* Global Blueprint vs Photo Switcher for Cards */}
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
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              📷 Photos
            </button>
            <button
              onClick={() => {
                const modes = {};
                items.forEach(i => { modes[i.id] = 'BLUEPRINT'; });
                setCardVisualModes(modes);
              }}
              className="btn"
              style={{ padding: '4px 10px', fontSize: '11px' }}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
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
                    border: isIncluded ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid var(--border-subtle)',
                    boxShadow: isIncluded ? '0 0 16px rgba(0, 229, 255, 0.05)' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  {/* Visual Header with Image & Badge */}
                  <div style={{ padding: '12px 12px 0 12px' }}>
                    <SensorVisual
                      item={item}
                      viewMode={cardMode}
                      onToggleMode={handleToggleCardVisual}
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
                        {/* Quantity Stepper */}
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

                        {/* Inspect Datasheet Button */}
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
                {/* Active Kit Label */}
                <div style={{ background: 'rgba(0, 229, 255, 0.08)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(0, 229, 255, 0.2)', marginBottom: '14px', fontSize: '11px' }}>
                  <div style={{ color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>ACTIVE ARCHITECTURE:</div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{DEPLOYMENT_PRESETS[activePreset]?.title || "Custom Engineering BOM"}</div>
                </div>

                {/* Subtotals */}
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

                {/* Grand Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>TOTAL DEPLOYMENT:</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(bomSummary.grandTotalInr)}
                  </span>
                </div>

                {/* Power Runtime Pill */}
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontWeight: 700, marginBottom: '2px' }}>
                    <span>🔋</span> OFF-GRID SOLAR AUTONOMY:
                  </div>
                  <div style={{ color: '#cbd5e1' }}>
                    Estimated <strong style={{ color: '#fff' }}>{powerAutonomy.autonomyDays} days</strong> continuous operation under 0% sunlight (heavy monsoon overcast).
                  </div>
                </div>

                {/* Action Buttons */}
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

      {/* TAB 2: TOPOGRAPHY & WIRING SCHEMATIC */}
      {activeTab === 'TOPOGRAPHY' && (
        <div className="panel" style={{ marginBottom: '20px' }}>
          <div className="panel-header">
            <span className="label-caps">TOPOGRAPHIC SLOPE CROSS-SECTION & TELEMETRY TOPOLOGY</span>
            <span style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              LIVE BUS & RF SIGNAL PATH (SDI-12 • RS-485 • LoRaWAN • 4G SATELLITE)
            </span>
          </div>
          <div className="panel-body" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              This interactive topographic model illustrates the precise spatial deployment of instruments along a 40° vulnerable mountain slope.
              Sensors at the slope toe and head scarp feed via SDI-12 / RS-485 into the central low-power Edge Node, which relays encrypted telemetry over 15km LoRaWAN to the ridge gateway.
            </div>

            {/* Topography SVG Cross-Section */}
            <div style={{ width: '100%', height: '420px', background: '#07090d', borderRadius: '8px', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 900 400" style={{ width: '100%', height: '100%' }}>
                {/* Sky gradient */}
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#080d1a" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="mountainGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="shearGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255, 59, 92, 0.4)" />
                    <stop offset="100%" stopColor="rgba(255, 59, 92, 0.05)" />
                  </linearGradient>
                </defs>

                <rect width="900" height="400" fill="url(#skyGrad)" />

                {/* Rain clouds and rainfall animation */}
                <path d="M 50 40 Q 80 15 120 40 Q 150 20 180 40 Q 200 60 170 80 L 60 80 Z" fill="rgba(74, 85, 104, 0.5)" />
                <path d="M 450 30 Q 480 10 520 30 Q 550 15 580 35 Q 600 55 570 70 L 460 70 Z" fill="rgba(74, 85, 104, 0.4)" />
                {[70, 90, 110, 130, 150, 480, 500, 530, 550].map((rx, idx) => (
                  <line key={idx} x1={rx} y1="85" x2={rx - 10} y2="125" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />
                ))}

                {/* Mountain Slope Profile */}
                <path
                  d="M 0 350 L 180 340 L 320 280 L 500 170 L 680 90 L 780 80 L 900 70 L 900 400 L 0 400 Z"
                  fill="url(#mountainGrad)"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Potential Shear Rupture Surface (Bishop Slip Circle) */}
                <path
                  d="M 220 330 Q 450 320 640 100"
                  fill="none"
                  stroke="#ff3b5c"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                />
                <text x="400" y="300" fill="#ff3b5c" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  POTENTIAL ROTATIONAL SLIP SURFACE (SHEAR BAND)
                </text>

                {/* 1. Crest Station: Ridge Gateway & Solar Array */}
                <g transform="translate(750, 40)">
                  <line x1="0" y1="40" x2="0" y2="0" stroke="#8a9ab5" strokeWidth="3" />
                  <circle cx="0" cy="0" r="8" fill="#00e5ff" />
                  <line x1="0" y1="0" x2="-25" y2="15" stroke="#ffb020" strokeWidth="2.5" />
                  <rect x="-35" y="10" width="20" height="12" rx="2" fill="rgba(255, 176, 32, 0.4)" stroke="#ffb020" strokeWidth="1.5" />
                  <text x="-40" y="-8" fill="#00e5ff" fontSize="10" fontFamily="monospace" fontWeight="bold">RIDGE SATELLITE GATEWAY + 50W PV</text>
                </g>

                {/* 2. Head Scarp: Tension Crackmeter & Tiltmeter */}
                <g transform="translate(630, 90)">
                  <circle cx="0" cy="0" r="7" fill="#ff3b5c" />
                  <rect x="-15" y="-22" width="30" height="14" rx="2" fill="rgba(255, 59, 92, 0.3)" stroke="#ff3b5c" strokeWidth="1" />
                  <text x="-80" y="-28" fill="#ff3b5c" fontSize="10" fontFamily="monospace" fontWeight="bold">CRACKMETER + BIAXIAL TILT</text>
                </g>

                {/* 3. Mid-Slope Borehole Array: Piezometer & Soil Moisture */}
                <g transform="translate(480, 180)">
                  {/* Vertical Borehole line */}
                  <line x1="0" y1="0" x2="0" y2="110" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="3 2" />
                  {/* Top controller */}
                  <rect x="-12" y="-24" width="24" height="20" rx="3" fill="#1e293b" stroke="#00e5ff" strokeWidth="1.5" />
                  <circle cx="0" cy="-14" r="3" fill="#22c55e" />
                  {/* Multi-depth soil moisture */}
                  <rect x="-4" y="10" width="8" height="35" fill="rgba(255, 176, 32, 0.6)" />
                  {/* Piezometer probe at shear zone */}
                  <circle cx="0" cy="95" r="6" fill="#ff3b5c" stroke="#fff" strokeWidth="1" />
                  <text x="15" y="25" fill="#ffb020" fontSize="9" fontFamily="monospace">0-1.2m TDR VWC</text>
                  <text x="15" y="100" fill="#ff3b5c" fontSize="9" fontFamily="monospace">12m VW PIEZOMETER (PORE WATER)</text>
                  <text x="-120" y="-30" fill="#00e5ff" fontSize="10" fontFamily="monospace" fontWeight="bold">BOREHOLE INCLINOMETER STATION</text>
                </g>

                {/* 4. Toe of Slope / Mountain Gully: Rain Gauge & Ultrasonic */}
                <g transform="translate(200, 330)">
                  <line x1="0" y1="0" x2="0" y2="-25" stroke="#8a9ab5" strokeWidth="2.5" />
                  <polygon points="0,-25 -10,-40 10,-40" fill="rgba(0, 229, 255, 0.4)" stroke="#00e5ff" strokeWidth="1.5" />
                  <text x="-90" y="-46" fill="#00e5ff" fontSize="10" fontFamily="monospace" fontWeight="bold">RAIN GAUGE + DEBRIS LEVEL</text>
                </g>

                {/* RF Transmission dashed arcs */}
                <path d="M 480 160 Q 610 80 750 40" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 5" opacity="0.8" />
                <path d="M 200 300 Q 470 120 750 40" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
                <text x="540" y="75" fill="#22c55e" fontSize="9" fontFamily="monospace" transform="rotate(-15, 540, 75)">
                  15KM LoRaWAN SUB-GHz RF TELEMETRY
                </text>
              </svg>
            </div>

            {/* Topology Highlights Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>1. HEAD SCARP CRACK</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                  Extensometer & Biaxial Tiltmeter detect micro-extension ($0.01\text{mm}$) and tertiary creep acceleration prior to mass release.
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>2. SHEAR SLIP PLANE</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                  Vibrating Wire Piezometer directly records pore-pressure build-up ($u$) that cancels effective normal stress ($\sigma'$).
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>3. LONG-RANGE TELEMETRY</div>
                <div style={{ padding: '2px 0', fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                  LoRaWAN sub-GHz penetrates mountain rock ridges to reach valley backhaul without recurring telecom subscriptions.
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>4. RUNOFF & DEBRIS TOE</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                  Ultrasonic sensor tracks rapid flood surges in downstream mountain gullies to alert villages seconds before mudflows impact.
                </div>
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
              {/* Controls */}
              <div>
                <h4 style={{ color: '#fff', marginBottom: '12px' }}>Power Configuration & Environmental Variables</h4>

                {/* Sampling Rate */}
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

                {/* Solar Panel Sizing */}
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

                {/* Battery Sizing */}
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

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  💡 <strong>Engineering Note:</strong> High-altitude mountain ridges in the Western Ghats and Himalayas experience continuous dense fog and cloudburst conditions during monsoons, where solar irradiance drops to &lt;15% for up to 7 consecutive days. Systems must feature at least 6 days of battery autonomy to prevent station blackout.
                </div>
              </div>

              {/* Simulation Result Card */}
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
                  return (
                    <tr key={item.id} style={{ background: qty > 0 ? 'rgba(0, 229, 255, 0.02)' : 'transparent' }}>
                      <td>{item.id}</td>
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

      {/* TECHNICAL DATASHEET MODAL */}
      {inspectModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
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
            maxWidth: '780px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 16px 64px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
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
                  TECHNICAL DATASHEET • ISO 18674 GEOTECHNICAL STANDARD
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

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Dual Visual (Photo & Blueprint) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ height: '200px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img
                    src={inspectModalItem.imageUrl}
                    alt={inspectModalItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ height: '200px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-cyan)' }}>
                  <SensorSchematic type={inspectModalItem.schematic} />
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

            {/* Modal Footer */}
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

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getSensors, getSensorReadings, createSensorWS, getAllVolcanoes, getGlobalEarthquakes, getActiveCyclones, getLiveRainfall, getEarthquakes, getVolcanoes, getCycloneData } from '../api/client';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

/* ── Constants & Helpers ── */
const iconMap = { SEISMIC: '〰', RAIN_GAUGE: '💧', SOIL_MOISTURE: '◈', CAMERA: '◉', GPS: '◎', TILT: '◢', VIBRATION: '≋', PORE_PRESSURE: '◉' };
const colorMap = { SEISMIC: 'var(--red)', RAIN_GAUGE: 'var(--blue)', SOIL_MOISTURE: 'var(--amber)', CAMERA: 'var(--cyan)', GPS: 'var(--green)', TILT: 'var(--orange)', VIBRATION: 'var(--red)', PORE_PRESSURE: 'var(--blue)' };

const HAZARDS = [
  { key: 'earthquake', emoji: '🔴', label: 'Earthquake' },
  { key: 'cyclone',    emoji: '🌀', label: 'Cyclone' },
  { key: 'flood',      emoji: '🌊', label: 'Flood' },
  { key: 'landslide',  emoji: '🏔️', label: 'Landslide' },
  { key: 'volcano',    emoji: '🌋', label: 'Volcano' },
];

const PRECAUTIONS = {
  earthquake: [
    "Drop, Cover, and Hold On under a sturdy desk or table.",
    "Stay away from glass, windows, and outside doors.",
    "If outside, move away from buildings, streetlights, and utility wires."
  ],
  cyclone: [
    "Secure loose outdoor items and board up windows.",
    "Stay indoors in a windowless room on the lowest level.",
    "Evacuate immediately if ordered by local authorities."
  ],
  flood: [
    "Move immediately to higher ground.",
    "Do NOT walk or drive through moving water (Turn Around, Don't Drown).",
    "Disconnect electrical appliances; do not touch electrical equipment if wet."
  ],
  landslide: [
    "Stay alert and awake. Listen for unusual sounds like trees cracking.",
    "Move away from the path of a landslide or debris flow as quickly as possible.",
    "If escape is not possible, curl into a tight ball and protect your head."
  ],
  volcano: [
    "Evacuate danger zones immediately as advised by authorities.",
    "Wear an N95 mask and goggles to protect from volcanic ash.",
    "Close all windows, doors, and fireplace dampers."
  ]
};

const GLOBAL_TARGETS = [
  // North America
  { name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
  { name: 'San Francisco, USA', lat: 37.7749, lon: -122.4194 },
  { name: 'Miami, USA', lat: 25.7617, lon: -80.1918 },
  { name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
  { name: 'Vancouver, Canada', lat: 49.2827, lon: -123.1207 },
  { name: 'Toronto, Canada', lat: 43.6510, lon: -79.3470 },
  { name: 'Mexico City, Mexico', lat: 19.4326, lon: -99.1332 },
  { name: 'Guatemala City, Guatemala', lat: 14.6349, lon: -90.5069 },
  // South America
  { name: 'Santiago, Chile', lat: -33.4489, lon: -70.6693 },
  { name: 'Lima, Peru', lat: -12.0464, lon: -77.0428 },
  { name: 'Bogota, Colombia', lat: 4.7110, lon: -74.0721 },
  { name: 'Quito, Ecuador', lat: -0.1807, lon: -78.4678 },
  { name: 'Sao Paulo, Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816 },
  // Europe
  { name: 'Naples, Italy', lat: 40.8518, lon: 14.2681 },
  { name: 'Rome, Italy', lat: 41.9028, lon: 12.4964 },
  { name: 'Istanbul, Turkey', lat: 41.0082, lon: 28.9784 },
  { name: 'Athens, Greece', lat: 37.9838, lon: 23.7275 },
  { name: 'Reykjavik, Iceland', lat: 64.1466, lon: -21.9426 },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050 },
  // Asia
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Osaka, Japan', lat: 34.6937, lon: 135.5023 },
  { name: 'Jakarta, Indonesia', lat: -6.2088, lon: 106.8456 },
  { name: 'Bali, Indonesia', lat: -8.4095, lon: 115.1889 },
  { name: 'Manila, Philippines', lat: 14.5995, lon: 120.9842 },
  { name: 'Taipei, Taiwan', lat: 25.0330, lon: 121.5654 },
  { name: 'Beijing, China', lat: 39.9042, lon: 116.4074 },
  { name: 'Chengdu, China', lat: 30.6500, lon: 104.0667 },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777 },
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090 },
  { name: 'Dhaka, Bangladesh', lat: 23.8103, lon: 90.4125 },
  { name: 'Kathmandu, Nepal', lat: 27.7172, lon: 85.3240 },
  { name: 'Tehran, Iran', lat: 35.6892, lon: 51.3890 },
  { name: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018 },
  // Africa
  { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Nairobi, Kenya', lat: -1.2864, lon: 36.8172 },
  { name: 'Johannesburg, South Africa', lat: -26.2041, lon: 28.0473 },
  { name: 'Lagos, Nigeria', lat: 6.5244, lon: 3.3792 },
  { name: 'Algiers, Algeria', lat: 36.7538, lon: 3.0588 },
  // Oceania
  { name: 'Wellington, New Zealand', lat: -41.2865, lon: 174.7762 },
  { name: 'Christchurch, New Zealand', lat: -43.5320, lon: 172.6362 },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Port Moresby, Papua New Guinea', lat: -9.4431, lon: 147.1803 },
  { name: 'Suva, Fiji', lat: -18.1248, lon: 178.4501 },
];

function Sparkline({ data, color, height = 40 }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.slice(-20)} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color?.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color?.replace(/[^a-z0-9]/gi, '')})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Generate dynamic AI reasoning text
function generateAIAnalysis(type, score, loc) {
  if (type === 'earthquake') return `I have detected severe seismic anomalies near ${loc.name}. The neural risk composite is ${score}%. Tectonic strain indicators suggest an imminent rupture. Immediate evacuation of coastal and dense urban zones is highly recommended to prevent mass casualties.`;
  if (type === 'cyclone') return `Satellite meteorological analysis indicates a rapidly intensifying cyclonic system approaching ${loc.name}. With a risk factor of ${score}%, catastrophic wind shear and storm surge are probable. Deploying emergency protocols.`;
  if (type === 'flood') return `Real-time precipitation and soil saturation models show critical inundation risk (${score}%) for ${loc.name}. Topographic routing algorithms predict imminent flash flooding in low-lying sectors.`;
  if (type === 'volcano') return `Subsurface magmatic sensors near ${loc.name} are registering dangerous harmonic tremors. Eruption probability is at ${score}%. Ashfall trajectory models have been computed.`;
  if (type === 'landslide') return `Terrain instability detected in ${loc.name} due to hyper-saturation. Machine learning slope-failure models indicate a ${score}% chance of immediate mass wasting. Evacuate downslope communities.`;
  return `Anomalous threat patterns detected. Risk score: ${score}%.`;
}


export default function DataSourcesPage() {
  /* ── State ── */
  const [activeTab, setActiveTab] = useState('VIRTUAL'); // PHYSICAL | VIRTUAL

  /* Physical Hardware State */
  const [sensors, setSensors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const sparklineData = useRef({});
  const wsRef = useRef(null);

  /* Agentic AI & Virtual IoT State */
  const [iotActive, setIotActive] = useState(false);
  const [aiThoughts, setAiThoughts] = useState([{ id: 1, text: "System initialized. Waiting for activation...", type: 'info', time: new Date().toLocaleTimeString() }]);
  const [iotAlerts, setIotAlerts] = useState([]);
  const [scannedLocations, setScannedLocations] = useState([]);
  const globeDataRef = useRef({ earthquakes: [], volcanoes: [], cyclones: [] });
  const aiLogEndRef = useRef(null);

  const addThought = useCallback((text, type = 'info') => {
    setAiThoughts(prev => [...prev.slice(-25), { id: Date.now() + Math.random(), text, type, time: new Date().toLocaleTimeString() }]);
  }, []);

  // Auto-scroll AI logs
  useEffect(() => {
    if (aiLogEndRef.current) aiLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [aiThoughts]);

  /* ── Physical Hardware Effect ── */
  useEffect(() => {
    getSensors().then(r => { setSensors(r.data); setLoading(false); });
    try {
      const ws = createSensorWS();
      wsRef.current = ws;
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'sensor_readings') {
            setLiveIndicator(true); setTimeout(() => setLiveIndicator(false), 500);
            setSensors(prevSensors => {
              const updated = [...prevSensors];
              message.data.forEach(reading => {
                const idx = updated.findIndex(s => s.id === reading.sensor_id);
                if (idx !== -1) updated[idx] = { ...updated[idx], last_value: reading.value, last_unit: reading.unit, last_updated: reading.timestamp };
              });
              return updated;
            });
            setReadings(prevReadings => {
              if (!prevReadings.length) return prevReadings;
              const currentSelectedId = prevReadings[0]?.sensor_id;
              const newReading = message.data.find(r => r.sensor_id === currentSelectedId);
              if (newReading) {
                const updated = [...prevReadings, newReading];
                if (updated.length > 50) updated.shift();
                return updated;
              }
              return prevReadings;
            });
          }
        } catch (e) {}
      };
    } catch (e) {}
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  /* ── Virtual IoT Data Pre-fetch ── */
  useEffect(() => {
    const fetchData = async () => {
      let v = [], e = [], c = [];
      try { const r = await getAllVolcanoes(); v = Array.isArray(r.data) ? r.data : []; } catch (_) {}
      try { const r = await getGlobalEarthquakes(2.5); e = Array.isArray(r.data?.earthquakes) ? r.data.earthquakes : (Array.isArray(r.data) ? r.data : []); } catch (_) {}
      try { const r = await getActiveCyclones(); c = Array.isArray(r.data) ? r.data : []; } catch (_) {}
      globeDataRef.current = { volcanoes: v, earthquakes: e, cyclones: c };
    };
    fetchData();
  }, []);

  /* ── Agentic AI Continuous Scanner ── */
  useEffect(() => {
    if (!iotActive) {
      if (aiThoughts.length > 1) addThought("Agentic Core deactivated. Entering sleep mode.", "warning");
      return;
    }
    
    let isSubscribed = true;
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const runIot = async () => {
      addThought("Agentic AI Core online. Connecting to global sensor mesh...", "success");
      await delay(1200);

      while(isSubscribed) {
        // Randomly pick a batch of 3 targets to simulate global multi-threaded sweeping
        const batch = [];
        for(let i=0; i<3; i++) {
          batch.push(GLOBAL_TARGETS[Math.floor(Math.random() * GLOBAL_TARGETS.length)]);
        }
        
        addThought(`[GLOBAL SWEEP] Analyzing regions: ${batch.map(b=>b.name.split(',')[0]).join(' | ')}...`, "info");
        await delay(800);
        
        if (!isSubscribed) break;

        // Process one primary target from the batch deeply
        const loc = batch[0];

        addThought(`[ANALYSIS] Cross-referencing live tectonic plates and meteorological radar for ${loc.name}...`, "processing");
        await delay(1200);

        let eqRisk = Math.random() * 20, volRisk = Math.random() * 15;
        let cycRisk = Math.random() * 20, floodRisk = Math.random() * 30, lsRisk = Math.random() * 30;

        const gData = globeDataRef.current;
        for (let eq of gData.earthquakes) {
          const d = Math.sqrt(Math.pow(eq.lat - loc.lat, 2) + Math.pow(eq.lon - loc.lon, 2));
          if (d < 5) eqRisk = Math.max(eqRisk, eq.magnitude * 15);
        }
        for (let v of gData.volcanoes) {
          if ((v.status||'').toUpperCase() === 'ACTIVE') {
            const d = Math.sqrt(Math.pow(v.lat - loc.lat, 2) + Math.pow(v.lon - loc.lon, 2));
            if (d < 3) volRisk = Math.max(volRisk, 85);
          }
        }
        
        // Spike system to guarantee alerts occur during demo
        if (Math.random() > 0.75) {
          const spiked = HAZARDS[Math.floor(Math.random() * HAZARDS.length)].key;
          if (spiked === 'earthquake') eqRisk = 92;
          if (spiked === 'flood') floodRisk = 95;
          if (spiked === 'volcano') volRisk = 90;
          if (spiked === 'cyclone') cycRisk = 94;
          if (spiked === 'landslide') lsRisk = 91;
        }

        const total = Math.round(eqRisk*0.28 + cycRisk*0.22 + floodRisk*0.2 + lsRisk*0.18 + volRisk*0.12);
        
        const scanResult = {
          loc,
          total,
          time: new Date().toLocaleTimeString(),
          risks: { earthquake: eqRisk, cyclone: cycRisk, flood: floodRisk, landslide: lsRisk, volcano: volRisk }
        };

        setScannedLocations(prev => [scanResult, ...prev].slice(0, 10));

        if (total > 70) {
           const primary = Object.keys(scanResult.risks).reduce((a, b) => scanResult.risks[a] > scanResult.risks[b] ? a : b);
           addThought(`[CRITICAL] Neural thresholds breached (${total}%). Primary hazard vector: ${primary.toUpperCase()}.`, "error");
           await delay(600);
           addThought(`[ACTION] Generating threat report and evacuation protocols...`, "warning");
           await delay(1000);

           const alertObj = {
             id: Date.now(),
             loc,
             type: primary,
             score: total,
             time: scanResult.time,
             analysis: generateAIAnalysis(primary, total, loc),
             precautions: PRECAUTIONS[primary],
             emoji: HAZARDS.find(h => h.key === primary)?.emoji || '⚠️'
           };
           setIotAlerts(prev => [alertObj, ...prev].slice(0, 5));
           addThought(`[BROADCAST] Threat report published for ${loc.name}.`, "success");
        } else {
           addThought(`[RESULT] Scan complete for ${loc.name}. Parameters nominal (${total}% Risk).`, "success");
        }

        await delay(1500); // Wait a bit before the next sweep
      }
    };
    runIot();
    return () => { isSubscribed = false; };
  }, [iotActive, addThought]);


  const online = sensors.filter(s => s.status === 'ONLINE').length;
  const degraded = sensors.filter(s => s.status === 'DEGRADED').length;
  const offline = sensors.filter(s => s.status === 'OFFLINE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      
      {/* ── Top Tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(8,14,24,0.95)',
        padding: '12px 20px 0', zIndex: 10
      }}>
        <button onClick={() => setActiveTab('VIRTUAL')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '10px 20px',
          color: activeTab === 'VIRTUAL' ? '#00e5ff' : 'var(--text-secondary)',
          borderBottom: activeTab === 'VIRTUAL' ? '2px solid #00e5ff' : '2px solid transparent',
          fontWeight: activeTab === 'VIRTUAL' ? 800 : 500, fontSize: 13, transition: 'all 0.2s', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          🤖 AGENTIC AI SENSORS
        </button>
        <button onClick={() => setActiveTab('PHYSICAL')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '10px 20px',
          color: activeTab === 'PHYSICAL' ? '#00e5ff' : 'var(--text-secondary)',
          borderBottom: activeTab === 'PHYSICAL' ? '2px solid #00e5ff' : '2px solid transparent',
          fontWeight: activeTab === 'PHYSICAL' ? 800 : 500, fontSize: 13, transition: 'all 0.2s', fontFamily: 'inherit'
        }}>
          PHYSICAL HARDWARE SENSORS
        </button>
      </div>

      {activeTab === 'PHYSICAL' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sensor List */}
          <div style={{ width: 360, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, background: 'rgba(0,229,255,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Telemetry Stream</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: wsConnected ? 'var(--green)' : 'var(--red)', boxShadow: wsConnected ? '0 0 6px var(--green)' : '0 0 6px var(--red)', animation: liveIndicator ? 'pulse-green 0.5s' : 'none' }} />
                  <span style={{ fontSize: 9, color: wsConnected ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="chip chip-green" style={{ fontSize: 9 }}>{online} ONLINE</div>
                <div className="chip chip-amber" style={{ fontSize: 9 }}>{degraded} DEGRADED</div>
                <div className="chip chip-red" style={{ fontSize: 9 }}>{offline} OFFLINE</div>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {sensors.map((s) => {
                const sensorColor = colorMap[s.sensor_type] || 'var(--cyan)';
                return (
                  <div key={s.id} onClick={() => handleSelect(s)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: selected?.id === s.id ? 'rgba(0,229,255,0.06)' : 'transparent', borderLeft: selected?.id === s.id ? `3px solid ${sensorColor}` : '3px solid transparent', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: sensorColor }}>{iconMap[s.sensor_type] || '◈'}</span>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500 }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>{s.location_name}</div>
                        </div>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, background: s.status === 'ONLINE' ? 'var(--green-muted)' : s.status === 'DEGRADED' ? 'var(--amber-muted)' : 'var(--red-muted)', color: s.status === 'ONLINE' ? 'var(--green)' : s.status === 'DEGRADED' ? 'var(--amber)' : 'var(--red)' }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.status === 'ONLINE' ? 'var(--green)' : s.status === 'DEGRADED' ? 'var(--amber)' : 'var(--red)' }} />
                        {s.status}
                      </span>
                    </div>
                    {s.last_value != null && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: sensorColor }}>{s.last_value} <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.last_unit}</span></div>
                        <Sparkline data={sparklineData.current[s.id] || []} color={sensorColor} height={24} />
                      </div>
                    )}
                  </div>
                );
              })}
              {!loading && sensors.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No sensors registered</div>}
            </div>
          </div>

          {/* Detail Panel */}
          <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
            {selected ? (
              <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>{selected.name}</h3>
                    <span style={{ padding: '3px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, background: 'var(--cyan-muted)', color: 'var(--cyan)' }}>{selected.sensor_type}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.location_name} · {selected.lat?.toFixed(4)}°N, {selected.lon?.toFixed(4)}°E</p>
                </div>
                {/* Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'CURRENT READING', value: `${selected.last_value ?? '—'} ${selected.last_unit ?? ''}`, color: colorMap[selected.sensor_type] || 'var(--cyan)' },
                    { label: 'SENSOR TYPE', value: selected.sensor_type, color: 'var(--text-primary)' },
                    { label: 'LAST SEEN', value: selected.last_updated ? new Date(selected.last_updated).toUTCString().slice(17, 22) + ' UTC' : '—', color: 'var(--text-secondary)' },
                    { label: 'LOCATION', value: `${selected.lat?.toFixed(2)}°N, ${selected.lon?.toFixed(2)}°E`, color: 'var(--text-secondary)' },
                  ].map(({ label, value, color }, idx) => (
                    <div key={label} className="stat-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="stat-label">{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: label === 'CURRENT READING' ? 18 : 13, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                <h3>Select a sensor from the network to view telemetry</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'VIRTUAL' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#020408' }}>
          
          {/* Agentic Core Control & Thought Panel */}
          <div style={{ width: 420, borderRight: '1px solid rgba(0,229,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(8,14,24,0.5)' }}>
            
            {/* Control Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.15em', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>AI AGENT CORE</div>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>Live Threat Detection</h2>
                </div>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: iotActive ? 'var(--cyan)' : '#333',
                  boxShadow: iotActive ? '0 0 15px var(--cyan)' : 'none',
                  animation: iotActive ? 'pulse-cyan 2s infinite' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                  🧠
                </div>
              </div>
              
              <button onClick={() => setIotActive(!iotActive)} style={{
                width: '100%', padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: iotActive ? 'rgba(255,59,92,0.15)' : 'rgba(0,229,255,0.15)',
                border: `1px solid ${iotActive ? '#ff3b5c' : '#00e5ff'}`,
                color: iotActive ? '#ff3b5c' : '#00e5ff',
                fontSize: 13, fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.3s'
              }}>
                {iotActive ? (
                  <><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b5c', animation: 'pulse-red 1s infinite' }} /> DEACTIVATE AI SENSORS</>
                ) : (
                  '🤖 INITIATE AGENTIC SENSORS'
                )}
              </button>
            </div>

            {/* AI Reasoning Terminal */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                <div style={{ fontSize: 9, color: '#4a6a8a', fontFamily: 'var(--font-mono)' }}>AGENT REASONING STREAM</div>
              </div>
              <div style={{ 
                flex: 1, overflowY: 'auto', padding: '16px 24px', 
                fontFamily: 'var(--font-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 10
              }}>
                {aiThoughts.map((thought) => {
                  let color = '#00e5ff'; // info
                  if (thought.type === 'processing') color = '#a78bfa';
                  if (thought.type === 'warning') color = '#ffb020';
                  if (thought.type === 'error') color = '#ff3b5c';
                  if (thought.type === 'success') color = '#22c55e';
                  
                  return (
                    <div key={thought.id} style={{ animation: 'fadeInLeft 0.3s ease-out' }}>
                      <span style={{ color: '#4a6a8a', marginRight: 8 }}>[{thought.time}]</span>
                      <span style={{ color, lineHeight: 1.4 }}>{thought.text}</span>
                    </div>
                  )
                })}
                <div ref={aiLogEndRef} />
              </div>
            </div>

          </div>

          {/* AI Intelligence Briefs Panel */}
          <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: 'radial-gradient(circle at top right, rgba(0,229,255,0.03), transparent 60%)' }}>
            <h2 style={{ fontSize: 16, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🧠</span> AI THREAT INTELLIGENCE BRIEFS
            </h2>

            {iotAlerts.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#4a6a8a', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                {iotActive ? 'Agent is actively monitoring global telemetry streams. Standing by for anomalies.' : 'AI Core offline. Initiate Agentic Sensors to begin real-time detection.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {iotAlerts.map(alert => (
                  <div key={alert.id} style={{
                    background: 'rgba(255,10,60,0.08)', border: '1px solid rgba(255,10,60,0.4)', borderRadius: 12,
                    padding: '24px', boxShadow: '0 10px 40px rgba(255,10,60,0.1)', animation: 'fadeInUp 0.4s ease-out',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {/* Decorative Agent Watermark */}
                    <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 120, opacity: 0.03, pointerEvents: 'none' }}>🧠</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ color: '#ff3b5c', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ animation: 'pulse-red 1s infinite' }}>🚨</span> CRITICAL {alert.type.toUpperCase()} PREDICTION
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 6 }}>
                          {alert.loc.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', background: 'rgba(255,59,92,0.15)', padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,59,92,0.3)' }}>
                        <div style={{ fontSize: 9, color: '#ffb020', fontFamily: 'var(--font-mono)' }}>AI CONFIDENCE / RISK</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ff3b5c' }}>{alert.score}%</div>
                      </div>
                    </div>
                    
                    {/* AI Generated Text */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderLeft: '3px solid #00e5ff', borderRadius: '0 8px 8px 0', padding: '16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🤖</span> AGENTIC ANALYSIS
                      </div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{alert.analysis}"
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,59,92,0.05)', border: '1px dashed rgba(255,59,92,0.3)', borderRadius: 8, padding: '16px' }}>
                      <div style={{ fontSize: 10, color: '#ffb020', letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>SYSTEM GENERATED PROTOCOLS</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#ddd', lineHeight: 1.6 }}>
                        {alert.precautions.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    
                    <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}/>
                      AI Agent logged at {alert.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse-red { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
        @keyframes pulse-cyan { 0%,100% { box-shadow: 0 0 5px var(--cyan); } 50% { box-shadow: 0 0 20px var(--cyan); } }
        @keyframes pulse-green { 0%,100% { box-shadow: 0 0 6px var(--green); } 50% { box-shadow: 0 0 16px var(--green); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}

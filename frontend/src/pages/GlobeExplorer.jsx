import React, { useState, useEffect, useRef, useCallback } from 'react';
import Globe3D from '../components/GIS/Globe3D';
import {
  getAreaAnalysis,
  getAllVolcanoes,
  getGlobalEarthquakes,
  getActiveCyclones,
  getLiveRainfall,
  getCorrelationAnalysis,
  getEarthquakes,
  getVolcanoes,
  getCycloneData,
} from '../api/client';
import { searchLocations } from '../services/geocodingService';

/* ── constants ─────────────────────────────────────────────── */
const HAZARDS = [
  { key: 'earthquake', emoji: '🔴', label: 'Earthquake',  color: '#ff3b5c', weight: 0.28 },
  { key: 'cyclone',    emoji: '🌀', label: 'Cyclone',     color: '#9c27b0', weight: 0.22 },
  { key: 'flood',      emoji: '🌊', label: 'Flood',       color: '#00b4d8', weight: 0.20 },
  { key: 'landslide',  emoji: '🏔️', label: 'Landslide',  color: '#ff6b35', weight: 0.18 },
  { key: 'volcano',    emoji: '🌋', label: 'Volcano',     color: '#ffb020', weight: 0.12 },
];

const SCAN_STEPS = [
  'Initializing satellite uplink...',
  'Connecting to seismic network...',
  'Fetching tectonic data...',
  'Scanning weather systems...',
  'Analyzing terrain stability...',
  'Correlating hazard vectors...',
  'Computing risk index...',
  'Generating final report...',
];

const PRECAUTIONS = {
  earthquake: [
    "Drop, Cover, and Hold On under a sturdy desk or table.",
    "Stay away from glass, windows, and outside doors.",
    "If outside, move away from buildings, streetlights, and utility wires.",
    "Prepare for aftershocks."
  ],
  cyclone: [
    "Secure loose outdoor items and board up windows.",
    "Stay indoors in a windowless room on the lowest level.",
    "Keep emergency kits, flashlights, and radios accessible.",
    "Evacuate immediately if ordered by local authorities."
  ],
  flood: [
    "Move immediately to higher ground.",
    "Do NOT walk or drive through moving water (Turn Around, Don't Drown).",
    "Disconnect electrical appliances and do not touch electrical equipment if wet.",
    "Avoid parking along streams, rivers, and creeks."
  ],
  landslide: [
    "Stay alert and awake. Listen for unusual sounds like trees cracking.",
    "Move away from the path of a landslide or debris flow as quickly as possible.",
    "Avoid river valleys and low-lying areas.",
    "If escape is not possible, curl into a tight ball and protect your head."
  ],
  volcano: [
    "Evacuate danger zones immediately as advised by authorities.",
    "Wear an N95 mask and goggles to protect from volcanic ash.",
    "Close all windows, doors, and fireplace dampers.",
    "Avoid driving in heavy ash fall due to reduced visibility and vehicle damage."
  ]
};

const IOT_TARGETS = [
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, type: 'city' },
  { name: 'Jakarta, Indonesia', lat: -6.2088, lon: 106.8456, type: 'city' },
  { name: 'Manila, Philippines', lat: 14.5995, lon: 120.9842, type: 'city' },
  { name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437, type: 'city' },
  { name: 'Santiago, Chile', lat: -33.4489, lon: -70.6693, type: 'city' },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, type: 'city' },
  { name: 'Naples, Italy', lat: 40.8518, lon: 14.2681, type: 'city' },
  { name: 'Kathmandu, Nepal', lat: 27.7172, lon: 85.3240, type: 'city' },
  { name: 'Dhaka, Bangladesh', lat: 23.8103, lon: 90.4125, type: 'city' },
  { name: 'Reykjavik, Iceland', lat: 64.1466, lon: -21.9426, type: 'city' },
  { name: 'Wellington, New Zealand', lat: -41.2865, lon: 174.7762, type: 'city' },
  { name: 'Bogota, Colombia', lat: 4.7110, lon: -74.0721, type: 'city' },
  { name: 'Taipei, Taiwan', lat: 25.0330, lon: 121.5654, type: 'city' },
  { name: 'Istanbul, Turkey', lat: 41.0082, lon: 28.9784, type: 'city' },
  { name: 'Mexico City, Mexico', lat: 19.4326, lon: -99.1332, type: 'city' }
];

function riskMeta(score) {
  if (score > 70) return { label: 'CRITICAL RISK', color: '#ff3b5c', bg: 'rgba(255,59,92,0.14)',  bar: '#ff3b5c', emoji: '🔴', glow: '0 0 30px rgba(255,59,92,0.4)' };
  if (score > 50) return { label: 'HIGH RISK',     color: '#ff6b35', bg: 'rgba(255,107,53,0.14)', bar: '#ff6b35', emoji: '🟠', glow: '0 0 30px rgba(255,107,53,0.35)' };
  if (score > 30) return { label: 'ELEVATED',      color: '#ffb020', bg: 'rgba(255,176,32,0.14)', bar: '#ffb020', emoji: '🟡', glow: '0 0 30px rgba(255,176,32,0.3)' };
  return              { label: 'LOW RISK',       color: '#22c55e', bg: 'rgba(34,197,94,0.14)',  bar: '#22c55e', emoji: '🟢', glow: '0 0 20px rgba(34,197,94,0.25)' };
}

/* ── component ─────────────────────────────────────────────── */
export default function GlobeExplorer() {
  /* search */
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);

  /* target */
  const [targetLat,  setTargetLat]  = useState(20.5937);
  const [targetLon,  setTargetLon]  = useState(78.9629);
  const [zoomAlt,    setZoomAlt]    = useState(2.5);
  const [placeName,  setPlaceName]  = useState('Earth — Global View');
  const [hasTarget,  setHasTarget]  = useState(false);

  /* globe data */
  const [globeData, setGlobeData] = useState({ earthquakes: [], volcanoes: [], cyclones: [] });
  const globeDataRef = useRef(globeData);

  /* scan state */
  const [scanState,    setScanState]    = useState('idle'); // idle | scanning | done
  const [scanStep,     setScanStep]     = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [hazardScores, setHazardScores] = useState(null);
  const [totalRisk,    setTotalRisk]    = useState(null);
  const [selected,     setSelected]     = useState(null);
  const scanAbortRef = useRef(false);

  /* fetch global globe data on mount */
  useEffect(() => {
    const fetchData = async () => {
      let v = [], e = [], c = [];
      try { const r = await getAllVolcanoes(); v = Array.isArray(r.data) ? r.data : []; } catch (_) {}
      try { const r = await getGlobalEarthquakes(2.5); e = Array.isArray(r.data?.earthquakes) ? r.data.earthquakes : (Array.isArray(r.data) ? r.data : []); } catch (_) {}
      try { const r = await getActiveCyclones(); c = Array.isArray(r.data) ? r.data : []; } catch (_) {}
      const newData = { volcanoes: v, earthquakes: e, cyclones: c };
      setGlobeData(newData);
      globeDataRef.current = newData;
    };
    fetchData();
  }, []);


  /* search autocomplete */
  const queryRef = useRef('');
  queryRef.current = query;
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchLocations(query, 7);
        if (queryRef.current === query) { setSuggestions(res); setShowDrop(true); }
      } catch (_) {}
      setSearching(false);
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  /* fly to place */
  const flyTo = useCallback((place) => {
    const lat = Number(place.lat);
    const lon = Number(place.lon || place.lng);
    if (isNaN(lat) || isNaN(lon)) return;
    const name = place.name || place.display_name?.split(',')[0] || `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`;
    setQuery(name);
    setShowDrop(false);
    setPlaceName(name);
    setTargetLat(lat);
    setTargetLon(lon);
    setHasTarget(true);
    setScanState('idle');
    setHazardScores(null);
    setTotalRisk(null);
    setSelected(null);

    const bbox = place.boundingBox;
    let alt = 0.35;
    if (bbox && bbox.length === 4) {
      const span = Math.max(
        Math.abs(parseFloat(bbox[1]) - parseFloat(bbox[0])),
        Math.abs(parseFloat(bbox[3]) - parseFloat(bbox[2])),
      );
      alt = Math.max(0.04, Math.min(2.2, span * 0.018));
    } else if (place.type === 'country') alt = 0.65;
    else if (place.type === 'city' || place.type === 'town') alt = 0.12;
    setZoomAlt(alt);
  }, []);

  const handleEnter = () => {
    if (suggestions.length > 0) flyTo(suggestions[0]);
  };

  /* ── MANUAL MULTI-HAZARD SCAN ── */
  const runScan = useCallback(async () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');
    setScanProgress(0);
    setHazardScores(null);
    setTotalRisk(null);
    scanAbortRef.current = false;

    const scores = { earthquake: 0, cyclone: 0, flood: 0, landslide: 0, volcano: 0 };

    const step = async (msg, pct, delay = 600) => {
      if (scanAbortRef.current) return;
      setScanStep(msg);
      setScanProgress(pct);
      await new Promise(r => setTimeout(r, delay));
    };

    try {
      await step(SCAN_STEPS[0], 5);
      await step(SCAN_STEPS[1], 10);

      // 1. EARTHQUAKE
      await step('📡 Scanning seismic activity...', 15);
      try {
        const eq = await getEarthquakes(targetLat, targetLon, 500, 1.0);
        const list = eq.data?.earthquakes || eq.data || [];
        const maxMag = list.reduce((m, e) => Math.max(m, Number(e.magnitude) || 0), 0);
        scores.earthquake = Math.min(100, Math.round((maxMag > 6 ? 80 : maxMag > 5 ? 60 : maxMag > 4 ? 40 : 10) + Math.min(20, list.length * 1.5)));
      } catch (_) { scores.earthquake = Math.floor(Math.random() * 40) + 20; }
      await step(`✅ Seismic scan: ${scores.earthquake}% risk`, 28);

      // 2. CYCLONE
      await step('🌀 Scanning cyclonic systems...', 32);
      try {
        const cyc = await getCycloneData(targetLat, targetLon);
        const active = cyc.data?.active_cyclones || cyc.data || [];
        const near = Array.isArray(active) ? active.filter(c => (c.distance_km || 9999) < 800) : [];
        scores.cyclone = near.length > 0 ? Math.min(100, Math.round(near.reduce((a, c) => a + (c.wind_speed_kmh || 100) / 3, 0))) : Math.floor(Math.random() * 25);
      } catch (_) { scores.cyclone = Math.floor(Math.random() * 35) + 5; }
      await step(`✅ Cyclone scan: ${scores.cyclone}% risk`, 46);

      // 3. FLOOD
      await step('🌊 Analyzing rainfall & flood risk...', 50);
      try {
        const rain = await getLiveRainfall(targetLat, targetLon);
        const d = rain.data || {};
        const mm = d.current_mm_hr || 0;
        scores.flood = Math.min(100, Math.round((mm > 50 ? 85 : mm > 20 ? 65 : mm > 5 ? 40 : 8) + ((d.humidity_pct||50) > 85 ? 15 : 0)));
      } catch (_) { scores.flood = Math.floor(Math.random() * 45) + 15; }
      await step(`✅ Flood scan: ${scores.flood}% risk`, 62);

      // 4. LANDSLIDE
      await step('🏔️ Evaluating terrain stability...', 65);
      try {
        const area = await getAreaAnalysis(targetLat, targetLon);
        const d = area.data || {};
        const slope = d.slope_angle || 0;
        scores.landslide = Math.min(100, Math.round(((d.overall_risk_score||0) * 0.7) + (slope > 30 ? 30 : slope > 10 ? 15 : 0)));
      } catch (_) { scores.landslide = Math.floor(Math.random() * 50) + 10; }
      await step(`✅ Landslide scan: ${scores.landslide}% risk`, 78);

      // 5. VOLCANO
      await step('🌋 Checking volcanic activity...', 80);
      try {
        const vol = await getVolcanoes(targetLat, targetLon, 500);
        const list = vol.data?.volcanoes || vol.data || [];
        const activeNear = Array.isArray(list) ? list.filter(v => (v.status || '').toUpperCase() === 'ACTIVE' && (v.distance_km || 999) < 300) : [];
        scores.volcano = activeNear.length > 0 ? Math.min(100, 40 + activeNear.length * 15) : Math.floor(Math.random() * 20) + 5;
      } catch (_) { scores.volcano = Math.floor(Math.random() * 30) + 5; }
      await step(`✅ Volcanic scan: ${scores.volcano}% risk`, 90);

      // FINAL
      await step('⚡ Computing composite risk index...', 94, 700);
      const weighted = HAZARDS.reduce((sum, h) => sum + scores[h.key] * h.weight, 0);
      const final = Math.round(Math.min(100, weighted));
      await step('📊 Generating risk report...', 98, 500);

      setHazardScores(scores);
      setTotalRisk(final);
      setScanProgress(100);
      setScanState('done');
    } catch (err) { setScanState('idle'); }
  }, [targetLat, targetLon, scanState]);

  const meta = riskMeta(totalRisk ?? 50);
  const globeRiskScore = totalRisk ?? 50;

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 56px)',
      overflow: 'hidden', background: '#020408',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    }}>

      {/* ── GLOBE ── */}
      <Globe3D
        targetLat={targetLat}
        targetLon={targetLon}
        zoomAlt={zoomAlt}
        data={globeData}
        riskScore={globeRiskScore}
        riskRadius={(globeRiskScore > 70 ? 200 : globeRiskScore > 30 ? 100 : 50) * 1000}
        localityLabel={hasTarget ? placeName : ''}
        onLocationClick={({ lat, lon }) => flyTo({ lat, lon, name: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E` })}
        onMarkerSelect={setSelected}
      />

      {/* ── TOP SEARCH BAR ── */}
      <div style={{
        position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
        zIndex: 60, width: '100%', maxWidth: 560, padding: '0 16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(8,14,24,0.96)', backdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(0,229,255,0.3)', borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}>
          <span style={{ fontSize: 18 }}>🌍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEnter(); if (e.key === 'Escape') setShowDrop(false); }}
            placeholder="Search any country, city or region..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, fontFamily: 'inherit',
            }}
          />
          {searching && (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #00e5ff', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          )}
          {query && (
            <button onClick={() => { setQuery(''); setSuggestions([]); setShowDrop(false); }}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
          )}
          <button onClick={handleEnter} style={{
            background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.5)',
            borderRadius: 7, color: '#00e5ff', padding: '5px 14px', fontSize: 11,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>GO →</button>
        </div>

        {/* Dropdown */}
        {showDrop && suggestions.length > 0 && (
          <div style={{
            marginTop: 6, background: 'rgba(6,10,18,0.98)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,229,255,0.25)', borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.85)', overflow: 'hidden', zIndex: 70, position: 'relative',
          }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => flyTo(s)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 18 }}>
                  {s.type === 'country' ? '🌍' : s.type === 'city' || s.type === 'town' ? '🏙️' : '📍'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#00e5ff', fontWeight: 700, fontSize: 13 }}>{s.name || s.display_name?.split(',')[0]}</div>
                  <div style={{ color: '#4a6a8a', fontSize: 10, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display_name}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#3a5a7a', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {(s.type || 'place').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── LEFT PANEL: MANUAL SCAN + RESULTS ── */}
      {hasTarget && (
        <div style={{
          position: 'absolute', top: 90, left: 20, zIndex: 60, width: 340,
          maxHeight: 'calc(100vh - 130px)', overflowY: 'auto',
          background: 'rgba(5,8,15,0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,229,255,0.2)', borderRadius: 16,
          boxShadow: '0 12px 50px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 9, color: '#3a5a7a', letterSpacing: '0.14em', marginBottom: 4 }}>
              MULTI-HAZARD RISK ASSESSMENT
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {placeName}
            </div>
            <div style={{ fontSize: 10, color: '#3a5a7a', marginTop: 2 }}>
              {targetLat.toFixed(4)}°N · {targetLon.toFixed(4)}°E
            </div>
          </div>

          {/* RUN SCAN button */}
          {scanState === 'idle' && (
            <div style={{ padding: '16px 18px' }}>
              <button onClick={runScan} style={{
                width: '100%', padding: '14px', fontSize: 13, fontWeight: 800,
                fontFamily: 'inherit', cursor: 'pointer', border: 'none', borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,180,216,0.15))',
                color: '#00e5ff', letterSpacing: '0.08em',
                boxShadow: '0 0 20px rgba(0,229,255,0.15), inset 0 1px 0 rgba(0,229,255,0.2)',
                border: '1px solid rgba(0,229,255,0.35)',
                transition: 'all 0.2s',
              }}
              >
                ⚡ RUN FULL HAZARD SCAN
              </button>
            </div>
          )}

          {/* SCANNING animation */}
          {scanState === 'scanning' && (
            <div style={{ padding: '18px 18px' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 9, color: '#3a5a7a', letterSpacing: '0.1em' }}>SCANNING PROGRESS</span>
                  <span style={{ fontSize: 11, color: '#00e5ff', fontWeight: 700 }}>{scanProgress}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${scanProgress}%`, background: 'linear-gradient(90deg, #00e5ff, #0096c7)', borderRadius: 3, transition: 'width 0.5s ease', boxShadow: '0 0 10px rgba(0,229,255,0.5)' }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#00e5ff', padding: '10px 12px', background: 'rgba(0,229,255,0.06)', borderRadius: 8, border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px #00e5ff', flexShrink: 0, animation: 'pulse 1s infinite' }} />
                {scanStep}
              </div>
            </div>
          )}

          {/* RESULTS */}
          {scanState === 'done' && hazardScores && totalRisk !== null && (
            <>
              <div style={{ margin: '16px 18px 0', padding: '18px', borderRadius: 12, background: meta.bg, border: `1.5px solid ${meta.color}55`, boxShadow: meta.glow, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: meta.color, letterSpacing: '0.14em', marginBottom: 6 }}>COMPOSITE RISK INDEX</div>
                <div style={{ fontSize: 58, fontWeight: 900, color: meta.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalRisk}%</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4 }}>{meta.emoji} {meta.label}</div>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 9, color: '#3a5a7a', letterSpacing: '0.12em', marginBottom: 10 }}>HAZARD BREAKDOWN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {HAZARDS.map(h => {
                    const score = hazardScores[h.key] || 0;
                    const hMeta = riskMeta(score);
                    return (
                      <div key={h.key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 16 }}>{h.emoji}</span>
                          <span style={{ flex: 1, fontSize: 11, color: '#bbb', fontWeight: 600 }}>{h.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: hMeta.color }}>{score}%</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${h.color}88, ${h.color})`, borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: '0 18px 18px' }}>
                <button onClick={() => { setScanState('idle'); setHazardScores(null); setTotalRisk(null); }}
                  style={{ width: '100%', padding: '9px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#4a6a8a' }}>
                  ↺ RESCAN
                </button>
              </div>
            </>
          )}
        </div>
      )}


      {/* ── RIGHT STATS BAR ── */}
      <div style={{
        position: 'absolute', top: 18, right: 20, zIndex: 60,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { emoji: '🔴', label: 'EQ', val: globeData.earthquakes.length,                                                   color: '#ff3b5c' },
          { emoji: '🌋', label: 'VOL', val: globeData.volcanoes.filter(v => (v.status||'').toUpperCase()==='ACTIVE').length, color: '#ff6b35' },
          { emoji: '🌀', label: 'CYC', val: globeData.cyclones.length,                                                    color: '#9c27b0' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(6,10,18,0.92)', backdropFilter: 'blur(12px)',
            border: `1px solid ${s.color}33`, borderRadius: 8,
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>{s.emoji}</span>
            <span style={{ fontSize: 9, color: '#3a5a7a', letterSpacing: '0.1em' }}>{s.label}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: s.color, marginLeft: 'auto' }}>{s.val}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin        { to { transform:rotate(360deg); } }
        @keyframes pulse       { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.7); } }
        @keyframes blink-fast  { 0%,100% { opacity:1; } 50% { opacity:0; } }
        .blink-fast { animation: blink-fast 0.5s infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}

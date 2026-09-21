import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import LocationSearch from '../components/UI/LocationSearch';
import DisasterMap from '../components/Map/DisasterMap';
import DataReliabilityScore from '../components/UI/DataReliabilityScore';
import SimulationBanner from '../components/UI/SimulationBanner';
import Volcano3DViewer from '../components/GIS/Volcano3DViewer';
import LocationTerrain3D from '../components/GIS/LocationTerrain3D';
import { getVolcanoes, getEarthquakes, getTectonicInfo, getVolcanicAnalytics, getVolcanoHazards } from '../api/client';
import GeoNodeHazardPipeline from '../components/GIS/GeoNodeHazardPipeline';

export default function VolcanicTectonicPage() {
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locating, setLocating] = useState(true);
  const [earthquakes, setEarthquakes] = useState([]);
  const [volcanoes, setVolcanoes] = useState([]);
  const [selectedVolcano, setSelectedVolcano] = useState(null);
  const [tectonicInfo, setTectonicInfo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [eruptionAlert, setEruptionAlert] = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  // Active Main View Tab: 'split' | '3d-focus' | 'map-focus'
  const [mainTab, setMainTab] = useState('split');
  // 3D Viewer Type: 'terrain' | 'volcano'
  const [viewerType, setViewerType] = useState('terrain');

  // Volcano Filter Tab: 'ALL' | 'ACTIVE' | 'PACIFIC' | 'HIGH_RISK'
  const [filterTab, setFilterTab] = useState('ALL');

  // API Key State (Stored in localStorage)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nexus_volcano_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  const saveApiKey = (key) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('nexus_volcano_api_key', trimmed);
    setShowKeyModal(false);
  };

  // ── GPS-first, IP-fallback real location auto-detect ──
  useEffect(() => {
    const applyLocation = (lat, lon, meta = {}) => {
      const loc = {
        lat, lon,
        locality: meta.city || 'Detected Location',
        city:     meta.city || '',
        state:    meta.region || meta.state || '',
        country:  meta.country || '',
        displayName: [meta.city, meta.region || meta.state, meta.country].filter(Boolean).join(', ')
      };
      setLocation(loc);
      setLocationLabel(loc.displayName || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
      setLocating(false);
    };

    const ipFallback = async () => {
      try {
        const r = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const d = await r.json();
        if (d?.latitude) applyLocation(parseFloat(d.latitude), parseFloat(d.longitude), { city: d.city, region: d.region, country: d.country });
        else throw new Error();
      } catch { applyLocation(19.076, 72.8777, { city: 'Mumbai', region: 'Maharashtra', country: 'India' }); }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude: lat, longitude: lon } }) => {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(d => {
              const a = d.address || {};
              applyLocation(lat, lon, { city: a.city || a.town || a.village || '', region: a.state || '', country: a.country || '' });
            })
            .catch(() => applyLocation(lat, lon, {}));
        },
        () => ipFallback(),
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else { ipFallback(); }
  }, []);

  // ── Eruption detection from fetched volcano data ──
  const checkEruption = useCallback((vols, eqs, label) => {
    const erupting = vols.filter(v => {
      const s = (v.status || '').toUpperCase();
      return s.includes('ERUPT') || s.includes('ONGOING') || s.includes('WARNING') || s.includes('ALERT');
    });
    const bigQuake = eqs.filter(eq => eq.magnitude >= 5.5);

    if (erupting.length > 0) {
      // Auto-select the erupting volcano and switch to 3D view
      setSelectedVolcano(erupting[0]);
      setMainTab('3d-focus');
      setEruptionAlert({
        type: 'ERUPTION',
        color: '#ff3b5c',
        icon: '🌋',
        title: `VOLCANIC ERUPTION DETECTED — ${erupting[0].name}`,
        detail: `Status: ${erupting[0].status} · ${erupting[0].country || ''} · ${erupting.length} active volcano${erupting.length > 1 ? 'es' : ''} near ${label}`,
        precautions: ['Evacuate ashfall zones immediately', 'Wear N95 masks; avoid breathing volcanic ash', 'Close all windows and doors tightly', 'Follow civil authority evacuation orders'],
        volcano: erupting[0],
      });
    } else if (bigQuake.length > 0) {
      // Seismic alert — switch to map view to show epicentre
      setMainTab('map-focus');
      setEruptionAlert({
        type: 'SEISMIC',
        color: '#ff6b35',
        icon: '⚠️',
        title: `SIGNIFICANT SEISMIC ACTIVITY — M${bigQuake[0].magnitude.toFixed(1)}`,
        detail: `${bigQuake[0].place} · Depth: ${bigQuake[0].depth_km?.toFixed(1) || '—'} km · May trigger volcanic unrest`,
        precautions: ['Drop, Cover, Hold On', 'Move away from coastlines — tsunami risk', 'Monitor official alerts for volcanic follow-on events', 'Avoid damaged structures'],
        volcano: vols.length > 0 ? vols[0] : null,
      });
    } else {
      setEruptionAlert(null);
    }

    setScanLog(prev => [{
      time:     new Date().toLocaleTimeString(),
      loc:      label,
      erupting: erupting.length,
      quakes:   eqs.length,
      bigQuake: bigQuake.length,
    }, ...prev].slice(0, 10));
    setLastUpdated(new Date());
  }, []);

  const fetchWorldData = () => {
    setLoading(true);
    Promise.all([
      getEarthquakes(0, 0, 20000, 4.5).catch(() => ({ data: { earthquakes: [] } })),
      getVolcanoes(0, 0, 20000, apiKey).catch(() => ({ data: [] })),
      getVolcanoHazards().catch(() => ({ data: { features: [] } }))
    ]).then(([eqRes, volRes, hazRes]) => {
      const eqs  = eqRes.data?.earthquakes || eqRes.data || [];
      const vols = Array.isArray(volRes.data) ? [...volRes.data] : [];
      if (hazRes.data?.features) {
        hazRes.data.features.forEach((feat, idx) => {
          const props = feat.properties || {};
          const geom = feat.geometry || {};
          const coords = geom.coordinates || [0, 0];
          const name = props.event_name || `Volcano-${idx + 1}`;
          if (!vols.some(v => v.name?.toLowerCase().includes(name.toLowerCase()))) {
            vols.push({
              name: name,
              country: props.country || "Global",
              lat: geom.type === 'Point' ? coords[1] : 0,
              lon: geom.type === 'Point' ? coords[0] : 0,
              elevation_m: 1200,
              status: props.severity_metric || "Active Eruption Alert",
              type: "Stratovolcano / Caldera",
              alert_level: props.alert_level || "HIGH"
            });
          }
        });
      }
      setEarthquakes(eqs);
      setVolcanoes(vols);
      if (vols.length > 0 && !selectedVolcano) setSelectedVolcano(vols[0]);
      setLoading(false);
    });
  };

  const doFetch = useCallback((loc, key, label) => {
    setLoading(true);
    Promise.all([
      getEarthquakes(loc.lat, loc.lon, 1000, 2.0).catch(() => ({ data: { earthquakes: [] } })),
      getVolcanoes(loc.lat, loc.lon, 1500, key).catch(() => ({ data: [] })),
      getTectonicInfo(loc.lat, loc.lon).catch(() => ({ data: null })),
      getVolcanoHazards().catch(() => ({ data: { features: [] } }))
    ]).then(([eqRes, volRes, tecRes, hazRes]) => {
      const eqs  = eqRes.data?.earthquakes || eqRes.data || [];
      const vols = Array.isArray(volRes.data) ? [...volRes.data] : [];
      if (hazRes.data?.features) {
        hazRes.data.features.forEach((feat, idx) => {
          const props = feat.properties || {};
          const geom = feat.geometry || {};
          const coords = geom.coordinates || [0, 0];
          const name = props.event_name || `Volcano-${idx + 1}`;
          if (!vols.some(v => v.name?.toLowerCase().includes(name.toLowerCase()))) {
            vols.push({
              name: name,
              country: props.country || "Global",
              lat: geom.type === 'Point' ? coords[1] : 0,
              lon: geom.type === 'Point' ? coords[0] : 0,
              elevation_m: 1200,
              status: props.severity_metric || "Active Eruption Alert",
              type: "Stratovolcano / Caldera",
              alert_level: props.alert_level || "HIGH"
            });
          }
        });
      }
      setEarthquakes(eqs);
      setVolcanoes(vols);
      setTectonicInfo(tecRes?.data || null);
      if (vols.length > 0) setSelectedVolcano(vols[0]);
      checkEruption(vols, eqs, label);
      setLoading(false);
    });
  }, [checkEruption]);

  useEffect(() => {
    if (location) {
      doFetch(location, apiKey, locationLabel);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => doFetch(location, apiKey, locationLabel), 90000);
      return () => clearInterval(pollRef.current);
    } else {
      fetchWorldData();
    }
  }, [location, apiKey, locationLabel, doFetch]);

  // Fetch Real-Time Analytics Algorithm Score & Probabilities
  // ALWAYS uses the user's searched/detected location coordinates, not the volcano's coordinates
  // The volcano name is passed as context so the backend can refine its assessment
  useEffect(() => {
    // Use the user's actual location — not the volcano's location
    const userLat = location ? location.lat : 0;
    const userLon = location ? location.lon : 0;
    if (!userLat && !userLon) return;

    setAnalyticsLoading(true);
    getVolcanicAnalytics(userLat, userLon, selectedVolcano?.name || null, apiKey)
      .then(res => {
        setAnalytics(res.data);
      })
      .catch(err => {
        console.error('Failed to load volcanic analytics:', err);
      })
      .finally(() => setAnalyticsLoading(false));
  }, [location, apiKey]); // Note: removed selectedVolcano — analytics is for USER'S LOCATION only

  // Filtered Volcano Catalog
  const filteredVolcanoes = useMemo(() => {
    if (filterTab === 'ACTIVE') {
      return volcanoes.filter(v => (v.status || '').toUpperCase().includes('ACTIVE') || (v.status || '').toUpperCase().includes('ERUPT'));
    }
    if (filterTab === 'PACIFIC') {
      return volcanoes.filter(v => ['USA', 'Indonesia', 'Japan', 'Philippines', 'Vanuatu', 'Tonga', 'New Zealand', 'Chile'].includes(v.country));
    }
    if (filterTab === 'HIGH_RISK') {
      return volcanoes.filter(v => (v.status || '').toUpperCase().includes('ERUPT') || (v.elevation_m > 3000));
    }
    return volcanoes;
  }, [volcanoes, filterTab]);

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      {/* ── 24/7 Multi-Hazard Ingestion Pipeline Banner ── */}
      <GeoNodeHazardPipeline
        compact={true}
        activeHazardFilter="Volcano"
        title="24/7 Global Volcanic & Tectonic Pipeline (UN/EU GDACS · Smithsonian GVP)"
        onSyncComplete={() => { if (location) doFetch(location, apiKey, locationLabel); }}
      />

      <SimulationBanner />

      {/* ── Real-time Location Status Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10, padding: '11px 18px', borderRadius: 10,
        marginBottom: 14,
        background: locating ? 'rgba(255,176,32,0.07)' : 'rgba(0,229,255,0.05)',
        border: `1px solid ${locating ? 'rgba(255,176,32,0.3)' : 'rgba(0,229,255,0.2)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: locating ? '#ffb020' : '#00e5ff',
            boxShadow: locating ? '0 0 8px #ffb020' : '0 0 8px #00e5ff',
            animation: 'blink-loc 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {locating ? '🛰️ Acquiring real-world location...' : `📍 ${locationLabel}`}
          </span>
          {location && !locating && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {Number(location.lat).toFixed(5)}°N · {Number(location.lon).toFixed(5)}°E
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {lastUpdated && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last scan: {lastUpdated.toLocaleTimeString()} · Poll: 90s
            </span>
          )}
          <span style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 5, fontFamily: 'var(--font-mono)', fontWeight: 700,
            background: loading ? 'rgba(255,176,32,0.12)' : eruptionAlert ? 'rgba(255,59,92,0.12)' : 'rgba(34,197,94,0.1)',
            color: loading ? '#ffb020' : eruptionAlert ? '#ff3b5c' : '#22c55e',
            border: `1px solid ${loading ? '#ffb020' : eruptionAlert ? '#ff3b5c' : '#22c55e'}44`,
          }}>
            {loading ? '⟳ SCANNING' : eruptionAlert ? '🚨 ALERT' : '● NOMINAL'}
          </span>
        </div>
      </div>

      {/* ── Eruption / Seismic Alert Banner ── */}
      {eruptionAlert && (
        <div style={{
          padding: '16px 20px', borderRadius: 10, marginBottom: 16,
          background: `linear-gradient(135deg, ${eruptionAlert.color}18, ${eruptionAlert.color}08)`,
          border: `1.5px solid ${eruptionAlert.color}66`,
          boxShadow: `0 4px 24px ${eruptionAlert.color}18`,
          animation: 'fadeInUp 0.4s ease-out',
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <span style={{ fontSize: 38, flexShrink: 0, animation: eruptionAlert.type === 'ERUPTION' ? 'pulse-vol 1.5s infinite' : 'none' }}>{eruptionAlert.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: eruptionAlert.color, letterSpacing: '0.04em' }}>
              🚨 {eruptionAlert.title}
            </div>
            <div style={{ color: '#ccc', fontSize: 12, marginTop: 4 }}>{eruptionAlert.detail}</div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {eruptionAlert.precautions.map((p, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6,
                  background: `${eruptionAlert.color}18`, color: '#eee',
                  border: `1px solid ${eruptionAlert.color}44`,
                }}>⚠ {p}</span>
              ))}
            </div>
          </div>
          {scanLog.length > 0 && (
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16, minWidth: 160, maxHeight: 90, overflowY: 'auto' }}>
              <div style={{ fontSize: 9, color: '#4a6a8a', fontFamily: 'monospace', marginBottom: 6, letterSpacing: '0.1em' }}>SCAN LOG</div>
              {scanLog.slice(0, 5).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: s.erupting > 0 ? '#ff3b5c' : s.bigQuake > 0 ? '#ff6b35' : '#22c55e' }} />
                  <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.erupting > 0 ? `🌋 ${s.erupting} erupting` : s.bigQuake > 0 ? `⚠ M5.5+ quake` : '✅ Clear'} · {s.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No alert — quiet nominal badge */}
      {!eruptionAlert && !loading && lastUpdated && (
        <div style={{
          padding: '10px 18px', borderRadius: 10, marginBottom: 14,
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
          display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp 0.3s ease',
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>
            NO ACTIVE ERUPTION DETECTED near {locationLabel}
          </div>
          <div style={{ fontSize: 11, color: '#4a6a8a', marginLeft: 4 }}>
            — {earthquakes.length} seismic events · {volcanoes.length} volcanoes in scan radius · Checked {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink-loc { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes pulse-vol { 0%,100% { transform:scale(1); } 50% { transform:scale(1.15); } }
      `}</style>

      {/* Header with Title & Top Segmented View Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🌋</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
              Volcanic & Tectonic Intelligence
            </h2>
            <span className="chip chip-cyan" style={{ fontSize: 10 }}>
              AI PHYSICS ENGINE
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            Subterranean magma conduit dynamics, real-time eruption unrest probability, and tectonic strain mapping.
          </p>
        </div>

        {/* Action Controls & Top Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Main View Mode Tabs */}
          <div className="enhanced-tabs">
            {[
              { id: 'split', label: '📊 Unified Grid' },
              { id: '3d-focus', label: '🌋 3D Volcano View' },
              { id: 'map-focus', label: '🗺️ Tectonic GIS Map' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={`enhanced-tab ${mainTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* API Key Modal Button */}
          <button
            className="btn btn-secondary"
            onClick={() => { setTempApiKey(apiKey); setShowKeyModal(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              padding: '6px 12px'
            }}
          >
            <span>🔑</span>
            <span>{apiKey ? 'API: Custom Key' : 'API: Public Tier'}</span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: apiKey ? 'var(--cyan)' : 'var(--text-muted)',
                boxShadow: apiKey ? '0 0 6px var(--cyan)' : 'none'
              }}
            />
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(4, 6, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '480px' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-caps">🔑 VOLCANIC DATA TELEMETRY CONFIGURATION</span>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}
                onClick={() => setShowKeyModal(false)}
              >✕</button>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Configure your NASA EarthData, EONET, or USGS API credentials to enable high-frequency polling, deep hypocenter tracking, and unlimited rate limits:
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginBottom: 6 }}>
                  TELEMETRY API KEY
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter custom API Key..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => saveApiKey('')}>
                  Reset to Default
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowKeyModal(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={() => saveApiKey(tempApiKey)}>Save Key</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Search Bar */}
      <div style={{ marginBottom: 20 }}>
        <LocationSearch onLocationSelect={(loc) => {
          setLocation(loc);
          setLocationLabel(loc.displayName || loc.locality || `${loc.lat?.toFixed(4)}°N, ${loc.lon?.toFixed(4)}°E`);
          setLocating(false);
          // Do not retain measurements from the previously selected country
          // while the location-specific USGS/NASA requests are in flight.
          setEarthquakes([]);
          setVolcanoes([]);
          setTectonicInfo(null);
          setAnalytics(null);
          setSelectedVolcano(null);
          setEruptionAlert(null);
          setScanLog([]);
        }} />
      </div>

      {/* ── Top Dashboard Stats (8 Cards) ── */}
      {!loading && location && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'QUAKE MAGNITUDE', value: earthquakes.length > 0 ? `M ${Math.max(...earthquakes.map(eq => eq.mag ?? eq.magnitude ?? 0)).toFixed(1)}` : 'None', color: '#ff6b35', sub: earthquakes.length > 0 ? 'Max in scan radius' : 'No events reported' },
            { label: 'ACTIVE VOLCANOES',value: volcanoes.filter(v => v.status !== 'Unknown').length.toString(), color: '#ff3b5c', sub: 'In Scan Radius' },
            { label: 'RISK SCORE',      value: analytics ? `${analytics.overall_score}/100` : '—', color: analytics?.overall_score > 70 ? '#ff3b5c' : '#ffb020', sub: analytics?.risk_level || 'SCANNING' },
            { label: 'SEISMIC EVENTS',  value: earthquakes.length.toString(), color: '#00b4d8', sub: 'Recent tremors' },
            { label: 'FAULT LINE',      value: tectonicInfo?.nearest_plate ? 'PROXIMATE' : 'DISTANT', color: '#00e5ff', sub: tectonicInfo?.nearest_plate || 'Tectonic Proximity' },
            { label: 'ASH PLUME RISK',  value: analytics ? `${analytics.chance_pct}%` : '—', color: analytics?.chance_pct > 50 ? '#ff3b5c' : '#22c55e', sub: 'Location impact likelihood' },
            { label: 'MAGMA DEPTH',     value: analytics?.magma_chamber_depth_km != null ? `${analytics.magma_chamber_depth_km} km` : '—', color: '#a78bfa', sub: 'Hazard-model estimate' },
            { label: 'DATA SOURCE',     value: analytics?.api_source ? 'USGS / NASA' : '—', color: '#22c55e', sub: analytics?.api_source || 'Awaiting telemetry' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 9, color: '#4a6a8a', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
              <div style={{ fontSize: 10, color: '#6a8aaa', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div className="loading-ring" />
        </div>
      )}

      {/* Main Content Area based on Selected Tab */}
      {(mainTab === 'split' || mainTab === '3d-focus') && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: mainTab === '3d-focus' ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* 3D Volcano Dynamics Viewer */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden', minHeight: '490px', border: eruptionAlert?.type === 'ERUPTION' ? '1.5px solid rgba(255,59,92,0.5)' : '1px solid var(--border-default)', boxShadow: eruptionAlert?.type === 'ERUPTION' ? '0 0 40px rgba(255,59,92,0.15)' : 'none' }}>
            {/* Detection Event Header — shows real volcano data when eruption found */}
            {eruptionAlert?.type === 'ERUPTION' && eruptionAlert.volcano ? (
              <div style={{
                background: 'linear-gradient(90deg, rgba(255,59,92,0.2) 0%, rgba(255,107,53,0.1) 100%)',
                borderBottom: '1px solid rgba(255,59,92,0.4)',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, animation: 'pulse-vol 1.2s infinite' }}>🌋</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13, color: '#ff3b5c', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                      🚨 DETECTION EVENT — LIVE 3D MODEL
                    </div>
                    <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, marginTop: 1 }}>
                      {eruptionAlert.volcano.name}
                      {eruptionAlert.volcano.country ? ` · ${eruptionAlert.volcano.country}` : ''}
                      {eruptionAlert.volcano.volcano_type ? ` · ${eruptionAlert.volcano.volcano_type}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'STATUS',     value: eruptionAlert.volcano.status || 'ACTIVE',                                color: '#ff3b5c' },
                    { label: 'ELEVATION',  value: eruptionAlert.volcano.elevation_m ? `${eruptionAlert.volcano.elevation_m} m` : '—', color: '#ffb020' },
                    { label: 'LAT / LON',  value: eruptionAlert.volcano.lat && eruptionAlert.volcano.lon ? `${Number(eruptionAlert.volcano.lat).toFixed(3)}°, ${Number(eruptionAlert.volcano.lon).toFixed(3)}°` : '—', color: '#00e5ff' },
                    { label: 'DISTANCE',   value: eruptionAlert.volcano.distance_km ? `${Math.round(eruptionAlert.volcano.distance_km)} km away` : '—', color: '#a78bfa' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '5px 10px', minWidth: 80 }}>
                      <div style={{ fontSize: 8, color: '#4a6a8a', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{viewerType === 'terrain' ? '🗺️' : '🌋'}</span>
                  <span className="label-caps">
                    {viewerType === 'terrain' ? 'REAL 3D TERRAIN TOPOGRAPHY' : '3D VOLCANO DYNAMICS · MAGMA CONDUIT'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="enhanced-tabs" style={{ padding: 2 }}>
                    <button
                      onClick={() => setViewerType('terrain')}
                      className={`enhanced-tab ${viewerType === 'terrain' ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: 10 }}
                    >
                      🗺️ Real Terrain
                    </button>
                    <button
                      onClick={() => setViewerType('volcano')}
                      className={`enhanced-tab ${viewerType === 'volcano' ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: 10 }}
                    >
                      🌋 Magma Engine
                    </button>
                  </div>
                  {viewerType === 'volcano' && selectedVolcano && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedVolcano.name}
                    </span>
                  )}
                </div>
              </div>
            )}
            {viewerType === 'terrain' ? (
              <LocationTerrain3D 
                location={location || (selectedVolcano ? { lat: selectedVolcano.lat, lon: selectedVolcano.lon, locality: selectedVolcano.name } : null)} 
                riskData={analytics} 
              />
            ) : (
              <Volcano3DViewer
                volcano={selectedVolcano}
                analytics={analytics}
              />
            )}
          </div>

          {/* Real-Time Hazard & Probabilistic Chances Card */}
          {mainTab === 'split' && (
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label-caps">REAL-TIME HAZARD & ERUPTION PROBABILITY</span>
                  {analyticsLoading && <span className="loading-ring" style={{ width: 14, height: 14 }} />}
                </div>

                <div className="panel-body">
                  {/* Probability Hero Banner */}
                  <div style={{
                    background: (analytics?.chance_pct || 0) > 65 ? 'rgba(255,59,92,0.12)' : 'rgba(255,176,32,0.12)',
                    border: (analytics?.chance_pct || 0) > 65 ? '1px solid rgba(255,59,92,0.4)' : '1px solid rgba(255,176,32,0.4)',
                    borderRadius: 8,
                    padding: '16px',
                    marginBottom: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                        ERUPTION RISK PROBABILITY
                      </span>
                      <span className={`chip ${(analytics?.chance_pct || 0) > 65 ? 'chip-red' : 'chip-amber'}`} style={{ fontWeight: 700 }}>
                        {analytics?.chance_level || 'ELEVATED'}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: (analytics?.chance_pct || 0) > 65 ? 'var(--red)' : 'var(--amber)',
                      letterSpacing: '0.04em',
                      marginBottom: 6
                    }}>
                      {analytics?.chance_pct ?? 62}%
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                      {analytics?.chance_text || 'Elevated probability of magmatic venting or thermal escalation.'}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                      TIMEFRAME: <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{analytics?.timeframe || 'Next 48–72 Hours'}</span>
                    </div>
                  </div>

                  {/* Key Physical Telemetry Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MAGMA CHAMBER ROOF</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {analytics?.magma_chamber_depth_km || 4.8} km
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MAGMA ASCENT RATE</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {analytics?.magma_ascent_rate_m_hr || 1.2} m/hr
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ESTIMATED VEI INDEX</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        VEI-{analytics?.estimated_vei || 3}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>THERMAL PLUME TEMP</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {analytics?.thermal_plume_temp_c || 420} °C
                      </div>
                    </div>
                  </div>

                  {/* Scientific Rationale Narrative */}
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 700, marginBottom: 4 }}>
                      GEOPHYSICAL ASSESSMENT
                    </div>
                    {analytics?.scientific_rationale || 
                      'Proximal seismic swarms denote subsurface fluid-magma migration. Elevated crustal strain indicates active conduit pressurization.'}
                  </div>
                </div>
              </div>

              {/* Contributing Factors Breakdown */}
              <div className="panel-body" style={{ paddingTop: 0 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 8 }}>
                  FACTOR CONTRIBUTION MATRIX
                </div>
                {analytics?.contributing_factors?.map((f, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{f.score}/{f.max}</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (f.score / f.max) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--cyan), var(--blue))',
                        borderRadius: 2
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tectonic GIS Map (Always rendered when split or map-focus) */}
      {(mainTab === 'split' || mainTab === 'map-focus') && (
        <div className="panel" style={{ marginBottom: '20px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps">TECTONIC PLATE BOUNDARIES & SEISMIC CONVERGENCE MAP</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="chip chip-amber" style={{ fontSize: 10 }}>🔴 QUAKES: {earthquakes.length}</span>
              <span className="chip chip-cyan" style={{ fontSize: 10 }}>🌋 VOLCANOES: {volcanoes.length}</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <DisasterMap
              key={`volcano-map-en-${location?.lat ?? 'global'}-${location?.lon ?? 'global'}`}
              center={location ? [location.lat, location.lon] : [20, 0]}
              zoom={location ? 6 : 2}
              userPin={location}
              earthquakes={earthquakes}
              volcanoes={volcanoes}
              layers={['earthquakes', 'volcanoes', 'tectonic', 'user-pin']}
              height={mainTab === 'map-focus' ? 620 : 420}
              language="en"
            />
          </div>
        </div>
      )}

      {/* Bottom 3-Column Tactical Information Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Nearby Volcanoes Table with Filter Tabs */}
        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="label-caps">VOLCANO DIRECTORY</span>
            {/* Filter Tabs */}
            <div className="enhanced-tabs" style={{ padding: 2 }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ACTIVE', label: 'Active' },
                { id: 'PACIFIC', label: 'Pacific' },
                { id: 'HIGH_RISK', label: 'Elevated' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterTab(f.id)}
                  className={`enhanced-tab ${filterTab === f.id ? 'active' : ''}`}
                  style={{ padding: '3px 8px', fontSize: 10 }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {filteredVolcanoes.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>VOLCANO</th>
                    <th>TYPE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolcanoes.slice(0, 15).map((v, i) => {
                    const isSelected = selectedVolcano?.name === v.name;
                    return (
                      <tr
                        key={i}
                        onClick={() => setSelectedVolcano(v)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(0,229,255,0.08)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: isSelected ? 'var(--cyan)' : 'var(--text-primary)' }}>
                            {v.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {v.country ? `${v.country} · ` : ''}{v.distance_km ? `${v.distance_km} km` : ''}
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.volcano_type || 'Stratovolcano'}</td>
                        <td>
                          <span className={`chip ${(v.status || '').toUpperCase().includes('ERUPT') ? 'chip-red' : 'chip-amber'}`} style={{ fontSize: 9 }}>
                            {v.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedVolcano(v); }}
                          >
                            {isSelected ? '3D Active' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <div style={{ color: 'var(--text-muted)', padding: 16 }}>No volcanoes found matching filter.</div>}
          </div>
        </div>

        {/* Recent Earthquakes Table */}
        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps">PROXIMAL SEISMIC SWARMS</span>
            <span className="chip chip-gray" style={{ fontSize: 10 }}>USGS LIVE FEED</span>
          </div>
          <div className="panel-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {earthquakes.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MAG</th>
                    <th>DEPTH</th>
                    <th>LOCATION</th>
                  </tr>
                </thead>
                <tbody>
                  {earthquakes.slice(0, 8).map((eq, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`chip ${eq.magnitude >= 5 ? 'chip-red' : (eq.magnitude >= 3.5 ? 'chip-orange' : 'chip-amber')}`}>
                          M{eq.magnitude.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: eq.depth_km < 10 ? 'var(--red)' : 'var(--text-secondary)' }}>
                        {eq.depth_km ? `${eq.depth_km.toFixed(1)} km` : '-'}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{eq.place}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {eq.distance_km ? `${Math.round(eq.distance_km)} km away` : ''}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={{ color: 'var(--text-muted)', padding: 16 }}>No recent earthquakes in this area.</div>}
          </div>
        </div>

        {/* Tectonic Plate & Crustal Boundary Analysis */}
        <div className="panel">
          <div className="panel-header"><span className="label-caps">TECTONIC CRUSTAL DYNAMICS</span></div>
          <div className="panel-body">
            <h4 style={{ marginBottom: '8px', color: 'var(--cyan)' }}>
              {tectonicInfo?.plate?.plate_name || 'Active Tectonic Convergence Margin'}
            </h4>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              BOUNDARY: {tectonicInfo?.plate?.boundary_type || 'Subduction Zone / Convergent Margin'}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
              {tectonicInfo?.plate?.description || 
                'The geographic region is positioned within an active tectonic convergence zone. Seismic swarms denote crustal stress migration and sub-lithospheric magma accumulation. Continuous monitoring recommended.'}
            </p>
            <DataReliabilityScore score={94} factors={['USGS Real-time Feeds', 'NASA EONET Telemetry', 'PB2002 Lithospheric Boundaries']} />
          </div>
        </div>
      </div>
    </div>
  );
}

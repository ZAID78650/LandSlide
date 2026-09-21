import React, { useState, useEffect, useRef, useCallback } from 'react';
import LocationSearch from '../components/UI/LocationSearch';
import DataReliabilityScore from '../components/UI/DataReliabilityScore';
import { getCycloneData, getActiveCyclones, getLiveRainfall, getCycloneHazards } from '../api/client';
import GeoNodeHazardPipeline from '../components/GIS/GeoNodeHazardPipeline';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const stormIcon = L.divIcon({
  html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 6px rgba(255,59,92,0.8))">🌀</div>',
  iconSize: [32, 32], iconAnchor: [16, 16], className: ''
});
const locationIcon = L.divIcon({
  html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 0 4px rgba(0,229,255,0.8))">📍</div>',
  iconSize: [24, 24], iconAnchor: [12, 24], className: ''
});

function categoryColor(cat) {
  if (!cat) return '#4a6a8a';
  const c = String(cat).toLowerCase();
  if (c.includes('5')) return '#ff0040';
  if (c.includes('4')) return '#ff3b5c';
  if (c.includes('3')) return '#ff6b35';
  if (c.includes('2')) return '#ffb020';
  if (c.includes('1')) return '#f0e040';
  if (c.includes('tropical storm') || c.includes('ts')) return '#a78bfa';
  if (c.includes('depression') || c.includes('td')) return '#60a5fa';
  return '#00e5ff';
}

export default function CycloneTrackerPage() {
  const [location,      setLocation]      = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locating,      setLocating]      = useState(true);

  const [cycloneData,   setCycloneData]   = useState(null); // single-location result
  const [globalCyclones,setGlobalCyclones]= useState([]);   // global active list
  const [loading,       setLoading]       = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [scanLog,       setScanLog]       = useState([]);
  const [baselineWeather, setBaselineWeather] = useState(null);   // rolling scan history
  const [weatherData, setWeatherData] = useState(null);

  const pollRef = useRef(null);

  /* ─── GPS-first location auto-detect ─── */
  useEffect(() => {
    const applyLocation = (lat, lon, meta = {}) => {
      setLocation({ lat, lon, locality: meta.city || 'Detected', city: meta.city || '', state: meta.region || '', country: meta.country || '' });
      setLocationLabel([meta.city, meta.region, meta.country].filter(Boolean).join(', ') || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
      setLocating(false);
    };

    const ipFallback = async () => {
      try {
        const r    = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await r.json();
        if (data?.latitude) applyLocation(parseFloat(data.latitude), parseFloat(data.longitude), { city: data.city, region: data.region, country: data.country });
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

  /* ─── Fetch global active cyclones from IMD + GDACS 24/7 pipeline ─── */
  useEffect(() => {
    Promise.allSettled([getActiveCyclones(), getCycloneHazards()]).then(([r1, r2]) => {
      const list = r1.status === 'fulfilled' && Array.isArray(r1.value?.data) ? [...r1.value.data] : [];
      if (r2.status === 'fulfilled' && r2.value?.data?.features) {
        r2.value.data.features.forEach((feat, idx) => {
          const props = feat.properties || {};
          const geom = feat.geometry || {};
          const coords = geom.coordinates || [0, 0];
          const lat = geom.type === 'Point' ? coords[1] : coords[0]?.[0]?.[1] || 0;
          const lon = geom.type === 'Point' ? coords[0] : coords[0]?.[0]?.[0] || 0;
          const name = props.event_name || `Storm-${idx + 1}`;
          // Avoid duplicate
          if (!list.some(c => c.name?.toLowerCase().includes(name.toLowerCase()))) {
            list.push({
              id: feat.id || `GDACS-TC-${idx}`,
              name: name,
              basin: props.country || "Global Tropical Basin",
              category: props.severity_metric || "Tropical Cyclone Alert",
              category_level: props.alert_level === 'CRITICAL' ? 3 : 1,
              wind_speed_kmh: props.wind_speed_kmh || 120,
              pressure_hpa: props.pressure_hpa || 985,
              source: props.source || "UN/EU GDACS Global Cyclone Engine",
              track: {
                current: { lat, lon, wind_kmh: props.wind_speed_kmh || 120, pressure_hpa: props.pressure_hpa || 985 }
              }
            });
          }
        });
      }
      setGlobalCyclones(list);
    }).catch(() => setGlobalCyclones([]));
  }, []);

  /* ─── Fetch cyclone data for detected/selected location ─── */
  const fetchCyclone = useCallback(async (lat, lon, label) => {
    setLoading(true);
    try {
      const [cycloneResponse, weatherResponse] = await Promise.all([
        getCycloneData(lat, lon),
        getLiveRainfall(lat, lon),
      ]);
      const data = cycloneResponse.data || {};
      const weather = weatherResponse.data?.weather_data || null;
      setBaselineWeather(weather?.current || null);
      setWeatherData(weather);
      setCycloneData(data);
      setLastUpdated(new Date());

      // Build scan log entry
      const hasStorm = data.has_storm || data.active_cyclones?.length > 0;
      setScanLog(prev => [{
        time:     new Date().toLocaleTimeString(),
        loc:      label,
        detected: hasStorm,
        name:     data.name || (data.active_cyclones?.[0]?.name) || 'None',
        wind:     data.wind_speed || data.active_cyclones?.[0]?.wind_speed_kmh || 0,
      }, ...prev].slice(0, 12));
    } catch (error) {
      console.warn('Cyclone telemetry unavailable', error);
      setCycloneData({ has_storm: false, unavailable: true });
      setBaselineWeather(null);
      setWeatherData(null);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── Trigger fetch + start 90s poll ─── */
  useEffect(() => {
    if (!location) return;
    fetchCyclone(location.lat, location.lon, locationLabel);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchCyclone(location.lat, location.lon, locationLabel), 90000);
    return () => clearInterval(pollRef.current);
  }, [location, locationLabel, fetchCyclone]);

  /* ─── Derived UI values ─── */
  const hasStorm    = cycloneData?.has_storm || (cycloneData?.active_cyclones?.length > 0);
  const stormInfo   = hasStorm ? (cycloneData?.active_cyclones?.[0] || cycloneData) : null;
  const trackData   = stormInfo?.track || null;
  const catColor    = stormInfo ? categoryColor(stormInfo.category || stormInfo.category_name) : '#4a6a8a';
  const windKmh     = parseFloat(stormInfo?.wind_speed_kmh || String(stormInfo?.wind_speed || '0').replace(/[^\d.]/g, '')) || 0;
  const weatherHourly = weatherData?.hourly || {};
  const localPrecipitationRate = baselineWeather?.precipitation == null
    ? null
    : baselineWeather.precipitation * (3600 / (Number(baselineWeather.interval) || 3600));
  const windData = (Array.isArray(weatherHourly.time) ? weatherHourly.time : []).slice(0, 24).map((time, index) => ({
    h: time?.slice(11, 16) || `H${index + 1}`,
    wind: weatherHourly.wind_speed_10m?.[index] ?? null,
    precipitation: weatherHourly.precipitation?.[index] ?? null,
  })).filter(point => point.wind != null || point.precipitation != null);
  const mapCenter   = trackData ? [trackData.current.lat, trackData.current.lon] : location ? [location.lat, location.lon] : [20, 0];
  const mapZoom     = hasStorm ? 5 : 7;

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 56px)', overflow: 'auto', background: '#030609' }}>

      {/* ── 24/7 Multi-Hazard Ingestion Pipeline Banner ── */}
      <GeoNodeHazardPipeline
        compact={true}
        activeHazardFilter="Cyclone"
        title="24/7 Global Cyclone & Severe Storm Pipeline (UN/EU GDACS · IMD · JMA)"
        onSyncComplete={() => { if (location) fetchCyclone(location.lat, location.lon, locationLabel); }}
      />

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🌀</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#fff' }}>Real-Time Cyclone Tracker</h2>
            <span style={{
              background: loading ? 'rgba(255,176,32,0.12)' : hasStorm ? 'rgba(255,59,92,0.15)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${loading ? '#ffb020' : hasStorm ? '#ff3b5c' : '#22c55e'}`,
              borderRadius: 6, padding: '2px 10px', fontSize: 10,
              color: loading ? '#ffb020' : hasStorm ? '#ff3b5c' : '#22c55e',
              fontWeight: 700, letterSpacing: '0.08em', animation: loading ? 'pulse 1s infinite' : 'none'
            }}>
              {loading ? '⟳ SCANNING...' : hasStorm ? '🚨 STORM ACTIVE' : '● MONITORING'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            GPS-detected location · Live cyclone detection · Auto-updates every 90 seconds
          </p>
        </div>
        {lastUpdated && (
          <div style={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'monospace', textAlign: 'right' }}>
            Last scan: {lastUpdated.toLocaleTimeString()}<br />
            Poll interval: 90s
          </div>
        )}
      </div>

      {/* ── Location status bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        padding: '12px 18px', borderRadius: 10, marginBottom: 14,
        background: locating ? 'rgba(255,176,32,0.07)' : 'rgba(0,229,255,0.06)',
        border: `1px solid ${locating ? 'rgba(255,176,32,0.3)' : 'rgba(0,229,255,0.25)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: locating ? '#ffb020' : '#00e5ff',
            boxShadow: locating ? '0 0 8px #ffb020' : '0 0 8px #00e5ff',
            animation: 'blink 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {locating ? '🛰️ Acquiring real-world location...' : `📍 ${locationLabel}`}
          </span>
          {location && !locating && (
            <span style={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'monospace' }}>
              {location.lat?.toFixed(5)}°N · {location.lon?.toFixed(5)}°E
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'monospace' }}>
          {globalCyclones.length > 0 ? `${globalCyclones.length} global storms tracked` : 'Global feed connected'}
        </span>
      </div>

      {/* ── Custom search ── */}
      <div style={{ marginBottom: 14 }}>
        <LocationSearch onLocationSelect={(loc) => {
          setLocation(loc);
          setLocationLabel(loc.displayName || loc.locality || `${loc.lat?.toFixed(3)}°N, ${loc.lon?.toFixed(3)}°E`);
          setLocating(false);
          setCycloneData(null);
        }} />
      </div>

      {/* ── ALERT BANNER when storm active ── */}
      {hasStorm && stormInfo && !loading && (
        <div style={{
          padding: '16px 20px', borderRadius: 10, marginBottom: 16,
          background: `linear-gradient(135deg, rgba(255,59,92,0.15), rgba(255,107,53,0.1))`,
          border: `1.5px solid ${catColor}88`,
          boxShadow: `0 4px 24px ${catColor}22`,
          animation: 'fadeInUp 0.4s ease-out',
          display: 'flex', alignItems: 'center', gap: 16
        }}>
          <span style={{ fontSize: 40, animation: 'spin-slow 3s linear infinite', display: 'inline-block' }}>🌀</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: catColor, fontWeight: 900, fontSize: 16, letterSpacing: '0.05em' }}>
              🚨 CYCLONE DETECTED — {stormInfo.name || 'UNNAMED STORM'}
            </div>
            <div style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>
              <strong style={{ color: '#fff' }}>{stormInfo.category || stormInfo.category_name || 'Tropical Storm'}</strong> ·&nbsp;
              Winds <strong style={{ color: catColor }}>{stormInfo.wind_speed || stormInfo.wind_speed_kmh ? `${stormInfo.wind_speed || stormInfo.wind_speed_kmh} km/h` : 'N/A'}</strong> ·&nbsp;
              {stormInfo.distance || stormInfo.distance_km ? `${stormInfo.distance || Math.round(stormInfo.distance_km) + ' km'} from ${locationLabel}` : `Near ${locationLabel}`}
              {stormInfo.estimated_arrival ? ` · ETA: ${stormInfo.estimated_arrival}` : ''}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#ffb020' }}>
              ⚠️ Precautions: Secure loose items · Stay indoors · Monitor official alerts · Evacuate low-lying areas immediately if instructed.
            </div>
          </div>
        </div>
      )}

      {/* ── No storm banner ── */}
      {cycloneData && !hasStorm && !loading && (
        <div style={{
          padding: '14px 20px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(34,197,94,0.07)', border: '1.5px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeInUp 0.4s ease-out'
        }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#22c55e' }}>NO ACTIVE CYCLONE IN THIS REGION</div>
            <div style={{ fontSize: 12, color: '#6a8aaa', marginTop: 2 }}>
              Scanned {locationLabel} — no tropical storm signatures detected within monitoring range. Last checked: {lastUpdated?.toLocaleTimeString()}.
            </div>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && !cycloneData && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: '60px 20px', color: '#4a6a8a' }}>
          <div style={{ fontSize: 40, animation: 'spin-slow 2s linear infinite' }}>🌀</div>
          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>Scanning cyclone telemetry for {locationLabel}...</div>
        </div>
      )}

      {/* ── Main Layout ── */}
      {location && cycloneData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* ── Top Row: Map + Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Live Leaflet Map */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${hasStorm ? catColor + '55' : 'rgba(0,229,255,0.2)'}`, height: 350, boxShadow: hasStorm ? `0 0 30px ${catColor}22` : 'none' }}>
              <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='Tiles &copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                {location && (
                  <Marker position={[location.lat, location.lon]} icon={locationIcon}>
                    <Popup><strong>📍 {locationLabel}</strong></Popup>
                  </Marker>
                )}
                {trackData && (
                  <Marker position={[trackData.current.lat, trackData.current.lon]} icon={stormIcon}>
                    <Popup>
                      <strong>🌀 {stormInfo.name || 'Active Storm'}</strong><br />
                      {stormInfo.category || ''}<br />Wind: {stormInfo.wind_speed || stormInfo.wind_speed_kmh || 'N/A'}
                    </Popup>
                  </Marker>
                )}
                {trackData && (
                  <Circle
                    center={[trackData.current.lat, trackData.current.lon]}
                    radius={(trackData.windRadius_km || 200) * 1000}
                    pathOptions={{ color: catColor, fillColor: catColor, fillOpacity: 0.06, weight: 2, dashArray: '8 6' }}
                  />
                )}
                {trackData?.forecast?.length > 1 && (
                  <Polyline positions={[[trackData.current.lat, trackData.current.lon], ...trackData.forecast.map(p => [p.lat, p.lon])]} pathOptions={{ color: catColor, weight: 3, dashArray: '10 6', opacity: 0.9 }} />
                )}
                {trackData?.historical?.length > 1 && (
                  <Polyline positions={[...trackData.historical.map(p => [p.lat, p.lon]), [trackData.current.lat, trackData.current.lon]]} pathOptions={{ color: '#4a6a8a', weight: 2, dashArray: '4 4', opacity: 0.6 }} />
                )}
              </MapContainer>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>
              {[
                { label: 'WIND SPEED',     value: hasStorm ? (stormInfo.wind_speed || (stormInfo.wind_speed_kmh ? stormInfo.wind_speed_kmh + ' km/h' : '—')) : baselineWeather ? `${baselineWeather.wind_speed_10m} km/h` : "0 km/h", color: hasStorm ? '#ff6b35' : '#22c55e', sub: 'Sustained peak' },
                { label: 'STORM SURGE',    value: hasStorm ? (stormInfo.storm_surge_m != null ? `${stormInfo.storm_surge_m} m` : '—') : '—', color: hasStorm ? '#00b4d8' : '#4a6a8a', sub: 'Reported coastal threat' },
                { label: 'PRESSURE',       value: stormInfo?.pressure_hpa != null ? `${stormInfo.pressure_hpa} hPa` : baselineWeather?.surface_pressure != null ? `${baselineWeather.surface_pressure} hPa` : '—', color: hasStorm ? '#a78bfa' : '#4a6a8a', sub: hasStorm ? 'Storm telemetry' : 'Local surface pressure' },
                { label: 'DISTANCE',       value: hasStorm ? (stormInfo.distance || (stormInfo.distance_km ? `${Math.round(stormInfo.distance_km)} km` : '—')) : '—', color: hasStorm ? '#ffb020' : '#4a6a8a', sub: 'From location' },
                { label: 'CATEGORY',       value: hasStorm ? (stormInfo.category || stormInfo.category_name || '—') : 'NONE', color: hasStorm ? catColor : '#22c55e', sub: 'Classification' },
                { label: 'MOVEMENT',       value: hasStorm ? (stormInfo.direction ? `${stormInfo.direction} @ ${stormInfo.movement_speed || '—'}` : stormInfo.movement_speed || '—') : '—', color: hasStorm ? '#00e5ff' : '#4a6a8a', sub: 'Trajectory' },
                { label: 'PRECIPITATION',  value: localPrecipitationRate != null ? `${localPrecipitationRate.toFixed(1)} mm/hr` : '—', color: hasStorm ? '#ff3b5c' : '#22c55e', sub: 'Selected-location live rate' },
                { label: 'RISK SCORE',     value: cycloneData?.risk_level ? `${Math.min(100, Math.round((windKmh / 2.52) * 100))}/100` : baselineWeather ? `${Math.min(100, Math.round((baselineWeather.wind_speed_10m / 2.52) * 100))}/100` : '—', color: hasStorm ? '#ff3b5c' : '#22c55e', sub: cycloneData?.risk_level || (hasStorm ? 'STORM' : 'LOCAL WIND') },
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
          </div>

          {/* ── Additional Data: Wind Chart + Scan Log ── */}
          <>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,229,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4a8aaa', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                    LIVE HOURLY WIND SPEED — SELECTED LOCATION (km/h)
                  </span>
                </div>
                <div style={{ height: 250, padding: '10px 0' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={windData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={catColor} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={catColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="h" stroke="#3a5a7a" fontSize={10} />
                      <YAxis stroke="#3a5a7a" fontSize={10} />
                      <RTooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="wind" stroke={catColor} fill={`url(#windGrad)`} strokeWidth={2} name="Wind Speed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,180,216,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,180,216,0.1)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#00b4d8', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                    LIVE HOURLY PRECIPITATION — SELECTED LOCATION (mm)
                  </span>
                </div>
                <div style={{ height: 250, padding: '10px 0' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={windData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="precipitationGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="h" stroke="#3a5a7a" fontSize={10} />
                      <YAxis stroke="#3a5a7a" fontSize={10} unit=" mm" />
                      <RTooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="precipitation" stroke="#00b4d8" fill="url(#precipitationGrad)" strokeWidth={2} name="Precipitation" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4a8aaa', letterSpacing: '0.12em', fontFamily: 'monospace' }}>LIVE SCAN LOG</span>
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', padding: '8px 0' }}>
                  {scanLog.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#4a6a8a', fontSize: 12 }}>No scans yet</div>
                  ) : scanLog.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', animation: i === 0 ? 'fadeInUp 0.3s ease' : 'none' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: s.detected ? '#ff3b5c' : '#22c55e', boxShadow: `0 0 5px ${s.detected ? '#ff3b5c' : '#22c55e'}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.loc}</div>
                        <div style={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'monospace' }}>
                          {s.detected ? `🌀 ${s.name} · ${s.wind} km/h` : '✅ Clear'}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: '#4a6a8a', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{s.time}</div>
                    </div>
                  ))}
                </div>
              </div>
          </>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp    { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink       { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes spin-slow   { to { transform: rotate(360deg); } }
        @keyframes pulse       { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}

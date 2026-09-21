import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import LocationSearch from '../components/UI/LocationSearch';
import DisasterMap from '../components/Map/DisasterMap';
import { getNearbyEarthquakes, getEarthquakeHazards } from '../api/client';
import GeoNodeHazardPipeline from '../components/GIS/GeoNodeHazardPipeline';

const cardStyle = {
  background: '#0a0f14', border: '1px solid rgba(129, 151, 178, 0.22)', borderRadius: 12,
  padding: '18px 20px', minHeight: 118,
};

const value = (number, suffix = '', decimals = 1) => (
  Number.isFinite(Number(number)) ? `${Number(number).toFixed(decimals)}${suffix}` : '—'
);

function MetricCard({ label, value: metricValue, detail, color = '#00d8ff' }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, color: '#6d94b8', letterSpacing: '0.14em', fontFamily: 'monospace' }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontWeight: 800, color, fontSize: 31, marginTop: 17 }}>{metricValue}</div>
      <div style={{ color: '#80a5c7', fontSize: 12, marginTop: 10 }}>{detail}</div>
    </div>
  );
}

function formatEventTime(time) {
  if (!time) return 'Unknown time';
  const date = new Date(time);
  return Number.isNaN(date.valueOf()) ? time : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function severityColor(magnitude) {
  if (magnitude >= 6) return '#ff3b5c';
  if (magnitude >= 5) return '#ff6b35';
  if (magnitude >= 4) return '#ffb020';
  return '#00d8ff';
}

export default function EarthquakeIntelligencePage() {
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Acquiring real location...');
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const requestId = useRef(0);

  const loadEarthquakes = useCallback(async (selectedLocation) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getNearbyEarthquakes(selectedLocation.lat, selectedLocation.lon, 500, 1, 7);
      if (id !== requestId.current) return;
      const payload = response?.data || {};
      setEvents(Array.isArray(payload.earthquakes) ? payload.earthquakes : []);
      setSummary(payload.summary || null);
      setLastUpdated(payload.updated_at ? new Date(payload.updated_at) : new Date());
    } catch (_) {
      if (id !== requestId.current) return;
      setEvents([]);
      setSummary(null);
      setError('The live USGS feed is temporarily unavailable. No estimated or sample events are shown.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location) return undefined;
    loadEarthquakes(location);
    const interval = window.setInterval(() => loadEarthquakes(location), 60000);
    return () => window.clearInterval(interval);
  }, [location, loadEarthquakes]);

  const maxEvent = events.reduce((largest, event) => (!largest || Number(event.magnitude) > Number(largest.magnitude) ? event : largest), null);
  const nearestEvent = events.reduce((nearest, event) => (
    !nearest || Number(event.distance_km) < Number(nearest.distance_km) ? event : nearest
  ), null);
  const averageDepth = events.length
    ? events.reduce((sum, event) => sum + (Number(event.depth_km) || 0), 0) / events.length
    : null;
  const timeSeries = [...events]
    .filter(event => event.time_utc && Number.isFinite(Number(event.magnitude)))
    .sort((a, b) => new Date(a.time_utc) - new Date(b.time_utc))
    .map(event => ({ time: formatEventTime(event.time_utc), magnitude: Number(event.magnitude), depth: Number(event.depth_km) || 0 }));
  const depthSeries = [...events]
    .sort((a, b) => new Date(b.time_utc) - new Date(a.time_utc))
    .slice(0, 16)
    .reverse()
    .map((event, index) => ({ label: `M${value(event.magnitude, '', 1)} · ${index + 1}`, depth: Number(event.depth_km) || 0 }));
  const activityColor = severityColor(Number(summary?.max_magnitude));

  const handleLocation = (nextLocation) => {
    requestId.current += 1;
    setLocation(nextLocation);
    setLocationLabel(nextLocation.displayName || nextLocation.locality || `${nextLocation.lat?.toFixed(3)}, ${nextLocation.lon?.toFixed(3)}`);
    setEvents([]);
    setSummary(null);
    setLastUpdated(null);
    setError(null);
  };

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 56px)', overflow: 'auto', background: '#030609' }}>
      {/* ── 24/7 Multi-Hazard Ingestion Pipeline Banner ── */}
      <GeoNodeHazardPipeline
        compact={true}
        activeHazardFilter="Earthquake"
        title="24/7 Global Seismic & Earthquake Ingestion Pipeline (USGS Live 24h Feed)"
        onSyncComplete={() => { if (location) loadEarthquakes(location); }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>〰️</span>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 23 }}>Earthquake Intelligence</h2>
            <span style={{ color: loading ? '#ffb020' : '#21d4fd', fontSize: 10, fontFamily: 'monospace', fontWeight: 800, border: '1px solid currentColor', padding: '3px 8px', borderRadius: 5 }}>
              {loading ? 'FETCHING' : 'LIVE · USGS'}
            </span>
          </div>
          <p style={{ color: '#7892ad', margin: '6px 0 0', fontSize: 13 }}>Live USGS seismic events within 500 km, refreshed every 60 seconds.</p>
        </div>
        <div style={{ color: '#6d94b8', fontSize: 11, fontFamily: 'monospace', paddingTop: 8 }}>
          {lastUpdated ? `UPDATED ${lastUpdated.toLocaleTimeString()}` : 'WAITING FOR LOCATION'}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <LocationSearch onLocationSelect={handleLocation} />
      </div>

      <div style={{ padding: '11px 16px', borderRadius: 9, marginBottom: 16, background: 'rgba(0,216,255,0.05)', border: '1px solid rgba(0,216,255,0.22)', color: '#c8dbea', fontSize: 13 }}>
        📍 {locationLabel}{location && <span style={{ marginLeft: 10, color: '#6d94b8', fontFamily: 'monospace', fontSize: 11 }}>{location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°</span>}
      </div>

      {error && <div style={{ marginBottom: 16, padding: '12px 15px', border: '1px solid rgba(255,107,53,.55)', borderRadius: 8, color: '#ffb28f', background: 'rgba(255,107,53,.08)', fontSize: 13 }}>{error}</div>}

      {location && <div style={{ marginBottom: 16, border: '1px solid rgba(129,151,178,.25)', borderRadius: 12, overflow: 'hidden' }}>
        <DisasterMap center={[location.lat, location.lon]} zoom={location.zoom || 6} userPin={{ ...location, label: locationLabel }} earthquakes={events} layers={['user-pin', 'earthquakes']} height={350} language="en" />
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: 12, marginBottom: 16 }}>
        <MetricCard label="EVENTS · LAST 7 DAYS" value={events.length || '0'} detail="M1.0+ within 500 km" color="#00d8ff" />
        <MetricCard label="MAX MAGNITUDE" value={maxEvent ? `M${value(maxEvent.magnitude, '', 1)}` : '—'} detail={maxEvent?.place || 'No live events reported'} color={activityColor} />
        <MetricCard label="NEAREST EVENT" value={nearestEvent ? value(nearestEvent.distance_km, ' km', 0) : '—'} detail={nearestEvent?.place || 'No live events reported'} color="#a78bfa" />
        <MetricCard label="AVERAGE DEPTH" value={value(averageDepth, ' km', 1)} detail="From reported event depths" color="#33d17a" />
        <MetricCard label="ACTIVITY LEVEL" value={summary?.seismic_activity_level || '—'} detail={summary?.risk_level ? `${summary.risk_level} live-feed risk band` : 'Awaiting live feed'} color={activityColor} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={{ color: '#8aafcf', fontFamily: 'monospace', fontSize: 12, letterSpacing: '.1em', marginBottom: 16 }}>MAGNITUDE OVER REPORTED EVENT TIME</div>
          {timeSeries.length ? <div style={{ height: 250 }}><ResponsiveContainer><AreaChart data={timeSeries}><defs><linearGradient id="eqMag" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ff6b35" stopOpacity={.7} /><stop offset="1" stopColor="#ff6b35" stopOpacity={.04} /></linearGradient></defs><CartesianGrid stroke="#21303e" strokeDasharray="3 3" /><XAxis dataKey="time" tick={{ fill: '#7892ad', fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fill: '#7892ad', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#101820', border: '1px solid #345', borderRadius: 8 }} /><Area type="monotone" dataKey="magnitude" stroke="#ff6b35" fill="url(#eqMag)" name="Magnitude" /></AreaChart></ResponsiveContainer></div> : <p style={{ color: '#6d94b8', textAlign: 'center', padding: '94px 0', margin: 0 }}>No live events available to chart.</p>}
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#8aafcf', fontFamily: 'monospace', fontSize: 12, letterSpacing: '.1em', marginBottom: 16 }}>DEPTH · MOST RECENT LIVE EVENTS</div>
          {depthSeries.length ? <div style={{ height: 250 }}><ResponsiveContainer><BarChart data={depthSeries}><CartesianGrid stroke="#21303e" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fill: '#7892ad', fontSize: 9 }} interval="preserveStartEnd" /><YAxis tick={{ fill: '#7892ad', fontSize: 10 }} unit=" km" /><Tooltip contentStyle={{ background: '#101820', border: '1px solid #345', borderRadius: 8 }} /><Bar dataKey="depth" fill="#a78bfa" name="Depth (km)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p style={{ color: '#6d94b8', textAlign: 'center', padding: '94px 0', margin: 0 }}>No live events available to chart.</p>}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ color: '#8aafcf', fontFamily: 'monospace', fontSize: 12, letterSpacing: '.1em', marginBottom: 12 }}>LATEST USGS EVENTS</div>
        {events.length ? events.slice(0, 10).map(event => <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '76px minmax(160px, 1fr) 95px 100px', gap: 12, padding: '10px 0', borderTop: '1px solid rgba(129,151,178,.15)', alignItems: 'center', fontSize: 12 }}><strong style={{ color: severityColor(Number(event.magnitude)), fontFamily: 'monospace', fontSize: 16 }}>M{value(event.magnitude, '', 1)}</strong><span style={{ color: '#d6e3ef' }}>{event.place || 'Reported location unavailable'}</span><span style={{ color: '#8aafcf' }}>{value(event.depth_km, ' km', 1)} deep</span><span style={{ color: '#8aafcf' }}>{formatEventTime(event.time_utc)}</span></div>) : <p style={{ color: '#6d94b8', margin: 0 }}>No M1.0+ events in the selected 500 km area during the past seven days.</p>}
      </div>
    </div>
  );
}

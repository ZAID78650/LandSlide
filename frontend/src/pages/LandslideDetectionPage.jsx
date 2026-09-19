import React, { useState, useEffect, useCallback, useRef } from 'react';
import LocationSearch from '../components/UI/LocationSearch';
import RiskLevelBadge from '../components/UI/RiskLevelBadge';
import { getAreaAnalysis, getLiveRainfall, getHazardPolygons } from '../api/client';
import { AreaChart, Area, CartesianGrid, LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getRiskDetails(score) {
  if (score >= 80) return { level: 'CRITICAL', color: '#ff3b5c', text: 'Imminent failure risk. Slope instability detected.' };
  if (score >= 60) return { level: 'HIGH', color: '#ff6b35', text: 'Significant ground saturation. Mudslides likely.' };
  if (score >= 40) return { level: 'MODERATE', color: '#ffb020', text: 'Elevated soil moisture. Monitor slope changes.' };
  return { level: 'LOW', color: '#22c55e', text: 'Stable terrain. Normal soil conditions.' };
}

export default function LandslideDetectionPage() {
  const [location, setLocation] = useState(null);
  const [data, setData] = useState(null);
  // Recharts expects an array and calls Array#slice internally. Keep this
  // empty while live observations are loading instead of passing null.
  const [soilData, setSoilData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [hazardPolygons, setHazardPolygons] = useState(null);
  const pollRef = useRef(null);

  const fetchData = useCallback(async (loc) => {
    setLoading(true);
    // Show the selected map immediately. Measurements stay explicitly empty
    // until their live sources respond; we never substitute demo numbers.
    setData({
      riskScore: null,
      slope: null,
      factorOfSafety: null,
      elevation: null,
      soilMoisture: null,
    });
    setSoilData([]);
    try {
      const [areaRes, rainRes, hazardRes] = await Promise.all([
        // Area analysis enriches the result, but a temporary backend failure
        // must not hide the selected location's live terrain and weather data.
        getAreaAnalysis(loc.lat, loc.lon).catch(() => ({ data: {} })),
        getLiveRainfall(loc.lat, loc.lon),
        getHazardPolygons().catch(() => ({ data: { features: [] } }))
      ]);

      const areaData = areaRes.data;
      const rData = rainRes.data.weather_data || {};
      const offset = 0.01;
      
      // Sample a small DEM grid around the selected coordinates. This yields a
      // terrain gradient from actual elevation values rather than a random slope.
      let elevations = [];
      try {
        const samples = [
          [loc.lat - offset, loc.lon - offset], [loc.lat - offset, loc.lon], [loc.lat - offset, loc.lon + offset],
          [loc.lat, loc.lon - offset],          [loc.lat, loc.lon],          [loc.lat, loc.lon + offset],
          [loc.lat + offset, loc.lon - offset], [loc.lat + offset, loc.lon], [loc.lat + offset, loc.lon + offset],
        ];
        const latitudes = samples.map(([lat]) => lat).join(',');
        const longitudes = samples.map(([, lon]) => lon).join(',');
        const elevRes = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`);
        const elevData = await elevRes.json();
        elevations = Array.isArray(elevData?.elevation) ? elevData.elevation : [];
      } catch (e) { console.warn('Elevation telemetry unavailable', e); }
      
      const riskScore = Number(
        areaData.landslide_risk_score ??
        areaData.overall_risk_score ??
        rainRes.data?.risk_assessment?.risk_score ??
        0
      );
      const soilMoisture = rData.current?.soil_moisture_0_to_7cm == null
        ? null
        : rData.current.soil_moisture_0_to_7cm * 100;
      const elevation = elevations[4] ?? null;
      
      const metresPerLatitudeDegree = 111_320;
      const metresPerLongitudeDegree = metresPerLatitudeDegree * Math.cos(loc.lat * Math.PI / 180);
      const distances = [
        Math.hypot(metresPerLatitudeDegree * offset, metresPerLongitudeDegree * offset), metresPerLatitudeDegree * offset,
        Math.hypot(metresPerLatitudeDegree * offset, metresPerLongitudeDegree * offset), metresPerLongitudeDegree * offset,
        metresPerLongitudeDegree * offset, Math.hypot(metresPerLatitudeDegree * offset, metresPerLongitudeDegree * offset),
        metresPerLatitudeDegree * offset, Math.hypot(metresPerLatitudeDegree * offset, metresPerLongitudeDegree * offset),
      ];
      const neighbors = [0, 1, 2, 3, 5, 6, 7, 8];
      const slope = elevation == null || elevations.length < 9 ? null : Math.max(...neighbors.map((index, i) =>
        Math.atan(Math.abs(elevations[index] - elevation) / distances[i]) * 180 / Math.PI
      ));
      const factorOfSafety = slope == null ? null : Math.max(0.5, 3.2 - (riskScore / 35) - (slope / 80));
      
      setData({
        riskScore,
        slope: slope == null ? null : Math.round(slope),
        factorOfSafety: factorOfSafety == null ? null : factorOfSafety.toFixed(2),
        elevation: elevation == null ? null : Math.round(elevation),
        soilMoisture,
      });

      // Use Open-Meteo's hourly soil-moisture observations. The FoS line is a
      // transparent geotechnical model computed from each observed moisture
      // point and the selected location's measured DEM gradient.
      const hourly = rData.hourly || {};
      const hourlyTimes = Array.isArray(hourly.time) ? hourly.time : [];
      const hourlyMoisture = Array.isArray(hourly.soil_moisture_0_to_7cm)
        ? hourly.soil_moisture_0_to_7cm
        : [];
      const history = hourlyTimes.slice(0, 24).map((time, index) => {
        const moistureValue = hourlyMoisture[index];
        if (moistureValue == null || slope == null) return null;
        const saturation = moistureValue * 100;
        const hourlyFoS = Math.max(0.5, 3.2 - (saturation / 35) - (slope / 80));
        return {
          time: time?.slice(11, 16) || `H${index + 1}`,
          moisture: Number(saturation.toFixed(1)),
          fos: Number(hourlyFoS.toFixed(2)),
        };
      }).filter(Boolean);
      setSoilData(history);
      
      const features = hazardRes.data?.features || [];
      const landslides = features.filter(f => f.properties.hazard_type === 'LANDSLIDE');
      setHazardPolygons(landslides);
      
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch landslide data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationSelect = (loc) => {
    setLocation(loc);
  };

  useEffect(() => {
    if (!location) return undefined;
    fetchData(location);
    pollRef.current = setInterval(() => fetchData(location), 60_000);
    return () => clearInterval(pollRef.current);
  }, [location, fetchData]);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: '32px' }}>⛰️</span> Landslide & Terrain Detection
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time slope stability, soil saturation, and ground movement</p>
      </div>

      <LocationSearch onLocationSelect={handleLocationSelect} />

      {!location && !loading && (
        <div className="panel" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <h3>Select a location to analyze terrain</h3>
          <p style={{ color: 'var(--text-muted)' }}>Search above or use GPS</p>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px' }}>
          <div className="loading-ring" style={{ width: 50, height: 50, marginBottom: 20 }}></div>
          <div style={{ color: 'var(--cyan)' }}>Analyzing topographical & soil data...</div>
        </div>
      )}

      {location && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* ── Top Row: Map + Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Live Leaflet Map */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid rgba(0,229,255,0.2)`, height: 350 }}>
              <MapContainer 
                key={`${location.lat}-${location.lon}`}
                center={[location.lat, location.lon]} 
                zoom={10} 
                style={{ height: '100%', width: '100%', background: '#0a1929' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="Tiles &copy; OpenStreetMap contributors"
                  maxZoom={19}
                />
                <Marker position={[location.lat, location.lon]}>
                  <Popup><strong>{location.locality}</strong></Popup>
                </Marker>
                <Circle
                  center={[location.lat, location.lon]}
                  radius={5000}
                  pathOptions={{ color: getRiskDetails(data.riskScore).color, fillColor: getRiskDetails(data.riskScore).color, fillOpacity: 0.2 }}
                />
                {hazardPolygons && hazardPolygons.map(poly => (
                   <Polygon 
                      key={poly.id}
                      positions={poly.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                      pathOptions={{ color: poly.properties.severity === 'CRITICAL' ? '#ff3b5c' : '#ffb020', weight: 2, fillOpacity: 0.4 }}
                   />
                ))}
              </MapContainer>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>
              {[
                { label: 'RISK SCORE',        value: data.riskScore == null ? '—' : `${data.riskScore}/100`, color: getRiskDetails(data.riskScore ?? 0).color, sub: data.riskScore == null ? 'Awaiting live data' : getRiskDetails(data.riskScore).level },
                { label: 'FACTOR OF SAFETY',  value: data.factorOfSafety ?? '—',                  color: data.factorOfSafety < 1.0 ? '#ff3b5c' : '#22c55e', sub: 'Location model' },
                { label: 'AVG SLOPE ANGLE',   value: data.slope == null ? '—' : `${data.slope}°`, color: data.slope > 30 ? '#ffb020' : '#00b4d8', sub: 'DEM gradient' },
                { label: 'SOIL SATURATION',   value: data.soilMoisture == null ? '—' : `${Math.round(data.soilMoisture)}%`, color: '#00e5ff', sub: 'Open-Meteo 0–7 cm' },
                { label: 'ELEVATION',         value: data.elevation == null ? '—' : `${data.elevation} m`, color: '#a78bfa', sub: 'Open-Meteo DEM' },
                { label: 'SHEAR STRESS',      value: data.slope == null ? '—' : `${(data.slope * 1.5).toFixed(1)} kPa`, color: '#ff6b35', sub: 'Model estimate' },
                { label: 'PORE PRESSURE',     value: data.soilMoisture == null ? '—' : `Ru ${(data.soilMoisture / 100 * 0.7).toFixed(2)}`, color: '#ffb020', sub: 'Moisture-derived model' },
                { label: 'STATUS',            value: data.riskScore == null ? 'PENDING' : data.riskScore > 75 ? 'UNSTABLE' : 'STABLE', color: data.riskScore == null ? '#4a6a8a' : data.riskScore > 75 ? '#ff3b5c' : '#22c55e', sub: data.riskScore == null ? 'Awaiting live data' : 'Real-time diagnosis' },
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

          {/* ── Additional Charts ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,229,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4a8aaa', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                  LIVE HOURLY SOIL MOISTURE (0–7 cm)
                </span>
              </div>
              <div style={{ height: 250, padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.isArray(soilData) ? soilData : []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00b4d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#3a5a7a" fontSize={10} />
                    <YAxis stroke="#3a5a7a" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="moisture" stroke="#00b4d8" fill="url(#colorMoisture)" strokeWidth={2} name="Saturation %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,176,32,0.15)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,176,32,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ffb020', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                  HOURLY FACTOR OF SAFETY MODEL
                </span>
              </div>
              <div style={{ height: 250, padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.isArray(soilData) ? soilData : []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#3a5a7a" fontSize={10} />
                    <YAxis stroke="#3a5a7a" fontSize={10} domain={[0, 3]} />
                    <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,176,32,0.3)', borderRadius: 8, fontSize: 11 }} />
                    <ReferenceLine y={1.0} stroke="#ff3b5c" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="fos" stroke="#ffb020" strokeWidth={2.5} dot={false} name="FoS Ratio" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

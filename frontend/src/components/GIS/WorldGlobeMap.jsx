import React, { useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix broken marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASEMAP_URLS = {
  satellite: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};

function makeIcon(emoji, color = '#00e5ff', size = 24) {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:${size}px;filter:drop-shadow(0 0 6px ${color});line-height:1;text-align:center;">${emoji}</div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, size + 4],
    popupAnchor: [0, -(size + 4)],
  });
}

export default function WorldGlobeMap({
  targetLat = 20.5937,
  targetLon = 78.9629,
  zoomAltitude = 12000000,
  basemap = 'satellite',
  layers = {},
  data = {},
  riskScore = 50,
  riskLevel = 'MODERATE',
  riskRadius = 5000,
  localityLabel = '',
  isScanning = false,
  onLocationClick,
  onMarkerSelect,
  onHoverCoords,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({});
  const tileLayerRef = useRef(null);
  const riskCircleRef = useRef(null);
  const targetMarkerRef = useRef(null);
  const onLocationClickRef = useRef(onLocationClick);
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const onHoverCoordsRef = useRef(onHoverCoords);

  useEffect(() => { onLocationClickRef.current = onLocationClick; }, [onLocationClick]);
  useEffect(() => { onMarkerSelectRef.current = onMarkerSelect; }, [onMarkerSelect]);
  useEffect(() => { onHoverCoordsRef.current = onHoverCoords; }, [onHoverCoords]);

  // Convert zoomAltitude (meters) to Leaflet zoom level
  const altToZoom = (alt) => {
    if (alt >= 10000000) return 3;
    if (alt >= 5000000) return 4;
    if (alt >= 2000000) return 5;
    if (alt >= 800000) return 6;
    if (alt >= 300000) return 7;
    if (alt >= 100000) return 8;
    if (alt >= 50000) return 9;
    if (alt >= 20000) return 10;
    if (alt >= 10000) return 11;
    if (alt >= 5000) return 12;
    if (alt >= 2000) return 13;
    return 14;
  };

  // Risk theme
  const getRiskTheme = (score) => {
    if (score > 70) return { color: '#ff3b5c', fill: 'rgba(255,59,92,0.18)', emoji: '🔴' };
    if (score > 30) return { color: '#ffb020', fill: 'rgba(255,176,32,0.18)', emoji: '🟡' };
    return { color: '#22c55e', fill: 'rgba(34,197,94,0.18)', emoji: '🟢' };
  };

  // 1. Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [targetLat, targetLon],
      zoom: altToZoom(zoomAltitude),
      zoomControl: true,
      attributionControl: false,
    });

    // Public, key-free tile layer.  Do not replace this with Carto's hosted
    // basemap endpoint: it rejects unauthenticated requests with “API key
    // required”, which prevents every hazard overlay from rendering.
    const tileLayer = L.tileLayer(BASEMAP_URLS[basemap] || BASEMAP_URLS.satellite, {
      maxZoom: 19,
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors',
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Create layer groups
    const groups = {};
    ['earthquakes', 'volcanoes', 'cyclones', 'floods', 'landslides', 'sensors', 'alerts', 'riskZone', 'targetPin'].forEach(name => {
      groups[name] = L.layerGroup().addTo(map);
    });
    layerGroupsRef.current = groups;

    // Click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (onLocationClickRef.current) {
        onLocationClickRef.current({ lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lng.toFixed(4)) });
      }
    });

    // Mouse move handler for coords
    map.on('mousemove', (e) => {
      if (onHoverCoordsRef.current) {
        onHoverCoordsRef.current({
          lat: e.latlng.lat.toFixed(4),
          lon: e.latlng.lng.toFixed(4),
          cameraAltitude: `${Math.round(map.getZoom())} zoom`,
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fly to target when location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (isNaN(targetLat) || isNaN(targetLon)) return;
    const zoom = altToZoom(zoomAltitude);
    map.flyTo([targetLat, targetLon], zoom, { duration: 1.4, easeLinearity: 0.3 });
  }, [targetLat, targetLon, zoomAltitude]);

  // 3. Basemap switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(BASEMAP_URLS[basemap] || BASEMAP_URLS.satellite);
  }, [basemap]);

  // 4. Risk zone circle + target pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    const groups = layerGroupsRef.current;
    if (!map || !groups.riskZone || !groups.targetPin) return;
    if (isNaN(targetLat) || isNaN(targetLon)) return;

    groups.riskZone.clearLayers();
    groups.targetPin.clearLayers();

    const theme = getRiskTheme(riskScore);
    const radiusM = riskRadius || 5000;

    // Outer pulsing ring (larger)
    L.circle([targetLat, targetLon], {
      radius: radiusM * 1.35,
      color: theme.color,
      fillColor: theme.color,
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '8 6',
    }).addTo(groups.riskZone);

    // Main risk zone circle
    L.circle([targetLat, targetLon], {
      radius: radiusM,
      color: theme.color,
      fillColor: theme.color,
      fillOpacity: 0.15,
      weight: 2,
    }).bindPopup(`
      <div style="font-family:monospace;font-size:12px;min-width:180px">
        <div style="font-weight:700;color:${theme.color};font-size:14px">${theme.emoji} ${riskLevel}</div>
        <div><b>Location:</b> ${localityLabel || `${targetLat.toFixed(4)}°N, ${targetLon.toFixed(4)}°E`}</div>
        <div><b>Risk Score:</b> ${riskScore}/100</div>
        <div><b>Radius:</b> ${(radiusM / 1000).toFixed(1)} km</div>
      </div>
    `).addTo(groups.riskZone);

    // Target pin marker
    const pinIcon = makeIcon(theme.emoji === '🔴' ? '🎯' : theme.emoji === '🟡' ? '⚠️' : '📍', theme.color, 28);
    L.marker([targetLat, targetLon], { icon: pinIcon })
      .bindPopup(`<div style="font-family:monospace;font-size:12px"><b>${localityLabel || 'Selected Location'}</b><br/>${targetLat.toFixed(4)}°N, ${targetLon.toFixed(4)}°E<br/>Score: ${riskScore}/100</div>`)
      .addTo(groups.targetPin);
  }, [targetLat, targetLon, riskScore, riskLevel, riskRadius, localityLabel]);

  // 5. Earthquakes layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const groups = layerGroupsRef.current;
    if (!map || !groups.earthquakes) return;
    groups.earthquakes.clearLayers();

    const eqList = Array.isArray(data.earthquakes) ? data.earthquakes : [];
    eqList.forEach(eq => {
      const lat = Number(eq.lat);
      const lon = Number(eq.lon);
      if (isNaN(lat) || isNaN(lon)) return;
      const mag = Number(eq.magnitude) || 3;
      const color = mag >= 5.5 ? '#ff3b5c' : mag >= 4.5 ? '#ffb020' : '#00e5ff';
      const radius = Math.max(20000, mag * 35000);

      L.circle([lat, lon], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 1.5,
      }).bindPopup(`
        <div style="font-family:monospace;font-size:12px">
          <b style="color:${color}">🔴 M${mag.toFixed(1)} Earthquake</b><br/>
          <b>Place:</b> ${eq.place || 'Unknown'}<br/>
          <b>Depth:</b> ${eq.depth_km || '?'} km<br/>
          <b>Coords:</b> ${lat.toFixed(3)}°, ${lon.toFixed(3)}°
        </div>
      `).addTo(groups.earthquakes);
    });
    if (layers.earthquakes === false) groups.earthquakes.remove();
    else groups.earthquakes.addTo(map);
  }, [data.earthquakes, layers.earthquakes]);

  // 6. Volcanoes layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const groups = layerGroupsRef.current;
    if (!map || !groups.volcanoes) return;
    groups.volcanoes.clearLayers();

    const volList = Array.isArray(data.volcanoes) ? data.volcanoes : [];
    volList.forEach(v => {
      const lat = Number(v.lat);
      const lon = Number(v.lon);
      if (isNaN(lat) || isNaN(lon)) return;
      const isActive = (v.status || '').toUpperCase() === 'ACTIVE';
      const icon = makeIcon(isActive ? '🌋' : '⛰️', isActive ? '#ff6b35' : '#8a9ab5', 22);

      L.marker([lat, lon], { icon })
        .bindPopup(`
          <div style="font-family:monospace;font-size:12px">
            <b>${v.name || 'Volcano'}</b><br/>
            Status: <b style="color:${isActive ? '#ff6b35' : '#8a9ab5'}">${v.status || 'Unknown'}</b><br/>
            ${v.country ? `Country: ${v.country}<br/>` : ''}
            ${v.last_eruption ? `Last Eruption: ${v.last_eruption}` : ''}
          </div>
        `).addTo(groups.volcanoes);
    });
    if (layers.volcanoes === false) groups.volcanoes.remove();
    else groups.volcanoes.addTo(map);
  }, [data.volcanoes, layers.volcanoes]);

  // 7. Cyclones layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const groups = layerGroupsRef.current;
    if (!map || !groups.cyclones) return;
    groups.cyclones.clearLayers();

    const cycList = Array.isArray(data.cyclones) ? data.cyclones : [];
    cycList.forEach(cyc => {
      const track = cyc.track || {};
      const current = track.current || { lat: cyc.lat, lon: cyc.lon };
      if (!current || isNaN(Number(current.lat)) || isNaN(Number(current.lon))) return;

      const lat = Number(current.lat);
      const lon = Number(current.lon);
      const stormRadius = (cyc.affected_radius_km || 200) * 1000;

      L.circle([lat, lon], {
        radius: stormRadius,
        color: '#9c27b0',
        fillColor: '#9c27b0',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 4',
      }).bindPopup(`
        <div style="font-family:monospace;font-size:12px">
          <b>🌀 ${cyc.name || 'Cyclone'}</b><br/>
          Category: ${cyc.category || 'N/A'}<br/>
          Wind: ${cyc.wind_speed_kmh || '?'} km/h<br/>
          Pressure: ${cyc.pressure_hpa || '?'} hPa
        </div>
      `).addTo(groups.cyclones);

      const cycIcon = makeIcon('🌀', '#9c27b0', 26);
      L.marker([lat, lon], { icon: cycIcon }).addTo(groups.cyclones);

      // Historical track
      if (Array.isArray(track.historical) && track.historical.length > 1) {
        const pts = track.historical
          .filter(p => !isNaN(Number(p.lat)) && !isNaN(Number(p.lon)))
          .map(p => [Number(p.lat), Number(p.lon)]);
        if (pts.length > 1) {
          L.polyline(pts, { color: '#aaa', weight: 2, dashArray: '5 8' }).addTo(groups.cyclones);
        }
      }
      // Forecast track
      if (Array.isArray(track.forecast) && track.forecast.length > 0) {
        const fpts = [[lat, lon], ...track.forecast
          .filter(p => !isNaN(Number(p.lat)) && !isNaN(Number(p.lon)))
          .map(p => [Number(p.lat), Number(p.lon)])];
        if (fpts.length > 1) {
          L.polyline(fpts, { color: '#9c27b0', weight: 2.5 }).addTo(groups.cyclones);
        }
      }
    });
    if (layers.cyclones === false) groups.cyclones.remove();
    else groups.cyclones.addTo(map);
  }, [data.cyclones, layers.cyclones]);

  // 8. Hazard polygons (floods & landslides)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const groups = layerGroupsRef.current;
    if (!map || !groups.floods || !groups.landslides) return;
    groups.floods.clearLayers();
    groups.landslides.clearLayers();

    const features = Array.isArray(data.hazardPolygons?.features) ? data.hazardPolygons.features : [];
    features.forEach(feat => {
      const props = feat.properties || {};
      const coords = feat.geometry?.coordinates?.[0] || [];
      if (coords.length < 3) return;

      const latlngs = [];
      let valid = true;
      coords.forEach(([pLon, pLat]) => {
        const lt = Number(pLat); const ln = Number(pLon);
        if (isNaN(lt) || isNaN(ln)) { valid = false; return; }
        latlngs.push([lt, ln]);
      });
      if (!valid || latlngs.length < 3) return;

      const isLandslide = props.hazard_type === 'LANDSLIDE';
      const color = isLandslide ? '#ff6b35' : '#00b4d8';
      const group = isLandslide ? groups.landslides : groups.floods;

      L.polygon(latlngs, {
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 1.5,
      }).bindPopup(`
        <div style="font-family:monospace;font-size:12px">
          <b>${isLandslide ? '🏔️' : '🌊'} ${props.name || props.hazard_type}</b><br/>
          Severity: <b>${props.severity || 'N/A'}</b><br/>
          Area: ${props.area_km2 || '?'} km²
        </div>
      `).addTo(group);
    });

    if (layers.floods === false) groups.floods.remove();
    else groups.floods.addTo(map);
    if (layers.landslides === false) groups.landslides.remove();
    else groups.landslides.addTo(map);
  }, [data.hazardPolygons, layers.floods, layers.landslides]);

  // 9. Sensors layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const groups = layerGroupsRef.current;
    if (!map || !groups.sensors) return;
    groups.sensors.clearLayers();

    const sensorList = Array.isArray(data.sensors) ? data.sensors : [];
    sensorList.forEach(s => {
      const lat = Number(s.lat);
      const lon = Number(s.lon);
      if (isNaN(lat) || isNaN(lon)) return;
      const isOnline = (s.status_code || '').toUpperCase() === 'ONLINE';
      const icon = makeIcon(isOnline ? '📡' : '⚠️', isOnline ? '#22c55e' : '#ffb020', 18);
      L.marker([lat, lon], { icon })
        .bindPopup(`<div style="font-family:monospace;font-size:12px"><b>${s.name || 'Sensor'}</b><br/>Status: ${s.status_code || 'UNKNOWN'}</div>`)
        .addTo(groups.sensors);
    });
    if (layers.sensors === false) groups.sensors.remove();
    else groups.sensors.addTo(map);
  }, [data.sensors, layers.sensors]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#05070a',
        filter: isScanning ? 'brightness(1.15) hue-rotate(10deg)' : 'none',
        transition: 'filter 0.3s ease',
      }}
    />
  );
}

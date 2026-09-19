import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, LayersControl, useMap } from 'react-leaflet';

// Fix Leaflet default marker icon broken by bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Custom emoji-based div icons
const createDivIcon = (emoji, color = '#00e5ff') =>
  L.divIcon({
    className: '',
    html: `<div style="font-size:22px;filter:drop-shadow(0 0 4px ${color});line-height:1;">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

const USER_PIN_ICON = createDivIcon('📍', '#2979ff');
const ACTIVE_VOLCANO_ICON = createDivIcon('🌋', '#ff6b35');
const DORMANT_VOLCANO_ICON = createDivIcon('⛰', '#8a9ab5');

// Inner component that flies to new center whenever it changes
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (
      center &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      const [lat, lon] = center;
      if (
        !prevCenter.current ||
        prevCenter.current[0] !== lat ||
        prevCenter.current[1] !== lon
      ) {
        map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 });
        prevCenter.current = center;
      }
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * DisasterMap — Leaflet-based multi-layer disaster intelligence map.
 *
 * Props:
 *  center      [lat, lon]
 *  zoom        number (default 8)
 *  userPin     { lat, lon, label }
 *  earthquakes [{ lat, lon, magnitude, place }]
 *  volcanoes   [{ lat, lon, name, status }]
 *  cycloneTrack { current: {lat,lon}, historical: [{lat,lon}], forecast: [{lat,lon}], windRadius_km }
 *  layers      string[] — 'user-pin' | 'earthquakes' | 'volcanoes' | 'cyclone' | 'tectonic'
 *  height      number (px, default 500)
 */
export default function DisasterMap({
  center = [20, 78],
  zoom = 5,
  userPin,
  earthquakes = [],
  volcanoes = [],
  cycloneTrack,
  layers = ['user-pin'],
  height = 500,
  language = 'en',
}) {
  const safeCenter = (
    center &&
    center.length === 2 &&
    !isNaN(center[0]) &&
    !isNaN(center[1])
  ) ? center : [20, 78];

  const showUserPin    = layers.includes('user-pin');
  const showEarthquakes = layers.includes('earthquakes');
  const showVolcanoes  = layers.includes('volcanoes');
  const showCyclone    = layers.includes('cyclone');

  return (
    <div style={{ height, width: '100%', borderRadius: 6, overflow: 'hidden' }}>
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        {/* The English reference layer is deliberately used for global maps so
            labels stay readable after a location search in any country. */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='Tiles &copy; OpenStreetMap contributors'
          maxZoom={19}
          className={`map-language-${language}`}
        />

        {/* Fly to new center when props change */}
        <MapFlyTo center={safeCenter} zoom={zoom} />

        <LayersControl position="topright">
          {/* User pin */}
          {showUserPin && userPin && !isNaN(userPin.lat) && !isNaN(userPin.lon) && (
            <LayersControl.Overlay checked name="📍 User Location">
              <Marker position={[userPin.lat, userPin.lon]} icon={USER_PIN_ICON}>
                <Popup>
                  <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    <strong>{userPin.label || 'Selected Location'}</strong><br />
                    {userPin.lat?.toFixed(4)}°, {userPin.lon?.toFixed(4)}°
                  </div>
                </Popup>
              </Marker>
            </LayersControl.Overlay>
          )}

          {/* Earthquakes */}
          {showEarthquakes && earthquakes.length > 0 && (
            <LayersControl.Overlay checked name="🔴 Earthquakes">
              <>
                {earthquakes.map((eq, i) => {
                  const radius = Math.max(eq.magnitude * 12000, 8000);
                  const color = eq.magnitude >= 6 ? '#ff3b5c' : eq.magnitude >= 4 ? '#ff6b35' : '#ffb020';
                  return (
                    <Circle
                      key={`eq-${i}`}
                      center={[eq.lat, eq.lon]}
                      radius={radius}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 1 }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          <strong>M{eq.magnitude?.toFixed(1)}</strong><br />
                          {eq.place}<br />
                          Depth: {eq.depth_km?.toFixed(1)} km<br />
                          Distance: {eq.distance_km?.toFixed(0)} km
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
              </>
            </LayersControl.Overlay>
          )}

          {/* Volcanoes */}
          {showVolcanoes && volcanoes.length > 0 && (
            <LayersControl.Overlay checked name="🌋 Volcanoes">
              <>
                {volcanoes.map((v, i) => {
                  const isActive = (v.status || '').toUpperCase() === 'ACTIVE';
                  return (
                    <Marker
                      key={`v-${i}`}
                      position={[v.lat, v.lon]}
                      icon={isActive ? ACTIVE_VOLCANO_ICON : DORMANT_VOLCANO_ICON}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          <strong>{v.name}</strong><br />
                          Status: {v.status}<br />
                          {v.country && <>Country: {v.country}<br /></>}
                          {v.distance_km && <>Distance: {v.distance_km?.toFixed(0)} km<br /></>}
                          {v.last_eruption && <>Last Eruption: {v.last_eruption}</>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </>
            </LayersControl.Overlay>
          )}

          {/* Cyclone track */}
          {showCyclone && cycloneTrack && (
            <LayersControl.Overlay checked name="🌀 Cyclone Track">
              <>
                {cycloneTrack.current && (
                  <Circle
                    center={[cycloneTrack.current.lat, cycloneTrack.current.lon]}
                    radius={(cycloneTrack.windRadius_km || 100) * 1000}
                    pathOptions={{ color: '#9c27b0', fillColor: '#9c27b0', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        <strong>Cyclone Position</strong><br />
                        Wind Radius: {cycloneTrack.windRadius_km} km
                      </div>
                    </Popup>
                  </Circle>
                )}
                {cycloneTrack.historical?.length > 1 && (
                  <Polyline
                    positions={cycloneTrack.historical.map(p => [p.lat, p.lon])}
                    pathOptions={{ color: '#666', weight: 2, dashArray: '5 8' }}
                  />
                )}
                {cycloneTrack.forecast?.length > 1 && (
                  <Polyline
                    positions={cycloneTrack.forecast.map(p => [p.lat, p.lon])}
                    pathOptions={{ color: '#9c27b0', weight: 2 }}
                  />
                )}
              </>
            </LayersControl.Overlay>
          )}
        </LayersControl>
      </MapContainer>
    </div>
  );
}

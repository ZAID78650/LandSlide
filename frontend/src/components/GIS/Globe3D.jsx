import React, { useEffect, useRef, useCallback } from 'react';

const RISK_COLORS = {
  HIGH:     { ring: '#ff3b5c', fill: 'rgba(255,59,92,0.18)',  label: '🔴 HIGH RISK'   },
  MODERATE: { ring: '#ffb020', fill: 'rgba(255,176,32,0.18)', label: '🟡 AT RISK'     },
  LOW:      { ring: '#22c55e', fill: 'rgba(34,197,94,0.18)',  label: '🟢 SAFE'        },
};

function riskTheme(score) {
  if (score > 70) return RISK_COLORS.HIGH;
  if (score > 30) return RISK_COLORS.MODERATE;
  return RISK_COLORS.LOW;
}

export default function Globe3D({
  targetLat    = 20.5937,
  targetLon    = 78.9629,
  zoomAlt      = 2.5,        // globe.gl altitude ratio (0.04 = street, 2.5 = globe view)
  autoRotate   = false,
  data         = {},
  layers       = {},
  riskScore    = 50,
  riskRadius   = 5000,
  localityLabel = '',
  onLocationClick,
  onMarkerSelect,
  onHoverCoords,
}) {
  const containerRef = useRef(null);
  const globeRef     = useRef(null);
  const animRef      = useRef(null);
  const onLocationClickRef = useRef(onLocationClick);
  const onMarkerSelectRef  = useRef(onMarkerSelect);
  const onHoverCoordsRef   = useRef(onHoverCoords);

  useEffect(() => { onLocationClickRef.current = onLocationClick; }, [onLocationClick]);
  useEffect(() => { onMarkerSelectRef.current  = onMarkerSelect;  }, [onMarkerSelect]);
  useEffect(() => { onHoverCoordsRef.current   = onHoverCoords;   }, [onHoverCoords]);

  // ── 1. Build globe once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let globe;

    import('globe.gl').then(({ default: Globe }) => {
      if (!containerRef.current) return;

      globe = Globe()(containerRef.current);

      // Globe appearance
      globe
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#1a4a8a')
        .atmosphereAltitude(0.18)
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight);

      // Click on globe surface
      globe.onGlobeClick(({ lat, lng }) => {
        if (onLocationClickRef.current) {
          onLocationClickRef.current({ lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lng.toFixed(4)) });
        }
      });

      globeRef.current = globe;

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current && globe && !globe._destroyed) {
          globe
            .width(containerRef.current.clientWidth)
            .height(containerRef.current.clientHeight);
        }
      });
      ro.observe(containerRef.current);

      return () => ro.disconnect();
    });

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (globe) {
        try { globe._destroyed = true; } catch (_) {}
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
      globeRef.current = null;
    };
  }, []);

  // ── 2. Auto-rotate ───────────────────────────────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (autoRotate) {
      let angle = 0;
      const tick = () => {
        angle += 0.12;
        g.controls().autoRotate      = false; // manual control
        const pos = g.camera().position;
        // just spin controls
        g.controls().autoRotate      = autoRotate;
        g.controls().autoRotateSpeed = 0.5;
      };
      animRef.current = requestAnimationFrame(tick);
    }
    if (g.controls) {
      g.controls().autoRotate      = autoRotate;
      g.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotate]);

  // ── 3. Fly to target ─────────────────────────────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g || isNaN(targetLat) || isNaN(targetLon)) return;
    g.pointOfView({ lat: targetLat, lng: targetLon, altitude: zoomAlt }, 1200);
  }, [targetLat, targetLon, zoomAlt]);

  // ── 4. Risk ring marker ──────────────────────────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g || isNaN(targetLat) || isNaN(targetLon)) return;

    const theme = riskTheme(riskScore);
    const radiusKm = (riskRadius / 1000) || 5;

    g.ringsData([{
      lat: targetLat,
      lng: targetLon,
      maxR: Math.max(1, radiusKm / 111),   // degrees ≈ km/111
      propagationSpeed: 1.8,
      repeatPeriod: 900,
      color: () => theme.ring,
    }])
    .ringColor('color')
    .ringMaxRadius('maxR')
    .ringPropagationSpeed('propagationSpeed')
    .ringRepeatPeriod('repeatPeriod');

    // Pin label
    g.labelsData([{
      lat: targetLat,
      lng: targetLon,
      text: `${theme.label}\n${localityLabel || `${targetLat.toFixed(2)}°N ${targetLon.toFixed(2)}°E`}\nScore: ${riskScore}/100`,
      size: 1.4,
      color: theme.ring,
    }])
    .labelText('text')
    .labelSize('size')
    .labelColor('color')
    .labelDotRadius(0.5)
    .labelAltitude(0.01);
  }, [targetLat, targetLon, riskScore, riskRadius, localityLabel]);

  // ── 5. Earthquake & volcano points ──────────────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;

    const eqPoints = (Array.isArray(data.earthquakes) ? data.earthquakes : [])
      .filter(eq => !isNaN(Number(eq.lat)) && !isNaN(Number(eq.lon)))
      .map(eq => ({
        lat:   Number(eq.lat),
        lng:   Number(eq.lon),
        alt:   0.005,
        radius: Math.max(0.3, Number(eq.magnitude) * 0.12),
        color:  Number(eq.magnitude) >= 5.5 ? '#ff3b5c' : Number(eq.magnitude) >= 4 ? '#ffb020' : '#00e5ff',
        label:  `🔴 M${Number(eq.magnitude).toFixed(1)} — ${eq.place || 'Earthquake'}`,
        type:   'earthquake',
        raw:    eq,
      }));

    const volPoints = (Array.isArray(data.volcanoes) ? data.volcanoes : [])
      .filter(v => !isNaN(Number(v.lat)) && !isNaN(Number(v.lon)))
      .map(v => ({
        lat:    Number(v.lat),
        lng:    Number(v.lon),
        alt:    0.007,
        radius: 0.45,
        color:  (v.status || '').toUpperCase() === 'ACTIVE' ? '#ff6b35' : '#8a9ab5',
        label:  `🌋 ${v.name || 'Volcano'} — ${v.status || ''}`,
        type:   'volcano',
        raw:    v,
      }));

    const allPoints = [...eqPoints, ...volPoints];

    g.pointsData(allPoints)
      .pointLat('lat')
      .pointLng('lng')
      .pointAltitude('alt')
      .pointRadius('radius')
      .pointColor('color')
      .pointLabel('label')
      .onPointClick((pt) => {
        if (onMarkerSelectRef.current) {
          onMarkerSelectRef.current({
            type:  pt.type,
            name:  pt.label,
            lat:   pt.lat,
            lon:   pt.lng,
            ...pt.raw,
          });
        }
      });
  }, [data.earthquakes, data.volcanoes]);

  // ── 6. Cyclone arcs ─────────────────────────────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;

    const arcs = [];
    (Array.isArray(data.cyclones) ? data.cyclones : []).forEach(cyc => {
      const track = cyc.track || {};
      const cur   = track.current;
      if (!cur || isNaN(Number(cur.lat)) || isNaN(Number(cur.lon))) return;

      const forecast = Array.isArray(track.forecast) ? track.forecast : [];
      forecast.forEach((pt, i) => {
        const prev = i === 0 ? cur : forecast[i - 1];
        if (!prev || isNaN(Number(prev.lat)) || isNaN(Number(prev.lon))) return;
        if (isNaN(Number(pt.lat)) || isNaN(Number(pt.lon))) return;
        arcs.push({
          startLat: Number(prev.lat), startLng: Number(prev.lon),
          endLat:   Number(pt.lat),   endLng:   Number(pt.lon),
          color:    ['#9c27b0', '#00e5ff'],
          label:    `🌀 ${cyc.name || 'Cyclone'} forecast`,
        });
      });
    });

    g.arcsData(arcs)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcStroke(0.4)
      .arcDashLength(0.6)
      .arcDashGap(0.3)
      .arcDashAnimateTime(1500)
      .arcLabel('label');
  }, [data.cyclones]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#020408' }}
    />
  );
}

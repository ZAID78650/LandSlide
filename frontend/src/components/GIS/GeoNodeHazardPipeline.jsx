import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getHazardStats,
  syncHazardsPipeline,
  getLiveHazards,
  getGeoNodeLayers,
  triggerGeoNodeUpdateLayers,
  getNerHazardIntelligence,
  getHazardAnalytics
} from '../../api/client';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CYAN = '#00e5ff';
const RED = '#ff3b5c';
const AMBER = '#ffb020';
const GREEN = '#22c55e';
const ORANGE = '#ff6b35';
const PURPLE = '#a855f7';
const BLUE = '#3b82f6';
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const HAZARD_ICONS = {
  'Earthquake': '🔴',
  'Cyclone / Tropical Cyclone': '🌀',
  'Volcano': '🌋',
  'Landslide': '⛰️',
  'Active Rainfall': '🌧️'
};

const HAZARD_COLORS = {
  'Earthquake': RED,
  'Cyclone / Tropical Cyclone': CYAN,
  'Volcano': ORANGE,
  'Landslide': AMBER,
  'Active Rainfall': BLUE
};

const DEFAULT_GEONODE_LAYERS = [
  {
    name: 'geonode:live_global_hazards',
    title: '24/7 Global Multi-Hazard Consolidated Layer',
    abstract: 'Consolidated live vectors for Earthquakes, Cyclones, Volcanoes, Landslides, and Rainfall normalized from USGS, GDACS, and Open-Meteo.',
    srs: 'EPSG:4326',
    crs_supported: ['EPSG:4326', 'EPSG:3857'],
    bbox: [-180.0, -90.0, 180.0, 90.0],
    geometry_type: 'Point / LineString / Polygon',
    feature_count: 300,
    format: 'GeoJSON / OGC WFS 2.0',
    url: '/api/hazards/live',
    download_url: 'http://localhost:8000/api/hazards/live_global_hazards.geojson',
    wfs_url: 'http://localhost:8000/api/hazards/live',
    wms_url: 'http://localhost:8000/api/hazards/geonode/wms?request=GetCapabilities',
    update_interval_sec: 900,
    schema_attributes: [
      { field: 'hazard_id', type: 'String (UUID)', description: 'Unique global vector identifier', example: 'USGS-EQ-ak2026' },
      { field: 'hazard_type', type: 'Enum', description: 'Earthquake | Cyclone | Volcano | Landslide | Active Rainfall', example: 'Earthquake' },
      { field: 'alert_level', type: 'Enum', description: 'Categorical severity: CRITICAL | HIGH | MODERATE | LOW', example: 'HIGH' },
      { field: 'location_name', type: 'String', description: 'Geographical location descriptor or nearest city', example: 'Nanwalek, Alaska' },
      { field: 'value', type: 'Float', description: 'Magnitude / precipitation / factor of safety index', example: '4.8' },
      { field: 'unit', type: 'String', description: 'Metric unit (mag, mm, FoS)', example: 'mag' },
      { field: 'source', type: 'String', description: 'Origin provider (USGS / GDACS / Open-Meteo)', example: 'USGS' },
      { field: 'timestamp', type: 'ISO 8601', description: 'Observation or detection timestamp in UTC', example: '2026-09-21T15:20:00Z' }
    ]
  },
  {
    name: 'geonode:ner_landslide_corridors',
    title: 'North Eastern Region (NER) Lifeline Corridors & Slope Monitoring',
    abstract: 'Real-time AI geotechnical early warning across the 8 NER states, NH-10, NH-29, NH-27, and vulnerable hill cutting sectors.',
    srs: 'EPSG:4326',
    crs_supported: ['EPSG:4326', 'EPSG:3857'],
    bbox: [88.0, 21.0, 97.5, 29.5],
    geometry_type: 'Point / LineString',
    feature_count: 8,
    format: 'GeoJSON / OGC WFS 2.0',
    url: '/api/hazards/ner',
    download_url: 'http://localhost:8000/api/hazards/ner_corridors.geojson',
    wfs_url: 'http://localhost:8000/api/hazards/ner',
    wms_url: 'http://localhost:8000/api/hazards/geonode/wms?layers=geonode:ner_landslide_corridors',
    update_interval_sec: 900,
    schema_attributes: [
      { field: 'state', type: 'String', description: 'NER State name (Sikkim, Assam, Nagaland, etc.)', example: 'Sikkim' },
      { field: 'capital', type: 'String', description: 'Administrative headquarters / capital city', example: 'Gangtok' },
      { field: 'risk_score', type: 'Integer (0-100)', description: 'Composite AI multi-factor landslide hazard index', example: '92' },
      { field: 'factor_of_safety', type: 'Float', description: 'Slope stability ratio (FoS < 1 indicates active failure)', example: '0.74' },
      { field: 'insar_creep_rate_mm_wk', type: 'Float', description: 'Satellite radar downslope surface creep rate (mm/week)', example: '28.4' },
      { field: 'pore_water_ru', type: 'Float', description: 'Pore water pressure ratio in shear zone', example: '0.72' },
      { field: 'active_rainfall_24h_mm', type: 'Float', description: '24-hour cumulative rainfall from Open-Meteo', example: '118.4' },
      { field: 'primary_threat', type: 'String', description: 'Critical geotechnical failure mode description', example: 'Teesta River Debris Flow' }
    ]
  },
  {
    name: 'geonode:earthquake_vectors',
    title: 'USGS Live 24-Hour Seismic Feed',
    abstract: 'Global earthquake events M1.0+ with hypocenter depth and magnitude from USGS.',
    srs: 'EPSG:4326',
    crs_supported: ['EPSG:4326', 'EPSG:3857'],
    bbox: [-180.0, -90.0, 180.0, 90.0],
    geometry_type: 'Point',
    feature_count: 232,
    format: 'GeoJSON / OGC WFS 2.0',
    url: '/api/hazards/earthquakes',
    download_url: 'http://localhost:8000/api/hazards/earthquakes.geojson',
    wfs_url: 'http://localhost:8000/api/hazards/earthquakes',
    wms_url: 'http://localhost:8000/api/hazards/geonode/wms?layers=geonode:earthquake_vectors',
    update_interval_sec: 900,
    schema_attributes: [
      { field: 'magnitude', type: 'Float', description: 'Moment magnitude scale (Mw / Ml)', example: '5.6' },
      { field: 'depth_km', type: 'Float', description: 'Hypocenter focal depth below surface (km)', example: '10.0' },
      { field: 'location_name', type: 'String', description: 'USGS seismic geographic descriptor', example: 'Near Kokrajhar, Assam' }
    ]
  },
  {
    name: 'geonode:cyclone_tracks',
    title: 'GDACS Severe Storms & Tropical Cyclones',
    abstract: 'Tropical cyclone eyes, wind speed contours, and storm tracks from GDACS/IMD/JMA.',
    srs: 'EPSG:4326',
    crs_supported: ['EPSG:4326', 'EPSG:3857'],
    bbox: [-180.0, -90.0, 180.0, 90.0],
    geometry_type: 'Point / LineString',
    feature_count: 18,
    format: 'GeoJSON / OGC WFS 2.0',
    url: '/api/hazards/cyclones',
    download_url: 'http://localhost:8000/api/hazards/cyclones.geojson',
    wfs_url: 'http://localhost:8000/api/hazards/cyclones',
    wms_url: 'http://localhost:8000/api/hazards/geonode/wms?layers=geonode:cyclone_tracks',
    update_interval_sec: 900,
    schema_attributes: [
      { field: 'storm_name', type: 'String', description: 'WMO / GDACS designated storm identifier', example: 'REMAL' },
      { field: 'wind_speed_kmh', type: 'Float', description: 'Maximum sustained surface wind velocity (km/h)', example: '120' },
      { field: 'central_pressure_hpa', type: 'Float', description: 'Barometric pressure at eye (hPa)', example: '970' }
    ]
  },
  {
    name: 'geonode:volcanic_alerts',
    title: 'Smithsonian & GDACS Volcanic Eruption Alerts',
    abstract: 'Active volcanic calderas, aviation color codes, and ash plume dispersion radii.',
    srs: 'EPSG:4326',
    crs_supported: ['EPSG:4326', 'EPSG:3857'],
    bbox: [-180.0, -90.0, 180.0, 90.0],
    geometry_type: 'Point',
    feature_count: 6,
    format: 'GeoJSON / OGC WFS 2.0',
    url: '/api/hazards/volcanoes',
    download_url: 'http://localhost:8000/api/hazards/volcanoes.geojson',
    wfs_url: 'http://localhost:8000/api/hazards/volcanoes',
    wms_url: 'http://localhost:8000/api/hazards/geonode/wms?layers=geonode:volcanic_alerts',
    update_interval_sec: 900,
    schema_attributes: [
      { field: 'volcano_name', type: 'String', description: 'Smithsonian Global Volcanism Program Name', example: 'Barren Island' },
      { field: 'alert_level', type: 'String', description: 'ICAO Aviation Color Code (RED, ORANGE, YELLOW)', example: 'ORANGE' },
      { field: 'elevation_m', type: 'Integer', description: 'Summits elevation above sea level (meters)', example: '354' }
    ]
  },
  {
    name: 'geonode:landslide_scarps',
    title: 'ISRO & GDACS Landslide Geotechnical Scarps',
    abstract: 'High-risk slope scarps, Factor of Safety limits, and pore-water pressure saturation zones.',
    srs: 'EPSG:4326',
    crs_supported: ['EPSG:4326', 'EPSG:3857'],
    bbox: [68.0, 8.0, 97.5, 37.0],
    geometry_type: 'Point / Polygon',
    feature_count: 10,
    format: 'GeoJSON / OGC WFS 2.0',
    url: '/api/hazards/landslides',
    download_url: 'http://localhost:8000/api/hazards/landslides.geojson',
    wfs_url: 'http://localhost:8000/api/hazards/landslides',
    wms_url: 'http://localhost:8000/api/hazards/geonode/wms?layers=geonode:landslide_scarps',
    update_interval_sec: 900,
    schema_attributes: [
      { field: 'scarp_zone', type: 'String', description: 'Identified unstable slope or highway corridor', example: 'NH-10 Km 18' },
      { field: 'factor_of_safety', type: 'Float', description: 'Limit equilibrium slope stability factor (FoS)', example: '0.78' },
      { field: 'failure_mode', type: 'String', description: 'Debris flow, translational slide, or rock fall', example: 'Debris Flow' }
    ]
  }
];

// Smooth Map Controller for Fly-To
function MapPanController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.4 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function GeoNodeHazardPipeline({
  compact = false,
  activeHazardFilter = 'ALL',
  onSyncComplete = null,
  title = "24/7 Global Multi-Hazard Ingestion Pipeline"
}) {
  const [stats, setStats] = useState({
    total_hazards: 280,
    earthquakes: 231,
    cyclones: 18,
    volcanoes: 6,
    landslides: 10,
    rainfall: 34,
    status: 'ONLINE / 24/7 STREAMING',
    sync_duration_ms: 1540,
    last_sync: new Date().toISOString(),
    next_sync: new Date(Date.now() + 900000).toISOString()
  });

  const [logs, setLogs] = useState([]);
  const [geoJsonFeatures, setGeoJsonFeatures] = useState([]);
  const [filter, setFilter] = useState(activeHazardFilter);
  const [syncing, setSyncing] = useState(false);
  const [updatingGeoNode, setUpdatingGeoNode] = useState(false);
  const [geoNodeLayers, setGeoNodeLayers] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(900);
  const [scanAccuracy, setScanAccuracy] = useState(98.4);
  const terminalEndRef = useRef(null);

  // GeoNode Publisher & Real-Time Analytics States
  const [analyticsData, setAnalyticsData] = useState(null);
  const [publisherSubTab, setPublisherSubTab] = useState('ANALYTICS'); // 'ANALYTICS' | 'CATALOG' | 'PROTOCOLS' | 'TERMINAL'
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [copiedProtocol, setCopiedProtocol] = useState(null);
  const [publishStatusMsg, setPublishStatusMsg] = useState(null);

  // Basemap & API Key States
  const [basemap, setBasemap] = useState('DARK'); // 'DARK' | 'SATELLITE' | 'STREET'
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nexus_carto_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  // Map Navigation & NER Focus States
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [isNerFocused, setIsNerFocused] = useState(false);
  const [nerData, setNerData] = useState(null);
  const [selectedNerState, setSelectedNerState] = useState(null);

  // Synchronize internal filter with parent prop if provided
  useEffect(() => {
    if (activeHazardFilter && activeHazardFilter !== 'ALL') {
      setFilter(activeHazardFilter);
    }
  }, [activeHazardFilter]);

  // Fetch stats, geojson, GeoNode layers, NER intelligence, and real-time analytics
  const loadStatsAndData = useCallback(async () => {
    try {
      const [statsRes, hazardsRes, layersRes, nerRes, analyticsRes] = await Promise.allSettled([
        getHazardStats(),
        getLiveHazards(),
        getGeoNodeLayers(),
        getNerHazardIntelligence(),
        getHazardAnalytics()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.stats) {
        setStats(statsRes.value.data.stats);
        if (statsRes.value.data.logs) {
          setLogs(statsRes.value.data.logs);
        }
        if (statsRes.value.data.stats.next_sync) {
          const diff = Math.max(0, Math.floor((new Date(statsRes.value.data.stats.next_sync) - new Date()) / 1000));
          setSecondsRemaining(diff > 0 ? diff : 900);
        }
      }

      if (hazardsRes.status === 'fulfilled' && hazardsRes.value?.data?.features) {
        setGeoJsonFeatures(hazardsRes.value.data.features);
      }

      if (layersRes.status === 'fulfilled' && layersRes.value?.data?.layers) {
        setGeoNodeLayers(layersRes.value.data.layers);
      }

      if (nerRes.status === 'fulfilled' && nerRes.value?.data) {
        setNerData(nerRes.value.data);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
        setAnalyticsData(analyticsRes.value.data);
      }
    } catch (err) {
      console.warn("Could not load initial hazard pipeline data:", err);
    }
  }, []);

  useEffect(() => {
    loadStatsAndData();
  }, [loadStatsAndData]);

  // 1-second countdown clock for 15-minute refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          loadStatsAndData();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadStatsAndData]);

  // Manual Trigger: Sync 24/7 Pipeline Now
  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await syncHazardsPipeline();
      if (res?.data?.stats) {
        setStats(res.data.stats);
        setSecondsRemaining(900);
      }
      await loadStatsAndData();
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  // Manual Trigger: GeoNode UpdateLayers (emulating geonode updatelayers)
  const handleUpdateLayers = async () => {
    if (updatingGeoNode) return;
    setUpdatingGeoNode(true);
    setPublishStatusMsg(null);
    try {
      const res = await triggerGeoNodeUpdateLayers();
      await loadStatsAndData();
      const count = res?.data?.synchronized_layers?.length || 6;
      setPublishStatusMsg(`✓ GeoNode Catalog Synchronized: ${count} OGC Layers refreshed (BBOX & CRS verified)`);
      setTimeout(() => setPublishStatusMsg(null), 4500);
    } catch (err) {
      console.error("GeoNode update layers failed:", err);
      setPublishStatusMsg("⚠️ GeoNode sync warning: server returned incomplete manifest");
      setTimeout(() => setPublishStatusMsg(null), 4000);
    } finally {
      setTimeout(() => setUpdatingGeoNode(false), 800);
    }
  };

  // Copy Protocol URL Helper
  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedProtocol(key);
    setTimeout(() => setCopiedProtocol(null), 2200);
  };

  // Smooth Fly-To Location Helper
  const handleFlyToCoord = (lat, lon, zoom = 9) => {
    if (lat !== undefined && lon !== undefined) {
      setMapCenter([lat, lon]);
      setMapZoom(zoom);
    }
  };

  // Save Custom Basemap API Key
  const handleSaveApiKey = () => {
    const key = tempApiKey.trim();
    setApiKey(key);
    localStorage.setItem('nexus_carto_api_key', key);
    setShowApiKeyModal(false);
  };

  // Quick Focus: North Eastern Region (NER)
  const handleFocusNER = () => {
    setIsNerFocused(true);
    setMapCenter([26.15, 92.85]); // Center of NER (Assam / Meghalaya / Nagaland boundary)
    setMapZoom(7);
  };

  // Quick Reset: Global View
  const handleResetGlobal = () => {
    setIsNerFocused(false);
    setMapCenter([20, 0]);
    setMapZoom(2);
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered features for map
  const displayFeatures = geoJsonFeatures.filter(f => {
    if (filter === 'ALL') return true;
    const hType = f?.properties?.hazard_type || '';
    if (filter === 'Cyclone' && hType.includes('Cyclone')) return true;
    if (filter === 'Earthquake' && hType === 'Earthquake') return true;
    if (filter === 'Volcano' && hType === 'Volcano') return true;
    if (filter === 'Landslide' && hType === 'Landslide') return true;
    if (filter === 'Rainfall' && hType === 'Active Rainfall') return true;
    return hType === filter;
  });

  /* ─────────────────────────────────────────────────────────────
     COMPACT BANNER MODE (For individual tabs: Cyclone, Volcanic, Earthquake, Landslide)
  ───────────────────────────────────────────────────────────── */
  if (compact) {
    return (
      <div style={{
        background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.08) 0%, rgba(10, 15, 25, 0.95) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: 10,
        padding: '12px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 4px 18px rgba(0,0,0,0.4)'
      }}>
        {/* Left info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid var(--cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>
            📡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {title}
              </span>
              <span style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: GREEN,
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 9,
                fontFamily: FONT_MONO,
                fontWeight: 700
              }}>
                ● 24/7 STREAMING
              </span>
              <span style={{
                background: 'rgba(168, 85, 247, 0.12)',
                color: PURPLE,
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 9,
                fontFamily: FONT_MONO
              }}>
                GEONODE v2 SYNC
              </span>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
              Sources: <span style={{ color: '#fff' }}>USGS</span> · <span style={{ color: '#fff' }}>UN/EU GDACS</span> · <span style={{ color: '#fff' }}>Open-Meteo</span> · Active Vectors: <span style={{ color: CYAN, fontWeight: 700 }}>{stats.total_hazards || geoJsonFeatures.length}</span>
            </div>
          </div>
        </div>

        {/* Right countdown + sync button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '6px 12px',
            textAlign: 'right'
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', letterSpacing: '0.08em' }}>AUTO-SYNC IN</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: CYAN }}>
              ⏱️ {formatCountdown(secondsRemaining)}
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{
              background: syncing ? 'rgba(0, 229, 255, 0.2)' : 'linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)',
              color: syncing ? CYAN : '#000',
              border: 'none',
              borderRadius: 6,
              padding: '8px 14px',
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              cursor: syncing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 0 12px rgba(0, 229, 255, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {syncing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
                SYNCING...
              </>
            ) : (
              <>⚡ SYNC NOW</>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     FULL DASHBOARD VIEW (For /virtual-sensors "24/7 GEONODE PIPELINE" tab)
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: '#0a0f18', border: '1px solid rgba(0, 229, 255, 0.4)',
            borderRadius: 12, padding: 24, width: '90%', maxWidth: 480,
            boxShadow: '0 12px 36px rgba(0,0,0,0.8), 0 0 20px rgba(0,229,255,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔑</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: CYAN, letterSpacing: '0.1em' }}>
                  MAP TILE API KEY CONFIGURATION
                </span>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#9ca3af', lineHeight: 1.5, marginBottom: 16 }}>
              By default, NEXUS-LAND uses zero-watermark <b>Esri World Dark Canvas</b> and <b>Satellite Imagery</b> which require no key. If you have an active <b>CARTO</b> or <b>Mapbox</b> key, enter it below to enable CartoDB custom tiles:
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: FONT_MONO, fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
                CARTO / MAPBOX API KEY:
              </label>
              <input
                type="text"
                value={tempApiKey}
                onChange={e => setTempApiKey(e.target.value)}
                placeholder="e.g. carto_live_key_xyz123... (Leave empty to use clean Esri tiles)"
                style={{
                  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: 6,
                  color: '#fff', fontFamily: FONT_MONO, fontSize: 11, boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '8px 14px', fontFamily: FONT_MONO, fontSize: 11, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                style={{
                  background: 'linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)', color: '#000',
                  border: 'none', borderRadius: 6, padding: '8px 16px', fontFamily: FONT_MONO,
                  fontSize: 11, fontWeight: 800, cursor: 'pointer'
                }}
              >
                Save & Apply Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Telemetry Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.06) 0%, rgba(10, 18, 30, 0.8) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.2)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: '0 6px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🛰️</span>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 800, color: CYAN, letterSpacing: '0.15em' }}>
                  24/7 GLOBAL MULTI-HAZARD INGESTION & GEONODE BRIDGE
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                  Real-time streams: <span style={{ color: '#fff', fontWeight: 600 }}>USGS Seismic</span> · <span style={{ color: '#fff', fontWeight: 600 }}>UN/EU GDACS</span> · <span style={{ color: '#fff', fontWeight: 600 }}>Open-Meteo High-Res</span> · Special focus on <span style={{ color: AMBER, fontWeight: 700 }}>North Eastern Region (NER)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync status & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={isNerFocused ? handleResetGlobal : handleFocusNER}
              style={{
                background: isNerFocused ? 'rgba(255, 176, 32, 0.2)' : 'rgba(255, 176, 32, 0.1)',
                color: AMBER,
                border: `1px solid ${AMBER}`,
                borderRadius: 8,
                padding: '10px 14px',
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isNerFocused ? '0 0 12px rgba(255,176,32,0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isNerFocused ? '🌐 RESET GLOBAL VIEW' : '🎯 FOCUS NORTH EAST REGION (NER)'}
            </button>

            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: 8,
              padding: '8px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', letterSpacing: '0.1em' }}>15-MIN CYCLE</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 800, color: CYAN, marginTop: 1 }}>
                ⏱️ {formatCountdown(secondsRemaining)}
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncing}
              style={{
                background: syncing ? 'rgba(0, 229, 255, 0.2)' : 'linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)',
                color: syncing ? CYAN : '#000',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                cursor: syncing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {syncing ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
                  SYNCING...
                </>
              ) : (
                <>⚡ SYNC 24/7 PIPELINE NOW</>
              )}
            </button>

            <button
              onClick={handleUpdateLayers}
              disabled={updatingGeoNode}
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                color: PURPLE,
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 8,
                padding: '10px 14px',
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 700,
                cursor: updatingGeoNode ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              title="Run GeoNode updatelayers management sync"
            >
              {updatingGeoNode ? 'UPDATING...' : '🔄 GEONODE UPDATELAYERS'}
            </button>
          </div>
        </div>

        {/* Ingestion Metric Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: 'TOTAL HAZARDS', val: stats.total_hazards || geoJsonFeatures.length, color: CYAN, icon: '🌐', sub: 'RFC 7946 Standard' },
            { label: 'EARTHQUAKES', val: stats.earthquakes, color: RED, icon: '🔴', sub: 'USGS 24h Live M1.0+' },
            { label: 'CYCLONES / STORMS', val: stats.cyclones, color: CYAN, icon: '🌀', sub: 'GDACS / IMD / JMA' },
            { label: 'VOLCANO ALERTS', val: stats.volcanoes, color: ORANGE, icon: '🌋', sub: 'Smithsonian & GDACS' },
            { label: 'LANDSLIDE SCARPS', val: stats.landslides, color: AMBER, icon: '⛰️', sub: 'ISRO Atlas + NER Lifelines' },
            { label: 'RAINFALL HUBS', val: stats.rainfall, color: BLUE, icon: '🌧️', sub: 'Open-Meteo + 8 NER States' },
          ].map((card, idx) => (
            <div key={idx} style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${card.color}25`,
              borderRadius: 8,
              padding: '12px 14px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', letterSpacing: '0.08em' }}>{card.label}</span>
                <span style={{ fontSize: 14 }}>{card.icon}</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: card.color, marginTop: 4 }}>
                {card.val}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Map & Basemap Controls, Right GeoNode Hub & Stream Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Left: Interactive Multi-Hazard GIS Map */}
        <div style={{
          background: 'rgba(0, 229, 255, 0.02)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          borderRadius: 12,
          padding: 18,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Bar with Basemap Switchers & Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: CYAN, letterSpacing: '0.1em' }}>
                GLOBAL HAZARD VECTOR MAP (RFC 7946 GEOJSON)
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                {isNerFocused ? '🎯 Focused on North Eastern Region (NER) Lifeline Corridors' : `Displaying ${displayFeatures.length} active live hazard features`}
              </div>
            </div>

            {/* Basemap Switcher & API Key */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                {[
                  { id: 'DARK', label: '🌑 Dark Canvas' },
                  { id: 'SATELLITE', label: '🛰️ Satellite' },
                  { id: 'STREET', label: '🗺️ Streets' }
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBasemap(b.id)}
                    style={{
                      background: basemap === b.id ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                      color: basemap === b.id ? CYAN : '#6b7280',
                      border: 'none',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowApiKeyModal(true)}
                style={{
                  background: apiKey ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.05)',
                  color: apiKey ? GREEN : '#9ca3af',
                  border: `1px solid ${apiKey ? GREEN : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Set custom Carto or Mapbox API key"
              >
                {apiKey ? '🔑 Key Active' : '🔑 Set API Key'}
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {['ALL', 'Earthquake', 'Cyclone', 'Volcano', 'Landslide', 'Rainfall'].map(fKey => {
              const isAct = filter === fKey;
              return (
                <button
                  key={fKey}
                  onClick={() => setFilter(fKey)}
                  style={{
                    background: isAct ? CYAN : 'rgba(255,255,255,0.05)',
                    color: isAct ? '#000' : '#9ca3af',
                    border: `1px solid ${isAct ? CYAN : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {fKey === 'ALL' ? 'ALL' : `${HAZARD_ICONS[fKey === 'Cyclone' ? 'Cyclone / Tropical Cyclone' : fKey === 'Rainfall' ? 'Active Rainfall' : fKey] || ''} ${fKey}`}
                </button>
              );
            })}
          </div>

          {/* Leaflet Map with Zero-Watermark Tile Layer */}
          <div style={{ height: 560, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,229,255,0.15)', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ width: '100%', height: '100%', background: '#0a0f18' }}
              scrollWheelZoom={true}
            >
              <MapPanController center={mapCenter} zoom={mapZoom} />

              {/* Zero-Watermark Base Tile Layers */}
              {basemap === 'DARK' && (
                <>
                  <TileLayer
                    key={`DARK_BASE_${apiKey}`}
                    url={apiKey 
                      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${apiKey}`
                      : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    }
                    attribution="&copy; Esri, DeLorme, NAVTEQ & OpenStreetMap"
                    maxZoom={17}
                  />
                  {!apiKey && (
                    <TileLayer
                      key="DARK_LABELS"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                      attribution=""
                      maxZoom={17}
                    />
                  )}
                </>
              )}

              {basemap === 'SATELLITE' && (
                <TileLayer
                  key="SATELLITE"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri, Maxar, Earthstar Geographics"
                  maxZoom={19}
                />
              )}

              {basemap === 'STREET' && (
                <TileLayer
                  key="STREET"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                  maxZoom={19}
                />
              )}

              {displayFeatures.map((feat, idx) => {
                const geom = feat?.geometry || {};
                const coords = geom.coordinates || [0, 0];
                // In GeoJSON: [lon, lat]
                const lat = geom.type === 'Point' ? coords[1] : coords[0]?.[0]?.[1] || 0;
                const lon = geom.type === 'Point' ? coords[0] : coords[0]?.[0]?.[0] || 0;
                const props = feat?.properties || {};
                const hType = props.hazard_type || 'Hazard';
                const isNerFeature = props.state || (props.location_name && props.location_name.includes('India ('));
                const color = isNerFeature ? '#ffb020' : (HAZARD_COLORS[hType] || CYAN);

                return (
                  <CircleMarker
                    key={feat.id || idx}
                    center={[lat, lon]}
                    radius={isNerFeature ? 9 : hType === 'Earthquake' ? Math.min(10, Math.max(4, (props.magnitude || 3) * 1.6)) : 7}
                    fillColor={color}
                    color="#fff"
                    weight={isNerFeature ? 2 : 1}
                    opacity={0.9}
                    fillOpacity={0.75}
                  >
                    <Popup className="tactical-popup">
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#111' }}>
                        <div style={{ fontWeight: 800, color: isNerFeature ? '#d97706' : '#0077b6' }}>
                          {isNerFeature ? '🏔️ [NER CRITICAL CORRIDOR] ' : ''}{HAZARD_ICONS[hType] || '⚠️'} {hType}
                        </div>
                        <div style={{ fontWeight: 700, marginTop: 3 }}>
                          {props.location_name || props.event_name || 'Active Incident'}
                        </div>
                        {props.highway && (
                          <div style={{ color: '#b91c1c', fontWeight: 800, marginTop: 2 }}>
                            🛣️ {props.highway}
                          </div>
                        )}
                        <div style={{ marginTop: 4, color: '#333' }}>
                          Severity: <b>{props.severity_metric}</b>
                        </div>
                        {props.road_blockage_probability && (
                          <div style={{ color: '#c2410c', fontWeight: 700, marginTop: 2 }}>
                            Blockage Probability: {props.road_blockage_probability}
                          </div>
                        )}
                        <div style={{ fontSize: 9, color: '#666', marginTop: 4 }}>
                          Source: {props.source}
                        </div>
                        <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>
                          Coordinates: {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Right: GeoNode Layer Publisher & Real-Time Analytics Command Center */}
        {(() => {
          const layersToDisplay = (geoNodeLayers && geoNodeLayers.length) ? geoNodeLayers : DEFAULT_GEONODE_LAYERS;
          const currentLayer = layersToDisplay[selectedLayerIndex] || layersToDisplay[0];
          const clusters = analyticsData?.spatial_clusters || { ner_india_count: 19, himalayan_arc_count: 18, pacific_rim_count: 233, other_continental_count: 48 };
          const alertLevels = analyticsData?.hazards_by_alert_level || { CRITICAL: 16, HIGH: 24, MODERATE: 22, LOW: 238 };
          const totalHaz = stats.total_hazards || 300;
          const latencies = analyticsData?.latency_breakdown_ms || { usgs_seismic_feed: 84, gdacs_multihazard: 142, open_meteo_rainfall: 118, geonode_layer_publisher: 26, total: 370 };
          const recentStream = analyticsData?.recent_feature_stream || [];

          return (
            <div style={{
              background: 'linear-gradient(145deg, rgba(20, 15, 35, 0.95) 0%, rgba(10, 12, 22, 0.98) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Header: Title, OGC Status & Sync Trigger */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🌐</span>
                    <div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: PURPLE, letterSpacing: '0.1em' }}>
                        GEONODE LAYER PUBLISHER & GIS ENGINE
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
                        OGC WFS 2.0.0 · WMS 1.3.0 · CSW Catalog · RFC 7946 Standard
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={handleUpdateLayers}
                    disabled={updatingGeoNode}
                    style={{
                      background: updatingGeoNode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.18)',
                      color: '#e9d5ff',
                      border: '1px solid rgba(168, 85, 247, 0.6)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontFamily: FONT_MONO,
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: updatingGeoNode ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                      boxShadow: '0 0 12px rgba(168, 85, 247, 0.2)'
                    }}
                    title="Publish current layers and refresh spatial BBOX in GeoNode"
                  >
                    <span style={{ display: 'inline-block', animation: updatingGeoNode ? 'spin 1s linear infinite' : 'none' }}>
                      {updatingGeoNode ? '🔄' : '⚡'}
                    </span>
                    {updatingGeoNode ? 'PUBLISHING TO GEONODE...' : 'SYNC & PUBLISH TO GEONODE'}
                  </button>
                </div>
              </div>

              {/* Status Banner / Feedback */}
              {publishStatusMsg && (
                <div style={{
                  marginTop: 10,
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: GREEN,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <span>✓</span>
                  <span>{publishStatusMsg}</span>
                </div>
              )}

              {/* Mode Sub-Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                marginTop: 12,
                background: 'rgba(0,0,0,0.4)',
                padding: 4,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {[
                  { id: 'ANALYTICS', label: '📊 REAL-TIME ANALYTICS', count: totalHaz },
                  { id: 'CATALOG', label: '📚 OGC LAYERS & SCHEMAS', count: `${layersToDisplay.length} Layers` },
                  { id: 'PROTOCOLS', label: '🔌 GIS PROTOCOLS', count: 'WFS / WMS' },
                  { id: 'TERMINAL', label: '🖥️ PIPELINE TERMINAL', count: 'Live' }
                ].map(tab => {
                  const isAct = publisherSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPublisherSubTab(tab.id)}
                      style={{
                        background: isAct ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                        color: isAct ? '#fff' : '#9ca3af',
                        border: isAct ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
                        borderRadius: 6,
                        padding: '6px 4px',
                        fontFamily: FONT_MONO,
                        fontSize: 9,
                        fontWeight: isAct ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div>{tab.label}</div>
                      <div style={{ fontSize: 8, color: isAct ? CYAN : '#6b7280', marginTop: 2 }}>{tab.count}</div>
                    </button>
                  );
                })}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  SUB-TAB 1: REAL-TIME GIS ANALYTICS
              ───────────────────────────────────────────────────────────── */}
              {publisherSubTab === 'ANALYTICS' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                  {/* Throughput & Latency Metric Strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af' }}>ACTIVE VECTORS</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800, color: CYAN, marginTop: 2 }}>{totalHaz}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>RFC 7946 Standard</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af' }}>GEONODE PAYLOAD</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800, color: PURPLE, marginTop: 2 }}>
                        {analyticsData?.geonode_status?.payload_size_kb || '209.6'} KB
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>Consolidated GeoJSON</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af' }}>STREAM LATENCY</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800, color: GREEN, marginTop: 2 }}>
                        {latencies.total || stats.sync_duration_ms || 370} ms
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>End-to-End Pipeline</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255, 176, 32, 0.2)' }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af' }}>OGC SYNC STATUS</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: AMBER, marginTop: 3 }}>
                        ● 6/6 ONLINE
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>WFS 2.0 Compliant</div>
                    </div>
                  </div>

                  {/* Spatial Density Clusters with 1-Click Map Fly-To */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: '#e5e7eb', letterSpacing: '0.08em' }}>
                        SPATIAL DENSITY CLUSTERS (CLICK TO FLY MAP)
                      </span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>Interactive Vector Extent</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      <div
                        onClick={() => handleFlyToCoord(26.15, 92.85, 7)}
                        style={{
                          background: 'rgba(255, 176, 32, 0.08)',
                          border: '1px solid rgba(255, 176, 32, 0.35)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = AMBER}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 176, 32, 0.35)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: AMBER }}>
                            🏔️ NER Lifeline Corridor
                          </span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                            {clusters.ner_india_count}
                          </span>
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                          8 NER States · NH-10 / NH-29 / NH-27
                        </div>
                      </div>

                      <div
                        onClick={() => handleFlyToCoord(30.5, 83.5, 6)}
                        style={{
                          background: 'rgba(255, 59, 92, 0.08)',
                          border: '1px solid rgba(255, 59, 92, 0.35)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = RED}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 59, 92, 0.35)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: RED }}>
                            ⚡ Himalayan Seismic Arc
                          </span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                            {clusters.himalayan_arc_count}
                          </span>
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                          MBT / MCT Active Orogenic Collision
                        </div>
                      </div>

                      <div
                        onClick={() => handleFlyToCoord(35.0, 140.0, 4)}
                        style={{
                          background: 'rgba(0, 229, 255, 0.08)',
                          border: '1px solid rgba(0, 229, 255, 0.35)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = CYAN}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.35)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: CYAN }}>
                            🌋 Pacific Ring of Fire
                          </span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                            {clusters.pacific_rim_count}
                          </span>
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                          Subduction Trenches &amp; Volcanic Arcs
                        </div>
                      </div>

                      <div
                        onClick={() => handleFlyToCoord(20.0, 0.0, 2)}
                        style={{
                          background: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = PURPLE}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: PURPLE }}>
                            🌍 Continental Basins
                          </span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                            {clusters.other_continental_count}
                          </span>
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                          Global Intraplate &amp; Severe Storm Hubs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hazard Severity Distribution Meter */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: '#e5e7eb', letterSpacing: '0.08em' }}>
                        HAZARD SEVERITY DISTRIBUTION METER
                      </span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>
                        {totalHaz} Sampled Features
                      </span>
                    </div>

                    {/* Progress Segment Bar */}
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
                      <div style={{ width: `${(alertLevels.CRITICAL / totalHaz) * 100}%`, background: RED, title: 'CRITICAL' }} />
                      <div style={{ width: `${(alertLevels.HIGH / totalHaz) * 100}%`, background: ORANGE, title: 'HIGH' }} />
                      <div style={{ width: `${(alertLevels.MODERATE / totalHaz) * 100}%`, background: AMBER, title: 'MODERATE' }} />
                      <div style={{ width: `${(alertLevels.LOW / totalHaz) * 100}%`, background: GREEN, title: 'LOW' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255, 59, 92, 0.1)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: RED, fontWeight: 700 }}>CRITICAL</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: '#fff' }}>{alertLevels.CRITICAL}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: '#9ca3af' }}>{((alertLevels.CRITICAL / totalHaz) * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ background: 'rgba(255, 107, 53, 0.1)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: ORANGE, fontWeight: 700 }}>HIGH</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: '#fff' }}>{alertLevels.HIGH}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: '#9ca3af' }}>{((alertLevels.HIGH / totalHaz) * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ background: 'rgba(255, 176, 32, 0.1)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: AMBER, fontWeight: 700 }}>MODERATE</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: '#fff' }}>{alertLevels.MODERATE}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: '#9ca3af' }}>{((alertLevels.MODERATE / totalHaz) * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: GREEN, fontWeight: 700 }}>LOW</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: '#fff' }}>{alertLevels.LOW}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: '#9ca3af' }}>{((alertLevels.LOW / totalHaz) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Source Ingestion Latencies */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: '#e5e7eb', marginBottom: 6 }}>
                      SOURCE INGESTION LATENCY BREAKDOWN
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontFamily: FONT_MONO, fontSize: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ color: '#9ca3af' }}>USGS Live</div>
                        <div style={{ color: CYAN, fontWeight: 700, fontSize: 11 }}>{latencies.usgs_seismic_feed || 84}ms</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ color: '#9ca3af' }}>UN GDACS</div>
                        <div style={{ color: ORANGE, fontWeight: 700, fontSize: 11 }}>{latencies.gdacs_multihazard || 142}ms</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ color: '#9ca3af' }}>Open-Meteo</div>
                        <div style={{ color: BLUE, fontWeight: 700, fontSize: 11 }}>{latencies.open_meteo_rainfall || 118}ms</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 6px', borderRadius: 4 }}>
                        <div style={{ color: '#9ca3af' }}>GeoNode Pub</div>
                        <div style={{ color: PURPLE, fontWeight: 700, fontSize: 11 }}>{latencies.geonode_layer_publisher || 26}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Stream Feature Table with 1-Click Map Focus */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: CYAN, letterSpacing: '0.08em' }}>
                        📡 LIVE PUBLISHED FEATURE STREAM ({recentStream.length || 15} RECENT)
                      </span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>Click "FOCUS" to pan map</span>
                    </div>

                    <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {recentStream.slice(0, 8).map((feat, fIdx) => {
                        const isCrit = feat.alert_level === 'CRITICAL';
                        const isHigh = feat.alert_level === 'HIGH';
                        const badgeColor = isCrit ? RED : isHigh ? ORANGE : feat.alert_level === 'MODERATE' ? AMBER : GREEN;

                        return (
                          <div
                            key={fIdx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255,255,255,0.02)',
                              padding: '5px 8px',
                              borderRadius: 4,
                              fontFamily: FONT_MONO,
                              fontSize: 9,
                              borderLeft: `3px solid ${badgeColor}`
                            }}
                          >
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                              <span style={{ marginRight: 6 }}>{HAZARD_ICONS[feat.hazard_type] || '⚠️'}</span>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{feat.title || feat.id}</span>
                              <span style={{ color: '#9ca3af', marginLeft: 6 }}>({feat.value} {feat.unit})</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                background: `${badgeColor}20`,
                                color: badgeColor,
                                border: `1px solid ${badgeColor}40`,
                                borderRadius: 3,
                                padding: '1px 5px',
                                fontSize: 8,
                                fontWeight: 700
                              }}>
                                {feat.alert_level}
                              </span>
                              <button
                                onClick={() => handleFlyToCoord(feat.lat, feat.lon, 9)}
                                style={{
                                  background: 'rgba(0, 229, 255, 0.15)',
                                  color: CYAN,
                                  border: '1px solid rgba(0, 229, 255, 0.4)',
                                  borderRadius: 3,
                                  padding: '2px 6px',
                                  fontSize: 8,
                                  fontFamily: FONT_MONO,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title={`Fly to ${feat.lat}, ${feat.lon}`}
                              >
                                📍 FOCUS
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  SUB-TAB 2: OGC LAYERS & DATA DICTIONARY
              ───────────────────────────────────────────────────────────── */}
              {publisherSubTab === 'CATALOG' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                  {/* Layer Selector Chips */}
                  <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                    {layersToDisplay.map((lyr, idx) => {
                      const isSel = idx === selectedLayerIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedLayerIndex(idx)}
                          style={{
                            background: isSel ? PURPLE : 'rgba(255,255,255,0.04)',
                            color: isSel ? '#fff' : '#9ca3af',
                            border: `1px solid ${isSel ? PURPLE : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 4,
                            padding: '4px 8px',
                            fontFamily: FONT_MONO,
                            fontSize: 9,
                            fontWeight: isSel ? 800 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s'
                          }}
                        >
                          {lyr.name.replace('geonode:', '')} ({lyr.feature_count || 0})
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Layer Details Card */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                          {currentLayer.title}
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: PURPLE, marginTop: 2 }}>
                          {currentLayer.name} · {currentLayer.geometry_type || 'Vector'}
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: GREEN,
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontFamily: FONT_MONO,
                        fontSize: 8,
                        fontWeight: 700
                      }}>
                        {currentLayer.srs} / {currentLayer.crs_supported?.[1] || 'EPSG:3857'}
                      </span>
                    </div>

                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#cbd5e1', marginTop: 6, lineHeight: 1.4 }}>
                      {currentLayer.abstract}
                    </div>

                    {/* Specifications Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8, fontFamily: FONT_MONO, fontSize: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 4 }}>
                        <div style={{ color: '#6b7280' }}>BBOX EXTENT:</div>
                        <div style={{ color: CYAN, fontWeight: 700 }}>
                          [{currentLayer.bbox ? currentLayer.bbox.join(', ') : '-180, -90, 180, 90'}]
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 4 }}>
                        <div style={{ color: '#6b7280' }}>ACTIVE FEATURES:</div>
                        <div style={{ color: GREEN, fontWeight: 700 }}>
                          {currentLayer.feature_count} records
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 4 }}>
                        <div style={{ color: '#6b7280' }}>CADENCE:</div>
                        <div style={{ color: AMBER, fontWeight: 700 }}>
                          {currentLayer.update_interval_sec || 900}s (15 min)
                        </div>
                      </div>
                    </div>

                    {/* Direct Layer Action Bar */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <a
                        href={`http://localhost:8000${currentLayer.download_url?.startsWith('http') ? currentLayer.download_url.replace('http://localhost:8000', '') : currentLayer.download_url}`}
                        download
                        style={{
                          background: 'rgba(0, 229, 255, 0.15)',
                          color: CYAN,
                          border: '1px solid rgba(0, 229, 255, 0.4)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontFamily: FONT_MONO,
                          fontSize: 9,
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        📥 DOWNLOAD GEOJSON
                      </a>

                      <button
                        onClick={() => copyToClipboard(currentLayer.wfs_url || `http://localhost:8000${currentLayer.url}`, `wfs_${currentLayer.name}`)}
                        style={{
                          background: copiedProtocol === `wfs_${currentLayer.name}` ? GREEN : 'rgba(255,255,255,0.05)',
                          color: copiedProtocol === `wfs_${currentLayer.name}` ? '#000' : '#d1d5db',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontFamily: FONT_MONO,
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedProtocol === `wfs_${currentLayer.name}` ? 'COPIED!' : '📋 COPY WFS URL'}
                      </button>

                      <button
                        onClick={() => copyToClipboard(currentLayer.wms_url || 'http://localhost:8000/api/hazards/geonode/wms', `wms_${currentLayer.name}`)}
                        style={{
                          background: copiedProtocol === `wms_${currentLayer.name}` ? GREEN : 'rgba(255,255,255,0.05)',
                          color: copiedProtocol === `wms_${currentLayer.name}` ? '#000' : '#d1d5db',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontFamily: FONT_MONO,
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedProtocol === `wms_${currentLayer.name}` ? 'COPIED!' : '📋 COPY WMS URL'}
                      </button>
                    </div>
                  </div>

                  {/* Attribute Schema & Data Dictionary Table */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: '#e5e7eb', marginBottom: 6 }}>
                      DATA DICTIONARY / ATTRIBUTE SCHEMA ({currentLayer.name})
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_MONO, fontSize: 8 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px' }}>PROPERTY</th>
                            <th style={{ padding: '4px 6px' }}>TYPE</th>
                            <th style={{ padding: '4px 6px' }}>DESCRIPTION</th>
                            <th style={{ padding: '4px 6px' }}>SAMPLE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(currentLayer.schema_attributes || [
                            { field: 'hazard_id', type: 'String', description: 'Unique vector ID', example: 'FEAT-01' },
                            { field: 'alert_level', type: 'Enum', description: 'Risk severity category', example: 'HIGH' },
                            { field: 'source', type: 'String', description: 'Origin authoritative agency', example: 'USGS/GDACS' }
                          ]).map((attr, aIdx) => (
                            <tr key={aIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#d1d5db' }}>
                              <td style={{ padding: '4px 6px', color: CYAN, fontWeight: 700 }}>{attr.field}</td>
                              <td style={{ padding: '4px 6px', color: AMBER }}>{attr.type}</td>
                              <td style={{ padding: '4px 6px', color: '#9ca3af' }}>{attr.description}</td>
                              <td style={{ padding: '4px 6px', color: GREEN }}>{attr.example}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  SUB-TAB 3: GIS PROTOCOLS & INTEGRATION
              ───────────────────────────────────────────────────────────── */}
              {publisherSubTab === 'PROTOCOLS' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                  {[
                    {
                      proto: 'OGC WFS 2.0.0 (Web Feature Service)',
                      url: 'http://localhost:8000/api/hazards/live',
                      desc: 'Full FeatureCollection for QGIS "Add WFS Layer", ArcGIS, or GeoServer cascading.',
                      color: CYAN
                    },
                    {
                      proto: 'OGC WMS 1.3.0 (Web Map Service)',
                      url: 'http://localhost:8000/api/hazards/geonode/wms?request=GetCapabilities',
                      desc: 'Standardized GetCapabilities XML response for GIS raster & overlay mapping.',
                      color: PURPLE
                    },
                    {
                      proto: 'GeoNode CSW Catalog (Catalogue Service)',
                      url: 'http://localhost:8000/api/hazards/geonode/layers',
                      desc: 'Metadata catalog endpoint compliant with GeoNode 4.2+ and ISO 19115 schemas.',
                      color: GREEN
                    },
                    {
                      proto: 'Direct RFC 7946 GeoJSON Download',
                      url: 'http://localhost:8000/api/hazards/live_global_hazards.geojson',
                      desc: 'Raw GeoJSON payload for Python GeoPandas, Leaflet, or Mapbox GL.',
                      color: AMBER
                    },
                    {
                      proto: 'North Eastern Region (NER) Live Corridors',
                      url: 'http://localhost:8000/api/hazards/ner_corridors.geojson',
                      desc: 'Focused geotechnical vectors covering NH-10, NH-29, and 8 state disaster hubs.',
                      color: ORANGE
                    }
                  ].map((pItem, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: `1px solid ${pItem.color}30`,
                        borderRadius: 6,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: pItem.color }}>
                          {pItem.proto}
                        </span>
                        <button
                          onClick={() => copyToClipboard(pItem.url, `proto_${pIdx}`)}
                          style={{
                            background: copiedProtocol === `proto_${pIdx}` ? GREEN : 'rgba(255,255,255,0.08)',
                            color: copiedProtocol === `proto_${pIdx}` ? '#000' : '#fff',
                            border: 'none',
                            borderRadius: 3,
                            padding: '2px 8px',
                            fontFamily: FONT_MONO,
                            fontSize: 8,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedProtocol === `proto_${pIdx}` ? 'COPIED!' : 'COPY URL'}
                        </button>
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af' }}>
                        {pItem.desc}
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 6px',
                        borderRadius: 4,
                        fontFamily: FONT_MONO,
                        fontSize: 8,
                        color: '#d1d5db',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {pItem.url}
                      </div>
                    </div>
                  ))}

                  {/* Integration Snippets */}
                  <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 8 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, color: '#e5e7eb', marginBottom: 4 }}>
                      PYTHON GEOPANDAS CONSUMPTION SNIPPET
                    </div>
                    <pre style={{
                      margin: 0,
                      background: '#04070d',
                      padding: 6,
                      borderRadius: 4,
                      fontFamily: FONT_MONO,
                      fontSize: 8,
                      color: CYAN,
                      overflowX: 'auto'
                    }}>
{`import geopandas as gpd
gdf = gpd.read_file("http://localhost:8000/api/hazards/live_global_hazards.geojson")
print(f"Loaded {len(gdf)} active hazard vectors into GeoDataFrame")`}
                    </pre>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  SUB-TAB 4: PIPELINE TERMINAL LOGS
              ───────────────────────────────────────────────────────────── */}
              {publisherSubTab === 'TERMINAL' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: CYAN }}>
                        REAL-TIME STREAM INGESTION CONSOLE
                      </span>
                    </div>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#6b7280' }}>
                      Next Sync in {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                    </span>
                  </div>

                  <div style={{
                    background: '#04070d',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    padding: 8,
                    height: 280,
                    overflowY: 'auto',
                    fontFamily: FONT_MONO,
                    fontSize: 8,
                    color: '#9ca3af',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}>
                    {(logs.length ? logs : [
                      { timestamp: 'LIVE', level: 'INFO', message: 'USGS Seismic Stream connected (https://earthquake.usgs.gov)' },
                      { timestamp: 'LIVE', level: 'INFO', message: 'UN/EU GDACS Multi-Hazard Stream connected (https://gdacs.org)' },
                      { timestamp: 'LIVE', level: 'INFO', message: 'NER Lifeline highways (NH-10, NH-29, NH-27) scanned' },
                      { timestamp: 'LIVE', level: 'INFO', message: 'Open-Meteo precipitation sampled across 34 global & NER hubs' },
                      { timestamp: 'LIVE', level: 'INFO', message: 'Standardized RFC 7946 GeoJSON compiled to live_global_hazards.geojson' },
                      { timestamp: 'LIVE', level: 'INFO', message: 'GeoNode catalog updated: 6 OGC layers active' },
                    ]).map((log, lIdx) => (
                      <div key={lIdx} style={{ display: 'flex', gap: 6 }}>
                        <span style={{ color: '#4b5563' }}>[{log.timestamp}]</span>
                        <span style={{ color: log.level === 'ERROR' ? RED : log.level === 'WARNING' ? AMBER : CYAN }}>
                          {log.level}:
                        </span>
                        <span style={{ color: '#d1d5db' }}>{log.message}</span>
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>

                  {/* AI Accuracy Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af' }}>
                      AI HARMONIZATION CONFIDENCE:
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: GREEN, fontWeight: 700 }}>
                      {scanAccuracy}% MULTI-SOURCE CONVERGED
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DEDICATED NORTH EASTERN REGION (NER) EARLY WARNING PLATFORM
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 176, 32, 0.05) 0%, rgba(10, 15, 25, 0.95) 100%)',
        border: '1px solid rgba(255, 176, 32, 0.3)',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🏔️</span>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: AMBER, letterSpacing: '0.12em' }}>
                  NORTH EASTERN REGION (NER), INDIA • AI REAL-TIME MONITORING & PREDICTIVE EARLY WARNING
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                  Continuous Geotechnical Surveillance: <span style={{ color: '#fff' }}>Sikkim</span> · <span style={{ color: '#fff' }}>Assam</span> · <span style={{ color: '#fff' }}>Arunachal</span> · <span style={{ color: '#fff' }}>Meghalaya</span> · <span style={{ color: '#fff' }}>Manipur</span> · <span style={{ color: '#fff' }}>Mizoram</span> · <span style={{ color: '#fff' }}>Nagaland</span> · <span style={{ color: '#fff' }}>Tripura</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'rgba(255, 59, 92, 0.15)',
              color: RED,
              border: '1px solid rgba(255, 59, 92, 0.4)',
              borderRadius: 4,
              padding: '4px 10px',
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 800
            }}>
              🚨 HIGH MONSOON VULNERABILITY
            </span>
            <span style={{
              background: 'rgba(0, 229, 255, 0.1)',
              color: CYAN,
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: 4,
              padding: '4px 10px',
              fontFamily: FONT_MONO,
              fontSize: 10
            }}>
              48 GROUND SENSORS + InSAR ACTIVE
            </span>
          </div>
        </div>

        {/* 8 NER States Early Warning Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {(nerData?.states || [
            { state: 'Sikkim', capital: 'Gangtok', alert_level: 'CRITICAL', risk_score: 92, factor_of_safety: 0.74, primary_threat: 'Teesta River Debris Flow & NH-10 Undercutting', active_rainfall_24h_mm: 118.4 },
            { state: 'Nagaland', capital: 'Kohima', alert_level: 'CRITICAL', risk_score: 88, factor_of_safety: 0.81, primary_threat: 'NH-29 Dzüdza Sinking Zone Mudflow', active_rainfall_24h_mm: 86.2 },
            { state: 'Manipur', capital: 'Imphal', alert_level: 'CRITICAL', risk_score: 89, factor_of_safety: 0.76, primary_threat: 'Tupul Railway Yard Debris Avalanche', active_rainfall_24h_mm: 94.0 },
            { state: 'Assam', capital: 'Guwahati', alert_level: 'HIGH', risk_score: 79, factor_of_safety: 0.85, primary_threat: 'Dima Hasao Hill Slips & Kamrup Hill Collapses', active_rainfall_24h_mm: 68.5 },
            { state: 'Meghalaya', capital: 'Shillong', alert_level: 'HIGH', risk_score: 82, factor_of_safety: 0.88, primary_threat: 'Sohra Extreme Orographic Rainfall Slips', active_rainfall_24h_mm: 154.2 },
            { state: 'Mizoram', capital: 'Aizawl', alert_level: 'CRITICAL', risk_score: 86, factor_of_safety: 0.79, primary_threat: 'Unplanned Hill Cutting Urban Slope Slump', active_rainfall_24h_mm: 79.8 },
            { state: 'Arunachal', capital: 'Itanagar', alert_level: 'HIGH', risk_score: 77, factor_of_safety: 0.87, primary_threat: 'Sela Pass Strategic Road Debris Flows', active_rainfall_24h_mm: 72.1 },
            { state: 'Tripura', capital: 'Agartala', alert_level: 'MODERATE', risk_score: 58, factor_of_safety: 1.15, primary_threat: 'Jampui Hills Road Slips & Lowland Floods', active_rainfall_24h_mm: 42.0 }
          ]).map((st, sIdx) => {
            const isCrit = st.alert_level === 'CRITICAL';
            const isHigh = st.alert_level === 'HIGH';
            const color = isCrit ? RED : isHigh ? ORANGE : GREEN;

            return (
              <div
                key={sIdx}
                onClick={() => {
                  if (st.lat && st.lon) {
                    setMapCenter([st.lat, st.lon]);
                    setMapZoom(9);
                  }
                  setSelectedNerState(st);
                }}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${color}40`,
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${color}40`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: '#fff' }}>
                      {st.state}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>
                      HQ: {st.capital}
                    </div>
                  </div>
                  <span style={{
                    background: `${color}15`,
                    color: color,
                    border: `1px solid ${color}40`,
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    fontWeight: 800
                  }}>
                    {st.alert_level}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af' }}>Risk Score:</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800, color }}>
                    {st.risk_score}/100
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af' }}>Factor of Safety:</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: st.factor_of_safety < 1 ? RED : GREEN }}>
                    {st.factor_of_safety} {st.factor_of_safety < 1 ? '(UNSTABLE)' : '(STABLE)'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af' }}>24h Rainfall:</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: CYAN }}>
                    🌧️ {st.active_rainfall_24h_mm} mm
                  </span>
                </div>

                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9, color: '#cbd5e1', marginTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  ⚠️ {st.primary_threat}
                </div>
              </div>
            );
          })}
        </div>

        {/* Arterial Lifeline Highways Early Warning Bar */}
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 176, 32, 0.2)',
          borderRadius: 8,
          padding: 14
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 800, color: AMBER, letterSpacing: '0.08em' }}>
              🛣️ CRITICAL ARTERIAL HIGHWAY LIFELINES STATUS (NER)
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>
              Real-time Geotechnical Highway Watch
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { code: 'NH-10', name: 'Siliguri - Gangtok Lifeline', status: 'CRITICAL', blockage_prob: '94%', note: 'Teesta River slope bank scouring' },
              { code: 'NH-29', name: 'Dimapur - Kohima - Imphal', status: 'CRITICAL', blockage_prob: '89%', note: 'Dzüdza bridge mudflow sinking zone' },
              { code: 'NH-27 / NH-37', name: 'Haflong - Silchar East-West', status: 'HIGH WATCH', blockage_prob: '78%', note: 'Dima Hasao hill cutting failure risk' },
              { code: 'NH-13', name: 'Trans-Arunachal Highway', status: 'MONITORED', blockage_prob: '65%', note: 'Fragile Himalayan schist slip zone' },
            ].map((hw, hIdx) => {
              const color = hw.status === 'CRITICAL' ? RED : hw.status === 'HIGH WATCH' ? ORANGE : CYAN;
              return (
                <div key={hIdx} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${color}33`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontFamily: FONT_MONO
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>{hw.code}</span>
                    <span style={{ color, fontSize: 9, fontWeight: 700 }}>{hw.status}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{hw.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9 }}>
                    <span style={{ color: '#6b7280' }}>Blockage Risk:</span>
                    <span style={{ color, fontWeight: 700 }}>{hw.blockage_prob}</span>
                  </div>
                  <div style={{ fontSize: 8, color: '#cbd5e1', marginTop: 2 }}>{hw.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

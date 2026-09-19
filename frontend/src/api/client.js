import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({ 
  baseURL: BASE_URL,
  timeout: 15000 
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const getMe = () => api.get('/auth/me');

// Incidents
export const getIncidents = (params) => api.get('/incidents', { params });
export const createIncident = (data) => api.post('/incidents', data);
export const getIncident = (id) => api.get(`/incidents/${id}`);
export const updateIncident = (id, data) => api.patch(`/incidents/${id}`, data);
export const getTimeline = (id) => api.get(`/incidents/${id}/timeline`);

// Alerts
export const getAlerts = (params) => api.get('/alerts', { params });
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge`);
export const resolveAlert = (id) => api.post(`/alerts/${id}/resolve`);

// Sensors
export const getSensors = () => api.get('/sensors');
export const getSensorReadings = (id, hours = 24) => api.get(`/sensors/${id}/readings`, { params: { hours } });

// Analytics
export const getSummary = () => api.get('/analytics/summary');
export const getRiskScores = () => api.get('/analytics/risk-scores');
export const getForecasts = () => api.get('/analytics/forecasts');
export const getImpact = () => api.get('/analytics/impact');
export const getDatasetStats = () => api.get('/analytics/dataset-stats');
export const getScanBatch = (batchSize = 50) => api.get('/analytics/scan-batch', { params: { batch_size: batchSize } });

// AI Models
export const getModels = () => api.get('/models');
export const runModel = (id) => api.post(`/models/${id}/run`);

// AI Copilot
export const sendChatMessage = (data) => api.post('/ai/chat', data);
export const getChatHistory = (sessionId) => api.get(`/ai/chat/${sessionId}/history`);
export const getAgentTrace = (sessionId) => api.get(`/ai/agent-trace/${sessionId}`);

// Users
export const getUsers = () => api.get('/users');
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);

// Audit
export const getAuditLogs = () => api.get('/audit');

// System
export const getSystemHealth = () => api.get('/system/health');
export const getHealth = () => api.get('/health');

// Datasets
export const getDatasets = () => api.get('/datasets');
export const uploadDataset = (formData) =>
  api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// WebSocket for live sensor feed
export const createSensorWS = () => {
  const ws = new WebSocket('ws://localhost:8000/api/sensors/ws/live');
  return ws;
};

// Landslide Intelligence
export const getLandslideDataset = () => api.get('/landslide/dataset');
export const runLandslideInference = (filename) => api.post(`/landslide/infer/${filename}`);
export const getDatasetPreview = (filename) => api.get(`/datasets/${filename}/preview`);
export const deleteDataset = (id) => api.delete(`/datasets/${id}`);

// Risk Intelligence & Geotechnical Engine
export const calculateRisk = (lat, lon, slopeAngle = 28.0) => api.get(`/risk/calculate`, { params: { lat, lon, slope_angle: slopeAngle } });
export const getGeotechnicalAnalysis = (params) => api.get(`/risk/geotechnical-analysis`, { params });
export const getModelDiagnostics = () => api.get(`/risk/model-diagnostics`);

// Location Intelligence
export const geocodeLocation = (q) => api.get('/location/geocode', { params: { q } });
export const reverseGeocode = (lat, lon) => api.get('/location/reverse', { params: { lat, lon } });
export const searchPlaces = (q, limit = 5) => api.get('/location/search', { params: { q, limit } });
export const getTimezone = (lat, lon) => api.get('/location/timezone', { params: { lat, lon } });
export const getAreaAnalysis = (lat, lon) => api.get('/location/area-analysis', { params: { lat, lon } });

// Live Weather
const weatherUrl = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=precipitation,rain,showers,precipitation_probability,wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,surface_pressure,soil_moisture_0_to_7cm,weather_code&hourly=precipitation,rain,precipitation_probability,wind_speed_10m,temperature_2m,soil_moisture_0_to_7cm&daily=precipitation_sum,rain_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min&forecast_days=7&past_hours=24&timezone=auto`;

const rainfallRisk = (weather) => {
  const current = Number(weather?.current?.precipitation ?? 0);
  const daily = Number(weather?.daily?.precipitation_sum?.[0] ?? 0);
  if (current > 50 || daily > 200) return { risk_level: 'CRITICAL', risk_score: 95, explanation: 'Live precipitation exceeds the critical threshold.' };
  if (current > 25 || daily > 100) return { risk_level: 'VERY HIGH', risk_score: 80, explanation: 'Live precipitation exceeds the very-high threshold.' };
  if (current > 10 || daily > 50) return { risk_level: 'HIGH', risk_score: 65, explanation: 'Live precipitation exceeds the high threshold.' };
  if (current > 2.5 || daily > 20) return { risk_level: 'MODERATE', risk_score: 45, explanation: 'Live precipitation exceeds the moderate threshold.' };
  return { risk_level: 'LOW', risk_score: 25, explanation: 'Live rainfall is within the baseline range.' };
};

export const getLiveRainfall = async (lat, lon) => {
  try {
    const response = await api.get('/weather/rainfall', { params: { lat, lon } });
    if (response.data?.weather_data?.status !== 'UNAVAILABLE') return response;
  } catch (_) {
    // Retry directly from the browser below when the local API is offline.
  }

  const response = await fetch(weatherUrl(lat, lon));
  if (!response.ok) throw new Error('Live weather provider unavailable');
  const weatherData = await response.json();
  return { data: { weather_data: weatherData, risk_assessment: rainfallRisk(weatherData) } };
};
export const getCycloneData = (lat, lon) => api.get('/weather/cyclone', { params: { lat, lon } });
export const getWeatherForecast = (lat, lon) => api.get('/weather/forecast', { params: { lat, lon } });

// Volcanic & Tectonic
export const getVolcanoes = (lat, lon, radiusKm = 1000, apiKey = null) => 
  api.get('/volcano/active', { params: { lat, lon, radius_km: radiusKm, api_key: apiKey || undefined } });
export const getAllVolcanoes = () => api.get('/volcano/all-volcanoes');
export const getTectonicPlatesGeoJSON = () => api.get('/volcano/plates-geojson');
export const getEarthquakes = (lat, lon, radiusKm = 500, minMag = 1.0) => 
  api.get('/volcano/earthquakes', { params: { lat, lon, radius_km: radiusKm, min_magnitude: minMag } });
export const getNearbyEarthquakes = (lat, lon, radiusKm = 500, minMag = 1.0, days = 7) =>
  api.get('/earthquake/nearby', { params: { lat, lon, radius_km: radiusKm, min_magnitude: minMag, days } });
export const getGlobalEarthquakes = (minMag = 2.5) =>
  api.get('/volcano/earthquakes', { params: { global_mode: true, min_magnitude: minMag, radius_km: 20000 } });
export const getTectonicInfo = (lat, lon) => 
  api.get('/volcano/tectonic', { params: { lat, lon } });
export const getVolcanicAnalysis = (lat, lon, apiKey = null) => 
  api.get('/volcano/analysis', { params: { lat, lon, api_key: apiKey || undefined } });
export const getVolcanicAnalytics = (lat, lon, volcanoName = null, apiKey = null) =>
  api.get('/volcano/analytics', { params: { lat, lon, volcano_name: volcanoName || undefined, api_key: apiKey || undefined } });

// Cyclones & Multi-Hazard Polygons
export const getActiveCyclones = () => api.get('/weather/active-cyclones');
export const getHazardPolygons = () => api.get('/landslide/hazard-polygons');

// Sensor Health
export const getSensorHealthStatus = () => api.get('/sensor-health/status');
export const getSensorHealthAlerts = () => api.get('/sensor-health/alerts');
export const getDataReliability = () => api.get('/sensor-health/reliability');

// Multi-Hazard Correlation Engine
export const getCorrelationAnalysis = (lat, lon) => api.get('/correlation/analyze', { params: { lat, lon } });

// Predictive Alerts
export const getPredictiveAlerts = () => api.get('/alerts/predictive');

// Historical Comparison
export const getHistoricalComparison = (lat, lon, radiusKm = 50) =>
  api.get('/history/compare', { params: { lat, lon, radius_km: radiusKm } });

// Report Generation
// Removed old LLM generateReport

// ─── Virtual Sensor Platform APIs (Phase 1-12) ───────────────────────────────
export const getVirtualSensors = () => api.get('/sensors');
export const getVirtualSensorReadings = (sensorId, hours = 24) => api.get(`/sensors/${sensorId}/readings`, { params: { hours } });
export const getRiskFusion = (locationId) => api.get(`/risk-fusion/${locationId}/current`);
export const get7DayForecast = (locationId) => api.get(`/risk-fusion/${locationId}/forecast`);
export const monitorLocation = (name, lat, lon) => api.post(`/risk-fusion/monitor`, null, { params: { name, lat, lon } });
export const createAlertsWS = () => {
  const token = localStorage.getItem('access_token');
  return new WebSocket(`ws://localhost:8000/api/alerts/ws`);
};

// Report Engine endpoints
export const getReportPresets = () => api.get('/report/presets');
export const getReportIntelligence = (locationId) => api.get(`/report/intelligence/${locationId}`);
export const generateReport = (payload) => api.post('/report/generate', payload);
export const getReportHistory = () => api.get('/report/history');
export const downloadReport = (reportId, format) => {
  const token = localStorage.getItem('access_token');
  window.open(`http://localhost:8000/api/report/${reportId}/download/${format}?token=${token}`, '_blank');
};

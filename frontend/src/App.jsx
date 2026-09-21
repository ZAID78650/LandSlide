import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/Layout/AppShell';
import { LoadingScreen } from './components/UI';
import useStore from './store/useStore';
import { getMe } from './api/client';
import lazyWithRetry from './utils/lazyWithRetry';

// Auth pages (eager)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Lazy-loaded pages with automatic retry and cache recovery across all tabs
const GlobalCommandCenter = lazyWithRetry(() => import('./pages/GlobalCommandCenter'));
const GlobeExplorer = lazyWithRetry(() => import('./pages/GlobeExplorer'));
const AlertCenter = lazyWithRetry(() => import('./pages/AlertCenter'));
const IncidentsPage = lazyWithRetry(() => import('./pages/IncidentsPage'));
const IncidentDetail = lazyWithRetry(() => import('./pages/IncidentDetail'));
const ForecastsAnalytics = lazyWithRetry(() => import('./pages/ForecastsAnalytics'));
const AICopilotPage = lazyWithRetry(() => import('./pages/AICopilotPage'));
const SystemHealthPage = lazyWithRetry(() => import('./pages/SystemHealthPage'));
const AuditPage = lazyWithRetry(() => import('./pages/AuditPage'));
const AdminPage = lazyWithRetry(() => import('./pages/AdminPage'));
const ResponseCenterPage = lazyWithRetry(() => import('./pages/ResponseCenterPage'));
const RiskIntelligencePage = lazyWithRetry(() => import('./pages/RiskIntelligencePage'));
const DatasetsPage = lazyWithRetry(() => import('./pages/DatasetsPage'));
const LocationIntelligencePage = lazyWithRetry(() => import('./pages/LocationIntelligencePage'));
const RainfallAnalysisPage = lazyWithRetry(() => import('./pages/RainfallAnalysisPage'));
const CycloneTrackerPage = lazyWithRetry(() => import('./pages/CycloneTrackerPage'));
const VolcanicTectonicPage = lazyWithRetry(() => import('./pages/VolcanicTectonicPage'));
const LandslideDetectionPage = lazyWithRetry(() => import('./pages/LandslideDetectionPage'));
const EarthquakeIntelligencePage = lazyWithRetry(() => import('./pages/EarthquakeIntelligencePage'));
const SensorPricingPage = lazyWithRetry(() => import('./pages/SensorPricingPage'));
const SimulationModePage = lazyWithRetry(() => import('./pages/SimulationModePage'));
const ReportGeneratorPage = lazyWithRetry(() => import('./pages/ReportGeneratorPage'));
const VirtualSensorPlatform = lazyWithRetry(() => import('./pages/VirtualSensorPlatform'));

import ErrorBoundary from './components/UI/ErrorBoundary';
import GlobalAlertSystem from './components/UI/GlobalAlertSystem';
import GlobalTerminalSidebar from './components/UI/GlobalTerminalSidebar';

function ProtectedRoute({ children }) {
  const { token } = useStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token, setUser, logout } = useStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (token) {
      // Safeguard: Never leave user stranded on LoadingScreen for > 2000ms
      timeoutId = setTimeout(() => {
        setBootstrapped(true);
      }, 2000);

      getMe()
        .then(r => { 
          if (r?.data) setUser(r.data); 
        })
        .catch(() => { 
          logout(); 
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setBootstrapped(true);
        });
    } else {
      setBootstrapped(true);
    }
    return () => clearTimeout(timeoutId);
  }, []);

  if (!bootstrapped) return <LoadingScreen />;

  return (
    <>
    <GlobalAlertSystem />
    <GlobalTerminalSidebar />
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected app routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/globe" replace />} />
            <Route path="globe" element={<GlobeExplorer />} />
            <Route path="command-center" element={<GlobalCommandCenter />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="risk" element={<RiskIntelligencePage />} />
            <Route path="forecasts" element={<ForecastsAnalytics />} />
            <Route path="ai-copilot" element={<AICopilotPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="response" element={<ResponseCenterPage />} />
            <Route path="location" element={<LocationIntelligencePage />} />
            <Route path="rainfall" element={<RainfallAnalysisPage />} />
            <Route path="cyclone" element={<CycloneTrackerPage />} />
            <Route path="volcanic" element={<VolcanicTectonicPage />} />
            <Route path="landslide" element={<LandslideDetectionPage />} />
            <Route path="earthquake" element={<EarthquakeIntelligencePage />} />
            <Route path="sensor-pricing" element={<SensorPricingPage />} />
            <Route path="simulation" element={<SimulationModePage />} />
            <Route path="reports" element={<ReportGeneratorPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="system" element={<SystemHealthPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="virtual-sensors" element={<VirtualSensorPlatform />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/globe" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  </BrowserRouter>
    </>
);
}

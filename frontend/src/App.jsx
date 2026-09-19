import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/Layout/AppShell';
import { LoadingScreen } from './components/UI';
import useStore from './store/useStore';
import { getMe } from './api/client';

// Auth pages (eager)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Lazy-loaded pages for instant startup and zero bundle blocking
const GlobalCommandCenter = lazy(() => import('./pages/GlobalCommandCenter'));
const GlobeExplorer = lazy(() => import('./pages/GlobeExplorer'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const AlertCenter = lazy(() => import('./pages/AlertCenter'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const ForecastsAnalytics = lazy(() => import('./pages/ForecastsAnalytics'));
const AICopilotPage = lazy(() => import('./pages/AICopilotPage'));
const ModelOpsPage = lazy(() => import('./pages/ModelOpsPage'));
const DataSourcesPage = lazy(() => import('./pages/DataSourcesPage'));
const SystemHealthPage = lazy(() => import('./pages/SystemHealthPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ResponseCenterPage = lazy(() => import('./pages/ResponseCenterPage'));
const RiskIntelligencePage = lazy(() => import('./pages/RiskIntelligencePage'));
const DatasetsPage = lazy(() => import('./pages/DatasetsPage'));
const LocationIntelligencePage = lazy(() => import('./pages/LocationIntelligencePage'));
const RainfallAnalysisPage = lazy(() => import('./pages/RainfallAnalysisPage'));
const CycloneTrackerPage = lazy(() => import('./pages/CycloneTrackerPage'));
const VolcanicTectonicPage = lazy(() => import('./pages/VolcanicTectonicPage'));
const LandslideDetectionPage = lazy(() => import('./pages/LandslideDetectionPage'));
const EarthquakeIntelligencePage = lazy(() => import('./pages/EarthquakeIntelligencePage'));
const SensorPricingPage = lazy(() => import('./pages/SensorPricingPage'));
const SimulationModePage = lazy(() => import('./pages/SimulationModePage'));
const ReportGeneratorPage = lazy(() => import('./pages/ReportGeneratorPage'));
const VirtualSensorPlatform = lazy(() => import('./pages/VirtualSensorPlatform'));

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
            <Route path="dashboard" element={<CommandCenter />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="risk" element={<RiskIntelligencePage />} />
            <Route path="forecasts" element={<ForecastsAnalytics />} />
            <Route path="ai-copilot" element={<AICopilotPage />} />
            <Route path="models" element={<ModelOpsPage />} />
            <Route path="data-sources" element={<DataSourcesPage />} />
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  </BrowserRouter>
    </>
);
}

// I need to replace the router in App.jsx to point / to /login and /dashboard to CommandCenter.

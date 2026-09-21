import 'cesium/Build/Cesium/Widgets/widgets.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

// Automatically catch Vite dynamic import preload failures across all tabs (e.g. after fresh build)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[NEXUS-LAND] Vite preload error detected. Auto-reloading to load current assets...', event);
  const lastReload = sessionStorage.getItem('nexus_last_chunk_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
    sessionStorage.setItem('nexus_last_chunk_reload', now.toString());
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || (typeof event?.reason === 'string' ? event.reason : '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('dynamically imported module')
  ) {
    const lastReload = sessionStorage.getItem('nexus_last_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
      sessionStorage.setItem('nexus_last_chunk_reload', now.toString());
      console.warn('[NEXUS-LAND] Unhandled chunk load rejection caught. Auto-reloading page...');
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "mock-client-id"}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

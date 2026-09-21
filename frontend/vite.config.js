import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cesium({ rebuildCesium: false }),
  ],
  server: {
    hmr: false,
    host: 'localhost',
    port: 5173,
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  },
  build: {
    emptyOutDir: false,
  },
  // Disable dep pre-bundling entirely — this app uses large ESM packages
  // (Cesium, Three.js, globe.gl) that cause Vite's optimizer to hang/OOM.
  // noDiscovery + empty include is the Vite 5+ way to disable optimization.
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
});




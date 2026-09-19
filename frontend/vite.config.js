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
    // Disabling HMR skips the React Fast Refresh preamble guard that was
    // crashing the app (blank page) due to a race condition with vite-plugin-cesium
    hmr: false,
  },
  optimizeDeps: {
    include: ['cesium'],
  },
});



